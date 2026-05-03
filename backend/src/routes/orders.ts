import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { authenticate, checkCapability } from '../middleware/auth';
import Order from '../models/Order';
import Stage from '../models/Stage';
import { parseListQuery, envelope } from '../lib/list-query';

const router = Router();
router.use(authenticate);

const includeStage = { model: Stage, as: 'stage' as const };

async function nextStageId(currentId: number): Promise<number | null> {
  const current = await Stage.findByPk(currentId);
  if (!current) return null;

  const firstChild = await Stage.findOne({
    where: { parent_id: current.id },
    order: [['sort_order', 'ASC']],
  });
  if (firstChild) return firstChild.id;

  let cursor: Stage | null = current;
  while (cursor) {
    const nextSibling = await Stage.findOne({
      where: {
        parent_id: cursor.parent_id,
        sort_order: { [Op.gt]: cursor.sort_order },
      },
      order: [['sort_order', 'ASC']],
    });
    if (nextSibling) return nextSibling.id;
    cursor = cursor.parent_id ? await Stage.findByPk(cursor.parent_id) : null;
  }
  return null;
}

let initialStageCache: number | null = null;
export const invalidateInitialStageCache = () => {
  initialStageCache = null;
};
async function getInitialStageId(): Promise<number> {
  if (initialStageCache !== null) return initialStageCache;
  const stage = await Stage.findOne({ where: { is_initial: true } });
  if (!stage) throw new Error('No initial stage configured');
  initialStageCache = stage.id;
  return stage.id;
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const { capabilities, userId } = req.user!;
    const sees_all = capabilities.includes('*') || capabilities.includes('orders.read');

    const list = parseListQuery(req, {
      sortable: ['id', 'created_at', 'updated_at', 'total_amount', 'stage_id'],
      filterable: ['stage_id', 'assigned_to'],
      defaultSort: 'created_at',
      defaultOrder: 'DESC',
    });

    const where: any = sees_all ? { ...list.where } : { ...list.where, assigned_to: userId };

    if (list.q) {
      where[Op.and as any] = [
        ...(Array.isArray(where[Op.and as any]) ? where[Op.and as any] : []),
        {
          [Op.or]: [
            { client_name: { [Op.like]: `%${list.q}%` } },
            { client_email: { [Op.like]: `%${list.q}%` } },
            { address: { [Op.like]: `%${list.q}%` } },
          ],
        },
      ];
    }

    const orderClause = Array.isArray(list.order) && list.order.length > 0
      ? list.order
      : ([['created_at', 'DESC']] as const);

    if (list.paginated) {
      const { rows, count } = await Order.findAndCountAll({
        where,
        include: [includeStage],
        order: orderClause as any,
        limit: list.limit,
        offset: list.offset,
      });
      return res.json(envelope(rows, count, list.page, list.limit));
    }

    const orders = await Order.findAll({
      where,
      include: [includeStage],
      order: orderClause as any,
    });
    return res.json({ orders });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/', checkCapability('orders.create'), async (req: Request, res: Response) => {
  try {
    const { client_name, client_email, client_phone, address, notes, assigned_to } = req.body;
    const stage_id = await getInitialStageId();
    const initialStage = await Stage.findByPk(stage_id);

    const order = await Order.create({
      client_name,
      client_email,
      client_phone,
      address,
      notes,
      assigned_to,
      stage_id,
      status: (initialStage?.code.toUpperCase() ?? 'ESTIMATE') as any,
      qr_token: uuidv4(),
    });
    const fresh = await Order.findByPk(order.id, { include: [includeStage] });
    return res.status(201).json({ order: fresh });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Resolve a scanned QR token to its order id. Used by the mobile scanner.
router.get('/by-qr/:token', async (req: Request, res: Response) => {
  try {
    const order = await Order.findOne({
      where: { qr_token: req.params.token },
      attributes: ['id', 'client_name'],
    });
    if (!order) return res.status(404).json({ message: 'Order not found', code: 'INVALID_QR' });
    return res.json({ order_id: order.id, client_name: order.client_name });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PNG of the QR encoding the token. `?download=1` adds Content-Disposition so
// browsers save instead of inlining.
router.get('/:id/qr.png', async (req: Request, res: Response) => {
  try {
    const order = await Order.findByPk(req.params.id, { attributes: ['id', 'qr_token'] });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const png = await QRCode.toBuffer(order.qr_token, {
      type: 'png',
      width: 512,
      margin: 1,
      errorCorrectionLevel: 'M',
    });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    if (req.query.download) {
      res.setHeader('Content-Disposition', `attachment; filename="order-${order.id}.png"`);
    }
    return res.send(png);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const order = await Order.findByPk(req.params.id, { include: [includeStage] });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    return res.json({ order });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.patch('/:id/stage', checkCapability('orders.advance_stage'), async (req: Request, res: Response) => {
  try {
    const order = await Order.findByPk(req.params.id, { include: [includeStage] });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const current = order.stage;
    if (!current) return res.status(500).json({ message: 'Order has no stage' });
    if (current.is_terminal) {
      return res.status(400).json({ message: 'Order is already at the final stage', code: 'AT_TERMINAL' });
    }

    const next_id = await nextStageId(current.id);
    if (next_id === null) {
      return res.status(500).json({ message: 'No next stage in workflow', code: 'WORKFLOW_BROKEN' });
    }

    const nextStage = await Stage.findByPk(next_id);
    await order.update({
      stage_id: next_id,
      status: (nextStage?.code.toUpperCase() ?? order.status) as any,
    });
    const fresh = await Order.findByPk(order.id, { include: [includeStage] });
    return res.json({ order: fresh, advanced_to: nextStage?.code });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export const publicOrderRouter = Router();
publicOrderRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      attributes: ['id', 'client_name', 'created_at', 'updated_at'],
      include: [includeStage],
    });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const allStages = await Stage.findAll({ order: [['sort_order', 'ASC']] });
    return res.json({ order, stages: allStages });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;

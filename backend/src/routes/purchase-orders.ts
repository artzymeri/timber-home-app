import { Router, Request, Response } from 'express';
import { authenticate, checkCapability } from '../middleware/auth';
import sequelize from '../config/database';

const router = Router();
router.use(authenticate);

const SORT_MAP: Record<string, string> = {
  id: 'po.id',
  created_at: 'po.created_at',
  status: 'po.status',
  total_cost: 'po.total_cost',
  quantity: 'po.quantity',
};

router.get('/', async (req: Request, res: Response) => {
  try {
    const hasPage = req.query.page !== undefined || req.query.limit !== undefined;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const offset = (page - 1) * limit;

    const sortRaw = typeof req.query.sort === 'string' ? req.query.sort : 'created_at';
    const sort = SORT_MAP[sortRaw] || 'po.created_at';
    const order = (req.query.order === 'asc' || req.query.order === 'ASC') ? 'ASC' : 'DESC';

    const filterObj = (req.query.filter && typeof req.query.filter === 'object' && !Array.isArray(req.query.filter)
      ? (req.query.filter as Record<string, string>)
      : {}) as Record<string, string>;
    const where: string[] = [];
    const replacements: any[] = [];
    if (filterObj.status) {
      where.push(`po.status = ?`);
      replacements.push(filterObj.status);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const baseSelect = `
      SELECT po.*, i.name as item_name, i.unit, u.name as approved_by_name
      FROM purchase_orders po
      JOIN inventory i ON po.inventory_id = i.id
      LEFT JOIN users u ON po.approved_by = u.id
    `;

    if (hasPage) {
      const [rows]: any = await sequelize.query(
        `${baseSelect} ${whereSql} ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`,
        { replacements: [...replacements, limit, offset] }
      );
      const [countRows]: any = await sequelize.query(
        `SELECT COUNT(*) AS total FROM purchase_orders po ${whereSql}`,
        { replacements }
      );
      return res.json({ rows, total: Number(countRows[0]?.total || 0), page, limit });
    }

    const [orders]: any = await sequelize.query(
      `${baseSelect} ${whereSql} ORDER BY ${sort} ${order}`,
      { replacements }
    );
    return res.json({ orders });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/auto-generate', checkCapability('purchase_orders.approve'), async (_req: Request, res: Response) => {
  try {
    const [lowStock]: any = await sequelize.query(
      `SELECT * FROM inventory WHERE quantity <= reorder_level`
    );
    let created = 0;
    for (const item of lowStock) {
      const [existing]: any = await sequelize.query(
        `SELECT id FROM purchase_orders WHERE inventory_id = ? AND status IN ('suggested', 'pending_approval', 'approved', 'ordered')`,
        { replacements: [item.id] }
      );
      if (existing.length === 0) {
        const reorderQty = item.reorder_level * 2;
        await sequelize.query(
          `INSERT INTO purchase_orders (inventory_id, quantity, unit_cost, total_cost, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'suggested', NOW(), NOW())`,
          { replacements: [item.id, reorderQty, item.cost_per_unit || 0, reorderQty * (item.cost_per_unit || 0)] }
        );
        created++;
      }
    }
    return res.json({ message: `Generated ${created} purchase order suggestions`, created });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.patch('/:id/approve', checkCapability('purchase_orders.approve'), async (req: Request, res: Response) => {
  try {
    await sequelize.query(
      `UPDATE purchase_orders SET status = 'approved', approved_by = ?, updated_at = NOW() WHERE id = ?`,
      { replacements: [req.user!.userId, req.params.id] }
    );
    return res.json({ message: 'Purchase order approved' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.patch('/:id/receive', checkCapability('purchase_orders.approve'), async (req: Request, res: Response) => {
  try {
    const [orders]: any = await sequelize.query(`SELECT * FROM purchase_orders WHERE id = ?`, { replacements: [req.params.id] });
    if (!orders.length) return res.status(404).json({ message: 'Not found' });
    const po = orders[0];

    await sequelize.query(`UPDATE purchase_orders SET status = 'received', updated_at = NOW() WHERE id = ?`, { replacements: [req.params.id] });
    await sequelize.query(`UPDATE inventory SET quantity = quantity + ?, updated_at = NOW() WHERE id = ?`, { replacements: [po.quantity, po.inventory_id] });

    return res.json({ message: 'Stock received and inventory updated' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;

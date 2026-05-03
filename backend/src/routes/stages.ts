import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import Stage from '../models/Stage';
import Order from '../models/Order';
import sequelize from '../config/database';
import { authenticate, checkCapability } from '../middleware/auth';
import { invalidateInitialStageCache } from './orders';

const router = Router();
router.use(authenticate);

const VALID_COLORS = ['stone', 'amber', 'blue', 'emerald', 'violet', 'rose'];

const slugify = (input: string): string =>
  input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64) || 'stage';

const serializeStage = (s: Stage, userCount?: number) => ({
  id: s.id,
  code: s.code,
  label_key: s.label_key,
  name: s.name,
  description: s.description,
  parent_id: s.parent_id,
  sort_order: s.sort_order,
  icon: s.icon,
  color: s.color,
  is_initial: s.is_initial,
  is_terminal: s.is_terminal,
  is_system: s.is_system,
  order_count: userCount,
});

interface StageNode extends ReturnType<typeof serializeStage> {
  children: StageNode[];
}

const buildTree = (rows: Stage[], orderCounts: Record<number, number>): StageNode[] => {
  const all = rows.map((r) => ({
    ...serializeStage(r, orderCounts[r.id] || 0),
    children: [] as StageNode[],
  }));
  const byId = new Map<number, StageNode>(all.map((s) => [s.id, s]));
  const roots: StageNode[] = [];
  for (const node of all) {
    if (node.parent_id && byId.has(node.parent_id)) {
      byId.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const sortRecursive = (nodes: StageNode[]) => {
    nodes.sort((a, b) => a.sort_order - b.sort_order);
    nodes.forEach((n) => sortRecursive(n.children));
  };
  sortRecursive(roots);
  return roots;
};

// GET — readable by anyone authenticated; the UI relies on this for kanban columns.
router.get('/', async (_req: Request, res: Response) => {
  try {
    const rows = await Stage.findAll({ order: [['sort_order', 'ASC']] });
    const counts = (await Order.findAll({
      attributes: ['stage_id', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['stage_id'],
      raw: true,
    })) as unknown as Array<{ stage_id: number; count: string }>;
    const orderCounts = Object.fromEntries(counts.map((c) => [c.stage_id, Number(c.count)]));
    const tree = buildTree(rows, orderCounts);
    const flat = rows.map((r) => serializeStage(r, orderCounts[r.id] || 0));
    return res.json({ tree, stages: flat });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const stage = await Stage.findByPk(req.params.id);
    if (!stage) return res.status(404).json({ message: 'Stage not found' });
    const orderCount = await Order.count({ where: { stage_id: stage.id } });
    return res.json({ stage: serializeStage(stage, orderCount) });
  } catch {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.use(checkCapability('stages.manage'));

interface StagePayload {
  name: string;
  code?: string;
  description?: string | null;
  parent_id?: number | null;
  icon?: string;
  color?: string;
  is_initial?: boolean;
  is_terminal?: boolean;
  sort_order?: number;
}

const validate = (body: any): { error?: string; data?: StagePayload } => {
  const name = String(body?.name || '').trim();
  if (!name) return { error: 'name is required' };
  if (name.length > 80) return { error: 'name must be 80 characters or less' };

  const code = body?.code ? slugify(String(body.code)) : slugify(name);
  const description = body?.description ? String(body.description).slice(0, 255) : null;
  const parent_id = body?.parent_id ? Number(body.parent_id) : null;
  const icon = String(body?.icon || 'Circle');
  const color = String(body?.color || 'stone');
  if (!VALID_COLORS.includes(color)) return { error: `color must be one of ${VALID_COLORS.join(', ')}` };
  const is_initial = !!body?.is_initial;
  const is_terminal = !!body?.is_terminal;
  if (is_initial && is_terminal) return { error: 'A stage cannot be both initial and terminal' };

  return {
    data: {
      name,
      code,
      description,
      parent_id,
      icon,
      color,
      is_initial,
      is_terminal,
      sort_order: typeof body?.sort_order === 'number' ? body.sort_order : 0,
    },
  };
};

// Walk up from `proposedParentId` to detect a cycle when `selfId` re-parents.
async function wouldCreateCycle(selfId: number, proposedParentId: number | null): Promise<boolean> {
  let cursor = proposedParentId;
  const visited = new Set<number>();
  while (cursor) {
    if (cursor === selfId) return true;
    if (visited.has(cursor)) return true;
    visited.add(cursor);
    const parent = await Stage.findByPk(cursor);
    cursor = parent?.parent_id ?? null;
  }
  return false;
}

router.post('/', async (req: Request, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const { error, data } = validate(req.body);
    if (error) {
      await t.rollback();
      return res.status(400).json({ message: error });
    }

    const dupe = await Stage.findOne({ where: { code: data!.code! }, transaction: t });
    if (dupe) {
      await t.rollback();
      return res.status(409).json({ message: 'Stage code already exists' });
    }

    if (data!.parent_id) {
      const parent = await Stage.findByPk(data!.parent_id, { transaction: t });
      if (!parent) {
        await t.rollback();
        return res.status(400).json({ message: 'Parent stage not found' });
      }
      if (parent.is_terminal) {
        await t.rollback();
        return res.status(400).json({ message: 'Cannot nest under a terminal stage' });
      }
    }

    if (data!.is_initial) {
      await Stage.update({ is_initial: false }, { where: {}, transaction: t });
    }

    const stage = await Stage.create({ ...(data as any), is_system: false }, { transaction: t });
    await t.commit();
    invalidateInitialStageCache();
    return res.status(201).json({ stage: serializeStage(stage, 0) });
  } catch (err) {
    await t.rollback();
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const stage = await Stage.findByPk(req.params.id, { transaction: t });
    if (!stage) {
      await t.rollback();
      return res.status(404).json({ message: 'Stage not found' });
    }

    const { error, data } = validate(req.body);
    if (error) {
      await t.rollback();
      return res.status(400).json({ message: error });
    }

    // System stages: only icon, color, description, sort_order are mutable.
    if (stage.is_system) {
      await stage.update(
        {
          icon: data!.icon!,
          color: data!.color! as any,
          description: data!.description ?? null,
          sort_order: data!.sort_order ?? stage.sort_order,
        },
        { transaction: t }
      );
      await t.commit();
      const orderCount = await Order.count({ where: { stage_id: stage.id } });
      return res.json({ stage: serializeStage(stage, orderCount) });
    }

    if (data!.code !== stage.code) {
      const dupe = await Stage.findOne({ where: { code: data!.code!, id: { [Op.ne]: stage.id } }, transaction: t });
      if (dupe) {
        await t.rollback();
        return res.status(409).json({ message: 'Stage code already exists' });
      }
    }

    if (data!.parent_id !== stage.parent_id) {
      if (data!.parent_id) {
        if (await wouldCreateCycle(stage.id, data!.parent_id)) {
          await t.rollback();
          return res.status(400).json({ message: 'Cannot set a descendant as parent' });
        }
        const parent = await Stage.findByPk(data!.parent_id, { transaction: t });
        if (!parent || parent.is_terminal) {
          await t.rollback();
          return res.status(400).json({ message: 'Invalid parent stage' });
        }
      }
    }

    if (data!.is_initial && !stage.is_initial) {
      await Stage.update({ is_initial: false }, { where: { id: { [Op.ne]: stage.id } }, transaction: t });
    }

    await stage.update(data as any, { transaction: t });
    await t.commit();
    invalidateInitialStageCache();
    const orderCount = await Order.count({ where: { stage_id: stage.id } });
    return res.json({ stage: serializeStage(stage, orderCount) });
  } catch (err) {
    await t.rollback();
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const stage = await Stage.findByPk(req.params.id);
    if (!stage) return res.status(404).json({ message: 'Stage not found' });
    if (stage.is_system) return res.status(400).json({ message: 'System stages cannot be deleted' });

    const orderCount = await Order.count({ where: { stage_id: stage.id } });
    if (orderCount > 0) {
      return res.status(400).json({ message: 'Move orders out of this stage before deleting it', code: 'HAS_ORDERS' });
    }

    const childCount = await Stage.count({ where: { parent_id: stage.id } });
    if (childCount > 0) {
      return res.status(400).json({ message: 'Move or delete child stages first', code: 'HAS_CHILDREN' });
    }

    await stage.destroy();
    invalidateInitialStageCache();
    return res.json({ message: 'Stage deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/reorder', async (req: Request, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const { parent_id, ordered_ids } = req.body || {};
    if (!Array.isArray(ordered_ids)) {
      await t.rollback();
      return res.status(400).json({ message: 'ordered_ids array is required' });
    }
    const targetParent = parent_id ? Number(parent_id) : null;

    // Verify all ids belong to the same parent.
    const stages = await Stage.findAll({ where: { id: ordered_ids as number[] }, transaction: t });
    if (stages.length !== ordered_ids.length) {
      await t.rollback();
      return res.status(400).json({ message: 'Unknown stage id in ordered_ids' });
    }
    for (const s of stages) {
      if ((s.parent_id || null) !== targetParent) {
        await t.rollback();
        return res.status(400).json({ message: 'All stages must share the target parent_id' });
      }
    }

    for (let i = 0; i < ordered_ids.length; i++) {
      await Stage.update(
        { sort_order: (i + 1) * 10 },
        { where: { id: ordered_ids[i] }, transaction: t }
      );
    }
    await t.commit();
    return res.json({ message: 'Reordered' });
  } catch (err) {
    await t.rollback();
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;

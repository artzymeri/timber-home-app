import { Router, Request, Response } from 'express';
import { authenticate, checkCapability } from '../middleware/auth';
import sequelize from '../config/database';

const router = Router();
router.use(authenticate);

const SORTABLE = ['id', 'name', 'category', 'quantity', 'reorder_level', 'cost_per_unit'];
const ORDER_DIRS = new Set(['ASC', 'DESC']);

router.get('/', async (req: Request, res: Response) => {
  try {
    const hasPage = req.query.page !== undefined || req.query.limit !== undefined;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const offset = (page - 1) * limit;

    const sortRaw = typeof req.query.sort === 'string' ? req.query.sort : '';
    const sort = SORTABLE.includes(sortRaw) ? sortRaw : 'name';
    const orderRaw = typeof req.query.order === 'string' ? req.query.order.toUpperCase() : 'ASC';
    const order = ORDER_DIRS.has(orderRaw) ? orderRaw : 'ASC';

    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const filterObj = (req.query.filter && typeof req.query.filter === 'object' && !Array.isArray(req.query.filter)
      ? (req.query.filter as Record<string, string>)
      : {}) as Record<string, string>;
    const lowStockOnly = filterObj.low_stock === 'true';

    const where: string[] = [];
    const replacements: any[] = [];
    if (q) {
      where.push(`(name LIKE ? OR category LIKE ?)`);
      replacements.push(`%${q}%`, `%${q}%`);
    }
    if (lowStockOnly) {
      where.push(`quantity <= reorder_level`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    if (hasPage) {
      const [rows]: any = await sequelize.query(
        `SELECT * FROM inventory ${whereSql} ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`,
        { replacements: [...replacements, limit, offset] }
      );
      const [countRows]: any = await sequelize.query(
        `SELECT COUNT(*) AS total FROM inventory ${whereSql}`,
        { replacements }
      );
      return res.json({ rows, total: Number(countRows[0]?.total || 0), page, limit });
    }

    const [results]: any = await sequelize.query(
      `SELECT * FROM inventory ${whereSql} ORDER BY ${sort} ${order}`,
      { replacements }
    );
    return res.json({ inventory: results });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/inventory - Create new inventory item
router.post('/', checkCapability('inventory.consume'), async (req: Request, res: Response) => {
  try {
    const { name, category, unit, quantity, reorder_level, cost_per_unit } = req.body || {};
    if (!name || !category) {
      return res.status(400).json({ message: 'name and category are required' });
    }
    await sequelize.query(
      `INSERT INTO inventory (name, category, unit, quantity, reorder_level, cost_per_unit, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      {
        replacements: [
          String(name).trim(),
          String(category).trim(),
          unit || 'pcs',
          Number(quantity) || 0,
          Number(reorder_level) || 10,
          cost_per_unit !== undefined && cost_per_unit !== null && cost_per_unit !== ''
            ? Number(cost_per_unit)
            : null,
        ],
      }
    );
    return res.status(201).json({ message: 'Item created' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.patch('/:id/consume', checkCapability('inventory.consume'), async (req: Request, res: Response) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity <= 0) return res.status(400).json({ message: 'Invalid quantity' });

    const [items]: any = await sequelize.query('SELECT * FROM inventory WHERE id = ?', {
      replacements: [req.params.id],
    });
    if (!items.length) return res.status(404).json({ message: 'Item not found' });

    const item = items[0];
    const newQty = Math.max(0, Number(item.quantity) - quantity);
    await sequelize.query('UPDATE inventory SET quantity = ? WHERE id = ?', {
      replacements: [newQty, req.params.id],
    });

    return res.json({ id: item.id, name: item.name, previous: item.quantity, new_quantity: newQty });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;

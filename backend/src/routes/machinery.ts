import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import sequelize from '../config/database';

const router = Router();
router.use(authenticate);

const STATUSES = new Set(['operational', 'idle', 'maintenance', 'error']);

// GET /api/machinery — list with optional pagination, search, status filter.
router.get('/', async (req: Request, res: Response) => {
  try {
    const hasPage = req.query.page !== undefined || req.query.limit !== undefined;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const offset = (page - 1) * limit;

    const where: string[] = ['1 = 1'];
    const replacements: any[] = [];

    const filter = (req.query.filter && typeof req.query.filter === 'object' && !Array.isArray(req.query.filter)
      ? (req.query.filter as Record<string, string>)
      : {}) as Record<string, string>;
    if (filter.status && STATUSES.has(filter.status)) {
      where.push('status = ?');
      replacements.push(filter.status);
    }

    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (q) {
      where.push('(name LIKE ? OR type LIKE ? OR serial_number LIKE ?)');
      replacements.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    const whereSql = `WHERE ${where.join(' AND ')}`;

    const sortMap: Record<string, string> = {
      name: 'name',
      status: 'status',
      type: 'type',
      created_at: 'created_at',
    };
    const sort = sortMap[String(req.query.sort || '')] || 'name';
    const order = req.query.order === 'desc' || req.query.order === 'DESC' ? 'DESC' : 'ASC';

    if (hasPage) {
      const [rows]: any = await sequelize.query(
        `SELECT * FROM machinery ${whereSql} ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`,
        { replacements: [...replacements, limit, offset] }
      );
      const [countRows]: any = await sequelize.query(
        `SELECT COUNT(*) AS total FROM machinery ${whereSql}`,
        { replacements }
      );
      return res.json({ rows, total: Number(countRows[0]?.total || 0), page, limit });
    }

    const [machinery]: any = await sequelize.query(
      `SELECT * FROM machinery ${whereSql} ORDER BY ${sort} ${order}`,
      { replacements }
    );
    return res.json({ machinery });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/machinery/error-count — sidebar badge + dashboard alert payload.
router.get('/error-count', async (_req: Request, res: Response) => {
  try {
    const [rows]: any = await sequelize.query(
      `SELECT id, name FROM machinery WHERE status = 'error' ORDER BY name`
    );
    return res.json({ count: rows.length, machines: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;

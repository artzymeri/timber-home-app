import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import sequelize from '../config/database';

const router = Router();
router.use(authenticate);

// GET /api/notifications
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const hasPage = req.query.page !== undefined || req.query.limit !== undefined;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const offset = (page - 1) * limit;

    const filterObj = (req.query.filter && typeof req.query.filter === 'object' && !Array.isArray(req.query.filter)
      ? (req.query.filter as Record<string, string>)
      : {}) as Record<string, string>;
    const where: string[] = [`user_id = ?`];
    const replacements: any[] = [userId];
    if (filterObj.type) {
      where.push(`type = ?`);
      replacements.push(filterObj.type);
    }
    if (filterObj.read === 'true' || filterObj.read === 'false') {
      where.push(`\`read\` = ?`);
      replacements.push(filterObj.read === 'true' ? 1 : 0);
    }
    const whereSql = `WHERE ${where.join(' AND ')}`;
    const order = (req.query.order === 'asc' || req.query.order === 'ASC') ? 'ASC' : 'DESC';

    if (hasPage) {
      const [rows]: any = await sequelize.query(
        `SELECT * FROM notifications ${whereSql} ORDER BY created_at ${order} LIMIT ? OFFSET ?`,
        { replacements: [...replacements, limit, offset] }
      );
      const [countRows]: any = await sequelize.query(
        `SELECT COUNT(*) AS total FROM notifications ${whereSql}`,
        { replacements }
      );
      return res.json({ rows, total: Number(countRows[0]?.total || 0), page, limit });
    }

    const [notifications]: any = await sequelize.query(
      `SELECT * FROM notifications ${whereSql} ORDER BY created_at ${order} LIMIT 50`,
      { replacements }
    );
    return res.json({ notifications });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req: Request, res: Response) => {
  try {
    await sequelize.query(`UPDATE notifications SET \`read\` = true WHERE id = ? AND user_id = ?`, {
      replacements: [req.params.id, req.user!.userId],
    });
    return res.json({ message: 'Marked as read' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', async (req: Request, res: Response) => {
  try {
    await sequelize.query(`UPDATE notifications SET \`read\` = true WHERE user_id = ?`, {
      replacements: [req.user!.userId],
    });
    return res.json({ message: 'All marked as read' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;

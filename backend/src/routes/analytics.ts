import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import sequelize from '../config/database';

const router = Router();
router.use(authenticate);

// GET /api/analytics/sales
router.get('/sales', async (_req: Request, res: Response) => {
  try {
    const [monthly]: any = await sequelize.query(`
      SELECT DATE_FORMAT(o.created_at, '%Y-%m') as month,
             COUNT(*) as order_count,
             COALESCE(SUM(o.total_amount), 0) as revenue
      FROM orders o
      JOIN stages s ON s.id = o.stage_id
      WHERE s.is_initial = 0
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `);
    const [byStatus]: any = await sequelize.query(`
      SELECT s.code as status, s.name, COUNT(o.id) as count
      FROM stages s
      LEFT JOIN orders o ON o.stage_id = s.id
      GROUP BY s.id
      ORDER BY s.sort_order
    `);
    return res.json({ monthly, byStatus });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/analytics/production
router.get('/production', async (_req: Request, res: Response) => {
  try {
    const [stageDistribution]: any = await sequelize.query(`
      SELECT s.code as status, s.name, s.label_key, s.color, s.icon, COUNT(o.id) as count
      FROM stages s
      LEFT JOIN orders o ON o.stage_id = s.id
      WHERE s.is_terminal = 0
      GROUP BY s.id
      ORDER BY s.sort_order
    `);
    const [completedThisMonth]: any = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM orders o
      JOIN stages s ON s.id = o.stage_id
      WHERE s.is_terminal = 1
        AND MONTH(o.updated_at) = MONTH(NOW())
        AND YEAR(o.updated_at) = YEAR(NOW())
    `);
    return res.json({ stageDistribution, completedThisMonth: completedThisMonth[0]?.count || 0 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/analytics/inventory
router.get('/inventory', async (_req: Request, res: Response) => {
  try {
    const [lowStock]: any = await sequelize.query(`
      SELECT * FROM inventory WHERE quantity <= reorder_level ORDER BY (quantity / reorder_level) ASC
    `);
    const [totalValue]: any = await sequelize.query(`
      SELECT COALESCE(SUM(quantity * cost_per_unit), 0) as total_value FROM inventory
    `);
    return res.json({ lowStock, totalValue: totalValue[0]?.total_value || 0 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;

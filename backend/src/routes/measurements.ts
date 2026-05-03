import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import sequelize from '../config/database';

const router = Router();
router.use(authenticate);

// GET /api/measurements/:orderId
router.get('/:orderId', async (req: Request, res: Response) => {
  try {
    const [records]: any = await sequelize.query(
      `SELECT * FROM measurements WHERE order_id = ? ORDER BY created_at DESC`,
      { replacements: [req.params.orderId] }
    );
    return res.json({ measurements: records });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/measurements
router.post('/', async (req: Request, res: Response) => {
  try {
    const { order_id, room_name, dimensions, notes, photos } = req.body;
    const userId = req.user!.userId;
    await sequelize.query(
      `INSERT INTO measurements (order_id, recorded_by, room_name, dimensions, notes, photos, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      { replacements: [order_id, userId, room_name, JSON.stringify(dimensions), notes, JSON.stringify(photos || [])] }
    );
    return res.status(201).json({ message: 'Measurement saved' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;

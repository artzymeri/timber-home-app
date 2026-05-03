import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import sequelize from '../config/database';

const router = Router();

// POST /api/signatures - Save a signature (can be called from client portal without auth)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { order_id, type, signer_name, signature_data } = req.body;
    if (!order_id || !type || !signer_name || !signature_data) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    await sequelize.query(
      `INSERT INTO signatures (order_id, type, signer_name, signature_data, signed_at, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW(), NOW())`,
      { replacements: [order_id, type, signer_name, signature_data] }
    );
    return res.status(201).json({ message: 'Signature saved' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/signatures/:orderId
router.get('/:orderId', authenticate, async (req: Request, res: Response) => {
  try {
    const [signatures]: any = await sequelize.query(
      `SELECT id, order_id, type, signer_name, signed_at FROM signatures WHERE order_id = ? ORDER BY signed_at DESC`,
      { replacements: [req.params.orderId] }
    );
    return res.json({ signatures });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;

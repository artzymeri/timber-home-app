import { Router, Request, Response } from 'express';
import { authenticate, checkCapability } from '../middleware/auth';
import sequelize from '../config/database';

const router = Router();
router.use(authenticate);

// GET /api/bom/:orderId
router.get('/:orderId', async (req: Request, res: Response) => {
  try {
    const [items]: any = await sequelize.query(
      `SELECT b.*, i.name as inventory_name, i.quantity as stock_available FROM bom_items b LEFT JOIN inventory i ON b.inventory_id = i.id WHERE b.order_id = ? ORDER BY b.id ASC`,
      { replacements: [req.params.orderId] }
    );
    return res.json({ items });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/bom - Add BOM item
router.post('/', checkCapability('bom.manage'), async (req: Request, res: Response) => {
  try {
    const { order_id, inventory_id, material_name, quantity, unit, unit_cost } = req.body;
    const total_cost = quantity * (unit_cost || 0);

    await sequelize.query(
      `INSERT INTO bom_items (order_id, inventory_id, material_name, quantity, unit, unit_cost, total_cost, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      { replacements: [order_id, inventory_id || null, material_name, quantity, unit || 'pcs', unit_cost || 0, total_cost] }
    );
    return res.status(201).json({ message: 'BOM item added' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/bom/:id
router.delete('/:id', checkCapability('bom.manage'), async (req: Request, res: Response) => {
  try {
    await sequelize.query(`DELETE FROM bom_items WHERE id = ?`, { replacements: [req.params.id] });
    return res.json({ message: 'BOM item deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;

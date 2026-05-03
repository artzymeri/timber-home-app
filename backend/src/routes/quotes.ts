import { Router, Request, Response } from 'express';
import { authenticate, checkCapability } from '../middleware/auth';
import sequelize from '../config/database';

const router = Router();
router.use(authenticate);

// GET /api/quotes/:orderId
router.get('/:orderId', async (req: Request, res: Response) => {
  try {
    const [quotes]: any = await sequelize.query(
      `SELECT * FROM quotes WHERE order_id = ? ORDER BY created_at DESC`,
      { replacements: [req.params.orderId] }
    );
    return res.json({ quotes });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/quotes - Create a quote
router.post('/', checkCapability('quotes.create'), async (req: Request, res: Response) => {
  try {
    const { order_id, materials_cost, labor_hours, labor_rate, markup_percent, tax_percent, notes } = req.body;
    const userId = req.user!.userId;

    const labor_cost = labor_hours * labor_rate;
    const subtotal = (materials_cost + labor_cost) * (1 + markup_percent / 100);
    const total = subtotal * (1 + (tax_percent || 0) / 100);

    await sequelize.query(
      `INSERT INTO quotes (order_id, created_by, materials_cost, labor_hours, labor_rate, labor_cost, markup_percent, subtotal, tax_percent, total, status, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, NOW(), NOW())`,
      { replacements: [order_id, userId, materials_cost, labor_hours, labor_rate, labor_cost, markup_percent, subtotal, tax_percent || 0, total, notes] }
    );

    return res.status(201).json({ message: 'Quote created', total });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /api/quotes/:id/status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const validStatuses = ['draft', 'sent', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const extra = status === 'approved' ? `, client_approved_at = NOW()` : '';
    await sequelize.query(`UPDATE quotes SET status = ?${extra}, updated_at = NOW() WHERE id = ?`, {
      replacements: [status, req.params.id],
    });
    return res.json({ message: 'Quote status updated' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/quotes/:id/generate-pdf - AI-powered PDF generation placeholder
router.post('/:id/generate-pdf', checkCapability('quotes.create'), async (req: Request, res: Response) => {
  try {
    // TODO: Call OpenAI API to generate professional quote document
    // Then convert to PDF and store
    return res.json({
      message: 'PDF generation queued',
      quote_id: req.params.id,
      status: 'pending',
      note: 'Will integrate with OpenAI API for professional document generation',
    });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sequelize from '../config/database';
import { authenticate, checkCapability } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const VALID_CATEGORIES = new Set(['designer', 'sales', 'general']);

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'orders');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safe = file.originalname
      .replace(ext, '')
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .slice(0, 80);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

const CATEGORY_CAPABILITY: Record<string, string> = {
  designer: 'bom.manage',
  sales: 'quotes.create',
  general: 'orders.create',
};

// GET /api/orders/:orderId/files
router.get('/:orderId/files', async (req: Request, res: Response) => {
  try {
    const [rows]: any = await sequelize.query(
      `SELECT f.*, u.name AS uploaded_by_name
       FROM order_files f
       LEFT JOIN users u ON u.id = f.uploaded_by
       WHERE f.order_id = ?
       ORDER BY f.created_at DESC`,
      { replacements: [req.params.orderId] }
    );
    return res.json({ files: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/orders/:orderId/files
router.post(
  '/:orderId/files',
  (req: Request, res: Response, next) => {
    const category = (req.query.category as string) || 'general';
    if (!VALID_CATEGORIES.has(category)) {
      return res.status(400).json({ message: 'Invalid category' });
    }
    const required = CATEGORY_CAPABILITY[category];
    return checkCapability(required)(req, res, next);
  },
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'File is required' });
      const category = (req.query.category as string) || 'general';
      const orderId = Number(req.params.orderId);

      const [orders]: any = await sequelize.query(
        `SELECT id FROM orders WHERE id = ? LIMIT 1`,
        { replacements: [orderId] }
      );
      if (!orders.length) {
        // Clean up the uploaded file we no longer need
        fs.unlink(req.file.path, () => {});
        return res.status(404).json({ message: 'Order not found' });
      }

      const storedPath = path.relative(process.cwd(), req.file.path).replace(/\\/g, '/');
      await sequelize.query(
        `INSERT INTO order_files (order_id, category, original_name, stored_path, mime_type, size_bytes, uploaded_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        {
          replacements: [
            orderId,
            category,
            req.file.originalname,
            storedPath,
            req.file.mimetype || null,
            req.file.size,
            req.user!.userId,
          ],
        }
      );

      return res.status(201).json({ message: 'File uploaded' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// DELETE /api/orders/:orderId/files/:fileId
router.delete('/:orderId/files/:fileId', async (req: Request, res: Response) => {
  try {
    const [rows]: any = await sequelize.query(
      `SELECT * FROM order_files WHERE id = ? AND order_id = ? LIMIT 1`,
      { replacements: [req.params.fileId, req.params.orderId] }
    );
    if (!rows.length) return res.status(404).json({ message: 'File not found' });
    const file = rows[0];

    // Authorization: uploader can delete their own file; users with 'orders.create' or '*' can delete any.
    const caps = req.user!.capabilities || [];
    const canDeleteAny = caps.includes('*') || caps.includes('orders.create');
    if (!canDeleteAny && file.uploaded_by !== req.user!.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await sequelize.query(`DELETE FROM order_files WHERE id = ?`, { replacements: [file.id] });
    const fullPath = path.resolve(process.cwd(), file.stored_path);
    fs.unlink(fullPath, () => {});
    return res.json({ message: 'File deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/orders/:orderId/files/:fileId/download
router.get('/:orderId/files/:fileId/download', async (req: Request, res: Response) => {
  try {
    const [rows]: any = await sequelize.query(
      `SELECT * FROM order_files WHERE id = ? AND order_id = ? LIMIT 1`,
      { replacements: [req.params.fileId, req.params.orderId] }
    );
    if (!rows.length) return res.status(404).json({ message: 'File not found' });
    const file = rows[0];
    const fullPath = path.resolve(process.cwd(), file.stored_path);
    if (!fs.existsSync(fullPath)) return res.status(404).json({ message: 'File missing on disk' });
    return res.download(fullPath, file.original_name);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;

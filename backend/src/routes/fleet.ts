import { Router, Request, Response } from 'express';
import { authenticate, checkCapability } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/fleet - List vehicles
router.get('/', async (req: Request, res: Response) => {
  try {
    const sequelize = (await import('../config/database')).default;
    const sortable = ['id', 'vehicle_name', 'status', 'plate'];
    const sortRaw = typeof req.query.sort === 'string' ? req.query.sort : 'vehicle_name';
    const sort = sortable.includes(sortRaw) ? sortRaw : 'vehicle_name';
    const order = (req.query.order === 'desc' || req.query.order === 'DESC') ? 'DESC' : 'ASC';

    const hasPage = req.query.page !== undefined || req.query.limit !== undefined;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const offset = (page - 1) * limit;

    const filterObj = (req.query.filter && typeof req.query.filter === 'object' && !Array.isArray(req.query.filter)
      ? (req.query.filter as Record<string, string>)
      : {}) as Record<string, string>;
    const where: string[] = [];
    const replacements: any[] = [];
    if (filterObj.status) {
      where.push(`status = ?`);
      replacements.push(filterObj.status);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    if (hasPage) {
      const [rows]: any = await sequelize.query(
        `SELECT * FROM fleet ${whereSql} ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`,
        { replacements: [...replacements, limit, offset] }
      );
      const [countRows]: any = await sequelize.query(
        `SELECT COUNT(*) AS total FROM fleet ${whereSql}`,
        { replacements }
      );
      return res.json({ rows, total: Number(countRows[0]?.total || 0), page, limit });
    }

    const [results] = await sequelize.query(
      `SELECT * FROM fleet ${whereSql} ORDER BY ${sort} ${order}`,
      { replacements }
    );
    return res.json({ fleet: results });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/fleet - Create a new vehicle
router.post('/', checkCapability('fleet.checkout'), async (req: Request, res: Response) => {
  try {
    const { vehicle_name, plate_number, status, next_service_date } = req.body || {};
    if (!vehicle_name || !plate_number) {
      return res.status(400).json({ message: 'vehicle_name and plate_number are required' });
    }
    const sequelize = (await import('../config/database')).default;

    const validStatus = ['available', 'checked_out', 'maintenance'].includes(status) ? status : 'available';

    try {
      await sequelize.query(
        `INSERT INTO fleet (vehicle_name, plate_number, status, next_service_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, NOW(), NOW())`,
        { replacements: [vehicle_name, plate_number, validStatus, next_service_date || null] }
      );
    } catch (err: any) {
      if (err?.parent?.code === 'ER_DUP_ENTRY' || err?.original?.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Plate number already exists' });
      }
      throw err;
    }
    return res.status(201).json({ message: 'Vehicle created' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/fleet/checkout - Assign vehicle to installer
router.post('/checkout', checkCapability('fleet.checkout'), async (req: Request, res: Response) => {
  try {
    const { vehicle_id } = req.body;
    const userId = req.user!.userId;
    const sequelize = (await import('../config/database')).default;

    const [vehicles]: any = await sequelize.query('SELECT * FROM fleet WHERE id = ?', {
      replacements: [vehicle_id],
    });
    if (!vehicles.length) return res.status(404).json({ message: 'Vehicle not found' });
    if (vehicles[0].status === 'checked_out') {
      return res.status(400).json({ message: 'Vehicle already checked out' });
    }

    await sequelize.query("UPDATE fleet SET status = 'checked_out', checked_out_by = ? WHERE id = ?", {
      replacements: [userId, vehicle_id],
    });

    return res.json({ message: 'Vehicle checked out', vehicle_id, user_id: userId });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import sequelize from '../config/database';

const router = Router();
router.use(authenticate);

// Factory location (configurable)
const FACTORY_LAT = 41.3275;
const FACTORY_LNG = 19.8187;
const RADIUS_METERS = 200;

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Mobile sends `{}` because v1 has no geofence. When lat/lng are absent we
// store nulls and `is_within_radius = null`. Web flow keeps sending real
// coords and behaves exactly as before.
const recordAttendance = async (
  type: 'check_in' | 'check_out',
  userId: number,
  body: any
): Promise<{ is_within_radius: boolean | null; distance: number | null }> => {
  const lat = Number(body?.latitude);
  const lng = Number(body?.longitude);
  const hasGeo = Number.isFinite(lat) && Number.isFinite(lng);
  const distance = hasGeo ? haversineDistance(FACTORY_LAT, FACTORY_LNG, lat, lng) : null;
  const isWithinRadius = distance == null ? null : distance <= RADIUS_METERS;

  await sequelize.query(
    `INSERT INTO attendance (user_id, type, latitude, longitude, is_within_radius, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
    { replacements: [userId, type, hasGeo ? lat : null, hasGeo ? lng : null, isWithinRadius] }
  );
  return { is_within_radius: isWithinRadius, distance: distance == null ? null : Math.round(distance) };
};

// POST /api/attendance/check-in
router.post('/check-in', async (req: Request, res: Response) => {
  try {
    const result = await recordAttendance('check_in', req.user!.userId, req.body);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[attendance] check-in failed', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/attendance/check-out
router.post('/check-out', async (req: Request, res: Response) => {
  try {
    const result = await recordAttendance('check_out', req.user!.userId, req.body);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[attendance] check-out failed', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/attendance/today - Current user's status today
router.get('/today', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const [records]: any = await sequelize.query(
      `SELECT * FROM attendance WHERE user_id = ? AND DATE(created_at) = CURDATE() ORDER BY created_at DESC`,
      { replacements: [userId] }
    );
    return res.json({ records });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/attendance/all - Admin view all attendance
router.get('/all', async (req: Request, res: Response) => {
  try {
    const hasPage = req.query.page !== undefined || req.query.limit !== undefined;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const offset = (page - 1) * limit;

    const filterObj = (req.query.filter && typeof req.query.filter === 'object' && !Array.isArray(req.query.filter)
      ? (req.query.filter as Record<string, string>)
      : {}) as Record<string, string>;
    const where: string[] = [`DATE(a.created_at) = CURDATE()`];
    const replacements: any[] = [];
    if (filterObj.user_id) {
      where.push(`a.user_id = ?`);
      replacements.push(filterObj.user_id);
    }
    if (filterObj.type) {
      where.push(`a.type = ?`);
      replacements.push(filterObj.type);
    }
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (q) {
      where.push(`u.name LIKE ?`);
      replacements.push(`%${q}%`);
    }
    const whereSql = `WHERE ${where.join(' AND ')}`;

    const sortMap: Record<string, string> = {
      created_at: 'a.created_at',
      user_id: 'a.user_id',
      user_name: 'u.name',
    };
    const sortRaw = typeof req.query.sort === 'string' ? req.query.sort : 'created_at';
    const sort = sortMap[sortRaw] || 'a.created_at';
    const order = (req.query.order === 'asc' || req.query.order === 'ASC') ? 'ASC' : 'DESC';

    if (hasPage) {
      const [rows]: any = await sequelize.query(
        `SELECT a.*, u.name as user_name FROM attendance a JOIN users u ON a.user_id = u.id ${whereSql} ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`,
        { replacements: [...replacements, limit, offset] }
      );
      const [countRows]: any = await sequelize.query(
        `SELECT COUNT(*) AS total FROM attendance a JOIN users u ON a.user_id = u.id ${whereSql}`,
        { replacements }
      );
      return res.json({ rows, total: Number(countRows[0]?.total || 0), page, limit });
    }

    const [records]: any = await sequelize.query(
      `SELECT a.*, u.name as user_name FROM attendance a JOIN users u ON a.user_id = u.id ${whereSql} ORDER BY ${sort} ${order}`,
      { replacements }
    );
    return res.json({ records });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/attendance/history?user_id=&from=&to=
router.get('/history', async (req: Request, res: Response) => {
  try {
    const { user_id, from, to } = req.query;
    let query = `SELECT a.*, u.name as user_name FROM attendance a JOIN users u ON a.user_id = u.id WHERE 1=1`;
    const replacements: any[] = [];

    if (user_id) { query += ` AND a.user_id = ?`; replacements.push(user_id); }
    if (from) { query += ` AND DATE(a.created_at) >= ?`; replacements.push(from); }
    if (to) { query += ` AND DATE(a.created_at) <= ?`; replacements.push(to); }
    query += ` ORDER BY a.created_at DESC LIMIT 500`;

    const [records]: any = await sequelize.query(query, { replacements });
    return res.json({ records });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;

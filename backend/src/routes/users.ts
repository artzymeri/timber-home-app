import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User';
import Role from '../models/Role';
import { authenticate, checkCapability } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(checkCapability('users.manage'));

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const serializeUser = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role_id: user.role_id,
  role: user.role
    ? { id: user.role.id, role_name: user.role.role_name, icon: user.role.icon }
    : undefined,
  must_change_password: user.must_change_password,
  invited_at: user.invited_at,
  has_pending_invite: !!user.invite_token,
  invite_expires_at: user.invite_token_expires_at,
});

const buildSetupUrl = (token: string) => {
  const base = process.env.FRONTEND_URL || 'http://localhost:7890';
  return `${base.replace(/\/$/, '')}/setup/${token}`;
};

const generateTempPassword = () => crypto.randomBytes(9).toString('base64url');
const generateInviteToken = () => crypto.randomBytes(32).toString('hex');

router.get('/', async (req: Request, res: Response) => {
  try {
    const { Op } = await import('sequelize');
    const hasPage = req.query.page !== undefined || req.query.limit !== undefined;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const offset = (page - 1) * limit;

    const sortable = ['id', 'name', 'email', 'role_id'];
    const sortRaw = typeof req.query.sort === 'string' ? req.query.sort : 'id';
    const sort = sortable.includes(sortRaw) ? sortRaw : 'id';
    const order = (req.query.order === 'desc' || req.query.order === 'DESC') ? 'DESC' : 'ASC';

    const filterObj = (req.query.filter && typeof req.query.filter === 'object' && !Array.isArray(req.query.filter)
      ? (req.query.filter as Record<string, string>)
      : {}) as Record<string, string>;
    const where: any = {};
    if (filterObj.role_id) where.role_id = Number(filterObj.role_id);

    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (q) {
      where[Op.or] = [
        { name: { [Op.like]: `%${q}%` } },
        { email: { [Op.like]: `%${q}%` } },
      ];
    }

    if (hasPage) {
      const { rows, count } = await User.findAndCountAll({
        where,
        include: [{ model: Role, as: 'role' }],
        order: [[sort, order]],
        limit,
        offset,
      });
      return res.json({ rows: rows.map(serializeUser), total: count, page, limit });
    }

    const users = await User.findAll({
      where,
      include: [{ model: Role, as: 'role' }],
      order: [[sort, order]],
    });
    return res.json({ users: users.map(serializeUser) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, role_id, method } = req.body || {};
    if (!name || !email || !role_id || !method) {
      return res.status(400).json({ message: 'name, email, role_id, and method are required' });
    }
    if (method !== 'temp_password' && method !== 'invite_link') {
      return res.status(400).json({ message: 'Invalid method' });
    }

    const role = await Role.findByPk(role_id);
    if (!role) return res.status(400).json({ message: 'Role not found' });

    const existing = await User.findOne({ where: { email: String(email).toLowerCase().trim() } });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const baseAttrs = {
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      role_id: role.id,
      invited_at: new Date(),
    };

    if (method === 'temp_password') {
      const tempPassword = generateTempPassword();
      const password_hash = await bcrypt.hash(tempPassword, 10);
      const user = await User.create({
        ...baseAttrs,
        password_hash,
        must_change_password: true,
        invite_token: null,
        invite_token_expires_at: null,
      });
      const fresh = await User.findByPk(user.id, { include: [{ model: Role, as: 'role' }] });
      return res.status(201).json({
        user: serializeUser(fresh!),
        method,
        temp_password: tempPassword,
      });
    }

    // invite_link
    const token = generateInviteToken();
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
    // Use a placeholder hash so the column constraint is satisfied; real password set on claim.
    const placeholderHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);

    const user = await User.create({
      ...baseAttrs,
      password_hash: placeholderHash,
      must_change_password: false,
      invite_token: token,
      invite_token_expires_at: expiresAt,
    });

    const fresh = await User.findByPk(user.id, { include: [{ model: Role, as: 'role' }] });
    return res.status(201).json({
      user: serializeUser(fresh!),
      method,
      setup_url: buildSetupUrl(token),
      expires_at: expiresAt,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const user = await User.findByPk(req.params.id, { include: [{ model: Role, as: 'role' }] });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, email, role_id } = req.body || {};
    const patch: Partial<User> = {};

    if (name !== undefined) patch.name = String(name).trim();
    if (email !== undefined) {
      const newEmail = String(email).toLowerCase().trim();
      if (newEmail !== user.email) {
        const dupe = await User.findOne({ where: { email: newEmail } });
        if (dupe && dupe.id !== user.id) return res.status(409).json({ message: 'Email already in use' });
        patch.email = newEmail;
      }
    }
    if (role_id !== undefined && role_id !== user.role_id) {
      const role = await Role.findByPk(role_id);
      if (!role) return res.status(400).json({ message: 'Role not found' });

      // Prevent removing the last admin.
      if (user.role?.is_system && user.role.role_name === 'Admin') {
        const adminCount = await User.count({ where: { role_id: user.role_id } });
        if (adminCount <= 1) return res.status(400).json({ message: 'Cannot remove role from the only Admin' });
      }
      patch.role_id = role.id;
    }

    await user.update(patch as any);
    const fresh = await User.findByPk(user.id, { include: [{ model: Role, as: 'role' }] });
    return res.json({ user: serializeUser(fresh!) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const user = await User.findByPk(req.params.id, { include: [{ model: Role, as: 'role' }] });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.id === req.user!.userId) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    if (user.role?.is_system && user.role.role_name === 'Admin') {
      const adminCount = await User.count({ where: { role_id: user.role_id } });
      if (adminCount <= 1) return res.status(400).json({ message: 'Cannot delete the only Admin' });
    }
    await user.destroy();
    return res.json({ message: 'User deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/:id/regenerate-invite', async (req: Request, res: Response) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const token = generateInviteToken();
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
    await user.update({
      invite_token: token,
      invite_token_expires_at: expiresAt,
      must_change_password: false,
    });
    return res.json({ setup_url: buildSetupUrl(token), expires_at: expiresAt });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;

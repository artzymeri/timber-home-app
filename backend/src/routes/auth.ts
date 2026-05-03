import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import User from '../models/User';
import Role from '../models/Role';
import { authenticate, AuthPayload } from '../middleware/auth';

const router = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const issueToken = (userId: number, role: Role): string => {
  const capabilities = Array.isArray(role.permissions) ? role.permissions : [];
  const payload: AuthPayload = { userId, role: role.role_name, capabilities };
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '7d' as any });
};

const buildSession = (user: User, role: Role) => ({
  user: {
    id: user.id,
    name: user.name,
    email: user.email,
    role: role.role_name,
    must_change_password: user.must_change_password,
  },
  role: {
    id: role.id,
    role_name: role.role_name,
    icon: role.icon,
    default_route: role.default_route,
    is_system: role.is_system,
  },
  capabilities: Array.isArray(role.permissions) ? role.permissions : [],
  allowed_pages: Array.isArray(role.allowed_pages) ? role.allowed_pages : [],
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({
      where: { email: String(email).toLowerCase().trim() },
      include: [{ model: Role, as: 'role' }],
    });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    if (user.invite_token) {
      return res.status(403).json({
        message: 'Account setup is incomplete. Use the invite link sent to you.',
        code: 'PENDING_INVITE',
      });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const role = (user as any).role as Role;
    const token = issueToken(user.id, role);
    res.cookie('token', token, COOKIE_OPTIONS);
    // `token` in the body is for native clients (Authorization: Bearer). Web
    // ignores it and relies on the HttpOnly cookie set above.
    return res.json({ ...buildSession(user, role), token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token');
  return res.json({ message: 'Logged out' });
});

router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await User.findByPk(req.user!.userId, { include: [{ model: Role, as: 'role' }] });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const role = (user as any).role as Role;
    return res.json(buildSession(user, role));
  } catch {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Public: claim an invite token by setting a password.
router.post('/setup/:token', async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    if (!password || String(password).length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const user = await User.findOne({
      where: {
        invite_token: req.params.token,
        invite_token_expires_at: { [Op.gt]: new Date() },
      },
      include: [{ model: Role, as: 'role' }],
    });
    if (!user) return res.status(400).json({ message: 'Invalid or expired invite token', code: 'INVITE_INVALID' });

    const password_hash = await bcrypt.hash(password, 10);
    await user.update({
      password_hash,
      invite_token: null,
      invite_token_expires_at: null,
      must_change_password: false,
    });

    const role = (user as any).role as Role;
    const token = issueToken(user.id, role);
    res.cookie('token', token, COOKIE_OPTIONS);
    return res.json({ ...buildSession(user, role), token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Public: validate a token (for the setup page to render or show "expired").
router.get('/setup/:token', async (req: Request, res: Response) => {
  const user = await User.findOne({
    where: {
      invite_token: req.params.token,
      invite_token_expires_at: { [Op.gt]: new Date() },
    },
  });
  if (!user) return res.status(404).json({ valid: false });
  return res.json({ valid: true, email: user.email, name: user.name });
});

router.post('/change-password', authenticate, async (req: Request, res: Response) => {
  try {
    const { current_password, new_password } = req.body || {};
    if (!new_password || String(new_password).length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }
    const user = await User.findByPk(req.user!.userId, { include: [{ model: Role, as: 'role' }] });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.must_change_password) {
      if (!current_password) return res.status(400).json({ message: 'Current password is required' });
      const ok = await bcrypt.compare(current_password, user.password_hash);
      if (!ok) return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const password_hash = await bcrypt.hash(new_password, 10);
    await user.update({ password_hash, must_change_password: false });

    const role = (user as any).role as Role;
    const token = issueToken(user.id, role);
    res.cookie('token', token, COOKIE_OPTIONS);
    return res.json({ ...buildSession(user, role), token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;

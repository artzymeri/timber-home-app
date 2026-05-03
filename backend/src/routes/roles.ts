import { Router, Request, Response } from 'express';
import Role from '../models/Role';
import User from '../models/User';
import { authenticate, checkCapability } from '../middleware/auth';
import { ADMIN_WILDCARD, isValidCapability } from '../lib/capabilities';
import { isValidPageKey, pagesToCapabilities, ALL_PAGES_WILDCARD, PAGES } from '../lib/pages';

const router = Router();
router.use(authenticate);
router.use(checkCapability('roles.manage'));

const serializeRole = (role: Role, userCount?: number) => ({
  id: role.id,
  role_name: role.role_name,
  permissions: Array.isArray(role.permissions) ? role.permissions : [],
  allowed_pages: Array.isArray(role.allowed_pages) ? role.allowed_pages : [],
  icon: role.icon,
  default_route: role.default_route,
  is_system: role.is_system,
  description: role.description,
  user_count: userCount,
});

router.get('/', async (_req: Request, res: Response) => {
  try {
    const roles = await Role.findAll({ order: [['id', 'ASC']] });
    const counts = await Promise.all(
      roles.map((r) => User.count({ where: { role_id: r.id } }))
    );
    return res.json({ roles: roles.map((r, i) => serializeRole(r, counts[i])) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) return res.status(404).json({ message: 'Role not found' });
    const userCount = await User.count({ where: { role_id: role.id } });
    return res.json({ role: serializeRole(role, userCount) });
  } catch {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

const validatePayload = (body: any): { error?: string; data?: any } => {
  const role_name = (body?.role_name || '').toString().trim();
  if (!role_name) return { error: 'role_name is required' };
  if (role_name.length > 50) return { error: 'role_name must be 50 characters or less' };

  const permissions = Array.isArray(body?.permissions) ? body.permissions.map(String) : [];
  for (const p of permissions) {
    if (!isValidCapability(p)) return { error: `Unknown capability: ${p}` };
  }

  const allowed_pages = Array.isArray(body?.allowed_pages) ? body.allowed_pages.map(String) : [];
  for (const p of allowed_pages) {
    if (!isValidPageKey(p)) return { error: `Unknown page key: ${p}` };
  }

  const icon = (body?.icon || 'UserCircle').toString();
  const default_route = (body?.default_route || '/admin/dashboard').toString();
  const description = body?.description ? String(body.description).slice(0, 255) : null;

  return {
    data: { role_name, permissions, allowed_pages, icon, default_route, description },
  };
};

router.post('/', async (req: Request, res: Response) => {
  try {
    const { error, data } = validatePayload(req.body);
    if (error) return res.status(400).json({ message: error });

    const existing = await Role.findOne({ where: { role_name: data!.role_name } });
    if (existing) return res.status(409).json({ message: 'Role name already exists' });

    if (data!.permissions.includes(ADMIN_WILDCARD)) {
      return res.status(400).json({ message: 'Wildcard permission is reserved' });
    }
    if (data!.allowed_pages.includes(ALL_PAGES_WILDCARD)) {
      return res.status(400).json({ message: 'Wildcard page access is reserved' });
    }

    // Auto-derive missing capabilities from the page list so admins don't have
    // to maintain both lists by hand.
    const derived = pagesToCapabilities(data!.allowed_pages);
    const merged = Array.from(new Set([...(data!.permissions as string[]), ...derived]));

    const role = await Role.create({ ...data!, permissions: merged, is_system: false });
    return res.status(201).json({ role: serializeRole(role, 0) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) return res.status(404).json({ message: 'Role not found' });

    const { error, data } = validatePayload(req.body);
    if (error) return res.status(400).json({ message: error });

    if (role.is_system) {
      // System roles: icon, description, default_route, allowed_pages stay editable
      // but role_name and permissions stay locked.
      await role.update({
        icon: data!.icon,
        default_route: data!.default_route,
        description: data!.description,
        allowed_pages: data!.allowed_pages,
      });
    } else {
      if (data!.permissions.includes(ADMIN_WILDCARD)) {
        return res.status(400).json({ message: 'Wildcard permission is reserved' });
      }
      if (data!.allowed_pages.includes(ALL_PAGES_WILDCARD)) {
        return res.status(400).json({ message: 'Wildcard page access is reserved' });
      }
      if (data!.role_name !== role.role_name) {
        const dupe = await Role.findOne({ where: { role_name: data!.role_name } });
        if (dupe && dupe.id !== role.id) {
          return res.status(409).json({ message: 'Role name already exists' });
        }
      }
      // Re-derive capabilities from the page list.
      const derived = pagesToCapabilities(data!.allowed_pages);
      const merged = Array.from(new Set([...(data!.permissions as string[]), ...derived]));
      await role.update({ ...data!, permissions: merged });
    }

    const userCount = await User.count({ where: { role_id: role.id } });
    return res.json({ role: serializeRole(role, userCount) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) return res.status(404).json({ message: 'Role not found' });
    if (role.is_system) return res.status(400).json({ message: 'System roles cannot be deleted' });

    const userCount = await User.count({ where: { role_id: role.id } });
    if (userCount > 0) {
      return res.status(400).json({ message: 'Reassign users before deleting this role', user_count: userCount });
    }

    await role.destroy();
    return res.json({ message: 'Role deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Expose the canonical page registry so the wizard can render the list.
router.get('/_meta/pages', async (_req, res) => {
  res.json({ pages: PAGES });
});

export default router;

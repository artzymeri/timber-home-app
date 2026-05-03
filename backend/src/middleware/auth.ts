import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Role from '../models/Role';
import User from '../models/User';
import { ADMIN_WILDCARD } from '../lib/capabilities';

export interface AuthPayload {
  userId: number;
  role: string;
  capabilities?: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        role: string;
        capabilities: string[];
      };
    }
  }
}

// In-memory cache: userId -> { capabilities, role, expiresAt }
// Avoids hitting the DB on every authenticated request when the JWT is missing
// the capabilities claim (e.g. a token issued before the capabilities upgrade).
const HYDRATE_TTL_MS = 30_000;
const hydrateCache = new Map<number, { role: string; capabilities: string[]; expiresAt: number }>();

const hydrateFromDb = async (userId: number) => {
  const cached = hydrateCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) return cached;

  const user = await User.findByPk(userId, { include: [{ model: Role, as: 'role' }] });
  if (!user) return null;
  const role = (user as any).role as Role | undefined;
  const entry = {
    role: role?.role_name || '',
    capabilities: Array.isArray(role?.permissions) ? (role!.permissions as string[]) : [],
    expiresAt: Date.now() + HYDRATE_TTL_MS,
  };
  hydrateCache.set(userId, entry);
  return entry;
};

export const invalidateAuthCache = (userId?: number) => {
  if (userId === undefined) hydrateCache.clear();
  else hydrateCache.delete(userId);
};

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined = req.cookies?.token;
  if (!token) {
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
      token = header.slice(7).trim();
    }
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;

    let capabilities = Array.isArray(payload.capabilities) ? payload.capabilities : [];
    let role = payload.role;

    // If the token doesn't carry capabilities (older token, or schema change),
    // hydrate them from the user's current role.
    if (capabilities.length === 0) {
      const fresh = await hydrateFromDb(payload.userId);
      if (!fresh) return res.status(401).json({ message: 'User no longer exists' });
      capabilities = fresh.capabilities;
      role = fresh.role || role;
    }

    req.user = { userId: payload.userId, role, capabilities };
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

/**
 * @deprecated Prefer checkCapability. Kept for routes not yet migrated.
 */
export const checkRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};

export const checkCapability = (required: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const caps = req.user.capabilities || [];
    if (caps.includes(ADMIN_WILDCARD) || caps.includes(required)) {
      return next();
    }
    return res.status(403).json({ message: 'Forbidden', required });
  };
};

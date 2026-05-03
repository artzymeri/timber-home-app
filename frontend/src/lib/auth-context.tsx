'use client';

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ADMIN_WILDCARD } from '@/lib/capabilities';
import { ALL_PAGES_WILDCARD } from '@/lib/pages';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  must_change_password?: boolean;
}

export interface RoleSummary {
  id: number;
  role_name: string;
  icon: string;
  default_route: string;
  is_system?: boolean;
}

interface SessionPayload {
  user: User;
  role: RoleSummary;
  capabilities: string[];
  allowed_pages?: string[];
}

interface AuthContextValue {
  user: User | null;
  role: RoleSummary | null;
  capabilities: string[];
  allowedPages: string[];
  loading: boolean;
  hasCapability: (key: string) => boolean;
  hasPage: (key: string) => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  applySession: (session: SessionPayload) => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const PUBLIC_PATHS = new Set(['/login']);
const isPublicPath = (path: string) => {
  if (PUBLIC_PATHS.has(path)) return true;
  if (path.startsWith('/setup/')) return true;
  if (path.startsWith('/client')) return true;
  return false;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<RoleSummary | null>(null);
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [allowedPages, setAllowedPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const applySession = useCallback((session: SessionPayload) => {
    setUser(session.user);
    setRole(session.role);
    setCapabilities(session.capabilities || []);
    setAllowedPages(session.allowed_pages || []);
  }, []);

  const refresh = useCallback(async () => {
    const res = await fetch(`${API}/api/auth/me`, { credentials: 'include' });
    if (!res.ok) {
      setUser(null);
      setRole(null);
      setCapabilities([]);
      setAllowedPages([]);
      return;
    }
    const data = (await res.json()) as SessionPayload;
    applySession(data);
  }, [applySession]);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  useEffect(() => {
    if (loading) return;
    if (!user && !isPublicPath(pathname)) {
      router.replace('/login');
      return;
    }
    if (user?.must_change_password && pathname !== '/change-password') {
      router.replace('/change-password');
    }
  }, [user, loading, pathname, router]);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.message || 'Invalid credentials');
    }
    const data = (await res.json()) as SessionPayload;
    applySession(data);
    if (data.user.must_change_password) {
      router.replace('/change-password');
    } else {
      router.replace(data.role?.default_route || '/admin/dashboard');
    }
  };

  const logout = async () => {
    await fetch(`${API}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    setUser(null);
    setRole(null);
    setCapabilities([]);
    setAllowedPages([]);
    router.replace('/login');
  };

  const hasCapability = useCallback(
    (key: string) => {
      if (!capabilities) return false;
      if (capabilities.includes(ADMIN_WILDCARD)) return true;
      return capabilities.includes(key);
    },
    [capabilities]
  );

  const hasPage = useCallback(
    (key: string) => {
      if (!allowedPages || allowedPages.length === 0) return false;
      if (allowedPages.includes(ALL_PAGES_WILDCARD)) return true;
      return allowedPages.includes(key);
    },
    [allowedPages]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        capabilities,
        allowedPages,
        loading,
        hasCapability,
        hasPage,
        login,
        logout,
        applySession,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

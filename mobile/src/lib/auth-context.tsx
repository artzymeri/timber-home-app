import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { ADMIN_WILDCARD } from '@/lib/capabilities';
import { ALL_PAGES_WILDCARD } from '@/lib/pages';
import { api, getToken, setToken } from '@/lib/api';

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
  token?: string;
}

interface AuthContextValue {
  user: User | null;
  role: RoleSummary | null;
  capabilities: string[];
  allowedPages: string[];
  loading: boolean;
  hasCapability: (key: string) => boolean;
  hasPage: (key: string) => boolean;
  login: (email: string, password: string) => Promise<SessionPayload>;
  logout: () => Promise<void>;
  applySession: (session: SessionPayload) => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<RoleSummary | null>(null);
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [allowedPages, setAllowedPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((session: SessionPayload) => {
    setUser(session.user);
    setRole(session.role);
    setCapabilities(session.capabilities || []);
    setAllowedPages(session.allowed_pages || []);
  }, []);

  const refresh = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setUser(null);
      setRole(null);
      setCapabilities([]);
      setAllowedPages([]);
      return;
    }
    try {
      const data = await api<SessionPayload>('/api/auth/me');
      applySession(data);
    } catch {
      setUser(null);
      setRole(null);
      setCapabilities([]);
      setAllowedPages([]);
    }
  }, [applySession]);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = async (email: string, password: string) => {
    const data = await api<SessionPayload>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) await setToken(data.token);
    applySession(data);
    return data;
  };

  const logout = async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch {}
    await setToken(null);
    setUser(null);
    setRole(null);
    setCapabilities([]);
    setAllowedPages([]);
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

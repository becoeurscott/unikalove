'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from './api';

export interface AdminUser {
  id: string;
  email: string;
  role: 'USER' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN';
  plan: string;
}

interface AuthContextValue {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

const STAFF_ROLES = ['MODERATOR', 'ADMIN', 'SUPER_ADMIN'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api<AdminUser>('/auth/me')
      .then((me) => setUser(STAFF_ROLES.includes(me.role) ? me : null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const { accessToken } = await api<{ accessToken: string }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    const me = await api<AdminUser>('/auth/me', { token: accessToken });
    if (!STAFF_ROLES.includes(me.role)) {
      throw new Error('This account does not have admin access.');
    }
    setToken(accessToken);
    setUser(me);
  }

  function logout() {
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  );
}

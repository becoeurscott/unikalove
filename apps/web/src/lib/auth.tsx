'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from './api';

export interface WebUser {
  id: string;
  email: string;
  role: string;
  plan: 'FREE' | 'PREMIUM' | 'PREMIUM_PLUS';
}

interface AuthContextValue {
  user: WebUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<WebUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api<WebUser>('/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  /**
   * Both endpoints return the user alongside the token, so signing in is a
   * single round trip. The /auth/me fallback covers an API that predates that.
   */
  async function authenticate(path: '/auth/login' | '/auth/register', body: unknown) {
    const res = await api<{ accessToken: string; user?: WebUser }>(path, {
      method: 'POST',
      body,
    });
    setToken(res.accessToken);
    setUser(res.user ?? (await api<WebUser>('/auth/me', { token: res.accessToken })));
  }

  const login = (email: string, password: string) =>
    authenticate('/auth/login', { email, password });

  const register = (email: string, password: string) =>
    authenticate('/auth/register', { email, password });

  function logout() {
    api('/auth/logout', { method: 'POST' }).catch(() => {});
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

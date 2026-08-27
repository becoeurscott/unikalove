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

  async function login(email: string, password: string) {
    const { accessToken } = await api<{ accessToken: string }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    setToken(accessToken);
    setUser(await api<WebUser>('/auth/me', { token: accessToken }));
  }

  async function register(email: string, password: string) {
    const { accessToken } = await api<{ accessToken: string }>('/auth/register', {
      method: 'POST',
      body: { email, password },
    });
    setToken(accessToken);
    setUser(await api<WebUser>('/auth/me', { token: accessToken }));
  }

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

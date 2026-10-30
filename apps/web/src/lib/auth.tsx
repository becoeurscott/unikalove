'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getToken, refreshToken, setToken } from './api';
import { appUrl, insforge, insforgeEnabled } from './insforge';

export interface WebUser {
  id: string;
  email: string;
  role: string;
  plan: 'FREE' | 'PREMIUM' | 'PREMIUM_PLUS';
  /** ISO date a paid plan lapses; null on FREE. */
  planExpiresAt?: string | null;
}

interface AuthContextValue {
  user: WebUser | null;
  loading: boolean;
  /** Re-reads the account — used after a payment confirms, so the UI flips
   *  without waiting for a reload. */
  refreshUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  /** Redirects to Google; the session lands on return (see bootstrap). */
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  refreshUser: async () => {},
  login: async () => {},
  register: async () => {},
  loginWithGoogle: async () => {},
  logout: () => {},
});

/** French copy for the InsForge errors a user can actually cause. */
function authMessage(err: { error?: string; message?: string } | null): string {
  switch (err?.error) {
    case 'INVALID_CREDENTIALS':
      return 'E-mail ou mot de passe incorrect';
    case 'ALREADY_EXISTS':
    case 'USER_ALREADY_EXISTS':
      return 'Un compte existe déjà avec cet e-mail';
    default:
      return err?.message ?? 'Connexion impossible';
  }
}

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<WebUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (insforgeEnabled) {
      // getCurrentUser() also completes a Google redirect (insforge_code in
      // the URL); refreshToken() then mints the bearer the REST API accepts.
      insforge.auth
        .getCurrentUser()
        .then(async ({ data }) => {
          if (!data.user || !(await refreshToken())) return setUser(null);
          setUser(await api<WebUser>('/auth/me'));
        })
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
      return;
    }
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

  /** The API provisions its own user row on the first InsForge-signed call. */
  async function adopt(accessToken: string | undefined) {
    if (!accessToken) throw new Error('Vérifiez votre e-mail pour activer le compte');
    setToken(accessToken);
    setUser(await api<WebUser>('/auth/me', { token: accessToken }));
  }

  async function login(email: string, password: string) {
    if (!insforgeEnabled) return authenticate('/auth/login', { email, password });
    const { data, error } = await insforge.auth.signInWithPassword({ email, password });
    if (error) throw new Error(authMessage(error));
    await adopt(data?.accessToken);
  }

  async function register(email: string, password: string) {
    if (!insforgeEnabled) return authenticate('/auth/register', { email, password });
    const { data, error } = await insforge.auth.signUp({
      email,
      password,
      redirectTo: appUrl('/login'),
    });
    if (error) throw new Error(authMessage(error));
    await adopt(data?.accessToken ?? undefined);
  }

  async function loginWithGoogle() {
    if (!insforgeEnabled) throw new Error('Connexion Google bientôt disponible');
    const { error } = await insforge.auth.signInWithOAuth('google', {
      redirectTo: appUrl('/'),
    });
    if (error) throw new Error(authMessage(error));
  }

  // Stable identity: callers put this in a useEffect dependency list, and a
  // fresh function each render would loop them.
  const refreshUser = useCallback(async () => {
    if (!getToken()) return;
    try {
      setUser(await api<WebUser>('/auth/me'));
    } catch {
      /* a failed refresh must not sign anyone out */
    }
  }, []);

  function logout() {
    if (insforgeEnabled) insforge.auth.signOut().catch(() => {});
    else api('/auth/logout', { method: 'POST' }).catch(() => {});
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

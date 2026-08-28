export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:4000';

const TOKEN_KEY = 'unika_web_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

let refreshing: Promise<string | null> | null = null;

/** Rotates the refresh cookie into a new access token; null if session dead. */
async function refreshToken(): Promise<string | null> {
  refreshing ??= (async () => {
    try {
      const res = await fetch(API_URL + '/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) return null;
      const { accessToken } = await res.json();
      setToken(accessToken);
      return accessToken as string;
    } catch {
      return null;
    } finally {
      setTimeout(() => (refreshing = null), 0);
    }
  })();
  return refreshing;
}

export async function api<T = unknown>(
  path: string,
  opts: { method?: string; body?: unknown; token?: string; _retried?: boolean } = {},
): Promise<T> {
  const token = opts.token ?? getToken();
  const res = await fetch(API_URL + path, {
    method: opts.method ?? 'GET',
    credentials: path.startsWith('/auth') ? 'include' : 'same-origin',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  if (res.status === 401 && !opts._retried && !path.startsWith('/auth')) {
    const fresh = await refreshToken();
    if (fresh) return api<T>(path, { ...opts, token: fresh, _retried: true });
    if (typeof window !== 'undefined') {
      setToken(null);
      window.location.href = '/login';
    }
  }
  if (res.status === 204) return undefined as T;
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (json as any).message ?? 'Request failed');
  return json as T;
}

/**
 * Multipart POST — the JSON helper above cannot be reused because setting a
 * content-type by hand strips the multipart boundary the browser generates.
 * Used by the photo upload fallback, which streams the file through the API.
 */
export async function apiUpload<T = unknown>(
  path: string,
  file: File,
  field = 'file',
  _retried = false,
): Promise<T> {
  const token = getToken();
  const form = new FormData();
  form.append(field, file);
  const res = await fetch(API_URL + path, {
    method: 'POST',
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  if (res.status === 401 && !_retried) {
    const fresh = await refreshToken();
    if (fresh) return apiUpload<T>(path, file, field, true);
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (json as any).message ?? "L'envoi a échoué");
  return json as T;
}

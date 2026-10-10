/**
 * Tiny client for our own Node/Express API (server/).
 * Every function resolves to { data, error } so callers never need try/catch.
 */
const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';
const TOKEN_KEY = 'farmdirect_token';

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token: string | null) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
};

export interface ApiResult<T> {
  data: T | null;
  error: string | null;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<ApiResult<T>> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  try {
    const res = await fetch(`${BASE}${path}`, { method, headers, body: payload });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return { data: null, error: (json && json.error) || `Request failed (${res.status}).` };
    }
    return { data: json as T, error: null };
  } catch {
    return { data: null, error: 'Cannot reach the server. Is the API running?' };
  }
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body ?? {}),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body ?? {}),
  del: <T>(path: string) => request<T>('DELETE', path),
};

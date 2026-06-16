export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/** Backend origin without the `/api` suffix — used for uploaded assets and WebSockets. */
export const API_ORIGIN =
  import.meta.env.VITE_WS_URL?.replace(/\/$/, '') ||
  API_BASE.replace(/\/api\/?$/, '') ||
  'http://localhost:3000';

export const WS_URL = import.meta.env.VITE_WS_URL || API_ORIGIN;

export function apiAssetUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
}

export function apiHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function api<T = any>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...apiHeaders(), ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(formatApiError(body, `Request failed: ${res.status}`));
  }
  return res.json();
}

export function apiUrl(path: string) {
  return `${API_BASE}${path}`;
}

/** NestJS validation errors return message as a string or string[]. */
export function formatApiError(data: unknown, fallback = 'Something went wrong'): string {
  if (!data || typeof data !== 'object') return fallback;
  const message = (data as { message?: unknown }).message;
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string' && message.trim()) return message;
  return fallback;
}

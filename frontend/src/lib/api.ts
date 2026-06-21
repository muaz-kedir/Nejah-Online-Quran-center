const RENDER_API = 'https://nejah-online-quran-center.onrender.com/api';
const RENDER_ORIGIN = 'https://nejah-online-quran-center.onrender.com';
const LOCAL_API = 'http://localhost:3000/api';
const LOCAL_ORIGIN = 'http://localhost:3000';

/** Prefer VITE_API_URL when set (Vercel/local), else dev localhost or Render production. */
export const API_BASE: string = String(
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? LOCAL_API : RENDER_API),
);

export const API_ORIGIN: string = String(
  import.meta.env.VITE_WS_URL || (import.meta.env.DEV ? LOCAL_ORIGIN : RENDER_ORIGIN),
).replace(/\/$/, '');

export const WS_URL = API_ORIGIN;

export function apiAssetUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return API_ORIGIN + (path.startsWith('/') ? path : '/' + path);
}

export function apiHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: 'Bearer ' + token } : {}),
  };
}

export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : '/' + path;
  return API_BASE + normalized;
}

export function clearAuthStorage() {
  localStorage.removeItem('token');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userName');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userId');
  localStorage.removeItem('studentId');
}

export async function api<T = any>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), {
    ...options,
    headers: { ...apiHeaders(), ...options?.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (
      res.status === 401 &&
      typeof window !== 'undefined' &&
      !window.location.pathname.includes('/login')
    ) {
      clearAuthStorage();
      window.location.assign('/login?reason=session_expired');
    }
    throw new Error(formatApiError(body, 'Request failed: ' + res.status));
  }
  return body as T;
}

/** NestJS validation errors return message as a string or string[]. */
export function formatApiError(data: unknown, fallback = 'Something went wrong'): string {
  if (!data || typeof data !== 'object') return fallback;
  const message = (data as { message?: unknown }).message;
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string' && message.trim()) return message;
  return fallback;
}

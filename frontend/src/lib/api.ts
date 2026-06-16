const PRODUCTION_API_BASE = 'https://nejah-online-quran-center.onrender.com/api';
const PRODUCTION_WS_ORIGIN = 'https://nejah-online-quran-center.onrender.com';
const LOCAL_API_BASE = 'http://localhost:3000/api';
const LOCAL_WS_ORIGIN = 'http://localhost:3000';

function resolveEnvUrl(value: unknown, fallback: string): string {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed && trimmed !== 'undefined') {
      return trimmed;
    }
  }
  return fallback;
}

const isProd = import.meta.env.PROD;
const defaultApi = isProd ? PRODUCTION_API_BASE : LOCAL_API_BASE;
const defaultWs = isProd ? PRODUCTION_WS_ORIGIN : LOCAL_WS_ORIGIN;

export const API_BASE = resolveEnvUrl(import.meta.env.VITE_API_URL, defaultApi);

/** Backend origin without the `/api` suffix — used for uploaded assets and WebSockets. */
export const API_ORIGIN = resolveEnvUrl(import.meta.env.VITE_WS_URL, defaultWs).replace(/\/$/, '');

export const WS_URL = resolveEnvUrl(import.meta.env.VITE_WS_URL, API_ORIGIN);

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

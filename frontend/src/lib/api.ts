const RENDER_API = 'https://nejah-online-quran-center.onrender.com/api';
const RENDER_ORIGIN = 'https://nejah-online-quran-center.onrender.com';
const LOCAL_API = 'http://localhost:3000/api';
const LOCAL_ORIGIN = 'http://localhost:3000';

/** Ensure URL has protocol prefix */
function ensureProtocol(url: string): string {
  if (!url) return url;
  // If the URL doesn't start with http:// or https://, add https://
  if (!/^https?:\/\//i.test(url)) {
    return 'https://' + url;
  }
  return url;
}

/** Prefer VITE_API_URL when set (Vercel/local), else dev localhost or Render production. */
export const API_BASE: string = ensureProtocol(String(
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? LOCAL_API : RENDER_API),
));

export const API_ORIGIN: string = ensureProtocol(String(
  import.meta.env.VITE_WS_URL || (import.meta.env.DEV ? LOCAL_ORIGIN : RENDER_ORIGIN),
)).replace(/\/$/, '');

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
  window.dispatchEvent(new Event('auth-changed'));
}

function shouldForceLogout(status: number, body: unknown): boolean {
  if (status !== 401) return false;
  const message = formatApiError(body, '').toLowerCase();
  // Third-party auth failures (e.g. Zoom S2S) must not clear the user's app login.
  if (message.includes('zoom')) return false;
  return true;
}

export async function api<T = any>(path: string, options?: RequestInit & { timeout?: number }): Promise<T> {
  const ms = options?.timeout ?? 30000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(apiUrl(path), {
      ...options,
      signal: controller.signal,
      headers: { ...apiHeaders(), ...options?.headers },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (
        shouldForceLogout(res.status, body) &&
        typeof window !== 'undefined' &&
        !window.location.pathname.includes('/login')
      ) {
        clearAuthStorage();
        import('./push-notifications').then(m =>
          m.unsubscribeFromPushNotifications().catch(() => {}),
        );
        window.location.assign('/login?reason=session_expired');
      }
      throw new Error(formatApiError(body, 'Request failed: ' + res.status));
    }
    return body as T;
  } finally {
    clearTimeout(timer);
  }
}

/** NestJS validation errors return message as a string or string[]. */
export function formatApiError(data: unknown, fallback = 'Something went wrong'): string {
  if (!data || typeof data !== 'object') return fallback;
  const message = (data as { message?: unknown }).message;
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string' && message.trim()) return message;
  return fallback;
}

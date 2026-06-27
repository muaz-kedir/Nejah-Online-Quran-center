import { getToken, onMessage, deleteToken } from 'firebase/messaging';
import { api } from '@/lib/api';
import { initFirebase, getFirebaseMessaging } from '@/lib/firebase';

let currentToken: string | null = null;

function getTokenFromStorage(): string | null {
  try { return localStorage.getItem('fcmToken'); } catch { return null; }
}

function saveTokenToStorage(token: string) {
  try { localStorage.setItem('fcmToken', token); } catch { }
}

function removeTokenFromStorage() {
  try { localStorage.removeItem('fcmToken'); } catch { }
}

async function waitForActiveSw(ms = 30000): Promise<ServiceWorkerRegistration | null> {
  try {
    const ready = await navigator.serviceWorker.ready;
    if (ready.active) return ready;
    return new Promise<ServiceWorkerRegistration | null>((resolve) => {
      const worker = ready.installing || ready.waiting;
      if (!worker) return resolve(null);
      worker.addEventListener('statechange', () => {
        if (worker.state === 'activated') resolve(ready);
      });
      setTimeout(() => resolve(ready.active ? ready : null), ms);
    });
  } catch {
    return null;
  }
}

export async function initializeFcm(): Promise<boolean> {
  const supported = await initFirebase();
  if (!supported) return false;
  if (!localStorage.getItem('token')) return false;
  return registerFcmToken();
}

export async function registerFcmToken(): Promise<boolean> {
  const messaging = getFirebaseMessaging();
  if (!messaging) return false;

  if (!localStorage.getItem('token')) return false;

  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!vapidKey) {
    console.warn('[FCM] VAPID key missing');
    return false;
  }

  const existing = getTokenFromStorage();
  if (existing) {
    currentToken = existing;
    return true;
  }

  const registration = await waitForActiveSw(30000);
  if (!registration) {
    console.warn('[FCM] No active SW after waiting');
    return false;
  }

  try {
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!token) return false;

    await api('/fcm/tokens', {
      method: 'POST',
      body: JSON.stringify({
        fcmToken: token,
        deviceInfo: navigator.userAgent,
        platform: 'web',
      }),
    });

    currentToken = token;
    saveTokenToStorage(token);
    return true;
  } catch (err) {
    console.warn('[FCM] getToken failed:', err);
    return false;
  }
}

export async function unregisterFcmToken(): Promise<boolean> {
  try {
    const storedToken = getTokenFromStorage();
    if (storedToken) {
      try {
        await api('/fcm/tokens', {
          method: 'DELETE',
          body: JSON.stringify({ fcmToken: storedToken }),
        });
      } catch { }
      const messaging = getFirebaseMessaging();
      if (messaging) {
        try { await deleteToken(messaging); } catch { }
      }
      removeTokenFromStorage();
    }
    try { await api('/fcm/tokens/all', { method: 'DELETE' }); } catch { }
    currentToken = null;
    return true;
  } catch {
    return false;
  }
}

export function getCurrentFcmToken(): string | null {
  return currentToken || getTokenFromStorage();
}

export function setupForegroundListener(
  onMessageReceived: (payload: {
    title?: string; body?: string; data?: Record<string, string>; clickAction?: string;
  }) => void,
): (() => void) | null {
  const messaging = getFirebaseMessaging();
  if (!messaging) return null;

  const unsubscribe = onMessage(messaging, (payload) => {
    const notification = payload.notification;
    const data = payload.data || {};
    onMessageReceived({
      title: notification?.title || data.title || 'Nejah',
      body: notification?.body || data.body || '',
      data,
      clickAction: data.clickAction || '/',
    });
  });

  return unsubscribe;
}

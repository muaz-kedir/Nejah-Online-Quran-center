import { getToken, onMessage, type Messaging } from 'firebase/messaging';
import { api } from '@/lib/api';
import { initFirebase, getFirebaseMessaging, isMessagingSupported } from '@/lib/firebase';

let currentToken: string | null = null;

function getTokenFromStorage(): string | null {
  try {
    return localStorage.getItem('fcmToken');
  } catch {
    return null;
  }
}

function saveTokenToStorage(token: string) {
  try {
    localStorage.setItem('fcmToken', token);
  } catch { }
}

function removeTokenFromStorage() {
  try {
    localStorage.removeItem('fcmToken');
  } catch { }
}

export async function initializeFcm(): Promise<boolean> {
  const supported = await initFirebase();
  if (!supported) return false;
  if (!localStorage.getItem('token')) return false;
  return registerFcmToken();
}

export async function registerFcmToken(): Promise<boolean> {
  try {
    const messaging = getFirebaseMessaging();
    if (!messaging || !isMessagingSupported()) return false;

    const tokenStr = localStorage.getItem('token');
    if (!tokenStr) return false;

    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidKey) return false;

    const token = await getToken(messaging, { vapidKey });

    if (!token) return false;

    const stored = getTokenFromStorage();
    if (stored === token) return true;

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
  } catch {
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
      removeTokenFromStorage();
    }

    try {
      await api('/fcm/tokens/all', { method: 'DELETE' });
    } catch { }

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
    title?: string;
    body?: string;
    data?: Record<string, string>;
    clickAction?: string;
  }) => void,
): (() => void) | null {
  const messaging = getFirebaseMessaging();
  if (!messaging || !isMessagingSupported()) return null;

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

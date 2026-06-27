import { api } from '@/lib/api';
import {
  registerFcmToken,
  unregisterFcmToken,
  getCurrentFcmToken,
  setupForegroundListener,
} from '@/lib/fcm';
import { initFirebase } from '@/lib/firebase';

function getFirebaseConfig(): Record<string, string> | null {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (!apiKey || !projectId) return null;
  return {
    apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
    projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)),
  ]);
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;

  try {
    const config = getFirebaseConfig();
    const configParam = config
      ? '?config=' + encodeURIComponent(JSON.stringify(config))
      : '';

    const existing = await navigator.serviceWorker.getRegistration('/');
    if (existing) {
      const swUrl = existing.active?.scriptURL || '';
      if (swUrl.includes('firebase-messaging-sw.js')) {
        return existing;
      }
    }
    return await navigator.serviceWorker.register('/firebase-messaging-sw.js' + configParam, {
      scope: '/',
    });
  } catch (error) {
    console.warn('Service worker registration failed', error);
    return null;
  }
}

export async function subscribeToPushNotifications(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }
  if (!localStorage.getItem('token')) return false;

  try {
    const permission = await withTimeout(Notification.requestPermission(), 15000);
    if (permission !== 'granted') return false;

    await withTimeout(registerServiceWorker(), 10000).catch(() => null);

    const fcmOk = await withTimeout(registerFcmToken(), 15000);
    if (fcmOk) return true;

    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidKey) return false;

    const registration = await withTimeout(navigator.serviceWorker.ready, 10000).catch(() => null);
    if (!registration) return false;
    const existing = await registration.pushManager.getSubscription();
    if (existing) await existing.unsubscribe();

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as BufferSource,
    });

    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;

    await api('/push-notifications/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        subscription: { endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } },
        deviceInfo: navigator.userAgent,
      }),
    });

    return true;
  } catch (err) {
    console.warn('subscribeToPushNotifications error:', err);
    return false;
  }
}

export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    await unregisterFcmToken();

    const registration = await withTimeout(navigator.serviceWorker.ready, 10000).catch(() => null);
    if (!registration) return true;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return true;

    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();

    if (localStorage.getItem('token')) {
      await api('/push-notifications/unsubscribe', {
        method: 'DELETE',
        body: JSON.stringify({ endpoint }),
      });
    }

    return true;
  } catch {
    return false;
  }
}

export async function initializePwaPush(): Promise<boolean> {
  await initFirebase();
  await withTimeout(registerServiceWorker(), 10000).catch(() => null);
  if (!localStorage.getItem('token')) return false;
  if (!('Notification' in window) || Notification.permission !== 'granted') return false;

  const existingFcm = getCurrentFcmToken();
  if (existingFcm) return true;

  try {
    const registration = await withTimeout(navigator.serviceWorker.ready, 10000).catch(() => null);
    if (registration) {
      const existingSub = await registration.pushManager.getSubscription();
      if (existingSub) return true;
    }
  } catch { }

  const fcmOk = await withTimeout(registerFcmToken(), 15000).catch(() => false);
  if (fcmOk) return true;

  try {
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidKey) return false;
    const reg = await withTimeout(navigator.serviceWorker.ready, 10000).catch(() => null);
    if (!reg) return false;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as BufferSource,
    });
    const json = sub.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;
    await api('/push-notifications/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        subscription: { endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } },
        deviceInfo: navigator.userAgent,
      }),
    });
    return true;
  } catch {
    return false;
  }
}

export { setupForegroundListener, getCurrentFcmToken };

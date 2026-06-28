import { api } from '@/lib/api';
import {
  registerFcmToken,
  unregisterFcmToken,
  getCurrentFcmToken,
  setupForegroundListener,
} from '@/lib/fcm';
import { initFirebase } from '@/lib/firebase';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function getFirebaseConfigForSw(): string {
  const config: Record<string, string> = {};
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (!apiKey || !projectId) return '';
  config.apiKey = apiKey;
  config.authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`;
  config.projectId = projectId;
  config.storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`;
  config.messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '';
  config.appId = import.meta.env.VITE_FIREBASE_APP_ID || '';
  return encodeURIComponent(JSON.stringify(config));
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)),
  ]);
}

async function waitForServiceWorkerReady(ms = 30000): Promise<ServiceWorkerRegistration | null> {
  try {
    const registration = await withTimeout(navigator.serviceWorker.ready, ms);
    if (registration.active) return registration;
    return null;
  } catch {
    return null;
  }
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;

  try {
    const isDev = import.meta.env.DEV;
    const query = isDev ? '?config=' + getFirebaseConfigForSw() : '';
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js' + query, {
      scope: '/',
      updateViaCache: 'none',
    });
    registration.update().catch(() => {});
    const swReady = await waitForServiceWorkerReady(30000);
    return swReady;
  } catch (error) {
    console.warn('SW registration failed', error);
    return null;
  }
}

export async function subscribeToPushNotifications(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }
  if (!localStorage.getItem('token')) return false;

  try {
    const permission = await withTimeout(Notification.requestPermission(), 30000);
    if (permission !== 'granted') return false;

    const registration = await registerServiceWorker();
    if (!registration) return false;

    const fcmOk = await withTimeout(registerFcmToken(), 30000);
    if (fcmOk) return true;

    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidKey) return false;

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

    const registration = await waitForServiceWorkerReady(10000);
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
  await registerServiceWorker();
  if (!localStorage.getItem('token')) return false;
  if (!('Notification' in window) || Notification.permission !== 'granted') return false;

  const existingFcm = getCurrentFcmToken();
  if (existingFcm) return true;

  const registration = await waitForServiceWorkerReady(15000);
  if (registration) {
    const existingSub = await registration.pushManager.getSubscription();
    if (existingSub) return true;
  }

  const fcmOk = await registerFcmToken();
  if (fcmOk) return true;

  if (!registration) return false;

  try {
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidKey) return false;
    const sub = await registration.pushManager.subscribe({
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

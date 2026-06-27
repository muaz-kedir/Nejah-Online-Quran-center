import { api } from '@/lib/api';
import {
  initializeFcm,
  registerFcmToken,
  unregisterFcmToken,
  getCurrentFcmToken,
  setupForegroundListener,
} from '@/lib/fcm';

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

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;

  try {
    const config = getFirebaseConfig();
    const configParam = config
      ? '?config=' + encodeURIComponent(JSON.stringify(config))
      : '';
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

  const token = localStorage.getItem('token');
  if (!token) return false;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return false;
  }

  await registerServiceWorker();

  const fcmOk = await registerFcmToken();
  if (fcmOk) return true;

  // Fallback: if FCM not configured, use standard web push
  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!vapidKey) return false;

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    await existing.unsubscribe();
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as BufferSource,
  });

  const subscriptionJson = subscription.toJSON();
  if (!subscriptionJson.endpoint || !subscriptionJson.keys?.p256dh || !subscriptionJson.keys?.auth) {
    return false;
  }

  await api('/push-notifications/subscribe', {
    method: 'POST',
    body: JSON.stringify({
      subscription: {
        endpoint: subscriptionJson.endpoint,
        keys: {
          p256dh: subscriptionJson.keys.p256dh,
          auth: subscriptionJson.keys.auth,
        },
      },
      deviceInfo: navigator.userAgent,
    }),
  });

  return true;
}

export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    await unregisterFcmToken();

    const registration = await navigator.serviceWorker.ready;
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
  await registerServiceWorker();
  if (!localStorage.getItem('token')) return false;

  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  const fcmOk = await initializeFcm();
  if (fcmOk) return true;

  try {
    const registration = await navigator.serviceWorker.ready;
    const existingSub = await registration.pushManager.getSubscription();
    if (existingSub) return true;
  } catch { }

  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!vapidKey) return false;

  const reg = await navigator.serviceWorker.ready;
  const subscription = await reg.pushManager.subscribe({
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
}

export { setupForegroundListener, getCurrentFcmToken };

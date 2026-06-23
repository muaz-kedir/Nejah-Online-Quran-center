import { api, apiUrl } from '@/lib/api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

async function fetchVapidPublicKey(): Promise<string | null> {
  try {
    const response = await fetch(apiUrl('/push-notifications/vapid-public-key'));
    if (!response.ok) return null;
    const data = await response.json();
    return data.publicKey || null;
  } catch {
    return import.meta.env.VITE_VAPID_PUBLIC_KEY || null;
  }
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;

  try {
    return await navigator.serviceWorker.register('/sw.js', { scope: '/' });
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

  const publicKey = await fetchVapidPublicKey();
  if (!publicKey) {
    console.warn('VAPID public key unavailable');
    return false;
  }

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    await existing.unsubscribe();
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
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
  if (localStorage.getItem('token')) {
    return await subscribeToPushNotifications();
  }
  return false;
}

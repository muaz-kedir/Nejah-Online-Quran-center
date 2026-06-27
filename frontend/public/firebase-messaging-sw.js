importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-messaging-compat.js');

const CACHE_NAME = 'nejah-pwa-v3';
const STATIC_URLS = ['/', '/offline'];

const configParam = new URLSearchParams(self.location.search).get('config');
let firebaseInitialized = false;

if (configParam) {
  try {
    const config = JSON.parse(decodeURIComponent(configParam));
    firebase.initializeApp(config);
    firebaseInitialized = true;
  } catch (e) {
    console.error('[FCM SW] Failed to parse Firebase config:', e);
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        if (response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    }).catch(() => caches.match('/offline')),
  );
});

if (firebaseInitialized) {
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const notification = payload.notification || {};
    const data = payload.data || {};

    const title = notification.title || data.title || 'Nejah Online Quran Center';
    const body = notification.body || data.body || '';
    const icon = notification.icon || data.icon || '/logo.png';
    const badge = data.badge || '/logo.png';
    const tag = data.tag || 'nejah-notification';
    const clickAction = data.clickAction || '/';
    let actions = [];

    try {
      if (data.actions) {
        actions = JSON.parse(data.actions);
      }
    } catch { }

    if (actions.length === 0) {
      actions = [
        { action: 'view', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' },
      ];
    }

    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      tag,
      requireInteraction: true,
      renotify: data.renotify === 'true',
      data: {
        ...data,
        url: clickAction,
        clickAction,
      },
      actions,
    });
  });
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const data = event.notification.data || {};
  let url = data.url || data.clickAction || '/';

  if (url.startsWith('http')) {
    event.waitUntil(clients.openWindow(url));
    return;
  }

  const absoluteUrl = new URL(url, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(absoluteUrl);
      }
    }),
  );
});

importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-messaging-compat.js');
importScripts('/sw-shared.js');

var CACHE_NAME = 'nejah-pwa-v6';
var STATIC_URLS = ['/offline.html'];

function cacheStaticUrls(cache, urls) {
  return Promise.all(
    urls.map(function (url) {
      return cache.add(url).catch(function (err) {
        console.warn('[FCM SW] Could not cache:', url, err);
      });
    }),
  );
}

registerSafeFetchHandler();

var FIREBASE_CONFIG_JSON = '__FIREBASE_CONFIG_JSON__';
var firebaseInitialized = false;

try {
  if (FIREBASE_CONFIG_JSON !== '__FIREBASE_CONFIG_JSON__') {
    firebase.initializeApp(JSON.parse(FIREBASE_CONFIG_JSON));
    firebaseInitialized = true;
  }
} catch (e) {
  console.error('[FCM SW] baked config failed:', e);
}

if (!firebaseInitialized) {
  try {
    var configParam = new URLSearchParams(self.location.search).get('config');
    if (configParam) {
      firebase.initializeApp(JSON.parse(decodeURIComponent(configParam)));
      firebaseInitialized = true;
    }
  } catch (e) {
    console.error('[FCM SW] query config failed:', e);
  }
}

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) { return cacheStaticUrls(cache, STATIC_URLS); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE_NAME; }).map(function (k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

if (firebaseInitialized) {
  var messaging = firebase.messaging();

  messaging.onBackgroundMessage(function (payload) {
    var notification = payload.notification || {};
    var data = payload.data || {};
    var title = notification.title || data.title || 'Nejah Online Quran Center';
    var body = notification.body || data.body || '';
    var icon = notification.icon || data.icon || '/logo.png';
    var badge = data.badge || '/logo.png';
    var tag = data.tag || 'nejah-notification';
    var clickAction = data.clickAction || '/';
    var actions = [];
    try { if (data.actions) { actions = JSON.parse(data.actions); } } catch (e) { }
    if (actions.length === 0) {
      actions = [
        { action: 'view', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' },
      ];
    }
    showNotif(title, {
      body: body,
      icon: icon,
      badge: badge,
      tag: tag,
      requireInteraction: true,
      renotify: data.renotify === 'true',
      data: Object.assign({}, data, { url: clickAction, clickAction: clickAction }),
      actions: actions,
    });
  });
}

function showNotif(title, options) {
  try {
    self.registration.showNotification(title, options);
  } catch (_) { /* permission not granted */ }
}

self.addEventListener('push', function (event) {
  if (!event.data) return;

  try {
    var payload = event.data.json();
    if (payload && payload.title) {
      var title = payload.title;
      var options = {
        body: payload.body || '',
        icon: payload.icon || '/logo.png',
        badge: payload.badge || '/logo.png',
        tag: payload.tag || 'nejah-notification',
        data: payload.data || {},
        requireInteraction: true,
        renotify: !!payload.renotify,
        actions: payload.actions && payload.actions.length > 0
          ? payload.actions
          : [{ action: 'view', title: 'View' }, { action: 'dismiss', title: 'Dismiss' }],
      };
      event.waitUntil(Promise.resolve(showNotif(title, options)));
      return;
    }
  } catch (_) { /* not JSON — fall through to plain text */ }

  event.waitUntil(
    Promise.resolve(
      showNotif('Nejah Online Quran Center', {
        body: event.data.text(),
        icon: '/logo.png',
        badge: '/logo.png',
      }),
    ),
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  if (event.action === 'dismiss') return;
  var data = event.notification.data || {};
  var url = data.url || data.clickAction || '/';
  if (url.startsWith('http')) {
    event.waitUntil(clients.openWindow(url));
    return;
  }
  var absoluteUrl = new URL(url, self.location.origin).href;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
      for (var i = 0; i < windowClients.length; i++) {
        if (windowClients[i].url.indexOf(url) !== -1 && 'focus' in windowClients[i]) {
          return windowClients[i].focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(absoluteUrl);
      }
    })
  );
});

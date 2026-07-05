importScripts("/sw-shared.js");

const CACHE_NAME = "nejah-pwa-v4";
const STATIC_URLS = ["/offline.html"];

function cacheStaticUrls(cache, urls) {
  return Promise.all(
    urls.map((url) =>
      cache.add(url).catch((err) => {
        console.warn("[SW] Could not cache:", url, err);
      }),
    ),
  );
}

registerSafeFetchHandler();

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cacheStaticUrls(cache, STATIC_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || "Nejah Online Quran Center";
    const targetUrl = data.url || data.data?.url || "/";

    event.waitUntil(
      self.registration.showNotification(title, {
        body: data.body || data.message || "",
        icon: data.icon || "/logo.png",
        badge: data.badge || "/logo.png",
        tag: data.tag || "nejah-notification",
        requireInteraction: true,
        renotify: data.renotify || false,
        data: {
          ...(data.data || {}),
          url: targetUrl,
        },
        actions: data.actions || [
          { action: "join", title: "▶ Join Class" },
          { action: "dismiss", title: "Dismiss" },
        ],
      }),
    );
  } catch {
    event.waitUntil(
      self.registration.showNotification("Nejah Online Quran Center", {
        body: event.data.text(),
        icon: "/logo.png",
        badge: "/logo.png",
      }),
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const data = event.notification.data || {};
  let url = data.url || "/";

  if (url.startsWith("http")) {
    event.waitUntil(clients.openWindow(url));
    return;
  }

  const absoluteUrl = new URL(url, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(absoluteUrl);
      }
    }),
  );
});

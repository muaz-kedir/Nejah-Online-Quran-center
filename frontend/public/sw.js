const CACHE_NAME = "nejah-pwa-v1";
const STATIC_URLS = ["/", "/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_URLS);
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
    }),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        if (response.status === 200 && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    }).catch(() => caches.match("/offline")),
  );
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const title = data.title || "Nejah Online Quran Center";
    const options = {
      body: data.body || data.message || "",
      icon: data.icon || "/logo.png",
      badge: "/logo.png",
      vibrate: [200, 100, 200],
      data: data.data || {},
      actions: data.actions || [
        { action: "open", title: "View" },
      ],
      tag: data.tag || "default",
      renotify: data.renotify || false,
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch {
    const title = "Nejah Online Quran Center";
    const options = {
      body: typeof event.data === "string" ? event.data : "New notification",
      icon: "/logo.png",
      badge: "/logo.png",
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data;
  const action = event.action;
  let url = "/";
  if (action === "open" && data) {
    if (data.sessionId) {
      const role = data.role || "student";
      if (role === "student") {
        url = `/class-session/${data.sessionId}`;
      } else {
        url = `/live-sessions/${data.sessionId}`;
      }
    } else if (data.url) {
      url = data.url;
    }
  }
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      if (windowClients.length > 0) {
        const matchingClient = windowClients.find((c) => c.url.includes(url));
        if (matchingClient) {
          matchingClient.focus();
          matchingClient.navigate(url);
          return;
        }
      }
      clients.openWindow(url);
    }),
  );
});

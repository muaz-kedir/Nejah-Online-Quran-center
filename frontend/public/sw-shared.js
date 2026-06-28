/**
 * Safe fetch handling for Vite SPAs behind a service worker.
 * Never cache-first hashed /assets/* bundles — that breaks dynamic imports after deploy.
 */
function shouldBypassServiceWorker(url) {
  return (
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/@") ||
    url.pathname.includes("__vite") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".map") ||
    url.pathname.endsWith(".wasm")
  );
}

function registerSafeFetchHandler() {
  self.addEventListener("fetch", function (event) {
    if (event.request.method !== "GET") return;

    var url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;

    if (shouldBypassServiceWorker(url)) return;

    if (event.request.mode === "navigate" || event.request.destination === "document") {
      event.respondWith(
        fetch(event.request).catch(function () {
          return caches.match("/offline.html");
        }),
      );
      return;
    }

    if (url.pathname === "/offline.html") {
      event.respondWith(
        caches.match(event.request).then(function (cached) {
          return cached || fetch(event.request);
        }),
      );
    }
  });
}

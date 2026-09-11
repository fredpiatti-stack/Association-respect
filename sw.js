// This service worker is retired: no page on the site registers it anymore.
// Any browser where it's still active from an older version of the site
// needs to unregister it so it stops intercepting requests and serving
// stale, cached content instead of the live page.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll())
      .then((clients) => clients.forEach((client) => client.navigate(client.url)))
  );
});

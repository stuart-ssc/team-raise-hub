// Kill-switch service worker: clears caches, unregisters itself, and reloads open clients.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((client) => {
        try { client.navigate(client.url); } catch (e) {}
      });
    } catch (e) {
      // no-op
    }
  })());
});
self.addEventListener('fetch', () => {});

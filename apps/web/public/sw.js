/* Retira a PWA anterior. Não registrar este worker na aplicação nova. */
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const scope = self.registration.scope;
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('workbox-') && name.includes(scope)).map(name => caches.delete(name)));
    await self.clients.claim();
    await self.registration.unregister();
    const windows = await self.clients.matchAll({ type: 'window' });
    await Promise.all(windows.filter(client => {
      const url = new URL(client.url);
      return url.origin === self.location.origin && url.pathname === '/';
    }).map(client => client.navigate(client.url)));
  })());
});

/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope;

clientsClaim();
void self.skipWaiting();

// Precache and clean up old caches
cleanupOutdatedCaches();
void precacheAndRoute(self.__WB_MANIFEST);

// Cache-first strategy for static assets
registerRoute(
  ({ request }) => ['image', 'font', 'style'].includes(request.destination),
  new CacheFirst({
    cacheName: 'assets-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 })],
  }),
);

// Network-first strategy for navigation
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: 'pages-cache',
      plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 7 * 24 * 60 * 60 })],
    }),
    {
      denylist: [/^\/api\//],
    },
  ),
);

// Skip waiting and claim clients on install
self.addEventListener('install', () => {
  void self.skipWaiting();
});
self.addEventListener('activate', () => {
  void self.clients.claim();
});

// Handle messages from clients (update available)
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const data = event.data as Record<string, string> | null;
  if (data && data.type === 'SKIP_WAITING') {
    void self.skipWaiting();
  }
});

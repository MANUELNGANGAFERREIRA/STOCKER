const CACHE_PREFIX = 'conexore-pwa-';
const CACHE_STATIC = `${CACHE_PREFIX}static-v1`;
const CACHE_PAGES = `${CACHE_PREFIX}pages-v1`;
const OFFLINE_PAGE = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then((cache) => cache.addAll([
        OFFLINE_PAGE,
        '/manifest.webmanifest',
        '/icons/icon-192.png',
        '/icons/icon-512.png',
      ]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_STATIC && key !== CACHE_PAGES)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Firebase requests and all third-party requests are left to their SDKs.
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const pages = await caches.open(CACHE_PAGES);
      try {
        const response = await fetch(request);
        if (response.ok) await pages.put(request, response.clone());
        return response;
      } catch {
        return (await pages.match(request))
          || (await caches.match(OFFLINE_PAGE));
      }
    })());
    return;
  }

  // Next.js emits content-hashed files here; caching them cannot mix versions.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      if (cached) return cached;

      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(CACHE_STATIC);
        await cache.put(request, response.clone());
      }
      return response;
    })());
    return;
  }

  // Exported App Router pages and route payloads are same-origin static app
  // resources. Firebase data/auth requests use other origins and never enter
  // this cache; Firestore keeps responsibility for its own offline data queue.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_PAGES);
    try {
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    } catch {
      const cached = await cache.match(request);
      if (cached) return cached;
      return Response.error();
    }
  })());
});

// Starcharts app-shell service worker (E2 QA: "offline shell renders current
// chart from cached engine"). Hand-rolled, no build-time precache manifest,
// since Next's chunk filenames are content-hashed per build: instead this
// caches the shell on install and opportunistically caches same-origin GET
// responses as they're fetched (stale-while-revalidate), so a repeat or
// offline visit can still render. The clock needs no network to compute a
// chart (astronomy-engine runs entirely client-side), so once the shell JS
// is cached, an offline "/" renders the current chart from the device clock.
const CACHE = 'starcharts-shell-v1';
const SHELL_URLS = ['/', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL_URLS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // never intercept ad/CMP/analytics scripts
  if (url.pathname.startsWith('/api/')) return; // per-visitor routes (e.g. /api/region), never cached

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached || (request.mode === 'navigate' ? caches.match('/') : undefined));
      // Stale-while-revalidate: serve the cache instantly if present, refresh in the background.
      return cached || network;
    }),
  );
});

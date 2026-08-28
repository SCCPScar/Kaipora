// Kaipora — service worker
// Cache-first for the built app shell (hashed JS/CSS get cached the first time
// they're fetched, since Vite generates their names at build time and we can't
// know them up front), network-first for navigations with an offline fallback
// to the cached index.html. Cross-origin requests (Supabase) are never
// intercepted — they always go straight to the network.

const CACHE_VERSION = 'kaipora-v1';
const SCOPE = self.registration.scope; // e.g. https://host/VProject/

const APP_SHELL = [
  SCOPE,
  SCOPE + 'index.html',
  SCOPE + 'manifest.webmanifest',
  SCOPE + 'icons/icon.svg',
  SCOPE + 'icons/icon-192.png',
  SCOPE + 'icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // let Supabase/API calls pass through untouched

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          caches.open(CACHE_VERSION).then((cache) => cache.put(SCOPE + 'index.html', res.clone()));
          return res;
        })
        .catch(() => caches.match(SCOPE + 'index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res.ok) {
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, res.clone()));
          }
          return res;
        })
        .catch(() => cached);
    })
  );
});

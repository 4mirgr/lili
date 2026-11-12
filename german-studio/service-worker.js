const CACHE_NAME = 'lili-deutsch-v9';
const APP_SHELL = [
  './',
  './index.html',
  './app.js?v=9',
  './data.js',
  './curriculum.js',
  './learning-engine.js',
  './beginner-content.js?v=9',
  './study-content.js?v=9',
  './dashboard.css?v=9',
  './supabase-config.js',
  './sync-client.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/favicon-64.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('lili-deutsch-') && k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network-first (with a short timeout for slow connections) so content updates arrive;
// cache fallback keeps it working offline.
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || !request.url.startsWith(self.registration.scope)) return;
  const navigation = request.mode === 'navigate';
  const cacheKey = navigation ? new URL('index.html', self.registration.scope).href : request.url;
  if (!navigation && !APP_SHELL.some((path) => new URL(path, self.registration.scope).href === cacheKey)) return;
  event.respondWith(
    withTimeout(fetch(request), 4000).then(async (response) => {
      if (response.ok) {
        const copy = response.clone();
        await caches.open(CACHE_NAME).then((cache) => cache.put(cacheKey, copy)).catch(() => {});
      }
      return response;
    }).catch(async () => (await caches.open(CACHE_NAME)).match(cacheKey).then((cached) => cached || Response.error()))
  );
});

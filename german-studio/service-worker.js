importScripts('./media-index.js?v=10');
const CACHE_NAME = 'lili-deutsch-v10';
const LESSON_MEDIA = [
  './media/desk-vocabulary.jpg',
  './media/formal-letter.png',
  ...Object.values(globalThis.LILI_AUDIO).map((path) => './' + path)
];
const APP_SHELL = [
  './',
  './index.html',
  './app.js?v=10',
  './data.js',
  './curriculum.js',
  './learning-engine.js',
  './beginner-content.js?v=9',
  './study-content.js?v=10',
  './course.js?v=10',
  './media-index.js?v=10',
  './dashboard.css?v=10',
  './supabase-config.js',
  './sync-client.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/favicon-64.png',
  './icons/apple-touch-icon.png',
  ...LESSON_MEDIA
];
const scope = self.registration.scope;
const indexUrl = new URL('index.html', scope);
const entryPaths = new Set([new URL(scope).pathname, indexUrl.pathname]);
const appUrls = new Set(APP_SHELL.map((path) => new URL(path, scope).href));
const mediaUrls = new Set(LESSON_MEDIA.map((path) => new URL(path, scope).href));

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

async function getMedia(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request.url);
  if (!cached) return fetch(request);
  const range = request.headers.get('range')?.match(/^bytes=(\d*)-(\d*)$/);
  if (!range || (!range[1] && !range[2])) return cached;
  const blob = await cached.blob();
  const start = range[1] ? Number(range[1]) : Math.max(0, blob.size - Number(range[2]));
  const end = range[1] && range[2] ? Math.min(Number(range[2]), blob.size - 1) : blob.size - 1;
  if (start > end) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${blob.size}` } });
  const body = blob.slice(start, end + 1, blob.type);
  return new Response(body, {
    status: 206,
    headers: {
      'Content-Type': blob.type || 'audio/mpeg',
      'Content-Length': String(body.size),
      'Content-Range': `bytes ${start}-${end}/${blob.size}`,
      'Accept-Ranges': 'bytes'
    }
  });
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || !request.url.startsWith(scope)) return;
  if (mediaUrls.has(request.url)) {
    event.respondWith(getMedia(request));
    return;
  }
  const navigation = request.mode === 'navigate';
  if (navigation && !entryPaths.has(new URL(request.url).pathname)) return;
  const cacheKey = navigation ? indexUrl.href : request.url;
  if (!navigation && !appUrls.has(cacheKey)) return;
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

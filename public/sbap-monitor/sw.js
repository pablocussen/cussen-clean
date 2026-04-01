// SBAP Monitor — Service Worker v3.5
const CACHE = 'sbap-v48';
const STATIC = [
  './style.css?v=48', './app.js?v=48', './manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC.filter(u => !u.startsWith('https://fonts')))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // Never intercept API, satellite tiles, auth, or external services
  if (url.includes('run.app') || url.includes('gibs.earthdata') ||
      url.includes('earthengine.googleapis.com') || url.includes('api.open-meteo') ||
      url.includes('arcgisonline.com') || url.includes('cartocdn.com') ||
      url.includes('accounts.google.com')) return;

  // HTML always network-first — ensures updates reach users immediately
  if (e.request.headers.get('accept') && e.request.headers.get('accept').includes('text/html')) {
    e.respondWith(fetch(e.request).catch(() => caches.match('./index.html')));
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).then(r => {
        if (r.ok) caches.open(CACHE).then(c => c.put(e.request, r.clone()));
        return r;
      }).catch(() => caches.match('./index.html'))
    )
  );
});

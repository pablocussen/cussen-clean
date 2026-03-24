const CACHE_NAME = 'kitespot-v3.0';
const CDN_ASSETS = [
  'https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
];
const APP_ASSETS = ['/wind/', '/wind/index.html', '/wind/manifest.json', '/wind/icon.svg'];

const OFFLINE_PAGE = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>KiteSpot - Offline</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,sans-serif;background:#0f172a;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:20px}
.wrap{max-width:400px}h1{font-size:2rem;margin-bottom:12px}p{color:#94a3b8;margin-bottom:24px}button{background:#06b6d4;color:#0f172a;border:none;padding:12px 32px;border-radius:12px;font-size:1rem;font-weight:600;cursor:pointer}
</style></head><body><div class="wrap"><h1>Sin conexion</h1><p>Revisa tu internet e intenta de nuevo. Los datos cacheados pueden estar disponibles.</p><button onclick="location.reload()">Reintentar</button></div></body></html>`;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll([...CDN_ASSETS, ...APP_ASSETS])).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Network only for analytics
  if (url.hostname.includes('google-analytics') || url.hostname.includes('googletagmanager')) return;

  // Cache first for CDN assets
  if (CDN_ASSETS.some(a => e.request.url.startsWith(a.split('?')[0]))) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      return res;
    })));
    return;
  }

  // Network first for API calls and app assets
  e.respondWith(fetch(e.request).then(res => {
    if (res.ok) {
      const clone = res.clone();
      caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
    }
    return res;
  }).catch(() => caches.match(e.request).then(r => {
    if (r) return r;
    if (e.request.mode === 'navigate') return new Response(OFFLINE_PAGE, { headers: { 'Content-Type': 'text/html' } });
    return new Response('Offline', { status: 503 });
  })));
});

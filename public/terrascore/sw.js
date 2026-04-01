const CACHE_NAME = 'terrascore-v2.0';
const STATIC_ASSETS = [
    '/terrascore/',
    '/terrascore/index.html',
    '/terrascore/style.css',
    '/terrascore/app.js',
    '/terrascore/icon.svg',
    '/terrascore/manifest.json'
];

const CDN_ASSETS = [
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap'
];

const OFFLINE_PAGE = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>TerraScore — Sin Conexion</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',-apple-system,sans-serif;background:#0a0e1a;color:#e8eaed;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px;text-align:center}
.wrap{max-width:400px}.icon{font-size:4rem;margin-bottom:20px;animation:float 3s ease-in-out infinite}
h1{font-size:1.5rem;margin-bottom:12px;font-weight:800}p{color:#8892a6;line-height:1.6;margin-bottom:24px}
.btn{display:inline-flex;align-items:center;gap:8px;padding:12px 28px;background:rgba(0,240,255,0.1);border:1px solid rgba(0,240,255,0.3);color:#00f0ff;border-radius:12px;font-family:inherit;font-size:0.9rem;cursor:pointer;transition:all .3s}
.btn:hover{background:rgba(0,240,255,0.2);transform:translateY(-2px)}
.status{margin-top:20px;font-family:'JetBrains Mono',monospace;font-size:0.7rem;color:#8892a6;letter-spacing:1px}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}</style></head>
<body><div class="wrap"><div class="icon">\u{1F30D}</div><h1>Sin Conexion</h1><p>TerraScore necesita conexion a internet para cargar Chart.js y las fuentes. Tus datos estan guardados en localStorage y estaran disponibles cuando vuelvas.</p>
<button class="btn" onclick="location.reload()">\u{21BB} Reintentar</button>
<div class="status">TERRA<span style="color:#00f0ff">SCORE</span> — v2.0</div></div></body></html>`;

// Install: pre-cache static assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate: clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

// Fetch: network first for own assets, cache first for CDN
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // CDN assets: cache first (Chart.js, fonts)
    if (url.hostname.includes('cdn.jsdelivr.net') || url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
        event.respondWith(
            caches.match(event.request).then(cached => {
                if (cached) return cached;
                return fetch(event.request).then(response => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    }
                    return response;
                }).catch(() => new Response('', { status: 408 }));
            })
        );
        return;
    }

    // Analytics: network only, no cache
    if (url.hostname.includes('googletagmanager.com') || url.hostname.includes('google-analytics.com')) {
        event.respondWith(fetch(event.request).catch(() => new Response('', { status: 408 })));
        return;
    }

    // Own assets: network first, cache fallback, offline page last resort
    event.respondWith(
        fetch(event.request)
            .then(response => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() =>
                caches.match(event.request).then(cached => {
                    if (cached) return cached;
                    if (event.request.mode === 'navigate') {
                        return new Response(OFFLINE_PAGE, {
                            headers: { 'Content-Type': 'text/html' }
                        });
                    }
                    return new Response('', { status: 408 });
                })
            )
    );
});

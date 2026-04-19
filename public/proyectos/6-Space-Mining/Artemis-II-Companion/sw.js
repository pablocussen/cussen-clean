// Service Worker — Artemis II Companion PWA
// Cache-first strategy for static assets so the page works offline

const CACHE = 'artemis2-v16';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './assets/trajectory.json',
    './assets/solar_system.json',
    './assets/clpi_art.json',
    './assets/clpi_validation.json',
    './assets/clpi_he3.json',
    './assets/clpi_h2o.json',
    './assets/clpi_art_texture.png',
    './assets/moon_texture_2k.jpg',
    './assets/moon_displacement_2k.jpg',
    './assets/moon_globe.js',
    './assets/fig_artemis2_global.jpg',
    './assets/fig_artemis2_geometry.jpg',
    './assets/fig_clpi_art_global.jpg',
    './assets/fig_clpi_components.jpg',
    './assets/fig_clpi_sensitivity.jpg',
    './assets/fig_clpi_vs_artemis3.jpg',
    './assets/fig_he3_calibration.jpg',
    './assets/fig_he3_clpi.jpg',
    './assets/fig_h2o_global.jpg',
    './assets/fig_h2o_polar.jpg',
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return;
    // Network-first for HTML, cache-first for assets
    const url = new URL(e.request.url);
    if (url.pathname.endsWith('.html') || url.pathname.endsWith('/')) {
        e.respondWith(
            fetch(e.request).then(r => {
                const clone = r.clone();
                caches.open(CACHE).then(c => c.put(e.request, clone));
                return r;
            }).catch(() => caches.match(e.request))
        );
    } else {
        e.respondWith(
            caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
                const clone = resp.clone();
                caches.open(CACHE).then(c => c.put(e.request, clone));
                return resp;
            }))
        );
    }
});

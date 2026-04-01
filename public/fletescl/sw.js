const CACHE_NAME = 'fletescl-v1';
const ASSETS_TO_CACHE = [
  '/fletescl/',
  '/fletescl/index.html',
  '/fletescl/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://fonts.gstatic.com/',
  'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js',
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {
        // Partial cache is OK, don't fail on CDN assets
        return cache.addAll([
          '/fletescl/',
          '/fletescl/index.html',
          '/fletescl/manifest.json',
        ]);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request).then((response) => {
        // Don't cache non-200 responses or non-GET
        if (!response || response.status !== 200) {
          return response;
        }

        // Clone and cache successful responses
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache).catch(() => {
            // Ignore cache write errors
          });
        });

        return response;
      }).catch(() => {
        // Offline fallback - return cached index or error page
        return caches.match('/fletescl/index.html').then((response) => {
          return response || new Response('Offline - Por favor conectate a internet', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain; charset=utf-8'
            })
          });
        });
      });
    })
  );
});

// Background sync for data when back online
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(
      // Data is already in localStorage, just notify client
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SYNC_COMPLETE',
            message: 'Datos sincronizados'
          });
        });
      })
    );
  }
});

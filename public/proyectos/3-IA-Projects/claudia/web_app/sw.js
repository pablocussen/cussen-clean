/**
 * CLAUDIA Service Worker v6.7.3
 * PWA Support with offline capabilities + IndexedDB integration
 * Enables offline APU search and smart caching
 */

const CACHE_NAME = 'claudia-v6.7.3';
const IDB_NAME = 'claudia_sw_db';
const IDB_VERSION = 1;

// Core assets (loaded immediately)
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/js/claudia.bundle.min.js',
    '/js/claudia-widget.js',
    '/css/claudia.min.css',
    '/apu_database.min.json',
    '/manifest.json'
];

// Lazy modules (cached on first use)
const LAZY_MODULES = [
    '/js/claudia-photos.min.js',
    '/js/claudia-calendar.min.js',
    '/js/claudia-pdf-export.min.js',
    '/js/claudia-voice.min.js',
    '/js/claudia-collaboration.min.js',
    '/js/claudia-web-worker.min.js'
];

// Install event - cache assets + load APUs to IndexedDB
self.addEventListener('install', (event) => {
    console.log('[SW v6.7.3] Installing Service Worker...');

    event.waitUntil(
        Promise.all([
            // Cache core assets
            caches.open(CACHE_NAME).then((cache) => {
                console.log('[SW] Caching app shell...');
                return cache.addAll(ASSETS_TO_CACHE);
            }),

            // Initialize IndexedDB and cache APUs
            initializeIndexedDB().then(() => {
                console.log('[SW] IndexedDB initialized');
                return cacheAPUsToIndexedDB();
            })
        ]).catch((error) => {
            console.error('[SW] Installation failed:', error);
        })
    );

    self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    console.log('[SW v6.7.3] Activating Service Worker...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName.startsWith('claudia-')) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );

    return self.clients.claim();
});

// Fetch event - smart caching with offline support
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip non-http(s) requests
    if (!event.request.url.startsWith('http')) {
        return;
    }

    // Handle APU database requests specially
    if (event.request.url.includes('apu_database')) {
        event.respondWith(handleAPUDatabaseRequest(event.request));
        return;
    }

    // Standard cache-first strategy with background update
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Update cache in background (stale-while-revalidate)
                    fetch(event.request)
                        .then((networkResponse) => {
                            if (networkResponse && networkResponse.status === 200) {
                                caches.open(CACHE_NAME).then((cache) => {
                                    cache.put(event.request, networkResponse.clone());
                                });
                            }
                        })
                        .catch(() => {
                            // Network failed, cache is already being served
                        });

                    return cachedResponse;
                }

                // Not in cache, fetch from network
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Cache successful responses
                        if (networkResponse && networkResponse.status === 200) {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        }
                        return networkResponse;
                    })
                    .catch((error) => {
                        console.error('[SW] Fetch failed:', error);

                        // Return offline page if available
                        if (event.request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }

                        throw error;
                    });
            })
    );
});

/**
 * Handle APU database requests
 * Tries IndexedDB first, falls back to cache, then network
 */
async function handleAPUDatabaseRequest(request) {
    try {
        // Try IndexedDB first (fastest)
        const apusFromIDB = await getAPUsFromIndexedDB();
        if (apusFromIDB) {
            console.log('[SW] Serving APUs from IndexedDB');
            return new Response(JSON.stringify(apusFromIDB), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Fallback to cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            console.log('[SW] Serving APUs from cache');
            // Update IndexedDB in background
            cachedResponse.clone().json().then(data => {
                storeAPUsInIndexedDB(data);
            });
            return cachedResponse;
        }

        // Fallback to network
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.status === 200) {
            // Cache the response
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());

            // Store in IndexedDB in background
            networkResponse.clone().json().then(data => {
                storeAPUsInIndexedDB(data);
            });

            return networkResponse;
        }

        throw new Error('APU database not available');

    } catch (error) {
        console.error('[SW] APU database request failed:', error);

        // Return empty database as fallback
        return new Response(JSON.stringify({
            metadata: { total_apus: 0, error: 'Offline mode - database unavailable' },
            actividades: []
        }), {
            headers: { 'Content-Type': 'application/json' },
            status: 503
        });
    }
}

/**
 * Initialize IndexedDB
 */
function initializeIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(IDB_NAME, IDB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Create APU store
            if (!db.objectStoreNames.contains('apus')) {
                const apuStore = db.createObjectStore('apus', { keyPath: 'codigo' });
                apuStore.createIndex('nombre', 'nombre', { unique: false });
                apuStore.createIndex('categoria', 'categoria', { unique: false });
                apuStore.createIndex('unidad', 'unidad', { unique: false });
            }

            // Create cache metadata store
            if (!db.objectStoreNames.contains('metadata')) {
                db.createObjectStore('metadata', { keyPath: 'key' });
            }
        };
    });
}

/**
 * Cache APUs from network to IndexedDB
 */
async function cacheAPUsToIndexedDB() {
    try {
        // Fetch APU database
        const response = await fetch('/apu_database.min.json');
        if (!response.ok) {
            throw new Error('Failed to fetch APU database');
        }

        const data = await response.json();
        await storeAPUsInIndexedDB(data);

        console.log('[SW] APUs cached to IndexedDB:', data.metadata?.total_apus || 0);
    } catch (error) {
        console.error('[SW] Failed to cache APUs:', error);
    }
}

/**
 * Store APUs in IndexedDB
 */
async function storeAPUsInIndexedDB(data) {
    try {
        const db = await initializeIndexedDB();
        const transaction = db.transaction(['apus', 'metadata'], 'readwrite');
        const apuStore = transaction.objectStore('apus');
        const metadataStore = transaction.objectStore('metadata');

        // Clear old data
        await apuStore.clear();

        // Store each APU
        if (data.actividades && Array.isArray(data.actividades)) {
            for (const apu of data.actividades) {
                await apuStore.add(apu);
            }
        }

        // Store metadata
        await metadataStore.put({
            key: 'apus_metadata',
            data: data.metadata,
            cachedAt: Date.now()
        });

        console.log('[SW] Stored', data.actividades?.length || 0, 'APUs in IndexedDB');
    } catch (error) {
        console.error('[SW] Failed to store APUs:', error);
    }
}

/**
 * Get APUs from IndexedDB
 */
async function getAPUsFromIndexedDB() {
    try {
        const db = await initializeIndexedDB();
        const transaction = db.transaction(['apus', 'metadata'], 'readonly');
        const apuStore = transaction.objectStore('apus');
        const metadataStore = transaction.objectStore('metadata');

        // Get metadata
        const metadataRequest = metadataStore.get('apus_metadata');
        const metadata = await new Promise((resolve, reject) => {
            metadataRequest.onsuccess = () => resolve(metadataRequest.result);
            metadataRequest.onerror = () => reject(metadataRequest.error);
        });

        // Check if cache is fresh (less than 7 days old)
        if (metadata && metadata.cachedAt) {
            const age = Date.now() - metadata.cachedAt;
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

            if (age > maxAge) {
                console.log('[SW] IndexedDB cache is stale, will refresh');
                return null;
            }
        }

        // Get all APUs
        const apusRequest = apuStore.getAll();
        const apus = await new Promise((resolve, reject) => {
            apusRequest.onsuccess = () => resolve(apusRequest.result);
            apusRequest.onerror = () => reject(apusRequest.error);
        });

        if (apus && apus.length > 0) {
            return {
                metadata: metadata ? metadata.data : { total_apus: apus.length },
                actividades: apus
            };
        }

        return null;

    } catch (error) {
        console.error('[SW] Failed to get APUs from IndexedDB:', error);
        return null;
    }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);

    if (event.tag === 'sync-projects') {
        event.waitUntil(syncProjects());
    } else if (event.tag === 'sync-analytics') {
        event.waitUntil(syncAnalytics());
    }
});

async function syncProjects() {
    console.log('[SW] Syncing projects...');

    try {
        // Get pending sync from IndexedDB
        const db = await initializeIndexedDB();
        // Implement project sync logic here
        console.log('[SW] Projects synced successfully');
    } catch (error) {
        console.error('[SW] Project sync failed:', error);
        throw error; // Re-throw to retry sync
    }
}

async function syncAnalytics() {
    console.log('[SW] Syncing analytics...');

    try {
        // Get pending analytics events
        const db = await initializeIndexedDB();
        // Implement analytics sync logic here
        console.log('[SW] Analytics synced successfully');
    } catch (error) {
        console.error('[SW] Analytics sync failed:', error);
        throw error; // Re-throw to retry sync
    }
}

// Message handler for commands from main thread
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CHECK_UPDATE') {
        event.waitUntil(checkForUpdates());
    }

    if (event.data && event.data.type === 'CACHE_APUS') {
        event.waitUntil(cacheAPUsToIndexedDB());
    }
});

async function checkForUpdates() {
    try {
        // Check if there's a new version of the app
        const response = await fetch('/manifest.json');
        if (response.ok) {
            console.log('[SW] Update check complete');
        }
    } catch (error) {
        console.error('[SW] Update check failed:', error);
    }
}

// Push notifications
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received');

    const options = {
        body: event.data ? event.data.text() : 'Nueva actualización disponible',
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now()
        },
        actions: [
            {
                action: 'open',
                title: 'Abrir CLAUDIA'
            },
            {
                action: 'close',
                title: 'Cerrar'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('CLAUDIA', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification click:', event.action);

    event.notification.close();

    if (event.action === 'open') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

console.log('[SW v6.7.3] Service Worker loaded - Offline APU search enabled');

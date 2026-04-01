/**
 * CLAUDIA Cache Manager v6.9.0
 *
 * Advanced caching strategies for Service Worker:
 * - Cache-First strategy for static assets
 * - Network-First strategy for dynamic content
 * - Stale-While-Revalidate for images
 * - Cache-Only for offline fallbacks
 * - Smart cache invalidation
 * - Cache versioning and migration
 * - Storage quota management
 *
 * @module ClaudiaCacheManager
 * @version 6.9.0
 * @requires Service Worker API, Cache API
 */

window.ClaudiaCacheManager = {
    version: '6.9.0',
    initialized: false,

    // Configuration
    config: {
        cacheName: 'claudia-cache-v6.9',
        maxAge: {
            static: 7 * 24 * 60 * 60 * 1000,      // 7 days
            images: 30 * 24 * 60 * 60 * 1000,     // 30 days
            api: 5 * 60 * 1000,                   // 5 minutes
            dynamic: 24 * 60 * 60 * 1000          // 1 day
        },
        maxEntries: {
            static: 100,
            images: 200,
            api: 50,
            dynamic: 100
        },
        strategies: {
            static: 'cache-first',
            images: 'stale-while-revalidate',
            api: 'network-first',
            dynamic: 'network-first'
        }
    },

    // State
    caches: {
        static: null,
        images: null,
        api: null,
        dynamic: null,
        offline: null
    },
    stats: {
        hits: 0,
        misses: 0,
        errors: 0,
        updates: 0,
        evictions: 0
    },
    storageQuota: {
        usage: 0,
        quota: 0,
        available: 0
    },

    /**
     * Initialize cache manager
     */
    async init() {
        if (this.initialized) {
            console.log('ClaudiaCacheManager: Already initialized');
            return;
        }

        console.log('ClaudiaCacheManager: Initializing v6.9.0...');

        // Check Service Worker support
        if (!('serviceWorker' in navigator)) {
            console.warn('ClaudiaCacheManager: Service Worker not supported');
            return;
        }

        // Check Cache API support
        if (!('caches' in window)) {
            console.warn('ClaudiaCacheManager: Cache API not supported');
            return;
        }

        // Initialize cache storage
        await this.initializeCaches();

        // Check storage quota
        await this.checkStorageQuota();

        // Clean old caches
        await this.cleanOldCaches();

        // Setup message listener for SW
        this.setupMessageListener();

        this.initialized = true;
        console.log('ClaudiaCacheManager: Initialized successfully');
        this.logStats();
    },

    /**
     * Initialize cache instances
     */
    async initializeCaches() {
        const cacheNames = {
            static: `${this.config.cacheName}-static`,
            images: `${this.config.cacheName}-images`,
            api: `${this.config.cacheName}-api`,
            dynamic: `${this.config.cacheName}-dynamic`,
            offline: `${this.config.cacheName}-offline`
        };

        for (const [type, name] of Object.entries(cacheNames)) {
            this.caches[type] = await caches.open(name);
        }

        console.log('ClaudiaCacheManager: Caches initialized', Object.keys(this.caches));
    },

    /**
     * Check storage quota
     */
    async checkStorageQuota() {
        if (!navigator.storage || !navigator.storage.estimate) {
            console.warn('ClaudiaCacheManager: Storage API not supported');
            return;
        }

        const estimate = await navigator.storage.estimate();
        this.storageQuota = {
            usage: estimate.usage || 0,
            quota: estimate.quota || 0,
            available: (estimate.quota || 0) - (estimate.usage || 0)
        };

        const usagePercent = (this.storageQuota.usage / this.storageQuota.quota * 100).toFixed(1);

        console.log(`ClaudiaCacheManager: Storage ${usagePercent}% used (${this.formatBytes(this.storageQuota.usage)} / ${this.formatBytes(this.storageQuota.quota)})`);

        // Warn if storage is running low
        if (usagePercent > 80) {
            console.warn('ClaudiaCacheManager: Storage quota running low, cleaning up...');
            await this.evictOldEntries();
        }
    },

    /**
     * Clean old cache versions
     */
    async cleanOldCaches() {
        const cacheNames = await caches.keys();
        const currentCaches = Object.values(this.caches).map(c => c);

        const oldCaches = cacheNames.filter(name =>
            name.startsWith('claudia-cache-') &&
            !name.includes(this.version)
        );

        for (const cacheName of oldCaches) {
            await caches.delete(cacheName);
            console.log(`ClaudiaCacheManager: Deleted old cache: ${cacheName}`);
        }

        if (oldCaches.length > 0) {
            console.log(`ClaudiaCacheManager: Cleaned ${oldCaches.length} old caches`);
        }
    },

    /**
     * Cache-First strategy
     */
    async cacheFirst(request, cacheName = 'static') {
        const cache = this.caches[cacheName];

        // Try cache first
        const cached = await cache.match(request);
        if (cached) {
            this.stats.hits++;
            return cached;
        }

        // Fetch from network
        try {
            const response = await fetch(request);

            // Cache successful responses
            if (response.ok) {
                cache.put(request, response.clone());
                this.stats.updates++;
            }

            return response;
        } catch (error) {
            this.stats.errors++;
            this.stats.misses++;

            // Return offline fallback
            return this.getOfflineFallback(request);
        }
    },

    /**
     * Network-First strategy
     */
    async networkFirst(request, cacheName = 'dynamic') {
        const cache = this.caches[cacheName];

        try {
            // Try network first
            const response = await fetch(request);

            if (response.ok) {
                // Update cache
                cache.put(request, response.clone());
                this.stats.updates++;
            }

            return response;
        } catch (error) {
            this.stats.errors++;

            // Fallback to cache
            const cached = await cache.match(request);
            if (cached) {
                this.stats.hits++;
                return cached;
            }

            this.stats.misses++;
            return this.getOfflineFallback(request);
        }
    },

    /**
     * Stale-While-Revalidate strategy
     */
    async staleWhileRevalidate(request, cacheName = 'images') {
        const cache = this.caches[cacheName];

        // Get cached version
        const cached = await cache.match(request);

        // Fetch fresh version in background
        const fetchPromise = fetch(request).then(response => {
            if (response.ok) {
                cache.put(request, response.clone());
                this.stats.updates++;
            }
            return response;
        }).catch(error => {
            this.stats.errors++;
            return null;
        });

        // Return cached immediately if available
        if (cached) {
            this.stats.hits++;
            return cached;
        }

        // Wait for network if no cache
        this.stats.misses++;
        return fetchPromise;
    },

    /**
     * Cache-Only strategy (offline fallback)
     */
    async cacheOnly(request, cacheName = 'offline') {
        const cache = this.caches[cacheName];
        const cached = await cache.match(request);

        if (cached) {
            this.stats.hits++;
            return cached;
        }

        this.stats.misses++;
        return new Response('Not found in cache', { status: 404 });
    },

    /**
     * Get offline fallback response
     */
    async getOfflineFallback(request) {
        const url = new URL(request.url);

        // HTML fallback
        if (request.headers.get('accept')?.includes('text/html')) {
            const fallback = await this.caches.offline.match('/offline.html');
            return fallback || new Response('<h1>Offline</h1><p>No hay conexión a Internet</p>', {
                headers: { 'Content-Type': 'text/html' }
            });
        }

        // Image fallback
        if (request.headers.get('accept')?.includes('image')) {
            const fallback = await this.caches.offline.match('/offline-image.svg');
            return fallback || new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="#ccc" width="200" height="200"/><text x="50%" y="50%" text-anchor="middle" fill="#666">Sin conexión</text></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
            );
        }

        // Generic fallback
        return new Response('Offline', { status: 503 });
    },

    /**
     * Manually add to cache
     */
    async addToCache(url, cacheName = 'dynamic') {
        const cache = this.caches[cacheName];

        try {
            const response = await fetch(url);
            if (response.ok) {
                await cache.put(url, response);
                this.stats.updates++;
                console.log(`ClaudiaCacheManager: Cached ${url}`);
                return true;
            }
        } catch (error) {
            console.error(`ClaudiaCacheManager: Failed to cache ${url}`, error);
            this.stats.errors++;
        }

        return false;
    },

    /**
     * Precache critical resources
     */
    async precache(urls) {
        const cache = this.caches.static;
        const results = {
            success: [],
            failed: []
        };

        for (const url of urls) {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    await cache.put(url, response);
                    results.success.push(url);
                    this.stats.updates++;
                } else {
                    results.failed.push(url);
                }
            } catch (error) {
                results.failed.push(url);
                this.stats.errors++;
            }
        }

        console.log(`ClaudiaCacheManager: Precached ${results.success.length}/${urls.length} resources`);
        return results;
    },

    /**
     * Clear cache by name or type
     */
    async clearCache(cacheName) {
        const cache = this.caches[cacheName];
        if (!cache) {
            console.warn(`ClaudiaCacheManager: Cache ${cacheName} not found`);
            return false;
        }

        const keys = await cache.keys();
        for (const request of keys) {
            await cache.delete(request);
        }

        console.log(`ClaudiaCacheManager: Cleared ${keys.length} entries from ${cacheName}`);
        return true;
    },

    /**
     * Evict old entries to free space
     */
    async evictOldEntries() {
        let evicted = 0;

        for (const [type, cache] of Object.entries(this.caches)) {
            if (type === 'offline') continue; // Don't evict offline cache

            const maxAge = this.config.maxAge[type] || this.config.maxAge.dynamic;
            const maxEntries = this.config.maxEntries[type] || this.config.maxEntries.dynamic;

            const entries = await cache.keys();

            // Sort by date (oldest first)
            const entriesWithDate = await Promise.all(
                entries.map(async request => {
                    const response = await cache.match(request);
                    const date = new Date(response.headers.get('date') || 0);
                    return { request, date };
                })
            );

            entriesWithDate.sort((a, b) => a.date - b.date);

            // Remove old entries
            const now = Date.now();
            for (const { request, date } of entriesWithDate) {
                const age = now - date.getTime();

                if (age > maxAge || evicted < (entries.length - maxEntries)) {
                    await cache.delete(request);
                    evicted++;
                    this.stats.evictions++;
                }
            }
        }

        if (evicted > 0) {
            console.log(`ClaudiaCacheManager: Evicted ${evicted} old entries`);
        }

        return evicted;
    },

    /**
     * Get cache statistics
     */
    async getCacheStats() {
        const stats = {
            version: this.version,
            ...this.stats,
            hitRate: ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(1) + '%',
            storage: this.storageQuota,
            caches: {}
        };

        for (const [type, cache] of Object.entries(this.caches)) {
            const keys = await cache.keys();
            stats.caches[type] = {
                entries: keys.length,
                maxEntries: this.config.maxEntries[type] || 0,
                strategy: this.config.strategies[type] || 'unknown'
            };
        }

        return stats;
    },

    /**
     * Setup message listener for Service Worker communication
     */
    setupMessageListener() {
        navigator.serviceWorker.addEventListener('message', (event) => {
            const { type, data } = event.data;

            switch (type) {
                case 'CACHE_HIT':
                    this.stats.hits++;
                    break;
                case 'CACHE_MISS':
                    this.stats.misses++;
                    break;
                case 'CACHE_UPDATE':
                    this.stats.updates++;
                    break;
                case 'CACHE_ERROR':
                    this.stats.errors++;
                    break;
            }
        });
    },

    /**
     * Format bytes to human readable
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * Log statistics
     */
    async logStats() {
        const stats = await this.getCacheStats();
        console.log('ClaudiaCacheManager: Statistics', stats);
    },

    /**
     * Export cache for debugging
     */
    async exportCache(cacheName) {
        const cache = this.caches[cacheName];
        if (!cache) return null;

        const entries = await cache.keys();
        const exported = [];

        for (const request of entries) {
            const response = await cache.match(request);
            exported.push({
                url: request.url,
                method: request.method,
                status: response.status,
                headers: Object.fromEntries(response.headers.entries()),
                date: response.headers.get('date')
            });
        }

        return exported;
    }
};

// Auto-initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.ClaudiaCacheManager.init();
    });
} else {
    window.ClaudiaCacheManager.init();
}

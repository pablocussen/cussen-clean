/**
 * CLAUDIA IndexedDB Manager v6.7.1
 * Advanced caching system for APUs and project data
 * Enables faster loading and full offline support
 */

(function() {
    'use strict';

    window.ClaudiaDB = {

        db: null,
        dbName: 'ClaudiaDB',
        version: 2,

        stores: {
            apus: 'apus',
            projects: 'projects',
            prices: 'prices',
            cache: 'cache',
            analytics: 'analytics'
        },

        /**
         * Initialize IndexedDB
         */
        async init() {
            try {
                this.db = await this.openDB();
                console.log('💾 IndexedDB v6.7.1 initialized');

                // Migrate localStorage data to IndexedDB
                await this.migrateFromLocalStorage();

                // Setup periodic cleanup
                this.setupCleanup();

                return true;
            } catch (err) {
                console.error('❌ IndexedDB init failed:', err);
                return false;
            }
        },

        /**
         * Open IndexedDB connection
         */
        openDB() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, this.version);

                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(request.result);

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;

                    // Create stores if they don't exist
                    if (!db.objectStoreNames.contains(this.stores.apus)) {
                        const apuStore = db.createObjectStore(this.stores.apus, { keyPath: 'id' });
                        apuStore.createIndex('categoria', 'categoria', { unique: false });
                        apuStore.createIndex('nombre', 'nombre', { unique: false });
                    }

                    if (!db.objectStoreNames.contains(this.stores.projects)) {
                        db.createObjectStore(this.stores.projects, { keyPath: 'id' });
                    }

                    if (!db.objectStoreNames.contains(this.stores.prices)) {
                        const priceStore = db.createObjectStore(this.stores.prices, { keyPath: 'id' });
                        priceStore.createIndex('timestamp', 'timestamp', { unique: false });
                    }

                    if (!db.objectStoreNames.contains(this.stores.cache)) {
                        const cacheStore = db.createObjectStore(this.stores.cache, { keyPath: 'key' });
                        cacheStore.createIndex('expires', 'expires', { unique: false });
                    }

                    if (!db.objectStoreNames.contains(this.stores.analytics)) {
                        const analyticsStore = db.createObjectStore(this.stores.analytics, { keyPath: 'id', autoIncrement: true });
                        analyticsStore.createIndex('event', 'event', { unique: false });
                        analyticsStore.createIndex('timestamp', 'timestamp', { unique: false });
                    }
                };
            });
        },

        /**
         * Get all APUs from IndexedDB
         */
        async getAllAPUs() {
            try {
                const transaction = this.db.transaction([this.stores.apus], 'readonly');
                const store = transaction.objectStore(this.stores.apus);
                const request = store.getAll();

                return new Promise((resolve, reject) => {
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });
            } catch (err) {
                console.error('Failed to get APUs:', err);
                return [];
            }
        },

        /**
         * Cache APU database
         */
        async cacheAPUs(apus) {
            try {
                const transaction = this.db.transaction([this.stores.apus], 'readwrite');
                const store = transaction.objectStore(this.stores.apus);

                // Clear existing
                await new Promise((resolve, reject) => {
                    const clearRequest = store.clear();
                    clearRequest.onsuccess = () => resolve();
                    clearRequest.onerror = () => reject(clearRequest.error);
                });

                // Add all APUs
                const promises = apus.map(apu => {
                    return new Promise((resolve, reject) => {
                        const request = store.add({
                            id: apu.id || `apu_${Date.now()}_${Math.random()}`,
                            ...apu,
                            cachedAt: Date.now()
                        });
                        request.onsuccess = () => resolve();
                        request.onerror = () => reject(request.error);
                    });
                });

                await Promise.all(promises);
                console.log(`✅ Cached ${apus.length} APUs in IndexedDB`);
                return true;
            } catch (err) {
                console.error('Failed to cache APUs:', err);
                return false;
            }
        },

        /**
         * Search APUs by keyword
         */
        async searchAPUs(keyword) {
            try {
                const allAPUs = await this.getAllAPUs();
                const searchTerm = keyword.toLowerCase();

                return allAPUs.filter(apu => {
                    return apu.nombre?.toLowerCase().includes(searchTerm) ||
                           apu.categoria?.toLowerCase().includes(searchTerm) ||
                           apu.descripcion?.toLowerCase().includes(searchTerm);
                });
            } catch (err) {
                console.error('Search failed:', err);
                return [];
            }
        },

        /**
         * Save project to IndexedDB
         */
        async saveProject(project) {
            try {
                const transaction = this.db.transaction([this.stores.projects], 'readwrite');
                const store = transaction.objectStore(this.stores.projects);

                const projectData = {
                    ...project,
                    updatedAt: new Date().toISOString(),
                    syncedToCloud: false
                };

                return new Promise((resolve, reject) => {
                    const request = store.put(projectData);
                    request.onsuccess = () => resolve(true);
                    request.onerror = () => reject(request.error);
                });
            } catch (err) {
                console.error('Failed to save project:', err);
                return false;
            }
        },

        /**
         * Get all projects
         */
        async getAllProjects() {
            try {
                const transaction = this.db.transaction([this.stores.projects], 'readonly');
                const store = transaction.objectStore(this.stores.projects);
                const request = store.getAll();

                return new Promise((resolve, reject) => {
                    request.onsuccess = () => resolve(request.result || []);
                    request.onerror = () => reject(request.error);
                });
            } catch (err) {
                console.error('Failed to get projects:', err);
                return [];
            }
        },

        /**
         * Delete project
         */
        async deleteProject(projectId) {
            try {
                const transaction = this.db.transaction([this.stores.projects], 'readwrite');
                const store = transaction.objectStore(this.stores.projects);

                return new Promise((resolve, reject) => {
                    const request = store.delete(projectId);
                    request.onsuccess = () => resolve(true);
                    request.onerror = () => reject(request.error);
                });
            } catch (err) {
                console.error('Failed to delete project:', err);
                return false;
            }
        },

        /**
         * Cache price data
         */
        async cachePrice(productId, priceData) {
            try {
                const transaction = this.db.transaction([this.stores.prices], 'readwrite');
                const store = transaction.objectStore(this.stores.prices);

                const data = {
                    id: productId,
                    ...priceData,
                    timestamp: Date.now(),
                    expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
                };

                return new Promise((resolve, reject) => {
                    const request = store.put(data);
                    request.onsuccess = () => resolve(true);
                    request.onerror = () => reject(request.error);
                });
            } catch (err) {
                console.error('Failed to cache price:', err);
                return false;
            }
        },

        /**
         * Get cached price
         */
        async getCachedPrice(productId) {
            try {
                const transaction = this.db.transaction([this.stores.prices], 'readonly');
                const store = transaction.objectStore(this.stores.prices);
                const request = store.get(productId);

                const result = await new Promise((resolve, reject) => {
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });

                // Check if expired
                if (result && result.expires > Date.now()) {
                    return result;
                }

                return null;
            } catch (err) {
                console.error('Failed to get cached price:', err);
                return null;
            }
        },

        /**
         * Generic cache with TTL
         */
        async setCache(key, value, ttlMinutes = 60) {
            try {
                const transaction = this.db.transaction([this.stores.cache], 'readwrite');
                const store = transaction.objectStore(this.stores.cache);

                const data = {
                    key,
                    value,
                    created: Date.now(),
                    expires: Date.now() + (ttlMinutes * 60 * 1000)
                };

                return new Promise((resolve, reject) => {
                    const request = store.put(data);
                    request.onsuccess = () => resolve(true);
                    request.onerror = () => reject(request.error);
                });
            } catch (err) {
                console.error('Failed to set cache:', err);
                return false;
            }
        },

        /**
         * Get from cache
         */
        async getCache(key) {
            try {
                const transaction = this.db.transaction([this.stores.cache], 'readonly');
                const store = transaction.objectStore(this.stores.cache);
                const request = store.get(key);

                const result = await new Promise((resolve, reject) => {
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });

                // Check if expired
                if (result && result.expires > Date.now()) {
                    return result.value;
                }

                return null;
            } catch (err) {
                console.error('Failed to get cache:', err);
                return null;
            }
        },

        /**
         * Track analytics event (offline-capable)
         */
        async trackEvent(event, data = {}) {
            try {
                const transaction = this.db.transaction([this.stores.analytics], 'readwrite');
                const store = transaction.objectStore(this.stores.analytics);

                const eventData = {
                    event,
                    data,
                    timestamp: Date.now(),
                    synced: false
                };

                return new Promise((resolve, reject) => {
                    const request = store.add(eventData);
                    request.onsuccess = () => resolve(true);
                    request.onerror = () => reject(request.error);
                });
            } catch (err) {
                console.error('Failed to track event:', err);
                return false;
            }
        },

        /**
         * Get pending analytics events (for sync)
         */
        async getPendingEvents() {
            try {
                const transaction = this.db.transaction([this.stores.analytics], 'readonly');
                const store = transaction.objectStore(this.stores.analytics);
                const request = store.getAll();

                const events = await new Promise((resolve, reject) => {
                    request.onsuccess = () => resolve(request.result || []);
                    request.onerror = () => reject(request.error);
                });

                return events.filter(e => !e.synced);
            } catch (err) {
                console.error('Failed to get pending events:', err);
                return [];
            }
        },

        /**
         * Migrate data from localStorage to IndexedDB
         */
        async migrateFromLocalStorage() {
            try {
                // Migrate projects
                const projectsJSON = localStorage.getItem('claudia_projects');
                if (projectsJSON) {
                    const projects = JSON.parse(projectsJSON);
                    for (const project of projects) {
                        await this.saveProject(project);
                    }
                    console.log(`✅ Migrated ${projects.length} projects to IndexedDB`);
                }

                // Keep localStorage as backup for now
            } catch (err) {
                console.error('Migration failed:', err);
            }
        },

        /**
         * Setup periodic cleanup of expired data
         */
        setupCleanup() {
            // Clean every hour
            setInterval(() => this.cleanupExpired(), 3600000);
        },

        /**
         * Cleanup expired cache entries
         */
        async cleanupExpired() {
            try {
                const now = Date.now();

                // Clean cache
                const cacheTransaction = this.db.transaction([this.stores.cache], 'readwrite');
                const cacheStore = cacheTransaction.objectStore(this.stores.cache);
                const cacheIndex = cacheStore.index('expires');
                const cacheRange = IDBKeyRange.upperBound(now);
                const cacheRequest = cacheIndex.openCursor(cacheRange);

                let deletedCache = 0;
                cacheRequest.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        cursor.delete();
                        deletedCache++;
                        cursor.continue();
                    } else {
                        if (deletedCache > 0) {
                            console.log(`🗑️ Cleaned ${deletedCache} expired cache entries`);
                        }
                    }
                };

                // Clean prices
                const priceTransaction = this.db.transaction([this.stores.prices], 'readwrite');
                const priceStore = priceTransaction.objectStore(this.stores.prices);
                const priceIndex = priceStore.index('timestamp');
                const priceRange = IDBKeyRange.upperBound(now - (7 * 24 * 60 * 60 * 1000)); // Older than 7 days
                const priceRequest = priceIndex.openCursor(priceRange);

                let deletedPrices = 0;
                priceRequest.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        cursor.delete();
                        deletedPrices++;
                        cursor.continue();
                    } else {
                        if (deletedPrices > 0) {
                            console.log(`🗑️ Cleaned ${deletedPrices} old price entries`);
                        }
                    }
                };

            } catch (err) {
                console.error('Cleanup failed:', err);
            }
        },

        /**
         * Get database stats
         */
        async getStats() {
            try {
                const stats = {
                    apus: 0,
                    projects: 0,
                    prices: 0,
                    cache: 0,
                    analytics: 0,
                    totalSize: 0
                };

                const storeNames = Object.values(this.stores);
                const transaction = this.db.transaction(storeNames, 'readonly');

                for (const storeName of storeNames) {
                    const store = transaction.objectStore(storeName);
                    const count = await new Promise((resolve) => {
                        const request = store.count();
                        request.onsuccess = () => resolve(request.result);
                        request.onerror = () => resolve(0);
                    });
                    stats[storeName] = count;
                }

                // Estimate size
                if (navigator.storage && navigator.storage.estimate) {
                    const estimate = await navigator.storage.estimate();
                    stats.totalSize = estimate.usage;
                    stats.quota = estimate.quota;
                    stats.percentage = ((estimate.usage / estimate.quota) * 100).toFixed(2);
                }

                return stats;
            } catch (err) {
                console.error('Failed to get stats:', err);
                return null;
            }
        },

        /**
         * Export all data (for backup)
         */
        async exportAll() {
            try {
                const data = {
                    version: this.version,
                    exportedAt: new Date().toISOString(),
                    apus: await this.getAllAPUs(),
                    projects: await this.getAllProjects(),
                    analytics: await this.getPendingEvents()
                };

                return data;
            } catch (err) {
                console.error('Export failed:', err);
                return null;
            }
        },

        /**
         * Clear all data
         */
        async clearAll() {
            try {
                const storeNames = Object.values(this.stores);
                const transaction = this.db.transaction(storeNames, 'readwrite');

                const promises = storeNames.map(storeName => {
                    return new Promise((resolve, reject) => {
                        const store = transaction.objectStore(storeName);
                        const request = store.clear();
                        request.onsuccess = () => resolve();
                        request.onerror = () => reject(request.error);
                    });
                });

                await Promise.all(promises);
                console.log('✅ All IndexedDB data cleared');
                return true;
            } catch (err) {
                console.error('Failed to clear data:', err);
                return false;
            }
        }
    };

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ClaudiaDB.init());
    } else {
        ClaudiaDB.init();
    }

})();

/**
 * CLAUDIA Memory Manager v6.7.2
 * Monitors and optimizes memory usage
 * Prevents memory leaks and OOM crashes
 */

(function() {
    'use strict';

    window.ClaudiaMemoryManager = {
        // Thresholds (in MB)
        WARNING_THRESHOLD: 100,
        CRITICAL_THRESHOLD: 200,

        // Monitoring
        monitoringInterval: null,
        lastCheck: null,
        memoryHistory: [],
        maxHistorySize: 50,

        // Cleanup callbacks
        cleanupCallbacks: [],

        /**
         * Initialize memory monitoring
         */
        init() {
            if (!performance.memory) {
                console.warn('⚠️ Memory monitoring not supported in this browser');
                return false;
            }

            // Check memory every 30 seconds
            this.monitoringInterval = setInterval(() => {
                this.checkMemory();
            }, 30000);

            // Initial check
            this.checkMemory();

            console.log('💾 Memory Manager initialized');
            return true;
        },

        /**
         * Check current memory usage
         */
        checkMemory() {
            if (!performance.memory) return null;

            const memory = {
                used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
                total: Math.round(performance.memory.totalJSHeapSize / 1048576),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576),
                timestamp: Date.now()
            };

            memory.percentage = (memory.used / memory.limit) * 100;

            // Add to history
            this.memoryHistory.push(memory);
            if (this.memoryHistory.length > this.maxHistorySize) {
                this.memoryHistory.shift();
            }

            this.lastCheck = memory;

            // Check thresholds
            if (memory.used >= this.CRITICAL_THRESHOLD) {
                console.warn('🚨 CRITICAL memory usage:', memory.used, 'MB');
                this.performAggressiveCleanup();
            } else if (memory.used >= this.WARNING_THRESHOLD) {
                console.warn('⚠️ High memory usage:', memory.used, 'MB');
                this.performCleanup();
            }

            return memory;
        },

        /**
         * Register cleanup callback
         */
        registerCleanup(name, callback, priority = 'normal') {
            this.cleanupCallbacks.push({
                name,
                callback,
                priority // 'low', 'normal', 'high'
            });
        },

        /**
         * Perform normal cleanup
         */
        performCleanup() {
            console.log('🧹 Performing memory cleanup...');

            // Execute normal priority cleanups
            this.cleanupCallbacks
                .filter(c => c.priority === 'normal' || c.priority === 'high')
                .forEach(cleanup => {
                    try {
                        cleanup.callback();
                        console.log('  ✓ Cleaned:', cleanup.name);
                    } catch (error) {
                        console.error('  ✗ Cleanup failed:', cleanup.name, error);
                    }
                });

            // Clear old IndexedDB cache
            if (window.ClaudiaIndexedDB) {
                ClaudiaIndexedDB.cleanExpired().catch(err => {
                    console.error('Failed to clean IndexedDB:', err);
                });
            }

            // Clear old localStorage data
            this.cleanLocalStorage();

            // Force garbage collection if available (Chrome DevTools)
            if (window.gc) {
                window.gc();
            }

            // Check result
            setTimeout(() => {
                const after = this.checkMemory();
                if (after) {
                    console.log('🧹 Cleanup complete. Memory:', after.used, 'MB');
                }
            }, 1000);
        },

        /**
         * Perform aggressive cleanup (critical memory)
         */
        performAggressiveCleanup() {
            console.warn('🚨 Performing AGGRESSIVE cleanup...');

            // Execute ALL cleanup callbacks
            this.cleanupCallbacks.forEach(cleanup => {
                try {
                    cleanup.callback();
                    console.log('  ✓ Cleaned:', cleanup.name);
                } catch (error) {
                    console.error('  ✗ Cleanup failed:', cleanup.name, error);
                }
            });

            // Clear ALL caches
            this.clearAllCaches();

            // Clear old data
            this.cleanLocalStorage(true);

            // Clear session data
            this.clearSessionData();

            // Force garbage collection
            if (window.gc) {
                window.gc();
            }

            // Warn user
            this.showMemoryWarning();

            setTimeout(() => {
                const after = this.checkMemory();
                if (after) {
                    console.log('🚨 Aggressive cleanup complete. Memory:', after.used, 'MB');
                }
            }, 1000);
        },

        /**
         * Clear all caches
         */
        clearAllCaches() {
            // Clear browser caches
            if ('caches' in window) {
                caches.keys().then(names => {
                    names.forEach(name => {
                        if (name.includes('claudia')) {
                            caches.delete(name);
                            console.log('  ✓ Cleared cache:', name);
                        }
                    });
                });
            }

            // Clear IndexedDB non-critical data
            if (window.ClaudiaIndexedDB) {
                ClaudiaIndexedDB.clearStore('cache').catch(err => {
                    console.error('Failed to clear cache store:', err);
                });
            }
        },

        /**
         * Clean localStorage
         */
        cleanLocalStorage(aggressive = false) {
            const keysToCheck = [];

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('claudia_')) {
                    keysToCheck.push(key);
                }
            }

            keysToCheck.forEach(key => {
                try {
                    // Remove old analytics (keep last 30 days)
                    if (key.includes('analytics') || key.includes('events')) {
                        const data = JSON.parse(localStorage.getItem(key) || '[]');
                        if (Array.isArray(data)) {
                            const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
                            const filtered = data.filter(item => {
                                const timestamp = item.timestamp || item.date || 0;
                                return timestamp > cutoff;
                            });

                            if (filtered.length < data.length) {
                                localStorage.setItem(key, JSON.stringify(filtered));
                                console.log('  ✓ Cleaned old analytics from:', key);
                            }
                        }
                    }

                    // Remove old performance data
                    if (key.includes('perf_history')) {
                        const data = JSON.parse(localStorage.getItem(key) || '[]');
                        if (Array.isArray(data) && data.length > 10) {
                            localStorage.setItem(key, JSON.stringify(data.slice(-10)));
                            console.log('  ✓ Trimmed performance history');
                        }
                    }

                    // Aggressive: Clear caches
                    if (aggressive) {
                        if (key.includes('cache') || key.includes('temp')) {
                            localStorage.removeItem(key);
                            console.log('  ✓ Removed cache:', key);
                        }
                    }
                } catch (error) {
                    console.error('Failed to clean:', key, error);
                }
            });
        },

        /**
         * Clear session data
         */
        clearSessionData() {
            // Clear session storage
            for (let i = sessionStorage.length - 1; i >= 0; i--) {
                const key = sessionStorage.key(i);
                if (key && key.startsWith('claudia_')) {
                    sessionStorage.removeItem(key);
                    console.log('  ✓ Cleared session:', key);
                }
            }
        },

        /**
         * Show memory warning to user
         */
        showMemoryWarning() {
            const message = '⚠️ CLAUDIA está usando mucha memoria. Se han limpiado datos temporales para mejorar el rendimiento.';

            if (window.ClaudiaNotifications) {
                ClaudiaNotifications.show({
                    title: 'Memoria Alta',
                    body: message,
                    type: 'warning'
                });
            } else {
                alert(message);
            }
        },

        /**
         * Get memory statistics
         */
        getStats() {
            if (!this.lastCheck) {
                return null;
            }

            const trend = this.getMemoryTrend();

            return {
                current: this.lastCheck,
                history: this.memoryHistory,
                trend,
                status: this.getMemoryStatus()
            };
        },

        /**
         * Get memory trend
         */
        getMemoryTrend() {
            if (this.memoryHistory.length < 2) {
                return 'stable';
            }

            const recent = this.memoryHistory.slice(-5);
            const avg = recent.reduce((sum, m) => sum + m.used, 0) / recent.length;
            const current = this.lastCheck.used;

            if (current > avg * 1.1) return 'increasing';
            if (current < avg * 0.9) return 'decreasing';
            return 'stable';
        },

        /**
         * Get memory status
         */
        getMemoryStatus() {
            if (!this.lastCheck) return 'unknown';

            if (this.lastCheck.used >= this.CRITICAL_THRESHOLD) {
                return 'critical';
            } else if (this.lastCheck.used >= this.WARNING_THRESHOLD) {
                return 'warning';
            } else {
                return 'normal';
            }
        },

        /**
         * Destroy manager
         */
        destroy() {
            if (this.monitoringInterval) {
                clearInterval(this.monitoringInterval);
                this.monitoringInterval = null;
            }

            this.cleanupCallbacks = [];
            this.memoryHistory = [];
        }
    };

    // Export globally
    window.MemoryManager = window.ClaudiaMemoryManager;

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.ClaudiaMemoryManager.init();
        });
    } else {
        window.ClaudiaMemoryManager.init();
    }

    // Register common cleanups
    window.ClaudiaMemoryManager.registerCleanup('Clear DOM caches', () => {
        // Clear any cached DOM references that might be retained
        document.querySelectorAll('.hidden').forEach(el => {
            if (el.style.display === 'none') {
                el.innerHTML = '';
            }
        });
    }, 'low');

    console.log('💾 Memory Manager v6.7.2 loaded');

})();

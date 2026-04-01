/**
 * CLAUDIA Idle Task Scheduler v6.7.2
 * Executes low-priority tasks during browser idle time
 * Improves perceived performance by deferring non-critical work
 */

(function() {
    'use strict';

    window.ClaudiaIdleTasks = {
        tasks: [],
        isRunning: false,
        requestIdleCallback: window.requestIdleCallback || null,

        /**
         * Initialize idle task scheduler
         */
        init() {
            // Polyfill for requestIdleCallback
            if (!this.requestIdleCallback) {
                this.requestIdleCallback = (callback) => {
                    return setTimeout(() => {
                        callback({
                            didTimeout: false,
                            timeRemaining: () => 50
                        });
                    }, 1);
                };
            }

            console.log('⏱️ Idle Task Scheduler initialized');
        },

        /**
         * Schedule task for idle time
         */
        schedule(name, task, priority = 'normal') {
            this.tasks.push({
                name,
                task,
                priority, // 'low', 'normal', 'high'
                added: Date.now()
            });

            // Sort by priority
            this.tasks.sort((a, b) => {
                const priorityOrder = { high: 3, normal: 2, low: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            });

            // Start processing if not already running
            if (!this.isRunning) {
                this.processQueue();
            }
        },

        /**
         * Process task queue during idle time
         */
        processQueue() {
            if (this.tasks.length === 0) {
                this.isRunning = false;
                return;
            }

            this.isRunning = true;

            this.requestIdleCallback((deadline) => {
                while (
                    this.tasks.length > 0 &&
                    (deadline.timeRemaining() > 0 || deadline.didTimeout)
                ) {
                    const { name, task } = this.tasks.shift();

                    try {
                        const startTime = performance.now();
                        task();
                        const duration = performance.now() - startTime;

                        if (localStorage.getItem('claudia_debug') === 'true') {
                            console.log(`⏱️ Idle task completed: ${name} (${duration.toFixed(1)}ms)`);
                        }
                    } catch (error) {
                        console.error(`Failed to execute idle task: ${name}`, error);
                    }

                    // Check if we're out of time
                    if (deadline.timeRemaining() <= 0) {
                        break;
                    }
                }

                // Continue processing if tasks remain
                if (this.tasks.length > 0) {
                    this.processQueue();
                } else {
                    this.isRunning = false;
                }
            }, { timeout: 2000 });
        },

        /**
         * Clear all pending tasks
         */
        clear() {
            this.tasks = [];
            this.isRunning = false;
        },

        /**
         * Get queue size
         */
        getQueueSize() {
            return this.tasks.length;
        }
    };

    // Export globally
    window.IdleTasks = window.ClaudiaIdleTasks;

    // Auto-initialize
    window.ClaudiaIdleTasks.init();

    // Schedule common idle tasks
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            scheduleCommonIdleTasks();
        });
    } else {
        scheduleCommonIdleTasks();
    }

    function scheduleCommonIdleTasks() {
        // Prefetch lazy modules
        window.ClaudiaIdleTasks.schedule('Prefetch lazy modules', () => {
            if (window.ClaudiaPreloader) {
                ClaudiaPreloader.prefetchOnIdle();
            }
        }, 'low');

        // Clean IndexedDB
        window.ClaudiaIdleTasks.schedule('Clean IndexedDB', () => {
            if (window.ClaudiaIndexedDB) {
                ClaudiaIndexedDB.cleanExpired();
            }
        }, 'low');

        // Compress localStorage
        window.ClaudiaIdleTasks.schedule('Compress localStorage', () => {
            if (window.ClaudiaCompression) {
                ClaudiaCompression.migrateLocalStorage();
            }
        }, 'low');

        // Update analytics
        window.ClaudiaIdleTasks.schedule('Update analytics', () => {
            if (window.ClaudiaAnalytics) {
                ClaudiaAnalytics.trackPageView();
            }
        }, 'normal');

        // Check for updates
        window.ClaudiaIdleTasks.schedule('Check for updates', () => {
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ type: 'CHECK_UPDATE' });
            }
        }, 'low');

        // Preload fonts
        window.ClaudiaIdleTasks.schedule('Preload fonts', () => {
            const fonts = [
                'Segoe UI',
                'Roboto',
                'Helvetica Neue'
            ];

            fonts.forEach(font => {
                if (document.fonts && document.fonts.load) {
                    document.fonts.load(`1em ${font}`);
                }
            });
        }, 'low');

        // Warm up worker
        window.ClaudiaIdleTasks.schedule('Warm up worker', () => {
            if (window.ClaudiaWorkerManager && !ClaudiaWorkerManager.worker) {
                ClaudiaWorkerManager.init();
            }
        }, 'normal');

        // Cache APUs to IndexedDB
        window.ClaudiaIdleTasks.schedule('Cache APUs', () => {
            if (window.APU_DB && window.ClaudiaIndexedDB) {
                ClaudiaIndexedDB.cacheAPUs(APU_DB.actividades);
            }
        }, 'high');

        // Preload critical images
        window.ClaudiaIdleTasks.schedule('Preload images', () => {
            const criticalImages = [
                '/icon-192.png',
                '/icon-512.png'
            ];

            criticalImages.forEach(src => {
                const img = new Image();
                img.src = src;
            });
        }, 'low');

        // Initialize performance monitoring
        window.ClaudiaIdleTasks.schedule('Init performance monitoring', () => {
            if (window.ClaudiaPerformance && !ClaudiaPerformance.initialized) {
                ClaudiaPerformance.init();
            }
        }, 'normal');
    }

    console.log('⏱️ Idle Task Scheduler v6.7.2 loaded');

})();

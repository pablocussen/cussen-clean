/**
 * CLAUDIA Smart Preloader v6.7.1
 * Intelligent prefetching of lazy modules based on user behavior
 * Now with network-aware loading and predictive prefetching
 */

(function() {
    'use strict';

    window.ClaudiaPreloader = {

        // Prefetch queue
        queue: [],
        loading: false,

        // Network info
        connection: null,
        networkType: 'unknown',

        // Predictive learning
        predictions: {},
        userPatterns: [],

        /**
         * Initialize smart preloader
         */
        init() {
            console.log('🔮 Smart Preloader v6.7.1 initialized');

            // Detect network conditions
            this.detectNetwork();

            // Load user patterns from storage
            this.loadUserPatterns();

            // Prefetch based on user interactions
            this.setupInteractionListeners();

            // Prefetch on idle (only on good connection)
            if (this.isGoodConnection()) {
                if ('requestIdleCallback' in window) {
                    requestIdleCallback(() => this.prefetchOnIdle(), { timeout: 2000 });
                } else {
                    setTimeout(() => this.prefetchOnIdle(), 3000);
                }
            }

            // Setup intersection observer for predictive loading
            this.setupIntersectionObserver();
        },

        /**
         * Detect network conditions
         */
        detectNetwork() {
            if ('connection' in navigator || 'mozConnection' in navigator || 'webkitConnection' in navigator) {
                this.connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
                this.networkType = this.connection.effectiveType || 'unknown';

                // Listen to network changes
                this.connection.addEventListener('change', () => {
                    this.networkType = this.connection.effectiveType;
                    console.log('🌐 Network changed to:', this.networkType);

                    // Adjust prefetch strategy based on network
                    this.adjustPrefetchStrategy();
                });
            }
        },

        /**
         * Check if connection is good enough for prefetching
         */
        isGoodConnection() {
            if (!this.connection) return true; // Default to yes if unknown

            // Don't prefetch on slow connections or save-data mode
            if (this.connection.saveData) return false;
            if (this.networkType === 'slow-2g' || this.networkType === '2g') return false;

            return true;
        },

        /**
         * Adjust prefetch strategy based on network
         */
        adjustPrefetchStrategy() {
            if (!this.isGoodConnection()) {
                // Clear prefetch queue on poor connection
                this.queue = [];
                console.log('⚠️ Prefetching paused due to poor connection');
            } else {
                // Resume prefetching
                this.prefetchOnIdle();
            }
        },

        /**
         * Load user patterns from storage
         */
        loadUserPatterns() {
            try {
                const saved = localStorage.getItem('claudia_user_patterns');
                if (saved) {
                    this.userPatterns = JSON.parse(saved);
                    this.analyzePredictions();
                }
            } catch (err) {
                console.error('Failed to load user patterns:', err);
            }
        },

        /**
         * Save user patterns
         */
        saveUserPatterns() {
            try {
                localStorage.setItem('claudia_user_patterns', JSON.stringify(this.userPatterns));
            } catch (err) {
                console.error('Failed to save user patterns:', err);
            }
        },

        /**
         * Track user action for predictive learning
         */
        trackAction(action, module) {
            this.userPatterns.push({
                action,
                module,
                timestamp: Date.now(),
                networkType: this.networkType
            });

            // Keep last 100 actions
            if (this.userPatterns.length > 100) {
                this.userPatterns = this.userPatterns.slice(-100);
            }

            this.saveUserPatterns();
            this.analyzePredictions();
        },

        /**
         * Analyze patterns to make predictions
         */
        analyzePredictions() {
            // Simple prediction: if user frequently uses a module after certain action, predict it
            const actionModuleMap = {};

            this.userPatterns.forEach(pattern => {
                const key = pattern.action;
                if (!actionModuleMap[key]) {
                    actionModuleMap[key] = {};
                }
                actionModuleMap[key][pattern.module] = (actionModuleMap[key][pattern.module] || 0) + 1;
            });

            // Store top predictions
            Object.keys(actionModuleMap).forEach(action => {
                const modules = actionModuleMap[action];
                const sorted = Object.entries(modules)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 2); // Top 2 predictions

                this.predictions[action] = sorted.map(([module]) => module);
            });
        },

        /**
         * Setup intersection observer for predictive loading
         */
        setupIntersectionObserver() {
            if (!('IntersectionObserver' in window)) return;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const target = entry.target;
                        const module = target.dataset.prefetchModule;

                        if (module && this.isGoodConnection()) {
                            this.prefetch(module, 'high');
                        }
                    }
                });
            }, {
                rootMargin: '50px' // Start prefetch 50px before element is visible
            });

            // Observe buttons that might trigger lazy loading
            document.querySelectorAll('[data-prefetch-module]').forEach(el => {
                observer.observe(el);
            });
        },

        /**
         * Setup listeners for user interactions
         */
        setupInteractionListeners() {
            // Prefetch photos module when user hovers over photo button
            const photoBtn = document.querySelector('[onclick*="openPhotoManager"]');
            if (photoBtn) {
                photoBtn.addEventListener('mouseenter', () => {
                    this.prefetch('photos', 'high');
                }, { once: true });
            }

            // Prefetch calendar when user hovers over calendar button
            const calendarBtn = document.querySelector('[onclick*="openCalendar"]');
            if (calendarBtn) {
                calendarBtn.addEventListener('mouseenter', () => {
                    this.prefetch('calendar', 'high');
                }, { once: true });
            }

            // Prefetch PDF when user hovers over export button
            const exportBtns = document.querySelectorAll('[onclick*="exportProject"], [onclick*="exportPDF"]');
            exportBtns.forEach(btn => {
                btn.addEventListener('mouseenter', () => {
                    this.prefetch('pdfExport', 'medium');
                }, { once: true });
            });

            // Prefetch voice if user has used it before
            if (localStorage.getItem('claudia_voice_used') === 'true') {
                this.prefetch('voice', 'low');
            }

            // Prefetch collaboration if sharing is enabled
            if (localStorage.getItem('claudia_sharing_enabled') === 'true') {
                this.prefetch('collaboration', 'low');
            }
        },

        /**
         * Prefetch module with priority
         * @param {string} module - Module name
         * @param {string} priority - Priority: 'high', 'medium', 'low'
         */
        prefetch(module, priority = 'low') {
            // Check if already loaded or in queue
            if (window.ClaudiaLazyLoader && window.ClaudiaLazyLoader.loaded[module]) {
                return;
            }

            if (this.queue.find(item => item.module === module)) {
                return;
            }

            const priorityValues = { high: 3, medium: 2, low: 1 };
            this.queue.push({
                module,
                priority: priorityValues[priority] || 1
            });

            // Sort by priority
            this.queue.sort((a, b) => b.priority - a.priority);

            // Start loading
            this.processQueue();
        },

        /**
         * Process prefetch queue
         */
        async processQueue() {
            if (this.loading || this.queue.length === 0) return;

            this.loading = true;
            const item = this.queue.shift();

            try {
                console.log(`🔮 Prefetching ${item.module}...`);

                // Use link prefetch
                const link = document.createElement('link');
                link.rel = 'prefetch';
                link.as = 'script';
                link.href = this.getModulePath(item.module);
                document.head.appendChild(link);

                // Wait a bit before next prefetch
                await this.delay(500);
            } catch (err) {
                console.error(`❌ Prefetch failed for ${item.module}:`, err);
            } finally {
                this.loading = false;
                this.processQueue(); // Process next item
            }
        },

        /**
         * Prefetch modules on idle time
         */
        prefetchOnIdle() {
            // Prefetch in order of likelihood
            const modules = ['photos', 'calendar', 'pdfExport', 'voice', 'collaboration'];

            modules.forEach((module, index) => {
                setTimeout(() => {
                    this.prefetch(module, 'low');
                }, index * 1000);
            });
        },

        /**
         * Get module file path
         * @param {string} module - Module name
         * @returns {string} File path
         */
        getModulePath(module) {
            const paths = {
                photos: 'js/claudia-photos.min.js',
                calendar: 'js/claudia-calendar.min.js',
                pdfExport: 'js/claudia-pdf-export.min.js',
                voice: 'js/claudia-voice.min.js',
                collaboration: 'js/claudia-collaboration.min.js'
            };
            return paths[module] || '';
        },

        /**
         * Delay helper
         * @param {number} ms - Milliseconds
         * @returns {Promise}
         */
        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    };

    // Auto-initialize after page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => ClaudiaPreloader.init(), 1000);
        });
    } else {
        setTimeout(() => ClaudiaPreloader.init(), 1000);
    }

})();
/**
 * CLAUDIA Lazy Loader v6.8
 * Dynamic import manager for on-demand feature loading
 * Reduces initial bundle size by loading heavy modules only when needed
 */

(function() {
    'use strict';

    window.ClaudiaLazyLoader = {

        // Track loaded modules
        loaded: {},
        loading: {},

        /**
         * Lazy load Photos module
         * @returns {Promise<void>}
         */
        async loadPhotos() {
            if (this.loaded.photos) return;
            if (this.loading.photos) return this.loading.photos;

            console.log('📸 Loading Photos module...');

            this.loading.photos = this.loadScript('js/claudia-photos.min.js')
                .then(() => {
                    this.loaded.photos = true;
                    delete this.loading.photos;
                    console.log('✅ Photos module loaded');

                    // Initialize if needed
                    if (window.PhotoManager && !window.PhotoManager.initialized) {
                        window.PhotoManager.init();
                    }
                })
                .catch(err => {
                    console.error('❌ Failed to load Photos module:', err);
                    delete this.loading.photos;
                    throw err;
                });

            return this.loading.photos;
        },

        /**
         * Lazy load Calendar module
         * @returns {Promise<void>}
         */
        async loadCalendar() {
            if (this.loaded.calendar) return;
            if (this.loading.calendar) return this.loading.calendar;

            console.log('📅 Loading Calendar module...');

            this.loading.calendar = this.loadScript('js/claudia-calendar.min.js')
                .then(() => {
                    this.loaded.calendar = true;
                    delete this.loading.calendar;
                    console.log('✅ Calendar module loaded');

                    // Initialize if needed
                    if (window.CalendarManager && !window.CalendarManager.initialized) {
                        window.CalendarManager.init();
                    }
                })
                .catch(err => {
                    console.error('❌ Failed to load Calendar module:', err);
                    delete this.loading.calendar;
                    throw err;
                });

            return this.loading.calendar;
        },

        /**
         * Lazy load PDF Export module
         * @returns {Promise<void>}
         */
        async loadPDFExport() {
            if (this.loaded.pdfExport) return;
            if (this.loading.pdfExport) return this.loading.pdfExport;

            console.log('📄 Loading PDF Export module...');

            this.loading.pdfExport = this.loadScript('js/claudia-pdf-export.min.js')
                .then(() => {
                    this.loaded.pdfExport = true;
                    delete this.loading.pdfExport;
                    console.log('✅ PDF Export module loaded');

                    // Initialize if needed
                    if (window.PDFExporter && !window.PDFExporter.initialized) {
                        window.PDFExporter.init();
                    }
                })
                .catch(err => {
                    console.error('❌ Failed to load PDF Export module:', err);
                    delete this.loading.pdfExport;
                    throw err;
                });

            return this.loading.pdfExport;
        },

        /**
         * Lazy load Voice module
         * @returns {Promise<void>}
         */
        async loadVoice() {
            if (this.loaded.voice) return;
            if (this.loading.voice) return this.loading.voice;

            console.log('🎤 Loading Voice module...');

            this.loading.voice = this.loadScript('js/claudia-voice.min.js')
                .then(() => {
                    this.loaded.voice = true;
                    delete this.loading.voice;
                    console.log('✅ Voice module loaded');

                    // Initialize if needed
                    if (window.VoiceCommands && !window.VoiceCommands.initialized) {
                        window.VoiceCommands.init();
                    }
                })
                .catch(err => {
                    console.error('❌ Failed to load Voice module:', err);
                    delete this.loading.voice;
                    throw err;
                });

            return this.loading.voice;
        },

        /**
         * Lazy load Collaboration module
         * @returns {Promise<void>}
         */
        async loadCollaboration() {
            if (this.loaded.collaboration) return;
            if (this.loading.collaboration) return this.loading.collaboration;

            console.log('👥 Loading Collaboration module...');

            this.loading.collaboration = this.loadScript('js/claudia-collaboration.min.js')
                .then(() => {
                    this.loaded.collaboration = true;
                    delete this.loading.collaboration;
                    console.log('✅ Collaboration module loaded');

                    // Initialize if needed
                    if (window.CollaborationManager && !window.CollaborationManager.initialized) {
                        window.CollaborationManager.init();
                    }
                })
                .catch(err => {
                    console.error('❌ Failed to load Collaboration module:', err);
                    delete this.loading.collaboration;
                    throw err;
                });

            return this.loading.collaboration;
        },

        /**
         * Load a JavaScript file dynamically
         * @param {string} src - Script source URL
         * @returns {Promise<void>}
         */
        loadScript(src) {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.async = true;

                script.onload = () => resolve();
                script.onerror = () => reject(new Error(`Failed to load script: ${src}`));

                document.head.appendChild(script);
            });
        },

        /**
         * Preload a module in the background (optional optimization)
         * @param {string} moduleName - Module to preload
         */
        preload(moduleName) {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.as = 'script';

            const moduleMap = {
                photos: 'js/claudia-photos.min.js',
                calendar: 'js/claudia-calendar.min.js',
                pdfExport: 'js/claudia-pdf-export.min.js',
                voice: 'js/claudia-voice.min.js',
                collaboration: 'js/claudia-collaboration.min.js'
            };

            link.href = moduleMap[moduleName];
            if (link.href) {
                document.head.appendChild(link);
                console.log(`🔮 Prefetching ${moduleName} module`);
            }
        },

        /**
         * Get loading stats
         * @returns {Object} Loading statistics
         */
        getStats() {
            const total = 5; // Total lazy modules
            const loaded = Object.keys(this.loaded).length;
            const loading = Object.keys(this.loading).length;

            return {
                total,
                loaded,
                loading,
                pending: total - loaded - loading,
                modules: {
                    photos: this.loaded.photos || false,
                    calendar: this.loaded.calendar || false,
                    pdfExport: this.loaded.pdfExport || false,
                    voice: this.loaded.voice || false,
                    collaboration: this.loaded.collaboration || false
                }
            };
        }
    };

    console.log('🚀 ClaudiaLazyLoader v6.8 ready');

})();

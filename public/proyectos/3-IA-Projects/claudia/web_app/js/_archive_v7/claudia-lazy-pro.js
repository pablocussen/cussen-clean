/**
 * CLAUDIA Lazy Loader for Pro Features v7.1
 * Load heavy modules only when needed
 * Reduces initial bundle by ~87 KB
 */

(function() {
    'use strict';

    window.ClaudiaLazyPro = {
        loaded: false,
        loading: false,
        callbacks: [],

        /**
         * Load Pro module on demand
         */
        async loadPro() {
            if (this.loaded) return true;
            if (this.loading) {
                return new Promise((resolve) => {
                    this.callbacks.push(resolve);
                });
            }

            this.loading = true;
            console.log('⏳ Loading Pro features...');

            try {
                // Create script tag
                const script = document.createElement('script');
                script.src = '/js/claudia-pro.js';
                script.async = true;

                await new Promise((resolve, reject) => {
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });

                this.loaded = true;
                this.loading = false;

                // Resolve waiting callbacks
                this.callbacks.forEach(cb => cb(true));
                this.callbacks = [];

                console.log('✅ Pro features loaded');
                return true;

            } catch (err) {
                this.loading = false;
                console.error('❌ Failed to load Pro features:', err);
                return false;
            }
        },

        /**
         * Check if user has Pro features enabled
         */
        isProUser() {
            return localStorage.getItem('claudia_pro_enabled') === 'true';
        },

        /**
         * Wrapper functions that auto-load Pro when called
         */
        async exportExcel(...args) {
            await this.loadPro();
            return window.ClaudiaPro?.exportExcel(...args);
        },

        async generatePDF(...args) {
            await this.loadPro();
            return window.ClaudiaPro?.generatePDF(...args);
        },

        async advancedAnalytics(...args) {
            await this.loadPro();
            return window.ClaudiaPro?.advancedAnalytics(...args);
        },

        async batchCalculation(...args) {
            await this.loadPro();
            return window.ClaudiaPro?.batchCalculation(...args);
        }
    };

    console.log('🔧 Lazy Pro Loader v7.1 ready');

})();

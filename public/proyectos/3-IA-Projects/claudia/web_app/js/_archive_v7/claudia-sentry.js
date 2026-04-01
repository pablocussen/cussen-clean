/**
 * CLAUDIA Sentry Error Tracking v7.1
 * Production error monitoring and reporting
 */

(function() {
    'use strict';

    window.ClaudiaSentry = {
        initialized: false,
        config: {
            dsn: '', // Set via environment variable or config
            environment: 'production',
            release: 'claudia@7.1.0',
            sampleRate: 1.0,
            tracesSampleRate: 0.1
        },

        /**
         * Initialize Sentry (lightweight without SDK for now)
         */
        init(config = {}) {
            this.config = { ...this.config, ...config };
            this.setupErrorHandlers();
            this.initialized = true;
            console.log('📊 Sentry monitoring v7.1 initialized');
        },

        /**
         * Setup global error handlers
         */
        setupErrorHandlers() {
            // Uncaught errors
            window.addEventListener('error', (event) => {
                this.captureError(event.error || event.message, {
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno
                });
            });

            // Unhandled promise rejections
            window.addEventListener('unhandledrejection', (event) => {
                this.captureError(event.reason, {
                    type: 'unhandledrejection',
                    promise: event.promise
                });
            });

            // Console errors (optional)
            const originalConsoleError = console.error;
            console.error = (...args) => {
                this.captureMessage(args.join(' '), 'error');
                originalConsoleError.apply(console, args);
            };
        },

        /**
         * Capture exception
         */
        captureError(error, context = {}) {
            if (!this.initialized) return;

            const errorData = {
                message: error.message || String(error),
                stack: error.stack,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userAgent: navigator.userAgent,
                release: this.config.release,
                environment: this.config.environment,
                context,
                user: this.getUserContext(),
                device: this.getDeviceInfo()
            };

            // Store locally for batch sending
            this.storeError(errorData);

            // Log to console in development
            if (this.config.environment !== 'production') {
                console.error('Sentry captured:', errorData);
            }

            // Send to analytics
            if (window.ClaudiaAnalytics) {
                window.ClaudiaAnalytics.trackEvent('error', {
                    message: errorData.message,
                    stack: errorData.stack?.substring(0, 100)
                });
            }
        },

        /**
         * Capture message
         */
        captureMessage(message, level = 'info') {
            if (!this.initialized) return;

            const messageData = {
                message,
                level,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                release: this.config.release
            };

            this.storeError(messageData);
        },

        /**
         * Store error locally (IndexedDB)
         */
        async storeError(errorData) {
            try {
                if (window.ClaudiaDB) {
                    await window.ClaudiaDB.trackEvent('error', errorData);
                } else {
                    // Fallback to localStorage
                    const errors = JSON.parse(localStorage.getItem('claudia_errors') || '[]');
                    errors.push(errorData);
                    // Keep last 50 errors
                    if (errors.length > 50) errors.shift();
                    localStorage.setItem('claudia_errors', JSON.stringify(errors));
                }
            } catch (err) {
                console.warn('Failed to store error:', err);
            }
        },

        /**
         * Get user context
         */
        getUserContext() {
            return {
                id: localStorage.getItem('claudia_user_id') || 'anonymous',
                sessionId: this.getSessionId(),
                projects: this.getProjectCount()
            };
        },

        /**
         * Get device info
         */
        getDeviceInfo() {
            return {
                screen: `${window.screen.width}x${window.screen.height}`,
                viewport: `${window.innerWidth}x${window.innerHeight}`,
                pixelRatio: window.devicePixelRatio,
                online: navigator.onLine,
                memory: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null,
                connection: navigator.connection ? {
                    type: navigator.connection.effectiveType,
                    downlink: navigator.connection.downlink
                } : null
            };
        },

        /**
         * Get session ID
         */
        getSessionId() {
            let sessionId = sessionStorage.getItem('claudia_session_id');
            if (!sessionId) {
                sessionId = Date.now().toString(36) + Math.random().toString(36);
                sessionStorage.setItem('claudia_session_id', sessionId);
            }
            return sessionId;
        },

        /**
         * Get project count
         */
        getProjectCount() {
            try {
                const projects = JSON.parse(localStorage.getItem('claudia_projects') || '[]');
                return projects.length;
            } catch {
                return 0;
            }
        },

        /**
         * Get stored errors
         */
        getStoredErrors() {
            try {
                return JSON.parse(localStorage.getItem('claudia_errors') || '[]');
            } catch {
                return [];
            }
        },

        /**
         * Clear stored errors
         */
        clearErrors() {
            localStorage.removeItem('claudia_errors');
            console.log('✅ Errors cleared');
        },

        /**
         * Add breadcrumb (navigation trail)
         */
        addBreadcrumb(message, data = {}) {
            const breadcrumb = {
                message,
                timestamp: Date.now(),
                data
            };

            const breadcrumbs = JSON.parse(sessionStorage.getItem('claudia_breadcrumbs') || '[]');
            breadcrumbs.push(breadcrumb);

            // Keep last 20 breadcrumbs
            if (breadcrumbs.length > 20) breadcrumbs.shift();

            sessionStorage.setItem('claudia_breadcrumbs', JSON.stringify(breadcrumbs));
        },

        /**
         * Set user context
         */
        setUser(userData) {
            if (userData.id) {
                localStorage.setItem('claudia_user_id', userData.id);
            }
        },

        /**
         * Performance monitoring
         */
        capturePerformance(metric, value, context = {}) {
            const perfData = {
                metric,
                value,
                timestamp: Date.now(),
                url: window.location.href,
                context
            };

            if (window.ClaudiaAnalytics) {
                window.ClaudiaAnalytics.trackEvent('performance', perfData);
            }
        }
    };

    // Auto-initialize
    setTimeout(() => {
        window.ClaudiaSentry.init({
            environment: window.location.hostname === 'localhost' ? 'development' : 'production'
        });
    }, 1000);

    console.log('📊 Sentry Error Tracking v7.1 loaded');

})();

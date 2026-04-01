/**
 * CLAUDIA Batch Analytics v6.7.2
 * Batches analytics events to reduce network requests
 * Improves performance and reduces bandwidth usage
 */

(function() {
    'use strict';

    window.ClaudiaBatchAnalytics = {
        // Configuration
        batchSize: 10,
        maxWaitTime: 30000, // 30 seconds
        endpoint: '/api/analytics',

        // State
        eventQueue: [],
        batchTimer: null,
        isSending: false,
        failedBatches: [],

        /**
         * Initialize batch analytics
         */
        init(options = {}) {
            if (options.batchSize) this.batchSize = options.batchSize;
            if (options.maxWaitTime) this.maxWaitTime = options.maxWaitTime;
            if (options.endpoint) this.endpoint = options.endpoint;

            // Load failed batches from localStorage
            this.loadFailedBatches();

            // Retry failed batches
            if (this.failedBatches.length > 0) {
                this.retryFailedBatches();
            }

            // Send batch before page unload
            window.addEventListener('beforeunload', () => {
                this.flush(true); // Use sendBeacon for reliability
            });

            // Send batch on visibility change (tab close/minimize)
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.flush(true);
                }
            });

            console.log('📊 Batch Analytics initialized');
        },

        /**
         * Track event (add to queue)
         */
        track(eventName, eventData = {}) {
            const event = {
                name: eventName,
                data: eventData,
                timestamp: Date.now(),
                sessionId: this.getSessionId(),
                url: window.location.href,
                userAgent: navigator.userAgent
            };

            // Add to queue
            this.eventQueue.push(event);

            // Check if batch is ready
            if (this.eventQueue.length >= this.batchSize) {
                this.flush();
            } else {
                // Start/reset timer
                this.startBatchTimer();
            }

            // Also log to console in debug mode
            if (localStorage.getItem('claudia_debug') === 'true') {
                console.log('📊 Event tracked:', eventName, eventData);
            }
        },

        /**
         * Start batch timer
         */
        startBatchTimer() {
            if (this.batchTimer) {
                clearTimeout(this.batchTimer);
            }

            this.batchTimer = setTimeout(() => {
                this.flush();
            }, this.maxWaitTime);
        },

        /**
         * Flush queue (send batch)
         */
        async flush(useBeacon = false) {
            if (this.eventQueue.length === 0 || this.isSending) {
                return;
            }

            // Clear timer
            if (this.batchTimer) {
                clearTimeout(this.batchTimer);
                this.batchTimer = null;
            }

            // Get events to send
            const eventsToSend = [...this.eventQueue];
            this.eventQueue = [];

            const batch = {
                events: eventsToSend,
                batchId: this.generateBatchId(),
                sentAt: Date.now()
            };

            // Send via beacon (for page unload) or fetch
            if (useBeacon && navigator.sendBeacon) {
                this.sendBeacon(batch);
            } else {
                await this.sendFetch(batch);
            }
        },

        /**
         * Send via sendBeacon (reliable for page unload)
         */
        sendBeacon(batch) {
            const blob = new Blob(
                [JSON.stringify(batch)],
                { type: 'application/json' }
            );

            const sent = navigator.sendBeacon(this.endpoint, blob);

            if (!sent) {
                // Beacon failed, save to failed batches
                this.saveFailedBatch(batch);
            }
        },

        /**
         * Send via fetch (normal case)
         */
        async sendFetch(batch) {
            this.isSending = true;

            try {
                const response = await fetch(this.endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(batch)
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                console.log('📊 Batch sent:', batch.events.length, 'events');

            } catch (error) {
                console.error('Failed to send analytics batch:', error);

                // Save to failed batches for retry
                this.saveFailedBatch(batch);

            } finally {
                this.isSending = false;
            }
        },

        /**
         * Save failed batch
         */
        saveFailedBatch(batch) {
            this.failedBatches.push(batch);

            // Keep only last 50 failed batches
            if (this.failedBatches.length > 50) {
                this.failedBatches = this.failedBatches.slice(-50);
            }

            // Save to localStorage
            try {
                localStorage.setItem(
                    'claudia_failed_analytics',
                    JSON.stringify(this.failedBatches)
                );
            } catch (error) {
                console.error('Failed to save failed batches:', error);
            }
        },

        /**
         * Load failed batches from localStorage
         */
        loadFailedBatches() {
            try {
                const saved = localStorage.getItem('claudia_failed_analytics');
                if (saved) {
                    this.failedBatches = JSON.parse(saved);
                }
            } catch (error) {
                console.error('Failed to load failed batches:', error);
                this.failedBatches = [];
            }
        },

        /**
         * Retry failed batches
         */
        async retryFailedBatches() {
            if (this.failedBatches.length === 0) return;

            console.log('🔄 Retrying', this.failedBatches.length, 'failed batches...');

            const batches = [...this.failedBatches];
            this.failedBatches = [];

            for (const batch of batches) {
                await this.sendFetch(batch);

                // Wait a bit between retries
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Clear from localStorage if all succeeded
            if (this.failedBatches.length === 0) {
                localStorage.removeItem('claudia_failed_analytics');
            }
        },

        /**
         * Get or create session ID
         */
        getSessionId() {
            let sessionId = sessionStorage.getItem('claudia_session_id');

            if (!sessionId) {
                sessionId = this.generateSessionId();
                sessionStorage.setItem('claudia_session_id', sessionId);
            }

            return sessionId;
        },

        /**
         * Generate session ID
         */
        generateSessionId() {
            return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        },

        /**
         * Generate batch ID
         */
        generateBatchId() {
            return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        },

        /**
         * Get queue size
         */
        getQueueSize() {
            return this.eventQueue.length;
        },

        /**
         * Get failed batch count
         */
        getFailedCount() {
            return this.failedBatches.length;
        },

        /**
         * Clear queue
         */
        clearQueue() {
            this.eventQueue = [];

            if (this.batchTimer) {
                clearTimeout(this.batchTimer);
                this.batchTimer = null;
            }
        },

        /**
         * Destroy
         */
        destroy() {
            this.flush(true);
            this.clearQueue();
        }
    };

    // Export globally
    window.BatchAnalytics = window.ClaudiaBatchAnalytics;

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.ClaudiaBatchAnalytics.init();
        });
    } else {
        window.ClaudiaBatchAnalytics.init();
    }

    // Integrate with existing analytics
    if (window.ClaudiaAnalytics) {
        const originalTrack = ClaudiaAnalytics.track;

        ClaudiaAnalytics.track = function(eventName, eventData) {
            // Call original
            if (originalTrack) {
                originalTrack.call(ClaudiaAnalytics, eventName, eventData);
            }

            // Also add to batch queue
            ClaudiaBatchAnalytics.track(eventName, eventData);
        };
    }

    console.log('📊 Batch Analytics v6.7.2 loaded');

})();

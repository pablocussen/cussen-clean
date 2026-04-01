/**
 * CLAUDIA Network Error Recovery System v6.9.0
 *
 * Automatic network error handling and recovery:
 * - Exponential backoff retry
 * - Circuit breaker pattern
 * - Request timeout handling
 * - Offline detection
 * - Graceful degradation
 * - Error reporting and tracking
 *
 * @module ClaudiaNetworkRecovery
 * @version 6.9.0
 */

window.ClaudiaNetworkRecovery = {
    version: '6.9.0',
    initialized: false,

    // Configuration
    config: {
        maxRetries: 3,
        baseDelay: 1000,              // 1 second
        maxDelay: 30000,              // 30 seconds
        timeout: 30000,               // 30 seconds
        circuitBreakerThreshold: 5,   // failures before opening circuit
        circuitBreakerTimeout: 60000, // 1 minute
        enableCircuitBreaker: true,
        enableTimeout: true,
        enableRetry: true
    },

    // State
    failureCount: new Map(),
    circuitBreakers: new Map(),
    requestStats: {
        total: 0,
        success: 0,
        failed: 0,
        retried: 0,
        timedOut: 0,
        circuitOpen: 0
    },
    activeRequests: new Map(),

    /**
     * Initialize network recovery
     */
    init() {
        if (this.initialized) {
            console.log('ClaudiaNetworkRecovery: Already initialized');
            return;
        }

        console.log('ClaudiaNetworkRecovery: Initializing v6.9.0...');

        // Monitor fetch requests
        this.interceptFetch();

        // Setup visibility change listener
        this.setupVisibilityListener();

        // Periodic circuit breaker check
        this.startCircuitBreakerMonitor();

        this.initialized = true;
        console.log('ClaudiaNetworkRecovery: Initialized successfully');
    },

    /**
     * Intercept fetch to add recovery
     */
    interceptFetch() {
        const originalFetch = window.fetch;

        window.fetch = async (...args) => {
            return this.fetchWithRecovery(originalFetch, ...args);
        };

        console.log('ClaudiaNetworkRecovery: Fetch intercepted for recovery');
    },

    /**
     * Fetch with automatic recovery
     */
    async fetchWithRecovery(originalFetch, ...args) {
        const url = args[0] instanceof Request ? args[0].url : args[0];
        const requestId = this.generateRequestId();

        this.requestStats.total++;
        this.activeRequests.set(requestId, {
            url,
            startTime: Date.now(),
            retries: 0
        });

        try {
            // Check circuit breaker
            if (this.config.enableCircuitBreaker && this.isCircuitOpen(url)) {
                this.requestStats.circuitOpen++;
                throw new Error('Circuit breaker is open');
            }

            // Fetch with timeout and retry
            const response = await this.fetchWithTimeout(
                originalFetch,
                args,
                requestId
            );

            // Success
            this.requestStats.success++;
            this.recordSuccess(url);
            this.activeRequests.delete(requestId);

            return response;

        } catch (error) {
            this.requestStats.failed++;
            this.recordFailure(url);

            // Handle specific errors
            if (error.name === 'TimeoutError') {
                this.requestStats.timedOut++;
            }

            this.activeRequests.delete(requestId);

            // Dispatch error event
            document.dispatchEvent(new CustomEvent('claudia:network-error', {
                detail: {
                    url,
                    error: error.message,
                    requestId,
                    timestamp: Date.now()
                }
            }));

            throw error;
        }
    },

    /**
     * Fetch with timeout
     */
    async fetchWithTimeout(originalFetch, args, requestId) {
        if (!this.config.enableTimeout) {
            return await originalFetch(...args);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, this.config.timeout);

        try {
            const options = args[1] || {};
            const response = await originalFetch(args[0], {
                ...options,
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            return response;

        } catch (error) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                const timeoutError = new Error(`Request timeout after ${this.config.timeout}ms`);
                timeoutError.name = 'TimeoutError';
                throw timeoutError;
            }

            // Retry logic
            if (this.config.enableRetry && this.shouldRetry(error)) {
                const request = this.activeRequests.get(requestId);
                if (request && request.retries < this.config.maxRetries) {
                    request.retries++;
                    this.requestStats.retried++;

                    const delay = this.calculateBackoffDelay(request.retries);

                    console.log(`ClaudiaNetworkRecovery: Retrying request (${request.retries}/${this.config.maxRetries}) after ${delay}ms`);

                    await this.sleep(delay);

                    return this.fetchWithTimeout(originalFetch, args, requestId);
                }
            }

            throw error;
        }
    },

    /**
     * Calculate exponential backoff delay
     */
    calculateBackoffDelay(retryCount) {
        const delay = this.config.baseDelay * Math.pow(2, retryCount - 1);
        const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
        return Math.min(delay + jitter, this.config.maxDelay);
    },

    /**
     * Check if error should trigger retry
     */
    shouldRetry(error) {
        // Network errors
        if (error.message.includes('Failed to fetch')) return true;
        if (error.message.includes('NetworkError')) return true;
        if (error.name === 'TimeoutError') return true;

        // Server errors (5xx)
        if (error.status >= 500) return true;

        // Too many requests (429)
        if (error.status === 429) return true;

        return false;
    },

    /**
     * Record successful request
     */
    recordSuccess(url) {
        const domain = this.getDomain(url);

        // Reset failure count
        this.failureCount.set(domain, 0);

        // Close circuit breaker if half-open
        const circuit = this.circuitBreakers.get(domain);
        if (circuit && circuit.state === 'half-open') {
            this.closeCircuit(domain);
        }
    },

    /**
     * Record failed request
     */
    recordFailure(url) {
        const domain = this.getDomain(url);

        // Increment failure count
        const count = (this.failureCount.get(domain) || 0) + 1;
        this.failureCount.set(domain, count);

        // Check circuit breaker threshold
        if (this.config.enableCircuitBreaker &&
            count >= this.config.circuitBreakerThreshold) {
            this.openCircuit(domain);
        }
    },

    /**
     * Check if circuit is open
     */
    isCircuitOpen(url) {
        const domain = this.getDomain(url);
        const circuit = this.circuitBreakers.get(domain);

        if (!circuit) return false;

        const now = Date.now();

        switch (circuit.state) {
            case 'open':
                // Check if timeout has elapsed
                if (now - circuit.openedAt >= this.config.circuitBreakerTimeout) {
                    this.halfOpenCircuit(domain);
                    return false;
                }
                return true;

            case 'half-open':
                return false;

            case 'closed':
            default:
                return false;
        }
    },

    /**
     * Open circuit breaker
     */
    openCircuit(domain) {
        this.circuitBreakers.set(domain, {
            state: 'open',
            openedAt: Date.now(),
            failureCount: this.failureCount.get(domain)
        });

        console.warn(`ClaudiaNetworkRecovery: Circuit breaker OPENED for ${domain}`);

        // Dispatch event
        document.dispatchEvent(new CustomEvent('claudia:circuit-opened', {
            detail: { domain, timestamp: Date.now() }
        }));
    },

    /**
     * Half-open circuit breaker (test mode)
     */
    halfOpenCircuit(domain) {
        const circuit = this.circuitBreakers.get(domain);
        if (circuit) {
            circuit.state = 'half-open';
            circuit.halfOpenedAt = Date.now();

            console.log(`ClaudiaNetworkRecovery: Circuit breaker HALF-OPEN for ${domain}`);

            // Dispatch event
            document.dispatchEvent(new CustomEvent('claudia:circuit-half-open', {
                detail: { domain, timestamp: Date.now() }
            }));
        }
    },

    /**
     * Close circuit breaker
     */
    closeCircuit(domain) {
        this.circuitBreakers.delete(domain);
        this.failureCount.set(domain, 0);

        console.log(`ClaudiaNetworkRecovery: Circuit breaker CLOSED for ${domain}`);

        // Dispatch event
        document.dispatchEvent(new CustomEvent('claudia:circuit-closed', {
            detail: { domain, timestamp: Date.now() }
        }));
    },

    /**
     * Monitor circuit breakers periodically
     */
    startCircuitBreakerMonitor() {
        setInterval(() => {
            const now = Date.now();

            for (const [domain, circuit] of this.circuitBreakers.entries()) {
                if (circuit.state === 'open') {
                    // Auto half-open after timeout
                    if (now - circuit.openedAt >= this.config.circuitBreakerTimeout) {
                        this.halfOpenCircuit(domain);
                    }
                }
            }
        }, 10000); // Check every 10 seconds
    },

    /**
     * Setup visibility change listener
     */
    setupVisibilityListener() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Tab hidden - pause active requests
                console.log('ClaudiaNetworkRecovery: Tab hidden, pausing requests');
            } else {
                // Tab visible - resume
                console.log('ClaudiaNetworkRecovery: Tab visible, resuming');

                // Check connection and retry failed requests
                if (navigator.onLine) {
                    this.retryFailedRequests();
                }
            }
        });
    },

    /**
     * Retry failed requests
     */
    retryFailedRequests() {
        console.log('ClaudiaNetworkRecovery: Retrying failed requests...');

        // Dispatch event to trigger sync
        if (window.ClaudiaBackgroundSync) {
            window.ClaudiaBackgroundSync.syncPending();
        }
    },

    /**
     * Get domain from URL
     */
    getDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.origin;
        } catch (error) {
            return url;
        }
    },

    /**
     * Generate request ID
     */
    generateRequestId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Get statistics
     */
    getStats() {
        return {
            ...this.requestStats,
            activeRequests: this.activeRequests.size,
            circuitBreakers: Array.from(this.circuitBreakers.entries()).map(([domain, circuit]) => ({
                domain,
                state: circuit.state,
                failureCount: this.failureCount.get(domain) || 0
            })),
            successRate: ((this.requestStats.success / this.requestStats.total) * 100).toFixed(1) + '%',
            retryRate: ((this.requestStats.retried / this.requestStats.total) * 100).toFixed(1) + '%'
        };
    },

    /**
     * Get circuit breaker status
     */
    getCircuitStatus(url) {
        const domain = this.getDomain(url);
        const circuit = this.circuitBreakers.get(domain);

        return {
            domain,
            state: circuit?.state || 'closed',
            failureCount: this.failureCount.get(domain) || 0,
            isOpen: this.isCircuitOpen(url)
        };
    },

    /**
     * Manually reset circuit breaker
     */
    resetCircuit(url) {
        const domain = this.getDomain(url);
        this.closeCircuit(domain);
        console.log(`ClaudiaNetworkRecovery: Manually reset circuit for ${domain}`);
    },

    /**
     * Manually reset all circuits
     */
    resetAllCircuits() {
        const count = this.circuitBreakers.size;

        this.circuitBreakers.clear();
        this.failureCount.clear();

        console.log(`ClaudiaNetworkRecovery: Reset ${count} circuit breakers`);

        return count;
    },

    /**
     * Log statistics
     */
    logStats() {
        console.log('ClaudiaNetworkRecovery: Statistics', this.getStats());
    }
};

// Auto-initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.ClaudiaNetworkRecovery.init();
    });
} else {
    window.ClaudiaNetworkRecovery.init();
}

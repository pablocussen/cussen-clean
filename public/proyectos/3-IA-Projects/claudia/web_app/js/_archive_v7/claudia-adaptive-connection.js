/**
 * CLAUDIA Adaptive Connection Detector v6.8.0
 *
 * Network-aware adaptive loading system:
 * - Real-time connection quality monitoring
 * - Adaptive resource loading strategies
 * - Data saver mode detection
 * - Download speed estimation
 * - RTT (Round Trip Time) tracking
 * - Automatic quality adjustment
 *
 * @module ClaudiaAdaptiveConnection
 * @version 6.8.0
 * @requires navigator.connection
 */

window.ClaudiaAdaptiveConnection = {
    version: '6.8.0',
    initialized: false,

    // Configuration
    config: {
        speedTestInterval: 60000,      // Test speed every 60s
        speedTestSize: 50000,           // 50KB test file
        rttThreshold: {
            excellent: 50,              // < 50ms
            good: 100,                  // < 100ms
            moderate: 300,              // < 300ms
            poor: 1000                  // < 1000ms
        },
        downloadThreshold: {            // Mbps
            excellent: 10,
            good: 5,
            moderate: 1,
            poor: 0.5
        }
    },

    // State
    connection: {
        type: 'unknown',
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        saveData: false,
        quality: 'excellent'
    },

    speedTests: [],
    listeners: new Set(),
    updateTimer: null,

    /**
     * Initialize adaptive connection detector
     */
    init() {
        if (this.initialized) {
            console.log('ClaudiaAdaptiveConnection: Already initialized');
            return;
        }

        console.log('ClaudiaAdaptiveConnection: Initializing v6.8.0...');

        // Check browser support
        if (!navigator.connection) {
            console.warn('ClaudiaAdaptiveConnection: Network Information API not supported');
            this.connection.quality = 'unknown';
            this.initialized = true;
            return;
        }

        // Get initial connection info
        this.updateConnectionInfo();

        // Listen for connection changes
        this.setupListeners();

        // Start periodic speed testing
        this.startSpeedTesting();

        this.initialized = true;
        console.log('ClaudiaAdaptiveConnection: Initialized successfully');
        this.logConnectionInfo();
    },

    /**
     * Update connection information
     */
    updateConnectionInfo() {
        const conn = navigator.connection;

        if (!conn) return;

        this.connection = {
            type: conn.type || 'unknown',
            effectiveType: conn.effectiveType || '4g',
            downlink: conn.downlink || 10,
            rtt: conn.rtt || 50,
            saveData: conn.saveData || false,
            quality: this.calculateQuality(conn)
        };

        // Notify listeners
        this.notifyListeners('connection-change', this.connection);

        // Apply adaptive strategies
        this.applyAdaptiveStrategies();
    },

    /**
     * Calculate overall connection quality
     */
    calculateQuality(conn) {
        const rtt = conn.rtt || 50;
        const downlink = conn.downlink || 10;
        const saveData = conn.saveData || false;

        // If data saver mode is on, always use poor quality
        if (saveData) {
            return 'data-saver';
        }

        // Score based on RTT
        let rttScore = 4;
        if (rtt < this.config.rttThreshold.excellent) rttScore = 4;
        else if (rtt < this.config.rttThreshold.good) rttScore = 3;
        else if (rtt < this.config.rttThreshold.moderate) rttScore = 2;
        else if (rtt < this.config.rttThreshold.poor) rttScore = 1;
        else rttScore = 0;

        // Score based on download speed
        let dlScore = 4;
        if (downlink >= this.config.downloadThreshold.excellent) dlScore = 4;
        else if (downlink >= this.config.downloadThreshold.good) dlScore = 3;
        else if (downlink >= this.config.downloadThreshold.moderate) dlScore = 2;
        else if (downlink >= this.config.downloadThreshold.poor) dlScore = 1;
        else dlScore = 0;

        // Average score
        const avgScore = (rttScore + dlScore) / 2;

        if (avgScore >= 3.5) return 'excellent';
        if (avgScore >= 2.5) return 'good';
        if (avgScore >= 1.5) return 'moderate';
        return 'poor';
    },

    /**
     * Setup event listeners
     */
    setupListeners() {
        const conn = navigator.connection;

        if (!conn) return;

        // Listen for connection changes
        conn.addEventListener('change', () => {
            console.log('ClaudiaAdaptiveConnection: Connection changed');
            this.updateConnectionInfo();
        });
    },

    /**
     * Start periodic speed testing
     */
    startSpeedTesting() {
        // Run initial test after 5 seconds
        setTimeout(() => {
            this.runSpeedTest();
        }, 5000);

        // Run periodic tests
        this.updateTimer = setInterval(() => {
            this.runSpeedTest();
        }, this.config.speedTestInterval);
    },

    /**
     * Run download speed test
     */
    async runSpeedTest() {
        // Skip if data saver mode is on
        if (this.connection.saveData) {
            console.log('ClaudiaAdaptiveConnection: Speed test skipped (data saver mode)');
            return;
        }

        try {
            const testUrl = this.getSpeedTestUrl();
            const startTime = performance.now();

            const response = await fetch(testUrl, {
                cache: 'no-store',
                mode: 'cors'
            });

            const blob = await response.blob();
            const endTime = performance.now();

            const duration = (endTime - startTime) / 1000; // seconds
            const sizeBytes = blob.size;
            const sizeMb = sizeBytes / (1024 * 1024);
            const speedMbps = (sizeMb * 8) / duration; // Mbps

            const result = {
                timestamp: Date.now(),
                duration,
                sizeBytes,
                speedMbps,
                rtt: endTime - startTime
            };

            this.speedTests.push(result);

            // Keep only last 10 tests
            if (this.speedTests.length > 10) {
                this.speedTests.shift();
            }

            console.log(`ClaudiaAdaptiveConnection: Speed test completed - ${speedMbps.toFixed(2)} Mbps`);

            // Update connection quality based on test
            this.updateQualityFromSpeedTest(speedMbps);

            // Notify listeners
            this.notifyListeners('speed-test-complete', result);

        } catch (error) {
            console.error('ClaudiaAdaptiveConnection: Speed test failed', error);
        }
    },

    /**
     * Get speed test URL
     */
    getSpeedTestUrl() {
        // Use a small JSON file or image from your server
        // Add cache buster to prevent caching
        return `data:image/png;base64,${this.generateRandomData(this.config.speedTestSize)}`;
    },

    /**
     * Generate random data for speed test
     */
    generateRandomData(size) {
        // Generate random base64 string
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        let result = '';
        for (let i = 0; i < size; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    /**
     * Update quality based on speed test results
     */
    updateQualityFromSpeedTest(speedMbps) {
        let newQuality = 'poor';

        if (speedMbps >= this.config.downloadThreshold.excellent) {
            newQuality = 'excellent';
        } else if (speedMbps >= this.config.downloadThreshold.good) {
            newQuality = 'good';
        } else if (speedMbps >= this.config.downloadThreshold.moderate) {
            newQuality = 'moderate';
        }

        if (newQuality !== this.connection.quality) {
            const oldQuality = this.connection.quality;
            this.connection.quality = newQuality;

            console.log(`ClaudiaAdaptiveConnection: Quality changed from ${oldQuality} to ${newQuality}`);

            this.notifyListeners('quality-change', {
                old: oldQuality,
                new: newQuality
            });

            // Reapply strategies
            this.applyAdaptiveStrategies();
        }
    },

    /**
     * Apply adaptive loading strategies based on connection
     */
    applyAdaptiveStrategies() {
        const quality = this.connection.quality;

        console.log(`ClaudiaAdaptiveConnection: Applying strategies for ${quality} connection`);

        // Strategy 1: Adjust image quality
        if (window.ClaudiaProgressiveImages) {
            const imageQuality = this.getImageQuality();
            console.log(`Setting image quality: ${imageQuality}%`);
        }

        // Strategy 2: Control lazy loading distance
        this.adjustLazyLoadingDistance();

        // Strategy 3: Control prefetching
        this.controlPrefetching();

        // Strategy 4: Adjust analytics batching
        this.adjustAnalyticsBatching();

        // Dispatch global event
        document.dispatchEvent(new CustomEvent('claudia:connection-quality-change', {
            detail: { quality, connection: this.connection }
        }));
    },

    /**
     * Get recommended image quality
     */
    getImageQuality() {
        const qualityMap = {
            'excellent': 90,
            'good': 75,
            'moderate': 60,
            'poor': 40,
            'data-saver': 30
        };

        return qualityMap[this.connection.quality] || 75;
    },

    /**
     * Adjust lazy loading viewport margin
     */
    adjustLazyLoadingDistance() {
        const marginMap = {
            'excellent': '200px',
            'good': '100px',
            'moderate': '50px',
            'poor': '10px',
            'data-saver': '0px'
        };

        const margin = marginMap[this.connection.quality] || '50px';

        if (window.ClaudiaProgressiveImages) {
            window.ClaudiaProgressiveImages.config.rootMargin = margin;
            console.log(`Lazy loading margin: ${margin}`);
        }
    },

    /**
     * Control resource prefetching
     */
    controlPrefetching() {
        const shouldPrefetch = ['excellent', 'good'].includes(this.connection.quality);

        if (window.ClaudiaResourceHints) {
            window.ClaudiaResourceHints.config.enablePrefetch = shouldPrefetch;
            console.log(`Prefetching: ${shouldPrefetch ? 'enabled' : 'disabled'}`);
        }
    },

    /**
     * Adjust analytics event batching
     */
    adjustAnalyticsBatching() {
        if (!window.ClaudiaBatchAnalytics) return;

        const batchSizeMap = {
            'excellent': 10,
            'good': 15,
            'moderate': 25,
            'poor': 50,
            'data-saver': 100
        };

        const batchSize = batchSizeMap[this.connection.quality] || 10;

        window.ClaudiaBatchAnalytics.batchSize = batchSize;
        console.log(`Analytics batch size: ${batchSize}`);
    },

    /**
     * Add listener for connection changes
     */
    addListener(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    },

    /**
     * Notify all listeners
     */
    notifyListeners(event, data) {
        this.listeners.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('ClaudiaAdaptiveConnection: Listener error', error);
            }
        });
    },

    /**
     * Get current connection info
     */
    getConnectionInfo() {
        return { ...this.connection };
    },

    /**
     * Get average speed from tests
     */
    getAverageSpeed() {
        if (this.speedTests.length === 0) return null;

        const sum = this.speedTests.reduce((acc, test) => acc + test.speedMbps, 0);
        return sum / this.speedTests.length;
    },

    /**
     * Check if connection is fast enough for feature
     */
    canUseFeature(feature) {
        const requirements = {
            'video-autoplay': ['excellent', 'good'],
            'high-res-images': ['excellent', 'good'],
            'animations': ['excellent', 'good', 'moderate'],
            'prefetch': ['excellent', 'good'],
            'background-sync': ['excellent', 'good', 'moderate']
        };

        const allowedQualities = requirements[feature] || [];
        return allowedQualities.includes(this.connection.quality);
    },

    /**
     * Log connection information
     */
    logConnectionInfo() {
        console.log('ClaudiaAdaptiveConnection: Current connection:', {
            quality: this.connection.quality,
            effectiveType: this.connection.effectiveType,
            downlink: `${this.connection.downlink} Mbps`,
            rtt: `${this.connection.rtt} ms`,
            saveData: this.connection.saveData,
            avgSpeed: this.getAverageSpeed() ? `${this.getAverageSpeed().toFixed(2)} Mbps` : 'N/A'
        });
    },

    /**
     * Get statistics
     */
    getStats() {
        return {
            connection: this.getConnectionInfo(),
            speedTests: this.speedTests.length,
            averageSpeed: this.getAverageSpeed(),
            listeners: this.listeners.size
        };
    },

    /**
     * Stop monitoring
     */
    stop() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }

        this.listeners.clear();
        console.log('ClaudiaAdaptiveConnection: Stopped');
    }
};

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.ClaudiaAdaptiveConnection.init();
    });
} else {
    window.ClaudiaAdaptiveConnection.init();
}

/**
 * CLAUDIA Performance Monitor v6.7
 * Real User Monitoring (RUM) and performance tracking
 */

(function() {
    'use strict';

    window.ClaudiaPerformance = {

        metrics: {},

        /**
         * Initialize performance monitoring
         */
        init() {
            console.log('📊 Performance Monitor v6.7 initialized');

            // Wait for page load
            if (document.readyState === 'complete') {
                this.collectMetrics();
            } else {
                window.addEventListener('load', () => this.collectMetrics());
            }

            // Monitor lazy module loads
            this.monitorLazyLoads();

            // Report on page visibility change
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.reportMetrics();
                }
            });
        },

        /**
         * Collect performance metrics
         */
        collectMetrics() {
            if (!window.performance || !window.performance.timing) {
                console.warn('⚠️ Performance API not supported');
                return;
            }

            const timing = performance.timing;
            const navigation = performance.navigation;

            // Calculate key metrics
            this.metrics = {
                // Page load metrics
                dns: timing.domainLookupEnd - timing.domainLookupStart,
                tcp: timing.connectEnd - timing.connectStart,
                ttfb: timing.responseStart - timing.navigationStart, // Time to First Byte
                download: timing.responseEnd - timing.responseStart,
                domInteractive: timing.domInteractive - timing.navigationStart,
                domComplete: timing.domComplete - timing.navigationStart,
                loadComplete: timing.loadEventEnd - timing.navigationStart,

                // User-centric metrics
                fcp: this.getFirstContentfulPaint(),
                lcp: this.getLargestContentfulPaint(),
                fid: this.getFirstInputDelay(),
                cls: this.getCumulativeLayoutShift(),

                // Navigation type
                navigationType: this.getNavigationType(navigation.type),

                // Resource timing
                resources: this.getResourceMetrics(),

                // Memory (if available)
                memory: this.getMemoryInfo(),

                // Connection info
                connection: this.getConnectionInfo(),

                // Timestamp
                timestamp: new Date().toISOString(),

                // Bundle size
                bundleSize: this.getBundleSize()
            };

            console.log('📊 Performance Metrics:', this.metrics);

            // Store locally
            this.storeMetrics();

            // Send to analytics if available
            if (window.ClaudiaAnalytics) {
                ClaudiaAnalytics.trackPerformance(this.metrics);
            }
        },

        /**
         * Get First Contentful Paint
         */
        getFirstContentfulPaint() {
            try {
                const entries = performance.getEntriesByName('first-contentful-paint');
                return entries.length > 0 ? Math.round(entries[0].startTime) : null;
            } catch (err) {
                return null;
            }
        },

        /**
         * Get Largest Contentful Paint
         */
        getLargestContentfulPaint() {
            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    this.metrics.lcp = Math.round(lastEntry.startTime);
                });
                observer.observe({ entryTypes: ['largest-contentful-paint'] });
                return 'observing';
            } catch (err) {
                return null;
            }
        },

        /**
         * Get First Input Delay
         */
        getFirstInputDelay() {
            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        this.metrics.fid = Math.round(entry.processingStart - entry.startTime);
                    });
                });
                observer.observe({ entryTypes: ['first-input'] });
                return 'observing';
            } catch (err) {
                return null;
            }
        },

        /**
         * Get Cumulative Layout Shift
         */
        getCumulativeLayoutShift() {
            try {
                let clsValue = 0;
                const observer = new PerformanceObserver((list) => {
                    list.getEntries().forEach(entry => {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                            this.metrics.cls = clsValue.toFixed(3);
                        }
                    });
                });
                observer.observe({ entryTypes: ['layout-shift'] });
                return 'observing';
            } catch (err) {
                return null;
            }
        },

        /**
         * Get navigation type
         */
        getNavigationType(type) {
            const types = ['navigate', 'reload', 'back_forward', 'prerender'];
            return types[type] || 'unknown';
        },

        /**
         * Get resource timing metrics
         */
        getResourceMetrics() {
            try {
                const resources = performance.getEntriesByType('resource');

                const metrics = {
                    total: resources.length,
                    js: 0,
                    css: 0,
                    images: 0,
                    fonts: 0,
                    other: 0,
                    totalSize: 0,
                    avgDuration: 0
                };

                let totalDuration = 0;

                resources.forEach(resource => {
                    const name = resource.name;
                    const size = resource.transferSize || 0;
                    const duration = resource.duration;

                    metrics.totalSize += size;
                    totalDuration += duration;

                    if (name.endsWith('.js')) metrics.js++;
                    else if (name.endsWith('.css')) metrics.css++;
                    else if (name.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) metrics.images++;
                    else if (name.match(/\.(woff|woff2|ttf|otf)$/)) metrics.fonts++;
                    else metrics.other++;
                });

                metrics.avgDuration = Math.round(totalDuration / resources.length);
                metrics.totalSize = Math.round(metrics.totalSize / 1024); // KB

                return metrics;
            } catch (err) {
                return null;
            }
        },

        /**
         * Get memory info
         */
        getMemoryInfo() {
            try {
                if (performance.memory) {
                    return {
                        used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
                        total: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
                        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) // MB
                    };
                }
                return null;
            } catch (err) {
                return null;
            }
        },

        /**
         * Get connection info
         */
        getConnectionInfo() {
            try {
                if (navigator.connection) {
                    const conn = navigator.connection;
                    return {
                        effectiveType: conn.effectiveType,
                        downlink: conn.downlink,
                        rtt: conn.rtt,
                        saveData: conn.saveData
                    };
                }
                return null;
            } catch (err) {
                return null;
            }
        },

        /**
         * Get bundle size from localStorage or estimate
         */
        getBundleSize() {
            try {
                const resources = performance.getEntriesByType('resource');
                const bundle = resources.find(r => r.name.includes('claudia.bundle.min.js'));
                if (bundle && bundle.transferSize) {
                    return Math.round(bundle.transferSize / 1024); // KB
                }
                return 242; // Fallback to known size
            } catch (err) {
                return null;
            }
        },

        /**
         * Monitor lazy module loads
         */
        monitorLazyLoads() {
            const originalLoad = window.ClaudiaLazyLoader?.loadScript;
            if (!originalLoad) return;

            window.ClaudiaLazyLoader.loadScript = async function(src) {
                const startTime = performance.now();

                try {
                    await originalLoad.call(this, src);
                    const endTime = performance.now();
                    const duration = Math.round(endTime - startTime);

                    console.log(`📦 Lazy module loaded: ${src} (${duration}ms)`);

                    // Track in metrics
                    if (!ClaudiaPerformance.metrics.lazyLoads) {
                        ClaudiaPerformance.metrics.lazyLoads = [];
                    }
                    ClaudiaPerformance.metrics.lazyLoads.push({
                        module: src,
                        duration,
                        timestamp: new Date().toISOString()
                    });
                } catch (err) {
                    throw err;
                }
            };
        },

        /**
         * Store metrics locally
         */
        storeMetrics() {
            try {
                const history = JSON.parse(localStorage.getItem('claudia_perf_history') || '[]');
                history.push(this.metrics);

                // Keep last 10 sessions
                if (history.length > 10) {
                    history.shift();
                }

                localStorage.setItem('claudia_perf_history', JSON.stringify(history));
            } catch (err) {
                console.error('Failed to store metrics:', err);
            }
        },

        /**
         * Report metrics summary
         */
        reportMetrics() {
            const summary = {
                loadComplete: this.metrics.loadComplete,
                ttfb: this.metrics.ttfb,
                fcp: this.metrics.fcp,
                bundleSize: this.metrics.bundleSize,
                resources: this.metrics.resources?.total,
                memory: this.metrics.memory?.used
            };

            console.log('📊 Performance Summary:', summary);
        },

        /**
         * Get performance grade
         */
        getGrade() {
            const load = this.metrics.loadComplete;
            if (load < 1000) return 'A+';
            if (load < 2000) return 'A';
            if (load < 3000) return 'B';
            if (load < 4000) return 'C';
            return 'D';
        },

        /**
         * Show performance badge (for debugging)
         */
        showBadge() {
            const badge = document.createElement('div');
            badge.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                font-size: 12px;
                font-weight: 700;
                z-index: 9999;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                cursor: pointer;
            `;

            const grade = this.getGrade();
            const load = this.metrics.loadComplete;

            badge.innerHTML = `
                📊 ${grade} | ${load}ms<br>
                <small style="font-size: 10px; opacity: 0.9;">Bundle: ${this.metrics.bundleSize}KB</small>
            `;

            badge.onclick = () => {
                console.log('📊 Full Performance Metrics:', this.metrics);
                alert(`Performance Grade: ${grade}\n\nLoad Time: ${load}ms\nBundle Size: ${this.metrics.bundleSize}KB\nResources: ${this.metrics.resources?.total || 0}\n\nCheck console for full metrics`);
            };

            document.body.appendChild(badge);

            // Auto-hide after 5 seconds
            setTimeout(() => {
                badge.style.opacity = '0.3';
            }, 5000);
        }
    };

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ClaudiaPerformance.init());
    } else {
        ClaudiaPerformance.init();
    }

})();

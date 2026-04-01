/**
 * CLAUDIA Performance Monitor v6.7.4
 * Real-time performance monitoring and reporting
 * Tracks Core Web Vitals and custom metrics
 */

(function() {
    'use strict';

    window.ClaudiaPerformanceMonitor = {
        metrics: {
            vitals: {},
            custom: {},
            resources: [],
            marks: new Map(),
            measures: []
        },

        config: {
            reportInterval: 60000, // 1 minute
            sampleRate: 1.0, // 100% of users
            enableReporting: true,
            budgets: {
                // Performance budgets
                fcp: 1800, // First Contentful Paint
                lcp: 2500, // Largest Contentful Paint
                fid: 100,  // First Input Delay
                cls: 0.1,  // Cumulative Layout Shift
                ttfb: 600, // Time to First Byte

                // Resource budgets
                jsSize: 400, // KB
                cssSize: 50, // KB
                imageSize: 500, // KB
                totalSize: 1000, // KB

                // Custom budgets
                apuSearch: 100, // ms
                budgetCalc: 50, // ms
                memoryUsage: 100 // MB
            }
        },

        /**
         * Initialize performance monitoring
         */
        init(options = {}) {
            // Merge config
            Object.assign(this.config, options);

            // Check sample rate
            if (Math.random() > this.config.sampleRate) {
                console.log('[PerfMonitor] Skipped (sampling)');
                return false;
            }

            // Initialize Core Web Vitals
            this.initCoreWebVitals();

            // Monitor resources
            this.monitorResources();

            // Set up reporting
            if (this.config.enableReporting) {
                this.startReporting();
            }

            // Listen for page unload to capture final metrics
            window.addEventListener('beforeunload', () => {
                this.captureSnapshot();
            });

            console.log('[PerfMonitor] Initialized');
            return true;
        },

        /**
         * Initialize Core Web Vitals tracking
         */
        initCoreWebVitals() {
            // LCP - Largest Contentful Paint
            this.observeLCP();

            // FID - First Input Delay
            this.observeFID();

            // CLS - Cumulative Layout Shift
            this.observeCLS();

            // FCP - First Contentful Paint
            this.observeFCP();

            // TTFB - Time to First Byte
            this.measureTTFB();
        },

        /**
         * Observe Largest Contentful Paint
         */
        observeLCP() {
            if (!('PerformanceObserver' in window)) return;

            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];

                    this.metrics.vitals.lcp = Math.round(lastEntry.renderTime || lastEntry.loadTime);
                    this.checkBudget('lcp', this.metrics.vitals.lcp);
                });

                observer.observe({ type: 'largest-contentful-paint', buffered: true });
            } catch (error) {
                console.error('[PerfMonitor] LCP observation failed:', error);
            }
        },

        /**
         * Observe First Input Delay
         */
        observeFID() {
            if (!('PerformanceObserver' in window)) return;

            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        this.metrics.vitals.fid = Math.round(entry.processingStart - entry.startTime);
                        this.checkBudget('fid', this.metrics.vitals.fid);
                    });
                });

                observer.observe({ type: 'first-input', buffered: true });
            } catch (error) {
                console.error('[PerfMonitor] FID observation failed:', error);
            }
        },

        /**
         * Observe Cumulative Layout Shift
         */
        observeCLS() {
            if (!('PerformanceObserver' in window)) return;

            let clsValue = 0;

            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                            this.metrics.vitals.cls = Math.round(clsValue * 1000) / 1000;
                            this.checkBudget('cls', this.metrics.vitals.cls);
                        }
                    });
                });

                observer.observe({ type: 'layout-shift', buffered: true });
            } catch (error) {
                console.error('[PerfMonitor] CLS observation failed:', error);
            }
        },

        /**
         * Observe First Contentful Paint
         */
        observeFCP() {
            if (!('PerformanceObserver' in window)) return;

            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (entry.name === 'first-contentful-paint') {
                            this.metrics.vitals.fcp = Math.round(entry.startTime);
                            this.checkBudget('fcp', this.metrics.vitals.fcp);
                        }
                    });
                });

                observer.observe({ type: 'paint', buffered: true });
            } catch (error) {
                console.error('[PerfMonitor] FCP observation failed:', error);
            }
        },

        /**
         * Measure Time to First Byte
         */
        measureTTFB() {
            if (!performance.timing) return;

            window.addEventListener('load', () => {
                const ttfb = performance.timing.responseStart - performance.timing.requestStart;
                this.metrics.vitals.ttfb = Math.round(ttfb);
                this.checkBudget('ttfb', this.metrics.vitals.ttfb);
            });
        },

        /**
         * Monitor resource loading
         */
        monitorResources() {
            if (!('PerformanceObserver' in window)) return;

            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        this.metrics.resources.push({
                            name: entry.name,
                            type: entry.initiatorType,
                            size: entry.transferSize || 0,
                            duration: Math.round(entry.duration),
                            startTime: Math.round(entry.startTime)
                        });
                    });

                    // Check resource budgets
                    this.checkResourceBudgets();
                });

                observer.observe({ type: 'resource', buffered: true });
            } catch (error) {
                console.error('[PerfMonitor] Resource observation failed:', error);
            }
        },

        /**
         * Mark performance event
         */
        mark(name) {
            if (!performance.mark) return;

            try {
                performance.mark(name);
                this.metrics.marks.set(name, performance.now());
            } catch (error) {
                console.error('[PerfMonitor] Mark failed:', error);
            }
        },

        /**
         * Measure between marks
         */
        measure(name, startMark, endMark) {
            if (!performance.measure) return;

            try {
                performance.measure(name, startMark, endMark);

                const measure = performance.getEntriesByName(name, 'measure')[0];
                if (measure) {
                    const duration = Math.round(measure.duration);

                    this.metrics.measures.push({
                        name,
                        duration,
                        startTime: Math.round(measure.startTime)
                    });

                    this.metrics.custom[name] = duration;

                    // Check custom budgets
                    if (this.config.budgets[name]) {
                        this.checkBudget(name, duration);
                    }

                    return duration;
                }
            } catch (error) {
                console.error('[PerfMonitor] Measure failed:', error);
            }

            return null;
        },

        /**
         * Track custom metric
         */
        trackMetric(name, value, unit = 'ms') {
            this.metrics.custom[name] = { value, unit, timestamp: Date.now() };

            // Check budget if exists
            if (this.config.budgets[name]) {
                this.checkBudget(name, value);
            }
        },

        /**
         * Check if metric exceeds budget
         */
        checkBudget(metricName, value) {
            const budget = this.config.budgets[metricName];

            if (budget && value > budget) {
                const excess = value - budget;
                const percentOver = Math.round((excess / budget) * 100);

                console.warn(`⚠️ [PerfMonitor] Budget exceeded: ${metricName}`, {
                    value,
                    budget,
                    excess,
                    percentOver: `${percentOver}%`
                });

                // Send budget violation report
                this.reportBudgetViolation(metricName, value, budget, percentOver);
            }
        },

        /**
         * Check resource budgets
         */
        checkResourceBudgets() {
            const sizes = {
                js: 0,
                css: 0,
                image: 0,
                total: 0
            };

            this.metrics.resources.forEach(resource => {
                const sizeKB = resource.size / 1024;
                sizes.total += sizeKB;

                if (resource.type === 'script' || resource.name.includes('.js')) {
                    sizes.js += sizeKB;
                } else if (resource.type === 'link' || resource.name.includes('.css')) {
                    sizes.css += sizeKB;
                } else if (resource.type === 'img' || /\.(jpg|jpeg|png|gif|webp|svg)/.test(resource.name)) {
                    sizes.image += sizeKB;
                }
            });

            // Check budgets
            if (sizes.js > this.config.budgets.jsSize) {
                console.warn(`⚠️ [PerfMonitor] JS budget exceeded: ${sizes.js.toFixed(1)} KB`);
            }
            if (sizes.css > this.config.budgets.cssSize) {
                console.warn(`⚠️ [PerfMonitor] CSS budget exceeded: ${sizes.css.toFixed(1)} KB`);
            }
            if (sizes.image > this.config.budgets.imageSize) {
                console.warn(`⚠️ [PerfMonitor] Image budget exceeded: ${sizes.image.toFixed(1)} KB`);
            }
            if (sizes.total > this.config.budgets.totalSize) {
                console.warn(`⚠️ [PerfMonitor] Total budget exceeded: ${sizes.total.toFixed(1)} KB`);
            }

            this.metrics.custom.resourceSizes = sizes;
        },

        /**
         * Report budget violation
         */
        reportBudgetViolation(metric, value, budget, percentOver) {
            if (window.ClaudiaBatchAnalytics) {
                ClaudiaBatchAnalytics.track('performance_budget_violation', {
                    metric,
                    value,
                    budget,
                    percentOver,
                    userAgent: navigator.userAgent,
                    url: window.location.href
                });
            }
        },

        /**
         * Capture performance snapshot
         */
        captureSnapshot() {
            const snapshot = {
                timestamp: Date.now(),
                url: window.location.href,
                vitals: { ...this.metrics.vitals },
                custom: { ...this.metrics.custom },
                navigation: this.getNavigationTiming(),
                memory: this.getMemoryInfo(),
                resources: this.getResourceSummary()
            };

            // Store in localStorage
            this.storeSnapshot(snapshot);

            return snapshot;
        },

        /**
         * Get navigation timing
         */
        getNavigationTiming() {
            if (!performance.timing) return null;

            const timing = performance.timing;
            const navigation = {};

            navigation.dns = timing.domainLookupEnd - timing.domainLookupStart;
            navigation.tcp = timing.connectEnd - timing.connectStart;
            navigation.request = timing.responseStart - timing.requestStart;
            navigation.response = timing.responseEnd - timing.responseStart;
            navigation.domLoading = timing.domContentLoadedEventEnd - timing.domLoading;
            navigation.domInteractive = timing.domInteractive - timing.domLoading;
            navigation.pageLoad = timing.loadEventEnd - timing.navigationStart;

            return navigation;
        },

        /**
         * Get memory info
         */
        getMemoryInfo() {
            if (!performance.memory) return null;

            const memory = {
                used: Math.round(performance.memory.usedJSHeapSize / 1048576),
                total: Math.round(performance.memory.totalJSHeapSize / 1048576),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
            };

            // Check memory budget
            if (memory.used > this.config.budgets.memoryUsage) {
                console.warn(`⚠️ [PerfMonitor] Memory budget exceeded: ${memory.used} MB`);
            }

            return memory;
        },

        /**
         * Get resource summary
         */
        getResourceSummary() {
            const summary = {
                count: this.metrics.resources.length,
                totalSize: 0,
                byType: {}
            };

            this.metrics.resources.forEach(resource => {
                summary.totalSize += resource.size;

                if (!summary.byType[resource.type]) {
                    summary.byType[resource.type] = { count: 0, size: 0 };
                }

                summary.byType[resource.type].count++;
                summary.byType[resource.type].size += resource.size;
            });

            summary.totalSize = Math.round(summary.totalSize / 1024); // Convert to KB

            return summary;
        },

        /**
         * Store snapshot in localStorage
         */
        storeSnapshot(snapshot) {
            try {
                const key = 'claudia_perf_snapshots';
                let snapshots = JSON.parse(localStorage.getItem(key) || '[]');

                snapshots.push(snapshot);

                // Keep only last 10 snapshots
                if (snapshots.length > 10) {
                    snapshots = snapshots.slice(-10);
                }

                localStorage.setItem(key, JSON.stringify(snapshots));
            } catch (error) {
                console.error('[PerfMonitor] Failed to store snapshot:', error);
            }
        },

        /**
         * Start periodic reporting
         */
        startReporting() {
            setInterval(() => {
                this.sendReport();
            }, this.config.reportInterval);

            console.log('[PerfMonitor] Reporting enabled');
        },

        /**
         * Send performance report
         */
        sendReport() {
            const snapshot = this.captureSnapshot();

            if (window.ClaudiaBatchAnalytics) {
                ClaudiaBatchAnalytics.track('performance_snapshot', snapshot);
            }

            console.log('[PerfMonitor] Report sent', snapshot);
        },

        /**
         * Get all metrics
         */
        getMetrics() {
            return {
                vitals: this.metrics.vitals,
                custom: this.metrics.custom,
                navigation: this.getNavigationTiming(),
                memory: this.getMemoryInfo(),
                resources: this.getResourceSummary()
            };
        },

        /**
         * Generate performance report
         */
        generateReport() {
            const metrics = this.getMetrics();
            const budgetViolations = this.getBudgetViolations();

            const report = {
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userAgent: navigator.userAgent,
                metrics,
                budgetViolations,
                grade: this.calculateGrade(metrics, budgetViolations)
            };

            return report;
        },

        /**
         * Get budget violations
         */
        getBudgetViolations() {
            const violations = [];

            // Check vital budgets
            Object.keys(this.metrics.vitals).forEach(key => {
                const value = this.metrics.vitals[key];
                const budget = this.config.budgets[key];

                if (budget && value > budget) {
                    violations.push({
                        metric: key,
                        value,
                        budget,
                        excess: value - budget,
                        percentOver: Math.round(((value - budget) / budget) * 100)
                    });
                }
            });

            return violations;
        },

        /**
         * Calculate performance grade
         */
        calculateGrade(metrics, violations) {
            let score = 100;

            // Deduct points for violations
            violations.forEach(v => {
                score -= Math.min(v.percentOver / 2, 20); // Max 20 points per violation
            });

            // Grade thresholds
            if (score >= 90) return 'A';
            if (score >= 80) return 'B';
            if (score >= 70) return 'C';
            if (score >= 60) return 'D';
            return 'F';
        },

        /**
         * Log performance report to console
         */
        logReport() {
            const report = this.generateReport();

            console.group('📊 Performance Report');
            console.log('Grade:', report.grade);
            console.log('Vitals:', report.metrics.vitals);
            console.log('Memory:', report.metrics.memory);
            console.log('Resources:', report.metrics.resources);

            if (report.budgetViolations.length > 0) {
                console.warn('Budget Violations:', report.budgetViolations);
            } else {
                console.log('✅ All budgets met!');
            }

            console.groupEnd();

            return report;
        }
    };

    // Export globally
    window.PerfMonitor = window.ClaudiaPerformanceMonitor;

    console.log('[PerfMonitor] v6.7.4 loaded');

})();

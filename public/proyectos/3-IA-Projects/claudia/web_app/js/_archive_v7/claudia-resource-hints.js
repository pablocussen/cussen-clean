/**
 * CLAUDIA Resource Hints Manager v6.8.0
 *
 * Intelligent resource hint management:
 * - DNS prefetch for external domains
 * - Preconnect for critical origins
 * - Prefetch for likely navigation
 * - Preload for critical resources
 * - Prerender for next pages
 * - Priority hints support
 *
 * @module ClaudiaResourceHints
 * @version 6.8.0
 */

window.ClaudiaResourceHints = {
    version: '6.8.0',
    initialized: false,

    // Configuration
    config: {
        enableDnsPrefetch: true,
        enablePreconnect: true,
        enablePrefetch: true,
        enablePreload: true,
        enablePrerender: false,      // Disabled by default (expensive)
        maxPrefetchItems: 5,
        maxPreconnectOrigins: 3,
        respectSaveData: true
    },

    // State
    appliedHints: new Set(),
    origins: new Set(),
    prefetchQueue: [],
    stats: {
        dnsPrefetch: 0,
        preconnect: 0,
        prefetch: 0,
        preload: 0,
        prerender: 0
    },

    /**
     * Initialize resource hints manager
     */
    init() {
        if (this.initialized) {
            console.log('ClaudiaResourceHints: Already initialized');
            return;
        }

        console.log('ClaudiaResourceHints: Initializing v6.8.0...');

        // Check if we should respect data saver mode
        if (this.config.respectSaveData && this.isDataSaverMode()) {
            console.log('ClaudiaResourceHints: Data saver mode detected, limiting hints');
            this.config.enablePrefetch = false;
            this.config.enablePrerender = false;
        }

        // Apply critical hints
        this.applyDnsPrefetch();
        this.applyPreconnect();
        this.applyPreload();

        // Setup prefetch on navigation hints
        this.setupNavigationHints();

        // Monitor user interactions for predictive prefetching
        this.setupPredictivePrefetch();

        this.initialized = true;
        console.log('ClaudiaResourceHints: Initialized successfully');
        this.logStats();
    },

    /**
     * Check if data saver mode is enabled
     */
    isDataSaverMode() {
        return navigator.connection?.saveData || false;
    },

    /**
     * Apply DNS prefetch hints
     */
    applyDnsPrefetch() {
        if (!this.config.enableDnsPrefetch) return;

        // Common external domains to prefetch
        const domains = [
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com',
            'https://www.google-analytics.com',
            'https://www.googletagmanager.com',
            'https://cdn.jsdelivr.net',
            'https://unpkg.com',
            'https://cdnjs.cloudflare.com'
        ];

        // Add custom domains from data attributes
        const customDomains = document.querySelectorAll('[data-dns-prefetch]');
        customDomains.forEach(el => {
            const domain = el.dataset.dnsPrefetch;
            if (domain && !domains.includes(domain)) {
                domains.push(domain);
            }
        });

        domains.forEach(domain => {
            this.addDnsPrefetch(domain);
        });

        console.log(`ClaudiaResourceHints: Applied ${this.stats.dnsPrefetch} DNS prefetch hints`);
    },

    /**
     * Add DNS prefetch hint
     */
    addDnsPrefetch(url) {
        const origin = new URL(url).origin;

        if (this.appliedHints.has(`dns-prefetch:${origin}`)) return;

        const link = document.createElement('link');
        link.rel = 'dns-prefetch';
        link.href = origin;

        document.head.appendChild(link);

        this.appliedHints.add(`dns-prefetch:${origin}`);
        this.origins.add(origin);
        this.stats.dnsPrefetch++;
    },

    /**
     * Apply preconnect hints for critical origins
     */
    applyPreconnect() {
        if (!this.config.enablePreconnect) return;

        // Critical origins that require full connection
        const criticalOrigins = [
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com'
        ];

        // Add custom preconnect from data attributes
        const customOrigins = document.querySelectorAll('[data-preconnect]');
        customOrigins.forEach(el => {
            const origin = el.dataset.preconnect;
            if (origin && !criticalOrigins.includes(origin)) {
                criticalOrigins.push(origin);
            }
        });

        // Limit to max preconnect origins
        const limited = criticalOrigins.slice(0, this.config.maxPreconnectOrigins);

        limited.forEach(origin => {
            this.addPreconnect(origin);
        });

        console.log(`ClaudiaResourceHints: Applied ${this.stats.preconnect} preconnect hints`);
    },

    /**
     * Add preconnect hint
     */
    addPreconnect(url, crossorigin = false) {
        const origin = new URL(url).origin;

        if (this.appliedHints.has(`preconnect:${origin}`)) return;

        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = origin;

        if (crossorigin) {
            link.crossOrigin = 'anonymous';
        }

        document.head.appendChild(link);

        this.appliedHints.add(`preconnect:${origin}`);
        this.stats.preconnect++;
    },

    /**
     * Apply preload hints for critical resources
     */
    applyPreload() {
        if (!this.config.enablePreload) return;

        // Preload critical resources marked in HTML
        const preloadElements = document.querySelectorAll('[data-preload]');

        preloadElements.forEach(el => {
            const url = el.dataset.preload;
            const asType = el.dataset.preloadAs || this.guessResourceType(url);
            const type = el.dataset.preloadType;

            this.addPreload(url, asType, type);
        });

        console.log(`ClaudiaResourceHints: Applied ${this.stats.preload} preload hints`);
    },

    /**
     * Add preload hint
     */
    addPreload(url, asType, type = null) {
        const key = `preload:${url}`;

        if (this.appliedHints.has(key)) return;

        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = url;
        link.as = asType;

        if (type) {
            link.type = type;
        }

        // Add fetchpriority if available
        if ('fetchPriority' in HTMLLinkElement.prototype) {
            link.fetchPriority = 'high';
        }

        document.head.appendChild(link);

        this.appliedHints.add(key);
        this.stats.preload++;
    },

    /**
     * Guess resource type from URL
     */
    guessResourceType(url) {
        const ext = url.split('.').pop().split('?')[0].toLowerCase();

        const typeMap = {
            'js': 'script',
            'mjs': 'script',
            'css': 'style',
            'woff': 'font',
            'woff2': 'font',
            'ttf': 'font',
            'otf': 'font',
            'jpg': 'image',
            'jpeg': 'image',
            'png': 'image',
            'webp': 'image',
            'avif': 'image',
            'svg': 'image',
            'gif': 'image',
            'mp4': 'video',
            'webm': 'video',
            'mp3': 'audio',
            'wav': 'audio',
            'json': 'fetch'
        };

        return typeMap[ext] || 'fetch';
    },

    /**
     * Setup navigation hints for prefetching
     */
    setupNavigationHints() {
        if (!this.config.enablePrefetch) return;

        // Prefetch links marked with data-prefetch
        const prefetchLinks = document.querySelectorAll('a[data-prefetch]');

        prefetchLinks.forEach(link => {
            const url = link.href;
            if (url && !this.appliedHints.has(`prefetch:${url}`)) {
                this.prefetchQueue.push(url);
            }
        });

        // Process prefetch queue
        this.processPrefetchQueue();
    },

    /**
     * Process prefetch queue
     */
    processPrefetchQueue() {
        const limit = Math.min(
            this.prefetchQueue.length,
            this.config.maxPrefetchItems
        );

        for (let i = 0; i < limit; i++) {
            const url = this.prefetchQueue[i];
            this.addPrefetch(url);
        }
    },

    /**
     * Add prefetch hint
     */
    addPrefetch(url) {
        const key = `prefetch:${url}`;

        if (this.appliedHints.has(key)) return;

        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;

        // Add fetchpriority if available
        if ('fetchPriority' in HTMLLinkElement.prototype) {
            link.fetchPriority = 'low';
        }

        document.head.appendChild(link);

        this.appliedHints.add(key);
        this.stats.prefetch++;
    },

    /**
     * Setup predictive prefetching based on user behavior
     */
    setupPredictivePrefetch() {
        if (!this.config.enablePrefetch) return;

        let hoverTimer = null;

        // Prefetch on hover (desktop)
        document.addEventListener('mouseover', (e) => {
            const link = e.target.closest('a[href]');

            if (!link || this.appliedHints.has(`prefetch:${link.href}`)) return;

            // Prefetch after 100ms hover
            hoverTimer = setTimeout(() => {
                this.addPrefetch(link.href);
                console.log(`ClaudiaResourceHints: Predictive prefetch on hover - ${link.href}`);
            }, 100);
        });

        document.addEventListener('mouseout', (e) => {
            if (hoverTimer) {
                clearTimeout(hoverTimer);
                hoverTimer = null;
            }
        });

        // Prefetch on touchstart (mobile)
        document.addEventListener('touchstart', (e) => {
            const link = e.target.closest('a[href]');

            if (!link || this.appliedHints.has(`prefetch:${link.href}`)) return;

            this.addPrefetch(link.href);
            console.log(`ClaudiaResourceHints: Predictive prefetch on touch - ${link.href}`);
        }, { passive: true });

        // Prefetch visible links on idle
        if (window.ClaudiaIdleTasks) {
            window.ClaudiaIdleTasks.schedule('prefetch-visible-links', () => {
                this.prefetchVisibleLinks();
            }, 'low');
        }
    },

    /**
     * Prefetch visible links in viewport
     */
    prefetchVisibleLinks() {
        const links = document.querySelectorAll('a[href]');
        let prefetched = 0;

        links.forEach(link => {
            if (prefetched >= this.config.maxPrefetchItems) return;

            if (this.isInViewport(link) && !this.appliedHints.has(`prefetch:${link.href}`)) {
                this.addPrefetch(link.href);
                prefetched++;
            }
        });

        console.log(`ClaudiaResourceHints: Prefetched ${prefetched} visible links`);
    },

    /**
     * Check if element is in viewport
     */
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    /**
     * Add prerender hint (use with caution)
     */
    addPrerender(url) {
        if (!this.config.enablePrerender) {
            console.warn('ClaudiaResourceHints: Prerender is disabled');
            return;
        }

        const key = `prerender:${url}`;

        if (this.appliedHints.has(key)) return;

        const link = document.createElement('link');
        link.rel = 'prerender';
        link.href = url;

        document.head.appendChild(link);

        this.appliedHints.add(key);
        this.stats.prerender++;

        console.log(`ClaudiaResourceHints: Prerendering ${url}`);
    },

    /**
     * Remove a resource hint
     */
    removeHint(url, rel = 'prefetch') {
        const key = `${rel}:${url}`;

        if (!this.appliedHints.has(key)) return;

        const links = document.querySelectorAll(`link[rel="${rel}"][href="${url}"]`);
        links.forEach(link => link.remove());

        this.appliedHints.delete(key);
        this.stats[rel.replace('-', '')]--;
    },

    /**
     * Clear all prefetch hints
     */
    clearPrefetch() {
        const links = document.querySelectorAll('link[rel="prefetch"]');
        links.forEach(link => link.remove());

        // Clean up applied hints
        this.appliedHints.forEach(key => {
            if (key.startsWith('prefetch:')) {
                this.appliedHints.delete(key);
            }
        });

        this.stats.prefetch = 0;
        console.log('ClaudiaResourceHints: Cleared all prefetch hints');
    },

    /**
     * Get statistics
     */
    getStats() {
        return {
            ...this.stats,
            totalHints: this.appliedHints.size,
            origins: this.origins.size,
            queuedPrefetch: this.prefetchQueue.length
        };
    },

    /**
     * Log statistics
     */
    logStats() {
        console.log('ClaudiaResourceHints: Statistics', this.getStats());
    },

    /**
     * Check if browser supports resource hints
     */
    supportsHint(rel) {
        const link = document.createElement('link');
        return link.relList && link.relList.supports(rel);
    },

    /**
     * Get supported hints
     */
    getSupportedHints() {
        return {
            dnsPrefetch: this.supportsHint('dns-prefetch'),
            preconnect: this.supportsHint('preconnect'),
            prefetch: this.supportsHint('prefetch'),
            preload: this.supportsHint('preload'),
            prerender: this.supportsHint('prerender')
        };
    }
};

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.ClaudiaResourceHints.init();
    });
} else {
    window.ClaudiaResourceHints.init();
}

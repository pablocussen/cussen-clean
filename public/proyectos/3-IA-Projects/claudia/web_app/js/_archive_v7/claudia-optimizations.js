/**
 * CLAUDIA OPTIMIZATIONS v5.1
 * Performance utilities and optimizations
 */

'use strict';

// ============================================
// DEBOUNCE & THROTTLE UTILITIES
// ============================================

/**
 * Debounce function - delays execution until after wait time
 * Perfect for search, resize, scroll events
 */
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function - ensures function runs at most once per interval
 * Perfect for scroll, mouse move events
 */
function throttle(func, limit = 100) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ============================================
// DOM CACHE SYSTEM
// ============================================

const DOMCache = {
    cache: new Map(),

    get(selector) {
        if (!this.cache.has(selector)) {
            const element = document.getElementById(selector) || document.querySelector(selector);
            if (element) {
                this.cache.set(selector, element);
            }
        }
        return this.cache.get(selector);
    },

    clear() {
        this.cache.clear();
    },

    remove(selector) {
        this.cache.delete(selector);
    }
};

// Expose globally
window.DOMCache = DOMCache;

// ============================================
// LOCALSTORAGE OPTIMIZATION
// ============================================

const StorageManager = {
    // Compression cache to reduce localStorage reads
    readCache: new Map(),

    get(key, defaultValue = null) {
        // Check memory cache first
        if (this.readCache.has(key)) {
            return this.readCache.get(key);
        }

        // Read from localStorage
        const data = localStorage.getItem(key);
        if (!data) return defaultValue;

        try {
            const parsed = JSON.parse(data);
            // Cache in memory for 30 seconds
            this.readCache.set(key, parsed);
            setTimeout(() => this.readCache.delete(key), 30000);
            return parsed;
        } catch (e) {
            console.error('Error parsing localStorage data:', e);
            return defaultValue;
        }
    },

    set(key, value) {
        try {
            const stringified = JSON.stringify(value);
            localStorage.setItem(key, stringified);
            // Update memory cache
            this.readCache.set(key, value);
            return true;
        } catch (e) {
            console.error('Error saving to localStorage:', e);
            return false;
        }
    },

    remove(key) {
        localStorage.removeItem(key);
        this.readCache.delete(key);
    },

    clearCache() {
        this.readCache.clear();
    }
};

window.StorageManager = StorageManager;

// ============================================
// CHART.JS LAZY LOADER
// ============================================

const ChartLoader = {
    loaded: false,
    loading: false,
    callbacks: [],

    load(callback) {
        // Si ya está cargado, ejecutar callback inmediatamente
        if (this.loaded) {
            callback();
            return;
        }

        // Agregar a cola de callbacks
        this.callbacks.push(callback);

        // Si ya está cargando, no cargar de nuevo
        if (this.loading) {
            return;
        }

        this.loading = true;

        // Verificar si Chart.js ya está cargado
        if (window.Chart) {
            this.loaded = true;
            this.loading = false;
            this.callbacks.forEach(cb => cb());
            this.callbacks = [];
            return;
        }

        // Chart.js ya está en el HTML, solo verificar que esté listo
        const checkInterval = setInterval(() => {
            if (window.Chart) {
                clearInterval(checkInterval);
                this.loaded = true;
                this.loading = false;
                this.callbacks.forEach(cb => cb());
                this.callbacks = [];
            }
        }, 100);
    }
};

window.ChartLoader = ChartLoader;

// ============================================
// RENDER OPTIMIZATION
// ============================================

const RenderOptimizer = {
    // Virtual DOM-like diffing for large lists
    shouldUpdate(oldData, newData) {
        return JSON.stringify(oldData) !== JSON.stringify(newData);
    },

    // Batch DOM updates
    batchUpdate(updates) {
        const fragment = document.createDocumentFragment();
        updates.forEach(update => {
            if (update.element && update.html) {
                const temp = document.createElement('div');
                temp.innerHTML = update.html;
                while (temp.firstChild) {
                    fragment.appendChild(temp.firstChild);
                }
            }
        });
        return fragment;
    },

    // RequestAnimationFrame wrapper for smooth updates
    smoothUpdate(callback) {
        requestAnimationFrame(() => {
            callback();
        });
    }
};

window.RenderOptimizer = RenderOptimizer;

// ============================================
// PERFORMANCE MONITORING
// ============================================

const PerformanceMonitor = {
    timers: new Map(),

    start(label) {
        this.timers.set(label, performance.now());
    },

    end(label) {
        if (!this.timers.has(label)) {
            console.warn(`No timer found for: ${label}`);
            return;
        }

        const start = this.timers.get(label);
        const duration = performance.now() - start;
        this.timers.delete(label);

        console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
        return duration;
    },

    measure(label, callback) {
        this.start(label);
        const result = callback();
        this.end(label);
        return result;
    }
};

window.PerformanceMonitor = PerformanceMonitor;

// ============================================
// IMAGE LAZY LOADING
// ============================================

const ImageLazyLoader = {
    observer: null,

    init() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            this.observer.unobserve(img);
                        }
                    }
                });
            });
        }
    },

    observe(img) {
        if (this.observer) {
            this.observer.observe(img);
        } else {
            // Fallback para navegadores sin IntersectionObserver
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            }
        }
    }
};

// Init on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        ImageLazyLoader.init();
    });
} else {
    ImageLazyLoader.init();
}

window.ImageLazyLoader = ImageLazyLoader;

// ============================================
// MEMORY LEAK PREVENTION
// ============================================

const MemoryManager = {
    // Clean up event listeners
    eventListeners: new Map(),

    addEventListener(element, event, handler) {
        const key = `${element.id || 'el'}_${event}`;

        // Remove previous listener if exists
        if (this.eventListeners.has(key)) {
            const oldHandler = this.eventListeners.get(key);
            element.removeEventListener(event, oldHandler);
        }

        // Add new listener
        element.addEventListener(event, handler);
        this.eventListeners.set(key, handler);
    },

    removeEventListener(element, event) {
        const key = `${element.id || 'el'}_${event}`;
        if (this.eventListeners.has(key)) {
            const handler = this.eventListeners.get(key);
            element.removeEventListener(event, handler);
            this.eventListeners.delete(key);
        }
    },

    cleanup() {
        this.eventListeners.forEach((handler, key) => {
            console.log(`Cleaning up: ${key}`);
        });
        this.eventListeners.clear();
    }
};

window.MemoryManager = MemoryManager;

// ============================================
// ARRAY UTILITIES FOR PERFORMANCE
// ============================================

const ArrayUtils = {
    // Faster array search using Map
    createLookupMap(array, key) {
        const map = new Map();
        array.forEach(item => {
            map.set(item[key], item);
        });
        return map;
    },

    // Chunk array for batch processing
    chunk(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    },

    // Remove duplicates efficiently
    unique(array, key = null) {
        if (!key) {
            return [...new Set(array)];
        }
        const seen = new Set();
        return array.filter(item => {
            const value = item[key];
            if (seen.has(value)) {
                return false;
            }
            seen.add(value);
            return true;
        });
    }
};

window.ArrayUtils = ArrayUtils;

// ============================================
// SERVICE WORKER REGISTRATION (PWA)
// ============================================

const PWAManager = {
    async register() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('✅ Service Worker registered:', registration.scope);
                return registration;
            } catch (error) {
                console.log('❌ Service Worker registration failed:', error);
                return null;
            }
        }
    },

    async checkForUpdates() {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                registration.update();
            }
        }
    }
};

window.PWAManager = PWAManager;

// ============================================
// CONSOLE LOGGER OPTIMIZATION
// ============================================

const Logger = {
    enabled: true,
    levels: {
        debug: 0,
        info: 1,
        warn: 2,
        error: 3
    },
    currentLevel: 1, // info by default

    log(level, ...args) {
        if (!this.enabled) return;
        if (this.levels[level] < this.currentLevel) return;

        const emoji = {
            debug: '🔍',
            info: 'ℹ️',
            warn: '⚠️',
            error: '❌'
        };

        console[level](emoji[level], ...args);
    },

    debug(...args) { this.log('debug', ...args); },
    info(...args) { this.log('info', ...args); },
    warn(...args) { this.log('warn', ...args); },
    error(...args) { this.log('error', ...args); }
};

window.Logger = Logger;

// ============================================
// INITIALIZATION
// ============================================

console.log('✅ CLAUDIA Optimizations v5.1 loaded');
console.log('📦 Available utilities:', Object.keys(window).filter(k =>
    ['DOMCache', 'StorageManager', 'ChartLoader', 'RenderOptimizer',
     'PerformanceMonitor', 'ImageLazyLoader', 'MemoryManager',
     'ArrayUtils', 'PWAManager', 'Logger', 'debounce', 'throttle'].includes(k)
));

// Expose debounce and throttle globally
window.debounce = debounce;
window.throttle = throttle;

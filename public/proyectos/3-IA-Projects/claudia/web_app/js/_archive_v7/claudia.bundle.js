
// === claudia-utils.js ===
/**
 * CLAUDIA Utils v6.7.1
 * Shared utility functions to reduce code duplication
 * All modules can access these via window.ClaudiaUtils
 */

(function() {
    'use strict';

    window.ClaudiaUtils = {

        /**
         * Format number as Chilean currency
         * @param {number} num - Amount to format
         * @returns {string} Formatted currency string
         */
        formatMoney(num) {
            if (num === undefined || num === null) return '$0';
            return '$' + Math.round(num).toLocaleString('es-CL');
        },

        /**
         * Format date in Chilean format
         * @param {Date|string} date - Date to format
         * @returns {string} Formatted date (DD/MM/YYYY)
         */
        formatDate(date) {
            if (!date) return '';
            const d = new Date(date);
            if (isNaN(d.getTime())) return '';

            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();

            return `${day}/${month}/${year}`;
        },

        /**
         * Format datetime in Chilean format
         * @param {Date|string} date - Date to format
         * @returns {string} Formatted datetime (DD/MM/YYYY HH:MM)
         */
        formatDateTime(date) {
            if (!date) return '';
            const d = new Date(date);
            if (isNaN(d.getTime())) return '';

            const dateStr = this.formatDate(d);
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');

            return `${dateStr} ${hours}:${minutes}`;
        },

        /**
         * Copy text to clipboard
         * @param {string} text - Text to copy
         * @returns {Promise<boolean>} Success status
         */
        async copyToClipboard(text) {
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(text);
                    return true;
                } else {
                    // Fallback for older browsers
                    const textarea = document.createElement('textarea');
                    textarea.value = text;
                    textarea.style.position = 'fixed';
                    textarea.style.opacity = '0';
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                    return true;
                }
            } catch (err) {
                console.error('Copy to clipboard failed:', err);
                return false;
            }
        },

        /**
         * Create a modal dialog
         * @param {Object} options - Modal configuration
         * @param {string} options.title - Modal title
         * @param {string} options.content - Modal content (HTML)
         * @param {Array} options.buttons - Button configurations
         * @param {Function} options.onClose - Callback when modal closes
         * @returns {HTMLElement} Modal element
         */
        createModal({ title, content, buttons = [], onClose }) {
            // Remove existing modal if any
            const existing = document.getElementById('claudia-modal');
            if (existing) existing.remove();

            const modal = document.createElement('div');
            modal.id = 'claudia-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.2s ease-out;
            `;

            const dialog = document.createElement('div');
            dialog.style.cssText = `
                background: white;
                border-radius: 12px;
                max-width: 90%;
                max-height: 90%;
                overflow: auto;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                animation: slideUp 0.3s ease-out;
            `;

            // Header
            const header = document.createElement('div');
            header.style.cssText = `
                padding: 20px;
                border-bottom: 1px solid #e5e7eb;
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;

            const titleEl = document.createElement('h3');
            titleEl.textContent = title;
            titleEl.style.cssText = 'margin: 0; font-size: 20px; font-weight: 700;';

            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '✕';
            closeBtn.style.cssText = `
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s;
            `;
            closeBtn.onmouseover = () => closeBtn.style.background = '#f3f4f6';
            closeBtn.onmouseout = () => closeBtn.style.background = 'none';
            closeBtn.onclick = () => {
                modal.remove();
                if (onClose) onClose();
            };

            header.appendChild(titleEl);
            header.appendChild(closeBtn);

            // Content
            const contentEl = document.createElement('div');
            contentEl.style.cssText = 'padding: 20px;';
            contentEl.innerHTML = content;

            // Footer with buttons
            if (buttons.length > 0) {
                const footer = document.createElement('div');
                footer.style.cssText = `
                    padding: 20px;
                    border-top: 1px solid #e5e7eb;
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                `;

                buttons.forEach(btn => {
                    const button = document.createElement('button');
                    button.textContent = btn.text;
                    button.style.cssText = `
                        padding: 10px 20px;
                        border: none;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: transform 0.2s, box-shadow 0.2s;
                        ${btn.primary ?
                            'background: linear-gradient(135deg, #3b82f6, #2563eb); color: white;' :
                            'background: #f3f4f6; color: #374151;'
                        }
                    `;
                    button.onmouseover = () => {
                        button.style.transform = 'translateY(-2px)';
                        button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    };
                    button.onmouseout = () => {
                        button.style.transform = 'translateY(0)';
                        button.style.boxShadow = 'none';
                    };
                    button.onclick = () => {
                        if (btn.onClick) btn.onClick();
                        if (btn.closeOnClick !== false) modal.remove();
                    };

                    footer.appendChild(button);
                });

                dialog.appendChild(header);
                dialog.appendChild(contentEl);
                dialog.appendChild(footer);
            } else {
                dialog.appendChild(header);
                dialog.appendChild(contentEl);
            }

            modal.appendChild(dialog);

            // Close on backdrop click
            modal.onclick = (e) => {
                if (e.target === modal) {
                    modal.remove();
                    if (onClose) onClose();
                }
            };

            // Add animations
            const style = document.createElement('style');
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);

            document.body.appendChild(modal);
            return modal;
        },

        /**
         * Show a toast notification
         * @param {string} message - Message to display
         * @param {string} type - Type: 'success', 'error', 'warning', 'info'
         * @param {number} duration - Duration in ms (default 3000)
         */
        showNotification(message, type = 'info', duration = 3000) {
            const toast = document.createElement('div');

            const colors = {
                success: { bg: '#10b981', icon: '✓' },
                error: { bg: '#ef4444', icon: '✕' },
                warning: { bg: '#f59e0b', icon: '⚠' },
                info: { bg: '#3b82f6', icon: 'ℹ' }
            };

            const config = colors[type] || colors.info;

            toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${config.bg};
                color: white;
                padding: 16px 24px;
                border-radius: 8px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                z-index: 10001;
                display: flex;
                align-items: center;
                gap: 12px;
                font-weight: 600;
                animation: slideInRight 0.3s ease-out;
                max-width: 400px;
            `;

            toast.innerHTML = `
                <span style="font-size: 20px;">${config.icon}</span>
                <span>${message}</span>
            `;

            // Add animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(400px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(400px); opacity: 0; }
                }
            `;
            document.head.appendChild(style);

            document.body.appendChild(toast);

            // Auto remove
            setTimeout(() => {
                toast.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => toast.remove(), 300);
            }, duration);

            return toast;
        },

        /**
         * Debounce function execution
         * @param {Function} func - Function to debounce
         * @param {number} wait - Wait time in ms
         * @returns {Function} Debounced function
         */
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        /**
         * Generate unique ID
         * @returns {string} Unique ID
         */
        generateId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        },

        /**
         * Check if element is visible in viewport
         * @param {HTMLElement} element - Element to check
         * @returns {boolean} Visibility status
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
         * Smooth scroll to element
         * @param {HTMLElement|string} target - Element or selector
         * @param {number} offset - Offset from top (default 0)
         */
        scrollTo(target, offset = 0) {
            const element = typeof target === 'string'
                ? document.querySelector(target)
                : target;

            if (!element) return;

            const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        },

        /**
         * Format file size
         * @param {number} bytes - Size in bytes
         * @returns {string} Formatted size
         */
        formatFileSize(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
        }
    };

    console.log('✅ ClaudiaUtils v6.7.1 loaded');

})();


// === claudia-lazy-loader.js ===
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


// === claudia-indexeddb.js ===
/**
 * CLAUDIA IndexedDB Manager v6.7.1
 * Advanced caching system for APUs and project data
 * Enables faster loading and full offline support
 */

(function() {
    'use strict';

    window.ClaudiaDB = {

        db: null,
        dbName: 'ClaudiaDB',
        version: 2,

        stores: {
            apus: 'apus',
            projects: 'projects',
            prices: 'prices',
            cache: 'cache',
            analytics: 'analytics'
        },

        /**
         * Initialize IndexedDB
         */
        async init() {
            try {
                this.db = await this.openDB();
                console.log('💾 IndexedDB v6.7.1 initialized');

                // Migrate localStorage data to IndexedDB
                await this.migrateFromLocalStorage();

                // Setup periodic cleanup
                this.setupCleanup();

                return true;
            } catch (err) {
                console.error('❌ IndexedDB init failed:', err);
                return false;
            }
        },

        /**
         * Open IndexedDB connection
         */
        openDB() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, this.version);

                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(request.result);

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;

                    // Create stores if they don't exist
                    if (!db.objectStoreNames.contains(this.stores.apus)) {
                        const apuStore = db.createObjectStore(this.stores.apus, { keyPath: 'id' });
                        apuStore.createIndex('categoria', 'categoria', { unique: false });
                        apuStore.createIndex('nombre', 'nombre', { unique: false });
                    }

                    if (!db.objectStoreNames.contains(this.stores.projects)) {
                        db.createObjectStore(this.stores.projects, { keyPath: 'id' });
                    }

                    if (!db.objectStoreNames.contains(this.stores.prices)) {
                        const priceStore = db.createObjectStore(this.stores.prices, { keyPath: 'id' });
                        priceStore.createIndex('timestamp', 'timestamp', { unique: false });
                    }

                    if (!db.objectStoreNames.contains(this.stores.cache)) {
                        const cacheStore = db.createObjectStore(this.stores.cache, { keyPath: 'key' });
                        cacheStore.createIndex('expires', 'expires', { unique: false });
                    }

                    if (!db.objectStoreNames.contains(this.stores.analytics)) {
                        const analyticsStore = db.createObjectStore(this.stores.analytics, { keyPath: 'id', autoIncrement: true });
                        analyticsStore.createIndex('event', 'event', { unique: false });
                        analyticsStore.createIndex('timestamp', 'timestamp', { unique: false });
                    }
                };
            });
        },

        /**
         * Get all APUs from IndexedDB
         */
        async getAllAPUs() {
            try {
                const transaction = this.db.transaction([this.stores.apus], 'readonly');
                const store = transaction.objectStore(this.stores.apus);
                const request = store.getAll();

                return new Promise((resolve, reject) => {
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });
            } catch (err) {
                console.error('Failed to get APUs:', err);
                return [];
            }
        },

        /**
         * Cache APU database
         */
        async cacheAPUs(apus) {
            try {
                const transaction = this.db.transaction([this.stores.apus], 'readwrite');
                const store = transaction.objectStore(this.stores.apus);

                // Clear existing
                await new Promise((resolve, reject) => {
                    const clearRequest = store.clear();
                    clearRequest.onsuccess = () => resolve();
                    clearRequest.onerror = () => reject(clearRequest.error);
                });

                // Add all APUs
                const promises = apus.map(apu => {
                    return new Promise((resolve, reject) => {
                        const request = store.add({
                            id: apu.id || `apu_${Date.now()}_${Math.random()}`,
                            ...apu,
                            cachedAt: Date.now()
                        });
                        request.onsuccess = () => resolve();
                        request.onerror = () => reject(request.error);
                    });
                });

                await Promise.all(promises);
                console.log(`✅ Cached ${apus.length} APUs in IndexedDB`);
                return true;
            } catch (err) {
                console.error('Failed to cache APUs:', err);
                return false;
            }
        },

        /**
         * Search APUs by keyword
         */
        async searchAPUs(keyword) {
            try {
                const allAPUs = await this.getAllAPUs();
                const searchTerm = keyword.toLowerCase();

                return allAPUs.filter(apu => {
                    return apu.nombre?.toLowerCase().includes(searchTerm) ||
                           apu.categoria?.toLowerCase().includes(searchTerm) ||
                           apu.descripcion?.toLowerCase().includes(searchTerm);
                });
            } catch (err) {
                console.error('Search failed:', err);
                return [];
            }
        },

        /**
         * Save project to IndexedDB
         */
        async saveProject(project) {
            try {
                const transaction = this.db.transaction([this.stores.projects], 'readwrite');
                const store = transaction.objectStore(this.stores.projects);

                const projectData = {
                    ...project,
                    updatedAt: new Date().toISOString(),
                    syncedToCloud: false
                };

                return new Promise((resolve, reject) => {
                    const request = store.put(projectData);
                    request.onsuccess = () => resolve(true);
                    request.onerror = () => reject(request.error);
                });
            } catch (err) {
                console.error('Failed to save project:', err);
                return false;
            }
        },

        /**
         * Get all projects
         */
        async getAllProjects() {
            try {
                const transaction = this.db.transaction([this.stores.projects], 'readonly');
                const store = transaction.objectStore(this.stores.projects);
                const request = store.getAll();

                return new Promise((resolve, reject) => {
                    request.onsuccess = () => resolve(request.result || []);
                    request.onerror = () => reject(request.error);
                });
            } catch (err) {
                console.error('Failed to get projects:', err);
                return [];
            }
        },

        /**
         * Delete project
         */
        async deleteProject(projectId) {
            try {
                const transaction = this.db.transaction([this.stores.projects], 'readwrite');
                const store = transaction.objectStore(this.stores.projects);

                return new Promise((resolve, reject) => {
                    const request = store.delete(projectId);
                    request.onsuccess = () => resolve(true);
                    request.onerror = () => reject(request.error);
                });
            } catch (err) {
                console.error('Failed to delete project:', err);
                return false;
            }
        },

        /**
         * Cache price data
         */
        async cachePrice(productId, priceData) {
            try {
                const transaction = this.db.transaction([this.stores.prices], 'readwrite');
                const store = transaction.objectStore(this.stores.prices);

                const data = {
                    id: productId,
                    ...priceData,
                    timestamp: Date.now(),
                    expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
                };

                return new Promise((resolve, reject) => {
                    const request = store.put(data);
                    request.onsuccess = () => resolve(true);
                    request.onerror = () => reject(request.error);
                });
            } catch (err) {
                console.error('Failed to cache price:', err);
                return false;
            }
        },

        /**
         * Get cached price
         */
        async getCachedPrice(productId) {
            try {
                const transaction = this.db.transaction([this.stores.prices], 'readonly');
                const store = transaction.objectStore(this.stores.prices);
                const request = store.get(productId);

                const result = await new Promise((resolve, reject) => {
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });

                // Check if expired
                if (result && result.expires > Date.now()) {
                    return result;
                }

                return null;
            } catch (err) {
                console.error('Failed to get cached price:', err);
                return null;
            }
        },

        /**
         * Generic cache with TTL
         */
        async setCache(key, value, ttlMinutes = 60) {
            try {
                const transaction = this.db.transaction([this.stores.cache], 'readwrite');
                const store = transaction.objectStore(this.stores.cache);

                const data = {
                    key,
                    value,
                    created: Date.now(),
                    expires: Date.now() + (ttlMinutes * 60 * 1000)
                };

                return new Promise((resolve, reject) => {
                    const request = store.put(data);
                    request.onsuccess = () => resolve(true);
                    request.onerror = () => reject(request.error);
                });
            } catch (err) {
                console.error('Failed to set cache:', err);
                return false;
            }
        },

        /**
         * Get from cache
         */
        async getCache(key) {
            try {
                const transaction = this.db.transaction([this.stores.cache], 'readonly');
                const store = transaction.objectStore(this.stores.cache);
                const request = store.get(key);

                const result = await new Promise((resolve, reject) => {
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });

                // Check if expired
                if (result && result.expires > Date.now()) {
                    return result.value;
                }

                return null;
            } catch (err) {
                console.error('Failed to get cache:', err);
                return null;
            }
        },

        /**
         * Track analytics event (offline-capable)
         */
        async trackEvent(event, data = {}) {
            try {
                const transaction = this.db.transaction([this.stores.analytics], 'readwrite');
                const store = transaction.objectStore(this.stores.analytics);

                const eventData = {
                    event,
                    data,
                    timestamp: Date.now(),
                    synced: false
                };

                return new Promise((resolve, reject) => {
                    const request = store.add(eventData);
                    request.onsuccess = () => resolve(true);
                    request.onerror = () => reject(request.error);
                });
            } catch (err) {
                console.error('Failed to track event:', err);
                return false;
            }
        },

        /**
         * Get pending analytics events (for sync)
         */
        async getPendingEvents() {
            try {
                const transaction = this.db.transaction([this.stores.analytics], 'readonly');
                const store = transaction.objectStore(this.stores.analytics);
                const request = store.getAll();

                const events = await new Promise((resolve, reject) => {
                    request.onsuccess = () => resolve(request.result || []);
                    request.onerror = () => reject(request.error);
                });

                return events.filter(e => !e.synced);
            } catch (err) {
                console.error('Failed to get pending events:', err);
                return [];
            }
        },

        /**
         * Migrate data from localStorage to IndexedDB
         */
        async migrateFromLocalStorage() {
            try {
                // Migrate projects
                const projectsJSON = localStorage.getItem('claudia_projects');
                if (projectsJSON) {
                    const projects = JSON.parse(projectsJSON);
                    for (const project of projects) {
                        await this.saveProject(project);
                    }
                    console.log(`✅ Migrated ${projects.length} projects to IndexedDB`);
                }

                // Keep localStorage as backup for now
            } catch (err) {
                console.error('Migration failed:', err);
            }
        },

        /**
         * Setup periodic cleanup of expired data
         */
        setupCleanup() {
            // Clean every hour
            setInterval(() => this.cleanupExpired(), 3600000);
        },

        /**
         * Cleanup expired cache entries
         */
        async cleanupExpired() {
            try {
                const now = Date.now();

                // Clean cache
                const cacheTransaction = this.db.transaction([this.stores.cache], 'readwrite');
                const cacheStore = cacheTransaction.objectStore(this.stores.cache);
                const cacheIndex = cacheStore.index('expires');
                const cacheRange = IDBKeyRange.upperBound(now);
                const cacheRequest = cacheIndex.openCursor(cacheRange);

                let deletedCache = 0;
                cacheRequest.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        cursor.delete();
                        deletedCache++;
                        cursor.continue();
                    } else {
                        if (deletedCache > 0) {
                            console.log(`🗑️ Cleaned ${deletedCache} expired cache entries`);
                        }
                    }
                };

                // Clean prices
                const priceTransaction = this.db.transaction([this.stores.prices], 'readwrite');
                const priceStore = priceTransaction.objectStore(this.stores.prices);
                const priceIndex = priceStore.index('timestamp');
                const priceRange = IDBKeyRange.upperBound(now - (7 * 24 * 60 * 60 * 1000)); // Older than 7 days
                const priceRequest = priceIndex.openCursor(priceRange);

                let deletedPrices = 0;
                priceRequest.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        cursor.delete();
                        deletedPrices++;
                        cursor.continue();
                    } else {
                        if (deletedPrices > 0) {
                            console.log(`🗑️ Cleaned ${deletedPrices} old price entries`);
                        }
                    }
                };

            } catch (err) {
                console.error('Cleanup failed:', err);
            }
        },

        /**
         * Get database stats
         */
        async getStats() {
            try {
                const stats = {
                    apus: 0,
                    projects: 0,
                    prices: 0,
                    cache: 0,
                    analytics: 0,
                    totalSize: 0
                };

                const storeNames = Object.values(this.stores);
                const transaction = this.db.transaction(storeNames, 'readonly');

                for (const storeName of storeNames) {
                    const store = transaction.objectStore(storeName);
                    const count = await new Promise((resolve) => {
                        const request = store.count();
                        request.onsuccess = () => resolve(request.result);
                        request.onerror = () => resolve(0);
                    });
                    stats[storeName] = count;
                }

                // Estimate size
                if (navigator.storage && navigator.storage.estimate) {
                    const estimate = await navigator.storage.estimate();
                    stats.totalSize = estimate.usage;
                    stats.quota = estimate.quota;
                    stats.percentage = ((estimate.usage / estimate.quota) * 100).toFixed(2);
                }

                return stats;
            } catch (err) {
                console.error('Failed to get stats:', err);
                return null;
            }
        },

        /**
         * Export all data (for backup)
         */
        async exportAll() {
            try {
                const data = {
                    version: this.version,
                    exportedAt: new Date().toISOString(),
                    apus: await this.getAllAPUs(),
                    projects: await this.getAllProjects(),
                    analytics: await this.getPendingEvents()
                };

                return data;
            } catch (err) {
                console.error('Export failed:', err);
                return null;
            }
        },

        /**
         * Clear all data
         */
        async clearAll() {
            try {
                const storeNames = Object.values(this.stores);
                const transaction = this.db.transaction(storeNames, 'readwrite');

                const promises = storeNames.map(storeName => {
                    return new Promise((resolve, reject) => {
                        const store = transaction.objectStore(storeName);
                        const request = store.clear();
                        request.onsuccess = () => resolve();
                        request.onerror = () => reject(request.error);
                    });
                });

                await Promise.all(promises);
                console.log('✅ All IndexedDB data cleared');
                return true;
            } catch (err) {
                console.error('Failed to clear data:', err);
                return false;
            }
        }
    };

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ClaudiaDB.init());
    } else {
        ClaudiaDB.init();
    }

})();


// === claudia-compression.js ===
/**
 * CLAUDIA Data Compression v6.7.1
 * Compress/decompress data for efficient storage
 * Uses LZ-based compression to save 50-70% space
 */

(function() {
    'use strict';

    window.ClaudiaCompression = {

        /**
         * Simple LZ77-based compression
         * @param {string} str - String to compress
         * @returns {string} Compressed string
         */
        compress(str) {
            if (!str || str.length === 0) return '';

            try {
                // Convert to bytes
                const bytes = new TextEncoder().encode(str);

                // Use built-in compression if available
                if (typeof CompressionStream !== 'undefined') {
                    return this.compressStream(str);
                }

                // Fallback to simple run-length encoding + dictionary
                return this.compressSimple(str);
            } catch (err) {
                console.error('Compression failed:', err);
                return str; // Return original on error
            }
        },

        /**
         * Decompress string
         * @param {string} compressed - Compressed string
         * @returns {string} Decompressed string
         */
        decompress(compressed) {
            if (!compressed || compressed.length === 0) return '';

            try {
                // Detect compression type
                if (compressed.startsWith('LZSTR:')) {
                    return this.decompressStream(compressed);
                } else if (compressed.startsWith('RLE:')) {
                    return this.decompressSimple(compressed);
                }

                return compressed; // Not compressed
            } catch (err) {
                console.error('Decompression failed:', err);
                return compressed;
            }
        },

        /**
         * Simple compression using RLE + dictionary
         */
        compressSimple(str) {
            // Build dictionary of common substrings
            const dict = new Map();
            let dictIndex = 0;

            // Find repeated patterns
            for (let len = 10; len >= 3; len--) {
                for (let i = 0; i <= str.length - len; i++) {
                    const substr = str.substr(i, len);
                    const count = (str.match(new RegExp(this.escapeRegExp(substr), 'g')) || []).length;

                    if (count > 1 && !dict.has(substr)) {
                        dict.set(substr, `§${dictIndex}§`);
                        dictIndex++;

                        if (dictIndex >= 100) break;
                    }
                }
                if (dictIndex >= 100) break;
            }

            // Replace patterns with dictionary references
            let compressed = str;
            dict.forEach((ref, pattern) => {
                compressed = compressed.split(pattern).join(ref);
            });

            // Build dictionary string
            let dictStr = '';
            dict.forEach((ref, pattern) => {
                dictStr += `${ref}:${pattern}|`;
            });

            return `RLE:${dictStr}¶${compressed}`;
        },

        /**
         * Simple decompression
         */
        decompressSimple(compressed) {
            const parts = compressed.substring(4).split('¶');
            if (parts.length !== 2) return compressed;

            const [dictStr, data] = parts;

            // Rebuild dictionary
            let result = data;
            dictStr.split('|').forEach(entry => {
                if (!entry) return;
                const [ref, pattern] = entry.split(':', 2);
                result = result.split(ref).join(pattern);
            });

            return result;
        },

        /**
         * Compress using streams (modern browsers)
         */
        async compressStream(str) {
            try {
                const stream = new Response(str).body;
                const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
                const buffer = await new Response(compressedStream).arrayBuffer();

                // Convert to base64
                const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
                return `LZSTR:${base64}`;
            } catch (err) {
                console.error('Stream compression failed:', err);
                return this.compressSimple(str);
            }
        },

        /**
         * Decompress using streams
         */
        async decompressStream(compressed) {
            try {
                const base64 = compressed.substring(6);
                const binaryString = atob(base64);
                const bytes = new Uint8Array(binaryString.length);

                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }

                const stream = new Response(bytes).body;
                const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
                const text = await new Response(decompressedStream).text();

                return text;
            } catch (err) {
                console.error('Stream decompression failed:', err);
                return compressed;
            }
        },

        /**
         * Escape special regex characters
         */
        escapeRegExp(string) {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        },

        /**
         * Compress and save to localStorage
         * @param {string} key - Storage key
         * @param {any} data - Data to store
         */
        saveCompressed(key, data) {
            try {
                const json = JSON.stringify(data);
                const compressed = this.compress(json);

                localStorage.setItem(key, compressed);

                // Log compression stats
                const original = json.length;
                const final = compressed.length;
                const saved = ((1 - final / original) * 100).toFixed(1);

                console.log(`💾 Saved ${key}: ${original}B → ${final}B (${saved}% saved)`);

                return true;
            } catch (err) {
                console.error('Save compressed failed:', err);
                return false;
            }
        },

        /**
         * Load and decompress from localStorage
         * @param {string} key - Storage key
         * @returns {any} Decompressed data
         */
        loadCompressed(key) {
            try {
                const compressed = localStorage.getItem(key);
                if (!compressed) return null;

                const decompressed = this.decompress(compressed);
                return JSON.parse(decompressed);
            } catch (err) {
                console.error('Load compressed failed:', err);
                return null;
            }
        },

        /**
         * Get compression ratio for a string
         * @param {string} str - String to test
         * @returns {number} Compression ratio (0-1)
         */
        getCompressionRatio(str) {
            const compressed = this.compress(str);
            return compressed.length / str.length;
        },

        /**
         * Estimate savings for data
         * @param {any} data - Data to estimate
         * @returns {Object} Savings statistics
         */
        estimateSavings(data) {
            const json = JSON.stringify(data);
            const compressed = this.compress(json);

            return {
                original: json.length,
                compressed: compressed.length,
                saved: json.length - compressed.length,
                ratio: (compressed.length / json.length),
                percentage: ((1 - compressed.length / json.length) * 100).toFixed(1) + '%'
            };
        },

        /**
         * Migrate existing localStorage to compressed format
         */
        migrateLocalStorage() {
            const keys = [
                'claudia_projects',
                'claudia_ai_behavior',
                'claudia_user_patterns',
                'claudia_perf_history'
            ];

            let totalSaved = 0;

            keys.forEach(key => {
                try {
                    const existing = localStorage.getItem(key);
                    if (!existing) return;

                    // Skip if already compressed
                    if (existing.startsWith('RLE:') || existing.startsWith('LZSTR:')) return;

                    const compressed = this.compress(existing);
                    localStorage.setItem(key, compressed);

                    const saved = existing.length - compressed.length;
                    totalSaved += saved;

                    console.log(`✅ Migrated ${key}: saved ${(saved / 1024).toFixed(1)} KB`);
                } catch (err) {
                    console.error(`Failed to migrate ${key}:`, err);
                }
            });

            if (totalSaved > 0) {
                console.log(`💾 Total localStorage space saved: ${(totalSaved / 1024).toFixed(1)} KB`);
            }

            return totalSaved;
        }
    };

    // Auto-migrate on load
    setTimeout(() => {
        if (localStorage.getItem('claudia_compressed_migrated') !== 'true') {
            ClaudiaCompression.migrateLocalStorage();
            localStorage.setItem('claudia_compressed_migrated', 'true');
        }
    }, 2000);

    console.log('🗜️ Data Compression v6.7.1 loaded');

})();


// === claudia-performance.js ===
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


// === claudia-preloader.js ===
/**
 * CLAUDIA Smart Preloader v6.7.1
 * Intelligent prefetching of lazy modules based on user behavior
 * Now with network-aware loading and predictive prefetching
 */

(function() {
    'use strict';

    window.ClaudiaPreloader = {

        // Prefetch queue
        queue: [],
        loading: false,

        // Network info
        connection: null,
        networkType: 'unknown',

        // Predictive learning
        predictions: {},
        userPatterns: [],

        /**
         * Initialize smart preloader
         */
        init() {
            console.log('🔮 Smart Preloader v6.7.1 initialized');

            // Detect network conditions
            this.detectNetwork();

            // Load user patterns from storage
            this.loadUserPatterns();

            // Prefetch based on user interactions
            this.setupInteractionListeners();

            // Prefetch on idle (only on good connection)
            if (this.isGoodConnection()) {
                if ('requestIdleCallback' in window) {
                    requestIdleCallback(() => this.prefetchOnIdle(), { timeout: 2000 });
                } else {
                    setTimeout(() => this.prefetchOnIdle(), 3000);
                }
            }

            // Setup intersection observer for predictive loading
            this.setupIntersectionObserver();
        },

        /**
         * Detect network conditions
         */
        detectNetwork() {
            if ('connection' in navigator || 'mozConnection' in navigator || 'webkitConnection' in navigator) {
                this.connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
                this.networkType = this.connection.effectiveType || 'unknown';

                // Listen to network changes
                this.connection.addEventListener('change', () => {
                    this.networkType = this.connection.effectiveType;
                    console.log('🌐 Network changed to:', this.networkType);

                    // Adjust prefetch strategy based on network
                    this.adjustPrefetchStrategy();
                });
            }
        },

        /**
         * Check if connection is good enough for prefetching
         */
        isGoodConnection() {
            if (!this.connection) return true; // Default to yes if unknown

            // Don't prefetch on slow connections or save-data mode
            if (this.connection.saveData) return false;
            if (this.networkType === 'slow-2g' || this.networkType === '2g') return false;

            return true;
        },

        /**
         * Adjust prefetch strategy based on network
         */
        adjustPrefetchStrategy() {
            if (!this.isGoodConnection()) {
                // Clear prefetch queue on poor connection
                this.queue = [];
                console.log('⚠️ Prefetching paused due to poor connection');
            } else {
                // Resume prefetching
                this.prefetchOnIdle();
            }
        },

        /**
         * Load user patterns from storage
         */
        loadUserPatterns() {
            try {
                const saved = localStorage.getItem('claudia_user_patterns');
                if (saved) {
                    this.userPatterns = JSON.parse(saved);
                    this.analyzePredictions();
                }
            } catch (err) {
                console.error('Failed to load user patterns:', err);
            }
        },

        /**
         * Save user patterns
         */
        saveUserPatterns() {
            try {
                localStorage.setItem('claudia_user_patterns', JSON.stringify(this.userPatterns));
            } catch (err) {
                console.error('Failed to save user patterns:', err);
            }
        },

        /**
         * Track user action for predictive learning
         */
        trackAction(action, module) {
            this.userPatterns.push({
                action,
                module,
                timestamp: Date.now(),
                networkType: this.networkType
            });

            // Keep last 100 actions
            if (this.userPatterns.length > 100) {
                this.userPatterns = this.userPatterns.slice(-100);
            }

            this.saveUserPatterns();
            this.analyzePredictions();
        },

        /**
         * Analyze patterns to make predictions
         */
        analyzePredictions() {
            // Simple prediction: if user frequently uses a module after certain action, predict it
            const actionModuleMap = {};

            this.userPatterns.forEach(pattern => {
                const key = pattern.action;
                if (!actionModuleMap[key]) {
                    actionModuleMap[key] = {};
                }
                actionModuleMap[key][pattern.module] = (actionModuleMap[key][pattern.module] || 0) + 1;
            });

            // Store top predictions
            Object.keys(actionModuleMap).forEach(action => {
                const modules = actionModuleMap[action];
                const sorted = Object.entries(modules)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 2); // Top 2 predictions

                this.predictions[action] = sorted.map(([module]) => module);
            });
        },

        /**
         * Setup intersection observer for predictive loading
         */
        setupIntersectionObserver() {
            if (!('IntersectionObserver' in window)) return;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const target = entry.target;
                        const module = target.dataset.prefetchModule;

                        if (module && this.isGoodConnection()) {
                            this.prefetch(module, 'high');
                        }
                    }
                });
            }, {
                rootMargin: '50px' // Start prefetch 50px before element is visible
            });

            // Observe buttons that might trigger lazy loading
            document.querySelectorAll('[data-prefetch-module]').forEach(el => {
                observer.observe(el);
            });
        },

        /**
         * Setup listeners for user interactions
         */
        setupInteractionListeners() {
            // Prefetch photos module when user hovers over photo button
            const photoBtn = document.querySelector('[onclick*="openPhotoManager"]');
            if (photoBtn) {
                photoBtn.addEventListener('mouseenter', () => {
                    this.prefetch('photos', 'high');
                }, { once: true });
            }

            // Prefetch calendar when user hovers over calendar button
            const calendarBtn = document.querySelector('[onclick*="openCalendar"]');
            if (calendarBtn) {
                calendarBtn.addEventListener('mouseenter', () => {
                    this.prefetch('calendar', 'high');
                }, { once: true });
            }

            // Prefetch PDF when user hovers over export button
            const exportBtns = document.querySelectorAll('[onclick*="exportProject"], [onclick*="exportPDF"]');
            exportBtns.forEach(btn => {
                btn.addEventListener('mouseenter', () => {
                    this.prefetch('pdfExport', 'medium');
                }, { once: true });
            });

            // Prefetch voice if user has used it before
            if (localStorage.getItem('claudia_voice_used') === 'true') {
                this.prefetch('voice', 'low');
            }

            // Prefetch collaboration if sharing is enabled
            if (localStorage.getItem('claudia_sharing_enabled') === 'true') {
                this.prefetch('collaboration', 'low');
            }
        },

        /**
         * Prefetch module with priority
         * @param {string} module - Module name
         * @param {string} priority - Priority: 'high', 'medium', 'low'
         */
        prefetch(module, priority = 'low') {
            // Check if already loaded or in queue
            if (window.ClaudiaLazyLoader && window.ClaudiaLazyLoader.loaded[module]) {
                return;
            }

            if (this.queue.find(item => item.module === module)) {
                return;
            }

            const priorityValues = { high: 3, medium: 2, low: 1 };
            this.queue.push({
                module,
                priority: priorityValues[priority] || 1
            });

            // Sort by priority
            this.queue.sort((a, b) => b.priority - a.priority);

            // Start loading
            this.processQueue();
        },

        /**
         * Process prefetch queue
         */
        async processQueue() {
            if (this.loading || this.queue.length === 0) return;

            this.loading = true;
            const item = this.queue.shift();

            try {
                console.log(`🔮 Prefetching ${item.module}...`);

                // Use link prefetch
                const link = document.createElement('link');
                link.rel = 'prefetch';
                link.as = 'script';
                link.href = this.getModulePath(item.module);
                document.head.appendChild(link);

                // Wait a bit before next prefetch
                await this.delay(500);
            } catch (err) {
                console.error(`❌ Prefetch failed for ${item.module}:`, err);
            } finally {
                this.loading = false;
                this.processQueue(); // Process next item
            }
        },

        /**
         * Prefetch modules on idle time
         */
        prefetchOnIdle() {
            // Prefetch in order of likelihood
            const modules = ['photos', 'calendar', 'pdfExport', 'voice', 'collaboration'];

            modules.forEach((module, index) => {
                setTimeout(() => {
                    this.prefetch(module, 'low');
                }, index * 1000);
            });
        },

        /**
         * Get module file path
         * @param {string} module - Module name
         * @returns {string} File path
         */
        getModulePath(module) {
            const paths = {
                photos: 'js/claudia-photos.min.js',
                calendar: 'js/claudia-calendar.min.js',
                pdfExport: 'js/claudia-pdf-export.min.js',
                voice: 'js/claudia-voice.min.js',
                collaboration: 'js/claudia-collaboration.min.js'
            };
            return paths[module] || '';
        },

        /**
         * Delay helper
         * @param {number} ms - Milliseconds
         * @returns {Promise}
         */
        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    };

    // Auto-initialize after page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => ClaudiaPreloader.init(), 1000);
        });
    } else {
        setTimeout(() => ClaudiaPreloader.init(), 1000);
    }

})();

// === claudia-worker-manager.js ===
/**
 * CLAUDIA Worker Manager v6.7.2
 * Manages Web Worker pool for heavy computations
 * Prevents UI blocking and improves performance
 */

(function() {
    'use strict';

    window.ClaudiaWorkerManager = {
        worker: null,
        pendingTasks: new Map(),
        taskCounter: 0,
        isSupported: typeof Worker !== 'undefined',

        /**
         * Initialize worker
         */
        init() {
            if (!this.isSupported) {
                console.warn('⚠️ Web Workers not supported, falling back to main thread');
                return false;
            }

            try {
                this.worker = new Worker('js/claudia-web-worker.js');
                this.worker.addEventListener('message', this.handleMessage.bind(this));
                this.worker.addEventListener('error', this.handleError.bind(this));
                console.log('🔧 Worker Manager initialized');
                return true;
            } catch (error) {
                console.error('Failed to initialize worker:', error);
                this.isSupported = false;
                return false;
            }
        },

        /**
         * Handle worker message
         */
        handleMessage(e) {
            const { id, type, result, success, error } = e.data;

            const task = this.pendingTasks.get(id);
            if (!task) {
                console.warn('Received response for unknown task:', id);
                return;
            }

            this.pendingTasks.delete(id);

            if (success) {
                task.resolve(result);
            } else {
                task.reject(new Error(error || 'Task failed'));
            }
        },

        /**
         * Handle worker error
         */
        handleError(error) {
            console.error('Worker error:', error);

            // Reject all pending tasks
            this.pendingTasks.forEach(task => {
                task.reject(new Error('Worker error'));
            });
            this.pendingTasks.clear();

            // Try to reinitialize
            this.terminate();
            setTimeout(() => this.init(), 1000);
        },

        /**
         * Execute task in worker
         */
        async execute(type, data) {
            // Fallback to main thread if worker not supported
            if (!this.isSupported || !this.worker) {
                return this.executeInMainThread(type, data);
            }

            return new Promise((resolve, reject) => {
                const id = ++this.taskCounter;

                this.pendingTasks.set(id, { resolve, reject, type, startTime: Date.now() });

                this.worker.postMessage({ id, type, data });

                // Timeout after 30 seconds
                setTimeout(() => {
                    if (this.pendingTasks.has(id)) {
                        this.pendingTasks.delete(id);
                        reject(new Error('Task timeout'));
                    }
                }, 30000);
            });
        },

        /**
         * Fallback execution in main thread
         */
        async executeInMainThread(type, data) {
            // Simple fallbacks for common operations
            switch (type) {
                case 'SEARCH_APUS':
                    return this.searchAPUs(data);

                case 'CALCULATE_BUDGET':
                    return this.calculateBudget(data);

                case 'FILTER_ACTIVITIES':
                    return this.filterActivities(data);

                case 'SORT_ACTIVITIES':
                    return this.sortActivities(data);

                default:
                    throw new Error(`Unsupported task type: ${type}`);
            }
        },

        /**
         * Search APUs (fallback)
         */
        searchAPUs({ apus, query, filters }) {
            const normalizedQuery = query.toLowerCase().trim();

            if (!normalizedQuery && (!filters || Object.keys(filters).length === 0)) {
                return apus;
            }

            return apus.filter(apu => {
                if (normalizedQuery) {
                    const matchesName = apu.nombre.toLowerCase().includes(normalizedQuery);
                    const matchesCode = apu.codigo?.toLowerCase().includes(normalizedQuery);
                    const matchesCategory = apu.categoria?.toLowerCase().includes(normalizedQuery);

                    if (!(matchesName || matchesCode || matchesCategory)) {
                        return false;
                    }
                }

                if (filters) {
                    if (filters.categoria && apu.categoria !== filters.categoria) {
                        return false;
                    }
                }

                return true;
            });
        },

        /**
         * Calculate budget (fallback)
         */
        calculateBudget({ activities }) {
            const total = activities.reduce((sum, act) => {
                return sum + (act.precio || 0) * (act.cantidad || 0);
            }, 0);

            return {
                total,
                activities: activities.length,
                average: total / (activities.length || 1)
            };
        },

        /**
         * Filter activities (fallback)
         */
        filterActivities({ activities, criteria }) {
            return activities.filter(activity => {
                for (const [key, value] of Object.entries(criteria)) {
                    if (value === null || value === undefined) continue;
                    if (activity[key] !== value) return false;
                }
                return true;
            });
        },

        /**
         * Sort activities (fallback)
         */
        sortActivities({ activities, field, direction = 'asc' }) {
            return [...activities].sort((a, b) => {
                const valA = a[field];
                const valB = b[field];

                if (valA < valB) return direction === 'asc' ? -1 : 1;
                if (valA > valB) return direction === 'asc' ? 1 : -1;
                return 0;
            });
        },

        /**
         * Terminate worker
         */
        terminate() {
            if (this.worker) {
                this.worker.terminate();
                this.worker = null;
            }
            this.pendingTasks.clear();
        },

        /**
         * Get pending task count
         */
        getPendingCount() {
            return this.pendingTasks.size;
        }
    };

    // Auto-initialize on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.ClaudiaWorkerManager.init();
        });
    } else {
        window.ClaudiaWorkerManager.init();
    }

    console.log('🔧 Worker Manager v6.7.2 loaded');

})();


// === claudia-memory-manager.js ===
/**
 * CLAUDIA Memory Manager v6.7.2
 * Monitors and optimizes memory usage
 * Prevents memory leaks and OOM crashes
 */

(function() {
    'use strict';

    window.ClaudiaMemoryManager = {
        // Thresholds (in MB)
        WARNING_THRESHOLD: 100,
        CRITICAL_THRESHOLD: 200,

        // Monitoring
        monitoringInterval: null,
        lastCheck: null,
        memoryHistory: [],
        maxHistorySize: 50,

        // Cleanup callbacks
        cleanupCallbacks: [],

        /**
         * Initialize memory monitoring
         */
        init() {
            if (!performance.memory) {
                console.warn('⚠️ Memory monitoring not supported in this browser');
                return false;
            }

            // Check memory every 30 seconds
            this.monitoringInterval = setInterval(() => {
                this.checkMemory();
            }, 30000);

            // Initial check
            this.checkMemory();

            console.log('💾 Memory Manager initialized');
            return true;
        },

        /**
         * Check current memory usage
         */
        checkMemory() {
            if (!performance.memory) return null;

            const memory = {
                used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
                total: Math.round(performance.memory.totalJSHeapSize / 1048576),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576),
                timestamp: Date.now()
            };

            memory.percentage = (memory.used / memory.limit) * 100;

            // Add to history
            this.memoryHistory.push(memory);
            if (this.memoryHistory.length > this.maxHistorySize) {
                this.memoryHistory.shift();
            }

            this.lastCheck = memory;

            // Check thresholds
            if (memory.used >= this.CRITICAL_THRESHOLD) {
                console.warn('🚨 CRITICAL memory usage:', memory.used, 'MB');
                this.performAggressiveCleanup();
            } else if (memory.used >= this.WARNING_THRESHOLD) {
                console.warn('⚠️ High memory usage:', memory.used, 'MB');
                this.performCleanup();
            }

            return memory;
        },

        /**
         * Register cleanup callback
         */
        registerCleanup(name, callback, priority = 'normal') {
            this.cleanupCallbacks.push({
                name,
                callback,
                priority // 'low', 'normal', 'high'
            });
        },

        /**
         * Perform normal cleanup
         */
        performCleanup() {
            console.log('🧹 Performing memory cleanup...');

            // Execute normal priority cleanups
            this.cleanupCallbacks
                .filter(c => c.priority === 'normal' || c.priority === 'high')
                .forEach(cleanup => {
                    try {
                        cleanup.callback();
                        console.log('  ✓ Cleaned:', cleanup.name);
                    } catch (error) {
                        console.error('  ✗ Cleanup failed:', cleanup.name, error);
                    }
                });

            // Clear old IndexedDB cache
            if (window.ClaudiaIndexedDB) {
                ClaudiaIndexedDB.cleanExpired().catch(err => {
                    console.error('Failed to clean IndexedDB:', err);
                });
            }

            // Clear old localStorage data
            this.cleanLocalStorage();

            // Force garbage collection if available (Chrome DevTools)
            if (window.gc) {
                window.gc();
            }

            // Check result
            setTimeout(() => {
                const after = this.checkMemory();
                if (after) {
                    console.log('🧹 Cleanup complete. Memory:', after.used, 'MB');
                }
            }, 1000);
        },

        /**
         * Perform aggressive cleanup (critical memory)
         */
        performAggressiveCleanup() {
            console.warn('🚨 Performing AGGRESSIVE cleanup...');

            // Execute ALL cleanup callbacks
            this.cleanupCallbacks.forEach(cleanup => {
                try {
                    cleanup.callback();
                    console.log('  ✓ Cleaned:', cleanup.name);
                } catch (error) {
                    console.error('  ✗ Cleanup failed:', cleanup.name, error);
                }
            });

            // Clear ALL caches
            this.clearAllCaches();

            // Clear old data
            this.cleanLocalStorage(true);

            // Clear session data
            this.clearSessionData();

            // Force garbage collection
            if (window.gc) {
                window.gc();
            }

            // Warn user
            this.showMemoryWarning();

            setTimeout(() => {
                const after = this.checkMemory();
                if (after) {
                    console.log('🚨 Aggressive cleanup complete. Memory:', after.used, 'MB');
                }
            }, 1000);
        },

        /**
         * Clear all caches
         */
        clearAllCaches() {
            // Clear browser caches
            if ('caches' in window) {
                caches.keys().then(names => {
                    names.forEach(name => {
                        if (name.includes('claudia')) {
                            caches.delete(name);
                            console.log('  ✓ Cleared cache:', name);
                        }
                    });
                });
            }

            // Clear IndexedDB non-critical data
            if (window.ClaudiaIndexedDB) {
                ClaudiaIndexedDB.clearStore('cache').catch(err => {
                    console.error('Failed to clear cache store:', err);
                });
            }
        },

        /**
         * Clean localStorage
         */
        cleanLocalStorage(aggressive = false) {
            const keysToCheck = [];

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('claudia_')) {
                    keysToCheck.push(key);
                }
            }

            keysToCheck.forEach(key => {
                try {
                    // Remove old analytics (keep last 30 days)
                    if (key.includes('analytics') || key.includes('events')) {
                        const data = JSON.parse(localStorage.getItem(key) || '[]');
                        if (Array.isArray(data)) {
                            const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
                            const filtered = data.filter(item => {
                                const timestamp = item.timestamp || item.date || 0;
                                return timestamp > cutoff;
                            });

                            if (filtered.length < data.length) {
                                localStorage.setItem(key, JSON.stringify(filtered));
                                console.log('  ✓ Cleaned old analytics from:', key);
                            }
                        }
                    }

                    // Remove old performance data
                    if (key.includes('perf_history')) {
                        const data = JSON.parse(localStorage.getItem(key) || '[]');
                        if (Array.isArray(data) && data.length > 10) {
                            localStorage.setItem(key, JSON.stringify(data.slice(-10)));
                            console.log('  ✓ Trimmed performance history');
                        }
                    }

                    // Aggressive: Clear caches
                    if (aggressive) {
                        if (key.includes('cache') || key.includes('temp')) {
                            localStorage.removeItem(key);
                            console.log('  ✓ Removed cache:', key);
                        }
                    }
                } catch (error) {
                    console.error('Failed to clean:', key, error);
                }
            });
        },

        /**
         * Clear session data
         */
        clearSessionData() {
            // Clear session storage
            for (let i = sessionStorage.length - 1; i >= 0; i--) {
                const key = sessionStorage.key(i);
                if (key && key.startsWith('claudia_')) {
                    sessionStorage.removeItem(key);
                    console.log('  ✓ Cleared session:', key);
                }
            }
        },

        /**
         * Show memory warning to user
         */
        showMemoryWarning() {
            const message = '⚠️ CLAUDIA está usando mucha memoria. Se han limpiado datos temporales para mejorar el rendimiento.';

            if (window.ClaudiaNotifications) {
                ClaudiaNotifications.show({
                    title: 'Memoria Alta',
                    body: message,
                    type: 'warning'
                });
            } else {
                alert(message);
            }
        },

        /**
         * Get memory statistics
         */
        getStats() {
            if (!this.lastCheck) {
                return null;
            }

            const trend = this.getMemoryTrend();

            return {
                current: this.lastCheck,
                history: this.memoryHistory,
                trend,
                status: this.getMemoryStatus()
            };
        },

        /**
         * Get memory trend
         */
        getMemoryTrend() {
            if (this.memoryHistory.length < 2) {
                return 'stable';
            }

            const recent = this.memoryHistory.slice(-5);
            const avg = recent.reduce((sum, m) => sum + m.used, 0) / recent.length;
            const current = this.lastCheck.used;

            if (current > avg * 1.1) return 'increasing';
            if (current < avg * 0.9) return 'decreasing';
            return 'stable';
        },

        /**
         * Get memory status
         */
        getMemoryStatus() {
            if (!this.lastCheck) return 'unknown';

            if (this.lastCheck.used >= this.CRITICAL_THRESHOLD) {
                return 'critical';
            } else if (this.lastCheck.used >= this.WARNING_THRESHOLD) {
                return 'warning';
            } else {
                return 'normal';
            }
        },

        /**
         * Destroy manager
         */
        destroy() {
            if (this.monitoringInterval) {
                clearInterval(this.monitoringInterval);
                this.monitoringInterval = null;
            }

            this.cleanupCallbacks = [];
            this.memoryHistory = [];
        }
    };

    // Export globally
    window.MemoryManager = window.ClaudiaMemoryManager;

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.ClaudiaMemoryManager.init();
        });
    } else {
        window.ClaudiaMemoryManager.init();
    }

    // Register common cleanups
    window.ClaudiaMemoryManager.registerCleanup('Clear DOM caches', () => {
        // Clear any cached DOM references that might be retained
        document.querySelectorAll('.hidden').forEach(el => {
            if (el.style.display === 'none') {
                el.innerHTML = '';
            }
        });
    }, 'low');

    console.log('💾 Memory Manager v6.7.2 loaded');

})();


// === claudia-batch-analytics.js ===
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


// === claudia-idle-tasks.js ===
/**
 * CLAUDIA Idle Task Scheduler v6.7.2
 * Executes low-priority tasks during browser idle time
 * Improves perceived performance by deferring non-critical work
 */

(function() {
    'use strict';

    window.ClaudiaIdleTasks = {
        tasks: [],
        isRunning: false,
        requestIdleCallback: window.requestIdleCallback || null,

        /**
         * Initialize idle task scheduler
         */
        init() {
            // Polyfill for requestIdleCallback
            if (!this.requestIdleCallback) {
                this.requestIdleCallback = (callback) => {
                    return setTimeout(() => {
                        callback({
                            didTimeout: false,
                            timeRemaining: () => 50
                        });
                    }, 1);
                };
            }

            console.log('⏱️ Idle Task Scheduler initialized');
        },

        /**
         * Schedule task for idle time
         */
        schedule(name, task, priority = 'normal') {
            this.tasks.push({
                name,
                task,
                priority, // 'low', 'normal', 'high'
                added: Date.now()
            });

            // Sort by priority
            this.tasks.sort((a, b) => {
                const priorityOrder = { high: 3, normal: 2, low: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            });

            // Start processing if not already running
            if (!this.isRunning) {
                this.processQueue();
            }
        },

        /**
         * Process task queue during idle time
         */
        processQueue() {
            if (this.tasks.length === 0) {
                this.isRunning = false;
                return;
            }

            this.isRunning = true;

            this.requestIdleCallback((deadline) => {
                while (
                    this.tasks.length > 0 &&
                    (deadline.timeRemaining() > 0 || deadline.didTimeout)
                ) {
                    const { name, task } = this.tasks.shift();

                    try {
                        const startTime = performance.now();
                        task();
                        const duration = performance.now() - startTime;

                        if (localStorage.getItem('claudia_debug') === 'true') {
                            console.log(`⏱️ Idle task completed: ${name} (${duration.toFixed(1)}ms)`);
                        }
                    } catch (error) {
                        console.error(`Failed to execute idle task: ${name}`, error);
                    }

                    // Check if we're out of time
                    if (deadline.timeRemaining() <= 0) {
                        break;
                    }
                }

                // Continue processing if tasks remain
                if (this.tasks.length > 0) {
                    this.processQueue();
                } else {
                    this.isRunning = false;
                }
            }, { timeout: 2000 });
        },

        /**
         * Clear all pending tasks
         */
        clear() {
            this.tasks = [];
            this.isRunning = false;
        },

        /**
         * Get queue size
         */
        getQueueSize() {
            return this.tasks.length;
        }
    };

    // Export globally
    window.IdleTasks = window.ClaudiaIdleTasks;

    // Auto-initialize
    window.ClaudiaIdleTasks.init();

    // Schedule common idle tasks
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            scheduleCommonIdleTasks();
        });
    } else {
        scheduleCommonIdleTasks();
    }

    function scheduleCommonIdleTasks() {
        // Prefetch lazy modules
        window.ClaudiaIdleTasks.schedule('Prefetch lazy modules', () => {
            if (window.ClaudiaPreloader) {
                ClaudiaPreloader.prefetchOnIdle();
            }
        }, 'low');

        // Clean IndexedDB
        window.ClaudiaIdleTasks.schedule('Clean IndexedDB', () => {
            if (window.ClaudiaIndexedDB) {
                ClaudiaIndexedDB.cleanExpired();
            }
        }, 'low');

        // Compress localStorage
        window.ClaudiaIdleTasks.schedule('Compress localStorage', () => {
            if (window.ClaudiaCompression) {
                ClaudiaCompression.migrateLocalStorage();
            }
        }, 'low');

        // Update analytics
        window.ClaudiaIdleTasks.schedule('Update analytics', () => {
            if (window.ClaudiaAnalytics) {
                ClaudiaAnalytics.trackPageView();
            }
        }, 'normal');

        // Check for updates
        window.ClaudiaIdleTasks.schedule('Check for updates', () => {
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ type: 'CHECK_UPDATE' });
            }
        }, 'low');

        // Preload fonts
        window.ClaudiaIdleTasks.schedule('Preload fonts', () => {
            const fonts = [
                'Segoe UI',
                'Roboto',
                'Helvetica Neue'
            ];

            fonts.forEach(font => {
                if (document.fonts && document.fonts.load) {
                    document.fonts.load(`1em ${font}`);
                }
            });
        }, 'low');

        // Warm up worker
        window.ClaudiaIdleTasks.schedule('Warm up worker', () => {
            if (window.ClaudiaWorkerManager && !ClaudiaWorkerManager.worker) {
                ClaudiaWorkerManager.init();
            }
        }, 'normal');

        // Cache APUs to IndexedDB
        window.ClaudiaIdleTasks.schedule('Cache APUs', () => {
            if (window.APU_DB && window.ClaudiaIndexedDB) {
                ClaudiaIndexedDB.cacheAPUs(APU_DB.actividades);
            }
        }, 'high');

        // Preload critical images
        window.ClaudiaIdleTasks.schedule('Preload images', () => {
            const criticalImages = [
                '/icon-192.png',
                '/icon-512.png'
            ];

            criticalImages.forEach(src => {
                const img = new Image();
                img.src = src;
            });
        }, 'low');

        // Initialize performance monitoring
        window.ClaudiaIdleTasks.schedule('Init performance monitoring', () => {
            if (window.ClaudiaPerformance && !ClaudiaPerformance.initialized) {
                ClaudiaPerformance.init();
            }
        }, 'normal');
    }

    console.log('⏱️ Idle Task Scheduler v6.7.2 loaded');

})();


// === claudia-progressive-images.js ===
/**
 * CLAUDIA Progressive Image Loader v6.8.0
 *
 * Advanced image loading system with:
 * - Progressive/blur-up loading
 * - Lazy loading with Intersection Observer
 * - Responsive srcset support
 * - WebP/AVIF format detection
 * - Low-Quality Image Placeholder (LQIP)
 * - Bandwidth-aware quality selection
 *
 * @module ClaudiaProgressiveImages
 * @version 6.8.0
 * @requires IntersectionObserver, fetch
 */

window.ClaudiaProgressiveImages = {
    version: '6.8.0',
    initialized: false,

    // Configuration
    config: {
        rootMargin: '50px',           // Load images 50px before viewport
        threshold: 0.01,              // Load when 1% visible
        placeholderQuality: 10,       // LQIP quality (1-100)
        fadeInDuration: 300,          // ms
        retryAttempts: 3,
        retryDelay: 1000,             // ms
        enableWebP: true,
        enableAVIF: true,
        responsiveSizes: [320, 640, 960, 1280, 1920, 2560],
        qualityByConnection: {
            '4g': 90,
            '3g': 70,
            '2g': 50,
            'slow-2g': 30
        }
    },

    // State
    observer: null,
    pendingImages: new Set(),
    loadedImages: new Set(),
    failedImages: new Map(),
    formatSupport: {
        webp: false,
        avif: false
    },

    /**
     * Initialize the progressive image loader
     */
    init() {
        if (this.initialized) {
            console.log('ClaudiaProgressiveImages: Already initialized');
            return;
        }

        console.log('ClaudiaProgressiveImages: Initializing v6.8.0...');

        // Check format support
        this.checkFormatSupport();

        // Setup Intersection Observer
        this.setupObserver();

        // Process all images with data-src
        this.discoverImages();

        // Listen for new images (dynamic content)
        this.setupMutationObserver();

        // Preload critical images
        this.preloadCriticalImages();

        this.initialized = true;
        console.log('ClaudiaProgressiveImages: Initialized successfully');
    },

    /**
     * Check browser support for modern image formats
     */
    async checkFormatSupport() {
        // Check WebP support
        if (this.config.enableWebP) {
            this.formatSupport.webp = await this.canUseFormat('webp');
        }

        // Check AVIF support
        if (this.config.enableAVIF) {
            this.formatSupport.avif = await this.canUseFormat('avif');
        }

        console.log('Image format support:', this.formatSupport);
    },

    /**
     * Test if browser supports image format
     */
    canUseFormat(format) {
        return new Promise((resolve) => {
            const img = new Image();

            const formats = {
                webp: 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=',
                avif: 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybW
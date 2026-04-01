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
                avif: 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A='
            };

            img.onload = () => resolve(img.width === 1);
            img.onerror = () => resolve(false);
            img.src = formats[format];
        });
    },

    /**
     * Setup Intersection Observer for lazy loading
     */
    setupObserver() {
        const options = {
            root: null,
            rootMargin: this.config.rootMargin,
            threshold: this.config.threshold
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                }
            });
        }, options);
    },

    /**
     * Discover all lazy images in the DOM
     */
    discoverImages() {
        const images = document.querySelectorAll('img[data-src], picture[data-src]');
        images.forEach(img => this.observe(img));

        console.log(`ClaudiaProgressiveImages: Discovered ${images.length} images`);
    },

    /**
     * Start observing an image
     */
    observe(element) {
        if (!this.pendingImages.has(element) && !this.loadedImages.has(element)) {
            this.pendingImages.add(element);
            this.observer.observe(element);

            // Add placeholder/blur effect
            this.applyPlaceholder(element);
        }
    },

    /**
     * Apply LQIP (Low Quality Image Placeholder)
     */
    applyPlaceholder(element) {
        const placeholder = element.dataset.placeholder;

        if (placeholder) {
            if (element.tagName === 'IMG') {
                element.src = placeholder;
                element.style.filter = 'blur(10px)';
                element.style.transition = `filter ${this.config.fadeInDuration}ms ease-in-out`;
            }
        } else {
            // Use background color from dominant color if available
            const bgColor = element.dataset.bgColor || '#f0f0f0';
            element.style.backgroundColor = bgColor;
        }
    },

    /**
     * Load an image progressively
     */
    async loadImage(element) {
        if (this.loadedImages.has(element)) return;

        this.observer.unobserve(element);
        this.pendingImages.delete(element);

        const src = this.getBestSource(element);

        if (!src) {
            console.warn('ClaudiaProgressiveImages: No source found for image', element);
            return;
        }

        try {
            await this.loadWithRetry(element, src);
            this.onImageLoaded(element);
        } catch (error) {
            this.onImageError(element, error);
        }
    },

    /**
     * Get best image source based on format support and connection
     */
    getBestSource(element) {
        // For <picture> elements
        if (element.tagName === 'PICTURE') {
            const img = element.querySelector('img');
            return img ? img.dataset.src : null;
        }

        // For <img> elements
        const sources = {
            avif: element.dataset.srcAvif,
            webp: element.dataset.srcWebp,
            default: element.dataset.src
        };

        // Select best format
        if (this.formatSupport.avif && sources.avif) {
            return sources.avif;
        }
        if (this.formatSupport.webp && sources.webp) {
            return sources.webp;
        }
        return sources.default;
    },

    /**
     * Load image with retry logic
     */
    loadWithRetry(element, src, attempt = 1) {
        return new Promise((resolve, reject) => {
            const img = element.tagName === 'IMG' ? element : element.querySelector('img');

            const tempImg = new Image();

            tempImg.onload = () => {
                // Apply srcset if available
                const srcset = element.dataset.srcset;
                if (srcset) {
                    img.srcset = srcset;
                }

                img.src = src;
                resolve();
            };

            tempImg.onerror = () => {
                if (attempt < this.config.retryAttempts) {
                    console.warn(`ClaudiaProgressiveImages: Retry ${attempt}/${this.config.retryAttempts} for ${src}`);
                    setTimeout(() => {
                        this.loadWithRetry(element, src, attempt + 1)
                            .then(resolve)
                            .catch(reject);
                    }, this.config.retryDelay * attempt);
                } else {
                    reject(new Error(`Failed to load image after ${this.config.retryAttempts} attempts`));
                }
            };

            tempImg.src = src;
        });
    },

    /**
     * Handle successful image load
     */
    onImageLoaded(element) {
        this.loadedImages.add(element);

        // Remove blur effect
        if (element.style.filter) {
            setTimeout(() => {
                element.style.filter = 'none';
            }, 10);
        }

        // Add loaded class
        element.classList.add('claudia-img-loaded');

        // Dispatch event
        element.dispatchEvent(new CustomEvent('claudia:image-loaded', {
            detail: { element }
        }));

        // Track analytics
        if (window.ClaudiaBatchAnalytics) {
            window.ClaudiaBatchAnalytics.track('image_loaded', {
                src: element.dataset.src,
                format: this.getLoadedFormat(element)
            });
        }
    },

    /**
     * Handle image load error
     */
    onImageError(element, error) {
        const src = element.dataset.src;
        this.failedImages.set(element, error);

        console.error('ClaudiaProgressiveImages: Failed to load image', src, error);

        // Add error class
        element.classList.add('claudia-img-error');

        // Show fallback image if available
        const fallback = element.dataset.fallback;
        if (fallback && element.tagName === 'IMG') {
            element.src = fallback;
        }

        // Dispatch error event
        element.dispatchEvent(new CustomEvent('claudia:image-error', {
            detail: { element, error }
        }));

        // Track error
        if (window.ClaudiaBatchAnalytics) {
            window.ClaudiaBatchAnalytics.track('image_error', {
                src,
                error: error.message
            });
        }
    },

    /**
     * Get format of loaded image
     */
    getLoadedFormat(element) {
        const src = element.src || '';

        if (src.includes('.avif')) return 'avif';
        if (src.includes('.webp')) return 'webp';
        if (src.includes('.jpg') || src.includes('.jpeg')) return 'jpeg';
        if (src.includes('.png')) return 'png';
        if (src.includes('.gif')) return 'gif';

        return 'unknown';
    },

    /**
     * Setup mutation observer for dynamic content
     */
    setupMutationObserver() {
        const mutationObserver = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // ELEMENT_NODE
                        // Check if node itself is an image
                        if (node.matches && node.matches('img[data-src], picture[data-src]')) {
                            this.observe(node);
                        }

                        // Check for images in descendants
                        const images = node.querySelectorAll('img[data-src], picture[data-src]');
                        images.forEach(img => this.observe(img));
                    }
                });
            });
        });

        mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    },

    /**
     * Preload critical above-the-fold images
     */
    preloadCriticalImages() {
        const criticalImages = document.querySelectorAll('img[data-critical="true"]');

        criticalImages.forEach(img => {
            const src = this.getBestSource(img);
            if (src) {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'image';
                link.href = src;

                const srcset = img.dataset.srcset;
                if (srcset) {
                    link.imageSrcset = srcset;
                }

                document.head.appendChild(link);

                // Load immediately
                this.loadImage(img);
            }
        });

        console.log(`ClaudiaProgressiveImages: Preloaded ${criticalImages.length} critical images`);
    },

    /**
     * Generate responsive srcset
     */
    generateSrcset(baseUrl, sizes = this.config.responsiveSizes) {
        return sizes.map(size => {
            const url = baseUrl.replace(/(\.[^.]+)$/, `_${size}w$1`);
            return `${url} ${size}w`;
        }).join(', ');
    },

    /**
     * Get quality based on connection speed
     */
    getQualityByConnection() {
        if (!navigator.connection) {
            return 90; // Default quality
        }

        const effectiveType = navigator.connection.effectiveType;
        return this.config.qualityByConnection[effectiveType] || 90;
    },

    /**
     * Get statistics
     */
    getStats() {
        return {
            pending: this.pendingImages.size,
            loaded: this.loadedImages.size,
            failed: this.failedImages.size,
            formatSupport: this.formatSupport,
            successRate: this.loadedImages.size / (this.loadedImages.size + this.failedImages.size) * 100
        };
    },

    /**
     * Reset and reload all images
     */
    reset() {
        this.pendingImages.clear();
        this.loadedImages.clear();
        this.failedImages.clear();

        if (this.observer) {
            this.observer.disconnect();
        }

        this.setupObserver();
        this.discoverImages();
    }
};

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.ClaudiaProgressiveImages.init();
    });
} else {
    window.ClaudiaProgressiveImages.init();
}

/**
 * CLAUDIA Virtual Scrolling v6.7.1
 * High-performance rendering for large lists
 * Renders only visible items for smooth 60fps scrolling
 */

(function() {
    'use strict';

    window.ClaudiaVirtualScroll = {

        instances: new Map(),

        /**
         * Create virtual scroll instance
         * @param {string} containerId - Container element ID
         * @param {Array} items - Full dataset
         * @param {Function} renderItem - Function to render each item
         * @param {Object} options - Configuration options
         */
        create(containerId, items, renderItem, options = {}) {
            const container = document.getElementById(containerId);
            if (!container) {
                console.error('Container not found:', containerId);
                return null;
            }

            const instance = {
                container,
                items,
                renderItem,
                options: {
                    itemHeight: options.itemHeight || 100,
                    overscan: options.overscan || 3,
                    threshold: options.threshold || 0.5,
                    bufferSize: options.bufferSize || 10,
                    ...options
                },
                state: {
                    scrollTop: 0,
                    visibleStart: 0,
                    visibleEnd: 0,
                    renderedStart: 0,
                    renderedEnd: 0
                },
                viewport: null,
                content: null
            };

            this.setupInstance(instance);
            this.instances.set(containerId, instance);

            console.log(`📜 Virtual scroll created for ${items.length} items`);
            return instance;
        },

        /**
         * Setup virtual scroll instance
         */
        setupInstance(instance) {
            const { container, items, options } = instance;

            // Create viewport
            instance.viewport = document.createElement('div');
            instance.viewport.className = 'virtual-scroll-viewport';
            instance.viewport.style.cssText = `
                height: 100%;
                overflow-y: auto;
                overflow-x: hidden;
                position: relative;
                will-change: transform;
            `;

            // Create content container
            instance.content = document.createElement('div');
            instance.content.className = 'virtual-scroll-content';
            instance.content.style.cssText = `
                position: relative;
                height: ${items.length * options.itemHeight}px;
            `;

            instance.viewport.appendChild(instance.content);
            container.appendChild(instance.viewport);

            // Setup scroll listener
            let ticking = false;
            instance.viewport.addEventListener('scroll', () => {
                if (!ticking) {
                    requestAnimationFrame(() => {
                        this.handleScroll(instance);
                        ticking = false;
                    });
                    ticking = true;
                }
            });

            // Initial render
            this.handleScroll(instance);
        },

        /**
         * Handle scroll event
         */
        handleScroll(instance) {
            const { viewport, options, items } = instance;
            const scrollTop = viewport.scrollTop;
            const viewportHeight = viewport.clientHeight;

            // Calculate visible range
            const visibleStart = Math.floor(scrollTop / options.itemHeight);
            const visibleEnd = Math.ceil((scrollTop + viewportHeight) / options.itemHeight);

            // Add overscan for smoother scrolling
            const renderedStart = Math.max(0, visibleStart - options.overscan);
            const renderedEnd = Math.min(items.length, visibleEnd + options.overscan);

            // Update state
            instance.state = {
                scrollTop,
                visibleStart,
                visibleEnd,
                renderedStart,
                renderedEnd
            };

            // Render visible items
            this.renderVisibleItems(instance);
        },

        /**
         * Render only visible items
         */
        renderVisibleItems(instance) {
            const { content, items, renderItem, options, state } = instance;
            const { renderedStart, renderedEnd } = state;

            // Clear existing items
            content.innerHTML = '';

            // Create document fragment for better performance
            const fragment = document.createDocumentFragment();

            // Render each visible item
            for (let i = renderedStart; i < renderedEnd; i++) {
                const item = items[i];
                if (!item) continue;

                const itemElement = document.createElement('div');
                itemElement.className = 'virtual-scroll-item';
                itemElement.style.cssText = `
                    position: absolute;
                    top: ${i * options.itemHeight}px;
                    left: 0;
                    right: 0;
                    height: ${options.itemHeight}px;
                    will-change: transform;
                `;

                // Render item content
                const itemContent = renderItem(item, i);
                if (typeof itemContent === 'string') {
                    itemElement.innerHTML = itemContent;
                } else {
                    itemElement.appendChild(itemContent);
                }

                fragment.appendChild(itemElement);
            }

            content.appendChild(fragment);
        },

        /**
         * Update items
         */
        updateItems(containerId, newItems) {
            const instance = this.instances.get(containerId);
            if (!instance) return;

            instance.items = newItems;
            instance.content.style.height = `${newItems.length * instance.options.itemHeight}px`;

            this.handleScroll(instance);
        },

        /**
         * Scroll to index
         */
        scrollToIndex(containerId, index, behavior = 'smooth') {
            const instance = this.instances.get(containerId);
            if (!instance) return;

            const scrollTop = index * instance.options.itemHeight;
            instance.viewport.scrollTo({
                top: scrollTop,
                behavior
            });
        },

        /**
         * Scroll to top
         */
        scrollToTop(containerId, behavior = 'smooth') {
            this.scrollToIndex(containerId, 0, behavior);
        },

        /**
         * Destroy instance
         */
        destroy(containerId) {
            const instance = this.instances.get(containerId);
            if (!instance) return;

            instance.container.innerHTML = '';
            this.instances.delete(containerId);
        },

        /**
         * Get current scroll position
         */
        getScrollPosition(containerId) {
            const instance = this.instances.get(containerId);
            return instance ? instance.state.scrollTop : 0;
        },

        /**
         * Get visible items
         */
        getVisibleItems(containerId) {
            const instance = this.instances.get(containerId);
            if (!instance) return [];

            const { items, state } = instance;
            return items.slice(state.visibleStart, state.visibleEnd);
        }
    };

    // Export globally
    window.VirtualScroll = window.ClaudiaVirtualScroll;

    console.log('📜 Virtual Scrolling v6.7.1 loaded');

})();

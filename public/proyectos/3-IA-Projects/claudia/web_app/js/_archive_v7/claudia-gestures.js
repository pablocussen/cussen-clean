/**
 * CLAUDIA Mobile Gestures v6.7.1
 * Advanced touch gestures for mobile UX
 * Swipe, pinch, long-press, and more
 */

(function() {
    'use strict';

    window.ClaudiaGestures = {

        handlers: new Map(),
        activeGestures: new Map(),

        /**
         * Initialize gesture system
         */
        init() {
            console.log('👆 Mobile Gestures v6.7.1 initialized');

            // Setup global gesture handlers
            this.setupSwipeToRefresh();
            this.setupPullToRefresh();
            this.setupSwipeNavigation();
        },

        /**
         * Register swipe gesture
         * @param {HTMLElement|string} element - Element or selector
         * @param {Function} onSwipe - Callback(direction, distance)
         * @param {Object} options - Configuration
         */
        onSwipe(element, onSwipe, options = {}) {
            const el = typeof element === 'string' ? document.querySelector(element) : element;
            if (!el) return;

            const config = {
                threshold: options.threshold || 50,
                timeout: options.timeout || 500,
                directions: options.directions || ['left', 'right', 'up', 'down'],
                preventDefault: options.preventDefault !== false,
                ...options
            };

            let startX, startY, startTime;

            const handleTouchStart = (e) => {
                if (config.preventDefault) e.preventDefault();

                const touch = e.touches[0];
                startX = touch.clientX;
                startY = touch.clientY;
                startTime = Date.now();
            };

            const handleTouchEnd = (e) => {
                if (!startX || !startY) return;

                const touch = e.changedTouches[0];
                const endX = touch.clientX;
                const endY = touch.clientY;
                const endTime = Date.now();

                const deltaX = endX - startX;
                const deltaY = endY - startY;
                const duration = endTime - startTime;

                // Check if swipe is fast enough
                if (duration > config.timeout) {
                    startX = startY = null;
                    return;
                }

                // Determine direction
                let direction = null;
                let distance = 0;

                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    // Horizontal swipe
                    if (Math.abs(deltaX) > config.threshold) {
                        direction = deltaX > 0 ? 'right' : 'left';
                        distance = Math.abs(deltaX);
                    }
                } else {
                    // Vertical swipe
                    if (Math.abs(deltaY) > config.threshold) {
                        direction = deltaY > 0 ? 'down' : 'up';
                        distance = Math.abs(deltaY);
                    }
                }

                // Call callback if direction matches
                if (direction && config.directions.includes(direction)) {
                    onSwipe(direction, distance, { deltaX, deltaY, duration });
                }

                startX = startY = null;
            };

            el.addEventListener('touchstart', handleTouchStart, { passive: !config.preventDefault });
            el.addEventListener('touchend', handleTouchEnd, { passive: !config.preventDefault });

            // Store handlers for cleanup
            const id = `swipe_${Date.now()}_${Math.random()}`;
            this.handlers.set(id, { el, handlers: [handleTouchStart, handleTouchEnd] });

            return id;
        },

        /**
         * Register long press gesture
         * @param {HTMLElement|string} element - Element or selector
         * @param {Function} onLongPress - Callback
         * @param {Object} options - Configuration
         */
        onLongPress(element, onLongPress, options = {}) {
            const el = typeof element === 'string' ? document.querySelector(element) : element;
            if (!el) return;

            const config = {
                duration: options.duration || 500,
                threshold: options.threshold || 10,
                ...options
            };

            let timer, startX, startY;

            const handleTouchStart = (e) => {
                const touch = e.touches[0];
                startX = touch.clientX;
                startY = touch.clientY;

                timer = setTimeout(() => {
                    onLongPress(e);

                    // Add haptic feedback if available
                    if (navigator.vibrate) {
                        navigator.vibrate(50);
                    }
                }, config.duration);
            };

            const handleTouchMove = (e) => {
                const touch = e.touches[0];
                const deltaX = Math.abs(touch.clientX - startX);
                const deltaY = Math.abs(touch.clientY - startY);

                // Cancel if moved too much
                if (deltaX > config.threshold || deltaY > config.threshold) {
                    clearTimeout(timer);
                }
            };

            const handleTouchEnd = () => {
                clearTimeout(timer);
            };

            el.addEventListener('touchstart', handleTouchStart, { passive: true });
            el.addEventListener('touchmove', handleTouchMove, { passive: true });
            el.addEventListener('touchend', handleTouchEnd, { passive: true });

            const id = `longpress_${Date.now()}_${Math.random()}`;
            this.handlers.set(id, {
                el,
                handlers: [handleTouchStart, handleTouchMove, handleTouchEnd]
            });

            return id;
        },

        /**
         * Register pinch zoom gesture
         * @param {HTMLElement|string} element - Element or selector
         * @param {Function} onPinch - Callback(scale, center)
         */
        onPinch(element, onPinch, options = {}) {
            const el = typeof element === 'string' ? document.querySelector(element) : element;
            if (!el) return;

            let initialDistance = 0;
            let initialScale = 1;

            const getDistance = (touches) => {
                const dx = touches[0].clientX - touches[1].clientX;
                const dy = touches[0].clientY - touches[1].clientY;
                return Math.sqrt(dx * dx + dy * dy);
            };

            const getCenter = (touches) => {
                return {
                    x: (touches[0].clientX + touches[1].clientX) / 2,
                    y: (touches[0].clientY + touches[1].clientY) / 2
                };
            };

            const handleTouchStart = (e) => {
                if (e.touches.length === 2) {
                    initialDistance = getDistance(e.touches);
                }
            };

            const handleTouchMove = (e) => {
                if (e.touches.length === 2 && initialDistance > 0) {
                    e.preventDefault();

                    const currentDistance = getDistance(e.touches);
                    const scale = currentDistance / initialDistance;
                    const center = getCenter(e.touches);

                    onPinch(scale, center);
                }
            };

            const handleTouchEnd = () => {
                initialDistance = 0;
            };

            el.addEventListener('touchstart', handleTouchStart, { passive: true });
            el.addEventListener('touchmove', handleTouchMove, { passive: false });
            el.addEventListener('touchend', handleTouchEnd, { passive: true });

            const id = `pinch_${Date.now()}_${Math.random()}`;
            this.handlers.set(id, {
                el,
                handlers: [handleTouchStart, handleTouchMove, handleTouchEnd]
            });

            return id;
        },

        /**
         * Setup swipe to refresh
         */
        setupSwipeToRefresh() {
            // Swipe down on project card to refresh
            const projectCard = document.getElementById('project-card');
            if (projectCard) {
                this.onSwipe(projectCard, (direction) => {
                    if (direction === 'down') {
                        if (window.loadCurrentProject) {
                            ClaudiaUtils.showNotification('Actualizando proyecto...', 'info');
                            window.loadCurrentProject();

                            // Haptic feedback
                            if (navigator.vibrate) {
                                navigator.vibrate([50, 100, 50]);
                            }
                        }
                    }
                }, {
                    directions: ['down'],
                    threshold: 100
                });
            }
        },

        /**
         * Setup pull to refresh
         */
        setupPullToRefresh() {
            let pullDistance = 0;
            let pulling = false;
            let refreshIndicator = null;

            const createIndicator = () => {
                if (refreshIndicator) return;

                refreshIndicator = document.createElement('div');
                refreshIndicator.style.cssText = `
                    position: fixed;
                    top: -60px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: white;
                    padding: 15px 30px;
                    border-radius: 30px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    font-size: 24px;
                    transition: top 0.3s ease-out;
                    z-index: 9999;
                `;
                refreshIndicator.innerHTML = '⬇️ Suelta para actualizar';
                document.body.appendChild(refreshIndicator);
            };

            const showIndicator = (distance) => {
                if (!refreshIndicator) createIndicator();

                const maxDistance = 120;
                const progress = Math.min(distance / maxDistance, 1);
                refreshIndicator.style.top = `${-60 + (progress * 80)}px`;
                refreshIndicator.style.opacity = progress;

                if (progress >= 1) {
                    refreshIndicator.innerHTML = '🔄 Suelta para actualizar';
                } else {
                    refreshIndicator.innerHTML = '⬇️ Suelta para actualizar';
                }
            };

            const hideIndicator = () => {
                if (refreshIndicator) {
                    refreshIndicator.style.top = '-60px';
                    setTimeout(() => {
                        if (refreshIndicator) {
                            refreshIndicator.remove();
                            refreshIndicator = null;
                        }
                    }, 300);
                }
            };

            const refresh = async () => {
                if (!refreshIndicator) return;

                refreshIndicator.innerHTML = '⏳ Actualizando...';

                // Refresh data
                if (window.loadCurrentProject) {
                    await window.loadCurrentProject();
                }

                // Haptic feedback
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }

                setTimeout(() => {
                    if (refreshIndicator) {
                        refreshIndicator.innerHTML = '✅ Actualizado';
                    }
                    setTimeout(hideIndicator, 500);
                }, 500);
            };

            document.addEventListener('touchstart', (e) => {
                if (window.scrollY === 0) {
                    pulling = true;
                    pullDistance = 0;
                }
            }, { passive: true });

            document.addEventListener('touchmove', (e) => {
                if (!pulling || window.scrollY > 0) {
                    pulling = false;
                    hideIndicator();
                    return;
                }

                const touch = e.touches[0];
                const startY = touch.clientY;

                pullDistance = Math.max(0, startY - 60);
                showIndicator(pullDistance);
            }, { passive: true });

            document.addEventListener('touchend', () => {
                if (pulling && pullDistance > 120) {
                    refresh();
                } else {
                    hideIndicator();
                }
                pulling = false;
                pullDistance = 0;
            }, { passive: true });
        },

        /**
         * Setup swipe navigation
         */
        setupSwipeNavigation() {
            // Swipe left/right to navigate between sections
            this.onSwipe(document.body, (direction) => {
                if (direction === 'right') {
                    // Navigate back or show menu
                    if (window.history.length > 1) {
                        window.history.back();
                    }
                }
            }, {
                directions: ['right'],
                threshold: 100
            });
        },

        /**
         * Remove gesture handler
         * @param {string} id - Handler ID
         */
        remove(id) {
            const handler = this.handlers.get(id);
            if (!handler) return;

            const { el, handlers } = handler;
            handlers.forEach(h => {
                el.removeEventListener('touchstart', h);
                el.removeEventListener('touchmove', h);
                el.removeEventListener('touchend', h);
            });

            this.handlers.delete(id);
        },

        /**
         * Remove all gesture handlers
         */
        removeAll() {
            this.handlers.forEach((_, id) => this.remove(id));
        }
    };

    // Auto-initialize on mobile
    if ('ontouchstart' in window) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => ClaudiaGestures.init());
        } else {
            ClaudiaGestures.init();
        }
    }

})();

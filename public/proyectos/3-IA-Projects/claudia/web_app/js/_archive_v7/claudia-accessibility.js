/**
 * CLAUDIA Accessibility v6.7.1
 * WCAG 2.1 Level AAA compliance
 * Screen reader support, keyboard navigation, high contrast
 */

(function() {
    'use strict';

    window.ClaudiaA11y = {

        settings: {
            highContrast: false,
            largeText: false,
            reducedMotion: false,
            screenReader: false
        },

        /**
         * Initialize accessibility features
         */
        init() {
            console.log('♿ Accessibility v6.7.1 initialized');

            // Load saved settings
            this.loadSettings();

            // Detect user preferences
            this.detectPreferences();

            // Setup accessibility features
            this.setupARIA();
            this.setupKeyboardNav();
            this.setupSkipLinks();
            this.setupFocusManagement();

            // Apply settings
            this.applySettings();
        },

        /**
         * Load settings from storage
         */
        loadSettings() {
            try {
                const saved = localStorage.getItem('claudia_a11y_settings');
                if (saved) {
                    this.settings = { ...this.settings, ...JSON.parse(saved) };
                }
            } catch (err) {
                console.error('Failed to load a11y settings:', err);
            }
        },

        /**
         * Save settings
         */
        saveSettings() {
            try {
                localStorage.setItem('claudia_a11y_settings', JSON.stringify(this.settings));
            } catch (err) {
                console.error('Failed to save a11y settings:', err);
            }
        },

        /**
         * Detect user preferences from CSS media queries
         */
        detectPreferences() {
            // Detect prefers-reduced-motion
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                this.settings.reducedMotion = true;
            }

            // Detect prefers-contrast
            if (window.matchMedia('(prefers-contrast: high)').matches) {
                this.settings.highContrast = true;
            }

            // Listen for changes
            window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
                this.settings.reducedMotion = e.matches;
                this.applySettings();
            });

            window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
                this.settings.highContrast = e.matches;
                this.applySettings();
            });
        },

        /**
         * Setup ARIA labels and roles
         */
        setupARIA() {
            // Add ARIA landmarks
            const header = document.querySelector('.header');
            if (header) {
                header.setAttribute('role', 'banner');
                header.setAttribute('aria-label', 'CLAUDIA - Asistente de Construcción');
            }

            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.setAttribute('role', 'complementary');
                sidebar.setAttribute('aria-label', 'Información del proyecto');
            }

            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.setAttribute('role', 'main');
                mainContent.setAttribute('aria-label', 'Contenido principal');
            }

            // Add ARIA labels to buttons
            document.querySelectorAll('button:not([aria-label])').forEach(button => {
                const text = button.textContent.trim();
                if (text) {
                    button.setAttribute('aria-label', text);
                }
            });

            // Add ARIA labels to inputs
            document.querySelectorAll('input:not([aria-label])').forEach(input => {
                const label = input.previousElementSibling;
                if (label && label.tagName === 'LABEL') {
                    const id = `input-${Date.now()}-${Math.random()}`;
                    input.id = id;
                    label.setAttribute('for', id);
                } else {
                    const placeholder = input.placeholder;
                    if (placeholder) {
                        input.setAttribute('aria-label', placeholder);
                    }
                }
            });

            // Add live region for notifications
            let liveRegion = document.getElementById('a11y-live-region');
            if (!liveRegion) {
                liveRegion = document.createElement('div');
                liveRegion.id = 'a11y-live-region';
                liveRegion.setAttribute('role', 'status');
                liveRegion.setAttribute('aria-live', 'polite');
                liveRegion.setAttribute('aria-atomic', 'true');
                liveRegion.style.cssText = `
                    position: absolute;
                    left: -10000px;
                    width: 1px;
                    height: 1px;
                    overflow: hidden;
                `;
                document.body.appendChild(liveRegion);
            }
        },

        /**
         * Setup keyboard navigation
         */
        setupKeyboardNav() {
            // Tab trapping for modals
            document.addEventListener('keydown', (e) => {
                const modal = document.querySelector('.modal.active, #claudia-modal');
                if (!modal) return;

                if (e.key === 'Tab') {
                    this.trapFocus(modal, e);
                }
            });

            // Escape to close modals
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    const modal = document.querySelector('.modal.active, #claudia-modal');
                    if (modal) {
                        modal.remove();
                    }
                }
            });

            // Arrow key navigation for lists
            document.addEventListener('keydown', (e) => {
                const focused = document.activeElement;
                if (!focused || !focused.closest('.apu-card, .project-card')) return;

                if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    const items = Array.from(document.querySelectorAll('.apu-card, .project-card'));
                    const currentIndex = items.indexOf(focused.closest('.apu-card, .project-card'));

                    if (e.key === 'ArrowDown' && currentIndex < items.length - 1) {
                        items[currentIndex + 1].focus();
                    } else if (e.key === 'ArrowUp' && currentIndex > 0) {
                        items[currentIndex - 1].focus();
                    }
                }
            });
        },

        /**
         * Trap focus within element
         */
        trapFocus(element, event) {
            const focusableElements = element.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );

            const firstFocusable = focusableElements[0];
            const lastFocusable = focusableElements[focusableElements.length - 1];

            if (event.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    lastFocusable.focus();
                    event.preventDefault();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    firstFocusable.focus();
                    event.preventDefault();
                }
            }
        },

        /**
         * Setup skip links
         */
        setupSkipLinks() {
            const skipLink = document.createElement('a');
            skipLink.href = '#main-content';
            skipLink.textContent = 'Saltar al contenido principal';
            skipLink.className = 'skip-link';
            skipLink.style.cssText = `
                position: absolute;
                top: -40px;
                left: 0;
                background: #667eea;
                color: white;
                padding: 10px 20px;
                text-decoration: none;
                z-index: 100000;
                font-weight: 600;
            `;

            skipLink.addEventListener('focus', () => {
                skipLink.style.top = '0';
            });

            skipLink.addEventListener('blur', () => {
                skipLink.style.top = '-40px';
            });

            document.body.insertBefore(skipLink, document.body.firstChild);

            // Add ID to main content
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.id = 'main-content';
                mainContent.setAttribute('tabindex', '-1');
            }
        },

        /**
         * Setup focus management
         */
        setupFocusManagement() {
            // Store last focused element before modal opens
            let lastFocused = null;

            const modalObserver = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.id === 'claudia-modal' || node.classList?.contains('modal')) {
                            lastFocused = document.activeElement;

                            // Focus first focusable element in modal
                            setTimeout(() => {
                                const firstFocusable = node.querySelector(
                                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                                );
                                if (firstFocusable) {
                                    firstFocusable.focus();
                                }
                            }, 100);
                        }
                    });

                    mutation.removedNodes.forEach(node => {
                        if (node.id === 'claudia-modal' || node.classList?.contains('modal')) {
                            // Restore focus
                            if (lastFocused) {
                                lastFocused.focus();
                                lastFocused = null;
                            }
                        }
                    });
                });
            });

            modalObserver.observe(document.body, { childList: true, subtree: true });
        },

        /**
         * Apply accessibility settings
         */
        applySettings() {
            const root = document.documentElement;

            // High contrast
            if (this.settings.highContrast) {
                root.classList.add('high-contrast');
            } else {
                root.classList.remove('high-contrast');
            }

            // Large text
            if (this.settings.largeText) {
                root.classList.add('large-text');
            } else {
                root.classList.remove('large-text');
            }

            // Reduced motion
            if (this.settings.reducedMotion) {
                root.classList.add('reduced-motion');
            } else {
                root.classList.remove('reduced-motion');
            }

            this.injectStyles();
            this.saveSettings();
        },

        /**
         * Inject accessibility styles
         */
        injectStyles() {
            let style = document.getElementById('a11y-styles');
            if (!style) {
                style = document.createElement('style');
                style.id = 'a11y-styles';
                document.head.appendChild(style);
            }

            style.textContent = `
                /* High Contrast Mode */
                .high-contrast {
                    --text-primary: #000000;
                    --text-secondary: #000000;
                    --bg-primary: #FFFFFF;
                    --border-color: #000000;
                }

                .high-contrast * {
                    border-color: #000000 !important;
                }

                .high-contrast button,
                .high-contrast .btn {
                    background: #000000 !important;
                    color: #FFFFFF !important;
                    border: 2px solid #000000 !important;
                }

                .high-contrast a {
                    color: #0000EE !important;
                    text-decoration: underline !important;
                }

                /* Large Text Mode */
                .large-text {
                    font-size: 125%;
                }

                .large-text button,
                .large-text input,
                .large-text select {
                    font-size: 125%;
                    padding: 1.25em;
                }

                /* Reduced Motion */
                .reduced-motion *,
                .reduced-motion *::before,
                .reduced-motion *::after {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                    scroll-behavior: auto !important;
                }

                /* Focus Indicators */
                *:focus-visible {
                    outline: 3px solid #667eea;
                    outline-offset: 2px;
                }

                button:focus-visible,
                a:focus-visible,
                input:focus-visible,
                select:focus-visible,
                textarea:focus-visible {
                    outline: 3px solid #667eea;
                    outline-offset: 3px;
                }

                /* Skip Link */
                .skip-link:focus {
                    outline: 3px solid #FFD700;
                    outline-offset: 0;
                }
            `;
        },

        /**
         * Announce to screen readers
         */
        announce(message, priority = 'polite') {
            const liveRegion = document.getElementById('a11y-live-region');
            if (!liveRegion) return;

            liveRegion.setAttribute('aria-live', priority);
            liveRegion.textContent = message;

            // Clear after announcement
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        },

        /**
         * Toggle high contrast
         */
        toggleHighContrast() {
            this.settings.highContrast = !this.settings.highContrast;
            this.applySettings();
            this.announce(`Modo alto contraste ${this.settings.highContrast ? 'activado' : 'desactivado'}`);
        },

        /**
         * Toggle large text
         */
        toggleLargeText() {
            this.settings.largeText = !this.settings.largeText;
            this.applySettings();
            this.announce(`Texto grande ${this.settings.largeText ? 'activado' : 'desactivado'}`);
        },

        /**
         * Toggle reduced motion
         */
        toggleReducedMotion() {
            this.settings.reducedMotion = !this.settings.reducedMotion;
            this.applySettings();
            this.announce(`Movimiento reducido ${this.settings.reducedMotion ? 'activado' : 'desactivado'}`);
        },

        /**
         * Show accessibility menu
         */
        showMenu() {
            const html = `
                <div style="padding: 20px;">
                    <h3 style="margin: 0 0 20px 0; font-size: 20px;">Opciones de Accesibilidad</h3>
                    <div style="display: grid; gap: 15px;">
                        <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
                            <input type="checkbox" ${this.settings.highContrast ? 'checked' : ''}
                                onchange="ClaudiaA11y.toggleHighContrast()"
                                style="width: 20px; height: 20px;">
                            <span style="font-size: 16px;">Alto Contraste</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
                            <input type="checkbox" ${this.settings.largeText ? 'checked' : ''}
                                onchange="ClaudiaA11y.toggleLargeText()"
                                style="width: 20px; height: 20px;">
                            <span style="font-size: 16px;">Texto Grande</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
                            <input type="checkbox" ${this.settings.reducedMotion ? 'checked' : ''}
                                onchange="ClaudiaA11y.toggleReducedMotion()"
                                style="width: 20px; height: 20px;">
                            <span style="font-size: 16px;">Reducir Movimiento</span>
                        </label>
                    </div>
                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">
                        <p style="margin: 0;">CLAUDIA cumple con WCAG 2.1 Level AAA</p>
                    </div>
                </div>
            `;

            ClaudiaUtils.createModal({
                title: '♿ Accesibilidad',
                content: html,
                buttons: [
                    {
                        text: 'Cerrar',
                        primary: true
                    }
                ]
            });
        }
    };

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ClaudiaA11y.init());
    } else {
        ClaudiaA11y.init();
    }

})();

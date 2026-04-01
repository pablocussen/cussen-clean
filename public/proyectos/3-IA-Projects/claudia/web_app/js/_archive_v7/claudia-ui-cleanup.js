/**
 * CLAUDIA UI Cleanup & Organization v5.9.1
 *
 * Limpia y organiza la interfaz para evitar abrumar al usuario
 * - Centraliza todos los botones flotantes en un menú
 * - Mejora el onboarding tutorial
 * - Simplifica la navegación
 */

(function() {
    'use strict';

    class UIManager {
        constructor() {
            this.menuOpen = false;
            this.init();
        }

        init() {
            console.log('🎨 UI Manager inicializado');

            // Wait for DOM
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.cleanup();
                    this.createMainMenu();
                });
            } else {
                this.cleanup();
                this.createMainMenu();
            }
        }

        cleanup() {
            // Remove individual floating buttons created by other modules
            // They will be integrated into the main menu instead

            // Don't remove immediately, wait a bit for other modules to load
            setTimeout(() => {
                this.organizeFloatingButtons();
            }, 1500);
        }

        organizeFloatingButtons() {
            // Find all floating buttons and hide them
            const floatingButtons = [
                '.theme-toggle-button',
                '.calendar-btn',
                '.photo-btn',
                '.notification-btn',
                '#help-tutorial-btn'
            ];

            floatingButtons.forEach(selector => {
                const btn = document.querySelector(selector);
                if (btn && btn.parentNode) {
                    // Don't delete, just hide - functionality still works
                    btn.style.display = 'none';
                }
            });

            console.log('🧹 UI cleanup: botones flotantes organizados');
        }

        createMainMenu() {
            // Create main menu button (hamburger)
            const menuBtn = document.createElement('button');
            menuBtn.id = 'main-menu-btn';
            menuBtn.className = 'main-menu-btn';
            menuBtn.innerHTML = '☰';
            menuBtn.title = 'Menú';
            menuBtn.onclick = () => this.toggleMenu();

            // Create menu panel
            const menuPanel = document.createElement('div');
            menuPanel.id = 'main-menu-panel';
            menuPanel.className = 'main-menu-panel';
            menuPanel.innerHTML = this.getMenuHTML();

            // Add styles
            this.addStyles();

            // Add to DOM
            document.body.appendChild(menuBtn);
            document.body.appendChild(menuPanel);

            // Setup menu item clicks
            this.setupMenuItems();

            console.log('🎨 Menú principal creado');
        }

        getMenuHTML() {
            return `
                <div class="main-menu-content">
                    <div class="main-menu-header">
                        <h3>Menú</h3>
                        <button class="menu-close-btn" onclick="window.uiManager.closeMenu()">×</button>
                    </div>

                    <div class="main-menu-items">
                        <!-- Essential -->
                        <div class="menu-section">
                            <div class="menu-section-title">Principal</div>
                            <button class="menu-item" data-action="tutorial">
                                <span class="menu-icon">🎓</span>
                                <span class="menu-label">Tutorial</span>
                            </button>
                            <button class="menu-item" data-action="quick-actions">
                                <span class="menu-icon">⚡</span>
                                <span class="menu-label">Acciones Rápidas</span>
                            </button>
                        </div>

                        <!-- Features -->
                        <div class="menu-section">
                            <div class="menu-section-title">Herramientas</div>
                            <button class="menu-item" data-action="calendar">
                                <span class="menu-icon">📅</span>
                                <span class="menu-label">Cronograma</span>
                            </button>
                            <button class="menu-item" data-action="photos">
                                <span class="menu-icon">📸</span>
                                <span class="menu-label">Fotos</span>
                            </button>
                            <button class="menu-item" data-action="notifications">
                                <span class="menu-icon">🔔</span>
                                <span class="menu-label">Notificaciones</span>
                            </button>
                        </div>

                        <!-- Settings -->
                        <div class="menu-section">
                            <div class="menu-section-title">Configuración</div>
                            <button class="menu-item" data-action="theme">
                                <span class="menu-icon">🌓</span>
                                <span class="menu-label">Tema</span>
                            </button>
                        </div>

                        <!-- Info -->
                        <div class="menu-section">
                            <div class="menu-section-title">Información</div>
                            <div class="menu-info">
                                <div class="info-item">
                                    <strong>Versión:</strong> 5.9.1
                                </div>
                                <div class="info-item">
                                    <strong>Atajos:</strong>
                                </div>
                                <div class="info-shortcuts">
                                    <kbd>Ctrl+Shift+D</kbd> Dark Mode<br>
                                    <kbd>Ctrl+Shift+C</kbd> Calendario<br>
                                    <kbd>Ctrl+Shift+P</kbd> Fotos<br>
                                    <kbd>Ctrl+Shift+N</kbd> Notificaciones
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        setupMenuItems() {
            const items = document.querySelectorAll('.menu-item[data-action]');

            items.forEach(item => {
                item.onclick = () => {
                    const action = item.getAttribute('data-action');
                    this.handleMenuAction(action);
                    this.closeMenu();
                };
            });
        }

        handleMenuAction(action) {
            // Haptic feedback
            if (window.mobileOptimizer) {
                window.mobileOptimizer.hapticFeedback('light');
            }

            switch(action) {
                case 'tutorial':
                    if (window.showOnboardingTutorial) {
                        window.showOnboardingTutorial();
                    }
                    break;

                case 'quick-actions':
                    const fab = document.getElementById('quick-actions-fab');
                    if (fab) fab.click();
                    break;

                case 'calendar':
                    if (window.calendarManager) {
                        window.calendarManager.openCalendar();
                    }
                    break;

                case 'photos':
                    if (window.photoManager) {
                        window.photoManager.openPhotoGallery();
                    }
                    break;

                case 'notifications':
                    if (window.notificationManager) {
                        window.notificationManager.openNotificationCenter();
                    }
                    break;

                case 'theme':
                    if (window.themeManager) {
                        window.themeManager.toggleTheme();
                    }
                    break;
            }
        }

        toggleMenu() {
            if (this.menuOpen) {
                this.closeMenu();
            } else {
                this.openMenu();
            }
        }

        openMenu() {
            const panel = document.getElementById('main-menu-panel');
            if (panel) {
                panel.classList.add('open');
                this.menuOpen = true;

                if (window.mobileOptimizer) {
                    window.mobileOptimizer.hapticFeedback('light');
                }
            }
        }

        closeMenu() {
            const panel = document.getElementById('main-menu-panel');
            if (panel) {
                panel.classList.remove('open');
                this.menuOpen = false;
            }
        }

        addStyles() {
            const styles = document.createElement('style');
            styles.innerHTML = `
                /* Main Menu Button */
                .main-menu-btn {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                    border: none;
                    font-size: 24px;
                    font-weight: bold;
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                    cursor: pointer;
                    z-index: 9999;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .main-menu-btn:hover {
                    transform: scale(1.1);
                    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
                }

                /* Menu Panel */
                .main-menu-panel {
                    position: fixed;
                    top: 0;
                    right: -350px;
                    width: 350px;
                    height: 100vh;
                    background: var(--card-bg, white);
                    box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
                    z-index: 10000;
                    transition: right 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                    overflow-y: auto;
                }

                .main-menu-panel.open {
                    right: 0;
                }

                .main-menu-content {
                    padding: 20px;
                }

                .main-menu-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid var(--border-color, #e0e0e0);
                }

                .main-menu-header h3 {
                    font-size: 24px;
                    color: var(--text-primary, #000);
                    margin: 0;
                }

                .menu-close-btn {
                    background: transparent;
                    border: none;
                    font-size: 32px;
                    color: var(--text-secondary, #666);
                    cursor: pointer;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.2s ease;
                }

                .menu-close-btn:hover {
                    background: rgba(0, 0, 0, 0.05);
                    transform: rotate(90deg);
                }

                /* Menu Sections */
                .menu-section {
                    margin-bottom: 25px;
                }

                .menu-section-title {
                    font-size: 12px;
                    font-weight: 700;
                    color: var(--text-secondary, #666);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-bottom: 10px;
                    padding-left: 12px;
                }

                /* Menu Items */
                .menu-item {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    padding: 14px 12px;
                    background: transparent;
                    border: none;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    margin-bottom: 6px;
                    text-align: left;
                }

                .menu-item:hover {
                    background: rgba(102, 126, 234, 0.1);
                    transform: translateX(4px);
                }

                .menu-item:active {
                    transform: translateX(4px) scale(0.98);
                }

                .menu-icon {
                    font-size: 22px;
                    width: 28px;
                    text-align: center;
                }

                .menu-label {
                    font-size: 15px;
                    font-weight: 600;
                    color: var(--text-primary, #000);
                }

                /* Menu Info */
                .menu-info {
                    padding: 12px;
                    background: rgba(102, 126, 234, 0.05);
                    border-radius: 12px;
                    font-size: 13px;
                }

                .info-item {
                    margin-bottom: 8px;
                    color: var(--text-secondary, #666);
                }

                .info-item strong {
                    color: var(--text-primary, #000);
                }

                .info-shortcuts {
                    margin-top: 10px;
                    padding-top: 10px;
                    border-top: 1px solid rgba(0, 0, 0, 0.1);
                    line-height: 1.8;
                    color: var(--text-secondary, #666);
                }

                .info-shortcuts kbd {
                    background: white;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 600;
                    border: 1px solid rgba(0, 0, 0, 0.1);
                    font-family: monospace;
                }

                /* Mobile Responsive */
                @media (max-width: 768px) {
                    .main-menu-panel {
                        width: 100%;
                        right: -100%;
                    }

                    .main-menu-panel.open {
                        right: 0;
                    }

                    .main-menu-btn {
                        top: 10px;
                        right: 10px;
                        width: 48px;
                        height: 48px;
                        font-size: 20px;
                    }
                }

                /* Overlay for menu */
                .main-menu-panel::before {
                    content: '';
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 350px;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.3s ease;
                }

                .main-menu-panel.open::before {
                    opacity: 1;
                    pointer-events: all;
                }

                @media (max-width: 768px) {
                    .main-menu-panel::before {
                        right: 100%;
                    }
                }
            `;
            document.head.appendChild(styles);
        }
    }

    // Initialize
    window.uiManager = new UIManager();

    console.log('✅ CLAUDIA UI Cleanup v5.9.1 loaded');

})();

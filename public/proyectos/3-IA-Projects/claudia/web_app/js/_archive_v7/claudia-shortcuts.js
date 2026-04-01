/**
 * CLAUDIA Keyboard Shortcuts v6.7
 * Power user features for fast navigation
 */

(function() {
    'use strict';

    window.ClaudiaShortcuts = {

        shortcuts: {},
        commandPaletteOpen: false,

        /**
         * Initialize shortcuts
         */
        init() {
            console.log('⌨️ Keyboard Shortcuts v6.7 initialized');

            this.registerShortcuts();
            this.setupListeners();
            this.createCommandPalette();
        },

        /**
         * Register all shortcuts
         */
        registerShortcuts() {
            this.shortcuts = {
                // Navigation
                'ctrl+k': {
                    name: 'Paleta de comandos',
                    action: () => this.toggleCommandPalette(),
                    category: 'Navegación'
                },
                'ctrl+/': {
                    name: 'Mostrar atajos',
                    action: () => this.showShortcutsHelp(),
                    category: 'Ayuda'
                },
                'ctrl+b': {
                    name: 'Buscar APU',
                    action: () => document.getElementById('apu-search')?.focus(),
                    category: 'Navegación'
                },
                'ctrl+n': {
                    name: 'Nuevo proyecto',
                    action: () => window.createNewProject?.('Nuevo Proyecto'),
                    category: 'Proyectos'
                },
                'ctrl+s': {
                    name: 'Guardar proyecto',
                    action: () => {
                        window.saveProject?.();
                        ClaudiaUtils.showNotification('Proyecto guardado', 'success');
                    },
                    category: 'Proyectos'
                },
                'ctrl+d': {
                    name: 'Dashboard',
                    action: () => window.showDashboard?.(),
                    category: 'Navegación'
                },
                'ctrl+e': {
                    name: 'Exportar PDF',
                    action: () => window.exportProjectPDF?.(),
                    category: 'Exportar'
                },
                'ctrl+p': {
                    name: 'Comparar precios',
                    action: () => window.openPriceComparison?.(),
                    category: 'Precios'
                },
                'ctrl+t': {
                    name: 'Tareas',
                    action: () => window.toggleTasks?.(),
                    category: 'Tareas'
                },
                'ctrl+f': {
                    name: 'Fotos',
                    action: () => window.openPhotoManager?.(),
                    category: 'Multimedia'
                },
                'ctrl+l': {
                    name: 'Calendario',
                    action: () => window.openCalendar?.(),
                    category: 'Planificación'
                },
                // Quick actions
                'alt+1': {
                    name: 'Vista Proyectos',
                    action: () => this.scrollToSection('project-card'),
                    category: 'Vistas'
                },
                'alt+2': {
                    name: 'Vista APUs',
                    action: () => this.scrollToSection('apu-navigator'),
                    category: 'Vistas'
                },
                'alt+3': {
                    name: 'Vista Sidebar',
                    action: () => this.scrollToSection('sidebar'),
                    category: 'Vistas'
                },
                // Escape
                'esc': {
                    name: 'Cerrar modales',
                    action: () => this.closeAllModals(),
                    category: 'Navegación'
                }
            };
        },

        /**
         * Setup keyboard listeners
         */
        setupListeners() {
            document.addEventListener('keydown', (e) => {
                // Build shortcut string
                let shortcut = '';
                if (e.ctrlKey) shortcut += 'ctrl+';
                if (e.altKey) shortcut += 'alt+';
                if (e.shiftKey) shortcut += 'shift+';
                shortcut += e.key.toLowerCase();

                // Check if shortcut is registered
                const action = this.shortcuts[shortcut];
                if (action) {
                    e.preventDefault();
                    action.action();
                }
            });
        },

        /**
         * Create command palette
         */
        createCommandPalette() {
            const palette = document.createElement('div');
            palette.id = 'command-palette';
            palette.style.cssText = `
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                z-index: 10000;
                backdrop-filter: blur(4px);
                animation: fadeIn 0.2s ease-out;
            `;

            palette.innerHTML = `
                <div style="max-width: 600px; margin: 100px auto; background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden;">
                    <div style="padding: 20px; border-bottom: 1px solid #e5e7eb;">
                        <input type="text" id="command-search" placeholder="Buscar comando o acción..." style="width: 100%; padding: 15px; border: none; font-size: 16px; outline: none;" />
                    </div>
                    <div id="command-results" style="max-height: 400px; overflow-y: auto;">
                        <!-- Commands will be populated here -->
                    </div>
                    <div style="padding: 15px; background: #f9fafb; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
                        <div style="font-size: 12px; color: #6b7280;">
                            <kbd style="background: white; padding: 4px 8px; border-radius: 4px; border: 1px solid #d1d5db;">↑</kbd>
                            <kbd style="background: white; padding: 4px 8px; border-radius: 4px; border: 1px solid #d1d5db;">↓</kbd>
                            navegar &nbsp;
                            <kbd style="background: white; padding: 4px 8px; border-radius: 4px; border: 1px solid #d1d5db;">Enter</kbd>
                            ejecutar &nbsp;
                            <kbd style="background: white; padding: 4px 8px; border-radius: 4px; border: 1px solid #d1d5db;">Esc</kbd>
                            cerrar
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(palette);

            // Setup palette listeners
            const searchInput = palette.querySelector('#command-search');
            searchInput.addEventListener('input', (e) => {
                this.filterCommands(e.target.value);
            });

            // Close on backdrop click
            palette.addEventListener('click', (e) => {
                if (e.target === palette) {
                    this.toggleCommandPalette();
                }
            });

            // Navigation with arrows
            let selectedIndex = 0;
            palette.addEventListener('keydown', (e) => {
                const results = palette.querySelectorAll('.command-item');

                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
                    this.highlightCommand(selectedIndex);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    selectedIndex = Math.max(selectedIndex - 1, 0);
                    this.highlightCommand(selectedIndex);
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    const selected = results[selectedIndex];
                    if (selected) {
                        selected.click();
                    }
                } else if (e.key === 'Escape') {
                    this.toggleCommandPalette();
                }
            });

            // Populate initial commands
            this.filterCommands('');
        },

        /**
         * Toggle command palette
         */
        toggleCommandPalette() {
            const palette = document.getElementById('command-palette');
            if (!palette) return;

            this.commandPaletteOpen = !this.commandPaletteOpen;

            if (this.commandPaletteOpen) {
                palette.style.display = 'block';
                setTimeout(() => {
                    document.getElementById('command-search')?.focus();
                }, 100);
            } else {
                palette.style.display = 'none';
            }
        },

        /**
         * Filter commands
         */
        filterCommands(query) {
            const results = document.getElementById('command-results');
            if (!results) return;

            const filtered = Object.entries(this.shortcuts)
                .filter(([shortcut, data]) => {
                    const searchText = `${data.name} ${data.category}`.toLowerCase();
                    return searchText.includes(query.toLowerCase());
                })
                .slice(0, 10);

            results.innerHTML = filtered.map(([shortcut, data], index) => `
                <div class="command-item" data-index="${index}" style="padding: 15px 20px; cursor: pointer; border-bottom: 1px solid #f3f4f6; transition: background 0.2s;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='white'" onclick="ClaudiaShortcuts.executeCommand('${shortcut}')">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${data.name}</div>
                            <div style="font-size: 12px; color: #6b7280;">${data.category}</div>
                        </div>
                        <div style="display: flex; gap: 6px;">
                            ${shortcut.split('+').map(key => `
                                <kbd style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 11px; text-transform: uppercase; border: 1px solid #e5e7eb;">${key}</kbd>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `).join('');

            // No results
            if (filtered.length === 0) {
                results.innerHTML = `
                    <div style="padding: 60px 20px; text-align: center; color: #9ca3af;">
                        <div style="font-size: 48px; margin-bottom: 10px;">🔍</div>
                        <div style="font-weight: 600; margin-bottom: 4px;">No se encontraron comandos</div>
                        <div style="font-size: 14px;">Intenta con otra búsqueda</div>
                    </div>
                `;
            }
        },

        /**
         * Execute command
         */
        executeCommand(shortcut) {
            const action = this.shortcuts[shortcut];
            if (action) {
                action.action();
                this.toggleCommandPalette();
            }
        },

        /**
         * Highlight command
         */
        highlightCommand(index) {
            const items = document.querySelectorAll('.command-item');
            items.forEach((item, i) => {
                if (i === index) {
                    item.style.background = '#f9fafb';
                    item.scrollIntoView({ block: 'nearest' });
                } else {
                    item.style.background = 'white';
                }
            });
        },

        /**
         * Show shortcuts help
         */
        showShortcutsHelp() {
            const categories = {};

            // Group shortcuts by category
            Object.entries(this.shortcuts).forEach(([shortcut, data]) => {
                if (!categories[data.category]) {
                    categories[data.category] = [];
                }
                categories[data.category].push({ shortcut, ...data });
            });

            let html = '<div style="display: grid; gap: 25px;">';

            Object.entries(categories).forEach(([category, shortcuts]) => {
                html += `
                    <div>
                        <h4 style="font-size: 14px; font-weight: 700; color: #667eea; margin-bottom: 12px;">${category}</h4>
                        <div style="display: grid; gap: 8px;">
                            ${shortcuts.map(s => `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                                    <span style="font-size: 14px;">${s.name}</span>
                                    <div style="display: flex; gap: 4px;">
                                        ${s.shortcut.split('+').map(key => `
                                            <kbd style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 11px; text-transform: uppercase; border: 1px solid #e5e7eb;">${key}</kbd>
                                        `).join('')}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            });

            html += '</div>';

            ClaudiaUtils.createModal({
                title: '⌨️ Atajos de Teclado',
                content: html,
                buttons: [
                    {
                        text: 'Cerrar',
                        primary: true
                    }
                ]
            });
        },

        /**
         * Scroll to section
         */
        scrollToSection(id) {
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        },

        /**
         * Close all modals
         */
        closeAllModals() {
            // Close command palette
            if (this.commandPaletteOpen) {
                this.toggleCommandPalette();
            }

            // Close all modals
            document.querySelectorAll('.modal.active, .modal-backdrop.active').forEach(modal => {
                modal.classList.remove('active');
            });

            // Close custom modals
            document.getElementById('claudia-modal')?.remove();
        }
    };

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ClaudiaShortcuts.init());
    } else {
        ClaudiaShortcuts.init();
    }

})();

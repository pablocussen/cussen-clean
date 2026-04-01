/**
 * CLAUDIA Theme Manager v5.4
 * Dark Mode & Theme Switching
 * Fácil de usar, poderoso y elegante
 */

'use strict';

// ============================================
// THEME MANAGER
// ============================================

class ThemeManager {
    constructor() {
        this.currentTheme = this.getStoredTheme() || 'auto';
        this.init();
    }

    init() {
        // Aplicar tema inicial
        this.applyTheme(this.currentTheme);

        // Escuchar cambios en preferencia del sistema
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (this.currentTheme === 'auto') {
                    this.applyTheme('auto');
                }
            });
        }

        // Agregar toggle a la UI
        this.addToggleButton();

        console.log('🌓 Theme Manager initialized:', this.currentTheme);
    }

    getStoredTheme() {
        return localStorage.getItem('claudia_theme');
    }

    setStoredTheme(theme) {
        localStorage.setItem('claudia_theme', theme);
    }

    getEffectiveTheme() {
        if (this.currentTheme === 'auto') {
            // Detectar preferencia del sistema
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return 'dark';
            }
            return 'light';
        }
        return this.currentTheme;
    }

    applyTheme(theme) {
        this.currentTheme = theme;
        const effectiveTheme = this.getEffectiveTheme();

        // Aplicar al HTML
        document.documentElement.setAttribute('data-theme', effectiveTheme);

        // Actualizar meta theme-color para móviles
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content',
                effectiveTheme === 'dark' ? '#1f2937' : '#667eea'
            );
        }

        // Guardar preferencia
        this.setStoredTheme(theme);

        // Actualizar toggle button si existe
        this.updateToggleButton();

        // Notificar cambio
        this.notifyThemeChange(effectiveTheme);
    }

    toggleTheme() {
        // Ciclo: light → dark → auto → light
        const themes = ['light', 'dark', 'auto'];
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextTheme = themes[(currentIndex + 1) % themes.length];

        this.applyTheme(nextTheme);

        // Mostrar notificación
        this.showThemeNotification(nextTheme);
    }

    showThemeNotification(theme) {
        const messages = {
            'light': '☀️ Modo claro activado',
            'dark': '🌙 Modo oscuro activado',
            'auto': '🌓 Modo automático (según sistema)'
        };

        if (window.showNotification) {
            showNotification(messages[theme], 'info', 2000);
        }
    }

    notifyThemeChange(effectiveTheme) {
        // Dispatch custom event para que otros módulos puedan reaccionar
        window.dispatchEvent(new CustomEvent('themechange', {
            detail: {
                theme: this.currentTheme,
                effectiveTheme: effectiveTheme
            }
        }));
    }

    addToggleButton() {
        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.addToggleButton());
            return;
        }

        // Verificar si ya existe
        if (document.getElementById('theme-toggle')) return;

        // Crear botón flotante de tema
        const button = document.createElement('button');
        button.id = 'theme-toggle';
        button.className = 'theme-toggle-btn';
        button.setAttribute('aria-label', 'Cambiar tema');
        button.setAttribute('title', 'Cambiar tema (claro/oscuro/auto)');
        button.onclick = () => this.toggleTheme();

        // Agregar al body
        document.body.appendChild(button);

        // Actualizar icono
        this.updateToggleButton();
    }

    updateToggleButton() {
        const button = document.getElementById('theme-toggle');
        if (!button) return;

        const effectiveTheme = this.getEffectiveTheme();
        const icons = {
            'light': '☀️',
            'dark': '🌙',
            'auto': '🌓'
        };

        // Mostrar icono del tema actual
        button.innerHTML = `
            <span class="theme-icon">${icons[this.currentTheme]}</span>
            <span class="theme-label">${this.currentTheme === 'auto' ? 'Auto' : effectiveTheme === 'dark' ? 'Oscuro' : 'Claro'}</span>
        `;

        // Actualizar tooltip
        button.setAttribute('title',
            `Tema: ${this.currentTheme} (Click para cambiar)`
        );
    }
}

// ============================================
// ESTILOS DEL TOGGLE
// ============================================

const themeStyles = document.createElement('style');
themeStyles.textContent = `
    /* Theme Toggle Button */
    .theme-toggle-btn {
        position: fixed;
        bottom: 20px;
        left: 20px;
        width: 56px;
        height: 56px;
        border-radius: 28px;
        border: none;
        background: var(--theme-toggle-bg, linear-gradient(135deg, #667eea 0%, #764ba2 100%));
        color: white;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        transition: all 0.3s ease;
        font-family: system-ui, -apple-system, sans-serif;
    }

    .theme-toggle-btn:hover {
        transform: translateY(-4px) scale(1.05);
        box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
    }

    .theme-toggle-btn:active {
        transform: translateY(-2px) scale(1.02);
    }

    .theme-icon {
        font-size: 24px;
        line-height: 1;
    }

    .theme-label {
        font-size: 9px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        opacity: 0.9;
    }

    /* Responsive */
    @media (max-width: 768px) {
        .theme-toggle-btn {
            bottom: 80px;
            left: 20px;
            width: 48px;
            height: 48px;
        }

        .theme-icon {
            font-size: 20px;
        }

        .theme-label {
            font-size: 8px;
        }
    }

    /* Dark mode toggle colors */
    [data-theme="dark"] .theme-toggle-btn {
        --theme-toggle-bg: linear-gradient(135deg, #374151 0%, #1f2937 100%);
    }

    /* Animación de cambio de tema */
    * {
        transition: background-color 0.3s ease,
                    color 0.3s ease,
                    border-color 0.3s ease,
                    box-shadow 0.3s ease;
    }

    /* Excepciones (no animar estas propiedades) */
    *, *::before, *::after {
        transition-property: background-color, color, border-color, box-shadow, fill, stroke;
        transition-duration: 0.3s;
        transition-timing-function: ease;
    }

    /* No animar transforms ni layouts */
    .apu-card, .project-card, button, input, textarea, select {
        transition-property: background-color, color, border-color, box-shadow, transform;
    }
`;

document.head.appendChild(themeStyles);

// ============================================
// CSS VARIABLES PARA TEMAS
// ============================================

const themeVariables = document.createElement('style');
themeVariables.textContent = `
    :root {
        /* Light Theme (default) */
        --bg-primary: #ffffff;
        --bg-secondary: #f9fafb;
        --bg-tertiary: #f3f4f6;
        --bg-elevated: #ffffff;

        --text-primary: #111827;
        --text-secondary: #6b7280;
        --text-tertiary: #9ca3af;

        --border-color: #e5e7eb;
        --border-light: #f3f4f6;
        --border-dark: #d1d5db;

        --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);

        --primary-color: #667eea;
        --primary-dark: #764ba2;
        --accent-color: #fbc02d;

        --success-color: #10b981;
        --error-color: #ef4444;
        --warning-color: #f59e0b;
        --info-color: #3b82f6;

        --card-bg: #ffffff;
        --input-bg: #ffffff;
        --hover-bg: #f3f4f6;
    }

    [data-theme="dark"] {
        /* Dark Theme */
        --bg-primary: #111827;
        --bg-secondary: #1f2937;
        --bg-tertiary: #374151;
        --bg-elevated: #1f2937;

        --text-primary: #f9fafb;
        --text-secondary: #d1d5db;
        --text-tertiary: #9ca3af;

        --border-color: #374151;
        --border-light: #4b5563;
        --border-dark: #1f2937;

        --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
        --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
        --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
        --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.6);

        --primary-color: #818cf8;
        --primary-dark: #6366f1;
        --accent-color: #fbbf24;

        --success-color: #34d399;
        --error-color: #f87171;
        --warning-color: #fbbf24;
        --info-color: #60a5fa;

        --card-bg: #1f2937;
        --input-bg: #374151;
        --hover-bg: #374151;
    }

    /* Aplicar variables a elementos */
    body {
        background-color: var(--bg-primary);
        color: var(--text-primary);
    }

    #app-container {
        background-color: var(--bg-secondary);
    }

    .card, .apu-card, .project-card {
        background-color: var(--card-bg);
        color: var(--text-primary);
        border-color: var(--border-color);
        box-shadow: var(--shadow-md);
    }

    .card:hover, .apu-card:hover {
        box-shadow: var(--shadow-lg);
    }

    input, textarea, select {
        background-color: var(--input-bg);
        color: var(--text-primary);
        border-color: var(--border-color);
    }

    input:focus, textarea:focus, select:focus {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    [data-theme="dark"] input:focus,
    [data-theme="dark"] textarea:focus,
    [data-theme="dark"] select:focus {
        box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.2);
    }

    /* Headers */
    h1, h2, h3, h4, h5, h6 {
        color: var(--text-primary);
    }

    /* Links */
    a {
        color: var(--primary-color);
    }

    a:hover {
        color: var(--primary-dark);
    }

    /* Botones */
    .btn-secondary {
        background-color: var(--bg-tertiary);
        color: var(--text-primary);
    }

    .btn-secondary:hover {
        background-color: var(--hover-bg);
    }

    /* Modals */
    .modal-content {
        background-color: var(--card-bg);
        color: var(--text-primary);
    }

    /* Toast notifications */
    .toast-notification {
        background-color: var(--card-bg);
        color: var(--text-primary);
        box-shadow: var(--shadow-xl);
    }

    /* Category chips */
    .category-chip {
        background-color: var(--bg-tertiary);
        color: var(--text-primary);
        border-color: var(--border-color);
    }

    .category-chip.active {
        background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
        color: white;
    }

    /* Stat cards */
    .stat-card {
        background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
    }

    /* No results */
    .no-results, .apu-initial-view {
        color: var(--text-secondary);
    }

    /* Skeleton loaders en dark mode */
    [data-theme="dark"] .skeleton {
        background: linear-gradient(90deg,
            var(--bg-tertiary) 25%,
            var(--bg-secondary) 50%,
            var(--bg-tertiary) 75%
        );
    }

    /* Scroll to top button */
    .scroll-to-top {
        background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
    }

    /* Mejoras para dark mode */
    [data-theme="dark"] .apu-card-footer,
    [data-theme="dark"] .project-card-footer {
        border-top-color: var(--border-color);
    }

    [data-theme="dark"] .apu-select-btn:hover {
        background-color: var(--primary-color);
    }

    /* Loading indicator */
    .apu-loading {
        color: var(--text-secondary);
    }

    /* Favorite button */
    .favorite-btn {
        color: var(--text-secondary);
    }

    .favorite-btn.active {
        color: var(--accent-color);
    }

    /* Placeholder text */
    ::placeholder {
        color: var(--text-tertiary);
        opacity: 1;
    }

    /* Selection */
    ::selection {
        background-color: var(--primary-color);
        color: white;
    }
`;

document.head.appendChild(themeVariables);

// ============================================
// INICIALIZACIÓN
// ============================================

// Crear instancia global del theme manager
window.ThemeManager = new ThemeManager();

// Exponer función global para cambiar tema fácilmente
window.toggleTheme = () => window.ThemeManager.toggleTheme();

// Shortcut de teclado: Ctrl+Shift+D para dark mode
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        window.toggleTheme();
    }
});

console.log('✅ CLAUDIA Theme Manager v5.4 loaded');
console.log('💡 Tip: Presiona Ctrl+Shift+D para cambiar tema');

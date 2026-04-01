/**
 * CLAUDIA Mobile Pro v5.5
 * Optimizaciones mobile-first para maestros constructores
 * - Touch targets 48x48px mínimo
 * - Gestos swipe intuitivos
 * - Haptic feedback
 * - Simplificación UX extrema
 * - Performance móvil optimizada
 */

(function() {
    'use strict';

    // ==========================================
    // 1. MOBILE FIRST - TOUCH TARGETS & GESTURES
    // ==========================================

    class MobileOptimizer {
        constructor() {
            this.isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            this.touchStartX = 0;
            this.touchStartY = 0;
            this.touchEndX = 0;
            this.touchEndY = 0;
            this.minSwipeDistance = 50; // pixels

            this.init();
        }

        init() {
            if (!this.isMobile) {
                console.log('[Mobile Pro] Desktop detected, mobile optimizations available');
            }

            this.optimizeTouchTargets();
            this.enableSwipeGestures();
            this.optimizeFontSizes();
            this.addQuickActions();
            this.enablePullToRefresh();
            this.optimizeInputs();
            this.addVisualFeedback();

            console.log('[Mobile Pro] ✅ Mobile optimizations initialized');
        }

        // Asegurar que todos los botones sean mínimo 48x48px (Material Design guidelines)
        optimizeTouchTargets() {
            const MIN_TOUCH_SIZE = 48;

            // Optimizar todos los botones
            document.querySelectorAll('button, .btn, .apu-select-btn, .category-chip').forEach(btn => {
                const rect = btn.getBoundingClientRect();

                // Si es muy pequeño, agregar padding
                if (rect.width < MIN_TOUCH_SIZE || rect.height < MIN_TOUCH_SIZE) {
                    btn.style.minWidth = `${MIN_TOUCH_SIZE}px`;
                    btn.style.minHeight = `${MIN_TOUCH_SIZE}px`;
                    btn.style.display = 'flex';
                    btn.style.alignItems = 'center';
                    btn.style.justifyContent = 'center';
                }

                // Agregar área táctil extendida visualmente
                btn.style.position = 'relative';
            });

            console.log('[Mobile Pro] ✅ Touch targets optimized (min 48x48px)');
        }

        // Gestos swipe para navegación
        enableSwipeGestures() {
            const container = document.querySelector('.container');
            if (!container) return;

            container.addEventListener('touchstart', (e) => {
                this.touchStartX = e.changedTouches[0].screenX;
                this.touchStartY = e.changedTouches[0].screenY;
            }, { passive: true });

            container.addEventListener('touchend', (e) => {
                this.touchEndX = e.changedTouches[0].screenX;
                this.touchEndY = e.changedTouches[0].screenY;
                this.handleSwipe();
            }, { passive: true });

            console.log('[Mobile Pro] ✅ Swipe gestures enabled');
        }

        handleSwipe() {
            const deltaX = this.touchEndX - this.touchStartX;
            const deltaY = this.touchEndY - this.touchStartY;

            // Swipe horizontal (mayor que vertical)
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX > this.minSwipeDistance) {
                    // Swipe derecha - cerrar modales o volver
                    this.onSwipeRight();
                } else if (deltaX < -this.minSwipeDistance) {
                    // Swipe izquierda - abrir opciones
                    this.onSwipeLeft();
                }
            } else {
                // Swipe vertical
                if (deltaY > this.minSwipeDistance && this.touchStartY < 100) {
                    // Pull down desde arriba - refresh
                    this.onPullDown();
                }
            }
        }

        onSwipeRight() {
            // Cerrar modal abierto
            const openModal = document.querySelector('.modal-overlay.active');
            if (openModal) {
                openModal.classList.remove('active');
                this.hapticFeedback('light');
                console.log('[Swipe] Modal cerrado');
            }
        }

        onSwipeLeft() {
            // Abrir quick actions si están disponibles
            const quickActions = document.getElementById('quick-actions-panel');
            if (quickActions) {
                quickActions.classList.toggle('open');
                this.hapticFeedback('light');
            }
        }

        onPullDown() {
            // Refresh visual
            this.showRefreshIndicator();
            setTimeout(() => {
                location.reload();
            }, 500);
        }

        showRefreshIndicator() {
            const indicator = document.createElement('div');
            indicator.className = 'refresh-indicator';
            indicator.innerHTML = '🔄 Actualizando...';
            indicator.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                padding: 12px 24px;
                border-radius: 24px;
                font-weight: 600;
                font-size: 14px;
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                z-index: 100000;
                animation: slideDown 0.3s ease;
            `;
            document.body.appendChild(indicator);

            setTimeout(() => {
                indicator.remove();
            }, 2000);
        }

        // Pull to refresh (solo mobile)
        enablePullToRefresh() {
            if (!this.isMobile) return;

            let startY = 0;
            let isPulling = false;

            document.addEventListener('touchstart', (e) => {
                if (window.scrollY === 0) {
                    startY = e.touches[0].clientY;
                    isPulling = true;
                }
            }, { passive: true });

            document.addEventListener('touchmove', (e) => {
                if (!isPulling) return;

                const currentY = e.touches[0].clientY;
                const distance = currentY - startY;

                if (distance > 80) {
                    isPulling = false;
                    this.onPullDown();
                }
            }, { passive: true });

            console.log('[Mobile Pro] ✅ Pull to refresh enabled');
        }

        // Optimizar tamaños de fuente para móvil
        optimizeFontSizes() {
            if (window.innerWidth <= 768) {
                // Textos más grandes en móvil para legibilidad
                const style = document.createElement('style');
                style.innerHTML = `
                    @media (max-width: 768px) {
                        /* Títulos más grandes */
                        .card-title { font-size: 20px !important; }
                        .header h1 { font-size: 28px !important; }

                        /* Botones más legibles */
                        .btn {
                            font-size: 16px !important;
                            padding: 16px 24px !important;
                            min-height: 52px !important;
                        }

                        /* Inputs más grandes */
                        input, select, textarea {
                            font-size: 16px !important;
                            padding: 14px !important;
                            min-height: 48px !important;
                        }

                        /* Chat más legible */
                        .message-content {
                            font-size: 15px !important;
                            line-height: 1.6 !important;
                        }

                        /* APU cards */
                        .apu-card-title {
                            font-size: 15px !important;
                            line-height: 1.5 !important;
                        }

                        /* Cantidad más visible */
                        .project-activity-amount {
                            font-size: 18px !important;
                        }
                    }
                `;
                document.head.appendChild(style);
                console.log('[Mobile Pro] ✅ Font sizes optimized for mobile');
            }
        }

        // Haptic feedback para acciones
        hapticFeedback(type = 'medium') {
            if (!this.isMobile) return;

            // Vibration API
            if ('vibrate' in navigator) {
                const patterns = {
                    light: 10,
                    medium: 20,
                    heavy: 30,
                    success: [10, 50, 10],
                    error: [20, 100, 20],
                    warning: [10, 50, 10, 50, 10]
                };

                navigator.vibrate(patterns[type] || 20);
            }
        }

        // Quick actions panel
        addQuickActions() {
            const quickActionsHTML = `
                <div id="quick-actions-panel" class="quick-actions-panel">
                    <div class="quick-actions-header">
                        <span>⚡</span>
                        <span>Acciones Rápidas</span>
                        <button class="quick-actions-close" onclick="closeQuickActions()">✕</button>
                    </div>
                    <div class="quick-actions-grid">
                        <button class="quick-action-btn" onclick="quickAddActivity()">
                            <span class="quick-action-icon">➕</span>
                            <span class="quick-action-label">Agregar Actividad</span>
                        </button>
                        <button class="quick-action-btn" onclick="quickAddTask()">
                            <span class="quick-action-icon">✅</span>
                            <span class="quick-action-label">Nueva Tarea</span>
                        </button>
                        <button class="quick-action-btn" onclick="quickViewBudget()">
                            <span class="quick-action-icon">💰</span>
                            <span class="quick-action-label">Ver Presupuesto</span>
                        </button>
                        <button class="quick-action-btn" onclick="quickSearchAPU()">
                            <span class="quick-action-icon">🔍</span>
                            <span class="quick-action-label">Buscar APU</span>
                        </button>
                        <button class="quick-action-btn" onclick="quickExportProject()">
                            <span class="quick-action-icon">📤</span>
                            <span class="quick-action-label">Exportar</span>
                        </button>
                        <button class="quick-action-btn" onclick="quickShareProject()">
                            <span class="quick-action-icon">📱</span>
                            <span class="quick-action-label">Compartir</span>
                        </button>
                    </div>
                </div>

                <!-- Floating Quick Action Button -->
                <button id="quick-actions-fab" class="quick-actions-fab" onclick="toggleQuickActions()">
                    <span class="fab-icon">⚡</span>
                </button>

                <style>
                    .quick-actions-panel {
                        position: fixed;
                        bottom: -100%;
                        left: 0;
                        right: 0;
                        background: white;
                        border-radius: 24px 24px 0 0;
                        box-shadow: 0 -8px 32px rgba(0,0,0,0.15);
                        z-index: 10000;
                        transition: bottom 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                        max-height: 70vh;
                        overflow-y: auto;
                    }

                    .quick-actions-panel.open {
                        bottom: 0;
                    }

                    .quick-actions-header {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        padding: 20px;
                        background: linear-gradient(135deg, #667eea, #764ba2);
                        color: white;
                        font-weight: 700;
                        font-size: 18px;
                        border-radius: 24px 24px 0 0;
                        position: sticky;
                        top: 0;
                        z-index: 1;
                    }

                    .quick-actions-close {
                        margin-left: auto;
                        background: rgba(255,255,255,0.2);
                        border: none;
                        color: white;
                        width: 36px;
                        height: 36px;
                        border-radius: 50%;
                        font-size: 20px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    }

                    .quick-actions-close:active {
                        background: rgba(255,255,255,0.3);
                        transform: scale(0.95);
                    }

                    .quick-actions-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 12px;
                        padding: 20px;
                    }

                    .quick-action-btn {
                        background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
                        border: none;
                        border-radius: 16px;
                        padding: 24px 16px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 8px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        min-height: 100px;
                    }

                    .quick-action-btn:active {
                        transform: scale(0.95);
                        background: linear-gradient(135deg, #667eea, #764ba2);
                    }

                    .quick-action-btn:active .quick-action-icon {
                        transform: scale(1.2);
                    }

                    .quick-action-btn:active .quick-action-label {
                        color: white;
                    }

                    .quick-action-icon {
                        font-size: 32px;
                        transition: transform 0.3s ease;
                    }

                    .quick-action-label {
                        font-size: 13px;
                        font-weight: 600;
                        color: #333;
                        text-align: center;
                        transition: color 0.3s ease;
                    }

                    /* Floating Action Button */
                    .quick-actions-fab {
                        position: fixed;
                        bottom: 80px;
                        right: 20px;
                        width: 64px;
                        height: 64px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, #667eea, #764ba2);
                        color: white;
                        border: none;
                        font-size: 28px;
                        box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
                        cursor: pointer;
                        transition: all 0.3s ease;
                        z-index: 9998;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .quick-actions-fab:active {
                        transform: scale(0.9);
                        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                    }

                    .fab-icon {
                        animation: pulse 2s ease infinite;
                    }

                    @keyframes pulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.1); }
                    }

                    /* Mobile specific */
                    @media (max-width: 768px) {
                        .quick-actions-fab {
                            display: flex;
                        }
                    }

                    @media (min-width: 769px) {
                        .quick-actions-fab {
                            display: none;
                        }
                    }
                </style>
            `;

            document.body.insertAdjacentHTML('beforeend', quickActionsHTML);
            console.log('[Mobile Pro] ✅ Quick actions panel added');
        }

        // Optimizar inputs para móvil
        optimizeInputs() {
            document.querySelectorAll('input, textarea, select').forEach(input => {
                // Prevenir zoom en iOS
                if (parseFloat(getComputedStyle(input).fontSize) < 16) {
                    input.style.fontSize = '16px';
                }

                // Agregar atributos para mejor UX móvil
                if (input.type === 'number') {
                    input.setAttribute('inputmode', 'decimal');
                    input.setAttribute('pattern', '[0-9.]*');
                }

                if (input.type === 'tel') {
                    input.setAttribute('inputmode', 'tel');
                }

                if (input.type === 'email') {
                    input.setAttribute('inputmode', 'email');
                }

                // Auto-capitalize para nombres
                if (input.id === 'project-name' || input.placeholder?.includes('nombre')) {
                    input.setAttribute('autocapitalize', 'words');
                }
            });

            console.log('[Mobile Pro] ✅ Inputs optimized for mobile');
        }

        // Feedback visual mejorado
        addVisualFeedback() {
            const style = document.createElement('style');
            style.innerHTML = `
                /* Touch ripple effect */
                .btn, .apu-card, .category-chip, .project-activity-item {
                    position: relative;
                    overflow: hidden;
                }

                .btn:active::after,
                .apu-card:active::after,
                .category-chip:active::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 0;
                    height: 0;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.5);
                    transform: translate(-50%, -50%);
                    animation: ripple 0.6s ease-out;
                }

                @keyframes ripple {
                    to {
                        width: 300px;
                        height: 300px;
                        opacity: 0;
                    }
                }

                /* Active states más prominentes */
                .btn:active {
                    transform: scale(0.97);
                    opacity: 0.9;
                }

                .apu-card:active {
                    transform: scale(0.98);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }

                /* Loading states */
                .btn.loading {
                    pointer-events: none;
                    opacity: 0.7;
                }

                .btn.loading::before {
                    content: '';
                    position: absolute;
                    width: 16px;
                    height: 16px;
                    border: 3px solid rgba(255,255,255,0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
            console.log('[Mobile Pro] ✅ Visual feedback enhanced');
        }
    }

    // ==========================================
    // 2. QUICK ACTION FUNCTIONS
    // ==========================================

    window.toggleQuickActions = function() {
        const panel = document.getElementById('quick-actions-panel');
        if (panel) {
            panel.classList.toggle('open');
            if (window.mobileOptimizer) {
                window.mobileOptimizer.hapticFeedback('light');
            }
        }
    };

    window.closeQuickActions = function() {
        const panel = document.getElementById('quick-actions-panel');
        if (panel) {
            panel.classList.remove('open');
        }
    };

    window.quickAddActivity = function() {
        closeQuickActions();
        document.getElementById('apu-search')?.focus();
        document.getElementById('apu-search')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (window.mobileOptimizer) {
            window.mobileOptimizer.hapticFeedback('success');
        }
    };

    window.quickAddTask = function() {
        closeQuickActions();
        document.getElementById('new-task-input')?.focus();
        document.getElementById('new-task-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (window.mobileOptimizer) {
            window.mobileOptimizer.hapticFeedback('success');
        }
    };

    window.quickViewBudget = function() {
        closeQuickActions();
        if (typeof viewProjectBudget === 'function') {
            viewProjectBudget();
        }
        if (window.mobileOptimizer) {
            window.mobileOptimizer.hapticFeedback('medium');
        }
    };

    window.quickSearchAPU = function() {
        closeQuickActions();
        const apuNavigator = document.getElementById('apu-navigator');
        if (apuNavigator) {
            apuNavigator.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setTimeout(() => {
                document.getElementById('apu-search')?.focus();
            }, 500);
        }
        if (window.mobileOptimizer) {
            window.mobileOptimizer.hapticFeedback('light');
        }
    };

    window.quickExportProject = function() {
        closeQuickActions();
        if (typeof exportToExcel === 'function') {
            exportToExcel();
        }
        if (window.mobileOptimizer) {
            window.mobileOptimizer.hapticFeedback('success');
        }
    };

    window.quickShareProject = function() {
        closeQuickActions();
        if (typeof shareProject === 'function') {
            shareProject();
        }
        if (window.mobileOptimizer) {
            window.mobileOptimizer.hapticFeedback('medium');
        }
    };

    // ==========================================
    // 3. OFFLINE MODE INDICATOR
    // ==========================================

    class OfflineIndicator {
        constructor() {
            this.isOnline = navigator.onLine;
            this.init();
        }

        init() {
            this.createIndicator();
            this.setupListeners();
            this.updateStatus();
            console.log('[Offline] ✅ Indicator initialized');
        }

        createIndicator() {
            const indicator = document.createElement('div');
            indicator.id = 'offline-indicator';
            indicator.style.cssText = `
                position: fixed;
                top: 10px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #f59e0b, #d97706);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 13px;
                font-weight: 600;
                box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
                z-index: 100000;
                display: none;
                align-items: center;
                gap: 8px;
                animation: slideDown 0.3s ease;
            `;
            indicator.innerHTML = '<span>📡</span><span>Modo Sin Conexión</span>';
            document.body.appendChild(indicator);
        }

        setupListeners() {
            window.addEventListener('online', () => {
                this.isOnline = true;
                this.updateStatus();
                this.showToast('✅ Conexión restaurada', 'success');
            });

            window.addEventListener('offline', () => {
                this.isOnline = false;
                this.updateStatus();
                this.showToast('📡 Modo sin conexión activado', 'warning');
            });
        }

        updateStatus() {
            const indicator = document.getElementById('offline-indicator');
            if (indicator) {
                indicator.style.display = this.isOnline ? 'none' : 'flex';
            }
        }

        showToast(message, type) {
            if (typeof showToast === 'function') {
                showToast(message);
            } else {
                console.log('[Offline]', message);
            }
        }
    }

    // ==========================================
    // 4. INITIALIZE ON DOM READY
    // ==========================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobilePro);
    } else {
        initMobilePro();
    }

    function initMobilePro() {
        // Initialize Mobile Optimizer
        window.mobileOptimizer = new MobileOptimizer();

        // Initialize Offline Indicator
        window.offlineIndicator = new OfflineIndicator();

        console.log('✅ CLAUDIA Mobile Pro v5.5 initialized');
        console.log('📱 Mobile optimizations active');
        console.log('⚡ Quick actions ready');
        console.log('📡 Offline mode ready');
    }

})();

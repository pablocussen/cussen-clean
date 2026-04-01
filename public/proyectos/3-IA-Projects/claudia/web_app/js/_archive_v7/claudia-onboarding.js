/**
 * CLAUDIA Onboarding Tutorial v5.6
 * First-time user experience optimizado para maestros
 * Tutorial interactivo simple y efectivo
 */

(function() {
    'use strict';

    // ==========================================
    // 1. ONBOARDING MANAGER
    // ==========================================

    class OnboardingManager {
        constructor() {
            this.currentStep = 0;
            this.totalSteps = 5;
            this.completed = this.isOnboardingCompleted();
            this.overlay = null;
            this.spotlight = null;

            this.steps = [
                {
                    title: '¡Bienvenido a CLAUDIA! 🤖',
                    message: 'Tu asistente inteligente para presupuestos de construcción.',
                    target: null, // Centered modal
                    position: 'center',
                    action: null
                },
                {
                    title: 'Crea tu primer proyecto 📋',
                    message: 'Dale un nombre a tu proyecto. Ejemplo: "Ampliación Casa"',
                    target: '#project-name',
                    position: 'bottom',
                    highlight: true,
                    action: () => document.getElementById('project-name')?.focus()
                },
                {
                    title: 'Busca actividades APU 🔍',
                    message: 'Busca por nombre: "radier", "muro", "pintura". Usa el 🎤 para buscar por voz.',
                    target: '#apu-search',
                    position: 'bottom',
                    highlight: true,
                    action: () => {
                        const search = document.getElementById('apu-search');
                        if (search) {
                            search.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }
                },
                {
                    title: 'Acciones rápidas ⚡',
                    message: 'Toca el botón de rayo para acceso rápido a todo. ¡Pruébalo!',
                    target: '#quick-actions-fab',
                    position: 'left',
                    highlight: true,
                    action: null
                },
                {
                    title: '¡Todo listo! 🎉',
                    message: 'Ya sabes lo básico. Explora y descubre más features: Dark Mode 🌙, PDF Export 📄, y más.',
                    target: null,
                    position: 'center',
                    action: null
                }
            ];

            console.log('[Onboarding] ✅ Manager initialized');
        }

        isOnboardingCompleted() {
            try {
                return localStorage.getItem('claudia_onboarding_completed') === 'true';
            } catch (e) {
                return false;
            }
        }

        start() {
            if (this.completed) {
                console.log('[Onboarding] Already completed, skipping');
                return;
            }

            this.currentStep = 0;
            this.createOverlay();
            this.showStep(0);

            console.log('[Onboarding] 🎓 Tutorial started');
        }

        createOverlay() {
            // Dark overlay
            this.overlay = document.createElement('div');
            this.overlay.id = 'onboarding-overlay';
            this.overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.85);
                z-index: 100000;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.3s ease;
            `;

            // Spotlight element
            this.spotlight = document.createElement('div');
            this.spotlight.id = 'onboarding-spotlight';
            this.spotlight.style.cssText = `
                position: absolute;
                border: 3px solid #667eea;
                border-radius: 12px;
                box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.85),
                            0 0 30px rgba(102, 126, 234, 0.5);
                pointer-events: none;
                transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                z-index: 100001;
            `;

            document.body.appendChild(this.overlay);
            document.body.appendChild(this.spotlight);

            // Add fade-in animation
            const style = document.createElement('style');
            style.innerHTML = `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }

                .onboarding-tooltip {
                    animation: fadeIn 0.3s ease;
                }

                .onboarding-skip {
                    transition: all 0.2s ease;
                }

                .onboarding-skip:hover {
                    background: rgba(255, 255, 255, 0.2) !important;
                    transform: scale(1.05);
                }

                .onboarding-next:hover {
                    transform: scale(1.05);
                    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
                }
            `;
            document.head.appendChild(style);
        }

        showStep(stepIndex) {
            if (stepIndex >= this.totalSteps) {
                this.complete();
                return;
            }

            const step = this.steps[stepIndex];
            this.currentStep = stepIndex;

            // Update spotlight
            if (step.target) {
                this.highlightElement(step.target);
            } else {
                this.spotlight.style.display = 'none';
            }

            // Show tooltip
            this.showTooltip(step, stepIndex);

            // Execute step action
            if (step.action) {
                setTimeout(() => step.action(), 500);
            }

            // Haptic feedback
            if (window.mobileOptimizer) {
                window.mobileOptimizer.hapticFeedback('light');
            }
        }

        highlightElement(selector) {
            const element = document.querySelector(selector);
            if (!element) {
                this.spotlight.style.display = 'none';
                return;
            }

            const rect = element.getBoundingClientRect();
            const padding = 10;

            this.spotlight.style.display = 'block';
            this.spotlight.style.top = `${rect.top - padding}px`;
            this.spotlight.style.left = `${rect.left - padding}px`;
            this.spotlight.style.width = `${rect.width + padding * 2}px`;
            this.spotlight.style.height = `${rect.height + padding * 2}px`;

            // Bring element to front temporarily
            element.style.position = 'relative';
            element.style.zIndex = '100002';
        }

        showTooltip(step, stepIndex) {
            // Remove old tooltip
            const oldTooltip = document.getElementById('onboarding-tooltip');
            if (oldTooltip) oldTooltip.remove();

            // Create tooltip
            const tooltip = document.createElement('div');
            tooltip.id = 'onboarding-tooltip';
            tooltip.className = 'onboarding-tooltip';
            tooltip.style.cssText = `
                position: fixed;
                background: white;
                border-radius: 16px;
                padding: 24px;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                z-index: 100003;
                ${this.getTooltipPosition(step)}
            `;

            tooltip.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                    <div style="
                        background: linear-gradient(135deg, #667eea, #764ba2);
                        color: white;
                        padding: 4px 12px;
                        border-radius: 12px;
                        font-size: 12px;
                        font-weight: 600;
                    ">
                        ${stepIndex + 1}/${this.totalSteps}
                    </div>
                    <button class="onboarding-skip" onclick="window.onboardingManager.skip()" style="
                        background: rgba(0, 0, 0, 0.05);
                        border: none;
                        color: #666;
                        padding: 6px 12px;
                        border-radius: 8px;
                        font-size: 13px;
                        font-weight: 600;
                        cursor: pointer;
                    ">
                        Saltar
                    </button>
                </div>

                <div style="font-size: 20px; font-weight: 700; color: #000; margin-bottom: 12px;">
                    ${step.title}
                </div>

                <div style="font-size: 15px; color: #666; line-height: 1.6; margin-bottom: 24px;">
                    ${step.message}
                </div>

                <div style="display: flex; gap: 12px;">
                    ${stepIndex > 0 ? `
                        <button onclick="window.onboardingManager.previousStep()" style="
                            background: #f5f5f5;
                            color: #333;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 8px;
                            font-size: 15px;
                            font-weight: 600;
                            cursor: pointer;
                            flex: 1;
                        ">
                            ← Atrás
                        </button>
                    ` : ''}
                    <button class="onboarding-next" onclick="window.onboardingManager.nextStep()" style="
                        background: linear-gradient(135deg, #667eea, #764ba2);
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-size: 15px;
                        font-weight: 600;
                        cursor: pointer;
                        flex: 2;
                        transition: all 0.3s ease;
                    ">
                        ${stepIndex === this.totalSteps - 1 ? '¡Comenzar! 🚀' : 'Siguiente →'}
                    </button>
                </div>

                <!-- Progress dots -->
                <div style="display: flex; justify-content: center; gap: 8px; margin-top: 20px;">
                    ${this.steps.map((_, i) => `
                        <div style="
                            width: 8px;
                            height: 8px;
                            border-radius: 50%;
                            background: ${i === stepIndex ? '#667eea' : '#e0e0e0'};
                            transition: all 0.3s ease;
                        "></div>
                    `).join('')}
                </div>
            `;

            document.body.appendChild(tooltip);
        }

        getTooltipPosition(step) {
            if (!step.target || step.position === 'center') {
                return `
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                `;
            }

            const element = document.querySelector(step.target);
            if (!element) {
                return `top: 50%; left: 50%; transform: translate(-50%, -50%);`;
            }

            const rect = element.getBoundingClientRect();

            switch (step.position) {
                case 'bottom':
                    return `
                        top: ${rect.bottom + 20}px;
                        left: 50%;
                        transform: translateX(-50%);
                    `;
                case 'top':
                    return `
                        bottom: ${window.innerHeight - rect.top + 20}px;
                        left: 50%;
                        transform: translateX(-50%);
                    `;
                case 'left':
                    return `
                        top: 50%;
                        right: ${window.innerWidth - rect.left + 20}px;
                        transform: translateY(-50%);
                    `;
                case 'right':
                    return `
                        top: 50%;
                        left: ${rect.right + 20}px;
                        transform: translateY(-50%);
                    `;
                default:
                    return `top: 50%; left: 50%; transform: translate(-50%, -50%);`;
            }
        }

        nextStep() {
            this.showStep(this.currentStep + 1);
        }

        previousStep() {
            if (this.currentStep > 0) {
                this.showStep(this.currentStep - 1);
            }
        }

        skip() {
            if (confirm('¿Seguro que quieres saltar el tutorial? Siempre puedes volver a verlo desde Configuración.')) {
                this.complete();
            }
        }

        complete() {
            // Mark as completed
            try {
                localStorage.setItem('claudia_onboarding_completed', 'true');
            } catch (e) {
                console.error('[Onboarding] Error saving completion:', e);
            }

            // Clean up
            if (this.overlay) this.overlay.remove();
            if (this.spotlight) this.spotlight.remove();
            const tooltip = document.getElementById('onboarding-tooltip');
            if (tooltip) tooltip.remove();

            // Reset z-index of highlighted elements
            document.querySelectorAll('[style*="z-index: 100002"]').forEach(el => {
                el.style.zIndex = '';
            });

            // Show completion message
            if (typeof showToast === 'function') {
                showToast('🎉 ¡Tutorial completado! Ya puedes usar CLAUDIA', 'success');
            }

            // Haptic success
            if (window.mobileOptimizer) {
                window.mobileOptimizer.hapticFeedback('success');
            }

            console.log('[Onboarding] ✅ Tutorial completed');
        }

        reset() {
            try {
                localStorage.removeItem('claudia_onboarding_completed');
                this.completed = false;
                console.log('[Onboarding] Reset - ready to run again');
            } catch (e) {
                console.error('[Onboarding] Error resetting:', e);
            }
        }
    }

    // ==========================================
    // 2. AUTO-START ON FIRST VISIT
    // ==========================================

    function checkAndStartOnboarding() {
        const manager = new OnboardingManager();
        window.onboardingManager = manager;

        // Check if it's first visit
        if (!manager.completed) {
            // Wait for DOM to be fully ready
            setTimeout(() => {
                manager.start();
            }, 1000); // 1 second delay for smooth start
        }
    }

    // ==========================================
    // 3. HELP BUTTON IN UI
    // ==========================================

    function addHelpButton() {
        const helpBtn = document.createElement('button');
        helpBtn.id = 'help-tutorial-btn';
        helpBtn.innerHTML = '❓';
        helpBtn.title = 'Ver tutorial';
        helpBtn.onclick = () => {
            if (window.onboardingManager) {
                window.onboardingManager.reset();
                window.onboardingManager.start();
            }
        };

        helpBtn.style.cssText = `
            position: fixed;
            bottom: 160px;
            right: 20px;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            border: none;
            font-size: 24px;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            cursor: pointer;
            z-index: 9997;
            transition: all 0.3s ease;
        `;

        helpBtn.onmouseenter = () => {
            helpBtn.style.transform = 'scale(1.1)';
            helpBtn.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.4)';
        };

        helpBtn.onmouseleave = () => {
            helpBtn.style.transform = 'scale(1)';
            helpBtn.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
        };

        document.body.appendChild(helpBtn);
    }

    // ==========================================
    // 4. GLOBAL FUNCTION
    // ==========================================

    window.showOnboardingTutorial = function() {
        if (window.onboardingManager) {
            window.onboardingManager.reset();
            window.onboardingManager.start();
        } else {
            checkAndStartOnboarding();
        }
    };

    // ==========================================
    // 5. INITIALIZE
    // ==========================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            checkAndStartOnboarding();
            addHelpButton();
        });
    } else {
        checkAndStartOnboarding();
        addHelpButton();
    }

    console.log('✅ CLAUDIA Onboarding v5.6 initialized');
    console.log('🎓 Tutorial system ready');

})();

/**
 * CLAUDIA Onboarding Tutorial v5.9.1 - FIXED
 * Tutorial simple y efectivo sin abrumar
 */

(function() {
    'use strict';

    class OnboardingManager {
        constructor() {
            this.currentStep = 0;
            this.steps = [
                {
                    title: '¡Bienvenido a CLAUDIA! 🤖',
                    message: 'CLAUDIA te ayuda a crear presupuestos profesionales de construcción en minutos.',
                    target: null,
                    position: 'center'
                },
                {
                    title: 'Paso 1: Nombra tu proyecto 📋',
                    message: 'Escribe el nombre de tu proyecto aquí. Por ejemplo: "Ampliación Casa" o "Baño Nuevo"',
                    target: '#project-name',
                    position: 'bottom'
                },
                {
                    title: 'Paso 2: Busca actividades 🔍',
                    message: 'Busca materiales o trabajos que necesites. Prueba escribiendo "radier" o "pintura"',
                    target: '#apu-search',
                    position: 'bottom'
                },
                {
                    title: '¡Listo! 🎉',
                    message: 'Ya puedes crear presupuestos profesionales. Usa el menú ☰ para más herramientas.',
                    target: null,
                    position: 'center'
                }
            ];

            this.completed = this.isCompleted();
        }

        isCompleted() {
            try {
                return localStorage.getItem('claudia_onboarding_completed') === 'true';
            } catch (e) {
                return false;
            }
        }

        start() {
            if (this.completed) return;

            this.currentStep = 0;
            this.createOverlay();
            this.showStep(0);

            console.log('🎓 Tutorial iniciado');
        }

        createOverlay() {
            // Dark overlay
            this.overlay = document.createElement('div');
            this.overlay.className = 'onboarding-overlay';
            this.overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.85);
                z-index: 99998;
                animation: fadeIn 0.3s ease;
            `;

            // Spotlight
            this.spotlight = document.createElement('div');
            this.spotlight.className = 'onboarding-spotlight';
            this.spotlight.style.cssText = `
                position: fixed;
                border: 3px solid #667eea;
                border-radius: 12px;
                box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.85),
                            0 0 30px rgba(102, 126, 234, 0.6);
                pointer-events: none;
                transition: all 0.4s ease;
                z-index: 99999;
                display: none;
            `;

            document.body.appendChild(this.overlay);
            document.body.appendChild(this.spotlight);

            // Add styles
            if (!document.getElementById('onboarding-styles')) {
                const styles = document.createElement('style');
                styles.id = 'onboarding-styles';
                styles.innerHTML = `
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }

                    .onboarding-tooltip {
                        animation: fadeIn 0.3s ease, slideUp 0.4s ease;
                    }

                    @keyframes slideUp {
                        from { transform: translate(-50%, -40%); }
                        to { transform: translate(-50%, -50%); }
                    }
                `;
                document.head.appendChild(styles);
            }
        }

        showStep(index) {
            if (index >= this.steps.length) {
                this.complete();
                return;
            }

            this.currentStep = index;
            const step = this.steps[index];

            // Update spotlight
            if (step.target) {
                this.highlightElement(step.target);
            } else {
                this.spotlight.style.display = 'none';
            }

            // Show tooltip
            this.showTooltip(step);
        }

        highlightElement(selector) {
            const element = document.querySelector(selector);
            if (!element) {
                this.spotlight.style.display = 'none';
                return;
            }

            element.scrollIntoView({ behavior: 'smooth', block: 'center' });

            setTimeout(() => {
                const rect = element.getBoundingClientRect();
                const padding = 10;

                this.spotlight.style.display = 'block';
                this.spotlight.style.top = `${rect.top - padding}px`;
                this.spotlight.style.left = `${rect.left - padding}px`;
                this.spotlight.style.width = `${rect.width + padding * 2}px`;
                this.spotlight.style.height = `${rect.height + padding * 2}px`;
            }, 300);
        }

        showTooltip(step) {
            // Remove old tooltip
            const old = document.querySelector('.onboarding-tooltip');
            if (old) old.remove();

            // Create new tooltip
            const tooltip = document.createElement('div');
            tooltip.className = 'onboarding-tooltip';
            tooltip.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                border-radius: 16px;
                padding: 30px;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                z-index: 100000;
                text-align: center;
            `;

            const isLast = this.currentStep === this.steps.length - 1;

            tooltip.innerHTML = `
                <div style="font-size: 48px; margin-bottom: 15px;">
                    ${step.title.match(/[🤖📋🔍🎉]/)?.[0] || '✨'}
                </div>

                <div style="font-size: 22px; font-weight: 700; color: #000; margin-bottom: 12px;">
                    ${step.title.replace(/[🤖📋🔍🎉]/g, '').trim()}
                </div>

                <div style="font-size: 16px; color: #666; line-height: 1.6; margin-bottom: 30px;">
                    ${step.message}
                </div>

                <div style="display: flex; gap: 12px; justify-content: center;">
                    ${this.currentStep > 0 ? `
                        <button onclick="window.onboardingManager.previousStep()" style="
                            background: #f5f5f5;
                            color: #333;
                            border: none;
                            padding: 14px 24px;
                            border-radius: 10px;
                            font-size: 15px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s ease;
                        " onmouseover="this.style.background='#e5e5e5'" onmouseout="this.style.background='#f5f5f5'">
                            ← Atrás
                        </button>
                    ` : ''}

                    <button onclick="window.onboardingManager.${isLast ? 'complete' : 'nextStep'}()" style="
                        background: linear-gradient(135deg, #667eea, #764ba2);
                        color: white;
                        border: none;
                        padding: 14px 32px;
                        border-radius: 10px;
                        font-size: 15px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        flex: ${this.currentStep === 0 ? '1' : 'auto'};
                    " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                        ${isLast ? '¡Comenzar! 🚀' : 'Siguiente →'}
                    </button>

                    ${!isLast ? `
                        <button onclick="window.onboardingManager.skip()" style="
                            background: transparent;
                            color: #999;
                            border: none;
                            padding: 14px 20px;
                            border-radius: 10px;
                            font-size: 14px;
                            cursor: pointer;
                            text-decoration: underline;
                        ">
                            Saltar
                        </button>
                    ` : ''}
                </div>

                <div style="display: flex; justify-content: center; gap: 8px; margin-top: 25px;">
                    ${this.steps.map((_, i) => `
                        <div style="
                            width: ${i === this.currentStep ? '24px' : '8px'};
                            height: 8px;
                            border-radius: 4px;
                            background: ${i === this.currentStep ? '#667eea' : '#e0e0e0'};
                            transition: all 0.3s ease;
                        "></div>
                    `).join('')}
                </div>
            `;

            document.body.appendChild(tooltip);
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
            this.complete();
        }

        complete() {
            try {
                localStorage.setItem('claudia_onboarding_completed', 'true');
            } catch (e) {}

            // Clean up
            if (this.overlay) this.overlay.remove();
            if (this.spotlight) this.spotlight.remove();
            const tooltip = document.querySelector('.onboarding-tooltip');
            if (tooltip) tooltip.remove();

            // Show success message
            if (typeof showToast === 'function') {
                showToast('🎉 ¡Listo! Ya puedes usar CLAUDIA', 3000);
            }

            console.log('✅ Tutorial completado');
        }

        reset() {
            try {
                localStorage.removeItem('claudia_onboarding_completed');
                this.completed = false;
            } catch (e) {}
        }
    }

    // Auto-start
    function autoStart() {
        const manager = new OnboardingManager();
        window.onboardingManager = manager;

        // Only on first visit
        if (!manager.completed) {
            setTimeout(() => {
                manager.start();
            }, 1000);
        }
    }

    // Global function
    window.showOnboardingTutorial = function() {
        if (window.onboardingManager) {
            window.onboardingManager.reset();
            window.onboardingManager.start();
        } else {
            autoStart();
        }
    };

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoStart);
    } else {
        autoStart();
    }

    console.log('✅ CLAUDIA Onboarding v5.9.1 (Fixed) loaded');

})();

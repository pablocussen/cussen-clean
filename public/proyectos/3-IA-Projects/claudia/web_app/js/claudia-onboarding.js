/**
 * CLAUDIA PRO - Sistema de Onboarding Interactivo
 * Guía paso a paso para nuevos usuarios (activación en primeras 24h)
 * Objetivo: 40%+ de usuarios completan primer proyecto en 24h
 */

// Estado del onboarding
let onboardingState = {
    active: false,
    currentStep: 0,
    completed: false,
    steps: [
        {
            id: 'welcome',
            title: 'Bienvenido a CLAUDIA PRO',
            description: 'Te guiaremos en 3 pasos rápidos',
            target: null,
            action: null
        },
        {
            id: 'create_project',
            title: 'Paso 1: Crea tu primer proyecto',
            description: 'Dale un nombre a tu obra (ej: "Casa Don Pedro")',
            target: '#project-name-input',
            action: 'Haz click aquí para nombrar tu proyecto'
        },
        {
            id: 'add_activity',
            title: 'Paso 2: Agrega una actividad',
            description: 'Selecciona un APU del navegador',
            target: '#apu-categories',
            action: 'Explora las 14 categorías y elige un APU'
        },
        {
            id: 'generate_list',
            title: 'Paso 3: Genera tu lista de compras',
            description: 'Copia y comparte tu lista por WhatsApp',
            target: '#shopping-list-btn',
            action: 'Haz click en "Lista de Compras"'
        },
        {
            id: 'complete',
            title: '🎉 ¡Felicitaciones!',
            description: 'Ya dominas CLAUDIA PRO. Ahora presupuesta como un profesional.',
            target: null,
            action: null
        }
    ]
};

/**
 * Inicializar onboarding para nuevos usuarios
 */
function initOnboarding() {
    // Verificar si es nuevo usuario (sin proyectos previos)
    const hasSeenOnboarding = localStorage.getItem('claudia_onboarding_completed');
    const projectCount = getAllProjects().length;

    if (!hasSeenOnboarding && projectCount === 0) {
        // Esperar 2 segundos después de login para que UI esté lista
        setTimeout(() => {
            startOnboarding();
        }, 2000);
    }
}

/**
 * Iniciar tour de onboarding
 */
function startOnboarding() {
    onboardingState.active = true;
    onboardingState.currentStep = 0;

    // Crear overlay
    createOnboardingOverlay();

    // Mostrar primer paso
    showOnboardingStep(0);

    // Analytics
    if (window.gtag) {
        gtag('event', 'onboarding_started', {
            event_category: 'engagement',
            event_label: 'interactive_tour'
        });
    }
}

/**
 * Crear overlay de onboarding
 */
function createOnboardingOverlay() {
    // Remover overlay existente si hay
    const existing = document.getElementById('onboarding-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'onboarding-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 9998;
        backdrop-filter: blur(3px);
    `;

    document.body.appendChild(overlay);
}

/**
 * Mostrar paso del onboarding
 */
function showOnboardingStep(stepIndex) {
    const step = onboardingState.steps[stepIndex];

    if (!step) {
        completeOnboarding();
        return;
    }

    // Actualizar estado
    onboardingState.currentStep = stepIndex;

    // Remover tooltip anterior
    const existingTooltip = document.getElementById('onboarding-tooltip');
    if (existingTooltip) existingTooltip.remove();

    // Crear tooltip
    const tooltip = createTooltip(step, stepIndex);
    document.body.appendChild(tooltip);

    // Highlight del target (si existe)
    if (step.target) {
        highlightElement(step.target);
    }

    // Auto-avanzar en pasos sin target
    if (!step.target && stepIndex === 0) {
        // Paso de bienvenida: auto-avanzar después de 3 segundos
        setTimeout(() => {
            if (onboardingState.active && onboardingState.currentStep === stepIndex) {
                nextOnboardingStep();
            }
        }, 3000);
    }
}

/**
 * Crear tooltip de paso
 */
function createTooltip(step, stepIndex) {
    const tooltip = document.createElement('div');
    tooltip.id = 'onboarding-tooltip';

    // Calcular posición según target
    let position = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    if (step.target) {
        const targetEl = document.querySelector(step.target);
        if (targetEl) {
            const rect = targetEl.getBoundingClientRect();
            position = {
                top: (rect.bottom + 20) + 'px',
                left: rect.left + 'px',
                transform: 'none'
            };

            // Si está muy abajo, ponerlo arriba
            if (rect.bottom > window.innerHeight - 200) {
                position.top = (rect.top - 220) + 'px';
            }
        }
    }

    tooltip.style.cssText = `
        position: fixed;
        top: ${position.top};
        left: ${position.left};
        transform: ${position.transform};
        background: white;
        padding: 24px;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
        z-index: 9999;
        max-width: 400px;
        animation: slideIn 0.3s ease-out;
    `;

    const totalSteps = onboardingState.steps.length - 1; // -1 porque el último es "complete"
    const progress = Math.round((stepIndex / totalSteps) * 100);

    tooltip.innerHTML = `
        <!-- Progress Bar -->
        <div style="height: 4px; background: #e5e7eb; border-radius: 2px; margin-bottom: 20px;">
            <div style="height: 100%; width: ${progress}%; background: linear-gradient(135deg, #10b981 0%, #047857 100%); border-radius: 2px; transition: width 0.3s;"></div>
        </div>

        <!-- Content -->
        <div style="margin-bottom: 20px;">
            <div style="font-size: 12px; color: #10b981; font-weight: 700; margin-bottom: 8px; text-transform: uppercase;">
                ${stepIndex === 0 ? 'Introducción' : `Paso ${stepIndex} de ${totalSteps}`}
            </div>
            <h3 style="font-size: 22px; font-weight: 800; color: #111; margin: 0 0 12px 0;">
                ${step.title}
            </h3>
            <p style="font-size: 15px; color: #666; margin: 0; line-height: 1.5;">
                ${step.description}
            </p>
            ${step.action ? `
                <div style="background: #f0fdf4; padding: 12px; border-radius: 8px; margin-top: 12px; border-left: 3px solid #10b981;">
                    <div style="font-size: 14px; color: #047857;">
                        <strong>👉 ${step.action}</strong>
                    </div>
                </div>
            ` : ''}
        </div>

        <!-- Actions -->
        <div style="display: flex; gap: 10px; justify-content: space-between;">
            <button onclick="skipOnboarding()" style="background: transparent; color: #666; border: none; padding: 10px 16px; cursor: pointer; font-size: 14px; text-decoration: underline;">
                Saltar tour
            </button>
            <div style="display: flex; gap: 10px;">
                ${stepIndex > 0 ? `
                    <button onclick="previousOnboardingStep()" style="background: #e5e7eb; color: #374151; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer;">
                        Anterior
                    </button>
                ` : ''}
                ${step.target ? `
                    <button onclick="nextOnboardingStep()" style="background: #e5e7eb; color: #374151; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer;">
                        Entendido
                    </button>
                ` : (stepIndex < totalSteps ? `
                    <button onclick="nextOnboardingStep()" style="background: linear-gradient(135deg, #10b981 0%, #047857 100%); color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                        Comenzar
                    </button>
                ` : `
                    <button onclick="completeOnboarding()" style="background: linear-gradient(135deg, #10b981 0%, #047857 100%); color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                        ¡Listo!
                    </button>
                `)}
            </div>
        </div>
    `;

    // Agregar animación CSS
    if (!document.getElementById('onboarding-styles')) {
        const style = document.createElement('style');
        style.id = 'onboarding-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: ${position.transform} translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: ${position.transform} translateY(0);
                }
            }

            @keyframes pulse {
                0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
                50% { box-shadow: 0 0 0 15px rgba(16, 185, 129, 0); }
            }

            .onboarding-highlight {
                position: relative;
                z-index: 9999 !important;
                animation: pulse 2s infinite;
                border-radius: 8px;
            }
        `;
        document.head.appendChild(style);
    }

    return tooltip;
}

/**
 * Highlight de elemento target
 */
function highlightElement(selector) {
    // Remover highlight anterior
    document.querySelectorAll('.onboarding-highlight').forEach(el => {
        el.classList.remove('onboarding-highlight');
    });

    // Agregar nuevo highlight
    const element = document.querySelector(selector);
    if (element) {
        element.classList.add('onboarding-highlight');

        // Scroll suave al elemento
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

/**
 * Siguiente paso
 */
function nextOnboardingStep() {
    const nextStep = onboardingState.currentStep + 1;

    if (nextStep < onboardingState.steps.length) {
        showOnboardingStep(nextStep);

        // Analytics
        if (window.gtag) {
            gtag('event', 'onboarding_step_completed', {
                event_category: 'engagement',
                step_number: onboardingState.currentStep,
                step_id: onboardingState.steps[onboardingState.currentStep].id
            });
        }
    } else {
        completeOnboarding();
    }
}

/**
 * Paso anterior
 */
function previousOnboardingStep() {
    const prevStep = onboardingState.currentStep - 1;
    if (prevStep >= 0) {
        showOnboardingStep(prevStep);
    }
}

/**
 * Saltar onboarding
 */
function skipOnboarding() {
    if (confirm('¿Seguro que quieres saltar el tour? Puedes volver a verlo desde Ayuda.')) {
        cleanupOnboarding();

        // Marcar como completado (aunque no lo terminó)
        localStorage.setItem('claudia_onboarding_completed', 'skipped');

        // Analytics
        if (window.gtag) {
            gtag('event', 'onboarding_skipped', {
                event_category: 'engagement',
                step_number: onboardingState.currentStep
            });
        }

        if (typeof showToast === 'function') {
            showToast('Tour saltado. Puedes reiniciarlo desde Ayuda.', 'info');
        }
    }
}

/**
 * Completar onboarding
 */
function completeOnboarding() {
    cleanupOnboarding();

    // Marcar como completado
    localStorage.setItem('claudia_onboarding_completed', 'true');
    onboardingState.completed = true;

    // Analytics
    if (window.gtag) {
        gtag('event', 'onboarding_completed', {
            event_category: 'engagement',
            event_label: 'interactive_tour'
        });
    }

    // Mostrar mensaje de éxito
    if (typeof showToast === 'function') {
        showToast('🎉 ¡Tour completado! Ya estás listo para presupuestar.', 'success');
    }

    // Mostrar confetti (si existe la librería)
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    }
}

/**
 * Limpiar elementos del onboarding
 */
function cleanupOnboarding() {
    onboardingState.active = false;

    // Remover overlay
    const overlay = document.getElementById('onboarding-overlay');
    if (overlay) overlay.remove();

    // Remover tooltip
    const tooltip = document.getElementById('onboarding-tooltip');
    if (tooltip) tooltip.remove();

    // Remover highlights
    document.querySelectorAll('.onboarding-highlight').forEach(el => {
        el.classList.remove('onboarding-highlight');
    });
}

/**
 * Reiniciar onboarding (desde menú de ayuda)
 */
function restartOnboarding() {
    localStorage.removeItem('claudia_onboarding_completed');
    startOnboarding();
}

/**
 * Detectar automaticamente progreso del usuario
 * y avanzar el onboarding
 */
function trackOnboardingProgress() {
    if (!onboardingState.active) return;

    const currentStep = onboardingState.steps[onboardingState.currentStep];

    // Paso 1: Crear proyecto
    if (currentStep.id === 'create_project') {
        // Escuchar cuando se cree un proyecto
        const originalCreateProject = window.createNewProject;
        if (originalCreateProject) {
            window.createNewProject = function() {
                originalCreateProject();
                if (onboardingState.active && currentStep.id === 'create_project') {
                    setTimeout(() => nextOnboardingStep(), 1000);
                }
            };
        }
    }

    // Paso 2: Agregar actividad
    if (currentStep.id === 'add_activity') {
        // Escuchar cuando se agregue una actividad
        const originalAddActivity = window.addActivityToProject;
        if (originalAddActivity) {
            window.addActivityToProject = function(apuId) {
                originalAddActivity(apuId);
                if (onboardingState.active && currentStep.id === 'add_activity') {
                    setTimeout(() => nextOnboardingStep(), 1000);
                }
            };
        }
    }

    // Paso 3: Generar lista
    if (currentStep.id === 'generate_list') {
        // Escuchar cuando se genere lista de compras
        const originalShowShoppingList = window.showShoppingList;
        if (originalShowShoppingList) {
            window.showShoppingList = function() {
                originalShowShoppingList();
                if (onboardingState.active && currentStep.id === 'generate_list') {
                    setTimeout(() => nextOnboardingStep(), 2000);
                }
            };
        }
    }
}

/**
 * Mostrar tips contextuales (después del onboarding)
 */
function showContextualTip(tipId) {
    // Tips disponibles
    const tips = {
        'first_export': {
            title: '💡 Tip: Exporta tu presupuesto',
            message: 'Puedes exportar a Excel, PDF o compartir por WhatsApp.',
            action: 'Exportar',
            callback: () => { /* Abrir modal de export */ }
        },
        'upgrade_pro': {
            title: '⭐ Ahorra más con PRO',
            message: 'Compara precios entre 4 proveedores y ahorra hasta 20%.',
            action: 'Ver Planes',
            callback: () => showCheckoutModal('monthly')
        },
        'bulk_discount': {
            title: '📦 Tip: Descuentos Mayoristas',
            message: 'En compras grandes, negocia descuentos del 15-20%.',
            action: 'Ver Dashboard',
            callback: () => showSavingsDashboard()
        }
    };

    const tip = tips[tipId];
    if (!tip) return;

    // Verificar si ya vio este tip
    const seenTips = JSON.parse(localStorage.getItem('claudia_seen_tips') || '[]');
    if (seenTips.includes(tipId)) return;

    // Mostrar toast especial
    const tipToast = document.createElement('div');
    tipToast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        z-index: 9000;
        max-width: 350px;
        animation: slideInRight 0.3s ease-out;
    `;

    tipToast.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
            <h4 style="margin: 0; font-size: 16px; font-weight: 700; color: #111;">${tip.title}</h4>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #999;">×</button>
        </div>
        <p style="margin: 0 0 16px 0; font-size: 14px; color: #666; line-height: 1.5;">${tip.message}</p>
        <div style="display: flex; gap: 10px;">
            <button onclick="this.parentElement.parentElement.remove()" style="flex: 1; background: #e5e7eb; border: none; padding: 10px; border-radius: 6px; font-weight: 600; cursor: pointer;">
                Más tarde
            </button>
            <button onclick="(${tip.callback.toString()})(); this.parentElement.parentElement.remove();" style="flex: 1; background: linear-gradient(135deg, #10b981 0%, #047857 100%); color: white; border: none; padding: 10px; border-radius: 6px; font-weight: 600; cursor: pointer;">
                ${tip.action}
            </button>
        </div>
    `;

    document.body.appendChild(tipToast);

    // Marcar como visto
    seenTips.push(tipId);
    localStorage.setItem('claudia_seen_tips', JSON.stringify(seenTips));

    // Auto-remover después de 10 segundos
    setTimeout(() => {
        if (tipToast.parentElement) tipToast.remove();
    }, 10000);
}

// Inicializar onboarding cuando la página carga
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initOnboarding, 1000);
    });
} else {
    setTimeout(initOnboarding, 1000);
}

// Exportar funciones globales
window.startOnboarding = startOnboarding;
window.nextOnboardingStep = nextOnboardingStep;
window.previousOnboardingStep = previousOnboardingStep;
window.skipOnboarding = skipOnboarding;
window.completeOnboarding = completeOnboarding;
window.restartOnboarding = restartOnboarding;
window.showContextualTip = showContextualTip;
window.trackOnboardingProgress = trackOnboardingProgress;

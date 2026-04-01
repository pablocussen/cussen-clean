/**
 * CLAUDIA PRO - Sistema Freemium
 * Gestión de límites FREE vs PRO para monetización
 */

// Límites por plan
const PLAN_LIMITS = {
    free: {
        maxProjects: 3,
        maxActivitiesPerProject: 15,
        maxExportsPerMonth: 5,
        features: {
            basicAPUs: true,
            shoppingList: true,
            basicExport: true,
            priceComparison: false,  // Solo PRO
            bulkDiscounts: false,    // Solo PRO
            advancedAnalytics: false, // Solo PRO
            prioritySupport: false,   // Solo PRO
            customTemplates: false    // Solo PRO
        }
    },
    pro: {
        maxProjects: -1, // Ilimitado
        maxActivitiesPerProject: -1, // Ilimitado
        maxExportsPerMonth: -1, // Ilimitado
        features: {
            basicAPUs: true,
            shoppingList: true,
            basicExport: true,
            priceComparison: true,
            bulkDiscounts: true,
            advancedAnalytics: true,
            prioritySupport: true,
            customTemplates: true
        }
    }
};

// Estado del usuario (persistido en localStorage + Firebase)
let userPlan = {
    type: 'free', // 'free' | 'pro'
    exportsThisMonth: 0,
    projectsCount: 0,
    startDate: null
};

/**
 * Inicializar sistema freemium
 */
function initFreemium() {
    // Cargar datos del localStorage
    const stored = localStorage.getItem('claudia_user_plan');
    if (stored) {
        try {
            userPlan = JSON.parse(stored);
        } catch (e) {
            console.error('Error loading user plan:', e);
        }
    }

    // Resetear contador mensual si es nuevo mes
    const now = new Date();
    const lastReset = userPlan.startDate ? new Date(userPlan.startDate) : null;

    if (!lastReset || lastReset.getMonth() !== now.getMonth()) {
        userPlan.exportsThisMonth = 0;
        userPlan.startDate = now.toISOString();
        saveUserPlan();
    }

    // Actualizar UI según plan
    updatePlanUI();
}

/**
 * Guardar plan del usuario
 */
function saveUserPlan() {
    localStorage.setItem('claudia_user_plan', JSON.stringify(userPlan));
}

/**
 * Verificar si puede realizar acción
 */
function canPerformAction(action) {
    const limits = PLAN_LIMITS[userPlan.type];

    switch (action) {
        case 'createProject':
            if (limits.maxProjects === -1) return {allowed: true};
            const projectsCount = getAllProjects().length;
            if (projectsCount >= limits.maxProjects) {
                return {
                    allowed: false,
                    reason: `Plan FREE limitado a ${limits.maxProjects} proyectos`,
                    upgrade: true
                };
            }
            return {allowed: true};

        case 'addActivity':
            const currentActivities = currentProject?.activities?.length || 0;
            if (limits.maxActivitiesPerProject === -1) return {allowed: true};
            if (currentActivities >= limits.maxActivitiesPerProject) {
                return {
                    allowed: false,
                    reason: `Plan FREE limitado a ${limits.maxActivitiesPerProject} actividades por proyecto`,
                    upgrade: true
                };
            }
            return {allowed: true};

        case 'export':
            if (limits.maxExportsPerMonth === -1) return {allowed: true};
            if (userPlan.exportsThisMonth >= limits.maxExportsPerMonth) {
                return {
                    allowed: false,
                    reason: `Límite de ${limits.maxExportsPerMonth} exportaciones/mes alcanzado`,
                    upgrade: true
                };
            }
            return {allowed: true};

        case 'priceComparison':
        case 'bulkDiscounts':
        case 'advancedAnalytics':
            if (!limits.features[action]) {
                return {
                    allowed: false,
                    reason: 'Feature exclusivo de CLAUDIA PRO',
                    upgrade: true
                };
            }
            return {allowed: true};

        default:
            return {allowed: true};
    }
}

/**
 * Incrementar contador de uso
 */
function incrementUsage(action) {
    if (action === 'export') {
        userPlan.exportsThisMonth++;
        saveUserPlan();
        updatePlanUI();
    }
}

/**
 * Mostrar paywall cuando se alcanza límite
 */
function showPaywall(reason, featureName) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        padding: 20px;
    `;

    modal.innerHTML = `
        <div style="background: white; border-radius: 16px; max-width: 500px; width: 100%; padding: 32px; text-align: center;">
            <!-- Icon -->
            <div style="font-size: 72px; margin-bottom: 20px;">🔒</div>

            <!-- Title -->
            <h2 style="font-size: 28px; font-weight: 800; margin-bottom: 12px; color: #111;">
                ${featureName || 'Límite Alcanzado'}
            </h2>

            <!-- Reason -->
            <p style="font-size: 16px; color: #666; margin-bottom: 24px; line-height: 1.5;">
                ${reason}
            </p>

            <!-- Benefits -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; border-radius: 12px; margin-bottom: 24px; color: white; text-align: left;">
                <div style="font-size: 20px; font-weight: 700; margin-bottom: 16px; text-align: center;">
                    ✨ CLAUDIA PRO
                </div>
                <div style="display: grid; gap: 12px; font-size: 14px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 20px;">✅</span>
                        <span><strong>Proyectos ilimitados</strong></span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 20px;">✅</span>
                        <span><strong>Actividades ilimitadas</strong></span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 20px;">✅</span>
                        <span><strong>Comparador de precios</strong> (ahorra 15%+)</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 20px;">✅</span>
                        <span><strong>Descuentos mayoristas</strong></span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 20px;">✅</span>
                        <span><strong>Exportaciones ilimitadas</strong></span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 20px;">✅</span>
                        <span><strong>Soporte prioritario</strong></span>
                    </div>
                </div>

                <!-- Price -->
                <div style="margin-top: 20px; text-align: center; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.3);">
                    <div style="font-size: 14px; opacity: 0.9; margin-bottom: 4px;">Solo</div>
                    <div style="font-size: 36px; font-weight: 800;">$40.000/mes</div>
                    <div style="font-size: 13px; opacity: 0.8;">o $360.000/año (ahorras 25%)</div>
                </div>
            </div>

            <!-- Actions -->
            <div style="display: flex; gap: 12px; margin-bottom: 16px;">
                <button onclick="upgradeToPro()" style="flex: 1; background: linear-gradient(135deg, #10b981 0%, #047857 100%); color: white; border: none; padding: 16px; border-radius: 10px; font-weight: 700; font-size: 16px; cursor: pointer; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                    🚀 Mejorar a PRO
                </button>
            </div>

            <button onclick="this.closest('[style*=fixed]').remove()" style="background: transparent; color: #666; border: none; padding: 12px; font-size: 14px; cursor: pointer; text-decoration: underline;">
                Continuar con FREE
            </button>

            <!-- Guarantee -->
            <div style="margin-top: 20px; font-size: 12px; color: #999;">
                💰 Garantía de 30 días · Cancela cuando quieras
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Enviar email de límite alcanzado
    if (window.emailTriggers && currentUser) {
        const limitTypes = {
            'Plan FREE limitado a 3 proyectos': 'projects',
            'Plan FREE limitado a 15 actividades por proyecto': 'activities',
            'Límite de 5 exportaciones/mes alcanzado': 'exports'
        };

        const limitType = Object.entries(limitTypes).find(([msg]) =>
            reason.includes(msg)
        )?.[1] || 'projects';

        emailTriggers.limitReached({
            email: currentUser.email,
            name: currentUser.displayName || 'Maestro'
        }, limitType);
    }
}

/**
 * Actualizar UI según plan
 */
function updatePlanUI() {
    // Mostrar badge de plan en header (si existe)
    const planBadge = document.getElementById('user-plan-badge');
    if (planBadge) {
        if (userPlan.type === 'pro') {
            planBadge.innerHTML = '<span style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 700;">⭐ PRO</span>';
        } else {
            const limits = PLAN_LIMITS.free;
            const projectsLeft = limits.maxProjects - getAllProjects().length;
            planBadge.innerHTML = `<span style="background: #e5e7eb; color: #666; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">FREE (${projectsLeft} proyectos restantes)</span>`;
        }
    }
}

/**
 * Upgrade a PRO (placeholder - integrar con Stripe/MercadoPago)
 */
function upgradeToPro() {
    // TODO: Integrar con pasarela de pago
    alert('Próximamente: Integración con MercadoPago/Stripe\n\nPor ahora, contacta a soporte@claudia.app');

    // Simulación (remover en producción)
    if (confirm('¿Activar PRO modo DEMO?')) {
        userPlan.type = 'pro';
        saveUserPlan();
        updatePlanUI();
        showToast('🎉 CLAUDIA PRO activado!', 'success');
        document.querySelectorAll('[style*="fixed"]').forEach(el => el.remove());
    }
}

/**
 * Obtener todos los proyectos del localStorage
 */
function getAllProjects() {
    const keys = Object.keys(localStorage);
    const projects = keys
        .filter(k => k.startsWith('claudia_project_'))
        .map(k => {
            try {
                return JSON.parse(localStorage.getItem(k));
            } catch {
                return null;
            }
        })
        .filter(p => p !== null);

    return projects;
}

// Inicializar al cargar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFreemium);
} else {
    initFreemium();
}

// Exportar funciones globales
window.canPerformAction = canPerformAction;
window.showPaywall = showPaywall;
window.incrementUsage = incrementUsage;
window.upgradeToPro = upgradeToPro;

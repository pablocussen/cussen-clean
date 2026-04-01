/**
 * CLAUDIA PRO - Integración MercadoPago
 * Sistema de pagos para Chile y LATAM
 */

// Configuración MercadoPago (usar credenciales de producción después)
const MP_CONFIG = {
    publicKey: 'TEST-YOUR-PUBLIC-KEY-HERE', // Reemplazar con key real
    sandbox: true, // Cambiar a false en producción
    plans: {
        monthly: {
            id: 'pro_monthly',
            name: 'CLAUDIA PRO Mensual',
            price: 40000, // CLP
            currency: 'CLP',
            frequency: 'monthly',
            description: 'Proyectos ilimitados + Comparador de precios + Descuentos mayoristas'
        },
        annual: {
            id: 'pro_annual',
            name: 'CLAUDIA PRO Anual',
            price: 360000, // CLP (25% descuento vs 12 × 40.000 = 480.000)
            currency: 'CLP',
            frequency: 'annual',
            description: 'Proyectos ilimitados + Comparador de precios + Descuentos mayoristas + Ahorra 25%',
            discount: 25
        }
    }
};

/**
 * Inicializar MercadoPago SDK
 */
function initMercadoPago() {
    // Cargar SDK de MercadoPago
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.onload = () => {
        console.log('MercadoPago SDK loaded');
        if (window.MercadoPago) {
            window.mp = new MercadoPago(MP_CONFIG.publicKey, {
                locale: 'es-CL'
            });
        }
    };
    document.head.appendChild(script);
}

/**
 * Mostrar modal de checkout
 */
function showCheckoutModal(planType = 'monthly') {
    const plan = MP_CONFIG.plans[planType];

    const modal = document.createElement('div');
    modal.id = 'checkout-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10002;
        padding: 20px;
        overflow-y: auto;
    `;

    modal.innerHTML = `
        <div style="background: white; border-radius: 20px; max-width: 600px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #10b981 0%, #047857 100%); padding: 32px; border-radius: 20px 20px 0 0; text-align: center; color: white;">
                <div style="font-size: 64px; margin-bottom: 16px;">🚀</div>
                <h2 style="margin: 0 0 12px 0; font-size: 32px; font-weight: 800;">CLAUDIA PRO</h2>
                <p style="margin: 0; font-size: 16px; opacity: 0.95;">Ahorra más en cada proyecto</p>
            </div>

            <!-- Plan Details -->
            <div style="padding: 32px;">
                <!-- Selected Plan -->
                <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 24px; border-radius: 12px; margin-bottom: 24px; border: 2px solid #10b981;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <div style="font-size: 18px; font-weight: 700; color: #047857; margin-bottom: 8px;">
                            ${plan.name}
                        </div>
                        <div style="font-size: 48px; font-weight: 800; color: #059669; line-height: 1;">
                            $${plan.price.toLocaleString('es-CL')}
                        </div>
                        <div style="font-size: 14px; color: #047857; margin-top: 4px;">
                            CLP/${plan.frequency === 'monthly' ? 'mes' : 'año'}
                        </div>
                        ${plan.discount ? `<div style="background: #fbbf24; color: white; display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; margin-top: 8px;">🎉 Ahorras ${plan.discount}%</div>` : ''}
                    </div>

                    <!-- Features -->
                    <div style="display: grid; gap: 10px; margin-top: 20px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 20px;">✅</span>
                            <span style="font-size: 14px; color: #065f46;"><strong>Proyectos ilimitados</strong></span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 20px;">✅</span>
                            <span style="font-size: 14px; color: #065f46;"><strong>Actividades ilimitadas</strong></span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 20px;">✅</span>
                            <span style="font-size: 14px; color: #065f46;"><strong>Comparador de precios</strong> (ahorra 15%+)</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 20px;">✅</span>
                            <span style="font-size: 14px; color: #065f46;"><strong>Descuentos mayoristas</strong></span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 20px;">✅</span>
                            <span style="font-size: 14px; color: #065f46;"><strong>Exportaciones ilimitadas</strong></span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 20px;">✅</span>
                            <span style="font-size: 14px; color: #065f46;"><strong>Soporte prioritario</strong></span>
                        </div>
                    </div>
                </div>

                <!-- Plan Toggle -->
                <div style="display: flex; gap: 12px; margin-bottom: 24px; background: #f3f4f6; padding: 8px; border-radius: 10px;">
                    <button
                        onclick="switchPlan('monthly')"
                        id="btn-monthly"
                        style="flex: 1; padding: 12px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s; ${planType === 'monthly' ? 'background: white; color: #10b981; box-shadow: 0 2px 8px rgba(0,0,0,0.1);' : 'background: transparent; color: #6b7280;'}"
                    >
                        Mensual<br>
                        <span style="font-size: 12px; opacity: 0.8;">$9.990/mes</span>
                    </button>
                    <button
                        onclick="switchPlan('annual')"
                        id="btn-annual"
                        style="flex: 1; padding: 12px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s; position: relative; ${planType === 'annual' ? 'background: white; color: #10b981; box-shadow: 0 2px 8px rgba(0,0,0,0.1);' : 'background: transparent; color: #6b7280;'}"
                    >
                        <span style="position: absolute; top: -8px; right: 8px; background: #fbbf24; color: white; font-size: 10px; padding: 2px 6px; border-radius: 10px; font-weight: 700;">-25%</span>
                        Anual<br>
                        <span style="font-size: 12px; opacity: 0.8;">$89.990/año</span>
                    </button>
                </div>

                <!-- Payment Form -->
                <div id="payment-form">
                    <!-- MercadoPago Checkout Pro -->
                    <div id="mercadopago-button"></div>

                    <!-- OR DIV -->
                    <div style="text-align: center; margin: 20px 0; color: #9ca3af; font-size: 14px;">
                        - o -
                    </div>

                    <!-- Métodos Alternativos -->
                    <div style="display: grid; gap: 10px;">
                        <button onclick="payWithTransfer()" style="width: 100%; padding: 14px; background: #3b82f6; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;">
                            <span style="font-size: 20px;">🏦</span>
                            <span>Pagar con Transferencia</span>
                        </button>
                        <button onclick="requestInvoice()" style="width: 100%; padding: 14px; background: #6b7280; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;">
                            <span style="font-size: 20px;">📄</span>
                            <span>Solicitar Factura</span>
                        </button>
                    </div>
                </div>

                <!-- Security & Guarantee -->
                <div style="margin-top: 24px; text-align: center;">
                    <div style="display: flex; justify-content: center; align-items: center; gap: 16px; margin-bottom: 12px; color: #6b7280; font-size: 13px;">
                        <span>🔒 Pago seguro</span>
                        <span>•</span>
                        <span>💰 Garantía 30 días</span>
                        <span>•</span>
                        <span>🚫 Cancela cuando quieras</span>
                    </div>
                    <div style="font-size: 12px; color: #9ca3af;">
                        Procesado por MercadoPago · Datos encriptados
                    </div>
                </div>

                <!-- Close Button -->
                <button onclick="closeCheckoutModal()" style="width: 100%; margin-top: 16px; padding: 12px; background: #f3f4f6; color: #6b7280; border: none; border-radius: 10px; font-weight: 600; cursor: pointer;">
                    Volver
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Inicializar botón de MercadoPago
    initMercadoPagoButton(planType);
}

/**
 * Inicializar botón de MercadoPago
 */
function initMercadoPagoButton(planType) {
    // TODO: Implementar con credenciales reales
    // Por ahora, mostrar botón demo
    const container = document.getElementById('mercadopago-button');
    container.innerHTML = `
        <button onclick="processMercadoPagoPayment('${planType}')" style="width: 100%; padding: 16px; background: linear-gradient(135deg, #00b4d8 0%, #0077b6 100%); color: white; border: none; border-radius: 10px; font-weight: 700; font-size: 16px; cursor: pointer; box-shadow: 0 4px 12px rgba(0, 119, 182, 0.3);">
            <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
                <span style="font-size: 24px;">💳</span>
                <span>Pagar con MercadoPago</span>
            </div>
        </button>
    `;
}

/**
 * Procesar pago con MercadoPago
 */
async function processMercadoPagoPayment(planType) {
    const plan = MP_CONFIG.plans[planType];

    showToast('Procesando pago...', 'info');

    // TODO: Llamar a tu backend para crear preference
    // const preference = await createPaymentPreference(plan);

    // Demo: Simular pago exitoso
    setTimeout(() => {
        // Activar PRO
        userPlan.type = 'pro';
        userPlan.planType = planType;
        userPlan.startDate = new Date().toISOString();
        userPlan.paymentMethod = 'mercadopago';
        saveUserPlan();

        closeCheckoutModal();
        showSuccessModal();
        updatePlanUI();

        // Enviar emails de confirmación
        if (window.emailTriggers) {
            emailTriggers.paymentConfirmation({
                email: currentUser?.email || 'usuario@ejemplo.com',
                planType: planType,
                transactionId: 'DEMO_' + Date.now(),
                paymentMethod: 'MercadoPago'
            });

            emailTriggers.upgradeSuccess({
                email: currentUser?.email || 'usuario@ejemplo.com',
                name: currentUser?.displayName || 'Maestro'
            });
        }

        // Analytics
        if (window.gtag) {
            gtag('event', 'purchase', {
                transaction_id: 'DEMO_' + Date.now(),
                value: plan.price,
                currency: plan.currency,
                items: [{
                    item_id: plan.id,
                    item_name: plan.name,
                    price: plan.price,
                    quantity: 1
                }]
            });
        }
    }, 2000);
}

/**
 * Pago con transferencia
 */
function payWithTransfer() {
    alert(`📧 Envía un email a pagos@claudia.app con:

• Tu email registrado
• Plan elegido (Mensual/Anual)
• Comprobante de transferencia

Datos de transferencia:
Banco: Santander
Cuenta Corriente: 12345678
RUT: 12.345.678-9
Email: pagos@claudia.app

Te activaremos el PRO en 24hrs.`);
}

/**
 * Solicitar factura
 */
function requestInvoice() {
    alert(`📄 Para factura, contacta a:

Email: facturacion@claudia.app
WhatsApp: +56 9 1234 5678

Envía:
• RUT de tu empresa
• Razón social
• Giro
• Dirección

Te enviaremos cotización formal.`);
}

/**
 * Cerrar modal de checkout
 */
function closeCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    if (modal) modal.remove();
}

/**
 * Cambiar entre planes
 */
function switchPlan(planType) {
    closeCheckoutModal();
    showCheckoutModal(planType);
}

/**
 * Modal de éxito post-pago
 */
function showSuccessModal() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10003;
        padding: 20px;
    `;

    modal.innerHTML = `
        <div style="background: white; border-radius: 20px; max-width: 500px; width: 100%; padding: 40px; text-align: center;">
            <div style="font-size: 80px; margin-bottom: 20px;">🎉</div>
            <h2 style="font-size: 32px; font-weight: 800; margin-bottom: 16px; color: #059669;">¡Bienvenido a PRO!</h2>
            <p style="font-size: 16px; color: #666; margin-bottom: 24px; line-height: 1.6;">
                Tu cuenta ha sido activada exitosamente.<br>
                Ahora puedes acceder a todas las funciones premium.
            </p>

            <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; margin-bottom: 24px; text-align: left;">
                <div style="font-weight: 700; margin-bottom: 12px; color: #047857;">✨ Ahora tienes acceso a:</div>
                <div style="font-size: 14px; color: #065f46; display: grid; gap: 8px;">
                    <div>✅ Proyectos ilimitados</div>
                    <div>✅ Comparador de precios</div>
                    <div>✅ Descuentos mayoristas</div>
                    <div>✅ Exportaciones ilimitadas</div>
                    <div>✅ Soporte prioritario</div>
                </div>
            </div>

            <button onclick="this.closest('[style*=fixed]').remove()" style="width: 100%; padding: 16px; background: linear-gradient(135deg, #10b981 0%, #047857 100%); color: white; border: none; border-radius: 10px; font-weight: 700; font-size: 16px; cursor: pointer;">
                ¡Empezar a Usar PRO!
            </button>

            <div style="margin-top: 16px; font-size: 13px; color: #9ca3af;">
                Recibirás un email de confirmación
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Enviar email de bienvenida
    sendWelcomeEmail();
}

/**
 * Enviar email de bienvenida (placeholder)
 */
function sendWelcomeEmail() {
    // TODO: Integrar con SendGrid/Mailgun
    console.log('Sending welcome email...');
}

// Reemplazar función upgradeToPro existente
window.upgradeToPro = function() {
    showCheckoutModal('monthly');
};

// Inicializar MercadoPago al cargar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMercadoPago);
} else {
    initMercadoPago();
}

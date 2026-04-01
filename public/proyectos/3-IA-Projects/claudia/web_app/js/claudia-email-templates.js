/**
 * CLAUDIA PRO - Email Marketing System
 * Templates y lógica para emails transaccionales
 * Integrado con SendGrid (o Mailgun como alternativa)
 */

// Configuración de Email Service (SendGrid)
const EMAIL_CONFIG = {
    provider: 'sendgrid', // 'sendgrid' o 'mailgun'
    apiKey: 'SG.YOUR_SENDGRID_API_KEY_HERE', // Reemplazar en producción
    fromEmail: 'hola@claudia.app',
    fromName: 'CLAUDIA PRO',
    replyTo: 'soporte@claudia.app',
    baseUrl: 'https://claudia-i8bxh.web.app',
    demoMode: true // Simula envío sin API real
};

/**
 * PLANTILLA BASE HTML (responsive)
 */
function getEmailBaseTemplate(bodyContent) {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f3f4f6;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
        }
        .header {
            background: linear-gradient(135deg, #10b981 0%, #047857 100%);
            padding: 32px 24px;
            text-align: center;
        }
        .logo {
            font-size: 32px;
            font-weight: 900;
            color: white;
            margin: 0;
        }
        .content {
            padding: 40px 24px;
        }
        .footer {
            background: #111;
            color: #999;
            padding: 24px;
            text-align: center;
            font-size: 12px;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #10b981 0%, #047857 100%);
            color: white;
            padding: 16px 32px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 700;
            margin: 20px 0;
        }
        .stats {
            background: #f9fafb;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        .stat-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .stat-row:last-child {
            border-bottom: none;
        }
        h1 { font-size: 28px; color: #111; margin-bottom: 16px; }
        h2 { font-size: 22px; color: #111; margin-bottom: 12px; }
        p { font-size: 16px; line-height: 1.6; color: #374151; }
        .highlight { background: #fef3c7; padding: 2px 6px; border-radius: 4px; }
        .emoji { font-size: 48px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1 class="logo">💼 CLAUDIA PRO</h1>
        </div>
        <div class="content">
            ${bodyContent}
        </div>
        <div class="footer">
            <p>CLAUDIA PRO - Presupuestos Inteligentes de Construcción</p>
            <p style="margin-top: 12px;">
                <a href="${EMAIL_CONFIG.baseUrl}" style="color: #10b981; text-decoration: none;">Ir a la App</a> ·
                <a href="${EMAIL_CONFIG.baseUrl}/ayuda" style="color: #10b981; text-decoration: none;">Ayuda</a> ·
                <a href="mailto:${EMAIL_CONFIG.replyTo}" style="color: #10b981; text-decoration: none;">Soporte</a>
            </p>
            <p style="margin-top: 16px; font-size: 11px; color: #666;">
                ¿No quieres recibir estos emails? <a href="#" style="color: #666;">Darse de baja</a>
            </p>
        </div>
    </div>
</body>
</html>
    `;
}

/**
 * EMAIL 1: Bienvenida (Welcome Email)
 */
function getWelcomeEmail(userData) {
    const body = `
        <div class="emoji">👋</div>
        <h1>¡Bienvenido a CLAUDIA PRO, ${userData.name || 'Maestro'}!</h1>

        <p>Estamos emocionados de tenerte aquí. Ahora puedes presupuestar obras como un profesional usando nuestros <strong>816 APUs completos en 24 categorías</strong>.</p>

        <h2>🚀 Primeros Pasos</h2>
        <p>Para empezar a usar CLAUDIA PRO:</p>
        <ol style="line-height: 2;">
            <li><strong>Crea tu primer proyecto</strong> - Dale un nombre a tu obra</li>
            <li><strong>Agrega actividades</strong> - Selecciona APUs del navegador</li>
            <li><strong>Genera lista de compras</strong> - Copia y comparte por WhatsApp</li>
        </ol>

        <div style="text-align: center;">
            <a href="${EMAIL_CONFIG.baseUrl}" class="button">🏗️ Crear Mi Primer Proyecto</a>
        </div>

        <div class="stats">
            <h3 style="margin-top: 0;">Tu Plan Actual: <span class="highlight">FREE</span></h3>
            <div class="stat-row">
                <span>Proyectos disponibles</span>
                <strong>3</strong>
            </div>
            <div class="stat-row">
                <span>Actividades por proyecto</span>
                <strong>15</strong>
            </div>
            <div class="stat-row">
                <span>Exportaciones este mes</span>
                <strong>5</strong>
            </div>
        </div>

        <p style="font-size: 14px; color: #666; margin-top: 24px;">
            💡 <strong>Tip:</strong> Con el plan PRO puedes ahorrar hasta 20% en materiales usando nuestro comparador de precios automático.
        </p>

        <p>¿Necesitas ayuda? Responde este email o escríbenos a <a href="mailto:${EMAIL_CONFIG.replyTo}">${EMAIL_CONFIG.replyTo}</a></p>

        <p style="margin-top: 32px;">¡A construir! 🏗️<br><strong>El equipo de CLAUDIA PRO</strong></p>
    `;

    return {
        to: userData.email,
        subject: '👋 Bienvenido a CLAUDIA PRO - Tus primeros pasos',
        html: getEmailBaseTemplate(body)
    };
}

/**
 * EMAIL 2: Confirmación de Pago
 */
function getPaymentConfirmationEmail(paymentData) {
    const planName = paymentData.planType === 'annual' ? 'Anual' : 'Mensual';
    const amount = paymentData.planType === 'annual' ? '$360.000' : '$40.000';

    const body = `
        <div class="emoji">🎉</div>
        <h1>¡Pago Confirmado!</h1>

        <p>Gracias por confiar en CLAUDIA PRO. Tu pago ha sido procesado exitosamente.</p>

        <div class="stats">
            <h3 style="margin-top: 0;">Detalles de tu Compra</h3>
            <div class="stat-row">
                <span>Plan</span>
                <strong>CLAUDIA PRO ${planName}</strong>
            </div>
            <div class="stat-row">
                <span>Monto</span>
                <strong>${amount} CLP</strong>
            </div>
            <div class="stat-row">
                <span>Fecha</span>
                <strong>${new Date().toLocaleDateString('es-CL')}</strong>
            </div>
            <div class="stat-row">
                <span>ID de Transacción</span>
                <strong>${paymentData.transactionId || 'MP-' + Date.now()}</strong>
            </div>
            <div class="stat-row">
                <span>Método de pago</span>
                <strong>${paymentData.paymentMethod || 'MercadoPago'}</strong>
            </div>
        </div>

        <p>Tu factura electrónica estará disponible en las próximas 24 horas en tu panel de usuario.</p>

        <div style="text-align: center;">
            <a href="${EMAIL_CONFIG.baseUrl}" class="button">📊 Ver Mi Panel PRO</a>
        </div>

        <p style="margin-top: 32px;">Si tienes alguna pregunta sobre tu pago, contáctanos en <a href="mailto:${EMAIL_CONFIG.replyTo}">${EMAIL_CONFIG.replyTo}</a></p>

        <p style="margin-top: 32px;">Gracias por tu confianza,<br><strong>El equipo de CLAUDIA PRO</strong></p>
    `;

    return {
        to: paymentData.email,
        subject: '🎉 Pago Confirmado - CLAUDIA PRO',
        html: getEmailBaseTemplate(body)
    };
}

/**
 * EMAIL 3: Upgrade a PRO Exitoso
 */
function getUpgradeSuccessEmail(userData) {
    const body = `
        <div class="emoji">⭐</div>
        <h1>¡Bienvenido a CLAUDIA PRO!</h1>

        <p>Tu cuenta ha sido actualizada exitosamente. Ahora tienes acceso a todas las funcionalidades premium.</p>

        <h2>🚀 Nuevas Funcionalidades Desbloqueadas</h2>

        <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; font-weight: 600; color: #047857;">✅ Proyectos ilimitados</p>
        </div>

        <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; font-weight: 600; color: #047857;">✅ Actividades ilimitadas por proyecto</p>
        </div>

        <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; font-weight: 600; color: #047857;">✅ Comparador de precios entre 4 proveedores</p>
        </div>

        <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; font-weight: 600; color: #047857;">✅ Dashboard de ahorro con descuentos mayoristas</p>
        </div>

        <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; font-weight: 600; color: #047857;">✅ Exportaciones ilimitadas</p>
        </div>

        <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; font-weight: 600; color: #047857;">✅ Soporte prioritario</p>
        </div>

        <div style="text-align: center; margin: 32px 0;">
            <a href="${EMAIL_CONFIG.baseUrl}" class="button">🏪 Comparar Precios Ahora</a>
        </div>

        <div style="background: #fef3c7; padding: 20px; border-radius: 10px; margin-top: 24px;">
            <h3 style="margin-top: 0; color: #92400e;">💡 Consejo PRO</h3>
            <p style="margin: 0; color: #78350f;">Usa el <strong>Comparador de Precios</strong> en tu próximo proyecto para ahorrar hasta 20% en materiales. En promedio, nuestros usuarios PRO ahorran $150.000 por proyecto.</p>
        </div>

        <p style="margin-top: 32px;">¿Dudas? Estamos aquí para ayudarte: <a href="mailto:${EMAIL_CONFIG.replyTo}">${EMAIL_CONFIG.replyTo}</a></p>

        <p style="margin-top: 32px;">¡Aprovecha al máximo tu cuenta PRO! 🚀<br><strong>El equipo de CLAUDIA PRO</strong></p>
    `;

    return {
        to: userData.email,
        subject: '⭐ ¡Bienvenido a CLAUDIA PRO! Todas las funciones desbloqueadas',
        html: getEmailBaseTemplate(body)
    };
}

/**
 * EMAIL 4: Resumen Mensual de Uso
 */
function getMonthlyUsageSummaryEmail(userData, stats) {
    const savingsText = stats.estimatedSavings > 0
        ? `<strong style="color: #10b981;">$${stats.estimatedSavings.toLocaleString('es-CL')}</strong>`
        : 'N/A';

    const body = `
        <div class="emoji">📊</div>
        <h1>Resumen de ${stats.month}</h1>

        <p>Hola ${userData.name || 'Maestro'}, aquí está tu actividad del mes pasado en CLAUDIA PRO.</p>

        <div class="stats">
            <h3 style="margin-top: 0;">Tu Actividad este Mes</h3>
            <div class="stat-row">
                <span>Proyectos creados</span>
                <strong>${stats.projectsCreated}</strong>
            </div>
            <div class="stat-row">
                <span>Actividades agregadas</span>
                <strong>${stats.activitiesAdded}</strong>
            </div>
            <div class="stat-row">
                <span>Listas de compras generadas</span>
                <strong>${stats.shoppingListsGenerated}</strong>
            </div>
            <div class="stat-row">
                <span>Comparaciones de precios</span>
                <strong>${stats.priceComparisons || 0}</strong>
            </div>
            <div class="stat-row">
                <span>Ahorro estimado</span>
                <strong>${savingsText}</strong>
            </div>
        </div>

        ${stats.topAPUs && stats.topAPUs.length > 0 ? `
        <h2>🏆 Tus APUs Más Usados</h2>
        <ol style="line-height: 2;">
            ${stats.topAPUs.slice(0, 5).map(apu => `<li>${apu.nombre} (${apu.uses} veces)</li>`).join('')}
        </ol>
        ` : ''}

        ${userData.plan === 'free' ? `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; border-radius: 12px; margin-top: 24px; color: white; text-align: center;">
            <h3 style="color: white; margin-top: 0;">💎 Mejora a PRO y Ahorra Más</h3>
            <p style="color: rgba(255,255,255,0.9);">Con CLAUDIA PRO podrías haber ahorrado aproximadamente <strong>${formatMoney((stats.estimatedSavings || 0) * 1.5)}</strong> este mes usando el comparador de precios.</p>
            <a href="${EMAIL_CONFIG.baseUrl}?upgrade=true" style="display: inline-block; background: white; color: #667eea; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; margin-top: 12px;">Ver Planes PRO</a>
        </div>
        ` : ''}

        <div style="text-align: center; margin-top: 32px;">
            <a href="${EMAIL_CONFIG.baseUrl}" class="button">🏗️ Continuar Presupuestando</a>
        </div>

        <p style="margin-top: 32px;">Gracias por usar CLAUDIA PRO,<br><strong>El equipo de CLAUDIA PRO</strong></p>
    `;

    return {
        to: userData.email,
        subject: `📊 Tu resumen de ${stats.month} en CLAUDIA PRO`,
        html: getEmailBaseTemplate(body)
    };
}

/**
 * EMAIL 5: Recordatorio de Vencimiento (3 días antes)
 */
function getExpirationReminderEmail(userData, daysLeft) {
    const body = `
        <div class="emoji">⏰</div>
        <h1>Tu suscripción vence en ${daysLeft} días</h1>

        <p>Hola ${userData.name || 'Maestro'},</p>

        <p>Solo un recordatorio amigable: tu suscripción a <strong>CLAUDIA PRO</strong> vence el <strong>${userData.expirationDate}</strong>.</p>

        <div style="background: #fef3c7; padding: 20px; border-radius: 10px; margin: 24px 0; border: 2px solid #f59e0b;">
            <h3 style="margin-top: 0; color: #92400e;">¿Qué pasará cuando venza?</h3>
            <p style="margin: 0; color: #78350f;">
                Tu cuenta volverá al plan FREE, lo que significa:<br>
                • Límite de 3 proyectos<br>
                • Sin comparador de precios<br>
                • Sin descuentos mayoristas<br>
                • Máximo 5 exportaciones/mes
            </p>
        </div>

        <h2>🎯 Renueva Ahora y Mantén Tus Beneficios</h2>

        <div style="text-align: center; margin: 32px 0;">
            <a href="${EMAIL_CONFIG.baseUrl}?renew=true" class="button">💳 Renovar Mi Suscripción</a>
        </div>

        <div style="background: #d1fae5; padding: 20px; border-radius: 10px; margin-top: 24px; border: 2px solid #10b981;">
            <h3 style="margin-top: 0; color: #047857;">💰 Oferta Especial de Renovación</h3>
            <p style="margin: 0; color: #065f46;">
                Renueva por 1 año y obtén <strong>25% de descuento</strong> ($360.000 en lugar de $480.000)
            </p>
        </div>

        <p style="margin-top: 32px;">Si tienes preguntas, contáctanos en <a href="mailto:${EMAIL_CONFIG.replyTo}">${EMAIL_CONFIG.replyTo}</a></p>

        <p style="margin-top: 32px;">Esperamos seguir ayudándote a presupuestar mejor,<br><strong>El equipo de CLAUDIA PRO</strong></p>
    `;

    return {
        to: userData.email,
        subject: `⏰ Tu CLAUDIA PRO vence en ${daysLeft} días`,
        html: getEmailBaseTemplate(body)
    };
}

/**
 * EMAIL 6: Límite Alcanzado (Free Plan)
 */
function getLimitReachedEmail(userData, limitType) {
    const limitMessages = {
        projects: {
            title: 'Alcanzaste el límite de proyectos',
            message: 'Has creado 3 proyectos, el máximo del plan FREE.'
        },
        activities: {
            title: 'Alcanzaste el límite de actividades',
            message: 'Tu proyecto tiene 15 actividades, el máximo del plan FREE.'
        },
        exports: {
            title: 'Alcanzaste el límite de exportaciones',
            message: 'Ya usaste tus 5 exportaciones gratuitas este mes.'
        }
    };

    const limit = limitMessages[limitType] || limitMessages.projects;

    const body = `
        <div class="emoji">🔒</div>
        <h1>${limit.title}</h1>

        <p>Hola ${userData.name || 'Maestro'},</p>

        <p>${limit.message}</p>

        <div style="background: #fef3c7; padding: 20px; border-radius: 10px; margin: 24px 0;">
            <p style="margin: 0; color: #78350f; font-size: 15px;">
                <strong>¿Necesitas más?</strong> Con CLAUDIA PRO obtienes acceso ilimitado a todas las funcionalidades.
            </p>
        </div>

        <h2>✨ CLAUDIA PRO Incluye:</h2>

        <ul style="line-height: 2; font-size: 16px;">
            <li><strong>Proyectos ilimitados</strong></li>
            <li><strong>Actividades ilimitadas</strong></li>
            <li><strong>Exportaciones ilimitadas</strong></li>
            <li><strong>Comparador de precios</strong> (ahorra 15%+)</li>
            <li><strong>Descuentos mayoristas</strong></li>
            <li><strong>Soporte prioritario</strong></li>
        </ul>

        <div style="text-align: center; margin: 32px 0;">
            <a href="${EMAIL_CONFIG.baseUrl}?upgrade=true" class="button">🚀 Mejorar a PRO - Solo $40.000/mes</a>
        </div>

        <div style="background: #d1fae5; padding: 20px; border-radius: 10px; margin-top: 24px; text-align: center;">
            <p style="margin: 0; color: #047857; font-weight: 600;">
                💰 Usuarios PRO ahorran en promedio $150.000 por proyecto
            </p>
        </div>

        <p style="margin-top: 32px; font-size: 14px; color: #666;">
            💡 <strong>Prueba 7 días gratis</strong> - Sin compromiso, cancela cuando quieras
        </p>

        <p style="margin-top: 32px;">¿Preguntas? Escríbenos a <a href="mailto:${EMAIL_CONFIG.replyTo}">${EMAIL_CONFIG.replyTo}</a></p>

        <p style="margin-top: 32px;">Saludos,<br><strong>El equipo de CLAUDIA PRO</strong></p>
    `;

    return {
        to: userData.email,
        subject: `🔒 ${limit.title} - CLAUDIA PRO`,
        html: getEmailBaseTemplate(body)
    };
}

/**
 * Enviar Email (función principal)
 */
async function sendEmail(emailData) {
    if (EMAIL_CONFIG.demoMode) {
        // Modo DEMO: Solo log en consola
        console.log('📧 [DEMO] Email enviado:', {
            to: emailData.to,
            subject: emailData.subject,
            timestamp: new Date().toISOString()
        });

        // Mostrar toast al usuario
        if (typeof showToast === 'function') {
            showToast(`📧 Email enviado: ${emailData.subject}`, 'success');
        }

        return { success: true, messageId: 'demo-' + Date.now() };
    }

    // PRODUCCIÓN: Enviar vía SendGrid
    try {
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${EMAIL_CONFIG.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                personalizations: [{
                    to: [{ email: emailData.to }]
                }],
                from: {
                    email: EMAIL_CONFIG.fromEmail,
                    name: EMAIL_CONFIG.fromName
                },
                reply_to: {
                    email: EMAIL_CONFIG.replyTo
                },
                subject: emailData.subject,
                content: [{
                    type: 'text/html',
                    value: emailData.html
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`SendGrid error: ${response.status}`);
        }

        return { success: true, messageId: response.headers.get('x-message-id') };

    } catch (error) {
        console.error('Error enviando email:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Helper para formatear dinero
 */
function formatMoney(amount) {
    return '$' + Math.round(amount).toLocaleString('es-CL');
}

/**
 * TRIGGERS: Enviar emails en eventos clave
 */

// Trigger 1: Después de registro
function triggerWelcomeEmail(userData) {
    const email = getWelcomeEmail(userData);
    sendEmail(email);
}

// Trigger 2: Después de pago exitoso
function triggerPaymentConfirmation(paymentData) {
    const email = getPaymentConfirmationEmail(paymentData);
    sendEmail(email);
}

// Trigger 3: Después de upgrade a PRO
function triggerUpgradeSuccess(userData) {
    const email = getUpgradeSuccessEmail(userData);
    sendEmail(email);
}

// Trigger 4: Resumen mensual (ejecutar con cron job)
function triggerMonthlyUsageSummary(userData, stats) {
    const email = getMonthlyUsageSummaryEmail(userData, stats);
    sendEmail(email);
}

// Trigger 5: Recordatorio de vencimiento (ejecutar con cron job)
function triggerExpirationReminder(userData, daysLeft) {
    const email = getExpirationReminderEmail(userData, daysLeft);
    sendEmail(email);
}

// Trigger 6: Límite alcanzado
function triggerLimitReached(userData, limitType) {
    const email = getLimitReachedEmail(userData, limitType);
    sendEmail(email);
}

// Exportar funciones
window.emailTriggers = {
    welcome: triggerWelcomeEmail,
    paymentConfirmation: triggerPaymentConfirmation,
    upgradeSuccess: triggerUpgradeSuccess,
    monthlyUsage: triggerMonthlyUsageSummary,
    expirationReminder: triggerExpirationReminder,
    limitReached: triggerLimitReached
};

window.sendEmail = sendEmail;

// claudia-telegram-linking.js
// Sistema de vinculación Web ↔ Telegram - VERSIÓN SIMPLIFICADA
console.log('[TELEGRAM] 🚀 Inicializando módulo...');

const CLOUD_FUNCTION_URL = 'https://us-central1-claudia-i8bxh.cloudfunctions.net/claudia_handler';
let linkingCheckInterval = null;

// ===== FUNCIONES AUXILIARES =====

function getUserId() {
    let userId = localStorage.getItem('user_id');
    if (!userId) {
        userId = 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('user_id', userId);
        console.log('[TELEGRAM] 🆕 User ID generado:', userId);
    }
    return userId;
}

// ===== FUNCIONES GLOBALES PRINCIPALES =====

window.openTelegramLinking = function() {
    console.log('[TELEGRAM] 🖱️ CLICK - Abriendo modal de vinculación');

    const modal = document.getElementById('telegram-linking-modal');
    if (!modal) {
        console.error('[TELEGRAM] ❌ Modal no encontrado en DOM');
        alert('Error: Modal no encontrado. Recarga la página.');
        return;
    }

    console.log('[TELEGRAM] ✅ Modal encontrado, mostrando...');
    modal.style.display = 'flex';
    generateLinkingCode();
};

window.closeTelegramLinking = function() {
    console.log('[TELEGRAM] 🚪 Cerrando modal');
    const modal = document.getElementById('telegram-linking-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    stopLinkingCheck();
};

// ===== GENERACIÓN DE CÓDIGO =====

async function generateLinkingCode() {
    const userId = getUserId();
    const codeElement = document.getElementById('telegram-code');
    const errorElement = document.getElementById('telegram-error');

    console.log('[TELEGRAM] 📝 Generando código para user_id:', userId);

    if (!codeElement) {
        console.error('[TELEGRAM] ❌ Elemento telegram-code no encontrado');
        return;
    }

    // Loading
    codeElement.textContent = '------';
    if (errorElement) errorElement.style.display = 'none';

    try {
        console.log('[TELEGRAM] 📡 Enviando petición a Cloud Function...');

        const response = await fetch(`${CLOUD_FUNCTION_URL}/generate-linking-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId })
        });

        console.log('[TELEGRAM] 📨 Respuesta:', response.status, response.statusText);

        const data = await response.json();
        console.log('[TELEGRAM] 📦 Datos:', data);

        if (data.error) {
            throw new Error(data.error);
        }

        if (data.code) {
            codeElement.textContent = data.code;
            console.log('[TELEGRAM] ✅ Código generado:', data.code);

            startLinkingCheck(userId);

            // Expirar en 15 minutos
            setTimeout(() => {
                if (codeElement.textContent === data.code) {
                    codeElement.textContent = 'EXPIRADO';
                    console.log('[TELEGRAM] ⏰ Código expirado');
                    if (errorElement) {
                        errorElement.textContent = 'Código expirado. Genera uno nuevo.';
                        errorElement.style.display = 'block';
                    }
                    stopLinkingCheck();
                }
            }, 15 * 60 * 1000);
        }

    } catch (error) {
        console.error('[TELEGRAM] ❌ Error:', error);
        codeElement.textContent = 'ERROR';
        if (errorElement) {
            errorElement.textContent = 'Error generando código. Intenta de nuevo.';
            errorElement.style.display = 'block';
        }
    }
}

// ===== POLLING DE VINCULACIÓN =====

function startLinkingCheck(userId) {
    stopLinkingCheck(); // Limpiar cualquier intervalo anterior

    console.log('[TELEGRAM] 🔄 Iniciando polling cada 5s para user_id:', userId);

    linkingCheckInterval = setInterval(async () => {
        try {
            console.log('[TELEGRAM] 🔍 Verificando estado...');

            const response = await fetch(`${CLOUD_FUNCTION_URL}/check-telegram-status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId })
            });

            if (!response.ok) {
                console.error('[TELEGRAM] ⚠️ Error en respuesta:', response.status);
                return;
            }

            const data = await response.json();
            console.log('[TELEGRAM] 📊 Estado:', data);

            if (data.linked) {
                console.log('[TELEGRAM] 🎉 ¡VINCULACIÓN EXITOSA!');
                onLinkingSuccess(data.telegram_username);
            }

        } catch (error) {
            console.error('[TELEGRAM] ❌ Error verificando:', error);
        }
    }, 5000);

    // Timeout de 15 minutos
    setTimeout(() => {
        console.log('[TELEGRAM] ⏰ Timeout alcanzado, deteniendo polling');
        stopLinkingCheck();
    }, 15 * 60 * 1000);
}

function stopLinkingCheck() {
    if (linkingCheckInterval) {
        clearInterval(linkingCheckInterval);
        linkingCheckInterval = null;
        console.log('[TELEGRAM] ⏹️ Polling detenido');
    }
}

// ===== ÉXITO DE VINCULACIÓN =====

function onLinkingSuccess(telegramUsername) {
    stopLinkingCheck();
    closeTelegramLinking();

    updateTelegramStatus(true, telegramUsername);

    if (typeof showToast === 'function') {
        showToast('✅ ¡Telegram vinculado exitosamente!', 'success');
    } else {
        alert('✅ ¡Telegram vinculado exitosamente!');
    }

    localStorage.setItem('telegram_linked', 'true');
    if (telegramUsername) {
        localStorage.setItem('telegram_username', telegramUsername);
    }
}

// ===== ACTUALIZAR UI =====

function updateTelegramStatus(linked, username) {
    const statusBadge = document.getElementById('telegram-status-badge');
    const connectBtn = document.getElementById('telegram-connect-btn');

    if (statusBadge) {
        if (linked) {
            statusBadge.innerHTML = `
                <span style="color: #10b981;">✅ Conectado</span>
                ${username ? `<span style="color: #666; font-size: 12px;">@${username}</span>` : ''}
            `;
        } else {
            statusBadge.innerHTML = '<span style="color: #999;">⚪ No conectado</span>';
        }
        statusBadge.style.display = 'inline-block';
    }

    if (connectBtn) {
        connectBtn.textContent = linked ? '🔗 Reconfigurar Telegram' : '🔗 Conectar con Telegram';
    }
}

// ===== VERIFICAR ESTADO INICIAL =====

async function checkInitialTelegramStatus() {
    const userId = getUserId();
    console.log('[TELEGRAM] 🔍 Verificando estado inicial para user_id:', userId);

    try {
        const response = await fetch(`${CLOUD_FUNCTION_URL}/check-telegram-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId })
        });

        const data = await response.json();

        if (data.linked) {
            console.log('[TELEGRAM] ✅ Usuario ya vinculado:', data.telegram_username);
            updateTelegramStatus(true, data.telegram_username);
            localStorage.setItem('telegram_linked', 'true');
            if (data.telegram_username) {
                localStorage.setItem('telegram_username', data.telegram_username);
            }
        } else {
            console.log('[TELEGRAM] ⚪ Usuario no vinculado');
            updateTelegramStatus(false);
        }

    } catch (error) {
        console.error('[TELEGRAM] ❌ Error verificando estado inicial:', error);
    }
}

// ===== INICIALIZACIÓN =====

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[TELEGRAM] 📱 DOM listo');
        checkInitialTelegramStatus();
    });
} else {
    console.log('[TELEGRAM] 📱 DOM ya listo');
    checkInitialTelegramStatus();
}

// Exportar objeto global
window.TelegramLinking = {
    open: window.openTelegramLinking,
    close: window.closeTelegramLinking,
    generateCode: generateLinkingCode,
    checkStatus: checkInitialTelegramStatus
};

console.log('[TELEGRAM] ✅ Módulo cargado - window.openTelegramLinking:', typeof window.openTelegramLinking);

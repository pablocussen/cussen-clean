/**
 * CLAUDIA SODIMAC - ULTRA PRO VERSION
 * Chat inteligente con IA real, proactividad y seguimiento de obras
 */

'use strict';

// Configuración
const CONFIG = {
    // API Backend (tu Cloud Function existente)
    apiUrl: 'https://claudia-api-unificada-2ubn4lwhma-uc.a.run.app',
    apiKey: 'demo-sodimac-2024',

    // Gemini API (para IA real - se usa desde el backend)
    geminiApiKey: 'AIzaSyAcemCC6mDNSZXwYqghO0LhZO3GobIpkwc'

    // Session persistente
    sessionId: localStorage.getItem('claudia_session') || generateSessionId(),
    userId: localStorage.getItem('claudia_user_id') || generateUserId(),

    // Configuración de personalidad
    personality: 'cordial_chilena'
};

// Guardar session
localStorage.setItem('claudia_session', CONFIG.sessionId);
localStorage.setItem('claudia_user_id', CONFIG.userId);

function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * CONTEXTO DEL USUARIO (Memoria)
 */
class UserContext {
    constructor() {
        this.loadFromStorage();
    }

    loadFromStorage() {
        const stored = localStorage.getItem('claudia_context');
        if (stored) {
            const data = JSON.parse(stored);
            this.currentProject = data.currentProject || null;
            this.projects = data.projects || [];
            this.calculations = data.calculations || [];
            this.conversations = data.conversations || [];
            this.lastVisit = data.lastVisit || null;
            this.preferences = data.preferences || {};
        } else {
            this.currentProject = null;
            this.projects = [];
            this.calculations = [];
            this.conversations = [];
            this.lastVisit = null;
            this.preferences = {};
        }
    }

    save() {
        const data = {
            currentProject: this.currentProject,
            projects: this.projects,
            calculations: this.calculations.slice(-20), // Últimas 20
            conversations: this.conversations.slice(-50), // Últimas 50
            lastVisit: new Date().toISOString(),
            preferences: this.preferences
        };
        localStorage.setItem('claudia_context', JSON.stringify(data));
    }

    addCalculation(type, data, result) {
        this.calculations.push({
            type,
            data,
            result,
            timestamp: new Date().toISOString()
        });
        this.save();
    }

    addConversation(message, response) {
        this.conversations.push({
            user: message,
            claudia: response,
            timestamp: new Date().toISOString()
        });
        this.save();
    }

    createProject(name, type) {
        const project = {
            id: 'project_' + Date.now(),
            name,
            type,
            createdAt: new Date().toISOString(),
            status: 'en_progreso',
            bitacora: [],
            calculations: [],
            budget: null,
            photos: []
        };
        this.projects.push(project);
        this.currentProject = project;
        this.save();
        return project;
    }

    addBitacoraEntry(text, photos = []) {
        if (!this.currentProject) return;

        this.currentProject.bitacora.push({
            id: 'entry_' + Date.now(),
            text,
            photos,
            timestamp: new Date().toISOString()
        });
        this.save();
    }

    getDaysSinceLastVisit() {
        if (!this.lastVisit) return 0;
        const lastDate = new Date(this.lastVisit);
        const now = new Date();
        const diff = now - lastDate;
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    }

    needsReminder() {
        if (!this.currentProject) return false;

        const lastBitacora = this.currentProject.bitacora[this.currentProject.bitacora.length - 1];
        if (!lastBitacora) return true; // Nuevo proyecto sin bitácora

        const lastDate = new Date(lastBitacora.timestamp);
        const now = new Date();
        const daysSince = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));

        return daysSince >= 2; // Recordar si no ha actualizado en 2+ días
    }
}

const userContext = new UserContext();

/**
 * PERSONALIDAD DE CLAUDIA (Chilena, cordial, proactiva)
 */
const CLAUDIA_PERSONALITY = {
    greeting_messages: [
        "¡Hola compadre! 👋 Soy Claudia, tu asistente de construcción. ¿En qué proyecto andas metido?",
        "¡Buena cabro! 🏗️ Qué bueno verte de vuelta. ¿Cómo va ese proyecto?",
        "¡Hola maestro! 😊 ¿En qué te puedo echar una mano hoy?",
        "¡Qué hay! 👷 Listo para sacar ese proyecto adelante?"
    ],

    returning_user_messages: [
        "¡Qué bueno verte de nuevo! {days} días sin saber de ti. ¿Cómo va la obra de {project}?",
        "¡Hola otra vez! Hace {days} días que no hablamos. ¿Avanzaste en {project}?",
        "¡Bienvenido de vuelta! Tengo pendiente preguntarte: ¿cómo va {project}?"
    ],

    reminder_messages: [
        "Oye, hace {days} días que no actualizas la bitácora de {project}. ¿Todo bien por ahí? 🤔",
        "Maestro, ¿no estarás olvidando registrar el avance de {project}? Ya van {days} días sin novedades.",
        "Compadre, me preocupa que no hayas actualizado {project}. ¿Te echo una mano con algo?"
    ],

    encouragement: [
        "¡Dale que se puede! 💪",
        "¡Vamos que vamos! 🚀",
        "¡Así se hace, maestro! 👏",
        "¡Bacán! Vas súper bien 🎉"
    ],

    empathy: [
        "Entiendo, no es fácil... pero ahí vamos paso a paso 🤝",
        "Tranquilo, te voy a ayudar a resolver esto 💡",
        "Dale, no te preocupes, para eso estoy aquí 😊",
        "Confía, juntos sacamos esto adelante 💪"
    ]
};

/**
 * GESTOR DE BITÁCORA Y RECORDATORIOS
 */
class BitacoraManager {
    constructor() {
        this.checkReminders();
        this.setupDailyReminders();
    }

    checkReminders() {
        // Recordatorio de bienvenida proactivo
        if (userContext.currentProject && userContext.needsReminder()) {
            const project = userContext.currentProject;
            const lastBitacora = project.bitacora[project.bitacora.length - 1];
            const daysSince = lastBitacora
                ? Math.floor((new Date() - new Date(lastBitacora.timestamp)) / (1000 * 60 * 60 * 24))
                : 999;

            const message = CLAUDIA_PERSONALITY.reminder_messages[
                Math.floor(Math.random() * CLAUDIA_PERSONALITY.reminder_messages.length)
            ]
                .replace('{days}', daysSince)
                .replace('{project}', project.name);

            // Mostrar después de 2 segundos
            setTimeout(() => {
                addChatMessage(message, 'claudia', true);
            }, 2000);
        }
    }

    setupDailyReminders() {
        // Revisar cada 24 horas si hay recordatorios pendientes
        setInterval(() => {
            if (userContext.needsReminder()) {
                this.sendReminderNotification();
            }
        }, 24 * 60 * 60 * 1000); // 24 horas
    }

    sendReminderNotification() {
        // Notificación push (si está habilitado)
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('CLAUDIA SODIMAC', {
                body: `¿Cómo va tu proyecto ${userContext.currentProject.name}? No olvides actualizar la bitácora 📋`,
                icon: '/icon.png'
            });
        }
    }

    createEntry(text, photos = []) {
        userContext.addBitacoraEntry(text, photos);

        return {
            success: true,
            message: `✅ Entrada registrada en la bitácora de ${userContext.currentProject.name}`,
            entry: userContext.currentProject.bitacora[userContext.currentProject.bitacora.length - 1]
        };
    }

    getLatestEntries(limit = 5) {
        if (!userContext.currentProject) return [];
        return userContext.currentProject.bitacora.slice(-limit).reverse();
    }
}

const bitacoraManager = new BitacoraManager();

/**
 * CHAT CON IA REAL
 */
async function sendMessageWithAI(userMessage) {
    // Preparar contexto para la IA
    const context = {
        user_id: CONFIG.userId,
        session_id: CONFIG.sessionId,
        current_project: userContext.currentProject,
        recent_calculations: userContext.calculations.slice(-5),
        conversation_history: userContext.conversations.slice(-10),
        days_since_last_visit: userContext.getDaysSinceLastVisit()
    };

    try {
        // Llamar al backend con IA real
        const response = await fetch(CONFIG.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.apiKey}`
            },
            body: JSON.stringify({
                message: userMessage,
                context: context,
                personality: CONFIG.personality
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        // Procesar respuesta
        let claudiaResponse = data.friendly_response || data.respuesta_usuario || data.response;

        // Analizar si Claudia sugiere acciones
        if (data.suggested_actions) {
            claudiaResponse += '\n\n' + formatSuggestedActions(data.suggested_actions);
        }

        // Guardar en contexto
        userContext.addConversation(userMessage, claudiaResponse);

        return {
            message: claudiaResponse,
            data: data
        };

    } catch (error) {
        console.error('Error llamando a IA:', error);

        // Fallback: Respuesta inteligente offline
        return {
            message: generateSmartFallbackResponse(userMessage),
            data: null
        };
    }
}

/**
 * RESPUESTAS INTELIGENTES OFFLINE (Fallback)
 */
function generateSmartFallbackResponse(userMessage) {
    const lower = userMessage.toLowerCase();

    // Detectar intención y responder con personalidad

    // Saludos
    if (lower.match(/\b(hola|buenas|buenos|hey|holi)\b/)) {
        const greeting = CLAUDIA_PERSONALITY.greeting_messages[
            Math.floor(Math.random() * CLAUDIA_PERSONALITY.greeting_messages.length)
        ];

        if (userContext.currentProject) {
            return `${greeting}\n\nVeo que estás en el proyecto "${userContext.currentProject.name}". ¿Cómo va todo?`;
        }
        return greeting;
    }

    // Bitácora
    if (lower.includes('bitacora') || lower.includes('bitácora') || lower.includes('registr')) {
        if (!userContext.currentProject) {
            return "Para llevar una bitácora, primero necesitamos crear un proyecto. ¿Cómo se llama tu proyecto? Por ejemplo: 'Ampliación casa Los Andes' 🏗️";
        }

        const latest = bitacoraManager.getLatestEntries(3);
        if (latest.length === 0) {
            return `Perfecto, vamos a registrar el avance de "${userContext.currentProject.name}".\n\n¿Qué hiciste hoy en la obra? Por ejemplo:\n- "Terminé el muro norte"\n- "Compré materiales en Sodimac"\n- "Avancé un 30% del radier"`;
        } else {
            let response = `📋 Últimas entradas en "${userContext.currentProject.name}":\n\n`;
            latest.forEach((entry, i) => {
                const date = new Date(entry.timestamp).toLocaleDateString('es-CL');
                response += `${i + 1}. ${date}: ${entry.text}\n`;
            });
            response += '\n¿Qué avance tienes hoy? 😊';
            return response;
        }
    }

    // Crear proyecto
    if (lower.includes('proyecto nuevo') || lower.includes('crear proyecto')) {
        return "¡Bacán! Vamos a crear un proyecto nuevo.\n\n¿Cómo se va a llamar? Por ejemplo:\n- 'Remodelación baño'\n- 'Ampliación segundo piso'\n- 'Casa Quinta Normal'";
    }

    // Cálculos
    if (lower.includes('calcul') || lower.includes('material') || lower.includes('cuanto necesito')) {
        return "Dale, te ayudo a calcular materiales 📐\n\n¿Qué vas a construir?\n- Muro (dime largo y alto)\n- Radier (dime largo y ancho)\n- Losa (dime dimensiones)\n\nO usa las calculadoras arriba 👆";
    }

    // Presupuesto
    if (lower.includes('presupuesto') || lower.includes('costo') || lower.includes('plata') || lower.includes('lucas')) {
        return "Te puedo ayudar con el presupuesto 💰\n\n¿Tienes un monto estimado? O si ya calculaste materiales, puedo buscar precios en Sodimac y optimizar para que ahorres.\n\nUsa el Optimizador de Presupuestos arriba 👆";
    }

    // Ayuda/No entiende
    if (lower.includes('ayuda') || lower.includes('no entiendo') || lower.includes('como')) {
        return "Tranquilo, acá estoy para ayudarte 😊\n\n**Puedo hacer:**\n\n📐 **Calcular materiales** (muros, radier, losas)\n💰 **Optimizar presupuestos** (ahorra 15-25%)\n💳 **Hacer planes de pago**\n📋 **Llevar bitácora de tu obra**\n🏗️ **Gestionar proyectos**\n❓ **Responder dudas técnicas**\n\n¿Con cuál empezamos?";
    }

    // Agradecimiento
    if (lower.includes('gracias') || lower.includes('grax') || lower.includes('vale')) {
        const encourage = CLAUDIA_PERSONALITY.encouragement[
            Math.floor(Math.random() * CLAUDIA_PERSONALITY.encouragement.length)
        ];
        return `¡De nada, compadre! ${encourage}\n\nCualquier cosa que necesites, aquí estoy 🤝`;
    }

    // Default: Respuesta empática y útil
    const empathy = CLAUDIA_PERSONALITY.empathy[
        Math.floor(Math.random() * CLAUDIA_PERSONALITY.empathy.length)
    ];

    return `${empathy}\n\n¿Me puedes dar más detalles? Por ejemplo:\n- ¿Qué proyecto estás haciendo?\n- ¿Qué materiales necesitas?\n- ¿Tienes alguna duda técnica?\n\nAsí te puedo ayudar mejor 💪`;
}

function formatSuggestedActions(actions) {
    let text = '💡 **Te sugiero:**\n';
    actions.forEach((action, i) => {
        text += `\n${i + 1}. ${action}`;
    });
    return text;
}

/**
 * INTERFAZ DE CHAT MEJORADA
 */
async function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    if (!message) return;

    // Agregar mensaje del usuario
    addChatMessage(message, 'user');
    input.value = '';

    // Mostrar typing
    showTyping();

    // Esperar respuesta de IA (simular pensamiento)
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
        const response = await sendMessageWithAI(message);
        hideTyping();
        addChatMessage(response.message, 'claudia', true);

        // Si la IA detectó que hay que crear proyecto, bitácora, etc
        if (response.data && response.data.action_required) {
            handleAutomaticAction(response.data.action_required, response.data);
        }

    } catch (error) {
        hideTyping();
        const fallback = generateSmartFallbackResponse(message);
        addChatMessage(fallback, 'claudia', true);
    }
}

function addChatMessage(text, sender = 'claudia', animate = false) {
    const messagesDiv = document.getElementById('chat-messages');

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    if (animate) messageDiv.style.opacity = '0';

    const avatar = sender === 'claudia' ? '🤖' : '👤';

    // Procesar markdown básico
    const formattedText = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');

    messageDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">${formattedText}</div>
    `;

    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    if (animate) {
        setTimeout(() => {
            messageDiv.style.transition = 'opacity 0.3s ease';
            messageDiv.style.opacity = '1';
        }, 50);
    }
}

function showTyping() {
    const typing = document.getElementById('chat-typing');
    if (typing) typing.style.display = 'flex';
}

function hideTyping() {
    const typing = document.getElementById('chat-typing');
    if (typing) typing.style.display = 'none';
}

/**
 * ACCIONES AUTOMÁTICAS
 */
function handleAutomaticAction(action, data) {
    switch(action) {
        case 'create_project':
            if (data.project_name) {
                userContext.createProject(data.project_name, data.project_type || 'general');
                addChatMessage(`✅ Proyecto "${data.project_name}" creado! Ahora puedes llevar la bitácora y gestionar todo desde acá.`, 'claudia', true);
            }
            break;

        case 'add_bitacora':
            if (data.bitacora_text) {
                const result = bitacoraManager.createEntry(data.bitacora_text);
                addChatMessage(result.message, 'claudia', true);
            }
            break;

        case 'calculate_materials':
            // Trigger calculadora automáticamente
            addChatMessage('Dale, voy a calcular los materiales. Revisa los resultados arriba 👆', 'claudia', true);
            break;
    }
}

/**
 * INICIALIZACIÓN PROACTIVA
 */
function initializeClaudiaPro() {
    console.log('🤖 CLAUDIA SODIMAC ULTRA PRO cargada');

    // Saludo inicial personalizado
    const daysSince = userContext.getDaysSinceLastVisit();

    if (daysSince === 0) {
        // Primera visita o mismo día
        const greeting = CLAUDIA_PERSONALITY.greeting_messages[0];
        addChatMessage(greeting, 'claudia');
    } else if (daysSince > 0 && userContext.currentProject) {
        // Usuario recurrente con proyecto
        const returning = CLAUDIA_PERSONALITY.returning_user_messages[
            Math.floor(Math.random() * CLAUDIA_PERSONALITY.returning_user_messages.length)
        ]
            .replace('{days}', daysSince)
            .replace('{project}', userContext.currentProject.name);

        addChatMessage(returning, 'claudia');
    } else {
        // Usuario recurrente sin proyecto
        addChatMessage('¡Qué bueno verte de nuevo! ¿Empezamos un proyecto nuevo? 😊', 'claudia');
    }

    // Pedir permisos para notificaciones
    if ('Notification' in window && Notification.permission === 'default') {
        setTimeout(() => {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    addChatMessage('Bacán! Ahora te puedo enviar recordatorios para que no olvides actualizar tu bitácora 📲', 'claudia', true);
                }
            });
        }, 10000); // Después de 10 segundos
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // Inicializar versión PRO
    initializeClaudiaPro();
});

// Exponer funciones globales necesarias
window.sendMessagePro = sendMessage;
window.userContext = userContext;
window.bitacoraManager = bitacoraManager;

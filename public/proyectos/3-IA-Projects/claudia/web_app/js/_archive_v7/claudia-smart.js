/**
 * CLAUDIA SODIMAC - ULTRA PRO VERSION
 * Chat inteligente con bitácora visible y sistema de alertas/tareas
 * 100% funcional offline con personalidad chilena real
 */

'use strict';

// ==================== CONFIGURACIÓN ====================

const CONFIG = {
    sessionId: localStorage.getItem('claudia_session') || generateSessionId(),
    userId: localStorage.getItem('claudia_user_id') || generateUserId()
};

localStorage.setItem('claudia_session', CONFIG.sessionId);
localStorage.setItem('claudia_user_id', CONFIG.userId);

function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ==================== CONTEXTO Y MEMORIA ====================

class SmartContext {
    constructor() {
        this.load();
    }

    load() {
        const stored = localStorage.getItem('claudia_smart_context');
        if (stored) {
            const data = JSON.parse(stored);
            this.userName = data.userName || null;
            this.currentProject = data.currentProject || null;
            this.projects = data.projects || [];
            this.lastVisit = data.lastVisit || null;
            this.conversationCount = data.conversationCount || 0;
            this.lastCalculation = data.lastCalculation || null;
        } else {
            this.userName = null;
            this.currentProject = null;
            this.projects = [];
            this.lastVisit = null;
            this.conversationCount = 0;
            this.lastCalculation = null;
        }
    }

    save() {
        const data = {
            userName: this.userName,
            currentProject: this.currentProject,
            projects: this.projects.slice(-10),
            lastVisit: new Date().toISOString(),
            conversationCount: this.conversationCount,
            lastCalculation: this.lastCalculation
        };
        localStorage.setItem('claudia_smart_context', JSON.stringify(data));
        updateBitacoraUI();
        updateAlertsUI();
    }

    getDaysSinceLastVisit() {
        if (!this.lastVisit) return 0;
        const lastDate = new Date(this.lastVisit);
        const now = new Date();
        return Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
    }

    getDaysSinceLastBitacora() {
        if (!this.currentProject || !this.currentProject.bitacora || this.currentProject.bitacora.length === 0) {
            return 999;
        }
        const lastEntry = this.currentProject.bitacora[this.currentProject.bitacora.length - 1];
        const lastDate = new Date(lastEntry.date);
        const now = new Date();
        return Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
    }

    createProject(name, type = 'general') {
        const project = {
            id: 'project_' + Date.now(),
            name,
            type,
            createdAt: new Date().toISOString(),
            bitacora: [],
            status: 'en_progreso'
        };
        this.projects.push(project);
        this.currentProject = project;
        this.save();
        return project;
    }

    addBitacora(text) {
        if (!this.currentProject) return false;
        this.currentProject.bitacora.push({
            text,
            date: new Date().toISOString()
        });
        this.save();
        return true;
    }

    incrementConversation() {
        this.conversationCount++;
        this.save();
    }

    saveCalculation(type, result) {
        this.lastCalculation = {
            type,
            result,
            date: new Date().toISOString()
        };
        this.save();
    }
}

const context = new SmartContext();

// ==================== PERSONALIDAD CHILENA ====================

const PERSONALITY = {
    saludos: [
        "¡Hola compadre! 👋 Soy Claudia, tu asistente de construcción.",
        "¡Hola maestro! 👷 ¿En qué proyecto andas metido?",
        "¡Qué bueno verte! 😊 ¿Cómo va la obra?",
        "¡Hola! 🏗️ ¿Qué vamos a construir hoy?"
    ],

    saludos_recurrente: [
        "¡Qué bueno verte de nuevo {nombre}! 😊",
        "¡Hola {nombre}! Hace {dias} días que no hablamos. ¿Cómo va '{proyecto}'?",
        "¡De vuelta maestro! ¿Avanzaste en '{proyecto}'?"
    ],

    animo: [
        "¡Dale que se puede! 💪",
        "¡Bacán, vas súper bien! 🎉",
        "¡Así se hace compadre! 👏",
        "¡Excelente progreso! 🌟"
    ],

    despedida: [
        "¡Éxito en tu proyecto! Cualquier cosa me avisas 👍",
        "¡Que te vaya muy bien! Acá estoy para lo que necesites 🤝",
        "¡Dale nomás! Avísame cómo te va 😊"
    ],

    confusion: [
        "No caché bien eso 🤔 ¿Me lo puedes explicar de otra forma?",
        "Mm, no te entendí bien. ¿Puedes ser más específico?",
        "Perdona, no pillé. ¿De qué manera te puedo ayudar?"
    ]
};

// ==================== INTELIGENCIA: DETECCIÓN DE INTENCIONES ====================

class IntentDetector {
    detectIntent(message) {
        const lower = message.toLowerCase();

        // Detectar saludo
        if (lower.match(/\b(hola|buenas|buenos días|buenas tardes|hey|qué tal)\b/)) {
            return 'saludo';
        }

        // Detectar presentación (nombre del usuario)
        if (lower.match(/\b(me llamo|mi nombre es|soy)\s+([a-záéíóúñ]+)/i)) {
            return 'presentacion';
        }

        // Detectar bitácora (PRIORIDAD ALTA - antes de materiales)
        if (lower.match(/\b(terminé|terminé|acabé|finalicé|hice|avancé|hoy)\b/)) {
            return 'bitacora';
        }

        if (lower.match(/\b(bitacora|bitácora|registr|avance|progreso|historial)\b/)) {
            return 'bitacora';
        }

        // Detectar creación de proyecto
        if (lower.match(/\b(proyecto|obra|construcción|ampliación|remodelación|crear|empezar|comenzar)\b/) &&
            lower.match(/\b(nuevo|nueva|voy a|quiero|necesito)\b/)) {
            return 'crear_proyecto';
        }

        // Detectar materiales/cálculos
        if (lower.match(/\b(material|calcul|cuanto|cuánto|necesito|cemento|ladrillo|arena|radier|losa)\b/)) {
            return 'materiales';
        }

        // Detectar si menciona "muro" con medidas = cálculo
        if (lower.match(/muro\s+(?:de\s+)?(\d+)/)) {
            return 'materiales';
        }

        // Detectar presupuesto
        if (lower.match(/\b(presupuesto|costo|precio|plata|dinero|cuánto cuesta|optimizar|ahorrar)\b/)) {
            return 'presupuesto';
        }

        // Detectar plan de pagos
        if (lower.match(/\b(pago|cuota|financiamiento|plan|dividir)\b/)) {
            return 'plan_pagos';
        }

        // Detectar ayuda
        if (lower.match(/\b(ayuda|help|qué puedes|qué haces|cómo funcionas)\b/)) {
            return 'ayuda';
        }

        // Detectar agradecimiento
        if (lower.match(/\b(gracias|thank|vale|bacán|genial)\b/)) {
            return 'agradecimiento';
        }

        // Por defecto
        return 'general';
    }

    extractInfo(message, intent) {
        const info = {};

        // Extraer nombre
        const nameMatch = message.match(/(?:me llamo|mi nombre es|soy)\s+([a-záéíóúñ]+)/i);
        if (nameMatch) {
            info.name = nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1).toLowerCase();
        }

        // Extraer dimensiones de muro (largo x alto)
        const muroMatch = message.match(/(\d+(?:\.\d+)?)\s*(?:m|metros?)?\s*(?:x|por)\s*(\d+(?:\.\d+)?)/i);
        if (muroMatch) {
            info.dimensions = {
                largo: parseFloat(muroMatch[1]),
                alto: parseFloat(muroMatch[2])
            };
        }

        // Extraer nombre de proyecto
        const projectMatch = message.match(/proyecto\s+(.+?)(?:\.|,|$)/i) ||
                            message.match(/(?:ampliación|remodelación|construcción)\s+(.+?)(?:\.|,|$)/i) ||
                            message.match(/(?:voy a|quiero)\s+(.+?)(?:\.|,|$)/i);
        if (projectMatch) {
            info.projectName = projectMatch[1].trim();
        }

        // Extraer texto de bitácora
        if (intent === 'bitacora') {
            info.bitacoraText = message;
        }

        return info;
    }
}

const detector = new IntentDetector();

// ==================== RESPONDEDOR INTELIGENTE ====================

class SmartResponder {
    constructor() {
        this.lastIntent = null;
        this.expectingResponse = null;
    }

    respond(message) {
        const intent = detector.detectIntent(message);
        const info = detector.extractInfo(message, intent);

        this.lastIntent = intent;

        switch (intent) {
            case 'saludo':
                return this.handleSaludo(info);

            case 'presentacion':
                return this.handlePresentacion(info);

            case 'bitacora':
                return this.handleBitacora(info);

            case 'crear_proyecto':
                return this.handleCrearProyecto(info);

            case 'materiales':
                return this.handleMateriales(info);

            case 'presupuesto':
                return this.handlePresupuesto(info);

            case 'plan_pagos':
                return this.handlePlanPagos(info);

            case 'ayuda':
                return this.handleAyuda();

            case 'agradecimiento':
                return this.handleAgradecimiento();

            default:
                return this.handleGeneral(message);
        }
    }

    handleSaludo(info) {
        const daysSince = context.getDaysSinceLastVisit();

        if (context.userName && daysSince > 0 && context.currentProject) {
            const template = PERSONALITY.saludos_recurrente[Math.floor(Math.random() * PERSONALITY.saludos_recurrente.length)];
            return template
                .replace('{nombre}', context.userName)
                .replace('{dias}', daysSince)
                .replace('{proyecto}', context.currentProject.name);
        } else if (context.userName) {
            return `¡Hola ${context.userName}! 😊 ¿En qué te ayudo hoy?`;
        } else {
            return PERSONALITY.saludos[Math.floor(Math.random() * PERSONALITY.saludos.length)] +
                   "\n\n¿En qué proyecto andas metido?";
        }
    }

    handlePresentacion(info) {
        if (info.name) {
            context.userName = info.name;
            context.save();
            return `¡Encantada ${info.name}! 😊 Qué bueno conocerte.\n\n¿En qué proyecto estás trabajando?`;
        }
        return "¿Cómo te llamas? Así puedo atenderte mejor 😊";
    }

    handleBitacora(info) {
        if (!context.currentProject) {
            return "Primero necesitas crear un proyecto para llevar la bitácora.\n\n¿Cómo se llama tu proyecto? Por ejemplo: 'Proyecto ampliación casa' o 'Remodelación cocina'";
        }

        if (info.bitacoraText) {
            context.addBitacora(info.bitacoraText);
            const animo = PERSONALITY.animo[Math.floor(Math.random() * PERSONALITY.animo.length)];
            return `✅ Registrado en la bitácora de '${context.currentProject.name}'\n\n${animo}\n\nSigue así, cada avance cuenta 💪`;
        }

        // Mostrar bitácora
        if (context.currentProject.bitacora.length === 0) {
            return `📋 La bitácora de '${context.currentProject.name}' está vacía.\n\nCuando tengas un avance, dime: "Hoy terminé el muro" o "Avancé con el radier" 😊`;
        }

        let response = `📋 Últimas entradas en '${context.currentProject.name}':\n\n`;
        const recent = context.currentProject.bitacora.slice(-5).reverse();
        recent.forEach((entry, i) => {
            const date = new Date(entry.date);
            response += `${i + 1}. ${date.toLocaleDateString('es-CL')}: ${entry.text}\n`;
        });
        response += "\n¿Qué avance tienes hoy? 😊";

        return response;
    }

    handleCrearProyecto(info) {
        let projectName = info.projectName;

        if (!projectName) {
            // Intentar extraer del mensaje completo
            const message = info.bitacoraText || '';
            const cleanMessage = message
                .replace(/quiero|voy a|necesito|crear|proyecto|nuevo|nueva/gi, '')
                .trim();
            projectName = cleanMessage || 'Mi Proyecto';
        }

        // Limpiar nombre del proyecto
        projectName = projectName
            .replace(/^(un|una|el|la)\s+/i, '')
            .trim();

        const project = context.createProject(projectName);

        return `✅ Proyecto '${project.name}' creado!\n\nAhora puedo ayudarte a:\n• Calcular materiales 📐\n• Optimizar presupuesto 💰\n• Llevar la bitácora de avances 📋\n• Generar plan de pagos 💳\n\n¿Por dónde empezamos? 🏗️`;
    }

    handleMateriales(info) {
        if (info.dimensions) {
            // Auto-calcular si tenemos dimensiones
            const { largo, alto } = info.dimensions;
            return `Perfecto! Voy a calcular los materiales para un muro de ${largo}m x ${alto}m.\n\nUsa la Calculadora de Materiales arriba 👆 para ver el detalle completo con costos y mermas según normativa NCh.`;
        }

        return `¡Claro! Para calcular materiales necesito saber:\n\n📐 Para MUROS:\n• Largo y alto (metros)\n• Tipo de ladrillo (princesa, fiscal o bloque)\n\n📐 Para RADIER o LOSA:\n• Largo y ancho del área\n• Espesor (normalmente 10cm para radier, 15cm para losa)\n\nUsa la calculadora arriba 👆 o dime las medidas aquí 😊`;
    }

    handlePresupuesto(info) {
        return `💰 Puedo ayudarte a optimizar tu presupuesto y encontrar oportunidades de ahorro sin sacrificar calidad.\n\nUsa el Optimizador de Presupuestos arriba 👆 y te voy a mostrar:\n• Alternativas más económicas\n• Ahorro potencial (hasta 30%)\n• Impacto en la calidad\n\n¿Cuál es el monto total de tu proyecto?`;
    }

    handlePlanPagos(info) {
        return `💳 Te puedo generar un plan de pagos escalonado según el avance de tu obra.\n\nLo recomendado es:\n• 30% al inicio (materiales fase 1)\n• 40% a mitad de obra (50% avance)\n• 30% al finalizar (entrega)\n\nUsa el generador de Plan de Pagos arriba 👆 o dime el monto total 😊`;
    }

    handleAyuda() {
        return `🤖 Soy Claudia, tu asistente de construcción. Puedo ayudarte con:\n\n📐 Cálculo de Materiales\n• Muros (princesa, fiscal, bloque)\n• Radier y losas\n• Incluye mermas NCh\n\n💰 Optimización de Presupuestos\n• Encuentra ahorros de hasta 30%\n• Mantiene la calidad\n\n💳 Planes de Pago\n• Cuotas escalonadas\n• Según avance de obra\n\n📋 Bitácora de Obra\n• Registra tus avances\n• Historial completo\n• Recordatorios\n\n¿Con qué te ayudo? 😊`;
    }

    handleAgradecimiento() {
        return `¡De nada compadre! 🤝\n\nEstoy aquí para ayudarte en todo tu proyecto. Si necesitas más cálculos, optimizaciones o consejos, solo pregunta 😊`;
    }

    handleGeneral(message) {
        const confuso = PERSONALITY.confusion[Math.floor(Math.random() * PERSONALITY.confusion.length)];
        return `${confuso}\n\nPuedo ayudarte con:\n• Calcular materiales 📐\n• Optimizar presupuesto 💰\n• Generar plan de pagos 💳\n• Llevar bitácora de obra 📋\n\n¿Qué necesitas?`;
    }
}

const responder = new SmartResponder();

// ==================== INTERFAZ: CHAT ====================

function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    if (!message) return;

    // Agregar mensaje del usuario
    addChatMessage(message, 'user');
    input.value = '';

    // Incrementar contador de conversaciones
    context.incrementConversation();

    // Mostrar indicador de escritura
    showTypingIndicator();

    // Simular tiempo de respuesta
    setTimeout(() => {
        hideTypingIndicator();
        const response = responder.respond(message);
        addChatMessage(response, 'claudia');
    }, 800);
}

function addChatMessage(text, sender) {
    const messagesDiv = document.getElementById('chat-messages');

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;

    const avatar = sender === 'claudia' ? '🤖' : '👤';

    messageDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">${text.replace(/\n/g, '<br>')}</div>
    `;

    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function showTypingIndicator() {
    const messagesDiv = document.getElementById('chat-messages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message claudia';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    messagesDiv.appendChild(typingDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function hideTypingIndicator() {
    const typingDiv = document.getElementById('typing-indicator');
    if (typingDiv) {
        typingDiv.remove();
    }
}

// ==================== INTERFAZ: BITÁCORA ====================

function updateBitacoraUI() {
    const container = document.getElementById('bitacora-content');

    if (!context.currentProject) {
        container.innerHTML = `
            <div class="no-project">
                <div class="no-project-icon">📋</div>
                <p style="font-size: 14px; line-height: 1.5;">
                    No tienes ningún proyecto activo.<br><br>
                    Dile a Claudia en el chat:<br>
                    <strong>"Crear proyecto ampliación casa"</strong>
                </p>
            </div>
        `;
        return;
    }

    const project = context.currentProject;
    const entryCount = project.bitacora.length;
    const createdDate = new Date(project.createdAt).toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });

    let html = `
        <div class="project-info">
            <div class="project-name">${project.name}</div>
            <div class="project-meta">
                <span>📅 ${createdDate}</span>
                <span>📝 ${entryCount} entradas</span>
            </div>
        </div>
    `;

    if (entryCount === 0) {
        html += `
            <div style="text-align: center; padding: 30px 20px; color: #718096;">
                <div style="font-size: 36px; margin-bottom: 10px;">✍️</div>
                <p style="font-size: 13px; line-height: 1.5;">
                    Aún no hay registros.<br>
                    Dile a Claudia tus avances,<br>
                    por ejemplo:<br>
                    <strong>"Hoy terminé el muro"</strong>
                </p>
            </div>
        `;
    } else {
        html += '<div class="timeline">';

        // Mostrar últimas 10 entradas, más recientes primero
        const recentEntries = project.bitacora.slice(-10).reverse();

        recentEntries.forEach(entry => {
            const date = new Date(entry.date);
            const formattedDate = date.toLocaleDateString('es-CL', {
                day: '2-digit',
                month: 'short'
            });
            const formattedTime = date.toLocaleTimeString('es-CL', {
                hour: '2-digit',
                minute: '2-digit'
            });

            html += `
                <div class="timeline-item">
                    <div class="timeline-date">${formattedDate} • ${formattedTime}</div>
                    <div class="timeline-content">${entry.text}</div>
                </div>
            `;
        });

        html += '</div>';
    }

    container.innerHTML = html;
}

// ==================== INTERFAZ: ALERTAS Y TAREAS ====================

function updateAlertsUI() {
    const container = document.getElementById('alerts-content');
    const alerts = [];
    const tasks = [];

    // Generar alertas según contexto
    const daysSinceLastBitacora = context.getDaysSinceLastBitacora();

    if (context.currentProject) {
        // Alerta si no ha actualizado bitácora en 2+ días
        if (daysSinceLastBitacora >= 2 && daysSinceLastBitacora < 999) {
            alerts.push({
                type: 'warning',
                title: 'Actualiza tu bitácora',
                text: `Hace ${daysSinceLastBitacora} días que no registras avances en '${context.currentProject.name}'`
            });
        }

        // Alerta de bienvenida si es nuevo
        if (context.currentProject.bitacora.length === 0) {
            alerts.push({
                type: 'info',
                title: '¡Proyecto nuevo!',
                text: `Recuerda ir registrando tus avances en '${context.currentProject.name}'`
            });
        }

        // Alerta de felicitación si tiene muchos registros
        if (context.currentProject.bitacora.length >= 5) {
            alerts.push({
                type: 'success',
                title: '¡Excelente seguimiento!',
                text: `Llevas ${context.currentProject.bitacora.length} registros en tu bitácora. ¡Así se hace!`
            });
        }
    } else {
        alerts.push({
            type: 'info',
            title: 'Crea tu primer proyecto',
            text: 'Dile a Claudia: "Crear proyecto ampliación casa" para comenzar'
        });
    }

    // Generar tareas según el estado del proyecto
    if (context.currentProject) {
        if (context.currentProject.bitacora.length === 0) {
            tasks.push({ text: 'Registrar primer avance del proyecto', completed: false });
            tasks.push({ text: 'Calcular materiales necesarios', completed: false });
        } else {
            tasks.push({ text: 'Actualizar avances de hoy', completed: false });
            tasks.push({ text: 'Revisar materiales faltantes', completed: false });

            if (!context.lastCalculation) {
                tasks.push({ text: 'Calcular materiales del proyecto', completed: false });
            }

            if (daysSinceLastBitacora >= 1) {
                tasks.push({ text: 'Registrar progreso reciente', completed: false });
            }
        }
    } else {
        tasks.push({ text: 'Crear un proyecto nuevo', completed: false });
        tasks.push({ text: 'Explorar la calculadora', completed: false });
    }

    // Renderizar alertas
    let html = '';

    alerts.forEach(alert => {
        html += `
            <div class="alert-item ${alert.type}">
                <div class="alert-title">${alert.title}</div>
                <div class="alert-text">${alert.text}</div>
            </div>
        `;
    });

    // Renderizar tareas con checkboxes funcionales
    if (tasks.length > 0) {
        html += '<div class="tasks-list">';
        html += '<div style="font-weight: 700; margin-bottom: 12px; color: #2d3748; font-size: 14px;">📝 Tareas Sugeridas</div>';

        tasks.forEach((task, idx) => {
            html += `
                <div class="task-item" onclick="toggleTask(${idx})">
                    <div class="task-checkbox" id="task-check-${idx}"></div>
                    <div class="task-text" id="task-text-${idx}">${task.text}</div>
                </div>
            `;
        });

        html += '</div>';
    }

    container.innerHTML = html;
}

// Función para tachar tareas
function toggleTask(idx) {
    const checkbox = document.getElementById(`task-check-${idx}`);
    const text = document.getElementById(`task-text-${idx}`);
    const taskItem = checkbox.parentElement;

    if (checkbox.classList.contains('checked')) {
        checkbox.classList.remove('checked');
        taskItem.classList.remove('completed');
    } else {
        checkbox.classList.add('checked');
        taskItem.classList.add('completed');
    }
}

// ==================== INICIALIZACIÓN ====================

document.addEventListener('DOMContentLoaded', function() {
    // Event listener para Enter en el chat
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    // Actualizar UI inicial
    updateBitacoraUI();
    updateAlertsUI();

    // Mensaje de bienvenida
    setTimeout(() => {
        const greeting = responder.respond('hola');
        addChatMessage(greeting, 'claudia');
    }, 500);

    console.log('🤖 CLAUDIA SODIMAC ULTRA PRO cargada correctamente');
    console.log('📊 Sistema inteligente con bitácora y alertas activas');
});

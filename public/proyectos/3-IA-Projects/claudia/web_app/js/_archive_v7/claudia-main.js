/**
 * CLAUDIA Main App v7.2 - FUNCTIONAL CORE
 * Simple, Clean, Working
 */

// ===============================================
// 1. GLOBAL STATE
// ===============================================
let currentProject = null;
let allProjects = [];
let apuDatabase = [];
let selectedAPU = null;
let chatMessages = [];

// ===============================================
// 2. INITIALIZATION
// ===============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 CLAUDIA v7.2 Starting...');

    // Load data
    loadProjects();
    loadAPUDatabase();
    loadChatHistory();

    // Initialize UI
    initializeChat();
    initializeAPUNavigator();
    updateUI();

    // Welcome message
    addClaudiaMessage('¡Hola! Soy CLAUDIA, tu asistente de construcción. ¿En qué puedo ayudarte hoy?');

    console.log('✅ CLAUDIA Ready');
});

// ===============================================
// 3. DATA LOADING & SAVING
// ===============================================
function loadProjects() {
    try {
        const saved = localStorage.getItem('claudia_projects');
        allProjects = saved ? JSON.parse(saved) : [];

        if (allProjects.length === 0) {
            // Create default project
            currentProject = {
                id: Date.now(),
                name: 'Mi Proyecto',
                activities: [],
                tasks: [],
                createdAt: new Date().toISOString()
            };
            allProjects.push(currentProject);
            saveProjects();
        } else {
            currentProject = allProjects[0];
        }

        updateProjectSelector();
    } catch(e) {
        console.error('Error loading projects:', e);
        currentProject = { id: Date.now(), name: 'Mi Proyecto', activities: [], tasks: [] };
        allProjects = [currentProject];
    }
}

function saveProjects() {
    try {
        localStorage.setItem('claudia_projects', JSON.stringify(allProjects));
        updateUI();
    } catch(e) {
        console.error('Error saving projects:', e);
    }
}

function loadAPUDatabase() {
    // Simplified APU database - expandable
    apuDatabase = [
        { id: 1, nombre: 'Excavación manual', categoria: 'Movimiento de Tierras', unidad: 'm3', precio: 15000 },
        { id: 2, nombre: 'Hormigón H20', categoria: 'Hormigones', unidad: 'm3', precio: 85000 },
        { id: 3, nombre: 'Enfierradura A630-420H', categoria: 'Enfierraduras', unidad: 'kg', precio: 950 },
        { id: 4, nombre: 'Albañilería ladrillo fiscal', categoria: 'Albañilería', unidad: 'm2', precio: 25000 },
        { id: 5, nombre: 'Estuco interior', categoria: 'Terminaciones', unidad: 'm2', precio: 8500 },
        { id: 6, nombre: 'Pintura látex', categoria: 'Pinturas', unidad: 'm2', precio: 4500 },
        { id: 7, nombre: 'Radier e=10cm', categoria: 'Radieres', unidad: 'm2', precio: 12000 },
        { id: 8, nombre: 'Instalación eléctrica', categoria: 'Electricidad', unidad: 'pto', precio: 18000 },
        { id: 9, nombre: 'Instalación agua potable', categoria: 'Grifería', unidad: 'pto', precio: 22000 },
        { id: 10, nombre: 'Ventana aluminio 1x1', categoria: 'Ventanas', unidad: 'un', precio: 75000 },
        { id: 11, nombre: 'Puerta interior 0.9x2', categoria: 'Puertas', unidad: 'un', precio: 95000 },
        { id: 12, nombre: 'Cerámica piso 40x40', categoria: 'Cerámicas', unidad: 'm2', precio: 18000 },
        { id: 13, nombre: 'Cielo falso yeso cartón', categoria: 'Cielos', unidad: 'm2', precio: 14000 },
        { id: 14, nombre: 'Cubierta teja asfáltica', categoria: 'Techumbres', unidad: 'm2', precio: 22000 },
        { id: 15, nombre: 'Baranda fierro', categoria: 'Fierrería', unidad: 'ml', precio: 35000 }
    ];

    console.log(`✅ ${apuDatabase.length} APUs loaded`);
}

function loadChatHistory() {
    try {
        const saved = localStorage.getItem('claudia_chat');
        chatMessages = saved ? JSON.parse(saved) : [];
    } catch(e) {
        chatMessages = [];
    }
}

function saveChatHistory() {
    try {
        localStorage.setItem('claudia_chat', JSON.stringify(chatMessages.slice(-50)));  // Keep last 50
    } catch(e) {
        console.error('Error saving chat:', e);
    }
}

// ===============================================
// 4. UI UPDATES
// ===============================================
function updateUI() {
    updateProjectDisplay();
    updateTasksList();
    updateBitacora();
    updateAlerts();
}

function updateProjectDisplay() {
    const nameInput = document.getElementById('project-name');
    if (nameInput && currentProject) {
        nameInput.value = currentProject.name;
    }

    const activitiesDiv = document.getElementById('project-activities');
    if (!activitiesDiv || !currentProject) return;

    if (!currentProject.activities || currentProject.activities.length === 0) {
        activitiesDiv.innerHTML = `
            <div class="project-empty">
                <div style="font-size: 48px; margin-bottom: 10px;">📦</div>
                <div style="font-weight: 600; margin-bottom: 5px;">Sin actividades</div>
                <div style="font-size: 13px; color: #757575;">Busca y agrega actividades a tu proyecto</div>
            </div>
        `;
        document.getElementById('project-summary').style.display = 'none';
        return;
    }

    let total = 0;
    let html = '<div class="project-activities-list">';

    currentProject.activities.forEach((act, index) => {
        const subtotal = act.cantidad * act.precio;
        total += subtotal;

        html += `
            <div class="project-activity-item">
                <div class="project-activity-info">
                    <div class="project-activity-name">${act.nombre}</div>
                    <div class="project-activity-details">
                        <span class="activity-quantity-display" onclick="editActivityQuantity(${index})" title="Click para editar">
                            ${act.cantidad} ${act.unidad} ✏️
                        </span>
                        × ${formatMoney(act.precio)}/${act.unidad}
                    </div>
                </div>
                <div class="project-activity-amount">${formatMoney(subtotal)}</div>
                <button class="project-activity-delete" onclick="removeActivity(${index})" title="Eliminar">🗑️</button>
            </div>
        `;
    });

    html += '</div>';
    activitiesDiv.innerHTML = html;

    document.getElementById('project-total-amount').textContent = formatMoney(total);
    document.getElementById('project-summary').style.display = 'block';
}

function updateProjectSelector() {
    const selector = document.getElementById('project-selector');
    if (!selector) return;

    selector.innerHTML = '';
    allProjects.forEach((proj, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = proj.name;
        option.selected = (proj.id === currentProject.id);
        selector.appendChild(option);
    });
}

function updateTasksList() {
    const tasksDiv = document.getElementById('tasks-list');
    if (!tasksDiv || !currentProject) return;

    if (!currentProject.tasks || currentProject.tasks.length === 0) {
        tasksDiv.innerHTML = `
            <div class="project-empty">
                <div style="font-size: 48px; margin-bottom: 10px;">📝</div>
                <div style="font-weight: 600; margin-bottom: 5px;">Sin tareas</div>
                <div style="font-size: 13px; color: #757575;">Agrega tareas para organizar tu proyecto</div>
            </div>
        `;
        return;
    }

    let html = '';
    currentProject.tasks.forEach((task, index) => {
        const statusClass = task.completed ? 'task-completed' : 'task-pending';
        const checkIcon = task.completed ? '✅' : '⬜';

        html += `
            <div class="task-item ${statusClass}">
                <span onclick="toggleTask(${index})" style="cursor: pointer; font-size: 20px;">${checkIcon}</span>
                <div class="task-info">${task.text}</div>
                <button class="btn-task-delete" onclick="deleteTask(${index})">🗑️</button>
            </div>
        `;
    });

    tasksDiv.innerHTML = html;
}

function updateBitacora() {
    const bitacoraDiv = document.getElementById('bitacora-content');
    if (!bitacoraDiv || !currentProject) return;

    const today = new Date().toLocaleDateString('es-CL');
    const activitiesCount = currentProject.activities?.length || 0;
    const tasksCount = currentProject.tasks?.length || 0;
    const completedTasks = currentProject.tasks?.filter(t => t.completed).length || 0;

    bitacoraDiv.innerHTML = `
        <div class="project-info">
            <div class="project-name">${currentProject.name}</div>
            <div class="project-meta">
                <span>📅 ${today}</span>
                <span>📋 ${activitiesCount} actividades</span>
            </div>
        </div>

        <div class="timeline">
            <div class="timeline-item">
                <div class="timeline-date">Hoy</div>
                <div class="timeline-content">
                    ✅ ${completedTasks}/${tasksCount} tareas completadas<br>
                    💰 ${activitiesCount} actividades en presupuesto
                </div>
            </div>
        </div>
    `;
}

function updateAlerts() {
    const alertsDiv = document.getElementById('alerts-content');
    if (!alertsDiv || !currentProject) return;

    const pendingTasks = currentProject.tasks?.filter(t => !t.completed).length || 0;

    let html = '';

    if (pendingTasks > 0) {
        html += `
            <div class="alert-item warning">
                <div class="alert-title">⚠️ Tareas Pendientes</div>
                <div class="alert-text">Tienes ${pendingTasks} tareas sin completar</div>
            </div>
        `;
    }

    if (currentProject.activities?.length === 0) {
        html += `
            <div class="alert-item info">
                <div class="alert-title">💡 Comienza tu proyecto</div>
                <div class="alert-text">Busca y agrega actividades para crear tu presupuesto</div>
            </div>
        `;
    }

    if (!html) {
        html = `
            <div class="alert-item success">
                <div class="alert-title">✅ Todo bien</div>
                <div class="alert-text">No hay alertas pendientes</div>
            </div>
        `;
    }

    alertsDiv.innerHTML = html;
}

// ===============================================
// 5. PROJECT FUNCTIONS
// ===============================================
function switchProject(index) {
    currentProject = allProjects[index];
    updateUI();
}

function createNewProject() {
    const name = prompt('Nombre del nuevo proyecto:', `Proyecto ${allProjects.length + 1}`);
    if (!name) return;

    const newProject = {
        id: Date.now(),
        name: name,
        activities: [],
        tasks: [],
        createdAt: new Date().toISOString()
    };

    allProjects.push(newProject);
    currentProject = newProject;
    saveProjects();
    updateProjectSelector();
    showToast('✅ Proyecto creado exitosamente');
}

function saveCurrentProject() {
    const nameInput = document.getElementById('project-name');
    if (nameInput && currentProject) {
        currentProject.name = nameInput.value;
        saveProjects();
    }
}

function addActivityToProject() {
    if (!selectedAPU) {
        alert('Selecciona una actividad primero');
        return;
    }

    const cantidad = parseFloat(document.getElementById('cantidad').value);
    if (!cantidad || cantidad <= 0) {
        alert('Ingresa una cantidad válida');
        return;
    }

    const activity = {
        ...selectedAPU,
        cantidad: cantidad,
        addedAt: new Date().toISOString()
    };

    currentProject.activities.push(activity);
    saveProjects();

    document.getElementById('add-activity-form').style.display = 'none';
    selectedAPU = null;

    showToast('✅ Actividad agregada al proyecto');
}

function removeActivity(index) {
    if (confirm('¿Eliminar esta actividad?')) {
        currentProject.activities.splice(index, 1);
        saveProjects();
        showToast('🗑️ Actividad eliminada');
    }
}

function editActivityQuantity(index) {
    const activity = currentProject.activities[index];
    const newQty = prompt(`Nueva cantidad (${activity.unidad}):`, activity.cantidad);

    if (newQty && !isNaN(newQty) && newQty > 0) {
        activity.cantidad = parseFloat(newQty);
        saveProjects();
        showToast('✅ Cantidad actualizada');
    }
}

function cancelAddActivity() {
    document.getElementById('add-activity-form').style.display = 'none';
    selectedAPU = null;
}

// ===============================================
// 6. TASKS FUNCTIONS
// ===============================================
function addTaskFromInput() {
    const input = document.getElementById('new-task-input');
    const text = input.value.trim();

    if (!text) {
        alert('Escribe una tarea primero');
        return;
    }

    if (!currentProject.tasks) currentProject.tasks = [];

    currentProject.tasks.push({
        text: text,
        completed: false,
        createdAt: new Date().toISOString()
    });

    input.value = '';
    saveProjects();
    showToast('✅ Tarea agregada');
}

function toggleTask(index) {
    currentProject.tasks[index].completed = !currentProject.tasks[index].completed;
    saveProjects();
}

function deleteTask(index) {
    if (confirm('¿Eliminar esta tarea?')) {
        currentProject.tasks.splice(index, 1);
        saveProjects();
    }
}

// ===============================================
// 7. APU NAVIGATOR
// ===============================================
function initializeAPUNavigator() {
    const container = document.getElementById('apu-navigator');
    if (!container) return;

    container.innerHTML = `
        <div class="search-container">
            <div class="search-box">
                <span class="search-icon">🔍</span>
                <input type="text" id="apu-search" placeholder="Buscar actividades..." onkeyup="searchAPUs()">
            </div>
        </div>
        <div id="apu-results"></div>
    `;

    displayAPUs(apuDatabase);
}

function searchAPUs() {
    const input = document.getElementById('apu-search');
    const query = input.value.toLowerCase().trim();

    if (!query) {
        displayAPUs(apuDatabase);
        return;
    }

    const filtered = apuDatabase.filter(apu =>
        apu.nombre.toLowerCase().includes(query) ||
        apu.categoria.toLowerCase().includes(query)
    );

    displayAPUs(filtered);
}

function displayAPUs(apus) {
    const resultsDiv = document.getElementById('apu-results');
    if (!resultsDiv) return;

    if (apus.length === 0) {
        resultsDiv.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">🔍</div>
                <div class="no-results-text">No se encontraron resultados</div>
            </div>
        `;
        return;
    }

    let html = `<div class="results-header">
        <div id="results-count">${apus.length} actividades</div>
    </div><div class="apu-grid">`;

    apus.forEach(apu => {
        html += `
            <div class="apu-card" onclick="selectAPU(${apu.id})">
                <div class="apu-card-header">
                    <div class="apu-category">${apu.categoria}</div>
                    <div class="apu-unit">${apu.unidad}</div>
                </div>
                <div class="apu-card-title">${apu.nombre}</div>
                <div class="apu-card-meta">
                    <span class="apu-price">${formatMoney(apu.precio)}/${apu.unidad}</span>
                </div>
                <button class="apu-select-btn" onclick="event.stopPropagation(); selectAPU(${apu.id})">
                    ➕ Seleccionar
                </button>
            </div>
        `;
    });

    html += '</div>';
    resultsDiv.innerHTML = html;
}

function selectAPU(apuId) {
    selectedAPU = apuDatabase.find(a => a.id === apuId);
    if (!selectedAPU) return;

    document.getElementById('selected-apu-name').textContent = selectedAPU.nombre;
    document.getElementById('unidad-display').value = selectedAPU.unidad;
    document.getElementById('cantidad').value = 1;

    document.getElementById('apu-details-content').innerHTML = `
        <div class="apu-details">
            <div class="detail-section">
                <div class="detail-title">Categoría</div>
                <div class="detail-item">${selectedAPU.categoria}</div>
            </div>
            <div class="detail-section">
                <div class="detail-title">Precio Unitario</div>
                <div class="detail-item">${formatMoney(selectedAPU.precio)} / ${selectedAPU.unidad}</div>
            </div>
        </div>
    `;

    document.getElementById('add-activity-form').style.display = 'block';
    document.getElementById('add-activity-form').scrollIntoView({ behavior: 'smooth' });
}

// ===============================================
// 8. CHAT FUNCTIONS
// ===============================================
function initializeChat() {
    const input = document.getElementById('chat-input');
    if (input) {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    if (!message) return;

    addUserMessage(message);
    input.value = '';

    // Process message
    setTimeout(() => {
        processClaudiaResponse(message);
    }, 500);
}

function addUserMessage(text) {
    const msg = {
        role: 'user',
        content: text,
        timestamp: Date.now()
    };

    chatMessages.push(msg);
    displayMessage(msg);
    saveChatHistory();
}

function addClaudiaMessage(text) {
    const msg = {
        role: 'claudia',
        content: text,
        timestamp: Date.now()
    };

    chatMessages.push(msg);
    displayMessage(msg);
    saveChatHistory();
}

function displayMessage(msg) {
    const messagesDiv = document.getElementById('chat-messages');
    if (!messagesDiv) return;

    const isUser = msg.role === 'user';
    const avatar = isUser ? '👤' : '🤖';

    const messageEl = document.createElement('div');
    messageEl.className = `message ${msg.role}`;
    messageEl.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">${msg.content}</div>
    `;

    messagesDiv.appendChild(messageEl);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function processClaudiaResponse(userMessage) {
    const lower = userMessage.toLowerCase();
    let response = '';

    // Simple AI responses
    if (lower.includes('hola') || lower.includes('hi')) {
        response = '¡Hola! ¿En qué puedo ayudarte con tu proyecto?';
    } else if (lower.includes('actividad') || lower.includes('apu')) {
        response = `Actualmente tienes ${currentProject.activities?.length || 0} actividades en tu proyecto. ¿Quieres buscar más?`;
    } else if (lower.includes('tarea')) {
        const pending = currentProject.tasks?.filter(t => !t.completed).length || 0;
        response = `Tienes ${pending} tareas pendientes. ¿Necesitas ayuda para organizarlas?`;
    } else if (lower.includes('total') || lower.includes('precio') || lower.includes('costo')) {
        const total = currentProject.activities?.reduce((sum, act) => sum + (act.cantidad * act.precio), 0) || 0;
        response = `El total de tu proyecto es ${formatMoney(total)}. ¿Quieres ver el desglose?`;
    } else if (lower.includes('ayuda') || lower.includes('help')) {
        response = 'Puedo ayudarte a:\n• Buscar actividades\n• Calcular costos\n• Gestionar tareas\n• Crear presupuestos\n\n¿Qué necesitas?';
    } else {
        response = 'Entiendo. ¿Puedes darme más detalles sobre lo que necesitas?';
    }

    addClaudiaMessage(response);
}

// ===============================================
// 9. UTILITIES
// ===============================================
function formatMoney(amount) {
    return '$' + Math.round(amount).toLocaleString('es-CL');
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification toast-info show';
    toast.innerHTML = `
        <span class="toast-icon">✓</span>
        <span class="toast-message">${message}</span>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 2000);
}

// ===============================================
// 10. DUMMY FUNCTIONS (for buttons that exist in HTML)
// ===============================================
function showTemplates() {
    showToast('💡 Función de plantillas próximamente');
}

function showProjectOptions() {
    showToast('⚙️ Opciones de proyecto próximamente');
}

function exportToExcel() {
    showToast('📊 Export a Excel próximamente');
}

function shareProject() {
    showToast('📤 Compartir proyecto próximamente');
}

function viewProjectBudget() {
    showToast('💰 Vista de presupuesto próximamente');
}

function showDashboard() {
    showToast('📊 Dashboard próximamente');
}

function showLogConfig() {
    showToast('⚙️ Configuración de bitácora próximamente');
}

function previewDailyLog() {
    showToast('👁️ Vista previa de bitácora próximamente');
}

function startVoiceRecording(e) {
    e.preventDefault();
    showToast('🎙️ Grabación de voz próximamente');
}

function stopVoiceRecording() {
    // No-op for now
}

console.log('✅ CLAUDIA Main App loaded');

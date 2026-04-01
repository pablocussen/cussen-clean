/**
 * CLAUDIA v8.4 PRO - COMPLETE WITH ALL MODULES
 * + APU Database expanded to 200
 * + Activity list is now sorted by category and name
 * + Excel profesional con formato
 * + Galería de fotos con preview fullscreen
 * + Chat IA inteligente y contextual
 * + Comparador de precios (6 proveedores)
 * + Optimizador de costos
 * + Optimizador de compra al por mayor
 * + Smart Shopping integrado
 */

// ============================================
// GLOBAL STATE
// ============================================
let currentProject = null;
let allProjects = [];
let apuDatabase = [];
let selectedAPU = null;
let chatMessages = [];
let projectPhotos = [];

// ============================================
// PLANTILLAS PREDEFINIDAS
// ============================================
const projectTemplates = [
    {
        id: 'casa-basic',
        name: '🏠 Casa Básica',
        description: 'Construcción casa 60m²',
        icon: '🏠',
        activities: [
            { nombre: 'Excavación manual', categoria: 'Movimiento de Tierras', unidad: 'm3', precio: 15000, cantidad: 20 },
            { nombre: 'Radier e=10cm', categoria: 'Radieres', unidad: 'm2', precio: 12000, cantidad: 60 },
            { nombre: 'Albañilería ladrillo fiscal', categoria: 'Albañilería', unidad: 'm2', precio: 25000, cantidad: 120 },
            { nombre: 'Hormigón H20', categoria: 'Hormigones', unidad: 'm3', precio: 85000, cantidad: 8 },
            { nombre: 'Cubierta teja asfáltica', categoria: 'Techumbres', unidad: 'm2', precio: 22000, cantidad: 70 }
        ]
    },
    {
        id: 'ampliacion',
        name: '📐 Ampliación',
        description: 'Ampliación 30m²',
        icon: '📐',
        activities: [
            { nombre: 'Radier e=10cm', categoria: 'Radieres', unidad: 'm2', precio: 12000, cantidad: 30 },
            { nombre: 'Albañilería ladrillo fiscal', categoria: 'Albañilería', unidad: 'm2', precio: 25000, cantidad: 60 },
            { nombre: 'Ventana aluminio 1x1', categoria: 'Ventanas', unidad: 'un', precio: 75000, cantidad: 2 },
            { nombre: 'Puerta interior 0.9x2', categoria: 'Puertas', unidad: 'un', precio: 95000, cantidad: 1 }
        ]
    },
    {
        id: 'remodelacion',
        name: '🔨 Remodelación',
        description: 'Remodelación interior',
        icon: '🔨',
        activities: [
            { nombre: 'Estuco interior', categoria: 'Terminaciones', unidad: 'm2', precio: 8500, cantidad: 80 },
            { nombre: 'Pintura látex', categoria: 'Pinturas', unidad: 'm2', precio: 4500, cantidad: 100 },
            { nombre: 'Cerámica piso 40x40', categoria: 'Cerámicas', unidad: 'm2', precio: 18000, cantidad: 40 },
            { nombre: 'Cielo falso yeso cartón', categoria: 'Cielos', unidad: 'm2', precio: 14000, cantidad: 50 }
        ]
    },
    {
        id: 'bano',
        name: '🚿 Baño Completo',
        description: 'Construcción baño 6m²',
        icon: '🚿',
        activities: [
            { nombre: 'Cerámica piso 40x40', categoria: 'Cerámicas', unidad: 'm2', precio: 18000, cantidad: 6 },
            { nombre: 'Instalación agua potable', categoria: 'Grifería', unidad: 'pto', precio: 22000, cantidad: 4 },
            { nombre: 'Instalación eléctrica', categoria: 'Electricidad', unidad: 'pto', precio: 18000, cantidad: 3 }
        ]
    },
    {
        id: 'quincho',
        name: '🍖 Quincho 4x6m',
        description: 'Quincho con cobertizo',
        icon: '🍖',
        activities: [
            { nombre: 'Radier e=10cm con malla', categoria: 'HORMIGON', unidad: 'm2', precio: 18000, cantidad: 24 },
            { nombre: 'Pilares metálicos', categoria: 'ESTRUCTURA METALICA', unidad: 'un', precio: 45000, cantidad: 6 },
            { nombre: 'Cubierta zinc ondulado', categoria: 'TECHUMBRE', unidad: 'm2', precio: 8500, cantidad: 28 },
            { nombre: 'Muro ladrillo princesa 14cm', categoria: 'ALBANILERIA', unidad: 'm2', precio: 18000, cantidad: 12 },
            { nombre: 'Estuco exterior impermeable', categoria: 'TERMINACIONES', unidad: 'm2', precio: 6500, cantidad: 24 }
        ]
    },
    {
        id: 'cierre',
        name: '🧱 Cierre Perímetro',
        description: 'Cierre 20m lineales',
        icon: '🧱',
        activities: [
            { nombre: 'Excavación para cimientos', categoria: 'MOVIMIENTO DE TIERRAS', unidad: 'ml', precio: 7200, cantidad: 20 },
            { nombre: 'Cimiento corrido hormigón', categoria: 'HORMIGON', unidad: 'ml', precio: 12000, cantidad: 20 },
            { nombre: 'Muro bloque cemento 19cm', categoria: 'ALBANILERIA', unidad: 'm2', precio: 19000, cantidad: 40 },
            { nombre: 'Cadena hormigón sobre muro', categoria: 'ALBANILERIA', unidad: 'ml', precio: 15000, cantidad: 20 },
            { nombre: 'Estuco exterior corriente', categoria: 'TERMINACIONES', unidad: 'm2', precio: 6500, cantidad: 80 },
            { nombre: 'Pintura látex exterior 2 manos', categoria: 'PINTURA', unidad: 'm2', precio: 4200, cantidad: 80 }
        ]
    },
    {
        id: 'segundo-piso',
        name: '🏢 Segundo Piso',
        description: 'Ampliación 50m² arriba',
        icon: '🏢',
        activities: [
            { nombre: 'Losa hormigón 15cm', categoria: 'HORMIGON', unidad: 'm2', precio: 25000, cantidad: 50 },
            { nombre: 'Muro ladrillo princesa 14cm', categoria: 'ALBANILERIA', unidad: 'm2', precio: 18000, cantidad: 80 },
            { nombre: 'Ventana PVC 2 hojas 150x120', categoria: 'CARPINTERIA', unidad: 'un', precio: 185000, cantidad: 4 },
            { nombre: 'Puerta interior MDF 80cm', categoria: 'CARPINTERIA', unidad: 'un', precio: 85000, cantidad: 3 },
            { nombre: 'Cubierta teja asfáltica', categoria: 'TECHUMBRE', unidad: 'm2', precio: 15000, cantidad: 60 },
            { nombre: 'Instalación eléctrica completa', categoria: 'INSTALACIONES ELECTRICAS', unidad: 'pto', precio: 18000, cantidad: 12 }
        ]
    },
    {
        id: 'cocina',
        name: '🍳 Cocina Completa',
        description: 'Remodelación cocina 12m²',
        icon: '🍳',
        activities: [
            { nombre: 'Demolición revestimiento existente', categoria: 'MOVIMIENTO DE TIERRAS', unidad: 'm2', precio: 4500, cantidad: 30 },
            { nombre: 'Cerámica muro 30x60', categoria: 'TERMINACIONES', unidad: 'm2', precio: 16000, cantidad: 20 },
            { nombre: 'Porcelanato piso 60x60', categoria: 'TERMINACIONES', unidad: 'm2', precio: 22000, cantidad: 12 },
            { nombre: 'Muebles cocina melamina', categoria: 'CARPINTERIA', unidad: 'ml', precio: 85000, cantidad: 4 },
            { nombre: 'Instalación agua caliente/fría', categoria: 'INSTALACIONES SANITARIAS', unidad: 'pto', precio: 22000, cantidad: 3 },
            { nombre: 'Instalación eléctrica cocina', categoria: 'INSTALACIONES ELECTRICAS', unidad: 'pto', precio: 18000, cantidad: 6 }
        ]
    },
    {
        id: 'techo',
        name: '🏠 Re-techar Casa',
        description: 'Cambio techumbre 80m²',
        icon: '🏠',
        activities: [
            { nombre: 'Retiro techumbre existente', categoria: 'MOVIMIENTO DE TIERRAS', unidad: 'm2', precio: 3500, cantidad: 80 },
            { nombre: 'Estructura madera pino 2x4', categoria: 'TECHUMBRE', unidad: 'm2', precio: 12000, cantidad: 80 },
            { nombre: 'Entablado pino 1x6', categoria: 'TECHUMBRE', unidad: 'm2', precio: 8500, cantidad: 85 },
            { nombre: 'Fieltro asfáltico 15lb', categoria: 'TECHUMBRE', unidad: 'm2', precio: 2500, cantidad: 85 },
            { nombre: 'Cubierta zinc ondulado #28', categoria: 'TECHUMBRE', unidad: 'm2', precio: 8500, cantidad: 85 },
            { nombre: 'Canaleta zinc rectangular', categoria: 'TECHUMBRE', unidad: 'ml', precio: 4500, cantidad: 20 },
            { nombre: 'Bajada PVC 75mm', categoria: 'TECHUMBRE', unidad: 'ml', precio: 4200, cantidad: 12 }
        ]
    },
    {
        id: 'piscina',
        name: '🏊 Piscina 6x3m',
        description: 'Piscina hormigón básica',
        icon: '🏊',
        activities: [
            { nombre: 'Excavación piscina', categoria: 'MOVIMIENTO DE TIERRAS', unidad: 'm3', precio: 9500, cantidad: 30 },
            { nombre: 'Emplantillado hormigón pobre', categoria: 'HORMIGON', unidad: 'm2', precio: 8500, cantidad: 20 },
            { nombre: 'Muro hormigón 20cm armado', categoria: 'HORMIGON', unidad: 'm2', precio: 42000, cantidad: 36 },
            { nombre: 'Losa fondo hormigón 15cm', categoria: 'HORMIGON', unidad: 'm2', precio: 25000, cantidad: 18 },
            { nombre: 'Impermeabilización cemento', categoria: 'AISLACION', unidad: 'm2', precio: 8500, cantidad: 54 },
            { nombre: 'Revestimiento cerámica', categoria: 'TERMINACIONES', unidad: 'm2', precio: 22000, cantidad: 54 },
            { nombre: 'Sistema filtración básico', categoria: 'EQUIPAMIENTO', unidad: 'un', precio: 450000, cantidad: 1 }
        ]
    }
];

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 CLAUDIA v8.4 PRO Starting...');

    // Cargar datos desde localStorage
    loadProjects();
    loadAPUDatabase();
    loadChatHistory();
    loadPhotos();

    // Inicializar componentes de UI
    initializeChat();
    initializeAPUNavigator();
    initializePhotoGallery();
    updateUI();

    // Renderizar historial de chat DESPUÉS de que el DOM esté listo
    renderChatHistory();

    // Solo mostrar mensaje de bienvenida si NO hay historial
    if (chatMessages.length === 0) {
        const proWelcome = `¡Hola Maestro! 👷 Soy CLAUDIA, tu asistente para hacer **presupuestos profesionales** y **maximizar tus utilidades**.\n\n💰 **Te ayudo a ganar más**:\n• Calculo materiales exactos por m² (sin desperdicios)\n• Comparo precios en 6 ferreterías (compra más barato)\n• Encuentro descuentos mayoristas (15-20% menos)\n• Presupuestos Excel/PDF profesionales (impresiona clientes)\n• Te recuerdo agregar tu margen de ganancia\n\n⚡ **Rápido y fácil**: Crea un proyecto, agrega actividades, yo hago los cálculos.\n\n¿Empezamos? 🏗️`;
        addClaudiaMessage(proWelcome);
    }

    console.log('✅ CLAUDIA v8.4 PRO Ready - Chat loaded:', chatMessages.length, 'messages');
});

// ============================================
// DATA PERSISTENCE
// ============================================
function loadProjects() {
    try {
        const saved = localStorage.getItem('claudia_projects_v2');
        allProjects = saved ? JSON.parse(saved) : [];

        if (allProjects.length === 0) {
            currentProject = createDefaultProject();
            allProjects.push(currentProject);
            saveProjects();
        } else {
            currentProject = allProjects[0];
            if (currentProject.activities) {
                sortActivities(currentProject.activities);
            }
        }

        updateProjectSelector();
    } catch(e) {
        console.error('Error loading:', e);
        currentProject = createDefaultProject();
        allProjects = [currentProject];
    }
}

function createDefaultProject() {
    return {
        id: Date.now(),
        name: 'Mi Proyecto',
        activities: [],
        tasks: [],
        photos: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

function saveProjects() {
    try {
        currentProject.updatedAt = new Date().toISOString();
        localStorage.setItem('claudia_projects_v2', JSON.stringify(allProjects));
        updateUI();
    } catch(e) {
        console.error('Error saving:', e);
        showToast('❌ Error al guardar');
    }
}

async function loadAPUDatabase() {
    try {
        // Intentar cargar versión minificada primero (más rápido)
        const response = await fetch('apu_database.min.json').catch(() =>
            fetch('apu_database.json') // Fallback a versión completa
        );

        if (!response.ok) throw new Error('Failed to load APU database');

        const data = await response.json();
        apuDatabase = data.actividades || [];
        window.apuDatabase = apuDatabase; // Export to global scope

        console.log(`✅ Loaded ${apuDatabase.length} APUs from database`);

        // Actualizar UI si ya está lista
        if (document.getElementById('apu-results')) {
            initializeAPUNavigator();
        }
    } catch (error) {
        console.error('❌ Error loading APU database:', error);

        // Fallback a APUs básicos hardcodeados
        apuDatabase = [
            { id: 'radier_10cm', nombre: 'Radier e=10cm, 212.5 kg/m3', categoria: 'HORMIGONES', unidad: 'm2', precio_referencia: 18500 },
            { id: 'muro_fiscal_15cm', nombre: 'Albañilería Ladrillo Fiscal e=15cm', categoria: 'ALBANILERIA', unidad: 'm2', precio_referencia: 24500 },
            { id: 'excavacion_zanja', nombre: 'Excavación zanja a brazo', categoria: 'MOVIMIENTO TIERRA', unidad: 'm3', precio_referencia: 12000 },
            { id: 'moldaje_muro', nombre: 'Moldaje muro (2.5 usos)', categoria: 'MOLDAJES', unidad: 'm2', precio_referencia: 8500 },
            { id: 'enfierradura_d10', nombre: 'Enfierradura D=10mm A44-28', categoria: 'ENFIERRADURAS', unidad: 'kg', precio_referencia: 1850 },
            { id: 'estuco_exterior', nombre: 'Estuco exterior sobre albañilería', categoria: 'REVESTIMIENTOS', unidad: 'm2', precio_referencia: 7500 },
            { id: 'pintura_latex_interior', nombre: 'Pintura látex interior 2 manos', categoria: 'REVESTIMIENTOS', unidad: 'm2', precio_referencia: 3200 },
            { id: 'ceramica_piso', nombre: 'Cerámica piso 30x30 cm', categoria: 'PAVIMENTOS', unidad: 'm2', precio_referencia: 12500 },
            { id: 'inodoro_instalacion', nombre: 'Instalación WC completo', categoria: 'VARIOS', unidad: 'un', precio_referencia: 85000 },
            { id: 'lavamanos_pedestal', nombre: 'Instalación lavamanos pedestal', categoria: 'VARIOS', unidad: 'un', precio_referencia: 65000 }
        ];
        window.apuDatabase = apuDatabase; // Export to global scope

        console.warn(`⚠️ Using ${apuDatabase.length} fallback APUs`);
    }
}

function loadChatHistory() {
    try {
        const saved = localStorage.getItem('claudia_chat_v2');
        chatMessages = saved ? JSON.parse(saved) : [];
        // NO mostrar mensajes aquí - se mostrarán después cuando el DOM esté listo
    } catch(e) {
        chatMessages = [];
    }
}

function renderChatHistory() {
    const messagesDiv = document.getElementById('chat-messages');
    if (!messagesDiv) return;

    // Limpiar mensajes existentes para evitar duplicados
    messagesDiv.innerHTML = '';

    // Renderizar todos los mensajes guardados
    chatMessages.forEach(msg => displayMessage(msg));
}

function saveChatHistory() {
    try {
        localStorage.setItem('claudia_chat_v2', JSON.stringify(chatMessages.slice(-50)));
    } catch(e) {}
}

function loadPhotos() {
    try {
        const saved = localStorage.getItem('claudia_photos');
        projectPhotos = saved ? JSON.parse(saved) : [];
    } catch(e) {
        projectPhotos = [];
    }
}

function savePhotos() {
    try {
        localStorage.setItem('claudia_photos', JSON.stringify(projectPhotos));
    } catch(e) {}
}

// ============================================
// UI UPDATES
// ============================================
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
                <div style="font-size: 13px; color: #757575;">Usa una plantilla o busca actividades</div>
            </div>
        `;
        document.getElementById('project-summary').style.display = 'none';
        return;
    }

    // VALIDACIÓN CRÍTICA: Asegurar que todas las actividades tengan datos válidos
    let total = 0;

    // AGRUPAR POR CATEGORÍA - PRO
    const actividadesPorCategoria = {};
    currentProject.activities.forEach((act, index) => {
        const categoria = act.categoria || 'SIN CATEGORÍA';
        if (!actividadesPorCategoria[categoria]) {
            actividadesPorCategoria[categoria] = [];
        }
        actividadesPorCategoria[categoria].push({...act, originalIndex: index});
    });

    // Calcular total primero para porcentajes
    currentProject.activities.forEach(act => {
        const cantidad = parseFloat(act.cantidad) || 0;
        const precio = parseFloat(act.precio) || 0;
        total += cantidad * precio;
    });

    let html = '<div class="project-activities-list-pro">';

    // Renderizar por categoría
    Object.keys(actividadesPorCategoria).sort().forEach(categoria => {
        const actividades = actividadesPorCategoria[categoria];
        let subtotalCategoria = 0;

        // Calcular subtotal de categoría
        actividades.forEach(act => {
            const cantidad = parseFloat(act.cantidad) || 0;
            const precio = parseFloat(act.precio) || 0;
            subtotalCategoria += cantidad * precio;
        });

        const porcentajeCategoria = total > 0 ? (subtotalCategoria / total * 100).toFixed(1) : 0;

        // Header de categoría
        html += `
            <div class="category-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 20px; border-radius: 8px; margin: 20px 0 10px 0; display: flex; justify-content: space-between; align-items: center; font-weight: 700;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span>${categoria}</span>
                    <span style="background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">${actividades.length} actividades</span>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 18px;">${formatMoney(subtotalCategoria)}</div>
                    <div style="font-size: 11px; opacity: 0.9;">${porcentajeCategoria}% del total</div>
                </div>
            </div>
        `;

        // Actividades de la categoría
        actividades.forEach((act) => {
            const index = act.originalIndex;
            const cantidad = parseFloat(act.cantidad) || 0;
            const precio = parseFloat(act.precio) || 0;
            const subtotal = cantidad * precio;
            const porcentaje = total > 0 ? (subtotal / total * 100).toFixed(1) : 0;

            html += `
                <div class="project-activity-item-pro" style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 8px; transition: all 0.2s;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                        <div style="flex: 1;">
                            <div class="project-activity-name" style="font-weight: 600; font-size: 15px; color: #1f2937; margin-bottom: 6px;">${act.nombre || 'Sin nombre'}</div>
                            <div class="project-activity-details" style="font-size: 13px; color: #6b7280;">
                                <span class="activity-quantity-display" onclick="editActivityQuantity(${index})" title="Click para editar" style="background: #f3f4f6; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-weight: 600; color: #3b82f6;">
                                    ${cantidad} ${act.unidad || 'un'} ✏️
                                </span>
                                <span style="margin: 0 8px;">×</span>
                                <span style="font-weight: 600;">${formatMoney(precio)}/${act.unidad || 'un'}</span>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 20px; font-weight: 700; color: #10b981; margin-bottom: 2px;">${formatMoney(subtotal)}</div>
                            <div style="font-size: 11px; color: #6b7280; background: #f0fdf4; padding: 2px 8px; border-radius: 10px; display: inline-block;">${porcentaje}%</div>
                        </div>
                    </div>
                    <div class="project-activity-actions" style="display: flex; gap: 6px; flex-wrap: wrap;">
                        <button class="breakdown-btn project-activity-btn" onclick="showMaterialsBreakdown('${(act.nombre || '').replace(/'/g, "\\'")}', ${cantidad})" title="Ver materiales" style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">📦 Materiales</button>
                        <button class="compare-price-btn project-activity-btn" onclick="comparePriceForActivity('${(act.nombre || '').replace(/'/g, "\\'")}', ${index})" title="Comparar precios" style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">💰 Comparar</button>
                        <button onclick="duplicateActivity(${index})" title="Duplicar" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">📋 Duplicar</button>
                        <button class="project-activity-delete" onclick="removeActivity(${index})" title="Eliminar" style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">🗑️ Eliminar</button>
                    </div>
                </div>
            `;
        });
    });

    html += '</div>';
    activitiesDiv.innerHTML = html;

    // MOSTRAR PRECIO TOTAL - PUNTO CRÍTICO #1
    document.getElementById('project-total-amount').textContent = formatMoney(total);

    // MOSTRAR CUBICACIÓN RESUMIDA - PUNTO CRÍTICO #2
    const activityCount = currentProject.activities.length;
    const avgCost = total / activityCount;

    // Actualizar resumen de cubicación si existe el elemento
    const cubicacionElement = document.getElementById('project-cubicacion-summary');
    if (cubicacionElement) {
        cubicacionElement.innerHTML = `
            <div style="display: flex; justify-content: space-around; text-align: center;">
                <div>
                    <div style="font-size: 28px; font-weight: 700; color: #667eea;">${activityCount}</div>
                    <div style="font-size: 12px; color: #666; margin-top: 2px;">Actividades</div>
                </div>
                <div>
                    <div style="font-size: 28px; font-weight: 700; color: #10b981;">${formatMoney(avgCost)}</div>
                    <div style="font-size: 12px; color: #666; margin-top: 2px;">Promedio/Act.</div>
                </div>
                <div>
                    <div style="font-size: 28px; font-weight: 700; color: #f59e0b;">${formatMoney(total)}</div>
                    <div style="font-size: 12px; color: #666; margin-top: 2px;">Total</div>
                </div>
            </div>
        `;
    }

    document.getElementById('project-summary').style.display = 'block';

    // Activar animación del botón de lista de compras
    const shoppingBtn = document.getElementById('shopping-list-btn');
    if (shoppingBtn) {
        shoppingBtn.classList.add('has-activities');
    }

    // Actualizar contador de materiales en el botón - PUNTO CRÍTICO #3
    updateShoppingListButtonBadge();
}

/**
 * Actualizar badge del botón de lista de compras
 */
function updateShoppingListButtonBadge() {
    const shoppingBtn = document.getElementById('shopping-list-btn');
    if (!shoppingBtn || !currentProject || !currentProject.activities) return;

    // Contar materiales únicos
    const apuDB = window.apuDatabase || apuDatabase || [];
    const materialesSet = new Set();

    currentProject.activities.forEach(activity => {
        const apu = apuDB.find(a =>
            a.nombre.toLowerCase() === activity.nombre.toLowerCase() ||
            a.id === activity.id
        );

        if (apu && apu.materiales) {
            apu.materiales.forEach(mat => {
                materialesSet.add(mat.nombre.toLowerCase().trim());
            });
        }
    });

    const materialCount = materialesSet.size;
    if (materialCount > 0) {
        shoppingBtn.innerHTML = `
            <span aria-hidden="true" style="font-size: 24px; margin-right: 8px;">🛒</span>
            <span style="font-size: 17px; letter-spacing: 0.5px;">LISTA DE COMPRAS</span>
            <span style="position: absolute; top: 8px; right: 12px; background: #fff; color: #10b981; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">${materialCount} items</span>
        `;
    }
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
                <div style="font-size: 13px; color: #757575;">Agrega tareas para organizar</div>
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
    const photosCount = currentProject.photos?.length || 0;

    bitacoraDiv.innerHTML = `
        <div class="project-info">
            <div class="project-name">${currentProject.name}</div>
            <div class="project-meta">
                <span>📅 ${today}</span>
                <span>📋 ${activitiesCount} APUs</span>
            </div>
        </div>

        <div class="timeline">
            <div class="timeline-item">
                <div class="timeline-date">Hoy</div>
                <div class="timeline-content">
                    ✅ ${completedTasks}/${tasksCount} tareas<br>
                    💰 ${activitiesCount} actividades<br>
                    📸 ${photosCount} fotos
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
                <div class="alert-text">${pendingTasks} tareas sin completar</div>
            </div>
        `;
    }

    if (currentProject.activities?.length === 0) {
        html += `
            <div class="alert-item info">
                <div class="alert-title">💡 Usa una Plantilla</div>
                <div class="alert-text">Click en "Plantilla" para empezar rápido</div>
            </div>
        `;
    }

    if (!html) {
        html = `
            <div class="alert-item success">
                <div class="alert-title">✅ Todo Bien</div>
                <div class="alert-text">Proyecto en marcha</div>
            </div>
        `;
    }

    alertsDiv.innerHTML = html;
}

// ============================================
// PLANTILLAS
// ============================================
function showTemplates() {
    const modal = document.getElementById('templates-modal');
    const grid = document.getElementById('templates-grid');

    let html = '';
    projectTemplates.forEach(template => {
        html += `
            <div class="template-card" onclick="applyTemplate('${template.id}')">
                <div class="template-icon">${template.icon}</div>
                <div class="template-name">${template.name}</div>
                <div class="template-desc">${template.description}</div>
                <div class="template-count">${template.activities.length} actividades</div>
            </div>
        `;
    });

    grid.innerHTML = html;
    modal.classList.add('active');
}

function closeTemplates() {
    document.getElementById('templates-modal').classList.remove('active');
}

function applyTemplate(templateId) {
    const template = projectTemplates.find(t => t.id === templateId);
    if (!template) return;

    if (currentProject.activities.length > 0) {
        if (!confirm('¿Reemplazar actividades actuales?')) return;
    }

    currentProject.activities = JSON.parse(JSON.stringify(template.activities));
    sortActivities(currentProject.activities);
    saveProjects();
    closeTemplates();
    showToast(`✅ Plantilla "${template.name}" aplicada`);
}

// ============================================
// FOTOS
// ============================================
function initializePhotoGallery() {
    // Add photo input handler
    const photoBtn = document.createElement('button');
    photoBtn.className = 'btn btn-secondary';
    photoBtn.innerHTML = '<span>📸</span><span>Fotos</span>';
    photoBtn.onclick = showPhotoGallery;

    // Could be added to UI but keeping it simple for now
}

function showPhotoGallery() {
    const gallery = prompt('📸 Funcionalidad de fotos:\n\n1. Tomar foto con cámara\n2. Subir desde galería\n3. Ver galería\n\nEscribe 1, 2 o 3:');

    if (gallery === '1') {
        takePhoto();
    } else if (gallery === '2') {
        uploadPhoto();
    } else if (gallery === '3') {
        viewGallery();
    }
}

function takePhoto() {
    // Simulate camera
    const photoData = {
        id: Date.now(),
        projectId: currentProject.id,
        timestamp: new Date().toISOString(),
        description: prompt('Descripción de la foto:') || 'Sin descripción',
        simulated: true
    };

    if (!currentProject.photos) currentProject.photos = [];
    currentProject.photos.push(photoData);
    projectPhotos.push(photoData);

    saveProjects();
    savePhotos();
    showToast('📸 Foto agregada');
}

function uploadPhoto() {
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            const photoData = {
                id: Date.now(),
                projectId: currentProject.id,
                timestamp: new Date().toISOString(),
                data: event.target.result,
                filename: file.name,
                description: prompt('Descripción:') || file.name
            };

            if (!currentProject.photos) currentProject.photos = [];
            currentProject.photos.push(photoData);
            projectPhotos.push(photoData);

            saveProjects();
            savePhotos();
            showToast('📸 Foto subida');
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

function viewGallery() {
    const photos = currentProject.photos || [];

    if (photos.length === 0) {
        alert('No hay fotos en este proyecto');
        return;
    }

    // Create modal with photo grid
    let modal = document.getElementById('photo-gallery-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'photo-gallery-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 900px;">
                <div class="modal-header">
                    <h3>📸 Galería de Fotos</h3>
                    <button class="btn-close" onclick="closePhotoGallery()">×</button>
                </div>
                <div id="photo-gallery-grid" class="photo-gallery-grid"></div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    const grid = document.getElementById('photo-gallery-grid');
    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; padding: 20px;">';

    photos.forEach((photo, index) => {
        const imgSrc = photo.data || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="40"%3E📷%3C/text%3E%3C/svg%3E';

        html += `
            <div class="photo-card" onclick="viewPhotoFullscreen(${index})" style="cursor: pointer; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: transform 0.2s;">
                <img src="${imgSrc}" style="width: 100%; height: 200px; object-fit: cover;" alt="${photo.description}">
                <div style="padding: 10px; background: white;">
                    <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${photo.description}</div>
                    <div style="font-size: 11px; color: #757575;">${new Date(photo.timestamp).toLocaleDateString('es-CL')}</div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    grid.innerHTML = html;
    modal.style.display = 'flex';
}

function closePhotoGallery() {
    const modal = document.getElementById('photo-gallery-modal');
    if (modal) modal.style.display = 'none';
}

function viewPhotoFullscreen(index) {
    const photo = currentProject.photos[index];
    if (!photo) return;

    let modal = document.getElementById('photo-fullscreen-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'photo-fullscreen-modal';
        modal.className = 'modal';
        modal.style.background = 'rgba(0,0,0,0.95)';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: transparent;">
                <button class="btn-close" onclick="closePhotoFullscreen()" style="position: absolute; top: 20px; right: 20px; background: white; border-radius: 50%; width: 40px; height: 40px;">×</button>
                <div id="photo-fullscreen-content" style="max-width: 90%; max-height: 90%; text-align: center;"></div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    const content = document.getElementById('photo-fullscreen-content');
    const imgSrc = photo.data || '';
    content.innerHTML = `
        <img src="${imgSrc}" style="max-width: 100%; max-height: 80vh; border-radius: 8px; box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
        <div style="color: white; margin-top: 20px; font-size: 16px;">${photo.description}</div>
        <div style="color: #ccc; margin-top: 5px; font-size: 13px;">${new Date(photo.timestamp).toLocaleString('es-CL')}</div>
    `;

    modal.style.display = 'flex';
}

function closePhotoFullscreen() {
    const modal = document.getElementById('photo-fullscreen-modal');
    if (modal) modal.style.display = 'none';
}

// ============================================
// EXPORT TO EXCEL (PROFESSIONAL XLSX)
// ============================================
function exportToExcel() {
    if (!currentProject.activities || currentProject.activities.length === 0) {
        alert('Agrega actividades primero');
        return;
    }

    // Create HTML table with professional styling
    let total = 0;
    let html = `
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #DD0021; text-align: center; margin-bottom: 30px; }
                .info { text-align: center; color: #666; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background: #DD0021; color: white; padding: 12px; text-align: left; font-weight: bold; }
                td { padding: 10px; border-bottom: 1px solid #ddd; }
                tr:nth-child(even) { background: #f9f9f9; }
                .total-row { background: #DD0021 !important; color: white; font-weight: bold; font-size: 16px; }
                .money { text-align: right; font-weight: 600; }
                .qty { text-align: center; }
            </style>
        </head>
        <body>
            <h1>🏗️ PRESUPUESTO DE CONSTRUCCIÓN</h1>
            <div class="info">
                <strong>Proyecto:</strong> ${currentProject.name}<br>
                <strong>Fecha:</strong> ${new Date().toLocaleDateString('es-CL')}<br>
                <strong>Generado por:</strong> CLAUDIA v8.4
            </div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 40%">Actividad</th>
                        <th style="width: 15%">Categoría</th>
                        <th style="width: 10%">Cantidad</th>
                        <th style="width: 10%">Unidad</th>
                        <th style="width: 12%">Precio Unit.</th>
                        <th style="width: 13%">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
    `;

    currentProject.activities.forEach(act => {
        const subtotal = act.cantidad * act.precio;
        total += subtotal;
        html += `
                    <tr>
                        <td>${act.nombre}</td>
                        <td>${act.categoria || '-'}</td>
                        <td class="qty">${act.cantidad}</td>
                        <td class="qty">${act.unidad}</td>
                        <td class="money">${formatMoney(act.precio)}</td>
                        <td class="money">${formatMoney(subtotal)}</td>
                    </tr>
        `;
    });

    html += `
                    <tr class="total-row">
                        <td colspan="5" style="text-align: right; padding-right: 20px;">TOTAL PRESUPUESTO:</td>
                        <td class="money">${formatMoney(total)}</td>
                    </tr>
                </tbody>
            </table>
            <div style="margin-top: 30px; padding: 15px; background: #f0f0f0; border-radius: 8px; font-size: 12px; color: #666;">
                <strong>Notas:</strong><br>
                • Precios en pesos chilenos (CLP)<br>
                • ${currentProject.activities.length} actividades incluidas<br>
                • Documento generado automáticamente por CLAUDIA
            </div>
        </body>
        </html>
    `;

    // Download as HTML (opens in Excel with formatting)
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `PRESUPUESTO_${currentProject.name.replace(/ /g, '_')}_${new Date().toISOString().slice(0,10)}.xls`;
    link.click();

    showToast('📊 Excel profesional generado');
}

// ============================================
// LISTA DE COMPRAS (CUBICACIÓN DE MATERIALES)
// ============================================
function generarListaCompra() {
    // VALIDACIÓN CRÍTICA #3: Lista de compras
    if (!currentProject || !currentProject.activities || currentProject.activities.length === 0) {
        alert('⚠️ Agrega actividades a tu proyecto primero');
        return;
    }

    showToast('🛒 Generando lista de compras...', 'loading');

    // Agrupar todos los materiales del proyecto
    const materialesAgrupados = {};
    const manoObraAgrupada = {};
    let totalMateriales = 0;
    let totalManoObra = 0;

    // Obtener base de datos APU
    const apuDB = window.apuDatabase || apuDatabase || [];

    currentProject.activities.forEach(activity => {
        // Buscar el APU correspondiente
        const apu = apuDB.find(a =>
            a.nombre.toLowerCase() === activity.nombre.toLowerCase() ||
            a.id === activity.id
        );

        if (apu && apu.materiales) {
            // Agrupar materiales
            apu.materiales.forEach(mat => {
                const cantidadTotal = mat.cantidad * activity.cantidad;
                const key = mat.nombre.toLowerCase().trim();

                if (!materialesAgrupados[key]) {
                    materialesAgrupados[key] = {
                        nombre: mat.nombre,
                        cantidad: 0,
                        unidad: mat.unidad,
                        precio_unitario: mat.precio_unitario,
                        subtotal: 0
                    };
                }

                materialesAgrupados[key].cantidad += cantidadTotal;
                materialesAgrupados[key].subtotal += cantidadTotal * mat.precio_unitario;
                totalMateriales += cantidadTotal * mat.precio_unitario;
            });

            // Agrupar mano de obra
            if (apu.mano_obra) {
                apu.mano_obra.forEach(mo => {
                    const cantidadTotal = mo.cantidad * activity.cantidad;
                    const key = mo.nombre.toLowerCase().trim();

                    if (!manoObraAgrupada[key]) {
                        manoObraAgrupada[key] = {
                            nombre: mo.nombre,
                            cantidad: 0,
                            unidad: mo.unidad,
                            precio_unitario: mo.precio_unitario,
                            subtotal: 0
                        };
                    }

                    manoObraAgrupada[key].cantidad += cantidadTotal;
                    manoObraAgrupada[key].subtotal += cantidadTotal * mo.precio_unitario;
                    totalManoObra += cantidadTotal * mo.precio_unitario;
                });
            }
        }
    });

    // Convertir objetos a arrays y ordenar por categoría/nombre
    const listaMateriales = Object.values(materialesAgrupados).sort((a, b) =>
        a.nombre.localeCompare(b.nombre)
    );
    const listaManoObra = Object.values(manoObraAgrupada).sort((a, b) =>
        a.nombre.localeCompare(b.nombre)
    );

    // Check if empty
    if (listaMateriales.length === 0 && listaManoObra.length === 0) {
        alert(`⚠️ No se encontraron materiales ni mano de obra para este proyecto.

📋 Asegúrate de:
1. Tener actividades agregadas al proyecto
2. Las actividades provengan del Navegador de APUs (base de datos de 816 APUs en 24 categorías)
3. Los APUs tengan materiales definidos

💡 Tip: Prueba agregando actividades como:
   • "RADIER E=10CM" (60 m²)
   • "ALBAÑILERIA LADRILLO" (120 m²)
   • "EXCAVACIÓN MANUAL" (30 m³)

Estas actividades tienen materiales y mano de obra bien definidos.`);
        return;
    }

    // Redondear cantidades
    function roundQty(qty) {
        const rounded = Math.round(qty * 100) / 100;
        return rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(2).replace(/\.?0+$/, '');
    }

    // Generar HTML de lista de compras
    const totalGeneral = totalMateriales + totalManoObra;

    let html = `
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    background: white;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 4px solid #10b981;
                    padding-bottom: 20px;
                }
                .header h1 {
                    color: #10b981;
                    margin: 0 0 10px 0;
                    font-size: 32px;
                }
                .header .logo {
                    font-size: 48px;
                    margin-bottom: 10px;
                }
                .proyecto-info {
                    background: #f0fdf4;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 25px;
                    border-left: 5px solid #10b981;
                }
                .proyecto-info strong { color: #10b981; }

                h2 {
                    color: #10b981;
                    border-bottom: 2px solid #10b981;
                    padding-bottom: 10px;
                    margin-top: 30px;
                    font-size: 24px;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 15px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                th {
                    background: #10b981;
                    color: white;
                    padding: 12px;
                    text-align: left;
                    font-weight: bold;
                    font-size: 14px;
                }
                td {
                    padding: 10px;
                    border-bottom: 1px solid #e0e0e0;
                    font-size: 13px;
                }
                tr:nth-child(even) { background: #f9f9f9; }
                tr:hover { background: #f0fdf4; }

                .qty {
                    text-align: center;
                    font-weight: 600;
                    color: #10b981;
                }
                .money {
                    text-align: right;
                    font-weight: 600;
                    font-family: 'Courier New', monospace;
                }

                .total-row {
                    background: #10b981 !important;
                    color: white !important;
                    font-weight: bold;
                    font-size: 16px;
                }

                .subtotal-row {
                    background: #d1fae5 !important;
                    font-weight: 600;
                    color: #333;
                }

                .footer {
                    margin-top: 40px;
                    padding: 20px;
                    background: #f5f5f5;
                    border-radius: 8px;
                    font-size: 12px;
                    color: #666;
                }

                .tips {
                    background: #E3F2FD;
                    padding: 15px;
                    border-radius: 8px;
                    margin-top: 20px;
                    border-left: 4px solid #2196F3;
                }

                .tips h3 {
                    color: #1976D2;
                    margin-top: 0;
                    font-size: 16px;
                }

                .tips ul {
                    margin: 10px 0;
                    padding-left: 20px;
                }

                .tips li {
                    margin: 5px 0;
                    color: #555;
                }

                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">🛒</div>
                <h1>LISTA DE COMPRAS - CUBICACIÓN DE MATERIALES</h1>
                <p style="color: #666; margin: 5px 0;">Proyecto: <strong style="color: #10b981;">${currentProject.name}</strong></p>
            </div>

            <div class="proyecto-info">
                <strong>📅 Fecha:</strong> ${new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}<br>
                <strong>🏗️ Actividades:</strong> ${currentProject.activities.length}<br>
                <strong>💰 Presupuesto Total:</strong> ${formatMoney(totalGeneral)}<br>
                <strong>📦 Total Materiales:</strong> ${formatMoney(totalMateriales)}<br>
                <strong>👷 Total Mano de Obra:</strong> ${formatMoney(totalManoObra)}
            </div>
    `;

    // Sección de MATERIALES
    if (listaMateriales.length > 0) {
        html += `
            <h2>📦 MATERIALES A COMPRAR</h2>
            <table>
                <thead>
                    <tr>
                        <th style="width: 5%">#</th>
                        <th style="width: 45%">Material</th>
                        <th style="width: 15%">Cantidad</th>
                        <th style="width: 10%">Unidad</th>
                        <th style="width: 12%">Precio Unit.</th>
                        <th style="width: 13%">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
        `;

        listaMateriales.forEach((mat, index) => {
            html += `
                    <tr>
                        <td style="text-align: center; color: #999;">${index + 1}</td>
                        <td><strong>${mat.nombre}</strong></td>
                        <td class="qty" style="font-size: 18px; font-weight: 700; color: #10b981; background: #f0fdf4;">${roundQty(mat.cantidad)}</td>
                        <td class="qty" style="font-weight: 600; color: #666;">${mat.unidad}</td>
                        <td class="money">${formatMoney(mat.precio_unitario)}</td>
                        <td class="money" style="font-weight: 700; color: #047857;">${formatMoney(mat.subtotal)}</td>
                    </tr>
            `;
        });

        html += `
                    <tr class="subtotal-row">
                        <td colspan="5" style="text-align: right; padding-right: 20px;">SUBTOTAL MATERIALES:</td>
                        <td class="money">${formatMoney(totalMateriales)}</td>
                    </tr>
                </tbody>
            </table>
        `;
    }

    // Sección de MANO DE OBRA
    if (listaManoObra.length > 0) {
        html += `
            <h2>👷 MANO DE OBRA</h2>
            <table>
                <thead>
                    <tr>
                        <th style="width: 5%">#</th>
                        <th style="width: 45%">Especialidad</th>
                        <th style="width: 15%">Horas</th>
                        <th style="width: 10%">Unidad</th>
                        <th style="width: 12%">Precio Unit.</th>
                        <th style="width: 13%">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
        `;

        listaManoObra.forEach((mo, index) => {
            html += `
                    <tr>
                        <td style="text-align: center; color: #999;">${index + 1}</td>
                        <td><strong>${mo.nombre}</strong></td>
                        <td class="qty" style="font-size: 18px; font-weight: 700; color: #3b82f6; background: #eff6ff;">${roundQty(mo.cantidad)}</td>
                        <td class="qty" style="font-weight: 600; color: #666;">${mo.unidad}</td>
                        <td class="money">${formatMoney(mo.precio_unitario)}</td>
                        <td class="money" style="font-weight: 700; color: #1e40af;">${formatMoney(mo.subtotal)}</td>
                    </tr>
            `;
        });

        html += `
                    <tr class="subtotal-row">
                        <td colspan="5" style="text-align: right; padding-right: 20px;">SUBTOTAL MANO DE OBRA:</td>
                        <td class="money">${formatMoney(totalManoObra)}</td>
                    </tr>
                </tbody>
            </table>
        `;
    }

    // TOTAL GENERAL
    html += `
            <table style="margin-top: 20px;">
                <tbody>
                    <tr class="total-row">
                        <td style="text-align: right; padding: 15px 20px; font-size: 18px;">💰 TOTAL GENERAL:</td>
                        <td class="money" style="padding: 15px 20px; font-size: 20px; width: 13%;">${formatMoney(totalGeneral)}</td>
                    </tr>
                </tbody>
            </table>
    `;

    // TIPS PARA EL MAESTRO
    html += `
            <div class="tips">
                <h3>💡 Tips para Comprar Materiales</h3>
                <ul>
                    <li><strong>Compra mayorista:</strong> Si compras todo junto puedes negociar 5-10% adicional de descuento</li>
                    <li><strong>Revisa promociones:</strong> Consulta descuentos por volumen y formas de pago</li>
                    <li><strong>Retiro en tienda:</strong> Ahorra en despacho retirando tú mismo los materiales</li>
                    <li><strong>Horarios:</strong> Compra temprano en la mañana para mejor stock y atención</li>
                    <li><strong>Alternativas:</strong> Pregunta por productos equivalentes más económicos</li>
                    <li><strong>Agrega 10%:</strong> Considera agregar 10% extra en materiales para desperdicio</li>
                    <li><strong>Compara precios:</strong> Consulta en varias ferreterías para el mejor precio</li>
                </ul>
            </div>
    `;

    // FOOTER
    html += `
            <div class="footer">
                <strong>📋 Notas Importantes:</strong><br>
                • Precios en pesos chilenos (CLP) - Precios referenciales<br>
                • Verifica disponibilidad de productos en tu ferretería más cercana<br>
                • Esta lista fue generada automáticamente por CLAUDIA PRO<br>
                • ${listaMateriales.length} materiales distintos a comprar<br>
                • Documento generado el ${new Date().toLocaleString('es-CL')}<br>
                <br>
                <div style="text-align: center; margin-top: 15px; padding-top: 15px; border-top: 1px solid #ccc;">
                    <strong style="color: #FF6B00;">🤖 Generado con CLAUDIA PRO</strong><br>
                    <span style="font-size: 11px;">Tu asistente inteligente de construcción</span>
                </div>
            </div>
        </body>
        </html>
    `;

    // Generar texto plano para celular
    let textoPlano = `🛒 LISTA DE COMPRAS\n`;
    textoPlano += `Proyecto: ${currentProject.name}\n`;
    textoPlano += `Fecha: ${new Date().toLocaleDateString('es-CL')}\n`;
    textoPlano += `\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    textoPlano += `📦 MATERIALES (${listaMateriales.length} items)\n\n`;

    listaMateriales.forEach((mat, index) => {
        textoPlano += `${index + 1}. ${mat.nombre}\n`;
        textoPlano += `   Cantidad: ${roundQty(mat.cantidad)} ${mat.unidad}\n`;
        textoPlano += `   Precio: ${formatMoney(mat.subtotal)}\n\n`;
    });

    textoPlano += `\n━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    textoPlano += `💰 TOTAL MATERIALES: ${formatMoney(totalMateriales)}\n`;
    textoPlano += `👷 TOTAL MANO DE OBRA: ${formatMoney(totalManoObra)}\n`;
    textoPlano += `💵 TOTAL PROYECTO: ${formatMoney(totalGeneral)}\n`;
    textoPlano += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    textoPlano += `💡 Tips:\n`;
    textoPlano += `• Compara precios en varias ferreterías\n`;
    textoPlano += `• Compra por volumen para descuentos\n`;
    textoPlano += `• Agrega 5-10% extra por desperdicio\n\n`;
    textoPlano += `Generado con CLAUDIA PRO\n`;
    textoPlano += `https://claudia-i8bxh.web.app`;

    // Mostrar en modal con opción de copiar
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
    `;

    modal.innerHTML = `
        <div style="background: white; border-radius: 12px; max-width: 600px; width: 100%; max-height: 90vh; display: flex; flex-direction: column;">
            <div style="padding: 20px; border-bottom: 2px solid #10b981;">
                <h3 style="margin: 0; color: #10b981;">🛒 Lista de Compras</h3>
            </div>
            <div style="flex: 1; overflow-y: auto; padding: 20px;">
                <textarea id="lista-texto" readonly style="width: 100%; min-height: 400px; padding: 15px; border: 1px solid #e0e0e0; border-radius: 8px; font-family: monospace; font-size: 13px; resize: none;">${textoPlano}</textarea>
            </div>
            <div style="padding: 20px; border-top: 1px solid #e0e0e0; display: flex; gap: 10px;">
                <button onclick="copiarListaCompras()" style="flex: 1; padding: 12px; background: #10b981; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                    📋 Copiar Lista
                </button>
                <button onclick="compartirListaCompras()" style="flex: 1; padding: 12px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                    📤 Compartir
                </button>
                <button onclick="cerrarModalLista()" style="padding: 12px 20px; background: #6b7280; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                    ✕
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    window.currentListaTexto = textoPlano;

    showToast(`🛒 Lista generada: ${listaMateriales.length} materiales`);
}

// Funciones auxiliares para lista de compras
function copiarListaCompras() {
    const texto = window.currentListaTexto;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(texto).then(() => {
            showToast('✅ Lista copiada al portapapeles');
        }).catch(() => {
            // Fallback: seleccionar texto
            const textarea = document.getElementById('lista-texto');
            textarea.select();
            document.execCommand('copy');
            showToast('✅ Lista copiada');
        });
    } else {
        // Fallback para navegadores antiguos
        const textarea = document.getElementById('lista-texto');
        textarea.select();
        document.execCommand('copy');
        showToast('✅ Lista copiada');
    }
}

function compartirListaCompras() {
    const texto = window.currentListaTexto;
    if (navigator.share) {
        navigator.share({
            title: '🛒 Lista de Compras - CLAUDIA',
            text: texto
        }).then(() => {
            showToast('✅ Lista compartida');
        }).catch((error) => {
            if (error.name !== 'AbortError') {
                // Si falla, copiar al portapapeles
                copiarListaCompras();
            }
        });
    } else {
        // Si no tiene Share API, copiar
        copiarListaCompras();
        showToast('📋 Copiado - Pega en WhatsApp o donde quieras');
    }
}

function cerrarModalLista() {
    const modals = document.querySelectorAll('[style*="position: fixed"]');
    modals.forEach(modal => {
        if (modal.innerHTML.includes('Lista de Compras')) {
            modal.remove();
        }
    });
}

function shareProject() {
    const total = currentProject.activities?.reduce((sum, act) => sum + (act.cantidad * act.precio), 0) || 0;
    const text = `📋 ${currentProject.name}\n💰 Total: ${formatMoney(total)}\n📌 ${currentProject.activities?.length || 0} actividades`;

    if (navigator.share) {
        navigator.share({
            title: currentProject.name,
            text: text
        }).then(() => showToast('✅ Compartido'))
          .catch(() => {});
    } else {
        navigator.clipboard.writeText(text);
        showToast('📋 Copiado al portapapeles');
    }
}

// ============================================
// PROJECT FUNCTIONS
// ============================================
function sortActivities(activities) {
    activities.sort((a, b) => {
        const catA = a.categoria || '';
        const catB = b.categoria || '';
        const nameA = a.nombre || '';
        const nameB = b.nombre || '';

        if (catA.localeCompare(catB) !== 0) {
            return catA.localeCompare(catB);
        }
        return nameA.localeCompare(nameB);
    });
}

function switchProject(index) {
    currentProject = allProjects[index];
    if (currentProject.activities) {
        sortActivities(currentProject.activities);
    }
    updateUI();
}

function createNewProject() {
    // Usar nuevo modal inteligente con sugerencias IA
    if (typeof showSmartProjectCreationModal === 'function') {
        showSmartProjectCreationModal();
    } else {
        // Fallback al método antiguo si el módulo no está cargado
        const name = prompt('Nombre del proyecto:', `Proyecto ${allProjects.length + 1}`);
        if (!name) return;

        const newProject = createDefaultProject();
        newProject.name = name;

        allProjects.push(newProject);
        currentProject = newProject;
        saveProjects();
        updateProjectSelector();
        showToast('✅ Proyecto creado');
    }
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
        alert('Selecciona una actividad');
        return;
    }

    const cantidad = parseFloat(document.getElementById('cantidad').value);
    if (!cantidad || cantidad <= 0) {
        alert('Cantidad inválida');
        return;
    }

    const newActivity = {
        ...selectedAPU,
        precio: getAPUPrice(selectedAPU), // Normalizar precio (compatibilidad)
        cantidad: cantidad,
        addedAt: new Date().toISOString()
    };

    currentProject.activities.push(newActivity);
    sortActivities(currentProject.activities);
    saveProjects();
    document.getElementById('add-activity-form').style.display = 'none';
    selectedAPU = null;
    showToast('✅ Actividad agregada');

    // 💡 SMART SUGGESTIONS: Mostrar sugerencias inteligentes
    if (typeof onActivityAdded === 'function') {
        onActivityAdded(newActivity);
    }
}

function removeActivity(index) {
    if (confirm('¿Eliminar actividad?')) {
        currentProject.activities.splice(index, 1);
        saveProjects();
        showToast('Actividad eliminada');
    }
}

function duplicateActivity(index) {
    const activity = currentProject.activities[index];
    const duplicate = {
        ...activity,
        id: 'dup_' + Date.now()
    };
    currentProject.activities.push(duplicate);
    sortActivities(currentProject.activities);
    saveProjects();
    showToast('Actividad duplicada');
}

function editActivityQuantity(index) {
    const activity = currentProject.activities[index];
    const newQty = prompt(`Nueva cantidad (${activity.unidad}):`, activity.cantidad);

    if (newQty && !isNaN(newQty) && newQty > 0) {
        activity.cantidad = parseFloat(newQty);
        saveProjects();
        showToast('✅ Actualizada');
    }
}

function cancelAddActivity() {
    document.getElementById('add-activity-form').style.display = 'none';
    selectedAPU = null;
}

function showProjectOptions() {
    document.getElementById('project-options-modal').classList.add('active');
}

function closeProjectOptions() {
    document.getElementById('project-options-modal').classList.remove('active');
}

function duplicateCurrentProject() {
    const copy = JSON.parse(JSON.stringify(currentProject));
    copy.id = Date.now();
    copy.name = currentProject.name + ' (Copia)';
    copy.createdAt = new Date().toISOString();

    allProjects.push(copy);
    currentProject = copy;
    saveProjects();
    updateProjectSelector();
    closeProjectOptions();
    showToast('✅ Proyecto duplicado');
}

function exportCurrentProject() {
    exportToExcel();
    closeProjectOptions();
}

function shareCurrentProject() {
    shareProject();
    closeProjectOptions();
}

function deleteCurrentProject() {
    if (!confirm(`¿Eliminar "${currentProject.name}"?`)) return;

    const index = allProjects.findIndex(p => p.id === currentProject.id);
    if (index > -1) {
        allProjects.splice(index, 1);
        currentProject = allProjects[0] || createDefaultProject();
        if (allProjects.length === 0) allProjects.push(currentProject);
        saveProjects();
        updateProjectSelector();
        closeProjectOptions();
        showToast('🗑️ Proyecto eliminado');
    }
}

function viewProjectBudget() {
    if (!currentProject.activities || currentProject.activities.length === 0) {
        alert('Sin actividades');
        return;
    }

    let total = 0;
    let html = '<h3 style="margin-bottom: 20px;">💰 Presupuesto Detallado</h3>';
    html += '<div style="display: grid; gap: 15px;">';

    currentProject.activities.forEach(act => {
        const subtotal = act.cantidad * act.precio;
        total += subtotal;

        html += `
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
                <div style="font-weight: 600; margin-bottom: 8px;">${act.nombre}</div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 13px;">
                    <div><strong>Cantidad:</strong> ${act.cantidad} ${act.unidad}</div>
                    <div><strong>Precio:</strong> ${formatMoney(act.precio)}</div>
                    <div><strong>Subtotal:</strong> ${formatMoney(subtotal)}</div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    html += `<div style="margin-top: 20px; padding: 20px; background: linear-gradient(135deg, #DD0021, #ff1a3d); color: white; border-radius: 12px; text-align: center; font-size: 24px; font-weight: 700;">TOTAL: ${formatMoney(total)}</div>`;

    document.getElementById('budget-content').innerHTML = html;
    document.getElementById('full-budget').style.display = 'block';
}

function closeBudget() {
    document.getElementById('full-budget').style.display = 'none';
}

// ============================================
// TASKS
// ============================================
function addTaskFromInput() {
    const input = document.getElementById('new-task-input');
    const text = input.value.trim();

    if (!text) {
        alert('Escribe una tarea');
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
    if (confirm('¿Eliminar tarea?')) {
        currentProject.tasks.splice(index, 1);
        saveProjects();
    }
}

// ============================================
// APU NAVIGATOR
// ============================================
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
                <div class="no-results-text">Sin resultados</div>
            </div>
        `;
        return;
    }

    // Agrupar APUs por categoría
    const grouped = {};
    apus.forEach(apu => {
        const cat = apu.categoria || 'OTROS';
        if (!grouped[cat]) {
            grouped[cat] = [];
        }
        grouped[cat].push(apu);
    });

    // Ordenar categorías alfabéticamente
    const categories = Object.keys(grouped).sort();

    let html = `<div class="results-header">
        <div id="results-count">${apus.length} actividades en ${categories.length} categorías</div>
        <button onclick="toggleAllCategories()" class="btn-toggle-all" style="padding: 5px 10px; font-size: 12px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer;">Expandir/Colapsar Todo</button>
    </div>`;

    categories.forEach((category, index) => {
        const categoryAPUs = grouped[category];
        const categoryId = `category-${category.replace(/\s+/g, '-')}`;
        const isFirstCategory = index === 0;

        html += `
            <div class="category-section">
                <div class="category-header" onclick="toggleCategory('${categoryId}')" style="background: linear-gradient(135deg, #10b981 0%, #047857 100%); color: white; padding: 12px 15px; margin: 10px 0 0 0; border-radius: 8px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; font-weight: 600;">
                    <span>📁 ${category} (${categoryAPUs.length})</span>
                    <span id="${categoryId}-icon" style="transition: transform 0.3s;">${isFirstCategory ? '▼' : '▶'}</span>
                </div>
                <div id="${categoryId}" class="category-content" style="display: ${isFirstCategory ? 'grid' : 'none'}; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px; padding: 15px 0;">
        `;

        categoryAPUs.forEach(apu => {
            html += `
                <div class="apu-card" style="background: white; border-radius: 8px; padding: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: transform 0.2s, box-shadow 0.2s;">
                    <div class="apu-card-header" style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <div class="apu-category" style="background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">${apu.categoria}</div>
                        <div class="apu-unit" style="color: #666; font-size: 12px;">${apu.unidad}</div>
                    </div>
                    <div class="apu-card-title" style="font-weight: 600; margin-bottom: 10px; min-height: 40px; color: #1f2937;">${apu.nombre}</div>
                    <div class="apu-card-meta" style="margin-bottom: 10px;">
                        <span class="apu-price" style="color: #10b981; font-weight: 700; font-size: 16px;">${formatMoney(getAPUPrice(apu))}/${apu.unidad}</span>
                    </div>
                    <button class="apu-select-btn" onclick="previewAPU('${apu.id}')" style="width: 100%; padding: 8px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                        👁️ Ver Detalle
                    </button>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    });

    resultsDiv.innerHTML = html;
}

// Función para toggle de categorías
function toggleCategory(categoryId) {
    const content = document.getElementById(categoryId);
    const icon = document.getElementById(categoryId + '-icon');

    if (content.style.display === 'none' || content.style.display === '') {
        content.style.display = 'grid';
        icon.textContent = '▼';
    } else {
        content.style.display = 'none';
        icon.textContent = '▶';
    }
}

// Función para expandir/colapsar todas las categorías
function toggleAllCategories() {
    const allContents = document.querySelectorAll('.category-content');
    const allIcons = document.querySelectorAll('[id$="-icon"]');

    // Verificar si al menos una está colapsada
    let hasCollapsed = false;
    allContents.forEach(content => {
        if (content.style.display === 'none' || content.style.display === '') {
            hasCollapsed = true;
        }
    });

    // Si hay alguna colapsada, expandir todas; si no, colapsar todas
    allContents.forEach((content, index) => {
        if (hasCollapsed) {
            content.style.display = 'grid';
            allIcons[index].textContent = '▼';
        } else {
            content.style.display = 'none';
            allIcons[index].textContent = '▶';
        }
    });
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
                <div class="detail-item">${formatMoney(getAPUPrice(selectedAPU))} / ${selectedAPU.unidad}</div>
            </div>
        </div>
    `;

    document.getElementById('add-activity-form').style.display = 'block';
    document.getElementById('add-activity-form').scrollIntoView({ behavior: 'smooth' });
}

function previewAPU(apuId) {
    const apu = apuDatabase.find(a => a.id === apuId);
    if (!apu) return;

    const precio = getAPUPrice(apu);

    // Build materials breakdown
    let materialesHTML = '';
    let totalMateriales = 0;

    if (apu.materiales && apu.materiales.length > 0) {
        materialesHTML = '<div class="preview-section"><h4>📦 Materiales</h4><div class="preview-items">';
        apu.materiales.forEach(mat => {
            const subtotal = (mat.cantidad || 0) * (mat.precio_unitario || 0);
            totalMateriales += subtotal;
            materialesHTML += `
                <div class="preview-item">
                    <div class="preview-item-name">${mat.nombre}</div>
                    <div class="preview-item-detail">
                        ${mat.cantidad} ${mat.unidad} × ${formatMoney(mat.precio_unitario)} = ${formatMoney(subtotal)}
                    </div>
                </div>
            `;
        });
        materialesHTML += '</div></div>';
    }

    // Build labor breakdown
    let manoObraHTML = '';
    let totalManoObra = 0;

    if (apu.mano_obra && apu.mano_obra.length > 0) {
        manoObraHTML = '<div class="preview-section"><h4>👷 Mano de Obra</h4><div class="preview-items">';
        apu.mano_obra.forEach(mo => {
            const subtotal = (mo.cantidad || 0) * (mo.precio_unitario || 0);
            totalManoObra += subtotal;
            manoObraHTML += `
                <div class="preview-item">
                    <div class="preview-item-name">${mo.nombre}</div>
                    <div class="preview-item-detail">
                        ${mo.cantidad} ${mo.unidad} × ${formatMoney(mo.precio_unitario)} = ${formatMoney(subtotal)}
                    </div>
                </div>
            `;
        });
        manoObraHTML += '</div></div>';
    }

    // Build equipment breakdown if exists
    let equipoHTML = '';
    let totalEquipo = 0;

    if (apu.equipo && apu.equipo.length > 0) {
        equipoHTML = '<div class="preview-section"><h4>🔧 Equipo y Herramientas</h4><div class="preview-items">';
        apu.equipo.forEach(eq => {
            const subtotal = (eq.cantidad || 0) * (eq.precio_unitario || 0);
            totalEquipo += subtotal;
            equipoHTML += `
                <div class="preview-item">
                    <div class="preview-item-name">${eq.nombre}</div>
                    <div class="preview-item-detail">
                        ${eq.cantidad} ${eq.unidad} × ${formatMoney(eq.precio_unitario)} = ${formatMoney(subtotal)}
                    </div>
                </div>
            `;
        });
        equipoHTML += '</div></div>';
    }

    // Calculate totals
    const totalCalculado = totalMateriales + totalManoObra + totalEquipo;
    const diferencia = precio - totalCalculado;

    // Build summary
    let summaryHTML = `
        <div class="preview-summary">
            <h4>💰 Resumen de Costos</h4>
            <div class="preview-summary-items">
                ${totalMateriales > 0 ? `<div class="preview-summary-item">
                    <span>Materiales:</span>
                    <span>${formatMoney(totalMateriales)}</span>
                </div>` : ''}
                ${totalManoObra > 0 ? `<div class="preview-summary-item">
                    <span>Mano de Obra:</span>
                    <span>${formatMoney(totalManoObra)}</span>
                </div>` : ''}
                ${totalEquipo > 0 ? `<div class="preview-summary-item">
                    <span>Equipo:</span>
                    <span>${formatMoney(totalEquipo)}</span>
                </div>` : ''}
                ${diferencia > 0 ? `<div class="preview-summary-item">
                    <span>Gastos generales e imprevistos:</span>
                    <span>${formatMoney(diferencia)}</span>
                </div>` : ''}
                <div class="preview-summary-total">
                    <span><strong>Precio por ${apu.unidad}:</strong></span>
                    <span><strong>${formatMoney(precio)}</strong></span>
                </div>
            </div>
        </div>
    `;

    // Set modal content
    document.getElementById('preview-apu-name').textContent = apu.nombre;
    document.getElementById('preview-apu-categoria').textContent = apu.categoria;
    document.getElementById('preview-apu-content').innerHTML =
        materialesHTML + manoObraHTML + equipoHTML + summaryHTML;

    // Store APU ID in add button
    const addBtn = document.getElementById('preview-add-btn');
    addBtn.onclick = () => {
        closeAPUPreview();
        selectAPU(apuId);
    };

    // Show modal
    document.getElementById('apu-preview-modal').style.display = 'flex';
}

function closeAPUPreview() {
    document.getElementById('apu-preview-modal').style.display = 'none';
}

// Exponer funciones globalmente
window.previewAPU = previewAPU;
window.closeAPUPreview = closeAPUPreview;
window.toggleCategory = toggleCategory;
window.toggleAllCategories = toggleAllCategories;

// ============================================
// CHAT
// ============================================
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

    setTimeout(() => processClaudiaResponse(message), 500);
}

function addUserMessage(text) {
    const msg = { role: 'user', content: text, timestamp: Date.now() };
    chatMessages.push(msg);
    displayMessage(msg);
    saveChatHistory();
}

function addClaudiaMessage(text) {
    const msg = { role: 'claudia', content: text, timestamp: Date.now() };
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

    // Context awareness
    const total = currentProject.activities?.reduce((sum, act) => sum + (act.cantidad * act.precio), 0) || 0;
    const activitiesCount = currentProject.activities?.length || 0;
    const tasksCount = currentProject.tasks?.length || 0;
    const pendingTasks = currentProject.tasks?.filter(t => !t.completed).length || 0;
    const photosCount = currentProject.photos?.length || 0;

    // Smart responses with context
    if (lower.includes('hola') || lower.includes('hi') || lower.includes('buenos')) {
        const greetings = [
            `¡Hola! Tienes ${activitiesCount} actividades en "${currentProject.name}". ¿En qué te ayudo?`,
            `¡Hola! Tu proyecto va en ${formatMoney(total)}. ¿Qué necesitas?`,
            `¡Hola! ¿Continuamos con "${currentProject.name}"?`
        ];
        response = greetings[Math.floor(Math.random() * greetings.length)];
    }

    else if (lower.includes('plantilla')) {
        response = `📋 Tengo 4 plantillas profesionales:\n\n🏠 Casa Básica (60m²) - 5 actividades\n📐 Ampliación (30m²) - 4 actividades\n🔨 Remodelación Interior - 4 actividades\n🚿 Baño Completo (6m²) - 3 actividades\n\nUsa el botón "Plantilla" arriba para aplicar una.`;
    }

    else if (lower.includes('foto') || lower.includes('imagen') || lower.includes('galeria') || lower.includes('galería')) {
        if (photosCount > 0) {
            response = `📸 Tienes ${photosCount} fotos en este proyecto. Usa el menú de opciones para ver la galería o agregar más.`;
        } else {
            response = '📸 Aún no hay fotos en este proyecto. Te recomiendo agregar fotos del terreno, avance de obra y detalles importantes.\n\n¿Quieres subir una foto ahora?';
        }
    }

    else if (lower.includes('excel') || lower.includes('exportar') || lower.includes('descargar')) {
        if (activitiesCount > 0) {
            response = `📊 Puedes exportar tu presupuesto a Excel con formato profesional.\n\nIncluye:\n• ${activitiesCount} actividades\n• Total: ${formatMoney(total)}\n• Logo y fecha\n• Formato listo para imprimir\n\nUsa el botón "Opciones" > "Exportar Excel".`;
        } else {
            response = '📊 Primero agrega actividades a tu proyecto para poder exportar a Excel.';
        }
    }

    else if (lower.includes('actividad') || lower.includes('apu') || lower.includes('partida')) {
        if (activitiesCount > 0) {
            const topActivities = currentProject.activities
                .sort((a, b) => (b.cantidad * b.precio) - (a.cantidad * a.precio))
                .slice(0, 3);
            response = `📋 Tienes ${activitiesCount} actividades por ${formatMoney(total)}.\n\nTop 3 más costosas:\n${topActivities.map(a => `• ${a.nombre}: ${formatMoney(a.cantidad * a.precio)}`).join('\n')}\n\nBusca más APUs abajo para agregar.`;
        } else {
            response = '📋 No tienes actividades. Busca APUs abajo o usa una plantilla para empezar rápido.';
        }
    }

    else if (lower.includes('tarea') || lower.includes('pendiente') || lower.includes('hacer')) {
        if (tasksCount > 0) {
            response = `✅ ${tasksCount - pendingTasks}/${tasksCount} tareas completadas.\n\n${pendingTasks > 0 ? `⚠️ Quedan ${pendingTasks} tareas por hacer.` : '🎉 ¡Todas las tareas completadas!'}`;
        } else {
            response = '📝 No hay tareas aún. Agrega tareas para organizar el trabajo de tu proyecto.';
        }
    }

    else if (lower.includes('total') || lower.includes('precio') || lower.includes('costo') || lower.includes('cuanto') || lower.includes('cuánto')) {
        if (activitiesCount > 0) {
            const avgPerActivity = total / activitiesCount;
            response = `💰 Resumen Financiero:\n\n• Total: ${formatMoney(total)}\n• Actividades: ${activitiesCount}\n• Promedio por actividad: ${formatMoney(avgPerActivity)}\n\n${total > 10000000 ? '⚠️ Proyecto de gran presupuesto' : total > 5000000 ? 'Proyecto mediano' : 'Proyecto pequeño'}`;
        } else {
            response = '💰 Total: $0 - Agrega actividades para calcular el presupuesto.';
        }
    }

    else if (lower.includes('ayuda') || lower.includes('help') || lower.includes('que puedes') || lower.includes('qué puedes')) {
        response = `🤖 Soy CLAUDIA, tu asistente de construcción. Puedo:\n\n📋 Gestionar presupuestos\n🏗️ Aplicar plantillas predefinidas\n🔍 Buscar actividades (APUs)\n✅ Organizar tareas\n📸 Gestionar fotos de avance\n📊 Exportar a Excel profesional\n📈 Calcular totales y estadísticas\n\n¿Qué necesitas?`;
    }

    else if (lower.includes('gracias') || lower.includes('perfecto') || lower.includes('ok') || lower.includes('bien')) {
        const thanks = [
            '¡De nada! Aquí estoy para ayudar 🤖',
            '¡Un placer! ¿Algo más?',
            '👍 ¡Cuenta conmigo para lo que necesites!',
            '😊 ¡Para eso estoy!'
        ];
        response = thanks[Math.floor(Math.random() * thanks.length)];
    }

    else if (lower.includes('eliminar') || lower.includes('borrar')) {
        response = 'Para eliminar:\n• Actividades: Click en 🗑️ junto a cada una\n• Proyecto: Opciones > Eliminar Proyecto\n• Tareas: Click en 🗑️ en la lista de tareas';
    }

    else if (lower.includes('duplicar') || lower.includes('copiar') || lower.includes('clonar')) {
        response = 'Para duplicar el proyecto actual:\n1. Click en "Opciones"\n2. Selecciona "Duplicar Proyecto"\n\nSe creará una copia exacta con todas las actividades.';
    }

    else if (lower.match(/\b(como|cómo)\b/) && (lower.includes('usa') || lower.includes('funciona'))) {
        response = '📱 Guía rápida:\n\n1️⃣ Crea o selecciona un proyecto\n2️⃣ Usa plantillas o busca APUs\n3️⃣ Agrega fotos del avance\n4️⃣ Organiza con tareas\n5️⃣ Exporta a Excel cuando quieras\n\n¿Con cuál empiezo a ayudarte?';
    }

    // PREGUNTAS SOBRE MATERIALES Y CONSTRUCCIÓN
    else if (lower.includes('cuanto') || lower.includes('cuánto')) {
        if (lower.match(/cemento|arena|ripio|grava|hormig[oó]n/)) {
            response = '📦 Rendimientos típicos:\n\n• 1 saco cemento (42.5kg) = ~5m² estuco\n• 1m³ hormigón = 1 saco cemento + 0.5m³ ripio + 0.5m³ arena\n• 1m² radier 10cm = 0.1m³ hormigón\n\n¿Necesitas calcular algo específico?';
        } else if (lower.match(/ladrillo|block|bloque/)) {
            response = '🧱 Rendimientos ladrillos:\n\n• Muro ladrillo fiscal: 66 unidades/m²\n• Muro ladrillo princesa: 40 unidades/m²\n• Block 15cm: 12.5 unidades/m²\n\nIncluye 10% desperdicio.';
        } else if (lower.match(/pintura|l[aá]tex/)) {
            response = '🎨 Rendimiento pintura:\n\n• Látex muro: 10-12 m²/litro (2 manos)\n• Esmalte: 12-14 m²/litro\n• Barniz: 14-16 m²/litro\n\nSiempre aplicar 2 manos mínimo.';
        } else {
            response = `Proyecto "${currentProject.name}" - ${formatMoney(total)}. ¿Qué necesitas calcular?`;
        }
    }

    // PREGUNTAS SOBRE PRECIOS Y DESCUENTOS
    else if (lower.match(/precio|vale|cuesta/) && lower.match(/cemento|arena|fierro|madera/)) {
        response = '💰 Para ver precios actualizados:\n\n1. Busca el material en la lista de APUs\n2. Click en "Comparar Precios"\n3. Te muestro precios en 6 ferreterías\n\n¿Buscamos algún material específico?';
    }

    // CONSEJOS DE CONSTRUCCIÓN
    else if (lower.match(/consejo|tip|recomendaci[oó]n/)) {
        const tips = [
            '💡 TIP: Compra materiales por volumen (m³, sacos) para descuento mayorista del 15-20%.',
            '💡 TIP: Agenda las compras para el día anterior a usar el material - evita robos y deterioro.',
            '💡 TIP: Agrega 10% de desperdicio en cerámicas y 5% en materiales de construcción.',
            '💡 TIP: Pide cotización en al menos 3 ferreterías antes de comprar - puedes ahorrar hasta 30%.',
            '💡 TIP: Compra fierro y cemento directo en distribuidoras mayoristas - no en retail.',
        ];
        response = tips[Math.floor(Math.random() * tips.length)];
    }

    // PROBLEMAS COMUNES
    else if (lower.match(/problema|error|ayuda|no (funciona|puedo|s[eé])/)) {
        response = '🔧 ¿Qué necesitas?\n\n• "No puedo agregar actividad" → Busca en APUs y selecciona cantidad\n• "No sale el total" → Verifica que tengas actividades con precio\n• "Excel no descarga" → Usa Chrome o Firefox\n• "Perdí mi proyecto" → Están guardados en este dispositivo\n\n¿Cuál es tu problema específico?';
    }

    // PRESUPUESTO PARA CLIENTE
    else if (lower.match(/cliente|cobrar|margen|utilidad|ganancia/)) {
        response = '💼 Presupuesto para cliente:\n\n1️⃣ Calcula tu costo real aquí\n2️⃣ Agrega margen de utilidad:\n   • Obra pequeña: 25-30%\n   • Obra mediana: 20-25%\n   • Obra grande: 15-20%\n3️⃣ Exporta a Excel PRO\n4️⃣ Presenta al cliente\n\n¿Necesitas calcular el margen?';
    }

    // CRONOGRAMA Y PLAZOS
    else if (lower.match(/tiempo|d[ií]a|plazo|cronograma|cuando|cu[aá]nto (de
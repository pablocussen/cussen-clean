/**
 * CLAUDIA PRO - Tu Asistente Inteligente de Construcción
 * Sistema de Proyectos con Múltiples APUs
 * Optimizado para móvil
 */

'use strict';

let APU_DB = null;
let CURRENT_APU = null;
let FILTERED_APUS = [];
let PROJECTS = [];
let CURRENT_PROJECT_ID = null;
let PROJECT_HISTORY = [];
let HISTORY_INDEX = -1;
let URGENT_TASKS_INTERVAL = null;

// Cargar base de datos APU
fetch('apu_database.min.json')
    .then(r => r.json())
    .then(data => {
        APU_DB = data;
        FILTERED_APUS = [...APU_DB.actividades];
        initAPUNavigator();
        loadProjects();
        console.log('✅ DB APU cargada:', data.metadata.total_apus, 'actividades profesionales');
    })
    .catch(err => console.error('❌ Error cargando APU DB:', err));

// Formato chileno de dinero
function formatMoney(num) {
    return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// SISTEMA DE MÚLTIPLES PROYECTOS

// Cargar proyectos desde localStorage
function loadProjects() {
    const saved = localStorage.getItem('claudia_projects');
    if (saved) {
        PROJECTS = JSON.parse(saved);
    }

    // Si no hay proyectos, crear uno por defecto
    if (PROJECTS.length === 0) {
        createNewProject('Mi Proyecto');
    } else {
        // Cargar el último proyecto activo
        const lastProjectId = localStorage.getItem('claudia_current_project_id');
        CURRENT_PROJECT_ID = lastProjectId || PROJECTS[0].id;
    }

    renderProjectSelector();
    loadCurrentProject();
}

// Crear nuevo proyecto
function createNewProject(name = 'Nuevo Proyecto') {
    const newProject = {
        id: 'proj_' + Date.now(),
        name: name,
        activities: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: '',
        // Sistema de tareas
        tasks: [],
        // Bitácora diaria
        dailyLogs: [],
        // Tracking financiero
        financialHistory: [],
        // Configuración de bitácora
        logConfig: {
            enabled: false,
            time: '18:00',
            email: '',
            whatsapp: '',
            morningMotivation: true,
            morningTime: '08:00',
            remindersEnabled: false,
            reminderPhone: '',
            reminderFrequency: 'daily'
        }
    };

    PROJECTS.push(newProject);
    CURRENT_PROJECT_ID = newProject.id;
    saveProjects();
    renderProjectSelector();
    loadCurrentProject();

    // Track analytics
    if (window.ClaudiaAnalytics) {
        ClaudiaAnalytics.trackCreateProject(newProject);
    }

    return newProject;
}

// Guardar todos los proyectos
function saveProjects() {
    localStorage.setItem('claudia_projects', JSON.stringify(PROJECTS));
    localStorage.setItem('claudia_current_project_id', CURRENT_PROJECT_ID);
}

// Cargar proyecto actual
function loadCurrentProject() {
    const project = getCurrentProject();
    if (project && document.getElementById('project-name')) {
        document.getElementById('project-name').value = project.name;
    }
    renderProject();
}

// Obtener proyecto actual
function getCurrentProject() {
    return PROJECTS.find(p => p.id === CURRENT_PROJECT_ID);
}

// Cambiar de proyecto
function switchProject(projectId) {
    CURRENT_PROJECT_ID = projectId;
    localStorage.setItem('claudia_current_project_id', projectId);
    loadCurrentProject();
    addToHistory('switch_project');
}

// Guardar proyecto actual
function saveCurrentProject() {
    const project = getCurrentProject();
    if (project) {
        project.name = document.getElementById('project-name').value || 'Mi Proyecto';
        project.updatedAt = new Date().toISOString();
        saveProjects();
        renderProject();
        renderProjectSelector();
    }
}

// Eliminar proyecto
function deleteProject(projectId) {
    if (PROJECTS.length === 1) {
        showNotification('No puedes eliminar el único proyecto', 'warning');
        return;
    }

    const project = PROJECTS.find(p => p.id === projectId);
    if (!project) return;

    if (!confirm(`¿Eliminar proyecto "${project.name}"?`)) {
        return;
    }

    PROJECTS = PROJECTS.filter(p => p.id !== projectId);

    if (CURRENT_PROJECT_ID === projectId) {
        CURRENT_PROJECT_ID = PROJECTS[0].id;
    }

    saveProjects();
    renderProjectSelector();
    loadCurrentProject();
}

// Duplicar proyecto
function duplicateProject(projectId) {
    const project = PROJECTS.find(p => p.id === projectId);
    if (!project) return;

    const duplicated = {
        id: 'proj_' + Date.now(),
        name: project.name + ' (Copia)',
        activities: JSON.parse(JSON.stringify(project.activities)),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: project.notes
    };

    PROJECTS.push(duplicated);
    CURRENT_PROJECT_ID = duplicated.id;
    saveProjects();
    renderProjectSelector();
    loadCurrentProject();
}

// Renderizar selector de proyectos
function renderProjectSelector() {
    const selector = document.getElementById('project-selector');
    if (!selector) return;

    selector.innerHTML = PROJECTS.map(project => {
        const actCount = project.activities.length;
        return `<option value="${project.id}" ${project.id === CURRENT_PROJECT_ID ? 'selected' : ''}>
            ${project.name} (${actCount} actividades)
        </option>`;
    }).join('');
}

// Modal de opciones del proyecto
function showProjectOptions() {
    document.getElementById('project-options-modal').classList.add('active');
}

function closeProjectOptions() {
    document.getElementById('project-options-modal').classList.remove('active');
}

// Duplicar proyecto actual
function duplicateCurrentProject() {
    duplicateProject(CURRENT_PROJECT_ID);
    closeProjectOptions();
    showNotification('Proyecto duplicado exitosamente', 'success');
}

// Exportar proyecto actual
function exportCurrentProject() {
    exportToExcel();
    closeProjectOptions();
}

// Compartir proyecto actual
function shareCurrentProject() {
    shareProject();
    closeProjectOptions();
}

// Eliminar proyecto actual
function deleteCurrentProject() {
    deleteProject(CURRENT_PROJECT_ID);
    closeProjectOptions();
}

// Historial de cambios (undo/redo)
function addToHistory(action) {
    // Implementación simple de historial
    const project = getCurrentProject();
    if (!project) return;

    const snapshot = {
        action: action,
        timestamp: Date.now(),
        data: JSON.parse(JSON.stringify(project))
    };

    // Eliminar historia futura si estamos en el medio
    if (HISTORY_INDEX < PROJECT_HISTORY.length - 1) {
        PROJECT_HISTORY = PROJECT_HISTORY.slice(0, HISTORY_INDEX + 1);
    }

    PROJECT_HISTORY.push(snapshot);
    HISTORY_INDEX = PROJECT_HISTORY.length - 1;

    // Mantener solo últimos 20 cambios
    if (PROJECT_HISTORY.length > 20) {
        PROJECT_HISTORY.shift();
        HISTORY_INDEX--;
    }
}

// Renderizar proyecto
function renderProject() {
    const container = document.getElementById('project-activities');
    const summary = document.getElementById('project-summary');
    const project = getCurrentProject();

    if (!project || project.activities.length === 0) {
        container.innerHTML = `
            <div class="project-empty">
                <div style="font-size: 48px; margin-bottom: 10px;">📦</div>
                <div style="font-weight: 600; margin-bottom: 5px;">Sin actividades</div>
                <div style="font-size: 13px; color: #757575;">Busca y agrega actividades a tu proyecto</div>
            </div>
        `;
        if (summary) summary.style.display = 'none';
        return;
    }

    let total = 0;
    const MAX_VISIBLE = 3; // Mostrar solo 3 actividades inicialmente
    const hasMore = project.activities.length > MAX_VISIBLE;

    // Generar HTML para todas las actividades
    const allActivitiesHTML = project.activities.map((activity, idx) => {
        total += activity.total;
        const isHidden = hasMore && idx >= MAX_VISIBLE;
        const categoryColor = getCategoryColor(activity.category);
        const categoryIcon = getCategoryIcon(activity.category);
        return `
            <div class="project-activity-item fade-in-up ${isHidden ? 'activity-hidden' : ''}" data-index="${idx}" style="border-left: 4px solid ${categoryColor.border};">
                <div class="project-activity-info">
                    <div class="project-activity-name">
                        <span style="margin-right: 6px;">${categoryIcon}</span>
                        ${activity.name}
                        <span style="font-size: 10px; padding: 2px 6px; background: ${categoryColor.bg}; color: ${categoryColor.text}; border-radius: 4px; margin-left: 8px; font-weight: 600;">${activity.category}</span>
                    </div>
                    <div class="project-activity-details">
                        <span class="activity-quantity-display" onclick="editActivityQuantity(${idx})" title="Clic para editar cantidad">
                            ${activity.quantity} ${activity.unit} ✏️
                        </span>
                        <input type="number" class="activity-quantity-edit" id="qty-${idx}" value="${activity.quantity}"
                               style="display: none; width: 80px; padding: 8px; border: 2px solid #667eea; border-radius: 4px; font-size: 16px; font-weight: 600;"
                               onblur="saveActivityQuantity(${idx})"
                               onkeypress="if(event.key==='Enter') saveActivityQuantity(${idx})"
                               step="0.01"
                               min="0.01">
                    </div>
                </div>
                <div class="project-activity-amount">$${formatMoney(activity.total)}</div>
                <div class="project-activity-actions">
                    <button class="project-activity-btn" onclick="duplicateActivity(${idx})" title="Duplicar actividad">
                        📋
                    </button>
                    <button class="project-activity-delete" onclick="removeActivity(${idx})" title="Eliminar actividad">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Botón para mostrar más/menos
    const toggleButton = hasMore ? `
        <button class="btn-toggle-activities" onclick="toggleActivitiesList()" id="toggle-activities-btn">
            <span id="toggle-icon">▼</span>
            Ver todas (${project.activities.length} actividades)
        </button>
    ` : '';

    container.innerHTML = `
        <div class="project-activities-list">
            ${allActivitiesHTML}
        </div>
        ${toggleButton}
    `;

    if (document.getElementById('project-total-amount')) {
        document.getElementById('project-total-amount').textContent = `$${formatMoney(total)}`;
    }
    if (summary) summary.style.display = 'block';

    // Renderizar gráfico de costos
    renderCostChart();
}

// Variable global para el gráfico
let costChartInstance = null;

// Renderizar gráfico de costos
function renderCostChart() {
    const project = getCurrentProject();
    if (!project || project.activities.length === 0) return;

    let totalMateriales = 0;
    let totalManoObra = 0;

    project.activities.forEach(activity => {
        totalMateriales += activity.materials || 0;
        totalManoObra += activity.labor || 0;
    });

    const canvas = document.getElementById('cost-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Destruir gráfico anterior si existe
    if (costChartInstance) {
        costChartInstance.destroy();
    }

    // Crear nuevo gráfico
    costChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Materiales', 'Mano de Obra'],
            datasets: [{
                data: [totalMateriales, totalManoObra],
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(118, 75, 162, 0.8)'
                ],
                borderColor: [
                    'rgba(102, 126, 234, 1)',
                    'rgba(118, 75, 162, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: $${formatMoney(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

    // Renderizar breakdown
    const breakdown = document.getElementById('cost-breakdown');
    if (breakdown) {
        const total = totalMateriales + totalManoObra;
        const materialesPercent = total > 0 ? ((totalMateriales / total) * 100).toFixed(1) : 0;
        const laborPercent = total > 0 ? ((totalManoObra / total) * 100).toFixed(1) : 0;

        breakdown.innerHTML = `
            <div style="background: white; padding: 12px; border-radius: 8px; border-left: 4px solid rgba(102, 126, 234, 1);">
                <div style="font-size: 12px; color: #757575; margin-bottom: 4px;">📦 Materiales</div>
                <div style="font-weight: 700; font-size: 16px; color: #333;">$${formatMoney(totalMateriales)}</div>
                <div style="font-size: 11px; color: #999; margin-top: 2px;">${materialesPercent}% del total</div>
            </div>
            <div style="background: white; padding: 12px; border-radius: 8px; border-left: 4px solid rgba(118, 75, 162, 1);">
                <div style="font-size: 12px; color: #757575; margin-bottom: 4px;">👷 Mano de Obra</div>
                <div style="font-weight: 700; font-size: 16px; color: #333;">$${formatMoney(totalManoObra)}</div>
                <div style="font-size: 11px; color: #999; margin-top: 2px;">${laborPercent}% del total</div>
            </div>
        `;
    }
}

// Toggle para mostrar/ocultar actividades
function toggleActivitiesList() {
    const hiddenActivities = document.querySelectorAll('.activity-hidden');
    const btn = document.getElementById('toggle-activities-btn');
    const icon = document.getElementById('toggle-icon');

    if (hiddenActivities.length === 0) return;

    // Verificar si está expandido checando si la primera actividad oculta tiene la clase 'activity-visible'
    const firstHidden = hiddenActivities[0];
    const isExpanded = firstHidden.classList.contains('activity-visible');

    hiddenActivities.forEach(activity => {
        if (isExpanded) {
            activity.classList.remove('activity-visible');
        } else {
            activity.classList.add('activity-visible');
        }
    });

    if (btn && icon) {
        if (isExpanded) {
            icon.textContent = '▼';
            btn.innerHTML = `<span id="toggle-icon">▼</span> Ver todas (${document.querySelectorAll('.project-activity-item').length} actividades)`;
        } else {
            icon.textContent = '▲';
            btn.innerHTML = `<span id="toggle-icon">▲</span> Ver menos`;
        }
    }
}

// Editar cantidad de actividad
function editActivityQuantity(index) {
    const display = document.querySelector(`[data-index="${index}"] .activity-quantity-display`);
    const input = document.getElementById(`qty-${index}`);

    if (display && input) {
        display.style.display = 'none';
        input.style.display = 'inline-block';
        input.focus();
        input.select();
    }
}

// Guardar cantidad editada
function saveActivityQuantity(index) {
    const input = document.getElementById(`qty-${index}`);
    const display = document.querySelector(`[data-index="${index}"] .activity-quantity-display`);
    const project = getCurrentProject();

    if (!input || !project) return;

    const newQuantity = parseFloat(input.value);
    if (isNaN(newQuantity) || newQuantity <= 0) {
        showNotification('Cantidad inválida. Debe ser mayor a 0', 'error');
        input.value = project.activities[index].quantity;
        return;
    }

    // Recalcular totales con nueva cantidad
    const activity = project.activities[index];
    const apu = APU_DB.actividades.find(a => a.id === activity.id);

    if (apu) {
        let totalMateriales = 0;
        let totalManoObra = 0;

        apu.materiales.forEach(material => {
            const nombreKey = material.nombre.toLowerCase();
            const precioUnitario = PRECIOS[nombreKey] || 0;
            const cantidadTotal = material.cantidad * newQuantity;
            totalMateriales += cantidadTotal * precioUnitario;
        });

        apu.mano_obra.forEach(mo => {
            const claveNombre = 'mano_obra_' + mo.nombre.toLowerCase();
            const precioHH = PRECIOS[claveNombre] || 12000;
            const cantidadTotal = mo.cantidad * newQuantity;
            totalManoObra += cantidadTotal * precioHH;
        });

        activity.quantity = newQuantity;
        activity.materials = totalMateriales;
        activity.labor = totalManoObra;
        activity.total = totalMateriales + totalManoObra;
    }

    saveProjects();
    addToHistory('edit_quantity');
    renderProject();
}

// Duplicar actividad del proyecto
function duplicateActivity(index) {
    const project = getCurrentProject();
    if (!project) return;

    const activity = project.activities[index];
    const duplicated = JSON.parse(JSON.stringify(activity)); // Deep clone

    project.activities.splice(index + 1, 0, duplicated);
    saveProjects();
    showAutoSave();
    addToHistory('duplicate_activity');
    renderProject();
    showNotification(`"${activity.name}" duplicada exitosamente`, 'success');
}

// Eliminar actividad del proyecto
function removeActivity(index) {
    const project = getCurrentProject();
    if (!project) return;

    const activity = project.activities[index];
    showConfirm(`¿Eliminar "${activity.name}" del proyecto?`, () => {
        project.activities.splice(index, 1);
        saveProjects();
        showAutoSave();
        addToHistory('delete_activity');
        renderProject();
        showNotification('Actividad eliminada', 'success');
    });
}

// Inicializar navegación inteligente de APUs
function initAPUNavigator() {
    const container = document.getElementById('apu-navigator');
    if (!container || !APU_DB) return;

    const searchHTML = `
        <div class="search-container">
            <div class="search-box">
                <span class="search-icon">🔍</span>
                <input type="text"
                       id="apu-search"
                       placeholder="Busca actividad, material o categoría..."
                       autocomplete="off">
                <span class="ai-badge">IA</span>
            </div>
            <div class="search-hint">Ej: "radier", "muro", "excavación"...</div>
        </div>
    `;

    const categoriesHTML = `
        <div class="categories-container">
            <div class="category-label">Categorías:</div>
            <div class="categories-grid" id="categories-grid">
                <button class="category-chip active" data-category="TODOS" onclick="filterByCategory('TODOS')">
                    📋 Todos
                </button>
                ${APU_DB.metadata.categorias.map(cat => {
                    const icon = getCategoryIcon(cat);
                    return `<button class="category-chip" data-category="${cat}" onclick="filterByCategory('${cat}')">
                        ${icon} ${cat}
                    </button>`;
                }).join('')}
            </div>
        </div>
    `;

    const resultsHTML = `
        <div class="results-container">
            <div class="results-header">
                <span id="results-count">${APU_DB.actividades.length} actividades</span>
                <span class="results-source">Con IA</span>
            </div>
            <div id="apu-grid" class="apu-grid"></div>
        </div>
    `;

    container.innerHTML = searchHTML + categoriesHTML + resultsHTML;

    renderAPUs(FILTERED_APUS);

    const searchInput = document.getElementById('apu-search');
    searchInput.addEventListener('input', debounce(handleSmartSearch, 300));
}

// Búsqueda inteligente con IA
function handleSmartSearch(e) {
    const query = e.target.value.toLowerCase().trim();

    if (!query) {
        FILTERED_APUS = [...APU_DB.actividades];
        renderAPUs(FILTERED_APUS);
        updateResultsCount();
        return;
    }

    // Búsqueda inteligente multicriterio con scoring
    const results = APU_DB.actividades.map(apu => {
        let score = 0;

        // Búsqueda en nombre (peso 10)
        if (apu.nombre.toLowerCase().includes(query)) score += 10;

        // Búsqueda en tags (peso 8) - NUEVA FUNCIONALIDAD IA
        if (apu.tags && apu.tags.some(tag => tag.toLowerCase().includes(query))) {
            score += 8;
        }

        // Búsqueda en categoría (peso 5)
        if (apu.categoria.toLowerCase().includes(query)) score += 5;

        // Búsqueda en materiales (peso 3)
        if (apu.materiales.some(m => m.nombre.toLowerCase().includes(query))) score += 3;

        // Búsqueda en mano de obra (peso 2)
        if (apu.mano_obra.some(mo => mo.nombre.toLowerCase().includes(query))) score += 2;

        // Búsqueda por keywords (peso 1)
        const keywords = query.split(' ');
        keywords.forEach(kw => {
            if (apu.nombre.toLowerCase().includes(kw)) score += 1;
            if (apu.tags && apu.tags.some(tag => tag.includes(kw))) score += 1;
        });

        // Sugerencias inteligentes para proyectos comunes
        const projectSuggestions = getProjectSuggestions(query);
        if (projectSuggestions.includes(apu.id)) {
            score += 15; // Alto peso para sugerencias de proyecto
        }

        return { apu, score };
    });

    // Filtrar solo los que tienen score > 0 y ordenar por score
    FILTERED_APUS = results
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(r => r.apu);

    renderAPUs(FILTERED_APUS);
    updateResultsCount();
    showProjectSuggestion(query);
}

// Sugerencias inteligentes de proyectos completos
function getProjectSuggestions(query) {
    const suggestions = {
        // BAÑO COMPLETO
        'baño': ['ceramica_piso', 'ceramica_muro', 'inodoro_instalacion', 'mueble_bano', 'ducha_instalacion', 'espejo_bano', 'cielo_pvc', 'electrico_luz', 'electrico_enchuf', 'pintura_latex_interior'],
        'baño completo': ['ceramica_piso', 'ceramica_muro', 'inodoro_instalacion', 'mueble_bano', 'tina_bano', 'ducha_instalacion', 'espejo_bano', 'cielo_pvc', 'electrico_luz', 'electrico_enchuf'],
        'wc': ['inodoro_instalacion', 'lavamanos_pedestal', 'ceramica_piso', 'ceramica_muro'],

        // BODEGA/GALPÓN
        'bodega': ['bodega_estructura', 'techo_zinc', 'puerta_bodega', 'radier_10cm', 'electrico_luz', 'cerco_metalico'],
        'galpón': ['bodega_estructura', 'techo_zinc', 'puerta_bodega', 'radier_10cm', 'electrico_luz', 'canaleta_lluvia'],
        'galpon': ['bodega_estructura', 'techo_zinc', 'puerta_bodega', 'radier_10cm', 'electrico_luz', 'canaleta_lluvia'],

        // COCINA
        'cocina': ['mueble_cocina', 'ceramica_piso', 'ceramica_muro', 'campana_cocina', 'electrico_enchuf', 'electrico_luz', 'pintura_latex_interior'],

        // DORMITORIO/PIEZA
        'dormitorio': ['radier_10cm', 'piso_flotante', 'tabique_volcanita', 'puerta_madera', 'ventana_pvc', 'closet_empotrado', 'electrico_luz', 'electrico_enchuf', 'pintura_latex_interior', 'cortina_roller'],
        'pieza': ['radier_10cm', 'piso_flotante', 'puerta_madera', 'ventana_aluminio', 'electrico_luz', 'electrico_enchuf', 'pintura_latex_interior'],
        'habitación': ['radier_10cm', 'piso_flotante', 'tabique_volcanita', 'puerta_madera', 'ventana_aluminio', 'electrico_luz', 'electrico_enchuf', 'pintura_latex_interior'],

        // AMPLIACIÓN
        'ampliación': ['excavacion_zanja', 'radier_10cm', 'muro_fiscal_15cm', 'moldaje_muro', 'enfierradura_d10', 'estuco_exterior', 'techo_zinc', 'pintura_exterior', 'canaleta_lluvia'],
        'ampliacion': ['excavacion_zanja', 'radier_10cm', 'muro_fiscal_15cm', 'moldaje_muro', 'enfierradura_d10', 'estuco_exterior', 'techo_zinc', 'pintura_exterior'],

        // TERMINACIONES
        'terminaciones': ['pintura_latex_interior', 'pintura_exterior', 'ceramica_piso', 'piso_flotante', 'puerta_madera', 'ventana_aluminio', 'electrico_luz', 'electrico_enchuf'],
        'terminación': ['pintura_latex_interior', 'ceramica_piso', 'puerta_madera', 'ventana_aluminio', 'electrico_luz', 'electrico_enchuf'],

        // QUINCHO/EXTERIOR
        'quincho': ['quincho', 'parrilla_obra', 'deck_madera', 'electrico_luz', 'electrico_enchuf', 'ceramica_piso'],
        'parrilla': ['parrilla_obra', 'quincho', 'ceramica_piso', 'deck_madera'],
        'terraza': ['deck_madera', 'quincho', 'ceramica_piso', 'canaleta_lluvia'],

        // JARDÍN
        'jardín': ['pasto_rollo', 'riego_automatico', 'jardinera', 'deck_madera', 'cerco_metalico'],
        'jardin': ['pasto_rollo', 'riego_automatico', 'jardinera', 'deck_madera'],

        // ENTRADA/ACCESO
        'entrada': ['porton_corredero', 'cajon_estacionamiento', 'cerco_metalico', 'pasto_rollo'],
        'portón': ['porton_corredero', 'reja_seguridad'],
        'porton': ['porton_corredero', 'reja_seguridad'],

        // ESTACIONAMIENTO
        'estacionamiento': ['cajon_estacionamiento', 'porton_corredero', 'electrico_luz'],
        'cochera': ['cajon_estacionamiento', 'porton_corredero', 'bodega_estructura'],

        // PISCINA
        'piscina': ['piscina_fibra', 'deck_madera', 'quincho', 'ducha_instalacion', 'electrico_luz'],

        // CLIMATIZACIÓN
        'clima': ['aire_acondicionado', 'panel_solar', 'termo_electrico'],
        'calefacción': ['aire_acondicionado', 'panel_solar'],
        'calefaccion': ['aire_acondicionado', 'panel_solar'],

        // OFICINA/ESTUDIO
        'oficina': ['tabique_volcanita', 'piso_flotante', 'puerta_madera', 'ventana_pvc', 'electrico_luz', 'electrico_enchuf', 'pintura_latex_interior', 'cielo_volcanita'],
        'estudio': ['tabique_volcanita', 'piso_flotante', 'ventana_pvc', 'electrico_luz', 'electrico_enchuf', 'pintura_latex_interior']
    };

    return suggestions[query] || [];
}

// Muestra sugerencia de proyecto completo
function showProjectSuggestion(query) {
    const suggestions = getProjectSuggestions(query);

    if (suggestions.length > 0) {
        const suggestionText = `💡 Para "${query}" te sugiero ${suggestions.length} actividades`;
        document.getElementById('results-count').textContent = suggestionText;
    }
}

// Actualizar contador de resultados
function updateResultsCount() {
    const count = FILTERED_APUS.length;
    document.getElementById('results-count').textContent =
        count === 0 ? 'Sin resultados' :
        count === 1 ? '1 actividad' :
        `${count} actividades`;
}

// Filtrar por categoría
function filterByCategory(category) {
    document.querySelectorAll('.category-chip').forEach(chip => {
        chip.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('active');

    if (category === 'TODOS') {
        FILTERED_APUS = [...APU_DB.actividades];
    } else {
        FILTERED_APUS = APU_DB.actividades.filter(apu => apu.categoria === category);
    }

    document.getElementById('apu-search').value = '';
    renderAPUs(FILTERED_APUS);
    updateResultsCount();
}

// Renderizar tarjetas de APUs
function renderAPUs(apus) {
    const grid = document.getElementById('apu-grid');

    if (apus.length === 0) {
        grid.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">🔍</div>
                <div class="no-results-text">No se encontraron actividades</div>
                <div class="no-results-hint">Intenta con otra búsqueda</div>
            </div>
        `;
        return;
    }

    grid.innerHTML = apus.map(apu => {
        const categoryIcon = getCategoryIcon(apu.categoria);
        const categoryColor = getCategoryColor(apu.categoria);
        const materialsCount = apu.materiales.length;
        const laborCount = apu.mano_obra.length;
        const isFavorite = isAPUFavorite(apu.id);

        return `
            <div class="apu-card" onclick="selectAPU('${apu.id}')" style="border-left: 4px solid ${categoryColor.border};">
                <div class="apu-card-header">
                    <span class="apu-category" style="background: ${categoryColor.bg}; color: ${categoryColor.text}; padding: 4px 8px; border-radius: 4px;">${categoryIcon} ${apu.categoria}</span>
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorite('${apu.id}')" title="${isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}">
                        ${isFavorite ? '⭐' : '☆'}
                    </button>
                </div>
                <div class="apu-card-title">${apu.nombre}</div>
                <div class="apu-card-meta">
                    <span>📦 ${materialsCount} mat.</span>
                    <span>👷 ${laborCount} M.O.</span>
                    ${apu.precio_referencia ? `<span class="apu-price">~$${formatMoney(apu.precio_referencia)}</span>` : ''}
                </div>
                <div class="apu-card-footer">
                    <button class="apu-select-btn">
                        Seleccionar <span>→</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// SISTEMA DE FAVORITOS
// ============================================

// Obtener favoritos del localStorage
function getFavorites() {
    const favs = localStorage.getItem('claudia_favorites');
    return favs ? JSON.parse(favs) : [];
}

// Guardar favoritos
function saveFavorites(favorites) {
    localStorage.setItem('claudia_favorites', JSON.stringify(favorites));
}

// Verificar si un APU es favorito
function isAPUFavorite(apuId) {
    const favorites = getFavorites();
    return favorites.includes(apuId);
}

// Toggle favorito
function toggleFavorite(apuId) {
    let favorites = getFavorites();
    const action = favorites.includes(apuId) ? 'remove' : 'add';

    if (favorites.includes(apuId)) {
        // Quitar de favoritos
        favorites = favorites.filter(id => id !== apuId);
        showNotification('Quitado de favoritos', 'info');
    } else {
        // Agregar a favoritos
        favorites.push(apuId);
        showNotification('Agregado a favoritos', 'success');
    }

    saveFavorites(favorites);
    renderFavorites();

    // Track analytics
    if (window.ClaudiaAnalytics) {
        ClaudiaAnalytics.trackFavorite(apuId, action);
    }

    // Re-renderizar APUs para actualizar el ícono
    const searchTerm = document.getElementById('search-box')?.value || '';
    if (searchTerm) {
        searchAPUs();
    } else if (CURRENT_CATEGORY) {
        showCategory(CURRENT_CATEGORY);
    }
}

// Renderizar lista de favoritos
function renderFavorites() {
    const favorites = getFavorites();
    const favoritesCard = document.getElementById('favorites-card');
    const favoritesList = document.getElementById('favorites-list');

    if (!favoritesCard || !favoritesList) return;

    if (favorites.length === 0) {
        favoritesCard.style.display = 'none';
        return;
    }

    favoritesCard.style.display = 'block';

    const favoriteAPUs = favorites
        .map(id => APU_DB.actividades.find(apu => apu.id === id))
        .filter(apu => apu); // Filtrar nulls

    favoritesList.innerHTML = favoriteAPUs.map(apu => {
        const categoryIcon = getCategoryIcon(apu.categoria);
        const categoryColor = getCategoryColor(apu.categoria);
        return `
            <div class="favorite-item" onclick="selectAPU('${apu.id}')" style="border-left: 4px solid ${categoryColor.border};">
                <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                    <span style="font-size: 20px;">${categoryIcon}</span>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; font-size: 14px; color: #333; margin-bottom: 2px;">${apu.nombre}</div>
                        <div style="font-size: 12px; padding: 2px 8px; background: ${categoryColor.bg}; color: ${categoryColor.text}; border-radius: 4px; display: inline-block; font-weight: 600;">${apu.categoria}</div>
                    </div>
                </div>
                <button class="favorite-btn active" onclick="event.stopPropagation(); toggleFavorite('${apu.id}')" title="Quitar de favoritos">
                    ⭐
                </button>
            </div>
        `;
    }).join('');
}

// Seleccionar APU
function selectAPU(apuId) {
    CURRENT_APU = APU_DB.actividades.find(a => a.id === apuId);
    if (!CURRENT_APU) return;

    document.getElementById('add-activity-form').style.display = 'block';
    document.getElementById('selected-apu-name').textContent = CURRENT_APU.nombre;
    document.getElementById('cantidad').value = '1';
    document.getElementById('unidad-display').value = CURRENT_APU.unidad;

    showAPUDetails(CURRENT_APU);

    document.getElementById('add-activity-form').scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });
}

// Mostrar detalles del APU
function showAPUDetails(apu) {
    // Obtener tips para esta actividad
    let tipsHTML = '';
    if (TIPS_DB && TIPS_DB.tips[apu.id]) {
        const tips = TIPS_DB.tips[apu.id];
        tipsHTML = `
            <div class="detail-section" style="background: linear-gradient(135deg, #fffbeb, #fef3c7); border-left: 4px solid #f59e0b; padding: 12px; border-radius: 8px;">
                <div class="detail-title" style="color: #92400e;">💡 Tips Profesionales</div>
                ${tips.map(tip =>
                    `<div class="detail-item" style="color: #78350f; margin: 8px 0;">✓ ${tip}</div>`
                ).join('')}
            </div>
        `;
    }

    const detailsHTML = `
        <div class="apu-details">
            <div class="detail-section">
                <div class="detail-title">📦 Materiales</div>
                ${apu.materiales.map(m =>
                    `<div class="detail-item">• ${m.cantidad} ${m.unidad} ${m.nombre}</div>`
                ).join('')}
            </div>
            <div class="detail-section">
                <div class="detail-title">👷 Mano de obra</div>
                ${apu.mano_obra.map(mo =>
                    `<div class="detail-item">• ${mo.cantidad} ${mo.unidad} ${mo.nombre}</div>`
                ).join('')}
            </div>
            ${apu.rendimiento ? `
                <div class="detail-section">
                    <div class="detail-title">⚡ Rendimiento</div>
                    <div class="detail-item">${apu.rendimiento}</div>
                </div>
            ` : ''}
            ${tipsHTML}
        </div>
    `;
    document.getElementById('apu-details-content').innerHTML = detailsHTML;
}

// Cancelar agregar actividad
function cancelAddActivity() {
    document.getElementById('add-activity-form').style.display = 'none';
    CURRENT_APU = null;
}

// Agregar actividad al proyecto
function addActivityToProject() {
    if (!CURRENT_APU) return;

    const cantidad = parseFloat(document.getElementById('cantidad').value) || 1;
    if (cantidad <= 0) {
        showNotification('Ingresa una cantidad válida (mayor a 0)', 'error');
        return;
    }

    let totalMateriales = 0;
    let totalManoObra = 0;

    CURRENT_APU.materiales.forEach(material => {
        const nombreKey = material.nombre.toLowerCase();
        const precioUnitario = PRECIOS[nombreKey] || 0;
        const cantidadTotal = material.cantidad * cantidad;
        totalMateriales += cantidadTotal * precioUnitario;
    });

    CURRENT_APU.mano_obra.forEach(mo => {
        const claveNombre = 'mano_obra_' + mo.nombre.toLowerCase();
        const precioHH = PRECIOS[claveNombre] || 12000;
        const cantidadTotal = mo.cantidad * cantidad;
        totalManoObra += cantidadTotal * precioHH;
    });

    const activity = {
        id: CURRENT_APU.id,
        name: CURRENT_APU.nombre,
        category: CURRENT_APU.categoria,
        quantity: cantidad,
        unit: CURRENT_APU.unidad,
        materials: totalMateriales,
        labor: totalManoObra,
        total: totalMateriales + totalManoObra
    };

    const project = getCurrentProject();
    if (project) {
        const loadingToast = showNotification('Agregando actividad...', 'loading');

        // Simulación de procesamiento para mostrar animación
        setTimeout(() => {
            project.activities.push(activity);
            saveProjects();
            addToHistory('add_activity');

            // Remover loading toast
            if (loadingToast && loadingToast.parentNode) {
                loadingToast.remove();
            }

            showNotification(`"${activity.name}" agregada exitosamente`, 'success');
            showAutoSave();

            // Track analytics
            if (window.ClaudiaAnalytics) {
                ClaudiaAnalytics.trackAddActivity(activity, project);
            }
        }, 300);
    }

    document.getElementById('add-activity-form').style.display = 'none';
    CURRENT_APU = null;

    document.getElementById('project-card').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// Ver presupuesto completo
function viewProjectBudget() {
    const project = getCurrentProject();
    if (!project || project.activities.length === 0) return;

    let totalMateriales = 0;
    let totalManoObra = 0;
    let totalGeneral = 0;

    const activitiesHTML = project.activities.map(activity => {
        totalMateriales += activity.materials;
        totalManoObra += activity.labor;
        totalGeneral += activity.total;

        return `
            <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 2px solid #e0e0e0;">
                <h4 style="color: #000; margin-bottom: 10px;">${activity.name}</h4>
                <p style="font-size: 13px; color: #757575; margin-bottom: 10px;">
                    ${activity.quantity} ${activity.unit}
                </p>
                <div class="material-item" style="background: #f5f5f5;">
                    <div class="material-name">📦 Materiales</div>
                    <div class="material-quantity">$${formatMoney(activity.materials)}</div>
                </div>
                <div class="material-item" style="background: #f5f5f5;">
                    <div class="material-name">👷 Mano de Obra</div>
                    <div class="material-quantity">$${formatMoney(activity.labor)}</div>
                </div>
                <div class="material-item">
                    <div class="material-name"><strong>Subtotal</strong></div>
                    <div class="material-quantity"><strong>$${formatMoney(activity.total)}</strong></div>
                </div>
            </div>
        `;
    }).join('');

    const plan = [
        { cuota: 1, porcentaje: 30, descripcion: 'Al inicio' },
        { cuota: 2, porcentaje: 40, descripcion: 'A mitad de obra' },
        { cuota: 3, porcentaje: 30, descripcion: 'Al finalizar' }
    ];

    const planHTML = plan.map(p => {
        const monto = totalGeneral * (p.porcentaje / 100);
        return `
            <div class="material-item">
                <div>
                    <div class="material-name">Cuota ${p.cuota} (${p.porcentaje}%)</div>
                    <div class="material-notes">${p.descripcion}</div>
                </div>
                <div class="material-quantity">$${formatMoney(monto)}</div>
            </div>
        `;
    }).join('');

    const budgetHTML = `
        <h3 style="margin-bottom: 15px; color: #000;">📋 ${PROJECT.name}</h3>

        ${activitiesHTML}

        <div style="margin-top: 20px; padding-top: 20px; border-top: 3px solid #DD0021;">
            <div class="material-item" style="background: #f5f5f5;">
                <div class="material-name">📦 Total Materiales</div>
                <div class="material-quantity">$${formatMoney(totalMateriales)}</div>
            </div>
            <div class="material-item" style="background: #f5f5f5;">
                <div class="material-name">👷 Total Mano de Obra</div>
                <div class="material-quantity">$${formatMoney(totalManoObra)}</div>
            </div>
            <div class="material-item" style="background: linear-gradient(135deg, #DD0021, #ff1a3d); color: white; font-size: 18px;">
                <div class="material-name"><strong>💰 TOTAL PROYECTO</strong></div>
                <div class="material-quantity"><strong>$${formatMoney(totalGeneral)}</strong></div>
            </div>
        </div>

        <div style="margin-top: 25px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
            <h3 style="margin-bottom: 15px; color: #000;">💳 Plan de Pagos</h3>
            ${planHTML}
        </div>
    `;

    document.getElementById('budget-content').innerHTML = budgetHTML;
    document.getElementById('full-budget').style.display = 'block';

    document.getElementById('full-budget').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// Cerrar presupuesto
function closeBudget() {
    document.getElementById('full-budget').style.display = 'none';
}

// Iconos por categoría
function getCategoryIcon(category) {
    const icons = {
        'HORMIGONES': '🏗️',
        'ALBANILERIA': '🧱',
        'MOVIMIENTO TIERRA': '⛏️',
        'MOLDAJES': '📐',
        'ENFIERRADURAS': '⚙️',
        'REVESTIMIENTOS': '🎨',
        'PAVIMENTOS': '🛣️',
        'FAENA': '🏕️',
        'VARIOS': '📦'
    };
    return icons[category] || '📋';
}

// Colores por categoría
function getCategoryColor(category) {
    const colors = {
        'HORMIGONES': { bg: '#e3f2fd', border: '#2196f3', text: '#1565c0' },
        'ALBANILERIA': { bg: '#fff3e0', border: '#ff9800', text: '#e65100' },
        'MOVIMIENTO TIERRA': { bg: '#f1f8e9', border: '#8bc34a', text: '#558b2f' },
        'MOLDAJES': { bg: '#fce4ec', border: '#e91e63', text: '#c2185b' },
        'ENFIERRADURAS': { bg: '#e8eaf6', border: '#673ab7', text: '#4527a0' },
        'REVESTIMIENTOS': { bg: '#f3e5f5', border: '#9c27b0', text: '#7b1fa2' },
        'PAVIMENTOS': { bg: '#e0f2f1', border: '#009688', text: '#00695c' },
        'FAENA': { bg: '#fff9c4', border: '#fbc02d', text: '#f57f17' },
        'VARIOS': { bg: '#eceff1', border: '#607d8b', text: '#37474f' }
    };
    return colors[category] || { bg: '#f5f5f5', border: '#9e9e9e', text: '#616161' };
}

// Debounce
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Precios 2025 - Actualizados
const PRECIOS = {
    // MATERIALES BASE
    'cemento': 9500,
    'arena': 22000,
    'ripio': 25000,
    'grava': 23000,
    'hormigón h20': 115000,

    // LADRILLOS Y BLOQUES
    'ladrillo princesa': 520,
    'ladrillo fiscal': 380,
    'ladrillo refractario': 850,
    'bloque hormigón': 1050,
    'bloque de hormigón': 1050,

    // FIERROS Y ACEROS
    'malla acma c-188': 1400,
    'malla acma': 1400,
    'fierro d=10mm': 1100,
    'fierro': 1100,
    'fierro cuadrado 16mm': 1250,
    'alambre negro': 1200,
    'alambre tensión': 1300,
    'perfiles acero': 1800,
    'estructura metálica': 1800,

    // MADERAS
    'madera pino bruto': 650000,
    'clavos 3"': 2800,
    'tabla deck': 7500,
    'vigas 2x4': 1200,
    'tornillos deck': 45,
    'costanera 2x3': 850,
    'separadores': 150,

    // IMPERMEABILIZANTES
    'hidrorrepelente': 3500,
    'impermeabilizante': 4200,
    'geotextil': 850,
    'polietileno': 450,

    // MORTEROS
    'mortero pega': 18000,
    'mortero': 18000,
    'mortero refractario': 25000,
    'pasta muro': 3500,
    'pasta junta': 4200,

    // PINTURAS
    'pintura látex': 12500,
    'pintura exterior': 15500,
    'imprimante': 8500,
    'pintura antióxido': 14000,
    'pintura esmalte': 18000,
    'barniz exterior': 16500,

    // CERÁMICAS Y PISOS
    'cerámica 30x30': 6500,
    'cerámica 30x90': 12500,
    'porcelanato 60x60': 18500,
    'adhesivo cerámico': 4800,
    'adhesivo': 4800,
    'adhesivo premium': 6500,
    'fragüe': 3200,
    'piso flotante ac4': 8500,
    'espuma niveladora': 850,
    'guardapolvo': 1200,
    'alfombra': 7500,
    'espuma base': 950,

    // REVESTIMIENTOS
    'melamina 18mm': 18500,
    'placa volcanita 10mm': 5500,
    'perfiles metálicos': 850,
    'perfiles cielo': 750,
    'tornillos': 25,
    'lambril pvc': 5800,
    'perfiles': 850,
    'grapas': 15,

    // PUERTAS Y VENTANAS
    'puerta placa': 45000,
    'marco puerta': 15000,
    'bisagras': 2500,
    'bisagras reforzadas': 4500,
    'chapa': 8500,
    'ventana aluminio': 85000,
    'ventana pvc dvh': 165000,
    'puerta metálica': 145000,
    'puerta bodega': 185000,
    'candado': 12500,

    // SANITARIOS
    'wc completo': 65000,
    'sello cera': 2500,
    'tornillos fijación': 1200,
    'lavamanos pedestal': 35000,
    'lavamanos cerámica': 28000,
    'grifería': 25000,
    'sifón': 4500,
    'ducha completa': 32000,
    'flexible': 3500,
    'soporte mural': 2800,
    'tina acrílica': 245000,
    'desagüe': 8500,
    'mueble 60cm': 75000,
    'calefón 10l': 145000,
    'termo 50l': 125000,

    // ELÉCTRICOS
    'cable 2.5mm': 850,
    'cable 1.5mm': 650,
    'cable 3x2.5mm': 1100,
    'cable eléctrico': 850,
    'enchufes': 2500,
    'interruptor': 3200,
    'portalámparas': 1800,
    'caja empotrar': 850,
    'luminaria led 12w': 12500,

    // GASFITERÍA
    'cañería cobre 1/2': 4500,
    'cañería cobre': 4500,
    'llave paso': 5500,
    'tubo evacuación': 3500,
    'canaleta pvc 110mm': 6500,
    'soportes': 850,
    'pegamento pvc': 3200,
    'tubería pvc': 2500,
    'tubería pe': 1800,

    // JARDÍN
    'pasto rollo': 3500,
    'tierra vegetal': 15000,
    'fertilizante': 8500,
    'aspersores': 12500,
    'programador': 45000,
    'válvulas': 8500,

    // OTROS
    'silicona': 3500,
    'silicona espejo': 4200,
    'espejo 80x60': 38000,
    'cortina roller': 32000,
    'campana 60cm': 95000,
    'ducto aluminio': 8500,
    'rejilla exterior': 4500,
    'split 12000 btu': 325000,
    'sistema solar 200l': 585000,
    'estructura soporte': 45000,
    'piscina fibra 6x3': 2450000,
    'bomba filtro': 185000,
    'arena excavación': 18000,
    'riel corredero': 25000,
    'motor automático': 185000,
    'pernos expansión': 350,
    'pernos': 350,
    'pernos anclaje': 850,
    'policarbonato': 12500,
    'fierro parrilla': 85000,
    'chimenea': 125000,
    'barral colgar': 4500,
    'correderas': 3500,
    'tirador': 2200,
    'plancha zinc': 7500,
    'clavos techo': 85,
    'excavación': 0,
    'postes metálicos': 12500,

    // MANO DE OBRA 2025
    'mano_obra_jornal': 15000,
    'mano_obra_ayudante': 14000,
    'mano_obra_albanil': 18000,
    'mano_obra_albañil': 18000,
    'mano_obra_carpintero': 17000,
    'mano_obra_fierrero': 16000,
    'mano_obra_estucador': 17500,
    'mano_obra_pintor': 16500,
    'mano_obra_ceramista': 18500,
    'mano_obra_gasfiter': 19000,
    'mano_obra_electricista': 19500,
    'mano_obra_instalador': 17000,
    'mano_obra_soldador': 19500,
    'mano_obra_volcanitero': 17500,
    'mano_obra_techador': 16500,
    'mano_obra_mueblista': 18000,
    'mano_obra_especialista': 25000,
    'mano_obra_excavadora': 45000,
    'mano_obra_jardinero': 14500,
    'mano_obra_técnico clima': 22000
};

// PLANTILLAS DE PROYECTO Y TIPS
let TEMPLATES_DB = null;
let TIPS_DB = null;

// Cargar plantillas
fetch('project-templates.json')
    .then(r => r.json())
    .then(data => {
        TEMPLATES_DB = data;
        console.log('✅ Plantillas cargadas:', data.metadata.total_templates);
    })
    .catch(err => console.log('ℹ️ Plantillas no disponibles'));

// Cargar tips de construcción
fetch('construction-tips.json')
    .then(r => r.json())
    .then(data => {
        TIPS_DB = data;
        console.log('✅ Tips cargados:', Object.keys(data.tips).length);
    })
    .catch(err => console.log('ℹ️ Tips no disponibles'));

// Mostrar modal de plantillas
function showTemplates() {
    if (!TEMPLATES_DB) {
        showNotification('Las plantillas no están disponibles en este momento', 'warning');
        return;
    }

    const modal = document.getElementById('templates-modal');
    const grid = document.getElementById('templates-grid');

    grid.innerHTML = TEMPLATES_DB.templates.map(template => `
        <div class="template-card" onclick="applyTemplate('${template.id}')">
            <div class="template-icon">${template.icon}</div>
            <div class="template-name">${template.nombre}</div>
            <div class="template-desc">${template.descripcion}</div>
            <div class="template-count">${template.actividades.length} actividades</div>
        </div>
    `).join('');

    modal.classList.add('active');
}

// Cerrar modal
function closeTemplates() {
    document.getElementById('templates-modal').classList.remove('active');
}

// Aplicar plantilla
function applyTemplate(templateId) {
    const template = TEMPLATES_DB.templates.find(t => t.id === templateId);
    if (!template) return;

    const project = getCurrentProject();
    if (!project) return;

    if (project.activities.length > 0) {
        if (!confirm('¿Reemplazar el proyecto actual con esta plantilla?')) {
            return;
        }
    }

    project.activities = [];
    project.name = template.nombre;
    document.getElementById('project-name').value = template.nombre;

    let completed = 0;
    const total = template.actividades.length;

    template.actividades.forEach(item => {
        const apu = APU_DB.actividades.find(a => a.id === item.id);
        if (!apu) {
            console.warn('APU no encontrado:', item.id);
            return;
        }

        const cantidad = item.cantidad;
        let totalMateriales = 0;
        let totalManoObra = 0;

        apu.materiales.forEach(material => {
            const nombreKey = material.nombre.toLowerCase();
            const precioUnitario = PRECIOS[nombreKey] || 0;
            const cantidadTotal = material.cantidad * cantidad;
            totalMateriales += cantidadTotal * precioUnitario;
        });

        apu.mano_obra.forEach(mo => {
            const claveNombre = 'mano_obra_' + mo.nombre.toLowerCase();
            const precioHH = PRECIOS[claveNombre] || 12000;
            const cantidadTotal = mo.cantidad * cantidad;
            totalManoObra += cantidadTotal * precioHH;
        });

        const activity = {
            id: apu.id,
            name: apu.nombre,
            category: apu.categoria,
            quantity: cantidad,
            unit: apu.unidad,
            materials: totalMateriales,
            labor: totalManoObra,
            total: totalMateriales + totalManoObra
        };

        project.activities.push(activity);
        completed++;
    });

    saveProjects();
    addToHistory('apply_template');
    closeTemplates();

    showNotification(`Plantilla "${template.nombre}" aplicada: ${completed} de ${total} actividades agregadas`, 'success', 4000);
}

// Cerrar modal al hacer clic fuera
document.addEventListener('click', function(e) {
    const modal = document.getElementById('templates-modal');
    if (e.target === modal) {
        closeTemplates();
    }
});

// EXPORTAR A EXCEL/CSV
function exportToExcel() {
    const project = getCurrentProject();
    if (!project || project.activities.length === 0) {
        showNotification('No hay actividades para exportar', 'warning');
        return;
    }

    let totalMateriales = 0;
    let totalManoObra = 0;
    let totalGeneral = 0;

    // Crear CSV
    let csv = 'PRESUPUESTO: ' + project.name + '\n';
    csv += 'Generado: ' + new Date().toLocaleDateString('es-CL') + '\n\n';
    csv += 'Actividad,Cantidad,Unidad,Materiales,Mano de Obra,Total\n';

    project.activities.forEach(activity => {
        totalMateriales += activity.materials;
        totalManoObra += activity.labor;
        totalGeneral += activity.total;

        csv += `"${activity.name}",${activity.quantity},${activity.unit},$${formatMoney(activity.materials)},$${formatMoney(activity.labor)},$${formatMoney(activity.total)}\n`;
    });

    csv += '\n';
    csv += `TOTALES,,,$${formatMoney(totalMateriales)},$${formatMoney(totalManoObra)},$${formatMoney(totalGeneral)}\n`;

    // Plan de pagos
    csv += '\n\nPLAN DE PAGOS\n';
    csv += 'Cuota,Porcentaje,Monto\n';
    csv += `1 - Al inicio,30%,$${formatMoney(totalGeneral * 0.3)}\n`;
    csv += `2 - A mitad de obra,40%,$${formatMoney(totalGeneral * 0.4)}\n`;
    csv += `3 - Al finalizar,30%,$${formatMoney(totalGeneral * 0.3)}\n`;

    // Descargar
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `Presupuesto_${project.name.replace(/\s+/g, '_')}_${Date.now()}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('Presupuesto exportado exitosamente. Puedes abrirlo con Excel o Google Sheets', 'success', 4000);
}

// COMPARTIR PROYECTO
function shareProject() {
    const project = getCurrentProject();
    if (!project || project.activities.length === 0) {
        showNotification('No hay actividades para compartir', 'warning');
        return;
    }

    let totalGeneral = 0;
    project.activities.forEach(activity => {
        totalGeneral += activity.total;
    });

    const mensaje = `📋 *${project.name}*\n\n` +
                   `📦 ${project.activities.length} actividades\n` +
                   `💰 Total: $${formatMoney(totalGeneral)}\n\n` +
                   `🤖 Generado con CLAUDIA\n` +
                   `Tu Asistente Inteligente de Construcción\n` +
                   `https://claudia-i8bxh.web.app`;

    // Compartir usando Web Share API o copiar al portapapeles
    if (navigator.share) {
        navigator.share({
            title: project.name,
            text: mensaje
        }).then(() => {
            console.log('Compartido exitosamente');
        }).catch(err => {
            console.log('Error al compartir:', err);
            copyToClipboard(mensaje);
        });
    } else {
        copyToClipboard(mensaje);
    }
}

// Copiar al portapapeles
function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
        document.execCommand('copy');
        showNotification('Presupuesto copiado al portapapeles. Puedes pegarlo en WhatsApp, email, etc.', 'success', 4000);
    } catch (err) {
        showNotification('No se pudo copiar automáticamente. Intenta copiar manualmente', 'error');
    }

    document.body.removeChild(textarea);
}

// ============================================
// SISTEMA DE BITÁCORA DIARIA Y TAREAS
// ============================================

// Agregar tarea al proyecto
function addTask(description, priority = 'normal') {
    const project = getCurrentProject();
    if (!project) return;

    const task = {
        id: 'task_' + Date.now(),
        description: description,
        priority: priority, // 'high', 'normal', 'low'
        status: 'pending', // 'pending', 'in_progress', 'completed'
        createdAt: new Date().toISOString(),
        completedAt: null
    };

    if (!project.tasks) project.tasks = [];
    project.tasks.push(task);
    saveProjects();
    renderTasks();
    return task;
}

// Agregar tarea desde input
function addTaskFromInput() {
    const input = document.getElementById('new-task-input');
    const prioritySelect = document.getElementById('task-priority');

    if (!input || !input.value.trim()) {
        showNotification('Por favor ingresa una descripción para la tarea', 'warning');
        input.focus();
        return;
    }

    addTask(input.value.trim(), prioritySelect.value);
    input.value = '';
    showNotification('Tarea agregada exitosamente', 'success');
}

// Actualizar estado de tarea
function updateTaskStatus(taskId, newStatus) {
    const project = getCurrentProject();
    if (!project || !project.tasks) return;

    const task = project.tasks.find(t => t.id === taskId);
    if (task) {
        task.status = newStatus;
        if (newStatus === 'completed') {
            task.completedAt = new Date().toISOString();
        }
        saveProjects();
        renderTasks();
    }
}

// Eliminar tarea
function deleteTask(taskId) {
    const project = getCurrentProject();
    if (!project || !project.tasks) return;

    project.tasks = project.tasks.filter(t => t.id !== taskId);
    saveProjects();
    renderTasks();
}

// Renderizar lista de tareas
function renderTasks() {
    const project = getCurrentProject();
    if (!project || !project.tasks) return;

    const container = document.getElementById('tasks-list');
    if (!container) return;

    const pending = project.tasks.filter(t => t.status === 'pending');
    const inProgress = project.tasks.filter(t => t.status === 'in_progress');
    const completed = project.tasks.filter(t => t.status === 'completed');

    let html = '<div class="tasks-container">';

    // Tareas en progreso
    if (inProgress.length > 0) {
        html += '<div class="task-section"><h4>🔄 En Progreso</h4>';
        inProgress.forEach(task => {
            html += renderTaskItem(task);
        });
        html += '</div>';
    }

    // Tareas pendientes
    if (pending.length > 0) {
        html += '<div class="task-section"><h4>📋 Pendientes</h4>';
        pending.forEach(task => {
            html += renderTaskItem(task);
        });
        html += '</div>';
    }

    // Tareas completadas (últimas 5)
    if (completed.length > 0) {
        html += '<div class="task-section"><h4>✅ Completadas</h4>';
        completed.slice(-5).reverse().forEach(task => {
            html += renderTaskItem(task);
        });
        html += '</div>';
    }

    html += '</div>';
    container.innerHTML = html;
}

// Renderizar item de tarea
function renderTaskItem(task) {
    const priorityEmoji = {
        'high': '🔴',
        'normal': '🟡',
        'low': '🟢'
    };

    return `
        <div class="task-item task-${task.status}" data-task-id="${task.id}">
            <div class="task-info">
                ${priorityEmoji[task.priority] || '🟡'} ${task.description}
            </div>
            <div class="task-actions">
                ${task.status === 'pending' ?
                    `<button onclick="updateTaskStatus('${task.id}', 'in_progress')" class="btn-task">▶️</button>` : ''}
                ${task.status === 'in_progress' ?
                    `<button onclick="updateTaskStatus('${task.id}', 'completed')" class="btn-task">✅</button>` : ''}
                <button onclick="deleteTask('${task.id}')" class="btn-task-delete">🗑️</button>
            </div>
        </div>
    `;
}

// Generar resumen diario
function generateDailyLog() {
    const project = getCurrentProject();
    if (!project) return null;

    const today = new Date().toISOString().split('T')[0];

    // Calcular progreso financiero
    const totalBudget = project.activities.reduce((sum, act) => sum + act.total, 0);
    const todayChanges = calculateTodayChanges(project);

    // Estadísticas de tareas
    const tasks = project.tasks || [];
    const completedToday = tasks.filter(t =>
        t.status === 'completed' &&
        t.completedAt &&
        t.completedAt.startsWith(today)
    );
    const pendingTasks = tasks.filter(t => t.status !== 'completed');

    const log = {
        id: 'log_' + Date.now(),
        date: new Date().toISOString(),
        projectId: project.id,
        projectName: project.name,

        // Resumen financiero
        financial: {
            totalBudget: totalBudget,
            materialsTotal: project.activities.reduce((sum, act) => sum + act.materials, 0),
            laborTotal: project.activities.reduce((sum, act) => sum + act.labor, 0),
            todayChanges: todayChanges
        },

        // Resumen de tareas
        tasks: {
            completedToday: completedToday.length,
            totalCompleted: tasks.filter(t => t.status === 'completed').length,
            pending: pendingTasks.length,
            inProgress: tasks.filter(t => t.status === 'in_progress').length
        },

        // Estado de obra
        progress: {
            totalActivities: project.activities.length,
            categories: [...new Set(project.activities.map(a => a.category))].length
        }
    };

    return log;
}

// Calcular cambios del día
function calculateTodayChanges(project) {
    const today = new Date().toISOString().split('T')[0];
    const history = project.financialHistory || [];

    const todayHistory = history.filter(h => h.date.startsWith(today));
    return todayHistory.reduce((sum, h) => sum + h.amount, 0);
}

// Registrar cambio financiero
function trackFinancialChange(amount, description) {
    const project = getCurrentProject();
    if (!project) return;

    if (!project.financialHistory) project.financialHistory = [];

    project.financialHistory.push({
        id: 'fin_' + Date.now(),
        date: new Date().toISOString(),
        amount: amount,
        description: description
    });

    saveProjects();
}

// Generar mensaje de bitácora para WhatsApp/Email
function generateLogMessage(log) {
    const date = new Date(log.date);
    const dateStr = date.toLocaleDateString('es-CL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    let message = `🏗️ *BITÁCORA DIARIA - CLAUDIA*\n\n`;
    message += `📅 ${dateStr}\n`;
    message += `📊 Proyecto: *${log.projectName}*\n\n`;

    // Resumen financiero
    message += `💰 *RESUMEN FINANCIERO*\n`;
    message += `┣ Presupuesto Total: $${formatMoney(log.financial.totalBudget)}\n`;
    message += `┣ Materiales: $${formatMoney(log.financial.materialsTotal)}\n`;
    message += `┣ Mano de Obra: $${formatMoney(log.financial.laborTotal)}\n`;
    if (log.financial.todayChanges !== 0) {
        message += `┗ Cambios Hoy: ${log.financial.todayChanges > 0 ? '+' : ''}$${formatMoney(log.financial.todayChanges)}\n`;
    }
    message += `\n`;

    // Resumen de tareas
    message += `✅ *TAREAS Y AVANCE*\n`;
    message += `┣ Completadas Hoy: ${log.tasks.completedToday}\n`;
    message += `┣ Total Completadas: ${log.tasks.totalCompleted}\n`;
    message += `┣ En Progreso: ${log.tasks.inProgress}\n`;
    message += `┗ Pendientes: ${log.tasks.pending}\n`;
    message += `\n`;

    // Estado de obra
    message += `🏗️ *ESTADO DE OBRA*\n`;
    message += `┣ Actividades Planificadas: ${log.progress.totalActivities}\n`;
    message += `┗ Categorías en Proyecto: ${log.progress.categories}\n`;
    message += `\n`;

    // Tareas pendientes para mañana
    const project = getCurrentProject();
    const pendingTasks = (project.tasks || []).filter(t => t.status !== 'completed').slice(0, 5);

    if (pendingTasks.length > 0) {
        message += `📋 *AGENDA PARA MAÑANA*\n`;
        pendingTasks.forEach((task, i) => {
            const priorityEmoji = task.priority === 'high' ? '🔴' : task.priority === 'low' ? '🟢' : '🟡';
            message += `${i + 1}. ${priorityEmoji} ${task.description}\n`;
        });
        message += `\n`;
    }

    message += `---\n`;
    message += `🤖 Generado automáticamente por CLAUDIA\n`;
    message += `https://claudia-i8bxh.web.app`;

    return message;
}

// Generar mensaje motivacional matutino
function generateMorningMessage() {
    const project = getCurrentProject();
    if (!project) return '';

    const messages = [
        '¡Buenos días! 💪 Hoy es un gran día para avanzar en tu proyecto.',
        '🌅 ¡Nuevo día, nuevas oportunidades! Vamos a construir algo increíble.',
        '☕ ¡Buen día! Tu proyecto está esperando que lo hagas realidad.',
        '🚀 ¡Arriba! Hoy vamos a hacer mucho progreso en la obra.',
        '⭐ ¡Buen día! Cada paso cuenta hacia tu proyecto terminado.'
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    const pendingTasks = (project.tasks || []).filter(t => t.status !== 'completed');
    const highPriority = pendingTasks.filter(t => t.priority === 'high');

    let message = `🏗️ *CLAUDIA - Buenos Días*\n\n`;
    message += `${randomMessage}\n\n`;
    message += `📊 Proyecto: *${project.name}*\n`;
    message += `💰 Presupuesto: $${formatMoney(project.activities.reduce((sum, act) => sum + act.total, 0))}\n\n`;

    if (highPriority.length > 0) {
        message += `🔴 *Tareas Prioritarias Hoy:*\n`;
        highPriority.slice(0, 3).forEach((task, i) => {
            message += `${i + 1}. ${task.description}\n`;
        });
        message += `\n`;
    } else if (pendingTasks.length > 0) {
        message += `📋 *Tareas para Hoy:*\n`;
        pendingTasks.slice(0, 3).forEach((task, i) => {
            message += `${i + 1}. ${task.description}\n`;
        });
        message += `\n`;
    }

    message += `¡Vamos con todo! 💪`;

    return message;
}

// Enviar bitácora por email/WhatsApp
async function sendDailyLog() {
    const project = getCurrentProject();
    if (!project || !project.logConfig || !project.logConfig.enabled) {
        return;
    }

    const log = generateDailyLog();
    const message = generateLogMessage(log);

    // Guardar en historial de bitácoras
    if (!project.dailyLogs) project.dailyLogs = [];
    project.dailyLogs.push(log);

    // Mantener solo últimos 30 días
    if (project.dailyLogs.length > 30) {
        project.dailyLogs = project.dailyLogs.slice(-30);
    }

    saveProjects();

    // Enviar al backend
    try {
        const response = await fetch('https://us-central1-claudia-i8bxh.cloudfunctions.net/claudia_handler/send-log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: project.logConfig.email,
                whatsapp: project.logConfig.whatsapp,
                message: message,
                log: log
            })
        });

        if (response.ok) {
            console.log('✅ Bitácora enviada exitosamente');
            showNotification('✅ Bitácora enviada exitosamente');
        }
    } catch (error) {
        console.error('❌ Error enviando bitácora:', error);
    }
}

// Enviar mensaje matutino
async function sendMorningMessage() {
    const project = getCurrentProject();
    if (!project || !project.logConfig || !project.logConfig.morningMotivation) {
        return;
    }

    const message = generateMorningMessage();

    try {
        await fetch('https://us-central1-claudia-i8bxh.cloudfunctions.net/claudia_handler/send-morning', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                whatsapp: project.logConfig.whatsapp,
                message: message
            })
        });
        console.log('✅ Mensaje matutino enviado');
    } catch (error) {
        console.error('❌ Error enviando mensaje matutino:', error);
    }
}

// Programar envíos automáticos
function scheduleDailyLog() {
    const project = getCurrentProject();
    if (!project || !project.logConfig || !project.logConfig.enabled) {
        return;
    }

    const now = new Date();
    const [hours, minutes] = project.logConfig.time.split(':');
    const scheduledTime = new Date(now);
    scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Si ya pasó la hora de hoy, programar para mañana
    if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const timeUntil = scheduledTime.getTime() - now.getTime();

    setTimeout(() => {
        sendDailyLog();
        scheduleDailyLog(); // Reprogramar para el día siguiente
    }, timeUntil);

    console.log(`📅 Bitácora programada para ${scheduledTime.toLocaleString('es-CL')}`);
}

// Programar mensaje matutino
function scheduleMorningMessage() {
    const project = getCurrentProject();
    if (!project || !project.logConfig || !project.logConfig.morningMotivation) {
        return;
    }

    const now = new Date();
    const [hours, minutes] = project.logConfig.morningTime.split(':');
    const scheduledTime = new Date(now);
    scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const timeUntil = scheduledTime.getTime() - now.getTime();

    setTimeout(() => {
        sendMorningMessage();
        scheduleMorningMessage();
    }, timeUntil);

    console.log(`🌅 Mensaje matutino programado para ${scheduledTime.toLocaleString('es-CL')}`);
}

// Programar recordatorios de tareas
function scheduleTaskReminders() {
    const project = getCurrentProject();
    if (!project || !project.logConfig || !project.logConfig.remindersEnabled) {
        return;
    }

    const frequency = project.logConfig.reminderFrequency;

    if (frequency === 'daily' || frequency === 'morning') {
        // Recordatorio matutino (08:00)
        const now = new Date();
        const scheduledTime = new Date(now);
        scheduledTime.setHours(8, 0, 0, 0);

        if (scheduledTime <= now) {
            scheduledTime.setDate(scheduledTime.getDate() + 1);
        }

        const timeUntil = scheduledTime.getTime() - now.getTime();

        setTimeout(() => {
            sendTaskReminder();
            scheduleTaskReminders();
        }, timeUntil);

        console.log(`📲 Recordatorio programado para ${scheduledTime.toLocaleString('es-CL')}`);
    }

    if (frequency === 'daily' || frequency === 'afternoon') {
        // Recordatorio vespertino (15:00)
        const now = new Date();
        const scheduledTime = new Date(now);
        scheduledTime.setHours(15, 0, 0, 0);

        if (scheduledTime <= now) {
            scheduledTime.setDate(scheduledTime.getDate() + 1);
        }

        const timeUntil = scheduledTime.getTime() - now.getTime();

        setTimeout(() => {
            sendTaskReminder();
            scheduleTaskReminders();
        }, timeUntil);

        console.log(`📲 Recordatorio vespertino programado para ${scheduledTime.toLocaleString('es-CL')}`);
    }

    if (frequency === 'urgent') {
        // Clear previous interval if exists
        if (URGENT_TASKS_INTERVAL) {
            clearInterval(URGENT_TASKS_INTERVAL);
        }
        // Verificar tareas urgentes cada hora
        URGENT_TASKS_INTERVAL = setInterval(() => {
            checkUrgentTasks();
        }, 3600000); // Cada hora
    }
}

// Enviar recordatorio de tareas
async function sendTaskReminder() {
    const project = getCurrentProject();
    if (!project || !project.logConfig || !project.logConfig.remindersEnabled) {
        return;
    }

    const pendingTasks = (project.tasks || []).filter(t => t.status !== 'completed');
    if (pendingTasks.length === 0) {
        return; // No hay tareas pendientes
    }

    const highPriority = pendingTasks.filter(t => t.priority === 'high');
    const normalPriority = pendingTasks.filter(t => t.priority === 'normal');

    let message = `📋 *RECORDATORIO DE TAREAS - CLAUDIA*\n\n`;
    message += `📊 Proyecto: *${project.name}*\n`;
    message += `📅 ${new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}\n\n`;

    if (highPriority.length > 0) {
        message += `🔴 *TAREAS URGENTES (${highPriority.length}):*\n`;
        highPriority.slice(0, 5).forEach((task, i) => {
            message += `${i + 1}. ${task.description}\n`;
        });
        message += `\n`;
    }

    if (normalPriority.length > 0 && highPriority.length < 5) {
        message += `📋 *TAREAS PENDIENTES (${normalPriority.length}):*\n`;
        normalPriority.slice(0, 3).forEach((task, i) => {
            message += `${i + 1}. ${task.description}\n`;
        });
        message += `\n`;
    }

    message += `💡 Organiza tu día y marca las tareas completadas en CLAUDIA\n`;
    message += `https://claudia-i8bxh.web.app`;

    // Enviar al backend
    try {
        await fetch('https://us-central1-claudia-i8bxh.cloudfunctions.net/claudia_handler/send-reminder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                phone: project.logConfig.reminderPhone,
                message: message
            })
        });
        console.log('✅ Recordatorio enviado');
    } catch (error) {
        console.error('❌ Error enviando recordatorio:', error);
    }
}

// Verificar tareas urgentes
function checkUrgentTasks() {
    const project = getCurrentProject();
    if (!project || !project.tasks) return;

    const urgentTasks = project.tasks.filter(t =>
        t.status !== 'completed' &&
        t.priority === 'high'
    );

    if (urgentTasks.length > 0) {
        sendTaskReminder();
    }
}

// Mostrar modal de configuración de bitácora
function showLogConfig() {
    document.getElementById('log-config-modal').classList.add('active');
    loadLogConfig();
}

function closeLogConfig() {
    document.getElementById('log-config-modal').classList.remove('active');
}

// Cargar configuración actual
function loadLogConfig() {
    const project = getCurrentProject();
    if (!project || !project.logConfig) return;

    const config = project.logConfig;
    document.getElementById('log-enabled').checked = config.enabled || false;
    document.getElementById('log-time').value = config.time || '18:00';
    document.getElementById('log-email').value = config.email || '';
    document.getElementById('log-whatsapp').value = config.whatsapp || '';
    document.getElementById('morning-enabled').checked = config.morningMotivation || false;
    document.getElementById('morning-time').value = config.morningTime || '08:00';
    document.getElementById('reminders-enabled').checked = config.remindersEnabled || false;
    document.getElementById('reminder-phone').value = config.reminderPhone || '';
    document.getElementById('reminder-frequency').value = config.reminderFrequency || 'daily';
}

// Guardar configuración
function saveLogConfig() {
    const project = getCurrentProject();
    if (!project) return;

    if (!project.logConfig) project.logConfig = {};

    project.logConfig.enabled = document.getElementById('log-enabled').checked;
    project.logConfig.time = document.getElementById('log-time').value;
    project.logConfig.email = document.getElementById('log-email').value;
    project.logConfig.whatsapp = document.getElementById('log-whatsapp').value;
    project.logConfig.morningMotivation = document.getElementById('morning-enabled').checked;
    project.logConfig.morningTime = document.getElementById('morning-time').value;
    project.logConfig.remindersEnabled = document.getElementById('reminders-enabled').checked;
    project.logConfig.reminderPhone = document.getElementById('reminder-phone').value;
    project.logConfig.reminderFrequency = document.getElementById('reminder-frequency').value;

    saveProjects();
    closeLogConfig();

    // Reprogramar envíos
    scheduleDailyLog();
    scheduleMorningMessage();
    scheduleTaskReminders();

    showNotification('✅ Configuración guardada');
}

// Mostrar notificación toast profesional
function showNotification(message, type = 'success', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `toast-notification toast-${type}`;

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
        loading: '⏳'
    };

    notification.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${message}</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    if (type !== 'loading') {
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    return notification;
}

// Reemplazar alerts por toasts
function showConfirm(message, onConfirm) {
    const modal = document.createElement('div');
    modal.className = 'confirm-modal';
    modal.innerHTML = `
        <div class="confirm-overlay"></div>
        <div class="confirm-box">
            <div class="confirm-icon">⚠️</div>
            <div class="confirm-message">${message}</div>
            <div class="confirm-buttons">
                <button class="btn btn-secondary" onclick="this.closest('.confirm-modal').remove()">Cancelar</button>
                <button class="btn" onclick="this.closest('.confirm-modal').dataset.confirm = 'true'; this.closest('.confirm-modal').remove()">Confirmar</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    setTimeout(() => {
        modal.classList.add('show');
    }, 50);

    modal.addEventListener('click', (e) => {
        if (e.target.classList.contains('confirm-overlay')) {
            modal.remove();
        }
    });

    const checkConfirm = setInterval(() => {
        if (!document.body.contains(modal)) {
            clearInterval(checkConfirm);
            if (modal.dataset.confirm === 'true') {
                onConfirm();
            }
        }
    }, 100);
}

// Auto-save indicator
let autoSaveTimeout;
function showAutoSave() {
    clearTimeout(autoSaveTimeout);

    let indicator = document.getElementById('auto-save-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'auto-save-indicator';
        indicator.className = 'auto-save-indicator';
        document.body.appendChild(indicator);
    }

    indicator.innerHTML = '<span class="auto-save-saving">💾 Guardando...</span>';
    indicator.classList.add('show');

    autoSaveTimeout = setTimeout(() => {
        indicator.innerHTML = '<span class="auto-save-saved">✓ Guardado</span>';
        setTimeout(() => {
            indicator.classList.remove('show');
        }, 2000);
    }, 500);
}

// Mostrar vista previa de bitácora
function previewDailyLog() {
    const log = generateDailyLog();
    const message = generateLogMessage(log);

    const modal = document.getElementById('log-preview-modal');
    document.getElementById('log-preview-content').innerText = message;
    modal.classList.add('active');
}

function closeLogPreview() {
    document.getElementById('log-preview-modal').classList.remove('active');
}

// ============================================
// FIN SISTEMA DE BITÁCORA
// ============================================

// Auto-save project name
document.addEventListener('DOMContentLoaded', function() {
    const nameInput = document.getElementById('project-name');
    if (nameInput) {
        nameInput.addEventListener('blur', saveProject);
    }

    // Inicializar programación de bitácoras
    scheduleDailyLog();
    scheduleMorningMessage();
    scheduleTaskReminders();

    // Renderizar favoritos al cargar
    renderFavorites();

    console.log('🤖 CLAUDIA PRO - Sistema de Proyectos v4.1 con Gráficos y Favoritos');
});

// ============================================
// DASHBOARD DE PROYECTOS
// ============================================

function showDashboard() {
    const modal = document.getElementById('dashboard-modal');
    const content = document.getElementById('dashboard-content');

    if (!modal || !content) return;

    const projects = getAllProjects();

    if (projects.length === 0) {
        content.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 64px; margin-bottom: 15px;">📁</div>
                <div style="font-weight: 600; font-size: 18px; margin-bottom: 8px; color: #333;">No hay proyectos</div>
                <div style="font-size: 14px; color: #757575;">Crea tu primer proyecto para ver estadísticas</div>
            </div>
        `;
        modal.classList.add('active');
        return;
    }

    // Calcular estadísticas generales
    let totalProjects = projects.length;
    let totalBudget = 0;
    let totalActivities = 0;
    let totalTasks = 0;
    let completedTasks = 0;

    projects.forEach(p => {
        p.activities.forEach(a => totalBudget += a.total);
        totalActivities += p.activities.length;
        if (p.tasks) {
            totalTasks += p.tasks.length;
            completedTasks += p.tasks.filter(t => t.status === 'completed').length;
        }
    });

    content.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 25px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px; color: white;">
                <div style="font-size: 32px; font-weight: 700; margin-bottom: 5px;">${totalProjects}</div>
                <div style="font-size: 13px; opacity: 0.9;">Proyectos Activos</div>
            </div>
            <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; border-radius: 12px; color: white;">
                <div style="font-size: 32px; font-weight: 700; margin-bottom: 5px;">$${formatMoney(totalBudget)}</div>
                <div style="font-size: 13px; opacity: 0.9;">Presupuesto Total</div>
            </div>
            <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 20px; border-radius: 12px; color: white;">
                <div style="font-size: 32px; font-weight: 700; margin-bottom: 5px;">${totalActivities}</div>
                <div style="font-size: 13px; opacity: 0.9;">Actividades</div>
            </div>
            <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); padding: 20px; border-radius: 12px; color: white;">
                <div style="font-size: 32px; font-weight: 700; margin-bottom: 5px;">${completedTasks}/${totalTasks}</div>
                <div style="font-size: 13px; opacity: 0.9;">Tareas Completadas</div>
            </div>
        </div>

        <h4 style="margin: 20px 0 15px 0; color: #333;">Todos los Proyectos</h4>
        <div style="display: grid; gap: 12px;">
            ${projects.map(project => {
                const total = project.activities.reduce((sum, a) => sum + a.total, 0);
                const tasks = project.tasks || [];
                const completedProjectTasks = tasks.filter(t => t.status === 'completed').length;
                const progress = tasks.length > 0 ? Math.round((completedProjectTasks / tasks.length) * 100) : 0;

                return `
                    <div class="dashboard-project-card" onclick="selectDashboardProject('${project.id}')">
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                <div style="font-weight: 700; font-size: 16px; color: #333;">${project.name}</div>
                                <div style="font-size: 11px; background: #e3f2fd; color: #1976d2; padding: 4px 8px; border-radius: 4px; font-weight: 600;">
                                    ${project.activities.length} actividades
                                </div>
                            </div>
                            <div style="display: flex; gap: 15px; font-size: 13px; color: #757575;">
                                <span>💰 $${formatMoney(total)}</span>
                                <span>✅ ${completedProjectTasks}/${tasks.length} tareas</span>
                                ${progress > 0 ? `<span>📊 ${progress}% completado</span>` : ''}
                            </div>
                            ${progress > 0 ? `
                                <div style="margin-top: 10px; background: #f5f5f5; height: 6px; border-radius: 3px; overflow: hidden;">
                                    <div style="width: ${progress}%; height: 100%; background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); transition: width 0.3s ease;"></div>
                                </div>
                            ` : ''}
                        </div>
                        <button class="btn btn-secondary" style="padding: 10px 16px;">
                            Ver →
                        </button>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    modal.classList.add('active');
}

function closeDashboard() {
    const modal = document.getElementById('dashboard-modal');
    if (modal) modal.classList.remove('active');
}

function selectDashboardProject(projectId) {
    switchProject(projectId);
    closeDashboard();
    showNotification('Proyecto seleccionado', 'success');
    document.getElementById('project-card').scrollIntoView({ behavior: 'smooth' });
}

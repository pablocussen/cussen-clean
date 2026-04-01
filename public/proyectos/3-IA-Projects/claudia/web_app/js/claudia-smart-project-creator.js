/**
 * CLAUDIA SMART PROJECT CREATOR
 * Módulo para crear proyectos con sugerencias IA inteligentes usando Gemini.
 *
 * Resuelve el problema de Pablo: cuando el usuario escribe "Remodelación baño",
 * automáticamente sugiere 15-25 APUs relevantes con cantidades estimadas.
 */

// Global para guardar sugerencias temporalmente
window.currentAISuggestions = null;

/**
 * Muestra modal inteligente para crear proyecto con sugerencias IA
 */
function showSmartProjectCreationModal() {
    const modal = document.createElement('div');
    modal.id = 'smart-project-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content smart-project-modal">
            <div class="modal-header">
                <h2>🤖 Crear Proyecto Inteligente</h2>
                <button class="modal-close" onclick="closeSmartProjectModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="project-info-step">
                    <label>Nombre del proyecto:</label>
                    <input type="text" id="smart-project-name"
                           placeholder="Ej: Remodelación baño, Ampliación cocina, Casa 80m²..."
                           class="smart-input">

                    <label>Descripción (opcional):</label>
                    <textarea id="smart-project-description"
                              placeholder="Detalles adicionales del proyecto..."
                              class="smart-textarea" rows="3"></textarea>

                    <label>Superficie en m² (opcional):</label>
                    <input type="number" id="smart-project-surface"
                           placeholder="Ej: 6" step="0.1"
                           class="smart-input">

                    <div class="modal-buttons">
                        <button class="btn-secondary" onclick="createProjectWithoutAI()">
                            Crear Sin Sugerencias
                        </button>
                        <button class="btn-primary" onclick="generateSmartSuggestions()" id="btn-generate-ai">
                            🤖 Generar Sugerencias IA
                        </button>
                    </div>
                </div>

                <div class="ai-suggestions-step" id="ai-suggestions-container" style="display:none;">
                    <div class="loading-ai" id="loading-ai">
                        <div class="spinner"></div>
                        <p>CLAUDIA está analizando tu proyecto...</p>
                        <p class="loading-tip">Esto puede tomar 5-10 segundos</p>
                    </div>

                    <div class="suggestions-result" id="suggestions-result" style="display:none;">
                        <div class="suggestions-header">
                            <h3>✨ Sugerencias Inteligentes</h3>
                            <p class="confidence-badge" id="confidence-badge"></p>
                        </div>

                        <div class="suggestions-summary" id="suggestions-summary"></div>

                        <div class="suggestions-list" id="suggestions-list"></div>

                        <div class="modal-buttons">
                            <button class="btn-secondary" onclick="backToProjectInfo()">
                                ← Volver
                            </button>
                            <button class="btn-primary" onclick="createProjectWithSuggestions()">
                                ✅ Crear Proyecto con APUs Seleccionados
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Focus en el input y permitir Enter para avanzar
    const nameInput = document.getElementById('smart-project-name');
    nameInput.focus();
    nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            generateSmartSuggestions();
        }
    });
}

function closeSmartProjectModal() {
    const modal = document.getElementById('smart-project-modal');
    if (modal) modal.remove();
    window.currentAISuggestions = null;
}

function createProjectWithoutAI() {
    const name = document.getElementById('smart-project-name').value.trim();
    if (!name) {
        showToast('⚠️ Ingresa un nombre para el proyecto');
        return;
    }

    const newProject = createDefaultProject();
    newProject.name = name;

    allProjects.push(newProject);
    currentProject = newProject;
    saveProjects();
    updateProjectSelector();

    closeSmartProjectModal();
    showToast('✅ Proyecto creado');
}

async function generateSmartSuggestions() {
    const name = document.getElementById('smart-project-name').value.trim();
    if (!name) {
        showToast('⚠️ Ingresa un nombre para el proyecto');
        return;
    }

    const description = document.getElementById('smart-project-description').value.trim();
    const surface = document.getElementById('smart-project-surface').value;

    // Mostrar loading
    document.querySelector('.project-info-step').style.display = 'none';
    document.getElementById('ai-suggestions-container').style.display = 'block';
    document.getElementById('loading-ai').style.display = 'block';
    document.getElementById('suggestions-result').style.display = 'none';

    try {
        const response = await fetch('https://us-central1-claudia-i8bxh.cloudfunctions.net/suggest_project_apus', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                project_name: name,
                project_description: description,
                surface_area: surface ? parseFloat(surface) : null
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Error generando sugerencias');
        }

        // Guardar sugerencias globalmente
        window.currentAISuggestions = result.suggestions;

        // Ocultar loading, mostrar resultados
        document.getElementById('loading-ai').style.display = 'none';
        document.getElementById('suggestions-result').style.display = 'block';

        // Mostrar badge de confianza
        const confidenceBadge = document.getElementById('confidence-badge');
        const confidenceText = result.confidence === 'high' ? '✅ Alta Confianza' :
                               result.confidence === 'medium' ? '⚠️ Confianza Media' : '❓ Baja Confianza';
        const confidenceClass = result.confidence === 'high' ? 'confidence-high' :
                                result.confidence === 'medium' ? 'confidence-medium' : 'confidence-low';
        confidenceBadge.textContent = confidenceText;
        confidenceBadge.className = `confidence-badge ${confidenceClass}`;

        // Mostrar resumen
        const summary = document.getElementById('suggestions-summary');
        summary.innerHTML = `
            <div class="summary-stats">
                <div class="stat">
                    <span class="stat-label">📊 APUs Sugeridos:</span>
                    <span class="stat-value">${result.count}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">💰 Presupuesto Estimado:</span>
                    <span class="stat-value">${formatMoney(result.total_estimated)}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">🏗️ Tipo de Proyecto:</span>
                    <span class="stat-value">${result.project_type}</span>
                </div>
            </div>
            ${result.warnings && result.warnings.length > 0 ? `
                <div class="warnings">
                    ${result.warnings.map(w => `<p>⚠️ ${w}</p>`).join('')}
                </div>
            ` : ''}
            <p class="suggestions-intro">
                CLAUDIA analizó tu proyecto y sugiere las siguientes partidas.
                Puedes seleccionar cuáles agregar:
            </p>
        `;

        // Mostrar lista de APUs con checkboxes
        const listContainer = document.getElementById('suggestions-list');
        listContainer.innerHTML = `
            <div class="suggestions-actions">
                <button class="btn-link" onclick="toggleAllSuggestions(true)">✅ Seleccionar Todos</button>
                <span>|</span>
                <button class="btn-link" onclick="toggleAllSuggestions(false)">❌ Deseleccionar Todos</button>
            </div>
            <div class="apus-checklist">
                ${result.suggestions.map((sugg, idx) => `
                    <div class="apu-checkbox-item">
                        <input type="checkbox" id="apu-check-${idx}" checked>
                        <label for="apu-check-${idx}">
                            <div class="apu-info">
                                <div class="apu-name">${sugg.nombre}</div>
                                <div class="apu-details">
                                    <span class="apu-category">${sugg.categoria}</span>
                                    <span class="apu-quantity">${sugg.cantidad_estimada} ${sugg.unidad}</span>
                                    <span class="apu-price">${formatMoney(sugg.subtotal)}</span>
                                </div>
                                ${sugg.justificacion ? `
                                    <div class="apu-justification">💡 ${sugg.justificacion}</div>
                                ` : ''}
                            </div>
                        </label>
                    </div>
                `).join('')}
            </div>
        `;

    } catch (error) {
        console.error('Error generando sugerencias:', error);
        showToast('❌ Error generando sugerencias: ' + error.message);
        backToProjectInfo();
    }
}

function toggleAllSuggestions(checked) {
    const checkboxes = document.querySelectorAll('.apu-checkbox-item input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = checked);
}

function backToProjectInfo() {
    document.querySelector('.project-info-step').style.display = 'block';
    document.getElementById('ai-suggestions-container').style.display = 'none';
}

function createProjectWithSuggestions() {
    const name = document.getElementById('smart-project-name').value.trim();

    // Crear proyecto
    const newProject = createDefaultProject();
    newProject.name = name;

    // Agregar APUs seleccionados
    const checkboxes = document.querySelectorAll('.apu-checkbox-item input[type="checkbox"]');
    let addedCount = 0;

    checkboxes.forEach((checkbox, idx) => {
        if (checkbox.checked && window.currentAISuggestions && window.currentAISuggestions[idx]) {
            const sugg = window.currentAISuggestions[idx];
            newProject.activities.push({
                nombre: sugg.nombre,
                categoria: sugg.categoria,
                unidad: sugg.unidad,
                precio: sugg.precio_unitario,
                cantidad: sugg.cantidad_estimada
            });
            addedCount++;
        }
    });

    allProjects.push(newProject);
    currentProject = newProject;
    saveProjects();
    updateProjectSelector();

    closeSmartProjectModal();
    showToast(`✅ Proyecto creado con ${addedCount} APUs sugeridos por IA`);
}

console.log('✅ CLAUDIA Smart Project Creator cargado');

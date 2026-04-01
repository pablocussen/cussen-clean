/**
 * CLAUDIA v10.0 - Scenario Comparison
 *
 * Compare multiple project scenarios side-by-side
 * - Create alternative versions (budget, premium, custom)
 * - Compare costs, materials, timelines
 * - What-if analysis
 * - Export comparison reports
 *
 * Unique differentiator for CLAUDIA v10.0
 */

(function() {
    'use strict';

    // Stored scenarios
    let scenarios = [];
    let activeProject = null;

    /**
     * Initialize scenario comparison
     */
    function initScenarioComparison() {
        console.log('✓ Scenario Comparison initialized');
        loadScenariosFromStorage();
    }

    /**
     * Create scenario from current project
     */
    function createScenario(projectData, options = {}) {
        const scenario = {
            id: generateId(),
            name: options.name || `Escenario ${scenarios.length + 1}`,
            type: options.type || 'custom', // budget, standard, premium, custom
            created: new Date().toISOString(),
            project: JSON.parse(JSON.stringify(projectData)), // Deep clone
            adjustments: options.adjustments || {},
            notes: options.notes || ''
        };

        // Apply adjustments based on type
        if (options.type === 'budget') {
            applyBudgetAdjustments(scenario);
        } else if (options.type === 'premium') {
            applyPremiumAdjustments(scenario);
        }

        scenarios.push(scenario);
        saveScenariosToStorage();

        return scenario;
    }

    /**
     * Apply budget adjustments (cheaper materials)
     */
    function applyBudgetAdjustments(scenario) {
        scenario.project.activities.forEach(activity => {
            // Reduce material costs by 15-25%
            if (activity.materials) {
                activity.materials.forEach(material => {
                    const reduction = 0.15 + Math.random() * 0.10; // 15-25%
                    material.unit_price = material.unit_price * (1 - reduction);
                    material.note = `(Opción económica: -${(reduction * 100).toFixed(0)}%)`;
                });
            }

            // Recalculate subtotal
            activity.subtotal = calculateActivitySubtotal(activity);
        });

        scenario.notes = 'Escenario optimizado para presupuesto. Materiales de gama económica con buena relación calidad-precio.';
    }

    /**
     * Apply premium adjustments (higher quality materials)
     */
    function applyPremiumAdjustments(scenario) {
        scenario.project.activities.forEach(activity => {
            // Increase material costs by 20-35%
            if (activity.materials) {
                activity.materials.forEach(material => {
                    const increase = 0.20 + Math.random() * 0.15; // 20-35%
                    material.unit_price = material.unit_price * (1 + increase);
                    material.note = `(Opción premium: +${(increase * 100).toFixed(0)}%)`;
                });
            }

            // Recalculate subtotal
            activity.subtotal = calculateActivitySubtotal(activity);
        });

        scenario.notes = 'Escenario premium con materiales de alta calidad y mayor durabilidad.';
    }

    /**
     * Calculate activity subtotal
     */
    function calculateActivitySubtotal(activity) {
        if (!activity.materials) return 0;

        return activity.materials.reduce((sum, mat) => {
            return sum + (mat.unit_price * mat.quantity);
        }, 0);
    }

    /**
     * Open comparison modal
     */
    function openComparisonModal(projectData) {
        activeProject = projectData;

        // Create modal if doesn't exist
        if (!document.getElementById('scenario-comparison-modal')) {
            createComparisonModal();
        }

        // Show modal
        const modal = document.getElementById('scenario-comparison-modal');
        modal.style.display = 'block';

        // Refresh scenarios list
        refreshScenariosList();
    }

    /**
     * Create comparison modal
     */
    function createComparisonModal() {
        const modalHTML = `
            <div id="scenario-comparison-modal" class="scenario-modal" style="display:none;">
                <div class="scenario-modal-content">
                    <div class="scenario-header">
                        <h2>🔄 Comparar Escenarios</h2>
                        <button onclick="window.ClaudiaScenarios.close()" class="btn-close">✕</button>
                    </div>

                    <div class="scenario-actions">
                        <button onclick="window.ClaudiaScenarios.createNew('budget')" class="btn-scenario budget">
                            💰 Crear Escenario Económico
                        </button>
                        <button onclick="window.ClaudiaScenarios.createNew('premium')" class="btn-scenario premium">
                            ⭐ Crear Escenario Premium
                        </button>
                        <button onclick="window.ClaudiaScenarios.createNew('custom')" class="btn-scenario custom">
                            ⚙️ Crear Escenario Personalizado
                        </button>
                    </div>

                    <div id="scenarios-list" class="scenarios-list">
                        <p class="no-scenarios">No hay escenarios creados aún. Crea uno para comenzar.</p>
                    </div>

                    <div id="comparison-table" class="comparison-table" style="display:none;">
                        <!-- Comparison table rendered here -->
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        addScenarioStyles();
    }

    /**
     * Add scenario styles
     */
    function addScenarioStyles() {
        const styles = `
            <style id="scenario-comparison-styles">
                .scenario-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.8);
                    z-index: 10001;
                    overflow-y: auto;
                    padding: 20px;
                }

                .scenario-modal-content {
                    background: white;
                    border-radius: 10px;
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 30px;
                }

                .scenario-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                }

                .scenario-header h2 {
                    margin: 0;
                    color: #2c3e50;
                }

                .scenario-actions {
                    display: flex;
                    gap: 15px;
                    margin-bottom: 30px;
                    flex-wrap: wrap;
                }

                .btn-scenario {
                    flex: 1;
                    min-width: 200px;
                    padding: 15px 25px;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s;
                    color: white;
                }

                .btn-scenario.budget {
                    background: linear-gradient(135deg, #27ae60, #2ecc71);
                }

                .btn-scenario.premium {
                    background: linear-gradient(135deg, #e67e22, #f39c12);
                }

                .btn-scenario.custom {
                    background: linear-gradient(135deg, #3498db, #2980b9);
                }

                .btn-scenario:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 6px 12px rgba(0,0,0,0.2);
                }

                .scenarios-list {
                    margin: 30px 0;
                }

                .no-scenarios {
                    text-align: center;
                    color: #95a5a6;
                    padding: 40px;
                    font-style: italic;
                }

                .scenario-card {
                    background: #ecf0f1;
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 15px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: all 0.3s;
                    border-left: 4px solid #3498db;
                }

                .scenario-card:hover {
                    background: #d5dbdb;
                    transform: translateX(5px);
                }

                .scenario-card.budget {
                    border-left-color: #27ae60;
                }

                .scenario-card.premium {
                    border-left-color: #e67e22;
                }

                .scenario-info {
                    flex: 1;
                }

                .scenario-name {
                    font-size: 18px;
                    font-weight: bold;
                    color: #2c3e50;
                    margin-bottom: 5px;
                }

                .scenario-meta {
                    font-size: 14px;
                    color: #7f8c8d;
                }

                .scenario-cost {
                    font-size: 24px;
                    font-weight: bold;
                    color: #27ae60;
                    margin-right: 20px;
                }

                .scenario-actions-btns {
                    display: flex;
                    gap: 10px;
                }

                .btn-scenario-action {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    transition: all 0.3s;
                    font-size: 14px;
                }

                .btn-scenario-action.compare {
                    background: #3498db;
                    color: white;
                }

                .btn-scenario-action.delete {
                    background: #e74c3c;
                    color: white;
                }

                .btn-scenario-action:hover {
                    opacity: 0.8;
                }

                .comparison-table {
                    margin-top: 30px;
                    overflow-x: auto;
                }

                .comparison-table table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .comparison-table th,
                .comparison-table td {
                    border: 1px solid #ddd;
                    padding: 12px;
                    text-align: left;
                }

                .comparison-table th {
                    background: #34495e;
                    color: white;
                    font-weight: bold;
                }

                .comparison-table tr:nth-child(even) {
                    background: #f8f9fa;
                }

                .comparison-table tr:hover {
                    background: #e8f4f8;
                }

                .comparison-winner {
                    background: #d5f4e6 !important;
                    font-weight: bold;
                }

                @media (max-width: 768px) {
                    .scenario-actions {
                        flex-direction: column;
                    }

                    .btn-scenario {
                        width: 100%;
                    }

                    .scenario-card {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 15px;
                    }

                    .scenario-cost {
                        margin-right: 0;
                    }
                }
            </style>
        `;

        if (!document.getElementById('scenario-comparison-styles')) {
            document.head.insertAdjacentHTML('beforeend', styles);
        }
    }

    /**
     * Create new scenario
     */
    function createNewScenario(type) {
        if (!activeProject) {
            alert('No hay proyecto activo');
            return;
        }

        const names = {
            budget: 'Escenario Económico',
            premium: 'Escenario Premium',
            custom: 'Escenario Personalizado'
        };

        const scenario = createScenario(activeProject, {
            name: names[type] || 'Escenario Personalizado',
            type: type
        });

        refreshScenariosList();
        alert(`✓ Escenario "${scenario.name}" creado exitosamente`);
    }

    /**
     * Refresh scenarios list
     */
    function refreshScenariosList() {
        const listDiv = document.getElementById('scenarios-list');

        if (scenarios.length === 0) {
            listDiv.innerHTML = '<p class="no-scenarios">No hay escenarios creados aún. Crea uno para comenzar.</p>';
            return;
        }

        listDiv.innerHTML = scenarios.map(scenario => {
            const totalCost = scenario.project.activities.reduce((sum, act) => sum + (act.subtotal || 0), 0);

            return `
                <div class="scenario-card ${scenario.type}">
                    <div class="scenario-info">
                        <div class="scenario-name">${scenario.name}</div>
                        <div class="scenario-meta">
                            Tipo: ${scenario.type} | Creado: ${new Date(scenario.created).toLocaleDateString('es-CL')}
                        </div>
                        ${scenario.notes ? `<div class="scenario-meta" style="margin-top: 5px;">${scenario.notes}</div>` : ''}
                    </div>
                    <div class="scenario-cost">
                        $${totalCost.toLocaleString('es-CL')}
                    </div>
                    <div class="scenario-actions-btns">
                        <button onclick="window.ClaudiaScenarios.compare(['${scenario.id}'])" class="btn-scenario-action compare">
                            Comparar
                        </button>
                        <button onclick="window.ClaudiaScenarios.delete('${scenario.id}')" class="btn-scenario-action delete">
                            Eliminar
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Compare selected scenarios
     */
    function compareScenarios(scenarioIds) {
        if (!activeProject) {
            alert('No hay proyecto activo');
            return;
        }

        // Add current project as "Actual"
        const currentScenario = {
            id: 'current',
            name: 'Proyecto Actual',
            type: 'current',
            project: activeProject
        };

        const toCompare = [currentScenario, ...scenarios.filter(s => scenarioIds.includes(s.id))];

        if (toCompare.length < 2) {
            alert('Selecciona al menos un escenario para comparar');
            return;
        }

        renderComparisonTable(toCompare);
    }

    /**
     * Render comparison table
     */
    function renderComparisonTable(scenariosToCompare) {
        const tableDiv = document.getElementById('comparison-table');
        tableDiv.style.display = 'block';

        // Calculate metrics
        const metrics = scenariosToCompare.map(scenario => {
            const totalCost = scenario.project.activities.reduce((sum, act) => sum + (act.subtotal || 0), 0);
            const totalActivities = scenario.project.activities.length;
            const totalMaterials = scenario.project.activities.reduce((sum, act) => {
                if (act.materials) {
                    return sum + act.materials.reduce((mSum, mat) => mSum + (mat.quantity || 0), 0);
                }
                return sum;
            }, 0);

            return {
                name: scenario.name,
                totalCost,
                totalActivities,
                totalMaterials,
                type: scenario.type
            };
        });

        // Find winner (lowest cost)
        const minCost = Math.min(...metrics.map(m => m.totalCost));
        const winnerIndex = metrics.findIndex(m => m.totalCost === minCost);

        tableDiv.innerHTML = `
            <h3>📊 Comparación de Escenarios</h3>
            <table>
                <thead>
                    <tr>
                        <th>Métrica</th>
                        ${metrics.map(m => `<th>${m.name}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Costo Total</strong></td>
                        ${metrics.map((m, i) => `
                            <td class="${i === winnerIndex ? 'comparison-winner' : ''}">
                                $${m.totalCost.toLocaleString('es-CL')}
                                ${i === winnerIndex ? ' 🏆' : ''}
                            </td>
                        `).join('')}
                    </tr>
                    <tr>
                        <td><strong>Actividades</strong></td>
                        ${metrics.map(m => `<td>${m.totalActivities}</td>`).join('')}
                    </tr>
                    <tr>
                        <td><strong>Materiales</strong></td>
                        ${metrics.map(m => `<td>${Math.round(m.totalMaterials)}</td>`).join('')}
                    </tr>
                    <tr>
                        <td><strong>Diferencia vs Más Barato</strong></td>
                        ${metrics.map(m => {
                            const diff = m.totalCost - minCost;
                            const percentage = minCost > 0 ? (diff / minCost * 100).toFixed(1) : 0;
                            return `<td>+$${diff.toLocaleString('es-CL')} (+${percentage}%)</td>`;
                        }).join('')}
                    </tr>
                    <tr>
                        <td><strong>Tipo</strong></td>
                        ${metrics.map(m => `<td>${m.type}</td>`).join('')}
                    </tr>
                </tbody>
            </table>

            <div style="margin-top: 20px; padding: 15px; background: #d5f4e6; border-radius: 8px; border-left: 4px solid #27ae60;">
                <strong>💡 Recomendación:</strong><br>
                El escenario "${metrics[winnerIndex].name}" es el más económico con un costo de $${minCost.toLocaleString('es-CL')}.
                ${winnerIndex === 0 ? 'Tu proyecto actual ya es la opción más económica.' : 'Considera cambiar a este escenario para ahorrar.'}
            </div>
        `;
    }

    /**
     * Delete scenario
     */
    function deleteScenario(scenarioId) {
        if (!confirm('¿Eliminar este escenario?')) return;

        scenarios = scenarios.filter(s => s.id !== scenarioId);
        saveScenariosToStorage();
        refreshScenariosList();

        // Hide comparison table if empty
        if (scenarios.length === 0) {
            document.getElementById('comparison-table').style.display = 'none';
        }
    }

    /**
     * Close modal
     */
    function closeModal() {
        const modal = document.getElementById('scenario-comparison-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Generate unique ID
     */
    function generateId() {
        return 'scenario_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Storage functions
     */
    function saveScenariosToStorage() {
        try {
            localStorage.setItem('claudia_scenarios', JSON.stringify(scenarios));
        } catch (e) {
            console.error('Error saving scenarios:', e);
        }
    }

    function loadScenariosFromStorage() {
        try {
            const stored = localStorage.getItem('claudia_scenarios');
            if (stored) {
                scenarios = JSON.parse(stored);
            }
        } catch (e) {
            console.error('Error loading scenarios:', e);
            scenarios = [];
        }
    }

    // Export to global namespace
    window.ClaudiaScenarios = {
        init: initScenarioComparison,
        open: openComparisonModal,
        close: closeModal,
        createNew: createNewScenario,
        compare: compareScenarios,
        delete: deleteScenario
    };

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initScenarioComparison);
    } else {
        initScenarioComparison();
    }

})();

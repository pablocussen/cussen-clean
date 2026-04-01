/**
 * CLAUDIA v10.0 - Interactive Dashboard
 *
 * Visual analytics dashboard with Chart.js
 * - Project cost breakdown
 * - Category distribution
 * - Timeline visualization
 * - Savings tracker
 * - Material usage analytics
 *
 * Dependencies: Chart.js (loaded via CDN)
 */

(function() {
    'use strict';

    // Chart.js instances (for cleanup)
    const charts = {};

    /**
     * Initialize dashboard
     */
    function initDashboard() {
        // Load Chart.js if not already loaded
        if (typeof Chart === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';
            script.onload = () => {
                console.log('✓ Chart.js loaded');
                renderDashboard();
            };
            document.head.appendChild(script);
        } else {
            renderDashboard();
        }
    }

    /**
     * Render dashboard UI
     */
    function renderDashboard() {
        const dashboardHTML = `
            <div id="claudia-dashboard" class="dashboard-container" style="display:none;">
                <div class="dashboard-header">
                    <h2>📊 Dashboard de Proyecto</h2>
                    <button onclick="window.ClaudiaDashboard.close()" class="btn-close">✕</button>
                </div>

                <div class="dashboard-grid">
                    <!-- Summary Cards -->
                    <div class="dashboard-card summary-cards">
                        <div class="summary-card">
                            <div class="summary-icon">💰</div>
                            <div class="summary-content">
                                <div class="summary-label">Costo Total</div>
                                <div class="summary-value" id="total-cost">$0</div>
                            </div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-icon">📦</div>
                            <div class="summary-content">
                                <div class="summary-label">Actividades</div>
                                <div class="summary-value" id="total-activities">0</div>
                            </div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-icon">🛒</div>
                            <div class="summary-content">
                                <div class="summary-label">Materiales</div>
                                <div class="summary-value" id="total-materials">0</div>
                            </div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-icon">💡</div>
                            <div class="summary-content">
                                <div class="summary-label">Ahorro Potencial</div>
                                <div class="summary-value savings" id="potential-savings">$0</div>
                            </div>
                        </div>
                    </div>

                    <!-- Cost Breakdown Chart -->
                    <div class="dashboard-card">
                        <h3>Distribución por Categoría</h3>
                        <canvas id="category-chart" width="400" height="300"></canvas>
                    </div>

                    <!-- Timeline Chart -->
                    <div class="dashboard-card">
                        <h3>Evolución del Presupuesto</h3>
                        <canvas id="timeline-chart" width="400" height="300"></canvas>
                    </div>

                    <!-- Materials Chart -->
                    <div class="dashboard-card">
                        <h3>Top 10 Materiales Más Costosos</h3>
                        <canvas id="materials-chart" width="400" height="300"></canvas>
                    </div>

                    <!-- Cost vs Budget -->
                    <div class="dashboard-card">
                        <h3>Presupuesto vs Límite</h3>
                        <div id="budget-gauge"></div>
                        <canvas id="budget-chart" width="400" height="200"></canvas>
                    </div>

                    <!-- Insights -->
                    <div class="dashboard-card insights-card">
                        <h3>💡 Insights Inteligentes</h3>
                        <div id="ai-insights"></div>
                    </div>
                </div>
            </div>
        `;

        // Add to DOM if not exists
        if (!document.getElementById('claudia-dashboard')) {
            document.body.insertAdjacentHTML('beforeend', dashboardHTML);
            addDashboardStyles();
        }
    }

    /**
     * Add dashboard styles
     */
    function addDashboardStyles() {
        const styles = `
            <style id="claudia-dashboard-styles">
                .dashboard-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.8);
                    z-index: 10000;
                    overflow-y: auto;
                    padding: 20px;
                }

                .dashboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: white;
                    padding: 20px;
                    border-radius: 10px 10px 0 0;
                    margin-bottom: 20px;
                    max-width: 1400px;
                    margin-left: auto;
                    margin-right: auto;
                }

                .dashboard-header h2 {
                    margin: 0;
                    color: #2c3e50;
                }

                .btn-close {
                    background: #e74c3c;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    font-size: 24px;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .btn-close:hover {
                    background: #c0392b;
                    transform: rotate(90deg);
                }

                .dashboard-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
                    gap: 20px;
                    max-width: 1400px;
                    margin: 0 auto;
                }

                .dashboard-card {
                    background: white;
                    border-radius: 10px;
                    padding: 20px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }

                .dashboard-card h3 {
                    margin: 0 0 15px 0;
                    color: #2c3e50;
                    font-size: 18px;
                }

                .summary-cards {
                    grid-column: 1 / -1;
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    padding: 0;
                    background: transparent;
                    box-shadow: none;
                }

                .summary-card {
                    background: white;
                    border-radius: 10px;
                    padding: 20px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    transition: transform 0.3s;
                }

                .summary-card:hover {
                    transform: translateY(-5px);
                }

                .summary-icon {
                    font-size: 40px;
                }

                .summary-content {
                    flex: 1;
                }

                .summary-label {
                    font-size: 14px;
                    color: #7f8c8d;
                    margin-bottom: 5px;
                }

                .summary-value {
                    font-size: 28px;
                    font-weight: bold;
                    color: #2c3e50;
                }

                .summary-value.savings {
                    color: #27ae60;
                }

                .insights-card {
                    grid-column: 1 / -1;
                }

                #ai-insights {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .insight-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    padding: 15px;
                    background: #ecf0f1;
                    border-radius: 8px;
                    border-left: 4px solid #3498db;
                }

                .insight-icon {
                    font-size: 24px;
                }

                .insight-text {
                    flex: 1;
                    color: #2c3e50;
                    line-height: 1.6;
                }

                @media (max-width: 768px) {
                    .dashboard-grid {
                        grid-template-columns: 1fr;
                    }

                    .summary-cards {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
            </style>
        `;

        if (!document.getElementById('claudia-dashboard-styles')) {
            document.head.insertAdjacentHTML('beforeend', styles);
        }
    }

    /**
     * Open dashboard with project data
     */
    function openDashboard(projectData) {
        if (!projectData || !projectData.activities) {
            console.error('Invalid project data');
            return;
        }

        const dashboard = document.getElementById('claudia-dashboard');
        if (!dashboard) {
            initDashboard();
            setTimeout(() => openDashboard(projectData), 500);
            return;
        }

        // Show dashboard
        dashboard.style.display = 'block';

        // Update summary cards
        updateSummaryCards(projectData);

        // Render charts
        renderCategoryChart(projectData);
        renderTimelineChart(projectData);
        renderMaterialsChart(projectData);
        renderBudgetChart(projectData);

        // Generate insights
        generateInsights(projectData);
    }

    /**
     * Close dashboard
     */
    function closeDashboard() {
        const dashboard = document.getElementById('claudia-dashboard');
        if (dashboard) {
            dashboard.style.display = 'none';
        }

        // Destroy charts
        Object.keys(charts).forEach(key => {
            if (charts[key]) {
                charts[key].destroy();
                delete charts[key];
            }
        });
    }

    /**
     * Update summary cards
     */
    function updateSummaryCards(projectData) {
        const totalCost = projectData.activities.reduce((sum, act) => sum + (act.subtotal || 0), 0);
        const totalActivities = projectData.activities.length;

        // Calculate total materials (sum of quantities)
        const totalMaterials = projectData.activities.reduce((sum, act) => {
            if (act.materials) {
                return sum + act.materials.reduce((mSum, mat) => mSum + (mat.quantity || 0), 0);
            }
            return sum;
        }, 0);

        // Potential savings (estimate 10-15%)
        const potentialSavings = totalCost * 0.12;

        document.getElementById('total-cost').textContent =
            `$${totalCost.toLocaleString('es-CL')}`;
        document.getElementById('total-activities').textContent = totalActivities;
        document.getElementById('total-materials').textContent = Math.round(totalMaterials);
        document.getElementById('potential-savings').textContent =
            `$${potentialSavings.toLocaleString('es-CL')}`;
    }

    /**
     * Render category distribution chart (Doughnut)
     */
    function renderCategoryChart(projectData) {
        const ctx = document.getElementById('category-chart');
        if (!ctx) return;

        // Group by category
        const categoryTotals = {};
        projectData.activities.forEach(act => {
            const category = act.category || 'Sin categoría';
            categoryTotals[category] = (categoryTotals[category] || 0) + (act.subtotal || 0);
        });

        const labels = Object.keys(categoryTotals);
        const data = Object.values(categoryTotals);
        const colors = generateColors(labels.length);

        // Destroy previous chart
        if (charts.category) {
            charts.category.destroy();
        }

        charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'right',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: $${value.toLocaleString('es-CL')} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Render timeline chart (Line)
     */
    function renderTimelineChart(projectData) {
        const ctx = document.getElementById('timeline-chart');
        if (!ctx) return;

        // Cumulative cost over activities
        let cumulative = 0;
        const data = projectData.activities.map((act, index) => {
            cumulative += act.subtotal || 0;
            return {x: index + 1, y: cumulative};
        });

        if (charts.timeline) {
            charts.timeline.destroy();
        }

        charts.timeline = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Costo Acumulado',
                    data: data,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    x: {
                        title: {display: true, text: 'Actividad #'},
                        type: 'linear'
                    },
                    y: {
                        title: {display: true, text: 'Costo ($)'},
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString('es-CL');
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Costo acumulado: $' + context.parsed.y.toLocaleString('es-CL');
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Render materials chart (Bar - Top 10)
     */
    function renderMaterialsChart(projectData) {
        const ctx = document.getElementById('materials-chart');
        if (!ctx) return;

        // Aggregate materials
        const materialTotals = {};
        projectData.activities.forEach(act => {
            if (act.materials) {
                act.materials.forEach(mat => {
                    const name = mat.name || 'Sin nombre';
                    const cost = mat.unit_price * mat.quantity || 0;
                    materialTotals[name] = (materialTotals[name] || 0) + cost;
                });
            }
        });

        // Sort and get top 10
        const sorted = Object.entries(materialTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        const labels = sorted.map(([name]) => name.length > 30 ? name.substring(0, 30) + '...' : name);
        const data = sorted.map(([_, cost]) => cost);

        if (charts.materials) {
            charts.materials.destroy();
        }

        charts.materials = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Costo Total',
                    data: data,
                    backgroundColor: '#e74c3c',
                    borderColor: '#c0392b',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                indexAxis: 'y',
                scales: {
                    x: {
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString('es-CL');
                            }
                        }
                    }
                },
                plugins: {
                    legend: {display: false},
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Costo: $' + context.parsed.x.toLocaleString('es-CL');
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Render budget gauge chart
     */
    function renderBudgetChart(projectData) {
        const ctx = document.getElementById('budget-chart');
        if (!ctx) return;

        const totalCost = projectData.activities.reduce((sum, act) => sum + (act.subtotal || 0), 0);
        const budgetLimit = projectData.budget_limit || totalCost * 1.2; // 20% buffer if not set
        const remaining = Math.max(0, budgetLimit - totalCost);
        const percentage = (totalCost / budgetLimit * 100).toFixed(1);

        const data = [totalCost, remaining];
        const labels = ['Gastado', 'Disponible'];
        const colors = totalCost > budgetLimit ? ['#e74c3c', '#95a5a6'] : ['#3498db', '#2ecc71'];

        if (charts.budget) {
            charts.budget.destroy();
        }

        charts.budget = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                circumference: 180,
                rotation: -90,
                cutout: '75%',
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: $${context.parsed.toLocaleString('es-CL')} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        // Add gauge text
        const gaugeDiv = document.getElementById('budget-gauge');
        gaugeDiv.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 48px; font-weight: bold; color: ${totalCost > budgetLimit ? '#e74c3c' : '#27ae60'}">
                    ${percentage}%
                </div>
                <div style="font-size: 14px; color: #7f8c8d; margin-top: 10px;">
                    del presupuesto utilizado
                </div>
            </div>
        `;
    }

    /**
     * Generate AI insights
     */
    function generateInsights(projectData) {
        const insights = [];
        const totalCost = projectData.activities.reduce((sum, act) => sum + (act.subtotal || 0), 0);
        const totalActivities = projectData.activities.length;

        // Insight 1: Most expensive category
        const categoryTotals = {};
        projectData.activities.forEach(act => {
            const category = act.category || 'Sin categoría';
            categoryTotals[category] = (categoryTotals[category] || 0) + (act.subtotal || 0);
        });
        const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
        if (topCategory) {
            const percentage = (topCategory[1] / totalCost * 100).toFixed(1);
            insights.push({
                icon: '💰',
                text: `<strong>${topCategory[0]}</strong> representa el ${percentage}% de tu presupuesto ($${topCategory[1].toLocaleString('es-CL')}). Considera optimizar esta categoría para ahorrar.`
            });
        }

        // Insight 2: Budget status
        const budgetLimit = projectData.budget_limit || totalCost * 1.2;
        if (totalCost > budgetLimit * 0.9) {
            insights.push({
                icon: '⚠️',
                text: `Estás cerca del límite de presupuesto (${(totalCost / budgetLimit * 100).toFixed(1)}%). Revisa las actividades para evitar sobrecostos.`
            });
        } else if (totalCost < budgetLimit * 0.7) {
            insights.push({
                icon: '✅',
                text: `¡Excelente! Estás utilizando solo el ${(totalCost / budgetLimit * 100).toFixed(1)}% de tu presupuesto. Tienes margen para mejoras o imprevistos.`
            });
        }

        // Insight 3: Activity count
        if (totalActivities > 30) {
            insights.push({
                icon: '📋',
                text: `Tu proyecto tiene ${totalActivities} actividades. Considera agrupar actividades similares para mejor gestión.`
            });
        }

        // Insight 4: Savings potential
        const savingsPotential = totalCost * 0.12;
        insights.push({
            icon: '💡',
            text: `Potencial de ahorro estimado: <strong>$${savingsPotential.toLocaleString('es-CL')}</strong> (12%) comparando precios y optimizando materiales.`
            });

        // Insight 5: Material optimization
        insights.push({
            icon: '🔧',
            text: 'Tip: Compra materiales en bulk para actividades similares. Puedes ahorrar entre 5-15% en costos de materiales.'
        });

        // Render insights
        const insightsDiv = document.getElementById('ai-insights');
        insightsDiv.innerHTML = insights.map(insight => `
            <div class="insight-item">
                <div class="insight-icon">${insight.icon}</div>
                <div class="insight-text">${insight.text}</div>
            </div>
        `).join('');
    }

    /**
     * Generate colors for charts
     */
    function generateColors(count) {
        const baseColors = [
            '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
            '#1abc9c', '#34495e', '#e67e22', '#95a5a6', '#16a085'
        ];

        const colors = [];
        for (let i = 0; i < count; i++) {
            colors.push(baseColors[i % baseColors.length]);
        }
        return colors;
    }

    // Export to global namespace
    window.ClaudiaDashboard = {
        init: initDashboard,
        open: openDashboard,
        close: closeDashboard
    };

    // Auto-initialize on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDashboard);
    } else {
        initDashboard();
    }

})();

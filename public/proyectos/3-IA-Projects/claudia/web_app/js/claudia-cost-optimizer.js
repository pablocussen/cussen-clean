/**
 * CLAUDIA v6.1 - Optimizador de Costos Simplificado
 * Enfocado en AHORRO y GESTIÓN EFICIENTE para maestros
 * Reemplaza gráficos complejos con información clara y accionable
 */

(function() {
    'use strict';

    window.CostOptimizer = class {
        constructor() {
            this.initialized = false;
        }

        init() {
            if (this.initialized) return;
            console.log('💰 Cost Optimizer v8.0 - Optimizado');

            // Hook into project updates
            this.observeProjectChanges();
            this.initialized = true;
        }

        destroy() {
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }
            this.initialized = false;
        }

        observeProjectChanges() {
            // Use MutationObserver instead of setInterval for better performance
            const summary = document.getElementById('project-summary');
            if (!summary) return;

            // Observe changes to the summary element
            this.observer = new MutationObserver(() => {
                if (summary.style.display !== 'none') {
                    this.updateCostBreakdown();
                }
            });

            this.observer.observe(summary, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style']
            });

            // Initial update
            this.updateCostBreakdown();
        }

        updateCostBreakdown() {
            const container = document.getElementById('cost-breakdown-simple');
            if (!container) return;

            const projectData = this.getCurrentProjectData();
            if (!projectData || !projectData.activities || projectData.activities.length === 0) {
                container.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">Sin actividades para analizar</div>';
                return;
            }

            const analysis = this.analyzeCosts(projectData.activities);
            container.innerHTML = this.renderSimplifiedBreakdown(analysis);
        }

        getCurrentProjectData() {
            try {
                const projectName = document.getElementById('project-name')?.value || 'Mi Proyecto';
                const key = `claudia_project_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}`;
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : null;
            } catch (e) {
                return null;
            }
        }

        analyzeCosts(activities) {
            let total = 0;
            let materialsTotal = 0;
            let workforceTotal = 0;
            let equipmentTotal = 0;

            const categoryTotals = {};
            const topExpenses = [];

            activities.forEach(activity => {
                const cost = parseFloat(activity.precio_total || 0);
                total += cost;

                // Categorize by type (estimation)
                const name = (activity.nombre || '').toLowerCase();
                if (name.includes('material') || name.includes('arena') || name.includes('cemento') ||
                    name.includes('fierro') || name.includes('ladrillo') || name.includes('pintura')) {
                    materialsTotal += cost;
                } else if (name.includes('mano') || name.includes('jornal') || name.includes('maestro') || name.includes('ayudante')) {
                    workforceTotal += cost;
                } else if (name.includes('equip') || name.includes('maquina') || name.includes('herramienta')) {
                    equipmentTotal += cost;
                } else {
                    workforceTotal += cost; // Default to workforce
                }

                // Category totals
                const cat = activity.categoria || 'OTROS';
                if (!categoryTotals[cat]) categoryTotals[cat] = 0;
                categoryTotals[cat] += cost;

                // Track expenses
                topExpenses.push({
                    name: activity.nombre,
                    cost: cost,
                    unit: activity.unidad,
                    quantity: activity.cantidad
                });
            });

            // Sort top expenses
            topExpenses.sort((a, b) => b.cost - a.cost);

            // Find savings opportunities
            const savingsOpportunities = this.findSavingsOpportunities(activities, categoryTotals);

            return {
                total,
                materialsTotal,
                workforceTotal,
                equipmentTotal,
                categoryTotals,
                topExpenses: topExpenses.slice(0, 5),
                savingsOpportunities,
                activitiesCount: activities.length
            };
        }

        findSavingsOpportunities(activities, categoryTotals) {
            const opportunities = [];

            // Opportunity 1: Check for expensive materials
            const expensiveMaterials = activities.filter(a => {
                const cost = parseFloat(a.precio_total || 0);
                return cost > 500000 && (a.nombre || '').toLowerCase().includes('material');
            });

            if (expensiveMaterials.length > 0) {
                const totalExpensive = expensiveMaterials.reduce((sum, a) => sum + parseFloat(a.precio_total || 0), 0);
                opportunities.push({
                    type: 'materials',
                    icon: '🏗️',
                    title: 'Materiales Costosos',
                    message: `${expensiveMaterials.length} materiales superan $500k`,
                    potentialSaving: Math.round(totalExpensive * 0.15), // 15% potential
                    action: 'Compara precios en diferentes proveedores'
                });
            }

            // Opportunity 2: Check for duplicate categories
            const categories = Object.keys(categoryTotals);
            if (categories.length > 8) {
                opportunities.push({
                    type: 'organization',
                    icon: '📋',
                    title: 'Muchas Categorías',
                    message: `${categories.length} categorías diferentes`,
                    potentialSaving: 0,
                    action: 'Consolida actividades similares'
                });
            }

            // Opportunity 3: Round numbers optimization
            const hasOddQuantities = activities.some(a => {
                const qty = parseFloat(a.cantidad || 0);
                return qty > 0 && qty < 1 && qty !== 0.5;
            });

            if (hasOddQuantities) {
                opportunities.push({
                    type: 'quantities',
                    icon: '📏',
                    title: 'Cantidades Ajustables',
                    message: 'Hay cantidades decimales pequeñas',
                    potentialSaving: 0,
                    action: 'Redondea para comprar paquetes completos'
                });
            }

            // Opportunity 4: Bulk discount potential
            if (activities.length > 10) {
                const bulkTotal = Math.round(total * 0.10); // 10% bulk discount
                opportunities.push({
                    type: 'bulk',
                    icon: '💵',
                    title: 'Descuento por Volumen',
                    message: 'Proyecto grande con muchas actividades',
                    potentialSaving: bulkTotal,
                    action: 'Negocia descuento por compra completa'
                });
            }

            return opportunities;
        }

        renderSimplifiedBreakdown(analysis) {
            const { total, materialsTotal, workforceTotal, topExpenses, savingsOpportunities } = analysis;

            let html = '';

            // Total Breakdown
            html += `
                <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <span style="font-weight: 600; font-size: 14px;">🏗️ Materiales y Obra</span>
                        <span style="font-weight: 700; font-size: 16px; color: #10b981;">${this.formatMoney(materialsTotal + workforceTotal)}</span>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px;">
                        <div>
                            <span style="color: #666;">Materiales:</span>
                            <span style="font-weight: 600; color: #333; margin-left: 5px;">${this.formatMoney(materialsTotal)}</span>
                        </div>
                        <div>
                            <span style="color: #666;">Mano de Obra:</span>
                            <span style="font-weight: 600; color: #333; margin-left: 5px;">${this.formatMoney(workforceTotal)}</span>
                        </div>
                    </div>
                </div>
            `;

            // Top 3 Expenses
            if (topExpenses.length > 0) {
                html += `
                    <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                        <div style="font-weight: 600; font-size: 14px; margin-bottom: 10px;">💸 Gastos Principales</div>
                        ${topExpenses.slice(0, 3).map((exp, i) => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                                <div style="flex: 1; font-size: 12px;">
                                    <span style="color: #f59e0b; font-weight: 700;">${i + 1}.</span>
                                    <span style="color: #333;">${this.truncate(exp.name, 25)}</span>
                                </div>
                                <div style="font-weight: 700; font-size: 13px; color: #f59e0b;">${this.formatMoney(exp.cost)}</div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }

            // Savings Opportunities
            if (savingsOpportunities.length > 0) {
                const totalSavings = savingsOpportunities.reduce((sum, opp) => sum + (opp.potentialSaving || 0), 0);

                html += `
                    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 15px; border-radius: 8px; border: 2px solid #f59e0b;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                            <span style="font-size: 20px;">💡</span>
                            <div style="flex: 1;">
                                <div style="font-weight: 700; font-size: 14px; color: #92400e;">Oportunidades de Ahorro</div>
                                ${totalSavings > 0 ? `<div style="font-size: 12px; color: #92400e;">Ahorro potencial: <strong>${this.formatMoney(totalSavings)}</strong></div>` : ''}
                            </div>
                        </div>
                        <div style="display: grid; gap: 8px;">
                            ${savingsOpportunities.slice(0, 3).map(opp => `
                                <div style="background: white; padding: 10px; border-radius: 6px; font-size: 12px;">
                                    <div style="font-weight: 600; color: #333; margin-bottom: 4px;">
                                        ${opp.icon} ${opp.title}
                                    </div>
                                    <div style="color: #666; margin-bottom: 4px;">${opp.message}</div>
                                    <div style="color: #10b981; font-weight: 600;">→ ${opp.action}</div>
                                    ${opp.potentialSaving > 0 ? `<div style="color: #f59e0b; font-weight: 700; margin-top: 4px;">Ahorro: ${this.formatMoney(opp.potentialSaving)}</div>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            return html;
        }

        formatMoney(amount) {
            return '$' + Math.round(amount).toLocaleString('es-CL');
        }

        truncate(str, length) {
            if (!str) return '';
            return str.length > length ? str.substring(0, length) + '...' : str;
        }
    };

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.costOptimizer = new CostOptimizer();
            window.costOptimizer.init();
        });
    } else {
        window.costOptimizer = new CostOptimizer();
        window.costOptimizer.init();
    }

    console.log('💰 Cost Optimizer v8.0 loaded - OPTIMIZADO CON MUTATIONOBSERVER');
})();

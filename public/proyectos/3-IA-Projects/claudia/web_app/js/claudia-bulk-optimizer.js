/**
 * CLAUDIA v6.6 - Bulk Purchase Optimizer
 * Detecta oportunidades de compra al por mayor y descuentos por volumen
 * Maximiza ahorro mediante recomendaciones de cantidad óptima
 */

(function() {
    'use strict';

    window.BulkOptimizer = class {
        constructor() {
            this.initialized = false;
            this.bulkRules = this.loadBulkRules();
        }

        init() {
            if (this.initialized) return;

            console.log('📦 Bulk Purchase Optimizer v6.6');

            // Integrate with Smart Shopping
            this.integrateWithSmartShopping();

            // Add bulk analysis button
            this.addBulkAnalysisButton();

            this.initialized = true;
        }

        loadBulkRules() {
            // Reglas comunes de descuento por volumen en construcción
            return {
                'cemento': [
                    { minQty: 10, discount: 0.05, note: 'Descuento 5% por pallet (10+ sacos)' },
                    { minQty: 50, discount: 0.12, note: 'Descuento 12% por pallet completo (50 sacos)' },
                    { minQty: 100, discount: 0.18, note: 'Descuento 18% por camión (100+ sacos)' }
                ],
                'fierro': [
                    { minQty: 20, discount: 0.08, note: 'Descuento 8% por atado (20+ varillas)' },
                    { minQty: 100, discount: 0.15, note: 'Descuento 15% por tonelada (100+ varillas)' }
                ],
                'arena': [
                    { minQty: 5, discount: 0.10, note: 'Descuento 10% por camión (5+ m³)' },
                    { minQty: 10, discount: 0.15, note: 'Descuento 15% por camión grande (10+ m³)' }
                ],
                'ripio': [
                    { minQty: 5, discount: 0.10, note: 'Descuento 10% por camión (5+ m³)' },
                    { minQty: 10, discount: 0.15, note: 'Descuento 15% por camión grande (10+ m³)' }
                ],
                'ladrillo': [
                    { minQty: 500, discount: 0.08, note: 'Descuento 8% por pallet (500+ ladrillos)' },
                    { minQty: 1000, discount: 0.12, note: 'Descuento 12% por pallet completo (1000+ ladrillos)' }
                ],
                'pintura': [
                    { minQty: 4, discount: 0.10, note: 'Descuento 10% por caja (4+ galones)' },
                    { minQty: 12, discount: 0.15, note: 'Descuento 15% por caja master (12+ galones)' }
                ],
                'default': [
                    { minQty: 10, discount: 0.05, note: 'Descuento 5% por volumen (10+ unidades)' },
                    { minQty: 50, discount: 0.10, note: 'Descuento 10% por volumen (50+ unidades)' },
                    { minQty: 100, discount: 0.15, note: 'Descuento 15% por volumen (100+ unidades)' }
                ]
            };
        }

        getBulkRulesForMaterial(materialName) {
            const name = materialName.toLowerCase();

            // Match specific material types
            if (name.includes('cemento')) return this.bulkRules['cemento'];
            if (name.includes('fierro') || name.includes('varilla')) return this.bulkRules['fierro'];
            if (name.includes('arena')) return this.bulkRules['arena'];
            if (name.includes('ripio') || name.includes('gravilla')) return this.bulkRules['ripio'];
            if (name.includes('ladrillo') || name.includes('bloque')) return this.bulkRules['ladrillo'];
            if (name.includes('pintura') || name.includes('esmalte')) return this.bulkRules['pintura'];

            return this.bulkRules['default'];
        }

        analyzeBulkOpportunities(activities) {
            const opportunities = [];

            activities.forEach(activity => {
                const rules = this.getBulkRulesForMaterial(activity.name);
                const currentQty = activity.quantity;
                const unitPrice = activity.estimatedUnitPrice || activity.unitPrice || 0;

                // Check each bulk discount tier
                rules.forEach(rule => {
                    if (currentQty < rule.minQty) {
                        // Usuario no alcanza este nivel de descuento
                        const additionalQty = rule.minQty - currentQty;
                        const discountAmount = unitPrice * rule.minQty * rule.discount;
                        const extraCost = unitPrice * additionalQty;
                        const netSavings = discountAmount - extraCost;

                        if (netSavings > 0) {
                            opportunities.push({
                                material: activity.name,
                                currentQty: currentQty,
                                recommendedQty: rule.minQty,
                                additionalQty: additionalQty,
                                currentUnitPrice: unitPrice,
                                discountedUnitPrice: unitPrice * (1 - rule.discount),
                                discount: rule.discount,
                                discountPercent: Math.round(rule.discount * 100),
                                extraCost: extraCost,
                                totalSavings: discountAmount,
                                netSavings: netSavings,
                                note: rule.note,
                                roi: netSavings / extraCost, // Return on investment
                                priority: this.calculatePriority(netSavings, rule.discount)
                            });
                        }
                    } else {
                        // Usuario ya está en este nivel, mostrar como beneficio
                        const savingsFromDiscount = unitPrice * currentQty * rule.discount;

                        opportunities.push({
                            material: activity.name,
                            currentQty: currentQty,
                            recommendedQty: currentQty,
                            additionalQty: 0,
                            currentUnitPrice: unitPrice,
                            discountedUnitPrice: unitPrice * (1 - rule.discount),
                            discount: rule.discount,
                            discountPercent: Math.round(rule.discount * 100),
                            extraCost: 0,
                            totalSavings: savingsFromDiscount,
                            netSavings: savingsFromDiscount,
                            note: rule.note,
                            alreadyOptimal: true,
                            priority: 0
                        });
                    }
                });
            });

            // Sort by priority (best opportunities first)
            return opportunities.sort((a, b) => b.priority - a.priority);
        }

        calculatePriority(netSavings, discount) {
            // Higher priority = better opportunity
            // Consider both absolute savings and discount percentage
            return (netSavings * 0.7) + (discount * 100000 * 0.3);
        }

        addBulkAnalysisButton() {
            let attempts = 0;
            const maxAttempts = 30; // 30 seconds max

            const checkInterval = setInterval(() => {
                attempts++;

                if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    console.log('📦 Bulk Optimizer: Timeout waiting for elements');
                    return;
                }

                const projectDetails = document.getElementById('project-details');
                if (projectDetails && !document.getElementById('bulk-analysis-btn')) {
                    clearInterval(checkInterval);

                    const smartShoppingBtn = document.getElementById('smart-shopping-btn');
                    if (!smartShoppingBtn) return;

                    // Add button after smart shopping
                    const btnContainer = document.createElement('div');
                    btnContainer.style.cssText = 'margin: 10px 0; text-align: center;';

                    btnContainer.innerHTML = `
                        <button id="bulk-analysis-btn" style="
                            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                            color: white;
                            border: none;
                            padding: 14px 28px;
                            border-radius: 10px;
                            font-size: 15px;
                            font-weight: 600;
                            cursor: pointer;
                            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
                            transition: transform 0.2s, box-shadow 0.2s;
                            display: inline-flex;
                            align-items: center;
                            gap: 10px;
                        ">
                            <span style="font-size: 22px;">📦</span>
                            <span>Analizar Descuentos por Volumen</span>
                            <span style="font-size: 18px;">💰</span>
                        </button>
                    `;

                    smartShoppingBtn.parentNode.parentNode.insertBefore(btnContainer, smartShoppingBtn.parentNode.nextSibling);

                    const btn = document.getElementById('bulk-analysis-btn');
                    btn.onmouseover = () => {
                        btn.style.transform = 'translateY(-2px)';
                        btn.style.boxShadow = '0 6px 20px rgba(245, 158, 11, 0.4)';
                    };
                    btn.onmouseout = () => {
                        btn.style.transform = 'translateY(0)';
                        btn.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)';
                    };

                    btn.onclick = () => this.showBulkAnalysis();
                }
            }, 1000);
        }

        showBulkAnalysis() {
            // Get activities
            const activities = this.getProjectActivities();

            if (activities.length === 0) {
                this.showNotification('⚠️ No hay actividades', 'Agrega materiales primero', 'warning');
                return;
            }

            // Analyze opportunities
            const opportunities = this.analyzeBulkOpportunities(activities);

            // Display results
            this.displayBulkOpportunities(opportunities);
        }

        getProjectActivities() {
            const activities = [];
            const activityElements = document.querySelectorAll('.project-activity-item');

            activityElements.forEach((element, index) => {
                const nameEl = element.querySelector('.project-activity-name');
                const quantityEl = element.querySelector('.project-activity-quantity');
                const priceEl = element.querySelector('.project-activity-price');

                if (nameEl && quantityEl && priceEl) {
                    const name = nameEl.textContent.trim();
                    const quantity = parseFloat(quantityEl.textContent) || 1;
                    const unitPrice = this.parsePrice(priceEl.textContent);

                    activities.push({
                        id: index,
                        name: name,
                        quantity: quantity,
                        estimatedUnitPrice: unitPrice
                    });
                }
            });

            return activities;
        }

        parsePrice(priceText) {
            const cleaned = priceText.replace(/[^\d]/g, '');
            return parseInt(cleaned) || 0;
        }

        displayBulkOpportunities(opportunities) {
            const modal = document.createElement('div');
            modal.id = 'bulk-opportunities-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                z-index: 10003;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 20px;
                overflow-y: auto;
            `;

            modal.onclick = (e) => {
                if (e.target === modal) modal.remove();
            };

            // Separate opportunities by type
            const activeOpportunities = opportunities.filter(o => !o.alreadyOptimal && o.netSavings > 0);
            const currentOptimal = opportunities.filter(o => o.alreadyOptimal);

            // Calculate totals
            const totalPotentialSavings = activeOpportunities.reduce((sum, o) => sum + o.netSavings, 0);
            const totalCurrentSavings = currentOptimal.reduce((sum, o) => sum + o.totalSavings, 0);

            modal.innerHTML = `
                <div style="background: white; padding: 30px; border-radius: 16px; max-width: 1000px; width: 100%; max-height: 90vh; overflow-y: auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2 style="margin: 0; font-size: 24px; display: flex; align-items: center; gap: 12px;">
                            <span>📦</span>
                            <span>Análisis de Descuentos por Volumen</span>
                        </h2>
                        <button onclick="this.closest('#bulk-opportunities-modal').remove()" style="
                            background: #ef4444;
                            color: white;
                            border: none;
                            width: 36px;
                            height: 36px;
                            border-radius: 50%;
                            cursor: pointer;
                            font-size: 20px;
                        ">✕</button>
                    </div>

                    <!-- Summary Cards -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;">
                        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 12px; color: white;">
                            <div style="font-size: 13px; opacity: 0.9; margin-bottom: 5px;">💰 AHORRO POTENCIAL</div>
                            <div style="font-size: 28px; font-weight: 800;">$${totalPotentialSavings.toLocaleString('es-CL')}</div>
                            <div style="font-size: 12px; opacity: 0.85; margin-top: 5px;">Comprando en volumen óptimo</div>
                        </div>
                        <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 20px; border-radius: 12px; color: white;">
                            <div style="font-size: 13px; opacity: 0.9; margin-bottom: 5px;">✅ YA AHORRANDO</div>
                            <div style="font-size: 28px; font-weight: 800;">$${totalCurrentSavings.toLocaleString('es-CL')}</div>
                            <div style="font-size: 12px; opacity: 0.85; margin-top: 5px;">En ${currentOptimal.length} materiales optimizados</div>
                        </div>
                    </div>

                    ${activeOpportunities.length > 0 ? `
                        <!-- Active Opportunities -->
                        <div style="margin-bottom: 25px;">
                            <h3 style="font-size: 18px; margin-bottom: 15px; color: #333; display: flex; align-items: center; gap: 8px;">
                                <span>🎯</span>
                                <span>Oportunidades de Ahorro (${activeOpportunities.length})</span>
                            </h3>

                            ${activeOpportunities.slice(0, 10).map((opp, i) => `
                                <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 2px solid #f59e0b; padding: 20px; border-radius: 12px; margin-bottom: 15px;">
                                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                                        <div style="flex: 1;">
                                            <div style="font-size: 16px; font-weight: 700; color: #92400e; margin-bottom: 5px;">
                                                ${opp.material}
                                            </div>
                                            <div style="font-size: 13px; color: #78350f;">
                                                ${opp.note}
                                            </div>
                                        </div>
                                        <div style="background: #f59e0b; color: white; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 14px;">
                                            -${opp.discountPercent}%
                                        </div>
                                    </div>

                                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; padding: 15px; background: white; border-radius: 8px; margin-bottom: 12px;">
                                        <div>
                                            <div style="font-size: 11px; color: #6b7280; margin-bottom: 3px;">Cantidad Actual</div>
                                            <div style="font-size: 18px; font-weight: 700; color: #1f2937;">${opp.currentQty}</div>
                                        </div>
                                        <div>
                                            <div style="font-size: 11px; color: #6b7280; margin-bottom: 3px;">Cantidad Recomendada</div>
                                            <div style="font-size: 18px; font-weight: 700; color: #10b981;">${opp.recommendedQty}</div>
                                            <div style="font-size: 11px; color: #10b981;">(+${opp.additionalQty} unidades)</div>
                                        </div>
                                        <div>
                                            <div style="font-size: 11px; color: #6b7280; margin-bottom: 3px;">Ahorro Neto</div>
                                            <div style="font-size: 18px; font-weight: 700; color: #10b981;">$${opp.netSavings.toLocaleString('es-CL')}</div>
                                        </div>
                                    </div>

                                    <div style="background: #f0fdf4; padding: 12px; border-radius: 8px; border-left: 4px solid #10b981;">
                                        <div style="font-size: 12px; color: #166534; font-weight: 600; margin-bottom: 5px;">💡 Análisis:</div>
                                        <div style="font-size: 12px; color: #166534;">
                                            Comprando ${opp.additionalQty} unidades más por $${opp.extraCost.toLocaleString('es-CL')},
                                            obtienes ${opp.discountPercent}% de descuento en las ${opp.recommendedQty} unidades,
                                            ahorrando <strong>$${opp.totalSavings.toLocaleString('es-CL')}</strong>.
                                            <br>
                                            <strong>Ahorro neto: $${opp.netSavings.toLocaleString('es-CL')}</strong>
                                            (ROI: ${Math.round(opp.roi * 100)}%)
                                        </div>
                                    </div>
                                </div>
                            `).join('')}

                            ${activeOpportunities.length > 10 ? `
                                <div style="text-align: center; padding: 15px; background: #f3f4f6; border-radius: 8px; font-size: 13px; color: #6b7280;">
                                    ... y ${activeOpportunities.length - 10} oportunidades más
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}

                    ${currentOptimal.length > 0 ? `
                        <!-- Already Optimal -->
                        <div>
                            <h3 style="font-size: 18px; margin-bottom: 15px; color: #333; display: flex; align-items: center; gap: 8px;">
                                <span>✅</span>
                                <span>Ya Optimizados (${currentOptimal.length})</span>
                            </h3>

                            <div style="display: grid; gap: 10px;">
                                ${currentOptimal.slice(0, 5).map(opp => `
                                    <div style="background: #f0fdf4; border: 2px solid #10b981; padding: 15px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
                                        <div>
                                            <div style="font-weight: 600; font-size: 14px; color: #166534; margin-bottom: 3px;">
                                                ${opp.material}
                                            </div>
                                            <div style="font-size: 12px; color: #166534;">
                                                ${opp.note} - Ahorrando $${opp.totalSavings.toLocaleString('es-CL')}
                                            </div>
                                        </div>
                                        <div style="background: #10b981; color: white; padding: 6px 12px; border-radius: 6px; font-weight: 700; font-size: 13px;">
                                            -${opp.discountPercent}%
                                        </div>
                                    </div>
                                `).join('')}

                                ${currentOptimal.length > 5 ? `
                                    <div style="text-align: center; padding: 10px; background: #f3f4f6; border-radius: 8px; font-size: 12px; color: #6b7280;">
                                        ... y ${currentOptimal.length - 5} materiales más
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    ` : ''}

                    ${activeOpportunities.length === 0 && currentOptimal.length === 0 ? `
                        <div style="text-align: center; padding: 40px; background: #f9fafb; border-radius: 12px;">
                            <div style="font-size: 48px; margin-bottom: 15px;">📦</div>
                            <div style="font-size: 18px; font-weight: 600; color: #6b7280; margin-bottom: 10px;">
                                No se detectaron oportunidades de descuento por volumen
                            </div>
                            <div style="font-size: 14px; color: #9ca3af;">
                                Las cantidades actuales no califican para descuentos especiales
                            </div>
                        </div>
                    ` : ''}

                    <div style="margin-top: 25px; padding: 15px; background: #fef3c7; border-radius: 8px; border: 2px solid #fbbf24; text-align: center; font-size: 13px; color: #92400e;">
                        💡 <strong>Tip:</strong> Los descuentos por volumen pueden variar según proveedor. Pregunta siempre antes de comprar.
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
        }

        integrateWithSmartShopping() {
            // Hook into smart shopping to add bulk recommendations
            const originalSmartShopping = window.SmartShopping;
            if (!originalSmartShopping) return;

            // We'll add bulk info to the shopping list in future iterations
            console.log('🔗 Bulk optimizer ready to integrate with Smart Shopping');
        }

        showNotification(title, message, type) {
            if (window.notificationManager) {
                window.notificationManager.showToast(title, message, type, 5000);
            } else {
                alert(`${title}\n${message}`);
            }
        }
    };

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.bulkOptimizer = new window.BulkOptimizer();
            setTimeout(() => window.bulkOptimizer.init(), 2500);
        });
    } else {
        window.bulkOptimizer = new window.BulkOptimizer();
        setTimeout(() => window.bulkOptimizer.init(), 2500);
    }

})();

/**
 * CLAUDIA v6.5 - Smart Shopping List
 * Lista de compras inteligente que recomienda dónde comprar cada material
 * para maximizar el ahorro total del proyecto
 */

(function() {
    'use strict';

    window.SmartShopping = class {
        constructor() {
            this.initialized = false;
            this.shoppingPlan = null;
            this.materialPrices = {};
        }

        init() {
            if (this.initialized) return;

            console.log('🛒 Smart Shopping List v6.5');

            // Add "Generar Lista Inteligente" button
            this.addSmartShoppingButton();

            this.initialized = true;
        }

        addSmartShoppingButton() {
            // Wait for project details to be available
            let attempts = 0;
            const maxAttempts = 30; // 30 seconds max

            const checkInterval = setInterval(() => {
                attempts++;

                if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    console.log('🛒 Smart Shopping: Timeout waiting for elements');
                    return;
                }

                const projectDetails = document.getElementById('project-details');
                if (projectDetails && !document.getElementById('smart-shopping-btn')) {
                    clearInterval(checkInterval);

                    const activitiesContainer = document.querySelector('.project-activities-container');
                    if (!activitiesContainer) return;

                    // Add button before activities
                    const btnContainer = document.createElement('div');
                    btnContainer.style.cssText = 'margin: 20px 0; text-align: center;';

                    btnContainer.innerHTML = `
                        <button id="smart-shopping-btn" style="
                            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
                            color: white;
                            border: none;
                            padding: 16px 32px;
                            border-radius: 12px;
                            font-size: 16px;
                            font-weight: 700;
                            cursor: pointer;
                            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
                            transition: transform 0.2s, box-shadow 0.2s;
                            display: inline-flex;
                            align-items: center;
                            gap: 12px;
                        ">
                            <span style="font-size: 24px;">🛒</span>
                            <span>Generar Lista de Compras Inteligente</span>
                            <span style="font-size: 20px;">✨</span>
                        </button>
                    `;

                    activitiesContainer.parentNode.insertBefore(btnContainer, activitiesContainer);

                    // Add hover effect
                    const btn = document.getElementById('smart-shopping-btn');
                    btn.onmouseover = () => {
                        btn.style.transform = 'translateY(-2px)';
                        btn.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.4)';
                    };
                    btn.onmouseout = () => {
                        btn.style.transform = 'translateY(0)';
                        btn.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
                    };

                    // Add click handler
                    btn.onclick = () => this.generateSmartShoppingList();
                }
            }, 1000);
        }

        async generateSmartShoppingList() {
            const btn = document.getElementById('smart-shopping-btn');
            if (!btn) return;

            // Show loading
            btn.innerHTML = `
                <span style="font-size: 24px;">⏳</span>
                <span>Analizando precios en 6 proveedores...</span>
            `;
            btn.disabled = true;
            btn.style.opacity = '0.7';

            // Get all activities
            const activities = this.getProjectActivities();
            if (activities.length === 0) {
                this.showNotification('⚠️ No hay actividades en el proyecto', 'Agrega materiales primero', 'warning');
                this.resetButton(btn);
                return;
            }

            // Get prices for all materials
            const priceData = await this.fetchAllPrices(activities);

            // Generate optimal shopping plan
            this.shoppingPlan = this.optimizeShoppingPlan(priceData, activities);

            // Reset button
            this.resetButton(btn);

            // Show smart shopping list
            this.displaySmartShoppingList();
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
                        estimatedUnitPrice: unitPrice,
                        estimatedTotal: unitPrice * quantity
                    });
                }
            });

            return activities;
        }

        parsePrice(priceText) {
            const cleaned = priceText.replace(/[^\d]/g, '');
            return parseInt(cleaned) || 0;
        }

        async fetchAllPrices(activities) {
            const priceData = [];

            for (const activity of activities) {
                // Show progress
                this.updateProgress(activity.name, activities.indexOf(activity) + 1, activities.length);

                try {
                    // Use PriceComparison module if available
                    if (window.priceComparison) {
                        const comparison = await window.priceComparison.comparePrices(activity.name);
                        priceData.push({
                            activity: activity,
                            comparison: comparison
                        });
                    } else {
                        // Fallback: use estimated price
                        priceData.push({
                            activity: activity,
                            comparison: null
                        });
                    }

                    // Small delay to avoid overwhelming the API
                    await this.sleep(500);
                } catch (error) {
                    console.error(`Error fetching price for ${activity.name}:`, error);
                    priceData.push({
                        activity: activity,
                        comparison: null
                    });
                }
            }

            return priceData;
        }

        updateProgress(materialName, current, total) {
            const btn = document.getElementById('smart-shopping-btn');
            if (!btn) return;

            const percent = Math.round((current / total) * 100);
            btn.innerHTML = `
                <span style="font-size: 24px;">🔍</span>
                <span>Comparando "${materialName.substring(0, 20)}..." (${current}/${total})</span>
                <span>${percent}%</span>
            `;
        }

        optimizeShoppingPlan(priceData, activities) {
            const plan = {
                byProvider: {},
                totalEstimated: 0,
                totalOptimized: 0,
                totalSavings: 0,
                itemCount: activities.length
            };

            // Initialize providers
            const providers = ['Sodimac', 'Easy', 'Homecenter', 'Constructor', 'Imperial', 'Hites'];
            providers.forEach(p => {
                plan.byProvider[p] = {
                    name: p,
                    logo: this.getProviderLogo(p),
                    items: [],
                    total: 0
                };
            });

            // Assign each material to best provider
            priceData.forEach(data => {
                const activity = data.activity;
                const comparison = data.comparison;

                plan.totalEstimated += activity.estimatedTotal;

                if (comparison && comparison.found && comparison.results && comparison.results.length > 0) {
                    // Use best price from comparison
                    const bestPrice = comparison.results[0];
                    const providerName = bestPrice.store;
                    const itemTotal = bestPrice.price * activity.quantity;

                    plan.byProvider[providerName].items.push({
                        name: activity.name,
                        quantity: activity.quantity,
                        unitPrice: bestPrice.price,
                        total: itemTotal,
                        estimatedUnitPrice: activity.estimatedUnitPrice,
                        savings: (activity.estimatedUnitPrice - bestPrice.price) * activity.quantity
                    });

                    plan.byProvider[providerName].total += itemTotal;
                    plan.totalOptimized += itemTotal;
                } else {
                    // Fallback to estimated price (assign to "Sodimac" as default)
                    const defaultProvider = 'Sodimac';
                    plan.byProvider[defaultProvider].items.push({
                        name: activity.name,
                        quantity: activity.quantity,
                        unitPrice: activity.estimatedUnitPrice,
                        total: activity.estimatedTotal,
                        estimatedUnitPrice: activity.estimatedUnitPrice,
                        savings: 0,
                        noComparison: true
                    });

                    plan.byProvider[defaultProvider].total += activity.estimatedTotal;
                    plan.totalOptimized += activity.estimatedTotal;
                }
            });

            plan.totalSavings = plan.totalEstimated - plan.totalOptimized;

            return plan;
        }

        getProviderLogo(providerName) {
            const logos = {
                'Sodimac': '🟠',
                'Easy': '🟢',
                'Homecenter': '🔵',
                'Constructor': '🔴',
                'Imperial': '🟡',
                'Hites': '🟣'
            };
            return logos[providerName] || '🏪';
        }

        displaySmartShoppingList() {
            const plan = this.shoppingPlan;
            if (!plan) return;

            const modal = document.createElement('div');
            modal.id = 'smart-shopping-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                z-index: 10002;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 20px;
                overflow-y: auto;
            `;

            modal.onclick = (e) => {
                if (e.target === modal) modal.remove();
            };

            // Calculate savings percentage
            const savingsPercent = plan.totalEstimated > 0
                ? Math.round((plan.totalSavings / plan.totalEstimated) * 100)
                : 0;

            // Get providers with items
            const providersWithItems = Object.values(plan.byProvider)
                .filter(p => p.items.length > 0)
                .sort((a, b) => b.total - a.total);

            modal.innerHTML = `
                <div style="background: white; padding: 30px; border-radius: 16px; max-width: 900px; width: 100%; max-height: 90vh; overflow-y: auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2 style="margin: 0; font-size: 24px; display: flex; align-items: center; gap: 12px;">
                            <span>🛒</span>
                            <span>Plan de Compras Inteligente</span>
                            <span>✨</span>
                        </h2>
                        <button onclick="this.closest('#smart-shopping-modal').remove()" style="
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

                    <!-- Savings Summary -->
                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 12px; margin-bottom: 25px; color: white; text-align: center;">
                        <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px; opacity: 0.9;">💰 AHORRO TOTAL</div>
                        <div style="font-size: 36px; font-weight: 800; margin-bottom: 8px;">
                            $${plan.totalSavings.toLocaleString('es-CL')}
                        </div>
                        <div style="font-size: 16px; opacity: 0.95;">
                            ${savingsPercent}% de ahorro vs. precio estimado
                        </div>
                        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.3); display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 13px;">
                            <div>
                                <div style="opacity: 0.8;">Precio Estimado</div>
                                <div style="font-size: 18px; font-weight: 700;">$${plan.totalEstimated.toLocaleString('es-CL')}</div>
                            </div>
                            <div>
                                <div style="opacity: 0.8;">Precio Optimizado</div>
                                <div style="font-size: 18px; font-weight: 700;">$${plan.totalOptimized.toLocaleString('es-CL')}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Shopping by Provider -->
                    <div style="margin-bottom: 25px;">
                        <h3 style="font-size: 18px; margin-bottom: 15px; color: #333;">
                            📋 Compra organizada por proveedor (${providersWithItems.length} tiendas)
                        </h3>

                        ${providersWithItems.map(provider => `
                            <div style="background: #f9fafb; border: 2px solid #e5e7eb; padding: 20px; border-radius: 12px; margin-bottom: 15px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        <span style="font-size: 28px;">${provider.logo}</span>
                                        <div>
                                            <div style="font-size: 18px; font-weight: 700; color: #1f2937;">${provider.name}</div>
                                            <div style="font-size: 13px; color: #6b7280;">${provider.items.length} item${provider.items.length > 1 ? 's' : ''}</div>
                                        </div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">Subtotal</div>
                                        <div style="font-size: 22px; font-weight: 700; color: #1f2937;">$${provider.total.toLocaleString('es-CL')}</div>
                                    </div>
                                </div>

                                <div style="border-top: 1px solid #e5e7eb; padding-top: 15px;">
                                    ${provider.items.map((item, i) => `
                                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: white; border-radius: 8px; margin-bottom: ${i < provider.items.length - 1 ? '10px' : '0'};">
                                            <div style="flex: 1;">
                                                <div style="font-weight: 600; font-size: 14px; color: #1f2937; margin-bottom: 4px;">${item.name}</div>
                                                <div style="font-size: 12px; color: #6b7280;">
                                                    ${item.quantity} × $${item.unitPrice.toLocaleString('es-CL')}
                                                    ${item.savings > 0 ? `<span style="color: #10b981; font-weight: 600; margin-left: 8px;">(-$${item.savings.toLocaleString('es-CL')})</span>` : ''}
                                                    ${item.noComparison ? '<span style="color: #f59e0b; font-weight: 600; margin-left: 8px;">(precio estimado)</span>' : ''}
                                                </div>
                                            </div>
                                            <div style="font-weight: 700; font-size: 16px; color: #1f2937;">
                                                $${item.total.toLocaleString('es-CL')}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>

                                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #e5e7eb;">
                                    <button onclick="window.smartShopping.exportProviderList('${provider.name}')" style="
                                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                        color: white;
                                        border: none;
                                        padding: 10px 20px;
                                        border-radius: 8px;
                                        cursor: pointer;
                                        font-weight: 600;
                                        font-size: 14px;
                                        width: 100%;
                                    ">
                                        📋 Copiar Lista de ${provider.name}
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <!-- Action Buttons -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 25px;">
                        <button onclick="window.smartShopping.exportFullList()" style="
                            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                            color: white;
                            border: none;
                            padding: 16px;
                            border-radius: 10px;
                            cursor: pointer;
                            font-weight: 700;
                            font-size: 15px;
                        ">
                            📄 Exportar Lista Completa
                        </button>
                        <button onclick="window.smartShopping.shareWhatsApp()" style="
                            background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
                            color: white;
                            border: none;
                            padding: 16px;
                            border-radius: 10px;
                            cursor: pointer;
                            font-weight: 700;
                            font-size: 15px;
                        ">
                            📱 Compartir por WhatsApp
                        </button>
                    </div>

                    <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px; border: 2px solid #fbbf24; text-align: center; font-size: 13px; color: #92400e;">
                        💡 <strong>Tip:</strong> Imprime esta lista o compártela con WhatsApp para tenerla a mano cuando vayas a comprar
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
        }

        exportProviderList(providerName) {
            const provider = this.shoppingPlan.byProvider[providerName];
            if (!provider) return;

            let text = `🛒 LISTA DE COMPRAS - ${providerName.toUpperCase()}\n`;
            text += `${'='.repeat(50)}\n\n`;

            provider.items.forEach((item, i) => {
                text += `${i + 1}. ${item.name}\n`;
                text += `   Cantidad: ${item.quantity}\n`;
                text += `   Precio unitario: $${item.unitPrice.toLocaleString('es-CL')}\n`;
                text += `   Subtotal: $${item.total.toLocaleString('es-CL')}\n`;
                if (item.savings > 0) {
                    text += `   ✅ Ahorro: $${item.savings.toLocaleString('es-CL')}\n`;
                }
                text += `\n`;
            });

            text += `${'='.repeat(50)}\n`;
            text += `TOTAL ${providerName}: $${provider.total.toLocaleString('es-CL')}\n`;
            text += `\nGenerado por CLAUDIA 🤖\n`;

            this.copyToClipboard(text);
            this.showNotification(`✅ Lista de ${providerName} copiada`, 'Pégala donde necesites', 'success');
        }

        exportFullList() {
            const plan = this.shoppingPlan;
            if (!plan) return;

            let text = `🛒 PLAN DE COMPRAS INTELIGENTE - CLAUDIA\n`;
            text += `${'='.repeat(60)}\n\n`;
            text += `💰 RESUMEN DE AHORRO\n`;
            text += `   Precio Estimado: $${plan.totalEstimated.toLocaleString('es-CL')}\n`;
            text += `   Precio Optimizado: $${plan.totalOptimized.toLocaleString('es-CL')}\n`;
            text += `   AHORRO TOTAL: $${plan.totalSavings.toLocaleString('es-CL')}\n`;
            text += `   (${Math.round((plan.totalSavings / plan.totalEstimated) * 100)}% de ahorro)\n\n`;
            text += `${'='.repeat(60)}\n\n`;

            const providersWithItems = Object.values(plan.byProvider)
                .filter(p => p.items.length > 0)
                .sort((a, b) => b.total - a.total);

            providersWithItems.forEach((provider, pIndex) => {
                text += `${provider.logo} ${provider.name.toUpperCase()} - $${provider.total.toLocaleString('es-CL')}\n`;
                text += `${'-'.repeat(60)}\n`;

                provider.items.forEach((item, i) => {
                    text += `${i + 1}. ${item.name}\n`;
                    text += `   ${item.quantity} × $${item.unitPrice.toLocaleString('es-CL')} = $${item.total.toLocaleString('es-CL')}`;
                    if (item.savings > 0) {
                        text += ` (ahorro: $${item.savings.toLocaleString('es-CL')})`;
                    }
                    text += `\n`;
                });

                text += `\n`;
            });

            text += `${'='.repeat(60)}\n`;
            text += `Generado por CLAUDIA - Tu Asistente de Construcción 🤖\n`;
            text += `https://claudia-i8bxh.web.app\n`;

            this.copyToClipboard(text);
            this.showNotification('✅ Lista completa copiada', 'Lista de compras lista para compartir', 'success');
        }

        shareWhatsApp() {
            const plan = this.shoppingPlan;
            if (!plan) return;

            let text = `🛒 *PLAN DE COMPRAS INTELIGENTE*\n\n`;
            text += `💰 *AHORRO: $${plan.totalSavings.toLocaleString('es-CL')}* (${Math.round((plan.totalSavings / plan.totalEstimated) * 100)}%)\n`;
            text += `Total: $${plan.totalOptimized.toLocaleString('es-CL')}\n\n`;

            const providersWithItems = Object.values(plan.byProvider)
                .filter(p => p.items.length > 0)
                .sort((a, b) => b.total - a.total);

            providersWithItems.forEach(provider => {
                text += `${provider.logo} *${provider.name}* - $${provider.total.toLocaleString('es-CL')}\n`;
                provider.items.forEach(item => {
                    text += `• ${item.name} (${item.quantity})\n`;
                });
                text += `\n`;
            });

            text += `_Generado por CLAUDIA 🤖_`;

            const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
        }

        copyToClipboard(text) {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }

        showNotification(title, message, type) {
            if (window.notificationManager) {
                window.notificationManager.showToast(title, message, type, 5000);
            } else {
                alert(`${title}\n${message}`);
            }
        }

        resetButton(btn) {
            btn.innerHTML = `
                <span style="font-size: 24px;">🛒</span>
                <span>Generar Lista de Compras Inteligente</span>
                <span style="font-size: 20px;">✨</span>
            `;
            btn.disabled = false;
            btn.style.opacity = '1';
        }

        sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.smartShopping = new window.SmartShopping();
            setTimeout(() => window.smartShopping.init(), 2000);
        });
    } else {
        window.smartShopping = new window.SmartShopping();
        setTimeout(() => window.smartShopping.init(), 2000);
    }

})();

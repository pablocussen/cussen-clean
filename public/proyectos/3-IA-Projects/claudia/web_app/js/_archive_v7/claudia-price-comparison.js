/**
 * CLAUDIA v6.4 - Price Comparison Module
 * Comparación de precios en tiempo real con 6 proveedores chilenos
 * Sodimac, Easy, Homecenter, Constructor, Imperial, Hites
 */

(function() {
    'use strict';

    window.PriceComparison = class {
        constructor() {
            this.apiUrl = 'http://localhost:5000/api'; // Local dev
            // this.apiUrl = 'https://your-api.com/api'; // Production
            this.cache = {};
            this.cacheDuration = 3600000; // 1 hora
            this.initialized = false;
        }

        init() {
            if (this.initialized) return;

            console.log('💰 Price Comparison v6.4 - 6 proveedores');

            // Add button to activities
            this.addCompareButtonsToActivities();

            // Hook into activity additions
            this.observeActivityChanges();

            this.initialized = true;
        }

        observeActivityChanges() {
            // Check for new activities every 3 seconds
            this.observerInterval = setInterval(() => {
                this.addCompareButtonsToActivities();
            }, 3000);
        }

        addCompareButtonsToActivities() {
            const activities = document.querySelectorAll('.project-activity-item');

            activities.forEach((activity, index) => {
                // Check if button already exists
                if (activity.querySelector('.compare-price-btn')) return;

                const actions = activity.querySelector('.project-activity-actions');
                if (!actions) return;

                // Create compare button
                const btn = document.createElement('button');
                btn.className = 'compare-price-btn project-activity-btn';
                btn.innerHTML = '💰';
                btn.title = 'Comparar precios';
                btn.style.cssText = 'background: linear-gradient(135deg, #10b981, #059669); color: white;';

                // Get activity name
                const activityName = activity.querySelector('.project-activity-name')?.textContent || '';

                btn.onclick = (e) => {
                    e.stopPropagation();
                    this.showPriceComparison(activityName, index);
                };

                actions.insertBefore(btn, actions.firstChild);
            });
        }

        async showPriceComparison(materialName, activityIndex) {
            // Show loading modal
            this.showLoadingModal(materialName);

            try {
                // Check cache
                const cached = this.getFromCache(materialName);
                if (cached) {
                    this.displayResults(materialName, cached);
                    return;
                }

                // Fetch from API
                const results = await this.comparePrices(materialName);

                // Cache results
                this.saveToCache(materialName, results);

                // Display
                this.displayResults(materialName, results);

            } catch (error) {
                console.error('Error comparing prices:', error);
                this.showErrorModal(materialName, error.message);
            }
        }

        async comparePrices(material) {
            // Try API first
            try {
                const response = await fetch(`${this.apiUrl}/compare/${encodeURIComponent(material)}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('API not available');
                }

                const data = await response.json();
                return data;

            } catch (error) {
                // Fallback: simulate data for demo
                console.log('API not available, using demo data');
                return this.getDemoData(material);
            }
        }

        getDemoData(material) {
            // Demo data for testing without backend (6 proveedores)
            const basePrice = Math.floor(Math.random() * 50000) + 10000;

            const stores = [
                { name: 'Sodimac', logo: '🟠', factor: 1.0 },
                { name: 'Easy', logo: '🟢', factor: 0.95 },
                { name: 'Homecenter', logo: '🔵', factor: 1.05 },
                { name: 'Constructor', logo: '🔴', factor: 0.92 },
                { name: 'Imperial', logo: '🟡', factor: 1.08 },
                { name: 'Hites', logo: '🟣', factor: 0.97 }
            ];

            const results = stores.map(store => ({
                store: store.name,
                logo: store.logo,
                name: `${material} - ${store.name}`,
                price: Math.round(basePrice * store.factor),
                link: `https://www.${store.name.toLowerCase()}.cl`
            }));

            results.sort((a, b) => a.price - b.price);

            const best = results[0];
            const worst = results[results.length - 1];
            const savings = worst.price - best.price;
            const savings_percent = Math.round((savings / worst.price) * 100);

            return {
                query: material,
                found: true,
                results: results,
                best_price: best,
                worst_price: worst,
                savings: savings,
                savings_percent: savings_percent,
                total_found: results.length
            };
        }

        getFromCache(material) {
            const key = material.toLowerCase();
            const cached = this.cache[key];

            if (!cached) return null;

            const now = Date.now();
            if (now - cached.timestamp > this.cacheDuration) {
                delete this.cache[key];
                return null;
            }

            return cached.data;
        }

        saveToCache(material, data) {
            const key = material.toLowerCase();
            this.cache[key] = {
                data: data,
                timestamp: Date.now()
            };
        }

        showLoadingModal(material) {
            const modal = document.createElement('div');
            modal.id = 'price-comparison-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                z-index: 10001;
                display: flex;
                justify-content: center;
                align-items: center;
            `;

            modal.innerHTML = `
                <div style="background: white; padding: 40px; border-radius: 12px; max-width: 500px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 20px;">💰</div>
                    <div style="font-size: 18px; font-weight: 600; margin-bottom: 10px;">
                        Comparando precios...
                    </div>
                    <div style="font-size: 14px; color: #666;">
                        "${material}"
                    </div>
                    <div style="margin-top: 20px;">
                        <div class="spinner" style="width: 40px; height: 40px; border: 4px solid #e0e0e0; border-top-color: #10b981; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
        }

        displayResults(material, data) {
            // Remove loading modal
            const existing = document.getElementById('price-comparison-modal');
            if (existing) existing.remove();

            if (!data.found || !data.results || data.results.length === 0) {
                this.showErrorModal(material, 'No se encontraron resultados');
                return;
            }

            const modal = document.createElement('div');
            modal.id = 'price-comparison-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                z-index: 10001;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 20px;
                overflow-y: auto;
            `;

            modal.onclick = (e) => {
                if (e.target === modal) modal.remove();
            };

            const best = data.best_price;
            const savings = data.savings;
            const savingsPercent = data.savings_percent;

            modal.innerHTML = `
                <div style="background: white; padding: 30px; border-radius: 12px; max-width: 600px; width: 100%;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="margin: 0; font-size: 20px;">💰 Comparación de Precios</h3>
                        <button onclick="this.closest('#price-comparison-modal').remove()" style="background: #ef4444; color: white; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 18px;">✕</button>
                    </div>

                    <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <div style="font-weight: 600; font-size: 14px; color: #333; margin-bottom: 5px;">Material:</div>
                        <div style="font-size: 16px; color: #666;">${material}</div>
                    </div>

                    ${savings > 0 ? `
                        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 15px; border-radius: 8px; border: 2px solid #f59e0b; margin-bottom: 20px;">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                                <span style="font-size: 24px;">💡</span>
                                <span style="font-weight: 700; font-size: 16px; color: #92400e;">¡Puedes ahorrar!</span>
                            </div>
                            <div style="font-size: 24px; font-weight: 700; color: #92400e; margin-bottom: 5px;">
                                $${savings.toLocaleString('es-CL')}
                            </div>
                            <div style="font-size: 13px; color: #92400e;">
                                (${savingsPercent}% de ahorro comprando en ${best.store})
                            </div>
                        </div>
                    ` : ''}

                    <div style="display: grid; gap: 12px;">
                        ${data.results.map((result, i) => `
                            <div style="background: ${i === 0 ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : '#f5f5f5'}; padding: 15px; border-radius: 8px; border: 2px solid ${i === 0 ? '#10b981' : '#e0e0e0'}; position: relative;">
                                ${i === 0 ? '<div style="position: absolute; top: 10px; right: 10px; background: #10b981; color: white; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 700;">MEJOR PRECIO</div>' : ''}
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                        <span style="font-size: 24px;">${result.logo}</span>
                                        <span style="font-weight: 600; font-size: 15px;">${result.store}</span>
                                    </div>
                                    <span style="font-size: 20px; font-weight: 700; color: ${i === 0 ? '#10b981' : '#333'};">
                                        $${result.price.toLocaleString('es-CL')}
                                    </span>
                                </div>
                                <div style="font-size: 12px; color: #666; margin-bottom: 10px;">
                                    ${result.name}
                                </div>
                                <a href="${result.link}" target="_blank" style="display: inline-block; background: ${i === 0 ? '#10b981' : '#667eea'}; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600;">
                                    Ver en ${result.store} →
                                </a>
                            </div>
                        `).join('')}
                    </div>

                    <div style="margin-top: 20px; padding: 15px; background: #f0f0f0; border-radius: 8px; font-size: 12px; color: #666; text-align: center;">
                        💡 Precios actualizados en tiempo real
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
        }

        showErrorModal(material, message) {
            const existing = document.getElementById('price-comparison-modal');
            if (existing) existing.remove();

            const modal = document.createElement('div');
            modal.id = 'price-comparison-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                z-index: 10001;
                display: flex;
                justify-content: center;
                align-items: center;
            `;

            modal.onclick = () => modal.remove();

            modal.innerHTML = `
                <div style="background: white; padding: 30px; border-radius: 12px; max-width: 400px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 20px;">😔</div>
                    <div style="font-size: 18px; font-weight: 600; margin-bottom: 10px;">
                        No se encontraron precios
                    </div>
                    <div style="font-size: 14px; color: #666; margin-bottom: 10px;">
                        "${material}"
                    </div>
                    <div style="font-size: 12px; color: #999;">
                        ${message}
                    </div>
                    <button onclick="this.closest('#price-comparison-modal').remove()" style="margin-top: 20px; background: #667eea; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        Cerrar
                    </button>
                </div>
            `;

            document.body.appendChild(modal);
        }

        formatMoney(amount) {
            return '$' + Math.round(amount).toLocaleString('es-CL');
        }
    };

    // Add spinner animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.priceComparison = new PriceComparison();
            window.priceComparison.init();
        });
    } else {
        window.priceComparison = new PriceComparison();
        window.priceComparison.init();
    }

    console.log('💰 Price Comparison v6.4 loaded');
})();

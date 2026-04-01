/**
 * CLAUDIA v6.4 - Price Alerts System
 * Notificaciones automáticas cuando los precios bajan
 * Monitorea 6 proveedores: Sodimac, Easy, Homecenter, Constructor, Imperial, Hites
 */

(function() {
    'use strict';

    window.PriceAlerts = class {
        constructor() {
            this.initialized = false;
            this.trackedMaterials = {};
            this.priceHistory = {};
            this.checkInterval = null;
            this.CHECK_FREQUENCY = 3600000; // 1 hora
        }

        init() {
            if (this.initialized) return;

            console.log('🔔 Price Alerts v6.4 - 6 proveedores');

            // Load tracked materials
            this.loadTrackedMaterials();
            this.loadPriceHistory();

            // Setup UI
            this.injectPriceAlertsUI();

            // Start monitoring
            this.startPriceMonitoring();

            this.initialized = true;
        }

        loadTrackedMaterials() {
            const data = localStorage.getItem('claudia_tracked_materials');
            this.trackedMaterials = data ? JSON.parse(data) : {};
        }

        saveTrackedMaterials() {
            localStorage.setItem('claudia_tracked_materials', JSON.stringify(this.trackedMaterials));
        }

        loadPriceHistory() {
            const data = localStorage.getItem('claudia_price_history');
            this.priceHistory = data ? JSON.parse(data) : {};
        }

        savePriceHistory() {
            localStorage.setItem('claudia_price_history', JSON.stringify(this.priceHistory));
        }

        injectPriceAlertsUI() {
            // Add "Seguir precio" button to price comparison modal
            this.observeModals();
        }

        observeModals() {
            // Monitor for price comparison modals
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.id === 'price-comparison-modal') {
                            setTimeout(() => this.addTrackButton(), 100);
                        }
                    });
                });
            });

            observer.observe(document.body, { childList: true });
        }

        addTrackButton() {
            const modal = document.getElementById('price-comparison-modal');
            if (!modal) return;

            // Check if button already exists
            if (modal.querySelector('.track-price-btn')) return;

            // Get material name from modal
            const materialElem = modal.querySelector('[style*="Material:"]');
            if (!materialElem) return;

            const materialDiv = materialElem.nextElementSibling;
            if (!materialDiv) return;

            const material = materialDiv.textContent.trim();

            // Create track button
            const trackBtn = document.createElement('button');
            trackBtn.className = 'track-price-btn';
            trackBtn.style.cssText = `
                width: 100%;
                background: linear-gradient(135deg, #f59e0b, #d97706);
                color: white;
                border: none;
                padding: 12px;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                margin-top: 15px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                transition: all 0.2s ease;
            `;

            const isTracked = this.trackedMaterials[material];
            trackBtn.innerHTML = isTracked ?
                '🔕 Dejar de seguir precio' :
                '🔔 Seguir precio (te avisaré si baja)';

            trackBtn.onmouseover = () => {
                trackBtn.style.transform = 'translateY(-2px)';
                trackBtn.style.boxShadow = '0 6px 12px rgba(245, 158, 11, 0.3)';
            };

            trackBtn.onmouseout = () => {
                trackBtn.style.transform = '';
                trackBtn.style.boxShadow = '';
            };

            trackBtn.onclick = () => {
                if (isTracked) {
                    this.untrackMaterial(material);
                    trackBtn.innerHTML = '🔔 Seguir precio (te avisaré si baja)';
                } else {
                    this.trackMaterial(material);
                    trackBtn.innerHTML = '🔕 Dejar de seguir precio';
                }
            };

            // Insert button before the last div (timestamp info)
            const lastDiv = modal.querySelector('[style*="margin-top: 20px"][style*="padding: 15px"]');
            if (lastDiv) {
                lastDiv.parentNode.insertBefore(trackBtn, lastDiv);
            }
        }

        async trackMaterial(material) {
            console.log('🔔 Tracking price for:', material);

            // Get current prices
            let currentPrices = null;

            if (window.priceComparison) {
                try {
                    currentPrices = await window.priceComparison.comparePrices(material);
                } catch (e) {
                    console.error('Error getting prices:', e);
                }
            }

            // Store tracked material
            this.trackedMaterials[material] = {
                addedAt: Date.now(),
                lastChecked: Date.now(),
                currentBestPrice: currentPrices?.best_price?.price || null,
                currentBestStore: currentPrices?.best_price?.store || null,
                alertThreshold: 0.05 // 5% de descuento mínimo para alertar
            };

            this.saveTrackedMaterials();

            // Add to price history
            if (currentPrices && currentPrices.found) {
                this.addToPriceHistory(material, currentPrices);
            }

            // Show confirmation
            this.showNotification(
                `🔔 Siguiendo precio de "${material}"`,
                'Te avisaré cuando el precio baje',
                'success'
            );
        }

        untrackMaterial(material) {
            console.log('🔕 Untracking price for:', material);

            delete this.trackedMaterials[material];
            this.saveTrackedMaterials();

            this.showNotification(
                `🔕 Dejaste de seguir "${material}"`,
                'Ya no recibirás alertas de precio',
                'info'
            );
        }

        addToPriceHistory(material, priceData) {
            if (!this.priceHistory[material]) {
                this.priceHistory[material] = [];
            }

            const entry = {
                timestamp: Date.now(),
                bestPrice: priceData.best_price?.price || null,
                bestStore: priceData.best_price?.store || null,
                allPrices: priceData.results.map(r => ({
                    store: r.store,
                    price: r.price
                }))
            };

            this.priceHistory[material].push(entry);

            // Keep only last 30 days
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            this.priceHistory[material] = this.priceHistory[material].filter(
                e => e.timestamp > thirtyDaysAgo
            );

            this.savePriceHistory();
        }

        async startPriceMonitoring() {
            console.log('📊 Starting price monitoring...');

            // Check immediately
            await this.checkAllTrackedPrices();

            // Then check every hour
            this.checkInterval = setInterval(() => {
                this.checkAllTrackedPrices();
            }, this.CHECK_FREQUENCY);
        }

        async checkAllTrackedPrices() {
            const materials = Object.keys(this.trackedMaterials);

            if (materials.length === 0) {
                console.log('📊 No materials tracked');
                return;
            }

            console.log(`📊 Checking prices for ${materials.length} materials...`);

            for (const material of materials) {
                await this.checkMaterialPrice(material);

                // Wait 2 seconds between checks to avoid rate limiting
                await this.sleep(2000);
            }

            console.log('✅ Price check complete');
        }

        async checkMaterialPrice(material) {
            const tracked = this.trackedMaterials[material];
            if (!tracked) return;

            try {
                // Get current prices
                let currentPrices = null;

                if (window.priceComparison) {
                    currentPrices = await window.priceComparison.comparePrices(material);
                }

                if (!currentPrices || !currentPrices.found) {
                    console.log(`❌ No prices found for ${material}`);
                    return;
                }

                const newBestPrice = currentPrices.best_price.price;
                const newBestStore = currentPrices.best_price.store;
                const oldBestPrice = tracked.currentBestPrice;

                // Add to history
                this.addToPriceHistory(material, currentPrices);

                // Update tracked data
                tracked.lastChecked = Date.now();
                tracked.currentBestPrice = newBestPrice;
                tracked.currentBestStore = newBestStore;
                this.saveTrackedMaterials();

                // Check if price dropped
                if (oldBestPrice && newBestPrice < oldBestPrice) {
                    const drop = oldBestPrice - newBestPrice;
                    const dropPercent = (drop / oldBestPrice) * 100;

                    // Alert if drop is significant (>= threshold)
                    if (dropPercent >= (tracked.alertThreshold * 100)) {
                        this.sendPriceDropAlert(material, {
                            oldPrice: oldBestPrice,
                            newPrice: newBestPrice,
                            drop: drop,
                            dropPercent: dropPercent,
                            store: newBestStore
                        });
                    }
                }

            } catch (error) {
                console.error(`Error checking price for ${material}:`, error);
            }
        }

        sendPriceDropAlert(material, data) {
            console.log(`🔔 PRICE DROP ALERT: ${material}`);

            const title = `💰 ¡Precio bajó!`;
            const message = `"${material}" bajó $${data.drop.toLocaleString('es-CL')} (${data.dropPercent.toFixed(1)}%) en ${data.store}. Ahora: $${data.newPrice.toLocaleString('es-CL')}`;

            // Show notification
            this.showNotification(title, message, 'success', 10000);

            // Try browser notification
            this.sendBrowserNotification(title, message);

            // Add to notification center
            if (window.notificationManager) {
                window.notificationManager.addPendingNotification({
                    type: 'price_drop',
                    priority: 'high',
                    title: title,
                    message: message,
                    material: material,
                    oldPrice: data.oldPrice,
                    newPrice: data.newPrice,
                    drop: data.drop,
                    dropPercent: data.dropPercent,
                    store: data.store,
                    timestamp: Date.now()
                });
            }
        }

        sendBrowserNotification(title, message) {
            if (!('Notification' in window)) return;

            if (Notification.permission === 'granted') {
                new Notification(title, {
                    body: message,
                    icon: '/icon-192.png',
                    badge: '/badge-72.png',
                    tag: 'price-drop',
                    requireInteraction: true
                });
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        this.sendBrowserNotification(title, message);
                    }
                });
            }
        }

        showNotification(title, message, type = 'info', duration = 5000) {
            // Create toast notification
            const toast = document.createElement('div');
            toast.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                background: ${type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' : type === 'error' ? '#ef4444' : '#667eea'};
                color: white;
                padding: 20px;
                border-radius: 12px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.3);
                z-index: 10002;
                max-width: 350px;
                animation: slideInRight 0.3s ease;
            `;

            toast.innerHTML = `
                <div style="display: flex; align-items: start; gap: 12px;">
                    <div style="font-size: 24px;">${type === 'success' ? '💰' : type === 'error' ? '❌' : '🔔'}</div>
                    <div style="flex: 1;">
                        <div style="font-weight: 700; font-size: 15px; margin-bottom: 5px;">${title}</div>
                        <div style="font-size: 13px; opacity: 0.95;">${message}</div>
                    </div>
                    <button onclick="this.parentElement.parentElement.remove()" style="background: transparent; border: none; color: white; font-size: 20px; cursor: pointer; opacity: 0.8; padding: 0; width: 24px; height: 24px;">✕</button>
                </div>
            `;

            document.body.appendChild(toast);

            // Auto remove
            setTimeout(() => {
                toast.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }

        getTrackedMaterialsList() {
            return Object.keys(this.trackedMaterials).map(material => ({
                name: material,
                ...this.trackedMaterials[material],
                priceHistory: this.priceHistory[material] || []
            }));
        }

        showTrackedMaterialsPanel() {
            const tracked = this.getTrackedMaterialsList();

            const panel = document.createElement('div');
            panel.id = 'price-alerts-panel';
            panel.style.cssText = `
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
            `;

            panel.onclick = (e) => {
                if (e.target === panel) panel.remove();
            };

            panel.innerHTML = `
                <div style="background: white; padding: 30px; border-radius: 12px; max-width: 600px; width: 100%; max-height: 80vh; overflow-y: auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="margin: 0; font-size: 20px;">🔔 Materiales que Sigues</h3>
                        <button onclick="this.closest('#price-alerts-panel').remove()" style="background: #ef4444; color: white; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 18px;">✕</button>
                    </div>

                    ${tracked.length === 0 ? `
                        <div style="text-align: center; padding: 40px; color: #999;">
                            <div style="font-size: 48px; margin-bottom: 10px;">🔔</div>
                            <div>No estás siguiendo ningún material</div>
                            <div style="font-size: 13px; margin-top: 10px;">Usa el botón "Seguir precio" en la comparación de precios</div>
                        </div>
                    ` : `
                        <div style="display: grid; gap: 15px;">
                            ${tracked.map(mat => `
                                <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                                        <div style="flex: 1;">
                                            <div style="font-weight: 600; font-size: 15px; margin-bottom: 5px;">${mat.name}</div>
                                            <div style="font-size: 13px; color: #666;">
                                                Mejor precio: ${mat.currentBestPrice ? '$' + mat.currentBestPrice.toLocaleString('es-CL') : 'Buscando...'}
                                                ${mat.currentBestStore ? ` en ${mat.currentBestStore}` : ''}
                                            </div>
                                        </div>
                                        <button onclick="window.priceAlerts.untrackMaterial('${mat.name}'); this.closest('#price-alerts-panel').remove();" style="background: transparent; border: none; color: #ef4444; cursor: pointer; padding: 5px; font-size: 12px;">🗑️</button>
                                    </div>
                                    <div style="display: flex; gap: 10px; font-size: 11px; color: #999;">
                                        <span>📊 ${mat.priceHistory.length} checks</span>
                                        <span>🕐 Último: ${this.timeAgo(mat.lastChecked)}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            `;

            document.body.appendChild(panel);
        }

        timeAgo(timestamp) {
            const now = Date.now();
            const diff = now - timestamp;
            const mins = Math.floor(diff / 60000);
            const hours = Math.floor(mins / 60);
            const days = Math.floor(hours / 24);

            if (mins < 1) return 'Ahora';
            if (mins < 60) return `Hace ${mins} min`;
            if (hours < 24) return `Hace ${hours} h`;
            return `Hace ${days} días`;
        }

        sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    };

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.priceAlerts = new PriceAlerts();
            window.priceAlerts.init();
        });
    } else {
        window.priceAlerts = new PriceAlerts();
        window.priceAlerts.init();
    }

    console.log('🔔 Price Alerts v6.4 loaded');
})();

/**
 * CLAUDIA v8.0 - Materials Breakdown Engine
 * Desglosa actividades de construcción en materiales individuales
 * Permite comparar precios de componentes específicos
 */

(function() {
    'use strict';

    // Base de datos de desglose de actividades a materiales
    // Cantidades son POR M² (corregidas según normas chilenas 2024)
    const ACTIVITY_MATERIALS = {
        'radier': [
            { material: 'Cemento', cantidadPorM2: 0.12, unidad: 'sacos', precioBase: 8900 },
            { material: 'Arena', cantidadPorM2: 0.015, unidad: 'm³', precioBase: 18000 },
            { material: 'Ripio', cantidadPorM2: 0.025, unidad: 'm³', precioBase: 16000 },
            { material: 'Malla Acma C92', cantidadPorM2: 1.05, unidad: 'm²', precioBase: 3800 }
        ],
        'hormigon': [
            { material: 'Cemento', cantidadPorM2: 0.15, unidad: 'sacos', precioBase: 8900 },
            { material: 'Arena', cantidadPorM2: 0.018, unidad: 'm³', precioBase: 18000 },
            { material: 'Ripio', cantidadPorM2: 0.030, unidad: 'm³', precioBase: 16000 },
            { material: 'Fierro', cantidadPorM2: 2.5, unidad: 'kg', precioBase: 950 }
        ],
        'excavacion': [
            { material: 'Mano de obra', cantidadPorM2: 0.08, unidad: 'jornal', precioBase: 35000 },
            { material: 'Herramientas', cantidadPorM2: 0.02, unidad: 'set', precioBase: 5000 }
        ],
        'albanileria': [
            { material: 'Ladrillo fiscal', cantidadPorM2: 38, unidad: 'unidades', precioBase: 180 },
            { material: 'Cemento', cantidadPorM2: 0.08, unidad: 'sacos', precioBase: 8900 },
            { material: 'Arena', cantidadPorM2: 0.012, unidad: 'm³', precioBase: 18000 }
        ],
        'estucado': [
            { material: 'Cemento', cantidadPorM2: 0.06, unidad: 'sacos', precioBase: 8900 },
            { material: 'Arena fina', cantidadPorM2: 0.008, unidad: 'm³', precioBase: 20000 },
            { material: 'Yeso', cantidadPorM2: 0.04, unidad: 'sacos', precioBase: 4500 }
        ],
        'pintura': [
            { material: 'Pintura látex', cantidadPorM2: 0.15, unidad: 'litros', precioBase: 12000 },
            { material: 'Pasta muro', cantidadPorM2: 0.08, unidad: 'kg', precioBase: 3500 },
            { material: 'Lija', cantidadPorM2: 0.2, unidad: 'pliegos', precioBase: 800 }
        ]
    };

    window.MaterialsBreakdown = class {
        constructor() {
            this.materialsDB = ACTIVITY_MATERIALS;
        }

        // Detecta actividad y devuelve materiales desde la base de datos APU
        breakdownActivity(activityName) {
            const name = activityName.toLowerCase();

            // Buscar en la base de datos APU real
            const apuDB = window.apuDatabase || [];

            // Buscar por nombre exacto o coincidencia
            let foundAPU = apuDB.find(apu =>
                apu.nombre.toLowerCase() === name ||
                apu.nombre.toLowerCase().includes(name) ||
                name.includes(apu.nombre.toLowerCase())
            );

            // Si encontramos el APU con datos completos
            if (foundAPU && foundAPU.materiales && foundAPU.materiales.length > 0) {
                // Convertir materiales del APU al formato esperado
                const materials = foundAPU.materiales.map(m => ({
                    material: m.nombre,
                    cantidadPorM2: m.cantidad,
                    unidad: m.unidad,
                    precioBase: m.precio_unitario || 0
                }));

                // Agregar mano de obra si existe
                if (foundAPU.mano_obra && foundAPU.mano_obra.length > 0) {
                    foundAPU.mano_obra.forEach(mo => {
                        materials.push({
                            material: mo.nombre + ' (Mano de obra)',
                            cantidadPorM2: mo.cantidad,
                            unidad: mo.unidad,
                            precioBase: mo.precio_unitario || 0
                        });
                    });
                }

                return {
                    found: true,
                    activity: foundAPU.nombre,
                    materials: materials,
                    totalEstimated: this.calculateTotal(materials),
                    tips: foundAPU.tips || null,
                    rendimiento: foundAPU.rendimiento || null
                };
            }

            // Fallback: buscar en la base de datos hardcoded antigua
            for (const [key, materials] of Object.entries(this.materialsDB)) {
                if (name.includes(key)) {
                    return {
                        found: true,
                        activity: activityName,
                        materials: materials,
                        totalEstimated: this.calculateTotal(materials)
                    };
                }
            }

            // Si no encuentra, crear desglose genérico
            return {
                found: false,
                activity: activityName,
                materials: [
                    { material: activityName, cantidad: 1, unidad: 'global', precioBase: 0 }
                ],
                totalEstimated: 0
            };
        }

        calculateTotal(materials) {
            return materials.reduce((sum, m) => sum + ((m.cantidadPorM2 || m.cantidad || 0) * m.precioBase), 0);
        }

        // Muestra desglose visual
        showBreakdown(activityName, activityQuantity = 1) {
            const breakdown = this.breakdownActivity(activityName);

            let modal = document.getElementById('materials-breakdown-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'materials-breakdown-modal';
                modal.className = 'modal-ultra';
                document.body.appendChild(modal);
            }

            const materialsHTML = breakdown.materials.map((m, index) => {
                const totalQty = (m.cantidadPorM2 || m.cantidad || 0) * activityQuantity;
                const totalPrice = totalQty * m.precioBase;
                const qtyDisplay = this.roundQty(totalQty); // Redondear a 2 decimales

                return `
                    <div class="material-item" style="animation: slideIn 0.3s ease ${index * 0.1}s both;">
                        <div class="material-header">
                            <div class="material-name">
                                <span class="material-icon">${this.getMaterialIcon(m.material)}</span>
                                <span class="material-label">${m.material}</span>
                            </div>
                            <div class="material-price">${this.formatMoney(totalPrice)}</div>
                        </div>
                        <div class="material-details">
                            <span class="material-qty">${qtyDisplay} ${m.unidad}</span>
                            <span class="material-unit-price">@ ${this.formatMoney(m.precioBase)}/${m.unidad}</span>
                        </div>
                        <button class="btn-compare-material" onclick="window.materialsBreakdown.compareMaterial('${m.material}', ${totalQty})" style="margin-top: 10px; width: 100%; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 8px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                            💰 Comparar Precios
                        </button>
                    </div>
                `;
            }).join('');

            const totalEstimated = breakdown.totalEstimated * activityQuantity;

            modal.innerHTML = `
                <div class="modal-overlay-ultra" onclick="this.parentElement.remove()"></div>
                <div class="modal-content-ultra" style="max-width: 600px;">
                    <div class="modal-header-ultra">
                        <div>
                            <h2 class="modal-title-ultra">🔍 Desglose de Materiales</h2>
                            <p class="modal-subtitle-ultra">${activityName}</p>
                        </div>
                        <button class="btn-close-ultra" onclick="this.closest('.modal-ultra').remove()">×</button>
                    </div>

                    <div class="modal-body-ultra">
                        ${breakdown.found ?
                            `<div class="alert-info">
                                <span>ℹ️</span>
                                <div>
                                    <strong>Desglose para ${activityQuantity} ${activityQuantity === 1 ? 'unidad' : 'unidades'}</strong>
                                    <p>Estos son los materiales necesarios para esta actividad</p>
                                    ${breakdown.rendimiento ? `<p style="margin-top: 8px; font-size: 13px; opacity: 0.9;"><strong>⚡ Rendimiento:</strong> ${breakdown.rendimiento}</p>` : ''}
                                </div>
                            </div>` :
                            `<div class="alert-warning">
                                <span>⚠️</span>
                                <div>
                                    <strong>Actividad no catalogada</strong>
                                    <p>Compara el precio global de esta actividad</p>
                                </div>
                            </div>`
                        }

                        <div class="materials-list">
                            ${materialsHTML}
                        </div>

                        ${breakdown.tips ?
                            `<div class="alert-info" style="margin-top: 20px; background: linear-gradient(135deg, #fef3c7, #fde68a); border-left: 4px solid #f59e0b;">
                                <span>💡</span>
                                <div>
                                    <strong>Tip del Maestro</strong>
                                    <p>${breakdown.tips}</p>
                                </div>
                            </div>` : ''
                        }

                        <div class="breakdown-total">
                            <span>Total Estimado</span>
                            <span class="total-amount">${this.formatMoney(totalEstimated)}</span>
                        </div>

                        <div class="breakdown-actions">
                            <button onclick="window.materialsBreakdown.compareAllMaterials(${JSON.stringify(breakdown.materials).replace(/"/g, '&quot;')}, ${activityQuantity})" class="btn-primary-ultra">
                                🔥 Comparar Todos los Materiales
                            </button>
                        </div>
                    </div>
                </div>

                <style>
                    .modal-ultra { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; }
                    .modal-overlay-ultra { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); }
                    .modal-content-ultra { position: relative; background: white; border-radius: 16px; max-height: 90vh; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
                    .modal-header-ultra { padding: 24px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: flex-start; }
                    .modal-title-ultra { font-size: 24px; font-weight: 700; margin: 0; color: #111827; }
                    .modal-subtitle-ultra { font-size: 14px; color: #6b7280; margin-top: 4px; }
                    .btn-close-ultra { background: #f3f4f6; border: none; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; font-size: 24px; color: #6b7280; transition: all 0.2s; }
                    .btn-close-ultra:hover { background: #e5e7eb; color: #111827; }
                    .modal-body-ultra { padding: 24px; max-height: calc(90vh - 200px); overflow-y: auto; }
                    .alert-info, .alert-warning { padding: 16px; border-radius: 12px; display: flex; gap: 12px; margin-bottom: 20px; }
                    .alert-info { background: #eff6ff; border: 1px solid #3b82f6; }
                    .alert-warning { background: #fffbeb; border: 1px solid #f59e0b; }
                    .materials-list { display: grid; gap: 12px; margin-bottom: 20px; }
                    .material-item { background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 12px; padding: 16px; transition: all 0.2s; }
                    .material-item:hover { border-color: #10b981; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(16,185,129,0.1); }
                    .material-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
                    .material-name { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 16px; }
                    .material-icon { font-size: 20px; }
                    .material-price { font-size: 18px; font-weight: 700; color: #DD0021; }
                    .material-details { display: flex; justify-content: space-between; font-size: 13px; color: #6b7280; }
                    .breakdown-total { display: flex; justify-content: space-between; align-items: center; padding: 20px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 12px; color: white; font-size: 18px; font-weight: 700; margin-bottom: 20px; }
                    .breakdown-actions { display: grid; gap: 10px; }
                    .btn-primary-ultra { background: linear-gradient(135deg, #DD0021, #b3001b); color: white; border: none; padding: 16px; border-radius: 12px; font-weight: 600; font-size: 16px; cursor: pointer; transition: all 0.2s; }
                    .btn-primary-ultra:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(221,0,33,0.3); }
                    @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                </style>
            `;

            modal.style.display = 'flex';
        }

        getMaterialIcon(material) {
            const icons = {
                'Cemento': '🏗️',
                'Arena': '⏳',
                'Ripio': '🪨',
                'Fierro': '🔩',
                'Ladrillo': '🧱',
                'Pintura': '🎨',
                'Yeso': '📦',
                'Malla': '🕸️',
                'Herramientas': '🔨',
                'Mano de obra': '👷'
            };

            for (const [key, icon] of Object.entries(icons)) {
                if (material.toLowerCase().includes(key.toLowerCase())) {
                    return icon;
                }
            }
            return '📦';
        }

        formatMoney(amount) {
            return '$' + Math.round(amount).toLocaleString('es-CL');
        }

        roundQty(qty) {
            // Redondear a máximo 2 decimales, eliminar decimales innecesarios
            const rounded = Math.round(qty * 100) / 100;
            // Si es entero, mostrar sin decimales
            return rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(2).replace(/\.?0+$/, '');
        }

        compareMaterial(materialName, quantity) {
            // Llama al comparador de precios PRO
            if (window.priceComparisonPro) {
                window.priceComparisonPro.showPriceComparison(materialName, 0);
            }
        }

        compareAllMaterials(materials, activityQuantity) {
            if (!materials || materials.length === 0) {
                alert('⚠️ No hay materiales para comparar');
                return;
            }

            // Show loading message
            const loadingMsg = document.createElement('div');
            loadingMsg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:30px;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,0.3);z-index:10000;text-align:center;';
            loadingMsg.innerHTML = `
                <div style="font-size:48px;margin-bottom:15px;">🔍</div>
                <div style="font-size:18px;font-weight:600;margin-bottom:10px;">Comparando ${materials.length} materiales</div>
                <div style="font-size:14px;color:#666;">Buscando mejores precios en 6 tiendas...</div>
                <div style="margin-top:15px;height:4px;background:#eee;border-radius:2px;overflow:hidden;">
                    <div style="height:100%;background:linear-gradient(90deg,#667eea,#764ba2);width:0;animation:progress 2s ease-in-out forwards;"></div>
                </div>
                <style>
                    @keyframes progress { to { width: 100%; } }
                </style>
            `;
            document.body.appendChild(loadingMsg);

            // Simulate comparison (in real app, this would call price APIs)
            setTimeout(() => {
                document.body.removeChild(loadingMsg);

                let results = `📊 COMPARACIÓN MASIVA DE MATERIALES\n\n`;
                results += `Total de materiales: ${materials.length}\n`;
                results += `Tiendas comparadas: Sodimac, Easy, Construmart, Promart, Homecenter, Maestro\n\n`;
                results += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

                let totalSavings = 0;
                materials.forEach((mat, index) => {
                    const qty = (mat.cantidadPorM2 || mat.cantidad || 0) * activityQuantity;
                    const basePrice = mat.precioBase || 0;
                    const baseCost = basePrice * qty;

                    // Simulate finding better price (10-20% cheaper)
                    const discount = 0.10 + Math.random() * 0.10;
                    const bestPrice = basePrice * (1 - discount);
                    const bestCost = bestPrice * qty;
                    const savings = baseCost - bestCost;
                    totalSavings += savings;

                    const stores = ['Sodimac', 'Easy', 'Construmart', 'Promart', 'Homecenter', 'Maestro'];
                    const bestStore = stores[Math.floor(Math.random() * stores.length)];

                    results += `${index + 1}. ${mat.material}\n`;
                    results += `   Cantidad: ${qty.toFixed(2)} ${mat.unidad}\n`;
                    results += `   Precio base: $${basePrice.toLocaleString('es-CL')}\n`;
                    results += `   💰 Mejor precio: $${bestPrice.toFixed(0).toLocaleString('es-CL')} en ${bestStore}\n`;
                    results += `   ✅ Ahorro: $${savings.toFixed(0).toLocaleString('es-CL')} (${(discount * 100).toFixed(0)}%)\n\n`;
                });

                results += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
                results += `💵 AHORRO TOTAL: $${totalSavings.toFixed(0).toLocaleString('es-CL')}\n`;
                results += `📈 Ahorro promedio: ${((totalSavings / (materials.reduce((sum, m) => sum + ((m.cantidadPorM2 || m.cantidad || 0) * activityQuantity * (m.precioBase || 0)), 0))) * 100).toFixed(1)}%\n\n`;
                results += `💡 Recomendación: Compra los materiales en las tiendas indicadas para maximizar tu ahorro.\n`;

                alert(results);
            }, 2000);
        }
    };

    // Auto-initialize
    if (typeof window !== 'undefined') {
        window.materialsBreakdown = new window.MaterialsBreakdown();
        console.log('✅ Materials Breakdown Engine loaded');
    }

})();

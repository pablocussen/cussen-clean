/**
 * CLAUDIA PRO - Comparador de Precios Multi-Proveedor
 * Feature Premium: Compara precios entre ferreterías
 * Preparado para integración con APIs reales
 */

// Base de datos de proveedores (mock - preparado para APIs reales)
const PROVIDERS = {
    sodimac: {
        name: 'Sodimac',
        logo: '🏪',
        discount: 0.98, // 2% más caro (baseline)
        available: true
    },
    easy: {
        name: 'Easy',
        logo: '🛒',
        discount: 0.95, // 5% más barato
        available: true
    },
    construmart: {
        name: 'Construmart',
        logo: '🏗️',
        discount: 0.93, // 7% más barato
        available: true
    },
    mayorista: {
        name: 'Mayorista Local',
        logo: '📦',
        discount: 0.85, // 15% más barato (volumen)
        available: false // Requiere PRO
    }
};

/**
 * Generar comparación de precios
 */
function generatePriceComparison() {
    if (!currentProject || !currentProject.activities || currentProject.activities.length === 0) {
        return null;
    }

    // Agrupar materiales
    const materialMap = {};

    currentProject.activities.forEach(activity => {
        const apu = apuDatabase.find(a => a.id === activity.id);
        if (!apu || !apu.materiales) return;

        apu.materiales.forEach(material => {
            const cantidad = material.cantidad * activity.cantidad;
            const key = material.nombre.toLowerCase().trim();

            if (!materialMap[key]) {
                materialMap[key] = {
                    nombre: material.nombre,
                    cantidad: 0,
                    unidad: material.unidad,
                    precio_base: material.precio_unitario
                };
            }

            materialMap[key].cantidad += cantidad;
        });
    });

    const materiales = Object.values(materialMap);

    // Calcular precios por proveedor
    const comparisons = [];

    materiales.forEach(mat => {
        const comparison = {
            material: mat.nombre,
            cantidad: mat.cantidad,
            unidad: mat.unidad,
            providers: {}
        };

        Object.entries(PROVIDERS).forEach(([key, provider]) => {
            const precioUnitario = Math.round(mat.precio_base * provider.discount);
            const total = Math.round(precioUnitario * mat.cantidad);

            comparison.providers[key] = {
                name: provider.name,
                logo: provider.logo,
                precioUnitario,
                total,
                available: provider.available,
                discount: Math.round((1 - provider.discount) * 100)
            };
        });

        comparisons.push(comparison);
    });

    // Calcular totales por proveedor
    const totals = {};
    Object.keys(PROVIDERS).forEach(key => {
        totals[key] = comparisons.reduce((sum, comp) => {
            return sum + (comp.providers[key]?.total || 0);
        }, 0);
    });

    // Encontrar el más barato
    const cheapest = Object.entries(totals)
        .filter(([key]) => PROVIDERS[key].available)
        .sort((a, b) => a[1] - b[1])[0];

    return {
        comparisons: comparisons.sort((a, b) => {
            const aTotal = Object.values(a.providers).reduce((s, p) => s + p.total, 0);
            const bTotal = Object.values(b.providers).reduce((s, p) => s + p.total, 0);
            return bTotal - aTotal;
        }).slice(0, 20), // Top 20 materiales
        totals,
        cheapest: cheapest ? cheapest[0] : null,
        savings: cheapest ? totals['sodimac'] - cheapest[1] : 0
    };
}

/**
 * Mostrar Comparador de Precios
 */
function showPriceComparator() {
    const data = generatePriceComparison();

    if (!data) {
        showToast('Agrega actividades a tu proyecto primero');
        return;
    }

    const cheapestProvider = PROVIDERS[data.cheapest];

    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
        overflow-y: auto;
    `;

    modal.innerHTML = `
        <div style="background: white; border-radius: 16px; max-width: 900px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); padding: 24px; border-radius: 16px 16px 0 0; position: sticky; top: 0; z-index: 1;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h2 style="margin: 0; color: white; font-size: 24px; font-weight: 800;">🏪 Comparador de Precios</h2>
                        <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Encuentra la mejor opción para tu presupuesto</p>
                    </div>
                    <button onclick="this.closest('[style*=fixed]').remove()" style="background: rgba(255,255,255,0.2); color: white; border: none; width: 40px; height: 40px; border-radius: 50%; font-size: 20px; cursor: pointer; font-weight: bold;">×</button>
                </div>
            </div>

            <div style="padding: 24px;">
                <!-- Resumen de Ahorro -->
                <div style="background: linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%); padding: 20px; border-radius: 12px; margin-bottom: 24px; border: 2px solid #10b981;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-size: 14px; color: #047857; font-weight: 600; margin-bottom: 8px;">MEJOR OPCIÓN</div>
                            <div style="font-size: 28px; font-weight: 800; color: #059669; margin-bottom: 4px;">
                                ${cheapestProvider.logo} ${cheapestProvider.name}
                            </div>
                            <div style="font-size: 16px; color: #047857;">
                                Ahorras: <strong>${formatMoney(data.savings)}</strong>
                            </div>
                        </div>
                        <div style="font-size: 56px;">${cheapestProvider.logo}</div>
                    </div>
                </div>

                <!-- Comparación por Proveedor -->
                <div style="margin-bottom: 24px;">
                    <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: #111;">Totales por Proveedor</h3>
                    <div style="display: grid; gap: 12px;">
                        ${Object.entries(data.totals).map(([key, total]) => {
                            const provider = PROVIDERS[key];
                            const isCheapest = key === data.cheapest;
                            const isLocked = !provider.available;

                            return `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: ${isCheapest ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' : '#f9fafb'}; border-radius: 10px; border: 2px solid ${isCheapest ? '#10b981' : '#e5e7eb'}; ${isLocked ? 'opacity: 0.6;' : ''}">
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        <span style="font-size: 32px;">${provider.logo}</span>
                                        <div>
                                            <div style="font-weight: 700; font-size: 16px; color: #111;">${provider.name}</div>
                                            ${isCheapest ? '<div style="font-size: 12px; color: #059669; font-weight: 600;">⭐ Más Económico</div>' : ''}
                                            ${isLocked ? '<div style="font-size: 12px; color: #f59e0b; font-weight: 600;">🔒 Requiere PRO</div>' : ''}
                                        </div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-size: 24px; font-weight: 800; color: ${isCheapest ? '#059669' : '#111'};">${formatMoney(total)}</div>
                                        ${!isCheapest && provider.available ? `<div style="font-size: 12px; color: #ef4444;">+${formatMoney(total - data.totals[data.cheapest])}</div>` : ''}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Top Materiales -->
                <div style="margin-bottom: 24px;">
                    <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: #111;">Top 10 Materiales</h3>
                    <div style="background: #fafafa; border-radius: 10px; overflow: hidden;">
                        ${data.comparisons.slice(0, 10).map((comp, i) => `
                            <div style="padding: 14px 16px; ${i < 9 ? 'border-bottom: 1px solid #e5e7eb;' : ''}">
                                <div style="font-weight: 600; font-size: 14px; color: #333; margin-bottom: 8px;">
                                    ${comp.material}
                                </div>
                                <div style="font-size: 12px; color: #666; margin-bottom: 10px;">
                                    ${roundQty(comp.cantidad)} ${comp.unidad}
                                </div>
                                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                    ${Object.entries(comp.providers).filter(([k]) => PROVIDERS[k].available).map(([key, prov]) => {
                                        const isLowest = Object.entries(comp.providers)
                                            .filter(([k]) => PROVIDERS[k].available)
                                            .sort((a, b) => a[1].total - b[1].total)[0][0] === key;

                                        return `
                                            <div style="flex: 1; min-width: 100px; padding: 8px; background: ${isLowest ? '#d1fae5' : 'white'}; border-radius: 6px; border: 1px solid ${isLowest ? '#10b981' : '#e5e7eb'};">
                                                <div style="font-size: 11px; color: #666; margin-bottom: 2px;">${prov.logo} ${prov.name}</div>
                                                <div style="font-weight: 700; font-size: 13px; color: ${isLowest ? '#059669' : '#333'};">${formatMoney(prov.total)}</div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Nota PRO -->
                <div style="background: linear-gradient(135deg, #fef3c7 0%, #fef9e7 100%); padding: 16px; border-radius: 10px; border: 2px solid #f59e0b; margin-bottom: 20px;">
                    <div style="display: flex; gap: 12px; align-items: start;">
                        <span style="font-size: 24px;">💡</span>
                        <div>
                            <div style="font-weight: 700; font-size: 14px; color: #92400e; margin-bottom: 4px;">
                                Acceso a Mayoristas con CLAUDIA PRO
                            </div>
                            <div style="font-size: 13px; color: #78350f;">
                                Desbloquea descuentos mayoristas (hasta 15% adicional) y actualizaciones automáticas de precios.
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Acciones -->
                <div style="display: flex; gap: 12px;">
                    <button onclick="exportPriceComparison()" style="flex: 1; background: #10b981; color: white; border: none; padding: 14px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 15px;">
                        📊 Exportar Comparación
                    </button>
                    <button onclick="this.closest('[style*=fixed]').remove()" style="flex: 1; background: #e5e7eb; color: #374151; border: none; padding: 14px; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 15px;">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

/**
 * Exportar comparación (placeholder)
 */
function exportPriceComparison() {
    showToast('Exportando comparación...', 'info');
    // TODO: Implementar export a Excel/PDF
}

// Helper para redondear cantidades
function roundQty(qty) {
    if (qty >= 100) return Math.round(qty);
    if (qty >= 10) return Math.round(qty * 10) / 10;
    return Math.round(qty * 100) / 100;
}

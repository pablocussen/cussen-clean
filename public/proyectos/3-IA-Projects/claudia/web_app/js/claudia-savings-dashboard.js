/**
 * CLAUDIA PRO - Dashboard de Ahorro
 * Feature Premium: Muestra potencial de ahorro en compras mayoristas
 * Valor para monetización: Justifica suscripción PRO
 */

/**
 * Calcular potencial de ahorro
 */
function calculateSavingsPotential() {
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
                    precio_unitario: material.precio_unitario,
                    total: 0
                };
            }

            materialMap[key].cantidad += cantidad;
            materialMap[key].total += cantidad * material.precio_unitario;
        });
    });

    const materiales = Object.values(materialMap);
    const totalMateriales = materiales.reduce((sum, m) => sum + m.total, 0);

    // Calcular descuentos potenciales
    const savings = {
        bulk15: totalMateriales * 0.15,      // Descuento mayorista 15%
        bulk20: totalMateriales * 0.20,      // Descuento mayorista 20%
        comparison: totalMateriales * 0.12,  // Comparar precios 12%
        timing: totalMateriales * 0.08,      // Comprar en momento óptimo 8%
        total: totalMateriales
    };

    savings.maxPotential = savings.bulk20 + savings.comparison + savings.timing;
    savings.conservativePotential = savings.bulk15 + (savings.comparison * 0.5);

    return {
        materiales: materiales.filter(m => m.total > 10000).sort((a,b) => b.total - a.total).slice(0,10),
        totalMateriales,
        savings,
        topSavings: materiales
            .filter(m => m.total > 50000)
            .sort((a,b) => b.total - a.total)
            .slice(0, 5)
    };
}

/**
 * Mostrar Dashboard de Ahorro
 */
function showSavingsDashboard() {
    const data = calculateSavingsPotential();

    if (!data) {
        showToast('Agrega actividades a tu proyecto primero');
        return;
    }

    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
        overflow-y: auto;
    `;

    modal.innerHTML = `
        <div style="background: white; border-radius: 16px; max-width: 800px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #10b981 0%, #047857 100%); padding: 24px; border-radius: 16px 16px 0 0; position: sticky; top: 0; z-index: 1;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h2 style="margin: 0; color: white; font-size: 24px; font-weight: 800;">💰 Dashboard de Ahorro</h2>
                        <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Descubre cuánto puedes ahorrar</p>
                    </div>
                    <button onclick="this.closest('[style*=fixed]').remove()" style="background: rgba(255,255,255,0.2); color: white; border: none; width: 40px; height: 40px; border-radius: 50%; font-size: 20px; cursor: pointer; font-weight: bold;">×</button>
                </div>
            </div>

            <!-- Potencial de Ahorro -->
            <div style="padding: 24px;">
                <!-- Ahorro Conservador -->
                <div style="background: linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%); padding: 24px; border-radius: 12px; margin-bottom: 20px; border: 2px solid #10b981;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <div>
                            <div style="font-size: 14px; color: #047857; font-weight: 600; margin-bottom: 4px;">AHORRO ESTIMADO</div>
                            <div style="font-size: 36px; font-weight: 800; color: #059669;">${formatMoney(data.savings.conservativePotential)}</div>
                        </div>
                        <div style="font-size: 48px;">💵</div>
                    </div>
                    <div style="font-size: 13px; color: #065f46;">
                        Comprando en mayoristas y comparando precios
                    </div>
                </div>

                <!-- Ahorro Máximo Potencial -->
                <div style="background: linear-gradient(135deg, #fef3c7 0%, #fef9e7 100%); padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 2px solid #f59e0b;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-size: 13px; color: #92400e; font-weight: 600; margin-bottom: 4px;">MÁXIMO POTENCIAL</div>
                            <div style="font-size: 28px; font-weight: 800; color: #d97706;">${formatMoney(data.savings.maxPotential)}</div>
                        </div>
                        <div style="font-size: 36px;">🎯</div>
                    </div>
                    <div style="font-size: 12px; color: #78350f; margin-top: 8px;">
                        Con estrategia completa de compras
                    </div>
                </div>

                <!-- Desglose de Ahorros -->
                <div style="margin-bottom: 24px;">
                    <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: #111;">Oportunidades de Ahorro</h3>

                    <div style="display: grid; gap: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px; background: #f9fafb; border-radius: 8px;">
                            <div>
                                <div style="font-weight: 600; color: #333;">Compra Mayorista (15-20%)</div>
                                <div style="font-size: 12px; color: #666;">Descuentos por volumen</div>
                            </div>
                            <div style="font-weight: 700; color: #10b981;">${formatMoney(data.savings.bulk15)}</div>
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px; background: #f9fafb; border-radius: 8px;">
                            <div>
                                <div style="font-weight: 600; color: #333;">Comparar Precios (12%)</div>
                                <div style="font-size: 12px; color: #666;">Entre 3-4 proveedores</div>
                            </div>
                            <div style="font-weight: 700; color: #10b981;">${formatMoney(data.savings.comparison)}</div>
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px; background: #f9fafb; border-radius: 8px;">
                            <div>
                                <div style="font-weight: 600; color: #333;">Timing de Compra (8%)</div>
                                <div style="font-size: 12px; color: #666;">Ofertas y promociones</div>
                            </div>
                            <div style="font-weight: 700; color: #10b981;">${formatMoney(data.savings.timing)}</div>
                        </div>
                    </div>
                </div>

                <!-- Top Materiales para Ahorrar -->
                ${data.topSavings.length > 0 ? `
                <div style="margin-bottom: 24px;">
                    <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: #111;">Top Materiales para Negociar</h3>
                    <div style="background: #fafafa; padding: 16px; border-radius: 10px;">
                        ${data.topSavings.map((m, i) => `
                            <div style="display: flex; justify-content: space-between; padding: 10px 0; ${i < data.topSavings.length - 1 ? 'border-bottom: 1px solid #e5e7eb;' : ''}">
                                <div style="flex: 1;">
                                    <div style="font-weight: 600; font-size: 14px; color: #333;">${i + 1}. ${m.nombre}</div>
                                    <div style="font-size: 12px; color: #666;">${roundQty(m.cantidad)} ${m.unidad}</div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-weight: 700; color: #10b981;">${formatMoney(m.total)}</div>
                                    <div style="font-size: 11px; color: #666;">Ahorro: ${formatMoney(m.total * 0.15)}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Call to Action -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px; text-align: center; color: white;">
                    <div style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">🚀 Ahorra más con CLAUDIA PRO</div>
                    <div style="font-size: 14px; margin-bottom: 16px; opacity: 0.9;">
                        Comparador de precios automático, alertas de ofertas y más
                    </div>
                    <button onclick="showPremiumModal()" style="background: white; color: #667eea; border: none; padding: 14px 28px; border-radius: 8px; font-weight: 700; font-size: 15px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                        Ver Planes PRO
                    </button>
                </div>

                <!-- Cerrar -->
                <div style="text-align: center; margin-top: 20px;">
                    <button onclick="this.closest('[style*=fixed]').remove()" style="background: #e5e7eb; color: #374151; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer;">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

/**
 * Helper function to round quantities
 */
function roundQty(qty) {
    if (qty >= 100) return Math.round(qty);
    if (qty >= 10) return Math.round(qty * 10) / 10;
    return Math.round(qty * 100) / 100;
}

/**
 * Show Premium Modal (placeholder)
 */
function showPremiumModal() {
    showToast('Planes PRO disponibles próximamente', 'info');
}

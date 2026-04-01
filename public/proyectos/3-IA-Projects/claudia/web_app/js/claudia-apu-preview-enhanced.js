/**
 * CLAUDIA - APU Preview Enhanced
 * Previsualización espectacular de APUs con breakdown detallado
 * @version 2.0
 */

console.log('[APU-PREVIEW] 🎨 Módulo mejorado cargado');

// ===== FUNCIÓN PRINCIPAL DE PREVIEW =====

window.showAPUPreviewEnhanced = function(apuData) {
    console.log('[APU-PREVIEW] 📋 Mostrando preview mejorado:', apuData);

    const modal = document.getElementById('apu-preview-modal');
    const previewContent = document.getElementById('preview-apu-content');
    const previewName = document.getElementById('preview-apu-name');
    const previewCategoria = document.getElementById('preview-apu-categoria');
    const addBtn = document.getElementById('preview-add-btn');

    if (!modal || !previewContent) {
        console.error('[APU-PREVIEW] ❌ Modal no encontrado');
        return;
    }

    // Actualizar título y categoría
    previewName.textContent = apuData.name || apuData.actividad || 'Actividad';
    previewCategoria.textContent = apuData.categoria || 'Sin categoría';

    // Generar contenido espectacular
    const content = generateEnhancedPreview(apuData);
    previewContent.innerHTML = content;

    // Configurar botón de agregar
    addBtn.onclick = () => {
        if (typeof window.addToProject === 'function') {
            window.addToProject(apuData);
            closeAPUPreview();
        }
    };

    // Mostrar modal con animación
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.style.opacity = '1';
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.transform = 'scale(1)';
        }
    }, 10);
};

// ===== GENERAR CONTENIDO ESPECTACULAR =====

function generateEnhancedPreview(apu) {
    const unidad = apu.unidad || 'un';
    const precio = apu.precio || apu.precio_unitario || 0;
    const rendimiento = apu.rendimiento || '-';

    let html = '';

    // 1. CARD DE PRECIO PRINCIPAL
    html += `
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 24px; border-radius: 12px; margin-bottom: 24px; color: white; text-align: center; box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);">
        <div style="font-size: 16px; opacity: 0.95; margin-bottom: 8px;">💰 Precio Unitario</div>
        <div style="font-size: 48px; font-weight: 800; margin-bottom: 8px;">
            $${formatNumber(precio)}
        </div>
        <div style="font-size: 14px; opacity: 0.9;">por ${unidad}</div>
    </div>`;

    // 2. INFORMACIÓN BÁSICA
    html += `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 24px;">
        <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; text-align: center; border-left: 4px solid #10b981;">
            <div style="font-size: 24px; margin-bottom: 4px;">📏</div>
            <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Unidad</div>
            <div style="font-size: 16px; font-weight: 700; color: #047857;">${unidad}</div>
        </div>
        <div style="background: #fef3c7; padding: 16px; border-radius: 8px; text-align: center; border-left: 4px solid #f59e0b;">
            <div style="font-size: 24px; margin-bottom: 4px;">⚡</div>
            <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Rendimiento</div>
            <div style="font-size: 16px; font-weight: 700; color: #92400e;">${rendimiento}</div>
        </div>
    </div>`;

    // 3. BREAKDOWN DE COSTOS
    if (apu.materiales || apu.mano_obra || apu.herramientas) {
        html += `<div style="margin-bottom: 24px;">
            <h3 style="font-size: 16px; font-weight: 700; color: #1f2937; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                <span>📊</span>
                <span>Desglose de Costos</span>
            </h3>`;

        // Materiales
        if (apu.materiales && apu.materiales.length > 0) {
            const totalMateriales = apu.materiales.reduce((sum, m) => sum + (m.subtotal || 0), 0);
            html += `
            <div style="background: #eff6ff; padding: 16px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid #3b82f6;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <div style="font-size: 14px; font-weight: 600; color: #1e40af;">🧱 Materiales</div>
                    <div style="font-size: 16px; font-weight: 700; color: #1e3a8a;">$${formatNumber(totalMateriales)}</div>
                </div>
                ${apu.materiales.map(m => `
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-top: 1px solid #dbeafe; font-size: 13px;">
                        <span style="color: #475569;">${m.nombre || m.material || 'Material'}</span>
                        <span style="font-weight: 600; color: #1e40af;">$${formatNumber(m.subtotal || 0)}</span>
                    </div>
                `).join('')}
            </div>`;
        }

        // Mano de Obra
        if (apu.mano_obra && apu.mano_obra.length > 0) {
            const totalManoObra = apu.mano_obra.reduce((sum, m) => sum + (m.subtotal || 0), 0);
            html += `
            <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid #f59e0b;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <div style="font-size: 14px; font-weight: 600; color: #92400e;">👷 Mano de Obra</div>
                    <div style="font-size: 16px; font-weight: 700; color: #78350f;">$${formatNumber(totalManoObra)}</div>
                </div>
                ${apu.mano_obra.map(m => `
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-top: 1px solid #fef3c7; font-size: 13px;">
                        <span style="color: #475569;">${m.nombre || m.especialidad || 'Trabajador'}</span>
                        <span style="font-weight: 600; color: #92400e;">$${formatNumber(m.subtotal || 0)}</span>
                    </div>
                `).join('')}
            </div>`;
        }

        // Herramientas/Equipos
        if (apu.herramientas && apu.herramientas.length > 0) {
            const totalHerramientas = apu.herramientas.reduce((sum, h) => sum + (h.subtotal || 0), 0);
            html += `
            <div style="background: #f3e8ff; padding: 16px; border-radius: 8px; border-left: 4px solid #a855f7;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <div style="font-size: 14px; font-weight: 600; color: #6b21a8;">🛠️ Herramientas/Equipos</div>
                    <div style="font-size: 16px; font-weight: 700; color: #581c87;">$${formatNumber(totalHerramientas)}</div>
                </div>
                ${apu.herramientas.map(h => `
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-top: 1px solid #f3e8ff; font-size: 13px;">
                        <span style="color: #475569;">${h.nombre || h.herramienta || 'Herramienta'}</span>
                        <span style="font-weight: 600; color: #6b21a8;">$${formatNumber(h.subtotal || 0)}</span>
                    </div>
                `).join('')}
            </div>`;
        }

        html += `</div>`;
    }

    // 4. DESCRIPCIÓN
    if (apu.descripcion) {
        html += `
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #64748b; margin-bottom: 16px;">
            <div style="font-size: 14px; font-weight: 600; color: #334155; margin-bottom: 8px;">📝 Descripción</div>
            <div style="font-size: 13px; color: #475569; line-height: 1.6;">${apu.descripcion}</div>
        </div>`;
    }

    // 5. TIPS PRO
    html += `
    <div style="background: linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 100%); padding: 16px; border-radius: 8px; border-left: 4px solid #6366f1;">
        <div style="font-size: 14px; font-weight: 600; color: #3730a3; margin-bottom: 8px;">💡 Tips Profesionales</div>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #4338ca; line-height: 1.8;">
            <li>Verifica disponibilidad de materiales antes de cotizar</li>
            <li>Considera variaciones de precio según proveedor</li>
            <li>Incluye margen de contingencia del 10-15%</li>
        </ul>
    </div>`;

    return html;
}

// ===== FUNCIÓN DE CERRAR =====

window.closeAPUPreview = function() {
    const modal = document.getElementById('apu-preview-modal');
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
};

// ===== UTILIDADES =====

function formatNumber(num) {
    if (!num || isNaN(num)) return '0';
    return parseFloat(num).toLocaleString('es-CL', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

// ===== ESTILOS ADICIONALES PARA MODAL =====

// Agregar animación al modal
const style = document.createElement('style');
style.textContent = `
    #apu-preview-modal {
        transition: opacity 0.3s ease;
        opacity: 0;
    }

    #apu-preview-modal.active {
        opacity: 1;
    }

    #apu-preview-modal .modal-content {
        transform: scale(0.9);
        transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }

    #apu-preview-modal.active .modal-content {
        transform: scale(1);
    }
`;
document.head.appendChild(style);

console.log('[APU-PREVIEW] ✅ Módulo listo');

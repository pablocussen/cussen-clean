/**
 * CLAUDIA PRO - Smart Suggestions System
 * Sugerencias inteligentes basadas en las actividades del proyecto
 * Hace que CLAUDIA esté VIVA y sea proactiva
 */

// Base de conocimiento de relaciones entre actividades
const ACTIVITY_RELATIONSHIPS = {
    // Si agrega Radier, sugerir:
    'radier': {
        related: ['Excavación', 'Compactación', 'Polietileno', 'Enfierradura'],
        reason: 'Un radier requiere preparación del terreno primero',
        priority: 'high'
    },
    'excavacion': {
        related: ['Compactación', 'Radier', 'Relleno'],
        reason: 'Después de excavar hay que compactar y rellenar',
        priority: 'high'
    },
    'albanileria': {
        related: ['Estuco', 'Moldaje', 'Hormigón', 'Fierro'],
        reason: 'La albañilería necesita estructura y terminaciones',
        priority: 'medium'
    },
    'muro': {
        related: ['Estuco', 'Pintura', 'Moldaje pilares'],
        reason: 'Los muros necesitan terminaciones',
        priority: 'medium'
    },
    'estuco': {
        related: ['Pintura', 'Barniz'],
        reason: 'Sobre el estuco va la pintura final',
        priority: 'medium'
    },
    'ceramica': {
        related: ['Pasta muro', 'Fragüe', 'Guarda polvo'],
        reason: 'La cerámica necesita pegamento y terminaciones',
        priority: 'medium'
    },
    'techo': {
        related: ['Cubierta', 'Aislación', 'Cielo', 'Canal'],
        reason: 'El techo necesita impermeabilización y aislación',
        priority: 'high'
    },
    'electr': {
        related: ['Enchufes', 'Interruptores', 'Tablero'],
        reason: 'La instalación eléctrica necesita complementos',
        priority: 'high'
    },
    'agua': {
        related: ['Grifería', 'Desagüe', 'Alcantarillado'],
        reason: 'Las cañerías necesitan conexiones y terminaciones',
        priority: 'high'
    },
    'ventana': {
        related: ['Cortinero', 'Silicona', 'Tapamarcos'],
        reason: 'Las ventanas necesitan terminaciones',
        priority: 'low'
    },
    'puerta': {
        related: ['Cerradura', 'Bisagra', 'Tapamarcos'],
        reason: 'Las puertas necesitan herrajes',
        priority: 'low'
    }
};

/**
 * Obtener sugerencias inteligentes basadas en la última actividad agregada
 */
function getSmartSuggestions(activityName) {
    const suggestions = [];
    const activityLower = activityName.toLowerCase();

    // Buscar coincidencias en la base de conocimiento
    for (const [keyword, data] of Object.entries(ACTIVITY_RELATIONSHIPS)) {
        if (activityLower.includes(keyword)) {
            // Verificar qué actividades relacionadas NO están en el proyecto
            const apuDB = window.apuDatabase || [];
            const currentActivities = currentProject.activities || [];

            data.related.forEach(relatedName => {
                // Buscar si ya existe en el proyecto
                const alreadyExists = currentActivities.some(act =>
                    act.nombre.toLowerCase().includes(relatedName.toLowerCase())
                );

                if (!alreadyExists) {
                    // Buscar APU en la base de datos
                    const matchingAPUs = apuDB.filter(apu =>
                        apu.nombre.toLowerCase().includes(relatedName.toLowerCase())
                    ).slice(0, 3); // Máximo 3 sugerencias por actividad relacionada

                    if (matchingAPUs.length > 0) {
                        suggestions.push({
                            category: relatedName,
                            reason: data.reason,
                            priority: data.priority,
                            apus: matchingAPUs
                        });
                    }
                }
            });

            break; // Solo procesar la primera coincidencia
        }
    }

    return suggestions;
}

/**
 * Mostrar sugerencias en un modal atractivo
 */
function showSmartSuggestionsModal(activityName, suggestions) {
    if (!suggestions || suggestions.length === 0) return;

    // Solo mostrar para sugerencias de alta/media prioridad
    const highPriority = suggestions.filter(s => s.priority === 'high');
    const toShow = highPriority.length > 0 ? highPriority : suggestions.slice(0, 2);

    if (toShow.length === 0) return;

    const modal = document.createElement('div');
    modal.id = 'smart-suggestions-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
        backdrop-filter: blur(4px);
        animation: fadeIn 0.3s ease;
    `;

    let suggestionsHTML = '';
    toShow.forEach((sug, idx) => {
        const apu = sug.apus[0]; // Mostrar solo el primero de cada categoría
        const price = apu.precio_referencia || apu.precio_total || 0;

        suggestionsHTML += `
            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                        padding: 16px;
                        border-radius: 12px;
                        margin-bottom: 12px;
                        border-left: 4px solid #10b981;
                        cursor: pointer;
                        transition: all 0.2s;"
                 onmouseover="this.style.transform='translateX(4px)'; this.style.boxShadow='0 4px 12px rgba(16,185,129,0.3)';"
                 onmouseout="this.style.transform='translateX(0)'; this.style.boxShadow='none';"
                 onclick="selectSuggestedAPU('${apu.id}')">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                    <div style="flex: 1;">
                        <div style="font-weight: 700; font-size: 15px; color: #065f46; margin-bottom: 4px;">
                            ${apu.nombre}
                        </div>
                        <div style="font-size: 13px; color: #047857;">
                            ${apu.unidad} • ${formatMoney(price)}/${apu.unidad}
                        </div>
                    </div>
                    <button style="background: #10b981;
                                   color: white;
                                   border: none;
                                   padding: 8px 16px;
                                   border-radius: 6px;
                                   font-weight: 600;
                                   cursor: pointer;
                                   font-size: 13px;">
                        ➕ Agregar
                    </button>
                </div>
            </div>
        `;
    });

    modal.innerHTML = `
        <div style="background: white;
                    border-radius: 16px;
                    max-width: 550px;
                    width: 100%;
                    max-height: 80vh;
                    overflow-y: auto;
                    animation: slideUp 0.3s ease;">

            <!-- Header -->
            <div style="background: linear-gradient(135deg, #10b981 0%, #047857 100%);
                        padding: 24px;
                        border-radius: 16px 16px 0 0;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <div style="font-size: 28px; margin-bottom: 8px;">💡</div>
                        <h3 style="color: white; margin: 0 0 8px 0; font-size: 22px; font-weight: 800;">
                            Sugerencias Inteligentes
                        </h3>
                        <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 14px;">
                            Agregaste: <strong>"${activityName}"</strong>
                        </p>
                    </div>
                    <button onclick="closeSmartSuggestionsModal()"
                            style="background: rgba(255,255,255,0.2);
                                   color: white;
                                   border: none;
                                   width: 32px;
                                   height: 32px;
                                   border-radius: 50%;
                                   font-size: 20px;
                                   cursor: pointer;
                                   display: flex;
                                   align-items: center;
                                   justify-content: center;">
                        ×
                    </button>
                </div>
            </div>

            <!-- Content -->
            <div style="padding: 24px;">
                <div style="background: #fef3c7;
                            padding: 14px;
                            border-radius: 8px;
                            margin-bottom: 20px;
                            border-left: 3px solid #f59e0b;">
                    <div style="font-size: 13px; color: #92400e; line-height: 1.5;">
                        <strong>¿Sabías que...?</strong> ${toShow[0].reason}
                    </div>
                </div>

                <div style="margin-bottom: 16px;">
                    <div style="font-weight: 600; font-size: 14px; color: #374151; margin-bottom: 12px;">
                        También podrías necesitar:
                    </div>
                    ${suggestionsHTML}
                </div>

                <div style="text-align: center; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                    <button onclick="closeSmartSuggestionsModal()"
                            style="background: #e5e7eb;
                                   color: #374151;
                                   border: none;
                                   padding: 12px 32px;
                                   border-radius: 8px;
                                   font-weight: 600;
                                   cursor: pointer;
                                   font-size: 14px;">
                        No, gracias
                    </button>
                </div>
            </div>
        </div>

        <style>
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        </style>
    `;

    document.body.appendChild(modal);

    // Track analytics
    if (window.analytics) {
        window.analytics.track('Smart Suggestions Shown', {
            activity: activityName,
            suggestionsCount: toShow.length
        });
    }
}

/**
 * Seleccionar un APU sugerido
 */
function selectSuggestedAPU(apuId) {
    closeSmartSuggestionsModal();

    // Buscar el APU en la base de datos
    const apuDB = window.apuDatabase || [];
    const apu = apuDB.find(a => a.id === apuId);

    if (apu && typeof selectAPU === 'function') {
        // Usar la función existente para seleccionar el APU
        selectAPU(apuId);

        // Mostrar toast
        if (typeof showToast === 'function') {
            showToast(`✨ "${apu.nombre}" seleccionado`, 'success');
        }

        // Track analytics
        if (window.analytics) {
            window.analytics.track('Suggested APU Selected', {
                apuId: apuId,
                apuName: apu.nombre
            });
        }
    }
}

/**
 * Cerrar modal de sugerencias
 */
function closeSmartSuggestionsModal() {
    const modal = document.getElementById('smart-suggestions-modal');
    if (modal) {
        modal.style.animation = 'fadeOut 0.2s ease';
        setTimeout(() => modal.remove(), 200);
    }
}

/**
 * Hook para ejecutar después de agregar una actividad
 */
function onActivityAdded(activity) {
    // Esperar 1 segundo para que el usuario vea su actividad agregada
    setTimeout(() => {
        const suggestions = getSmartSuggestions(activity.nombre);

        if (suggestions.length > 0) {
            // Solo mostrar si no es la primera actividad (para no abrumar)
            const activityCount = currentProject.activities?.length || 0;

            if (activityCount > 1 && activityCount < 8) {
                // Mostrar sugerencias solo entre la 2da y 7ma actividad
                showSmartSuggestionsModal(activity.nombre, suggestions);
            }
        }
    }, 1500);
}

// CSS adicional para fadeOut
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);

// Exportar funciones globales
window.onActivityAdded = onActivityAdded;
window.selectSuggestedAPU = selectSuggestedAPU;
window.closeSmartSuggestionsModal = closeSmartSuggestionsModal;

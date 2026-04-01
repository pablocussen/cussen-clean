/**
 * CLAUDIA APU Enhancements v5.2
 * Mejoras de rendimiento y UX para la búsqueda de APUs
 * - Paginación infinita
 * - Virtual scrolling
 * - Skeleton loaders
 * - Scroll optimizado
 */

'use strict';

// ============================================
// CONFIGURACIÓN DE PAGINACIÓN
// ============================================

const APU_PAGINATION = {
    itemsPerPage: 20,           // Mostrar 20 APUs por página
    currentPage: 1,              // Página actual
    totalItems: 0,               // Total de items
    isLoading: false,            // Estado de carga
    hasMore: true,               // Hay más items para cargar
    scrollThreshold: 300         // Pixels antes del final para cargar más
};

// ============================================
// RENDERIZADO PAGINADO
// ============================================

/**
 * Renderiza APUs con paginación inteligente
 * Solo renderiza los primeros N items, carga más al hacer scroll
 */
function renderAPUsPaginated(apus, reset = true) {
    const grid = document.getElementById('apu-grid');

    // Reset pagination si es necesario
    if (reset) {
        APU_PAGINATION.currentPage = 1;
        APU_PAGINATION.totalItems = apus.length;
        APU_PAGINATION.hasMore = apus.length > APU_PAGINATION.itemsPerPage;
        grid.innerHTML = '';

        // Remover listener anterior si existe
        const container = grid.parentElement;
        if (container) {
            container.removeEventListener('scroll', handleAPUScroll);
        }
    }

    // No hay resultados
    if (apus.length === 0 && reset) {
        grid.innerHTML = `
            <div class="no-results animate-fadeIn">
                <div class="no-results-icon">🔍</div>
                <div class="no-results-text">No se encontraron actividades</div>
                <div class="no-results-hint">Intenta con otra búsqueda o explora las categorías</div>
            </div>
        `;
        return;
    }

    // Calcular rango de items a mostrar
    const startIndex = (APU_PAGINATION.currentPage - 1) * APU_PAGINATION.itemsPerPage;
    const endIndex = Math.min(startIndex + APU_PAGINATION.itemsPerPage, apus.length);
    const itemsToRender = apus.slice(startIndex, endIndex);

    // Renderizar items
    const html = itemsToRender.map((apu, index) => {
        const categoryIcon = getCategoryIcon(apu.categoria);
        const categoryColor = getCategoryColor(apu.categoria);
        const materialsCount = apu.materiales.length;
        const laborCount = apu.mano_obra.length;
        const isFavorite = isAPUFavorite(apu.id);

        // Animación escalonada para mejor UX
        const delay = index * 30; // 30ms entre cada item

        return `
            <div class="apu-card animate-fadeIn"
                 onclick="selectAPU('${apu.id}')"
                 style="border-left: 4px solid ${categoryColor.border}; animation-delay: ${delay}ms;">
                <div class="apu-card-header">
                    <span class="apu-category" style="background: ${categoryColor.bg}; color: ${categoryColor.text}; padding: 4px 8px; border-radius: 4px;">
                        ${categoryIcon} ${apu.categoria}
                    </span>
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}"
                            onclick="event.stopPropagation(); toggleFavorite('${apu.id}')"
                            title="${isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}">
                        ${isFavorite ? '⭐' : '☆'}
                    </button>
                </div>
                <div class="apu-card-title">${apu.nombre}</div>
                <div class="apu-card-meta">
                    <span>📦 ${materialsCount} mat.</span>
                    <span>👷 ${laborCount} M.O.</span>
                    ${apu.precio_referencia ? `<span class="apu-price">~$${formatMoney(apu.precio_referencia)}</span>` : ''}
                </div>
                <div class="apu-card-footer">
                    <button class="apu-select-btn">
                        Seleccionar <span>→</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Agregar HTML al grid (append, no replace)
    if (reset) {
        grid.innerHTML = html;
    } else {
        grid.insertAdjacentHTML('beforeend', html);
    }

    // Agregar loading indicator si hay más items
    if (endIndex < apus.length) {
        addLoadingIndicator(grid);

        // Setup scroll listener
        const container = grid.parentElement;
        if (container) {
            container.addEventListener('scroll', handleAPUScroll);
        }
    }

    // Actualizar estado
    APU_PAGINATION.isLoading = false;
    APU_PAGINATION.hasMore = endIndex < apus.length;

    // Log para debugging
    if (window.Logger) {
        Logger.info(`Renderizados ${itemsToRender.length} APUs (${startIndex}-${endIndex} de ${apus.length})`);
    }
}

/**
 * Agregar indicador de carga al final
 */
function addLoadingIndicator(grid) {
    // Remover loading anterior si existe
    const existing = grid.querySelector('.apu-loading');
    if (existing) existing.remove();

    const loadingHTML = `
        <div class="apu-loading" id="apu-loading">
            <div class="spinner"></div>
            <span>Cargando más actividades...</span>
        </div>
    `;
    grid.insertAdjacentHTML('beforeend', loadingHTML);
}

/**
 * Handler para scroll infinito
 */
function handleAPUScroll(e) {
    const container = e.target;
    const scrollPosition = container.scrollTop + container.clientHeight;
    const scrollHeight = container.scrollHeight;

    // Si estamos cerca del final y no está cargando
    if (scrollPosition >= scrollHeight - APU_PAGINATION.scrollThreshold &&
        !APU_PAGINATION.isLoading &&
        APU_PAGINATION.hasMore) {

        loadMoreAPUs();
    }
}

/**
 * Cargar más APUs
 */
function loadMoreAPUs() {
    if (APU_PAGINATION.isLoading || !APU_PAGINATION.hasMore) return;

    APU_PAGINATION.isLoading = true;
    APU_PAGINATION.currentPage++;

    // Simular pequeño delay para UX (opcional)
    setTimeout(() => {
        renderAPUsPaginated(FILTERED_APUS, false);
    }, 150);
}

// ============================================
// SKELETON LOADERS
// ============================================

/**
 * Mostrar skeleton loaders mientras carga
 */
function showAPUSkeletons(count = 6) {
    const grid = document.getElementById('apu-grid');

    const skeletons = Array.from({length: count}, () => `
        <div class="apu-card skeleton-card">
            <div class="skeleton skeleton-header"></div>
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-meta"></div>
            <div class="skeleton skeleton-footer"></div>
        </div>
    `).join('');

    grid.innerHTML = skeletons;
}

// ============================================
// MEJORAS DE SCROLL
// ============================================

/**
 * Scroll suave a la sección de APUs sin empujar el chat
 */
function scrollToAPUs() {
    const apuSection = document.getElementById('apu-grid');
    if (!apuSection) return;

    // Scroll suave al contenedor padre
    const container = apuSection.parentElement;
    if (container) {
        container.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',  // No empuja otros elementos
            inline: 'nearest'
        });
    }
}

/**
 * Mantener posición de scroll al actualizar resultados
 */
let lastScrollPosition = 0;

function saveScrollPosition() {
    const container = document.querySelector('.results-container');
    if (container) {
        lastScrollPosition = container.scrollTop;
    }
}

function restoreScrollPosition() {
    const container = document.querySelector('.results-container');
    if (container) {
        container.scrollTop = lastScrollPosition;
    }
}

// ============================================
// BÚSQUEDA OPTIMIZADA
// ============================================

/**
 * Wrapper mejorado para búsqueda con skeleton
 */
function enhancedSearch(query) {
    // Mostrar skeletons
    showAPUSkeletons(6);

    // Ejecutar búsqueda original (asumiendo que existe)
    if (typeof handleSmartSearch === 'function') {
        // Simular delay para mostrar skeletons
        setTimeout(() => {
            const event = { target: { value: query } };
            handleSmartSearch(event);
        }, 200);
    }
}

// ============================================
// FILTROS MEJORADOS
// ============================================

/**
 * Agregar contador visual a cada categoría
 */
function updateCategoryCounters() {
    if (!APU_DB) return;

    const categoryCounts = {};

    // Contar APUs por categoría
    APU_DB.actividades.forEach(apu => {
        categoryCounts[apu.categoria] = (categoryCounts[apu.categoria] || 0) + 1;
    });

    // Actualizar chips de categorías
    const categoryChips = document.querySelectorAll('.category-chip');
    categoryChips.forEach(chip => {
        const category = chip.dataset.category;
        const count = category === 'TODOS' ? APU_DB.actividades.length : categoryCounts[category] || 0;

        // Agregar badge con contador
        if (!chip.querySelector('.category-count')) {
            const badge = document.createElement('span');
            badge.className = 'category-count';
            badge.textContent = count;
            chip.appendChild(badge);
        }
    });
}

// ============================================
// VISTA INICIAL MEJORADA
// ============================================

/**
 * Mostrar vista inicial sin renderizar todas las APUs
 */
function showInitialAPUView() {
    const grid = document.getElementById('apu-grid');

    // Mostrar mensaje de bienvenida en lugar de todas las APUs
    grid.innerHTML = `
        <div class="apu-initial-view animate-fadeIn">
            <div class="initial-view-icon">🔍</div>
            <div class="initial-view-title">Busca actividades profesionales APU</div>
            <div class="initial-view-text">
                Usa el buscador o selecciona una categoría para comenzar
            </div>
            <div class="initial-view-stats">
                <div class="stat-card">
                    <div class="stat-number">${APU_DB.metadata.total_apus}</div>
                    <div class="stat-label">Actividades</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${APU_DB.metadata.categorias.length}</div>
                    <div class="stat-label">Categorías</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${getFavorites().length}</div>
                    <div class="stat-label">Favoritos</div>
                </div>
            </div>
            <div class="initial-view-suggestions">
                <div class="suggestion-label">Búsquedas populares:</div>
                <div class="suggestions-chips">
                    <button class="suggestion-chip" onclick="quickSearch('radier')">🏗️ Radier</button>
                    <button class="suggestion-chip" onclick="quickSearch('muro')">🧱 Muro</button>
                    <button class="suggestion-chip" onclick="quickSearch('excavación')">⛏️ Excavación</button>
                    <button class="suggestion-chip" onclick="quickSearch('hormigón')">🏗️ Hormigón</button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Búsqueda rápida desde chips
 */
function quickSearch(term) {
    const searchInput = document.getElementById('apu-search');
    if (searchInput) {
        searchInput.value = term;
        searchInput.dispatchEvent(new Event('input'));
    }
}

// ============================================
// OVERRIDE DE FUNCIONES ORIGINALES
// ============================================

// Guardar función original
const originalRenderAPUs = window.renderAPUs;

// Override con versión paginada
window.renderAPUs = function(apus) {
    // Si hay muy pocas APUs, usar renderizado original
    if (apus.length <= APU_PAGINATION.itemsPerPage) {
        if (originalRenderAPUs) {
            originalRenderAPUs(apus);
        }
        return;
    }

    // Usar renderizado paginado para listas largas
    renderAPUsPaginated(apus, true);
};

// Override de initAPUNavigator para mostrar vista inicial
const originalInitAPUNavigator = window.initAPUNavigator;

window.initAPUNavigator = function() {
    if (originalInitAPUNavigator) {
        originalInitAPUNavigator();
    }

    // Después de inicializar, mostrar vista inicial en lugar de todas las APUs
    setTimeout(() => {
        showInitialAPUView();
        updateCategoryCounters();
    }, 100);
};

// Override de filterByCategory para usar paginación
const originalFilterByCategory = window.filterByCategory;

window.filterByCategory = function(category) {
    // Guardar posición de scroll
    saveScrollPosition();

    // Ejecutar filtro original
    if (originalFilterByCategory) {
        originalFilterByCategory(category);
    } else {
        // Implementación fallback
        document.querySelectorAll('.category-chip').forEach(chip => {
            chip.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');

        if (category === 'TODOS') {
            FILTERED_APUS = [...APU_DB.actividades];
        } else {
            FILTERED_APUS = APU_DB.actividades.filter(apu => apu.categoria === category);
        }

        document.getElementById('apu-search').value = '';
        renderAPUs(FILTERED_APUS);
        updateResultsCount();
    }

    // Restaurar scroll
    setTimeout(restoreScrollPosition, 50);
};

// ============================================
// ESTILOS ADICIONALES
// ============================================

// Inyectar estilos para mejoras
const apuEnhancementStyles = document.createElement('style');
apuEnhancementStyles.textContent = `
    /* Vista inicial */
    .apu-initial-view {
        text-align: center;
        padding: 60px 20px;
        max-width: 600px;
        margin: 0 auto;
    }

    .initial-view-icon {
        font-size: 64px;
        margin-bottom: 20px;
        opacity: 0.8;
    }

    .initial-view-title {
        font-size: 24px;
        font-weight: 700;
        color: var(--gray-900, #111827);
        margin-bottom: 12px;
    }

    .initial-view-text {
        font-size: 16px;
        color: var(--gray-700, #374151);
        margin-bottom: 40px;
    }

    .initial-view-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-bottom: 40px;
    }

    .stat-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
    }

    .stat-number {
        font-size: 32px;
        font-weight: 700;
        margin-bottom: 4px;
    }

    .stat-label {
        font-size: 13px;
        opacity: 0.9;
    }

    .initial-view-suggestions {
        text-align: left;
    }

    .suggestion-label {
        font-size: 14px;
        font-weight: 600;
        color: var(--gray-700, #374151);
        margin-bottom: 12px;
    }

    .suggestions-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    .suggestion-chip {
        padding: 8px 16px;
        background: white;
        border: 2px solid var(--gray-200, #e5e7eb);
        border-radius: 20px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .suggestion-chip:hover {
        border-color: var(--primary-color, #667eea);
        background: var(--primary-color, #667eea);
        color: white;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    /* Loading indicator */
    .apu-loading {
        grid-column: 1 / -1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 30px;
        color: var(--gray-700, #374151);
        font-size: 14px;
    }

    /* Skeleton cards */
    .skeleton-card {
        pointer-events: none;
        cursor: default;
    }

    .skeleton {
        background: linear-gradient(90deg,
            var(--gray-200, #e5e7eb) 25%,
            var(--gray-100, #f3f4f6) 50%,
            var(--gray-200, #e5e7eb) 75%
        );
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s infinite;
        border-radius: 6px;
    }

    .skeleton-header {
        height: 24px;
        width: 60%;
        margin-bottom: 12px;
    }

    .skeleton-title {
        height: 20px;
        width: 100%;
        margin-bottom: 12px;
    }

    .skeleton-meta {
        height: 16px;
        width: 80%;
        margin-bottom: 12px;
    }

    .skeleton-footer {
        height: 36px;
        width: 100%;
    }

    /* Category counters */
    .category-count {
        display: inline-block;
        margin-left: 6px;
        padding: 2px 8px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
    }

    .category-chip.active .category-count {
        background: rgba(255, 255, 255, 0.9);
        color: var(--primary-color, #667eea);
    }

    /* Smooth scroll container */
    .results-container {
        max-height: 70vh;
        overflow-y: auto;
        scroll-behavior: smooth;
        position: relative;
    }

    /* Scroll to top button */
    .scroll-to-top {
        position: fixed;
        bottom: 80px;
        right: 20px;
        width: 48px;
        height: 48px;
        background: var(--primary-gradient, linear-gradient(135deg, #667eea 0%, #764ba2 100%));
        color: white;
        border: none;
        border-radius: 50%;
        font-size: 20px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        opacity: 0;
        pointer-events: none;
        transition: all 0.3s ease;
        z-index: 100;
    }

    .scroll-to-top.visible {
        opacity: 1;
        pointer-events: all;
    }

    .scroll-to-top:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 20px rgba(102, 126, 234, 0.5);
    }

    @media (max-width: 768px) {
        .initial-view-stats {
            grid-template-columns: 1fr;
        }

        .stat-card {
            padding: 16px;
        }

        .stat-number {
            font-size: 24px;
        }
    }
`;

document.head.appendChild(apuEnhancementStyles);

// ============================================
// SCROLL TO TOP BUTTON
// ============================================

// Agregar botón scroll to top
function addScrollToTopButton() {
    const button = document.createElement('button');
    button.className = 'scroll-to-top';
    button.innerHTML = '↑';
    button.title = 'Volver arriba';
    button.onclick = () => {
        const container = document.querySelector('.results-container');
        if (container) {
            container.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
    document.body.appendChild(button);

    // Mostrar/ocultar según scroll
    const container = document.querySelector('.results-container');
    if (container) {
        container.addEventListener('scroll', () => {
            if (container.scrollTop > 300) {
                button.classList.add('visible');
            } else {
                button.classList.remove('visible');
            }
        });
    }
}

// Agregar botón después de un pequeño delay
setTimeout(addScrollToTopButton, 1000);

// ============================================
// INICIALIZACIÓN
// ============================================

console.log('✅ CLAUDIA APU Enhancements v5.2 loaded');
console.log('📦 Features: Paginación infinita, Skeleton loaders, Vista inicial mejorada');

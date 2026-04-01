/**
 * CLAUDIA PRO - Buscador y Filtros Inteligentes
 * Features para monetización: búsqueda rápida, filtros, UX optimizada
 */

// Estado global del navegador
let allCategories = [];
let allExpanded = false;

/**
 * Buscador inteligente de APUs
 */
function filterAPUs(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    const resultsCount = document.getElementById('results-count');
    const resultsDiv = document.getElementById('search-results-count');

    if (!term) {
        // Mostrar todo si no hay búsqueda
        renderAPUNavigator();
        resultsDiv.style.display = 'none';
        return;
    }

    // Buscar en APUs
    const filtered = apuDatabase.filter(apu => {
        // Buscar en nombre
        if (apu.nombre.toLowerCase().includes(term)) return true;

        // Buscar en código/ID
        if (apu.id.toLowerCase().includes(term)) return true;

        // Buscar en categoría
        if (apu.categoria.toLowerCase().includes(term)) return true;

        // Buscar en materiales
        if (apu.materiales && apu.materiales.some(m =>
            m.nombre.toLowerCase().includes(term)
        )) return true;

        // Buscar en descripción
        if (apu.descripcion && apu.descripcion.toLowerCase().includes(term)) return true;

        return false;
    });

    // Mostrar resultados
    resultsCount.textContent = filtered.length;
    resultsDiv.style.display = 'block';

    if (filtered.length === 0) {
        document.getElementById('apu-navigator').innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #666;">
                <div style="font-size: 48px; margin-bottom: 16px;">🔍</div>
                <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">No se encontraron resultados</div>
                <div style="font-size: 14px;">Intenta con otro término: radier, excavación, pintura, etc.</div>
            </div>
        `;
        return;
    }

    // Renderizar resultados agrupados por categoría
    renderFilteredAPUs(filtered);
}

/**
 * Renderizar APUs filtrados
 */
function renderFilteredAPUs(apus) {
    const nav = document.getElementById('apu-navigator');

    // Agrupar por categoría
    const byCategory = {};
    apus.forEach(apu => {
        const cat = apu.categoria || 'OTROS';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(apu);
    });

    let html = '';

    Object.entries(byCategory).forEach(([category, items]) => {
        html += `
            <div class="apu-category" style="margin-bottom: 16px;">
                <div class="apu-category-header" onclick="toggleCategory('search-${category}')"
                     style="background: linear-gradient(135deg, #10b981 0%, #047857 100%); color: white; padding: 14px 16px; border-radius: 10px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; font-weight: 600;">
                    <span>${category} (${items.length})</span>
                    <span id="search-${category}-toggle">▼</span>
                </div>
                <div id="search-${category}" class="apu-category-items" style="display: block; padding: 8px 0;">
                    ${items.map(apu => `
                        <div class="apu-item" style="padding: 12px; margin: 4px 0; background: white; border: 1px solid #e0e0e0; border-radius: 8px; cursor: pointer; transition: all 0.2s;" onclick="selectAPU('${apu.id}')">
                            <div style="font-weight: 600; color: #333; margin-bottom: 4px;">${apu.nombre}</div>
                            <div style="font-size: 12px; color: #666; display: flex; gap: 12px; flex-wrap: wrap;">
                                <span>💰 ${formatMoney(apu.precio_referencia)}</span>
                                <span>📦 ${apu.materiales?.length || 0} materiales</span>
                                <span>⚡ ${apu.rendimiento || 'N/A'}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });

    nav.innerHTML = html;
}

/**
 * Filtrar por categoría
 */
function filterByCategory(category) {
    if (!category) {
        // Mostrar todo
        renderAPUNavigator();
        document.getElementById('search-results-count').style.display = 'none';
        return;
    }

    const filtered = apuDatabase.filter(apu => apu.categoria === category);

    const resultsCount = document.getElementById('results-count');
    const resultsDiv = document.getElementById('search-results-count');

    resultsCount.textContent = filtered.length;
    resultsDiv.style.display = 'block';

    renderFilteredAPUs(filtered);
}

/**
 * Toggle expandir/colapsar todas las categorías
 */
function toggleAllCategories() {
    allExpanded = !allExpanded;
    const btn = document.getElementById('toggle-all-btn');

    // Obtener todas las categorías expandibles
    const categories = document.querySelectorAll('[id$="-toggle"]');

    categories.forEach(toggle => {
        const categoryId = toggle.id.replace('-toggle', '');
        const items = document.getElementById(categoryId);

        if (items) {
            if (allExpanded) {
                items.style.display = 'block';
                toggle.textContent = '▼';
            } else {
                items.style.display = 'none';
                toggle.textContent = '▶';
            }
        }
    });

    btn.textContent = allExpanded ? 'Colapsar Todo' : 'Expandir Todo';
}

/**
 * Toggle individual category
 */
function toggleCategory(categoryId) {
    const items = document.getElementById(categoryId);
    const toggle = document.getElementById(categoryId + '-toggle');

    if (items.style.display === 'none') {
        items.style.display = 'block';
        toggle.textContent = '▼';
    } else {
        items.style.display = 'none';
        toggle.textContent = '▶';
    }
}

/**
 * Inicializar filtro de categorías (populate select)
 */
function initCategoryFilter() {
    // Obtener categorías únicas
    const categories = [...new Set(apuDatabase.map(apu => apu.categoria))].sort();

    const select = document.getElementById('category-filter');

    categories.forEach(cat => {
        const count = apuDatabase.filter(apu => apu.categoria === cat).length;
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = `${cat} (${count})`;
        select.appendChild(option);
    });
}

// Inicializar cuando cargue el DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCategoryFilter);
} else {
    initCategoryFilter();
}

// claudia-search-optimized.js
// Sistema de búsqueda optimizado con índices
console.log('[SEARCH] 🔍 Módulo de búsqueda optimizado cargando...');

let apuIndex = null;

// Cargar índice de APUs
async function loadAPUIndex() {
    try {
        const response = await fetch('apu_index.json');
        if (!response.ok) {
            console.warn('[SEARCH] Índice no disponible, usando búsqueda estándar');
            return null;
        }
        apuIndex = await response.json();
        console.log(`[SEARCH] ✅ Índice cargado: ${apuIndex.total_categorias} categorías`);
        return apuIndex;
    } catch (error) {
        console.warn('[SEARCH] Error cargando índice:', error);
        return null;
    }
}

// Búsqueda rápida por categoría
window.searchAPUsByCategory = function(categoria) {
    if (!apuIndex || !window.apuDatabase) {
        console.warn('[SEARCH] Índice o database no disponibles');
        return [];
    }

    const categoryData = apuIndex.index[categoria];
    if (!categoryData) {
        return [];
    }

    // Obtener APUs usando los índices
    return categoryData.indices.map(i => window.apuDatabase[i]);
};

// Búsqueda optimizada con filtros
window.searchAPUsOptimized = function(searchTerm, categoria = null, precioMax = null) {
    if (!window.apuDatabase) {
        console.warn('[SEARCH] Database no disponible');
        return [];
    }

    let results = window.apuDatabase;

    // Filtrar por categoría primero (más rápido con índice)
    if (categoria && apuIndex) {
        const categoryData = apuIndex.index[categoria];
        if (categoryData) {
            results = categoryData.indices.map(i => window.apuDatabase[i]);
        }
    }

    // Filtrar por término de búsqueda
    if (searchTerm && searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase().trim();
        results = results.filter(apu => {
            const nombre = (apu.nombre || '').toLowerCase();
            const descripcion = (apu.descripcion || '').toLowerCase();
            return nombre.includes(term) || descripcion.includes(term);
        });
    }

    // Filtrar por precio
    if (precioMax) {
        results = results.filter(apu => {
            const precio = apu.precio || apu.precio_referencia || 0;
            return precio <= precioMax;
        });
    }

    return results;
};

// Obtener estadísticas de categoría
window.getCategoryStats = function(categoria) {
    if (!apuIndex) {
        return null;
    }

    const categoryData = apuIndex.index[categoria];
    if (!categoryData) {
        return null;
    }

    return {
        count: categoryData.count,
        precioMin: categoryData.precio_min !== Infinity ? categoryData.precio_min : 0,
        precioMax: categoryData.precio_max || 0,
        categoria: categoria
    };
};

// Obtener todas las categorías disponibles
window.getAllCategories = function() {
    if (!apuIndex) {
        // Fallback: extraer categorías del database
        if (!window.apuDatabase) return [];
        const cats = new Set(window.apuDatabase.map(apu => apu.categoria).filter(Boolean));
        return Array.from(cats).sort();
    }

    return apuIndex.categorias || [];
};

// Auto-completado de búsqueda
window.getSearchSuggestions = function(partial, limit = 5) {
    if (!window.apuDatabase || !partial || partial.length < 2) {
        return [];
    }

    const term = partial.toLowerCase().trim();
    const suggestions = new Set();

    for (const apu of window.apuDatabase) {
        if (suggestions.size >= limit) break;

        const nombre = (apu.nombre || '').toLowerCase();
        if (nombre.includes(term)) {
            // Extraer la parte relevante
            const words = apu.nombre.split(' ');
            for (const word of words) {
                if (word.toLowerCase().includes(term) && word.length > 2) {
                    suggestions.add(word);
                    break;
                }
            }
        }
    }

    return Array.from(suggestions).slice(0, limit);
};

// Inicializar al cargar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAPUIndex);
} else {
    loadAPUIndex();
}

console.log('[SEARCH] ✅ Módulo de búsqueda optimizado cargado');

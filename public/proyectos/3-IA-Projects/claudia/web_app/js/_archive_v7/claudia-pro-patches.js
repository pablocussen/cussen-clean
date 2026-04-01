/**
 * CLAUDIA PRO - Performance Patches v5.1
 * Apply these optimizations to existing functions
 */

'use strict';

// Periodic cleanup interval reference
let CLEANUP_INTERVAL = null;

// ============================================
// OPTIMIZED PROJECT LOADING
// ============================================

// Override loadProjects to use StorageManager
const original_loadProjects = window.loadProjects;
window.loadProjects = function() {
    if (!window.StorageManager) {
        return original_loadProjects();
    }

    const saved = StorageManager.get('claudia_projects');
    if (saved) {
        PROJECTS = saved;
    }

    // Si no hay proyectos, crear uno por defecto
    if (PROJECTS.length === 0) {
        createNewProject('Mi Proyecto');
    } else {
        // Cargar el último proyecto activo
        const lastProjectId = StorageManager.get('claudia_current_project_id');
        CURRENT_PROJECT_ID = lastProjectId || PROJECTS[0].id;
    }

    renderProjectSelector();
    loadCurrentProject();
};

// ============================================
// OPTIMIZED PROJECT SAVING
// ============================================

const original_saveProjects = window.saveProjects;
window.saveProjects = function() {
    if (!window.StorageManager) {
        return original_saveProjects();
    }

    StorageManager.set('claudia_projects', PROJECTS);
    StorageManager.set('claudia_current_project_id', CURRENT_PROJECT_ID);
};

// ============================================
// DEBOUNCED SEARCH (if exists)
// ============================================

if (window.searchAPUs && typeof window.debounce === 'function') {
    const original_searchAPUs = window.searchAPUs;
    window.searchAPUs = debounce(original_searchAPUs, 300);
    console.log('✅ Search debounced');
}

// ============================================
// OPTIMIZED CHART RENDERING
// ============================================

if (window.renderCostChart) {
    const original_renderCostChart = window.renderCostChart;

    window.renderCostChart = function() {
        // Use ChartLoader for lazy loading
        if (window.ChartLoader) {
            ChartLoader.load(() => {
                RenderOptimizer.smoothUpdate(() => {
                    original_renderCostChart();
                });
            });
        } else {
            original_renderCostChart();
        }
    };
}

// ============================================
// BATCH DOM UPDATES FOR RENDERING
// ============================================

if (window.renderProject && window.RenderOptimizer) {
    const original_renderProject = window.renderProject;

    window.renderProject = function() {
        RenderOptimizer.smoothUpdate(() => {
            original_renderProject();
        });
    };
}

// ============================================
// OPTIMIZED FAVORITES
// ============================================

if (window.getFavorites) {
    const original_getFavorites = window.getFavorites;

    window.getFavorites = function() {
        if (window.StorageManager) {
            return StorageManager.get('claudia_favorites', []);
        }
        return original_getFavorites();
    };
}

if (window.saveFavorites) {
    const original_saveFavorites = window.saveFavorites;

    window.saveFavorites = function(favorites) {
        if (window.StorageManager) {
            StorageManager.set('claudia_favorites', favorites);
        } else {
            original_saveFavorites(favorites);
        }
    };
}

// ============================================
// PERFORMANCE MONITORING WRAPPER
// ============================================

function wrapWithPerformanceMonitoring(funcName) {
    if (!window[funcName] || !window.PerformanceMonitor) return;

    const original = window[funcName];

    window[funcName] = function(...args) {
        PerformanceMonitor.start(funcName);
        const result = original.apply(this, args);
        PerformanceMonitor.end(funcName);
        return result;
    };
}

// Wrap expensive functions
['renderProject', 'renderAPUs', 'renderCostChart', 'showDashboard'].forEach(wrapWithPerformanceMonitoring);

// ============================================
// MEMORY CLEANUP ON PAGE UNLOAD
// ============================================

window.addEventListener('beforeunload', () => {
    if (window.DOMCache) DOMCache.clear();
    if (window.StorageManager) StorageManager.clearCache();
    if (window.MemoryManager) MemoryManager.cleanup();
});

// ============================================
// PERIODIC CLEANUP
// ============================================

// Clear caches every 5 minutes
CLEANUP_INTERVAL = setInterval(() => {
    if (window.DOMCache) {
        const size = DOMCache.cache.size;
        if (size > 50) { // Only clear if cache is large
            DOMCache.clear();
            console.log(`🧹 Cleared DOM cache (${size} entries)`);
        }
    }

    if (window.StorageManager) {
        const size = StorageManager.readCache.size;
        if (size > 20) {
            StorageManager.clearCache();
            console.log(`🧹 Cleared Storage cache (${size} entries)`);
        }
    }
}, 300000); // 5 minutes

console.log('✅ CLAUDIA Pro Patches v5.1 applied');

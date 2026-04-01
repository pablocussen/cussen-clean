/**
 * CLAUDIA Web Worker v6.7.2
 * Offload heavy computations to background thread
 * Prevents UI blocking for large datasets
 */

'use strict';

// Worker message handler
self.addEventListener('message', function(e) {
    const { type, data, id } = e.data;

    try {
        let result;

        switch (type) {
            case 'SEARCH_APUS':
                result = searchAPUs(data);
                break;

            case 'CALCULATE_BUDGET':
                result = calculateBudget(data);
                break;

            case 'COMPARE_PRICES':
                result = comparePrices(data);
                break;

            case 'FILTER_ACTIVITIES':
                result = filterActivities(data);
                break;

            case 'SORT_ACTIVITIES':
                result = sortActivities(data);
                break;

            case 'EXPORT_DATA':
                result = exportData(data);
                break;

            case 'COMPRESS_DATA':
                result = compressData(data);
                break;

            case 'DECOMPRESS_DATA':
                result = decompressData(data);
                break;

            default:
                throw new Error(`Unknown task type: ${type}`);
        }

        // Send result back to main thread
        self.postMessage({
            id,
            type: `${type}_COMPLETE`,
            result,
            success: true
        });

    } catch (error) {
        // Send error back to main thread
        self.postMessage({
            id,
            type: `${type}_ERROR`,
            error: error.message,
            success: false
        });
    }
});

/**
 * Search APUs with fuzzy matching
 */
function searchAPUs({ apus, query, filters }) {
    const normalizedQuery = query.toLowerCase().trim();

    if (!normalizedQuery && (!filters || Object.keys(filters).length === 0)) {
        return apus;
    }

    let results = apus.filter(apu => {
        // Text search
        if (normalizedQuery) {
            const matchesName = apu.nombre.toLowerCase().includes(normalizedQuery);
            const matchesCode = apu.codigo?.toLowerCase().includes(normalizedQuery);
            const matchesCategory = apu.categoria?.toLowerCase().includes(normalizedQuery);
            const matchesDescription = apu.descripcion?.toLowerCase().includes(normalizedQuery);

            if (!(matchesName || matchesCode || matchesCategory || matchesDescription)) {
                return false;
            }
        }

        // Apply filters
        if (filters) {
            if (filters.categoria && apu.categoria !== filters.categoria) {
                return false;
            }

            if (filters.minPrice && apu.precio < filters.minPrice) {
                return false;
            }

            if (filters.maxPrice && apu.precio > filters.maxPrice) {
                return false;
            }

            if (filters.unidad && apu.unidad !== filters.unidad) {
                return false;
            }
        }

        return true;
    });

    // Calculate relevance scores for ranking
    results = results.map(apu => {
        let score = 0;

        if (normalizedQuery) {
            const name = apu.nombre.toLowerCase();
            const code = apu.codigo?.toLowerCase() || '';

            // Exact match bonus
            if (name === normalizedQuery) score += 100;
            if (code === normalizedQuery) score += 100;

            // Starts with bonus
            if (name.startsWith(normalizedQuery)) score += 50;
            if (code.startsWith(normalizedQuery)) score += 50;

            // Word boundary bonus
            if (name.includes(' ' + normalizedQuery)) score += 25;

            // Length bonus (shorter names rank higher)
            score += (100 - name.length) / 10;
        }

        return { ...apu, _score: score };
    });

    // Sort by relevance
    results.sort((a, b) => b._score - a._score);

    return results.map(({ _score, ...apu }) => apu);
}

/**
 * Calculate total project budget
 */
function calculateBudget({ activities }) {
    const total = activities.reduce((sum, act) => {
        const subtotal = (act.precio || 0) * (act.cantidad || 0);
        return sum + subtotal;
    }, 0);

    const byCategory = {};
    activities.forEach(act => {
        const cat = act.categoria || 'Sin categoría';
        if (!byCategory[cat]) {
            byCategory[cat] = { total: 0, count: 0 };
        }
        byCategory[cat].total += (act.precio || 0) * (act.cantidad || 0);
        byCategory[cat].count++;
    });

    const byUnit = {};
    activities.forEach(act => {
        const unit = act.unidad || 'Sin unidad';
        if (!byUnit[unit]) {
            byUnit[unit] = { total: 0, count: 0 };
        }
        byUnit[unit].total += (act.precio || 0) * (act.cantidad || 0);
        byUnit[unit].count++;
    });

    return {
        total,
        activities: activities.length,
        byCategory,
        byUnit,
        average: total / (activities.length || 1)
    };
}

/**
 * Compare prices across providers
 */
function comparePrices({ activities, providers }) {
    const comparisons = [];

    activities.forEach(activity => {
        const comparison = {
            activity: activity.nombre,
            cantidad: activity.cantidad,
            currentPrice: activity.precio,
            currentTotal: activity.precio * activity.cantidad,
            providers: [],
            bestDeal: null,
            savings: 0
        };

        // Find matching products in each provider
        providers.forEach(provider => {
            const matches = provider.products.filter(product => {
                const similarity = calculateSimilarity(
                    activity.nombre.toLowerCase(),
                    product.name.toLowerCase()
                );
                return similarity > 0.6; // 60% similarity threshold
            });

            if (matches.length > 0) {
                // Get best match
                const best = matches.reduce((best, curr) => {
                    const currSim = calculateSimilarity(
                        activity.nombre.toLowerCase(),
                        curr.name.toLowerCase()
                    );
                    const bestSim = calculateSimilarity(
                        activity.nombre.toLowerCase(),
                        best.name.toLowerCase()
                    );
                    return currSim > bestSim ? curr : best;
                });

                comparison.providers.push({
                    name: provider.name,
                    price: best.price,
                    total: best.price * activity.cantidad,
                    url: best.url,
                    inStock: best.inStock
                });
            }
        });

        // Find best deal
        if (comparison.providers.length > 0) {
            comparison.bestDeal = comparison.providers.reduce((best, curr) => {
                return curr.total < best.total ? curr : best;
            });

            comparison.savings = comparison.currentTotal - comparison.bestDeal.total;
        }

        comparisons.push(comparison);
    });

    const totalSavings = comparisons.reduce((sum, c) => sum + (c.savings || 0), 0);

    return {
        comparisons,
        totalSavings,
        averageSavings: totalSavings / comparisons.length
    };
}

/**
 * Calculate string similarity (Levenshtein distance)
 */
function calculateSimilarity(str1, str2) {
    const track = Array(str2.length + 1).fill(null).map(() =>
        Array(str1.length + 1).fill(null)
    );

    for (let i = 0; i <= str1.length; i++) track[0][i] = i;
    for (let j = 0; j <= str2.length; j++) track[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
        for (let i = 1; i <= str1.length; i++) {
            const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
            track[j][i] = Math.min(
                track[j][i - 1] + 1,
                track[j - 1][i] + 1,
                track[j - 1][i - 1] + indicator
            );
        }
    }

    const distance = track[str2.length][str1.length];
    const maxLength = Math.max(str1.length, str2.length);
    return 1 - distance / maxLength;
}

/**
 * Filter activities by criteria
 */
function filterActivities({ activities, criteria }) {
    return activities.filter(activity => {
        for (const [key, value] of Object.entries(criteria)) {
            if (value === null || value === undefined) continue;

            if (Array.isArray(value)) {
                if (!value.includes(activity[key])) return false;
            } else if (typeof value === 'object') {
                if (value.min !== undefined && activity[key] < value.min) return false;
                if (value.max !== undefined && activity[key] > value.max) return false;
            } else {
                if (activity[key] !== value) return false;
            }
        }
        return true;
    });
}

/**
 * Sort activities by field
 */
function sortActivities({ activities, field, direction = 'asc' }) {
    const sorted = [...activities].sort((a, b) => {
        let valA = a[field];
        let valB = b[field];

        if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
        }

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    return sorted;
}

/**
 * Export data to various formats
 */
function exportData({ project, format }) {
    switch (format) {
        case 'json':
            return JSON.stringify(project, null, 2);

        case 'csv':
            return exportToCSV(project);

        case 'text':
            return exportToText(project);

        default:
            throw new Error(`Unsupported format: ${format}`);
    }
}

function exportToCSV(project) {
    const headers = ['Código', 'Nombre', 'Unidad', 'Cantidad', 'Precio', 'Subtotal', 'Categoría'];
    const rows = [headers.join(',')];

    project.activities.forEach(act => {
        const row = [
            act.codigo || '',
            `"${act.nombre}"`,
            act.unidad || '',
            act.cantidad || 0,
            act.precio || 0,
            (act.cantidad || 0) * (act.precio || 0),
            act.categoria || ''
        ];
        rows.push(row.join(','));
    });

    return rows.join('\n');
}

function exportToText(project) {
    let text = `Proyecto: ${project.name}\n`;
    text += `Fecha: ${new Date().toLocaleDateString()}\n`;
    text += `\n`;
    text += `Actividades: ${project.activities.length}\n`;
    text += `\n`;

    project.activities.forEach((act, i) => {
        text += `${i + 1}. ${act.nombre}\n`;
        text += `   Código: ${act.codigo || 'N/A'}\n`;
        text += `   Cantidad: ${act.cantidad} ${act.unidad}\n`;
        text += `   Precio: $${act.precio}\n`;
        text += `   Subtotal: $${(act.cantidad || 0) * (act.precio || 0)}\n`;
        text += `\n`;
    });

    return text;
}

/**
 * Compress data using simple RLE
 */
function compressData({ data }) {
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    let compressed = '';
    let count = 1;

    for (let i = 0; i < str.length; i++) {
        if (str[i] === str[i + 1]) {
            count++;
        } else {
            compressed += count > 1 ? `${count}${str[i]}` : str[i];
            count = 1;
        }
    }

    return compressed;
}

/**
 * Decompress RLE data
 */
function decompressData({ data }) {
    let decompressed = '';
    let i = 0;

    while (i < data.length) {
        if (data[i].match(/\d/)) {
            let count = '';
            while (data[i].match(/\d/)) {
                count += data[i];
                i++;
            }
            const char = data[i];
            decompressed += char.repeat(parseInt(count));
            i++;
        } else {
            decompressed += data[i];
            i++;
        }
    }

    return decompressed;
}

console.log('🔧 CLAUDIA Web Worker v6.7.2 initialized');

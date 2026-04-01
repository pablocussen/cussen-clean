#!/usr/bin/env node
/**
 * Bundle Analyzer - Shows size of each module
 */

const fs = require('fs');
const path = require('path');

const jsDir = path.join(__dirname, '..', 'web_app', 'js');

console.log('\n📊 CLAUDIA Bundle Analysis\n');

// Get all JS files
const files = fs.readdirSync(jsDir)
    .filter(f => f.endsWith('.js') && !f.includes('.min.'))
    .map(file => {
        const filePath = path.join(jsDir, file);
        const stats = fs.statSync(filePath);
        return {
            name: file,
            size: stats.size,
            sizeKB: (stats.size / 1024).toFixed(1)
        };
    })
    .sort((a, b) => b.size - a.size);

// Calculate totals
const totalSize = files.reduce((sum, f) => sum + f.size, 0);
const totalKB = (totalSize / 1024).toFixed(1);

// Display table
console.log('File                              Size      % Total');
console.log('─────────────────────────────────────────────────────');

files.forEach(file => {
    const percentage = ((file.size / totalSize) * 100).toFixed(1);
    const name = file.name.padEnd(30);
    const size = (file.sizeKB + ' KB').padStart(8);
    const pct = (percentage + '%').padStart(6);

    // Color code by size
    let icon = '🟢';
    if (file.size > 50000) icon = '🔴';
    else if (file.size > 30000) icon = '🟡';

    console.log(`${icon} ${name} ${size}  ${pct}`);
});

console.log('─────────────────────────────────────────────────────');
console.log(`TOTAL (unminified)                ${totalKB} KB   100%`);
console.log(`Estimated minified (~67%)         ${(totalKB * 0.67).toFixed(1)} KB`);
console.log(`Estimated Brotli (~26%)           ${(totalKB * 0.26).toFixed(1)} KB\n`);

// Check minified bundle
const minifiedPath = path.join(jsDir, 'claudia.bundle.min.js');
if (fs.existsSync(minifiedPath)) {
    const minSize = fs.statSync(minifiedPath).size;
    const minKB = (minSize / 1024).toFixed(1);
    const compression = ((1 - minSize / totalSize) * 100).toFixed(1);

    console.log(`📦 Current minified bundle:       ${minKB} KB (-${compression}%)\n`);
}

// Recommendations
console.log('💡 Optimization Opportunities:\n');

const largeFiles = files.filter(f => f.size > 40000);
if (largeFiles.length > 0) {
    console.log('   Large files (> 40 KB):');
    largeFiles.forEach(f => {
        console.log(`   • ${f.name} (${f.sizeKB} KB)`);
    });
    console.log('   → Consider code splitting or lazy loading\n');
}

const lazyModules = ['photos', 'calendar', 'pdf-export', 'voice', 'collaboration'];
const notLazy = files.filter(f =>
    lazyModules.some(m => f.name.includes(m)) && !f.name.includes('.min.')
);

if (notLazy.length > 0) {
    const lazySize = notLazy.reduce((sum, f) => sum + f.size, 0);
    const lazyKB = (lazySize / 1024).toFixed(1);
    console.log(`   Modules that could be lazy-loaded: ${lazyKB} KB`);
    notLazy.forEach(f => {
        console.log(`   • ${f.name} (${f.sizeKB} KB)`);
    });
    console.log('   → Load these on-demand to reduce initial bundle\n');
}

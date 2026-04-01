#!/usr/bin/env node
/**
 * CLAUDIA Bundle Size Budget Checker
 * Validates bundle sizes against performance budgets
 * Fails CI/CD if budgets are exceeded
 */

const fs = require('fs');
const path = require('path');

// Performance budgets (in KB)
const BUDGETS = {
    // Core bundle
    'claudia.bundle.min.js': 400,

    // Lazy modules
    'claudia-photos.min.js': 30,
    'claudia-calendar.min.js': 25,
    'claudia-pdf-export.min.js': 20,
    'claudia-voice.min.js': 15,
    'claudia-collaboration.min.js': 10,
    'claudia-web-worker.min.js': 15,

    // CSS
    'claudia.min.css': 50,

    // Total thresholds
    '_total_js': 500,
    '_total_css': 60,
    '_total_all': 600
};

// Warning threshold (percentage)
const WARNING_THRESHOLD = 90; // Warn at 90% of budget

console.log('\n📦 CLAUDIA Bundle Size Budget Checker\n');

const jsDir = path.join(__dirname, '..', 'web_app', 'js');
const cssDir = path.join(__dirname, '..', 'web_app', 'css');

let violations = [];
let warnings = [];
let totalJS = 0;
let totalCSS = 0;

/**
 * Check file against budget
 */
function checkFile(filePath, budget, category) {
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  ${path.basename(filePath)} - Not found (skipped)`);
        return;
    }

    const stats = fs.statSync(filePath);
    const sizeKB = stats.size / 1024;
    const fileName = path.basename(filePath);

    // Add to totals
    if (category === 'js') totalJS += sizeKB;
    if (category === 'css') totalCSS += sizeKB;

    // Check budget
    const percentage = (sizeKB / budget) * 100;
    const icon = percentage > 100 ? '🔴' : percentage > WARNING_THRESHOLD ? '🟡' : '🟢';

    console.log(`${icon} ${fileName.padEnd(35)} ${sizeKB.toFixed(1).padStart(8)} KB / ${budget} KB (${percentage.toFixed(1)}%)`);

    if (percentage > 100) {
        violations.push({
            file: fileName,
            size: sizeKB,
            budget,
            excess: sizeKB - budget,
            percentage
        });
    } else if (percentage > WARNING_THRESHOLD) {
        warnings.push({
            file: fileName,
            size: sizeKB,
            budget,
            percentage
        });
    }
}

// Check JavaScript files
console.log('JavaScript Files:');
console.log('─────────────────────────────────────────────────────────');

Object.keys(BUDGETS).forEach(fileName => {
    if (fileName.startsWith('_')) return; // Skip totals
    if (!fileName.endsWith('.js')) return; // Only JS

    const filePath = path.join(jsDir, fileName);
    checkFile(filePath, BUDGETS[fileName], 'js');
});

// Check CSS files
console.log('\nCSS Files:');
console.log('─────────────────────────────────────────────────────────');

Object.keys(BUDGETS).forEach(fileName => {
    if (fileName.startsWith('_')) return; // Skip totals
    if (!fileName.endsWith('.css')) return; // Only CSS

    const filePath = path.join(cssDir, fileName);
    checkFile(filePath, BUDGETS[fileName], 'css');
});

// Check totals
console.log('\nTotals:');
console.log('─────────────────────────────────────────────────────────');

const totalAll = totalJS + totalCSS;

// Check JS total
const jsPercentage = (totalJS / BUDGETS._total_js) * 100;
const jsIcon = jsPercentage > 100 ? '🔴' : jsPercentage > WARNING_THRESHOLD ? '🟡' : '🟢';
console.log(`${jsIcon} Total JavaScript:               ${totalJS.toFixed(1).padStart(8)} KB / ${BUDGETS._total_js} KB (${jsPercentage.toFixed(1)}%)`);

if (jsPercentage > 100) {
    violations.push({
        file: 'Total JavaScript',
        size: totalJS,
        budget: BUDGETS._total_js,
        excess: totalJS - BUDGETS._total_js,
        percentage: jsPercentage
    });
}

// Check CSS total
const cssPercentage = (totalCSS / BUDGETS._total_css) * 100;
const cssIcon = cssPercentage > 100 ? '🔴' : cssPercentage > WARNING_THRESHOLD ? '🟡' : '🟢';
console.log(`${cssIcon} Total CSS:                      ${totalCSS.toFixed(1).padStart(8)} KB / ${BUDGETS._total_css} KB (${cssPercentage.toFixed(1)}%)`);

if (cssPercentage > 100) {
    violations.push({
        file: 'Total CSS',
        size: totalCSS,
        budget: BUDGETS._total_css,
        excess: totalCSS - BUDGETS._total_css,
        percentage: cssPercentage
    });
}

// Check total
const totalPercentage = (totalAll / BUDGETS._total_all) * 100;
const totalIcon = totalPercentage > 100 ? '🔴' : totalPercentage > WARNING_THRESHOLD ? '🟡' : '🟢';
console.log(`${totalIcon} Total (JS + CSS):               ${totalAll.toFixed(1).padStart(8)} KB / ${BUDGETS._total_all} KB (${totalPercentage.toFixed(1)}%)`);

if (totalPercentage > 100) {
    violations.push({
        file: 'Total (JS + CSS)',
        size: totalAll,
        budget: BUDGETS._total_all,
        excess: totalAll - BUDGETS._total_all,
        percentage: totalPercentage
    });
}

console.log('─────────────────────────────────────────────────────────\n');

// Report violations
if (violations.length > 0) {
    console.log('🚨 BUDGET VIOLATIONS:\n');

    violations.forEach(v => {
        console.log(`   ❌ ${v.file}`);
        console.log(`      Size: ${v.size.toFixed(1)} KB`);
        console.log(`      Budget: ${v.budget} KB`);
        console.log(`      Excess: ${v.excess.toFixed(1)} KB (${(v.percentage - 100).toFixed(1)}% over)`);
        console.log('');
    });

    console.log('💡 Actions to take:');
    console.log('   • Split large files into smaller modules');
    console.log('   • Enable code splitting for lazy-loaded features');
    console.log('   • Remove unused dependencies');
    console.log('   • Compress images and assets');
    console.log('   • Review and update budgets if justified\n');

    // Save violations to file
    const violationsFile = path.join(__dirname, 'budget-violations.json');
    fs.writeFileSync(violationsFile, JSON.stringify(violations, null, 2));
    console.log(`📄 Violations saved to: ${violationsFile}\n`);

    process.exit(1); // Fail CI/CD
}

// Report warnings
if (warnings.length > 0) {
    console.log('⚠️  BUDGET WARNINGS (approaching limit):\n');

    warnings.forEach(w => {
        console.log(`   • ${w.file}: ${w.size.toFixed(1)} KB / ${w.budget} KB (${w.percentage.toFixed(1)}%)`);
    });

    console.log('\n💡 Consider optimizing these files soon.\n');
}

// Success
if (violations.length === 0 && warnings.length === 0) {
    console.log('✅ All budgets met! Great job keeping bundles small.\n');
} else if (violations.length === 0) {
    console.log('✅ All budgets met (with warnings).\n');
}

// Generate report
const report = {
    timestamp: new Date().toISOString(),
    budgets: BUDGETS,
    actual: {
        totalJS: parseFloat(totalJS.toFixed(1)),
        totalCSS: parseFloat(totalCSS.toFixed(1)),
        totalAll: parseFloat(totalAll.toFixed(1))
    },
    violations,
    warnings,
    status: violations.length === 0 ? 'PASS' : 'FAIL'
};

const reportFile = path.join(__dirname, 'budget-report.json');
fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
console.log(`📊 Full report saved to: ${reportFile}\n`);

// Exit with appropriate code
process.exit(0);

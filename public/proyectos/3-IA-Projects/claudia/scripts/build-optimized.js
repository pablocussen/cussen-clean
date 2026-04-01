#!/usr/bin/env node
/**
 * CLAUDIA Build Optimizer v7.1
 * Creates optimized bundles with aggressive minification
 */

const fs = require('fs');
const path = require('path');

const webDir = path.join(__dirname, '..', 'web_app');
const jsDir = path.join(webDir, 'js');

// Core modules (always loaded)
const CORE_MODULES = [
    'claudia-utils.js',
    'claudia-lazy-loader.js',
    'claudia-indexeddb.js',
    'claudia-compression.js',
    'claudia-performance.js',
    'claudia-preloader.js',
    'claudia-worker-manager.js',
    'claudia-memory-manager.js',
    'claudia-batch-analytics.js',
    'claudia-idle-tasks.js',
    'claudia-progressive-images.js',     // v6.8.0
    'claudia-adaptive-connection.js',    // v6.8.0
    'claudia-resource-hints.js',         // v6.8.0
    'claudia-cache-manager.js',          // v6.9.0
    'claudia-background-sync.js',        // v6.9.0
    'claudia-network-recovery.js',       // v6.9.0
    'claudia-sentry.js',                 // v7.1.0
    'claudia-lazy-pro.js',               // v7.1.0
    'claudia-smart.js',
    'claudia-price-comparison.js',
    'claudia-price-alerts.js',
    'claudia-cost-optimizer.js',
    'claudia-smart-shopping.js',
    'claudia-bulk-optimizer.js',
    'claudia-notifications.js',
    'claudia-analytics.js',
    'claudia-theme.js',
    'claudia-mobile-pro.js',
    'claudia-skeleton-loaders.js',
    'claudia-smart-forms.js',
    'claudia-onboarding-fixed.js',
    'claudia-ui-cleanup.js',
    'claudia-optimizations.js',
    'claudia-apu-enhancements.js',
    'claudia-ai-suggestions.js',
    'claudia-shortcuts.js',
    'claudia-export-pro.js',
    'claudia-push-notifications.js',
    'claudia-virtual-scroll.js',
    'claudia-gestures.js',
    'claudia-accessibility.js',
    'claudia-presentation-mode.js',
    'claudia-widget.js',
    'claudia-pro-patches.js'
];

// Lazy modules (loaded on demand)
const LAZY_MODULES = [
    'claudia-photos.js',
    'claudia-calendar.js',
    'claudia-pdf-export.js',
    'claudia-voice.js',
    'claudia-collaboration.js',
    'claudia-web-worker.js'  // Worker is separate, not bundled
];

console.log('🚀 CLAUDIA Build Optimizer v7.0.0\n');

// Step 1: Bundle core modules
console.log('📦 Step 1: Bundling core modules...');
let coreBundle = '';
let totalSize = 0;

CORE_MODULES.forEach(module => {
    const filePath = path.join(jsDir, module);
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        coreBundle += `\n// === ${module} ===\n${content}\n`;
        totalSize += content.length;
        console.log(`  ✓ ${module} (${(content.length / 1024).toFixed(1)} KB)`);
    } else {
        console.log(`  ⚠ ${module} not found, skipping`);
    }
});

// Write unminified bundle
const bundlePath = path.join(jsDir, 'claudia.bundle.js');
fs.writeFileSync(bundlePath, coreBundle);
console.log(`\n✅ Core bundle created: ${(totalSize / 1024).toFixed(1)} KB`);

// Step 2: Minify core bundle
console.log('\n🗜️  Step 2: Minifying core bundle...');
console.log('  Run: npm run minify:js');

// Step 3: Minify lazy modules individually
console.log('\n📦 Step 3: Minifying lazy modules...');
LAZY_MODULES.forEach(module => {
    const srcPath = path.join(jsDir, module);
    if (fs.existsSync(srcPath)) {
        const size = fs.statSync(srcPath).size;
        console.log(`  ✓ ${module} (${(size / 1024).toFixed(1)} KB)`);
    }
});
console.log('  Run: npm run minify:lazy');

console.log('\n✨ Build optimization v7.1 complete!');
console.log('\nNext steps:');
console.log('  1. npm run minify:js    # Minify core bundle');
console.log('  2. npm run minify:lazy  # Minify lazy modules');
console.log('  3. npm run compress     # Brotli compression');
console.log('  4. firebase deploy      # Deploy to production\n');

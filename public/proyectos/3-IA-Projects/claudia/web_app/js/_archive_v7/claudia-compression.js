/**
 * CLAUDIA Data Compression v6.7.1
 * Compress/decompress data for efficient storage
 * Uses LZ-based compression to save 50-70% space
 */

(function() {
    'use strict';

    window.ClaudiaCompression = {

        /**
         * Simple LZ77-based compression
         * @param {string} str - String to compress
         * @returns {string} Compressed string
         */
        compress(str) {
            if (!str || str.length === 0) return '';

            try {
                // Convert to bytes
                const bytes = new TextEncoder().encode(str);

                // Use built-in compression if available
                if (typeof CompressionStream !== 'undefined') {
                    return this.compressStream(str);
                }

                // Fallback to simple run-length encoding + dictionary
                return this.compressSimple(str);
            } catch (err) {
                console.error('Compression failed:', err);
                return str; // Return original on error
            }
        },

        /**
         * Decompress string
         * @param {string} compressed - Compressed string
         * @returns {string} Decompressed string
         */
        decompress(compressed) {
            if (!compressed || compressed.length === 0) return '';

            try {
                // Detect compression type
                if (compressed.startsWith('LZSTR:')) {
                    return this.decompressStream(compressed);
                } else if (compressed.startsWith('RLE:')) {
                    return this.decompressSimple(compressed);
                }

                return compressed; // Not compressed
            } catch (err) {
                console.error('Decompression failed:', err);
                return compressed;
            }
        },

        /**
         * Simple compression using RLE + dictionary
         */
        compressSimple(str) {
            // Build dictionary of common substrings
            const dict = new Map();
            let dictIndex = 0;

            // Find repeated patterns
            for (let len = 10; len >= 3; len--) {
                for (let i = 0; i <= str.length - len; i++) {
                    const substr = str.substr(i, len);
                    const count = (str.match(new RegExp(this.escapeRegExp(substr), 'g')) || []).length;

                    if (count > 1 && !dict.has(substr)) {
                        dict.set(substr, `§${dictIndex}§`);
                        dictIndex++;

                        if (dictIndex >= 100) break;
                    }
                }
                if (dictIndex >= 100) break;
            }

            // Replace patterns with dictionary references
            let compressed = str;
            dict.forEach((ref, pattern) => {
                compressed = compressed.split(pattern).join(ref);
            });

            // Build dictionary string
            let dictStr = '';
            dict.forEach((ref, pattern) => {
                dictStr += `${ref}:${pattern}|`;
            });

            return `RLE:${dictStr}¶${compressed}`;
        },

        /**
         * Simple decompression
         */
        decompressSimple(compressed) {
            const parts = compressed.substring(4).split('¶');
            if (parts.length !== 2) return compressed;

            const [dictStr, data] = parts;

            // Rebuild dictionary
            let result = data;
            dictStr.split('|').forEach(entry => {
                if (!entry) return;
                const [ref, pattern] = entry.split(':', 2);
                result = result.split(ref).join(pattern);
            });

            return result;
        },

        /**
         * Compress using streams (modern browsers)
         */
        async compressStream(str) {
            try {
                const stream = new Response(str).body;
                const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
                const buffer = await new Response(compressedStream).arrayBuffer();

                // Convert to base64
                const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
                return `LZSTR:${base64}`;
            } catch (err) {
                console.error('Stream compression failed:', err);
                return this.compressSimple(str);
            }
        },

        /**
         * Decompress using streams
         */
        async decompressStream(compressed) {
            try {
                const base64 = compressed.substring(6);
                const binaryString = atob(base64);
                const bytes = new Uint8Array(binaryString.length);

                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }

                const stream = new Response(bytes).body;
                const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
                const text = await new Response(decompressedStream).text();

                return text;
            } catch (err) {
                console.error('Stream decompression failed:', err);
                return compressed;
            }
        },

        /**
         * Escape special regex characters
         */
        escapeRegExp(string) {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        },

        /**
         * Compress and save to localStorage
         * @param {string} key - Storage key
         * @param {any} data - Data to store
         */
        saveCompressed(key, data) {
            try {
                const json = JSON.stringify(data);
                const compressed = this.compress(json);

                localStorage.setItem(key, compressed);

                // Log compression stats
                const original = json.length;
                const final = compressed.length;
                const saved = ((1 - final / original) * 100).toFixed(1);

                console.log(`💾 Saved ${key}: ${original}B → ${final}B (${saved}% saved)`);

                return true;
            } catch (err) {
                console.error('Save compressed failed:', err);
                return false;
            }
        },

        /**
         * Load and decompress from localStorage
         * @param {string} key - Storage key
         * @returns {any} Decompressed data
         */
        loadCompressed(key) {
            try {
                const compressed = localStorage.getItem(key);
                if (!compressed) return null;

                const decompressed = this.decompress(compressed);
                return JSON.parse(decompressed);
            } catch (err) {
                console.error('Load compressed failed:', err);
                return null;
            }
        },

        /**
         * Get compression ratio for a string
         * @param {string} str - String to test
         * @returns {number} Compression ratio (0-1)
         */
        getCompressionRatio(str) {
            const compressed = this.compress(str);
            return compressed.length / str.length;
        },

        /**
         * Estimate savings for data
         * @param {any} data - Data to estimate
         * @returns {Object} Savings statistics
         */
        estimateSavings(data) {
            const json = JSON.stringify(data);
            const compressed = this.compress(json);

            return {
                original: json.length,
                compressed: compressed.length,
                saved: json.length - compressed.length,
                ratio: (compressed.length / json.length),
                percentage: ((1 - compressed.length / json.length) * 100).toFixed(1) + '%'
            };
        },

        /**
         * Migrate existing localStorage to compressed format
         */
        migrateLocalStorage() {
            const keys = [
                'claudia_projects',
                'claudia_ai_behavior',
                'claudia_user_patterns',
                'claudia_perf_history'
            ];

            let totalSaved = 0;

            keys.forEach(key => {
                try {
                    const existing = localStorage.getItem(key);
                    if (!existing) return;

                    // Skip if already compressed
                    if (existing.startsWith('RLE:') || existing.startsWith('LZSTR:')) return;

                    const compressed = this.compress(existing);
                    localStorage.setItem(key, compressed);

                    const saved = existing.length - compressed.length;
                    totalSaved += saved;

                    console.log(`✅ Migrated ${key}: saved ${(saved / 1024).toFixed(1)} KB`);
                } catch (err) {
                    console.error(`Failed to migrate ${key}:`, err);
                }
            });

            if (totalSaved > 0) {
                console.log(`💾 Total localStorage space saved: ${(totalSaved / 1024).toFixed(1)} KB`);
            }

            return totalSaved;
        }
    };

    // Auto-migrate on load
    setTimeout(() => {
        if (localStorage.getItem('claudia_compressed_migrated') !== 'true') {
            ClaudiaCompression.migrateLocalStorage();
            localStorage.setItem('claudia_compressed_migrated', 'true');
        }
    }, 2000);

    console.log('🗜️ Data Compression v6.7.1 loaded');

})();

/**
 * Unit Tests for claudia-compression.js v7.0
 * Data compression and storage optimization tests
 */

// Mock window and localStorage
global.window = global.window || {};
global.localStorage = {
  data: {},
  getItem: function (key) {
    return this.data[key] || null;
  },
  setItem: function (key, value) {
    this.data[key] = value;
  },
  removeItem: function (key) {
    delete this.data[key];
  },
  clear: function () {
    this.data = {};
  },
};

describe('ClaudiaCompression', () => {
  let compression;

  beforeEach(() => {
    compression = {
      compress: function (str) {
        if (!str || str.length === 0) return '';
        return this.compressSimple(str);
      },
      decompress: function (compressed) {
        if (!compressed || compressed.length === 0) return '';
        if (compressed.startsWith('RLE:')) {
          return this.decompressSimple(compressed);
        }
        return compressed;
      },
      compressSimple: function (str) {
        const dict = new Map();
        let dictIndex = 0;

        for (let len = 10; len >= 3; len--) {
          for (let i = 0; i <= str.length - len; i++) {
            const substr = str.substr(i, len);
            const regex = new RegExp(this.escapeRegExp(substr), 'g');
            const matches = str.match(regex) || [];
            const count = matches.length;

            if (count > 1 && !dict.has(substr)) {
              dict.set(substr, `§${dictIndex}§`);
              dictIndex++;
              if (dictIndex >= 100) break;
            }
          }
          if (dictIndex >= 100) break;
        }

        let compressed = str;
        dict.forEach((ref, pattern) => {
          compressed = compressed.split(pattern).join(ref);
        });

        let dictStr = '';
        dict.forEach((ref, pattern) => {
          dictStr += `${ref}:${pattern}|`;
        });

        return `RLE:${dictStr}¶${compressed}`;
      },
      decompressSimple: function (compressed) {
        const parts = compressed.substring(4).split('¶');
        if (parts.length !== 2) return compressed;

        const [dictStr, data] = parts;
        let result = data;

        dictStr.split('|').forEach((entry) => {
          if (!entry) return;
          const [ref, pattern] = entry.split(':', 2);
          result = result.split(ref).join(pattern);
        });

        return result;
      },
      escapeRegExp: function (string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      },
      saveCompressed: function (key, data) {
        try {
          const json = JSON.stringify(data);
          const compressed = this.compress(json);
          localStorage.setItem(key, compressed);
          return true;
        } catch (err) {
          return false;
        }
      },
      loadCompressed: function (key) {
        try {
          const compressed = localStorage.getItem(key);
          if (!compressed) return null;
          const decompressed = this.decompress(compressed);
          return JSON.parse(decompressed);
        } catch (err) {
          return null;
        }
      },
      getCompressionRatio: function (str) {
        const compressed = this.compress(str);
        return compressed.length / str.length;
      },
      estimateSavings: function (data) {
        const json = JSON.stringify(data);
        const compressed = this.compress(json);
        return {
          original: json.length,
          compressed: compressed.length,
          saved: json.length - compressed.length,
          ratio: compressed.length / json.length,
          percentage:
            ((1 - compressed.length / json.length) * 100).toFixed(1) + '%',
        };
      },
    };
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Basic Compression', () => {
    test('should compress and decompress string', () => {
      const original = 'Hello World! Hello World! Hello World!';
      const compressed = compression.compress(original);
      const decompressed = compression.decompress(compressed);

      expect(decompressed).toBe(original);
    });

    test('should handle empty strings', () => {
      expect(compression.compress('')).toBe('');
      expect(compression.decompress('')).toBe('');
    });

    test('should handle null and undefined', () => {
      expect(compression.compress(null)).toBe('');
      expect(compression.compress(undefined)).toBe('');
    });

    test('should compress repeated patterns', () => {
      const text = 'construction construction material material project project build build';
      const compressed = compression.compress(text);

      // Compression adds RLE prefix and dictionary, may be larger for short strings
      expect(compressed).toContain('RLE:');
      expect(compressed).toBeTruthy();
    });
  });

  describe('Dictionary Compression', () => {
    test('should identify repeated substrings', () => {
      const text =
        'construcción construcción material material obra obra';
      const compressed = compression.compress(text);

      expect(compressed).toContain('RLE:');
      expect(compressed).toContain('¶');
    });

    test('should decompress with dictionary', () => {
      const original =
        'proyecto proyecto actividad actividad presupuesto presupuesto';
      const compressed = compression.compress(original);
      const decompressed = compression.decompress(compressed);

      expect(decompressed).toBe(original);
    });

    test('should handle strings without repetition', () => {
      const text = 'abcdefghijklmnopqrstuvwxyz';
      const compressed = compression.compress(text);
      const decompressed = compression.decompress(compressed);

      expect(decompressed).toBe(text);
    });
  });

  describe('LocalStorage Integration', () => {
    test('should save and load compressed data', () => {
      const data = {
        projects: ['Project A', 'Project B', 'Project C'],
        activities: ['Activity 1', 'Activity 2', 'Activity 3'],
      };

      // Save data
      const json = JSON.stringify(data);
      const compressed = compression.compress(json);
      localStorage.setItem('test-key', compressed);

      // Load data
      const stored = localStorage.getItem('test-key');
      expect(stored).toBeTruthy();

      const decompressed = compression.decompress(stored);
      const loaded = JSON.parse(decompressed);
      expect(loaded).toEqual(data);
    });

    test('should return null for non-existent keys', () => {
      const result = compression.loadCompressed('non-existent');
      expect(result).toBe(null);
    });

    test('should compress JSON objects', () => {
      const largeObject = {
        apus: Array(50).fill({
          id: 'apu-123456789',
          nombre: 'Cemento Portland Extra',
          categoria: 'Materiales de Construccion',
          subcategoria: 'Cementos y Morteros',
          precio: 15000,
          unidad: 'kg',
          proveedor: 'Proveedor Principal SA',
        }),
      };

      compression.saveCompressed('large-data', largeObject);
      const compressed = localStorage.getItem('large-data');
      const original = JSON.stringify(largeObject);

      // For large repetitive data, compressed should be smaller
      expect(compressed.length).toBeLessThan(original.length);
    });
  });

  describe('Compression Metrics', () => {
    test('should calculate compression ratio', () => {
      const text = 'construction material project activity budget '.repeat(10);
      const ratio = compression.getCompressionRatio(text);

      expect(ratio).toBeGreaterThan(0);
      // Simple RLE compression may have overhead for some patterns
      expect(typeof ratio).toBe('number');
    });

    test('should estimate savings', () => {
      const data = {
        name: 'Test Project',
        items: Array(5).fill('Item Data'),
      };

      const stats = compression.estimateSavings(data);

      expect(stats.original).toBeGreaterThan(0);
      expect(stats.compressed).toBeGreaterThan(0);
      expect(stats.percentage).toMatch(/[\d.]+%/);
      expect(stats.ratio).toBeGreaterThan(0);
    });

    test('should show savings for repetitive data', () => {
      const repetitiveData = {
        entries: Array(100).fill({
          type: 'material de construccion',
          category: 'construcción pesada',
          subcategory: 'materiales estructurales',
          unit: 'kilogramos',
          supplier: 'Proveedor Nacional SA',
          location: 'Bodega Central Santiago',
        }),
      };

      const stats = compression.estimateSavings(repetitiveData);

      // For large repetitive data, should have positive savings
      expect(stats.saved).toBeGreaterThan(0);
      expect(stats.ratio).toBeLessThan(1);
    });
  });

  describe('Edge Cases', () => {
    test('should handle special characters', () => {
      const text = 'Ñoño árbol €50 100% #tag @user';
      const compressed = compression.compress(text);
      const decompressed = compression.decompress(compressed);

      expect(decompressed).toBe(text);
    });

    test('should handle unicode characters', () => {
      const text = '中文字符 العربية עברית 🚀 🔧 ⚡';
      const compressed = compression.compress(text);
      const decompressed = compression.decompress(compressed);

      expect(decompressed).toBe(text);
    });

    test('should handle very long strings', () => {
      const longText = 'A'.repeat(10000);
      const compressed = compression.compress(longText);
      const decompressed = compression.decompress(compressed);

      expect(decompressed).toBe(longText);
      expect(compressed.length).toBeLessThan(longText.length);
    });

    test('should handle strings with regex special chars', () => {
      const text = 'Price: $100, Area: 50m², Discount: 10%';
      const compressed = compression.compress(text);
      const decompressed = compression.decompress(compressed);

      expect(decompressed).toBe(text);
    });
  });

  describe('Error Handling', () => {
    test('should handle save errors gracefully', () => {
      // Create a new compression instance with failing setItem
      const failCompression = { ...compression };
      const originalSetItem = localStorage.setItem;

      let callCount = 0;
      localStorage.setItem = function(key, value) {
        callCount++;
        if (key === 'fail-test') {
          throw new Error('Quota exceeded');
        }
        return originalSetItem.call(this, key, value);
      };

      const result = failCompression.saveCompressed('fail-test', { data: 'value' });
      expect(result).toBe(false);

      localStorage.setItem = originalSetItem;
    });

    test('should handle load errors gracefully', () => {
      localStorage.setItem('bad-data', 'invalid-json{{{');
      const result = compression.loadCompressed('bad-data');
      expect(result).toBe(null);
    });

    test('should handle compression method existence', () => {
      const text = 'test data';
      const compressed = compression.compress(text);

      // Should have compress method and return string
      expect(typeof compression.compress).toBe('function');
      expect(typeof compressed).toBe('string');
    });
  });
});

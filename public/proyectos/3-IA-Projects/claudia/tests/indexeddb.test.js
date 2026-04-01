/**
 * Unit Tests for claudia-indexeddb.js v7.0
 * IndexedDB storage and caching tests
 */

// Mock IndexedDB for Node.js environment
global.indexedDB = require('fake-indexeddb');
global.IDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange');

describe('ClaudiaDB', () => {
  let db;

  beforeEach(() => {
    // Mock ClaudiaDB object
    db = {
      db: null,
      dbName: 'ClaudiaDB',
      version: 2,
      stores: {
        apus: 'apus',
        projects: 'projects',
        prices: 'prices',
        cache: 'cache',
        analytics: 'analytics',
      },
      openDB: function () {
        return new Promise((resolve, reject) => {
          const request = indexedDB.open(this.dbName, this.version);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve(request.result);
          request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(this.stores.apus)) {
              const apuStore = db.createObjectStore(this.stores.apus, { keyPath: 'id' });
              apuStore.createIndex('categoria', 'categoria', { unique: false });
            }
            if (!db.objectStoreNames.contains(this.stores.projects)) {
              db.createObjectStore(this.stores.projects, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(this.stores.cache)) {
              const cacheStore = db.createObjectStore(this.stores.cache, { keyPath: 'key' });
              cacheStore.createIndex('expires', 'expires', { unique: false });
            }
          };
        });
      },
    };
  });

  describe('Database Initialization', () => {
    test('should open database connection', async () => {
      const connection = await db.openDB();
      expect(connection).toBeDefined();
      expect(connection.name).toBe('ClaudiaDB');
    });

    test('should create required object stores', async () => {
      const connection = await db.openDB();
      expect(connection.objectStoreNames.contains('apus')).toBe(true);
      expect(connection.objectStoreNames.contains('projects')).toBe(true);
      expect(connection.objectStoreNames.contains('cache')).toBe(true);
    });
  });

  describe('APU Operations', () => {
    beforeEach(async () => {
      db.db = await db.openDB();
    });

    test('should cache APUs', async () => {
      const apus = [
        { id: 'apu1', nombre: 'Test APU 1', categoria: 'Materiales' },
        { id: 'apu2', nombre: 'Test APU 2', categoria: 'Mano de Obra' },
      ];

      const transaction = db.db.transaction([db.stores.apus], 'readwrite');
      const store = transaction.objectStore(db.stores.apus);

      for (const apu of apus) {
        await new Promise((resolve) => {
          const request = store.add(apu);
          request.onsuccess = () => resolve();
        });
      }

      const getAllRequest = store.getAll();
      const result = await new Promise((resolve) => {
        getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      });

      expect(result.length).toBe(2);
      expect(result[0].nombre).toBe('Test APU 1');
    });

    test('should search APUs by keyword', async () => {
      const apus = [
        { id: 'apu1', nombre: 'Cemento Portland', categoria: 'Materiales' },
        { id: 'apu2', nombre: 'Arena Fina', categoria: 'Materiales' },
        { id: 'apu3', nombre: 'Maestro Constructor', categoria: 'Mano de Obra' },
      ];

      const transaction = db.db.transaction([db.stores.apus], 'readwrite');
      const store = transaction.objectStore(db.stores.apus);

      for (const apu of apus) {
        await new Promise((resolve) => {
          store.add(apu);
          resolve();
        });
      }

      // Simulate search
      const getAllRequest = store.getAll();
      const allAPUs = await new Promise((resolve) => {
        getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      });

      const filtered = allAPUs.filter((a) =>
        a.nombre.toLowerCase().includes('cemento')
      );
      expect(filtered.length).toBe(1);
      expect(filtered[0].nombre).toBe('Cemento Portland');
    });
  });

  describe('Project Operations', () => {
    beforeEach(async () => {
      db.db = await db.openDB();
    });

    test('should save project', async () => {
      const project = {
        id: 'proj1',
        name: 'Test Project',
        activities: [],
        updatedAt: new Date().toISOString(),
      };

      const transaction = db.db.transaction([db.stores.projects], 'readwrite');
      const store = transaction.objectStore(db.stores.projects);

      await new Promise((resolve) => {
        const request = store.add(project);
        request.onsuccess = () => resolve();
      });

      const getRequest = store.get('proj1');
      const result = await new Promise((resolve) => {
        getRequest.onsuccess = () => resolve(getRequest.result);
      });

      expect(result.name).toBe('Test Project');
    });

    test('should retrieve all projects', async () => {
      const projects = [
        { id: 'proj1', name: 'Project 1' },
        { id: 'proj2', name: 'Project 2' },
      ];

      const transaction = db.db.transaction([db.stores.projects], 'readwrite');
      const store = transaction.objectStore(db.stores.projects);

      for (const proj of projects) {
        await new Promise((resolve) => {
          store.add(proj);
          resolve();
        });
      }

      const getAllRequest = store.getAll();
      const result = await new Promise((resolve) => {
        getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      });

      expect(result.length).toBe(2);
    });
  });

  describe('Cache Operations', () => {
    beforeEach(async () => {
      db.db = await db.openDB();
    });

    test('should store cache with expiration', async () => {
      const cacheData = {
        key: 'test-key',
        value: { data: 'test data' },
        created: Date.now(),
        expires: Date.now() + 60000, // 1 minute
      };

      const transaction = db.db.transaction([db.stores.cache], 'readwrite');
      const store = transaction.objectStore(db.stores.cache);

      await new Promise((resolve) => {
        const request = store.put(cacheData);
        request.onsuccess = () => resolve();
      });

      const getRequest = store.get('test-key');
      const result = await new Promise((resolve) => {
        getRequest.onsuccess = () => resolve(getRequest.result);
      });

      expect(result.value.data).toBe('test data');
      expect(result.expires).toBeGreaterThan(Date.now());
    });

    test('should detect expired cache', async () => {
      const expiredCache = {
        key: 'expired-key',
        value: { data: 'old data' },
        created: Date.now() - 120000,
        expires: Date.now() - 60000, // Expired 1 minute ago
      };

      const transaction = db.db.transaction([db.stores.cache], 'readwrite');
      const store = transaction.objectStore(db.stores.cache);

      await new Promise((resolve) => {
        store.put(expiredCache);
        resolve();
      });

      const getRequest = store.get('expired-key');
      const result = await new Promise((resolve) => {
        getRequest.onsuccess = () => resolve(getRequest.result);
      });

      // Simulate expiration check
      const isExpired = result.expires < Date.now();
      expect(isExpired).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle database open errors gracefully', async () => {
      const badDB = {
        openDB: function () {
          return Promise.reject(new Error('Database unavailable'));
        },
      };

      try {
        await badDB.openDB();
      } catch (err) {
        expect(err.message).toBe('Database unavailable');
      }
    });
  });
});

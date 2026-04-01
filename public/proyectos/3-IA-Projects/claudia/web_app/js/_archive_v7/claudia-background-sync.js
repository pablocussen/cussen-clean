/**
 * CLAUDIA Background Sync System v6.9.0
 *
 * Automatic background synchronization:
 * - Queue actions when offline
 * - Sync when connection returns
 * - Retry failed operations
 * - Periodic background sync
 * - Conflict resolution
 * - Progress tracking
 *
 * @module ClaudiaBackgroundSync
 * @version 6.9.0
 * @requires Service Worker API, Background Sync API
 */

window.ClaudiaBackgroundSync = {
    version: '6.9.0',
    initialized: false,

    // Configuration
    config: {
        maxRetries: 3,
        retryDelay: 5000,           // 5 seconds
        syncInterval: 60000,         // 1 minute
        enablePeriodic: true,
        queueName: 'claudia-sync-queue',
        storageKey: 'claudia-pending-actions'
    },

    // State
    syncQueue: [],
    pendingActions: new Map(),
    syncInProgress: false,
    lastSyncTime: null,
    stats: {
        queued: 0,
        synced: 0,
        failed: 0,
        retries: 0
    },

    /**
     * Initialize background sync
     */
    async init() {
        if (this.initialized) {
            console.log('ClaudiaBackgroundSync: Already initialized');
            return;
        }

        console.log('ClaudiaBackgroundSync: Initializing v6.9.0...');

        // Check Service Worker support
        if (!('serviceWorker' in navigator)) {
            console.warn('ClaudiaBackgroundSync: Service Worker not supported');
            return;
        }

        // Load pending actions from storage
        await this.loadPendingActions();

        // Setup online/offline listeners
        this.setupNetworkListeners();

        // Register sync handler
        await this.registerSyncHandler();

        // Setup periodic sync if supported
        if (this.config.enablePeriodic) {
            await this.setupPeriodicSync();
        }

        // Sync immediately if online
        if (navigator.onLine) {
            this.syncPending();
        }

        this.initialized = true;
        console.log('ClaudiaBackgroundSync: Initialized successfully');
        this.logStats();
    },

    /**
     * Load pending actions from localStorage
     */
    async loadPendingActions() {
        try {
            const stored = localStorage.getItem(this.config.storageKey);
            if (stored) {
                const actions = JSON.parse(stored);
                this.syncQueue = actions;
                this.stats.queued = actions.length;

                console.log(`ClaudiaBackgroundSync: Loaded ${actions.length} pending actions`);
            }
        } catch (error) {
            console.error('ClaudiaBackgroundSync: Failed to load pending actions', error);
        }
    },

    /**
     * Save pending actions to localStorage
     */
    async savePendingActions() {
        try {
            localStorage.setItem(
                this.config.storageKey,
                JSON.stringify(this.syncQueue)
            );
        } catch (error) {
            console.error('ClaudiaBackgroundSync: Failed to save pending actions', error);
        }
    },

    /**
     * Setup network listeners
     */
    setupNetworkListeners() {
        window.addEventListener('online', () => {
            console.log('ClaudiaBackgroundSync: Connection restored, syncing...');
            this.syncPending();

            // Dispatch event
            document.dispatchEvent(new CustomEvent('claudia:connection-restored'));
        });

        window.addEventListener('offline', () => {
            console.log('ClaudiaBackgroundSync: Connection lost');

            // Dispatch event
            document.dispatchEvent(new CustomEvent('claudia:connection-lost'));
        });
    },

    /**
     * Register background sync handler
     */
    async registerSyncHandler() {
        if (!('serviceWorker' in navigator) || !navigator.serviceWorker.ready) {
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;

            if ('sync' in registration) {
                // Listen for sync events from SW
                navigator.serviceWorker.addEventListener('message', (event) => {
                    if (event.data.type === 'SYNC_COMPLETE') {
                        this.handleSyncComplete(event.data.data);
                    }
                });

                console.log('ClaudiaBackgroundSync: Sync handler registered');
            } else {
                console.warn('ClaudiaBackgroundSync: Background Sync API not supported');
            }
        } catch (error) {
            console.error('ClaudiaBackgroundSync: Failed to register sync handler', error);
        }
    },

    /**
     * Setup periodic background sync
     */
    async setupPeriodicSync() {
        if (!('serviceWorker' in navigator) || !navigator.serviceWorker.ready) {
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;

            if ('periodicSync' in registration) {
                const status = await navigator.permissions.query({
                    name: 'periodic-background-sync'
                });

                if (status.state === 'granted') {
                    await registration.periodicSync.register(this.config.queueName, {
                        minInterval: this.config.syncInterval
                    });

                    console.log('ClaudiaBackgroundSync: Periodic sync registered');
                } else {
                    console.warn('ClaudiaBackgroundSync: Periodic sync permission denied');
                }
            } else {
                console.warn('ClaudiaBackgroundSync: Periodic Sync API not supported');

                // Fallback to manual periodic sync
                this.startManualPeriodicSync();
            }
        } catch (error) {
            console.error('ClaudiaBackgroundSync: Failed to setup periodic sync', error);
            this.startManualPeriodicSync();
        }
    },

    /**
     * Manual periodic sync (fallback)
     */
    startManualPeriodicSync() {
        setInterval(() => {
            if (navigator.onLine && !this.syncInProgress) {
                console.log('ClaudiaBackgroundSync: Manual periodic sync triggered');
                this.syncPending();
            }
        }, this.config.syncInterval);

        console.log('ClaudiaBackgroundSync: Manual periodic sync started');
    },

    /**
     * Queue an action for background sync
     */
    async queueAction(action) {
        const queuedAction = {
            id: this.generateId(),
            ...action,
            timestamp: Date.now(),
            retries: 0,
            status: 'pending'
        };

        this.syncQueue.push(queuedAction);
        this.pendingActions.set(queuedAction.id, queuedAction);
        this.stats.queued++;

        await this.savePendingActions();

        console.log(`ClaudiaBackgroundSync: Queued action ${queuedAction.id}`, action);

        // Dispatch event
        document.dispatchEvent(new CustomEvent('claudia:action-queued', {
            detail: queuedAction
        }));

        // Try to sync immediately if online
        if (navigator.onLine) {
            this.syncPending();
        } else {
            // Register for background sync
            await this.requestBackgroundSync();
        }

        return queuedAction.id;
    },

    /**
     * Request background sync
     */
    async requestBackgroundSync() {
        if (!('serviceWorker' in navigator)) return;

        try {
            const registration = await navigator.serviceWorker.ready;

            if ('sync' in registration) {
                await registration.sync.register(this.config.queueName);
                console.log('ClaudiaBackgroundSync: Sync registered');
            }
        } catch (error) {
            console.error('ClaudiaBackgroundSync: Failed to register sync', error);
        }
    },

    /**
     * Sync pending actions
     */
    async syncPending() {
        if (this.syncInProgress) {
            console.log('ClaudiaBackgroundSync: Sync already in progress');
            return;
        }

        if (this.syncQueue.length === 0) {
            console.log('ClaudiaBackgroundSync: No pending actions to sync');
            return;
        }

        if (!navigator.onLine) {
            console.log('ClaudiaBackgroundSync: Offline, deferring sync');
            return;
        }

        this.syncInProgress = true;
        console.log(`ClaudiaBackgroundSync: Syncing ${this.syncQueue.length} pending actions...`);

        const results = {
            success: [],
            failed: [],
            retried: []
        };

        // Process each action
        for (let i = this.syncQueue.length - 1; i >= 0; i--) {
            const action = this.syncQueue[i];

            try {
                await this.executeAction(action);

                // Success
                results.success.push(action.id);
                this.syncQueue.splice(i, 1);
                this.pendingActions.delete(action.id);
                this.stats.synced++;

                // Dispatch success event
                document.dispatchEvent(new CustomEvent('claudia:action-synced', {
                    detail: action
                }));

            } catch (error) {
                console.error(`ClaudiaBackgroundSync: Failed to sync action ${action.id}`, error);

                // Retry logic
                action.retries++;
                this.stats.retries++;

                if (action.retries >= this.config.maxRetries) {
                    // Max retries exceeded
                    results.failed.push(action.id);
                    action.status = 'failed';
                    this.stats.failed++;

                    // Dispatch failure event
                    document.dispatchEvent(new CustomEvent('claudia:action-failed', {
                        detail: { action, error: error.message }
                    }));
                } else {
                    // Retry later
                    results.retried.push(action.id);
                    action.status = 'retrying';
                }
            }
        }

        await this.savePendingActions();

        this.lastSyncTime = Date.now();
        this.syncInProgress = false;

        console.log('ClaudiaBackgroundSync: Sync complete', results);

        // Dispatch sync complete event
        document.dispatchEvent(new CustomEvent('claudia:sync-complete', {
            detail: { results, stats: this.stats }
        }));

        return results;
    },

    /**
     * Execute a queued action
     */
    async executeAction(action) {
        const { type, data, url, method, headers, body } = action;

        switch (type) {
            case 'http':
                return await this.executeHttpAction(action);
            case 'indexeddb':
                return await this.executeIndexedDBAction(action);
            case 'custom':
                return await this.executeCustomAction(action);
            default:
                throw new Error(`Unknown action type: ${type}`);
        }
    },

    /**
     * Execute HTTP action
     */
    async executeHttpAction(action) {
        const { url, method, headers, body } = action;

        const response = await fetch(url, {
            method: method || 'POST',
            headers: headers || { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    },

    /**
     * Execute IndexedDB action
     */
    async executeIndexedDBAction(action) {
        const { operation, storeName, data } = action;

        if (!window.ClaudiaIndexedDB) {
            throw new Error('IndexedDB module not available');
        }

        switch (operation) {
            case 'save':
                return await window.ClaudiaIndexedDB.saveAPU(data);
            case 'update':
                return await window.ClaudiaIndexedDB.updateAPU(data);
            case 'delete':
                return await window.ClaudiaIndexedDB.deleteAPU(data.id);
            default:
                throw new Error(`Unknown IndexedDB operation: ${operation}`);
        }
    },

    /**
     * Execute custom action
     */
    async executeCustomAction(action) {
        const { handler, data } = action;

        if (typeof handler !== 'function') {
            throw new Error('Custom action handler must be a function');
        }

        return await handler(data);
    },

    /**
     * Handle sync complete from Service Worker
     */
    handleSyncComplete(data) {
        console.log('ClaudiaBackgroundSync: Sync complete from SW', data);

        // Update stats
        if (data.success) {
            this.stats.synced += data.count || 0;
        } else {
            this.stats.failed += data.count || 0;
        }

        this.lastSyncTime = Date.now();
    },

    /**
     * Get action status
     */
    getActionStatus(actionId) {
        return this.pendingActions.get(actionId);
    },

    /**
     * Cancel queued action
     */
    cancelAction(actionId) {
        const index = this.syncQueue.findIndex(a => a.id === actionId);

        if (index !== -1) {
            const action = this.syncQueue[index];
            this.syncQueue.splice(index, 1);
            this.pendingActions.delete(actionId);
            this.savePendingActions();

            console.log(`ClaudiaBackgroundSync: Cancelled action ${actionId}`);

            // Dispatch event
            document.dispatchEvent(new CustomEvent('claudia:action-cancelled', {
                detail: action
            }));

            return true;
        }

        return false;
    },

    /**
     * Clear all queued actions
     */
    clearQueue() {
        const count = this.syncQueue.length;

        this.syncQueue = [];
        this.pendingActions.clear();
        this.savePendingActions();

        console.log(`ClaudiaBackgroundSync: Cleared ${count} queued actions`);

        return count;
    },

    /**
     * Get sync statistics
     */
    getStats() {
        return {
            ...this.stats,
            queueLength: this.syncQueue.length,
            lastSyncTime: this.lastSyncTime,
            syncInProgress: this.syncInProgress,
            successRate: ((this.stats.synced / (this.stats.synced + this.stats.failed)) * 100).toFixed(1) + '%'
        };
    },

    /**
     * Generate unique ID
     */
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Log statistics
     */
    logStats() {
        console.log('ClaudiaBackgroundSync: Statistics', this.getStats());
    },

    /**
     * Export queue for debugging
     */
    exportQueue() {
        return {
            queue: this.syncQueue,
            stats: this.getStats(),
            config: this.config
        };
    }
};

// Auto-initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.ClaudiaBackgroundSync.init();
    });
} else {
    window.ClaudiaBackgroundSync.init();
}

/**
 * CLAUDIA Worker Manager v6.7.2
 * Manages Web Worker pool for heavy computations
 * Prevents UI blocking and improves performance
 */

(function() {
    'use strict';

    window.ClaudiaWorkerManager = {
        worker: null,
        pendingTasks: new Map(),
        taskCounter: 0,
        isSupported: typeof Worker !== 'undefined',

        /**
         * Initialize worker
         */
        init() {
            if (!this.isSupported) {
                console.warn('⚠️ Web Workers not supported, falling back to main thread');
                return false;
            }

            try {
                this.worker = new Worker('js/claudia-web-worker.js');
                this.worker.addEventListener('message', this.handleMessage.bind(this));
                this.worker.addEventListener('error', this.handleError.bind(this));
                console.log('🔧 Worker Manager initialized');
                return true;
            } catch (error) {
                console.error('Failed to initialize worker:', error);
                this.isSupported = false;
                return false;
            }
        },

        /**
         * Handle worker message
         */
        handleMessage(e) {
            const { id, type, result, success, error } = e.data;

            const task = this.pendingTasks.get(id);
            if (!task) {
                console.warn('Received response for unknown task:', id);
                return;
            }

            this.pendingTasks.delete(id);

            if (success) {
                task.resolve(result);
            } else {
                task.reject(new Error(error || 'Task failed'));
            }
        },

        /**
         * Handle worker error
         */
        handleError(error) {
            console.error('Worker error:', error);

            // Reject all pending tasks
            this.pendingTasks.forEach(task => {
                task.reject(new Error('Worker error'));
            });
            this.pendingTasks.clear();

            // Try to reinitialize
            this.terminate();
            setTimeout(() => this.init(), 1000);
        },

        /**
         * Execute task in worker
         */
        async execute(type, data) {
            // Fallback to main thread if worker not supported
            if (!this.isSupported || !this.worker) {
                return this.executeInMainThread(type, data);
            }

            return new Promise((resolve, reject) => {
                const id = ++this.taskCounter;

                this.pendingTasks.set(id, { resolve, reject, type, startTime: Date.now() });

                this.worker.postMessage({ id, type, data });

                // Timeout after 30 seconds
                setTimeout(() => {
                    if (this.pendingTasks.has(id)) {
                        this.pendingTasks.delete(id);
                        reject(new Error('Task timeout'));
                    }
                }, 30000);
            });
        },

        /**
         * Fallback execution in main thread
         */
        async executeInMainThread(type, data) {
            // Simple fallbacks for common operations
            switch (type) {
                case 'SEARCH_APUS':
                    return this.searchAPUs(data);

                case 'CALCULATE_BUDGET':
                    return this.calculateBudget(data);

                case 'FILTER_ACTIVITIES':
                    return this.filterActivities(data);

                case 'SORT_ACTIVITIES':
                    return this.sortActivities(data);

                default:
                    throw new Error(`Unsupported task type: ${type}`);
            }
        },

        /**
         * Search APUs (fallback)
         */
        searchAPUs({ apus, query, filters }) {
            const normalizedQuery = query.toLowerCase().trim();

            if (!normalizedQuery && (!filters || Object.keys(filters).length === 0)) {
                return apus;
            }

            return apus.filter(apu => {
                if (normalizedQuery) {
                    const matchesName = apu.nombre.toLowerCase().includes(normalizedQuery);
                    const matchesCode = apu.codigo?.toLowerCase().includes(normalizedQuery);
                    const matchesCategory = apu.categoria?.toLowerCase().includes(normalizedQuery);

                    if (!(matchesName || matchesCode || matchesCategory)) {
                        return false;
                    }
                }

                if (filters) {
                    if (filters.categoria && apu.categoria !== filters.categoria) {
                        return false;
                    }
                }

                return true;
            });
        },

        /**
         * Calculate budget (fallback)
         */
        calculateBudget({ activities }) {
            const total = activities.reduce((sum, act) => {
                return sum + (act.precio || 0) * (act.cantidad || 0);
            }, 0);

            return {
                total,
                activities: activities.length,
                average: total / (activities.length || 1)
            };
        },

        /**
         * Filter activities (fallback)
         */
        filterActivities({ activities, criteria }) {
            return activities.filter(activity => {
                for (const [key, value] of Object.entries(criteria)) {
                    if (value === null || value === undefined) continue;
                    if (activity[key] !== value) return false;
                }
                return true;
            });
        },

        /**
         * Sort activities (fallback)
         */
        sortActivities({ activities, field, direction = 'asc' }) {
            return [...activities].sort((a, b) => {
                const valA = a[field];
                const valB = b[field];

                if (valA < valB) return direction === 'asc' ? -1 : 1;
                if (valA > valB) return direction === 'asc' ? 1 : -1;
                return 0;
            });
        },

        /**
         * Terminate worker
         */
        terminate() {
            if (this.worker) {
                this.worker.terminate();
                this.worker = null;
            }
            this.pendingTasks.clear();
        },

        /**
         * Get pending task count
         */
        getPendingCount() {
            return this.pendingTasks.size;
        }
    };

    // Auto-initialize on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.ClaudiaWorkerManager.init();
        });
    } else {
        window.ClaudiaWorkerManager.init();
    }

    console.log('🔧 Worker Manager v6.7.2 loaded');

})();

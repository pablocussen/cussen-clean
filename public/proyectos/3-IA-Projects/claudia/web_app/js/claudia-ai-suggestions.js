/**
 * CLAUDIA AI Suggestions v6.7
 * Intelligent suggestions based on user behavior and project data
 */

(function() {
    'use strict';

    window.ClaudiaAI = {

        // Suggestion engine
        suggestionEngine: null,

        // User behavior tracking
        behavior: {
            searches: [],
            selections: [],
            projects: [],
            patterns: {}
        },

        /**
         * Initialize AI Suggestions
         */
        init() {
            console.log('🤖 AI Suggestions v6.7 initialized');

            // Load behavior from localStorage
            this.loadBehavior();

            // Setup event listeners
            this.setupListeners();

            // Start suggestion engine
            this.startSuggestionEngine();

            // Show suggestions periodically
            setInterval(() => this.showSmartSuggestions(), 300000); // Every 5 minutes
        },

        /**
         * Load user behavior from storage
         */
        loadBehavior() {
            try {
                const saved = localStorage.getItem('claudia_ai_behavior');
                if (saved) {
                    this.behavior = JSON.parse(saved);
                }
            } catch (err) {
                console.error('Failed to load behavior:', err);
            }
        },

        /**
         * Save user behavior
         */
        saveBehavior() {
            try {
                localStorage.setItem('claudia_ai_behavior', JSON.stringify(this.behavior));
            } catch (err) {
                console.error('Failed to save behavior:', err);
            }
        },

        /**
         * Setup event listeners
         */
        setupListeners() {
            // Track searches
            const searchInput = document.getElementById('apu-search');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    if (e.target.value.length > 2) {
                        this.trackSearch(e.target.value);
                    }
                });
            }

            // Track APU selections
            document.addEventListener('click', (e) => {
                const apuCard = e.target.closest('.apu-card');
                if (apuCard) {
                    const apuName = apuCard.querySelector('.apu-name')?.textContent;
                    if (apuName) {
                        this.trackSelection(apuName);
                    }
                }
            });

            // Track project activity
            this.trackProjectActivity();
        },

        /**
         * Track search query
         */
        trackSearch(query) {
            this.behavior.searches.push({
                query: query.toLowerCase(),
                timestamp: Date.now()
            });

            // Keep last 100 searches
            if (this.behavior.searches.length > 100) {
                this.behavior.searches.shift();
            }

            this.saveBehavior();
            this.analyzePatterns();
        },

        /**
         * Track APU selection
         */
        trackSelection(apuName) {
            this.behavior.selections.push({
                apu: apuName,
                timestamp: Date.now()
            });

            // Keep last 50 selections
            if (this.behavior.selections.length > 50) {
                this.behavior.selections.shift();
            }

            this.saveBehavior();
            this.analyzePatterns();
        },

        /**
         * Track project activity
         */
        trackProjectActivity() {
            setInterval(() => {
                if (window.getCurrentProject) {
                    const project = window.getCurrentProject();
                    if (project) {
                        this.behavior.projects.push({
                            id: project.id,
                            activities: project.activities?.length || 0,
                            timestamp: Date.now()
                        });

                        // Keep last 20 project snapshots
                        if (this.behavior.projects.length > 20) {
                            this.behavior.projects.shift();
                        }

                        this.saveBehavior();
                    }
                }
            }, 60000); // Every minute
        },

        /**
         * Analyze behavior patterns
         */
        analyzePatterns() {
            // Analyze search patterns
            const searches = this.behavior.searches.slice(-20);
            const keywords = {};

            searches.forEach(s => {
                const words = s.query.split(/\s+/);
                words.forEach(word => {
                    if (word.length > 3) {
                        keywords[word] = (keywords[word] || 0) + 1;
                    }
                });
            });

            // Find most common keywords
            const topKeywords = Object.entries(keywords)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([word]) => word);

            this.behavior.patterns.topKeywords = topKeywords;

            // Analyze selection patterns
            const selections = this.behavior.selections.slice(-20);
            const categories = {};

            selections.forEach(s => {
                const category = this.getAPUCategory(s.apu);
                categories[category] = (categories[category] || 0) + 1;
            });

            this.behavior.patterns.topCategories = Object.entries(categories)
                .sort((a, b) => b[1] - a[1])
                .map(([cat]) => cat);

            this.saveBehavior();
        },

        /**
         * Get APU category from name
         */
        getAPUCategory(apuName) {
            const name = apuName.toLowerCase();

            if (name.includes('hormigón') || name.includes('concreto')) return 'Hormigón';
            if (name.includes('fierro') || name.includes('acero')) return 'Fierro';
            if (name.includes('albañilería') || name.includes('ladrillo')) return 'Albañilería';
            if (name.includes('pintura')) return 'Pintura';
            if (name.includes('eléctric')) return 'Eléctrica';
            if (name.includes('sanitari') || name.includes('agua')) return 'Sanitaria';
            if (name.includes('carpinterí') || name.includes('madera')) return 'Carpintería';

            return 'Otros';
        },

        /**
         * Start suggestion engine
         */
        startSuggestionEngine() {
            // Generate suggestions based on patterns
            setInterval(() => {
                this.generateSuggestions();
            }, 120000); // Every 2 minutes
        },

        /**
         * Generate smart suggestions
         */
        generateSuggestions() {
            const suggestions = [];

            // Based on search patterns
            if (this.behavior.patterns.topKeywords?.length > 0) {
                const keyword = this.behavior.patterns.topKeywords[0];
                suggestions.push({
                    type: 'search',
                    title: `Búsqueda relacionada`,
                    message: `Parece que estás buscando "${keyword}". ¿Quieres ver APUs relacionados?`,
                    action: () => this.searchRelated(keyword),
                    priority: 2
                });
            }

            // Based on project size
            const project = window.getCurrentProject?.();
            if (project) {
                const activityCount = project.activities?.length || 0;

                if (activityCount === 0) {
                    suggestions.push({
                        type: 'onboarding',
                        title: 'Comienza tu proyecto',
                        message: 'Agrega tu primera actividad para ver el presupuesto en tiempo real',
                        action: () => document.getElementById('apu-search')?.focus(),
                        priority: 3
                    });
                } else if (activityCount >= 5 && !project.tasks?.length) {
                    suggestions.push({
                        type: 'feature',
                        title: 'Organiza tu proyecto',
                        message: 'Tu proyecto tiene varias actividades. ¿Quieres crear tareas para hacer seguimiento?',
                        action: () => this.openTaskManager(),
                        priority: 2
                    });
                }

                // Budget optimization
                const total = project.activities?.reduce((sum, a) => sum + (a.total || 0), 0) || 0;
                if (total > 1000000) {
                    suggestions.push({
                        type: 'optimization',
                        title: 'Optimiza tu presupuesto',
                        message: `Tu proyecto tiene un presupuesto de $${ClaudiaUtils.formatMoney(total)}. Puedes comparar precios para ahorrar hasta un 15%`,
                        action: () => this.openPriceComparison(),
                        priority: 3
                    });
                }
            }

            // Based on time of day
            const hour = new Date().getHours();
            if (hour >= 8 && hour < 10) {
                suggestions.push({
                    type: 'motivation',
                    title: '¡Buenos días!',
                    message: 'Comienza el día revisando el avance de tu proyecto',
                    action: () => this.showDashboard(),
                    priority: 1
                });
            }

            // Store suggestions
            this.currentSuggestions = suggestions.sort((a, b) => b.priority - a.priority);
        },

        /**
         * Show smart suggestions
         */
        showSmartSuggestions() {
            if (!this.currentSuggestions || this.currentSuggestions.length === 0) {
                return;
            }

            const suggestion = this.currentSuggestions[0];

            // Check if user wants suggestions
            if (localStorage.getItem('claudia_ai_suggestions') === 'false') {
                return;
            }

            // Don't show too frequently
            const lastShown = parseInt(localStorage.getItem('claudia_ai_last_suggestion') || '0');
            if (Date.now() - lastShown < 600000) { // 10 minutes
                return;
            }

            this.showSuggestionNotification(suggestion);
            localStorage.setItem('claudia_ai_last_suggestion', Date.now().toString());
        },

        /**
         * Show suggestion notification
         */
        showSuggestionNotification(suggestion) {
            const notification = document.createElement('div');
            notification.className = 'ai-suggestion-notification';
            notification.style.cssText = `
                position: fixed;
                bottom: 80px;
                right: 20px;
                max-width: 360px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                padding: 20px;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4);
                z-index: 9999;
                animation: slideInUp 0.3s ease-out;
                cursor: pointer;
            `;

            notification.innerHTML = `
                <div style="display: flex; align-items: start; gap: 15px;">
                    <div style="font-size: 32px;">🤖</div>
                    <div style="flex: 1;">
                        <div style="font-weight: 700; font-size: 16px; margin-bottom: 8px;">${suggestion.title}</div>
                        <div style="font-size: 14px; opacity: 0.95; line-height: 1.5;">${suggestion.message}</div>
                        <div style="margin-top: 15px; display: flex; gap: 10px;">
                            <button class="ai-suggestion-accept" style="flex: 1; background: white; color: #667eea; border: none; padding: 10px; border-radius: 6px; font-weight: 700; cursor: pointer;">
                                Sí, mostrar
                            </button>
                            <button class="ai-suggestion-dismiss" style="flex: 1; background: rgba(255,255,255,0.2); color: white; border: none; padding: 10px; border-radius: 6px; font-weight: 600; cursor: pointer;">
                                Ahora no
                            </button>
                        </div>
                    </div>
                    <button class="ai-suggestion-close" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 0; width: 32px; height: 32px;">✕</button>
                </div>
            `;

            // Accept button
            notification.querySelector('.ai-suggestion-accept').onclick = (e) => {
                e.stopPropagation();
                suggestion.action();
                notification.remove();
            };

            // Dismiss button
            notification.querySelector('.ai-suggestion-dismiss').onclick = (e) => {
                e.stopPropagation();
                notification.style.animation = 'slideOutDown 0.3s ease-out';
                setTimeout(() => notification.remove(), 300);
            };

            // Close button
            notification.querySelector('.ai-suggestion-close').onclick = (e) => {
                e.stopPropagation();
                notification.remove();
            };

            // Add animations
            const style = document.createElement('style');
            style.textContent = `
                @keyframes slideInUp {
                    from { transform: translateY(100px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes slideOutDown {
                    from { transform: translateY(0); opacity: 1; }
                    to { transform: translateY(100px); opacity: 0; }
                }
            `;
            document.head.appendChild(style);

            document.body.appendChild(notification);

            // Auto-dismiss after 15 seconds
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    notification.style.animation = 'slideOutDown 0.3s ease-out';
                    setTimeout(() => notification.remove(), 300);
                }
            }, 15000);
        },

        /**
         * Action: Search related
         */
        searchRelated(keyword) {
            const searchInput = document.getElementById('apu-search');
            if (searchInput) {
                searchInput.value = keyword;
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                searchInput.focus();
            }
        },

        /**
         * Action: Open task manager
         */
        openTaskManager() {
            // Trigger task manager
            const taskBtn = document.querySelector('[onclick*="toggleTasks"]');
            if (taskBtn) {
                taskBtn.click();
            }
        },

        /**
         * Action: Open price comparison
         */
        openPriceComparison() {
            if (window.openPriceComparison) {
                window.openPriceComparison();
            }
        },

        /**
         * Action: Show dashboard
         */
        showDashboard() {
            if (window.showDashboard) {
                window.showDashboard();
            }
        },

        /**
         * Toggle AI suggestions on/off
         */
        toggleSuggestions(enabled) {
            localStorage.setItem('claudia_ai_suggestions', enabled ? 'true' : 'false');
            if (enabled) {
                ClaudiaUtils.showNotification('Sugerencias IA activadas', 'success');
            } else {
                ClaudiaUtils.showNotification('Sugerencias IA desactivadas', 'info');
            }
        }
    };

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => ClaudiaAI.init(), 2000);
        });
    } else {
        setTimeout(() => ClaudiaAI.init(), 2000);
    }

})();

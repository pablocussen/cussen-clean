/**
 * CLAUDIA Skeleton Loaders v5.5
 * Loading states profesionales para percepción de velocidad
 * - Skeleton screens en lugar de spinners
 * - Lazy loading inteligente
 * - Perceived performance optimization
 */

(function() {
    'use strict';

    // ==========================================
    // 1. SKELETON TEMPLATES
    // ==========================================

    const SkeletonTemplates = {
        // APU Card skeleton
        apuCard: `
            <div class="apu-card skeleton-card">
                <div class="skeleton-header">
                    <div class="skeleton-line" style="width: 40%; height: 12px;"></div>
                    <div class="skeleton-line" style="width: 30%; height: 12px;"></div>
                </div>
                <div class="skeleton-line" style="width: 100%; height: 16px; margin: 12px 0;"></div>
                <div class="skeleton-line" style="width: 80%; height: 16px; margin-bottom: 12px;"></div>
                <div class="skeleton-footer">
                    <div class="skeleton-line" style="width: 50%; height: 12px;"></div>
                    <div class="skeleton-line" style="width: 30%; height: 12px;"></div>
                </div>
                <div class="skeleton-button"></div>
            </div>
        `,

        // Project activity skeleton
        projectActivity: `
            <div class="project-activity-item skeleton-card">
                <div style="flex: 1;">
                    <div class="skeleton-line" style="width: 70%; height: 14px; margin-bottom: 8px;"></div>
                    <div class="skeleton-line" style="width: 50%; height: 12px;"></div>
                </div>
                <div class="skeleton-line" style="width: 80px; height: 20px;"></div>
            </div>
        `,

        // Task skeleton
        task: `
            <div class="task-item skeleton-card">
                <div class="skeleton-circle" style="width: 20px; height: 20px;"></div>
                <div class="skeleton-line" style="flex: 1; height: 14px;"></div>
                <div class="skeleton-circle" style="width: 24px; height: 24px;"></div>
            </div>
        `,

        // Chat message skeleton
        chatMessage: `
            <div class="message claudia">
                <div class="message-avatar skeleton-circle"></div>
                <div class="message-content skeleton-card" style="max-width: 75%;">
                    <div class="skeleton-line" style="width: 100%; height: 14px; margin-bottom: 8px;"></div>
                    <div class="skeleton-line" style="width: 80%; height: 14px;"></div>
                </div>
            </div>
        `
    };

    // ==========================================
    // 2. SKELETON LOADER CLASS
    // ==========================================

    class SkeletonLoader {
        constructor() {
            this.injectStyles();
            console.log('[Skeleton] ✅ Loader initialized');
        }

        injectStyles() {
            const style = document.createElement('style');
            style.innerHTML = `
                /* Skeleton base */
                .skeleton-card {
                    animation: skeleton-pulse 1.5s ease-in-out infinite;
                    pointer-events: none;
                    user-select: none;
                }

                .skeleton-line {
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: skeleton-loading 1.5s ease-in-out infinite;
                    border-radius: 4px;
                }

                .skeleton-circle {
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: skeleton-loading 1.5s ease-in-out infinite;
                    border-radius: 50%;
                }

                .skeleton-button {
                    width: 100%;
                    height: 40px;
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: skeleton-loading 1.5s ease-in-out infinite;
                    border-radius: 8px;
                    margin-top: 12px;
                }

                .skeleton-header, .skeleton-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 12px;
                }

                @keyframes skeleton-loading {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }

                @keyframes skeleton-pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }

                /* Fade in cuando se carga el contenido real */
                .fade-in-content {
                    animation: fadeIn 0.5s ease-in;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `;
            document.head.appendChild(style);
        }

        // Mostrar skeletons para APU grid
        showAPUSkeletons(container, count = 6) {
            container.innerHTML = '';
            for (let i = 0; i < count; i++) {
                container.insertAdjacentHTML('beforeend', SkeletonTemplates.apuCard);
            }
        }

        // Mostrar skeletons para activities
        showActivitySkeletons(container, count = 3) {
            container.innerHTML = '';
            for (let i = 0; i < count; i++) {
                container.insertAdjacentHTML('beforeend', SkeletonTemplates.projectActivity);
            }
        }

        // Mostrar skeleton para chat
        showChatSkeleton(container) {
            container.insertAdjacentHTML('beforeend', SkeletonTemplates.chatMessage);
        }

        // Ocultar skeletons y mostrar contenido
        hideSkeletons(container) {
            const skeletons = container.querySelectorAll('.skeleton-card');
            skeletons.forEach(sk => sk.remove());
        }

        // Replace con fade
        replaceWithContent(container, content) {
            this.hideSkeletons(container);
            container.innerHTML = content;
            container.querySelectorAll('.apu-card, .project-activity-item, .task-item').forEach(el => {
                el.classList.add('fade-in-content');
            });
        }
    }

    // ==========================================
    // 3. LAZY LOADING IMAGES
    // ==========================================

    class LazyImageLoader {
        constructor() {
            this.images = [];
            this.observer = null;
            this.init();
        }

        init() {
            if ('IntersectionObserver' in window) {
                this.observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            this.loadImage(entry.target);
                            this.observer.unobserve(entry.target);
                        }
                    });
                }, {
                    rootMargin: '50px'
                });

                this.observeImages();
                console.log('[LazyLoad] ✅ Image lazy loading enabled');
            } else {
                // Fallback: cargar todas las imágenes
                this.loadAllImages();
            }
        }

        observeImages() {
            document.querySelectorAll('img[data-src]').forEach(img => {
                this.observer.observe(img);
            });
        }

        loadImage(img) {
            const src = img.getAttribute('data-src');
            if (!src) return;

            img.src = src;
            img.removeAttribute('data-src');
            img.classList.add('fade-in-content');
        }

        loadAllImages() {
            document.querySelectorAll('img[data-src]').forEach(img => {
                this.loadImage(img);
            });
        }

        // Agregar nueva imagen para lazy load
        addImage(img) {
            if (this.observer) {
                this.observer.observe(img);
            } else {
                this.loadImage(img);
            }
        }
    }

    // ==========================================
    // 4. PROGRESSIVE LOADING
    // ==========================================

    class ProgressiveLoader {
        constructor() {
            this.skeleton = new SkeletonLoader();
        }

        // Cargar APUs progresivamente
        async loadAPUsProgressive(apus, container, batchSize = 20) {
            // Mostrar skeletons primero
            this.skeleton.showAPUSkeletons(container, batchSize);

            // Simular delay para skeleton visibility
            await this.delay(300);

            // Cargar en batches
            const batches = this.chunkArray(apus, batchSize);

            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];

                if (i === 0) {
                    // Primera batch reemplaza skeletons
                    this.skeleton.hideSkeletons(container);
                }

                // Renderizar batch
                batch.forEach(apu => {
                    const card = this.createAPUCard(apu);
                    card.classList.add('fade-in-content');
                    container.appendChild(card);
                });

                // Pequeño delay entre batches para suavidad
                if (i < batches.length - 1) {
                    await this.delay(50);
                }
            }
        }

        // Helper: dividir array en chunks
        chunkArray(array, size) {
            const chunks = [];
            for (let i = 0; i < array.length; i += size) {
                chunks.push(array.slice(i, i + size));
            }
            return chunks;
        }

        // Helper: delay promise
        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        // Crear APU card (placeholder - debe ser reemplazado por la función real)
        createAPUCard(apu) {
            const card = document.createElement('div');
            card.className = 'apu-card';
            card.innerHTML = `
                <div class="apu-card-header">
                    <div class="apu-category">${apu.categoria || 'General'}</div>
                    <div class="apu-unit">${apu.unidad || 'm2'}</div>
                </div>
                <div class="apu-card-title">${apu.nombre || 'Actividad'}</div>
                <div class="apu-card-meta">
                    <span>Código: ${apu.codigo || 'N/A'}</span>
                    <span class="apu-price">$${(apu.precio_unitario || 0).toLocaleString('es-CL')}</span>
                </div>
                <button class="apu-select-btn" onclick="selectAPU('${apu.codigo}')">
                    <span>➕</span>
                    <span>Seleccionar</span>
                </button>
            `;
            return card;
        }
    }

    // ==========================================
    // 5. APU SEARCH MOBILE OPTIMIZATION
    // ==========================================

    class APUSearchMobileOptimizer {
        constructor() {
            this.searchInput = null;
            this.resultsContainer = null;
            this.debounceTimer = null;
            this.init();
        }

        init() {
            // Esperar a que DOM esté listo
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setup());
            } else {
                this.setup();
            }
        }

        setup() {
            this.searchInput = document.getElementById('apu-search');
            this.resultsContainer = document.getElementById('apu-grid');

            if (!this.searchInput) {
                console.log('[APU Search] Waiting for search input...');
                return;
            }

            this.optimizeSearchInput();
            this.addVoiceSearch();
            this.addSearchSuggestions();

            console.log('[APU Search] ✅ Mobile optimization active');
        }

        optimizeSearchInput() {
            if (!this.searchInput) return;

            // Atributos móvil-friendly
            this.searchInput.setAttribute('autocomplete', 'off');
            this.searchInput.setAttribute('autocorrect', 'off');
            this.searchInput.setAttribute('autocapitalize', 'none');
            this.searchInput.setAttribute('spellcheck', 'false');

            // Placeholder más claro
            this.searchInput.placeholder = '🔍 Busca: radier, muro, pintura...';

            // Focus automático en móvil (opcional)
            if (window.innerWidth > 768) {
                // Solo en desktop
                // this.searchInput.focus();
            }
        }

        addVoiceSearch() {
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                return; // Speech API no disponible
            }

            // Agregar botón de voz al search
            const searchBox = this.searchInput.closest('.search-box');
            if (!searchBox) return;

            const voiceBtn = document.createElement('button');
            voiceBtn.className = 'voice-search-btn';
            voiceBtn.innerHTML = '🎤';
            voiceBtn.onclick = (e) => {
                e.preventDefault();
                this.startVoiceSearch();
            };

            voiceBtn.style.cssText = `
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                border: none;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 20px;
                transition: all 0.3s ease;
                flex-shrink: 0;
            `;

            searchBox.appendChild(voiceBtn);
        }

        startVoiceSearch() {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();

            recognition.lang = 'es-CL';
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onstart = () => {
                this.searchInput.placeholder = '🎤 Escuchando...';
                if (window.mobileOptimizer) {
                    window.mobileOptimizer.hapticFeedback('light');
                }
            };

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.searchInput.value = transcript;
                this.searchInput.dispatchEvent(new Event('input', { bubbles: true }));

                if (window.mobileOptimizer) {
                    window.mobileOptimizer.hapticFeedback('success');
                }
            };

            recognition.onerror = (event) => {
                console.error('[Voice Search] Error:', event.error);
                this.searchInput.placeholder = '🔍 Busca: radier, muro, pintura...';
            };

            recognition.onend = () => {
                this.searchInput.placeholder = '🔍 Busca: radier, muro, pintura...';
            };

            recognition.start();
        }

        addSearchSuggestions() {
            const suggestions = [
                'radier', 'muro', 'pintura', 'excavación',
                'hormigón', 'enfierradura', 'tabiquería', 'cerámico'
            ];

            // Crear chips de sugerencias
            const searchContainer = this.searchInput.closest('.search-container');
            if (!searchContainer) return;

            const suggestionsContainer = document.createElement('div');
            suggestionsContainer.className = 'search-suggestions';
            suggestionsContainer.style.cssText = `
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
                margin-top: 12px;
            `;

            suggestions.forEach(term => {
                const chip = document.createElement('button');
                chip.className = 'suggestion-chip';
                chip.textContent = term;
                chip.onclick = () => {
                    this.searchInput.value = term;
                    this.searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                    if (window.mobileOptimizer) {
                        window.mobileOptimizer.hapticFeedback('light');
                    }
                };

                chip.style.cssText = `
                    background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
                    border: none;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #333;
                    cursor: pointer;
                    transition: all 0.3s ease;
                `;

                suggestionsContainer.appendChild(chip);
            });

            searchContainer.appendChild(suggestionsContainer);
        }
    }

    // ==========================================
    // 6. INITIALIZE
    // ==========================================

    // Global instances
    window.skeletonLoader = new SkeletonLoader();
    window.lazyImageLoader = new LazyImageLoader();
    window.progressiveLoader = new ProgressiveLoader();
    window.apuSearchOptimizer = new APUSearchMobileOptimizer();

    console.log('✅ CLAUDIA Skeleton Loaders v5.5 initialized');
    console.log('💀 Skeleton screens ready');
    console.log('🖼️ Lazy image loading active');
    console.log('📊 Progressive loading enabled');
    console.log('🔍 APU search optimized for mobile');

})();

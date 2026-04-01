/**
 * CLAUDIA Presentation Mode v6.7.1
 * Professional fullscreen presentation mode for projects
 * Perfect for client meetings and pitches
 */

(function() {
    'use strict';

    window.ClaudiaPresentationMode = {

        active: false,
        currentSlide: 0,
        slides: [],
        container: null,

        /**
         * Start presentation mode
         */
        async start(projectId) {
            const project = projectId ?
                window.PROJECTS?.find(p => p.id === projectId) :
                window.getCurrentProject?.();

            if (!project) {
                ClaudiaUtils.showNotification('No hay proyecto para presentar', 'error');
                return;
            }

            // Generate slides
            this.slides = this.generateSlides(project);
            this.currentSlide = 0;

            // Create presentation container
            this.createContainer();

            // Enter fullscreen
            await this.enterFullscreen();

            // Show first slide
            this.renderSlide(0);

            // Setup keyboard navigation
            this.setupNavigation();

            // Track analytics
            if (window.ClaudiaDB) {
                ClaudiaDB.trackEvent('presentation_started', { projectId: project.id });
            }

            this.active = true;
            console.log('🎬 Presentation mode started');
        },

        /**
         * Generate slides from project
         */
        generateSlides(project) {
            const total = project.activities?.reduce((sum, a) => sum + (a.total || 0), 0) || 0;
            const slides = [];

            // Slide 1: Title
            slides.push({
                type: 'title',
                title: project.name,
                subtitle: `Presupuesto: ${ClaudiaUtils.formatMoney(total)}`,
                background: 'linear-gradient(135deg, #667eea, #764ba2)'
            });

            // Slide 2: Summary
            slides.push({
                type: 'summary',
                title: 'Resumen del Proyecto',
                data: {
                    actividades: project.activities?.length || 0,
                    presupuesto: total,
                    tareas: project.tasks?.length || 0,
                    completadas: project.tasks?.filter(t => t.status === 'completed').length || 0
                }
            });

            // Slide 3-N: Activities by category
            const categories = this.groupByCategory(project.activities || []);
            Object.entries(categories).forEach(([category, activities]) => {
                const categoryTotal = activities.reduce((sum, a) => sum + (a.total || 0), 0);

                slides.push({
                    type: 'category',
                    title: category,
                    subtitle: `${activities.length} actividades`,
                    total: categoryTotal,
                    percentage: ((categoryTotal / total) * 100).toFixed(1),
                    activities
                });
            });

            // Slide: Timeline (if calendar data exists)
            if (project.calendar?.events?.length > 0) {
                slides.push({
                    type: 'timeline',
                    title: 'Cronograma',
                    events: project.calendar.events
                });
            }

            // Slide: Photos (if available)
            if (project.photos?.length > 0) {
                slides.push({
                    type: 'photos',
                    title: 'Galería de Fotos',
                    photos: project.photos.slice(0, 9) // Max 9 photos
                });
            }

            // Final slide: Contact/Next Steps
            slides.push({
                type: 'final',
                title: '¡Gracias!',
                subtitle: 'Generado con CLAUDIA',
                background: 'linear-gradient(135deg, #667eea, #764ba2)'
            });

            return slides;
        },

        /**
         * Group activities by category
         */
        groupByCategory(activities) {
            const categories = {};

            activities.forEach(activity => {
                const category = activity.categoria || 'Otros';
                if (!categories[category]) {
                    categories[category] = [];
                }
                categories[category].push(activity);
            });

            return categories;
        },

        /**
         * Create presentation container
         */
        createContainer() {
            this.container = document.createElement('div');
            this.container.id = 'presentation-mode';
            this.container.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: #1a1a1a;
                z-index: 99999;
                display: flex;
                flex-direction: column;
            `;

            document.body.appendChild(this.container);
        },

        /**
         * Render slide
         */
        renderSlide(index) {
            if (index < 0 || index >= this.slides.length) return;

            const slide = this.slides[index];
            this.currentSlide = index;

            let html = '';

            switch (slide.type) {
                case 'title':
                    html = this.renderTitleSlide(slide);
                    break;
                case 'summary':
                    html = this.renderSummarySlide(slide);
                    break;
                case 'category':
                    html = this.renderCategorySlide(slide);
                    break;
                case 'timeline':
                    html = this.renderTimelineSlide(slide);
                    break;
                case 'photos':
                    html = this.renderPhotosSlide(slide);
                    break;
                case 'final':
                    html = this.renderFinalSlide(slide);
                    break;
            }

            this.container.innerHTML = `
                ${html}
                ${this.renderControls()}
            `;

            // Add animation
            const slideContent = this.container.querySelector('.slide-content');
            if (slideContent) {
                slideContent.style.animation = 'slideIn 0.5s ease-out';
            }
        },

        /**
         * Render title slide
         */
        renderTitleSlide(slide) {
            return `
                <div class="slide-content" style="
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    background: ${slide.background};
                    color: white;
                    padding: 60px;
                    text-align: center;
                ">
                    <h1 style="font-size: 72px; margin: 0 0 30px 0; font-weight: 800; text-shadow: 0 4px 12px rgba(0,0,0,0.3);">
                        ${slide.title}
                    </h1>
                    <p style="font-size: 36px; margin: 0; opacity: 0.95; font-weight: 500;">
                        ${slide.subtitle}
                    </p>
                </div>
            `;
        },

        /**
         * Render summary slide
         */
        renderSummarySlide(slide) {
            return `
                <div class="slide-content" style="
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    padding: 60px;
                    background: white;
                ">
                    <h2 style="font-size: 48px; margin: 0 0 60px 0; color: #1a1a1a; font-weight: 700;">
                        ${slide.title}
                    </h2>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 40px; flex: 1;">
                        <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 40px; border-radius: 20px; color: white;">
                            <div style="font-size: 64px; font-weight: 800; margin-bottom: 15px;">
                                ${slide.data.actividades}
                            </div>
                            <div style="font-size: 28px; opacity: 0.95;">Actividades</div>
                        </div>
                        <div style="background: linear-gradient(135deg, #f093fb, #f5576c); padding: 40px; border-radius: 20px; color: white;">
                            <div style="font-size: 48px; font-weight: 800; margin-bottom: 15px;">
                                $${ClaudiaUtils.formatMoney(slide.data.presupuesto)}
                            </div>
                            <div style="font-size: 28px; opacity: 0.95;">Presupuesto Total</div>
                        </div>
                        <div style="background: linear-gradient(135deg, #4facfe, #00f2fe); padding: 40px; border-radius: 20px; color: white;">
                            <div style="font-size: 64px; font-weight: 800; margin-bottom: 15px;">
                                ${slide.data.tareas}
                            </div>
                            <div style="font-size: 28px; opacity: 0.95;">Tareas Totales</div>
                        </div>
                        <div style="background: linear-gradient(135deg, #43e97b, #38f9d7); padding: 40px; border-radius: 20px; color: white;">
                            <div style="font-size: 64px; font-weight: 800; margin-bottom: 15px;">
                                ${slide.data.completadas}
                            </div>
                            <div style="font-size: 28px; opacity: 0.95;">Completadas</div>
                        </div>
                    </div>
                </div>
            `;
        },

        /**
         * Render category slide
         */
        renderCategorySlide(slide) {
            return `
                <div class="slide-content" style="
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    padding: 60px;
                    background: white;
                ">
                    <div style="margin-bottom: 40px;">
                        <h2 style="font-size: 48px; margin: 0 0 15px 0; color: #1a1a1a; font-weight: 700;">
                            ${slide.title}
                        </h2>
                        <div style="font-size: 24px; color: #6b7280;">
                            ${slide.subtitle} • ${slide.percentage}% del presupuesto
                        </div>
                        <div style="font-size: 36px; font-weight: 700; color: #667eea; margin-top: 15px;">
                            $${ClaudiaUtils.formatMoney(slide.total)}
                        </div>
                    </div>
                    <div style="flex: 1; overflow-y: auto;">
                        ${slide.activities.map((activity, i) => `
                            <div style="
                                background: #f9fafb;
                                padding: 25px;
                                border-radius: 12px;
                                margin-bottom: 15px;
                                border-left: 4px solid #667eea;
                            ">
                                <div style="display: flex; justify-content: space-between; align-items: start;">
                                    <div style="flex: 1;">
                                        <div style="font-size: 22px; font-weight: 600; color: #1a1a1a; margin-bottom: 8px;">
                                            ${activity.nombre}
                                        </div>
                                        <div style="font-size: 18px; color: #6b7280;">
                                            ${activity.cantidad} ${activity.unidad}
                                        </div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-size: 28px; font-weight: 700; color: #667eea;">
                                            $${ClaudiaUtils.formatMoney(activity.total)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        },

        /**
         * Render timeline slide
         */
        renderTimelineSlide(slide) {
            return `
                <div class="slide-content" style="
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    padding: 60px;
                    background: white;
                ">
                    <h2 style="font-size: 48px; margin: 0 0 60px 0; color: #1a1a1a; font-weight: 700;">
                        ${slide.title}
                    </h2>
                    <div style="flex: 1; position: relative;">
                        ${slide.events.map((event, i) => `
                            <div style="display: flex; gap: 30px; margin-bottom: 40px;">
                                <div style="width: 200px; text-align: right; font-size: 20px; color: #6b7280; font-weight: 600;">
                                    ${new Date(event.date).toLocaleDateString('es-CL')}
                                </div>
                                <div style="background: #667eea; padding: 25px 35px; border-radius: 12px; color: white; flex: 1;">
                                    <div style="font-size: 26px; font-weight: 700; margin-bottom: 8px;">
                                        ${event.title}
                                    </div>
                                    ${event.description ? `
                                        <div style="font-size: 18px; opacity: 0.95;">
                                            ${event.description}
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        },

        /**
         * Render photos slide
         */
        renderPhotosSlide(slide) {
            return `
                <div class="slide-content" style="
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    padding: 60px;
                    background: #1a1a1a;
                ">
                    <h2 style="font-size: 48px; margin: 0 0 60px 0; color: white; font-weight: 700;">
                        ${slide.title}
                    </h2>
                    <div style="
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 20px;
                        flex: 1;
                    ">
                        ${slide.photos.map(photo => `
                            <div style="
                                background: url('${photo.url}') center/cover;
                                border-radius: 12px;
                                box-shadow: 0 8px 24px rgba(0,0,0,0.3);
                            "></div>
                        `).join('')}
                    </div>
                </div>
            `;
        },

        /**
         * Render final slide
         */
        renderFinalSlide(slide) {
            return `
                <div class="slide-content" style="
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    background: ${slide.background};
                    color: white;
                    padding: 60px;
                    text-align: center;
                ">
                    <h1 style="font-size: 72px; margin: 0 0 30px 0; font-weight: 800; text-shadow: 0 4px 12px rgba(0,0,0,0.3);">
                        ${slide.title}
                    </h1>
                    <p style="font-size: 32px; margin: 0; opacity: 0.95; font-weight: 500;">
                        ${slide.subtitle}
                    </p>
                    <div style="margin-top: 60px; font-size: 24px; opacity: 0.8;">
                        🦄 Tu Asistente Inteligente de Construcción
                    </div>
                </div>
            `;
        },

        /**
         * Render controls
         */
        renderControls() {
            return `
                <style>
                    @keyframes slideIn {
                        from { opacity: 0; transform: translateX(30px); }
                        to { opacity: 1; transform: translateX(0); }
                    }
                </style>
                <div style="
                    position: fixed;
                    bottom: 30px;
                    right: 30px;
                    display: flex;
                    gap: 15px;
                    z-index: 100000;
                ">
                    <button onclick="ClaudiaPresentationMode.previousSlide()" style="
                        background: rgba(255,255,255,0.9);
                        border: none;
                        padding: 15px 25px;
                        border-radius: 50px;
                        font-size: 24px;
                        cursor: pointer;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                        transition: transform 0.2s;
                    " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                        ←
                    </button>
                    <div style="
                        background: rgba(255,255,255,0.9);
                        padding: 15px 25px;
                        border-radius: 50px;
                        font-size: 18px;
                        font-weight: 600;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                    ">
                        ${this.currentSlide + 1} / ${this.slides.length}
                    </div>
                    <button onclick="ClaudiaPresentationMode.nextSlide()" style="
                        background: rgba(255,255,255,0.9);
                        border: none;
                        padding: 15px 25px;
                        border-radius: 50px;
                        font-size: 24px;
                        cursor: pointer;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                        transition: transform 0.2s;
                    " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                        →
                    </button>
                    <button onclick="ClaudiaPresentationMode.stop()" style="
                        background: #ef4444;
                        color: white;
                        border: none;
                        padding: 15px 25px;
                        border-radius: 50px;
                        font-size: 18px;
                        font-weight: 600;
                        cursor: pointer;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                        transition: transform 0.2s;
                    " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                        Salir
                    </button>
                </div>
            `;
        },

        /**
         * Setup keyboard navigation
         */
        setupNavigation() {
            this.keyHandler = (e) => {
                switch(e.key) {
                    case 'ArrowRight':
                    case 'PageDown':
                    case ' ':
                        e.preventDefault();
                        this.nextSlide();
                        break;
                    case 'ArrowLeft':
                    case 'PageUp':
                        e.preventDefault();
                        this.previousSlide();
                        break;
                    case 'Escape':
                        this.stop();
                        break;
                    case 'f':
                    case 'F':
                        this.toggleFullscreen();
                        break;
                }
            };

            document.addEventListener('keydown', this.keyHandler);
        },

        /**
         * Next slide
         */
        nextSlide() {
            if (this.currentSlide < this.slides.length - 1) {
                this.renderSlide(this.currentSlide + 1);
            }
        },

        /**
         * Previous slide
         */
        previousSlide() {
            if (this.currentSlide > 0) {
                this.renderSlide(this.currentSlide - 1);
            }
        },

        /**
         * Enter fullscreen
         */
        async enterFullscreen() {
            try {
                if (this.container.requestFullscreen) {
                    await this.container.requestFullscreen();
                }
            } catch (err) {
                console.error('Fullscreen failed:', err);
            }
        },

        /**
         * Toggle fullscreen
         */
        async toggleFullscreen() {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            } else {
                await this.enterFullscreen();
            }
        },

        /**
         * Stop presentation
         */
        async stop() {
            this.active = false;

            // Exit fullscreen
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            }

            // Remove container
            if (this.container) {
                this.container.remove();
                this.container = null;
            }

            // Remove keyboard handler
            if (this.keyHandler) {
                document.removeEventListener('keydown', this.keyHandler);
                this.keyHandler = null;
            }

            console.log('🎬 Presentation mode stopped');
        }
    };

    // Export globally
    window.startPresentation = (projectId) => ClaudiaPresentationMode.start(projectId);

    console.log('🎬 Presentation Mode v6.7.1 loaded');

})();

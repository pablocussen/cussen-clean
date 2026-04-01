/**
 * CLAUDIA Smart Forms v5.5
 * Formularios inteligentes para maestros constructores
 * - Auto-complete inteligente
 * - Defaults basados en uso previo
 * - Validación en tiempo real
 * - Ayudas contextuales
 */

(function() {
    'use strict';

    // ==========================================
    // 1. SMART FORM MANAGER
    // ==========================================

    class SmartFormManager {
        constructor() {
            this.formHistory = this.loadFormHistory();
            this.commonValues = this.loadCommonValues();
            this.init();
        }

        init() {
            this.setupAutoComplete();
            this.setupSmartDefaults();
            this.setupValidation();
            this.setupHelpSystem();
            console.log('[Smart Forms] ✅ Initialized');
        }

        loadFormHistory() {
            try {
                return JSON.parse(localStorage.getItem('claudia_form_history')) || {};
            } catch (e) {
                return {};
            }
        }

        saveFormHistory() {
            localStorage.setItem('claudia_form_history', JSON.stringify(this.formHistory));
        }

        loadCommonValues() {
            return {
                projectTypes: [
                    'Ampliación', 'Casa Nueva', 'Remodelación',
                    'Baño', 'Cocina', 'Patio', 'Techo', 'Pintura'
                ],
                materials: [
                    'Cemento', 'Ladrillo', 'Arena', 'Ripio',
                    'Fierro', 'Madera', 'Cerámico', 'Pintura'
                ],
                units: [
                    'm2', 'm3', 'ml', 'un', 'kg', 'ton', 'gl', 'lt'
                ],
                contractors: [
                    'Maestro', 'Albañil', 'Pintor', 'Electricista',
                    'Gasfiter', 'Carpintero', 'Cerrajero'
                ]
            };
        }

        // Auto-complete para project name
        setupAutoComplete() {
            const projectNameInput = document.getElementById('project-name');
            if (!projectNameInput) return;

            // Crear datalist
            const datalist = document.createElement('datalist');
            datalist.id = 'project-suggestions';

            this.commonValues.projectTypes.forEach(type => {
                const option = document.createElement('option');
                option.value = type;
                datalist.appendChild(option);
            });

            // Agregar proyectos recientes del historial
            const recentProjects = this.getRecentProjectNames();
            recentProjects.forEach(name => {
                if (!this.commonValues.projectTypes.includes(name)) {
                    const option = document.createElement('option');
                    option.value = name;
                    datalist.appendChild(option);
                }
            });

            document.body.appendChild(datalist);
            projectNameInput.setAttribute('list', 'project-suggestions');

            console.log('[Auto-complete] ✅ Project name suggestions enabled');
        }

        getRecentProjectNames() {
            const projects = JSON.parse(localStorage.getItem('claudia_projects')) || [];
            return projects
                .map(p => p.name)
                .filter(Boolean)
                .slice(0, 10);
        }

        // Smart defaults basados en uso previo
        setupSmartDefaults() {
            // Cantidad por defecto inteligente
            const cantidadInput = document.getElementById('cantidad');
            if (cantidadInput) {
                // Si hay un valor frecuente, usarlo
                const commonQuantity = this.getMostCommonValue('cantidad') || 1;
                cantidadInput.value = commonQuantity;

                // Guardar cada vez que cambie
                cantidadInput.addEventListener('change', () => {
                    this.recordValue('cantidad', cantidadInput.value);
                });
            }

            // Task priority por defecto
            const taskPriority = document.getElementById('task-priority');
            if (taskPriority) {
                const commonPriority = this.getMostCommonValue('task-priority') || 'normal';
                taskPriority.value = commonPriority;

                taskPriority.addEventListener('change', () => {
                    this.recordValue('task-priority', taskPriority.value);
                });
            }

            console.log('[Smart Defaults] ✅ Intelligent defaults applied');
        }

        recordValue(key, value) {
            if (!this.formHistory[key]) {
                this.formHistory[key] = {};
            }

            if (!this.formHistory[key][value]) {
                this.formHistory[key][value] = 0;
            }

            this.formHistory[key][value]++;
            this.saveFormHistory();
        }

        getMostCommonValue(key) {
            if (!this.formHistory[key]) return null;

            const values = this.formHistory[key];
            let maxCount = 0;
            let mostCommon = null;

            for (const [value, count] of Object.entries(values)) {
                if (count > maxCount) {
                    maxCount = count;
                    mostCommon = value;
                }
            }

            return mostCommon;
        }

        // Validación en tiempo real
        setupValidation() {
            // Validar cantidad
            const cantidadInput = document.getElementById('cantidad');
            if (cantidadInput) {
                cantidadInput.addEventListener('input', () => {
                    this.validateQuantity(cantidadInput);
                });
            }

            // Validar project name
            const projectName = document.getElementById('project-name');
            if (projectName) {
                projectName.addEventListener('input', () => {
                    this.validateProjectName(projectName);
                });
            }

            // Validar email
            const emailInputs = document.querySelectorAll('input[type="email"]');
            emailInputs.forEach(input => {
                input.addEventListener('input', () => {
                    this.validateEmail(input);
                });
            });

            // Validar teléfono
            const telInputs = document.querySelectorAll('input[type="tel"]');
            telInputs.forEach(input => {
                input.addEventListener('input', () => {
                    this.validatePhone(input);
                });
            });

            console.log('[Validation] ✅ Real-time validation enabled');
        }

        validateQuantity(input) {
            const value = parseFloat(input.value);

            this.clearValidation(input);

            if (isNaN(value) || value <= 0) {
                this.showError(input, 'Ingresa una cantidad válida (mayor que 0)');
                return false;
            }

            if (value > 10000) {
                this.showWarning(input, '¿Estás seguro? Cantidad muy alta');
            } else {
                this.showSuccess(input);
            }

            return true;
        }

        validateProjectName(input) {
            const value = input.value.trim();

            this.clearValidation(input);

            if (value.length === 0) {
                this.showError(input, 'El nombre del proyecto no puede estar vacío');
                return false;
            }

            if (value.length < 3) {
                this.showWarning(input, 'Nombre muy corto');
                return false;
            }

            this.showSuccess(input);
            return true;
        }

        validateEmail(input) {
            const value = input.value.trim();

            this.clearValidation(input);

            if (value.length === 0) {
                return true; // Email opcional
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                this.showError(input, 'Email inválido (ej: juan@gmail.com)');
                return false;
            }

            this.showSuccess(input);
            return true;
        }

        validatePhone(input) {
            const value = input.value.trim();

            this.clearValidation(input);

            if (value.length === 0) {
                return true; // Teléfono opcional
            }

            // Formato chileno: +56912345678 o 912345678
            const phoneRegex = /^(\+?56)?9\d{8}$/;
            if (!phoneRegex.test(value.replace(/\s/g, ''))) {
                this.showError(input, 'Formato: +56912345678 o 912345678');
                return false;
            }

            this.showSuccess(input);
            return true;
        }

        clearValidation(input) {
            input.style.borderColor = '';
            const helpText = input.parentElement.querySelector('.help-text');
            if (helpText) helpText.remove();
        }

        showError(input, message) {
            input.style.borderColor = '#ef4444';
            this.showHelpText(input, message, 'error');
        }

        showWarning(input, message) {
            input.style.borderColor = '#f59e0b';
            this.showHelpText(input, message, 'warning');
        }

        showSuccess(input) {
            input.style.borderColor = '#10b981';
            const helpText = input.parentElement.querySelector('.help-text');
            if (helpText) helpText.remove();
        }

        showHelpText(input, message, type) {
            // Remover help text anterior
            const oldHelp = input.parentElement.querySelector('.help-text');
            if (oldHelp) oldHelp.remove();

            // Crear nuevo help text
            const help = document.createElement('div');
            help.className = `help-text help-${type}`;
            help.textContent = message;

            const colors = {
                error: '#ef4444',
                warning: '#f59e0b',
                success: '#10b981',
                info: '#3b82f6'
            };

            help.style.cssText = `
                font-size: 12px;
                color: ${colors[type]};
                margin-top: 4px;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 4px;
            `;

            const icon = {
                error: '❌',
                warning: '⚠️',
                success: '✅',
                info: 'ℹ️'
            };

            help.innerHTML = `<span>${icon[type]}</span><span>${message}</span>`;

            input.parentElement.appendChild(help);
        }

        // Sistema de ayuda contextual
        setupHelpSystem() {
            this.addContextualHelp('project-name', {
                placeholder: 'Ej: Ampliación Baño Principal',
                hint: 'Dale un nombre claro para identificar tu proyecto',
                examples: ['Ampliación Casa', 'Remodelación Cocina', 'Baño Nuevo']
            });

            this.addContextualHelp('cantidad', {
                placeholder: 'Ej: 15',
                hint: 'Cantidad total de la actividad',
                examples: ['15 m2', '3 m3', '50 ml']
            });

            this.addContextualHelp('new-task-input', {
                placeholder: 'Ej: Comprar cemento en ferretería',
                hint: 'Describe la tarea que necesitas hacer',
                examples: ['Comprar materiales', 'Llamar al maestro', 'Revisar avance']
            });

            console.log('[Help System] ✅ Contextual help enabled');
        }

        addContextualHelp(inputId, config) {
            const input = document.getElementById(inputId);
            if (!input) return;

            // Update placeholder
            if (config.placeholder) {
                input.placeholder = config.placeholder;
            }

            // Add help icon
            const helpIcon = document.createElement('button');
            helpIcon.className = 'help-icon';
            helpIcon.innerHTML = '💡';
            helpIcon.type = 'button';
            helpIcon.onclick = () => this.showHelpModal(config);

            helpIcon.style.cssText = `
                position: absolute;
                right: 12px;
                top: 50%;
                transform: translateY(-50%);
                background: transparent;
                border: none;
                font-size: 20px;
                cursor: pointer;
                transition: transform 0.3s ease;
                z-index: 10;
            `;

            // Wrap input si no está wrapped
            if (!input.parentElement.classList.contains('input-wrapper')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'input-wrapper';
                wrapper.style.position = 'relative';
                input.parentElement.insertBefore(wrapper, input);
                wrapper.appendChild(input);
                wrapper.appendChild(helpIcon);
            }
        }

        showHelpModal(config) {
            const modal = document.createElement('div');
            modal.className = 'help-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 100000;
                padding: 20px;
            `;

            modal.innerHTML = `
                <div style="
                    background: white;
                    border-radius: 16px;
                    padding: 24px;
                    max-width: 400px;
                    width: 100%;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                ">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                        <span style="font-size: 32px;">💡</span>
                        <h3 style="margin: 0; font-size: 20px; color: #333;">Ayuda</h3>
                        <button onclick="this.closest('.help-modal').remove()" style="
                            margin-left: auto;
                            background: #f5f5f5;
                            border: none;
                            width: 32px;
                            height: 32px;
                            border-radius: 50%;
                            font-size: 20px;
                            cursor: pointer;
                        ">✕</button>
                    </div>

                    <p style="color: #666; font-size: 15px; margin-bottom: 16px;">
                        ${config.hint}
                    </p>

                    <div style="background: #f5f7fa; padding: 16px; border-radius: 8px;">
                        <div style="font-weight: 600; font-size: 13px; color: #333; margin-bottom: 8px;">
                            📝 Ejemplos:
                        </div>
                        ${config.examples.map(ex => `
                            <div style="padding: 8px 12px; background: white; border-radius: 6px; margin-bottom: 6px; font-size: 14px; color: #555;">
                                ${ex}
                            </div>
                        `).join('')}
                    </div>

                    <button onclick="this.closest('.help-modal').remove()" style="
                        width: 100%;
                        padding: 12px;
                        margin-top: 16px;
                        background: linear-gradient(135deg, #667eea, #764ba2);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-weight: 600;
                        font-size: 15px;
                        cursor: pointer;
                    ">
                        Entendido
                    </button>
                </div>
            `;

            document.body.appendChild(modal);

            // Close on background click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });
        }
    }

    // ==========================================
    // 2. SMART AUTOCOMPLETE WIDGET
    // ==========================================

    class SmartAutocomplete {
        constructor(input, suggestions, onSelect) {
            this.input = input;
            this.suggestions = suggestions;
            this.onSelect = onSelect;
            this.dropdown = null;
            this.init();
        }

        init() {
            this.createDropdown();
            this.attachListeners();
        }

        createDropdown() {
            this.dropdown = document.createElement('div');
            this.dropdown.className = 'autocomplete-dropdown';
            this.dropdown.style.cssText = `
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: white;
                border: 2px solid #e0e0e0;
                border-top: none;
                border-radius: 0 0 12px 12px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.1);
                max-height: 300px;
                overflow-y: auto;
                z-index: 1000;
                display: none;
            `;

            // Insert after input
            this.input.parentElement.style.position = 'relative';
            this.input.parentElement.appendChild(this.dropdown);
        }

        attachListeners() {
            this.input.addEventListener('input', () => {
                this.updateSuggestions(this.input.value);
            });

            this.input.addEventListener('focus', () => {
                if (this.input.value.length > 0) {
                    this.updateSuggestions(this.input.value);
                }
            });

            // Close on outside click
            document.addEventListener('click', (e) => {
                if (!this.input.contains(e.target) && !this.dropdown.contains(e.target)) {
                    this.hide();
                }
            });
        }

        updateSuggestions(query) {
            if (!query || query.length < 2) {
                this.hide();
                return;
            }

            const filtered = this.suggestions.filter(s =>
                s.toLowerCase().includes(query.toLowerCase())
            );

            if (filtered.length === 0) {
                this.hide();
                return;
            }

            this.render(filtered);
            this.show();
        }

        render(suggestions) {
            this.dropdown.innerHTML = suggestions.map(s => `
                <div class="autocomplete-item" style="
                    padding: 12px 16px;
                    cursor: pointer;
                    transition: background 0.2s ease;
                    font-size: 14px;
                    color: #333;
                    border-bottom: 1px solid #f0f0f0;
                " data-value="${s}">
                    ${s}
                </div>
            `).join('');

            // Attach click handlers
            this.dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
                item.addEventListener('mouseenter', () => {
                    item.style.background = '#f5f7fa';
                });

                item.addEventListener('mouseleave', () => {
                    item.style.background = 'white';
                });

                item.addEventListener('click', () => {
                    const value = item.dataset.value;
                    this.select(value);
                });
            });
        }

        select(value) {
            this.input.value = value;
            this.hide();
            if (this.onSelect) {
                this.onSelect(value);
            }
        }

        show() {
            this.dropdown.style.display = 'block';
        }

        hide() {
            this.dropdown.style.display = 'none';
        }
    }

    // ==========================================
    // 3. INITIALIZE
    // ==========================================

    window.smartFormManager = new SmartFormManager();

    console.log('✅ CLAUDIA Smart Forms v5.5 initialized');
    console.log('🧠 Intelligent defaults active');
    console.log('✅ Real-time validation enabled');
    console.log('💡 Contextual help ready');

})();

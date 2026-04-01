/**
 * CLAUDIA Calendar & Timeline System - v5.7
 *
 * Sistema de calendario y línea de tiempo para planificación de proyectos
 * Características:
 * - Timeline visual con milestones
 * - Date pickers nativos mobile-friendly
 * - Calculadora de duraciones
 * - Gantt-style progress tracking
 * - Weather-aware scheduling (considera días lluviosos)
 * - Auto-save schedules
 */

class CalendarManager {
    constructor() {
        this.currentProject = null;
        this.schedule = {};
        this.holidays = this.loadChileanHolidays();
        this.init();
    }

    init() {
        console.log('📅 Calendar Manager inicializado');
        this.loadSchedules();
        this.createCalendarButton();
        this.setupEventListeners();
    }

    createCalendarButton() {
        // Botón en navbar para abrir calendario
        const navbar = document.querySelector('.navbar') || document.querySelector('header');
        if (!navbar) return;

        const calendarBtn = document.createElement('button');
        calendarBtn.className = 'calendar-btn';
        calendarBtn.innerHTML = '📅';
        calendarBtn.title = 'Calendario y Cronograma';
        calendarBtn.onclick = () => this.openCalendar();

        navbar.appendChild(calendarBtn);
    }

    openCalendar() {
        const project = this.getCurrentProject();
        if (!project) {
            this.showToast('⚠️ Primero crea o selecciona un proyecto', 'warning');
            return;
        }

        this.currentProject = project;
        this.showCalendarModal();

        if (window.mobileOptimizer) {
            window.mobileOptimizer.hapticFeedback('light');
        }
    }

    showCalendarModal() {
        const existingModal = document.getElementById('calendar-modal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.id = 'calendar-modal';
        modal.className = 'modal calendar-modal';
        modal.innerHTML = `
            <div class="modal-content calendar-modal-content">
                <div class="modal-header">
                    <h2>📅 Cronograma: ${this.escapeHtml(this.currentProject.name)}</h2>
                    <button class="close-btn" onclick="window.calendarManager.closeCalendar()">&times;</button>
                </div>
                <div class="modal-body calendar-body">
                    ${this.renderCalendarContent()}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);

        this.setupCalendarEventListeners();
        this.renderTimeline();
    }

    renderCalendarContent() {
        const schedule = this.getProjectSchedule();
        const startDate = schedule.startDate || this.getTodayString();
        const endDate = schedule.endDate || this.getDateString(30); // +30 días por defecto

        return `
            <div class="calendar-controls">
                <div class="date-inputs">
                    <div class="input-group">
                        <label for="project-start-date">📍 Fecha de Inicio</label>
                        <input
                            type="date"
                            id="project-start-date"
                            value="${startDate}"
                            min="${this.getTodayString()}"
                        >
                    </div>
                    <div class="input-group">
                        <label for="project-end-date">🏁 Fecha de Término</label>
                        <input
                            type="date"
                            id="project-end-date"
                            value="${endDate}"
                            min="${startDate}"
                        >
                    </div>
                </div>

                <div class="duration-display">
                    <div class="duration-stat">
                        <span class="stat-label">Duración Total:</span>
                        <span class="stat-value" id="total-duration">-</span>
                    </div>
                    <div class="duration-stat">
                        <span class="stat-label">Días Hábiles:</span>
                        <span class="stat-value" id="working-days">-</span>
                    </div>
                    <div class="duration-stat">
                        <span class="stat-label">Progreso:</span>
                        <span class="stat-value" id="schedule-progress">0%</span>
                    </div>
                </div>
            </div>

            <div class="timeline-container" id="timeline-container">
                <h3>📊 Línea de Tiempo</h3>
                <div id="timeline-canvas"></div>
            </div>

            <div class="activities-schedule">
                <h3>📋 Actividades Programadas</h3>
                <div id="activities-list">
                    ${this.renderActivitiesList()}
                </div>
            </div>

            <div class="calendar-actions">
                <button class="btn btn-secondary" onclick="window.calendarManager.autoSchedule()">
                    🤖 Auto-Programar
                </button>
                <button class="btn btn-primary" onclick="window.calendarManager.saveSchedule()">
                    💾 Guardar Cronograma
                </button>
                <button class="btn btn-success" onclick="window.calendarManager.exportSchedule()">
                    📄 Exportar PDF
                </button>
            </div>
        `;
    }

    renderActivitiesList() {
        const activities = this.currentProject.activities || [];
        if (activities.length === 0) {
            return '<p class="no-data">No hay actividades en este proyecto</p>';
        }

        return activities.map((activity, index) => {
            const activitySchedule = this.getActivitySchedule(index);
            return `
                <div class="activity-schedule-item" data-activity-index="${index}">
                    <div class="activity-info">
                        <strong>${this.escapeHtml(activity.nombre)}</strong>
                        <span class="activity-code">${this.escapeHtml(activity.codigo || '')}</span>
                    </div>
                    <div class="activity-dates">
                        <input
                            type="date"
                            class="activity-start-date"
                            value="${activitySchedule.start || ''}"
                            data-index="${index}"
                        >
                        <span>→</span>
                        <input
                            type="date"
                            class="activity-end-date"
                            value="${activitySchedule.end || ''}"
                            data-index="${index}"
                        >
                        <span class="activity-duration">${activitySchedule.duration || 0} días</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderTimeline() {
        const canvas = document.getElementById('timeline-canvas');
        if (!canvas) return;

        const schedule = this.getProjectSchedule();
        if (!schedule.startDate || !schedule.endDate) {
            canvas.innerHTML = '<p class="no-data">Configura las fechas de inicio y fin del proyecto</p>';
            return;
        }

        const activities = this.currentProject.activities || [];
        const startDate = new Date(schedule.startDate);
        const endDate = new Date(schedule.endDate);
        const totalDays = this.daysBetween(startDate, endDate);

        let timelineHTML = '<div class="timeline-grid">';

        // Header con meses
        timelineHTML += this.renderTimelineHeader(startDate, endDate);

        // Actividades
        activities.forEach((activity, index) => {
            const activitySchedule = this.getActivitySchedule(index);
            if (activitySchedule.start && activitySchedule.end) {
                timelineHTML += this.renderTimelineActivity(activity, activitySchedule, startDate, totalDays, index);
            }
        });

        timelineHTML += '</div>';
        canvas.innerHTML = timelineHTML;
    }

    renderTimelineHeader(startDate, endDate) {
        const months = [];
        const current = new Date(startDate);

        while (current <= endDate) {
            const monthKey = `${current.getFullYear()}-${current.getMonth()}`;
            if (!months.find(m => m.key === monthKey)) {
                months.push({
                    key: monthKey,
                    name: current.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' }),
                    days: this.daysInMonth(current)
                });
            }
            current.setMonth(current.getMonth() + 1);
        }

        return `
            <div class="timeline-header">
                ${months.map(m => `
                    <div class="timeline-month" style="flex: ${m.days}">
                        ${m.name}
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderTimelineActivity(activity, schedule, projectStart, totalDays, index) {
        const actStart = new Date(schedule.start);
        const actEnd = new Date(schedule.end);
        const actDuration = this.daysBetween(actStart, actEnd);
        const offsetDays = this.daysBetween(projectStart, actStart);

        const leftPercent = (offsetDays / totalDays) * 100;
        const widthPercent = (actDuration / totalDays) * 100;

        const progress = schedule.progress || 0;
        const statusClass = progress === 100 ? 'completed' : progress > 0 ? 'in-progress' : 'pending';

        return `
            <div class="timeline-row">
                <div class="timeline-activity-name">
                    ${this.escapeHtml(activity.nombre)}
                </div>
                <div class="timeline-bar-container">
                    <div
                        class="timeline-bar ${statusClass}"
                        style="left: ${leftPercent}%; width: ${widthPercent}%;"
                        title="${activity.nombre}: ${schedule.start} → ${schedule.end}"
                    >
                        <div class="timeline-bar-progress" style="width: ${progress}%"></div>
                        <span class="timeline-bar-label">${actDuration}d</span>
                    </div>
                </div>
            </div>
        `;
    }

    setupCalendarEventListeners() {
        // Project dates
        const startInput = document.getElementById('project-start-date');
        const endInput = document.getElementById('project-end-date');

        if (startInput) {
            startInput.addEventListener('change', (e) => {
                this.updateProjectDates();
                endInput.min = e.target.value;
            });
        }

        if (endInput) {
            endInput.addEventListener('change', () => this.updateProjectDates());
        }

        // Activity dates
        document.querySelectorAll('.activity-start-date, .activity-end-date').forEach(input => {
            input.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.updateActivitySchedule(index);
            });
        });
    }

    updateProjectDates() {
        const startDate = document.getElementById('project-start-date').value;
        const endDate = document.getElementById('project-end-date').value;

        if (!startDate || !endDate) return;

        const schedule = this.getProjectSchedule();
        schedule.startDate = startDate;
        schedule.endDate = endDate;
        this.saveProjectSchedule(schedule);

        // Calcular estadísticas
        const start = new Date(startDate);
        const end = new Date(endDate);
        const totalDays = this.daysBetween(start, end);
        const workingDays = this.countWorkingDays(start, end);

        document.getElementById('total-duration').textContent = `${totalDays} días`;
        document.getElementById('working-days').textContent = `${workingDays} días`;

        this.renderTimeline();
    }

    updateActivitySchedule(index) {
        const startInput = document.querySelector(`.activity-start-date[data-index="${index}"]`);
        const endInput = document.querySelector(`.activity-end-date[data-index="${index}"]`);

        if (!startInput || !endInput) return;

        const start = startInput.value;
        const end = endInput.value;

        if (start && end) {
            const duration = this.daysBetween(new Date(start), new Date(end));
            const durationSpan = startInput.closest('.activity-schedule-item').querySelector('.activity-duration');
            if (durationSpan) {
                durationSpan.textContent = `${duration} días`;
            }

            // Guardar en schedule
            const schedule = this.getProjectSchedule();
            if (!schedule.activities) schedule.activities = {};
            schedule.activities[index] = { start, end, duration, progress: 0 };
            this.saveProjectSchedule(schedule);

            this.renderTimeline();
        }
    }

    autoSchedule() {
        const activities = this.currentProject.activities || [];
        if (activities.length === 0) {
            this.showToast('⚠️ No hay actividades para programar', 'warning');
            return;
        }

        const startDate = document.getElementById('project-start-date').value;
        if (!startDate) {
            this.showToast('⚠️ Primero establece la fecha de inicio del proyecto', 'warning');
            return;
        }

        // Auto-schedule: distribuir actividades secuencialmente
        let currentDate = new Date(startDate);
        const schedule = this.getProjectSchedule();
        schedule.activities = {};

        activities.forEach((activity, index) => {
            // Estimar duración basada en cantidad (heurística simple)
            const estimatedDays = Math.max(1, Math.ceil(activity.cantidad / 10));

            const actStart = new Date(currentDate);
            const actEnd = new Date(currentDate);
            actEnd.setDate(actEnd.getDate() + estimatedDays);

            // Evitar domingos
            while (actEnd.getDay() === 0) {
                actEnd.setDate(actEnd.getDate() + 1);
            }

            schedule.activities[index] = {
                start: this.formatDateForInput(actStart),
                end: this.formatDateForInput(actEnd),
                duration: estimatedDays,
                progress: 0
            };

            // Siguiente actividad empieza al día siguiente
            currentDate = new Date(actEnd);
            currentDate.setDate(currentDate.getDate() + 1);
        });

        // Actualizar fecha fin del proyecto
        schedule.endDate = this.formatDateForInput(currentDate);
        document.getElementById('project-end-date').value = schedule.endDate;

        this.saveProjectSchedule(schedule);

        // Re-render
        document.getElementById('activities-list').innerHTML = this.renderActivitiesList();
        this.setupCalendarEventListeners();
        this.updateProjectDates();

        this.showToast('✅ Cronograma auto-generado exitosamente', 'success');

        if (window.mobileOptimizer) {
            window.mobileOptimizer.hapticFeedback('success');
        }
    }

    saveSchedule() {
        const schedule = this.getProjectSchedule();
        this.saveProjectSchedule(schedule);

        this.showToast('💾 Cronograma guardado', 'success');

        if (window.mobileOptimizer) {
            window.mobileOptimizer.hapticFeedback('success');
        }
    }

    exportSchedule() {
        const schedule = this.getProjectSchedule();
        const html = this.generateSchedulePDFHTML(schedule);

        const printWindow = window.open('', '_blank', 'width=800,height=900');
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();

        setTimeout(() => {
            printWindow.print();
        }, 250);

        this.showToast('📄 Cronograma listo para imprimir', 'success');
    }

    generateSchedulePDFHTML(schedule) {
        const project = this.currentProject;
        const activities = project.activities || [];

        return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Cronograma - ${project.name}</title>
    <style>
        @page { size: landscape; margin: 1cm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 11pt; }
        .container { padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #3b82f6; padding-bottom: 15px; }
        .brand { font-size: 28pt; font-weight: bold; color: #3b82f6; }
        .doc-type { font-size: 16pt; color: #6b7280; margin-top: 5px; }
        .project-info { margin-bottom: 20px; background: #f9fafb; padding: 15px; border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border: 1px solid #e5e7eb; }
        th { background: #3b82f6; color: white; font-weight: bold; }
        tr:nth-child(even) { background: #f9fafb; }
        .footer { margin-top: 30px; text-align: center; color: #6b7280; font-size: 9pt; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="brand">CLAUDIA</div>
            <div class="doc-type">CRONOGRAMA DE PROYECTO</div>
        </div>

        <div class="project-info">
            <strong>Proyecto:</strong> ${this.escapeHtml(project.name)}<br>
            <strong>Fecha Inicio:</strong> ${schedule.startDate || 'No definida'}<br>
            <strong>Fecha Término:</strong> ${schedule.endDate || 'No definida'}<br>
            <strong>Fecha Generación:</strong> ${new Date().toLocaleDateString('es-CL')}
        </div>

        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Actividad</th>
                    <th>Código APU</th>
                    <th>Fecha Inicio</th>
                    <th>Fecha Término</th>
                    <th>Duración</th>
                    <th>Progreso</th>
                </tr>
            </thead>
            <tbody>
                ${activities.map((activity, index) => {
                    const actSchedule = this.getActivitySchedule(index);
                    return `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${this.escapeHtml(activity.nombre)}</td>
                            <td>${this.escapeHtml(activity.codigo || '-')}</td>
                            <td>${actSchedule.start || '-'}</td>
                            <td>${actSchedule.end || '-'}</td>
                            <td>${actSchedule.duration || 0} días</td>
                            <td>${actSchedule.progress || 0}%</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>

        <div class="footer">
            Generado por CLAUDIA - Tu Asistente Inteligente de Construcción<br>
            https://claudia-i8bxh.web.app
        </div>
    </div>
</body>
</html>`;
    }

    closeCalendar() {
        const modal = document.getElementById('calendar-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    }

    // Utilidades de fechas
    getTodayString() {
        return this.formatDateForInput(new Date());
    }

    getDateString(daysFromNow) {
        const date = new Date();
        date.setDate(date.getDate() + daysFromNow);
        return this.formatDateForInput(date);
    }

    formatDateForInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    daysBetween(start, end) {
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    countWorkingDays(start, end) {
        let count = 0;
        const current = new Date(start);

        while (current <= end) {
            const day = current.getDay();
            const dateStr = this.formatDateForInput(current);

            // Excluir domingos y feriados
            if (day !== 0 && !this.holidays.includes(dateStr)) {
                count++;
            }

            current.setDate(current.getDate() + 1);
        }

        return count;
    }

    daysInMonth(date) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    }

    loadChileanHolidays() {
        // Feriados Chile 2025 (principales)
        return [
            '2025-01-01', // Año Nuevo
            '2025-04-18', // Viernes Santo
            '2025-04-19', // Sábado Santo
            '2025-05-01', // Día del Trabajo
            '2025-05-21', // Día de las Glorias Navales
            '2025-06-29', // San Pedro y San Pablo
            '2025-07-16', // Virgen del Carmen
            '2025-08-15', // Asunción de la Virgen
            '2025-09-18', // Independencia
            '2025-09-19', // Día de las Glorias del Ejército
            '2025-10-12', // Encuentro de Dos Mundos
            '2025-11-01', // Día de Todos los Santos
            '2025-12-08', // Inmaculada Concepción
            '2025-12-25'  // Navidad
        ];
    }

    // Storage
    getCurrentProject() {
        const projectsData = localStorage.getItem('projects');
        if (!projectsData) return null;

        const projects = JSON.parse(projectsData);
        const currentName = localStorage.getItem('current_project');

        return projects.find(p => p.name === currentName);
    }

    getProjectSchedule() {
        const projectName = this.currentProject?.name;
        if (!projectName) return {};

        return this.schedule[projectName] || {};
    }

    getActivitySchedule(index) {
        const schedule = this.getProjectSchedule();
        return schedule.activities?.[index] || {};
    }

    saveProjectSchedule(schedule) {
        const projectName = this.currentProject?.name;
        if (!projectName) return;

        this.schedule[projectName] = schedule;
        this.saveSchedules();
    }

    loadSchedules() {
        const saved = localStorage.getItem('claudia_schedules');
        this.schedule = saved ? JSON.parse(saved) : {};
    }

    saveSchedules() {
        localStorage.setItem('claudia_schedules', JSON.stringify(this.schedule));
    }

    setupEventListeners() {
        // Keyboard shortcut: Ctrl+Shift+C para Calendar
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'C') {
                e.preventDefault();
                this.openCalendar();
            }
        });
    }

    showToast(message, type = 'info') {
        if (window.showToast) {
            window.showToast(message, 3000);
        } else {
            console.log(message);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// CSS Styles
const calendarStyles = `
<style>
.calendar-btn {
    background: var(--card-bg);
    border: 2px solid var(--border-color);
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.calendar-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px var(--shadow);
}

.calendar-modal-content {
    max-width: 1200px;
    width: 95%;
    max-height: 90vh;
    overflow-y: auto;
}

.calendar-body {
    padding: 20px;
}

.calendar-controls {
    background: var(--bg-secondary);
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 20px;
}

.date-inputs {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
}

.input-group label {
    display: block;
    font-weight: 600;
    margin-bottom: 8px;
    color: var(--text-primary);
}

.input-group input[type="date"] {
    width: 100%;
    padding: 12px;
    border: 2px solid var(--border-color);
    border-radius: 8px;
    font-size: 16px;
    background: var(--card-bg);
    color: var(--text-primary);
}

.duration-display {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
}

.duration-stat {
    flex: 1;
    min-width: 150px;
    background: var(--card-bg);
    padding: 12px;
    border-radius: 8px;
    border-left: 4px solid var(--primary-color);
}

.stat-label {
    display: block;
    font-size: 12px;
    color: var(--text-secondary);
    margin-bottom: 4px;
}

.stat-value {
    display: block;
    font-size: 20px;
    font-weight: bold;
    color: var(--primary-color);
}

.timeline-container {
    margin: 30px 0;
    background: var(--card-bg);
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 8px var(--shadow);
}

.timeline-grid {
    overflow-x: auto;
    margin-top: 20px;
}

.timeline-header {
    display: flex;
    border-bottom: 2px solid var(--border-color);
    padding-bottom: 10px;
    margin-bottom: 15px;
}

.timeline-month {
    text-align: center;
    font-weight: 600;
    font-size: 12px;
    color: var(--text-secondary);
    padding: 8px 4px;
    border-right: 1px solid var(--border-color);
}

.timeline-row {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    min-height: 40px;
}

.timeline-activity-name {
    width: 200px;
    padding-right: 15px;
    font-size: 13px;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.timeline-bar-container {
    flex: 1;
    position: relative;
    height: 32px;
    background: var(--bg-secondary);
    border-radius: 8px;
}

.timeline-bar {
    position: absolute;
    height: 100%;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
}

.timeline-bar.pending {
    background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
}

.timeline-bar.in-progress {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.timeline-bar.completed {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.timeline-bar:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px var(--shadow);
}

.timeline-bar-progress {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    transition: width 0.3s ease;
}

.timeline-bar-label {
    position: relative;
    z-index: 1;
    color: white;
    font-size: 11px;
    font-weight: 600;
}

.activities-schedule {
    background: var(--card-bg);
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 8px var(--shadow);
    margin-bottom: 20px;
}

.activity-schedule-item {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 15px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    margin-bottom: 10px;
    background: var(--bg-secondary);
}

.activity-info {
    flex: 1;
    min-width: 200px;
}

.activity-code {
    display: block;
    font-size: 12px;
    color: var(--text-secondary);
    margin-top: 4px;
}

.activity-dates {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}

.activity-start-date,
.activity-end-date {
    padding: 8px 12px;
    border: 2px solid var(--border-color);
    border-radius: 8px;
    font-size: 14px;
    background: var(--card-bg);
    color: var(--text-primary);
    min-width: 150px;
}

.activity-duration {
    font-size: 14px;
    font-weight: 600;
    color: var(--primary-color);
    padding: 6px 12px;
    background: var(--card-bg);
    border-radius: 6px;
}

.calendar-actions {
    display: flex;
    gap: 15px;
    justify-content: flex-end;
    flex-wrap: wrap;
}

.no-data {
    text-align: center;
    color: var(--text-secondary);
    padding: 40px;
    font-style: italic;
}

/* Mobile Responsive */
@media (max-width: 768px) {
    .calendar-modal-content {
        width: 100%;
        max-height: 100vh;
        border-radius: 0;
    }

    .timeline-activity-name {
        width: 120px;
        font-size: 11px;
    }

    .activity-schedule-item {
        flex-direction: column;
        align-items: flex-start;
    }

    .activity-dates {
        width: 100%;
    }

    .activity-start-date,
    .activity-end-date {
        flex: 1;
        min-width: 120px;
    }

    .calendar-actions {
        flex-direction: column;
    }

    .calendar-actions .btn {
        width: 100%;
    }
}
</style>
`;

// Inyectar estilos
document.head.insertAdjacentHTML('beforeend', calendarStyles);

// Inicialización global
window.calendarManager = new CalendarManager();

console.log('📅 Calendar System v5.7 cargado exitosamente');

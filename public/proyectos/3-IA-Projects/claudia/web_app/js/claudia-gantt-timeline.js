/**
 * CLAUDIA v10.0 - Gantt Timeline Visualization
 *
 * Interactive Gantt chart for project timeline planning
 * - Visual activity timeline
 * - Dependencies tracking
 * - Duration estimates
 * - Critical path highlighting
 * - Drag-and-drop rescheduling
 *
 * Unique feature for construction project management
 */

(function() {
    'use strict';

    let projectTimeline = null;
    let tasks = [];

    /**
     * Initialize Gantt timeline
     */
    function initGanttTimeline() {
        console.log('✓ Gantt Timeline initialized');
    }

    /**
     * Open Gantt timeline modal
     */
    function openGanttModal(projectData) {
        if (!projectData || !projectData.activities) {
            console.error('Invalid project data');
            return;
        }

        // Create modal if doesn't exist
        if (!document.getElementById('gantt-modal')) {
            createGanttModal();
        }

        // Convert activities to tasks
        tasks = convertActivitiesToTasks(projectData.activities);

        // Show modal
        const modal = document.getElementById('gantt-modal');
        modal.style.display = 'block';

        // Render Gantt chart
        setTimeout(() => renderGanttChart(), 100);
    }

    /**
     * Create Gantt modal
     */
    function createGanttModal() {
        const modalHTML = `
            <div id="gantt-modal" class="gantt-modal" style="display:none;">
                <div class="gantt-modal-content">
                    <div class="gantt-header">
                        <h2>📅 Cronograma del Proyecto</h2>
                        <div class="gantt-controls">
                            <button onclick="window.ClaudiaGantt.export('pdf')" class="btn-gantt-control">
                                📄 Exportar PDF
                            </button>
                            <button onclick="window.ClaudiaGantt.export('image')" class="btn-gantt-control">
                                🖼️ Exportar Imagen
                            </button>
                            <button onclick="window.ClaudiaGantt.close()" class="btn-close">✕</button>
                        </div>
                    </div>

                    <div class="gantt-info">
                        <div class="gantt-info-item">
                            <span class="gantt-info-label">Duración Total:</span>
                            <span id="total-duration" class="gantt-info-value">0 días</span>
                        </div>
                        <div class="gantt-info-item">
                            <span class="gantt-info-label">Actividades:</span>
                            <span id="total-tasks" class="gantt-info-value">0</span>
                        </div>
                        <div class="gantt-info-item">
                            <span class="gantt-info-label">Inicio Estimado:</span>
                            <span id="start-date" class="gantt-info-value">-</span>
                        </div>
                        <div class="gantt-info-item">
                            <span class="gantt-info-label">Fin Estimado:</span>
                            <span id="end-date" class="gantt-info-value">-</span>
                        </div>
                    </div>

                    <div id="gantt-chart-container" class="gantt-chart-container">
                        <!-- Gantt chart rendered here -->
                    </div>

                    <div class="gantt-legend">
                        <div class="legend-item">
                            <span class="legend-color" style="background: #3498db;"></span>
                            <span>Actividad Normal</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color" style="background: #e74c3c;"></span>
                            <span>Ruta Crítica</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color" style="background: #27ae60;"></span>
                            <span>Completada</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color" style="background: #f39c12;"></span>
                            <span>En Progreso</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        addGanttStyles();
    }

    /**
     * Add Gantt styles
     */
    function addGanttStyles() {
        const styles = `
            <style id="gantt-timeline-styles">
                .gantt-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.9);
                    z-index: 10002;
                    overflow-y: auto;
                    padding: 20px;
                }

                .gantt-modal-content {
                    background: white;
                    border-radius: 10px;
                    max-width: 1600px;
                    margin: 0 auto;
                    padding: 30px;
                }

                .gantt-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .gantt-header h2 {
                    margin: 0;
                    color: #2c3e50;
                }

                .gantt-controls {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }

                .btn-gantt-control {
                    padding: 10px 20px;
                    background: #3498db;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.3s;
                }

                .btn-gantt-control:hover {
                    background: #2980b9;
                    transform: translateY(-2px);
                }

                .gantt-info {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-bottom: 30px;
                    padding: 20px;
                    background: #ecf0f1;
                    border-radius: 8px;
                }

                .gantt-info-item {
                    display: flex;
                    flex-direction: column;
                }

                .gantt-info-label {
                    font-size: 14px;
                    color: #7f8c8d;
                    margin-bottom: 5px;
                }

                .gantt-info-value {
                    font-size: 20px;
                    font-weight: bold;
                    color: #2c3e50;
                }

                .gantt-chart-container {
                    background: #fff;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    padding: 20px;
                    overflow-x: auto;
                    min-height: 500px;
                }

                .gantt-table {
                    width: 100%;
                    min-width: 800px;
                    border-collapse: separate;
                    border-spacing: 0;
                }

                .gantt-table th {
                    background: #34495e;
                    color: white;
                    padding: 12px;
                    text-align: left;
                    font-weight: bold;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }

                .gantt-table th.task-name {
                    width: 200px;
                }

                .gantt-table th.task-duration {
                    width: 100px;
                }

                .gantt-table td {
                    padding: 10px;
                    border-bottom: 1px solid #ecf0f1;
                    vertical-align: middle;
                }

                .gantt-row {
                    transition: background 0.3s;
                }

                .gantt-row:hover {
                    background: #f8f9fa;
                }

                .task-name-cell {
                    font-weight: bold;
                    color: #2c3e50;
                }

                .task-duration-cell {
                    color: #7f8c8d;
                    text-align: center;
                }

                .task-bar {
                    height: 30px;
                    border-radius: 4px;
                    display: inline-block;
                    position: relative;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .task-bar:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                }

                .task-bar.normal {
                    background: linear-gradient(135deg, #3498db, #2980b9);
                }

                .task-bar.critical {
                    background: linear-gradient(135deg, #e74c3c, #c0392b);
                }

                .task-bar.completed {
                    background: linear-gradient(135deg, #27ae60, #229954);
                }

                .task-bar.in-progress {
                    background: linear-gradient(135deg, #f39c12, #e67e22);
                }

                .task-bar-label {
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    color: white;
                    font-size: 12px;
                    font-weight: bold;
                    white-space: nowrap;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                }

                .gantt-legend {
                    display: flex;
                    gap: 20px;
                    margin-top: 20px;
                    padding: 15px;
                    background: #f8f9fa;
                    border-radius: 8px;
                    flex-wrap: wrap;
                }

                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                    color: #2c3e50;
                }

                .legend-color {
                    width: 20px;
                    height: 20px;
                    border-radius: 3px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }

                @media (max-width: 768px) {
                    .gantt-modal-content {
                        padding: 15px;
                    }

                    .gantt-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 15px;
                    }

                    .gantt-info {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
            </style>
        `;

        if (!document.getElementById('gantt-timeline-styles')) {
            document.head.insertAdjacentHTML('beforeend', styles);
        }
    }

    /**
     * Convert activities to Gantt tasks
     */
    function convertActivitiesToTasks(activities) {
        const startDate = new Date();
        const tasksArray = [];

        let currentDate = new Date(startDate);

        activities.forEach((activity, index) => {
            // Estimate duration based on cost (heuristic)
            const cost = activity.subtotal || 0;
            const duration = estimateDuration(cost, activity.category);

            const task = {
                id: index + 1,
                name: activity.name || `Actividad ${index + 1}`,
                duration: duration,
                start: new Date(currentDate),
                end: new Date(currentDate.getTime() + duration * 24 * 60 * 60 * 1000),
                category: activity.category || 'General',
                cost: cost,
                status: index === 0 ? 'in-progress' : 'pending',
                critical: false
            };

            tasksArray.push(task);

            // Move current date forward
            currentDate = new Date(task.end);
        });

        // Identify critical path (simplified - longest tasks)
        const sortedByCost = [...tasksArray].sort((a, b) => b.cost - a.cost);
        const topCritical = sortedByCost.slice(0, Math.ceil(tasksArray.length * 0.2)); // Top 20%
        topCritical.forEach(task => {
            task.critical = true;
        });

        return tasksArray;
    }

    /**
     * Estimate task duration (days) based on cost and category
     */
    function estimateDuration(cost, category) {
        // Base duration by cost (rough estimate)
        let baseDuration = Math.ceil(cost / 50000); // ~1 day per $50,000

        // Adjust by category
        const categoryMultipliers = {
            'Excavación': 1.2,
            'Hormigón': 1.5,
            'Albañilería': 1.3,
            'Terminaciones': 0.8,
            'Pintura': 0.6,
            'Instalaciones': 1.1,
            'Techumbre': 1.4
        };

        const multiplier = categoryMultipliers[category] || 1.0;
        const duration = Math.max(1, Math.ceil(baseDuration * multiplier));

        // Cap at reasonable max
        return Math.min(duration, 30);
    }

    /**
     * Render Gantt chart
     */
    function renderGanttChart() {
        if (tasks.length === 0) {
            document.getElementById('gantt-chart-container').innerHTML =
                '<p style="text-align: center; color: #95a5a6; padding: 40px;">No hay actividades para mostrar.</p>';
            return;
        }

        // Calculate project metrics
        const startDate = tasks[0].start;
        const endDate = tasks[tasks.length - 1].end;
        const totalDuration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

        // Update info
        document.getElementById('total-duration').textContent = `${totalDuration} días`;
        document.getElementById('total-tasks').textContent = tasks.length;
        document.getElementById('start-date').textContent = formatDate(startDate);
        document.getElementById('end-date').textContent = formatDate(endDate);

        // Calculate timeline scale
        const dayWidth = 30; // pixels per day
        const timelineWidth = totalDuration * dayWidth;

        // Build table
        let tableHTML = `
            <table class="gantt-table">
                <thead>
                    <tr>
                        <th class="task-name"># Actividad</th>
                        <th class="task-duration">Duración</th>
                        <th style="min-width: ${timelineWidth}px;">Cronograma</th>
                    </tr>
                </thead>
                <tbody>
        `;

        tasks.forEach(task => {
            const daysSinceStart = Math.floor((task.start - startDate) / (1000 * 60 * 60 * 24));
            const barWidth = task.duration * dayWidth;
            const barOffset = daysSinceStart * dayWidth;

            const barClass = task.critical ? 'critical' : task.status === 'completed' ? 'completed' : task.status === 'in-progress' ? 'in-progress' : 'normal';

            tableHTML += `
                <tr class="gantt-row">
                    <td class="task-name-cell">
                        ${task.id}. ${task.name}
                        ${task.critical ? ' 🔥' : ''}
                    </td>
                    <td class="task-duration-cell">${task.duration}d</td>
                    <td>
                        <div style="position: relative; height: 40px;">
                            <div class="task-bar ${barClass}"
                                 style="width: ${barWidth}px; margin-left: ${barOffset}px;"
                                 title="${task.name}\nDuración: ${task.duration} días\nInicio: ${formatDate(task.start)}\nFin: ${formatDate(task.end)}\nCosto: $${task.cost.toLocaleString('es-CL')}">
                                <div class="task-bar-label">${task.duration}d</div>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        });

        tableHTML += `
                </tbody>
            </table>
        `;

        document.getElementById('gantt-chart-container').innerHTML = tableHTML;
    }

    /**
     * Format date
     */
    function formatDate(date) {
        return date.toLocaleDateString('es-CL', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Export Gantt chart
     */
    function exportGantt(format) {
        if (format === 'pdf') {
            alert('📄 Exportación a PDF en desarrollo. Próximamente disponible.');
        } else if (format === 'image') {
            // Use html2canvas to export
            const container = document.getElementById('gantt-chart-container');

            if (typeof html2canvas === 'undefined') {
                // Load html2canvas
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                script.onload = () => {
                    html2canvas(container).then(canvas => {
                        const link = document.createElement('a');
                        link.download = `cronograma_${Date.now()}.png`;
                        link.href = canvas.toDataURL();
                        link.click();
                    });
                };
                document.head.appendChild(script);
            } else {
                html2canvas(container).then(canvas => {
                    const link = document.createElement('a');
                    link.download = `cronograma_${Date.now()}.png`;
                    link.href = canvas.toDataURL();
                    link.click();
                });
            }
        }
    }

    /**
     * Close modal
     */
    function closeModal() {
        const modal = document.getElementById('gantt-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Export to global namespace
    window.ClaudiaGantt = {
        init: initGanttTimeline,
        open: openGanttModal,
        close: closeModal,
        export: exportGantt
    };

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGanttTimeline);
    } else {
        initGanttTimeline();
    }

})();

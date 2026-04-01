/**
 * CLAUDIA Export PRO v6.7
 * Advanced export in multiple formats with templates
 */

(function() {
    'use strict';

    window.ClaudiaExportPro = {

        /**
         * Initialize export system
         */
        init() {
            console.log('📤 Export PRO v6.7 initialized');
        },

        /**
         * Show export dialog
         */
        showExportDialog() {
            const project = window.getCurrentProject?.();
            if (!project) {
                ClaudiaUtils.showNotification('No hay proyecto activo', 'error');
                return;
            }

            const html = `
                <div style="display: grid; gap: 20px;">
                    <div>
                        <h4 style="margin-bottom: 15px; font-size: 16px;">Formato de Exportación</h4>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px;">
                            ${this.getFormatButtons()}
                        </div>
                    </div>

                    <div>
                        <h4 style="margin-bottom: 15px; font-size: 16px;">Opciones de Contenido</h4>
                        <div style="display: grid; gap: 10px;">
                            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                <input type="checkbox" id="export-activities" checked style="width: 18px; height: 18px;">
                                <span>Actividades y APUs</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                <input type="checkbox" id="export-tasks" checked style="width: 18px; height: 18px;">
                                <span>Tareas y seguimiento</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                <input type="checkbox" id="export-prices" checked style="width: 18px; height: 18px;">
                                <span>Comparación de precios</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                <input type="checkbox" id="export-photos" style="width: 18px; height: 18px;">
                                <span>Fotos del proyecto</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                <input type="checkbox" id="export-calendar" style="width: 18px; height: 18px;">
                                <span>Calendario y cronograma</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <h4 style="margin-bottom: 15px; font-size: 16px;">Plantillas</h4>
                        <select id="export-template" style="width: 100%; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                            <option value="default">Estándar</option>
                            <option value="professional">Profesional</option>
                            <option value="detailed">Detallado</option>
                            <option value="summary">Resumen Ejecutivo</option>
                            <option value="client">Para Cliente</option>
                            <option value="contractor">Para Contratista</option>
                        </select>
                    </div>
                </div>
            `;

            ClaudiaUtils.createModal({
                title: '📤 Exportar Proyecto',
                content: html,
                buttons: []
            });
        },

        /**
         * Get format buttons HTML
         */
        getFormatButtons() {
            const formats = [
                { id: 'pdf', icon: '📄', name: 'PDF', color: '#ef4444' },
                { id: 'excel', icon: '📊', name: 'Excel', color: '#10b981' },
                { id: 'word', icon: '📝', name: 'Word', color: '#3b82f6' },
                { id: 'json', icon: '💾', name: 'JSON', color: '#f59e0b' },
                { id: 'csv', icon: '📋', name: 'CSV', color: '#6b7280' },
                { id: 'html', icon: '🌐', name: 'HTML', color: '#8b5cf6' }
            ];

            return formats.map(format => `
                <button onclick="ClaudiaExportPro.export('${format.id}')" style="
                    padding: 20px 15px;
                    border: 2px solid #e5e7eb;
                    border-radius: 12px;
                    background: white;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    font-weight: 600;
                " onmouseover="this.style.borderColor='${format.color}'; this.style.transform='translateY(-2px)'" onmouseout="this.style.borderColor='#e5e7eb'; this.style.transform='translateY(0)'">
                    <span style="font-size: 32px;">${format.icon}</span>
                    <span style="font-size: 13px; color: ${format.color};">${format.name}</span>
                </button>
            `).join('');
        },

        /**
         * Export project
         */
        async export(format) {
            const project = window.getCurrentProject?.();
            if (!project) return;

            // Get export options
            const options = {
                activities: document.getElementById('export-activities')?.checked || false,
                tasks: document.getElementById('export-tasks')?.checked || false,
                prices: document.getElementById('export-prices')?.checked || false,
                photos: document.getElementById('export-photos')?.checked || false,
                calendar: document.getElementById('export-calendar')?.checked || false,
                template: document.getElementById('export-template')?.value || 'default'
            };

            ClaudiaUtils.showNotification('Generando exportación...', 'loading');

            try {
                switch (format) {
                    case 'pdf':
                        await this.exportPDF(project, options);
                        break;
                    case 'excel':
                        await this.exportExcel(project, options);
                        break;
                    case 'word':
                        await this.exportWord(project, options);
                        break;
                    case 'json':
                        this.exportJSON(project, options);
                        break;
                    case 'csv':
                        this.exportCSV(project, options);
                        break;
                    case 'html':
                        this.exportHTML(project, options);
                        break;
                }

                ClaudiaUtils.showNotification('Exportación completada', 'success');

                // Close modal
                document.getElementById('claudia-modal')?.remove();

                // Track analytics
                if (window.ClaudiaAnalytics) {
                    ClaudiaAnalytics.trackExport(format, options.template);
                }
            } catch (err) {
                console.error('Export failed:', err);
                ClaudiaUtils.showNotification('Error al exportar', 'error');
            }
        },

        /**
         * Export to PDF
         */
        async exportPDF(project, options) {
            // Use existing PDF export with enhanced options
            if (window.exportProjectPDF) {
                await window.exportProjectPDF();
            }
        },

        /**
         * Export to Excel
         */
        async exportExcel(project, options) {
            const workbook = this.createExcelWorkbook(project, options);
            // Download Excel file
            this.downloadFile(workbook, `${project.name}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        },

        /**
         * Export to Word
         */
        async exportWord(project, options) {
            const doc = this.createWordDocument(project, options);
            this.downloadFile(doc, `${project.name}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        },

        /**
         * Export to JSON
         */
        exportJSON(project, options) {
            const data = this.prepareExportData(project, options);
            const json = JSON.stringify(data, null, 2);
            this.downloadFile(json, `${project.name}.json`, 'application/json');
        },

        /**
         * Export to CSV
         */
        exportCSV(project, options) {
            const csv = this.createCSV(project, options);
            this.downloadFile(csv, `${project.name}.csv`, 'text/csv');
        },

        /**
         * Export to HTML
         */
        exportHTML(project, options) {
            const html = this.createHTMLReport(project, options);
            this.downloadFile(html, `${project.name}.html`, 'text/html');
        },

        /**
         * Create Excel workbook
         */
        createExcelWorkbook(project, options) {
            // Simplified Excel creation
            let csv = 'Proyecto,' + project.name + '\n';
            csv += 'Fecha,' + new Date().toLocaleDateString('es-CL') + '\n\n';

            if (options.activities) {
                csv += 'Actividades\n';
                csv += 'Item,Descripción,Unidad,Cantidad,Precio Unitario,Total\n';
                project.activities.forEach((act, i) => {
                    csv += `${i + 1},${act.nombre},${act.unidad},${act.cantidad},${act.precioUnitario},${act.total}\n`;
                });
                csv += '\nTotal Proyecto,' + project.activities.reduce((sum, a) => sum + a.total, 0) + '\n\n';
            }

            if (options.tasks && project.tasks) {
                csv += 'Tareas\n';
                csv += 'Tarea,Estado,Prioridad,Fecha\n';
                project.tasks.forEach(task => {
                    csv += `${task.text},${task.status},${task.priority},${task.date || ''}\n`;
                });
            }

            return csv;
        },

        /**
         * Create Word document
         */
        createWordDocument(project, options) {
            return this.createHTMLReport(project, options);
        },

        /**
         * Create CSV
         */
        createCSV(project, options) {
            let csv = '';

            if (options.activities) {
                csv += 'Item,Descripción,Unidad,Cantidad,Precio Unitario,Total\n';
                project.activities.forEach((act, i) => {
                    csv += `${i + 1},"${act.nombre}",${act.unidad},${act.cantidad},${act.precioUnitario},${act.total}\n`;
                });
            }

            return csv;
        },

        /**
         * Create HTML report
         */
        createHTMLReport(project, options) {
            const total = project.activities.reduce((sum, a) => sum + a.total, 0);

            let html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project.name} - Reporte CLAUDIA</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
            background: #f9fafb;
        }
        .header {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 40px;
            border-radius: 16px;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 32px;
        }
        .card {
            background: white;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }
        th {
            background: #f9fafb;
            font-weight: 600;
        }
        .total {
            font-size: 24px;
            font-weight: 700;
            color: #667eea;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${project.name}</h1>
        <p>Generado el ${new Date().toLocaleDateString('es-CL')} por CLAUDIA</p>
    </div>
`;

            if (options.activities) {
                html += `
    <div class="card">
        <h2>Resumen del Proyecto</h2>
        <p><strong>Total de actividades:</strong> ${project.activities.length}</p>
        <p><strong>Presupuesto total:</strong> <span class="total">$${ClaudiaUtils.formatMoney(total)}</span></p>
    </div>

    <div class="card">
        <h2>Actividades APU</h2>
        <table>
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Descripción</th>
                    <th>Unidad</th>
                    <th>Cantidad</th>
                    <th>Precio Unit.</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${project.activities.map((act, i) => `
                    <tr>
                        <td>${i + 1}</td>
                        <td>${act.nombre}</td>
                        <td>${act.unidad}</td>
                        <td>${act.cantidad}</td>
                        <td>$${ClaudiaUtils.formatMoney(act.precioUnitario)}</td>
                        <td><strong>$${ClaudiaUtils.formatMoney(act.total)}</strong></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
`;
            }

            if (options.tasks && project.tasks && project.tasks.length > 0) {
                html += `
    <div class="card">
        <h2>Tareas del Proyecto</h2>
        <ul>
            ${project.tasks.map(task => `
                <li>
                    <strong>${task.text}</strong>
                    <span style="color: #6b7280;"> - ${task.status}</span>
                    ${task.priority ? ` <span style="background: #fef3c7; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${task.priority}</span>` : ''}
                </li>
            `).join('')}
        </ul>
    </div>
`;
            }

            html += `
    <div style="text-align: center; margin-top: 40px; padding: 20px; color: #6b7280;">
        <p>Generado con ❤️ por CLAUDIA - Tu Asistente Inteligente de Construcción</p>
    </div>
</body>
</html>
`;

            return html;
        },

        /**
         * Prepare export data
         */
        prepareExportData(project, options) {
            const data = {
                name: project.name,
                id: project.id,
                createdAt: project.createdAt,
                updatedAt: project.updatedAt,
                exportedAt: new Date().toISOString()
            };

            if (options.activities) {
                data.activities = project.activities;
                data.total = project.activities.reduce((sum, a) => sum + a.total, 0);
            }

            if (options.tasks) {
                data.tasks = project.tasks;
            }

            if (options.calendar) {
                data.calendar = project.calendar;
            }

            return data;
        },

        /**
         * Download file
         */
        downloadFile(content, filename, mimeType) {
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    };

    // Auto-initialize
    ClaudiaExportPro.init();

})();

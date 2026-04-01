/**
 * CLAUDIA PDF Export v5.6
 * Exportación profesional de presupuestos a PDF
 * Para maestros constructores - formato listo para imprimir
 */

(function() {
    'use strict';

    // ==========================================
    // 1. PDF EXPORT MANAGER
    // ==========================================

    class PDFExporter {
        constructor() {
            this.currentProject = null;
            console.log('[PDF Export] ✅ Initialized');
        }

        async exportProjectToPDF(projectData) {
            this.currentProject = projectData;

            // Crear HTML optimizado para PDF
            const pdfHTML = this.generatePDFHTML();

            // Abrir en nueva ventana para imprimir
            this.openPrintWindow(pdfHTML);
        }

        generatePDFHTML() {
            const project = this.currentProject;
            const totalCost = this.calculateTotal(project.activities || []);
            const date = new Date().toLocaleDateString('es-CL');

            return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Presupuesto - ${project.name}</title>
    <style>
        @page {
            size: letter;
            margin: 2cm;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.4;
            color: #000;
            background: white;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }

        /* Header */
        .header {
            border-bottom: 3px solid #DD0021;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }

        .logo-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }

        .brand {
            font-size: 32px;
            font-weight: 800;
            color: #DD0021;
        }

        .doc-type {
            font-size: 18px;
            font-weight: 600;
            color: #666;
        }

        .project-info {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }

        .project-name {
            font-size: 24px;
            font-weight: 700;
            color: #000;
            margin-bottom: 10px;
        }

        .project-meta {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            font-size: 10pt;
            color: #666;
        }

        .meta-item {
            display: flex;
            gap: 5px;
        }

        .meta-label {
            font-weight: 600;
        }

        /* Table */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
            font-size: 10pt;
        }

        thead {
            background: #DD0021;
            color: white;
        }

        th {
            padding: 12px 8px;
            text-align: left;
            font-weight: 600;
            font-size: 10pt;
        }

        tbody tr {
            border-bottom: 1px solid #e0e0e0;
        }

        tbody tr:nth-child(even) {
            background: #fafafa;
        }

        td {
            padding: 10px 8px;
            vertical-align: top;
        }

        .col-item {
            width: 5%;
            text-align: center;
            color: #999;
        }

        .col-description {
            width: 40%;
        }

        .col-unit {
            width: 10%;
            text-align: center;
        }

        .col-quantity {
            width: 12%;
            text-align: right;
        }

        .col-price {
            width: 15%;
            text-align: right;
        }

        .col-total {
            width: 18%;
            text-align: right;
            font-weight: 600;
        }

        .activity-name {
            font-weight: 600;
            color: #000;
            margin-bottom: 3px;
        }

        .activity-details {
            font-size: 9pt;
            color: #666;
        }

        /* Summary */
        .summary {
            margin-top: 40px;
            border-top: 2px solid #DD0021;
            padding-top: 20px;
        }

        .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            font-size: 12pt;
        }

        .summary-row.total {
            background: #DD0021;
            color: white;
            padding: 15px;
            margin-top: 10px;
            border-radius: 4px;
            font-size: 16pt;
            font-weight: 700;
        }

        /* Footer */
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            font-size: 9pt;
            color: #666;
            text-align: center;
        }

        .powered-by {
            margin-top: 10px;
            font-style: italic;
        }

        /* Print styles */
        @media print {
            body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }

            .no-print {
                display: none;
            }

            thead {
                display: table-header-group;
            }

            tr {
                page-break-inside: avoid;
            }
        }

        /* Print button */
        .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #DD0021;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 14pt;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(221, 0, 33, 0.3);
            z-index: 1000;
        }

        .print-button:hover {
            background: #b3001b;
        }

        @media print {
            .print-button {
                display: none;
            }
        }
    </style>
</head>
<body>
    <button class="print-button no-print" onclick="window.print()">
        🖨️ Imprimir / Guardar PDF
    </button>

    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="logo-section">
                <div class="brand">CLAUDIA</div>
                <div class="doc-type">PRESUPUESTO</div>
            </div>
        </div>

        <!-- Project Info -->
        <div class="project-info">
            <div class="project-name">${project.name || 'Proyecto Sin Nombre'}</div>
            <div class="project-meta">
                <div class="meta-item">
                    <span class="meta-label">Fecha:</span>
                    <span>${date}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Items:</span>
                    <span>${(project.activities || []).length} actividades</span>
                </div>
            </div>
        </div>

        <!-- Activities Table -->
        <table>
            <thead>
                <tr>
                    <th class="col-item">Ítem</th>
                    <th class="col-description">Descripción</th>
                    <th class="col-unit">Unidad</th>
                    <th class="col-quantity">Cantidad</th>
                    <th class="col-price">Precio Unit.</th>
                    <th class="col-total">Total</th>
                </tr>
            </thead>
            <tbody>
                ${this.renderActivities(project.activities || [])}
            </tbody>
        </table>

        <!-- Summary -->
        <div class="summary">
            <div class="summary-row">
                <span>Subtotal:</span>
                <span>$${totalCost.toLocaleString('es-CL')}</span>
            </div>
            <div class="summary-row">
                <span>IVA (19%):</span>
                <span>$${Math.round(totalCost * 0.19).toLocaleString('es-CL')}</span>
            </div>
            <div class="summary-row total">
                <span>TOTAL:</span>
                <span>$${Math.round(totalCost * 1.19).toLocaleString('es-CL')}</span>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div>Este presupuesto es una estimación basada en precios de mercado.</div>
            <div>Los precios pueden variar según proveedor y condiciones del proyecto.</div>
            <div class="powered-by">
                🤖 Generado con CLAUDIA - Tu Asistente Inteligente de Construcción
            </div>
        </div>
    </div>

    <script>
        // Auto-print dialog on load (optional)
        // window.onload = () => setTimeout(() => window.print(), 500);
    </script>
</body>
</html>
            `;
        }

        renderActivities(activities) {
            return activities.map((activity, index) => {
                const total = activity.cantidad * activity.precio_unitario;

                return `
                    <tr>
                        <td class="col-item">${index + 1}</td>
                        <td class="col-description">
                            <div class="activity-name">${activity.nombre || 'Actividad'}</div>
                            <div class="activity-details">
                                Código: ${activity.codigo || 'N/A'}
                            </div>
                        </td>
                        <td class="col-unit">${activity.unidad || 'm2'}</td>
                        <td class="col-quantity">${activity.cantidad.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td class="col-price">$${activity.precio_unitario.toLocaleString('es-CL')}</td>
                        <td class="col-total">$${total.toLocaleString('es-CL')}</td>
                    </tr>
                `;
            }).join('');
        }

        calculateTotal(activities) {
            return activities.reduce((sum, activity) => {
                return sum + (activity.cantidad * activity.precio_unitario);
            }, 0);
        }

        openPrintWindow(html) {
            // Abrir nueva ventana
            const printWindow = window.open('', '_blank', 'width=800,height=900');

            if (!printWindow) {
                alert('Por favor permite ventanas emergentes para exportar el PDF.');
                return;
            }

            // Escribir HTML
            printWindow.document.write(html);
            printWindow.document.close();

            // Enfocar la ventana
            printWindow.focus();

            // Optional: Auto-print después de cargar
            // printWindow.onload = () => {
            //     setTimeout(() => {
            //         printWindow.print();
            //     }, 250);
            // };
        }
    }

    // ==========================================
    // 2. EXCEL EXPORT (CSV Format)
    // ==========================================

    class ExcelExporter {
        exportToExcel(projectData) {
            const csv = this.generateCSV(projectData);
            this.downloadCSV(csv, `${projectData.name || 'proyecto'}.csv`);
        }

        generateCSV(project) {
            const activities = project.activities || [];

            // Header
            let csv = 'Ítem,Código,Descripción,Unidad,Cantidad,Precio Unitario,Total\n';

            // Rows
            activities.forEach((activity, index) => {
                const total = activity.cantidad * activity.precio_unitario;
                csv += `${index + 1},"${activity.codigo || 'N/A'}","${activity.nombre}","${activity.unidad}",${activity.cantidad},${activity.precio_unitario},${total}\n`;
            });

            // Total
            const totalCost = this.calculateTotal(activities);
            csv += `\n,,,,SUBTOTAL,,${totalCost}\n`;
            csv += `,,,,IVA 19%,,${Math.round(totalCost * 0.19)}\n`;
            csv += `,,,,TOTAL,,${Math.round(totalCost * 1.19)}\n`;

            return csv;
        }

        calculateTotal(activities) {
            return activities.reduce((sum, activity) => {
                return sum + (activity.cantidad * activity.precio_unitario);
            }, 0);
        }

        downloadCSV(csv, filename) {
            // Create blob
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

            // Create download link
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);

            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // ==========================================
    // 3. SHARE FUNCTIONALITY
    // ==========================================

    class ProjectSharer {
        async shareProject(projectData) {
            const shareText = this.generateShareText(projectData);

            // Check if Web Share API is available
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: `Presupuesto: ${projectData.name}`,
                        text: shareText,
                        url: window.location.href
                    });
                    console.log('[Share] ✅ Shared successfully');
                } catch (error) {
                    if (error.name !== 'AbortError') {
                        console.error('[Share] Error:', error);
                        this.fallbackShare(shareText);
                    }
                }
            } else {
                this.fallbackShare(shareText);
            }
        }

        generateShareText(project) {
            const activities = project.activities || [];
            const total = activities.reduce((sum, act) =>
                sum + (act.cantidad * act.precio_unitario), 0);

            let text = `📋 *PRESUPUESTO: ${project.name || 'Proyecto'}*\n\n`;

            activities.forEach((activity, index) => {
                const actTotal = activity.cantidad * activity.precio_unitario;
                text += `${index + 1}. ${activity.nombre}\n`;
                text += `   ${activity.cantidad} ${activity.unidad} × $${activity.precio_unitario.toLocaleString('es-CL')} = $${actTotal.toLocaleString('es-CL')}\n\n`;
            });

            text += `💰 *TOTAL: $${Math.round(total * 1.19).toLocaleString('es-CL')}* (IVA incluido)\n\n`;
            text += `🤖 Generado con CLAUDIA`;

            return text;
        }

        fallbackShare(text) {
            // Copy to clipboard
            navigator.clipboard.writeText(text).then(() => {
                if (typeof showToast === 'function') {
                    showToast('✅ Presupuesto copiado al portapapeles');
                } else {
                    alert('Presupuesto copiado al portapapeles');
                }
            }).catch(err => {
                // Manual copy fallback
                this.manualCopy(text);
            });
        }

        manualCopy(text) {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();

            try {
                document.execCommand('copy');
                if (typeof showToast === 'function') {
                    showToast('✅ Presupuesto copiado');
                } else {
                    alert('Presupuesto copiado al portapapeles');
                }
            } catch (err) {
                console.error('[Share] Copy failed:', err);
            }

            document.body.removeChild(textarea);
        }
    }

    // ==========================================
    // 4. GLOBAL FUNCTIONS
    // ==========================================

    // Export to PDF
    window.exportProjectToPDF = function() {
        const currentProject = getCurrentProject();
        if (!currentProject || !currentProject.activities || currentProject.activities.length === 0) {
            if (typeof showToast === 'function') {
                showToast('⚠️ Agrega actividades antes de exportar');
            } else {
                alert('Agrega actividades antes de exportar');
            }
            return;
        }

        const exporter = new PDFExporter();
        exporter.exportProjectToPDF(currentProject);

        if (typeof showToast === 'function') {
            showToast('📄 Abriendo vista previa del PDF...');
        }
    };

    // Export to Excel
    window.exportToExcel = function() {
        const currentProject = getCurrentProject();
        if (!currentProject || !currentProject.activities || currentProject.activities.length === 0) {
            if (typeof showToast === 'function') {
                showToast('⚠️ Agrega actividades antes de exportar');
            } else {
                alert('Agrega actividades antes de exportar');
            }
            return;
        }

        const exporter = new ExcelExporter();
        exporter.exportToExcel(currentProject);

        if (typeof showToast === 'function') {
            showToast('✅ Excel descargado');
        }
    };

    // Share Project
    window.shareProject = async function() {
        const currentProject = getCurrentProject();
        if (!currentProject || !currentProject.activities || currentProject.activities.length === 0) {
            if (typeof showToast === 'function') {
                showToast('⚠️ Agrega actividades antes de compartir');
            } else {
                alert('Agrega actividades antes de compartir');
            }
            return;
        }

        const sharer = new ProjectSharer();
        await sharer.shareProject(currentProject);
    };

    // Helper to get current project
    function getCurrentProject() {
        try {
            const projects = JSON.parse(localStorage.getItem('claudia_projects')) || [];
            const currentProjectId = localStorage.getItem('claudia_current_project');

            if (currentProjectId) {
                return projects.find(p => p.id === currentProjectId);
            }

            return projects[0] || null;
        } catch (e) {
            console.error('[PDF Export] Error getting current project:', e);
            return null;
        }
    }

    console.log('✅ CLAUDIA PDF Export v5.6 initialized');
    console.log('📄 PDF export ready');
    console.log('📊 Excel export ready');
    console.log('📱 Share functionality ready');

})();

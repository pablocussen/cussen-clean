// claudia-export-pro.js
// Sistema de exportación profesional para ClaudIA

(function() {
    'use strict';

    // Exportar a Excel (CSV)
    window.exportToExcel = function() {
        if (!currentProject || !currentProject.activities || currentProject.activities.length === 0) {
            showToast('Agrega actividades primero');
            return;
        }

        let csv = 'PROYECTO:,' + currentProject.name + '\n';
        csv += 'FECHA:,' + new Date().toLocaleDateString('es-CL') + '\n\n';

        // RESUMEN
        const total = currentProject.activities.reduce((sum, act) => {
            return sum + (parseFloat(act.cantidad) || 0) * (parseFloat(act.precio) || 0);
        }, 0);
        csv += 'RESUMEN\n';
        csv += 'Total Actividades:,' + currentProject.activities.length + '\n';
        csv += 'TOTAL PROYECTO:,$' + total.toLocaleString('es-CL') + '\n\n';

        // ACTIVIDADES POR CATEGORÍA
        const porCategoria = {};
        currentProject.activities.forEach(act => {
            const cat = act.categoria || 'SIN CATEGORÍA';
            if (!porCategoria[cat]) {
                porCategoria[cat] = [];
            }
            porCategoria[cat].push(act);
        });

        csv += 'DETALLE POR CATEGORÍA\n';
        csv += 'Categoría,Actividad,Cantidad,Unidad,Precio Unit.,Subtotal,% del Total\n';

        Object.keys(porCategoria).sort().forEach(categoria => {
            let subtotalCat = 0;
            porCategoria[categoria].forEach(act => {
                const cantidad = parseFloat(act.cantidad) || 0;
                const precio = parseFloat(act.precio) || 0;
                const subtotal = cantidad * precio;
                const porcentaje = total > 0 ? (subtotal / total * 100).toFixed(1) : 0;
                subtotalCat += subtotal;

                csv += `${categoria},"${act.nombre}",${cantidad},${act.unidad},${precio},${subtotal},${porcentaje}%\n`;
            });

            // Subtotal categoría
            const porcCat = total > 0 ? (subtotalCat / total * 100).toFixed(1) : 0;
            csv += `,SUBTOTAL ${categoria},,,,${subtotalCat},${porcCat}%\n`;
            csv += '\n';
        });

        // Descargar archivo
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${currentProject.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('Archivo Excel descargado');
    };

    // Exportar resumen ejecutivo
    window.exportResumenEjecutivo = function() {
        if (!currentProject || !currentProject.activities || currentProject.activities.length === 0) {
            showToast('Agrega actividades primero');
            return;
        }

        const total = currentProject.activities.reduce((sum, act) => {
            return sum + (parseFloat(act.cantidad) || 0) * (parseFloat(act.precio) || 0);
        }, 0);

        // Agrupar por categoría
        const porCategoria = {};
        currentProject.activities.forEach(act => {
            const cat = act.categoria || 'SIN CATEGORÍA';
            if (!porCategoria[cat]) {
                porCategoria[cat] = { actividades: [], subtotal: 0 };
            }
            const subtotal = (parseFloat(act.cantidad) || 0) * (parseFloat(act.precio) || 0);
            porCategoria[cat].actividades.push(act);
            porCategoria[cat].subtotal += subtotal;
        });

        let txt = '═══════════════════════════════════════════════\n';
        txt += '  RESUMEN EJECUTIVO - ' + currentProject.name.toUpperCase() + '\n';
        txt += '═══════════════════════════════════════════════\n\n';
        txt += 'Fecha: ' + new Date().toLocaleDateString('es-CL', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        }) + '\n\n';

        // Resumen general
        txt += '━━━ RESUMEN GENERAL ━━━\n';
        txt += 'Total Actividades: ' + currentProject.activities.length + '\n';
        txt += 'Total Categorías: ' + Object.keys(porCategoria).length + '\n';
        txt += 'TOTAL PROYECTO: $' + total.toLocaleString('es-CL') + '\n\n';

        // Por categoría
        txt += '━━━ DESGLOSE POR CATEGORÍA ━━━\n\n';
        Object.keys(porCategoria).sort().forEach(categoria => {
            const cat = porCategoria[categoria];
            const porcentaje = total > 0 ? (cat.subtotal / total * 100).toFixed(1) : 0;

            txt += `${categoria}\n`;
            txt += `  Actividades: ${cat.actividades.length}\n`;
            txt += `  Subtotal: $${cat.subtotal.toLocaleString('es-CL')}\n`;
            txt += `  % del Total: ${porcentaje}%\n\n`;
        });

        // Top 5 actividades más costosas
        const topActividades = [...currentProject.activities]
            .map(act => ({
                ...act,
                subtotal: (parseFloat(act.cantidad) || 0) * (parseFloat(act.precio) || 0)
            }))
            .sort((a, b) => b.subtotal - a.subtotal)
            .slice(0, 5);

        txt += '━━━ TOP 5 ACTIVIDADES MÁS COSTOSAS ━━━\n\n';
        topActividades.forEach((act, i) => {
            const porcentaje = total > 0 ? (act.subtotal / total * 100).toFixed(1) : 0;
            txt += `${i + 1}. ${act.nombre}\n`;
            txt += `   ${act.cantidad} ${act.unidad} × $${act.precio.toLocaleString('es-CL')} = $${act.subtotal.toLocaleString('es-CL')}\n`;
            txt += `   ${porcentaje}% del presupuesto total\n\n`;
        });

        txt += '═══════════════════════════════════════════════\n';
        txt += 'Generado por ClaudIA - Presupuestos Profesionales\n';
        txt += '═══════════════════════════════════════════════\n';

        // Descargar archivo
        const blob = new Blob([txt], { type: 'text/plain;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Resumen_${currentProject.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.txt`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('Resumen descargado');
    };

    // Copiar presupuesto al portapapeles
    window.copyPresupuestoToClipboard = function() {
        if (!currentProject || !currentProject.activities || currentProject.activities.length === 0) {
            showToast('Agrega actividades primero');
            return;
        }

        const total = currentProject.activities.reduce((sum, act) => {
            return sum + (parseFloat(act.cantidad) || 0) * (parseFloat(act.precio) || 0);
        }, 0);

        let txt = `PRESUPUESTO: ${currentProject.name}\n`;
        txt += `Fecha: ${new Date().toLocaleDateString('es-CL')}\n\n`;

        // Agrupar por categoría
        const porCategoria = {};
        currentProject.activities.forEach(act => {
            const cat = act.categoria || 'SIN CATEGORÍA';
            if (!porCategoria[cat]) {
                porCategoria[cat] = [];
            }
            porCategoria[cat].push(act);
        });

        Object.keys(porCategoria).sort().forEach(categoria => {
            txt += `\n${categoria}\n`;
            txt += '─'.repeat(50) + '\n';

            porCategoria[categoria].forEach(act => {
                const cantidad = parseFloat(act.cantidad) || 0;
                const precio = parseFloat(act.precio) || 0;
                const subtotal = cantidad * precio;

                txt += `${act.nombre}\n`;
                txt += `  ${cantidad} ${act.unidad} × $${precio.toLocaleString('es-CL')} = $${subtotal.toLocaleString('es-CL')}\n`;
            });
        });

        txt += `\n${'═'.repeat(50)}\n`;
        txt += `TOTAL: $${total.toLocaleString('es-CL')}\n`;
        txt += `${'═'.repeat(50)}\n`;

        // Copiar al portapapeles
        navigator.clipboard.writeText(txt).then(() => {
            showToast('Presupuesto copiado - Pégalo en WhatsApp/Email');
        }).catch(err => {
            console.error('Error copiando:', err);
            showToast('Error al copiar');
        });
    };

    console.log('Export PRO module loaded');
})();

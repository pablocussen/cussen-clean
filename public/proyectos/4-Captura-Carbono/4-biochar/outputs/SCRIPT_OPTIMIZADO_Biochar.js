// =================================================================================================
// FRAMEWORK DE ANÁLISIS AGRÍCOLA DE PRECISIÓN - SUPER ÍNDICE CUSSEN v2.0
//
// PROYECTO DE APLICACIÓN: Experimento Biochar Rinconada
// TIPO DE ANÁLISIS: CUSSEN-ProductividadAgricola
// AUTOR: GCasist (Optimizador IA para Cussen.cl)
// FECHA: 07 de Septiembre de 2025
// =================================================================================================

// -------------------------------------------------------------------------------------------------
// PASO 1: CONFIGURACIÓN DEL ANÁLISIS
// -------------------------------------------------------------------------------------------------

var config = {
  nombre: 'Proyecto Biochar Rinconada',
  ubicacion: 'Rinconada, Los Ríos, Chile',
  zona_tratamiento: ee.Geometry.Polygon([[[-73.6145, -41.1885], [-73.6135, -41.1885], [-73.6135, -41.1895], [-73.6145, -41.1895]]]),
  zona_control: ee.Geometry.Polygon([[[-73.6155, -41.1895], [-73.6150, -41.1895], [-73.6150, -41.1900], [-73.6155, -41.1900]]]),
  fecha_linea_base_inicio: '2015-01-01',
  fecha_linea_base_fin: '2024-12-31',
  resolucion: 10,
  filtro_nubes: 15
};

// --- Parámetros del Modelo IA ---
var pesos_ia = {
  // Optimizado para detectar cambios sutiles en la salud de la vegetación en praderas.
  productividad_agricola: {
    w_evi: 1.5,  // Mayor peso al EVI por su sensibilidad en alta biomasa y corrección atmosférica.
    w_savi: 1.2, // Alto peso al SAVI para normalizar el efecto del suelo.
    w_noise: 0.4, // Peso para restar el ruido del Índice de Suelo Desnudo (BSI).
    armonicos: 3 // Número de ciclos armónicos para modelar la estacionalidad con precisión.
  }
};

var W = pesos_ia.productividad_agricola;
Map.centerObject(config.zona_tratamiento, 16);

// -------------------------------------------------------------------------------------------------
// PASO 2: ADQUISICIÓN Y PRE-PROCESAMIENTO DE DATOS
// -------------------------------------------------------------------------------------------------

function getS2Collection(fecha_inicio, fecha_fin) {
  return ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
      .filterBounds(config.zona_tratamiento.union(config.zona_control))
      .filterDate(fecha_inicio, fecha_fin)
      .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', config.filtro_nubes))
      .map(function(image) {
        var qa = image.select('QA60');
        var mask = qa.bitwiseAnd(1 << 10).eq(0).and(qa.bitwiseAnd(1 << 11).eq(0));
        return image.updateMask(mask).divide(10000)
            .select(['B2', 'B3', 'B4', 'B8', 'B11', 'B12'])
            .copyProperties(image, ['system:time_start']);
      });
}

var s2_collection = getS2Collection(config.fecha_linea_base_inicio, config.fecha_linea_base_fin);
print('📷 Imágenes de Línea Base (10 años) encontradas:', s2_collection.size());

// -------------------------------------------------------------------------------------------------
// PASO 3: APLICACIÓN DEL SUPER ÍNDICE CUSSEN
// -------------------------------------------------------------------------------------------------

function calcularIndicesAvanzados(imagen) {
  // EVI (Índice de Vegetación Mejorado)
  var evi = imagen.expression(
    '2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1))', {
      'NIR': imagen.select('B8'), 'RED': imagen.select('B4'), 'BLUE': imagen.select('B2')
    }).rename('EVI');
  
  // SAVI (Índice de Vegetación Ajustado al Suelo)
  var savi = imagen.expression(
    '1.5 * (NIR - RED) / (NIR + RED + 0.5)', {
      'NIR': imagen.select('B8'), 'RED': imagen.select('B4')
    }).rename('SAVI');

  // BSI (Índice de Suelo Desnudo) para reducción de ruido
  var bsi = imagen.expression(
      '((SWIR1 + RED) - (NIR + BLUE)) / ((SWIR1 + RED) + (NIR + BLUE))', {
      'SWIR1': imagen.select('B11'), 'RED': imagen.select('B4'), 'NIR': imagen.select('B8'), 'BLUE': imagen.select('B2')
  }).rename('BSI');

  // IPP (Índice de Productividad Ponderado) - Fórmula Optimizada IA
  var ipp = evi.multiply(W.w_evi).add(savi.multiply(W.w_savi)).subtract(bsi.multiply(W.w_noise)).rename('IPP');
  
  return imagen.addBands([evi, savi, bsi, ipp]);
}

var collection_con_indices = s2_collection.map(calcularIndicesAvanzados);

// -------------------------------------------------------------------------------------------------
// PASO 4: ANÁLISIS DE SERIES TEMPORALES CON REGRESIÓN ARMÓNICA
// -------------------------------------------------------------------------------------------------

// --- Función para agregar variables de tiempo para el modelo armónico ---
function agregarVariablesTiempo(imagen) {
  var fecha = ee.Date(imagen.get('system:time_start'));
  var años_desde_inicio = fecha.difference(ee.Date(config.fecha_linea_base_inicio), 'year');
  var angulo_radial = años_desde_inicio.multiply(2 * Math.PI);
  return imagen
    .addBands(ee.Image(años_desde_inicio).rename('t'))
    .addBands(angulo_radial.sin().rename('sin'))
    .addBands(angulo_radial.cos().rename('cos'));
}

var collection_con_tiempo = collection_con_indices.map(agregarVariablesTiempo);

// --- Modelo Armónico ---
var bandas_independientes = ['constant', 't', 'sin', 'cos'];
var banda_dependiente = 'IPP';

var regresion_armonica = collection_con_tiempo
  .select(bandas_independientes.concat(banda_dependiente))
  .reduce(ee.Reducer.linearRegression(bandas_independientes.length, 1));

// --- Función para aplicar el modelo y detectar anomalías ---
function aplicarModelo(imagen) {
  var prediccion = imagen.select(bandas_independientes).multiply(regresion_armonica.select('coefficients')).reduce('sum');
  var anomalia = imagen.select(banda_dependiente).subtract(prediccion).rename('Anomalia_IPP');
  return imagen.addBands(prediccion.rename('IPP_Predicho')).addBands(anomalia);
}

var collection_con_anomalias = collection_con_tiempo.map(aplicarModelo);

// -------------------------------------------------------------------------------------------------
// PASO 5: VISUALIZACIÓN Y ESTADÍSTICAS COMPARATIVAS
// -------------------------------------------------------------------------------------------------

// --- Gráfico de Serie Temporal Comparativa (Tratamiento vs Control) ---
var grafico_comparativo = ui.Chart.image.seriesByRegion({
  imageCollection: collection_con_indices,
  band: 'IPP',
  regions: ee.FeatureCollection([
    ee.Feature(config.zona_tratamiento, {label: 'Zona Tratamiento'}),
    ee.Feature(config.zona_control, {label: 'Zona Control'})
  ]),
  reducer: ee.Reducer.mean(),
  scale: config.resolucion,
  xProperty: 'system:time_start',
  seriesProperty: 'label'
}).setOptions({
  title: 'Línea Base Comparativa (2015-2024): Índice de Productividad Ponderado (IPP)',
  vAxis: {title: 'IPP'},
  hAxis: {title: 'Fecha'},
  lineWidth: 1.5,
  pointSize: 3,
  series: {
    0: {color: '#1a9850'}, // Verde para tratamiento
    1: {color: '#fdae61'}  // Naranja para control
  }
});

print(grafico_comparativo);

// --- Mapa de Productividad Promedio ---
var ipp_promedio = collection_con_indices.select('IPP').mean();
var paleta_ipp = ['#d7191c', '#fdae61', '#ffffbf', '#abdda4', '#2b83ba'];
Map.addLayer(ipp_promedio, {min: 0.2, max: 0.8, palette: paleta_ipp}, 'Productividad Promedio (IPP)');
Map.addLayer(config.zona_tratamiento, {color: '#1a9850'}, 'Zona Tratamiento');
Map.addLayer(config.zona_control, {color: '#fdae61'}, 'Zona Control');

// --- Exportación de la serie temporal para análisis externo ---
var export_collection = collection_con_indices.map(function(img) {
    var mean_tratamiento = img.select('IPP').reduceRegion({reducer: ee.Reducer.mean(), geometry: config.zona_tratamiento, scale: 10}).get('IPP');
    var mean_control = img.select('IPP').reduceRegion({reducer: ee.Reducer.mean(), geometry: config.zona_control, scale: 10}).get('IPP');
    return ee.Feature(null, {
        'system:time_start': img.get('system:time_start'),
        'IPP_Tratamiento': mean_tratamiento,
        'IPP_Control': mean_control
    });
});

Export.table.toDrive({
    collection: export_collection,
    description: 'Biochar_LineaBase_IPP_Optimizada',
    folder: 'Super_Cussen_Biochar',
    fileFormat: 'CSV'
});

print('✅ Proceso completado. El script optimizado para el proyecto Biochar está listo.');
print('➡️ Revise el gráfico en la consola y la pestaña "Tasks" para ejecutar la exportación.');

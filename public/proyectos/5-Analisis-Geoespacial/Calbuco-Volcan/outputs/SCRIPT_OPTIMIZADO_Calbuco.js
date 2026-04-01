// =================================================================================================
// FRAMEWORK DE ANÁLISIS DE IMPACTO AMBIENTAL - SUPER ÍNDICE CUSSEN v2.0
//
// PROYECTO DE APLICACIÓN: Volcán Calbuco, Chile
// TIPO DE ANÁLISIS: CUSSEN-ImpactoVolcanico
// AUTOR: GCasist (Optimizador IA para Cussen.cl)
// FECHA: 07 de Septiembre de 2025
// =================================================================================================

// -------------------------------------------------------------------------------------------------
// PASO 1: CONFIGURACIÓN DEL ANÁLISIS
// -------------------------------------------------------------------------------------------------

var config = {
  nombre: 'Impacto Erupción Calbuco 2015',
  ubicacion: 'Región de Los Lagos, Chile',
  aoi: ee.Geometry.Polygon([[[-72.8, -41.45], [-72.8, -41.20], [-72.4, -41.20], [-72.4, -41.45]]]),
  fecha_pre_inicio: '2015-01-01',
  fecha_pre_fin: '2015-04-21', // Justo antes de la erupción
  fecha_post_inicio: '2015-04-24', // Justo después de la erupción
  fecha_post_fin: '2015-07-31',
  fecha_actual_inicio: '2025-01-01',
  fecha_actual_fin: '2025-07-31',
  resolucion: 30, // Se usará Landsat 8 para consistencia histórica
  filtro_nubes: 25
};

// --- Parámetros del Modelo IA ---
var pesos_ia = {
  // Optimizado para detectar la firma de ceniza volcánica sobre vegetación.
  impacto_volcanico: {
    w_dNBR: 0.45, // Alta importancia a la pérdida de vigor vegetal.
    w_dNDWI: 0.35, // Alta importancia a cambios en humedad y sedimentos (lahares).
    w_dNDVI: 0.20, // Menor peso, pero apoya la señal de vegetación.
    correccion_atmosferica: 0.01
  }
};

var W = pesos_ia.impacto_volcanico;
Map.centerObject(config.aoi, 10);

// -------------------------------------------------------------------------------------------------
// PASO 2: ADQUISICIÓN Y PRE-PROCESAMIENTO DE DATOS (LANDSAT 8)
// -------------------------------------------------------------------------------------------------

function getL8Collection(fecha_inicio, fecha_fin) {
  return ee.ImageCollection('LANDSAT/LC08/C02/T1_SR')
      .filterBounds(config.aoi)
      .filterDate(fecha_inicio, fecha_fin)
      .filter(ee.Filter.lt('CLOUD_COVER', config.filtro_nubes))
      .map(function(image) {
        var qa = image.select('QA_PIXEL');
        var cloud = qa.bitwiseAnd(1 << 3).or(qa.bitwiseAnd(1 << 4));
        return image.updateMask(cloud.not()).divide(10000)
            .select(['B2', 'B3', 'B4', 'B5', 'B6', 'B7'], ['Blue', 'Green', 'Red', 'NIR', 'SWIR1', 'SWIR2'])
            .copyProperties(image, ['system:time_start']);
      });
}

var pre_col = getL8Collection(config.fecha_pre_inicio, config.fecha_pre_fin);
var post_col = getL8Collection(config.fecha_post_inicio, config.fecha_post_fin);
var actual_col = getL8Collection(config.fecha_actual_inicio, config.fecha_actual_fin);

var pre_img = pre_col.median().clip(config.aoi);
var post_img = post_col.median().clip(config.aoi);
var actual_img = actual_col.median().clip(config.aoi);

print('📷 Imágenes Pre-Erupción:', pre_col.size());
print('📷 Imágenes Post-Erupción:', post_col.size());
print('📷 Imágenes Actuales (2025):', actual_col.size());

// -------------------------------------------------------------------------------------------------
// PASO 3: APLICACIÓN DEL SUPER ÍNDICE CUSSEN
// -------------------------------------------------------------------------------------------------

function calcularIndices(imagen) {
  var ndvi = imagen.normalizedDifference(['NIR', 'Red']).rename('NDVI');
  var nbr = imagen.normalizedDifference(['NIR', 'SWIR2']).rename('NBR');
  var ndwi = imagen.normalizedDifference(['Green', 'NIR']).rename('NDWI');
  return imagen.addBands([ndvi, nbr, ndwi]);
}

var pre_indices = calcularIndices(pre_img);
var post_indices = calcularIndices(post_img);
var actual_indices = calcularIndices(actual_img);

// --- Cálculo de Deltas ---
var dNBR = pre_indices.select('NBR').subtract(post_indices.select('NBR')).rename('dNBR');
var dNDVI = pre_indices.select('NDVI').subtract(post_indices.select('NDVI')).rename('dNDVI');
var dNDWI = pre_indices.select('NDWI').subtract(post_indices.select('NDWI')).rename('dNDWI');

// --- Fórmula Ponderada IA para Impacto Volcánico ---
var impacto_total = dNBR.multiply(W.w_dNBR)
    .add(dNDWI.multiply(W.w_dNDWI))
    .add(dNDVI.multiply(W.w_dNDVI))
    .subtract(W.correccion_atmosferica)
    .rename('Impacto_Volcanico');

// --- Clasificación de Impacto ---
var clasificacion_impacto = ee.Image(0)
    .where(impacto_total.gt(0.1), 1) // Impacto Leve
    .where(impacto_total.gt(0.25), 2) // Impacto Moderado
    .where(impacto_total.gt(0.5), 3) // Impacto Alto (Ceniza densa / Lahares)
    .rename('Clasificacion_Impacto');

// -------------------------------------------------------------------------------------------------
// PASO 4: ANÁLISIS DE RECUPERACIÓN Y VISUALIZACIÓN
// -------------------------------------------------------------------------------------------------

// --- Índice de Recuperación (comparando NDVI actual con pre-erupción) ---
var recuperacion_ndvi = actual_indices.select('NDVI').divide(pre_indices.select('NDVI')).rename('Indice_Recuperacion');

// --- Paletas de Colores Profesionales ---
var paleta_impacto = ['#feebe2', 'fcc5c0', 'fa9fb5', 'f768a1', 'c51b8a', '7a0177']; // Rosa a Púrpura
var paleta_recuperacion = ['#d7191c', '#fdae61', '#ffffbf', '#abdda4', '#2b83ba']; // Rojo -> Amarillo -> Azul

// -------------------------------------------------------------------------------------------------
// PASO 5: PRESENTACIÓN DE RESULTADOS EN MAPA
// -------------------------------------------------------------------------------------------------

Map.addLayer(pre_img, {bands: ['Red', 'Green', 'Blue'], min: 0, max: 0.2}, 'Pre-Erupción (Color Real)', false);
Map.addLayer(post_img, {bands: ['Red', 'Green', 'Blue'], min: 0, max: 0.2}, 'Post-Erupción (Color Real)');
Map.addLayer(clasificacion_impacto.selfMask(), {min: 1, max: 3, palette: paleta_impacto}, 'IMPACTO VOLCÁNICO (CUSSEN v2.0)', true);
Map.addLayer(recuperacion_ndvi, {min: 0.5, max: 1.2, palette: paleta_recuperacion}, 'Índice de Recuperación (2025 vs 2015)', false);
Map.addLayer(actual_img, {bands: ['Red', 'Green', 'Blue'], min: 0, max: 0.2}, 'Estado Actual 2025 (Color Real)', false);

// --- Exportación de Resultados ---
var folder_export = 'Super_Cussen_Calbuco';

Export.image.toDrive({
  image: clasificacion_impacto.toByte(),
  description: 'Calbuco_Impacto_Cussen_v2',
  folder: folder_export,
  region: config.aoi,
  scale: config.resolucion,
  maxPixels: 1e13
});

Export.image.toDrive({
  image: recuperacion_ndvi.toFloat(),
  description: 'Calbuco_Recuperacion_NDVI_2025',
  folder: folder_export,
  region: config.aoi,
  scale: config.resolucion,
  maxPixels: 1e13
});

print('✅ Proceso completado. El script optimizado para el Volcán Calbuco está listo.');
print('➡️ Revise las capas en el mapa y la pestaña "Tasks" para ejecutar las exportaciones.');

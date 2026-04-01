// =================================================================================================
// FRAMEWORK DE MONITOREO FORESTAL A GRAN ESCALA - SUPER ÍNDICE CUSSEN v2.0
//
// PROYECTO DE APLICACIÓN: Monitoreo de la Cuenca Amazónica
// TIPO DE ANÁLISIS: CUSSEN-MonitoreoForestal
// AUTOR: GCasist (Optimizador IA para Cussen.cl)
// FECHA: 07 de Septiembre de 2025
// =================================================================================================

// -------------------------------------------------------------------------------------------------
// PASO 1: CONFIGURACIÓN DEL ANÁLISIS
// -------------------------------------------------------------------------------------------------

var config = {
  nombre: 'Monitoreo Forestal Cuenca Amazónica',
  aoi: ee.Geometry.Polygon([[[-75, 10], [-75, -20], [-35, -20], [-35, 10]]]),
  fecha_inicio_periodo_1: '2018-01-01',
  fecha_fin_periodo_1: '2018-12-31',
  fecha_inicio_periodo_2: '2025-01-01',
  fecha_fin_periodo_2: '2025-07-31',
  resolucion: 500, // Escala regional para eficiencia
  filtro_nubes: 25
};

// --- Parámetros del Modelo IA ---
var pesos_ia = {
  // Optimizado para detectar salud en bosques tropicales densos.
  monitoreo_forestal_tropical: {
    w_ndvi: 0.6, // El NDVI sigue siendo el indicador principal de biomasa.
    w_ndmi: 0.4, // NDMI es clave para detectar estrés hídrico y degradación.
    umbral_alerta_fhi: 0.35, // Umbral del FHI por debajo del cual se considera una alerta.
    meses_alerta: 3 // Número de meses consecutivos por debajo del umbral para generar una alerta.
  }
};

var W = pesos_ia.monitoreo_forestal_tropical;
Map.centerObject(config.aoi, 4);

// -------------------------------------------------------------------------------------------------
// PASO 2: ADQUISICIÓN Y PRE-PROCESAMIENTO DE DATOS
// -------------------------------------------------------------------------------------------------

function getS2Collection(fecha_inicio, fecha_fin) {
  return ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
      .filterBounds(config.aoi)
      .filterDate(fecha_inicio, fecha_fin)
      .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', config.filtro_nubes))
      .map(function(image) {
        var qa = image.select('QA60');
        var mask = qa.bitwiseAnd(1 << 10).eq(0).and(qa.bitwiseAnd(1 << 11).eq(0));
        return image.updateMask(mask).divide(10000).select(['B4', 'B8', 'B11']);
      });
}

// -------------------------------------------------------------------------------------------------
// PASO 3: APLICACIÓN DEL SUPER ÍNDICE CUSSEN (FHI)
// -------------------------------------------------------------------------------------------------

// --- Función para calcular el FHI (Forest Health Index) ---
function calcularFHI(imagen, pesos) {
  var ndvi = imagen.normalizedDifference(['B8', 'B4']).rename('NDVI');
  var ndmi = imagen.normalizedDifference(['B8', 'B11']).rename('NDMI');
  
  // Fórmula Ponderada IA para Salud Forestal
  var fhi = ndvi.multiply(pesos.w_ndvi).add(ndmi.multiply(pesos.w_ndmi)).rename('FHI');
  return fhi;
}

// --- Cálculo del FHI para los dos periodos ---
var col_periodo_1 = getS2Collection(config.fecha_inicio_periodo_1, config.fecha_fin_periodo_1);
var col_periodo_2 = getS2Collection(config.fecha_inicio_periodo_2, config.fecha_fin_periodo_2);

var fhi_periodo_1 = calcularFHI(col_periodo_1.median(), W);
var fhi_periodo_2 = calcularFHI(col_periodo_2.median(), W);

print('📷 Imágenes Periodo 1 (2018) encontradas:', col_periodo_1.size());
print('📷 Imágenes Periodo 2 (2025) encontradas:', col_periodo_2.size());

// -------------------------------------------------------------------------------------------------
// PASO 4: ANÁLISIS DE CAMBIO Y GENERACIÓN DE ALERTAS
// -------------------------------------------------------------------------------------------------

// --- Mapa de Puntos Críticos de Degradación (Hotspots) ---
var delta_fhi = fhi_periodo_1.subtract(fhi_periodo_2).rename('Delta_FHI');
var hotspots = delta_fhi.updateMask(delta_fhi.gt(0.2)); // Umbral de cambio significativo

// --- Sistema de Alerta Temprana (Análisis últimos 12 meses) ---
var coleccion_alerta = getS2Collection(ee.Date(Date.now()).advance(-12, 'month'), ee.Date(Date.now()));
var coleccion_fhi_alerta = coleccion_alerta.map(function(img) {
  return calcularFHI(img, W).lt(W.umbral_alerta_fhi);
});

// Sumar los meses consecutivos que están por debajo del umbral.
var alertas_deforestacion = ee.ImageCollection(coleccion_fhi_alerta).sum();
var mascara_alerta = alertas_deforestacion.gte(W.meses_alerta);

// -------------------------------------------------------------------------------------------------
// PASO 5: VISUALIZACIÓN Y EXPORTACIÓN
// -------------------------------------------------------------------------------------------------

var paleta_fhi = ['#d7191c', '#fdae61', '#ffffbf', '#abdda4', '#2b83ba']; // Rojo a Azul
var paleta_hotspots = ['#ffffb2', '#fecc5c', '#fd8d3c', '#f03b20', '#bd0026']; // Amarillo a Rojo

Map.addLayer(fhi_periodo_2, {min: 0, max: 1, palette: paleta_fhi}, 'Salud Forestal Actual (FHI)', false);
Map.addLayer(hotspots, {min: 0.2, max: 0.5, palette: paleta_hotspots}, 'Puntos Críticos de Degradación (2018-2025)');
Map.addLayer(mascara_alerta.selfMask(), {palette: '#FF00FF'}, 'ALERTAS DE DEFORESTACIÓN (Últimos Meses)');

var folder_export = 'Super_Cussen_Amazonia';

Export.image.toDrive({
  image: delta_fhi.toFloat(),
  description: 'Amazonia_Delta_FHI_2018_2025',
  folder: folder_export,
  region: config.aoi,
  scale: config.resolucion,
  maxPixels: 1e13
});

Export.image.toDrive({
  image: mascara_alerta.toByte(),
  description: 'Amazonia_Alertas_Deforestacion_Actuales',
  folder: folder_export,
  region: config.aoi,
  scale: config.resolucion,
  maxPixels: 1e13
});

print('✅ Proceso completado. El script de monitoreo forestal para Amazonia está listo.');
print('➡️ Revise las capas en el mapa y la pestaña "Tasks" para ejecutar las exportaciones.');

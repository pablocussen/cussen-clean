
/**
 * SCRIPT DE MONITOREO AGRÍCOLA AVANZADO PARA GOOGLE EARTH ENGINE (GEE)
 *
 * Proyecto: WalterLand
 * Autor: Gemini
 * Fecha: 2025-09-10
 *
 * Descripción:
 * Este script está diseñado para el monitoreo continuo de un predio agrícola
 * utilizando imágenes de la constelación Sentinel-2. Permite analizar la
 * evolución de la salud de la vegetación (NDVI) y la disponibilidad de agua
 * (NDWI) a lo largo del tiempo. Es una herramienta escalable y replicable
 * para la agricultura de precisión.
 *
 * Instrucciones de Uso:
 * 1. Copie y pegue este script en el Editor de Código de Google Earth Engine.
 * 2. Ajuste el RANGO_DE_FECHAS si desea analizar un período diferente.
 * 3. Haga clic en "Run" para ejecutar el análisis. El polígono del predio
 *    ya está definido en el script.
 * 4. Para exportar los datos y las imágenes, vaya a la pestaña "Tasks" (Tareas)
 *    en el panel derecho de GEE y haga clic en "Run" para cada tarea de exportación.
 *
 * Qué hace el script:
 * - Carga y filtra la colección de imágenes Sentinel-2 para la región y fechas de interés.
 * - Aplica una máscara de nubes para limpiar los datos.
 * - Calcula los índices NDVI y NDWI para cada imagen.
 * - Genera un gráfico interactivo de la evolución de NDVI y NDWI en el tiempo.
 * - Muestra en el mapa las capas de la imagen más reciente en color verdadero, NDVI y NDWI.
 * - Calcula y muestra estadísticas (media, mínimo, máximo) para el último NDVI.
 * - **Exporta** los datos de series de tiempo y las imágenes (color verdadero, NDVI, NDWI)
 *   a su Google Drive para informes detallados.
 */

// =================================================================================
// 1. CONFIGURACIÓN DEL ANÁLISIS
// =================================================================================

// Define la Región de Interés (ROI) usando las coordenadas proporcionadas.
var roi = ee.Geometry.Polygon(
  [[[-71.60569485221636, -36.05333862054947],
    [-71.61003345170579, -36.07116571393859],
    [-71.60598343693862, -36.07625886795342],
    [-71.59208860318476, -36.06816859491027],
    [-71.60569485221636, -36.05333862054947]]]);

// Define el rango de fechas para el análisis (desde el inicio de Sentinel-2).
var RANGO_DE_FECHAS = {
  inicio: '2017-01-01',
  fin: ee.Date(Date.now()).format('YYYY-MM-dd') // Fecha actual dinámica
};

// Define los parámetros de visualización para las capas del mapa.
var PALETA_NDVI = 'FFFFFF, CE7E45, DF923D, F1B555, FCD163, 99B718, 74A901, 66A000, 529400, 3E8601, 207401, 056201, 004C00, 023B01, 012E01, 011D01, 011301';
var VIZ_COLOR_VERDADERO = { bands: ['B4', 'B3', 'B2'], min: 0, max: 3000 };
var VIZ_NDVI = { min: -0.2, max: 1, palette: PALETA_NDVI };
var VIZ_NDWI = { min: -1, max: 1, palette: ['red', 'yellow', 'green', 'cyan', 'blue'] };


// =================================================================================
// 2. FUNCIONES DE PROCESAMIENTO
// =================================================================================

/**
 * Función para enmascarar nubes en imágenes Sentinel-2 (Level-2A).
 * Utiliza la banda de Clasificación de Escena (SCL).
 * @param {ee.Image} image - La imagen de entrada.
 * @return {ee.Image} - La imagen sin nubes.
 */
function enmascararNubes(image) {
  var scl = image.select('SCL'); // Select the Scene Classification Layer band

  // These are the pixel values for clouds and cloud shadows in the SCL band.
  // 3: Cloud shadows
  // 8: Clouds medium probability
  // 9: Clouds high probability
  // 10: Cirrus
  var cloudShadows = scl.eq(3);
  var clouds = scl.eq(8).or(scl.eq(9)).or(scl.eq(10));

  // Combine masks
  var mask = cloudShadows.not().and(clouds.not());

  return image.updateMask(mask).divide(10000);
}

/**
 * Función para calcular el índice NDVI.
 * NDVI = (NIR - Red) / (NIR + Red)
 * @param {ee.Image} image - La imagen de entrada (bandas B8 y B4).
 * @return {ee.Image} - La imagen con la nueva banda 'ndvi'.
 */
function calcularNDVI(image) {
  var ndvi = image.normalizedDifference(['B8', 'B4']).rename('ndvi');
  return image.addBands(ndvi);
}

/**
 * Función para calcular el índice NDWI (McFeeters).
 * NDWI = (Green - NIR) / (Green + NIR)
 * @param {ee.Image} image - La imagen de entrada (bandas B3 y B8).
 * @return {ee.Image} - La imagen con la nueva banda 'ndwi'.
 */
function calcularNDWI(image) {
  var ndwi = image.normalizedDifference(['B3', 'B8']).rename('ndwi');
  return image.addBands(ndwi);
}


// =================================================================================
// 3. CARGA Y PROCESAMIENTO DE DATOS
// =================================================================================

// Carga la colección de imágenes Sentinel-2.
var coleccion = ee.ImageCollection('COPERNICUS/S2_SR')
    .filterBounds(roi)
    .filterDate(RANGO_DE_FECHAS.inicio, RANGO_DE_FECHAS.fin)
    // Filtra por cobertura de nubes (menos del 20% es un buen comienzo).
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
    // Aplica todas las funciones de procesamiento.
    .map(enmascararNubes)
    .map(calcularNDVI)
    .map(calcularNDWI);

// Selecciona solo las bandas de interés para el análisis.
var coleccionIndices = coleccion.select(['ndvi', 'ndwi']);


// =================================================================================
// 4. GENERACIÓN DE GRÁFICOS Y ESTADÍSTICAS
// =================================================================================

// Crea un gráfico de series de tiempo para NDVI y NDWI.
var graficoEvolucion = ui.Chart.image.series({
  imageCollection: coleccionIndices,
  region: roi,
  reducer: ee.Reducer.mean(),
  scale: 10, // Escala en metros para Sentinel-2
  xProperty: 'system:time_start'
}).setOptions({
  title: 'Evolución de NDVI y NDWI en WalterLand',
  vAxis: {title: 'Valor del Índice'},
  hAxis: {title: 'Fecha'},
  lineWidth: 1.5,
  pointSize: 3,
  series: {
    0: {color: '#2E8B57'}, // NDVI en verde
    1: {color: '#1E90FF'}  // NDWI en azul
  }
});

// Imprime el gráfico en la consola.
print('Gráfico de Evolución Temporal:', graficoEvolucion);

// Obtiene la imagen más reciente de la colección.
var imagenReciente = ee.Image(coleccion.sort('system:time_start', false).first());

// Calcula estadísticas de NDVI para la imagen más reciente.
var estadisticasNDVI = imagenReciente.select('ndvi').reduceRegion({
  reducer: ee.Reducer.minMax().combine({
    reducer2: ee.Reducer.mean(),
    sharedInputs: true
  }),
  geometry: roi,
  scale: 10,
  maxPixels: 1e9
});

// Imprime las estadísticas en la consola.
print('Estadísticas de NDVI para la última imagen disponible:', estadisticasNDVI);


// =================================================================================
// 5. VISUALIZACIÓN EN EL MAPA
// =================================================================================

// Centra el mapa en la región de interés.
Map.centerObject(roi, 14);

// Añade las capas al mapa.
Map.addLayer(imagenReciente.clip(roi), VIZ_COLOR_VERDADERO, 'Imagen Reciente (Color Verdadero)');
Map.addLayer(imagenReciente.select('ndvi').clip(roi), VIZ_NDVI, 'NDVI Reciente');
Map.addLayer(imagenReciente.select('ndwi').clip(roi), VIZ_NDWI, 'NDWI Reciente');

// Añade el polígono del predio al mapa para referencia.
Map.addLayer(ee.Image().paint(roi, 0, 2), {palette: 'yellow'}, 'Límite del Predio (WalterLand)');

// =================================================================================
// 6. EXPORTACIÓN DE DATOS Y RESULTADOS
// =================================================================================

// Exportar datos de series de tiempo para NDVI y NDWI a Google Drive.
var timeSeriesExport = coleccionIndices.map(function(image) {
  var date = image.date().format('YYYY-MM-dd');
  var stats = image.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: roi,
    scale: 10,
    maxPixels: 1e9
  });
  return ee.Feature(null, stats).set('date', date);
});

Export.table.toDrive({
  collection: timeSeriesExport,
  description: 'WalterLand_TimeSeries_Data',
  folder: 'GEE_Exports_WalterLand',
  fileNamePrefix: 'WalterLand_TimeSeries_Data',
  fileFormat: 'CSV'
});

// Exportar la última imagen de color verdadero a Google Drive.
Export.image.toDrive({
  image: imagenReciente.clip(roi).select(['B4', 'B3', 'B2']),
  description: 'WalterLand_TrueColor_Latest',
  folder: 'GEE_Exports_WalterLand',
  fileNamePrefix: 'WalterLand_TrueColor_Latest',
  scale: 10,
  region: roi
});

// Exportar la última imagen NDVI a Google Drive.
Export.image.toDrive({
  image: imagenReciente.clip(roi).select('ndvi'),
  description: 'WalterLand_NDVI_Latest',
  folder: 'GEE_Exports_WalterLand',
  fileNamePrefix: 'WalterLand_NDVI_Latest',
  scale: 10,
  region: roi,
  maxPixels: 1e9
});

// Exportar la última imagen NDWI a Google Drive.
Export.image.toDrive({
  image: imagenReciente.clip(roi).select('ndwi'),
  description: 'WalterLand_NDWI_Latest',
  folder: 'GEE_Exports_WalterLand',
  fileNamePrefix: 'WalterLand_NDWI_Latest',
  scale: 10,
  region: roi,
  maxPixels: 1e9
});

// =================================================================================
// FIN DEL SCRIPT
// =================================================================================

// =================================================================================================
// FRAMEWORK DE DETECCIÓN DE ESPECIES INVASORAS - SUPER ÍNDICE CUSSEN v2.0
//
// PROYECTO DE APLICACIÓN: Mapeo Regional de Ulex Europaeus
// TIPO DE ANÁLISIS: CUSSEN-EspecieInvasora (Modelo Random Forest)
// AUTOR: GCasist (Optimizador IA para Cussen.cl)
// FECHA: 07 de Septiembre de 2025
// =================================================================================================

// -------------------------------------------------------------------------------------------------
// PASO 1: CONFIGURACIÓN Y DATOS DE ENTRENAMIENTO PARA IA
// -------------------------------------------------------------------------------------------------

var config = {
  region: ee.Geometry.Rectangle([-74.5, -43.5, -71.6, -39.5]), // Región de Los Lagos
  fecha_inicio: '2024-08-01', // Época de floración del Ulex
  fecha_fin: '2024-12-31',
  resolucion: 10,
  filtro_nubes: 20
};

// Puntos de entrenamiento para el clasificador. En un caso real, esto vendría de datos de campo.
// 1 = Ulex, 0 = No Ulex (Bosque, Pastizal, etc.)
var puntos_entrenamiento = ee.FeatureCollection([
  // Puntos Ulex (basados en la firma espectral del script original)
  ee.Feature(ee.Geometry.Point([-73.0, -41.1]), {class: 1}),
  ee.Feature(ee.Geometry.Point([-72.9, -41.3]), {class: 1}),
  ee.Feature(ee.Geometry.Point([-73.2, -41.5]), {class: 1}),
  // Puntos No-Ulex (Bosque Nativo Denso)
  ee.Feature(ee.Geometry.Point([-72.5, -41.8]), {class: 0}),
  ee.Feature(ee.Geometry.Point([-72.2, -42.2]), {class: 0}),
  // Puntos No-Ulex (Pastizales)
  ee.Feature(ee.Geometry.Point([-73.1, -40.8]), {class: 0}),
  ee.Feature(ee.Geometry.Point([-73.3, -41.0]), {class: 0})
]);

Map.centerObject(config.region, 8);

// -------------------------------------------------------------------------------------------------
// PASO 2: PROCESAMIENTO DE IMÁGENES Y CÁLCULO DE ÍNDICES
// -------------------------------------------------------------------------------------------------

var s2_collection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterBounds(config.region)
    .filterDate(config.fecha_inicio, config.fecha_fin)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', config.filtro_nubes));

var composite = s2_collection.median().clip(config.region);

function calcularIndices(img) {
  var ndvi = img.normalizedDifference(['B8', 'B4']).rename('NDVI');
  var savi = img.expression('1.5 * (NIR - RED) / (NIR + RED + 0.5)', {'NIR': img.select('B8'), 'RED': img.select('B4')}).rename('SAVI');
  var ndmi = img.normalizedDifference(['B8', 'B11']).rename('NDMI');
  var nbr2 = img.normalizedDifference(['B11', 'B12']).rename('NBR2');
  var yfi = img.normalizedDifference(['B3', 'B2']).rename('YFI'); // Yellow Flower Index
  var ndre = img.normalizedDifference(['B8', 'B5']).rename('NDRE');
  return img.addBands([ndvi, savi, ndmi, nbr2, yfi, ndre]);
}

var imagen_con_indices = calcularIndices(composite);
var bandas_clasificador = ['NDVI', 'SAVI', 'NDMI', 'NBR2', 'YFI', 'NDRE'];

// -------------------------------------------------------------------------------------------------
// PASO 3: ENTRENAMIENTO Y APLICACIÓN DEL MODELO RANDOM FOREST
// -------------------------------------------------------------------------------------------------

// Extraer los valores de los índices en los puntos de entrenamiento.
var datos_entrenamiento = imagen_con_indices.select(bandas_clasificador).sampleRegions({
  collection: puntos_entrenamiento,
  properties: ['class'],
  scale: config.resolucion
});

// Entrenar el clasificador Random Forest.
var clasificador_rf = ee.Classifier.smileRandomForest(10) // 10 árboles
    .train({
      features: datos_entrenamiento,
      classProperty: 'class',
      inputProperties: bandas_clasificador
    });

// Clasificar la imagen completa para obtener la probabilidad de Ulex.
var resultado_clasificacion = imagen_con_indices.classify(clasificador_rf.setOutputMode('PROBABILITY'));
var ulex_probabilidad = resultado_clasificacion.rename('Ulex_Probabilidad');

// -------------------------------------------------------------------------------------------------
// PASO 4: ANÁLISIS DE BIOMASA Y RIESGO BASADO EN PROBABILIDAD
// -------------------------------------------------------------------------------------------------

// Crear una máscara de Ulex donde la probabilidad es alta (> 50%).
var mascara_ulex = ulex_probabilidad.gt(0.5);

// Modelo de Biomasa (ton/ha) - se aplica solo donde hay Ulex.
var biomasa = imagen_con_indices.expression('0.45 * exp(2.8 * NDVI)', {'NDVI': imagen_con_indices.select('NDVI')})
    .updateMask(mascara_ulex).rename('Biomasa_ton_ha');

// Modelo de Riesgo de Incendio (Biomasa + Pendiente).
var srtm = ee.Image('USGS/SRTMGL1_003');
var pendiente = ee.Terrain.slope(srtm);
var riesgo_incendio = biomasa.unitScale(0, 6).multiply(0.6).add(pendiente.unitScale(0, 45).multiply(0.4));

// -------------------------------------------------------------------------------------------------
// PASO 5: VISUALIZACIÓN Y EXPORTACIÓN
// -------------------------------------------------------------------------------------------------

var paleta_probabilidad = ['#ffffff', '#ffffbe', '#ffce4b', '#ff8e0d', '#d73027']; // Blanco a Rojo
var paleta_riesgo = ['#2b83ba', '#abdda4', '#ffffbf', '#fdae61', '#d7191c']; // Azul -> Verde -> Amarillo -> Rojo

Map.addLayer(composite, {bands: ['B4', 'B3', 'B2'], min: 0, max: 0.2}, 'RGB Natural', false);
Map.addLayer(ulex_probabilidad, {min: 0, max: 1, palette: paleta_probabilidad}, 'PROBABILIDAD DE ULEX (CUSSEN v2.0)', true);
Map.addLayer(riesgo_incendio.updateMask(mascara_ulex), {min: 0, max: 1, palette: paleta_riesgo}, 'Riesgo de Incendio (Ulex)', false);

var folder_export = 'Super_Cussen_Ulex';

Export.image.toDrive({
  image: ulex_probabilidad.toFloat(),
  description: 'Ulex_Probabilidad_RF_v2',
  folder: folder_export,
  region: config.region,
  scale: config.resolucion,
  maxPixels: 1e13
});

Export.image.toDrive({
  image: riesgo_incendio.toFloat(),
  description: 'Ulex_RiesgoIncendio_v2',
  folder: folder_export,
  region: config.region,
  scale: config.resolucion,
  maxPixels: 1e13
});

print('✅ Proceso completado. El script de mapeo regional de Ulex está listo.');
print('➡️ Revise las capas en el mapa y la pestaña "Tasks" para ejecutar las exportaciones.');

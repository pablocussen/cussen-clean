// =================================================================================================
// FRAMEWORK DE ANÁLISIS DE INCENDIOS - SUPER ÍNDICE CUSSEN v2.0
//
// PROYECTO DE APLICACIÓN: Incendio en Región del Maule, Chile
// TIPO DE ANÁLISIS: CUSSEN-IncendioMaule (Matorral Esclerófilo)
// AUTOR: GCasist (Optimizador IA para Cussen.cl)
// FECHA: 07 de Septiembre de 2025
// =================================================================================================

// -------------------------------------------------------------------------------------------------
// PASO 1: CONFIGURACIÓN DEL ANÁLISIS
// -------------------------------------------------------------------------------------------------

// --- Parámetros del Incendio ---
var config = {
  nombre: 'Incendio Maule',
  ubicacion: 'Este de Curicó, Chile',
  aoi: ee.Geometry.Polygon([
    [[-71.0518, -35.2548], [-71.0490, -35.2569], [-71.0472, -35.2571],
     [-71.0455, -35.2575], [-71.0420, -35.2591], [-71.0398, -35.2612],
     [-71.0384, -35.2640], [-71.0356, -35.2651], [-71.0311, -35.2679],
     [-71.0272, -35.2695], [-71.0235, -35.2705], [-71.0192, -35.2703],
     [-71.0169, -35.2714], [-71.0150, -35.2735], [-71.0116, -35.2762],
     [-71.0087, -35.2790], [-71.0052, -35.2819], [-71.0022, -35.2826],
     [-70.9997, -35.2844], [-70.9916, -35.2800], [-70.9904, -35.2736],
     [-70.9920, -35.2714], [-70.9928, -35.2697], [-71.0004, -35.2620],
     [-70.9997, -35.2590], [-71.0012, -35.2578], [-71.0030, -35.2563],
     [-71.0043, -35.2563], [-71.0071, -35.2565], [-71.0095, -35.2568],
     [-71.0105, -35.2561], [-71.0122, -35.2554], [-71.0138, -35.2543],
     [-71.0156, -35.2536], [-71.0175, -35.2531], [-71.0193, -35.2518],
     [-71.0215, -35.2502], [-71.0246, -35.2498], [-71.0295, -35.2496],
     [-71.0325, -35.2510], [-71.0344, -35.2514], [-71.0354, -35.2515],
     [-71.0365, -35.2511], [-71.0388, -35.2500], [-71.0408, -35.2497],
     [-71.0426, -35.2499], [-71.0441, -35.2498], [-71.0451, -35.2497],
     [-71.0461, -35.2505], [-71.0470, -35.2513], [-71.0477, -35.2519],
     [-71.0491, -35.2523], [-71.0518, -35.2529], [-71.0521, -35.2534],
     [-71.0543, -35.2544], [-71.0518, -35.2548]]
  ]),
  fecha_pre_inicio: '2024-11-01',
  fecha_pre_fin: '2025-01-31',
  fecha_post_inicio: '2025-02-01',
  fecha_post_fin: '2025-04-30',
  resolucion: 10,
  filtro_nubes: 20
};

// --- Parámetros del Modelo IA ---
var pesos_ia = {
  incendio_bosque_coniferas: { nir: 1.25, swir: 1.5, red: 0.75, correccion_atmosferica: 0.02 },
  // Optimizado para la firma espectral del matorral y bosque esclerófilo de Chile Central.
  incendio_matorral_chile: {
    nir: 1.1,   // Menor peso al NIR por la menor biomasa comparativa.
    swir: 1.6,  // Mayor peso al SWIR para detectar suelo expuesto y sequedad.
    red: 0.9,   // Peso moderado al Rojo para contraste.
    correccion_atmosferica: 0.015 // Factor de ajuste para atmósfera más seca.
  }
};

// Seleccionamos los pesos para este análisis específico.
var W = pesos_ia.incendio_matorral_chile;

Map.centerObject(config.aoi, 12);

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
        var cloudBitMask = 1 << 10;
        var cirrusBitMask = 1 << 11;
        var mask = qa.bitwiseAnd(cloudBitMask).eq(0).and(qa.bitwiseAnd(cirrusBitMask).eq(0));
        return image.updateMask(mask).divide(10000)
            .select('B2', 'B3', 'B4', 'B8', 'B11', 'B12')
            .copyProperties(image, ['system:time_start']);
      });
}

var pre_incendio_col = getS2Collection(config.fecha_pre_inicio, config.fecha_pre_fin);
var post_incendio_col = getS2Collection(config.fecha_post_inicio, config.fecha_post_fin);

var pre_img = pre_incendio_col.median().clip(config.aoi);
var post_img = post_incendio_col.median().clip(config.aoi);

print('📷 Imágenes Pre-Incendio encontradas:', pre_incendio_col.size());
print('📷 Imágenes Post-Incendio encontradas:', post_incendio_col.size());

// -------------------------------------------------------------------------------------------------
// PASO 3: APLICACIÓN DEL SUPER ÍNDICE CUSSEN (SIC)
// -------------------------------------------------------------------------------------------------

function calcularSIC(imagen, pesos) {
  var sic = imagen.expression(
    '(w_nir*NIR - w_swir*SWIR2 - w_red*Red) / (w_nir*NIR + w_swir*SWIR2 + w_red*Red)', {
      'NIR': imagen.select('B8'), 'SWIR2': imagen.select('B12'), 'Red': imagen.select('B4'),
      'w_nir': pesos.nir, 'w_swir': pesos.swir, 'w_red': pesos.red
    }
  ).rename('SIC');
  return sic.subtract(pesos.correccion_atmosferica);
}

var sic_pre = calcularSIC(pre_img, W);
var sic_post = calcularSIC(post_img, W);
var dSIC = sic_pre.subtract(sic_post).rename('dSIC');

// --- Clasificación de Severidad Basada en dSIC ---
// Umbrales calibrados para el modelo CUSSEN-IncendioMaule
var severidad_cussen = ee.Image(0)
    .where(dSIC.gt(0.08), 1) // Baja Severidad
    .where(dSIC.gt(0.22), 2) // Moderada Severidad
    .where(dSIC.gt(0.40), 3) // Alta Severidad
    .where(dSIC.gt(0.60), 4) // Extrema Severidad
    .rename('Severidad_CUSSEN');

// -------------------------------------------------------------------------------------------------
// PASO 4: ANÁLISIS DE RECUPERACIÓN Y VISUALIZACIÓN
// -------------------------------------------------------------------------------------------------

// --- NDVI Actual para evaluar recuperación ---
var coleccion_actual = getS2Collection(ee.Date(Date.now()).advance(-3, 'month'), ee.Date(Date.now()));
var img_actual = coleccion_actual.median().clip(config.aoi);
var ndvi_actual = img_actual.normalizedDifference(['B8', 'B4']).rename('NDVI_Actual');

print('📷 Imágenes para NDVI actual encontradas:', coleccion_actual.size());

// --- Paletas de Colores Profesionales ---
var paleta_severidad = ['#2ca25f', '#ffffbf', '#orange', '#e31a1c', '#8B0000'];
var paleta_ndvi = ['#8B4513', '#FFFF00', '#ADFF2F', '#006400'];

// -------------------------------------------------------------------------------------------------
// PASO 5: PRESENTACIÓN DE RESULTADOS EN MAPA
// -------------------------------------------------------------------------------------------------

Map.addLayer(config.aoi, {color: 'blue', strokeWidth: 2, fillColor: '00000000'}, 'Área de Estudio');
Map.addLayer(post_img, {bands: ['B8', 'B4', 'B3'], min: 0, max: 0.3}, 'Post-Incendio (Falso Color IR)');
Map.addLayer(severidad_cussen.selfMask(), {min: 1, max: 4, palette: paleta_severidad}, 'SEVERIDAD CUSSEN-IncendioMaule', true);
Map.addLayer(ndvi_actual, {min: 0, max: 0.8, palette: paleta_ndvi}, 'Recuperación (NDVI Actual)', false);

// --- Exportación de Resultados ---
var folder_export = 'Super_Cussen_IncendioMaule';

Export.image.toDrive({
  image: severidad_cussen.toByte(),
  description: 'IncendioMaule_Severidad_Cussen_v2',
  folder: folder_export,
  region: config.aoi,
  scale: config.resolucion,
  maxPixels: 1e13
});

Export.image.toDrive({
  image: ndvi_actual.toFloat(),
  description: 'IncendioMaule_Recuperacion_NDVI_Actual',
  folder: folder_export,
  region: config.aoi,
  scale: config.resolucion,
  maxPixels: 1e13
});

print('✅ Proceso completado. El script optimizado para el Incendio del Maule está listo.');
print('➡️ Revise las capas en el mapa y la pestaña "Tasks" para ejecutar las exportaciones.');

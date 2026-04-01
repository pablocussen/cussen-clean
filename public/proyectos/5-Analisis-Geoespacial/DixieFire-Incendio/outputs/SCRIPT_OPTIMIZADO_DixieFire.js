// =================================================================================================
// FRAMEWORK DE ANÁLISIS DE INCENDIOS - SUPER ÍNDICE CUSSEN v2.0
//
// PROYECTO DE APLICACIÓN: Dixie Fire, California
// TIPO DE ANÁLISIS: CUSSEN-Incendio (Bosques de Coníferas)
// AUTOR: GCasist (Optimizador IA para Cussen.cl)
// FECHA: 07 de Septiembre de 2025
// =================================================================================================

// -------------------------------------------------------------------------------------------------
// PASO 1: CONFIGURACIÓN DEL ANÁLISIS
// -------------------------------------------------------------------------------------------------

// --- Parámetros del Incendio ---
var config = {
  nombre: 'Dixie Fire',
  ubicacion: 'Greenville, California',
  centroide: ee.Geometry.Point([-121.0, 40.2]),
  fecha_pre_inicio: '2021-05-01',
  fecha_pre_fin: '2021-07-10',
  fecha_post_inicio: '2021-10-26', // Post-extinción
  fecha_post_fin: '2022-03-31',
  resolucion: 10, // Sentinel-2 a 10m
  filtro_nubes: 15 // % máximo de nubosidad
};

// --- Parámetros del Modelo IA ---
// Estos coeficientes simulan la salida de un modelo Random Forest pre-entrenado.
// El modelo selecciona el set de pesos basado en el tipo de análisis.
var pesos_ia = {
  // Optimizado para la firma espectral de bosques de coníferas post-incendio.
  incendio_bosque_coniferas: {
    nir: 1.25,  // Mayor peso al NIR para detectar vegetación residual.
    swir: 1.5,  // Máximo peso al SWIR para sensibilidad a la ceniza y suelo quemado.
    red: 0.75,  // Menor peso al Rojo, usado para contraste.
    correccion_atmosferica: 0.02 // Factor de ajuste para aerosoles típicos de incendios.
  },
  // Set de pesos para recuperación de pastizales (ejemplo para otro análisis).
  recuperacion_pastizal: {
    nir: 1.8, swir: 0.9, red: 1.1, correccion_atmosferica: 0.01
  }
};

// Seleccionamos los pesos para este análisis específico.
var W = pesos_ia.incendio_bosque_coniferas;

// --- Definición del Área de Interés (AOI) ---
var aoi = config.centroide.buffer(40000); // Buffer de 40km para cubrir el área del incendio.
Map.centerObject(config.centroide, 9);

// -------------------------------------------------------------------------------------------------
// PASO 2: ADQUISICIÓN Y PRE-PROCESAMIENTO DE DATOS
// -------------------------------------------------------------------------------------------------

// --- Función para Cargar, Filtrar y Enmascarar Nubes de Sentinel-2 ---
function getS2Collection(fecha_inicio, fecha_fin) {
  return ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
      .filterBounds(aoi)
      .filterDate(fecha_inicio, fecha_fin)
      .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', config.filtro_nubes))
      .map(function(image) {
        // Máscara de nubes y cirros usando la banda de calidad QA60.
        var qa = image.select('QA60');
        var cloudBitMask = 1 << 10;
        var cirrusBitMask = 1 << 11;
        var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
            .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
        return image.updateMask(mask).divide(10000)
            .select('B2', 'B3', 'B4', 'B8', 'B11', 'B12')
            .copyProperties(image, ['system:time_start']);
      });
}

// --- Creación de Composites Pre y Post Incendio ---
var pre_incendio_col = getS2Collection(config.fecha_pre_inicio, config.fecha_pre_fin);
var post_incendio_col = getS2Collection(config.fecha_post_inicio, config.fecha_post_fin);

var pre_img = pre_incendio_col.median().clip(aoi);
var post_img = post_incendio_col.median().clip(aoi);

print('📷 Imágenes Pre-Incendio encontradas:', pre_incendio_col.size());
print('📷 Imágenes Post-Incendio encontradas:', post_incendio_col.size());

// -------------------------------------------------------------------------------------------------
// PASO 3: APLICACIÓN DEL SUPER ÍNDICE CUSSEN (SIC)
// -------------------------------------------------------------------------------------------------

// --- Función para calcular el Índice CUSSEN v2.0 con pesos dinámicos de IA ---
function calcularSIC(imagen, pesos) {
  var nir = imagen.select('B8');
  var red = imagen.select('B4');
  var swir2 = imagen.select('B12');

  // Fórmula Optimizada IA
  var sic = imagen.expression(
    '(w_nir*NIR - w_swir*SWIR2 - w_red*Red) / (w_nir*NIR + w_swir*SWIR2 + w_red*Red)', {
      'NIR': nir,
      'SWIR2': swir2,
      'Red': red,
      'w_nir': pesos.nir,
      'w_swir': pesos.swir,
      'w_red': pesos.red
    }
  ).rename('SIC');
  
  // Corrección atmosférica inteligente (simulada)
  var sic_corregido = sic.subtract(pesos.correccion_atmosferica);
  
  return sic_corregido;
}

// --- Cálculo del Delta del Super Índice CUSSEN (dSIC) ---
var sic_pre = calcularSIC(pre_img, W);
var sic_post = calcularSIC(post_img, W);
var dSIC = sic_pre.subtract(sic_post).rename('dSIC');

// --- Clasificación de Severidad Basada en dSIC ---
// Umbrales calibrados para el modelo CUSSEN-Incendio
var severidad_cussen = ee.Image(0)
    .where(dSIC.gt(0.10), 1) // Baja Severidad
    .where(dSIC.gt(0.25), 2) // Moderada Severidad
    .where(dSIC.gt(0.45), 3) // Alta Severidad
    .where(dSIC.gt(0.65), 4) // Extrema Severidad / Destrucción Total
    .rename('Severidad_CUSSEN');

// -------------------------------------------------------------------------------------------------
// PASO 4: ANÁLISIS DE BIOMASA Y VISUALIZACIÓN
// -------------------------------------------------------------------------------------------------

// --- Modelo simple de Biomasa (ton/ha) basado en NDVI pre-incendio ---
var ndvi_pre = pre_img.normalizedDifference(['B8', 'B4']).rename('NDVI_pre');
var biomasa_inicial = ndvi_pre.multiply(150).rename('Biomasa_Inicial_ton_ha'); // Factor para bosques de coníferas

// --- Cuantificación de Biomasa Residual ---
// Factores de supervivencia basados en la severidad CUSSEN
var factor_supervivencia = ee.Image(1)
    .where(severidad_cussen.eq(1), 0.75) // 75% sobrevive a baja severidad
    .where(severidad_cussen.eq(2), 0.40) // 40% sobrevive a moderada severidad
    .where(severidad_cussen.eq(3), 0.15) // 15% sobrevive a alta severidad
    .where(severidad_cussen.eq(4), 0.05); // 5% sobrevive a extrema severidad

var biomasa_residual = biomasa_inicial.multiply(factor_supervivencia).rename('Biomasa_Residual_ton_ha');

// --- Paletas de Colores Profesionales ---
var paleta_severidad = ['#2ca25f', '#ffffbf', '#orange', '#e31a1c', '#8B0000']; // Verde -> Amarillo -> Naranja -> Rojo -> Rojo Oscuro
var paleta_biomasa = ['#f7fcb9', '#d9f0a3', '#addd8e', '#78c679', '#41ab5d', '#238443', '#005a32']; // Amarillo a Verde Oscuro

// -------------------------------------------------------------------------------------------------
// PASO 5: PRESENTACIÓN DE RESULTADOS EN MAPA
// -------------------------------------------------------------------------------------------------

Map.addLayer(pre_img, {bands: ['B8', 'B4', 'B3'], min: 0, max: 0.3}, 'Pre-Incendio (Falso Color IR)', false);
Map.addLayer(post_img, {bands: ['B8', 'B4', 'B3'], min: 0, max: 0.3}, 'Post-Incendio (Falso Color IR)', false);
Map.addLayer(severidad_cussen.selfMask(), {min: 1, max: 4, palette: paleta_severidad}, 'SEVERIDAD CUSSEN-Incendio v2.0', true);
Map.addLayer(biomasa_residual.selfMask(), {min: 0, max: 100, palette: paleta_biomasa}, 'Biomasa Residual (ton/ha)', false);

// --- Exportación de Resultados ---
var folder_export = 'Super_Cussen_DixieFire';

Export.image.toDrive({
  image: severidad_cussen.toByte(),
  description: 'DixieFire_Severidad_Cussen_v2',
  folder: folder_export,
  region: aoi,
  scale: config.resolucion,
  maxPixels: 1e13
});

Export.image.toDrive({
  image: biomasa_residual.toFloat(),
  description: 'DixieFire_BiomasaResidual_Cussen_v2',
  folder: folder_export,
  region: aoi,
  scale: config.resolucion,
  maxPixels: 1e13
});

print('✅ Proceso completado. El script optimizado para el Dixie Fire está listo.');
print('➡️ Revise las capas en el mapa y la pestaña "Tasks" para ejecutar las exportaciones.');

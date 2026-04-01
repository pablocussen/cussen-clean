/* ============================================================
   SBAP Monitor — v3.2
   Cussen SpA · pablo@cussen.cl
   Backend API (GEE service account) + NASA GIBS fallback
   No user authentication required.
   ============================================================ */

'use strict';

// ============================================================
// CONFIG
// ============================================================
const SBAP_API = 'https://sbap-api-1096806226647.southamerica-west1.run.app';

// NASA GIBS WMTS (free, no auth, real MODIS satellite data)
const GIBS = {
  trueColor: 'MODIS_Terra_CorrectedReflectance_TrueColor',
  falseColor: 'MODIS_Terra_CorrectedReflectance_Bands721',
  ndvi:       'MODIS_Terra_NDVI_8Day',
};

// ============================================================
// SITES DATA
// ============================================================
const SITES = {
  // ── 16 Santuarios de la Naturaleza ─────────────────────────
  bosque_fosil: {
    id:        'bosque_fosil',
    name:      'Bosque Fósil Punta Pelluco',
    type:      'Santuario de la Naturaleza · Forestal',
    ecosystem: 'forest',
    desc:      'Sitio paleobotánico con 111 troncos fósiles de alerce de ~50.000 años, visibles en la zona intermareal entre Pelluco y Coihuin. Declarado SN en 1978.',
    indices:   ['NDVI','NDMI','NBR'],
    threats:   ['Erosión costera','Expansión urbana','Intervención antrópica'],
    area:      '4 ha',
    admin:     'Municipalidad de Puerto Montt',
    center:    [-72.887, -41.499],
    zoom:      17,
    bbox:      { west:-72.889, south:-41.500, east:-72.885, north:-41.497 },
    demo: { csi:48, csi_label:'Alerta', ndvi:0.42, ndmi:0.24, nbr:0.33, trend:-0.022, base_ndvi:0.48 }
  },
  katalapi: {
    id:        'katalapi',
    name:      'Parque Katalapi',
    type:      'Santuario de la Naturaleza · Forestal',
    ecosystem: 'forest',
    desc:      'Bosque siempreverde valdiviano en el estuario de Reloncaví. Estación biológica de la U. de Concepción. Educación ambiental y conservación de bosque nativo.',
    indices:   ['NDVI','NDMI','NBR'],
    threats:   ['Presión inmobiliaria','Especies invasoras','Fragmentación'],
    area:      '25 ha',
    admin:     'Fundación Katalapi',
    center:    [-72.752, -41.521],
    zoom:      16,
    bbox:      { west:-72.757, south:-41.525, east:-72.748, north:-41.518 },
    demo: { csi:74, csi_label:'Bueno', ndvi:0.68, ndmi:0.42, nbr:0.57, trend:+0.006, base_ndvi:0.66 }
  },
  cochamo: {
    id:        'cochamo',
    name:      'Valle Cochamó',
    type:      'Santuario de la Naturaleza · Forestal',
    ecosystem: 'forest',
    desc:      'Valle granítico con paredes de 1.000 m y bosque templado antiguo. Declarado SN en 2024. Parte de la Reserva de la Biosfera Bosques Templados Lluviosos.',
    indices:   ['NDVI','NDMI','NBR'],
    threats:   ['Turismo no regulado','Incendios','Ganadería en bordes'],
    area:      '11.433 ha',
    admin:     'Agrupación Amigos del Valle',
    center:    [-72.072, -41.381],
    zoom:      12,
    bbox:      { west:-72.204, south:-41.447, east:-71.973, north:-41.315 },
    demo: { csi:83, csi_label:'Excelente', ndvi:0.76, ndmi:0.48, nbr:0.66, trend:+0.012, base_ndvi:0.72 }
  },
  maullin: {
    id:        'maullin',
    name:      'Humedales Río Maullín',
    type:      'Santuario de la Naturaleza · Humedal',
    ecosystem: 'wetland',
    desc:      'Sistema de humedales desde el lago Llanquihue al Pacífico. 152 especies de aves (17 migratorias). Sitio RHRAP. Declarado SN en 2020.',
    indices:   ['NDWI','NDVI','NDMI'],
    threats:   ['Drenaje agrícola','Contaminación difusa','Expansión ganadera'],
    area:      '8.097 ha',
    admin:     'Municipalidades de Maullín, Llanquihue, P. Varas, P. Montt, Los Muermos',
    center:    [-73.375, -41.529],
    zoom:      11,
    bbox:      { west:-73.718, south:-41.705, east:-73.003, north:-41.260 },
    demo: { csi:67, csi_label:'Bueno', ndvi:0.54, ndmi:0.46, nbr:0.48, ndwi:0.38, trend:-0.009, base_ndvi:0.58 }
  },
  kaikue: {
    id:        'kaikue',
    name:      'Isla Kaikué-Lagartija',
    type:      'Santuario de la Naturaleza · Insular',
    ecosystem: 'wetland',
    desc:      'Islote en el Golfo de Ancud con la única colonia de pingüino de Magallanes del mar interior de Chiloé. 400+ adultos y 20+ especies de aves. SN desde 2017.',
    indices:   ['NDWI','NDVI','NDMI'],
    threats:   ['Presión pesquera','Especies invasoras','Erosión costera'],
    area:      '30 ha',
    admin:     'Municipalidad de Calbuco',
    center:    [-73.287, -41.811],
    zoom:      16,
    bbox:      { west:-73.290, south:-41.813, east:-73.285, north:-41.809 },
    demo: { csi:71, csi_label:'Bueno', ndvi:0.56, ndmi:0.44, nbr:0.49, ndwi:0.35, trend:+0.004, base_ndvi:0.54 }
  },
  pumalin: {
    id:        'pumalin',
    name:      'Parque Pumalín Douglas Tompkins',
    type:      'Santuario de la Naturaleza · Forestal',
    ecosystem: 'forest',
    desc:      'Bosque templado valdiviano-patagónico de escala continental. Mayor área protegida privada convertida a parque nacional. Prioridad máxima por biodiversidad.',
    indices:   ['NDVI','NDMI','NBR'],
    threats:   ['Incendios forestales','Deforestación ribereña','Presión antrópica en bordes'],
    area:      '402.392 ha',
    admin:     'SBAP Los Lagos',
    center:    [-72.496, -42.584],
    zoom:      9,
    bbox:      { west:-72.90, south:-43.20, east:-72.10, north:-42.00 },
    demo: { csi:78, csi_label:'Bueno', ndvi:0.71, ndmi:0.38, nbr:0.62, trend:+0.021, base_ndvi:0.67 }
  },
  chepu: {
    id:        'chepu',
    name:      'Humedales Cuenca Chepu',
    type:      'Santuario de la Naturaleza · Humedal',
    ecosystem: 'wetland',
    desc:      'Complejo de humedales y bosque muerto sumergido del terremoto de 1960 en el litoral NW de Chiloé. Declarado SN en 2020. Monitoreo hidrológico crítico.',
    indices:   ['NDWI','NDVI','NDMI'],
    threats:   ['Drenaje de humedales','Expansión agrícola','Cambio hidrológico'],
    area:      '2.903 ha',
    admin:     'CECPAN + Municipalidades de Ancud y Dalcahue',
    center:    [-73.970, -42.050],
    zoom:      12,
    bbox:      { west:-74.090, south:-42.130, east:-73.850, north:-41.970 },
    demo: { csi:65, csi_label:'Moderado', ndvi:0.52, ndmi:0.44, nbr:0.55, ndwi:0.31, trend:-0.015, base_ndvi:0.57 }
  },
  alerzales: {
    id:        'alerzales',
    name:      'Alerzales Fundo Potrero de Anay',
    type:      'Santuario de la Naturaleza · Forestal',
    ecosystem: 'forest',
    desc:      'Bosque milenario de alerce (Fitzroya cupressoides) en la Cordillera del Piuché, Dalcahue. Sobre 600 m de altitud. Uno de los SN más antiguos de Chile (1976).',
    indices:   ['NDVI','NDMI','NBR'],
    threats:   ['Extracción ilegal','Incendios','Cambio climático'],
    area:      '6.224 ha',
    admin:     'CONAF',
    center:    [-74.077, -42.401],
    zoom:      12,
    bbox:      { west:-74.136, south:-42.442, east:-74.007, north:-42.359 },
    demo: { csi:69, csi_label:'Bueno', ndvi:0.63, ndmi:0.39, nbr:0.54, trend:-0.005, base_ndvi:0.65 }
  },
  aucar: {
    id:        'aucar',
    name:      'Turberas de Aucar',
    type:      'Santuario de la Naturaleza · Turbera',
    ecosystem: 'peatland',
    desc:      'Turbera de Sphagnum junto al Bosque Encantado de Aucar, cerca de Quemchi. Sendero interpretativo con rana de Darwin y planta carnívora endémica. SN desde 2022.',
    indices:   ['NDWI','NDVI','NDMI'],
    threats:   ['Extracción de turba','Drenaje','Cambio climático'],
    area:      '28 ha',
    admin:     'CECPAN',
    center:    [-73.523, -42.174],
    zoom:      16,
    bbox:      { west:-73.534, south:-42.177, east:-73.517, north:-42.172 },
    demo: { csi:68, csi_label:'Bueno', ndvi:0.53, ndmi:0.48, nbr:0.46, ndwi:0.41, trend:-0.007, base_ndvi:0.56 }
  },
  pulpito: {
    id:        'pulpito',
    name:      'Turberas de Púlpito',
    type:      'Santuario de la Naturaleza · Turbera',
    ecosystem: 'peatland',
    desc:      'Mayor turbera de la Red de Turberas de Chiloé, en Chonchi. Zona de recarga de acuíferos y reservorio de agua para comunidades locales. SN desde 2021.',
    indices:   ['NDWI','NDVI','NDMI'],
    threats:   ['Extracción de turba','Drenaje agrícola','Incendios'],
    area:      '243 ha',
    admin:     'CECPAN',
    center:    [-73.834, -42.756],
    zoom:      14,
    bbox:      { west:-73.852, south:-42.766, east:-73.825, north:-42.747 },
    demo: { csi:64, csi_label:'Moderado', ndvi:0.50, ndmi:0.45, nbr:0.43, ndwi:0.39, trend:-0.010, base_ndvi:0.54 }
  },
  puntalapa: {
    id:        'puntalapa',
    name:      'Turberas de Punta Lapa',
    type:      'Santuario de la Naturaleza · Turbera',
    ecosystem: 'peatland',
    desc:      'Turbera costera de Sphagnum en Quellón, extremo sur de Chiloé. Hábitat de pudú, huillín, zorro de Chiloé y rana de Darwin. SN desde 2021.',
    indices:   ['NDWI','NDVI','NDMI'],
    threats:   ['Extracción de turba','Drenaje','Expansión urbana'],
    area:      '8 ha',
    admin:     'CECPAN',
    center:    [-73.628, -43.136],
    zoom:      17,
    bbox:      { west:-73.631, south:-43.138, east:-73.625, north:-43.135 },
    demo: { csi:70, csi_label:'Bueno', ndvi:0.55, ndmi:0.50, nbr:0.47, ndwi:0.43, trend:-0.004, base_ndvi:0.57 }
  },
  quinchao: {
    id:        'quinchao',
    name:      'Humedal Bahía de Quinchao',
    type:      'Santuario de la Naturaleza · Humedal',
    ecosystem: 'wetland',
    desc:      'Bahía interior del archipiélago de Chiloé con praderas intermareales. Sustento de comunidades costeras y hábitat de aves migratorias.',
    indices:   ['NDWI','NDVI','NDMI'],
    threats:   ['Contaminación acuícola','Sobreexplotación','Relleno costero'],
    area:      '103 ha',
    admin:     'Municipalidad de Quinchao',
    center:    [-73.487, -42.473],
    zoom:      14,
    bbox:      { west:-73.510, south:-42.490, east:-73.465, north:-42.455 },
    demo: { csi:59, csi_label:'Moderado', ndvi:0.48, ndmi:0.40, nbr:0.41, ndwi:0.33, trend:-0.014, base_ndvi:0.53 }
  },
  curaco: {
    id:        'curaco',
    name:      'Humedal Bahía Curaco de Vélez',
    type:      'Santuario de la Naturaleza · Humedal',
    ecosystem: 'wetland',
    desc:      'Bahía somera entre isla Quinchao y Chiloé. Zona de alimentación de cisnes de cuello negro y flamencos. Praderas submareales de importancia ecológica.',
    indices:   ['NDWI','NDVI','NDMI'],
    threats:   ['Contaminación','Tráfico marítimo','Relleno costero'],
    area:      '60 ha',
    admin:     'Municipalidad de Curaco de Vélez',
    center:    [-73.610, -42.437],
    zoom:      15,
    bbox:      { west:-73.630, south:-42.450, east:-73.590, north:-42.425 },
    demo: { csi:63, csi_label:'Moderado', ndvi:0.50, ndmi:0.42, nbr:0.44, ndwi:0.36, trend:-0.010, base_ndvi:0.54 }
  },
  putemun: {
    id:        'putemun',
    name:      'Humedal Costero Putemún',
    type:      'Santuario de la Naturaleza · Humedal',
    ecosystem: 'wetland',
    desc:      'Humedal estuarino en la bahía de Castro, alimentado por río Cui Cui y cinco tributarios. Hábitat crítico de cisnes de cuello negro. Amenazado por expansión urbana.',
    indices:   ['NDWI','NDVI','NDMI'],
    threats:   ['Expansión urbana','Contaminación aguas servidas','Relleno costero'],
    area:      '149 ha',
    admin:     'CECPAN + Municipalidad de Castro',
    center:    [-73.750, -42.440],
    zoom:      14,
    bbox:      { west:-73.775, south:-42.460, east:-73.725, north:-42.420 },
    demo: { csi:56, csi_label:'Moderado', ndvi:0.46, ndmi:0.38, nbr:0.40, ndwi:0.30, trend:-0.019, base_ndvi:0.52 }
  },
  huillinco: {
    id:        'huillinco',
    name:      'Lagos Huillinco y Cucao',
    type:      'Santuario de la Naturaleza · Lacustre',
    ecosystem: 'wetland',
    desc:      'Sistema lacustre conectado al Pacífico en la costa oeste de Chiloé, unidos por el Estrecho del Contento. Limita con el Parque Nacional Chiloé.',
    indices:   ['NDWI','NDVI','NDMI'],
    threats:   ['Eutroficación','Cambio uso de suelo','Turismo no regulado'],
    area:      '3.031 ha',
    admin:     'CONAF + Municipalidad de Chonchi',
    center:    [-73.970, -42.660],
    zoom:      12,
    bbox:      { west:-74.120, south:-42.700, east:-73.820, north:-42.620 },
    demo: { csi:72, csi_label:'Bueno', ndvi:0.55, ndmi:0.48, nbr:0.50, ndwi:0.42, trend:+0.002, base_ndvi:0.54 }
  },
  quilo: {
    id:        'quilo',
    name:      'Humedal Costero Laguna Quilo',
    type:      'Santuario de la Naturaleza · Humedal',
    ecosystem: 'wetland',
    desc:      'Laguna costera y humedal en el litoral norte de Chiloé, cerca de Ancud. Sitio IBA para aves playeras migratorias. Drenaje al Golfo de Quetalmahue.',
    indices:   ['NDWI','NDVI','NDMI'],
    threats:   ['Drenaje','Expansión agrícola','Contaminación difusa'],
    area:      '282 ha',
    admin:     'Municipalidad de Ancud',
    center:    [-73.920, -41.845],
    zoom:      13,
    bbox:      { west:-73.960, south:-41.870, east:-73.880, north:-41.820 },
    demo: { csi:61, csi_label:'Moderado', ndvi:0.49, ndmi:0.41, nbr:0.43, ndwi:0.34, trend:-0.012, base_ndvi:0.53 }
  },
  // ── 2 Bienes Nacionales Protegidos ─────────────────────────
  islas_quilan: {
    id:        'islas_quilan',
    name:      'Islas Quilán',
    type:      'Bien Nacional Protegido · Insular',
    ecosystem: 'forest',
    desc:      'Archipiélago de 10 islas frente a la costa SW de Chiloé, cerca de Parque Tantauco. Colonias de aves y mamíferos marinos. Acceso restringido. BNP desde 2010.',
    indices:   ['NDVI','NDMI','NBR'],
    threats:   ['Pesca ilegal','Especies invasoras','Erosión costera'],
    area:      '3.570 ha',
    admin:     'Bienes Nacionales',
    center:    [-74.250, -43.384],
    zoom:      12,
    bbox:      { west:-74.350, south:-43.450, east:-74.150, north:-43.310 },
    demo: { csi:75, csi_label:'Bueno', ndvi:0.69, ndmi:0.43, nbr:0.59, trend:+0.003, base_ndvi:0.67 }
  },
  'putrihuén': {
    id:        'putrihuén',
    name:      'Fundo Putrihuén',
    type:      'Bien Nacional Protegido · Forestal',
    ecosystem: 'forest',
    desc:      'Predio fiscal de 700 ha con bosque siempreverde valdiviano en el interior de Chiloé, comuna de Castro. BNP desde 2013.',
    indices:   ['NDVI','NDMI','NBR'],
    threats:   ['Tala ilegal','Incendios','Presión ganadera'],
    area:      '700 ha',
    admin:     'Bienes Nacionales',
    center:    [-73.850, -42.520],
    zoom:      13,
    bbox:      { west:-73.900, south:-42.560, east:-73.800, north:-42.480 },
    demo: { csi:62, csi_label:'Moderado', ndvi:0.55, ndmi:0.33, nbr:0.46, trend:-0.011, base_ndvi:0.59 }
  }
};

const CSI_WEIGHTS = {
  forest:   { veg:0.50, hyd:0.30, int:0.20 },
  wetland:  { veg:0.25, hyd:0.55, int:0.20 },
  peatland: { veg:0.20, hyd:0.60, int:0.20 }
};

const INDEX_VIS = {
  RGB:  { bands:['B4','B3','B2'], min:0, max:0.3, gamma:1.4 },
  NDVI: { min:-0.1, max:0.9, palette:['#d73027','#f46d43','#fdae61','#fee08b','#d9ef8b','#a6d96a','#66bd63','#1a9850'] },
  NDMI: { min:-0.4, max:0.6, palette:['#d73027','#fc8d59','#fee090','#e0f3f8','#91bfdb','#4575b4'] },
  NBR:  { min:-0.5, max:0.9, palette:['#7f3b08','#b35806','#e08214','#fdb863','#d9ef8b','#a6d96a','#4dac26','#1a9641'] },
  NDWI: { min:-0.5, max:0.5, palette:['#8c510a','#bf812d','#dfc27d','#c7eae5','#5ab4ac','#01665e'] },
  EVI:  { min:0.0,  max:0.8, palette:['#d73027','#f46d43','#fdae61','#fee08b','#d9ef8b','#a6d96a','#66bd63','#1a9850'] },
  PAI:  { min:0,    max:1,   palette:['#1a9850','#a6d96a','#fee08b','#f46d43','#d73027'] },
  DIFF: { min:-0.4, max:0.4, palette:['#d73027','#f46d43','#fee090','#ffffbf','#d9ef8b','#4dac26','#1a9641'] }
};

// ============================================================
// STATE
// ============================================================
const state = {
  apiReady:       false,   // GEE backend available
  activeTab:      'dashboard',
  monSite:        'pumalin',
  monIndex:       'NDVI',
  monLayer:       'RGB',
  monStart:       '2020-01-01',
  monEnd:         '',
  monCloud:       30,
  chSite:         'pumalin',
  chIndex:        'NDVI',
  tsData:         null,
  currentCSI:     null,
  changesLoaded:  false,   // auto-run flag for Changes tab
  maps:           {},
  roi:            null,   // L.LatLngBounds — drawn ROI, or null = use site bbox
  _roiFirstClick: null    // transient: first tap during draw mode
};

// Chart hover metadata (set by drawTimeSeries, used by tooltip)
let _chartMeta = null;

// ============================================================
// NASA GIBS HELPERS
// ============================================================
function gibsTileUrl(layerKey, dateStr, fmt) {
  const layer = GIBS[layerKey] || GIBS.trueColor;
  const f = fmt || (layerKey === 'ndvi' ? 'png' : 'jpg');
  // Snap to recent available date
  const d = dateStr || todayStr();
  return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer}/default/${d}/GoogleMapsCompatible/{z}/{y}/{x}.${f}`;
}

function addGIBSLayer(map, layerKey, dateStr, layerId, opacity) {
  if (map._geeLayers && map._geeLayers[layerId]) {
    map.removeLayer(map._geeLayers[layerId]);
  }
  if (!map._geeLayers) map._geeLayers = {};
  const url = gibsTileUrl(layerKey, dateStr);
  // maxNativeZoom: tiles exist up to z9 (250m), Leaflet stretches them at higher zooms
  const layer = L.tileLayer(url, {
    maxNativeZoom: 9,
    maxZoom: 18,
    opacity: opacity !== undefined ? opacity : 0.92,
    attribution: 'NASA GIBS · MODIS Terra',
    errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
  });
  map._geeLayers[layerId] = layer;
  // Labels pane at z-index 650; tile layers default to tilePane z-index 200 — stays below automatically
  layer.addTo(map);
  return layer;
}

// Get a summer-representative date (Jan) within a period for southern hemisphere
// Same-season comparison shows real multi-year vegetation change
function getRepresentativeDate(startStr, endStr) {
  const start = new Date(startStr);
  const end   = new Date(endStr);
  // Try Jan 15 of each year in the range (southern summer = max NDVI)
  for (let yr = end.getFullYear(); yr >= start.getFullYear(); yr--) {
    const jan15 = new Date(`${yr}-01-15`);
    if (jan15 >= start && jan15 <= end) return jan15.toISOString().slice(0, 10);
  }
  // Fallback: midpoint
  return new Date((start.getTime() + end.getTime()) / 2).toISOString().slice(0, 10);
}

function addNDVILegend(map) {
  if (map._ndviLegend) map.removeControl(map._ndviLegend);
  const legend = L.control({ position: 'bottomright' });
  legend.onAdd = function() {
    const div = L.DomUtil.create('div');
    div.style.cssText = [
      'background:rgba(6,11,20,.88)',
      'border:1px solid rgba(255,255,255,.13)',
      'border-radius:6px',
      'padding:7px 10px',
      'font:11px/1.4 "JetBrains Mono",monospace',
      'color:#e2e8f0',
      'pointer-events:none',
      'user-select:none'
    ].join(';');
    div.innerHTML =
      '<div style="font-weight:600;margin-bottom:5px;font-size:10px;color:#94a3b8;letter-spacing:.05em">NDVI · MODIS</div>' +
      '<div style="display:flex;align-items:center;gap:7px">' +
        '<div style="width:13px;height:72px;border-radius:3px;flex-shrink:0;background:linear-gradient(to bottom,#1a5c0a 0%,#22c55e 30%,#fde047 55%,#9ca3af 75%,#1e3a5f 100%)"></div>' +
        '<div style="display:flex;flex-direction:column;justify-content:space-between;height:72px;font-size:10px;color:#cbd5e1">' +
          '<span>1.0 forestal</span>' +
          '<span>0.6</span>' +
          '<span>0.3 pasto</span>' +
          '<span>0.0</span>' +
          '<span>−1 agua</span>' +
        '</div>' +
      '</div>' +
      '<div style="font-size:9px;color:#64748b;margin-top:4px">verde intenso = mayor vigor</div>';
    return div;
  };
  legend.addTo(map);
  map._ndviLegend = legend;
}

// ============================================================
// API CLIENT
// ============================================================
async function apiFetch(endpoint, params) {
  const url = new URL(`${SBAP_API}/api/${endpoint}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const resp = await fetch(url.toString(), { signal: AbortSignal.timeout(180000) });
  if (!resp.ok) throw new Error(`API ${resp.status}`);
  return resp.json();
}

async function checkApiHealth() {
  try {
    const resp = await fetch(`${SBAP_API}/health`, { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) {
      updateApiStatus(false);
      showNotif('API respondió con error · modo demo activo', 'info');
      return;
    }
    const data = await resp.json();
    if (data.status === 'ok' && data.gee === true) {
      state.apiReady = true;
      updateApiStatus(true);
    } else {
      // Backend running but GEE not initialized yet (SA not registered)
      updateApiStatus(false, 'Backend ↑ · GEE pendiente');
      showNotif('Backend activo · GEE pendiente · registra el service account en earthengine.google.com', 'info');
    }
  } catch (e) {
    updateApiStatus(false);
    if (e.name === 'TimeoutError' || e.name === 'AbortError') {
      showNotif('API sin respuesta · modo demo activo', 'info');
    }
  }
}

function updateApiStatus(ready, customText) {
  const statusEl = document.getElementById('gee-status');
  const textEl   = document.getElementById('gee-status-text');
  const btnEl    = document.getElementById('btn-connect');
  if (ready) {
    statusEl && statusEl.classList.add('connected');
    textEl   && (textEl.textContent = 'Sentinel-2 ✓');
    btnEl    && (btnEl.textContent  = '✓ S-2 Activo');
    btnEl    && (btnEl.disabled     = true);
    renderDashboard();  // Refresh source labels in score cards
  } else {
    statusEl && statusEl.classList.remove('connected');
    textEl   && (textEl.textContent = customText || 'MODIS · Demo');
    btnEl    && (btnEl.textContent  = 'Verificar API');
    btnEl    && (btnEl.disabled     = false);
  }
  updateSidebarSource();
}

function updateSidebarSource() {
  const el = document.getElementById('mon-sidebar-source');
  if (!el) return;
  if (state.apiReady) {
    el.innerHTML =
      '<strong>Fuente:</strong> Sentinel-2 SR Harmonized (ESA)<br>' +
      '<strong>Resolución:</strong> 10m · revisita 5 días<br>' +
      '<strong>Plataforma:</strong> Google Earth Engine<br>' +
      '<strong>Umbral CSI:</strong> ≥80 Óptimo · ≥65 Bueno · ≥50 Moderado · &lt;50 Degradado';
  } else {
    el.innerHTML =
      '<strong>Fuente:</strong> NASA GIBS · MODIS Terra<br>' +
      '<strong>Resolución:</strong> 250m · compuesto 8 días<br>' +
      '<strong>Plataforma:</strong> Demo · simulación realista<br>' +
      '<strong>Umbral CSI:</strong> ≥80 Óptimo · ≥65 Bueno · ≥50 Moderado · &lt;50 Degradado';
  }
  const subEl = document.getElementById('dashboard-subtitle');
  if (subEl) subEl.textContent =
    `SBAP Dirección Regional Los Lagos · ${state.apiReady ? 'Sentinel-2 10m · GEE' : 'MODIS 250m · Demo'}`;
}

// ============================================================
// REALISTIC DEMO TIME SERIES
// ============================================================
// Physically realistic seasonal patterns for each site/index
const TS_PATTERNS = {
  // ── Forestales ──
  bosque_fosil: {
    NDVI: { base:0.42, amp:0.06, peak:10, trend:-0.003, noise:0.05 },
    NDMI: { base:0.24, amp:0.08, peak:6,  trend:-0.002, noise:0.04 },
    NBR:  { base:0.33, amp:0.05, peak:10, trend:-0.002, noise:0.04 },
    NDWI: { base:0.18, amp:0.06, peak:7,  trend:-0.001, noise:0.03 },
    EVI:  { base:0.38, amp:0.06, peak:10, trend:-0.003, noise:0.05 },
    PAI:  { base:0.42, amp:0.06, peak:1,  trend:+0.003, noise:0.03 },
  },
  katalapi: {
    NDVI: { base:0.68, amp:0.07, peak:10, trend:+0.001, noise:0.03 },
    NDMI: { base:0.42, amp:0.09, peak:6,  trend:+0.001, noise:0.03 },
    NBR:  { base:0.57, amp:0.06, peak:10, trend:+0.001, noise:0.02 },
    NDWI: { base:0.30, amp:0.07, peak:7,  trend: 0.000, noise:0.02 },
    EVI:  { base:0.62, amp:0.07, peak:10, trend:+0.001, noise:0.03 },
    PAI:  { base:0.20, amp:0.04, peak:1,  trend:+0.001, noise:0.02 },
  },
  cochamo: {
    NDVI: { base:0.76, amp:0.06, peak:10, trend:+0.002, noise:0.02 },
    NDMI: { base:0.48, amp:0.08, peak:6,  trend:+0.001, noise:0.02 },
    NBR:  { base:0.66, amp:0.05, peak:10, trend:+0.001, noise:0.02 },
    NDWI: { base:0.32, amp:0.07, peak:7,  trend: 0.000, noise:0.02 },
    EVI:  { base:0.70, amp:0.07, peak:10, trend:+0.002, noise:0.02 },
    PAI:  { base:0.10, amp:0.03, peak:1,  trend: 0.000, noise:0.01 },
  },
  pumalin: {
    NDVI: { base:0.72, amp:0.07, peak:10, trend:+0.002, noise:0.03 },
    NDMI: { base:0.40, amp:0.10, peak:6,  trend:+0.001, noise:0.03 },
    NBR:  { base:0.63, amp:0.06, peak:10, trend:+0.001, noise:0.02 },
    NDWI: { base:0.28, amp:0.08, peak:7,  trend: 0.000, noise:0.02 },
    EVI:  { base:0.65, amp:0.08, peak:10, trend:+0.001, noise:0.03 },
    PAI:  { base:0.18, amp:0.04, peak:1,  trend:+0.001, noise:0.02 },
  },
  alerzales: {
    NDVI: { base:0.63, amp:0.05, peak:10, trend:-0.001, noise:0.02 },
    NDMI: { base:0.39, amp:0.07, peak:6,  trend:-0.001, noise:0.02 },
    NBR:  { base:0.54, amp:0.05, peak:10, trend:-0.001, noise:0.02 },
    NDWI: { base:0.26, amp:0.06, peak:7,  trend: 0.000, noise:0.02 },
    EVI:  { base:0.58, amp:0.06, peak:10, trend:-0.001, noise:0.02 },
    PAI:  { base:0.15, amp:0.03, peak:1,  trend:+0.001, noise:0.01 },
  },
  islas_quilan: {
    NDVI: { base:0.69, amp:0.06, peak:10, trend:+0.001, noise:0.03 },
    NDMI: { base:0.43, amp:0.08, peak:6,  trend: 0.000, noise:0.03 },
    NBR:  { base:0.59, amp:0.05, peak:10, trend: 0.000, noise:0.02 },
    NDWI: { base:0.35, amp:0.09, peak:7,  trend: 0.000, noise:0.03 },
    EVI:  { base:0.63, amp:0.07, peak:10, trend:+0.001, noise:0.03 },
    PAI:  { base:0.14, amp:0.03, peak:1,  trend: 0.000, noise:0.01 },
  },
  'putrihuén': {
    NDVI: { base:0.55, amp:0.08, peak:10, trend:-0.002, noise:0.04 },
    NDMI: { base:0.33, amp:0.09, peak:6,  trend:-0.001, noise:0.03 },
    NBR:  { base:0.46, amp:0.06, peak:10, trend:-0.001, noise:0.03 },
    NDWI: { base:0.22, amp:0.07, peak:7,  trend:-0.001, noise:0.03 },
    EVI:  { base:0.50, amp:0.08, peak:10, trend:-0.002, noise:0.04 },
    PAI:  { base:0.28, amp:0.05, peak:1,  trend:+0.002, noise:0.02 },
  },
  // ── Humedales ──
  maullin: {
    NDVI: { base:0.54, amp:0.10, peak:10, trend:-0.001, noise:0.04 },
    NDMI: { base:0.46, amp:0.11, peak:6,  trend:-0.001, noise:0.03 },
    NBR:  { base:0.48, amp:0.06, peak:10, trend:-0.001, noise:0.03 },
    NDWI: { base:0.38, amp:0.13, peak:5,  trend:-0.002, noise:0.04 },
    EVI:  { base:0.49, amp:0.10, peak:10, trend:-0.001, noise:0.04 },
    PAI:  { base:0.22, amp:0.04, peak:1,  trend:+0.001, noise:0.02 },
  },
  kaikue: {
    NDVI: { base:0.56, amp:0.08, peak:10, trend:+0.001, noise:0.03 },
    NDMI: { base:0.44, amp:0.10, peak:6,  trend: 0.000, noise:0.03 },
    NBR:  { base:0.49, amp:0.06, peak:10, trend: 0.000, noise:0.03 },
    NDWI: { base:0.35, amp:0.12, peak:5,  trend: 0.000, noise:0.03 },
    EVI:  { base:0.51, amp:0.08, peak:10, trend:+0.001, noise:0.03 },
    PAI:  { base:0.18, amp:0.04, peak:1,  trend: 0.000, noise:0.02 },
  },
  chepu: {
    NDVI: { base:0.52, amp:0.12, peak:10, trend:-0.002, noise:0.04 },
    NDMI: { base:0.44, amp:0.12, peak:6,  trend:-0.002, noise:0.03 },
    NBR:  { base:0.55, amp:0.07, peak:10, trend:-0.001, noise:0.03 },
    NDWI: { base:0.33, amp:0.15, peak:5,  trend:-0.003, noise:0.04 },
    EVI:  { base:0.47, amp:0.11, peak:10, trend:-0.002, noise:0.04 },
    PAI:  { base:0.25, amp:0.05, peak:1,  trend:+0.002, noise:0.02 },
  },
  quinchao: {
    NDVI: { base:0.48, amp:0.10, peak:10, trend:-0.002, noise:0.04 },
    NDMI: { base:0.40, amp:0.11, peak:6,  trend:-0.002, noise:0.04 },
    NBR:  { base:0.41, amp:0.06, peak:10, trend:-0.002, noise:0.03 },
    NDWI: { base:0.33, amp:0.14, peak:5,  trend:-0.003, noise:0.04 },
    EVI:  { base:0.43, amp:0.10, peak:10, trend:-0.002, noise:0.04 },
    PAI:  { base:0.30, amp:0.05, peak:1,  trend:+0.002, noise:0.02 },
  },
  curaco: {
    NDVI: { base:0.50, amp:0.09, peak:10, trend:-0.002, noise:0.04 },
    NDMI: { base:0.42, amp:0.10, peak:6,  trend:-0.001, noise:0.03 },
    NBR:  { base:0.44, amp:0.06, peak:10, trend:-0.001, noise:0.03 },
    NDWI: { base:0.36, amp:0.13, peak:5,  trend:-0.002, noise:0.04 },
    EVI:  { base:0.45, amp:0.09, peak:10, trend:-0.002, noise:0.04 },
    PAI:  { base:0.26, amp:0.05, peak:1,  trend:+0.002, noise:0.02 },
  },
  putemun: {
    NDVI: { base:0.46, amp:0.11, peak:10, trend:-0.003, noise:0.05 },
    NDMI: { base:0.38, amp:0.12, peak:6,  trend:-0.003, noise:0.04 },
    NBR:  { base:0.40, amp:0.06, peak:10, trend:-0.002, noise:0.03 },
    NDWI: { base:0.30, amp:0.15, peak:5,  trend:-0.004, noise:0.05 },
    EVI:  { base:0.41, amp:0.11, peak:10, trend:-0.003, noise:0.05 },
    PAI:  { base:0.35, amp:0.06, peak:1,  trend:+0.003, noise:0.03 },
  },
  huillinco: {
    NDVI: { base:0.55, amp:0.09, peak:10, trend:+0.000, noise:0.03 },
    NDMI: { base:0.48, amp:0.10, peak:6,  trend: 0.000, noise:0.03 },
    NBR:  { base:0.50, amp:0.06, peak:10, trend: 0.000, noise:0.03 },
    NDWI: { base:0.42, amp:0.12, peak:5,  trend: 0.000, noise:0.03 },
    EVI:  { base:0.50, amp:0.09, peak:10, trend: 0.000, noise:0.03 },
    PAI:  { base:0.16, amp:0.04, peak:1,  trend: 0.000, noise:0.02 },
  },
  quilo: {
    NDVI: { base:0.49, amp:0.10, peak:10, trend:-0.002, noise:0.04 },
    NDMI: { base:0.41, amp:0.11, peak:6,  trend:-0.002, noise:0.03 },
    NBR:  { base:0.43, amp:0.06, peak:10, trend:-0.001, noise:0.03 },
    NDWI: { base:0.34, amp:0.13, peak:5,  trend:-0.002, noise:0.04 },
    EVI:  { base:0.44, amp:0.10, peak:10, trend:-0.002, noise:0.04 },
    PAI:  { base:0.28, amp:0.05, peak:1,  trend:+0.002, noise:0.02 },
  },
  // ── Turberas ──
  aucar: {
    NDVI: { base:0.53, amp:0.05, peak:10, trend:-0.001, noise:0.02 },
    NDMI: { base:0.48, amp:0.07, peak:5,  trend:-0.001, noise:0.02 },
    NBR:  { base:0.46, amp:0.05, peak:10, trend:-0.001, noise:0.02 },
    NDWI: { base:0.41, amp:0.09, peak:4,  trend:-0.001, noise:0.03 },
    EVI:  { base:0.48, amp:0.06, peak:10, trend:-0.001, noise:0.02 },
    PAI:  { base:0.14, amp:0.03, peak:1,  trend:+0.001, noise:0.01 },
  },
  pulpito: {
    NDVI: { base:0.50, amp:0.05, peak:10, trend:-0.002, noise:0.03 },
    NDMI: { base:0.45, amp:0.07, peak:5,  trend:-0.001, noise:0.02 },
    NBR:  { base:0.43, amp:0.05, peak:10, trend:-0.001, noise:0.02 },
    NDWI: { base:0.39, amp:0.09, peak:4,  trend:-0.002, noise:0.03 },
    EVI:  { base:0.45, amp:0.06, peak:10, trend:-0.002, noise:0.03 },
    PAI:  { base:0.16, amp:0.03, peak:1,  trend:+0.001, noise:0.01 },
  },
  puntalapa: {
    NDVI: { base:0.55, amp:0.05, peak:10, trend:-0.001, noise:0.02 },
    NDMI: { base:0.50, amp:0.07, peak:5,  trend:-0.001, noise:0.02 },
    NBR:  { base:0.47, amp:0.05, peak:10, trend: 0.000, noise:0.02 },
    NDWI: { base:0.43, amp:0.09, peak:4,  trend:-0.001, noise:0.03 },
    EVI:  { base:0.50, amp:0.06, peak:10, trend:-0.001, noise:0.02 },
    PAI:  { base:0.12, amp:0.03, peak:1,  trend: 0.000, noise:0.01 },
  }
};

function generateRealisticTimeSeries(siteId, indexName, startDate, endDate) {
  const pat = (TS_PATTERNS[siteId] || TS_PATTERNS.pumalin)[indexName]
           || TS_PATTERNS.pumalin.NDVI;
  const start = new Date(startDate || '2020-01-01');
  const end   = new Date(endDate   || todayStr());
  const series = [];
  let cur = new Date(start);
  // Seeded pseudo-random for reproducibility
  let seed = siteId.charCodeAt(0) + indexName.charCodeAt(0);
  const rand = () => { seed = (seed * 16807 + 0) % 2147483647; return (seed - 1) / 2147483646; };

  while (cur <= end) {
    const mo = cur.getMonth();           // 0-11
    const totalYears = (cur - start) / (365.25 * 86400000);
    const phase = 2 * Math.PI * ((mo - pat.peak + 12) % 12) / 12;
    const seasonal = pat.amp * Math.cos(phase);
    const trendV   = pat.trend * totalYears;
    const noise    = (rand() - 0.5) * pat.noise * 2;
    const val      = Math.max(0, Math.min(1, pat.base + seasonal + trendV + noise));
    series.push({ date: cur.toISOString().slice(0, 10), value: +val.toFixed(4) });
    // ~16-day Sentinel-2 revisit
    cur.setDate(cur.getDate() + 15 + Math.floor(rand() * 6));
  }
  return series.sort((a, b) => a.date.localeCompare(b.date));
}

// ============================================================
// CUSSEN-CSI v1.0 — Conservation State Index
// ============================================================
function computeCSI(recentNDVI, recentHyd, recentNBR, baseNDVI, baseHyd, baseNBR, ecosystem) {
  const w = CSI_WEIGHTS[ecosystem] || CSI_WEIGHTS.forest;
  const vegScore = baseNDVI > 0 ? Math.min(120, (recentNDVI / baseNDVI) * 100) : 70;
  const hydScore = baseHyd  > 0 ? Math.min(120, (recentHyd  / baseHyd)  * 100) : 70;
  const intScore = baseNBR  > 0 ? Math.min(120, (recentNBR  / baseNBR)  * 100) : 70;
  const raw = w.veg * vegScore + w.hyd * hydScore + w.int * intScore;
  return { score: Math.round(Math.min(100, Math.max(0, raw))), vegScore, hydScore, intScore };
}

function csiClass(score) {
  if (score >= 80) return { label:'Óptimo',   cls:'score-optimal' };
  if (score >= 65) return { label:'Bueno',     cls:'score-good' };
  if (score >= 50) return { label:'Moderado',  cls:'score-moderate' };
  if (score >= 30) return { label:'Degradado', cls:'score-degraded' };
  return              { label:'Crítico',    cls:'score-critical' };
}

function scoreColor(score) {
  if (score >= 80) return '#10b981';
  if (score >= 65) return '#84cc16';
  if (score >= 50) return '#f59e0b';
  if (score >= 30) return '#f97316';
  return '#ef4444';
}

// ============================================================
// CHART — custom canvas time series
// ============================================================
function drawTimeSeries(canvasId, series, _indexName, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W   = canvas.offsetWidth || 600;
  const H   = 185;
  canvas.width  = W * window.devicePixelRatio;
  canvas.height = H * window.devicePixelRatio;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  const PAD = { top:12, right:16, bottom:32, left:48 };
  const IW  = W - PAD.left - PAD.right;
  const IH  = H - PAD.top  - PAD.bottom;

  if (!series || series.length === 0) {
    _chartMeta = null;
    ctx.fillStyle = '#64748b';
    ctx.font = '12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Presiona Analizar para cargar datos', W/2, H/2);
    return;
  }

  const vals  = series.map(p => p.value);
  const minV  = Math.min(...vals) - 0.05;
  const maxV  = Math.max(...vals) + 0.05;
  const dates = series.map(p => new Date(p.date).getTime());
  const minT  = Math.min(...dates);
  const maxT  = Math.max(...dates);

  const xOf = t => PAD.left + ((t - minT) / (maxT - minT || 1)) * IW;
  const yOf = v => PAD.top  + (1 - (v - minV) / (maxV - minV || 1)) * IH;

  ctx.fillStyle = '#0d1420';
  ctx.fillRect(0, 0, W, H);

  // Horizontal grid lines + Y-axis labels
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = PAD.top + (IH / 4) * i;
    ctx.beginPath(); ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.moveTo(PAD.left, y); ctx.lineTo(W - PAD.right, y); ctx.stroke();
    const v = maxV - (maxV - minV) * (i / 4);
    ctx.fillStyle = '#64748b';
    ctx.font = `10px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'right';
    ctx.fillText(v.toFixed(2), PAD.left - 4, y + 3);
  }

  // Vertical grid lines at January 1 of each year
  {
    const years2 = [...new Set(series.map(p => p.date.slice(0, 4)))];
    years2.forEach(yr => {
      const jan1 = new Date(yr + '-01-01').getTime();
      if (jan1 < minT || jan1 > maxT) return;
      const x = xOf(jan1);
      ctx.beginPath(); ctx.strokeStyle = 'rgba(255,255,255,.04)'; ctx.lineWidth = 1;
      ctx.moveTo(x, PAD.top); ctx.lineTo(x, PAD.top + IH); ctx.stroke();
    });
  }

  const span  = Math.max(1, Math.floor(series.length * 0.18));
  const smooth = series.map((_, i) => {
    const s = Math.max(0, i - span), e = Math.min(series.length - 1, i + span);
    const sl = vals.slice(s, e + 1);
    return sl.reduce((a, b) => a + b, 0) / sl.length;
  });

  const grad = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + IH);
  grad.addColorStop(0, `${color}33`);
  grad.addColorStop(1, `${color}00`);
  ctx.beginPath();
  ctx.moveTo(xOf(dates[0]), yOf(smooth[0]));
  for (let i = 1; i < series.length; i++) {
    const xc = (xOf(dates[i-1]) + xOf(dates[i])) / 2;
    const y0 = yOf(smooth[i-1]), y1 = yOf(smooth[i]);
    ctx.quadraticCurveTo(xOf(dates[i-1]), y0, xc, (y0+y1)/2);
  }
  ctx.lineTo(xOf(dates[dates.length-1]), yOf(smooth[smooth.length-1]));
  ctx.lineTo(xOf(dates[dates.length-1]), PAD.top + IH);
  ctx.lineTo(xOf(dates[0]), PAD.top + IH);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  for (let i = 0; i < series.length; i++) {
    const x = xOf(dates[i]), y = yOf(smooth[i]);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Trend line (linear regression — dashed, faint)
  {
    const xs  = dates.map(d => d / 86400000);
    const n2  = xs.length;
    const mx2 = xs.reduce((a, b) => a + b, 0) / n2;
    const my2 = vals.reduce((a, b) => a + b, 0) / n2;
    const num2 = xs.reduce((a, x, i) => a + (x - mx2) * (vals[i] - my2), 0);
    const den2 = xs.reduce((a, x)    => a + (x - mx2) ** 2, 0);
    const sl = den2 === 0 ? 0 : num2 / den2;
    const ic = my2 - sl * mx2;
    const y0r = ic + sl * xs[0], y1r = ic + sl * xs[n2 - 1];
    if (Math.abs(y0r - y1r) > 0.005) {
      ctx.beginPath();
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = `${color}55`;
      ctx.lineWidth = 1.5;
      ctx.moveTo(xOf(dates[0]), yOf(y0r));
      ctx.lineTo(xOf(dates[n2 - 1]), yOf(y1r));
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  series.forEach((_p, i) => {
    const x = xOf(dates[i]), y = yOf(vals[i]);
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = `${color}aa`;
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Y-axis: index name at top
  ctx.fillStyle = color;
  ctx.font = `bold 9px 'JetBrains Mono', monospace`;
  ctx.textAlign = 'left';
  ctx.fillText(_indexName || '', PAD.left + 2, PAD.top - 3);

  // X-axis: year labels + tick marks
  ctx.fillStyle = '#64748b';
  ctx.font = "10px 'JetBrains Mono', monospace";
  ctx.textAlign = 'center';
  const years = [...new Set(series.map(p => p.date.slice(0, 4)))];
  years.forEach(yr => {
    const midT = new Date(yr + '-07-01').getTime();
    if (midT < minT || midT > maxT) return;
    const tx = xOf(midT);
    // Tick mark at year mid
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,.08)';
    ctx.lineWidth = 1;
    ctx.moveTo(tx, PAD.top + IH);
    ctx.lineTo(tx, PAD.top + IH + 4);
    ctx.stroke();
    ctx.fillText(yr, tx, H - PAD.bottom + 14);
  });

  const last = series[series.length - 1];
  const lx   = xOf(dates[dates.length - 1]);
  const ly   = yOf(last.value);
  ctx.beginPath();
  ctx.arc(lx, ly, 4, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#060b14';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = "bold 10px 'JetBrains Mono', monospace";
  ctx.textAlign = 'right';
  ctx.fillText(last.value.toFixed(3), lx - 7, ly - 5);

  // Store metadata for interactive tooltip
  _chartMeta = { canvasId, series, dates, vals, PAD, IW, IH, W, H, minT, maxT, minV, maxV, color, xOf, yOf, indexName: _indexName };
}

// ============================================================
// CHART INTERACTIVE TOOLTIP
// ============================================================
function setupChartTooltip() {
  const canvas    = document.getElementById('ts-canvas');
  const tooltip   = document.getElementById('ts-tooltip');
  const crosshair = document.getElementById('chart-crosshair');
  if (!canvas || !tooltip) return;

  function nearestPoint(clientX) {
    if (!_chartMeta) return null;
    const rect   = canvas.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const { PAD, IW, dates, minT, maxT } = _chartMeta;
    if (mouseX < PAD.left || mouseX > PAD.left + IW) return null;
    const t = minT + ((mouseX - PAD.left) / IW) * (maxT - minT);
    let nearest = 0, minDist = Infinity;
    dates.forEach((d, i) => { const dist = Math.abs(d - t); if (dist < minDist) { minDist = dist; nearest = i; } });
    return nearest;
  }

  function show(clientX, clientY) {
    const idx = nearestPoint(clientX);
    if (idx === null) { hide(); return; }
    const { series, color, dates, PAD, IH, xOf, indexName } = _chartMeta;
    const p = series[idx];
    // Tooltip
    tooltip.style.display = 'block';
    tooltip.innerHTML =
      `<span style="color:${color};font-size:.65rem;font-weight:600;letter-spacing:.04em">${indexName || ''}</span>` +
      `<span style="color:${color};font-weight:700"> ${p.value.toFixed(4)}</span><br>` +
      `<span style="color:var(--text3)">${fmtDate(p.date)}</span>`;
    let tx = clientX + 16, ty = clientY - 58;
    if (tx + tooltip.offsetWidth + 4 > window.innerWidth) tx = clientX - tooltip.offsetWidth - 16;
    if (ty < 4) ty = clientY + 16;
    tooltip.style.left = tx + 'px';
    tooltip.style.top  = ty + 'px';
    // Crosshair line
    if (crosshair) {
      const x = xOf(dates[idx]);
      crosshair.style.left   = x + 'px';
      crosshair.style.top    = PAD.top + 'px';
      crosshair.style.height = IH + 'px';
      crosshair.style.display = 'block';
    }
  }

  function hide() {
    tooltip.style.display = 'none';
    if (crosshair) crosshair.style.display = 'none';
  }

  let rafId = null;
  canvas.addEventListener('mousemove', e => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => show(e.clientX, e.clientY));
  });
  canvas.addEventListener('mouseleave', () => { cancelAnimationFrame(rafId); hide(); });
  canvas.addEventListener('touchmove', e => { e.preventDefault(); cancelAnimationFrame(rafId); rafId = requestAnimationFrame(() => show(e.touches[0].clientX, e.touches[0].clientY)); }, { passive: false });
  canvas.addEventListener('touchend', () => { cancelAnimationFrame(rafId); hide(); });
}

function trendPerYear(series) {
  if (series.length < 3) return 0;
  const n  = series.length;
  const xs = series.map(p => new Date(p.date).getTime() / 86400000);
  const ys = series.map(p => p.value);
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  const num = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0);
  const den = xs.reduce((a, x)    => a + (x - mx) ** 2, 0);
  return den === 0 ? 0 : (num / den) * 365;
}

// ============================================================
// LEAFLET MAP HELPERS
// ============================================================
function createLeafletMap(elementId, center, zoom, mapType) {
  const map = L.map(elementId, { zoomControl:true, attributionControl:true });

  if (mapType === 'osm') {
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19, subdomains: 'abc'
    }).addTo(map);
  } else if (mapType === 'esri') {
    // Esri World Imagery — cloud-free real satellite, global coverage
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: 'Esri · DigitalGlobe · GeoEye', maxZoom: 19 }
    ).addTo(map);
    // Labels pane — always rendered above satellite + GIBS tiles
    map.createPane('labels');
    map.getPane('labels').style.zIndex = 650;
    map.getPane('labels').style.pointerEvents = 'none';
    map._labelLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      { attribution: '', maxZoom: 19, opacity: 0.8, pane: 'labels' }
    );
    map._labelLayer.addTo(map);
  } else {
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 19, subdomains: 'abcd'
    }).addTo(map);
  }

  map.setView([center[1], center[0]], zoom);
  return map;
}

function addSiteBoundary(map, bbox, color) {
  return L.rectangle([[bbox.south, bbox.west], [bbox.north, bbox.east]], {
    color: color || '#10b981', weight: 2, fill: true,
    fillColor: color || '#10b981', fillOpacity: 0.06, interactive: false
  }).addTo(map);
}

// ============================================================
// ROI — REGION OF INTEREST DRAW TOOL
// ============================================================
function roiAreaHa(bounds) {
  const dLat   = Math.abs(bounds.getNorth() - bounds.getSouth());
  const dLon   = Math.abs(bounds.getEast()  - bounds.getWest());
  const midLat = (bounds.getNorth() + bounds.getSouth()) / 2;
  const m2     = dLat * 111000 * dLon * 111000 * Math.cos(midLat * Math.PI / 180);
  return m2 / 10000;
}

function roiPixelCount(bounds, resMetre) {
  const dLat   = Math.abs(bounds.getNorth() - bounds.getSouth());
  const dLon   = Math.abs(bounds.getEast()  - bounds.getWest());
  const midLat = (bounds.getNorth() + bounds.getSouth()) / 2;
  const h = dLat * 111000;
  const w = dLon * 111000 * Math.cos(midLat * Math.PI / 180);
  return Math.round((h / resMetre) * (w / resMetre));
}

function activeBBox(siteId) {
  if (state.roi) {
    return {
      west:  state.roi.getWest(),  south: state.roi.getSouth(),
      east:  state.roi.getEast(),  north: state.roi.getNorth()
    };
  }
  return SITES[siteId].bbox;
}

function clearROIRects() {
  if (state.maps._roiRects) {
    state.maps._roiRects.forEach(r => {
      [state.maps.monitor, state.maps.before, state.maps.after].forEach(m => {
        if (m && m.hasLayer(r)) m.removeLayer(r);
      });
    });
  }
  state.maps._roiRects = [];
}

function drawROIRect(bounds) {
  clearROIRects();
  const sw = [bounds.getSouth(), bounds.getWest()];
  const ne = [bounds.getNorth(), bounds.getEast()];
  state.maps._roiRects = [];
  [state.maps.monitor, state.maps.before, state.maps.after].forEach(m => {
    if (!m) return;
    const r = L.rectangle([sw, ne], {
      color:'#f59e0b', weight:2.5, dashArray:'8 4',
      fill:true, fillColor:'#f59e0b', fillOpacity:0.06, interactive:false
    }).addTo(m);
    state.maps._roiRects.push(r);
  });
}

function updateROIInfo(bounds) {
  const infoIds  = ['roi-info', 'roi-info-ch'];
  const clearIds = ['btn-clear-roi', 'btn-clear-roi-ch'];
  if (!bounds) {
    infoIds.forEach(id  => { const e = document.getElementById(id);  if (e) e.style.display = 'none'; });
    clearIds.forEach(id => { const e = document.getElementById(id);  if (e) e.style.display = 'none'; });
    return;
  }
  const ha  = roiAreaHa(bounds);
  const res = state.apiReady ? 10 : 250;
  const npx = roiPixelCount(bounds, res);
  const html =
    `<div class="roi-stat"><span class="roi-stat-label">Área ROI</span>` +
    `<span class="roi-stat-val">${ha >= 10000 ? (ha/1000).toFixed(1)+'k' : Math.round(ha).toLocaleString('es-CL')} ha</span></div>` +
    `<div class="roi-stat"><span class="roi-stat-label">Píxeles (${res}m)</span>` +
    `<span class="roi-stat-val">${npx.toLocaleString('es-CL')}</span></div>` +
    `<div class="roi-stat"><span class="roi-stat-label">Res. análisis</span>` +
    `<span class="roi-stat-val">${res}m/px · ${state.apiReady ? 'Sentinel-2' : 'MODIS'}</span></div>`;
  infoIds.forEach(id  => { const e = document.getElementById(id);  if (e) { e.style.display = ''; e.innerHTML = html; } });
  clearIds.forEach(id => { const e = document.getElementById(id);  if (e) e.style.display = ''; });
}

function applyROI(bounds) {
  state.roi = bounds;
  drawROIRect(bounds);
  const opts = { padding:[24,24], animate:true };
  if (state.maps.monitor) state.maps.monitor.fitBounds(bounds, opts);
  if (state.maps.before)  state.maps.before.fitBounds(bounds, opts);
  if (state.maps.after)   state.maps.after.fitBounds(bounds, opts);
  updateROIInfo(bounds);
  const ha = Math.round(roiAreaHa(bounds)).toLocaleString('es-CL');
  showNotif(`ROI definida · ${ha} ha · Ejecuta el análisis para procesar el área`, 'success');
}

function clearROI() {
  state.roi            = null;
  state._roiFirstClick = null;
  clearROIRects();
  disableROIMode();
  // Restore site view
  const ms = SITES[state.monSite];
  if (ms && state.maps.monitor)
    state.maps.monitor.setView([ms.center[1], ms.center[0]], ms.zoom);
  const cs = SITES[state.chSite];
  if (cs) {
    if (state.maps.before) state.maps.before.setView([cs.center[1], cs.center[0]], cs.zoom);
    if (state.maps.after)  state.maps.after.setView([cs.center[1],  cs.center[0]], cs.zoom);
  }
  updateROIInfo(null);
  showNotif('ROI eliminada — análisis sobre sitio completo', 'info');
}

function enableROIMode(targetMap, btnId) {
  const map       = targetMap || state.maps.monitor;
  const btnElemId = btnId || 'btn-draw-roi';
  if (!map) return;
  // Cancel any existing ROI mode on all maps first
  disableROIMode();
  state._roiFirstClick = null;
  map._roiMode = true;
  map.getContainer().style.cursor = 'crosshair';
  const btn = document.getElementById(btnElemId);
  if (btn) { btn.classList.add('active'); btn.textContent = '📍 Clic 1: 1ª esquina…'; }
  showNotif('Clic 1: esquina inicial · Clic 2: esquina opuesta', 'info');

  map._roiClickHandler = function(e) {
    if (!map._roiMode) return;
    if (!state._roiFirstClick) {
      state._roiFirstClick = e.latlng;
      if (btn) btn.textContent = '📍 Clic 2: 2ª esquina…';
      showNotif('Primer punto fijado — clic en la esquina opuesta', 'info');
    } else {
      const bounds = L.latLngBounds(state._roiFirstClick, e.latlng);
      state._roiFirstClick = null;
      disableROIMode();
      applyROI(bounds);
    }
  };
  map._roiMoveHandler = function(e) {
    if (!state._roiFirstClick) return;
    if (map._roiPreview) map.removeLayer(map._roiPreview);
    map._roiPreview = L.rectangle(
      L.latLngBounds(state._roiFirstClick, e.latlng),
      { color:'#f59e0b', weight:1.5, dashArray:'5 3', fill:false, interactive:false }
    ).addTo(map);
  };
  map.on('click', map._roiClickHandler);
  map.on('mousemove', map._roiMoveHandler);
}

function disableROIMode() {
  [state.maps.monitor, state.maps.before].forEach(map => {
    if (!map) return;
    map._roiMode = false;
    map.getContainer().style.cursor = '';
    if (map._roiClickHandler) { map.off('click',     map._roiClickHandler); map._roiClickHandler = null; }
    if (map._roiMoveHandler)  { map.off('mousemove', map._roiMoveHandler);  map._roiMoveHandler  = null; }
    if (map._roiPreview)      { map.removeLayer(map._roiPreview); map._roiPreview = null; }
  });
  ['btn-draw-roi', 'btn-draw-roi-ch'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) { btn.classList.remove('active'); btn.textContent = '✎ Dibujar ROI'; }
  });
}

function addGEETiles(map, tileUrl, layerId) {
  if (map._geeLayers && map._geeLayers[layerId]) {
    map.removeLayer(map._geeLayers[layerId]);
  }
  if (!map._geeLayers) map._geeLayers = {};
  const layer = L.tileLayer(tileUrl, { maxZoom:14, opacity:0.88 });
  map._geeLayers[layerId] = layer;
  layer.addTo(map);
  return layer;
}

function syncMaps(m1, m2) {
  let lock = false;
  const bind = (src, dst) => src.on('move', () => {
    if (lock) return;
    lock = true;
    dst.setView(src.getCenter(), src.getZoom(), { animate:false });
    lock = false;
  });
  bind(m1, m2); bind(m2, m1);
}

// ============================================================
// UI — RENDER FUNCTIONS
// ============================================================
const SITE_COLORS  = {
  bosque_fosil:'#ef4444', katalapi:'#22c55e', cochamo:'#10b981', maullin:'#3b82f6',
  kaikue:'#06b6d4', pumalin:'#10b981', chepu:'#06b6d4', alerzales:'#84cc16',
  aucar:'#8b5cf6', pulpito:'#a78bfa', puntalapa:'#7c3aed', quinchao:'#f59e0b',
  curaco:'#f97316', putemun:'#ec4899', huillinco:'#14b8a6', quilo:'#0ea5e9',
  islas_quilan:'#6366f1', 'putrihuén':'#d946ef'
};
const INDEX_COLORS = { NDVI:'#10b981', NDMI:'#3b82f6', NBR:'#f59e0b', NDWI:'#06b6d4', EVI:'#8b5cf6', PAI:'#f97316' };

function siteColor(siteId) { return SITE_COLORS[siteId] || '#10b981'; }
function indexColor(idx)    { return INDEX_COLORS[idx]   || '#10b981'; }

function renderSiteInfoCard(container, site) {
  container.innerHTML = `
    <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.06em;color:var(--text3);margin-bottom:.5rem">${site.type}</div>
    <div style="font-size:.8rem;color:var(--text2);line-height:1.55;margin-bottom:.7rem">${site.desc}</div>
    <div style="margin-bottom:.5rem">
      <div class="form-label" style="margin-bottom:.3rem">Índices recomendados</div>
      <div class="tags">${site.indices.map(i => `<span class="tag tag-eco">${i}</span>`).join('')}</div>
    </div>
    <div>
      <div class="form-label" style="margin-bottom:.3rem">Amenazas activas</div>
      <div class="tags">${site.threats.map(t => `<span class="tag tag-threat">${t}</span>`).join('')}</div>
    </div>
    <div style="margin-top:.7rem;font-size:.72rem;color:var(--text3);line-height:1.7">
      <strong style="color:var(--text2)">Área:</strong> ${site.area}<br>
      <strong style="color:var(--text2)">Administración:</strong> ${site.admin}
    </div>`;
}

// ── DASHBOARD ─────────────────────────────────────────────
function renderSiteCard(site, idx) {
  const d = site.demo;
  const cls = csiClass(d.csi);
  const col = scoreColor(d.csi);
  const trendArrow = d.trend >= 0 ? '↑' : '↓';
  const trendDir   = d.trend >= 0 ? 'up' : 'down';
  const alerts = getAlerts(site, d);
  const alertsHtml = alerts.map(a =>
    `<div class="alert-badge ${a.type}" title="${a.detail || ''}">⚠ ${a.msg}</div>` +
    (a.detail ? `<div class="alert-detail">${a.detail}</div>` : '')
  ).join('');
  const idxRows = [
    d.ndvi  != null ? `<span class='idx-chip ndvi'>NDVI ${d.ndvi.toFixed(2)}</span>`  : '',
    d.ndmi  != null ? `<span class='idx-chip ndmi'>NDMI ${d.ndmi.toFixed(2)}</span>`  : '',
    d.nbr   != null ? `<span class='idx-chip nbr'>NBR ${d.nbr.toFixed(2)}</span>`    : '',
    d.ndwi  != null ? `<span class='idx-chip ndwi'>NDWI ${d.ndwi.toFixed(2)}</span>` : ''
  ].filter(Boolean).join('');
  const circumference = 188;
  const offset = circumference * (1 - d.csi / 100);
  return `<div class="site-score-card ${cls.cls}" style="--sc:${col};--card-delay:${idx * 50}ms" data-site="${site.id}">
    <div class="card-site-name">${site.name}</div>
    <div class="card-site-type">${site.type}</div>
    <div class="score-display">
      <div class="score-gauge">
        <svg viewBox="0 0 80 80">
          <circle class="gauge-bg" cx="40" cy="40" r="30"/>
          <circle class="gauge-fill" cx="40" cy="40" r="30" style="stroke:${col};stroke-dashoffset:${offset}"/>
        </svg>
        <div class="score-number">${d.csi}<small>CSI</small></div>
      </div>
      <div class="score-meta">
        <div class="score-label">${cls.label}</div>
        <div class="score-trend ${trendDir}">
          <span class="arrow">${trendArrow}</span>
          <span>${Math.abs(d.trend * 100).toFixed(1)}%/año NDVI</span>
        </div>
        <div style="font-size:.68rem;color:var(--text3);margin-top:.3rem">
          ${state.apiReady ? 'Sentinel-2 · datos reales' : 'MODIS · datos demo'}
        </div>
      </div>
    </div>
    <div class="card-indices">${idxRows}</div>
    ${alertsHtml ? `<div class="card-alerts">${alertsHtml}</div>` : '<div class="card-no-alerts">✓ Sin alertas activas</div>'}
    <button class="card-action" onclick="goToMonitor('${site.id}')">→ Analizar en detalle</button>
  </div>`;
}

const ECO_META = {
  forest:   { label:'Bosques',  icon:'🌲', color:'#10b981' },
  wetland:  { label:'Humedales', icon:'💧', color:'#06b6d4' },
  peatland: { label:'Turberas', icon:'🟤', color:'#8b5cf6' }
};

function renderDashboard() {
  const allSites = Object.values(SITES);
  const cards = document.getElementById('site-cards');

  // ── Summary stats ──
  const totalSites = allSites.length;
  const avgCSI = Math.round(allSites.reduce((s,v) => s + v.demo.csi, 0) / totalSites);
  const alertCount = allSites.filter(s => s.demo.csi < 65).length;
  const trendDown = allSites.filter(s => s.demo.trend < -0.01).length;
  const totalHa = allSites.reduce((s,v) => s + parseFloat(String(v.area).replace(/[^\d.]/g,'')), 0);
  const haStr = totalHa >= 1000 ? `${(totalHa/1000).toFixed(0)}k` : totalHa.toFixed(0);

  const summaryHtml = `<div class="dashboard-summary">
    <div class="summary-stat"><div class="summary-value">${totalSites}</div><div class="summary-label">Áreas protegidas</div></div>
    <div class="summary-stat"><div class="summary-value">${haStr} <small>ha</small></div><div class="summary-label">Superficie total</div></div>
    <div class="summary-stat"><div class="summary-value" style="color:${scoreColor(avgCSI)}">${avgCSI}</div><div class="summary-label">CSI Promedio</div></div>
    <div class="summary-stat"><div class="summary-value" style="color:${alertCount > 0 ? 'var(--amber)' : 'var(--accent)'}">${alertCount}</div><div class="summary-label">Con alertas</div></div>
    <div class="summary-stat"><div class="summary-value" style="color:${trendDown > 0 ? '#ef4444' : 'var(--accent)'}">${trendDown}</div><div class="summary-label">Tendencia negativa</div></div>
  </div>`;

  // ── Group by ecosystem ──
  const grouped = {};
  allSites.forEach(site => {
    const eco = site.ecosystem || 'other';
    if (!grouped[eco]) grouped[eco] = [];
    grouped[eco].push(site);
  });

  let cardIdx = 0;
  const groupsHtml = ['forest','wetland','peatland'].filter(k => grouped[k]).map(eco => {
    const sites = grouped[eco];
    const m = ECO_META[eco] || { label:eco, icon:'📍', color:'#888' };
    const groupAvg = Math.round(sites.reduce((s,v) => s + v.demo.csi, 0) / sites.length);
    const cardsHtml = sites.map(site => renderSiteCard(site, cardIdx++)).join('');
    return `<div class="dashboard-group" style="--group-color:${m.color}">
      <div class="dashboard-group-header">
        <span class="group-label">${m.icon} ${m.label}</span>
        <span class="group-stats">${sites.length} sitios · CSI ${groupAvg}</span>
      </div>
      <div class="site-cards">${cardsHtml}</div>
    </div>`;
  }).join('');

  cards.innerHTML = summaryHtml + groupsHtml;

  setTimeout(() => {
    document.querySelectorAll('.gauge-fill').forEach(el => {
      el.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)';
    });
  }, 100);

  const el = document.getElementById('dashboard-update');
  if (el) {
    const d = new Date();
    const dateStr = d.toLocaleDateString('es-CL', { year:'numeric', month:'long', day:'numeric' });
    el.textContent = `${dateStr} · ${state.apiReady ? 'Sentinel-2 10m' : 'MODIS 250m'}`;
  }
}

function getAlerts(site, data) {
  const alerts = [];
  if (data.csi < 50)
    alerts.push({ type:'error', msg:`CSI ${data.csi} — DEGRADACIÓN`,
      detail:`Umbral crítico SBAP: ≥65 (Bueno). Acción: Inspección en terreno ≤30 días.` });
  else if (data.csi < 65)
    alerts.push({ type:'warn', msg:`CSI ${data.csi} — Zona Moderada`,
      detail:`Por debajo del umbral de gestión (65). Incrementar monitoreo quincenal.` });
  if (data.trend < -0.03)
    alerts.push({ type:'error', msg:`NDVI ${(data.trend*100).toFixed(1)}%/año — Pérdida acelerada`,
      detail:`Tendencia negativa significativa (umbral: −3%/año). Cruzar con CONAF/SNIT.` });
  else if (data.trend < -0.01)
    alerts.push({ type:'warn', msg:`NDVI ${(data.trend*100).toFixed(1)}%/año — Tendencia negativa`,
      detail:`Cambio gradual. Monitorear en próximo trimestre.` });
  if (data.nbr != null && data.nbr < 0.3)
    alerts.push({ type:'error', msg:`NBR ${data.nbr.toFixed(2)} — Perturbación detectada`,
      detail:`NBR < 0.3 indica quema reciente. Verificar con historial CONAF.` });
  if ((site.ecosystem === 'wetland' || site.ecosystem === 'peatland') && data.ndwi != null && data.ndwi < 0.2)
    alerts.push({ type:'warn', msg:`NDWI ${data.ndwi.toFixed(2)} — Pérdida de humedad`,
      detail:`Nivel hidrológico bajo. Posible drenaje o alteración antrópica.` });
  return alerts.slice(0, 3);
}

// ── HELPERS ────────────────────────────────────────────────
function fmtMonth(ym) {
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const [yr, mo] = ym.split('-');
  return `${months[parseInt(mo, 10) - 1]} ${yr}`;
}

function todayStr() { return new Date().toISOString().slice(0, 10); }

function fmtDate(iso) {
  // "2026-03-15" → "15 Mar 2026"
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const [yr, mo, dy] = iso.split('-');
  return `${parseInt(dy, 10)} ${months[parseInt(mo, 10) - 1]} ${yr}`;
}

function resetChangeStats() {
  ['cs-delta','cs-loss','cs-gain','cs-stable','cs-pixels'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = '—'; el.className = 'change-stat-val neutral'; }
  });
  const interp = document.getElementById('change-interpretation');
  if (interp) interp.innerHTML = '';
  // Reset after-map label and remove change badge
  const afterLabel = document.querySelector('.map-compare-label.after');
  if (afterLabel) afterLabel.textContent = 'Período actual';
  if (state.maps.after && state.maps.after._changeBadge) {
    state.maps.after.removeControl(state.maps.after._changeBadge);
    state.maps.after._changeBadge = null;
  }
}

// ── MONITOR ────────────────────────────────────────────────
function renderMonitorSidebar() {
  const site = SITES[state.monSite];
  const container = document.getElementById('mon-site-info');
  if (container) renderSiteInfoCard(container, site);
  const chipSite  = document.getElementById('mon-chip-site');
  const chipIndex = document.getElementById('mon-chip-index');
  if (chipSite)  chipSite.innerHTML  = `<strong>${site.name}</strong>`;
  if (chipIndex) chipIndex.innerHTML = `Índice: <strong>${state.monIndex}</strong>`;
}

function renderDemoStats() {
  const site  = SITES[state.monSite];
  const d     = site.demo;
  const color = indexColor(state.monIndex);
  const series = generateRealisticTimeSeries(state.monSite, state.monIndex, state.monStart, state.monEnd || todayStr());
  state.tsData = series;

  drawTimeSeries('ts-canvas', series, state.monIndex, color);
  updateStatsStrip(series, d.base_ndvi);
  renderCSIPanel(d.csi, d.csi_label, { veg:d.ndvi, hyd:d.ndmi || d.ndwi || 0.4, int:d.nbr }, site.ecosystem);
  document.getElementById('chart-index-label').textContent = state.monIndex;
  const endDate = state.monEnd || todayStr();
  document.getElementById('chart-footer').textContent =
    `MODIS Terra · NASA GIBS · ${series.length} observaciones · ${fmtMonth(state.monStart.slice(0,7))} – ${fmtMonth(endDate.slice(0,7))} · demo mode`;
  document.getElementById('mon-demo-badge').style.display = '';
  document.getElementById('mon-demo-badge').textContent = 'MODIS 250m · Demo';
}

function updateStatsStrip(series, baseVal) {
  if (!series || series.length === 0) return;
  const last      = series[series.length - 1];
  const trend     = trendPerYear(series);
  const vsBase    = baseVal ? ((last.value - baseVal) / baseVal * 100) : 0;
  const trendDir  = trend >= 0 ? 'up' : (trend < -0.03 ? 'critical' : 'down');
  const trendLbl  = trend >= 0 ? 'Recuperación' : (trend < -0.03 ? '⚠ Pérdida acelerada' : 'Pérdida gradual');

  document.getElementById('stat-last').textContent      = last.value.toFixed(3);
  document.getElementById('stat-last-date').textContent = fmtDate(last.date);
  document.getElementById('stat-trend').textContent     = `${trend >= 0 ? '+' : ''}${(trend * 100).toFixed(1)}%/año`;
  document.getElementById('stat-trend').className       = `stat-value ${trendDir}`;
  document.getElementById('stat-trend-desc').textContent = trendLbl;
  document.getElementById('stat-vs-base').textContent   = `${vsBase >= 0 ? '+' : ''}${vsBase.toFixed(1)}%`;
  document.getElementById('stat-vs-base').className     = `stat-value ${vsBase >= 0 ? 'up' : (vsBase < -10 ? 'critical' : 'down')}`;
  document.getElementById('stat-n').textContent         = series.length;
  document.getElementById('stat-period').textContent    = `${fmtMonth(series[0].date.slice(0,7))} – ${fmtMonth(last.date.slice(0,7))}`;
  // Chart header trend badge
  const badge = document.getElementById('chart-trend-badge');
  if (badge) {
    const sign = trend >= 0 ? '+' : '';
    const col  = trend >= 0 ? 'var(--accent)' : (trend < -0.03 ? 'var(--red)' : 'var(--amber)');
    badge.innerHTML = ` <span style="font-size:.72rem;font-weight:700;color:${col};font-family:var(--mono)">${sign}${(trend*100).toFixed(1)}%/año</span>`;
  }
}

function renderCSIPanel(score, _, components, ecosystem) {
  const cls = csiClass(score);
  const col = scoreColor(score);
  state.currentCSI = { score, cls, col };

  const el  = document.getElementById('csi-score');
  if (el) { el.textContent = score; el.className = `csi-score-num ${cls.cls}`; }
  const lbl = document.getElementById('csi-label');
  if (lbl) { lbl.textContent = `${cls.label} · CUSSEN-CSI v1.0`; lbl.className = `csi-score-label ${cls.cls}`; }

  const w = CSI_WEIGHTS[ecosystem] || CSI_WEIGHTS.forest;
  const breakdown = document.getElementById('csi-breakdown');
  if (!breakdown) return;
  const parts = [
    { name:'Vegetación', key:'veg', val:components.veg, w:w.veg, index:'NDVI' },
    { name:'Hidrología', key:'hyd', val:components.hyd, w:w.hyd, index:ecosystem === 'forest' ? 'NDMI' : 'NDWI' },
    { name:'Integridad', key:'int', val:components.int, w:w.int, index:'NBR' }
  ];
  breakdown.innerHTML = parts.map(p => {
    const pct    = Math.min(100, Math.round((p.val || 0) * 100 * (p.w * 3)));
    const barCol = (p.val || 0) >= 0.5 ? col : (p.val || 0) >= 0.3 ? '#f59e0b' : '#ef4444';
    return `<div class="csi-component">
      <div class="csi-comp-label">${p.name} <span style="color:var(--text3)">(peso ${Math.round(p.w*100)}%)</span></div>
      <div class="csi-comp-bar"><div class="csi-comp-fill" style="width:${pct}%;background:${barCol}"></div></div>
      <div class="csi-comp-val">${p.index}: <strong>${(p.val||0).toFixed(3)}</strong></div>
    </div>`;
  }).join('');

  const site  = SITES[state.monSite];
  const recos = getCSIRecommendations(score);
  const recosEl = document.getElementById('csi-recos');
  if (recosEl) recosEl.innerHTML = recos;
}

function getCSIRecommendations(score) {
  if (score >= 80) return `<div class='reco-ok'>✓ Estado óptimo. Mantener monitoreo trimestral. Sin acciones urgentes.</div>`;
  if (score >= 65) return `<div class='reco-warn'>→ Estado aceptable. Monitorear mensualmente. Verificar tendencias en 90 días.</div>`;
  if (score >= 50) return `<div class='reco-warn'>→ Estado moderado (bajo umbral 65).<br>· Inspección en terreno ≤60 días<br>· Evaluar presión antrópica<br>· Reportar a SBAP DR Los Lagos</div>`;
  return `<div class='reco-error'>⚠ <strong>ALERTA: degradación significativa.</strong><br>
    · Notificación inmediata SBAP Los Lagos<br>· Inspección ≤30 días<br>
    · Cruzar con Planet/Maxar para fecha exacta<br>· Registrar en SNIT/CONAF</div>`;
}

// ── SITES panel ────────────────────────────────────────────
const ECOSYSTEM_LABELS = {
  forest:   'Bosque templado lluvioso',
  wetland:  'Humedal costero',
  peatland: 'Turbera de Sphagnum'
};

function renderSitesPanel() {
  const grid = document.getElementById('sites-grid');
  if (!grid) return;
  grid.innerHTML = Object.values(SITES).map(site => {
    const col = siteColor(site.id);
    return `<div class="site-info-card" style="border-top:3px solid ${col}">
      <div class="site-info-title">${site.name}</div>
      <div class="site-info-type">${site.type}</div>
      <div class="site-info-desc">${site.desc}</div>
      <div class="tags">${site.indices.map(i => `<span class="tag tag-eco">${i}</span>`).join('')}</div>
      <div class="tags">${site.threats.map(t => `<span class="tag tag-threat">${t}</span>`).join('')}</div>
      <div class="site-meta-list">
        <div class="site-meta-item"><span class="site-meta-key">Ecosistema</span><span class="site-meta-val">${ECOSYSTEM_LABELS[site.ecosystem] || site.ecosystem}</span></div>
        <div class="site-meta-item"><span class="site-meta-key">Superficie</span><span class="site-meta-val">${site.area}</span></div>
        <div class="site-meta-item"><span class="site-meta-key">Admin.</span><span class="site-meta-val">${site.admin}</span></div>
        <div class="site-meta-item"><span class="site-meta-key">Centro</span>
          <span class="site-meta-val" style="font-family:var(--mono);font-size:.7rem">
            ${site.center[1].toFixed(3)}°S, ${Math.abs(site.center[0]).toFixed(3)}°W
          </span></div>
      </div>
      <button class="site-action-btn" onclick="goToMonitor('${site.id}')">Abrir en Monitor →</button>
    </div>`;
  }).join('');
}

function setChangeDefaults() {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  document.getElementById('ch-a-start').value = `${y - 1}-01-01`;
  document.getElementById('ch-a-end').value   = `${y}-${m}-${String(today.getDate()).padStart(2,'0')}`;
}

// ============================================================
// MAP SETUP
// ============================================================
function setupMaps() {
  const overviewMap = createLeafletMap('overview-map', [-72.5, -42.5], 7, 'osm');
  state.maps.overview = overviewMap;

  Object.values(SITES).forEach(site => {
    const col = siteColor(site.id);
    addSiteBoundary(overviewMap, site.bbox, col);
    const m = (site.bbox.south + site.bbox.north) / 2;
    const n = (site.bbox.west  + site.bbox.east)  / 2;
    L.circleMarker([m, n], { radius:8, color:col, fillColor:col, fillOpacity:.8, weight:2 })
      .bindPopup(`<div style="font-weight:700;font-size:.85rem">${site.name}</div>
                  <div style="font-size:.72rem;color:#64748b;margin:.1rem 0">${site.type}</div>
                  <div style="font-size:.75rem;margin-top:.4rem">CSI: <strong style="color:${scoreColor(site.demo.csi)}">${site.demo.csi}</strong> — ${csiClass(site.demo.csi).label}</div>
                  <div style="font-size:.7rem;color:#64748b;margin-top:.25rem">${site.area} · ${site.admin}</div>
                  <button onclick="goToMonitor('${site.id}')" style="margin-top:8px;width:100%;padding:5px 10px;background:${col};border:none;border-radius:5px;color:#fff;font-size:.75rem;font-weight:600;cursor:pointer">Analizar →</button>`)
      .addTo(overviewMap);
  });

  const monSite  = SITES[state.monSite];
  const monMap   = createLeafletMap('monitor-map', monSite.center, monSite.zoom, 'esri');
  state.maps.monitor = monMap;
  state.maps.monitorBoundary = addSiteBoundary(monMap, monSite.bbox);

  const beforeMap = createLeafletMap('before-map', monSite.center, monSite.zoom, 'esri');
  const afterMap  = createLeafletMap('after-map',  monSite.center, monSite.zoom, 'esri');
  state.maps.before = beforeMap;
  state.maps.after  = afterMap;
  state.maps.beforeBoundary = addSiteBoundary(beforeMap, monSite.bbox, '#f59e0b');
  state.maps.afterBoundary  = addSiteBoundary(afterMap,  monSite.bbox, '#10b981');
  syncMaps(beforeMap, afterMap);

  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      setTimeout(() => {
        Object.values(state.maps).forEach(m => { if (m && m.invalidateSize) m.invalidateSize(); });
      }, 120);
    });
  });
}

function updateMonitorMap(siteId) {
  const site = SITES[siteId];
  if (!site || !state.maps.monitor) return;
  if (state.roi) clearROI();
  state.maps.monitor.setView([site.center[1], site.center[0]], site.zoom);
  if (state.maps.monitorBoundary) state.maps.monitor.removeLayer(state.maps.monitorBoundary);
  state.maps.monitorBoundary = addSiteBoundary(state.maps.monitor, site.bbox);
}

function updateChangeMaps(siteId) {
  const site = SITES[siteId];
  if (!site) return;
  if (state.roi) clearROI();
  [state.maps.before, state.maps.after].forEach(m => {
    if (!m) return;
    m.setView([site.center[1], site.center[0]], site.zoom);
  });
  // Update site boundary rectangles
  if (state.maps.beforeBoundary) state.maps.before.removeLayer(state.maps.beforeBoundary);
  if (state.maps.afterBoundary)  state.maps.after.removeLayer(state.maps.afterBoundary);
  state.maps.beforeBoundary = addSiteBoundary(state.maps.before, site.bbox, '#f59e0b');
  state.maps.afterBoundary  = addSiteBoundary(state.maps.after,  site.bbox, '#10b981');
}

// ============================================================
// ACTIONS — async (API or GIBS fallback)
// ============================================================
async function runAnalysis() {
  const site  = SITES[state.monSite];
  const btn   = document.getElementById('btn-analyze');
  const start = document.getElementById('mon-start').value;
  const end   = document.getElementById('mon-end').value || todayStr();
  const cloud = parseInt(document.getElementById('mon-cloud').value) || 30;
  const layer = document.getElementById('mon-layer').value;

  state.monStart = start; state.monEnd = end; state.monCloud = cloud; state.monLayer = layer;

  btn.classList.add('loading');
  btn.querySelector('.btn-label').textContent = 'Analizando...';
  btn.disabled = true;

  try {
    if (state.apiReady) {
      // Real Sentinel-2 from backend
      const [tilesData, tsData] = await Promise.all([
        apiFetch('tiles', { site:state.monSite, index:layer, start, end, cloud }),
        apiFetch('timeseries', { site:state.monSite, index:state.monIndex, start, end, cloud })
      ]);

      addGEETiles(state.maps.monitor, tilesData.tileUrl, 'main');
      document.getElementById('mon-demo-badge').style.display = 'none';

      state.tsData = tsData.series;
      drawTimeSeries('ts-canvas', tsData.series, state.monIndex, indexColor(state.monIndex));
      updateStatsStrip(tsData.series, site.demo.base_ndvi);
      document.getElementById('chart-index-label').textContent = state.monIndex;
      document.getElementById('chart-footer').textContent =
        `Sentinel-2 SR Harmonized · ${tsData.series.length} imágenes · ${fmtMonth(start.slice(0,7))} – ${fmtMonth(end.slice(0,7))}`;

      if (tsData.series.length >= 10) {
        const f10 = tsData.series.slice(0, 10).map(p => p.value);
        const l10 = tsData.series.slice(-10).map(p => p.value);
        const bV  = f10.reduce((a,b) => a+b) / 10;
        const rV  = l10.reduce((a,b) => a+b) / 10;
        const res = computeCSI(rV, rV*.9, rV*.85, bV, bV*.9, bV*.85, site.ecosystem);
        renderCSIPanel(res.score, csiClass(res.score).label, { veg:rV, hyd:rV*.9, int:rV*.85 }, site.ecosystem);
      }
      showNotif('Análisis Sentinel-2 completo.', 'success');
    } else {
      // NASA GIBS MODIS tiles + realistic demo stats
      // NDVI → ndvi 8-day; RGB → trueColor; NDMI/NBR/NDWI → falseColor (Bands 7-2-1, highlights vegetation stress)
      const gibsLayer = layer === 'NDVI' ? 'ndvi' : (layer === 'RGB' ? 'trueColor' : 'falseColor');
      const opacityEl = document.getElementById('mon-opacity');
      const curOpacity = opacityEl ? parseInt(opacityEl.value) / 100 : 0.92;
      addGIBSLayer(state.maps.monitor, gibsLayer, end, 'main', curOpacity);
      if (layer === 'NDVI') {
        addNDVILegend(state.maps.monitor);
      } else if (state.maps.monitor._ndviLegend) {
        state.maps.monitor.removeControl(state.maps.monitor._ndviLegend);
        state.maps.monitor._ndviLegend = null;
      }
      renderDemoStats();
      showNotif(`MODIS ${layer === 'NDVI' ? 'NDVI 8-día' : 'color natural'} cargado (250m). Para Sentinel-2 10m, registra el service account con GEE.`, 'info');
    }
  } catch (e) {
    const msg = e.name === 'TimeoutError' || e.name === 'AbortError'
      ? 'Timeout — revisa la conexión e intenta de nuevo'
      : e.message?.startsWith('API') ? `Backend respondió con error (${e.message})`
      : 'Error de red — modo demo activo';
    showNotif(msg, 'error');
    renderDemoStats();
  } finally {
    btn.classList.remove('loading');
    btn.querySelector('.btn-label').textContent = '🛰 Analizar';
    btn.disabled = false;
  }
}

async function runChangeDetection() {
  const site   = SITES[state.chSite];
  const btn    = document.getElementById('btn-detect');
  const bStart = document.getElementById('ch-b-start').value;
  const bEnd   = document.getElementById('ch-b-end').value;
  const aStart = document.getElementById('ch-a-start').value;
  const aEnd   = document.getElementById('ch-a-end').value;
  const idx    = document.getElementById('ch-index').value;

  // Ensure site boundary rectangles are correct for current chSite (without clearing ROI)
  if (state.maps.beforeBoundary) state.maps.before && state.maps.before.removeLayer(state.maps.beforeBoundary);
  if (state.maps.afterBoundary)  state.maps.after  && state.maps.after.removeLayer(state.maps.afterBoundary);
  state.maps.beforeBoundary = state.maps.before && addSiteBoundary(state.maps.before, site.bbox, '#f59e0b');
  state.maps.afterBoundary  = state.maps.after  && addSiteBoundary(state.maps.after,  site.bbox, '#10b981');

  btn.classList.add('loading');
  btn.querySelector('.btn-label').textContent = 'Detectando...';
  btn.disabled = true;

  try {
    if (state.apiReady) {
      const data = await apiFetch('changes', { site:state.chSite, index:idx, bStart, bEnd, aStart, aEnd });
      addGEETiles(state.maps.before, data.beforeTileUrl, 'base');
      addGEETiles(state.maps.after, data.changeTileUrl, 'delta');
      document.getElementById('ch-before-demo').style.display = 'none';
      updateChangeStats(data.stats, idx, bStart, bEnd, aStart, aEnd);
      showChangeBadge(state.maps.after, data.stats);
      showNotif('Detección de cambios Sentinel-2 completada.', 'success');
    } else {
      // Esri World Imagery + MODIS NDVI 8-day composite overlay
      // NDVI is a cloud-free composite — always shows vegetation even on cloudy days
      const baseDate    = getRepresentativeDate(bStart, bEnd);
      const currentDate = getRepresentativeDate(aStart, aEnd);

      // 0.82 opacity — NDVI clearly shows vegetation health over Esri base
      addGIBSLayer(state.maps.before, 'ndvi', baseDate,    'base',  0.82);
      addGIBSLayer(state.maps.after,  'ndvi', currentDate, 'delta', 0.82);

      // If ROI drawn: fit maps to ROI. Otherwise zoom to z9 for MODIS clarity
      if (state.roi) {
        const opts = { padding:[16,16], animate:true };
        state.maps.before.fitBounds(state.roi, opts);
        state.maps.after.fitBounds(state.roi, opts);
      } else {
        const site9 = SITES[state.chSite];
        const siteBounds = L.latLngBounds(
          [site9.bbox.south, site9.bbox.west],
          [site9.bbox.north, site9.bbox.east]
        );
        [state.maps.before, state.maps.after].forEach(m => {
          m.fitBounds(siteBounds, { padding:[20,20], animate:true });
        });
      }

      // NDVI legend on both maps
      addNDVILegend(state.maps.before);
      addNDVILegend(state.maps.after);

      document.getElementById('ch-before-demo').style.display = '';
      document.getElementById('ch-before-demo').textContent = `NDVI · ${fmtMonth(baseDate.slice(0,7))}`;

      // Update map labels with actual dates
      const beforeLabel = document.querySelector('.map-compare-label.before');
      if (beforeLabel) beforeLabel.textContent = `Base · ${fmtMonth(bStart.slice(0,7))}`;
      const afterLabel = document.querySelector('.map-compare-label.after');
      if (afterLabel) afterLabel.textContent = `Actual · ${fmtMonth(aEnd.slice(0,7))}`;

      // Stats — use ROI bbox if defined (correct cos(lat) area formula)
      const bbox = activeBBox(state.chSite);
      const roiBounds = state.roi ||
        L.latLngBounds([bbox.south, bbox.west], [bbox.north, bbox.east]);
      const d = site.demo;
      const years = Math.abs((new Date(currentDate) - new Date(baseDate)) / (365.25 * 86400000));
      const drift = d.trend * years;
      const demoStats = {
        mean:      +drift.toFixed(4),
        pctLoss:   drift < 0 ? Math.min(35, +(Math.abs(drift) * 180).toFixed(1)) : 2.1,
        pctGain:   drift > 0 ? Math.min(25, +(drift * 180).toFixed(1)) : 1.4,
        pctStable: 0,
        nPixels:   roiPixelCount(roiBounds, 250)
      };
      demoStats.pctStable = Math.max(0, +(100 - demoStats.pctLoss - demoStats.pctGain).toFixed(1));
      updateChangeStats(demoStats, idx, bStart, bEnd, aStart, aEnd);
      showChangeBadge(state.maps.after, demoStats);
      const roiLabel = state.roi ? ` · ROI ${Math.round(roiAreaHa(state.roi)).toLocaleString('es-CL')} ha` : '';
      const net = demoStats.pctLoss - demoStats.pctGain;
      const notifMsg = net > 20 ? `⚠ Pérdida neta ${net.toFixed(1)}% — acción requerida${roiLabel}` :
                       net > 5  ? `Cambio neto ${net.toFixed(1)}% · ${baseDate} → ${currentDate}${roiLabel}` :
                       `Sin cambios significativos (<5%) · ${baseDate} → ${currentDate}${roiLabel}`;
      showNotif(notifMsg, net > 20 ? 'error' : net > 5 ? 'info' : 'success');
    }
  } catch (e) {
    const msg = e.name === 'TimeoutError' || e.name === 'AbortError'
      ? 'Timeout en detección — revisa la conexión'
      : e.message?.startsWith('API') ? `Backend: ${e.message}`
      : 'Error de red en detección de cambios';
    showNotif(msg, 'error');
  } finally {
    btn.classList.remove('loading');
    btn.querySelector('.btn-label').textContent = '🔍 Detectar cambios';
    btn.disabled = false;
  }
}

function showChangeBadge(map, stats) {
  if (map._changeBadge) map.removeControl(map._changeBadge);
  const badge = L.control({ position: 'topright' });
  badge.onAdd = function() {
    const net = stats.pctLoss - stats.pctGain;
    const col = net > 20 ? '#ef4444' : net > 10 ? '#f97316' : net > 5 ? '#f59e0b' : '#10b981';
    const sign = net > 0 ? '↓' : '↑';
    const div = L.DomUtil.create('div');
    div.style.cssText = [
      'background:rgba(6,11,20,.92)',
      'border:2px solid ' + col,
      'border-radius:8px',
      'padding:8px 14px',
      'font-family:"JetBrains Mono",monospace',
      'pointer-events:none',
      'text-align:center',
      'min-width:96px',
      'box-shadow:0 2px 12px rgba(0,0,0,.5)'
    ].join(';');
    div.innerHTML =
      `<div style="font-size:.65rem;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px">Cambio neto</div>` +
      `<div style="font-size:1.6rem;font-weight:800;color:${col};line-height:1.1">${sign} ${Math.abs(net).toFixed(1)}%</div>` +
      `<div style="font-size:.58rem;color:#64748b;margin-top:3px">pérdida ${stats.pctLoss}% · ganancia ${stats.pctGain}%</div>`;
    return div;
  };
  badge.addTo(map);
  map._changeBadge = badge;
}

function updateChangeStats(stats, idx, bStart, _bEnd, _aStart, aEnd) {
  document.getElementById('cs-delta').textContent  = `${stats.mean >= 0 ? '+' : ''}${stats.mean}`;
  document.getElementById('cs-delta').className    = `change-stat-val ${stats.mean >= 0 ? 'gain' : 'loss'}`;
  document.getElementById('cs-loss').textContent   = `${stats.pctLoss}%`;
  document.getElementById('cs-gain').textContent   = `${stats.pctGain}%`;
  document.getElementById('cs-stable').textContent = `${stats.pctStable}%`;
  document.getElementById('cs-pixels').textContent = stats.nPixels.toLocaleString('es-CL');
  const pixLbl = document.getElementById('cs-pixels-label');
  if (pixLbl) pixLbl.textContent = state.apiReady ? 'Píxeles (30m)' : 'Píxeles (250m)';

  const site     = SITES[state.chSite];
  let severityClass, severityText, actionText;
  if (stats.pctLoss > 20) {
    severityClass = 'reco-error';
    severityText  = '⚠ DEGRADACIÓN SIGNIFICATIVA (>20% del área)';
    actionText    = `Notificación urgente SBAP DR Los Lagos. Inspección ≤30 días. Cruzar con CONAF/SNIT.`;
  } else if (stats.pctLoss > 10) {
    severityClass = 'reco-warn';
    severityText  = '→ Cambio moderado (10–20% del área)';
    actionText    = `Verificar en terreno ≤60 días. Incrementar monitoreo mensual.`;
  } else if (stats.pctLoss > 5) {
    severityClass = 'reco-warn';
    severityText  = '→ Cambio leve (5–10%)';
    actionText    = `Monitorear tendencia en próximos 2 periodos.`;
  } else {
    severityClass = 'reco-ok';
    severityText  = '✓ Sin cambios significativos (<5%)';
    actionText    = `Estado estable. Mantener monitoreo regular.`;
  }
  document.getElementById('change-interpretation').innerHTML =
    `<div style="font-size:.78rem;font-weight:600;color:var(--text);margin-bottom:.4rem">Análisis ${idx} · ${site.name}</div>
     <div style="font-size:.72rem;color:var(--text3);margin-bottom:.6rem">${fmtMonth(bStart.slice(0,7))} → ${fmtMonth(aEnd.slice(0,7))}</div>
     <div class="${severityClass}" style="margin-bottom:.6rem"><strong>${severityText}</strong></div>
     <div style="font-size:.73rem;color:var(--text2);line-height:1.6;margin-bottom:.5rem">${actionText}</div>
     <div style="font-size:.68rem;color:var(--text3)">
       Pérdida: ${stats.pctLoss}% · Ganancia: ${stats.pctGain}% · Estable: ${stats.pctStable}%<br>
       Metodología: CUSSEN-CSI v1.0 · Δ umbral = ±0.1 · ${state.apiReady ? 'Sentinel-2 30m' : 'MODIS 250m'}</div>`;
}

// ============================================================
// URL HASH — DEEP LINKING
// ============================================================
function updateURLHash() {
  history.replaceState(null, '', `#${state.monSite}/${state.monIndex}`);
}

function readURLHash() {
  const hash = location.hash.slice(1);
  if (!hash) return false;
  const [siteId, idx] = hash.split('/');
  let found = false;
  if (siteId && SITES[siteId]) {
    state.monSite = siteId;
    const sel = document.getElementById('mon-site');
    if (sel) sel.value = siteId;
    found = true;
  }
  const validIdx = ['NDVI','NDMI','NBR','NDWI','EVI','PAI'];
  if (idx && validIdx.includes(idx)) {
    state.monIndex = idx;
    const sel = document.getElementById('mon-index');
    if (sel) sel.value = idx;
  }
  return found;
}

// ============================================================
// SELECTORS & NAVIGATION
// ============================================================
function populateSiteSelects() {
  const opts = Object.values(SITES).map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  document.getElementById('mon-site').innerHTML = opts;
  document.getElementById('ch-site').innerHTML  = opts;
}

function switchTab(tabId) {
  state.activeTab = tabId;
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  // Sync both desktop and mobile nav buttons
  document.querySelectorAll('[data-tab]').forEach(t => t.classList.remove('active'));
  const panel = document.getElementById(`tab-${tabId}`);
  if (panel) panel.classList.add('active');
  document.querySelectorAll(`[data-tab="${tabId}"]`).forEach(b => b.classList.add('active'));
  setTimeout(() => {
    Object.values(state.maps).forEach(m => { if (m && m.invalidateSize) m.invalidateSize(); });
    // Redraw chart when monitor tab becomes visible (canvas had 0 width while hidden)
    if (tabId === 'monitor' && state.tsData && state.tsData.length > 0) {
      drawTimeSeries('ts-canvas', state.tsData, state.monIndex, indexColor(state.monIndex));
    }
    // Auto-run change detection on first visit to Changes tab
    if (tabId === 'changes' && !state.changesLoaded) {
      state.changesLoaded = true;
      runChangeDetection();
    }
  }, 80);
}

function toggleSidebar(sidebarId, toggleBtnId) {
  const sidebar   = document.getElementById(sidebarId);
  const toggleBtn = document.getElementById(toggleBtnId);
  const backdrop  = document.getElementById('sidebar-backdrop');
  if (!sidebar || !toggleBtn) return;
  const isOpen = sidebar.classList.toggle('open');
  toggleBtn.classList.toggle('open', isOpen);
  toggleBtn.setAttribute('aria-expanded', isOpen);
  if (backdrop) {
    backdrop.classList.toggle('show', isOpen);
    backdrop.onclick = () => toggleSidebar(sidebarId, toggleBtnId);
  }
  // Invalidate map size after sidebar animation (maps may have resized)
  setTimeout(() => {
    Object.values(state.maps).forEach(m => { if (m && m.invalidateSize) m.invalidateSize(); });
  }, 380);
}

function goToMonitor(siteId) {
  switchTab('monitor');
  document.getElementById('mon-site').value = siteId;
  state.monSite = siteId;
  updateMonitorMap(siteId);
  renderMonitorSidebar();
  updateURLHash();
  runAnalysis();  // Auto-load GIBS tiles + stats
}

// ============================================================
// NOTIFICATIONS
// ============================================================
let _notifTimer;
function showNotif(msg, type) {
  const el = document.getElementById('notification');
  if (!el) return;
  const icons = { success: '✓ ', error: '⚠ ', info: '· ' };
  el.textContent = (icons[type] || '· ') + msg;
  el.className   = `show ${type || 'info'}`;
  clearTimeout(_notifTimer);
  const duration = type === 'success' ? 3000 : type === 'error' ? 6000 : 5000;
  _notifTimer = setTimeout(() => el.classList.remove('show'), duration);
}

// ============================================================
// CSV EXPORT
// ============================================================
function exportCSV() {
  if (!state.tsData || state.tsData.length === 0) {
    showNotif('Primero ejecuta un análisis', 'info');
    return;
  }
  const site    = SITES[state.monSite];
  const endDate = state.monEnd || todayStr();
  const source  = state.apiReady
    ? 'Sentinel-2 SR Harmonized · ESA · Google Earth Engine'
    : 'MODIS Terra · NASA GIBS · 250m · demo mode';
  const meta = [
    `# SBAP Monitor — Cussen SpA`,
    `# Sitio: ${site.name} (${site.id})`,
    `# Índice: ${state.monIndex}`,
    `# Período: ${fmtMonth(state.monStart.slice(0,7))} – ${fmtMonth(endDate.slice(0,7))}`,
    `# Fuente: ${source}`,
    `# CSI actual: ${state.currentCSI ? state.currentCSI.score + ' — ' + state.currentCSI.cls.label : 'N/A'}`,
    `# Exportado: ${new Date().toISOString()}`,
    ``
  ].join('\n');
  const rows = [['fecha', state.monIndex], ...state.tsData.map(p => [p.date, p.value])];
  const csv  = meta + rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `SBAP_${site.id}_${state.monIndex}_${endDate.slice(0,7)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const today = todayStr();
  document.getElementById('mon-end').value = today;
  state.monEnd = today;
  setChangeDefaults();

  populateSiteSelects();
  const _hashDeepLink = readURLHash();  // Pre-set site/index from URL hash if present

  // Keyboard: Escape closes open mobile sidebars + chart tooltip
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    ['mon-sidebar', 'ch-sidebar'].forEach(id => {
      const s = document.getElementById(id);
      const toggle = id.replace('sidebar', 'sidebar-toggle');
      if (s && s.classList.contains('open')) toggleSidebar(id, toggle);
    });
    const tip = document.getElementById('ts-tooltip');
    const xh  = document.getElementById('chart-crosshair');
    if (tip) tip.style.display = 'none';
    if (xh)  xh.style.display = 'none';
  });

  // Clear period preset highlight when dates are manually changed
  ['mon-start', 'mon-end'].forEach(id => {
    document.getElementById(id).addEventListener('change', () => {
      document.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('active'));
    });
  });

  // Period preset buttons
  document.querySelectorAll('.btn-preset').forEach(btn => {
    btn.addEventListener('click', function() {
      const years = parseInt(this.dataset.years, 10);
      const today = todayStr();
      const start = years === 0
        ? '2000-01-01'  // Max: MODIS data available from 2000
        : new Date(new Date().setFullYear(new Date().getFullYear() - years)).toISOString().slice(0,10);
      document.getElementById('mon-start').value = start;
      document.getElementById('mon-end').value = today;
      state.monStart = start; state.monEnd = today;
      document.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    });
  });

  document.getElementById('mon-cloud').addEventListener('input', function() {
    document.getElementById('cloud-val').textContent = this.value;
    state.monCloud = parseInt(this.value);
  });

  document.getElementById('mon-opacity').addEventListener('input', function() {
    document.getElementById('opacity-val').textContent = this.value;
    const layer = state.maps.monitor && state.maps.monitor._geeLayers && state.maps.monitor._geeLayers['main'];
    if (layer) layer.setOpacity(parseInt(this.value) / 100);
  });

  // Desktop + mobile nav tabs
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Mobile sidebar toggles
  const monToggle = document.getElementById('mon-sidebar-toggle');
  if (monToggle) monToggle.addEventListener('click', () => toggleSidebar('mon-sidebar', 'mon-sidebar-toggle'));
  const chToggle = document.getElementById('ch-sidebar-toggle');
  if (chToggle)  chToggle.addEventListener('click', () => toggleSidebar('ch-sidebar', 'ch-sidebar-toggle'));

  document.getElementById('btn-connect').addEventListener('click', () => {
    showNotif('· Verificando API...', 'info');
    checkApiHealth();
  });

  document.getElementById('btn-analyze').addEventListener('click', () => {
    state.monSite  = document.getElementById('mon-site').value;
    state.monIndex = document.getElementById('mon-index').value;
    renderMonitorSidebar();
    runAnalysis();
  });

  document.getElementById('mon-site').addEventListener('change', function() {
    state.monSite = this.value;
    updateMonitorMap(this.value);
    renderMonitorSidebar();
    updateURLHash();
    runAnalysis();  // Reload GIBS tiles + stats for new site
  });

  document.getElementById('mon-index').addEventListener('change', function() {
    state.monIndex = this.value;
    updateURLHash();
    document.getElementById('chart-index-label').textContent = this.value;
    // Regenerate demo series for the new index so chart data matches the selected index
    const newSeries = generateRealisticTimeSeries(state.monSite, this.value, state.monStart, state.monEnd || todayStr());
    state.tsData = newSeries;
    drawTimeSeries('ts-canvas', newSeries, this.value, indexColor(this.value));
    updateStatsStrip(newSeries, SITES[state.monSite].demo.base_ndvi);
  });

  // Auto-reload GIBS when map layer changes (no need to re-press Analizar)
  document.getElementById('mon-layer').addEventListener('change', function() {
    state.monLayer = this.value;
    if (!state.tsData) return;  // Skip if no analysis has run yet
    const end = state.monEnd || todayStr();
    const gibsLayer = this.value === 'NDVI' ? 'ndvi' : (this.value === 'RGB' ? 'trueColor' : 'falseColor');
    const opacityEl = document.getElementById('mon-opacity');
    const curOpacity = opacityEl ? parseInt(opacityEl.value) / 100 : 0.92;
    addGIBSLayer(state.maps.monitor, gibsLayer, end, 'main', curOpacity);
    if (this.value === 'NDVI') {
      addNDVILegend(state.maps.monitor);
    } else if (state.maps.monitor._ndviLegend) {
      state.maps.monitor.removeControl(state.maps.monitor._ndviLegend);
      state.maps.monitor._ndviLegend = null;
    }
  });

  document.getElementById('btn-detect').addEventListener('click', () => {
    state.chSite  = document.getElementById('ch-site').value;
    state.chIndex = document.getElementById('ch-index').value;
    runChangeDetection();
  });

  document.getElementById('ch-site').addEventListener('change', function() {
    state.chSite = this.value;
    updateChangeMaps(this.value);
    resetChangeStats();
    if (state.changesLoaded) runChangeDetection();  // Auto-re-run if tab has run before
  });

  document.getElementById('ch-index').addEventListener('change', function() {
    state.chIndex = this.value;
    resetChangeStats();
    if (state.changesLoaded) runChangeDetection();
  });

  // ROI draw tool — monitor tab
  const btnDrawROI  = document.getElementById('btn-draw-roi');
  const btnClearROI = document.getElementById('btn-clear-roi');
  if (btnDrawROI) {
    btnDrawROI.addEventListener('click', () => {
      if (state.maps.monitor && state.maps.monitor._roiMode) {
        disableROIMode();
      } else {
        enableROIMode(state.maps.monitor, 'btn-draw-roi');
      }
    });
  }
  if (btnClearROI) btnClearROI.addEventListener('click', clearROI);

  // ROI draw tool — compare tab
  const btnDrawROICh  = document.getElementById('btn-draw-roi-ch');
  const btnClearROICh = document.getElementById('btn-clear-roi-ch');
  if (btnDrawROICh) {
    btnDrawROICh.addEventListener('click', () => {
      if (state.maps.before && state.maps.before._roiMode) {
        disableROIMode();
      } else {
        enableROIMode(state.maps.before, 'btn-draw-roi-ch');
      }
    });
  }
  if (btnClearROICh) btnClearROICh.addEventListener('click', clearROI);

  document.getElementById('btn-share').addEventListener('click', () => {
    updateURLHash();
    navigator.clipboard.writeText(location.href).then(() => {
      showNotif('Enlace copiado — comparte la URL con tu equipo', 'success');
    }).catch(() => {
      showNotif('URL: ' + location.href, 'info');
    });
  });

  document.getElementById('btn-export-csv').addEventListener('click', exportCSV);
  document.getElementById('btn-export-png').addEventListener('click', () => {
    if (!state.tsData || state.tsData.length === 0) { showNotif('Primero ejecuta un análisis', 'info'); return; }
    const canvas = document.getElementById('ts-canvas');
    if (!canvas) return;
    const a = document.createElement('a');
    a.href     = canvas.toDataURL('image/png');
    a.download = `${state.monSite}_${state.monIndex}_${todayStr()}.png`;
    a.click();
  });

  document.addEventListener('click', e => {
    const card = e.target.closest('.site-score-card');
    if (card) {
      document.querySelectorAll('.site-score-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
    }
  });

  try { setupMaps(); } catch (e) { console.error('Map init failed:', e); showNotif('Error inicializando mapas — recarga la página', 'error'); }
  renderDashboard();
  renderMonitorSidebar();
  renderSitesPanel();
  renderDemoStats();
  setupChartTooltip();
  updateSidebarSource();

  // Redraw chart + invalidate maps on window resize (debounced)
  let _resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(() => {
      if (state.tsData && state.tsData.length > 0 && state.activeTab === 'monitor') {
        drawTimeSeries('ts-canvas', state.tsData, state.monIndex, indexColor(state.monIndex));
      }
      Object.values(state.maps).forEach(m => { if (m && m.invalidateSize) m.invalidateSize(); });
    }, 200);
  });

  // Check API health on load
  checkApiHealth();

  // Deep-link: if URL hash pointed to a specific site, navigate to Monitor tab
  if (_hashDeepLink) {
    switchTab('monitor');
    updateMonitorMap(state.monSite);
    renderMonitorSidebar();
    updateURLHash();
  }

  setTimeout(() => {
    const ls = document.getElementById('loading-screen');
    if (ls) ls.classList.add('hidden');
    setTimeout(() => { if (ls) ls.style.display = 'none'; }, 500);
  }, 600);
});

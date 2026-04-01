# Cussen Portfolio - Teledetección & Sustentabilidad

Portafolio profesional de proyectos de teledetección y análisis geoespacial, desplegado en [cussen.cl](https://cussen.cl).

## Estructura del Proyecto

```
cussen-clean/
├── public/                          # Carpeta de despliegue (Firebase Hosting)
│   ├── index.html                   # Página principal del portafolio
│   ├── 404.html                     # Página de error
│   ├── assets/                      # Recursos compartidos
│   │   ├── style.css               # Estilos globales
│   │   └── script.js               # JavaScript global
│   ├── framework/                   # Framework metodológico
│   │   └── index.html
│   └── proyectos/                   # 11 proyectos activos
│       ├── amazonia/               # Análisis Amazonía
│       ├── biochar/                # Proyectos de Biochar
│       ├── calbuco/                # Erupción volcán Calbuco
│       ├── DixieFire/              # Análisis incendio Dixie Fire
│       ├── incendio/               # Recuperación post-incendio
│       ├── KILAUEA/                # Análisis volcán Kilauea
│       ├── no2_santiago/           # Calidad de aire Santiago
│       ├── R/                      # Análisis con R (Chonchi)
│       ├── Relleno Pozo Áridos Colonia Alerce/
│       ├── ulex/                   # Especies invasoras
│       └── walterland/             # Manejo de tierras
│
├── archivos_grandes/                # Archivos fuente (NO desplegados)
│   ├── Amazonia/                   # Datos Amazonía
│   ├── Calbuco/                    # Datos Calbuco
│   ├── DixieFire/                  # Datos Dixie Fire
│   ├── Incendio/                   # Datos incendio
│   ├── Ulex/                       # Datos Ulex (3GB+ TIF files)
│   ├── WalterLand/                 # Datos WalterLand
│   ├── Scripts/                    # Scripts GEE y análisis
│   └── Documentos/                 # Documentación técnica
│
├── .firebase/                       # Cache de Firebase
├── .claude/                         # Configuración Claude Code
├── firebase.json                    # Configuración Firebase Hosting
├── .firebaserc                      # Proyecto Firebase activo
├── .gitignore                       # Archivos excluidos de git
├── package.json                     # Dependencias Node.js
└── README.md                        # Este archivo
```

## Proyectos Destacados

### 1. **Análisis de Degradación Histórica con R en Chonchi**
- **Tecnología**: R (Tidyverse, sf, terra)
- **Área**: 11,048 hectáreas
- **Resultado**: ~20,338 tCO2e/año de potencial de remoción
- **Archivos**: 2 informes HTML completos con análisis geoespacial

### 2. **Biochar - Secuestro de Carbono**
- **Simulador** interactivo de costos y beneficios
- **Análisis** de viabilidad económica
- **OPEX** y proyecciones

### 3. **Dixie Fire - Análisis de Incendio**
- Análisis multi-temporal del incendio Dixie Fire (California)
- Índice de severidad personalizado
- Infografías y visualizaciones

### 4. **Erupción Volcán Calbuco**
- Impacto de cenizas volcánicas
- Análisis NDVI pre y post-erupción
- Mapas de afectación

### 5. **NO2 Santiago - Calidad de Aire**
- Análisis de contaminación por NO2
- Datos Sentinel-5P
- Correlación con densidad poblacional

## Stack Tecnológico

### Plataformas de Datos
- **Google Earth Engine** (GEE)
- **Sentinel-2, Landsat 5/7/8**
- **SRTM, Planet Labs**

### Análisis y Visualización
- **Python** (Geopandas, GeoPandas)
- **R** (Tidyverse, sf, terra)
- **QGIS, ArcGIS Pro**
- **Machine Learning** (Random Forest)

### Desarrollo Web
- **HTML5, CSS3, JavaScript**
- **Firebase Hosting**
- **Responsive Design**

## Despliegue

El sitio está desplegado en **Firebase Hosting** y se actualiza con:

```bash
firebase deploy --only hosting
```

### Archivos Excluidos del Despliegue

Por configuración en `firebase.json`, los siguientes archivos NO se despliegan (solo se usan localmente):

- `**/*.tif`, `**/*.tiff` - Archivos GeoTIFF (pueden ser 3GB+)
- `**/*.qgs`, `**/*.qgz` - Proyectos QGIS
- `**/*.pdf`, `**/*.docx` - Documentos
- `**/*.aux.xml`, `**/*.ovr` - Metadatos GDAL (regenerables)
- `**/*.kmz`, `**/*.zip` - Archivos comprimidos

## Organización de Archivos

### Carpeta `public/proyectos/`
Cada proyecto contiene:
- `index.html` - Página principal del proyecto
- `analisis.html` o `infografia.html` - Contenido detallado
- `assets/` - Recursos específicos (imágenes, datos pequeños)
- Scripts JavaScript optimizados

### Carpeta `archivos_grandes/`
Organizada por proyecto:
- **Datos fuente** (TIF, DIM, CSV)
- **Proyectos QGIS** (.qgs, .qgz)
- **Scripts GEE** y análisis
- **Documentación técnica**

**Nota**: Esta carpeta contiene archivos de 3GB+ que no se despliegan.

## Desarrollo

### Agregar un Nuevo Proyecto

1. Crear carpeta en `public/proyectos/nombre_proyecto/`
2. Crear `index.html` siguiendo la estructura existente
3. Agregar tarjeta del proyecto en `public/index.html`
4. Archivos grandes → `archivos_grandes/NombreProyecto/`
5. Desplegar con `firebase deploy --only hosting`

### Mantener Colores y Diseño

El diseño actual está definido en:
- **CSS**: `public/assets/style.css`
- **Paleta de colores**:
  - Verde neón: `#00ff88`
  - Azul: `#0088ff`
  - Fondo oscuro: `#0a0a0a`
  - Texto: `#ffffff`, `#a0a0a0`

**Importante**: Mantener esta paleta y estructura de diseño para nuevos proyectos.

## Próximos Pasos

- [ ] Incorporar nuevas líneas de proyectos
- [ ] Expandir portafolio con más casos de estudio
- [ ] Optimizar imágenes para web
- [ ] Considerar almacenamiento externo para archivos 3GB+

## Contacto

**Pablo Cussen**
- Email: [contacto@cussen.cl](mailto:contacto@cussen.cl)
- Sitio: [cussen.cl](https://cussen.cl)
- Ubicación: Patagonia, Chile

---

**Última actualización**: 2025-01-26
**Versión**: 2.0 (Estructura reorganizada y documentada)

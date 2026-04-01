# Informe Técnico: Análisis de Deforestación Amazónica

## Proyecto de Teledetección - Amazon Rainforest Analysis

**Autor:** Pablo Cussen
**Fecha:** 2024
**Tecnologías:** Google Earth Engine, Sentinel-2, Landsat

---

## Resumen Ejecutivo

Este proyecto analiza los cambios en la cobertura forestal de la Amazonia utilizando series temporales de imágenes satelitales. El análisis se centra en detectar áreas de deforestación y cambios en el uso del suelo mediante índices espectrales.

## Metodología

### Fuentes de Datos
- **Sentinel-2 MSI**: Imágenes multiespectrales de 10m de resolución
- **Landsat 8 OLI**: Datos históricos para análisis multitemporal
- **Google Earth Engine**: Plataforma de procesamiento

### Índices Calculados
1. **NDVI** (Normalized Difference Vegetation Index)
   - Fórmula: `(NIR - Red) / (NIR + Red)`
   - Rango: -1 a 1
   - Valores altos (>0.6) indican vegetación densa

2. **NDMI** (Normalized Difference Moisture Index)
   - Fórmula: `(NIR - SWIR) / (NIR + SWIR)`
   - Detecta contenido de humedad en vegetación

### Análisis Temporal
- Período analizado: 2015-2024
- Frecuencia de monitoreo: Mensual
- Preprocesamiento: Máscara de nubes con QA60

## Resultados Preliminares

- Detección de zonas de cambio en uso de suelo
- Identificación de patrones estacionales de vegetación
- Mapeo de áreas de deforestación activa

## Visualizaciones

Los resultados se presentan mediante:
- Mapas de cambio temporal
- Gráficos de series de tiempo
- Comparaciones multi-fecha

## Scripts Disponibles

El script de Google Earth Engine utilizado está disponible para descarga. Incluye:
- Definición de área de interés
- Filtrado de colecciones
- Cálculo de índices
- Exportación de resultados

## Conclusiones

El análisis satelital permite un monitoreo efectivo y a bajo costo de cambios en la Amazonia. Los resultados pueden utilizarse para:
- Gestión forestal
- Alertas tempranas de deforestación
- Planificación de conservación

---

**Contacto:** pablo@cussen.cl
**Sitio Web:** https://cussen.cl

# ==============================================================================
# ANALISIS REGIONAL DE ULEX EUROPAEUS - REGION DE LOS LAGOS
# Framework CUSSEN - Teledeteccion con Sentinel-2
# ==============================================================================
# Autor: Pablo Cussen Eltit | pablo@cussen.cl
# Fecha: Febrero 2026
# Fuente: Random Forest en Google Earth Engine (Sentinel-2, 10m)
# Periodo de analisis: Agosto-Diciembre 2024 (floracion del Ulex)
# ==============================================================================

rm(list = ls())
gc()

# --- Configuracion -----------------------------------------------------------
options(scipen = 999, digits = 4, stringsAsFactors = FALSE)

output_path <- "G:/Mi unidad/cussen-clean/public/proyectos/1-Teledeteccion/1-ulex/outputs/"
dir.create(output_path, showWarnings = FALSE, recursive = TRUE)

# --- Librerias ----------------------------------------------------------------
packages <- c("tidyverse", "scales", "ggplot2", "patchwork", "jsonlite")

for (pkg in packages) {
  if (!require(pkg, character.only = TRUE, quietly = TRUE)) {
    install.packages(pkg)
    library(pkg, character.only = TRUE)
  }
}

# ==============================================================================
# 1. DATOS CALIBRADOS - Mapeo Regional Ulex europaeus
# ==============================================================================
# Resultados del modelo Random Forest (Sentinel-2, 10m)
# Precision global: 86%, Kappa: 0.72
# 6 indices espectrales: NDVI, SAVI, NDMI, NBR2, YFI, NDRE
# ==============================================================================

# --- Datos regionales (3 regiones mapeadas) -----------------------------------
regiones <- tibble(
  region = c("Los Lagos", "Los Rios", "Aysen"),
  biomasa_ton = c(52800, 36500, 5700),
  superficie_ha = c(18150, 12550, 2200)
) %>%
  mutate(
    pct_biomasa = biomasa_ton / sum(biomasa_ton) * 100,
    pct_superficie = superficie_ha / sum(superficie_ha) * 100
  )

# --- Desglose provincial - Region de Los Lagos --------------------------------
provincias <- tibble(
  provincia = c("Osorno", "Llanquihue", "Chiloe", "Palena"),
  biomasa_ton = c(19840, 16820, 8320, 7820),
  superficie_ha = c(6825, 5790, 2865, 2670),
  ha_riesgo_critico = c(4800, 3950, 2700, 2450)
) %>%
  mutate(
    pct_biomasa = biomasa_ton / sum(biomasa_ton) * 100,
    densidad_ton_ha = biomasa_ton / superficie_ha,
    pct_riesgo = ha_riesgo_critico / superficie_ha * 100
  )

# --- Top 10 comunas criticas -------------------------------------------------
comunas <- tibble(
  comuna = c("Osorno", "Puerto Montt", "Puerto Octay", "Chaiten",
             "Purranque", "Rio Negro", "Fresia", "Llanquihue",
             "Frutillar", "Ancud"),
  provincia = c("Osorno", "Llanquihue", "Osorno", "Palena",
                "Osorno", "Osorno", "Llanquihue", "Llanquihue",
                "Llanquihue", "Chiloe"),
  biomasa_ton = c(6930, 5365, 4495, 4060, 3580, 3230, 2890, 2640, 2415, 2180),
  superficie_ha = c(2385, 1845, 1548, 1398, 1232, 1112, 995, 909, 832, 750),
  prob_media = c(0.78, 0.74, 0.71, 0.69, 0.72, 0.68, 0.65, 0.67, 0.63, 0.61)
) %>%
  mutate(
    densidad_ton_ha = biomasa_ton / superficie_ha,
    ranking = row_number()
  )

# --- Metricas globales --------------------------------------------------------
metricas <- list(
  superficie_total_ha = 32900,
  biomasa_total_ton = 95000,
  n_regiones = 3,
  ha_riesgo_critico = 13900,
  resolucion_m = 10,
  precision_pct = 86,
  kappa = 0.72,
  n_arboles_rf = 10,
  periodo = "Ago-Dic 2024",
  sensor = "Sentinel-2 MSI",
  indices = c("NDVI", "SAVI", "NDMI", "NBR2", "YFI", "NDRE")
)

cat("========================================================\n")
cat("  ULEX EUROPAEUS - ANALISIS REGIONAL\n")
cat("  CUSSEN.CL - Teledeteccion Profesional\n")
cat("========================================================\n\n")
cat("Superficie total mapeada:", format(metricas$superficie_total_ha, big.mark = "."), "ha\n")
cat("Biomasa estimada total:", format(metricas$biomasa_total_ton, big.mark = "."), "ton\n")
cat("Hectareas en riesgo critico:", format(metricas$ha_riesgo_critico, big.mark = "."), "ha\n")
cat("Precision del modelo:", metricas$precision_pct, "% | Kappa:", metricas$kappa, "\n\n")

# ==============================================================================
# 2. PALETA Y TEMA CUSSEN
# ==============================================================================

cussen_palette <- c(
  ulex_alto    = "#d73027",   # Rojo - alta probabilidad
  ulex_medio   = "#fc8d59",   # Naranja
  ulex_bajo    = "#fee08b",   # Amarillo
  bosque       = "#1a9850",   # Verde bosque
  agua         = "#4575b4",   # Azul
  gris         = "#636E72",   # Neutro
  fondo        = "#f7f7f7"    # Fondo
)

theme_cussen <- theme_minimal(base_size = 12) +
  theme(
    plot.title = element_text(size = 14, face = "bold", color = "#2c3e50"),
    plot.subtitle = element_text(size = 11, color = "gray40"),
    plot.caption = element_text(size = 8, color = "gray60", hjust = 0),
    panel.grid.minor = element_blank(),
    legend.position = "bottom",
    strip.text = element_text(face = "bold")
  )

theme_set(theme_cussen)

# ==============================================================================
# 3. VISUALIZACIONES PARA LA REUNION
# ==============================================================================

cat("Generando visualizaciones...\n\n")

# --- FIG 1: Biomasa por Region ------------------------------------------------
p_regiones <- ggplot(regiones, aes(x = reorder(region, -biomasa_ton), y = biomasa_ton)) +
  geom_col(aes(fill = biomasa_ton), width = 0.7, show.legend = FALSE) +
  geom_text(aes(label = paste0(format(biomasa_ton, big.mark = "."), " ton")),
            vjust = -0.5, size = 4, fontface = "bold") +
  geom_text(aes(label = paste0("(", round(pct_biomasa, 1), "%)")),
            vjust = 1.5, size = 3.5, color = "white", fontface = "bold") +
  scale_fill_gradient(low = "#fc8d59", high = "#d73027") +
  scale_y_continuous(labels = label_comma(), expand = expansion(mult = c(0, 0.15))) +
  labs(
    title = "Biomasa estimada de Ulex europaeus por region",
    subtitle = paste0("Total: ", format(metricas$biomasa_total_ton, big.mark = "."),
                      " toneladas | ", format(metricas$superficie_total_ha, big.mark = "."), " ha"),
    x = NULL, y = "Biomasa (toneladas)",
    caption = "Fuente: CUSSEN.CL | Random Forest + Sentinel-2 (10m) | Periodo: Ago-Dic 2024"
  )

ggsave(file.path(output_path, "Fig1_Biomasa_Regiones.png"),
       p_regiones, width = 10, height = 6, dpi = 300, bg = "white")
cat("  Fig 1: Biomasa por region\n")

# --- FIG 2: Desglose Provincial Los Lagos -------------------------------------
p_provincias <- ggplot(provincias, aes(x = reorder(provincia, biomasa_ton), y = biomasa_ton)) +
  geom_col(fill = "#d73027", alpha = 0.85, width = 0.7) +
  geom_text(aes(label = paste0(format(biomasa_ton, big.mark = "."), " ton\n",
                                format(superficie_ha, big.mark = "."), " ha")),
            hjust = -0.1, size = 3.5) +
  coord_flip() +
  scale_y_continuous(labels = label_comma(), expand = expansion(mult = c(0, 0.3))) +
  labs(
    title = "Ulex europaeus - Region de Los Lagos por provincia",
    subtitle = paste0("Biomasa total region: ", format(sum(provincias$biomasa_ton), big.mark = "."),
                      " ton | ", format(sum(provincias$superficie_ha), big.mark = "."), " ha"),
    x = NULL, y = "Biomasa (toneladas)",
    caption = "CUSSEN.CL | Sentinel-2 + Random Forest (precision 86%)"
  )

ggsave(file.path(output_path, "Fig2_Provincias_LosLagos.png"),
       p_provincias, width = 10, height = 5, dpi = 300, bg = "white")
cat("  Fig 2: Provincias Los Lagos\n")

# --- FIG 3: Top 10 Comunas ---------------------------------------------------
p_comunas <- ggplot(comunas, aes(x = reorder(comuna, biomasa_ton), y = biomasa_ton)) +
  geom_col(aes(fill = prob_media), width = 0.7) +
  geom_text(aes(label = paste0(format(biomasa_ton, big.mark = "."), " ton")),
            hjust = -0.1, size = 3.2) +
  coord_flip() +
  scale_fill_gradient2(
    low = "#fee08b", mid = "#fc8d59", high = "#d73027",
    midpoint = 0.7, name = "Prob. media Ulex"
  ) +
  scale_y_continuous(labels = label_comma(), expand = expansion(mult = c(0, 0.25))) +
  labs(
    title = "Top 10 comunas con mayor presencia de Ulex europaeus",
    subtitle = "Biomasa estimada y probabilidad media de presencia",
    x = NULL, y = "Biomasa (toneladas)",
    caption = "CUSSEN.CL | Modelo Random Forest sobre Sentinel-2 (10m)"
  )

ggsave(file.path(output_path, "Fig3_Top10_Comunas.png"),
       p_comunas, width = 10, height = 6, dpi = 300, bg = "white")
cat("  Fig 3: Top 10 comunas\n")

# --- FIG 4: Dashboard combinado para la reunion ------------------------------

# Panel A: Donut de regiones
p_donut <- regiones %>%
  mutate(
    ymax = cumsum(pct_biomasa),
    ymin = lag(ymax, default = 0),
    label_pos = (ymax + ymin) / 2
  ) %>%
  ggplot(aes(ymax = ymax, ymin = ymin, xmax = 4, xmin = 2.5, fill = region)) +
  geom_rect(color = "white", size = 0.5) +
  geom_text(aes(x = 3.25, y = label_pos,
                label = paste0(region, "\n", round(pct_biomasa, 1), "%")),
            size = 3, fontface = "bold") +
  coord_polar(theta = "y") +
  xlim(c(1, 4.5)) +
  scale_fill_manual(values = c("Los Lagos" = "#d73027", "Los Rios" = "#fc8d59", "Aysen" = "#fee08b")) +
  labs(title = "Distribucion por region") +
  theme_void() +
  theme(legend.position = "none",
        plot.title = element_text(hjust = 0.5, face = "bold", size = 11))

# Panel B: Riesgo de incendio por provincia
p_riesgo <- ggplot(provincias, aes(x = reorder(provincia, ha_riesgo_critico),
                                    y = ha_riesgo_critico)) +
  geom_col(fill = "#d73027", alpha = 0.7, width = 0.6) +
  geom_col(aes(y = superficie_ha), fill = "#fc8d59", alpha = 0.4, width = 0.6) +
  coord_flip() +
  scale_y_continuous(labels = label_comma()) +
  labs(title = "Superficie total vs riesgo critico (ha)", x = NULL, y = "Hectareas") +
  theme_cussen +
  theme(plot.title = element_text(size = 11))

# Panel C: Densidad de biomasa
p_densidad <- ggplot(provincias, aes(x = reorder(provincia, densidad_ton_ha),
                                      y = densidad_ton_ha)) +
  geom_col(fill = "#1a9850", alpha = 0.8, width = 0.6) +
  geom_text(aes(label = paste0(round(densidad_ton_ha, 1), " t/ha")),
            hjust = -0.1, size = 3.5) +
  coord_flip() +
  scale_y_continuous(expand = expansion(mult = c(0, 0.3))) +
  labs(title = "Densidad de biomasa (ton/ha)", x = NULL, y = "ton/ha") +
  theme_cussen +
  theme(plot.title = element_text(size = 11))

# Panel D: Metricas clave
metricas_df <- tibble(
  metrica = c("Superficie\ntotal", "Biomasa\ntotal", "Riesgo\ncritico", "Precision\nmodelo"),
  valor = c(32900, 95000, 13900, 86),
  unidad = c("ha", "ton", "ha", "%"),
  color = c("#d73027", "#fc8d59", "#d73027", "#1a9850")
)

p_metricas <- ggplot(metricas_df, aes(x = metrica, y = 1)) +
  geom_tile(aes(fill = color), alpha = 0.15, width = 0.9, height = 0.9, show.legend = FALSE) +
  geom_text(aes(label = ifelse(unidad == "%",
                                paste0(format(valor, big.mark = "."), unidad),
                                format(valor, big.mark = "."))),
            size = 6, fontface = "bold", color = "#2c3e50") +
  geom_text(aes(label = ifelse(unidad != "%", unidad, "")),
            size = 3.5, color = "gray50", nudge_y = -0.25) +
  scale_fill_identity() +
  labs(title = "Metricas clave del mapeo") +
  theme_void() +
  theme(plot.title = element_text(hjust = 0.5, face = "bold", size = 11))

# Combinar dashboard
dashboard <- (p_metricas | p_donut) / (p_provincias | p_riesgo) +
  plot_annotation(
    title = "ULEX EUROPAEUS - Dashboard Regional",
    subtitle = "Mapeo con teledeteccion Sentinel-2 (10m) | Random Forest | CUSSEN.CL",
    caption = paste0("Periodo: Ago-Dic 2024 | Precision: 86% | Kappa: 0.72 | ",
                     "Indices: NDVI, SAVI, NDMI, NBR2, YFI, NDRE"),
    theme = theme(
      plot.title = element_text(size = 16, face = "bold", color = "#2c3e50"),
      plot.subtitle = element_text(size = 12, color = "gray40"),
      plot.caption = element_text(size = 9, color = "gray60")
    )
  )

ggsave(file.path(output_path, "Fig4_Dashboard_Ulex.png"),
       dashboard, width = 14, height = 10, dpi = 300, bg = "white")
cat("  Fig 4: Dashboard completo\n")

# --- FIG 5: Tabla para Insular (lo que necesitan para CONAF) ------------------
p_tabla_prov <- provincias %>%
  arrange(desc(biomasa_ton)) %>%
  mutate(
    across(c(biomasa_ton, superficie_ha, ha_riesgo_critico), ~format(., big.mark = ".")),
    pct_biomasa = paste0(round(pct_biomasa, 1), "%"),
    densidad_ton_ha = round(densidad_ton_ha, 1)
  ) %>%
  select(
    Provincia = provincia,
    `Superficie (ha)` = superficie_ha,
    `Biomasa (ton)` = biomasa_ton,
    `% del total` = pct_biomasa,
    `Densidad (t/ha)` = densidad_ton_ha,
    `Riesgo critico (ha)` = ha_riesgo_critico
  )

cat("\n")
cat("========================================================\n")
cat("  TABLA RESUMEN - REGION DE LOS LAGOS\n")
cat("========================================================\n")
print(p_tabla_prov, n = Inf)

# ==============================================================================
# 4. EXPORTAR DATOS PARA LA REUNION
# ==============================================================================

cat("\nExportando datos...\n\n")

# CSV de regiones
write_csv(regiones, file.path(output_path, "Ulex_resumen_regiones.csv"))
cat("  Ulex_resumen_regiones.csv\n")

# CSV de provincias
write_csv(provincias, file.path(output_path, "Ulex_resumen_provincias_LosLagos.csv"))
cat("  Ulex_resumen_provincias_LosLagos.csv\n")

# CSV de comunas
write_csv(comunas, file.path(output_path, "Ulex_top10_comunas.csv"))
cat("  Ulex_top10_comunas.csv\n")

# JSON con todas las metricas (util para web)
resumen_json <- list(
  metadata = list(
    proyecto = "Mapeo Regional de Ulex europaeus",
    autor = "Pablo Cussen Eltit - CUSSEN.CL",
    fecha_analisis = as.character(Sys.Date()),
    sensor = "Sentinel-2 MSI",
    resolucion = "10 metros",
    metodo = "Random Forest (10 arboles)",
    precision = "86%",
    kappa = 0.72,
    periodo = "Agosto-Diciembre 2024",
    indices = metricas$indices
  ),
  resumen_global = list(
    superficie_total_ha = metricas$superficie_total_ha,
    biomasa_total_ton = metricas$biomasa_total_ton,
    ha_riesgo_critico = metricas$ha_riesgo_critico,
    regiones_mapeadas = metricas$n_regiones
  ),
  por_region = regiones %>% select(-pct_superficie),
  provincias_los_lagos = provincias,
  top10_comunas = comunas
)

write_json(resumen_json, file.path(output_path, "Ulex_resumen_completo.json"), pretty = TRUE)
cat("  Ulex_resumen_completo.json\n")

# ==============================================================================
# 5. RESUMEN PARA COPIAR/PEGAR EN LA REUNION
# ==============================================================================

cat("\n")
cat("================================================================\n")
cat("  DATOS CLAVE PARA LA REUNION CON INSULAR\n")
cat("================================================================\n\n")
cat("MAPEO DE ULEX EUROPAEUS - CUSSEN.CL\n")
cat("Metodologia: Random Forest + Sentinel-2 (10m) en Google Earth Engine\n")
cat("Periodo: Agosto-Diciembre 2024 (floracion)\n")
cat("Precision: 86% | Kappa: 0.72\n\n")

cat("RESULTADOS GLOBALES:\n")
cat("  Superficie invadida: 32.900 ha (3 regiones)\n")
cat("  Biomasa estimada: 95.000 toneladas\n")
cat("  Riesgo critico (pendiente >25): 13.900 ha\n\n")

cat("REGION DE LOS LAGOS (foco de Insular):\n")
cat("  Biomasa: 52.800 ton (55,6% del total)\n")
cat("  - Osorno:     19.840 ton | 6.825 ha\n")
cat("  - Llanquihue: 16.820 ton | 5.790 ha\n")
cat("  - Chiloe:      8.320 ton | 2.865 ha\n")
cat("  - Palena:      7.820 ton | 2.670 ha\n\n")

cat("VALOR PARA POSTULACION CONAF:\n")
cat("  - Mapas de probabilidad (0-100%) a 10m de resolucion\n")
cat("  - Capa de riesgo de incendio (biomasa + pendiente)\n")
cat("  - Estimacion de biomasa por comuna\n")
cat("  - Datos listos para SIG (GeoTIFF exportable)\n\n")

cat("SINERGIA CUSSEN + INSULAR:\n")
cat("  - CUSSEN aporta: diagnostico espacial con teledeteccion\n")
cat("  - Insular aporta: restauracion de ecosistemas (RaaS)\n")
cat("  - Complementarios para el Fondo de Bosque Nativo CONAF\n")

cat("\n================================================================\n")
cat("  Archivos generados en: ", output_path, "\n")
cat("================================================================\n")

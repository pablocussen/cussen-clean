"""
Normalizar categorías de APUs (eliminar duplicados con acentos)
"""

import json

# Mapeo de normalización
NORMALIZE_MAP = {
    "ALBANILERIA": "ALBAÑILERÍA",
    "CARPINTERIA": "CARPINTERÍA",
    "ESTRUCTURA METALICA": "ESTRUCTURA METÁLICA",
    "HORMIGON": "HORMIGÓN",
    "HORMIGONES": "HORMIGÓN",
    "INSTALACIONES ELECTRICAS": "INSTALACIONES ELÉCTRICAS",
    "JARDINERIA": "JARDINERÍA",
}

# Cargar APUs
with open("web_app/apu_database.json", "r", encoding="utf-8") as f:
    data = json.load(f)
    apus = data.get("actividades", [])

print(f"Total APUs: {len(apus)}")

# Normalizar categorías
cambios = 0
for apu in apus:
    categoria_original = apu.get("categoria", "SIN CATEGORIA")
    categoria_normalizada = NORMALIZE_MAP.get(categoria_original, categoria_original)

    if categoria_normalizada != categoria_original:
        apu["categoria"] = categoria_normalizada
        cambios += 1

print(f"Categorías normalizadas: {cambios}")

# Guardar
with open("web_app/apu_database.json", "w", encoding="utf-8") as f:
    json.dump({"actividades": apus}, f, ensure_ascii=False, indent=2)

with open("web_app/apu_database.min.json", "w", encoding="utf-8") as f:
    json.dump({"actividades": apus}, f, ensure_ascii=False, separators=(",", ":"))

print("Categorias normalizadas guardadas")

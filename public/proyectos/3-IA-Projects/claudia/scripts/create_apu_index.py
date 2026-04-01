"""
Crear índice de categorías para búsqueda rápida de APUs
"""

import json

# Cargar APUs
with open("web_app/apu_database.json", "r", encoding="utf-8") as f:
    data = json.load(f)
    apus = data.get("actividades", [])

print(f"Total APUs: {len(apus)}")

# Crear índice por categoría
index = {}
for i, apu in enumerate(apus):
    categoria = apu.get("categoria", "SIN CATEGORIA")

    if categoria not in index:
        index[categoria] = {"count": 0, "indices": [], "precio_min": float("inf"), "precio_max": 0}

    index[categoria]["count"] += 1
    index[categoria]["indices"].append(i)

    precio = apu.get("precio", 0) or apu.get("precio_referencia", 0)
    if precio:
        index[categoria]["precio_min"] = min(index[categoria]["precio_min"], precio)
        index[categoria]["precio_max"] = max(index[categoria]["precio_max"], precio)

# Ordenar categorías alfabéticamente
categorias_ordenadas = sorted(index.keys())

# Crear estructura final
index_final = {
    "total_apus": len(apus),
    "total_categorias": len(categorias_ordenadas),
    "categorias": categorias_ordenadas,
    "index": index,
}

# Guardar índice
with open("web_app/apu_index.json", "w", encoding="utf-8") as f:
    json.dump(index_final, f, ensure_ascii=False, indent=2)

# Mostrar estadísticas
print(f"\nÍndice creado con {len(categorias_ordenadas)} categorías:")
for cat in categorias_ordenadas:
    count = index[cat]["count"]
    precio_min = index[cat]["precio_min"]
    precio_max = index[cat]["precio_max"]
    if precio_min != float("inf"):
        print(f"  - {cat}: {count} APUs (${precio_min:,} - ${precio_max:,})")
    else:
        print(f"  - {cat}: {count} APUs")

print(f"\n✅ Índice guardado en web_app/apu_index.json")

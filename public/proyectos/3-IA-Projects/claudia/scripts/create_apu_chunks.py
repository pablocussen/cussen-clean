"""
Dividir base de datos de APUs en chunks por categoría
Para carga lazy/on-demand
"""

import json
import os

# Cargar APUs
with open("web_app/apu_database.json", "r", encoding="utf-8") as f:
    data = json.load(f)
    apus = data.get("actividades", [])

print(f"Total APUs: {len(apus)}")

# Agrupar por categoría
chunks = {}
for apu in apus:
    categoria = apu.get("categoria", "SIN CATEGORIA")
    if categoria not in chunks:
        chunks[categoria] = []
    chunks[categoria].append(apu)

# Crear directorio para chunks
os.makedirs("web_app/apu_chunks", exist_ok=True)

# Guardar cada chunk
for categoria, apus_categoria in chunks.items():
    # Nombre de archivo seguro
    filename = (
        categoria.replace(" ", "_")
        .replace("Á", "A")
        .replace("É", "E")
        .replace("Í", "I")
        .replace("Ó", "O")
        .replace("Ú", "U")
        .replace("Ñ", "N")
        .lower()
    )

    chunk_data = {
        "categoria": categoria,
        "count": len(apus_categoria),
        "actividades": apus_categoria,
    }

    filepath = f"web_app/apu_chunks/{filename}.json"
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(chunk_data, f, ensure_ascii=False, separators=(",", ":"))

    print(f"  - {categoria}: {len(apus_categoria)} APUs -> {filename}.json")

# Crear manifiesto de chunks
manifest = {"total_apus": len(apus), "total_chunks": len(chunks), "chunks": {}}

for categoria, apus_categoria in chunks.items():
    filename = (
        categoria.replace(" ", "_")
        .replace("Á", "A")
        .replace("É", "E")
        .replace("Í", "I")
        .replace("Ó", "O")
        .replace("Ú", "U")
        .replace("Ñ", "N")
        .lower()
    )
    manifest["chunks"][categoria] = {
        "file": f"apu_chunks/{filename}.json",
        "count": len(apus_categoria),
    }

with open("web_app/apu_chunks/manifest.json", "w", encoding="utf-8") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print(f"\nManifesto creado: {len(chunks)} chunks")
print("Chunks guardados en web_app/apu_chunks/")

"""
Auditoria simple - sin unicode problematico
"""

import json
import os
from pathlib import Path

print("=" * 60)
print("AUDITORIA CLAUDIA v8.4")
print("=" * 60)

errors = []
warnings = []
successes = []

# 1. Archivos criticos
print("\n[1/7] Archivos criticos...")
critical = [
    "web_app/index.html",
    "web_app/apu_database.json",
    "web_app/apu_database.min.json",
    "web_app/apu_index.json",
    "web_app/css/claudia-main.min.css",
    "web_app/js/claudia-complete.js",
    "web_app/js/claudia-telegram-linking.js",
]

for f in critical:
    if os.path.exists(f):
        size = os.path.getsize(f) / 1024
        successes.append(f"OK: {f} ({size:.1f}KB)")
        print(f"  OK: {f}")
    else:
        errors.append(f"FALTA: {f}")
        print(f"  ERROR: FALTA {f}")

# 2. APUs
print("\n[2/7] Base de datos APU...")
with open("web_app/apu_database.json", "r", encoding="utf-8") as f:
    data = json.load(f)
    apus = data.get("actividades", [])

print(f"  Total APUs: {len(apus)}")
successes.append(f"Total APUs: {len(apus)}")

campos_req = ["id", "nombre", "categoria", "unidad"]
problemas = 0
for i, apu in enumerate(apus):
    for campo in campos_req:
        if campo not in apu or not apu[campo]:
            problemas += 1

if problemas == 0:
    successes.append(f"APUs: estructura OK")
    print(f"  OK: Estructura correcta")
else:
    warnings.append(f"APUs con campos faltantes: {problemas}")
    print(f"  WARN: {problemas} APUs con problemas")

categorias = set(apu.get("categoria", "SIN CATEGORIA") for apu in apus)
successes.append(f"Categorias: {len(categorias)}")
print(f"  OK: {len(categorias)} categorias")

sin_precio = sum(1 for apu in apus if not apu.get("precio") and not apu.get("precio_referencia"))
if sin_precio > 0:
    warnings.append(f"APUs sin precio: {sin_precio}")
    print(f"  WARN: {sin_precio} APUs sin precio")
else:
    successes.append("Todos los APUs tienen precio")
    print(f"  OK: Todos con precio")

# 3. Indice
print("\n[3/7] Indice y chunks...")
with open("web_app/apu_index.json", "r", encoding="utf-8") as f:
    index = json.load(f)

total_idx = index.get("total_apus", 0)
if total_idx == len(apus):
    successes.append(f"Indice sincronizado: {total_idx}")
    print(f"  OK: Indice sincronizado ({total_idx} APUs)")
else:
    warnings.append(f"Indice desincronizado: {total_idx} vs {len(apus)}")
    print(f"  WARN: Desincronizado {total_idx} vs {len(apus)}")

chunks = list(Path("web_app/apu_chunks").glob("*.json"))
successes.append(f"Chunks: {len(chunks)}")
print(f"  OK: {len(chunks)} archivos de chunks")

# 4. Plantillas
print("\n[4/7] Plantillas...")
with open("web_app/js/claudia-complete.js", "r", encoding="utf-8") as f:
    content = f.read()

if "const projectTemplates = [" in content:
    start = content.find("const projectTemplates = [")
    end = content.find("];", start)
    section = content[start:end]
    count = section.count("id: '")
    successes.append(f"Plantillas: {count}")
    print(f"  OK: {count} plantillas")
else:
    warnings.append("Plantillas no encontradas")
    print(f"  WARN: No se encontraron plantillas")

# 5. Modulos JS
print("\n[5/7] Modulos JavaScript...")
modules = [
    "claudia-complete.js",
    "claudia-telegram-linking.js",
    "claudia-export-pro.js",
    "claudia-search-optimized.js",
]

for mod in modules:
    path = f"web_app/js/{mod}"
    if os.path.exists(path):
        size = os.path.getsize(path) / 1024
        successes.append(f"{mod}: {size:.1f}KB")
        print(f"  OK: {mod} ({size:.1f}KB)")
    else:
        warnings.append(f"Falta: {mod}")
        print(f"  WARN: Falta {mod}")

# 6. HTML
print("\n[6/7] HTML principal...")
with open("web_app/index.html", "r", encoding="utf-8") as f:
    html = f.read()

html_size = len(html) / 1024
successes.append(f"HTML: {html_size:.1f}KB")
print(f"  OK: HTML {html_size:.1f}KB")

checks = [
    ("claudia-main.min.css", "CSS"),
    ("claudia-complete.js", "Core JS"),
    ("telegram-linking-modal", "Modal Telegram"),
]

for check, desc in checks:
    if check in html:
        successes.append(f"HTML contiene: {desc}")
        print(f"  OK: {desc}")
    else:
        warnings.append(f"HTML falta: {desc}")
        print(f"  WARN: Falta {desc}")

# 7. Directorios
print("\n[7/7] Directorios...")
dirs = ["web_app", "web_app/js", "web_app/css", "web_app/apu_chunks"]
for d in dirs:
    if os.path.isdir(d):
        count = len(os.listdir(d))
        successes.append(f"{d}: {count} archivos")
        print(f"  OK: {d}/ ({count} archivos)")
    else:
        errors.append(f"Falta: {d}")
        print(f"  ERROR: Falta {d}/")

# RESUMEN
print("\n" + "=" * 60)
print("RESUMEN")
print("=" * 60)
print(f"\nEXITOS: {len(successes)}")
print(f"ADVERTENCIAS: {len(warnings)}")
print(f"ERRORES: {len(errors)}")

total = len(successes) + len(warnings) + len(errors)
score = (len(successes) + len(warnings) * 0.5) / total * 100

print(f"\nNIVEL DE CONFIANZA: {score:.1f}%")

if score >= 95:
    status = "PRODUCCION LISTA"
elif score >= 85:
    status = "PRODUCCION OK (con advertencias menores)"
elif score >= 70:
    status = "REQUIERE ATENCION"
else:
    status = "NO APTO PARA PRODUCCION"

print(f"ESTADO: {status}")

# Guardar
with open("AUDIT_REPORT.txt", "w", encoding="utf-8") as f:
    f.write(f"AUDITORIA CLAUDIA - Confianza: {score:.1f}%\n")
    f.write("=" * 60 + "\n\n")
    f.write(f"ESTADO: {status}\n\n")
    f.write(f"EXITOS: {len(successes)}\n")
    for s in successes:
        f.write(f"  {s}\n")
    f.write(f"\nADVERTENCIAS: {len(warnings)}\n")
    for w in warnings:
        f.write(f"  {w}\n")
    f.write(f"\nERRORES: {len(errors)}\n")
    for e in errors:
        f.write(f"  {e}\n")

print("\nReporte: AUDIT_REPORT.txt")

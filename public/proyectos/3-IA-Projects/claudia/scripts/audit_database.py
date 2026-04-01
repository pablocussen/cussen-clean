"""
Auditoria de Base de Datos CLAUDIA
Verifica calidad y completitud
"""

import json
from collections import Counter

# Cargar base de datos
with open("web_app/apu_database.json", "r", encoding="utf-8") as f:
    data = json.load(f)

apus = data["actividades"]
metadata = data.get("metadata", {})

print("=== BASE DE DATOS ===")
print(f"Total APUs: {len(apus)}")
print(f'Version: {metadata.get("version", "N/A")}')
print()

# Verificar calidad
sin_materiales = sum(1 for a in apus if not a.get("materiales") or len(a["materiales"]) == 0)
sin_mano_obra = sum(1 for a in apus if not a.get("mano_obra") or len(a["mano_obra"]) == 0)
sin_precio = sum(1 for a in apus if not a.get("precio_referencia") or a["precio_referencia"] == 0)
sin_nombre = sum(1 for a in apus if not a.get("nombre"))
sin_unidad = sum(1 for a in apus if not a.get("unidad"))

print("=== CALIDAD ===")
print(f"APUs sin materiales: {sin_materiales}")
print(f"APUs sin mano de obra: {sin_mano_obra}")
print(f"APUs sin precio: {sin_precio}")
print(f"APUs sin nombre: {sin_nombre}")
print(f"APUs sin unidad: {sin_unidad}")
print()

# Distribucion por categoria
cats = Counter(a.get("categoria", "Sin cat") for a in apus)
print("=== DISTRIBUCION POR CATEGORIA ===")
for cat, count in sorted(cats.items()):
    pct = (count / len(apus)) * 100
    print(f"{cat}: {count} ({pct:.1f}%)")
print()

# Rangos de precios
precios = [a["precio_referencia"] for a in apus if a.get("precio_referencia")]
if precios:
    print("=== RANGOS DE PRECIOS ===")
    print(f"Minimo: ${min(precios):,}")
    print(f"Promedio: ${int(sum(precios)/len(precios)):,}")
    print(f"Maximo: ${max(precios):,}")
    print()

# Promedio de materiales y mano de obra
total_mat = sum(len(a.get("materiales", [])) for a in apus)
total_mo = sum(len(a.get("mano_obra", [])) for a in apus)

print("=== PROMEDIOS ===")
print(f"Materiales por APU: {total_mat/len(apus):.1f}")
print(f"Mano de obra por APU: {total_mo/len(apus):.1f}")
print()

# Verificar integridad de precios
materiales_con_precio_cero = 0
for apu in apus:
    for mat in apu.get("materiales", []):
        if mat.get("precio_unitario", 0) == 0:
            materiales_con_precio_cero += 1

print("=== ADVERTENCIAS ===")
print(f"Materiales con precio 0: {materiales_con_precio_cero}")

# Score general
score = 100
if sin_materiales > 0:
    score -= 20
if sin_mano_obra > len(apus) * 0.3:  # Mas del 30% sin MO
    score -= 10
if sin_precio > 0:
    score -= 20
if sin_nombre > 0:
    score -= 30

print()
print("=== SCORE GENERAL ===")
print(f"Score: {score}/100")
if score >= 80:
    print("Estado: EXCELENTE - Listo para presentacion")
elif score >= 60:
    print("Estado: BUENO - Requiere mejoras menores")
else:
    print("Estado: REQUIERE ATENCION - Mejoras criticas necesarias")

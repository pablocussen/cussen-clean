"""
Validador de Base de Datos de APUs
Verifica que no haya NaN, precios válidos, categorías asignadas, etc.
"""

import json
import math


def validate_apu_database(file_path):
    """Valida el archivo JSON de APUs y reporta problemas"""

    print(f"📂 Cargando: {file_path}")

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    apus = data.get("actividades", [])
    total = len(apus)

    print(f"\n✅ Total APUs: {total}")

    # Contadores
    issues = {
        "sin_materiales": 0,
        "sin_mano_obra": 0,
        "sin_categoria": 0,
        "precio_cero": 0,
        "precio_nan": 0,
        "cantidad_nan": 0,
        "sin_nombre": 0,
        "sin_unidad": 0,
    }

    categorias = {}
    ids_duplicados = {}

    for i, apu in enumerate(apus):
        apu_id = apu.get("id", f"sin_id_{i}")

        # Verificar IDs duplicados
        if apu_id in ids_duplicados:
            ids_duplicados[apu_id] += 1
        else:
            ids_duplicados[apu_id] = 1

        # Verificar nombre
        if not apu.get("nombre"):
            issues["sin_nombre"] += 1

        # Verificar unidad
        if not apu.get("unidad"):
            issues["sin_unidad"] += 1

        # Verificar materiales
        if not apu.get("materiales") or len(apu["materiales"]) == 0:
            issues["sin_materiales"] += 1
        else:
            for mat in apu["materiales"]:
                if not mat.get("cantidad") or math.isnan(float(mat["cantidad"])):
                    issues["cantidad_nan"] += 1
                if not mat.get("precio_unitario") or math.isnan(float(mat["precio_unitario"])):
                    issues["precio_nan"] += 1

        # Verificar mano de obra
        if not apu.get("mano_obra") or len(apu["mano_obra"]) == 0:
            issues["sin_mano_obra"] += 1
        else:
            for mo in apu["mano_obra"]:
                if not mo.get("cantidad") or math.isnan(float(mo["cantidad"])):
                    issues["cantidad_nan"] += 1
                if not mo.get("precio_unitario") or math.isnan(float(mo["precio_unitario"])):
                    issues["precio_nan"] += 1

        # Verificar categoría
        cat = apu.get("categoria", "Sin categoria")
        if not cat or cat == "Sin categoria":
            issues["sin_categoria"] += 1
        else:
            categorias[cat] = categorias.get(cat, 0) + 1

        # Verificar precio
        precio = apu.get("precio_referencia", 0)
        if precio == 0:
            issues["precio_cero"] += 1

    # Reportar resultados
    print("\n📊 DISTRIBUCIÓN POR CATEGORÍAS:")
    for cat, count in sorted(categorias.items()):
        print(f"  {cat}: {count} APUs")

    print("\n⚠️  PROBLEMAS ENCONTRADOS:")
    problemas_criticos = 0
    for problema, count in issues.items():
        if count > 0:
            emoji = "🔴" if problema in ["precio_nan", "cantidad_nan"] else "🟡"
            print(f"  {emoji} {problema.replace('_', ' ').title()}: {count}")
            if problema in ["precio_nan", "cantidad_nan"]:
                problemas_criticos += count

    # IDs duplicados
    duplicados = {k: v for k, v in ids_duplicados.items() if v > 1}
    if duplicados:
        print(f"\n  🔴 IDs Duplicados: {len(duplicados)}")
        for id, count in list(duplicados.items())[:5]:
            print(f"     - {id}: {count} veces")

    # Resumen final
    print("\n" + "=" * 50)
    if problemas_criticos == 0 and len(duplicados) == 0:
        print("✅ BASE DE DATOS VÁLIDA - Sin problemas críticos")
    else:
        print(f"❌ BASE DE DATOS CON {problemas_criticos} PROBLEMAS CRÍTICOS")
    print("=" * 50)

    return problemas_criticos == 0 and len(duplicados) == 0


if __name__ == "__main__":
    import sys

    file_path = sys.argv[1] if len(sys.argv) > 1 else "web_app/apu_database_full.json"
    validate_apu_database(file_path)

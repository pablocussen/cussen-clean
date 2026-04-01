"""
Selector de los Mejores 200 APUs
Selecciona APUs más completos y representativos de cada categoría
"""

import json
import math


def score_apu(apu):
    """Calcula un score de calidad para un APU"""
    score = 0

    # +10 si tiene nombre
    if apu.get("nombre"):
        score += 10

    # +20 si tiene materiales válidos
    materiales = apu.get("materiales", [])
    if materiales and len(materiales) > 0:
        score += 20
        # +1 por cada material (hasta 10)
        score += min(len(materiales), 10)

        # +10 si todos los precios son válidos
        valid_prices = all(
            m.get("precio_unitario")
            and not math.isnan(float(m["precio_unitario"]))
            and float(m["precio_unitario"]) > 0
            for m in materiales
        )
        if valid_prices:
            score += 10

    # +20 si tiene mano de obra válida
    mano_obra = apu.get("mano_obra", [])
    if mano_obra and len(mano_obra) > 0:
        score += 20
        # +1 por cada trabajador (hasta 5)
        score += min(len(mano_obra), 5)

        # +5 si todos los precios son válidos
        valid_prices = all(
            m.get("precio_unitario")
            and not math.isnan(float(m["precio_unitario"]))
            and float(m["precio_unitario"]) > 0
            for m in mano_obra
        )
        if valid_prices:
            score += 5

    # +10 si tiene precio de referencia válido
    precio = apu.get("precio_referencia", 0)
    if precio and precio > 0:
        score += 10

    # +5 si tiene rendimiento
    if apu.get("rendimiento") and apu["rendimiento"] != "N/A":
        score += 5

    # +5 si tiene tips
    if apu.get("tips") and len(apu["tips"]) > 10:
        score += 5

    # +5 si tiene descripción
    if apu.get("descripcion") and len(apu["descripcion"]) > 10:
        score += 5

    return score


def select_best_200(input_file, output_file, target_count=200):
    """Selecciona los mejores APUs por categoría"""

    print(f"Cargando: {input_file}")
    with open(input_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    apus = data.get("actividades", [])
    print(f"Total APUs disponibles: {len(apus)}")

    # Calcular scores
    for apu in apus:
        apu["_score"] = score_apu(apu)

    # Agrupar por categoría
    from collections import defaultdict

    by_category = defaultdict(list)
    for apu in apus:
        cat = apu.get("categoria", "OTROS")
        by_category[cat].append(apu)

    # Ordenar por score dentro de cada categoría
    for cat in by_category:
        by_category[cat].sort(key=lambda x: x["_score"], reverse=True)

    # Distribución proporcional
    total_cats = len(by_category)
    base_per_cat = target_count // total_cats
    remainder = target_count % total_cats

    selected = []
    for i, (cat, cat_apus) in enumerate(sorted(by_category.items())):
        # Primeras categorías reciben el remainder
        to_take = base_per_cat + (1 if i < remainder else 0)
        # No tomar más de los disponibles
        to_take = min(to_take, len(cat_apus))

        selected.extend(cat_apus[:to_take])
        print(
            f"  {cat}: {to_take} APUs seleccionados (score promedio: {sum(a['_score'] for a in cat_apus[:to_take])/to_take:.1f})"
        )

    # Limpiar _score
    for apu in selected:
        del apu["_score"]

    # Actualizar data
    data["actividades"] = selected
    data["metadata"]["total_apus"] = len(selected)
    data["metadata"][
        "nota"
    ] = f"Seleccionados {len(selected)} mejores APUs de {len(apus)} disponibles"

    # Guardar
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\nTotal seleccionados: {len(selected)}")
    print(f"Guardado en: {output_file}")


if __name__ == "__main__":
    select_best_200(
        "web_app/apu_database_consolidated.json", "web_app/apu_database.json", target_count=200
    )

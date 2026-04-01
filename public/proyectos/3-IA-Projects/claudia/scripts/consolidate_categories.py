"""
Consolidador de Categorías APU
Agrupa las 42 categorías de ONDAC en las 14 categorías principales de CLAUDIA
"""

import json

# Mapeo de categorías ONDAC a categorías CLAUDIA
CATEGORY_MAP = {
    # TRAZADO
    "A Faena": "TRAZADO",
    "Apu Ondac": "TRAZADO",
    # MOVIMIENTO TIERRA
    "B Movimiento Tierra": "MOVIMIENTO TIERRA",
    "Desmantelamiento, Demolicion Y Retiro Escombros": "MOVIMIENTO TIERRA",
    "Actividades De Mineria": "MOVIMIENTO TIERRA",
    "Obras Civiles": "MOVIMIENTO TIERRA",
    # HORMIGONES
    "A Hormigon": "HORMIGONES",
    "C Hormigones": "HORMIGONES",
    "Cb Morteros": "HORMIGONES",
    # MOLDAJES
    "Da. Moldajes": "MOLDAJES",
    "Db. Andamios": "MOLDAJES",
    # ENFIERRADURAS
    "Ea. Enfierraduras": "ENFIERRADURAS",
    # ALBAÑILERÍA
    "Fa. Albanileria": "ALBAÑILERÍA",
    "Fb. Mamposteria": "ALBAÑILERÍA",
    "Fc. Losas": "ALBAÑILERÍA",
    # ESTRUCTURA METÁLICA
    "Ga. Estructura De Acero": "ESTRUCTURA METÁLICA",
    "Gb. Cerrajerias": "ESTRUCTURA METÁLICA",
    "Gc. Carpinteria Metalica": "ESTRUCTURA METÁLICA",
    # CARPINTERÍA
    "Ha. Divisiones Internas": "CARPINTERÍA",
    "Hb. Carpinterias Varias": "CARPINTERÍA",
    # TECHUMBRE
    "Ia. Techumbre": "TECHUMBRE",
    "Ib. Cubierta": "TECHUMBRE",
    "Ic. Impermeabilizacion": "TECHUMBRE",
    "Id. Canal Aguas Lluvias": "TECHUMBRE",
    # CIELOS
    "Ja. Cielos": "CIELOS",
    "Jb. Aislacion": "CIELOS",
    "Cielos Y Aislacion": "CIELOS",
    # REVESTIMIENTOS
    "Ka. Estucos": "REVESTIMIENTOS",
    "Kb. Yesos": "REVESTIMIENTOS",
    "Kc. Pinturas": "REVESTIMIENTOS",
    "Kd. Ceramicas Y Azulejos": "REVESTIMIENTOS",
    "Ke. Madera": "REVESTIMIENTOS",
    "Kf. Papel Y Textiles": "REVESTIMIENTOS",
    "Kg. Otros Revestimientos": "REVESTIMIENTOS",
    "Kh. Reparacion Y Preparacion": "REVESTIMIENTOS",
    "Revestimientos": "REVESTIMIENTOS",
    # PAVIMENTOS
    "Lf. Pavimentos Varios": "PAVIMENTOS",
    "Pavimentos": "PAVIMENTOS",
    "Urbanizacion": "PAVIMENTOS",
    # PUERTAS Y VENTANAS
    "Puertas, Ventanas Y Vidrios": "PUERTAS Y VENTANAS",
    "Quincalleria": "PUERTAS Y VENTANAS",
    # INSTALACIONES
    "Instalaciones": "INSTALACIONES",
}


def consolidate_categories(input_file, output_file):
    """Consolida categorías y guarda en nuevo archivo"""

    print(f"Cargando: {input_file}")
    with open(input_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    apus = data.get("actividades", [])
    print(f"Total APUs: {len(apus)}")

    # Aplicar mapeo
    sin_mapeo = set()
    for apu in apus:
        old_cat = apu.get("categoria", "Sin categoria")
        new_cat = CATEGORY_MAP.get(old_cat)

        if new_cat:
            apu["categoria"] = new_cat
        else:
            sin_mapeo.add(old_cat)
            apu["categoria"] = "OTROS"

    # Contar por categoría
    from collections import Counter

    cat_count = Counter(apu["categoria"] for apu in apus)

    print("\nDistribucion por categoria consolidada:")
    for cat, count in sorted(cat_count.items()):
        print(f"  {cat}: {count}")

    if sin_mapeo:
        print(f"\nCategorias sin mapeo (asignadas a OTROS): {sin_mapeo}")

    # Actualizar metadata
    data["metadata"]["categorias"] = sorted(list(set(apu["categoria"] for apu in apus)))

    # Guardar
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\nGuardado en: {output_file}")
    return True


if __name__ == "__main__":
    consolidate_categories(
        "web_app/apu_database_full.json", "web_app/apu_database_consolidated.json"
    )

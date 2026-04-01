"""
Pipeline Completo de Procesamiento de APUs
1. Extrae desde Excel (Gemini ya lo hizo)
2. Consolida categorías
3. Selecciona mejores 200
4. Valida resultado
"""

import subprocess
import sys


def run_script(script_name, description):
    """Ejecuta un script y reporta el resultado"""
    print(f"\n{'='*60}")
    print(f"PASO: {description}")
    print(f"{'='*60}\n")

    result = subprocess.run(
        [sys.executable, f"scripts/{script_name}"], capture_output=True, text=True
    )

    print(result.stdout)
    if result.stderr:
        print("ERRORES:", result.stderr)

    if result.returncode != 0:
        print(f"\nERROR en {script_name}")
        return False

    return True


def main():
    print("\n" + "=" * 60)
    print("CLAUDIA PRO - Pipeline de Procesamiento de APUs")
    print("=" * 60)

    # Paso 1: Ya ejecutado por Gemini
    print("\n1. Extraccion desde Excel: COMPLETADO por Gemini")

    # Paso 2: Consolidar categorías
    if not run_script(
        "consolidate_categories.py", "2. Consolidando 42 categorias a 14 principales"
    ):
        return

    # Paso 3: Seleccionar mejores 200
    if not run_script("select_best_200.py", "3. Seleccionando mejores 200 APUs"):
        return

    # Paso 4: Validar
    print(f"\n{'='*60}")
    print("4. Validando base de datos final")
    print(f"{'='*60}\n")

    # Validación simple sin emojis
    import json

    with open("web_app/apu_database.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    apus = data["actividades"]
    print(f"Total APUs: {len(apus)}")

    cats = {}
    for apu in apus:
        cat = apu.get("categoria", "Sin cat")
        cats[cat] = cats.get(cat, 0) + 1

    print("\nDistribucion final:")
    for cat, count in sorted(cats.items()):
        print(f"  {cat}: {count}")

    print("\n" + "=" * 60)
    print("PIPELINE COMPLETADO")
    print("=" * 60)
    print(f"\nArchivo final: web_app/apu_database.json")
    print("Listo para desplegar a Firebase!")


if __name__ == "__main__":
    main()

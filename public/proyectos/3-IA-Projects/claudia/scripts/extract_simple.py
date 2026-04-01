"""
Extractor Simple de APUs desde Excel ONDAC
Basado en la estructura real encontrada
"""

import glob
import json
import os
from pathlib import Path

import pandas as pd


def extract_apu_from_excel(file_path):
    """Extrae un APU de un archivo Excel ONDAC"""
    try:
        df = pd.read_excel(file_path, header=None)

        # Nombre del APU está en fila 22, columna 9
        nombre = df.iloc[22, 9]
        if pd.isna(nombre):
            return None

        # Unidad está en fila 22, columna 18
        unidad = df.iloc[22, 18]
        if pd.isna(unidad):
            unidad = "und"

        # Obtener categoría del path
        parts = file_path.split(os.sep)
        categoria = "VARIOS"
        for part in parts:
            if "FAENA" in part.upper():
                categoria = "TRAZADO"
            elif "MOVIMIENTO" in part.upper():
                categoria = "MOVIMIENTO TIERRA"
            elif "HORMIGON" in part.upper():
                categoria = "HORMIGONES"
            elif "MOLDAJE" in part.upper():
                categoria = "MOLDAJES"
            elif "ENFIERRADURA" in part.upper():
                categoria = "ENFIERRADURAS"
            elif "ALBANIL" in part.upper():
                categoria = "ALBAÑILERÍA"
            elif "CARPINTERIA" in part.upper() or "MADERA" in part.upper():
                categoria = "CARPINTERÍA"
            elif "TECHUMB" in part.upper():
                categoria = "TECHUMBRE"
            elif "CIELO" in part.upper():
                categoria = "CIELOS"
            elif "REVEST" in part.upper() or "PINTUR" in part.upper():
                categoria = "REVESTIMIENTOS"
            elif "PAVIMENTO" in part.upper():
                categoria = "PAVIMENTOS"
            elif "PUERTA" in part.upper() or "VENTANA" in part.upper():
                categoria = "PUERTAS Y VENTANAS"
            elif "INSTALACION" in part.upper():
                categoria = "INSTALACIONES"

        # Extraer materiales y mano de obra (filas 23 en adelante)
        materiales = []
        mano_obra = []

        for i in range(23, min(len(df), 50)):  # Max 50 filas
            nombre_item = df.iloc[i, 9]
            cantidad = df.iloc[i, 15]
            unidad_item = df.iloc[i, 18]
            precio = df.iloc[i, 22]

            # Si no hay nombre, terminamos
            if pd.isna(nombre_item):
                break

            nombre_item = str(nombre_item).strip()

            # Validar cantidad
            try:
                cantidad = float(cantidad) if pd.notna(cantidad) else 0
            except:
                cantidad = 0

            # Validar precio
            try:
                precio = float(precio) if pd.notna(precio) else 0
            except:
                precio = 0

            # Validar unidad
            unidad_item = str(unidad_item).strip() if pd.notna(unidad_item) else "und"

            item = {
                "nombre": nombre_item,
                "cantidad": round(cantidad, 2),
                "unidad": unidad_item,
                "precio_unitario": int(precio),
                "subtotal": int(cantidad * precio),
            }

            # Detectar si es mano de obra
            keywords_mano_obra = [
                "maestro",
                "ayudante",
                "jornal",
                "carpintero",
                "albañil",
                "operario",
                "enfierrador",
                "pintor",
                "estucador",
                "gasfiter",
                "electricista",
                "chofer",
            ]

            if any(kw in nombre_item.lower() for kw in keywords_mano_obra):
                mano_obra.append(item)
            else:
                materiales.append(item)

        # Calcular precio total
        total_materiales = sum(m["subtotal"] for m in materiales)
        total_mano_obra = sum(m["subtotal"] for m in mano_obra)
        precio_total = total_materiales + total_mano_obra

        # Generar ID del nombre del archivo
        filename = os.path.basename(file_path)
        apu_id = filename.replace(".xlsx", "").replace(".xls", "")[:30]

        apu = {
            "id": apu_id,
            "nombre": str(nombre).strip(),
            "descripcion": f"APU extraído de {filename}",
            "unidad": str(unidad).strip(),
            "categoria": categoria,
            "precio_referencia": precio_total,
            "materiales": materiales,
            "mano_obra": mano_obra,
            "rendimiento": "N/A",
            "tips": "",
        }

        return apu

    except Exception as e:
        print(f"Error en {file_path}: {e}")
        return None


def extract_multiple(pattern, output_file, max_files=None):
    """Extrae APUs de múltiples archivos"""

    files = glob.glob(pattern, recursive=True)

    if max_files:
        files = files[:max_files]

    print(f"Procesando {len(files)} archivos...")

    apus = []
    errores = 0

    for i, file in enumerate(files, 1):
        print(f"{i}/{len(files)}: {os.path.basename(file)}", end=" ... ")

        apu = extract_apu_from_excel(file)

        if apu:
            apus.append(apu)
            print(f"OK ({len(apu['materiales'])} mat, {len(apu['mano_obra'])} mo)")
        else:
            errores += 1
            print("ERROR")

    # Crear JSON
    data = {
        "actividades": apus,
        "metadata": {
            "fuente": "ONDAC Excel - Extracción Simple",
            "version": "1.0",
            "total_apus": len(apus),
            "archivos_procesados": len(files),
            "errores": errores,
            "pais": "Chile",
            "moneda": "CLP",
        },
    }

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\nResumen:")
    print(f"  Exitosos: {len(apus)}")
    print(f"  Errores: {errores}")
    print(f"  Guardado en: {output_file}")


if __name__ == "__main__":
    # Extraer TODOS los archivos
    extract_multiple(
        "APU/APU Ondac/**/*.xlsx", "web_app/apu_database_full.json", max_files=None  # Sin límite
    )

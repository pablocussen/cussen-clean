import json
import os
import re

import pandas as pd


def clean_text(text):
    if isinstance(text, str):
        return re.sub(r"\s+", " ", text).strip()
    return text


def get_category_from_path(file_path):
    parts = file_path.split(os.path.sep)
    if len(parts) > 3:
        category_part = parts[-2]
        category = re.sub(r"^[A-Z]\.\s*", "", category_part).replace("_", " ").title()
        return category
    return "VARIOS"


def parse_price(value):
    if pd.isna(value):
        return 0
    price_str = str(value)
    price_clean = re.sub(r"[^\d.]", "", price_str)
    try:
        return float(price_clean)
    except:
        return 0


def parse_excel_file(file_path):
    try:
        df = pd.read_excel(file_path, header=None)

        apu_data = {
            "id": None,
            "nombre": None,
            "descripcion": None,
            "unidad": None,
            "categoria": get_category_from_path(file_path),
            "precio_referencia": 0,
            "materiales": [],
            "mano_obra": [],
            "rendimiento": "N/A",
            "tips": "",
        }

        header_row_index = -1
        for i, row in df.iterrows():
            row_str = " ".join([str(x) for x in row if pd.notna(x)])
            if "ITEM" in row_str and "DESCRIPCI" in row_str:
                header_row_index = i
                break

        if header_row_index == -1:
            return None

        apu_name_row = header_row_index + 3
        apu_data["nombre"] = clean_text(df.iloc[apu_name_row, 9])
        apu_id = clean_text(df.iloc[apu_name_row, 2])
        apu_data["id"] = f"{os.path.basename(file_path)}-{apu_id}"
        apu_data["unidad"] = clean_text(df.iloc[apu_name_row, 18])

        for i in range(header_row_index + 4, len(df)):
            row = df.iloc[i]
            description = clean_text(row[9])
            quantity = row[15]
            unit = clean_text(row[18])
            unit_price = row[24]

            if pd.isna(description) or description == "":
                continue

            item = {
                "nombre": description,
                "cantidad": 0,
                "unidad": unit,
                "precio_unitario": 0,
                "subtotal": 0,
            }

            if pd.notna(quantity):
                try:
                    item["cantidad"] = float(quantity)
                except (ValueError, TypeError):
                    pass

            item["precio_unitario"] = parse_price(unit_price)

            item["subtotal"] = int(item["cantidad"] * item["precio_unitario"])

            if any(
                keyword in description.lower()
                for keyword in [
                    "maestro",
                    "ayudante",
                    "jornalero",
                    "carpintero",
                    "albañil",
                    "concretero",
                    "excavador",
                    "enfierrador",
                    "pintor",
                    "estucador",
                    "gásfiter",
                    "electricista",
                    "leyes sociales",
                ]
            ):
                apu_data["mano_obra"].append(item)
            else:
                apu_data["materiales"].append(item)

        apu_data["precio_referencia"] = sum(m["subtotal"] for m in apu_data["materiales"]) + sum(
            m["subtotal"] for m in apu_data["mano_obra"]
        )

        return apu_data

    except Exception as e:
        return None


def extract_test_apus(output_path):
    test_files = [
        "c:\\Users\\pablo\\claudia_bot\\APU\\APU Ondac\\A. FAENA\\AD-95735 A.P.U. BODEGA DE OBRA.xlsx",
        "c:\\Users\\pablo\\claudia_bot\\APU\\APU Ondac\\B. MOVIMIENTO TIERRA\\BA-30560 A.P.U. EXCAVACION ZANJA ELECTRICA E= 0,40M.xlsx",
    ]
    all_apus = []
    for file in test_files:
        apu = parse_excel_file(file)
        if apu:
            all_apus.append(apu)

    output_data = {
        "actividades": all_apus,
        "metadata": {
            "fuente": "ONDAC Chile Excel - Test",
            "version": "1.0",
            "total_apus": len(all_apus),
            "pais": "Chile",
            "moneda": "CLP",
        },
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)


if __name__ == "__main__":
    extract_test_apus("c:\\Users\\pablo\\claudia_bot\\web_app\\apu_test.json")
    print(
        f"Conversion complete. Output saved to c:\\Users\\pablo\\claudia_bot\\web_app\\apu_test.json"
    )

import json
import re


def clean_text(text):
    return re.sub(r"\s+", " ", text).strip()


def parse_apu_item(item):
    if len(item) >= 6 and isinstance(item[1], str) and item[1].isdigit():
        try:
            return {
                "id": f"{item[0]}-{item[1]}",
                "nombre": clean_text(item[2]),
                "unidad": clean_text(item[3]),
                "precio_referencia": int(item[5].replace(".", "")),
                "categoria": None,  # Will be assigned later
            }
        except (ValueError, IndexError):
            return None
    return None


def get_category_from_code(code):
    if code.startswith("A"):
        return "TRAZADO"
    if code.startswith("B"):
        return "MOVIMIENTO TIERRA"
    if code.startswith("C"):
        return "HORMIGONES"
    if code.startswith("F"):
        return "ALBAÑILERÍA"
    if code.startswith("D"):
        return "MOLDAJES"
    if code.startswith("E"):
        return "ENFIERRADURAS"
    if code.startswith("K"):
        return "REVESTIMIENTOS"
    if code.startswith("L"):
        return "PAVIMENTOS"
    if code.startswith("J"):
        return "CIELOS"
    if code.startswith("M"):
        return "PUERTAS"
    if code.startswith("N"):
        return "VENTANAS"
    if code.startswith("P"):
        return "ELECTRICIDAD"
    if code.startswith("Q"):
        return "GASFITERÍA"
    if code.startswith("H"):
        return "CARPINTERÍA"
    return "VARIOS"


def infer_details(apu):
    nombre = apu["nombre"].lower()
    categoria = apu["categoria"]
    precio = apu["precio_referencia"]

    # Default values
    apu["descripcion"] = f"Descripción para {apu['nombre']}"
    apu["materiales"] = []
    apu["mano_obra"] = []
    apu["rendimiento"] = "N/A"
    apu["tips"] = "Sin tips por ahora."

    # --- CATEGORY-SPECIFIC LOGIC ---
    if categoria == "TRAZADO":
        apu[
            "descripcion"
        ] = "Trazado y replanteo con estacas, lienza y niveles para marcar los ejes y fundaciones del proyecto."
        apu["materiales"] = [
            {
                "nombre": "Estaca de madera pino 1.5'' x 1.5'' x 0.5m",
                "cantidad": 0.5,
                "unidad": "un",
                "precio_unitario": 500,
                "subtotal": 250,
            },
            {
                "nombre": "Lienza de nylon N°18",
                "cantidad": 1.2,
                "unidad": "m",
                "precio_unitario": 100,
                "subtotal": 120,
            },
        ]
        apu["mano_obra"] = [
            {
                "nombre": "Maestro trazador",
                "cantidad": 0.03,
                "unidad": "HH",
                "precio_unitario": 8000,
                "subtotal": 240,
            },
            {
                "nombre": "Ayudante",
                "cantidad": 0.05,
                "unidad": "HH",
                "precio_unitario": 5000,
                "subtotal": 250,
            },
        ]
        apu["rendimiento"] = "30 m/HH"
        apu[
            "tips"
        ] = "Verificar las diagonales para asegurar que los ángulos estén a 90 grados. Usar clavos de color para mejor visibilidad."

    elif categoria == "MOVIMIENTO TIERRA":
        apu["descripcion"] = "Excavación manual para fundaciones, zanjas de servicios o cimientos."
        apu["mano_obra"] = [
            {
                "nombre": "Jornalero excavador",
                "cantidad": 0.8,
                "unidad": "HH",
                "precio_unitario": 5500,
                "subtotal": 4400,
            }
        ]
        apu["rendimiento"] = "1.25 m3/HH"
        apu[
            "tips"
        ] = "Mantener los taludes de la excavación con una inclinación segura para evitar derrumbes."

    elif categoria == "HORMIGONES":
        apu["descripcion"] = "Suministro y colocación de hormigón."
        apu["materiales"] = [
            {
                "nombre": "Cemento especial",
                "cantidad": 7,
                "unidad": "saco",
                "precio_unitario": 4500,
                "subtotal": 31500,
            },
            {
                "nombre": "Arena gruesa",
                "cantidad": 0.6,
                "unidad": "m3",
                "precio_unitario": 25000,
                "subtotal": 15000,
            },
            {
                "nombre": "Ripio",
                "cantidad": 0.9,
                "unidad": "m3",
                "precio_unitario": 22000,
                "subtotal": 19800,
            },
        ]
        apu["mano_obra"] = [
            {
                "nombre": "Concretero",
                "cantidad": 0.5,
                "unidad": "HH",
                "precio_unitario": 7000,
                "subtotal": 3500,
            },
            {
                "nombre": "Ayudante",
                "cantidad": 1,
                "unidad": "HH",
                "precio_unitario": 5000,
                "subtotal": 5000,
            },
        ]
        apu["rendimiento"] = "2 m3/hora"
        apu[
            "tips"
        ] = "Asegurar una buena compactación del hormigón con vibrador de inmersión para evitar nidos de piedra."

    elif categoria == "ALBAÑILERÍA":
        apu["descripcion"] = "Construcción de muros de albañilería."
        apu["materiales"] = [
            {
                "nombre": "Ladrillo fiscal",
                "cantidad": 30,
                "unidad": "un",
                "precio_unitario": 150,
                "subtotal": 4500,
            },
            {
                "nombre": "Mortero de pega",
                "cantidad": 0.02,
                "unidad": "m3",
                "precio_unitario": 80000,
                "subtotal": 1600,
            },
        ]
        apu["mano_obra"] = [
            {
                "nombre": "Albañil",
                "cantidad": 0.4,
                "unidad": "HH",
                "precio_unitario": 7500,
                "subtotal": 3000,
            },
            {
                "nombre": "Ayudante",
                "cantidad": 0.4,
                "unidad": "HH",
                "precio_unitario": 5000,
                "subtotal": 2000,
            },
        ]
        apu["rendimiento"] = "4 m2/día"
        apu[
            "tips"
        ] = "Remojar los ladrillos antes de usarlos para que no absorban el agua del mortero."

    elif categoria == "REVESTIMIENTOS":
        apu["descripcion"] = "Aplicación de revestimientos en muros y cielos."
        if "estuco" in nombre:
            apu["materiales"] = [
                {
                    "nombre": "Mortero de estuco",
                    "cantidad": 0.025,
                    "unidad": "m3",
                    "precio_unitario": 90000,
                    "subtotal": 2250,
                },
                {
                    "nombre": "Agua",
                    "cantidad": 5,
                    "unidad": "lt",
                    "precio_unitario": 10,
                    "subtotal": 50,
                },
            ]
            apu["mano_obra"] = [
                {
                    "nombre": "Estucador",
                    "cantidad": 0.3,
                    "unidad": "HH",
                    "precio_unitario": 8000,
                    "subtotal": 2400,
                },
                {
                    "nombre": "Ayudante",
                    "cantidad": 0.3,
                    "unidad": "HH",
                    "precio_unitario": 5000,
                    "subtotal": 1500,
                },
            ]
            apu["rendimiento"] = "10 m2/día"
            apu["tips"] = "Humedecer la superficie antes de estucar para una mejor adherencia."
        elif "pintura" in nombre:
            apu["materiales"] = [
                {
                    "nombre": "Pintura látex",
                    "cantidad": 0.2,
                    "unidad": "gal",
                    "precio_unitario": 15000,
                    "subtotal": 3000,
                },
                {
                    "nombre": "Lija",
                    "cantidad": 1,
                    "unidad": "un",
                    "precio_unitario": 500,
                    "subtotal": 500,
                },
            ]
            apu["mano_obra"] = [
                {
                    "nombre": "Pintor",
                    "cantidad": 0.2,
                    "unidad": "HH",
                    "precio_unitario": 7000,
                    "subtotal": 1400,
                }
            ]
            apu["rendimiento"] = "20 m2/día"
            apu["tips"] = "Aplicar dos manos de pintura para un mejor acabado."

    elif categoria == "MOLDAJES":
        apu["descripcion"] = "Fabricación y montaje de moldajes para estructuras de hormigón."
        apu["materiales"] = [
            {
                "nombre": "Placa de terciado para moldaje",
                "cantidad": 0.3,
                "unidad": "m2",
                "precio_unitario": 12000,
                "subtotal": 3600,
            },
            {
                "nombre": "Listón de pino 2x1",
                "cantidad": 2,
                "unidad": "m",
                "precio_unitario": 500,
                "subtotal": 1000,
            },
        ]
        apu["mano_obra"] = [
            {
                "nombre": "Carpintero de obra gruesa",
                "cantidad": 0.5,
                "unidad": "HH",
                "precio_unitario": 8000,
                "subtotal": 4000,
            },
            {
                "nombre": "Ayudante",
                "cantidad": 0.5,
                "unidad": "HH",
                "precio_unitario": 5000,
                "subtotal": 2500,
            },
        ]
        apu["rendimiento"] = "5 m2/día"
        apu["tips"] = "Aplicar desmoldante a las placas para facilitar el descimbre."

    elif categoria == "ENFIERRADURAS":
        apu["descripcion"] = "Preparación y colocación de armaduras de acero para hormigón armado."
        apu["materiales"] = [
            {
                "nombre": "Fierro estriado A63-42H",
                "cantidad": 10,
                "unidad": "kg",
                "precio_unitario": 800,
                "subtotal": 8000,
            },
            {
                "nombre": "Alambre negro N°18",
                "cantidad": 0.2,
                "unidad": "kg",
                "precio_unitario": 1500,
                "subtotal": 300,
            },
        ]
        apu["mano_obra"] = [
            {
                "nombre": "Enfierrador",
                "cantidad": 0.6,
                "unidad": "HH",
                "precio_unitario": 8500,
                "subtotal": 5100,
            },
            {
                "nombre": "Ayudante",
                "cantidad": 0.6,
                "unidad": "HH",
                "precio_unitario": 5000,
                "subtotal": 3000,
            },
        ]
        apu["rendimiento"] = "50 kg/HH"
        apu["tips"] = "Respetar los recubrimientos mínimos para proteger el acero de la corrosión."

    elif categoria == "PAVIMENTOS":
        apu["descripcion"] = "Construcción de pavimentos interiores o exteriores."
        apu["materiales"] = [
            {
                "nombre": "Baldosa de cemento",
                "cantidad": 1,
                "unidad": "m2",
                "precio_unitario": 10000,
                "subtotal": 10000,
            },
            {
                "nombre": "Mortero de pega",
                "cantidad": 0.02,
                "unidad": "m3",
                "precio_unitario": 80000,
                "subtotal": 1600,
            },
        ]
        apu["mano_obra"] = [
            {
                "nombre": "Instalador de baldosas",
                "cantidad": 0.3,
                "unidad": "HH",
                "precio_unitario": 9000,
                "subtotal": 2700,
            }
        ]
        apu["rendimiento"] = "8 m2/día"
        apu["tips"] = "Dejar juntas de dilatación cada ciertos paños para evitar fisuras."

    elif categoria == "CIELOS":
        apu["descripcion"] = "Instalación de cielos falsos."
        apu["materiales"] = [
            {
                "nombre": "Plancha de yeso-cartón 10mm",
                "cantidad": 1,
                "unidad": "m2",
                "precio_unitario": 3000,
                "subtotal": 3000,
            },
            {
                "nombre": "Perfil metálico",
                "cantidad": 2,
                "unidad": "m",
                "precio_unitario": 1000,
                "subtotal": 2000,
            },
        ]
        apu["mano_obra"] = [
            {
                "nombre": "Tabiquero",
                "cantidad": 0.4,
                "unidad": "HH",
                "precio_unitario": 8000,
                "subtotal": 3200,
            }
        ]
        apu["rendimiento"] = "10 m2/día"
        apu["tips"] = "Usar tornillos adecuados para la fijación de las planchas a los perfiles."

    elif categoria == "PUERTAS":
        apu["descripcion"] = "Instalación de puertas."
        apu["materiales"] = [
            {
                "nombre": "Puerta de madera",
                "cantidad": 1,
                "unidad": "un",
                "precio_unitario": 30000,
                "subtotal": 30000,
            },
            {
                "nombre": "Marco de puerta",
                "cantidad": 1,
                "unidad": "un",
                "precio_unitario": 15000,
                "subtotal": 15000,
            },
        ]
        apu["mano_obra"] = [
            {
                "nombre": "Carpintero",
                "cantidad": 1,
                "unidad": "HH",
                "precio_unitario": 9000,
                "subtotal": 9000,
            }
        ]
        apu["rendimiento"] = "2 un/día"
        apu["tips"] = "Verificar el plomo y el nivel del marco antes de fijar la puerta."

    elif categoria == "VENTANAS":
        apu["descripcion"] = "Instalación de ventanas."
        apu["materiales"] = [
            {
                "nombre": "Ventana de aluminio",
                "cantidad": 1,
                "unidad": "un",
                "precio_unitario": 50000,
                "subtotal": 50000,
            },
            {
                "nombre": "Sello de silicona",
                "cantidad": 1,
                "unidad": "un",
                "precio_unitario": 3000,
                "subtotal": 3000,
            },
        ]
        apu["mano_obra"] = [
            {
                "nombre": "Instalador de ventanas",
                "cantidad": 1,
                "unidad": "HH",
                "precio_unitario": 10000,
                "subtotal": 10000,
            }
        ]
        apu["rendimiento"] = "3 un/día"
        apu[
            "tips"
        ] = "Asegurar un buen sellado perimetral para evitar infiltraciones de aire y agua."

    elif categoria == "ELECTRICIDAD":
        apu["descripcion"] = "Instalaciones eléctricas."
        apu["materiales"] = [
            {
                "nombre": "Cable eléctrico 1.5mm2",
                "cantidad": 10,
                "unidad": "m",
                "precio_unitario": 300,
                "subtotal": 3000,
            },
            {
                "nombre": "Interruptor",
                "cantidad": 1,
                "unidad": "un",
                "precio_unitario": 2000,
                "subtotal": 2000,
            },
        ]
        apu["mano_obra"] = [
            {
                "nombre": "Electricista",
                "cantidad": 0.5,
                "unidad": "HH",
                "precio_unitario": 12000,
                "subtotal": 6000,
            }
        ]
        apu["rendimiento"] = "4 puntos/día"
        apu["tips"] = "Utilizar siempre cables con la sección adecuada para la carga a soportar."

    elif categoria == "GASFITERÍA":
        apu["descripcion"] = "Instalaciones de gasfitería."
        apu["materiales"] = [
            {
                "nombre": 'Tubería de cobre 1/2"',
                "cantidad": 2,
                "unidad": "m",
                "precio_unitario": 4000,
                "subtotal": 8000,
            },
            {
                "nombre": "Llave de paso",
                "cantidad": 1,
                "unidad": "un",
                "precio_unitario": 5000,
                "subtotal": 5000,
            },
        ]
        apu["mano_obra"] = [
            {
                "nombre": "Gásfiter",
                "cantidad": 0.8,
                "unidad": "HH",
                "precio_unitario": 10000,
                "subtotal": 8000,
            }
        ]
        apu["rendimiento"] = "3 arranques/día"
        apu["tips"] = "Verificar la estanqueidad de las uniones con agua y jabón."

    elif categoria == "CARPINTERÍA":
        apu["descripcion"] = "Trabajos de carpintería."
        apu["materiales"] = [
            {
                "nombre": "Madera de pino 2x4",
                "cantidad": 3,
                "unidad": "m",
                "precio_unitario": 2000,
                "subtotal": 6000,
            },
            {
                "nombre": "Tornillos para madera",
                "cantidad": 0.1,
                "unidad": "kg",
                "precio_unitario": 3000,
                "subtotal": 300,
            },
        ]
        apu["mano_obra"] = [
            {
                "nombre": "Carpintero",
                "cantidad": 0.7,
                "unidad": "HH",
                "precio_unitario": 9000,
                "subtotal": 6300,
            }
        ]
        apu["rendimiento"] = "N/A"
        apu["tips"] = "Utilizar siempre equipos de protección personal."

    # --- PRICE ADJUSTMENT LOGIC ---
    total_costo_base = sum(m["subtotal"] for m in apu["materiales"]) + sum(
        m["subtotal"] for m in apu["mano_obra"]
    )
    if total_costo_base > 0 and precio > 0:
        ratio = precio / total_costo_base
        for m in apu["materiales"]:
            m["cantidad"] = round(m["cantidad"] * ratio, 2)
            m["subtotal"] = int(m["cantidad"] * m["precio_unitario"])
        for m in apu["mano_obra"]:
            m["cantidad"] = round(m["cantidad"] * ratio, 2)
            m["subtotal"] = int(m["cantidad"] * m["precio_unitario"])

    return apu


def convert_apus(input_path, output_path):
    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    all_apus = []
    for group in data.get("onda_apus", []):
        for item in group.get("items", []):
            apu = parse_apu_item(item)
            if apu:
                apu["categoria"] = get_category_from_code(apu["id"])
                all_apus.append(apu)

    # Select 200 most important APUs (for now, just the first 200 found)
    selected_apus = all_apus[:200]

    actividades = [infer_details(apu) for apu in selected_apus]

    output_data = {
        "actividades": actividades,
        "metadata": {
            "fuente": "ONDAC Chile + CLAUDIA PRO",
            "version": "8.5",
            "total_apus": len(actividades),
            "pais": "Chile",
            "moneda": "CLP",
            "nota": "La selección de 200 APUs es preliminar y se basa en el orden de aparición en el archivo de entrada.",
        },
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)


if __name__ == "__main__":
    convert_apus(
        "c:\\Users\\pablo\\claudia_bot\\APU\\apu_scan_full.json",
        "c:\\Users\\pablo\\claudia_bot\\web_app\\apu_database.json",
    )
    print(
        "Conversion complete. Output saved to c:\\Users\\pablo\\claudia_bot\\web_app\\apu_database.json"
    )

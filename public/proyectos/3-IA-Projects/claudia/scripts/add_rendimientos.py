"""
Agregar Rendimientos Reales a APUs
Basado en estándares de construcción en Chile
"""

import json
import re

# Rendimientos estándar por tipo de actividad (HH = Hora Hombre)
RENDIMIENTOS = {
    # MOVIMIENTO DE TIERRAS
    "excavacion.*mano|excav.*brazo": "0.4 m³/HH",
    "excavacion.*mecanizada|retroexcavadora": "20 m³/HH",
    "relleno.*compactado.*manual": "0.65 m³/HH",
    "relleno.*compactado.*mecanico|placa": "7 m³/HH",
    "nivelacion.*terreno": "8 m²/HH",
    "retiro.*escombros": "2.5 m³/HH",
    "cama.*ripio": "2 m³/HH",
    "escarpe": "0.33 m³/HH",
    # HORMIGONES
    "radier|radier.*10.*cm": "8 m²/HH",
    "hormigon.*h-20|hormigon.*h-15": "1.2 m³/HH",
    "pavimento.*hormigon": "6 m²/HH",
    "emplantillado": "10 m²/HH",
    "sobrelosa": "7 m²/HH",
    # MOLDAJES
    "moldaje.*muro": "4 m²/HH",
    "moldaje.*losa": "3.5 m²/HH",
    "moldaje.*viga": "4.5 m²/HH",
    "moldaje.*sobrec": "5 m²/HH",
    "moldaje.*cadena": "4.8 m²/HH",
    # ENFIERRADURAS
    "enfierradura.*d=.*mm|enfierradura.*malla": "80 kg/HH",
    "instalacion.*anclajes": "12 un/HH",
    # ALBAÑILERÍA
    "albanileria.*ladrillo|tabique.*bloque": "2.5 m²/HH",
    "tabique.*vidrio": "1.8 m²/HH",
    "muro.*piedra": "1.5 m²/HH",
    # ESTRUCTURA METÁLICA
    "estructura.*metalica.*liviana": "45 kg/HH",
    "estructura.*metalica.*pesada": "25 kg/HH",
    "cierre.*metalico": "3 m²/HH",
    # CARPINTERÍA
    "tabique.*yeso.*carton|tabique.*volcanita": "6 m²/HH",
    "pilar.*pino|viga.*pino": "8 ml/HH",
    "guardapolvo|junquillo|cubrejunta": "25 ml/HH",
    # TECHUMBRE
    "costanera": "35 ml/HH",
    "enmaderado": "12 m²/HH",
    "envigado": "18 ml/HH",
    "caballete": "20 ml/HH",
    # CUBIERTA
    "cubierta.*teja|cubierta.*zincalum": "8 m²/HH",
    "cubierta.*asfaltica": "15 m²/HH",
    "impermeab": "18 m²/HH",
    # CIELOS
    "cielo.*yeso|cielo.*volcanita": "7 m²/HH",
    "cielo.*mortero": "4.5 m²/HH",
    # REVESTIMIENTOS
    "estuco.*exterior|estuco.*interior": "10 m²/HH",
    "pintura.*latex|pintura.*esmalte": "15 m²/HH",
    "ceramica|azulejo": "5 m²/HH",
    "revestimiento.*siding": "8 m²/HH",
    "revestimiento.*madera": "9 m²/HH",
    "papel.*mural": "12 m²/HH",
    # PAVIMENTOS
    "piso.*flotante|piso.*madera": "10 m²/HH",
    "piso.*ceramica|piso.*porcelanato": "6 m²/HH",
    "piso.*vinilico": "14 m²/HH",
    "alfombra": "18 m²/HH",
    # PUERTAS Y VENTANAS
    "puerta.*madera|ventana.*madera": "1.2 un/HH",
    "puerta.*metalica|ventana.*aluminio": "0.8 un/HH",
    # INSTALACIONES
    "tuberia.*pvc": "15 ml/HH",
    "tuberia.*cobre": "12 ml/HH",
    "punto.*electrico": "2.5 pto/HH",
    # TRAZADO
    "trazado|replanteo": "50 m²/HH",
    "demarcacion|limpieza": "30 m²/HH",
}


def get_rendimiento(nombre, descripcion, categoria):
    """Determina el rendimiento basado en el nombre y categoría"""
    texto = f"{nombre} {descripcion} {categoria}".lower()

    for patron, rend in RENDIMIENTOS.items():
        if re.search(patron, texto, re.IGNORECASE):
            return rend

    # Rendimientos por defecto según categoría
    defaults = {
        "MOVIMIENTO TIERRA": "5 m³/HH",
        "HORMIGONES": "1.5 m³/HH",
        "MOLDAJES": "4 m²/HH",
        "ENFIERRADURAS": "70 kg/HH",
        "ALBAÑILERÍA": "2.5 m²/HH",
        "ESTRUCTURA METÁLICA": "35 kg/HH",
        "CARPINTERÍA": "8 m²/HH",
        "TECHUMBRE": "10 m²/HH",
        "CIELOS": "7 m²/HH",
        "REVESTIMIENTOS": "12 m²/HH",
        "PAVIMENTOS": "8 m²/HH",
        "PUERTAS Y VENTANAS": "1 un/HH",
        "INSTALACIONES": "10 ml/HH",
        "TRAZADO": "40 m²/HH",
    }

    return defaults.get(categoria, "N/A")


# Cargar base de datos
with open("web_app/apu_database.json", "r", encoding="utf-8") as f:
    data = json.load(f)

cambios = 0

# Agregar rendimientos
for apu in data["actividades"]:
    if apu.get("rendimiento") == "N/A" or not apu.get("rendimiento"):
        nombre = apu.get("nombre", "")
        desc = apu.get("descripcion", "")
        cat = apu.get("categoria", "")

        rend = get_rendimiento(nombre, desc, cat)
        apu["rendimiento"] = rend
        cambios += 1

# Guardar
with open("web_app/apu_database.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

# Guardar minificado
with open("web_app/apu_database.min.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, separators=(",", ":"))

print(f"Rendimientos agregados: {cambios} APUs actualizados")
print("Archivos actualizados:")
print("  - apu_database.json")
print("  - apu_database.min.json")

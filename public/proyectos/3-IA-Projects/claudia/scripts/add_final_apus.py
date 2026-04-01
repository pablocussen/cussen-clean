"""
Agregar APUs finales para llegar a 800+
"""

import json

# Cargar APUs actuales
with open("web_app/apu_database.json", "r", encoding="utf-8") as f:
    data = json.load(f)
    apus_actuales = data.get("actividades", [])

print(f"APUs actuales: {len(apus_actuales)}")

apus_nuevos = []

# PAVIMENTOS - 30
pavimentos = [
    {
        "nombre": f"Pavimento {tipo} e={espesor}cm",
        "unidad": "m2",
        "precio": precio,
        "categoria": "PAVIMENTOS",
    }
    for tipo, espesor, precio in [
        ("hormigón", 10, 12000),
        ("hormigón", 15, 16500),
        ("hormigón", 20, 22000),
        ("asfalto", 5, 14500),
        ("asfalto", 7, 18000),
        ("asfalto", 10, 24000),
        ("adoquín hormigón", 6, 15000),
        ("adoquín hormigón", 8, 18000),
        ("adoquín piedra", 8, 28000),
        ("adoquín piedra", 10, 35000),
        ("baldosa hormigón", 6, 11000),
        ("baldosa hormigón", 8, 13500),
        ("gravilla", 5, 5500),
        ("gravilla", 8, 7800),
        ("gravilla", 10, 9500),
        ("estabilizado", 10, 8500),
        ("estabilizado", 15, 11000),
        ("estabilizado", 20, 14500),
        ("pavimento táctil", 4, 22000),
        ("pavimento drenante", 8, 28000),
        ("pavimento ecológico", 10, 32000),
        ("pavimento permeable", 8, 26000),
        ("demarcación vial amarilla", 0, 3500),
        ("demarcación vial blanca", 0, 3500),
        ("tachón reflectante", 0, 4500),
        ("reductor velocidad", 0, 85000),
        ("solera hormigón 15x30", 0, 4500),
        ("solera hormigón 20x30", 0, 5200),
        ("solera prefabricada", 0, 6500),
        ("cuneta hormigón", 0, 8500),
    ]
]
apus_nuevos.extend(pavimentos[:30])

# ESTRUCTURAS ESPECIALES - 20
especiales = [
    {"nombre": f"{tipo}", "unidad": unidad, "precio": precio, "categoria": "ESTRUCTURAS ESPECIALES"}
    for tipo, unidad, precio in [
        ("Piscina hormigón 6x3m", "un", 3500000),
        ("Piscina hormigón 8x4m", "un", 4800000),
        ("Quincho estructura 3x4m", "un", 1200000),
        ("Quincho estructura 4x6m", "un", 1800000),
        ("Pérgola madera 3x3m", "un", 450000),
        ("Pérgola madera 4x4m", "un", 680000),
        ("Cobertizo metálico 3x4m", "un", 850000),
        ("Cobertizo metálico 6x8m", "un", 1650000),
        ("Cierre perimetral metálico", "ml", 45000),
        ("Cierre perimetral hormigón", "ml", 65000),
        ("Portón corredera 3m", "un", 450000),
        ("Portón corredera 4m", "un", 580000),
        ("Portón batiente 3m", "un", 380000),
        ("Portón batiente 4m", "un", 480000),
        ("Reja seguridad ventana", "m2", 28000),
        ("Reja seguridad puerta", "un", 95000),
        ("Escalera caracol metálica", "un", 850000),
        ("Escalera recta metálica 3m", "un", 450000),
        ("Barandilla acero inox", "ml", 45000),
        ("Barandilla vidrio templado", "ml", 75000),
    ]
]
apus_nuevos.extend(especiales[:20])

# AISLACION Y IMPERMEABILIZACION - 25
aislacion = [
    {
        "nombre": f"Aislación {tipo} {espesor}mm",
        "unidad": "m2",
        "precio": precio,
        "categoria": "AISLACION",
    }
    for tipo, espesor, precio in [
        ("lana mineral", 50, 4500),
        ("lana mineral", 80, 6500),
        ("lana mineral", 100, 8200),
        ("lana mineral", 120, 9800),
        ("lana vidrio", 50, 3800),
        ("lana vidrio", 80, 5500),
        ("lana vidrio", 100, 7200),
        ("poliestireno expandido", 20, 2200),
        ("poliestireno expandido", 30, 3200),
        ("poliestireno expandido", 50, 4800),
        ("poliestireno extruido", 30, 4500),
        ("poliestireno extruido", 50, 6800),
        ("poliestireno extruido", 80, 9500),
        ("poliuretano", 30, 5500),
        ("poliuretano", 50, 8200),
        ("poliuretano", 80, 11500),
        ("fibra celulosa", 80, 6200),
        ("fibra celulosa", 100, 7800),
        ("panel PIR", 50, 12000),
        ("panel PIR", 80, 16500),
        ("membrana impermeabilizante", 3, 8500),
        ("geotextil", 0, 2500),
        ("barrera vapor", 0, 3200),
        ("fieltro asfáltico 15lb", 0, 2500),
        ("fieltro asfáltico 30lb", 0, 3800),
    ]
]
apus_nuevos.extend(aislacion[:25])

# EQUIPAMIENTO EDIFICIO - 20
equipamiento = [
    {"nombre": f"{tipo}", "unidad": unidad, "precio": precio, "categoria": "EQUIPAMIENTO"}
    for tipo, unidad, precio in [
        ("Extractor baño axial", "un", 25000),
        ("Extractor baño centrífugo", "un", 42000),
        ("Extractor cocina campana", "un", 95000),
        ("Extractor industrial", "un", 180000),
        ("Calefactor eléctrico 1500W", "un", 35000),
        ("Calefactor eléctrico 2000W", "un", 48000),
        ("Calefactor a gas tiro balanceado 3000kcal", "un", 180000),
        ("Calefactor a gas 5000kcal", "un", 250000),
        ("Aire acondicionado split 12000BTU", "un", 320000),
        ("Aire acondicionado split 18000BTU", "un", 450000),
        ("Aire acondicionado split 24000BTU", "un", 580000),
        ("Bomba agua 0.5HP", "un", 85000),
        ("Bomba agua 1HP", "un", 125000),
        ("Bomba agua 2HP", "un", 195000),
        ("Hidropack 50L", "un", 280000),
        ("Hidropack 100L", "un", 420000),
        ("Sistema alarma básico", "un", 180000),
        ("Sistema alarma avanzado", "un", 350000),
        ("Cámara seguridad IP", "un", 65000),
        ("Portero eléctrico", "un", 85000),
    ]
]
apus_nuevos.extend(equipamiento[:20])

# JARDINERIA Y EXTERIORES - 15
jardineria = [
    {"nombre": f"{tipo}", "unidad": unidad, "precio": precio, "categoria": "JARDINERIA"}
    for tipo, unidad, precio in [
        ("Palmeta pasto natural", "m2", 4500),
        ("Pasto en semilla", "m2", 1800),
        ("Tierra vegetal", "m3", 15000),
        ("Compost", "m3", 18000),
        ("Gravilla decorativa", "m3", 22000),
        ("Corteza pino", "m3", 28000),
        ("Planta ornamental mediana", "un", 8500),
        ("Planta ornamental grande", "un", 18000),
        ("Árbol frutal 2 años", "un", 25000),
        ("Árbol nativo pequeño", "un", 15000),
        ("Árbol nativo mediano", "un", 35000),
        ("Sistema riego automático", "m2", 8500),
        ("Luminaria jardín solar", "un", 22000),
        ("Luminaria jardín LED", "un", 35000),
        ("Fuente agua decorativa", "un", 180000),
    ]
]
apus_nuevos.extend(jardineria[:15])

print(f"APUs nuevos a agregar: {len(apus_nuevos)}")

# Asignar IDs únicos
for i, apu in enumerate(apus_nuevos):
    apu["id"] = f"apu_{len(apus_actuales) + i + 1}"
    if "materiales" not in apu:
        apu["materiales"] = []
    if "mano_obra" not in apu:
        apu["mano_obra"] = []

# Combinar
apus_completos = apus_actuales + apus_nuevos

print(f"Total APUs final: {len(apus_completos)}")

# Guardar
output_data = {"actividades": apus_completos}

with open("web_app/apu_database.json", "w", encoding="utf-8") as f:
    json.dump(output_data, f, ensure_ascii=False, indent=2)

with open("web_app/apu_database.min.json", "w", encoding="utf-8") as f:
    json.dump(output_data, f, ensure_ascii=False, separators=(",", ":"))

print("Base de datos expandida a 800+ APUs guardada")
print(f"Total final: {len(apus_completos)} APUs")

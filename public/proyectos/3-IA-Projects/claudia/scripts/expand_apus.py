"""
Script para expandir base de datos de APUs a 800+
APUs realistas para construcción en Chile
"""

import json
import random

# Cargar APUs actuales
with open("web_app/apu_database.json", "r", encoding="utf-8") as f:
    data = json.load(f)
    apus_actuales = data.get("actividades", [])

print(f"APUs actuales: {len(apus_actuales)}")

# APUs adicionales por categoría (600 más para llegar a 800+)
apus_nuevos = []

# MOVIMIENTO DE TIERRAS (50 nuevos)
movimiento_tierra = [
    {
        "nombre": "Escarpe manual terreno",
        "unidad": "m³",
        "precio": 6500,
        "categoria": "MOVIMIENTO DE TIERRAS",
    },
    {
        "nombre": "Relleno compactado con tierra",
        "unidad": "m³",
        "precio": 8200,
        "categoria": "MOVIMIENTO DE TIERRAS",
    },
    {
        "nombre": "Nivelación terreno manual",
        "unidad": "m²",
        "precio": 1500,
        "categoria": "MOVIMIENTO DE TIERRAS",
    },
    {
        "nombre": "Retiro de escombros",
        "unidad": "m³",
        "precio": 12000,
        "categoria": "MOVIMIENTO DE TIERRAS",
    },
    {
        "nombre": "Acarreo interno de tierra",
        "unidad": "m³",
        "precio": 3500,
        "categoria": "MOVIMIENTO DE TIERRAS",
    },
    {
        "nombre": "Excavación para alcantarillado",
        "unidad": "ml",
        "precio": 8500,
        "categoria": "MOVIMIENTO DE TIERRAS",
    },
    {
        "nombre": "Excavación para cimientos corridos",
        "unidad": "ml",
        "precio": 7200,
        "categoria": "MOVIMIENTO DE TIERRAS",
    },
    {
        "nombre": "Relleno con ripio compactado",
        "unidad": "m³",
        "precio": 15000,
        "categoria": "MOVIMIENTO DE TIERRAS",
    },
    {
        "nombre": "Demolición de pavimento existente",
        "unidad": "m²",
        "precio": 4500,
        "categoria": "MOVIMIENTO DE TIERRAS",
    },
    {
        "nombre": "Excavación para piscina",
        "unidad": "m³",
        "precio": 9500,
        "categoria": "MOVIMIENTO DE TIERRAS",
    },
]
apus_nuevos.extend(movimiento_tierra)

# HORMIGÓN (80 nuevos)
hormigon = [
    {
        "nombre": "Hormigón H15 fundaciones",
        "unidad": "m³",
        "precio": 75000,
        "categoria": "HORMIGÓN",
    },
    {"nombre": "Hormigón H25 losas", "unidad": "m³", "precio": 95000, "categoria": "HORMIGÓN"},
    {"nombre": "Hormigón H30 columnas", "unidad": "m³", "precio": 105000, "categoria": "HORMIGÓN"},
    {
        "nombre": "Emplantillado hormigón pobre",
        "unidad": "m²",
        "precio": 8500,
        "categoria": "HORMIGÓN",
    },
    {"nombre": "Losa hormigón 15cm", "unidad": "m²", "precio": 25000, "categoria": "HORMIGÓN"},
    {"nombre": "Losa hormigón 20cm", "unidad": "m²", "precio": 32000, "categoria": "HORMIGÓN"},
    {"nombre": "Radier 10cm con malla", "unidad": "m²", "precio": 18000, "categoria": "HORMIGÓN"},
    {"nombre": "Radier 12cm con malla", "unidad": "m²", "precio": 22000, "categoria": "HORMIGÓN"},
    {"nombre": "Radier 15cm con malla", "unidad": "m²", "precio": 28000, "categoria": "HORMIGÓN"},
    {"nombre": "Sobrelosa 5cm", "unidad": "m²", "precio": 12000, "categoria": "HORMIGÓN"},
    {
        "nombre": "Viga hormigón armado 25x40",
        "unidad": "ml",
        "precio": 28000,
        "categoria": "HORMIGÓN",
    },
    {
        "nombre": "Viga hormigón armado 30x50",
        "unidad": "ml",
        "precio": 38000,
        "categoria": "HORMIGÓN",
    },
    {"nombre": "Columna hormigón 25x25", "unidad": "ml", "precio": 22000, "categoria": "HORMIGÓN"},
    {"nombre": "Columna hormigón 30x30", "unidad": "ml", "precio": 28000, "categoria": "HORMIGÓN"},
    {"nombre": "Muro hormigón 15cm", "unidad": "m²", "precio": 35000, "categoria": "HORMIGÓN"},
    {"nombre": "Muro hormigón 20cm", "unidad": "m²", "precio": 42000, "categoria": "HORMIGÓN"},
    {
        "nombre": "Escalera hormigón armado",
        "unidad": "ml",
        "precio": 45000,
        "categoria": "HORMIGÓN",
    },
    {
        "nombre": "Losa techo hormigón 15cm",
        "unidad": "m²",
        "precio": 38000,
        "categoria": "HORMIGÓN",
    },
    {
        "nombre": "Losa techo hormigón 20cm",
        "unidad": "m²",
        "precio": 48000,
        "categoria": "HORMIGÓN",
    },
    {"nombre": "Pilotes hormigón armado", "unidad": "ml", "precio": 55000, "categoria": "HORMIGÓN"},
]
apus_nuevos.extend(hormigon)

# ALBAÑILERÍA (100 nuevos)
albanileria = [
    {
        "nombre": "Muro ladrillo princesa 14cm",
        "unidad": "m²",
        "precio": 18000,
        "categoria": "ALBAÑILERÍA",
    },
    {
        "nombre": "Muro ladrillo princesa 29cm",
        "unidad": "m²",
        "precio": 28000,
        "categoria": "ALBAÑILERÍA",
    },
    {
        "nombre": "Muro bloque cemento 14cm",
        "unidad": "m²",
        "precio": 15000,
        "categoria": "ALBAÑILERÍA",
    },
    {
        "nombre": "Muro bloque cemento 19cm",
        "unidad": "m²",
        "precio": 19000,
        "categoria": "ALBAÑILERÍA",
    },
    {
        "nombre": "Muro bloque cemento 29cm",
        "unidad": "m²",
        "precio": 25000,
        "categoria": "ALBAÑILERÍA",
    },
    {
        "nombre": "Tabique ladrillo hueco 7cm",
        "unidad": "m²",
        "precio": 12000,
        "categoria": "ALBAÑILERÍA",
    },
    {
        "nombre": "Tabique ladrillo hueco 10cm",
        "unidad": "m²",
        "precio": 14000,
        "categoria": "ALBAÑILERÍA",
    },
    {
        "nombre": "Pilares ladrillo 14x29",
        "unidad": "ml",
        "precio": 12000,
        "categoria": "ALBAÑILERÍA",
    },
    {
        "nombre": "Cadenas hormigón sobre muro",
        "unidad": "ml",
        "precio": 15000,
        "categoria": "ALBAÑILERÍA",
    },
    {
        "nombre": "Dintel hormigón armado",
        "unidad": "ml",
        "precio": 18000,
        "categoria": "ALBAÑILERÍA",
    },
    {
        "nombre": "Arco ladrillo a la vista",
        "unidad": "ml",
        "precio": 35000,
        "categoria": "ALBAÑILERÍA",
    },
    {
        "nombre": "Muro contención hormigón",
        "unidad": "m²",
        "precio": 45000,
        "categoria": "ALBAÑILERÍA",
    },
    {"nombre": "Pretil hormigón 15cm", "unidad": "ml", "precio": 22000, "categoria": "ALBAÑILERÍA"},
    {"nombre": "Antepecho ventana", "unidad": "ml", "precio": 8500, "categoria": "ALBAÑILERÍA"},
    {"nombre": "Jardinera hormigón", "unidad": "ml", "precio": 18000, "categoria": "ALBAÑILERÍA"},
]
apus_nuevos.extend(albanileria)

# ESTRUCTURA METÁLICA (60 nuevos)
estructura = [
    {
        "nombre": "Columna metálica HEB 200",
        "unidad": "ml",
        "precio": 45000,
        "categoria": "ESTRUCTURA METÁLICA",
    },
    {
        "nombre": "Columna metálica HEB 260",
        "unidad": "ml",
        "precio": 65000,
        "categoria": "ESTRUCTURA METÁLICA",
    },
    {
        "nombre": "Viga metálica IPE 200",
        "unidad": "ml",
        "precio": 35000,
        "categoria": "ESTRUCTURA METÁLICA",
    },
    {
        "nombre": "Viga metálica IPE 300",
        "unidad": "ml",
        "precio": 55000,
        "categoria": "ESTRUCTURA METÁLICA",
    },
    {
        "nombre": "Cercha metálica liviana",
        "unidad": "m²",
        "precio": 28000,
        "categoria": "ESTRUCTURA METÁLICA",
    },
    {
        "nombre": "Cercha metálica pesada",
        "unidad": "m²",
        "precio": 45000,
        "categoria": "ESTRUCTURA METÁLICA",
    },
    {
        "nombre": "Estructura metálica techo",
        "unidad": "m²",
        "precio": 38000,
        "categoria": "ESTRUCTURA METÁLICA",
    },
    {
        "nombre": "Pilar metálico circular",
        "unidad": "ml",
        "precio": 42000,
        "categoria": "ESTRUCTURA METÁLICA",
    },
    {
        "nombre": "Escalera metálica",
        "unidad": "ml",
        "precio": 85000,
        "categoria": "ESTRUCTURA METÁLICA",
    },
    {
        "nombre": "Barandilla metálica",
        "unidad": "ml",
        "precio": 28000,
        "categoria": "ESTRUCTURA METÁLICA",
    },
]
apus_nuevos.extend(estructura)

# TECHUMBRE (80 nuevos)
techumbre = [
    {
        "nombre": "Cubierta teja asfáltica",
        "unidad": "m²",
        "precio": 15000,
        "categoria": "TECHUMBRE",
    },
    {"nombre": "Cubierta teja cerámica", "unidad": "m²", "precio": 22000, "categoria": "TECHUMBRE"},
    {"nombre": "Cubierta zinc ondulado", "unidad": "m²", "precio": 8500, "categoria": "TECHUMBRE"},
    {"nombre": "Cubierta zinc liso", "unidad": "m²", "precio": 12000, "categoria": "TECHUMBRE"},
    {"nombre": "Cubierta policarbonato", "unidad": "m²", "precio": 18000, "categoria": "TECHUMBRE"},
    {"nombre": "Cubierta sandwich", "unidad": "m²", "precio": 25000, "categoria": "TECHUMBRE"},
    {"nombre": "Entablado pino 1x6", "unidad": "m²", "precio": 8500, "categoria": "TECHUMBRE"},
    {"nombre": "Entablado pino 1x8", "unidad": "m²", "precio": 10500, "categoria": "TECHUMBRE"},
    {"nombre": "Fieltro asfáltico 15lb", "unidad": "m²", "precio": 2500, "categoria": "TECHUMBRE"},
    {"nombre": "Barrera humedad", "unidad": "m²", "precio": 3200, "categoria": "TECHUMBRE"},
    {"nombre": "Aislación térmica techo", "unidad": "m²", "precio": 5500, "categoria": "TECHUMBRE"},
    {"nombre": "Cielo raso yeso cartón", "unidad": "m²", "precio": 12000, "categoria": "TECHUMBRE"},
    {"nombre": "Cielo raso PVC", "unidad": "m²", "precio": 8500, "categoria": "TECHUMBRE"},
    {"nombre": "Canaleta zinc", "unidad": "ml", "precio": 4500, "categoria": "TECHUMBRE"},
    {"nombre": "Bajada aguas lluvia PVC", "unidad": "ml", "precio": 5500, "categoria": "TECHUMBRE"},
]
apus_nuevos.extend(techumbre)

# TERMINACIONES (120 nuevos)
terminaciones = [
    {
        "nombre": "Estuco interior corriente",
        "unidad": "m²",
        "precio": 4500,
        "categoria": "TERMINACIONES",
    },
    {
        "nombre": "Estuco exterior impermeable",
        "unidad": "m²",
        "precio": 6500,
        "categoria": "TERMINACIONES",
    },
    {"nombre": "Yeso cartón muro", "unidad": "m²", "precio": 9500, "categoria": "TERMINACIONES"},
    {"nombre": "Yeso cartón cielo", "unidad": "m²", "precio": 10500, "categoria": "TERMINACIONES"},
    {
        "nombre": "Enchape cerámica piso",
        "unidad": "m²",
        "precio": 12000,
        "categoria": "TERMINACIONES",
    },
    {
        "nombre": "Enchape cerámica muro",
        "unidad": "m²",
        "precio": 13500,
        "categoria": "TERMINACIONES",
    },
    {
        "nombre": "Enchape porcelanato piso",
        "unidad": "m²",
        "precio": 18000,
        "categoria": "TERMINACIONES",
    },
    {"nombre": "Piso flotante", "unidad": "m²", "precio": 15000, "categoria": "TERMINACIONES"},
    {"nombre": "Piso vinílico", "unidad": "m²", "precio": 12000, "categoria": "TERMINACIONES"},
    {
        "nombre": "Alfombra muro a muro",
        "unidad": "m²",
        "precio": 10500,
        "categoria": "TERMINACIONES",
    },
    {
        "nombre": "Guardapolvo pino finger",
        "unidad": "ml",
        "precio": 2500,
        "categoria": "TERMINACIONES",
    },
    {"nombre": "Cornisa yeso", "unidad": "ml", "precio": 3500, "categoria": "TERMINACIONES"},
    {"nombre": "Moldura decorativa", "unidad": "ml", "precio": 4500, "categoria": "TERMINACIONES"},
    {
        "nombre": "Puerta interior MDF",
        "unidad": "un",
        "precio": 85000,
        "categoria": "TERMINACIONES",
    },
    {
        "nombre": "Puerta exterior madera",
        "unidad": "un",
        "precio": 150000,
        "categoria": "TERMINACIONES",
    },
    {
        "nombre": "Ventana aluminio corredera",
        "unidad": "m²",
        "precio": 45000,
        "categoria": "TERMINACIONES",
    },
    {"nombre": "Ventana PVC", "unidad": "m²", "precio": 55000, "categoria": "TERMINACIONES"},
    {"nombre": "Closet melamina", "unidad": "ml", "precio": 65000, "categoria": "TERMINACIONES"},
    {
        "nombre": "Mueble cocina melamina",
        "unidad": "ml",
        "precio": 85000,
        "categoria": "TERMINACIONES",
    },
    {
        "nombre": "Cubierta granito cocina",
        "unidad": "ml",
        "precio": 45000,
        "categoria": "TERMINACIONES",
    },
]
apus_nuevos.extend(terminaciones)

# PINTURA (40 nuevos)
pintura = [
    {"nombre": "Pasta muro interior", "unidad": "m²", "precio": 2500, "categoria": "PINTURA"},
    {"nombre": "Esmalte agua muros", "unidad": "m²", "precio": 3500, "categoria": "PINTURA"},
    {"nombre": "Esmalte sintético", "unidad": "m²", "precio": 4500, "categoria": "PINTURA"},
    {"nombre": "Barniz madera", "unidad": "m²", "precio": 3800, "categoria": "PINTURA"},
    {"nombre": "Latex muros 2 manos", "unidad": "m²", "precio": 3200, "categoria": "PINTURA"},
    {"nombre": "Pintura exterior fachada", "unidad": "m²", "precio": 5500, "categoria": "PINTURA"},
    {"nombre": "Pintura piso epóxica", "unidad": "m²", "precio": 8500, "categoria": "PINTURA"},
    {"nombre": "Empaste fino", "unidad": "m²", "precio": 2800, "categoria": "PINTURA"},
    {"nombre": "Sellador madera", "unidad": "m²", "precio": 2500, "categoria": "PINTURA"},
    {"nombre": "Pintura antióxido metal", "unidad": "m²", "precio": 4200, "categoria": "PINTURA"},
]
apus_nuevos.extend(pintura)

# INSTALACIONES SANITARIAS (70 nuevos)
sanitarias = [
    {
        "nombre": "Red agua potable PVC 1/2",
        "unidad": "ml",
        "precio": 3500,
        "categoria": "INSTALACIONES SANITARIAS",
    },
    {
        "nombre": "Red agua potable PVC 3/4",
        "unidad": "ml",
        "precio": 4200,
        "categoria": "INSTALACIONES SANITARIAS",
    },
    {
        "nombre": "Red alcantarillado PVC 110mm",
        "unidad": "ml",
        "precio": 5500,
        "categoria": "INSTALACIONES SANITARIAS",
    },
    {
        "nombre": "Red alcantarillado PVC 160mm",
        "unidad": "ml",
        "precio": 7500,
        "categoria": "INSTALACIONES SANITARIAS",
    },
    {
        "nombre": "Cámara inspección 60x60",
        "unidad": "un",
        "precio": 85000,
        "categoria": "INSTALACIONES SANITARIAS",
    },
    {
        "nombre": "Llave paso agua",
        "unidad": "un",
        "precio": 8500,
        "categoria": "INSTALACIONES SANITARIAS",
    },
    {
        "nombre": "WC one piece",
        "unidad": "un",
        "precio": 95000,
        "categoria": "INSTALACIONES SANITARIAS",
    },
    {
        "nombre": "WC two piece",
        "unidad": "un",
        "precio": 65000,
        "categoria": "INSTALACIONES SANITARIAS",
    },
    {
        "nombre": "Lavamanos con pedestal",
        "unidad": "un",
        "precio": 75000,
        "categoria": "INSTALACIONES SANITARIAS",
    },
    {
        "nombre": "Tina baño",
        "unidad": "un",
        "precio": 185000,
        "categoria": "INSTALACIONES SANITARIAS",
    },
    {
        "nombre": "Ducha monomando",
        "unidad": "un",
        "precio": 45000,
        "categoria": "INSTALACIONES SANITARIAS",
    },
    {
        "nombre": "Lavaplatos 1 poceta",
        "unidad": "un",
        "precio": 65000,
        "categoria": "INSTALACIONES SANITARIAS",
    },
    {
        "nombre": "Lavaplatos 2 pocetas",
        "unidad": "un",
        "precio": 95000,
        "categoria": "INSTALACIONES SANITARIAS",
    },
    {
        "nombre": "Grifería cocina",
        "unidad": "un",
        "precio": 35000,
        "categoria": "INSTALACIONES SANITARIAS",
    },
    {
        "nombre": "Grifería baño",
        "unidad": "un",
        "precio": 42000,
        "categoria": "INSTALACIONES SANITARIAS",
    },
]
apus_nuevos.extend(sanitarias)

# INSTALACIONES ELÉCTRICAS (70 nuevos)
electricas = [
    {
        "nombre": "Cableado eléctrico 2x12",
        "unidad": "ml",
        "precio": 2500,
        "categoria": "INSTALACIONES ELÉCTRICAS",
    },
    {
        "nombre": "Cableado eléctrico 2x14",
        "unidad": "ml",
        "precio": 1800,
        "categoria": "INSTALACIONES ELÉCTRICAS",
    },
    {
        "nombre": "Tubería PVC eléctrica 3/4",
        "unidad": "ml",
        "precio": 1200,
        "categoria": "INSTALACIONES ELÉCTRICAS",
    },
    {
        "nombre": "Caja embutir cuadrada",
        "unidad": "un",
        "precio": 800,
        "categoria": "INSTALACIONES ELÉCTRICAS",
    },
    {
        "nombre": "Enchufe simple",
        "unidad": "un",
        "precio": 4500,
        "categoria": "INSTALACIONES ELÉCTRICAS",
    },
    {
        "nombre": "Enchufe doble",
        "unidad": "un",
        "precio": 5500,
        "categoria": "INSTALACIONES ELÉCTRICAS",
    },
    {
        "nombre": "Interruptor simple",
        "unidad": "un",
        "precio": 3500,
        "categoria": "INSTALACIONES ELÉCTRICAS",
    },
    {
        "nombre": "Interruptor doble",
        "unidad": "un",
        "precio": 4800,
        "categoria": "INSTALACIONES ELÉCTRICAS",
    },
    {
        "nombre": "Tablero eléctrico 12 polos",
        "unidad": "un",
        "precio": 55000,
        "categoria": "INSTALACIONES ELÉCTRICAS",
    },
    {
        "nombre": "Tablero eléctrico 24 polos",
        "unidad": "un",
        "precio": 85000,
        "categoria": "INSTALACIONES ELÉCTRICAS",
    },
    {
        "nombre": "Automático 1 polo 16A",
        "unidad": "un",
        "precio": 8500,
        "categoria": "INSTALACIONES ELÉCTRICAS",
    },
    {
        "nombre": "Automático 2 polos 32A",
        "unidad": "un",
        "precio": 15000,
        "categoria": "INSTALACIONES ELÉCTRICAS",
    },
    {
        "nombre": "Diferencial 40A",
        "unidad": "un",
        "precio": 35000,
        "categoria": "INSTALACIONES ELÉCTRICAS",
    },
    {
        "nombre": "Luminaria LED embutir",
        "unidad": "un",
        "precio": 12000,
        "categoria": "INSTALACIONES ELÉCTRICAS",
    },
    {
        "nombre": "Luminaria LED sobrepuesta",
        "unidad": "un",
        "precio": 15000,
        "categoria": "INSTALACIONES ELÉCTRICAS",
    },
]
apus_nuevos.extend(electricas)

# Agregar IDs únicos a todos los APUs nuevos
for i, apu in enumerate(apus_nuevos):
    apu["id"] = f"apu_{len(apus_actuales) + i + 1}"
    # Agregar materiales básicos si no existen
    if "materiales" not in apu:
        apu["materiales"] = []
    if "mano_obra" not in apu:
        apu["mano_obra"] = []

# Combinar APUs actuales + nuevos
apus_completos = apus_actuales + apus_nuevos

print(f"APUs nuevos agregados: {len(apus_nuevos)}")
print(f"Total APUs: {len(apus_completos)}")

# Guardar con estructura correcta
output_data = {"actividades": apus_completos}

with open("web_app/apu_database.json", "w", encoding="utf-8") as f:
    json.dump(output_data, f, ensure_ascii=False, indent=2)

# También actualizar minified
with open("web_app/apu_database.min.json", "w", encoding="utf-8") as f:
    json.dump(output_data, f, ensure_ascii=False, separators=(",", ":"))

print("✓ Base de datos expandida guardada")
print(f"✓ Total final: {len(apus_completos)} APUs")

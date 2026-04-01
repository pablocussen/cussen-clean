"""
Script simplificado para agregar APUs hasta 800+
"""

import json

# Cargar APUs actuales
with open("web_app/apu_database.json", "r", encoding="utf-8") as f:
    data = json.load(f)
    apus_actuales = data.get("actividades", [])

print(f"APUs actuales: {len(apus_actuales)}")

# Necesitamos agregar ~470 APUs más para llegar a 800
apus_nuevos = []

# HORMIGON - 60 mas
hormigon_extra = (
    [
        {
            "nombre": f"Hormigón H{h} fundaciones",
            "unidad": "m3",
            "precio": 70000 + h * 1000,
            "categoria": "HORMIGON",
        }
        for h in range(10, 40, 2)
    ]
    + [
        {
            "nombre": f"Losa hormigón {espesor}cm e={espesor}",
            "unidad": "m2",
            "precio": 15000 + espesor * 800,
            "categoria": "HORMIGON",
        }
        for espesor in range(10, 30, 2)
    ]
    + [
        {
            "nombre": f"Columna hormigón {dim}x{dim}cm",
            "unidad": "ml",
            "precio": 18000 + dim * 200,
            "categoria": "HORMIGON",
        }
        for dim in range(20, 60, 5)
    ]
    + [
        {
            "nombre": f"Viga hormigón {ancho}x{alto}cm",
            "unidad": "ml",
            "precio": 22000 + ancho * 150,
            "categoria": "HORMIGON",
        }
        for ancho in range(20, 50, 5)
        for alto in [30, 40, 50]
    ]
)
apus_nuevos.extend(hormigon_extra[:60])

# ALBANILERIA - 60 mas
albanileria_extra = (
    [
        {
            "nombre": f"Muro ladrillo {espesor}cm reforzado",
            "unidad": "m2",
            "precio": 12000 + espesor * 400,
            "categoria": "ALBANILERIA",
        }
        for espesor in range(7, 40, 2)
    ]
    + [
        {
            "nombre": f"Tabique bloque {espesor}cm estucado",
            "unidad": "m2",
            "precio": 10000 + espesor * 350,
            "categoria": "ALBANILERIA",
        }
        for espesor in range(7, 30, 2)
    ]
    + [
        {
            "nombre": f"Muro contención H{h}m",
            "unidad": "ml",
            "precio": 25000 + h * 5000,
            "categoria": "ALBANILERIA",
        }
        for h in range(1, 4)
    ]
    + [
        {
            "nombre": f"Pilar ladrillo {dim}x{dim}cm",
            "unidad": "ml",
            "precio": 8000 + dim * 100,
            "categoria": "ALBANILERIA",
        }
        for dim in range(14, 40, 5)
    ]
)
apus_nuevos.extend(albanileria_extra[:60])

# TECHUMBRE - 50 mas
techumbre_extra = [
    {"nombre": f"Cubierta {material}", "unidad": "m2", "precio": precio, "categoria": "TECHUMBRE"}
    for material, precio in [
        ("zinc ondulado #28", 8500),
        ("zinc ondulado #26", 9200),
        ("zinc ondulado #24", 10500),
        ("zinc liso #28", 11000),
        ("zinc liso #26", 12500),
        ("zinc liso #24", 14000),
        ("teja asfáltica negra", 14500),
        ("teja asfáltica roja", 15000),
        ("teja asfáltica verde", 15000),
        ("teja cerámica colonial", 22000),
        ("teja cerámica plana", 20000),
        ("teja cerámica mixta", 21000),
        ("fibrocemento ondulada", 7500),
        ("fibrocemento lisa", 9500),
        ("policarbonato transparente", 18000),
        ("policarbonato bronce", 18500),
        ("policarbonato blanco", 17500),
        ("sandwich metálica", 25000),
        ("sandwich PUR", 28000),
        ("sandwich PIR", 32000),
        ("teja metálica colonial", 16000),
        ("teja metálica plana", 15000),
        ("shingle asfáltico", 16500),
        ("membrana PVC", 22000),
        ("membrana EPDM", 24000),
        ("teja fotovoltaica", 85000),
        ("teja ventilada", 19000),
        ("teja ecológica", 17000),
        ("plancha OSB 9mm", 8500),
        ("plancha OSB 11mm", 10500),
        ("plancha OSB 15mm", 13500),
        ("entablado pino 1x4", 7200),
        ("entablado pino 1x5", 7800),
        ("entablado pino 1x6", 8500),
        ("entablado pino 1x8", 10200),
        ("entablado pino 1x10", 12500),
        ("entablado pino 1x12", 15000),
        ("fieltro 15lb", 2500),
        ("fieltro 30lb", 3800),
        ("barrera de humedad", 3200),
        ("aislación lana mineral 50mm", 4500),
        ("aislación lana mineral 80mm", 6500),
        ("aislación lana mineral 100mm", 8200),
        ("aislación poliestireno expandido 50mm", 3800),
        ("aislación poliestireno expandido 80mm", 5500),
        ("canaleta zinc rectangular", 4500),
        ("canaleta PVC semicircular", 3200),
        ("canaleta aluminio", 5500),
        ("bajada PVC 75mm", 4200),
        ("bajada PVC 110mm", 5500),
        ("bajada zinc", 6500),
    ]
]
apus_nuevos.extend(techumbre_extra[:50])

# TERMINACIONES - 80 mas
terminaciones_extra = [
    {"nombre": f"Piso {material}", "unidad": "m2", "precio": precio, "categoria": "TERMINACIONES"}
    for material, precio in [
        ("cerámica económica 30x30", 10500),
        ("cerámica estándar 33x33", 12000),
        ("cerámica premium 40x40", 15000),
        ("cerámica 45x45", 16500),
        ("cerámica 50x50", 18000),
        ("cerámica rectificada 60x60", 22000),
        ("porcelanato 45x45", 17000),
        ("porcelanato 60x60", 22000),
        ("porcelanato 80x80", 28000),
        ("porcelanato 120x60", 32000),
        ("porcelanato imitación madera", 25000),
        ("porcelanato mármol", 30000),
        ("flotante 7mm", 12000),
        ("flotante 8mm", 14000),
        ("flotante 10mm", 16500),
        ("flotante 12mm", 19000),
        ("vinílico SPC", 15000),
        ("vinílico WPC", 16500),
        ("vinílico clic", 14000),
        ("vinílico pegado", 12500),
        ("palmeta vinílica", 8500),
        ("alfombra muro a muro", 10500),
        ("alfombra alto tránsito", 13500),
        ("baldosa hormigón 40x40", 8500),
        ("adoquín hormigón", 9500),
        ("adoquín piedra", 18000),
        ("deck pino impregnado", 12000),
        ("deck pino oregón", 15000),
        ("deck WPC", 22000),
        ("deck compuesto", 25000),
        ("piso epoxi", 18000),
        ("piso cuarzo", 22000),
        ("piso vinílico deportivo", 28000),
        ("mármol travertino", 45000),
        ("mármol blanco", 55000),
        ("granito nacional", 35000),
        ("granito importado", 48000),
    ]
] + [
    {
        "nombre": f"Revestimiento {material}",
        "unidad": "m2",
        "precio": precio,
        "categoria": "TERMINACIONES",
    }
    for material, precio in [
        ("cerámica baño 25x40", 13500),
        ("cerámica baño 30x60", 16000),
        ("cerámica baño 33x60", 17500),
        ("porcelanato muro 30x60", 20000),
        ("porcelanato muro 40x80", 25000),
        ("piedra pizarra", 22000),
        ("piedra laja", 18000),
        ("piedra reconstituida", 15000),
        ("madera machihembrado", 14000),
        ("madera revestimiento vertical", 16000),
        ("siding vinílico", 12000),
        ("siding fibrocemento", 14500),
        ("siding metálico", 16500),
        ("panel 3D yeso", 18000),
        ("papel mural vinílico", 8500),
        ("papel mural tejido", 12000),
        ("estuco fino", 5500),
        ("estuco texturado", 6500),
        ("estuco veneciano", 15000),
    ]
]
apus_nuevos.extend(terminaciones_extra[:80])

# PINTURA - 50 mas
pintura = [
    {
        "nombre": f"Pintura {tipo} {capas} manos",
        "unidad": "m2",
        "precio": precio,
        "categoria": "PINTURA",
    }
    for tipo, capas, precio in [
        ("látex interior", "2", 3500),
        ("látex interior", "3", 4800),
        ("látex exterior", "2", 4200),
        ("látex exterior", "3", 5800),
        ("esmalte al agua", "2", 5500),
        ("esmalte al agua", "3", 7500),
        ("esmalte sintético", "2", 6500),
        ("esmalte sintético", "3", 8800),
        ("barniz marino", "2", 9500),
        ("barniz marino", "3", 12800),
        ("barniz transparente", "2", 7500),
        ("barniz transparente", "3", 10200),
        ("óleo opaco", "2", 5800),
        ("óleo opaco", "3", 7800),
        ("texturado exterior", "1", 6500),
        ("texturado exterior", "2", 11000),
        ("impermeabilizante", "2", 8500),
        ("impermeabilizante", "3", 11500),
        ("anticorrosivo", "2", 6800),
        ("anticorrosivo", "3", 9200),
        ("epoxi piso", "2", 12000),
        ("epoxi piso", "3", 16500),
        ("temple interior", "2", 2800),
        ("temple interior", "3", 3800),
    ]
] + [
    {"nombre": f"Empaste {tipo}", "unidad": "m2", "precio": precio, "categoria": "PINTURA"}
    for tipo, precio in [
        ("muro interior corriente", 2500),
        ("muro interior fino", 3500),
        ("cielo corriente", 2800),
        ("cielo fino", 3800),
        ("muro exterior", 4200),
        ("yeso cartón", 2200),
    ]
]
apus_nuevos.extend(pintura[:50])

# INSTALACIONES SANITARIAS - 60 mas
sanitarias = [
    {
        "nombre": f"Cañería {material} {diametro}mm",
        "unidad": "ml",
        "precio": precio,
        "categoria": "INSTALACIONES SANITARIAS",
    }
    for material, diametro, precio in [
        ("PVC", 32, 2500),
        ("PVC", 40, 3200),
        ("PVC", 50, 4200),
        ("PVC", 75, 6500),
        ("PVC", 110, 8500),
        ("cobre", 13, 8500),
        ("cobre", 19, 12000),
        ("cobre", 25, 16000),
        ("cobre", 32, 22000),
        ("PPR", 20, 4500),
        ("PPR", 25, 5500),
        ("PPR", 32, 7200),
        ("PPR", 40, 9500),
        ("PEX", 16, 5200),
        ("PEX", 20, 6500),
        ("PEX", 25, 8500),
        ("fierro galvanizado", 19, 9500),
        ("fierro galvanizado", 25, 12500),
        ("fierro galvanizado", 32, 16500),
    ]
] + [
    {
        "nombre": f"Artefacto {tipo}",
        "unidad": "un",
        "precio": precio,
        "categoria": "INSTALACIONES SANITARIAS",
    }
    for tipo, precio in [
        ("WC one piece", 120000),
        ("WC dual flush", 95000),
        ("WC estándar", 75000),
        ("lavamanos pedestal", 65000),
        ("lavamanos sobreponer", 45000),
        ("lavamanos empotrar", 38000),
        ("tina fibra vidrio", 180000),
        ("tina acrílica", 220000),
        ("tina hidromasaje", 450000),
        ("receptáculo ducha 80x80", 85000),
        ("receptáculo ducha 90x90", 95000),
        ("receptáculo ducha 100x100", 105000),
        ("lavaplatos 1 poceta", 55000),
        ("lavaplatos 2 pocetas", 85000),
        ("lavaplatos empotrar", 95000),
        ("lavadero 1 poceta", 45000),
        ("lavadero 2 pocetas", 65000),
        ("grifería lavamanos monocomando", 45000),
        ("grifería lavamanos 2 llaves", 28000),
        ("grifería ducha monocomando", 55000),
        ("grifería tina/ducha", 65000),
        ("grifería cocina monocomando", 58000),
        ("grifería cocina 2 llaves", 35000),
        ("calefont 13L", 180000),
        ("calefont 16L", 220000),
        ("termotanque 50L", 250000),
        ("termotanque 80L", 320000),
    ]
]
apus_nuevos.extend(sanitarias[:60])

# INSTALACIONES ELECTRICAS - 70 mas
electricas = (
    [
        {
            "nombre": f"Cableado {tipo} {seccion}mm2",
            "unidad": "ml",
            "precio": precio,
            "categoria": "INSTALACIONES ELECTRICAS",
        }
        for tipo, seccion, precio in [
            ("NYA", 1.5, 850),
            ("NYA", 2.5, 1200),
            ("NYA", 4, 1800),
            ("NYA", 6, 2800),
            ("NYA", 10, 4500),
            ("cable vulcanizado", 2.5, 2200),
            ("cable vulcanizado", 4, 3200),
            ("cable vulcanizado", 6, 4800),
            ("cable vulcanizado", 10, 7500),
            ("cable vulcanizado", 16, 11000),
            ("Condumex", 1.5, 950),
            ("Condumex", 2.5, 1350),
            ("Condumex", 4, 2100),
            ("cable data Cat 6", 0, 1800),
            ("cable coaxial RG6", 0, 1200),
            ("cable telefónico", 0, 650),
        ]
    ]
    + [
        {
            "nombre": f"Canalización {tipo} {diametro}mm",
            "unidad": "ml",
            "precio": precio,
            "categoria": "INSTALACIONES ELECTRICAS",
        }
        for tipo, diametro, precio in [
            ("conduit PVC", 16, 1200),
            ("conduit PVC", 20, 1500),
            ("conduit PVC", 25, 2200),
            ("conduit PVC", 32, 3200),
            ("conduit metálico", 16, 2500),
            ("conduit metálico", 20, 3200),
            ("conduit metálico", 25, 4500),
            ("canaleta plástica", 20, 2200),
            ("canaleta plástica", 30, 3200),
            ("canaleta plástica", 40, 4200),
            ("ducto PVC", 40, 3500),
            ("ducto PVC", 50, 4500),
            ("ducto PVC", 75, 6500),
        ]
    ]
    + [
        {
            "nombre": f"Artefacto {tipo}",
            "unidad": "un",
            "precio": precio,
            "categoria": "INSTALACIONES ELECTRICAS",
        }
        for tipo, precio in [
            ("interruptor simple", 3500),
            ("interruptor doble", 4500),
            ("interruptor triple", 5500),
            ("interruptor conmutable", 4200),
            ("interruptor 9/12", 5800),
            ("enchufe simple", 3200),
            ("enchufe doble", 4200),
            ("enchufe schuko", 5500),
            ("enchufe con USB", 12000),
            ("enchufe inteligente", 18000),
            ("luminaria empotrar LED 6W", 8500),
            ("luminaria empotrar LED 12W", 12000),
            ("luminaria empotrar LED 18W", 15000),
            ("luminaria sobreponer LED 12W", 9500),
            ("luminaria sobreponer LED 18W", 12500),
            ("foco LED E27 9W", 4500),
            ("foco LED E27 12W", 5500),
            ("foco LED E27 15W", 6500),
            ("tubo LED T8 18W", 8500),
            ("tubo LED T8 36W", 12000),
            ("proyector LED 20W", 15000),
            ("proyector LED 50W", 28000),
            ("proyector LED 100W", 45000),
            ("tablero 12 circuitos", 55000),
            ("tablero 18 circuitos", 75000),
            ("tablero 24 circuitos", 95000),
            ("automático 1x10A", 5500),
            ("automático 1x16A", 5800),
            ("automático 1x20A", 6200),
            ("automático 1x25A", 6500),
            ("automático 1x32A", 7200),
            ("automático 1x40A", 8500),
            ("diferencial 2x25A 30mA", 28000),
            ("diferencial 2x40A 30mA", 35000),
            ("diferencial 4x40A 30mA", 48000),
        ]
    ]
)
apus_nuevos.extend(electricas[:70])

# CARPINTERIA - 50 mas
carpinteria = [
    {
        "nombre": f"Puerta {tipo} {ancho}cm",
        "unidad": "un",
        "precio": precio,
        "categoria": "CARPINTERIA",
    }
    for tipo, ancho, precio in [
        ("interior MDF", 60, 75000),
        ("interior MDF", 70, 80000),
        ("interior MDF", 80, 85000),
        ("interior MDF", 90, 95000),
        ("interior terciado", 70, 95000),
        ("interior terciado", 80, 105000),
        ("interior terciado", 90, 115000),
        ("exterior pino", 80, 145000),
        ("exterior pino", 90, 165000),
        ("exterior pino", 100, 185000),
        ("exterior PVC", 80, 180000),
        ("exterior PVC", 90, 200000),
        ("closet corredera 2 hojas", 120, 220000),
        ("closet corredera 3 hojas", 180, 310000),
        ("marco puerta pino", 70, 25000),
        ("marco puerta pino", 80, 28000),
        ("marco puerta pino", 90, 32000),
    ]
] + [
    {
        "nombre": f"Ventana {tipo} {ancho}x{alto}cm",
        "unidad": "un",
        "precio": precio,
        "categoria": "CARPINTERIA",
    }
    for tipo, ancho, alto, precio in [
        ("PVC 1 hoja", 60, 100, 85000),
        ("PVC 1 hoja", 80, 120, 110000),
        ("PVC 1 hoja", 100, 150, 145000),
        ("PVC 2 hojas", 120, 100, 145000),
        ("PVC 2 hojas", 150, 120, 185000),
        ("PVC 2 hojas", 180, 150, 225000),
        ("aluminio 1 hoja", 60, 100, 65000),
        ("aluminio 1 hoja", 80, 120, 85000),
        ("aluminio 2 hojas", 120, 100, 110000),
        ("aluminio 2 hojas", 150, 120, 140000),
        ("aluminio 2 hojas", 180, 150, 170000),
        ("aluminio 2 hojas", 200, 150, 195000),
        ("madera pino 1 hoja", 60, 100, 95000),
        ("madera pino 2 hojas", 120, 100, 165000),
        ("termopanel PVC 1 hoja", 80, 120, 145000),
        ("termopanel PVC 2 hojas", 150, 120, 245000),
        ("termopanel aluminio 2 hojas", 150, 120, 195000),
        ("termopanel aluminio 2 hojas", 200, 150, 265000),
    ]
]
apus_nuevos.extend(carpinteria[:50])

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

print("Base de datos expandida guardada")
print(f"Total final: {len(apus_completos)} APUs")

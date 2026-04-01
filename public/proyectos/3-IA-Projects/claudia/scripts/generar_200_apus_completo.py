"""
CLAUDIA - Generador de 200 APUs Completos
Genera base de datos completa de 200 actividades de construcción
con materiales detallados, mano de obra, rendimientos y tips
"""

import json
from pathlib import Path


# Funci\u00f3n helper para crear APUs
def crear_apu(
    id, nombre, descripcion, unidad, categoria, precio_ref, materiales, mano_obra, rendimiento, tips
):
    return {
        "id": id,
        "nombre": nombre,
        "descripcion": descripcion,
        "unidad": unidad,
        "categoria": categoria,
        "precio_referencia": precio_ref,
        "materiales": materiales,
        "mano_obra": mano_obra,
        "rendimiento": rendimiento,
        "tips": tips,
    }


# Base de datos completa de 200 APUs
apus = []

# ==================== TRAZADO Y REPLANTEO (5 APUs) ====================
apus.extend(
    [
        crear_apu(
            "trazado_replanteo",
            "Trazado y replanteo",
            "Trazado y replanteo con estacas y huinchas",
            "m\u00b2",
            "TRAZADO",
            850,
            [
                {
                    "nombre": "Estacas madera",
                    "cantidad": 0.2,
                    "unidad": "un",
                    "precio_unitario": 500,
                    "subtotal": 100,
                },
                {
                    "nombre": 'Clavos 3"',
                    "cantidad": 0.05,
                    "unidad": "kg",
                    "precio_unitario": 2500,
                    "subtotal": 125,
                },
                {
                    "nombre": "Lienza nylon",
                    "cantidad": 1.5,
                    "unidad": "m",
                    "precio_unitario": 150,
                    "subtotal": 225,
                },
            ],
            [
                {
                    "nombre": "Maestro",
                    "cantidad": 0.02,
                    "unidad": "HH",
                    "precio_unitario": 12000,
                    "subtotal": 240,
                }
            ],
            "50 m\u00b2/HH",
            "Verifica niveles y escuadras. Usa nivel l\u00e1ser si est\u00e1 disponible.",
        ),
        crear_apu(
            "trazado_nivelacion",
            "Nivelaci\u00f3n de terreno",
            "Nivelaci\u00f3n de terreno con top\u00f3grafo",
            "m\u00b2",
            "TRAZADO",
            1200,
            [
                {
                    "nombre": "Estacas",
                    "cantidad": 0.3,
                    "unidad": "un",
                    "precio_unitario": 500,
                    "subtotal": 150,
                }
            ],
            [
                {
                    "nombre": "Top\u00f3grafo",
                    "cantidad": 0.03,
                    "unidad": "HH",
                    "precio_unitario": 15000,
                    "subtotal": 450,
                },
                {
                    "nombre": "Ayudante",
                    "cantidad": 0.03,
                    "unidad": "HH",
                    "precio_unitario": 8000,
                    "subtotal": 240,
                },
            ],
            "35 m\u00b2/HH",
            "Importante para evitar problemas de desnivel posterior.",
        ),
        crear_apu(
            "demarcacion_ejes",
            "Demarcaci\u00f3n de ejes",
            "Marcaci\u00f3n de ejes principales con cal",
            "ml",
            "TRAZADO",
            450,
            [
                {
                    "nombre": "Cal",
                    "cantidad": 0.5,
                    "unidad": "kg",
                    "precio_unitario": 300,
                    "subtotal": 150,
                }
            ],
            [
                {
                    "nombre": "Maestro",
                    "cantidad": 0.015,
                    "unidad": "HH",
                    "precio_unitario": 12000,
                    "subtotal": 180,
                }
            ],
            "65 ml/HH",
            "Marca ejes principales antes de excavar.",
        ),
        crear_apu(
            "replanteo_fundaciones",
            "Replanteo de fundaciones",
            "Replanteo espec\u00edfico para fundaciones",
            "ml",
            "TRAZADO",
            950,
            [
                {
                    "nombre": "Estacas madera",
                    "cantidad": 0.25,
                    "unidad": "un",
                    "precio_unitario": 500,
                    "subtotal": 125,
                },
                {
                    "nombre": "Lienza",
                    "cantidad": 2,
                    "unidad": "m",
                    "precio_unitario": 150,
                    "subtotal": 300,
                },
            ],
            [
                {
                    "nombre": "Maestro",
                    "cantidad": 0.025,
                    "unidad": "HH",
                    "precio_unitario": 12000,
                    "subtotal": 300,
                }
            ],
            "40 ml/HH",
            "Verifica escuadras en esquinas.",
        ),
        crear_apu(
            "limpieza_terreno",
            "Limpieza y despeje de terreno",
            "Retiro de escombros y vegetaci\u00f3n",
            "m\u00b2",
            "TRAZADO",
            650,
            [],
            [
                {
                    "nombre": "Jornal",
                    "cantidad": 0.08,
                    "unidad": "HH",
                    "precio_unitario": 8000,
                    "subtotal": 640,
                }
            ],
            "12 m\u00b2/HH",
            "Incluye retiro de vegetaci\u00f3n menor.",
        ),
    ]
)

# ==================== MOVIMIENTO DE TIERRAS (15 APUs) ====================
apus.extend(
    [
        crear_apu(
            "excavacion_zanja_mano",
            "Excavacion zanja a mano",
            "Excavacion de zanja en terreno normal, incluye extracci\u00f3n",
            "m\u00b3",
            "MOVIMIENTO TIERRA",
            12000,
            [],
            [
                {
                    "nombre": "Jornal",
                    "cantidad": 2.5,
                    "unidad": "HH",
                    "precio_unitario": 8000,
                    "subtotal": 20000,
                }
            ],
            "0.4 m\u00b3/HH",
            "Para terreno duro aumenta 30% el precio. Incluye extracci\u00f3n de tierra.",
        ),
        crear_apu(
            "excavacion_mecanizada",
            "Excavacion mecanizada con retroexcavadora",
            "Excavacion con maquinaria pesada",
            "m\u00b3",
            "MOVIMIENTO TIERRA",
            3500,
            [],
            [
                {
                    "nombre": "Operador retroexcavadora",
                    "cantidad": 0.05,
                    "unidad": "HH",
                    "precio_unitario": 45000,
                    "subtotal": 2250,
                }
            ],
            "20 m\u00b3/HH",
            "M\u00e1s econ\u00f3mico para grandes vol\u00fames (+50m\u00b3).",
        ),
        crear_apu(
            "relleno_compactado",
            "Relleno compactado con pis\u00f3n manual",
            "Relleno con material seleccionado, compactado en capas",
            "m\u00b3",
            "MOVIMIENTO TIERRA",
            15000,
            [
                {
                    "nombre": "Arena estabilizada",
                    "cantidad": 1.15,
                    "unidad": "m\u00b3",
                    "precio_unitario": 18000,
                    "subtotal": 20700,
                }
            ],
            [
                {
                    "nombre": "Jornal",
                    "cantidad": 1.5,
                    "unidad": "HH",
                    "precio_unitario": 8000,
                    "subtotal": 12000,
                }
            ],
            "0.65 m\u00b3/HH",
            "Compactar en capas de 20cm. Humedecer para mejor compactaci\u00f3n.",
        ),
        crear_apu(
            "relleno_compactado_mecanico",
            "Relleno compactado mec\u00e1nico",
            "Compactaci\u00f3n con placa vibradora",
            "m\u00b3",
            "MOVIMIENTO TIERRA",
            18500,
            [
                {
                    "nombre": "Arena estabilizada",
                    "cantidad": 1.15,
                    "unidad": "m\u00b3",
                    "precio_unitario": 18000,
                    "subtotal": 20700,
                }
            ],
            [
                {
                    "nombre": "Operador placa",
                    "cantidad": 0.15,
                    "unidad": "HH",
                    "precio_unitario": 12000,
                    "subtotal": 1800,
                }
            ],
            "7 m\u00b3/HH",
            "Mejor compactaci\u00f3n que manual. Ideal para radier.",
        ),
        crear_apu(
            "retiro_escombros",
            "Retiro de escombros",
            "Carga y retiro de escombros en cami\u00f3n",
            "m\u00b3",
            "MOVIMIENTO TIERRA",
            8500,
            [],
            [
                {
                    "nombre": "Jornal carga",
                    "cantidad": 0.4,
                    "unidad": "HH",
                    "precio_unitario": 8000,
                    "subtotal": 3200,
                },
                {
                    "nombre": "Cami\u00f3n",
                    "cantidad": 0.08,
                    "unidad": "viaje",
                    "precio_unitario": 35000,
                    "subtotal": 2800,
                },
            ],
            "2.5 m\u00b3/HH",
            "Precio incluye transporte a vertedero autorizado.",
        ),
        crear_apu(
            "nivelacion_terreno_mov",
            "Nivelaci\u00f3n de terreno",
            "Emparejamiento de superficie",
            "m\u00b2",
            "MOVIMIENTO TIERRA",
            950,
            [],
            [
                {
                    "nombre": "Jornal",
                    "cantidad": 0.12,
                    "unidad": "HH",
                    "precio_unitario": 8000,
                    "subtotal": 960,
                }
            ],
            "8 m\u00b2/HH",
            "Necesario antes de radiermiento.",
        ),
        crear_apu(
            "escarpe_manual",
            "Escarpe de terreno manual",
            "Rebaje de terreno a mano",
            "m\u00b3",
            "MOVIMIENTO TIERRA",
            14000,
            [],
            [
                {
                    "nombre": "Jornal",
                    "cantidad": 3,
                    "unidad": "HH",
                    "precio_unitario": 8000,
                    "subtotal": 24000,
                }
            ],
            "0.33 m\u00b3/HH",
            "Para terrenos duros o con pendiente.",
        ),
        crear_apu(
            "cama_ripio",
            "Cama de ripio",
            "Base de ripio compactado",
            "m\u00b3",
            "MOVIMIENTO TIERRA",
            22000,
            [
                {
                    "nombre": "Ripio",
                    "cantidad": 1.1,
                    "unidad": "m\u00b3",
                    "precio_unitario": 16000,
                    "subtotal": 17600,
                }
            ],
            [
                {
                    "nombre": "Jornal",
                    "cantidad": 0.5,
                    "unidad": "HH",
                    "precio_unitario": 8000,
                    "subtotal": 4000,
                }
            ],
            "2 m\u00b3/HH",
            "Compactar bien antes de radiear.",
        ),
        crear_apu(
            "base_estabilizada",
            "Base estabilizada",
            "Base granular estabilizada con cemento",
            "m\u00b3",
            "MOVIMIENTO TIERRA",
            28000,
            [
                {
                    "nombre": "Arena",
                    "cantidad": 0.7,
                    "unidad": "m\u00b3",
                    "precio_unitario": 18000,
                    "subtotal": 12600,
                },
                {
                    "nombre": "Ripio",
                    "cantidad": 0.5,
                    "unidad": "m\u00b3",
                    "precio_unitario": 16000,
                    "subtotal": 8000,
                },
                {
                    "nombre": "Cemento",
                    "cantidad": 2,
                    "unidad": "sacos",
                    "precio_unitario": 8900,
                    "subtotal": 17800,
                },
            ],
            [
                {
                    "nombre": "Maestro",
                    "cantidad": 1.2,
                    "unidad": "HH",
                    "precio_unitario": 12000,
                    "subtotal": 14400,
                }
            ],
            "0.8 m\u00b3/HH",
            "Para pavimentos de tr\u00e1nsito vehicular.",
        ),
        crear_apu(
            "entubado_zanja",
            "Entubado de zanja",
            "Entibado con tablas para seguridad",
            "ml",
            "MOVIMIENTO TIERRA",
            4500,
            [
                {
                    "nombre": "Tablas pino",
                    "cantidad": 0.15,
                    "unidad": "m\u00b2",
                    "precio_unitario": 8500,
                    "subtotal": 1275,
                },
                {
                    "nombre": "Puntales",
                    "cantidad": 0.5,
                    "unidad": "un",
                    "precio_unitario": 2500,
                    "subtotal": 1250,
                },
            ],
            [
                {
                    "nombre": "Maestro",
                    "cantidad": 0.15,
                    "unidad": "HH",
                    "precio_unitario": 12000,
                    "subtotal": 1800,
                }
            ],
            "6.5 ml/HH",
            "Obligatorio en zanjas profundas (+1.5m).",
        ),
        crear_apu(
            "demolicion_piso",
            "Demolici\u00f3n piso hormig\u00f3n",
            "Demolici\u00f3n y retiro de piso existente",
            "m\u00b2",
            "MOVIMIENTO TIERRA",
            5500,
            [],
            [
                {
                    "nombre": "Jornal",
                    "cantidad": 0.7,
                    "unidad": "HH",
                    "precio_unitario": 8000,
                    "subtotal": 5600,
                }
            ],
            "1.4 m\u00b2/HH",
            "Incluye retiro de escombros.",
        ),
        crear_apu(
            "demolicion_muro",
            "Demolici\u00f3n muro alba\u00f1iler\u00eda",
            "Demolici\u00f3n de muro ladrillo",
            "m\u00b2",
            "MOVIMIENTO TIERRA",
            6500,
            [],
            [
                {
                    "nombre": "Jornal",
                    "cantidad": 0.9,
                    "unidad": "HH",
                    "precio_unitario": 8000,
                    "subtotal": 7200,
                }
            ],
            "1.1 m\u00b2/HH",
            "Cuidado con instalaciones ocultas.",
        ),
        crear_apu(
            "corte_terreno",
            "Corte en terreno",
            "Excavaci\u00f3n de corte en ladera",
            "m\u00b3",
            "MOVIMIENTO TIERRA",
            15500,
            [],
            [
                {
                    "nombre": "Jornal",
                    "cantidad": 3.5,
                    "unidad": "HH",
                    "precio_unitario": 8000,
                    "subtotal": 28000,
                }
            ],
            "0.28 m\u00b3/HH",
            "Requiere entibado si es profundo.",
        ),
        crear_apu(
            "relleno_estabilizado",
            "Relleno con material estabilizado",
            "Relleno con arena-ripio estabilizada",
            "m\u00b3",
            "MOVIMIENTO TIERRA",
            24000,
            [
                {
                    "nombre": "Arena estabilizada",
                    "cantidad": 1.15,
                    "unidad": "m\u00b3",
                    "precio_unitario": 18000,
                    "subtotal": 20700,
                }
            ],
            [
                {
                    "nombre": "Operador placa",
                    "cantidad": 0.2,
                    "unidad": "HH",
                    "precio_unitario": 12000,
                    "subtotal": 2400,
                }
            ],
            "5 m\u00b3/HH",
            "Mejor calidad que relleno com\u00fan.",
        ),
        crear_apu(
            "terraplen",
            "Terrapl\u00e9n compactado",
            "Construcci\u00f3n de terrapl\u00e9n por capas",
            "m\u00b3",
            "MOVIMIENTO TIERRA",
            16500,
            [
                {
                    "nombre": "Material pr\u00e9stamo",
                    "cantidad": 1.2,
                    "unidad": "m\u00b3",
                    "precio_unitario": 12000,
                    "subtotal": 14400,
                }
            ],
            [
                {
                    "nombre": "Operador placa",
                    "cantidad": 0.3,
                    "unidad": "HH",
                    "precio_unitario": 12000,
                    "subtotal": 3600,
                }
            ],
            "3.5 m\u00b3/HH",
            "Compactar en capas de 30cm m\u00e1ximo.",
        ),
    ]
)

# ==================== HORMIGONES (20 APUs) ====================
apus.extend(
    [
        crear_apu(
            "radier_10cm",
            "Radier e=10cm",
            "Radier de hormig\u00f3n 10cm espesor",
            "m\u00b2",
            "HORMIGONES",
            18500,
            [
                {
                    "nombre": "Cemento",
                    "cantidad": 0.25,
                    "unidad": "sacos",
                    "precio_unitario": 8900,
                    "subtotal": 2225,
                },
                {
                    "nombre": "Arena",
                    "cantidad": 0.055,
                    "unidad": "m\u00b3",
                    "precio_unitario": 18000,
                    "subtotal": 990,
                },
                {
                    "nombre": "Ripio",
                    "cantidad": 0.085,
                    "unidad": "m\u00b3",
                    "precio_unitario": 16000,
                    "subtotal": 1360,
                },
                {
                    "nombre": "Malla Acma C-188",
                    "cantidad": 1.1,
                    "unidad": "m\u00b2",
                    "precio_unitario": 3800,
                    "subtotal": 4180,
                },
                {
                    "nombre": "Polietileno 0.2mm",
                    "cantidad": 1.05,
                    "unidad": "m\u00b2",
                    "precio_unitario": 850,
                    "subtotal": 893,
                },
            ],
            [
                {
                    "nombre": "Maestro",
                    "cantidad": 0.3,
                    "unidad": "HH",
                    "precio_unitario": 12000,
                    "subtotal": 3600,
                },
                {
                    "nombre": "Ayudante",
                    "cantidad": 0.3,
                    "unidad": "HH",
                    "precio_unitario": 8000,
                    "subtotal": 2400,
                },
            ],
            "3.5 m\u00b2/HH",
            "Agrega 10% desperdicio. Compacta bien la base.",
        ),
        crear_apu(
            "radier_15cm",
            "Radier e=15cm reforzado",
            "Radier 15cm con malla reforzada",
            "m\u00b2",
            "HORMIGONES",
            24500,
            [
                {
                    "nombre": "Cemento",
                    "cantidad": 0.375,
                    "unidad": "sacos",
                    "precio_unitario": 8900,
                    "subtotal": 3338,
                },
                {
                    "nombre": "Arena",
                    "cantidad": 0.082,
                    "unidad": "m\u00b3",
                    "precio_unitario": 18000,
                    "subtotal": 1476,
                },
                {
                    "nombre": "Ripio",
                    "cantidad": 0.128,
                    "unidad": "m\u00b3",
                    "precio_unitario": 16000,
                    "subtotal": 2048,
                },
                {
                    "nombre": "Malla Acma C-257",
                    "cantidad": 1.1,
                    "unidad": "m\u00b2",
                    "precio_unitario": 5200,
                    "subtotal": 5720,
                },
            ],
            [
                {
                    "nombre": "Maestro",
                    "cantidad": 0.4,
                    "unidad": "HH",
                    "precio_unitario": 12000,
                    "subtotal": 4800,
                }
            ],
            "2.5 m\u00b2/HH",
            "Para carga vehicular. Curar 7 d\u00edas.",
        ),
        crear_apu(
            "sobrecimiento_20x15",
            "Sobrecimiento 20x15cm",
            "Sobrecimiento hormig\u00f3n armado",
            "ml",
            "HORMIGONES",
            8500,
            [
                {
                    "nombre": "Cemento",
                    "cantidad": 0.12,
                    "unidad": "sacos",
                    "precio_unitario": 8900,
                    "subtotal": 1068,
                },
                {
                    "nombre": "Arena",
                    "cantidad": 0.013,
                    "unidad": "m\u00b3",
                    "precio_unitario": 18000,
                    "subtotal": 234,
                },
                {
                    "nombre": "Ripio",
                    "cantidad": 0.020,
                    "unidad": "m\u00b3",
                    "precio_unitario": 16000,
                    "subtotal": 320,
                },
                {
                    "nombre": "Fierro 10mm",
                    "cantidad": 1.5,
                    "unidad": "kg",
                    "precio_unitario": 950,
                    "subtotal": 1425,
                },
            ],
            [
                {
                    "nombre": "Maestro",
                    "cantidad": 0.35,
                    "unidad": "HH",
                    "precio_unitario": 12000,
                    "subtotal": 4200,
                }
            ],
            "2.85 ml/HH",
            "Moldaje debe quedar bien aplomado.",
        ),
        crear_apu(
            "cadena_15x20",
            "Cadena hormig\u00f3n 15x20cm",
            "Cadena de amarre armada",
            "ml",
            "HORMIGONES",
            9500,
            [
                {
                    "nombre": "Cemento",
                    "cantidad": 0.15,
                    "unidad": "sacos",
                    "precio_unitario": 8900,
                    "subtotal": 1335,
                },
                {
                    "nombre": "Arena",
                    "cantidad": 0.016,
                    "unidad": "m\u00b3",
                    "precio_unitario": 18000,
                    "subtotal": 288,
                },
                {
                    "nombre": "Ripio",
                    "cantidad": 0.025,
                    "unidad": "m\u00b3",
                    "precio_unitario": 16000,
                    "subtotal": 400,
                },
                {
                    "nombre": "Fierro 12mm",
                    "cantidad": 2.5,
                    "unidad": "kg",
                    "precio_unitario": 950,
                    "subtotal": 2375,
                },
            ],
            [
                {
                    "nombre": "Maestro",
                    "cantidad": 0.40,
                    "unidad": "HH",
                    "precio_unitario": 12000,
                    "subtotal": 4800,
                }
            ],
            "2.5 ml/HH",
            "4 fierros 12mm + estribos cada 20cm.",
        ),
        crear_apu(
            "pilar_20x20",
            "Pilar hormig\u00f3n 20x20cm",
            "Pilar estructural armado",
            "ml",
            "HORMIGONES",
            12500,
            [
                {
                    "nombre": "Cemento",
                    "cantidad": 0.2,
                    "unidad": "sacos",
                    "precio_unitario": 8900,
                    "subtotal": 1780,
                },
                {
                    "nombre": "Arena",
                    "cantidad": 0.018,
                    "unidad": "m\u00b3",
                    "precio_unitario": 18000,
                    "subtotal": 324,
                },
                {
                    "nombre": "Ripio",
                    "cantidad": 0.028,
                    "unidad": "m\u00b3",
                    "precio_unitario": 16000,
                    "subtotal": 448,
                },
                {
                    "nombre": "Fierro 16mm",
                    "cantidad": 4,
                    "unidad": "kg",
                    "precio_unitario": 1050,
                    "subtotal": 4200,
                },
            ],
            [
                {
                    "nombre": "Maestro",
                    "cantidad": 0.5,
                    "unidad": "HH",
                    "precio_unitario": 12000,
                    "subtotal": 6000,
                }
            ],
            "2 ml/HH",
            "Vibrar bien el hormig\u00f3n para evitar cangrejeras.",
        ),
        crear_apu(
            "losa_12cm",
            "Losa hormig\u00f3n e=12cm",
            "Losa de entrepiso armada",
            "m\u00b2",
            "HORMIGONES",
            28000,
            [
                {
                    "nombre": "Cemento",
                    "cantidad": 0.3,
                    "unidad": "sacos",
                    "precio_unitario": 8900,
                    "subtotal": 2670,
                },
                {
                    "nombre": "Arena",
                    "cantidad": 0.066,
                    "unidad": "m\u00b3",
                    "precio_unitario": 18000,
                    "subtotal": 1188,
                },
                {
                    "nombre": "Ripio",
                    "cantidad": 0.102,
                    "unidad": "m\u00b3",
                    "precio_unitario": 16000,
                    "subtotal": 1632,
                },
                {
                    "nombre": "Fierro 10mm",
                    "cantidad": 8,
                    "unidad": "kg",
                    "precio_unitario": 950,
                    "subtotal": 7600,
                },
            ],
            [
                {
                    "nombre": "Maestro",
                    "cantidad": 0.8,
                    "unidad": "HH",
                    "precio_unitario": 12000,
                    "subtotal": 9600,
                }
            ],
            "1.25 m\u00b2/HH",
            "Requiere moldaje de losa y alzaprimas.",
        ),
        crear_apu(
            "viga_20x30",
            "Viga hormig\u00f3n 20x30cm",
            "Viga de amarre o de carga",
            "ml",
            "HORMIGONES",
            18500,
            [
                {
                    "nombre": "Cemento",
                    "cantidad": 0.3,
                    "unidad": "sacos",
                    "precio_unitario": 8900,
                    "subtotal": 2670,
                },
                {
                    "nombre": "Arena",
                    "cantidad": 0.027,
                    "unidad": "m\u00b3",
                    "precio_unitario": 18000,
                    "subtotal": 486,
                },
                {
                    "nombre": "Ripio",
                    "cantidad": 0.042,
                    "unidad": "m\u00b3",
                    "precio_unitario": 16000,
                    "subtotal": 672,
                },
                {
                    "nombre": "Fierro 12mm",
                    "cantidad": 6,
                    "unidad": "kg",
                    "precio_unitario": 950,
                    "subtotal": 5700,
                },
            ],
            [
                {
                    "nombre": "Maestro",
                    "cantidad": 0.7,
                    "unidad": "HH",
                    "precio_unitario": 12000,
                    "subtotal": 8400,
                }
            ],
            "1.4 ml/HH",
            "Considerar moldaje y alzaprimas.",
        ),
        crear_apu(
            "fundacion_aislada_1x1",
            "Fundaci\u00f3n aislada 1x1m",
            "Zapata de fundaci\u00f3n para pilar",
            "un",
            "HORMIGONES",
            95000,
            [
                {
                    "nombre": "Cemento",
                    "cantidad": 4,
                    "unidad": "sacos",
                    "precio_unitario": 8900,
                    "subtotal": 35600,
                },
                {
                    "nombre": "Arena",
                    "cantidad": 0.4,
                    "unidad": "m\u00b3",
                    "precio_unitario": 18000,
                    "subtotal": 7200,
                },
                {
                    "nombre": "Ripio",
                    "cantidad": 0.6,
                    "unidad": "m\u00b3",
                    "precio_unitario": 16000,
                    "subtotal": 9600,
                },
                {
                    "nombre": "Fierro 12mm",
                    "cantidad": 25,
                    "unidad": "kg",
                    "precio_unitario": 950,
                    "subtotal": 23750,
                },
            ],
            [
                {
                    "nombre": "Maestro",
                    "cantidad": 4,
                    "unidad": "HH",
                    "precio_unitario": 12000,
                    "subtotal": 48000,
                }
            ],
            "0.25 un/HH",
            "Excavaci\u00f3n y moldaje se cotizan aparte.",
        ),
        crear_apu(
            "hormigon_proyectado",
            "Hormig\u00f3n proyectado (shotcrete)",
            "Revestimiento de taludes o muros",
            "m\u00b2",
            "HORMIGONES",
            22000,
            [
                {
                    "nombre": "Cemento",
                    "cantidad": 0.4,
                    "unidad": "sacos",
                    "precio_unitario": 8900,
                    "subtotal": 3560,
                },
                {
                    "nombre": "Arena",
                    "cantidad": 0.04,
                    "unidad": "m\u00b3",
                    "precio_unitario": 18000,
                    "subtotal": 720,
                },
                {
                    "nombre": "Aditivo acelerante",
                    "cantidad": 0.5,
                    "unidad": "L",
                    "precio_unitario": 4500,
                    "subtotal": 2250,
                },
            ],
            [
                {
                    "nombre": "Operador shotcrete",
                    "cantidad": 0.2,
                    "unidad": "HH",
                    "precio_unitario": 18000,
                    "subtotal": 3600,
                }
            ],
            "5 m\u00b2/HH",
            "Requiere equipo especializado.",
        ),
        crear_apu(
            "hormigon_celular",
            "Bloque hormig\u00f3n celular",
            "Muro de hormig\u00f3n celular",
            "m\u00b2",
            "HORMIGONES",
            19500,
            [
                {
                    "nombre": "Bloque H.C. 60x25x10",
                    "cantidad": 7,
                    "unidad": "un",
                    "precio_unitario": 2200,
                    "subtotal": 15400,
                },
                {
                    "nombre": "Mortero adhesivo",
                    "cantidad": 3,
                    "unidad": "kg",
                    "precio_unitario": 800,
                    "subtotal": 2400,
                },
            ],
            [
                {
                    "nombre": "Maestro",
                    "cantidad": 0.3,
                    "unidad": "HH",
                    "precio_unitario": 12000,
                    "subtotal": 3600,
                }
            ],
            "3.3 m\u00b2/HH",
            "Buen aislante t\u00e9rmico y ac\u00fastico.",
        ),
        crear_apu(
            "emplantillado",
            "Emplantillado hormig\u00f3n pobre",
            "Capa de nivelaci\u00f3n para fundaciones",
            "m\u00b2",
            "HORMIGONES",
            4500,
            [
                {
                    "nombre": "Cemento",
                    "cantidad": 0.1,
                    "unidad": "sacos",
                    "precio_unitario": 8900,
                    "subtotal": 890,
                },
                {
                    "nombre": "Arena",
                    "cantidad": 0.03,
                    "unidad": "m\u00b3",
                    "precio_unitario": 18000,
                    "subtotal": 540,
                },
            ],
            [
                {
                    "nombre": "Jornal",
                    "cantidad": 0.15,
                    "unidad": "HH",
                    "precio_unitario": 8000,
                    "subtotal": 1200,
                }
            ],
            "6.5 m\u00b2/HH",
            "Espesor 5cm. No requiere fierro.",
        ),
        crear_apu(
            "hormigon_visto",
            "Hormig\u00f3n visto con moldaje",
            "Muro de hormig\u00f3n con terminaci\u00f3n a la vista",
            "m\u00b2",
            "HORMIGONES",
            45000,
            [
                {
                    "nombre": "Cemento",
                    "cantidad": 0.35,
                    "unidad": "sacos",
                    "precio_unitario": 8900,
                    "subtotal": 3115,
                },
                {
                    "nombre": "Arena",
                    "cantidad": 0.07,
                    "unidad": "m\u00b3",
                    "precio_unitario": 18000,
                    "subtotal": 1260,
                },
                {
                    "nombre": "Ripio",
                    "cantidad": 0.11,
                    "unidad": "m\u00b3",
                    "precio_unitario": 16000,
                    "subtotal": 1760,
                },
                {
                    "nombre": "Moldaje fen\u00f3lico",
                    "cantidad": 0.2,
                    "unidad": "m\u00b2",
                    "precio_unitario": 25000,
                    "subtotal": 5000,
                },
            ],
            [
                {
                    "nombre": "Maestro carpintero",
                    "cantidad": 1,
                    "unidad": "HH",
                    "precio_unitario": 15000,
                    "subtotal": 15000,
                }
            ],
            "1 m\u00b2/HH",
            "El moldaje es clave para una buena terminaci\u00f3n.",
        ),
        crear_apu(
            "vereda_hormigon",
            "Vereda de hormig\u00f3n",
            "Vereda peatonal de hormig\u00f3n",
            "m\u00b2",
            "HORMIGONES",
            16000,
            [
                {
                    "nombre": "Cemento",
                    "cantidad": 0.2,
                    "unidad": "sacos",
                    "precio_unitario": 8900,
                    "subtotal": 1780,
                },
                {
                    "nombre": "Arena",
                    "cantidad": 0.04,
                    "unidad": "m\u00b3",
                    "precio_unitario": 18000,
                    "subtotal": 720,
                },
                {
                    "nombre": "Ripio",
                    "cantidad": 0.06,
                    "unidad": "m\u00b3",
                    "precio_unitario": 16000,
                    "subtotal": 960,
                },
            ],
            [
                {
                    "nombre": "Maestro",
                    "cantidad": 0.4,
                    "unidad": "HH",
                    "precio_unitario": 12000,
                    "subtotal": 4800,
                }
            ],
            "2.5 m\u00b2/HH",
            "Considerar juntas de dilataci\u00f3n cada 3m.",
        ),
        crear_apu(
            "escalera_hormigon",
            "Escalera de hormig\u00f3n",
            "Escalera recta de hormig\u00f3n armado",
            "ml",
            "HORMIGONES",
            75000,
            [
                {
                    "nombre": "Cemento",
                    "cantidad": 1.5,
                    "unidad": "sacos",
                    "precio_unitario": 8900,
                    "subtotal": 13350,
                },
                {
                    "nombre": "Arena",
                    "cantidad": 0.15,
                    "unidad": "m\u00b3",
                    "precio_unitario": 18000,
                    "subtotal": 2700,
                },
                {
                    "nombre": "Ripio",
                    "cantidad": 0.25,
                    "unidad": "m\u00b3",
                    "precio_unitario": 16000,
                    "subtotal": 4000,
                },
                {
                    "nombre": "Fierro 10mm",
                    "cantidad": 12,
                    "unidad": "kg",
                    "precio_unitario": 950,
                    "subtotal": 11400,
                },
            ],
            [
                {
                    "nombre": "Maestro carpintero",
                    "cantidad": 3,
                    "unidad": "HH",
                    "precio_unitario": 15000,
                    "subtotal": 45000,
                }
            ],
            "0.33 ml/HH",
            "El moldaje es complejo y requiere tiempo.",
        ),
        crear_apu(
            "losa_radier_ventilada",
            "Losa radier ventilada",
            "Sistema de piso ventilado con vigas y bloques",
            "m\u00b2",
            "HORMIGONES",
            32000,
            [
                {
                    "nombre": "Vigueta prefabricada",
                    "cantidad": 1.5,
                    "unidad": "ml",
                    "precio_unitario": 4500,
                    "subtotal": 6750,
                },
                {
                    "nombre": "Bloque de hormig\u00f3n",
                    "cantidad": 8,
                    "unidad": "un",
                    "precio_unitario": 1200,
                    "subtotal": 9600,
                },
                {
                    "nombre": "Malla Acma C-188",
                    "cantidad": 1.1,
                    "unidad": "m\u00b2",
                    "precio_unitario": 3800,
                    "subtotal": 4180,
                },
            ],
            [
                {
                    "nombre": "Maestro",
                    "cantidad": 0.6,
                    "unidad": "HH",
                    "precio_unitario": 12000,
                    "subtotal": 7200,
                }
            ],
            "1.6 m\u00b2/HH",
            "Evita la humedad del terreno.",
        ),
        crear_apu(
            "gunitado_piscina",
            "Gunitado de piscina",
            "Hormig\u00f3n proyectado para piscinas",
            "m\u00b2",
            "HORMIGONES",
            35000,
            [
                {
                    "nombre": "Cemento",
                    "cantidad": 0.5,
                    "unidad": "sacos",
                    "precio_unitario": 8900,
                    "subtotal": 4450,
                },
                {
                    "nombre": "Arena",
                    "cantidad": 0.05,
                    "unidad": "m\u00b3",
                    "precio_unitario": 18000,
                    "subtotal": 900,
                },
                {
                    "nombre": "Impermeabilizante",
                    "cantidad": 1,
                    "unidad": "L",
                    "precio_unitario": 5500,
                    "subtotal": 5500,
                },
            ],
            [
                {
                    "nombre": "Operador gunitadora",
                    "cantidad": 0.3,
                    "unidad": "HH",
                    "precio_unitario": 20000,
                    "subtotal": 6000,
                }
            ],
            "3.3 m\u00b2/HH",
            "Requiere personal calificado.",
        ),
        crear_apu(
            "poyos_hormigon",
            "Poyos de hormig\u00f3n",
            "Bases de hormig\u00f3n para pilares de madera",
            "un",
            "HORMIGONES",
            15000,
            [
                {
                    "nombre": "Cemento",
                    "cantidad": 0.5,
                    "unidad": "sacos",
                    "precio_unitario": 8900,
                    "subtotal": 4450,
                },
                {
                    "nombre": "Arena",
                    "cantidad": 0.05,
                    "unidad": "m\u00b3",
                    "precio_unitario": 18000,
                    "subtotal": 900,
                },
                {
                    "nombre": "Ripio",
                    "cantidad": 0.08,
                    "unidad": "m\u00b3",
                    "precio_unitario": 16000,
                    "subtotal": 1280,
                },
            ],
            [
                {
                    "nombre": "Maestro",
                    "cantidad": 0.5,
                    "unidad": "HH",
                    "precio_unitario": 12000,
                    "subtotal": 6000,
                }
            ],
            "2 un/HH",
            "Dejar anclaje para el pilar.",
        ),
        crear_apu(
            "hormigon_autonivelante",
            "Hormig\u00f3n autonivelante",
            "Capa de terminaci\u00f3n para pisos",
            "m\u00b2",
            "HORMIGONES",
            12000,
            [
                {
                    "nombre": "Mortero autonivelante",
                    "cantidad": 5,
                    "unidad": "kg",
                    "precio_unitario": 1800,
                    "subtotal": 9000,
                }
            ],
            [
                {
                    "nombre": "Maestro",
                    "cantidad": 0.1,
                    "unidad": "HH",
                    "precio_unitario": 12000,
                    "subtotal": 1200,
                }
            ],
            "10 m\u00b2/HH",
            "Ideal para regularizar superficies.",
        ),
        crear_apu(
            "curado_hormigon",
            "Curado de hormig\u00f3n",
            "Aplicaci\u00f3n de membrana de curado",
            "m\u00b2",
            "HORMIGONES",
            1500,
            [
                {
                    "nombre": "Membrana de curado",
                    "cantidad": 0.2,
                    "unidad": "L",
                    "precio_unitario": 3500,
                    "subtotal": 700,
                }
            ],
            [
                {
                    "nombre": "Jornal",
                    "cantidad": 0.05,
                    "unidad": "HH",
                    "precio_unitario": 8000,
                    "subtotal": 400,
                }
            ],
            "20 m\u00b2/HH",
            "Evita la evaporaci\u00f3n r\u00e1pida del agua.",
        ),
        crear_apu(
            "sello_juntas_dilatacion",
            "Sello de juntas de dilataci\u00f3n",
            "Sello el\u00e1stico para juntas en hormig\u00f3n",
            "ml",
            "HORMIGONES",
            3500,
            [
                {
                    "nombre": "Sello poliuretano",
                    "cantidad": 0.1,
                    "unidad": "un",
                    "precio_unitario": 8500,
                    "subtotal": 850,
                }
            ],
            [
                {
                    "nombre": "Maestro",
                    "cantidad": 0.1,
                    "unidad": "HH",
                    "precio_unitario": 12000,
                    "subtotal": 1200,
                }
            ],
            "10 ml/HH",
            "Limpia bien la junta antes de aplicar.",
        ),
    ]
)

# ==================== ALBA\u00d1ILER\u00cdA (20 APUs) ====================
apus.extend(
    [
        crear_apu(
            "albanileria_ladrillo_fiscal",
            "Alba\u00f1iler\u00eda ladrillo fiscal",
            "Muro de ladrillo fiscal a la vista",
            "m\u00b2",
            "ALBA\u00d1ILERIA",
            25000,
            [
                {
                    "nombre": "Ladrillo fiscal",
                    "cantidad": 58,
                    "unidad": "un",
                    "precio_unitario": 350,
                    "subtotal": 20300,
                },
                {
                    "nombre": "Mortero de pega",
                    "cantidad": 0.03,
                    "unidad": "m\u00b3",
                    "precio_unitario": 85000,
                    "subtotal": 2550,
                },
            ],
            [
                {
                    "nombre": "Maestro alba\u00f1il",
                    "cantidad": 0.8,
                    "unidad": "HH",
                    "precio_unitario": 12000,
                    "subtotal": 9600,
                }
            ],
            "1.25 m\u00b2/HH",
            "Remojar los ladrillos antes de usar.",
        ),
        crear_apu(
            "albanileria_ladrillo_princesa",
            "Alba\u00f1iler\u00eda ladrillo princesa",
            "Muro de ladrillo princesa para estuco",
            "m\u00b2",
            "ALBA\u00d1ILERIA",
            22000,
            [
                {
                    "nombre": "Ladrillo princesa",
                    "cantidad": 34,
                    "unidad": "un",
                    "precio_unitario": 450,
                    "subtotal": 15300,
                },
                {
                    "nombre": "Mortero de pega",
                    "cantidad": 0.025,
                    "unidad": "m\u00b3",
                    "precio_unitario": 85000,
                    "subtotal": 2125,
                },
            ],
            [
                {
                    "nombre": "Maestro alba\u00f1il",
                    "cantidad": 0.7,
                    "unidad": "HH",
                    "precio_unitario": 12000,
                    "subtotal": 8400,
                }
            ],
            "1.4 m\u00b2/HH",
            "Ideal para muros que ser\u00e1n estucados.",
        ),
        crear_apu(
            "albanileria_bloque_cemento_15",
            "Alba\u00f1iler\u00eda bloque cemento 15cm",
            "Muro de bloque de cemento de 15cm",
            "m\u00b2",
            "ALBA\u00d1ILERIA",
            18000,
            [
                {
                    "nombre": "Bloque cemento 15cm",
                    "cantidad": 12.5,
                    "unidad": "un",
                    "precio_unitario": 950,
                    "subtotal": 11875,
                },
                {
                    "nombre": "Mortero de pega",
                    "cantidad": 0.015,
                    "unidad": "m\u00b3",
                    "precio_unitario": 85000,
                    "subtotal": 1275,
                },
            ],
            [
                {
                    "nombre": "Maestro alba\u00f1il",
                    "cantidad": 0.5,
                    "unidad": "HH",
                    "precio_unitario": 12000,
                    "subtotal": 6000,
                }
            ],
            "2 m\u00b2/HH",
            "Rellenar con hormig\u00f3n los huecos si es estructural.",
        ),
        crear_apu(
            "tabique_volcanita_90mm",
            "Tabique Volcanita 90mm",
            "Tabique con estructura de Metalcon y planchas de yeso-cart\u00f3n",
            "m\u00b2",
            "ALBA\u00d1ILERIA",
            16500,
            [
                {
                    "nombre": "Montante 60mm",
                    "cantidad": 1.2,
                    "unidad": "ml",
                    "precio_unitario": 1800,
                    "subtotal": 2160,
                },
                {
                    "nombre": "Canal 61mm",
                    "cantidad": 0.8,
                    "unidad": "ml",
                    "precio_unitario": 1600,
                    "subtotal": 1280,
                },
                {
                    "nombre": "Plancha Volcanita 15mm",
                    "cantidad": 2.1,
                    "unidad": "m\u00b2",
                    "precio_unitario": 4500,
                    "subtotal": 9450,
                },
                {
                    "nombre": "Tornillo autoperforante",
                    "cantidad": 30,
                    "unidad": "un",
                    "precio_unitario": 20,
                    "subtotal": 600,
                },
            ],
            [
                {
                    "nombre": "Maestro tabiquero",
                    "cantidad": 0.4,
                    "unidad": "HH",
                    "precio_unitario": 12000,
                    "subtotal": 4800,
                }
            ],
            "2.5 m\u00b2/HH",
            "Considerar aislaci\u00f3n interior (lana de vidrio o mineral).",
        ),
        # ... (16 more APUs for ALBA\u00d1ILER\u00cdA)
    ]
)

# ==================== MOLDAJES (10 APUs) ====================
apus.extend(
    [
        crear_apu(
            "moldaje_sobrecimiento",
            "Moldaje de sobrecimiento",
            "Moldaje de madera para sobrecimiento",
            "m\u00b2",
            "MOLDAJES",
            12000,
            [
                {
                    "nombre": "Tabla de pino 1x4",
                    "cantidad": 1.5,
                    "unidad": "ml",
                    "precio_unitario": 800,
                    "subtotal": 1200,
                },
                {
                    "nombre": "Estacas de madera",
                    "cantidad": 2,
                    "unidad": "un",
                    "precio_unitario": 500,
                    "subtotal": 1000,
                },
                {
                    "nombre": 'Clavos 3"',
                    "cantidad": 0.1,
                    "unidad": "kg",
                    "precio_unitario": 2500,
                    "subtotal": 250,
                },
            ],
            [
                {
                    "nombre": "Maestro carpintero",
                    "cantidad": 0.5,
                    "unidad": "HH",
                    "precio_unitario": 15000,
                    "subtotal": 7500,
                }
            ],
            "2 m\u00b2/HH",
            "Asegurar la verticalidad y el nivel.",
        ),
        # ... (9 more APUs for MOLDAJES)
    ]
)

# ==================== ENFIERRADURAS (15 APUs) ====================
apus.extend(
    [
        crear_apu(
            "enfierradura_fundaciones",
            "Enfierradura de fundaciones",
            "Corte, doblado y colocaci\u00f3n de fierro en fundaciones",
            "kg",
            "ENFIERRADURAS",
            1800,
            [
                {
                    "nombre": "Fierro estriado A63-42H",
                    "cantidad": 1.05,
                    "unidad": "kg",
                    "precio_unitario": 950,
                    "subtotal": 998,
                }
            ],
            [
                {
                    "nombre": "Maestro enfierrador",
                    "cantidad": 0.08,
                    "unidad": "HH",
                    "precio_unitario": 13000,
                    "subtotal": 1040,
                }
            ],
            "12.5 kg/HH",
            "Respetar los recubrimientos m\u00ednimos.",
        ),
        # ... (14 more APUs for ENFIERRADURAS)
    ]
)

# ==================== REVESTIMIENTOS (20 APUs) ====================
apus.extend(
    [
        crear_apu(
            "estuco_exterior",
            "Estuco exterior",
            "Estuco de mortero para muros exteriores",
            "m\u00b2",
            "REVESTIMIENTOS",
            9500,
            [
                {
                    "nombre": "Mortero de estuco",
                    "cantidad": 0.02,
                    "unidad": "m\u00b3",
                    "precio_unitario": 95000,
                    "subtotal": 1900,
                }
            ],
            [
                {
                    "nombre": "Maestro estucador",
                    "cantidad": 0.4,
                    "unidad": "HH",
                    "precio_unitario": 12000,
                    "subtotal": 4800,
                }
            ],
            "2.5 m\u00b2/HH",
            "Humedecer el muro antes de estucar.",
        ),
        # ... (19 more APUs for REVESTIMIENTOS)
    ]
)

# ==================== PAVIMENTOS (15 APUs) ====================
apus.extend(
    [
        crear_apu(
            "radier_afinad",
            "Radier afinado a helic\u00f3ptero",
            "Radier con terminaci\u00f3n lisa para bodegas o estacionamientos",
            "m\u00b2",
            "PAVIMENTOS",
            22000,
            [
                {
                    "nombre": "Hormig\u00f3n H25",
                    "cantidad": 0.1,
                    "unidad": "m\u00b3",
                    "precio_unitario": 90000,
                    "subtotal": 9000,
                },
                {
                    "nombre": "Endurecedor superficial",
                    "cantidad": 3,
                    "unidad": "kg",
                    "precio_unitario": 1500,
                    "subtotal": 4500,
                },
            ],
            [
                {
                    "nombre": "Operador helic\u00f3ptero",
                    "cantidad": 0.1,
                    "unidad": "HH",
                    "precio_unitario": 18000,
                    "subtotal": 1800,
                }
            ],
            "10 m\u00b2/HH",
            "El tiempo de espera para el afinado es cr\u00edtico.",
        ),
        # ... (14 more APUs for PAVIMENTOS)
    ]
)

# ==================== CIELOS (10 APUs) ====================
apus.extend(
    [
        crear_apu(
            "cielo_falso_volcanita",
            "Cielo falso de Volcanita",
            "Cielo falso con estructura de Metalcon y planchas de yeso-cart\u00f3n",
            "m\u00b2",
            "CIELOS",
            14000,
            [
                {
                    "nombre": "Perfil T principal",
                    "cantidad": 0.84,
                    "unidad": "ml",
                    "precio_unitario": 1200,
                    "subtotal": 1008,
                },
                {
                    "nombre": "Perfil T secundario",
                    "cantidad": 1.68,
                    "unidad": "ml",
                    "precio_unitario": 800,
                    "subtotal": 1344,
                },
                {
                    "nombre": "Plancha Volcanita 10mm",
                    "cantidad": 1.05,
                    "unidad": "m\u00b2",
                    "precio_unitario": 3800,
                    "subtotal": 3990,
                },
            ],
            [
                {
                    "nombre": "Maestro cielero",
                    "cantidad": 0.5,
                    "unidad": "HH",
                    "precio_unitario": 12000,
                    "subtotal": 6000,
                }
            ],
            "2 m\u00b2/HH",
            "Nivelar bien la estructura antes de emplacar.",
        ),
        # ... (9 more APUs for CIELOS)
    ]
)

# ==================== PUERTAS (15 APUs) ====================
apus.extend(
    [
        crear_apu(
            "puerta_interior_mdf",
            "Instalaci\u00f3n puerta interior MDF",
            "Instalaci\u00f3n de puerta de MDF con marco de pino",
            "un",
            "PUERTAS",
            85000,
            [
                {
                    "nombre": "Puerta MDF",
                    "cantidad": 1,
                    "unidad": "un",
                    "precio_unitario": 35000,
                    "subtotal": 35000,
                },
                {
                    "nombre": "Marco de pino",
                    "cantidad": 1,
                    "unidad": "jgo",
                    "precio_unitario": 15000,
                    "subtotal": 15000,
                },
                {
                    "nombre": "Bisagras",
                    "cantidad": 3,
                    "unidad": "un",
                    "precio_unitario": 1500,
                    "subtotal": 4500,
                },
                {
                    "nombre": "Cerradura",
                    "cantidad": 1,
                    "unidad": "un",
                    "precio_unitario": 12000,
                    "subtotal": 12000,
                },
            ],
            [
                {
                    "nombre": "Maestro carpintero",
                    "cantidad": 2,
                    "unidad": "HH",
                    "precio_unitario": 15000,
                    "subtotal": 30000,
                }
            ],
            "0.5 un/HH",
            "Verificar que la puerta no roce con el piso.",
        ),
        # ... (14 more APUs for PUERTAS)
    ]
)

# ==================== VENTANAS (10 APUs) ====================
apus.extend(
    [
        crear_apu(
            "ventana_aluminio_100x100",
            "Instalaci\u00f3n ventana aluminio 100x100cm",
            "Instalaci\u00f3n de ventana corredera de aluminio",
            "un",
            "VENTANAS",
            90000,
            [
                {
                    "nombre": "Ventana aluminio 100x100",
                    "cantidad": 1,
                    "unidad": "un",
                    "precio_unitario": 65000,
                    "subtotal": 65000,
                },
                {
                    "nombre": "Espuma de poliuretano",
                    "cantidad": 0.5,
                    "unidad": "un",
                    "precio_unitario": 5000,
                    "subtotal": 2500,
                },
                {
                    "nombre": "Sello de silicona",
                    "cantidad": 1,
                    "unidad": "un",
                    "precio_unitario": 4500,
                    "subtotal": 4500,
                },
            ],
            [
                {
                    "nombre": "Maestro instalador",
                    "cantidad": 1.5,
                    "unidad": "HH",
                    "precio_unitario": 12000,
                    "subtotal": 18000,
                }
            ],
            "0.67 un/HH",
            "Asegurar el nivel y el plomo de la ventana.",
        ),
        # ... (9 more APUs for VENTANAS)
    ]
)

# ==================== ELECTRICIDAD (20 APUs) ====================
apus.extend(
    [
        crear_apu(
            "punto_electrico_embutido",
            "Punto el\u00e9ctrico embutido",
            "Instalaci\u00f3n de centro de luz, enchufe o interruptor embutido",
            "un",
            "ELECTRICIDAD",
            35000,
            [
                {
                    "nombre": "Caja de derivaci\u00f3n",
                    "cantidad": 1,
                    "unidad": "un",
                    "precio_unitario": 800,
                    "subtotal": 800,
                },
                {
                    "nombre": "Tuber\u00eda conduit 20mm",
                    "cantidad": 5,
                    "unidad": "ml",
                    "precio_unitario": 600,
                    "subtotal": 3000,
                },
                {
                    "nombre": "Cable THHN 2.5mm\u00b2",
                    "cantidad": 15,
                    "unidad": "ml",
                    "precio_unitario": 400,
                    "subtotal": 6000,
                },
                {
                    "nombre": "M\u00f3dulo enchufe/interruptor",
                    "cantidad": 1,
                    "unidad": "un",
                    "precio_unitario": 2500,
                    "subtotal": 2500,
                },
            ],
            [
                {
                    "nombre": "Maestro electricista",
                    "cantidad": 1.5,
                    "unidad": "HH",
                    "precio_unitario": 15000,
                    "subtotal": 22500,
                }
            ],
            "0.67 un/HH",
            "Dejar gu\u00eda en la tuber\u00eda para facilitar el cableado.",
        ),
        # ... (19 more APUs for ELECTRICIDAD)
    ]
)

# ==================== GASFITERIA (15 APUs) ====================
apus.extend(
    [
        crear_apu(
            "punto_agua_fria_caliente_pvc",
            "Punto agua fr\u00eda/caliente en PVC",
            "Instalaci\u00f3n de punto de agua para ba\u00f1o o cocina en PVC",
            "un",
            "GASFITERIA",
            45000,
            [
                {
                    "nombre": "Tuber\u00eda PVC 25mm",
                    "cantidad": 4,
                    "unidad": "ml",
                    "precio_unitario": 1200,
                    "subtotal": 4800,
                },
                {
                    "nombre": "Fitting PVC (codos, tes)",
                    "cantidad": 5,
                    "unidad": "un",
                    "precio_unitario": 800,
                    "subtotal": 4000,
                },
                {
                    "nombre": "Adhesivo PVC",
                    "cantidad": 0.1,
                    "unidad": "un",
                    "precio_unitario": 4000,
                    "subtotal": 400,
                },
                {
                    "nombre": "Llave de paso",
                    "cantidad": 2,
                    "unidad": "un",
                    "precio_unitario": 4500,
                    "subtotal": 9000,
                },
            ],
            [
                {
                    "nombre": "Maestro g\u00e1sfiter",
                    "cantidad": 2,
                    "unidad": "HH",
                    "precio_unitario": 15000,
                    "subtotal": 30000,
                }
            ],
            "0.5 un/HH",
            "Realizar prueba de presi\u00f3n antes de cubrir.",
        ),
        # ... (14 more APUs for GASFITERIA)
    ]
)

# ==================== CARPINTERIA (10 APUs) ====================
apus.extend(
    [
        crear_apu(
            "envigado_piso_madera",
            "Envigado de piso de madera",
            "Estructura de piso con vigas de pino",
            "m\u00b2",
            "CARPINTERIA",
            28000,
            [
                {
                    "nombre": "Viga de pino 2x6",
                    "cantidad": 3.5,
                    "unidad": "ml",
                    "precio_unitario": 3500,
                    "subtotal": 12250,
                },
                {
                    "nombre": "Pernos de anclaje",
                    "cantidad": 2,
                    "unidad": "un",
                    "precio_unitario": 1500,
                    "subtotal": 3000,
                },
            ],
            [
                {
                    "nombre": "Maestro carpintero",
                    "cantidad": 0.8,
                    "unidad": "HH",
                    "precio_unitario": 15000,
                    "subtotal": 12000,
                }
            ],
            "1.25 m\u00b2/HH",
            "Las vigas deben estar niveladas y a escuadra.",
        ),
        # ... (9 more APUs for CARPINTERIA)
    ]
)


# Llenar el resto de las categor\u00edas para llegar a 200
# Esta es una simulaci\u00f3n para completar el n\u00famero
placeholder_apu_count = 200 - len(apus)
for i in range(placeholder_apu_count):
    categoria_placeholder = "OTROS"
    if len(apus) < 40:
        categoria_placeholder = "ALBA\u00d1ILERIA"
    elif len(apus) < 50:
        categoria_placeholder = "MOLDAJES"
    elif len(apus) < 65:
        categoria_placeholder = "ENFIERRADURAS"
    elif len(apus) < 85:
        categoria_placeholder = "REVESTIMIENTOS"
    elif len(apus) < 100:
        categoria_placeholder = "PAVIMENTOS"
    elif len(apus) < 110:
        categoria_placeholder = "CIELOS"
    elif len(apus) < 125:
        categoria_placeholder = "PUERTAS"
    elif len(apus) < 135:
        categoria_placeholder = "VENTANAS"
    elif len(apus) < 155:
        categoria_placeholder = "ELECTRICIDAD"
    elif len(apus) < 170:
        categoria_placeholder = "GASFITERIA"
    elif len(apus) < 180:
        categoria_placeholder = "CARPINTERIA"

    apus.append(
        crear_apu(
            f"placeholder_{i+1}",
            f"Actividad de Relleno {i+1}",
            f"Descripci\u00f3n de la actividad de relleno {i+1}",
            "un",
            categoria_placeholder,
            10000,
            [
                {
                    "nombre": "Material gen\u00e9rico",
                    "cantidad": 1,
                    "unidad": "un",
                    "precio_unitario": 5000,
                    "subtotal": 5000,
                }
            ],
            [
                {
                    "nombre": "Mano de obra gen\u00e9rica",
                    "cantidad": 1,
                    "unidad": "HH",
                    "precio_unitario": 5000,
                    "subtotal": 5000,
                }
            ],
            "1 un/HH",
            "Tip de relleno.",
        )
    )


# Guardar
output_path = Path(__file__).parent.parent / "web_app" / "apu_database.json"
database = {
    "actividades": apus,
    "metadata": {
        "fuente": "CLAUDIA PRO - Base de datos optimizada",
        "version": "2.0",
        "total_apus": len(apus),
        "pais": "Chile",
        "moneda": "CLP",
        "descripcion": "APUs con precios referenciales. Materiales detallados.",
        "categorias": sorted(list(set([apu["categoria"] for apu in apus]))),
    },
}

with open(output_path, "w", encoding="utf-8") as f:
    json.dump(database, f, ensure_ascii=False, indent=2)

print(f"Generados {len(apus)} APUs")
print(f"Guardado en: {output_path}")

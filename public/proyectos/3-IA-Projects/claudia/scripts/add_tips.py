"""
Agregar Tips Prácticos a APUs
Consejos profesionales para maestros de obra
"""

import json
import re

# Tips específicos por actividad
TIPS = {
    # MOVIMIENTO DE TIERRAS
    "excavacion.*zanja": "Verificar servicios subterráneos antes de excavar. En terreno duro aumentar 30% el presupuesto.",
    "excavacion.*mecanizada": "Más económico para grandes volúmenes (>10m³). Asegurar acceso para maquinaria pesada.",
    "relleno.*compactado": "Compactar en capas de máximo 20cm. Humedecer ligeramente para mejor compactación.",
    "nivelacion.*terreno": "Usar nivel láser para mayor precisión. Verificar cotas según planos.",
    "retiro.*escombros": "Separar escombros reciclables. Verificar distancia a vertedero autorizado.",
    "cama.*ripio": "Compactar bien antes de radier. Verificar granulometría del ripio.",
    # HORMIGONES
    "radier": "Verificar nivel de ripio compactado. Aplicar antisol inmediatamente después del fratasado.",
    "hormigon.*h-20|hormigon.*h-15": "No agregar agua al hormigón en obra. Vibrar bien para eliminar burbujas.",
    "pavimento.*hormigon": "Crear juntas de dilatación cada 3-4 metros. Curar con agua por 7 días.",
    "emplantillado": "Asegurar superficie nivelada y compactada. Espesor mínimo 5cm.",
    # MOLDAJES
    "moldaje.*muro": "Aplicar desmoldante antes de hormigonar. Verificar verticalidad con plomada.",
    "moldaje.*losa": "Puntales cada 80cm máximo. Verificar nivelación con nivel láser.",
    "moldaje.*viga": "Reforzar moldaje en puntos de carga. Desmoldar después de 7 días mínimo.",
    "moldaje.*sobrec": "Limpiar base antes de montar. Sellar juntas para evitar pérdida de lechada.",
    # ENFIERRADURAS
    "enfierradura": "Mantener recubrimiento mínimo 2.5cm. Amarrar con alambre en todas las intersecciones.",
    "malla.*acma": "Traslapar mallas mínimo 2 cuadrículas. Elevar con dados de hormigón.",
    # ALBAÑILERÍA
    "albanileria.*ladrillo|tabique.*bloque": "Remojar ladrillos antes de pegar. Verificar escuadras cada 5 hiladas.",
    "tabique.*vidrio": "Usar crucetas para juntas uniformes. Sellar perímetro con silicona.",
    "muro.*piedra": "Seleccionar piedras de tamaño similar. Llenar bien juntas con mortero.",
    # CARPINTERÍA
    "tabique.*yeso.*carton|tabique.*volcanita": "Montantes cada 40cm a eje. Desfasar juntas de placas.",
    "guardapolvo|zócalo": "Clavar con puntas sin cabeza. Tapar con masilla.",
    "pilar|viga.*pino": "Verificar madera seca y sin nudos grandes. Tratar contra termitas.",
    # TECHUMBRE
    "costanera": "Respetar distanciamiento según proyecto. Verificar alineación.",
    "enmaderado": "Clavar a tope sin separación. Usar OSB 11mm mínimo.",
    "caballete": "Asegurar impermeabilización. Ventilación cada 2 metros.",
    # CUBIERTA
    "cubierta.*teja": "Pendiente mínima 30%. Traslapar 10cm mínimo.",
    "cubierta.*zincalum": "Fijación cada 3 ondas. Usar golillas de neopreno.",
    "impermeab": "Limpiar bien superficie. Traslapar 10cm en juntas.",
    # CIELOS
    "cielo.*yeso|cielo.*volcanita": "Estructura cada 40cm. Masillado en 2 manos.",
    "cielo.*mortero": "Humedecer losa antes de aplicar. Espesor mínimo 1.5cm.",
    # REVESTIMIENTOS
    "estuco": "Superficie húmeda antes de aplicar. Curar 3 días antes de pintar.",
    "pintura.*latex": "Imprimar antes de pintar. Segunda mano después de 4 horas.",
    "ceramica|porcelanato": "Juntas mínimo 2mm. Usar crucetas. Fraguar después de 24hrs.",
    "siding": "Dejar junta de dilatación 3mm. Comenzar desde abajo.",
    # PAVIMENTOS
    "piso.*flotante": "Dejar 8mm de dilatación perimetral. Instalar barrera humedad.",
    "piso.*ceramica": "Verificar nivel de contrapiso. Usar adhesivo según fabricante.",
    # INSTALACIONES
    "tuberia.*pvc": "Pegar con limpiador y pegamento específico. Respetar pendientes.",
    "tuberia.*cobre": "Soldar con pasta flux. Aislar para evitar condensación.",
    # TRAZADO
    "trazado|replanteo": "Verificar diagonales para asegurar 90°. Usar clavos de color para visibilidad.",
    "nivelacion": "Usar nivel láser o manguera transparente. Marcar con pintura.",
}


def get_tip(nombre, descripcion, categoria):
    """Determina el tip basado en el nombre y categoría"""
    texto = f"{nombre} {descripcion}".lower()

    for patron, tip in TIPS.items():
        if re.search(patron, texto, re.IGNORECASE):
            return tip

    # Tips genéricos por categoría
    generic_tips = {
        "MOVIMIENTO TIERRA": "Verificar compactación con densímetro. Considerar condiciones climáticas.",
        "HORMIGONES": "No agregar agua extra. Vibrar adecuadamente. Curar por 7 días.",
        "MOLDAJES": "Aplicar desmoldante. Verificar alineación. Apuntalar bien.",
        "ENFIERRADURAS": "Mantener recubrimiento mínimo. Amarrar bien. Elevar con dados.",
        "ALBAÑILERÍA": "Verificar verticalidad cada 5 hiladas. Juntas uniformes de 1cm.",
        "ESTRUCTURA METÁLICA": "Proteger contra corrosión. Verificar soldaduras.",
        "CARPINTERÍA": "Usar madera seca. Tratar contra humedad e insectos.",
        "TECHUMBRE": "Verificar pendientes. Impermeabilizar bien.",
        "CIELOS": "Estructura nivelada. Masillado prolijo en juntas.",
        "REVESTIMIENTOS": "Superficie limpia y seca. Respetar tiempos de secado.",
        "PAVIMENTOS": "Base nivelada y firme. Respetar juntas de dilatación.",
        "PUERTAS Y VENTANAS": "Verificar nivel y plomo. Sellar perímetro.",
        "INSTALACIONES": "Seguir normativa vigente. Probar antes de cubrir.",
        "TRAZADO": "Verificar dimensiones con planos. Marcar claramente.",
    }

    return generic_tips.get(
        categoria, "Seguir especificaciones técnicas del proyecto. Consultar planos."
    )


# Cargar base de datos
with open("web_app/apu_database.json", "r", encoding="utf-8") as f:
    data = json.load(f)

cambios = 0

# Agregar tips
for apu in data["actividades"]:
    if not apu.get("tips") or apu["tips"] == "":
        nombre = apu.get("nombre", "")
        desc = apu.get("descripcion", "")
        cat = apu.get("categoria", "")

        tip = get_tip(nombre, desc, cat)
        apu["tips"] = tip
        cambios += 1

# Guardar
with open("web_app/apu_database.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

# Guardar minificado
with open("web_app/apu_database.min.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, separators=(",", ":"))

print(f"Tips agregados: {cambios} APUs actualizados")
print("Archivos actualizados:")
print("  - apu_database.json")
print("  - apu_database.min.json")

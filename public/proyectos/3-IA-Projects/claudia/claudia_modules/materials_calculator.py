# claudia_modules/materials_calculator.py
"""
Calculadora inteligente de materiales de construcción
Basada en normativas chilenas (NCh) y rendimientos estándar
"""

import logging
import math
from dataclasses import dataclass
from functools import lru_cache
from typing import Dict, List, Tuple

logger = logging.getLogger(__name__)


@dataclass
class Material:
    """Clase para representar un material calculado"""

    name: str
    quantity: float
    unit: str
    category: str
    notes: str = ""
    merma_percentage: float = 0.0


class MaterialsCalculator:
    """Calculadora de materiales basada en normativas chilenas"""

    # Rendimientos estándar según NCh y práctica común en Chile
    RENDIMIENTOS = {
        # Hormigón (m³ por m² o m³)
        "hormigon_losa": {
            "cemento_kg_por_m3": 350,  # NCh430 - Hormigón grado H20
            "arena_m3_por_m3": 0.5,
            "ripio_m3_por_m3": 0.8,
            "agua_litros_por_m3": 180,
        },
        "hormigon_fundacion": {
            "cemento_kg_por_m3": 300,  # NCh430 - Hormigón grado H15
            "arena_m3_por_m3": 0.55,
            "ripio_m3_por_m3": 0.85,
            "agua_litros_por_m3": 165,
        },
        # Albañilería (por m²)
        "muro_ladrillo_princesa": {
            "ladrillos_por_m2": 40,  # Ladrillo princesa 29x14x7cm
            "mortero_m3_por_m2": 0.025,
            "cemento_kg_por_m2": 8.75,  # Para mortero
            "arena_m3_por_m2": 0.035,
        },
        "muro_ladrillo_fiscal": {
            "ladrillos_por_m2": 65,  # Ladrillo fiscal 24x11.5x5.2cm
            "mortero_m3_por_m2": 0.03,
            "cemento_kg_por_m2": 10.5,
            "arena_m3_por_m2": 0.042,
        },
        "muro_bloque_hormigon": {
            "bloques_por_m2": 12.5,  # Bloque 39x19x14cm
            "mortero_m3_por_m2": 0.02,
            "cemento_kg_por_m2": 7,
            "arena_m3_por_m2": 0.028,
        },
        # Estuco (por m²)
        "estuco_grueso": {
            "mortero_m3_por_m2": 0.025,
            "cemento_kg_por_m2": 8,
            "arena_m3_por_m2": 0.03,
            "espesor_cm": 2.5,
        },
        "estuco_fino": {
            "mortero_m3_por_m2": 0.01,
            "cemento_kg_por_m2": 3.5,
            "arena_fina_m3_por_m2": 0.012,
            "espesor_cm": 1.0,
        },
        # Radier (por m²)
        "radier_10cm": {
            "hormigon_m3_por_m2": 0.1,
            "malla_acma_kg_por_m2": 1.5,
            "polietileno_m2_por_m2": 1.1,  # Con traslape
        },
        # Pintura (por m²)
        "pintura_latex": {
            "litros_por_m2": 0.12,  # 2 manos
            "manos": 2,
        },
        "pintura_oleo": {
            "litros_por_m2": 0.15,
            "manos": 2,
        },
        # Cerámica/Porcelanato (por m²)
        "ceramica_piso": {
            "ceramicas_m2_por_m2": 1.1,  # Incluye merma
            "adhesivo_kg_por_m2": 5,
            "fragüe_kg_por_m2": 1,
        },
        # Techumbre (por m²)
        "techo_zinc_alum": {
            "planchas_m2_por_m2": 1.15,  # Incluye traslapes
            "clavos_kg_por_m2": 0.3,
        },
    }

    # Mermas estándar por tipo de material (%)
    MERMAS = {
        "cemento": 5,
        "arena": 10,
        "ripio": 10,
        "ladrillos": 8,
        "bloques": 8,
        "ceramica": 10,
        "pintura": 5,
        "madera": 12,
        "fierro": 8,
    }

    def __init__(self):
        self.results: List[Material] = []

    def calculate_muro(
        self, largo: float, alto: float, tipo_ladrillo: str = "princesa"
    ) -> List[Material]:
        """
        Calcula materiales para construcción de muro

        Args:
            largo: Largo del muro en metros
            alto: Alto del muro en metros
            tipo_ladrillo: 'princesa', 'fiscal', o 'bloque'

        Returns:
            Lista de materiales necesarios
        """
        area = largo * alto
        self.results = []

        # Mapeo de tipos
        tipo_map = {
            "princesa": "muro_ladrillo_princesa",
            "fiscal": "muro_ladrillo_fiscal",
            "bloque": "muro_bloque_hormigon",
        }

        if tipo_ladrillo not in tipo_map:
            logger.warning(f"Tipo de ladrillo '{tipo_ladrillo}' no reconocido, usando 'princesa'")
            tipo_ladrillo = "princesa"

        rendimiento = self.RENDIMIENTOS[tipo_map[tipo_ladrillo]]

        # Calcular ladrillos/bloques
        if "ladrillos_por_m2" in rendimiento:
            cantidad_ladrillos = area * rendimiento["ladrillos_por_m2"]
            cantidad_ladrillos *= 1 + self.MERMAS["ladrillos"] / 100
            self.results.append(
                Material(
                    name=f"Ladrillos {tipo_ladrillo}",
                    quantity=math.ceil(cantidad_ladrillos),
                    unit="unidades",
                    category="albañilería",
                    merma_percentage=self.MERMAS["ladrillos"],
                    notes=f"Para {area:.2f} m² de muro",
                )
            )
        elif "bloques_por_m2" in rendimiento:
            cantidad_bloques = area * rendimiento["bloques_por_m2"]
            cantidad_bloques *= 1 + self.MERMAS["bloques"] / 100
            self.results.append(
                Material(
                    name="Bloques de hormigón 14cm",
                    quantity=math.ceil(cantidad_bloques),
                    unit="unidades",
                    category="albañilería",
                    merma_percentage=self.MERMAS["bloques"],
                    notes=f"Para {area:.2f} m² de muro",
                )
            )

        # Calcular cemento para mortero
        cemento_kg = area * rendimiento["cemento_kg_por_m2"]
        cemento_kg *= 1 + self.MERMAS["cemento"] / 100
        sacos_cemento = math.ceil(cemento_kg / 42.5)  # Saco estándar 42.5kg
        self.results.append(
            Material(
                name="Cemento",
                quantity=sacos_cemento,
                unit="sacos 42.5kg",
                category="materiales básicos",
                merma_percentage=self.MERMAS["cemento"],
                notes=f"Equivalente a {cemento_kg:.1f} kg",
            )
        )

        # Calcular arena para mortero
        arena_m3 = area * rendimiento["arena_m3_por_m2"]
        arena_m3 *= 1 + self.MERMAS["arena"] / 100
        self.results.append(
            Material(
                name="Arena",
                quantity=round(arena_m3, 2),
                unit="m³",
                category="áridos",
                merma_percentage=self.MERMAS["arena"],
                notes="Arena fina para mortero",
            )
        )

        return self.results

    def calculate_radier(
        self, largo: float, ancho: float, espesor_cm: float = 10
    ) -> List[Material]:
        """
        Calcula materiales para radier

        Args:
            largo: Largo en metros
            ancho: Ancho en metros
            espesor_cm: Espesor del radier en cm (default 10cm)

        Returns:
            Lista de materiales
        """
        area = largo * ancho
        volumen_m3 = area * (espesor_cm / 100)
        self.results = []

        # Hormigón (calcular componentes)
        rendimiento = self.RENDIMIENTOS["hormigon_fundacion"]

        # Cemento
        cemento_kg = volumen_m3 * rendimiento["cemento_kg_por_m3"]
        cemento_kg *= 1 + self.MERMAS["cemento"] / 100
        sacos_cemento = math.ceil(cemento_kg / 42.5)
        self.results.append(
            Material(
                name="Cemento",
                quantity=sacos_cemento,
                unit="sacos 42.5kg",
                category="materiales básicos",
                merma_percentage=self.MERMAS["cemento"],
                notes=f"Para {volumen_m3:.2f} m³ de hormigón",
            )
        )

        # Arena
        arena_m3 = volumen_m3 * rendimiento["arena_m3_por_m3"]
        arena_m3 *= 1 + self.MERMAS["arena"] / 100
        self.results.append(
            Material(
                name="Arena",
                quantity=round(arena_m3, 2),
                unit="m³",
                category="áridos",
                merma_percentage=self.MERMAS["arena"],
            )
        )

        # Ripio
        ripio_m3 = volumen_m3 * rendimiento["ripio_m3_por_m3"]
        ripio_m3 *= 1 + self.MERMAS["ripio"] / 100
        self.results.append(
            Material(
                name="Ripio",
                quantity=round(ripio_m3, 2),
                unit="m³",
                category="áridos",
                merma_percentage=self.MERMAS["ripio"],
            )
        )

        # Malla Acma
        malla_kg = area * self.RENDIMIENTOS["radier_10cm"]["malla_acma_kg_por_m2"]
        malla_kg *= 1 + self.MERMAS["fierro"] / 100
        self.results.append(
            Material(
                name="Malla Acma C-188",
                quantity=round(malla_kg, 1),
                unit="kg",
                category="fierro",
                merma_percentage=self.MERMAS["fierro"],
            )
        )

        # Polietileno
        polietileno_m2 = area * self.RENDIMIENTOS["radier_10cm"]["polietileno_m2_por_m2"]
        self.results.append(
            Material(
                name="Polietileno 0.2mm",
                quantity=round(polietileno_m2, 1),
                unit="m²",
                category="impermeabilizantes",
                notes="Incluye traslapes",
            )
        )

        return self.results

    def calculate_losa(self, largo: float, ancho: float, espesor_cm: float = 15) -> List[Material]:
        """
        Calcula materiales para losa de hormigón armado

        Args:
            largo: Largo en metros
            ancho: Ancho en metros
            espesor_cm: Espesor de la losa en cm (default 15cm)

        Returns:
            Lista de materiales
        """
        area = largo * ancho
        volumen_m3 = area * (espesor_cm / 100)
        self.results = []

        rendimiento = self.RENDIMIENTOS["hormigon_losa"]

        # Cemento
        cemento_kg = volumen_m3 * rendimiento["cemento_kg_por_m3"]
        cemento_kg *= 1 + self.MERMAS["cemento"] / 100
        sacos_cemento = math.ceil(cemento_kg / 42.5)
        self.results.append(
            Material(
                name="Cemento",
                quantity=sacos_cemento,
                unit="sacos 42.5kg",
                category="materiales básicos",
                merma_percentage=self.MERMAS["cemento"],
                notes=f"Hormigón H20 - {volumen_m3:.2f} m³",
            )
        )

        # Arena
        arena_m3 = volumen_m3 * rendimiento["arena_m3_por_m3"]
        arena_m3 *= 1 + self.MERMAS["arena"] / 100
        self.results.append(
            Material(
                name="Arena",
                quantity=round(arena_m3, 2),
                unit="m³",
                category="áridos",
                merma_percentage=self.MERMAS["arena"],
            )
        )

        # Ripio
        ripio_m3 = volumen_m3 * rendimiento["ripio_m3_por_m3"]
        ripio_m3 *= 1 + self.MERMAS["ripio"] / 100
        self.results.append(
            Material(
                name="Ripio",
                quantity=round(ripio_m3, 2),
                unit="m³",
                category="áridos",
                merma_percentage=self.MERMAS["ripio"],
            )
        )

        # Fierro (estimación aproximada - 100 kg/m³ para losa estándar)
        fierro_kg = volumen_m3 * 100
        fierro_kg *= 1 + self.MERMAS["fierro"] / 100
        self.results.append(
            Material(
                name="Fierro A630-420H (varios diámetros)",
                quantity=round(fierro_kg, 1),
                unit="kg",
                category="fierro",
                merma_percentage=self.MERMAS["fierro"],
                notes="Estimación - requiere cálculo estructural según NCh430",
            )
        )

        return self.results

    def calculate_pintura(self, area: float, tipo: str = "latex", manos: int = 2) -> List[Material]:
        """
        Calcula pintura necesaria

        Args:
            area: Área a pintar en m²
            tipo: 'latex' u 'oleo'
            manos: Número de manos (default 2)

        Returns:
            Lista de materiales
        """
        self.results = []

        rendimiento_key = f"pintura_{tipo}"
        if rendimiento_key not in self.RENDIMIENTOS:
            logger.warning(f"Tipo de pintura '{tipo}' no reconocido, usando 'latex'")
            rendimiento_key = "pintura_latex"

        rendimiento = self.RENDIMIENTOS[rendimiento_key]
        litros = area * rendimiento["litros_por_m2"] * (manos / rendimiento["manos"])
        litros *= 1 + self.MERMAS["pintura"] / 100

        galones = math.ceil(litros / 4)  # Galón = 4 litros aprox

        self.results.append(
            Material(
                name=f"Pintura {tipo.capitalize()}",
                quantity=galones,
                unit="galones (4L)",
                category="pintura",
                merma_percentage=self.MERMAS["pintura"],
                notes=f"{manos} manos - {litros:.1f} litros aprox",
            )
        )

        return self.results

    def format_results_text(self) -> str:
        """Formatea los resultados en texto legible"""
        if not self.results:
            return "No hay materiales calculados"

        output = "📋 LISTA DE MATERIALES:\n\n"

        # Agrupar por categoría
        by_category = {}
        for material in self.results:
            if material.category not in by_category:
                by_category[material.category] = []
            by_category[material.category].append(material)

        for category, materials in by_category.items():
            output += f"🔹 {category.upper()}\n"
            for mat in materials:
                output += f"  • {mat.name}: {mat.quantity} {mat.unit}\n"
                if mat.notes:
                    output += f"    ℹ️ {mat.notes}\n"
                if mat.merma_percentage > 0:
                    output += f"    (Incluye {mat.merma_percentage}% de merma)\n"
            output += "\n"

        return output


# Funciones helper para uso directo
def calcular_muro(largo: float, alto: float, tipo: str = "princesa") -> str:
    """Wrapper simple para calcular muro"""
    calc = MaterialsCalculator()
    calc.calculate_muro(largo, alto, tipo)
    return calc.format_results_text()


def calcular_radier(largo: float, ancho: float, espesor: float = 10) -> str:
    """Wrapper simple para calcular radier"""
    calc = MaterialsCalculator()
    calc.calculate_radier(largo, ancho, espesor)
    return calc.format_results_text()


if __name__ == "__main__":
    # Testing
    print("=== TEST: Muro 10m x 2.4m ===")
    print(calcular_muro(10, 2.4, "princesa"))

    print("\n=== TEST: Radier 4m x 3m ===")
    print(calcular_radier(4, 3))

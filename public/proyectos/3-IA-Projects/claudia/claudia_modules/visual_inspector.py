# claudia_modules/visual_inspector.py
"""
Inspector Virtual de Obras
Usa Gemini Vision para analizar fotos de construcción
Detecta problemas, valida avances y sugiere correcciones
"""

import base64
import io
import logging
from dataclasses import dataclass
from typing import Dict, List, Optional

import google.generativeai as genai
from PIL import Image

logger = logging.getLogger(__name__)


@dataclass
class InspectionResult:
    """Resultado de inspección de una imagen"""

    status: str  # "ok", "warning", "critical"
    summary: str
    issues_found: List[str]
    recommendations: List[str]
    compliance_nch: Dict[str, bool]  # Cumplimiento normativas
    confidence: float  # 0-1


class VisualInspector:
    """Inspector virtual usando Gemini Vision"""

    INSPECTION_PROMPTS = {
        "general": """
        Eres un INSPECTOR DE OBRAS EXPERTO con conocimiento de normativas chilenas (NCh).
        Analiza esta imagen de construcción y proporciona un informe detallado.

        EVALÚA:
        1. **Calidad de ejecución**: Terminaciones, prolijidad, alineación
        2. **Problemas visibles**: Fisuras, desniveles, humedad, defectos
        3. **Seguridad**: Riesgos evidentes, falta de protecciones
        4. **Cumplimiento normativo**: NCh básicas según corresponda

        RESPONDE EN FORMATO JSON:
        {
            "status": "ok" | "warning" | "critical",
            "resumen": "Descripción general de lo observado",
            "problemas": ["problema1", "problema2", ...],
            "recomendaciones": ["recomendación1", "recomendación2", ...],
            "cumplimiento_nch": {
                "NCh433_sismica": true/false (si aplica),
                "NCh430_hormigon": true/false (si aplica),
                "calidad_general": true/false
            },
            "confianza": 0.0-1.0
        }

        Si no puedes determinar algo, indícalo. Sé específico y profesional.
        """,
        "albañileria": """
        Eres un MAESTRO ALBAÑIL EXPERTO. Analiza esta imagen de trabajo de albañilería.

        REVISA:
        - Hiladas: ¿Están niveladas y aplomadas?
        - Juntas: ¿Espesor uniforme (1-1.5cm)?
        - Trabas: ¿Correcta disposición de ladrillos/bloques?
        - Mortero: ¿Aplicación correcta, sin rebabas excesivas?
        - Fisuras o grietas visibles
        - Humedad o eflorescencia

        Responde en JSON con el formato estándar de inspección.
        """,
        "hormigon": """
        Eres un INSPECTOR DE HORMIGÓN certificado según NCh430.

        ANALIZA:
        - Superficie: ¿Lisa, sin cangrejeras o nidos de piedra?
        - Color: ¿Uniforme? (gris parejo indica buen curado)
        - Fisuras: ¿Presencia de grietas? ¿Patrón?
        - Segregación: ¿Separación de agregados?
        - Armaduras: ¿Fierros expuestos? (CRÍTICO)
        - Curado: ¿Señales de curado adecuado?

        Evalúa cumplimiento de NCh430 (Diseño Hormigón Armado).
        Responde en JSON.
        """,
        "terminaciones": """
        Eres un INSPECTOR DE TERMINACIONES experto.

        EVALÚA:
        - Pintura: Uniformidad, manchas, descolgues
        - Revestimientos: Alineación, juntas, piezas sueltas
        - Cerámicas: Nivelación, fragüe, quiebres
        - Estuco: Fisuras, desprendimientos, rugosidad
        - Carpintería: Instalación, nivel, sellado

        Responde en JSON con observaciones detalladas.
        """,
        "instalaciones": """
        Eres un INSPECTOR DE INSTALACIONES (eléctricas y sanitarias).

        BUSCA:
        - Tuberías: Fijación, pendientes (si visibles)
        - Cables: Canalizaciones, protecciones
        - Cajas: Correcta instalación, profundidad
        - Empalmes: ¿Visibles? (NO deberían estarlo)
        - Filtraciones: Manchas de humedad cerca de instalaciones

        Evalúa según normativa eléctrica (NCh Elec 4/2003) si aplica.
        Responde en JSON.
        """,
    }

    def __init__(self, api_key: str):
        """
        Inicializa el inspector visual

        Args:
            api_key: API key de Google Gemini
        """
        if not api_key:
            raise ValueError("API key de Gemini es requerida")

        genai.configure(api_key=api_key)
        # Usar modelo con capacidades de visión
        self.model = genai.GenerativeModel("gemini-1.5-flash")
        logger.info("Visual Inspector inicializado con Gemini Vision")

    def inspect_image(
        self, image_data: bytes, inspection_type: str = "general", additional_context: str = ""
    ) -> InspectionResult:
        """
        Inspecciona una imagen de obra

        Args:
            image_data: Bytes de la imagen
            inspection_type: Tipo de inspección ('general', 'albañileria', 'hormigon', etc.)
            additional_context: Contexto adicional para el análisis

        Returns:
            Resultado de la inspección
        """
        try:
            # Cargar imagen
            image = Image.open(io.BytesIO(image_data))

            # Obtener prompt según tipo
            prompt = self.INSPECTION_PROMPTS.get(
                inspection_type, self.INSPECTION_PROMPTS["general"]
            )

            if additional_context:
                prompt += f"\n\nCONTEXTO ADICIONAL: {additional_context}"

            # Generar análisis con Gemini Vision
            response = self.model.generate_content([prompt, image])

            # Parsear respuesta JSON
            result_text = response.text.strip()
            # Limpiar markdown si viene con ```json
            result_text = result_text.replace("```json", "").replace("```", "").strip()

            import json

            result_json = json.loads(result_text)

            # Crear objeto resultado
            inspection = InspectionResult(
                status=result_json.get("status", "warning"),
                summary=result_json.get("resumen", "Sin resumen disponible"),
                issues_found=result_json.get("problemas", []),
                recommendations=result_json.get("recomendaciones", []),
                compliance_nch=result_json.get("cumplimiento_nch", {}),
                confidence=result_json.get("confianza", 0.7),
            )

            logger.info(
                f"Inspección completada: {inspection.status} - {len(inspection.issues_found)} problemas"
            )
            return inspection

        except Exception as e:
            logger.error(f"Error en inspección visual: {e}", exc_info=True)
            # Retornar resultado de error
            return InspectionResult(
                status="error",
                summary=f"Error al procesar imagen: {str(e)}",
                issues_found=["No se pudo analizar la imagen"],
                recommendations=["Intenta con otra foto más clara"],
                compliance_nch={},
                confidence=0.0,
            )

    def inspect_image_from_url(
        self, image_url: str, inspection_type: str = "general", additional_context: str = ""
    ) -> InspectionResult:
        """
        Inspecciona una imagen desde URL

        Args:
            image_url: URL de la imagen
            inspection_type: Tipo de inspección
            additional_context: Contexto adicional

        Returns:
            Resultado de inspección
        """
        try:
            import requests

            response = requests.get(image_url, timeout=10)
            response.raise_for_status()
            return self.inspect_image(response.content, inspection_type, additional_context)
        except Exception as e:
            logger.error(f"Error descargando imagen: {e}")
            return InspectionResult(
                status="error",
                summary=f"No se pudo descargar la imagen: {str(e)}",
                issues_found=["URL inaccesible"],
                recommendations=["Verifica la URL o sube la imagen directamente"],
                compliance_nch={},
                confidence=0.0,
            )

    def format_inspection_report(self, result: InspectionResult, maestro_name: str = "") -> str:
        """
        Formatea el resultado de inspección en texto legible

        Args:
            result: Resultado de la inspección
            maestro_name: Nombre del maestro (opcional)

        Returns:
            Reporte formateado
        """
        # Emoji según status
        status_emoji = {"ok": "✅", "warning": "⚠️", "critical": "🚨", "error": "❌"}

        emoji = status_emoji.get(result.status, "❓")

        report = f"{emoji} **REPORTE DE INSPECCIÓN**\n\n"

        if maestro_name:
            report += f"👷 Maestro: {maestro_name}\n\n"

        report += f"**Estado:** {result.status.upper()}\n\n"
        report += f"**Resumen:**\n{result.summary}\n\n"

        if result.issues_found:
            report += "**🔍 Problemas Detectados:**\n"
            for i, issue in enumerate(result.issues_found, 1):
                report += f"{i}. {issue}\n"
            report += "\n"

        if result.recommendations:
            report += "**💡 Recomendaciones:**\n"
            for i, rec in enumerate(result.recommendations, 1):
                report += f"{i}. {rec}\n"
            report += "\n"

        if result.compliance_nch:
            report += "**📋 Cumplimiento Normativo:**\n"
            for norm, compliant in result.compliance_nch.items():
                check = "✓" if compliant else "✗"
                report += f"  {check} {norm}\n"
            report += "\n"

        report += f"*Confianza del análisis: {result.confidence * 100:.0f}%*\n"

        return report


# Función helper para uso rápido
def inspect_construction_photo(
    image_data: bytes, api_key: str, tipo: str = "general", contexto: str = ""
) -> str:
    """
    Función rápida para inspeccionar una foto de construcción

    Args:
        image_data: Bytes de la imagen
        api_key: API key de Gemini
        tipo: Tipo de inspección
        contexto: Contexto adicional

    Returns:
        Reporte de inspección en texto
    """
    inspector = VisualInspector(api_key)
    result = inspector.inspect_image(image_data, tipo, contexto)
    return inspector.format_inspection_report(result)


if __name__ == "__main__":
    # Testing (requiere API key y una imagen de prueba)
    import os

    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        print("🔍 Inspector Visual - Test Mode")
        print("Para probar, necesitas una imagen de construcción")
    else:
        print("❌ GEMINI_API_KEY no configurada")

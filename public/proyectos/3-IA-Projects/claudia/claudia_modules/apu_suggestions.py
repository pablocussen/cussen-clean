# claudia_modules/apu_suggestions.py
"""
Módulo para sugerir APUs inteligentemente usando Gemini.
Resuelve el problema de Pablo: cuando el usuario crea un proyecto como
"Remodelación baño", automáticamente sugiere 15-25 APUs relevantes.
"""

import json
import logging
from typing import Any, Dict, List, Optional

import google.generativeai as genai
from google.cloud import firestore

from claudia_modules import config

logger = logging.getLogger(__name__)

# --- Clientes y Conexiones ---
try:
    DB = firestore.Client(project="claudia-i8bxh")
    logger.info("Cliente de Firestore inicializado para apu_suggestions.")
except Exception as e:
    logger.critical(f"Error CRÍTICO inicializando Firestore en apu_suggestions: {e}", exc_info=True)
    DB = None

# --- Inicialización del Modelo de IA ---
try:
    if not config.GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY no configurada. Las sugerencias IA no funcionarán.")
        GEMINI_MODEL = None
    else:
        genai.configure(api_key=config.GEMINI_API_KEY)
        GEMINI_MODEL = genai.GenerativeModel("gemini-1.5-flash-latest")
        logger.info("Modelo Gemini configurado para apu_suggestions.")
except Exception as e:
    logger.error(f"Error configurando Gemini en apu_suggestions: {e}", exc_info=True)
    GEMINI_MODEL = None


def get_all_apus() -> List[Dict[str, Any]]:
    """Obtiene todos los APUs de Firestore.

    Returns:
        Lista de APUs con estructura: {nombre, categoria, unidad, precio_ref}
    """
    if not DB:
        logger.error("No se pueden obtener APUs: Firestore no disponible")
        return []

    try:
        apus_ref = DB.collection("apus").limit(816).stream()
        apus = []
        for doc in apus_ref:
            data = doc.to_dict()
            apus.append({
                "id": doc.id,
                "nombre": data.get("nombre", ""),
                "categoria": data.get("categoria", ""),
                "unidad": data.get("unidad", "un"),
                "precio_ref": data.get("precio_unitario", 0)
            })
        logger.info(f"APUs cargados: {len(apus)}")
        return apus
    except Exception as e:
        logger.error(f"Error obteniendo APUs de Firestore: {e}", exc_info=True)
        return []


def suggest_apus_for_project(
    project_name: str,
    project_description: str = "",
    surface_area: Optional[float] = None
) -> Dict[str, Any]:
    """Sugiere APUs inteligentemente para un proyecto usando Gemini.

    Args:
        project_name: Nombre del proyecto (ej: "Remodelación baño")
        project_description: Descripción adicional opcional
        surface_area: Superficie en m² (opcional)

    Returns:
        Dict con:
            - success: bool
            - suggestions: List[Dict] con APUs sugeridos + cantidades estimadas
            - total_estimated: float precio total estimado
            - confidence: str nivel de confianza (high/medium/low)
    """
    if not GEMINI_MODEL or not DB:
        logger.error("Gemini o Firestore no disponibles para sugerencias")
        return {
            "success": False,
            "error": "Servicio de sugerencias no disponible",
            "suggestions": [],
            "total_estimated": 0,
            "confidence": "none"
        }

    # Cargar todos los APUs disponibles
    all_apus = get_all_apus()
    if not all_apus:
        return {
            "success": False,
            "error": "No se pudieron cargar APUs de la base de datos",
            "suggestions": [],
            "total_estimated": 0,
            "confidence": "none"
        }

    # Crear lista resumida de APUs para el prompt (solo categorías únicas)
    apus_by_category = {}
    for apu in all_apus:
        cat = apu["categoria"]
        if cat not in apus_by_category:
            apus_by_category[cat] = []
        apus_by_category[cat].append(apu["nombre"])

    # Formatear para el prompt
    apus_summary = "\n".join([
        f"**{cat}**: {', '.join(items[:5])}..." if len(items) > 5 else f"**{cat}**: {', '.join(items)}"
        for cat, items in list(apus_by_category.items())[:30]  # Primeras 30 categorías
    ])

    surface_info = f"\nSuperficie del proyecto: {surface_area} m²" if surface_area else ""
    desc_info = f"\nDescripción: {project_description}" if project_description else ""

    prompt = f"""
Eres CLAUDIA, experta en presupuestos de construcción chilenos.

Un maestro constructor está creando un proyecto llamado: **"{project_name}"**{desc_info}{surface_info}

Tu tarea es sugerir entre 15-25 APUs (Actividades de Precio Unitario) relevantes con cantidades estimadas conservadoras.

**APUs disponibles por categoría:**
{apus_summary}

**INSTRUCCIONES:**
1. Analiza el tipo de proyecto (baño, cocina, ampliación, casa, etc.)
2. Sugiere APUs RELEVANTES y COMPLETOS para ese proyecto
3. Para cada APU sugiere una **cantidad conservadora estimada**
4. Incluye partidas OBVIAS que un maestro podría olvidar (demoliciones, instalaciones, terminaciones)
5. Ordena por flujo lógico de construcción (excavación → fundaciones → estructura → terminaciones)
6. Usa nombres EXACTOS de los APUs disponibles arriba

**FORMATO DE RESPUESTA (JSON):**
```json
{{
    "project_type": "tipo detectado (baño/cocina/casa/ampliación/otro)",
    "confidence": "high/medium/low",
    "suggestions": [
        {{
            "apu_nombre": "Nombre exacto del APU",
            "categoria": "Categoría del APU",
            "cantidad_estimada": 10.5,
            "unidad": "m2",
            "justificacion": "Por qué este APU es necesario (1 línea)"
        }},
        ...
    ],
    "warnings": [
        "Advertencias o consideraciones importantes"
    ]
}}
```

**IMPORTANTE:**
- NO inventes nombres de APUs, usa SOLO los listados arriba
- Cantidades conservadoras (mejor quedarse corto que pasarse)
- Incluye TODO lo necesario (demoliciones, instalaciones, terminaciones, limpieza)
- Ordena por secuencia lógica de construcción

RESPONDE SOLO EN JSON VÁLIDO.
"""

    try:
        logger.info(f"Generando sugerencias IA para: {project_name}")
        response = GEMINI_MODEL.generate_content(prompt)
        cleaned_response = response.text.strip().replace("```json", "").replace("```", "")

        ai_result = json.loads(cleaned_response)

        # Validar y enriquecer sugerencias con precios reales
        suggestions = []
        total_estimated = 0

        for sugg in ai_result.get("suggestions", []):
            apu_name = sugg.get("apu_nombre", "")

            # Buscar APU en la base de datos
            matching_apu = next((a for a in all_apus if a["nombre"].lower() == apu_name.lower()), None)

            if matching_apu:
                cantidad = float(sugg.get("cantidad_estimada", 1))
                precio_unit = float(matching_apu["precio_ref"])
                subtotal = cantidad * precio_unit

                suggestions.append({
                    "apu_id": matching_apu["id"],
                    "nombre": matching_apu["nombre"],
                    "categoria": matching_apu["categoria"],
                    "unidad": matching_apu["unidad"],
                    "cantidad_estimada": cantidad,
                    "precio_unitario": precio_unit,
                    "subtotal": subtotal,
                    "justificacion": sugg.get("justificacion", ""),
                    "confidence": ai_result.get("confidence", "medium")
                })
                total_estimated += subtotal

        logger.info(f"Sugerencias generadas: {len(suggestions)} APUs, total ${total_estimated:,.0f}")

        return {
            "success": True,
            "project_type": ai_result.get("project_type", "desconocido"),
            "confidence": ai_result.get("confidence", "medium"),
            "suggestions": suggestions,
            "total_estimated": total_estimated,
            "warnings": ai_result.get("warnings", []),
            "count": len(suggestions)
        }

    except json.JSONDecodeError as e:
        logger.error(f"Error parseando JSON de Gemini: {e}\nRespuesta: {response.text}")
        return {
            "success": False,
            "error": "Error procesando respuesta de IA",
            "suggestions": [],
            "total_estimated": 0,
            "confidence": "none"
        }
    except Exception as e:
        logger.error(f"Error generando sugerencias IA: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "suggestions": [],
            "total_estimated": 0,
            "confidence": "none"
        }


# Función de prueba rápida
if __name__ == "__main__":
    # Test
    logging.basicConfig(level=logging.INFO)
    result = suggest_apus_for_project(
        project_name="Remodelación baño 6m²",
        project_description="Baño completo con ducha",
        surface_area=6.0
    )
    print(json.dumps(result, indent=2, ensure_ascii=False))

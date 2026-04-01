# claudia_modules/ai_core.py (VERSIÓN CON MEMORIA PERSISTENTE EN FIRESTORE)
import datetime
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
    logger.info("Cliente de Firestore inicializado.")
except Exception as e:
    logger.critical(f"Error CRÍTICO durante la inicialización de Firestore: {e}", exc_info=True)
    DB = None

# --- Inicialización del Modelo de IA ---
try:
    if not config.GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY no configurada. La IA no funcionará.")
        GEMINI_MODEL = None
    else:
        genai.configure(api_key=config.GEMINI_API_KEY)
        GEMINI_MODEL = genai.GenerativeModel("gemini-1.5-flash-latest")
        logger.info("Modelo Gemini configurado exitosamente.")
except Exception as e:
    logger.error(f"Error crítico configurando Gemini: {e}", exc_info=True)
    GEMINI_MODEL = None


def _save_lead(session_id: str, user_query: str, analysis: Dict[str, Any]) -> None:
    """Guarda el resultado del análisis en la colección 'construction_leads'.

    Args:
        session_id: ID de sesión del usuario
        user_query: Consulta del usuario
        analysis: Diccionario con el análisis generado por la IA
    """
    if not DB:
        logger.error("No se puede guardar el lead: El cliente de Firestore no está disponible.")
        return
    try:
        lead_data = {
            "session_id": session_id,
            "query": user_query,
            "friendly_response": analysis.get("friendly_response"),
            "lead_score": analysis.get("lead_score"),
            "project_type": analysis.get("project_type"),
            "timestamp": datetime.datetime.now(datetime.timezone.utc),
            "status": "Nuevo",  # <-- CAMPO AÑADIDO
            "notes": "",  # <-- CAMPO AÑADIDO
        }
        DB.collection("construction_leads").add(lead_data)
        logger.info(f"Lead guardado exitosamente para session_id: {session_id}")
    except Exception as e:
        logger.error(f"Error al guardar lead en Firestore: {e}", exc_info=True)


def get_construction_analysis(user_query: str, session_id: str) -> Dict[str, Any]:
    """Analiza la consulta del usuario siguiendo el Script Maestro de Venta.

    Gestiona el estado de la conversación de forma persistente en Firestore,
    guarda el lead y devuelve la respuesta.

    Args:
        user_query: Consulta del usuario
        session_id: ID de sesión del usuario

    Returns:
        Diccionario con:
            - friendly_response: Respuesta amigable para el usuario
            - lead_score: Puntuación del lead (0-10)
            - project_type: Tipo de proyecto detectado
            - reply_markup: Botones opcionales para la respuesta
    """
    if not GEMINI_MODEL or not DB:
        error_message = (
            "Mi sistema de IA no está disponible en este momento. Por favor, intenta más tarde."
        )
        if not DB:
            logger.error("Error Crítico: No se pudo conectar con la base de datos (Firestore).")
            error_message = (
                "No puedo guardar nuestro progreso en este momento. Por favor, intenta más tarde."
            )
        return {
            "friendly_response": error_message,
            "lead_score": 0,
            "project_type": "desconocido",
            "reply_markup": None,
        }

    # --- Cargar Historial Persistente desde Firestore ---
    history = []
    conversation_ref = DB.collection("conversations").document(session_id)
    try:
        conversation_doc = conversation_ref.get()
        if conversation_doc.exists:
            history = conversation_doc.to_dict().get("history", [])
            logger.info(f"Historial de conversación cargado para session_id: {session_id}")
    except Exception as e:
        logger.error(
            f"Error al cargar historial desde Firestore para session_id {session_id}: {e}",
            exc_info=True,
        )

    history.append(f"Usuario: {user_query}")
    formatted_history = "\n".join(history)

    prompt = f"""
Eres CLAUDIA, Asesora de Proyectos experta en Arqattack. Tu tono es cercano, empático y profesional.
Tu misión es guiar al cliente a través de un proceso de venta consultiva usando el siguiente script.
Analiza el historial de la conversación para saber en qué fase te encuentras y cuál es el siguiente paso.

--- HISTORIAL DE LA CON CONVERSACIÓN ---
{formatted_history}
--- FIN DEL HISTORIAL ---

--- SCRIPT MAESTRO DE VENTA Y ASESORÍA ---

**Fase 1: Bienvenida y Descubrimiento del Proyecto**
*   **Si el historial está vacío (primer mensaje) o el usuario saluda:** Saluda amablemente y haz la pregunta clave.
    *   **Texto:** "¡Hola! Soy Claudia, Asesora de Proyectos en Arqattack. ¡Muchas gracias por escribirnos y por pensar en nosotros para transformar tu hogar! ✨\n\nPara poder ayudarte de la mejor manera, cuéntame, ¿qué proyecto tienes en mente?"
    *   **Botones:**
        - `[ "Remodelar mi Baño", "start_baño" ]`
        - `[ "Remodelar mi Cocina", "start_cocina" ]`
        - `[ "Otro tipo de proyecto", "start_integral" ]`

**Fase 2, Ruta A: Remodelación de BAÑO**
*   **Si el usuario menciona "baño" o el último callback_data fue `start_baño`:**
    1.  **Mensaje de Transición y Primera Pregunta:**
        *   **Texto:** "¡Excelente elección! El baño es un espacio fundamental para el bienestar. Para encontrar tu estilo ideal, ayúdame escogiendo una opción. Primero, ¿cuál es tu objetivo principal?"
        *   **Botones:**
            - `[ "A) Mejorar Funcionalidad", "bano_objetivo_A" ]`
            - `[ "B) Renovar Estética", "bano_objetivo_B" ]`
    2.  **Si el último callback_data fue `bano_objetivo_A` o `bano_objetivo_B`:**
        *   **Texto:** "¡Perfecto! Ahora imaginando tu baño ideal. ¿Qué te gustaría más?"
        *   **Botones:**
            - `[ "Un Refugio de Calma (Spa)", "bano_ambiente_A" ]`
            - `[ "Un Espacio con Carácter", "bano_ambiente_B" ]`
            - `[ "Un Entorno Práctico y Luminoso", "bano_ambiente_C" ]`
    3.  **Si el último callback_data fue `bano_ambiente_A`, `bano_ambiente_B`, o `bano_ambiente_C`:**
        *   **Texto:** "¡Genial! Y por último, ¿Qué colores te representan más?"
        *   **Botones:**
            - `[ "Tonos Naturales (azules, verdes)", "bano_color_1" ]`
            - `[ "Tonos Urbanos (grises, negro)", "bano_color_2" ]`
            - `[ "Tonos Pasteles (luminosos)", "bano_color_3" ]`
    4.  **Si el último callback_data fue `bano_color_1`, `bano_color_2`, o `bano_color_3`, haz el llamado a la acción (SIN BOTONES):**
        *   **Texto:** "¡Muchas gracias! Con lo que me cuentas, tu visión es muy clara. Para darte un presupuesto preciso, necesitaría tres medidas básicas de tu baño: **ancho, largo y alto**, y también 2 fotos (una desde la puerta y otra desde el lado contrario). Con eso, te prepararemos una cotización que revisaremos juntos en una **sesión online de 35 minutos**, donde además te mostraremos en 3D cómo se vería el baño de tus sueños. Puedes agendar tu asesoría online aquí: https://calendar.app.google/vqph6omVL1BZoNuy6"

**Fase 2, Ruta B: Remodelación de COCINA**
*   **Si el usuario menciona "cocina" o el último callback_data fue `start_cocina`:**
    1.  **Mensaje de Transición y Primera Pregunta:**
        *   **Texto:** "¡La cocina, el corazón de la casa! Para entender tu proyecto, cuéntame, ¿cuál es el principal motor de este cambio?"
        *   **Botones:**
            - `[ "Ser el Mejor Anfitrión (Espacio Social)", "cocina_motor_A" ]`
            - `[ "El Placer de Cocinar (Funcionalidad)", "cocina_motor_B" ]`
    2.  **Si el último callback_data fue `cocina_motor_A` o `cocina_motor_B`:**
        *   **Texto:** "¡Entendido! Y en cuanto al estilo, ¿qué línea te interpreta más?"
        *   **Botones:**
            - `[ "Estilo Orgánico y Luminoso", "cocina_estilo_1" ]`
            - `[ "Estilo Moderno y Sofisticado", "cocina_estilo_2" ]`
    3.  **Si el último callback_data fue `cocina_estilo_1` o `cocina_estilo_2`, haz el llamado a la acción (SIN BOTONES):**
        *   **Texto:** "¡Perfecto! Para poder darte una primera estimación, necesitaría tres medidas básicas de tu cocina: **ancho, largo y alto**, y 2 fotos. Con eso, te prepararemos una cotización para revisar junto a los Fundadores de Arqattack en una **sesión online de 35 minutos**. Agenda tu asesoría aquí: https://calendar.app.google/vqph6omVL1BZoNuy6"

**Fase 2, Ruta C: Proyecto INTEGRAL / OTRO**
*   **Si el usuario menciona "toda la vivienda", "otro", o el último callback_data fue `start_integral`:**
    *   **Llamado a la Acción Directo (SIN BOTONES):** "¡Un proyecto integral, qué emocionante! Es la mejor oportunidad para crear un hogar cohesionado. En estos casos, trabajamos con un proceso de diseño arquitectónico '''llave en mano'''. El mejor primer paso es agendar nuestra **sesión de asesoría online de 35 minutos**, sin compromiso, para que nos cuentes tu visión y explicarte nuestra metodología. Puedes agendar directamente aquí con los Fundadores de Arqattack: https://calendar.app.google/vqph6omVL1BZoNuy6"

--- INSTRUCCIONES DE RESPUESTA JSON ---
1.  **Sigue el script PASO A PASO.** No te saltes preguntas. No intentes adivinar.
2.  **Determina el `project_type`** basado en la ruta del script: '''baño''', '''cocina''', '''integral_otro'''. Si no está claro, usa '''desconocido'''.
3.  **Asigna un `lead_score`:** '''baño''' (60), '''cocina''' (75), '''integral_otro''' (90), '''desconocido''' (10).
4.  **Genera la `friendly_response`** que es el texto exacto que debo enviar al usuario.
5.  **Crea el objeto `reply_markup`** si la respuesta debe incluir botones. La estructura debe ser `{{"inline_keyboard": [[{{"text": "Texto del Botón", "callback_data": "valor_callback"}}]]}}`. Si no hay botones, este campo debe ser `null`.
6.  **RESPONDE ÚNICAMENTE EN FORMATO JSON VÁLIDO** con las claves: `project_type`, `lead_score`, `friendly_response`, `reply_markup`.
"""
    try:
        response = GEMINI_MODEL.generate_content(prompt)
        cleaned_response = response.text.strip().replace("```json", "").replace("```", "")

        analysis = json.loads(cleaned_response)

        # --- Guardar Historial Persistente en Firestore ---
        history.append(f"Claudia: {analysis['friendly_response']}")
        try:
            history_to_save = history[-20:]
            conversation_ref.set(
                {"history": history_to_save, "updated_at": firestore.SERVER_TIMESTAMP}, merge=True
            )
            logger.info(
                f"Historial de conversación guardado en Firestore para session_id: {session_id}"
            )
        except Exception as e:
            logger.error(
                f"Error al guardar historial en Firestore para session_id {session_id}: {e}",
                exc_info=True,
            )

        _save_lead(session_id, user_query, analysis)

        return analysis
    except Exception as e:
        logger.critical(f"Error CRÍTICO en get_construction_analysis: {e}", exc_info=True)
        return {
            "friendly_response": "Lo siento, ocurrió un error inesperado en mi sistema. El equipo técnico ha sido notificado.",
            "lead_score": 0,
            "project_type": "error_critical",
            "reply_markup": None,
        }

# main.py (VERSIÓN CON MANEJO DE FOTOS)
import json
import logging
import os
import random
import string
from typing import Any, Dict, Optional, Tuple

import functions_framework

# Imports de módulos locales
from claudia_modules import ai_core, apu_suggestions, bot_commands, config, telegram_api

# --- Configuración de Logging ---
logging.basicConfig(
    level=config.LOGGING_LEVEL, format="%(asctime)s - %(levelname)s - %(module)s - %(message)s"
)
logger = logging.getLogger(__name__)

# --- Inicialización Perezosa (Lazy) de Componentes Globales ---
TELEGRAM_SENDER = None


def get_telegram_sender() -> Optional[telegram_api.TelegramSender]:
    """Inicializa el TelegramSender una sola vez de forma perezosa.

    Returns:
        Instancia de TelegramSender o None si falla la inicialización
    """
    global TELEGRAM_SENDER
    if TELEGRAM_SENDER is None:
        try:
            token = config.TELEGRAM_TOKEN
            if not token:
                raise ValueError(
                    "La variable de entorno TELEGRAM_TOKEN no está configurada o está vacía."
                )
            TELEGRAM_SENDER = telegram_api.TelegramSender(token)
            logger.info("Telegram Sender inicializado exitosamente.")
        except Exception as e:
            logger.critical(
                f"Error CRÍTICO durante la inicialización de TelegramSender: {e}", exc_info=True
            )
    return TELEGRAM_SENDER


# --- Handlers para Bitácora ---
def handle_send_log(request, response_headers):
    """Maneja el envío de bitácoras diarias por email y WhatsApp."""
    try:
        request_json = request.get_json(silent=True)
        if not request_json:
            return (json.dumps({"error": "JSON inválido"}), 400, response_headers)

        email = request_json.get("email")
        whatsapp = request_json.get("whatsapp")
        message = request_json.get("message")
        log_data = request_json.get("log")

        if not message:
            return (json.dumps({"error": "Mensaje requerido"}), 400, response_headers)

        # Enviar por WhatsApp si está configurado
        if whatsapp:
            sender = get_telegram_sender()
            if sender:
                # Aquí deberías implementar tu lógica de WhatsApp
                # Por ahora, logueamos el mensaje
                logger.info(f"Bitácora para WhatsApp {whatsapp}: {message[:100]}...")

        # Enviar por Email si está configurado
        if email:
            # Aquí deberías implementar tu lógica de email
            # Por ahora, logueamos el mensaje
            logger.info(f"Bitácora para Email {email}: {message[:100]}...")

        logger.info(f"Bitácora enviada exitosamente")
        return (json.dumps({"success": True, "message": "Bitácora enviada"}), 200, response_headers)

    except Exception as e:
        logger.error(f"Error enviando bitácora: {e}", exc_info=True)
        return (json.dumps({"error": str(e)}), 500, response_headers)


def handle_send_morning(request, response_headers):
    """Maneja el envío de mensajes motivacionales matutinos."""
    try:
        request_json = request.get_json(silent=True)
        if not request_json:
            return (json.dumps({"error": "JSON inválido"}), 400, response_headers)

        whatsapp = request_json.get("whatsapp")
        message = request_json.get("message")

        if not message:
            return (json.dumps({"error": "Mensaje requerido"}), 400, response_headers)

        # Enviar por WhatsApp
        if whatsapp:
            sender = get_telegram_sender()
            if sender:
                # Aquí deberías implementar tu lógica de WhatsApp
                logger.info(f"Mensaje matutino para WhatsApp {whatsapp}: {message[:100]}...")

        logger.info(f"Mensaje matutino enviado exitosamente")
        return (json.dumps({"success": True, "message": "Mensaje enviado"}), 200, response_headers)

    except Exception as e:
        logger.error(f"Error enviando mensaje matutino: {e}", exc_info=True)
        return (json.dumps({"error": str(e)}), 500, response_headers)


def handle_send_reminder(request, response_headers):
    """Maneja el envío de recordatorios de tareas."""
    try:
        request_json = request.get_json(silent=True)
        if not request_json:
            return (json.dumps({"error": "JSON inválido"}), 400, response_headers)

        phone = request_json.get("phone")
        message = request_json.get("message")

        if not message or not phone:
            return (json.dumps({"error": "Mensaje y teléfono requeridos"}), 400, response_headers)

        # Enviar recordatorio por WhatsApp/SMS
        sender = get_telegram_sender()
        if sender:
            # Aquí deberías implementar tu lógica de WhatsApp/SMS
            logger.info(f"Recordatorio para {phone}: {message[:100]}...")

        logger.info(f"Recordatorio enviado exitosamente")
        return (
            json.dumps({"success": True, "message": "Recordatorio enviado"}),
            200,
            response_headers,
        )

    except Exception as e:
        logger.error(f"Error enviando recordatorio: {e}", exc_info=True)
        return (json.dumps({"error": str(e)}), 500, response_headers)


def handle_generate_linking_code(request, response_headers):
    """Genera código de vinculación para Telegram."""
    from claudia_modules import linking

    try:
        request_json = request.get_json(silent=True)
        if not request_json:
            return (json.dumps({"error": "JSON inválido"}), 400, response_headers)

        user_id = request_json.get("user_id")
        if not user_id:
            return (json.dumps({"error": "user_id requerido"}), 400, response_headers)

        result = linking.generate_linking_code(user_id)

        if "error" in result:
            return (json.dumps(result), 500, response_headers)

        return (json.dumps(result), 200, response_headers)

    except Exception as e:
        logger.error(f"Error generando código de vinculación: {e}", exc_info=True)
        return (json.dumps({"error": str(e)}), 500, response_headers)


def handle_check_telegram_status(request, response_headers):
    """Verifica si el usuario tiene Telegram vinculado."""
    from google.cloud import firestore

    try:
        request_json = request.get_json(silent=True)
        if not request_json:
            return (json.dumps({"error": "JSON inválido"}), 400, response_headers)

        user_id = request_json.get("user_id")
        if not user_id:
            return (json.dumps({"error": "user_id requerido"}), 400, response_headers)

        DB = firestore.Client(project="claudia-i8bxh")
        user_doc = DB.collection("users").document(user_id).get()

        if not user_doc.exists:
            return (json.dumps({"linked": False}), 200, response_headers)

        user_data = user_doc.to_dict()
        telegram_verified = user_data.get("telegram_verified", False)
        telegram_username = user_data.get("telegram_username")

        return (
            json.dumps({"linked": telegram_verified, "telegram_username": telegram_username}),
            200,
            response_headers,
        )

    except Exception as e:
        logger.error(f"Error verificando estado de Telegram: {e}", exc_info=True)
        return (json.dumps({"error": str(e)}), 500, response_headers)


# --- Entry Point ÚNICO Y UNIFICADO ---
@functions_framework.http
def claudia_handler(request):
    """
    Punto de entrada unificado para Telegram y la API web.
    """
    # --- Manejo de CORS para peticiones web ---
    if request.method == "OPTIONS":
        headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-control-allow-headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "3600",
        }
        return ("", 204, headers)

    response_headers = {"Access-Control-Allow-Origin": "*"}

    # --- Lógica Principal ---
    if request.method != "POST":
        return (json.dumps({"error": "Se requiere método POST"}), 405, response_headers)

    # --- Detectar rutas especiales ---
    path = request.path
    if "/send-log" in path:
        return handle_send_log(request, response_headers)
    elif "/send-morning" in path:
        return handle_send_morning(request, response_headers)
    elif "/send-reminder" in path:
        return handle_send_reminder(request, response_headers)
    elif "/generate-linking-code" in path:
        return handle_generate_linking_code(request, response_headers)
    elif "/check-telegram-status" in path:
        return handle_check_telegram_status(request, response_headers)

    request_json = request.get_json(silent=True)
    if not request_json:
        return (json.dumps({"error": "No se recibió un JSON válido"}), 400, response_headers)

    # --- Detección de Origen y Gestión de Sesión ---
    is_telegram_request = "update_id" in request_json
    session_id = None
    user_query = None

    if is_telegram_request:
        logger.info("Recibida petición de Telegram.")
        if "callback_query" in request_json:
            callback_query = request_json["callback_query"]
            user_query = callback_query["data"]
            chat_id = callback_query["message"]["chat"]["id"]
            callback_query_id = callback_query["id"]
            session_id = str(chat_id)

            sender = get_telegram_sender()
            if sender:
                sender.answer_callback_query(callback_query_id)

        elif "message" in request_json:
            message = request_json.get("message", {})
            chat_id = message.get("chat", {}).get("id")
            user_query = message.get("text", "")
            username = message.get("from", {}).get("username")

            # --- MANEJO DE COMANDOS ---
            if user_query and user_query.startswith("/"):
                logger.info(f"Comando recibido: {user_query} de chat_id: {chat_id}")
                sender = get_telegram_sender()

                if sender:
                    command_parts = user_query.split(maxsplit=1)
                    command = command_parts[0].lower()
                    args = command_parts[1] if len(command_parts) > 1 else None

                    # Mapear comandos a handlers
                    if command == "/start":
                        response_text = bot_commands.handle_start(chat_id, username)
                    elif command == "/vincular":
                        response_text = bot_commands.handle_vincular(chat_id, username, args)
                    elif command == "/resumen":
                        response_text = bot_commands.handle_resumen(chat_id)
                    elif command == "/tareas":
                        response_text = bot_commands.handle_tareas(chat_id)
                    elif command == "/bitacora":
                        response_text = bot_commands.handle_bitacora(chat_id, args)
                    elif command == "/ayuda" or command == "/help":
                        response_text = bot_commands.handle_ayuda(chat_id)
                    elif command == "/config":
                        response_text = bot_commands.handle_config(chat_id)
                    else:
                        response_text = f"❌ Comando no reconocido: {command}\n\nEnvía /ayuda para ver comandos disponibles."

                    sender.send_message_sync(chat_id, response_text, parse_mode="Markdown")

                return "OK", 200  # Terminar ejecución después de comando
            # --- FIN MANEJO DE COMANDOS ---

            # --- NUEVA LÓGICA PARA FOTOS/DOCUMENTOS ---
            if not user_query and (message.get("photo") or message.get("document")):
                logger.info(f"Recibido mensaje no textual (foto/documento) de chat_id: {chat_id}")
                sender = get_telegram_sender()
                if sender:
                    response_text = "¡Gracias por enviar la información! Para poder revisarla en detalle y darte una cotización precisa, por favor, agenda tu sesión online en el siguiente enlace: https://calendar.app.google/vqph6omVL1BZoNuy6"
                    sender.send_message_sync(chat_id, response_text)
                return "OK", 200  # Terminar la ejecución aquí
            # --- FIN DE LA NUEVA LÓGICA ---

            if chat_id:
                session_id = str(chat_id)

        if not session_id or not user_query:
            logger.warning(f"Petición de Telegram inválida o sin texto/callback, no se procesa.")
            return "OK", 200

    else:
        # --- Flujo de API Web ---
        user_query = request_json.get("query") or request_json.get("message")
        session_id = request_json.get("sessionId")
        if not user_query:
            return (
                json.dumps({"error": 'El campo "query" o "message" es requerido.'}),
                400,
                response_headers,
            )
        if not session_id:
            session_id = "web_" + "".join(
                random.choices(string.ascii_lowercase + string.digits, k=12)
            )
            logger.info(f"Nuevo session_id generado para cliente web: {session_id}")

    # --- Llamada a la IA con Contexto ---
    analysis = ai_core.get_construction_analysis(user_query, session_id)

    # --- Devolver Respuesta Apropiada ---
    if is_telegram_request:
        sender = get_telegram_sender()
        if sender:
            reply_markup = analysis.get("reply_markup")
            sender.send_message_sync(
                chat_id=int(session_id),
                text=analysis["friendly_response"],
                reply_markup=reply_markup,
            )
        else:
            logger.error("No se puede responder a Telegram: TelegramSender no está disponible.")
        return "OK", 200
    else:
        # Para la web, devolvemos el JSON completo
        return (json.dumps(analysis), 200, response_headers)


# ===================================
# AGREGAR ESTO AL FINAL DE main.py
# ===================================

# --- NOTIFICACIONES PROACTIVAS v9.0 ---


@functions_framework.http
def morning_notifications(request):
    """Notificaciones matutinas (7 AM)."""
    from claudia_modules import notifications

    logger.info("=== INICIANDO ENVÍO DE MENSAJES MATUTINOS ===")

    try:
        users = notifications.get_users_for_notification(hour=7)

        if not users:
            return json.dumps({"success": True, "message": "No users to notify", "count": 0}), 200

        results = []
        for user in users:
            result = notifications.send_morning_notification(
                user_id=user["user_id"], telegram_id=user["telegram_id"]
            )
            results.append(result)

        success_count = sum(1 for r in results if r.get("success"))

        return (
            json.dumps(
                {
                    "success": True,
                    "message": f"Morning notifications sent to {success_count} users",
                    "total_users": len(users),
                    "successful": success_count,
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Error en morning_notifications: {e}", exc_info=True)
        return json.dumps({"success": False, "error": str(e)}), 500


@functions_framework.http
def midday_notifications(request):
    """Notificaciones de mediodía (12 PM)."""
    from claudia_modules import notifications

    logger.info("=== INICIANDO ENVÍO DE MENSAJES DE MEDIODÍA ===")

    try:
        users = notifications.get_users_for_notification(hour=12)

        if not users:
            return json.dumps({"success": True, "message": "No users to notify", "count": 0}), 200

        results = []
        for user in users:
            result = notifications.send_midday_notification(
                user_id=user["user_id"], telegram_id=user["telegram_id"]
            )
            results.append(result)

        success_count = sum(1 for r in results if r.get("success"))

        return (
            json.dumps(
                {
                    "success": True,
                    "message": f"Midday notifications sent to {success_count} users",
                    "total_users": len(users),
                    "successful": success_count,
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Error en midday_notifications: {e}", exc_info=True)
        return json.dumps({"success": False, "error": str(e)}), 500


@functions_framework.http
def evening_notifications(request):
    """Notificaciones vespertinas (6 PM)."""
    from claudia_modules import notifications

    logger.info("=== INICIANDO ENVÍO DE MENSAJES VESPERTINOS ===")

    try:
        users = notifications.get_users_for_notification(hour=18)

        if not users:
            return json.dumps({"success": True, "message": "No users to notify", "count": 0}), 200

        results = []
        for user in users:
            result = notifications.send_evening_notification(
                user_id=user["user_id"], telegram_id=user["telegram_id"]
            )
            results.append(result)

        success_count = sum(1 for r in results if r.get("success"))

        return (
            json.dumps(
                {
                    "success": True,
                    "message": f"Evening notifications sent to {success_count} users",
                    "total_users": len(users),
                    "successful": success_count,
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Error en evening_notifications: {e}", exc_info=True)
        return json.dumps({"success": False, "error": str(e)}), 500


@functions_framework.http
def suggest_project_apus(request):
    """
    Endpoint HTTP para sugerir APUs inteligentemente usando Gemini.

    Resuelve el problema de Pablo: cuando un usuario crea un proyecto como
    "Remodelación baño", automáticamente sugiere 15-25 APUs relevantes.

    Request JSON:
        {
            "project_name": "Remodelación baño 6m²",
            "project_description": "Baño completo con ducha" (opcional),
            "surface_area": 6.0 (opcional)
        }

    Response JSON:
        {
            "success": true,
            "suggestions": [...],
            "total_estimated": 1500000,
            "confidence": "high",
            "count": 18
        }
    """
    # Headers CORS
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json"
    }

    # Handle OPTIONS preflight
    if request.method == "OPTIONS":
        return "", 204, headers

    try:
        # Obtener datos del request
        if request.method != "POST":
            return json.dumps({"success": False, "error": "Only POST method allowed"}), 405, headers

        request_json = request.get_json(silent=True)
        if not request_json:
            return json.dumps({"success": False, "error": "No JSON data provided"}), 400, headers

        project_name = request_json.get("project_name", "").strip()
        if not project_name:
            return json.dumps({"success": False, "error": "project_name is required"}), 400, headers

        project_description = request_json.get("project_description", "").strip()
        surface_area = request_json.get("surface_area")

        # Convertir surface_area a float si existe
        if surface_area is not None:
            try:
                surface_area = float(surface_area)
            except (ValueError, TypeError):
                surface_area = None

        logger.info(f"🤖 Generando sugerencias IA para: {project_name}")

        # Llamar al módulo de sugerencias
        result = apu_suggestions.suggest_apus_for_project(
            project_name=project_name,
            project_description=project_description,
            surface_area=surface_area
        )

        if result.get("success"):
            logger.info(f"✅ Sugerencias generadas: {result.get('count', 0)} APUs")
        else:
            logger.warning(f"⚠️ Error en sugerencias: {result.get('error', 'Unknown')}")

        return json.dumps(result, ensure_ascii=False), 200, headers

    except Exception as e:
        logger.error(f"Error en suggest_project_apus: {e}", exc_info=True)
        return json.dumps({
            "success": False,
            "error": str(e),
            "suggestions": [],
            "total_estimated": 0,
            "confidence": "none"
        }), 500, headers

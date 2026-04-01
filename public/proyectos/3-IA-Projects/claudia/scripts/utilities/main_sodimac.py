# main_sodimac.py - CLAUDIA SODIMAC VERSION
"""
Entry point para CLAUDIA SODIMAC
Asistente de Construcción con IA para Círculo de Especialistas Sodimac
"""

import json
import logging
import os
import random
import string
from io import BytesIO

import functions_framework

# Imports de módulos locales
from claudia_modules import config
from claudia_modules.ai_core_sodimac import get_sodimac_response
from claudia_modules.telegram_api import TelegramSender

# --- Configuración de Logging ---
logging.basicConfig(
    level=config.LOGGING_LEVEL, format="%(asctime)s - %(levelname)s - %(module)s - %(message)s"
)
logger = logging.getLogger(__name__)

# --- Inicialización Perezosa de Componentes ---
TELEGRAM_SENDER = None


def get_telegram_sender():
    """Inicializa el TelegramSender una sola vez de forma perezosa."""
    global TELEGRAM_SENDER
    if TELEGRAM_SENDER is None:
        try:
            token = config.TELEGRAM_TOKEN
            if not token:
                raise ValueError(
                    "La variable de entorno TELEGRAM_TOKEN no está configurada o está vacía."
                )
            TELEGRAM_SENDER = TelegramSender(token)
            logger.info("Telegram Sender inicializado exitosamente.")
        except Exception as e:
            logger.critical(
                f"Error CRÍTICO durante la inicialización de TelegramSender: {e}", exc_info=True
            )
    return TELEGRAM_SENDER


def download_telegram_file(file_id: str, sender: TelegramSender) -> bytes:
    """
    Descarga un archivo de Telegram

    Args:
        file_id: ID del archivo en Telegram
        sender: Instancia de TelegramSender

    Returns:
        Bytes del archivo
    """
    try:
        # Obtener file_path
        response = sender._make_request(f"getFile", {"file_id": file_id})
        if not response.get("ok"):
            logger.error(f"Error obteniendo file info: {response}")
            return None

        file_path = response["result"]["file_path"]
        file_url = f"https://api.telegram.org/file/bot{config.TELEGRAM_TOKEN}/{file_path}"

        # Descargar archivo
        import requests

        file_response = requests.get(file_url, timeout=30)
        file_response.raise_for_status()

        return file_response.content

    except Exception as e:
        logger.error(f"Error descargando archivo de Telegram: {e}", exc_info=True)
        return None


# --- Entry Point ÚNICO Y UNIFICADO ---
@functions_framework.http
def claudia_sodimac_handler(request):
    """
    Punto de entrada unificado para Telegram y la API web.
    VERSIÓN CLAUDIA SODIMAC
    """
    # --- Manejo de CORS para peticiones web ---
    if request.method == "OPTIONS":
        headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "3600",
        }
        return ("", 204, headers)

    response_headers = {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"}

    # --- Lógica Principal ---
    if request.method == "GET":
        # Endpoint de health check
        return (
            json.dumps(
                {
                    "status": "ok",
                    "service": "CLAUDIA SODIMAC",
                    "version": "1.0.0",
                    "description": "Asistente de Construcción con IA para Sodimac",
                }
            ),
            200,
            response_headers,
        )

    if request.method != "POST":
        return (json.dumps({"error": "Se requiere método POST"}), 405, response_headers)

    request_json = request.get_json(silent=True)
    if not request_json:
        return (json.dumps({"error": "No se recibió un JSON válido"}), 400, response_headers)

    # --- Detección de Origen y Gestión de Sesión ---
    is_telegram_request = "update_id" in request_json
    session_id = None
    user_query = None
    image_data = None
    user_context = {}

    if is_telegram_request:
        logger.info("📱 Recibida petición de Telegram")

        # Manejar callback queries (botones)
        if "callback_query" in request_json:
            callback_query = request_json["callback_query"]
            user_query = callback_query["data"]
            chat_id = callback_query["message"]["chat"]["id"]
            callback_query_id = callback_query["id"]
            session_id = str(chat_id)

            sender = get_telegram_sender()
            if sender:
                sender.answer_callback_query(callback_query_id)

        # Manejar mensajes
        elif "message" in request_json:
            message = request_json.get("message", {})
            chat_id = message.get("chat", {}).get("id")
            user_query = message.get("text", "")

            # Obtener contexto del usuario
            user_context = {
                "user_name": message.get("from", {}).get("first_name", "Maestro"),
                "chat_id": chat_id,
            }

            # --- Manejo de FOTOS ---
            if message.get("photo"):
                logger.info(f"📸 Recibida foto de chat_id: {chat_id}")
                # Obtener la foto de mayor resolución
                photos = message["photo"]
                largest_photo = max(photos, key=lambda p: p.get("file_size", 0))
                file_id = largest_photo["file_id"]

                sender = get_telegram_sender()
                if sender:
                    # Descargar imagen
                    image_data = download_telegram_file(file_id, sender)

                    if image_data:
                        # Si no hay texto, usar texto por defecto
                        if not user_query:
                            user_query = (
                                "Analiza esta foto de obra y dame tu evaluación profesional"
                            )
                    else:
                        sender.send_message_sync(
                            chat_id,
                            "⚠️ No pude descargar la imagen. Por favor, intenta nuevamente.",
                        )
                        return "OK", 200

            # --- Manejo de DOCUMENTOS ---
            elif message.get("document"):
                logger.info(f"📄 Recibido documento de chat_id: {chat_id}")
                sender = get_telegram_sender()
                if sender:
                    sender.send_message_sync(
                        chat_id,
                        "📋 Recibí tu documento. Para análisis detallado y cotización precisa, "
                        "por favor agenda una sesión online: https://calendar.app.google/vqph6omVL1BZoNuy6",
                    )
                return "OK", 200

            if chat_id:
                session_id = str(chat_id)

        if not session_id:
            logger.warning(f"Petición de Telegram inválida, no se procesa")
            return "OK", 200

    else:
        # --- Flujo de API Web ---
        logger.info("🌐 Recibida petición de API Web")
        user_query = request_json.get("query") or request_json.get("message")
        session_id = request_json.get("sessionId")
        user_context = request_json.get("context", {})

        # Manejo de imagen en base64 (para web)
        if request_json.get("image"):
            try:
                import base64

                image_b64 = request_json["image"]
                # Remover prefijo data:image/... si existe
                if "," in image_b64:
                    image_b64 = image_b64.split(",")[1]
                image_data = base64.b64decode(image_b64)
            except Exception as e:
                logger.error(f"Error decodificando imagen base64: {e}")

        if not user_query and not image_data:
            return (
                json.dumps({"error": 'El campo "query" o "message" es requerido.'}),
                400,
                response_headers,
            )

        if not session_id:
            session_id = "web_" + "".join(
                random.choices(string.ascii_lowercase + string.digits, k=12)
            )
            logger.info(f"🆔 Nuevo session_id generado: {session_id}")

    # --- Llamada a CLAUDIA SODIMAC ---
    logger.info(f"🤖 Procesando query: '{user_query[:50]}...' | Session: {session_id}")

    try:
        analysis = get_sodimac_response(
            user_query=user_query or "Hola",
            session_id=session_id,
            user_context=user_context,
            image_data=image_data,
        )

        # --- Devolver Respuesta Apropiada ---
        if is_telegram_request:
            sender = get_telegram_sender()
            if sender:
                response_text = analysis.get("respuesta_usuario", "Sin respuesta disponible")

                # Si hay productos sugeridos, agregar links
                if analysis.get("productos_sugeridos"):
                    response_text += "\n\n🛒 *Productos en Sodimac:*"
                    for prod in analysis["productos_sugeridos"][:3]:
                        if prod.get("url"):
                            response_text += f"\n• [{prod['name']}]({prod['url']}) - ${prod.get('price', 0):,.0f}"

                # Enviar mensaje
                sender.send_message_sync(
                    chat_id=int(session_id), text=response_text, parse_mode="Markdown"
                )

                logger.info(f"✅ Respuesta enviada a Telegram chat_id: {session_id}")
            else:
                logger.error("❌ No se puede responder a Telegram: TelegramSender no disponible")

            return "OK", 200

        else:
            # Para la web, devolver JSON completo
            logger.info(f"✅ Respuesta enviada a cliente web")
            return (json.dumps(analysis, ensure_ascii=False), 200, response_headers)

    except Exception as e:
        logger.error(f"❌ Error procesando solicitud: {e}", exc_info=True)

        error_response = {
            "error": "Error procesando solicitud",
            "message": "Lo siento, tuve un problema técnico. Por favor, intenta nuevamente.",
            "tipo_interaccion": "error",
        }

        if is_telegram_request:
            sender = get_telegram_sender()
            if sender:
                sender.send_message_sync(
                    int(session_id),
                    "⚠️ Disculpa, tuve un problema técnico. Por favor, intenta nuevamente en unos momentos.",
                )
            return "OK", 200
        else:
            return (json.dumps(error_response), 500, response_headers)


# --- Función de testing local ---
if __name__ == "__main__":
    print("🚀 CLAUDIA SODIMAC - Local Testing Mode")
    print("=" * 60)

    # Simular request
    class MockRequest:
        def __init__(self, json_data):
            self._json = json_data
            self.method = "POST"

        def get_json(self, silent=False):
            return self._json

    # Test 1: Cálculo de materiales
    print("\n📋 TEST 1: Cálculo de materiales")
    test_request = MockRequest(
        {
            "query": "Necesito calcular materiales para un muro de 10 metros de largo por 2.4 de alto con ladrillo princesa",
            "sessionId": "test_123",
        }
    )

    response = claudia_sodimac_handler(test_request)
    print(f"Response: {response[0][:200]}...")

    # Test 2: Búsqueda de productos
    print("\n🔍 TEST 2: Búsqueda de productos")
    test_request2 = MockRequest({"query": "Busca cemento en Sodimac", "sessionId": "test_123"})

    response2 = claudia_sodimac_handler(test_request2)
    print(f"Response: {response2[0][:200]}...")

    print("\n✅ Tests completados")

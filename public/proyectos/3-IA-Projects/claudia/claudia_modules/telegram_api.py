# claudia_modules/telegram_api.py
# Este módulo maneja todas las interacciones con la API de Telegram.

import json
import logging
import time
from typing import Any, Dict, Optional

import requests

from claudia_modules import config

logger = logging.getLogger(__name__)


class TelegramSender:
    """Clase para enviar mensajes y gestionar la API de Telegram."""

    def __init__(self, bot_token: str):
        if not bot_token:
            logger.error("TelegramSender: bot_token no puede estar vacío.")
            raise ValueError("El token del bot de Telegram no puede ser nulo o vacío.")
        self.api_url = f"https://api.telegram.org/bot{bot_token}"

    def _make_request(
        self,
        method: str,
        payload: Optional[Dict[str, Any]] = None,
        is_json: bool = True,
        timeout: int = 10,
    ) -> Dict[str, Any]:
        """Realiza una solicitud HTTP a la API de Telegram con reintentos.

        Args:
            method: Método de la API de Telegram a llamar (ej: 'sendMessage')
            payload: Datos a enviar en la petición
            is_json: Si True, envía payload como JSON; si False, como form-data
            timeout: Timeout de la petición en segundos

        Returns:
            Diccionario con la respuesta de la API o error
        """
        url = f"{self.api_url}/{method}"
        retries = 0
        last_exception = None

        while retries < config.MAX_RETRIES:
            try:
                logger.debug(f"Telegram API Request: METHOD={method}, URL={url}, PAYLOAD={payload}")
                if is_json:
                    response = requests.post(url, json=payload, timeout=timeout)
                else:
                    response = requests.post(url, data=payload, timeout=timeout)

                response.raise_for_status()

                if response.text:
                    return response.json()
                return {"ok": True, "result": "Operación exitosa sin contenido de respuesta."}

            except requests.exceptions.HTTPError as e:
                last_exception = e
                error_text = e.response.text if hasattr(e.response, "text") else "No response text"
                logger.error(
                    f"HTTPError para {method}: {e.response.status_code} - {error_text[:200]}"
                )
                if 400 <= e.response.status_code < 500 and e.response.status_code not in [429]:
                    break
            except requests.exceptions.RequestException as e:
                last_exception = e
                logger.warning(
                    f"Reintento {retries + 1}/{config.MAX_RETRIES} para {method}. Esperando... Error: {type(e).__name__} - {e}"
                )

            retries += 1
            if retries < config.MAX_RETRIES:
                wait_time = config.BACKOFF_FACTOR**retries
                logger.debug(f"Esperando {wait_time}s antes del siguiente reintento...")
                time.sleep(wait_time)

        logger.error(
            f"Fallo crítico al hacer la petición a Telegram después de {config.MAX_RETRIES} reintentos para {method}. Último error: {last_exception}"
        )
        error_message = (
            f"Fallo en la petición a Telegram: {method} después de {config.MAX_RETRIES} reintentos."
        )
        error_code_detail = "REQUEST_FAILED_MAX_RETRIES"

        if last_exception:
            error_message += f" Último error: {type(last_exception).__name__}."
            if hasattr(last_exception, "response") and last_exception.response is not None:
                error_message += f" Status: {last_exception.response.status_code}. Detalle: {last_exception.response.text[:100]}"
                error_code_detail = f"HTTP_ERROR_{last_exception.response.status_code}"

        return {"ok": False, "error_code": error_code_detail, "description": error_message}

    def send_message_sync(
        self,
        chat_id: int,
        text: str,
        reply_markup: Optional[Dict[str, Any]] = None,
        parse_mode: str = "HTML",
    ) -> Dict[str, Any]:
        """Wrapper síncrono para enviar un mensaje.

        Args:
            chat_id: ID del chat de Telegram
            text: Texto del mensaje a enviar
            reply_markup: Teclado inline o reply keyboard (opcional)
            parse_mode: Modo de parseo del texto ('HTML', 'Markdown', o None)

        Returns:
            Diccionario con la respuesta de la API
        """
        payload = {"chat_id": str(chat_id), "text": text, "parse_mode": parse_mode}
        if reply_markup:
            payload["reply_markup"] = reply_markup

        logger.info(f"Intentando enviar mensaje a chat_id: {chat_id}...")
        response = self._make_request("sendMessage", payload)

        if response.get("ok"):
            logger.info(f"Mensaje enviado a {chat_id} exitosamente.")
        else:
            logger.error(
                f"Error enviando mensaje a {chat_id}: {response.get('description', 'Error desconocido')}"
            )
        return response

    def set_webhook(self, url: str) -> Dict[str, Any]:
        """Configura la URL del webhook en Telegram.

        Args:
            url: URL HTTPS del webhook

        Returns:
            Diccionario con la respuesta de la API
        """
        if not url or not url.startswith("https://"):
            logger.error(f"URL de Webhook inválida: {url}. Debe ser HTTPS.")
            return {
                "ok": False,
                "error_code": "INVALID_URL",
                "description": "La URL del webhook debe ser HTTPS.",
            }
        payload = {"url": url}
        logger.info(f"Configurando webhook a: {url}")
        return self._make_request("setWebhook", payload)

    def get_webhook_info(self) -> Dict[str, Any]:
        """Obtiene información sobre el webhook configurado.

        Returns:
            Diccionario con información del webhook
        """
        logger.info("Obteniendo información del webhook...")
        return self._make_request("getWebhookInfo")

    def answer_callback_query(
        self, callback_query_id: str, text: Optional[str] = None, show_alert: bool = False
    ) -> Dict[str, Any]:
        """Responde a un callback query para eliminar el estado de "cargando" del botón.

        Args:
            callback_query_id: ID del callback query a responder
            text: Texto opcional a mostrar al usuario
            show_alert: Si True, muestra un alert; si False, muestra una notificación

        Returns:
            Diccionario con la respuesta de la API
        """
        payload = {"callback_query_id": str(callback_query_id)}
        if text:
            payload["text"] = text
        if show_alert:
            payload["show_alert"] = show_alert

        logger.info(
            f"Respondiendo a callback_query_id: {callback_query_id} con texto: '{text or ''}' alerta: {show_alert}"
        )
        response = self._make_request("answerCallbackQuery", payload)

        if response.get("ok"):
            logger.info(f"Respuesta a callback_query {callback_query_id} enviada exitosamente.")
        else:
            logger.error(
                f"Error respondiendo a callback_query {callback_query_id}: {response.get('description', str(response))}"
            )
        return response

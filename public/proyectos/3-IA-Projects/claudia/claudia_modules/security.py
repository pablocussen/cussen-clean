# claudia_modules/security.py
"""
Utilidades de seguridad: validación, sanitización, headers
"""

import html
import logging
import re
from typing import Any, Dict, Optional
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

# Patrones de validación
TELEGRAM_ID_PATTERN = re.compile(r"^\d{5,15}$")
EMAIL_PATTERN = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
PHONE_PATTERN = re.compile(r"^\+?[1-9]\d{7,14}$")

# Límites de longitud
MAX_MESSAGE_LENGTH = 4096  # Límite de Telegram
MAX_QUERY_LENGTH = 1000
MAX_USERNAME_LENGTH = 100


class ValidationError(Exception):
    """Excepción para errores de validación."""

    pass


def sanitize_html(text: str) -> str:
    """Sanitiza texto HTML para prevenir XSS.

    Args:
        text: Texto a sanitizar

    Returns:
        Texto sanitizado
    """
    if not text:
        return ""
    return html.escape(text)


def sanitize_sql(text: str) -> str:
    """Sanitiza texto para prevenir SQL injection.

    Nota: Firestore no usa SQL, pero útil para futuros cambios.

    Args:
        text: Texto a sanitizar

    Returns:
        Texto sanitizado
    """
    if not text:
        return ""

    # Remover caracteres peligrosos
    dangerous_chars = ["'", '"', ";", "--", "/*", "*/", "xp_", "sp_"]
    sanitized = text
    for char in dangerous_chars:
        sanitized = sanitized.replace(char, "")

    return sanitized


def validate_telegram_id(telegram_id: Any) -> int:
    """Valida un Telegram ID.

    Args:
        telegram_id: ID a validar

    Returns:
        ID validado como entero

    Raises:
        ValidationError: Si el ID es inválido
    """
    try:
        id_str = str(telegram_id)
        if not TELEGRAM_ID_PATTERN.match(id_str):
            raise ValidationError(f"Invalid Telegram ID format: {telegram_id}")
        return int(id_str)
    except (ValueError, TypeError) as e:
        raise ValidationError(f"Invalid Telegram ID: {telegram_id}") from e


def validate_email(email: str) -> str:
    """Valida un email.

    Args:
        email: Email a validar

    Returns:
        Email validado en lowercase

    Raises:
        ValidationError: Si el email es inválido
    """
    if not email or not isinstance(email, str):
        raise ValidationError("Email is required")

    email = email.strip().lower()

    if not EMAIL_PATTERN.match(email):
        raise ValidationError(f"Invalid email format: {email}")

    if len(email) > 254:  # RFC 5321
        raise ValidationError("Email too long")

    return email


def validate_phone(phone: str) -> str:
    """Valida un número de teléfono.

    Args:
        phone: Teléfono a validar

    Returns:
        Teléfono validado

    Raises:
        ValidationError: Si el teléfono es inválido
    """
    if not phone or not isinstance(phone, str):
        raise ValidationError("Phone is required")

    # Remover espacios y guiones
    phone_clean = phone.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")

    if not PHONE_PATTERN.match(phone_clean):
        raise ValidationError(f"Invalid phone format: {phone}")

    return phone_clean


def validate_message_length(message: str, max_length: int = MAX_MESSAGE_LENGTH) -> str:
    """Valida la longitud de un mensaje.

    Args:
        message: Mensaje a validar
        max_length: Longitud máxima permitida

    Returns:
        Mensaje validado

    Raises:
        ValidationError: Si el mensaje es muy largo
    """
    if not message:
        raise ValidationError("Message is empty")

    if len(message) > max_length:
        raise ValidationError(f"Message too long: {len(message)} > {max_length}")

    return message


def validate_url(url: str, allowed_schemes: Optional[list] = None) -> str:
    """Valida una URL.

    Args:
        url: URL a validar
        allowed_schemes: Lista de esquemas permitidos (default: ['http', 'https'])

    Returns:
        URL validada

    Raises:
        ValidationError: Si la URL es inválida
    """
    if not url or not isinstance(url, str):
        raise ValidationError("URL is required")

    if allowed_schemes is None:
        allowed_schemes = ["http", "https"]

    try:
        parsed = urlparse(url)

        if not parsed.scheme:
            raise ValidationError("URL must have a scheme (http/https)")

        if parsed.scheme not in allowed_schemes:
            raise ValidationError(
                f"Invalid URL scheme: {parsed.scheme}. Allowed: {allowed_schemes}"
            )

        if not parsed.netloc:
            raise ValidationError("URL must have a domain")

        return url

    except Exception as e:
        raise ValidationError(f"Invalid URL: {url}") from e


def sanitize_user_input(text: str) -> str:
    """Sanitiza input de usuario de forma general.

    Args:
        text: Texto a sanitizar

    Returns:
        Texto sanitizado
    """
    if not text:
        return ""

    # Convertir a string si no lo es
    text = str(text)

    # Remover caracteres de control (excepto \n y \t)
    text = "".join(char for char in text if ord(char) >= 32 or char in ["\n", "\t"])

    # Limitar longitud
    if len(text) > MAX_QUERY_LENGTH:
        text = text[:MAX_QUERY_LENGTH]
        logger.warning(f"User input truncated to {MAX_QUERY_LENGTH} chars")

    # Sanitizar HTML
    text = sanitize_html(text)

    return text.strip()


def validate_telegram_update(update: Dict[str, Any]) -> Dict[str, Any]:
    """Valida una actualización de Telegram.

    Args:
        update: Diccionario con update de Telegram

    Returns:
        Update validado

    Raises:
        ValidationError: Si el update es inválido
    """
    if not isinstance(update, dict):
        raise ValidationError("Update must be a dictionary")

    if "update_id" not in update:
        raise ValidationError("Missing update_id")

    # Validar que tenga message o callback_query
    has_message = "message" in update
    has_callback = "callback_query" in update

    if not has_message and not has_callback:
        raise ValidationError("Update must have message or callback_query")

    # Validar message si existe
    if has_message:
        message = update["message"]
        if "from" not in message or "chat" not in message:
            raise ValidationError("Invalid message structure")

        user_id = message.get("from", {}).get("id")
        if user_id:
            validate_telegram_id(user_id)

    # Validar callback_query si existe
    if has_callback:
        callback = update["callback_query"]
        if "from" not in callback:
            raise ValidationError("Invalid callback_query structure")

        user_id = callback.get("from", {}).get("id")
        if user_id:
            validate_telegram_id(user_id)

    return update


def get_security_headers() -> Dict[str, str]:
    """Genera headers de seguridad para HTTP responses.

    Returns:
        Diccionario con headers de seguridad
    """
    return {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "Content-Security-Policy": "default-src 'self'",
        "Referrer-Policy": "strict-origin-when-cross-origin",
    }


def is_safe_callback_data(callback_data: str) -> bool:
    """Verifica si un callback_data es seguro.

    Args:
        callback_data: Dato del callback a verificar

    Returns:
        True si es seguro
    """
    if not callback_data:
        return False

    # Solo permitir alfanuméricos, guiones bajos y guiones
    safe_pattern = re.compile(r"^[a-zA-Z0-9_-]+$")
    return bool(safe_pattern.match(callback_data))


def mask_sensitive_data(data: str, mask_char: str = "*", visible_chars: int = 4) -> str:
    """Enmascara datos sensibles para logging.

    Args:
        data: Dato a enmascarar
        mask_char: Carácter para enmascarar
        visible_chars: Número de caracteres visibles al final

    Returns:
        Dato enmascarado

    Example:
        >>> mask_sensitive_data("1234567890")
        '******7890'
    """
    if not data or len(data) <= visible_chars:
        return mask_char * len(data) if data else ""

    masked_length = len(data) - visible_chars
    return mask_char * masked_length + data[-visible_chars:]

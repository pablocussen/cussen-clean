# claudia_modules/logging_utils.py
"""
Structured logging y utilidades de logs
"""

import json
import logging
import traceback
from datetime import datetime
from typing import Any, Dict, Optional


class StructuredLogger:
    """Logger con soporte para logs estructurados (JSON)."""

    def __init__(self, name: str, enable_json: bool = True):
        """Inicializa el structured logger.

        Args:
            name: Nombre del logger
            enable_json: Si True, usa formato JSON; si False, formato tradicional
        """
        self.logger = logging.getLogger(name)
        self.enable_json = enable_json

    def _format_message(
        self,
        level: str,
        message: str,
        extra: Optional[Dict[str, Any]] = None,
        exc_info: Optional[Exception] = None,
    ) -> str:
        """Formatea mensaje como JSON o texto.

        Args:
            level: Nivel del log (INFO, WARNING, ERROR, etc.)
            message: Mensaje del log
            extra: Campos adicionales
            exc_info: Excepción si existe

        Returns:
            String formateado
        """
        if not self.enable_json:
            return message

        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": level,
            "message": message,
            "logger": self.logger.name,
        }

        if extra:
            log_entry.update(extra)

        if exc_info:
            log_entry["exception"] = {
                "type": type(exc_info).__name__,
                "message": str(exc_info),
                "traceback": traceback.format_exc(),
            }

        return json.dumps(log_entry, default=str)

    def info(self, message: str, **kwargs):
        """Log nivel INFO.

        Args:
            message: Mensaje a loguear
            **kwargs: Campos adicionales para JSON
        """
        formatted = self._format_message("INFO", message, extra=kwargs)
        self.logger.info(formatted)

    def warning(self, message: str, **kwargs):
        """Log nivel WARNING.

        Args:
            message: Mensaje a loguear
            **kwargs: Campos adicionales
        """
        formatted = self._format_message("WARNING", message, extra=kwargs)
        self.logger.warning(formatted)

    def error(self, message: str, exc_info: Optional[Exception] = None, **kwargs):
        """Log nivel ERROR.

        Args:
            message: Mensaje a loguear
            exc_info: Excepción opcional
            **kwargs: Campos adicionales
        """
        formatted = self._format_message("ERROR", message, extra=kwargs, exc_info=exc_info)
        self.logger.error(formatted)

    def critical(self, message: str, exc_info: Optional[Exception] = None, **kwargs):
        """Log nivel CRITICAL.

        Args:
            message: Mensaje a loguear
            exc_info: Excepción opcional
            **kwargs: Campos adicionales
        """
        formatted = self._format_message("CRITICAL", message, extra=kwargs, exc_info=exc_info)
        self.logger.critical(formatted)

    def debug(self, message: str, **kwargs):
        """Log nivel DEBUG.

        Args:
            message: Mensaje a loguear
            **kwargs: Campos adicionales
        """
        formatted = self._format_message("DEBUG", message, extra=kwargs)
        self.logger.debug(formatted)


def log_request(
    method: str,
    endpoint: str,
    user_id: Optional[str] = None,
    duration_ms: Optional[float] = None,
    status_code: Optional[int] = None,
    error: Optional[str] = None,
):
    """Loguea un HTTP request de forma estructurada.

    Args:
        method: Método HTTP (GET, POST, etc.)
        endpoint: Endpoint llamado
        user_id: ID del usuario (opcional)
        duration_ms: Duración en ms (opcional)
        status_code: Código HTTP (opcional)
        error: Mensaje de error (opcional)
    """
    logger = StructuredLogger("claudia.requests")

    log_data = {
        "method": method,
        "endpoint": endpoint,
    }

    if user_id:
        log_data["user_id"] = user_id
    if duration_ms is not None:
        log_data["duration_ms"] = round(duration_ms, 2)
    if status_code:
        log_data["status_code"] = status_code
    if error:
        log_data["error"] = error

    if error or (status_code and status_code >= 400):
        logger.error(f"Request failed: {method} {endpoint}", **log_data)
    else:
        logger.info(f"Request: {method} {endpoint}", **log_data)


def log_ai_query(
    user_id: str,
    query: str,
    response_length: int,
    duration_ms: float,
    lead_score: Optional[int] = None,
    project_type: Optional[str] = None,
):
    """Loguea una consulta de IA de forma estructurada.

    Args:
        user_id: ID del usuario
        query: Consulta del usuario
        response_length: Longitud de la respuesta
        duration_ms: Duración del procesamiento
        lead_score: Score del lead (opcional)
        project_type: Tipo de proyecto detectado (opcional)
    """
    logger = StructuredLogger("claudia.ai")

    log_data = {
        "user_id": user_id,
        "query_length": len(query),
        "response_length": response_length,
        "duration_ms": round(duration_ms, 2),
    }

    if lead_score is not None:
        log_data["lead_score"] = lead_score
    if project_type:
        log_data["project_type"] = project_type

    logger.info("AI query processed", **log_data)


def log_error_with_context(
    error: Exception,
    context: str,
    user_id: Optional[str] = None,
    additional_data: Optional[Dict[str, Any]] = None,
):
    """Loguea un error con contexto completo.

    Args:
        error: Excepción ocurrida
        context: Contexto donde ocurrió (ej: "telegram_handler")
        user_id: ID del usuario (opcional)
        additional_data: Datos adicionales (opcional)
    """
    logger = StructuredLogger("claudia.errors")

    log_data = {"context": context}

    if user_id:
        log_data["user_id"] = user_id
    if additional_data:
        log_data.update(additional_data)

    logger.error(f"Error in {context}: {str(error)}", exc_info=error, **log_data)


def get_structured_logger(name: str, enable_json: bool = True) -> StructuredLogger:
    """Factory function para crear structured loggers.

    Args:
        name: Nombre del logger
        enable_json: Si True, usa formato JSON

    Returns:
        StructuredLogger instance
    """
    return StructuredLogger(name, enable_json)

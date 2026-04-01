# claudia_modules/health.py
"""
Health checks y monitoring de sistema
"""

import logging
import time
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


class HealthChecker:
    """Verifica salud de componentes del sistema."""

    def __init__(self):
        """Inicializa el health checker."""
        self.start_time = time.time()
        self.checks_history: Dict[str, list] = {}

    def check_firestore(self) -> Dict[str, Any]:
        """Verifica conexión a Firestore.

        Returns:
            Diccionario con resultado del check
        """
        try:
            from google.cloud import firestore

            db = firestore.Client()
            # Test simple query
            db.collection("_health_check").limit(1).get()

            return {
                "status": "healthy",
                "latency_ms": 0,
                "message": "Firestore connection OK",
            }
        except Exception as e:
            logger.error(f"Firestore health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "message": "Firestore connection failed",
            }

    def check_gemini_api(self) -> Dict[str, Any]:
        """Verifica disponibilidad de Gemini API.

        Returns:
            Diccionario con resultado del check
        """
        try:
            import google.generativeai as genai

            from claudia_modules import config

            if not config.GEMINI_API_KEY:
                return {
                    "status": "unhealthy",
                    "message": "GEMINI_API_KEY not configured",
                }

            # La API key existe
            return {
                "status": "healthy",
                "message": "Gemini API configured",
            }
        except Exception as e:
            logger.error(f"Gemini API health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "message": "Gemini API check failed",
            }

    def check_telegram_api(self) -> Dict[str, Any]:
        """Verifica configuración de Telegram API.

        Returns:
            Diccionario con resultado del check
        """
        try:
            from claudia_modules import config

            if not config.TELEGRAM_TOKEN:
                return {
                    "status": "unhealthy",
                    "message": "TELEGRAM_TOKEN not configured",
                }

            return {
                "status": "healthy",
                "message": "Telegram API configured",
            }
        except Exception as e:
            logger.error(f"Telegram API health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "message": "Telegram API check failed",
            }

    def check_apu_database(self) -> Dict[str, Any]:
        """Verifica disponibilidad de base de datos APU.

        Returns:
            Diccionario con resultado del check
        """
        try:
            from claudia_modules.cache_utils import load_apu_database

            apus = load_apu_database()
            apu_count = len(apus)

            if apu_count < 100:
                return {
                    "status": "degraded",
                    "apu_count": apu_count,
                    "message": f"APU count low: {apu_count}",
                }

            return {
                "status": "healthy",
                "apu_count": apu_count,
                "message": f"APU database OK ({apu_count} entries)",
            }
        except Exception as e:
            logger.error(f"APU database health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "message": "APU database load failed",
            }

    def get_system_info(self) -> Dict[str, Any]:
        """Obtiene información del sistema.

        Returns:
            Diccionario con info del sistema
        """
        uptime_seconds = time.time() - self.start_time

        system_info = {
            "uptime_seconds": uptime_seconds,
            "uptime_human": self._format_uptime(uptime_seconds),
            "python_version": self._get_python_version(),
        }

        # Agregar info de memoria si psutil está disponible
        try:
            from claudia_modules.performance import memory_usage_mb

            system_info["memory_mb"] = memory_usage_mb()
        except ImportError:
            pass

        return system_info

    def _format_uptime(self, seconds: float) -> str:
        """Formatea uptime de forma legible.

        Args:
            seconds: Segundos de uptime

        Returns:
            String formateado (ej: "2h 15m 30s")
        """
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)

        parts = []
        if hours > 0:
            parts.append(f"{hours}h")
        if minutes > 0:
            parts.append(f"{minutes}m")
        parts.append(f"{secs}s")

        return " ".join(parts)

    def _get_python_version(self) -> str:
        """Obtiene versión de Python.

        Returns:
            String con versión
        """
        import sys

        return f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"

    def run_all_checks(self) -> Dict[str, Any]:
        """Ejecuta todos los health checks.

        Returns:
            Diccionario con resultados completos
        """
        start_time = time.time()

        checks = {
            "firestore": self.check_firestore(),
            "gemini_api": self.check_gemini_api(),
            "telegram_api": self.check_telegram_api(),
            "apu_database": self.check_apu_database(),
        }

        # Determinar estado general
        statuses = [check["status"] for check in checks.values()]
        if "unhealthy" in statuses:
            overall_status = "unhealthy"
        elif "degraded" in statuses:
            overall_status = "degraded"
        else:
            overall_status = "healthy"

        elapsed_ms = (time.time() - start_time) * 1000

        return {
            "status": overall_status,
            "timestamp": time.time(),
            "checks": checks,
            "system": self.get_system_info(),
            "health_check_duration_ms": elapsed_ms,
        }


# Instancia global
_health_checker = None


def get_health_checker() -> HealthChecker:
    """Obtiene instancia global del health checker.

    Returns:
        HealthChecker singleton
    """
    global _health_checker
    if _health_checker is None:
        _health_checker = HealthChecker()
    return _health_checker


def health_check_endpoint() -> tuple:
    """Endpoint de health check para HTTP.

    Returns:
        Tupla (response_dict, http_status_code)
    """
    checker = get_health_checker()
    result = checker.run_all_checks()

    # Mapear status a HTTP code
    status_code = 200
    if result["status"] == "degraded":
        status_code = 200  # Aún funcional
    elif result["status"] == "unhealthy":
        status_code = 503  # Service Unavailable

    return result, status_code

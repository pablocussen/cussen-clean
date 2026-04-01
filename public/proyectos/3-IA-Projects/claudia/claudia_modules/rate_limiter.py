# claudia_modules/rate_limiter.py
"""
Rate limiting para proteger contra abuso y ataques DDoS
"""

import logging
import time
from collections import defaultdict
from typing import Dict, Optional, Tuple

logger = logging.getLogger(__name__)


class RateLimiter:
    """Rate limiter basado en token bucket algorithm."""

    def __init__(self, max_requests: int = 5, window_seconds: int = 60, burst_size: int = 10):
        """Inicializa el rate limiter.

        Args:
            max_requests: Número máximo de requests permitidos por ventana
            window_seconds: Tamaño de la ventana en segundos
            burst_size: Máximo de requests en ráfaga permitidos
        """
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.burst_size = burst_size

        # {user_id: [(timestamp1, timestamp2, ...)]}
        self.requests: Dict[str, list] = defaultdict(list)

        # {user_id: tokens_available}
        self.tokens: Dict[str, float] = defaultdict(lambda: self.burst_size)

        # {user_id: last_refill_time}
        self.last_refill: Dict[str, float] = {}

    def _refill_tokens(self, user_id: str) -> None:
        """Rellena tokens según tiempo transcurrido.

        Args:
            user_id: ID del usuario
        """
        now = time.time()
        last_time = self.last_refill.get(user_id, now)
        time_passed = now - last_time

        # Calcular tokens a agregar (tasa: max_requests / window_seconds)
        refill_rate = self.max_requests / self.window_seconds
        tokens_to_add = time_passed * refill_rate

        # Agregar tokens sin exceder burst_size
        self.tokens[user_id] = min(self.tokens[user_id] + tokens_to_add, self.burst_size)
        self.last_refill[user_id] = now

    def is_allowed(self, user_id: str) -> Tuple[bool, Optional[int]]:
        """Verifica si un usuario puede hacer un request.

        Args:
            user_id: ID del usuario (chat_id de Telegram)

        Returns:
            Tupla (permitido, segundos_para_retry)
            - permitido: True si puede hacer el request
            - segundos_para_retry: Segundos a esperar si no está permitido
        """
        user_id_str = str(user_id)
        self._refill_tokens(user_id_str)

        # Verificar si tiene tokens disponibles
        if self.tokens[user_id_str] >= 1.0:
            self.tokens[user_id_str] -= 1.0
            logger.debug(
                f"Request allowed for user {user_id}. "
                f"Tokens remaining: {self.tokens[user_id_str]:.2f}"
            )
            return True, None
        else:
            # Calcular tiempo para recuperar 1 token
            refill_rate = self.max_requests / self.window_seconds
            time_for_token = 1.0 / refill_rate
            retry_after = int(time_for_token) + 1

            logger.warning(
                f"Rate limit exceeded for user {user_id}. " f"Retry after {retry_after}s"
            )
            return False, retry_after

    def record_request(self, user_id: str) -> None:
        """Registra un request (para estadísticas).

        Args:
            user_id: ID del usuario
        """
        user_id_str = str(user_id)
        now = time.time()
        self.requests[user_id_str].append(now)

        # Limpiar requests antiguos (fuera de la ventana)
        cutoff = now - self.window_seconds
        self.requests[user_id_str] = [ts for ts in self.requests[user_id_str] if ts > cutoff]

    def get_stats(self, user_id: str) -> Dict[str, any]:
        """Obtiene estadísticas de un usuario.

        Args:
            user_id: ID del usuario

        Returns:
            Diccionario con estadísticas
        """
        user_id_str = str(user_id)
        self._refill_tokens(user_id_str)

        now = time.time()
        cutoff = now - self.window_seconds
        recent_requests = [ts for ts in self.requests[user_id_str] if ts > cutoff]

        return {
            "user_id": user_id,
            "tokens_available": self.tokens[user_id_str],
            "requests_in_window": len(recent_requests),
            "window_seconds": self.window_seconds,
            "max_requests": self.max_requests,
            "burst_size": self.burst_size,
        }

    def reset_user(self, user_id: str) -> None:
        """Resetea el límite de un usuario (útil para testing o admin).

        Args:
            user_id: ID del usuario
        """
        user_id_str = str(user_id)
        self.tokens[user_id_str] = self.burst_size
        self.requests[user_id_str] = []
        self.last_refill[user_id_str] = time.time()
        logger.info(f"Rate limit reset for user {user_id}")

    def cleanup_old_entries(self, max_age_hours: int = 24) -> int:
        """Limpia entradas antiguas para liberar memoria.

        Args:
            max_age_hours: Máximo de horas de inactividad antes de limpiar

        Returns:
            Número de usuarios limpiados
        """
        now = time.time()
        cutoff = now - (max_age_hours * 3600)
        cleaned = 0

        # Identificar usuarios inactivos
        inactive_users = []
        for user_id, timestamps in self.requests.items():
            if timestamps and timestamps[-1] < cutoff:
                inactive_users.append(user_id)
            elif not timestamps and self.last_refill.get(user_id, 0) < cutoff:
                inactive_users.append(user_id)

        # Limpiar
        for user_id in inactive_users:
            self.requests.pop(user_id, None)
            self.tokens.pop(user_id, None)
            self.last_refill.pop(user_id, None)
            cleaned += 1

        if cleaned > 0:
            logger.info(f"Cleaned {cleaned} inactive users from rate limiter")

        return cleaned


# Instancia global del rate limiter
_rate_limiter = None


def get_rate_limiter(
    max_requests: int = 5, window_seconds: int = 60, burst_size: int = 10
) -> RateLimiter:
    """Obtiene (o crea) la instancia global del rate limiter.

    Args:
        max_requests: Número máximo de requests por ventana
        window_seconds: Tamaño de ventana en segundos
        burst_size: Máximo de requests en ráfaga

    Returns:
        Instancia de RateLimiter
    """
    global _rate_limiter
    if _rate_limiter is None:
        _rate_limiter = RateLimiter(max_requests, window_seconds, burst_size)
        logger.info(
            f"Rate limiter initialized: {max_requests} req/{window_seconds}s, "
            f"burst={burst_size}"
        )
    return _rate_limiter


def check_rate_limit(user_id: str) -> Tuple[bool, Optional[int]]:
    """Verifica el rate limit para un usuario (función de conveniencia).

    Args:
        user_id: ID del usuario

    Returns:
        Tupla (permitido, retry_after_seconds)
    """
    limiter = get_rate_limiter()
    allowed, retry_after = limiter.is_allowed(user_id)
    if allowed:
        limiter.record_request(user_id)
    return allowed, retry_after

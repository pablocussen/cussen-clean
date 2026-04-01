# claudia_modules/performance.py
"""
Utilidades para monitoreo y optimización de performance
"""

import functools
import logging
import time
from contextlib import contextmanager
from typing import Any, Callable, Dict, Optional

logger = logging.getLogger(__name__)


class PerformanceMonitor:
    """Monitor de performance para rastrear métricas de ejecución."""

    def __init__(self):
        """Inicializa el monitor de performance."""
        self.metrics: Dict[str, Dict[str, Any]] = {}

    def record(self, metric_name: str, value: float, unit: str = "ms") -> None:
        """Registra una métrica de performance.

        Args:
            metric_name: Nombre de la métrica
            value: Valor de la métrica
            unit: Unidad de medida (default: ms)
        """
        if metric_name not in self.metrics:
            self.metrics[metric_name] = {
                "count": 0,
                "total": 0,
                "min": float("inf"),
                "max": 0,
                "unit": unit,
            }

        metric = self.metrics[metric_name]
        metric["count"] += 1
        metric["total"] += value
        metric["min"] = min(metric["min"], value)
        metric["max"] = max(metric["max"], value)

    def get_stats(self, metric_name: str) -> Optional[Dict[str, Any]]:
        """Obtiene estadísticas de una métrica.

        Args:
            metric_name: Nombre de la métrica

        Returns:
            Diccionario con estadísticas o None si no existe
        """
        if metric_name not in self.metrics:
            return None

        metric = self.metrics[metric_name]
        return {
            "count": metric["count"],
            "average": metric["total"] / metric["count"] if metric["count"] > 0 else 0,
            "min": metric["min"] if metric["min"] != float("inf") else 0,
            "max": metric["max"],
            "total": metric["total"],
            "unit": metric["unit"],
        }

    def get_all_stats(self) -> Dict[str, Dict[str, Any]]:
        """Obtiene todas las estadísticas registradas.

        Returns:
            Diccionario con todas las métricas
        """
        return {name: self.get_stats(name) for name in self.metrics}

    def reset(self) -> None:
        """Resetea todas las métricas."""
        self.metrics.clear()
        logger.info("Performance metrics reset")

    def log_stats(self) -> None:
        """Imprime estadísticas en los logs."""
        logger.info("=== Performance Statistics ===")
        for name, stats in self.get_all_stats().items():
            logger.info(
                f"{name}: avg={stats['average']:.2f}{stats['unit']}, "
                f"min={stats['min']:.2f}{stats['unit']}, "
                f"max={stats['max']:.2f}{stats['unit']}, "
                f"count={stats['count']}"
            )


# Instancia global del monitor
_monitor = PerformanceMonitor()


def get_monitor() -> PerformanceMonitor:
    """Obtiene la instancia global del monitor.

    Returns:
        PerformanceMonitor singleton
    """
    return _monitor


@contextmanager
def timer(metric_name: str, log_result: bool = False):
    """Context manager para medir tiempo de ejecución.

    Args:
        metric_name: Nombre de la métrica
        log_result: Si True, loguea el resultado

    Yields:
        None

    Example:
        >>> with timer("database_query"):
        ...     result = db.query(...)
    """
    start = time.perf_counter()
    try:
        yield
    finally:
        elapsed = (time.perf_counter() - start) * 1000  # Convertir a ms
        _monitor.record(metric_name, elapsed, "ms")
        if log_result:
            logger.info(f"{metric_name}: {elapsed:.2f}ms")


def measure_performance(metric_name: Optional[str] = None, log_result: bool = False):
    """Decorador para medir tiempo de ejecución de funciones.

    Args:
        metric_name: Nombre de la métrica (default: nombre de la función)
        log_result: Si True, loguea el resultado

    Returns:
        Decorador de función

    Example:
        >>> @measure_performance()
        ... def slow_function():
        ...     time.sleep(1)
    """

    def decorator(func: Callable) -> Callable:
        name = metric_name or func.__name__

        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            start = time.perf_counter()
            try:
                result = func(*args, **kwargs)
                return result
            finally:
                elapsed = (time.perf_counter() - start) * 1000
                _monitor.record(name, elapsed, "ms")
                if log_result:
                    logger.info(f"{name}: {elapsed:.2f}ms")

        return wrapper

    return decorator


class RequestTimer:
    """Context manager para medir tiempo de requests HTTP."""

    def __init__(self, request_name: str):
        """Inicializa el timer de request.

        Args:
            request_name: Nombre del request para identificar
        """
        self.request_name = request_name
        self.start_time = None
        self.end_time = None

    def __enter__(self):
        """Inicia el timer."""
        self.start_time = time.perf_counter()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Finaliza el timer y registra métrica."""
        self.end_time = time.perf_counter()
        elapsed = (self.end_time - self.start_time) * 1000

        metric_name = f"http_request_{self.request_name}"
        _monitor.record(metric_name, elapsed, "ms")

        # Loguear si el request fue lento (>1s)
        if elapsed > 1000:
            logger.warning(f"Slow request: {self.request_name} took {elapsed:.2f}ms")

        return False  # No suprimir excepciones


def log_cache_stats(func_name: str, cache_info: Any) -> None:
    """Loguea estadísticas de caché de funciones con lru_cache.

    Args:
        func_name: Nombre de la función
        cache_info: Objeto cache_info() de lru_cache
    """
    if hasattr(cache_info, "_asdict"):
        info = cache_info._asdict()
        hit_rate = (
            (info["hits"] / (info["hits"] + info["misses"]) * 100)
            if (info["hits"] + info["misses"]) > 0
            else 0
        )
        logger.info(
            f"Cache stats for {func_name}: "
            f"hits={info['hits']}, misses={info['misses']}, "
            f"hit_rate={hit_rate:.1f}%, size={info['currsize']}/{info['maxsize']}"
        )


def memory_usage_mb() -> float:
    """Obtiene el uso de memoria actual del proceso en MB.

    Returns:
        Uso de memoria en megabytes
    """
    try:
        import os

        import psutil

        process = psutil.Process(os.getpid())
        memory_mb = process.memory_info().rss / 1024 / 1024
        return memory_mb
    except ImportError:
        logger.warning("psutil not installed, cannot measure memory usage")
        return 0.0


def log_memory_usage() -> None:
    """Loguea el uso actual de memoria."""
    memory = memory_usage_mb()
    if memory > 0:
        logger.info(f"Memory usage: {memory:.2f} MB")

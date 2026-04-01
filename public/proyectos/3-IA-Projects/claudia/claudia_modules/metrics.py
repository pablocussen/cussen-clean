# claudia_modules/metrics.py
"""
Sistema de métricas y monitoreo
"""

import logging
import time
from collections import defaultdict
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class MetricsCollector:
    """Recolector de métricas para monitoreo."""

    def __init__(self):
        """Inicializa el collector."""
        self.counters: Dict[str, int] = defaultdict(int)
        self.gauges: Dict[str, float] = {}
        self.histograms: Dict[str, List[float]] = defaultdict(list)
        self.timers: Dict[str, List[float]] = defaultdict(list)
        self.start_time = time.time()

    def increment(self, metric_name: str, value: int = 1, tags: Optional[Dict] = None):
        """Incrementa un contador.

        Args:
            metric_name: Nombre de la métrica
            value: Valor a incrementar (default: 1)
            tags: Tags opcionales para agregación
        """
        key = self._build_key(metric_name, tags)
        self.counters[key] += value
        logger.debug(f"Counter incremented: {key} += {value}")

    def gauge(self, metric_name: str, value: float, tags: Optional[Dict] = None):
        """Establece un valor gauge.

        Args:
            metric_name: Nombre de la métrica
            value: Valor actual
            tags: Tags opcionales
        """
        key = self._build_key(metric_name, tags)
        self.gauges[key] = value
        logger.debug(f"Gauge set: {key} = {value}")

    def histogram(self, metric_name: str, value: float, tags: Optional[Dict] = None):
        """Agrega un valor a un histograma.

        Args:
            metric_name: Nombre de la métrica
            value: Valor a agregar
            tags: Tags opcionales
        """
        key = self._build_key(metric_name, tags)
        self.histograms[key].append(value)

        # Limitar tamaño del histograma (últimos 1000 valores)
        if len(self.histograms[key]) > 1000:
            self.histograms[key] = self.histograms[key][-1000:]

        logger.debug(f"Histogram value added: {key} = {value}")

    def timing(self, metric_name: str, duration_ms: float, tags: Optional[Dict] = None):
        """Registra una duración de tiempo.

        Args:
            metric_name: Nombre de la métrica
            duration_ms: Duración en milisegundos
            tags: Tags opcionales
        """
        key = self._build_key(metric_name, tags)
        self.timers[key].append(duration_ms)

        # Limitar tamaño (últimos 1000 valores)
        if len(self.timers[key]) > 1000:
            self.timers[key] = self.timers[key][-1000:]

        logger.debug(f"Timer recorded: {key} = {duration_ms}ms")

    def _build_key(self, metric_name: str, tags: Optional[Dict] = None) -> str:
        """Construye clave de métrica con tags.

        Args:
            metric_name: Nombre base
            tags: Tags opcionales

        Returns:
            Clave completa (ej: "requests.count{method=POST,status=200}")
        """
        if not tags:
            return metric_name

        tag_str = ",".join(f"{k}={v}" for k, v in sorted(tags.items()))
        return f"{metric_name}{{{tag_str}}}"

    def get_counter(self, metric_name: str, tags: Optional[Dict] = None) -> int:
        """Obtiene valor de un contador.

        Args:
            metric_name: Nombre de la métrica
            tags: Tags opcionales

        Returns:
            Valor del contador
        """
        key = self._build_key(metric_name, tags)
        return self.counters.get(key, 0)

    def get_gauge(self, metric_name: str, tags: Optional[Dict] = None) -> Optional[float]:
        """Obtiene valor de un gauge.

        Args:
            metric_name: Nombre de la métrica
            tags: Tags opcionales

        Returns:
            Valor del gauge o None
        """
        key = self._build_key(metric_name, tags)
        return self.gauges.get(key)

    def get_histogram_stats(
        self, metric_name: str, tags: Optional[Dict] = None
    ) -> Optional[Dict[str, float]]:
        """Obtiene estadísticas de un histograma.

        Args:
            metric_name: Nombre de la métrica
            tags: Tags opcionales

        Returns:
            Diccionario con estadísticas (min, max, avg, p50, p95, p99)
        """
        key = self._build_key(metric_name, tags)
        values = self.histograms.get(key, [])

        if not values:
            return None

        sorted_values = sorted(values)
        count = len(sorted_values)

        return {
            "count": count,
            "min": sorted_values[0],
            "max": sorted_values[-1],
            "avg": sum(sorted_values) / count,
            "p50": sorted_values[int(count * 0.50)],
            "p95": sorted_values[int(count * 0.95)],
            "p99": sorted_values[int(count * 0.99)],
        }

    def get_timer_stats(
        self, metric_name: str, tags: Optional[Dict] = None
    ) -> Optional[Dict[str, float]]:
        """Obtiene estadísticas de un timer.

        Args:
            metric_name: Nombre de la métrica
            tags: Tags opcionales

        Returns:
            Diccionario con estadísticas
        """
        key = self._build_key(metric_name, tags)
        return self.get_histogram_stats(metric_name, tags)  # Mismo cálculo

    def get_all_metrics(self) -> Dict[str, Any]:
        """Obtiene todas las métricas.

        Returns:
            Diccionario con todas las métricas y estadísticas
        """
        uptime = time.time() - self.start_time

        metrics = {
            "uptime_seconds": uptime,
            "counters": dict(self.counters),
            "gauges": dict(self.gauges),
            "histograms": {},
            "timers": {},
        }

        # Agregar estadísticas de histogramas
        for key in self.histograms:
            metrics["histograms"][key] = self.get_histogram_stats(key.split("{")[0], None)

        # Agregar estadísticas de timers
        for key in self.timers:
            metrics["timers"][key] = self.get_timer_stats(key.split("{")[0], None)

        return metrics

    def reset(self):
        """Resetea todas las métricas."""
        self.counters.clear()
        self.gauges.clear()
        self.histograms.clear()
        self.timers.clear()
        self.start_time = time.time()
        logger.info("All metrics reset")

    def log_summary(self):
        """Imprime resumen de métricas en logs."""
        logger.info("=== Metrics Summary ===")

        # Counters
        if self.counters:
            logger.info("Counters:")
            for key, value in sorted(self.counters.items()):
                logger.info(f"  {key}: {value}")

        # Gauges
        if self.gauges:
            logger.info("Gauges:")
            for key, value in sorted(self.gauges.items()):
                logger.info(f"  {key}: {value:.2f}")

        # Timers (solo promedios)
        if self.timers:
            logger.info("Timers (avg):")
            for key, values in sorted(self.timers.items()):
                if values:
                    avg = sum(values) / len(values)
                    logger.info(f"  {key}: {avg:.2f}ms")


# Instancia global
_metrics_collector = None


def get_metrics_collector() -> MetricsCollector:
    """Obtiene instancia global del collector.

    Returns:
        MetricsCollector singleton
    """
    global _metrics_collector
    if _metrics_collector is None:
        _metrics_collector = MetricsCollector()
    return _metrics_collector


# Funciones de conveniencia
def increment_counter(metric_name: str, value: int = 1, **tags):
    """Incrementa un contador (función de conveniencia).

    Args:
        metric_name: Nombre de la métrica
        value: Valor a incrementar
        **tags: Tags como kwargs
    """
    collector = get_metrics_collector()
    collector.increment(metric_name, value, tags if tags else None)


def record_timing(metric_name: str, duration_ms: float, **tags):
    """Registra un timing (función de conveniencia).

    Args:
        metric_name: Nombre de la métrica
        duration_ms: Duración en ms
        **tags: Tags como kwargs
    """
    collector = get_metrics_collector()
    collector.timing(metric_name, duration_ms, tags if tags else None)


def set_gauge(metric_name: str, value: float, **tags):
    """Establece un gauge (función de conveniencia).

    Args:
        metric_name: Nombre de la métrica
        value: Valor
        **tags: Tags como kwargs
    """
    collector = get_metrics_collector()
    collector.gauge(metric_name, value, tags if tags else None)

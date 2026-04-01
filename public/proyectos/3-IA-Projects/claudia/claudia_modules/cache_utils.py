# claudia_modules/cache_utils.py
"""
Utilidades de caching para optimizar performance
"""

import json
import logging
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def load_apu_database() -> List[Dict[str, Any]]:
    """Carga la base de datos de APUs con caching.

    La base de datos se carga una sola vez y se mantiene en memoria
    gracias al decorador lru_cache.

    Returns:
        Lista de diccionarios con APUs

    Raises:
        FileNotFoundError: Si el archivo no existe
        json.JSONDecodeError: Si el JSON es inválido
    """
    apu_path = Path("web_app/apu_database.json")

    if not apu_path.exists():
        logger.error(f"APU database not found at {apu_path}")
        raise FileNotFoundError(f"APU database not found: {apu_path}")

    try:
        with open(apu_path, "r", encoding="utf-8") as f:
            apus = json.load(f)
        logger.info(f"Loaded {len(apus)} APUs from database")
        return apus
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in APU database: {e}")
        raise


@lru_cache(maxsize=128)
def get_apu_by_id(apu_id: str) -> Optional[Dict[str, Any]]:
    """Obtiene un APU por ID con caching.

    Args:
        apu_id: ID del APU a buscar (ej: "ALB001")

    Returns:
        Diccionario con datos del APU o None si no existe
    """
    apus = load_apu_database()
    for apu in apus:
        if apu.get("id") == apu_id:
            return apu
    return None


@lru_cache(maxsize=32)
def get_apus_by_category(category: str) -> List[Dict[str, Any]]:
    """Obtiene todos los APUs de una categoría con caching.

    Args:
        category: Nombre de la categoría (ej: "ALBAÑILERÍA")

    Returns:
        Lista de APUs de la categoría especificada
    """
    apus = load_apu_database()
    return [apu for apu in apus if apu.get("categoria") == category]


@lru_cache(maxsize=1)
def get_all_categories() -> List[str]:
    """Obtiene lista de todas las categorías con caching.

    Returns:
        Lista ordenada de categorías únicas
    """
    apus = load_apu_database()
    categories = set(apu.get("categoria", "Sin categoría") for apu in apus)
    return sorted(categories)


@lru_cache(maxsize=256)
def search_apus(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    """Busca APUs por nombre o descripción con caching.

    Args:
        query: Texto a buscar (case-insensitive)
        limit: Máximo número de resultados

    Returns:
        Lista de APUs que coinciden con la búsqueda
    """
    apus = load_apu_database()
    query_lower = query.lower()

    results = []
    for apu in apus:
        nombre = apu.get("nombre", "").lower()
        if query_lower in nombre:
            results.append(apu)
            if len(results) >= limit:
                break

    logger.debug(f"Search '{query}' returned {len(results)} results")
    return results


def clear_cache() -> None:
    """Limpia todas las cachés de APUs.

    Útil cuando se actualiza la base de datos de APUs.
    """
    load_apu_database.cache_clear()
    get_apu_by_id.cache_clear()
    get_apus_by_category.cache_clear()
    get_all_categories.cache_clear()
    search_apus.cache_clear()
    logger.info("All APU caches cleared")


def get_cache_info() -> Dict[str, Any]:
    """Obtiene información sobre el estado de las cachés.

    Returns:
        Diccionario con estadísticas de cada caché
    """
    return {
        "load_apu_database": load_apu_database.cache_info()._asdict(),
        "get_apu_by_id": get_apu_by_id.cache_info()._asdict(),
        "get_apus_by_category": get_apus_by_category.cache_info()._asdict(),
        "get_all_categories": get_all_categories.cache_info()._asdict(),
        "search_apus": search_apus.cache_info()._asdict(),
    }

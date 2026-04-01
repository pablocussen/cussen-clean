# claudia_modules/sodimac_scraper.py
"""
Módulo para scraping del catálogo de Sodimac Chile
Extrae información de productos de construcción
"""

import json
import logging
import re
import time
from typing import Dict, List, Optional

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


class SodimacScraper:
    """Scraper para el catálogo de Sodimac Chile"""

    BASE_URL = "https://sodimac.falabella.com"
    HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "es-CL,es;q=0.9,en;q=0.8",
    }

    # Categorías principales de construcción
    CATEGORIES = {
        "materiales_obra_gruesa": "CATG10753",
        "cemento_hormigon": "cat7040124",
        "fierro_mallas": "cat13300024",
        "ladrillos_bloques": "cat3640066",
        "arena_ripio": "cat3640068",
        "madera_construccion": "cat40073",
        "tuberia_pvc": "cat70090",
        "cables_electricos": "cat70300",
        "pintura_construccion": "cat3100046",
        "herramientas": "CATG10734",
    }

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update(self.HEADERS)

    def _make_request(self, url: str, max_retries: int = 3) -> Optional[requests.Response]:
        """Realiza petición HTTP con reintentos"""
        for attempt in range(max_retries):
            try:
                response = self.session.get(url, timeout=15)
                response.raise_for_status()
                time.sleep(1)  # Rate limiting
                return response
            except requests.exceptions.RequestException as e:
                logger.warning(f"Intento {attempt + 1}/{max_retries} falló para {url}: {e}")
                if attempt < max_retries - 1:
                    time.sleep(2**attempt)  # Backoff exponencial
                else:
                    logger.error(f"Falló scraping de {url} después de {max_retries} intentos")
                    return None
        return None

    def search_product(self, query: str, limit: int = 10) -> List[Dict]:
        """
        Busca productos en Sodimac

        Args:
            query: Término de búsqueda (ej: "cemento", "ladrillo")
            limit: Máximo número de resultados

        Returns:
            Lista de productos encontrados
        """
        # URL de búsqueda de Sodimac
        search_url = f"{self.BASE_URL}/sodimac-cl/search?Ntt={query.replace(' ', '+')}"

        response = self._make_request(search_url)
        if not response:
            return []

        soup = BeautifulSoup(response.text, "html.parser")
        products = []

        # Buscar productos en el HTML (estructura puede variar)
        product_elements = soup.find_all("div", class_=re.compile("pod-"), limit=limit)

        for element in product_elements:
            try:
                product = self._parse_product_element(element)
                if product:
                    products.append(product)
            except Exception as e:
                logger.warning(f"Error parseando producto: {e}")
                continue

        logger.info(f"Encontrados {len(products)} productos para '{query}'")
        return products

    def _parse_product_element(self, element) -> Optional[Dict]:
        """Parsea un elemento HTML de producto"""
        try:
            # Intentar extraer información (estructura aproximada)
            name_elem = element.find("b", class_="pod-subTitle")
            price_elem = element.find("span", class_=re.compile("price"))
            sku_elem = element.find("div", {"data-sku": True})

            if not name_elem:
                return None

            product = {
                "name": name_elem.text.strip() if name_elem else "Sin nombre",
                "sku": sku_elem.get("data-sku", "") if sku_elem else "",
                "price": self._extract_price(price_elem.text) if price_elem else 0,
                "url": self._extract_product_url(element),
                "image_url": self._extract_image_url(element),
                "source": "sodimac",
            }

            return product
        except Exception as e:
            logger.debug(f"Error en _parse_product_element: {e}")
            return None

    def _extract_price(self, price_text: str) -> float:
        """Extrae precio numérico del texto"""
        try:
            # Remover símbolos y convertir a float
            price_clean = re.sub(r"[^\d,]", "", price_text)
            price_clean = price_clean.replace(",", ".")
            return float(price_clean) if price_clean else 0.0
        except:
            return 0.0

    def _extract_product_url(self, element) -> str:
        """Extrae URL del producto"""
        link = element.find("a", href=True)
        if link:
            href = link["href"]
            if href.startswith("http"):
                return href
            else:
                return f"{self.BASE_URL}{href}"
        return ""

    def _extract_image_url(self, element) -> str:
        """Extrae URL de imagen del producto"""
        img = element.find("img", src=True)
        return img["src"] if img else ""

    def get_category_products(self, category_key: str, limit: int = 20) -> List[Dict]:
        """
        Obtiene productos de una categoría específica

        Args:
            category_key: Clave de categoría (ver CATEGORIES)
            limit: Máximo número de productos

        Returns:
            Lista de productos
        """
        if category_key not in self.CATEGORIES:
            logger.error(f"Categoría '{category_key}' no existe")
            return []

        category_id = self.CATEGORIES[category_key]
        category_url = f"{self.BASE_URL}/sodimac-cl/category/{category_id}"

        response = self._make_request(category_url)
        if not response:
            return []

        soup = BeautifulSoup(response.text, "html.parser")
        products = []

        product_elements = soup.find_all("div", class_=re.compile("pod-"), limit=limit)

        for element in product_elements:
            try:
                product = self._parse_product_element(element)
                if product:
                    product["category"] = category_key
                    products.append(product)
            except Exception as e:
                logger.warning(f"Error parseando producto de categoría: {e}")
                continue

        logger.info(f"Extraídos {len(products)} productos de categoría '{category_key}'")
        return products


# Funciones de utilidad para uso externo
def search_materials(material_name: str, limit: int = 5) -> List[Dict]:
    """
    Función helper para buscar materiales rápidamente

    Args:
        material_name: Nombre del material (ej: "cemento", "fierro")
        limit: Número máximo de resultados

    Returns:
        Lista de productos encontrados
    """
    scraper = SodimacScraper()
    return scraper.search_product(material_name, limit=limit)


def get_construction_materials() -> Dict[str, List[Dict]]:
    """
    Obtiene productos clave de construcción de todas las categorías

    Returns:
        Diccionario con productos por categoría
    """
    scraper = SodimacScraper()
    all_products = {}

    for category_key in scraper.CATEGORIES.keys():
        logger.info(f"Scrapeando categoría: {category_key}")
        products = scraper.get_category_products(category_key, limit=10)
        all_products[category_key] = products
        time.sleep(2)  # Rate limiting entre categorías

    return all_products


if __name__ == "__main__":
    # Testing
    logging.basicConfig(level=logging.INFO)

    print("🔍 Buscando cemento...")
    cemento = search_materials("cemento", limit=3)
    print(json.dumps(cemento, indent=2, ensure_ascii=False))

    print("\n🔍 Buscando ladrillos...")
    ladrillos = search_materials("ladrillo", limit=3)
    print(json.dumps(ladrillos, indent=2, ensure_ascii=False))

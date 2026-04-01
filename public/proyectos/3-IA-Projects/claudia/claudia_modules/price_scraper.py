"""
CLAUDIA v6.4 - Price Scraper
Scraping de precios de materiales de construcción de proveedores chilenos
Sodimac, Easy, Homecenter, Constructor, Imperial, Hites
"""

import json
import re
import time
from typing import Dict, List, Optional

import requests
from bs4 import BeautifulSoup


class PriceScraper:
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "es-CL,es;q=0.9,en;q=0.8",
        }

        self.stores = {
            "sodimac": {
                "name": "Sodimac",
                "url": "https://www.sodimac.cl",
                "search_url": "https://www.sodimac.cl/sodimac-cl/search/?Ntt={query}",
                "logo": "🟠",
            },
            "easy": {
                "name": "Easy",
                "url": "https://www.easy.cl",
                "search_url": "https://www.easy.cl/easy-cl/search?Ntt={query}",
                "logo": "🟢",
            },
            "homecenter": {
                "name": "Homecenter",
                "url": "https://www.homecenter.cl",
                "search_url": "https://www.homecenter.cl/homecenter-cl/search/?Ntt={query}",
                "logo": "🔵",
            },
            "constructor": {
                "name": "Constructor",
                "url": "https://www.constructor.cl",
                "search_url": "https://www.constructor.cl/busqueda?query={query}",
                "logo": "🔴",
            },
            "imperial": {
                "name": "Imperial",
                "url": "https://www.imperial.cl",
                "search_url": "https://www.imperial.cl/buscar?q={query}",
                "logo": "🟡",
            },
            "hites": {
                "name": "Hites",
                "url": "https://www.hites.com",
                "search_url": "https://www.hites.com/search?q={query}",
                "logo": "🟣",
            },
        }

    def clean_price(self, price_text: str) -> Optional[int]:
        """Limpia y convierte precio a número"""
        if not price_text:
            return None

        # Remover todo excepto números
        price_clean = re.sub(r"[^\d]", "", price_text)

        try:
            return int(price_clean)
        except ValueError:
            return None

    def search_sodimac(self, query: str, max_results: int = 3) -> List[Dict]:
        """Busca productos en Sodimac"""
        results = []

        try:
            search_url = self.stores["sodimac"]["search_url"].format(query=query.replace(" ", "+"))
            response = requests.get(search_url, headers=self.headers, timeout=10)

            if response.status_code != 200:
                return results

            soup = BeautifulSoup(response.content, "html.parser")

            # Buscar productos (adaptable según estructura actual)
            products = soup.find_all("div", class_="jsx-1872026697 product-item", limit=max_results)

            if not products:
                # Intentar otro selector
                products = soup.find_all("article", class_="product", limit=max_results)

            for product in products:
                try:
                    # Extraer nombre
                    name_elem = product.find("span", class_="jsx-1872026697 product-title")
                    if not name_elem:
                        name_elem = product.find("h3") or product.find("h2")

                    # Extraer precio
                    price_elem = product.find("span", class_="jsx-1872026697 copy16-medium-default")
                    if not price_elem:
                        price_elem = product.find("span", class_="price")

                    # Extraer link
                    link_elem = product.find("a", href=True)

                    if name_elem and price_elem:
                        name = name_elem.get_text(strip=True)
                        price = self.clean_price(price_elem.get_text(strip=True))
                        link = link_elem["href"] if link_elem else ""

                        if not link.startswith("http"):
                            link = self.stores["sodimac"]["url"] + link

                        if price:
                            results.append(
                                {
                                    "store": "Sodimac",
                                    "logo": "🟠",
                                    "name": name,
                                    "price": price,
                                    "link": link,
                                }
                            )
                except Exception as e:
                    continue

        except Exception as e:
            print(f"Error scraping Sodimac: {e}")

        return results

    def search_easy(self, query: str, max_results: int = 3) -> List[Dict]:
        """Busca productos en Easy"""
        results = []

        try:
            search_url = self.stores["easy"]["search_url"].format(query=query.replace(" ", "+"))
            response = requests.get(search_url, headers=self.headers, timeout=10)

            if response.status_code != 200:
                return results

            soup = BeautifulSoup(response.content, "html.parser")

            # Buscar productos
            products = soup.find_all("div", class_="product-item", limit=max_results)

            if not products:
                products = soup.find_all("article", limit=max_results)

            for product in products:
                try:
                    name_elem = (
                        product.find("h3")
                        or product.find("h2")
                        or product.find("span", class_="title")
                    )
                    price_elem = product.find("span", class_="price") or product.find(
                        "div", class_="price"
                    )
                    link_elem = product.find("a", href=True)

                    if name_elem and price_elem:
                        name = name_elem.get_text(strip=True)
                        price = self.clean_price(price_elem.get_text(strip=True))
                        link = link_elem["href"] if link_elem else ""

                        if not link.startswith("http"):
                            link = self.stores["easy"]["url"] + link

                        if price:
                            results.append(
                                {
                                    "store": "Easy",
                                    "logo": "🟢",
                                    "name": name,
                                    "price": price,
                                    "link": link,
                                }
                            )
                except Exception as e:
                    continue

        except Exception as e:
            print(f"Error scraping Easy: {e}")

        return results

    def search_homecenter(self, query: str, max_results: int = 3) -> List[Dict]:
        """Busca productos en Homecenter"""
        results = []

        try:
            search_url = self.stores["homecenter"]["search_url"].format(
                query=query.replace(" ", "+")
            )
            response = requests.get(search_url, headers=self.headers, timeout=10)

            if response.status_code != 200:
                return results

            soup = BeautifulSoup(response.content, "html.parser")

            products = soup.find_all("div", class_="product", limit=max_results)

            for product in products:
                try:
                    name_elem = product.find("h3") or product.find("h2")
                    price_elem = product.find("span", class_="price")
                    link_elem = product.find("a", href=True)

                    if name_elem and price_elem:
                        name = name_elem.get_text(strip=True)
                        price = self.clean_price(price_elem.get_text(strip=True))
                        link = link_elem["href"] if link_elem else ""

                        if not link.startswith("http"):
                            link = self.stores["homecenter"]["url"] + link

                        if price:
                            results.append(
                                {
                                    "store": "Homecenter",
                                    "logo": "🔵",
                                    "name": name,
                                    "price": price,
                                    "link": link,
                                }
                            )
                except Exception as e:
                    continue

        except Exception as e:
            print(f"Error scraping Homecenter: {e}")

        return results

    def search_constructor(self, query: str, max_results: int = 3) -> List[Dict]:
        """Busca productos en Constructor"""
        results = []

        try:
            search_url = self.stores["constructor"]["search_url"].format(
                query=query.replace(" ", "+")
            )
            response = requests.get(search_url, headers=self.headers, timeout=10)

            if response.status_code != 200:
                return results

            soup = BeautifulSoup(response.content, "html.parser")

            products = soup.find_all("div", class_="product-item", limit=max_results)

            if not products:
                products = soup.find_all("article", class_="product", limit=max_results)

            for product in products:
                try:
                    name_elem = (
                        product.find("h3")
                        or product.find("h2")
                        or product.find("span", class_="name")
                    )
                    price_elem = product.find("span", class_="price") or product.find(
                        "div", class_="price"
                    )
                    link_elem = product.find("a", href=True)

                    if name_elem and price_elem:
                        name = name_elem.get_text(strip=True)
                        price = self.clean_price(price_elem.get_text(strip=True))
                        link = link_elem["href"] if link_elem else ""

                        if not link.startswith("http"):
                            link = self.stores["constructor"]["url"] + link

                        if price:
                            results.append(
                                {
                                    "store": "Constructor",
                                    "logo": "🔴",
                                    "name": name,
                                    "price": price,
                                    "link": link,
                                }
                            )
                except Exception as e:
                    continue

        except Exception as e:
            print(f"Error scraping Constructor: {e}")

        return results

    def search_imperial(self, query: str, max_results: int = 3) -> List[Dict]:
        """Busca productos en Imperial"""
        results = []

        try:
            search_url = self.stores["imperial"]["search_url"].format(query=query.replace(" ", "+"))
            response = requests.get(search_url, headers=self.headers, timeout=10)

            if response.status_code != 200:
                return results

            soup = BeautifulSoup(response.content, "html.parser")

            products = soup.find_all("div", class_="product-card", limit=max_results)

            if not products:
                products = soup.find_all("div", class_="product", limit=max_results)

            for product in products:
                try:
                    name_elem = (
                        product.find("h3")
                        or product.find("h2")
                        or product.find("span", class_="title")
                    )
                    price_elem = product.find("span", class_="price") or product.find(
                        "div", class_="price"
                    )
                    link_elem = product.find("a", href=True)

                    if name_elem and price_elem:
                        name = name_elem.get_text(strip=True)
                        price = self.clean_price(price_elem.get_text(strip=True))
                        link = link_elem["href"] if link_elem else ""

                        if not link.startswith("http"):
                            link = self.stores["imperial"]["url"] + link

                        if price:
                            results.append(
                                {
                                    "store": "Imperial",
                                    "logo": "🟡",
                                    "name": name,
                                    "price": price,
                                    "link": link,
                                }
                            )
                except Exception as e:
                    continue

        except Exception as e:
            print(f"Error scraping Imperial: {e}")

        return results

    def search_hites(self, query: str, max_results: int = 3) -> List[Dict]:
        """Busca productos en Hites"""
        results = []

        try:
            search_url = self.stores["hites"]["search_url"].format(query=query.replace(" ", "+"))
            response = requests.get(search_url, headers=self.headers, timeout=10)

            if response.status_code != 200:
                return results

            soup = BeautifulSoup(response.content, "html.parser")

            products = soup.find_all("div", class_="product-grid-item", limit=max_results)

            if not products:
                products = soup.find_all("article", limit=max_results)

            for product in products:
                try:
                    name_elem = (
                        product.find("h3")
                        or product.find("h2")
                        or product.find("div", class_="name")
                    )
                    price_elem = product.find("span", class_="price") or product.find(
                        "div", class_="price"
                    )
                    link_elem = product.find("a", href=True)

                    if name_elem and price_elem:
                        name = name_elem.get_text(strip=True)
                        price = self.clean_price(price_elem.get_text(strip=True))
                        link = link_elem["href"] if link_elem else ""

                        if not link.startswith("http"):
                            link = self.stores["hites"]["url"] + link

                        if price:
                            results.append(
                                {
                                    "store": "Hites",
                                    "logo": "🟣",
                                    "name": name,
                                    "price": price,
                                    "link": link,
                                }
                            )
                except Exception as e:
                    continue

        except Exception as e:
            print(f"Error scraping Hites: {e}")

        return results

    def compare_prices(self, query: str) -> Dict:
        """Compara precios entre todos los proveedores (6 tiendas)"""
        print(f"🔍 Buscando: {query}")

        all_results = []

        # Buscar en Sodimac
        sodimac_results = self.search_sodimac(query)
        all_results.extend(sodimac_results)
        time.sleep(1)  # Respetar rate limiting

        # Buscar en Easy
        easy_results = self.search_easy(query)
        all_results.extend(easy_results)
        time.sleep(1)

        # Buscar en Homecenter
        homecenter_results = self.search_homecenter(query)
        all_results.extend(homecenter_results)
        time.sleep(1)

        # Buscar en Constructor
        constructor_results = self.search_constructor(query)
        all_results.extend(constructor_results)
        time.sleep(1)

        # Buscar en Imperial
        imperial_results = self.search_imperial(query)
        all_results.extend(imperial_results)
        time.sleep(1)

        # Buscar en Hites
        hites_results = self.search_hites(query)
        all_results.extend(hites_results)

        if not all_results:
            return {"query": query, "found": False, "results": [], "best_price": None, "savings": 0}

        # Ordenar por precio
        all_results.sort(key=lambda x: x["price"])

        # Calcular ahorro
        best = all_results[0]
        worst = all_results[-1]
        savings = worst["price"] - best["price"]
        savings_percent = round((savings / worst["price"]) * 100, 1) if worst["price"] > 0 else 0

        return {
            "query": query,
            "found": True,
            "results": all_results,
            "best_price": best,
            "worst_price": worst,
            "savings": savings,
            "savings_percent": savings_percent,
            "total_found": len(all_results),
        }

    def search_material(self, material_name: str) -> Dict:
        """Wrapper para búsqueda individual de material"""
        return self.compare_prices(material_name)


def main():
    """Testing del scraper"""
    scraper = PriceScraper()

    # Materiales de prueba
    test_materials = ["cemento", "radier", "fierro redondo", "pintura latex", "arena"]

    results = {}

    for material in test_materials:
        print(f"\n{'='*60}")
        comparison = scraper.compare_prices(material)
        results[material] = comparison

        if comparison["found"]:
            print(f"✅ {material.upper()}")
            print(
                f"   Mejor precio: ${comparison['best_price']['price']:,} en {comparison['best_price']['store']}"
            )
            print(f"   Ahorro: ${comparison['savings']:,} ({comparison['savings_percent']}%)")
            print(f"   Resultados: {comparison['total_found']}")
        else:
            print(f"❌ {material.upper()} - No encontrado")

        time.sleep(2)  # Rate limiting

    # Guardar resultados
    with open("price_comparison_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"\n{'='*60}")
    print("✅ Resultados guardados en price_comparison_results.json")


if __name__ == "__main__":
    main()

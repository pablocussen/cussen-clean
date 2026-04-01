"""
CLAUDIA v6.2 - Price Comparison API
API Flask para comparación de precios en tiempo real
"""

import os

from flask import Flask, jsonify, request
from flask_cors import CORS

from claudia_modules.price_scraper import PriceScraper

app = Flask(__name__)
CORS(app)  # Permitir requests desde la webapp

scraper = PriceScraper()


@app.route("/api/health", methods=["GET"])
def health():
    """Health check"""
    return jsonify({"status": "ok", "service": "CLAUDIA Price Comparison API", "version": "6.2.0"})


@app.route("/api/compare/<material>", methods=["GET"])
def compare_material(material):
    """
    Compara precios de un material en todos los proveedores

    Ejemplo: /api/compare/cemento
    """
    try:
        result = scraper.compare_prices(material)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e), "material": material}), 500


@app.route("/api/search", methods=["POST"])
def search_materials():
    """
    Busca múltiples materiales

    Body: {
        "materials": ["cemento", "arena", "fierro"]
    }
    """
    try:
        data = request.get_json()
        materials = data.get("materials", [])

        if not materials:
            return jsonify({"error": "No materials provided"}), 400

        results = {}
        for material in materials[:5]:  # Límite de 5 por request
            results[material] = scraper.compare_prices(material)

        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/best-price/<material>", methods=["GET"])
def get_best_price(material):
    """
    Obtiene solo el mejor precio de un material

    Ejemplo: /api/best-price/radier
    """
    try:
        comparison = scraper.compare_prices(material)

        if not comparison["found"]:
            return jsonify({"found": False, "material": material}), 404

        return jsonify(
            {
                "found": True,
                "material": material,
                "best_price": comparison["best_price"],
                "savings": comparison["savings"],
                "savings_percent": comparison["savings_percent"],
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)

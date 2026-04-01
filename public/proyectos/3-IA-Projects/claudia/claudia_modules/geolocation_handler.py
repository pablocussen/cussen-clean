# claudia_modules/geolocation_handler.py
import json
import re
from typing import Dict, Optional, Tuple

import requests


class GeolocationHandler:
    """Maneja la captura y procesamiento de datos de geolocalización"""

    def __init__(self):
        # Geocoding API de Google (opcional, para validar direcciones)
        self.geocoding_enabled = False

        # Patrones para detectar ubicaciones en texto libre
        self.location_patterns = [
            r"(?:en|de|desde|cerca de|por)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]+(?:plaza|calle|avenida|pasaje|barrio|sector|villa|población))",
            r"(plaza|calle|avenida|pasaje|barrio|sector|villa|población)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]+)",
            r"([A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]+)\s+(?:con|esquina)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]+)",
        ]

        # Zonas comunes de Puerto Montt (tu ciudad)
        self.known_locations = {
            "centro": {"lat": -41.4693, "lng": -72.9424, "zone": "Centro"},
            "plaza de armas": {"lat": -41.4689, "lng": -72.9420, "zone": "Centro"},
            "costanera": {"lat": -41.4702, "lng": -72.9385, "zone": "Costanera"},
            "pelluco": {"lat": -41.4456, "lng": -72.9123, "zone": "Pelluco"},
            "alerce": {"lat": -41.3925, "lng": -72.8456, "zone": "Alerce"},
            "mirasol": {"lat": -41.4523, "lng": -72.8789, "zone": "Mirasol"},
            "chamiza": {"lat": -41.5123, "lng": -72.8945, "zone": "Chamiza"},
        }

    def extract_location_from_text(self, text: str) -> Dict:
        """Extrae información de ubicación del texto libre"""
        text_lower = text.lower()

        # Buscar ubicaciones conocidas
        for location, coords in self.known_locations.items():
            if location in text_lower:
                return {
                    "type": "known_location",
                    "location_text": location.title(),
                    "coordinates": {"latitude": coords["lat"], "longitude": coords["lng"]},
                    "zone": coords["zone"],
                    "confidence": 0.9,
                }

        # Buscar patrones de ubicación
        for pattern in self.location_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                location_text = (
                    match.group(1)
                    if len(match.groups()) == 1
                    else f"{match.group(1)} {match.group(2)}"
                )
                return {
                    "type": "pattern_match",
                    "location_text": location_text.strip(),
                    "coordinates": None,  # Se puede geocodificar después
                    "zone": "Puerto Montt",  # Default
                    "confidence": 0.7,
                }

        return {
            "type": "no_location",
            "location_text": "Puerto Montt (genérico)",
            "coordinates": {"latitude": -41.4693, "longitude": -72.9424},
            "zone": "Puerto Montt",
            "confidence": 0.3,
        }

    def process_telegram_location(self, location_data: Dict) -> Dict:
        """Procesa ubicación enviada directamente por Telegram"""
        return {
            "type": "telegram_gps",
            "location_text": f"Ubicación GPS ({location_data['latitude']:.4f}, {location_data['longitude']:.4f})",
            "coordinates": {
                "latitude": location_data["latitude"],
                "longitude": location_data["longitude"],
            },
            "zone": self._get_zone_from_coordinates(
                location_data["latitude"], location_data["longitude"]
            ),
            "confidence": 1.0,
        }

    def _get_zone_from_coordinates(self, lat: float, lng: float) -> str:
        """Determina la zona basada en coordenadas"""
        # Lógica simple para determinar zona en Puerto Montt
        if lat > -41.45:
            return "Norte"
        elif lat > -41.48:
            return "Centro"
        else:
            return "Sur"

    def create_location_keyboard(self) -> Dict:
        """Crea teclado para solicitar ubicación"""
        return {
            "keyboard": [
                [{"text": "📍 Enviar mi ubicación", "request_location": True}],
                [{"text": "✍️ Escribir dirección"}],
                [{"text": "❌ Saltar ubicación"}],
            ],
            "resize_keyboard": True,
            "one_time_keyboard": True,
        }


import json
from datetime import datetime

from .ai_core import AIProcessor
from .firestore_manager import FirestoreManager

# claudia_modules/enhanced_handlers.py - Actualización del handler principal
from .geolocation_handler import GeolocationHandler


class EnhancedReportHandler:
    """Handler mejorado para reportes con geolocalización"""

    def __init__(self):
        self.geo_handler = GeolocationHandler()
        self.ai_processor = AIProcessor()
        self.db_manager = FirestoreManager()

        # Estados de conversación para captura de ubicación
        self.user_states = {}

    def process_report_with_location(self, update: Dict) -> Dict:
        """Procesa reporte ciudadano con captura inteligente de ubicación"""
        user_id = update["message"]["from"]["id"]
        chat_id = update["message"]["chat"]["id"]

        # Si es una ubicación de Telegram
        if "location" in update["message"]:
            return self._handle_telegram_location(update)

        # Si es texto libre
        text = update["message"].get("text", "")

        # Verificar si el usuario está en proceso de reporte
        user_state = self.user_states.get(user_id, {})

        if user_state.get("waiting_for_location"):
            return self._handle_location_text(update, user_state)

        # Nuevo reporte - procesar con IA
        return self._start_new_report(update)

    def _start_new_report(self, update: Dict) -> Dict:
        """Inicia un nuevo reporte con análisis de IA"""
        user_id = update["message"]["from"]["id"]
        chat_id = update["message"]["chat"]["id"]
        text = update["message"]["text"]

        # Análisis con IA
        ai_analysis = self.ai_processor.analyze_citizen_report(text)

        # Extracción de ubicación del texto
        location_data = self.geo_handler.extract_location_from_text(text)

        # Crear objeto de reporte
        report_data = {
            "user_id": user_id,
            "raw_text": text,
            "topic": ai_analysis.get("topic", "general"),
            "urgency": ai_analysis.get("urgency", "media"),
            "sentiment": ai_analysis.get("sentiment", 0.0),
            "location_data": location_data,
            "created_at": datetime.now().isoformat(),
            "status": "PENDING",
            "source": "telegram",
        }

        # Si la ubicación es de baja confianza, solicitar más detalles
        if location_data["confidence"] < 0.6:
            self.user_states[user_id] = {
                "waiting_for_location": True,
                "temp_report": report_data,
                "step": "location_request",
            }

            return {
                "chat_id": chat_id,
                "text": f"📋 *Reporte recibido*\n\n"
                f"🎯 **Tema:** {ai_analysis.get('topic', 'general').title()}\n"
                f"⚠️ **Urgencia:** {ai_analysis.get('urgency', 'media').title()}\n\n"
                f"📍 Para ubicar mejor el problema, ¿podrías ser más específico con la ubicación?\n\n"
                f"💡 Puedes enviar tu ubicación GPS o escribir la dirección exacta.",
                "parse_mode": "Markdown",
                "reply_markup": self.geo_handler.create_location_keyboard(),
            }

        # Ubicación suficientemente buena - guardar reporte
        return self._save_and_confirm_report(report_data, chat_id)

    def _handle_telegram_location(self, update: Dict) -> Dict:
        """Maneja ubicación GPS enviada por Telegram"""
        user_id = update["message"]["from"]["id"]
        chat_id = update["message"]["chat"]["id"]
        location = update["message"]["location"]

        # Procesar ubicación GPS
        location_data = self.geo_handler.process_telegram_location(location)

        # Verificar si hay reporte pendiente
        user_state = self.user_states.get(user_id, {})
        if user_state.get("temp_report"):
            # Actualizar reporte con ubicación precisa
            report_data = user_state["temp_report"]
            report_data["location_data"] = location_data

            # Limpiar estado del usuario
            del self.user_states[user_id]

            return self._save_and_confirm_report(report_data, chat_id)

        return {
            "chat_id": chat_id,
            "text": "📍 Ubicación recibida. Por favor, describe el problema que quieres reportar.",
            "reply_markup": {"remove_keyboard": True},
        }

    def _handle_location_text(self, update: Dict, user_state: Dict) -> Dict:
        """Maneja dirección escrita como texto"""
        user_id = update["message"]["from"]["id"]
        chat_id = update["message"]["chat"]["id"]
        text = update["message"]["text"]

        if text == "❌ Saltar ubicación":
            # Usar ubicación genérica
            report_data = user_state["temp_report"]
            del self.user_states[user_id]
            return self._save_and_confirm_report(report_data, chat_id)

        # Re-analizar ubicación con el nuevo texto
        location_data = self.geo_handler.extract_location_from_text(text)

        # Actualizar reporte
        report_data = user_state["temp_report"]
        report_data["location_data"] = location_data
        report_data["location_data"]["user_provided"] = text

        # Limpiar estado
        del self.user_states[user_id]

        return self._save_and_confirm_report(report_data, chat_id)

    def _save_and_confirm_report(self, report_data: Dict, chat_id: int) -> Dict:
        """Guarda el reporte en Firestore y envía confirmación"""
        try:
            # Guardar en Firestore
            doc_ref = self.db_manager.create_report(report_data)

            # Crear mensaje de confirmación
            location_info = report_data["location_data"]
            confidence_emoji = (
                "🎯"
                if location_info["confidence"] > 0.8
                else "📍"
                if location_info["confidence"] > 0.5
                else "📌"
            )

            confirmation_text = (
                f"✅ *Reporte guardado exitosamente*\n\n"
                f"🆔 **ID:** {doc_ref.id[:8]}...\n"
                f"🎯 **Tema:** {report_data['topic'].title()}\n"
                f"⚠️ **Urgencia:** {report_data['urgency'].title()}\n"
                f"{confidence_emoji} **Ubicación:** {location_info['location_text']}\n"
                f"🏘️ **Zona:** {location_info['zone']}\n\n"
                f"📬 Tu reporte ha sido enviado a las autoridades correspondientes. "
                f"Te notificaremos cuando haya actualizaciones.\n\n"
                f"🔍 Puedes ver el estado escribiendo: `/reporte {doc_ref.id[:8]}`"
            )

            return {
                "chat_id": chat_id,
                "text": confirmation_text,
                "parse_mode": "Markdown",
                "reply_markup": {"remove_keyboard": True},
            }

        except Exception as e:
            return {
                "chat_id": chat_id,
                "text": f"❌ Error al guardar el reporte: {str(e)}\n\nPor favor, intenta nuevamente.",
                "reply_markup": {"remove_keyboard": True},
            }

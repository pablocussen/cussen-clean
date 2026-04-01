# claudia_modules/firestore_manager.py - Versión expandida con geolocalización
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from google.cloud import firestore
from google.cloud.firestore_v1 import GeoPoint


class FirestoreManager:
    """Gestor de Firestore con capacidades geoespaciales"""

    def __init__(self):
        self.db = firestore.Client()
        self.reports_collection = "reports"
        self.users_collection = "users"
        self.zones_collection = "zones"
        self.analytics_collection = "analytics"

    def create_report_with_geolocation(self, report_data: Dict) -> firestore.DocumentReference:
        """Crea un reporte con datos de geolocalización"""

        # Preparar datos con formato Firestore
        firestore_data = {
            "user_id": report_data["user_id"],
            "raw_text": report_data["raw_text"],
            "topic": report_data["topic"],
            "urgency": report_data["urgency"],
            "sentiment": report_data.get("sentiment", 0.0),
            "status": report_data.get("status", "PENDING"),
            "source": report_data.get("source", "telegram"),
            "created_at": firestore.SERVER_TIMESTAMP,
            "updated_at": firestore.SERVER_TIMESTAMP,
            # Datos de ubicación
            "location_text": report_data["location_data"]["location_text"],
            "location_type": report_data["location_data"]["type"],
            "location_confidence": report_data["location_data"]["confidence"],
            "zone": report_data["location_data"]["zone"],
        }

        # Agregar coordenadas si están disponibles
        if report_data["location_data"]["coordinates"]:
            coords = report_data["location_data"]["coordinates"]
            firestore_data["coordinates"] = GeoPoint(
                latitude=coords["latitude"], longitude=coords["longitude"]
            )
            firestore_data["has_coordinates"] = True
        else:
            firestore_data["has_coordinates"] = False

        # Agregar metadatos adicionales
        if "user_provided" in report_data["location_data"]:
            firestore_data["user_provided_location"] = report_data["location_data"]["user_provided"]

        # Guardar en Firestore
        doc_ref = self.db.collection(self.reports_collection).add(firestore_data)[1]

        # Actualizar estadísticas de zona
        self._update_zone_analytics(report_data["location_data"]["zone"], report_data["topic"])

        return doc_ref

    def get_reports_by_zone(self, zone: str, limit: int = 50) -> List[Dict]:
        """Obtiene reportes por zona geográfica"""
        query = (
            self.db.collection(self.reports_collection)
            .where("zone", "==", zone)
            .order_by("created_at", direction=firestore.Query.DESCENDING)
            .limit(limit)
        )

        reports = []
        for doc in query.stream():
            data = doc.to_dict()
            data["id"] = doc.id

            # Convertir GeoPoint a dict para serialización
            if "coordinates" in data and data["coordinates"]:
                data["coordinates"] = {
                    "latitude": data["coordinates"].latitude,
                    "longitude": data["coordinates"].longitude,
                }

            reports.append(data)

        return reports

    def get_reports_in_radius(
        self, center_lat: float, center_lng: float, radius_km: float
    ) -> List[Dict]:
        """Obtiene reportes dentro de un radio específico"""
        # Nota: Firestore no soporta queries geoespaciales nativas complejas
        # Esta es una implementación simplificada que filtra después de la consulta

        # Calcular bounds aproximados
        lat_delta = radius_km / 111.0  # 1 grado ≈ 111 km
        lng_delta = radius_km / (111.0 * abs(center_lat))

        min_lat = center_lat - lat_delta
        max_lat = center_lat + lat_delta
        min_lng = center_lng - lng_delta
        max_lng = center_lng + lng_delta

        # Query con bounds aproximados
        query = (
            self.db.collection(self.reports_collection)
            .where("has_coordinates", "==", True)
            .order_by("created_at", direction=firestore.Query.DESCENDING)
        )

        reports = []
        for doc in query.stream():
            data = doc.to_dict()

            if "coordinates" in data and data["coordinates"]:
                lat = data["coordinates"].latitude
                lng = data["coordinates"].longitude

                # Verificar si está dentro del radio (cálculo aproximado)
                distance = self._calculate_distance(center_lat, center_lng, lat, lng)

                if distance <= radius_km:
                    data["id"] = doc.id
                    data["distance_km"] = round(distance, 2)
                    data["coordinates"] = {"latitude": lat, "longitude": lng}
                    reports.append(data)

        return sorted(reports, key=lambda x: x["distance_km"])

    def get_heatmap_data(self, days_back: int = 30) -> List[Dict]:
        """Obtiene datos para generar mapa de calor"""
        cutoff_date = datetime.now() - timedelta(days=days_back)

        query = (
            self.db.collection(self.reports_collection)
            .where("has_coordinates", "==", True)
            .where("created_at", ">=", cutoff_date)
        )

        heatmap_points = []
        for doc in query.stream():
            data = doc.to_dict()
            if "coordinates" in data and data["coordinates"]:
                heatmap_points.append(
                    {
                        "lat": data["coordinates"].latitude,
                        "lng": data["coordinates"].longitude,
                        "intensity": self._get_urgency_weight(data.get("urgency", "media")),
                        "topic": data.get("topic", "general"),
                        "created_at": data.get("created_at"),
                    }
                )

        return heatmap_points

    def get_zone_analytics(self, zone: str) -> Dict:
        """Obtiene analytics específicos de una zona"""
        doc_ref = self.db.collection(self.zones_collection).document(zone)
        doc = doc_ref.get()

        if doc.exists:
            return doc.to_dict()
        else:
            return self._create_zone_analytics(zone)

    def get_trending_locations(self, limit: int = 10) -> List[Dict]:
        """Obtiene ubicaciones con más reportes recientes"""
        # Últimos 7 días
        cutoff_date = datetime.now() - timedelta(days=7)

        query = self.db.collection(self.reports_collection).where("created_at", ">=", cutoff_date)

        location_counts = {}
        for doc in query.stream():
            data = doc.to_dict()
            location = data.get("location_text", "Desconocido")
            zone = data.get("zone", "General")

            key = f"{location}|{zone}"
            if key not in location_counts:
                location_counts[key] = {
                    "location": location,
                    "zone": zone,
                    "count": 0,
                    "urgency_high": 0,
                    "topics": {},
                }

            location_counts[key]["count"] += 1

            if data.get("urgency") == "alta":
                location_counts[key]["urgency_high"] += 1

            topic = data.get("topic", "general")
            location_counts[key]["topics"][topic] = location_counts[key]["topics"].get(topic, 0) + 1

        # Ordenar por count y tomar top N
        trending = sorted(location_counts.values(), key=lambda x: x["count"], reverse=True)[:limit]

        # Agregar datos adicionales
        for item in trending:
            item["top_topic"] = (
                max(item["topics"].items(), key=lambda x: x[1])[0] if item["topics"] else "general"
            )
            item["urgency_rate"] = (
                round(item["urgency_high"] / item["count"] * 100, 1) if item["count"] > 0 else 0
            )

        return trending

    def _update_zone_analytics(self, zone: str, topic: str):
        """Actualiza analytics de zona"""
        doc_ref = self.db.collection(self.zones_collection).document(zone)

        # Usar transacción para actualizar contadores
        @firestore.transactional
        def update_in_transaction(transaction):
            doc = doc_ref.get(transaction=transaction)

            if doc.exists:
                data = doc.to_dict()
                data["total_reports"] = data.get("total_reports", 0) + 1
                data["topics"] = data.get("topics", {})
                data["topics"][topic] = data["topics"].get(topic, 0) + 1
                data["last_updated"] = firestore.SERVER_TIMESTAMP
            else:
                data = {
                    "zone_name": zone,
                    "total_reports": 1,
                    "topics": {topic: 1},
                    "created_at": firestore.SERVER_TIMESTAMP,
                    "last_updated": firestore.SERVER_TIMESTAMP,
                }

            transaction.set(doc_ref, data)

        # Ejecutar transacción
        transaction = self.db.transaction()
        update_in_transaction(transaction)

    def _create_zone_analytics(self, zone: str) -> Dict:
        """Crea analytics iniciales para una zona"""
        data = {
            "zone_name": zone,
            "total_reports": 0,
            "topics": {},
            "created_at": firestore.SERVER_TIMESTAMP,
            "last_updated": firestore.SERVER_TIMESTAMP,
        }

        self.db.collection(self.zones_collection).document(zone).set(data)
        return data

    def _calculate_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Calcula distancia entre dos puntos en km (fórmula haversine simplificada)"""
        import math

        # Radio de la Tierra en km
        R = 6371

        # Convertir a radianes
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lng = math.radians(lng2 - lng1)

        # Fórmula haversine
        a = math.sin(delta_lat / 2) * math.sin(delta_lat / 2) + math.cos(lat1_rad) * math.cos(
            lat2_rad
        ) * math.sin(delta_lng / 2) * math.sin(delta_lng / 2)

        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        distance = R * c

        return distance

    def _get_urgency_weight(self, urgency: str) -> float:
        """Convierte urgencia a peso numérico para heatmap"""
        weights = {"baja": 0.3, "media": 0.6, "alta": 1.0}
        return weights.get(urgency, 0.6)

    # Método heredado actualizado
    def create_report(self, report_data: Dict) -> firestore.DocumentReference:
        """Método backward compatible"""
        return self.create_report_with_geolocation(report_data)


def initialize_firestore():
    """Función para inicializar Firestore (compatibilidad con main.py)"""
    return firestore.Client()


class ReportManager:
    """Clase ReportManager para compatibilidad"""

    def __init__(self, db_client=None):
        self.db = db_client if db_client else firestore.Client()

    def save_report(self, user_id, report_data):
        """Guardar reporte"""
        try:
            doc_ref = self.db.collection("reports").add(
                {"user_id": user_id, "timestamp": datetime.now(), **report_data}
            )
            return doc_ref[1].id
        except Exception as e:
            print(f"Error guardando reporte: {e}")
            return None

    def get_user_reports(self, user_id, limit=5):
        """Obtener reportes del usuario"""
        try:
            docs = self.db.collection("reports").where("user_id", "==", user_id).limit(limit).get()
            return [{"report_id": doc.id, **doc.to_dict()} for doc in docs]
        except Exception as e:
            print(f"Error obteniendo reportes: {e}")
            return []

#!/usr/bin/env python3
"""
Load Testing Script para CLAUDIA

Simula múltiples usuarios concurrentes enviando mensajes
al bot para medir performance y capacidad.

Uso:
    python scripts/load_test.py --users 10 --duration 60
"""

import argparse
import asyncio
import json
import logging
import random
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any, Dict, List

import requests

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Mensajes de prueba realistas
SAMPLE_MESSAGES = [
    "¿Cuánto cuesta construir un radier de 100m2?",
    "Necesito remodelar mi baño",
    "¿Qué materiales necesito para un muro de 20m2?",
    "Quiero construir una ampliación de 30m2",
    "¿Cuánto cemento necesito para una losa de 50m2?",
    "Presupuesto para pintar una casa de 120m2",
    "Materiales para techo de zinc 80m2",
    "¿Cuántos ladrillos necesito para 15m2 de muro?",
    "Costo de cerámica para baño de 8m2",
    "Construcción de quincho 25m2",
]

CALLBACK_DATA = [
    "start_baño",
    "start_cocina",
    "bano_objetivo_A",
    "bano_objetivo_B",
    "cocina_motor_A",
    "cocina_estilo_1",
]


class LoadTester:
    """Clase para ejecutar load testing contra CLAUDIA."""

    def __init__(self, base_url: str, num_users: int, duration: int):
        """Inicializa el load tester.

        Args:
            base_url: URL base del Cloud Function
            num_users: Número de usuarios concurrentes
            duration: Duración del test en segundos
        """
        self.base_url = base_url
        self.num_users = num_users
        self.duration = duration
        self.results: List[Dict[str, Any]] = []
        self.start_time = None
        self.end_time = None

    def create_message_payload(self, user_id: int, message_text: str) -> Dict[str, Any]:
        """Crea un payload de mensaje de Telegram para testing.

        Args:
            user_id: ID del usuario simulado
            message_text: Texto del mensaje

        Returns:
            Diccionario con estructura de update de Telegram
        """
        return {
            "update_id": random.randint(100000, 999999),
            "message": {
                "message_id": random.randint(1, 10000),
                "from": {
                    "id": 900000000 + user_id,  # IDs de test
                    "first_name": f"LoadTest{user_id}",
                    "username": f"loadtest_{user_id}",
                },
                "chat": {"id": 900000000 + user_id, "type": "private"},
                "date": int(time.time()),
                "text": message_text,
            },
        }

    def create_callback_payload(self, user_id: int, callback_data: str) -> Dict[str, Any]:
        """Crea un payload de callback query para testing.

        Args:
            user_id: ID del usuario simulado
            callback_data: Data del callback

        Returns:
            Diccionario con estructura de callback query
        """
        return {
            "update_id": random.randint(100000, 999999),
            "callback_query": {
                "id": f"callback_{random.randint(1, 10000)}",
                "from": {
                    "id": 900000000 + user_id,
                    "first_name": f"LoadTest{user_id}",
                },
                "message": {
                    "message_id": random.randint(1, 10000),
                    "chat": {"id": 900000000 + user_id},
                },
                "data": callback_data,
            },
        }

    def send_request(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Envía una request al endpoint de CLAUDIA.

        Args:
            payload: Payload de Telegram

        Returns:
            Diccionario con resultados (status, tiempo, error)
        """
        start = time.time()
        result = {
            "status": None,
            "response_time": None,
            "error": None,
            "timestamp": start,
        }

        try:
            response = requests.post(
                f"{self.base_url}/claudia_handler",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=30,
            )
            result["status"] = response.status_code
            result["response_time"] = time.time() - start

            if response.status_code != 200:
                result["error"] = f"HTTP {response.status_code}"

        except requests.exceptions.Timeout:
            result["error"] = "Timeout"
            result["response_time"] = time.time() - start
        except requests.exceptions.RequestException as e:
            result["error"] = str(e)
            result["response_time"] = time.time() - start

        return result

    def simulate_user(self, user_id: int) -> List[Dict[str, Any]]:
        """Simula un usuario enviando mensajes durante la duración del test.

        Args:
            user_id: ID del usuario simulado

        Returns:
            Lista de resultados de cada request
        """
        user_results = []
        end_time = time.time() + self.duration

        logger.info(f"User {user_id} started")

        while time.time() < end_time:
            # Alternar entre mensajes de texto y callbacks
            if random.random() < 0.7:  # 70% mensajes de texto
                message = random.choice(SAMPLE_MESSAGES)
                payload = self.create_message_payload(user_id, message)
            else:  # 30% callbacks
                callback = random.choice(CALLBACK_DATA)
                payload = self.create_callback_payload(user_id, callback)

            result = self.send_request(payload)
            user_results.append(result)

            # Esperar entre 1-5 segundos antes del siguiente mensaje (comportamiento realista)
            time.sleep(random.uniform(1, 5))

        logger.info(f"User {user_id} finished with {len(user_results)} requests")
        return user_results

    def run(self) -> Dict[str, Any]:
        """Ejecuta el load test con múltiples usuarios concurrentes.

        Returns:
            Diccionario con estadísticas del test
        """
        logger.info(f"Starting load test: {self.num_users} users for {self.duration} seconds")
        self.start_time = time.time()

        # Ejecutar usuarios en paralelo con ThreadPoolExecutor
        with ThreadPoolExecutor(max_workers=self.num_users) as executor:
            futures = [
                executor.submit(self.simulate_user, user_id)
                for user_id in range(1, self.num_users + 1)
            ]

            # Recolectar resultados
            for future in as_completed(futures):
                try:
                    user_results = future.result()
                    self.results.extend(user_results)
                except Exception as e:
                    logger.error(f"Error in user simulation: {e}")

        self.end_time = time.time()
        return self.analyze_results()

    def analyze_results(self) -> Dict[str, Any]:
        """Analiza los resultados del load test.

        Returns:
            Diccionario con estadísticas detalladas
        """
        if not self.results:
            return {"error": "No results to analyze"}

        total_requests = len(self.results)
        successful = sum(1 for r in self.results if r["status"] == 200)
        failed = total_requests - successful

        response_times = [r["response_time"] for r in self.results if r["response_time"]]
        avg_response = sum(response_times) / len(response_times) if response_times else 0
        min_response = min(response_times) if response_times else 0
        max_response = max(response_times) if response_times else 0

        # Percentiles
        sorted_times = sorted(response_times)
        p50 = sorted_times[len(sorted_times) // 2] if sorted_times else 0
        p95 = sorted_times[int(len(sorted_times) * 0.95)] if sorted_times else 0
        p99 = sorted_times[int(len(sorted_times) * 0.99)] if sorted_times else 0

        # Throughput (requests por segundo)
        duration = self.end_time - self.start_time
        throughput = total_requests / duration if duration > 0 else 0

        # Errores por tipo
        errors = {}
        for r in self.results:
            if r["error"]:
                errors[r["error"]] = errors.get(r["error"], 0) + 1

        stats = {
            "test_config": {
                "users": self.num_users,
                "duration": self.duration,
                "base_url": self.base_url,
            },
            "summary": {
                "total_requests": total_requests,
                "successful": successful,
                "failed": failed,
                "success_rate": (successful / total_requests * 100) if total_requests else 0,
                "duration_seconds": duration,
                "throughput_rps": throughput,
            },
            "response_times": {
                "average": avg_response,
                "min": min_response,
                "max": max_response,
                "p50_median": p50,
                "p95": p95,
                "p99": p99,
            },
            "errors": errors,
        }

        return stats

    def print_report(self, stats: Dict[str, Any]) -> None:
        """Imprime un reporte legible de las estadísticas.

        Args:
            stats: Diccionario con estadísticas
        """
        print("\n" + "=" * 70)
        print("CLAUDIA LOAD TEST REPORT")
        print("=" * 70)

        print(f"\n📊 TEST CONFIGURATION:")
        print(f"   Users: {stats['test_config']['users']}")
        print(f"   Duration: {stats['test_config']['duration']}s")
        print(f"   Target: {stats['test_config']['base_url']}")

        print(f"\n✅ SUMMARY:")
        summary = stats["summary"]
        print(f"   Total Requests: {summary['total_requests']}")
        print(f"   Successful: {summary['successful']}")
        print(f"   Failed: {summary['failed']}")
        print(f"   Success Rate: {summary['success_rate']:.2f}%")
        print(f"   Throughput: {summary['throughput_rps']:.2f} req/s")

        print(f"\n⏱️  RESPONSE TIMES:")
        times = stats["response_times"]
        print(f"   Average: {times['average']:.3f}s")
        print(f"   Min: {times['min']:.3f}s")
        print(f"   Max: {times['max']:.3f}s")
        print(f"   P50 (Median): {times['p50_median']:.3f}s")
        print(f"   P95: {times['p95']:.3f}s")
        print(f"   P99: {times['p99']:.3f}s")

        if stats["errors"]:
            print(f"\n❌ ERRORS:")
            for error, count in stats["errors"].items():
                print(f"   {error}: {count}")

        print("\n" + "=" * 70 + "\n")


def main():
    """Función principal."""
    parser = argparse.ArgumentParser(description="Load testing para CLAUDIA")
    parser.add_argument(
        "--users", type=int, default=10, help="Número de usuarios concurrentes (default: 10)"
    )
    parser.add_argument(
        "--duration", type=int, default=60, help="Duración del test en segundos (default: 60)"
    )
    parser.add_argument(
        "--url",
        type=str,
        default="https://us-central1-claudia-i8bxh.cloudfunctions.net",
        help="URL base del Cloud Function",
    )
    parser.add_argument(
        "--output", type=str, help="Archivo JSON para guardar resultados (opcional)"
    )

    args = parser.parse_args()

    tester = LoadTester(args.url, args.users, args.duration)
    stats = tester.run()
    tester.print_report(stats)

    if args.output:
        with open(args.output, "w") as f:
            json.dump(stats, f, indent=2)
        logger.info(f"Results saved to {args.output}")


if __name__ == "__main__":
    main()

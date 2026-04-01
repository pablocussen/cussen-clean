# claudia_modules/config.py
import logging
import os

# --- Configuración Esencial ---
# En Google Cloud Functions, estas variables se configuran en el entorno de despliegue.
TELEGRAM_TOKEN = os.environ.get("TELEGRAM_TOKEN")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyAcemCC6mDNSZXwYqghO0LhZO3GobIpkwc")
GOOGLE_CLOUD_PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT")

# --- Configuración de Logging ---
LOGGING_LEVEL = os.environ.get("LOGGING_LEVEL", "INFO").upper()

# --- Controles y Parámetros del Bot ---
MAX_RETRIES = int(os.environ.get("MAX_RETRIES", 3))
BACKOFF_FACTOR = float(os.environ.get("BACKOFF_FACTOR", 2.0))

# Validar que las variables esenciales están presentes al cargar el módulo
if not TELEGRAM_TOKEN:
    logging.getLogger(__name__).critical(
        "La variable de entorno TELEGRAM_TOKEN no está configurada."
    )
if not GEMINI_API_KEY:
    logging.getLogger(__name__).critical(
        "La variable de entorno GEMINI_API_KEY no está configurada."
    )

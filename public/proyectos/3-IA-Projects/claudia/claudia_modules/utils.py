# claudia_modules/utils.py
import logging

print("DEBUG: Cargando claudia_modules/utils.py...")
logger = logging.getLogger(__name__)


def example_util_function():
    logger.info("Función de utilidad de ejemplo llamada.")
    return "Dato de utilidad"


# Aquí puedes pegar tus funciones get_bot_info y cleanup_memory después si quieres
print("DEBUG: claudia_modules/utils.py CARGADO.")

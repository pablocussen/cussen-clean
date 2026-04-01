# claudia_modules/linking.py
"""
Sistema de vinculación Web ↔ Telegram para CLAUDIA PRO.
Permite conectar la cuenta web del usuario con su Telegram.
"""

import datetime
import logging
import random
import string

from google.cloud import firestore

logger = logging.getLogger(__name__)

# Cliente de Firestore
try:
    DB = firestore.Client(project="claudia-i8bxh")
    logger.info("Cliente de Firestore inicializado en linking.py")
except Exception as e:
    logger.critical(f"Error CRÍTICO inicializando Firestore en linking: {e}", exc_info=True)
    DB = None


def generate_linking_code(user_id: str) -> dict:
    """
    Genera código único de 6 caracteres para vincular cuenta.

    Args:
        user_id: ID del usuario en la web app

    Returns:
        dict con 'code' y 'expires_at'
    """
    if not DB:
        logger.error("No se puede generar código: Firestore no disponible")
        return {"error": "Base de datos no disponible"}

    try:
        # Generar código de 6 caracteres (letras mayúsculas y números)
        code = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))

        # Evitar códigos que puedan ser ofensivos o confusos
        # (0/O, 1/I, etc.)
        code = code.replace("O", "0").replace("I", "1").replace("S", "5")

        now = datetime.datetime.now(datetime.timezone.utc)
        expires_at = now + datetime.timedelta(minutes=15)

        # Guardar en Firestore
        DB.collection("linking_codes").document(code).set(
            {
                "user_id": user_id,
                "created_at": now,
                "expires_at": expires_at,
                "used": False,
                "telegram_id": None,
            }
        )

        logger.info(f"Código de vinculación generado: {code} para user_id: {user_id}")

        return {"code": code, "expires_at": expires_at.isoformat(), "expires_in_minutes": 15}

    except Exception as e:
        logger.error(f"Error generando código de vinculación: {e}", exc_info=True)
        return {"error": str(e)}


def verify_linking_code(code: str, telegram_id: int, telegram_username: str = None) -> dict:
    """
    Verifica código y vincula cuenta Telegram con web.

    Args:
        code: Código de 6 caracteres
        telegram_id: ID del usuario en Telegram
        telegram_username: Username de Telegram (opcional)

    Returns:
        dict con 'success' y 'user_id' o 'error'
    """
    if not DB:
        logger.error("No se puede verificar código: Firestore no disponible")
        return {"success": False, "error": "Base de datos no disponible"}

    try:
        code = code.upper().strip()

        # Buscar código en Firestore
        doc = DB.collection("linking_codes").document(code).get()

        if not doc.exists:
            logger.warning(f"Código inválido intentado: {code}")
            return {"success": False, "error": "Código inválido"}

        data = doc.to_dict()

        # Verificar si ya fue usado
        if data.get("used"):
            logger.warning(f"Código ya usado: {code}")
            return {"success": False, "error": "Este código ya fue usado"}

        # Verificar expiración
        expires_at = data.get("expires_at")
        if datetime.datetime.now(datetime.timezone.utc) > expires_at:
            logger.warning(f"Código expirado: {code}")
            return {"success": False, "error": "Código expirado. Genera uno nuevo."}

        user_id = data.get("user_id")

        # Verificar si este Telegram ya está vinculado a otra cuenta
        existing_users = (
            DB.collection("users").where("telegram_id", "==", telegram_id).limit(1).stream()
        )
        existing_user = next(existing_users, None)

        if existing_user and existing_user.id != user_id:
            logger.warning(f"Telegram {telegram_id} ya vinculado a otra cuenta")
            return {
                "success": False,
                "error": "Esta cuenta de Telegram ya está vinculada a otro usuario",
            }

        # Vincular cuenta (usar set con merge para crear si no existe)
        user_ref = DB.collection("users").document(user_id)

        update_data = {
            "telegram_id": telegram_id,
            "telegram_verified": True,
            "telegram_linked_at": datetime.datetime.now(datetime.timezone.utc),
            "id": user_id,  # Asegurar que tenga ID
        }

        if telegram_username:
            update_data["telegram_username"] = telegram_username

        # Usar set con merge=True para crear documento si no existe
        user_ref.set(update_data, merge=True)

        logger.info(f"Documento de usuario actualizado/creado: {user_id}")

        # Marcar código como usado
        DB.collection("linking_codes").document(code).update(
            {
                "used": True,
                "telegram_id": telegram_id,
                "used_at": datetime.datetime.now(datetime.timezone.utc),
            }
        )

        logger.info(f"Vinculación exitosa: user_id={user_id}, telegram_id={telegram_id}")

        # Obtener datos del usuario para respuesta personalizada
        user_data = user_ref.get().to_dict()
        user_name = user_data.get("name", "Usuario")

        return {"success": True, "user_id": user_id, "user_name": user_name}

    except Exception as e:
        logger.error(f"Error verificando código de vinculación: {e}", exc_info=True)
        return {"success": False, "error": "Error interno del servidor"}


def get_user_by_telegram_id(telegram_id: int) -> dict:
    """
    Busca usuario por su telegram_id.

    Args:
        telegram_id: ID del usuario en Telegram

    Returns:
        dict con datos del usuario o None
    """
    if not DB:
        logger.error("No se puede buscar usuario: Firestore no disponible")
        return None

    try:
        users = DB.collection("users").where("telegram_id", "==", telegram_id).limit(1).stream()
        user_doc = next(users, None)

        if not user_doc:
            return None

        user_data = user_doc.to_dict()
        user_data["id"] = user_doc.id

        return user_data

    except Exception as e:
        logger.error(f"Error buscando usuario por telegram_id: {e}", exc_info=True)
        return None


def unlink_telegram(user_id: str) -> dict:
    """
    Desvincula cuenta de Telegram.

    Args:
        user_id: ID del usuario

    Returns:
        dict con 'success'
    """
    if not DB:
        return {"success": False, "error": "Base de datos no disponible"}

    try:
        DB.collection("users").document(user_id).update(
            {
                "telegram_id": firestore.DELETE_FIELD,
                "telegram_verified": False,
                "telegram_username": firestore.DELETE_FIELD,
                "telegram_unlinked_at": datetime.datetime.now(datetime.timezone.utc),
            }
        )

        logger.info(f"Telegram desvinculado para user_id: {user_id}")

        return {"success": True}

    except Exception as e:
        logger.error(f"Error desvinculando Telegram: {e}", exc_info=True)
        return {"success": False, "error": str(e)}


def get_user_by_id(user_id: str) -> dict:
    """
    Obtiene datos de usuario por ID.

    Args:
        user_id: ID del usuario

    Returns:
        dict con datos del usuario o None
    """
    if not DB:
        return None

    try:
        doc = DB.collection("users").document(user_id).get()

        if not doc.exists:
            return None

        return doc.to_dict()

    except Exception as e:
        logger.error(f"Error obteniendo usuario: {e}", exc_info=True)
        return None


def get_active_users_with_telegram() -> list:
    """
    Obtiene lista de usuarios con Telegram vinculado.
    Útil para enviar notificaciones masivas.

    Returns:
        list de dict con user_id, telegram_id, name
    """
    if not DB:
        return []

    try:
        users = DB.collection("users").where("telegram_verified", "==", True).stream()

        result = []
        for user_doc in users:
            user_data = user_doc.to_dict()
            result.append(
                {
                    "user_id": user_doc.id,
                    "telegram_id": user_data.get("telegram_id"),
                    "name": user_data.get("name", "Usuario"),
                    "email": user_data.get("email"),
                }
            )

        return result

    except Exception as e:
        logger.error(f"Error obteniendo usuarios con Telegram: {e}", exc_info=True)
        return []

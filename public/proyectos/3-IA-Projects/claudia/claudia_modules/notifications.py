# claudia_modules/notifications.py
"""
Sistema de Notificaciones Proactivas para CLAUDIA.
Envía mensajes automáticos en horarios clave del día.
"""

import datetime
import logging
import os

import requests
from google.cloud import firestore

logger = logging.getLogger(__name__)

# Cliente de Firestore
DB = firestore.Client(project="claudia-i8bxh")

# Token de Telegram desde variable de entorno
TELEGRAM_TOKEN = os.environ.get("TELEGRAM_TOKEN", "")


def send_telegram_message(telegram_id: int, message: str):
    """Envía mensaje directo a Telegram sin dependencias de TelegramSender."""
    if not TELEGRAM_TOKEN:
        logger.error("TELEGRAM_TOKEN no configurado")
        return False

    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    payload = {"chat_id": telegram_id, "text": message, "parse_mode": "Markdown"}

    try:
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        return True
    except Exception as e:
        logger.error(f"Error enviando mensaje Telegram: {e}")
        return False


def send_morning_notification(user_id: str, telegram_id: int) -> dict:
    """
    Mensaje matutino (7 AM) - Resumen del día.

    Args:
        user_id: ID del usuario en web
        telegram_id: ID de Telegram

    Returns:
        dict con status y mensaje enviado
    """
    try:
        # Obtener proyectos del usuario
        projects = list(
            DB.collection("projects")
            .where("owner_id", "==", user_id)
            .order_by("last_updated", direction=firestore.Query.DESCENDING)
            .limit(3)
            .stream()
        )

        if not projects:
            message = """
🌅 *¡Buenos días!*

No tienes proyectos activos todavía.

💡 *Tip del día:*
Crea tu primer proyecto en ClaudIA para comenzar a planificar tu obra. ¡Es súper fácil!

🔗 https://claudia-i8bxh.web.app
"""
        else:
            # Construir resumen de proyectos
            user_name = "Maestro"
            user_doc = DB.collection("users").document(user_id).get()
            if user_doc.exists:
                user_name = user_doc.to_dict().get("name", "Maestro")

            message = f"🌅 *¡Buenos días, {user_name}!*\n\n"
            message += "📊 *Resumen de tus proyectos:*\n\n"

            for i, project_doc in enumerate(projects, 1):
                p = project_doc.to_dict()
                activities = p.get("activities", [])
                tasks = p.get("tasks", [])

                total = sum([a.get("cantidad", 0) * a.get("precio", 0) for a in activities])

                tasks_pending = len([t for t in tasks if not t.get("completed", False)])
                tasks_total = len(tasks)

                message += f"{i}. 🏗️ *{p.get('name', 'Sin nombre')}*\n"
                message += f"   💰 ${total:,.0f}\n"
                message += f"   📋 {len(activities)} actividades\n"

                if tasks_total > 0:
                    message += f"   ✅ {tasks_pending}/{tasks_total} tareas pendientes\n"

                message += "\n"

            message += "\n💪 *¡A darle con todo hoy!*"

        # Enviar mensaje
        send_telegram_message(telegram_id, message)

        logger.info(f"Mensaje matutino enviado a telegram_id={telegram_id}")

        return {"success": True, "message": "Mensaje matutino enviado", "telegram_id": telegram_id}

    except Exception as e:
        logger.error(f"Error enviando mensaje matutino: {e}", exc_info=True)
        return {"success": False, "error": str(e)}


def send_midday_notification(user_id: str, telegram_id: int) -> dict:
    """
    Mensaje de mediodía (12 PM) - Recordatorio de tareas.

    Args:
        user_id: ID del usuario en web
        telegram_id: ID de Telegram

    Returns:
        dict con status y mensaje enviado
    """
    try:
        # Obtener proyectos activos
        projects = list(DB.collection("projects").where("owner_id", "==", user_id).stream())

        # Contar tareas pendientes
        total_pending = 0
        projects_with_tasks = []

        for project_doc in projects:
            p = project_doc.to_dict()
            tasks = p.get("tasks", [])
            pending = [t for t in tasks if not t.get("completed", False)]

            if pending:
                total_pending += len(pending)
                projects_with_tasks.append(
                    {
                        "name": p.get("name", "Sin nombre"),
                        "pending": len(pending),
                        "tasks": pending[:3],  # Primeras 3 tareas
                    }
                )

        if total_pending == 0:
            message = """
🌞 *Mediodía - Check de progreso*

✅ ¡Excelente! No tienes tareas pendientes.

💡 *Sugerencia:*
¿Ya revisaste el avance de tu obra hoy?
Agrega fotos o actualiza la bitácora para llevar un registro completo.

🔗 https://claudia-i8bxh.web.app
"""
        else:
            message = "🌞 *Mediodía - Recordatorio de tareas*\n\n"
            message += f"Tienes *{total_pending} tareas pendientes* en {len(projects_with_tasks)} proyecto(s):\n\n"

            for proj in projects_with_tasks[:2]:  # Máximo 2 proyectos
                message += f"🏗️ *{proj['name']}* ({proj['pending']} pendientes)\n"
                for task in proj["tasks"]:
                    message += f"   • {task.get('text', 'Tarea sin nombre')}\n"
                message += "\n"

            message += "\n⏰ *¡A darle antes del almuerzo!*"

        # Enviar mensaje
        send_telegram_message(telegram_id, message)

        logger.info(f"Mensaje mediodía enviado a telegram_id={telegram_id}")

        return {"success": True, "message": "Mensaje mediodía enviado", "telegram_id": telegram_id}

    except Exception as e:
        logger.error(f"Error enviando mensaje mediodía: {e}", exc_info=True)
        return {"success": False, "error": str(e)}


def send_evening_notification(user_id: str, telegram_id: int) -> dict:
    """
    Mensaje vespertino (6 PM) - Resumen del día.

    Args:
        user_id: ID del usuario en web
        telegram_id: ID de Telegram

    Returns:
        dict con status y mensaje enviado
    """
    try:
        # Obtener usuario
        user_doc = DB.collection("users").document(user_id).get()
        user_name = "Maestro"
        if user_doc.exists:
            user_name = user_doc.to_dict().get("name", "Maestro")

        # Obtener proyectos
        projects = list(DB.collection("projects").where("owner_id", "==", user_id).stream())

        # Calcular estadísticas del día
        total_tasks_completed_today = 0
        total_activities = 0
        total_budget = 0

        for project_doc in projects:
            p = project_doc.to_dict()

            # Contar actividades
            activities = p.get("activities", [])
            total_activities += len(activities)

            # Calcular presupuesto
            for act in activities:
                total_budget += act.get("cantidad", 0) * act.get("precio", 0)

            # Contar tareas completadas hoy
            tasks = p.get("tasks", [])
            today = datetime.datetime.now(datetime.timezone.utc).date()

            for task in tasks:
                if task.get("completed", False):
                    # Verificar si se completó hoy
                    completed_at = task.get("completed_at")
                    if completed_at and completed_at.date() == today:
                        total_tasks_completed_today += 1

        # Construir mensaje
        message = f"🌆 *Resumen del día - {user_name}*\n\n"

        if total_tasks_completed_today > 0:
            message += (
                f"✅ *¡Bien hecho!* Completaste {total_tasks_completed_today} tarea(s) hoy\n\n"
            )

        message += f"📊 *Estado de tus proyectos:*\n"
        message += f"   🏗️ {len(projects)} proyecto(s) activo(s)\n"
        message += f"   📋 {total_activities} actividades planificadas\n"
        message += f"   💰 ${total_budget:,.0f} en presupuesto total\n\n"

        # Motivación
        if total_tasks_completed_today >= 3:
            message += "🔥 *¡Día productivo! Sigue así.*"
        elif total_tasks_completed_today > 0:
            message += "💪 *Buen progreso hoy.*"
        else:
            message += "📝 *Mañana es otro día para avanzar.*"

        message += "\n\n🌙 *¡Descansa y nos vemos mañana!*"

        # Enviar mensaje
        send_telegram_message(telegram_id, message)

        logger.info(f"Mensaje vespertino enviado a telegram_id={telegram_id}")

        return {
            "success": True,
            "message": "Mensaje vespertino enviado",
            "telegram_id": telegram_id,
        }

    except Exception as e:
        logger.error(f"Error enviando mensaje vespertino: {e}", exc_info=True)
        return {"success": False, "error": str(e)}


def send_alert_notification(
    user_id: str, telegram_id: int, alert_type: str, alert_data: dict
) -> dict:
    """
    Mensaje de alerta en tiempo real.

    Args:
        user_id: ID del usuario
        telegram_id: ID de Telegram
        alert_type: Tipo de alerta ('budget_exceeded', 'material_low', 'task_overdue')
        alert_data: Datos específicos de la alerta

    Returns:
        dict con status
    """
    try:
        if alert_type == "budget_exceeded":
            project_name = alert_data.get("project_name", "Tu proyecto")
            budget = alert_data.get("budget", 0)
            spent = alert_data.get("spent", 0)

            message = f"""
⚠️ *Alerta de Presupuesto*

El proyecto *{project_name}* ha superado el presupuesto estimado:

💰 Estimado: ${budget:,.0f}
💸 Gastado: ${spent:,.0f}
📈 Sobrecosto: ${spent - budget:,.0f}

💡 *Recomendación:*
Revisa las actividades y optimiza costos.
"""

        elif alert_type == "material_low":
            material = alert_data.get("material", "Material")
            quantity = alert_data.get("quantity", 0)

            message = f"""
📦 *Alerta de Material*

El material *{material}* está bajo en stock:

📊 Cantidad actual: {quantity}

🛒 *Acción recomendada:*
Compra más antes de que se agote.
"""

        elif alert_type == "task_overdue":
            task_name = alert_data.get("task", "Tarea")
            project_name = alert_data.get("project", "Tu proyecto")
            days_overdue = alert_data.get("days_overdue", 0)

            message = f"""
⏰ *Alerta de Tarea Atrasada*

La tarea *"{task_name}"* en el proyecto *{project_name}* lleva {days_overdue} día(s) de atraso.

✅ *¿Ya la completaste?*
Márcala como completada para mantener el control.
"""

        else:
            message = f"""
🔔 *Notificación de ClaudIA*

{alert_data.get('message', 'Tienes una notificación pendiente')}
"""

        # Enviar mensaje
        send_telegram_message(telegram_id, message)

        logger.info(f"Alerta '{alert_type}' enviada a telegram_id={telegram_id}")

        return {
            "success": True,
            "message": f"Alerta {alert_type} enviada",
            "telegram_id": telegram_id,
        }

    except Exception as e:
        logger.error(f"Error enviando alerta: {e}", exc_info=True)
        return {"success": False, "error": str(e)}


def get_users_for_notification(hour: int) -> list:
    """
    Obtiene lista de usuarios que deben recibir notificación en esta hora.

    Args:
        hour: Hora del día (0-23)

    Returns:
        Lista de dicts con user_id y telegram_id
    """
    try:
        # Obtener todos los usuarios con Telegram vinculado
        users = DB.collection("users").where("telegram_verified", "==", True).stream()

        users_to_notify = []

        for user_doc in users:
            user_data = user_doc.to_dict()
            telegram_id = user_data.get("telegram_id")

            if not telegram_id:
                continue

            # Verificar preferencias de notificaciones
            preferences = user_data.get("notification_preferences", {})

            # Por defecto, todos reciben notificaciones
            enabled = preferences.get("enabled", True)

            if not enabled:
                continue

            # Verificar horarios específicos
            morning_enabled = preferences.get("morning_enabled", True)
            midday_enabled = preferences.get("midday_enabled", True)
            evening_enabled = preferences.get("evening_enabled", True)

            should_notify = False

            if hour == 7 and morning_enabled:
                should_notify = True
            elif hour == 12 and midday_enabled:
                should_notify = True
            elif hour == 18 and evening_enabled:
                should_notify = True

            if should_notify:
                users_to_notify.append(
                    {
                        "user_id": user_doc.id,
                        "telegram_id": telegram_id,
                        "name": user_data.get("name", "Usuario"),
                    }
                )

        logger.info(f"Encontrados {len(users_to_notify)} usuarios para notificar a las {hour}:00")

        return users_to_notify

    except Exception as e:
        logger.error(f"Error obteniendo usuarios para notificación: {e}", exc_info=True)
        return []

# claudia_modules/bot_commands.py
"""
Comandos del bot de Telegram para CLAUDIA PRO.
Maneja todos los comandos: /start, /vincular, /resumen, /tareas, etc.
"""

import datetime
import logging

from google.cloud import firestore

from claudia_modules import linking

logger = logging.getLogger(__name__)

# Cliente de Firestore
try:
    DB = firestore.Client(project="claudia-i8bxh")
except Exception as e:
    logger.critical(f"Error inicializando Firestore en bot_commands: {e}")
    DB = None


def handle_start(telegram_id: int, username: str = None) -> str:
    """Handler para /start."""

    # Verificar si ya está vinculado
    user = linking.get_user_by_telegram_id(telegram_id)

    if user:
        user_name = user.get("name", "Usuario")
        return f"""
👷‍♂️ ¡Hola de nuevo, {user_name}!

Tu cuenta ya está vinculada.

📋 *Comandos disponibles:*
/resumen - Ver estado de tus proyectos
/tareas - Lista de tareas pendientes
/bitacora - Agregar entrada a bitácora
/foto - Subir foto del proyecto
/config - Configurar notificaciones
/ayuda - Ver todos los comandos

🌐 *App web:*
https://claudia-i8bxh.web.app
"""

    # Usuario nuevo
    return """
👷‍♂️ ¡Hola! Soy *CLAUDIA PRO*, tu asistente de construcción inteligente.

🏗️ *¿Qué puedo hacer por ti?*
   • Enviarte resúmenes diarios de tus proyectos
   • Recordarte tareas y materiales pendientes
   • Alertarte sobre retrasos o problemas
   • Ayudarte a actualizar tu bitácora
   • Responder preguntas sobre construcción

📱 *Para empezar:*
1. Ve a https://claudia-i8bxh.web.app
2. Crea tu cuenta o inicia sesión
3. Ve a ⚙️ *Configuración*
4. Click en *🔗 Conectar con Telegram*
5. Copia el código que aparece
6. Envíame: `/vincular [CÓDIGO]`

*Ejemplo:* `/vincular ABC123`

¿Necesitas ayuda? Envía /ayuda
"""


def handle_vincular(telegram_id: int, username: str, code: str) -> str:
    """Handler para /vincular [CÓDIGO]."""

    if not code:
        return """
❌ *Formato incorrecto*

*Uso:* `/vincular [CÓDIGO]`

*Ejemplo:* `/vincular ABC123`

¿Dónde consigo el código?
1. Ve a https://claudia-i8bxh.web.app
2. Click en ⚙️ *Configuración*
3. Click en *🔗 Conectar con Telegram*
4. Copia el código de 6 caracteres
"""

    # Verificar código
    result = linking.verify_linking_code(code, telegram_id, username)

    if not result["success"]:
        error_msg = result.get("error", "Error desconocido")
        return f"""
❌ *Error:* {error_msg}

💡 *Soluciones:*
• Verifica que el código sea correcto
• El código expira en 15 minutos
• Genera un nuevo código en la app web

¿Necesitas ayuda? Envía /ayuda
"""

    user_name = result.get("user_name", "Usuario")

    return f"""
✅ *¡Cuenta vinculada exitosamente, {user_name}!*

🎉 Ahora recibirás:
   • Resúmenes diarios de tus proyectos
   • Alertas importantes
   • Recordatorios de tareas

📋 *Comandos disponibles:*
/resumen - Ver estado de proyectos
/tareas - Ver tareas pendientes
/bitacora - Agregar a bitácora
/foto - Subir foto del proyecto
/config - Configurar notificaciones
/ayuda - Ver todos los comandos

🚀 *¡Empieza creando tu primer proyecto!*
https://claudia-i8bxh.web.app
"""


def handle_resumen(telegram_id: int) -> str:
    """Handler para /resumen."""

    user = linking.get_user_by_telegram_id(telegram_id)

    if not user:
        return """
❌ *Cuenta no vinculada*

Para usar este comando, primero vincula tu cuenta:
1. Envía /start
2. Sigue las instrucciones
"""

    try:
        # Obtener proyectos del usuario
        projects = (
            DB.collection("projects")
            .where("owner_id", "==", user["id"])
            .order_by("last_updated", direction=firestore.Query.DESCENDING)
            .stream()
        )

        projects_list = list(projects)

        if not projects_list:
            return """
📊 *No tienes proyectos activos*

🏗️ *Crea tu primer proyecto:*
https://claudia-i8bxh.web.app

💡 *Tip:* Usa plantillas predefinidas para empezar rápido:
   • Casa Básica
   • Ampliación
   • Remodelación
   • Baño
"""

        # Generar resumen
        user_name = user.get("name", "Usuario")
        message = f"📊 *Resumen de Proyectos - {user_name}*\n\n"

        for project_doc in projects_list[:5]:  # Máximo 5 proyectos
            p = project_doc.to_dict()

            # Calcular métricas
            activities = p.get("activities", [])
            activities_count = len(activities)

            tasks = p.get("tasks", [])
            tasks_total = len(tasks)
            tasks_pending = len([t for t in tasks if not t.get("completed")])
            tasks_completed = tasks_total - tasks_pending

            # Calcular total
            total = sum(
                [
                    a.get("precio", a.get("precio_referencia", 0)) * a.get("cantidad", 0)
                    for a in activities
                ]
            )

            # Última actualización
            last_updated = p.get("last_updated")
            if last_updated:
                if isinstance(last_updated, str):
                    last_updated = datetime.datetime.fromisoformat(
                        last_updated.replace("Z", "+00:00")
                    )
                days_ago = (datetime.datetime.now(datetime.timezone.utc) - last_updated).days
                if days_ago == 0:
                    last_update_str = "Hoy"
                elif days_ago == 1:
                    last_update_str = "Ayer"
                else:
                    last_update_str = f"Hace {days_ago} días"
            else:
                last_update_str = "Nunca"

            # Progress bar
            if tasks_total > 0:
                progress_pct = int((tasks_completed / tasks_total) * 100)
                progress_bars = int(progress_pct / 10)
                progress_bar = "▰" * progress_bars + "▱" * (10 - progress_bars)
            else:
                progress_pct = 0
                progress_bar = "▱" * 10

            message += f"🏗️ *{p['name']}*\n"
            message += f"   💰 ${total:,.0f}\n"
            message += f"   📋 {activities_count} actividades\n"
            message += f"   ✅ {tasks_completed}/{tasks_total} tareas\n"
            message += f"   {progress_bar} {progress_pct}%\n"
            message += f"   🕐 {last_update_str}\n\n"

        if len(projects_list) > 5:
            message += f"\n...y {len(projects_list) - 5} proyectos más.\n"

        message += "\n💡 *Ver detalles:* https://claudia-i8bxh.web.app"

        return message

    except Exception as e:
        logger.error(f"Error en handle_resumen: {e}", exc_info=True)
        return "❌ Error obteniendo resumen. Intenta de nuevo."


def handle_tareas(telegram_id: int, project_name: str = None) -> str:
    """Handler para /tareas."""

    user = linking.get_user_by_telegram_id(telegram_id)

    if not user:
        return """
❌ *Cuenta no vinculada*

Envía /start para vincular tu cuenta.
"""

    try:
        # Obtener proyectos
        projects = DB.collection("projects").where("owner_id", "==", user["id"]).stream()

        all_tasks = []

        for p_doc in projects:
            p = p_doc.to_dict()
            tasks = p.get("tasks", [])

            for task in tasks:
                if not task.get("completed"):
                    due_date = task.get("due_date", "Sin fecha")

                    # Calcular si está vencida
                    is_overdue = False
                    if due_date and due_date != "Sin fecha":
                        try:
                            if isinstance(due_date, str):
                                due = datetime.datetime.fromisoformat(
                                    due_date.replace("Z", "+00:00")
                                )
                            else:
                                due = due_date

                            if due < datetime.datetime.now(datetime.timezone.utc):
                                is_overdue = True
                        except:
                            pass

                    all_tasks.append(
                        {
                            "project": p["name"],
                            "text": task.get("text", "Sin descripción"),
                            "due": due_date,
                            "overdue": is_overdue,
                            "priority": task.get("priority", "normal"),
                        }
                    )

        if not all_tasks:
            return """
✅ *¡No tienes tareas pendientes!*

🎉 Excelente trabajo. Disfruta tu tiempo libre.

💡 *Tip:* Mantén tu proyecto actualizado para mejor control.
"""

        # Ordenar: vencidas primero, luego por prioridad
        all_tasks.sort(key=lambda x: (not x["overdue"], x["priority"] != "high"))

        message = f"📋 *TAREAS PENDIENTES* ({len(all_tasks)})\n\n"

        for task in all_tasks[:10]:  # Máximo 10
            icon = "🚨" if task["overdue"] else ("⚡" if task["priority"] == "high" else "📌")

            message += f"{icon} *{task['project']}*\n"
            message += f"   {task['text']}\n"
            message += f"   📅 {task['due']}\n\n"

        if len(all_tasks) > 10:
            message += f"\n...y {len(all_tasks) - 10} tareas más.\n"

        message += "\n💡 *Ver todas:* https://claudia-i8bxh.web.app"

        return message

    except Exception as e:
        logger.error(f"Error en handle_tareas: {e}", exc_info=True)
        return "❌ Error obteniendo tareas. Intenta de nuevo."


def handle_bitacora(telegram_id: int, text: str) -> str:
    """Handler para /bitacora [texto]."""

    user = linking.get_user_by_telegram_id(telegram_id)

    if not user:
        return "❌ Cuenta no vinculada. Envía /start"

    if not text:
        return """
📝 *Agregar entrada a bitácora*

*Uso:* `/bitacora [texto]`

*Ejemplos:*
• `/bitacora Terminamos el radier hoy`
• `/bitacora Llegaron 1000 ladrillos`
• `/bitacora Lluvia retrasó la obra`

💡 La entrada se agregará a tu proyecto más reciente.
"""

    try:
        # Obtener proyecto más reciente
        projects = (
            DB.collection("projects")
            .where("owner_id", "==", user["id"])
            .order_by("last_updated", direction=firestore.Query.DESCENDING)
            .limit(1)
            .stream()
        )

        project_doc = next(projects, None)

        if not project_doc:
            return """
❌ *No tienes proyectos activos*

Crea un proyecto en: https://claudia-i8bxh.web.app
"""

        project_data = project_doc.to_dict()
        project_name = project_data["name"]

        # Agregar entrada a bitácora
        log_entry = {
            "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "text": text,
            "source": "telegram",
            "author": user.get("name", "Usuario"),
        }

        DB.collection("projects").document(project_doc.id).update(
            {
                "log": firestore.ArrayUnion([log_entry]),
                "last_updated": datetime.datetime.now(datetime.timezone.utc),
            }
        )

        return f"""
✅ *Entrada agregada a bitácora*

🏗️ *Proyecto:* {project_name}
📝 *Texto:* {text}
🕐 *Fecha:* {datetime.datetime.now().strftime('%d/%m/%Y %H:%M')}

💡 *Ver bitácora completa:*
https://claudia-i8bxh.web.app
"""

    except Exception as e:
        logger.error(f"Error en handle_bitacora: {e}", exc_info=True)
        return "❌ Error agregando entrada. Intenta de nuevo."


def handle_ayuda(telegram_id: int) -> str:
    """Handler para /ayuda."""

    return """
📖 *AYUDA - CLAUDIA PRO BOT*

👷‍♂️ *Comandos básicos:*
/start - Iniciar y vincular cuenta
/vincular [CÓDIGO] - Confirmar vinculación
/resumen - Ver estado de proyectos
/tareas - Lista de tareas pendientes
/bitacora [texto] - Agregar a bitácora
/foto - Subir foto del proyecto
/config - Configurar notificaciones
/ayuda - Ver esta ayuda

🏗️ *¿Cómo funciona?*
1. Vincula tu cuenta web con Telegram
2. Crea proyectos en la web
3. Recibe notificaciones automáticas aquí
4. Actualiza desde Telegram sin abrir la web

🌐 *App web:*
https://claudia-i8bxh.web.app

💬 *¿Problemas?*
Envía un mensaje y te ayudaré.

🚀 *CLAUDIA PRO - Tu asistente de construcción*
"""


def handle_config(telegram_id: int) -> str:
    """Handler para /config."""

    user = linking.get_user_by_telegram_id(telegram_id)

    if not user:
        return "❌ Cuenta no vinculada. Envía /start"

    return """
⚙️ *CONFIGURACIÓN DE NOTIFICACIONES*

🔔 *Notificaciones actuales:*
   ✅ Resumen matutino (7:00 AM)
   ✅ Recordatorios mediodía (12:00 PM)
   ✅ Resumen vespertino (6:00 PM)
   ✅ Alertas importantes (tiempo real)

💡 *Próximamente podrás:*
   • Elegir horarios personalizados
   • Activar/desactivar tipos de notificación
   • Configurar alertas por proyecto

🔗 *Para desvincular tu cuenta:*
Ve a la app web → Configuración

🌐 https://claudia-i8bxh.web.app
"""

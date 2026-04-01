# claudia_modules/project_manager.py
"""
Gestor de Proyectos y Bitácora Diaria
Maneja el seguimiento día a día de proyectos de construcción
"""

import json
import logging
from dataclasses import asdict, dataclass
from datetime import date, datetime, timedelta
from typing import Dict, List, Optional

from google.cloud import firestore
from google.cloud.firestore_v1 import SERVER_TIMESTAMP

logger = logging.getLogger(__name__)


@dataclass
class Project:
    """Clase para representar un proyecto de construcción"""

    id: str
    user_id: str
    name: str
    type: str  # "remodelación" | "construcción" | "ampliación"
    status: str  # "planificación" | "en_curso" | "pausado" | "finalizado"
    start_date: Optional[date] = None
    estimated_end_date: Optional[date] = None
    actual_end_date: Optional[date] = None
    budget_total: float = 0.0
    budget_spent: float = 0.0
    address: str = ""
    description: str = ""
    created_at: Optional[datetime] = None


@dataclass
class BitacoraEntry:
    """Entrada de bitácora diaria"""

    date: date
    project_id: str
    activities: List[str]  # Actividades realizadas
    photos: List[str]  # URLs de fotos
    issues: List[str]  # Problemas encontrados
    weather: str  # Condiciones climáticas
    workers_count: int  # Cantidad de trabajadores
    ai_suggestions: List[str]  # Sugerencias de Claudia
    progress_percentage: float  # Avance del día (0-100)
    notes: str = ""


@dataclass
class Task:
    """Tarea pendiente del proyecto"""

    id: str
    project_id: str
    title: str
    description: str
    status: str  # "pendiente" | "en_proceso" | "completada"
    priority: str  # "baja" | "media" | "alta" | "urgente"
    due_date: Optional[date] = None
    assigned_to: str = ""
    created_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class ProjectManager:
    """Gestor de proyectos y bitácora"""

    def __init__(self, db: firestore.Client):
        """
        Args:
            db: Cliente de Firestore
        """
        self.db = db
        self.projects_ref = db.collection("projects")
        self.bitacoras_ref = db.collection("bitacoras")
        self.tasks_ref = db.collection("tasks")

    def create_project(self, project: Project) -> str:
        """
        Crea un nuevo proyecto

        Args:
            project: Objeto Project

        Returns:
            ID del proyecto creado
        """
        try:
            project_dict = asdict(project)
            project_dict["created_at"] = SERVER_TIMESTAMP

            # Convertir dates a strings para Firestore
            if project.start_date:
                project_dict["start_date"] = project.start_date.isoformat()
            if project.estimated_end_date:
                project_dict["estimated_end_date"] = project.estimated_end_date.isoformat()

            doc_ref = self.projects_ref.add(project_dict)
            project_id = doc_ref[1].id

            logger.info(f"Proyecto creado: {project_id} - {project.name}")

            # Crear tareas iniciales por defecto
            self._create_default_tasks(project_id, project.type)

            return project_id

        except Exception as e:
            logger.error(f"Error creando proyecto: {e}", exc_info=True)
            raise

    def get_project(self, project_id: str) -> Optional[Project]:
        """Obtiene un proyecto por ID"""
        try:
            doc = self.projects_ref.document(project_id).get()
            if doc.exists:
                data = doc.to_dict()
                data["id"] = doc.id

                # Convertir strings a dates
                if data.get("start_date"):
                    data["start_date"] = date.fromisoformat(data["start_date"])
                if data.get("estimated_end_date"):
                    data["estimated_end_date"] = date.fromisoformat(data["estimated_end_date"])

                return Project(**data)
            return None
        except Exception as e:
            logger.error(f"Error obteniendo proyecto {project_id}: {e}")
            return None

    def get_user_projects(self, user_id: str, status: Optional[str] = None) -> List[Project]:
        """
        Obtiene proyectos de un usuario

        Args:
            user_id: ID del usuario
            status: Filtrar por status (opcional)

        Returns:
            Lista de proyectos
        """
        try:
            query = self.projects_ref.where("user_id", "==", user_id)

            if status:
                query = query.where("status", "==", status)

            projects = []
            for doc in query.stream():
                data = doc.to_dict()
                data["id"] = doc.id

                if data.get("start_date"):
                    data["start_date"] = date.fromisoformat(data["start_date"])
                if data.get("estimated_end_date"):
                    data["estimated_end_date"] = date.fromisoformat(data["estimated_end_date"])

                projects.append(Project(**data))

            return projects
        except Exception as e:
            logger.error(f"Error obteniendo proyectos del usuario {user_id}: {e}")
            return []

    def add_bitacora_entry(self, entry: BitacoraEntry) -> bool:
        """
        Agrega entrada a la bitácora

        Args:
            entry: Entrada de bitácora

        Returns:
            True si fue exitoso
        """
        try:
            entry_dict = asdict(entry)
            entry_dict["date"] = entry.date.isoformat()
            entry_dict["timestamp"] = SERVER_TIMESTAMP

            # Guardar en subcollection del proyecto
            self.bitacoras_ref.document(entry.project_id).collection("entries").document(
                entry.date.isoformat()
            ).set(entry_dict, merge=True)

            logger.info(f"Bitácora registrada para proyecto {entry.project_id} - {entry.date}")
            return True

        except Exception as e:
            logger.error(f"Error agregando bitácora: {e}", exc_info=True)
            return False

    def get_bitacora_entries(
        self, project_id: str, start_date: Optional[date] = None, end_date: Optional[date] = None
    ) -> List[BitacoraEntry]:
        """
        Obtiene entradas de bitácora

        Args:
            project_id: ID del proyecto
            start_date: Fecha inicio (opcional)
            end_date: Fecha fin (opcional)

        Returns:
            Lista de entradas
        """
        try:
            query = (
                self.bitacoras_ref.document(project_id)
                .collection("entries")
                .order_by("date", direction=firestore.Query.DESCENDING)
            )

            entries = []
            for doc in query.stream():
                data = doc.to_dict()
                data["date"] = date.fromisoformat(data["date"])

                # Filtrar por fechas si se especificaron
                if start_date and data["date"] < start_date:
                    continue
                if end_date and data["date"] > end_date:
                    continue

                entries.append(BitacoraEntry(**data))

            return entries
        except Exception as e:
            logger.error(f"Error obteniendo bitácora: {e}")
            return []

    def get_today_summary(self, project_id: str) -> str:
        """
        Genera resumen del día para un proyecto

        Args:
            project_id: ID del proyecto

        Returns:
            Resumen en texto
        """
        try:
            project = self.get_project(project_id)
            if not project:
                return "Proyecto no encontrado"

            today = date.today()
            entry = self.get_bitacora_entries(project_id, today, today)

            summary = f"📊 **Resumen del Día - {today.strftime('%d/%m/%Y')}**\n\n"
            summary += f"**Proyecto:** {project.name}\n"
            summary += f"**Estado:** {project.status}\n"
            summary += (
                f"**Presupuesto:** ${project.budget_spent:,.0f} / ${project.budget_total:,.0f}\n\n"
            )

            if entry:
                e = entry[0]
                summary += "**Actividades de Hoy:**\n"
                for act in e.activities:
                    summary += f"  ✓ {act}\n"

                if e.issues:
                    summary += "\n⚠️ **Problemas:**\n"
                    for issue in e.issues:
                        summary += f"  • {issue}\n"

                if e.ai_suggestions:
                    summary += "\n💡 **Sugerencias de Claudia:**\n"
                    for sug in e.ai_suggestions:
                        summary += f"  → {sug}\n"

                summary += f"\n📈 Avance del día: {e.progress_percentage:.1f}%\n"
            else:
                summary += "⚠️ No hay registro de actividades para hoy\n"

            # Obtener tareas pendientes
            pending_tasks = self.get_project_tasks(project_id, status="pendiente")
            if pending_tasks:
                summary += f"\n📋 **Tareas Pendientes:** {len(pending_tasks)}\n"
                for i, task in enumerate(pending_tasks[:3], 1):
                    priority_emoji = {"urgente": "🔴", "alta": "🟠", "media": "🟡", "baja": "🟢"}
                    emoji = priority_emoji.get(task.priority, "⚪")
                    summary += f"  {emoji} {task.title}\n"

                if len(pending_tasks) > 3:
                    summary += f"  ... y {len(pending_tasks) - 3} más\n"

            return summary

        except Exception as e:
            logger.error(f"Error generando resumen del día: {e}")
            return "Error generando resumen"

    def create_task(self, task: Task) -> str:
        """Crea una nueva tarea"""
        try:
            task_dict = asdict(task)
            task_dict["created_at"] = SERVER_TIMESTAMP

            if task.due_date:
                task_dict["due_date"] = task.due_date.isoformat()

            doc_ref = self.tasks_ref.add(task_dict)
            task_id = doc_ref[1].id

            logger.info(f"Tarea creada: {task_id} - {task.title}")
            return task_id

        except Exception as e:
            logger.error(f"Error creando tarea: {e}")
            raise

    def get_project_tasks(self, project_id: str, status: Optional[str] = None) -> List[Task]:
        """Obtiene tareas de un proyecto"""
        try:
            query = self.tasks_ref.where("project_id", "==", project_id)

            if status:
                query = query.where("status", "==", status)

            tasks = []
            for doc in query.order_by("created_at").stream():
                data = doc.to_dict()
                data["id"] = doc.id

                if data.get("due_date"):
                    data["due_date"] = date.fromisoformat(data["due_date"])

                tasks.append(Task(**data))

            return tasks
        except Exception as e:
            logger.error(f"Error obteniendo tareas: {e}")
            return []

    def _create_default_tasks(self, project_id: str, project_type: str):
        """Crea tareas por defecto según tipo de proyecto"""
        default_tasks = {
            "remodelación": [
                ("Levantamiento de medidas", "Medir espacios a remodelar", "alta"),
                ("Cotización de materiales", "Solicitar cotizaciones en Sodimac", "media"),
                ("Definir cronograma", "Establecer fechas de inicio y fin", "alta"),
            ],
            "construcción": [
                ("Revisión de planos", "Validar planos y permisos", "urgente"),
                ("Preparación de terreno", "Limpieza y nivelación", "alta"),
                ("Trazado y replanteo", "Marcar fundaciones", "alta"),
                ("Solicitar materiales fase 1", "Cemento, fierro, áridos", "media"),
            ],
        }

        tasks_to_create = default_tasks.get(project_type, default_tasks["remodelación"])

        for title, description, priority in tasks_to_create:
            task = Task(
                id="",
                project_id=project_id,
                title=title,
                description=description,
                status="pendiente",
                priority=priority,
            )
            self.create_task(task)


# Helper function
def generate_daily_briefing(db: firestore.Client, user_id: str) -> str:
    """
    Genera briefing diario para un maestro

    Args:
        db: Cliente Firestore
        user_id: ID del usuario

    Returns:
        Briefing en texto
    """
    pm = ProjectManager(db)
    projects = pm.get_user_projects(user_id, status="en_curso")

    if not projects:
        return "👋 ¡Buenos días! No tienes proyectos activos en este momento."

    briefing = f"☀️ **Buenos Días** - {date.today().strftime('%d de %B, %Y')}\n\n"

    for project in projects:
        briefing += f"🏗️ **{project.name}**\n"
        briefing += pm.get_today_summary(project.id)
        briefing += "\n---\n\n"

    return briefing


if __name__ == "__main__":
    print("📋 Project Manager - Módulo de Gestión de Proyectos")
    print("Requiere conexión a Firestore para testing")

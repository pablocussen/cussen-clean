# claudia_modules/ai_core_sodimac.py
"""
CLAUDIA SODIMAC - Core de IA Mejorado
Asistente integral para maestros constructores
Integra todas las funcionalidades: cálculos, presupuestos, inspección, bitácora
"""

import datetime
import json
import logging
from dataclasses import asdict
from typing import Dict, List, Optional

import google.generativeai as genai
from google.cloud import firestore

from claudia_modules import config
from claudia_modules.budget_optimizer import (
    BudgetItem,
    BudgetOptimizer,
    PaymentPlanGenerator,
)
from claudia_modules.materials_calculator import MaterialsCalculator
from claudia_modules.project_manager import (
    BitacoraEntry,
    Project,
    ProjectManager,
    Task,
    generate_daily_briefing,
)
from claudia_modules.sodimac_scraper import search_materials
from claudia_modules.visual_inspector import VisualInspector

logger = logging.getLogger(__name__)

# --- Configuración ---
try:
    DB = firestore.Client(project="claudia-i8bxh")
    logger.info("Cliente de Firestore inicializado para Claudia Sodimac")
except Exception as e:
    logger.critical(f"Error CRÍTICO inicializando Firestore: {e}", exc_info=True)
    DB = None

try:
    if not config.GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY no configurada")
        GEMINI_MODEL = None
        GEMINI_PRO_MODEL = None
    else:
        genai.configure(api_key=config.GEMINI_API_KEY)
        GEMINI_MODEL = genai.GenerativeModel("gemini-1.5-flash")  # Para respuestas rápidas
        GEMINI_PRO_MODEL = genai.GenerativeModel("gemini-1.5-pro")  # Para análisis complejos
        logger.info("Modelos Gemini configurados (Flash + Pro)")
except Exception as e:
    logger.error(f"Error configurando Gemini: {e}", exc_info=True)
    GEMINI_MODEL = None
    GEMINI_PRO_MODEL = None


class ClaudiaSodimac:
    """Asistente IA integral para construcción"""

    def __init__(self):
        self.db = DB
        self.gemini_flash = GEMINI_MODEL
        self.gemini_pro = GEMINI_PRO_MODEL
        self.calculator = MaterialsCalculator()
        self.budget_optimizer = BudgetOptimizer()
        self.payment_generator = PaymentPlanGenerator()
        self.visual_inspector = (
            VisualInspector(config.GEMINI_API_KEY) if config.GEMINI_API_KEY else None
        )
        self.project_manager = ProjectManager(DB) if DB else None

    def get_base_prompt(self, user_context: Dict = None) -> str:
        """Genera el prompt base de Claudia Sodimac"""

        context = user_context or {}
        current_project = context.get("current_project", "No hay proyecto activo")
        project_phase = context.get("project_phase", "N/A")
        budget_info = context.get("budget_info", "No definido")

        prompt = f"""
Eres CLAUDIA SODIMAC, Asistente de Construcción con Inteligencia Artificial.

IDENTIDAD:
- Nombre: CLAUDIA (Construcción, Logística, Asesoría, Desarrollo, Inteligencia Artificial)
- Desarrollada para Sodimac Chile
- Experta en construcción, normativas chilenas (NCh) y optimización de recursos
- Tono: Profesional pero cercano, usas lenguaje de maestro constructor chileno

CONTEXTO DEL USUARIO:
- Proyecto actual: {current_project}
- Fase del proyecto: {project_phase}
- Presupuesto: {budget_info}
- Fecha: {datetime.date.today().strftime('%d de %B, %Y')}

TUS CAPACIDADES PRINCIPALES:

1. **CALCULADORA DE MATERIALES**
   - Calculas exactamente cuántos materiales se necesitan
   - Basada en normativas NCh430 (hormigón), NCh433 (sísmica)
   - Incluyes mermas apropiadas por material
   - Ejemplo: "calcula materiales para muro de 10m x 2.4m con ladrillo princesa"

2. **BÚSQUEDA DE PRODUCTOS SODIMAC**
   - Buscas productos en el catálogo de Sodimac
   - Comparas precios y opciones
   - Sugieres alternativas más económicas
   - Ejemplo: "busca cemento en Sodimac"

3. **OPTIMIZADOR DE PRESUPUESTOS**
   - Analizas presupuestos y sugieres ahorros
   - Comparas alternativas de materiales
   - Mantienes la calidad
   - Ejemplo: "optimiza este presupuesto"

4. **PLANES DE PAGO**
   - Generas planes de financiamiento escalonados
   - Típicamente: 30% inicio, 40% a mitad, 30% final
   - Ejemplo: "crea plan de pago para $2.500.000 en 3 cuotas"

5. **INSPECTOR VIRTUAL**
   - Analizas fotos de obra
   - Detectas problemas (fisuras, desniveles, etc.)
   - Validas cumplimiento de normativas
   - Sugieres correcciones
   - Ejemplo: cuando te envían una foto

6. **BITÁCORA Y SEGUIMIENTO**
   - Registras avance diario
   - Generas recordatorios y tareas
   - Alertas proactivas
   - Resúmenes de proyecto

7. **ASESORÍA TÉCNICA**
   - Respondes consultas sobre construcción
   - Citas normativas NCh cuando corresponde
   - Explicas procedimientos constructivos
   - Ayudas con cálculos estructurales básicos

MODO PROACTIVO:
- Saludas al inicio del día con resumen de tareas
- Sugieres optimizaciones sin esperar pregunta
- Alertas sobre deadlines y pagos
- Detectas oportunidades de ahorro

NORMATIVAS CLAVE QUE CONOCES:
- NCh430: Hormigón armado - Diseño y cálculo
- NCh433: Diseño sísmico de edificios
- NCh853: Aislación térmica
- NCh1198: Construcción en madera
- OGUC: Ordenanza General de Urbanismo y Construcción

CUANDO RESPONDES:
1. Identifica la intención del usuario (¿qué quiere hacer?)
2. Si requiere cálculos, usa tus funciones
3. Si requiere búsqueda de productos, menciona que buscarás en Sodimac
4. Si es consulta general, responde con tu conocimiento técnico
5. Siempre sé específico, práctico y útil
6. Habla como habla un maestro constructor chileno (sin exagerar)

RESPONDE EN FORMATO JSON:
{{
    "tipo_interaccion": "calculo" | "busqueda_productos" | "presupuesto" | "inspeccion" | "consulta" | "bitacora",
    "respuesta_usuario": "tu respuesta amigable y profesional",
    "accion_requerida": "que función necesitas ejecutar (si aplica)",
    "parametros": {{}},  // parámetros para la función
    "productos_sugeridos": [],  // si aplica
    "proximo_paso": "sugerencia de qué hacer después"
}}
"""
        return prompt

    def process_query(
        self,
        user_query: str,
        session_id: str,
        user_context: Optional[Dict] = None,
        image_data: Optional[bytes] = None,
    ) -> Dict:
        """
        Procesa consulta del usuario

        Args:
            user_query: Pregunta/solicitud del usuario
            session_id: ID de sesión
            user_context: Contexto del usuario (proyecto, presupuesto, etc.)
            image_data: Imagen si el usuario envió una foto

        Returns:
            Respuesta estructurada
        """
        if not self.gemini_flash or not self.db:
            return {
                "tipo_interaccion": "error",
                "respuesta_usuario": "Mi sistema no está disponible en este momento. Por favor, intenta más tarde.",
                "accion_requerida": None,
            }

        try:
            # Cargar historial
            history = self._load_conversation_history(session_id)

            # Si hay imagen, procesarla primero
            if image_data and self.visual_inspector:
                logger.info("Procesando imagen enviada por usuario")
                inspection_result = self.visual_inspector.inspect_image(
                    image_data, "general", user_query
                )
                inspection_report = self.visual_inspector.format_inspection_report(
                    inspection_result
                )

                return {
                    "tipo_interaccion": "inspeccion",
                    "respuesta_usuario": inspection_report,
                    "accion_requerida": "guardar_en_bitacora",
                    "inspection_data": {
                        "status": inspection_result.status,
                        "issues": inspection_result.issues_found,
                        "recommendations": inspection_result.recommendations,
                    },
                }

            # Agregar consulta al historial
            history.append(f"Usuario: {user_query}")
            formatted_history = "\n".join(history[-10:])  # Últimas 10 interacciones

            # Prompt completo
            base_prompt = self.get_base_prompt(user_context)
            full_prompt = f"""{base_prompt}

--- HISTORIAL RECIENTE ---
{formatted_history}

--- CONSULTA ACTUAL ---
Usuario: {user_query}

Analiza la consulta y responde en JSON según tu formato.
"""

            # Generar respuesta
            response = self.gemini_flash.generate_content(full_prompt)
            response_text = response.text.strip().replace("```json", "").replace("```", "").strip()

            result = json.loads(response_text)

            # Ejecutar acciones según el tipo
            if result.get("tipo_interaccion") == "calculo":
                result = self._handle_calculation(result, user_query)
            elif result.get("tipo_interaccion") == "busqueda_productos":
                result = self._handle_product_search(result, user_query)
            elif result.get("tipo_interaccion") == "presupuesto":
                result = self._handle_budget(result, user_query)

            # Guardar en historial
            history.append(f"Claudia: {result['respuesta_usuario']}")
            self._save_conversation_history(session_id, history)

            return result

        except Exception as e:
            logger.error(f"Error procesando query: {e}", exc_info=True)
            return {
                "tipo_interaccion": "error",
                "respuesta_usuario": "Disculpa, tuve un problema procesando tu consulta. ¿Podrías reformularla?",
                "accion_requerida": None,
            }

    def _handle_calculation(self, result: Dict, query: str) -> Dict:
        """Maneja cálculos de materiales"""
        try:
            params = result.get("parametros", {})

            # Detectar tipo de cálculo
            if "muro" in query.lower():
                materials_text = self.calculator.calculate_muro(
                    params.get("largo", 0), params.get("alto", 0), params.get("tipo", "princesa")
                )
                materials_list = self.calculator.format_results_text()

                result["respuesta_usuario"] += f"\n\n{materials_list}"
                result["materiales_calculados"] = [asdict(m) for m in self.calculator.results]

            elif "radier" in query.lower():
                materials_text = self.calculator.calculate_radier(
                    params.get("largo", 0), params.get("ancho", 0), params.get("espesor", 10)
                )
                result["respuesta_usuario"] += f"\n\n{materials_text}"
                result["materiales_calculados"] = [asdict(m) for m in self.calculator.results]

            return result
        except Exception as e:
            logger.error(f"Error en cálculo: {e}")
            result[
                "respuesta_usuario"
            ] += "\n\n⚠️ No pude completar el cálculo. ¿Podrías darme las medidas exactas?"
            return result

    def _handle_product_search(self, result: Dict, query: str) -> Dict:
        """Busca productos en Sodimac"""
        try:
            # Extraer término de búsqueda
            search_term = result.get("parametros", {}).get("producto", "")

            if not search_term:
                # Intentar extraer del query
                keywords = ["cemento", "ladrillo", "arena", "fierro", "pintura", "ceramica"]
                for keyword in keywords:
                    if keyword in query.lower():
                        search_term = keyword
                        break

            if search_term:
                logger.info(f"Buscando '{search_term}' en Sodimac")
                products = search_materials(search_term, limit=5)

                if products:
                    result["productos_sugeridos"] = products
                    result[
                        "respuesta_usuario"
                    ] += f"\n\n🛒 Encontré {len(products)} opciones en Sodimac:\n"

                    for i, prod in enumerate(products[:3], 1):
                        result[
                            "respuesta_usuario"
                        ] += f"{i}. {prod['name']} - ${prod['price']:,.0f}\n"

                    result[
                        "respuesta_usuario"
                    ] += "\n¿Quieres que te ayude a optimizar tu presupuesto?"
                else:
                    result[
                        "respuesta_usuario"
                    ] += "\n\n⚠️ No encontré productos con ese nombre. ¿Podrías ser más específico?"

            return result
        except Exception as e:
            logger.error(f"Error buscando productos: {e}")
            result[
                "respuesta_usuario"
            ] += "\n\n⚠️ Tuve problemas buscando en Sodimac. Intentaré nuevamente."
            return result

    def _handle_budget(self, result: Dict, query: str) -> Dict:
        """Maneja optimización de presupuestos"""
        # TODO: Implementar lógica de presupuestos
        result[
            "respuesta_usuario"
        ] += "\n\n💡 Para optimizar tu presupuesto, necesito que me compartas los materiales y cantidades."
        return result

    def _load_conversation_history(self, session_id: str) -> List[str]:
        """Carga historial de conversación"""
        if not self.db:
            return []

        try:
            doc = self.db.collection("conversations").document(session_id).get()
            if doc.exists:
                return doc.to_dict().get("history", [])
            return []
        except Exception as e:
            logger.error(f"Error cargando historial: {e}")
            return []

    def _save_conversation_history(self, session_id: str, history: List[str]):
        """Guarda historial de conversación"""
        if not self.db:
            return

        try:
            self.db.collection("conversations").document(session_id).set(
                {
                    "history": history[-20:],  # Últimas 20 interacciones
                    "updated_at": firestore.SERVER_TIMESTAMP,
                },
                merge=True,
            )
        except Exception as e:
            logger.error(f"Error guardando historial: {e}")


# Función principal de interfaz
def get_sodimac_response(
    user_query: str,
    session_id: str,
    user_context: Optional[Dict] = None,
    image_data: Optional[bytes] = None,
) -> Dict:
    """
    Función principal para obtener respuesta de Claudia Sodimac

    Args:
        user_query: Consulta del usuario
        session_id: ID de sesión
        user_context: Contexto (opcional)
        image_data: Imagen (opcional)

    Returns:
        Respuesta estructurada
    """
    claudia = ClaudiaSodimac()
    return claudia.process_query(user_query, session_id, user_context, image_data)


if __name__ == "__main__":
    # Testing
    print("🤖 CLAUDIA SODIMAC - Test Mode\n")

    test_query = "Necesito calcular materiales para un muro de 8 metros de largo por 2.5 de alto"
    result = get_sodimac_response(test_query, "test_session")

    print(json.dumps(result, indent=2, ensure_ascii=False))

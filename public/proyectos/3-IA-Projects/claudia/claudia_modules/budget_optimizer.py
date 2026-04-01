# claudia_modules/budget_optimizer.py
"""
Optimizador de Presupuestos y Generador de Planes de Pago
Compara alternativas, sugiere ahorros y crea planes de financiamiento
"""

import json
import logging
from dataclasses import asdict, dataclass
from datetime import date, timedelta
from typing import Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


@dataclass
class BudgetItem:
    """Item de presupuesto"""

    category: str
    description: str
    quantity: float
    unit: str
    unit_price: float
    total_price: float
    sodimac_sku: str = ""
    sodimac_url: str = ""
    priority: str = "media"  # "baja" | "media" | "alta"


@dataclass
class Budget:
    """Presupuesto completo"""

    project_id: str
    version: int
    items: List[BudgetItem]
    subtotal: float
    contingency_percentage: float  # % para imprevistos
    contingency_amount: float
    total: float
    created_at: date


@dataclass
class Alternative:
    """Alternativa de material"""

    original_item: str
    alternative_name: str
    savings_amount: float
    savings_percentage: float
    quality_impact: str  # "sin_impacto" | "menor" | "moderado" | "alto"
    recommendation: str


@dataclass
class PaymentPlan:
    """Plan de pagos"""

    project_id: str
    total_amount: float
    installments: List[Dict]  # [{amount, due_date, description, status}]
    next_payment_date: Optional[date]
    next_payment_amount: float


class BudgetOptimizer:
    """Optimizador de presupuestos de construcción"""

    # Porcentajes de contingencia recomendados según tipo de proyecto
    CONTINGENCY_RECOMMENDATIONS = {
        "remodelación": 15,  # 15% para remodelaciones
        "construcción": 20,  # 20% para obra nueva
        "ampliación": 18,
    }

    # Alternativas comunes de materiales (más económicas)
    MATERIAL_ALTERNATIVES = {
        "ladrillo princesa": {
            "alternative": "ladrillo fiscal",
            "savings": 25,  # % ahorro
            "quality_impact": "menor",
            "note": "El ladrillo fiscal es más económico, requiere más unidades pero el costo final es menor",
        },
        "cerámica importada": {
            "alternative": "cerámica nacional",
            "savings": 40,
            "quality_impact": "sin_impacto",
            "note": "Las cerámicas nacionales tienen excelente calidad y menor precio",
        },
        "pintura premium": {
            "alternative": "pintura estándar",
            "savings": 30,
            "quality_impact": "menor",
            "note": "Para áreas interiores, pintura estándar ofrece buen rendimiento",
        },
        "madera pino oregon": {
            "alternative": "madera pino radiata",
            "savings": 35,
            "quality_impact": "moderado",
            "note": "Pino radiata es más económico, adecuado para estructura no expuesta",
        },
    }

    def __init__(self):
        self.current_budget: Optional[Budget] = None

    def create_budget(
        self, project_id: str, items: List[BudgetItem], project_type: str = "remodelación"
    ) -> Budget:
        """
        Crea un presupuesto con contingencia

        Args:
            project_id: ID del proyecto
            items: Lista de items
            project_type: Tipo de proyecto

        Returns:
            Presupuesto creado
        """
        # Calcular subtotal
        subtotal = sum(item.total_price for item in items)

        # Contingencia según tipo de proyecto
        contingency_pct = self.CONTINGENCY_RECOMMENDATIONS.get(project_type, 15)
        contingency_amt = subtotal * (contingency_pct / 100)

        total = subtotal + contingency_amt

        budget = Budget(
            project_id=project_id,
            version=1,
            items=items,
            subtotal=subtotal,
            contingency_percentage=contingency_pct,
            contingency_amount=contingency_amt,
            total=total,
            created_at=date.today(),
        )

        self.current_budget = budget
        logger.info(f"Presupuesto creado: ${total:,.0f} para proyecto {project_id}")

        return budget

    def find_savings_opportunities(self, budget: Budget) -> List[Alternative]:
        """
        Encuentra oportunidades de ahorro

        Args:
            budget: Presupuesto a analizar

        Returns:
            Lista de alternativas
        """
        alternatives = []

        for item in budget.items:
            # Buscar alternativas conocidas
            for material_key, alt_data in self.MATERIAL_ALTERNATIVES.items():
                if material_key.lower() in item.description.lower():
                    savings_amount = item.total_price * (alt_data["savings"] / 100)

                    alternative = Alternative(
                        original_item=item.description,
                        alternative_name=alt_data["alternative"],
                        savings_amount=savings_amount,
                        savings_percentage=alt_data["savings"],
                        quality_impact=alt_data["quality_impact"],
                        recommendation=alt_data["note"],
                    )
                    alternatives.append(alternative)

        # Ordenar por ahorro (mayor a menor)
        alternatives.sort(key=lambda x: x.savings_amount, reverse=True)

        logger.info(f"Encontradas {len(alternatives)} oportunidades de ahorro")
        return alternatives

    def optimize_budget(
        self, budget: Budget, max_reduction: float = 20
    ) -> Tuple[Budget, List[Alternative]]:
        """
        Optimiza presupuesto sugiriendo alternativas

        Args:
            budget: Presupuesto original
            max_reduction: Máxima reducción permitida (%)

        Returns:
            Tupla (presupuesto_optimizado, alternativas_aplicadas)
        """
        alternatives = self.find_savings_opportunities(budget)

        # Aplicar alternativas hasta alcanzar reducción máxima
        optimized_items = budget.items.copy()
        applied_alternatives = []
        total_savings = 0

        for alt in alternatives:
            # Buscar item original
            for i, item in enumerate(optimized_items):
                if item.description == alt.original_item:
                    # Calcular nuevo precio
                    new_price = item.total_price * (1 - alt.savings_percentage / 100)

                    # Crear nuevo item
                    optimized_items[i] = BudgetItem(
                        category=item.category,
                        description=f"{alt.alternative_name} (optimizado)",
                        quantity=item.quantity,
                        unit=item.unit,
                        unit_price=new_price / item.quantity,
                        total_price=new_price,
                        sodimac_sku=item.sodimac_sku,
                        sodimac_url=item.sodimac_url,
                        priority=item.priority,
                    )

                    total_savings += alt.savings_amount
                    applied_alternatives.append(alt)
                    break

            # Verificar si ya alcanzamos la reducción máxima
            if (total_savings / budget.subtotal) * 100 >= max_reduction:
                break

        # Crear presupuesto optimizado
        optimized_budget = self.create_budget(
            budget.project_id, optimized_items, "remodelación"  # Default
        )
        optimized_budget.version = budget.version + 1

        logger.info(
            f"Presupuesto optimizado: Ahorro de ${total_savings:,.0f} ({(total_savings/budget.subtotal)*100:.1f}%)"
        )

        return optimized_budget, applied_alternatives

    def compare_budgets(self, budget1: Budget, budget2: Budget) -> str:
        """Compara dos presupuestos y genera reporte"""
        diff_amount = budget2.total - budget1.total
        diff_pct = (diff_amount / budget1.total) * 100

        report = "📊 **COMPARACIÓN DE PRESUPUESTOS**\n\n"
        report += f"**Versión {budget1.version}:**\n"
        report += f"  Subtotal: ${budget1.subtotal:,.0f}\n"
        report += f"  Contingencia ({budget1.contingency_percentage}%): ${budget1.contingency_amount:,.0f}\n"
        report += f"  **Total: ${budget1.total:,.0f}**\n\n"

        report += f"**Versión {budget2.version} (Optimizada):**\n"
        report += f"  Subtotal: ${budget2.subtotal:,.0f}\n"
        report += f"  Contingencia ({budget2.contingency_percentage}%): ${budget2.contingency_amount:,.0f}\n"
        report += f"  **Total: ${budget2.total:,.0f}**\n\n"

        if diff_amount < 0:
            report += f"✅ **Ahorro: ${abs(diff_amount):,.0f}** ({abs(diff_pct):.1f}%)\n"
        else:
            report += f"⚠️ Incremento: ${diff_amount:,.0f} ({diff_pct:.1f}%)\n"

        return report

    def format_budget_report(self, budget: Budget) -> str:
        """Formatea presupuesto en texto legible"""
        report = f"💰 **PRESUPUESTO - Versión {budget.version}**\n"
        report += f"📅 Fecha: {budget.created_at.strftime('%d/%m/%Y')}\n\n"

        # Agrupar por categoría
        by_category = {}
        for item in budget.items:
            if item.category not in by_category:
                by_category[item.category] = []
            by_category[item.category].append(item)

        for category, items in by_category.items():
            category_total = sum(i.total_price for i in items)
            report += f"**{category.upper()}** - ${category_total:,.0f}\n"

            for item in items:
                report += f"  • {item.description}\n"
                report += f"    {item.quantity} {item.unit} × ${item.unit_price:,.0f} = ${item.total_price:,.0f}\n"

            report += "\n"

        report += "---\n"
        report += f"**Subtotal:** ${budget.subtotal:,.0f}\n"
        report += f"**Contingencia ({budget.contingency_percentage}%):** ${budget.contingency_amount:,.0f}\n"
        report += f"**TOTAL:** ${budget.total:,.0f}\n"

        return report


class PaymentPlanGenerator:
    """Generador de planes de pago"""

    def __init__(self):
        pass

    def generate_plan(
        self,
        project_id: str,
        total_amount: float,
        num_installments: int = 3,
        start_date: Optional[date] = None,
    ) -> PaymentPlan:
        """
        Genera plan de pagos escalonado

        Args:
            project_id: ID del proyecto
            total_amount: Monto total
            num_installments: Número de cuotas
            start_date: Fecha de inicio (default: hoy)

        Returns:
            Plan de pagos
        """
        if start_date is None:
            start_date = date.today()

        installments = []

        # Plan estándar de construcción:
        # 30% inicio, 40% al 50% de avance, 30% al finalizar
        if num_installments == 3:
            percentages = [30, 40, 30]
            descriptions = [
                "Pago inicial - Compra materiales fase 1",
                "Pago intermedio - 50% avance obra",
                "Pago final - Entrega de obra",
            ]
            days_intervals = [0, 15, 30]  # Días entre pagos

        # Plan más fraccionado
        elif num_installments == 4:
            percentages = [25, 25, 25, 25]
            descriptions = [
                "Pago 1 - Materiales iniciales",
                "Pago 2 - 25% avance",
                "Pago 3 - 50% avance",
                "Pago 4 - Finalización",
            ]
            days_intervals = [0, 10, 20, 30]

        else:
            # Distribuir equitativamente
            percentages = [100 / num_installments] * num_installments
            descriptions = [f"Cuota {i+1}" for i in range(num_installments)]
            days_intervals = [i * 10 for i in range(num_installments)]

        for i, (pct, desc, days) in enumerate(zip(percentages, descriptions, days_intervals)):
            amount = total_amount * (pct / 100)
            due_date = start_date + timedelta(days=days)

            installments.append(
                {
                    "installment_number": i + 1,
                    "amount": amount,
                    "due_date": due_date.isoformat(),
                    "description": desc,
                    "status": "pendiente" if i > 0 else "próximo",
                    "percentage": pct,
                }
            )

        plan = PaymentPlan(
            project_id=project_id,
            total_amount=total_amount,
            installments=installments,
            next_payment_date=start_date,
            next_payment_amount=installments[0]["amount"],
        )

        logger.info(f"Plan de pagos generado: {num_installments} cuotas para ${total_amount:,.0f}")
        return plan

    def format_payment_plan(self, plan: PaymentPlan) -> str:
        """Formatea plan de pagos en texto"""
        report = "💳 **PLAN DE PAGOS**\n\n"
        report += f"**Total:** ${plan.total_amount:,.0f}\n"
        report += f"**Cuotas:** {len(plan.installments)}\n\n"

        for inst in plan.installments:
            status_emoji = {"pendiente": "⏳", "próximo": "🔔", "pagado": "✅"}
            emoji = status_emoji.get(inst["status"], "⚪")

            due_date = date.fromisoformat(inst["due_date"])

            report += f"{emoji} **Cuota {inst['installment_number']}** - ${inst['amount']:,.0f} ({inst['percentage']:.0f}%)\n"
            report += f"   📅 Fecha: {due_date.strftime('%d/%m/%Y')}\n"
            report += f"   📝 {inst['description']}\n\n"

        if plan.next_payment_date:
            report += f"⏰ **Próximo pago:** ${plan.next_payment_amount:,.0f} el {plan.next_payment_date.strftime('%d/%m/%Y')}\n"

        return report


if __name__ == "__main__":
    # Testing
    print("💰 Budget Optimizer - Test Mode\n")

    # Crear presupuesto de ejemplo
    items = [
        BudgetItem("Materiales", "Cemento", 20, "sacos", 8500, 170000),
        BudgetItem("Materiales", "Ladrillo princesa", 800, "unidades", 450, 360000),
        BudgetItem("Terminaciones", "Cerámica importada", 25, "m²", 18000, 450000),
    ]

    optimizer = BudgetOptimizer()
    budget = optimizer.create_budget("test_project", items, "remodelación")
    print(optimizer.format_budget_report(budget))

    print("\n" + "=" * 50 + "\n")

    # Generar plan de pagos
    generator = PaymentPlanGenerator()
    plan = generator.generate_plan("test_project", budget.total, num_installments=3)
    print(generator.format_payment_plan(plan))

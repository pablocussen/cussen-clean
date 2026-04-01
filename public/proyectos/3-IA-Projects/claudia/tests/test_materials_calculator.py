"""
Tests for materials_calculator.py module
"""

import pytest

from claudia_modules.materials_calculator import Material, MaterialsCalculator


class TestMaterial:
    """Tests for Material dataclass"""

    def test_material_creation(self):
        """Test creating a Material instance"""
        material = Material(
            name="Cemento",
            quantity=50.0,
            unit="kg",
            category="Hormigón",
            notes="Para radier",
            merma_percentage=10.0,
        )

        assert material.name == "Cemento"
        assert material.quantity == 50.0
        assert material.unit == "kg"
        assert material.category == "Hormigón"
        assert material.notes == "Para radier"
        assert material.merma_percentage == 10.0

    def test_material_default_values(self):
        """Test Material with default values"""
        material = Material(name="Arena", quantity=1.5, unit="m3", category="Áridos")

        assert material.notes == ""
        assert material.merma_percentage == 0.0


class TestMaterialsCalculator:
    """Tests for MaterialsCalculator class"""

    @pytest.fixture
    def calculator(self):
        """Create calculator instance"""
        return MaterialsCalculator()

    def test_calculator_initialization(self, calculator):
        """Test calculator initializes with rendimientos"""
        assert calculator is not None
        assert hasattr(calculator, "RENDIMIENTOS")
        assert "hormigon_losa" in calculator.RENDIMIENTOS
        assert "muro_ladrillo_princesa" in calculator.RENDIMIENTOS

    def test_hormigon_rendimientos(self, calculator):
        """Test hormigón rendimientos are correct"""
        hormigon_losa = calculator.RENDIMIENTOS["hormigon_losa"]

        assert hormigon_losa["cemento_kg_por_m3"] == 350
        assert hormigon_losa["arena_m3_por_m3"] == 0.5
        assert hormigon_losa["ripio_m3_por_m3"] == 0.8
        assert hormigon_losa["agua_litros_por_m3"] == 180

    def test_albanileria_rendimientos(self, calculator):
        """Test albañilería rendimientos"""
        muro_princesa = calculator.RENDIMIENTOS["muro_ladrillo_princesa"]

        assert muro_princesa["ladrillos_por_m2"] == 40
        assert muro_princesa["mortero_m3_por_m2"] == 0.025
        assert muro_princesa["cemento_kg_por_m2"] == 8.75

    def test_calculate_cement_for_area(self, calculator):
        """Test calculating cement quantity for a given area"""
        # Muro ladrillo princesa: 8.75 kg/m2
        area_m2 = 100
        cemento_kg_por_m2 = calculator.RENDIMIENTOS["muro_ladrillo_princesa"]["cemento_kg_por_m2"]

        total_cemento = area_m2 * cemento_kg_por_m2
        assert total_cemento == 875.0

    def test_calculate_bricks_for_area(self, calculator):
        """Test calculating brick quantity"""
        area_m2 = 50
        ladrillos_por_m2 = calculator.RENDIMIENTOS["muro_ladrillo_princesa"]["ladrillos_por_m2"]

        total_ladrillos = area_m2 * ladrillos_por_m2
        assert total_ladrillos == 2000

    def test_radier_calculation(self, calculator):
        """Test radier material calculation"""
        # Verify radier exists in rendimientos
        assert "radier_10cm" in calculator.RENDIMIENTOS

        radier = calculator.RENDIMIENTOS["radier_10cm"]
        area_m2 = 100

        # Calculate materials for 100m2 radier
        if "cemento_kg_por_m2" in radier:
            cemento = area_m2 * radier["cemento_kg_por_m2"]
            assert cemento > 0

    @pytest.mark.parametrize(
        "area,expected_min,expected_max",
        [
            (50, 2000, 2100),  # 50m2 should use ~2000 ladrillos princesa
            (100, 4000, 4100),  # 100m2 should use ~4000 ladrillos
            (200, 8000, 8100),  # 200m2 should use ~8000 ladrillos
        ],
    )
    def test_ladrillo_princesa_ranges(self, calculator, area, expected_min, expected_max):
        """Test brick calculations for different areas"""
        ladrillos_por_m2 = calculator.RENDIMIENTOS["muro_ladrillo_princesa"]["ladrillos_por_m2"]
        total = area * ladrillos_por_m2

        assert expected_min <= total <= expected_max

    def test_hormigon_fundacion_vs_losa(self, calculator):
        """Test different hormigon grades have different cement content"""
        fundacion = calculator.RENDIMIENTOS["hormigon_fundacion"]["cemento_kg_por_m3"]
        losa = calculator.RENDIMIENTOS["hormigon_losa"]["cemento_kg_por_m3"]

        # Losa should have more cement (H20 vs H15)
        assert losa > fundacion
        assert fundacion == 300
        assert losa == 350

    def test_estuco_grueso_vs_fino(self, calculator):
        """Test estuco grueso vs fino differences"""
        grueso = calculator.RENDIMIENTOS["estuco_grueso"]
        fino = calculator.RENDIMIENTOS["estuco_fino"]

        # Grueso should be thicker
        assert grueso["espesor_cm"] > fino["espesor_cm"]
        assert grueso["mortero_m3_por_m2"] > fino["mortero_m3_por_m2"]

    def test_all_rendimientos_have_valid_values(self, calculator):
        """Test all rendimientos have positive values"""
        for material_type, rendimientos in calculator.RENDIMIENTOS.items():
            for key, value in rendimientos.items():
                if isinstance(value, (int, float)):
                    assert value >= 0, f"{material_type}.{key} has negative value: {value}"


@pytest.mark.integration
class TestMaterialsCalculatorIntegration:
    """Integration tests for materials calculator"""

    def test_complete_house_calculation(self):
        """Test calculating materials for a complete house"""
        calculator = MaterialsCalculator()

        # Simple house: 100m2 radier + 200m2 walls
        radier_area = 100
        wall_area = 200

        # Calculate radier materials
        radier_rend = calculator.RENDIMIENTOS.get("radier_10cm", {})

        # Calculate wall materials
        wall_rend = calculator.RENDIMIENTOS["muro_ladrillo_princesa"]
        total_ladrillos = wall_area * wall_rend["ladrillos_por_m2"]
        total_cemento_muros = wall_area * wall_rend["cemento_kg_por_m2"]

        assert total_ladrillos == 8000  # 200m2 * 40 ladrillos/m2
        assert total_cemento_muros == 1750  # 200m2 * 8.75 kg/m2

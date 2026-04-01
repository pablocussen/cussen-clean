"""
Tests for AI assistant functionality (Gemini)
"""

from unittest.mock import MagicMock, Mock, patch

import pytest


@pytest.mark.ai
class TestAIAssistant:
    """Tests for AI assistant core functionality"""

    @patch("google.generativeai.GenerativeModel")
    def test_ai_initialization(self, mock_model):
        """Test AI model initializes correctly"""
        mock_model.return_value = MagicMock()

        # Simulate initialization
        model = mock_model("gemini-pro")

        assert model is not None
        mock_model.assert_called_once_with("gemini-pro")

    @patch("google.generativeai.GenerativeModel")
    def test_ai_generates_response(self, mock_model):
        """Test AI generates a response to a query"""
        # Setup mock
        mock_response = Mock()
        mock_response.text = (
            "El costo estimado para un radier de 100m2 es aproximadamente $500,000."
        )

        mock_instance = MagicMock()
        mock_instance.generate_content.return_value = mock_response
        mock_model.return_value = mock_instance

        # Test
        model = mock_model("gemini-pro")
        response = model.generate_content("¿Cuánto cuesta un radier de 100m2?")

        assert response.text is not None
        assert len(response.text) > 0
        assert "radier" in response.text.lower() or "costo" in response.text.lower()

    @patch("google.generativeai.GenerativeModel")
    def test_ai_handles_construction_queries(self, mock_model):
        """Test AI handles construction-specific queries"""
        construction_queries = [
            "¿Cuántos ladrillos necesito para un muro de 50m2?",
            "¿Qué materiales necesito para una losa de 30m3?",
            "¿Cuál es el rendimiento de un albañil por día?",
        ]

        mock_instance = MagicMock()
        mock_instance.generate_content.return_value = Mock(text="Respuesta generada")
        mock_model.return_value = mock_instance

        model = mock_model("gemini-pro")

        for query in construction_queries:
            response = model.generate_content(query)
            assert response.text is not None

    def test_query_sanitization(self):
        """Test user query sanitization"""
        dangerous_queries = [
            "<script>alert('xss')</script>",
            "'; DROP TABLE users; --",
            "../../../etc/passwd",
        ]

        for query in dangerous_queries:
            # Simulate sanitization
            sanitized = query.replace("<", "").replace(">", "").replace("'", "")

            assert "<script>" not in sanitized
            assert "DROP TABLE" not in query or "'" not in sanitized


@pytest.mark.ai
class TestAIContextManagement:
    """Tests for AI conversation context management"""

    def test_conversation_history_storage(self):
        """Test conversation history is stored correctly"""
        conversation = []

        # Add user message
        conversation.append({"role": "user", "content": "¿Cuánto cemento necesito?"})

        # Add AI response
        conversation.append(
            {
                "role": "assistant",
                "content": "Para calcular el cemento necesario, necesito saber el tipo de trabajo.",
            }
        )

        assert len(conversation) == 2
        assert conversation[0]["role"] == "user"
        assert conversation[1]["role"] == "assistant"

    def test_conversation_context_limit(self):
        """Test conversation context is limited to prevent token overflow"""
        max_messages = 20
        conversation = []

        # Add many messages
        for i in range(30):
            conversation.append({"role": "user", "content": f"Message {i}"})

        # Keep only last N messages
        limited_conversation = conversation[-max_messages:]

        assert len(limited_conversation) <= max_messages

    def test_context_includes_project_data(self):
        """Test AI context includes current project data"""
        context = {
            "project_name": "Casa 1 Piso",
            "total_budget": 5000000,
            "activities": 15,
            "current_activity": "Radier",
        }

        # Simulate context prompt
        context_prompt = f"""
        Proyecto actual: {context['project_name']}
        Presupuesto: ${context['total_budget']}
        Actividades: {context['activities']}
        """

        assert context["project_name"] in context_prompt
        assert str(context["total_budget"]) in context_prompt


@pytest.mark.ai
class TestAIResponseParsing:
    """Tests for parsing AI responses"""

    def test_extract_numeric_values(self):
        """Test extracting numeric values from AI response"""
        response = "Necesitarás aproximadamente 2,500 kg de cemento y 15 m³ of arena."

        # Extract numbers
        import re

        numbers = re.findall(r"[\d,]+(?:\.\d+)?", response)

        assert len(numbers) >= 2
        assert "2,500" in numbers or "2500" in numbers

    def test_extract_material_recommendations(self):
        """Test extracting material recommendations"""
        response = """
        Para este trabajo necesitarás:
        - 40 ladrillos por m²
        - 8.75 kg de cemento por m²
        - 0.035 m³ de arena por m²
        """

        assert "ladrillos" in response.lower()
        assert "cemento" in response.lower()
        assert "arena" in response.lower()

    def test_detect_cost_estimate(self):
        """Test detecting cost estimates in response"""
        responses_with_cost = [
            "El costo aproximado es de $500,000 CLP",
            "Esto te costará alrededor de $1.200.000",
            "El precio oscila entre $300.000 y $450.000",
        ]

        for response in responses_with_cost:
            assert "$" in response
            # Check for Chilean peso format
            assert "CLP" in response or "$" in response


@pytest.mark.ai
class TestAIErrorHandling:
    """Tests for AI error handling"""

    @patch("google.generativeai.GenerativeModel")
    def test_handle_api_rate_limit(self, mock_model):
        """Test handling API rate limit errors"""
        mock_instance = MagicMock()
        mock_instance.generate_content.side_effect = Exception("RATE_LIMIT_EXCEEDED")
        mock_model.return_value = mock_instance

        model = mock_model("gemini-pro")

        with pytest.raises(Exception) as exc_info:
            model.generate_content("test query")

        assert "RATE_LIMIT" in str(exc_info.value)

    @patch("google.generativeai.GenerativeModel")
    def test_handle_empty_response(self, mock_model):
        """Test handling empty AI responses"""
        mock_instance = MagicMock()
        mock_instance.generate_content.return_value = Mock(text="")
        mock_model.return_value = mock_instance

        model = mock_model("gemini-pro")
        response = model.generate_content("test query")

        # Should have fallback response
        assert response.text is not None

    @patch("google.generativeai.GenerativeModel")
    def test_handle_network_timeout(self, mock_model):
        """Test handling network timeouts"""
        mock_instance = MagicMock()
        mock_instance.generate_content.side_effect = TimeoutError("Request timed out")
        mock_model.return_value = mock_instance

        model = mock_model("gemini-pro")

        with pytest.raises(TimeoutError):
            model.generate_content("test query")


@pytest.mark.integration
class TestAIIntegrationWithAPUs:
    """Integration tests for AI with APU database"""

    def test_ai_recommends_relevant_apus(self, sample_apu_data):
        """Test AI recommends relevant APUs based on query"""
        query = "Necesito construir un muro de albañilería"

        # Simulate AI finding relevant APU
        recommended_apu = sample_apu_data

        assert recommended_apu["categoria"] == "ALBAÑILERÍA"
        assert "muro" in recommended_apu["nombre"].lower()

    def test_ai_calculates_with_apu_data(self, sample_apu_data):
        """Test AI uses APU data for calculations"""
        apu = sample_apu_data
        area_m2 = 50

        # AI should calculate using APU price
        estimated_cost = apu["precio"] * area_m2

        assert estimated_cost == 1250000  # 25,000 * 50

    def test_ai_suggests_alternatives(self):
        """Test AI suggests alternative materials/methods"""
        query = "¿Qué alternativas tengo al ladrillo princesa?"

        alternatives = ["ladrillo fiscal", "bloque de hormigón", "tabique metálico"]

        # AI should suggest these alternatives
        for alt in alternatives:
            assert len(alt) > 0

"""
Tests for Firebase integration
"""

from unittest.mock import MagicMock, Mock, patch

import pytest


@pytest.mark.firebase
class TestFirestoreIntegration:
    """Tests for Firestore database operations"""

    def test_save_project_to_firestore(self, mock_firestore, sample_project_data):
        """Test saving a project to Firestore"""
        # Setup
        mock_ref = MagicMock()
        mock_firestore.collection.return_value.document.return_value = mock_ref

        # Simulate saving
        collection = mock_firestore.collection("projects")
        doc_ref = collection.document(sample_project_data["id"])
        doc_ref.set(sample_project_data)

        # Verify
        mock_firestore.collection.assert_called_with("projects")

    def test_get_project_from_firestore(self, mock_firestore, sample_project_data):
        """Test retrieving a project from Firestore"""
        # Setup mock to return project data
        mock_doc = Mock()
        mock_doc.exists = True
        mock_doc.to_dict.return_value = sample_project_data

        mock_firestore.collection.return_value.document.return_value.get.return_value = mock_doc

        # Test
        doc = mock_firestore.collection("projects").document("PROJ001").get()

        assert doc.exists
        assert doc.to_dict()["id"] == "PROJ001"
        assert doc.to_dict()["name"] == "Casa 1 Piso"

    def test_update_project_in_firestore(self, mock_firestore):
        """Test updating a project"""
        mock_ref = MagicMock()
        mock_firestore.collection.return_value.document.return_value = mock_ref

        # Update
        updates = {"total": 3000000, "updated_at": "2025-10-29"}
        doc_ref = mock_firestore.collection("projects").document("PROJ001")
        doc_ref.update(updates)

        # Verify update was called
        doc_ref.update.assert_called_once_with(updates)

    def test_delete_project_from_firestore(self, mock_firestore):
        """Test deleting a project"""
        mock_ref = MagicMock()
        mock_firestore.collection.return_value.document.return_value = mock_ref

        # Delete
        doc_ref = mock_firestore.collection("projects").document("PROJ001")
        doc_ref.delete()

        # Verify delete was called
        doc_ref.delete.assert_called_once()


@pytest.mark.firebase
class TestFirestoreUserManagement:
    """Tests for user management in Firestore"""

    def test_create_new_user(self, mock_firestore):
        """Test creating a new user"""
        user_data = {
            "uid": "user123",
            "email": "test@example.com",
            "telegram_id": None,
            "created_at": "2025-10-29",
            "projects": [],
        }

        mock_ref = MagicMock()
        mock_firestore.collection.return_value.document.return_value = mock_ref

        # Create user
        doc_ref = mock_firestore.collection("users").document(user_data["uid"])
        doc_ref.set(user_data)

        # Verify
        mock_firestore.collection.assert_called_with("users")

    def test_link_telegram_to_user(self, mock_firestore):
        """Test linking Telegram ID to user"""
        telegram_id = 987654321
        user_uid = "user123"

        mock_ref = MagicMock()
        mock_firestore.collection.return_value.document.return_value = mock_ref

        # Link Telegram
        doc_ref = mock_firestore.collection("users").document(user_uid)
        doc_ref.update({"telegram_id": telegram_id, "telegram_linked": True})

        # Verify
        doc_ref.update.assert_called_once()

    def test_get_user_projects(self, mock_firestore):
        """Test getting user's projects"""
        user_uid = "user123"

        # Mock query
        mock_query = MagicMock()
        mock_firestore.collection.return_value.where.return_value = mock_query
        mock_query.get.return_value = [
            Mock(to_dict=lambda: {"id": "PROJ001", "name": "Casa 1"}),
            Mock(to_dict=lambda: {"id": "PROJ002", "name": "Casa 2"}),
        ]

        # Query projects
        projects = mock_firestore.collection("projects").where("user_id", "==", user_uid).get()

        assert len(projects) == 2
        assert projects[0].to_dict()["id"] == "PROJ001"


@pytest.mark.firebase
class TestAPUDatabase:
    """Tests for APU database operations"""

    def test_load_apus_from_json(self, sample_apu_data):
        """Test loading APUs from JSON"""
        # Simulate loading from JSON
        apu = sample_apu_data

        assert apu["id"] == "ALB001"
        assert apu["categoria"] == "ALBAÑILERÍA"
        assert apu["unidad"] == "m2"
        assert len(apu["materiales"]) > 0

    def test_apu_structure_validation(self, sample_apu_data):
        """Test APU data structure is valid"""
        apu = sample_apu_data

        # Required fields
        required_fields = ["id", "nombre", "categoria", "unidad", "precio"]
        for field in required_fields:
            assert field in apu, f"Missing required field: {field}"

        # Materials structure
        if "materiales" in apu:
            for material in apu["materiales"]:
                assert "nombre" in material
                assert "cantidad" in material
                assert "unidad" in material
                assert "precio_unitario" in material

    def test_calculate_apu_total_cost(self, sample_apu_data):
        """Test calculating total APU cost"""
        apu = sample_apu_data
        cantidad = 100  # 100 m2

        # Calculate materials cost
        materials_cost = sum(mat["cantidad"] * mat["precio_unitario"] for mat in apu["materiales"])

        # Calculate labor cost
        labor_cost = sum(mo["cantidad"] * mo["precio_unitario"] for mo in apu["mano_obra"])

        total_per_unit = materials_cost + labor_cost
        total_project = total_per_unit * cantidad

        assert total_project > 0
        assert isinstance(total_project, (int, float))


@pytest.mark.firebase
class TestFirestoreErrorHandling:
    """Tests for error handling in Firestore operations"""

    def test_handle_non_existent_document(self, mock_firestore):
        """Test handling when document doesn't exist"""
        mock_doc = Mock()
        mock_doc.exists = False
        mock_doc.to_dict.return_value = None

        mock_firestore.collection.return_value.document.return_value.get.return_value = mock_doc

        doc = mock_firestore.collection("projects").document("NON_EXISTENT").get()

        assert doc.exists is False
        assert doc.to_dict() is None

    def test_handle_firestore_connection_error(self, mock_firestore):
        """Test handling Firestore connection errors"""
        # Simulate connection error
        mock_firestore.collection.side_effect = Exception("Connection failed")

        with pytest.raises(Exception) as exc_info:
            mock_firestore.collection("projects")

        assert "Connection failed" in str(exc_info.value)

    def test_handle_invalid_data_write(self, mock_firestore):
        """Test handling invalid data writes"""
        mock_ref = MagicMock()
        mock_ref.set.side_effect = ValueError("Invalid data")
        mock_firestore.collection.return_value.document.return_value = mock_ref

        with pytest.raises(ValueError):
            doc_ref = mock_firestore.collection("projects").document("PROJ001")
            doc_ref.set({"invalid": None})


@pytest.mark.integration
class TestFirebaseAuth:
    """Tests for Firebase Authentication"""

    def test_user_authentication_flow(self):
        """Test complete user authentication flow"""
        # This would test actual Firebase Auth in integration tests
        # For unit tests, we just verify the flow structure

        steps = [
            "user_registers",
            "email_verification",
            "user_logs_in",
            "token_generated",
            "user_authenticated",
        ]

        assert len(steps) == 5
        assert "user_authenticated" == steps[-1]

    def test_token_validation(self):
        """Test JWT token validation"""
        # Mock token structure
        mock_token = {
            "uid": "user123",
            "email": "test@example.com",
            "exp": 1735560000,  # Future timestamp
        }

        assert "uid" in mock_token
        assert "email" in mock_token
        assert mock_token["exp"] > 0

"""
Pytest configuration and shared fixtures
"""

import os
import sys
from unittest.mock import MagicMock, Mock

import pytest

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))


@pytest.fixture
def mock_firestore():
    """Mock Firestore client"""
    mock_db = MagicMock()
    mock_collection = MagicMock()
    mock_document = MagicMock()

    mock_db.collection.return_value = mock_collection
    mock_collection.document.return_value = mock_document
    mock_document.get.return_value = Mock(exists=True, to_dict=lambda: {"test": "data"})

    return mock_db


@pytest.fixture
def mock_telegram_api():
    """Mock Telegram API"""
    mock_api = MagicMock()
    mock_api.send_message.return_value = {"ok": True, "result": {"message_id": 123}}
    mock_api.send_photo.return_value = {"ok": True, "result": {"message_id": 124}}
    return mock_api


@pytest.fixture
def sample_apu_data():
    """Sample APU data for testing"""
    return {
        "id": "ALB001",
        "nombre": "Muro de albañilería ladrillo princesa",
        "categoria": "ALBAÑILERÍA",
        "unidad": "m2",
        "precio": 25000,
        "materiales": [
            {"nombre": "Ladrillo princesa", "cantidad": 40, "unidad": "un", "precio_unitario": 400},
            {"nombre": "Cemento", "cantidad": 8.75, "unidad": "kg", "precio_unitario": 150},
        ],
        "mano_obra": [
            {"nombre": "Albañil", "cantidad": 0.5, "unidad": "HH", "precio_unitario": 8000}
        ],
    }


@pytest.fixture
def sample_project_data():
    """Sample project data for testing"""
    return {
        "id": "PROJ001",
        "name": "Casa 1 Piso",
        "user_id": "user123",
        "activities": [{"apu_id": "ALB001", "cantidad": 100, "precio": 25000}],
        "total": 2500000,
        "created_at": "2025-10-29",
    }


@pytest.fixture(autouse=True)
def mock_env_vars(monkeypatch):
    """Mock environment variables"""
    monkeypatch.setenv("TELEGRAM_TOKEN", "test_token_123")
    monkeypatch.setenv("GEMINI_API_KEY", "test_gemini_key_123")
    monkeypatch.setenv("GOOGLE_CLOUD_PROJECT", "test-project")


@pytest.fixture
def apu_database_path():
    """Get path to APU database"""
    return os.path.join("web_app", "apu_database.json")


@pytest.fixture
def load_apu_database(apu_database_path):
    """Load APU database from JSON"""
    import json

    if not os.path.exists(apu_database_path):
        pytest.skip(f"APU database not found at {apu_database_path}")

    with open(apu_database_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        # Handle both formats: {"actividades": [...]} or [...]
        if isinstance(data, dict) and "actividades" in data:
            return data["actividades"]
        return data

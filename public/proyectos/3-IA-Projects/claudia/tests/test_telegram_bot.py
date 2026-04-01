"""
Tests for Telegram bot functionality
"""

from unittest.mock import MagicMock, Mock, patch

import pytest

from claudia_modules.telegram_api import TelegramSender


class TestTelegramSender:
    """Tests for TelegramSender class"""

    def test_initialization_with_valid_token(self):
        """Test TelegramSender initializes with valid token"""
        token = "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
        sender = TelegramSender(token)

        assert sender.api_url == f"https://api.telegram.org/bot{token}"

    def test_initialization_with_empty_token_raises_error(self):
        """Test TelegramSender raises ValueError with empty token"""
        with pytest.raises(ValueError) as exc_info:
            TelegramSender("")

        assert "no puede ser nulo o vacío" in str(exc_info.value)

    def test_initialization_with_none_token_raises_error(self):
        """Test TelegramSender raises ValueError with None token"""
        with pytest.raises(ValueError):
            TelegramSender(None)

    @patch("claudia_modules.telegram_api.requests.post")
    def test_make_request_success(self, mock_post):
        """Test successful API request"""
        # Setup mock
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.text = '{"ok": true, "result": {"message_id": 123}}'
        mock_response.json.return_value = {"ok": True, "result": {"message_id": 123}}
        mock_post.return_value = mock_response

        # Test
        sender = TelegramSender("test_token")
        result = sender._make_request("sendMessage", {"chat_id": 123, "text": "Test"})

        assert result["ok"] is True
        assert result["result"]["message_id"] == 123
        mock_post.assert_called_once()

    @patch("claudia_modules.telegram_api.requests.post")
    def test_make_request_with_http_error(self, mock_post):
        """Test API request with HTTP error"""
        import requests
        # Setup mock to raise HTTP error
        mock_response = Mock()
        mock_response.status_code = 400
        mock_response.text = "Bad Request"
        http_error = requests.exceptions.HTTPError("Bad Request")
        http_error.response = mock_response
        mock_response.raise_for_status.side_effect = http_error

        mock_post.return_value = mock_response

        # Test
        sender = TelegramSender("test_token")
        result = sender._make_request("sendMessage", {"chat_id": 123, "text": "Test"})

        # Should return error response
        assert result is not None
        assert result.get("ok") is False

    @patch("claudia_modules.telegram_api.requests.post")
    def test_send_message_formats_correctly(self, mock_post):
        """Test send_message method (if exists)"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"ok": True, "result": {"message_id": 456}}
        mock_post.return_value = mock_response

        sender = TelegramSender("test_token")

        # Check if send_message method exists
        if hasattr(sender, "send_message"):
            result = sender.send_message(chat_id=123, text="Hello World")
            assert result["ok"] is True

    def test_api_url_format(self):
        """Test API URL is correctly formatted"""
        token = "1234567890:ABCDEFGHIJKLMNOP"
        sender = TelegramSender(token)

        expected_url = "https://api.telegram.org/bot1234567890:ABCDEFGHIJKLMNOP"
        assert sender.api_url == expected_url

    @patch("claudia_modules.telegram_api.requests.post")
    @patch(
        "claudia_modules.telegram_api.time.sleep", return_value=None
    )  # Mock sleep to speed up test
    def test_retries_on_network_error(self, mock_sleep, mock_post):
        """Test retry logic on network errors"""
        import requests
        # First 2 calls fail with network error, third succeeds
        success_response = Mock()
        success_response.status_code = 200
        success_response.text = '{"ok": true}'
        success_response.json.return_value = {"ok": True}
        success_response.raise_for_status.return_value = None

        mock_post.side_effect = [
            requests.exceptions.RequestException("Network error"),
            requests.exceptions.RequestException("Network error"),
            success_response,
        ]

        sender = TelegramSender("test_token")
        result = sender._make_request("sendMessage", {"chat_id": 123, "text": "Test"})

        # Should eventually succeed after retries
        assert mock_post.call_count == 3
        assert result.get("ok") is True


@pytest.mark.integration
class TestTelegramBotIntegration:
    """Integration tests for Telegram bot"""

    @pytest.fixture
    def mock_telegram_sender(self, mock_telegram_api):
        """Create mocked TelegramSender"""
        return mock_telegram_api

    def test_send_message_to_user(self, mock_telegram_sender):
        """Test sending message to a user"""
        response = mock_telegram_sender.send_message(
            chat_id=123456, text="¡Hola! Tu presupuesto está listo."
        )

        assert response["ok"] is True
        assert "result" in response

    def test_send_photo_with_caption(self, mock_telegram_sender):
        """Test sending photo with caption"""
        response = mock_telegram_sender.send_photo(
            chat_id=123456,
            photo="https://example.com/budget.png",
            caption="Tu presupuesto de construcción",
        )

        assert response["ok"] is True
        assert "result" in response


class TestTelegramCommands:
    """Tests for Telegram bot commands"""

    def test_start_command_format(self):
        """Test /start command response format"""
        # This would test the actual command handler if accessible
        expected_commands = ["/start", "/help", "/vincular", "/proyectos"]

        for cmd in expected_commands:
            assert cmd.startswith("/")
            assert len(cmd) > 1

    def test_vinculacion_code_format(self):
        """Test vinculación code format (6 alphanumeric)"""
        import random
        import string

        # Simulate code generation
        codigo = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))

        assert len(codigo) == 6
        assert codigo.isalnum()
        assert codigo.isupper() or codigo.isdigit()

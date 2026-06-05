"""Test suite for script styles API."""

import sys
from pathlib import Path

# Add backend to path for imports
backend_path = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_health_check():
    """Test that health check endpoint still works."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_script_styles_endpoint_status():
    """Test that /api/script/styles returns 200."""
    response = client.get("/api/script/styles")
    assert response.status_code == 200


def test_script_styles_contains_styles_field():
    """Test that response contains 'styles' field."""
    response = client.get("/api/script/styles")
    data = response.json()
    assert "styles" in data


def test_script_styles_is_list():
    """Test that 'styles' is a list."""
    response = client.get("/api/script/styles")
    data = response.json()
    assert isinstance(data["styles"], list)


def test_script_styles_minimum_count():
    """Test that at least 6 styles are provided."""
    response = client.get("/api/script/styles")
    data = response.json()
    assert len(data["styles"]) >= 6


def test_each_style_has_required_fields():
    """Test that each style object has all required fields."""
    response = client.get("/api/script/styles")
    data = response.json()
    required_fields = {"id", "label", "adjective", "script_type", "description", "defaults"}
    for style in data["styles"]:
        for field in required_fields:
            assert field in style, f"Style {style.get('id')} missing field: {field}"


def test_defaults_has_required_parameters():
    """Test that defaults object has all required parameters."""
    response = client.get("/api/script/styles")
    data = response.json()
    required_params = {"tone_intensity", "adaptation_degree", "dialogue_preservation_degree"}
    for style in data["styles"]:
        for param in required_params:
            assert param in style["defaults"], (
                f"Style {style.get('id')} defaults missing param: {param}"
            )


def test_script_styles_default_style_id():
    """Test that default_style_id is returned."""
    response = client.get("/api/script/styles")
    data = response.json()
    assert "default_style_id" in data


def test_default_style_id_exists_in_styles():
    """Test that default_style_id corresponds to an existing style."""
    response = client.get("/api/script/styles")
    data = response.json()
    default_id = data["default_style_id"]
    style_ids = [style["id"] for style in data["styles"]]
    assert default_id in style_ids


def test_script_styles_message():
    """Test that success message is returned."""
    response = client.get("/api/script/styles")
    data = response.json()
    assert "message" in data
    assert data["message"] == "剧本风格配置加载成功。"


def test_specific_styles_exist():
    """Test that expected style IDs exist."""
    response = client.get("/api/script/styles")
    data = response.json()
    style_ids = [style["id"] for style in data["styles"]]
    expected_ids = [
        "realistic_screenplay",
        "elegant_stage_play",
        "light_web_drama",
        "suspense_short_film",
        "delicate_audio_drama",
        "passionate_adventure_drama",
    ]
    for expected_id in expected_ids:
        assert expected_id in style_ids, f"Expected style '{expected_id}' not found"

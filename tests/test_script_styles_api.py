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


def test_script_styles_endpoint_returns_200():
    """Test that /api/script/styles returns 200."""
    response = client.get("/api/script/styles")
    assert response.status_code == 200


def test_script_styles_contains_tone_options():
    """Test that response contains 'tone_options' field."""
    response = client.get("/api/script/styles")
    data = response.json()
    assert "tone_options" in data
    assert isinstance(data["tone_options"], list)


def test_tone_options_contains_10_styles():
    """Test that tone_options contains exactly 10 style options."""
    response = client.get("/api/script/styles")
    data = response.json()
    assert len(data["tone_options"]) == 10


def test_tone_options_contains_expected_styles():
    """Test that tone_options contains all expected style names."""
    expected_styles = ["现实", "严肃", "诙谐", "深刻", "浪漫", "悬疑", "热血", "治愈", "冷峻", "诗意"]
    response = client.get("/api/script/styles")
    data = response.json()
    for style in expected_styles:
        assert style in data["tone_options"]


def test_script_styles_contains_medium_options():
    """Test that response contains 'medium_options' field."""
    response = client.get("/api/script/styles")
    data = response.json()
    assert "medium_options" in data
    assert isinstance(data["medium_options"], list)


def test_medium_options_contains_6_media_types():
    """Test that medium_options contains exactly 6 media type options."""
    response = client.get("/api/script/styles")
    data = response.json()
    assert len(data["medium_options"]) == 6


def test_medium_options_contains_expected_types():
    """Test that medium_options contains all expected media types."""
    expected_types = ["影视剧", "短剧", "舞台剧", "广播剧", "分镜初稿", "有声书改编"]
    response = client.get("/api/script/styles")
    data = response.json()
    for medium in expected_types:
        assert medium in data["medium_options"]


def test_script_styles_contains_defaults():
    """Test that response contains 'defaults' field."""
    response = client.get("/api/script/styles")
    data = response.json()
    assert "defaults" in data
    assert isinstance(data["defaults"], dict)


def test_defaults_contains_tone_style():
    """Test that defaults contains 'tone_style' key."""
    response = client.get("/api/script/styles")
    data = response.json()
    assert "tone_style" in data["defaults"]


def test_defaults_tone_style_is_valid():
    """Test that defaults.tone_style is one of the tone options."""
    response = client.get("/api/script/styles")
    data = response.json()
    tone_style = data["defaults"]["tone_style"]
    assert tone_style in data["tone_options"]


def test_defaults_contains_medium():
    """Test that defaults contains 'medium' key."""
    response = client.get("/api/script/styles")
    data = response.json()
    assert "medium" in data["defaults"]


def test_defaults_medium_is_valid():
    """Test that defaults.medium is one of the medium options."""
    response = client.get("/api/script/styles")
    data = response.json()
    medium = data["defaults"]["medium"]
    assert medium in data["medium_options"]


def test_defaults_contains_tone_intensity():
    """Test that defaults contains 'tone_intensity' key."""
    response = client.get("/api/script/styles")
    data = response.json()
    assert "tone_intensity" in data["defaults"]


def test_defaults_contains_adaptation_degree():
    """Test that defaults contains 'adaptation_degree' key."""
    response = client.get("/api/script/styles")
    data = response.json()
    assert "adaptation_degree" in data["defaults"]


def test_defaults_contains_dialogue_preservation_degree():
    """Test that defaults contains 'dialogue_preservation_degree' key."""
    response = client.get("/api/script/styles")
    data = response.json()
    assert "dialogue_preservation_degree" in data["defaults"]


def test_script_styles_contains_message():
    """Test that response contains 'message' field."""
    response = client.get("/api/script/styles")
    data = response.json()
    assert "message" in data
    assert isinstance(data["message"], str)

from fastapi.testclient import TestClient

from backend.main import app
from tests.test_yaml_validator import valid_yaml_text


client = TestClient(app)


def test_validate_yaml_api_accepts_valid_yaml():
    response = client.post(
        "/api/yaml/validate",
        json={"yaml": valid_yaml_text()},
    )
    data = response.json()

    assert response.status_code == 200
    assert data["valid"] is True
    assert data["status"] in {"pass", "warning"}
    assert "errors" in data
    assert "warnings" in data
    assert "summary" in data


def test_validate_yaml_api_returns_structured_error_for_invalid_yaml():
    response = client.post(
        "/api/yaml/validate",
        json={"yaml": "screenplay:\n  - bad: ["},
    )
    data = response.json()

    assert response.status_code == 200
    assert data["valid"] is False
    assert data["status"] == "error"
    assert data["errors"]


def test_validate_yaml_api_returns_error_for_empty_yaml():
    response = client.post(
        "/api/yaml/validate",
        json={"yaml": ""},
    )
    data = response.json()

    assert response.status_code == 200
    assert data["valid"] is False
    assert data["status"] == "error"


def test_validate_yaml_api_returns_error_for_missing_required_fields():
    response = client.post(
        "/api/yaml/validate",
        json={"yaml": "meta: {}\n"},
    )
    data = response.json()

    assert response.status_code == 200
    assert data["valid"] is False
    assert data["status"] == "error"


def test_script_generate_api_still_works_after_yaml_validate_api_added():
    text = """
第1章 雨夜来信
林舟收到一封没有署名的信。

第2章 南桥仓库
沈月带着线索来到南桥仓库。

第3章 真相浮现
所有线索终于汇合。
"""

    response = client.post(
        "/api/script/generate",
        json={"text": text},
    )

    assert response.status_code == 200
    assert "yaml" in response.json()

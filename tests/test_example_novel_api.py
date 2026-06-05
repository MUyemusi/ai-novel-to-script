from fastapi.testclient import TestClient

from backend.main import app


client = TestClient(app)


def test_health_check_still_returns_ok():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_get_example_novel_returns_sample_text():
    response = client.get("/api/examples/novel")
    data = response.json()

    assert response.status_code == 200
    assert data["title"] == "雨夜来信"
    assert data["source"] == "examples/sample_novel.txt"
    assert isinstance(data["text"], str)
    assert data["text"]
    assert "第1章" in data["text"]
    assert data["message"] == "示例小说加载成功。"

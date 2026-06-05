from fastapi.testclient import TestClient

from backend.main import app


client = TestClient(app)


def test_health_check_returns_ok():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_parse_chapters_with_three_chapters_returns_valid_result():
    text = """
第1章 雨夜来信
林舟站在旧书店门口。

第2章 南桥仓库
他来到南桥仓库。

第3章 真相浮现
沈月说出了真相。
"""

    response = client.post("/api/chapters/parse", json={"text": text})
    data = response.json()

    assert response.status_code == 200
    assert data["chapter_count"] == 3
    assert data["is_valid"] is True
    assert data["min_required"] == 3
    assert len(data["chapters"]) == 3
    assert data["message"] == "章节识别成功，满足至少 3 章要求。"

    for chapter in data["chapters"]:
        assert "chapter_id" in chapter
        assert "order" in chapter
        assert "title" in chapter
        assert "summary" in chapter
        assert "content_preview" in chapter
        assert "content_length" in chapter
        assert "content" not in chapter


def test_parse_chapters_with_long_content_returns_truncated_preview():
    long_content = "林舟站在旧书店门口，雨水顺着檐角落下。" * 8
    text = f"""
第1章 雨夜来信
{long_content}

第2章 南桥仓库
他来到南桥仓库。

第3章 真相浮现
沈月说出了真相。
"""

    response = client.post("/api/chapters/parse", json={"text": text})
    data = response.json()
    first_chapter = data["chapters"][0]

    assert response.status_code == 200
    assert first_chapter["content_length"] > 120
    assert len(first_chapter["content_preview"]) < first_chapter["content_length"]
    assert first_chapter["content_preview"].endswith("……")
    assert "content" not in first_chapter


def test_parse_chapters_with_less_than_three_chapters_returns_invalid_result():
    text = """
第1章 雨夜来信
林舟站在旧书店门口。

第2章 南桥仓库
他来到南桥仓库。
"""

    response = client.post("/api/chapters/parse", json={"text": text})
    data = response.json()

    assert response.status_code == 200
    assert data["chapter_count"] == 2
    assert data["is_valid"] is False
    assert data["message"] == "章节数量不足，请输入至少 3 个章节的小说文本。"


def test_parse_chapters_with_empty_text_returns_empty_message():
    response = client.post("/api/chapters/parse", json={"text": "   "})
    data = response.json()

    assert response.status_code == 200
    assert data["chapter_count"] == 0
    assert data["is_valid"] is False
    assert data["chapters"] == []
    assert data["message"] == "输入文本为空，请粘贴或上传小说文本。"


def test_parse_chapters_without_chapter_titles_returns_unrecognized_message():
    response = client.post(
        "/api/chapters/parse",
        json={"text": "这是没有章节标题的小说正文。它只有自然段。"},
    )
    data = response.json()

    assert response.status_code == 200
    assert data["chapter_count"] == 0
    assert data["is_valid"] is False
    assert data["chapters"] == []
    assert data["message"] == "未识别到章节标题，请检查文本是否包含“第1章”“第一章”等章节格式。"

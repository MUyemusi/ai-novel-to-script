from fastapi.testclient import TestClient

from backend.main import app


client = TestClient(app)


THREE_CHAPTER_NOVEL = """
第1章 雨夜来信
第一章正文。林舟收到一封没有署名的信。

第2章 南桥仓库
第二章正文。沈月带着线索来到南桥仓库。

第3章 真相浮现
第三章正文。所有线索终于汇合。
"""


def test_generate_script_returns_yaml_summary_characters_and_message():
    response = client.post(
        "/api/script/generate",
        json={"text": THREE_CHAPTER_NOVEL},
    )

    data = response.json()

    assert response.status_code == 200
    assert "yaml" in data
    assert "summary" in data
    assert "characters" in data
    assert "message" in data

    assert isinstance(data["yaml"], str)
    assert "screenplay:" in data["yaml"]
    assert "meta:" in data["yaml"]
    assert "acts:" in data["yaml"]

    assert data["summary"]["chapter_count"] == 3
    assert data["summary"]["scene_count"] == 3
    assert data["summary"]["character_count"] == 1
    assert data["summary"]["chapter_coverage_rate"] == "100%"


def test_generate_script_yaml_contains_custom_adaptation_profile_values():
    adaptation_profile = {
        "tone": {
            "style": "悬疑",
            "intensity": 80,
        },
        "target": {
            "medium": "短剧",
            "adaptation_degree": 70,
        },
        "dialogue": {
            "preservation_degree": 40,
        },
    }

    response = client.post(
        "/api/script/generate",
        json={
            "text": THREE_CHAPTER_NOVEL,
            "adaptation_profile": adaptation_profile,
        },
    )
    data = response.json()

    assert response.status_code == 200
    assert "悬疑" in data["yaml"]
    assert "短剧" in data["yaml"]


def test_generate_script_empty_text_returns_400():
    response = client.post(
        "/api/script/generate",
        json={"text": ""},
    )

    assert response.status_code == 400


def test_generate_script_less_than_three_chapters_returns_400():
    text = """
第1章 雨夜来信
第一章正文。

第2章 南桥仓库
第二章正文。
"""

    response = client.post(
        "/api/script/generate",
        json={"text": text},
    )

    assert response.status_code == 400


def test_generate_script_without_chapter_titles_returns_400():
    text = "这是普通小说正文。\n它有段落，但没有第几章这样的章节标题。"

    response = client.post(
        "/api/script/generate",
        json={"text": text},
    )

    assert response.status_code == 400

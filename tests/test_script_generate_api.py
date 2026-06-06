from fastapi.testclient import TestClient
import pytest
import yaml

import backend.main as main_module
from backend.main import app
from backend.services.llm_client import LLMGenerationError


client = TestClient(app)


THREE_CHAPTER_NOVEL = """
第1章 雨夜来信
第一章正文。林舟收到一封没有署名的信。

第2章 南桥仓库
第二章正文。沈月带着线索来到南桥仓库。

第3章 真相浮现
第三章正文。所有线索终于汇合。
"""


@pytest.fixture(autouse=True)
def disable_llm_by_default(monkeypatch):
    monkeypatch.setenv("USE_LLM", "false")
    monkeypatch.delenv("LLM_API_KEY", raising=False)


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
    assert "generation_mode" in data
    assert "warnings" in data
    assert "message" in data

    assert isinstance(data["yaml"], str)
    assert yaml.safe_load(data["yaml"])
    assert "screenplay:" in data["yaml"]
    assert "meta:" in data["yaml"]
    assert "acts:" in data["yaml"]
    assert data["generation_mode"] == "rule"
    assert data["warnings"] == []

    assert data["summary"]["chapter_count"] == 3
    assert data["summary"]["scene_count"] == 3
    assert data["summary"]["character_count"] == 1
    assert data["summary"]["chapter_coverage_rate"] == "100%"


def test_generate_script_uses_rule_mode_when_llm_disabled(monkeypatch):
    monkeypatch.setenv("USE_LLM", "false")

    response = client.post(
        "/api/script/generate",
        json={"text": THREE_CHAPTER_NOVEL},
    )
    data = response.json()

    assert response.status_code == 200
    assert data["generation_mode"] == "rule"
    assert data["warnings"] == []
    assert yaml.safe_load(data["yaml"])


def test_generate_script_falls_back_when_llm_fails(monkeypatch):
    def fail_llm(*args, **kwargs):
        raise LLMGenerationError("mock failure")

    monkeypatch.setenv("USE_LLM", "true")
    monkeypatch.setenv("LLM_API_KEY", "test-api-key")
    monkeypatch.setattr(main_module, "build_script_structure_with_llm", fail_llm)

    response = client.post(
        "/api/script/generate",
        json={"text": THREE_CHAPTER_NOVEL},
    )
    data = response.json()

    assert response.status_code == 200
    assert data["generation_mode"] == "rule_fallback"
    assert data["warnings"]
    assert yaml.safe_load(data["yaml"])
    assert "summary" in data
    assert "characters" in data


def test_generate_script_falls_back_when_llm_returns_incomplete_structure(monkeypatch):
    def fake_bad_llm(*args, **kwargs):
        return {
            "screenplay": {
                "meta": {},
                "adaptation_settings": {},
                "source_novel": {},
                "characters": [],
                "acts": [],
                "quality_report": {},
            }
        }

    monkeypatch.setenv("USE_LLM", "true")
    monkeypatch.setenv("LLM_API_KEY", "test-api-key")
    monkeypatch.setattr(main_module, "build_script_structure_with_llm", fake_bad_llm)

    response = client.post(
        "/api/script/generate",
        json={"text": THREE_CHAPTER_NOVEL},
    )
    data = response.json()

    assert response.status_code == 200
    assert data["generation_mode"] == "rule_fallback"
    assert data["warnings"]
    assert yaml.safe_load(data["yaml"])
    assert data["summary"]["chapter_count"] == 3


def test_generate_script_repairs_minor_llm_structure_issues(monkeypatch):
    def fake_repairable_llm(*args, **kwargs):
        return {
            "data": {
                "characters": {"Lin": "lead"},
                "acts": [
                    {
                        "scenes": [
                            {
                                "summary": "A repaired scene.",
                                "dialogue": "A repaired line.",
                            }
                        ]
                    }
                ],
            }
        }

    monkeypatch.setenv("USE_LLM", "true")
    monkeypatch.setenv("LLM_API_KEY", "test-api-key")
    monkeypatch.setattr(
        main_module,
        "build_script_structure_with_llm",
        fake_repairable_llm,
    )

    response = client.post(
        "/api/script/generate",
        json={"text": THREE_CHAPTER_NOVEL},
    )
    data = response.json()
    parsed_yaml = yaml.safe_load(data["yaml"])

    assert response.status_code == 200
    assert data["generation_mode"] == "llm"
    assert data["warnings"]
    assert data["summary"]["scene_count"] == 1
    assert parsed_yaml["screenplay"]["characters"][0]["name"] == "Lin"


def test_generate_script_falls_back_when_llm_returns_empty_dict(monkeypatch):
    def fake_invalid_llm(*args, **kwargs):
        return {}

    monkeypatch.setenv("USE_LLM", "true")
    monkeypatch.setenv("LLM_API_KEY", "test-api-key")
    monkeypatch.setattr(main_module, "build_script_structure_with_llm", fake_invalid_llm)

    response = client.post(
        "/api/script/generate",
        json={"text": THREE_CHAPTER_NOVEL},
    )
    data = response.json()

    assert response.status_code == 200
    assert data["generation_mode"] == "rule_fallback"
    assert data["warnings"]
    assert yaml.safe_load(data["yaml"])


def test_generate_script_uses_llm_mode_when_llm_succeeds(monkeypatch):
    def fake_llm(chapters, adaptation_profile=None, style=None):
        return {
            "screenplay": {
                "title": "LLM draft",
                "type": "screenplay",
                "meta": {
                    "title": "LLM draft",
                    "version": "0.1.0",
                    "generator": "llm",
                    "language": "zh-CN",
                },
                "adaptation_settings": adaptation_profile or {},
                "source_novel": {
                    "chapter_count": len(chapters),
                    "chapters": [
                        {
                            "chapter_id": chapter["chapter_id"],
                            "order": chapter["order"],
                            "title": chapter["title"],
                            "content_length": len(chapter.get("content", "")),
                        }
                        for chapter in chapters
                    ],
                },
                "characters": [
                    {
                        "character_id": "character_001",
                        "name": "Lin",
                        "role": "protagonist",
                        "description": "Extracted by mocked LLM.",
                    }
                ],
                "acts": [
                    {
                        "act_id": f"act_{chapter['order']:03d}",
                        "order": chapter["order"],
                        "title": chapter["title"],
                        "source_chapters": [chapter["chapter_id"]],
                        "scenes": [
                            {
                                "scene_id": f"scene_{chapter['order']:03d}",
                                "order": 1,
                                "title": chapter["title"],
                                "location": "warehouse",
                                "time": "night",
                                "characters": ["character_001"],
                                "source_chapter_id": chapter["chapter_id"],
                                "conflict": "truth emerges",
                                "summary": "A concise scene summary.",
                                "actions": ["The scene moves the mystery forward."],
                                "dialogues": [],
                                "beats": [
                                    {
                                        "type": "action",
                                        "content": "The scene moves the mystery forward.",
                                    }
                                ],
                            }
                        ],
                    }
                    for chapter in chapters
                ],
                "quality_report": {
                    "chapter_count": len(chapters),
                    "scene_count": len(chapters),
                    "character_count": 1,
                    "chapter_coverage_rate": 1.0,
                    "covered_chapters": [
                        chapter["chapter_id"] for chapter in chapters
                    ],
                    "missing_chapters": [],
                    "warnings": [],
                },
            }
        }

    monkeypatch.setenv("USE_LLM", "true")
    monkeypatch.setenv("LLM_API_KEY", "test-api-key")
    monkeypatch.setattr(main_module, "build_script_structure_with_llm", fake_llm)

    response = client.post(
        "/api/script/generate",
        json={"text": THREE_CHAPTER_NOVEL},
    )
    data = response.json()

    assert response.status_code == 200
    assert data["generation_mode"] == "llm"
    assert data["warnings"] == []
    assert data["summary"]["scene_count"] == 3
    assert yaml.safe_load(data["yaml"])["screenplay"]["meta"]["generator"] == "llm"


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

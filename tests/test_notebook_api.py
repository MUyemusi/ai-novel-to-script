import os
import sys
from pathlib import Path

from fastapi.testclient import TestClient


backend_path = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_path))


def build_client(tmp_path, monkeypatch):
    monkeypatch.setenv("NOTEBOOKS_DATA_DIR", str(tmp_path / "notebooks-data"))
    monkeypatch.setenv("USE_LLM", "false")
    monkeypatch.delenv("LLM_API_KEY", raising=False)

    for module_name in [
        "main",
        "services.notebook_store",
        "services.llm_client",
        "backend.services.notebook_store",
        "backend.services.llm_client",
    ]:
        if module_name in sys.modules:
            del sys.modules[module_name]

    from main import app

    return TestClient(app)


def test_get_notebooks_returns_seed_notebook(tmp_path, monkeypatch):
    client = build_client(tmp_path, monkeypatch)

    response = client.get("/notebooks")

    assert response.status_code == 200
    data = response.json()
    assert "notebooks" in data
    assert len(data["notebooks"]) == 1
    assert data["notebooks"][0]["title"] == "灵感收集本"


def test_post_notebook_creates_new_notebook(tmp_path, monkeypatch):
    client = build_client(tmp_path, monkeypatch)

    response = client.post(
        "/notebooks",
        json={"title": "世界观设定", "description": "收集王朝与地理背景。"},
    )

    assert response.status_code == 200
    notebook = response.json()
    assert notebook["title"] == "世界观设定"
    assert notebook["description"] == "收集王朝与地理背景。"

    list_response = client.get("/notebooks")
    titles = [item["title"] for item in list_response.json()["notebooks"]]
    assert "世界观设定" in titles


def test_get_notebook_conversations_returns_history(tmp_path, monkeypatch):
    client = build_client(tmp_path, monkeypatch)
    notebooks = client.get("/notebooks").json()["notebooks"]
    notebook_id = notebooks[0]["id"]

    response = client.get(f"/notebooks/{notebook_id}/conversations")

    assert response.status_code == 200
    data = response.json()
    assert data["notebook"]["id"] == notebook_id
    assert len(data["conversations"]) >= 1
    assert data["conversations"][0]["role"] == "assistant"
    assert data["script_state"] is None


def test_post_conversation_appends_user_and_assistant_messages(tmp_path, monkeypatch):
    client = build_client(tmp_path, monkeypatch)
    notebook_id = client.get("/notebooks").json()["notebooks"][0]["id"]

    response = client.post(
        f"/notebooks/{notebook_id}/conversations",
        json={"message": "帮我整理一下主角的人物弧线。"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["user_message"]["role"] == "user"
    assert data["assistant_message"]["role"] == "assistant"
    assert "mock 回复" in data["assistant_message"]["content"]
    assert len(data["conversations"]) >= 3


def test_post_conversation_uses_llm_reply_when_enabled(tmp_path, monkeypatch):
    client = build_client(tmp_path, monkeypatch)
    notebook_id = client.get("/notebooks").json()["notebooks"][0]["id"]

    monkeypatch.setenv("USE_LLM", "true")
    monkeypatch.setenv("LLM_API_KEY", "test-key")

    import backend.services.notebook_store as notebook_store_module

    monkeypatch.setattr(
        notebook_store_module,
        "build_notebook_reply_with_llm",
        lambda notebook: "这是来自大模型的正式回复。",
    )

    response = client.post(
        f"/notebooks/{notebook_id}/conversations",
        json={"message": "帮我分析一下这段人物关系。"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["assistant_message"]["content"] == "这是来自大模型的正式回复。"


def test_post_script_state_persists_latest_workspace_snapshot(tmp_path, monkeypatch):
    client = build_client(tmp_path, monkeypatch)
    notebook_id = client.get("/notebooks").json()["notebooks"][0]["id"]
    script_state = {
        "raw_text": "第一章：雨夜。第二章：来信。第三章：追踪。",
        "chapters": [
            {
                "chapter_id": "ch1",
                "order": 1,
                "title": "雨夜",
                "summary": "主角收到匿名来信。",
                "content_preview": "主角收到匿名来信。",
                "content_length": 1200,
            }
        ],
        "adaptation_profile": {
            "tone_style": "现实",
            "medium": "影视剧",
            "tone_intensity": 50,
            "adaptation_degree": 50,
            "dialogue_preservation_degree": 60,
        },
        "generated_yaml": "screenplay:\n  title: 雨夜来信\n",
        "generated_summary": {
            "chapter_count": 3,
            "scene_count": 8,
            "character_count": 4,
            "chapter_coverage_rate": "100%",
        },
        "generated_characters": [
            {
                "name": "林舟",
                "role": "主角",
                "description": "记者",
                "character_id": "char_1",
            }
        ],
        "readable_script_text": "《雨夜来信》\n\n第1幕：雨夜",
        "readable_script_valid": True,
        "final_script_text": "《雨夜来信》\n\n第1幕：确认稿",
        "final_script_confirmed": True,
        "active_step": 3,
        "updated_at": "2026-06-06T10:00:00Z",
    }

    response = client.post(f"/notebooks/{notebook_id}/script-state", json=script_state)

    assert response.status_code == 200
    data = response.json()
    assert data["script_state"]["raw_text"] == script_state["raw_text"]
    assert data["script_state"]["generated_yaml"] == script_state["generated_yaml"]
    assert data["script_state"]["readable_script_valid"] is True
    assert data["script_state"]["final_script_confirmed"] is True

    history_response = client.get(f"/notebooks/{notebook_id}/conversations")
    history_data = history_response.json()
    assert history_data["script_state"]["active_step"] == 3
    assert history_data["script_state"]["adaptation_profile"]["medium"] == "影视剧"
    assert history_data["script_state"]["final_script_text"] == script_state["final_script_text"]


def test_post_conversation_keeps_only_latest_ten_messages(tmp_path, monkeypatch):
    client = build_client(tmp_path, monkeypatch)
    notebook_id = client.get("/notebooks").json()["notebooks"][0]["id"]

    for index in range(6):
        response = client.post(
            f"/notebooks/{notebook_id}/conversations",
            json={"message": f"第 {index} 次记忆写入"},
        )
        assert response.status_code == 200

    history_response = client.get(f"/notebooks/{notebook_id}/conversations")
    history_data = history_response.json()
    assert len(history_data["conversations"]) == 10
    assert history_data["conversations"][0]["content"] == "第 1 次记忆写入"
    assert history_data["conversations"][-2]["content"] == "第 5 次记忆写入"


def test_post_notebook_invalid_request_returns_400(tmp_path, monkeypatch):
    client = build_client(tmp_path, monkeypatch)

    response = client.post("/notebooks", json={"description": "缺少标题"})

    assert response.status_code == 400


def test_post_conversation_unknown_notebook_returns_404(tmp_path, monkeypatch):
    client = build_client(tmp_path, monkeypatch)

    response = client.post(
        "/notebooks/unknown-id/conversations",
        json={"message": "hello"},
    )

    assert response.status_code == 404

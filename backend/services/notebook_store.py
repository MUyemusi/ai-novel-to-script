"""Notebook storage and mock conversation generation services."""

from __future__ import annotations

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List
from uuid import uuid4

from .schema import (
    CONVERSATIONS_RESPONSE_SCHEMA,
    CREATE_CONVERSATION_RESPONSE_SCHEMA,
    NOTEBOOK_FILE_SCHEMA,
    NOTEBOOK_SUMMARY_SCHEMA,
    NOTEBOOKS_RESPONSE_SCHEMA,
    validate_payload,
)
from .yaml_validator import read_yaml_file, write_yaml_file


def _utc_now() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DEFAULT_DATA_DIR = PROJECT_ROOT / "data" / "notebooks"
DATA_DIR = Path(os.environ.get("NOTEBOOKS_DATA_DIR", DEFAULT_DATA_DIR))
INDEX_PATH = DATA_DIR / "index.json"
MAX_CONVERSATION_HISTORY = 10


def ensure_notebook_store() -> None:
    """Ensure notebook storage exists with one starter notebook."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if INDEX_PATH.exists():
        return

    starter = _build_notebook_document(
        title="灵感收集本",
        description="记录故事想法、角色设定和后续待办。",
    )
    starter["conversations"] = [
        _build_message(
            role="assistant",
            content="欢迎来到叙构记忆系统。你可以把灵感、设定和追问都交给我，我会把历史对话保存在这个笔记本里。",
        )
    ]
    _save_notebook_document(starter)
    _write_index([_build_notebook_summary(starter)])


def list_notebooks() -> Dict[str, List[Dict[str, Any]]]:
    """Return notebook summaries."""
    ensure_notebook_store()
    index_data = _read_index()
    payload = {"notebooks": index_data.get("notebooks", [])}
    validate_payload(NOTEBOOKS_RESPONSE_SCHEMA, payload, "笔记本列表响应")
    return payload


def create_notebook(title: str, description: str = "") -> Dict[str, Any]:
    """Create a notebook and return its summary."""
    ensure_notebook_store()
    notebook = _build_notebook_document(title=title.strip(), description=description.strip())
    _save_notebook_document(notebook)

    index_data = _read_index()
    notebooks = index_data.get("notebooks", [])
    notebooks.insert(0, _build_notebook_summary(notebook))
    _write_index(notebooks)
    return _build_notebook_summary(notebook)


def get_notebook_conversations(notebook_id: str) -> Dict[str, Any]:
    """Return notebook summary and stored conversation history."""
    notebook = _load_notebook_document(notebook_id)
    payload = {
        "notebook": _build_notebook_summary(notebook),
        "conversations": notebook["conversations"],
        "script_state": notebook.get("script_state"),
    }
    validate_payload(CONVERSATIONS_RESPONSE_SCHEMA, payload, "对话历史响应")
    return payload


def append_conversation(notebook_id: str, message_text: str) -> Dict[str, Any]:
    """Append a user message and a mock assistant reply."""
    notebook = _load_notebook_document(notebook_id)
    user_message = _build_message(role="user", content=message_text.strip())
    notebook["conversations"].append(user_message)

    assistant_text = _build_mock_reply(notebook, message_text.strip())
    assistant_message = _build_message(role="assistant", content=assistant_text)
    notebook["conversations"].append(assistant_message)
    notebook["conversations"] = notebook["conversations"][-MAX_CONVERSATION_HISTORY:]

    notebook["updated_at"] = assistant_message["created_at"]
    _save_notebook_document(notebook)
    _refresh_notebook_summary(notebook)

    payload = {
        "notebook": _build_notebook_summary(notebook),
        "user_message": user_message,
        "assistant_message": assistant_message,
        "conversations": notebook["conversations"],
    }
    validate_payload(CREATE_CONVERSATION_RESPONSE_SCHEMA, payload, "发送对话响应")
    return payload


def update_script_state(notebook_id: str, script_state: Dict[str, Any]) -> Dict[str, Any]:
    """Persist the latest screenplay workspace state for one notebook."""
    notebook = _load_notebook_document(notebook_id)
    notebook["script_state"] = script_state
    notebook["updated_at"] = script_state["updated_at"]
    _save_notebook_document(notebook)
    _refresh_notebook_summary(notebook)

    payload = {
        "notebook": _build_notebook_summary(notebook),
        "script_state": notebook["script_state"],
    }
    return payload


def _build_notebook_document(title: str, description: str) -> Dict[str, Any]:
    timestamp = _utc_now()
    notebook = {
        "id": uuid4().hex[:12],
        "title": title,
        "description": description,
        "created_at": timestamp,
        "updated_at": timestamp,
        "conversations": [],
        "script_state": None,
    }
    validate_payload(NOTEBOOK_FILE_SCHEMA, notebook, "笔记本文件")
    return notebook


def _build_message(role: str, content: str) -> Dict[str, str]:
    return {
        "id": uuid4().hex[:12],
        "role": role,
        "content": content,
        "created_at": _utc_now(),
    }


def _build_notebook_summary(notebook: Dict[str, Any]) -> Dict[str, Any]:
    conversations = notebook.get("conversations", [])
    last_message = conversations[-1]["content"] if conversations else ""
    script_state = notebook.get("script_state") or {}
    summary = _build_script_state_summary(script_state) or notebook.get("description", "").strip() or "这个笔记本还没有补充摘要。"
    preview_text = _build_script_state_preview(script_state) or last_message[:80]
    notebook_summary = {
        "id": notebook["id"],
        "title": notebook["title"],
        "description": notebook.get("description", ""),
        "created_at": notebook["created_at"],
        "updated_at": notebook["updated_at"],
        "message_count": len(conversations),
        "summary": summary,
        "last_message_preview": preview_text,
    }
    validate_payload(NOTEBOOK_SUMMARY_SCHEMA, notebook_summary, "笔记本摘要")
    return notebook_summary


def _build_script_state_summary(script_state: Dict[str, Any]) -> str:
    if not script_state:
        return ""

    chapter_count = len(script_state.get("chapters", []))
    has_yaml = bool(script_state.get("generated_yaml"))
    adaptation_profile = script_state.get("adaptation_profile") or {}
    tone_style = adaptation_profile.get("tone_style", "")
    medium = adaptation_profile.get("medium", "")

    parts = []
    if chapter_count:
        parts.append(f"已识别 {chapter_count} 章")
    if has_yaml:
        parts.append("已生成 YAML")
    if tone_style:
        parts.append(f"{tone_style}风格")
    if medium:
        parts.append(f"{medium}改编")

    return "，".join(parts)


def _build_script_state_preview(script_state: Dict[str, Any]) -> str:
    if not script_state:
        return ""

    active_step = script_state.get("active_step")
    step_labels = {
        1: "刚进入创作页",
        2: "完成输入与调参",
        3: "完成 YAML 生成",
        4: "进入清洗剧本阶段",
        5: "进入剧本预览阶段",
    }
    step_text = step_labels.get(active_step, "已更新最近一次创作状态")
    summary = _build_script_state_summary(script_state)
    if summary:
        return f"{step_text}：{summary}"[:80]
    return step_text[:80]


def _build_mock_reply(notebook: Dict[str, Any], user_message: str) -> str:
    history_size = len(notebook.get("conversations", []))
    notebook_title = notebook["title"]
    return (
        f"这是来自“{notebook_title}”的 mock 回复。我已记录你的新消息："
        f"“{user_message}”。当前笔记本累计保存 {history_size} 条消息，"
        "后续这里可以接入真实大模型来生成更深入的分析、整理与续写建议。"
    )


def _notebook_path(notebook_id: str) -> Path:
    return DATA_DIR / f"{notebook_id}.yaml"


def _load_notebook_document(notebook_id: str) -> Dict[str, Any]:
    ensure_notebook_store()
    notebook_path = _notebook_path(notebook_id)
    if not notebook_path.exists():
        raise FileNotFoundError(f"未找到 id 为 {notebook_id} 的笔记本。")
    return read_yaml_file(notebook_path, NOTEBOOK_FILE_SCHEMA, "笔记本文件")


def _save_notebook_document(notebook: Dict[str, Any]) -> None:
    write_yaml_file(_notebook_path(notebook["id"]), notebook, NOTEBOOK_FILE_SCHEMA, "笔记本文件")


def _read_index() -> Dict[str, Any]:
    try:
        data = json.loads(INDEX_PATH.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return {"notebooks": []}
    except OSError as exc:
        raise OSError("笔记本索引读取失败。") from exc
    except json.JSONDecodeError as exc:
        raise ValueError("笔记本索引 JSON 解析失败。") from exc

    validate_payload(NOTEBOOKS_RESPONSE_SCHEMA, data, "笔记本索引")
    return data


def _write_index(notebooks: List[Dict[str, Any]]) -> None:
    payload = {"notebooks": notebooks}
    validate_payload(NOTEBOOKS_RESPONSE_SCHEMA, payload, "笔记本索引")
    INDEX_PATH.parent.mkdir(parents=True, exist_ok=True)
    INDEX_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def _refresh_notebook_summary(notebook: Dict[str, Any]) -> None:
    index_data = _read_index()
    notebooks = index_data.get("notebooks", [])
    updated_summary = _build_notebook_summary(notebook)
    refreshed = [updated_summary if item["id"] == notebook["id"] else item for item in notebooks]
    refreshed.sort(key=lambda item: item["updated_at"], reverse=True)
    _write_index(refreshed)

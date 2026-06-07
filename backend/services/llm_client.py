"""OpenAI-compatible LLM client for screenplay structure generation and chat."""

from __future__ import annotations

import json
from typing import Any

import requests

try:
    from backend.config import get_llm_settings
    from backend.services.llm_prompt_builder import build_script_generation_prompt
except ModuleNotFoundError:
    from config import get_llm_settings
    from services.llm_prompt_builder import build_script_generation_prompt


class LLMGenerationError(Exception):
    """Raised when LLM generation cannot produce a usable structure."""


def build_script_structure_with_llm(
    chapters: list[dict[str, Any]],
    adaptation_profile: dict[str, Any] | None = None,
    style: dict[str, Any] | str | None = None,
) -> dict[str, Any]:
    """Generate screenplay structure data with an OpenAI-compatible API."""
    settings = get_llm_settings()
    if not settings.api_key:
        raise LLMGenerationError("LLM API key is not configured.")

    prompt = build_script_generation_prompt(
        chapters,
        adaptation_profile=adaptation_profile,
        style=style,
    )
    payload = {
        "model": settings.model,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a professional novel-to-screenplay adaptation assistant. "
                    "Return only valid JSON and never return Markdown."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.4,
    }

    try:
        response = requests.post(
            f"{settings.base_url}/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=settings.timeout_seconds,
        )
    except requests.RequestException as exc:
        raise LLMGenerationError(f"LLM request failed: {exc.__class__.__name__}") from exc

    if response.status_code != 200:
        raise LLMGenerationError(f"LLM request returned status {response.status_code}.")

    try:
        response_data = response.json()
        content = response_data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError, ValueError) as exc:
        raise LLMGenerationError("LLM response did not contain message content.") from exc

    return _parse_json_content(content)


def build_notebook_reply_with_llm(notebook: dict[str, Any]) -> str:
    """Generate a notebook chat reply with an OpenAI-compatible API."""
    settings = get_llm_settings()
    if not settings.api_key:
        raise LLMGenerationError("LLM API key is not configured.")

    title = str(notebook.get("title") or "未命名笔记本")
    description = str(notebook.get("description") or "暂无说明")
    conversation_history = _build_notebook_messages(notebook)

    # 提取剧本状态作为上下文
    script_state = notebook.get("script_state") or {}
    system_msgs = [
        {
            "role": "system",
            "content": (
                "你是叙构笔记本系统中的创作助理。"
                "请始终使用简体中文自然回复，延续当前笔记本上下文，"
                "优先给出具体、清晰、可执行的建议。"
                "如果用户在整理灵感，就帮他提炼；如果用户在提问，就直接回答；"
                "避免自称模型，也不要提及 API 或内部实现。"
            ),
        },
        {
            "role": "system",
            "content": f"当前项目信息：\n标题：{title}\n描述：{description}",
        },
    ]

    if script_state:
        chapters = script_state.get("chapters") or []
        yaml_content = script_state.get("generated_yaml") or ""
        adaptation = script_state.get("adaptation_profile") or {}
        raw_text = script_state.get("raw_text") or ""

        script_ctx = []
        if raw_text:
            script_ctx.append(f"### 已输入小说原文片段（前500字）\n{raw_text[:500]}...")

        if chapters:
            chapter_summary = "\n".join(
                [f"- 第{i+1}章 {c.get('title', '未命名')}: {c.get('summary', '')[:120]}..." for i, c in enumerate(chapters[:15])]
            )
            script_ctx.append(f"### 已识别章节结构（前15章）\n{chapter_summary}")

        if adaptation:
            tone = adaptation.get("tone_style", "默认")
            medium = adaptation.get("medium", "通用")
            intensity = adaptation.get("tone_intensity", 50)
            script_ctx.append(f"### 剧本改编设定\n- 风格调性：{tone}（强度 {intensity}%）\n- 适用场景：{medium}")

        if yaml_content:
            yaml_snippet = yaml_content[:1500] + ("\n...(其余部分已省略)" if len(yaml_content) > 1500 else "")
            script_ctx.append(f"### 当前剧本 YAML 预览\n```yaml\n{yaml_snippet}\n```")

        if script_ctx:
            system_msgs.append({
                "role": "system",
                "content": (
                    "【实时创作上下文】\n"
                    "检测到用户在剧本生成页已有创作数据。请基于以下最新的原文、章节和 YAML 结构进行深度分析和建议：\n\n"
                    + "\n\n".join(script_ctx)
                )
            })
    else:
        system_msgs.append({
            "role": "system",
            "content": "当前笔记本尚未关联具体的剧本创作任务，请以通用的文学创作助理身份协助用户。"
        })

    payload = {
        "model": settings.model,
        "messages": [
            *system_msgs,
            *conversation_history,
        ],
        "temperature": 0.7,
    }

    try:
        response = requests.post(
            f"{settings.base_url}/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=settings.timeout_seconds,
        )
    except requests.RequestException as exc:
        raise LLMGenerationError(f"LLM request failed: {exc.__class__.__name__}") from exc

    if response.status_code != 200:
        raise LLMGenerationError(f"LLM request returned status {response.status_code}.")

    try:
        response_data = response.json()
        content = response_data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError, ValueError) as exc:
        raise LLMGenerationError("LLM response did not contain message content.") from exc

    if not isinstance(content, str) or not content.strip():
        raise LLMGenerationError("LLM notebook reply was empty.")

    return content.strip()


def _parse_json_content(content: str) -> dict[str, Any]:
    cleaned = _strip_json_fence(content)
    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise LLMGenerationError("LLM response content was not valid JSON.") from exc

    if not isinstance(parsed, dict):
        raise LLMGenerationError("LLM response JSON must be an object.")

    return parsed


def _build_notebook_messages(notebook: dict[str, Any]) -> list[dict[str, str]]:
    messages: list[dict[str, str]] = []
    for item in notebook.get("conversations", [])[-10:]:
        role = str(item.get("role") or "").strip()
        content = str(item.get("content") or "").strip()
        if role not in {"user", "assistant", "system"} or not content:
            continue
        messages.append({"role": role, "content": content})
    return messages


def _strip_json_fence(content: str) -> str:
    text = content.strip()
    if not text.startswith("```"):
        return text

    lines = text.splitlines()
    if lines and lines[0].strip().startswith("```"):
        lines = lines[1:]
    if lines and lines[-1].strip() == "```":
        lines = lines[:-1]
    return "\n".join(lines).strip()

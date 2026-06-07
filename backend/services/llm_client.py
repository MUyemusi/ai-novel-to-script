"""OpenAI-compatible LLM client for screenplay structure generation."""

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


def _parse_json_content(content: str) -> dict[str, Any]:
    cleaned = _strip_json_fence(content)
    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise LLMGenerationError("LLM response content was not valid JSON.") from exc

    if not isinstance(parsed, dict):
        raise LLMGenerationError("LLM response JSON must be an object.")

    return parsed


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

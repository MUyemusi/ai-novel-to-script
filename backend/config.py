"""Environment configuration for optional LLM generation."""

from __future__ import annotations

import os
from dataclasses import dataclass

from dotenv import load_dotenv


load_dotenv()


@dataclass(frozen=True)
class LLMSettings:
    use_llm: bool
    api_key: str
    model: str
    base_url: str
    timeout_seconds: float


def get_llm_settings() -> LLMSettings:
    """Read LLM settings from environment variables."""
    return LLMSettings(
        use_llm=_read_bool("USE_LLM", default=False),
        api_key=os.getenv("LLM_API_KEY", "").strip(),
        model=os.getenv("LLM_MODEL", "deepseek-chat").strip() or "deepseek-chat",
        base_url=(
            os.getenv("LLM_BASE_URL", "https://api.deepseek.com").strip().rstrip("/")
            or "https://api.deepseek.com"
        ),
        timeout_seconds=_read_float("LLM_TIMEOUT_SECONDS", default=60.0),
    )


def _read_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _read_float(name: str, default: float) -> float:
    value = os.getenv(name)
    if value is None:
        return default
    try:
        return float(value)
    except ValueError:
        return default

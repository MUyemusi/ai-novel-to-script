"""FastAPI backend entry for AI 小说转剧本工具."""

from pathlib import Path
from typing import Any

import yaml
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    from backend.config import get_llm_settings
    from backend.services.chapter_parser import split_chapters, validate_min_chapters
    from backend.services.llm_client import (
        LLMGenerationError,
        build_script_structure_with_llm,
    )
    from backend.services.script_generator import build_script_structure
    from backend.services.style_options import get_script_styles
except ModuleNotFoundError:
    from config import get_llm_settings
    from services.chapter_parser import split_chapters, validate_min_chapters
    from services.llm_client import LLMGenerationError, build_script_structure_with_llm
    from services.script_generator import build_script_structure
    from services.style_options import get_script_styles


app = FastAPI(title="AI 小说转剧本工具", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

MIN_REQUIRED_CHAPTERS = 3
SUMMARY_LIMIT = 80
CONTENT_PREVIEW_LIMIT = 120
PROJECT_ROOT = Path(__file__).resolve().parent.parent
EXAMPLE_NOVEL_PATH = PROJECT_ROOT / "examples" / "sample_novel.txt"
EXAMPLE_NOVEL_SOURCE = "examples/sample_novel.txt"


class ChapterParseRequest(BaseModel):
    text: str


class ScriptGenerateRequest(BaseModel):
    text: str
    adaptation_profile: dict[str, Any] | None = None


@app.get("/health")
def health_check() -> dict[str, str]:
    """Return basic backend health information."""
    return {
        "status": "ok",
        "app": "AI 小说转剧本工具",
        "version": "0.1.0",
        "architecture": "frontend-backend-separated",
    }


@app.get("/api/examples/novel")
def get_example_novel() -> dict[str, str]:
    """Return the built-in example novel text."""
    try:
        text = EXAMPLE_NOVEL_PATH.read_text(encoding="utf-8")
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="示例小说文件不存在。") from exc
    except OSError as exc:
        raise HTTPException(status_code=500, detail="示例小说文件读取失败。") from exc

    return {
        "title": "雨夜来信",
        "text": text,
        "source": EXAMPLE_NOVEL_SOURCE,
        "message": "示例小说加载成功。",
    }


@app.get("/api/script/styles")
def get_styles() -> dict:
    """Return available script style configurations for screenplay generation."""
    return get_script_styles()


@app.post("/api/chapters/parse")
def parse_chapters(request: ChapterParseRequest) -> dict:
    """Parse novel text into chapter preview data."""
    text = request.text.strip()
    if not text:
        return _build_chapter_response(
            chapters=[],
            is_valid=False,
            message="输入文本为空，请粘贴或上传小说文本。",
        )

    chapters = split_chapters(text)
    if not chapters:
        return _build_chapter_response(
            chapters=[],
            is_valid=False,
            message="未识别到章节标题，请检查文本是否包含“第1章”“第一章”等章节格式。",
        )

    is_valid = validate_min_chapters(chapters, min_count=MIN_REQUIRED_CHAPTERS)
    message = (
        "章节识别成功，满足至少 3 章要求。"
        if is_valid
        else "章节数量不足，请输入至少 3 个章节的小说文本。"
    )
    return _build_chapter_response(chapters=chapters, is_valid=is_valid, message=message)


@app.post("/api/script/generate")
def generate_script(request: ScriptGenerateRequest) -> dict:
    """Generate screenplay YAML from novel text and adaptation settings."""
    text = request.text.strip()
    if not text:
        raise HTTPException(
            status_code=400,
            detail="输入文本为空，请粘贴或上传小说文本。",
        )

    chapters = split_chapters(text)
    if not chapters:
        raise HTTPException(status_code=400, detail="No chapter headings found in novel text.")
    if not validate_min_chapters(chapters, min_count=MIN_REQUIRED_CHAPTERS):
        raise HTTPException(
            status_code=400,
            detail="At least 3 chapters are required to build a screenplay.",
        )

    settings = get_llm_settings()
    generation_mode = "rule"
    warnings: list[str] = []

    if settings.use_llm:
        try:
            script_structure = build_script_structure_with_llm(
                chapters,
                adaptation_profile=request.adaptation_profile,
            )
            script_structure = _normalize_script_structure(script_structure)
            generation_mode = "llm"
        except LLMGenerationError:
            try:
                script_structure = build_script_structure(
                    text,
                    adaptation_profile=request.adaptation_profile,
                )
            except ValueError as exc:
                raise HTTPException(status_code=400, detail=str(exc)) from exc
            generation_mode = "rule_fallback"
            warnings.append(
                "AI generation failed; automatically used rule-based generation fallback."
            )
    else:
        try:
            script_structure = build_script_structure(
                text,
                adaptation_profile=request.adaptation_profile,
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    screenplay = script_structure["screenplay"]
    quality_report = screenplay["quality_report"]
    yaml_text = yaml.safe_dump(
        script_structure,
        allow_unicode=True,
        sort_keys=False,
    )

    return {
        "yaml": yaml_text,
        "summary": {
            "chapter_count": quality_report["chapter_count"],
            "scene_count": quality_report["scene_count"],
            "character_count": quality_report["character_count"],
            "chapter_coverage_rate": quality_report["chapter_coverage_rate"],
        },
        "characters": screenplay["characters"],
        "generation_mode": generation_mode,
        "warnings": warnings,
        "message": "剧本 YAML 生成成功。",
    }


def _normalize_script_structure(script_structure: dict) -> dict:
    required_screenplay_fields = {
        "meta",
        "adaptation_settings",
        "source_novel",
        "characters",
        "acts",
        "quality_report",
    }
    required_quality_fields = {
        "chapter_count",
        "scene_count",
        "character_count",
        "chapter_coverage_rate",
    }

    screenplay = script_structure.get("screenplay")
    if isinstance(screenplay, dict):
        normalized = script_structure
    elif required_screenplay_fields.issubset(script_structure):
        screenplay = script_structure
        normalized = {"screenplay": screenplay}
    else:
        raise LLMGenerationError("LLM response did not match screenplay structure.")

    missing_screenplay_fields = required_screenplay_fields - set(screenplay)
    if missing_screenplay_fields:
        raise LLMGenerationError("LLM response did not match screenplay structure.")

    if not isinstance(screenplay.get("characters"), list):
        raise LLMGenerationError("LLM response characters must be a list.")

    if not isinstance(screenplay.get("acts"), list):
        raise LLMGenerationError("LLM response acts must be a list.")

    quality_report = screenplay.get("quality_report")
    if not isinstance(quality_report, dict):
        raise LLMGenerationError("LLM response quality_report must be an object.")

    missing_quality_fields = required_quality_fields - set(quality_report)
    if missing_quality_fields:
        raise LLMGenerationError("LLM response quality_report was incomplete.")

    return normalized


def _build_chapter_response(
    chapters: list[dict],
    is_valid: bool,
    message: str,
) -> dict:
    return {
        "chapter_count": len(chapters),
        "is_valid": is_valid,
        "min_required": MIN_REQUIRED_CHAPTERS,
        "chapters": [_build_chapter_preview(chapter) for chapter in chapters],
        "message": message,
    }


def _build_chapter_preview(chapter: dict) -> dict:
    content = chapter.get("content", "")
    return {
        "chapter_id": chapter["chapter_id"],
        "order": chapter["order"],
        "title": chapter["title"],
        "summary": content[:SUMMARY_LIMIT],
        "content_preview": _preview_text(content, CONTENT_PREVIEW_LIMIT),
        "content_length": len(content),
    }


def _preview_text(text: str, limit: int) -> str:
    if len(text) <= limit:
        return text
    return f"{text[:limit]}……"

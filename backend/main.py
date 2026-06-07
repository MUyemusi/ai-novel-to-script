"""FastAPI backend entry for AI 小说转剧本工具."""

import json
from pathlib import Path
from typing import Any, Dict, Optional

import yaml
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    from backend.config import get_llm_settings
    from backend.services.chapter_parser import split_chapters, validate_min_chapters
    from backend.services.llm_client import (
        LLMGenerationError,
        build_script_structure_with_llm,
    )
    from backend.services.llm_result_normalizer import normalize_llm_script_structure
    from backend.services.llm_result_validator import (
        validate_normalized_script_structure,
    )
    from backend.services.notebook_store import (
        append_conversation,
        create_notebook,
        get_notebook_conversations,
        list_notebooks,
        update_script_state,
    )
    from backend.services.schema import (
        CONVERSATIONS_RESPONSE_SCHEMA,
        CREATE_CONVERSATION_REQUEST_SCHEMA,
        CREATE_CONVERSATION_RESPONSE_SCHEMA,
        CREATE_NOTEBOOK_REQUEST_SCHEMA,
        NOTEBOOK_SUMMARY_SCHEMA,
        NOTEBOOKS_RESPONSE_SCHEMA,
        UPDATE_SCRIPT_STATE_REQUEST_SCHEMA,
        UPDATE_SCRIPT_STATE_RESPONSE_SCHEMA,
        validate_payload,
    )
    from backend.services.script_generator import build_script_structure
    from backend.services.style_options import get_script_styles
    from backend.services.yaml_validator import validate_yaml_text
except ModuleNotFoundError:
    from config import get_llm_settings
    from services.chapter_parser import split_chapters, validate_min_chapters
    from services.llm_client import LLMGenerationError, build_script_structure_with_llm
    from services.llm_result_normalizer import normalize_llm_script_structure
    from services.llm_result_validator import validate_normalized_script_structure
    from services.notebook_store import (
        append_conversation,
        create_notebook,
        get_notebook_conversations,
        list_notebooks,
        update_script_state,
    )
    from services.schema import (
        CONVERSATIONS_RESPONSE_SCHEMA,
        CREATE_CONVERSATION_REQUEST_SCHEMA,
        CREATE_CONVERSATION_RESPONSE_SCHEMA,
        CREATE_NOTEBOOK_REQUEST_SCHEMA,
        NOTEBOOK_SUMMARY_SCHEMA,
        NOTEBOOKS_RESPONSE_SCHEMA,
        UPDATE_SCRIPT_STATE_REQUEST_SCHEMA,
        UPDATE_SCRIPT_STATE_RESPONSE_SCHEMA,
        validate_payload,
    )
    from services.script_generator import build_script_structure
    from services.style_options import get_script_styles
    from services.yaml_validator import validate_yaml_text


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
    adaptation_profile: Optional[Dict[str, Any]] = None


class YamlValidateRequest(BaseModel):
    yaml: str


@app.get("/notebooks")
def get_notebooks() -> dict:
    """Return notebook summaries for the homepage."""
    try:
        payload = list_notebooks()
    except (OSError, ValueError) as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    validate_payload(NOTEBOOKS_RESPONSE_SCHEMA, payload, "笔记本列表响应")
    return payload


@app.post("/notebooks")
async def post_notebook(request: Request) -> dict:
    """Create a new notebook."""
    payload = await _read_json_request(request)
    _validate_request_payload(CREATE_NOTEBOOK_REQUEST_SCHEMA, payload, "创建笔记本请求")

    try:
        notebook = create_notebook(
            title=str(payload["title"]).strip(),
            description=str(payload.get("description", "")).strip(),
        )
    except (OSError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    validate_payload(NOTEBOOK_SUMMARY_SCHEMA, notebook, "创建笔记本响应")
    return notebook


@app.get("/notebooks/{notebook_id}/conversations")
def get_conversations(notebook_id: str) -> dict:
    """Load stored conversation history for one notebook."""
    try:
        payload = get_notebook_conversations(notebook_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except (OSError, ValueError) as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    validate_payload(CONVERSATIONS_RESPONSE_SCHEMA, payload, "对话历史响应")
    return payload


@app.post("/notebooks/{notebook_id}/conversations")
async def post_conversation(notebook_id: str, request: Request) -> dict:
    """Store a user message and return a mock AI reply."""
    payload = await _read_json_request(request)
    _validate_request_payload(CREATE_CONVERSATION_REQUEST_SCHEMA, payload, "发送对话请求")

    try:
        response_payload = append_conversation(notebook_id, str(payload["message"]).strip())
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except (OSError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    validate_payload(CREATE_CONVERSATION_RESPONSE_SCHEMA, response_payload, "发送对话响应")
    return response_payload


@app.post("/notebooks/{notebook_id}/script-state")
async def post_script_state(notebook_id: str, request: Request) -> dict:
    """Persist the latest script workspace state for one notebook."""
    payload = await _read_json_request(request)
    _validate_request_payload(UPDATE_SCRIPT_STATE_REQUEST_SCHEMA, payload, "保存剧本状态请求")

    try:
        response_payload = update_script_state(notebook_id, payload)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except (OSError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    validate_payload(UPDATE_SCRIPT_STATE_RESPONSE_SCHEMA, response_payload, "保存剧本状态响应")
    return response_payload


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


@app.post("/api/yaml/validate")
def validate_yaml(request: YamlValidateRequest) -> dict:
    """Validate screenplay YAML with schema and business rules."""
    return validate_yaml_text(request.yaml)


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
            raw_script_structure = build_script_structure_with_llm(
                chapters,
                adaptation_profile=request.adaptation_profile,
            )
            script_structure, normalize_warnings = normalize_llm_script_structure(
                raw_script_structure,
                chapters=chapters,
            )
            is_valid, validation_errors = validate_normalized_script_structure(
                script_structure
            )
            if not is_valid:
                raise LLMGenerationError(
                    "Normalized LLM output is invalid: " + "; ".join(validation_errors)
                )
            warnings.extend(normalize_warnings)
            generation_mode = "llm"
        except (LLMGenerationError, ValueError):
            try:
                script_structure = build_script_structure(
                    text,
                    adaptation_profile=request.adaptation_profile,
                )
            except ValueError as exc:
                raise HTTPException(status_code=400, detail=str(exc)) from exc
            generation_mode = "rule_fallback"
            warnings.append(
                "AI generation result was unusable; automatically used rule-based generation fallback."
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


async def _read_json_request(request: Request) -> Dict[str, Any]:
    try:
        payload = await request.json()
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="请求体不是合法 JSON。") from exc

    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="请求体必须是 JSON 对象。")
    return payload


def _validate_request_payload(schema: Dict[str, Any], payload: Dict[str, Any], label: str) -> None:
    try:
        validate_payload(schema, payload, label)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

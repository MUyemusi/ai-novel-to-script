"""FastAPI backend entry for AI 小说转剧本工具."""

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    from backend.services.chapter_parser import split_chapters, validate_min_chapters
except ModuleNotFoundError:
    from services.chapter_parser import split_chapters, validate_min_chapters


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

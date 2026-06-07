"""Build screenplay structure data from parsed novel chapters."""

from __future__ import annotations

from copy import deepcopy
from typing import Any, Optional

try:
    from backend.services.chapter_parser import split_chapters, validate_min_chapters
    from backend.services.style_options import DEFAULT_ADAPTATION_PROFILE
except ModuleNotFoundError:
    from services.chapter_parser import split_chapters, validate_min_chapters
    from services.style_options import DEFAULT_ADAPTATION_PROFILE

SUMMARY_LIMIT = 120
PLACEHOLDER_CHARACTER = {
    "character_id": "character_001",
    "name": "主角",
    "role": "protagonist",
    "description": "MVP 阶段的稳定占位人物，后续可由 AI 或规则抽取替换。",
}


def build_script_structure(
    text: str,
    adaptation_profile: Optional[dict] = None,
) -> dict:
    """Convert novel text and adaptation settings into MVP screenplay data."""
    if not text or not text.strip():
        raise ValueError("Novel text is empty.")

    chapters = split_chapters(text)
    if not chapters:
        raise ValueError("No chapter headings found in novel text.")

    if not validate_min_chapters(chapters, min_count=3):
        raise ValueError("At least 3 chapters are required to build a screenplay.")

    adaptation_settings = (
        deepcopy(adaptation_profile)
        if adaptation_profile is not None
        else deepcopy(DEFAULT_ADAPTATION_PROFILE)
    )
    characters = [deepcopy(PLACEHOLDER_CHARACTER)]
    acts = [_build_act(chapter) for chapter in chapters]
    scene_count = sum(len(act["scenes"]) for act in acts)
    covered_chapters = [chapter["chapter_id"] for chapter in chapters]

    return {
        "screenplay": {
            "meta": _build_meta(chapters),
            "adaptation_settings": adaptation_settings,
            "source_novel": {
                "chapter_count": len(chapters),
                "chapters": [_build_source_chapter(chapter) for chapter in chapters],
            },
            "characters": characters,
            "acts": acts,
            "quality_report": {
                "chapter_count": len(chapters),
                "scene_count": scene_count,
                "character_count": len(characters),
                "chapter_coverage_rate": "100%",
                "covered_chapters": covered_chapters,
                "missing_chapters": [],
                "warnings": [],
            },
        }
    }


def _build_meta(chapters: list[dict[str, Any]]) -> dict[str, Any]:
    first_title = chapters[0]["title"]
    return {
        "title": f"{first_title} 改编剧本",
        "version": "0.1.0",
        "generator": "ai-novel-to-script-pr10-structure-builder",
        "language": "zh-CN",
    }


def _build_source_chapter(chapter: dict[str, Any]) -> dict[str, Any]:
    content = chapter.get("content", "")
    return {
        "chapter_id": chapter["chapter_id"],
        "order": chapter["order"],
        "title": chapter["title"],
        "content_length": len(content),
    }


def _build_act(chapter: dict[str, Any]) -> dict[str, Any]:
    order = chapter["order"]
    return {
        "act_id": f"act_{order:03d}",
        "order": order,
        "title": chapter["title"],
        "source_chapters": [chapter["chapter_id"]],
        "scenes": [_build_scene(chapter)],
    }


def _build_scene(chapter: dict[str, Any]) -> dict[str, Any]:
    order = chapter["order"]
    summary = _summarize_chapter(chapter.get("content", ""))
    return {
        "scene_id": f"scene_{order:03d}",
        "order": 1,
        "title": chapter["title"],
        "source_chapter_id": chapter["chapter_id"],
        "location": "待定",
        "time": "待定",
        "characters": [PLACEHOLDER_CHARACTER["character_id"]],
        "conflict": "待提炼",
        "summary": summary,
        "beats": [
            {
                "type": "action",
                "content": summary or "根据原文章节内容整理剧情动作。",
            }
        ],
    }


def _summarize_chapter(content: str) -> str:
    compact_content = content.strip()
    if len(compact_content) <= SUMMARY_LIMIT:
        return compact_content
    return f"{compact_content[:SUMMARY_LIMIT]}..."

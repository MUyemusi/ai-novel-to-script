"""Prompt construction for LLM screenplay generation."""

from __future__ import annotations

import json
from typing import Any


def build_script_generation_prompt(
    chapters: list[dict[str, Any]],
    adaptation_profile: dict[str, Any] | None = None,
    style: dict[str, Any] | str | None = None,
) -> str:
    """Build a JSON-only prompt from parsed chapters and adaptation settings."""
    profile = adaptation_profile or {}
    prompt_payload = {
        "adaptation_profile": profile,
        "legacy_style": style,
        "chapters": [
            {
                "chapter_id": chapter.get("chapter_id"),
                "order": chapter.get("order"),
                "title": chapter.get("title"),
                "content": chapter.get("content", ""),
            }
            for chapter in chapters
        ],
    }

    return "\n".join(
        [
            "You are adapting a Chinese novel into a structured screenplay draft.",
            "Return only valid JSON. Do not return Markdown, explanations, or fenced code blocks such as ```json.",
            "The returned JSON must be directly parseable by json.loads and convertible to YAML by the backend.",
            "Use this exact backend-compatible shape:",
            json.dumps(_schema_example(), ensure_ascii=False, indent=2),
            "Requirements:",
            "- Include screenplay, meta, source_novel, characters, acts, and quality_report data.",
            "- Create at least one scene for every source chapter.",
            "- Preserve source_chapter_id or source_chapters references on scenes/acts.",
            "- Extract characters from the source text as much as possible; avoid inventing unrelated characters.",
            "- Adjust tone and format according to tone.style, tone.intensity, target.medium, target.adaptation_degree, and dialogue.preservation_degree.",
            "- Preserve original dialogue more strongly when dialogue.preservation_degree is high.",
            "- Keep the structure deterministic and concise enough for a product API response.",
            "Input data:",
            json.dumps(prompt_payload, ensure_ascii=False, indent=2),
        ]
    )


def _schema_example() -> dict[str, Any]:
    return {
        "screenplay": {
            "meta": {
                "title": "string",
                "version": "0.1.0",
                "generator": "llm",
                "language": "zh-CN",
            },
            "adaptation_settings": {
                "tone": {"style": "string", "intensity": 50},
                "target": {"medium": "string", "adaptation_degree": 50},
                "dialogue": {"preservation_degree": 60},
            },
            "source_novel": {
                "chapter_count": 3,
                "chapters": [
                    {
                        "chapter_id": "chapter_001",
                        "order": 1,
                        "title": "string",
                        "content_length": 0,
                    }
                ],
            },
            "characters": [
                {
                    "character_id": "character_001",
                    "name": "string",
                    "role": "protagonist",
                    "description": "string",
                }
            ],
            "acts": [
                {
                    "act_id": "act_001",
                    "order": 1,
                    "title": "string",
                    "source_chapters": ["chapter_001"],
                    "scenes": [
                        {
                            "scene_id": "scene_001",
                            "order": 1,
                            "title": "string",
                            "location": "string",
                            "time": "string",
                            "characters": ["character_001"],
                            "source_chapter_id": "chapter_001",
                            "conflict": "string",
                            "summary": "string",
                            "beats": [{"type": "action", "content": "string"}],
                        }
                    ],
                }
            ],
            "quality_report": {
                "chapter_count": 3,
                "scene_count": 3,
                "character_count": 1,
                "chapter_coverage_rate": "100%",
                "covered_chapters": ["chapter_001"],
                "missing_chapters": [],
                "warnings": [],
            },
        }
    }

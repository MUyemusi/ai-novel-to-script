"""YAML validation service for generated screenplay structures."""

from __future__ import annotations

from functools import lru_cache
import json
from pathlib import Path
from typing import Any

import yaml
from jsonschema import Draft202012Validator


PROJECT_ROOT = Path(__file__).resolve().parent.parent
SCHEMA_PATH = PROJECT_ROOT / "schemas" / "screenplay_schema.json"


def validate_yaml_text(yaml_text: str) -> dict[str, Any]:
    """Validate YAML syntax, MVP schema shape, and basic screenplay rules."""
    errors: list[dict[str, str]] = []
    warnings: list[dict[str, str]] = []

    if not yaml_text or not yaml_text.strip():
        return _build_result(
            errors=[_issue("", "YAML cannot be empty.")],
            warnings=[],
            summary=_empty_summary(),
        )

    try:
        data = yaml.safe_load(yaml_text)
    except yaml.YAMLError as exc:
        return _build_result(
            errors=[_issue("", f"YAML parse failed: {exc.__class__.__name__}.")],
            warnings=[],
            summary=_empty_summary(),
        )

    if not isinstance(data, dict):
        return _build_result(
            errors=[_issue("", "YAML root must be an object.")],
            warnings=[],
            summary=_empty_summary(),
        )

    errors.extend(_validate_schema(data))
    summary = _calculate_summary(data)
    errors.extend(_business_errors(data))
    warnings.extend(_business_warnings(data, summary))

    return _build_result(errors=errors, warnings=warnings, summary=summary)


def _validate_schema(data: dict[str, Any]) -> list[dict[str, str]]:
    validator = Draft202012Validator(_load_schema())
    schema_errors = sorted(validator.iter_errors(data), key=lambda error: list(error.path))
    return [
        _issue(_format_path(error.path), error.message)
        for error in schema_errors
    ]


@lru_cache(maxsize=1)
def _load_schema() -> dict[str, Any]:
    return json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))


def _business_errors(data: dict[str, Any]) -> list[dict[str, str]]:
    errors: list[dict[str, str]] = []
    screenplay = data.get("screenplay")
    if not isinstance(screenplay, dict):
        return errors

    acts = screenplay.get("acts")
    if not isinstance(acts, list) or not acts:
        errors.append(_issue("screenplay.acts", "acts must contain at least one act."))
    elif not any(_act_has_scenes(act) for act in acts):
        errors.append(_issue("screenplay.acts", "acts must contain at least one scene."))

    source_novel = screenplay.get("source_novel")
    if isinstance(source_novel, dict):
        chapter_count = _to_int(source_novel.get("chapter_count"))
        if chapter_count is not None and chapter_count < 3:
            errors.append(
                _issue(
                    "screenplay.source_novel.chapter_count",
                    "source_novel.chapter_count must be at least 3.",
                )
            )

    return errors


def _business_warnings(
    data: dict[str, Any],
    summary: dict[str, Any],
) -> list[dict[str, str]]:
    warnings: list[dict[str, str]] = []
    screenplay = data.get("screenplay")
    if not isinstance(screenplay, dict):
        return warnings

    quality_report = screenplay.get("quality_report")
    if isinstance(quality_report, dict):
        reported_scene_count = _to_int(quality_report.get("scene_count"))
        if (
            reported_scene_count is not None
            and reported_scene_count != summary["scene_count"]
        ):
            warnings.append(
                _issue(
                    "screenplay.quality_report.scene_count",
                    "quality_report.scene_count does not match actual scene count.",
                )
            )

        reported_character_count = _to_int(quality_report.get("character_count"))
        if (
            reported_character_count is not None
            and reported_character_count != summary["character_count"]
        ):
            warnings.append(
                _issue(
                    "screenplay.quality_report.character_count",
                    "quality_report.character_count does not match actual character count.",
                )
            )

        coverage_rate = summary.get("chapter_coverage_rate")
        if isinstance(coverage_rate, (int, float)) and coverage_rate < 1.0:
            warnings.append(
                _issue(
                    "screenplay.acts",
                    "chapter coverage is below 100%",
                )
            )

    for act_index, act in enumerate(_acts(screenplay)):
        scenes = act.get("scenes", [])
        for scene_index, scene in enumerate(scenes):
            if not isinstance(scene, dict):
                continue
            scene_path = f"screenplay.acts[{act_index}].scenes[{scene_index}]"
            if not scene.get("source_chapter_id"):
                warnings.append(
                    _issue(
                        f"{scene_path}.source_chapter_id",
                        "scene is missing source_chapter_id.",
                    )
                )
            dialogues = scene.get("dialogues")
            if not isinstance(dialogues, list) or not dialogues:
                warnings.append(
                    _issue(f"{scene_path}.dialogues", "scene has no dialogues.")
                )

    return warnings


def _calculate_summary(data: dict[str, Any]) -> dict[str, Any]:
    screenplay = data.get("screenplay")
    if not isinstance(screenplay, dict):
        return _empty_summary()

    characters = screenplay.get("characters")
    acts = _acts(screenplay)
    scene_count = sum(len(act.get("scenes", [])) for act in acts)
    character_count = len(characters) if isinstance(characters, list) else 0
    chapter_count = _summary_chapter_count(screenplay)
    covered_chapters = _covered_chapters(acts)
    coverage_rate = _coverage_rate(len(covered_chapters), chapter_count)

    return {
        "chapter_count": chapter_count,
        "scene_count": scene_count,
        "character_count": character_count,
        "chapter_coverage_rate": coverage_rate,
    }


def _summary_chapter_count(screenplay: dict[str, Any]) -> int:
    source_novel = screenplay.get("source_novel")
    if isinstance(source_novel, dict):
        chapter_count = _to_int(source_novel.get("chapter_count"))
        if chapter_count is not None:
            return chapter_count
    quality_report = screenplay.get("quality_report")
    if isinstance(quality_report, dict):
        chapter_count = _to_int(quality_report.get("chapter_count"))
        if chapter_count is not None:
            return chapter_count
    return 0


def _acts(screenplay: dict[str, Any]) -> list[dict[str, Any]]:
    acts = screenplay.get("acts")
    if not isinstance(acts, list):
        return []
    return [act for act in acts if isinstance(act, dict)]


def _act_has_scenes(act: Any) -> bool:
    return isinstance(act, dict) and isinstance(act.get("scenes"), list) and bool(act["scenes"])


def _covered_chapters(acts: list[dict[str, Any]]) -> set[str]:
    covered = set()
    for act in acts:
        scenes = act.get("scenes")
        if not isinstance(scenes, list):
            continue
        for scene in scenes:
            if not isinstance(scene, dict):
                continue
            chapter_id = scene.get("source_chapter_id")
            if chapter_id:
                covered.add(str(chapter_id))
    return covered


def _coverage_rate(covered_count: int, chapter_count: int) -> float:
    if chapter_count <= 0:
        return 0
    return min(covered_count / chapter_count, 1.0)


def _to_int(value: Any) -> int | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _to_rate(value: Any) -> float | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        stripped = value.strip()
        if stripped.endswith("%"):
            try:
                return float(stripped[:-1]) / 100
            except ValueError:
                return None
        try:
            return float(stripped)
        except ValueError:
            return None
    return None


def _build_result(
    errors: list[dict[str, str]],
    warnings: list[dict[str, str]],
    summary: dict[str, Any],
) -> dict[str, Any]:
    if errors:
        status = "error"
        valid = False
    elif warnings:
        status = "warning"
        valid = True
    else:
        status = "pass"
        valid = True

    return {
        "valid": valid,
        "status": status,
        "errors": errors,
        "warnings": warnings,
        "summary": summary,
    }


def _empty_summary() -> dict[str, Any]:
    return {
        "chapter_count": 0,
        "scene_count": 0,
        "character_count": 0,
        "chapter_coverage_rate": 0,
    }


def _issue(path: str, message: str) -> dict[str, str]:
    return {
        "path": path,
        "message": message,
    }


def _format_path(path_parts: Any) -> str:
    parts = list(path_parts)
    if not parts:
        return ""
    path = str(parts[0])
    for part in parts[1:]:
        if isinstance(part, int):
            path += f"[{part}]"
        else:
            path += f".{part}"
    return path

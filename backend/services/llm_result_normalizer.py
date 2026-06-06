"""Normalize slightly irregular LLM screenplay structures."""

from __future__ import annotations

from copy import deepcopy
from typing import Any


WRAPPER_KEYS = ("result", "data", "screenplay_data")


def normalize_llm_script_structure(
    raw_data: Any,
    chapters: list[dict[str, Any]] | None = None,
) -> tuple[dict[str, Any], list[str]]:
    """Return backend-compatible screenplay data and non-fatal repair warnings."""
    if not isinstance(raw_data, dict):
        raise ValueError("LLM result must be an object.")

    warnings: list[str] = []
    data = deepcopy(raw_data)
    data = _unwrap_common_wrapper(data, warnings)

    screenplay = data.get("screenplay")
    if isinstance(screenplay, dict):
        normalized = {"screenplay": screenplay}
    else:
        if "screenplay" in data:
            warnings.append("Replaced invalid screenplay object.")
        screenplay = {
            key: data.get(key)
            for key in (
                "meta",
                "adaptation_settings",
                "source_novel",
                "characters",
                "acts",
                "quality_report",
            )
            if key in data
        }
        normalized = {"screenplay": screenplay}
        if not screenplay:
            warnings.append("Created missing screenplay structure.")
        else:
            warnings.append("Wrapped root screenplay fields into screenplay object.")

    _normalize_screenplay_identity(screenplay, warnings)
    _normalize_meta(screenplay, warnings)
    _normalize_source_novel(screenplay, chapters, warnings)
    _normalize_adaptation_settings(screenplay, warnings)
    screenplay["characters"] = _normalize_characters(
        screenplay.get("characters"),
        warnings,
    )
    screenplay["acts"] = _normalize_acts(
        screenplay.get("acts"),
        chapters,
        warnings,
    )
    _recalculate_quality_report(screenplay, chapters, warnings)

    return normalized, warnings


def _unwrap_common_wrapper(data: dict[str, Any], warnings: list[str]) -> dict[str, Any]:
    for key in WRAPPER_KEYS:
        wrapped = data.get(key)
        if isinstance(wrapped, dict):
            warnings.append(f"Unwrapped LLM result from '{key}'.")
            return deepcopy(wrapped)
    return data


def _normalize_screenplay_identity(
    screenplay: dict[str, Any],
    warnings: list[str],
) -> None:
    if not screenplay.get("title"):
        screenplay["title"] = "Untitled screenplay"
        warnings.append("Filled missing screenplay title.")
    if not screenplay.get("type"):
        screenplay["type"] = "screenplay"
        warnings.append("Filled missing screenplay type.")


def _normalize_meta(screenplay: dict[str, Any], warnings: list[str]) -> None:
    if not isinstance(screenplay.get("meta"), dict):
        screenplay["meta"] = {}
        warnings.append("Replaced invalid or missing meta object.")
    screenplay["meta"].setdefault("generator", "llm")


def _normalize_adaptation_settings(
    screenplay: dict[str, Any],
    warnings: list[str],
) -> None:
    if not isinstance(screenplay.get("adaptation_settings"), dict):
        screenplay["adaptation_settings"] = {}
        warnings.append("Replaced invalid or missing adaptation_settings object.")


def _normalize_source_novel(
    screenplay: dict[str, Any],
    chapters: list[dict[str, Any]] | None,
    warnings: list[str],
) -> None:
    if not isinstance(screenplay.get("source_novel"), dict):
        screenplay["source_novel"] = {}
        warnings.append("Replaced invalid or missing source_novel object.")

    if chapters is not None:
        if screenplay["source_novel"].get("chapter_count") != len(chapters):
            warnings.append("Recalculated source novel chapter_count from chapters.")
        screenplay["source_novel"]["chapter_count"] = len(chapters)


def _normalize_characters(
    raw_characters: Any,
    warnings: list[str],
) -> list[dict[str, Any]]:
    if isinstance(raw_characters, dict):
        warnings.append("Converted characters object to list.")
        characters = [
            {"name": name, "role": role, "description": ""}
            for name, role in raw_characters.items()
        ]
    elif isinstance(raw_characters, list):
        characters = raw_characters
    else:
        if raw_characters is not None:
            warnings.append("Replaced invalid characters with an empty list.")
        else:
            warnings.append("Filled missing characters with an empty list.")
        characters = []

    normalized_characters: list[dict[str, Any]] = []
    for index, character in enumerate(characters, start=1):
        normalized_characters.append(_normalize_character(character, index, warnings))
    return normalized_characters


def _normalize_character(
    character: Any,
    index: int,
    warnings: list[str],
) -> dict[str, Any]:
    if isinstance(character, str):
        warnings.append("Converted character string to object.")
        data: dict[str, Any] = {"name": character}
    elif isinstance(character, dict):
        data = deepcopy(character)
    else:
        warnings.append("Replaced invalid character item with default object.")
        data = {}

    data["name"] = (
        data.get("name")
        or data.get("character_name")
        or data.get("人物名")
        or "Unnamed character"
    )
    data["role"] = data.get("role") or data.get("角色") or "unspecified"
    data["description"] = data.get("description") or data.get("描述") or ""
    data.setdefault("character_id", f"character_{index:03d}")
    return data


def _normalize_acts(
    raw_acts: Any,
    chapters: list[dict[str, Any]] | None,
    warnings: list[str],
) -> list[dict[str, Any]]:
    if not isinstance(raw_acts, list):
        if raw_acts is not None:
            warnings.append("Replaced invalid acts with an empty list.")
        else:
            warnings.append("Filled missing acts with an empty list.")
        return []

    normalized_acts: list[dict[str, Any]] = []
    scene_offset = 0
    for act_index, act in enumerate(raw_acts, start=1):
        if not isinstance(act, dict):
            warnings.append("Replaced invalid act item with default object.")
            act_data: dict[str, Any] = {}
        else:
            act_data = deepcopy(act)

        act_data.setdefault("act_id", f"act_{act_index}")
        act_data.setdefault("title", f"Act {act_index}")
        act_data.setdefault("summary", "")

        scenes = act_data.get("scenes")
        if not isinstance(scenes, list):
            warnings.append("Replaced invalid scenes with an empty list.")
            scenes = []

        normalized_scenes = []
        for scene_index, scene in enumerate(scenes, start=1):
            scene_offset += 1
            normalized_scenes.append(
                _normalize_scene(
                    scene,
                    act_index,
                    scene_index,
                    scene_offset,
                    chapters,
                    warnings,
                )
            )
        act_data["scenes"] = normalized_scenes
        normalized_acts.append(act_data)

    return normalized_acts


def _normalize_scene(
    scene: Any,
    act_index: int,
    scene_index: int,
    scene_offset: int,
    chapters: list[dict[str, Any]] | None,
    warnings: list[str],
) -> dict[str, Any]:
    if not isinstance(scene, dict):
        warnings.append("Replaced invalid scene item with default object.")
        data: dict[str, Any] = {}
    else:
        data = deepcopy(scene)

    data.setdefault("scene_id", f"scene_{act_index}_{scene_index}")
    data.setdefault("title", f"Scene {scene_index}")
    data.setdefault("source_chapter_id", _chapter_id_for_scene(chapters, scene_offset))
    data.setdefault("location", "Unspecified location")
    data.setdefault("time", "Unspecified time")
    data.setdefault("summary", "")
    data["characters"] = _ensure_list(data.get("characters"))
    data["actions"] = _normalize_actions(data.get("actions"), warnings)
    data["dialogues"] = _normalize_dialogues(
        data.get("dialogues", data.get("dialogue")),
        warnings,
    )
    return data


def _chapter_id_for_scene(
    chapters: list[dict[str, Any]] | None,
    scene_offset: int,
) -> str:
    if not chapters:
        return "unknown"
    chapter = chapters[min(scene_offset - 1, len(chapters) - 1)]
    return str(chapter.get("chapter_id") or "unknown")


def _ensure_list(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def _normalize_actions(value: Any, warnings: list[str]) -> list[Any]:
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        warnings.append("Converted action string to list.")
        return [value]
    if value is not None:
        warnings.append("Replaced invalid actions with an empty list.")
    return []


def _normalize_dialogues(value: Any, warnings: list[str]) -> list[dict[str, Any]]:
    if isinstance(value, str):
        warnings.append("Converted dialogue string to dialogue object.")
        items: list[Any] = [value]
    elif isinstance(value, list):
        items = value
    else:
        if value is not None:
            warnings.append("Replaced invalid dialogues with an empty list.")
        return []

    dialogues = []
    for item in items:
        if isinstance(item, str):
            dialogues.append({"character": "Narrator", "line": item})
            warnings.append("Converted dialogue string item to object.")
        elif isinstance(item, dict):
            dialogue = deepcopy(item)
            dialogue["character"] = (
                dialogue.get("character")
                or dialogue.get("speaker")
                or dialogue.get("name")
                or dialogue.get("人物")
                or "Narrator"
            )
            dialogue["line"] = (
                dialogue.get("line")
                or dialogue.get("text")
                or dialogue.get("content")
                or dialogue.get("台词")
                or ""
            )
            dialogues.append(dialogue)
        else:
            warnings.append("Skipped invalid dialogue item.")
    return dialogues


def _recalculate_quality_report(
    screenplay: dict[str, Any],
    chapters: list[dict[str, Any]] | None,
    warnings: list[str],
) -> None:
    quality_report = screenplay.get("quality_report")
    if not isinstance(quality_report, dict):
        quality_report = {}
        warnings.append("Replaced invalid or missing quality_report object.")

    chapter_count = _chapter_count(screenplay, chapters)
    scene_count = sum(len(act.get("scenes", [])) for act in screenplay.get("acts", []))
    character_count = len(screenplay.get("characters", []))
    covered_chapters = _covered_chapters(screenplay)
    coverage_rate = _coverage_rate(len(covered_chapters), chapter_count)

    previous_stats = {
        "chapter_count": quality_report.get("chapter_count"),
        "scene_count": quality_report.get("scene_count"),
        "character_count": quality_report.get("character_count"),
        "chapter_coverage_rate": quality_report.get("chapter_coverage_rate"),
    }
    quality_report["chapter_count"] = chapter_count
    quality_report["scene_count"] = scene_count
    quality_report["character_count"] = character_count
    quality_report["chapter_coverage_rate"] = coverage_rate
    screenplay["quality_report"] = quality_report
    if previous_stats != {
        "chapter_count": chapter_count,
        "scene_count": scene_count,
        "character_count": character_count,
        "chapter_coverage_rate": coverage_rate,
    }:
        warnings.append("Recalculated quality_report statistics.")


def _chapter_count(
    screenplay: dict[str, Any],
    chapters: list[dict[str, Any]] | None,
) -> int:
    if chapters is not None:
        return len(chapters)
    source_novel = screenplay.get("source_novel", {})
    try:
        return int(source_novel.get("chapter_count") or 0)
    except (TypeError, ValueError):
        return 0


def _covered_chapters(screenplay: dict[str, Any]) -> set[str]:
    covered = set()
    for act in screenplay.get("acts", []):
        for scene in act.get("scenes", []):
            chapter_id = scene.get("source_chapter_id")
            if chapter_id and chapter_id != "unknown":
                covered.add(str(chapter_id))
    return covered


def _coverage_rate(covered_count: int, chapter_count: int) -> float:
    if chapter_count <= 0:
        return 0
    return min(covered_count / chapter_count, 1.0)

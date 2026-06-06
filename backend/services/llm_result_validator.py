"""Basic validation for normalized LLM screenplay structures."""

from __future__ import annotations

from typing import Any


def validate_normalized_script_structure(data: Any) -> tuple[bool, list[str]]:
    """Validate the normalized structure without performing YAML Schema checks."""
    errors: list[str] = []
    if not isinstance(data, dict):
        return False, ["data must be an object."]

    screenplay = data.get("screenplay")
    if not isinstance(screenplay, dict):
        return False, ["screenplay must be an object."]

    required_fields = {
        "meta",
        "source_novel",
        "characters",
        "acts",
        "quality_report",
    }
    missing_fields = sorted(required_fields - set(screenplay))
    if missing_fields:
        errors.append(f"screenplay missing fields: {', '.join(missing_fields)}.")

    characters = screenplay.get("characters")
    if not isinstance(characters, list):
        errors.append("characters must be a list.")

    acts = screenplay.get("acts")
    if not isinstance(acts, list):
        errors.append("acts must be a list.")
    elif not acts:
        errors.append("acts must contain at least one act.")
    elif not any(isinstance(act, dict) and act.get("scenes") for act in acts):
        errors.append("acts must contain at least one scene.")

    quality_report = screenplay.get("quality_report")
    if not isinstance(quality_report, dict):
        errors.append("quality_report must be an object.")
    else:
        scene_count = quality_report.get("scene_count")
        if not isinstance(scene_count, (int, float)) or scene_count <= 0:
            errors.append("quality_report.scene_count must be greater than 0.")

    return not errors, errors

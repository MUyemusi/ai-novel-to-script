"""JSON Schema definitions and validation helpers for notebook APIs."""

from typing import Any, Dict

from jsonschema import Draft202012Validator


NOTEBOOK_SUMMARY_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "required": [
        "id",
        "title",
        "description",
        "created_at",
        "updated_at",
        "message_count",
        "summary",
        "last_message_preview",
    ],
    "properties": {
        "id": {"type": "string", "minLength": 1},
        "title": {"type": "string", "minLength": 1, "maxLength": 80},
        "description": {"type": "string", "maxLength": 240},
        "created_at": {"type": "string", "minLength": 1},
        "updated_at": {"type": "string", "minLength": 1},
        "message_count": {"type": "integer", "minimum": 0},
        "summary": {"type": "string"},
        "last_message_preview": {"type": "string"},
    },
    "additionalProperties": False,
}

NOTEBOOKS_RESPONSE_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "required": ["notebooks"],
    "properties": {
        "notebooks": {
            "type": "array",
            "items": NOTEBOOK_SUMMARY_SCHEMA,
        }
    },
    "additionalProperties": False,
}

CREATE_NOTEBOOK_REQUEST_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "required": ["title"],
    "properties": {
        "title": {"type": "string", "minLength": 1, "maxLength": 80},
        "description": {"type": "string", "maxLength": 240},
    },
    "additionalProperties": False,
}

MESSAGE_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "required": ["id", "role", "content", "created_at"],
    "properties": {
        "id": {"type": "string", "minLength": 1},
        "role": {
            "type": "string",
            "enum": ["user", "assistant", "system"],
        },
        "content": {"type": "string", "minLength": 1},
        "created_at": {"type": "string", "minLength": 1},
    },
    "additionalProperties": False,
}

CHAPTER_PREVIEW_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "required": ["chapter_id", "order", "title", "summary", "content_preview", "content_length"],
    "properties": {
        "chapter_id": {"type": "string"},
        "order": {"type": "integer"},
        "title": {"type": "string"},
        "summary": {"type": "string"},
        "content_preview": {"type": "string"},
        "content_length": {"type": "integer", "minimum": 0},
    },
    "additionalProperties": False,
}

CHARACTER_PREVIEW_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "required": ["name", "role", "description", "character_id"],
    "properties": {
        "name": {"type": "string"},
        "role": {"type": "string"},
        "description": {"type": "string"},
        "character_id": {"type": "string"},
    },
    "additionalProperties": False,
}

SCRIPT_SUMMARY_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "required": ["chapter_count", "scene_count", "character_count", "chapter_coverage_rate"],
    "properties": {
        "chapter_count": {"type": "integer", "minimum": 0},
        "scene_count": {"type": "integer", "minimum": 0},
        "character_count": {"type": "integer", "minimum": 0},
        "chapter_coverage_rate": {"type": "string"},
    },
    "additionalProperties": False,
}

ADAPTATION_PROFILE_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "required": [
        "tone_style",
        "medium",
        "tone_intensity",
        "adaptation_degree",
        "dialogue_preservation_degree",
    ],
    "properties": {
        "tone_style": {"type": "string"},
        "medium": {"type": "string"},
        "tone_intensity": {"type": "integer", "minimum": 0, "maximum": 100},
        "adaptation_degree": {"type": "integer", "minimum": 0, "maximum": 100},
        "dialogue_preservation_degree": {"type": "integer", "minimum": 0, "maximum": 100},
    },
    "additionalProperties": False,
}

SCRIPT_STATE_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "required": [
        "raw_text",
        "chapters",
        "adaptation_profile",
        "generated_yaml",
        "generated_summary",
        "generated_characters",
        "active_step",
        "updated_at",
    ],
    "properties": {
        "raw_text": {"type": "string"},
        "chapters": {"type": "array", "items": CHAPTER_PREVIEW_SCHEMA},
        "adaptation_profile": ADAPTATION_PROFILE_SCHEMA,
        "generated_yaml": {"type": "string"},
        "generated_summary": {
            "anyOf": [
                SCRIPT_SUMMARY_SCHEMA,
                {"type": "null"},
            ]
        },
        "generated_characters": {"type": "array", "items": CHARACTER_PREVIEW_SCHEMA},
        "active_step": {"type": "integer", "minimum": 1, "maximum": 5},
        "updated_at": {"type": "string", "minLength": 1},
    },
    "additionalProperties": False,
}

CONVERSATIONS_RESPONSE_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "required": ["notebook", "conversations", "script_state"],
    "properties": {
        "notebook": NOTEBOOK_SUMMARY_SCHEMA,
        "conversations": {
            "type": "array",
            "items": MESSAGE_SCHEMA,
        },
        "script_state": {
            "anyOf": [
                SCRIPT_STATE_SCHEMA,
                {"type": "null"},
            ]
        },
    },
    "additionalProperties": False,
}

CREATE_CONVERSATION_REQUEST_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "required": ["message"],
    "properties": {
        "message": {"type": "string", "minLength": 1, "maxLength": 4000},
    },
    "additionalProperties": False,
}

CREATE_CONVERSATION_RESPONSE_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "required": ["notebook", "user_message", "assistant_message", "conversations"],
    "properties": {
        "notebook": NOTEBOOK_SUMMARY_SCHEMA,
        "user_message": MESSAGE_SCHEMA,
        "assistant_message": MESSAGE_SCHEMA,
        "conversations": {
            "type": "array",
            "items": MESSAGE_SCHEMA,
        },
    },
    "additionalProperties": False,
}

NOTEBOOK_FILE_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "required": ["id", "title", "description", "created_at", "updated_at", "conversations", "script_state"],
    "properties": {
        "id": {"type": "string", "minLength": 1},
        "title": {"type": "string", "minLength": 1, "maxLength": 80},
        "description": {"type": "string", "maxLength": 240},
        "created_at": {"type": "string", "minLength": 1},
        "updated_at": {"type": "string", "minLength": 1},
        "conversations": {
            "type": "array",
            "items": MESSAGE_SCHEMA,
        },
        "script_state": {
            "anyOf": [
                SCRIPT_STATE_SCHEMA,
                {"type": "null"},
            ]
        },
    },
    "additionalProperties": False,
}

UPDATE_SCRIPT_STATE_REQUEST_SCHEMA: Dict[str, Any] = SCRIPT_STATE_SCHEMA

UPDATE_SCRIPT_STATE_RESPONSE_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "required": ["notebook", "script_state"],
    "properties": {
        "notebook": NOTEBOOK_SUMMARY_SCHEMA,
        "script_state": SCRIPT_STATE_SCHEMA,
    },
    "additionalProperties": False,
}


def validate_payload(schema: Dict[str, Any], data: Any, label: str) -> None:
    """Raise ValueError when payload does not match the given schema."""
    validator = Draft202012Validator(schema)
    errors = sorted(validator.iter_errors(data), key=lambda error: error.path)
    if not errors:
        return

    first_error = errors[0]
    path = ".".join(str(part) for part in first_error.absolute_path)
    path_hint = f" ({path})" if path else ""
    raise ValueError(f"{label} 校验失败{path_hint}: {first_error.message}")

import pytest

from backend.services.llm_result_normalizer import normalize_llm_script_structure


CHAPTERS = [
    {"chapter_id": "chapter_001", "order": 1, "title": "One", "content": "A"},
    {"chapter_id": "chapter_002", "order": 2, "title": "Two", "content": "B"},
]


def test_normal_structure_is_preserved_with_recalculated_quality_report():
    raw_data = {
        "screenplay": {
            "title": "Draft",
            "type": "screenplay",
            "meta": {"generator": "llm"},
            "adaptation_settings": {},
            "source_novel": {"chapter_count": 99},
            "characters": [{"name": "Lin", "role": "lead", "description": ""}],
            "acts": [
                {
                    "act_id": "act_1",
                    "title": "Act 1",
                    "summary": "",
                    "scenes": [
                        {
                            "scene_id": "scene_1_1",
                            "title": "Opening",
                            "source_chapter_id": "chapter_001",
                            "location": "Library",
                            "time": "Night",
                            "summary": "A clue appears.",
                            "characters": ["Lin"],
                            "actions": ["Finds a letter."],
                            "dialogues": [{"character": "Lin", "line": "Who sent this?"}],
                        }
                    ],
                }
            ],
            "quality_report": {"scene_count": 99},
        }
    }

    normalized, warnings = normalize_llm_script_structure(raw_data, chapters=CHAPTERS)
    screenplay = normalized["screenplay"]

    assert screenplay["title"] == "Draft"
    assert screenplay["source_novel"]["chapter_count"] == 2
    assert screenplay["quality_report"]["scene_count"] == 1
    assert screenplay["quality_report"]["character_count"] == 1
    assert screenplay["quality_report"]["chapter_count"] == 2
    assert screenplay["quality_report"]["chapter_coverage_rate"] == 0.5
    assert warnings


def test_missing_top_level_fields_are_filled_with_warnings():
    normalized, warnings = normalize_llm_script_structure(
        {
            "characters": ["Lin"],
            "acts": [{"scenes": [{"summary": "A scene."}]}],
        },
        chapters=CHAPTERS,
    )
    screenplay = normalized["screenplay"]

    assert screenplay["meta"]["generator"] == "llm"
    assert screenplay["adaptation_settings"] == {
        "tone": {},
        "target": {},
        "dialogue": {},
    }
    assert screenplay["source_novel"]["chapter_count"] == 2
    assert screenplay["characters"][0]["name"] == "Lin"
    assert warnings


def test_common_wrapper_is_unwrapped():
    normalized, warnings = normalize_llm_script_structure(
        {
            "result": {
                "characters": [],
                "acts": [{"scenes": [{"summary": "Wrapped scene."}]}],
            }
        },
        chapters=CHAPTERS,
    )

    assert normalized["screenplay"]["acts"][0]["scenes"][0]["summary"] == "Wrapped scene."
    assert any("Unwrapped" in warning for warning in warnings)


def test_characters_dict_is_converted_to_list():
    normalized, warnings = normalize_llm_script_structure(
        {
            "characters": {"Lin": "lead", "Shen": "supporting"},
            "acts": [{"scenes": [{"summary": "A scene."}]}],
        },
        chapters=CHAPTERS,
    )

    characters = normalized["screenplay"]["characters"]
    assert characters == [
        {
            "name": "Lin",
            "role": "主角",
            "description": "",
            "character_id": "character_001",
        },
        {
            "name": "Shen",
            "role": "配角",
            "description": "",
            "character_id": "character_002",
        },
    ]
    assert any("characters object" in warning for warning in warnings)


def test_character_string_item_is_converted_to_object():
    normalized, warnings = normalize_llm_script_structure(
        {
            "characters": ["Lin"],
            "acts": [{"scenes": [{"summary": "A scene."}]}],
        },
        chapters=CHAPTERS,
    )

    character = normalized["screenplay"]["characters"][0]
    assert character["name"] == "Lin"
    assert character["role"] == "未标注"
    assert character["description"] == ""
    assert any("character string" in warning for warning in warnings)


def test_act_and_scene_fields_are_filled():
    normalized, warnings = normalize_llm_script_structure(
        {
            "characters": [],
            "acts": [{"scenes": [{}]}],
        },
        chapters=CHAPTERS,
    )
    scene = normalized["screenplay"]["acts"][0]["scenes"][0]

    assert scene["scene_id"] == "scene_1_1"
    assert scene["title"] == "第 1 场"
    assert scene["source_chapter_id"] == "chapter_001"
    assert scene["location"] == "待定场景"
    assert scene["time"] == "待定时间"
    assert scene["actions"] == []
    assert scene["dialogues"] == []
    assert warnings


def test_english_adaptation_and_role_labels_are_mapped_to_chinese():
    normalized, _warnings = normalize_llm_script_structure(
        {
            "adaptation_settings": {
                "tone": {"style": "dramatic", "intensity": 50},
                "target": {"medium": "miniseries", "adaptation_degree": 50},
                "dialogue": {"preservation_degree": 60},
            },
            "characters": [{"name": "Lin", "role": "protagonist"}],
            "acts": [{"scenes": [{"summary": "A scene."}]}],
        },
        chapters=CHAPTERS,
    )

    screenplay = normalized["screenplay"]
    assert screenplay["adaptation_settings"]["tone"]["style"] == "冷峻"
    assert screenplay["adaptation_settings"]["target"]["medium"] == "短剧"
    assert screenplay["characters"][0]["role"] == "主角"


def test_dialogue_field_is_converted_to_dialogues():
    normalized, warnings = normalize_llm_script_structure(
        {
            "characters": [],
            "acts": [{"scenes": [{"dialogue": "A secret line."}]}],
        },
        chapters=CHAPTERS,
    )
    scene = normalized["screenplay"]["acts"][0]["scenes"][0]

    assert scene["dialogues"] == [{"character": "Narrator", "line": "A secret line."}]
    assert any("dialogue string" in warning for warning in warnings)


def test_dialogue_string_items_are_converted_to_objects():
    normalized, warnings = normalize_llm_script_structure(
        {
            "characters": [],
            "acts": [{"scenes": [{"dialogues": ["A line."]}]}],
        },
        chapters=CHAPTERS,
    )
    scene = normalized["screenplay"]["acts"][0]["scenes"][0]

    assert scene["dialogues"] == [{"character": "Narrator", "line": "A line."}]
    assert any("dialogue string item" in warning for warning in warnings)


def test_quality_report_is_recalculated():
    normalized, _warnings = normalize_llm_script_structure(
        {
            "characters": ["Lin", "Shen"],
            "acts": [
                {"scenes": [{"source_chapter_id": "chapter_001"}]},
                {"scenes": [{"source_chapter_id": "chapter_002"}]},
            ],
            "quality_report": {
                "chapter_count": 999,
                "scene_count": 999,
                "character_count": 999,
                "chapter_coverage_rate": 999,
            },
        },
        chapters=CHAPTERS,
    )
    quality_report = normalized["screenplay"]["quality_report"]

    assert quality_report["chapter_count"] == 2
    assert quality_report["scene_count"] == 2
    assert quality_report["character_count"] == 2
    assert quality_report["chapter_coverage_rate"] == 1.0


def test_raw_data_must_be_dict():
    with pytest.raises(ValueError):
        normalize_llm_script_structure(["not", "dict"], chapters=CHAPTERS)

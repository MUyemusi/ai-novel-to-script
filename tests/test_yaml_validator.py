import yaml

from backend.services.yaml_validator import validate_yaml_text


def valid_yaml_text(**quality_overrides):
    data = {
        "screenplay": {
            "title": "Rain Night",
            "type": "screenplay",
            "meta": {"generator": "test"},
            "source_novel": {"chapter_count": 3},
            "characters": [
                {"name": "Lin", "role": "lead", "description": ""},
                {"name": "Shen", "role": "support", "description": ""},
            ],
            "acts": [
                {
                    "act_id": "act_1",
                    "title": "Act 1",
                    "summary": "",
                    "scenes": [
                        {
                            "scene_id": "scene_1",
                            "title": "Scene 1",
                            "source_chapter_id": "chapter_001",
                            "location": "Library",
                            "time": "Night",
                            "summary": "A letter arrives.",
                            "characters": ["Lin"],
                            "actions": ["Lin opens the letter."],
                            "dialogues": [{"character": "Lin", "line": "Who sent this?"}],
                        },
                        {
                            "scene_id": "scene_2",
                            "title": "Scene 2",
                            "source_chapter_id": "chapter_002",
                            "location": "Warehouse",
                            "time": "Night",
                            "summary": "A clue appears.",
                            "characters": ["Shen"],
                            "actions": ["Shen finds a mark."],
                            "dialogues": [{"character": "Shen", "line": "This is it."}],
                        },
                        {
                            "scene_id": "scene_3",
                            "title": "Scene 3",
                            "source_chapter_id": "chapter_003",
                            "location": "Bridge",
                            "time": "Dawn",
                            "summary": "Truth emerges.",
                            "characters": ["Lin", "Shen"],
                            "actions": ["They compare notes."],
                            "dialogues": [{"character": "Lin", "line": "Now we know."}],
                        },
                    ],
                }
            ],
            "quality_report": {
                "chapter_count": 3,
                "scene_count": 3,
                "character_count": 2,
                "chapter_coverage_rate": 1.0,
                **quality_overrides,
            },
        }
    }
    return yaml.safe_dump(data, allow_unicode=True, sort_keys=False)


def test_valid_yaml_returns_pass_or_warning():
    result = validate_yaml_text(valid_yaml_text())

    assert result["valid"] is True
    assert result["status"] in {"pass", "warning"}
    assert result["errors"] == []


def test_empty_yaml_returns_error():
    result = validate_yaml_text("")

    assert result["valid"] is False
    assert result["status"] == "error"
    assert result["errors"]


def test_yaml_syntax_error_returns_error():
    result = validate_yaml_text("screenplay:\n  - bad: [")

    assert result["valid"] is False
    assert result["status"] == "error"
    assert result["errors"]


def test_yaml_root_must_be_dict():
    result = validate_yaml_text("- one\n- two\n")

    assert result["valid"] is False
    assert result["status"] == "error"


def test_missing_top_level_required_field_returns_error():
    result = validate_yaml_text("meta: {}\n")

    assert result["valid"] is False
    assert result["status"] == "error"
    assert any("screenplay" in error["message"] for error in result["errors"])


def test_empty_acts_returns_error():
    data = yaml.safe_load(valid_yaml_text())
    data["screenplay"]["acts"] = []

    result = validate_yaml_text(yaml.safe_dump(data, allow_unicode=True))

    assert result["valid"] is False
    assert result["status"] == "error"


def test_empty_scenes_returns_error():
    data = yaml.safe_load(valid_yaml_text())
    data["screenplay"]["acts"][0]["scenes"] = []

    result = validate_yaml_text(yaml.safe_dump(data, allow_unicode=True))

    assert result["valid"] is False
    assert result["status"] == "error"


def test_chapter_count_less_than_three_returns_error():
    data = yaml.safe_load(valid_yaml_text())
    data["screenplay"]["source_novel"]["chapter_count"] = 2

    result = validate_yaml_text(yaml.safe_dump(data, allow_unicode=True))

    assert result["valid"] is False
    assert result["status"] == "error"
    assert any("chapter_count" in error["path"] for error in result["errors"])


def test_low_chapter_coverage_returns_warning():
    data = yaml.safe_load(valid_yaml_text(chapter_coverage_rate=1.0))
    for scene in data["screenplay"]["acts"][0]["scenes"]:
        scene.pop("source_chapter_id", None)

    result = validate_yaml_text(yaml.safe_dump(data, allow_unicode=True))

    assert result["valid"] is True
    assert result["status"] == "warning"
    assert result["summary"]["chapter_coverage_rate"] == 0.0
    assert any(
        warning["path"] == "screenplay.acts"
        and warning["message"] == "chapter coverage is below 100%"
        for warning in result["warnings"]
    )


def test_act_source_chapters_are_used_as_coverage_fallback():
    data = yaml.safe_load(valid_yaml_text(chapter_coverage_rate=1.0))
    for act in data["screenplay"]["acts"]:
        act["source_chapters"] = [
            scene["source_chapter_id"]
            for scene in act["scenes"]
        ]
        for scene in act["scenes"]:
            scene.pop("source_chapter_id", None)

    result = validate_yaml_text(yaml.safe_dump(data, allow_unicode=True))

    assert result["valid"] is True
    assert result["summary"]["chapter_coverage_rate"] == 1.0
    assert any(
        warning["message"] == "scene is missing source_chapter_id."
        for warning in result["warnings"]
    )


def test_scene_count_mismatch_returns_warning():
    result = validate_yaml_text(valid_yaml_text(scene_count=99))

    assert result["valid"] is True
    assert result["status"] == "warning"
    assert any("scene_count" in warning["path"] for warning in result["warnings"])


def test_character_count_mismatch_returns_warning():
    result = validate_yaml_text(valid_yaml_text(character_count=99))

    assert result["valid"] is True
    assert result["status"] == "warning"
    assert any("character_count" in warning["path"] for warning in result["warnings"])


def test_summary_is_calculated_from_actual_content():
    result = validate_yaml_text(valid_yaml_text(scene_count=99, character_count=99))

    assert result["summary"] == {
        "chapter_count": 3,
        "scene_count": 3,
        "character_count": 2,
        "chapter_coverage_rate": 1.0,
    }

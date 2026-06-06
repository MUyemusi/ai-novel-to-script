from backend.services.llm_result_validator import validate_normalized_script_structure


def valid_structure():
    return {
        "screenplay": {
            "meta": {"generator": "llm"},
            "source_novel": {"chapter_count": 1},
            "characters": [],
            "acts": [
                {
                    "act_id": "act_1",
                    "title": "Act 1",
                    "summary": "",
                    "scenes": [{"scene_id": "scene_1_1"}],
                }
            ],
            "quality_report": {
                "chapter_count": 1,
                "scene_count": 1,
                "character_count": 0,
                "chapter_coverage_rate": 1.0,
            },
        }
    }


def test_complete_normalized_structure_is_valid():
    is_valid, errors = validate_normalized_script_structure(valid_structure())

    assert is_valid is True
    assert errors == []


def test_missing_required_field_is_invalid():
    data = valid_structure()
    del data["screenplay"]["meta"]

    is_valid, errors = validate_normalized_script_structure(data)

    assert is_valid is False
    assert errors


def test_characters_must_be_list():
    data = valid_structure()
    data["screenplay"]["characters"] = {}

    is_valid, errors = validate_normalized_script_structure(data)

    assert is_valid is False
    assert any("characters" in error for error in errors)


def test_acts_must_not_be_empty():
    data = valid_structure()
    data["screenplay"]["acts"] = []

    is_valid, errors = validate_normalized_script_structure(data)

    assert is_valid is False
    assert any("at least one act" in error for error in errors)


def test_acts_must_be_list():
    data = valid_structure()
    data["screenplay"]["acts"] = {}

    is_valid, errors = validate_normalized_script_structure(data)

    assert is_valid is False
    assert any("acts" in error for error in errors)


def test_acts_must_contain_at_least_one_scene():
    data = valid_structure()
    data["screenplay"]["acts"] = [{"act_id": "act_1", "scenes": []}]

    is_valid, errors = validate_normalized_script_structure(data)

    assert is_valid is False
    assert any("at least one scene" in error for error in errors)


def test_scene_count_must_be_greater_than_zero():
    data = valid_structure()
    data["screenplay"]["quality_report"]["scene_count"] = 0

    is_valid, errors = validate_normalized_script_structure(data)

    assert is_valid is False
    assert any("scene_count" in error for error in errors)

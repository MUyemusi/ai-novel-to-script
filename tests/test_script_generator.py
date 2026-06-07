import pytest
import yaml

from backend.services.script_generator import build_script_structure
from backend.services.yaml_validator import validate_yaml_text


THREE_CHAPTER_NOVEL = """
第1章 雨夜来信
第一章正文。林舟收到一封没有署名的信。

第2章 南桥仓库
第二章正文。沈月带着线索来到南桥仓库。

第3章 真相浮现
第三章正文。所有线索终于汇合。
"""


def test_three_chapter_novel_generates_screenplay_structure():
    result = build_script_structure(THREE_CHAPTER_NOVEL)

    assert "screenplay" in result

    screenplay = result["screenplay"]
    assert "meta" in screenplay
    assert "adaptation_settings" in screenplay
    assert "source_novel" in screenplay
    assert "characters" in screenplay
    assert "acts" in screenplay
    assert "quality_report" in screenplay

    assert screenplay["source_novel"]["chapter_count"] == 3
    assert len(screenplay["acts"]) == 3
    assert all(act["scenes"] for act in screenplay["acts"])
    assert screenplay["quality_report"]["scene_count"] == 3
    assert screenplay["quality_report"]["chapter_coverage_rate"] == "100%"


def test_adaptation_profile_is_used_as_adaptation_settings():
    adaptation_profile = {
        "tone": {
            "style": "悬疑",
            "intensity": 80,
        },
        "target": {
            "medium": "短剧",
            "adaptation_degree": 70,
        },
        "dialogue": {
            "preservation_degree": 40,
        },
    }

    result = build_script_structure(
        THREE_CHAPTER_NOVEL,
        adaptation_profile=adaptation_profile,
    )

    assert result["screenplay"]["adaptation_settings"] == adaptation_profile


def test_adaptation_profile_is_deep_copied():
    adaptation_profile = {
        "tone": {
            "style": "悬疑",
            "intensity": 80,
        },
        "target": {
            "medium": "短剧",
            "adaptation_degree": 70,
        },
        "dialogue": {
            "preservation_degree": 40,
        },
    }

    result = build_script_structure(
        THREE_CHAPTER_NOVEL,
        adaptation_profile=adaptation_profile,
    )
    adaptation_profile["tone"]["style"] = "现实"

    assert result["screenplay"]["adaptation_settings"]["tone"]["style"] == "悬疑"


def test_default_adaptation_settings_use_nested_pr9_profile():
    result = build_script_structure(THREE_CHAPTER_NOVEL)

    adaptation_settings = result["screenplay"]["adaptation_settings"]

    assert adaptation_settings["tone"]["style"] == "现实"
    assert adaptation_settings["tone"]["intensity"] == 50
    assert adaptation_settings["target"]["medium"] == "影视剧"
    assert adaptation_settings["target"]["adaptation_degree"] == 50
    assert adaptation_settings["dialogue"]["preservation_degree"] == 60


def test_quality_report_scene_count_matches_total_act_scenes():
    result = build_script_structure(THREE_CHAPTER_NOVEL)
    screenplay = result["screenplay"]

    scene_count = sum(len(act["scenes"]) for act in screenplay["acts"])

    assert screenplay["quality_report"]["scene_count"] == scene_count


def test_each_generated_scene_has_source_chapter_id():
    result = build_script_structure(THREE_CHAPTER_NOVEL)

    for act in result["screenplay"]["acts"]:
        assert act["source_chapters"]
        for scene in act["scenes"]:
            assert scene["source_chapter_id"] in act["source_chapters"]


def test_generated_yaml_validation_uses_nonzero_chapter_coverage():
    result = build_script_structure(THREE_CHAPTER_NOVEL)
    yaml_text = yaml.safe_dump(result, allow_unicode=True, sort_keys=False)

    validation = validate_yaml_text(yaml_text)

    assert validation["summary"]["chapter_coverage_rate"] == 1.0
    assert not any(
        warning["path"] == "screenplay.acts"
        and warning["message"] == "chapter coverage is below 100%"
        for warning in validation["warnings"]
    )


def test_each_scene_has_non_empty_action_beat():
    result = build_script_structure(THREE_CHAPTER_NOVEL)
    acts = result["screenplay"]["acts"]

    for act in acts:
        for scene in act["scenes"]:
            assert scene["beats"]
            assert scene["beats"][0]["type"] == "action"
            assert scene["beats"][0]["content"]


def test_empty_text_raises_value_error():
    with pytest.raises(ValueError):
        build_script_structure("")


def test_text_without_chapter_titles_raises_value_error():
    text = "这是普通小说正文。\n它有段落，但没有第几章这样的章节标题。"

    with pytest.raises(ValueError):
        build_script_structure(text)


def test_less_than_three_chapters_raises_value_error():
    text = """
第1章 雨夜来信
第一章正文。

第2章 南桥仓库
第二章正文。
"""

    with pytest.raises(ValueError):
        build_script_structure(text)

import re
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent


def read_text(relative_path: str) -> str:
    return (PROJECT_ROOT / relative_path).read_text(encoding="utf-8")


def test_notebook_metric_elements_exist_for_notebook_app_refs():
    html = read_text("frontend/notebook.html")

    for element_id in ("homeNotebookCount", "homeMessageCount", "homeUpdatedAt"):
        assert f'id="{element_id}"' in html


def test_notebook_metrics_are_null_guarded():
    app_js = read_text("frontend/notebook-app.js")

    assert "function setOptionalText" in app_js
    assert "setOptionalText(elements.homeNotebookCount" in app_js
    assert "setOptionalText(elements.homeMessageCount" in app_js
    assert "setOptionalText(elements.homeUpdatedAt" in app_js


def test_script_app_tracks_readable_script_validity():
    script_js = read_text("frontend/script-app.js")

    assert "readableScriptValid: false" in script_js
    assert "state.readableScriptValid = true" in script_js
    assert "state.readableScriptValid = false" in script_js


def test_preview_and_export_depend_on_valid_readable_or_confirmed_final_script():
    script_js = read_text("frontend/script-app.js")
    update_action_buttons = re.search(
        r"function updateActionButtons\(\) \{(?P<body>.*?)\n\}",
        script_js,
        re.DOTALL,
    )

    assert update_action_buttons is not None
    body = update_action_buttons.group("body")
    assert "state.readableScriptValid && Boolean(state.readableScriptText.trim())" in body
    assert "state.finalScriptConfirmed && Boolean(state.finalScriptText.trim())" in body
    assert "Boolean(getReadableScriptText().trim())" not in body


def test_script_state_snapshot_includes_readable_and_final_script_fields():
    script_js = read_text("frontend/script-app.js")
    snapshot = re.search(
        r"function getScriptStateSnapshot\(\) \{(?P<body>.*?)\n\}",
        script_js,
        re.DOTALL,
    )

    assert snapshot is not None
    body = snapshot.group("body")
    for field in (
        "readable_script_text",
        "readable_script_valid",
        "final_script_text",
        "final_script_confirmed",
    ):
        assert field in body


def test_yaml_parser_supports_same_indent_lists_after_map_keys():
    script_js = read_text("frontend/script-app.js")

    assert "function hasYamlNestedBlock" in script_js
    assert 'nextLine.indent === parentIndent && nextLine.text.startsWith("- ")' in script_js
    assert "getYamlNestedBlockIndent(nextLine, indent)" in script_js

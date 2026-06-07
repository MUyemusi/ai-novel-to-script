"""YAML helpers for notebook persistence and schema validation."""

from pathlib import Path
from typing import Any, Dict

import yaml

from .schema import validate_payload


def read_yaml_file(path: Path, schema: Dict[str, Any], label: str) -> Dict[str, Any]:
    """Read YAML data from disk and validate it against the given schema."""
    try:
        raw_data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    except FileNotFoundError as exc:
        raise FileNotFoundError(f"{label} 文件不存在: {path.name}") from exc
    except OSError as exc:
        raise OSError(f"{label} 文件读取失败: {path.name}") from exc
    except yaml.YAMLError as exc:
        raise ValueError(f"{label} YAML 解析失败: {path.name}") from exc

    validate_payload(schema, raw_data, label)
    return raw_data


def write_yaml_file(path: Path, data: Dict[str, Any], schema: Dict[str, Any], label: str) -> None:
    """Validate and write YAML data to disk."""
    validate_payload(schema, data, label)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        yaml.safe_dump(data, allow_unicode=True, sort_keys=False),
        encoding="utf-8",
    )

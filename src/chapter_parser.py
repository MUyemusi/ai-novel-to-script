"""Novel chapter parsing utilities."""

import re
from typing import Any


CHAPTER_TITLE_PATTERN = re.compile(
    r"^\s*(?P<heading>第(?P<number>[0-9]+|[一二三四五六七八九十百千万〇零两]+)章"
    r"(?:[ \t　：:、.-]+(?P<title>\S.*?))?)\s*$",
    re.MULTILINE,
)


def split_chapters(text: str) -> list[dict[str, Any]]:
    """Split novel text into structured chapters.

    Only standalone chapter title lines such as "第1章 雨夜来信" or
    "第一章 雨夜来信" are recognized.
    """
    if not text:
        return []

    matches = list(CHAPTER_TITLE_PATTERN.finditer(text))
    if not matches:
        return []

    chapters = []
    for index, match in enumerate(matches, start=1):
        next_match_start = matches[index].start() if index < len(matches) else len(text)
        raw_title = match.group("title")
        full_heading = match.group("heading").strip()
        content = text[match.end() : next_match_start].strip()

        chapters.append(
            {
                "chapter_id": f"chapter_{index:03d}",
                "order": index,
                "title": raw_title.strip() if raw_title else full_heading,
                "content": content,
            }
        )

    return chapters


def validate_min_chapters(chapters: list[dict[str, Any]], min_count: int = 3) -> bool:
    """Return whether chapter count satisfies the minimum requirement."""
    return len(chapters) >= min_count

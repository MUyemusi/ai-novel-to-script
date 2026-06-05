from backend.services.chapter_parser import split_chapters, validate_min_chapters


def test_split_arabic_number_chapters():
    text = """
第1章 雨夜来信
第一章正文

第2章 南桥仓库
第二章正文

第3章 真相浮现
第三章正文
"""

    chapters = split_chapters(text)

    assert chapters == [
        {
            "chapter_id": "chapter_001",
            "order": 1,
            "title": "雨夜来信",
            "content": "第一章正文",
        },
        {
            "chapter_id": "chapter_002",
            "order": 2,
            "title": "南桥仓库",
            "content": "第二章正文",
        },
        {
            "chapter_id": "chapter_003",
            "order": 3,
            "title": "真相浮现",
            "content": "第三章正文",
        },
    ]
    assert validate_min_chapters(chapters) is True


def test_split_chinese_number_chapters():
    text = """
第一章 雨夜来信
雨声敲在窗上。

第二章 南桥仓库
仓库里传来脚步声。

第三章 真相浮现
所有线索终于合拢。
"""

    chapters = split_chapters(text)

    assert [chapter["title"] for chapter in chapters] == [
        "雨夜来信",
        "南桥仓库",
        "真相浮现",
    ]
    assert [chapter["chapter_id"] for chapter in chapters] == [
        "chapter_001",
        "chapter_002",
        "chapter_003",
    ]
    assert chapters[0]["content"] == "雨声敲在窗上。"
    assert chapters[1]["content"] == "仓库里传来脚步声。"
    assert chapters[2]["content"] == "所有线索终于合拢。"


def test_validate_min_chapters_returns_false_when_count_is_less_than_three():
    chapters = [
        {"chapter_id": "chapter_001", "order": 1, "title": "雨夜来信", "content": "正文"},
        {"chapter_id": "chapter_002", "order": 2, "title": "南桥仓库", "content": "正文"},
    ]

    assert validate_min_chapters(chapters) is False


def test_empty_text_returns_empty_list():
    assert split_chapters("") == []


def test_text_without_chapter_titles_returns_empty_list():
    text = "这是没有章节标题的小说正文。\n它只有自然段，没有第几章这样的标题。"

    assert split_chapters(text) == []


def test_chapter_words_inside_content_do_not_split_chapters():
    text = """
第1章 雨夜来信
林夏低声说：“第一章只是故事的开始。”
她把第2章的草稿压在信纸下面。

第2章 南桥仓库
仓库里传来脚步声。
"""

    chapters = split_chapters(text)

    assert len(chapters) == 2
    assert "林夏低声说：“第一章只是故事的开始。”" in chapters[0]["content"]
    assert "她把第2章的草稿压在信纸下面。" in chapters[0]["content"]


def test_title_uses_full_heading_when_chapter_name_is_missing():
    text = """
第1章
没有章名的正文
"""

    chapters = split_chapters(text)

    assert chapters[0]["title"] == "第1章"
    assert chapters[0]["content"] == "没有章名的正文"

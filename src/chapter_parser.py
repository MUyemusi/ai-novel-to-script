"""章节解析模块占位文件。

当前版本仅保留接口占位，后续 PR 将实现小说章节自动切分与章节数量校验。
"""


def split_chapters(text: str):
    """TODO: 后续 PR 实现小说章节自动切分。"""
    return []


def validate_min_chapters(chapters, min_count: int = 3):
    """TODO: 后续 PR 检查章节数量是否满足要求。"""
    return len(chapters) >= min_count

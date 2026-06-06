"""Script style options and configurations for screenplay generation."""

TONE_OPTIONS = [
    "现实",
    "严肃",
    "诙谐",
    "深刻",
    "浪漫",
    "悬疑",
    "热血",
    "治愈",
    "冷峻",
    "诗意",
]

MEDIUM_OPTIONS = [
    "影视剧",
    "短剧",
    "舞台剧",
    "广播剧",
    "分镜初稿",
    "有声书改编",
]

DEFAULT_ADAPTATION_PROFILE = {
    "tone": {
        "style": "现实",
        "intensity": 50,
    },
    "target": {
        "medium": "影视剧",
        "adaptation_degree": 50,
    },
    "dialogue": {
        "preservation_degree": 60,
    },
}

DEFAULT_STYLE_FORM_VALUES = {
    "tone_style": DEFAULT_ADAPTATION_PROFILE["tone"]["style"],
    "medium": DEFAULT_ADAPTATION_PROFILE["target"]["medium"],
    "tone_intensity": DEFAULT_ADAPTATION_PROFILE["tone"]["intensity"],
    "adaptation_degree": DEFAULT_ADAPTATION_PROFILE["target"]["adaptation_degree"],
    "dialogue_preservation_degree": DEFAULT_ADAPTATION_PROFILE["dialogue"][
        "preservation_degree"
    ],
}


def get_script_styles() -> dict:
    """Return available script style options, medium options, and default values."""
    return {
        "tone_options": TONE_OPTIONS,
        "medium_options": MEDIUM_OPTIONS,
        "defaults": DEFAULT_STYLE_FORM_VALUES,
        "message": "风格调性选项、适用场景选项和默认参数加载成功。",
    }

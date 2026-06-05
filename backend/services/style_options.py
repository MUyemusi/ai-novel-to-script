"""Script style options and configurations for screenplay generation."""

SCRIPT_STYLE_OPTIONS = [
    {
        "id": "realistic_screenplay",
        "label": "现实的影视剧",
        "adjective": "现实",
        "script_type": "影视剧",
        "description": "适合现实题材、人物关系清晰、镜头表达明确的影视剧改编。",
        "defaults": {
            "tone_intensity": 50,
            "adaptation_degree": 50,
            "dialogue_preservation_degree": 60,
        },
    },
    {
        "id": "elegant_stage_play",
        "label": "典雅的舞台剧",
        "adjective": "典雅",
        "script_type": "舞台剧",
        "description": "强调人物内心、语言表达、舞台调度的传统舞台剧风格。",
        "defaults": {
            "tone_intensity": 70,
            "adaptation_degree": 60,
            "dialogue_preservation_degree": 80,
        },
    },
    {
        "id": "light_web_drama",
        "label": "轻松的网络短剧",
        "adjective": "轻松",
        "script_type": "网络短剧",
        "description": "节奏快速、趣味性强、适合短视频平台的网络短剧。",
        "defaults": {
            "tone_intensity": 30,
            "adaptation_degree": 70,
            "dialogue_preservation_degree": 40,
        },
    },
    {
        "id": "suspense_short_film",
        "label": "悬疑的影视短片",
        "adjective": "悬疑",
        "script_type": "影视短片",
        "description": "紧张节奏、悬念设置、适合短片电影的紧凑剧情。",
        "defaults": {
            "tone_intensity": 80,
            "adaptation_degree": 65,
            "dialogue_preservation_degree": 50,
        },
    },
    {
        "id": "delicate_audio_drama",
        "label": "细腻的广播剧",
        "adjective": "细腻",
        "script_type": "广播剧",
        "description": "强调语音表现力、音效设计、适合音频媒体的广播剧。",
        "defaults": {
            "tone_intensity": 60,
            "adaptation_degree": 55,
            "dialogue_preservation_degree": 75,
        },
    },
    {
        "id": "passionate_adventure_drama",
        "label": "热血的少年冒险剧",
        "adjective": "热血",
        "script_type": "少年冒险剧",
        "description": "热血激情、冒险精神、适合青少年观众的冒险题材。",
        "defaults": {
            "tone_intensity": 85,
            "adaptation_degree": 70,
            "dialogue_preservation_degree": 45,
        },
    },
]

DEFAULT_STYLE_ID = "realistic_screenplay"


def get_script_styles() -> dict:
    """Return available script style configurations."""
    return {
        "styles": SCRIPT_STYLE_OPTIONS,
        "default_style_id": DEFAULT_STYLE_ID,
        "message": "剧本风格配置加载成功。",
    }

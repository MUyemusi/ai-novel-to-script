"""FastAPI backend entry for AI 小说转剧本工具."""

from fastapi import FastAPI


app = FastAPI(title="AI 小说转剧本工具", version="0.1.0")


@app.get("/health")
def health_check() -> dict[str, str]:
    """Return basic backend health information."""
    return {
        "status": "ok",
        "app": "AI 小说转剧本工具",
        "version": "0.1.0",
        "architecture": "frontend-backend-separated",
    }

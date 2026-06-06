# AI 小说转剧本工具

## 项目简介

AI 小说转剧本工具是一个比赛 Demo 项目，面向小说作者，目标是将 3 个章节以上的小说文本逐步转换为结构化 YAML 剧本初稿。

当前项目已调整为前后端分离结构：前端使用 HTML、CSS 和原生 JavaScript，后端使用 FastAPI。当前后端已提供健康检查、章节解析、示例小说、风格配置和剧本 YAML 生成接口，并在 PR13 中支持可选的大模型生成；当未配置 API Key 或 USE_LLM=false 时，系统会继续使用规则生成逻辑。Schema 校验、YAML 下载、清洗渲染、Word/PDF 导出仍属于后续计划。

## 当前技术栈

- 前端：HTML + CSS + JavaScript
- 后端：FastAPI
- YAML：PyYAML
- Schema 校验：jsonschema
- 测试：pytest

## 当前已完成功能

- 小说章节自动切分功能
- pytest 测试运行配置
- 前后端分离目录结构
- FastAPI 健康检查接口 `/health`
- 章节解析接口 `POST /api/chapters/parse`
- 示例小说接口 `GET /api/examples/novel`
- 剧本风格配置接口 `GET /api/script/styles`
- 剧本 YAML 生成接口 `POST /api/script/generate`
- 前端小说输入区：支持文本粘贴、txt 上传、一键加载示例、清空文本和字数统计
- 前端章节识别：调用章节解析接口并展示章节数、3 章要求状态和章节卡片
- 前端 YAML 结果展示、summary 统计和人物表展示
- 可选 LLM 生成：支持 `generation_mode` 为 `rule`、`llm`、`rule_fallback`
- PR14：LLM 输出结构规范化与基础校验，轻微不规范结构会自动修复并返回 `warnings`
- 前端静态页面骨架

## 项目结构

- `frontend/`：前端静态页面
- `frontend/index.html`：页面入口
- `frontend/styles.css`：页面样式
- `frontend/app.js`：前端基础初始化脚本
- `backend/`：FastAPI 后端服务
- `backend/main.py`：后端应用入口
- `backend/requirements.txt`：后端依赖
- `backend/services/`：后端核心服务模块
- `tests/`：单元测试
- `docs/`：设计文档与开发过程记录
- `examples/`：示例小说和示例输出
- `assets/`：静态资源目录
- `pytest.ini`：pytest 测试运行配置
- `requirements.txt`：项目总体依赖入口

## 环境准备

项目建议使用独立 Python 虚拟环境运行，统一虚拟环境名称为 `ai-novel-to-script-venv`。

创建虚拟环境：

```bash
python -m venv ai-novel-to-script-venv
```

Windows PowerShell 激活虚拟环境：

```powershell
.\ai-novel-to-script-venv\Scripts\Activate.ps1
```

如果 PowerShell 提示禁止运行脚本，可在当前 PowerShell 窗口临时执行：

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
```

然后再次激活：

```powershell
.\ai-novel-to-script-venv\Scripts\Activate.ps1
```

Git Bash 激活虚拟环境：

```bash
source ai-novel-to-script-venv/Scripts/activate
```

macOS / Linux 激活虚拟环境：

```bash
source ai-novel-to-script-venv/bin/activate
```

## 安装依赖

后端开发推荐安装 `backend/requirements.txt`：

```bash
cd backend
pip install -r requirements.txt
```

也可以在项目根目录安装总体依赖入口：

```bash
pip install -r requirements.txt
```

## 启动后端

```bash
cd backend
uvicorn main:app --reload
```

后端访问地址：

```text
http://127.0.0.1:8000
```

健康检查接口：

```text
GET http://127.0.0.1:8000/health
```

章节解析接口：

```text
POST http://127.0.0.1:8000/api/chapters/parse
```

请求示例：

```json
{
  "text": "第1章 雨夜来信\n林舟站在旧书店门口。\n\n第2章 南桥仓库\n他来到南桥仓库。\n\n第3章 真相浮现\n沈月说出了真相。"
}
```

返回内容包括章节数量、是否满足至少 3 章要求、章节标题、摘要预览、正文预览和正文长度。接口不会返回完整章节正文。

示例小说接口：

```text
GET http://127.0.0.1:8000/api/examples/novel
```

该接口读取项目内置示例小说《雨夜来信》，为后续前端“一键加载示例小说”功能提供文本数据。返回字段包括 `title`、`text`、`source` 和 `message`。剧本风格配置接口：

```text
GET http://127.0.0.1:8000/api/script/styles
```

该接口返回风格调性选项、适用场景选项和默认参数。返回字段包括：

- `tone_options`：风格调性列表（10 个选项：现实、严肃、诙谐、深刻、浪漫、悬疑、热血、治愈、冷峻、诗意）
- `medium_options`：适用场景列表（6 个选项：影视剧、短剧、舞台剧、广播剧、分镜初稿、有声书改编）
- `defaults`：默认参数对象，包含 `tone_style`、`medium`、`tone_intensity`、`adaptation_degree` 和 `dialogue_preservation_degree`
- `message`：操作提示消息

该接口用于前端剧本改编调音台的风格选择器渲染，以及后续剧本 YAML 生成功能提供基础配置数据。

## 启动前端

```bash
cd frontend
python -m http.server 5500
```

前端访问地址：

```text
http://127.0.0.1:5500
```

当前前端已支持小说文本粘贴、txt 上传、一键加载示例小说、清空文本和字数统计。一键加载示例小说需要后端服务保持运行：

```bash
cd backend
uvicorn main:app --reload
```

输入、上传或加载小说文本后，点击“识别章节”会调用 `POST /api/chapters/parse`，页面会展示章节数、是否满足 3 章要求以及章节标题、摘要预览和正文长度。

## 运行测试

在项目根目录执行：

```bash
python -m pytest
```

## PR13: LLM API generation

PR13 adds optional backend-only LLM generation for screenplay structure. The existing rule-based generator remains the default and is still used automatically when LLM generation is disabled, not configured, or fails.

Create a local `.env` file from `.env.example`:

```env
USE_LLM=false
LLM_API_KEY=your_api_key_here
LLM_MODEL=deepseek-chat
LLM_BASE_URL=https://api.deepseek.com
LLM_TIMEOUT_SECONDS=60
```

Set `USE_LLM=true` and provide `LLM_API_KEY` to prefer the OpenAI-compatible Chat Completions API at `{LLM_BASE_URL}/v1/chat/completions`. The API key is read only by the backend and must not be committed to Git. `.env` is ignored by `.gitignore`.

`POST /api/script/generate` now returns `generation_mode`:

- `rule`: rule-based generation
- `llm`: LLM generation succeeded
- `rule_fallback`: LLM generation failed and the backend used the rule generator

The response also includes `warnings`, while preserving `yaml`, `summary`, and `characters` for the existing frontend display.

## PR14: LLM output normalization and basic validation

PR14 adds a backend normalization layer for LLM-generated screenplay structures before YAML conversion. If the model returns a slightly irregular but repairable structure, the backend fills missing fields, normalizes characters/acts/scenes/dialogues, recalculates summary statistics, and returns `generation_mode="llm"` with repair notes in `warnings`.

If the normalized result is still unusable, the backend automatically falls back to the rule-based generator and returns `generation_mode="rule_fallback"`.

This is only a lightweight structural normalizer and basic validator. It is not the full YAML Schema validation feature, and it does not add YAML download, Word/PDF export, or screenplay document preview. Those capabilities remain planned for later PRs.

## 文档位置

- YAML Schema 设计文档：`docs/yaml_schema_design.md`
- MVP Schema 说明：`docs/mvp_schema.md`
- 开发过程记录：`docs/process_log.md`

## PR 开发说明

本项目采用分支 + PR 方式持续开发，每个 PR 只完成一件事，确保主分支保持可运行。

- PR 1：小说章节自动切分功能
- PR 2：虚拟环境搭建、依赖管理与 pytest 测试运行配置
- PR 3：前后端分离架构调整
- PR 4：章节解析 API
- PR 5：示例小说 API
- PR 6：前端小说输入区
- PR 7：前端接入章节解析 API
- PR 8：剧本风格配置 API
- PR 9：前端接入剧本风格选择器
- 后续 PR：剧本 YAML 生成 API、Schema 校验 API 等功能

## 时间规范说明

本项目所有示例时间与生成时间统一采用中国北京时间，Asia/Shanghai，UTC+08:00。

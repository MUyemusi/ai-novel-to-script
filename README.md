# AI 小说转剧本工具

## 项目简介

AI 小说转剧本工具是一个比赛 Demo 项目，面向小说作者，目标是将 3 个章节以上的小说文本逐步转换为结构化 YAML 剧本初稿。

当前项目已调整为前后端分离结构：前端使用 HTML、CSS 和原生 JavaScript，后端使用 FastAPI。当前后端已提供健康检查、章节解析、示例小说、风格配置、剧本 YAML 生成和 YAML 校验接口，并在 PR13 中支持可选的大模型生成；当未配置 API Key 或 USE_LLM=false 时，系统会继续使用规则生成逻辑。前端已支持 YAML 校验和 YAML 下载。清洗渲染、Word/PDF 导出仍属于后续计划。

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
- 前端 YAML 校验与 `screenplay.yaml` 下载
- 前端可读剧本渲染：将当前 YAML 渲染为可复制的 Acts → Scenes → Characters → Dialogue 文本
- 前端局部重渲染：可选择某一幕或某一场并仅替换该部分
- 前端稿纸预览与最终剧本确认：可在弹窗内编辑并确认最终文本
- 可选 LLM 生成：支持 `generation_mode` 为 `rule`、`llm`、`rule_fallback`
- PR14：LLM 输出结构规范化与基础校验，轻微不规范结构会自动修复并返回 `warnings`
- PR15：后端 YAML Schema 校验 API `POST /api/yaml/validate`
- PR16：前端接入“校验 YAML”和“下载 YAML”按钮
- PR17：前端接入“渲染剧本”按钮
- PR18：前端接入“稿纸预览”和“确认最终剧本”弹窗
- PR20：前端接入“局部重渲染”选择器和按钮
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

生成 YAML 后，可在 YAML 结构区继续操作：

- 点击“校验 YAML”会调用 `POST /api/yaml/validate`，并展示 `valid`、`status`、`errors`、`warnings` 和重新计算的 `summary`。
- 点击“下载 YAML”会把当前 YAML 编辑区内容保存为 `screenplay.yaml`。
- 点击“渲染剧本”会把当前 YAML 渲染为可复制的可读剧本文本。每次手动修改 YAML 后，可再次点击该按钮刷新渲染结果。
- 在可读剧本区选择某一幕或某一场后，点击“局部重渲染”会复用现有剧本生成 API 重写所选部分，并保持未选择部分不变。
- 点击“稿纸预览”会打开可编辑弹窗。弹窗优先载入已确认的最终剧本；如果还没有确认文本，则载入当前可读剧本文本。编辑后点击“确认最终剧本”会把文本保存到前端状态，作为后续 Word 导出的来源。关闭弹窗不会修改 YAML，也不会保存未确认的修改。
- 在稿纸弹窗中确认最终剧本后，点击“导出 Word”会下载 `screenplay.docx`。导出内容来自已确认的最终剧本文本，不会自动使用未确认的弹窗编辑内容。

校验结果示例：

```json
{
  "valid": true,
  "status": "warning",
  "errors": [],
  "warnings": [
    {
      "path": "screenplay.acts",
      "message": "chapter coverage is below 100%"
    }
  ],
  "summary": {
    "chapter_count": 3,
    "scene_count": 2,
    "character_count": 2,
    "chapter_coverage_rate": 0.67
  }
}
```

可读剧本渲染示例：

```text
《Rain Night》

第1幕：Act 1 (Chapter ID: chapter_001)
  场景1：Scene 1 (Chapter ID: chapter_001)
    时空：Library / Night
    角色：Lin
    对白：
      Lin：Who sent this?
```

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

## PR15: YAML validation API

PR15 adds a backend-only YAML validation API:

```text
POST /api/yaml/validate
```

Request body:

```json
{
  "yaml": "screenplay:\n  meta: {}\n  ..."
}
```

Response fields:

- `valid`: whether validation passed without blocking errors
- `status`: `pass`, `warning`, or `error`
- `errors`: structured validation errors with `path` and `message`
- `warnings`: structured quality warnings with `path` and `message`
- `summary`: recalculated `chapter_count`, `scene_count`, `character_count`, and `chapter_coverage_rate`

This API uses a backend MVP JSON Schema at `backend/schemas/screenplay_schema.json` plus lightweight business-rule checks. PR15 does not add a frontend validation button, YAML download, Word/PDF export, or screenplay document preview.

## PR16: Frontend YAML validation and download

PR16 adds frontend controls next to the YAML output area:

- `校验 YAML`: posts the current YAML text to `POST /api/yaml/validate` and renders status, errors, warnings, and summary.
- `下载 YAML`: downloads the current YAML text as `screenplay.yaml`.

The YAML validation result panel is scrollable so long error and warning lists remain usable. PR16 does not change backend validation rules and does not add script rendering, Word/PDF export, database, login, or API key exposure.

## PR17: Frontend readable script rendering

PR17 adds a frontend-only `渲染剧本` button next to the YAML output controls. It parses the current YAML text in the browser and renders a copyable screenplay draft with this hierarchy:

```text
Acts -> Scenes -> Characters -> Dialogue
```

The renderer shows `source_chapter_id` in act and scene headings, displays placeholders such as `暂无场景`、`暂无角色`、`暂无对白` for empty fields, and keeps long output scrollable. PR17 does not change YAML validation or download behavior, and it does not add paper preview, Word/PDF export, local re-rendering, database, or login features.

## PR18: Frontend paper preview and final script confirmation

PR18 adds a frontend-only `稿纸预览` modal. The modal loads the confirmed final script text first; if no final text has been confirmed, it uses the current readable script rendered by PR17.

Inside the modal, users can edit the final script text and click `确认最终剧本` to save it into frontend state as the future Word export source. Closing the modal does not save unconfirmed edits and never changes the YAML textarea.

PR18 does not add Word/PDF export, local re-rendering, backend APIs, database, login, or API key exposure.

## PR19: Frontend Word export

PR19 adds a frontend-only `导出 Word` button inside the paper preview modal. After users click `确认最终剧本`, the confirmed `state.finalScriptText` can be exported as `screenplay.docx`.

The Word export is generated in the browser from the confirmed final text. It preserves line breaks and indentation from the readable script so the Acts -> Scenes -> Characters -> Dialogue hierarchy remains clear. PR19 does not add PDF export, local re-rendering, backend APIs, database, login, or API key exposure.

## PR20: Frontend partial re-rendering

PR20 adds a frontend-only `局部重渲染` control in the readable script area. Users can choose an act or scene, confirm the action, and the frontend reuses the existing `POST /api/script/generate` API to generate replacement YAML for the selected part.

After the replacement is applied, the YAML textarea and readable script are refreshed. If a final script has already been confirmed, the matching act or scene section in `state.finalScriptText` is updated while unselected sections remain unchanged.

PR20 does not add backend APIs, PDF export, database, login, API key exposure, or changes to YAML validation/download/full-generation logic.

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

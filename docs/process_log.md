# 开发过程记录

## Day 1：项目初始化

### 已完成

- 创建项目基础目录结构
- 编写 README 初稿
- 添加 requirements.txt 基础依赖
- 创建 Streamlit 最小页面
- 整理并加入小说改编剧本 YAML Schema 设计文档
- 添加 MVP Schema 说明文档
- 添加示例小说文本
- 创建核心模块占位文件

### 下一步计划

- 实现小说章节自动切分
- 实现小说章节到剧本 YAML 的基础转换
- 实现 YAML 格式校验
- 完成 Streamlit 页面与核心模块连接

## PR 2：虚拟环境与测试运行配置

- 创建并统一使用 `ai-novel-to-script-venv` 作为项目本地虚拟环境。
- 完善 `.gitignore`，避免提交虚拟环境、缓存文件和环境变量文件。
- 整理 `requirements.txt`，保持依赖说明简洁可复现。
- 新增 `pytest.ini`，使项目可以在根目录通过 `python -m pytest` 直接运行测试。
- 保持 PR 1 的章节切分功能不变。
- 当前阶段仍保留 `src + tests + Streamlit Demo` 结构，前后端分离将在后续 PR 中完成。

时间说明：本记录使用中国北京时间 UTC+08:00。

## PR 3：前后端分离架构调整

- 将项目从 Streamlit 单体 Demo 调整为前后端分离结构。
- 新增 `frontend` 目录，用于承载 HTML、CSS 和 JavaScript 页面。
- 新增 `backend` 目录，用于承载 FastAPI 后端服务。
- 将原 `src` 模块迁移至 `backend/services`。
- 新增 FastAPI 健康检查接口 `/health`。
- 更新 README 中的前后端启动方式。
- 保持章节解析功能和测试用例可运行。

时间说明：本记录使用中国北京时间 UTC+08:00。

## PR 4：章节解析 API

- 新增 FastAPI 接口 `POST /api/chapters/parse`。
- 接口接收小说全文文本，调用已有章节切分逻辑返回章节识别结果。
- 返回章节数量、是否满足至少 3 章要求、章节标题、摘要预览、正文预览和正文长度。
- 新增章节解析 API 测试，覆盖三章文本、章节数量不足、空文本和无章节标题文本。
- 该接口用于后续前端章节识别展示。

时间说明：本记录使用中国北京时间 UTC+08:00。

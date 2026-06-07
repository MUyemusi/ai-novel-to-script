# 叙构：AI 小说转剧本工具

`叙构` 是一个将小说章节整理为可编辑剧本结构的前后端分离 Demo。  
当前版本已经不再只是单页 YAML 生成器，而是包含：

- 起始欢迎页
- 多笔记本记忆系统
- 小说转剧本主工作台
- 可选大模型生成与对话
- YAML 校验、清洗剧本、最终剧本预览与 Word 导出

项目目标不是“一次性生成完美剧本”，而是提供一条从原文输入、结构改编、YAML 生成，到清洗为可读剧本、局部重写、最终确认的连续创作链路。

## 当前能力总览

### 1. 创作入口与页面流转

- 起始页：`frontend/index.html`
  - 欢迎页入口
  - 左侧可展开对话记忆栏
  - 创建新笔记本弹窗
  - 环境音选择（篝火、雨声）
  - 飘雪与氛围动效
- 笔记本系统页：`frontend/notebook.html`
  - 多笔记本管理
  - 历史对话查看
  - 基于大模型的笔记本对话
- 剧本生成页：`frontend/script.html`
  - 小说输入
  - 章节识别
  - 改编调音台
  - YAML 生成与校验
  - 清洗剧本 / 最终剧本预览弹窗
  - AI 助理悬浮入口

### 2. 小说转剧本主流程

- 支持文本粘贴、`txt` 上传、加载示例小说、清空文本、字数统计
- 支持章节识别，要求至少 3 章
- 支持剧本风格配置：
  - 风格调性
  - 适用场景
  - 风格体现程度
  - 改编自由度
  - 原文对白保留度
- 支持生成结构化 YAML
- 支持 YAML Schema 校验
- 支持下载 `screenplay.yaml`
- 支持将 YAML 清洗为更接近正式剧本的可读文本
- 支持局部重渲染某一幕 / 某一场
- 支持最终剧本预览、编辑、确认与 Word 导出

### 3. 多笔记本记忆系统

- 支持创建多个笔记本项目
- 支持获取笔记本列表与详情
- 支持在笔记本内持续保存对话历史
- 支持为每个笔记本保存最新 `script_state`
- 从首页记忆栏或笔记本页进入剧本生成页时，可恢复最近一次创作状态
- 首页记忆摘要会根据最近一次剧本操作自动更新
- 当前对话历史默认保留最近 10 条消息

### 4. 大模型能力

- 剧本 YAML 生成支持三种模式：
  - `rule`
  - `llm`
  - `rule_fallback`
- 笔记本对话支持调用已配置的大模型进行真实回复
- 当大模型失败或未配置时，会自动回退到规则 / mock 分支，保证主流程不断
- 已增加 LLM 输出结构规范化与基础校验，轻微不规范结构会自动修复并返回 `warnings`
- 已对部分英文风格字段做中文归一化，减少前端展示混乱

## 技术栈

- 前端：HTML + CSS + 原生 JavaScript
- 后端：FastAPI
- 数据存储：JSON + YAML
- YAML 处理：PyYAML
- Schema 校验：jsonschema
- HTTP 测试：httpx
- 环境变量：python-dotenv
- 测试：pytest

## 目录结构

```text
.
├── backend/
│   ├── main.py
│   ├── config.py
│   ├── schemas/
│   │   └── screenplay_schema.json
│   └── services/
│       ├── chapter_parser.py
│       ├── script_generator.py
│       ├── style_options.py
│       ├── yaml_validator.py
│       ├── llm_client.py
│       ├── llm_prompt_builder.py
│       ├── llm_result_normalizer.py
│       ├── llm_result_validator.py
│       ├── notebook_store.py
│       └── notebook_yaml_store.py
├── frontend/
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   ├── notebook.html
│   ├── notebook-app.js
│   ├── notebook-styles.css
│   ├── script.html
│   ├── script-app.js
│   ├── script-styles.css
│   ├── audio-player.js
│   └── assets/audio/
├── data/notebooks/
├── docs/
├── examples/
├── tests/
├── requirements.txt
└── pytest.ini
```

## 核心接口

### 健康检查

- `GET /health`

### 小说与剧本生成

- `POST /api/chapters/parse`
- `GET /api/examples/novel`
- `GET /api/script/styles`
- `POST /api/script/generate`
- `POST /api/yaml/validate`

### 笔记本系统

- `GET /notebooks`
- `POST /notebooks`
- `GET /notebooks/{id}/conversations`
- `POST /notebooks/{id}/conversations`
- `POST /notebooks/{id}/script-state`

## 接口职责说明

### `POST /api/chapters/parse`

输入小说文本，返回：

- 识别出的章节列表
- 章节数量
- 是否满足至少 3 章要求
- 每章标题、摘要预览、正文预览与长度

### `GET /api/examples/novel`

返回项目内置示例小说，供前端“一键加载示例”使用。

### `GET /api/script/styles`

返回改编调音台所需的风格配置项，包括：

- `tone_options`
- `medium_options`
- `defaults`

### `POST /api/script/generate`

根据原文与改编参数生成结构化剧本 YAML。  
在启用 LLM 时优先走大模型；失败时可回退到规则生成。

### `POST /api/yaml/validate`

对当前 YAML 进行：

- Schema 校验
- 业务规则校验
- 汇总统计
- `warnings` / `errors` 输出

### `POST /notebooks/{id}/script-state`

保存当前剧本工作台状态，包括：

- 原文输入
- 章节识别结果
- 改编参数
- 生成的 YAML
- 清洗剧本文本
- 最终剧本文本
- 当前步骤

## 环境准备

推荐在项目根目录创建独立虚拟环境：

```bash
python -m venv ai-novel-to-script-venv
```

macOS / Linux 激活：

```bash
source ai-novel-to-script-venv/bin/activate
```

Windows PowerShell 激活：

```powershell
.\ai-novel-to-script-venv\Scripts\Activate.ps1
```

安装依赖：

```bash
pip install -r requirements.txt
```

## 启动方式

### 启动后端

```bash
cd backend
uvicorn main:app --reload
```

默认地址：

- `http://127.0.0.1:8000`
- 健康检查：`http://127.0.0.1:8000/health`

### 启动前端

```bash
cd frontend
python -m http.server 5500
```

默认地址：

- 起始页：`http://127.0.0.1:5500/`
- 笔记本页：`http://127.0.0.1:5500/notebook.html`
- 剧本生成页：`http://127.0.0.1:5500/script.html`

## 大模型配置

项目支持通过 `.env` 配置可选 LLM：

```env
USE_LLM=false
LLM_API_KEY=your_api_key_here
LLM_MODEL=deepseek-chat
LLM_BASE_URL=https://api.deepseek.com
LLM_TIMEOUT_SECONDS=60
```

说明：

- `USE_LLM=true` 时，剧本生成与笔记本对话会优先尝试大模型
- 未配置或调用失败时，会自动回退到规则 / mock 分支
- `.env` 已被 `.gitignore` 忽略，不应提交到仓库

## 数据存储说明

笔记本系统数据默认保存在：

- `data/notebooks/index.json`：笔记本索引
- `data/notebooks/<notebook_id>.yaml`：单个笔记本对话与剧本状态

每个笔记本 YAML 内当前会保存：

- 基本信息
- 对话历史
- `script_state`

## 测试

在项目根目录运行：

```bash
python -m pytest
```

当前测试覆盖重点包括：

- 章节切分
- 示例小说接口
- 风格配置接口
- 剧本生成接口
- YAML 校验接口
- LLM 输出规范化与校验
- 笔记本 API
- 前端静态资源可访问性

## 页面与交互说明

### 起始页

- 默认展示欢迎文案与环境音入口
- 左侧记忆栏默认收起，可手动展开
- 点击“开始创作”会先弹出创建笔记本窗口
- 选择已有记忆可直接进入对应项目

### 笔记本系统页

- 左侧为笔记本列表
- 中间为 AI 对话区
- 右侧为项目摘要与统计
- 可随时跳转回首页或剧本生成页

### 剧本生成页

- 三栏主工作区
- YAML 操作区包含校验、下载、清洗为剧本
- 清洗剧本与最终剧本预览均为大弹窗
- AI 助理入口为可拖动悬浮按钮

## 当前实现细节补充

除最基础的“章节切分 + YAML 生成”外，当前版本还补充了这些能力：

- 起始页欢迎动效、飘雪与环境音
- 首页记忆栏与笔记本系统双入口
- 笔记本对话接入大模型
- 笔记本与剧本页上下文打通
- 每个笔记本保存最近一次剧本操作状态
- 返回首页后自动刷新记忆摘要
- 清洗剧本格式重写，趋近正式剧本阅读形态
- 最终剧本确认后支持 Word 导出

## GitHub PR 演进记录

下面这部分基于当前仓库已同步的 GitHub 合并历史整理，覆盖主线已合并的 PR。

### 基础搭建阶段

- `PR #1`：章节解析基础功能
- `PR #2`：虚拟环境与基础运行准备
- `PR #3`：前后端分离目录结构
- `PR #4`：章节解析 API
- `PR #5`：示例小说 API
- `PR #6`：前端小说输入面板
- `PR #7`：前端接通章节解析 API
- `PR #8`：剧本风格配置 API
- `PR #9`：前端风格选择器

### YAML 生成主链阶段

- `PR #10`：剧本结构构建
- `PR #11`：剧本 YAML 生成 API
- `PR #12`：前端接入 YAML 生成
- `PR #13`：`my-feature` 主线整合
- `PR #14`：可选 LLM 剧本生成
- `PR #15`：LLM 输出结构规范化与基础校验
- `PR #16`：YAML Schema 校验 API
- `PR #17`：前端接入 YAML 校验与下载
- `PR #18`：前端接入清洗剧本渲染
- `PR #19`：稿纸预览与最终剧本编辑弹窗
- `PR #20`：Word 导出
- `PR #21`：局部重渲染

### 记忆系统与工作台增强阶段

- `PR #22`：在接入 LLM 的基础上引入起始页、记忆系统与笔记本系统
- `PR #23`：白噪音、页面 UI 精简与冗余入口清理
- `PR #24`：AI 助理接入
- `PR #25`：恢复主工作台导出与流程稳定性
- `PR #26`：修复笔记本页与剧本工作台状态一致性
- `PR #27`：规范剧本清洗代码并重定义YAML，修改清洗剧本页为弹窗
- `PR #28`：首页添加Shader着色器实现飘雪UI效果
- `PR #29`：全面优化UI布局与用户操作动线
  
### 主线外但已在当前分支 / 历史分支实现过的增强

这些能力已经在当前开发分支体系里出现过，README 也已按“当前状态”纳入说明：

- 起始欢迎页与多入口页面流转
- 笔记本系统独立页面
- 白噪音与环境音
- 飘雪氛围页
- 剧本状态恢复与首页记忆摘要联动
- 清洗剧本 / 最终剧本弹窗规格统一

## 后续可继续完善的方向

- 更严格的剧本 YAML Schema
- 更稳定的对白 / 旁白自动清洗规则
- 更细粒度的历史快照，而不只是最近一次 `script_state`
- PDF 导出
- 更强的笔记本管理能力（重命名、删除、版本回溯）

## 说明

本 README 描述的是当前工作区代码状态，而不只是早期主线的最小 Demo 状态。  
如果你正在 review 某个具体 PR，请以对应分支差异为准；如果你想快速上手运行项目，以本文件中的启动与接口说明为准。

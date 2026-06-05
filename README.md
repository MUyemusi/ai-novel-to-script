# AI 小说转剧本工具

## 项目简介

AI 小说转剧本工具是一个比赛 Demo 项目，面向小说作者，目标是将 3 个章节以上的小说文本逐步转换为结构化 YAML 剧本初稿。

当前项目仍保持 `src + tests + Streamlit Demo` 的基础结构，尚未进行前后端分离改造。

## 当前已完成功能

- 小说章节自动切分功能
- 基础 pytest 测试运行配置
- Streamlit Demo 入口页面

YAML 生成、Schema 校验、Word/PDF 导出、AI API 接入等功能属于后续计划，当前版本尚未实现。

## 技术栈

- Python
- Streamlit
- pytest

## 项目结构

- `app.py`：Streamlit Demo 入口
- `requirements.txt`：项目依赖
- `pytest.ini`：pytest 测试运行配置
- `src/`：核心 Python 模块
- `tests/`：单元测试
- `docs/`：设计文档与开发过程记录
- `examples/`：示例小说和示例输出
- `assets/`：静态资源目录

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

```bash
pip install -r requirements.txt
```

## 运行测试

在项目根目录执行：

```bash
python -m pytest
```

## 启动 Streamlit Demo

```bash
streamlit run app.py
```

## 文档位置

- YAML Schema 设计文档：`docs/yaml_schema_design.md`
- MVP Schema 说明：`docs/mvp_schema.md`
- 开发过程记录：`docs/process_log.md`

## PR 开发说明

本项目采用 PR 分阶段开发，每个 PR 只完成一个独立功能，确保持续迭代和可回溯的开发记录。

- PR 1：小说章节自动切分功能
- PR 2：虚拟环境搭建、依赖管理与 pytest 测试运行配置
- 后续 PR：根据比赛 Demo 需求继续补充转换、校验与页面整合能力

## 时间规范说明

本项目所有示例时间与生成时间统一采用中国北京时间，Asia/Shanghai，UTC+08:00。

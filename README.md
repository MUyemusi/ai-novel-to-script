# AI 小说转剧本工具

## 项目简介

AI 小说转剧本工具面向小说作者，旨在将 3 个章节以上的小说文本转换为结构化 YAML 剧本初稿。该工具帮助作者快速生成可编辑、可打磨的剧本基础内容，降低小说改编剧本的门槛。

## 核心功能规划

- 小说章节识别与切分
- 人物、地点、剧情事件提取
- 剧本幕结构与场景生成
- 动作描写和对白生成
- YAML 格式输出
- YAML Schema 校验
- 质量检查报告

## 技术栈

- Python
- Streamlit
- PyYAML
- jsonschema
- pytest

## 项目结构

- `app.py`：Streamlit 最小可运行页面入口
- `requirements.txt`：项目依赖
- `src/`：核心模块占位文件
- `docs/`：Schema 设计文档、MVP 说明、开发过程记录
- `examples/`：示例小说和示例输出 YAML
- `tests/`：测试占位文件
- `assets/`：静态资源目录

## 安装方式

```bash
pip install -r requirements.txt
```

## 启动方式

```bash
streamlit run app.py
```

## 文档位置

- YAML Schema 设计文档：`docs/yaml_schema_design.md`
- MVP Schema 说明：`docs/mvp_schema.md`

## Demo 视频链接

待补充

## 第三方依赖说明

- `streamlit`：用于构建交互式 Web 应用界面
- `pyyaml`：用于 YAML 序列化与反序列化
- `jsonschema`：用于后续实现 YAML Schema 校验规则
- `pytest`：用于测试占位和未来功能验证

## 原创功能说明

本项目的原创部分包括：章节解析逻辑、剧本 YAML 结构设计、小说转剧本提示词、YAML 校验规则和交互式 Demo 页面。

## 开发过程说明

本项目采用 PR 分阶段开发，每个 PR 只完成一个独立功能，确保持续迭代和可回溯的开发记录。

## 时间规范说明

本项目所有示例时间与生成时间统一采用中国北京时间，Asia/Shanghai，UTC+08:00。
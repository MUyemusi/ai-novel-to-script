# MVP 剧本 YAML Schema 说明

说明：三天 Demo 阶段不实现完整 Schema，只实现核心字段，避免功能过重。完整 Schema 保留在 `docs/yaml_schema_design.md`，MVP Schema 用于第一版 Demo 的实际输出和校验。

## MVP Schema 字段

- `screenplay`:
  - `meta`:
    - `title`
    - `genre`
    - `adapted_from`
    - `chapter_range`
    - `total_chapters`
    - `total_scenes`
    - `version`
    - `created_at`
  - `adaptation_settings`:
    - `script_type`
    - `strategy`
  - `source_novel`:
    - `chapters`
  - `characters`
  - `acts`:
    - `act_number`
    - `title`
    - `scenes`:
      - `scene_number`
      - `title`
      - `location`
      - `time`
      - `source`
      - `characters_present`
      - `action`
      - `dialogues`
  - `quality_report`:
    - `coverage`
    - `warnings`

## 说明

- 完整 Schema 作为正式设计文档保留在 `docs/yaml_schema_design.md`
- MVP Schema 用于第一版 Demo 实现，聚焦核心字段
- 后续版本再逐步扩展 `locations`、`notes`、`dramatic_function`、`risk_flags` 等字段
- 所有时间字段统一使用中国北京时间 UTC+08:00

## 设计意图

MVP Schema 旨在满足最小可用产品需求，提供基本的剧本结构与改编报告。核心目标是让第一版 Demo 能够输出结构化 YAML，并为后续功能扩展留出明确扩展空间。

## 实现范围

- 仅输出 `screenplay` 根节点下的核心字段
- 支持 `meta` 和 `adaptation_settings` 的基础元信息
- 支持 `source_novel.chapters` 的章节来源记录
- 支持 `characters` 列表的基本人物信息
- 支持 `acts` / `scenes` 的最小剧情结构
- 支持 `quality_report` 的覆盖说明与警告提示

## 后续扩展建议

- 引入 `locations` 作为独立对象列表
- 支持 `notes` 用于创作说明与改编建议
- 增加 `dramatic_function` 和 `risk_flags` 来提升剧本分析能力
- 在 `quality_report` 中加入 `covered_chapters` 和 `missing_chapters` 等字段，增强覆盖评估

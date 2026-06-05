# 小说改编剧本 YAML Schema 设计文档

## 文档背景

本文档《小说改编剧本 YAML Schema 定义文档》，整理为项目正式 Schema 设计文档，结合“AI 小说转剧本工具”Demo 的实际需求进行了规范化调整。文档旨在说明剧本 YAML 的字段结构和设计原因，为后续实现提供标准参考。

## 设计目标

- 支持小说文本到剧本结构化输出
- 兼顾小说改编的可读性与后续编辑灵活性
- 提供清晰的元数据、角色、地点、场景和对白结构
- 便于后续实现 YAML 校验与质量检查
- 统一使用中国北京时间：Asia/Shanghai，UTC+08:00

## Schema 总览

根节点为 `screenplay`，包含 `meta`、`adaptation_settings`、`source_novel`、`characters`、`locations`、`acts`、`notes`、`quality_report` 等部分。

## screenplay 根节点说明

`screenplay` 是整个 YAML 的顶层对象，负责组织剧本的整体结构。它将小说信息、改编配置、角色、地点、幕与场景、质量报告等统一放入同一个根对象下，便于读取与校验。

## meta 字段说明与设计原因

- `title`：剧本标题，便于识别与保存。
- `genre`：类型说明，如悬疑短剧，帮助定义输出风格。
- `adapted_from`：原著名称，用于记录改编来源。
- `chapter_range`：改编章节范围，便于追踪小说来源。
- `total_chapters`：原著章节总数，用于验证改编完整性。
- `total_scenes`：生成场景数量，为质量评估提供参考。
- `version`：Schema 版本，支持后续版本演进。
- `created_at`：生成时间，统一使用 `2026-06-05T10:00:00+08:00` 格式，确保所有时间字段一致。

设计原因：通过 `meta` 提供基本上下文信息，可用于文档管理、结果对比和前端展示。

## adaptation_settings 字段说明与设计原因

- `script_type`：剧本类型，比如“悬疑短剧”。
- `strategy`：改编策略说明，例如“保留关键线索、聚焦人物冲突”。

设计原因：明确改编目标与策略，有助于后续 AI/规则引擎生成更符合预期的剧本结构。

## source_novel 字段说明与设计原因

- `chapters`：列出原著章节标题及简要说明。

设计原因：保留源小说章节结构，便于追溯改编来源和分段依据。

## characters 字段说明与设计原因

- `name`：角色名称。
- `role`：角色类型，如主角、配角。
- `description`：角色定位、性格或关系说明。

设计原因：明确人物设定，便于生成对白与行动线索，避免角色混淆。

## locations 字段说明与设计原因

- `name`：地点名称。
- `description`：地点描述，用于场景设置。

设计原因：在剧本中定义地点对象，有助于统一场景标识与舞台说明。

## acts 字段说明与设计原因

- `act_number`：幕编号。
- `title`：幕标题。
- `description`：幕概要。
- `scenes`：所属场景列表。

设计原因：采用幕结构便于分阶段组织剧情，提高剧本层次感。

## scenes 字段说明与设计原因

- `scene_number`：场景编号。
- `title`：场景标题。
- `location`：发生地点。
- `time`：场景时间，如“夜晚”。
- `source`：对应原小说章节或段落说明。
- `characters_present`：出场人物列表。
- `action`：场景动作描述。
- `dialogues`：对白列表。

设计原因：场景是剧本核心单位，结构化数据便于编辑、拆分和后续演绎。

## dialogues 字段说明与设计原因

- `speaker`：发言角色。
- `text`：对白内容。
- `tone`：对白语气或情绪提示（可选）。

设计原因：对白是剧本表现力的重要部分，结构化对白方便后续排版、润色与角色区分。

## notes 字段说明与设计原因

- `type`：注释类型，如 `story_note`、`adaptation_note`。
- `content`：具体说明。

设计原因：为额外说明、创作建议和改编提示提供专门字段，避免影响剧本文本主体。

## quality_report 字段说明与设计原因

- `coverage`：改编覆盖率说明。
- `warnings`：可能的风险或遗漏提示。
- `covered_chapters`：已覆盖章节编号。
- `missing_chapters`：未覆盖章节编号。

设计原因：质量报告帮助用户评估输出结果的完整性，并为后续手动修正提供参考。

## 完整 YAML 示例

```yaml
screenplay:
  meta:
    title: "雨夜来信"
    genre: "悬疑短剧"
    adapted_from: "雨夜来信"
    chapter_range: "第1章-第3章"
    total_chapters: 3
    total_scenes: 3
    version: "v1.1"
    created_at: "2026-06-05T10:00:00+08:00"
  adaptation_settings:
    script_type: "悬疑短剧"
    strategy: "保留核心线索，重点呈现人物冲突与悬念"
  source_novel:
    chapters:
      - "第1章 雨夜来信"
      - "第2章 南桥仓库"
      - "第3章 真相浮现"
  characters:
    - name: "林舟"
      role: "主角"
      description: "旧书店老板，沉稳且敏感。"
    - name: "沈月"
      role: "女主角"
      description: "来访者，带着神秘信件。"
    - name: "陈默"
      role: "关键证人"
      description: "南桥仓库看守，心中藏有秘密。"
  locations:
    - name: "旧书店"
      description: "昏黄灯光下的旧书店，充满灰尘与往事。"
    - name: "南桥仓库"
      description: "阴冷潮湿的仓库，堆满旧箱子。"
    - name: "街角"
      description: "雨夜中孤独的街角，路灯闪烁。"
  acts:
    - act_number: 1
      title: "引子"
      description: "雨夜信件揭示悬疑起点。"
      scenes:
        - scene_number: 1
          title: "旧书店的访客"
          location: "旧书店"
          time: "夜晚"
          source: "第1章"
          characters_present: ["林舟", "沈月"]
          action: "沈月带着湿漉漉的信来到旧书店，林舟好奇地接过。"
          dialogues:
            - speaker: "沈月"
              text: "这封信是谁寄来的？"
            - speaker: "林舟"
              text: "这是雨夜来的信，让人难以放心。"
    - act_number: 2
      title: "调查"
      description: "探查南桥仓库，线索逐渐明朗。"
      scenes:
        - scene_number: 2
          title: "南桥仓库的隐秘"
          location: "南桥仓库"
          time: "夜晚"
          source: "第2章"
          characters_present: ["林舟", "陈默"]
          action: "林舟与陈默在仓库见面，寻找信件线索。"
          dialogues:
            - speaker: "陈默"
              text: "这里的箱子里藏着你想知道的答案。"
            - speaker: "林舟"
              text: "为什么你要把真相藏在这里？"
    - act_number: 3
      title: "真相"
      description: "揭开雨夜来信背后的秘密。"
      scenes:
        - scene_number: 3
          title: "街角对峙"
          location: "街角"
          time: "夜晚"
          source: "第3章"
          characters_present: ["林舟", "沈月", "陈默"]
          action: "三人在街角对峙，真相渐渐浮现。"
          dialogues:
            - speaker: "沈月"
              text: "这封信不是偶然的，它指向一个秘密。"
            - speaker: "陈默"
              text: "我只是想保护你们。"
  notes:
    - type: "adaptation_note"
      content: "第一版重点生成场景与核心对白，后续可以补充更多情感细节。"
  quality_report:
    coverage: "已覆盖第1-3章核心剧情，部分细节需人工补充。"
    warnings:
      - "场景之间的节奏需根据剧本节拍调整。"
    covered_chapters: [1, 2, 3]
    missing_chapters: []
```

## 字段必填规则

- `screenplay`：必填根节点
- `meta.title`、`meta.genre`、`meta.adapted_from`、`meta.version`、`meta.created_at`：必填
- `adaptation_settings.script_type`、`adaptation_settings.strategy`：必填
- `source_novel.chapters`：必填
- `characters`：建议至少包含主要角色
- `acts` 与 `acts.scenes`：至少一幕、一场
- `scenes.scene_number`、`scenes.title`、`scenes.location`、`scenes.action`、`scenes.dialogues`：必填
- `quality_report.coverage`：必填

设计原因：必填规则确保输出具备最小可用结构，便于后续自动校验与用户预览。

## 与主流格式对比

与传统剧本格式相比，本 Schema 更强调结构化数据而非纯文本排版。通过 YAML 表达，可更容易实现自动校验、版本控制和后续生成。相比于电影剧本标准，本 Schema 专注于小说改编的章节来源、人物关系和改编质量评估。

## Schema 演化建议

- 后续可扩展 `dramatic_function`、`risk_flags`、`scene_tension`、`character_arc` 等字段
- 可增加 `timeline` 字段，支持更精细的时间线管理
- 可将 `locations` 扩展为带 `props`、`lighting`、`mood` 的对象
- 逐步加入 `notes` 的多种类型，支持创作提示、分镜建议、节奏提示等

## 设计原则总结

- 保持结构化：让机器与人都能理解
- 兼顾可编辑性：输出结果应便于后续人工修正
- 分层清晰：元数据、改编设置、原著来源、角色、场景、质量报告各自独立
- 统一时间规范：所有时间字段统一使用 Asia/Shanghai，UTC+08:00

## MVP 实现建议

本项目初始版本不需要实现完整 Schema 的全部字段，而应优先支持核心字段，减少功能复杂度。完整 Schema 作为正式设计文档保留，MVP Schema 用于第一版 Demo 的实际输出和校验。

- `screenplay`：根节点
- `meta`：核心元数据
- `adaptation_settings`：脚本类型与策略
- `source_novel.chapters`：来源章节
- `characters`：基础人物列表
- `acts`、`scenes`：最低可用幕场结构
- `quality_report`：改编覆盖与警示

所有时间字段统一使用中国北京时间 UTC+08:00。
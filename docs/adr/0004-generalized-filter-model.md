# ADR-0004：通用过滤模型（PHASES + name+source）

- 状态：已采纳（2026-11-08）

## 决策
1. 三阶段只由 `model.js` 的 `PHASES` 描述表定义；字段名、状态映射、工具字段全部派生，禁止三处手写。
2. 段/工具/运行时上下文的身份统一为 `{name, source}`；`source` 是注册层（global / preset(id) / agent(session) / executor / workspace），宿主能提供 provider 时再附带。
3. 配置名单存结构化条目；旧 name-only 名单忽略。
4. 预设级 = 所选预设逐阶段真实装配 + 同预设活动 agent 的 agent 作用域真实装配（2.1.0 / ADR-0005）；工作区级已于 2.0.0 移除。

> **2.1.0 修订（ADR-0005）**：决策 4 的「通用会话项」口径已改为「**同预设活动 agent** 的真实装配条目」——只有编辑目标所属预设的活动 agent 的会话级段 / 上下文才并入清单与预览，切到别的预设不混入；工作区级已在 2.0.0 移除。本 ADR 的其余决策（三阶段唯一描述表、`{name, source}` 身份、旧 name-only 名单忽略、`replacements` 阶段化）全部保留。
5. `replace` 改为阶段化 `replacements`（只替换已存在段）。

## 后果
- 旧配置不兼容，直接丢弃（ADR-0003）。
- 宿主不暴露段/上下文的 provider；来源只能按 global/预设/agent 装配差异推导为“注册层”。
- 同名不同源可分行显示与独立操作。

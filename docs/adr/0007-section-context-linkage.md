# ADR-0007：同名段屏蔽联动运行时上下文

- 状态：已采纳（2026-11-14）
- 版本：2.2.2 之后的行为修复
- 依赖：ADR-0002（`{name, source}` 身份）、ADR-0004（阶段化名单）、ADR-0006（运行时上下文显隐）

## 背景

`harness:source`、`app:web-surface` 这类贡献会同时注册两件东西：

- 一个 `PromptSection`：给模型的指引文本；
- 一个同名 `PromptContext`：`Current DeepSeek Harness implementation checkout: ...` / `Current DeepSeek Harness Web GUI URL: ...` 的运行时值快照。

插件原有模型把两者当成两套独立名单：`sections*` 控制段，`contexts*` 控制运行时上下文。实际使用中，用户只在 `sections` 里屏蔽了同名段（`ops-ptc` / 标准模式都有这种配置），运行时值仍然进入请求；另有一个预览侧缺陷：`buildPreview` 直接读 `previewSource.contexts` 时，base 装配的上下文没有 `source`，`matchesAny` 按 `{name, source}` 身份永远命中不了。

这不是“运行时过滤失效”：`systemPrompt.assemble()` 的瀑布流和 `refreshContext()` 在拿到明确 `contexts` 名单后都能正确过滤；缺陷是段与上下文没有按同一身份联动。

## 决策

- **D1 同名同源联动**：计算生效上下文屏蔽名单时，除显式 `contexts*` 名单外，还合并 `sections*` 名单中与某个运行时上下文 `{name, source}` 完全相同的条目。
- **D2 运行时 / 预览 / 清单同源**：联动规则同时用于 `system-prompt/assemble` 瀑布流、`/preview` 的 `contexts`、`/inventory` 的 `contexts.active`；不做三套判断。
- **D3 同名不同源不联动**：`entryMatches` 已要求 source 相同；`harness:source` 的 global 段不会误伤 preset/agent 来源的同名上下文。
- **D4 显式 contexts 名单仍独立生效**：用户可以继续只隐藏某个上下文而不隐藏其段；联动只是追加，不覆盖显式名单。
- **D5 预览 source 补齐**：base 装配的上下文按同一 scope 来源补 `source` 后再过滤，避免因身份缺失导致预览显示“仍存在”。

## 后果

- 现有 `ptc` / `ops-ptc` / 标准配置中只写了 `sections` 的预设，无需迁移即可让同名上下文停止注入。
- 用户若想“保留值、隐藏指引”，需要同时去掉该 `{name, source}` 的段屏蔽；这是联动口径的代价。
- 段与上下文不再完全独立，但同名不同源仍按 ADR-0002 分列、互不影响。

## 验证

- 新增 `test/section-context-link.test.mjs`：
  - 段屏蔽后 `/preview.contexts` 与真实 `systemPrompt.assemble` 都不含同名上下文；
  - `baseContexts.blocked` 为 true；
  - preset 来源的段屏蔽不误伤 global 上下文；
  - 显式 `contexts` 屏蔽仍独立生效。
- 反例：删除 `withLinkedContextDenials()` 的联动调用后，第一、第三组断言必须失败。

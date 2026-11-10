# ADR-0005：全域系统提示词接管（会话级段纳入可编辑清单）

- 状态：已采纳（2026-11-09）
- 版本：2.1.0
- 修订：ADR-0001 的「清单只来自当前预设真实装配」口径；`docs/design/prompt-control-consensus.md` 的 D1 / D3 / D4 预览口径
- 依赖：ADR-0002（名字 + 来源）、ADR-0004（PHASES + `{name, source}` 通用过滤模型）、2.0.13 运行时契约（agent 来源按 kind 跨会话匹配）

## 背景

### 宿主契约（事实，不是本插件的选择）

- `ctx.systemPrompt.section(section)` / `context(context)` 把内容注册在**调用方的 scope**：「Register an ordered prompt section in the calling context's scope. A scoped section shadows a global section with the same name」（`deepseek-harness/docs/subsystems/system-prompt.md`）。
- `PromptSection` / `PromptContext` 的字段只有 `name`、`order`、`text`（静态串或每次装配求值的 provider）、`interpolate`、`complete` / `required`；**没有 `source` / `provider` / `phase`**。宿主不把「这段是哪个插件注册的」暴露给 waterfall 消费方。
- `system-prompt/assemble` 瀑布流从 0.2.1-rc.2 起只携带 `sections` / `contexts` / `variables`（`PromptPresentation`），「tool declarations remain provider-owned」；工具 `description` 走 `GenerateOptions.tools`，不是系统提示词 token。
- `systemPrompt.layers` 是单向作用域链（`global` / `peek(scope)` / `chainLayers(scope)` / `merge(scope, ...)`），**没有「列出所有已注册作用域」的 API**。

### 缺陷（2.0.22 现状）

工具插件可以在 `agent/created` 里用 `agent.ctx.systemPrompt.section()` 把指引注册到 **agent 自有作用域**。实测 `dsh-hashline-edit@0.2.0` 就在 `dsh/index.ts` 的 `installAgentTools` 里注册了三段动态 `text` provider 的命名段：`tool:read`(1100) / `tool:apply_patch`(1350) / `tool:undo_last_edit`(1360)，前两段还遮蔽宿主的全局同名段。

2.0.22 的 `/api/prompt-customizer/inventory` 与 `/preview` 走 `buildPreview`，只跑**纯预设 scope** 装配，并且把 live 段写成空数组：

```js
mergeAgentScopedSections(baseView.sections ?? [], [], previewDenied, previewReplacements, sectionOrder)
```

这是 ADR-0001 删除累积池后为「预设隔离」做的取舍，`test/runtime-catalog.test.mjs`、`test/source-model.test.mjs` 还把它钉成了断言（后者直接用 `tool:undo_last_edit` 当 agent-only 段的例子）。后果：

1. 只在该 agent 作用域注册的段（如 `tool:undo_last_edit`）在**可编辑清单里根本不存在**；只读 `/session` 才列得出来，而客户端从不请求它。
2. 同名段（`tool:read` / `tool:apply_patch`）清单里显示的是宿主 global/preset 的原文，不是插件文本。
3. 即使勾了屏蔽：UI 写 `{name, source:{kind:'global'|'preset'}}`，运行时该段被 `sourceForEntry` 标成 `{kind:'agent', id:<sessionId>}`；`model.js:entryMatches` 要求 `sourceKey` 相等，只对 `agent ↔ agent` 按 kind 放行 —— **名单命不中，模型照样收到插件的指引**。
4. 工具 schema 的 `description` 是另一条独立通道，段级隐藏原则上看不见；禁用整工具也不会删掉这三段（两条注册互相独立）。

结论：2.0.22 **不能**捕获并隐藏这类插件的提示词。这不是运行时过滤能力缺失——`applySectionPolicy` 对带 agent 来源的段同样按 `{name, source}` 过滤，`forceSections` 包装也会把过滤结果覆盖回最终 `sections`——缺的只是「UI 发现 / 枚举」这一环。

## 目标 / 非目标

**目标**

- 只要贡献者把内容注入系统提示词（global / preset / agent / executor 任意作用域、静态串或动态 provider、首次运行或插件后注册），就要能在**预设编辑面板**里被枚举，并屏蔽 / 替换 / 注入 / 排序。
- 屏蔽后，真实会话装配里该段确实消失（最终 `system/message` 正文不含它），达到对每一个系统提示词 token 的精确掌控。
- 泛例：按契约对任意注册项求解，不硬编码段名、不认插件名（延续 ADR-0004 / 2.0.2 / 2.0.9 / 2.0.13 的方向）。

**非目标**

- 不接管工具 schema 的 `description` / 参数 JSON Schema：它们走 `GenerateOptions.tools`，不是系统提示词 token；本插件仍只做「工具显隐」，不做签名编辑。
- 不接管不并入系统提示词的 user-role 消息、工具结果、LLM 请求体里另加的文本。
- 不提供「无活动会话时枚举 agent 作用域段」——宿主没有这个 API，插件必须自己把段注册在预设 / 全局层才能无会话也可控。
- 不改动工具目录 / `tools.restrict` / 遮蔽池链路（2.0.5–2.0.18 的回归约束），不恢复跨预设累积池。

## 决策

- **D1 双数据源**：`buildPreview` 在「编辑目标 == 同预设活动 agent」时，额外跑一次该 agent 自己 scope 的真实装配（`collectLivePromptView`）。复用同一份 `hint`（含 `promptCustomizerPatch` 草稿、名义阶段、`promptCustomizerPreset` / `PromptScope`），只覆盖 `scope` / `agent`，保证两份装配走同一份生效配置、同一阶段、同一草稿。一次 `promptCustomizerBase: true` 装配同时给出预过滤清单（`promptCustomizerBaseView`）与过滤后的正文（`sections`）。
- **D2 清单 = 预设 base ∪ agent base**：经 `mergePromptEntries` 按 `{name, source}` 去重，agent 视图优先；同名不同源**分两行**（ADR-0002），由 `mergeAgentScopedSections` 装饰 `blocked` / `replaced` 并给 agent 来源打 `scope: 'agent'`（客户端「会话级」徽标）。`sectionOrder` 取「预设作用域链 ∪ 同预设 agent 作用域链」，否则 agent 段的规范 order 取不到会被排到清单尾部。
- **D3 预览正文同源**：有 live 视图时，`sections` / `text` / `contexts` / `emitted` / `takenOverBy` 都取自 agent 真实装配（过滤后），右栏显示的就是模型此刻真正看到的系统提示词；`baseSections` / `baseContexts` 取两份 base 视图的并集。无活动会话时整体退回纯预设装配。
- **D4 身份稳定化**：运行时 `sourceForEntry` 给 agent 来源带 session id，但配置按预设存、必须跨会话命中。`stableSourceOf` 把**清单与预览里**的 agent 来源统一收敛成 `{ kind: 'agent' }`（不带 id）；`entryMatches` 已对 `agent ↔ agent` 按 kind 匹配（2.0.13），所以 UI 写入的名单、草稿 `entryKey`、运行时候选三者身份一致且跨会话稳定。
- **D5 隔离不破**：只用 `liveAgentForPreset(ctx, 编辑预设 id)`，绝不拿 `latestRootAgent` 顶替；编辑 A 预设不会混入 B 预设会话的会话级段。`latestRootAgent` 仍只用于工具 catalog 与无会话兜底。
- **D6 工具数据源分离**：`finalTools` / `buildToolUnion` / `catalogTools` 仍按纯预设装配计算；提示词与工具两条链路互不干扰，避免推翻 2.0.x 的工具目录回归约束。

> **2.1.2 修订**：D6 的「右栏工具目录按纯预设装配」已被证明是错的——宿主真实会话装配的 `scope` 是 live Agent 自身（[2.1.2 升级记录](../upgrades/2.1.2-tool-catalog-scope.md)），预设装配只显示预设层工具（实测 38 vs 真实 50）。右栏 `tools` / `registryTools` / `registryTotal` 已改为 `ctx.tools.schemas(agent)` 与 `/session` 同源；`buildToolUnion` / `tools.restrict` / 阶段过滤 / 遮蔽池结构仍不变，D6 的「不动工具目录回归约束」这部分继续成立。
- **D7 失败回退**：agent 装配抛错时 `warnOnce` 并退回纯预设装配，绝不因可选视图让 `/inventory` / `/preview` 500。
- **D8 `/session` 定位**：`/session`（`buildSessionPreview`）与 `buildPreview` 的 live 视图是**两条并列的真实装配入口**——前者回答「模型此刻真正看到什么」（只读），后者是编辑目标预设的清单 / 预览数据源。两者都把 agent 来源稳定化为 `{kind:'agent'}`。

## 行为规格

| 场景 | 行为 |
|---|---|
| 有同预设活动 agent | 清单列出预设段 + 该 agent 作用域段；agent 段带 `source:{kind:'agent'}` 与「会话级」徽标；右栏预览 = 该 agent 真实装配的系统提示词正文 |
| 同名不同源 | 分两行（宿主 global 行 + 插件 agent 行），各自独立屏蔽 / 替换 / 排序 |
| 屏蔽一个 agent 段 | 配置写 `overrides[preset].sections = [{name, source:{kind:'agent'}}]` → `applySectionPolicy` 在装配瀑布流里过滤 → `forceSections` 包装覆盖回最终 `sections` → 真实会话 / `/session` 的 `sections` 与 `text` 都不含它 |
| 切到别的预设 | 不混入其它预设会话的会话级段（纯预设列表） |
| 无活动会话 / agent 装配失败 | 退回纯预设装配；此时只能控制预设 / 全局层注册的段 |
| 三阶段 | 三份名单互不继承；`buildPreview` 的名义阶段同时作用于两份装配，草稿 patch 也同时叠加 |
| 工具 description | 不在段清单里，不单独隐藏；只能整工具显隐（既有能力） |
| `forceSections: false` + `complete:true` | 宿主整段接管会压制段级定制（既有已知限制，不因本 ADR 改变） |

## 影响模块

- `vendor/prompt-customizer/index.js`：`stableSourceOf` / `mergePromptEntries` / `collectLivePromptView`（新增）；`buildPreview`（D1–D6）、`buildInventory`（清单注释）、`buildSessionPreview`（D8 身份稳定化）、路由与文件头注释。
- `src/client/`：零逻辑改动——`SectionsPane` 已有「会话级」徽标与 `agentScopedHint`，`phase-ops.ts:phaseRows` 会把 `baseSections` ∩ `sections` 的行渲染成可交互行。
- `src/client/prompt/locales.ts`：`agentScopedHint` 文案随本 ADR 更新（「预览装配看不到它」不再成立）。
- 测试：`test/runtime-catalog.test.mjs`、`test/source-model.test.mjs` 反转旧断言并新增「枚举 → 屏蔽 → 真实装配消失」组合用例。
- 文档：本 ADR、`docs/design/prompt-control-consensus.md`、`docs/guide.md`、`docs/upgrades/README.md` + `2.1.0-*.md`、`README.md`、`GLOSSARY.md`、`docs/testing/feature-matrix.md`。

## 已知限制

1. **无活动会话**：宿主没有枚举任意作用域的 API，插件在 `agent/created` 注册的段只能等会话存在后才可枚举。这是宿主契约边界，不是可实现而暂未实现的缺口。
2. **宿主 `layers` 缺席**：`sourceForEntry` 退化为按名字差异近似推导，配置里带 source 而候选 source 为 `undefined` 或不同 kind 时不命中（ADR-0004:14 的既有代价）。
3. **动态 `text` provider**：清单 / 预览用宿主已求值的文本，不二次调用 provider（避免 `forceSections` 重复执行）；替换 / 注入会冻结动态文本（guide 已知限制）。
4. **contexts 口径**：`PromptContext` 在宿主里是 user-role 快照，本插件按「并入系统提示词的可控部分」处理（设计共识 D7）；预览的 contexts 仍按 `previewContextsDenied` 手动过滤。
5. **工具 description 通道未纳入**：若日后要「保留工具但隐藏说明」，需新接缝改写 `result.tools[].description` 或接管 `systemPrompt.tools(provider)`，并重新评估模型调用契约；本次明确不做。

## 验证与反例

- **反例（会让本 ADR 的实现判定为失败）**：把 `buildPreview` 里 `liveBase.sections` 换回空数组，或把 `stableSourceOf` 改成返回原始带 id 的 agent source，新增用例必须失败。
- 必测组合：① 同预设活动 agent 的会话级段出现在 `/inventory.sections` 且 `source.kind === 'agent'` / `scope === 'agent'`；② 同名不同源分两行；③ 对 agent 段写入带 `{kind:'agent'}` 的屏蔽名单后，`/preview.text` 与 `/session.sections` 都不含它，撤销后恢复；④ 换一个不同名字 / 不同插件的 agent 段同样可枚举（证明不是样例特判）；⑤ 切到别的预设不串台；⑥ 无活 agent 时退回纯预设且不抛错；⑦ 工具目录的行数 / 状态与变更前一致（证明 D6）。

## 与既有 ADR 的关系

- **ADR-0001**：删除累积池 / 手动重扫、预设隔离、动态枚举，全部保留；仅把「清单只来自**当前预设**真实装配」修订为「当前预设 **+ 同预设活动 agent** 的真实装配」。代价（不再保留跨预设历史条目）不变。
- **ADR-0002 / ADR-0004**：身份 `{name, source}`、同名不同源分列、PHASES 唯一表、不按名字硬编码——本次全部沿用，正是靠它们才能泛化。
- **2.0.13 运行时契约**：agent 来源按 `source.kind` 跨会话匹配，是 D4 能成立的前提。

## 备选

- 恢复「跨预设累积池 + 手动重扫」来凑齐全量：会把别的预设串进当前预设、池子只增不减、清单不再等于真实装配 → 否（ADR-0001 已否）。
- 让插件改在全局 / 预设层注册段：需要改所有第三方插件，不属本插件职责 → 否。
- 把整个 `buildPreview` 的 scope 直接换成 agent：会连带改变 `sourceForTool` 与 `result.tools` 过滤，推翻 2.0.5–2.0.18 的工具目录回归约束 → 否（改选 D6 双数据源分离）。
- 按固定段名清单（`tool:*`）特判捕获：只对当前样例成立，换插件 / 换段名即失效 → 否（违反 ADR-0004:31 与「修的是类，不是样例」）。

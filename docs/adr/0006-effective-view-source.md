# ADR-0006：面板 = 请求真值（生效视图同源）

- 状态：已采纳（2026-11-11）
- 版本：2.2.0
- 修订：ADR-0005 D6「工具目录按纯预设 scope 独立算」的数据源；2.0.15 的「base 行 + masked 行」双行设计
- 依赖：ADR-0002（名字 + 来源）、ADR-0004（PHASES + `{name, source}`）、2.1.1（同名遮蔽探测）、2.1.2（工具目录与真实会话同源）

## 背景

### 2.0.x 的取舍：工具目录按预设 scope 独立算

`vendor/prompt-customizer/index.js:1779-1782` 把这条取舍写成了代码约定：

```js
 * 工具目录刻意不走这里：2.0.x 的工具目录 / restrict / 遮蔽池按预设 scope 独立算，
 * 混入 agent scope 会推翻那一组回归约束；提示词与工具两条数据源保持分离。
```

来由：2.0.5–2.0.18 的一串回归（阶段工具目录、`tools.restrict`、遮蔽池行稳定性）都建立在「预设 scope 装配 + 注册表补扫」上；ADR-0005 D6 又把它固化成「提示词走 agent 真实装配、工具走纯预设装配」。2.1.2 只修了右栏**可见目录**（改用 `ctx.tools.schemas(agent)`），左栏主列表与只读池仍是预设 scope 的产物。

### 2.0.15 的双行设计

为了让「已遮蔽」池不空，2.0.15 让同一批工具用两种行同时返回：base 的 `hidden` / `controllable` 行供阶段反选，masked 行供只读池解释，两者按 `state` / `keySuffix` 区分 —— 同一工具因此在数据里同时带着「可勾选」与「已遮蔽」两种身份。

### 缺陷：面板显示 ≠ 真实请求

两个设计叠加的结果：**同一行在面板里可勾选，在真实请求里却根本不可见（或相反）**，而且面板没有任何一处说明「这一项的可见性不由本插件决定」。

实例（dsh-ops）：预设开启「隐藏宿主 PowerShell」后，宿主在 agent 作用域用 `tools.restrict` 把 `pwsh` 从模型目录里裁掉；面板主列表仍显示 `pwsh` 且可勾选 —— 勾不勾都不改变请求（`restrict` 只收窄、不可反向），取消勾选只是往阶段 `exclude` 里写一条永远不命中的条目。「面板能勾选」被当成了「本插件能控制」。

同类错位还有三处：

1. 本插件阶段 `exclude` 隐藏的工具有自己的行，却和「外部裁掉」的项混在同一个只读池里，两者的可逆性完全不同；
2. PTC / code-mode 预设把整套工具声明折叠成单个 `run_code`，面板把折叠显示成「工具都不见了」，既没说是折叠、也没说程序绑定里还能用；
3. 无活动会话时照常给「生效 / 不可见」判定，但此刻采不到 agent 作用域，外部可见性无从得知。

## 目标 / 非目标

**目标**

- 主列表每一行都要回答「可见性由谁决定、我能不能改」，且与真实请求一致。
- 不可控项显式落只读池，并注明依据（外部不可见 / 同名被覆盖 / PTC 折叠 / 本插件遮蔽）。
- 无活动会话时明说「未知」，不伪装成真值。

**非目标**

- 不引入跨插件归因：宿主不暴露「这一项是谁遮挡的」，面板也不点名插件。
- 不改过滤执行链路：`tools.restrict` / 阶段 `exclude` / `add` / 装配后过滤 `assembly.tools` / `tools/pre-execute` 一律不动（与 2.1.1 / 2.1.2 的「不改执行」一致）。
- 不把 PTC 折叠推广到提示词域。
- 不恢复任何累积池 / 跨预设枚举。

## 决策

- **D1 同源真值**：工具的主列表与只读池状态改由宿主 **agent 作用域同源视图**判定，不再来自纯预设 scope 装配。有同预设活动会话时取该 agent 的注册视图（2.1.2 已为右栏建立的 `ctx.tools.schemas(agent)` 主源）；无活动会话时显式降级并标「未知」。
- **D2 三层身份采样**：判定每一行时同时采三层定义（global / preset / agent），按**定义引用比对**确定身份 —— 引用相等 = 同一注册，引用不同或单侧缺失 = 同名不同源。采样结果作为 `layer`（`global` / `preset` / `agent` / `executor`）随行返回，只描述「这一行注册在哪一层」，不声称「谁遮蔽了它」。
- **D3 主列表 = 可编辑真值**：主列表（可编辑）= `state ∈ {controllable, locked-agent, locked-executor}`。其中 `controllable` 且 `hidden === true` 的行显示「本插件遮蔽」徽标、**留在原位**且可反选 —— 它由本插件自己的名单决定，位置不能挪出主列表。
- **D4 只读池分两组**：
  - **可反选组** = `masked-own`（本插件造成的遮蔽，可在池内直接反选恢复）；
  - **不可反选组** = `masked-plugin`（外部不可见）、`masked-shadow`（同名被覆盖，带 `shadowedBy` 指向顶掉它的那一行）、`masked-ptc`（PTC 折叠，程序绑定内可用）。
- **D5 不可反选项只读**：不可反选组不给勾选框、不写阶段名单 —— 写进去的条目永远不会命中，那是「假装能控制」。
- **D6 PTC 折叠显式建模**：整套工具声明被折叠成单个 `run_code` 时，`/preview` 返回 `truth.ptcCollapsed: true`，被折叠的行标 `state: 'masked-ptc'` 且 `ptcCollapsed: true`，进不可反选组（提示「程序绑定内可用」）。折叠只作用于**工具域的工具声明**，不作用于提示词域 —— 段清单 / 段预览 / `tool:*` 段照常按真实装配枚举，不因折叠消失。
- **D7 无活动会话显式降级**：采不到 agent 作用域时 `truth.linked === false`、`truth.source === 'preset'`，面板给「未链接会话，外部可见性未知」横幅；主列表退化为预设 scope 视图（预设层能控制的项仍可编辑），只读池只列得到证的项，不编造「外部不可见」。
- **D8 不引入跨插件归因契约**：宿主没有公开的归因 API，不可反选组统一用「外部不可见」这一定性，不猜插件名、不造假来源。要归因得等宿主提供 API，本 ADR 不做。
- **D9 提示词域同源 + 来源池**：`/preview` 同时返回 `sectionPool`（段的三层来源池，含 `shadowedBy`），保证同名多来源在提示词域可枚举；段主列表口径不变（ADR-0005 D2 的 `{name, source}` 去重与同名分列）。

## 数据契约

工具行（`tools` / `baseTools` / `catalogTools`）新增：

- `state` 新增取值 `'masked-ptc'`；
- `layer?: 'global' | 'preset' | 'agent' | 'executor'`；
- `ptcCollapsed?: true`；
- 既有字段保留：`hidden` / `scope` / `maskedByPlugin` / `maskedByOwnPlugin` / `maskedByShadow` / `shadowedBy` / `keySuffix` / `promptSections`。

`/preview` 新增：

- `truth: { linked: boolean, source: 'agent' | 'preset', agentId?: string, ptcCollapsed: boolean }`
- `sectionPool: Array<{ name: string, source?: EntrySource, layer: 'global' | 'preset' | 'agent', shadowedBy?: { name: string, source?: EntrySource } }>`

## 行为规格

| 场景 | 行为 |
|---|---|
| 有同预设活动会话 | 主列表 = agent 作用域同源视图里的可控制项；`truth.linked === true`、`source === 'agent'` |
| 工具被外部 restrict / 外部账本挡掉（pwsh 实例） | 不进主列表；进不可反选组 `masked-plugin`（「外部不可见」），无勾选框、不写阶段名单 |
| 本插件阶段 `exclude` 隐藏 | 留主列表原位（半透明）、「本插件遮蔽」徽标、可反选 |
| 本插件造成的其它遮蔽 | 可反选组 `masked-own`，池内可直接反选 |
| 同名被顶掉的原生工具 | 不可反选组 `masked-shadow`，带 `shadowedBy` |
| PTC 折叠 | `truth.ptcCollapsed === true` + 横幅；被折叠行 `masked-ptc`；提示词段清单不受影响 |
| 无活动会话 / agent 装配失败 | `truth.linked === false` + 「未链接会话，外部可见性未知」横幅；退回预设视图，不抛错 |
| 切到别的预设 | 不混入其它预设会话的 agent 视图（沿用 ADR-0005 D5） |

## 术语

| 词 | 含义 | 面板位置 |
|---|---|---|
| **遮蔽（masked）** | 本插件可反选：可见性由本插件名单决定 | 主列表原位（「本插件遮蔽」）/ 只读池可反选组 |
| **不可见（invisible）** | 外部决定、只读：本插件改不了 | 只读池不可反选组 |

旧文里的「已遮蔽」池同时容纳这两类，是本 ADR 要拆掉的混淆。

## 影响模块

- `vendor/prompt-customizer/index.js`：三层采样与新状态发射（`masked-ptc` / `layer` / `ptcCollapsed`）、`buildPreview` 的 `truth` / `sectionPool`、`buildInventory` 透传；1779-1782 的注释按新决定改写。
- `src/client/prompt/`：`types.ts`（`ToolState` 新增 `masked-ptc`，新增 `layer` / `ptcCollapsed` / `truth` / `sectionPool`）、`tool-pool.ts`（双组池）、`ToolsPane.tsx`（主列表口径、徽标、两组只读池、横幅）、`locales.ts`（文案与术语）。
- 测试：`test/effective-view.test.mjs`（新）、`test/preview-phase.test.mjs`（补）、`scripts/verify-panel-browser.mjs`（真浏览器）。
- 文档：本 ADR、[2.2.0 升级记录](../upgrades/2.2.0-effective-view.md)、`docs/guide.md`、`docs/testing/feature-matrix.md`、`docs/upgrades/README.md`。

## 后果

- **每阶段多 1–2 次装配 + 缓存**：有活动会话时三层采样要采 global / preset / agent 三份定义（原先只跑 1 次纯预设装配），再叠加 ADR-0005 的提示词真实装配；面板一次打开要跑三个阶段，所以必须按 (预设, 阶段, 草稿签名) 缓存，否则开面板会明显变慢。
- **2.0.15 的双行约束作废**：同一 `{name, source}` 在同一层只出一行、一个 `state`，不再需要「base 行 + masked 行」并存来解释。
- **术语拆分**：遮蔽 = 本插件可反选；不可见 = 外部决定、只读。文档与文案统一按这两个词。
- 面板不再声称能控制 `restrict` 裁掉的东西，用户不会再遇到「勾了没用」。
- 代价：无活动会话时「外部可见性」是未知而不是结论 —— 诚实的降级，但第一次遇到会像缺功能。

## 已知限制

1. **跨插件归因缺失**：`masked-plugin` 只说得出「外部不可见」，说不出是哪个插件 / 哪条账本。
2. **无会话即未知**：没有同预设活动会话时采不到 agent 层，`truth.linked` 恒为 `false`；此时不可反选组的结论只在 global / preset 两层成立。
3. **PTC 折叠判定跟随宿主**：折叠事实来自 executor 的 `describe()` 行为；宿主若改变折叠形态（例如同时暴露多个包装工具），`masked-ptc` 判定要跟着改。
4. **定义引用比对的退化路径**：`definitions` 缺席时退化为 2.1.1 的多证据判定（description 差异 / 单侧注册），仍可能假阴性。
5. **缓存失效靠草稿签名**：宿主配置热改（如改 `applyPatch`）不会主动推事件，最长要等一次刷新。

## 验证与反例

- **反例（会让本 ADR 的实现判定为失败）**：① 主列表数据源换回纯预设 scope 装配 → pwsh 类用例必须失败；② 给 `masked-plugin` 行加勾选框或让它进阶段名单 → 只读池用例必须失败；③ 让 PTC 折叠吃掉提示词段 → PTC 用例必须失败；④ `truth.linked` 恒为 `true` → 未链接会话用例必须失败。
- 必测组合：
  ① 外部 `restrict` 隐藏的工具不进主列表、进不可反选组（pwsh 实例）；
  ② 本插件 `exclude` 隐藏的工具留主列表原位、带「本插件遮蔽」徽标、可反选；
  ③ 只读池两组分别命中 `masked-own` 与 `masked-plugin` / `masked-shadow` / `masked-ptc`；
  ④ 同名不同层（global / preset / agent）各出一行且 `layer` 正确，换任意工具名同样成立（非样例特判）；
  ⑤ PTC 折叠：`truth.ptcCollapsed` 为真、工具行进 `masked-ptc`、提示词段仍可枚举；
  ⑥ 无活动会话：`truth.linked === false`、横幅可达、不抛错；
  ⑦ 装配版本（`revision`）变化后面板自动重取真值，不留旧行。

## 与既有 ADR 的关系

- **ADR-0001**：删除累积池、预设隔离、动态枚举全部保留；「清单只来自当前预设 + 同预设活动 agent 的真实装配」不变 —— 本 ADR 只是让工具域也走同一个真实装配入口。
- **ADR-0002**：`{name, source}` 身份不变，同名不同源仍分列；`layer` 只是展示层，不替代身份。
- **ADR-0004**：PHASES 唯一表、不按名字硬编码不变；`layer` 由采样得到，不是新的硬编码表。
- **ADR-0005**：D1–D5 / D7 / D8 全部保留；**D6 的「工具目录按纯预设 scope 独立算」被修订为「工具域也按 agent 作用域同源视图判定，主列表与只读池按真值分级」**，ADR-0005 末尾「不改动工具目录回归约束」那句随之作废。
- **2.0.15**：双行设计作废（见「后果」）。
- **2.1.1**：多证据判定的退化路径保留（`definitions` 缺席时仍是兜底）。
- **2.1.2**：右栏改用 `schemas(agent)` 的方向被本 ADR 推广到左栏主列表与只读池。

## 备选

- 保持纯预设 scope 算工具目录，只在 UI 加「可能被外部隐藏」的灰字提示：仍然说不出哪一行失效，用户照样勾了没用 → 否。
- 把整条工具链路（含 `restrict` / 阶段过滤 / 遮蔽池结构）换成 agent 作用域重算：会推翻 2.0.5–2.0.18 的回归约束，且 `restrict` 执行链路不能反向 → 否（只换数据源，不动执行）。
- 引入跨插件归因契约（要求宿主或各插件上报「谁遮蔽了谁」）：宿主没有公开 API，要改宿主与本仓库外的插件 → 否。
- 让 `masked-ptc` 也进主列表、允许勾选：折叠由 executor 决定，勾选不改变模型可见函数表 → 否。

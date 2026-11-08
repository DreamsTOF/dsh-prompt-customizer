# 版本升级与适配记录

本目录记录 dsh-prompt-customizer 与 DeepSeek Harness（dsh）的版本对应、逐版变更和适配细节。根目录 README 只做产品介绍，升级相关内容统一放这里。

## 当前兼容版本

- 插件 **2.0.0** 对齐 **DSH 0.2.2-rc.1**（`peerDependencies` / `engines.dsh` 为 `^0.2.2-rc.1`）。
- 0.2.2-rc.1 的完整适配记录见 [dsh-0.2.2-rc1.md](dsh-0.2.2-rc1.md)。
- 更早的 0.2.1-rc.2 适配记录见 [rc2-migration.md](rc2-migration.md)。

## 版本历史

## 2.0.17：解除屏蔽来源修复

- 修复解除工具屏蔽后旧 agent source 条目仍命中导致的持续隐藏。
- 完整记录见 [2.0.17-unhide-source.md](2.0.17-unhide-source.md)。

## 2.0.16：回归清理

- 屏蔽池、workspace 技能状态、provider 摘要、同名 tool source、配置写队列和静默轮询竞态补齐。
- 完整记录见 [2.0.16-regression-cleanup.md](2.0.16-regression-cleanup.md)。

## 2.0.15：工具屏蔽池恢复

- 修复完整目录过滤把 `masked-plugin`/`masked-own` 行一并吞掉导致屏蔽池消失。
- 完整记录见 [2.0.15-mask-pool-regression.md](2.0.15-mask-pool-regression.md)。

## 2.0.14：工具执行前门禁

- 通过 `tools/pre-execute` 对 restrict 无法触及的 agent 作用域工具执行运行时拒绝。
- 完整记录见 [2.0.14-tool-execution-guard.md](2.0.14-tool-execution-guard.md)。

## 2.0.13：DSH 运行时契约对齐

- 工具目录/来源/restrict 按 DSH 运行时契约泛化，不绑定具体工具名；同名遮蔽保留 keySuffix。
- 完整记录见 [2.0.13-runtime-contract.md](2.0.13-runtime-contract.md)。

## 2.0.12：工具泛例测试

- 工具目录与 restrict 改为生成式 N 工具测试，不依赖具体工具名。
- 完整记录见 [2.0.12-generative-tool-tests.md](2.0.12-generative-tool-tests.md)。

## 2.0.11：回归修复

- 修复预设工作区状态污染、技能摘要跨会话丢失、同名 agent 遮蔽行、health 路由悬挂与刷新错误覆盖。
- 完整记录见 [2.0.11-regression-fixes.md](2.0.11-regression-fixes.md)。

## 2.0.10：导入原子与技能摘要/健康补齐

- 预设导入改为批量全局写入；技能摘要持久化；健康计数纳入 bundled/office/plugin。
- 完整记录见 [2.0.10-import-and-skill.md](2.0.10-import-and-skill.md)。

## 2.0.9：工具泛例与写入补齐

- 工具目录按所有 agent 作用域工具泛化，不再只覆盖 apply_patch 示例；工作区状态与保存队列补齐。
- 完整记录见 [2.0.9-tool-and-write.md](2.0.9-tool-and-write.md)。

## 2.0.8：完整目录保留预设隐藏行

- 完整目录补扫 agent 工具时不覆盖同名预设工具状态，隐藏工具仍可反选。
- 完整记录见 [2.0.8-catalog-row-stability.md](2.0.8-catalog-row-stability.md)。

## 2.0.7：工具屏蔽稳定性与预设隔离

- 修复 restrict 后下一次 sync 撤销 deny 的回归；工具目录限定同预设活动会话。
- 完整记录见 [2.0.7-tool-stability.md](2.0.7-tool-stability.md)。

## 2.0.6：预设工具屏蔽在新会话生效

- 修复预设工具屏蔽只对部分来源生效/新会话仍注入的问题；完整目录仍包含 agent 作用域工具。
- 完整记录见 [2.0.6-tool-restrict.md](2.0.6-tool-restrict.md)。

## 2.0.5：工具目录补扫与健壮性修复

- 预设工具目录补扫 agent 作用域工具（apply_patch 等）；导入/恢复校验、工作区轮询、写入串行化、上下文预检等修复。
- 完整记录见 [2.0.5-tool-catalog-robustness.md](2.0.5-tool-catalog-robustness.md)。

## 2.0.4：工具 Tab 草稿实时反映

- 工具草稿预览与保存共用 `overlayPatch` 语义，未保存勾选即时反映到列表/计数/右侧预览。
- 完整记录见 [2.0.4-tool-draft.md](2.0.4-tool-draft.md)。

## 2.0.3：禁用技能卡片保留原摘要

- 禁用技能只改变状态徽标，摘要/元数据保持启用时内容。
- 完整记录见 [2.0.3-skill-summary.md](2.0.3-skill-summary.md)。

## 2.0.2：通用运行时上下文过滤

- 按宿主 `PromptContext.required` 通用过滤空的可选上下文，不做名字特判。
- 完整记录见 [2.0.2-generic-context-filter.md](2.0.2-generic-context-filter.md)。

## 2.0.1：运行时上下文残留过滤与草稿显隐

- 过滤工具拥有的空 `tool:<name>:depth` 上下文；上下文显隐改为保存时落盘。
- 完整记录见 [2.0.1-context-fixes.md](2.0.1-context-fixes.md)。

## 2.0.0：破坏式 —— 移除工作区级提示词/工具层

- 只保留单预设编辑；工作区级提示词/工具的 UI、路由、运行时装配与备份全部移除。
- `workspaceOverrides` 字段休眠：数据保留但不读、不写、不显示、不进备份。
- 单预设导入/导出、全部预设备份包与手动清理空 overrides 留在设置页。
- 完整记录见 [2.0.0-remove-workspace-level.md](2.0.0-remove-workspace-level.md)。

## 1.0.0：破坏式 —— 存储迁移 SQLite + 预设/工作区两级自定义

- **存储统一到单文件 SQLite**（`~/.dsh/prompt-customizer/prompt-customizer.db`，WAL，`node:sqlite`，无外部依赖）：`config`、`catalog`、工作区 override、MCP `preset-masks` / `tool-disable` / `workspace-close`、技能 `preset-toggles` / `hidden-toggles` 全部入 DB；宿主配置（`cordis.patch.yml` / `.mcp.json`）与技能根 `.bundles.json` 保持文件。
- **破坏式**：旧 `config.yaml` / `catalog.yaml` 与各 JSON 账本不再读取、不迁移（文件原样保留），升级后需重新配置。详见 [1.0.0-sqlite-breaking.md](1.0.0-sqlite-breaking.md)。
- **两级自定义**：新增工作区级 override（`workspaceOverrides[cwd]`），运行时按同名覆盖预设级；`/config/apply` 增 `level=workspace`；面板顶部加「预设级 / 工作区级」切换，工作区级可控制会话里全部段/工具。
- 段与工具按宿主规范顺序排列；同名工具拆分显示（插件提供=启用锁定、原生=遮蔽池）；`assemble` 后按阶段过滤 `assembly.tools`，作用域内注册的工具也能真正隐藏。

## 0.12.0：适配 DSH 0.2.2-rc.1

- `system-prompt/assemble` 不再携带 `tools`：提示词阶段化工具目录、工作区级 MCP 关闭都迁到 agent 作用域 `tools.restrict`；预览 / 清单工具目录改读 `ctx.tools.schemas()`。
- 新增 `vendor/prompt-customizer/tool-visibility.js` 与 `test/tool-visibility.test.mjs`；`package.json` 升到 `0.12.0`，peer / engines 对齐 `0.2.2-rc.1`。
- 完整适配记录见 [dsh-0.2.2-rc1.md](dsh-0.2.2-rc1.md)。

## 0.11.6：测试精简（176 → 117 用例）

两轮清理，`node --test` 始终全绿：

1. **删除 6 个过时测试文件**（−19%）：`scripts/test-mcp-layering.mjs`、`scripts/test-mcp-tool-disable.mjs`（0.11.0 已废弃的 mcp-client 行挂载模型）、`scripts/test-skill-toggles.mjs`（旧 frontmatter 语义，与现有覆盖重复）、`scripts/test-rc2-runtime.mjs`（硬编码只认 0.2.0-rc.2，自述在 0.2.1-rc.2 上必然失败）、`test/catalog-replace.test.mjs`（mergeSighting 与 `catalog.test.mjs` 逐条重复）、`test/live-preview.test.mjs`（被 `rc2-preview` / `apply-route` 覆盖）。
2. **同组用例参数化合并**（−27%）：结构相同的多个 `test()` 合并为「数据表 + 循环」，每个表项执行原用例的**全部**断言，并给断言传场景 label（失败时能看出是哪一项）。涉及 `sectionOps`（27→24）、`chaos-super`（17→11）、`catalog`（11→2）、`effective`（8→2）、`preview-phase`（9→6）、`rc2-preview`（9→7）、`schema`（7→4）、`trust-gate`（3→1）、`windows-titlebar`（3→2）等 16 个文件。

**没有删除或弱化任何断言**：合并处逐条 diff 核对过输入表（文件名净化仍覆盖 5 个原始输入、`isTauriEnv` 仍覆盖 6 个探针、trust-gate 三种拒绝各自仍校验「不得写盘」）。生产代码零改动。

保留的「看起来可疑但必要」：`test/mcp-workspace-scope.test.mjs` 测的是 0.11.4 的 `src/mcp-workspace-scope.ts`（不是已删的 `mcp-workspace.ts`），`host.ts` 至今仍在 import 它。

## 0.11.5：工作区 MCP 落盘改为主流 agent 通用的 `.mcp.json`

- **格式对齐大众 agent**：工作区「添加 MCP」不再写 DSH 私有的 `patch.yml`，改写项目根的 **`.mcp.json`**（`{ "mcpServers": { <name>: { command|url, … } } }`）—— Claude Desktop / Cursor / Cline 等直接就能读。
  - **第一次是新建**，后续在同一个文件里**追加**（保留已有 server、保留用户手写的其它顶层字段）。
  - 同名已存在 → 跳过，不覆盖用户内容；文件是坏 JSON → 报错并拒绝写入，绝不覆盖。
- **读取时转换**：内部仍按 `mcp-client` 行挂载，读 `.mcp.json` 时把键名当 serverName 并加工作区哈希后缀（同名跨工作区不冲突），`command/args/env/cwd/url/headers` 原样透传。
- **全局不转**：全局添加仍写 profile patch（DSH 自己的组合层），保持原行为。
- **去重按目标文件算**：工作区只和该工作区 `.mcp.json` 里的键比，不再因为「全局已有 anysearch」把工作区的同名项误判为重复。
- **验证**：新增 `test/workspace-mcp-json.test.mjs`（新建 / 追加 / 同名不覆盖 / 保留其它顶层字段 / 坏 JSON / 读回转换）；`node --test` 176/176。接口实测：连续两次添加落在同一 `.mcp.json`，内容为标准格式（无 `serverName`/`transport` 等内部字段）；全局添加仍写 profile patch。

## 0.11.4：添加技能 / MCP 可选「全局 / 当前工作区」

- **添加入口加落点选择**：默认 **全局**，可选 **当前工作区**。
  - 技能：全局写 `~/.agents/skills`；工作区写 `<ws>/.agents/skills`，**目录不存在自动创建**（全新工作区也能直接装）。
  - MCP：全局写 profile patch；工作区写 `<ws>/.dsh/mcp.patch.yml`（新文件，同样自动建目录），由装配按该工作区会话挂载 —— 同一个 `anysearch` 可在两个工作区各配一份，互不覆盖。（**0.11.5 起工作区落盘已改为项目根的标准 `.mcp.json`，见上节。**）
- **缺 workspace 时明确报错**：`scope=workspace` 但没给路径 → 400，不会悄悄退回全局。
- **验证**：新增 `test/add-scope.test.mjs`（默认全局 / 工作区自动建目录 / 工作区不污染全局 / 缺参数报错）；`node --test` 174/174。接口实测：工作区装技能落到 `<ws>/.agents/skills/zz-ui-ws/SKILL.md` 且全局无残留；工作区加 MCP 落到 `<ws>/.dsh/mcp.patch.yml` 且 profile patch 无污染。

## 0.11.3：工作区下拉能列出全部工作区，技能按工作区真实切换

- **下拉只有「跟随当前会话」一项** → 修好：选项改从内核 `workspaceRegistry.list()`（侧边栏里用户登记的全部工作区）取，再补活动会话 cwd 与启动目录。没开过会话的工作区现在也能选（实测列出 5 个：PatientLifecycle / dsh-pulgn / bot / rea / 默认工作区）。
- **切工作区后技能不跟着变** → 修好：内核 `skill-filesystem` / `skill-office` 是**挂在预设行里**的 provider（`apply(ctx)` 注册进该行的层），只有「存在会话 + scope 命中预设层」时才读得到；面板要给任意工作区配置，因此改为
  - 内核结果**完整**（有会话且出现 `project-*`/`user-*`/`custom` 来源）时以内核为准；
  - 否则按内核同一套根规则兜底扫描 `<ws>/.dsh/skills` → `<ws>/.agents/skills` → `~/.dsh/skills` → `~/.agents/skills`，再把内核独有的条目（bundled / office / 插件 provider）补在后面。
- **验证**：往临时工作区放一个探针技能，该工作区 7 个、dsh-pulgn 仍 6 个（不串）；`node --test` 172/172。

## 0.11.2：面板内切换工作区 + 工作区/全局标注 + 工作区级 MCP 关闭

- **顶栏工作区选择器**：放在 SKILL / MCP / 提示词 那一行右侧（不在操作行）—— 它同时决定技能目录与 MCP 注入，必须一眼可见。选项来自宿主（活动会话 cwd ∪ 启动目录），默认「跟随当前会话」。
- **技能与 MCP 都标来源**：卡片上新增「工作区 / 全局」标签。技能来源取内核 `source`（`project-*` = 工作区专用，其余 = 全局）；MCP 行都是组合行，标「全局」。同名时工作区优先，关全局不影响工作区专用条目。
- **工作区级 MCP 关闭**：每张 MCP 卡片新增「本工作区关闭 / 本工作区启用」。账本写 `<agentsHome>/skills/.workspace-mcp.json`（`{ 工作区: { serverName: false } }`），由 `system-prompt/assemble` 按该次装配所属会话的 cwd 剔除 `mcp__<server>__<tool>`。
  - 关掉 dsh-pulgn 的 `anysearch` → 该工作区不再注入；换到别的工作区照常注入（**工具集合随工作区变化**），其它工作区不受影响。
  - 与「全局停用」（改 profile patch 的 `disabled`）互不干扰：一个是所有人的默认，一个只针对某个工作区。
- **修一个写入缺陷**：Windows 上 `rename` 覆盖已存在的账本会 `EPERM`，导致同一工作区第二次调整失败。改为「先删旧文件再改名，失败退化为直接写」，并补了「关→开→再关」的回归测试。
- **验证**：`node --test` 172/172（新增 `test/mcp-workspace-scope.test.mjs` 覆盖工作区隔离与连续写入）；web 实例真浏览器实测：顶栏出现工作区下拉，技能卡片显示「全局」，MCP 卡片显示「全局」+「本工作区已关」，点「本工作区关闭」后账本落盘、`status?cwd=` 回报 `closed:["anysearch"]`、换工作区 `closed:[]`。

## 0.11.1：修技能目录只见 global 层 + 开关改为「全权接管、无只读」

- **修「斜杠命令能看到 5 个技能，能力栏只有 1 个」**：内核 registry 的读取是 `[global 层, ...chainLayers(scope)]`（`packages/skill/skill/src/index.ts:556`）—— **不传 `scope` 就只读 global 层**。技能绝大多数注册在预设/agent 层，于是面板只剩随安装的那个 bundled 技能。现在把该 agent 的 scope key（agent 对象本身，`createScope(loopCtx, this)`）传给 `list()`，面板与 `/` 菜单、上下文里的「技能注入」条数一致。
- **开关改为隐藏账本，不再改用户的 SKILL.md**：全局开关写 `<agentsHome>/skills/.hidden-skills.json`，由闸门 provider 在内核目录里遮掉。好处是**所有来源**（含 `app.asar` 内随安装技能、office 包、插件自带）都能关，且随时可逆、不动别人的文件。
- **取消「只读」概念**：面板不再区分来源，任何技能都能开关；删除仍然只对真正可写根生效（随安装的技能删不掉文件），此时返回明确提示「该技能随安装/插件提供，请改为关闭」。
- **双保险**：除闸门 provider 外，面板目录（`kernel-skills`）自己也按隐藏账本过滤一次 —— 内核合并只按层/rank 去重，同名候选未必每次压过真实来源。

## 0.11.0：技能目录直接读内核，MCP 只留组合行

方向调整：**不再自搓扫描**。内核已经有「聚合全部技能来源」的服务与「组合行」这一层配置模型，插件自扫只会在根顺序、去重、只读来源上不断与内核打架。

- **技能列表 = 内核真值**：面板改为 `agent.ctx.skills.list({ cwd })`（`packages/skill/skill/src/index.ts`）—— 文件系统各根（project-dsh / project-agents / custom / user-dsh / user-agents）+ `bundled` + `runtime`（office 包）+ 插件自注册 provider，全由内核按 scope 链与 cwd 聚合。**面板显示的就是模型这一会话能用的那一份**（与右侧「上下文 → 技能注入」条数一致）。
  - 选哪个会话：取最新创建的根会话（`agents.roots()` 按 `session.header.createdAt` 降序）；客户端目前读不到渲染期的当前会话 id（`uiSession` 是 hook/selector 面），因此面板以「最新会话」为准。无会话时退回宿主全局 `ctx.skills` + 启动 cwd。
  - （只读分级已在 0.11.1 取消：所有来源的技能都能开关，见上节。）
- **MCP 不再有目录层**：删掉 0.10.x 的 `mcps/` 四目录扫描、挂载、可见性过滤与面板分区。MCP Server 就是内核 Cordis 组合里的 `mcp-client` 行 —— 列表、启停、增删都走组合行（`pluginManager.listPlugins()` / `setPluginEnabled()` 与 `configEditor`），插件不再额外挂行。
- **验证**：`node --test` 全绿；web 实例真浏览器实测（注入的 bsk 工具）：MCP 页只有 3 个组合行、无「mcps 目录」分区、不闪退。
- **已知限制**：随安装发布的技能在 `app.asar` 内，文件清单读不到（卡片显示「0 文件」）；不同 profile/预设的组合不同，所以各处的技能数量天然不同（这不是漏扫）。

## 0.10.1：修复 MCP 页闪退 + 技能/MCP 统一为「四个目录、`.dsh` 优先」

- **修复「点 MCP tab 闪退回对话界面」**：0.10.0 的 MCP 页新增分组时，图标随手写成 `IconFolderOutlineRegular`，而宿主 `@deepseek-ai/dsh-client-ui-primitives` 并未导出这个名字 —— 该 JSX 组件是 `undefined`，React 抛 `Element type is invalid`，MCP 页被 ErrorBoundary 摘掉（面板 fallback `null` + 自动关闭 = 闪退回对话界面）。改用宿主确实导出、或插件自绘的图标。
- **补上静态护栏**，让「宿主没有这个图标」在提交前就失败：`test/client-primitives.test.mjs` 检查客户端从 ui-primitives 导入的每个名字都在 `test/fixtures/client-ui-primitives.json` 白名单里，并逐名核对宿主打包产物确实存在（标识符边界匹配，防止 `IconFolderOpenOutline` 蹭到 `IconFolderOpenOutlineRegular` 而误判）。
- **补上真浏览器验证**：新增 `scripts/verify-panel-browser.mjs` —— 用真实 Chrome（CDP，无第三方依赖）打开 dsh Web UI，点「能力」→ MCP 页 → SKILL 页，断言没有未捕获异常、MCP 页真的渲染出来、四个目录里的条目都在 DOM 里，并截图留证。闪退这类问题只有真渲染才会暴露，单测全绿也拦不住。
- **技能与 MCP 统一为四个目录**（`.dsh` 优先于 `.agents`，工作区优先于用户级）：
  - 技能：`<工作区>/.dsh/skills` → `<工作区>/.agents/skills` → `~/.dsh/skills` → `~/.agents/skills`
  - MCP：`<工作区>/.dsh/mcps` → `<工作区>/.agents/mcps` → `~/.dsh/mcps` → `~/.agents/mcps`
  - 同名先出现者胜出：技能按名字去重（先出现的那份胜出）；MCP 同一作用域内同名只挂一台，被遮蔽的在面板里如实标出「同名遮蔽（来自哪个文件 → 采用了哪个文件）」。
  - 技能根**不再按「目录是否存在」过滤**：四个根始终在列表里，新丢进去的技能下一次请求即可见，不必重开会话。

## 0.10.0：技能扫工作区级根 + mcps 目录接上

- **技能面板补上工作区级技能根**：内核 `dsh-skill-filesystem` 扫 5 类根，本插件面板此前只认两个用户级根，于是 `<工作区>/.dsh/skills` 与 `<工作区>/.agents/skills` 里的技能内核看得见、面板看不见（无法归组 / 开关 / 查看文件）。现在面板、技能开关、技能健康三处共用同一份根集合，顺序与内核 rank 一致（工作区级先于用户级，同名先出现者胜出），项目根按内核规则取「最近的含 `.git` 的祖先，没有则会话 cwd」。
- **补上 mcps 目录的 MCP Server**：内核只认 Cordis 组合里的 `mcp-client` 行，没有「读某个目录下 `mcp.json`」的约定（全仓库 grep `mcps` 零命中），所以 `~/.agents/mcps/**`、`<工作区>/.dsh|.agents/mcps/**` 里放着的配置一直是死文件。现在由本插件读出来挂成真正的 mcp-client 行：全局层所有会话可见，工作区层只在该工作区会话可见（装配时按会话 cwd 过滤），MCP 页单列一组展示。
- 工作区层的 `serverName` 追加 8 位路径哈希后缀：不同工作区可以各配一台同名但参数不同的 Server，互不挤占（`mcp-client` 的 serverName 在同一作用域只能有一个实例）。配置里的 `${VAR}` 按进程环境展开，`cwd` 的相对值按该配置文件所在目录解析。
- 与组合里既有的行同名时**以组合为准**：目录里那条不重复挂载，面板如实标出「已让位」—— 否则后挂的 fiber 激活失败并持续报 `serverName ... is already in use`。
- 相关实现：新增 `src/skill-roots.ts`（根解析）与 `src/mcp-workspace.ts`（mcps 运行时），`vendor/skill-manager/skills-host.js` 增加额外根注入，路由 `GET /api/triad/mcp-workspace/status`；`/api/triad/mcp-status` 增加 `workspaceServers` 段。

## 0.9.3：适配 DSH 0.2.1-rc.2

- **修复「存为预设」**：原实现调用宿主 `agentPresets.copy()`，但该 API 在 DSH 任何版本都不存在（宿主只有 `list` / `read` / `select`），所以此前一保存就报 `宿主未提供 agent 预设服务`。现改为读来源预设的声明组成，作为一条 `dsh-agent-preset` 行写进 profile patch（HMR 热加载），并把当前定制写进 `overrides[新名]`。
- 预设 id 收紧为宿主的真实规则 `[a-z0-9][a-z0-9-]*`（原先允许中文与空格，与宿主不符）。
- 用户数据根解析对齐内核新的 `resolveDshHome` / `resolveAgentsHome`：`$DSH_HOME` / `$DSH_AGENTS_HOME` 为空串或纯空白时按未设置处理（旧写法会落到进程 cwd），`~` / `~/` 前缀现在展开。技能面板、技能开关账本、技能健康检查三处共用 `src/home-paths.ts`。
- 三个功能面的服务契约在本区间零破坏：`ctx.skills`、`tools.restrict/schemas`、`configEditor`、`agentPresets`、`system-prompt` 装配 waterfall 与段/变量 API、`connection.requestRejection` 全部保持。详见 [rc2-migration.md](rc2-migration.md)。

## 0.9.2：按模式预设修正 rc.2 适配

- 预设目录使用 `agentPresets.acquireScope()`，每次读取选中模式的当前修订；结束释放租约。不匹配已有对话，不创建伪 Agent，不切换对话的预设。
- 顶部模式 Tab 决定提示词、工具和排序的编辑目标。同名提示词在不同模式下的正文分别来自各自作用域，不能拿另一个模式或旧会话替代。
- 预设预览中的 `{{model}}`、`{{cwd}}` 等未绑定变量保留为模板引用，并显示非致命说明；目录和草稿编辑不因此失败。真正对话中的严格插值行为不变。
- 独立展示 `contexts`（user-role 运行时快照、只读）。纯预设作用域无法得到依赖真实会话状态的贡献；这不允许把另一个对话的数据当成当前模式定义。
- 三阶段模拟本插件的独立规则；已有对话的模式绑定不被编辑目标切换改变。此预览不是完整历史 LLM 请求回放。

本地源码更新后执行 `npm run build`。链接安装无需复制；已启动宿主可能持有旧模块，保存工作后重启原来的 `dsh web` 并硬刷新，确认不再有「预览会话」，来源显示为「当前模式预设」。

目标版本冷启动测试（`scripts/test-rc2-runtime.mjs`）已随测试精简移除：它硬编码只认 **0.2.0-rc.2**，且在 0.2.1-rc.2 上 turn 段断言必然失败。rc.2 适配相关行为改由 `test/rc2-preview.test.mjs` 覆盖，完整校验以 `npm run check` 为准。

## 历史版本要求

### 版本要求

0.9.3 当时的版本要求：对齐 **DSH 0.2.1-rc.2**（`peerDependencies` 为 `^0.2.1-rc.2`）。
0.2.0-rc.2 → 0.2.1-rc.2 的适配记录见 [rc2-migration.md](rc2-migration.md)：三个功能面的服务契约
均无破坏，唯一代码改动是用户数据根解析对齐内核新的 `resolveDshHome`/`resolveAgentsHome`
（空串按未设置、支持 `~` 展开）。

**0.9.0 行为变更：全局层停用。** 提示词必须按具体 agent 预设修改——「全部 Agent」
编辑入口移除，`/config/apply` 无 `target` 一律 400，`/config/set|unset` 拒绝六个
提示词字段；运行时生效配置 = 该会话所属预设的 `overrides[id]`，未定制的字段 =
官方默认。config.yaml 顶层的旧全局层数据**保留不再生效**（可手编回滚；0.8.x 及
以前的行为请用 0.8.1）。
0.1.7 起的图标代际（`IconXxxOutlineRegular/Medium`，尺寸由 `size` 属性给）在
0.2.0 沿用，本插件的宿主接触面（`system-prompt` 装配 waterfall、`agentPresets`、
`configEditor`、`tools.restrict/schemas`、`webServer.register`、客户端模块加载缝）
在 0.1.7-rc.1 → 0.2.1-rc.2 走廊内均无破坏性变更，故客户端 bundle 与 0.7.x 同代。
不支持 0.1.7 之前的主机（旧宿主会按 DSH 的插件兼容性策略拒绝加载，而不是半静默
地坏掉）。需要旧版的请用 0.6.x。

0.8.1 起 MCP 全局 Server 的管理目标（`/api/triad/mcp-status` / `mcp-config` 读写
的 `cordis.patch.yml`）随宿主 `profileContext` 解析——Web 端（profile `web`）与
**桌面端**（profile `desktop`，默认端口 19387）各管各的 profile，不再写死 `web`。
宿主面缺失时按 `DSH_DESKTOP_PROFILE` 环境变量回落（桌面壳 v4 形态），最后回落
`web` 保持旧行为。注意桌面 profile 没有 `patchReload: live`：切换 / 粘贴 / 删除
MCP Server 写盘成功后需**重启桌面端**才生效（Web 端热重载语义不变）。

预设专属 MCP Server 的存储位置自 0.1.7 起：预设不再是磁盘上的组合
文件，而是声明式插件行（`name: '@deepseek-ai/dsh-agent-preset'`），专属 Server
写在它的 `config.plugins` 里；本插件经 DSH 的 `configEditor` 把改动写回 profile
的 `cordis.patch.yml`（首次改动会整份覆盖该预设行的 plugins，此后该预设不再跟随
DSH 升级更新 —— 与 DSH 自带编辑器同一语义，面板上有提示）。

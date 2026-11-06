# DSH 0.2.2-rc.1 适配记录（0.12.0）

目标 tag `dsh-v0.2.2-rc.1`（`0.2.1-rc.2 → 0.2.2-rc.1`）。插件版本对应 `0.12.0`。

## 结论：不兼容，已升级

0.2.2-rc.1 把 `system-prompt/assemble` 的入参从 `PromptAssembly` 收窄为 `PromptPresentation`：**瀑布流不再携带 `tools`，监听器返回的 `tools` 也会被忽略**（官方升级指南 `v0.2.1-rc.2/conditional-tools`，另见 `v0.2.1-rc.2/tool-executor-plugins` 的执行器拆分）。

本插件有三条工具目录过滤链路直接读取 `assembly.tools`，在 0.2.2-rc.1 上会**静默失效**：

| 功能 | 位置 | 旧行为 | 0.2.2-rc.1 现象 |
|---|---|---|---|
| 提示词定制的阶段化工具目录 | `vendor/prompt-customizer/index.js` | 在装配瀑布流里删除 `assembly.tools` | `assembly.tools` 为 `undefined`，过滤不生效 |
| MCP 工具级启停的装配兜底 | `src/mcp-tool-disable.ts` | 瀑布流过滤兜底 | 同左；全局工具仍由 `tools.restrict` 覆盖，预设自带工具失去兜底 |
| 工作区级 MCP 关闭 | `src/mcp-workspace-scope.ts` | 按会话 cwd 删除对应工具 | 同左，工作区关闭不生效 |

其他已核对、无破坏的宿主面：

- `ctx.tools.schemas(scope?, toolSet?)` / `tools.restrict()` / `tools/change` 仍在；
- `ctx.skills.list()` 所在 `@deepseek-ai/dsh-skill` 源码零改动；
- `agentPresets` 的 `list` / `readDocument` / `composedPreset` / `acquireScope` 仍在，新增 `presetForSession(session)`；
- `sessionProjections.register()` 改为返回可 await 的 handle，`ProjectionHandle.stateOf(session)` 可用；注册表级 `stateOf(session, key)` 仍保留但已弃用；
- `ctx.webServer.register()` 新增 `WebResourceRoute` 重载，原有 `WebRoute` 不变；
- `ui-primitives` 中本插件使用的 13 个图标、`Button` / `Modal` / `Tooltip` / `Menu` 全部保留；
- `locale.register` / `bind`、`ui-slots`、`ui-input-trigger` 的公开签名不变；
- 侧边栏锚点 `[data-slot="sidebar.workspaces"]` 与 `[data-sidebar-collapsed]` 仍存在。

## 改动

1. **提示词阶段化工具目录改用 agent 作用域 `tools.restrict({ deny })`**：新增 `vendor/prompt-customizer/tool-visibility.js`，在 `agent/created` / `session/event`（`tool/call`、`assistant/message`、`compaction/end`、`turn/start`、`agent-preset/selected`）/ `tools/change` 时重算该 agent 当前阶段应隐藏的工具并更新 restrict。配置写入路由在落盘后立即重算。
2. **预览与清单的工具目录改读注册表**：`buildPreview` / `collectScopeBase` / `promptCustomizerBaseView` 不再读取 `assembled.tools`，改用 `ctx.tools.schemas(scope)`（作用域优先，回退全局）；`baseTools` 继续携带每阶段 `hidden` 标记。
3. **工作区级 MCP 关闭补上 agent 作用域 restrict**：`src/mcp-workspace-scope.ts` 在 `agent/created` / `tools/change` / 账本写入后按会话 cwd 计算被关闭 Server 的 `mcp__<server>__*` 工具并安装 restrict；旧装配过滤保留为旧宿主兜底。
4. **升级记录与版本元数据**：`package.json` 版本 `0.12.0`，`peerDependencies` 升到 `^0.2.2-rc.1`，新增 `engines.dsh` 与 Node `>=24.9`。

## 验证

- `npm run build`：通过；宿主产物无 `@deepseek-ai/*` 裸导入（`assertHostExternals` 通过）。
- `npm test`：119/119 通过（新增 `test/tool-visibility.test.mjs` 覆盖阶段 restrict）。
- `npm run smoke`：宿主半身 21 条路由、客户端半身 loader / primitives 检查通过。
- **真实 0.2.2-rc.1 Web 冷启动**：用默认 `web` 模板新建隔离 profile，`dsh plugin add` 链接本插件 `0.12.0` 后启动。
  - `/api/prompt-customizer/config`、`/inventory`、`/preview?scope=standard&phase=bootstrap|active|compaction` 全部 200；预览工具目录来自注册表（37 个），不再是空数组。
  - 浏览器实际打开侧边栏「能力」面板：SKILL / MCP / 提示词三个 tab 正常渲染；提示词面板显示当前预设的段列表、模型视角预览与工具目录。
  - 临时写入 `bootstrap.exclude: [read]` / `exclude: [write]` / `compaction.exclude: [grep]` 后，三个阶段的预览分别只剩对应项被隐藏（36/37），验证通过后恢复原配置。
- 静态 API 对照：按 `dsh-v0.2.1-rc.2 → dsh-v0.2.2-rc.1` 逐包 diff 核对上述宿主面。

## 已知限制

- `tools.restrict` 只能收窄 agent 继承的**全局工具**；预设自带（作用域内注册）的工具无法通过 restrict 隐藏。提示词定制的工具目录与工作区 MCP 关闭对这类工具不生效（旧版装配过滤可以，但 0.2.2 已无该接缝）。
- `mcp-tool-disable` 的预设自带工具兜底同样受限；全局工具与继承 MCP 工具不受影响。

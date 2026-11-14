# dsh-probe-stimulus（dev-only）

一个最小 DSH 插件，用于 (1) 集中演示「插件注册工具/提示词的全部方式」，(2) 作为「新装插件后新注入项是否默认生效」的 stimulus。**不发布，不进 npm 包**，仅供开发/回归。

## DSH 插件注册「工具 / 提示词」的全部方式（出处以 `deepseek-harness/packages` 为准）

1. **`ctx.tools.register(definition, { when? })`** — 工具注册主入口
   - `packages/core/tools/src/index.ts:128`（`register`）；`ToolDefinition` 见 `packages/core/tools/src/contracts.ts:27`（`name/description/parameters(JSON Schema)/output{schema,render,presentationMeta?}/execute...`）。
   - 定义来源有 3 种写法：
     a. **原始对象**（无需宿主包）— `packages/subagent/subagent/src/structured.ts:84`（本 stimulus 用的就是这种）。
     b. **`defineTool({...})` 助手**（参数 spec→JSON Schema + 参数校验）— `packages/core/tools/src/schema.ts:555`；绝大多数工具如此，如 `packages/shell/tool-bash/src/index.ts:588`、`packages/schedule/tool-schedule/src/index.ts:378`。
     c. **工厂产出的 definition** — 如 `bashTool(undefined)` / `pwshTool(...)` / `sendMessage` / `skillTool`（仍是 `register(definition)`）。
   - `options.when(context)` — 按 step 条件准入（`contracts.ts:116`）；false 时该 step 既不声明也不可调用。
   - **作用域**：`ctx.tools.register` 注册到该 `ctx` 所属 scope。插件挂在 root ⇒ 全局工具；在 `agent/created` 里用 `agent.ctx.tools.register` ⇒ 会话级工具（本插件面板里记为 `locked-agent`）。
2. **`ctx.systemPrompt.tools(provider)`** — 装配期 **tool-schema provider**（不进 `tools.schemas` 注册表）
   - `packages/core/system-prompt/src/index.ts:551`；provider 形如 `(context) => ({ schemas, knownNames? })`（`ToolProviderResult`：`index.ts:113`）。贡献只作用于 `PromptAssembly.tools`，用于动态/派生声明。
3. **`ctx.tools.setExecutor(executor)`** — 执行器专属传输（每个 scope 只能一个）
   - `packages/core/tools/src/index.ts`（`setExecutor`）；PTC：`packages/core/tool-executor-ptc/src/index.ts:106`（注册 `run_code` 传输 + 逐工具 SDK）；native：`packages/core/tool-executor-native/src/index.ts:34`。执行器的 `sections` 会注册为工具提示词段。
4. **MCP client** — 把每个 MCP server 的工具**内部走 `ctx.tools.register`**：`packages/mcp/mcp-client/src/tools.ts:211`。
5. **`ctx.tools.restrict({ allow?, deny })`** — **不是注册**，是遮蔽/收窄（`packages/core/tools/src/index.ts` 的 `restrict`；见 `mcp-tool-disable.ts` 注释）。注意：`run_code` 被保留名硬锁；restrict 只作用于继承层（global/祖先），作用域自注册工具不受其约束。

## 挂载（只测 web profile，不碰桌面端）

```bash
# 1) 复制到 web profile 的 node_modules
cp -r scripts/stimulus-plugin/* ~/.dsh/profiles/web/node_modules/dsh-probe-stimulus/
# 2) 在 ~/.dsh/profiles/web/cordis.patch.yml 末尾追加
#    - insert:
#        - id: probe-stimulus
#          name: dsh-probe-stimulus
# 3) 重启 web profile
dsh --profile web --port 0 --no-open
```

用 `scripts/_probe-sections.mjs --url "<token URL>" --scope standard --marker probe:stimulus` 采集 before/after，确认新段/新工具在**不点保存**时是否进入 `/inventory` 与真实装配 `/preview`。

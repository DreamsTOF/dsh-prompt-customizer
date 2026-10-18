# DSH 0.2.1-rc.2 适配记录（0.9.3）

目标 tag `dsh-v0.2.1-rc.2`（区间 `dsh-v0.2.0-rc.2` → `dsh-v0.2.1-rc.2`，1925 commits，merge-base 纯）。实际 CLI `0.2.1-rc.2`，Node `24.18.0`。保留用户原有改动，不修改 DSH 源码。

**结论：三个功能面（skills / MCP / 提示词）的服务契约在区间内零破坏**。本轮两处改动：用户数据根解析对齐内核新规则；修复「存为预设」调用了并不存在的宿主 API。

## 修复：「存为预设」调用了不存在的 API

**现象**：保存预设时报 `宿主未提供 agent 预设服务（dsh-agent-presets），无法创建预设`。

**根因**：路由判 `typeof roster.copy === 'function'`，但宿主 `agentPresets` 只暴露 `list` / `read` / `select` 三个 RPC —— `copy` 与 `authorable` 在 0.1.6 到 0.2.1 的**所有 tag 里都不存在**（逐 tag `git show` 验证，零命中）。这条路径从写下起就是死的。

**顺带发现**：`test/presets-route.test.mjs` 用假 roster `{ copy: async () => {} }` 覆盖了这条路由，所以测试一直"通过"——测试跟着错误假设一起编，掩盖了真实缺口。

**改法**：DSH 里预设是声明式的，创建 = 往 profile patch 追加一条 `@deepseek-ai/dsh-agent-preset` 行（HMR 监听该文件后热加载）。新实现：

1. `agentPresets.readDocument(from)` 取来源预设的组成原文
2. 以 yaml 文档 API 解析成自己的文档（`!!js` 条件保持为标签节点，不先 `toJSON`）
3. 克隆来源节点到新行的 `config.plugins`，追加一条 `insert`，原子写回 `profileContext.patchPath`
4. 再把提交来的定制写进 `overrides[新名]`

失败语义：id 不合法 400、同名 409、来源不存在 404（按 `error.code === 'agent-preset/not-found'`，符合宿主「按 code 判别不用 instanceof」的契约）、无 `readDocument` 501、无 `profileContext` 400。每种失败都不写盘。

**验证**：`test/presets-route.test.mjs` 重写为 9 条断言，覆盖写入内容、注释保留、`!!js` 标签保形、各失败码不写盘；另在真实 `~/.dsh/profiles/web/cordis.patch.yml` 上验证写入后注释全在、原有 2 个 `!!js` 全在、新行可被 Loader 解析。全量 149/149 通过。


## 唯一代码改动（其二）：用户数据根解析对齐

内核 0.2.1-rc.2 把 env 解析收进 `@deepseek-ai/dsh-home-paths` 的 `resolveDshHome` / `resolveAgentsHome`，规则比插件原来的内联写法更严：

| 规则 | 旧内联写法 | 内核 rc.2 | 实际后果 |
|---|---|---|---|
| `DSH_AGENTS_HOME=''` / 纯空白 | 当作路径 → `resolve('')` = 进程 cwd | 按未设置 → `~/.agents` | 面板列 `cwd/skills`，开关写进无人读的目录 |
| `DSH_HOME='~/x'` | 不展开 → `cwd/~/x` | 展开 → `~/x` | 同上，整片面板读错根 |

插件是 vendor 进宿主的运行时插件，不能 import 内核包，所以**照抄规则而不是复用实现**：新增 `src/home-paths.ts` 作为唯一真源，`src/skill-health.ts`、`src/skill-toggles.ts` 改为消费它；`vendor/skill-manager/skills-host.js` 内联同规则并导出 `__managedRoot`/`__dshRoot` 供等值断言。

验证：`test/home-paths.test.mjs` 4 条断言，含 vendor 与 src 三组 env（空串 / `~` / 绝对路径）下的逐项等值比较。全量 `npm test` 148/148、`npm run smoke` 全过。

## 三个功能面的核对结果

| 功能面 | 接触点 | 区间变化 | 结论 |
|---|---|---|---|
| skills | `ctx.skills.registerProvider/list/get/snapshot` | `packages/skill/skill/src` 零改动 | 预设级闸门 provider 语义不变 |
| skills | 技能开关 frontmatter 字段 | `disable-model-invocation` / `user-invocable` 解析段逐字节相同 | 全局层开关字段名与语义未变 |
| skills | `.preset-skills.json` 账本 | `discoverRoot` 只认目录与 `*.md` | 点号文件不会被当技能，也不触发告警/重扫 |
| skills | 客户端避让三键 | locale `skill` / `tool.call.toolview#skill` / `/` 触发源均未改名 | 避让策略仍正确；新增的 `conversation.user.text.node#skill` 由内核独占，插件不碰 |
| MCP | `tools.schemas/get/register`、`tools/change` | 字段与无参事件载荷未变 | 工具目录与装配过滤写法不变 |
| MCP | `configEditor.entries/edit`、`loader.entries` | config-editor `src/` 零改动 | 预设行读写与原子写不变 |
| MCP | `agentPresets.readDocument/list/composedPreset` | 仍在（内部改 `generationFor`） | 插件对被删的 `livePresetMounts`/`serviceForAgent`/`standingMountFor` 零引用 |
| MCP | `mcpResources.register` | `mcp-resources/src` 两侧同构 | 资源遮蔽桩不变 |
| 提示词 | `system-prompt/assemble` waterfall | 声明逐字节相同 | 装配包装与段策略不变 |
| 提示词 | `section` / `context` / `getSectionOrder` / `variable` / `layers.merge` | 全在；`merge` 实现两侧相同 | forceSections 探测与变量注册不变 |
| 提示词 | 段重建是否丢新字段 | `applySectionPolicy` 用 `{...section}` 展开 | `interpolate` / `required` / `complete` 均保留，无回归 |
| 通道 | `connection.requestRejection` | 签名与 `ConnectionTrustRequest` 一致 | fail-closed 信任闸写法不变 |

## 需要知道但不属于插件责任的变化

1. **`tools.mode: both` 被移除**（`ToolPresentationMode` = `'native' | 'ptc'`）。profile/preset 里仍写 `both` 会在启动校验抛错。插件不产出该值。
2. **`webServer` 的 `host` 不再接受 `0.0.0.0`**，必须是具体本机 IP 字面量，wildcard 直接抛错。用户 profile 若仍写该项，web 层启动失败——与插件无关但会一起不可用。
3. **`includeRuntimeContext=false` 时预览 contexts 会变多**：rc.2 保留 `required: true` 的上下文（如 `working-directory:current`），旧版整表清空。这是宿主的正确行为，插件只如示。
4. **`harness:source` / `app:web-surface` 改为 `interpolate: false`**：用户替换这两段文本后 `{{var}}` 不再插值。
5. **`skill` 工具的 cwd 改走 `workingDirectory.ensure()`**（rc.2 新增服务）：会话目录被删时 cwd 会被重新校验，技能的项目根可能随之改变。
6. **base bundle 撤掉 `skill-badge` 行**（改由 `badge-skill-bundle` 独立声明）：按该行 id 覆盖它的配置升级后失效。插件零引用。

## 未覆盖 / 验证缺口

- **真实 rc.2 冷启动链路的 turn 段未验证**：`scripts/test-rc2-runtime.mjs` 在 0.2.1-rc.2 上跑到第 77 行断言（`model.requests.length === 2`）实得 0。已用对照实验排除插件因素——同一组合**带插件与不带插件都得到 0**，且最小探针（无 mount / 带 mount / 带 85 工具）单独跑均得 2。会话事件显示 `turn/start → step/start → step/end → turn/end` 走完但未发模型请求，属 fixture 在新版下的行为漂移，非插件回归。该脚本内还硬编码 `version !== '0.2.0-rc.2'` 即抛错，需要单独一轮修 fixture 才能跑通。
- 预览段（零对话双模式、工具数、段顺序、模板变量）在真实 0.2.1-rc.2 上**全部通过**。
- 真实外部模型、多平台、用户当前 GUI 的视觉验证未覆盖。

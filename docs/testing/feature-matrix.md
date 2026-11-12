# 终测：功能点矩阵与自动化覆盖

> **状态（2.1.0）**：本文件记录的是 1.x / 2.0.x 时期的终端级与行为级验证结果（2026-11-07），**不作为 2.1.0 的当前验证结论**。当前门禁是 `npm run check`（构建 + 全量单测 + 宿主 / 客户端 smoke）与 `test/universal-prompt-takeover.test.mjs`（ADR-0005 组合场景）。`scripts/verify-effect.mjs` 的旧 `replace` 字典、`level=workspace`、`scripts/e2e-terminal.mjs` 的工作区级断言已与 1.4.0 / 2.0.0 之后的代码不相容，属历史脚本，运行前须按当前 `/config/apply` 契约更新；`docs/guide.md` 同样保留作历史材料，现状以 `docs/adr/0005-universal-prompt-takeover.md` 与 `docs/upgrades/2.1.0-universal-prompt-takeover.md` 为准。

> 自动化脚本：`scripts/e2e-terminal.mjs`（终端级，走真实 HTTP + dsh-auth 握手）。
> 运行：先起一个实例 `dsh web --no-open --port <N>`，再
> `node scripts/e2e-terminal.mjs --url "http://127.0.0.1:<N>/?token=<TOKEN>" [--destructive]`。
> `--destructive` 会先 `GET /backup` 整库备份、测试后 `POST /restore` 恢复，保护真实数据。

结果（2026-11-07，web profile，MCP `anysearch` + `codegraph`）：
- 单测 `npm test`：**136 passed / 0 failed**。
- E2E（`--destructive`）：**43/43 passed**，含备份→写入→恢复一致性。

## A. 提示词定制（预设级）
| 功能 | 覆盖 | 结果 |
|---|---|---|
| inventory 清单（段/工具/阶段） | `test/*` + E2E `GET /inventory` | PASS |
| config 读/写（forceSections、envBlocklist、presets） | `test/store` `test/reset-route` + E2E `GET /config`、`/config/set`、`/config/unset` | PASS |
| 三阶段 preview（bootstrap/compaction/active） | `test/ordering` `test/rc2-preview` + E2E `GET /preview?phase=` | PASS |
| 草稿预览 POST /preview | `test/session-preview` | PASS（单测） |
| 段 屏蔽/替换/注入/拖拽排序 | `test/ordering` `test/sectionOps` | PASS |
| 工具目录按阶段 隐藏/加回 | `test/tool-shadow` `test/tool-visibility` | PASS |
| config/apply 预设级写入 + 还原 | E2E `POST /config/apply`（target） | PASS |
| export 当前预设定制（只读） | `test/export-route` + E2E `GET /export` | PASS |
| 恢复初始 /config/reset | `test/reset-route` | PASS |

## B. 两级（预设级 / 工作区级）
| 功能 | 覆盖 | 结果 |
|---|---|---|
| config/apply `level=workspace` 写 `workspaceOverrides[cwd]` | `test/workspace-override` + E2E | PASS |
| 合并语义 工作区>预设（同名后者胜） | `test/workspace-override` `mergeOverrideLayers` | PASS |
| 运行时按会话 cwd 叠加工作区 override | `buildSessionPreview`/`resolveTarget`（单测 + 实机） | PASS |
| 顶部统一「预设级/工作区级」切换（三 tab 共用） | 实机 UI（截图） | PASS |
| 移除「当前会话」独立模式 | 实机 UI | PASS |

## C. SKILL 技能管理
| 功能 | 覆盖 | 结果 |
|---|---|---|
| list / bundles / loose 清单 | `test` skill 系列 + E2E `GET /api/skill-manager/list` | PASS |
| 全局 / 预设级开关 | `test/skill-toggles` + E2E `PUT /skill-toggles/presets/:id/skills/:name` | PASS |
| **工作区级开关（新）** | `test`（skill-toggles workspace）+ E2E `PUT /skill-toggles/workspaces/:cwd/skills/:name` + `GET /workspaces` | PASS |
| 技能健康检查 | E2E `GET /api/skill-health` | PASS |
| 技能包 CRUD / 安装 / 删除 | 单测（文件系统相关，E2E 未做破坏性文件操作） | 单测 PASS |

## D. MCP 管理
| 功能 | 覆盖 | 结果 |
|---|---|---|
| mcp-status（服务器/工具/遮蔽/工作区关闭/工具禁用镜像） | `test/mcp-*` + E2E `GET /api/triad/mcp-status` | PASS |
| 注册 Server 呈现（anysearch 4 工具、codegraph 1 工具） | 实机 UI 截图 + E2E | PASS |
| 预设级 遮蔽（mask） | `test` + E2E `PUT /mcp-masks/:preset/:server` | PASS |
| 预设级 工具级启停 | `test/mcp-tool-disable` + E2E | PASS |
| 工作区级 server 关闭 | `test/mcp-workspace-scope` + E2E `PUT .../workspace/:cwd/servers/:server` | PASS |
| **工作区级 工具级启停（新）** | `test/mcp-workspace-scope`（新增用例）+ E2E `PUT .../workspace/:cwd/tools` + `status` | PASS |
| mcp-config 启停 / 移除 | `test` + UI | PASS（单测/UI） |
| mcp-presets 添加/移除专属 Server | `test` + UI | PASS（单测/UI） |
| mcp-preview 粘贴校验 | `test` | PASS（单测） |

## E. 备份 / 恢复
| 功能 | 覆盖 | 结果 |
|---|---|---|
| 整库备份 `GET /backup`（docs + catalog） | `test/backup-route` + E2E | PASS |
| 整库恢复 `POST /restore` 且覆盖一致 | `test/backup-route` + E2E（恢复后 overrides 与备份一致） | PASS |
| 配置页「完整备份/恢复」卡片 | 实机 UI | PASS |

## F. 配置页
| 功能 | 覆盖 | 结果 |
|---|---|---|
| 环境变量黑名单（envBlocklist，`{{env:...}}`） | 实机 UI + 备份含该字段 | PASS |
| 强制覆盖 forceSections | E2E `config/set` + UI | PASS |
| 完整备份/恢复 | E2E + UI | PASS |
| 配置快照库（保存/应用/导入/导出/删除） | UI（保留，底层 presets/activePreset 不清理） | PASS |
| 恢复初始状态 | `test/reset-route` + UI | PASS |
| 自适应卡片网格排版 | 实机 UI | PASS |

## G. 存储 / 版本
| 功能 | 覆盖 | 结果 |
|---|---|---|
| 单文件 SQLite（WAL，node:sqlite） | `test/*`（DB 版） | PASS |
| 破坏式：旧 YAML/JSON 不读不迁移 | `test/include-migration` 等 | PASS |
| 版本 1.0.0 + 升级文档 | `docs/upgrades/1.0.0-sqlite-breaking.md` | PASS |

## 未纳入自动化（说明）
- 技能包安装/删除、MCP 添加专属 Server 会写真实文件系统（技能根、profile patch），E2E 不做破坏性文件操作，仅单测/手动覆盖。
- `codegraph` 依赖本机 `codegraph` 命令；某些启动环境 PATH 缺失时该 Server 显示「等待注册」，属环境问题，不影响插件逻辑。

## H. 行为级验证（真的生效，非只看接口 200）
脚本：`scripts/verify-effect.mjs`（对比宿主**真实装配**前后：`/preview` 的最终 `text`+`tools`、`/session` 活动会话真实视图；写入前备份、测后恢复）。

结果（web profile，活动会话 cwd=`D:\dsh-pulgn`）：**13/13 通过**。

| 场景 | 观测 | 结果 |
|---|---|---|
| 预设级·隐藏段 | `/preview(active)` 最终 `sections` 去除该段；`text` 13522→13472 | PASS |
| 预设级·替换段文本 | 最终 `text` 含替换标记 `__E2E_MODIFIED_TEXT__` | PASS |
| 预设级·隐藏工具（MCP 工具级） | `/preview.tools`（=宿主交给模型的工具声明）不再含 `mcp__anysearch__batch_search` | PASS |
| 工作区级·隐藏段 | 活动会话 `/session` 最终 `sections` 27→26；`text` 15714→15664 | PASS |
| 工作区级·隐藏工具 | 活动会话 `/session.tools` 不再含该 MCP 工具 | PASS |
| 以上各项还原 | 隐藏/替换撤销后，段与工具均回到最终装配/会话视图 | PASS |

> 结论：在工作区隐藏/修改提示词、隐藏/启用工具，**确实改变了模型最终收到的系统提示词与工具声明**（隐藏即从最终装配移除；替换即进入最终文本；再次放回即恢复）。

## 2.1.0 当前验证（ADR-0005，全域系统提示词接管）

> 以下来自本机 `npm run check`（2026-11-09）：全量单测 **164/164 通过**、构建产物重建、宿主 / 客户端 smoke 全绿。真宿主 E2E 由使用者自行校验；上节 A–H 的 2026-11-07 结果均为历史存档。

| 场景 | 覆盖 | 结果 |
|---|---|---|
| 会话级段进入 `/inventory` / `/preview`，同名不同源分列，`{kind:'agent'}` 身份稳定 | `test/universal-prompt-takeover.test.mjs` | PASS |
| 屏蔽会话级段后 `/preview.text` 与 `/session.sections` 都不含它，撤销恢复 | 同上 | PASS |
| 任意段名的 agent 段可枚举（非 `tool:*` 特判） | 同上 | PASS |
| 切到别的预设不串台；无活动 agent 退回纯预设不抛错 | 同上 | PASS |
| 工具目录不受 live 提示词视图影响（D6） | 同上 | PASS |
| 段按宿主规范 order 排序（含 agent 链 order） | `test/ordering.test.mjs` | PASS |
| 预览正文并入同预设活动 agent、工具目录仍纯预设 | `test/rc2-preview.test.mjs`、`test/source-model.test.mjs` | PASS |
| 无明确编辑目标时退回纯预设、不读累积池 | `test/runtime-catalog.test.mjs` | PASS |
| 反例 | 把 `liveBase.sections` 换回空数组、或让 `stableSourceOf` 返回带 session id 的原始 agent source，上述组合用例必须失败 | 已写入新测试文件头注释 |

## 2.1.1 当前验证（同名遮蔽探测）

> 来自本机 `npm run check`（2026-11-09）：全量单测 **170/170 通过**、构建产物重建、宿主 / 客户端 smoke 全绿。真宿主 E2E 由使用者自行校验。

| 场景 | 覆盖 | 结果 |
|---|---|---|
| `definitions` 缺席 / agent `definitions` 缺该 name / `inPreset=false`（`schemas` 未挂原生）时同名遮蔽仍进池 | `test/tool-shadow-universal.test.mjs` ①②③ | PASS |
| 0.2.1 `restrict` 场景（agent 视图仍含插件工具）仍进池 | 同上 ④ | PASS |
| 任意工具名（`apply_patch` / `edit` / `plugin:custom`）都进池，非样例特判 | 同上 ⑤ | PASS |
| 遮蔽行 source 标继承层、`shadowedBy` 指向 agent 工具、`keySuffix='shadowed'` | 同上 ①③ + `test/tool-shadow.test.mjs` | PASS |
| 不误判 agent 新增 / 同一注册不拆行 / 跨预设不串台 / 无活动 agent 不抛错 / 工具目录状态不变 | 同上 ⑥ | PASS |
| 反例 | 判定换回单点 `presetDefs.get(name) !== liveDefs.get(name)` 时 ①②③ 必须失败；为 `read` 写死特判时 ⑤ 必须失败 | 已写入新测试文件头注释并实测 |

## 2.1.2 当前验证（工具目录与真实会话同源）

> 来自本机 `npm run check`（2026-11-09）：全量单测 **175/175 通过**、构建产物重建、宿主 / 客户端 smoke 全绿。真宿主 E2E 由使用者自行校验。

| 场景 | 覆盖 | 结果 |
|---|---|---|
| 右栏可见工具目录 = agent scope 注册视图（含 `apply_patch` / `undo_last_edit`），计数与右栏同源 | `test/tool-catalog-scope.test.mjs` ① | PASS |
| 无 live agent 回落纯预设装配；右栏与 `/session` 同源 | 同上 ②③ | PASS |
| PTC 塌缩防护（`assemble().tools` 只剩 `run_code` 时仍用 `schemas(agent)`） | 同上 ④ | PASS |
| 纯新增 agent 工具不伪造 `masked-shadow`、`read` 仍是真同名遮蔽 | 同上 ⑤ | PASS |
| 只读池纳入 `locked-agent`（会话级徽标）、`stateBadge` 四态 | `test/tool-mask-pool.test.mjs` | PASS |
| 反例 | 主源换回 `toolSchemasOf(ctx, scopeKey, true)`（presetScopeKey）时 ①③④ 必须失败 | 实测 ①③④ 全红、②⑤ 仍绿 |

## 2.2.0 当前验证（面板 = 请求真值）

> 本节是 2.2.0「生效视图同源」（ADR-0006）的验证清单。门禁 `npm run check`，真浏览器 `scripts/verify-panel-browser.mjs`。结果按实测原始输出填写：单测与主机 HTTP 实测已跑；**面板 DOM 渲染与前端轮询未跑**（本机无 Chrome），故标「未跑」或「部分」。

| 场景 | 覆盖 | 结果 |
|---|---|---|
| 主列表生效判定（外部 `restrict` 隐藏的工具不进可编辑主列表） | `test/effective-view.test.mjs` ① | PASS — `npm run check` → 189/189，exit 0 |
| 本插件遮蔽留原位（`controllable && hidden` + `ownHidden`，可反选） | `test/effective-view.test.mjs` ④；web 主机实测 `pwsh` 行 | PASS — 单测绿；实测行字段 `{"state":"controllable","hidden":true,"ownHidden":true}` |
| 双组只读池（可反选 `masked-own` / 不可反选 `masked-plugin` · `masked-shadow` · `masked-ptc`） | `test/tool-mask-pool.test.mjs` | PASS — 单测绿（分组与只读性）；面板渲染未跑（本机无 Chrome） |
| 同名多来源枚举（`layer` = global / preset / agent，`shadowedBy` 指向生效来源） | `test/effective-view.test.mjs` ⑤ ⑧；web 主机实测 `read` 行 | PASS — 实测两条：`controllable`(layer preset) + `masked-shadow`(layer global)，无假 `masked-plugin` |
| PTC 折叠（`truth.ptcCollapsed`、工具行 `masked-ptc`、提示词段仍可枚举） | `test/effective-view.test.mjs` ⑥ | PASS — 单测绿 |
| 未链接会话降级（`truth.linked === false`，不判外部不可见、不抛错） | `test/effective-view.test.mjs` ③；web 主机实测 | PASS — 实测 `truth={"linked":false,"source":"preset","ptcCollapsed":false}`；横幅渲染未跑 |
| revision 自动刷新（版本变化后自动重取真值） | `test/effective-view.test.mjs` ⑦；`Panel.tsx` 轮询 | 部分 — 路由与单调性单测绿、主机实测 `revision` 可用；前端轮询未实测（本机无 Chrome） |
| 反例 | 关掉外部隐藏后 `pwsh` 必须回到 `controllable`（②）；无会话时同名覆盖不得标 `masked-plugin`（⑧） | PASS — 两条反例单测均绿 |

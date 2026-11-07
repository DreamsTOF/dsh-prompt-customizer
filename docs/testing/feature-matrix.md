# 终测：功能点矩阵与自动化覆盖

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

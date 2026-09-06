/**
 * 中文段译本（专属定制）—— tool:dsh-undo-savepoint。
 * 用户触发短语（"撤销上一步"、"redo" 等）、"⚠️ Previous DSH run did not
 * finish starting" 告警前缀、主动提示的固定话术（配置已自动保存为快照…）
 * 都是匹配 / 输出用的精确字符串，逐字保留。
 */
export const UNDO = `## 撤销 / 回退（dsh-undo-savepoint）
当用户要求撤销上一步操作（"撤销上一步"、"回退"、"恢复"、"redo"、"保存快照"、"查看快照"）—— 通常发生在安装插件、应用皮肤或更改设置之后 —— 不要靠猜、也不要手动改配置文件：
1. 调用 undo_list 展示可用快照（配置变更时自动创建，外加手动快照）。
2. 调用 undo_restore：mode "undo" 撤销最近一次变更，mode "redo" 重新应用上一次 undo 之前保存的状态，或 mode "id" 配合 undo_list 里的快照 id 恢复。拿不准时先用 undo_diff 预览。
3. undo_restore 绝不销毁当前状态（会先存为 pre-restore 快照），并会重新确保 dsh-undo-savepoint 挂载本身。
4. 手动快照与自动快照分开存放（settings: manualDir / autoDir）。
5. 主动提示：只要用户提到或执行了配置变更（安装插件、应用皮肤、修改设置），主动告诉用户"配置已自动保存为快照,改错了随时可以撤销/回退"，并主动提出可以用 undo_list 展示最近的快照。不要等用户来问。
6. 崩溃告警：如果 undo_list 的输出以 "⚠️ Previous DSH run did not finish starting" 开头，主动建议回退到最近一次良好状态（undo_restore mode "undo"），并说明上一次运行在本插件启动完成之前就崩溃了。
7. 配置状态困惑：当用户对当前配置感到困惑（某个插件/皮肤/设置突然消失或变了样，或陷入漫长而无果的调试循环），先调用 undo_recent 检查最近是否有回退能解释它；有就明确告诉用户哪些文件在何时被回退。回退可能发生在另一个会话或经由离线工具执行，用户/AI 可能没有亲眼见到。
8. 插件代码：快照也包含用户插件的 CODE 文件（node_modules 下的 junction 目标，例如 D:\\dsh\\plugins\\*，以及 router-global.mjs 之类 profile 本地文件）。插件代码被改坏（例如 "yield* (intermediate value) is not async iterable"）同样可以回滚，即使没有任何配置文件变化 —— undo_list 的行会显示插件文件数。
9. 安全模式（SAFE MODE）：当 DSH 完全无法启动或某个插件破坏了启动流程时，用 undo_safe_mode 的 action "on" 停用除 undo 之外的所有用户插件，然后重启 DSH 再排查；action "off" 恢复之前的插件集合（需再次重启）。undo_list 的崩溃告警会指名一个具体的最近良好快照用于恢复（undo_restore mode "id"）。
注意：本系统只回滚 DSH 的配置/插件/皮肤状态，不回滚聊天记录。`

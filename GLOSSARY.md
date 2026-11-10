# 术语表（Glossary）

本文件只定义领域术语，不含实现细节。

## 提示词相关

- **系统提示词段（System Prompt Section，简称“段”）**：会注入到“系统提示词”的内容单元。面板可对其做显示/隐藏（及既有的替换、注入、排序）。2.1.0 起，无论注册在 global / preset / agent 哪一层，都在预设编辑面板里被动态枚举（ADR-0005）。
- **运行时上下文（Runtime Context，contexts）**：宿主在装配时提供的附加内容。其中**并入系统提示词**的部分，按“系统提示词段”对待并可显隐；真正的 user-role 消息、工具结果等**不并入系统提示词**的内容，不属于本系统管理范围。
- **首次运行注册段（First-run Registered Section）**：插件在首次挂载/运行过程中才注册的系统提示词段，包括插件在 `agent/created` 里用 `agent.ctx.systemPrompt.section()` 动态注册的会话级段。它属于“段”，应被动态枚举并可显隐（ADR-0005）。
- **来源（Source）**：条目所在的**注册层**：global / preset（带预设 id）/ agent（带会话 id）/ executor / workspace；宿主能提供 provider id 时再附带。用于区分同名不同源。agent 来源在运行时带会话 id，但**清单与预览里统一收敛为 `{kind:'agent'}`**（不带 id），让按预设存的配置跨会话命中（2.1.0 / ADR-0005 D4）。
- **条目身份（Entry Identity）**：段、工具、运行时上下文的通用标识 = **名字 + 来源**；同名不同源是不同条目。
- **段身份（Section Identity）**：一个段的标识 = **名字 + 来源**（条目身份在段上的实例）。
- **真实装配预览（Real Assembly Preview）**：预览内容 = 「该预设 + 同预设活动 agent」真实装配后**实际发给模型的系统提示词**，只含系统提示词段，不含工具声明/schema/签名；无活动会话（或同预设无活动 agent）时，退回“跑一次该预设的真实装配”。2.1.0 起提示词正文、2.1.2 起右栏可见工具目录都与只读 `/session` 同源（工具数据源为 `ctx.tools.schemas(agent)`，不是预设装配）。

## 工具相关

- **工具提示词段（Tool Prompt Section）**：以 `tool:<name>` 或 `tool:<group>` 注册的 `systemPrompt.section`，是工具的第一部分；一个段可以服务多个工具（如 jobs / pty / goal / schedule / subagent），与工具 description、JSON Schema 相互独立。
- **工具描述（Tool Description）**：工具声明里的 `description`，走 `GenerateOptions.tools`，**不是系统提示词段**；本插件不能单独隐藏 / 编辑它，只能通过“工具显隐”整工具控制（ADR-0005 明确不纳入）。
- **工具签名（Tool Schema / Signature）**：工具声明（名称、`description`、参数 JSON schema、函数签名）。**不可编辑**；只能通过“工具显隐”决定是否可用。
- **工具显隐（Tool Visibility）**：控制某工具对模型是否可用（启用/禁用）。
- **遮蔽池（Masked Pool）**：只读「完整目录 / 已遮蔽」池中的**工具**行：被别的插件 `restrict`（`masked-plugin`）、被本插件 MCP 遮蔽（`masked-own`）、被 agent 作用域的同名插件工具顶掉（`masked-shadow`，2.1.1）、以及插件在 agent 作用域**纯新增**、继承层无同名原定义的工具（`locked-agent`，2.1.2 按「会话级」如实列出，不伪称遮蔽）。段的屏蔽走 `sections*` 配置名单，不进遮蔽池。
- **启用列表（Enabled List）**：当前对模型可见/可用的工具集合。
- **工具身份（Tool Identity）**：一个工具的标识 = **名字 + 来源**（同名不同源是不同的工具条目）。

## 预设与层级

- **预设隔离（Preset Isolation）**：每个 agent 预设的段与工具互不混用；清单与预览只反映「该预设 + 同预设活动 agent」的真实装配结果，绝不拿别的预设会话的会话级段顶替（ADR-0005 D5）。
- **预设级（Preset Level）**：提示词 / 工具定制的唯一活跃归属；按 agent 预设保存与生效。工作区级提示词/工具层已移除（源码归档、数据休眠）。
- **三态（Three Phases）**：引导期（bootstrap）/ 压缩受控期（compaction）/ 常驻期（active）。
- **三态同步（Three-phase Sync）**：打开后，对段、工具、运行时上下文的改动在三个阶段一起生效。
- **工作区级归档（Workspace-level Archive）**：工作区级提示词/工具源码保留在原目录备查，但不参与入口、构建装配、路由、备份或显示；`workspaceOverrides` 数据字段休眠。
- **通用会话项（Generic Session Item）**：agent 作用域中由插件动态注册的会话级条目。2.1.0 起只有**同预设活动 agent** 的这类条目才并入该预设的清单 / 预览；切到别的预设不混入（ADR-0005 D5）。
- **阶段化替换（Phase-scoped Replacement）**：只对已存在段生效、并按阶段（always/bootstrap/active/compaction）分别生效的文本替换；绝不新建段。
- **阶段描述表（Phase Descriptor Table）**：三阶段唯一描述表（key、段字段、上下文字段、工具字段、状态）；所有模块从它派生，禁止各自手写三份映射。
- **技能目录扫描升级（Skill Scan Upgrade）**：本插件对工作区技能根做的扫描；内核 `snapshot()` 不覆盖工作区 skills/MCP，因此扫描始终执行并与内核条目合并。

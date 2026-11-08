# 术语表（Glossary）

本文件只定义领域术语，不含实现细节。

## 提示词相关

- **系统提示词段（System Prompt Section，简称“段”）**：会注入到“系统提示词”的内容单元。面板可对其做显示/隐藏（及既有的替换、注入、排序）。
- **运行时上下文（Runtime Context，contexts）**：宿主在装配时提供的附加内容。其中**并入系统提示词**的部分，按“系统提示词段”对待并可显隐；真正的 user-role 消息、工具结果等**不并入系统提示词**的内容，不属于本系统管理范围。
- **首次运行注册段（First-run Registered Section）**：插件在首次挂载/运行过程中才注册的系统提示词段。它属于“段”，应被动态枚举并可显隐。
- **来源（Source）**：条目所在的**注册层**：global / preset（带预设 id）/ agent（带会话 id）/ executor / workspace；宿主能提供 provider id 时再附带。用于区分同名不同源。
- **条目身份（Entry Identity）**：段、工具、运行时上下文的通用标识 = **名字 + 来源**；同名不同源是不同条目。
- **段身份（Section Identity）**：一个段的标识 = **名字 + 来源**（条目身份在段上的实例）。
- **真实装配预览（Real Assembly Preview）**：预览内容 = 该预设（叠加其工作区）**实际发给模型的系统提示词**，只含系统提示词段，不含工具声明/schema/签名；无活动会话时，以“跑一次该预设的真实装配”的结果为准。

## 工具相关

- **工具描述（Tool Description）**：工具在提示词中的文字说明，属系统提示词内容。
- **工具签名（Tool Schema / Signature）**：工具声明（名称、参数 JSON schema、函数签名）。**不可编辑**；只能通过“工具显隐”决定是否可用。
- **工具显隐（Tool Visibility）**：控制某工具对模型是否可用（启用/禁用）。
- **遮蔽池（Masked Pool）**：当前被隐藏/禁用的工具集合。
- **启用列表（Enabled List）**：当前对模型可见/可用的工具集合。
- **工具身份（Tool Identity）**：一个工具的标识 = **名字 + 来源**（同名不同源是不同的工具条目）。

## 预设与层级

- **预设隔离（Preset Isolation）**：每个 agent 预设的段与工具互不混用；清单与预览只反映该预设的真实装配结果。
- **预设级 / 工作区级（Preset / Workspace Level）**：定制作用的两层归属；工作区级覆盖预设级。
- **三态（Three Phases）**：引导期（bootstrap）/ 压缩受控期（compaction）/ 常驻期（active）。
- **三态同步（Three-phase Sync）**：打开后，对段、工具、运行时上下文的改动在三个阶段一起生效。
- **工作区候选超集（Workspace Candidate Superset）**：工作区级清单 ⊇ 所选预设级清单；工作区可把预设条目置为隐藏（仍列出并标 blocked），但不能让它凭空消失。
- **通用会话项（Generic Session Item）**：agent 作用域中**不属于任何已声明预设**的条目；只有这类条目才允许并入预设/工作区视图，避免跨预设串号。
- **阶段化替换（Phase-scoped Replacement）**：只对已存在段生效、并按阶段（always/bootstrap/active/compaction）分别生效的文本替换；绝不新建段。
- **阶段描述表（Phase Descriptor Table）**：三阶段唯一描述表（key、段字段、上下文字段、工具字段、状态）；所有模块从它派生，禁止各自手写三份映射。
- **技能目录扫描升级（Skill Scan Upgrade）**：本插件对工作区技能根做的扫描；内核 `snapshot()` 不覆盖工作区 skills/MCP，因此扫描始终执行并与内核条目合并。

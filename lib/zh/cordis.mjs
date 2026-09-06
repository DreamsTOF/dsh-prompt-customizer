/**
 * 中文段译本（专属定制）—— tool:cordis。
 * cordis_* 工具名、pluginId / packageId / pluginRunId / currentPackageId /
 * nextPackageId 等运行时标识、@pluginId 引用语法、示例代码块逐字保留。
 */
export const CORDIS = `# 动态 Cordis 插件

动态 Cordis 插件临时扩展当前 DSH 进程。插件用 apply(ctx) 消费服务、监听事件、提供服务、注册模型工具，或在槽位（Slot）中注册浏览器 UI。

- 插件与包（Package）的定义只存在于当前进程。define 本身不修改仓库源码、配置或磁盘，定义也不会在进程重启后保留。
- 受限执行环境防的是误用，不是针对恶意代码的安全边界。动态代码取得的服务连接的是真实运行时。

## 先把面向用户的计划说清楚

- 动态 Cordis 插件是可选的实现机制之一，不是所有请求的默认选项。只有当用户打算设计或创造某样东西，或一个临时界面能实质性帮助当前工作时，才考虑用它。这些指令或相关工具的存在，以及关于 Cordis 本身的讨论，都不意味着请求就是动态插件任务。
- 当 Cordis 可能合适时，从请求与对话推断意图中的工作目标与生命周期。只有当成果属于当前运行中的 Harness、且应作为临时运行时扩展交付时才使用它。如果这个区分实质性地模糊，最多问一个关于预期结果或生命周期的简短问题；否则按匹配的工作流继续，不要要求用户了解或选择 Cordis 作为实现机制。
- 一旦确定动态插件合适，判断任务是创建新插件，还是用 @pluginId 修改用户指名的插件。目标明确时直接进行，不要反复请求确认。
- 从请求的成果出发选择宿主（Host）、客户端（Client）或两者。任务不需要可见的页面行为时，不要提议客户端/浏览器 UI；当请求的成果是可视化、可交互或依赖页面状态时，也不要回避客户端。宿主还是客户端是实现选择，不要让用户去选。
- 当设计方向或一个潜在有用的界面会实质性影响结果时，最多问一个关于成果或创作偏好的简短问题，并给出几个候选方向；否则直接进行，不要搞多轮访谈或复杂问卷。
- cordis_define 只定义并呈现代码，不会运行它。定义之后，说明宿主返回的 pluginId 与 packageId，以及下一步是 run 还是 update。
- cordis_run 可能需要用户批准。返回 awaiting-approval 时，说明用户需要在 UI 里允许或拒绝。不要等待、重试或声称它已在运行。
- 返回 starting 时，说明请求已进入异步流程，客户端仍在激活。starting 不代表成功。等系统通过 steering 上下文报告最终结果。
- 用户拒绝后不要再请求批准。技术失败后，从该插件的诊断出发修复同一个插件；不要悄悄另建替代插件。

## 推荐工作流与工具

创建、修改或修复插件之前，先加载 cordis-plugin-development 技能（Skill）。该技能提供需求导航、能力组合、完整示例与故障排查。把 Inspect Provider 的结果当作确切 API 的唯一事实来源。

1. cordis_inspect_list：发现当前宿主与客户端的 Provider 及其只读查询方法。
2. cordis_inspect_query：用返回的 platform、provider、method 与 schema 查询确切的服务、事件、内建（Builtin）、槽位、主题 token 或工具信息。
3. cordis_inspect_self：查看当前会话的插件、包、版本指针、源码与诊断。只有同时给出 pluginId 与 packageId 才返回源码。
4. cordis_define：为新插件创建第一个包，或向既有插件追加一个不可变包。它定义代码但不运行。
5. cordis_run：激活确切的包。首次激活、重启当前或回滚用 run；切换版本用 update。
6. cordis_stop：移除当前 Run 与待批准请求，但保留定义、授权与版本指针。
7. cordis_undefine：永久停用并删除一个插件及其所有包。只在确认用户不再需要后使用。

- 在写代码之前，Inspect 与目录（Catalog）数据只用于确认能力、名字、签名、类型与注册协议；它们不替代业务 API。
- 不带输入调用 Service.listService 与 Event.listEvents，从紧凑的签名目录里挑选，然后再精确查询目标服务或事件。精确查询返回结构化契约及其引用的类型。
- 运行时，插件必须调用真实服务、监听真实事件。不要缓存、展示 Inspect 结果，也不要把它当业务数据依赖。

## 身份、版本与批准

- pluginId 标识一个可以随时间修改的插件。新建插件只提交 3–6 个小写英文字母的语义化 idPrefix；最终 ID 由宿主分配。
- packageId 标识插件下一个不可变的宿主/客户端源码版本。要改代码就定义新包，绝不覆盖旧版本。
- pluginRunId 标识一次激活尝试，关联其批准、宿主/客户端加载、私有 RPC、Run 卡片与错误。
- currentPackageId 是最近一次完全成功的包。停止、启动更新或更新失败都不会清除它。
- nextPackageId 是等待批准、正在尝试、等待客户端激活或最近失败的目标包。
- 单个对勾只批准当前包；双对勾批准同一插件未来的版本。技术失败后授权仍然有效。
- 更新会在启动目标包之前停止旧 Run。失败不会自动重启旧版本；之后用 update 重试，或用 run 回滚到 current。

当用户输入 @pluginId 时，系统注入身份、默认基础包、版本指针与运行状态，但不注入源码：

1. 调用 cordis_inspect_self(pluginId, packageId) 读取目标源码。
2. 以既有模式使用 cordis_define，向同一插件追加包。
3. 按版本关系以 run 或 update 模式调用 cordis_run。

绝不为 @pluginId 悄悄另建插件。如果该引用因为被删除、属于别的会话或随进程重启丢失而不可用，直接告诉用户。

## 必须避免的高频错误

### 服务：ctx.get 与 inject

- 默认用 ctx.get('serviceName') 读取可选服务，并处理 undefined。
- 只有当该服务是硬依赖、且插件必须进入等待（直到 Cordis 在服务出现后重新激活它）时，才在返回的插件对象上声明 inject: ['serviceName']。
- 只有在 inject 里声明过某服务后，才能以 ctx.serviceName 属性方式读取。绝不要以 ctx 属性访问未声明的服务。

\`\`\`js
return {
  inject: ['requiredService'],
  apply(ctx) {
    ctx.requiredService.someMethod()
    const optionalService = ctx.get('optionalService')
    if (optionalService !== undefined) optionalService.someMethod()
  },
}
\`\`\`

### 代码：只用普通 JavaScript

- 宿主与客户端代码不经 TypeScript、JSX 或打包器转换。
- 不要用 TypeScript 类型、as、装饰器、import、require 或 JSX。
- 客户端 React 代码必须用 React.createElement(...)；绝不写 <Component />。
- 不要假设 process、Buffer、window、document、fetch、原生定时器或任何其它全局可用。先查询对应平台的 Builtins 与服务。

### 数据：不要序列化活数据

- 服务、事件、槽位、会话及其衍生的 Cordis/DSH 对象是内部活数据，不是可以倾倒的普通 JSON。
- 不要对活数据使用 JSON.stringify、structuredClone、递归枚举、整体复制或整对象展示。
- 只读取任务所需的叶子字段，然后构造不带宿主引用的最小自有数据对象。

### 生命周期：每个副作用都必须可逆

- 服务、事件、工具、处理器、定时器、槽位、样式与主题覆盖都必须属于当前 Fiber。
- 用 ctx.effect()、ctx.on() 或返回 disposer 的官方 API，保证 stop、update 或 undefine 能移除每个副作用。
- cordis-plugin-development 技能包含定时器、瀑布流、槽位、主题、工具、RPC 与 React 的完整示例与故障排查。

## 宿主与客户端

- 宿主运行在 DSH 的 Node.js 进程里，适合文件、网络、命令、Agent/会话访问、宿主事件、服务、模型工具，以及可被客户端调用的 JSON 方法。
- 客户端运行在浏览器页面里，适合主题、布局、当前页面状态、工具卡片与槽位 UI。
- 宿主与客户端通过包私有的 JSON 方法通信：宿主用 harness.handle(method, handler)，客户端用 host.call(method, args)。方向是客户端→宿主，且只有无损 JSON 可以跨越它。
- 客户端 UI 必须注册在查询到的槽位里；apply() 不能直接返回 React Element。不带 root 查询 Slots.listSubTree，从紧凑的目的/拓扑树里挑选，然后再精确查询目标 root 的完整注册契约与 props，之后才写代码。
- Run 专属面板与确切的槽位注册模式见技能与 Inspect Provider。

## 异步结果与恢复

- 不要在工具里等待只有当前回合结束后才可能发生的批准或浏览器工作。
- 异步成功、拒绝与运行时错误会更新 Run 状态，并通过 steering 上下文通知你。
- 技术失败后，用 cordis_inspect_self 读取确切包源码及其 message/stack。在同一插件下定义一个修正后的包并自主重试。
- 其它失败原因、修复流程与完整扩展模式，使用 cordis-plugin-development 技能。`

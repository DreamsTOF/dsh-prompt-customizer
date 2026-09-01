/** 提示词定制面板（客户端）的共享类型定义。 */

/** 宿主路由返回的清单载荷：当前生效的提示词段与工具目录。 */
export interface Inventory {
  sections: Array<{ name: string; order: number; text?: string; active: boolean; replaced: boolean }>
  tools: Array<{ name: string; description?: string; hidden: boolean }>
  /** false = 预设 scope 未能挂载，清单回退到了全局层。 */
  scopeResolved?: boolean
  /** 当前已注册的提示词变量名（内置 + 黑名单过滤后的 env），供引用参考。 */
  variables?: string[]
}

/** `/api/prompt-customizer/agent-presets` 返回的一个已安装 agent 预设。 */
export interface AgentPresetInfo {
  id: string
  name: string
  description?: string
  /** 非空表示该预设损坏、无法挂载（只读展示）。 */
  broken?: string
}

/** 注入段生效阶段：`always` 恒定；`bootstrap` 仅未晋级；`compaction` 仅压缩后未晋级；`active` 仅晋级后。 */
export type Phase = 'always' | 'bootstrap' | 'active' | 'compaction'

/** 三阶段名义视图键（预览装配的锚定阅读顺序：引导 → 常驻 → 压缩受控）。
 *  三个阶段恒定全部显示 —— 预设没有某个阶段时，该部分就是空的。 */
export type PhaseViewKey = 'bootstrap' | 'compaction' | 'active'

/**
 * 工具过滤配置：三份 exclude 黑名单，一一对应三个阶段，各管各的、互不继承 ——
 * 静态 `exclude` 管常驻期（已晋级），`bootstrap` 管引导期（未晋级），
 * `compaction` 管压缩受控期（压缩后仍未晋级）；空名单 = 该阶段不隐藏任何工具。
 * 没有白名单语义：过滤只能收窄装配已经给出的目录，要限制某阶段就逐项 exclude。
 */
export interface ToolsConfig {
  exclude?: string[]
  /** 该阶段要加回来的工具（被裁掉、但注册表里仍有的）。 */
  add?: string[]
  bootstrap?: { exclude?: string[]; add?: string[] }
  compaction?: { exclude?: string[]; add?: string[] }
}

/** 一份覆盖配置：与全局字段同构。作用于某个 agent 预设 id 时，
 *  非空字段整体接管全局默认，空缺 / 空列表回落全局。 */
export interface OverrideData {
  sections?: string[]
  sectionsBootstrap?: string[]
  sectionsCompaction?: string[]
  replace?: Record<string, string>
  inject?: Array<{ name: string; order: number; text: string; phase?: Phase; custom?: boolean }>
  tools?: ToolsConfig
}

/** 宿主路由返回的最终装配预览载荷。 */
export interface Preview {
  ok: boolean
  scope?: unknown
  /** false = 预设 scope 未能挂载，预览回退到了全局层装配。 */
  scopeResolved?: boolean
  /** true = 伪会话让某个预设插件抛错，本次预览降级为无会话装配。 */
  degraded?: boolean
  /** 非空 = 该 scope 有一以 `complete: true` 注册的段（值为段名）整段接管
   *  最终提示词：宿主在装配瀑布流**之后**把 sections 还原成那一条段，本插件
   *  的段级屏蔽 / 替换 / 注入 / 排序都不会进入模型看到的提示词（工具过滤不受影响）。 */
  takenOverBy?: string
  /** 非空 = 本插件在该阶段产出的段有若干被下游装配规则丢弃（模型看不到）：
   *  emitted = 我们产出的段数，survived = 最终装配存活的段数。 */
  lostSections?: { emitted: number; survived: number; dropped: number }
  /** 注册表原始目录总数：与 tools（模型可见目录）形成 presentation 层对照。 */
  registryTotal?: number
  /** 该 scope 注册表的工具名清单：区分「在本预设里、只是被该阶段裁掉」与
   *  「根本不属于本预设（无法加回）」。 */
  registryTools?: string[]
  sections: Array<{ name: string; text: string }>
  text: string
  /** 元素可能是对象，也可能是纯字符串工具名（宿主端两种形态都可能出现）。 */
  tools: Array<{ name: string; description: string } | string>
  /** 预过滤段视图：进入本插件过滤前的段原文 + 该阶段独立屏蔽 / 替换标记
   *  （提示词 / 工具 / 预览三个 Tab 的统一数据源；被屏蔽项仍在此可反选）。 */
  baseSections?: Array<{ name: string; text: string; blocked: boolean; replaced: boolean }>
  /** 预过滤工具视图：进入本插件过滤前的工具原文 + 该阶段隐藏标记。 */
  baseTools?: Array<{ name: string; description: string; hidden: boolean }>
}

/** 解析后的命名空间配置对象（即作用域中的 value）。 */
export interface Config {
  sections?: string[]
  /** 每阶段独立段屏蔽：引导期 / 压缩受控期各自的屏蔽名单（与常驻期互不影响）。 */
  sectionsBootstrap?: string[]
  sectionsCompaction?: string[]
  replace?: Record<string, string>
  /** custom 为隐藏标记：true 表示本插件注入（可删除），不依赖名字碰撞识别。 */
  inject?: Array<{ name: string; order: number; text: string; phase?: Phase; custom?: boolean }>
  tools?: ToolsConfig
  /** 强制覆盖（默认 true）：装配入口重建提示词段，所有预设一律以本插件为准。
   *  为 false 时退回瀑布流内过滤（complete 接管 / 预设裁段可能压过定制）。 */
  forceSections?: boolean
  /** 环境变量黑名单（全局字段）：命中的 process.env 键不注册为提示词变量。
   *  条目支持 `*` 通配、大小写不敏感；缺省 = 预填的常见密钥类名单。 */
  envBlocklist?: string[]
  presets?: Preset[]
  activePreset?: string
  /** 按 agent 预设 id 的字段级覆盖。 */
  overrides?: Record<string, OverrideData>
}

/** 一份完整的定制快照，可保存 / 应用 / 导出导入。 */
export interface Preset {
  id: string
  name: string
  data: PresetData
}

/** 预设捕获的定制字段（完整快照，含每阶段独立设定）。
 *  可选字段一律「缺省 = 旧快照」：应用时旧快照没有的字段保留当前配置不抹掉。 */
export interface PresetData {
  sections?: string[]
  /** 引导期 / 压缩受控期各自的屏蔽名单（与常驻期互不影响）。 */
  sectionsBootstrap?: string[]
  sectionsCompaction?: string[]
  replace?: Record<string, string>
  /** 相对顺序：每段记录它应跟随的前一段（after）与所属阶段（phase）。
   *  同名而 phase 不同的多条 = 该段在多个阶段各有自己的位置；phase 缺省
   *  always = 旧快照的单一全局序。 */
  order?: Array<{ name: string; after?: string; text: string; custom?: boolean; phase?: Phase }>
  /** 除静态 exclude 外，还可带 bootstrap / compaction 阶段目录。 */
  tools?: ToolsConfig
}

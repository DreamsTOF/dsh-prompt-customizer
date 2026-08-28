/** 提示词定制面板（客户端）的共享类型定义。 */

/** 宿主路由返回的清单载荷：当前生效的提示词段与工具目录。 */
export interface Inventory {
  sections: Array<{ name: string; order: number; text?: string; active: boolean; replaced: boolean }>
  tools: Array<{ name: string; description?: string; hidden: boolean }>
  /** false = 预设 scope 未能挂载，清单回退到了全局层。 */
  scopeResolved?: boolean
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

/** 三阶段名义视图键（预览装配的锚定阅读顺序：引导 → 压缩 → 晋级）。 */
export type PhaseViewKey = 'bootstrap' | 'compaction' | 'active'

/**
 * 预设真实拥有的一个阶段：按 (段, 工具) 签名把三套名义装配去重后的代表。
 * `merged` 列出折叠进同一阶段的全部名义视图 —— 长度 > 1 表示该阶段在
 * 此预设的 agent 周期里只呈现一种形态（如 standard 三态同形折叠为常驻）。
 */
export interface CycleEntry {
  /** 从 PhaseViews 取装配结果的键（分组首个名义视图）。 */
  key: PhaseViewKey
  /** 折叠进本阶段的全部名义视图。 */
  merged: PhaseViewKey[]
}

/**
 * 工具过滤配置：静态 exclude/include + 两个阶段性目录 —— bootstrap
 * （未晋级时生效）与 compaction（压缩后仍未晋级时生效，优先于 bootstrap）。
 */
export interface ToolsConfig {
  exclude?: string[]
  include?: string[]
  bootstrap?: { exclude?: string[]; include?: string[] }
  compaction?: { exclude?: string[]; include?: string[] }
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
  /** 注册表原始目录总数：与 tools（模型可见目录）形成 presentation 层对照。 */
  registryTotal?: number
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
  /** 每阶段独立段屏蔽：引导期 / 压缩受控期的额外屏蔽名单（空 = 回落全局）。 */
  sectionsBootstrap?: string[]
  sectionsCompaction?: string[]
  replace?: Record<string, string>
  /** custom 为隐藏标记：true 表示本插件注入（可删除），不依赖名字碰撞识别。 */
  inject?: Array<{ name: string; order: number; text: string; phase?: Phase; custom?: boolean }>
  tools?: ToolsConfig
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

/** 预设捕获的定制字段（完整快照）。 */
export interface PresetData {
  sections?: string[]
  replace?: Record<string, string>
  /** 相对顺序：每段记录它应跟随的前一段（after），跨提示词可移植。 */
  order?: Array<{ name: string; after?: string; text: string; custom?: boolean }>
  tools?: { exclude?: string[]; include?: string[] }
}

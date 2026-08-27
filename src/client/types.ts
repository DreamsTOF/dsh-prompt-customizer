/** 提示词定制面板（客户端）的共享类型定义。 */

/** 宿主路由返回的清单载荷：当前生效的提示词段与工具目录。 */
export interface Inventory {
  sections: Array<{ name: string; order: number; text?: string; active: boolean; replaced: boolean }>
  tools: Array<{ name: string; description?: string; hidden: boolean }>
}

/** `/api/prompt-customizer/agent-presets` 返回的一个已安装 agent 预设。 */
export interface AgentPresetInfo {
  id: string
  name: string
  description?: string
  /** 非空表示该预设损坏、无法挂载（只读展示）。 */
  broken?: string
}

/** 注入段生效阶段：`always` 恒定；`bootstrap` 仅未晋级；`active` 仅晋级后。 */
export type Phase = 'always' | 'bootstrap' | 'active'

/** 工具过滤配置：静态 exclude/include + 可选的未晋级阶段 bootstrap 目录。 */
export interface ToolsConfig {
  exclude?: string[]
  include?: string[]
  bootstrap?: { exclude?: string[]; include?: string[] }
}

/**
 * 一份覆盖配置：与全局字段同构。作用于某个 agent 预设 id 时，
 * 非空字段整体接管全局默认，空缺 / 空列表回落全局。
 */
export interface OverrideData {
  sections?: string[]
  replace?: Record<string, string>
  inject?: Array<{ name: string; order: number; text: string; phase?: Phase; custom?: boolean }>
  tools?: ToolsConfig
}

/** 宿主路由返回的最终装配预览载荷。 */
export interface Preview {
  ok: boolean
  scope?: unknown
  sections: Array<{ name: string; text: string }>
  text: string
  /** 元素可能是对象，也可能是纯字符串工具名（宿主端两种形态都可能出现）。 */
  tools: Array<{ name: string; description: string } | string>
}

/** 解析后的命名空间配置对象（即作用域中的 value）。 */
export interface Config {
  sections?: string[]
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

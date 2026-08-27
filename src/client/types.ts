/** 提示词定制面板（客户端）的共享类型定义。 */

/** 设置作用域：读写本插件命名空间配置的句柄，变更通过 subscribe 推送。 */
export interface SettingsScope {
  /** 当前快照：status = 加载状态；value = 命名空间值；writable = 是否可写。 */
  getSnapshot(): { status: string; value?: unknown; revision: number; writable: boolean }
  /** 订阅变更，返回取消订阅函数。 */
  subscribe(callback: () => void): () => void
  /** 写入单个字段（实时生效）。 */
  set(field: string, value: unknown): void
  /** 删除单个字段。 */
  unset(field: string): void
}

/** 宿主路由返回的清单载荷：当前生效的提示词段与工具目录。 */
export interface Inventory {
  sections: Array<{ name: string; order: number; text?: string; active: boolean; replaced: boolean }>
  tools: Array<{ name: string; description?: string; hidden: boolean }>
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
  inject?: Array<{ name: string; order: number; text: string; custom?: boolean }>
  tools?: { exclude?: string[]; include?: string[] }
  presets?: Preset[]
  activePreset?: string
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

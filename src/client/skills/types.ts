/**
 * skills/types — 面板拆分后的共享数据模型与常量。
 *
 * 含各面板共用的视图状态类型、技能/MCP 线协议形状、技能包分类常量；
 * 只放类型与纯函数，不引入任何运行时依赖。
 */
/** ---------------------------------------------------------------- 数据模型 */

export interface SkillInfo {
  name: string
  description?: string
  files?: string[]
  fileCount?: number
  compatibility?: string
  /** 技能目录名：与 name 可以不一致（手工拷目录、改名导入），删除/查看走它。 */
  dir?: string
}

export interface BundleInfo {
  id: string
  name: string
  skillCount: number
  skills: SkillInfo[]
  /** 账本里指向已消失技能的条目（面板给「清理失效引用」入口）。 */
  missingSkills?: string[]
  /** 技能包分类（一个包可挂多个）；老账本没有该字段时按未分类处理。 */
  categories?: string[]
}

export interface SkillSnapshot {
  bundles: BundleInfo[]
  loose: SkillInfo[]
}

export type PanelState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; snapshot: SkillSnapshot }
/** ---------------------------------------------------------------- 技能包分类 */

/** 建议分类：点一下就挂上；也允许自己写，账本里存的就是字符串本身。 */
export const PRESET_BUNDLE_CATEGORIES = ['开发', '设计', '办公协同', '文档知识', '数据', '自动化', '运维', '其他']

/** 分类筛选里代表「没挂任何分类的包」的哨兵值（不会是合法分类名）。 */
export const UNCATEGORIZED = '\u0000none'

/** 一个技能包最多挂几个分类（与 host 的 CATEGORY_MAX_PER_BUNDLE 对齐）。 */
export const MAX_BUNDLE_CATEGORIES = 8

/** 分类不做逐类配色：一个面板只有主题蓝一把刷子（彩虹色板实测太吵，已否）。 */

/** 分类名单排序：按挂载的包数从多到少，同数按名字。 */
export function sortCategories(counts: Map<string, number>): string[] {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh'))
    .map((entry) => entry[0])
}
/** 「全部 Agent」虚拟预设的哨兵 id（不会与真实 preset id 冲突：真实 id 不含 *）。 */
export const ALL_PRESETS = '*'
export type ConfirmState =
  | { kind: 'bundle'; bundle: BundleInfo }
  | { kind: 'skill'; name: string; dir?: string }
export type InstallState =
  | { archive: true; name: string; data: string; folderName: string }
  | { archive?: false; files: CollectedFile[]; folderName: string }
export type ViewerState = { skill: SkillInfo; file: string; loading: boolean; error?: string; content?: string }
/** 收集到的一个待安装文件：相对技能根的路径 + 浏览器 File 句柄。 */
export interface CollectedFile { path: string; file: File }
export type InstallInput =
  | { archive: string; description: string; bundleId?: string }
  | { skillName: string; description: string; bundleId?: string; files: Array<{ path: string; data: string }> }

/** 健康扫描的展示模型（顶栏健康指示的 tone / 文案 / 悬停详情）。 */
export interface HealthViewModel {
  tone: string
  label: string
  title: string
}

/** 技能目录健康检查（/api/skill-health 响应，host 只读扫描）。 */
export interface HealthIssue {
  level: 'error' | 'warn'
  code: string
  skill?: string
  bundle?: string
  message: string
}

export interface HealthReport {
  ok: boolean
  healthy: number
  issues: HealthIssue[]
}

/** 同步状态卡的展示态。 */
export type HealthView =
  | { state: 'loading' }
  | { state: 'ok'; report: HealthReport }
  | { state: 'issue'; report: HealthReport }
  | { state: 'unavailable' }

/** 技能开关状态(/api/skill-toggles/status 响应)。 */
export interface ToggleStatus {
  skills: Record<string, boolean>
  bundles: Record<string, boolean>
}

/** 一个 Agent 预设(host 从 ctx.agentPresets.list() 投影而来)。 */
export interface PresetRow {
  id: string
  trust: 'system' | 'user'
  isDefault?: boolean
  name?: string
  description?: string
  order?: number
}

/** /api/skill-toggles/presets 响应:名单 + 各预设覆盖 + 全局层状态。 */
export interface PresetStatus extends ToggleStatus {
  presets: PresetRow[]
  /** presetId → { skillName: false } —— 只有显式 false 才是「该预设下关闭」。 */
  overrides: Record<string, Record<string, boolean>>
}


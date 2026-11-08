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
  /** 来源标签（内核 `SkillSource`：user-agents / project-dsh / bundled / runtime …）。 */
  root?: string
  /** 宿主提供的来源桶（workspace / global 或 `{kind,label}`）；缺省时按 `root` 的 SkillSource 映射。 */
  origin?: string | { kind?: string; origin?: string; scope?: string; label?: string }
  /** 宿主提供的注册层（workspace / global / project / user）；与 origin 二选一。 */
  scope?: string
  /** 该技能是否落在可写根（决定「删除」能否真的删掉文件；显隐对所有来源一致）。 */
  deletable?: boolean
  /** 内核 invocation 策略：模型可调用 / 用户可调用（仅展示）。 */
  modelInvocable?: boolean
  userInvocable?: boolean
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
/** 「全部 Agent」虚拟预设的哨兵 id：空串，真实 preset id 的首字符必须是 a-z0-9。 */
export const ALL_PRESETS = ''

/**
 * preset id 是否合法：内核 agent-preset schema 只要求 string（任意非空），
 * 不能按目录名规则过滤自定义预设。空串是 `ALL_PRESETS` 哨兵，因此不可能与真实 id 撞上。
 * API 层写 preset 账本前统一走它校验。
 */
export function isValidPresetId(value: string): boolean {
  return value.trim() !== ''
}

/* ---------------------------------------------------------------- 技能来源 */

/**
 * 内核 `SkillSource` 枚举 → 面板的二桶来源。
 *
 * 宿主以后若直接在 `skill.origin` / `skill.scope` 上给出来源桶，优先用显式字段；
 * 否则在这里集中映射。未知来源原样展示（不猜成 global）。
 */
const SKILL_SOURCE_ORIGINS: Record<string, 'workspace' | 'global'> = {
  'project-dsh': 'workspace',
  'project-agents': 'workspace',
  'user-dsh': 'global',
  'user-agents': 'global',
  bundled: 'global',
  runtime: 'global',
  custom: 'global',
  // 宿主显式 origin 字段可能直接是桶名。
  workspace: 'workspace',
  global: 'global',
  project: 'workspace',
  user: 'global',
}

/** 技能来源的展示模型：known 桶用本地化文案，unknown 原样显示 source。 */
export type SkillOrigin =
  | { kind: 'workspace' | 'global'; label?: undefined }
  | { kind: 'unknown'; label: string }

/**
 * 解析一个技能的来源桶。
 * @param skill - 技能摘要。
 * @returns 无来源字段时 undefined；未知来源返回 kind=unknown + 原始标签。
 */
export function skillOriginOf(skill: SkillInfo): SkillOrigin | undefined {
  const raw = skill.origin ?? skill.scope
  if (typeof raw === 'string' && raw.trim() !== '') {
    const mapped = SKILL_SOURCE_ORIGINS[raw.trim()]
    return mapped === undefined ? { kind: 'unknown', label: raw.trim() } : { kind: mapped }
  }
  if (typeof raw === 'object' && raw !== null) {
    const bucket = [raw.kind, raw.origin, raw.scope]
      .find((value): value is string => typeof value === 'string' && value.trim() !== '')
    const label = typeof raw.label === 'string' && raw.label.trim() !== '' ? raw.label.trim() : undefined
    if (bucket !== undefined) {
      const mapped = SKILL_SOURCE_ORIGINS[bucket.trim()]
      return mapped === undefined ? { kind: 'unknown', label: label ?? bucket.trim() } : { kind: mapped }
    }
    if (label !== undefined) return { kind: 'unknown', label }
  }
  if (skill.root === undefined || skill.root.trim() === '') return undefined
  const source = skill.root.trim()
  const mapped = SKILL_SOURCE_ORIGINS[source]
  return mapped === undefined ? { kind: 'unknown', label: source } : { kind: mapped }
}

/* ---------------------------------------------------------------- 技能开关作用域 */

/** 技能开关的编辑层级。 */
export type SkillLevel = 'preset' | 'workspace'

/**
 * 技能开关的完整作用域：层级 + 预设 + 工作区（按 cwd）。
 * 「按钮显示」与「按钮动作」共用同一个对象，避免两层各读一套状态。
 */
export interface SkillEnableScope {
  level: SkillLevel
  presetId: string
  cwd: string | null
}

/** 三层开关账本（由 /api/skill-toggles 系列接口提供）。 */
export interface SkillEnableTables {
  /** 全局层：name → enabled。 */
  skills: Record<string, boolean>
  /** 预设层：presetId → name → enabled（显式 false = 该预设下关闭）。 */
  overrides: Record<string, Record<string, boolean>>
  /** 工作区层：cwd → name → enabled（显式 true 可覆盖预设/全局的关闭）。 */
  workspaceOverrides: Record<string, Record<string, boolean>>
  /** 指定 workspace 的生效基座（global + workspace，不含 preset 覆盖）。 */
  workspaceSkills?: Record<string, boolean>
}

/**
 * 某作用域下一个技能的开关值。
 *
 * 宿主闸门的真实优先级是「工作区 > 预设 > 全局」：工作区显式 true 也能打开
 * 预设/全局关掉的技能，所以这里不能用「全局 false 一票否决」的旧模型。
 *
 * @param scope - 编辑作用域。
 * @param name - 技能名。
 * @param tables - 三层账本。
 * @returns 该作用域下是否启用。
 */
export function enabledStateAt(scope: SkillEnableScope, name: string, tables: SkillEnableTables): boolean {
  if (scope.level === 'workspace' && scope.cwd !== null) {
    const workspace = tables.workspaceOverrides[scope.cwd] ?? {}
    if (Object.hasOwn(workspace, name)) return workspace[name] !== false
    const workspaceBase = tables.workspaceSkills?.[name]
    if (workspaceBase !== undefined) return workspaceBase !== false
  }
  if (scope.presetId !== ALL_PRESETS) {
    const preset = tables.overrides[scope.presetId] ?? {}
    if (Object.hasOwn(preset, name)) return preset[name] !== false
  }
  return tables.skills[name] !== false
}

/**
 * 该作用域实际会写入/清理的那层覆盖表（用于「清空单独设置」按钮的显示）。
 *
 * @param scope - 编辑作用域。
 * @param tables - 三层账本。
 * @returns 该作用域的覆盖表；「全部 Agent」或工作区未定时为空表。
 */
export function skillOverridesAt(
  scope: SkillEnableScope,
  tables: SkillEnableTables,
): Record<string, boolean> {
  if (scope.level === 'workspace') {
    return scope.cwd === null ? {} : (tables.workspaceOverrides[scope.cwd] ?? {})
  }
  return scope.presetId === ALL_PRESETS ? {} : (tables.overrides[scope.presetId] ?? {})
}

/**
 * 技能包是否需要在列表里保留一行。
 *
 * 空包必须保留（否则新建后无处可点）；账本里的成员全部失效（missingSkills>0）
 * 的包也必须保留，否则用户看不到「清理失效引用」入口。只有真正带筛选条件时，
 * 才允许隐藏「没有成员、也没有失效引用、也不是空包」的包。
 *
 * @param bundle - 技能包。
 * @param filtering - 当前是否带搜索/状态筛选。
 * @returns 是否渲染该技能包。
 */
export function bundleVisibleInList(
  bundle: Pick<BundleInfo, 'skills' | 'skillCount' | 'missingSkills'>,
  filtering: boolean,
): boolean {
  return bundle.skills.length > 0
    || (bundle.missingSkills?.length ?? 0) > 0
    || (bundle.skillCount === 0 && !filtering)
}
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
  | { archive: string; description: string; bundleId?: string; scope?: AddScope; workspace?: string }
  | { skillName: string; description: string; bundleId?: string; scope?: AddScope; workspace?: string; files: Array<{ path: string; data: string }> }

/**
 * 添加入口的作用域：`global`（~/.agents/skills、profile patch，所有工作区共用）
 * 或 `workspace`（技能写进当前工作区的 `.agents/skills`，MCP 写进项目根的
 * `.mcp.json` —— 主流 agent 通用格式）。
 * 默认 global。
 */
export type AddScope = 'global' | 'workspace'

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
  /** 指定 workspace 的生效基座，补齐 workspace 独有技能。 */
  workspaceSkills?: Record<string, boolean>
  workspaceBundles?: Record<string, boolean>
}


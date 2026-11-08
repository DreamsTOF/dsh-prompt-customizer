/** 提示词定制面板（客户端）的共享类型定义。
 *
 * 阶段与条目身份的唯一来源：
 *  - `PHASES` 是阶段唯一描述表（与服务端 model.js 同构）：段字段、上下文字段、
 *    工具字段全部由它派生，客户端不得再手写第二份三态映射。
 *  - 段 / 工具 / 运行时上下文的身份 = `{name, source}`；`source` 是注册层
 *    （global / preset / agent / executor / workspace），可带 provider id。
 *    同名不同源是不同条目。
 */

/** 条目来源的注册层。 */
export type SourceKind = 'global' | 'preset' | 'agent' | 'executor' | 'workspace'

/** 条目来源：注册层 + 可选 provider / 预设 / 会话标识。 */
export interface EntrySource {
  kind: SourceKind
  id?: string
}

/** 段 / 工具 / 上下文 / 名单条目的统一身份。 */
export interface EntryRef {
  name: string
  source?: EntrySource
}

/** 阶段键（引导期 / 常驻期 / 压缩受控期）。 */
export type PhaseKey = 'bootstrap' | 'active' | 'compaction'

/** 注入 / 替换条目可作用的阶段：`always` + 三个具体阶段。 */
export type Phase = 'always' | PhaseKey

export type SectionField = 'sectionsBootstrap' | 'sections' | 'sectionsCompaction'
export type ContextField = 'contextsBootstrap' | 'contexts' | 'contextsCompaction'

/** 阶段描述：唯一表的一行。 */
export interface PhaseDescriptor {
  key: PhaseKey
  sectionField: SectionField
  contextField: ContextField
  /** 该阶段的工具名单字段；常驻期用静态 `exclude`/`add`（此键缺省）。 */
  toolField?: 'bootstrap' | 'compaction'
  status: { promoted: boolean; boundary: number }
}

/** 阶段唯一描述表（与服务端 vendor/prompt-customizer/model.js 的 PHASES 同构）。 */
export const PHASES: readonly PhaseDescriptor[] = [
  { key: 'bootstrap', sectionField: 'sectionsBootstrap', contextField: 'contextsBootstrap', toolField: 'bootstrap', status: { promoted: false, boundary: -1 } },
  { key: 'active', sectionField: 'sections', contextField: 'contexts', toolField: undefined, status: { promoted: true, boundary: -1 } },
  { key: 'compaction', sectionField: 'sectionsCompaction', contextField: 'contextsCompaction', toolField: 'compaction', status: { promoted: false, boundary: 1 } },
] as const

/** 全部阶段的稳定顺序（唯一来源：PHASES）。 */
export const PHASE_KEYS: PhaseKey[] = PHASES.map((phase) => phase.key)

/** 阶段 → 文案键（所有 UI 统一从这里取阶段名）。 */
export const PHASE_LABEL_KEY: Record<PhaseKey, string> = {
  bootstrap: 'phaseStageGuide',
  active: 'phaseStageResident',
  compaction: 'phaseStageControlled',
}

/** 来源展示文案键。 */
export const SOURCE_LABEL_KEY: Record<SourceKind, string> = {
  global: 'sourceGlobal',
  preset: 'sourcePreset',
  agent: 'sourceAgent',
  executor: 'sourceExecutor',
  workspace: 'sourceWorkspace',
}

/** 完整目录的来源分组顺序。 */
export const SOURCE_KIND_ORDER: SourceKind[] = ['global', 'preset', 'workspace', 'agent', 'executor']

/** 把来源统一成对象：兼容服务端偶尔回传的字符串标识（仅读展示用）。 */
export function normalizeSource(source: EntrySource | string | null | undefined): EntrySource | undefined {
  if (source === null || source === undefined) return undefined
  // 旧数据里的纯字符串来源没有注册层信息，不能猜成 preset；按「来源未知」处理。
  if (typeof source === 'string') return undefined
  if (typeof source === 'object' && typeof source.kind === 'string') {
    return typeof source.id === 'string' && source.id !== '' ? { kind: source.kind as SourceKind, id: source.id } : { kind: source.kind as SourceKind }
  }
  return undefined
}

/** 来源的稳定键（`kind:id`）。 */
export function sourceKey(source: EntrySource | string | null | undefined): string {
  const normalized = normalizeSource(source)
  return normalized === undefined ? '' : `${normalized.kind}:${normalized.id ?? ''}`
}

/** 规范化一个条目：字符串按「来源未知的 name-only」读取（旧数据只读兜底）。 */
export function normalizeEntry(value: EntryRef | string | null | undefined): EntryRef | undefined {
  if (typeof value === 'string') return value === '' ? undefined : { name: value }
  if (value === null || value === undefined || typeof value !== 'object') return undefined
  if (typeof value.name !== 'string' || value.name === '') return undefined
  const source = normalizeSource(value.source)
  return source === undefined ? { name: value.name } : { name: value.name, source }
}

/** 条目身份键：name + NUL + source。 */
export function entryKey(entry: EntryRef | string | null | undefined): string {
  const normalized = normalizeEntry(entry)
  return normalized === undefined ? '' : `${normalized.name}\u0000${sourceKey(normalized.source)}`
}

/** 两个条目是否同一身份。 */
export function sameEntry(left: EntryRef | string | null | undefined, right: EntryRef | string | null | undefined): boolean {
  const a = entryKey(left)
  return a !== '' && a === entryKey(right)
}

/** 值是否「非空」：数组非空、对象任一子值非空、字符串非空。 */
export function hasContent(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.values(value as Record<string, unknown>).some(hasContent)
  return value !== ''
}

// ── 配置 ────────────────────────────────────────────────────────────────────

/** 阶段化替换条目：只替换已存在段，按阶段（always / 具体阶段）生效。 */
export interface ReplacementEntry extends EntryRef {
  phase: Phase
  text: string
}

/** 注入条目：带 order / 阶段 / 自定义标记；source 参与 (phase,name,source) 分组。 */
export interface InjectEntry extends EntryRef {
  order?: number
  text: string
  phase?: Phase
  custom?: boolean
}

/** 一份阶段的工具名单。 */
export interface PhaseToolsConfig {
  exclude?: EntryRef[]
  add?: EntryRef[]
}

/** 工具过滤配置：三份 exclude / add 名单互不继承。 */
export interface ToolsConfig {
  exclude?: EntryRef[]
  add?: EntryRef[]
  bootstrap?: PhaseToolsConfig
  compaction?: PhaseToolsConfig
}

/** 一份覆盖配置：与全局字段同构。 */
export interface OverrideData {
  sections?: EntryRef[]
  sectionsBootstrap?: EntryRef[]
  sectionsCompaction?: EntryRef[]
  contexts?: EntryRef[]
  contextsBootstrap?: EntryRef[]
  contextsCompaction?: EntryRef[]
  replacements?: ReplacementEntry[]
  inject?: InjectEntry[]
  tools?: ToolsConfig
}

/** 解析后的命名空间配置对象（作用域中的 value）。 */
export interface Config extends OverrideData {
  /** 强制覆盖开关（默认开）。 */
  forceSections?: boolean
  /** 环境变量黑名单（全局字段）。 */
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
 *  可选字段缺省 = 旧快照：应用时保留当前配置不抹掉。 */
export interface PresetData extends OverrideData {
  /** 相对顺序：每段记录它应跟随的前一段（after = 前一段的条目身份键）
   *  与所属阶段（phase）。同名不同源按条目身份分开记录。 */
  order?: Array<EntryRef & { after?: string; text?: string; custom?: boolean; phase?: Phase }>
}

// ── 清单 / 预览 ─────────────────────────────────────────────────────────────

/** 工具展示状态。 */
export type ToolState = 'controllable' | 'locked-agent' | 'locked-executor' | 'masked-plugin' | 'masked-own'

/** 宿主路由返回的清单载荷：当前生效的提示词段与工具目录。 */
export interface Inventory {
  sections: Array<EntryRef & {
    order: number
    text?: string
    active: boolean
    replaced: boolean
    scope?: 'agent'
    dynamic?: boolean
  }>
  tools: Array<EntryRef & {
    description?: string
    hidden: boolean
    state?: ToolState
    scope?: 'agent' | 'executor'
    maskedByPlugin?: boolean
    maskedByOwnPlugin?: boolean
    /** 同名多行（如 live / preset 两态）的展示区分后缀。 */
    keySuffix?: string
  }>
  contexts?: Array<EntryRef & { text: string; active?: boolean; blocked?: boolean; dynamic?: boolean }>
  /** false = 预设 scope 未能挂载，清单回退到了全局层。 */
  scopeResolved?: boolean
  /** 当前已注册的提示词变量名。 */
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

/** 预过滤段视图（进入本插件过滤前的段原文 + 该阶段独立屏蔽 / 替换 / 动态标记）。 */
export interface BaseSection extends EntryRef {
  text: string
  blocked: boolean
  replaced: boolean
  scope?: 'agent'
  dynamic?: boolean
}

/** 预过滤工具视图。 */
export interface BaseTool extends EntryRef {
  description: string
  hidden: boolean
  state?: ToolState
  scope?: 'agent' | 'executor'
  maskedByPlugin?: boolean
  maskedByOwnPlugin?: boolean
  keySuffix?: string
}

/** 预过滤运行时上下文视图。 */
export interface BaseContext extends EntryRef {
  text: string
  blocked?: boolean
  active?: boolean
  dynamic?: boolean
}

/** 工具预览条目：对象形态或纯字符串工具名（统一归一化为对象）。 */
export type PreviewTool = EntryRef & { description?: string; keySuffix?: string }

/** 宿主路由返回的最终装配预览载荷。 */
export interface Preview {
  ok: boolean
  error?: string
  source?: 'preset' | 'session'
  /** 当前会话视图的会话元数据；预设预览为空。 */
  session?: { id: string; presetId?: string; phase?: string; createdAt?: number } | null
  /** 非空 = 预设预览的左栏已并入该活动会话的 agent 作用域条目（右栏仍是纯预设装配）。 */
  sessionOverlay?: { id: string; presetId?: string }
  diagnostics?: Array<{ name: string; variable: string; kind: 'session-variable' }>
  contexts?: Array<{ name: string; text: string }>
  scope?: unknown
  scopeResolved?: boolean
  takenOverBy?: string
  lostSections?: { emitted: number; survived: number; dropped: number }
  registryTotal?: number
  registryTools?: Array<EntryRef | string>
  sections: Array<EntryRef & { text: string }>
  text: string
  tools: Array<PreviewTool | string>
  baseSections?: BaseSection[]
  baseTools?: BaseTool[]
  baseContexts?: BaseContext[]
  /** 生效配置（清单路由用）。 */
  config?: OverrideData
  sectionOrder?: Record<string, number>
}

/** Panel 并行拉取的三阶段装配。 */
export type PhaseViews = Record<PhaseKey, Preview | null>

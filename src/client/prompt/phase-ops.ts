/** 提示词段面板的纯状态逻辑（无 React / 无 IO）。
 *
 * 与旧 `vendor/prompt-customizer/sectionOps.mjs` 的职责相同，但身份统一为
 * `{name, source}`：所有集合 / 映射的键都是 `entryKey`，同名不同源分开处理。
 * 阶段字段名与顺序全部来自 `PHASES`，本文件不手写第二份三态映射。
 */
import {
  PHASES,
  PHASE_KEYS,
  entryKey,
  normalizeEntry,
  sameEntry,
  type Config,
  type ContextField,
  type EntryRef,
  type InjectEntry,
  type PhaseKey,
  type Preview,
  type ReplacementEntry,
  type SectionField,
  type ToolPromptInfo,
} from './types.ts'

/** 屏幕上一条可交互的段行。`dynamic` 只在服务端给出标记时才是布尔值 ——
 *  缺省（undefined）= 宿主不支持该标记，界面不得用原文猜。 */
export interface PhaseRow extends EntryRef {
  text: string
  replaced: boolean
  custom: boolean
  /** 本阶段的用户替换文本（空串 = 本阶段没改过文本）。 */
  override: string
  /** 该阶段自己的屏蔽名单是否屏蔽了此段：勾选框 = 未屏蔽（注入模型）。 */
  blocked: boolean
  dynamic?: boolean
  /** tool:* 段关联的工具组（服务端 inventory 提供；旧宿主缺省）。 */
  toolPrompt?: ToolPromptInfo
}

function descriptorOf(key: PhaseKey) {
  const phase = PHASES.find((item) => item.key === key)
  if (phase === undefined) throw new Error(`unknown phase: ${String(key)}`)
  return phase
}

export function sectionFieldOf(key: PhaseKey): SectionField {
  return descriptorOf(key).sectionField
}

export function contextFieldOf(key: PhaseKey): ContextField {
  return descriptorOf(key).contextField
}

/** 阶段 → 工具名单字段：预置期用 `bootstrap`、压缩受控期用 `compaction`，常驻期静态。 */
export function toolFieldOf(key: PhaseKey): 'static' | 'bootstrap' | 'compaction' {
  return descriptorOf(key).toolField ?? 'static'
}

/** 该注入 / 替换阶段是否作用于当前名义阶段。 */
export function acceptsInjectFor(key: PhaseKey, phase: string): boolean {
  return phase === 'always' || phase === key
}

export function sectionEntries(cfg: Config | null | undefined, key: PhaseKey): EntryRef[] {
  return normalizeList(cfg?.[sectionFieldOf(key)])
}

export function contextEntries(cfg: Config | null | undefined, key: PhaseKey): EntryRef[] {
  return normalizeList(cfg?.[contextFieldOf(key)])
}

/** 运行时上下文显隐：只改本阶段 contexts 名单，不立即落盘。 */
export function contextPatch(
  cfg: Config | null | undefined,
  key: PhaseKey,
  entry: EntryRef,
  hidden: boolean,
): Partial<Record<ContextField, EntryRef[]>> {
  const field = contextFieldOf(key)
  const current = contextEntries(cfg, key)
  const index = current.findIndex((item) => sameEntry(item, entry))
  if (hidden) {
    if (index < 0) current.push({ name: entry.name, ...(entry.source === undefined ? {} : { source: entry.source }) })
  } else if (index >= 0) {
    current.splice(index, 1)
  }
  return { [field]: current }
}

function normalizeList(list: Array<EntryRef | string> | undefined | null): EntryRef[] {
  const out: EntryRef[] = []
  const seen = new Set<string>()
  for (const value of list ?? []) {
    const entry = normalizeEntry(value)
    if (entry === undefined) continue
    const key = entryKey(entry)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(entry)
  }
  return out
}

/** 该阶段专属的替换条目（always + 本阶段）。 */
export function replacementEntriesFor(cfg: Config | null | undefined, key: PhaseKey): ReplacementEntry[] {
  return (cfg?.replacements ?? []).filter((item) => acceptsInjectFor(key, item?.phase ?? 'always'))
}

/** 某阶段的注入身份。所有集合 / 映射的键都是 `entryKey`。 */
export interface InjectedAt {
  names: Set<string>
  custom: Set<string>
  text: Map<string, string>
  order: Map<string, number>
}

export function injectedAt(cfg: Config | null | undefined, key: PhaseKey): InjectedAt {
  const names = new Set<string>()
  const custom = new Set<string>()
  const text = new Map<string, string>()
  const order = new Map<string, number>()
  for (const item of cfg?.inject ?? []) {
    const entry = normalizeEntry(item)
    if (entry === undefined) continue
    const identity = entryKey(entry)
    const phase = item.phase ?? 'always'
    if (phase === key) order.set(identity, item.order ?? 0)
    if (!acceptsInjectFor(key, phase)) continue
    names.add(identity)
    if (item.text) {
      // 本阶段专属条目覆盖 always 条目的文本。
      if (phase === key || !text.has(identity)) text.set(identity, item.text)
    }
    if (item.custom === true) custom.add(identity)
  }
  return { names, custom, text, order }
}

/** 屏蔽 / 恢复一个段：只读写本阶段自己的名单（返回字段补丁；空补丁 = 不写盘）。 */
export function blockPatch(
  cfg: Config | null | undefined,
  key: PhaseKey,
  entry: EntryRef,
  blocked: boolean,
): Partial<Record<SectionField, EntryRef[]>> {
  const field = sectionFieldOf(key)
  const current = sectionEntries(cfg, key)
  const index = current.findIndex((item) => sameEntry(item, entry))
  if (blocked) {
    if (index >= 0) return {}
    current.push({ name: entry.name, ...(entry.source === undefined ? {} : { source: entry.source }) })
  } else {
    if (index < 0) return {}
    current.splice(index, 1)
  }
  return { [field]: current }
}

interface BaseLike extends EntryRef {
  text?: string
  blocked?: boolean
  replaced?: boolean
  dynamic?: boolean
  toolPrompt?: ToolPromptInfo
}

/**
 * 一个阶段部分的全部行：base（预过滤）视图 ∪ post（最终装配）∪ 该阶段注入条目
 * ∪ 屏蔽名单。行身份按 name+source，同名不同源各占一行。
 */
export function phaseRows(cfg: Config | null | undefined, view: Preview | null | undefined, key: PhaseKey): PhaseRow[] {
  const base = (view?.baseSections ?? []) as BaseLike[]
  const post = (view?.sections ?? []) as BaseLike[]
  const denied = sectionEntries(cfg, key)
  const deniedKeys = new Set(denied.map((entry) => entryKey(entry)))
  const baseByKey = new Map(base.map((entry) => [entryKey(entry), entry]))
  const postByKey = new Map(post.map((entry) => [entryKey(entry), entry]))
  const injected = injectedAt(cfg, key)
  const replacements = replacementEntriesFor(cfg, key)

  const order: EntryRef[] = []
  const seen = new Set<string>()
  const push = (entry: EntryRef): void => {
    const identity = entryKey(entry)
    if (identity === '' || seen.has(identity)) return
    seen.add(identity)
    order.push({ name: entry.name, ...(entry.source === undefined ? {} : { source: entry.source }) })
  }

  for (const section of base) {
    const identity = entryKey(section)
    if (postByKey.has(identity) || deniedKeys.has(identity) || section.blocked === true) push(section)
  }
  for (const section of post) {
    const identity = entryKey(section)
    if (!baseByKey.has(identity) && injected.names.has(identity)) push(section)
  }
  for (const item of cfg?.inject ?? []) {
    const entry = normalizeEntry(item)
    if (entry === undefined) continue
    const identity = entryKey(entry)
    if ((item.phase ?? 'always') !== key) continue
    if (item.custom === true || injected.text.has(identity) || baseByKey.has(identity) || postByKey.has(identity)) push(entry)
  }
  for (const entry of denied) push(entry)
  for (const identity of injected.custom) {
    const item = (cfg?.inject ?? []).find((candidate) => entryKey(candidate) === identity)
    if (item !== undefined) push(item)
  }

  const rows = order.map((entry) => {
    const identity = entryKey(entry)
    const baseSection = baseByKey.get(identity)
    const postSection = postByKey.get(identity)
    const override = injected.text.get(identity) ?? ''
    const replacement = replacements.find((item) => sameEntry(item, entry))
    const dynamic = typeof baseSection?.dynamic === 'boolean'
      ? baseSection.dynamic
      : typeof postSection?.dynamic === 'boolean' ? postSection.dynamic : undefined
    const toolPrompt = baseSection?.toolPrompt ?? postSection?.toolPrompt
    return {
      name: entry.name,
      ...(entry.source === undefined ? {} : { source: entry.source }),
      text: postSection?.text ?? baseSection?.text ?? '',
      replaced: replacement !== undefined || override !== '',
      custom: injected.custom.has(identity),
      override,
      blocked: deniedKeys.has(identity),
      ...(dynamic === undefined ? {} : { dynamic }),
      ...(toolPrompt === undefined ? {} : { toolPrompt }),
    } satisfies PhaseRow
  })
  if (injected.order.size > 0) {
    const fallback = new Map(rows.map((row, index) => [entryKey(row), index]))
    rows.sort((left, right) => {
      const a = injected.order.get(entryKey(left)) ?? fallback.get(entryKey(left)) ?? 0
      const b = injected.order.get(entryKey(right)) ?? fallback.get(entryKey(right)) ?? 0
      return a - b
    })
  }
  return rows
}

/**
 * 持久化一个阶段的有序列表：把 rows 写成该阶段的注入条目，order = 连续整数；
 * 其它阶段（含 always）的注入条目原样保留。条目形状按 (phase,name,source) 分组，
 * 同名不同源绝不互相覆盖。
 */
export function phaseInjectEntries(cfg: Config | null | undefined, key: PhaseKey, rows: PhaseRow[]): InjectEntry[] {
  const remaining = (cfg?.inject ?? []).filter((item) => (item.phase ?? 'always') !== key)
  const entries: InjectEntry[] = rows.map((row, index) => ({
    name: row.name,
    ...(row.source === undefined ? {} : { source: row.source }),
    order: index,
    text: row.override || (row.custom ? (row.text ?? '') : ''),
    phase: key,
    custom: row.custom,
  }))
  return [...remaining, ...entries]
}

/** 重排 / 插入：把 drag 行插到 target 行之上或之下，返回新列表。 */
export function reorderInsert<T extends EntryRef>(
  rows: T[],
  drag: EntryRef,
  target: EntryRef,
  pos: 'above' | 'below',
): T[] | null {
  const base = rows.filter((row) => !sameEntry(row, drag))
  const index = base.findIndex((row) => sameEntry(row, target))
  if (index < 0) return null
  const entry = rows.find((row) => sameEntry(row, drag))
  if (entry === undefined) return null
  base.splice(pos === 'above' ? index : index + 1, 0, entry)
  return base
}

/** 三态同步的骨架顺序：常驻期在前（数据序），其余阶段按 PHASES 顺延。 */
const MIRROR_ORDER: PhaseKey[] = ['active', ...PHASE_KEYS.filter((key) => key !== 'active')]

/** 三态同步的并集行集：常驻期为骨架，其余两态独有的段追加在尾部。 */
export function mirroredRows(
  cfg: Config | null | undefined,
  views: Partial<Record<PhaseKey, Preview | null>> | null | undefined,
  nativeOf?: (key: PhaseKey, entry: EntryRef) => boolean | null | undefined,
): PhaseRow[] {
  const picked = new Map<string, { row: PhaseRow; native: boolean }>()
  const order: string[] = []
  for (const key of MIRROR_ORDER) {
    for (const row of phaseRows(cfg, views?.[key] ?? null, key)) {
      const identity = entryKey(row)
      const native = nativeOf?.(key, row) === true
      const current = picked.get(identity)
      if (current === undefined) {
        picked.set(identity, { row, native })
        order.push(identity)
      } else if (current.native !== true && native) {
        picked.set(identity, { row, native })
      }
    }
  }
  return order.map((identity) => picked.get(identity)!.row)
}

/** 镜像到某阶段时该行要写的正文（'' = 只覆盖 order，注册表原文不动）。 */
function mirrorText(row: PhaseRow, native: boolean): string {
  if (row.custom === true) return row.override || (row.text ?? '')
  if (row.override !== '') return row.override
  if (native === true) return ''
  if (row.dynamic === true) return ''
  return row.text ?? ''
}

/** 三态同步持久化：把同一份并集行集镜像写入三个阶段。 */
export function mirrorPhaseInjectEntries(
  cfg: Config | null | undefined,
  rows: PhaseRow[],
  nativeOf?: (key: PhaseKey, entry: EntryRef) => boolean | null | undefined,
): InjectEntry[] {
  const names = new Set(rows.map((row) => entryKey(row)))
  const always = (cfg?.inject ?? []).filter((item) => (item.phase ?? 'always') === 'always' && names.has(entryKey(item)))
  const entries: InjectEntry[] = []
  for (const key of PHASE_KEYS) {
    let order = 0
    for (const row of rows) {
      const native = nativeOf?.(key, row)
      if (native === null || native === undefined) continue
      const text = mirrorText(row, native)
      if (native !== true && text === '') continue
      entries.push({
        name: row.name,
        ...(row.source === undefined ? {} : { source: row.source }),
        order: order++,
        text,
        phase: key,
        custom: row.custom,
      })
    }
  }
  return [...always, ...entries]
}

/** 镜像时在目标阶段建不出来的段名（动态段无正文）：界面据此给出说明。 */
export function mirrorSkippedNames(
  rows: PhaseRow[],
  nativeOf?: (key: PhaseKey, entry: EntryRef) => boolean | null | undefined,
): string[] {
  const skipped = new Set<string>()
  for (const key of PHASE_KEYS) {
    for (const row of rows) {
      const native = nativeOf?.(key, row)
      if (native === null || native === undefined || native === true) continue
      if (mirrorText(row, false) === '') skipped.add(row.name)
    }
  }
  return [...skipped]
}

/** 三态同步的屏蔽名单：三份名单统一为并集行集里的屏蔽条目（name+source）。
 *  字段名由 PHASES 生成，不手写第二份三态映射。 */
export function mirroredDeniedLists(rows: PhaseRow[]): Record<SectionField, EntryRef[]> {
  const blocked = rows
    .filter((row) => row.blocked === true)
    .map((row) => ({ name: row.name, ...(row.source === undefined ? {} : { source: row.source }) }))
  const out = {} as Record<SectionField, EntryRef[]>
  for (const phase of PHASES) out[phase.sectionField] = blocked.map((entry) => ({ ...entry }))
  return out
}

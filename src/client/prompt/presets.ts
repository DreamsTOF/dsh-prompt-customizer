/** 纯函数的预设 / 段操作助手，同时被客户端 UI 与 Node 测试复用（不触碰 IO 与 React）。
 *
 * 条目身份统一为 `{name, source}`；阶段字段名与顺序全部来自 `PHASES`，
 * 不再手写 `CAPTURE_PHASES` / `PART_ORDER` 等重复常量。
 */
import {
  PHASES,
  PHASE_KEYS,
  entryKey,
  normalizeEntry,
  sameEntry,
  type Config,
  type EntryRef,
  type InjectEntry,
  type Inventory,
  type OverrideData,
  type Phase,
  type PhaseKey,
  type Preset,
  type PresetData,
  type ReplacementEntry,
  type SectionField,
  type ContextField,
  type ToolsConfig,
} from './types.ts'
import { toolFieldOf } from './phase-ops.ts'

export interface Section extends EntryRef {
  order: number
  text?: string
  active: boolean
  replaced: boolean
  /** true = 本插件注入（可删除）；false = 读自宿主提示词清单。 */
  custom: boolean
  /** 服务端提供的动态段标记（缺省 = 宿主不支持，界面不得用原文猜）。 */
  dynamic?: boolean
}

/** 应用预设后需要回写到设置作用域的那部分配置字段。
 *  阶段字段为可选：快照不带 → 应用时保留当前值，绝不抹掉。 */
export interface ConfigPatch extends Partial<Record<SectionField | ContextField, EntryRef[]>> {
  replacements?: ReplacementEntry[]
  inject?: InjectEntry[]
  tools?: ToolsConfig
}

/** 按 PHASES 生成一份覆盖配置的全部阶段字段（空数组兜底）。 */
function phaseFieldValues(source: OverrideData | undefined): Record<SectionField | ContextField, EntryRef[]> {
  const out = {} as Record<SectionField | ContextField, EntryRef[]>
  for (const phase of PHASES) {
    out[phase.sectionField] = [...(source?.[phase.sectionField] ?? [])]
    out[phase.contextField] = [...(source?.[phase.contextField] ?? [])]
  }
  return out
}

/** 归一化工具配置：三个阶段的 exclude/add 都是 EntryRef[]。 */
export function normalizeToolsConfig(tools: ToolsConfig | undefined): ToolsConfig {
  const out: ToolsConfig = {
    exclude: [...(tools?.exclude ?? [])],
    add: [...(tools?.add ?? [])],
  }
  for (const phase of PHASES) {
    if (phase.toolField === undefined) continue
    const group = tools?.[phase.toolField]
    out[phase.toolField] = {
      exclude: [...(group?.exclude ?? [])],
      add: [...(group?.add ?? [])],
    }
  }
  return out
}

/** 把一条有序条目转成相对链（每段记住它的前一段的条目身份键）。 */
function toChain(
  items: Array<EntryRef & { text?: string; custom?: boolean }>,
  phase?: Phase,
): NonNullable<PresetData['order']> {
  return items.map((item, index) => ({
    name: item.name,
    ...(item.source === undefined ? {} : { source: item.source }),
    after: index > 0 ? entryKey(items[index - 1]!) : undefined,
    text: item.custom === true ? (item.text ?? '') : '',
    custom: item.custom === true,
    ...(phase === undefined ? {} : { phase }),
  }))
}

/** 从当前配置构建预设快照（完整捕获，含每阶段独立设定与阶段化替换）。 */
export function buildPresetData(cfg: Config, merged: Section[]): PresetData {
  // 全局链里的自定义段正文只取 always 注入条目的文本：同名条目在别的阶段
  // 有自己的替换文本，不能被 mergeSections 的「后写覆盖」带进 always 组。
  const alwaysText = new Map<string, string>()
  for (const item of cfg.inject ?? []) {
    if ((item.phase ?? 'always') !== 'always') continue
    alwaysText.set(entryKey(item), item.text ?? '')
  }
  // 全局链只收「系统段 + 确实属于 always 的自定义段」：只在某个阶段注入的
  // 自定义段由该阶段的链捕获，不能借全局链复活成 always。
  const globalRows = merged.filter((section) => !section.custom || alwaysText.has(entryKey(section)))
  const order = toChain(globalRows.map((section) => ({
    name: section.name,
    ...(section.source === undefined ? {} : { source: section.source }),
    text: section.custom ? (alwaysText.get(entryKey(section)) ?? section.text ?? '') : '',
    custom: section.custom,
  })))
  for (const phase of PHASE_KEYS) {
    const items = (cfg.inject ?? [])
      .filter((item) => (item.phase ?? 'always') === phase)
      .slice()
      .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
    if (items.length === 0) continue
    order.push(...toChain(items.map((item) => ({
      name: item.name,
      ...(item.source === undefined ? {} : { source: item.source }),
      text: item.text,
      custom: item.custom === true,
    })), phase))
  }
  return {
    ...phaseFieldValues(cfg),
    replacements: [...(cfg.replacements ?? [])],
    order,
    tools: normalizeToolsConfig(cfg.tools),
  }
}

/** 把宿主清单段与用户注入列表按 order 合并、排序。条目身份按 name+source。 */
export function mergeSections(inv: Inventory | null, cfg: Config, blockedKeys: ReadonlySet<string>): Section[] {
  const map = new Map<string, Section>()
  for (const section of inv?.sections ?? []) {
    const entry = normalizeEntry(section)
    if (entry === undefined) continue
    map.set(entryKey(entry), {
      ...entry,
      order: section.order,
      text: section.text ?? '',
      active: blockedKeys.has(entryKey(entry)) ? false : section.active !== false,
      replaced: section.replaced === true,
      custom: false,
      ...(section.dynamic === undefined ? {} : { dynamic: section.dynamic }),
    })
  }
  for (const item of cfg.inject ?? []) {
    const entry = normalizeEntry(item)
    if (entry === undefined) continue
    const identity = entryKey(entry)
    const custom = item.custom === true
    const existing = map.get(identity)
    const replacement = (cfg.replacements ?? []).some((candidate) => sameEntry(candidate, entry))
    if (existing !== undefined) {
      map.set(identity, {
        ...existing,
        order: item.order ?? existing.order,
        ...(item.text !== undefined && item.text !== '' ? { text: item.text } : {}),
        custom: custom || existing.custom,
        active: !blockedKeys.has(identity),
        replaced: replacement || existing.replaced,
      })
    } else {
      map.set(identity, {
        ...entry,
        order: item.order ?? 0,
        text: item.text ?? '',
        active: !blockedKeys.has(identity),
        replaced: replacement,
        custom,
      })
    }
  }
  return [...map.values()]
    .sort((left, right) => left.order - right.order || left.name.localeCompare(right.name))
    .map((section, index) => ({ ...section, order: index }))
}

/** ConfigPatch 里对外的注入条目。 */
export type ResolvedInject = InjectEntry

/** 把一条相对链解析为绝对有序条目（锚点 = 前一段的条目身份键）。 */
function resolveChain(list: NonNullable<PresetData['order']>): Array<EntryRef & { text?: string; custom?: boolean }> {
  const byKey = new Map<string, NonNullable<PresetData['order']>[number]>()
  for (const item of list) {
    const entry = normalizeEntry(item)
    if (entry === undefined) continue
    byKey.set(entryKey(entry), { ...item, ...entry })
  }
  const result: Array<EntryRef & { text?: string; custom?: boolean }> = []
  const placed = new Set<string>()
  const insert = (item: NonNullable<PresetData['order']>[number]): void => {
    const entry = normalizeEntry(item)
    if (entry === undefined) return
    const identity = entryKey(entry)
    if (placed.has(identity)) return
    placed.add(identity)
    result.push({ ...entry, text: item.text, custom: item.custom })
  }
  // 没有锚点 / 锚点不在本组内的条目按原始顺序排在最前。
  for (const item of byKey.values()) {
    if (item.after === undefined || item.after === '' || !byKey.has(item.after)) insert(item)
  }
  let changed = true
  while (changed) {
    changed = false
    for (const item of byKey.values()) {
      const entry = normalizeEntry(item)
      if (entry === undefined) continue
      const identity = entryKey(entry)
      if (placed.has(identity)) continue
      const anchor = item.after
      if (anchor !== undefined && placed.has(anchor)) {
        const anchorIndex = result.findIndex((candidate) => entryKey(candidate) === anchor)
        result.splice(anchorIndex + 1, 0, { ...entry, text: item.text, custom: item.custom })
        placed.add(identity)
        changed = true
      }
    }
  }
  for (const item of byKey.values()) insert(item)
  return result
}

/** 把快照里的相对顺序解析为注入条目列表。按 (phase,name,source) 分组、组内重编号。 */
export function resolveOrder(presetOrder: PresetData['order']): ResolvedInject[] {
  const groups = new Map<Phase, NonNullable<PresetData['order']>>()
  for (const item of presetOrder ?? []) {
    const phase = (item.phase ?? 'always') as Phase
    const group = groups.get(phase)
    if (group === undefined) groups.set(phase, [item])
    else group.push(item)
  }
  const out: ResolvedInject[] = []
  for (const phase of ['always', ...PHASE_KEYS] as Phase[]) {
    const members = groups.get(phase)
    if (members === undefined) continue
    resolveChain(members).forEach((entry, index) => {
      out.push({
        name: entry.name,
        ...(entry.source === undefined ? {} : { source: entry.source }),
        order: index,
        text: entry.text ?? '',
        custom: entry.custom === true,
        ...(phase === 'always' ? {} : { phase }),
      })
    })
  }
  return out
}

/** 按 (phase,name,source) 重新分组并编号：同阶段同条目后者覆盖前者。 */
function reindexInject(entries: InjectEntry[]): InjectEntry[] {
  const groups = new Map<Phase, Map<string, InjectEntry>>()
  for (const item of entries) {
    const phase = (item.phase ?? 'always') as Phase
    const group = groups.get(phase)
    if (group === undefined) groups.set(phase, new Map([[entryKey(item), item]]))
    else group.set(entryKey(item), item)
  }
  const out: InjectEntry[] = []
  for (const phase of ['always', ...PHASE_KEYS] as Phase[]) {
    const group = groups.get(phase)
    if (group === undefined) continue
    let order = 0
    for (const item of group.values()) {
      out.push({
        name: item.name,
        ...(item.source === undefined ? {} : { source: item.source }),
        order: order++,
        text: item.text ?? '',
        custom: item.custom === true,
        ...(phase === 'always' ? {} : { phase }),
      })
    }
  }
  return out
}

/** 合并阶段化替换：同一 (phase,name,source) 以后者为准。 */
function mergeReplacements(base: ReplacementEntry[] | undefined, incoming: ReplacementEntry[] | undefined): ReplacementEntry[] {
  const map = new Map<string, ReplacementEntry>()
  for (const item of base ?? []) map.set(`${item.phase ?? 'always'}\u0000${entryKey(item)}`, item)
  for (const item of incoming ?? []) map.set(`${item.phase ?? 'always'}\u0000${entryKey(item)}`, item)
  return [...map.values()]
}

/** 工具快照合并：名单以快照为准，但快照没给的 `add` 绝不重置。 */
function mergeToolsSnapshot(base: ToolsConfig | undefined, snapshot: ToolsConfig | undefined): ToolsConfig {
  const out = normalizeToolsConfig(base)
  if (snapshot === undefined) return out
  if (Array.isArray(snapshot.exclude)) out.exclude = [...snapshot.exclude]
  if (Array.isArray(snapshot.add)) out.add = [...snapshot.add]
  for (const phase of PHASES) {
    if (phase.toolField === undefined) continue
    const incoming = snapshot[phase.toolField]
    if (incoming === undefined) continue
    const current = out[phase.toolField] ?? {}
    out[phase.toolField] = {
      exclude: incoming.exclude !== undefined ? [...incoming.exclude] : current.exclude,
      add: incoming.add !== undefined ? [...incoming.add] : current.add,
    }
  }
  return out
}

/**
 * 计算应用预设时的配置补丁：
 *  - 段名单按 EntryRef（name+source）匹配，匹配不上的跳过；
 *  - 工具快照合并保留当前 `add`（快照没给就不重置）；
 *  - 注入按 (phase,name,source) 分组重编号。
 */
export function applyPresetData(
  data: PresetData,
  cfg: Config,
  current: ReadonlySet<string> | ReadonlyMap<string, EntryRef>,
): ConfigPatch {
  const mapCurrent = current instanceof Map ? current as ReadonlyMap<string, EntryRef> : undefined
  const entryOf = (identity: string): EntryRef => mapCurrent?.get(identity) ?? { name: identity }
  const currentKeys: ReadonlySet<string> = mapCurrent === undefined ? current as ReadonlySet<string> : new Set(mapCurrent.keys())
  const presetOrder = data.order ?? []
  const presetKeys = new Set(presetOrder.map((item) => entryKey(item)))
  const known = new Map<string, EntryRef>()
  const remember = (entry: EntryRef | string): void => {
    const normalized = normalizeEntry(entry)
    if (normalized !== undefined) known.set(entryKey(normalized), normalized)
  }
  for (const entry of data.sections ?? []) remember(entry)
  for (const entry of presetOrder) remember(entry)
  for (const entry of cfg.sections ?? []) remember(entry)
  for (const entry of cfg.sectionsBootstrap ?? []) remember(entry)
  for (const entry of cfg.sectionsCompaction ?? []) remember(entry)
  for (const item of cfg.inject ?? []) remember(item)
  if (mapCurrent !== undefined) for (const entry of mapCurrent.values()) remember(entry)

  const blocked = new Set<string>()
  for (const entry of data.sections ?? []) {
    const identity = entryKey(entry)
    if (currentKeys.has(identity)) blocked.add(identity)
  }

  const inject = resolveOrder(presetOrder.filter((item) => currentKeys.has(entryKey(item))))
  const kept = new Set(inject.map((item) => entryKey(item)))
  for (const item of cfg.inject ?? []) {
    const identity = entryKey(item)
    if (identity === '' || presetKeys.has(identity) || kept.has(identity)) continue
    kept.add(identity)
    inject.push(item)
  }
  const finalInject = reindexInject(inject)

  if (presetOrder.length > 0) {
    const active = new Set([...presetKeys].filter((identity) => !blocked.has(identity)))
    for (const identity of currentKeys) if (!presetKeys.has(identity)) blocked.add(identity)
    for (const identity of active) blocked.delete(identity)
  }

  const patch: ConfigPatch = {
    sections: [...blocked].map((identity) => known.get(identity) ?? entryOf(identity)),
    replacements: mergeReplacements(cfg.replacements, data.replacements),
    inject: finalInject,
    tools: mergeToolsSnapshot(cfg.tools, data.tools),
  }
  for (const phase of PHASES) {
    const sectionList = data[phase.sectionField]
    const contextList = data[phase.contextField]
    if (Array.isArray(sectionList)) patch[phase.sectionField] = [...sectionList]
    if (Array.isArray(contextList)) patch[phase.contextField] = [...contextList]
  }
  return patch
}

/** 从配置中移除一个条目：所有阶段名单、注入条目、替换条目一起清掉。 */
export function removeSection(entry: EntryRef, cfg: Config): Partial<Config> {
  const out: Partial<Config> = {
    inject: (cfg.inject ?? [])
      .filter((item) => !sameEntry(item, entry))
      .map((item, index) => ({ ...item, order: index })),
    replacements: (cfg.replacements ?? []).filter((item) => !sameEntry(item, entry)),
  }
  for (const phase of PHASES) {
    out[phase.sectionField] = (cfg[phase.sectionField] ?? []).filter((item) => !sameEntry(item, entry))
    out[phase.contextField] = (cfg[phase.contextField] ?? []).filter((item) => !sameEntry(item, entry))
  }
  return out
}

// ── 工具过滤 ───────────────────────────────────────────────────────────────

export type ToolsCfg = { exclude?: EntryRef[] }

/** 把一个阶段的 exclude 名单写回整份工具配置。 */
export function withPhaseExclude(tools: ToolsConfig | undefined, key: PhaseKey, exclude: EntryRef[]): ToolsConfig {
  const base = tools ?? {}
  const field = toolFieldOf(key)
  if (field === 'static') return { ...base, exclude }
  return { ...base, [field]: { ...(base[field] ?? {}), exclude } }
}

/** 把一个阶段的 add 名单写回整份工具配置。 */
export function withPhaseAdd(tools: ToolsConfig | undefined, key: PhaseKey, add: EntryRef[]): ToolsConfig {
  const base = tools ?? {}
  const field = toolFieldOf(key)
  if (field === 'static') return { ...base, add }
  return { ...base, [field]: { ...(base[field] ?? {}), add } }
}

/** 某个工具在当前黑名单配置下是否被隐藏（按 name+source）。 */
export function isToolHidden(entry: EntryRef, toolsCfg: ToolsCfg | undefined): boolean {
  return (toolsCfg?.exclude ?? []).some((item) => sameEntry(item, entry))
}

/** 切换某个工具的隐藏状态，返回新的工具配置（不改原对象）。 */
export function toggleTool(entry: EntryRef, currentlyHidden: boolean, toolsCfg: ToolsCfg | undefined): ToolsCfg {
  const exclude = (toolsCfg?.exclude ?? []).slice()
  const index = exclude.findIndex((item) => sameEntry(item, entry))
  if (currentlyHidden) {
    if (index >= 0) exclude.splice(index, 1)
  } else if (index < 0) {
    exclude.push({ name: entry.name, ...(entry.source === undefined ? {} : { source: entry.source }) })
  }
  return { exclude }
}

// ── 按 agent 预设的覆盖编辑 ─────────────────────────────────────────────

/** 把一份 override 原文变成编辑显示视图（覆盖所有 PHASES 字段 + replacements）。 */
export function overrideView(cfg: Config, ovr: OverrideData | undefined): Config {
  const o = ovr ?? {}
  return {
    ...phaseFieldValues(o),
    replacements: [...(o.replacements ?? [])],
    inject: [...(o.inject ?? [])],
    tools: normalizeToolsConfig(o.tools),
    presets: cfg.presets,
    activePreset: cfg.activePreset,
    // 全局开关 / 黑名单不经 override：显示与写入都落在顶层，避免面板显示成默认值。
    forceSections: cfg.forceSections,
    envBlocklist: cfg.envBlocklist,
  }
}

export function editView(cfg: Config, target: string | undefined): Config {
  if (!target) return cfg
  return overrideView(cfg, cfg.overrides?.[target])
}

/** 往某个 agent 预设的 override 里写入一个字段（不改原对象）。 */
export function setOverrideField(cfg: Config, target: string, field: keyof OverrideData, value: unknown): Record<string, OverrideData> {
  return {
    ...(cfg.overrides ?? {}),
    [target]: { ...(cfg.overrides?.[target] ?? {}), [field]: value },
  }
}

// ── 预设列表操作 ──────────────────────────────────────────────────────────

/** 序列化预设用于导出（JSON 安全的完整快照）。 */
export function serializePreset(preset: Preset): { name: string; data: PresetData } {
  return { name: preset.name, data: preset.data }
}

/** Derive a safe default filename for a preset export. */
export function presetExportFilename(name: string): string {
  const sanitized = String(name)
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
    .trim()
    .replace(/[. ]+$/, '')
  const base = sanitized === '' ? 'preset' : sanitized
  return `${base}.json`
}

/** 导入预设：同名的会被跳过，只追加名字不同的预设。 */
export function addImportedPresets(existing: Preset[], parsed: unknown, makeId: () => string): Preset[] {
  const incoming = Array.isArray(parsed) ? parsed : [parsed]
  const existingNames = new Set(existing.map((preset) => preset.name))
  const added = incoming
    .filter((preset) => preset && typeof (preset as { name?: unknown }).name === 'string' && !existingNames.has((preset as Preset).name))
    .map((preset) => ({ id: makeId(), name: (preset as Preset).name, data: ((preset as Preset).data ?? {}) as PresetData }))
  return added.length > 0 ? [...existing, ...added] : existing
}

/** 删除某个预设；若它正是当前激活的预设，则同时清除 activeId。 */
export function removePreset(presets: Preset[], id: string, activeId?: string): { presets: Preset[]; activeId?: string } {
  return {
    presets: presets.filter((preset) => preset.id !== id),
    activeId: activeId === id ? undefined : activeId,
  }
}

/** 生成预设 id：时间戳 + 随机段（base36）。 */
export function genId(): string {
  return 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

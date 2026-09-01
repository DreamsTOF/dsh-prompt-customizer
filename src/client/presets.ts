/** 纯函数的预设 / 段操作助手，同时被客户端 UI 与 Node 测试复用（不触碰 IO 与 React）。 */
import type { Config, Inventory, OverrideData, Phase, PhaseViewKey, Preset, PresetData, ToolsConfig } from './types.ts'

export interface Section {
  name: string
  order: number
  text?: string
  active: boolean
  replaced: boolean
  /** `system` = 读自宿主提示词清单（不可删除）；`custom` = 本插件注入（可删除）。 */
  source?: 'system' | 'custom'
}

/** 应用预设后需要回写到设置作用域的那部分配置字段。
 *  阶段名单为可选：旧快照不带 → 应用时保留当前值，绝不抹掉。 */
export interface ConfigPatch {
  sections: string[]
  sectionsBootstrap?: string[]
  sectionsCompaction?: string[]
  replace: Record<string, string>
  inject: ResolvedInject[]
  tools: ToolsConfig
}

/** 快照捕获的阶段 order 空间（always 之外的三个阶段）。 */
const CAPTURE_PHASES: Array<'bootstrap' | 'active' | 'compaction'> = ['bootstrap', 'active', 'compaction']

/** 把一条有序名字转成相对链（每段记住它的前一段），text / custom 只给 custom 段。 */
function toChain(names: string[], textOf: (name: string) => string, customOf: (name: string) => boolean, phase?: Phase): NonNullable<PresetData['order']> {
  return names.map((name, i) => ({
    name,
    after: i > 0 ? names[i - 1] : undefined,
    text: customOf(name) ? (textOf(name) ?? '') : '',
    custom: customOf(name),
    ...(phase !== undefined ? { phase } : {}),
  }))
}

/**
 * 从当前配置构建预设快照（完整捕获，含每阶段独立设定）。
 *
 * 全局相对链派生自合并后的完整段列表（而不仅是 `cfg.inject`），这样即使保存前
 * 只是屏蔽了几个段（没有重排），预设仍会携带完整的有序集合，应用时才能得到一个
 * 有意义的「激活列表」。在此之上，bootstrap / active / compaction 各再带一条自己
 * 的相对链 —— 数据源就是 UI 逐阶段持久化的注入条目（每阶段独立的 order 空间），
 * 否则阶段化的名单与排序在「导出 → 导入 → 应用」后就丢了。
 */
export function buildPresetData(cfg: Config, merged: Section[]): PresetData {
  const globalNames = merged.map((sec) => sec.name)
  const textOf = new Map(merged.map((sec) => [sec.name, sec.text ?? ''] as const))
  const customOf = new Map(merged.map((sec) => [sec.name, sec.source === 'custom'] as const))
  const order = toChain(globalNames, (n) => textOf.get(n) ?? '', (n) => customOf.get(n) === true)
  for (const phase of CAPTURE_PHASES) {
    const items = (cfg.inject ?? [])
      .filter((item) => item.phase === phase)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    if (items.length === 0) continue
    order.push(...toChain(
      items.map((item) => item.name),
      (n) => items.find((item) => item.name === n)?.text ?? '',
      (n) => items.find((item) => item.name === n)?.custom === true,
      phase,
    ))
  }
  const data: PresetData = {
    sections: cfg.sections,
    replace: cfg.replace,
    order,
    tools: cfg.tools,
  }
  // 非空才捕获：没有阶段名单的配置导出的快照与改动前逐键一致。
  if ((cfg.sectionsBootstrap ?? []).length > 0) data.sectionsBootstrap = cfg.sectionsBootstrap
  if ((cfg.sectionsCompaction ?? []).length > 0) data.sectionsCompaction = cfg.sectionsCompaction
  return data
}

/**
 * 把宿主清单段与用户注入列表按 order 合并、排序。
 * 读自清单（其他插件产出）的段标记为 `system`；本插件生成的段带隐藏的
 * `custom` 标记，标记为 `custom`。来源只由隐藏标记决定——绝不靠名字碰撞
 * 判断——因此即使自定义段恰好与某个清单段重名，它也能保住自己的身份
 * （以及可删除性），并在切换预设后依然成立。自定义段始终渲染自己的文本，
 * 永远不会显示为「<动态生成>」。
 */
export function mergeSections(inv: Inventory | null, cfg: Config, blockedNames: ReadonlySet<string>): Section[] {
  const map = new Map<string, Section>()
  for (const sec of inv?.sections ?? []) map.set(sec.name, { ...sec, source: 'system' })
  for (const item of cfg.inject ?? []) {
    const isCustom = item.custom === true
    const existing = map.get(item.name)
    if (existing) {
      map.set(item.name, isCustom
        ? { ...existing, order: item.order, text: item.text ?? '', source: 'custom' }
        : { ...existing, order: item.order, source: 'system' })
    } else {
      map.set(item.name, {
        name: item.name,
        order: item.order,
        text: item.text ?? '',
        active: !blockedNames.has(item.name),
        replaced: false,
        source: isCustom ? 'custom' : 'system',
      })
    }
  }
  return [...map.values()].sort((a, b) => a.order - b.order).map((sec, i) => ({ ...sec, order: i }))
}

/** ConfigPatch 里对外的注入条目（always 组刻意不带 phase 键）。 */
export interface ResolvedInject {
  name: string
  order: number
  text: string
  custom?: boolean
  phase?: Phase
}

/**
 * 把一条相对链解析为绝对有序名字（0..n-1）。
 * 没有锚点（或锚点不在本组内）的名字按原始顺序排在最前；每个带锚点的名字
 * 插到其锚点之后；剩余的名字（存在环）追加到末尾。
 */
function resolveChain(list: Array<{ name: string; after?: string }>): string[] {
  const afterMap = new Map<string, string | undefined>()
  for (const sec of list) afterMap.set(sec.name, sec.after)

  const result: string[] = []
  const placed = new Set<string>()

  for (const sec of list) {
    const anchor = afterMap.get(sec.name)
    if (!anchor || !afterMap.has(anchor)) { result.push(sec.name); placed.add(sec.name) }
  }

  let changed = true
  while (changed) {
    changed = false
    for (const sec of list) {
      if (placed.has(sec.name)) continue
      const anchor = afterMap.get(sec.name)
      if (anchor && placed.has(anchor)) {
        result.splice(result.indexOf(anchor) + 1, 0, sec.name)
        placed.add(sec.name)
        changed = true
      }
    }
  }

  for (const sec of list) {
    if (!placed.has(sec.name)) { result.push(sec.name); placed.add(sec.name) }
  }
  return result
}

/**
 * 把快照里的相对顺序解析为注入条目列表。
 *
 * order 条目可以带 `phase`：同名而不同 phase 的多条 = 该段在多个阶段各有自己的
 * 位置（每阶段有独立的 order 空间，与 UI 的 phaseInjectEntries 一致）。无 phase
 * 的条目属于 always 组 —— 也就是旧快照的单一全局序，输出形状与旧实现逐键一致
 * （刻意不写 phase 键，「保存 → 应用 = 不动点」的不变量依赖键形状完全相同）。
 */
export function resolveOrder(presetOrder: PresetData['order']): ResolvedInject[] {
  const list = presetOrder ?? []
  const groups = new Map<Phase, NonNullable<PresetData['order']>>([['always', []]])
  for (const sec of list) {
    const phase = sec.phase ?? 'always'
    const group = groups.get(phase)
    if (group) group.push(sec)
    else groups.set(phase, [sec])
  }
  const out: ResolvedInject[] = []
  for (const [phase, members] of groups) {
    const textMap = new Map(members.map((x) => [x.name, x.text ?? '']))
    const customMap = new Map(members.map((x) => [x.name, x.custom === true]))
    const names = resolveChain(members)
    out.push(...names.map((name, i) => (phase === 'always'
      ? { name, order: i, text: textMap.get(name) ?? '', custom: customMap.get(name) }
      : { name, order: i, text: textMap.get(name) ?? '', custom: customMap.get(name), phase })))
  }
  return out
}

/**
 * 计算应用预设时的配置补丁：
 *  - 同名段被覆盖（顺序列表在运行时驱动这一行为）
 *  - 预设中有、当前系统里匹配不上的段默认跳过（跨系统导入不凭空建段）
 *  - 当前有、但不在预设有序列表中的段默认被屏蔽
 *  - 只有预设的「激活段」（在 order 列表且不在其屏蔽名单中）被解除屏蔽；
 *    预设自己屏蔽的段保持屏蔽。
 *
 * 当前配置里存在、但不在预设有序列表中的自定义注入段会被保留到结果的
 * inject 列表中（因此仍然可见）并置为禁用（加入屏蔽集合），而不是被静默
 * 丢弃——预设不能让用户自己注入的凭空消失。
 */
export function applyPresetData(data: PresetData, cfg: Config, currentNames: ReadonlySet<string>): ConfigPatch {
  const presetOrder = data.order ?? []
  const presetNames = new Set(presetOrder.map((x) => x.name))
  // 黑名单同样按当前系统过滤：匹配不上的名字跳过（屏蔽不存在的段没有意义，
  // 还会污染配置，让下一次快照出现「sections ⊆ order」被破坏的孤儿名单）。
  const blocked = new Set((data.sections ?? []).filter((n) => currentNames.has(n)))

  // 注入列表 = 预设解析出的顺序，再追加当前配置中存在、但预设列表没有的
  // 自定义注入段。让它们留在 `inject` 里才能保持可见；随后统一置为禁用。
  // 被保留的自定义段接在预设自身的下标之后；若预设只覆盖一小部分段，它们
  // 可能与清单原生 order 并列——合并视图按稳定排序（清单在前），顺序仍是
  // 确定性的，且下一次重排/持久化会把所有下标重新连续化。
  // 预设 order 先按当前系统的段名过滤（匹配不上就跳过，绝不凭空建段）——
  // 在解析前过滤让保留条目的 order 保持按组连续；锚点被过滤掉时
  // resolveChain 会把该条目回退到组尾，顺序仍然确定。
  const inject = resolveOrder(presetOrder.filter((x) => currentNames.has(x.name)))
  const kept = new Set(inject.map((x) => x.name))
  let order = inject.length
  for (const item of cfg.inject ?? []) {
    if (!item || !item.name || presetNames.has(item.name) || kept.has(item.name)) continue
    kept.add(item.name)
    inject.push({ name: item.name, order: order++, text: item.text ?? '', custom: item.custom === true })
  }

  // 仅当预设确实定义了 order 列表时才强制执行「激活集合」。
  // 空的 order（例如手工编写 / 只屏蔽了几个段的导入预设）绝不能把当前所有
  // 段默认禁用。
  if (presetOrder.length > 0) {
    const activeNames = new Set([...presetNames].filter((n) => !blocked.has(n)))
    for (const name of currentNames) if (!presetNames.has(name)) blocked.add(name)
    for (const name of activeNames) blocked.delete(name)
  }

  // 阶段化字段一律「快照有则覆盖，缺省则保留当前值」：旧快照（没有这些键）
  // 应用后仍只换静态过滤，绝不把用户已有的阶段目录与阶段名单抹平。
  // 缺席时不留下显式 undefined 键 —— 「保存→应用 = 不动点」的不变量依赖键形状。
  const keptCatalogs: ToolsConfig = {}
  const bootstrap = data.tools?.bootstrap !== undefined ? data.tools.bootstrap : cfg.tools?.bootstrap
  const compaction = data.tools?.compaction !== undefined ? data.tools.compaction : cfg.tools?.compaction
  if (bootstrap !== undefined) keptCatalogs.bootstrap = bootstrap
  if (compaction !== undefined) keptCatalogs.compaction = compaction
  const patch: ConfigPatch = {
    sections: [...blocked],
    replace: { ...(cfg.replace ?? {}), ...(data.replace ?? {}) },
    inject,
    tools: {
      exclude: data.tools?.exclude ?? [],
      ...keptCatalogs,
    },
  }
  if (Array.isArray(data.sectionsBootstrap)) patch.sectionsBootstrap = data.sectionsBootstrap
  if (Array.isArray(data.sectionsCompaction)) patch.sectionsCompaction = data.sectionsCompaction
  return patch
}

/**
 * 从配置中移除一个 custom（本插件注入）段：它从 inject 列表消失，不再被
 * 强制加入屏蔽集合，相关的替换文本也被清除。剩余的 inject 条目会被重新
 * 编号为连续的 0..n-1（虚拟下标模型），删除不会留下空洞。读自宿主清单的
 * system 段无法这样移除（下次读取清单时它们又会回来）。
 */
export function removeSection(name: string, cfg: Config): Pick<Config, 'sections' | 'inject' | 'replace'> {
  const sections = (cfg.sections ?? []).filter((n) => n !== name)
  const inject = (cfg.inject ?? [])
    .filter((item) => item.name !== name)
    .map((item, i) => ({ ...item, order: i }))
  const replace = { ...(cfg.replace ?? {}) }
  delete replace[name]
  return { sections, inject, replace }
}

// ── 工具过滤 ─────────────────────────────────────────────────────────────

export type ToolsCfg = { exclude?: string[] }

/** 三个阶段部分的固定展示顺序：引导期 → 常驻期 → 压缩受控期。
 *  恒定全部渲染 —— 预设没有某个阶段时该部分只是空的，绝不隐藏。 */
export const PART_ORDER: PhaseViewKey[] = ['bootstrap', 'active', 'compaction']

/**
 * 一个阶段部分写回哪一份过滤配置：引导期 → `tools.bootstrap`、压缩受控期 →
 * `tools.compaction`、常驻期 → 静态 `tools.exclude`。三份名单互不继承。
 */
export function phaseConfigKey(key: PhaseViewKey): 'bootstrap' | 'compaction' | 'static' {
  return key === 'active' ? 'static' : key
}

/**
 * 把一个阶段的 exclude 名单写回整份工具配置，返回新对象（其余阶段原样保留）。
 * 一次拖放可能要同时改两个阶段的名单（搬移 = 源阶段隐藏 + 目标阶段显示），必须
 * 在同一个对象上连续套完再落一次写入 —— 分两次写会各自基于旧 cfg 计算而互相覆盖。
 */
export function withPhaseExclude(tools: ToolsConfig | undefined, key: PhaseViewKey, exclude: string[]): ToolsConfig {
  const base = tools ?? {}
  const target = phaseConfigKey(key)
  if (target === 'bootstrap') return { ...base, bootstrap: { ...(base.bootstrap ?? {}), exclude } }
  if (target === 'compaction') return { ...base, compaction: { ...(base.compaction ?? {}), exclude } }
  return { ...base, exclude }
}

/**
 * 把一个阶段的 add 名单（要加回该阶段的工具）写回整份工具配置，返回新对象。
 * 与 withPhaseExclude 对称：常驻期写静态 `tools.add`，引导期写 `tools.bootstrap.add`，
 * 压缩受控期写 `tools.compaction.add`，其余阶段原样保留。
 */
export function withPhaseAdd(tools: ToolsConfig | undefined, key: PhaseViewKey, add: string[]): ToolsConfig {
  const base = tools ?? {}
  const target = phaseConfigKey(key)
  if (target === 'bootstrap') return { ...base, bootstrap: { ...(base.bootstrap ?? {}), add } }
  if (target === 'compaction') return { ...base, compaction: { ...(base.compaction ?? {}), add } }
  return { ...base, add }
}

/** 某个工具在当前黑名单配置下是否被隐藏。 */
export function isToolHidden(name: string, toolsCfg: ToolsCfg | undefined): boolean {
  return (toolsCfg?.exclude ?? []).includes(name)
}

/** 切换某个工具的隐藏状态，返回新的工具配置（不改原对象）。 */
export function toggleTool(name: string, currentlyHidden: boolean, toolsCfg: ToolsCfg | undefined): ToolsCfg {
  const exclude = (toolsCfg?.exclude ?? []).slice()
  if (currentlyHidden) { const i = exclude.indexOf(name); if (i >= 0) exclude.splice(i, 1) }
  else if (!exclude.includes(name)) exclude.push(name)
  return { exclude }
}

// ── 按 agent 预设的覆盖编辑 ─────────────────────────────────────────────

/**
 * 编辑目标的「显示视图」：全局目标返回原配置；agent 预设目标把该预设
 * override 的字段叠在全局值之上展示（空缺字段显示全局继承值）。`presets`
 * 与 `activePreset` 永远来自全局 —— 预设快照库本身不分作用域。
 */
export function editView(cfg: Config, target: string | undefined): Config {
  if (!target) return cfg
  const ovr = cfg.overrides?.[target] ?? {}
  return {
    sections: ovr.sections ?? cfg.sections,
    sectionsBootstrap: ovr.sectionsBootstrap ?? cfg.sectionsBootstrap,
    sectionsCompaction: ovr.sectionsCompaction ?? cfg.sectionsCompaction,
    replace: ovr.replace ?? cfg.replace,
    inject: ovr.inject ?? cfg.inject,
    tools: {
      exclude: ovr.tools?.exclude ?? cfg.tools?.exclude,
      add: ovr.tools?.add ?? cfg.tools?.add,
      bootstrap: ovr.tools?.bootstrap ?? cfg.tools?.bootstrap,
      compaction: ovr.tools?.compaction ?? cfg.tools?.compaction,
    },
    presets: cfg.presets,
    activePreset: cfg.activePreset,
  }
}

/**
 * 往某个 agent 预设的 override 里写入一个字段，返回新的 overrides 记录
 * （不改原对象）。与 editView 配对：编辑视图里看到的继承值一旦被修改，
 * 就整体落成该预设自己的字段（字段级接管语义）。
 */
export function setOverrideField(
  cfg: Config,
  target: string,
  field: 'sections' | 'replace' | 'inject' | 'tools',
  value: unknown,
): Record<string, OverrideData> {
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

/**
 * Derive a safe default filename for a preset export. User-entered preset
 * names may contain characters that are illegal in filenames (`/\:*?"<>|`,
 * control chars) — those are replaced; a trailing dot/space is trimmed
 * (invalid on Windows); an empty or all-illegal result falls back to
 * `preset`.
 */
export function presetExportFilename(name: string): string {
  const sanitized = String(name)
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
    .trim()
    .replace(/[. ]+$/, '')
  const base = sanitized === '' ? 'preset' : sanitized
  return `${base}.json`
}

/**
 * 导入预设：同名的会被跳过，只追加名字不同的预设。返回新的预设列表
 * （若没有任何变更则返回原列表）。
 */
export function addImportedPresets(existing: Preset[], parsed: unknown, makeId: () => string): Preset[] {
  const incoming = Array.isArray(parsed) ? parsed : [parsed]
  const existingNames = new Set(existing.map((p) => p.name))
  const added = incoming
    .filter((p) => p && typeof (p as { name?: unknown }).name === 'string' && !existingNames.has((p as Preset).name))
    .map((p) => ({ id: makeId(), name: (p as Preset).name, data: ((p as Preset).data ?? {}) as PresetData }))
  return added.length > 0 ? [...existing, ...added] : existing
}

/** 删除某个预设；若它正是当前激活的预设，则同时清除 activeId。 */
export function removePreset(presets: Preset[], id: string, activeId?: string): { presets: Preset[]; activeId?: string } {
  return {
    presets: presets.filter((p) => p.id !== id),
    activeId: activeId === id ? undefined : activeId,
  }
}

/** 生成预设 id：时间戳 + 随机段（base36），够用且无需额外依赖。 */
export function genId(): string {
  return 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

/** 纯函数的预设 / 段操作助手，同时被客户端 UI 与 Node 测试复用（不触碰 IO 与 React）。 */
import type { Config, Inventory, Preset, PresetData } from './types.ts'

export interface Section {
  name: string
  order: number
  text?: string
  active: boolean
  replaced: boolean
  /** `system` = 读自宿主提示词清单（不可删除）；`custom` = 本插件注入（可删除）。 */
  source?: 'system' | 'custom'
}

/** 应用预设后需要回写到设置作用域的那部分配置字段。 */
export interface ConfigPatch {
  sections: string[]
  replace: Record<string, string>
  inject: Array<{ name: string; order: number; text: string }>
  tools: { exclude: string[]; include: string[] }
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

/**
 * 把预设里的相对顺序解析为绝对有序列表（0..n-1）。
 * 没有锚点（或锚点不在集合中）的段按预设原始顺序排在最前；每个带锚点的段
 * 插到其锚点之后；剩余的段（存在环）追加到末尾。
 */
export function resolveOrder(presetOrder: PresetData['order']): Array<{ name: string; order: number; text: string; custom?: boolean }> {
  const list = presetOrder ?? []
  const afterMap = new Map<string, string | undefined>()
  const textMap = new Map<string, string>()
  const customMap = new Map<string, boolean>()
  for (const sec of list) {
    afterMap.set(sec.name, sec.after)
    textMap.set(sec.name, sec.text)
    customMap.set(sec.name, sec.custom === true)
  }

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

  return result.map((name, i) => ({ name, order: i, text: textMap.get(name) ?? '', custom: customMap.get(name) }))
}

/**
 * 从当前配置构建预设快照。order 列表派生自合并后的完整段列表（而不仅是
 * `cfg.inject`），这样即使保存前只是屏蔽了几个段（没有重排），预设仍会携带
 * 完整的有序集合，应用时才能得到一个有意义的「激活列表」。
 */
export function buildPresetData(cfg: Config, merged: Section[]): PresetData {
  // 只有 custom（本插件注入）的段才把自身文本写进预设的 order 列表；
  // system 段保留空文本，应用预设时就只会重排它们，绝不冻结其动态生成的内容。
  const order = merged.map((sec, i) => ({
    name: sec.name,
    after: i > 0 ? merged[i - 1].name : undefined,
    text: sec.source === 'custom' ? (sec.text ?? '') : '',
    custom: sec.source === 'custom',
  }))
  return {
    sections: cfg.sections,
    replace: cfg.replace,
    order,
    tools: cfg.tools,
  }
}

/**
 * 计算应用预设时的配置补丁：
 *  - 同名段被覆盖（顺序列表在运行时驱动这一行为）
 *  - 预设中有、当前提示词中没有的段被添加
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
  const blocked = new Set(data.sections ?? [])

  // 注入列表 = 预设解析出的顺序，再追加当前配置中存在、但预设列表没有的
  // 自定义注入段。让它们留在 `inject` 里才能保持可见；随后统一置为禁用。
  // 被保留的自定义段接在预设自身的下标之后；若预设只覆盖一小部分段，它们
  // 可能与清单原生 order 并列——合并视图按稳定排序（清单在前），顺序仍是
  // 确定性的，且下一次重排/持久化会把所有下标重新连续化。
  const inject = resolveOrder(presetOrder)
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

  return {
    sections: [...blocked],
    replace: { ...(cfg.replace ?? {}), ...(data.replace ?? {}) },
    inject,
    tools: { exclude: data.tools?.exclude ?? [], include: data.tools?.include ?? [] },
  }
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

export type ToolsCfg = { exclude?: string[]; include?: string[] }

/** 在当前 include/exclude 配置下，某个工具是否被隐藏。 */
export function isToolHidden(name: string, toolsCfg: ToolsCfg | undefined): boolean {
  const include = toolsCfg?.include ?? []
  const exclude = toolsCfg?.exclude ?? []
  return include.length > 0 ? !include.includes(name) : exclude.includes(name)
}

/** 切换某个工具的隐藏状态，返回新的工具配置（不改原对象）。 */
export function toggleTool(name: string, currentlyHidden: boolean, toolsCfg: ToolsCfg | undefined): ToolsCfg {
  const include = toolsCfg?.include ?? []
  const exclude = toolsCfg?.exclude ?? []
  if (include.length > 0) {
    const next = include.slice()
    if (currentlyHidden) {
      next.push(name)
      // 白名单模式下重新显示工具时，必须同时清掉残留的黑名单条目，
      // 否则该名字会同时留在两个列表里，用户日后切回黑名单模式时它又会
      // 变成隐藏。
      const nextExclude = exclude.filter((n) => n !== name)
      return { exclude: nextExclude, include: next }
    }
    const i = next.indexOf(name)
    if (i >= 0) next.splice(i, 1)
    return { exclude, include: next }
  }
  const next = exclude.slice()
  if (currentlyHidden) { const i = next.indexOf(name); if (i >= 0) next.splice(i, 1) }
  else next.push(name)
  return { exclude: next, include }
}

/**
 * 在 include（白名单）与 exclude（黑名单）两种模式间切换。开启 include 模式
 * 时会丢弃当前工具集里不认识的名称，并从当前未被排除的工具中初始化白名单；
 * 关闭时清空白名单（只保留认识的 exclude 名称）。
 */
export function setToolMode(on: boolean, toolsCfg: ToolsCfg | undefined, toolNames: string[]): ToolsCfg {
  const known = new Set(toolNames)
  const exclude = (toolsCfg?.exclude ?? []).filter((n) => known.has(n))
  if (on) return { exclude, include: toolNames.filter((n) => !exclude.includes(n)) }
  return { exclude, include: [] }
}

// ── 预设列表操作 ──────────────────────────────────────────────────────────

/** 序列化预设用于导出（JSON 安全的完整快照）。 */
export function serializePreset(preset: Preset): { name: string; data: PresetData } {
  return { name: preset.name, data: preset.data }
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

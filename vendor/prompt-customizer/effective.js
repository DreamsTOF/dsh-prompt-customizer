/**
 * 预设 override 生效视图 + 阶段过滤。所有阶段字段名/状态映射都来自 model.js 的
 * PHASES 唯一表，不再手写三份 if/else。
 */
import { PHASES, phaseOfStatus, phaseOf, normalizeEntry, entryMatches, uniqueEntries } from './model.js'

function entryList(value) {
  return Array.isArray(value) ? value.map(normalizeEntry).filter((entry) => entry !== undefined) : []
}
function hasList(value) {
  return Array.isArray(value) && value.length > 0
}
function hasTools(tools) {
  if (tools === null || typeof tools !== 'object') return false
  if (hasList(tools.exclude) || hasList(tools.add)) return true
  return PHASES.some((phase) => phase.toolField !== undefined && hasTools(tools[phase.toolField]))
}
/** 阶段名是否可识别：`always`（跨阶段）或 PHASES 里的名义阶段。 */
function knownPhase(value) {
  return value === 'always' || phaseOf(value) !== undefined
}
/** 条目是否可用：对象、有名字、phase 可识别；未知 phase 的条目直接忽略（绝不静默当 always）。 */
function usableItem(item) {
  if (item === null || typeof item !== 'object') return false
  if (typeof item.name !== 'string' || item.name === '') return false
  return item.phase === undefined || knownPhase(item.phase)
}
function mergeEntryLists(left, right) {
  return uniqueEntries([...(Array.isArray(left) ? left : []), ...(Array.isArray(right) ? right : [])])
}

/** 注入条目是否被本阶段屏蔽：有 source 按身份，无 source 按名字兜底。 */
function injectDenied(denied, item) {
  const entry = normalizeEntry(item)
  if (entry === undefined) return false
  return denied.some((candidate) => candidate.name === entry.name
    && (entry.source === undefined || entryMatches(candidate, entry)))
}

/** 一份 override 的生效配置：空缺字段 = 无定制。 */
export function effectiveConfig(ovr) {
  const out = {}
  for (const phase of PHASES) {
    out[phase.sectionField] = entryList(ovr?.[phase.sectionField])
    out[phase.contextField] = entryList(ovr?.[phase.contextField])
  }
  out.replacements = Array.isArray(ovr?.replacements) ? ovr.replacements.filter(usableItem) : []
  out.inject = Array.isArray(ovr?.inject) ? ovr.inject.filter(usableItem) : []
  out.tools = hasTools(ovr?.tools) ? ovr.tools : {}
  return out
}

/** 合并预设级与工作区级：工作区可新增隐藏/替换/注入，不能移除预设已有的控制（候选超集）。 */
/**
 * @archive 工作区级提示词/工具层已下线；保留合并实现供后续恢复参考，
 * 当前活跃路径不再调用。
 */
export function mergeOverrideLayers(presetOvr, workspaceOvr) {
  const base = presetOvr !== null && typeof presetOvr === 'object' ? presetOvr : {}
  const ws = workspaceOvr !== null && typeof workspaceOvr === 'object' ? workspaceOvr : {}
  const out = { ...base }
  // 破坏式更新：旧的全局 replace 字典不再属于任何一层。
  delete out.replace
  for (const phase of PHASES) {
    out[phase.sectionField] = mergeEntryLists(base[phase.sectionField], ws[phase.sectionField])
    out[phase.contextField] = mergeEntryLists(base[phase.contextField], ws[phase.contextField])
  }
  out.replacements = [...(Array.isArray(base.replacements) ? base.replacements : []), ...(Array.isArray(ws.replacements) ? ws.replacements : [])]
  out.inject = [...(Array.isArray(base.inject) ? base.inject : []), ...(Array.isArray(ws.inject) ? ws.inject : [])]
  const bt = base.tools !== null && typeof base.tools === 'object' ? base.tools : {}
  const wt = ws.tools !== null && typeof ws.tools === 'object' ? ws.tools : {}
  const tools = { ...bt, exclude: mergeEntryLists(bt.exclude, wt.exclude), add: mergeEntryLists(bt.add, wt.add) }
  for (const phase of PHASES) {
    if (phase.toolField === undefined) continue
    const b = bt[phase.toolField] !== null && typeof bt[phase.toolField] === 'object' ? bt[phase.toolField] : {}
    const w = wt[phase.toolField] !== null && typeof wt[phase.toolField] === 'object' ? wt[phase.toolField] : {}
    tools[phase.toolField] = { exclude: mergeEntryLists(b.exclude, w.exclude), add: mergeEntryLists(b.add, w.add) }
  }
  out.tools = tools
  return out
}

/** 当前阶段生效的注入段：always + 本阶段。 */
export function filterInjectByPhase(injectList, status) {
  const phase = phaseOfStatus(status)
  return (Array.isArray(injectList) ? injectList : []).filter((item) => {
    if (item === null || typeof item !== 'object') return false
    const itemPhase = item?.phase === undefined ? 'always' : item.phase
    if (typeof itemPhase !== 'string' || !knownPhase(itemPhase)) return false
    return itemPhase === 'always' || itemPhase === phase
  })
}

/** 当前阶段生效的替换条目：always + 本阶段。 */
export function filterReplacementsByPhase(replacements, status) {
  const phase = phaseOfStatus(status)
  return (Array.isArray(replacements) ? replacements : []).filter((item) => {
    if (item === null || typeof item !== 'object') return false
    const itemPhase = item?.phase === undefined ? 'always' : item.phase
    if (typeof itemPhase !== 'string' || !knownPhase(itemPhase)) return false
    return itemPhase === 'always' || itemPhase === phase
  })
}

/** 当前阶段生效的工具过滤配置。 */
export function pickToolsFilter(toolsCfg, status) {
  const phase = phaseOfStatus(status)
  const phaseTools = phaseOf(phase)?.toolField
  const scoped = phaseTools === undefined ? toolsCfg : toolsCfg?.[phaseTools]
  return {
    exclude: scoped?.exclude ?? [],
    add: scoped?.add ?? [],
  }
}

/** 每阶段独立的段屏蔽名单（返回 EntryRef[]）。 */
export function pickSectionsForStatus(config, status) {
  const phase = phaseOfStatus(status)
  const field = phaseOf(phase)?.sectionField
  return field === undefined || !Array.isArray(config?.[field]) ? [] : config[field]
}

/** 每阶段独立的上下文屏蔽名单（返回 EntryRef[]）。 */
export function pickContextsForStatus(config, status) {
  const phase = phaseOfStatus(status)
  const field = phaseOf(phase)?.contextField
  return field === undefined || !Array.isArray(config?.[field]) ? [] : config[field]
}

/** 段级策略：屏蔽 → 阶段替换 → 注入 → 排序。 */
export function applySectionPolicy(baseSections, cfg, status) {
  const denied = pickSectionsForStatus(cfg, status)
  const replacements = filterReplacementsByPhase(cfg.replacements, status)
  const injectList = filterInjectByPhase(cfg.inject, status)
  let sections = baseSections
    .filter((section) => !denied.some((entry) => entryMatches(entry, section)))
    .map((section, i) => {
      // 后写覆盖前写：工作区层追加在预设层之后，同名同阶段的替换以工作区为准。
      let replacement
      for (let index = replacements.length - 1; index >= 0; index--) {
        if (entryMatches(replacements[index], section)) {
          replacement = replacements[index]
          break
        }
      }
      return replacement === undefined
        ? { ...section, order: i }
        : { ...section, order: i, text: replacement.text }
    })
  for (const item of injectList) {
    if (item === null || typeof item !== 'object' || typeof item.name !== 'string') continue
    if (injectDenied(denied, item)) continue
    const index = sections.findIndex((section) => section.name === item.name && entryMatches(item, section))
    const itemText = typeof item.text === 'string' ? item.text : ''
    if (index >= 0) {
      sections[index] = { ...sections[index], text: itemText || sections[index].text, order: item.order }
    } else if (item.custom === true || itemText) {
      const entry = normalizeEntry(item)
      sections.push({
        name: item.name,
        ...entry?.source === undefined ? {} : { source: entry.source },
        order: item.order,
        text: itemText,
      })
    }
  }
  sections.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  return sections
}

/**
 * 提示词段面板纯状态逻辑（无 React / 无 IO）。
 *
 * 配置名单是 EntryRef[]（{name, source?}），行身份 = name+source；阶段字段名
 * 与阶段顺序全部来自 model.js 的 PHASES。
 */

import { PHASES, phaseOf, normalizeEntry, entryKey, entryMatches, sourceKey } from './model.js'
import { filterReplacementsByPhase } from './effective.js'

const PHASE_KEYS = PHASES.map((phase) => phase.key)

export function sectionListOf(key) {
  return phaseOf(key)?.sectionField
}

export function injectPhaseOf(key) {
  return phaseOf(key)?.key
}

export function acceptsInjectFor(key, phase) {
  if (phase === 'always') return true
  return phase === key
}

function entryListOf(value) {
  return Array.isArray(value) ? value.map(normalizeEntry).filter((entry) => entry !== undefined) : []
}

function sameEntry(left, wanted) {
  if (left.name !== wanted.name) return false
  if (wanted.source === undefined) return true
  return sourceKey(left.source) === sourceKey(wanted.source)
}

export function deniedEntries(cfg, key) {
  const field = sectionListOf(key)
  return field === undefined ? [] : entryListOf(cfg?.[field])
}

export function deniedNames(cfg, key) {
  return deniedEntries(cfg, key).map((entry) => entry.name)
}

export function injectedAt(cfg, key) {
  const phase = injectPhaseOf(key)
  const names = new Set()
  const custom = new Set()
  const text = new Map()
  const order = new Map()
  for (const item of cfg?.inject ?? []) {
    const entry = normalizeEntry(item)
    if (entry === undefined) continue
    const identity = entryKey(entry)
    const itemPhase = item.phase === undefined ? 'always' : item.phase
    if (itemPhase !== 'always' && phaseOf(itemPhase) === undefined) continue
    if (itemPhase === phase) order.set(identity, item.order ?? 0)
    if (!acceptsInjectFor(key, itemPhase)) continue
    names.add(identity)
    if (item.text && (itemPhase === phase || !text.has(identity))) text.set(identity, item.text)
    if (item.custom === true) custom.add(identity)
  }
  return { phase, names, custom, text, order }
}

export function blockPatch(cfg, key, entry, blocked) {
  const field = sectionListOf(key)
  const wanted = normalizeEntry(entry)
  if (field === undefined || wanted === undefined) return {}
  const cur = entryListOf(cfg?.[field])
  const index = cur.findIndex((item) => sameEntry(item, wanted))
  if (blocked) {
    if (index >= 0) return {}
    cur.push(wanted)
  } else {
    if (index < 0) return {}
    cur.splice(index, 1)
  }
  return { [field]: cur }
}

function identityOf(value) {
  const entry = normalizeEntry(value)
  return entry === undefined ? '' : entryKey(entry)
}

function matchesRow(row, value) {
  if (typeof value === 'string') return row.name === value
  return identityOf(row) === identityOf(value)
}

export function reorderInsert(rows, drag, target, pos, newRow = null) {
  if (identityOf(drag) === '' || identityOf(target) === '') return null
  const base = rows.filter((row) => !matchesRow(row, drag))
  const idx = base.findIndex((row) => matchesRow(row, target))
  if (idx < 0) return null
  const insertAt = Math.max(0, Math.min(pos === 'above' ? idx : idx + 1, base.length))
  const entry = newRow ?? rows.find((row) => matchesRow(row, drag))
  if (!entry) return null
  base.splice(insertAt, 0, entry)
  return base
}

function injectEntryOf(row, phase, order) {
  const entry = normalizeEntry(row)
  return {
    name: entry.name,
    ...entry.source === undefined ? {} : { source: entry.source },
    order,
    text: row.override || (row.custom ? (row.text ?? '') : ''),
    phase,
    custom: row.custom === true,
  }
}

export function phaseInjectEntries(cfg, key, rows) {
  const phase = injectPhaseOf(key)
  if (phase === undefined) return Array.isArray(cfg?.inject) ? cfg.inject.slice() : []
  const others = (cfg?.inject ?? []).filter((item) => item !== null && typeof item === 'object'
    && (item.phase === undefined ? 'always' : item.phase) !== phase)
  return [...others, ...rows.map((row, i) => injectEntryOf(row, phase, i))]
}

export function mergedPhaseInjectEntries(cfg, rowsByKey) {
  const always = (cfg?.inject ?? []).filter((item) => item !== null && typeof item === 'object'
    && (item.phase ?? 'always') === 'always')
  const entries = PHASE_KEYS.flatMap((key) => {
    const phase = injectPhaseOf(key)
    return (rowsByKey?.[key] ?? []).map((row, i) => injectEntryOf(row, phase, i))
  })
  return [...always, ...entries]
}

const MIRROR_KEYS = ['active', ...PHASE_KEYS.filter((key) => key !== 'active')]

function mirrorText(row, native) {
  if (row.custom === true) return row.override || (row.text ?? '')
  if (row.override !== '') return row.override
  if (native === true) return ''
  if (row.dynamic === true) return ''
  const text = row.text ?? ''
  return text === '' || text.startsWith('<') ? '' : text
}

function nativeOfRow(nativeOf, key, row) {
  if (nativeOf === undefined) return undefined
  const byEntry = nativeOf(key, row)
  if (byEntry === true) return true
  const byName = nativeOf(key, row.name)
  if (byName === true) return true
  return byEntry !== undefined ? byEntry : byName
}

export function mirroredRows(cfg, views, nativeOf) {
  const picked = new Map()
  const order = []
  for (const key of MIRROR_KEYS) {
    for (const row of phaseRows(cfg, views?.[key] ?? null, key)) {
      const identity = identityOf(row)
      const native = nativeOfRow(nativeOf, key, row) === true
      const cur = picked.get(identity)
      if (cur === undefined) {
        picked.set(identity, { row, native })
        order.push(identity)
      } else if (cur.native !== true && native) {
        picked.set(identity, { row, native })
      }
    }
  }
  return order.map((identity) => picked.get(identity).row)
}

export function mirrorPhaseInjectEntries(cfg, rows, nativeOf) {
  const names = new Set(rows.map((row) => entryKey(normalizeEntry(row))))
  const always = (cfg?.inject ?? []).filter((item) => item !== null && typeof item === 'object'
    && (item.phase ?? 'always') === 'always'
    && names.has(entryKey(normalizeEntry(item))))
  const entries = []
  for (const key of MIRROR_KEYS) {
    const phase = injectPhaseOf(key)
    let order = 0
    for (const row of rows) {
      const entry = normalizeEntry(row)
      if (entry === undefined) continue
      const native = nativeOf === undefined ? false : nativeOfRow(nativeOf, key, row)
      if (native === null || native === undefined) continue
      const text = mirrorText(row, native)
      if (native !== true && text === '') continue
      entries.push({
        name: entry.name,
        ...entry.source === undefined ? {} : { source: entry.source },
        order: order++,
        text,
        phase,
        custom: row.custom === true,
      })
    }
  }
  return [...always, ...entries]
}

export function mirrorSkippedNames(rows, nativeOf) {
  const skipped = new Set()
  for (const key of MIRROR_KEYS) {
    for (const row of rows) {
      const native = nativeOfRow(nativeOf, key, row)
      if (native === null || native === undefined || native === true) continue
      if (mirrorText(row, false) === '') skipped.add(row.name)
    }
  }
  return [...skipped]
}

export function mirroredDeniedLists(rows) {
  const blocked = rows.filter((row) => row.blocked === true)
    .map((row) => (row.source === undefined ? { name: row.name } : { name: row.name, source: row.source }))
  return {
    sections: blocked,
    sectionsBootstrap: blocked.map((entry) => ({ ...entry })),
    sectionsCompaction: blocked.map((entry) => ({ ...entry })),
  }
}

function baseEntryOf(value) {
  const entry = normalizeEntry(value)
  if (entry === undefined) return undefined
  const out = typeof value === 'object' && value !== null ? { ...value, name: entry.name } : { name: entry.name }
  if (entry.source !== undefined) out.source = entry.source
  return out
}

function visibleEntries(value) {
  return (Array.isArray(value) ? value : []).map(baseEntryOf).filter((entry) => entry !== undefined)
}

export function phaseRows(cfg, view, key) {
  const descriptor = phaseOf(key)
  if (descriptor === undefined) return []
  const denied = deniedEntries(cfg, key)
  const deniedKeys = new Set(denied.map((entry) => entryKey(entry)))
  const replacements = filterReplacementsByPhase(cfg?.replacements, descriptor.status)
  const postEntries = visibleEntries(view?.sections)
  const baseEntries = visibleEntries(view?.baseSections)
  const postByKey = new Map(postEntries.map((entry) => [entryKey(entry), entry]))
  const baseByKey = new Map(baseEntries.map((entry) => [entryKey(entry), entry]))
  const { phase, names: injectedHere, custom: customNames, text, order: phaseOrder } = injectedAt(cfg, key)
  const picked = new Map()
  const order = []
  const push = (entry) => {
    const identity = entryKey(entry)
    if (identity === '' || picked.has(identity)) return
    picked.set(identity, normalizeEntry(entry))
    order.push(identity)
  }
  for (const entry of baseEntries) {
    if (postByKey.has(entryKey(entry)) || entry.blocked === true || deniedKeys.has(entryKey(entry))) push(entry)
  }
  for (const entry of postEntries) {
    if (!baseByKey.has(entryKey(entry)) && injectedHere.has(entryKey(entry))) push(entry)
  }
  for (const item of cfg?.inject ?? []) {
    const entry = normalizeEntry(item)
    if (entry === undefined) continue
    const itemPhase = item.phase === undefined ? 'always' : item.phase
    if (itemPhase !== phase) continue
    const identity = entryKey(entry)
    if (item.custom === true || text.get(identity) || baseByKey.has(identity) || postByKey.has(identity)) push(entry)
  }
  for (const identity of customNames) {
    const item = (cfg?.inject ?? []).find((candidate) => entryKey(candidate) === identity)
    if (item !== undefined) push(item)
  }
  for (const entry of denied) push(entry)

  const rows = order.map((identity) => {
    const entry = picked.get(identity)
    const baseSection = baseByKey.get(identity)
    const postSection = postByKey.get(identity)
    const override = text.get(identity) ?? ''
    const dynamic = typeof baseSection?.dynamic === 'boolean'
      ? baseSection.dynamic
      : typeof postSection?.dynamic === 'boolean' ? postSection.dynamic : undefined
    return {
      name: entry.name,
      ...entry.source === undefined ? {} : { source: entry.source },
      text: postSection?.text ?? baseSection?.text ?? '',
      replaced: override !== '' || replacements.some((item) => entryMatches(item, entry)),
      custom: customNames.has(identity),
      override,
      blocked: deniedKeys.has(identity),
      ...(dynamic === undefined ? {} : { dynamic }),
    }
  })
  if (phaseOrder.size > 0) {
    const fallback = new Map(rows.map((row, i) => [entryKey(row), i]))
    rows.sort((a, b) => (phaseOrder.get(entryKey(a)) ?? fallback.get(entryKey(a)) ?? 0) - (phaseOrder.get(entryKey(b)) ?? fallback.get(entryKey(b)) ?? 0))
  }
  return rows
}

export function zhMergedInjectEntries(cfg, views, zhMap) {
  const patched = {}
  for (const key of PHASE_KEYS) {
    patched[key] = phaseRows(cfg, views?.[key] ?? null, key).map((row) => {
      if (row.custom) return row
      const entry = zhMap?.[row.name]
      if (entry === undefined) return row
      const zh = typeof entry === 'function' ? entry(row.text) : entry
      return zh ? { ...row, override: zh, text: zh } : row
    })
  }
  return mergedPhaseInjectEntries(cfg, patched)
}

export function zhRevertInjectEntries(cfg, views, zhMap) {
  const patched = {}
  for (const key of PHASE_KEYS) {
    patched[key] = phaseRows(cfg, views?.[key] ?? null, key).map((row) => {
      if (row.custom || row.override === '' || zhMap?.[row.name] === undefined) return row
      return { ...row, override: '', text: '' }
    })
  }
  return mergedPhaseInjectEntries(cfg, patched)
}

export function zhApplied(cfg, zhMap) {
  for (const item of cfg?.inject ?? []) {
    if (item === null || typeof item !== 'object' || typeof item.name !== 'string') continue
    const zh = zhMap?.[item.name]
    if (typeof zh === 'string' && zh !== '' && item.text === zh) return true
  }
  return false
}

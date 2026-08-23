/** Pure preset / section helpers shared by the client UI and the node tests. */
import type { Config, Inventory, Preset, PresetData } from './types.ts'

export interface Section {
  name: string
  order: number
  text?: string
  active: boolean
  replaced: boolean
}

/** The config fields a preset apply must write back to the settings scope. */
export interface ConfigPatch {
  sections: string[]
  replace: Record<string, string>
  inject: Array<{ name: string; order: number; text: string }>
  tools: { exclude: string[]; include: string[] }
}

/** Merge the inventory sections with the user's inject list, sorted by order. */
export function mergeSections(inv: Inventory | null, cfg: Config, blockedNames: ReadonlySet<string>): Section[] {
  const map = new Map<string, Section>()
  for (const sec of inv?.sections ?? []) map.set(sec.name, sec)
  for (const item of cfg.inject ?? []) {
    const existing = map.get(item.name)
    if (existing) map.set(item.name, { ...existing, order: item.order })
    else map.set(item.name, {
      name: item.name,
      order: item.order,
      text: item.text || '<动态生成>',
      active: !blockedNames.has(item.name),
      replaced: false,
    })
  }
  return [...map.values()].sort((a, b) => a.order - b.order)
}

/**
 * Resolve a preset's relative order into an absolute ordered list (0..n-1).
 * Sections with no anchor (or whose anchor is absent) come first in preset
 * order; each anchored section is inserted right after its anchor; any
 * remaining sections (cycles) are appended.
 */
export function resolveOrder(presetOrder: PresetData['order']): Array<{ name: string; order: number; text: string }> {
  const list = presetOrder ?? []
  const afterMap = new Map<string, string | undefined>()
  const textMap = new Map<string, string>()
  for (const sec of list) {
    afterMap.set(sec.name, sec.after)
    textMap.set(sec.name, sec.text)
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

  return result.map((name, i) => ({ name, order: i, text: textMap.get(name) ?? '' }))
}

/**
 * Build a preset snapshot from the current config. The order list is derived
 * from the MERGED section list (not just `cfg.inject`) so that a preset saved
 * after only blocking sections (without reordering) still carries the full
 * ordered set, and thus a meaningful "active list" when applied.
 */
export function buildPresetData(cfg: Config, merged: Section[]): PresetData {
  const order = merged.map((sec, i) => ({
    name: sec.name,
    after: i > 0 ? merged[i - 1].name : undefined,
    text: sec.text ?? '',
  }))
  return {
    sections: cfg.sections,
    replace: cfg.replace,
    order,
    tools: cfg.tools,
  }
}

/**
 * Compute the config patch when applying a preset:
 *  - same-name sections are overridden (the order list drives this at runtime)
 *  - preset sections missing from the current prompt are added
 *  - current sections NOT in the preset's ordered list are disabled by default
 *  - only the preset's ACTIVE sections (in the order list but not in its block
 *    list) are unblocked; the preset's own blocked sections stay blocked.
 */
export function applyPresetData(data: PresetData, cfg: Config, currentNames: ReadonlySet<string>): ConfigPatch {
  const presetOrder = data.order ?? []
  const presetNames = new Set(presetOrder.map((x) => x.name))
  const blocked = new Set(data.sections ?? [])

  // Only enforce the "active set" when the preset actually defines an order.
  // An empty order (e.g. a hand-authored / imported preset that only blocks a
  // few sections) must not default-disable every current section.
  if (presetOrder.length > 0) {
    const activeNames = new Set([...presetNames].filter((n) => !blocked.has(n)))
    for (const name of currentNames) if (!presetNames.has(name)) blocked.add(name)
    for (const name of activeNames) blocked.delete(name)
  }

  return {
    sections: [...blocked],
    replace: { ...(cfg.replace ?? {}), ...(data.replace ?? {}) },
    inject: resolveOrder(presetOrder),
    tools: { exclude: data.tools?.exclude ?? [], include: data.tools?.include ?? [] },
  }
}

// ── Tool filtering ──────────────────────────────────────────────────────────

export type ToolsCfg = { exclude?: string[]; include?: string[] }

/** Whether a tool is hidden under the current include/exclude config. */
export function isToolHidden(name: string, toolsCfg: ToolsCfg | undefined): boolean {
  const include = toolsCfg?.include ?? []
  const exclude = toolsCfg?.exclude ?? []
  return include.length > 0 ? !include.includes(name) : exclude.includes(name)
}

/** Toggle a tool's hidden state, returning a new tools config. */
export function toggleTool(name: string, currentlyHidden: boolean, toolsCfg: ToolsCfg | undefined): ToolsCfg {
  const include = toolsCfg?.include ?? []
  const exclude = toolsCfg?.exclude ?? []
  if (include.length > 0) {
    const next = include.slice()
    if (currentlyHidden) next.push(name)
    else { const i = next.indexOf(name); if (i >= 0) next.splice(i, 1) }
    return { exclude, include: next }
  }
  const next = exclude.slice()
  if (currentlyHidden) { const i = next.indexOf(name); if (i >= 0) next.splice(i, 1) }
  else next.push(name)
  return { exclude: next, include }
}

/**
 * Switch between include (whitelist) and exclude (blacklist) modes. Turning
 * include mode on discards names unknown to the current tool set and seeds the
 * include list from the currently non-excluded tools; turning it off clears the
 * include list (keep only known exclude names).
 */
export function setToolMode(on: boolean, toolsCfg: ToolsCfg | undefined, toolNames: string[]): ToolsCfg {
  const known = new Set(toolNames)
  const exclude = (toolsCfg?.exclude ?? []).filter((n) => known.has(n))
  if (on) return { exclude, include: toolNames.filter((n) => !exclude.includes(n)) }
  return { exclude, include: [] }
}

// ── Preset list operations ──────────────────────────────────────────────────

/** Serialize a preset for export (JSON-safe full snapshot). */
export function serializePreset(preset: Preset): { name: string; data: PresetData } {
  return { name: preset.name, data: preset.data }
}

/**
 * Import preset(s): same-name presets are skipped, only distinct names are
 * added. Returns a new presets list (or the original if nothing changed).
 */
export function addImportedPresets(existing: Preset[], parsed: unknown, makeId: () => string): Preset[] {
  const incoming = Array.isArray(parsed) ? parsed : [parsed]
  const existingNames = new Set(existing.map((p) => p.name))
  const added = incoming
    .filter((p) => p && typeof (p as { name?: unknown }).name === 'string' && !existingNames.has((p as Preset).name))
    .map((p) => ({ id: makeId(), name: (p as Preset).name, data: ((p as Preset).data ?? {}) as PresetData }))
  return added.length > 0 ? [...existing, ...added] : existing
}

/** Delete a preset, clearing the active id if it pointed at the removed one. */
export function removePreset(presets: Preset[], id: string, activeId?: string): { presets: Preset[]; activeId?: string } {
  return {
    presets: presets.filter((p) => p.id !== id),
    activeId: activeId === id ? undefined : activeId,
  }
}

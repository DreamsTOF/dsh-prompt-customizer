/** Presets tab: save / apply / export / import complete customization snapshots. */
import { createElement as h, useRef, useState, type ReactElement, type ChangeEvent } from 'react'
import type { Config, Inventory, Preset, PresetData, SettingsScope } from './types.ts'
import type { Translate } from './locales.ts'
import { s } from './styles.ts'

export function PresetsTab({ cfg, inv, scope, t }: { cfg: Config; inv: Inventory | null; scope: SettingsScope; t: Translate }): ReactElement {
  const presets = cfg.presets ?? []
  const [name, setName] = useState('')
  const fileRef = useRef<HTMLInputElement | null>(null)

  // Current section names (inventory + injected), used to decide what to block.
  const currentNames = (() => {
    const set = new Set<string>()
    for (const sec of inv?.sections ?? []) set.add(sec.name)
    for (const item of cfg.inject ?? []) set.add(item.name)
    return set
  })()

  // Capture the current customization as a new preset (full snapshot). The
  // absolute order is converted to a relative form (each section records the
  // section it should follow) so the preset stays portable across prompts.
  const saveCurrent = (): void => {
    const presetName = name.trim() || `${t('preset')} ${presets.length + 1}`
    const inject = cfg.inject ?? []
    const order = inject.map((sec, i) => ({
      name: sec.name,
      after: i > 0 ? inject[i - 1].name : undefined,
      text: sec.text,
    }))
    const data: PresetData = {
      sections: cfg.sections,
      replace: cfg.replace,
      order,
      tools: cfg.tools,
    }
    scope.set('presets', [...presets, { id: genId(), name: presetName, data }])
    setName('')
  }

  // Apply a preset. The preset's section list defines the active set:
  //  - same-name sections are overridden (content + order)
  //  - preset sections missing from the current prompt are added
  //  - current sections NOT in the preset list are disabled (blocked)
  //  - the active sections are arranged by the preset's relative order
  const applyPreset = (preset: Preset): void => {
    const presetOrder = preset.data.order ?? []
    const presetNames = new Set(presetOrder.map((x) => x.name))

    // Blocked list: preset's own blocked names, plus any current section that
    // is not part of the preset's active set; preset's active names unblocked.
    const blocked = new Set(preset.data.sections ?? [])
    for (const name of currentNames) if (!presetNames.has(name)) blocked.add(name)
    for (const name of presetNames) blocked.delete(name)

    scope.set('inject', resolveOrder(presetOrder))
    scope.set('replace', { ...(cfg.replace ?? {}), ...(preset.data.replace ?? {}) })
    scope.set('sections', [...blocked])
    scope.set('tools', preset.data.tools ?? { exclude: [], include: [] })
    scope.set('activePreset', preset.id)
  }

  const deletePreset = (id: string): void => {
    scope.set('presets', presets.filter((p) => p.id !== id))
    if (cfg.activePreset === id) scope.unset('activePreset')
  }

  // Serialize a preset to a downloadable JSON file.
  const exportPreset = (preset: Preset): void => {
    const blob = new Blob([JSON.stringify({ name: preset.name, data: preset.data }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${preset.name}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Import preset(s) from a JSON file. Same-name presets are skipped; only
  // presets with new names are added to the local list.
  const onImportFile = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        const incoming = Array.isArray(parsed) ? parsed : [parsed]
        const existing = new Set(presets.map((p) => p.name))
        const added = incoming
          .filter((p) => p && typeof p.name === 'string' && !existing.has(p.name))
          .map((p) => ({ id: genId(), name: p.name, data: (p.data ?? {}) as PresetData }))
        if (added.length > 0) scope.set('presets', [...presets, ...added])
      } catch { /* ignore invalid json */ }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return h('div', { style: s.list }, [
    h('div', { style: s.injectBox }, [
      h('div', { style: s.rowTitle }, t('savePreset')),
      h('div', { style: s.injectRow }, [
        h('input', { style: { ...s.input, flex: 1 }, placeholder: t('presetName'), value: name, onChange: (e: ChangeEvent<HTMLInputElement>) => setName(e.target.value) }),
        h('button', { style: s.mini, onClick: saveCurrent }, t('save')),
      ]),
    ]),
    h('div', { style: s.injectBox }, [
      h('div', { style: s.rowTitle }, t('importPreset')),
      h('div', { style: s.injectRow }, [
        h('button', { style: s.mini, onClick: () => fileRef.current?.click() }, t('import')),
        h('input', { ref: fileRef, type: 'file', accept: '.json,application/json', style: { display: 'none' }, onChange: onImportFile }),
      ]),
    ]),
    presets.length === 0 ? h('div', { style: s.muted }, t('empty')) : null,
    presets.map((preset) => {
      const active = cfg.activePreset === preset.id
      return h('div', { key: preset.id, style: s.row }, [
        h('div', { style: s.rowBody }, [
          h('div', { style: s.rowTitle }, [
            h('span', { style: s.code }, preset.name),
            active ? h('span', { style: s.badgeOk }, t('active')) : null,
          ]),
        ]),
        h('button', { style: s.mini, onClick: () => applyPreset(preset) }, t('apply')),
        h('button', { style: s.mini, onClick: () => exportPreset(preset) }, t('export')),
        h('button', { style: s.mini, onClick: () => deletePreset(preset.id) }, t('delete')),
      ])
    }),
  ])
}

function genId(): string {
  return 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

/**
 * Resolve a preset's relative order into an absolute ordered list (0..n-1).
 * Sections with no anchor (or whose anchor is absent) come first in preset
 * order; each anchored section is inserted right after its anchor; any
 * remaining sections (cycles) are appended.
 */
function resolveOrder(presetOrder: Array<{ name: string; after?: string; text: string }>): Array<{ name: string; order: number; text: string }> {
  const afterMap = new Map<string, string | undefined>()
  const textMap = new Map<string, string>()
  for (const sec of presetOrder) {
    afterMap.set(sec.name, sec.after)
    textMap.set(sec.name, sec.text)
  }

  const result: string[] = []
  const placed = new Set<string>()

  // Roots: no anchor, or anchor not part of the preset's own set.
  for (const sec of presetOrder) {
    const anchor = afterMap.get(sec.name)
    if (!anchor || !afterMap.has(anchor)) {
      result.push(sec.name)
      placed.add(sec.name)
    }
  }

  // Chain resolution: place each section right after its (already placed) anchor.
  let changed = true
  while (changed) {
    changed = false
    for (const sec of presetOrder) {
      if (placed.has(sec.name)) continue
      const anchor = afterMap.get(sec.name)
      if (anchor && placed.has(anchor)) {
        result.splice(result.indexOf(anchor) + 1, 0, sec.name)
        placed.add(sec.name)
        changed = true
      }
    }
  }

  // Any remaining (cycle / unresolved) → append in preset order.
  for (const sec of presetOrder) {
    if (!placed.has(sec.name)) { result.push(sec.name); placed.add(sec.name) }
  }

  return result.map((name, i) => ({ name, order: i, text: textMap.get(name) ?? '' }))
}

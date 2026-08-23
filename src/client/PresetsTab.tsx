/** Presets tab: save / apply / export / import complete customization snapshots. */
import { createElement as h, useRef, useState, type ReactElement, type ChangeEvent } from 'react'
import type { Config, Inventory, Preset, PresetData, SettingsScope } from './types.ts'
import type { Translate } from './locales.ts'
import { applyPresetData, buildPresetData, mergeSections } from './presets.ts'
import { s } from './styles.ts'

export function PresetsTab({ cfg, inv, scope, t }: { cfg: Config; inv: Inventory | null; scope: SettingsScope; t: Translate }): ReactElement {
  const presets = cfg.presets ?? []
  const [name, setName] = useState('')
  const fileRef = useRef<HTMLInputElement | null>(null)

  const blockedNames = new Set(cfg.sections ?? [])
  const merged = mergeSections(inv, cfg, blockedNames)
  const currentNames = new Set(merged.map((sec) => sec.name))

  // Capture the current customization as a new preset (full snapshot). The
  // absolute order is converted to a relative form (each section records the
  // section it should follow) so the preset stays portable across prompts.
  const saveCurrent = (): void => {
    const presetName = name.trim() || `${t('preset')} ${presets.length + 1}`
    const data = buildPresetData(cfg, merged)
    scope.set('presets', [...presets, { id: genId(), name: presetName, data }])
    setName('')
  }

  // Apply a preset. The patch is computed by the pure helper:
  //  - same-name sections are overridden (content + order)
  //  - preset sections missing from the current prompt are added
  //  - current sections NOT in the preset list are disabled (blocked)
  //  - only the preset's ACTIVE sections are unblocked (its own blocked list
  //    is preserved)
  const applyPreset = (preset: Preset): void => {
    const patch = applyPresetData(preset.data, cfg, currentNames)
    scope.set('inject', patch.inject)
    scope.set('replace', patch.replace)
    scope.set('sections', patch.sections)
    scope.set('tools', patch.tools)
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

/**
 * Presets tab: save / apply / export / import complete customization snapshots.
 *
 * Import/export is environment-adaptive (see preset-io.ts): when the host is a
 * Tauri desktop WebView the native save/open dialog is used, with a WebView
 * fallback to Blob+anchor download / hidden file input whenever the host does
 * not serve the dialog/fs plugins.
 */
import { createElement as h, useRef, useState, type ReactElement, type ChangeEvent } from 'react'
import type { Config, Inventory, Preset, PresetData, SettingsScope } from './types.ts'
import type { Translate } from './locales.ts'
import { addImportedPresets, applyPresetData, buildPresetData, mergeSections, removePreset } from './presets.ts'
import { decodePresetExport, exportPresetFile, importPresetFile } from './preset-io.ts'
import { s } from './styles.ts'

export function PresetsTab({ cfg, inv, scope, t }: { cfg: Config; inv: Inventory | null; scope: SettingsScope; t: Translate }): ReactElement {
  const presets = cfg.presets ?? []
  const [name, setName] = useState('')
  const [ioError, setIoError] = useState<string | null>(null)
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
    const next = removePreset(presets, id, cfg.activePreset)
    scope.set('presets', next.presets)
    if (next.activeId === undefined && cfg.activePreset === id) scope.unset('activePreset')
  }

  // Shared import sink: parse the exported file text (single {name,data} object
  // or an array) and add every preset whose name is new. Same-name presets are
  // skipped; invalid JSON surfaces a friendly message.
  const applyImportedText = (text: string): void => {
    let parsed: unknown
    try {
      parsed = decodePresetExport(text)
    } catch {
      setIoError(t('importInvalid'))
      return
    }
    scope.set('presets', addImportedPresets(presets, parsed, genId))
    setIoError(null)
  }

  // Export one preset. Tauri host: native save dialog (+ real file write);
  // cancelled by the user = nothing more to do. Web / unadapted host: browser
  // download (Blob + anchor).
  const exportPreset = async (preset: Preset): Promise<void> => {
    const res = await exportPresetFile(preset)
    if (res.ok) { setIoError(null); return }
    if (!res.cancelled) setIoError(t('ioFailed') + (res.message ? ` — ${res.message}` : ''))
  }

  // Import. Tauri host: native open dialog; cancelled = no-op. Unavailable
  // (or plain web) = fall back to the hidden file input, which opens the OS
  // picker in both a browser and a WebView.
  const importPreset = async (): Promise<void> => {
    const res = await importPresetFile()
    if (res.kind === 'text') { applyImportedText(res.text); return }
    if (res.kind === 'cancelled') return
    fileRef.current?.click()
  }

  const onImportFile = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (!file) return
    // DOM FileReader: zero-arg handlers assign to its (this, ev) signature.
    const reader = new FileReader()
    reader.onload = () => applyImportedText(String(reader.result ?? ''))
    reader.onerror = () => setIoError(t('importInvalid'))
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
        h('button', { style: s.mini, onClick: () => void importPreset() }, t('import')),
        h('input', { ref: fileRef, type: 'file', accept: '.json,application/json', style: { display: 'none' }, onChange: onImportFile }),
      ]),
    ]),
    ioError ? h('div', { style: s.error }, ioError) : null,
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
        h('button', { style: s.mini, onClick: () => void exportPreset(preset) }, t('export')),
        h('button', { style: s.mini, onClick: () => deletePreset(preset.id) }, t('delete')),
      ])
    }),
  ])
}

function genId(): string {
  return 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}
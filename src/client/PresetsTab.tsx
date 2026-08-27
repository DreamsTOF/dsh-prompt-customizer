/** 预设 Tab：保存 / 应用 / 导出 / 导入完整的定制快照。 */
import { createElement as h, useRef, useState, type ReactElement, type ChangeEvent } from 'react'
import type { Config, Inventory, Preset, PresetData, SettingsScope } from './types.ts'
import type { Translate } from './locales.ts'
import { addImportedPresets, applyPresetData, buildPresetData, mergeSections, removePreset, serializePreset } from './presets.ts'
import { s } from './styles.ts'

export function PresetsTab({ cfg, inv, scope, t }: { cfg: Config; inv: Inventory | null; scope: SettingsScope; t: Translate }): ReactElement {
  const presets = cfg.presets ?? []
  const [name, setName] = useState('')
  const fileRef = useRef<HTMLInputElement | null>(null)

  const blockedNames = new Set(cfg.sections ?? [])
  const merged = mergeSections(inv, cfg, blockedNames)
  const currentNames = new Set(merged.map((sec) => sec.name))

  // 把当前定制捕获为新预设（完整快照）。绝对顺序会被转成相对形式
  // （每段记录它应跟随的前一段），因此预设可以跨不同提示词移植。
  const saveCurrent = (): void => {
    const presetName = name.trim() || `${t('preset')} ${presets.length + 1}`
    const data = buildPresetData(cfg, merged)
    scope.set('presets', [...presets, { id: genId(), name: presetName, data }])
    setName('')
  }

  // 应用预设。补丁由纯函数助手计算：
  //  - 同名段被覆盖（内容 + 顺序）
  //  - 预设中有、当前提示词中没有的段被添加
  //  - 当前有、但不在预设列表中的段被屏蔽
  //  - 只有预设的「激活段」被解除屏蔽（预设自己的屏蔽名单被保留）
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

  // 把预设序列化成可下载的 JSON 文件。
  const exportPreset = (preset: Preset): void => {
    const blob = new Blob([JSON.stringify(serializePreset(preset), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${preset.name}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 从 JSON 文件导入预设。同名预设会被跳过；只有名字是新的预设才会
  // 追加到本地列表。
  const onImportFile = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        scope.set('presets', addImportedPresets(presets, parsed, genId))
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

/** 生成预设 id：时间戳 + 随机段（base36），够用且无需额外依赖。 */
function genId(): string {
  return 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

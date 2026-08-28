/** 预设 Tab：保存 / 应用 / 导出 / 导入完整的定制快照。
 *  导入导出经 preset-io 双端适配：Tauri 2 桌面走原生对话框，Web 走
 *  下载 / 文件选择；成功 / 失败 / 取消都有面板内消息条提示。 */
import { createElement as h, useEffect, useRef, useState, type ReactElement, type ChangeEvent } from 'react'
import type { Config, Inventory, Preset } from './types.ts'
import type { Translate } from './locales.ts'
import { addImportedPresets, applyPresetData, buildPresetData, mergeSections, removePreset } from './presets.ts'
import { decodePresetExport, exportPresetFile, importPresetFile } from './preset-io.ts'
import { s } from './styles.ts'

/** 一次性操作提示：kind 决定配色，几秒后自动消失。 */
interface Notice {
  kind: 'ok' | 'error'
  text: string
}

export function PresetsTab({ cfg, inv, t, write, writeGlobal }: {
  cfg: Config
  inv: Inventory | null
  t: Translate
  write: (field: 'sections' | 'replace' | 'inject' | 'tools', value: unknown) => void
  /** 预设库专用：永远写在全局字段（presets / activePreset 不分作用域）。 */
  writeGlobal: (field: string, value: unknown) => void
}): ReactElement {
  const presets = cfg.presets ?? []
  const [name, setName] = useState('')
  const [notice, setNotice] = useState<Notice | null>(null)
  // Web 回退用的隐藏文件输入（tauri 不可用时才点它）。
  const fileRef = useRef<HTMLInputElement | null>(null)
  // 消息条自动消失的定时器；新消息会重置旧定时器。
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (noticeTimer.current !== null) clearTimeout(noticeTimer.current)
  }, [])

  // 显示提示；ok 与 error 分别配色，4 秒后自动消失。
  const show = (kind: Notice['kind'], text: string): void => {
    if (noticeTimer.current !== null) clearTimeout(noticeTimer.current)
    setNotice({ kind, text })
    noticeTimer.current = setTimeout(() => setNotice(null), 4000)
  }

  const blockedNames = new Set(cfg.sections ?? [])
  const merged = mergeSections(inv, cfg, blockedNames)
  const currentNames = new Set(merged.map((sec) => sec.name))

  // 把当前定制捕获为新预设（完整快照）。绝对顺序会被转成相对形式
  // （每段记录它应跟随的前一段），因此预设可以跨不同提示词移植。
  const saveCurrent = (): void => {
    const presetName = name.trim() || `${t('preset')} ${presets.length + 1}`
    const data = buildPresetData(cfg, merged)
    writeGlobal('presets', [...presets, { id: genId(), name: presetName, data }])
    setName('')
  }

  // 应用预设。补丁由纯函数助手计算：
  //  - 同名段被覆盖（内容 + 顺序）
  //  - 预设中有、当前提示词中没有的段被添加
  //  - 当前有、但不在预设列表中的段被屏蔽
  //  - 只有预设的「激活段」被解除屏蔽（预设自己的屏蔽名单被保留）
  // 四个定制字段写入当前编辑目标（全局顶层或 overrides[id]）；快照库
  // （presets / activePreset）永远保持在全局。
  const applyPreset = (preset: Preset): void => {
    const patch = applyPresetData(preset.data, cfg, currentNames)
    write('inject', patch.inject)
    write('replace', patch.replace)
    write('sections', patch.sections)
    write('tools', patch.tools)
    writeGlobal('activePreset', preset.id)
  }

  const deletePreset = (id: string): void => {
    const next = removePreset(presets, id, cfg.activePreset)
    writeGlobal('presets', next.presets)
    if (next.activeId === undefined && cfg.activePreset === id) writeGlobal('activePreset', undefined)
  }

  // 导出一个预设：Tauri 桌面走原生保存对话框，Web（或 tauri 插件不可用
  // 时）回退为下载。saved/downloaded = 成功；用户取消单独提示，不算失败。
  const exportPreset = async (preset: Preset): Promise<void> => {
    try {
      const res = await exportPresetFile(preset)
      if (res.ok) show('ok', t('exportOk'))
      else if (res.cancelled) show('ok', t('exportCancel'))
      else show('error', `${t('exportFail')}${res.message ? ': ' + res.message : ''}`)
    } catch (e) {
      show('error', `${t('exportFail')}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  // 解析导入文本 → 去重追加 → 提示新增数量。解析失败提示错误。
  const importParsed = (text: string): void => {
    try {
      const parsed = decodePresetExport(text)
      const next = addImportedPresets(presets, parsed, genId)
      const added = next.length - presets.length
      if (added <= 0) show('ok', t('importNone'))
      else {
        writeGlobal('presets', next)
        show('ok', `${t('importOk')} (+${added})`)
      }
    } catch (e) {
      show('error', `${t('importFail')}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  // 导入预设：优先 Tauri 原生打开对话框；unavailable（Web 或桌面端缺
  // dialog/fs 插件）时点隐藏 file input 回退到文件选择器。取消单独提示。
  const importPreset = async (): Promise<void> => {
    try {
      const res = await importPresetFile()
      if (res.kind === 'text') { importParsed(res.text); return }
      if (res.kind === 'cancelled') { show('ok', t('importCancel')); return }
      fileRef.current?.click()
    } catch (e) {
      show('error', `${t('importFail')}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  // Web 回退路径：文件选择器的 onChange。用户取消（无文件）静默返回。
  const onImportFile = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => importParsed(String(reader.result))
    reader.onerror = () => show('error', t('importFail'))
    reader.readAsText(file)
  }

  return h('div', { style: s.list }, [
    notice ? h('div', { style: notice.kind === 'ok' ? s.noticeOk : s.error }, notice.text) : null,
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
        h('button', { style: s.mini, onClick: () => { void importPreset() } }, t('import')),
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
        h('button', { style: s.mini, onClick: () => { void exportPreset(preset) } }, t('export')),
        h('button', { style: s.mini, onClick: () => deletePreset(preset.id) }, t('delete')),
      ])
    }),
  ])
}

/** 生成预设 id：时间戳 + 随机段（base36），够用且无需额外依赖。 */
function genId(): string {
  return 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

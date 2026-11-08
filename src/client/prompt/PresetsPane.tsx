/**
 * PresetsPane — 独立面板的预设模式（左右双栏）。
 *
 * 两种「预设」分开，各占一栏：
 *  - 左栏（PresetsPane）：配置快照库 —— 保存当前配置 / 导入 / 应用 / 导出 /
 *    删除。快照只改本插件内的 presets 库，不会变成可选的 agent 预设；
 *  - 右栏（SettingsPane）：存为 agent 预设（整体 fork 当前编辑目标的预设目录，
 *    并把当前定制写进它的覆盖项）+ 全局设置（强制覆盖开关、环境变量黑名单、
 *    提示词变量参考、恢复初始状态）。
 *
 * 导入导出经 preset-io 双端适配：Tauri 2 桌面走原生对话框，Web 走下载 /
 * 文件选择；成功 / 失败 / 取消都有面板内消息条提示。
 */
import { createElement as h, useEffect, useRef, useState, type ReactElement, type ChangeEvent } from 'react'
import { PHASE_KEYS, entryKey, type Config, type EntryRef, type Inventory, type PhaseViews, type Preset } from './types.ts'
import type { Translate } from './locales.ts'
import { addImportedPresets, applyPresetData, buildPresetData, genId, mergeSections, removePreset, type ConfigPatch } from './presets.ts'
import { decodePresetExport, exportPresetFile, importPresetFile } from './preset-io.ts'
import { s } from './styles.ts'

/** 一次性操作提示：kind 决定配色，几秒后自动消失。 */
interface Notice {
  kind: 'ok' | 'error'
  text: string
}

/** 4 秒自动消失的面板内消息条（左右两栏共用行为）。 */
function useNotice(): { notice: Notice | null; show: (kind: Notice['kind'], text: string) => void } {
  const [notice, setNotice] = useState<Notice | null>(null)
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {
    if (noticeTimer.current !== null) clearTimeout(noticeTimer.current)
  }, [])
  const show = (kind: Notice['kind'], text: string): void => {
    if (noticeTimer.current !== null) clearTimeout(noticeTimer.current)
    setNotice({ kind, text })
    noticeTimer.current = setTimeout(() => setNotice(null), 4000)
  }
  return { notice, show }
}

export function PresetsPane({ cfg, inv, phases, t, writePatch, writeGlobal, writeGlobalBatch, envBlocklist, applyLevel, applyTargetName }: {
  cfg: Config
  inv: Inventory | null
  /** Panel 并行拉取的三阶段装配。 */
  phases: PhaseViews | null
  t: Translate
  /** 应用预设：完整补丁一次落盘（显式意图，不经草稿）。 */
  writePatch: (patch: ConfigPatch) => Promise<boolean>
  /** 预设库专用：永远写在全局字段（presets / activePreset 不分作用域）。 */
  writeGlobal: (field: string, value: unknown) => Promise<boolean>
  /** 多个全局字段一次写入（导入预设的 envBlocklist + presets 原子化）。 */
  writeGlobalBatch: (fields: Record<string, unknown>) => Promise<boolean>
  /** 全局环境变量黑名单（永远顶层字段，不分作用域）；导出随行、导入并集。 */
  envBlocklist: string[]
  /** 应用目标层级：预设级 / 工作区级（与顶部统一切换一致）。 */
  applyLevel: 'preset' | 'workspace'
  /** 应用目标显示名（预设 id 或工作区 cwd）。 */
  applyTargetName?: string
}): ReactElement {
  const presets = cfg.presets ?? []
  const [name, setName] = useState('')
  const { notice, show } = useNotice()
  // Web 回退用的隐藏文件输入（tauri 不可用时才点它）。
  const fileRef = useRef<HTMLInputElement | null>(null)

  // 清单本身已按当前预设 scope 过滤（不再有跨预设累积池），直接用清单 + 注入
  // 构建快照捕获宇宙；屏蔽名单按 name+source 的条目身份匹配。
  const blockedKeys = new Set((cfg.sections ?? []).map((entry) => entryKey(entry)))
  const merged = mergeSections(inv, cfg, blockedKeys)
  // 应用时的「当前系统条目」= 清单条目 ∪ 三阶段真实基座（过滤掉预设里根本没有的条目）。
  // 传 Map（键 → 条目）以便补丁里写回带 source 的完整身份。
  const currentEntries = new Map<string, EntryRef>()
  for (const section of merged) currentEntries.set(entryKey(section), { name: section.name, ...(section.source === undefined ? {} : { source: section.source }) })
  for (const key of PHASE_KEYS) {
    for (const section of phases?.[key]?.baseSections ?? []) {
      currentEntries.set(entryKey(section), { name: section.name, ...(section.source === undefined ? {} : { source: section.source }) })
    }
  }

  // 把当前定制捕获为新预设（完整快照）。绝对顺序会被转成相对形式
  //（每段记录它应跟随的前一段），因此预设可以跨不同提示词移植。
  const saveCurrent = (): void => {
    const presetName = name.trim() || `${t('preset')} ${presets.length + 1}`
    const data = buildPresetData(cfg, merged)
    void writeGlobal('presets', [...presets, { id: genId(), name: presetName, data }])
    setName('')
  }

  // 应用预设。补丁由纯函数助手计算（同名段覆盖、匹配不上的跳过、不在预设
  // 列表中的当前段被屏蔽、只有预设的「激活段」被解除屏蔽）。四个定制字段以
  // 一个补丁写入当前编辑目标；快照库（presets / activePreset）永远保持在全局。
  const applyPreset = async (preset: Preset): Promise<void> => {
    const applied = await writePatch(applyPresetData(preset.data, cfg, currentEntries))
    if (!applied) return
    // 工作区级应用不改「活动预设」这个库概念；仅预设级应用时标记。
    if (applyLevel !== 'workspace') await writeGlobal('activePreset', preset.id)
  }

  const deletePreset = async (id: string): Promise<void> => {
    const next = removePreset(presets, id, cfg.activePreset)
    const deleted = await writeGlobal('presets', next.presets)
    if (deleted && next.activeId === undefined && cfg.activePreset === id) await writeGlobal('activePreset', undefined)
  }

  // 导出一个预设：Tauri 桌面走原生保存对话框，Web（或 tauri 插件不可用
  // 时）回退为下载。saved/downloaded = 成功；用户取消单独提示，不算失败。
  const exportPreset = async (preset: Preset): Promise<void> => {
    try {
      const res = await exportPresetFile(preset, undefined, envBlocklist)
      if (res.ok) show('ok', t('exportOk'))
      else if (res.cancelled) show('ok', t('exportCancel'))
      else show('error', `${t('exportFail')}${res.message ? ': ' + res.message : ''}`)
    } catch (e) {
      show('error', `${t('exportFail')}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  // 解析导入文本 → 去重追加 → 提示新增数量。解析失败提示错误。
  // 单对象格式的文件还可能随行携带全局环境变量黑名单：与当前名单并集合并。
  const importParsed = async (text: string): Promise<void> => {
    try {
      const parsed = decodePresetExport(text)
      const next = addImportedPresets(presets, parsed, genId)
      const added = next.length - presets.length
      const fileBlock = parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
        && Array.isArray((parsed as { envBlocklist?: unknown }).envBlocklist)
        ? ((parsed as { envBlocklist?: unknown[] }).envBlocklist ?? []).filter((e): e is string => typeof e === 'string')
        : []
      const fresh = fileBlock.filter((e) => !envBlocklist.includes(e))
      const mergedNote = fresh.length > 0 ? t('importBlockMerge', { count: fresh.length }) : ''
      if (added <= 0) show('ok', t('importNone') + mergedNote)
      const fields: Record<string, unknown> = {}
      if (fresh.length > 0) fields.envBlocklist = [...envBlocklist, ...fresh]
      if (added > 0) fields.presets = next
      if (Object.keys(fields).length > 0) {
        const written = await writeGlobalBatch(fields)
        if (!written) return
      }
      if (added > 0) show('ok', `${t('importOk')} (+${added})${mergedNote}`)
    } catch (e) {
      show('error', `${t('importFail')}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  // 导入预设：优先 Tauri 原生打开对话框；unavailable（Web 或桌面端缺
  // dialog/fs 插件）时点隐藏 file input 回退到文件选择器。取消单独提示。
  const importPreset = async (): Promise<void> => {
    try {
      const res = await importPresetFile()
      if (res.kind === 'text') { void importParsed(res.text); return }
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
    reader.onload = () => { void importParsed(String(reader.result)) }
    reader.onerror = () => show('error', t('importFail'))
    reader.readAsText(file)
  }

  return h('div', { style: s.colLeft }, [
    h('div', { style: s.colScroll }, [
      notice ? h('div', { style: notice.kind === 'ok' ? s.noticeOk : s.error }, notice.text) : null,
      h('div', { style: s.groupHead }, t('libraryTitle')),
      h('div', { style: s.muted }, t(applyLevel === 'workspace' ? 'applyToWorkspace' : 'applyToPreset', { name: applyTargetName ?? '' })),
      h('div', { style: s.injectBox }, [
        h('div', { style: s.injectRow }, [
          h('input', { style: { ...s.input, flex: 1 }, placeholder: t('presetName'), value: name, onChange: (e: ChangeEvent<HTMLInputElement>) => setName(e.target.value) }),
          h('button', { style: s.mini, onClick: saveCurrent }, t('save')),
        ]),
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
    ]),
  ])
}

export function SettingsPane({ cfg, inv, t, writeGlobal, onReset, envBlocklist, target, onExportPreset, onImportPreset, onCleanupEmpty, onBackupAll, onRestoreAll, backingUp, restoring, cleaning }: {
  cfg: Config
  inv: Inventory | null
  t: Translate
  /** 全局字段专用写通道（forceSections / envBlocklist，不经草稿）。 */
  writeGlobal: (field: string, value: unknown) => void
  /** 恢复初始状态：清空全部定制并关闭 forceSections（与不装插件等效）。 */
  onReset: () => void
  envBlocklist: string[]
  /** 全量备份（整库：全部提示词 + 工具 + 工作区 + 账本）。 */
  onBackupAll: () => void
  /** 恢复备份（传入备份 JSON 文本）。 */
  onRestoreAll: (text: string) => void
  /** 当前编辑目标；缺省 = 不显示单预设导入导出。 */
  target?: string
  onExportPreset: () => void
  onImportPreset: (text: string) => void
  onCleanupEmpty: () => void
  backingUp: boolean
  restoring: boolean
  cleaning: boolean
}): ReactElement {
  // 黑名单「添加」输入框的暂存值。
  const [blockInput, setBlockInput] = useState('')
  const backupFileRef = useRef<HTMLInputElement | null>(null)
  const presetFileRef = useRef<HTMLInputElement | null>(null)

  // 环境变量黑名单：全局字段，改动即写（与 forceSections 同一通道，不经草稿）。
  const removeBlockEntry = (entry: string): void => {
    writeGlobal('envBlocklist', envBlocklist.filter((e) => e !== entry))
  }
  const addBlockEntry = (): void => {
    const entry = blockInput.trim()
    setBlockInput('')
    if (entry === '' || envBlocklist.includes(entry)) return
    writeGlobal('envBlocklist', [...envBlocklist, entry])
  }

  return h('div', { style: s.colRight }, [
    h('div', { style: { ...s.colRightScroll, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12, alignContent: 'start' } }, [
      target === undefined ? null : h('div', { style: s.injectBox }, [
        h('div', { style: s.rowTitle }, t('presetIoTitle')),
        h('div', { style: s.muted }, t('presetIoHint')),
        h('div', { style: s.injectRow }, [
          h('button', { style: s.mini, onClick: onExportPreset }, t('presetExport')),
          h('button', { style: s.mini, onClick: () => presetFileRef.current?.click() }, t('presetImport')),
          h('button', { style: s.mini, disabled: cleaning, onClick: onCleanupEmpty }, cleaning ? t('cleanupRunning') : t('cleanupEmpty')),
          h('input', {
            ref: presetFileRef,
            type: 'file',
            accept: '.json,application/json',
            style: { display: 'none' },
            onChange: (e: ChangeEvent<HTMLInputElement>) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (!file) return
              const reader = new FileReader()
              reader.onload = () => onImportPreset(String(reader.result))
              reader.readAsText(file)
            },
          }),
        ]),
      ]),
      h('div', { style: s.injectBox }, [
        h('div', { style: s.rowTitle }, t('backupTitle')),
        h('div', { style: s.muted }, t('backupHint')),
        h('div', { style: s.injectRow }, [
          h('button', { style: s.mini, disabled: backingUp, onClick: onBackupAll }, backingUp ? t('backupExportRunning') : t('backupExport')),
          h('button', { style: s.mini, disabled: restoring, onClick: () => backupFileRef.current?.click() }, restoring ? t('backupRestoreRunning') : t('backupRestore')),
          h('input', {
            ref: backupFileRef,
            type: 'file',
            accept: '.json,application/json',
            style: { display: 'none' },
            onChange: (e: ChangeEvent<HTMLInputElement>) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (!file) return
              const reader = new FileReader()
              reader.onload = () => onRestoreAll(String(reader.result))
              reader.readAsText(file)
            },
          }),
        ]),
      ]),
      h('div', { style: s.injectBox }, [
        h('div', { style: s.rowTitle }, t('forceTitle')),
        h('div', { style: s.muted }, t('forceHint')),
        h('div', { style: s.injectRow }, [
          h('label', { style: s.switchWrap }, [
            h('input', {
              type: 'checkbox',
              checked: cfg.forceSections !== false,
              // forceSections 是全局字段，与 presets/activePreset 一样永远写顶层。
              onChange: (e: ChangeEvent<HTMLInputElement>) => writeGlobal('forceSections', e.target.checked),
            }),
            h('span', { style: cfg.forceSections !== false ? s.badgeOk : s.badgeBlocked },
              cfg.forceSections !== false ? t('forceOn') : t('forceOff')),
          ]),
        ]),
      ]),
      h('div', { style: s.injectBox }, [
        h('div', { style: s.rowTitle }, t('envBlockTitle')),
        h('div', { style: s.muted }, t('envBlockHint')),
        h('div', { style: { ...s.toolWrap, marginTop: 6 } }, envBlocklist.map((entry) => h('span', {
          key: entry,
          style: { ...s.toolChip, display: 'inline-flex', alignItems: 'center', gap: 4 },
        }, [
          entry,
          h('span', { style: { cursor: 'pointer' }, title: t('delete'), onClick: () => removeBlockEntry(entry) }, '×'),
        ]))),
        envBlocklist.length === 0 ? h('div', { style: s.muted }, t('envBlockEmpty')) : null,
        h('div', { style: { ...s.injectRow, marginTop: 6 } }, [
          h('input', {
            style: { ...s.input, flex: 1 },
            placeholder: t('envBlockAdd'),
            value: blockInput,
            onChange: (e: ChangeEvent<HTMLInputElement>) => setBlockInput(e.target.value),
          }),
          h('button', { style: s.mini, disabled: blockInput.trim() === '', onClick: addBlockEntry }, t('envBlockAddAction')),
        ]),
        h('details', { style: { marginTop: 6 } }, [
          h('summary', { style: { ...s.muted, cursor: 'pointer' } }, `${t('envVarsTitle')} (${inv?.variables?.length ?? 0})`),
          h('div', { style: { ...s.muted, marginTop: 4 } }, t('envVarsHint')),
          h('div', { style: { ...s.toolWrap, marginTop: 4 } }, (inv?.variables ?? []).map((varName) => h('span', { key: varName, style: s.toolChip }, `{{${varName}}}`))),
        ]),
      ]),
      h('div', { style: s.injectBox }, [
        h('div', { style: s.rowTitle }, t('resetTitle')),
        h('div', { style: s.muted }, t('resetHint')),
        h('div', { style: s.injectRow }, [
          h('button', { style: s.mini, onClick: () => {
            // 二次确认：清空不可撤销，必须明确点头才动手。
            if (window.confirm(t('resetConfirm'))) onReset()
          } }, t('resetAction')),
        ]),
      ]),
    ]),
  ])
}

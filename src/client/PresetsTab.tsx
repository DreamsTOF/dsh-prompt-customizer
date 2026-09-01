/** 配置 Tab：两种「预设」分开 ——
 *  - 保存当前配置：本插件内的配置快照库（config.presets），可应用 / 导出 / 导入，
 *    不会变成可选的 agent 预设；
 *  - 存为 agent 预设：整体 fork 当前编辑目标的预设目录，并把当前定制写进它的
 *    覆盖项，新预设随即出现在顶部的编辑目标选择器里。
 *  导入导出经 preset-io 双端适配：Tauri 2 桌面走原生对话框，Web 走
 *  下载 / 文件选择；成功 / 失败 / 取消都有面板内消息条提示。 */
import { createElement as h, useEffect, useRef, useState, type ReactElement, type ChangeEvent } from 'react'
import type { Config, Inventory, PhaseViewKey, Preview, Preset } from './types.ts'
import type { Translate } from './locales.ts'
import { addImportedPresets, applyPresetData, buildPresetData, genId, mergeSections, PART_ORDER, removePreset, type ConfigPatch } from './presets.ts'
import { decodePresetExport, exportPresetFile, importPresetFile } from './preset-io.ts'
import { s } from './styles.ts'

/** 一次性操作提示：kind 决定配色，几秒后自动消失。 */
interface Notice {
  kind: 'ok' | 'error'
  text: string
}

export function PresetsTab({ cfg, inv, phases, t, writePatch, writeGlobal, saveAsPreset, forkSource, onReset, envBlocklist }: {
  cfg: Config
  inv: Inventory | null
  /** Panel 并行拉取的三阶段装配：快照只捕获当前装配里真实存在的段。 */
  phases: Record<PhaseViewKey, Preview | null> | null
  t: Translate
  /** 应用预设：完整补丁一次落盘（显式意图，不经草稿）。 */
  writePatch: (patch: ConfigPatch) => void
  /** 预设库专用：永远写在全局字段（presets / activePreset 不分作用域）。 */
  writeGlobal: (field: string, value: unknown) => void
  /** 存为 agent 预设：fork 当前编辑目标的预设目录并写入 overrides[新名]。 */
  saveAsPreset: (name: string) => Promise<boolean>
  /** fork 来源的显示名（当前编辑目标预设）；undefined = 全局目标，由服务端回落默认预设。 */
  forkSource: string | undefined
  /** 恢复初始状态：清空全部定制并关闭 forceSections（与不装插件等效）。 */
  onReset: () => void
  /** 全局环境变量黑名单（永远顶层字段，不分作用域）；导出随行、导入并集。 */
  envBlocklist: string[]
}): ReactElement {
  const presets = cfg.presets ?? []
  const [name, setName] = useState('')
  // 黑名单「添加」输入框的暂存值。
  const [blockInput, setBlockInput] = useState('')
  // 「存为 agent 预设」的名字与在途标记（与服务端往返期间禁用按钮）。
  const [agentName, setAgentName] = useState('')
  const [creating, setCreating] = useState(false)
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
  // 快照的捕获宇宙 = 当前预设三个阶段装配里真实存在的段名。「本系统全部提示词」
  // 是跨预设只增不减的并集池，直接拿它当捕获集合会把别的预设独有段名灌进快照，
  // 应用回来就是一条条空白幽灵段。装配数据未就绪（宇宙为空）时不过滤，避免捕获成空。
  const assemblyNames = new Set<string>()
  for (const key of PART_ORDER) {
    for (const sec of phases?.[key]?.baseSections ?? []) assemblyNames.add(sec.name)
  }
  const mergedAll = mergeSections(inv, cfg, blockedNames)
  const merged = assemblyNames.size === 0
    ? mergedAll
    : mergedAll.filter((sec) => sec.source === 'custom' || assemblyNames.has(sec.name))
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
  //  - 预设中有、当前系统里匹配不上的段默认跳过（跨系统导入不凭空建段）
  //  - 当前有、但不在预设列表中的段被屏蔽
  //  - 只有预设的「激活段」被解除屏蔽（预设自己的屏蔽名单被保留）
  // 四个定制字段以一个补丁写入当前编辑目标（全局顶层或 overrides[id]）；
  // 快照库（presets / activePreset）永远保持在全局。
  const applyPreset = (preset: Preset): void => {
    writePatch(applyPresetData(preset.data, cfg, currentNames))
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
      const res = await exportPresetFile(preset, undefined, envBlocklist)
      if (res.ok) show('ok', t('exportOk'))
      else if (res.cancelled) show('ok', t('exportCancel'))
      else show('error', `${t('exportFail')}${res.message ? ': ' + res.message : ''}`)
    } catch (e) {
      show('error', `${t('exportFail')}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  // 解析导入文本 → 去重追加 → 提示新增数量。解析失败提示错误。
  // 单对象格式的文件还可能随行携带全局环境变量黑名单：与当前名单并集合并
  // （只增不减），新增条数一并报进提示。
  const importParsed = (text: string): void => {
    try {
      const parsed = decodePresetExport(text)
      const next = addImportedPresets(presets, parsed, genId)
      const added = next.length - presets.length
      const fileBlock = parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
        && Array.isArray((parsed as { envBlocklist?: unknown }).envBlocklist)
        ? ((parsed as { envBlocklist?: unknown[] }).envBlocklist ?? []).filter((e): e is string => typeof e === 'string')
        : []
      const fresh = fileBlock.filter((e) => !envBlocklist.includes(e))
      if (fresh.length > 0) writeGlobal('envBlocklist', [...envBlocklist, ...fresh])
      const mergedNote = fresh.length > 0 ? t('importBlockMerge', { count: fresh.length }) : ''
      if (added <= 0) show('ok', t('importNone') + mergedNote)
      else {
        writeGlobal('presets', next)
        show('ok', `${t('importOk')} (+${added})${mergedNote}`)
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

  // 存为 agent 预设：fork 当前编辑目标的预设目录 + 把当前定制写进它的覆盖项。
  // 成败由服务端返回，提示统一走面板顶部的消息条（Panel 的 flash），这里只在
  // 成功时清空输入框，避免同一条消息显示两遍。
  const createAgentPreset = async (): Promise<void> => {
    const trimmed = agentName.trim()
    if (trimmed.length === 0 || creating) return
    setCreating(true)
    if (await saveAsPreset(trimmed)) setAgentName('')
    setCreating(false)
  }

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
      h('div', { style: s.rowTitle }, t('saveAsPresetCard')),
      h('div', { style: s.muted }, t('saveAsPresetHint', { name: forkSource ?? t('forkSourceDefault') })),
      h('div', { style: s.injectRow }, [
        h('input', { style: { ...s.input, flex: 1 }, placeholder: t('agentPresetName'), value: agentName, onChange: (e: ChangeEvent<HTMLInputElement>) => setAgentName(e.target.value) }),
        h('button', { style: s.mini, disabled: creating || agentName.trim().length === 0, onClick: () => { void createAgentPreset() } }, t('saveAsPreset')),
      ]),
    ]),
    h('div', { style: s.injectBox }, [
      h('div', { style: s.rowTitle }, t('importPreset')),
      h('div', { style: s.injectRow }, [
        h('button', { style: s.mini, onClick: () => { void importPreset() } }, t('import')),
        h('input', { ref: fileRef, type: 'file', accept: '.json,application/json', style: { display: 'none' }, onChange: onImportFile }),
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
        h('div', { style: { ...s.toolWrap, marginTop: 4 } }, (inv?.variables ?? []).map((name) => h('span', { key: name, style: s.toolChip }, `{{${name}}}`))),
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

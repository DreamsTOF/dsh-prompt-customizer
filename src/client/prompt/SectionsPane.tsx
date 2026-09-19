/**
 * SectionsPane — 独立面板的左栏（提示词模式）。
 *
 * 顶部三个阶段 Tab（引导期 / 常驻期 / 压缩受控期，恒定全部可选），与右栏
 * 预览的阶段按钮**联动**：两边切的是同一个阶段，编辑哪个阶段就看哪个阶段的
 * 装配。每个阶段列出该阶段装配里的段：勾选框 = 该阶段是否注入模型（勾上 =
 * 启用），被停用的行半透明原位保留、随时可勾回。行内：抓手拖动排序 / ↑↓ 重排、
 * 编辑（按阶段替换文本）、还原、删除（仅自定义段）；「+ 注入」展开注入新段表单。
 *
 * 底部固定条：三态过滤（全部 / 已启用 / 已停用）——像宿主能力管理页一样按
 * 勾选状态筛选当前阶段的列表。
 *
 * 拖拽（见 dnd.ts）：行抓手上下拖 = 在本阶段排序；把行拖回末尾的「本系统全部
 * 提示词」池 = 从本阶段移除；把池里的段拖进列表 = 加入本阶段（带池里原文）；
 * 把行拖到头部某个阶段 Tab = 复制到那个阶段。点按路径照旧：池里每行三个小按钮
 * 也能加入对应阶段（运行时动态段加不进，会给出说明）。
 *
 * 全部阶段状态逻辑来自 lib/sectionOps.mjs（纯函数，node --test 单测直接
 * 覆盖同一份代码）。
 */
import { createElement as h, useEffect, useRef, useState, type ChangeEvent, type DragEvent as ReactDragEvent, type ReactElement } from 'react'
import type { Config, Inventory, Phase, PhaseViewKey, Preview } from './types.ts'
import type { Translate } from './locales.ts'
import { PART_ORDER } from './presets.ts'
import { injectPhaseOf, deniedNames, blockPatch, phaseInjectEntries, mergedPhaseInjectEntries, phaseRows, reorderInsert, injectedAt } from '../../../vendor/prompt-customizer/sectionOps.mjs'
import { acceptsDrop, beginDrag, dropOnPhase, finishDrag, payloadOf, setPhaseDropHandler, type DragPayload } from './dnd.ts'
import { useDragAutoScroll } from './drag-scroll.ts'
import { s } from './styles.ts'

/** Panel 并行拉取的三阶段装配。 */
type PhaseViews = Record<PhaseViewKey, Preview | null>

/** 屏幕上一条可交互的段行。 */
interface PartRow {
  name: string
  text: string
  replaced: boolean
  custom: boolean
  /** 本阶段的用户替换文本（空串 = 本阶段没改过文本）—— 三个阶段各一份，互不影响。 */
  override: string
  /** 该阶段自己的屏蔽名单是否屏蔽了此段：勾选框 = 未屏蔽（注入模型）。 */
  blocked: boolean
}

/** 三态过滤：全部 / 已启用（未屏蔽）/ 已停用（被屏蔽）。 */
export type TriState = 'all' | 'on' | 'off'

/** 编辑态的键：段名之外还要带阶段，否则三个部分里同名的行会同时展开编辑器。 */
const editKey = (key: PhaseViewKey, name: string): string => `${key}:${name}`

export function SectionsPane({ cfg, inv, phases, phase, syncAll, t, poolText, write }: {
  cfg: Config
  inv: Inventory | null
  phases: PhaseViews | null
  /** 当前阶段（状态在 Panel 持有，头部阶段按钮统一切换）。 */
  phase: PhaseViewKey
  /** 三态同步（默认关）：勾选后屏蔽 / 解除屏蔽与替换文本对三个阶段一起生效（只作用于同名段）。 */
  syncAll?: boolean
  t: Translate
  /** 从池加入时的文本取值（缺省用池原文；Panel 在「中文提示词」开启时换成译本）。 */
  poolText?: (name: string, fallback: string) => string
  write: (field: 'sections' | 'sectionsBootstrap' | 'sectionsCompaction' | 'replace' | 'inject' | 'tools', value: unknown) => void
}): ReactElement {
  const [filter, setFilter] = useState<TriState>('all')
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  // 「注入新段」表单展开态（当前阶段分组内）。
  const [addOpen, setAddOpen] = useState(false)
  // 面板内短提示（例如：动态段加不进某个阶段时说明原因）。
  const [notice, setNotice] = useState<string | null>(null)
  // 拖拽：正在拖的行名，投放位置标记（`<行名>:above|below` / `list` / `pool`）。
  const [dragName, setDragName] = useState<string | null>(null)
  const [dropMark, setDropMark] = useState<string | null>(null)
  // 列表滚动容器：拖到上下边缘时自动滚（长列表里手拖够不到视口外的位置）。
  const scrollRef = useRef<HTMLDivElement | null>(null)
  useDragAutoScroll(scrollRef)

  const rowsOf = (key: PhaseViewKey): PartRow[] => phaseRows(cfg, phases?.[key] ?? null, key)

  // 屏蔽 / 恢复一个段（blockPatch 只动本阶段自己的名单）。写入严格落在当前
  // 编辑目标的草稿里 —— 预设之间互相独立：在 A 预设里的任何改动对 B 预设与
  // 全局默认零影响。
  const applyBlock = (key: PhaseViewKey, name: string, blocked: boolean): void => {
    const patch = blockPatch(cfg, key, name, blocked)
    for (const [field, value] of Object.entries(patch)) {
      write(field as 'sections' | 'sectionsBootstrap' | 'sectionsCompaction', value)
    }
  }
  const toggleBlocked = (key: PhaseViewKey, name: string): void => {
    const blocked = !deniedNames(cfg, key).includes(name)
    // 三态同步（可选）：一次写全三个阶段 —— 只作用于同名的这一段。
    for (const k of syncAll ? PART_ORDER : [key]) applyBlock(k, name, blocked)
  }

  // 该阶段中某名字是否在该阶段的装配输入里（判断加入是「解除屏蔽」还是「凭空注入」）。
  const inBaseOf = (key: PhaseViewKey, name: string): boolean =>
    (phases?.[key]?.baseSections ?? []).some((sec) => sec.name === name)

  // 持久化一个阶段的有序列表（写回 inject）：每行一条注入项、order 为连续整数；
  // 系统行空文本（仅 order 覆盖），custom 行保留文本；其它阶段的注入项原样保留。
  const persistPhase = (key: PhaseViewKey, rows: PartRow[]): void => {
    write('inject', phaseInjectEntries(cfg, key, rows))
  }

  // 上移/下移一格（数组交换后重排整个阶段）。
  const moveRow = (key: PhaseViewKey, index: number, dir: -1 | 1): void => {
    const rows = rowsOf(key)
    const target = index + dir
    if (target < 0 || target >= rows.length) return
    const next = rows.slice()
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    persistPhase(key, next)
  }

  // 从该阶段移除一个段：删掉它在本阶段的注入条目，以及跨阶段生效（always）的
  // 条目 —— 预设应用 / 导入产生的自定义段就是 always。随后解除该阶段屏蔽。
  const removeFromPart = (key: PhaseViewKey, name: string): void => {
    const phaseOfItem = injectPhaseOf(key)
    const inject = (cfg.inject ?? []).filter((x) => {
      if (x.name !== name) return true
      const itemPhase = x.phase ?? 'always'
      return !(itemPhase === phaseOfItem || itemPhase === 'always')
    })
    write('inject', inject)
    applyBlock(key, name, false)
  }

  // 文本编辑按阶段生效：编辑态的键是「阶段 + 段名」。写入走 persistPhase
  //（本阶段的注入条目带 text），绝不碰全局 replace 字典。
  const startReplace = (key: PhaseViewKey, row: PartRow): void => {
    setEditing(editKey(key, row.name))
    setDraft(row.override || row.text)
  }
  const commitReplace = (key: PhaseViewKey, row: PartRow): void => {
    const patchRow = (r: PartRow): PartRow => (r.name !== row.name ? r : { ...r, override: draft, text: draft })
    if (syncAll) {
      // 三态同步（可选）：替换文本一次写全三个阶段 —— 只改各阶段里同名的那
      // 一行。edit 对 inject 是整体替换，必须把三个阶段叠进同一份列表一次写入。
      const rowsByKey = {} as Record<PhaseViewKey, PartRow[]>
      for (const k of PART_ORDER) {
        const rows = rowsOf(k)
        rowsByKey[k] = k === key || rows.some((r) => r.name === row.name) ? rows.map(patchRow) : rows
      }
      write('inject', mergedPhaseInjectEntries(cfg, rowsByKey))
    } else {
      persistPhase(key, rowsOf(key).map(patchRow))
    }
    setEditing(null)
  }
  const restoreReplace = (key: PhaseViewKey, row: PartRow): void => {
    const next = rowsOf(key).map((r) =>
      r.name !== row.name ? r : { ...r, override: '', text: r.custom ? r.text : '' },
    )
    persistPhase(key, next)
    // 遗留的全局替换条目（旧版 UI 的产物）：只在本部分还原时一并清除。
    if (!row.custom && Object.hasOwn(cfg.replace ?? {}, row.name)) {
      const rest = { ...(cfg.replace ?? {}) }
      delete rest[row.name]
      write('replace', rest)
    }
  }

  const addSection = (name: string, text: string, phase: Phase): void => {
    const inject = (cfg.inject ?? []).slice()
    inject.push({ name, order: 120 + inject.length, text, phase, custom: true })
    write('inject', inject)
  }

  // 从「全部」池把一个段加入某阶段（拖动或点按池里的小按钮）。该阶段已有的
  // 段只是移到末尾；新段带上池里的原文（注入条目带文本，服务端才会把它真正
  // 建出来）。动态段没有可带的原文，给出说明。`copiedFrom` 非空 = 从别的阶段
  // 复制过来的，给一条「已复制」反馈。
  const addFromPool = (key: PhaseViewKey, name: string, text: string, copiedFrom?: string): void => {
    if (text === '' || text.startsWith('<')) {
      setNotice(t('sectionDynamicNoAdd', { name }))
      return
    }
    // 「中文提示词」开启时，池里的段优先用译本文本 —— 一键把没进过定制面板的
    // 段（如 agent 作用域注册的 tool:subagent）接管成中文。
    const body = poolText === undefined ? text : poolText(name, text)
    setNotice(null)
    const rows = rowsOf(key)
    const existing = rows.find((row) => row.name === name)
    const next = existing !== undefined
      ? [...rows.filter((row) => row.name !== name), existing]
      : [...rows, {
          name,
          text: '',
          replaced: Object.hasOwn(cfg.replace ?? {}, name),
          custom: false,
          override: body,
          blocked: false,
        }]
    if (existing === undefined && inBaseOf(key, name) && deniedNames(cfg, key).includes(name)) {
      applyBlock(key, name, false)
    }
    persistPhase(key, next)
    if (copiedFrom !== undefined) setNotice(t('sectionCopied', { name, to: stageLabel(key), from: copiedFrom }))
  }

  // ── 拖拽落地（手势定义见 dnd.ts）────────────────────────────────────
  /** 从本阶段拿掉一段：注入进来的撤销注入，原生段则屏蔽掉（等价于取消勾选）。 */
  const removeFromPhase = (name: string): void => {
    const row = rowsOf(phase).find((item) => item.name === name)
    if (row === undefined) return
    if (row.custom || row.override !== '' || injectedNames.has(name)) removeFromPart(phase, name)
    else applyBlock(phase, name, true)
    setNotice(t('sectionRemoved', { name, from: stageLabel(phase) }))
  }

  /** 行上投放：同阶段 = 排序；别的阶段 / 池里来的 = 复制进本阶段（源不动）。 */
  const dropOnRow = (event: ReactDragEvent, target: PartRow): void => {
    const payload = payloadOf(event)
    if (payload === null || payload.kind !== 'section') return
    event.preventDefault()
    event.stopPropagation()
    setDropMark(null)
    if (payload.name === target.name) return
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const pos = event.clientY < rect.top + rect.height / 2 ? 'above' : 'below'
    if (payload.from === phase) {
      const next = reorderInsert(rowsOf(phase), payload.name, target.name, pos)
      if (next !== null) { persistPhase(phase, next); setNotice(null) }
      return
    }
    addFromPool(phase, payload.name, payload.text ?? '', payload.from === 'pool' ? undefined : stageLabel(payload.from))
  }

  /** 列表空白处投放：追加到本阶段末尾；池里拖来的 = 加入本阶段。 */
  const dropOnList = (event: ReactDragEvent): void => {
    const payload = payloadOf(event)
    if (payload === null || payload.kind !== 'section') return
    event.preventDefault()
    setDropMark(null)
    if (payload.from !== phase) {
      addFromPool(phase, payload.name, payload.text ?? '', payload.from === 'pool' ? undefined : stageLabel(payload.from))
      return
    }
    const list = rowsOf(phase)
    const last = list[list.length - 1]
    if (last === undefined || last.name === payload.name) return
    const next = reorderInsert(list, payload.name, last.name, 'below')
    if (next !== null) persistPhase(phase, next)
  }

  /** 池上投放：把行从本阶段拿掉（拖回「全部」的手势）。 */
  const dropOnPool = (event: ReactDragEvent): void => {
    const payload = payloadOf(event)
    if (payload === null || payload.kind !== 'section') return
    event.preventDefault()
    event.stopPropagation()
    setDropMark(null)
    if (payload.from !== phase) return
    removeFromPhase(payload.name)
  }

  // 头部阶段 Tab 上的投放：复制到那个阶段（换 Tab / 换模式时旧列表卸载、
  // 新列表注册 —— 任何时刻只有一个处理者）。
  useEffect(() => {
    setPhaseDropHandler((key, payload) => {
      if (payload.kind !== 'section' || key === phase) return
      addFromPool(key, payload.name, payload.text ?? '', stageLabel(phase))
    })
    return () => setPhaseDropHandler(null)
  })

  const stageLabel = (key: PhaseViewKey): string =>
    key === 'bootstrap' ? t('phaseStageGuide') : key === 'compaction' ? t('phaseStageControlled') : t('phaseStageResident')

  // 该阶段的「段级定制没进最终提示词」警示（forceSections 关闭或失效时）。
  const partNote = (key: PhaseViewKey): ReactElement | null => {
    const view = phases?.[key]
    if (view === undefined || view === null) return null
    if (cfg.forceSections !== false) return null
    if (view.takenOverBy !== undefined) {
      return h('div', { style: s.noticeWarn }, t('sectionsTakenOver', { name: view.takenOverBy }))
    }
    const lost = view.lostSections
    if (lost !== undefined) {
      return h('div', { style: s.noticeWarn }, t('sectionsLost', { emitted: lost.emitted, survived: lost.survived }))
    }
    return null
  }

  const isEditing = (key: PhaseViewKey, row: PartRow): boolean => editing === editKey(key, row.name)

  const renderRow = (key: PhaseViewKey, row: PartRow, index: number, total: number): ReactElement | null => {
    if (!rowVisible(row)) return null
    const mark = dropMark !== null && dropMark.startsWith(`${row.name}:`) ? dropMark.slice(row.name.length + 1) : null
    return h('div', {
      key: row.name,
      style: {
        ...s.row,
        ...(row.blocked ? s.rowBlocked : {}),
        ...(mark === 'above' ? s.dropAbove : {}),
        ...(mark === 'below' ? s.dropBelow : {}),
        ...(dragName === row.name ? s.dragging : {}),
      },
      onDragOver: (event: ReactDragEvent) => {
        if (!acceptsDrop(event, 'section')) return
        event.preventDefault()
        event.stopPropagation()
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
        setDropMark(`${row.name}:${event.clientY < rect.top + rect.height / 2 ? 'above' : 'below'}`)
      },
      onDrop: (event: ReactDragEvent) => dropOnRow(event, row),
    }, [
      // 拖拽抓手：整行 draggable 会把勾选框 / 文本域的选择手势一起吃掉。
      h('span', {
        draggable: true,
        title: t('drag'),
        style: s.dragHandle,
        onDragStart: (event: ReactDragEvent) => {
          setDragName(row.name)
          beginDrag(event, { kind: 'section', name: row.name, from: key, text: row.override || row.text })
        },
        onDragEnd: () => { setDragName(null); setDropMark(null); finishDrag() },
      }, '⠿'),
      h('input', {
        type: 'checkbox',
        checked: !row.blocked,
        onChange: () => toggleBlocked(key, row.name),
        title: row.blocked ? t('blockedOn') : t('blockedOff'),
        style: { margin: 0, cursor: 'pointer', flex: 'none' },
      }),
      h('div', { style: s.rowBody }, [
        h('div', { style: s.rowTitle }, [
          h('span', { style: s.code }, row.name),
          h('span', { style: s.orderTag }, '#' + index),
          h('span', { style: row.custom ? s.badgeCustom : s.badgeSystem }, row.custom ? t('manual') : t('system')),
          row.replaced ? h('span', { style: s.badgeReplaced }, t('replaced')) : null,
          row.blocked ? h('span', { style: s.badgeBlocked }, t('blockedOn')) : null,
        ]),
        isEditing(key, row)
          ? h('div', { style: s.editBox }, [
              h('textarea', { style: s.editInput, value: draft, onChange: (e: ChangeEvent<HTMLTextAreaElement>) => setDraft(e.target.value), rows: 3 }),
              h('div', { style: s.injectRow }, [
                h('button', { style: s.mini, onClick: () => commitReplace(key, row) }, t('save')),
                h('button', { style: s.mini, onClick: () => setDraft('') }, t('clearInput')),
                !row.custom && (row.override || Object.hasOwn(cfg.replace ?? {}, row.name))
                  ? h('button', { style: s.mini, onClick: () => restoreReplace(key, row) }, t('restore'))
                  : null,
              ]),
            ])
          : h('div', { style: s.preview }, String(row.override || row.text || '').slice(0, 140) || (row.custom ? t('empty') : t('dynamic'))),
      ]),
      h('div', { style: s.arrowCol }, [
        h('button', { style: s.arrow, disabled: index === 0, onClick: () => moveRow(key, index, -1), title: t('moveUp') }, '↑'),
        h('button', { style: s.arrow, disabled: index === total - 1, onClick: () => moveRow(key, index, 1), title: t('moveDown') }, '↓'),
      ]),
      isEditing(key, row) ? null : h('button', { style: s.mini, onClick: () => startReplace(key, row) }, t('replace')),
      !isEditing(key, row) && !row.custom && (row.override || Object.hasOwn(cfg.replace ?? {}, row.name))
        ? h('button', { style: s.mini, onClick: () => restoreReplace(key, row) }, t('restore'))
        : null,
      row.custom ? h('button', { style: s.mini, onClick: () => removeFromPart(key, row.name), title: t('delete') }, t('delete')) : null,
    ])
  }

  // 当前阶段的行 + 三态过滤。
  const rows = rowsOf(phase)
  /** 本阶段有注入条目（= 被显式加进来过）的段名：拖回池时用来自动选「撤销注入」还是「屏蔽」。 */
  const injectedNames = injectedAt(cfg, phase).names
  const onCount = rows.filter((row) => !row.blocked).length
  const offCount = rows.length - onCount
  const rowVisible = (row: PartRow): boolean =>
    filter === 'all' || (filter === 'on' ? !row.blocked : row.blocked)

  const poolSections = inv?.sections ?? []

  return h('div', { style: s.colLeft }, [
    h('div', {
      ref: scrollRef,
      style: { ...s.colScroll, ...(dropMark === 'list' ? s.dropZone : {}) },
      // 列表空白处 = 「本阶段末尾」的投放点（池里拖进来的段也从这里进）。
      onDragOver: (event: ReactDragEvent) => {
        const payload = payloadOf(event)
        if (payload === null || payload.kind !== 'section' || payload.from === phase) return
        event.preventDefault()
        setDropMark('list')
      },
      onDrop: dropOnList,
    }, [
      notice ? h('div', { style: s.noticeWarn }, notice) : null,
      partNote(phase),
      rows.map((row, i) => renderRow(phase, row, i, rows.length)),
      rows.length === 0 ? h('div', { style: s.muted }, t('empty')) : null,
      addOpen
        ? h(InjectForm, {
            onAdd: (name, text) => { addSection(name, text, injectPhaseOf(phase)); setAddOpen(false) },
            phaseLabel: stageLabel(phase),
            t,
          })
        : null,
      // 本系统全部提示词：跨预设累积的只读池（折叠区）。加入某个阶段靠拖拽：
      // 把行拖进上面的阶段列表 = 加入本阶段，拖到头部阶段 Tab = 加入那个阶段
      // （行上不再放三个按钮 —— 拖拽是唯一路径，池同时是「从阶段拿掉」的投放点）。
      h('details', {
        style: { ...s.injectBox, ...(dropMark === 'pool' ? s.dropZoneActive : {}) },
        onDragOver: (event: ReactDragEvent) => {
          if (!acceptsDrop(event, 'section')) return
          event.preventDefault()
          event.stopPropagation()
          setDropMark('pool')
        },
        onDrop: dropOnPool,
      }, [
        h('summary', { style: { ...s.muted, cursor: 'pointer' } },
          `${t('allSectionsTitle')} (${poolSections.length})`),
        h('div', { style: { ...s.muted, marginBottom: 4 } }, t('sectionsFourHint')),
        poolSections.length === 0 ? h('div', { style: s.muted }, t('empty')) : null,
        poolSections.map((sec) => h('div', {
          key: sec.name,
          style: { ...s.row, opacity: 0.92 },
          draggable: true,
          title: t('drag'),
          onDragStart: (event: ReactDragEvent) => beginDrag(event, { kind: 'section', name: sec.name, from: 'pool', text: sec.text ?? '' }),
          onDragEnd: finishDrag,
        }, [
          h('div', { style: s.rowBody }, [
            h('div', { style: s.rowTitle }, h('span', { style: s.code }, sec.name)),
            h('div', { style: s.preview }, String(sec.text ?? '').slice(0, 140) || t('dynamic')),
          ]),
        ])),
      ]),
      // 「+ 注入」入口放在滚动区末尾：新段通常追加在当前阶段列表尾部。
      h('div', { style: { ...s.injectRow, marginTop: 8 } }, [
        h('button', { style: s.mini, onClick: () => setAddOpen(!addOpen), title: t('injectNew') },
          addOpen ? `× ${t('clearInput')}` : `+ ${t('injectNew')}`),
      ]),
    ]),
    // 左栏底部固定条：三态过滤（全部 / 已启用 / 已停用），只统计当前阶段。
    h('div', { style: s.colFoot }, [
      h('div', { style: s.seg }, [
        h('button', { style: filter === 'all' ? s.segBtnActive : s.segBtn, onClick: () => setFilter('all') },
          `${t('filterAll')} ${rows.length}`),
        h('button', { style: filter === 'on' ? s.segBtnActive : s.segBtn, onClick: () => setFilter('on') },
          `${t('filterOn')} ${onCount}`),
        h('button', { style: filter === 'off' ? s.segBtnActive : s.segBtn, onClick: () => setFilter('off') },
          `${t('filterOff')} ${offCount}`),
      ]),
    ]),
  ])
}

/** 注入新段表单：「+ 注入」展开，阶段锁定为当前 Tab 的阶段。 */
function InjectForm({ onAdd, phaseLabel, t }: {
  onAdd: (name: string, text: string) => void
  phaseLabel: string
  t: Translate
}): ReactElement {
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const submit = (): void => {
    if (!name.trim()) return
    onAdd(name.trim(), text)
    setName(''); setText('')
  }
  return h('div', { style: s.injectRow }, [
    h('input', { style: { ...s.input, width: '30%' }, placeholder: t('name'), value: name, onChange: (e: ChangeEvent<HTMLInputElement>) => setName(e.target.value) }),
    h('input', { style: { ...s.input, flex: 1 }, placeholder: `${t('text')}（${phaseLabel}）`, value: text, onChange: (e: ChangeEvent<HTMLInputElement>) => setText(e.target.value) }),
    h('button', { style: s.mini, onClick: submit }, t('add')),
  ])
}

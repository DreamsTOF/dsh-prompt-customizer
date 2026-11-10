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
 * 三态同步（syncAll，默认关）：三个阶段共用同一份「并集行集」—— 常驻期行序为
 * 骨架，其余两态独有的段追加在尾部，同名段以原生那一阶段的行为准；增删 / 排序 /
 * 勾选 / 文本编辑一律经 persistRows 一次写全三个阶段（inject + 三份屏蔽名单），
 * 所以三态列表与文本恒等，不再逐阶段各写一份。
 *
 * 全部阶段状态逻辑来自 phase-ops.ts（纯函数，node --test 单测直接覆盖同一份
 * 代码）；条目身份统一为 name+source。
 */
import { createElement as h, useEffect, useRef, useState, type ChangeEvent, type DragEvent as ReactDragEvent, type ReactElement } from 'react'
import {
  PHASES,
  PHASE_KEYS,
  PHASE_LABEL_KEY,
  entryKey,
  sameEntry,
  type Config,
  type ContextField,
  type EntryRef,
  type Inventory,
  type PhaseKey,
  type PhaseViews,
  type SectionField,
} from './types.ts'
import type { Translate } from './locales.ts'
import {
  blockPatch,
  injectedAt,
  mirrorPhaseInjectEntries,
  mirrorSkippedNames,
  mirroredDeniedLists,
  mirroredRows,
  phaseInjectEntries,
  phaseRows,
  reorderInsert,
  type PhaseRow,
} from './phase-ops.ts'
import { acceptsDrop, beginDrag, dropOnPhase, finishDrag, payloadOf, setPhaseDropHandler, type DragPayload } from './dnd.ts'
import { useDragAutoScroll } from './drag-scroll.ts'
import { s } from './styles.ts'

type PartRow = PhaseRow

/** 三态过滤：全部 / 已启用（未屏蔽）/ 已停用（被屏蔽）。 */
export type TriState = 'all' | 'on' | 'off'

/** 编辑态的键：阶段 + 条目身份，否则同名不同源 / 不同阶段会同时展开编辑器。 */
const editKey = (key: PhaseKey, entry: EntryRef): string => `${key}:${entryKey(entry)}`

export function SectionsPane({ cfg, inv, phases, phase, syncAll, t, write }: {
  cfg: Config
  inv: Inventory | null
  phases: PhaseViews | null
  /** 当前阶段（状态在 Panel 持有，头部阶段按钮统一切换）。 */
  phase: PhaseKey
  /** 三态同步（默认关）：三个阶段共用同一份并集行集，增删 / 排序 / 勾选 / 文本编辑一次写全三态。 */
  syncAll?: boolean
  t: Translate
  write: (field: SectionField | ContextField | 'replacements' | 'inject' | 'tools', value: unknown) => void
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

  // ── 三态同步（syncAll）：三态共用同一份并集行集 ────────────────────────
  /** 该条目是否在目标阶段的装配输入（base 视图）里：镜像时据此决定「只写 order」
   *  还是「必须带正文」。null = 该阶段视图未就绪（镜像整段跳过，绝不把缺失的
   *  阶段当空集写掉）。 */
  const nativeIn = (key: PhaseKey, entry: EntryRef): boolean | null => {
    const view = phases?.[key]
    if (view === undefined || view === null) return null
    return (view.baseSections ?? []).some((section) => sameEntry(section, entry))
  }
  /** 三阶段装配是否都就绪（缺一态就不做镜像）。 */
  const mirrorReady = (): boolean => PHASE_KEYS.every((key) => phases?.[key] !== null && phases?.[key] !== undefined)
  /** 并集行集：常驻期行序为骨架，其余两态独有的段追加在尾部（同名同源以原生那阶段为准）。 */
  const mirrorRows = (): PartRow[] => mirroredRows(cfg, phases, nativeIn)
  const rowsOf = (key: PhaseKey): PartRow[] =>
    syncAll === true ? mirrorRows() : phaseRows(cfg, phases?.[key] ?? null, key)

  // 屏蔽 / 恢复一个段（blockPatch 只动本阶段自己的名单）。写入严格落在当前
  // 编辑目标的草稿里 —— 预设之间互相独立：在 A 预设里的任何改动对 B 预设与
  // 全局默认零影响。
  const applyBlock = (key: PhaseKey, entry: EntryRef, blocked: boolean): void => {
    const patch = blockPatch(cfg, key, entry, blocked)
    for (const [field, value] of Object.entries(patch)) {
      write(field as SectionField, value)
    }
  }

  /** 三态同步落盘：并集行集一次写全三个阶段（inject + 三份屏蔽名单）—— 逐阶段
   *  各写一次会互相覆盖（edit 对 inject 是整体替换），必须一次写全。 */
  const persistMirror = (rows: PartRow[]): void => {
    if (!mirrorReady()) {
      setNotice(t('syncNotReady'))
      return
    }
    write('inject', mirrorPhaseInjectEntries(cfg, rows, nativeIn))
    const denied = mirroredDeniedLists(rows)
    for (const descriptor of PHASES) write(descriptor.sectionField, denied[descriptor.sectionField])
  }

  // 该条目是否在该阶段的装配输入里（判断加入是「解除屏蔽」还是「凭空注入」）。
  const inBaseOf = (key: PhaseKey, entry: EntryRef): boolean => nativeIn(key, entry) === true

  // 持久化一个阶段的有序列表（写回 inject）：每行一条注入项、order 为连续整数；
  // 系统行空文本（仅 order 覆盖），custom 行保留文本；其它阶段的注入项原样保留。
  const persistPhase = (key: PhaseKey, rows: PartRow[]): void => {
    write('inject', phaseInjectEntries(cfg, key, rows))
  }

  /** 持久化一份有序行集：三态同步 = 一次写全三个阶段，否则只写当前阶段。 */
  const persistRows = (key: PhaseKey, rows: PartRow[]): void => {
    if (syncAll === true) persistMirror(rows)
    else persistPhase(key, rows)
  }

  const toggleBlocked = (key: PhaseKey, row: PartRow): void => {
    if (syncAll === true) {
      const rows = rowsOf(key)
      const target = rows.find((item) => sameEntry(item, row))
      if (target === undefined) return
      persistMirror(rows.map((item) => (sameEntry(item, row) ? { ...item, blocked: !item.blocked } : item)))
      return
    }
    applyBlock(key, row, !row.blocked)
  }

  // 上移/下移一格（数组交换后重排整个阶段）。
  const moveRow = (key: PhaseKey, index: number, dir: -1 | 1): void => {
    const rows = rowsOf(key)
    const target = index + dir
    if (target < 0 || target >= rows.length) return
    const next = rows.slice()
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item!)
    persistRows(key, next)
  }

  // 从该阶段移除一个段：只删本阶段的注入条目；若它仍靠 always 条目存在，
  // 则改写本阶段屏蔽名单（不能删 always —— 那等于三态一起删）。
  const removeFromPart = (key: PhaseKey, row: PartRow): void => {
    if (syncAll === true) {
      persistMirror(rowsOf(key).filter((item) => !sameEntry(item, row)))
      return
    }
    const inject = (cfg.inject ?? []).filter((item) => !((item.phase ?? 'always') === key && sameEntry(item, row)))
    const stillAlways = inject.some((item) => (item.phase ?? 'always') === 'always' && sameEntry(item, row))
    write('inject', inject)
    if (stillAlways) applyBlock(key, row, true)
  }

  // 文本编辑按阶段生效：编辑态的键是「阶段 + 条目身份」。写入走 persistPhase
  //（本阶段的注入条目带 text），绝不碰全局替换字典。
  const startReplace = (key: PhaseKey, row: PartRow): void => {
    setEditing(editKey(key, row))
    setDraft(row.override || row.text)
  }
  const commitReplace = (key: PhaseKey, row: PartRow): void => {
    const patchRow = (candidate: PartRow): PartRow =>
      sameEntry(candidate, row) ? { ...candidate, override: draft, text: draft } : candidate
    // 三态同步：替换文本一次写全三个阶段（同名同源行 = 同一份文本）。
    persistRows(key, rowsOf(key).map(patchRow))
    setEditing(null)
  }
  const restoreReplace = (key: PhaseKey, row: PartRow): void => {
    const next = rowsOf(key).map((candidate) =>
      sameEntry(candidate, row) ? { ...candidate, override: '', text: candidate.custom ? candidate.text : '' } : candidate,
    )
    persistRows(key, next)
    // 阶段化替换条目：只清除本阶段（含 always）对这条目生效的替换。
    const rest = (cfg.replacements ?? []).filter((item) => !(
      sameEntry(item, row)
      && ((item.phase ?? 'always') === 'always' || (item.phase ?? 'always') === key)
    ))
    if (rest.length !== (cfg.replacements ?? []).length) write('replacements', rest)
  }

  const addSection = (name: string, text: string, phase: PhaseKey): void => {
    const row: PartRow = { name, text, replaced: false, custom: true, override: text, blocked: false }
    if (syncAll === true) {
      // 三态同步：新段一次建进三个阶段（并集行集尾部，带自撰正文）。
      persistMirror([...rowsOf(phase), row])
      return
    }
    // order 由 phaseInjectEntries 统一生成连续值，绝不从 120 之类的魔法数起步。
    write('inject', phaseInjectEntries(cfg, phase, [...rowsOf(phase), row]))
  }

  /** 服务端 dynamic 标记：只认布尔值；undefined = 宿主不支持，界面不得猜。 */
  const dynamicOf = (entry: EntryRef): boolean | undefined => {
    for (const key of PHASE_KEYS) {
      const section = (phases?.[key]?.baseSections ?? []).find((candidate) => sameEntry(candidate, entry))
      if (section !== undefined && typeof section.dynamic === 'boolean') return section.dynamic
    }
    const poolSection = (inv?.sections ?? []).find((candidate) => sameEntry(candidate, entry))
    return typeof poolSection?.dynamic === 'boolean' ? poolSection.dynamic : undefined
  }

  // 从「全部」池把一个段加入某阶段。动态段（服务端 dynamic=true）没有可带的
  // 原文；宿主不提供 dynamic 标记时禁用加入并提示，绝不用文本前缀猜测。
  const addFromPool = (key: PhaseKey, entry: EntryRef, text: string, copiedFrom?: string): void => {
    const dynamic = dynamicOf(entry)
    if (dynamic === true) {
      setNotice(t('sectionDynamicNoAdd', { name: entry.name }))
      return
    }
    if (dynamic === undefined) {
      setNotice(t('sectionDynamicUnsupported', { name: entry.name }))
      return
    }
    setNotice(null)
    const rows = rowsOf(key)
    const existing = rows.find((row) => sameEntry(row, entry))
    // 三态同步下「加入」= 三态都出现且都开启（并集行集里重排到尾部 / 追加新行）。
    const next = existing !== undefined
      ? [...rows.filter((row) => !sameEntry(row, entry)), syncAll === true ? { ...existing, blocked: false } : existing]
      : [...rows, {
          name: entry.name,
          ...(entry.source === undefined ? {} : { source: entry.source }),
          text: '',
          replaced: (cfg.replacements ?? []).some((item) => sameEntry(item, entry)),
          custom: false,
          override: text,
          blocked: false,
        }]
    if (syncAll !== true && (existing === undefined || existing.blocked) && inBaseOf(key, entry)) {
      const patch = blockPatch(cfg, key, entry, false)
      for (const [field, value] of Object.entries(patch)) write(field as SectionField, value)
    }
    persistRows(key, next)
    if (copiedFrom !== undefined) setNotice(t('sectionCopied', { name: entry.name, to: stageLabel(key), from: copiedFrom }))
  }

  // ── 拖拽落地（手势定义见 dnd.ts）────────────────────────────────────
  /** 拖拽载荷 → 条目身份（name + source）。 */
  const entryOfPayload = (payload: { name: string; source?: EntryRef['source'] }): EntryRef => ({
    name: payload.name,
    ...(payload.source === undefined ? {} : { source: payload.source }),
  })

  /** 从本阶段拿掉一段：注入进来的撤销注入，原生段则屏蔽掉（等价于取消勾选）。 */
  const removeFromPhase = (entry: EntryRef): void => {
    const rows = rowsOf(phase)
    const row = rows.find((item) => sameEntry(item, entry))
    if (row === undefined) return
    if (syncAll === true) {
      // 三态同步：原生段三态一起屏蔽；只靠注入存在的段三态一起撤销注入。
      const native = PHASE_KEYS.some((key) => nativeIn(key, row) === true)
      persistMirror(row.custom || !native
        ? rows.filter((item) => !sameEntry(item, row))
        : rows.map((item) => (sameEntry(item, row) ? { ...item, blocked: true } : item)))
    } else if (row.custom || row.override !== '' || injectedNames.has(entryKey(row))) {
      removeFromPart(phase, row)
    } else {
      applyBlock(phase, row, true)
    }
    setNotice(t('sectionRemoved', { name: row.name, from: stageLabel(phase) }))
  }

  /** 行上投放：同阶段 = 排序；别的阶段 / 池里来的 = 复制进本阶段（源不动）。 */
  const dropOnRow = (event: ReactDragEvent, target: PartRow): void => {
    const payload = payloadOf(event)
    if (payload === null || payload.kind !== 'section') return
    event.preventDefault()
    event.stopPropagation()
    setDropMark(null)
    const entry = entryOfPayload(payload)
    if (sameEntry(entry, target)) return
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const pos = event.clientY < rect.top + rect.height / 2 ? 'above' : 'below'
    if (payload.from === phase) {
      const next = reorderInsert(rowsOf(phase), entry, target, pos)
      if (next !== null) { persistRows(phase, next); setNotice(null) }
      return
    }
    addFromPool(phase, entry, payload.text ?? '', payload.from === 'pool' ? undefined : stageLabel(payload.from))
  }

  /** 列表空白处投放：追加到本阶段末尾；池里拖来的 = 加入本阶段。 */
  const dropOnList = (event: ReactDragEvent): void => {
    const payload = payloadOf(event)
    if (payload === null || payload.kind !== 'section') return
    event.preventDefault()
    setDropMark(null)
    const entry = entryOfPayload(payload)
    if (payload.from !== phase) {
      addFromPool(phase, entry, payload.text ?? '', payload.from === 'pool' ? undefined : stageLabel(payload.from))
      return
    }
    const list = rowsOf(phase)
    const last = list[list.length - 1]
    if (last === undefined || sameEntry(last, entry)) return
    const next = reorderInsert(list, entry, last, 'below')
    if (next !== null) persistRows(phase, next)
  }

  /** 池上投放：把行从本阶段拿掉（拖回「全部」的手势）。 */
  const dropOnPool = (event: ReactDragEvent): void => {
    const payload = payloadOf(event)
    if (payload === null || payload.kind !== 'section') return
    event.preventDefault()
    event.stopPropagation()
    setDropMark(null)
    if (payload.from !== phase) return
    removeFromPhase(entryOfPayload(payload))
  }

  // 头部阶段 Tab 上的投放：复制到那个阶段（换 Tab / 换模式时旧列表卸载、
  // 新列表注册 —— 任何时刻只有一个处理者）。
  useEffect(() => {
    setPhaseDropHandler((key, payload) => {
      if (payload.kind !== 'section' || key === phase) return
      // 三态同步：段已经在三个阶段里了，拖到别的阶段 Tab 不再复制（只有池里来的要加入）。
      if (syncAll === true && payload.from !== 'pool') return
      addFromPool(key, entryOfPayload(payload), payload.text ?? '', stageLabel(phase))
    })
    return () => setPhaseDropHandler(null)
  })

  const stageLabel = (key: PhaseKey): string => t(PHASE_LABEL_KEY[key])

  // 该阶段的「段级定制没进最终提示词」警示（forceSections 关闭或失效时）。
  const partNote = (key: PhaseKey): ReactElement | null => {
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

  const isEditing = (key: PhaseKey, row: PartRow): boolean => editing === editKey(key, row)

  const renderRow = (key: PhaseKey, row: PartRow, index: number, total: number): ReactElement | null => {
    if (!rowVisible(row)) return null
    const identity = entryKey(row)
    const toolPrompt = row.toolPrompt ?? (row.name.startsWith('tool:')
      ? { tools: [row.name.slice('tool:'.length)], empty: row.text.length === 0 }
      : undefined)
    const mark = dropMark !== null && dropMark.startsWith(`${identity}:`) ? dropMark.slice(identity.length + 1) : null
    return h('div', {
      key: identity,
      style: {
        ...s.row,
        ...(row.blocked ? s.rowBlocked : {}),
        ...(mark === 'above' ? s.dropAbove : {}),
        ...(mark === 'below' ? s.dropBelow : {}),
        ...(dragName === identity ? s.dragging : {}),
      },
      onDragOver: (event: ReactDragEvent) => {
        if (!acceptsDrop(event, 'section')) return
        event.preventDefault()
        event.stopPropagation()
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
        setDropMark(`${identity}:${event.clientY < rect.top + rect.height / 2 ? 'above' : 'below'}`)
      },
      onDrop: (event: ReactDragEvent) => dropOnRow(event, row),
    }, [
      // 拖拽抓手：整行 draggable 会把勾选框 / 文本域的选择手势一起吃掉。
      h('span', {
        draggable: true,
        title: t('drag'),
        style: s.dragHandle,
        onDragStart: (event: ReactDragEvent) => {
          setDragName(identity)
          beginDrag(event, {
            kind: 'section',
            name: row.name,
            ...(row.source === undefined ? {} : { source: row.source }),
            from: key,
            text: row.override || row.text,
          })
        },
        onDragEnd: () => { setDragName(null); setDropMark(null); finishDrag() },
      }, '⠿'),
      h('input', {
        type: 'checkbox',
        checked: !row.blocked,
        onChange: () => toggleBlocked(key, row),
        title: row.blocked ? t('blockedOn') : t('blockedOff'),
        style: { margin: 0, cursor: 'pointer', flex: 'none' },
      }),
      h('div', { style: s.rowBody }, [
        h('div', { style: s.rowTitle }, [
          h('span', { style: s.code }, row.name),
          h('span', { style: s.orderTag }, '#' + index),
          h('span', { style: row.custom ? s.badgeCustom : s.badgeSystem }, row.custom ? t('manual') : t('system')),
          row.source === undefined ? null : h('span', { style: s.badgeSystem }, `${row.source.kind}${row.source.id === undefined ? '' : `:${row.source.id}`}`),
          // 会话级：只在 agent 自己的作用域里注册（预设 scope 的注册表没有它，
          // 但真实会话装配一定有）—— 预览已把它并进列表，这里标出来免得误会。
          agentScoped.has(identity) ? h('span', { style: s.badgeSystem, title: t('agentScopedHint') }, t('agentScoped')) : null,
          toolPrompt === undefined
            ? null
            : h('span', {
                style: s.badgeSystem,
                title: t('toolPromptToolsHint', { tools: toolPrompt.tools.join(', ') }),
              }, t('toolPromptBadge')),
          row.replaced ? h('span', { style: s.badgeReplaced }, t('replaced')) : null,
          row.blocked ? h('span', { style: s.badgeBlocked }, t('blockedOn')) : null,
        ]),
        isEditing(key, row)
          ? h('div', { style: s.editBox }, [
              h('textarea', { style: s.editInput, value: draft, onChange: (e: ChangeEvent<HTMLTextAreaElement>) => setDraft(e.target.value), rows: 3 }),
              h('div', { style: s.injectRow }, [
                h('button', { style: s.mini, onClick: () => commitReplace(key, row) }, t('save')),
                h('button', { style: s.mini, onClick: () => setDraft('') }, t('clearInput')),
                !row.custom && row.replaced
                  ? h('button', { style: s.mini, onClick: () => restoreReplace(key, row) }, t('restore'))
                  : null,
              ]),
            ])
          : h('div', { style: s.preview }, String(row.override || row.text || '').slice(0, 140) || (row.dynamic === true ? t('dynamic') : t('empty'))),
        toolPrompt === undefined
          ? null
          : h('div', { style: { ...s.muted, fontSize: '11px' } },
              `${t('toolPromptToolsLabel')}: ${toolPrompt.tools.join(' / ')}${toolPrompt.empty === true ? ` · ${t('empty')}` : ''}`),
      ]),
      h('div', { style: s.arrowCol }, [
        h('button', { style: s.arrow, disabled: index === 0, onClick: () => moveRow(key, index, -1), title: t('moveUp') }, '↑'),
        h('button', { style: s.arrow, disabled: index === total - 1, onClick: () => moveRow(key, index, 1), title: t('moveDown') }, '↓'),
      ]),
      isEditing(key, row) ? null : h('button', { style: s.mini, onClick: () => startReplace(key, row) }, t('replace')),
      !isEditing(key, row) && !row.custom && row.replaced
        ? h('button', { style: s.mini, onClick: () => restoreReplace(key, row) }, t('restore'))
        : null,
      row.custom ? h('button', { style: s.mini, onClick: () => removeFromPart(key, row), title: t('delete') }, t('delete')) : null,
    ])
  }

  // 当前阶段的行 + 三态过滤。
  const rows = rowsOf(phase)
  /** 三态同步下建不到其它阶段的动态段（行集里显示、装配里没有）：给出说明。 */
  const mirrorSkipped = syncAll === true && mirrorReady() ? mirrorSkippedNames(rows, nativeIn) : []
  /** 本阶段有注入条目（= 被显式加进来过）的条目身份键：拖回池时用来自动选「撤销注入」还是「屏蔽」。 */
  const injectedNames = injectedAt(cfg, phase).names
  /** 只在 agent 作用域注册的段（预览把它们并进来了，带 scope 标记）：行上标「会话级」。 */
  const agentScoped = new Set<string>()
  for (const view of Object.values(phases ?? {})) {
    for (const section of view?.baseSections ?? []) {
      if (section.scope === 'agent') agentScoped.add(entryKey(section))
    }
  }
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
      mirrorSkipped.length > 0
        ? h('div', { style: s.noticeWarn }, t('syncSkippedDynamic', { names: mirrorSkipped.join('、') }))
        : null,
      partNote(phase),
      rows.map((row, i) => renderRow(phase, row, i, rows.length)),
      rows.length === 0 ? h('div', { style: s.muted }, t('empty')) : null,
      addOpen
        ? h(InjectForm, {
            onAdd: (name, text) => { addSection(name, text, phase); setAddOpen(false) },
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
          key: entryKey(sec),
          style: { ...s.row, opacity: 0.92 },
          draggable: true,
          title: t('drag'),
          onDragStart: (event: ReactDragEvent) => beginDrag(event, {
            kind: 'section',
            name: sec.name,
            ...(sec.source === undefined ? {} : { source: sec.source }),
            from: 'pool',
            text: sec.text ?? '',
          }),
          onDragEnd: finishDrag,
        }, [
          h('div', { style: s.rowBody }, [
            h('div', { style: s.rowTitle }, [
              h('span', { style: s.code }, sec.name),
              sec.source === undefined ? null : h('span', { style: s.badgeSystem }, `${sec.source.kind}${sec.source.id === undefined ? '' : `:${sec.source.id}`}`),
            ]),
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

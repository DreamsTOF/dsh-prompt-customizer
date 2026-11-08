/**
 * ToolsPane — 独立面板的左栏（工具模式）。
 *
 * 顶部三个阶段 Tab（引导期 / 常驻期 / 压缩受控期），与右栏预览的阶段按钮
 * **联动**。每个阶段列出该阶段进入过滤的目录 ∪ 用户加回的工具：勾选框 =
 * 该阶段对模型可见；隐藏后仍在列表可反选。三份名单互不继承。
 *
 * 条目身份 = `{name, source}`：同名不同源的工具分行、按 name+source 操作；
 * 服务端提供的 `keySuffix`（如 live / preset 两态）只用于区分展示行。
 *
 * 底部固定条：三态过滤（全部 / 已启用 = 可见 / 已停用 = 隐藏），只统计当前
 * 阶段。完整目录按来源分组、同一 name+source 的多状态聚合展示。
 */
import { createElement as h, useEffect, useRef, useState, type DragEvent as ReactDragEvent, type ReactElement } from 'react'
import {
  PHASE_KEYS,
  PHASE_LABEL_KEY,
  SOURCE_KIND_ORDER,
  SOURCE_LABEL_KEY,
  entryKey,
  normalizeEntry,
  sameEntry,
  sourceKey,
  type BaseTool,
  type Config,
  type EntryRef,
  type EntrySource,
  type Inventory,
  type PhaseKey,
  type PhaseViews,
  type ToolState,
} from './types.ts'
import type { Translate } from './locales.ts'
import { toolFieldOf } from './phase-ops.ts'
import { withPhaseAdd, withPhaseExclude } from './presets.ts'
import { acceptsDrop, beginDrag, finishDrag, payloadOf, setPhaseDropHandler, type DragPayload } from './dnd.ts'
import { useDragAutoScroll } from './drag-scroll.ts'
import { s } from './styles.ts'
import type { TriState } from './SectionsPane.tsx'

/** 一次加回操作的反馈（ok = 已写入，warn = 什么都没改并说明原因）。 */
type Notice = { kind: 'ok' | 'warn'; text: string }

/** 工具行：条目身份 + 展示 / 状态字段。 */
type ToolRow = EntryRef & {
  description: string
  hidden: boolean
  added: boolean
  state?: ToolState
  scope?: 'agent' | 'executor'
  keySuffix?: string
}

/** 清单与预览两个来源的工具条目（description 可能缺席）。 */
type ToolLike = EntryRef & {
  description?: string
  hidden?: boolean
  state?: ToolState
  scope?: 'agent' | 'executor'
  maskedByPlugin?: boolean
  maskedByOwnPlugin?: boolean
  keySuffix?: string
}

function entryOf(tool: EntryRef | string): EntryRef | undefined {
  return normalizeEntry(tool)
}

function entryOfPayload(payload: DragPayload): EntryRef {
  return {
    name: payload.name,
    ...(payload.source === undefined ? {} : { source: payload.source }),
  }
}

function listHas(list: EntryRef[], entry: EntryRef): boolean {
  return list.some((item) => sameEntry(item, entry))
}

function listWithout(list: EntryRef[], entry: EntryRef): EntryRef[] {
  return list.filter((item) => !sameEntry(item, entry))
}

function listWith(list: EntryRef[], entry: EntryRef): EntryRef[] {
  if (listHas(list, entry)) return list
  return [...list, { name: entry.name, ...(entry.source === undefined ? {} : { source: entry.source }) }]
}

export function ToolsPane({ cfg, inv, phases, phase, syncAll, t, write }: {
  cfg: Config
  inv: Inventory | null
  phases: PhaseViews | null
  /** 当前阶段（状态在 Panel 持有，头部阶段按钮统一切换）。 */
  phase: PhaseKey
  /** 三态同步（默认关）：隐藏 / 显示与加回对三个阶段一起生效（只作用于同 name+source 条目）。 */
  syncAll?: boolean
  t: Translate
  write: (field: 'replacements' | 'inject' | 'tools', value: unknown) => void
}): ReactElement {
  const [filter, setFilter] = useState<TriState>('all')
  const [notice, setNotice] = useState<Notice | null>(null)
  // 拖拽：正在拖的行键，投放位置标记（行键 / `list` / `pool`）。
  const [dragName, setDragName] = useState<string | null>(null)
  const [dropMark, setDropMark] = useState<string | null>(null)
  // 列表滚动容器：拖到上下边缘时自动滚（长列表里手拖够不到视口外的位置）。
  const scrollRef = useRef<HTMLDivElement | null>(null)
  useDragAutoScroll(scrollRef)

  // 某阶段自己的黑名单 / 加回名单（按 PHASES 的 toolField 派生，三份互不继承）。
  const excludeOf = (key: PhaseKey): EntryRef[] => {
    const tools = cfg.tools ?? {}
    const field = toolFieldOf(key)
    const list = field === 'static' ? tools.exclude : tools[field]?.exclude
    return list ?? []
  }
  const addOf = (key: PhaseKey): EntryRef[] => {
    const tools = cfg.tools ?? {}
    const field = toolFieldOf(key)
    const list = field === 'static' ? tools.add : tools[field]?.add
    return list ?? []
  }
  // 一次写入同时落该阶段的 exclude 与 add（在同一份 tools 上叠完再写一次）。
  const writeLists = (key: PhaseKey, exclude: EntryRef[], add: EntryRef[]): void => {
    write('tools', withPhaseAdd(withPhaseExclude(cfg.tools ?? {}, key, exclude), key, add))
  }

  // 三态同步写入（syncAll 开启时）：对三个阶段各自的 exclude / add 名单做同一
  // 变换，叠进一份 tools 后一次写入。变换返回 null = 该阶段无可做的改动，跳过。
  const writeSynced = (
    apply: (key: PhaseKey, exclude: EntryRef[], add: EntryRef[]) => { exclude: EntryRef[]; add: EntryRef[] } | null,
  ): void => {
    let tools = cfg.tools
    let changed = false
    for (const key of PHASE_KEYS) {
      const next = apply(key, excludeOf(key), addOf(key))
      if (next === null) continue
      changed = true
      tools = withPhaseExclude(withPhaseAdd(tools, key, next.add), key, next.exclude)
    }
    if (changed) write('tools', tools)
  }

  // 该阶段的装配目录（进入本插件过滤的工具原文）与该预设注册表（能加回的来源）。
  const catalogOf = (key: PhaseKey): BaseTool[] => phases?.[key]?.baseTools ?? []
  const isInCatalog = (key: PhaseKey, entry: EntryRef): boolean => catalogOf(key).some((tool) => sameEntry(tool, entry))
  // 注册表三个阶段共享同一 scope：取三阶段并集（不是第一个非空），同名同源去重。
  const registry: EntryRef[] = (() => {
    const out: EntryRef[] = []
    const seen = new Set<string>()
    for (const key of PHASE_KEYS) {
      for (const value of phases?.[key]?.registryTools ?? []) {
        const entry = entryOf(value)
        if (entry === undefined) continue
        const identity = entryKey(entry)
        if (seen.has(identity)) continue
        seen.add(identity)
        out.push(entry)
      }
    }
    return out
  })()
  /** 注册表里是否有该工具：服务端仍只回传工具名（无 source）时按名字兜底匹配。 */
  const inRegistry = (entry: EntryRef): boolean =>
    registry.some((candidate) => sameEntry(candidate, entry) || (candidate.source === undefined && candidate.name === entry.name))

  const stateOf = (tool: ToolLike): ToolState => tool.state
    ?? (tool.scope === 'agent' ? 'locked-agent'
      : tool.scope === 'executor' ? 'locked-executor'
        : tool.maskedByOwnPlugin === true ? 'masked-own'
          : tool.maskedByPlugin === true ? 'masked-plugin'
            : 'controllable')
  /** 可在阶段里勾选开关：普通预设工具 + agent 作用域工具（后者靠装配后过滤 tools 实现隐藏）。 */
  const isToggleable = (tool: ToolLike): boolean => {
    const state = stateOf(tool)
    return state === 'controllable' || state === 'locked-agent'
  }
  /** 执行器包装（如 PTC run_code）：模型可见但本插件不按阶段删，锁定。 */
  const isLockedExec = (tool: ToolLike): boolean => stateOf(tool) === 'locked-executor'
  /** 只在只读「已遮蔽」池：被别的插件 / 本插件遮蔽，无法反开。 */
  const isMaskedRow = (tool: ToolLike): boolean => {
    const state = stateOf(tool)
    return state === 'masked-plugin' || state === 'masked-own'
  }

  // 把一个工具放进某阶段（复制语义，绝不改动其它阶段）：不在该阶段目录里就
  // 加进 add 名单；hidden 决定它在目标阶段是可见还是隐藏。
  const addToPhase = (key: PhaseKey, entry: EntryRef, hidden: boolean): void => {
    let exclude = excludeOf(key)
    let add = addOf(key)
    if (!isInCatalog(key, entry) && !listHas(add, entry)) add = listWith(add, entry)
    exclude = hidden
      ? (listHas(exclude, entry) ? exclude : listWith(exclude, entry))
      : listWithout(exclude, entry)
    writeLists(key, exclude, add)
  }

  // 阶段分组里的行 = 该阶段进入过滤的目录 ∪ 已加回（但尚未出现在装配里）的工具。
  const rowsOf = (key: PhaseKey): ToolRow[] => {
    const catalog = catalogOf(key)
      .filter((tool) => isToggleable(tool) || isLockedExec(tool))
      .map((tool) => ({
        name: tool.name,
        ...(tool.source === undefined ? {} : { source: tool.source }),
        description: tool.description ?? '',
        hidden: isLockedExec(tool) ? false : tool.hidden === true,
        added: false,
        state: stateOf(tool),
        ...(tool.scope === 'agent' || tool.scope === 'executor' ? { scope: tool.scope } : {}),
        ...(tool.keySuffix === undefined ? {} : { keySuffix: tool.keySuffix }),
      }))
    const added = addOf(key)
      .filter((entry) => !catalog.some((row) => sameEntry(row, entry)))
      .map((entry) => ({
        name: entry.name,
        ...(entry.source === undefined ? {} : { source: entry.source }),
        description: '',
        hidden: false,
        added: true,
        state: 'controllable' as ToolState,
      }))
    return [...catalog, ...added]
  }

  // 勾选 / 取消勾选：只动这一个工具（name+source）在本阶段的可见性。
  const toggleHide = (key: PhaseKey, row: ToolRow, currentlyHidden: boolean): void => {
    if (syncAll) {
      // 三态同步：显示 = 各阶段 exclude 移除（绝不顺手把没加回的工具加进 add）；
      // 隐藏 = 已加回的撤销加回、原生的进该阶段 exclude。
      writeSynced((_key, exclude, add) => {
        if (currentlyHidden) return { exclude: listWithout(exclude, row), add }
        if (listHas(add, row)) return { exclude, add: listWithout(add, row) }
        return listHas(exclude, row) ? null : { exclude: listWith(exclude, row), add }
      })
      setNotice(null)
      return
    }
    if (currentlyHidden) {
      addToPhase(key, row, false)
    } else {
      let exclude = excludeOf(key)
      let add = addOf(key)
      if (listHas(add, row)) add = listWithout(add, row)
      else if (!listHas(exclude, row)) exclude = listWith(exclude, row)
      writeLists(key, exclude, add)
    }
    setNotice(null)
  }

  // 从池加入某阶段。注册表里没有的加不进来。
  const addFromPool = (key: PhaseKey, entry: EntryRef): void => {
    if (!isInCatalog(key, entry) && !inRegistry(entry)) {
      setNotice({ kind: 'warn', text: t('toolNotInRegistry', { name: entry.name }) })
      return
    }
    if (syncAll) {
      // 三态同步：三个阶段都让它出现（该阶段目录里没有的就写进各自的 add 名单）。
      writeSynced((phaseKey, exclude, add) => ({
        exclude: listWithout(exclude, entry),
        add: !isInCatalog(phaseKey, entry) && !listHas(add, entry) ? listWith(add, entry) : add,
      }))
      setNotice({ kind: 'ok', text: t('toolSyncShown', { name: entry.name }) })
      return
    }
    addToPhase(key, entry, false)
    setNotice({
      kind: 'ok',
      text: isInCatalog(key, entry)
        ? t('toolShown', { name: entry.name, to: stageLabel(key) })
        : t('toolAdded', { name: entry.name, phase: stageLabel(key) }),
    })
  }

  // ── 拖拽落地（手势定义见 dnd.ts）────────────────────────────────────
  /** 从某阶段拿掉一个工具：已加回的撤销加回，原生工具则进该阶段黑名单。 */
  const removeFromPhase = (key: PhaseKey, entry: EntryRef): void => {
    let exclude = excludeOf(key)
    let add = addOf(key)
    if (listHas(add, entry)) add = listWithout(add, entry)
    else if (!listHas(exclude, entry)) exclude = listWith(exclude, entry)
    writeLists(key, exclude, add)
    setNotice({ kind: 'ok', text: t('toolRemovedFromPhase', { name: entry.name, from: stageLabel(key) }) })
  }

  /** 一次「放进目标阶段」的落地。 */
  const dropToolInto = (key: PhaseKey, payload: DragPayload): void => {
    if (payload.kind !== 'tool' || payload.from === key) return
    const entry = entryOfPayload(payload)
    if (payload.from === 'pool') { addFromPool(key, entry); return }
    addToPhase(key, entry, payload.hidden === true)
    setNotice({ kind: 'ok', text: t('toolCopied', { name: entry.name, to: stageLabel(key), from: stageLabel(payload.from) }) })
  }

  /** 行 / 列表上的投放：把手里的工具放进本阶段。 */
  const dropOnPane = (event: ReactDragEvent): void => {
    const payload = payloadOf(event)
    if (payload === null || payload.kind !== 'tool') return
    event.preventDefault()
    event.stopPropagation()
    setDropMark(null)
    dropToolInto(phase, payload)
  }

  /** 池上的投放：把行从本阶段拿掉。 */
  const dropOnPool = (event: ReactDragEvent): void => {
    const payload = payloadOf(event)
    if (payload === null || payload.kind !== 'tool') return
    event.preventDefault()
    event.stopPropagation()
    setDropMark(null)
    if (payload.from === phase) removeFromPhase(phase, entryOfPayload(payload))
  }

  // 头部阶段 Tab 上的投放：复制到那个阶段。
  useEffect(() => {
    setPhaseDropHandler((key, payload) => dropToolInto(key, payload))
    return () => setPhaseDropHandler(null)
  })

  const stageLabel = (key: PhaseKey): string => t(PHASE_LABEL_KEY[key])

  // 当前阶段的行 + 三态过滤（已启用 = 对模型可见）。
  const rows = rowsOf(phase)
  const onCount = rows.filter((row) => !row.hidden).length
  const offCount = rows.length - onCount
  const rowVisible = (row: ToolRow): boolean =>
    filter === 'all' || (filter === 'on' ? !row.hidden : row.hidden)

  const renderRow = (row: ToolRow): ReactElement | null => {
    if (!rowVisible(row)) return null
    const locked = row.state === 'locked-executor'
    const identity = `${entryKey(row)}\u0000${row.keySuffix ?? ''}`
    return h('div', {
      key: identity,
      style: {
        ...s.row,
        ...(row.hidden ? s.rowBlocked : {}),
        ...(dropMark === identity ? s.dropZoneActive : {}),
        ...(dragName === identity ? s.dragging : {}),
      },
      title: row.description.slice(0, 120),
      onDragOver: (event: ReactDragEvent) => {
        if (!acceptsDrop(event, 'tool')) return
        event.preventDefault()
        event.stopPropagation()
        setDropMark(identity)
      },
      onDrop: dropOnPane,
    }, [
      // 拖拽抓手：整行 draggable 会把勾选框的手势一起吃掉。
      h('span', {
        draggable: !locked,
        title: locked ? t('toolExecutorScopedHint') : t('drag'),
        style: s.dragHandle,
        onDragStart: (event: ReactDragEvent) => {
          setDragName(identity)
          beginDrag(event, {
            kind: 'tool',
            name: row.name,
            ...(row.source === undefined ? {} : { source: row.source }),
            ...(row.keySuffix === undefined ? {} : { keySuffix: row.keySuffix }),
            from: phase,
            hidden: row.hidden,
          })
        },
        onDragEnd: () => { setDragName(null); setDropMark(null); finishDrag() },
      }, '⠿'),
      h('input', {
        type: 'checkbox',
        checked: locked ? true : !row.hidden,
        disabled: locked,
        onChange: () => toggleHide(phase, row, row.hidden),
        title: locked ? t('toolExecutorScopedHint') : row.hidden ? t('hiddenOn') : t('hiddenOff'),
        style: { margin: 0, cursor: locked ? 'not-allowed' : 'pointer', flex: 'none' },
      }),
      h('div', { style: s.rowBody }, [
        h('div', { style: s.rowTitle }, [
          h('span', { style: s.code }, row.name),
          row.source === undefined ? null : h('span', { style: s.badgeSystem }, sourceLabel(row.source)),
          row.keySuffix === undefined ? null : h('span', { style: s.badgeSystem }, row.keySuffix),
          row.added ? h('span', { style: s.badgeCustom }, t('toolAddedTag')) : null,
          row.state === 'locked-agent' ? h('span', { style: s.badgeSystem, title: t('toolAgentScopedHint') }, t('toolAgentScoped')) : null,
          row.state === 'locked-executor' ? h('span', { style: s.badgeSystem, title: t('toolExecutorScopedHint') }, t('toolExecutorScoped')) : null,
          !locked && row.hidden ? h('span', { style: s.badgeBlocked }, t('hiddenOn')) : null,
        ]),
        row.description !== '' ? h('div', { style: s.preview }, row.description.slice(0, 120)) : null,
      ]),
    ])
  }

  // 「本系统全部工具」添加池：只列可开关的预设工具（按 name+source 分行）。
  const allTools = (inv?.tools ?? [])
    .filter((tool) => isToggleable(tool))
    .map((tool) => ({
      name: tool.name,
      ...(tool.source === undefined ? {} : { source: tool.source }),
      description: tool.description ?? '',
      keySuffix: tool.keySuffix,
    }))

  // 只读「完整目录 / 已遮蔽」：被别的插件遮蔽 / 被本插件 MCP 遮蔽的工具。
  // 来源 = 跨预设池 ∪ 当前阶段完整基座；同一 name+source 的多状态聚合一行。
  type Agg = { entry: EntryRef; description: string; states: Set<ToolState> }
  const readOnly = (() => {
    const map = new Map<string, Agg>()
    const consider = (tool: ToolLike): void => {
      if (tool.name === '' || !isMaskedRow(tool)) return
      const entry = normalizeEntry(tool)
      if (entry === undefined) return
      const identity = entryKey(entry)
      const state = stateOf(tool)
      const existing = map.get(identity)
      if (existing === undefined) {
        map.set(identity, { entry, description: tool.description ?? '', states: new Set([state]) })
      } else {
        existing.states.add(state)
        if (existing.description === '' && (tool.description ?? '') !== '') existing.description = tool.description ?? ''
      }
    }
    for (const tool of inv?.tools ?? []) consider(tool)
    for (const key of PHASE_KEYS) for (const tool of catalogOf(key)) consider(tool)
    return [...map.values()].sort((left, right) => left.entry.name.localeCompare(right.entry.name))
  })()
  // 按来源分组（global / preset / workspace / agent / executor / 未知）。
  const readOnlyGroups = (() => {
    const groups = new Map<string, { source?: EntrySource; rows: Agg[] }>()
    for (const row of readOnly) {
      const key = sourceKey(row.entry.source)
      const group = groups.get(key)
      if (group === undefined) groups.set(key, { ...(row.entry.source === undefined ? {} : { source: row.entry.source }), rows: [row] })
      else group.rows.push(row)
    }
    return [...groups.values()].sort((left, right) => {
      const leftKind = left.source?.kind
      const rightKind = right.source?.kind
      const leftRank = leftKind === undefined ? SOURCE_KIND_ORDER.length : SOURCE_KIND_ORDER.indexOf(leftKind)
      const rightRank = rightKind === undefined ? SOURCE_KIND_ORDER.length : SOURCE_KIND_ORDER.indexOf(rightKind)
      if (leftRank !== rightRank) return leftRank - rightRank
      return String(left.source?.id ?? '').localeCompare(String(right.source?.id ?? ''))
    })
  })()

  const sourceLabel = (source?: EntrySource): string => {
    if (source === undefined) return t('sourceUnknown')
    const label = t(SOURCE_LABEL_KEY[source.kind] ?? 'sourceUnknown')
    return source.id === undefined ? label : `${label} · ${source.id}`
  }
  const stateBadge = (state: ToolState): ReactElement => {
    // 只读完整目录只聚合「被遮蔽」两态：分别是其它插件 restrict / 本插件 MCP 遮蔽。
    const own = state === 'masked-own'
    return h('span', {
      style: s.badgeReplaced,
      title: own ? t('toolMaskedByOwnPluginHint') : t('toolMaskedByPluginHint'),
    }, own ? t('toolMaskedByOwnPlugin') : t('toolMaskedByPlugin'))
  }

  return h('div', { style: s.colLeft }, [
    h('div', {
      ref: scrollRef,
      style: { ...s.colScroll, ...(dropMark === 'list' ? s.dropZone : {}) },
      // 列表空白处投放：池里 / 别的阶段拖来的工具放进本阶段。
      onDragOver: (event: ReactDragEvent) => {
        const payload = payloadOf(event)
        if (payload === null || payload.kind !== 'tool' || payload.from === phase) return
        event.preventDefault()
        setDropMark('list')
      },
      onDrop: dropOnPane,
    }, [
      h('div', { style: s.muted }, t('toolsFourHint')),
      notice ? h('div', { style: notice.kind === 'ok' ? s.noticeOk : s.noticeWarn }, notice.text) : null,
      rows.map(renderRow),
      rows.length === 0 ? h('div', { style: s.muted }, t('empty')) : null,
      // 本系统全部工具：注册表的完整目录，只读池；拖入 / 拖出改变阶段名单。
      h('details', {
        style: { ...s.injectBox, ...(dropMark === 'pool' ? s.dropZoneActive : {}) },
        onDragOver: (event: ReactDragEvent) => {
          if (!acceptsDrop(event, 'tool')) return
          event.preventDefault()
          event.stopPropagation()
          setDropMark('pool')
        },
        onDrop: dropOnPool,
      }, [
        h('summary', { style: { ...s.muted, cursor: 'pointer' } },
          `${t('allToolsTitle')} (${allTools.length})`),
        allTools.length === 0 ? h('div', { style: s.muted }, t('empty')) : null,
        allTools.map((tool) => h('div', {
          key: `${entryKey(tool)}\u0000${tool.keySuffix ?? ''}`,
          style: { ...s.row, opacity: 0.92 },
          draggable: true,
          title: t('dragHint'),
          onDragStart: (event: ReactDragEvent) => beginDrag(event, {
            kind: 'tool',
            name: tool.name,
            ...(tool.source === undefined ? {} : { source: tool.source }),
            ...(tool.keySuffix === undefined ? {} : { keySuffix: tool.keySuffix }),
            from: 'pool',
          }),
          onDragEnd: finishDrag,
        }, [
          h('div', { style: s.rowBody }, [
            h('div', { style: s.rowTitle }, [
              h('span', { style: s.code }, tool.name),
              tool.source === undefined ? null : h('span', { style: s.badgeSystem }, sourceLabel(tool.source)),
            ]),
            tool.description !== '' ? h('div', { style: s.preview }, tool.description.slice(0, 120)) : null,
          ]),
        ])),
      ]),
      // 只读「完整目录」：不可控工具按来源分组，同一 name+source 的多状态聚合一行。
      readOnly.length === 0 ? null : h('details', { style: s.injectBox }, [
        h('summary', { style: { ...s.muted, cursor: 'pointer' } }, `${t('completeCatalogTitle')} (${readOnly.length})`),
        h('div', { style: s.muted }, t('completeCatalogHint')),
        readOnlyGroups.map((group) => h('div', { key: sourceKey(group.source) || 'unknown' }, [
          h('div', { style: { ...s.muted, marginTop: 6, fontWeight: 600 } }, sourceLabel(group.source)),
          group.rows.map((row) => h('div', {
            key: entryKey(row.entry),
            style: { ...s.row, opacity: 0.8 },
          }, [
            h('div', { style: s.rowBody }, [
              h('div', { style: s.rowTitle }, [
                h('span', { style: s.code }, row.entry.name),
                ...[...row.states].map((state) => stateBadge(state)),
              ]),
              row.description !== '' ? h('div', { style: s.preview }, row.description.slice(0, 120)) : null,
            ]),
          ])),
        ])),
      ]),
    ]),
    // 左栏底部固定条：三态过滤（全部 / 已启用 = 可见 / 已停用 = 隐藏）。
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

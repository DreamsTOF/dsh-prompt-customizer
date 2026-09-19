/**
 * ToolsPane — 独立面板的左栏（工具模式）。
 *
 * 顶部三个阶段 Tab（引导期 / 常驻期 / 压缩受控期），与右栏预览的阶段按钮
 * **联动**。每个阶段列出该阶段进入过滤的目录 ∪ 用户加回的工具：勾选框 =
 * 该阶段对模型可见；隐藏后仍在列表可反选。三份名单互不继承。
 *
 * 底部固定条：三态过滤（全部 / 已启用 = 可见 / 已停用 = 隐藏），只统计当前
 * 阶段。
 *
 * 拖拽（见 dnd.ts）：把「本系统全部工具」里的行拖进上面的列表 = 让该工具在本
 * 阶段出现（写进 add 名单加回，或从黑名单里放出来）；把行拖回池 = 从本阶段拿
 * 掉（撤销加回 / 进黑名单）；把行拖到头部某个阶段 Tab = 复制到那个阶段（隐藏
 * 态一起带过去，源阶段不动）。点按路径照旧：池里每行三个小按钮也能加入对应
 * 阶段 —— 注册表里根本没有的（别的预设独有）加不进来，界面明确说明。
 */
import { createElement as h, useEffect, useRef, useState, type DragEvent as ReactDragEvent, type ReactElement } from 'react'
import type { Config, Inventory, PhaseViewKey, Preview } from './types.ts'
import type { Translate } from './locales.ts'
import { PART_ORDER, withPhaseAdd, withPhaseExclude } from './presets.ts'
import { acceptsDrop, beginDrag, finishDrag, payloadOf, setPhaseDropHandler, type DragPayload } from './dnd.ts'
import { useDragAutoScroll } from './drag-scroll.ts'
import { s } from './styles.ts'
import type { TriState } from './SectionsPane.tsx'

/** Panel 并行拉取的三阶段装配。 */
type PhaseViews = Record<PhaseViewKey, Preview | null>

/** 一次加回操作的反馈（ok = 已写入，warn = 什么都没改并说明原因）。 */
type Notice = { kind: 'ok' | 'warn'; text: string }

export function ToolsPane({ cfg, inv, phases, phase, syncAll, t, write }: {
  cfg: Config
  inv: Inventory | null
  phases: PhaseViews | null
  /** 当前阶段（状态在 Panel 持有，头部阶段按钮统一切换）。 */
  phase: PhaseViewKey
  /** 三态同步（默认关）：勾选后隐藏 / 显示与加回对三个阶段一起生效（只作用于同名工具）。 */
  syncAll?: boolean
  t: Translate
  write: (field: 'sections' | 'replace' | 'inject' | 'tools', value: unknown) => void
}): ReactElement {
  const [filter, setFilter] = useState<TriState>('all')
  const [notice, setNotice] = useState<Notice | null>(null)
  // 拖拽：正在拖的工具名，投放位置标记（行名 / `list` / `pool`）。
  const [dragName, setDragName] = useState<string | null>(null)
  const [dropMark, setDropMark] = useState<string | null>(null)
  // 列表滚动容器：拖到上下边缘时自动滚（长列表里手拖够不到视口外的位置）。
  const scrollRef = useRef<HTMLDivElement | null>(null)
  useDragAutoScroll(scrollRef)

  // 某阶段自己的黑名单 / 加回名单（三份互不继承）。
  const excludeOf = (key: PhaseViewKey): string[] => {
    const tools = cfg.tools ?? {}
    const list = key === 'bootstrap' ? tools.bootstrap?.exclude : key === 'compaction' ? tools.compaction?.exclude : tools.exclude
    return list ?? []
  }
  const addOf = (key: PhaseViewKey): string[] => {
    const tools = cfg.tools ?? {}
    const list = key === 'bootstrap' ? tools.bootstrap?.add : key === 'compaction' ? tools.compaction?.add : tools.add
    return list ?? []
  }
  // 一次写入同时落该阶段的 exclude 与 add（在同一份 tools 上叠完再写一次）。
  const writeLists = (key: PhaseViewKey, exclude: string[], add: string[]): void => {
    write('tools', withPhaseAdd(withPhaseExclude(cfg.tools ?? {}, key, exclude), key, add))
  }

  // 三态同步写入（syncAll 开启时）：对三个阶段各自的 exclude / add 名单做同一
  // 变换，叠进一份 tools 后一次写入。变换返回 null = 该阶段无可做的改动，跳过。
  const writeSynced = (
    apply: (key: PhaseViewKey, exclude: string[], add: string[]) => { exclude: string[]; add: string[] } | null,
  ): void => {
    let tools = cfg.tools
    for (const k of PART_ORDER) {
      const next = apply(k, excludeOf(k), addOf(k))
      if (next === null) continue
      tools = withPhaseExclude(withPhaseAdd(tools, k, next.add), k, next.exclude)
    }
    write('tools', tools)
  }

  // 该阶段的装配目录（进入本插件过滤的工具原文）与该预设注册表（能加回的来源）。
  const catalogOf = (key: PhaseViewKey): string[] => (phases?.[key]?.baseTools ?? []).map((tool) => tool.name)
  const isInCatalog = (key: PhaseViewKey, name: string): boolean => catalogOf(key).includes(name)
  // 注册表三个阶段共享同一 scope，取第一个非空的即可。
  const registry: Set<string> = (() => {
    const list = PART_ORDER.map((key) => phases?.[key]?.registryTools).find((x) => Array.isArray(x) && x.length > 0) ?? []
    return new Set(list)
  })()

  // 把一个工具放进某阶段（复制语义，绝不改动其它阶段）：不在该阶段目录里就
  // 加进 add 名单；hidden 决定它在目标阶段是可见还是隐藏。
  const addToPhase = (key: PhaseViewKey, name: string, hidden: boolean): void => {
    let exclude = excludeOf(key)
    let add = addOf(key)
    if (!isInCatalog(key, name) && !add.includes(name)) add = [...add, name]
    exclude = hidden
      ? (exclude.includes(name) ? exclude : [...exclude, name])
      : exclude.filter((x) => x !== name)
    writeLists(key, exclude, add)
  }

  // 阶段分组里的行 = 该阶段进入过滤的目录 ∪ 已加回（但尚未出现在装配里）的工具。
  const rowsOf = (key: PhaseViewKey): Array<{ name: string; description: string; hidden: boolean; added: boolean }> => {
    const exclude = excludeOf(key)
    const catalog = (phases?.[key]?.baseTools ?? []).map((tool) => ({
      name: tool.name,
      description: tool.description ?? '',
      hidden: exclude.includes(tool.name),
      added: false,
    }))
    const names = new Set(catalog.map((row) => row.name))
    const added = addOf(key)
      .filter((name) => !names.has(name))
      .map((name) => ({ name, description: '', hidden: false, added: true }))
    return [...catalog, ...added]
  }

  // 勾选 / 取消勾选：只动这一个工具在本阶段的可见性。
  const toggleHide = (key: PhaseViewKey, name: string, currentlyHidden: boolean): void => {
    if (syncAll) {
      // 三态同步：显示 = 各阶段 exclude 移除（绝不顺手把没加回的工具加进 add）；
      // 隐藏 = 已加回的撤销加回、原生的进该阶段 exclude。
      writeSynced((_k, exclude, add) => {
        if (currentlyHidden) return { exclude: exclude.filter((x) => x !== name), add }
        if (add.includes(name)) return { exclude, add: add.filter((x) => x !== name) }
        return exclude.includes(name) ? null : { exclude: [...exclude, name], add }
      })
      setNotice(null)
      return
    }
    if (currentlyHidden) {
      addToPhase(key, name, false)
    } else {
      let exclude = excludeOf(key)
      let add = addOf(key)
      if (add.includes(name)) add = add.filter((x) => x !== name)
      else if (!exclude.includes(name)) exclude = [...exclude, name]
      writeLists(key, exclude, add)
    }
    setNotice(null)
  }

  // 从池加入某阶段（替代旧版拖拽：池 → 阶段）。注册表里没有的加不进来。
  const addFromPool = (key: PhaseViewKey, name: string): void => {
    if (!isInCatalog(key, name) && !registry.has(name)) {
      setNotice({ kind: 'warn', text: t('toolNotInRegistry', { name }) })
      return
    }
    if (syncAll) {
      // 三态同步：三个阶段都让它出现（该阶段目录里没有的就写进各自的 add 名单）。
      writeSynced((k, exclude, add) => ({
        exclude: exclude.filter((x) => x !== name),
        add: !isInCatalog(k, name) && !add.includes(name) ? [...add, name] : add,
      }))
      setNotice({ kind: 'ok', text: t('toolSyncShown', { name }) })
      return
    }
    addToPhase(key, name, false)
    setNotice({ kind: 'ok', text: isInCatalog(key, name) ? t('toolShown', { name, to: stageLabel(key) }) : t('toolAdded', { name, phase: stageLabel(key) }) })
  }

  // ── 拖拽落地（手势定义见 dnd.ts）────────────────────────────────────
  /** 从某阶段拿掉一个工具（拖回「全部」的手势）：已加回的撤销加回（回到该阶段
   *  原生状态），原生工具则进该阶段黑名单（= 该阶段隐藏）。 */
  const removeFromPhase = (key: PhaseViewKey, name: string): void => {
    let exclude = excludeOf(key)
    let add = addOf(key)
    if (add.includes(name)) add = add.filter((item) => item !== name)
    else if (!exclude.includes(name)) exclude = [...exclude, name]
    writeLists(key, exclude, add)
    setNotice({ kind: 'ok', text: t('toolRemovedFromPhase', { name, from: stageLabel(key) }) })
  }

  /** 一次「放进目标阶段」的落地：池里来的 = 加回 / 显示；别的阶段来的 = 复制
   *  （隐藏态一起带过去，源阶段不动）；同阶段 = 什么都不做。 */
  const dropToolInto = (key: PhaseViewKey, payload: DragPayload): void => {
    if (payload.kind !== 'tool' || payload.from === key) return
    if (payload.from === 'pool') { addFromPool(key, payload.name); return }
    addToPhase(key, payload.name, payload.hidden === true)
    setNotice({ kind: 'ok', text: t('toolCopied', { name: payload.name, to: stageLabel(key), from: stageLabel(payload.from) }) })
  }

  /** 行 / 列表上的投放：把手里的工具放进本阶段（池来的加回、别的阶段来的复制）。 */
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
    if (payload.from === phase) removeFromPhase(phase, payload.name)
  }

  // 头部阶段 Tab 上的投放：复制到那个阶段（换 Tab / 换模式时旧列表卸载、新
  // 列表注册 —— 任何时刻只有一个处理者）。
  useEffect(() => {
    setPhaseDropHandler((key, payload) => dropToolInto(key, payload))
    return () => setPhaseDropHandler(null)
  })

  const stageLabel = (key: PhaseViewKey): string =>
    key === 'bootstrap' ? t('phaseStageGuide') : key === 'compaction' ? t('phaseStageControlled') : t('phaseStageResident')

  // 当前阶段的行 + 三态过滤（已启用 = 对模型可见）。
  const rows = rowsOf(phase)
  const onCount = rows.filter((row) => !row.hidden).length
  const offCount = rows.length - onCount
  const rowVisible = (row: { hidden: boolean }): boolean =>
    filter === 'all' || (filter === 'on' ? !row.hidden : row.hidden)

  const renderRow = (row: { name: string; description: string; hidden: boolean; added: boolean }): ReactElement | null => {
    if (!rowVisible(row)) return null
    return h('div', {
      key: row.name,
      style: {
        ...s.row,
        ...(row.hidden ? s.rowBlocked : {}),
        ...(dropMark === row.name ? s.dropZoneActive : {}),
        ...(dragName === row.name ? s.dragging : {}),
      },
      title: row.description.slice(0, 120),
      onDragOver: (event: ReactDragEvent) => {
        if (!acceptsDrop(event, 'tool')) return
        event.preventDefault()
        event.stopPropagation()
        setDropMark(row.name)
      },
      onDrop: dropOnPane,
    }, [
      // 拖拽抓手：整行 draggable 会把勾选框的手势一起吃掉。
      h('span', {
        draggable: true,
        title: t('drag'),
        style: s.dragHandle,
        onDragStart: (event: ReactDragEvent) => {
          setDragName(row.name)
          beginDrag(event, { kind: 'tool', name: row.name, from: phase, hidden: row.hidden })
        },
        onDragEnd: () => { setDragName(null); setDropMark(null); finishDrag() },
      }, '⠿'),
      h('input', {
        type: 'checkbox',
        checked: !row.hidden,
        onChange: () => toggleHide(phase, row.name, row.hidden),
        title: row.hidden ? t('hiddenOn') : t('hiddenOff'),
        style: { margin: 0, cursor: 'pointer', flex: 'none' },
      }),
      h('div', { style: s.rowBody }, [
        h('div', { style: s.rowTitle }, [
          h('span', { style: s.code }, row.name),
          row.added ? h('span', { style: s.badgeCustom }, t('toolAddedTag')) : null,
          row.hidden ? h('span', { style: s.badgeBlocked }, t('hiddenOn')) : null,
        ]),
        row.description !== '' ? h('div', { style: s.preview }, row.description.slice(0, 120)) : null,
      ]),
    ])
  }

  const allTools = (inv?.tools ?? []).map((tool) => ({
    name: tool.name,
    description: typeof tool === 'string' ? '' : (tool.description ?? ''),
  }))

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
      // 本系统全部工具：注册表的完整目录，只读池。加入某个阶段靠拖拽：把行拖进
      // 上面的阶段列表 = 加入本阶段，拖到头部阶段 Tab = 加入那个阶段（行上不再
      // 放三个按钮 —— 拖拽是唯一路径，池同时是「从阶段拿掉」的投放点）。
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
          key: tool.name,
          style: { ...s.row, opacity: 0.92 },
          draggable: true,
          title: t('dragHint'),
          onDragStart: (event: ReactDragEvent) => beginDrag(event, { kind: 'tool', name: tool.name, from: 'pool' }),
          onDragEnd: finishDrag,
        }, [
          h('div', { style: s.rowBody }, [
            h('div', { style: s.rowTitle }, h('span', { style: s.code }, tool.name)),
            h('div', { style: s.preview }, tool.description.slice(0, 120)),
          ]),
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

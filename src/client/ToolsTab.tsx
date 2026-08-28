/** 工具 Tab：四个部分 —— 引导期 / 常驻期 / 压缩受控期（预设真实拥有的
 *  阶段，按 (提示词, 工具) 签名去重、按 引导→常驻→压缩受控 顺序展示）+
 *  本系统全部工具（只读池）。
 *  - 上三段每行 = 该阶段的模型可见目录（预过滤视图，隐藏后仍在列表可反选），
 *    勾选 = 该阶段可见 / 隐藏（写该阶段的 exclude）。
 *  - 全部工具 = 注册表原始目录（只读，无可见性修改），作为补充池。
 *  - 拖动：全部 → 上三段 = 加入该阶段 include（复制语义，出现勾选框）；
 *    上三段之间 = 复制（源保留）；上三段 → 全部 = 从该阶段移除。
 *  - 阶段部分只在真正的 agent 周期里存在时渲染（standard 等单形态预设
 *    只显示一个「常驻」部分 —— 折叠组写静态过滤）。 */
import { createElement as h, useState, type CSSProperties, type ReactElement, type DragEvent } from 'react'
import type { Config, CycleEntry, Inventory, PhaseViewKey, Preview } from './types.ts'
import type { Translate } from './locales.ts'
import { phaseConfigKey, cycleInDisplayOrder } from './presets.ts'
import { s } from './styles.ts'

/** Panel 并行拉取的三阶段装配（与 PreviewTab 同一形状）。 */
type PhaseViews = Record<PhaseViewKey, Preview | null>

/** 拖拽来源：全部池，或某个阶段部分。 */
type DragSource = { kind: 'all' } | { kind: 'part'; key: PhaseViewKey }

/** 某阶段过滤配置（{exclude, include}）：独立阶段写自身目录；折叠组/常驻期写静态。 */
interface FilterCfg { exclude: string[]; include: string[] }

export function ToolsTab({ cfg, inv, phases, cycle, t, write }: {
  cfg: Config
  inv: Inventory | null
  phases: PhaseViews | null
  /** 该预设真实拥有的阶段（agent 周期）：决定上三段是否渲染及其顺序。 */
  cycle: CycleEntry[] | null
  t: Translate
  write: (field: 'sections' | 'replace' | 'inject' | 'tools', value: unknown) => void
}): ReactElement {
  const [dragFrom, setDragFrom] = useState<DragSource | null>(null)
  const [draggedName, setDraggedName] = useState<string | null>(null)
  const [dropHint, setDropHint] = useState<string | null>(null)

  // 阶段部分：周期去重后的条目按 引导→常驻→压缩受控 展示；周期未就绪
  //（加载中）时回退三态名义部分，就绪后收敛为真实阶段。
  const parts: CycleEntry[] = cycle !== null
    ? cycleInDisplayOrder(cycle)
    : phases === null
      ? []
      : ([['bootstrap'], ['active'], ['compaction']] as PhaseViewKey[][]).map(([key]) => ({ key, merged: [key] }))

  // 某阶段部分的过滤配置与写回目标。
  const filterOf = (entry: CycleEntry): FilterCfg => {
    const target = phaseConfigKey(entry)
    const tools = cfg.tools ?? {}
    if (target === 'bootstrap') return { exclude: tools.bootstrap?.exclude ?? [], include: tools.bootstrap?.include ?? [] }
    if (target === 'compaction') return { exclude: tools.compaction?.exclude ?? [], include: tools.compaction?.include ?? [] }
    return { exclude: tools.exclude ?? [], include: tools.include ?? [] }
  }
  const setFilter = (entry: CycleEntry, next: FilterCfg): void => {
    const target = phaseConfigKey(entry)
    const tools = cfg.tools ?? {}
    if (target === 'bootstrap') {
      write('tools', { ...tools, bootstrap: { ...(tools.bootstrap ?? {}), exclude: next.exclude, include: next.include } })
    } else if (target === 'compaction') {
      write('tools', { ...tools, compaction: { ...(tools.compaction ?? {}), exclude: next.exclude, include: next.include } })
    } else {
      write('tools', { ...tools, exclude: next.exclude, include: next.include })
    }
  }

  // 阶段部分的可见行：该阶段模型可见目录（预过滤，含被隐藏项可反选）+ 拖入的 include 条目。
  const rowsOf = (entry: CycleEntry): Array<{ name: string; description: string; hidden: boolean }> => {
    const filter = filterOf(entry)
    const base = (phases?.[entry.key]?.baseTools ?? []).map((tool) => ({
      name: tool.name,
      description: tool.description ?? '',
      hidden: filter.exclude.includes(tool.name),
    }))
    const byName = new Map(base.map((row) => [row.name, row]))
    for (const name of filter.include ?? []) {
      if (!byName.has(name)) byName.set(name, { name, description: '', hidden: filter.exclude.includes(name) })
    }
    return [...byName.values()]
  }

  const toggleHide = (entry: CycleEntry, name: string, currentlyHidden: boolean): void => {
    const filter = filterOf(entry)
    const exclude = filter.exclude.slice()
    if (currentlyHidden) { const i = exclude.indexOf(name); if (i >= 0) exclude.splice(i, 1) }
    else if (!exclude.includes(name)) exclude.push(name)
    setFilter(entry, { ...filter, exclude })
  }

  // 加入一个部分（复制语义）：不进 exclude、进 include —— 拖入即可见并显示勾选框。
  const addToPart = (entry: CycleEntry, name: string): void => {
    const filter = filterOf(entry)
    setFilter(entry, {
      include: filter.include.includes(name) ? filter.include : [...filter.include, name],
      exclude: filter.exclude.filter((x) => x !== name),
    })
  }
  // 从部分移除（拖回全部池）：该阶段的名单与屏蔽都清掉。
  const removeFromPart = (entry: CycleEntry, name: string): void => {
    const filter = filterOf(entry)
    setFilter(entry, {
      include: filter.include.filter((x) => x !== name),
      exclude: filter.exclude.filter((x) => x !== name),
    })
  }

  // 某阶段模型可见数（与预览同源）：post/预过滤。
  const visibleCount = (entry: CycleEntry): string => {
    const preview = phases?.[entry.key]
    if (preview === undefined || preview === null) return '?'
    const pre = (preview.baseTools ?? []).length
    return `${preview.tools.length} / ${pre}`
  }

  const partNoun = (key: PhaseViewKey): string =>
    key === 'bootstrap' ? t('toolsPartGuide') : key === 'compaction' ? t('toolsPartControlled') : t('toolsPartResident')
  const partLabel = (entry: CycleEntry): string =>
    entry.merged.length > 1 ? t('phaseAlways') : partNoun(entry.key)

  // ── 拖拽 ──────────────────────────────────────────────────────────────────
  const startDrag = (e: DragEvent, from: DragSource, name: string): void => {
    setDragFrom(from)
    setDraggedName(name)
    e.dataTransfer.effectAllowed = 'copy'
    try { e.dataTransfer.setData('text/plain', name) } catch { /* ignore */ }
  }
  const zoneDragOver = (e: DragEvent, zone: string): void => {
    if (!dragFrom || !draggedName) return
    const same = zone === 'all' ? dragFrom.kind === 'all' : (dragFrom.kind === 'part' && dragFrom.key === zone.replace('part:', ''))
    if (zone === 'all' && dragFrom.kind === 'all') { e.preventDefault(); return }
    if (same) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setDropHint(zone)
  }
  const zoneDrop = (e: DragEvent, zone: string): void => {
    e.preventDefault()
    if (dragFrom && draggedName) {
      if (zone === 'all') {
        if (dragFrom.kind === 'part') removeFromPart(parts.find((p) => p.key === dragFrom.key)!, draggedName)
      } else {
        const dest = parts.find((p) => p.key === zone.replace('part:', ''))
        if (dest) addToPart(dest, draggedName)
      }
    }
    setDragFrom(null)
    setDraggedName(null)
    setDropHint(null)
  }
  const endDrag = (): void => { setDragFrom(null); setDraggedName(null); setDropHint(null) }
  const zoneStyle = (zone: string): CSSProperties | undefined =>
    dropHint === zone ? { outline: '2px dashed #7aa7ff', outlineOffset: 2 } : undefined

  const allTools = (inv?.tools ?? []).map((tool) => ({
    name: tool.name,
    description: typeof tool === 'string' ? '' : (tool.description ?? ''),
  }))

  const renderPhasePart = (entry: CycleEntry): ReactElement => {
    const rows = rowsOf(entry)
    const zoneKey = `part:${entry.key}`
    return h('div', {
      key: entry.key,
      style: s.injectBox,
      onDragOver: (e: DragEvent) => zoneDragOver(e, zoneKey),
      onDrop: (e: DragEvent) => zoneDrop(e, zoneKey),
      ...(zoneStyle(zoneKey) ?? {}),
    }, [
      h('div', { style: s.rowTitle }, [
        h('span', null, partLabel(entry)),
        h('span', { style: s.orderTag }, `${t('phaseVisible')} ${visibleCount(entry)}`),
        rows.length === 0 ? h('span', { style: s.muted }, t('dragHint')) : null,
      ]),
      h('div', { style: s.toolWrap }, rows.map((row) => h('span', {
        key: row.name,
        style: { ...s.toolChip, cursor: 'move', display: 'inline-flex', alignItems: 'center', gap: 4 },
        title: row.description.slice(0, 120),
        draggable: true,
        onDragStart: (e: DragEvent) => startDrag(e, { kind: 'part', key: entry.key }, row.name),
        onDragEnd: endDrag,
      }, [
        h('input', {
          type: 'checkbox',
          checked: !row.hidden,
          onChange: () => toggleHide(entry, row.name, row.hidden),
          style: { margin: 0, cursor: 'pointer' },
        }),
        h('span', { style: row.hidden ? s.badgeBlocked : s.badgeOk }, row.name),
      ]))),
    ])
  }

  return h('div', {}, [
    h('div', { style: s.muted }, t('toolsFourHint')),
    parts.map(renderPhasePart),
    // 全部工具：本系统注册表的完整目录，只读池（不可勾选，供拖入三个阶段）。
    h('div', {
      style: s.injectBox,
      onDragOver: (e: DragEvent) => zoneDragOver(e, 'all'),
      onDrop: (e: DragEvent) => zoneDrop(e, 'all'),
      ...(zoneStyle('all') ?? {}),
    }, [
      h('div', { style: s.rowTitle }, [t('allToolsTitle'), h('span', { style: s.orderTag }, `${allTools.length}`)]),
      allTools.length === 0 ? h('div', { style: s.muted }, t('empty')) : null,
      h('div', { style: s.toolWrap }, allTools.map((tool) => h('span', {
        key: tool.name,
        style: { ...s.toolChip, cursor: 'copy' },
        title: tool.description.slice(0, 120),
        draggable: true,
        onDragStart: (e: DragEvent) => startDrag(e, { kind: 'all' }, tool.name),
        onDragEnd: endDrag,
      }, tool.name))),
    ]),
  ])
}
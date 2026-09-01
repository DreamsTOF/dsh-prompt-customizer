/** 工具 Tab：四个部分 —— 引导期 / 常驻期 / 压缩受控期（三个阶段恒定显示，
 *  预设没有某个阶段时该部分只是空的）+ 本系统全部工具（只读池）。
 *  - 上三段每行 = 该阶段进入过滤的目录 ∪ 用户加回的工具（预过滤视图，隐藏后
 *    仍在列表可反选），勾选 = 该阶段可见 / 隐藏。三份名单互不继承。
 *  - 「加回」：被该阶段默认裁掉、但仍在当前预设注册表里的工具，可以拖进来重新
 *    出现（写该阶段的 add 名单，装配时从注册表查回 schema 追加）。注册表里根本
 *    没有的（别的预设独有）加不进来，界面明确说明。
 *  - 全部工具 = 跨预设累积的注册表并集（只读池），每行标出该工具在三个阶段的
 *    状态；它按定义比任何单一预设都大，所以里面的工具完全可能不在当前预设注册表。
 *  - 拖动：全部 → 某阶段 = 让该工具在这一阶段出现；阶段 → 阶段 = 搬移（源阶段
 *    隐藏 + 目标阶段显示）；上三段 → 全部 = 在该阶段隐藏它。
 *  - 只有黑名单，没有白名单：每个动作只作用于被拖 / 被点的那一个工具，绝不
 *    因为「拖进了一个工具」而把该阶段其它工具一起关掉。
 *  - 「三态同步」勾选（默认关）：勾选 / 取消勾选对三个阶段一起生效，只作用
 *    于同名的那一个工具；拖拽仍按复制 / 搬移语义只动涉及的阶段。 */
import { createElement as h, useState, type CSSProperties, type ReactElement, type DragEvent } from 'react'
import type { Config, Inventory, PhaseViewKey, Preview } from './types.ts'
import type { Translate } from './locales.ts'
import { PART_ORDER, isToolHidden, withPhaseAdd, withPhaseExclude } from './presets.ts'
import { s } from './styles.ts'

/** Panel 并行拉取的三阶段装配（与 PreviewTab 同一形状）。 */
type PhaseViews = Record<PhaseViewKey, Preview | null>

/** 拖拽来源：全部池，或某个阶段部分。 */
type DragSource = { kind: 'all' } | { kind: 'part'; key: PhaseViewKey }

/** 一次拖放的反馈（ok = 已写入，warn = 什么都没改并说明原因）。 */
type Notice = { kind: 'ok' | 'warn'; text: string }

export function ToolsTab({ cfg, inv, phases, syncAll, t, write }: {
  cfg: Config
  inv: Inventory | null
  phases: PhaseViews | null
  /** 三态同步（默认关）：勾选后隐藏 / 显示对三个阶段一起生效（只作用于同名工具）。 */
  syncAll?: boolean
  t: Translate
  write: (field: 'sections' | 'replace' | 'inject' | 'tools', value: unknown) => void
}): ReactElement {
  const [dragFrom, setDragFrom] = useState<DragSource | null>(null)
  const [draggedName, setDraggedName] = useState<string | null>(null)
  const [dropHint, setDropHint] = useState<string | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)

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
  // 一次写入同时落该阶段的 exclude 与 add（在同一份 tools 上叠完再写一次，
  // 分两次写会各自基于旧 cfg 计算而互相覆盖）。
  const writeLists = (key: PhaseViewKey, exclude: string[], add: string[]): void => {
    write('tools', withPhaseAdd(withPhaseExclude(cfg.tools ?? {}, key, exclude), key, add))
  }

  // 该阶段的装配目录（进入本插件过滤的工具原文）与该预设注册表（能加回的来源）。
  const catalogOf = (key: PhaseViewKey): string[] => (phases?.[key]?.baseTools ?? []).map((tool) => tool.name)
  const isInCatalog = (key: PhaseViewKey, name: string): boolean => catalogOf(key).includes(name)
  // 注册表三个阶段共享同一 scope，取第一个非空的即可。
  const registry: Set<string> = (() => {
    const list = PART_ORDER.map((key) => phases?.[key]?.registryTools).find((x) => Array.isArray(x) && x.length > 0) ?? []
    return new Set(list)
  })()
  const isInRegistry = (name: string): boolean => registry.has(name)

  // 该工具在某阶段是否「在场」（在目录里且没被隐藏，或已加回）。
  const presentIn = (key: PhaseViewKey, name: string): boolean =>
    addOf(key).includes(name) || (isInCatalog(key, name) && !excludeOf(key).includes(name))

  // 把一个工具放进某阶段（复制语义，绝不改动其它阶段）：不在该阶段目录里就加进
  // add 名单；`hidden` 决定它在目标阶段是可见还是隐藏（拖拽时继承源阶段的状态）。
  const addToPhase = (key: PhaseViewKey, name: string, hidden: boolean): void => {
    let exclude = excludeOf(key)
    let add = addOf(key)
    if (!isInCatalog(key, name) && !add.includes(name)) add = [...add, name]
    exclude = hidden
      ? (exclude.includes(name) ? exclude : [...exclude, name])
      : exclude.filter((x) => x !== name)
    writeLists(key, exclude, add)
  }

  // 阶段部分里的行 = 该阶段进入过滤的目录 ∪ 已加回（但尚未出现在装配里）的工具。
  const rowsOf = (key: PhaseViewKey): Array<{ name: string; description: string; hidden: boolean; added: boolean }> => {
    const filter = { exclude: excludeOf(key) }
    const catalog = (phases?.[key]?.baseTools ?? []).map((tool) => ({
      name: tool.name,
      description: tool.description ?? '',
      hidden: isToolHidden(tool.name, filter),
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
      // 三态同步（可选）：对三个阶段各自的名单做同一个可见性翻转 —— 只作用
      // 于同名的这一个工具。必须在一份 tools 上把三个阶段叠完再写一次：
      // edit 对同一字段是整体替换，逐阶段各写一次会互相覆盖只留下最后一次。
      let tools = cfg.tools
      for (const k of PART_ORDER) {
        const add = addOf(k)
        const exclude = excludeOf(k)
        if (currentlyHidden) {
          // 显示：只从该阶段 exclude 移除，绝不顺手把没加回的工具加进 add。
          tools = withPhaseExclude(tools, k, exclude.filter((x) => x !== name))
        } else if (add.includes(name)) {
          // 隐藏：已加回的撤销加回。
          tools = withPhaseAdd(tools, k, add.filter((x) => x !== name))
        } else if (!exclude.includes(name)) {
          // 隐藏：原生的进该阶段 exclude。
          tools = withPhaseExclude(tools, k, [...exclude, name])
        }
      }
      write('tools', tools)
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

  const phaseNoun = (key: PhaseViewKey): string =>
    key === 'bootstrap' ? t('phaseStageGuide') : key === 'compaction' ? t('phaseStageControlled') : t('phaseStageResident')

  // 拖到阶段部分 = 复制：目标阶段多一份，源阶段原样不动；隐藏状态跟着走
  //（源阶段是禁用的，复制过去也是禁用，启用同理）。
  const dropOnPart = (dest: PhaseViewKey, name: string, from: DragSource): void => {
    if (!isInCatalog(dest, name) && !isInRegistry(name)) {
      setNotice({ kind: 'warn', text: t('toolNotInRegistry', { name }) })
      return
    }
    const copied = from.kind === 'part' && from.key !== dest
    const hidden = copied ? excludeOf(from.key).includes(name) : false
    addToPhase(dest, name, hidden)
    setNotice({
      kind: 'ok',
      text: copied
        ? t('toolCopied', { name, from: phaseNoun(from.key), to: phaseNoun(dest) })
        : isInCatalog(dest, name)
          ? t('toolShown', { name, to: phaseNoun(dest) })
          : t('toolAdded', { name, phase: phaseNoun(dest) }),
    })
  }

  // 拖回「全部」池 = 把它从来源那个阶段拿掉：加回的工具撤销加回，原生工具隐藏。
  const dropOnAll = (name: string, from: DragSource): void => {
    if (from.kind !== 'part') return
    const key = from.key
    let exclude = excludeOf(key)
    let add = addOf(key)
    if (add.includes(name)) {
      add = add.filter((x) => x !== name)
    } else if (!exclude.includes(name)) {
      exclude = [...exclude, name]
    }
    writeLists(key, exclude, add)
    setNotice({ kind: 'ok', text: t('toolHiddenIn', { name, to: phaseNoun(key) }) })
  }

  // 某阶段的「启用 / 总数」：本部分列出的行里有多少对模型可见。
  // 模型视角的真实目录数看预览 Tab —— 装配本身没给出、又没加回的工具不会进模型。
  const visibleCount = (key: PhaseViewKey): string => {
    const rows = rowsOf(key)
    return `${rows.filter((row) => !row.hidden).length} / ${rows.length}`
  }

  const partNoun = (key: PhaseViewKey): string =>
    key === 'bootstrap' ? t('toolsPartGuide') : key === 'compaction' ? t('toolsPartControlled') : t('toolsPartResident')

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
      if (zone === 'all') dropOnAll(draggedName, dragFrom)
      else {
        const dest = zone.replace('part:', '') as PhaseViewKey
        if (PART_ORDER.includes(dest)) dropOnPart(dest, draggedName, dragFrom)
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

  // 池行上的三阶段状态标记（引 / 常 / 压）：绿 = 可见或已加回，灰 = 已隐藏，暗 = 不在。
  const markStyle = (key: PhaseViewKey, name: string): CSSProperties => {
    if (presentIn(key, name)) return { ...s.badgeOk, padding: '0 3px' }
    if (isInCatalog(key, name)) return { ...s.badgeBlocked, padding: '0 3px' }
    return { ...s.muted, opacity: 0.45, padding: '0 3px' }
  }
  const markKey = (key: PhaseViewKey): string =>
    key === 'bootstrap' ? 'phaseShortGuide' : key === 'active' ? 'phaseShortResident' : 'phaseShortControlled'

  const renderPhasePart = (key: PhaseViewKey): ReactElement => {
    const rows = rowsOf(key)
    const zoneKey = `part:${key}`
    return h('div', {
      key: zoneKey,
      style: s.injectBox,
      onDragOver: (e: DragEvent) => zoneDragOver(e, zoneKey),
      onDrop: (e: DragEvent) => zoneDrop(e, zoneKey),
      ...(zoneStyle(zoneKey) ?? {}),
    }, [
      h('div', { style: s.rowTitle }, [
        h('span', null, partNoun(key)),
        h('span', { style: s.orderTag }, `${t('phaseVisible')} ${visibleCount(key)}`),
        rows.length === 0 ? h('span', { style: s.muted }, t('dragHint')) : null,
      ]),
      h('div', { style: s.toolWrap }, rows.map((row) => h('span', {
        key: row.name,
        style: { ...s.toolChip, cursor: 'move', display: 'inline-flex', alignItems: 'center', gap: 4 },
        title: row.description.slice(0, 120),
        draggable: true,
        onDragStart: (e: DragEvent) => startDrag(e, { kind: 'part', key }, row.name),
        onDragEnd: endDrag,
      }, [
        h('input', {
          type: 'checkbox',
          checked: !row.hidden,
          onChange: () => toggleHide(key, row.name, row.hidden),
          style: { margin: 0, cursor: 'pointer' },
        }),
        h('span', { style: row.hidden ? s.badgeBlocked : s.badgeOk }, row.name),
      ]))),
    ])
  }

  return h('div', {}, [
    h('div', { style: s.muted }, t('toolsFourHint')),
    notice ? h('div', { style: notice.kind === 'ok' ? s.noticeOk : s.noticeWarn }, notice.text) : null,
    PART_ORDER.map(renderPhasePart),
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

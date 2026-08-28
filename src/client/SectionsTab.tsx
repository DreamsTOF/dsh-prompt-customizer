/** 提示词段 Tab：四个部分 —— 引导期 / 常驻期 / 压缩受控期（预设真实拥有的
 *  阶段，按 (提示词, 工具) 签名去重、按 引导→常驻→压缩受控 顺序展示）+
 *  本系统全部提示词（只读池）。
 *
 *  交互对齐提示词段初版（v1），并修复三类反馈缺失：
 *  - 上三段每行 = 该阶段装配里的段（post 视图，与预览同源）+ 草稿序叠加；
 *    整行可拖拽，拖到某行上方/下方出现插入指示线，松手即在该位置重排。
 *  - 屏蔽勾选/徽标直接绑定当前生效名单（deniedNames = 全局 + 该阶段名单，
 *    含未保存草稿）—— 点击立即反馈，不再"点不动"；已屏蔽条同步可恢复。
 *  - 重排（拖入/箭头）走 `persistPhase`：把该阶段全部行重写为连续整数
 *    虚拟 order（系统段写空文本 = 仅 order 覆盖，服务端保留原文；custom 段
 *    保留文本）—— UI 行序叠加同一份 order 立即重排，拖动即时可见。
 *  - 拖放事件在行上处理并 stopPropagation，避免与阶段框二次处理对冲。
 *  - 全部提示词 → 上三段：插入该段到目标位置（已存在则只是移动排序；该段
 *    在目标阶段被屏蔽则同步解除屏蔽）；上三段 → 全部：从该阶段移除。
 *
 *  全部阶段状态逻辑来自 lib/sectionOps.mjs（纯函数，node --test 单测直接
 *  覆盖同一份代码）。
 */
import { createElement as h, useState, type CSSProperties, type ReactElement, type DragEvent, type ChangeEvent } from 'react'
import type { Config, CycleEntry, Inventory, Phase, PhaseViewKey, Preview } from './types.ts'
import type { Translate } from './locales.ts'
import { cycleInDisplayOrder } from './presets.ts'
import { sectionListOf, injectPhaseOf, acceptsInjectFor, deniedNames, blockPatch, reorderInsert, phaseInjectEntries } from '../../lib/sectionOps.mjs'
import { s } from './styles.ts'

/** Panel 并行拉取的三阶段装配（与 PreviewTab 同一形状）。 */
type PhaseViews = Record<PhaseViewKey, Preview | null>

/** 屏幕上一条可交互的段行。 */
interface PartRow {
  name: string
  text: string
  replaced: boolean
  custom: boolean
}

/** 拖拽来源：全部池，或某个阶段部分（copy 语义，携带源的文本）。 */
interface DragSource {
  kind: 'all' | 'part'
  key?: PhaseViewKey
  text: string
}

export function SectionsTab({ cfg, inv, phases, cycle, t, write }: {
  cfg: Config
  inv: Inventory | null
  phases: PhaseViews | null
  /** 该预设真实拥有的阶段（agent 周期）：决定上三段是否渲染及其顺序。 */
  cycle: CycleEntry[] | null
  t: Translate
  write: (field: 'sections' | 'sectionsBootstrap' | 'sectionsCompaction' | 'replace' | 'inject' | 'tools', value: unknown) => void
}): ReactElement {
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [dragName, setDragName] = useState<string | null>(null)
  const [dragSource, setDragSource] = useState<DragSource | null>(null)
  const [dropTarget, setDropTarget] = useState<{ part: PhaseViewKey; name: string; pos: 'above' | 'below' } | null>(null)

  // 阶段部分：周期去重后的条目按 引导→常驻→压缩受控 展示；周期未就绪
  //（加载中）时回退三态名义部分，就绪后收敛为真实阶段。
  const parts: CycleEntry[] = cycle !== null
    ? cycleInDisplayOrder(cycle)
    : phases === null
      ? []
      : ([['bootstrap'], ['active'], ['compaction']] as PhaseViewKey[][]).map(([key]) => ({ key, merged: [key] }))

  // 一个阶段部分的全部行：可见 = 该阶段装配的最终段（post 视图，与预览
  // 同源），再叠加「该阶段的注入 order」重排 —— 未保存的重排草稿立即反映
  // 到界面；已屏蔽 = 该阶段名单里的段（单独挂一条供恢复）。
  // 注意：绝不依据配置凭空新增行（历史空文本注入不会污染可见列表）。
  const rowsOf = (entry: CycleEntry): { visible: PartRow[]; blocked: string[] } => {
    const replace = cfg.replace ?? {}
    const phase = injectPhaseOf(entry)
    const byName = new Map<string, PartRow>()
    const phaseOrder = new Map<string, number>()
    for (const item of cfg.inject ?? []) {
      if ((item.phase ?? 'always') === phase) phaseOrder.set(item.name, item.order ?? 0)
    }
    for (const sec of phases?.[entry.key]?.sections ?? []) {
      byName.set(sec.name, { name: sec.name, text: sec.text ?? '', replaced: Object.hasOwn(replace, sec.name), custom: false })
    }
    // 覆盖标记：post 中的注入段标为 custom（可删除），文本以注入为准。
    for (const item of cfg.inject ?? []) {
      if (!acceptsInjectFor(entry, item.phase ?? 'always')) continue
      const existing = byName.get(item.name)
      if (existing !== undefined && (item.custom === true || item.text)) {
        byName.set(item.name, { ...existing, text: item.text ?? existing.text, custom: existing.custom || item.custom === true })
      }
    }
    const visible = [...byName.values()]
    // 草稿序叠加：该阶段有注入 order 就按它重排当前行（未保存的拖动/箭头
    // 立即生效）；无 order 的行走 post 原始相对序（稳定排序）。
    if (phaseOrder.size > 0) {
      const postIndex = new Map(visible.map((row, i) => [row.name, i] as const))
      visible.sort((a, b) => (phaseOrder.get(a.name) ?? postIndex.get(a.name) ?? 0) - (phaseOrder.get(b.name) ?? postIndex.get(b.name) ?? 0))
    }
    const blocked = deniedNames(cfg, entry).filter((name) => !byName.has(name))
    return { visible, blocked }
  }

  const applyBlock = (entry: CycleEntry, name: string, blocked: boolean): void => {
    const patch = blockPatch(cfg, entry, name, blocked)
    for (const [field, value] of Object.entries(patch)) write(field as 'sections' | 'sectionsBootstrap' | 'sectionsCompaction', value)
  }
  const toggleBlocked = (entry: CycleEntry, name: string): void =>
    applyBlock(entry, name, !deniedNames(cfg, entry).includes(name))

  // 该阶段中某名字是否在该阶段的装配输入里（决定拖入走「仅排序 / 解除屏蔽」
  // 还是「复制文本」路径）。
  const inBaseOf = (entry: CycleEntry, name: string): boolean =>
    (phases?.[entry.key]?.baseSections ?? []).some((sec) => sec.name === name)

  // 持久化一个阶段的有序列表（写回 inject）：该阶段每行一条注入项、order 为
  // 连续整数；系统行空文本（仅 order 覆盖），custom 行保留文本；其它阶段
  //（含 always）的注入项原样保留。
  const persistPhase = (entry: CycleEntry, rows: PartRow[]): void => {
    write('inject', phaseInjectEntries(cfg, entry, rows))
  }

  // 上移/下移一格（数组交换后重排整个阶段）。
  const moveRow = (entry: CycleEntry, index: number, dir: -1 | 1): void => {
    const rows = rowsOf(entry).visible
    const target = index + dir
    if (target < 0 || target >= rows.length) return
    const next = rows.slice()
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    persistPhase(entry, next)
  }

  const removeFromPart = (entry: CycleEntry, name: string): void => {
    const phase = injectPhaseOf(entry)
    const inject = (cfg.inject ?? []).filter((x) => !(x.name === name && (x.phase ?? 'always') === phase))
    write('inject', inject)
    applyBlock(entry, name, false)
  }

  const startReplace = (name: string, original: string): void => { setEditing(name); setDraft(original) }
  const commitReplace = (name: string): void => {
    const next = { ...(cfg.replace ?? {}) }
    if (draft.trim() === '') delete next[name]
    else next[name] = draft
    write('replace', next)
    setEditing(null)
  }
  const restoreReplace = (name: string): void => {
    const next = { ...(cfg.replace ?? {}) }
    delete next[name]
    write('replace', next)
  }

  const addSection = (name: string, text: string, phase: Phase): void => {
    const inject = (cfg.inject ?? []).slice()
    inject.push({ name, order: 120 + inject.length, text, phase, custom: true })
    write('inject', inject)
  }

  // ── 拖拽（v1 语义：整行拖拽 + 上/下插入指示） ─────────────────────────────
  const startDrag = (e: DragEvent, name: string, source: DragSource): void => {
    setDragName(name)
    setDragSource(source)
    e.dataTransfer.effectAllowed = 'move'
    try { e.dataTransfer.setData('text/plain', name) } catch { /* ignore */ }
  }
  const rowDragOver = (e: DragEvent, entry: CycleEntry, name: string): void => {
    if (!dragName || dragName === name) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const rect = e.currentTarget.getBoundingClientRect()
    const pos = e.clientY < rect.top + rect.height / 2 ? 'above' : 'below'
    setDropTarget({ part: entry.key, name, pos })
  }
  // 拖入/重排：把 dragName 插入到目标行上/下方（已存在则移动位置）。
  const insertInto = (entry: CycleEntry, targetName: string, pos: 'above' | 'below'): void => {
    if (!dragName) return
    const rows = rowsOf(entry).visible
    const newRow: PartRow | null = dragSource?.kind === 'part'
      ? { name: dragName, text: dragSource.text ?? '', replaced: Object.hasOwn(cfg.replace ?? {}, dragName), custom: true }
      : null
    const next = reorderInsert(rows, dragName, targetName, pos, newRow)
    if (next === null) return
    // 从全部池拖入一个被本阶段屏蔽的系统段：解除该阶段屏蔽，否则装配仍会过滤。
    if (dragSource?.kind === 'all' && inBaseOf(entry, dragName) && deniedNames(cfg, entry).includes(dragName)) {
      applyBlock(entry, dragName, false)
    }
    persistPhase(entry, next)
  }
  const rowDrop = (e: DragEvent, entry: CycleEntry, name: string): void => {
    e.preventDefault()
    e.stopPropagation() // 避免继续冒泡到阶段框的 append 逻辑（防双份）
    if (dragName && dragName !== name) {
      const pos = dropTarget?.part === entry.key && dropTarget.name === name && dropTarget.pos ? dropTarget.pos : 'below'
      insertInto(entry, name, pos)
    }
    setDragName(null); setDragSource(null); setDropTarget(null)
  }
  const partDropEnd = (e: DragEvent, entry: CycleEntry): void => {
    // 拖到阶段部分空白处 = 追加到末尾。
    e.preventDefault()
    if (dragName) {
      const rows = rowsOf(entry).visible
      const newRow: PartRow | null = dragSource?.kind === 'part'
        ? { name: dragName, text: dragSource.text ?? '', replaced: Object.hasOwn(cfg.replace ?? {}, dragName), custom: true }
        : null
      const base = rows.filter((row) => row.name !== dragName)
      base.push(newRow ?? rows.find((row) => row.name === dragName) ?? { name: dragName, text: '', replaced: false, custom: false })
      if (dragSource?.kind === 'all' && inBaseOf(entry, dragName) && deniedNames(cfg, entry).includes(dragName)) {
        applyBlock(entry, dragName, false)
      }
      persistPhase(entry, base)
    }
    setDragName(null); setDragSource(null); setDropTarget(null)
  }
  const allBoxDrop = (e: DragEvent): void => {
    e.preventDefault()
    if (dragName && dragSource?.kind === 'part' && dragSource.key) {
      const src = parts.find((p) => p.key === dragSource.key)
      if (src) removeFromPart(src, dragName)
    }
    setDragName(null); setDragSource(null); setDropTarget(null)
  }
  const endDrag = (): void => { setDragName(null); setDragSource(null); setDropTarget(null) }

  const partNoun = (key: PhaseViewKey): string =>
    key === 'bootstrap' ? t('sectionsPartGuide') : key === 'compaction' ? t('sectionsPartControlled') : t('sectionsPartResident')
  const partLabel = (entry: CycleEntry): string =>
    entry.merged.length > 1 ? t('phaseAlways') : partNoun(entry.key)

  const renderRow = (entry: CycleEntry, row: PartRow, index: number, total: number): ReactElement => {
    const blocked = deniedNames(cfg, entry).includes(row.name)
    const isDragging = dragName === row.name
    const isDropTarget = dropTarget?.part === entry.key && dropTarget.name === row.name
    const rowStyle: CSSProperties = {
      ...s.row,
      ...(isDragging ? s.rowDragging : {}),
      ...(isDropTarget && dropTarget && dropTarget.pos === 'above' ? s.rowDropAbove : {}),
      ...(isDropTarget && dropTarget && dropTarget.pos === 'below' ? s.rowDropBelow : {}),
      cursor: 'move',
    }
    return h('div', {
      key: row.name,
      style: rowStyle,
      draggable: true,
      onDragStart: (e: DragEvent) => startDrag(e, row.name, { kind: 'part', key: entry.key, text: row.custom ? row.text : '' }),
      onDragOver: (e: DragEvent) => rowDragOver(e, entry, row.name),
      onDrop: (e: DragEvent) => rowDrop(e, entry, row.name),
      onDragEnd: endDrag,
    }, [
      h('span', { style: s.dragHandle, title: t('drag') }, '⠿'),
      h('label', { style: s.switchWrap }, [
        h('input', { type: 'checkbox', checked: blocked, onChange: () => toggleBlocked(entry, row.name) }),
        h('span', { style: blocked ? s.badgeBlocked : s.badgeOk }, blocked ? t('blockedOn') : t('blockedOff')),
      ]),
      h('div', { style: s.rowBody }, [
        h('div', { style: s.rowTitle }, [
          h('span', { style: s.code }, row.name),
          h('span', { style: s.orderTag }, '#' + index),
          h('span', { style: row.custom ? s.badgeCustom : s.badgeSystem }, row.custom ? t('manual') : t('system')),
          row.replaced ? h('span', { style: s.badgeReplaced }, t('replaced')) : null,
        ]),
        isEditing(row)
          ? h('div', { style: s.editBox }, [
              h('textarea', { style: s.editInput, value: draft, onChange: (e: ChangeEvent<HTMLTextAreaElement>) => setDraft(e.target.value), rows: 3 }),
              h('div', { style: s.injectRow }, [
                h('button', { style: s.mini, onClick: () => commitReplace(row.name) }, t('save')),
                h('button', { style: s.mini, onClick: () => setEditing(null) }, t('clearInput')),
                !row.custom && (cfg.replace ?? {})[row.name] ? h('button', { style: s.mini, onClick: () => restoreReplace(row.name) }, t('restore')) : null,
              ]),
            ])
          : h('div', { style: s.preview }, String(row.text ?? '').slice(0, 140) || (row.custom ? t('empty') : t('dynamic'))),
      ]),
      h('div', { style: s.arrowCol }, [
        h('button', { style: s.arrow, disabled: index === 0, onClick: () => moveRow(entry, index, -1), title: t('moveUp') }, '↑'),
        h('button', { style: s.arrow, disabled: index === total - 1, onClick: () => moveRow(entry, index, 1), title: t('moveDown') }, '↓'),
      ]),
      isEditing(row) ? null : h('button', { style: s.mini, onClick: () => startReplace(row.name, String(row.text ?? '')) }, t('replace')),
      !isEditing(row) && !row.custom && (cfg.replace ?? {})[row.name] ? h('button', { style: s.mini, onClick: () => restoreReplace(row.name) }, t('restore')) : null,
      row.custom ? h('button', { style: s.mini, onClick: () => removeFromPart(entry, row.name), title: t('delete') }, t('delete')) : null,
    ])
  }
  const isEditing = (row: PartRow): boolean => editing === row.name

  // 一个阶段部分：标题 + 可见行（整行拖拽/箭头/序号）+ 已屏蔽条 + 注入表单。
  const renderPart = (entry: CycleEntry): ReactElement => {
    const { visible, blocked } = rowsOf(entry)
    return h('div', {
      key: entry.key,
      style: s.injectBox,
      onDragOver: (e: DragEvent) => { if (dragName) { e.preventDefault(); e.dataTransfer.dropEffect = 'move' } },
      onDrop: (e: DragEvent) => partDropEnd(e, entry),
    }, [
      h('div', { style: s.rowTitle }, [
        h('span', null, partLabel(entry)),
        h('span', { style: s.orderTag }, `${t('phaseVisible')} ${visible.length}`),
      ]),
      visible.map((row, i) => renderRow(entry, row, i, visible.length)),
      blocked.length > 0
        ? [
            h('div', { style: { ...s.groupTitle, marginTop: 6 } }, [
              h('span', { style: s.badgeBlocked }, `${t('blockedOn')} ${blocked.length}`),
              h('span', { style: s.muted }, t('sectionBlockedStrip')),
            ]),
            blocked.map((name) => h('div', {
              key: name,
              style: { ...s.row, opacity: 0.75 },
            }, [
              h('span', { style: s.dragHandle }, '⠿'),
              h('div', { style: s.rowBody }, [
                h('div', { style: s.rowTitle }, [
                  h('span', { style: s.code }, name),
                  h('span', { style: s.badgeBlocked }, t('blockedOn')),
                ]),
                h('div', { style: s.preview }, t('dynamic')),
              ]),
              h('button', { style: s.mini, onClick: () => applyBlock(entry, name, false) }, t('restore')),
            ])),
          ]
        : null,
      h(InjectForm, { onAdd: (name, text) => addSection(name, text, injectPhaseOf(entry)), lockedPhase: injectPhaseOf(entry), t }),
    ])
  }

  return h('div', { style: s.list }, [
    parts.map(renderPart),
    h('div', {
      style: s.injectBox,
      onDragOver: (e: DragEvent) => { if (dragName) { e.preventDefault(); e.dataTransfer.dropEffect = 'move' } },
      onDrop: allBoxDrop,
    }, [
      h('div', { style: s.rowTitle }, [t('allSectionsTitle'), h('span', { style: s.orderTag }, `${(inv?.sections ?? []).length}`)]),
      (inv?.sections ?? []).length === 0 ? h('div', { style: s.muted }, t('empty')) : null,
      (inv?.sections ?? []).map((sec) => h('div', {
        key: sec.name,
        style: { ...s.row, cursor: 'copy', opacity: 0.92 },
        draggable: true,
        onDragStart: (e: DragEvent) => startDrag(e, sec.name, { kind: 'all', text: (sec.text ?? '').startsWith('<') || !sec.text ? '' : sec.text }),
        onDragEnd: endDrag,
      }, [
        h('div', { style: s.rowBody }, [
          h('div', { style: s.rowTitle }, h('span', { style: s.code }, sec.name)),
          h('div', { style: s.preview }, String(sec.text ?? '').slice(0, 140) || t('dynamic')),
        ]),
      ])),
    ]),
  ])
}

/** 注入新段表单：阶段部分内联形态，阶段锁定为所在部分。 */
function InjectForm({ onAdd, lockedPhase, t }: {
  onAdd: (name: string, text: string) => void
  lockedPhase: Phase
  t: Translate
}): ReactElement {
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const submit = (): void => {
    if (!name.trim()) return
    onAdd(name.trim(), text)
    setName(''); setText('')
  }
  const phaseLabel = lockedPhase === 'always' ? t('phaseAlways')
    : lockedPhase === 'bootstrap' ? t('phaseStageGuide')
    : lockedPhase === 'compaction' ? t('phaseStageControlled')
    : t('phaseStageResident')
  return h('div', { style: s.injectRow }, [
    h('input', { style: { ...s.input, width: '22%' }, placeholder: t('name'), value: name, onChange: (e: ChangeEvent<HTMLInputElement>) => setName(e.target.value) }),
    h('input', { style: { ...s.input, flex: 1 }, placeholder: `${t('text')}（${phaseLabel}）`, value: text, onChange: (e: ChangeEvent<HTMLInputElement>) => setText(e.target.value) }),
    h('button', { style: s.mini, onClick: submit }, t('add')),
  ])
}
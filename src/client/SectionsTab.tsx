/** 提示词段 Tab：屏蔽 / 替换 / 注入 / 重排提示词段。 */
import { createElement as h, useState, type ReactElement, type DragEvent, type ChangeEvent } from 'react'
import type { Config, Inventory, SettingsScope } from './types.ts'
import type { Translate } from './locales.ts'
import { mergeSections, removeSection, type Section } from './presets.ts'
import { s } from './styles.ts'

/** 提示词段 Tab：每行一个段，支持屏蔽、编辑替换文本、拖拽/箭头排序与删除。 */
export function SectionsTab({ cfg, inv, scope, t }: { cfg: Config; inv: Inventory | null; scope: SettingsScope; t: Translate }): ReactElement {
  const replace = cfg.replace ?? {}
  const blockedNames = new Set(cfg.sections ?? [])
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [dragName, setDragName] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<{ name: string; pos: 'above' | 'below' } | null>(null)

  // 合并清单段与用户注入段，按 order 排序。
  // 原提示词中不存在的注入段也会出现在这里，按其 order 值定位。
  const merged: Section[] = mergeSections(inv, cfg, blockedNames)

  const toggleBlock = (name: string, currentlyBlocked: boolean): void => {
    const list = (cfg.sections ?? []).slice()
    if (currentlyBlocked) { const i = list.indexOf(name); if (i >= 0) list.splice(i, 1) }
    else list.push(name)
    scope.set('sections', list)
  }
  const startReplace = (name: string, original: string): void => {
    // 回显「原始」提示词文本，让用户从当前值开始编辑。
    setEditing(name)
    setDraft(replace[name] ?? original)
  }
  const commitReplace = (name: string): void => {
    const next = { ...replace }
    if (draft.trim() === '') delete next[name]
    else next[name] = draft
    scope.set('replace', next)
    setEditing(null)
  }
  const restoreReplace = (name: string): void => {
    const next = { ...replace }
    delete next[name]
    scope.set('replace', next)
  }

  // 持久化完整有序列表（system + custom）。每个段都重新编号为连续整数
  // （0, 1, 2, …），面板上的顺序即最终排序依据。system 段保留空文本
  // （服务端因此不会冻结其动态生成的内容）；custom 段保留自己的文本。
  const persistOrder = (ordered: Section[]): void => {
    const list = ordered.map((sec, i) => {
      const existing = (cfg.inject ?? []).find((x) => x.name === sec.name)
      const isCustom = sec.source === 'custom'
      return { name: sec.name, order: i, text: isCustom ? (sec.text ?? '') : (existing?.text ?? ''), custom: isCustom }
    })
    scope.set('inject', list)
  }

  // 删除一个 custom（本插件注入）段：从 inject / sections / replace 中全部
  // 移除，之后它不会再出现在面板上。
  const removeCustom = (name: string): void => {
    const patch = removeSection(name, cfg)
    scope.set('sections', patch.sections)
    scope.set('inject', patch.inject)
    scope.set('replace', patch.replace)
  }

  // 上移/下移一格（数组下标交换），然后重新编号。
  const moveOrder = (index: number, dir: -1 | 1): void => {
    const target = index + dir
    if (target < 0 || target >= merged.length) return
    const next = merged.slice()
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    persistOrder(next)
  }

  const onDragStart = (e: DragEvent, name: string): void => {
    setDragName(name)
    e.dataTransfer.effectAllowed = 'move'
    try { e.dataTransfer.setData('text/plain', name) } catch { /* ignore */ }
  }
  const onDragOver = (e: DragEvent, name: string): void => {
    if (!dragName || dragName === name) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const rect = e.currentTarget.getBoundingClientRect()
    const pos = e.clientY < rect.top + rect.height / 2 ? 'above' : 'below'
    setDropTarget({ name, pos })
  }
  const onDrop = (e: DragEvent, target: Section): void => {
    e.preventDefault()
    if (!dragName || dragName === target.name) { setDragName(null); setDropTarget(null); return }
    const dragged = merged.find((x) => x.name === dragName)
    if (!dragged) { setDragName(null); setDropTarget(null); return }
    const next = merged.filter((x) => x.name !== dragName)
    const idx = next.findIndex((x) => x.name === target.name)
    const pos = dropTarget?.name === target.name ? dropTarget.pos : 'below'
    next.splice(pos === 'above' ? idx : idx + 1, 0, dragged)
    persistOrder(next)
    setDragName(null)
    setDropTarget(null)
  }
  const onDragEnd = (): void => { setDragName(null); setDropTarget(null) }

  // 新增一个注入段，按顺序提示值放置，然后重新编号。该段会带上 `custom`
  // 隐藏标记，从而被识别为本插件生成（可删除），并且自身文本得以保留。
  const addSection = (name: string, order: number, text: string): void => {
    const next = merged.slice()
    const entry: Section = { name, order, text, active: true, replaced: false, source: 'custom' }
    const existing = next.findIndex((x) => x.name === name)
    if (existing >= 0) next[existing] = entry
    else {
      const idx = next.findIndex((x) => x.order > order)
      if (idx < 0) next.push(entry)
      else next.splice(idx, 0, entry)
    }
    persistOrder(next)
  }

  return h('div', { style: s.list }, [
    merged.length === 0 ? h('div', { style: s.muted }, t('empty')) : null,
    merged.map((sec, index) => {
      const blocked = blockedNames.has(sec.name)
      const isEditing = editing === sec.name
      const isDragging = dragName === sec.name
      const isDropTarget = dropTarget?.name === sec.name
      const rowStyle = {
        ...s.row,
        ...(isDragging ? s.rowDragging : {}),
        ...(isDropTarget && dropTarget.pos === 'above' ? s.rowDropAbove : {}),
        ...(isDropTarget && dropTarget.pos === 'below' ? s.rowDropBelow : {}),
      }
      return h('div', {
        key: sec.name,
        style: rowStyle,
        draggable: true,
        onDragStart: (e: DragEvent) => onDragStart(e, sec.name),
        onDragOver: (e: DragEvent) => onDragOver(e, sec.name),
        onDrop: (e: DragEvent) => onDrop(e, sec),
        onDragEnd,
      }, [
        h('span', { style: s.dragHandle, title: t('drag') }, '⠿'),
        h('label', { style: s.switchWrap }, [
          h('input', { type: 'checkbox', checked: blocked, onChange: () => toggleBlock(sec.name, blocked) }),
          h('span', { style: blocked ? s.badgeBlocked : s.badgeOk }, blocked ? t('blockedOn') : t('blockedOff')),
        ]),
        h('div', { style: s.rowBody }, [
          h('div', { style: s.rowTitle }, [
            h('span', { style: s.code }, sec.name),
            h('span', { style: s.orderTag }, '#' + index),
            h('span', { style: sec.source === 'custom' ? s.badgeCustom : s.badgeSystem }, sec.source === 'custom' ? t('manual') : t('system')),
            replace[sec.name] ? h('span', { style: s.badgeReplaced }, t('replaced')) : null,
          ]),
          isEditing
            ? h('div', { style: s.editBox }, [
                h('textarea', { style: s.editInput, value: draft, onChange: (e: ChangeEvent<HTMLTextAreaElement>) => setDraft(e.target.value), rows: 3 }),
                h('div', { style: s.injectRow }, [
                  h('button', { style: s.mini, onClick: () => commitReplace(sec.name) }, t('save')),
                  h('button', { style: s.mini, onClick: () => setEditing(null) }, t('clearInput')),
                  sec.source !== 'custom' && replace[sec.name] ? h('button', { style: s.mini, onClick: () => restoreReplace(sec.name) }, t('restore')) : null,
                ]),
              ])
            : h('div', { style: s.preview }, String(replace[sec.name] ?? sec.text ?? '').slice(0, 140) || (sec.source === 'custom' ? t('empty') : t('dynamic'))),
        ]),
        h('div', { style: s.arrowCol }, [
          h('button', { style: s.arrow, disabled: index === 0, onClick: () => moveOrder(index, -1), title: t('moveUp') }, '↑'),
          h('button', { style: s.arrow, disabled: index === merged.length - 1, onClick: () => moveOrder(index, 1), title: t('moveDown') }, '↓'),
        ]),
        isEditing ? null : h('button', { style: s.mini, onClick: () => startReplace(sec.name, String(sec.text ?? '')) }, t('replace')),
        !isEditing && sec.source !== 'custom' && replace[sec.name] ? h('button', { style: s.mini, onClick: () => restoreReplace(sec.name) }, t('restore')) : null,
        sec.source === 'custom' ? h('button', { style: s.mini, onClick: () => removeCustom(sec.name), title: t('delete') }, t('delete')) : null,
      ])
    }),
    h('div', { style: s.injectBox }, [
      h('div', { style: s.rowTitle }, t('injectNew')),
      h(InjectForm, { onAdd: addSection, t }),
    ]),
  ])
}

/** 注入新段表单：名称 + 顺序提示 + 文本，一行式提交。 */
function InjectForm({ onAdd, t }: { onAdd: (name: string, order: number, text: string) => void; t: Translate }): ReactElement {
  const [name, setName] = useState('')
  const [order, setOrder] = useState('120')
  const [text, setText] = useState('')

  const submit = (): void => {
    if (!name.trim()) return
    onAdd(name.trim(), Number(order) || 120, text)
    setName(''); setText(''); setOrder('120')
  }

  return h('div', {}, [
    h('div', { style: s.injectRow }, [
      h('input', { style: { ...s.input, width: '22%' }, placeholder: t('name'), value: name, onChange: (e) => setName(e.target.value) }),
      h('input', { style: { ...s.input, width: '12%' }, type: 'number', placeholder: t('order'), value: order, onChange: (e) => setOrder(e.target.value) }),
      h('input', { style: { ...s.input, flex: 1 }, placeholder: t('text'), value: text, onChange: (e) => setText(e.target.value) }),
      h('button', { style: s.mini, onClick: submit }, t('add')),
    ]),
  ])
}

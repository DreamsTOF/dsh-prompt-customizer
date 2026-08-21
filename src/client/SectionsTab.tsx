/** Prompt-sections tab: block / replace / inject / reorder prompt sections. */
import { createElement as h, useState, type ReactElement, type DragEvent, type ChangeEvent } from 'react'
import type { Config, Inventory, SettingsScope } from './types.ts'
import type { Translate } from './locales.ts'
import { s } from './styles.ts'

interface Section {
  name: string
  order: number
  text?: string
  active: boolean
  replaced: boolean
}

export function SectionsTab({ cfg, inv, scope, t }: { cfg: Config; inv: Inventory | null; scope: SettingsScope; t: Translate }): ReactElement {
  const replace = cfg.replace ?? {}
  const blockedNames = new Set(cfg.sections ?? [])
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [dragName, setDragName] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<{ name: string; pos: 'above' | 'below' } | null>(null)

  // Merge inventory sections with user-injected sections, sorted by order.
  // Injected sections that don't exist in the original prompt appear here too,
  // positioned by their order value.
  const merged: Section[] = (() => {
    const map = new Map<string, Section>()
    for (const sec of inv?.sections ?? []) map.set(sec.name, sec)
    for (const item of cfg.inject ?? []) {
      const existing = map.get(item.name)
      if (existing) map.set(item.name, { ...existing, order: item.order })
      else map.set(item.name, {
        name: item.name,
        order: item.order,
        text: item.text || '<动态生成>',
        active: !blockedNames.has(item.name),
        replaced: false,
      })
    }
    return [...map.values()].sort((a, b) => a.order - b.order)
  })()

  const toggleBlock = (name: string, currentlyBlocked: boolean): void => {
    const list = (cfg.sections ?? []).slice()
    if (currentlyBlocked) { const i = list.indexOf(name); if (i >= 0) list.splice(i, 1) }
    else list.push(name)
    scope.set('sections', list)
  }
  const startReplace = (name: string, original: string): void => {
    // Echo the ORIGINAL prompt text so the user edits from the current value.
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
  const clearReplace = (name: string): void => {
    const next = { ...replace }
    delete next[name]
    scope.set('replace', next)
  }

  // Persist the full ordered list. We treat the sorted list as an array and
  // re-index every section with a sequential integer order (0, 1, 2, …), so
  // there are never duplicate or fractional orders. text is left empty for
  // original sections (keeps their text); injected sections keep their own.
  const persistOrder = (ordered: Section[]): void => {
    const list = ordered.map((sec, i) => {
      const existing = (cfg.inject ?? []).find((x) => x.name === sec.name)
      return { name: sec.name, order: i, text: existing ? existing.text : '' }
    })
    scope.set('inject', list)
  }

  // Move a section up/down one slot (array-index swap), then re-index.
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

  // Add a new injected section, placed by its order hint, then re-index.
  const addSection = (name: string, order: number, text: string): void => {
    const next = merged.slice()
    const entry: Section = { name, order, text: text || '<动态生成>', active: true, replaced: false }
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
            sec.replaced ? h('span', { style: s.badgeReplaced }, t('replaced')) : null,
          ]),
          isEditing
            ? h('div', { style: s.editBox }, [
                h('textarea', { style: s.editInput, value: draft, onChange: (e: ChangeEvent<HTMLTextAreaElement>) => setDraft(e.target.value), rows: 3 }),
                h('div', { style: s.injectRow }, [
                  h('button', { style: s.mini, onClick: () => commitReplace(sec.name) }, t('add')),
                  h('button', { style: s.mini, onClick: () => setEditing(null) }, t('clearReplace')),
                ]),
              ])
            : h('div', { style: s.preview }, String(sec.text ?? '').slice(0, 140) || t('dynamic')),
        ]),
        h('div', { style: s.arrowCol }, [
          h('button', { style: s.arrow, disabled: index === 0, onClick: () => moveOrder(index, -1), title: t('moveUp') }, '↑'),
          h('button', { style: s.arrow, disabled: index === merged.length - 1, onClick: () => moveOrder(index, 1), title: t('moveDown') }, '↓'),
        ]),
        h('button', { style: s.mini, onClick: () => replace[sec.name] ? clearReplace(sec.name) : startReplace(sec.name, String(sec.text ?? '')) }, replace[sec.name] ? t('clearReplace') : t('replace')),
      ])
    }),
    h('div', { style: s.injectBox }, [
      h('div', { style: s.rowTitle }, t('injectNew')),
      h(InjectForm, { onAdd: addSection, t }),
    ]),
  ])
}

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

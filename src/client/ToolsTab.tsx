/** Tools tab: hide tools from the model catalog (blacklist only — check = hide). */
import { createElement as h, type ReactElement } from 'react'
import type { Config, Inventory, SettingsScope } from './types.ts'
import type { Translate } from './locales.ts'
import { s } from './styles.ts'

export function ToolsTab({ cfg, inv, scope, t }: { cfg: Config; inv: Inventory | null; scope: SettingsScope; t: Translate }): ReactElement {
  const tools = inv?.tools ?? []
  const exclude = cfg.tools?.exclude ?? []

  // Blacklist-only: a tool is hidden iff it is in the exclude list. Any stale
  // whitelist (include) is discarded on write so mode switching is gone.
  const hidden = (name: string): boolean => exclude.includes(name)

  const toggle = (name: string, currentlyHidden: boolean): void => {
    const next = exclude.slice()
    if (currentlyHidden) { const i = next.indexOf(name); if (i >= 0) next.splice(i, 1) }
    else next.push(name)
    scope.set('tools', { exclude: next, include: [] })
  }

  const setAll = (hideAll: boolean): void => {
    scope.set('tools', { exclude: hideAll ? tools.map((tool) => tool.name) : [], include: [] })
  }

  return h('div', {}, [
    h('div', { style: s.bar }, [
      h('button', { style: s.mini, onClick: () => setAll(true) }, t('selectAll')),
      h('button', { style: s.mini, onClick: () => setAll(false) }, t('selectNone')),
    ]),
    h('div', { style: s.list }, [
      tools.length === 0 ? h('div', { style: s.muted }, t('empty')) : null,
      tools.map((tool) => {
        const isHidden = hidden(tool.name)
        return h('div', { key: tool.name, style: s.row }, [
          h('label', { style: s.switchWrap }, [
            h('input', { type: 'checkbox', checked: isHidden, onChange: () => toggle(tool.name, isHidden) }),
            h('span', { style: isHidden ? s.badgeBlocked : s.badgeOk }, isHidden ? t('hiddenOn') : t('hiddenOff')),
          ]),
          h('div', { style: s.rowBody }, [
            h('div', { style: s.rowTitle }, h('span', { style: s.code }, tool.name)),
            h('div', { style: s.preview }, String(tool.description ?? '').slice(0, 140)),
          ]),
        ])
      }),
    ]),
  ])
}

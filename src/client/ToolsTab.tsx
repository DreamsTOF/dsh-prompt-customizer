/** Tools tab: hide tools from the model catalog by exclude/include. */
import { createElement as h, type ReactElement } from 'react'
import type { Config, Inventory, SettingsScope } from './types.ts'
import type { Translate } from './locales.ts'
import { s } from './styles.ts'

export function ToolsTab({ cfg, inv, scope, t }: { cfg: Config; inv: Inventory | null; scope: SettingsScope; t: Translate }): ReactElement {
  const tools = inv?.tools ?? []
  const toolsCfg = cfg.tools ?? { exclude: [], include: [] }
  const exclude = toolsCfg.exclude ?? []
  const include = toolsCfg.include ?? []
  const includeMode = include.length > 0

  const toggle = (name: string, currentlyHidden: boolean): void => {
    if (includeMode) {
      const next = include.slice()
      if (currentlyHidden) next.push(name)
      else { const i = next.indexOf(name); if (i >= 0) next.splice(i, 1) }
      scope.set('tools', { ...toolsCfg, include: next })
    } else {
      const next = exclude.slice()
      if (currentlyHidden) { const i = next.indexOf(name); if (i >= 0) next.splice(i, 1) }
      else next.push(name)
      scope.set('tools', { ...toolsCfg, exclude: next })
    }
  }
  const setIncludeMode = (on: boolean): void => {
    scope.set('tools', on
      ? { exclude: exclude.filter((n) => tools.some((tool) => tool.name === n)), include: tools.filter((tool) => !tool.hidden).map((tool) => tool.name) }
      : { exclude: ensureOnlyKnown(exclude, tools), include: [] })
  }

  return h('div', {}, [
    h('div', { style: s.bar }, [
      h('button', { style: includeMode ? s.tabActive : s.tab, onClick: () => setIncludeMode(true) }, t('includeMode')),
      h('button', { style: includeMode ? s.tab : s.tabActive, onClick: () => setIncludeMode(false) }, t('excludeMode')),
    ]),
    h('div', { style: s.list }, [
      tools.length === 0 ? h('div', { style: s.muted }, t('empty')) : null,
      tools.map((tool) => {
        // Hidden state comes from the CONFIG (exclude/include lists), not the
        // inventory snapshot, so toggling updates the checkbox immediately.
        const hidden = includeMode ? !include.includes(tool.name) : exclude.includes(tool.name)
        return h('div', { key: tool.name, style: s.row }, [
          h('label', { style: s.switchWrap }, [
            h('input', { type: 'checkbox', checked: hidden, onChange: () => toggle(tool.name, hidden) }),
            h('span', { style: hidden ? s.badgeBlocked : s.badgeOk }, hidden ? t('hiddenOn') : t('hiddenOff')),
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

function ensureOnlyKnown(list: string[], known: Array<{ name: string }>): string[] {
  const names = known.map((tool) => tool.name)
  return list.filter((n) => names.includes(n))
}

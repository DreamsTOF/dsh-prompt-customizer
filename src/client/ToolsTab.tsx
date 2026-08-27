/** 工具 Tab：从模型目录中隐藏工具（纯黑名单 —— 勾选即隐藏）。 */
import { createElement as h, type ReactElement } from 'react'
import type { Config, Inventory, SettingsScope } from './types.ts'
import type { Translate } from './locales.ts'
import { s } from './styles.ts'

export function ToolsTab({ cfg, inv, scope, t }: { cfg: Config; inv: Inventory | null; scope: SettingsScope; t: Translate }): ReactElement {
  const tools = inv?.tools ?? []
  const exclude = cfg.tools?.exclude ?? []

  // 纯黑名单模式：工具是否隐藏只取决于它是否在 exclude 列表里。
  // 写入时丢弃任何残留的白名单（include），彻底去掉模式切换的概念。
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

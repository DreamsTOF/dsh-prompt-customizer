/** 工具 Tab：从模型目录中隐藏工具（纯黑名单 —— 勾选即隐藏）；
 *  底部可配置未晋级阶段的 bootstrap 目录（白名单，留空 = 不启用阶段化）。 */
import { createElement as h, useState, type ReactElement, type ChangeEvent } from 'react'
import type { Config, Inventory } from './types.ts'
import type { Translate } from './locales.ts'
import { s } from './styles.ts'

export function ToolsTab({ cfg, inv, t, write }: {
  cfg: Config
  inv: Inventory | null
  t: Translate
  write: (field: 'sections' | 'replace' | 'inject' | 'tools', value: unknown) => void
}): ReactElement {
  const tools = inv?.tools ?? []
  const exclude = cfg.tools?.exclude ?? []
  const boot = cfg.tools?.bootstrap ?? {}
  const [bootDraft, setBootDraft] = useState<string | null>(null)

  // 纯黑名单模式：工具是否隐藏只取决于它是否在 exclude 列表里。
  // 写入时丢弃任何残留的白名单（include），彻底去掉模式切换的概念。
  // 其余键（bootstrap）原样保留 —— 不被打断的阶段化目录。
  const hidden = (name: string): boolean => exclude.includes(name)

  const toggle = (name: string, currentlyHidden: boolean): void => {
    const next = exclude.slice()
    if (currentlyHidden) { const i = next.indexOf(name); if (i >= 0) next.splice(i, 1) }
    else next.push(name)
    write('tools', { ...cfg.tools, exclude: next, include: [] })
  }

  const setAll = (hideAll: boolean): void => {
    write('tools', { ...cfg.tools, exclude: hideAll ? tools.map((tool) => tool.name) : [], include: [] })
  }

  // bootstrap 目录：未晋级阶段的工具白名单（keep-set）。编辑期间显示草稿，
  // 提交时解析为名字数组写回；空列表 = 关闭阶段化（全阶段用静态过滤）。
  const bootList = boot.include ?? []
  const bootText = bootDraft ?? bootList.join(', ')
  const commitBoot = (): void => {
    const names = (bootDraft ?? '').split(/[,\s]+/).map((x) => x.trim()).filter(Boolean)
    setBootDraft(null)
    write('tools', { ...cfg.tools, bootstrap: { ...boot, include: [...new Set(names)] } })
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
    h('div', { style: s.injectBox }, [
      h('div', { style: s.rowTitle }, [
        t('bootstrapTitle'),
        bootList.length > 0 ? h('span', { style: s.badgeOk }, t('phaseBootstrap')) : null,
      ]),
      h('div', { style: s.muted }, t('bootstrapHint')),
      h('div', { style: s.injectRow }, [
        h('input', {
          style: { ...s.input, flex: 1 },
          placeholder: bootList.join(', ') || 'bash, str_replace_editor',
          value: bootText,
          onChange: (e: ChangeEvent<HTMLInputElement>) => setBootDraft(e.target.value),
        }),
        h('button', { style: s.mini, onClick: commitBoot, disabled: bootDraft === null }, t('save')),
      ]),
    ]),
  ])
}

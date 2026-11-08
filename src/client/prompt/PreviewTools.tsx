/** 工具预览：当前定制（黑名单过滤之后）最终对模型可见的工具目录，
 *  只读、清单式呈现：列出即代表模型看得见 —— 这里没有「已屏蔽」状态。
 *  本视图绝不修改黑名单配置。 */
import { createElement as h, type ReactElement } from 'react'
import type { Translate } from './locales.ts'
import { s } from './styles.ts'
import { entryKey, type EntrySource, type PreviewTool } from './types.ts'

/** 把字符串形态的条目补全为 { name }。 */
function norm(tool: PreviewTool | string): { name: string; description: string; source?: EntrySource; keySuffix?: string } {
  if (typeof tool === 'string') return { name: tool, description: '' }
  return {
    name: tool.name,
    description: tool.description ?? '',
    ...(tool.source === undefined ? {} : { source: tool.source }),
    ...(tool.keySuffix === undefined ? {} : { keySuffix: tool.keySuffix }),
  }
}

export function PreviewTools({ tools, t }: { tools: Array<PreviewTool | string>; t: Translate }): ReactElement {
  if (tools.length === 0) return h('div', { style: s.muted }, t('empty'))
  return h('div', { style: s.list }, [
    h('div', { style: s.rowTitle }, [
      h('span', { style: s.orderTag }, `${tools.length} ${t('previewToolCount')}`),
    ]),
    tools.map((tool, index) => {
      const { name, description, source, keySuffix } = norm(tool)
      // 同名不同源 / 同名多态都要分行：key 用 name+source+keySuffix+序号。
      const identity = `${entryKey({ name, ...(source === undefined ? {} : { source }) })}:${index}:${keySuffix ?? ''}`
      return h('div', { key: identity, style: s.row }, [
        h('div', { style: s.rowBody }, [
          h('div', { style: s.rowTitle }, [
            h('span', { style: s.code }, name),
            source === undefined
              ? null
              : h('span', { style: s.badgeSystem }, `${source.kind}${source.id === undefined ? '' : `:${source.id}`}`),
            keySuffix === undefined ? null : h('span', { style: s.badgeSystem }, keySuffix),
          ]),
          h('div', { style: s.preview }, String(description ?? '').slice(0, 140)),
        ]),
      ])
    }),
  ])
}

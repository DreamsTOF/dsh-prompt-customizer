/** 工具预览：当前定制（include/exclude 之后）最终对模型可见的工具目录，
 *  只读、白名单风格。列出即代表可见——这里没有「已屏蔽」状态。
 *  本视图绝不修改黑名单/白名单配置。 */
import { createElement as h, type ReactElement } from 'react'
import type { Translate } from './locales.ts'
import { s } from './styles.ts'

/** 预览工具条目：对象形态或纯字符串工具名（统一归一化为对象）。 */
export type PreviewTool = { name: string; description: string } | string

/** 把字符串形态的条目补全为 { name, description: '' }。 */

function norm(tool: PreviewTool): { name: string; description: string } {
  return typeof tool === 'string' ? { name: tool, description: '' } : tool
}

export function PreviewTools({ tools, t }: { tools: PreviewTool[]; t: Translate }): ReactElement {
  if (tools.length === 0) return h('div', { style: s.muted }, t('empty'))
  return h('div', { style: s.list }, [
    h('div', { style: s.rowTitle }, [
      h('span', { style: s.orderTag }, `${tools.length} ${t('previewToolCount')}`),
    ]),
    tools.map((tool) => {
      const { name, description } = norm(tool)
      return h('div', { key: name, style: s.row }, [
        h('div', { style: s.rowBody }, [
          h('div', { style: s.rowTitle }, h('span', { style: s.code }, name)),
          h('div', { style: s.preview }, String(description ?? '').slice(0, 140)),
        ]),
      ])
    }),
  ])
}

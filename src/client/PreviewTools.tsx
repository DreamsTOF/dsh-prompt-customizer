/** Tools preview: read-only whitelist-style list of the tools the current
 *  preset will inject (the FINAL model-visible catalog after include/exclude).
 *  A tool being listed means it is visible — there is no "blocked" state here.
 *  This view never edits the blacklist/whitelist config. */
import { createElement as h, type ReactElement } from 'react'
import type { Translate } from './locales.ts'
import { s } from './styles.ts'

export type PreviewTool = { name: string; description: string } | string

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

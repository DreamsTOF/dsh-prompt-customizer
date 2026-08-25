/** Preview tab: two read-only sub-tabs — the FINAL assembled system prompt
 *  after every plugin's filter, and the tools the current preset will inject
 *  (whitelist-style, after include/exclude). Neither view edits config. */
import { createElement as h, useEffect, useRef, useState, type ReactElement } from 'react'
import type { Preview, SettingsScope } from './types.ts'
import type { Translate } from './locales.ts'
import { s } from './styles.ts'
import { PreviewTools } from './PreviewTools.tsx'

const PREVIEW_URL = '/api/prompt-customizer/preview'

export function PreviewTab({ scope, t }: { scope: SettingsScope; t: Translate }): ReactElement {
  const [sub, setSub] = useState<'prompt' | 'tools'>('prompt')
  const [data, setData] = useState<Preview | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Reload whenever the namespace config changes (block/replace/inject), so the
  // section count and final text always reflect the current customization —
  // not just on mount. A config change that lands while a fetch is in flight is
  // never dropped: it schedules one trailing reload, so the preview converges
  // to the latest config even when the in-flight response was served before the
  // write committed on the host.
  const inFlight = useRef(false)
  const pending = useRef(false)
  const load = (): void => {
    if (inFlight.current) { pending.current = true; return }
    inFlight.current = true
    setData(null)
    fetch(PREVIEW_URL, { cache: 'no-store' })
      .then((r) => r.json())
      .then((body: Preview) => {
        if (body && body.ok === false) throw new Error((body as { error?: string }).error ?? 'preview failed')
        setData(body)
        setError(null)
      })
      .catch((e: unknown) => setError(String(e instanceof Error ? e.message : e)))
      .finally(() => {
        inFlight.current = false
        if (pending.current) { pending.current = false; load() }
      })
  }
  useEffect(load, [])
  useEffect(() => scope.subscribe(load), [scope])

  return h('div', { style: s.list }, [
    h('div', { style: s.bar }, [
      h('button', { style: sub === 'prompt' ? s.tabActive : s.tab, onClick: () => setSub('prompt') }, t('previewPrompt')),
      h('button', { style: sub === 'tools' ? s.tabActive : s.tab, onClick: () => setSub('tools') }, t('previewTools')),
    ]),
    error ? h('div', { style: s.error }, String(error)) : null,
    data === null && !error ? h('div', { style: s.muted }, t('loading')) : null,
    sub === 'prompt'
      ? data
        ? [
            h('div', { style: s.rowTitle }, [
              h('span', { style: s.muted }, t('previewHint')),
              h('span', { style: s.orderTag }, `${data.sections.length} ${t('previewSections')}`),
            ]),
            h('pre', { style: s.previewText }, data.text || t('empty')),
          ]
        : null
      : data
        ? h(PreviewTools, { tools: data.tools, t })
        : null,
  ])
}

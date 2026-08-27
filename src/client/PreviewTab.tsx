/** 预览 Tab：两个只读子视图 —— 所有插件过滤后的最终装配系统提示词，
 *  以及当前定制（include/exclude 之后）将注入的工具白名单视图。
 *  两个视图都不修改配置。 */
import { createElement as h, useEffect, useRef, useState, type ReactElement } from 'react'
import type { Preview, SettingsScope } from './types.ts'
import type { Translate } from './locales.ts'
import { s } from './styles.ts'
import { PreviewTools } from './PreviewTools.tsx'

const PREVIEW_URL = '/api/prompt-customizer/preview'

export function PreviewTab({ scope, t, active, refreshId }: { scope: SettingsScope; t: Translate; active: boolean; refreshId: number }): ReactElement {
  const [sub, setSub] = useState<'prompt' | 'tools'>('prompt')
  const [data, setData] = useState<Preview | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 命名空间配置一变（屏蔽/替换/注入）就重新加载，段数与最终文本始终反映
  // 当前定制——而不只在挂载时加载一次。inFlight 防止并发请求竞态。
  const inFlight = useRef(false)
  const load = (): void => {
    if (inFlight.current) return
    inFlight.current = true
    setData(null)
    fetch(`${PREVIEW_URL}?t=${Date.now()}`)
      .then((r) => r.json())
      .then((body: Preview) => {
        if (body && body.ok === false) throw new Error((body as { error?: string }).error ?? 'preview failed')
        setData(body)
        setError(null)
      })
      .catch((e: unknown) => setError(String(e instanceof Error ? e.message : e)))
      .finally(() => { inFlight.current = false })
  }
  useEffect(load, [])
  useEffect(() => scope.subscribe(load), [scope])
  // 切到本 Tab 或点击刷新按钮时重新加载
  useEffect(() => { if (active) load() }, [active, refreshId])

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

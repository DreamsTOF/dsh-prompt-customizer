/**
 * SessionView — 「当前会话」只读视图。
 *
 * 数据来自宿主 `/api/prompt-customizer/session`：用最新活动根 agent 自己的
 * scope 跑一次真实装配。提示词与工具都是模型此刻真正看到的那一份；工具列表
 * 额外给出完整目录与来源标记（会话级新增 / 插件遮蔽 / 本插件遮蔽），让用户
 * 能解释「为什么有的工具在面板里、有的不在」。
 */
import { createElement as h, useState, type ReactElement } from 'react'
import type { Preview } from './types.ts'
import type { Translate } from './locales.ts'
import { s } from './styles.ts'

type SessionSub = 'prompt' | 'tools'
type ToolRow = {
  name: string
  description: string
  hidden: boolean
  state?: 'controllable' | 'locked-agent' | 'locked-executor' | 'masked-plugin' | 'masked-own'
  scope?: 'agent' | 'executor'
  maskedByPlugin?: boolean
  maskedByOwnPlugin?: boolean
}

export function SessionView({ data, loading, error, t, onRefresh }: {
  data: Preview | null
  loading: boolean
  error: string | null
  t: Translate
  onRefresh: () => void
}): ReactElement {
  const [sub, setSub] = useState<SessionSub>('prompt')
  const session = data?.session ?? null
  const phaseLabel = session?.phase === 'bootstrap'
    ? t('phaseStageGuide')
    : session?.phase === 'compaction'
      ? t('phaseStageControlled')
      : t('phaseStageResident')
  const lossNote = data === null || data === undefined
    ? null
    : data.takenOverBy !== undefined
      ? t('sectionsTakenOver', { name: data.takenOverBy })
      : data.lostSections !== undefined
        ? t('sectionsLost', { emitted: data.lostSections.emitted, survived: data.lostSections.survived })
        : null

  const toolRows: ToolRow[] = data?.baseTools ?? (data?.tools ?? []).map((tool) =>
    typeof tool === 'string'
      ? { name: tool, description: '', hidden: false }
      : { name: tool.name, description: tool.description, hidden: false })
  const visibleNames = new Set((data?.tools ?? []).map((tool) => typeof tool === 'string' ? tool : tool.name))

  return h('div', { style: { ...s.colRight, flex: 1 } }, [
    h('div', { style: s.colRightScroll }, [
      h('div', { style: s.rowTitle }, [
        h('span', { style: s.headTitle }, t('tabsSession')),
        session !== null
          ? h('span', { style: s.orderTag }, `${t('sessionId')}: ${session.id} · ${t('sessionPreset')}: ${session.presetId ?? '—'} · ${t('sessionPhase')}: ${phaseLabel}`)
          : null,
        h('button', { style: { ...s.mini, marginLeft: 'auto' }, onClick: onRefresh }, t('refresh')),
      ]),
      h('div', { style: s.noticeWarn }, t('sessionHint')),
      error !== null ? h('div', { style: s.error }, error) : null,
      loading && data === null ? h('div', { style: s.muted }, t('loading')) : null,
      !loading && data !== null && session === null
        ? h('div', { style: s.muted }, t('sessionNone'))
        : null,
      data !== null && session !== null
        ? [
            h('div', { style: { ...s.seg, margin: '4px 0 8px' } }, [
              h('button', {
                style: sub === 'prompt' ? s.segBtnActive : s.segBtn,
                onClick: () => setSub('prompt'),
              }, t('tabsSections')),
              h('button', {
                style: sub === 'tools' ? s.segBtnActive : s.segBtn,
                onClick: () => setSub('tools'),
              }, t('tabsTools')),
            ]),
            lossNote !== null ? h('div', { style: s.noticeWarn }, lossNote) : null,
            data.diagnostics?.length
              ? h('div', { style: s.noticeWarn }, t('previewUnresolved', {
                  names: [...new Set(data.diagnostics.map(item => `{{${item.variable}}}`))].join(', '),
                }))
              : null,
            sub === 'prompt'
              ? [
                  h('div', { style: s.rowTitle }, [
                    h('span', { style: s.muted }, t('sessionPromptTitle')),
                    h('span', { style: s.orderTag }, `${data.sections.length} ${t('previewSections')}`),
                  ]),
                  h('pre', { style: s.previewText }, data.text || t('empty')),
                  h('div', { style: s.rowTitle }, t('runtimeContexts')),
                  ...(data.contexts ?? []).map(context => h('div', { key: context.name }, [
                    h('div', { style: s.muted }, context.name),
                    h('pre', { style: s.previewText }, context.text || t('empty')),
                  ])),
                ]
              : [
                  h('div', { style: s.rowTitle }, [
                    h('span', { style: s.muted }, t('sessionToolsTitle')),
                    h('span', { style: s.orderTag },
                      `${data.tools.length} ${t('sessionToolsVisible')} / ${data.registryTotal ?? toolRows.length} ${t('sessionToolsTotal')}`),
                  ]),
                  h('div', { style: s.list }, toolRows.map((tool) => h('div', {
                    key: `${tool.name}:${tool.state ?? tool.scope ?? ''}`,
                    style: s.row,
                  }, [
                    h('div', { style: s.rowBody }, [
                      h('div', { style: s.rowTitle }, [
                        h('span', { style: s.code }, tool.name),
                        tool.maskedByOwnPlugin === true
                          ? h('span', { style: s.badgeBlocked, title: t('toolMaskedByOwnPluginHint') }, t('toolMaskedByOwnPlugin'))
                          : tool.maskedByPlugin === true
                            ? h('span', { style: s.badgeReplaced, title: t('toolMaskedByPluginHint') }, t('toolMaskedByPlugin'))
                            : tool.scope === 'agent'
                              ? h('span', { style: s.badgeSystem, title: t('toolAgentScopedHint') }, t('toolAgentScoped'))
                              : tool.scope === 'executor'
                                ? h('span', { style: s.badgeSystem, title: t('toolExecutorScopedHint') }, t('toolExecutorScoped'))
                              : tool.hidden === true
                                ? h('span', { style: s.badgeBlocked }, t('hiddenOn'))
                                : visibleNames.has(tool.name)
                                  ? null
                                  : h('span', { style: s.badgeReplaced }, t('hiddenOn')),
                      ]),
                      tool.description !== '' ? h('div', { style: s.preview }, tool.description.slice(0, 140)) : null,
                    ]),
                  ]))),
                ],
          ]
        : null,
    ]),
  ])
}

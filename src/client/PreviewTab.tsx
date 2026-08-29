/** 预览 Tab：两个只读子视图 —— 所有插件过滤后的最终装配系统提示词，
 *  以及当前定制（黑名单过滤之后）将注入的工具目录视图。
 *  两个视图都不修改配置。预览目标跟随面板顶部的编辑目标（`target`）；
 *  数据直接来自 Panel 并行拉取的三阶段装配（`phases`）—— 与提示词/
 *  工具 Tab 同源（同一份 base + post 视图），杜绝三个视图数据不一致。
 *  阶段按钮恒为引导期 / 常驻期 / 压缩受控期三个（与另两个 Tab 同源同形）。 */
import { createElement as h, useState, type ReactElement } from 'react'
import type { PhaseViewKey, Preview } from './types.ts'
import type { Translate } from './locales.ts'
import { PART_ORDER } from './presets.ts'
import { s } from './styles.ts'
import { PreviewTools } from './PreviewTools.tsx'

export function PreviewTab({ t, active, refreshId, target, version, phases }: {
  t: Translate
  active: boolean
  refreshId: number
  /** 顶部编辑目标：undefined = 全局（standard scope）；字符串 = agent 预设 id。 */
  target: string | undefined
  /** 配置写入计数：Panel 每次成功写配置后 +1（驱动统一重载）。
   *  ponytail: refreshId/version 由 Panel 的统一重载消费，本组件内未直接使用。 */
  version: number
  /** Panel 并行拉取的三阶段装配（模型视角统一数据源）。 */
  phases: Record<PhaseViewKey, Preview | null> | null
}): ReactElement {
  const [sub, setSub] = useState<'prompt' | 'tools'>('prompt')
  const [phase, setPhase] = useState<PhaseViewKey>('bootstrap')

  const data = phases?.[phase] ?? null
  // 按当前所选阶段判定「段级定制没进最终提示词」：有 complete 段整段接管就说
  // 接管，否则探测本插件产出的段是否被下游丢弃（丢弃规则不止一种）。
  const lossNote = data === null || data === undefined ? null
    : data.takenOverBy !== undefined
      ? t('sectionsTakenOver', { name: data.takenOverBy })
      : data.lostSections !== undefined
        ? t('sectionsLost', { emitted: data.lostSections.emitted, survived: data.lostSections.survived })
        : null

  // 阶段按钮命名：引导期 / 常驻期 / 压缩受控期。
  const stageLabel = (p: PhaseViewKey): string =>
    p === 'bootstrap' ? t('phaseStageGuide') : p === 'compaction' ? t('phaseStageControlled') : t('phaseStageResident')

  return h('div', { style: s.list }, [
    h('div', { style: s.bar }, [
      h('button', { style: sub === 'prompt' ? s.tabActive : s.tab, onClick: () => setSub('prompt') }, t('previewPrompt')),
      h('button', { style: sub === 'tools' ? s.tabActive : s.tab, onClick: () => setSub('tools') }, t('previewTools')),
      h('div', { style: { marginLeft: 'auto', display: 'flex', gap: 4 } },
        PART_ORDER.map((key) => h('button', {
          key,
          style: phase === key ? s.tabActive : s.tab,
          onClick: () => setPhase(key),
        }, stageLabel(key)))),
    ]),
    // 该阶段的本插件段级产出没进最终提示词（整段接管或被下游丢弃）。
    lossNote !== null ? h('div', { style: s.noticeWarn }, lossNote) : null,
    // scope 挂载失败回退全局层时明确警示：这不是该预设的原生装配。
    data !== null && data.scopeResolved === false
      ? h('div', { style: s.noticeWarn }, t('scopeFallback'))
      : null,
    // 伪会话触发预设插件异常时本次预览降级为无会话装配（原生阶段规则未运行）。
    data !== null && data.degraded === true
      ? h('div', { style: s.noticeWarn }, t('previewDegraded'))
      : null,
    phases === null ? h('div', { style: s.muted }, t('loading')) : null,
    phases !== null && data === null
      ? h('div', { style: s.error }, t('previewFail'))
      : null,
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
        ? [
            // 模型视角 vs 注册表视角的对照：预览按所选阶段运行全部装配规则
            // （含预设原生的阶段裁剪），某些预设（如 PTC / Code Mode）会把
            // 完整目录包装成单一工具，注册表原始目录仍列在工具 Tab。
            h('div', { style: s.rowTitle }, [
              h('span', { style: s.muted }, t('previewToolsHint')),
              h('span', { style: s.orderTag },
                `${data.tools.length} / ${data.registryTotal ?? '?'} ${t('previewToolsCount')}`),
            ]),
            h(PreviewTools, { tools: data.tools, t }),
          ]
        : null,
  ])
}
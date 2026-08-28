/** 预览 Tab：两个只读子视图 —— 所有插件过滤后的最终装配系统提示词，
 *  以及当前定制（include/exclude 之后）将注入的工具白名单视图。
 *  两个视图都不修改配置。预览目标跟随面板顶部的编辑目标（`target`）；
 *  数据直接来自 Panel 并行拉取的三阶段装配（`phases`）—— 与提示词/
 *  工具 Tab 同源（同一份 base + post 视图），杜绝三个视图数据不一致。
 *  阶段按钮绑定的不是固定三态，而是该预设真实拥有的阶段（`cycle`）：
 *  按 (提示词, 工具) 签名去重、按 引导期→常驻期→压缩受控期 顺序展示。 */
import { createElement as h, useState, type ReactElement } from 'react'
import type { CycleEntry, PhaseViewKey, Preview } from './types.ts'
import type { Translate } from './locales.ts'
import { cycleInDisplayOrder } from './presets.ts'
import { s } from './styles.ts'
import { PreviewTools } from './PreviewTools.tsx'

/** 三套名义装配的锚定阅读顺序（与 Panel 一致）。 */
const VIEW_KEYS: PhaseViewKey[] = ['bootstrap', 'compaction', 'active']

export function PreviewTab({ t, active, refreshId, target, version, phases, cycle }: {
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
  /** 该预设真实拥有的阶段（agent 周期）：三态按签名去重后的代表。 */
  cycle: CycleEntry[] | null
}): ReactElement {
  const [sub, setSub] = useState<'prompt' | 'tools'>('prompt')
  const [phase, setPhase] = useState<PhaseViewKey>('bootstrap')

  // cycle 未就绪（加载中）时回退为三态名义按钮；就绪后只渲染真实阶段、
  // 按 引导→常驻→压缩受控 顺序。选择的阶段不在 cycle 里（如目标切换后）
  // 时吸附到首组。
  const nominal: CycleEntry[] = VIEW_KEYS.map((key) => ({ key, merged: [key] }))
  const entries: CycleEntry[] = cycle !== null ? cycleInDisplayOrder(cycle) : phases === null ? [] : nominal
  const current = entries.find((e) => e.key === phase) ?? entries[0]
  const data = current !== undefined ? (phases?.[current.key] ?? null) : null

  // 阶段按钮命名：引导期 / 常驻期 / 压缩受控期；同形折叠组 = 常驻。
  const stageLabel = (p: PhaseViewKey): string =>
    p === 'bootstrap' ? t('phaseStageGuide') : p === 'compaction' ? t('phaseStageControlled') : t('phaseStageResident')
  const entryLabel = (e: CycleEntry): string => (e.merged.length > 1 ? t('phaseAlways') : stageLabel(e.key))

  return h('div', { style: s.list }, [
    h('div', { style: s.bar }, [
      h('button', { style: sub === 'prompt' ? s.tabActive : s.tab, onClick: () => setSub('prompt') }, t('previewPrompt')),
      h('button', { style: sub === 'tools' ? s.tabActive : s.tab, onClick: () => setSub('tools') }, t('previewTools')),
      h('div', { style: { marginLeft: 'auto', display: 'flex', gap: 4 } },
        entries.map((e) => h('button', {
          key: e.key,
          style: current?.key === e.key ? s.tabActive : s.tab,
          onClick: () => setPhase(e.key),
          title: e.merged.join(' + '),
        }, entryLabel(e)))),
    ]),
    // scope 挂载失败回退全局层时明确警示：这不是该预设的原生装配。
    data !== null && data.scopeResolved === false
      ? h('div', { style: s.noticeWarn }, t('scopeFallback'))
      : null,
    // 伪会话触发预设插件异常时本次预览降级为无会话装配（原生阶段规则未运行）。
    data !== null && data.degraded === true
      ? h('div', { style: s.noticeWarn }, t('previewDegraded'))
      : null,
    phases === null ? h('div', { style: s.muted }, t('loading')) : null,
    phases !== null && (current === undefined || data === null)
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
/**
 * PreviewPane — 独立面板的右栏（提示词 / 工具模式常驻）。
 *
 * 只读预览，没有任何切换控件：看提示词还是工具由顶部模式决定（选「提示词」
 * = 提示词编辑 + 提示词预览；选「工具」= 工具编辑 + 工具预览），阶段由头部
 * 的阶段按钮统一控制（与左栏联动）。数据来自 Panel 并行拉取的三阶段装配，
 * 编辑草稿后由 Panel 防抖叠加同步 —— 所见即模型所见。本视图绝不修改配置。
 */
import { createElement as h, type ReactElement } from 'react'
import type { PhaseViewKey, Preview } from './types.ts'
import type { Translate } from './locales.ts'
import { s } from './styles.ts'
import { PreviewTools } from './PreviewTools.tsx'

/** Panel 并行拉取的三阶段装配。 */
type PhaseViews = Record<PhaseViewKey, Preview | null>

export function PreviewPane({ t, phases, phase, sub }: {
  t: Translate
  phases: PhaseViews | null
  /** 当前阶段（状态在 Panel 持有，头部阶段按钮统一切换）。 */
  phase: PhaseViewKey
  /** 提示词 / 工具子视图：跟随顶部模式（无手动切换）。 */
  sub: 'prompt' | 'tools'
}): ReactElement {
  const data = phases?.[phase] ?? null
  // 按当前所选阶段判定「段级定制没进最终提示词」：有 complete 段整段接管就说
  // 接管，否则探测本插件产出的段是否被下游丢弃（丢弃规则不止一种）。
  const lossNote = data === null || data === undefined ? null
    : data.takenOverBy !== undefined
      ? t('sectionsTakenOver', { name: data.takenOverBy })
      : data.lostSections !== undefined
        ? t('sectionsLost', { emitted: data.lostSections.emitted, survived: data.lostSections.survived })
        : null

  return h('div', { style: s.colRight }, [
    h('div', { style: s.colRightScroll }, [
      // 该阶段的本插件段级产出没进最终提示词（整段接管或被下游丢弃）。
      lossNote !== null ? h('div', { style: s.noticeWarn }, lossNote) : null,
      // scope 挂载失败回退全局层时明确警示：这不是该预设的原生装配。
      data !== null && data.scopeResolved === false
        ? h('div', { style: s.noticeWarn }, t('scopeFallback'))
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
              //（含预设原生的阶段裁剪），某些预设（如 PTC / Code Mode）会把
              // 完整目录包装成单一工具，注册表原始目录仍列在工具子视图。
              h('div', { style: s.rowTitle }, [
                h('span', { style: s.muted }, t('previewToolsHint')),
                h('span', { style: s.orderTag },
                  `${data.tools.length} / ${data.registryTotal ?? '?'} ${t('previewToolsCount')}`),
              ]),
              h(PreviewTools, { tools: data.tools, t }),
            ]
          : null,
    ]),
  ])
}

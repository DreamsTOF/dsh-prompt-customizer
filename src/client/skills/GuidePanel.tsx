/**
 * skills/GuidePanel — 右侧「快速上手」浮层卡（portal 到 body，不压缩面板）。
 */
import { createPortal } from 'react-dom'
import {
  IconChevronRightOutline14, IconCloseOutline16, IconSkillOutline16,
} from '@deepseek-ai/dsh-client-ui-primitives'
import { ArrowRightIcon, CheckIcon, GuideArtIcon, GuideArtIconSmall } from './icons.js'
import { css } from './styles.js'
/** ---------------------------------------------------------------- 快速上手指南面板（右侧栏） */

/** 能力小卡图标（stroke currentColor）。 */
export function CapIcon({ kind, size = 17 }: { kind: 'ui' | 'code' | 'doc' | 'data' | 'tool'; size?: number }): JSX.Element {
  const common = { width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': true } as const
  const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
  if (kind === 'ui') {
    return (
      <svg {...common} {...s}><rect x="4" y="4" width="6.5" height="6.5" rx="1.4" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.4" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.4" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.4" /></svg>
    )
  }
  if (kind === 'code') {
    return (
      <svg {...common} {...s}><path d="M9 7.5 5.5 12 9 16.5M15 7.5 18.5 12 15 16.5" /></svg>
    )
  }
  if (kind === 'doc') {
    return (
      <svg {...common} {...s}><path d="M6.5 4.5h7l4 4v11h-11Z" /><path d="M13.5 4.5v4h4M9 13h6M9 16h4.5" /></svg>
    )
  }
  if (kind === 'data') {
    return (
      <svg {...common} {...s}><path d="M5 19h14M7 16v-5M12 16V8M17 16v-8.5" /></svg>
    )
  }
  return (
    <svg {...common} {...s}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
  )
}

/** 右侧指南浮层卡（点击「开始学习」出现，不压缩面板；参考设计稿窄栏内容）。 */
export function GuidePanel({ t, onClose, left, top, height }: {
  t: (key: string) => string
  onClose: () => void
  left: number
  top: number
  height: number
}): JSX.Element {
  const caps: Array<[string, 'ui' | 'code' | 'doc' | 'data' | 'tool']> = [
    [t('guideCapUi'), 'ui'], [t('guideCapCode'), 'code'], [t('guideCapDoc'), 'doc'],
    [t('guideCapData'), 'data'], [t('guideCapTool'), 'tool'],
  ]
  const steps: Array<[number, string, string]> = [
    [1, t('guideStep1'), t('guideStep1Desc')],
    [2, t('guideStep2'), t('guideStep2Desc')],
    [3, t('guideStep3'), t('guideStep3Desc')],
    [4, t('guideStep4'), t('guideStep4Desc')],
  ]
  const bests = [t('guideBest1'), t('guideBest2'), t('guideBest3'), t('guideBest4')]
  return createPortal(
    <aside
      className={css.guidePanel}
      role="complementary"
      aria-label={t('guidePanelTitle')}
      style={{ left, top, height }}
    >
      <div className={css.guidePanelHead}>
        <span className={css.guidePanelLogo}><GuideArtIconSmall /></span>
        <span className={css.guidePanelTitle}>{t('guidePanelTitle')}</span>
        <button type="button" className={css.guidePanelClose} aria-label={t('guideClose')} onClick={onClose}>
          <IconCloseOutline16 size={14} aria-hidden="true" />
        </button>
      </div>

      <div className={css.guidePanelBody}>
        {/* 什么是 Skill */}
        <section className={css.guideSec}>
          <div className={css.guideSecHead}>
            <span className={css.guideSecIcon}><IconSkillOutline16 size={14} aria-hidden="true" /></span>
            <span className={css.guideSecTitle}>{t('guideWhat')}</span>
          </div>
          <p className={css.guideWhatDesc}>{t('guideWhatDesc')}</p>
          <div className={css.guideCaps}>
            {caps.map(([label, kind]) => (
              <span key={label} className={css.guideCap}>
                <span className={css.guideCapIcon}><CapIcon kind={kind} /></span>
                <span className={css.guideCapLabel}>{label}</span>
              </span>
            ))}
          </div>
        </section>

        {/* 四步流程 */}
        <section className={css.guideSec}>
          {steps.map(([num, title, desc]) => (
            <div key={num} className={css.guideStep}>
              <span className={css.guideStepNum}>{num}</span>
              <div className={css.guideStepBody}>
                <div className={css.guideStepTitleRow}>
                  <span className={css.guideStepTitle}>{title}</span>
                  <IconChevronRightOutline14 className={css.guideStepArrow} size={12} aria-hidden="true" />
                </div>
                <p className={css.guideStepDesc}>{desc}</p>
              </div>
            </div>
          ))}
        </section>

        {/* 最佳实践 */}
        <section className={css.guideBest}>
          <div className={css.guideBestTitle}>{t('guideBest')}</div>
          <ul className={css.guideBestList}>
            {bests.map((item) => (
              <li key={item} className={css.guideBestItem}>
                <CheckIcon />
                {item}
              </li>
            ))}
          </ul>
          <button type="button" className={css.guideMoreBtn} onClick={onClose}>
            <span>{t('guideMoreBest')}</span>
            <ArrowRightIcon size={12} />
          </button>
          <span className={css.guideBestArt} aria-hidden="true"><GuideArtIcon /></span>
        </section>
      </div>
    </aside>,
    document.body,
  )
}

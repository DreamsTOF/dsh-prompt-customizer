/**
 * skills/SkillCard — 技能卡（网格单元）与技能包分类编辑器。
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import {
  IconCloseOutline16, IconPlusOutline16, IconTrashOutline16, Tooltip,
} from '@deepseek-ai/dsh-client-ui-primitives'
import { CheckIcon, CopyIcon } from './icons.js'
import { skillT } from './locales.js'
import { css } from './styles.js'
import { MAX_BUNDLE_CATEGORIES, PRESET_BUNDLE_CATEGORIES, type SkillInfo } from './types.js'
/**
 * 技能卡片（Skills Hub 风格）：
 *   [图标瓷片] 标题(粗)  [复制钮]      [绿色开关]
 *   描述一行（省略号）
 *   [来源 pill][作用域 pill]        N 文件
 *   ────────────────────────────
 *   工具  [查看]  [查看文件按钮]   [归入/移出] [删除]
 */
/**
 * 分类编辑器：已选标签（可摘）+ 建议分类（点加）+ 自定义输入（回车加）。
 * 「新建技能包」与「设置分类」两处共用，值由父级持有。
 */
export function CategoryEditor({ value, onChange, label }: {
  value: string[]
  onChange: (next: string[]) => void
  label: string
}): JSX.Element {
  const [draft, setDraft] = useState('')
  const full = value.length >= MAX_BUNDLE_CATEGORIES
  const add = (raw: string): void => {
    const name = raw.trim().slice(0, 24)
    setDraft('')
    if (name === '' || value.includes(name) || full) return
    onChange([...value, name])
  }
  return (
    <div className={css.catEditor}>
      {value.length === 0 ? (
        <p className={css.catEmpty}>{skillT('bundleCatEmptyHint')}</p>
      ) : (
        <ul className={css.catSelected} aria-label={label}>
          {value.map((name) => (
            <li key={name} className={css.catSelectedTag}>
              <span className={css.catSelectedName}>{name}</span>
              <button
                type="button"
                className={css.catRemove}
                aria-label={skillT('bundleCatRemove', { name })}
                onClick={() => { onChange(value.filter((item) => item !== name)) }}
              >
                <IconCloseOutline16 size={11} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className={css.catSuggest} role="group" aria-label={skillT('bundleCatTitle')}>
        {PRESET_BUNDLE_CATEGORIES.filter((preset) => !value.includes(preset)).map((preset) => (
          <button
            type="button"
            key={preset}
            className={css.catPreset}
            disabled={full}
            title={skillT('bundleCatAddPreset', { name: preset })}
            onClick={() => { add(preset) }}
          >
            <span className={css.catPresetPlus} aria-hidden="true">+</span>{preset}
          </button>
        ))}
      </div>
      <input
        className={css.catInput}
        value={draft}
        placeholder={skillT('bundleCatPlaceholder')}
        aria-label={skillT('bundleCatCustom')}
        disabled={full}
        onChange={(event) => { setDraft(event.currentTarget.value) }}
        onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); add(draft) } }}
      />
      {full && <p className={css.catLimit}>{skillT('bundleCatLimit', { n: MAX_BUNDLE_CATEGORIES })}</p>}
    </div>
  )
}

export function SkillCard({ skill, bundleId, bundleName, enabled, lockedReason, scopeLabel, index, onToggle, onView, onAssign, onRemove, onDelete }: {
  skill: SkillInfo
  bundleId: string | null
  bundleName: string | null
  enabled: boolean
  /** 非空时开关被锁住（如：全局层已禁用，预设层无法打开），并显示原因。 */
  lockedReason?: string
  /** 当前作用域 pill 文案（「全部 Agent」= 全局）。 */
  scopeLabel: string
  /** 网格序号：入场错峰动画延时。 */
  index: number
  onToggle: (skill: SkillInfo, enabled: boolean) => void
  onView: (skill: SkillInfo) => void
  onAssign?: (skill: SkillInfo) => void
  onRemove?: (skill: SkillInfo) => void
  onDelete?: (skill: SkillInfo) => void
}): JSX.Element {
  const files = Array.isArray(skill.files) ? skill.files : []
  const description = skill.description ?? ''
  const [copied, setCopied] = useState(false)
  const copiedTimer = useRef<number | null>(null)
  useEffect(() => () => {
    if (copiedTimer.current !== null) window.clearTimeout(copiedTimer.current)
  }, [])

  const flashCopied = (): void => {
    setCopied(true)
    if (copiedTimer.current !== null) window.clearTimeout(copiedTimer.current)
    copiedTimer.current = window.setTimeout(() => { setCopied(false) }, 1200)
  }
  /** 复制技能名：主用 clipboard API，回退一个隐藏 textarea + execCommand。 */
  const copyName = (): void => {
    const fallback = (): void => {
      try {
        const textarea = document.createElement('textarea')
        textarea.value = skill.name
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      } catch {
        /* 复制失败静默：按钮仍给出已复制反馈，无副作用。 */
      }
    }
    try {
      if (navigator.clipboard !== undefined) {
        void navigator.clipboard.writeText(skill.name).then(flashCopied, () => { fallback(); flashCopied() })
      } else {
        fallback()
        flashCopied()
      }
    } catch {
      fallback()
      flashCopied()
    }
  }

  const toggleLabel = lockedReason ?? (enabled ? skillT('disableSkill') : skillT('enableSkill'))
  const fileMeta = typeof skill.fileCount === 'number' ? skill.fileCount : files.length
  return (
    <li
      className={css.skillCard}
      data-off={enabled ? undefined : 'true'}
      style={{ '--skm-i': index } as CSSProperties}
    >
      <div className={css.skillCardHead}>
        <span className={css.skillBadge} aria-hidden="true">skill</span>
        <button
          type="button"
          className={css.skillTitle}
          title={skill.name}
          onClick={() => { onView(skill) }}
        >
          {skill.name}
        </button>
        <span className={css.skillCardToggle}>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label={toggleLabel}
            title={toggleLabel}
            className={`${css.toggle} ${enabled ? css.toggleOn : css.toggleOff}`}
            disabled={lockedReason !== undefined}
            onClick={(event) => {
              event.stopPropagation()
              onToggle(skill, !enabled)
            }}
          >
            <span className={css.toggleKnob} aria-hidden="true" />
          </button>
        </span>
      </div>
      {description !== '' && (
        <button type="button" className={css.skillDesc} title={description} onClick={() => { onView(skill) }}>{description}</button>
      )}
      <div className={css.skillTags}>
        <span className={`${css.tag} ${css.tagSource}`}>{bundleName ?? skillT('tagLoose')}</span>
        <span className={`${css.tag} ${css.tagScope}`} data-off={enabled ? undefined : 'true'}>{scopeLabel}</span>
        {!enabled && <span className={`${css.tag} ${css.tagStatus}`}>{skillT('skillOffTag')}</span>}
        <span className={css.skillMeta}>{skillT('fileCount', { n: fileMeta })}</span>
      </div>
      <div className={css.skillCardFoot}>
        <span className={css.skillFootLabel}>{skillT('toolsLabel')}</span>
        <div className={css.skillCardActions}>
          <Tooltip label={skillT('copySkillName')} side="bottom" delayMs={500}>
            <button
              type="button"
              className={css.skillFootIcon}
              data-copied={copied ? 'true' : undefined}
              aria-label={copied ? skillT('copiedSkillName') : skillT('copySkillName')}
              title={copied ? skillT('copiedSkillName') : skillT('copySkillName')}
              onClick={copyName}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </button>
          </Tooltip>
          {bundleId !== null ? (
            <Tooltip label={skillT('removeSkill')} side="bottom" delayMs={500}>
              <button type="button" className={css.skillFootIcon} aria-label={skillT('removeSkill')}
                title={skillT('removeSkill')} onClick={() => { onRemove?.(skill) }}>
                <IconCloseOutline16 size={14} aria-hidden="true" />
              </button>
            </Tooltip>
          ) : (
            <Tooltip label={skillT('assignToBundle')} side="bottom" delayMs={500}>
              <button type="button" className={css.skillFootIcon} aria-label={skillT('assignToBundle')}
                title={skillT('assignToBundle')} onClick={() => { onAssign?.(skill) }}>
                <IconPlusOutline16 size={14} aria-hidden="true" />
              </button>
            </Tooltip>
          )}
          <Tooltip label={skillT('deleteSkillBtn')} side="bottom" delayMs={500}>
            <button type="button" className={`${css.skillFootIcon} ${css.skillFootIconDanger}`}
              aria-label={skillT('deleteSkillBtn')} title={skillT('deleteSkillBtn')}
              onClick={() => { onDelete?.(skill) }}>
              <IconTrashOutline16 size={14} aria-hidden="true" />
            </button>
          </Tooltip>
        </div>
      </div>
    </li>
  )
}

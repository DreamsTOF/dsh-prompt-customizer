/**
 * skills/SkillViewer — 技能文件查看器（大画幅 + 三档字号 + 全屏）及其偏好读写。
 */
import { type CSSProperties } from 'react'
import { Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import { renderSkillMarkdown } from './markdown.js'
import { css } from './styles.js'
import type { ViewerState } from './types.js'
/** ---------------------------------------------------------------- 查看器偏好 */

/** 字号三档（px）：小 / 标准 / 大。默认取中间一档。 */
export const VIEWER_FONT_SIZES = [13.5, 15, 17]
export const VIEWER_PREF_KEY = 'dsh.triad.skillViewer'
/** 三档字号的悬浮文案（与 VIEWER_FONT_SIZES 一一对应）。 */
export const VIEWER_FONT_LABELS = ['小字号', '标准字号', '大字号']

export interface ViewerPrefs { font: number; full: boolean }

/** 读查看器偏好（字号 + 全屏）；localStorage 不可用时回落到默认值。 */
export function readViewerPrefs(): ViewerPrefs {
  try {
    const raw = localStorage.getItem(VIEWER_PREF_KEY)
    if (typeof raw !== 'string' || raw === '') return { font: 1, full: false }
    const parsed = JSON.parse(raw) as Partial<ViewerPrefs>
    const font = typeof parsed.font === 'number' && parsed.font >= 0 && parsed.font < VIEWER_FONT_SIZES.length
      ? Math.trunc(parsed.font)
      : 1
    return { font, full: parsed.full === true }
  } catch {
    return { font: 1, full: false }
  }
}

/** 写查看器偏好；隐私模式等写入失败时静默降级为「只活到本次刷新」。 */
export function writeViewerPrefs(prefs: ViewerPrefs): void {
  try { localStorage.setItem(VIEWER_PREF_KEY, JSON.stringify(prefs)) } catch { /* 忽略 */ }
}

/** 全屏 / 还原：对角箭头，状态切换时靠 CSS 过渡翻转。 */
export function ViewerExpandIcon({ full }: { full: boolean }): JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {full
        ? <path d="M6.2 2.2v4h-4M9.8 2.2v4h4M6.2 13.8v-4h-4M9.8 13.8v-4h4" />
        : <path d="M2.2 6.2v-4h4M13.8 6.2v-4h-4M2.2 9.8v4h4M13.8 9.8v4h-4" />}
    </svg>
  )
}

export interface ViewRow { kind: 'dir' | 'file'; path: string; depth: number; main: boolean }

export function skillFileRows(files: string[]): ViewRow[] {
  const rows: ViewRow[] = []
  const seenDirs = new Set<string>()
  for (const path of files) {
    const parts = path.split('/')
    let dirPath = ''
    for (let i = 0; i < parts.length - 1; i += 1) {
      dirPath = dirPath === '' ? parts[i] : dirPath + '/' + parts[i]
      if (!seenDirs.has(dirPath)) {
        seenDirs.add(dirPath)
        rows.push({ kind: 'dir', path: dirPath + '/', depth: i, main: false })
      }
    }
    rows.push({ kind: 'file', path, depth: parts.length - 1, main: path === 'SKILL.md' })
  }
  return rows
}

/**
 * 查看器弹窗：左侧文件树 + 右侧渲染内容；工具条切三档字号与全屏。
 * viewer 为 null 时不渲染（调用方条件挂载）。
 */
export function SkillViewer({
  t, viewer, viewerFont, viewerFull, onFontLevel, onToggleFull, onSelectFile, onClose,
}: {
  t: (key: string, params?: Record<string, string | number>) => string
  viewer: ViewerState | null
  viewerFont: number
  viewerFull: boolean
  onFontLevel: (level: number) => void
  onToggleFull: () => void
  onSelectFile: (filePath: string) => void
  onClose: () => void
}): JSX.Element | null {
  if (viewer === null) return null
  return (
        <Modal
          open
          onClose={() => { onClose() }}
          closeLabel={t('close')}
          title={viewer.skill.name + (viewer.file === 'SKILL.md' ? '' : ' · ' + viewer.file)}
          className={css.viewerModal + (viewerFull ? ' ' + css.viewerModalFull : '')}
          contentClassName={css.viewerBody}
        >
          {/* 工具条：当前文件 + 字号三档 + 全屏切换（偏好持久化） */}
          <div className={css.viewerToolbar}>
            <span className={css.viewerPath}>
              <b>{viewer.file}</b>
              <span>{t('viewerFilesCount', { n: Array.isArray(viewer.skill.files) ? viewer.skill.files.length : 0 })}</span>
            </span>
            <span className={css.viewerToolGroup} role="group" aria-label={t('viewerFont')}>
              {VIEWER_FONT_SIZES.map((size, level) => (
                <button
                  key={size}
                  type="button"
                  className={css.viewerToolBtn + (level === 0 ? ' ' + css.viewerToolBtnA1 : level === 2 ? ' ' + css.viewerToolBtnA3 : '')}
                  data-active={viewerFont === level ? 'true' : undefined}
                  title={VIEWER_FONT_LABELS[level]}
                  aria-label={VIEWER_FONT_LABELS[level]}
                  aria-pressed={viewerFont === level}
                  onClick={() => { onFontLevel(level) }}
                >A</button>
              ))}
            </span>
            <button
              type="button"
              className={css.viewerToolBtn + ' ' + css.viewerToolBtnFrame}
              data-active={viewerFull ? 'true' : undefined}
              title={viewerFull ? t('viewerExitFull') : t('viewerFull')}
              aria-label={viewerFull ? t('viewerExitFull') : t('viewerFull')}
              aria-pressed={viewerFull}
              onClick={onToggleFull}
            >
              <ViewerExpandIcon full={viewerFull} />
            </button>
          </div>
          <div className={css.viewerLayout}>
            <nav className={css.viewerNav} aria-label={t('viewerNav')}>
              {skillFileRows(Array.isArray(viewer.skill.files) ? viewer.skill.files : []).map((row, index) => (
                <div
                  key={row.path + '-' + String(index)}
                  className={css.viewerNavItem + (row.kind === 'dir' ? ' ' + css.viewerNavDir : '')}
                  data-active={row.kind === 'file' && row.path === viewer.file ? 'true' : undefined}
                  data-dir={row.kind === 'dir' ? 'true' : undefined}
                  style={{ paddingLeft: 8 + row.depth * 14 }}
                  title={row.path}
                  onClick={row.kind === 'file' ? () => { onSelectFile(row.path) } : undefined}
                >
                  {row.kind === 'dir' ? '📁 ' : '📄 '}
                  {row.path}
                </div>
              ))}
            </nav>
            <div className={css.viewerContent} style={{ '--skm-vfs': `${String(VIEWER_FONT_SIZES[viewerFont])}px` } as CSSProperties}>
              {viewer.loading === true
                ? t('previewLoading')
                : viewer.error !== undefined
                  ? viewer.error
                  : <div dangerouslySetInnerHTML={{ __html: renderSkillMarkdown(viewer.content ?? '') }} />}
            </div>
          </div>
        </Modal>
  )
}

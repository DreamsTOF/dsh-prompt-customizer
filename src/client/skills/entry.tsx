/**
 * 能力（技能 + MCP 管理）入口：侧边栏导航行。
 *
 * 点击打开覆盖会话主区的面板（跟点会话一样占住主区，移动端回退底部 sheet），
 * 面板顶部 SKILL / MCP 双层顶层 tab。
 */
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import { SkillsPanel } from './SkillsPanel'
import { ensureModalAnimStyles, useModalClose } from '../modal-animation'
import { ErrorBoundary } from '../error-boundary'
import { NavButton, NavPortal, ensureNavMount, ensureNavStyles, navAnchorFrom, usePanelAutoClose, useRail } from '../sidebar-nav'
import { ensureShellStyles, type PopoverAnchor } from '../popover-shell'

/** 从点击事件取锚点：所在导航行右缘 +8、按钮顶缘 -6。 */
function anchorFromEvent(e: React.MouseEvent<HTMLButtonElement>): PopoverAnchor | null {
  return navAnchorFrom(e.currentTarget)
}

/** 技能入口：导航行 + 覆盖会话主区的面板。 */
function SkillsEntry(): JSX.Element {
  ensureModalAnimStyles()
  ensureShellStyles()
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState<PopoverAnchor | null>(null)
  const { closing, requestClose } = useModalClose(open, () => { setOpen(false) })
  const rail = useRail()
  usePanelAutoClose('skills', open, requestClose)
  return (
    <>
      {/* 能力（闪电，Feather zap 线性风，自绘图标） */}
      <NavButton
        icon={(
          <svg width={rail ? 18 : 16} height={rail ? 18 : 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
          </svg>
        )}
        label="能力"
        rail={rail}
        expanded={open}
        onClick={e => {
          e.stopPropagation()
          setAnchor(anchorFromEvent(e))
          setOpen(true)
        }}
      />
      {open && (
        <ErrorBoundary label="技能面板" fallback={null} onError={requestClose}>
          <SkillsPanel closing={closing} onClose={requestClose} anchor={anchor} />
        </ErrorBoundary>
      )}
    </>
  )
}

/** 导航行应用：能力入口 portal 到 nav host 的 skills 槽。 */
function SkillsNavApp(): JSX.Element | null {
  ensureNavStyles()
  return (
    <NavPortal name="skills">
      <SkillsEntry />
    </NavPortal>
  )
}

export function apply(ctx: ClientContext): void {
  ctx.effect(() => {
    ensureNavMount()
    // React 根挂在游离容器上（React 18 支持容器后入树）；实际 UI 经 portal
    // 落到 sidebar-nav 的槽位 div。
    const holder = document.createElement('div')
    const root = createRoot(holder)
    root.render(<SkillsNavApp />)
    return () => { root.unmount() }
  }, 'triad: skills nav entry')
}

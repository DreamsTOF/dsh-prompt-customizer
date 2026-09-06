/**
 * shell — 「覆盖会话主区」的面板外壳（提示词管理面板）。
 *
 * 跟点会话一致的行为（与 dsh-triad 的 popover-shell 同款交互，各自独立实现）：
 *  - drawer 模式：直接盖住会话主区（侧栏右缘 → 视口右缘，全高，无遮罩），
 *    自右向左滑入，关闭反向收回；侧栏保持可点，随时切会话（切会话自动收面板）；
 *  - 窄视口回退全屏 sheet（上滑入场，带遮罩）；
 *  - Esc 关闭走 props.onClose。
 *
 * z 层级：mask 999 / card 1000——与宿主 Modal 同层；面板内部 portal 到 body
 * 的二级弹窗 DOM 顺序更靠后，自然浮于本壳之上。
 */

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

const STYLE_ID = 'dsh-prompt-customizer-shell-styles'

/** 动画时长（ms），CSS 与 JS 计时保持一致。 */
export const PANEL_ANIM_MS = 240

/** 会话主区左缘回退值（px）：侧栏实测失败时盖住 280px 右侧全部区域。 */
const FALLBACK_MAIN_LEFT = 280
/** 窄屏阈值（px）：低于该宽度回退全屏 sheet。 */
const NARROW_VP = 768

/** 读会话主区左缘 = 侧栏列右缘（跟随侧栏折叠变化；失败回退 280）。 */
function readMainLeft(): number {
  try {
    const host = document.getElementById('dsh-prompt-customizer-nav-host')
    if (host !== null) {
      const hostRight = host.getBoundingClientRect().right
      let node = host.parentElement
      while (node !== null && node !== document.body) {
        const rect = node.getBoundingClientRect()
        if (rect.height >= window.innerHeight * 0.7 && rect.left <= 8 && rect.right >= hostRight - 4) {
          return Math.round(rect.right)
        }
        node = node.parentElement
      }
    }
  } catch { /* 量不到就回退固定值 */ }
  return FALLBACK_MAIN_LEFT
}

const SHEET = `
@keyframes pc-modal-drawer-in{from{opacity:0;transform:translateX(56px)}to{opacity:1;transform:translateX(0)}}
@keyframes pc-modal-drawer-out{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(40px)}}
@keyframes pc-modal-slide-in{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes pc-modal-slide-out{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(24px)}}
@keyframes pc-modal-mask-in{from{opacity:0}to{opacity:1}}
@keyframes pc-modal-mask-out{from{opacity:1}to{opacity:0}}
/* ── 遮罩：淡入淡出（仅窄屏 sheet 模式有遮罩） ── */
.pcsh-mask{position:fixed;inset:0;z-index:999;background:var(--dsw-alias-bg-mask-1,rgba(0,0,0,.45))}
.pcsh-mask[data-anim='in']{animation:pc-modal-mask-in ${PANEL_ANIM_MS}ms ease both}
.pcsh-mask[data-anim='out']{animation:pc-modal-mask-out ${PANEL_ANIM_MS}ms ease both}
/* ── 卡片：会话式右侧抽屉 / 窄屏全屏 sheet 回退 ── */
.pcsh-card{position:fixed;z-index:1000;display:flex;flex-direction:column;box-sizing:border-box;background:var(--dsw-specific-menu,var(--dsw-alias-bg-layer-2,#16181d));color:var(--dsw-alias-label-primary,#eee);overflow:hidden}
.pcsh-card[data-mode='drawer']{top:0;right:0;bottom:0;height:100vh;height:100dvh;border:none;border-left:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.18));box-shadow:none;transition:left ${PANEL_ANIM_MS}ms cubic-bezier(.2,.8,.2,1)}
/* in 动画不得带 fill-mode（both/forwards 会残留 to 帧 transform，使卡片成为
   后代 position:fixed 元素的包含块）；out 需要 forwards 保持隐藏态直到卸载。 */
.pcsh-card[data-mode='drawer'][data-anim='in']{animation:pc-modal-drawer-in ${PANEL_ANIM_MS}ms cubic-bezier(.2,.8,.2,1)}
.pcsh-card[data-mode='drawer'][data-anim='out']{animation:pc-modal-drawer-out ${PANEL_ANIM_MS}ms cubic-bezier(.4,0,.2,1) both}
.pcsh-card[data-mode='sheet'][data-anim='in']{animation:pc-modal-slide-in ${PANEL_ANIM_MS}ms cubic-bezier(.2,.8,.2,1)}
.pcsh-card[data-mode='sheet'][data-anim='out']{animation:pc-modal-slide-out ${PANEL_ANIM_MS}ms cubic-bezier(.4,0,.2,1) both}
/* ── 窄屏：任何模式强制全屏 sheet（!important 压过内联 left/width）。 ── */
@media (max-width: 767.98px){
  .pcsh-card{
    left:0 !important;top:0 !important;right:auto !important;bottom:auto !important;
    width:100vw !important;max-width:100vw !important;
    height:100vh !important;height:100dvh !important;max-height:100vh !important;max-height:100dvh !important;
    border-radius:0 !important;transform:none !important;
  }
}
@media (prefers-reduced-motion:reduce){
  .pcsh-mask,.pcsh-card{animation:none!important}
  .pcsh-card{transition:none!important}
}
`

/** 注入外壳样式（幂等）。 */
export function ensureShellStyles(): void {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID) !== null) return
  const tag = document.createElement('style')
  tag.id = STYLE_ID
  tag.dataset.plugin = 'dsh-prompt-customizer'
  tag.textContent = SHEET
  document.head.appendChild(tag)
}

/** PanelShell 属性。 */
export interface PanelShellProps {
  /** 正在播放收回动画（此时仍挂载，播 out 动画）。 */
  closing: boolean
  /** 请求关闭（Esc / 关闭钮统一走这里）。 */
  onClose: () => void
  /** 无障碍名（role=dialog 的 aria-label）。 */
  ariaLabel: string
  children: ReactNode
}

/** 渲染覆盖会话主区的抽屉面板（portal 到 body；窄屏回退全屏 sheet + 遮罩）。 */
export function PanelShell({ closing, onClose, ariaLabel, children }: PanelShellProps): JSX.Element {
  // 视口宽度 + 会话主区左缘走 state：窗口缩放/侧栏折叠时实时跟随。
  const [vw, setVw] = useState(window.innerWidth)
  const [mainLeft, setMainLeft] = useState(readMainLeft)
  useEffect(() => {
    const reread = (): void => {
      setVw(window.innerWidth)
      setMainLeft(readMainLeft())
    }
    reread()
    window.addEventListener('resize', reread)
    const observer = new MutationObserver(reread)
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-sidebar-collapsed'], subtree: true })
    const timer = window.setInterval(reread, 1500)
    return () => {
      window.removeEventListener('resize', reread)
      observer.disconnect()
      window.clearInterval(timer)
    }
  }, [])
  const anim = closing ? 'out' : 'in'
  // 窄屏回退全屏 sheet；桌面端直接盖住会话主区（left=侧栏右缘，右拉满）。
  const narrow = vw < NARROW_VP
  const mode = narrow ? 'sheet' : 'drawer'
  const style: CSSProperties | undefined = narrow ? undefined : { left: mainLeft }

  useEffect(() => {
    if (closing) return undefined
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey) }
  }, [closing, onClose])

  // portal 到 body：入口 portal 在侧边栏导航槽里，而槽位宿主是手工插进 DSH
  // 自有 React 树的裸节点——弹层留在里面会被侧边栏重渲染连带回收，且
  // position:fixed 会被 transform 祖先变成局部定位。挪到 body 后不受影响。
  return createPortal(
    <>
      {narrow && (
        <div className="pcsh-mask" data-anim={anim} aria-hidden="true" onClick={onClose} />
      )}
      <div
        className="pcsh-card"
        data-anim={anim}
        data-mode={mode}
        style={style}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
      >
        {children}
      </div>
    </>,
    document.body,
  )
}

/**
 * 面板关闭动画状态机：先置 closing 播放收回动画，结束后再真正 onClose。
 * `open` 再次变 true 时重置 closing（否则上一次收回动画会把 closing 卡在 true）。
 */
export function usePanelClose(open: boolean, onClose: () => void, durationMs = PANEL_ANIM_MS): { closing: boolean; requestClose: () => void } {
  const [closing, setClosing] = useState(false)
  useEffect(() => {
    if (open) setClosing(false)
  }, [open])
  useEffect(() => {
    if (!closing) return undefined
    const timer = window.setTimeout(() => onClose(), durationMs)
    return () => { window.clearTimeout(timer) }
  }, [closing, onClose, durationMs])
  const requestClose = (): void => setClosing(true)
  return { closing, requestClose }
}

/**
 * nav — 侧边栏导航入口（独立于设置栏的面板入口）。
 *
 * 在 sidebar 底部的「设置」行（`[data-slot="sidebar.settings"]`，harness
 * SidebarRoot 的稳定插槽）正上方插一个 host，host 内放一个 `data-nav-slot`
 * 槽位容器；入口组件经 `useNavSlot` 轮询拿到槽位后 `createPortal` 进去。
 * 选底部而不选工作区上方：顶部区域是插件抢座重灾区（任务看板等组件都往
 * 新会话/工作区一带插），settings 插槽由宿主自有渲染树持有，没人争。
 *
 * host 是手工插进 DSH 自有 React 树的裸节点（React 不认识它），因此用
 * MutationObserver 盯父节点补位 + 低频轮询兜底重挂（HMR、React 重建侧边栏
 * 时入口不会消失）。
 *
 * rail 折叠态由 `useRail` 观察框架容器的 `data-sidebar-collapsed` 属性切换，
 * 折叠时按钮收缩为图标。
 *
 * 结构与 dsh-triad 的 sidebar-nav 同款（各自独立创建 host，互不依赖）。
 */

import { useEffect, useState, type MouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/** nav host id（本模块创建）。 */
const HOST_ID = 'dsh-prompt-customizer-nav-host'
/** slots 渲染器的稳定锚点（SidebarRoot 暴露的 `sidebar.settings` slot）。 */
const ANCHOR_SELECTOR = '[data-slot="sidebar.settings"]'
/** 侧边栏折叠观察：框架容器选择在所有 sidebar 状态（wide/rail）下都唯一。 */
const FRAME_SELECTOR = 'div:has(> [data-shell-overlay])'

/** 槽位名（本插件只有一个入口）。 */
export type NavSlotName = 'prompt'

/** 建一个槽位容器（portal 目标）。 */
function makeSlot(name: string): HTMLDivElement {
  const slot = document.createElement('div')
  slot.dataset.navSlot = name
  return slot
}

let started = false
let pollTimer = 0
let hostObserver: MutationObserver | undefined

/** 确保 host 已创建并插到 `sidebar.settings` slot 之前（幂等）。 */
function ensureHostPlaced(): boolean {
  const anchor = document.querySelector(ANCHOR_SELECTOR)
  if (anchor === null) return false
  const parent = anchor.parentElement
  if (parent === null) return false
  let host = document.getElementById(HOST_ID) as HTMLDivElement | null
  if (host === null) {
    host = document.createElement('div')
    host.id = HOST_ID
    host.dataset.plugin = 'dsh-prompt-customizer'
    host.appendChild(makeSlot('prompt'))
  }
  // 就位判定：host 与锚点同父、且在锚点之前。
  const inPlace = host.parentElement === parent
    && (anchor.compareDocumentPosition(host) & Node.DOCUMENT_POSITION_PRECEDING) !== 0
  if (!inPlace) {
    parent.insertBefore(host, anchor)
  }
  return true
}

/**
 * 盯住宿主的直接父节点，宿主一被摘掉立刻补位。
 *
 * host 是手工 insertBefore 进 DSH 自有 React 树的裸节点——侧边栏任何一次
 * children 重排都可能把它回收掉。只观察父节点的 childList（不开 subtree）；
 * 父节点整体被替换时观察会失联，由轮询兜底重挂。补位后 ensureHostPlaced
 * 不再改动 DOM，不会自激。
 */
function watchHostParent(): void {
  const parent = document.getElementById(HOST_ID)?.parentElement
  if (parent === undefined || parent === null) return
  hostObserver?.disconnect()
  hostObserver = new MutationObserver(() => {
    const before = document.getElementById(HOST_ID)?.parentElement
    ensureHostPlaced()
    if (document.getElementById(HOST_ID)?.parentElement !== before) watchHostParent()
  })
  hostObserver.observe(parent, { childList: true })
}

/**
 * 挂载导航区 host（幂等单例）。首次调用者持有清理权（停轮询、移除 host），
 * 后续调用返回 no-op。
 */
export function ensureNavMount(): () => void {
  if (typeof document === 'undefined') return () => {}
  if (started) return () => {}
  started = true
  ensureHostPlaced()
  watchHostParent()
  // 低频轮询兜底：侧边栏容器整体被替换（观察失联）时重挂（HMR、React 重建等）。
  pollTimer = window.setInterval(() => {
    ensureHostPlaced()
    if (hostObserver === undefined) watchHostParent()
  }, 1500)
  return () => {
    window.clearInterval(pollTimer)
    pollTimer = 0
    hostObserver?.disconnect()
    hostObserver = undefined
    started = false
    document.getElementById(HOST_ID)?.remove()
  }
}

/** 轮询获取指定槽位容器（未就位时返回 null，组件据此暂不渲染）。
 *
 * **永不停止**：未就位时 100ms 阶梯快查（10 次后退 400ms）；找到后退化为
 * 800ms 慢速校验——同一节点 setSlot 被 React 直接跳过，零渲染开销。这样
 * 槽位一旦被移除/替换（HMR、React 重建 host），portal 会自动迁到新槽。
 */
export function useNavSlot(name: NavSlotName): HTMLElement | null {
  const [slot, setSlot] = useState<HTMLElement | null>(null)
  useEffect(() => {
    let timer = 0
    let tries = 0
    const poll = (): void => {
      const found = document.querySelector<HTMLElement>(`[data-nav-slot='${name}']`)
      if (found !== null) tries = 0
      else tries += 1
      setSlot(found)
      timer = window.setTimeout(poll, found !== null ? 800 : tries <= 10 ? 100 : 400)
    }
    poll()
    return () => { window.clearTimeout(timer) }
  }, [name])
  return slot
}

/** 侧边栏折叠态（rail = 只显示图标）。
 *
 * 观察 body 子树的 data-sidebar-collapsed（框架容器可能在折叠时被 React
 * 重挂，盯单节点会失联）+ 低频兜底重读。值不变时 React 自动跳过渲染。
 */
export function useRail(): boolean {
  const [rail, setRail] = useState(() =>
    document.querySelector(FRAME_SELECTOR)?.hasAttribute('data-sidebar-collapsed') ?? false)
  useEffect(() => {
    const read = (): void => {
      setRail(document.querySelector(FRAME_SELECTOR)?.hasAttribute('data-sidebar-collapsed') ?? false)
    }
    read()
    const observer = new MutationObserver(read)
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-sidebar-collapsed'], subtree: true })
    const timer = window.setInterval(read, 1500)
    return () => {
      observer.disconnect()
      window.clearInterval(timer)
    }
  }, [])
  return rail
}

const STYLE_ID = 'dsh-prompt-customizer-nav-styles'

const SHEET = `
/* 导航行：与侧边栏原生行同款几何（透明底 + hover 高亮 + 文字省略） */
.dsh-pc-nav-btn{position:relative;display:flex;align-items:center;gap:8px;width:calc(100% - 4px);height:34px;padding:0 10px;margin:0 2px 4px;box-sizing:border-box;border:none;border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary,#eee);font-size:14px;line-height:20px;font-family:inherit;cursor:pointer;text-align:left;user-select:none;overflow:hidden;transition:background 120ms ease}
.dsh-pc-nav-btn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
.dsh-pc-nav-btn[data-open='true']{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
.dsh-pc-nav-btn>svg{flex:none;color:var(--dsw-alias-label-secondary,#bbb)}
.dsh-pc-nav-label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* 折叠 rail 态：只留图标 */
.dsh-pc-nav-btn[data-rail='true']{width:36px;height:36px;padding:0;margin:0 0 8px;justify-content:center;border-radius:8px}
/* nav host：槽位 display:contents，按钮直接撑满整行。 */
#dsh-prompt-customizer-nav-host{display:flex;flex-direction:column;align-items:stretch;width:100%}
#dsh-prompt-customizer-nav-host>[data-nav-slot]{display:contents}
`

/** 注入导航行样式（幂等）。 */
export function ensureNavStyles(): void {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID) !== null) return
  const tag = document.createElement('style')
  tag.id = STYLE_ID
  tag.dataset.plugin = 'dsh-prompt-customizer'
  tag.textContent = SHEET
  document.head.appendChild(tag)
}

/** NavButton 属性。 */
export interface NavButtonProps {
  /** 行图标（svg 元素，颜色由样式表统一着色）。 */
  icon: ReactNode
  /** 行文字（rail 态不渲染）。 */
  label: string
  /** 折叠态（只留图标）。 */
  rail?: boolean
  /** 面板展开态（高亮底色）。 */
  expanded?: boolean
  /** 无障碍名（缺省用 label）。 */
  ariaLabel?: string
  /** 点击。 */
  onClick: (e: MouseEvent<HTMLButtonElement>) => void
}

/** 渲染一条导航行按钮。 */
export function NavButton({
  icon, label, rail = false, expanded = false, ariaLabel, onClick,
}: NavButtonProps): JSX.Element {
  return (
    <button
      type="button"
      className="dsh-pc-nav-btn"
      data-rail={rail || undefined}
      data-open={expanded || undefined}
      aria-label={ariaLabel ?? label}
      aria-expanded={expanded}
      title={rail ? (ariaLabel ?? label) : undefined}
      onClick={onClick}
    >
      {icon}
      {!rail && <span className="dsh-pc-nav-label">{label}</span>}
    </button>
  )
}

/** 便捷组合：portal 到指定槽位（slot 未就位时不渲染）。 */
export function NavPortal({ name, children }: { name: NavSlotName; children: ReactNode }): JSX.Element | null {
  const slot = useNavSlot(name)
  if (slot === null) return null
  return createPortal(children, slot)
}

/** 面板互斥 + 切会话自动收（与 dsh-triad 的面板互相礼让）。
 *
 *  - 互斥：打开时广播自己的事件，并监听本插件与 dsh-triad 的同类广播，
 *    别的面板打开时自动收回（主区同时只被一个面板占住）；
 *  - 切会话自动收：面板盖住会话主区、无遮罩，侧栏保持可点；侧栏会话区内
 *    的点击（自己导航行与面板本体除外）直接收面板。
 */
const PANEL_OPEN_EVENT = 'dsh-prompt-customizer:panel-open'
/** dsh-triad 的面板广播（装了 triad 时互相礼让；detail 永远不等于本插件名）。 */
const TRIAD_PANEL_OPEN_EVENT = 'dsh-triad:panel-open'

/** 点击是否落在侧栏列内（按几何判定，不依赖宿主的哈希类名）。 */
function clickInSidebar(target: Element): boolean {
  let node: Element | null = target
  while (node !== null && node !== document.body) {
    const rect = node.getBoundingClientRect()
    if (
      rect.height >= window.innerHeight * 0.7
      && rect.left <= 8
      && rect.right <= window.innerWidth * 0.6
    ) return true
    node = node.parentElement
  }
  return false
}

export function usePanelAutoClose(open: boolean, requestClose: () => void): void {
  // 打开时广播，挤掉别的面板。
  useEffect(() => {
    if (!open) return
    window.dispatchEvent(new CustomEvent(PANEL_OPEN_EVENT, { detail: 'prompt-customizer' }))
  }, [open])
  // 听别人的广播 + 侧栏会话区点击。detail 是本插件自己的广播，忽略。
  useEffect(() => {
    if (!open) return undefined
    const onSiblingOpen = (event: Event): void => {
      if ((event as CustomEvent<unknown>).detail !== 'prompt-customizer') requestClose()
    }
    const onDocClick = (event: globalThis.MouseEvent): void => {
      const target = event.target
      if (!(target instanceof Element)) return
      // 自己导航行、面板本体不收。
      if (target.closest(`#${HOST_ID}, .pcsh-card`) !== null) return
      if (clickInSidebar(target)) requestClose()
    }
    window.addEventListener(PANEL_OPEN_EVENT, onSiblingOpen)
    window.addEventListener(TRIAD_PANEL_OPEN_EVENT, onSiblingOpen)
    document.addEventListener('click', onDocClick, true)
    return () => {
      window.removeEventListener(PANEL_OPEN_EVENT, onSiblingOpen)
      window.removeEventListener(TRIAD_PANEL_OPEN_EVENT, onSiblingOpen)
      document.removeEventListener('click', onDocClick, true)
    }
  }, [open, requestClose])
}

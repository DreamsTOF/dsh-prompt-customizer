/**
 * dsh-prompt-customizer — 浏览器端（TypeScript 源码）。
 *
 * 在侧边栏注册一个「提示词」入口按钮（不再挤在设置栏里），点击打开覆盖
 * 会话主区的「提示词管理」面板：左栏勾选提示词 / 工具，右栏实时预览最终
 * 装配；顶部 Tab 切换 agent 预设（编辑目标）。面板从宿主的
 * `/api/prompt-customizer/inventory` 拉取当前生效的段 / 工具清单，屏蔽、
 * 替换、注入提示词段并隐藏工具；所有写入走插件自有路由（宿主端的
 * config.yaml），保存按钮一次落盘。
 *
 * 由 tsdown 打包为 client/client.js（__ModuleLoader__ factory bundle）；
 * 外部依赖只有 loader 模块表中的 react 入口。
 */
import { createElement as h, useState, type ReactElement } from 'react'
import { createRoot } from 'react-dom/client'
import { DICT, type Translate } from './locales.ts'
import { Panel } from './Panel.tsx'
import { ErrorBoundary } from './error-boundary.tsx'
import { NavButton, NavPortal, ensureNavMount, ensureNavStyles, usePanelAutoClose, useRail } from './nav.tsx'
import { PanelShell, ensureShellStyles, usePanelClose } from './shell.tsx'

const NS = 'prompt-customizer'

export const name = 'prompt-customizer'
// 只依赖 locale 服务：导航入口是自建 host + DOM portal，不经过宿主 slots。
export const inject = ['locale']

/** 本插件用到的客户端 cordis 上下文的最小子集。 */
interface ClientContext {
  effect(callback: () => unknown, label?: string): void
  locale: {
    register(namespace: string, dicts: { zh: Record<string, string>; en: Record<string, string> }): unknown
    bind(namespace: string): Translate
  }
}

/** 提示词入口：导航行按钮 + 点击打开覆盖主区的面板。 */
function PromptEntry({ t }: { t: Translate }): ReactElement {
  const [open, setOpen] = useState(false)
  const { closing, requestClose } = usePanelClose(open, () => { setOpen(false) })
  const rail = useRail()
  usePanelAutoClose(open, requestClose)
  return h('div', null, [
    h(NavButton, {
      // 文档线性风图标（file-text），颜色由导航样式表统一着色。
      icon: h('svg', { width: rail ? 18 : 16, height: rail ? 18 : 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true' }, [
        h('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }),
        h('path', { d: 'M14 2v6h6' }),
        h('path', { d: 'M16 13H8' }),
        h('path', { d: 'M16 17H8' }),
        h('path', { d: 'M10 9H8' }),
      ]),
      label: t('navShort'),
      rail,
      expanded: open,
      onClick: () => { setOpen(true) },
    }),
    // 面板单独包边界：面板内部崩了只收面板，导航行按钮留着（否则 React 18
    // 会卸载整个 root，侧边栏入口凭空消失且控制台无痕）。
    open ? h(ErrorBoundary, {
      key: 'panel',
      label: '提示词管理面板',
      fallback: null,
      onError: () => requestClose(),
      children: h(PanelShell, {
        closing,
        onClose: requestClose,
        ariaLabel: t('nav'),
        children: h(Panel, { t, onClose: requestClose }),
      }),
    }) : null,
  ])
}

/** 导航行应用：入口 portal 到自建 nav host 的槽位。 */
function PromptNavApp({ t }: { t: Translate }): ReactElement {
  return h('div', null,
    h(NavPortal, { name: 'prompt', children: h(PromptEntry, { t }) }))
}

export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, DICT), 'prompt-customizer: locale')
  const t = ctx.locale.bind(NS)

  // 侧边栏入口：自建 host 插在 sidebar.workspaces 槽位之前（见 nav.tsx），
  // React 根挂在游离容器上（React 18 支持容器后入树）；实际 UI 经 portal
  // 落到 nav host 的槽位 div。
  ctx.effect(() => {
    ensureNavMount()
    ensureNavStyles()
    ensureShellStyles()
    const holder = document.createElement('div')
    const root = createRoot(holder)
    root.render(h(PromptNavApp, { t }))
    return () => { root.unmount() }
  }, 'prompt-customizer: sidebar nav entry')
}

/**
 * prompt — 提示词管理（上游 dsh-prompt-customizer v0.5.1 的浏览器半身）。
 *
 * 迁移范围：只保留面板本体（Panel 与它的分栏 / 预览 / 快照库）。上游的
 * 侧边栏入口与抽屉外壳（nav.tsx / shell.tsx）由 triad 的「提示词」顶层 tab
 * 取代；宿主路由仍是 /api/prompt-customizer/*（见 vendor/prompt-customizer）。
 *
 * 与上游的唯一差异：面板不再自己开窗（无关闭按钮、无遮罩与侧栏几何推算）。
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import { DICT, type Translate } from './locales.ts'

/** 文案命名空间（与上游一致，避免两份字典）。 */
const NS = 'prompt-customizer'

/** triad 客户端上下文里本模块用到的部分。 */
interface PromptLocaleHost {
  register(namespace: string, dicts: { zh: Record<string, string>; en: Record<string, string> }): unknown
  bind(namespace: string): Translate
}

/** apply 时绑定的翻译函数（跟随 DSH 当前语言）。 */
let bound: Translate | undefined

/** 面板文案函数：applyPrompt 之前回落到中文表（面板不会因缺少 locale 服务变空白）。 */
export function promptT(): Translate {
  if (bound !== undefined) return bound
  return (key, params) => {
    let text = (DICT.zh as Record<string, string>)[key] ?? key
    if (params !== undefined) {
      for (const name of Object.keys(params)) text = text.split(`{${name}}`).join(String(params[name]))
    }
    return text
  }
}

/** 注册文案命名空间；面板本体由「提示词」tab 渲染（这里不建任何入口）。 */
export function applyPrompt(ctx: ClientContext): void {
  const locale = (ctx as unknown as { locale?: PromptLocaleHost }).locale
  if (locale === undefined || typeof locale.bind !== 'function') {
    console.warn('[dsh-prompt-customizer] prompt locale unavailable: 提示词面板回落中文文案')
    return
  }
  ctx.effect(() => locale.register(NS, DICT), 'triad: prompt locale')
  bound = locale.bind(NS)
}

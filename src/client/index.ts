/**
 * dsh-prompt-customizer — 浏览器端（TypeScript 源码）。
 *
 * 注册一个「提示词定制」设置分区（侧边栏入口）及插件设置卡片。面板从宿主
 * 的 `/api/prompt-customizer/inventory` 拉取当前生效的段 / 工具清单，让用户
 * 屏蔽、替换、注入提示词段并隐藏工具。所有写入都走绑定的设置作用域
 * （`prompt-customizer` 命名空间），实时生效。
 *
 * 由 tsdown 打包为 client/client.js（__ModuleLoader__ factory bundle）；
 * 唯一的外部依赖是 loader 模块表中的 react 入口。
 */
import { createElement as h, useEffect, useState, type ReactElement } from 'react'
import { DICT, type Translate } from './locales.ts'
import { s } from './styles.ts'
import type { Config, Inventory, SettingsScope } from './types.ts'
import { SectionsTab } from './SectionsTab.tsx'
import { ToolsTab } from './ToolsTab.tsx'
import { PresetsTab } from './PresetsTab.tsx'
import { PreviewTab } from './PreviewTab.tsx'

const NS = 'prompt-customizer'
const INVENTORY_URL = '/api/prompt-customizer/inventory'

export const name = 'prompt-customizer'
export const inject = ['slots', 'locale']

/** 本插件用到的客户端 cordis 上下文的最小子集。 */
interface ClientContext {
  effect(callback: () => unknown, label?: string): void
  locale: {
    register(namespace: string, dicts: { zh: Record<string, string>; en: Record<string, string> }): unknown
    bind(namespace: string): Translate
  }
  inject(services: string[], callback: (scoped: SettingsScopeHost) => void): void
}

/** 设置卡片需要的宿主能力面（settingsScope 传输层 + 插槽注册）。 */
interface SettingsScopeHost {
  settingsScope: {
    bind(options: { namespace: string }): SettingsScope
  }
  slots: {
    inject(name: string, register: () => unknown): void
    register(meta: Record<string, unknown>, render: () => unknown): unknown
  }
}

export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, DICT), 'prompt-customizer: locale')
  const t = ctx.locale.bind(NS)

  // 注册为独立的设置分区（侧边栏菜单项），面板只出现在「提示词定制」下，
  // 而不是作为卡片塞进「插件」设置列表。通过 NESTED inject 拿到 settingsScope
  // 后才能读写命名空间配置；在缺少 settings 传输层的宿主上保持隐藏，
  // 而不是把整个插件卸载掉。
  ctx.inject(['settingsScope'], (scoped) => {
    const scope = scoped.settingsScope.bind({ namespace: NS })

    scoped.slots.inject('settings.section', () => scoped.slots.register({
      name: 'settings.section',
      id: 'prompt-customizer',
      order: 50,
      label: () => t('nav'),
      locale: NS,
      inject: () => ({ t }),
    }, () => h(Panel, { scope, t })))
  })
}

// ── 根面板 ────────────────────────────────────────────────────────────────

/**
 * 面板根组件：拉取清单、维护 Tab 状态，把各 Tab 子视图与共享配置装配起来。
 * 配置快照来自 settingsScope（subscribe 实时同步）；清单来自宿主路由，
 * 可通过「刷新」按钮手动重取。
 */

function Panel({ scope, t }: { scope: SettingsScope; t: Translate }): ReactElement {
  const [snap, setSnap] = useState(() => scope.getSnapshot())
  const [inv, setInv] = useState<Inventory | null>(null)
  const [tab, setTab] = useState<'sections' | 'tools' | 'presets' | 'preview'>('sections')
  const [error, setError] = useState<string | null>(null)
  const [refreshId, setRefreshId] = useState(0)

  useEffect(() => scope.subscribe(() => setSnap(scope.getSnapshot())), [scope])

  const refresh = (): void => {
    fetch(INVENTORY_URL)
      .then((r) => r.json())
      .then((data: Inventory) => { setInv(data); setError(null); setRefreshId((n) => n + 1) })
      .catch((e: unknown) => setError(String(e instanceof Error ? e.message : e)))
  }
  useEffect(refresh, [])

  if (snap.status !== 'ready' && snap.value === undefined) {
    return h('div', { style: s.muted }, t('loading'))
  }

  const cfg: Config = snap.value && typeof snap.value === 'object'
    ? snap.value as Config
    : { sections: [], replace: {}, inject: [], tools: { exclude: [], include: [] } }

  return h('div', { style: s.root }, [
    h('div', { style: s.bar }, [
      h('button', { style: tab === 'sections' ? s.tabActive : s.tab, onClick: () => setTab('sections') }, t('tabsSections')),
      h('button', { style: tab === 'tools' ? s.tabActive : s.tab, onClick: () => setTab('tools') }, t('tabsTools')),
      h('button', { style: tab === 'presets' ? s.tabActive : s.tab, onClick: () => setTab('presets') }, t('tabsPresets')),
      h('button', { style: tab === 'preview' ? s.tabActive : s.tab, onClick: () => setTab('preview') }, t('tabsPreview')),
      h('button', { style: s.refresh, onClick: refresh }, t('refresh')),
    ]),
    error ? h('div', { style: s.error }, String(error)) : null,
    tab === 'sections'
      ? h(SectionsTab, { cfg, inv, scope, t })
      : tab === 'tools'
        ? h(ToolsTab, { cfg, inv, scope, t })
        : tab === 'presets'
          ? h(PresetsTab, { cfg, inv, scope, t })
          : h(PreviewTab, { scope, t, active: tab === 'preview', refreshId }),
  ])
}

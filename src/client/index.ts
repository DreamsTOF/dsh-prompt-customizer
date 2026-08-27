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
import type { AgentPresetInfo, Config, Inventory } from './types.ts'
import { editView, setOverrideField } from './presets.ts'
import { SectionsTab } from './SectionsTab.tsx'
import { ToolsTab } from './ToolsTab.tsx'
import { PresetsTab } from './PresetsTab.tsx'
import { PreviewTab } from './PreviewTab.tsx'

const NS = 'prompt-customizer'
const INVENTORY_URL = '/api/prompt-customizer/inventory'
const AGENT_PRESETS_URL = '/api/prompt-customizer/agent-presets'
const CONFIG_URL = '/api/prompt-customizer/config'
const CONFIG_SET_URL = '/api/prompt-customizer/config/set'
const CONFIG_UNSET_URL = '/api/prompt-customizer/config/unset'

export const name = 'prompt-customizer'
export const inject = ['slots', 'locale']

/** 本插件用到的客户端 cordis 上下文的最小子集。 */
interface ClientContext {
  effect(callback: () => unknown, label?: string): void
  locale: {
    register(namespace: string, dicts: { zh: Record<string, string>; en: Record<string, string> }): unknown
    bind(namespace: string): Translate
  }
  inject(services: string[], callback: (scoped: SlotsHost) => void): void
}

/** 设置分区需要的宿主能力面（插槽注册）。 */
interface SlotsHost {
  slots: {
    inject(name: string, register: () => unknown): void
    register(meta: Record<string, unknown>, render: () => unknown): unknown
  }
}

export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, DICT), 'prompt-customizer: locale')
  const t = ctx.locale.bind(NS)

  // 注册为独立的设置分区（侧边栏菜单项），面板只出现在「提示词定制」下，
  // 而不是作为卡片塞进「插件」设置列表。配置读写走插件自有路由（宿主端的
  // config.yaml），不再依赖 settings 传输层。
  ctx.inject(['slots'], (scoped) => {
    scoped.slots.inject('settings.section', () => scoped.slots.register({
      name: 'settings.section',
      id: 'prompt-customizer',
      order: 50,
      label: () => t('nav'),
      locale: NS,
      inject: () => ({ t }),
    }, () => h(Panel, { t })))
  })
}

// ── 根面板 ────────────────────────────────────────────────────────────────

/**
 * 面板根组件：拉取配置与清单、维护 Tab 状态，把各 Tab 子视图装配起来。
 * 配置来自插件自有 /config 路由（写操作返回最新配置直接采纳）；清单来自
 * /inventory，可通过「刷新」按钮手动重取。
 */

function Panel({ t }: { t: Translate }): ReactElement {
  const [cfg, setCfg] = useState<Config | null>(null)
  const [inv, setInv] = useState<Inventory | null>(null)
  const [agentPresets, setAgentPresets] = useState<AgentPresetInfo[]>([])
  const [tab, setTab] = useState<'sections' | 'tools' | 'presets' | 'preview'>('sections')
  const [error, setError] = useState<string | null>(null)
  const [refreshId, setRefreshId] = useState(0)
  // 编辑目标：undefined = 全局默认；字符串 = agent 预设 id（字段级 override）。
  const [target, setTarget] = useState<string | undefined>(undefined)

  const load = (): void => {
    fetch(CONFIG_URL + `?t=${Date.now()}`)
      .then((r) => r.json())
      .then((body) => {
        if (body?.ok !== true) throw new Error(body?.error ?? 'config failed')
        setCfg(body.config as Config)
        setError(null)
      })
      .catch((e: unknown) => setError(String(e instanceof Error ? e.message : e)))
  }
  useEffect(load, [])

  const refresh = (): void => {
    const qs = target ? `?scope=${encodeURIComponent(target)}` : ''
    fetch(INVENTORY_URL + qs)
      .then((r) => r.json())
      .then((data: Inventory) => { setInv(data); setError(null); setRefreshId((n) => n + 1) })
      .catch((e: unknown) => setError(String(e instanceof Error ? e.message : e)))
  }
  // 挂载时与切换编辑目标后：清单切到对应 scope 与生效配置。
  useEffect(refresh, [target])

  // 枚举已安装的 agent 预设（roster 实时读取），给目标选择器与预览选择器供货。
  useEffect(() => {
    fetch(AGENT_PRESETS_URL + `?t=${Date.now()}`)
      .then((r) => r.json())
      .then((body) => setAgentPresets(Array.isArray(body?.presets) ? body.presets as AgentPresetInfo[] : []))
      .catch(() => setAgentPresets([]))
  }, [])

  if (cfg === null) {
    return h('div', { style: s.muted }, t('loading'))
  }

  // 编辑视图：agent 预设目标时展示 override 回落合并后的配置；
  // 写入走 POST 到插件自有路由，返回的最新配置直接采纳。
  // version 在每次成功写入后 +1，驱动 PreviewTab 重载。
  const [version, setVersion] = useState(0)
  const view = editView(cfg, target)
  const writeField = (field: string, value: unknown): void => {
    const url = value === undefined ? CONFIG_UNSET_URL : CONFIG_SET_URL
    fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ field, value }),
    })
      .then((r) => r.json())
      .then((body) => {
        if (body?.ok !== true) throw new Error(body?.error ?? 'write failed')
        setCfg(body.config as Config)
        setError(null)
        setVersion((n) => n + 1)
      })
      .catch((e: unknown) => setError(String(e instanceof Error ? e.message : e)))
  }
  // 定制四字段：全局目标直写顶层；预设目标合成完整 overrides 记录后整体写。
  const write = (field: 'sections' | 'replace' | 'inject' | 'tools', value: unknown): void => {
    if (!target) writeField(field, value)
    else writeField('overrides', setOverrideField(cfg, target, field, value))
  }
  // 预设库（presets / activePreset）永远保持在全局字段，不分作用域。
  const writeGlobal = writeField

  return h('div', { style: s.root }, [
    h('div', { style: s.bar }, [
      h('button', { style: tab === 'sections' ? s.tabActive : s.tab, onClick: () => setTab('sections') }, t('tabsSections')),
      h('button', { style: tab === 'tools' ? s.tabActive : s.tab, onClick: () => setTab('tools') }, t('tabsTools')),
      h('button', { style: tab === 'presets' ? s.tabActive : s.tab, onClick: () => setTab('presets') }, t('tabsPresets')),
      h('button', { style: tab === 'preview' ? s.tabActive : s.tab, onClick: () => setTab('preview') }, t('tabsPreview')),
      h('select', {
        style: { ...s.input, marginLeft: 6 },
        value: target ?? '',
        onChange: (e: { target: { value: string } }) => setTarget(e.target.value || undefined),
        title: t('targetHint'),
      }, [
        h('option', { value: '' }, t('targetGlobal')),
        ...agentPresets.map((p) => h('option', { key: p.id, value: p.id },
          `${p.name}${p.broken ? ` (${t('broken')})` : ''}`)),
      ]),
      h('button', { style: s.refresh, onClick: refresh }, t('refresh')),
    ]),
    error ? h('div', { style: s.error }, String(error)) : null,
    target && agentPresets.find((p) => p.id === target)?.broken
      ? h('div', { style: s.error }, t('brokenPreset'))
      : null,
    tab === 'sections'
      ? h(SectionsTab, { cfg: view, inv, t, write })
      : tab === 'tools'
        ? h(ToolsTab, { cfg: view, inv, t, write })
        : tab === 'presets'
          ? h(PresetsTab, { cfg: view, inv, t, write, writeGlobal })
          : h(PreviewTab, { t, active: tab === 'preview', refreshId, agentPresets, version }),
  ])
}

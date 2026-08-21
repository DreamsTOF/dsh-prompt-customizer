/**
 * dsh-prompt-customizer — browser half (TypeScript source).
 *
 * Registers a "提示词定制" settings section (sidebar entry) and a plugin
 * settings card. The panel fetches the effective section / tool inventory
 * from the host `/api/prompt-customizer/inventory` and lets the user block,
 * replace, inject prompt sections and hide tools. All writes go through the
 * bound settings scope (`prompt-customizer` namespace) and apply live.
 *
 * Built by tsdown into the __ModuleLoader__ factory bundle at client/client.js;
 * the only external is the loader module table's react entry.
 */
import { createElement as h, useEffect, useState, type ReactElement } from 'react'
import { DICT, type Translate } from './locales.ts'
import { s } from './styles.ts'
import type { Config, Inventory, SettingsScope } from './types.ts'
import { SectionsTab } from './SectionsTab.tsx'
import { ToolsTab } from './ToolsTab.tsx'
import { PresetsTab } from './PresetsTab.tsx'

const NS = 'prompt-customizer'
const INVENTORY_URL = '/api/prompt-customizer/inventory'

export const name = 'prompt-customizer'
export const inject = ['slots', 'locale']

/** The subset of the client cordis context this plugin touches. */
interface ClientContext {
  effect(callback: () => unknown, label?: string): void
  locale: {
    register(namespace: string, dicts: { zh: Record<string, string>; en: Record<string, string> }): unknown
    bind(namespace: string): Translate
  }
  inject(services: string[], callback: (scoped: SettingsScopeHost) => void): void
}

/** The host surface the settings card needs (settingsScope transport). */
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

  // Register a standalone settings section (sidebar menu entry) AND a plugin
  // settings card. Both go through a NESTED inject of settingsScope so the
  // panel can read/write the namespace config; on hosts without the settings
  // transport neither appears instead of unmounting the whole plugin.
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

    scoped.slots.inject('settings.plugin.item', () => scoped.slots.register({
      name: 'settings.plugin.item',
      key: NS,
      locale: NS,
      inject: () => ({ t }),
    }, () => h(Panel, { scope, t })))
  })
}

// ── Root panel ──────────────────────────────────────────────────────────────

function Panel({ scope, t }: { scope: SettingsScope; t: Translate }): ReactElement {
  const [snap, setSnap] = useState(() => scope.getSnapshot())
  const [inv, setInv] = useState<Inventory | null>(null)
  const [tab, setTab] = useState<'sections' | 'tools' | 'presets'>('sections')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => scope.subscribe(() => setSnap(scope.getSnapshot())), [scope])

  const refresh = (): void => {
    fetch(INVENTORY_URL)
      .then((r) => r.json())
      .then((data: Inventory) => { setInv(data); setError(null) })
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
      h('button', { style: s.refresh, onClick: refresh }, t('refresh')),
    ]),
    error ? h('div', { style: s.error }, String(error)) : null,
    tab === 'sections'
      ? h(SectionsTab, { cfg, inv, scope, t })
      : tab === 'tools'
        ? h(ToolsTab, { cfg, inv, scope, t })
        : h(PresetsTab, { cfg, inv, scope, t }),
  ])
}

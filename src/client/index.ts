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
import { createElement as h, useEffect, useRef, useState, type ReactElement } from 'react'
import { DICT, type Translate } from './locales.ts'
import { s } from './styles.ts'
import type { AgentPresetInfo, Config, Inventory, PhaseViewKey, Preview } from './types.ts'
import { editView, type ConfigPatch } from './presets.ts'
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
const CONFIG_APPLY_URL = '/api/prompt-customizer/config/apply'
const PRESETS_CREATE_URL = '/api/prompt-customizer/presets'
const PREVIEW_URL = '/api/prompt-customizer/preview'

/** 三阶段预览装配（模型视角）：提示词/工具/预览 Tab 的统一数据源。 */
type PhaseViews = Record<PhaseViewKey, Preview | null>

/** 三套名义装配的共享布局：顺序固定，refresh 按此并行拉取。 */
const VIEW_KEYS: PhaseViewKey[] = ['bootstrap', 'compaction', 'active']

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
 * 配置来自插件自有 /config 路由；清单来自 /inventory，可通过「刷新」按钮
 * 手动重取。提示词/工具 Tab 的编辑只改内存草稿，由「保存」按钮经
 * /config/apply 一次写盘（写错的配置不点保存就不会进文件）。
 */

/** 可编辑的配置字段（含每阶段独立段屏蔽名单）。 */
type EditField = 'sections' | 'sectionsBootstrap' | 'sectionsCompaction' | 'replace' | 'inject' | 'tools'

/** 编辑域草稿：提示词/工具 Tab 共享的未保存字段 + 脏标记。
 *  只记录用户实际编辑过的字段（首次编辑只写那一项），保存时也只提交这些
 *  字段 —— 未编辑的字段继续回落全局 / 继承，避免一次保存冻结全部继承值。 */
interface EditDraft {
  sections?: Config['sections']
  sectionsBootstrap?: Config['sectionsBootstrap']
  sectionsCompaction?: Config['sectionsCompaction']
  replace?: Config['replace']
  inject?: Config['inject']
  tools?: Config['tools']
  dirty: boolean
}

function Panel({ t }: { t: Translate }): ReactElement {
  const [cfg, setCfg] = useState<Config | null>(null)
  const [inv, setInv] = useState<Inventory | null>(null)
  // 三阶段预览装配：模型视角的唯一数据源（加载中为 null）。
  const [phases, setPhases] = useState<PhaseViews | null>(null)
  const [agentPresets, setAgentPresets] = useState<AgentPresetInfo[]>([])
  const [tab, setTab] = useState<'sections' | 'tools' | 'presets' | 'preview'>('sections')
  const [error, setError] = useState<string | null>(null)
  const [refreshId, setRefreshId] = useState(0)
  // 编辑目标：undefined = 全局默认；字符串 = agent 预设 id（字段级 override）。
  const [target, setTarget] = useState<string | undefined>(undefined)
  // 配置写入计数：每次成功写配置后 +1，驱动 PreviewTab 重载。
  // （以下 hooks 必须在任何提前 return 之前声明 —— hooks 顺序不能随加载状态变化。）
  const [version, setVersion] = useState(0)
  // 编辑域草稿：null = 无草稿（Tab 显示磁盘值）。提示词 ↔ 工具切换保留；
  // 切到预设/预览 Tab 或切换编辑目标时丢弃（脏草稿先经确认）。
  const [draft, setDraft] = useState<EditDraft | null>(null)
  const [saving, setSaving] = useState(false)
  const [flash, setFlash] = useState<string | null>(null)
  const [flashKind, setFlashKind] = useState<'ok' | 'err'>('ok')
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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
    // 三阶段预览并行拉取：提示词 / 工具 / 预览三个 Tab 全部以这套装配结果
    // 为唯一数据源 —— 静态清单只是注册表视角（不含伪 agent 阶段裁剪、
    // pre-step 注入等运行时规则），与它保持一致才是"所见即模型所见"。
    // 三个阶段部分恒定显示（预设没有某个阶段时该部分只是空的），
    // 不再按 (段, 工具) 签名去重折叠。
    const params = (phase: string): string =>
      `${qs}${qs ? '&' : '?'}phase=${phase}&t=${Date.now()}`
    const grab = (phase: string): Promise<Preview | null> =>
      fetch(PREVIEW_URL + params(phase))
        .then((r) => r.json())
        .then((body: Preview) => (body?.ok === false ? null : body))
        .catch(() => null)
    // 「本系统全部提示词/工具」面板是全局注册表，永不随编辑目标切换 ——
    // 清单请求不带 scope，三阶段预览仍带 scope（作为该预设的真实装配）。
    Promise.all([...VIEW_KEYS.map(grab), fetch(INVENTORY_URL).then((r) => r.json())])
      .then(([boot, comp, act, inventoryData]) => {
        setPhases({ bootstrap: boot, compaction: comp, active: act })
        setInv(inventoryData as Inventory)
        setError(null)
        setRefreshId((n) => n + 1)
      })
      .catch((e: unknown) => setError(String(e instanceof Error ? e.message : e)))
  }
  // 挂载时与切换编辑目标后：清单与三阶段预览切到对应 scope。
  // version 入依赖：保存/写配置成功后 +1，驱动三阶段预览重新拉取
  // （PreviewTab 的数据源是 phases，不重拉就会一直显示保存前的装配）。
  useEffect(refresh, [target, version])

  // 枚举已安装的 agent 预设（roster 实时读取），给目标选择器与预览选择器供货。
  // 抽成函数：保存预设成功后也要立即刷新目标下拉。
  const fetchPresets = (): void => {
    fetch(AGENT_PRESETS_URL + `?t=${Date.now()}`)
      .then((r) => r.json())
      .then((body) => setAgentPresets(Array.isArray(body?.presets) ? body.presets as AgentPresetInfo[] : []))
      .catch(() => setAgentPresets([]))
  }
  useEffect(() => { fetchPresets() }, [])

  if (cfg === null) {
    return h('div', { style: s.muted }, t('loading'))
  }

  // 保存成功/失败后的短促闪示消息（3 秒自动消失；err 用红色样式）。
  const showFlash = (text: string, kind: 'ok' | 'err' = 'ok'): void => {
    if (flashTimer.current !== null) clearTimeout(flashTimer.current)
    setFlash(text)
    setFlashKind(kind)
    flashTimer.current = setTimeout(() => setFlash(null), 3200)
  }

  // 编辑视图：草稿存在时以草稿覆盖对应字段（提示词/工具 Tab 的共享编辑域）。
  // 草稿只含用户实际编辑过的字段，未编辑字段回落基线 —— 绝不把继承值
  // 冻结进 override。
  const base = editView(cfg, target)
  const view: Config = draft
    ? {
        ...base,
        sections: draft.sections ?? base.sections,
        sectionsBootstrap: draft.sectionsBootstrap ?? base.sectionsBootstrap,
        sectionsCompaction: draft.sectionsCompaction ?? base.sectionsCompaction,
        replace: draft.replace ?? base.replace,
        inject: draft.inject ?? base.inject,
        tools: draft.tools ?? base.tools,
      }
    : base

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

  // 提示词/工具 Tab 的写入：只改内存草稿，不落盘。草稿只记录被编辑的
  // 这一个字段（不携带其余字段的继承值）—— 保存时也只会提交编辑过的
  // 字段，未编辑字段继续回落全局 / 继承。target 缺省时写全局顶层；
  // 预设目标由 /config/apply 写 overrides[id]（字段级接管语义在保存时生效）。
  const edit = (field: EditField, value: unknown): void => {
    setDraft((d) => ({
      ...(d ?? { dirty: false }),
      [field]: value,
      dirty: true,
    }))
  }

  // 统一保存：草稿里实际编辑过的字段一次 POST 到 /config/apply，成功后清
  // 草稿并采纳最新配置。失败时保留草稿（改完可以再试，不会丢）。
  const save = (): void => {
    if (draft === null || saving) return
    const EDITED_FIELDS = ['sections', 'sectionsBootstrap', 'sectionsCompaction', 'replace', 'inject', 'tools'] as const
    const patch: Record<string, unknown> = {}
    for (const field of EDITED_FIELDS) {
      if (Object.hasOwn(draft, field)) patch[field] = draft[field]
    }
    setSaving(true)
    fetch(CONFIG_APPLY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ target, patch }),
    })
      .then((r) => r.json())
      .then((body) => {
        if (body?.ok !== true) throw new Error(body?.error ?? 'save failed')
        setCfg(body.config as Config)
        setDraft(null)
        setError(null)
        setVersion((n) => n + 1)
        showFlash(t('saveOk'))
      })
      .catch((e: unknown) => setError(`${t('saveFail')}: ${e instanceof Error ? e.message : String(e)}`))
      .finally(() => setSaving(false))
  }

  // 预设 Tab 的「应用」：显式意图直接落盘（不经草稿），完整补丁一次写入
  // 当前编辑目标（含每阶段独立名单与阶段工具目录）。调用点已在离开编辑域时
  // 清空草稿，不会有并发草稿写盘。
  const writePatch = (patch: ConfigPatch): void => {
    fetch(CONFIG_APPLY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ target, patch }),
    })
      .then((r) => r.json())
      .then((body) => {
        if (body?.ok !== true) throw new Error(body?.error ?? 'apply failed')
        setCfg(body.config as Config)
        setError(null)
        setVersion((n) => n + 1)
      })
      .catch((e: unknown) => setError(String(e instanceof Error ? e.message : e)))
  }
  // 预设库（presets / activePreset）永远保持在全局字段，不分作用域。
  const writeGlobal = writeField
  // 提示词 Tab 解除继承自全局的屏蔽时使用的全局通道（与 writeGlobal 同源，
  // 收窄了字段类型以匹配 SectionsTab 的 prop 签名）。
  const writeGlobalField = writeField as (field: 'sections', value: unknown) => void

  // 切换 Tab：提示词 ↔ 工具是同一编辑域，草稿保留；切到预设/预览即离开
  // 编辑域，脏草稿经确认后丢弃。
  const switchTab = (next: 'sections' | 'tools' | 'presets' | 'preview'): void => {
    const leaving = (tab === 'sections' || tab === 'tools') && (next === 'presets' || next === 'preview')
    if (leaving) {
      if (draft?.dirty && !window.confirm(t('discardConfirm'))) return
      setDraft(null)
    }
    setTab(next)
  }

  // 切换编辑目标：草稿基线随目标变化，脏草稿先经确认再丢弃。
  const switchTarget = (next: string | undefined): void => {
    if (draft?.dirty && !window.confirm(t('discardConfirm'))) return
    setDraft(null)
    setTarget(next)
  }

  // 「存为预设」：把当前编辑内容（含未保存草稿）fork 成一个新的 agent 预设 ——
  // 宿主 authoring API 整体复制来源预设目录（组成文件 / 伴生 .mjs / 技能目录），
  // 同时把当前配置写进 overrides[name]。来源 = 当前编辑目标；全局目标由服务端
  // 回落到 roster 默认预设。名字非法 / 同名由服务端报错。
  // 返回是否成功，让配置 Tab 用面板内消息条提示（不再用 window.prompt / 顶部按钮）。
  const saveAsPreset = (presetName: string): Promise<boolean> => {
    const name = presetName.trim()
    if (name.length === 0) return Promise.resolve(false)
    return fetch(PRESETS_CREATE_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name,
        from: target,
        config: {
          sections: view.sections ?? [],
          sectionsBootstrap: view.sectionsBootstrap ?? [],
          sectionsCompaction: view.sectionsCompaction ?? [],
          replace: view.replace ?? {},
          inject: view.inject ?? [],
          tools: view.tools ?? {},
        },
      }),
    })
      .then((r) => r.json())
      .then((body) => {
        if (body?.ok !== true) throw new Error(body?.error ?? t('saveAsPresetFail'))
        load()
        fetchPresets()
        showFlash(t('saveAsPresetOk'), 'ok')
        return true
      })
      .catch((e: unknown) => {
        showFlash(`${t('saveAsPresetFail')}：${String(e instanceof Error ? e.message : e)}`, 'err')
        return false
      })
  }

  return h('div', { style: s.root }, [
    h('div', { style: s.bar }, [
      h('button', { style: tab === 'sections' ? s.tabActive : s.tab, onClick: () => switchTab('sections') }, t('tabsSections')),
      h('button', { style: tab === 'tools' ? s.tabActive : s.tab, onClick: () => switchTab('tools') }, t('tabsTools')),
      h('button', { style: tab === 'presets' ? s.tabActive : s.tab, onClick: () => switchTab('presets') }, t('tabsPresets')),
      h('button', { style: tab === 'preview' ? s.tabActive : s.tab, onClick: () => switchTab('preview') }, t('tabsPreview')),
      h('select', {
        style: { ...s.input, marginLeft: 6 },
        value: target ?? '',
        onChange: (e: { target: { value: string } }) => switchTarget(e.target.value || undefined),
        title: t('targetHint'),
      }, [
        h('option', { value: '', style: s.option }, t('targetGlobal')),
        ...agentPresets.map((p) => h('option', { key: p.id, value: p.id, style: s.option },
          `${p.name}${p.broken ? ` (${t('broken')})` : ''}`)),
      ]),
      h('button', {
        style: draft?.dirty ? s.saveBtnDirty : s.saveBtn,
        disabled: !draft?.dirty || saving,
        onClick: save,
      }, t('save')),
      h('button', { style: s.refresh, onClick: refresh }, t('refresh')),
    ]),
    error ? h('div', { style: s.error }, String(error)) : null,
    flash ? h('div', { style: flashKind === 'err' ? s.error : s.noticeOk }, flash) : null,
    target && agentPresets.find((p) => p.id === target)?.broken
      ? h('div', { style: s.error }, t('brokenPreset'))
      : null,
    inv?.scopeResolved === false
      ? h('div', { style: s.noticeWarn }, t('scopeFallback'))
      : null,
    tab === 'sections'
      ? h(SectionsTab, {
          cfg: view,
          inv,
          phases,
          target,
          globalSections: cfg.sections,
          ownedSections: target ? cfg.overrides?.[target]?.sections : undefined,
          t,
          write: edit,
          writeGlobalField,
        })
      : tab === 'tools'
        ? h(ToolsTab, { cfg: view, inv, phases, t, write: edit })
        : tab === 'presets'
          ? h(PresetsTab, {
              cfg: view,
              inv,
              phases,
              t,
              writePatch,
              writeGlobal,
              saveAsPreset,
              forkSource: target ? (agentPresets.find((p) => p.id === target)?.name ?? target) : undefined,
            })
          : h(PreviewTab, { t, active: tab === 'preview', refreshId, target, version, phases }),
  ])
}

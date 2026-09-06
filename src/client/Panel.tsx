/**
 * Panel — 提示词管理面板（独立抽屉的根组件）。
 *
 * 拉取配置与清单、维护模式与编辑目标状态，把左右两栏装配起来：
 *  - 头部：标题 + 模式切换（提示词 / 工具 / 预设）+ 保存 / 刷新 / 关闭；
 *  - 第二行：agent 预设 Tab（全部 Agent + 各预设，点击即切换编辑目标，
 *    像宿主能力管理页的预设切换）+ 三态同步 / 中文提示词开关；
 *  - 主体分栏：左栏 = 勾选列表（提示词或工具，底部三态过滤），右栏 =
 *    最终装配预览；预设模式下左栏是快照库、右栏是全局设置。
 *
 * 配置来自插件自有 /config 路由；清单与三阶段预览来自 /inventory 与
 * /preview?phase=…。编辑只改内存草稿，由「保存」按钮经 /config/apply 一次
 * 写盘（写错的配置不点保存就不会进文件）。
 */
import { createElement as h, useEffect, useRef, useState, type ReactElement } from 'react'
import { DICT, type Translate } from './locales.ts'
import { s } from './styles.ts'
import type { AgentPresetInfo, Config, Inventory, PhaseViewKey, Preview } from './types.ts'
import { editView, type ConfigPatch } from './presets.ts'
import { zhMergedInjectEntries, zhRevertInjectEntries, zhApplied } from '../../lib/sectionOps.mjs'
import { ZH_SECTIONS } from '../../lib/zh/index.mjs'
import { SectionsPane } from './SectionsPane.tsx'
import { ToolsPane } from './ToolsPane.tsx'
import { PresetsPane, SettingsPane } from './PresetsPane.tsx'
import { PreviewPane } from './PreviewPane.tsx'

const INVENTORY_URL = '/api/prompt-customizer/inventory'
const AGENT_PRESETS_URL = '/api/prompt-customizer/agent-presets'
const CONFIG_URL = '/api/prompt-customizer/config'
const CONFIG_SET_URL = '/api/prompt-customizer/config/set'
const CONFIG_UNSET_URL = '/api/prompt-customizer/config/unset'
const CONFIG_APPLY_URL = '/api/prompt-customizer/config/apply'
const CONFIG_RESET_URL = '/api/prompt-customizer/config/reset'
const PRESETS_CREATE_URL = '/api/prompt-customizer/presets'
const PREVIEW_URL = '/api/prompt-customizer/preview'

/** 三阶段预览装配（模型视角）：左栏列表与右栏预览的统一数据源。 */
type PhaseViews = Record<PhaseViewKey, Preview | null>

/** 三套名义装配的共享布局：顺序固定，refresh 按此并行拉取。 */
const VIEW_KEYS: PhaseViewKey[] = ['bootstrap', 'compaction', 'active']

/** 编辑草稿里可能出现的字段（与服务端 /config/apply 的 APPLY_FIELDS 一致）。 */
const DRAFT_FIELDS = ['sections', 'sectionsBootstrap', 'sectionsCompaction', 'replace', 'inject', 'tools'] as const

/** 面板顶层模式：提示词 / 工具 / 预设（预览常驻右栏，不再是独立模式）。 */
type PanelMode = 'sections' | 'tools' | 'presets'

/** 可编辑的配置字段（含每阶段独立段屏蔽名单）。 */
type EditField = 'sections' | 'sectionsBootstrap' | 'sectionsCompaction' | 'replace' | 'inject' | 'tools'

/** 编辑域草稿：提示词/工具两栏共享的未保存字段 + 脏标记。
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

export function Panel({ t, onClose }: { t: Translate; onClose: () => void }): ReactElement {
  const [cfg, setCfg] = useState<Config | null>(null)
  const [inv, setInv] = useState<Inventory | null>(null)
  // 三阶段预览装配：模型视角的唯一数据源（加载中为 null）。
  const [phases, setPhases] = useState<PhaseViews | null>(null)
  const [agentPresets, setAgentPresets] = useState<AgentPresetInfo[]>([])
  const [mode, setMode] = useState<PanelMode>('sections')
  const [error, setError] = useState<string | null>(null)
  // 配置写入计数：每次成功写配置后 +1，驱动预览重载。
  const [version, setVersion] = useState(0)
  // 三阶段视图：左栏列表与右栏预览共用；左右两栏的阶段 Tab 联动切换同一份。
  const [phase, setPhase] = useState<PhaseViewKey>('bootstrap')
  // 草稿预览的同步序号：每次发起同步 +1，过期响应（已保存 / 再次编辑后）
  // 直接丢弃，绝不覆盖新数据。
  const syncSeq = useRef(0)
  // 编辑目标：undefined = 全局默认；字符串 = agent 预设 id（字段级覆盖）。
  const [target, setTarget] = useState<string | undefined>(undefined)
  // 三态同步（默认关）：勾选后提示词 / 工具两栏的屏蔽与解除屏蔽对三个阶段
  // 一起生效（只作用于同名的那一项）。仅在提示词 / 工具两个模式显示。
  const [syncAll, setSyncAll] = useState(false)
  // 右栏预览的子视图：提示词模式默认看提示词、工具模式默认看工具。
  const [previewSub, setPreviewSub] = useState<'prompt' | 'tools'>('prompt')
  // 编辑域草稿：null = 无草稿（显示磁盘值）。提示词 ↔ 工具切换保留；
  // 切到预设模式或切换编辑目标时丢弃（脏草稿先经确认）。
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

  // 返回 Promise：手动刷新后可以链上草稿补同步（见「刷新」按钮）。
  const refresh = (): Promise<void> => {
    const qs = target ? `?scope=${encodeURIComponent(target)}` : ''
    // 三阶段预览并行拉取：左栏列表与右栏预览全部以这套装配结果为唯一数据源
    // —— 静态清单只是注册表视角（不含伪 agent 阶段裁剪、pre-step 注入等
    // 运行时规则），与它保持一致才是"所见即模型所见"。
    const params = (phase: string): string =>
      `${qs}${qs ? '&' : '?'}phase=${phase}&t=${Date.now()}`
    const grab = (phase: string): Promise<Preview | null> =>
      fetch(PREVIEW_URL + params(phase))
        .then((r) => r.json())
        .then((body: Preview) => (body?.ok === false ? null : body))
        .catch(() => null)
    // 「本系统全部提示词/工具」池是全局注册表，永不随编辑目标切换 ——
    // 清单请求不带 scope，三阶段预览仍带 scope（作为该预设的真实装配）。
    return Promise.all([...VIEW_KEYS.map(grab), fetch(INVENTORY_URL).then((r) => r.json())])
      .then(([boot, comp, act, inventoryData]) => {
        setPhases({ bootstrap: boot, compaction: comp, active: act })
        setInv(inventoryData as Inventory)
        setError(null)
      })
      .catch((e: unknown) => setError(String(e instanceof Error ? e.message : e)))
  }
  // 挂载时与切换编辑目标后：清单与三阶段预览切到对应 scope。
  // version 入依赖：保存/写配置成功后 +1，驱动重新拉取（否则一直显示保存前的装配）。
  useEffect(() => { void refresh() }, [target, version])

  // 草稿实时预览：把未保存的编辑草稿补丁 POST 给 /preview（服务端只在内存里
  // 叠加，磁盘不动），只刷新当前阶段视图 —— 预览随改随动；保存后的 GET 全量
  // 拉取会覆盖回权威状态。syncSeq 让过期响应（又编辑了 / 已保存）直接丢弃。
  const syncDraftPreview = (): void => {
    if (draft === null || !draft.dirty) return
    const patch: Record<string, unknown> = {}
    const source = draft as unknown as Record<string, unknown>
    for (const field of DRAFT_FIELDS) {
      if (Object.hasOwn(source, field)) patch[field] = source[field]
    }
    if (Object.keys(patch).length === 0) return
    const seq = ++syncSeq.current
    fetch(PREVIEW_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ target, patch, phase }),
    })
      .then((r) => r.json())
      .then((body) => {
        if (body?.ok === false) throw new Error(body?.error ?? 'preview failed')
        if (seq !== syncSeq.current) return // 过期响应：草稿又变了或已保存，丢弃
        setPhases((prev) => (prev === null ? prev : { ...prev, [phase]: body as Preview }))
        setError(null)
      })
      .catch((e: unknown) => {
        // 实时预览失败不再静默：消息条提示（下一次成功会自动清除）。保存后
        // 的全量刷新仍会覆盖回权威状态，不影响编辑。
        setError(`${t('previewSyncFail')}：${e instanceof Error ? e.message : String(e)}`)
      })
  }
  // 编辑（draft 身份变化）、切换阶段 / 编辑目标后：防抖 600ms 同步一次。
  useEffect(() => {
    if (draft === null || !draft.dirty) return undefined
    const timer = setTimeout(syncDraftPreview, 600)
    return () => { clearTimeout(timer) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, phase, target])

  // 枚举已安装的 agent 预设（roster 实时读取），给顶部预设 Tab 供货。
  // 抽成函数：保存预设成功后也要立即刷新 Tab 行。
  const fetchPresets = (): void => {
    fetch(AGENT_PRESETS_URL + `?t=${Date.now()}`)
      .then((r) => r.json())
      .then((body) => setAgentPresets(Array.isArray(body?.presets) ? body.presets as AgentPresetInfo[] : []))
      .catch(() => setAgentPresets([]))
  }
  useEffect(() => { fetchPresets() }, [])

  // 保存成功/失败后的短促闪示消息（3 秒自动消失；err 用红色样式）。
  const showFlash = (text: string, kind: 'ok' | 'err' = 'ok'): void => {
    if (flashTimer.current !== null) clearTimeout(flashTimer.current)
    setFlash(text)
    setFlashKind(kind)
    flashTimer.current = setTimeout(() => setFlash(null), 3200)
  }

  // 丢弃草稿：递增同步序号，作废在途的草稿预览响应（保存后 GET 会整体覆盖，
  // 过期响应绝不能反过来盖掉权威数据）。
  const clearDraft = (): void => {
    syncSeq.current += 1
    setDraft(null)
  }

  if (cfg === null) {
    return h('div', { style: { ...s.pRoot, padding: 16 } }, t('loading'))
  }

  // 编辑视图：草稿存在时以草稿覆盖对应字段（两栏共享编辑域）。
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

  // 两栏的写入：只改内存草稿，不落盘。草稿只记录被编辑的这一字段 —— 保存时
  // 也只会提交编辑过的字段，未编辑字段继续回落全局 / 继承。target 缺省时写
  // 全局顶层；预设目标由 /config/apply 写 overrides[id]（字段级接管语义在保存
  // 时生效）。
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
        clearDraft()
        setError(null)
        setVersion((n) => n + 1)
        showFlash(t('saveOk'))
      })
      .catch((e: unknown) => setError(`${t('saveFail')}: ${e instanceof Error ? e.message : String(e)}`))
      .finally(() => setSaving(false))
  }

  // 预设模式的「应用」：显式意图直接落盘（不经草稿），完整补丁一次写入当前
  // 编辑目标。调用点已在离开编辑域时清空草稿，不会有并发草稿写盘。
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

  // 「中文提示词」开关（头部工具栏）：开 = 把名字对得上译本（lib/zh/）的段
  // 一次性覆盖为中文，关 = 清掉这些段的替换文本回归英文 —— 两个方向都走编辑
  // 草稿（edit），与手动编辑同一条保存路径。状态从配置探测（zhApplied）。
  // 三阶段装配未就绪时拒绝执行（否则会把对应阶段的注入条目当作空集写掉）。
  const zhOn = zhApplied(view, ZH_SECTIONS)
  const toggleZh = (): void => {
    if (phases === null || phases.bootstrap === null || phases.active === null || phases.compaction === null) {
      showFlash(t('zhNotReady'), 'err')
      return
    }
    edit('inject', zhOn ? zhRevertInjectEntries(view, phases, ZH_SECTIONS) : zhMergedInjectEntries(view, phases, ZH_SECTIONS))
    showFlash(zhOn ? t('zhReverted') : t('zhApplied'))
  }

  // 恢复初始状态：服务端清空全部定制并关闭 forceSections（与不装插件等效）。
  // 二次确认由设置栏的调用点负责；成功后清草稿、重拉全部视图。
  const resetAll = (): void => {
    fetch(CONFIG_RESET_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
    })
      .then((r) => r.json())
      .then((body) => {
        if (body?.ok !== true) throw new Error(body?.error ?? 'reset failed')
        setCfg(body.config as Config)
        clearDraft()
        setError(null)
        setVersion((n) => n + 1)
        showFlash(t('resetOk'))
      })
      .catch((e: unknown) => setError(`${t('resetFail')}: ${e instanceof Error ? e.message : String(e)}`))
  }

  // 切换模式：提示词 ↔ 工具是同一编辑域，草稿保留；切到预设即离开编辑域，
  // 脏草稿经确认后丢弃。右栏预览子视图跟随模式。
  const switchMode = (next: PanelMode): void => {
    const leaving = (mode === 'sections' || mode === 'tools') && next === 'presets'
    if (leaving) {
      if (draft?.dirty && !window.confirm(t('discardConfirm'))) return
      clearDraft()
    }
    setMode(next)
    setPreviewSub(next === 'tools' ? 'tools' : 'prompt')
  }

  // 切换编辑目标（顶部预设 Tab）：草稿基线随目标变化，脏草稿先经确认再丢弃。
  const switchTarget = (next: string | undefined): void => {
    if (draft?.dirty && !window.confirm(t('discardConfirm'))) return
    clearDraft()
    setTarget(next)
  }

  // 「存为预设」：把当前编辑内容（含未保存草稿）fork 成一个新的 agent 预设 ——
  // 宿主 authoring API 整体复制来源预设目录（组成文件 / 伴生 .mjs / 技能目录），
  // 同时把当前配置写进 overrides[name]。来源 = 当前编辑目标；全局目标由服务端
  // 回落到 roster 默认预设。名字非法 / 同名由服务端报错。
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

  const modeBtn = (key: PanelMode, label: string): ReactElement =>
    h('button', { key, style: mode === key ? s.segBtnActive : s.segBtn, onClick: () => switchMode(key) }, label)

  // 阶段按钮命名（头部合并控制：引导期 / 常驻期 / 压缩受控期）。
  const stageLabel = (key: PhaseViewKey): string =>
    key === 'bootstrap' ? t('phaseStageGuide') : key === 'compaction' ? t('phaseStageControlled') : t('phaseStageResident')
  const draftDirty = draft?.dirty === true

  const targetTab = (id: string | undefined, label: string, broken?: string): ReactElement =>
    h('button', {
      key: id ?? '__global__',
      style: target === id ? s.targetTabActive : s.targetTab,
      onClick: () => switchTarget(id),
      title: broken !== undefined && broken !== '' ? `${label} — ${t('broken')}` : id === undefined ? t('targetHint') : label,
    }, [
      label,
      broken !== undefined && broken !== '' ? h('span', { style: s.badgeBlocked }, t('broken')) : null,
    ])

  return h('div', { style: s.pRoot }, [
    // ── 头部：标题 + 模式切换 + （阶段切换 + 开关） + 工具栏 ──
    // 阶段按钮合并放在三态同步选择框左侧：左栏列表与右栏预览跟着同一个
    // 阶段状态走，一处切换两边联动。仅在提示词 / 工具两个模式显示。
    h('div', { style: s.head }, [
      h('span', { style: s.headTitle }, [
        h('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true', style: { flex: 'none' } }, [
          h('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }),
          h('path', { d: 'M14 2v6h6' }),
          h('path', { d: 'M16 13H8' }),
          h('path', { d: 'M16 17H8' }),
          h('path', { d: 'M10 9H8' }),
        ]),
        t('nav'),
      ]),
      h('div', { style: s.seg }, [
        modeBtn('sections', t('tabsSections')),
        modeBtn('tools', t('tabsTools')),
        modeBtn('presets', t('tabsPresets')),
      ]),
      h('div', { style: s.headActions }, [
        mode === 'sections' || mode === 'tools'
          ? h('div', { style: s.seg }, VIEW_KEYS.map((key) => h('button', {
              key,
              style: phase === key ? s.segBtnActive : s.segBtn,
              onClick: () => setPhase(key),
            }, stageLabel(key))))
          : null,
        draftDirty && (mode === 'sections' || mode === 'tools')
          ? h('span', { style: s.badgeReplaced, title: t('draftBadge') }, t('draftBadge'))
          : null,
        mode === 'sections' || mode === 'tools'
          ? h('label', {
              style: { ...s.muted, display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer', whiteSpace: 'nowrap' },
              title: t('syncAllPhasesHint'),
            }, [
              h('input', {
                type: 'checkbox',
                checked: syncAll,
                onChange: (e: { target: { checked: boolean } }) => setSyncAll(e.target.checked),
                style: { margin: 0, cursor: 'pointer' },
              }),
              t('syncAllPhases'),
            ])
          : null,
        mode === 'sections'
          ? h('label', {
              style: { ...s.muted, display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer', whiteSpace: 'nowrap' },
              title: t('zhHint'),
            }, [
              h('input', {
                type: 'checkbox',
                checked: zhOn,
                onChange: toggleZh,
                style: { margin: 0, cursor: 'pointer' },
              }),
              t('zhSwitch'),
            ])
          : null,
        h('button', {
          style: draft?.dirty ? s.saveBtnDirty : s.saveBtn,
          disabled: !draft?.dirty || saving,
          onClick: save,
        }, t('save')),
        // 刷新 = GET 磁盘权威状态；有脏草稿时再补一次当前阶段的草稿叠加预览，
        // 避免预览短暂回退到「上次保存」的状态。
        h('button', { style: s.saveBtn, onClick: () => { void refresh().then(() => syncDraftPreview()) } }, t('refresh')),
        h('button', { style: s.iconBtn, onClick: onClose, 'aria-label': t('close'), title: t('close') },
          h('svg', { width: 15, height: 15, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true' }, [
            h('path', { d: 'M4 4l8 8M12 4l-8 8', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' }),
          ])),
      ]),
    ]),
    // ── 第二行：agent 预设 Tab（编辑目标） ──
    h('div', { style: s.subhead }, [
      h('div', { style: s.targetRow }, [
        targetTab(undefined, t('targetAllTab')),
        ...agentPresets.map((p) => targetTab(p.id, p.name, p.broken)),
      ]),
    ]),
    // ── 消息条（错误 / 闪示 / 目标异常警示） ──
    h('div', { style: { padding: '0 14px' } }, [
      error ? h('div', { style: s.error }, String(error)) : null,
      flash ? h('div', { style: flashKind === 'err' ? s.error : s.noticeOk }, flash) : null,
      target && agentPresets.find((p) => p.id === target)?.broken
        ? h('div', { style: s.error }, t('brokenPreset'))
        : null,
      inv?.scopeResolved === false && mode !== 'presets'
        ? h('div', { style: s.noticeWarn }, t('scopeFallback'))
        : null,
    ]),
    // ── 主体分栏（flex row：左栏列表 / 右栏预览）──
    // 顶部选「提示词」= 提示词编辑 + 提示词预览；选「工具」= 工具编辑 +
    // 工具预览（previewSub 跟随模式，无手动切换）。阶段由头部统一控制。
    h('div', { key: 'body', style: s.body },
      mode === 'sections'
        ? [
            h(SectionsPane, { key: 'sections', cfg: view, inv, phases, phase, syncAll, t, write: edit }),
            h(PreviewPane, { key: 'preview', t, phases, phase, sub: previewSub }),
          ]
        : mode === 'tools'
          ? [
              h(ToolsPane, { key: 'tools', cfg: view, inv, phases, phase, syncAll, t, write: edit }),
              h(PreviewPane, { key: 'preview', t, phases, phase, sub: previewSub }),
            ]
          : [
              h(PresetsPane, {
                key: 'presets',
                cfg: view,
                inv,
                phases,
                t,
                writePatch,
                writeGlobal,
                // 黑名单永远是全局字段：取原始配置（不经 editView 的目标叠加）。
                envBlocklist: cfg.envBlocklist ?? [],
              }),
              h(SettingsPane, {
                key: 'settings',
                cfg: view,
                inv,
                t,
                writeGlobal,
                saveAsPreset,
                forkSource: target ? (agentPresets.find((p) => p.id === target)?.name ?? target) : undefined,
                onReset: resetAll,
                envBlocklist: cfg.envBlocklist ?? [],
              }),
            ]),
  ])
}

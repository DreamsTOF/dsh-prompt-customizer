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
import { createElement as h, useEffect, useRef, useState, type DragEvent as ReactDragEvent, type ReactElement } from 'react'
import { IconAgentPresetOutlineRegular } from '@deepseek-ai/dsh-client-ui-primitives'
// 预设 chips 行直接复用能力面板（SKILL / MCP）的类名：三处「Agent 预设」几何一致。
import { css } from '../skills/styles.js'
import { payloadOf, dropOnPhase } from './dnd.ts'
import { type Translate } from './locales.ts'
import { s } from './styles.ts'
import {
  PHASES,
  PHASE_KEYS,
  PHASE_LABEL_KEY,
  hasContent,
  sameEntry,
  type AgentPresetInfo,
  type Config,
  type ContextField,
  type EntryRef,
  type Inventory,
  type PhaseKey,
  type PhaseViews,
  type Preview,
  type SectionField,
} from './types.ts'
import { editView, overrideView, type ConfigPatch } from './presets.ts'
import { contextPatch, mirroredRows, mirrorPhaseInjectEntries, mirroredDeniedLists, mirrorSkippedNames } from './phase-ops.ts'
import { SectionsPane } from './SectionsPane.tsx'
import { ToolsPane } from './ToolsPane.tsx'
import { PresetsPane, SettingsPane } from './PresetsPane.tsx'
import { PreviewPane } from './PreviewPane.tsx'
import { makeIoEnv } from './preset-io.ts'

const INVENTORY_URL = '/api/prompt-customizer/inventory'
const AGENT_PRESETS_URL = '/api/prompt-customizer/agent-presets'
const CONFIG_URL = '/api/prompt-customizer/config'
const CONFIG_BATCH_URL = '/api/prompt-customizer/config/batch'
const CONFIG_SET_URL = '/api/prompt-customizer/config/set'
const CONFIG_UNSET_URL = '/api/prompt-customizer/config/unset'
const CONFIG_APPLY_URL = '/api/prompt-customizer/config/apply'
const CONFIG_RESET_URL = '/api/prompt-customizer/config/reset'
const PREVIEW_URL = '/api/prompt-customizer/preview'

/** 编辑草稿里可能出现的字段（与服务端 /config/apply 的 APPLY_FIELDS 一致，由 PHASES 派生）。 */
const DRAFT_FIELDS: string[] = [
  ...PHASES.flatMap((phase) => [phase.sectionField, phase.contextField]),
  'replacements',
  'inject',
  'tools',
]

/** 面板顶层模式：提示词 / 工具 / 预设（预览常驻右栏，不再是独立模式）。 */
type PanelMode = 'sections' | 'tools' | 'presets'

/** 可编辑的配置字段（含每阶段独立段 / 上下文名单）。 */
type EditField = SectionField | ContextField | 'replacements' | 'inject' | 'tools'

/** 编辑域草稿：提示词/工具两栏共享的未保存字段 + 脏标记。
 *  只记录用户实际编辑过的字段（首次编辑只写那一项），保存时也只提交这些
 *  字段 —— 未编辑的字段继续回落全局 / 继承，避免一次保存冻结全部继承值。 */
interface EditDraft extends Partial<Record<SectionField | ContextField, EntryRef[]>> {
  replacements?: Config['replacements']
  inject?: Config['inject']
  tools?: Config['tools']
  dirty: boolean
}

export function Panel({ t, onClose, level = 'preset', workspace }: { t: Translate; onClose?: () => void; level?: 'preset' | 'workspace'; workspace?: string }): ReactElement {
  const [cfg, setCfg] = useState<Config | null>(null)
  const [inv, setInv] = useState<Inventory | null>(null)
  // 三阶段预览装配：模型视角的唯一数据源（加载中为 null）。
  const [phases, setPhases] = useState<PhaseViews | null>(null)
  const [agentPresets, setAgentPresets] = useState<AgentPresetInfo[]>([])
  const [currentPreset, setCurrentPreset] = useState<string | undefined>(undefined)
  const [workspaceOverrides, setWorkspaceOverrides] = useState<Record<string, Config>>({})
  const [currentWorkspace, setCurrentWorkspace] = useState<string | undefined>(undefined)
  const [mode, setMode] = useState<PanelMode>('sections')
  const [error, setError] = useState<string | null>(null)
  // 配置写入计数：每次成功写配置后 +1，驱动预览重载。
  const [version, setVersion] = useState(0)
  // 三阶段视图：左栏列表与右栏预览共用；左右两栏的阶段 Tab 联动切换同一份。
  const [phase, setPhase] = useState<PhaseKey>('bootstrap')
  // 拖拽悬停中的阶段 Tab：高亮提示「松手 = 复制到该阶段」（处理由挂载中的列表负责）。
  const [dropPhase, setDropPhase] = useState<PhaseKey | null>(null)
  // 草稿预览的同步序号：每次发起同步 +1，过期响应（已保存 / 再次编辑后）
  // 直接丢弃，绝不覆盖新数据。
  const syncSeq = useRef(0)
  const refreshSeq = useRef(0)
  // 当前刷新请求的 scope 键：切换编辑目标 / 层级 / 工作区后，在途旧响应直接丢弃。
  const scopeKeyRef = useRef('')
  // 编辑目标：agent 预设 id。0.9.0 起「全部 Agent」入口已移除 —— 提示词必须
  // 按具体预设修改；列表到达后默认选中第一个可用预设（见下方 effect）。
  const [target, setTarget] = useState<string | undefined>(undefined)
  // 三态同步（默认关）：勾选后提示词 / 工具两栏的三态一起生效 —— 提示词栏按
  // 常驻期的并集行集覆写另外两态（增删 / 排序 / 勾选 / 文本一次写全三态），
  // 工具栏的屏蔽与加回对三个阶段同时生效。仅在提示词 / 工具两个模式显示。
  const [syncAll, setSyncAll] = useState(false)
  // 右栏预览的子视图：提示词模式默认看提示词、工具模式默认看工具。
  const [previewSub, setPreviewSub] = useState<'prompt' | 'tools'>('prompt')
  // 编辑域草稿：null = 无草稿（显示磁盘值）。提示词 ↔ 工具切换保留；
  // 切到预设模式或切换编辑目标时丢弃（脏草稿先经确认）。
  const [draft, setDraft] = useState<EditDraft | null>(null)
  const [saving, setSaving] = useState(false)
  // 所有配置写入串行化：预设应用/删除/导入会先后写多个字段，避免两个
  // read-modify-write 请求乱序把前一个字段覆盖掉。
  const writeChain = useRef<Promise<unknown>>(Promise.resolve())
  const enqueueWrite = <T,>(operation: () => Promise<T>): Promise<T> => {
    const next = writeChain.current.then(operation, operation)
    writeChain.current = next.then(() => undefined, () => undefined)
    return next
  }
  const [flash, setFlash] = useState<string | null>(null)
  const [flashKind, setFlashKind] = useState<'ok' | 'err'>('ok')
  const [backingUp, setBackingUp] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [cleaning, setCleaning] = useState(false)
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadConfig = (): Promise<Error | null> => fetch(CONFIG_URL + `?t=${Date.now()}`)
    .then((r) => r.json())
    .then((body) => {
      if (body?.ok !== true) throw new Error(body?.error ?? 'config failed')
      setCfg(body.config as Config)
      setWorkspaceOverrides((body.workspaceOverrides ?? {}) as Record<string, Config>)
      setCurrentWorkspace(typeof body.currentWorkspace === 'string' && body.currentWorkspace !== '' ? body.currentWorkspace : undefined)
      setError(null)
      return null
    })
    .catch((e: unknown) => {
      const error = e instanceof Error ? e : new Error(String(e))
      setError(error.message)
      return error
    })
  const load = (): void => { void loadConfig() }
  useEffect(load, [])

  // 返回 Promise：手动刷新后可以链上草稿补同步（见「刷新」按钮）。
  const refresh = (): Promise<void> => {
    // 刷新按钮必须重读 /config：只刷新 preview 会让 editView 仍基于旧
    // overrides，之后再次保存可能把外部修改覆盖掉。
    const configReady = loadConfig()
    const seq = ++refreshSeq.current
    // scope 键 = 层级 + 预设 + 工作区：响应回来时若已切换目标，整包丢弃。
    const scopeKey = `${level}\u0000${target ?? ''}\u0000${level === 'workspace' ? (workspace ?? currentWorkspace ?? '') : ''}`
    scopeKeyRef.current = scopeKey
    // 提示词/工具严格按具体预设：未选定预设前不发无 scope 请求（避免并集串台）。
    if (level === 'preset' && target === undefined) {
      setPhases(null)
      setInv(null)
      return Promise.resolve()
    }
    const wsSel = level === 'workspace' ? (workspace ?? currentWorkspace ?? '') : ''
    const qs = `${target ? `?scope=${encodeURIComponent(target)}` : ''}${wsSel === '' ? '' : `${target ? '&' : '?'}workspace=${encodeURIComponent(wsSel)}`}`
    // 先清空三阶段再发请求：切换目标期间绝不能拿上一份装配当当前目标。
    setPhases(null)
    setInv(null)
    // 三阶段与清单都读取当前模式；累计池仅供添加参考，不替代预设装配。
    const params = (phase: string): string =>
      `${qs}${qs ? '&' : '?'}phase=${phase}&t=${Date.now()}`
    const failures: string[] = []
    const grab = (phase: string): Promise<Preview | null> =>
      fetch(PREVIEW_URL + params(phase))
        .then((r) => r.json())
        .then((body: Preview) => {
          if (body.ok === false) throw new Error(body.error ?? t('previewFail'))
          return body
        })
        .catch((error: unknown) => {
          failures.push(`${phase}: ${String(error instanceof Error ? error.message : error)}`)
          return null
        })
    return Promise.all([configReady, ...PHASE_KEYS.map(grab), fetch(INVENTORY_URL + qs).then((r) => r.json()).then(body => {
      if (body.ok === false) throw new Error(body.error ?? 'inventory failed')
      return body
    }).catch((error: unknown) => {
      failures.push(String(error instanceof Error ? error.message : error))
      return null
    })])
      .then((responses) => {
        const inventoryData = responses[responses.length - 1] as unknown as Inventory | null
        if (seq !== refreshSeq.current || scopeKey !== scopeKeyRef.current) return
        const views = { ...({} as PhaseViews) }
        PHASE_KEYS.forEach((key, index) => { views[key] = responses[index + 1] as Preview | null })
        setPhases(views)
        setInv(inventoryData as Inventory)
        const configError = responses[0] as unknown as Error | null
        setError(configError !== null ? configError.message : failures.length ? failures.join('\n') : null)
      })
      .catch((e: unknown) => {
        if (seq !== refreshSeq.current || scopeKey !== scopeKeyRef.current) return
        const empty = {} as PhaseViews
        for (const key of PHASE_KEYS) empty[key] = null
        setPhases(empty)
        setError(String(e instanceof Error ? e.message : e))
      })
  }
  // 挂载时与切换编辑目标后：清单与三阶段预览切到对应 scope。
  // version 入依赖：保存/写配置成功后 +1，驱动重新拉取（否则一直显示保存前的装配）。
  useEffect(() => { void refresh() }, [target, version, level, workspace, currentWorkspace])

  // 草稿实时预览：把未保存的编辑草稿补丁 POST 给 /preview（服务端只在内存里
  // 叠加，磁盘不动），只刷新当前阶段视图 —— 预览随改随动；保存后的 GET 全量
  // 拉取会覆盖回权威状态。syncSeq 让过期响应（又编辑了 / 已保存）直接丢弃。
  const syncDraftPreview = (): void => {
    if (draft === null || !draft.dirty) return
    if (level !== 'preset') return // 工作区级草稿预览走保存后重拉，不叠加到预设预览
    const patch: Record<string, unknown> = {}
    const source = draft as unknown as Record<string, unknown>
    for (const field of DRAFT_FIELDS) {
      if (Object.hasOwn(source, field)) patch[field] = source[field]
    }
    if (Object.keys(patch).length === 0) return
    const seq = ++syncSeq.current
    // scope 走查询串（服务端 previewTarget 只认 query）：草稿补丁必须落在
    // 当前编辑的预设上，否则生效视图为空、预览退回官方原样。工作区级不走
    // 草稿实时预览（上面已提前返回）。
    const scopeQs = target !== undefined ? `?scope=${encodeURIComponent(target)}` : ''
    fetch(PREVIEW_URL + scopeQs, {
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
  }, [draft, phase, target, level, workspace, currentWorkspace])

  // 枚举已安装的 agent 预设（roster 实时读取），给顶部预设 Tab 供货。
  // 抽成函数：保存预设成功后也要立即刷新 Tab 行。
  const fetchPresets = (): void => {
    fetch(AGENT_PRESETS_URL + `?t=${Date.now()}`)
      .then((r) => r.json())
      .then((body) => {
        setAgentPresets(Array.isArray(body?.presets) ? body.presets as AgentPresetInfo[] : [])
        setCurrentPreset(typeof body?.currentPreset === 'string' && body.currentPreset !== '' ? body.currentPreset : undefined)
      })
      .catch(() => { setAgentPresets([]); setCurrentPreset(undefined) })
  }
  useEffect(() => { fetchPresets() }, [])

  // 默认编辑目标：预设名单异步到达后补选一次（首个可用预设，全失效则首个）。
  // 只在尚未选择时生效 —— 用户此后切换 / 名单刷新都不覆盖当前选择。
  useEffect(() => {
    setTarget((current) => {
      if (current !== undefined) return current
      const live = currentPreset === undefined ? undefined : agentPresets.find((p) => p.id === currentPreset && !p.broken)
      if (live !== undefined) return live.id
      const first = agentPresets.find((p) => !p.broken) ?? agentPresets[0]
      return first?.id
    })
  }, [agentPresets, currentPreset])

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
  // 工作区级：把该工作区的 override 当作编辑源（叠在预设级之上、运行时工作区优先）。
  const wsKey = workspace ?? currentWorkspace ?? undefined
  const base = level === 'workspace'
    ? overrideView(cfg, wsKey !== undefined ? workspaceOverrides[wsKey] : undefined)
    : editView(cfg, target)
  const view: Config = (() => {
    if (draft === null) return base
    const next: Config = {
      ...base,
      replacements: draft.replacements ?? base.replacements,
      inject: draft.inject ?? base.inject,
      tools: draft.tools ?? base.tools,
    }
    for (const phase of PHASES) {
      next[phase.sectionField] = draft[phase.sectionField] ?? base[phase.sectionField]
      next[phase.contextField] = draft[phase.contextField] ?? base[phase.contextField]
    }
    return next
  })()
  // 三态基座始终用「所选预设」的逐阶段装配（预设超集）。工作区级不能拿当前会话
  // 视图顶替：会话可能属于别的预设，会把该预设的专属段/工具漏掉（如 ptc 的 tools:ptc-only）。
  const ep: PhaseViews | null = phases

  const writeField = (field: string, value: unknown): Promise<boolean> => {
    const url = value === undefined ? CONFIG_UNSET_URL : CONFIG_SET_URL
    return enqueueWrite(async () => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ field, value }),
      })
      const body = await response.json()
      if (body?.ok !== true) throw new Error(body?.error ?? 'write failed')
      setCfg(body.config as Config)
      setError(null)
      setVersion((n) => n + 1)
      return true
    }).catch((e: unknown) => {
      setError(String(e instanceof Error ? e.message : e))
      return false
    })
  }

  const writeGlobalBatch = (fields: Record<string, unknown>): Promise<boolean> => {
    return enqueueWrite(async () => {
      const response = await fetch(CONFIG_BATCH_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ fields }),
      })
      const body = await response.json()
      if (body?.ok !== true) throw new Error(body?.error ?? 'batch write failed')
      setCfg(body.config as Config)
      setError(null)
      setVersion((n) => n + 1)
      return true
    }).catch((e: unknown) => {
      setError(String(e instanceof Error ? e.message : e))
      return false
    })
  }

  // 两栏的写入：只改内存草稿，不落盘。草稿只记录被编辑的这一字段 —— 保存时
  // 也只会提交编辑过的字段。/config/apply 必带 target（agent 预设 id，0.9.0
  // 起服务端拒绝无目标写盘），写 overrides[id]（字段级接管语义在保存时生效）。
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
    if (level === 'workspace' && wsKey === undefined) { showFlash(t('workspaceRequired'), 'err'); return }
    const patch: Record<string, unknown> = {}
    const edited = draft as unknown as Record<string, unknown>
    for (const field of DRAFT_FIELDS) {
      if (Object.hasOwn(edited, field)) patch[field] = edited[field]
    }
    setSaving(true)
    // 保存也必须走同一条写队列：预设 Apply/Delete/Import 尚未完成时点保存，
    // 不会和它们并发覆盖。
    void enqueueWrite(async () => {
      const response = await fetch(CONFIG_APPLY_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(level === 'workspace' ? { level: 'workspace', workspace: wsKey, patch } : { target, patch }),
      })
      const body = await response.json()
      if (body?.ok !== true) throw new Error(body?.error ?? 'save failed')
      setCfg(body.config as Config)
      if (body.workspaceOverrides !== undefined) setWorkspaceOverrides(body.workspaceOverrides as Record<string, Config>)
      clearDraft()
      setError(null)
      setVersion((n) => n + 1)
      showFlash(t('saveOk'))
    }).catch((e: unknown) => setError(`${t('saveFail')}: ${e instanceof Error ? e.message : String(e)}`))
      .finally(() => setSaving(false))
  }

  // 预设模式的「应用」：显式意图直接落盘（不经草稿），完整补丁一次写入当前
  // 编辑目标。调用点已在离开编辑域时清空草稿，不会有并发草稿写盘。
  const writePatch = (patch: ConfigPatch): Promise<boolean> => {
    return enqueueWrite(async () => {
      const response = await fetch(CONFIG_APPLY_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ target, patch }),
      })
      const body = await response.json()
      if (body?.ok !== true) throw new Error(body?.error ?? 'apply failed')
      setCfg(body.config as Config)
      setError(null)
      setVersion((n) => n + 1)
      return true
    }).catch((e: unknown) => {
      setError(String(e instanceof Error ? e.message : e))
      return false
    })
  }
  // 应用快照：按当前层级写入——工作区级写 workspaceOverrides[cwd]，否则写预设级 overrides[target]。
  const writePatchLayered = (patch: ConfigPatch): Promise<boolean> => {
    if (level === 'workspace') {
      const cwd = workspace ?? currentWorkspace
      if (cwd === undefined || cwd === null || cwd === '') { showFlash(t('workspaceRequired'), 'err'); return Promise.resolve(false) }
      return enqueueWrite(async () => {
        const response = await fetch(CONFIG_APPLY_URL, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ level: 'workspace', workspace: cwd, patch }),
        })
        const body = await response.json()
        if (body?.ok !== true) throw new Error(body?.error ?? 'apply failed')
        setCfg(body.config as Config)
        if (body.workspaceOverrides !== undefined) setWorkspaceOverrides(body.workspaceOverrides as Record<string, Config>)
        setError(null)
        setVersion((n) => n + 1)
        return true
      }).catch((e: unknown) => {
        setError(String(e instanceof Error ? e.message : e))
        return false
      })
    }
    return writePatch(patch)
  }

  // 运行时上下文显隐：和提示词/工具一样进草稿，统一保存时一次落盘；不立即刷新。
  // 每个阶段只用各自的 baseContexts 计算 hidden；三态同步要求三阶段都就绪
  // （缺一态绝不把该阶段当空集写掉）。
  const toggleContext = (entry: EntryRef, hide: boolean): void => {
    const keys = syncAll ? PHASE_KEYS : [phase]
    const targets = keys.map((key) => ({ key, view: phases?.[key] }))
    if (targets.some(({ view }) => view === null || view === undefined || !Array.isArray(view.baseContexts))) {
      showFlash(t('contextsNotReady'), 'err')
      return
    }
    for (const { key } of targets) {
      const patch = contextPatch(view, key, entry, hide)
      for (const [field, value] of Object.entries(patch)) edit(field as ContextField, value)
    }
  }
  // 预设库（presets / activePreset）永远保持在全局字段，不分作用域。
  const writeGlobal = writeField

  /** 该条目是否在目标阶段的装配输入（base 视图）里：镜像时据此决定「只写 order」还是「必须带正文」。 */
  const nativeIn = (key: PhaseKey, entry: EntryRef): boolean | null => {
    const view = ep?.[key]
    if (view === undefined || view === null) return null
    return (view.baseSections ?? []).some((section) => sameEntry(section, entry))
  }

  // 「三态同步」开关（头部工具栏）：勾选瞬间即按常驻期的并集行集覆写另外两态
  // （inject + 三份屏蔽名单写入编辑草稿，点「保存」生效）；之后提示词栏的任何
  // 增删 / 排序 / 勾选 / 文本编辑都一次写全三个阶段（见 SectionsPane 的 persistMirror）。
  // 三阶段装配未就绪（或为空）时拒绝执行 —— 缺一态会把该阶段当空集写掉。
  const toggleSyncAll = (on: boolean): void => {
    if (!on) { setSyncAll(false); return }
    if (ep === null || PHASE_KEYS.some((key) => ep[key] === null)) {
      showFlash(t('syncNotReady'), 'err')
      return
    }
    const rows = mirroredRows(view, ep, nativeIn)
    if (rows.length === 0) {
      showFlash(t('syncNotReady'), 'err')
      return
    }
    setSyncAll(true)
    edit('inject', mirrorPhaseInjectEntries(view, rows, nativeIn))
    const denied = mirroredDeniedLists(rows)
    for (const descriptor of PHASES) edit(descriptor.sectionField, denied[descriptor.sectionField])
    const skipped = mirrorSkippedNames(rows, nativeIn)
    showFlash(skipped.length > 0
      ? `${t('syncApplied')} ${t('syncSkippedDynamic', { names: skipped.join('、') })}`
      : t('syncApplied'))
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

  // 切换自定义层级：预设级 ↔ 工作区级（工作区级作用于当前工作区、覆盖预设级）。

  // 切换编辑目标（顶部预设 Tab）：草稿基线随目标变化，脏草稿先经确认再丢弃。
  const switchTarget = (next: string | undefined): void => {
    if (draft?.dirty && !window.confirm(t('discardConfirm'))) return
    clearDraft()
    setTarget(next)
  }

  // 单预设定制导入/导出：只读写 overrides[target]，不涉及宿主预设定义。
  const exportPreset = (): void => {
    if (target === undefined) { showFlash(t('presetIoNoTarget'), 'err'); return }
    fetch(`/api/prompt-customizer/export?scope=${encodeURIComponent(target)}`)
      .then((r) => r.json())
      .then((body) => {
        if (body?.ok !== true) throw new Error(body?.error ?? 'export failed')
        const filename = `prompt-customizer-${target}.json`
        const text = JSON.stringify(body, null, 2)
        const io = makeIoEnv()
        void io.saveText(filename, text).then((outcome) => {
          if (outcome.kind === 'saved') showFlash(t('presetIoOk', { name: filename }), 'ok')
          else if (outcome.kind === 'unavailable') { io.download(filename, text); showFlash(t('presetIoOk', { name: filename }), 'ok') }
        })
      })
      .catch((e: unknown) => showFlash(`${t('presetIoFail')}: ${String(e instanceof Error ? e.message : e)}`, 'err'))
  }

  const importPreset = (text: string): void => {
    if (target === undefined) { showFlash(t('presetIoNoTarget'), 'err'); return }
    let parsed: { format?: unknown; customization?: unknown }
    try { parsed = JSON.parse(text) } catch { showFlash(t('presetIoBadFormat'), 'err'); return }
    const customization = parsed?.customization
    if (parsed?.format !== 'dsh-prompt-customizer/export@1' || customization === null || typeof customization !== 'object' || Array.isArray(customization)) {
      showFlash(t('presetIoBadFormat'), 'err')
      return
    }
    if (!window.confirm(t('presetIoConfirm', { target }))) return
    fetch('/api/prompt-customizer/import', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ target, customization }),
    })
      .then((r) => r.json())
      .then((body) => {
        if (body?.ok !== true) throw new Error(body?.error ?? 'import failed')
        setCfg(body.config as Config)
        setVersion((n) => n + 1)
        showFlash(t('presetIoImported'), 'ok')
      })
      .catch((e: unknown) => showFlash(`${t('presetIoFail')}: ${String(e instanceof Error ? e.message : e)}`, 'err'))
  }

  const cleanupEmpty = (): void => {
    if (cleaning) return
    if (!window.confirm(t('cleanupConfirm'))) return
    setCleaning(true)
    fetch('/api/prompt-customizer/overrides/cleanup', { method: 'POST' })
      .then((r) => r.json())
      .then((body) => {
        if (body?.ok !== true) throw new Error(body?.error ?? 'cleanup failed')
        setCfg(body.config as Config)
        setVersion((n) => n + 1)
        showFlash(t('cleanupOk', { n: Array.isArray(body.removed) ? body.removed.length : 0 }), 'ok')
      })
      .catch((e: unknown) => showFlash(`${t('cleanupFail')}: ${String(e instanceof Error ? e.message : e)}`, 'err'))
      .finally(() => setCleaning(false))
  }

  // 全量备份：整库（全部提示词配置 + 目录池 + 账本）导出为 JSON。
  const backupAll = (): void => {
    if (backingUp) return
    setBackingUp(true)
    fetch('/api/prompt-customizer/backup')
      .then((r) => r.json())
      .then((body) => {
        if (body?.ok !== true) throw new Error(body?.error ?? 'backup failed')
        const filename = `dsh-prompt-customizer-backup-${new Date().toISOString().slice(0, 10)}.json`
        const text = JSON.stringify(body, null, 2)
        const io = makeIoEnv()
        void io.saveText(filename, text).then((outcome) => {
          if (outcome.kind === 'saved') showFlash(t('backupOk', { name: filename }), 'ok')
          else if (outcome.kind === 'unavailable') { io.download(filename, text); showFlash(t('backupOk', { name: filename }), 'ok') }
        })
      })
      .catch((e: unknown) => showFlash(`${t('backupFail')}：${String(e instanceof Error ? e.message : e)}`, 'err'))
      .finally(() => setBackingUp(false))
  }

  // 恢复：解析备份 JSON → 二次确认 → 整库替换。
  const restoreAll = (text: string): void => {
    let parsed: { format?: unknown; docs?: unknown }
    try { parsed = JSON.parse(text) } catch { showFlash(t('restoreBadFormat'), 'err'); return }
    if (parsed?.format !== 'dsh-prompt-customizer/backup@1' || parsed.docs === null || typeof parsed.docs !== 'object') {
      showFlash(t('restoreBadFormat'), 'err')
      return
    }
    if (!window.confirm(t('restoreConfirm'))) return
    setRestoring(true)
    fetch('/api/prompt-customizer/restore', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(parsed),
    })
      .then((r) => r.json())
      .then((body) => {
        if (body?.ok !== true) throw new Error(body?.error ?? 'restore failed')
        setCfg(body.config as Config)
        if (body.workspaceOverrides !== undefined) setWorkspaceOverrides(body.workspaceOverrides as Record<string, Config>)
        clearDraft()
        setError(null)
        setVersion((n) => n + 1)
        showFlash(t('restoreOk'), 'ok')
      })
      .catch((e: unknown) => setError(`${t('restoreFail')}: ${e instanceof Error ? e.message : String(e)}`))
      .finally(() => setRestoring(false))
  }

  const modeBtn = (key: PanelMode, label: string): ReactElement =>
    h('button', { key, style: mode === key ? s.segBtnActive : s.segBtn, onClick: () => switchMode(key) }, label)

  // 阶段按钮命名（唯一来源：PHASE_LABEL_KEY 表）。
  const stageLabel = (key: PhaseKey): string => t(PHASE_LABEL_KEY[key])
  const draftDirty = draft?.dirty === true

  /**
   * 编辑目标 chip：与 SKILL / MCP 顶栏的预设 chips 用同一套类名（几何、配色、
   * 悬停与选中态完全对齐）。尾部数字 = 该预设已定制的字段数（有则橙色），
   * 与 MCP 的「数字 + 橙色 = 有单独设置」同一读法；失效预设置换成「失效」标记。
   */
  const targetChip = (id: string, label: string, icon: ReactElement, broken?: string): ReactElement => {
    const active = target === id
    const bad = broken !== undefined && broken !== ''
    // 只统计「非空」字段：空数组 / 空对象不算定制（否则每个预设都显示满计数）。
    const customized = Object.values(cfg?.overrides?.[id] ?? {}).filter(hasContent).length
    return h('button', {
      key: id,
      type: 'button',
      className: css.catItem,
      'data-active': active || undefined,
      onClick: () => switchTarget(id),
      title: bad
        ? `${label} — ${t('broken')}`
        : customized > 0 ? `${label} · ${t('targetCustomized', { n: customized })}` : label,
    }, [
      h('span', { className: css.catIcon, 'data-active': active || undefined }, icon),
      h('span', { className: css.catLabel }, label),
      bad ? h('span', { className: css.catCount, 'data-warn': true }, t('broken')) : null,
      !bad && customized > 0 ? h('span', { className: css.catCount, 'data-warn': true }, String(customized)) : null,
    ])
  }

  return h('div', { style: s.pRoot }, [
    // ── 第一行：agent 预设（编辑目标）──
    // 与 SKILL / MCP 顶栏同款 chips 行（同一套类名 + 图标 + 计数），且排在
    // 定制面板自己的头部之上：三个 tab 的「预设在上」节奏一致。
    // 0.9.0 起「全部 Agent」入口移除：提示词必须按具体预设修改，无全局目标。
    h('div', { key: 'targets', className: css.topbar }, [
      h('div', { className: css.chipRow, role: 'group', 'aria-label': t('targetLabel') }, [
        ...agentPresets.map((p) => targetChip(p.id, p.name, h(IconAgentPresetOutlineRegular, { size: 15 }), p.broken)),
      ]),
    ]),
    // ── 第二行：标题 + 模式切换 + （阶段切换 + 开关） + 工具栏 ──
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
          ? h('div', { style: s.seg }, PHASE_KEYS.map((key) => h('button', {
              key,
              style: dropPhase === key
                ? (phase === key ? s.segBtnDropActive : s.segBtnDrop)
                : phase === key ? s.segBtnActive : s.segBtn,
              onClick: () => setPhase(key),
              // 拖到阶段 Tab = 把行复制到那个阶段（段 / 工具各按自己的语义落地）。
              onDragOver: (event: ReactDragEvent) => {
                if (payloadOf(event) === null) return
                event.preventDefault()
                setDropPhase(key)
              },
              onDragLeave: () => setDropPhase((current) => (current === key ? null : current)),
              onDrop: (event: ReactDragEvent) => {
                const payload = payloadOf(event)
                setDropPhase(null)
                if (payload === null) return
                event.preventDefault()
                dropOnPhase(key, payload)
              },
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
                onChange: (e: { target: { checked: boolean } }) => toggleSyncAll(e.target.checked),
                style: { margin: 0, cursor: 'pointer' },
              }),
              t('syncAllPhases'),
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
        // 关闭按钮只在独立开窗时给出（onClose 缺省 = 由外层 tab 承载，不需要它）。
        onClose === undefined ? null : h('button', { style: s.iconBtn, onClick: onClose, 'aria-label': t('close'), title: t('close') },
          h('svg', { width: 15, height: 15, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true' }, [
            h('path', { d: 'M4 4l8 8M12 4l-8 8', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' }),
          ])),
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
      level === 'workspace' && currentWorkspace === undefined
        ? h('div', { style: s.noticeWarn }, t('workspaceNoSession'))
        : null,
    ]),
    // ── 主体分栏（flex row：左栏列表 / 右栏预览）──
    // 顶部选「提示词」= 提示词编辑 + 提示词预览；选「工具」= 工具编辑 +
    // 工具预览（previewSub 跟随模式，无手动切换）。阶段由头部统一控制。
    h('div', { key: 'body', style: s.body },
      mode === 'sections'
        ? [
            h(SectionsPane, { key: 'sections', cfg: view, inv, phases: ep, phase, syncAll, t, write: edit }),
            h(PreviewPane, { key: 'preview', t, phases: ep, phase, sub: previewSub, onToggleContext: toggleContext }),
          ]
        : mode === 'tools'
          ? [
              h(ToolsPane, { key: 'tools', cfg: view, inv, phases: ep, phase, syncAll, t, write: edit }),
              h(PreviewPane, { key: 'preview', t, phases: ep, phase, sub: previewSub, onToggleContext: toggleContext }),
            ]
          : [
              h(PresetsPane, {
                key: 'presets',
                cfg: view,
                inv,
                phases: ep,
                t,
                writePatch: writePatchLayered,
                applyLevel: level,
                applyTargetName: level === 'workspace' ? (workspace ?? currentWorkspace ?? undefined) : target,
                writeGlobal,
                writeGlobalBatch,
                // 黑名单永远是全局字段：取原始配置（不经 editView 的目标叠加）。
                envBlocklist: cfg.envBlocklist ?? [],
              }),
              h(SettingsPane, {
                key: 'settings',
                cfg: view,
                inv,
                t,
                writeGlobal,
                onBackupAll: backupAll,
                onRestoreAll: restoreAll,
                backingUp,
                restoring,
                cleaning,
                target,
                onExportPreset: exportPreset,
                onImportPreset: importPreset,
                onCleanupEmpty: cleanupEmpty,
                onReset: resetAll,
                envBlocklist: cfg.envBlocklist ?? [],
              }),
            ]),
  ])
}

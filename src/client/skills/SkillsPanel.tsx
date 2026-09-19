/**
 * SkillsPanel — 能力管理面板（SKILL / MCP 双顶层 tab）。
 *
 * 拆分后的编排层：持有全部状态与操作，按页签渲染顶栏（TopBar）与主区
 * （SkillsView / McpView），并统管二级弹窗（添加技能、新建技能包、设置分类、
 * 删除确认、文件查看器、归入技能包）与右下角操作回执。
 *
 * 数据全部走 /api/skill-manager、/api/skill-toggles、/api/skill-health、
 * /api/triad/mcp-* 。拆分只移动代码，未改动 DOM 结构与类名。
 */
import { useEffect, useRef, useState, type CSSProperties, type DragEvent, type FormEvent } from 'react'
import {
  Button, IconChevronDownOutline14, IconFolderOpenOutline16, Modal,
} from '@deepseek-ai/dsh-client-ui-primitives'
import { PshBody, PopoverShell, type PopoverAnchor } from '../popover-shell'
import { PromptView } from '../prompt/PromptView'
import { skillApi } from './api.js'
import { collectEntry, fileToBase64 } from './files.js'
import { GuidePanel } from './GuidePanel.js'
import { CloudUpIcon } from './icons.js'
import { skillT } from './locales.js'
import { McpAddModal } from './McpAddModal.js'
import { McpView } from './McpView.js'
import {
  MCP_TOOL_WATCH_INTERVAL_MS, MCP_TOOL_WATCH_TIMEOUT_MS, mcpRegisteredToolCountOf, useMcpLiveState,
} from './mcp-live.js'
import { CategoryEditor } from './SkillCard.js'
import { SkillViewer, VIEWER_FONT_SIZES, readViewerPrefs, writeViewerPrefs } from './SkillViewer.js'
import { SkillsView } from './SkillsView.js'
import { css, ensureStyles } from './styles.js'
import { McpTopBar, PanelHead, SkillTopBar } from './TopBar.js'
import { ALL_PRESETS, UNCATEGORIZED, sortCategories } from './types.js'
import type {
  BundleInfo, CollectedFile, ConfirmState, HealthView, InstallState, PanelState, PresetRow, SkillInfo, ViewerState,
} from './types.js'
const SKILL_NAME_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/

/** 从 SKILL.md 文本里取 frontmatter 的 name（安装弹窗预览真实技能名用）。 */
function frontmatterName(text: string): string | null {
  const lines = text.split(/\r?\n/).slice(0, 80)
  if ((lines[0] ?? '').trim() !== '---') return null
  for (const line of lines.slice(1)) {
    if (line.trim() === '---') break
    const pair = /^\s*name\s*:\s*(.+?)\s*$/.exec(line)
    if (pair !== null) return (pair[1] ?? '').replace(/^["']|["']$/g, '')
  }
  return null
}
export function SkillsPanel({ onClose, closing = false, anchor = null, onCardMouseEnter, onCardMouseLeave }: { onClose: () => void; closing?: boolean; anchor?: PopoverAnchor | null; onCardMouseEnter?: () => void; onCardMouseLeave?: () => void }): JSX.Element {
  ensureStyles()
  const [state, setState] = useState<PanelState>({ status: 'loading' })
  const [reload, setReload] = useState(0)
  // 分区展开集合：默认空 = 全部收起（面板打开时只显示技能包标题行）。
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  // 散装技能区展开。
  const [looseOpen, setLooseExpanded] = useState(false)
  const [viewer, setViewer] = useState<ViewerState | null>(null)
  /** 查看器偏好：字号档位 + 是否全屏（localStorage 持久化，跨会话记住）。 */
  const [viewerFont, setViewerFont] = useState<number>(() => readViewerPrefs().font)
  const [viewerFull, setViewerFull] = useState<boolean>(() => readViewerPrefs().full)
  const [assignTarget, setAssignTarget] = useState<SkillInfo | null>(null)
  const [newBundleOpen, setNewBundleOpen] = useState(false)
  const [newBundleName, setNewBundleName] = useState('')
  /** 新建技能包弹窗里同时挂的分类。 */
  const [newBundleCats, setNewBundleCats] = useState<string[]>([])
  const [creatingBundle, setCreatingBundle] = useState(false)
  const [renameTarget, setRenameTarget] = useState<{ bundleId: string; name: string } | null>(null)
  const [renaming, setRenaming] = useState(false)
  // 改名成功的卡片 id：触发一次高亮脉冲，随后自动清除。
  const [renamedFlash, setRenamedFlash] = useState<string | null>(null)
  const renamedTimer = useRef<number | null>(null)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [install, setInstall] = useState<InstallState | null>(null)
  /** 添加技能弹窗开关（选完文件后同一弹窗内填表单）。 */
  const [addOpen, setAddOpen] = useState(false)
  const [installName, setInstallName] = useState('')
  const [installDescription, setInstallDescription] = useState('')
  const [installBundleId, setInstallBundleId] = useState<string | undefined>(undefined)
  const [installing, setInstalling] = useState(false)
  const [installError, setInstallError] = useState<string | null>(null)
  /**
   * 面板级提示条。旧实现把所有失败都塞进 installError，而它只在「添加技能」弹窗里
   * 渲染 —— 于是删除技能、归组、改名、开关失败时面板上什么都不显示，用户只看到
   * 「点了没反应」。成败反馈统一走这里。
   */
  const [toasts, setToasts] = useState<Array<{ id: number; tone: 'ok' | 'err'; text: string }>>([])
  const toastTimers = useRef<number[]>([])
  const pushToast = (tone: 'ok' | 'err', text: string): void => {
    const id = Date.now() + Math.random()
    setToasts((current) => [...current.slice(-2), { id, tone, text }])
    const timer = window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id))
    }, tone === 'err' ? 6400 : 2800)
    toastTimers.current.push(timer)
  }
  /** 统一失败提示：label 说清是哪一步，message 用 host 原文。 */
  const failToast = (label: string, error: unknown): void => {
    pushToast('err', skillT('opFailed', { label, message: error instanceof Error ? error.message : String(error) }))
  }
  /** 文件夹导入时 SKILL.md 里写的技能名：与用户填的名字不一致时提前说明会改写。 */
  const [installMetaName, setInstallMetaName] = useState<string | null>(null)
  useEffect(() => {
    if (install === null || install.archive === true) { setInstallMetaName(null); return undefined }
    const entry = install.files.find((item) => item.path === 'SKILL.md')
    if (entry === undefined) { setInstallMetaName(null); return undefined }
    let current = true
    void entry.file.text().then((text) => {
      if (!current) return
      setInstallMetaName(frontmatterName(text))
    }, () => { if (current) setInstallMetaName(null) })
    return () => { current = false }
  }, [install])
  const [dropActive, setDropActive] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  // 技能/技能包开关状态（skillName → enabled；bundleId → enabled）
  const [toggles, setToggles] = useState<{ skills: Record<string, boolean>; bundles: Record<string, boolean> }>({ skills: {}, bundles: {} })
  // 切换进行中的 key（避免重复点击）
  const [toggling, setToggling] = useState<Set<string>>(new Set())
  // Agent 预设分类：名单 + 各预设覆盖 + 当前选中的预设（'*' = 全部 Agent）
  const [presets, setPresets] = useState<PresetRow[]>([])
  const [overrides, setOverrides] = useState<Record<string, Record<string, boolean>>>({})
  const [activePreset, setActivePreset] = useState<string>(ALL_PRESETS)
  // Skills Hub 工具栏：搜索词 / 来源筛选(全部=all|bundles|loose) / 名称排序 / 视图切换
  const [query, setQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState<'all' | 'bundles' | 'loose'>('all')
  const [sortAsc, setSortAsc] = useState(true)
  const [viewMode] = useState<'grid' | 'list'>('grid')
  /** 左栏分类 / 筛选：启用状态 + Agent 预设（分类切换由左栏「Agent 预设分类」驱动）。 */
  const [statusFilter, setStatusFilter] = useState<'all' | 'on' | 'off'>('all')
  /** 技能包分类筛选：null = 不筛；分类名或 UNCATEGORIZED = 只看该类。 */
  const [catFilter, setCatFilter] = useState<string | null>(null)
  /** 「设置分类」弹窗的目标包（null = 关）；catDraft 是弹窗内的编辑副本。 */
  const [catTarget, setCatTarget] = useState<{ bundleId: string; name: string } | null>(null)
  const [catDraft, setCatDraft] = useState<string[]>([])
  const [savingCats, setSavingCats] = useState(false)
  /** 自定义下拉/菜单：来源筛选 / Agent 预设 / 名称排序 / 快捷筛选 / 行内更多菜单（哪个开着，null = 都关）。 */
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  /** 同步状态：/api/skill-health 只读扫描结果（缺 SKILL.md 等）。 */
  const [health, setHealth] = useState<HealthView>({ state: 'loading' })
  /** 快速上手指南弹窗开关。 */
  const [guideOpen, setGuideOpen] = useState(false)
  /** 左侧顶层 tab：SKILL（技能管理）/ MCP（MCP Server）。 */
  const [kind, setKind] = useState<'skill' | 'mcp' | 'prompt'>('skill')
  /** MCP 页范围（'' = 全部 Agent）。 */
  const [mcpScope, setMcpScope] = useState('')
  /** MCP Server 搜索词。 */
  const [mcpQuery, setMcpQuery] = useState('')
  /** MCP 启用状态筛选（作用于全局条目）。 */
  const [mcpStatusFilter, setMcpStatusFilter] = useState<'all' | 'on' | 'off'>('all')
  /** 真实 MCP 注册状态（/api/triad/mcp-status）：MCP 页唯一数据源。 */
  const [mcpLive, mcpRefreshLive] = useMcpLiveState()
  /** 添加 MCP Server（粘贴 JSON / YAML）弹窗开关。 */
  const [mcpAddOpen, setMcpAddOpen] = useState(false)
  /** 添加「预设专属 Server」弹窗开关（按钮在 MCP 顶栏，弹窗由 McpView 渲染）。 */
  const [mcpAddOwnOpen, setMcpAddOwnOpen] = useState(false)
  /* ── 添加/启用后自动等工具注册 ────────────────────────────────────────
   * 写配置只是让 DSH 热重载那一行；MCP 进程要晚几秒才连上并注册工具。
   * 之前只刷新一次 → 面板上 Server 有了但工具是空的，用户还得自己点「刷新」。
   * 这里按 2s 轮询，目标都报出工具（或 90s 超时）就收工。 */
  const mcpWatchTimer = useRef<number | null>(null)
  const [mcpWaitingTools, setMcpWaitingTools] = useState<string[]>([])
  /** 最新状态快照：定时器回调里读不到新的闭包值。 */
  const mcpLiveRef = useRef(mcpLive)
  useEffect(() => { mcpLiveRef.current = mcpLive }, [mcpLive])
  const stopMcpWatch = (): void => {
    if (mcpWatchTimer.current !== null) {
      window.clearInterval(mcpWatchTimer.current)
      mcpWatchTimer.current = null
    }
    setMcpWaitingTools([])
  }
  /** 立即刷新一次，然后轮询到这些 Server 注册出工具为止（超时/全部就绪即停）。 */
  const watchMcpTools = (names: string[]): void => {
    if (mcpWatchTimer.current !== null) {
      window.clearInterval(mcpWatchTimer.current)
      mcpWatchTimer.current = null
    }
    mcpRefreshLive()
    const pending = new Set(names.filter(name => name !== ''))
    if (pending.size === 0) { setMcpWaitingTools([]); return }
    setMcpWaitingTools([...pending])
    const startedAt = Date.now()
    mcpWatchTimer.current = window.setInterval(() => {
      const snapshot = mcpLiveRef.current
      if (snapshot.state === 'ready') {
        for (const name of [...pending]) {
          if (mcpRegisteredToolCountOf(snapshot.data, name) > 0) pending.delete(name)
        }
        setMcpWaitingTools([...pending])
      }
      if (pending.size === 0 || Date.now() - startedAt > MCP_TOOL_WATCH_TIMEOUT_MS) stopMcpWatch()
      else mcpRefreshLive()
    }, MCP_TOOL_WATCH_INTERVAL_MS)
  }

  const refresh = (): void => {
    setReload((value) => value + 1)
  }

  /** 静默同步：不置 loading，直接替换数据（自动同步机制用）。 */
  const silentSync = (): void => {
    void skillApi.list().then((snapshot) => {
      setState((current) => current.status === 'error'
        ? current
        : { status: 'ready', snapshot })
    }, () => { /* 保持当前显示 */ })
    void skillApi.presetStatus().then(
      (status) => {
        setToggles({ skills: status.skills, bundles: status.bundles })
        setOverrides(status.overrides)
        setPresets(status.presets)
      },
      () => {
        void skillApi.toggleStatus().then((status) => { setToggles(status) }, () => { /* 保持当前显示 */ })
      },
    )
    void skillApi.health().then(
      (report) => { setHealth(report.ok ? { state: 'ok', report } : { state: 'issue', report }) },
      () => { /* 保持当前显示 */ },
    )
  }

  /** 自动同步机制：面板打开期间 30s 轮询 + 页面重新可见/聚焦立即刷新（不闪烁）。 */
  useEffect(() => {
    const timer = window.setInterval(silentSync, 30_000)
    const onVis = (): void => { if (document.visibilityState === 'visible') silentSync() }
    const onFocus = (): void => { silentSync() }
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('focus', onFocus)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('focus', onFocus)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** 开关切换后静默同步:只重拉开关状态,不重载整个面板(避免闪烁)。 */
  const refreshTogglesOnly = (): void => {
    void skillApi.presetStatus().then(
      (status) => {
        setToggles({ skills: status.skills, bundles: status.bundles })
        setOverrides(status.overrides)
        setPresets(status.presets)
      },
      () => {
        // 预设接口不可用（老 host）时退回只读全局层状态。
        void skillApi.toggleStatus().then((status) => { setToggles(status) }, () => { /* 保持当前显示 */ })
      },
    )
  }

  const t = skillT

  useEffect(() => {
    let current = true
    setState({ status: 'loading' })
    void skillApi.list().then(
      (snapshot) => {
        if (current) setState({ status: 'ready', snapshot })
      },
      () => {
        if (current) setState({ status: 'error' })
      },
    )
    void skillApi.presetStatus().then(
      (status) => {
        if (!current) return
        setToggles({ skills: status.skills, bundles: status.bundles })
        setOverrides(status.overrides)
        setPresets(status.presets)
      },
      () => {
        // 预设接口不可用时退化为「只有全局层」：圆球条只剩「全部 Agent」。
        void skillApi.toggleStatus().then(
          (status) => { if (current) setToggles(status) },
          () => { /* 开关接口也不可用时保持空状态（开关仍可操作,失败会提示）。 */ },
        )
      },
    )
    // 同步状态：只读健康扫描（目录完整性 + 账本悬挂引用）。
    setHealth({ state: 'loading' })
    void skillApi.health().then(
      (report) => { if (current) setHealth(report.ok ? { state: 'ok', report } : { state: 'issue', report }) },
      () => { if (current) setHealth({ state: 'unavailable' }) },
    )
    return () => { current = false }
    // reload 拆分为变化键；open 恒 true（本组件在打开时才渲染）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload])

  // 卸载时清掉改名高亮与提示条定时器，避免卸载后 setState。
  useEffect(() => () => {
    if (renamedTimer.current !== null) window.clearTimeout(renamedTimer.current)
    if (mcpWatchTimer.current !== null) window.clearInterval(mcpWatchTimer.current)
    for (const timer of toastTimers.current) window.clearTimeout(timer)
  }, [])

  /** 快速上手指南浮层的位置：贴着面板卡片右缘内侧（面板铺满主区，外侧已无空间）。 */
  const [guidePos, setGuidePos] = useState<{ left: number; top: number; height: number } | null>(null)
  useEffect(() => {
    if (!guideOpen) return
    const marker = document.querySelector('[data-skm-panel-marker]')
    const card = marker?.closest('.psh-card')
    if (!(card instanceof HTMLElement)) return
    const rect = card.getBoundingClientRect()
    const vh = window.innerHeight
    const top = Math.max(8, rect.top)
    const overlayW = 300
    setGuidePos({
      left: Math.max(rect.left + 12, rect.right - overlayW - 12),
      top,
      height: Math.min(rect.height, vh - top - 12),
    })
  }, [guideOpen])

  const runToggle = async (key: string, action: () => Promise<unknown>): Promise<void> => {
    if (toggling.has(key)) return
    setToggling((current) => new Set(current).add(key))
    setInstallError(null)
    try {
      await action()
      // 开关只改 frontmatter,技能列表结构不变:静默同步即可,不重载面板。
      refreshTogglesOnly()
    } catch (error) {
      pushToast('err', skillT('toggleFailed', { message: error instanceof Error ? error.message : String(error) }))
    } finally {
      setToggling((current) => {
        const next = new Set(current)
        next.delete(key)
        return next
      })
    }
  }

  const toggleSkill = (skill: SkillInfo, enabled: boolean): void => {
    if (activePreset === ALL_PRESETS) {
      void runToggle(`skill:${skill.name}`, () => skillApi.setSkillEnabled(skill.name, enabled))
      return
    }
    void runToggle(
      `skill:${skill.name}`,
      () => skillApi.setPresetSkillEnabled(activePreset, skill.name, enabled),
    )
  }

  const toggleBundle = (bundle: BundleInfo, enabled: boolean): void => {
    if (activePreset === ALL_PRESETS) {
      void runToggle(`bundle:${bundle.id}`, () => skillApi.setBundleEnabled(bundle.id, enabled))
      return
    }
    void runToggle(
      `bundle:${bundle.id}`,
      () => skillApi.setPresetBundleEnabled(activePreset, bundle.id, enabled),
    )
  }

  /** 该预设下被单独关掉的技能（'*' 视图下为空表）。 */
  const presetOverride = activePreset === ALL_PRESETS ? {} : (overrides[activePreset] ?? {})

  /**
   * 任一预设下技能的开关值（与 skillEnabledIn 同规则，供左栏分类计数）。
   *  - 「全部 Agent」：直接读全局层（SKILL.md frontmatter）；
   *  - 某个预设：全局层关掉的仍显示为关（预设层无法打开全局关掉的技能），
   *    否则看该预设是否有 false 覆盖。
   */
  const skillEnabledAt = (presetId: string, name: string): boolean => {
    if (toggles.skills[name] === false) return false
    if (presetId === ALL_PRESETS) return true
    return (overrides[presetId] ?? {})[name] !== false
  }

  /** 某预设下已启用的技能数（左栏「Agent 预设分类」计数）。 */
  const enabledCountFor = (presetId: string): number => {
    let n = 0
    for (const bundle of bundles) for (const skill of bundle.skills) if (skillEnabledAt(presetId, skill.name)) n += 1
    for (const skill of loose) if (skillEnabledAt(presetId, skill.name)) n += 1
    return n
  }

  /**
   * 当前视图里一个技能的开关值。
   *  - 「全部 Agent」：直接读全局层（SKILL.md frontmatter）；
   *  - 某个预设：全局层关掉的仍显示为关（预设层无法打开全局关掉的技能），
   *    否则看该预设是否有 false 覆盖。
   */
  const skillEnabledIn = (name: string): boolean => skillEnabledAt(activePreset, name)

  /** 技能包在当前视图下的开关值：内部技能全开才算开。 */
  const bundleEnabledIn = (bundle: BundleInfo): boolean => {
    if (activePreset === ALL_PRESETS) return toggles.bundles[bundle.id] !== false
    return bundle.skills.every((skill) => skillEnabledIn(skill.name))
  }

  /** 预设视图下，被全局层禁用的技能行锁住开关（预设层只能收窄，无法打开）。 */
  const skillLockedReason = (name: string): string | undefined =>
    activePreset !== ALL_PRESETS && toggles.skills[name] === false ? t('presetLockedByGlobal') : undefined

  /** 清空当前预设的全部单独设置。 */
  const resetActivePreset = (): void => {
    if (activePreset === ALL_PRESETS) return
    void runToggle(`reset:${activePreset}`, () => skillApi.resetPreset(activePreset))
  }

  const toggleExpanded = (bundleId: string): void => {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(bundleId)) next.delete(bundleId)
      else next.add(bundleId)
      return next
    })
  }

  // Skills Hub 默认全展开（参考图整页可见）；用户手动收起后保持各自状态。

  const loadViewerContent = async (skillName: string, filePath: string): Promise<void> => {
    try {
      const res = await fetch(`/api/skill-manager/skills/${encodeURIComponent(skillName)}/files/${encodeURIComponent(filePath)}`)
      const body = await res.json() as { error?: unknown; content?: unknown }
      if (body.error !== undefined) throw new Error(String(body.error))
      setViewer((v) => v === null ? v : { ...v, loading: false, content: (body.content ?? '') as string })
    } catch (error) {
      setViewer((v) => v === null ? v : { ...v, loading: false, error: error instanceof Error ? error.message : String(error) })
    }
  }

  const openViewer = (skill: SkillInfo): void => {
    setViewer({ skill, file: 'SKILL.md', loading: true })
    void loadViewerContent(skill.name, 'SKILL.md')
  }

  /** 切字号档位（夹到合法区间）。 */
  const setViewerFontLevel = (level: number): void => {
    setViewerFont(Math.min(Math.max(level, 0), VIEWER_FONT_SIZES.length - 1))
  }

  /** 全屏 / 还原：弹窗宽高走 CSS 过渡，不重挂内容，滚动位置保持。 */
  const toggleViewerFull = (): void => {
    setViewerFull((current) => !current)
  }

  // 偏好统一在这里落盘：连点两个控件时，事件回调读到的是同一帧的旧闭包值，
  // 分开写会把其中一项存成旧值。
  useEffect(() => { writeViewerPrefs({ font: viewerFont, full: viewerFull }) }, [viewerFont, viewerFull])

  const selectViewerFile = (filePath: string): void => {
    if (viewer === null) return
    setViewer({ ...viewer, file: filePath, loading: true, error: undefined })
    void loadViewerContent(viewer.skill.name, filePath)
  }

  const doAssign = async (skill: SkillInfo, bundleId: string): Promise<void> => {
    try {
      if (state.status !== 'ready') return
      const bundle = state.snapshot.bundles.find((candidate) => candidate.id === bundleId)
      if (bundle === undefined) throw new Error('bundle not found')
      await skillApi.setBundleSkills(bundleId, [...bundle.skills.map((s) => s.name), skill.name])
      setAssignTarget(null)
      pushToast('ok', skillT('assignOk', { name: skill.name }))
      refresh()
    } catch (error) {
      failToast('归入技能包', error)
    }
  }

  const acceptFiles = (files: File[] | null): void => {
    if (files === null || files.length === 0) return
    const collected: CollectedFile[] = []
    for (const file of files) {
      const relative = file.webkitRelativePath
      if (relative === '') continue
      const parts = relative.split('/')
      if (parts.length < 2) continue
      collected.push({ path: parts.slice(1).join('/'), file })
    }
    if (collected.length === 0) return
    const zipCandidate = collected.length === 1 && collected[0].path.toLowerCase().endsWith('.zip') ? collected[0] : undefined
    if (zipCandidate !== undefined) {
      const reader = new FileReader()
      reader.onload = () => {
        const data = String(reader.result ?? '').split(',')[1] ?? ''
        setInstall({ archive: true, name: zipCandidate.path, data, folderName: zipCandidate.path })
        setInstallError(null)
        setAddOpen(true)
      }
      reader.readAsDataURL(zipCandidate.file)
      return
    }
    const rootName = collected[0]?.path.split('/')[0] ?? ''
    setInstallName(rootName)
    setInstallError(null)
    setInstall({ files: collected, folderName: rootName })
    setAddOpen(true)
  }

  const onDrop = async (event: DragEvent<HTMLDivElement>): Promise<void> => {
    event.preventDefault()
    setDropActive(false)
    const collected: CollectedFile[] = []
    const items = event.dataTransfer.items
    if (items === undefined) return
    const pending: Array<Promise<void>> = []
    for (const item of Array.from(items)) {
      const entry = item.webkitGetAsEntry?.()
      if (entry !== undefined && entry !== null) pending.push(collectEntry(entry, '', collected))
    }
    await Promise.all(pending)
    if (collected.length === 0) return
    const zipCandidate = collected.length === 1 && collected[0].path.toLowerCase().endsWith('.zip') ? collected[0] : undefined
    if (zipCandidate !== undefined) {
      setInstall({ archive: true, name: zipCandidate.path, data: await fileToBase64(zipCandidate.file), folderName: zipCandidate.path })
      setInstallError(null)
      setAddOpen(true)
      return
    }
    const rootName = collected[0]?.path.split('/')[0] ?? ''
    setInstallName(rootName)
    setInstallError(null)
    setInstall({ files: collected, folderName: rootName })
    setAddOpen(true)
  }

  const confirmInstall = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    if (install === null || installing) return
    if (install.archive !== true && installName.trim() === '') return
    setInstalling(true)
    setInstallError(null)
    try {
      let installed: { name?: string } = {}
      if (install.archive === true) {
        installed = await skillApi.installSkill({
          archive: install.data,
          description: installDescription.trim(),
          ...installBundleId === undefined ? {} : { bundleId: installBundleId },
        })
      } else {
        const files = await Promise.all(install.files.map(async ({ path, file }) => ({
          path,
          data: await fileToBase64(file),
        })))
        installed = await skillApi.installSkill({
          skillName: installName.trim(),
          description: installDescription.trim(),
          ...installBundleId === undefined ? {} : { bundleId: installBundleId },
          files,
        })
      }
      // 名字以 host 落地的规范名为准：目录名与技能名不一致时，用户看得到装成了什么。
      pushToast('ok', skillT('installedOk', { name: installed.name ?? installName.trim() }))
      setInstall(null)
      setInstallName('')
      setInstallDescription('')
      setInstallBundleId(undefined)
      setAddOpen(false)
      refresh()
    } catch (error) {
      setInstallError(error instanceof Error ? error.message : String(error))
    } finally {
      setInstalling(false)
    }
  }

  const submitNewBundle = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    if (creatingBundle || newBundleName.trim() === '') return
    setCreatingBundle(true)
    try {
      const created = newBundleName.trim()
      await skillApi.createBundle(created, newBundleCats)
      setNewBundleName('')
      setNewBundleCats([])
      setNewBundleOpen(false)
      pushToast('ok', skillT('bundleCreated', { name: created }))
      refresh()
    } catch (error) {
      failToast('新建技能包', error)
    } finally {
      setCreatingBundle(false)
    }
  }

  /** 打开「设置分类」弹窗：草稿从快照里的当前值起步。 */
  const openCatEditor = (bundle: BundleInfo): void => {
    setCatTarget({ bundleId: bundle.id, name: bundle.name })
    setCatDraft([...(bundle.categories ?? [])])
  }

  /** 保存分类：PATCH 只带 categories；顺手把筛选跟到新值，避免改完包「消失」。 */
  const submitCategories = async (): Promise<void> => {
    if (catTarget === null || savingCats) return
    setSavingCats(true)
    try {
      await skillApi.setBundleCategories(catTarget.bundleId, catDraft)
      if (activeCat !== null && !catDraft.includes(activeCat) && activeCat !== UNCATEGORIZED) setCatFilter(null)
      pushToast('ok', skillT('bundleCatSaved', { name: catTarget.name }))
      setCatTarget(null)
      refresh()
    } catch (error) {
      failToast('设置分类', error)
    } finally {
      setSavingCats(false)
    }
  }

  const submitRename = async (event: FormEvent<HTMLFormElement>): Promise<void> => {

    event.preventDefault()
    if (renaming || renameTarget === null || renameTarget.name.trim() === '') return
    setRenaming(true)
    try {
      await skillApi.renameBundle(renameTarget.bundleId, renameTarget.name.trim())
      // 改名成功后让卡片闪一下高亮（1600ms 后自动清除）。
      const renamedId = renameTarget.bundleId
      if (renamedTimer.current !== null) window.clearTimeout(renamedTimer.current)
      setRenamedFlash(renamedId)
      renamedTimer.current = window.setTimeout(() => { setRenamedFlash(null) }, 1600)
      setRenameTarget(null)
      refresh()
    } catch (error) {
      failToast('重命名技能包', error)
    } finally {
      setRenaming(false)
    }
  }

  const confirmDelete = async (): Promise<void> => {
    if (confirm === null || confirming) return
    setConfirming(true)
    const label = confirm.kind === 'bundle' ? confirm.bundle.name : confirm.name
    try {
      if (confirm.kind === 'bundle') await skillApi.deleteBundle(confirm.bundle.id)
      else await skillApi.deleteSkill(confirm.name)
      setConfirm(null)
      pushToast('ok', confirm.kind === 'bundle'
        ? skillT('bundleDeleted', { name: label })
        : skillT('deletedOk', { name: label }))
      refresh()
    } catch (error) {
      // 旧实现把失败写进只在安装弹窗里渲染的 installError：删除失败时面板上毫无反应。
      failToast(confirm.kind === 'bundle' ? '删除技能包' : '删除技能', error)
    } finally {
      setConfirming(false)
    }
  }

  const removeFromBundle = async (bundleId: string, name: string): Promise<void> => {
    try {
      if (state.status !== 'ready') return
      const bundle = state.snapshot.bundles.find((candidate) => candidate.id === bundleId)
      if (bundle === undefined) return
      await skillApi.setBundleSkills(bundleId, bundle.skills.map((skill) => skill.name).filter((skillName) => skillName !== name))
      pushToast('ok', skillT('removedOk', { name }))
      refresh()
    } catch (error) {
      failToast('移出技能包', error)
    }
  }

  /** 清理账本里指向已删除技能的条目（技能包显示「N 个失效引用」时用）。 */
  const pruneBundle = async (bundle: BundleInfo): Promise<void> => {
    try {
      // 必须回到未过滤的快照取成员：视图里的 bundle 可能已被搜索/状态筛选裁掉过。
      const full = state.status === 'ready'
        ? (state.snapshot.bundles.find((candidate) => candidate.id === bundle.id) ?? bundle)
        : bundle
      await skillApi.setBundleSkills(bundle.id, full.skills.map((skill) => skill.name))
      pushToast('ok', skillT('pruned'))
      refresh()
    } catch (error) {
      failToast('清理失效引用', error)
    }
  }

  /** 从空技能包的引导按钮直接进入「添加技能」，并把归组预选成它。 */
  const openInstallFor = (bundleId: string): void => {
    setInstall(null)
    setInstallError(null)
    setInstallBundleId(bundleId)
    setAddOpen(true)
  }

  const bundles = state.status === 'ready' ? state.snapshot.bundles : []
  const loose = state.status === 'ready' ? state.snapshot.loose : []
  /** 当前作用域 pill 文案：「全部 Agent」视图 = 全局（Global），预设视图 = 预设名。 */
  const scopeLabel = activePreset === ALL_PRESETS
    ? t('scopeAll')
    : (presets.find((preset) => preset.id === activePreset)?.name ?? activePreset)

  /* ── Skills Hub 派生数据：搜索 / Agent 预设 / 状态 / 排序 ── */
  const q = query.trim().toLowerCase()
  const qMatch = (skill: SkillInfo): boolean => {
    if (q === '') return true
    if (skill.name.toLowerCase().includes(q)) return true
    return (skill.description ?? '').toLowerCase().includes(q)
  }
  const statusMatch = (skill: SkillInfo): boolean => {
    // 「全部」= 不分启用状态一律显示。旧实现在这里也 return on，于是技能一关卡片就
    // 当场从列表里消失，想再打开只能切到「已停用」档去捞 —— 关掉即隐身。
    if (statusFilter === 'all') return true
    // 启用态按当前视图计算：全部 Agent = 全局层，预设视图 = 预设层（含全局锁定）。
    const on = activePreset === ALL_PRESETS
      ? toggles.skills[skill.name] !== false
      : skillEnabledAt(activePreset, skill.name)
    return statusFilter === 'on' ? on : !on
  }
  const sortedSkills = (list: SkillInfo[]): SkillInfo[] => [...list].sort((a, b) => {
    const order = a.name.localeCompare(b.name)
    return sortAsc ? order : -order
  })
  const filteredSkills = (list: SkillInfo[]): SkillInfo[] =>
    sortedSkills(list.filter((skill) =>
      qMatch(skill)
      && statusMatch(skill)))
  /**
   * 全量筛选结果（批量操作作用于全部）。
   * 空技能包必须留在列表里：旧实现一律 filter(skills.length > 0)，于是新建的包、
   * 以及账本按目录名记账导致成员解析不到的包，都会从面板上凭空消失 —— 既看不到
   * 也点不到，没法再往里归技能。只有真正带筛选条件时才按命中情况隐藏。
   */
  const filtering = q !== '' || statusFilter !== 'all'
  /**
   * 分类索引：分类名 → 挂了它的技能包数；没挂任何分类的包归到 UNCATEGORIZED 桶。
   * 顶栏胶囊与包名旁的标签都从这里取数，所以两边口径天然一致。
   */
  const categoryCounts = (() => {
    const counts = new Map<string, number>()
    for (const bundle of bundles) {
      const cats = bundle.categories ?? []
      if (cats.length === 0) {
        counts.set(UNCATEGORIZED, (counts.get(UNCATEGORIZED) ?? 0) + 1)
        continue
      }
      for (const cat of cats) counts.set(cat, (counts.get(cat) ?? 0) + 1)
    }
    return counts
  })()
  const categoryList = sortCategories(categoryCounts)
  /** 至少要有一个真分类（未分类桶不算）才值得占一行顶栏空间。 */
  const hasCategories = categoryList.some((cat) => cat !== UNCATEGORIZED)
  /** 选中的分类被最后一个包摘掉时自动回落「全部」，不留一个筛不出东西的死状态。 */
  const activeCat = catFilter !== null && categoryCounts.has(catFilter) ? catFilter : null
  const catMatch = (bundle: BundleInfo): boolean => {
    if (activeCat === null) return true
    const cats = bundle.categories ?? []
    return activeCat === UNCATEGORIZED ? cats.length === 0 : cats.includes(activeCat)
  }
  const visibleBundleAll = (sourceFilter === 'loose' ? [] : bundles)
    .filter((bundle) => catMatch(bundle))
    .map((bundle) => ({ ...bundle, skills: filteredSkills(bundle.skills) }))
    .filter((bundle) => bundle.skills.length > 0 || (bundle.skillCount === 0 && !filtering))
  const visibleLooseAll = sourceFilter === 'bundles' || activeCat !== null ? [] : filteredSkills(loose)
  const totalSkills = bundles.reduce((n, bundle) => n + bundle.skillCount, 0) + loose.length
  const bundleCount = bundles.length
  /** 同步状态卡展示模型：ok=绿点全健康；issue=橙点带数量；unavailable=灰点待检测（旧 host 未加载新路由）；loading=检测中。 */
  const healthView = health.state === 'ok'
    ? { tone: 'ok', label: t('statHealthy'), title: t('statHealthy') }
    : health.state === 'issue'
      ? { tone: 'warn', label: t('statIssues', { n: health.report.issues.length }), title: health.report.issues.map((issue) => issue.message).join('\n') }
      : health.state === 'unavailable'
        ? { tone: 'pending', label: t('statPending'), title: t('statPending') }
        : { tone: 'idle', label: t('statChecking'), title: '' }
  const enabledCount = (() => {
    let n = 0
    for (const bundle of bundles) for (const skill of bundle.skills) if (toggles.skills[skill.name] !== false) n += 1
    for (const skill of loose) if (toggles.skills[skill.name] !== false) n += 1
    return n
  })()
  /** 当前被全局层关掉的技能数（顶栏「已停用」计数；与「已启用」同一口径）。 */
  const disabledCount = (() => {
    let n = 0
    for (const bundle of bundles) for (const skill of bundle.skills) if (toggles.skills[skill.name] === false) n += 1
    for (const skill of loose) if (toggles.skills[skill.name] === false) n += 1
    return n
  })()
  const noResults = visibleBundleAll.length === 0 && visibleLooseAll.length === 0

  const trimmedName = installName.trim()
  const nameInvalid = trimmedName !== '' && !SKILL_NAME_PATTERN.test(trimmedName)

  const confirmTitle = confirm === null
    ? t('deleteSkillConfirm', { name: '' })
    : confirm.kind === 'bundle'
      ? t('deleteBundleConfirm', { name: confirm.bundle.name })
      : t('deleteSkillConfirm', { name: confirm.name })
        // 目录名与技能名不一致时说明白：删的是那个目录，避免用户以为删错东西。
          + (confirm.kind === 'skill' && confirm.dir !== undefined && confirm.dir !== confirm.name
            ? t('deleteSkillDirNote', { dir: confirm.dir }) : '')

  return (
    <PopoverShell
      solid
      closing={closing}
      onClose={() => {
        // 安装/确认进行中禁止关闭；二级弹窗（新建/添加/确认/查看器/归组）打开时 Esc 归二级弹窗。
        if (installing || confirming) return
        if (newBundleOpen || addOpen || confirm !== null || viewer !== null || assignTarget !== null || catTarget !== null) return
        onClose()
      }}
      anchor={anchor}
      onCardMouseEnter={onCardMouseEnter}
      onCardMouseLeave={onCardMouseLeave}
      size={{ width: 1150, height: 860 }}
      ariaLabel={t('panelTitle')}
    >
      {/* 头部：标题（能力管理）+ 紧贴文字右侧的 SKILL/MCP 顶层 tab + 关闭 */}
      <PanelHead t={t} kind={kind} onKind={setKind} />
      <PshBody className={css.modalBody}>
      <span data-skm-panel-marker aria-hidden="true" style={{ display: 'none' }} />
      <div className={css.hub} aria-busy={state.status === 'loading'}>
        {/* ── 顶栏（仅 SKILL 视图）：预设 chips + 快捷筛选 + 新建/添加/指南 ── */}
        {kind === 'skill' && (
          <SkillTopBar
            t={t}
            dropActive={dropActive}
            setDropActive={setDropActive}
            onDrop={onDrop}
            activePreset={activePreset}
            setActivePreset={setActivePreset}
            presets={presets}
            overrides={overrides}
            enabledCountFor={enabledCountFor}
            totalSkills={totalSkills}
            enabledCount={enabledCount}
            disabledCount={disabledCount}
            healthView={healthView}
            hasCategories={hasCategories}
            activeCat={activeCat}
            setCatFilter={setCatFilter}
            categoryList={categoryList}
            categoryCounts={categoryCounts}
            bundleCount={bundleCount}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            query={query}
            setQuery={setQuery}
            openMenu={openMenu}
            setOpenMenu={setOpenMenu}
            sortAsc={sortAsc}
            setSortAsc={setSortAsc}
            newBundleOpen={newBundleOpen}
            onNewBundle={() => { setNewBundleOpen(true) }}
            onAdd={() => { setInstall(null); setInstallError(null); setAddOpen(true) }}
            onRefresh={refresh}
            fileInput={fileInput}
            acceptFiles={acceptFiles}
          />
        )}
        {/* ── 顶栏（MCP 视图）：与技能页同构的预设 chips + 状态分段 ── */}
        {kind === 'mcp' && (
          <McpTopBar
            t={t}
            live={mcpLive}
            scope={mcpScope}
            onScope={setMcpScope}
            status={mcpStatusFilter}
            onStatus={setMcpStatusFilter}
            query={mcpQuery}
            onQuery={setMcpQuery}
            onRefresh={() => { mcpRefreshLive() }}
            onAddOwn={() => { setMcpAddOwnOpen(true) }}
            onAddCustom={() => { setMcpAddOpen(true) }}
          />
        )}

        {/* ── 主区 ── */}
        <div className={css.hubMain}>
        {kind === 'prompt' ? (
          <PromptView />
        ) : kind === 'mcp' ? (
          <McpView
            t={t}
            live={mcpLive}
            scope={mcpScope}
            query={mcpQuery}
            status={mcpStatusFilter}
            onRefresh={() => { mcpRefreshLive() }}
            waitingTools={mcpWaitingTools}
            onWatchTools={(names) => { watchMcpTools(names) }}
            addOwnOpen={mcpAddOwnOpen}
            onCloseAddOwn={() => { setMcpAddOwnOpen(false) }}
          />
        ) : (
          <SkillsView
            t={t}
            state={state}
            health={health}
            activePreset={activePreset}
            presets={presets}
            presetOverride={presetOverride}
            resetActivePreset={resetActivePreset}
            openMenu={openMenu}
            setOpenMenu={setOpenMenu}
            refresh={refresh}
            noResults={noResults}
            visibleBundleAll={visibleBundleAll}
            expanded={expanded}
            renameTarget={renameTarget}
            setRenameTarget={setRenameTarget}
            renaming={renaming}
            submitRename={submitRename}
            bundleEnabledIn={bundleEnabledIn}
            toggling={toggling}
            viewMode={viewMode}
            setCatFilter={setCatFilter}
            activeCat={activeCat}
            toggleExpanded={toggleExpanded}
            renamedFlash={renamedFlash}
            openInstallFor={openInstallFor}
            skillEnabledIn={skillEnabledIn}
            skillLockedReason={skillLockedReason}
            scopeLabel={scopeLabel}
            toggleSkill={toggleSkill}
            toggleBundle={toggleBundle}
            openViewer={openViewer}
            removeFromBundle={removeFromBundle}
            pruneBundle={pruneBundle}
            openCatEditor={openCatEditor}
            setConfirm={setConfirm}
            setAssignTarget={setAssignTarget}
            looseOpen={looseOpen}
            setLooseExpanded={setLooseExpanded}
            visibleLooseAll={visibleLooseAll}
          />
        )}
        </div>
      </div>
      </PshBody>
      {/* 操作回执：安装/删除/归组/开关的成败都从这里冒出来（面板右下角，自动收起） */}
      {toasts.length > 0 && (
        <div className={css.toastStack} role="status" aria-live="polite">
          {toasts.map((item) => (
            <span key={item.id} className={`${css.toast} ${item.tone === 'err' ? css.toastErr : css.toastOk}`} data-tone={item.tone}>
              <i className={css.toastDot} aria-hidden="true" />
              {item.text}
            </span>
          ))}
        </div>
      )}
      {/* 快速上手指南 / MCP 解释：面板右侧悬浮卡（portal 到 body，不压缩面板） */}
      {guideOpen && guidePos !== null && (
        <GuidePanel t={t} onClose={() => { setGuideOpen(false) }} left={guidePos.left} top={guidePos.top} height={guidePos.height} />
      )}

      <McpAddModal
        t={t}
        open={mcpAddOpen}
        onClose={() => { setMcpAddOpen(false) }}
        onAdded={(added) => { watchMcpTools(added) }}
      />

      {/* 新建技能包弹窗：名字与分类一起给，省得建完再进去设置一次。 */}
      <Modal
        open={newBundleOpen}
        onClose={() => { if (!creatingBundle) { setNewBundleOpen(false); setNewBundleCats([]) } }}
        closeLabel={t('close')}
        title={t('newBundle')}
      >
        <form className={css.stackForm} onSubmit={(event) => { void submitNewBundle(event) }}>
          <input className={css.inlineInput} value={newBundleName} placeholder={t('newBundlePlaceholder')}
            aria-label={t('newBundlePlaceholder')} autoFocus disabled={creatingBundle}
            onChange={(event) => { setNewBundleName(event.currentTarget.value) }} />
          <CategoryEditor value={newBundleCats} onChange={setNewBundleCats} label={t('newBundle')} />
          <div className={css.inlineForm}>
            <Button variant="primary" type="submit" disabled={creatingBundle || newBundleName.trim() === ''}>{t('create')}</Button>
            <Button variant="outline" type="button" disabled={creatingBundle} onClick={() => { setNewBundleOpen(false); setNewBundleCats([]) }}>{t('cancel')}</Button>
          </div>
        </form>
      </Modal>

      {/* 设置分类弹窗：与新建包共用同一个 CategoryEditor，值走草稿态，保存才落盘。 */}
      <Modal
        open={catTarget !== null}
        onClose={() => { if (!savingCats) setCatTarget(null) }}
        closeLabel={t('close')}
        title={t('bundleCatEditTitle', { name: catTarget?.name ?? '' })}
      >
        <div className={css.stackForm}>
          <CategoryEditor value={catDraft} onChange={setCatDraft} label={t('bundleCatEdit')} />
          <div className={css.inlineForm}>
            <Button variant="primary" type="button" disabled={savingCats} onClick={() => { void submitCategories() }}>{t('bundleCatDone')}</Button>
            <Button variant="outline" type="button" disabled={savingCats} onClick={() => { setCatTarget(null) }}>{t('cancel')}</Button>
          </div>
        </div>
      </Modal>

      {/* 添加技能弹窗：先拖放/浏览选文件，再填表单安装 */}
      <Modal
        open={addOpen}
        onClose={() => {
          if (installing) return
          setAddOpen(false)
          setInstall(null)
          setDropActive(false)
        }}
        closeLabel={t('close')}
        title={t('addSkillsTitle')}
      >
        {install === null ? (
          <div
            className={`${css.addCard} ${dropActive ? css.addCardActive : ''}`}
            role="button"
            tabIndex={0}
            aria-label={t('addSkillsTitle')}
            onClick={() => { fileInput.current?.click() }}
            onDragOver={(event) => { event.preventDefault(); setDropActive(true) }}
            onDragLeave={() => { setDropActive(false) }}
            onDrop={(event) => { void onDrop(event) }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                fileInput.current?.click()
              }
            }}
          >
            <span className={css.addCardHead}>
              <span className={css.addCardIcon}><CloudUpIcon size={22} /></span>
              <span className={css.addCardTitle}>{t('bannerTitle')}</span>
            </span>
            <span className={css.addCardSub}>{t('bannerSub')}</span>
            <span className={css.addDrop}>
              <CloudUpIcon size={18} />
              <span className={css.addDropText}>{t('dropHere')}</span>
              <span className={css.addDropHint}>{t('dropFormat')}</span>
            </span>
            <button type="button" className={css.addBtn} onClick={(event) => { event.stopPropagation(); fileInput.current?.click() }}>
              {t('browseImport')}
            </button>
            <input
              ref={fileInput}
              type="file"
              className={css.hiddenInput}
              multiple
              {...{ webkitdirectory: '' }}
              onChange={(event) => {
                acceptFiles(event.currentTarget.files === null ? null : Array.from(event.currentTarget.files))
              }}
            />
          </div>
        ) : (
          <form className={css.installForm} onSubmit={(event) => { void confirmInstall(event) }}>
            <div className={css.installRow}>
              <input className={css.inlineInput} value={installName}
                placeholder={install.archive === true ? t('installNameFromArchive') : t('installNamePlaceholder')}
                aria-label={t('installName')}
                disabled={installing || install.archive === true}
                onChange={(event) => { setInstallName(event.currentTarget.value) }} />
              <input className={css.inlineInput} value={installDescription} placeholder={t('installDescription')}
                aria-label={t('installDescription')} disabled={installing}
                onChange={(event) => { setInstallDescription(event.currentTarget.value) }} />
              <label className={css.bundleSelect}>
                <span className={css.visuallyHidden}>{t('installBundle')}</span>
                <select value={installBundleId ?? ''} disabled={installing}
                  onChange={(event) => { setInstallBundleId(event.currentTarget.value === '' ? undefined : event.currentTarget.value) }}>
                  <option value="">{t('installLoose')}</option>
                  {bundles.map((bundle) => <option key={bundle.id} value={bundle.id}>{bundle.name}</option>)}
                </select>
              </label>
              <span className={css.installMeta}>
                {install.archive === true
                  ? t('uploadMeta', { n: 1, folder: install.folderName })
                  : t('uploadMeta', { n: install.files.length, folder: install.folderName })}
              </span>
            </div>
            {install.archive !== true && nameInvalid && <p className={css.error} role="alert">{t('installNameInvalid')}</p>}
            {install.archive !== true && !nameInvalid && trimmedName !== '' && installMetaName !== null && installMetaName !== trimmedName && (
              <p className={css.installHint}>{t('installNameRewrite', { meta: installMetaName, name: trimmedName })}</p>
            )}
            <div className={css.installActions}>
              <Button variant="primary" type="submit" disabled={installing || (install.archive !== true && (trimmedName === '' || nameInvalid))}>{t('installConfirm')}</Button>
              <Button variant="outline" type="button" disabled={installing} onClick={() => { setInstall(null); setAddOpen(false) }}>{t('installCancel')}</Button>
            </div>
            {installError !== null && <p className={css.error} role="alert">{installError}</p>}
          </form>
        )}
      </Modal>

      <Modal
        open={confirm !== null}
        onClose={() => {
          if (!confirming) setConfirm(null)
        }}
        closeLabel={t('close')}
        title={confirmTitle}
        footer={
          <>
            <Button variant="outline" disabled={confirming} onClick={() => { setConfirm(null) }}>{t('cancel')}</Button>
            <Button variant="primary" disabled={confirming} onClick={() => { void confirmDelete() }}>{t('delete')}</Button>
          </>
        }
      />

      <SkillViewer
        t={t}
        viewer={viewer}
        viewerFont={viewerFont}
        viewerFull={viewerFull}
        onFontLevel={setViewerFontLevel}
        onToggleFull={toggleViewerFull}
        onSelectFile={selectViewerFile}
        onClose={() => { setViewer(null) }}
      />
      {assignTarget !== null && (
        <Modal
          open
          onClose={() => { setAssignTarget(null) }}
          closeLabel={t('close')}
          title={t('assignTitle', { name: assignTarget.name })}
          className={css.assignModal}
          contentClassName={css.assignModalBody}
        >
          {bundles.length === 0 ? (
            <p className={css.looseEmpty}>{t('assignEmpty')}</p>
          ) : (
            <ul className={css.assignList}>
              {bundles.map((bundle, index) => (
                <li key={bundle.id} style={{ listStyle: 'none' }}>
                  <button
                    type="button"
                    className={css.assignCard}
                    style={{ '--skm-i': index } as CSSProperties}
                    onClick={() => { void doAssign(assignTarget, bundle.id) }}
                  >
                    <span className={css.assignCardIcon} aria-hidden="true"><IconFolderOpenOutline16 size={16} /></span>
                    <span className={css.assignCardBody}>
                      <span className={css.assignCardName}>{bundle.name}</span>
                      <span className={css.assignCardDesc}>{t('skillsCount', { n: bundle.skillCount })}</span>
                    </span>
                    <span className={css.assignGo} aria-hidden="true"><IconChevronDownOutline14 size={14} /></span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}
    </PopoverShell>
  )
}

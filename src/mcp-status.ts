/**
 * mcp-status — 全局 MCP Server 状态与编辑（host 半身，0.2.2 契约）。
 *
 * 数据来源：
 *  1. **可编辑全局行**：`ctx.configEditor.entries()` 里
 *     `entry.options.name === '@deepseek-ai/dsh-mcp-client'` 的 profile 根行。
 *     禁用状态取 `entry.options.disabled`（Loader 行选项，布尔值），
 *     **不是** YAML 里出现过 `disabled:` 这一行 —— 旧版逐行扫描会把
 *     `disabled: false` 误判成禁用，也会把 config 里的同名键算进来。
 *  2. **只读行**：注册了 `mcp__*` 工具、但没有可编辑 profile 行的 server
 *     （自带行 / 手工组合 / mcp-manager 条目），标 `editable: false`。
 *  3. **预设自带行**：作用域注册，只有该预设的活动 agent 能看到；没有活动
 *     agent 时回退名单缓存。
 *  4. **mcp-manager 运行时状态**：服务存在时用 `watch()` + `mcp-manager/status`
 *     维护快照；服务缺席时返回 `manualRefreshRequired: true`，UI 提示手动刷新。
 *  5. **插件自管全局行**：由 `mcp-global-store` 存在本插件 SQLite 里，启动后
 *     通过 root Loader 的内存树挂载；不进入宿主的 `cordis.yml` / `cordis.patch.yml`。
 *
 * 明确不做：
 *  - 不逐行解析宿主 YAML（全局 MCP 走插件 SQLite + root Loader，预设走 configEditor）；
 *  - 不探活第三方 URL、不自动改写用户配置（旧 watchdog 已删除）；
 *  - profile 未知（没有 profileContext.patchPath）一律 503，不回退 `web`。
 *
 * Routes:
 *   GET  /api/triad/mcp-status
 *   POST /api/triad/mcp-config   { action?: toggle|remove|add, ... }
 *   GET/POST /api/triad/mcp-edit
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
// js-yaml 不自带类型声明（无 tsc 门禁）；与 mcp-paste 保持同一解析器。
// @ts-expect-error -- untyped dependency
import { load as loadYaml } from 'js-yaml'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import { writeJsonResponse } from './mcp-recommended.ts'
import { readMaskLedger } from './mcp-mask-ledger.ts'
import { maskInstallReport } from './mcp-preset-mask.ts'
import { collectPresetServers, presetRowOf, writePresetPlugins } from './mcp-presets.ts'
import { envTemplateOf, parseMcpPaste, pasteFieldsOf, rowsToMcpServersYaml, type McpRowConfig } from './mcp-paste.ts'
import {
  knownToolsOf,
  ledgerServerNamesOf,
  rememberKnownTools,
  rememberPresetOwnServers,
  rememberServerNames,
  serverOfToolName,
  toolDisableTables,
} from './mcp-tool-disable.ts'
import { readPresetRoster } from './skill-toggles.ts'
import {
  workspaceMcpLedger,
  workspaceMcpMountStatus,
  workspaceToolDisabledLedger,
} from './mcp-workspace-scope.ts'
import {
  findStoredGlobalMcpServer,
  hasGlobalMcpStore,
  readGlobalMcpStore,
  removeStoredGlobalMcpServer,
  replaceStoredGlobalMcpServerConfig,
  setStoredGlobalMcpServerDisabled,
  upsertStoredGlobalMcpServer,
  writeGlobalMcpStore,
  type StoredGlobalMcpServer,
} from './mcp-global-store.ts'
import { optionalService } from './context-utils.ts'
import { rejectUntrusted, requireTrustedRequest } from './trust.ts'

const STATUS_ROUTE = '/api/triad/mcp-status'
const CONFIG_ROUTE = '/api/triad/mcp-config'
const EDIT_ROUTE = '/api/triad/mcp-edit'
const MCP_CLIENT_NAME = '@deepseek-ai/dsh-mcp-client'
/** 备份文件名（固定名，覆盖式；保留最近一次切换前的版本）。 */
const BACKUP_SUFFIX = '.bak-last-toggle'

type PluginContext = any

/** profile 未知：路由层转成 503，绝不回落 `web`。 */
class ProfileUnavailableError extends Error {
  constructor() {
    super('profile-unavailable')
    this.name = 'ProfileUnavailableError'
  }
}

interface ProfileInfo {
  patchPath: string
  name?: string
  /** profile 目录（用于识别旧版 runtime 行所在的根 `cordis.yml`）。 */
  dir?: string
}

/** 当前活动 profile；没有 patchPath 即视为未知。 */
function profileInfo(ctx: PluginContext): ProfileInfo | undefined {
  const profileContext = optionalService<{ patchPath?: unknown; name?: unknown; dir?: unknown }>(ctx, 'profileContext')
  const patchPath = typeof profileContext?.patchPath === 'string' && profileContext.patchPath.trim() !== ''
    ? profileContext.patchPath
    : undefined
  if (patchPath === undefined) return undefined
  return {
    patchPath,
    ...typeof profileContext?.name === 'string' && profileContext.name !== '' ? { name: profileContext.name } : {},
    dir: typeof profileContext?.dir === 'string' && profileContext.dir.trim() !== ''
      ? profileContext.dir
      : dirname(patchPath),
  }
}

function requireProfile(ctx: PluginContext): ProfileInfo {
  const profile = profileInfo(ctx)
  if (profile === undefined) throw new ProfileUnavailableError()
  return profile
}

/** 插件账本按 profile 分键；缺名字时归入 default。 */
function profileStoreName(profile: ProfileInfo): string {
  return profile.name ?? 'default'
}

function plainObject(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

/** config-editor 读出的 `!!js` 包装 → mcp-paste 的序列化标记。 */
function fromEditorConfig(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(fromEditorConfig)
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (typeof record.__jsExpr === 'string' && Object.keys(record).length === 1) return { __js: record.__jsExpr }
    const out: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(record)) out[key] = fromEditorConfig(item)
    return out
  }
  return value
}

/** mcp-paste 的 `${VAR}` / `!!js` 标记 → config-editor 的 `__jsExpr` 包装。 */
function toEditorConfig(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(toEditorConfig)
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (typeof record.__js === 'string' && Object.keys(record).length === 1) return { __jsExpr: record.__js }
    const out: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(record)) out[key] = toEditorConfig(item)
    return out
  }
  return value
}

/** 字符串里的 `${VAR}` 占位 → `{ __js: template }`，与旧版写 patch / 预设的语义一致。 */
function withEnvTemplates(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withEnvTemplates)
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (typeof record.__js === 'string' && Object.keys(record).length === 1) return value
    const out: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(record)) out[key] = withEnvTemplates(item)
    return out
  }
  if (typeof value === 'string') return envTemplateOf(value) ?? value
  return value
}

interface ConfigEditorLike {
  entries?: () => unknown[]
  configuration?: () => Array<{ entry?: unknown; inherited?: unknown; override?: unknown }>
  edit?: (entry: unknown, change: (current: Record<string, unknown>, inherited: Record<string, unknown>) => Record<string, unknown>) => Promise<void>
}

function configEditorOf(ctx: PluginContext): ConfigEditorLike | undefined {
  return optionalService<ConfigEditorLike>(ctx, 'configEditor')
}

/** 一条可编辑的 profile 根 MCP 行。 */
export interface EditableMcpRow {
  entry: unknown
  entryId: string
  serverName: string
  config: Record<string, unknown>
  disabled: boolean
  inherited: Record<string, unknown>
  override: Record<string, unknown>
}

/**
 * 枚举所有可编辑全局 MCP 行。
 * @param ctx - 宿主上下文。
 * @returns 行快照（顺序与 profile 根 Include 一致）。
 */
export function editableMcpRows(ctx: PluginContext): EditableMcpRow[] {
  const editor = configEditorOf(ctx)
  if (typeof editor?.entries !== 'function') return []
  let entries: unknown[]
  try {
    entries = editor.entries()
  } catch {
    return []
  }
  const rows: EditableMcpRow[] = []
  for (const entry of Array.isArray(entries) ? entries : []) {
    const options = (entry as { options?: { id?: unknown; name?: unknown; config?: unknown; disabled?: unknown } } | null)?.options
    if (options?.name !== MCP_CLIENT_NAME) continue
    const entryId = typeof options.id === 'string' ? options.id : ''
    const config = plainObject(options.config)
    const serverName = typeof config.serverName === 'string' ? config.serverName : ''
    if (entryId === '' || serverName === '') continue
    rows.push({
      entry,
      entryId,
      serverName,
      config,
      // Loader 行选项：布尔值；`undefined` = 启用。`entry.disabled` 还会把
      // 祖先分组 / 表达式结果算进来，二者取或即有效禁用状态。
      disabled: (entry as { disabled?: unknown }).disabled === true || options.disabled === true,
      inherited: {},
      override: {},
    })
  }
  if (typeof editor.configuration === 'function') {
    try {
      for (const row of editor.configuration() ?? []) {
        const entryId = (row?.entry as { options?: { id?: unknown } } | undefined)?.options?.id
        const match = rows.find((candidate) => candidate.entry === row?.entry || candidate.entryId === entryId)
        if (match === undefined) continue
        match.inherited = plainObject(row?.inherited)
        match.override = plainObject(row?.override)
      }
    } catch {
      // configuration() 读失败不影响行枚举：写操作仍走 configEditor.edit。
    }
  }
  return rows
}

/** 该 server 的 MCP 行（按 serverName 找可编辑行）。 */
function editableRowOf(ctx: PluginContext, serverName: string): EditableMcpRow | undefined {
  return editableMcpRows(ctx).find((row) => row.serverName === serverName)
}

/* ── mcp-manager 运行时状态（watch / status 事件） ─────────────────────── */

interface ManagerView {
  name: string
  configured: boolean
  status: unknown
}

let managerSnapshot: ManagerView[] = []
let managerWatched = false

function managerOf(ctx: PluginContext): any {
  return optionalService(ctx, 'mcpManager')
}

function readManagerViews(ctx: PluginContext): ManagerView[] {
  const manager = managerOf(ctx)
  if (manager === undefined) return []
  try {
    if (typeof manager.list === 'function') {
      const list: unknown = manager.list()
      if (Array.isArray(list)) {
        managerSnapshot = list.map((item: any) => ({
          name: String(item?.name ?? ''),
          configured: item?.configured === true,
          status: item?.status,
        })).filter((item) => item.name !== '')
      }
    }
  } catch {
    // list() 失败：沿用上一份快照。
  }
  return managerSnapshot
}

/**
 * 订阅 mcp-manager 状态流。`watch()` 是首选（一次订阅拿到全量列表），
 * `mcp-manager/status` 事件用于把单条变化并进快照；两者都不存在时靠
 * `list()` 轮询式读取（仅状态路由请求时）。
 */
function attachManagerWatch(ctx: PluginContext): void {
  if (managerWatched) return
  const manager = managerOf(ctx)
  if (manager === undefined) return
  managerWatched = true
  readManagerViews(ctx)
  const update = (name: unknown, status: unknown): void => {
    const serverName = String(name ?? '')
    if (serverName === '') return
    const index = managerSnapshot.findIndex((item) => item.name === serverName)
    if (index < 0) managerSnapshot = [...managerSnapshot, { name: serverName, configured: true, status }]
    else managerSnapshot = managerSnapshot.map((item, at) => at === index ? { ...item, status } : item)
  }
  let off: (() => void) | undefined
  try {
    if (typeof ctx.on === 'function') off = ctx.on('mcp-manager/status', update)
  } catch {
    // 事件声明缺席：只靠 watch。
  }
  const abort = new AbortController()
  if (typeof manager.watch === 'function') {
    void (async () => {
      try {
        for await (const views of manager.watch(abort.signal)) {
          if (!Array.isArray(views)) continue
          managerSnapshot = views.map((item: any) => ({
            name: String(item?.name ?? ''),
            configured: item?.configured === true,
            status: item?.status,
          })).filter((item) => item.name !== '')
        }
      } catch {
        // 订阅结束（abort / 服务销毁）：保留最后快照。
      }
    })()
  }
  ctx.effect(() => () => {
    abort.abort()
    try { off?.() } catch { /* 已卸载 */ }
  }, 'dsh-mcp-status: manager watch')
}

/* ── 工作区 .mcp.json（保留解析/编辑） ─────────────────────────────────── */

/** 读工作区 `.mcp.json` 里已有的 server 键名（缺文件/坏 JSON 返回空集）。 */
function readWorkspaceMcpJsonNames(path: string): Set<string> {
  const names = new Set<string>()
  if (!existsSync(path)) return names
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as unknown
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return names
    const servers = (parsed as { mcpServers?: unknown }).mcpServers
    if (servers === null || typeof servers !== 'object' || Array.isArray(servers)) return names
    for (const key of Object.keys(servers as Record<string, unknown>)) names.add(key)
  } catch {
    // 坏 JSON：交给 mergeWorkspaceMcpJson 报错，这里只当没有已知键。
  }
  return names
}

/**
 * 把新行合并进工作区的 `.mcp.json`（主流 agent 通用格式）。
 * 同名跳过、坏 JSON 不覆盖、其它顶层字段保留。
 */
function mergeWorkspaceMcpJson(path: string, rows: readonly { id: string; name: string; config: Record<string, unknown> }[]): void {
  let document: Record<string, unknown> = {}
  if (existsSync(path)) {
    const raw = readFileSync(path, 'utf8')
    if (raw.trim() !== '') {
      let parsed: unknown
      try {
        parsed = JSON.parse(raw) as unknown
      } catch (error) {
        throw new Error(`${path} 不是合法 JSON（${error instanceof Error ? error.message : String(error)}），请先修好再添加`)
      }
      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error(`${path} 顶层不是对象，请先修好再添加`)
      }
      document = { ...parsed as Record<string, unknown> }
    }
  }
  const servers = document.mcpServers !== null && typeof document.mcpServers === 'object' && !Array.isArray(document.mcpServers)
    ? { ...document.mcpServers as Record<string, unknown> }
    : {}
  for (const row of rows) {
    const name = String(row.config.serverName ?? row.name)
    if (servers[name] !== undefined) continue
    // 落盘只写通用字段：serverName 是 DSH 内部键，transport 是推断值。
    const { serverName: _name, transport: _transport, ...rest } = row.config
    servers[name] = rest
  }
  document.mcpServers = servers
  mkdirSync(dirname(path), { recursive: true })
  if (existsSync(path)) copyFileSync(path, `${path}${BACKUP_SUFFIX}`)
  writeFileSync(path, `${JSON.stringify(document, null, 2)}\n`, 'utf8')
}

/* ── 状态收集 ─────────────────────────────────────────────────────────── */

/**
 * 每个预设的活动 agent 作用域里可见的 `mcp__*` 工具（去重）。
 * 预设自带的 mcp-client 行在预设作用域注册工具，插件层的全局视图看不到。
 */
function collectPresetTools(ctx: PluginContext): Map<string, Array<{ name: string; description: string }>> {
  const out = new Map<string, Array<{ name: string; description: string }>>()
  const agents = optionalService<{ list?: () => unknown }>(ctx, 'agents')
  const list: unknown = typeof agents?.list === 'function' ? agents.list() : []
  const presets = optionalService<{ composedPreset?: (scope: unknown) => unknown }>(ctx, 'agentPresets')
  for (const agent of Array.isArray(list) ? list : []) {
    if (agent === null || typeof agent !== 'object') continue
    let presetId: unknown
    try {
      presetId = presets?.composedPreset?.((agent as { ctx?: unknown }).ctx)
    } catch {
      presetId = undefined
    }
    if (typeof presetId !== 'string' || presetId === '') continue
    const schemas: unknown = (agent as { ctx?: { get?: (name: string) => any } }).ctx?.get?.('tools')?.schemas?.() ?? []
    const seen = new Set(out.get(presetId)?.map((tool) => tool.name) ?? [])
    const merged = out.get(presetId) ?? []
    for (const schema of Array.isArray(schemas) ? schemas : []) {
      const name = typeof (schema as { name?: unknown })?.name === 'string' ? (schema as { name: string }).name : ''
      if (!name.startsWith('mcp__') || seen.has(name)) continue
      seen.add(name)
      merged.push({
        name,
        description: typeof (schema as { description?: unknown }).description === 'string'
          ? (schema as { description: string }).description
          : '',
      })
    }
    if (merged.length > 0) out.set(presetId, merged)
  }
  return out
}

/** 合并「注册工具 ∪ 名单缓存」成卡片要显示的完整工具清单。 */
function mergeWithKnown(serverName: string, tools: Array<{ name: string; description: string }>): Array<{ name: string; description: string }> {
  const known = knownToolsOf(serverName)
  if (known.length === 0) return tools
  const seen = new Set(tools.map((tool) => tool.name))
  const missing = known.filter((name) => !seen.has(name)).map((name) => ({ name, description: '' }))
  return missing.length === 0 ? tools : [...tools, ...missing]
}

/** 配置行的可安全外露字段（不返回 env / headers，避免把凭据送进前端）。 */
function rowConfigView(row: EditableMcpRow, editable: boolean): Record<string, unknown> {
  const config = row.config
  return {
    entryId: row.entryId,
    disabled: row.disabled,
    editable,
    serverName: row.serverName,
    ...typeof config.transport === 'string' ? { transport: config.transport } : {},
    ...typeof config.command === 'string' ? { command: config.command } : {},
    ...Array.isArray(config.args) ? { args: config.args.filter((arg): arg is string => typeof arg === 'string') } : {},
    ...typeof config.url === 'string' ? { url: config.url } : {},
  }
}

/** 插件自管行的可安全外露字段（不返回 env / headers）。 */
function storedRowConfigView(row: StoredGlobalMcpServer): Record<string, unknown> {
  const config = row.config
  return {
    entryId: row.id,
    disabled: row.disabled,
    editable: true,
    managed: true,
    serverName: String(config.serverName ?? ''),
    ...typeof config.transport === 'string' ? { transport: config.transport } : {},
    ...typeof config.command === 'string' ? { command: config.command } : {},
    ...Array.isArray(config.args) ? { args: config.args.filter((arg): arg is string => typeof arg === 'string') } : {},
    ...typeof config.url === 'string' ? { url: config.url } : {},
  }
}

/** 只读：合并可编辑行、运行时注册工具与预设维度。 */
async function collectMcpStatus(ctx: PluginContext): Promise<Record<string, unknown>> {
  const profile = requireProfile(ctx)
  const rows = editableMcpRows(ctx)
  const storedServers = readGlobalMcpStore(profileStoreName(profile)).servers
  const [presets, presetServers] = await Promise.all([
    readPresetRoster(ctx),
    collectPresetServers(ctx),
  ])

  const presetServerNames = Object.values(presetServers).flat().map((row) => row.serverName)
  const candidates = [
    ...rows.map((row) => row.serverName),
    ...storedServers.map((row) => String(row.config.serverName ?? '')),
    ...presetServerNames,
    ...ledgerServerNamesOf(),
  ]
  rememberServerNames(candidates)

  const groups = new Map<string, Array<{ name: string; description: string }>>()
  for (const schema of ctx.tools.schemas()) {
    if (typeof schema.name !== 'string' || !schema.name.startsWith('mcp__')) continue
    const serverName = serverOfToolName(schema.name, candidates)
    if (serverName === undefined) continue
    const tool = { name: schema.name, description: typeof schema.description === 'string' ? schema.description : '' }
    const list = groups.get(serverName)
    if (list === undefined) groups.set(serverName, [tool])
    else list.push(tool)
  }

  const seen = new Set<string>()
  const servers: Array<Record<string, unknown>> = []
  const ledger = readMaskLedger()
  const maskedBy = (serverName: string): string[] => Object.entries(ledger.presets)
    .filter(([, table]) => table[serverName] === false)
    .map(([presetId]) => presetId)
  const knownToRemember: Record<string, string[]> = {}
  for (const row of rows) {
    seen.add(row.serverName)
    const registered = groups.get(row.serverName) ?? []
    const tools = mergeWithKnown(row.serverName, registered)
    knownToRemember[row.serverName] = tools.map((tool) => tool.name)
    servers.push({
      serverName: row.serverName,
      toolCount: registered.length,
      tools,
      config: rowConfigView(row, true),
      scope: 'global',
      maskedBy: maskedBy(row.serverName),
    })
  }
  // 插件自管的全局行：DSH profile 配置里没有它们，由 mcp-global-store 持久化。
  for (const row of storedServers) {
    const serverName = String(row.config.serverName ?? '')
    if (serverName === '' || seen.has(serverName)) continue
    seen.add(serverName)
    const registered = groups.get(serverName) ?? []
    const tools = mergeWithKnown(serverName, registered)
    knownToRemember[serverName] = tools.map((tool) => tool.name)
    servers.push({
      serverName,
      toolCount: registered.length,
      tools,
      config: storedRowConfigView(row),
      scope: 'global',
      managedBy: 'plugin',
      maskedBy: maskedBy(serverName),
    })
  }
  // 注册了工具但没有可编辑行：只读展示（editable:false）。
  for (const [serverName, registered] of groups) {
    if (seen.has(serverName)) continue
    const tools = mergeWithKnown(serverName, registered)
    knownToRemember[serverName] = tools.map((tool) => tool.name)
    servers.push({
      serverName,
      toolCount: registered.length,
      tools,
      config: { entryId: null, disabled: false, editable: false },
      scope: 'global',
      maskedBy: maskedBy(serverName),
    })
  }

  // 预设自带 server：作用域注册，只有该预设的活动 agent 能看见。
  const toolsByPreset = collectPresetTools(ctx)
  for (const [presetId, presetRows] of Object.entries(presetServers)) {
    rememberPresetOwnServers(presetId, presetRows.map((row) => row.serverName))
    const view = toolsByPreset.get(presetId) ?? []
    for (const row of presetRows) {
      const prefix = `mcp__${row.serverName}__`
      const live = view.filter((tool) => tool.name.startsWith(prefix))
      const tools = mergeWithKnown(row.serverName, live)
      knownToRemember[row.serverName] = tools.map((tool) => tool.name)
      if (tools.length > 0) row.tools = tools
      row.registeredCount = live.length
    }
  }
  try {
    rememberKnownTools(knownToRemember)
  } catch {
    /* 缓存写盘失败不影响状态读取 */
  }

  // mcp-manager：合并运行时状态（含 manager-only 条目）。
  const managerViews = readManagerViews(ctx)
  for (const view of managerViews) {
    const existing = servers.find((server) => server.serverName === view.name)
    if (existing !== undefined) {
      existing.managerStatus = view.status
      continue
    }
    servers.push({
      serverName: view.name,
      toolCount: (groups.get(view.name) ?? []).length,
      tools: mergeWithKnown(view.name, groups.get(view.name) ?? []),
      config: { entryId: null, disabled: false, editable: false, manager: true },
      scope: 'global',
      maskedBy: maskedBy(view.name),
      managerStatus: view.status,
    })
  }

  servers.sort((a, b) => String(a.serverName).localeCompare(String(b.serverName)))
  const tables = toolDisableTables()
  const manager = managerOf(ctx)
  return {
    at: new Date().toISOString(),
    serverCount: servers.length,
    toolCount: servers.reduce((sum, server) => sum + (server.toolCount as number), 0),
    patchFile: profile.patchPath,
    profile: profile.name ?? null,
    servers,
    presets,
    masks: ledger.presets,
    maskInstall: maskInstallReport(),
    presetServers,
    workspaceClosed: workspaceMcpLedger().workspaces,
    workspaceToolDisabled: workspaceToolDisabledLedger().workspaces,
    workspaceMcp: workspaceMcpMountStatus(),
    toolDisabled: tables.disabled,
    toolDisabledByPreset: tables.presets,
    // mcpManager 缺席 = 无法观察热重载，UI 应提示手动刷新。
    manualRefreshRequired: manager === undefined,
    manager: manager !== undefined,
    hotReload: manager === undefined ? 'manual' : 'live',
  }
}

/* ── 写操作（Loader / configEditor） ──────────────────────────────────── */

function loaderOf(ctx: PluginContext): any {
  return optionalService(ctx, 'loader')
}

/** 本插件创建过的 root Loader mcp-client 行 id；插件卸载时统一回收。 */
const mountedGlobalServerIds = new WeakMap<object, Set<string>>()

function mountedIdsOf(ctx: PluginContext): Set<string> {
  let ids = mountedGlobalServerIds.get(ctx)
  if (ids === undefined) {
    ids = new Set<string>()
    mountedGlobalServerIds.set(ctx, ids)
  }
  return ids
}

/** 读 profile 根 cordis.yml 顶层行 id；旧版 runtime 行只会出现在这里。 */
function rootCordisEntryIds(profile: ProfileInfo): Set<string> {
  const ids = new Set<string>()
  try {
    const text = readFileSync(join(profile.dir ?? dirname(profile.patchPath), 'cordis.yml'), 'utf8')
    const parsed = loadYaml(text) as unknown
    for (const row of Array.isArray(parsed) ? parsed : []) {
      if (row !== null && typeof row === 'object' && typeof (row as { id?: unknown }).id === 'string') {
        ids.add((row as { id: string }).id)
      }
    }
  } catch {
    // 根文件缺失 / 坏 YAML：不启用旧行迁移，避免把别的来源误收进账本。
  }
  return ids
}

/** 切换一条全局行的 `disabled`（插件账本行或宿主配置行）。 */
async function togglePatchEntry(ctx: PluginContext, serverName: string, disabled: boolean): Promise<{ ok: boolean; error?: string; entryId?: string; disabled?: boolean; reload?: string; manualRefreshRequired?: boolean }> {
  const profile = requireProfile(ctx)
  const loader = loaderOf(ctx)
  // 宿主配置行优先：status 也先列它；同名时绝不能去改隐藏的 ledger 行。
  const row = editableRowOf(ctx, serverName)
  if (row !== undefined) {
    const entry = row.entry as { update?: (options: Record<string, unknown>) => Promise<void> }
    try {
      if (typeof entry?.update === 'function') await entry.update({ disabled })
      else if (typeof loader?.update === 'function') await loader.update(row.entryId, { disabled })
      else return { ok: false, error: 'loader unavailable' }
    } catch (error) {
      return { ok: false, error: `write failed: ${error instanceof Error ? error.message : String(error)}` }
    }
    return { ok: true, entryId: row.entryId, disabled, reload: 'live', manualRefreshRequired: managerOf(ctx) === undefined }
  }
  const stored = findStoredGlobalMcpServer(profileStoreName(profile), serverName)
  if (stored !== undefined) {
    if (typeof loader?.update !== 'function') return { ok: false, error: 'loader unavailable' }
    try {
      await loader.update(stored.id, { disabled })
      setStoredGlobalMcpServerDisabled(profileStoreName(profile), serverName, disabled)
    } catch (error) {
      // SQLite 写失败时恢复内存状态，避免“本次生效、下次又变回去”的静默漂移。
      try { await loader.update(stored.id, { disabled: stored.disabled }) } catch { /* 原状态恢复失败时保留错误 */ }
      return { ok: false, error: `persist failed: ${error instanceof Error ? error.message : String(error)}` }
    }
    return { ok: true, entryId: stored.id, disabled, reload: 'live', manualRefreshRequired: managerOf(ctx) === undefined }
  }
  return { ok: false, error: `no mcp-client row for serverName "${serverName}"` }
}

/** 删除一条全局 mcp-client 行（插件账本行或宿主配置行）。 */
async function removePatchEntry(ctx: PluginContext, serverName: string): Promise<{ ok: boolean; error?: string; entryId?: string; reload?: string; manualRefreshRequired?: boolean }> {
  const profile = requireProfile(ctx)
  const loader = loaderOf(ctx)
  const row = editableRowOf(ctx, serverName)
  if (row !== undefined) {
    const entry = row.entry as { parent?: { tree?: { remove?: (id: string) => Promise<void> | void } } }
    try {
      if (typeof entry?.parent?.tree?.remove === 'function') await Promise.resolve(entry.parent.tree.remove(row.entryId))
      else if (typeof loader?.remove === 'function') await Promise.resolve(loader.remove(row.entryId))
      else return { ok: false, error: 'loader unavailable' }
    } catch (error) {
      return { ok: false, error: `remove failed: ${error instanceof Error ? error.message : String(error)}` }
    }
    return { ok: true, entryId: row.entryId, reload: 'live', manualRefreshRequired: managerOf(ctx) === undefined }
  }
  const stored = findStoredGlobalMcpServer(profileStoreName(profile), serverName)
  if (stored !== undefined) {
    if (typeof loader?.remove !== 'function') return { ok: false, error: 'loader unavailable' }
    try {
      removeStoredGlobalMcpServer(profileStoreName(profile), serverName)
    } catch (error) {
      return { ok: false, error: `persist failed: ${error instanceof Error ? error.message : String(error)}` }
    }
    try {
      await Promise.resolve(loader.remove(stored.id))
    } catch (error) {
      try { upsertStoredGlobalMcpServer(profileStoreName(profile), stored) } catch { /* 恢复账本失败时保留原始错误 */ }
      return { ok: false, error: `remove failed: ${error instanceof Error ? error.message : String(error)}` }
    }
    return { ok: true, entryId: stored.id, reload: 'live', manualRefreshRequired: managerOf(ctx) === undefined }
  }
  return { ok: false, error: `no mcp-client row for serverName "${serverName}"` }
}

/**
 * 等 entry 的插件 apply 结果。mcp-client 的首次连接可能等满
 * startupTimeoutMs，HTTP 请求不应被一台未启动/不可达的服务器拖住；但
 * 重复 serverName / 配置错误这类 apply 立即失败必须能被观察到。
 * 300ms 只覆盖同步/近同步的 apply 拒绝，超时按“已开始连接”处理。
 */
function awaitEntryActivation(entry: any, graceMs: number): Promise<void> {
  const awaitFiber = Promise.resolve(entry?.fiber?.await?.())
  return new Promise((resolve, reject) => {
    let settled = false
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      resolve()
    }, graceMs)
    awaitFiber.then(() => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve()
    }, (error: unknown) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      reject(error)
    })
  })
}

/**
 * 把一条插件账本行挂进 root Loader 的内存树。
 *
 * `waitForReady=false` 用于面板新增：只等 short activation grace，不等待
 * mcp-client 建立连接；连接与工具注册由 mcp-client 在后台完成。
 */
function createGlobalServerEntry(ctx: PluginContext, row: StoredGlobalMcpServer, waitForReady = true): Promise<void> {
  const loader = loaderOf(ctx)
  if (typeof loader?.create !== 'function') return Promise.reject(new Error('loader unavailable'))
  const creation = loader.create({
    id: row.id,
    name: MCP_CLIENT_NAME,
    config: toEditorConfig(row.config) as Record<string, unknown>,
    ...(row.disabled ? { disabled: true } : {}),
  })
  const mounted = mountedIdsOf(ctx)
  mounted.add(row.id)
  return creation.then(async () => {
    const entry = typeof loader.resolve === 'function' ? loader.resolve(row.id) : undefined
    try {
      await awaitEntryActivation(entry, waitForReady ? 30_000 : 300)
    } catch (error) {
      mounted.delete(row.id)
      try { loader.remove?.(row.id) } catch { /* 已回滚 */ }
      throw error
    }
  }).catch((error: unknown) => {
    mounted.delete(row.id)
    throw error
  })
}

/**
 * 首次升级迁移：旧版“全局添加”把行写进了 profile 根 Include 树，
 * 这些行没有对应的宿主 patch 配置（configuration() 的 inherited/override 都为空）。
 * 在插件热更新后的第一次运行里把它们收进账本，避免下一次重启直接消失。
 */
function adoptTransientGlobalServers(ctx: PluginContext, profile: ProfileInfo): void {
  const profileName = profileStoreName(profile)
  if (hasGlobalMcpStore(profileName)) return
  const loader = loaderOf(ctx)
  if (loader?.store === undefined) return
  const rootIds = rootCordisEntryIds(profile)
  if (rootIds.size === 0) return
  const transient = editableMcpRows(ctx).filter((row) =>
    rootIds.has(row.entryId)
    &&
    Object.keys(row.inherited).length === 0
    && Object.keys(row.override).length === 0
    && (row.entry as { parent?: { tree?: { store?: Record<string, unknown> } } } | null)?.parent?.tree?.store?.[row.entryId] === row.entry)
  if (transient.length === 0) return
  writeGlobalMcpStore(profileName, {
    version: 1,
    servers: transient.map((row) => ({
      id: row.entryId,
      config: fromEditorConfig(row.config) as Record<string, unknown>,
      disabled: row.disabled,
    })),
  })
}

/**
 * 启动加载：把 SQLite 账本里的全局 MCP 行挂回 root Loader 的内存树。
 * root tree 的 commit 是 no-op，因此不会写回 `cordis.yml`。
 */
async function hydrateGlobalMcpServers(ctx: PluginContext): Promise<string[]> {
  const profile = profileInfo(ctx)
  if (profile === undefined) return []
  const profileName = profileStoreName(profile)
  try {
    adoptTransientGlobalServers(ctx, profile)
  } catch (error) {
    ctx.logger?.warn?.(`[dsh-prompt-customizer] adopt legacy global MCP failed: ${error instanceof Error ? error.message : String(error)}`)
  }
  const loader = loaderOf(ctx)
  if (typeof loader?.create !== 'function' || loader.store === undefined) return []
  const configServerNames = new Set(editableMcpRows(ctx).map((row) => row.serverName))
  const created: string[] = []
  for (const row of readGlobalMcpStore(profileName).servers) {
    const serverName = String(row.config.serverName ?? '')
    if (serverName === '' || configServerNames.has(serverName)) continue
    if (Object.hasOwn(loader.store, row.id)) continue
    try {
      await createGlobalServerEntry(ctx, row, false)
      created.push(row.id)
    } catch (error) {
      ctx.logger?.warn?.(`[dsh-prompt-customizer] load global MCP "${serverName}" failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  return created
}

/** 往插件账本新增全局 MCP 行，并立即挂进内存。 */
async function addGlobalRows(ctx: PluginContext, rows: readonly McpRowConfig[]): Promise<string[]> {
  const profile = requireProfile(ctx)
  const profileName = profileStoreName(profile)
  const loader = loaderOf(ctx)
  if (typeof loader?.create !== 'function') throw new Error('loader unavailable')
  const existingIds = new Set([
    ...editableMcpRows(ctx).map((row) => row.entryId),
    ...readGlobalMcpStore(profileName).servers.map((row) => row.id),
    ...(loader.store === undefined ? [] : Object.keys(loader.store)),
  ])
  const added: string[] = []
  for (const row of rows) {
    const serverName = String(row.config.serverName ?? '')
    if (serverName === '') continue
    const baseId = row.id !== '' ? row.id : `mcp-${serverName}`
    let id = baseId
    let suffix = 2
    while (existingIds.has(id)) { id = `${baseId}-${suffix}`; suffix += 1 }
    existingIds.add(id)
    const stored: StoredGlobalMcpServer = {
      id,
      config: structuredClone(withEnvTemplates({ ...row.config, serverName })) as Record<string, unknown>,
      disabled: false,
    }
    upsertStoredGlobalMcpServer(profileName, stored)
    try {
      await createGlobalServerEntry(ctx, stored, false)
      if (findStoredGlobalMcpServer(profileName, serverName) === undefined) {
        throw new Error(`global MCP ledger rejected server "${serverName}"`)
      }
    } catch (error) {
      removeStoredGlobalMcpServer(profileName, serverName)
      throw error
    }
    added.push(serverName)
  }
  return added
}

/* ── mcp-edit：读取/保存现有配置块 ───────────────────────────────────── */

function findPresetServerConfig(plugins: unknown, serverName: string): Record<string, unknown> | null {
  let found: Record<string, unknown> | null = null
  const walk = (list: unknown): void => {
    for (const item of Array.isArray(list) ? list : []) {
      if (item === null || typeof item !== 'object' || Array.isArray(item)) continue
      const row = item as Record<string, unknown>
      if (row.name === MCP_CLIENT_NAME) {
        const cfg = plainObject(row.config)
        if (cfg.serverName === serverName) { found = cfg; return }
      }
      if (Array.isArray(row.config)) walk(row.config)
    }
  }
  walk(plugins)
  return found
}

function replacePresetServerConfig(plugins: unknown, serverName: string, config: Record<string, unknown>): { plugins: unknown[]; changed: boolean } {
  let changed = false
  const mapList = (list: unknown[]): unknown[] => list.map((item) => {
    if (item === null || typeof item !== 'object' || Array.isArray(item)) return item
    const row = { ...(item as Record<string, unknown>) }
    if (row.name === MCP_CLIENT_NAME) {
      const cfg = plainObject(row.config)
      if (cfg.serverName === serverName) { row.config = config; changed = true; return row }
    }
    if (Array.isArray(row.config)) row.config = mapList(row.config)
    return row
  })
  return { plugins: mapList(Array.isArray(plugins) ? plugins : []), changed }
}

async function handleMcpEdit(ctx: PluginContext, req: IncomingMessage, res: ServerResponse): Promise<void> {
  const trust = requireTrustedRequest(ctx, req)
  if (!trust.ok) {
    rejectUntrusted(res, trust)
    return
  }
  const url = new URL(req.url ?? '/', 'http://localhost')
  const method = req.method ?? 'GET'
  const source = url.searchParams.get('source') ?? 'global'
  try {
    if (method === 'GET') {
      const serverName = url.searchParams.get('serverName') ?? ''
      if (source === 'workspace' && serverName === '') {
        const ws = url.searchParams.get('workspace') ?? ''
        let names: string[] = []
        if (ws !== '') {
          const p = join(ws, '.mcp.json')
          if (existsSync(p)) {
            try {
              const doc = JSON.parse(readFileSync(p, 'utf8')) as Record<string, any>
              names = doc?.mcpServers !== null && typeof doc?.mcpServers === 'object' ? Object.keys(doc.mcpServers) : []
            } catch { /* bad json */ }
          }
        }
        writeJsonResponse(res, 200, { ok: true, source: 'workspace', names })
        return
      }
      if (source === 'preset' || source === 'workspace') {
        let text: string | null = null
        if (source === 'preset') {
          const preset = url.searchParams.get('preset') ?? ''
          const ref = presetRowOf(ctx, preset)
          if (ref !== undefined) {
            const cfg = findPresetServerConfig(ref.config.plugins, serverName)
            if (cfg !== null) text = JSON.stringify(cfg, null, 2)
          }
        } else {
          const ws = url.searchParams.get('workspace') ?? ''
          if (ws !== '') {
            const p = join(ws, '.mcp.json')
            if (existsSync(p)) {
              try {
                const doc = JSON.parse(readFileSync(p, 'utf8')) as Record<string, any>
                const cfg = doc?.mcpServers?.[serverName]
                if (cfg !== undefined) text = JSON.stringify(cfg, null, 2)
              } catch { /* bad json */ }
            }
          }
        }
        writeJsonResponse(res, text === null ? 404 : 200, text === null
          ? { ok: false, error: `no ${source} config for ${serverName}` }
          : { ok: true, source, serverName, text, format: 'json' })
        return
      }
      const profile = requireProfile(ctx)
      const row = editableRowOf(ctx, serverName)
      const stored = row === undefined ? findStoredGlobalMcpServer(profileStoreName(profile), serverName) : undefined
      if (stored === undefined && row === undefined) {
        writeJsonResponse(res, 404, { ok: false, error: `no mcp-client row for ${serverName}` })
        return
      }
      const text = rowsToMcpServersYaml([{
        id: stored?.id ?? row!.entryId,
        name: MCP_CLIENT_NAME,
        config: stored !== undefined
          ? fromEditorConfig(stored.config) as Record<string, unknown>
          : fromEditorConfig(row!.config) as Record<string, unknown>,
      }])
      writeJsonResponse(res, 200, { ok: true, source: 'global', serverName, text, format: 'yaml' })
      return
    }

    let body = ''
    for await (const chunk of req as unknown as AsyncIterable<Uint8Array>) body += Buffer.from(chunk).toString('utf8')
    const parsed = (body === '' ? {} : JSON.parse(body)) as Record<string, unknown>
    const serverName = typeof parsed.serverName === 'string' ? parsed.serverName : ''
    if (serverName === '') throw new Error('serverName required')
    const effSource = typeof parsed.source === 'string' ? parsed.source : source
    if (effSource === 'preset') {
      const preset = typeof parsed.preset === 'string' ? parsed.preset : ''
      if (preset === '') throw new Error('preset required')
      const ref = presetRowOf(ctx, preset)
      if (ref === undefined) throw new Error('preset not found')
      if (ref.editor === undefined) throw new Error('preset not editable')
      const { format, text } = pasteFieldsOf(parsed)
      const outcome = parseMcpPaste(format, text)
      if (outcome.errors.length > 0) throw new Error(outcome.errors.join('; '))
      const cfg = outcome.rows[0]?.config ?? {}
      if (typeof cfg.serverName !== 'string' || cfg.serverName === '') cfg.serverName = serverName
      const result = replacePresetServerConfig(ref.config.plugins, serverName, cfg)
      if (!result.changed) throw new Error('server not found in preset')
      await writePresetPlugins(ref, result.plugins)
      writeJsonResponse(res, 200, { ok: true, source: 'preset', serverName, preset, reload: 'live' })
      return
    }
    if (effSource === 'workspace') {
      const ws = typeof parsed.workspace === 'string' ? parsed.workspace.trim() : ''
      if (ws === '') throw new Error('workspace required')
      const p = join(ws, '.mcp.json')
      if (!existsSync(p)) throw new Error('.mcp.json not found')
      let doc: Record<string, any>
      try { doc = JSON.parse(readFileSync(p, 'utf8')) as Record<string, any> } catch { throw new Error('invalid .mcp.json') }
      if (doc === null || typeof doc !== 'object') throw new Error('invalid .mcp.json')
      doc.mcpServers = doc.mcpServers !== null && typeof doc.mcpServers === 'object' ? doc.mcpServers : {}
      if (!(serverName in doc.mcpServers)) throw new Error('server not found in workspace .mcp.json')
      const { format, text } = pasteFieldsOf(parsed)
      const outcome = parseMcpPaste(format, text)
      if (outcome.errors.length > 0) throw new Error(outcome.errors.join('; '))
      doc.mcpServers[serverName] = outcome.rows[0]?.config ?? {}
      copyFileSync(p, `${p}${BACKUP_SUFFIX}`)
      writeFileSync(p, `${JSON.stringify(doc, null, 2)}\n`, 'utf8')
      writeJsonResponse(res, 200, { ok: true, source: 'workspace', serverName, workspace: ws, reload: 'manual' })
      return
    }
    // global：宿主配置行优先；只有没有宿主行时才走插件账本 + root Loader。
    const profile = requireProfile(ctx)
    const profileName = profileStoreName(profile)
    const row = editableRowOf(ctx, serverName)
    if (row !== undefined) {
      const editor = configEditorOf(ctx)
      if (typeof editor?.edit !== 'function') throw new Error('configEditor unavailable')
      const { format, text } = pasteFieldsOf(parsed)
      const outcome = parseMcpPaste(format, text)
      if (outcome.errors.length > 0) throw new Error(outcome.errors.join('; '))
      const cfg = outcome.rows[0]?.config ?? {}
      if (typeof cfg.serverName !== 'string' || cfg.serverName === '') cfg.serverName = serverName
      await editor.edit(row.entry, () => toEditorConfig(cfg) as Record<string, unknown>)
      writeJsonResponse(res, 200, { ok: true, source: 'global', serverName, reload: 'live' })
      return
    }
    const stored = findStoredGlobalMcpServer(profileName, serverName)
    if (stored === undefined) throw new Error(`no editable mcp-client row for ${serverName}`)
    const { format, text } = pasteFieldsOf(parsed)
    const outcome = parseMcpPaste(format, text)
    if (outcome.errors.length > 0) throw new Error(outcome.errors.join('; '))
    const cfg = outcome.rows[0]?.config ?? {}
    if (typeof cfg.serverName === 'string' && cfg.serverName !== serverName) {
      throw new Error(`serverName cannot be changed (${cfg.serverName} -> ${serverName})`)
    }
    cfg.serverName = serverName
    const nextConfig = withEnvTemplates(cfg) as Record<string, unknown>
    const previous = stored.config
    replaceStoredGlobalMcpServerConfig(profileName, serverName, structuredClone(nextConfig))
    try {
      const loader = loaderOf(ctx)
      if (typeof loader?.update !== 'function') throw new Error('loader unavailable')
      await loader.update(stored.id, { config: toEditorConfig(nextConfig) as Record<string, unknown> })
    } catch (error) {
      replaceStoredGlobalMcpServerConfig(profileName, serverName, previous)
      throw error
    }
    writeJsonResponse(res, 200, { ok: true, source: 'global', serverName, managedBy: 'plugin', reload: 'live' })
  } catch (error) {
    if (error instanceof ProfileUnavailableError) {
      writeJsonResponse(res, 503, { ok: false, error: 'profile-unavailable' })
      return
    }
    writeJsonResponse(res, 400, { ok: false, error: error instanceof Error ? error.message : String(error) })
  }
}

/* ── 路由 ──────────────────────────────────────────────────────────────── */

/** 注册 GET /api/triad/mcp-status、POST /api/triad/mcp-config 与 mcp-edit。 */
export async function applyMcpStatus(ctx: Context): Promise<void> {
  const pluginCtx = ctx as PluginContext
  attachManagerWatch(pluginCtx)

  // 启动成功后把 SQLite 账本里的全局 MCP 挂回 root Loader 内存树。
  // 必须等 appReady：mcp-client 的首次连接计时（默认 30s）不能拖住宿主启动；
  // 没有 appReady 的裸组装退回下一个事件循环 tick。root tree 的 commit 是
  // no-op，不会写回 `cordis.yml`；插件卸载时按创建顺序反向清理。
  const hydration: { disposed: boolean; started: boolean } = { disposed: false, started: false }
  const cleanup = async (): Promise<void> => {
    const loader = loaderOf(pluginCtx)
    const mounted = mountedIdsOf(pluginCtx)
    for (const id of [...mounted].reverse()) {
      try {
        const entry = loader?.store?.[id]
        if (entry === undefined) continue
        await entry.fiber?.dispose?.()
        loader.remove?.(id)
      } catch {
        // 卸载清理尽力而为；Loader 树随宿主销毁时本身也会回收。
      }
    }
    mounted.clear()
  }
  const runHydration = (): void => {
    if (hydration.disposed || hydration.started) return
    hydration.started = true
    void hydrateGlobalMcpServers(pluginCtx).then(() => {
      if (hydration.disposed) void cleanup()
    }).catch((error: unknown) => {
      pluginCtx.logger?.warn?.(`[dsh-prompt-customizer] hydrate global MCP failed: ${error instanceof Error ? error.message : String(error)}`)
    })
  }
  let cancelReady: (() => void) | undefined
  try {
    cancelReady = optionalService<{ onReady?: (listener: () => void) => () => void }>(pluginCtx, 'appReady')?.onReady?.(runHydration)
  } catch {
    cancelReady = undefined
  }
  let timer: ReturnType<typeof setTimeout> | undefined
  if (cancelReady === undefined) timer = setTimeout(runHydration, 0)
  ctx.effect(() => () => {
    hydration.disposed = true
    if (timer !== undefined) clearTimeout(timer)
    try { cancelReady?.() } catch { /* 已触发 / 已卸载 */ }
    return cleanup()
  }, 'dsh-mcp-status: hydrate global mcp')

  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: EDIT_ROUTE,
    handler: (req: IncomingMessage, res: ServerResponse) => { void handleMcpEdit(pluginCtx, req, res) },
  }), 'dsh-mcp-edit: routes')

  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: STATUS_ROUTE,
    handler: (req: IncomingMessage, res: ServerResponse) => {
      // 服务可能在插件挂载之后才提供（Loader 顺序不同）：首次请求时补订阅。
      if (!managerWatched) attachManagerWatch(pluginCtx)
      const trust = requireTrustedRequest(pluginCtx, req)
      if (!trust.ok) { rejectUntrusted(res, trust); return }
      void collectMcpStatus(pluginCtx).then((status) => {
        writeJsonResponse(res, 200, status)
      }).catch((error: unknown) => {
        if (error instanceof ProfileUnavailableError) {
          writeJsonResponse(res, 503, { ok: false, error: 'profile-unavailable' })
          return
        }
        writeJsonResponse(res, 500, { error: error instanceof Error ? error.message : String(error) })
      })
    },
  }), 'dsh-mcp-status: routes')

  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: CONFIG_ROUTE,
    handler: (req: IncomingMessage, res: ServerResponse) => {
      void (async () => {
        const trust = requireTrustedRequest(pluginCtx, req)
        if (!trust.ok) { rejectUntrusted(res, trust); return }
        let body = ''
        for await (const chunk of req as unknown as AsyncIterable<Uint8Array>) body += Buffer.from(chunk).toString('utf8')
        let parsed: Record<string, unknown>
        try {
          parsed = JSON.parse(body) as Record<string, unknown>
        } catch {
          writeJsonResponse(res, 400, { ok: false, error: 'invalid json' })
          return
        }
        try {
          // ── action: add —— 粘贴文本（JSON / YAML）追加到 profile patch 或工作区 .mcp.json ──
          if (parsed.action === 'add') {
            const { format, text } = pasteFieldsOf(parsed)
            const outcome = parseMcpPaste(format, text)
            if (outcome.errors.length > 0) {
              writeJsonResponse(res, 400, { ok: false, errors: outcome.errors, warnings: outcome.warnings })
              return
            }
            if (outcome.rows.length === 0) {
              writeJsonResponse(res, 400, { ok: false, error: '未解析出任何 MCP server' })
              return
            }
            const scope = parsed.scope === 'workspace' ? 'workspace' : 'global'
            const workspace = typeof parsed.workspace === 'string' ? parsed.workspace.trim() : ''
            if (scope === 'workspace') {
              if (workspace === '') {
                writeJsonResponse(res, 400, { ok: false, error: 'scope=workspace 需要 workspace 路径' })
                return
              }
              const targetPath = join(workspace, '.mcp.json')
              const existing = readWorkspaceMcpJsonNames(targetPath)
              const added: string[] = []
              const fresh = outcome.rows.filter((row) => {
                const serverName = String(row.config.serverName ?? '')
                if (existing.has(serverName)) return false
                existing.add(serverName)
                added.push(serverName)
                return true
              })
              if (fresh.length > 0) mergeWorkspaceMcpJson(targetPath, fresh)
              writeJsonResponse(res, 200, {
                ok: true, added, skipped: outcome.rows.length - fresh.length, scope,
                warnings: outcome.warnings, patchFile: targetPath, reload: 'manual',
              })
              return
            }
            const profile = requireProfile(pluginCtx)
            const existing = new Set([
              ...editableMcpRows(pluginCtx).map((row) => row.serverName),
              ...readGlobalMcpStore(profileStoreName(profile)).servers.map((row) => String(row.config.serverName ?? '')),
            ])
            const added: string[] = []
            const fresh = outcome.rows.filter((row) => {
              const serverName = String(row.config.serverName ?? '')
              if (existing.has(serverName)) return false
              existing.add(serverName)
              added.push(serverName)
              return true
            })
            if (fresh.length > 0) await addGlobalRows(pluginCtx, fresh)
            writeJsonResponse(res, 200, {
              ok: true, added, skipped: outcome.rows.length - fresh.length, scope,
              warnings: outcome.warnings, patchFile: profile.patchPath, reload: 'live',
              manualRefreshRequired: managerOf(pluginCtx) === undefined,
            })
            return
          }
          const serverName = typeof parsed.serverName === 'string' ? parsed.serverName : ''
          if (serverName === '') {
            writeJsonResponse(res, 400, { ok: false, error: 'serverName required' })
            return
          }
          const result = parsed.action === 'remove'
            ? await removePatchEntry(pluginCtx, serverName)
            : await togglePatchEntry(pluginCtx, serverName, parsed.disabled === true)
          writeJsonResponse(res, result.ok ? 200 : 400, result)
        } catch (error) {
          if (error instanceof ProfileUnavailableError) {
            writeJsonResponse(res, 503, { ok: false, error: 'profile-unavailable' })
            return
          }
          writeJsonResponse(res, 400, { ok: false, error: error instanceof Error ? error.message : String(error) })
        }
      })()
    },
  }), 'dsh-mcp-config: routes')
}

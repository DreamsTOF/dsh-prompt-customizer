/**
 * mcp-workspace-scope — 按**工作区**关闭 MCP Server（不影响其它工作区）。
 *
 * 语义（与技能的工作区/全局分层一致）：
 *   1. 全局行是所有工作区共用的；在某个工作区把它关掉，只影响该工作区的会话。
 *   2. 换到别的工作区，那个 Server 照常注入 —— 于是工具集合随工作区变化。
 *   3. 同名优先：工作区的技能/配置优先于全局，关闭状态也各记各的账。
 *
 * 落盘：`<agentsHome>/skills/.workspace-mcp.json`
 *   `{ version: 1, workspaces: { "<工作区绝对路径>": { "<serverName>": false } } }`
 * 只有显式 `false` 才在该工作区关闭；缺省 = 继承全局。
 *
 * 生效：`system-prompt/assemble` waterfall 里按该次装配所属会话的 cwd 剔除
 * `mcp__<server>__<tool>` 工具。与 `mcp-tool-disable` 同一套缝，不碰内核源码。
 */

import { readFile } from 'node:fs/promises'
import { readPluginDoc, writePluginDoc } from '../vendor/prompt-customizer/db.js'
import { join, resolve } from 'node:path'
import type { Fiber } from '@deepseek-ai/cordis'
import { normalizeCwd } from './home-paths.ts'
import { optionalService } from './context-utils.ts'
import { cwdOfScope, liveAgents } from './scope-context.ts'
import { rejectUntrusted, requireTrustedRequest } from './trust.ts'

/** 运行时上下文在类型上放宽（与其它 host 模块同惯例）。 */
type PluginContext = any

const LEDGER_KEY = 'mcp/workspace-close'
const MAX_WORKSPACES = 64

/** 账本形状。 */
export interface WorkspaceMcpLedger {
  version: 1
  workspaces: Record<string, Record<string, boolean>>
}

/** 装配对象里本模块用到的字段。 */
interface PromptAssemblyLike {
  tools?: Array<{ name?: unknown }>
}

/** 归一化任意输入（脏字段丢弃，路径按 resolve 规整）。 */
function normalize(input: unknown): WorkspaceMcpLedger {
  const workspaces: Record<string, Record<string, boolean>> = {}
  const raw = input !== null && typeof input === 'object'
    ? (input as Record<string, unknown>).workspaces
    : undefined
  if (raw !== null && typeof raw === 'object') {
    for (const [cwd, table] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof cwd !== 'string' || cwd.trim() === '') continue
      if (Object.keys(workspaces).length >= MAX_WORKSPACES) break
      if (table === null || typeof table !== 'object') continue
      const entries: Record<string, boolean> = {}
      for (const [serverName, state] of Object.entries(table as Record<string, unknown>)) {
        if (typeof serverName !== 'string' || serverName === '' || typeof state !== 'boolean') continue
        entries[serverName] = state
      }
      workspaces[normalizeCwd(cwd)] = entries
    }
  }
  return { version: 1, workspaces }
}

/** 进程内账本（写盘后立即刷新，装配时零 I/O）。 */
let cache: WorkspaceMcpLedger | undefined

/** 读账本（首次读盘，之后走内存；缺失/损坏视为空）。 */
async function readLedger(): Promise<WorkspaceMcpLedger> {
  let parsed: unknown
  try {
    parsed = readPluginDoc(LEDGER_KEY)
  } catch {
    parsed = undefined
  }
  cache = normalize(parsed)
  return cache
}

/** 原子写账本。 */
async function writeLedger(next: WorkspaceMcpLedger): Promise<void> {
  writePluginDoc(LEDGER_KEY, next)
  cache = next
}

/** 某个工作区被关闭的 server 名单。 */
export function closedInWorkspace(ledger: WorkspaceMcpLedger, cwd: string): Set<string> {
  const table = ledger.workspaces[normalizeCwd(cwd)]
  if (table === undefined) return new Set()
  const closed = new Set<string>()
  for (const [serverName, state] of Object.entries(table)) {
    if (state === false) closed.add(serverName)
  }
  return closed
}

/** 读取账本后返回某工作区被关闭的 server 名单（预览等只读消费方用）。 */
export async function closedServersInWorkspace(cwd: string): Promise<Set<string>> {
  return closedInWorkspace(await readLedger(), cwd)
}

/**
 * 设置「某工作区 × 某 server」的关闭状态。
 * @param cwd - 工作区绝对路径。
 * @param serverName - mcp-client 的 serverName。
 * @param enabled - true = 在该工作区启用（删除记录，回落全局）。
 * @returns 写盘后的账本。
 */
export async function setWorkspaceServer(cwd: string, serverName: string, enabled: boolean): Promise<WorkspaceMcpLedger> {
  const ledger = await readLedger()
  const key = normalizeCwd(cwd)
  const current = { ...ledger.workspaces[key] ?? {} }
  if (enabled) delete current[serverName]
  else current[serverName] = false
  const workspaces = { ...ledger.workspaces }
  if (Object.keys(current).length === 0) delete workspaces[key]
  else workspaces[key] = current
  const next: WorkspaceMcpLedger = { version: 1, workspaces }
  await writeLedger(next)
  return next
}

/** 工作区级工具禁用账本：`{ version: 1, workspaces: { <cwd>: string[] } }`（存被禁用的工具全名）。 */
export interface WorkspaceToolDisableLedger { version: 1; workspaces: Record<string, string[]> }
const TOOL_LEDGER_KEY = 'mcp/workspace-tool-disable'

function normalizeToolDisable(input: unknown): WorkspaceToolDisableLedger {
  const workspaces: Record<string, string[]> = {}
  const raw = (input !== null && typeof input === 'object' ? (input as Record<string, unknown>).workspaces : undefined)
  if (raw !== null && typeof raw === 'object') {
    for (const [cwd, list] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof cwd !== 'string' || cwd.trim() === '') continue
      if (!Array.isArray(list)) continue
      const names = [...new Set(list.filter((n): n is string => typeof n === 'string' && n.startsWith('mcp__') && n.length > 5))]
      workspaces[normalizeCwd(cwd)] = names
    }
  }
  return { version: 1, workspaces }
}

let toolCache: WorkspaceToolDisableLedger | undefined

async function readToolDisableLedger(): Promise<WorkspaceToolDisableLedger> {
  let parsed: unknown
  try { parsed = readPluginDoc(TOOL_LEDGER_KEY) } catch { parsed = undefined }
  toolCache = normalizeToolDisable(parsed)
  return toolCache
}

async function writeToolDisableLedger(next: WorkspaceToolDisableLedger): Promise<void> {
  writePluginDoc(TOOL_LEDGER_KEY, next)
  toolCache = next
}

/** 同步读取当前内存镜像（状态接口用）。 */
export function workspaceToolDisabledLedger(): WorkspaceToolDisableLedger {
  return toolCache ?? { version: 1, workspaces: {} }
}

/** 某工作区被禁用的工具全名集合（预览等只读消费方用）。 */
export async function disabledToolsInWorkspace(cwd: string): Promise<Set<string>> {
  const ledger = toolCache ?? await readToolDisableLedger()
  return new Set(ledger.workspaces[normalizeCwd(cwd)] ?? [])
}

/** 设置「某工作区 × 某工具」的启用/禁用；enabled=true 移除（回落）。 */
export async function setWorkspaceToolDisabled(cwd: string, fullName: string, enabled: boolean): Promise<WorkspaceToolDisableLedger> {
  if (typeof fullName !== 'string' || !fullName.startsWith('mcp__')) throw new Error('fullName must be an mcp__ tool name')
  const ledger = await readToolDisableLedger()
  const key = normalizeCwd(cwd)
  const current = new Set(ledger.workspaces[key] ?? [])
  if (enabled) current.delete(fullName)
  else current.add(fullName)
  const workspaces = { ...ledger.workspaces }
  if (current.size === 0) delete workspaces[key]
  else workspaces[key] = [...current]
  const next: WorkspaceToolDisableLedger = { version: 1, workspaces }
  await writeToolDisableLedger(next)
  return next
}

/** 从工具全名解析 serverName（`mcp__<server>__<tool>`）。 */
function serverOfToolName(fullName: string): string | undefined {
  if (!fullName.startsWith('mcp__')) return undefined
  const rest = fullName.slice('mcp__'.length)
  const separator = rest.indexOf('__')
  return separator <= 0 ? undefined : rest.slice(0, separator)
}

/** 该次装配所属会话的 cwd（0.2.2 的 AssembleContext 只有 scope，无 agent）。 */
function assemblyCwd(ctx: unknown, context: unknown): string | undefined {
  const cwd = cwdOfScope(ctx, context)
  return cwd === undefined ? undefined : normalizeCwd(cwd)
}

/**
 * 安装 agent 作用域 restrict：把该会话工作区被关掉的 Server 工具从模型目录
 * 与 PTC 绑定里一并收窄（0.2.2-rc.1 起装配瀑布流不再携带 tools，这是主路径）。
 * 旧宿主仍保留下面的装配过滤作为兜底。
 * @param ctx - 宿主上下文。
 * @returns 立即同步全部活动 agent 的函数（路由写盘后调用）。
 */
function installAgentRestrictions(ctx: PluginContext): () => void {
  /** agent → 当前 deny 集与 disposer。 */
  const installed = new Map<object, { key: string; dispose: () => void }>()
  let stopped = false
  let timer: ReturnType<typeof setTimeout> | undefined

  const globalNames = (): Set<string> => {
    try {
      const schemas = ctx?.tools?.schemas?.() ?? []
      return new Set((Array.isArray(schemas) ? schemas : [])
        .map((tool: any) => (typeof tool?.name === 'string' ? tool.name : undefined))
        .filter((name: string | undefined): name is string => name !== undefined))
    } catch {
      return new Set()
    }
  }

  const sync = (agent: any): void => {
    if (stopped || agent === null || typeof agent !== 'object' || agent.ctx === undefined) return
    const ledger = cache
    const cwd = agent?.session?.header?.cwd
    const hasCwd = typeof cwd === 'string' && cwd.trim() !== ''
    const key = hasCwd ? normalizeCwd(cwd) : ''
    const closed = ledger !== undefined && hasCwd ? closedInWorkspace(ledger, key) : new Set<string>()
    const disabledTools = hasCwd
      ? new Set<string>((toolCache ?? { version: 1, workspaces: {} }).workspaces[key] ?? [])
      : new Set<string>()
    const tools = agent.ctx.get?.('tools')
    if (typeof tools?.restrict !== 'function') return
    const names = globalNames()
    const deny = closed.size === 0 && disabledTools.size === 0
      ? []
      : [...names].filter((name) => {
          const serverName = serverOfToolName(name)
          return disabledTools.has(name) || (serverName !== undefined && closed.has(serverName))
        })
    const denyKey = deny.join('\u0000')
    const current = installed.get(agent)
    if (current?.key === denyKey) return
    if (current !== undefined) {
      installed.delete(agent)
      try { current.dispose() } catch { /* 已被宿主回收 */ }
    }
    if (deny.length === 0) return
    try {
      installed.set(agent, { key: denyKey, dispose: tools.restrict({ deny }) })
    } catch (error) {
      // 作用域内注册（预设自带行）会被 restrict 拒绝：逐名尝试，跳过那部分。
      const disposers: Array<() => void> = []
      for (const name of deny) {
        try { disposers.push(tools.restrict({ deny: [name] })) } catch { /* 作用域内名字：装配兜底 */ }
      }
      if (disposers.length > 0) {
        installed.set(agent, {
          key: denyKey,
          dispose: () => { for (const dispose of disposers) { try { dispose() } catch { /* 已释放 */ } } },
        })
      } else {
        ctx.logger?.warn?.(`[mcp-workspace-scope] restrict 拒绝全部工作区 deny：${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }

  const syncAll = (): void => {
    for (const agent of [...installed.keys()]) sync(agent)
    try {
      const list = optionalService<any>(ctx, 'agents')?.list?.()
      for (const agent of Array.isArray(list) ? list : []) sync(agent)
    } catch { /* agents 服务缺席 */ }
  }

  ctx.effect(() => {
    const offCreated = ctx.on?.('agent/created', ({ agent }: any) => { sync(agent) })
    const offDisposed = ctx.on?.('agent/disposed', ({ agent }: any) => {
      const current = installed.get(agent)
      if (current === undefined) return
      installed.delete(agent)
      try { current.dispose() } catch { /* 已释放 */ }
    })
    const offTools = ctx.on?.('tools/change', () => {
      if (timer !== undefined) clearTimeout(timer)
      timer = setTimeout(() => { timer = undefined; if (!stopped) syncAll() }, 300)
    })
    syncAll()
    return () => {
      stopped = true
      if (timer !== undefined) clearTimeout(timer)
      try { offCreated?.() } catch { /* 已卸载 */ }
      try { offDisposed?.() } catch { /* 已卸载 */ }
      try { offTools?.() } catch { /* 已卸载 */ }
      for (const current of installed.values()) { try { current.dispose() } catch { /* 已释放 */ } }
      installed.clear()
    }
  }, 'triad: mcp workspace scope restrictions')

  return syncAll
}

/**
 * 安装装配过滤：在该工作区的会话里剔除被关掉的 Server 的工具。
 *
 * `{ global: true }` 才能收到每个 agent 的装配（waterfall 按作用域派发）。
 * 0.2.2-rc.1 起 `assembly.tools` 不存在，本过滤器退化为无操作；主路径改为
 * `installAgentRestrictions` 的 agent 作用域 restrict。
 * @param ctx - 宿主上下文。
 */
function installAssembleFilter(ctx: PluginContext): void {
  ctx.effect(() => ctx.on(
    'system-prompt/assemble',
    (
      assembly: PromptAssemblyLike,
      context: unknown,
      next: () => Promise<unknown>,
    ): Promise<unknown> => {
      const ledger = cache
      const toolLedger = toolCache
      const noClose = ledger === undefined || Object.keys(ledger.workspaces).length === 0
      const noTools = toolLedger === undefined || Object.keys(toolLedger.workspaces).length === 0
      // 快通道：没有任何工作区记录时零开销放行。
      if ((noClose && noTools) || !Array.isArray(assembly?.tools)) {
        return next()
      }
      const cwd = assemblyCwd(ctx, context)
      if (cwd === undefined) return next()
      const closed = ledger === undefined ? new Set<string>() : closedInWorkspace(ledger, cwd)
      const disabledTools = new Set<string>((toolLedger ?? { version: 1, workspaces: {} }).workspaces[cwd] ?? [])
      if (closed.size === 0 && disabledTools.size === 0) return next()
      for (let index = assembly.tools.length - 1; index >= 0; index -= 1) {
        const name = assembly.tools[index]?.name
        if (typeof name !== 'string') continue
        const serverName = serverOfToolName(name)
        if (disabledTools.has(name) || (serverName !== undefined && closed.has(serverName))) assembly.tools.splice(index, 1)
      }
      return next()
    },
    { global: true },
  ), 'triad: mcp workspace scope filter')
}

/** 路由前缀（与其它 MCP 路由并列）。 */
const ROUTE_PREFIX = '/api/triad/mcp-workspace-scope'

function json(res: any, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  res.end(JSON.stringify(body))
}

/** 读请求体（带上限）。 */
async function readBody(req: any): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.length
    if (size > 64 * 1024) throw new Error('body too large')
    chunks.push(buffer)
  }
  if (chunks.length === 0) return {}
  const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'))
  return parsed !== null && typeof parsed === 'object' ? parsed as Record<string, unknown> : {}
}

/** 处理一条请求；`onChanged` 在账本写盘后触发 agent 作用域重算。 */
async function handle(ctx: PluginContext, req: any, res: any, onChanged?: () => void): Promise<void> {
  const trust = requireTrustedRequest(ctx, req)
  if (!trust.ok) {
    rejectUntrusted(res, trust)
    return
  }
  const url = new URL(req.url ?? '/', 'http://localhost')
  const rest = url.pathname.slice(ROUTE_PREFIX.length)
  const method = req.method ?? 'GET'
  try {
    if (method === 'GET' && (rest === '' || rest === '/status')) {
      const ledger = await readLedger()
      const cwd = url.searchParams.get('cwd')
      const toolLedger = toolCache ?? { version: 1, workspaces: {} }
      json(res, 200, {
        ok: true,
        workspaces: ledger.workspaces,
        workspaceToolDisabled: toolLedger.workspaces,
        ...cwd === null || cwd.trim() === '' ? {} : {
          closed: [...closedInWorkspace(ledger, cwd.trim())],
          toolDisabled: [...(toolLedger.workspaces[normalizeCwd(cwd.trim())] ?? [])],
        },
      })
      return
    }
    const match = /^\/workspace\/(.+)\/servers\/([^/]+)$/.exec(rest)
    if (method === 'PUT' && match !== null) {
      const cwd = decodeURIComponent(match[1]!)
      const serverName = decodeURIComponent(match[2]!)
      const body = await readBody(req)
      const enabled = body.enabled
      if (typeof enabled !== 'boolean') throw new Error('enabled must be a boolean')
      if (cwd.trim() === '' || serverName.trim() === '') throw new Error('cwd and serverName are required')
      const ledger = await setWorkspaceServer(cwd, serverName, enabled)
      onChanged?.()
      json(res, 200, { ok: true, cwd: normalizeCwd(cwd), serverName, enabled, workspaces: ledger.workspaces })
      return
    }
    const matchTools = /^\/workspace\/(.+)\/tools$/.exec(rest)
    if (method === 'PUT' && matchTools !== null) {
      const cwd = decodeURIComponent(matchTools[1]!)
      const body = await readBody(req)
      const fullName = body.name
      const enabled = body.enabled
      if (typeof fullName !== 'string') throw new Error('name (mcp__ tool) is required')
      if (typeof enabled !== 'boolean') throw new Error('enabled must be a boolean')
      const next = await setWorkspaceToolDisabled(cwd, fullName, enabled)
      onChanged?.()
      json(res, 200, { ok: true, cwd: normalizeCwd(cwd), name: fullName, enabled, workspaceToolDisabled: next.workspaces })
      return
    }
    json(res, 404, { error: `no route for ${method} ${rest}` })
  } catch (error) {
    json(res, 400, { error: error instanceof Error ? error.message : String(error) })
  }
}

/**
 * 挂载工作区级 MCP 关闭：路由 + 装配过滤。
 * @param ctx - 宿主上下文。
 */
export function applyMcpWorkspaceScope(ctx: PluginContext): void {
  const syncAgents = installAgentRestrictions(ctx)
  const resync = (): void => {
    syncAgents()
    for (const agent of liveAgents(ctx)) void syncAgentWorkspace(ctx, agent)
  }
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: ROUTE_PREFIX,
    handler: (req: any, res: any) => { void handle(ctx, req, res, resync) },
  }), 'triad: mcp workspace scope routes')
  // 先把账本读进内存，装配 / restrict 的快通道才成立（第一次读盘放在挂载期）。
  void Promise.all([readLedger(), readToolDisableLedger()]).then(() => syncAgents()).catch(() => {})
  installAssembleFilter(ctx)
  installWorkspaceMounts(ctx)
}

/* ── 工作区专属 MCP 行：按 agent/session 作用域挂载 ───────────────────── */

const MCP_CLIENT_MODULE = '@deepseek-ai/dsh-mcp-client'

/** 一个 agent 的工作区挂载记录。 */
interface WorkspaceMountRecord {
  cwd: string
  state: 'pending' | 'mounting' | 'mounted' | 'failed' | 'empty'
  key: string
  rows: Array<{ serverName: string; state: 'pending' | 'mounted' | 'failed'; error?: string }>
  fibers: Fiber[]
  error?: string
}

const workspaceMounts = new WeakMap<object, WorkspaceMountRecord>()
let mountContext: PluginContext | undefined
let mountingPlugin: { namespace: unknown; plugin: any } | undefined

/**
 * 取 mcp-client 的插件模块（共享宿主已加载的同一份模块实例）。
 *
 * 不能 `import '@deepseek-ai/dsh-mcp-client'`：宿主包只发源码，装进 profile
 * 的插件运行时解析不到。Loader 的 entry 在加载后保存 `moduleNamespace`，
 * 直接复用它的导出对象即可拿到带 `inject` / `Config` 的原插件。
 */
async function mcpClientPluginOf(ctx: PluginContext): Promise<any | undefined> {
  if (mountingPlugin !== undefined) return mountingPlugin.plugin
  const loader = optionalService<any>(ctx, 'loader')
  try {
    for (const entry of loader?.entries?.() ?? []) {
      if (entry?.options?.name !== MCP_CLIENT_MODULE) continue
      if (entry.moduleNamespace === undefined) continue
      const plugin = loader.unwrapExports?.(entry.moduleNamespace) ?? entry.moduleNamespace
      if (plugin !== null && (typeof plugin === 'function' || typeof plugin?.apply === 'function')) {
        mountingPlugin = { namespace: entry.moduleNamespace, plugin }
        return plugin
      }
    }
  } catch {
    // loader 视图不可用：尝试 import()。
  }
  try {
    if (typeof loader?.import === 'function') {
      const namespace = await loader.import(MCP_CLIENT_MODULE)
      const plugin = loader.unwrapExports?.(namespace) ?? namespace
      if (plugin !== null && (typeof plugin === 'function' || typeof plugin?.apply === 'function')) {
        mountingPlugin = { namespace, plugin }
        return plugin
      }
    }
  } catch {
    // 没有可复用的 mcp-client 模块：状态保持 pending（不退回全局挂载）。
  }
  return undefined
}

/** 一个 `.mcp.json` 键 → 合法 serverName（非法字符归一为 `_`）。 */
function serverNameOfKey(name: string): string | undefined {
  const cleaned = name.replace(/[^A-Za-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 32)
  return cleaned === '' ? undefined : cleaned
}

/** 把 `.mcp.json` 的条目收敛成 mcp-client 接受的 config（丢弃未知字段）。 */
function mcpClientConfigOf(entry: Record<string, unknown>, serverName: string): Record<string, unknown> {
  const hasUrl = typeof entry.url === 'string' && entry.url !== ''
  const transport = entry.transport === 'streamable-http' || entry.transport === 'stdio'
    ? entry.transport
    : hasUrl ? 'streamable-http' : 'stdio'
  const config: Record<string, unknown> = { serverName, transport }
  const copyNumber = (key: string): void => {
    if (typeof entry[key] === 'number') config[key] = entry[key]
  }
  if (transport === 'stdio') {
    config.command = typeof entry.command === 'string' ? entry.command : ''
    if (Array.isArray(entry.args)) config.args = entry.args.filter((arg): arg is string => typeof arg === 'string')
    if (entry.env !== null && typeof entry.env === 'object' && !Array.isArray(entry.env)) {
      config.env = Object.fromEntries(Object.entries(entry.env as Record<string, unknown>)
        .filter(([, value]) => typeof value === 'string'))
    }
    if (typeof entry.cwd === 'string' && entry.cwd !== '') config.cwd = entry.cwd
  } else {
    config.url = typeof entry.url === 'string' ? entry.url : ''
    if (entry.headers !== null && typeof entry.headers === 'object' && !Array.isArray(entry.headers)) {
      config.headers = Object.fromEntries(Object.entries(entry.headers as Record<string, unknown>)
        .filter(([, value]) => typeof value === 'string'))
    }
  }
  copyNumber('toolCallTimeoutMs')
  copyNumber('startupTimeoutMs')
  copyNumber('closeTimeoutMs')
  return config
}

/** 销毁一个 agent 的全部工作区 MCP fiber。 */
async function disposeWorkspaceMount(agent: object): Promise<void> {
  const record = workspaceMounts.get(agent)
  if (record === undefined) return
  workspaceMounts.delete(agent)
  for (const fiber of record.fibers) {
    try { await fiber.dispose?.() } catch { /* 已由宿主回收 */ }
  }
  record.fibers = []
}

/** 同步一个 agent 的工作区 MCP（cwd 匹配的 `.mcp.json` → agent 作用域实例）。 */
async function syncAgentWorkspace(ctx: PluginContext, agent: any): Promise<void> {
  const cwd = agent?.session?.header?.cwd
  if (typeof cwd !== 'string' || cwd.trim() === '') return
  const keyCwd = normalizeCwd(cwd)
  let rows: WorkspaceRow[]
  try {
    rows = await readWorkspaceRows(keyCwd)
  } catch {
    rows = []
  }
  const key = JSON.stringify(rows.map((row) => [row.serverName, row.config]))
  const previous = workspaceMounts.get(agent)
  if (previous !== undefined && previous.key === key && previous.state !== 'mounting') return
  await disposeWorkspaceMount(agent)

  const record: WorkspaceMountRecord = {
    cwd: keyCwd,
    state: rows.length === 0 ? 'empty' : 'mounting',
    key,
    rows: rows.map((row) => ({ serverName: row.serverName, state: 'pending' })),
    fibers: [],
  }
  workspaceMounts.set(agent, record)
  if (rows.length === 0) return
  const plugin = await mcpClientPluginOf(ctx)
  if (plugin === undefined) {
    record.state = 'pending'
    record.error = 'mcp-client-runtime-unavailable'
    return
  }
  for (const row of rows) {
    const state = record.rows.find((item) => item.serverName === row.serverName)
    try {
      const fiber = await agent.ctx.plugin(plugin, row.config)
      record.fibers.push(fiber)
      if (state !== undefined) state.state = 'mounted'
    } catch (error) {
      if (state !== undefined) {
        state.state = 'failed'
        state.error = error instanceof Error ? error.message : String(error)
      }
    }
  }
  record.state = record.rows.some((item) => item.state === 'failed')
    ? 'failed'
    : record.rows.every((item) => item.state === 'mounted') ? 'mounted' : 'pending'
}

/**
 * 工作区 MCP 的挂载状态（`/api/triad/mcp-status` 的 `workspaceMcp` 字段）。
 * 无会话时固定 `pending`，且没有任何全局实例 —— 不泄漏到别的会话。
 */
export function workspaceMcpMountStatus(): {
  state: 'pending' | 'mounted' | 'failed' | 'empty'
  reason?: string
  agents: Array<{ id: string; cwd: string; state: string; rows: Array<{ serverName: string; state: string; error?: string }>; error?: string }>
} {
  const agents = mountContext === undefined ? [] : liveAgents(mountContext)
  const views = agents.map((agent: any) => {
    const record = workspaceMounts.get(agent)
    return {
      id: typeof agent?.session?.header?.id === 'string' ? agent.session.header.id : '',
      cwd: typeof agent?.session?.header?.cwd === 'string' ? normalizeCwd(agent.session.header.cwd) : '',
      state: record?.state ?? 'pending',
      rows: record?.rows ?? [],
      ...record?.error === undefined ? {} : { error: record.error },
    }
  })
  if (views.length === 0) return { state: 'pending', reason: 'no-session', agents: [] }
  const state = views.some((view) => view.state === 'failed')
    ? 'failed'
    : views.some((view) => view.state === 'mounted') ? 'mounted'
      : views.every((view) => view.state === 'empty') ? 'empty' : 'pending'
  return { state, agents: views }
}

/** 安装按 agent 作用域挂载（无会话不挂、不写全局 loader）。 */
function installWorkspaceMounts(ctx: PluginContext): void {
  mountContext = ctx
  const sync = (agent: any): void => {
    void syncAgentWorkspace(ctx, agent).catch((error) => {
      ctx.logger?.warn?.(`[mcp-workspace-scope] 工作区 MCP 挂载失败: ${error instanceof Error ? error.message : String(error)}`)
    })
  }
  ctx.effect(() => {
    const offCreated = ctx.on?.('agent/created', ({ agent }: any) => { sync(agent) })
    const offDisposed = ctx.on?.('agent/disposed', ({ agent }: any) => { void disposeWorkspaceMount(agent) })
    for (const agent of liveAgents(ctx)) sync(agent)
    return () => {
      try { offCreated?.() } catch { /* 已卸载 */ }
      try { offDisposed?.() } catch { /* 已卸载 */ }
      for (const agent of liveAgents(ctx)) void disposeWorkspaceMount(agent)
    }
  }, 'triad: mcp workspace agent mounts')
}

/** 供状态接口合并：当前账本（同步读内存副本）。 */
export function workspaceMcpLedger(): WorkspaceMcpLedger {
  return cache ?? { version: 1, workspaces: {} }
}

/* ── 工作区专属 MCP 行：`<ws>/.mcp.json` ─────────────────────────── */

/** 一个工作区行定义。 */
interface WorkspaceRow {
  /** 目标工作区绝对路径。 */
  workspace: string
  /** 挂载用 serverName（agent 作用域内唯一即可，不再加全局哈希）。 */
  serverName: string
  /** 收敛后的 mcp-client config。 */
  config: Record<string, unknown>
}

/**
 * 把工作区 `.mcp.json` 转成内部行。
 *
 * `.mcp.json` 是主流 agent 的通用格式：`{ "mcpServers": { <name>: {command|url,…} } }`。
 * 键名直接作为 serverName —— agent 作用域按会话隔离，同名 server 在不同
 * 会话里可以各自存在，不需要再拼全局唯一的路径哈希。
 * @param workspace - 工作区绝对路径。
 * @param text - 文件内容。
 * @returns 行定义列表（非法 JSON/非对象返回空，不让一个坏文件拖垮整轮挂载）。
 */
function parseWorkspaceRows(workspace: string, text: string): WorkspaceRow[] {
  let document: unknown
  try {
    document = JSON.parse(text) as unknown
  } catch {
    return []
  }
  if (document === null || typeof document !== 'object' || Array.isArray(document)) return []
  const servers = (document as { mcpServers?: unknown }).mcpServers
  if (servers === null || typeof servers !== 'object' || Array.isArray(servers)) return []
  const rows: WorkspaceRow[] = []
  for (const [name, raw] of Object.entries(servers as Record<string, unknown>)) {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) continue
    const entry = raw as Record<string, unknown>
    const hasCommand = typeof entry.command === 'string' && entry.command !== ''
    const hasUrl = typeof entry.url === 'string' && entry.url !== ''
    if (!hasCommand && !hasUrl) continue
    const serverName = serverNameOfKey(name)
    if (serverName === undefined) continue
    rows.push({ workspace, serverName, config: mcpClientConfigOf(entry, serverName) })
  }
  return rows
}

/**
 * 读一个工作区的 `.mcp.json`（主流 agent 通用格式）。
 * @param workspace - 工作区绝对路径。
 * @returns 行定义（文件缺失/不可读/格式非法时为空）。
 */
export async function readWorkspaceRows(workspace: string): Promise<WorkspaceRow[]> {
  try {
    const text = await readFile(join(resolve(workspace), '.mcp.json'), 'utf8')
    return parseWorkspaceRows(resolve(workspace), text)
  } catch {
    return []
  }
}

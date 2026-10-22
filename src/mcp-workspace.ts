/**
 * mcp-workspace — 工作区级与全局 `mcps/` 目录里的 MCP Server（host 半身）。
 *
 * 背景：DSH 内核只认 Cordis 组合里的 `@deepseek-ai/dsh-mcp-client` 行，**没有**
 * 「读某个目录下的 mcp.json」这种约定（全仓库 grep `mcps` 零命中）。于是
 * `~/.agents/mcps/`、`<ws>/.dsh/mcps/`、`<ws>/.agents/mcps/` 里放着的配置
 * 一直是死文件。本模块把它们接上：
 *
 *   - **全局层**  `<agentsHome>/mcps/**\/mcp.json`    —— 所有会话可见
 *   - **工作区层** `<ws>/.dsh/mcps/**\/mcp.json`     —— 仅该工作区会话可见
 *                 `<ws>/.agents/mcps/**\/mcp.json`
 *
 * 同一目录下根 `mcp.json` 先读、子目录后读（后写覆盖先写），按 serverName 去重。
 *
 * ## 挂载方式与两条硬约束
 *
 * 1. `dsh-mcp-client` 的 `serverName` 在**注册作用域内唯一**（模块级 WeakMap）。
 *    多个工作区可能配置同名但参数不同的 server（各自 codegraph 指向各自仓库），
 *    所以工作区层的 serverName 一律追加 `<8 位路径哈希>` 后缀（确定性：同一工作区
 *    每次都是同一个名字，工具名因此稳定）。全局层保留原名。
 * 2. agent 的 scope key 已被 preset 常驻 key 绑定，无法再挂项目作用域，因此行统一
 *    挂在 loader 根树（对面板枚举/启停/工具级开关完全复用），「仅本工作区可见」
 *    由 {@link installWorkspaceVisibility} 在 `system-prompt/assemble` 里按会话
 *    cwd 过滤实现。
 *
 * ## 数据来源纪律
 *
 * 配置文件里的 `${VAR}` 占位在挂载时按 `process.env` 展开（不引入 `!!js`：
 * 手工写的 JSON 里没有 YAML 表达式语法）。`cwd` 的相对值按所在工作区解析。
 *
 * 账本：内存表 `mounted`（serverName → entryId），apply 时按 id 前缀回收上一次
 * 进程内挂载的行，避免 HMR 后重复。
 */

import { readFile, readdir, stat } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { watch, type FSWatcher } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import { agentsHome } from './home-paths.ts'
import { loopbackAllowed, writeJsonResponse } from './mcp-recommended.ts'
import { parseMcpPaste, rowsToPatchYaml } from './mcp-paste.ts'
import { workspaceDirs } from './skill-roots.ts'

/** dsh-mcp-client 的包名（与 loader 行里的 name 精确匹配）。 */
const MCP_CLIENT_MODULE = '@deepseek-ai/dsh-mcp-client'
const ROUTE_PREFIX = '/api/triad/mcp-workspace'
/** 项目/全局 mcps 目录名（与既有约定一致）。 */
const MCPS_DIR = 'mcps'
/** 挂载行 id 前缀：apply 时据此回收上次进程留下的行。 */
const ROW_PREFIX = 'wsmcp-'
/** 热更新去抖。 */
const RESCAN_DEBOUNCE_MS = 250
const MAX_BODY_BYTES = 256 * 1024

/** 运行时服务在类型上放宽（与其它 host 模块同惯例）。 */
type PluginContext = any

/** 一个 server 的归属层。 */
export type McpScope = 'global' | 'workspace'

/** 扫描出的一个 server 配置（值已展开环境变量）。 */
export interface ScannedServer {
  /** 配置文件里写的名字（未加后缀）。 */
  name: string
  scope: McpScope
  /** 工作区根（仅 workspace 层）。 */
  workspace?: string
  /** 实际挂载用的 serverName（workspace 层带路径哈希后缀）。 */
  serverName: string
  transport: 'stdio' | 'streamable-http'
  /** 摘要：stdio 显示 command + args，http 显示 url。 */
  summary: string
  /** 来源文件（面板展示「这条从哪来」）。 */
  file: string
}

/** 一次扫描的结果。 */
export interface ScanResult {
  servers: ScannedServer[]
  /** 解析失败的文件与原因（面板提示用）。 */
  errors: Array<{ file: string; message: string }>
}

/* ── 路径与命名 ──────────────────────────────────────────────────────────── */

/** djb2 路径哈希（确定性；同一路径永远同一个后缀）。 */
function pathHash(path: string): string {
  let hash = 5381
  for (let index = 0; index < path.length; index += 1) hash = ((hash << 5) + hash + path.charCodeAt(index)) >>> 0
  return hash.toString(16).padStart(8, '0')
}

/**
 * 工作区层 serverName：原名 + 8 位路径哈希后缀，收敛到 32 字符以内。
 * 原名过长时截断尾部，保留头部可读性。
 * @param workspace - 工作区根绝对路径。
 * @param name - 配置文件里的原名。
 * @returns 挂载用 serverName。
 */
export function scopedServerName(workspace: string, name: string): string {
  return `${name.slice(0, 23)}-${pathHash(workspace)}`
}

/** 全局层 mcps 根。 */
export function globalMcpsDir(): string {
  return join(agentsHome(), MCPS_DIR)
}

/** 一个工作区的 mcps 根（`.dsh` 先于 `.agents`，与内核技能根同序）。 */
export function workspaceMcpsDirs(workspace: string): string[] {
  return [join(workspace, '.dsh', MCPS_DIR), join(workspace, '.agents', MCPS_DIR)]
}

/* ── 扫描 ────────────────────────────────────────────────────────────────── */

async function isDirectory(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory()
  } catch {
    return false
  }
}

/** 递归收集 `dir` 下所有子目录（含自身）的 mcp.json：根目录文件在前、子目录按名字序。 */
async function collectMcpFiles(dir: string, out: string[]): Promise<void> {
  try {
    await stat(join(dir, 'mcp.json'))
    out.push(join(dir, 'mcp.json'))
  } catch {
    /* 该层没有 mcp.json：只往下找 */
  }
  let names: string[] = []
  try {
    names = (await readdir(dir, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()
  } catch {
    return
  }
  for (const name of names) await collectMcpFiles(join(dir, name), out)
}

/** 把配置里的 `${VAR}` 展开成进程环境变量（未定义时留空串，不抛错）。 */
function expandEnv(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (_match, name: string) => process.env[name] ?? '')
  }
  if (Array.isArray(value)) return value.map(expandEnv)
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) out[key] = expandEnv(item)
    return out
  }
  return value
}

/** 读一个 mcp.json 并解析成 server 列表（失败记进 errors，不中断整轮扫描）。 */
async function readMcpFile(file: string, errors: ScanResult['errors']): Promise<Array<{ name: string; config: Record<string, unknown> }>> {
  let text: string
  try {
    text = await readFile(file, 'utf8')
  } catch (error) {
    errors.push({ file, message: `读取失败：${error instanceof Error ? error.message : String(error)}` })
    return []
  }
  const outcome = parseMcpPaste('json', text)
  for (const message of outcome.errors) errors.push({ file, message })
  return outcome.rows.map((row) => ({
    name: String(row.config.serverName ?? ''),
    config: expandEnv(row.config) as Record<string, unknown>,
  }))
}

/** 把一行 config 归一成面板摘要。 */
function summaryOf(config: Record<string, unknown>): string {
  const transport = config.transport === 'streamable-http' ? 'streamable-http' : 'stdio'
  if (transport === 'streamable-http') return typeof config.url === 'string' ? config.url : ''
  const command = typeof config.command === 'string' ? config.command : ''
  const args = Array.isArray(config.args) ? config.args.filter((item): item is string => typeof item === 'string') : []
  return args.length === 0 ? command : `${command} ${args.join(' ')}`
}

/**
 * 扫描一个 mcps 根（根目录 mcp.json 先、子目录后，同名后者覆盖前者）。
 * @param dir - mcps 根目录。
 * @param scope - 归属层。
 * @param workspace - 工作区根（全局层省略）。
 * @param errors - 错误收集数组。
 * @returns 该根下的 server 列表（已按 serverName 去重）。
 */
async function scanMcpsDir(
  dir: string,
  scope: McpScope,
  workspace: string | undefined,
  errors: ScanResult['errors'],
): Promise<ScannedServer[]> {
  if (!(await isDirectory(dir))) return []
  const files: string[] = []
  await collectMcpFiles(dir, files)
  /** serverName → server：后读覆盖先读。 */
  const merged = new Map<string, ScannedServer>()
  for (const file of files) {
    for (const entry of await readMcpFile(file, errors)) {
      if (entry.name === '') continue
      const transport = entry.config.transport === 'streamable-http' ? 'streamable-http' : 'stdio'
      // stdio 的 cwd 相对值按配置文件所在目录解析：配置写 `"cwd": "."` 时
      // 语义应是「这个 server 配置所在的项目」，而不是 DSH 进程的启动目录。
      if (transport === 'stdio' && typeof entry.config.cwd === 'string' && entry.config.cwd.trim() !== '') {
        entry.config.cwd = resolve(join(file, '..'), entry.config.cwd)
      }
      merged.set(entry.name, {
        name: entry.name,
        scope,
        ...workspace === undefined ? {} : { workspace },
        serverName: scope === 'workspace' && workspace !== undefined
          ? scopedServerName(workspace, entry.name)
          : entry.name,
        transport,
        summary: summaryOf(entry.config),
        file,
      })
    }
  }
  return [...merged.values()]
}

/**
 * 扫描全局层 + 所有给定工作区层。
 * @param workspaces - 工作区根绝对路径列表（空数组表示只扫全局层）。
 * @returns 全部 server 与解析错误。
 */
export async function scanAll(workspaces: readonly string[]): Promise<ScanResult> {
  const errors: ScanResult['errors'] = []
  const servers: ScannedServer[] = []
  servers.push(...await scanMcpsDir(globalMcpsDir(), 'global', undefined, errors))
  for (const workspace of workspaces) {
    for (const dir of workspaceMcpsDirs(workspace)) {
      servers.push(...await scanMcpsDir(dir, 'workspace', workspace, errors))
    }
  }
  return { servers, errors }
}

/* ── 挂载状态 ────────────────────────────────────────────────────────────── */

/** serverName → 挂载信息（进程内；apply 时按 id 前缀回收残留行）。 */
interface MountedRow {
  entryId: string
  scope: McpScope
  workspace?: string
  /** 配置文件的 serverName（未加后缀）。 */
  name: string
  config: Record<string, unknown>
}

/** 一条被跳过的 server（与组合里既有行同名，不再重复挂载）。 */
interface SkippedRow {
  serverName: string
  name: string
  scope: McpScope
  workspace?: string
  /** 跳过原因（面板展示）。 */
  reason: 'composition'
}

const mounted = new Map<string, MountedRow>()
/** 本轮被跳过的 server（答案在组成里已有同名 mcp-client 行）。 */
let skipped: SkippedRow[] = []
/** 工作区根 → 当前扫描到的 server 列表（状态接口与可见性过滤读它）。 */
const workspaceScan = new Map<string, ScannedServer[]>()
/** 全局层当前扫描结果。 */
let globalScan: ScannedServer[] = []
/** 最近一次扫描错误。 */
let scanErrors: ScanResult['errors'] = []
/** 每个被监视的 mcps 根 → watcher。 */
const watchers = new Map<string, FSWatcher>()
/** 去抖定时器。 */
let refreshTimer: NodeJS.Timeout | undefined

/** 该 serverName 的归属工作区（全局层返回 undefined）。 */
export function workspaceOfServer(serverName: string): string | undefined {
  return mounted.get(serverName)?.workspace
}

/** 当前挂载的全部行（状态接口用）。 */
export function mountedRows(): Array<{ serverName: string; scope: McpScope; workspace?: string; name: string }> {
  return [...mounted.entries()].map(([serverName, row]) => ({
    serverName,
    scope: row.scope,
    ...row.workspace === undefined ? {} : { workspace: row.workspace },
    name: row.name,
  }))
}

/** 面板状态：全局层 + 每个工作区层的 server 清单与错误。 */
export function workspaceMcpStatus(): {
  global: ScannedServer[]
  workspaces: Array<{ root: string; servers: ScannedServer[] }>
  errors: ScanResult['errors']
  mounted: ReturnType<typeof mountedRows>
  /** 与组合里既有 mcp-client 行同名、已让位不再重复挂载的那些。 */
  skipped: SkippedRow[]
  dirs: { global: string; workspace: (root: string) => string[] }
} {
  return {
    global: globalScan,
    workspaces: [...workspaceScan.entries()].map(([root, servers]) => ({ root, servers })),
    errors: scanErrors,
    mounted: mountedRows(),
    skipped: [...skipped],
    dirs: { global: globalMcpsDir(), workspace: workspaceMcpsDirs },
  }
}

/* ── 挂载 / 卸载 ─────────────────────────────────────────────────────────── */

/** 一行要写进 loader 的完整配置（去掉面板内部字段）。 */
function rowOptions(server: ScannedServer, config: Record<string, unknown>): Record<string, unknown> {
  return { id: `${ROW_PREFIX}${server.serverName}`, name: MCP_CLIENT_MODULE, config }
}

/** 配置是否变化（JSON 序列化足够判等：结构简单、无函数值）。 */
function configChanged(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) !== JSON.stringify(right)
}

/**
 * 组合里既有的 mcp-client serverName（排除本模块自己挂的行）。
 *
 * 同名不能再挂：`dsh-mcp-client` 的 serverName 在作用域内唯一，重复注册会让
 * 后挂的那个 fiber 直接激活失败并持续报错。组合（profile patch / 预设行）是
 * 用户显式配置的权威来源，目录里的配置遇到同名一律让位并如实上报。
 */
function compositionServerNames(loader: PluginContext): Set<string> {
  const names = new Set<string>()
  if (loader?.entries === undefined) return names
  try {
    for (const entry of loader.entries()) {
      const options = entry?.options ?? {}
      const id = typeof options.id === 'string' ? options.id : ''
      if (id.startsWith(ROW_PREFIX)) continue
      if (options.name !== MCP_CLIENT_MODULE) continue
      const serverName = options.config?.serverName
      if (typeof serverName === 'string' && serverName !== '') names.add(serverName)
    }
  } catch {
    /* 读不到就当作没有既有行：宁可尝试挂载，也不静默丢弃用户配置 */
  }
  return names
}

/**
 * 按扫描结果同步 loader 行：删掉不再需要的、更新变化了的、新建缺的。
 * @param ctx - 宿主上下文（取 loader）。
 * @param servers - 本轮想要的 server 列表。
 * @param configs - serverName → 完整 config。
 */
async function syncRows(
  ctx: PluginContext,
  servers: readonly ScannedServer[],
  configs: Map<string, Record<string, unknown>>,
): Promise<void> {
  const loader = ctx.loader
  if (loader === undefined) return
  const taken = compositionServerNames(loader)
  const wanted = new Map<string, ScannedServer>()
  const nextSkipped: SkippedRow[] = []
  for (const server of servers) {
    if (taken.has(server.serverName)) {
      nextSkipped.push({
        serverName: server.serverName,
        name: server.name,
        scope: server.scope,
        ...server.workspace === undefined ? {} : { workspace: server.workspace },
        reason: 'composition',
      })
      continue
    }
    wanted.set(server.serverName, server)
  }
  skipped = nextSkipped
  for (const [serverName, row] of [...mounted]) {
    if (wanted.has(serverName)) continue
    try {
      loader.remove(row.entryId)
    } catch {
      /* 行已随 HMR 消失：忽略 */
    }
    mounted.delete(serverName)
  }
  for (const [serverName, server] of wanted) {
    const base = configs.get(serverName)
    if (base === undefined) continue
    // 行里的 serverName 必须是**挂载用**的那个（工作区层带路径哈希后缀），
    // 否则 mcp-client 会按原名注册：工具名与 mounted 表对不上，可见性过滤
    // 与工具级开关都会归错组。
    const config = { ...base, serverName }
    const existing = mounted.get(serverName)
    if (existing !== undefined) {
      if (!configChanged(existing.config, config)) continue
      try {
        await loader.update(existing.entryId, rowOptions(server, config))
        existing.config = config
      } catch (error) {
        ctx.logger?.warn?.(`[mcp-workspace] 更新 ${serverName} 失败: ${messageOf(error)}`)
      }
      continue
    }
    try {
      const entry = await loader.create(rowOptions(server, config))
      const entryId = typeof entry?.id === 'string' ? entry.id : rowOptions(server, config).id as string
      mounted.set(serverName, { entryId, scope: server.scope, ...server.workspace === undefined ? {} : { workspace: server.workspace }, name: server.name, config })
    } catch (error) {
      ctx.logger?.warn?.(`[mcp-workspace] 挂载 ${serverName} 失败: ${messageOf(error)}`)
    }
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * 重扫并同步：全局层 + 给定工作区层。
 * @param ctx - 宿主上下文。
 * @param workspaces - 工作区根列表。
 */
async function refresh(ctx: PluginContext, workspaces: readonly string[]): Promise<void> {
  const result = await scanAll(workspaces)
  scanErrors = result.errors
  globalScan = result.servers.filter((server) => server.scope === 'global')
  workspaceScan.clear()
  for (const workspace of workspaces) {
    workspaceScan.set(workspace, result.servers.filter((server) => server.workspace === workspace))
  }
  // 完整 config 从扫描结果重建（ScannedServer 只带摘要，配置正文由 readMcpFile 现读）。
  const configs = new Map<string, Record<string, unknown>>()
  for (const server of result.servers) {
    const parsed = await readConfigOf(server)
    if (parsed !== undefined) configs.set(server.serverName, parsed)
  }
  await syncRows(ctx, result.servers, configs)
}

/** 从一个 server 的来源文件里取它的完整 config（按原名匹配）。 */
async function readConfigOf(server: ScannedServer): Promise<Record<string, unknown> | undefined> {
  const errors: ScanResult['errors'] = []
  for (const entry of await readMcpFile(server.file, errors)) {
    if (entry.name !== server.name) continue
    const transport = entry.config.transport === 'streamable-http' ? 'streamable-http' : 'stdio'
    if (transport === 'stdio' && typeof entry.config.cwd === 'string' && entry.config.cwd.trim() !== '') {
      entry.config.cwd = resolve(join(server.file, '..'), entry.config.cwd)
    }
    return entry.config
  }
  return undefined
}

/* ── 可见性过滤 ──────────────────────────────────────────────────────────── */

interface PromptAssemblyLike {
  tools?: Array<{ name?: unknown }>
}

/** 从工具全名解析 serverName（按已挂载名字最长匹配，避免前缀连带）。 */
function serverOfTool(fullName: string): string | undefined {
  if (!fullName.startsWith('mcp__')) return undefined
  let best: string | undefined
  for (const serverName of mounted.keys()) {
    if (!fullName.startsWith(`mcp__${serverName}__`)) continue
    if (best === undefined || serverName.length > best.length) best = serverName
  }
  if (best !== undefined) return best
  const rest = fullName.slice('mcp__'.length)
  const separator = rest.indexOf('__')
  return separator <= 0 ? undefined : rest.slice(0, separator)
}

/** 该次装配所属的会话 cwd（取不到返回 undefined）。 */
function assemblyCwd(context: unknown): string | undefined {
  const cwd = (context as { agent?: { session?: { header?: { cwd?: unknown } } } } | undefined)
    ?.agent?.session?.header?.cwd
  return typeof cwd === 'string' && cwd.trim() !== '' ? resolve(cwd) : undefined
}

/**
 * 常开过滤：工作区层挂载的工具只在该工作区会话的装配结果里出现。
 * 全局层与非本插件的工具一律放行。无挂载行时零开销短路。
 */
function installWorkspaceVisibility(ctx: PluginContext): void {
  ctx.effect(() => ctx.on(
    'system-prompt/assemble',
    (assembly: PromptAssemblyLike, context: unknown, next: () => Promise<unknown>): Promise<unknown> => {
      if (mounted.size === 0 || !Array.isArray(assembly?.tools)) return next()
      const cwd = assemblyCwd(context)
      for (let index = assembly.tools.length - 1; index >= 0; index -= 1) {
        const name = assembly.tools[index]?.name
        if (typeof name !== 'string') continue
        const serverName = serverOfTool(name)
        if (serverName === undefined) continue
        const owner = mounted.get(serverName)?.workspace
        if (owner === undefined) continue
        if (cwd !== undefined && cwd.toLowerCase() === owner.toLowerCase()) continue
        assembly.tools.splice(index, 1)
      }
      return next()
    },
    { global: true },
  ), 'mcp-workspace: visibility')
}

/* ── 文件监视 ────────────────────────────────────────────────────────────── */

/** 监视一批 mcps 根（已监视的跳过；不存在的不监视 —— 目录后来才建的情况由会话切换时的重扫覆盖）。 */
async function watchDirs(ctx: PluginContext, dirs: readonly string[], workspaces: () => readonly string[]): Promise<void> {
  for (const dir of dirs) {
    if (watchers.has(dir)) continue
    if (!(await isDirectory(dir))) continue
    try {
      const watcher = watch(dir, { recursive: true }, () => {
        if (refreshTimer !== undefined) clearTimeout(refreshTimer)
        refreshTimer = setTimeout(() => {
          refreshTimer = undefined
          void refresh(ctx, workspaces()).catch((error: unknown) => {
            ctx.logger?.warn?.(`[mcp-workspace] 重扫失败: ${messageOf(error)}`)
          })
        }, RESCAN_DEBOUNCE_MS)
      })
      // unref：插件不该攥住宿主的事件循环。宿主进程本来就有大量其它句柄，
      // 事件照常投递；而一个 apply 后不再 dispose 的嵌入方（测试、脚本）不该
      // 因为这份监视器而永不退出。
      watcher.unref?.()
      watcher.on('error', () => { watchers.delete(dir) })
      watchers.set(dir, watcher)
    } catch (error) {
      ctx.logger?.warn?.(`[mcp-workspace] 无法监视 ${dir}: ${messageOf(error)}`)
    }
  }
}

/* ── 路由 ────────────────────────────────────────────────────────────────── */

function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolvePromise, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(new Error('request body too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      if (chunks.length === 0) { resolvePromise({}); return }
      try {
        resolvePromise(JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>)
      } catch {
        reject(new Error('invalid JSON body'))
      }
    })
    req.on('error', reject)
  })
}

/** 当前工作区列表（路由与监视共用：每次现算，活动会话变化即时反映）。 */
async function currentWorkspaces(ctx: PluginContext): Promise<string[]> {
  try {
    return await workspaceDirs(ctx)
  } catch {
    return []
  }
}

/** 处理一条 /api/triad/mcp-workspace 请求。 */
async function handle(ctx: PluginContext, req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!loopbackAllowed(req)) {
    writeJsonResponse(res, 403, { error: 'loopback-only' })
    return
  }
  const url = new URL(req.url ?? '/', 'http://localhost')
  const rest = url.pathname.slice(ROUTE_PREFIX.length)
  const method = req.method ?? 'GET'
  try {
    if (method === 'GET' && (rest === '' || rest === '/status')) {
      // 注意别覆盖 status 自己的 `workspaces`（那是「每个工作区扫到什么」）；
      // 活动工作区目录列表另起一个键。
      writeJsonResponse(res, 200, { ok: true, ...workspaceMcpStatus(), activeWorkspaces: await currentWorkspaces(ctx) })
      return
    }
    if (method === 'POST' && rest === '/refresh') {
      const workspaces = await currentWorkspaces(ctx)
      await refresh(ctx, workspaces)
      writeJsonResponse(res, 200, { ok: true, ...workspaceMcpStatus() })
      return
    }
    // POST /apply —— 把某层扫描到的 server 写成 profile patch 片段（可复制到全局层）
    if (method === 'POST' && rest === '/apply') {
      const body = await readJsonBody(req)
      const scope = body.scope === 'global' ? 'global' : 'workspace'
      const workspace = typeof body.workspace === 'string' ? body.workspace : ''
      const source = scope === 'global' ? globalScan : workspaceScan.get(workspace) ?? []
      const names = Array.isArray(body.serverNames)
        ? body.serverNames.filter((item): item is string => typeof item === 'string')
        : source.map((server) => server.name)
      const rows = []
      for (const server of source) {
        if (!names.includes(server.name)) continue
        const config = await readConfigOf(server)
        if (config === undefined) continue
        rows.push({ id: `mcp-${server.name}`, name: MCP_CLIENT_MODULE, config: { ...config, serverName: server.name } })
      }
      if (rows.length === 0) {
        writeJsonResponse(res, 400, { ok: false, error: '没有可导出的 server（先刷新一次扫描）' })
        return
      }
      writeJsonResponse(res, 200, { ok: true, yaml: rowsToPatchYaml(rows), count: rows.length })
      return
    }
    writeJsonResponse(res, 404, { error: `no route for ${method} ${rest}` })
  } catch (error) {
    writeJsonResponse(res, 400, { ok: false, error: messageOf(error) })
  }
}

/* ── 挂载入口 ────────────────────────────────────────────────────────────── */

/**
 * 挂载工作区 / 全局 mcps 目录的 MCP 运行时。
 *
 * 顺序：回收上次进程留下的行 → 首轮扫描挂载 → 装可见性过滤 → 装会话钩子
 * （新会话进新工作区时重扫并加监视）→ 注册路由。
 * @param ctx - 宿主上下文。
 */
export function applyWorkspaceMcp(ctx: Context): void {
  const self = ctx as unknown as PluginContext
  // 上次进程（HMR 前）留下的行：按 id 前缀回收，避免重复挂载。
  try {
    const loader = self.loader
    if (loader?.entries !== undefined) {
      for (const entry of loader.entries()) {
        const id = typeof entry?.options?.id === 'string' ? entry.options.id : ''
        if (!id.startsWith(ROW_PREFIX)) continue
        try { loader.remove(id) } catch { /* 行已失效 */ }
      }
    }
  } catch {
    /* 没有 loader 服务（裸组装）：不挂载，仅保留路由 */
  }

  ctx.effect(() => {
    let disposed = false
    const boot = async (): Promise<void> => {
      const workspaces = await currentWorkspaces(self)
      if (disposed) return
      await refresh(self, workspaces)
      await watchDirs(self, [globalMcpsDir(), ...workspaces.flatMap((workspace) => workspaceMcpsDirs(workspace))],
        () => { void currentWorkspaces(self) })
    }
    void boot().catch((error: unknown) => {
      self.logger?.warn?.(`[mcp-workspace] 首轮扫描失败: ${messageOf(error)}`)
    })
    // 会话进入工作区：补扫 + 补监视（新工作区第一次出现时才会真的动文件）。
    const off = self.on?.('agent/created', () => {
      void (async () => {
        const workspaces = await currentWorkspaces(self)
        if (disposed) return
        await refresh(self, workspaces)
        await watchDirs(self, workspaces.flatMap((workspace) => workspaceMcpsDirs(workspace)),
          () => { void currentWorkspaces(self) })
      })().catch((error: unknown) => {
        self.logger?.warn?.(`[mcp-workspace] 会话重扫失败: ${messageOf(error)}`)
      })
    })
    return () => {
      disposed = true
      off?.()
      if (refreshTimer !== undefined) { clearTimeout(refreshTimer); refreshTimer = undefined }
      for (const watcher of watchers.values()) watcher.close()
      watchers.clear()
      const loader = self.loader
      for (const [serverName, row] of [...mounted]) {
        try { loader?.remove?.(row.entryId) } catch { /* 已失效 */ }
        mounted.delete(serverName)
      }
    }
  }, 'mcp-workspace: runtime')

  installWorkspaceVisibility(self)

  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: ROUTE_PREFIX,
    handler: (req: IncomingMessage, res: ServerResponse) => {
      void handle(self, req, res)
    },
  }), 'mcp-workspace: routes')
}

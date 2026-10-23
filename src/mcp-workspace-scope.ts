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

import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { agentsHome } from './home-paths.ts'

/** 运行时上下文在类型上放宽（与其它 host 模块同惯例）。 */
type PluginContext = any

const LEDGER_FILE = '.workspace-mcp.json'
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

function ledgerPath(): string {
  return join(agentsHome(), 'skills', LEDGER_FILE)
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
      workspaces[resolve(cwd)] = entries
    }
  }
  return { version: 1, workspaces }
}

/** 进程内账本（写盘后立即刷新，装配时零 I/O）。 */
let cache: WorkspaceMcpLedger | undefined

/** 读账本（首次读盘，之后走内存；缺失/损坏视为空）。 */
async function readLedger(): Promise<WorkspaceMcpLedger> {
  if (cache !== undefined) return cache
  let parsed: unknown
  try {
    parsed = JSON.parse(await readFile(ledgerPath(), 'utf8')) as unknown
  } catch {
    parsed = undefined
  }
  cache = normalize(parsed)
  return cache
}

/** 原子写账本。 */
async function writeLedger(next: WorkspaceMcpLedger): Promise<void> {
  const target = ledgerPath()
  const temp = `${target}.tmp`
  await mkdir(join(agentsHome(), 'skills'), { recursive: true })
  await writeFile(temp, `${JSON.stringify(next, null, 2)}\n`, 'utf8')
  // Windows：目标被别的句柄短暂占用时 rename 会 EPERM。先删旧文件再改名，
  // 失败就退化为直接写（内容仍完整，只是失去原子性）。
  try {
    await rename(temp, target)
  } catch {
    await rm(target, { force: true })
    try {
      await rename(temp, target)
    } catch {
      await writeFile(target, `${JSON.stringify(next, null, 2)}\n`, 'utf8')
      await rm(temp, { force: true })
    }
  }
  cache = next
}

/** 某个工作区被关闭的 server 名单。 */
export function closedInWorkspace(ledger: WorkspaceMcpLedger, cwd: string): Set<string> {
  const table = ledger.workspaces[resolve(cwd)]
  if (table === undefined) return new Set()
  const closed = new Set<string>()
  for (const [serverName, state] of Object.entries(table)) {
    if (state === false) closed.add(serverName)
  }
  return closed
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
  const key = resolve(cwd)
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

/** 从工具全名解析 serverName（`mcp__<server>__<tool>`）。 */
function serverOfToolName(fullName: string): string | undefined {
  if (!fullName.startsWith('mcp__')) return undefined
  const rest = fullName.slice('mcp__'.length)
  const separator = rest.indexOf('__')
  return separator <= 0 ? undefined : rest.slice(0, separator)
}

/** 该次装配所属会话的 cwd（取不到返回 undefined）。 */
function assemblyCwd(context: unknown): string | undefined {
  const cwd = (context as { agent?: { session?: { header?: { cwd?: unknown } } } } | undefined)
    ?.agent?.session?.header?.cwd
  return typeof cwd === 'string' && cwd.trim() !== '' ? resolve(cwd) : undefined
}

/**
 * 安装装配过滤：在该工作区的会话里剔除被关掉的 Server 的工具。
 *
 * `{ global: true }` 才能收到每个 agent 的装配（waterfall 按作用域派发）。
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
      // 快通道：没有任何工作区记录时零开销放行。
      if (ledger === undefined || Object.keys(ledger.workspaces).length === 0 || !Array.isArray(assembly?.tools)) {
        return next()
      }
      const cwd = assemblyCwd(context)
      if (cwd === undefined) return next()
      const closed = closedInWorkspace(ledger, cwd)
      if (closed.size === 0) return next()
      for (let index = assembly.tools.length - 1; index >= 0; index -= 1) {
        const name = assembly.tools[index]?.name
        if (typeof name !== 'string') continue
        const serverName = serverOfToolName(name)
        if (serverName !== undefined && closed.has(serverName)) assembly.tools.splice(index, 1)
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

/** 只允许本机回环访问（与其它路由一致）。 */
function loopback(req: any): boolean {
  const address = req?.socket?.remoteAddress
  return typeof address === 'string'
    && (address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1')
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

/** 处理一条请求。 */
async function handle(ctx: PluginContext, req: any, res: any): Promise<void> {
  if (!loopback(req)) {
    json(res, 403, { error: 'loopback-only' })
    return
  }
  const url = new URL(req.url ?? '/', 'http://localhost')
  const rest = url.pathname.slice(ROUTE_PREFIX.length)
  const method = req.method ?? 'GET'
  try {
    if (method === 'GET' && (rest === '' || rest === '/status')) {
      const ledger = await readLedger()
      const cwd = url.searchParams.get('cwd')
      json(res, 200, {
        ok: true,
        workspaces: ledger.workspaces,
        ...cwd === null || cwd.trim() === '' ? {} : { closed: [...closedInWorkspace(ledger, cwd.trim())] },
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
      json(res, 200, { ok: true, cwd: resolve(cwd), serverName, enabled, workspaces: ledger.workspaces })
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
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: ROUTE_PREFIX,
    handler: (req: any, res: any) => { void handle(ctx, req, res) },
  }), 'triad: mcp workspace scope routes')
  // 先把账本读进内存，装配时的快通道才成立（第一次读盘放在挂载期）。
  void readLedger().catch(() => {})
  installAssembleFilter(ctx)
}

/** 供状态接口合并：当前账本（同步读内存副本）。 */
export function workspaceMcpLedger(): WorkspaceMcpLedger {
  return cache ?? { version: 1, workspaces: {} }
}

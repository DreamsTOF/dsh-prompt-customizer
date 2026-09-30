/**
 * mcp-presets — 预设专属 MCP Server（L2a，host 半身）。
 *
 * 0.1.7 起预设不再是磁盘上的组合文件（旧模型：`~/.dsh/.agent-presets/<id>/agent.cordis.yml`，
 * `agentPresets.list()` 带 `path`/`trust`），而是一条声明式插件行：
 *
 *   - id: preset-standard
 *     name: '@deepseek-ai/dsh-agent-preset'
 *     config:
 *       id: standard
 *       plugins:
 *         - id: mcp-xyz
 *           name: '@deepseek-ai/dsh-mcp-client'
 *           config: { serverName: xyz, transport: stdio, command: npx, args: [...] }
 *
 * 预设自带的 mcp-client 行写在 `config.plugins` 里，因此该行的工具、服务器指令、
 * 资源 provider 都跟随预设作用域注册，只对该预设（及其子代理）可见；与全局同
 * serverName 时天然构成完整覆盖（scoped 注册遮蔽同名全局）。
 *
 * 本模块做四件事：
 *   1. 定位预设行（`configEditor.entries()` 的可寻址行优先，回落
 *      `ctx.loader.entries()`）；行不在场时回落 `agentPresets.readDocument()`
 *      的声明 YAML（只读展示）；
 *   2. 从 `config.plugins` 解析 mcp-client 行（serverName / transport 摘要）；
 *   3. 增删行走 `configEditor.edit()` —— DSH 自己负责原子写、YAML 保形、
 *      `!!js` 标签、Loader 热重载，失败还会把文件与组合一起回滚；本插件不再
 *      手改任何文件，也不再需要自备备份；
 *   4. 路由 `POST/DELETE /api/triad/mcp-presets/*`（POST 接受粘贴的
 *      JSON / DSH 原生 YAML，见 mcp-paste.ts）。
 *
 * 写入代价（面板已提示）：profile patch 覆盖的是整份 `config.plugins`，首次改动
 * 后该预设不再跟随 DSH 升级更新 —— 与 DSH 自带编辑器的语义一致。
 */

import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import { loopbackAllowed, writeJsonResponse } from './mcp-recommended.ts'
import {
  envTemplateOf, parseMcpPaste, pasteFieldsOf, serversToRows,
  type McpRowConfig, type McpServerConfig,
} from './mcp-paste.ts'

const ROUTE_PREFIX = '/api/triad/mcp-presets'
/** 预设声明行的模块名（0.1.7 起预设是普通插件行）。 */
const AGENT_PRESET_MODULE = '@deepseek-ai/dsh-agent-preset'
/** mcp-client 模块名（与 config.plugins 里的 `name` 精确匹配）。 */
const MCP_CLIENT_MODULE = '@deepseek-ai/dsh-mcp-client'
const MAX_BODY_BYTES = 256 * 1024

/** 运行时才存在的服务在类型上放宽。 */
type PluginContext = any

/** 一条预设自带的 mcp-client 行（解析结果）。 */
export interface PresetMcpRow {
  /** 行 id（config.plugins 里的 entry id）。 */
  entryId: string
  serverName: string
  transport: string
  /** 摘要：stdio 显示 command，http 显示 url。 */
  summary: string
  /**
   * 该 server 的工具（由 mcp-status 富化）。预设自带的工具注册在预设作用域
   * 里，插件层（全局视图）看不到 —— 来自该预设的活动 agent，没有活动 agent
   * 时回退到工具名单缓存。
   */
  tools?: Array<{ name: string; description: string }>
  /**
   * 实际注册的工具数（由 mcp-status 富化，**不含**名单缓存）：
   * 面板据此判断该行是否已连上并注册完工具（自动等待的判据）。
   */
  registeredCount?: number
}

/** 一条预设行的定位结果。 */
export interface PresetRowRef {
  /** Loader entry（configEditor 的可寻址行，或 loader 的全量 entry）。 */
  entry: unknown
  /** profile patch 写入器；缺席 = 该行只读（没有 configEditor）。 */
  editor: PresetRowEditor | undefined
  /** 该行当前生效的 config（含 plugins）。 */
  config: Record<string, unknown>
}

/** configEditor.edit 的最小契约（只用到这一处）。 */
interface PresetRowEditor {
  edit(
    entry: unknown,
    change: (current: Record<string, unknown>, inherited: Record<string, unknown>) => Record<string, unknown>,
  ): Promise<void>
}

/** 是否 config-editor 认的 `!!js` 表达式包装（单键 map）。 */
function isJsExprData(value: unknown): value is { __jsExpr: string } {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value as object).length === 1
    && typeof (value as { __jsExpr?: unknown }).__jsExpr === 'string'
}

/** 标量取值文本：普通字符串原样，`!!js` 表达式取表达式原文。 */
function scalarText(value: unknown): string {
  if (typeof value === 'string') return value
  return isJsExprData(value) ? value.__jsExpr : ''
}

/** 一条 entry 的 config（非对象/数组时给空对象）。 */
function configOf(entry: unknown): Record<string, unknown> {
  const config = (entry as { options?: { config?: unknown } } | undefined)?.options?.config
  return config !== null && typeof config === 'object' && !Array.isArray(config)
    ? config as Record<string, unknown>
    : {}
}

/** 一条 entry 声明的预设 id（不是预设声明行 / 没有 config.id 时返回空串）。 */
export function presetIdOf(entry: unknown): string {
  const options = (entry as { options?: { name?: unknown } } | undefined)?.options
  if (options?.name !== AGENT_PRESET_MODULE) return ''
  const id = configOf(entry).id
  return typeof id === 'string' ? id : ''
}

/**
 * 定位一条预设行。
 *
 * `configEditor.entries()` 给的是 profile 里 id 唯一、可寻址的行（也正是
 * `configEditor.edit()` 接受的行），因此优先用它；没有 configEditor（非 profile
 * 组合）时退到 `ctx.loader.entries()` 的全量视图，此时只能读不能写。
 */
export function presetRowOf(ctx: PluginContext, presetId: string): PresetRowRef | undefined {
  const editor = ctx.get?.('configEditor')
  if (typeof editor?.entries === 'function') {
    try {
      for (const entry of editor.entries()) {
        if (presetIdOf(entry) !== presetId) continue
        return { entry, editor, config: configOf(entry) }
      }
    } catch {
      // 可寻址行读取失败：继续尝试只读的 loader 视图。
    }
  }
  const entries = ctx.loader?.entries?.()
  if (entries !== undefined) {
    for (const entry of entries) {
      if (presetIdOf(entry) !== presetId) continue
      return { entry, editor: undefined, config: configOf(entry) }
    }
  }
  return undefined
}

/**
 * 从 `config.plugins` 数据里挑出 mcp-client 行（组行内的子行同样收进来）。
 * 与旧模型的 `parseMcpRows()` 等价，只是数据源从 YAML 文本换成了行数据。
 */
export function presetMcpRowsOf(plugins: unknown): PresetMcpRow[] {
  const rows: PresetMcpRow[] = []
  const walk = (list: unknown): void => {
    for (const item of Array.isArray(list) ? list : []) {
      if (item === null || typeof item !== 'object' || Array.isArray(item)) continue
      const row = item as Record<string, unknown>
      if (row.name === MCP_CLIENT_MODULE) {
        const config = row.config !== null && typeof row.config === 'object' && !Array.isArray(row.config)
          ? row.config as Record<string, unknown>
          : {}
        const serverName = typeof config.serverName === 'string' ? config.serverName : ''
        if (serverName !== '') {
          const transport = config.transport === 'streamable-http' ? 'streamable-http' : 'stdio'
          rows.push({
            entryId: typeof row.id === 'string' && row.id !== '' ? row.id : serverName,
            serverName,
            transport,
            summary: scalarText(transport === 'stdio' ? config.command : config.url),
          })
        }
      }
      // 组行：config 是子行数组。
      if (Array.isArray(row.config)) walk(row.config)
    }
  }
  walk(plugins)
  return rows
}

/** config.plugins 里已占用的行 id（任意层级，避免重名）。 */
export function presetIdsOf(plugins: unknown): Set<string> {
  const ids = new Set<string>()
  const walk = (list: unknown): void => {
    for (const item of Array.isArray(list) ? list : []) {
      if (item === null || typeof item !== 'object' || Array.isArray(item)) continue
      const row = item as Record<string, unknown>
      if (typeof row.id === 'string' && row.id !== '') ids.add(row.id)
      if (Array.isArray(row.config)) walk(row.config)
    }
  }
  walk(plugins)
  return ids
}

/**
 * 删掉指定 serverName 的 mcp-client 行（任意层级），返回新数组。
 *
 * 只删这一条 mcp-client 行本身；预设声明行的其余字段（id / order / 其它子行）
 * 由调用方原样保留。命中标记用于区分「没删到」与「删完变空」。
 */
export function withoutMcpServer(plugins: unknown, serverName: string): { plugins: unknown[]; removed: boolean } {
  let removed = false
  const filter = (list: unknown): unknown[] => (Array.isArray(list) ? list : []).flatMap((item): unknown[] => {
    if (item === null || typeof item !== 'object' || Array.isArray(item)) return [item]
    const row = item as Record<string, unknown>
    if (row.name === MCP_CLIENT_MODULE) {
      const config = row.config
      if (config !== null && typeof config === 'object' && !Array.isArray(config)
        && (config as Record<string, unknown>).serverName === serverName) {
        removed = true
        return []
      }
      return [item]
    }
    if (Array.isArray(row.config)) return [{ ...row, config: filter(row.config) }]
    return [item]
  })
  return { plugins: filter(plugins), removed }
}

/**
 * 面板行 → config.plugins 里的 entry 数据。
 *
 * 面板产出的 `${VAR}` 占位是 `{ __js: '表达式' }`（见 mcp-paste.ts），而
 * config-editor 认的是单键 map `{ __jsExpr: '表达式' }`（写回时还原成 `!!js`
 * 标签、读文档时也不会泄漏到 YAML），这里做一次包装转换。
 */
export function toPresetRowData(row: McpRowConfig): Record<string, unknown> {
  return { id: row.id, name: row.name, config: toConfigData(row.config) }
}

/** 值 → config 数据：`{ __js }` 占位转 `{ __jsExpr }` 包装，其余原样。 */
function toConfigData(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(toConfigData)
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (typeof record.__js === 'string') return { __jsExpr: record.__js }
    const out: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(record)) out[key] = toConfigData(item)
    return out
  }
  // 字符串里的 `${VAR}` 占位：与 YAML 路径一致地转成 `!!js` 模板（数据模型里
  // 没有 `!!js` 文本可写，必须直接给 `{ __jsExpr }` 包装）。
  if (typeof value === 'string') {
    const template = envTemplateOf(value)
    if (template !== undefined) return { __jsExpr: template.__js }
  }
  return value
}

/**
 * 该预设的存储来源（面板提示用）。
 *
 *  - `system`：行由 DSH 随安装的 bundle 声明、profile patch 里还没有覆盖
 *    —— 写入会在 profile 层覆盖它的整份 config.plugins（此后不再跟随升级）；
 *  - `user`：profile patch 已经覆盖过这条行（内容已经是本地定制的）。
 */
export function presetTrustOf(ctx: PluginContext, presetId: string): 'system' | 'user' {
  const editor = ctx.get?.('configEditor')
  if (typeof editor?.configuration !== 'function') return 'system'
  try {
    const rows = editor.configuration()
    for (const row of Array.isArray(rows) ? rows : []) {
      if (presetIdOf((row as { entry?: unknown })?.entry) !== presetId) continue
      const override = (row as { override?: unknown }).override
      const hasOverride = override !== null && typeof override === 'object' && Object.keys(override as object).length > 0
      return hasOverride ? 'user' : 'system'
    }
  } catch {
    // 读取失败按「随安装」处理（提示更保守）。
  }
  return 'system'
}

/**
 * 预设声明文本（`agentPresets.readDocument()`）：只读展示用。
 *
 * 0.1.7 的 readDocument 把该预设的 `config.plugins` 渲染成 entry-list YAML
 * （`!!js` 条件按声明原文给出），行不在 loader 视图里时靠它兜底。
 */
export async function compositionTextOf(ctx: PluginContext, presetId: string): Promise<{ content: string } | undefined> {
  const presets = ctx.get?.('agentPresets')
  if (presets?.readDocument === undefined) return undefined
  try {
    const doc = await presets.readDocument(presetId)
    if (doc !== null && typeof doc === 'object' && typeof doc.content === 'string') return { content: doc.content }
  } catch {
    // 服务没有该预设 / 声明不可读：无可读来源。
  }
  return undefined
}

/** 某预设自带的 mcp-client 行（含 trust，供面板提示存储位置）。 */
export async function listPresetServers(ctx: PluginContext, presetId: string): Promise<{ trust: string; rows: PresetMcpRow[] } | undefined> {
  const ref = presetRowOf(ctx, presetId)
  if (ref !== undefined) {
    return { trust: presetTrustOf(ctx, presetId), rows: presetMcpRowsOf(ref.config.plugins) }
  }
  const found = await compositionTextOf(ctx, presetId)
  if (found === undefined) return undefined
  return { trust: 'user', rows: parseLegacyYamlRows(found.content) }
}

/**
 * 声明 YAML 的兜底解析：逐行扫描所有 `@deepseek-ai/dsh-mcp-client` 行。
 * 仅在预设行不在 loader 视图里（动态注册的预设等）时用到。
 */
function parseLegacyYamlRows(content: string): PresetMcpRow[] {
  const lines = content.split(/\r?\n/)
  const rows: PresetMcpRow[] = []
  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i].trimStart()
    if (!trimmed.startsWith('- id:')) continue
    const idMatch = /^- id:\s*([A-Za-z0-9_-]+)/.exec(trimmed)
    if (idMatch === null) continue
    let isMcp = false
    let serverName = ''
    let transport = ''
    let summary = ''
    for (let j = i + 1; j < lines.length; j += 1) {
      const line = lines[j]
      if (line.length === 0) continue
      if (!/^[ \t]/.test(line)) break
      const t = line.trimStart()
      if (!isMcp && t.startsWith('name:') && line.includes(MCP_CLIENT_MODULE)) isMcp = true
      if (!isMcp) continue
      if (serverName === '' && t.startsWith('serverName:')) {
        const m = /^serverName:\s*["']?([A-Za-z0-9_-]{1,32})["']?\s*$/.exec(t)
        if (m !== null) serverName = m[1]!
      }
      if (transport === '' && t.startsWith('transport:')) {
        const m = /^transport:\s*["']?([a-z-]+)["']?\s*$/.exec(t)
        if (m !== null) transport = m[1]!
      }
      if (summary === '' && (t.startsWith('command:') || t.startsWith('url:'))) {
        summary = t.replace(/^(command|url):\s*/, '').replace(/^["']|["']$/g, '')
      }
    }
    if (!isMcp || serverName === '') continue
    rows.push({ entryId: idMatch[1]!, serverName, transport: transport === '' ? 'stdio' : transport, summary })
  }
  return rows
}

/** 全部预设的自带 MCP 行（键为 preset id）。 */
export async function collectPresetServers(ctx: PluginContext): Promise<Record<string, PresetMcpRow[]>> {
  const presets = ctx.get?.('agentPresets')
  const out: Record<string, PresetMcpRow[]> = {}
  if (presets?.list === undefined) return out
  let roster: unknown
  try {
    roster = await presets.list()
  } catch {
    return out
  }
  for (const row of Array.isArray(roster) ? roster : []) {
    const id = String((row as { id?: unknown })?.id ?? '')
    if (id === '') continue
    const found = await listPresetServers(ctx, id)
    if (found !== undefined) out[id] = found.rows
  }
  return out
}

/** preset id 形状（[a-z0-9-]，与 agent-preset-registry 的 id 规则一致）。 */
function isPresetId(value: string): boolean {
  return /^[a-z0-9][a-z0-9-]*$/.test(value)
}

/** serverName 形状（与 dsh-mcp-client 的校验一致）。 */
function isServerName(value: string): boolean {
  return /^[A-Za-z0-9_-]{1,32}$/.test(value)
}

/** 解析 JSON 请求体（带上限）。 */
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

/** 从请求体收敛一份 mcp-client 配置（旧的单条结构化入参，形状对齐 dsh-mcp-client）。 */
function configFromBody(body: Record<string, unknown>): { ok: true; value: McpServerConfig } | { ok: false; error: string } {
  const serverName = typeof body.serverName === 'string' ? body.serverName.trim() : ''
  if (!isServerName(serverName)) return { ok: false, error: 'serverName must match [A-Za-z0-9_-]{1,32}' }
  const transport = body.transport === 'streamable-http' ? 'streamable-http' : body.transport === 'stdio' ? 'stdio' : ''
  if (transport === '') return { ok: false, error: 'transport must be "stdio" or "streamable-http"' }
  if (transport === 'stdio') {
    const command = typeof body.command === 'string' ? body.command.trim() : ''
    if (command === '') return { ok: false, error: 'stdio requires a non-empty command' }
    const args = Array.isArray(body.args) ? body.args.filter((item): item is string => typeof item === 'string') : undefined
    const env = body.env !== null && typeof body.env === 'object' && !Array.isArray(body.env)
      ? Object.fromEntries(Object.entries(body.env as Record<string, unknown>).filter(([, v]) => typeof v === 'string') as Array<[string, string]>)
      : undefined
    const cwd = typeof body.cwd === 'string' ? body.cwd : undefined
    return { ok: true, value: { serverName, transport, command, args, env, cwd } }
  }
  const url = typeof body.url === 'string' ? body.url.trim() : ''
  if (url === '') return { ok: false, error: 'streamable-http requires a non-empty url' }
  const headers = body.headers !== null && typeof body.headers === 'object' && !Array.isArray(body.headers)
    ? Object.fromEntries(Object.entries(body.headers as Record<string, unknown>).filter(([, v]) => typeof v === 'string') as Array<[string, string]>)
    : undefined
  return { ok: true, value: { serverName, transport, url, headers } }
}

/**
 * 把整份 `config.plugins` 写回预设行。
 *
 * 走 DSH 的 configEditor：它负责 profile patch 的原子写、`!!js` 标签保形、
 * Loader 协调与失败回滚，并保证「没有 home patch / 命令行 overlay 覆盖这条行」
 * 才落盘（否则抛错，调用方原样转给面板）。
 */
async function writePresetPlugins(ref: PresetRowRef, plugins: unknown[]): Promise<void> {
  const editor = ref.editor
  if (editor === undefined) throw new Error('preset row is not writable in this composition')
  await editor.edit(ref.entry, current => ({ ...current, plugins }))
}

/** 处理一条 /api/triad/mcp-presets 请求。 */
async function handle(ctx: PluginContext, req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!loopbackAllowed(req)) {
    writeJsonResponse(res, 403, { error: 'loopback-only' })
    return
  }
  const url = new URL(req.url ?? '/', 'http://localhost')
  const rest = url.pathname.slice(ROUTE_PREFIX.length)
  const method = req.method ?? 'GET'
  try {
    const matchPost = /^\/([^/]+)\/servers$/.exec(rest)
    if (method === 'POST' && matchPost !== null) {
      const presetId = decodeURIComponent(matchPost[1]!)
      if (!isPresetId(presetId)) throw new Error(`invalid preset id ${JSON.stringify(presetId)}`)
      // 先读请求体再定位预设行：请求形状错误立即返回，不必等组合读取。
      const body = await readJsonBody(req)
      const ref = presetRowOf(ctx, presetId)
      if (ref === undefined) {
        writeJsonResponse(res, 404, {
          ok: false,
          error: 'preset-not-found',
          hint: `预设 "${presetId}" 不在 agentPresets 名单里（或没有可读的声明）`,
        })
        return
      }
      if (ref.editor === undefined) {
        writeJsonResponse(res, 409, {
          ok: false,
          error: 'preset-not-editable',
          hint: '当前组合没有 configEditor / 该预设行 id 不唯一，无法写回 profile patch',
        })
        return
      }
      // 两种入参：粘贴文本 { format, text }（推荐，多条、重名跳过）
      // 或旧的单条结构化字段（单条、重名报错）。
      const bulk = typeof body.text === 'string'
      let outcome: { rows: McpRowConfig[]; errors: string[]; warnings: string[] }
      if (bulk) {
        const { format, text } = pasteFieldsOf(body)
        outcome = parseMcpPaste(format, text)
      } else {
        const legacy = configFromBody(body)
        if (!legacy.ok) throw new Error(legacy.error)
        outcome = { rows: serversToRows({ [legacy.value.serverName]: legacy.value }), errors: [], warnings: [] }
      }
      if (outcome.errors.length > 0) {
        writeJsonResponse(res, 400, { ok: false, errors: outcome.errors, warnings: outcome.warnings })
        return
      }
      if (outcome.rows.length === 0) {
        writeJsonResponse(res, 400, { ok: false, error: '未解析出任何 MCP server' })
        return
      }
      const plugins = ref.config.plugins
      const existing = presetMcpRowsOf(plugins)
      const takenServers = new Set(existing.map(row => row.serverName))
      const takenIds = presetIdsOf(plugins)
      const added: string[] = []
      const skipped: string[] = []
      const fresh: McpRowConfig[] = []
      for (const row of outcome.rows) {
        const serverName = String(row.config.serverName ?? '')
        if (takenServers.has(serverName)) {
          if (!bulk) throw new Error(`serverName ${JSON.stringify(serverName)} already exists in preset "${presetId}"`)
          skipped.push(serverName)
          continue
        }
        let id = row.id
        let suffix = 2
        while (takenIds.has(id)) { id = `${row.id}-${suffix}`; suffix += 1 }
        takenIds.add(id)
        takenServers.add(serverName)
        added.push(serverName)
        fresh.push({ ...row, id })
      }
      if (fresh.length > 0) {
        const next = [...(Array.isArray(plugins) ? plugins : []), ...fresh.map(toPresetRowData)]
        await writePresetPlugins(ref, next)
      }
      writeJsonResponse(res, 200, { ok: true, preset: presetId, added, skipped, warnings: outcome.warnings })
      return
    }
    const matchDelete = /^\/([^/]+)\/servers\/([^/]+)$/.exec(rest)
    if (method === 'DELETE' && matchDelete !== null) {
      const presetId = decodeURIComponent(matchDelete[1]!)
      const serverName = decodeURIComponent(matchDelete[2]!)
      if (!isPresetId(presetId)) throw new Error(`invalid preset id ${JSON.stringify(presetId)}`)
      if (!isServerName(serverName)) throw new Error(`invalid serverName ${JSON.stringify(serverName)}`)
      const ref = presetRowOf(ctx, presetId)
      if (ref === undefined) {
        writeJsonResponse(res, 404, { ok: false, error: 'preset-not-found' })
        return
      }
      if (ref.editor === undefined) {
        writeJsonResponse(res, 409, {
          ok: false,
          error: 'preset-not-editable',
          hint: '当前组合没有 configEditor / 该预设行 id 不唯一，无法写回 profile patch',
        })
        return
      }
      const result = withoutMcpServer(ref.config.plugins, serverName)
      if (!result.removed) {
        throw new Error(`no mcp-client row for serverName ${JSON.stringify(serverName)} in preset "${presetId}"`)
      }
      await writePresetPlugins(ref, result.plugins)
      writeJsonResponse(res, 200, { ok: true, preset: presetId, serverName })
      return
    }
    writeJsonResponse(res, 404, { error: `no route for ${method} ${rest}` })
  } catch (error) {
    writeJsonResponse(res, 400, { ok: false, error: error instanceof Error ? error.message : String(error) })
  }
}

/** 注册 /api/triad/mcp-presets/* 路由。 */
export function applyPresetServers(ctx: Context): void {
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: ROUTE_PREFIX,
    handler: (req: IncomingMessage, res: ServerResponse) => {
      void handle(ctx as PluginContext, req, res)
    },
  }), 'triad: mcp-presets routes')
}

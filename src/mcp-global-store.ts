/**
 * mcp-global-store — 全局 MCP Server 的磁盘账本（`.dsh/mcps`）。
 *
 * 持久化位置：`$DSH_HOME/mcps/<serverName>/mcp.json`，内容遵循主流
 * `.mcp.json` 形态：
 *
 *   { "mcpServers": { "<serverName>": { "type": "stdio", "command": "...", "args": [] } } }
 *
 * 启停意图单独放在 `$DSH_HOME/mcps/.dsh-prompt-customizer.json`，避免往标准
 * `.mcp.json` 里塞非标准字段。
 *
 * 为什么不再写宿主 profile 配置：DSH 0.2.2 的 `cordis.yml` 每次启动都会重写为
 * 空数组；全局 MCP 作为插件自管的磁盘数据，启动后由插件挂到 root Loader 内存树。
 *
 * 读取兼容旧 `mcps/**\/mcp.json` 约定：递归扫描根目录与子目录；同名 server
 * 以 canonical 的 `<serverName>/mcp.json` 优先。用户手写的其他文件只读
 * （返回行带 `owned: false`），面板不会改写它们。
 *
 * 旧 2.1.3 SQLite 账本（`mcp/global-servers/<profile>`）在首次读取时迁移到
 * 磁盘，迁移成功后删除旧 doc 键，避免同一份配置双写。
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { readPluginDoc, delDoc, openDb, pluginDbFile } from '../vendor/prompt-customizer/db.js'
import { dshHome } from './home-paths.ts'
import { isServerName } from './ids.ts'
import { MCP_CLIENT_NAME, parseMcpPaste, rowsToJsonText, type McpRowConfig } from './mcp-paste.ts'

/** 全局 MCP 上限（与 mcp-tool-disable 的 server 上限一致）。 */
export const MAX_GLOBAL_MCP_SERVERS = 200

/** 一条全局 MCP Server。 */
export interface StoredGlobalMcpServer {
  /** Loader 行 id（root tree 内唯一）。 */
  id: string
  /** 与 mcp-paste 的 row.config 同形。 */
  config: Record<string, unknown>
  /** 持久化的启停意图。 */
  disabled: boolean
  /** 来源文件绝对路径；读取时计算，不写回文件。 */
  file?: string
  /** 是否为本插件 canonical 文件（可编辑）；旧 mcps 文件为 false。 */
  owned?: boolean
}

/** 一个全局 MCP 账本快照。 */
export interface GlobalMcpStore {
  version: 1
  servers: StoredGlobalMcpServer[]
}

/** CPU 生成的 entry id 允许的字符（DSH 的 id 本身允许 `:`，这里只收窄自己生成的）。 */
const ENTRY_ID_PATTERN = /^[A-Za-z0-9_:-]{1,128}$/
const CANONICAL_FILE = 'mcp.json'
const META_FILE = '.dsh-prompt-customizer.json'

interface GlobalMcpMeta {
  version: 1
  disabled: string[]
}

function plainObject(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}

/** 全局 mcps 根目录。 */
export function globalMcpsRoot(): string {
  return join(dshHome(), 'mcps')
}

/** 某台 server 的 canonical 文件路径。 */
export function globalMcpServerFile(serverName: string): string {
  return join(globalMcpsRoot(), serverName, CANONICAL_FILE)
}

function globalMcpMetaFile(): string {
  return join(globalMcpsRoot(), META_FILE)
}

/** 旧 SQLite 账本键；只用于一次性迁移。 */
export function globalMcpStoreKey(profileName: string): string {
  return `mcp/global-servers/${encodeURIComponent(profileName === '' ? 'default' : profileName)}`
}

/** 从路径反推 canonical serverName；不是 `<root>/<name>/mcp.json` 形态返回 undefined。 */
function canonicalOwnerOf(file: string): string | undefined {
  const root = globalMcpsRoot()
  const normalizedFile = file.replace(/\\/g, '/')
  const normalizedRoot = root.replace(/\\/g, '/').replace(/\/$/, '')
  if (!normalizedFile.startsWith(`${normalizedRoot}/`)) return undefined
  const parts = normalizedFile.slice(normalizedRoot.length + 1).split('/')
  if (parts.length !== 2 || parts[1] !== CANONICAL_FILE) return undefined
  return isServerName(parts[0]) ? parts[0] : undefined
}

/** 深度优先收集 `dir` 下的 mcp.json（不跟随符号链接）。 */
function collectMcpFiles(dir: string, out: string[]): void {
  if (!existsSync(dir)) return
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    if (entry.name === META_FILE || entry.name === '.gitignore') continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      collectMcpFiles(path, out)
    } else if (entry.isFile() && entry.name === CANONICAL_FILE) {
      out.push(path)
    }
  }
}

function readMeta(): GlobalMcpMeta {
  const file = globalMcpMetaFile()
  try {
    const raw = JSON.parse(readFileSync(file, 'utf8')) as unknown
    const record = plainObject(raw)
    const list = Array.isArray(record?.disabled) ? record.disabled : []
    const disabled = [...new Set(list.filter((name): name is string => isServerName(name)))]
    return { version: 1, disabled }
  } catch {
    return { version: 1, disabled: [] }
  }
}

function atomicWrite(file: string, text: string): void {
  mkdirSync(dirname(file), { recursive: true })
  const temp = `${file}.${process.pid}.${Math.random().toString(16).slice(2)}.tmp`
  try {
    writeFileSync(temp, text, 'utf8')
    let delay = 10
    for (let attempt = 0; ; attempt += 1) {
      try {
        renameSync(temp, file)
        return
      } catch (error) {
        const code = (error as NodeJS.ErrnoException | null)?.code
        if (process.platform !== 'win32' || (code !== 'EACCES' && code !== 'EBUSY' && code !== 'EPERM') || attempt >= 6) throw error
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delay)
        delay = Math.min(delay * 2, 120)
      }
    }
  } finally {
    try { rmSync(temp, { force: true }) } catch { /* 临时文件清理失败不掩盖主错误 */ }
  }
}

function writeMeta(disabled: ReadonlySet<string>): void {
  const names = [...disabled].filter(isServerName).sort()
  atomicWrite(globalMcpMetaFile(), `${JSON.stringify({ version: 1, disabled: names }, null, 2)}\n`)
}

/** `{ __js: expr }` → 原始 `${VAR}` 文本；无法还原时原样返回 expr。 */
function plainTemplate(expr: string): string {
  const match = /^`([\s\S]*)`$/.exec(expr)
  if (match === null) return expr
  let body = match[1]
  try {
    body = body.replace(/\$\{process\.env\.([A-Za-z_][A-Za-z0-9_]*)(?:\s*\?\?\s*("(?:[^"\\]|\\.)*"))?\}/g, (_all, name: string, fallback: string | undefined) => {
      if (fallback === undefined) return `\${${name}}`
      const parsed = JSON.parse(fallback) as unknown
      return `\${${name}:-${String(parsed)}}`
    })
  } catch {
    return expr
  }
  return body.replace(/\\([\\`'])/g, '$1')
}

/** 内部配置（可能含 `{ __js }`）→ 可写进标准 `.mcp.json` 的普通 JSON。 */
function plainConfigValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(plainConfigValue)
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (typeof record.__js === 'string' && Object.keys(record).length === 1) return plainTemplate(record.__js)
    const out: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(record)) out[key] = plainConfigValue(item)
    return out
  }
  return value
}

function canonicalText(serverName: string, config: Record<string, unknown>): string {
  const plain = plainConfigValue(config) as Record<string, unknown>
  const row: McpRowConfig = {
    id: `mcp-${serverName}`,
    name: MCP_CLIENT_NAME,
    config: { ...plain, serverName },
  }
  return rowsToJsonText([row])
}

function writeCanonical(row: StoredGlobalMcpServer): void {
  const serverName = String(row.config.serverName ?? '')
  if (!isServerName(serverName)) throw new Error(`invalid global MCP serverName: ${serverName}`)
  atomicWrite(globalMcpServerFile(serverName), canonicalText(serverName, row.config))
}

function removeCanonical(serverName: string): void {
  const file = globalMcpServerFile(serverName)
  if (!existsSync(file)) return
  rmSync(file, { force: true })
  const dir = dirname(file)
  try {
    if (readdirSync(dir).length === 0) rmSync(dir, { recursive: true, force: true })
  } catch {
    // 目录非空或已被删除：保留空目录无害。
  }
}

/** 解析一个 mcp.json，返回行；坏文件返回空。 */
function rowsOfFile(file: string): McpRowConfig[] {
  try {
    const outcome = parseMcpPaste('json', readFileSync(file, 'utf8'))
    return outcome.errors.length === 0 ? outcome.rows : []
  } catch {
    return []
  }
}

function fileRows(): Array<{ row: McpRowConfig; file: string; owned: boolean }> {
  const files: string[] = []
  collectMcpFiles(globalMcpsRoot(), files)
  files.sort((a, b) => {
    const aOwned = canonicalOwnerOf(a) !== undefined
    const bOwned = canonicalOwnerOf(b) !== undefined
    if (aOwned !== bOwned) return aOwned ? -1 : 1
    return a.localeCompare(b)
  })
  const out: Array<{ row: McpRowConfig; file: string; owned: boolean }> = []
  for (const file of files) {
    const owner = canonicalOwnerOf(file)
    for (const row of rowsOfFile(file)) out.push({ row, file, owned: owner !== undefined && row.config.serverName === owner })
  }
  return out
}

/** 归一化任意旧/脏数据；非法条目直接丢弃。 */
export function normalizeGlobalMcpStore(input: unknown): GlobalMcpStore {
  const raw = plainObject(input)
  const list = Array.isArray(raw?.servers) ? raw.servers : []
  const servers: StoredGlobalMcpServer[] = []
  const seenNames = new Set<string>()
  const seenIds = new Set<string>()
  for (const item of list) {
    if (servers.length >= MAX_GLOBAL_MCP_SERVERS) break
    const row = plainObject(item)
    if (row === undefined) continue
    const id = typeof row.id === 'string' && ENTRY_ID_PATTERN.test(row.id) ? row.id : ''
    const config = plainObject(row.config)
    if (id === '' || config === undefined) continue
    const serverName = typeof config.serverName === 'string' ? config.serverName : ''
    if (!isServerName(serverName) || seenNames.has(serverName) || seenIds.has(id)) continue
    seenNames.add(serverName)
    seenIds.add(id)
    servers.push({
      id,
      config: structuredClone(config),
      disabled: row.disabled === true,
      ...typeof row.file === 'string' ? { file: row.file } : {},
      ...typeof row.owned === 'boolean' ? { owned: row.owned } : {},
    })
  }
  return { version: 1, servers }
}

/** 旧 2.1.3 SQLite 账本迁移；每个 profile 每进程只尝试一次。 */
const migrated = new Set<string>()
function migrateLegacySqlite(profileName: string): void {
  if (migrated.has(profileName)) return
  migrated.add(profileName)
  let legacy: unknown
  try {
    legacy = readPluginDoc(globalMcpStoreKey(profileName))
  } catch {
    return
  }
  if (legacy === undefined) return
  const old = normalizeGlobalMcpStore(legacy)
  const existing = new Set(fileRows().map(({ row }) => String(row.config.serverName ?? '')))
  const disabled = new Set(readMeta().disabled)
  for (const row of old.servers) {
    const serverName = String(row.config.serverName ?? '')
    if (serverName === '' || existing.has(serverName)) continue
    try {
      writeCanonical({ ...row, file: globalMcpServerFile(serverName), owned: true })
      if (row.disabled) disabled.add(serverName)
    } catch {
      return
    }
  }
  try {
    writeMeta(disabled)
    delDoc(openDb(pluginDbFile()), globalMcpStoreKey(profileName))
  } catch {
    // 删除旧 doc 失败不影响磁盘数据；下次检测到已存在会跳过重复写入。
  }
}

/** 读全局 MCP 磁盘账本。 */
export function readGlobalMcpStore(profileName: string): GlobalMcpStore {
  try {
    migrateLegacySqlite(profileName)
    const disabled = new Set(readMeta().disabled)
    const servers: StoredGlobalMcpServer[] = []
    const seen = new Set<string>()
    for (const { row, file, owned } of fileRows()) {
      if (servers.length >= MAX_GLOBAL_MCP_SERVERS) break
      const serverName = String(row.config.serverName ?? '')
      if (!isServerName(serverName) || seen.has(serverName)) continue
      seen.add(serverName)
      servers.push({
        id: `mcp-${serverName}`,
        config: structuredClone(row.config),
        disabled: disabled.has(serverName),
        file,
        owned,
      })
    }
    return { version: 1, servers }
  } catch {
    return { version: 1, servers: [] }
  }
}

/** 磁盘上是否已有 mcps 数据（含旧文件或元数据）。 */
export function hasGlobalMcpStore(profileName: string): boolean {
  migrateLegacySqlite(profileName)
  try {
    return existsSync(globalMcpMetaFile()) || fileRows().length > 0
  } catch {
    return false
  }
}

/** 整份写回 canonical 文件；不删除任何旧 mcps 文件。 */
export function writeGlobalMcpStore(profileName: string, store: GlobalMcpStore): void {
  migrateLegacySqlite(profileName)
  const normalized = normalizeGlobalMcpStore(store)
  if (normalized.servers.length > MAX_GLOBAL_MCP_SERVERS) {
    throw new Error(`global MCP ledger exceeds ${MAX_GLOBAL_MCP_SERVERS} entries`)
  }
  const disabled = new Set<string>()
  for (const row of normalized.servers) {
    writeCanonical(row)
    if (row.disabled) disabled.add(String(row.config.serverName ?? ''))
  }
  // 整份写回时清理 canonical 文件；旧 mcps 文件保持原样。
  const wanted = new Set(normalized.servers.map((row) => String(row.config.serverName ?? '')))
  const files: string[] = []
  collectMcpFiles(globalMcpsRoot(), files)
  for (const file of files) {
    const owner = canonicalOwnerOf(file)
    if (owner !== undefined && !wanted.has(owner)) removeCanonical(owner)
  }
  writeMeta(disabled)
}

/** 找一个 serverName 对应的账本行。 */
export function findStoredGlobalMcpServer(profileName: string, serverName: string): StoredGlobalMcpServer | undefined {
  return readGlobalMcpStore(profileName).servers.find((row) => row.config.serverName === serverName)
}

/** 新增或按 serverName 覆盖一条 canonical 文件。 */
export function upsertStoredGlobalMcpServer(profileName: string, row: StoredGlobalMcpServer): GlobalMcpStore {
  const serverName = String(row.config.serverName ?? '')
  if (!isServerName(serverName)) throw new Error(`invalid global MCP serverName: ${serverName}`)
  const store = readGlobalMcpStore(profileName)
  const existing = store.servers.find((item) => item.config.serverName === serverName)
  if (existing?.owned === false) {
    throw new Error(`global MCP "${serverName}" is defined by a legacy mcps file and is read-only: ${String(existing.file ?? '')}`)
  }
  if (existing === undefined && store.servers.length >= MAX_GLOBAL_MCP_SERVERS) {
    throw new Error(`global MCP ledger exceeds ${MAX_GLOBAL_MCP_SERVERS} entries`)
  }
  writeCanonical({ ...row, file: globalMcpServerFile(serverName), owned: true })
  const disabled = new Set(readMeta().disabled)
  if (row.disabled) disabled.add(serverName)
  else disabled.delete(serverName)
  writeMeta(disabled)
  return readGlobalMcpStore(profileName)
}

/** 删除一个 canonical 文件；旧 mcps 文件不可由面板删除。 */
export function removeStoredGlobalMcpServer(profileName: string, serverName: string): GlobalMcpStore {
  const row = findStoredGlobalMcpServer(profileName, serverName)
  if (row?.owned === false) {
    throw new Error(`global MCP "${serverName}" is defined by a legacy mcps file and is read-only: ${String(row.file ?? '')}`)
  }
  removeCanonical(serverName)
  const disabled = new Set(readMeta().disabled)
  disabled.delete(serverName)
  writeMeta(disabled)
  return readGlobalMcpStore(profileName)
}

/** 持久化启停意图。 */
export function setStoredGlobalMcpServerDisabled(profileName: string, serverName: string, disabled: boolean): GlobalMcpStore {
  const row = findStoredGlobalMcpServer(profileName, serverName)
  if (row === undefined) throw new Error(`no global MCP server named "${serverName}"`)
  if (row.owned === false) throw new Error(`global MCP "${serverName}" is defined by a legacy mcps file and is read-only: ${String(row.file ?? '')}`)
  const names = new Set(readMeta().disabled)
  if (disabled) names.add(serverName)
  else names.delete(serverName)
  writeMeta(names)
  return readGlobalMcpStore(profileName)
}

/** 覆盖某条 canonical server 的 config。 */
export function replaceStoredGlobalMcpServerConfig(
  profileName: string,
  serverName: string,
  config: Record<string, unknown>,
): GlobalMcpStore {
  const row = findStoredGlobalMcpServer(profileName, serverName)
  if (row === undefined) throw new Error(`no global MCP server named "${serverName}"`)
  if (row.owned === false) throw new Error(`global MCP "${serverName}" is defined by a legacy mcps file and is read-only: ${String(row.file ?? '')}`)
  writeCanonical({ ...row, config })
  return readGlobalMcpStore(profileName)
}

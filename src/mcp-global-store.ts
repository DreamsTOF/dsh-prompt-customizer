/**
 * mcp-global-store — 插件自有 SQLite 里的全局 MCP Server 账本。
 *
 * 为什么不再写 `cordis.patch.yml`：DSH 0.2.2 的 profile 根文件 `cordis.yml`
 * 每次启动都会被 `runProfile()` 重写为空列表（组合全部由 patch 层提供），
 * 而 runtime 往 profile 根 Include 树里 create 出来的行会落到该文件里，
 * 因此重启必丢。全局 MCP 行改为插件自己的持久化账本，启动时由插件重新
 * 挂进内存；它不进入宿主配置层，也就不受 profile 根重建影响。
 *
 * 账本按 profile 分键：`mcp/global-servers/<profile>`。同一份 DSH_HOME 下
 * 的 desktop / web 等 profile 各自维护自己的全局 MCP 集合，与旧的
 * “global = 当前 profile 的 cordis.patch.yml” 语义一致。
 *
 * 形状：`{ version: 1, servers: [{ id, config, disabled }] }`
 *  - `id`：Loader 行 id（插件生成，进程内唯一）；
 *  - `config`：与 mcp-paste 的 McpRowConfig.config 同形（含 serverName / transport）；
 *  - `disabled`：持久化的启停意图。
 */

import { readPluginDoc, writePluginDoc } from '../vendor/prompt-customizer/db.js'
import { isServerName } from './ids.ts'

/** 单个 profile 的全局 MCP 上限（与 mcp-tool-disable 的 server 上限一致）。 */
export const MAX_GLOBAL_MCP_SERVERS = 200

/** 一条插件自管的全局 MCP Server。 */
export interface StoredGlobalMcpServer {
  /** Loader 行 id（root tree 内唯一）。 */
  id: string
  /** 与 mcp-paste 的 row.config 同形。 */
  config: Record<string, unknown>
  /** 持久化的启停意图。 */
  disabled: boolean
}

/** 一个 profile 的全局 MCP 账本。 */
export interface GlobalMcpStore {
  version: 1
  servers: StoredGlobalMcpServer[]
}

/** CPU 生成的 entry id 允许的字符（DSH 的 id 本身允许 `:`，这里只收窄自己生成的）。 */
const ENTRY_ID_PATTERN = /^[A-Za-z0-9_:-]{1,128}$/

function plainObject(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}

/** 账本存储键：按 profile 分开。 */
export function globalMcpStoreKey(profileName: string): string {
  return `mcp/global-servers/${encodeURIComponent(profileName === '' ? 'default' : profileName)}`
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
    servers.push({ id, config: structuredClone(config), disabled: row.disabled === true })
  }
  return { version: 1, servers }
}

/** 读一个 profile 的全局 MCP 账本；缺失 / 坏数据视为空。 */
export function readGlobalMcpStore(profileName: string): GlobalMcpStore {
  try {
    return normalizeGlobalMcpStore(readPluginDoc(globalMcpStoreKey(profileName)))
  } catch {
    return { version: 1, servers: [] }
  }
}

/** 该 profile 是否已经有账本文档（即使服务器列表为空）。 */
export function hasGlobalMcpStore(profileName: string): boolean {
  try {
    return readPluginDoc(globalMcpStoreKey(profileName)) !== undefined
  } catch {
    return false
  }
}

/** 整份写回；写失败向上抛，让路由返回可诊断错误。 */
export function writeGlobalMcpStore(profileName: string, store: GlobalMcpStore): void {
  const rawCount = Array.isArray((store as { servers?: unknown }).servers)
    ? (store as { servers: unknown[] }).servers.length
    : 0
  if (rawCount > MAX_GLOBAL_MCP_SERVERS) {
    throw new Error(`global MCP ledger exceeds ${MAX_GLOBAL_MCP_SERVERS} entries`)
  }
  writePluginDoc(globalMcpStoreKey(profileName), normalizeGlobalMcpStore(store))
}

/** 找一个 serverName 对应的账本行。 */
export function findStoredGlobalMcpServer(profileName: string, serverName: string): StoredGlobalMcpServer | undefined {
  return readGlobalMcpStore(profileName).servers.find((row) => row.config.serverName === serverName)
}

/** 新增或按 serverName 覆盖一条；返回新账本。 */
export function upsertStoredGlobalMcpServer(profileName: string, row: StoredGlobalMcpServer): GlobalMcpStore {
  const store = readGlobalMcpStore(profileName)
  const serverName = String(row.config.serverName ?? '')
  const index = store.servers.findIndex((item) => item.config.serverName === serverName)
  const next = index < 0 ? [...store.servers, row] : store.servers.map((item, at) => at === index ? row : item)
  if (next.length > MAX_GLOBAL_MCP_SERVERS) {
    throw new Error(`global MCP ledger exceeds ${MAX_GLOBAL_MCP_SERVERS} entries`)
  }
  const updated = normalizeGlobalMcpStore({ version: 1, servers: next })
  writeGlobalMcpStore(profileName, updated)
  return updated
}

/** 删除一个 serverName；返回新账本。 */
export function removeStoredGlobalMcpServer(profileName: string, serverName: string): GlobalMcpStore {
  const store = readGlobalMcpStore(profileName)
  const updated = normalizeGlobalMcpStore({
    version: 1,
    servers: store.servers.filter((row) => row.config.serverName !== serverName),
  })
  writeGlobalMcpStore(profileName, updated)
  return updated
}

/** 持久化启停意图；返回新账本。 */
export function setStoredGlobalMcpServerDisabled(profileName: string, serverName: string, disabled: boolean): GlobalMcpStore {
  const store = readGlobalMcpStore(profileName)
  const updated = normalizeGlobalMcpStore({
    version: 1,
    servers: store.servers.map((row) => row.config.serverName === serverName ? { ...row, disabled } : row),
  })
  writeGlobalMcpStore(profileName, updated)
  return updated
}

/** 覆盖某条 server 的 config；返回新账本。 */
export function replaceStoredGlobalMcpServerConfig(
  profileName: string,
  serverName: string,
  config: Record<string, unknown>,
): GlobalMcpStore {
  const store = readGlobalMcpStore(profileName)
  const updated = normalizeGlobalMcpStore({
    version: 1,
    servers: store.servers.map((row) => row.config.serverName === serverName ? { ...row, config } : row),
  })
  writeGlobalMcpStore(profileName, updated)
  return updated
}

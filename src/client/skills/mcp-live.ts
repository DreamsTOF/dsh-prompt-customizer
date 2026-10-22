/**
 * skills/mcp-live — /api/triad/mcp-status 的真实 MCP 状态。
 *
 * 类型（工具/Server/预设行/整份快照）+ 拉取 hook + 「工具是否已注册」判定；
 * 面板与 MCP 视图共用。
 */
import { useEffect, useState } from 'react'
import type { PresetRow } from './types.js'


/** 真实 MCP 状态（host /api/triad/mcp-status：ctx.tools 中 mcp__* 工具分组）。 */
export interface LiveMcpTool {
  name: string
  description: string
}
export interface LiveMcpServer {
  serverName: string
  toolCount: number
  tools: LiveMcpTool[]
  /** 配置文件条目信息（启用/禁用开关用）。 */
  config: { entryId: string | null; disabled: boolean; editable: boolean }
  /** 0.1.6：作用域（当前恒为 global）。 */
  scope?: string
  /** 0.1.6：哪些 Agent 预设遮蔽了它（账本镜像）。 */
  maskedBy?: string[]
}
/** 预设自带的 mcp-client 行（host 从预设组合文本解析）。 */
export interface PresetMcpRowWire {
  entryId: string
  serverName: string
  transport: string
  summary: string
  /** 该 server 的工具（活动 agent 作用域 ∪ 名单缓存；无数据时缺省）。 */
  tools?: LiveMcpTool[]
}
/**
 * mcps 目录来源的一个 Server。
 *
 * 内核只认 Cordis 组合里的 mcp-client 行，没有「读某个目录下 mcp.json」的约定，
 * 所以下面四个目录里的配置由本插件读出来并挂成真正的 mcp-client 行
 * （优先级从高到低，`.dsh` 胜 `.agents`、工作区胜用户级）：
 * `<ws>/.dsh/mcps`、`<ws>/.agents/mcps`、`~/.dsh/mcps`、`~/.agents/mcps`。
 */
export interface WorkspaceMcpServer {
  /** 配置文件里写的名字（工作区层不带路径哈希后缀）。 */
  name: string
  scope: 'global' | 'workspace'
  /** 工作区根（仅 workspace 层）。 */
  workspace?: string
  /** 实际挂载用的 serverName（工作区层带 8 位路径哈希后缀）。 */
  serverName: string
  transport: string
  summary: string
  /** 这条来自哪个 mcps 根目录（面板按目录分组）。 */
  root: string
  /** 来源文件（面板展示「这条从哪来」）。 */
  file: string
  /** 工具清单（注册工具 ∪ 名单缓存，与其它卡片同口径）。 */
  tools?: LiveMcpTool[]
}
/** mcps 目录来源的 Server 汇总（全局层 + 每个工作区层 + 解析错误）。 */
export interface WorkspaceMcpState {
  global: WorkspaceMcpServer[]
  workspaces: Array<{ root: string; servers: WorkspaceMcpServer[] }>
  errors: Array<{ file: string; message: string }>
  /** 与组合里既有 mcp-client 行同名、已让位不再重复挂载的那些（组合是权威来源）。 */
  skipped: Array<{ serverName: string; name: string; scope: 'global' | 'workspace'; workspace?: string; reason: 'composition' }>
  /** 被更高优先级目录同名遮蔽的条目（`.dsh` 赢 `.agents`，工作区赢用户级）。 */
  shadowed: Array<{ name: string; scope: 'global' | 'workspace'; workspace?: string; file: string; keptFile: string }>
  /** 用户级两个 mcps 目录（`~/.dsh/mcps` 在前）；工作区两个由面板按工作区拼。 */
  dirs: { user: string[] }
}
export interface LiveMcpState {
  at: string
  serverCount: number
  toolCount: number
  servers: LiveMcpServer[]
  /** 0.1.6：Agent 预设名单。 */
  presets?: PresetRow[]
  /** 0.1.6：presetId → { serverName: false }（显式遮蔽；缺省 = 继承全局）。 */
  masks?: Record<string, Record<string, boolean>>
  /** 0.1.6：presetId → 该预设自带的 mcp-client 行。 */
  presetServers?: Record<string, PresetMcpRowWire[]>
  /** 工具级禁用·全局层镜像：serverName → 禁用工具全名（所有预设生效）。 */
  toolDisabled?: Record<string, string[]>
  /** 工具级禁用·预设层镜像（按「行」分账）：presetId → serverName → { own, inherit }。 */
  toolDisabledByPreset?: Record<string, Record<string, { own: string[]; inherit: string[] }>>
  /** 遮蔽补丁运行期安装诊断：presetId → 活动 agent 数与 deny 数、失败原因。 */
  maskInstall?: Record<string, { agents: number; deniedAgents: number; denyTotal: number; errors: string[] }>
  /** mcps 目录来源的 Server（全局层 + 工作区层；由本插件挂载）。 */
  workspaceServers?: WorkspaceMcpState
}
export type LiveMcpStatus =
  | { state: 'loading'; data: null }
  | { state: 'ready'; data: LiveMcpState }
  | { state: 'unavailable'; data: null }

/** 添加/启用后自动等工具注册的轮询间隔与总时长。 */
export const MCP_TOOL_WATCH_INTERVAL_MS = 2000
// npx 首次拉包可能要一两分钟，等待窗口给足；期间卡片显示「等待注册」，超时后
// 用户仍可手动刷新（下一次添加/启用会重新开始等待）。
export const MCP_TOOL_WATCH_TIMEOUT_MS = 150_000

/**
 * 状态里某 Server **实际注册**的工具数（全局条目 ∪ 各预设自带行，取最大）。
 *
 * 一定要用注册数（`toolCount` / `registeredCount`），不能用卡片上那份
 * 「注册 ∪ 名单缓存」的列表长度 —— 缓存会让还没连上的 Server 看起来已就绪，
 * 自动等待就会提前收工（表现就是卡在「0 工具」还得手动刷新）。
 */
export function mcpRegisteredToolCountOf(data: LiveMcpState, serverName: string): number {
  let count = data.servers.find(server => server.serverName === serverName)?.toolCount ?? 0
  for (const rows of Object.values(data.presetServers ?? {})) {
    const row = rows.find(item => item.serverName === serverName)
    if (row !== undefined) count = Math.max(count, row.registeredCount ?? 0)
  }
  return count
}

/** 该 Server 是否还没注册出工具（卡片给「等待注册」标记用）。 */
export function isToolRegistrationPending(registered: number, listed: number): boolean {
  return registered === 0 && listed > 0
}

/** 拉取真实 MCP 注册状态；失败（服务端未重启等）→ unavailable（界面引导重启）。 */
export function useMcpLiveState(): [LiveMcpStatus, () => void] {
  const [status, setStatus] = useState<LiveMcpStatus>({ state: 'loading', data: null })
  const load = (): void => {
    setStatus((current) => (current.state === 'ready' ? current : { state: 'loading', data: null }))
    void fetch('/api/triad/mcp-status', { headers: { accept: 'application/json' } })
      .then((response) => { if (!response.ok) throw new Error(String(response.status)); return response.json() })
      .then((body) => {
        if (typeof body !== 'object' || body === null || !Array.isArray((body as { servers?: unknown }).servers)) throw new Error('bad shape')
        const data = body as LiveMcpState
        setStatus({ state: 'ready', data })
      })
      .catch(() => { setStatus({ state: 'unavailable', data: null }) })
  }
  useEffect(() => { load() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [])
  return [status, load]
}

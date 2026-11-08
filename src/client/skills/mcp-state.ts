/**
 * skills/mcp-state — MCP 分层开关的纯函数。
 *
 * 统一三件事：
 *   1. 当前编辑层级该写哪一本账（global / preset mask / workspace close）；
 *   2. 一条 Server 行的有效启用态（config.disabled → mask → workspaceClosed）；
 *   3. MCP 配置编辑的格式能力（服务端返回什么就用什么，不按 source 猜）。
 *
 * 无 React / 无运行时依赖，供面板与单测共用。
 */

/** MCP 编辑层级（与技能面板共用预设级 / 工作区级切换）。 */
export type McpLevel = 'preset' | 'workspace'

/** 一台 Server 的开关落点。 */
export type McpToggleTarget =
  | { kind: 'global' }
  | { kind: 'mask'; presetId: string }
  | { kind: 'workspace'; cwd: string }

/**
 * 当前层级/范围下，卡片主开关应该写哪里。
 *
 * @param level - 预设级或工作区级。
 * @param scope - 当前预设 id；空串 = 全部 Agent。
 * @param workspace - 当前工作区绝对路径；null = 未选择。
 * @returns 写目标；工作区级但拿不到 cwd 时返回 null（不落任何账）。
 */
export function mcpToggleTarget(
  level: McpLevel,
  scope: string,
  workspace: string | null,
): McpToggleTarget | null {
  if (level === 'workspace') {
    if (workspace === null || workspace.trim() === '') return null
    return { kind: 'workspace', cwd: workspace }
  }
  return scope === '' ? { kind: 'global' } : { kind: 'mask', presetId: scope }
}

/** 一台 Server 的有效状态输入。优先级：config.disabled → mask → workspaceClosed。 */
export interface McpEffectiveInput {
  /** 全局配置条目本身被禁用（硬关，后面几层都打不开）。 */
  configDisabled?: boolean
  /** 当前预设把它遮蔽。 */
  masked?: boolean
  /** 当前工作区把它关闭。 */
  workspaceClosed?: boolean
}

/**
 * 有效启用态；任一层关闭即为关。
 * @param input - 三层状态。
 * @returns 模型侧最终是否可见。
 */
export function mcpEffectiveEnabled(input: McpEffectiveInput): boolean {
  return input.configDisabled !== true && input.masked !== true && input.workspaceClosed !== true
}

/** MCP 配置文本格式。 */
export type McpConfigFormat = 'json' | 'yaml'

/** 服务端返回的编辑能力（缺省时由客户端按文本形态保守推断）。 */
export interface McpFormatCapabilities {
  /** 支持的格式；缺省 = 仅当前格式。 */
  formats?: McpConfigFormat[]
  /** 是否可编辑。 */
  editable?: boolean
  /** 是否支持 JSON ↔ YAML 互转。 */
  convert?: boolean
}

/**
 * 清洗服务端返回的 capabilities（防止脏字段渗进 UI）。
 * @param value - 原始响应字段。
 * @returns 规范化后的能力对象；没有任何有效字段时 undefined。
 */
export function normalizeMcpFormatCapabilities(value: unknown): McpFormatCapabilities | undefined {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return undefined
  const raw = value as Record<string, unknown>
  const result: McpFormatCapabilities = {}
  if (Array.isArray(raw.formats)) {
    const formats = [...new Set(raw.formats.filter((item): item is McpConfigFormat => item === 'json' || item === 'yaml'))]
    if (formats.length > 0) result.formats = formats
  }
  if (typeof raw.editable === 'boolean') result.editable = raw.editable
  if (typeof raw.convert === 'boolean') result.convert = raw.convert
  return Object.keys(result).length === 0 ? undefined : result
}

/**
 * 从配置文本形态判断格式（仅在服务端未返回 format 时兜底，不按来源猜）。
 * @param text - 配置原文。
 * @returns JSON 或 YAML。
 */
export function detectMcpFormat(text: string): McpConfigFormat {
  const trimmed = text.trim()
  if (trimmed === '') return 'json'
  return trimmed.startsWith('{') || trimmed.startsWith('[') ? 'json' : 'yaml'
}

/**
 * 编辑弹窗可切换的格式列表。
 * @param capabilities - 服务端能力；缺省时只用 fallback。
 * @param fallback - 保守回退（编辑模式通常只允许当前格式）。
 * @returns 去重后的格式列表。
 */
export function mcpFormatOptions(
  capabilities: McpFormatCapabilities | undefined,
  fallback: McpConfigFormat[],
): McpConfigFormat[] {
  const formats = capabilities?.formats
  return formats !== undefined && formats.length > 0 ? [...new Set(formats)] : [...new Set(fallback)]
}

/** 工作区工具禁用账本：优先按 server 分组的新接口，其次兼容扁平的旧接口。 */
export interface WorkspaceToolLedgerLike {
  /** 新接口：cwd → serverName → 工具全名[]。 */
  byServer?: Record<string, Record<string, string[]>> | undefined
  /** 旧接口：cwd → 工具全名[]（不再按 `mcp__` 前缀反推归属）。 */
  flat?: Record<string, string[]> | undefined
}

/**
 * 某台 Server 在当前工作区被禁用的工具名。
 *
 * 新接口按 server 分组直接取；旧接口退回「与状态接口里该 Server 的 tools 名单求交」，
 * 不在客户端解析 `mcp__` 前缀。无法归属的旧账目由调用方原样展示。
 *
 * @param ledger - 工作区工具禁用账本。
 * @param cwd - 当前工作区；null 返回空。
 * @param serverName - Server 名。
 * @param tools - 状态接口里该 Server 的工具列表（按 server 分组的结果）。
 * @returns 该 Server 的禁用工具全名。
 */
export function workspaceDisabledToolsFor(
  ledger: WorkspaceToolLedgerLike,
  cwd: string | null,
  serverName: string,
  tools: ReadonlyArray<{ name: string }>,
): string[] {
  if (cwd === null || cwd === '') return []
  const grouped = ledger.byServer?.[cwd]?.[serverName]
  if (grouped !== undefined) return grouped
  const owned = new Set(tools.map((tool) => tool.name))
  return (ledger.flat?.[cwd] ?? []).filter((name) => owned.has(name))
}

/**
 * 旧账本里无法归到任何 Server 卡片的工具名（原样展示用）。
 * @param ledger - 工作区工具禁用账本。
 * @param cwd - 当前工作区。
 * @param attributed - 已归属到卡片的工具名集合。
 * @returns 未归属的工具全名（仅旧扁平接口会产生）。
 */
export function ungroupedWorkspaceTools(
  ledger: WorkspaceToolLedgerLike,
  cwd: string | null,
  attributed: ReadonlySet<string>,
): string[] {
  if (cwd === null || cwd === '') return []
  if (ledger.byServer?.[cwd] !== undefined) return []
  return (ledger.flat?.[cwd] ?? []).filter((name) => !attributed.has(name))
}

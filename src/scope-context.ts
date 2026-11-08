/**
 * scope-context — 从 `system-prompt/assemble` 的上下文反查会话/preset。
 *
 * 0.2.2 的 `AssembleContext` 只有 `scope`（ScopeKey），**没有 `agent`**：
 * 旧代码从 `context.agent.session.header.cwd` 取工作区、从 `context.agent.ctx`
 * 取预设，在 0.2.2 上恒为 undefined，工作区过滤与预设级遮蔽全部失效
 * （静默放行，比报错更难发现）。
 *
 * agent 建作用域时以自身对象为 key（`createScope(loopCtx, agent)`），因此
 * `context.scope` 与 `agents.list()` 里的 agent 对象是同一引用；从这里反查
 * 即可拿回 cwd 与 `agentPresets.composedPreset(agent.ctx)`。
 */

import { optionalService } from './context-utils.ts'

/** 本模块用到的 agent 最小面。 */
interface AgentLike {
  session?: { header?: { cwd?: unknown } }
  ctx?: unknown
}

/** 装配上下文的 scope 字段。 */
export interface AssembleScopeLike {
  scope?: unknown
}

/** 全部活动 agent（agents 服务缺席时为空）。 */
export function liveAgents(ctx: unknown): AgentLike[] {
  const agents = optionalService<{ list?: () => unknown }>(ctx, 'agents')
  let list: unknown
  try {
    list = typeof agents?.list === 'function' ? agents.list() : []
  } catch {
    list = []
  }
  return Array.isArray(list) ? (list as AgentLike[]) : []
}

/**
 * 装配上下文 scope 对应的 agent。
 * @param ctx - 宿主上下文。
 * @param context - waterfall 的 AssembleContext。
 * @returns 匹配的 agent；预览/全局装配等无会话路径返回 undefined。
 */
export function agentOfScope(ctx: unknown, context: unknown): AgentLike | undefined {
  const scope = (context as AssembleScopeLike | undefined)?.scope
  if (scope === undefined || scope === null) return undefined
  for (const agent of liveAgents(ctx)) {
    if (agent === scope) return agent
  }
  return undefined
}

/** 装配上下文所属会话的 cwd（取不到返回 undefined）。 */
export function cwdOfScope(ctx: unknown, context: unknown): string | undefined {
  const cwd = agentOfScope(ctx, context)?.session?.header?.cwd
  return typeof cwd === 'string' && cwd.trim() !== '' ? cwd : undefined
}

/**
 * 装配上下文所属 agent 的预设 id。
 * @param ctx - 宿主上下文。
 * @param context - waterfall 的 AssembleContext。
 * @returns preset id；无会话、服务缺席或未绑定预设时 undefined。
 */
export function presetOfScope(ctx: unknown, context: unknown): string | undefined {
  const agent = agentOfScope(ctx, context)
  if (agent === undefined) return undefined
  const presets = optionalService<{ composedPreset?: (ctx2: unknown) => unknown }>(ctx, 'agentPresets')
  if (typeof presets?.composedPreset !== 'function') return undefined
  try {
    const presetId = presets.composedPreset(agent.ctx)
    return typeof presetId === 'string' && presetId !== '' ? presetId : undefined
  } catch {
    return undefined
  }
}

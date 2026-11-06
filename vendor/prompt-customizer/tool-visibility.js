/**
 * 阶段化工具目录：把「当前阶段要隐藏的工具」落到 agent 作用域。
 *
 * 0.2.2-rc.1 起 `system-prompt/assemble` 只携带 sections / contexts / variables，
 * 工具声明由工具提供者拥有（`PromptPresentation` 不再有 `tools`），所以不能再
 * 在装配瀑布流里删 `assembly.tools`。官方的按 agent 收窄入口是
 * `agent.ctx.tools.restrict({ deny })`：它作用于该 agent 继承的全局工具面，
 * 在每步 `tools.resolve()` 与提示词装配之前生效。
 *
 * 阶段是会话级的：bootstrap → 首个 tool/call 或 assistant/message 后晋级，
 * `compaction/end` 之后回到压缩受控期。这里在 `session/event` 上同步一次该
 * agent 的 deny 集；配置写入、工具注册变化、新回合也会重算。`restrict` 只
 * 接受全局可收窄名，作用域内注册（预设自带 MCP 工具等）保持可见。
 */

import { effectiveConfig, pickToolsFilter } from './effective.js'

/** 会改变阶段、或需要重新读取配置的会话事件。 */
const RELEVANT_EVENTS = new Set([
  'tool/call',
  'assistant/message',
  'compaction/end',
  'turn/start',
  'agent-preset/selected',
])

/** 全局可收窄工具名（root 视图；条件工具也算，restrict 允许未执行的声明名）。 */
function globalToolNames(ctx) {
  try {
    const schemas = ctx.get?.('tools')?.schemas?.() ?? []
    return new Set(
      (Array.isArray(schemas) ? schemas : [])
        .map(tool => (typeof tool?.name === 'string' ? tool.name : undefined))
        .filter(name => name !== undefined),
    )
  } catch {
    return new Set()
  }
}

/** 当前活动 agent 列表（服务缺席时为空）。 */
function activeAgents(ctx) {
  try {
    const list = ctx.get?.('agents')?.list?.()
    return Array.isArray(list) ? list.filter(agent => agent && typeof agent === 'object') : []
  } catch {
    return []
  }
}

/**
 * 创建阶段化工具可见性安装器。
 * @param {object} options
 * @param {object} options.ctx - 宿主插件上下文。
 * @param {() => object} options.readConfig - 读取解析后的插件配置。
 * @param {(agent: object) => { promoted: boolean, boundary: number }} options.phaseOf - 读该 agent 的阶段。
 * @param {(agent: object) => string | undefined} options.presetOf - 读该 agent 的预设 id。
 * @returns {{ sync: (agent: object) => void, syncAll: () => void }}
 */
export function createPhaseToolVisibility({ ctx, readConfig, phaseOf, presetOf }) {
  /** agent → { key, dispose }：当前已安装的 deny 集。 */
  const installed = new Map()
  /** session → agent：session/event 只带会话，需要找回 agent 的 scoped ctx。 */
  const bySession = new Map()
  let stopped = false
  let timer

  const release = (agent) => {
    const current = installed.get(agent)
    if (current === undefined) return
    installed.delete(agent)
    try {
      current.dispose()
    } catch {
      /* 已被宿主回收：无需二次处理 */
    }
  }

  const desiredDeny = (agent) => {
    let presetId
    try {
      presetId = presetOf(agent)
    } catch {
      presetId = undefined
    }
    if (typeof presetId !== 'string' || presetId === '') return []
    const cfg = effectiveConfig(readConfig()?.overrides?.[presetId])
    const filter = pickToolsFilter(cfg.tools, phaseOf(agent))
    const names = globalToolNames(ctx)
    return [...new Set(
      (Array.isArray(filter.exclude) ? filter.exclude : [])
        .filter(name => typeof name === 'string' && names.has(name)),
    )]
  }

  const sync = (agent) => {
    if (stopped || agent === null || typeof agent !== 'object') return
    const tools = agent.ctx?.get?.('tools')
    if (typeof tools?.restrict !== 'function') return
    let deny
    try {
      deny = desiredDeny(agent)
    } catch (error) {
      ctx.logger?.warn?.(`[prompt-customizer] tool phase filter failed for "${agent.id}": ${error instanceof Error ? error.message : String(error)}`)
      return
    }
    const key = deny.join('\u0000')
    const current = installed.get(agent)
    if (current?.key === key) return
    release(agent)
    if (deny.length === 0) return
    try {
      installed.set(agent, { key, dispose: tools.restrict({ deny }) })
    } catch (error) {
      // 作用域内注册（预设自带工具）会被 restrict 拒绝：逐名安装，跳过那部分，
      // 保证其余全局工具的阶段过滤仍然生效。
      const disposers = []
      for (const name of deny) {
        try { disposers.push(tools.restrict({ deny: [name] })) } catch { /* 作用域内名字：跳过 */ }
      }
      if (disposers.length > 0) {
        installed.set(agent, {
          key,
          dispose: () => { for (const dispose of disposers) { try { dispose() } catch { /* 已释放 */ } } },
        })
      } else {
        ctx.logger?.warn?.(`[prompt-customizer] tool phase restrict rejected for "${agent.id}": ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }

  const syncAll = () => {
    for (const agent of [...installed.keys()]) sync(agent)
    for (const agent of activeAgents(ctx)) sync(agent)
  }

  ctx.effect(() => {
    const remember = (agent) => {
      if (agent?.session !== undefined) bySession.set(agent.session, agent)
      sync(agent)
    }
    const onCreated = ctx.on?.('agent/created', ({ agent } = {}) => { remember(agent) })
    const onDisposed = ctx.on?.('agent/disposed', ({ agent } = {}) => {
      if (agent?.session !== undefined) bySession.delete(agent.session)
      release(agent)
    })
    const onEvent = ctx.on?.('session/event', (session, event) => {
      if (!RELEVANT_EVENTS.has(event?.type)) return
      const agent = bySession.get(session)
      if (agent !== undefined) sync(agent)
    })
    const onTools = ctx.on?.('tools/change', () => {
      if (timer !== undefined) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = undefined
        if (!stopped) syncAll()
      }, 300)
    })
    for (const agent of activeAgents(ctx)) {
      if (agent?.session !== undefined) bySession.set(agent.session, agent)
      sync(agent)
    }
    return () => {
      stopped = true
      try { onCreated?.() } catch { /* 已卸载 */ }
      try { onDisposed?.() } catch { /* 已卸载 */ }
      try { onEvent?.() } catch { /* 已卸载 */ }
      try { onTools?.() } catch { /* 已卸载 */ }
      if (timer !== undefined) clearTimeout(timer)
      for (const agent of [...installed.keys()]) release(agent)
      bySession.clear()
    }
  }, 'prompt-customizer: phase tool visibility')

  return { sync, syncAll }
}

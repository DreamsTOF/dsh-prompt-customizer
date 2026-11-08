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
import { normalizeEntry } from './model.js'

/** 会改变阶段、或需要重新读取配置的会话事件。 */
const RELEVANT_EVENTS = new Set([
  'tool/call',
  'assistant/message',
  'compaction/end',
  'turn/start',
  'agent-preset/selected',
])

/** 当前活动 agent 列表（服务缺席时为空）。 */
function activeAgents(ctx) {
  try {
    const agents = ctx.get?.('agents')
    const list = typeof agents?.roots === 'function'
      ? agents.roots()
      : agents?.list?.()
    return Array.isArray(list) ? list.filter(agent => agent && typeof agent === 'object') : []
  } catch {
    return []
  }
}

/** 每个 agent 的工具名缓存：restrict 生效后 schemas() 会缩小，不能据此撤销 deny。 */
const knownToolNames = new WeakMap()

function rememberToolNames(ctx, agent) {
  let names = knownToolNames.get(agent)
  if (names === undefined) {
    names = new Set()
    knownToolNames.set(agent, names)
  }
  try {
    const service = ctx.get?.('tools')
    const schemas = service?.schemas?.(agent) ?? agent?.ctx?.tools?.schemas?.(agent) ?? []
    for (const tool of Array.isArray(schemas) ? schemas : []) {
      if (typeof tool?.name === 'string' && tool.name !== '') names.add(tool.name)
    }
  } catch {
    /* 服务未就绪：等下次 tools/change 再补 */
  }
  return names
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

  const desiredEntries = (agent) => {
    let cfg
    try { cfg = readConfig(agent) } catch { return [] }
    // 兼容两种读取口：返回整份 Config（含 overrides）时先按预设取 override；
    // 返回已合并好的生效配置（预设+工作区）时直接使用。
    if (cfg !== null && typeof cfg === 'object'
      && cfg.overrides !== null && typeof cfg.overrides === 'object'
      && Object.keys(cfg.overrides).length > 0) {
      let presetId
      try { presetId = presetOf(agent) } catch { presetId = undefined }
      cfg = effectiveConfig(presetId === undefined || presetId === '' ? undefined : cfg.overrides?.[presetId])
    }
    const filter = pickToolsFilter(cfg.tools, phaseOf(agent))
    return (Array.isArray(filter.exclude) ? filter.exclude : [])
      .map((entry) => normalizeEntry(entry))
      .filter((entry) => entry !== undefined)
  }

  const desiredDeny = (agent) => {
    const names = rememberToolNames(ctx, agent)
    return [...new Set(desiredEntries(agent)
      .filter((entry) => names.has(entry.name))
      .map((entry) => entry.name))]
  }

  const sync = (agent) => {
    if (stopped || agent === null || typeof agent !== 'object') return
    const tools = agent.ctx?.tools ?? agent.ctx?.get?.('tools')
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

  // restrict 只能收窄 inherit 的 global/ancestor 工具；对 agent 作用域自己
  // 注册的工具（插件 tool-fs / MCP 等）在真正执行前做最后一道名字门禁。
  // 这是运行时 takeover，不依赖 UI 目录是否完整。
  const isDeniedCall = (agent, name) => desiredEntries(agent).some((entry) => entry.name === name)

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
    const onPreExecute = ctx.on?.('tools/pre-execute', async (exec, next) => {
      try {
        const agent = exec?.agent
        if (agent !== undefined && typeof exec?.name === 'string' && isDeniedCall(agent, exec.name)) {
          return { kind: 'deny', reason: `prompt-customizer: tool "${exec.name}" is excluded for this phase` }
        }
      } catch {
        /* 解析失败不拦调用 */
      }
      return next()
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
      try { onPreExecute?.() } catch { /* 已卸载 */ }
      if (timer !== undefined) clearTimeout(timer)
      for (const agent of [...installed.keys()]) release(agent)
      bySession.clear()
    }
  }, 'prompt-customizer: phase tool visibility')

  return { sync, syncAll }
}

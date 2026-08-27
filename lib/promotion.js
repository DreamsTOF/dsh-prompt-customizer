/**
 * Epoch-aware 晋级 tracker —— 行为对标 agent-presets 实验预设里的
 * compaction-epoch.mjs：晋级由 durable 会话事件推导（默认首个
 * `tool/call` 或 `assistant/message`），compaction 之后复位（首个压缩后
 * 请求回到 bootstrap 态，直到新的晋级信号），subagent 视为恒已晋级。
 *
 * 状态按 session.id 记忆，冷会话扫一遍 durable log 后 O(1)，因此 resume
 * / reload 重建出相同的阶段。
 */

/** 默认的晋级信号事件。 */
const DEFAULT_PROMOTE_EVENTS = ['tool/call', 'assistant/message']

/** 构建一个晋级 tracker；promoteEvents 可换成单事件数组。 */
export function createPromotion(promoteEvents = DEFAULT_PROMOTE_EVENTS) {
  const promote = new Set(promoteEvents)
  /** sessionId -> { boundary, promoted } */
  const state = new Map()

  /** 从 durable log 冷扫描。 */
  const scan = (session) => {
    let boundary = -1
    let promoted = false
    for (const event of session.events ?? []) {
      const seq = event.seq ?? 0 // 没有 seq 的事件视为边界之后
      if (event.type === 'compaction/end') {
        boundary = seq
        promoted = false
        continue
      }
      if (promote.has(event.type) && seq > boundary) promoted = true
    }
    const entry = { boundary, promoted }
    state.set(session.id, entry)
    return entry
  }

  return {
    /**
     * 当前 agent 的阶段。agent 缺席（纯清单读取等）或子代理一律已晋级；
     * ponytail: 只覆盖 compaction 边界这一种 epoch，未跟踪 fork 语义。
     * 升级路径：参照 anchored-standard 的 fork-aware 边界扩展 scan。
     */
    status(agent) {
      const session = agent?.session
      if (!session) return { boundary: -1, promoted: true }
      if ((session.header?.delegationDepth ?? 0) > 0) return { boundary: -1, promoted: true }
      return state.get(session.id) ?? scan(session)
    },

    /** 增量喂入 `session/event`，避免每次装配全量扫描。 */
    observe(session, event) {
      const entry = state.get(session.id)
      if (entry === undefined) return
      const seq = event.seq ?? 0
      if (event.type === 'compaction/end') {
        state.set(session.id, { boundary: seq, promoted: false })
        return
      }
      if (promote.has(event.type) && seq > entry.boundary && !entry.promoted) {
        state.set(session.id, { ...entry, promoted: true })
      }
    },
  }
}

/**
 * 解析一个会话所属的 agent 预设 id：header 记录创建时值，
 * `agent-preset/selected` 事件记录空白期切换后的值，后者优先。
 */
export function presetOfSession(session) {
  if (!session) return undefined
  let preset = typeof session.header?.agentPreset === 'string' ? session.header.agentPreset : undefined
  for (const event of session.events ?? []) {
    if (event.type === 'agent-preset/selected' && typeof event.data?.agentPreset === 'string') {
      preset = event.data.agentPreset
    }
  }
  return preset
}

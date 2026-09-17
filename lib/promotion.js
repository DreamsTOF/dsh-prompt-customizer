/**
 * Epoch-aware 晋级（bootstrap / active）阶段推导 + 会话预设解析。
 *
 * 阶段语义（行为对标 agent-presets 实验预设里的 compaction-epoch.mjs）：晋级由
 * durable 会话事件推导（默认首个 `tool/call` 或 `assistant/message`），compaction
 * 之后复位（首个压缩后请求回到 bootstrap 态，直到新的晋级信号），subagent 视为
 * 恒已晋级。resume / reload 后由宿主投影的懒折叠从日志重建出相同的阶段。
 *
 * 读取方式：宿主 0.1.2-alpha.4 移除了 `Session.events`，0.1.6 又把同步历史读
 * （`eventAt` / `snapshotEvents` / `ownEvents`）标记为 deprecated（见
 * .agents/notes/implemented/architecture/2026-09-09-deprecate-synchronous-session-event-reads.md，
 * 长期方向是「投影状态 + 增量维护」）。因此本插件不再自行扫历史：阶段推导注册成
 * 宿主的会话投影 unit（宿主负责折叠与增量驱动），预设解析直接读宿主 agent-presets
 * 注册的 `agentPreset` 投影。投影服务缺席（自组 profile 未挂载 session-projection）
 * 时，读取端回落到「已晋级」——与清单读取的静态视图一致，绝不阻断装配。
 */

import { z } from 'zod'

/** 默认的晋级信号事件。 */
const DEFAULT_PROMOTE_EVENTS = ['tool/call', 'assistant/message']

/** 本插件注册的阶段投影 key（带命名空间，避免与宿主 / 其它插件撞名）。 */
export const PHASE_PROJECTION_KEY = 'prompt-customizer/phase'

/** 无从推导时的阶段：视为已晋级（静态视图）。 */
export const PROMOTED_STATUS = Object.freeze({ boundary: -1, promoted: true })

/**
 * 构建阶段投影 unit（`ctx.sessionProjections.register` 的入参）。
 *
 * state 是纯 JSON `{ boundary, promoted }`（投影契约要求）；apply 是纯函数，
 * 未命中事件必须返回原引用（宿主以 Object.is 抑制下游工作）。
 * ponytail: 只覆盖 compaction 边界这一种 epoch，未跟踪 fork 语义。
 * 升级路径：参照 anchored-standard 的 fork-aware 边界扩展 apply。
 */
export function createPhaseProjection(promoteEvents = DEFAULT_PROMOTE_EVENTS) {
  const promote = new Set(promoteEvents)
  return {
    key: PHASE_PROJECTION_KEY,
    stateSchema: z.object({ boundary: z.number().int(), promoted: z.boolean() }),
    init: () => ({ boundary: -1, promoted: false }),
    apply: (state, event) => {
      const seq = event.seq ?? 0 // 没有 seq 的事件视为边界之后
      if (event.type === 'compaction/end') return { boundary: seq, promoted: false }
      if (promote.has(event.type) && seq > state.boundary && !state.promoted) {
        return { ...state, promoted: true }
      }
      return state
    },
    stateVersion: 1,
  }
}

/**
 * 当前 agent 的阶段。agent 缺席（纯清单读取等）或子代理一律已晋级；
 * 投影 unit 未注册（服务缺席 / 尚未注册）时同样回落到已晋级。
 */
export function statusOf(projections, agent) {
  const session = agent?.session
  if (!session) return PROMOTED_STATUS
  if ((session.header?.delegationDepth ?? 0) > 0) return PROMOTED_STATUS
  return projections?.stateOf?.(session, PHASE_PROJECTION_KEY) ?? PROMOTED_STATUS
}

/**
 * 解析一个会话所属的 agent 预设 id：优先宿主 agent-presets 注册的 `agentPreset`
 * 投影（header 记录创建时值，投影随 `agent-preset/selected` 事件推进），
 * 投影缺席（无 roster 的组合）时回落到 header 的创建时值。
 */
export function presetOfSession(projections, session) {
  if (!session) return undefined
  const projected = projections?.stateOf?.(session, 'agentPreset')
  if (typeof projected === 'string') return projected
  return typeof session.header?.agentPreset === 'string' ? session.header.agentPreset : undefined
}
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createPhaseProjection, presetOfSession, statusOf, PHASE_PROJECTION_KEY } from '../lib/promotion.js'

// ── 阶段投影：会话阶段（bootstrap / active）的折叠语义与读取回落 ──────────────
//
// 阶段视图（预览的 ?phase= 与运行时装配）都由本插件注册的会话投影 unit 驱动：
// 宿主按会话折叠（含 resume / reload 后从日志重建）并增量驱动，本插件只在读取端
// 取当前值 —— 不再自行扫历史（Session.events 已在 0.1.2-alpha.4 移除，同步历史读
// 在 0.1.6 已 deprecated）。这里验证 unit 的纯折叠语义（与 durable 会话事件同构，
// 只认 type 与 seq）与 statusOf / presetOfSession 的读取与回落。
//
// 历史：预览曾用 fakeAgentFor 合成伪会话 agent 喂给宿主装配，让旧版预设的
// 阶段裁剪插件在只读预览里运行；最新 harness 的裁剪已移到 agent-loop 层，
// 且 roster 不变量对「未加入预设的 agent」直接 fail —— 预览已改为纯 scope
// 诊断装配，伪会话随之删除，只保留这份阶段语义测试。

/** 按投影契约折叠一串事件（宿主 materializeCells 懒折叠的最小同构）。 */
function fold(projection, events) {
  return events.reduce((state, event) => projection.apply(state, event), projection.init({}, 0))
}

test('bootstrap phase: no events, not promoted, no boundary', () => {
  assert.deepEqual(fold(createPhaseProjection(), []), { boundary: -1, promoted: false })
})

test('compaction phase: compaction/end resets promotion', () => {
  assert.deepEqual(fold(createPhaseProjection(), [{ type: 'compaction/end', seq: 1 }]), { boundary: 1, promoted: false })
})

test('active phase: promotion signal after boundary', () => {
  assert.deepEqual(fold(createPhaseProjection(), [{ type: 'assistant/message', seq: 1 }]), { boundary: -1, promoted: true })
})

test('a signal at the compaction boundary does not promote; a newer one does', () => {
  const events = [
    { type: 'tool/call', seq: 1 },
    { type: 'compaction/end', seq: 2 },
    { type: 'tool/call', seq: 2 }, // 与边界同 seq：不算「边界之后」
  ]
  assert.deepEqual(fold(createPhaseProjection(), events), { boundary: 2, promoted: false })
  events.push({ type: 'tool/call', seq: 3 })
  assert.deepEqual(fold(createPhaseProjection(), events), { boundary: 2, promoted: true })
})

test('unrelated events keep the same state reference (Object.is suppression)', () => {
  const projection = createPhaseProjection()
  const state = { boundary: -1, promoted: true }
  assert.equal(projection.apply(state, { type: 'turn/start', seq: 5 }), state)
})

test('stateSchema validates persisted projection-cache rows', () => {
  const { stateSchema } = createPhaseProjection()
  assert.deepEqual(stateSchema.parse({ boundary: 3, promoted: true }), { boundary: 3, promoted: true })
  assert.throws(() => stateSchema.parse({ boundary: 3 }))
  assert.throws(() => stateSchema.parse({ boundary: 3, promoted: 'yes' }))
})

test('statusOf: no session / subagent / absent projection service all read as promoted', () => {
  assert.deepEqual(statusOf(undefined, undefined), { boundary: -1, promoted: true })
  const subagent = { session: { header: { delegationDepth: 1 } } }
  assert.deepEqual(statusOf({ stateOf: () => ({ boundary: -1, promoted: false }) }, subagent), { boundary: -1, promoted: true })
  assert.deepEqual(statusOf(undefined, { session: { header: {} } }), { boundary: -1, promoted: true })
})

test('statusOf reads the registered phase unit by key', () => {
  const state = { boundary: 7, promoted: false }
  const projections = { stateOf: (_session, key) => (key === PHASE_PROJECTION_KEY ? state : undefined) }
  assert.deepEqual(statusOf(projections, { session: { header: {} } }), state)
})

test('presetOfSession prefers the agentPreset projection, falls back to the header', () => {
  const session = { header: { agentPreset: 'standard' } }
  const projections = { stateOf: (_session, key) => (key === 'agentPreset' ? 'minimal' : undefined) }
  assert.equal(presetOfSession(projections, session), 'minimal')
  assert.equal(presetOfSession(undefined, session), 'standard')
  assert.equal(presetOfSession({ stateOf: () => null }, session), 'standard')
  assert.equal(presetOfSession(undefined, undefined), undefined)
})
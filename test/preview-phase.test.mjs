import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fakeAgentFor } from '../lib/index.js'
import { createPromotion } from '../lib/promotion.js'

// ── 伪会话 agent：预览三态驱动原生阶段裁剪规则 ──────────────────────────────
//
// 预设原生的 bootstrap 插件（zero-tool / router 等）在 assemble 瀑布流里用
// 与 compaction-epoch.mjs 同构的 tracker 读伪 agent 的 durable 事件推导阶段。
// 这里验证 fakeAgentFor 的合成事件经过我们自己的 promotion.status() 后得到
// 与 UI 三态一致的结果（bootstrap 未晋级 / compaction 未晋级 boundary>=0 /
// active 已晋级）。

test('fake agent for bootstrap phase: no events, not promoted, no boundary', () => {
  const agent = fakeAgentFor('bootstrap', 'standard')
  assert.equal(agent.session.id, 'prompt-customizer-preview-bootstrap')
  assert.deepEqual(agent.session.events, [])
  assert.equal(agent.session.header.agentPreset, 'standard')
  assert.equal(agent.session.header.delegationDepth, 0)
  assert.equal(typeof agent.session.header.cwd, 'string')
  assert.equal(agent.options.model, '')
  const status = createPromotion().status(agent)
  assert.deepEqual(status, { boundary: -1, promoted: false })
})

test('fake agent for compaction phase: compaction/end resets promotion', () => {
  const agent = fakeAgentFor('compaction', 'standard')
  assert.deepEqual(agent.session.events, [{ type: 'compaction/end', seq: 1 }])
  const status = createPromotion().status(agent)
  assert.deepEqual(status, { boundary: 1, promoted: false })
})

test('fake agent for active phase: promotion signal after boundary', () => {
  const agent = fakeAgentFor('active', 'standard')
  assert.deepEqual(agent.session.events, [{ type: 'assistant/message', seq: 1 }])
  const status = createPromotion().status(agent)
  assert.deepEqual(status, { boundary: -1, promoted: true })
})

test('fake agent session id is stable per phase (memoize-safe, no unbounded growth)', () => {
  // 原生 tracker 的状态按 session.id 记忆：同一 phase 的 id 必须恒定，
  // 否则反复预览会让宿主进程里的 Map 无限增长。
  assert.equal(fakeAgentFor('bootstrap', 'a').session.id, fakeAgentFor('bootstrap', 'b').session.id)
  assert.notEqual(fakeAgentFor('bootstrap', 'a').session.id, fakeAgentFor('active', 'a').session.id)
})

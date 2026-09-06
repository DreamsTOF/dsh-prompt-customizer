import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createPromotion } from '../lib/promotion.js'

// ── 晋级 tracker：会话阶段（bootstrap / compaction / active）的三态推导 ──────
//
// 阶段视图（预览的 ?phase= 与运行时 promotion.status）都由这份 tracker 驱动：
// durable 事件触发晋级（bootstrap → active），compaction/end 复位到压缩受控期。
// 这里验证最小 agent 形状（与 durable 会话事件同构，只认 type 与 seq）经
// promotion.status() 后得到与 UI 三态一致的结果（未晋级 / boundary>=0 未晋级 /
// 已晋级）。
//
// 历史：预览曾用 fakeAgentFor 合成伪会话 agent 喂给宿主装配，让旧版预设的
// 阶段裁剪插件在只读预览里运行；最新 harness 的裁剪已移到 agent-loop 层，
// 且 roster 不变量对「未加入预设的 agent」直接 fail —— 预览已改为纯 scope
// 诊断装配，伪会话随之删除，只保留这份 tracker 的三态语义测试。

/** 最小 agent 形状（与 promotion.observe 消费的 durable 事件同构）。 */
function agentWith(events) {
  return {
    session: { id: 'test-session', events, header: { delegationDepth: 0, agentPreset: 'standard', cwd: process.cwd(), meta: {} } },
    options: { provider: '', model: '' },
  }
}

test('bootstrap phase: no events, not promoted, no boundary', () => {
  const status = createPromotion().status(agentWith([]))
  assert.deepEqual(status, { boundary: -1, promoted: false })
})

test('compaction phase: compaction/end resets promotion', () => {
  const status = createPromotion().status(agentWith([{ type: 'compaction/end', seq: 1 }]))
  assert.deepEqual(status, { boundary: 1, promoted: false })
})

test('active phase: promotion signal after boundary', () => {
  const status = createPromotion().status(agentWith([{ type: 'assistant/message', seq: 1 }]))
  assert.deepEqual(status, { boundary: -1, promoted: true })
})

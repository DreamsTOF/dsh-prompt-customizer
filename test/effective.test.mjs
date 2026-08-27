import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mergeConfig, filterInjectByPhase, pickToolsFilter, applyToolFilter } from '../lib/effective.js'
import { createPromotion, presetOfSession } from '../lib/promotion.js'

// ── 字段级覆盖合并 ──────────────────────────────────────────────────────────

const GLOBAL = {
  sections: ['a'],
  replace: { a: 'A' },
  inject: [{ name: 'x', order: 0, text: 'X' }],
  tools: { exclude: ['t1'], include: [] },
}

test('empty override falls back to global entirely', () => {
  assert.deepEqual(mergeConfig(GLOBAL, {}), {
    sections: ['a'], replace: { a: 'A' }, inject: [{ name: 'x', order: 0, text: 'X' }], tools: { exclude: ['t1'], include: [] },
  })
})

test('non-empty fields take over, empty ones fall back', () => {
  const merged = mergeConfig(GLOBAL, { sections: ['b'], replace: {}, inject: [], tools: { exclude: [], include: [] } })
  // sections 接管；replace/inject/tools 为空回落全局。
  assert.deepEqual(merged.sections, ['b'])
  assert.deepEqual(merged.replace, { a: 'A' })
  assert.deepEqual(merged.inject, [{ name: 'x', order: 0, text: 'X' }])
  assert.deepEqual(merged.tools, { exclude: ['t1'], include: [] })
})

test('tools take over as a whole when any rule present', () => {
  const merged = mergeConfig(GLOBAL, { tools: { exclude: [], include: ['t2'] } })
  assert.deepEqual(merged.tools, { exclude: [], include: ['t2'] })
})

test('bootstrap-only tools config counts as an override', () => {
  const merged = mergeConfig(GLOBAL, { tools: { bootstrap: { include: ['bash'] } } })
  assert.deepEqual(merged.tools, { bootstrap: { include: ['bash'] } })
})

test('missing global fields default sanely', () => {
  assert.deepEqual(mergeConfig(undefined, undefined), { sections: [], replace: {}, inject: [], tools: {} })
})

// ── 阶段过滤 ────────────────────────────────────────────────────────────────

const INJECT = [
  { name: 'always', phase: 'always' },
  { name: 'boot', phase: 'bootstrap' },
  { name: 'post', phase: 'active' },
]

test('pre-promotion keeps always+bootstrap, drops active', () => {
  assert.deepEqual(filterInjectByPhase(INJECT, false).map((x) => x.name), ['always', 'boot'])
})

test('promoted keeps always+active, drops bootstrap', () => {
  assert.deepEqual(filterInjectByPhase(INJECT, true).map((x) => x.name), ['always', 'post'])
})

test('unknown or missing phase behaves like always', () => {
  const weird = [...INJECT, { name: 'w', phase: 'nonsense' }, { name: 'n', text: '' }]
  // w/n 按 always 保留，boot 被丢弃：promoted 视图 = always×2 + post + n。
  assert.equal(filterInjectByPhase(weird, true).length, 4)
  assert.deepEqual(filterInjectByPhase(undefined, true), [])
})

// ── 工具阶段选择与过滤 ──────────────────────────────────────────────────────

const TOOLS = [{ name: 'a' }, { name: 'b' }, { name: 'c' }]

test('pre-promotion uses the bootstrap keep-set when configured', () => {
  const cfg = { exclude: ['a'], include: [], bootstrap: { exclude: [], include: ['b'] } }
  assert.deepEqual(pickToolsFilter(cfg, false), { exclude: [], include: ['b'] })
  assert.deepEqual(pickToolsFilter(cfg, true), { exclude: ['a'], include: [] })
})

test('empty bootstrap catalog never activates phasing', () => {
  const cfg = { exclude: ['a'], include: [], bootstrap: { exclude: [], include: [] } }
  assert.deepEqual(pickToolsFilter(cfg, false), { exclude: ['a'], include: [] })
})

test('applyToolFilter matches previous include/exclude semantics', () => {
  assert.deepEqual(applyToolFilter(TOOLS, { exclude: ['b'], include: [] }).map((t) => t.name), ['a', 'c'])
  assert.deepEqual(applyToolFilter(TOOLS, { exclude: ['b'], include: ['c'] }).map((t) => t.name), ['c'])
  assert.deepEqual(applyToolFilter(TOOLS, { exclude: [], include: [] }).length, 3)
})

// ── 晋级 tracker ────────────────────────────────────────────────────────────

function sessionOf(events, header = {}) {
  return { id: 's1', header, events }
}

test('cold scan promotes after first durable signal', () => {
  const p = createPromotion()
  const s = sessionOf([
    { seq: 1, type: 'user/message' },
    { seq: 2, type: 'tool/call' },
  ])
  assert.equal(p.status({ session: s }).promoted, true)
})

test('no signal stays in bootstrap; compaction resets promotion', () => {
  const p = createPromotion()
  const s = sessionOf([{ seq: 1, type: 'user/message' }])
  assert.equal(p.status({ session: s }).promoted, false)
  s.events.push({ seq: 2, type: 'assistant/message' }, { seq: 3, type: 'compaction/end' }, { seq: 4, type: 'user/message' })
  const p2 = createPromotion() // 冷扫重新推导（等价 resume）
  assert.equal(p2.status({ session: s }).promoted, false)
})

test('observe is incremental and epoch-aware', () => {
  const p = createPromotion()
  const s = sessionOf([])
  p.observe(s, { seq: 1, type: 'compaction/end' }) // 未登记的会话被忽略
  p.status({ session: s })
  p.observe(s, { seq: 1, type: 'compaction/end' })
  assert.equal(p.status({ session: s }).promoted, false)
  p.observe(s, { seq: 2, type: 'tool/call' })
  assert.equal(p.status({ session: s }).promoted, true)
  p.observe(s, { seq: 3, type: 'compaction/end' })
  assert.equal(p.status({ session: s }).promoted, false)
})

test('subagents are always promoted; missing agent too', () => {
  const p = createPromotion()
  assert.equal(p.status(undefined).promoted, true)
  assert.equal(p.status({}).promoted, true)
  const sub = sessionOf([], { delegationDepth: 1 })
  assert.equal(p.status({ session: sub }).promoted, true)
})

// ── 会话所属预设解析 ────────────────────────────────────────────────────────

test('preset resolution prefers the newest selection event over the header', () => {
  const s = sessionOf([
    { seq: 1, type: 'agent-preset/selected', data: { agentPreset: 'one' } },
    { seq: 2, type: 'agent-preset/selected', data: { agentPreset: 'two' } },
  ], { agentPreset: 'zero' })
  assert.equal(presetOfSession(s), 'two')
})

test('preset resolution tolerates missing header/events', () => {
  assert.equal(presetOfSession(undefined), undefined)
  assert.equal(presetOfSession({ events: [] }), undefined)
})

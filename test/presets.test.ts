import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  addImportedPresets,
  buildPresetData,
  deriveCycle,
  mergeSections,
  phaseSignature,
  removeSection,
  resolveOrder,
  toggleTool,
  type Section,
} from '../src/client/presets.ts'
import type { Config } from '../src/client/types.ts'

// 宏观行为（预设切换、屏蔽存活、名单外默认禁用、工具过滤、来源标识存活等）
// 由 test/chaos.test.ts 与 test/chaos-super.test.ts 的不变量网络覆盖。
// 本文件只保留两类用例：
//   1) 混沌难以随机命中的「构造性边界」（锚环、幽灵锚、脏导入等）；
//   2) 曾出现过的缺陷的「精确回归」（order 空洞、黑白名单残留、文本固化）。

function invOf(names: string[]) {
  return {
    sections: names.map((n, i) => ({ name: n, order: i, text: 't' + n, active: true, replaced: false })),
    tools: [],
  }
}

// ── resolveOrder：构造性边界 ─────────────────────────────────────────────────

test('resolveOrder: anchored chain, multi-root and missing-anchor fallback', () => {
  const res = resolveOrder([
    { name: 'a', after: undefined, text: '' },
    { name: 'c', after: 'b', text: '' },
    { name: 'b', after: 'a', text: '' },
    { name: 'x', after: 'ghost', text: '' },
  ])
  assert.deepEqual(res.map((x) => x.name), ['a', 'b', 'c', 'x'])
  assert.deepEqual(res.map((x) => x.order), [0, 1, 2, 3])
})

test('resolveOrder: cycle is broken by appending unresolved members', () => {
  const res = resolveOrder([
    { name: 'a', after: 'c', text: '' },
    { name: 'c', after: 'a', text: '' },
  ])
  assert.deepEqual(res.map((x) => x.name), ['a', 'c'])
})

test('resolveOrder: carries text and the hidden custom marker through', () => {
  const res = resolveOrder([{ name: 'a', after: undefined, text: 'HELLO', custom: true }])
  assert.deepEqual(res, [{ name: 'a', order: 0, text: 'HELLO', custom: true }])
})

// ── 来源标识判定：隐藏标识优先于名字碰撞 ─────────────────────────────────────

test('mergeSections: custom marker wins over a name collision with the inventory', () => {
  const merged = mergeSections(invOf(['x']), { inject: [{ name: 'x', order: 0, text: 'mine', custom: true }] }, new Set())
  const x = merged.find((sec) => sec.name === 'x')!
  assert.equal(x.source, 'custom')
  assert.equal(x.text, 'mine')
})

test('mergeSections: reordering an inventory section without the marker stays system', () => {
  // 真实用法里客户端会持久化全部段的连续虚拟下标；此处按同样方式只重排
  // （a/b 对调），不携带 custom 标记 —— 来源必须保持 system（由隐藏标记决定，
  // 与名字碰撞无关）。合并视图输出的是连续 0..n-1 虚拟下标，而非注入时的
  // 原始 order 值（那是面板 #N 徽标的既有契约）。
  const merged = mergeSections(
    invOf(['a', 'b']),
    {
      inject: [
        { name: 'b', order: 0, text: '', custom: false },
        { name: 'a', order: 1, text: '', custom: false },
      ],
    },
    new Set(),
  )
  assert.deepEqual(merged.map((x) => x.name), ['b', 'a'])
  assert.deepEqual(merged.map((x) => x.order), [0, 1])
  assert.ok(merged.every((x) => x.source === 'system'))
})

// ── 回归：预设快照不得固化系统段的动态文本 ───────────────────────────────────

test('buildPresetData: only custom sections carry their text into the order list', () => {
  const merged: Section[] = [
    { name: 'sys', order: 0, text: '<动态生成>', active: true, replaced: false, source: 'system' },
    { name: 'cust', order: 1, text: 'my text', active: true, replaced: false, source: 'custom' },
  ]
  const data = buildPresetData({}, merged)
  assert.equal(data.order![0]!.text, '')
  assert.equal(data.order![0]!.custom, false)
  assert.equal(data.order![1]!.text, 'my text')
  assert.equal(data.order![1]!.custom, true)
})

// ── 回归：删除手动段不得留下 order 空洞 ─────────────────────────────────────

test('removeSection cleans inject/sections/replace and re-indexes orders contiguously', () => {
  const cfg: Config = {
    sections: ['c2'],
    // 故意制造非连续 order（如旧版本遗留），删除 c2 后必须重排为 0..n-1。
    inject: [
      { name: 'c0', order: 0, text: 'a', custom: true },
      { name: 'c2', order: 3, text: 'c', custom: true },
      { name: 'c1', order: 7, text: 'b', custom: true },
    ],
    replace: { c2: 'r', keep: 'q' },
  }
  const patch = removeSection('c2', cfg)
  assert.deepEqual(patch.sections, [])
  assert.deepEqual(patch.inject.map((x) => x.name), ['c0', 'c1'])
  assert.deepEqual(patch.inject.map((x) => x.order), [0, 1])
  assert.deepEqual(patch.replace, { keep: 'q' })
})

// ── 回归：白名单模式重新显示工具必须清除黑名单残留 ───────────────────────────

test('toggleTool in include mode clears a stale exclude entry when re-showing', () => {
  // t0 同时挂在 exclude（历史残留）；白名单模式下重新显示它时必须两边都干净。
  const out = toggleTool('t0', true, { exclude: ['t0'], include: ['t1'] })
  assert.deepEqual(out, { exclude: [], include: ['t1', 't0'] })
  // 黑名单模式下不受影响。
  const back = toggleTool('t0', true, { exclude: ['t0'], include: [] })
  assert.deepEqual(back, { exclude: [], include: [] })
})

// ── 导入：脏数据过滤与同名跳过 ───────────────────────────────────────────────

test('addImportedPresets filters junk entries and skips same-name presets', () => {
  const existing = [{ id: 'p1', name: 'A', data: {} }]
  let n = 0
  const out = addImportedPresets(existing, [
    { data: {} }, 42, null,
    { name: 'A', data: {} },
    { name: 'B', data: {} },
  ], () => 'p' + (++n))
  assert.deepEqual(out.map((p) => p.name), ['A', 'B'])
})

// ── agent 周期推导：deriveCycle / phaseSignature ─────────────────────────────

function previewOf(name: string, sectionNames: string[], toolNames: string[], text = ''): { name: string; sections: Array<{ name: string; text: string }>; text: string; tools: Array<{ name: string; description: string }> } {
  return { name, sections: sectionNames.map((n) => ({ name: n, text: 't' + n })), text, tools: toolNames.map((n) => ({ name: n, description: '' })) }
}

test('deriveCycle: anchored 风格三态签名互异 → 三个阶段全部保留', () => {
  const views = {
    bootstrap: previewOf('b', ['a', 'b'], ['bash', 'str_replace_editor']),
    compaction: previewOf('c', ['a', 'b'], ['bash', 'read', 'write', 'edit', 'glob', 'grep', 'ask_user_question', 'todo_write']),
    active: previewOf('a', ['a', 'b'], ['bash', 'str_replace_editor', 'dev_tool_search', 'skill_search', 'skill_load']),
  }
  const cycle = deriveCycle(views)
  assert.deepEqual(cycle.map((e) => e.key), ['bootstrap', 'compaction', 'active'])
  assert.ok(cycle.every((e) => e.merged.length === 1))
})

test('deriveCycle: 三态同形（standard / minimal）折叠为单个常驻阶段', () => {
  const same = previewOf('x', ['a', 'b'], ['read', 'write', 'edit'], 'TEXT')
  const cycle = deriveCycle({ bootstrap: same, compaction: { ...same, name: 'c' }, active: { ...same, name: 'a' } })
  assert.deepEqual(cycle.map((e) => e.key), ['bootstrap'])
  assert.deepEqual(cycle[0]!.merged, ['bootstrap', 'compaction', 'active'])
})

test('deriveCycle: 只差渲染文本也算不同阶段（提示词不同即一阶段）', () => {
  const a = previewOf('b', ['a', 'b'], ['read', 'write'], 'PERSONA-A')
  const b = previewOf('a', ['a', 'b'], ['read', 'write'], 'PERSONA-B')
  const cycle = deriveCycle({ bootstrap: a, compaction: a, active: b })
  assert.deepEqual(cycle.map((e) => e.key), ['bootstrap', 'active'])
  assert.deepEqual(cycle[0]!.merged, ['bootstrap', 'compaction'])
})

test('deriveCycle: 拉取失败的 null 装配绝不与其它阶段折叠', () => {
  const ok = previewOf('a', ['a'], ['read'], 'T')
  const cycle = deriveCycle({ bootstrap: null, compaction: ok, active: ok })
  assert.deepEqual(cycle.map((e) => e.key), ['bootstrap', 'compaction'])
  assert.ok(cycle.some((e) => e.key === 'bootstrap' && e.merged.length === 1))
})

test('phaseSignature: 工具顺序不影响签名（稳定排序）', () => {
  const p1 = previewOf('x', ['a'], ['read', 'write'])
  const p2 = previewOf('x', ['a'], ['write', 'read'])
  assert.equal(phaseSignature('active', p1), phaseSignature('active', p2))
  // 段序影响签名（提示词顺序不同）
  const p3 = previewOf('x', ['b', 'a'], ['read', 'write'])
  assert.notEqual(phaseSignature('active', p1), phaseSignature('active', p3))
})

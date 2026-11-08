/** 客户端阶段纯函数（src/client/prompt/phase-ops.ts）的 EntryRef 契约。 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { entryKey } from '../src/client/prompt/types.ts'
import {
  blockPatch,
  phaseInjectEntries,
  phaseRows,
  mirroredDeniedLists,
  toolFieldOf,
  sectionFieldOf,
} from '../src/client/prompt/phase-ops.ts'

const G = { kind: 'global' }
const P = { kind: 'preset', id: 'p1' }
const ref = (name, source) => (source === undefined ? { name } : { name, source })
const view = (baseSections, sections = baseSections) => ({ ok: true, text: '', tools: [], baseSections, sections })

test('阶段字段由 PHASES 派生：section/context/tool 字段不再手写三态', () => {
  assert.equal(sectionFieldOf('bootstrap'), 'sectionsBootstrap')
  assert.equal(sectionFieldOf('active'), 'sections')
  assert.equal(sectionFieldOf('compaction'), 'sectionsCompaction')
  assert.equal(toolFieldOf('bootstrap'), 'bootstrap')
  assert.equal(toolFieldOf('active'), 'static')
  assert.equal(toolFieldOf('compaction'), 'compaction')
})

test('phaseRows: 同名不同源各占一行，互不覆盖', () => {
  const base = [
    { name: 'same', source: G, text: 'GLOBAL', blocked: false, replaced: false },
    { name: 'same', source: P, text: 'PRESET', blocked: false, replaced: false },
  ]
  const rows = phaseRows({}, view(base), 'active')
  assert.equal(rows.length, 2)
  assert.equal(new Set(rows.map(entryKey)).size, 2)
  assert.equal(rows.find((row) => row.source.kind === 'global').text, 'GLOBAL')
  assert.equal(rows.find((row) => row.source.kind === 'preset').text, 'PRESET')
})

test('phaseRows: dynamic 只读服务端标记；缺省保持 undefined（不猜）', () => {
  const rows = phaseRows({}, view([
    { name: 'normal', source: G, text: 'TEXT', blocked: false, replaced: false, dynamic: false },
    { name: 'generated', source: G, text: '<dynamic>', blocked: false, replaced: false, dynamic: true },
    { name: 'legacy', source: G, text: '<dynamic>', blocked: false, replaced: false },
  ]), 'active')
  assert.equal(rows.find((row) => row.name === 'normal').dynamic, false)
  assert.equal(rows.find((row) => row.name === 'generated').dynamic, true)
  assert.equal(rows.find((row) => row.name === 'legacy').dynamic, undefined)
})

test('blockPatch: 只写本阶段名单，返回 EntryRef[]', () => {
  const cfg = { sections: [], sectionsBootstrap: [ref('old', G)] }
  const patch = blockPatch(cfg, 'bootstrap', ref('x', P), true)
  assert.deepEqual(patch, { sectionsBootstrap: [ref('old', G), ref('x', P)] })
  assert.equal('sections' in patch, false)
  // 已存在 → 空补丁（不写盘）
  assert.deepEqual(blockPatch(cfg, 'bootstrap', ref('old', G), true), {})
  assert.deepEqual(blockPatch(cfg, 'bootstrap', ref('old', G), false), { sectionsBootstrap: [] })
})

test('phaseInjectEntries: order 从 0 连续生成，保留其它阶段 / always 条目', () => {
  const cfg = {
    inject: [
      { name: 'always-note', order: 5, text: 'A', phase: 'always', custom: true },
      { name: 'other-phase', order: 3, text: '', phase: 'compaction' },
      { name: 'stale', order: 9, text: '', phase: 'active' },
    ],
  }
  const rows = [
    { name: 'a', source: G, text: '', custom: false, override: '' },
    { name: 'b', source: P, text: 'B', custom: true, override: 'B' },
  ]
  const out = phaseInjectEntries(cfg, 'active', rows)
  assert.deepEqual(out.map((item) => [item.name, item.phase, item.order, item.custom]), [
    ['always-note', 'always', 5, true],
    ['other-phase', 'compaction', 3, undefined],
    ['a', 'active', 0, false],
    ['b', 'active', 1, true],
  ])
  assert.deepEqual(out.find((item) => item.name === 'b').source, P)
})

test('mirroredDeniedLists: 三份名单都是 EntryRef（含 source）', () => {
  const rows = [
    { name: 'blocked', source: P, text: '', custom: false, override: '', blocked: true },
    { name: 'visible', source: G, text: '', custom: false, override: '', blocked: false },
  ]
  assert.deepEqual(mirroredDeniedLists(rows), {
    sections: [ref('blocked', P)],
    sectionsBootstrap: [ref('blocked', P)],
    sectionsCompaction: [ref('blocked', P)],
  })
})

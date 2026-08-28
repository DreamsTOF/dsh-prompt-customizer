/**
 * 提示词段面板纯逻辑单测：与 SectionsTab.tsx 共用 lib/sectionOps.mjs。
 * 覆盖：阶段映射、每阶段独立屏蔽（写回目标 + union 恢复）、行重排/拖入、
 * 逐阶段持久化（虚拟 order 连续编号）。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  sectionListOf,
  injectPhaseOf,
  acceptsInjectFor,
  deniedNames,
  blockPatch,
  reorderInsert,
  phaseInjectEntries,
} from '../lib/sectionOps.mjs'

const ENTRY = {
  singleton: { key: 'bootstrap', merged: ['bootstrap'] },
  compact: { key: 'compaction', merged: ['compaction'] },
  active: { key: 'active', merged: ['active'] },
  merged: { key: 'bootstrap', merged: ['bootstrap', 'active', 'compaction'] },
}

test('阶段 → 名单写回目标 / 注入阶段 映射', () => {
  assert.equal(sectionListOf(ENTRY.singleton), 'bootstrap')
  assert.equal(sectionListOf(ENTRY.compact), 'compaction')
  assert.equal(sectionListOf(ENTRY.active), 'global')
  assert.equal(sectionListOf(ENTRY.merged), 'global')

  assert.equal(injectPhaseOf(ENTRY.singleton), 'bootstrap')
  assert.equal(injectPhaseOf(ENTRY.compact), 'compaction')
  assert.equal(injectPhaseOf(ENTRY.active), 'active')
  assert.equal(injectPhaseOf(ENTRY.merged), 'always')
})

test('注入段出现在哪些阶段部分（acceptsInjectFor 矩阵）', () => {
  assert.ok(acceptsInjectFor(ENTRY.singleton, 'always'))
  assert.ok(acceptsInjectFor(ENTRY.singleton, 'bootstrap'))
  assert.ok(!acceptsInjectFor(ENTRY.singleton, 'compaction'))
  assert.ok(!acceptsInjectFor(ENTRY.singleton, 'active'))
  assert.ok(acceptsInjectFor(ENTRY.compact, 'compaction'))
  assert.ok(acceptsInjectFor(ENTRY.compact, 'bootstrap')) // 引导期注入也覆盖压缩窗口
  assert.ok(!acceptsInjectFor(ENTRY.active, 'bootstrap'))
  assert.ok(acceptsInjectFor(ENTRY.active, 'active'))
  assert.ok(acceptsInjectFor(ENTRY.active, 'always'))
})

test('每阶段独立屏蔽名单 = 全局 + 阶段 union', () => {
  const cfg = { sections: ['a'], sectionsBootstrap: ['b'], sectionsCompaction: ['c'] }
  assert.deepEqual(deniedNames(cfg, ENTRY.singleton), ['a', 'b'])
  assert.deepEqual(deniedNames(cfg, ENTRY.compact), ['a', 'c'])
  assert.deepEqual(deniedNames(cfg, ENTRY.active), ['a'])
  assert.deepEqual(deniedNames(cfg, ENTRY.merged), ['a'])
})

test('屏蔽写回目标：引导期 → sectionsBootstrap，常驻期 → sections', () => {
  const cfg = { sections: [], sectionsBootstrap: [] }
  const boot = blockPatch(cfg, ENTRY.singleton, 'x', true)
  assert.deepEqual(boot, { sectionsBootstrap: ['x'] })
  const act = blockPatch(cfg, ENTRY.active, 'x', true)
  assert.deepEqual(act, { sections: ['x'] })
})

test('恢复是 union 安全的：同时从阶段名单与全局名单移除', () => {
  const cfg = { sections: ['x'], sectionsBootstrap: ['x', 'y'] }
  const patch = blockPatch(cfg, ENTRY.singleton, 'x', false)
  // 从 sectionsBootstrap 移除，且全局 sections 里的 x 一并清掉（否则仍被挡）。
  assert.deepEqual(patch, { sectionsBootstrap: ['y'], sections: [] })
  // 只存在全局时也能恢复
  const patch2 = blockPatch(cfg, ENTRY.active, 'x', false)
  assert.deepEqual(patch2, { sections: [] })
})

test('重排：上移/下移一格', () => {
  const rows = [
    { name: 'a', custom: false },
    { name: 'b', custom: false },
    { name: 'c', custom: true, text: 'C' },
  ]
  const up = reorderInsert(rows, 'c', 'b', 'above')
  assert.deepEqual(up.map((r) => r.name), ['a', 'c', 'b'])
  const down = reorderInsert(rows, 'a', 'b', 'below')
  assert.deepEqual(down.map((r) => r.name), ['b', 'a', 'c'])
})

test('拖入：新段插入到目标行上/下方（v1 语义）', () => {
  const rows = [{ name: 'a', custom: false }, { name: 'b', custom: false }]
  const above = reorderInsert(rows, 'z', 'b', 'above', { name: 'z', custom: false })
  assert.deepEqual(above.map((r) => r.name), ['a', 'z', 'b'])
  const below = reorderInsert(rows, 'z2', 'a', 'below', { name: 'z2', custom: false })
  assert.deepEqual(below.map((r) => r.name), ['a', 'z2', 'b'])
  // 未知目标行 → null（调用方 no-op）
  assert.equal(reorderInsert(rows, 'z', 'nope', 'above'), null)
})

test('逐阶段持久化：连续虚拟 order，系统行空文本，custom 行保留文本，其它阶段/常驻注入不动', () => {
  const cfg = {
    inject: [
      { name: 'always-one', order: 120, text: 'A', phase: 'always', custom: false },
      { name: 'other-active', order: 5, text: 'O', phase: 'active', custom: false },
    ],
  }
  const rows = [
    { name: 'sys-a', custom: false, text: 'SYS' },
    { name: 'my-sec', custom: true, text: 'MINE' },
  ]
  const list = phaseInjectEntries(cfg, ENTRY.singleton, rows)
  // 其它阶段 + always 条目原样保留在最前
  assert.equal(list[0].name, 'always-one')
  assert.equal(list[1].name, 'other-active')
  // 本阶段条目：连续 order 0,1；系统行空文本；custom 行保留文本
  assert.deepEqual(list[2], { name: 'sys-a', order: 0, text: '', phase: 'bootstrap', custom: false })
  assert.deepEqual(list[3], { name: 'my-sec', order: 1, text: 'MINE', phase: 'bootstrap', custom: true })
})

test('压缩受控期持久化写入 compaction 阶段条目', () => {
  const list = phaseInjectEntries({ inject: [] }, ENTRY.compact, [{ name: 's', custom: true, text: 'T' }])
  assert.deepEqual(list, [{ name: 's', order: 0, text: 'T', phase: 'compaction', custom: true }])
})
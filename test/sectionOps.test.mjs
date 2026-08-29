/**
 * 提示词段面板纯逻辑单测：与 SectionsTab.tsx 共用 lib/sectionOps.mjs。
 * 覆盖：阶段映射、每阶段独立屏蔽（写回目标 + union 恢复）、注入身份与删除背书、
 * 阶段独立的文本通道、行重排/拖入、逐阶段持久化（虚拟 order 连续编号）。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  sectionListOf,
  injectPhaseOf,
  acceptsInjectFor,
  deniedNames,
  injectedAt,
  blockPatch,
  reorderInsert,
  phaseInjectEntries,
} from '../lib/sectionOps.mjs'

test('阶段 → 名单写回目标 / 注入阶段 映射', () => {
  assert.equal(sectionListOf('bootstrap'), 'bootstrap')
  assert.equal(sectionListOf('compaction'), 'compaction')
  assert.equal(sectionListOf('active'), 'global')

  assert.equal(injectPhaseOf('bootstrap'), 'bootstrap')
  assert.equal(injectPhaseOf('compaction'), 'compaction')
  assert.equal(injectPhaseOf('active'), 'active')
})

test('注入段出现在哪些阶段部分（acceptsInjectFor 矩阵）', () => {
  assert.ok(acceptsInjectFor('bootstrap', 'always'))
  assert.ok(acceptsInjectFor('bootstrap', 'bootstrap'))
  assert.ok(!acceptsInjectFor('bootstrap', 'compaction'))
  assert.ok(!acceptsInjectFor('bootstrap', 'active'))
  assert.ok(acceptsInjectFor('compaction', 'compaction'))
  assert.ok(!acceptsInjectFor('compaction', 'bootstrap')) // 三态互相独立：引导期注入不进压缩期
  assert.ok(!acceptsInjectFor('compaction', 'active'))
  assert.ok(!acceptsInjectFor('active', 'bootstrap'))
  assert.ok(!acceptsInjectFor('active', 'compaction'))
  assert.ok(acceptsInjectFor('active', 'active'))
  assert.ok(acceptsInjectFor('active', 'always'))
})

test('每阶段独立屏蔽名单 = 全局 + 阶段 union', () => {
  const cfg = { sections: ['a'], sectionsBootstrap: ['b'], sectionsCompaction: ['c'] }
  assert.deepEqual(deniedNames(cfg, 'bootstrap'), ['a', 'b'])
  assert.deepEqual(deniedNames(cfg, 'compaction'), ['a', 'c'])
  assert.deepEqual(deniedNames(cfg, 'active'), ['a'])
})

test('injectedAt：本部分可见的注入段名 / 自定义身份 / 草稿序', () => {
  const cfg = {
    inject: [
      { name: 'always-sec', order: 3, text: 'A', phase: 'always', custom: true },
      { name: 'boot-sec', order: 7, text: 'B', phase: 'bootstrap', custom: true },
      { name: 'sys-order-only', order: 9, text: '', phase: 'bootstrap', custom: false },
    ],
  }
  const boot = injectedAt(cfg, 'bootstrap')
  // always + 本阶段条目都可见；自定义身份只认 custom 标记
  assert.deepEqual([...boot.names].sort(), ['always-sec', 'boot-sec', 'sys-order-only'])
  assert.deepEqual([...boot.custom], ['always-sec', 'boot-sec'])
  assert.equal(boot.text.get('always-sec'), 'A')
  // 草稿序只收本阶段专属条目（每阶段各有自己的 order 空间）
  assert.equal(boot.order.get('boot-sec'), 7)
  assert.equal(boot.order.get('sys-order-only'), 9)
  assert.equal(boot.order.has('always-sec'), false)

  const active = injectedAt(cfg, 'active')
  assert.deepEqual([...active.names], ['always-sec'])
  assert.equal(active.order.has('boot-sec'), false)
})

test('injectedAt 回归：删掉的自定义段立刻失去背书，不会以系统段复活', () => {
  // 保存后 post 视图（上次装配结果）里仍有 custom-sec，而草稿已删掉条目。
  const saved = { inject: [{ name: 'custom-sec', order: 0, text: 'mine', phase: 'bootstrap', custom: true }] }
  assert.ok(injectedAt(saved, 'bootstrap').names.has('custom-sec'))
  const gone = injectedAt({ inject: [] }, 'bootstrap')
  assert.equal(gone.names.has('custom-sec'), false)
  assert.equal(gone.custom.has('custom-sec'), false)
  // always 形态的自定义段（预设应用 / 导入产生）在三个阶段都可见，否则删不掉
  const always = injectedAt({ inject: [{ name: 'x', order: 0, text: 'T', custom: true }] }, 'compaction')
  assert.ok(always.names.has('x') && always.custom.has('x'))
})

test('屏蔽写回目标：引导期 → sectionsBootstrap，常驻期 → sections', () => {
  const cfg = { sections: [], sectionsBootstrap: [] }
  const boot = blockPatch(cfg, 'bootstrap', 'x', true)
  assert.deepEqual(boot, { sectionsBootstrap: ['x'] })
  const act = blockPatch(cfg, 'active', 'x', true)
  assert.deepEqual(act, { sections: ['x'] })
})

test('恢复是 union 安全的：同时从阶段名单与全局名单移除', () => {
  const cfg = { sections: ['x'], sectionsBootstrap: ['x', 'y'] }
  const patch = blockPatch(cfg, 'bootstrap', 'x', false)
  // 从 sectionsBootstrap 移除，且全局 sections 里的 x 一并清掉（否则仍被挡）。
  assert.deepEqual(patch, { sectionsBootstrap: ['y'], sections: [] })
  // 只存在全局时也能恢复
  const patch2 = blockPatch(cfg, 'active', 'x', false)
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
  const list = phaseInjectEntries(cfg, 'bootstrap', rows)
  // 其它阶段 + always 条目原样保留在最前
  assert.equal(list[0].name, 'always-one')
  assert.equal(list[1].name, 'other-active')
  // 本阶段条目：连续 order 0,1；系统行空文本；custom 行保留文本
  assert.deepEqual(list[2], { name: 'sys-a', order: 0, text: '', phase: 'bootstrap', custom: false })
  assert.deepEqual(list[3], { name: 'my-sec', order: 1, text: 'MINE', phase: 'bootstrap', custom: true })
})

test('压缩受控期持久化写入 compaction 阶段条目', () => {
  const list = phaseInjectEntries({ inject: [] }, 'compaction', [{ name: 's', custom: true, text: 'T' }])
  assert.deepEqual(list, [{ name: 's', order: 0, text: 'T', phase: 'compaction', custom: true }])
})
// ── 阶段独立的文本通道（回归：改一个阶段的文本不能波及其它阶段） ───────────

const TEXT_CFG = {
  inject: [
    { name: 'sys', order: 0, text: 'BOOT-TEXT', phase: 'bootstrap', custom: false },
    { name: 'mine', order: 1, text: 'MY-BOOT', phase: 'bootstrap', custom: true },
    { name: 'sys', order: 0, text: 'ACT-TEXT', phase: 'active', custom: false },
    { name: 'cross', order: 2, text: 'ALWAYS', phase: 'always', custom: true },
  ],
}

test('injectedAt.text 收本阶段的用户文本：系统段的替换文本与自定义段文本都算', () => {
  const boot = injectedAt(TEXT_CFG, 'bootstrap')
  assert.equal(boot.text.get('sys'), 'BOOT-TEXT')
  assert.equal(boot.text.get('mine'), 'MY-BOOT')
  // 常驻期那份同名条目不会漏进引导期；跨阶段的 always 条目三个阶段都看得到。
  const act = injectedAt(TEXT_CFG, 'active')
  assert.equal(act.text.get('sys'), 'ACT-TEXT')
  assert.equal(boot.text.get('cross'), 'ALWAYS')
  assert.equal(act.text.get('cross'), 'ALWAYS')
  // 压缩受控期既没有自己的 sys 文本也没有 always 之外的文本。
  const comp = injectedAt(TEXT_CFG, 'compaction')
  assert.ok(!comp.text.has('sys'))
  assert.equal(comp.text.get('cross'), 'ALWAYS')
})

test('重排只改顺序，不抹掉本阶段的替换文本', () => {
  const cfg = {
    inject: [
      { name: 'sys', order: 0, text: 'BOOT', phase: 'bootstrap', custom: false },
      { name: 'other', order: 1, text: '', phase: 'bootstrap', custom: false },
    ],
  }
  const rows = [
    { name: 'other', custom: false, text: 'O', override: '' },
    { name: 'sys', custom: false, text: 'S', override: 'BOOT' },
  ]
  assert.deepEqual(phaseInjectEntries(cfg, 'bootstrap', rows), [
    { name: 'other', order: 0, text: '', phase: 'bootstrap', custom: false },
    { name: 'sys', order: 1, text: 'BOOT', phase: 'bootstrap', custom: false },
  ])
})

test('还原（override 置空）后系统行回到仅 order 覆盖；自定义段仍带自己的文本', () => {
  const rows = [
    { name: 'sys', custom: false, text: '', override: '' },
    { name: 'mine', custom: true, text: 'MINE', override: '' },
  ]
  const list = phaseInjectEntries({ inject: [] }, 'active', rows)
  assert.deepEqual(list, [
    { name: 'sys', order: 0, text: '', phase: 'active', custom: false },
    { name: 'mine', order: 1, text: 'MINE', phase: 'active', custom: true },
  ])
})

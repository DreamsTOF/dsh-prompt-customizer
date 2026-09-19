/**
 * 提示词段面板纯逻辑单测：与 SectionsTab.tsx 共用 lib/sectionOps.mjs。
 * 覆盖：阶段映射、每阶段独立屏蔽（三态互不继承）、注入身份与删除背书、
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
  mergedPhaseInjectEntries,
  phaseRows,
  mirroredRows,
  mirrorPhaseInjectEntries,
  mirroredDeniedLists,
  mirrorSkippedNames,
  zhMergedInjectEntries,
  zhRevertInjectEntries,
  zhApplied,
} from '../vendor/prompt-customizer/sectionOps.mjs'
import { applySectionPolicy } from '../vendor/prompt-customizer/effective.js'

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

test('每阶段独立屏蔽名单：三态互不继承', () => {
  const cfg = { sections: ['a'], sectionsBootstrap: ['b'], sectionsCompaction: ['c'] }
  assert.deepEqual(deniedNames(cfg, 'bootstrap'), ['b'])
  assert.deepEqual(deniedNames(cfg, 'compaction'), ['c'])
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

test('恢复是阶段独立的：只动本阶段名单，不碰其它阶段', () => {
  const cfg = { sections: ['x'], sectionsBootstrap: ['x', 'y'] }
  const patch = blockPatch(cfg, 'bootstrap', 'x', false)
  // 只从 sectionsBootstrap 移除；全局 sections 里的 x 保持不变（引导期解除
  // 屏蔽不再连带改动常驻期）。
  assert.deepEqual(patch, { sectionsBootstrap: ['y'] })
  // 只存在全局时也能恢复（常驻期名单）
  const patch2 = blockPatch(cfg, 'active', 'x', false)
  assert.deepEqual(patch2, { sections: [] })
  // 常驻期屏蔽只写 sections，绝不写进阶段名单
  const actBlock = blockPatch(cfg, 'active', 'z', true)
  assert.deepEqual(actBlock, { sections: ['x', 'z'] })
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

test('三态同步持久化：一次写全三个阶段，always 条目原样保留', () => {
  const cfg = {
    inject: [
      { name: 'x', order: 0, text: 'ALWAYS', custom: true },
      { name: 'stale', order: 9, text: 'OLD', phase: 'compaction', custom: true },
    ],
  }
  const list = mergedPhaseInjectEntries(cfg, {
    bootstrap: [{ name: 'sys', custom: false, text: '', override: 'BOOT' }],
    active: [{ name: 'sys', custom: false, text: '', override: '' }],
    compaction: [{ name: 'fresh', custom: true, text: 'NEW', override: '' }],
  })
  // always 原样保留在最前；stale 的旧 compaction 条目被本阶段新条目替换
  assert.deepEqual(list, [
    { name: 'x', order: 0, text: 'ALWAYS', custom: true },
    { name: 'sys', order: 0, text: 'BOOT', phase: 'bootstrap', custom: false },
    { name: 'sys', order: 0, text: '', phase: 'active', custom: false },
    { name: 'fresh', order: 0, text: 'NEW', phase: 'compaction', custom: true },
  ])
})

test('三态同步持久化：空阶段集合产出空段，同名文本按行 override 优先', () => {
  const list = mergedPhaseInjectEntries({ inject: [] }, {
    bootstrap: [],
    active: [{ name: 'a', custom: true, text: 'MINE', override: 'REPLACED' }],
    compaction: [{ name: 'b', custom: false, text: '', override: '' }],
  })
  assert.deepEqual(list, [
    { name: 'a', order: 0, text: 'REPLACED', phase: 'active', custom: true },
    { name: 'b', order: 0, text: '', phase: 'compaction', custom: false },
  ])
})

// ── 三态同步（并集镜像）：三态收敛到同一份段列表与文本 ─────────────────────

/** 三阶段原生段集（每阶段各不相同，覆盖「阶段独有段」）。 */
const MIRROR_BASE = {
  bootstrap: [{ name: 'boot', text: 'BOOT' }, { name: 'shared', text: 'S' }],
  active: [{ name: 'shared', text: 'S' }, { name: 'act', text: 'ACT' }],
  compaction: [{ name: 'shared', text: 'S' }, { name: 'comp', text: 'COMP' }],
}
const MIRROR_STATUS = {
  bootstrap: { promoted: false, boundary: -1 },
  compaction: { promoted: false, boundary: 1 },
  active: { promoted: true, boundary: -1 },
}
const mirrorViews = () => Object.fromEntries(Object.keys(MIRROR_BASE).map((key) => [key, {
  baseSections: MIRROR_BASE[key].map((sec) => ({ ...sec, blocked: false, replaced: false })),
  sections: MIRROR_BASE[key].map((sec) => ({ ...sec })),
}]))
const mirrorNative = (key, name) => MIRROR_BASE[key].some((sec) => sec.name === name)

test('mirroredRows：常驻期行序为骨架，其余两态独有段追加在尾部', () => {
  const rows = mirroredRows({}, mirrorViews(), mirrorNative)
  assert.deepEqual(rows.map((row) => row.name), ['shared', 'act', 'boot', 'comp'])
  // 常驻期视图缺席 = 该阶段不参与并集（绝不臆造行）
  const views = mirrorViews()
  views.active = null
  assert.deepEqual(mirroredRows({}, views, mirrorNative).map((row) => row.name), ['boot', 'shared', 'comp'])
})

test('mirroredRows：常驻期有的段以常驻期那份为准（勾选 / 文本覆写另外两态）', () => {
  // 引导期单独屏蔽了 shared：常驻期没屏蔽 → 并集行取常驻期那份，屏蔽被覆写掉。
  const rows = mirroredRows({ sectionsBootstrap: ['shared'] }, mirrorViews(), mirrorNative)
  assert.deepEqual(rows.map((row) => [row.name, row.blocked]), [
    ['shared', false], ['act', false], ['boot', false], ['comp', false],
  ])
  assert.deepEqual(mirroredDeniedLists(rows), { sections: [], sectionsBootstrap: [], sectionsCompaction: [] })
})

test('mirroredRows：同名段优先取原生那一阶段的行（注入正文不冻结回原生阶段）', () => {
  const cfg = { inject: [{ name: 'boot', order: 0, text: 'BOOT', phase: 'active', custom: false }] }
  const rows = mirroredRows(cfg, mirrorViews(), mirrorNative)
  const boot = rows.find((row) => row.name === 'boot')
  // 引导期原生 → 用引导期那份（override 为空），不是常驻期那份带正文的注入行
  assert.equal(boot.override, '')
  assert.equal(boot.text, 'BOOT')
  assert.deepEqual(rows.map((row) => row.name), ['shared', 'boot', 'act', 'comp'])
  assert.deepEqual(mirrorPhaseInjectEntries(cfg, rows, mirrorNative).filter((item) => item.name === 'boot'), [
    { name: 'boot', order: 1, text: 'BOOT', phase: 'active', custom: false },
    { name: 'boot', order: 1, text: '', phase: 'bootstrap', custom: false },
    { name: 'boot', order: 1, text: 'BOOT', phase: 'compaction', custom: false },
  ])
})

test('mirrorPhaseInjectEntries：原生系统段只写 order，非原生段带正文，替换文本恒写', () => {
  const rows = [
    { name: 'shared', text: 'S', custom: false, override: '', blocked: false },
    { name: 'act', text: 'ACT', custom: false, override: '', blocked: false },
    { name: 'replaced', text: 'OLD', custom: false, override: 'NEW', blocked: false },
  ]
  const nativeOf = (key, name) => key === 'active' && (name === 'shared' || name === 'replaced')
  const list = mirrorPhaseInjectEntries({ inject: [] }, rows, nativeOf)
  assert.deepEqual(list.filter((item) => item.phase === 'active'), [
    // 原生且无替换 → 只覆盖 order（注册表原文不冻结进配置）
    { name: 'shared', order: 0, text: '', phase: 'active', custom: false },
    // 非原生 → 必须带正文才能被服务端建出来
    { name: 'act', order: 1, text: 'ACT', phase: 'active', custom: false },
    // 原生但有替换文本 → 正文照写（否则替换在该阶段不生效）
    { name: 'replaced', order: 2, text: 'NEW', phase: 'active', custom: false },
  ])
  assert.deepEqual(list.filter((item) => item.phase === 'bootstrap'), [
    { name: 'shared', order: 0, text: 'S', phase: 'bootstrap', custom: false },
    { name: 'act', order: 1, text: 'ACT', phase: 'bootstrap', custom: false },
    { name: 'replaced', order: 2, text: 'NEW', phase: 'bootstrap', custom: false },
  ])
})

test('mirrorPhaseInjectEntries：动态段跳过、always 只留行集里的名字、未就绪阶段整段跳过', () => {
  const cfg = {
    inject: [
      { name: 'keep', order: 0, text: 'K', custom: true },
      { name: 'gone', order: 1, text: 'G', custom: true },
    ],
  }
  const rows = [
    { name: 'keep', text: 'K', custom: true, override: 'K', blocked: false },
    { name: 'dyn', text: '<动态生成>', custom: false, override: '', blocked: false },
  ]
  const list = mirrorPhaseInjectEntries(cfg, rows, () => false)
  // always 条目只保留名字仍在行集里的（删除一个自定义段 = 三态一起消失）
  assert.deepEqual(list[0], { name: 'keep', order: 0, text: 'K', custom: true })
  assert.equal(list.some((item) => item.name === 'gone'), false)
  // 动态段建不出来 → 三个阶段都不写（它留在自己原有的阶段里）
  assert.equal(list.some((item) => item.name === 'dyn'), false)
  assert.deepEqual(mirrorSkippedNames(rows, () => false), ['dyn'])
  // 某阶段视图未就绪（null）→ 该阶段整段跳过，绝不把缺失的阶段当空集写掉
  const partial = mirrorPhaseInjectEntries({ inject: [] }, rows, (key) => (key === 'compaction' ? null : false))
  assert.deepEqual(partial.map((item) => item.phase), ['active', 'bootstrap'])
})

test('mirroredDeniedLists：三份屏蔽名单统一为并集行集里的屏蔽名集合', () => {
  const rows = [
    { name: 'a', blocked: true },
    { name: 'b', blocked: false },
    { name: 'c', blocked: true },
  ]
  assert.deepEqual(mirroredDeniedLists(rows), {
    sections: ['a', 'c'],
    sectionsBootstrap: ['a', 'c'],
    sectionsCompaction: ['a', 'c'],
  })
})

test('三态同步端到端：镜像写回后三个阶段装配出同一份段列表与文本', () => {
  const cfg = { inject: [] }
  const rows = mirroredRows(cfg, mirrorViews(), mirrorNative)
  const next = {
    ...cfg,
    inject: mirrorPhaseInjectEntries(cfg, rows, mirrorNative),
    ...mirroredDeniedLists(rows),
  }
  const assembled = {}
  for (const key of ['bootstrap', 'active', 'compaction']) {
    const base = MIRROR_BASE[key].map((sec, i) => ({ ...sec, order: i }))
    assembled[key] = applySectionPolicy(base, next, MIRROR_STATUS[key])
  }
  const names = assembled.bootstrap.map((sec) => sec.name)
  assert.deepEqual(names, ['shared', 'act', 'boot', 'comp'])
  assert.deepEqual(assembled.active.map((sec) => sec.name), names)
  assert.deepEqual(assembled.compaction.map((sec) => sec.name), names)
  // 文本也三态一致：非原生段带着原文注入（stage 独有段不会在别的阶段变空）
  assert.deepEqual(assembled.active.map((sec) => sec.text), ['S', 'ACT', 'BOOT', 'COMP'])
  assert.deepEqual(assembled.compaction.map((sec) => sec.text), ['S', 'ACT', 'BOOT', 'COMP'])
})

test('phaseRows：post ∪ 被屏蔽 ∪ 本阶段注入，文本 post 优先，custom 身份只认标记', () => {
  const cfg = {
    sections: ['resident-blocked'],
    sectionsBootstrap: ['gone'],
    inject: [{ name: 'inj', order: 0, text: 'INJ-TEXT', phase: 'bootstrap', custom: true }],
  }
  const view = {
    baseSections: [
      { name: 'a', text: 'A', blocked: false },
      { name: 'gone', text: 'G', blocked: true },
      { name: 'resident-blocked', text: 'RB', blocked: false },
    ],
    sections: [{ name: 'a', text: 'A-POST' }],
  }
  const rows = phaseRows(cfg, view, 'bootstrap')
  // 注入行不在装配里 → text 为空、custom 文本走 override；blocked 只认本阶段
  // 自己的名单（sectionsBootstrap），常驻期名单（sections）不泄漏进引导期。
  assert.deepEqual(rows.map((r) => [r.name, r.text, r.blocked, r.custom, r.override]), [
    ['a', 'A-POST', false, false, ''],
    ['inj', '', false, true, 'INJ-TEXT'],
    ['gone', 'G', true, false, ''],
  ])
  // 无该阶段视图 = 空行集（绝不臆造）
  assert.deepEqual(phaseRows(cfg, null, 'compaction'), [])
})

test('zhMergedInjectEntries：命中行覆盖为中文（函数译本拿原文），未命中/自定义段原样，always 保留', () => {
  const cfg = {
    sections: [],
    inject: [
      { name: 'always-x', order: 0, text: 'ALWAYS', custom: true },
      { name: 'persona', order: 0, text: '', phase: 'bootstrap', custom: false },
      { name: 'keep', order: 1, text: '', phase: 'bootstrap', custom: false },
      { name: 'mine', order: 2, text: 'USER', phase: 'bootstrap', custom: true },
    ],
  }
  const view = {
    baseSections: [
      { name: 'persona', text: 'EN PERSONA', blocked: false },
      { name: 'keep', text: 'KEEP EN', blocked: false },
      { name: 'mine', text: 'USER', blocked: false },
    ],
    sections: [],
  }
  const views = { bootstrap: view, active: null, compaction: null }
  const zhMap = {
    persona: '中文人格 {{model}} {{cwd}}',
    mine: 'ZH!', // 自定义段与译本同名也绝不覆盖用户自撰内容
    // 函数译本：无 ```ts 围栏时放弃替换（保持原样）——tools:sdk 守卫同款
    keep: (original) => (original.includes('```ts') ? 'ZH ' + original : null),
  }
  const list = zhMergedInjectEntries(cfg, views, zhMap)
  // always 条目原样保留在最前；always 自定义行在三个阶段部分都显示为行，
  // 因此各阶段都写出自己的条目（与 phaseInjectEntries 的手动编辑行为一致：
  // 阶段条目后写覆盖）。
  assert.deepEqual(list, [
    { name: 'always-x', order: 0, text: 'ALWAYS', custom: true },
    { name: 'persona', order: 0, text: '中文人格 {{model}} {{cwd}}', phase: 'bootstrap', custom: false },
    // keep 未命中（函数返回 null）→ 原样保留为仅 order 覆盖的系统条目
    { name: 'keep', order: 1, text: '', phase: 'bootstrap', custom: false },
    // mine 是自定义段 → 跳过，文本保持用户自撰
    { name: 'mine', order: 2, text: 'USER', phase: 'bootstrap', custom: true },
    { name: 'always-x', order: 3, text: 'ALWAYS', phase: 'bootstrap', custom: true },
    { name: 'always-x', order: 0, text: 'ALWAYS', phase: 'active', custom: true },
    { name: 'always-x', order: 0, text: 'ALWAYS', phase: 'compaction', custom: true },
  ])
})

test('zhRevertInjectEntries：命中行清空替换文本回归英文，自定义段不碰', () => {
  const cfg = {
    sections: [],
    inject: [
      { name: 'persona', order: 0, text: '中文人格', phase: 'bootstrap', custom: false },
      { name: 'keep', order: 1, text: 'MY KEEP', phase: 'bootstrap', custom: false },
      { name: 'mine', order: 2, text: 'USER', phase: 'bootstrap', custom: true },
    ],
  }
  const view = {
    baseSections: [
      { name: 'persona', text: '中文人格', blocked: false },
      { name: 'keep', text: 'MY KEEP', blocked: false },
      { name: 'mine', text: 'USER', blocked: false },
    ],
    sections: [],
  }
  const list = zhRevertInjectEntries(cfg, { bootstrap: view, active: null, compaction: null }, {
    persona: '中文人格', keep: 'KEEP-ZH', mine: 'ZH!',
  })
  assert.deepEqual(list, [
    // 命中的系统段：替换文本清空 → 仅 order 覆盖，服务端回落英文原文
    { name: 'persona', order: 0, text: '', phase: 'bootstrap', custom: false },
    { name: 'keep', order: 1, text: '', phase: 'bootstrap', custom: false },
    // 自定义段不碰
    { name: 'mine', order: 2, text: 'USER', phase: 'bootstrap', custom: true },
  ])
})

test('zhApplied：任一条目文本等于字符串译本即开启', () => {
  const zhMap = { persona: '中文', note: (o) => o }
  assert.equal(zhApplied({ inject: [{ name: 'persona', text: '中文', phase: 'bootstrap' }] }, zhMap), true)
  assert.equal(zhApplied({ inject: [{ name: 'persona', text: 'other', phase: 'bootstrap' }] }, zhMap), false)
  // 函数译本条目不参与探测
  assert.equal(zhApplied({ inject: [{ name: 'note', text: 'x', phase: 'bootstrap' }] }, zhMap), false)
  assert.equal(zhApplied({ inject: [] }, zhMap), false)
  assert.equal(zhApplied({}, zhMap), false)
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

/**
 * 预设快照「全量捕获 → 导出 → 导入 → 应用」的守恒测试。
 *
 * 存在的理由：面板的每阶段独立设定（阶段屏蔽名单、阶段工具目录、逐阶段排序）
 * 一度只活在 config 里，快照只捕获静态四字段 —— 走一遍导出导入就把这套设置丢了。
 * 这里锁住两件事：
 *   1) 新快照对六个字段逐项守恒；
 *   2) 旧快照（不带这些键）应用时保留当前值，且注入条目不多出 phase 键。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { addImportedPresets, applyPresetData, buildPresetData, mergeSections } from '../src/client/presets.ts'
import { decodePresetExport, encodePresetExport } from '../src/client/preset-io.ts'
import type { Config, Inventory } from '../src/client/types.ts'

const invOf = (names: string[]): Inventory => ({
  sections: names.map((name, i) => ({ name, order: i, text: `T:${name}`, active: true, replaced: false })),
  tools: [{ name: 'read', hidden: false }, { name: 'bash', hidden: false }],
})

/** 一套把每阶段独立设定都用上的配置。 */
const rich = (): Config => ({
  sections: ['plan:policy'],
  sectionsBootstrap: ['harness:source'],
  sectionsCompaction: ['genui:fence'],
  replace: { 'tool:read': 'READ REPLACED' },
  inject: [
    { name: 'harness:identity', order: 0, text: '', phase: 'always' },
    { name: 'harness:source', order: 1, text: '', phase: 'always' },
    { name: 'plan:policy', order: 2, text: '', phase: 'always' },
    { name: 'note:boot', order: 0, text: 'BOOT 注记', phase: 'bootstrap', custom: true },
    { name: 'harness:identity', order: 1, text: '', phase: 'bootstrap' },
    { name: 'note:act', order: 0, text: 'ACTIVE 注记', phase: 'active', custom: true },
    { name: 'note:comp', order: 0, text: 'COMP 注记', phase: 'compaction', custom: true },
  ],
  tools: {
    exclude: ['bash'],
    include: [],
    bootstrap: { exclude: [], include: ['read'] },
    compaction: { exclude: ['read'], include: [] },
  },
})

const phaseSeq = (cfg: Config, phase: string): string[] =>
  (cfg.inject ?? [])
    .filter((x) => (x.phase ?? 'always') === phase)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((x) => x.name)

/** 走完整条链：捕获 → 编码 → 解码 → 导入 → 应用。 */
function roundTrip(source: Config, into: Config, names: string[]) {
  const data = buildPresetData(source, mergeSections(invOf(names), source, new Set(source.sections ?? [])))
  const text = encodePresetExport({ id: 'p1', name: '源快照', data })
  const imported = addImportedPresets([], JSON.parse(text) as never, () => 'p2')[0]!
  assert.equal(imported.name, '源快照')
  return { data, applied: applyPresetData(imported.data, into, new Set(names)) }
}

const SOURCE = rich()
const allNames = ['harness:identity', 'harness:source', 'plan:policy', 'genui:fence', 'note:boot', 'note:act', 'note:comp']

test('全量快照守恒：阶段屏蔽名单与静态字段逐项一致', () => {
  const { data, applied } = roundTrip(SOURCE, { sections: [], inject: [] }, allNames)
  assert.deepEqual(data.sectionsBootstrap, ['harness:source'])
  assert.deepEqual(data.sectionsCompaction, ['genui:fence'])
  assert.deepEqual(applied.sectionsBootstrap, ['harness:source'])
  assert.deepEqual(applied.sectionsCompaction, ['genui:fence'])
  assert.deepEqual([...applied.sections].sort(), [...SOURCE.sections!].sort())
  assert.deepEqual(applied.replace, SOURCE.replace)
})

test('全量快照守恒：三个阶段的工具目录都被带走', () => {
  const { applied } = roundTrip(SOURCE, { tools: { exclude: ['other'], include: [] } }, allNames)
  assert.deepEqual(applied.tools.exclude, ['bash'])
  assert.deepEqual(applied.tools.bootstrap, { exclude: [], include: ['read'] })
  assert.deepEqual(applied.tools.compaction, { exclude: ['read'], include: [] })
})

test('全量快照守恒：每阶段各自的成员与排序回放后不变', () => {
  const { applied } = roundTrip(SOURCE, { inject: [] }, allNames)
  const seq = (phase: string) => applied.inject
    .filter((x) => (x.phase ?? 'always') === phase)
    .sort((a, b) => a.order - b.order)
    .map((x) => x.name)
  // 三个阶段：成员与序逐一守恒（这就是 phaseInjectEntries 写出去的那份空间）。
  for (const phase of ['bootstrap', 'active', 'compaction']) {
    assert.deepEqual(seq(phase), phaseSeq(SOURCE, phase), `${phase} 阶段的序列应守恒`)
  }
  // always 组按设计来自「合并后的完整段列表」（快照要带完整有序集合），
  // 因此它比 cfg.inject 的 always 条目更多 —— 源条目必须以同样相对序在内。
  const always = seq('always')
  const srcAlways = phaseSeq(SOURCE, 'always')
  let cursor = -1
  for (const name of srcAlways) {
    const at = always.indexOf(name, cursor + 1)
    assert.ok(at > cursor, `always 组里 ${name} 的相对序应守恒：${always.join(',')}`)
    cursor = at
  }
  // 自定义段的文本必须跟着回来（系统段永远留空文本，不冻结动态内容）
  const note = applied.inject.find((x) => x.name === 'note:act')
  assert.equal(note?.text, 'ACTIVE 注记')
  assert.equal(note?.custom, true)
  assert.equal(applied.inject.find((x) => x.name === 'harness:identity' && x.phase === 'bootstrap')?.text, '')
})

test('阶段条目排在 always 组之后：运行时后写覆盖前写，阶段序才赢', () => {
  const { applied } = roundTrip(SOURCE, { inject: [] }, allNames)
  const firstPhase = applied.inject.findIndex((x) => x.phase !== undefined)
  const lastAlways = applied.inject.map((x) => x.phase ?? 'always').lastIndexOf('always')
  assert.ok(firstPhase > lastAlways, `bootstrap 条目(${firstPhase}) 必须落在 always 组(${lastAlways}) 之后`)
})

test('不动点：应用一次的结果再捕获一次，阶段字段不再二次漂移', () => {
  const once = roundTrip(SOURCE, SOURCE, allNames).applied
  // 把补丁吸收回配置 = 用户在面板上「应用」后实际落盘的状态。
  const settled: Config = {
    sections: once.sections,
    sectionsBootstrap: once.sectionsBootstrap,
    sectionsCompaction: once.sectionsCompaction,
    replace: once.replace,
    inject: once.inject,
    tools: once.tools,
  }
  const twice = roundTrip(settled, settled, allNames).applied
  assert.deepEqual(twice.sectionsBootstrap, once.sectionsBootstrap)
  assert.deepEqual(twice.sectionsCompaction, once.sectionsCompaction)
  assert.deepEqual(twice.tools.bootstrap, once.tools.bootstrap)
  assert.deepEqual(twice.tools.compaction, once.tools.compaction)
  for (const phase of ['bootstrap', 'active', 'compaction']) {
    assert.deepEqual(
      twice.inject.filter((x) => x.phase === phase).map((x) => x.name),
      once.inject.filter((x) => x.phase === phase).map((x) => x.name),
      `${phase} 阶段成员应已收敛`,
    )
  }
})

test('旧快照（无阶段键）应用时保留当前阶段设定，且注入条目不多出 phase 键', () => {
  const legacyData = {
    sections: ['plan:policy'],
    replace: {},
    order: [
      { name: 'a', after: undefined, text: '', custom: false },
      { name: 'b', after: 'a', text: '', custom: false },
    ],
    tools: { exclude: ['bash'], include: [] },
  }
  const current: Config = {
    sectionsBootstrap: ['keep-me'],
    sectionsCompaction: ['keep-too'],
    inject: [],
    tools: { exclude: [], include: [], bootstrap: { exclude: [], include: ['read'] }, compaction: { exclude: [], include: ['bash'] } },
  }
  const applied = applyPresetData(legacyData, current, new Set(['a', 'b']))
  assert.equal('sectionsBootstrap' in applied, false, '旧快照不得写阶段名单字段')
  assert.equal('sectionsCompaction' in applied, false)
  assert.deepEqual(applied.tools.bootstrap, { exclude: [], include: ['read'] })
  assert.deepEqual(applied.tools.compaction, { exclude: [], include: ['bash'] })
  // 键形状守恒：always 组条目绝不带 phase 键
  for (const item of applied.inject) assert.equal('phase' in item, false, JSON.stringify(item))
})

test('应用时匹配不上的段默认跳过：跨系统导入不凭空建段', () => {
  // 快照里带一个当前系统没有的段（哪怕带文本 / custom 标记）。
  const data = {
    sections: [],
    replace: {},
    order: [
      { name: 'a', after: undefined, text: '', custom: false },
      { name: 'ghost', after: 'a', text: 'GHOST', custom: true },
    ],
    tools: { exclude: [], include: [] },
  }
  const applied = applyPresetData(data, { inject: [] }, new Set(['a', 'b']))
  // ghost 匹配不上 → 整条跳过，绝不带着文本被创建出来；匹配上的 a 正常加载。
  assert.deepEqual(applied.inject.map((x) => x.name), ['a'])
  // 当前系统里有、预设里没有的 b 仍按规则屏蔽。
  assert.deepEqual(applied.sections, ['b'])
})

/** 客户端预设助手（src/client/prompt/presets.ts）的 EntryRef/PHASES/replacements 契约。 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  PHASE_KEYS,
  entryKey,
} from '../src/client/prompt/types.ts'
import {
  applyPresetData,
  buildPresetData,
  mergeSections,
  overrideView,
} from '../src/client/prompt/presets.ts'

const G = { kind: 'global' }
const P = { kind: 'preset', id: 'p1' }
const ref = (name, source) => (source === undefined ? { name } : { name, source })

test('PHASE_KEYS 直接来自 PHASES（唯一阶段描述表）', () => {
  assert.deepEqual(PHASE_KEYS, ['bootstrap', 'active', 'compaction'])
})

test('overrideView 覆盖所有 PHASES 字段 + replacements', () => {
  const cfg = { presets: [{ id: 'x', name: 'x', data: {} }], activePreset: 'x' }
  const view = overrideView(cfg, {
    sections: [ref('a', G)],
    sectionsBootstrap: [ref('b', P)],
    sectionsCompaction: [ref('c', P)],
    contexts: [ref('ctx', G)],
    contextsBootstrap: [],
    contextsCompaction: [ref('ctx2', P)],
    replacements: [{ name: 'a', source: G, phase: 'always', text: 'A!' }],
  })
  assert.deepEqual(view.sections, [ref('a', G)])
  assert.deepEqual(view.sectionsBootstrap, [ref('b', P)])
  assert.deepEqual(view.sectionsCompaction, [ref('c', P)])
  assert.deepEqual(view.contexts, [ref('ctx', G)])
  assert.deepEqual(view.contextsBootstrap, [])
  assert.deepEqual(view.contextsCompaction, [ref('ctx2', P)])
  assert.deepEqual(view.replacements, [{ name: 'a', source: G, phase: 'always', text: 'A!' }])
  assert.deepEqual(view.tools, { exclude: [], add: [], bootstrap: { exclude: [], add: [] }, compaction: { exclude: [], add: [] } })
  assert.equal(view.presets, cfg.presets)
  assert.equal(view.activePreset, 'x')
})

test('buildPresetData 捕获 EntryRef、replacements 与按 (phase,name,source) 的 order', () => {
  const cfg = {
    sections: [ref('blocked', G)],
    sectionsBootstrap: [ref('boot-blocked', P)],
    sectionsCompaction: [],
    contexts: [ref('ctx', P)],
    contextsBootstrap: [],
    contextsCompaction: [],
    replacements: [
      { name: 'sys', source: G, phase: 'always', text: 'REPLACED' },
      { name: 'sys', source: G, phase: 'bootstrap', text: 'BOOT' },
    ],
    inject: [
      { name: 'note', source: G, order: 1, text: 'N', phase: 'always', custom: true },
      { name: 'note', source: P, order: 0, text: 'P-N', phase: 'bootstrap', custom: true },
    ],
    tools: { exclude: [ref('bash', G)], add: [ref('read', G)] },
  }
  const merged = [
    { name: 'sys', source: G, order: 0, text: 'SYS', active: true, replaced: true, custom: false },
    { name: 'note', source: G, order: 1, text: 'N', active: true, replaced: false, custom: true },
  ]
  const data = buildPresetData(cfg, merged)
  assert.deepEqual(data.sections, cfg.sections)
  assert.deepEqual(data.sectionsBootstrap, cfg.sectionsBootstrap)
  assert.deepEqual(data.contexts, cfg.contexts)
  assert.deepEqual(data.replacements, cfg.replacements)
  assert.deepEqual(data.tools, {
    exclude: [ref('bash', G)], add: [ref('read', G)],
    bootstrap: { exclude: [], add: [] },
    compaction: { exclude: [], add: [] },
  })
  const always = data.order.filter((item) => item.phase === undefined)
  // merged 里的 note 是 always 组的自定义段；bootstrap 链里的 note(P) 是另一条身份。
  assert.deepEqual(always.map((item) => item.name), ['sys', 'note'])
  assert.equal(always[0].source.kind, 'global')
  assert.equal(always[1].after, entryKey(always[0]))
  const bootstrap = data.order.filter((item) => item.phase === 'bootstrap')
  assert.deepEqual(bootstrap.map((item) => entryKey(item)), [entryKey(ref('note', P))])
})

test('mergeSections: 同名不同源分开两行，屏蔽只命中对应来源', () => {
  const inv = {
    sections: [
      { name: 'same', source: G, order: 0, text: 'GLOBAL', active: true, replaced: false },
      { name: 'same', source: P, order: 1, text: 'PRESET', active: true, replaced: false },
    ],
    tools: [],
  }
  const blocked = new Set([entryKey(ref('same', P))])
  const rows = mergeSections(inv, { sections: [ref('same', P)] }, blocked)
  assert.equal(rows.length, 2)
  assert.equal(rows.find((row) => row.source.kind === 'global').active, true)
  assert.equal(rows.find((row) => row.source.kind === 'preset').active, false)
})

test('buildPresetData: 全局链只收 always 自定义段，阶段专属自定义段留在本阶段', () => {
  const cfg = {
    inject: [
      { name: 'alwaysNote', source: G, order: 0, text: 'A', phase: 'always', custom: true },
      { name: 'phaseOnly', source: G, order: 0, text: 'P', phase: 'bootstrap', custom: true },
    ],
  }
  const merged = mergeSections({ sections: [], tools: [] }, cfg, new Set())
  const data = buildPresetData(cfg, merged)
  const always = data.order.filter((item) => item.phase === undefined)
  assert.deepEqual(always.map((item) => item.name), ['alwaysNote'])
  assert.equal(always[0].text, 'A')
  const bootstrap = data.order.filter((item) => item.phase === 'bootstrap')
  assert.deepEqual(bootstrap.map((item) => item.name), ['phaseOnly'])
})

test('applyPresetData: 工具快照保留当前 add、不重置', () => {
  const cfg = {
    tools: {
      exclude: [ref('old', G)],
      add: [ref('kept-add', G)],
      bootstrap: { exclude: [], add: [ref('boot-add', G)] },
      compaction: { exclude: [], add: [] },
    },
  }
  const patch = applyPresetData(
    { order: [], tools: { exclude: [ref('new', P)] } },
    cfg,
    new Map(),
  )
  assert.deepEqual(patch.tools.exclude, [ref('new', P)])
  assert.deepEqual(patch.tools.add, [ref('kept-add', G)])
  assert.deepEqual(patch.tools.bootstrap.add, [ref('boot-add', G)])
})

test('applyPresetData: 注入按阶段重编号，always 条目不带 phase 键', () => {
  const current = new Map([
    [entryKey(ref('a', G)), ref('a', G)],
    [entryKey(ref('b', P)), ref('b', P)],
  ])
  const patch = applyPresetData(
    {
      order: [
        { name: 'a', source: G, after: undefined, text: '', custom: false },
        { name: 'b', source: P, after: entryKey(ref('a', G)), text: 'B', custom: true, phase: 'bootstrap' },
      ],
      replacements: [{ name: 'a', source: G, phase: 'always', text: 'A2' }],
    },
    {
      replacements: [{ name: 'a', source: G, phase: 'always', text: 'A1' }],
      inject: [
        { name: 'a', source: G, order: 9, text: '', phase: 'always' },
        { name: 'b', source: P, order: 9, text: 'B', phase: 'bootstrap', custom: true },
      ],
    },
    current,
  )
  const always = patch.inject.filter((item) => item.phase === undefined)
  assert.equal(always.length, 1)
  assert.equal(always[0].name, 'a')
  assert.equal(always[0].order, 0)
  assert.ok(!('phase' in always[0]))
  const bootstrap = patch.inject.filter((item) => item.phase === 'bootstrap')
  assert.equal(bootstrap.length, 1)
  assert.equal(bootstrap[0].name, 'b')
  assert.equal(bootstrap[0].order, 0)
  // replacements: 同一 (phase,name,source) 以快照为准。
  assert.deepEqual(patch.replacements, [{ name: 'a', source: G, phase: 'always', text: 'A2' }])
})

test('applyPresetData: 屏蔽名单按 name+source 匹配，不误伤同名其它源', () => {
  const globalEntry = ref('same', G)
  const presetEntry = ref('same', P)
  const current = new Map([
    [entryKey(globalEntry), globalEntry],
    [entryKey(presetEntry), presetEntry],
  ])
  const patch = applyPresetData(
    {
      sections: [presetEntry],
      order: [
        { name: 'same', source: G, text: '', custom: false },
        { name: 'same', source: P, text: '', custom: false },
      ],
    },
    {},
    current,
  )
  assert.deepEqual(patch.sections, [presetEntry])
})

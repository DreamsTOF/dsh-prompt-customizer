import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyPresetData, buildPresetData } from '../src/client/prompt/presets.ts'
import { entryKey } from '../src/client/prompt/types.ts'

const G = { kind: 'global' }
const P = { kind: 'preset', id: 'p1' }
const ref = (name, source) => ({ name, source })

test('快照往返守恒：阶段名单 / 阶段工具 add / replacements / EntryRef 身份', () => {
  const cfg = {
    sections: [ref('blocked', G)],
    sectionsBootstrap: [ref('boot', G)],
    sectionsCompaction: [ref('comp', P)],
    contexts: [ref('ctx', P)],
    contextsBootstrap: [],
    contextsCompaction: [],
    replacements: [{ name: 'sys', source: G, phase: 'bootstrap', text: 'BOOT TEXT' }],
    inject: [
      { name: 'note', source: P, order: 1, text: 'NOTE', phase: 'always', custom: true },
      { name: 'phase-note', source: G, order: 0, text: 'PHASE', phase: 'active', custom: true },
    ],
    tools: {
      exclude: [ref('bash', G)],
      add: [ref('read', G)],
      bootstrap: { exclude: [], add: [ref('glob', G)] },
      compaction: { exclude: [ref('grep', G)], add: [] },
    },
  }
  const merged = [
    { name: 'sys', source: G, order: 0, text: 'SYS', active: true, replaced: false, custom: false },
    { name: 'boot', source: G, order: 1, text: 'BOOT', active: true, replaced: false, custom: false },
    { name: 'note', source: P, order: 2, text: 'NOTE', active: true, replaced: false, custom: true },
  ]
  const data = buildPresetData(cfg, merged)
  // 导出 → JSON → 导入的等价：数据只依赖可序列化字段。
  const imported = JSON.parse(JSON.stringify(data))
  const available = new Map([
    [entryKey(ref('sys', G)), ref('sys', G)],
    [entryKey(ref('boot', G)), ref('boot', G)],
    [entryKey(ref('blocked', G)), ref('blocked', G)],
    [entryKey(ref('comp', P)), ref('comp', P)],
    [entryKey(ref('note', P)), ref('note', P)],
    [entryKey(ref('phase-note', G)), ref('phase-note', G)],
  ])
  const applied = applyPresetData(imported, { sectionsBootstrap: [], sectionsCompaction: [], inject: [], tools: {} }, available)
  assert.deepEqual(applied.sections, data.sections)
  assert.deepEqual(applied.sectionsBootstrap, data.sectionsBootstrap)
  assert.deepEqual(applied.sectionsCompaction, data.sectionsCompaction)
  assert.deepEqual(applied.contexts, data.contexts)
  assert.deepEqual(applied.replacements, data.replacements)
  assert.deepEqual(applied.tools.add, data.tools.add)
  assert.deepEqual(applied.tools.bootstrap, data.tools.bootstrap)
  assert.deepEqual(applied.tools.compaction, data.tools.compaction)
  // 阶段条目只在各自阶段，不泄漏到 always。
  const always = applied.inject.filter((item) => (item.phase ?? 'always') === 'always').map((item) => item.name)
  assert.ok(always.includes('note'))
  assert.ok(!always.includes('phase-note'))
  assert.ok(applied.inject.some((item) => item.name === 'phase-note' && item.phase === 'active'))
})

test('旧快照缺阶段键时保留当前配置，不重置阶段名单与阶段工具', () => {
  const current = {
    sectionsBootstrap: [ref('keep-boot', G)],
    sectionsCompaction: [ref('keep-comp', G)],
    inject: [],
    tools: { exclude: [], add: [], bootstrap: { exclude: [], add: [ref('read', G)] }, compaction: { exclude: [ref('bash', G)], add: [] } },
  }
  const legacy = {
    sections: [ref('a', G)],
    replacements: [],
    order: [{ name: 'a', text: '', custom: false }],
    tools: { exclude: [], add: [] },
  }
  const applied = applyPresetData(legacy, current, new Map([[entryKey(ref('a', G)), ref('a', G)]]))
  assert.equal('sectionsBootstrap' in applied, false)
  assert.equal('sectionsCompaction' in applied, false)
  assert.deepEqual(applied.tools.bootstrap, current.tools.bootstrap)
  assert.deepEqual(applied.tools.compaction, current.tools.compaction)
})

test('匹配不上的段不凭空建段', () => {
  const data = {
    sections: [],
    replacements: [],
    order: [
      { name: 'a', source: G, text: '', custom: false },
      { name: 'ghost', source: G, text: 'GHOST', custom: true },
    ],
    tools: { exclude: [], add: [] },
  }
  const applied = applyPresetData(data, { inject: [] }, new Map([
    [entryKey(ref('a', G)), ref('a', G)],
    [entryKey(ref('b', G)), ref('b', G)],
  ]))
  assert.deepEqual(applied.inject.map((item) => item.name), ['a'])
  // ghost 匹配不上 → 只保留可匹配的 a；不凭空创建 ghost。
  assert.equal(applied.inject.some((item) => item.name === 'ghost'), false)
})

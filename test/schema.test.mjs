import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Config } from '../vendor/prompt-customizer/schema.js'

const G = { kind: 'global' }
const P = { kind: 'preset', id: 'p1' }
const ref = (name, source) => (source === undefined ? { name } : { name, source })

test('accepts EntryRef lists, replacements and per-phase tools', () => {
  const value = Config({
    sections: [ref('tool:read', G)],
    contexts: [ref('context:file-reference', P)],
    replacements: [{ name: 'tool:read', source: G, phase: 'active', text: 'custom text' }],
    inject: [{ name: 'harness:identity', order: 0, text: '', phase: 'always', custom: true }],
    tools: { exclude: [ref('tool:x', G)], bootstrap: { add: [ref('read', P)] } },
  })
  assert.deepEqual(value.sections, [ref('tool:read', G)])
  assert.deepEqual(value.contexts, [ref('context:file-reference', P)])
  assert.deepEqual(value.replacements, [
    { name: 'tool:read', source: G, phase: 'active', text: 'custom text' },
  ])
  assert.equal(value.inject[0].name, 'harness:identity')
  assert.deepEqual(value.tools, {
    exclude: [ref('tool:x', G)],
    add: [],
    bootstrap: { exclude: [], add: [ref('read', P)] },
    compaction: { exclude: [], add: [] },
  })
  // 旧 replace 字段不再是 schema 的一部分；调用方只读 replacements。
  assert.equal('replace' in value, false)
})

test('defaults missing fields from PHASES', () => {
  const value = Config({})
  assert.deepEqual(value.sections, [])
  assert.deepEqual(value.sectionsBootstrap, [])
  assert.deepEqual(value.sectionsCompaction, [])
  assert.deepEqual(value.contexts, [])
  assert.deepEqual(value.contextsBootstrap, [])
  assert.deepEqual(value.contextsCompaction, [])
  assert.deepEqual(value.replacements, [])
  assert.deepEqual(value.inject, [])
  assert.deepEqual(value.tools, {
    exclude: [],
    add: [],
    bootstrap: { exclude: [], add: [] },
    compaction: { exclude: [], add: [] },
  })
  assert.deepEqual(value.overrides, {})
  assert.deepEqual(value.presets, [])
  assert.equal(value.activePreset, undefined)
  assert.equal(value.forceSections, true)
  assert.deepEqual(value.envBlocklist, [])
})

test('accepts presets with relative order and activePreset', () => {
  const value = Config({
    presets: [{
      id: 'p1',
      name: 'my preset',
      data: {
        sections: [ref('tool:read', G)],
        replacements: [{ name: 'tool:read', source: G, phase: 'bootstrap', text: 'custom' }],
        order: [{ name: 'harness:identity', after: 'harness:source', text: '', phase: 'bootstrap' }],
        tools: { exclude: [ref('tool:x', G)] },
      },
    }],
    activePreset: 'p1',
  })
  assert.equal(value.presets.length, 1)
  assert.equal(value.presets[0].name, 'my preset')
  assert.equal(value.presets[0].data.order[0].after, 'harness:source')
  assert.deepEqual(value.presets[0].data.sections, [ref('tool:read', G)])
  assert.equal(value.activePreset, 'p1')
})

test('source is optional on entries; a present source must be a well-formed object', () => {
  assert.deepEqual(Config({ sections: [{ name: 'x' }] }).sections, [{ name: 'x' }])
  assert.throws(() => Config({ sections: [{ name: 'x', source: {} }] }))
  assert.throws(() => Config({ sections: [{ name: 'x', source: { kind: 1 } }] }))
  assert.throws(() => Config({ replacements: [{ name: 'x', source: {}, phase: 'active', text: 't' }] }))
})

test('rejects malformed inputs', () => {
  const cases = [
    { label: 'missing required preset id/name', input: { presets: [{ data: {} }] } },
    { label: 'preset order entry missing a name', input: { presets: [{ id: 'p', name: 'n', data: { order: [{ after: 'a', text: '' }] } }] } },
    { label: 'non-array sections', input: { sections: 'tool:read' } },
    { label: 'entry without a name', input: { sections: [{ source: G }] } },
    { label: 'non-string replacement text', input: { replacements: [{ name: 'a', phase: 'active', text: 42 }] } },
    { label: 'non-array tool exclude', input: { tools: { exclude: 'bash' } } },
  ]
  for (const c of cases) {
    assert.throws(() => Config(c.input), c.label)
  }
})

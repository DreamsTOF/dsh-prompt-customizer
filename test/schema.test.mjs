import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Config } from '../lib/schema.js'

test('accepts a valid config and preserves known fields', () => {
  const value = Config({
    sections: ['tool:read'],
    replace: { 'tool:read': 'custom text' },
    inject: [{ name: 'harness:identity', order: 0, text: '' }],
    tools: { exclude: ['tool:x'] },
  })
  assert.deepEqual(value.sections, ['tool:read'])
  assert.equal(value.replace['tool:read'], 'custom text')
  assert.equal(value.inject[0].name, 'harness:identity')
  assert.deepEqual(value.tools, { exclude: ['tool:x'], add: [], bootstrap: { exclude: [], add: [] }, compaction: { exclude: [], add: [] } })
})

test('defaults missing fields', () => {
  const value = Config({})
  assert.deepEqual(value.sections, [])
  assert.deepEqual(value.tools, { exclude: [], add: [], bootstrap: { exclude: [], add: [] }, compaction: { exclude: [], add: [] } })
  assert.deepEqual(value.overrides, {})
  assert.deepEqual(value.presets, [])
  assert.equal(value.activePreset, undefined)
})

test('accepts presets with relative order and activePreset', () => {
  const value = Config({
    presets: [{
      id: 'p1',
      name: 'my preset',
      data: {
        sections: ['tool:read'],
        replace: { 'tool:read': 'custom' },
        order: [{ name: 'harness:identity', after: 'harness:source', text: '' }],
        tools: { exclude: ['tool:x'] },
      },
    }],
    activePreset: 'p1',
  })
  assert.equal(value.presets.length, 1)
  assert.equal(value.presets[0].name, 'my preset')
  assert.equal(value.presets[0].data.order[0].after, 'harness:source')
  assert.equal(value.activePreset, 'p1')
})

test('rejects a preset missing required id/name', () => {
  assert.throws(() => Config({
    presets: [{ data: {} }],
  }))
})

test('rejects a preset order entry missing a name', () => {
  assert.throws(() => Config({
    presets: [{ id: 'p', name: 'n', data: { order: [{ after: 'a', text: '' }] } }],
  }))
})

test('rejects non-array sections', () => {
  assert.throws(() => Config({ sections: 'tool:read' }))
})

test('rejects non-string replace values', () => {
  assert.throws(() => Config({ replace: { a: 42 } }))
})

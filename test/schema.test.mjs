import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Config } from '../vendor/prompt-customizer/schema.js'

// 表驱动合并：接受 / 拒绝两条路径各自一张表，逐项执行原断言。

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

test('rejects malformed inputs（缺 id/name 的预设 / 缺 name 的 order / 非数组 sections / 非字符串 replace）', () => {
  const cases = [
    { label: 'rejects a preset missing required id/name', input: { presets: [{ data: {} }] } },
    { label: 'rejects a preset order entry missing a name', input: { presets: [{ id: 'p', name: 'n', data: { order: [{ after: 'a', text: '' }] } }] } },
    { label: 'rejects non-array sections', input: { sections: 'tool:read' } },
    { label: 'rejects non-string replace values', input: { replace: { a: 42 } } },
  ]
  for (const c of cases) {
    assert.throws(() => Config(c.input), c.label)
  }
})

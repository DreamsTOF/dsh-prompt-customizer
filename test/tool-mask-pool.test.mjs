import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildMaskedPool } from '../src/client/prompt/tool-pool.ts'
import { sameEntry } from '../src/client/prompt/types.ts'

test('工具屏蔽池按 masked 状态聚合，任意同名 base 行都不能吞掉它', () => {
  const rows = buildMaskedPool([
    { name: 'tool-a', state: 'controllable', source: { kind: 'global' } },
    { name: 'tool-a', state: 'masked-plugin', source: { kind: 'global' }, description: 'plugin mask' },
    { name: 'tool-b', state: 'masked-own', source: { kind: 'preset', id: 'p1' } },
    { name: 'tool-c', state: 'locked-agent', source: { kind: 'agent', id: 's1' } },
  ])
  assert.deepEqual(rows.map((row) => row.entry.name), ['tool-a', 'tool-b'])
  assert.deepEqual(rows[0].states, new Set(['masked-plugin']))
  assert.deepEqual(rows[1].states, new Set(['masked-own']))
})

test('agent 工具解除屏蔽时跨 session 仍按 name 命中', () => {
  assert.equal(
    sameEntry(
      { name: 'any-tool', source: { kind: 'agent', id: 'session-old' } },
      { name: 'any-tool', source: { kind: 'agent', id: 'session-new' } },
    ),
    true,
  )
})

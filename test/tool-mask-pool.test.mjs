import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildMaskedPool } from '../src/client/prompt/tool-pool.ts'
import { sameEntry } from '../src/client/prompt/types.ts'

test('完整目录只读池聚合 masked 行与 agent 作用域注册行，同名 base 行不能吞掉它', () => {
  const rows = buildMaskedPool([
    { name: 'tool-a', state: 'controllable', source: { kind: 'global' } },
    { name: 'tool-a', state: 'masked-plugin', source: { kind: 'global' }, description: 'plugin mask' },
    { name: 'tool-b', state: 'masked-own', source: { kind: 'preset', id: 'p1' } },
    { name: 'tool-c', state: 'locked-agent', source: { kind: 'agent', id: 's1' } },
  ])
  assert.deepEqual(rows.map((row) => row.entry.name), ['tool-a', 'tool-b', 'tool-c'])
  assert.deepEqual(rows[0].states, new Set(['masked-plugin']))
  assert.deepEqual(rows[1].states, new Set(['masked-own']))
  assert.deepEqual(rows[2].states, new Set(['locked-agent']), 'agent 作用域注册按「会话级」如实列出，不伪称遮蔽')
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

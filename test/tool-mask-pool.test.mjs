import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildMaskedPoolGrouped } from '../src/client/prompt/tool-pool.ts'
import { sameEntry } from '../src/client/prompt/types.ts'

test('只读池只收不可反选项；本插件遮蔽可反选，agent 作用域注册留在主列表（ADR-0006）', () => {
  const groups = buildMaskedPoolGrouped([
    { name: 'tool-a', state: 'controllable', source: { kind: 'global' } },
    { name: 'tool-a', state: 'masked-plugin', source: { kind: 'global' }, description: 'plugin mask' },
    { name: 'tool-b', state: 'masked-own', source: { kind: 'preset', id: 'p1' } },
    { name: 'tool-c', state: 'locked-agent', source: { kind: 'agent', id: 's1' } },
    { name: 'tool-d', state: 'masked-ptc', source: { kind: 'global' }, layer: 'global' },
    { name: 'tool-e', state: 'masked-shadow', source: { kind: 'global' }, layer: 'global' },
  ])
  assert.deepEqual(groups.reversible.map((row) => row.entry.name), ['tool-b'], '本插件遮蔽可在 MCP Tab 恢复 → 可反选组')
  assert.deepEqual(groups.irreversible.map((row) => row.entry.name), ['tool-a', 'tool-d', 'tool-e'],
    '外部不可见 / PTC 折叠 / 同名被覆盖 → 不可反选组')
  assert.deepEqual(groups.reversible[0].states, new Set(['masked-own']))
  assert.deepEqual(groups.irreversible.find((row) => row.entry.name === 'tool-d')?.states, new Set(['masked-ptc']))
  assert.ok(![...groups.reversible, ...groups.irreversible].some((row) => row.entry.name === 'tool-c'),
    'agent 作用域注册可勾选、归主列表，不入池')
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

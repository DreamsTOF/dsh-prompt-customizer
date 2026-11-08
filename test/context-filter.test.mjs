import { test } from 'node:test'
import assert from 'node:assert/strict'
import { filterRuntimeContexts } from '../vendor/prompt-customizer/index.js'

test('工具级 depth 上下文：空文本或对应工具缺席时不显示', () => {
  const contexts = [
    { name: 'tool:subagent:depth', text: '' },
    { name: 'tool:subagent_fork:depth', text: '' },
    { name: 'tool:read:depth', text: 'depth reached' },
    { name: 'tool:missing:depth', text: 'should disappear' },
    { name: 'working-directory:current', text: '' },
  ]
  const tools = [{ name: 'subagent' }, { name: 'subagent_fork' }, { name: 'read' }]
  assert.deepEqual(
    filterRuntimeContexts(contexts, tools).map((item) => item.name),
    ['tool:read:depth', 'working-directory:current'],
  )
})

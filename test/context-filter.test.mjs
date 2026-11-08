import { test } from 'node:test'
import assert from 'node:assert/strict'
import { filterEmptyOptionalContexts } from '../vendor/prompt-customizer/index.js'

test('空的非 required 运行时上下文不显示，required 空上下文保留', () => {
  const contexts = [
    { name: 'tool:subagent:depth', text: '' },
    { name: 'tool:subagent_fork:depth', text: '' },
    { name: 'tool:read:depth', text: 'depth reached' },
    { name: 'tool:missing:depth', text: 'should disappear' },
    { name: 'working-directory:current', text: '' },
  ]
  const ctx = {
    systemPrompt: {
      layers: {
        merge: () => new Map([
          ['working-directory:current', { required: true }],
          ['tool:subagent:depth', { required: false }],
        ]),
      },
    },
  }
  assert.deepEqual(
    filterEmptyOptionalContexts(contexts, ctx, 'scope').map((item) => item.name),
    ['tool:read:depth', 'tool:missing:depth', 'working-directory:current'],
  )
})

test('宿主没有 layers 时不按名字过滤，保持原样', () => {
  const contexts = [{ name: 'tool:subagent:depth', text: '' }]
  assert.deepEqual(filterEmptyOptionalContexts(contexts, {}, 'scope'), contexts)
})

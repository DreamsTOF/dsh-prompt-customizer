import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { apply } from '../vendor/prompt-customizer/index.js'
import { closeAllDbs, openDb, setDoc } from '../vendor/prompt-customizer/db.js'

const agentA = { id: 'a', session: { header: { id: 'sa', agentPreset: 'preset-a', cwd: '/a', delegationDepth: 0 } }, ctx: { preset: 'preset-a' } }
const agentB = { id: 'b', session: { header: { id: 'sb', agentPreset: 'preset-b', cwd: '/b', delegationDepth: 0 } }, ctx: { preset: 'preset-b' } }

test('不同 agent 预设的 assembled prompt 互不串台', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-preset-prompt-'))
  const dataDir = path.join(root, 'data')
  const db = openDb(path.join(dataDir, 'prompt-customizer.db'))
  setDoc(db, 'config', {
    forceSections: true,
    overrides: {
      'preset-a': { inject: [{ name: 'custom-a', text: 'A only', phase: 'always', custom: true, source: { kind: 'preset', id: 'preset-a' } }] },
      'preset-b': { inject: [{ name: 'custom-b', text: 'B only', phase: 'always', custom: true, source: { kind: 'preset', id: 'preset-b' } }] },
    },
  })
  let waterfall
  const sectionsFor = (scope) => scope === agentA
    ? [{ name: 'persona', order: 0, text: 'A persona' }]
    : [{ name: 'persona', order: 0, text: 'B persona' }]
  const sp = {
    variable: () => () => {},
    layers: { merge: () => new Map() },
    assemble: async (context) => {
      const assembly = { sections: sectionsFor(context.scope), contexts: [], variables: {} }
      return waterfall(assembly, context, async () => assembly)
    },
  }
  const presets = {
    list: async () => [{ id: 'preset-a', name: 'A' }, { id: 'preset-b', name: 'B' }],
    resolve: async () => ({ id: 'preset-a' }),
    acquireScope: async () => ({ key: { scope: 'preset-a' }, [Symbol.asyncDispose]: async () => {} }),
    // 模拟宿主投影尚未刷新：presetForSession 全部返回同一个预设；实际
    // 活会话的 composedPreset 才是权威。
    presetForSession: () => 'preset-a',
    composedPreset: (agentContext) => agentContext?.preset,
  }
  const ctx = {
    systemPrompt: sp,
    tools: { schemas: () => [] },
    on: (event, handler) => { if (event === 'system-prompt/assemble') waterfall = handler },
    inject: () => {},
    effect: (run) => { const dispose = run(); return typeof dispose === 'function' ? dispose : () => {} },
    get: (name) => ({
      systemPrompt: sp,
      tools: { schemas: () => [] },
      agents: { list: () => [agentA, agentB], roots: () => [agentA, agentB] },
      agentPresets: presets,
      sessionProjections: { stateOf: () => ({ promoted: true, boundary: -1 }) },
      connection: { requestRejection: () => undefined },
    })[name],
  }
  try {
    apply(ctx, { dataDir })
    const a = await sp.assemble({ scope: agentA, agent: agentA })
    const b = await sp.assemble({ scope: agentB, agent: agentB })
    assert.deepEqual(a.sections.map((section) => section.name).sort(), ['custom-a', 'persona'])
    assert.deepEqual(b.sections.map((section) => section.name).sort(), ['custom-b', 'persona'])
    assert.equal(a.sections.find((section) => section.name === 'persona').text, 'A persona')
    assert.equal(b.sections.find((section) => section.name === 'persona').text, 'B persona')
  } finally {
    closeAllDbs()
    fs.rmSync(root, { recursive: true, force: true })
  }
})

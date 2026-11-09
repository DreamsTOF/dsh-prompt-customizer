/**
 * 预设隔离 + 卸载恢复：提示词段和工具都必须按 agent 预设独立，
 * 插件卸载后必须释放 assemble 包装与所有工具 restrict。
 *
 * Usage: node --test test/preset-isolation-restore.test.mjs
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { apply } from '../vendor/prompt-customizer/index.js'
import { closeAllDbs, openDb, setDoc } from '../vendor/prompt-customizer/db.js'

const TOOL_NAMES = ['tool-0', 'tool-1', 'tool-2', 'tool-3', 'tool-4']

function makeHarness() {
  const restrictions = []
  const disposals = []
  const handlers = new Map()
  const onUnsubs = []
  const effects = []
  let waterfall

  const tools = {
    schemas: () => TOOL_NAMES.map((name) => ({ name })),
    restrict: ({ deny }) => {
      restrictions.push([...deny])
      return () => { disposals.push([...deny]) }
    },
  }
  const agentA = {
    id: 'agent-a',
    session: { header: { id: 'session-a', agentPreset: 'preset-a', cwd: '/a', delegationDepth: 0 } },
    ctx: { preset: 'preset-a', get: (name) => name === 'tools' ? tools : undefined },
  }
  const agentB = {
    id: 'agent-b',
    session: { header: { id: 'session-b', agentPreset: 'preset-b', cwd: '/b', delegationDepth: 0 } },
    ctx: { preset: 'preset-b', get: (name) => name === 'tools' ? tools : undefined },
  }
  const sectionsFor = (scope) => scope === agentA
    ? [
        { name: 'persona-a', order: 0, text: 'A original persona' },
        { name: 'shared', order: 1, text: 'A shared' },
      ]
    : [
        { name: 'persona-b', order: 0, text: 'B original persona' },
        { name: 'shared', order: 1, text: 'B shared' },
      ]
  const sp = {
    variable: () => () => {},
    layers: { merge: () => new Map() },
    assemble: async (context = {}) => {
      const assembly = {
        sections: sectionsFor(context.scope),
        contexts: [],
        variables: {},
        tools: TOOL_NAMES.map((name) => ({ name, description: name })),
      }
      return typeof waterfall === 'function'
        ? waterfall(assembly, context, async () => assembly)
        : assembly
    },
  }
  const presets = {
    list: async () => [{ id: 'preset-a', name: 'A' }, { id: 'preset-b', name: 'B' }],
    resolve: async () => ({ id: 'preset-a' }),
    acquireScope: async (id) => ({ key: id, [Symbol.asyncDispose]: async () => {} }),
    // 模拟旧投影未刷新：两个会话都返回同一个 preset；composedPreset 才是权威。
    presetForSession: () => 'preset-a',
    composedPreset: (agentContext) => agentContext?.preset,
  }
  const ctx = {
    systemPrompt: sp,
    tools,
    logger: { warn: () => {} },
    inject: () => {},
    effect: (run) => {
      const dispose = run()
      if (typeof dispose === 'function') effects.push(dispose)
      return dispose
    },
    on: (event, handler) => {
      if (!handlers.has(event)) handlers.set(event, [])
      handlers.get(event).push(handler)
      if (event === 'system-prompt/assemble') waterfall = handler
      const off = () => {
        const list = handlers.get(event) ?? []
        const index = list.indexOf(handler)
        if (index >= 0) list.splice(index, 1)
        if (event === 'system-prompt/assemble' && waterfall === handler) waterfall = undefined
      }
      onUnsubs.push(off)
      return off
    },
    get: (name) => ({
      systemPrompt: sp,
      tools,
      agents: { roots: () => [agentA, agentB] },
      agentPresets: presets,
      sessionProjections: { stateOf: () => ({ promoted: true, boundary: -1 }) },
      connection: { requestRejection: () => undefined },
    })[name],
  }
  const emit = (event, ...args) => (handlers.get(event) ?? []).map((handler) => handler(...args))
  const uninstall = () => {
    for (const dispose of effects.splice(0)) {
      try { dispose() } catch { /* 清理单个 effect 失败不影响其它 effect */ }
    }
    for (const off of onUnsubs.splice(0)) off()
  }
  return { ctx, sp, agentA, agentB, tools, restrictions, disposals, emit, uninstall }
}

test('A/B 预设的提示词段和工具屏蔽互不影响，卸载后全部恢复', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-isolation-restore-'))
  const dataDir = path.join(root, 'data')
  const db = openDb(path.join(dataDir, 'prompt-customizer.db'))
  setDoc(db, 'config', {
    forceSections: true,
    overrides: {
      'preset-a': {
        sections: [{ name: 'persona-a' }],
        inject: [{ name: 'custom-a', text: 'A injected', phase: 'always', custom: true, source: { kind: 'preset', id: 'preset-a' } }],
        tools: { exclude: [{ name: 'tool-0' }, { name: 'tool-1' }] },
      },
      'preset-b': {
        sections: [{ name: 'persona-b' }],
        inject: [{ name: 'custom-b', text: 'B injected', phase: 'always', custom: true, source: { kind: 'preset', id: 'preset-b' } }],
        tools: { exclude: [{ name: 'tool-3' }] },
      },
    },
  })
  const h = makeHarness()
  try {
    apply(h.ctx, { dataDir })

    const a = await h.sp.assemble({ scope: h.agentA, agent: h.agentA })
    const b = await h.sp.assemble({ scope: h.agentB, agent: h.agentB })

    const namesA = a.sections.map((section) => section.name).sort()
    const namesB = b.sections.map((section) => section.name).sort()
    assert.deepEqual(namesA, ['custom-a', 'shared'], `A 预设不应混入 B：${JSON.stringify(namesA)}`)
    assert.deepEqual(namesB, ['custom-b', 'shared'], `B 预设不应混入 A：${JSON.stringify(namesB)}`)
    assert.equal(a.sections.find((section) => section.name === 'shared').text, 'A shared')
    assert.equal(b.sections.find((section) => section.name === 'shared').text, 'B shared')

    assert.deepEqual(h.restrictions, [['tool-0', 'tool-1'], ['tool-3']], 'A/B 工具屏蔽名单必须各自独立')
    const preA = await Promise.all(h.emit('tools/pre-execute', { agent: h.agentA, name: 'tool-0' }, async () => ({ kind: 'allow' })))
    const preB = await Promise.all(h.emit('tools/pre-execute', { agent: h.agentB, name: 'tool-0' }, async () => ({ kind: 'allow' })))
    assert.equal(preA[0].kind, 'deny')
    assert.equal(preB[0].kind, 'allow', 'A 的屏蔽不能拦 B')

    h.uninstall()
    const restoredA = await h.sp.assemble({ scope: h.agentA, agent: h.agentA })
    const restoredB = await h.sp.assemble({ scope: h.agentB, agent: h.agentB })
    assert.deepEqual(restoredA.sections.map((section) => section.name).sort(), ['persona-a', 'shared'], '卸载后 A 提示词应恢复原文')
    assert.deepEqual(restoredB.sections.map((section) => section.name).sort(), ['persona-b', 'shared'], '卸载后 B 提示词应恢复原文')
    assert.deepEqual(h.disposals.slice().sort(), [['tool-0', 'tool-1'], ['tool-3']].sort(), '卸载必须释放所有工具 restrict')
    const afterUninstall = await h.emit('tools/pre-execute', { agent: h.agentA, name: 'tool-0' }, async () => ({ kind: 'allow' }))
    assert.equal(afterUninstall.length, 0, '卸载后不能残留 tools/pre-execute 拦截')
  } finally {
    h.uninstall()
    closeAllDbs()
    fs.rmSync(root, { recursive: true, force: true })
  }
})

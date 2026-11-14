/**
 * ADR-0007: a blocked prompt section must suppress its same-{name,source}
 * runtime context at every layer (real waterfall, preview contexts, inventory).
 *
 * Counterexample: if withLinkedContextDenials() is removed, the "blocked section"
 * assertions for contexts must fail while the explicit context-deny case stays.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { apply } from '../vendor/prompt-customizer/index.js'
import { openDb, setDoc } from '../vendor/prompt-customizer/db.js'

const PRESET_KEY = { preset: 'standard' }
const AGENT = {
  id: 'agent-1',
  ctx: {},
  session: { header: { id: 'session-1', agentPreset: 'standard', cwd: '/ws', createdAt: 1, delegationDepth: 0 } },
}

const GLOBAL_SECTIONS = [
  { name: 'harness:identity', order: 0, text: 'IDENTITY' },
  { name: 'harness:source', order: 20, text: 'SOURCE GUIDANCE' },
  { name: 'app:web-surface', order: 21, text: 'WEB GUIDANCE' },
]
const PRESET_SECTIONS = [{ name: 'deployment:persona', order: 1, text: 'PERSONA' }]
const GLOBAL_CONTEXTS = [
  { name: 'harness:source', order: 20, text: 'CHECKOUT_VALUE' },
  { name: 'app:web-surface', order: 21, text: 'WEB_URL' },
  { name: 'working-directory:current', order: 0, text: 'CWD' },
]
const PRESET_CONTEXTS = [{ name: 'subagent:identity', order: 10, text: 'IDENTITY_VALUE' }]

function namedMap(list) {
  return new Map(list.map((item) => [item.name, { ...item }]))
}

function harness(t, config) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-context-link-'))
  t.after(() => fs.rmSync(dataDir, { recursive: true, force: true }))
  if (config !== undefined) setDoc(openDb(path.join(dataDir, 'prompt-customizer.db')), 'config', config)

  const routes = new Map()
  let handler
  const layers = {
    global: { sections: namedMap(GLOBAL_SECTIONS), contexts: namedMap(GLOBAL_CONTEXTS) },
    peek: (scope) => {
      if (scope === PRESET_KEY || scope === AGENT) return { sections: namedMap(PRESET_SECTIONS), contexts: namedMap(PRESET_CONTEXTS) }
      return undefined
    },
    chainLayers: (scope) => scope === AGENT
      ? [{ sections: namedMap(PRESET_SECTIONS), contexts: namedMap(PRESET_CONTEXTS) }, { sections: namedMap([]), contexts: namedMap([]) }]
      : [{ sections: namedMap(PRESET_SECTIONS), contexts: namedMap(PRESET_CONTEXTS) }],
    merge: (scope, pick) => {
      const sections = new Map([...GLOBAL_SECTIONS.map((item) => [item.name, item]), ...PRESET_SECTIONS.map((item) => [item.name, item])])
      const contexts = new Map([...GLOBAL_CONTEXTS.map((item) => [item.name, item]), ...PRESET_CONTEXTS.map((item) => [item.name, item])])
      if (scope === AGENT) {
        for (const item of PRESET_SECTIONS) sections.set(item.name, item)
        for (const item of PRESET_CONTEXTS) contexts.set(item.name, item)
      }
      return pick({ sections, contexts })
    },
  }
  const assemblyFor = (scope) => ({
    sections: [...layers.merge(scope, (layer) => layer.sections).values()],
    contexts: [...layers.merge(scope, (layer) => layer.contexts).values()],
    variables: {},
    tools: [],
  })
  const sp = {
    variable: () => () => {},
    layers,
    assemble: async (context = {}) => {
      const assembly = assemblyFor(context.scope)
      return handler(assembly, context, async () => assembly)
    },
  }
  const presets = {
    list: async () => [{ id: 'standard', name: 'standard' }],
    composedPreset: () => 'standard',
    acquireScope: async () => ({ key: PRESET_KEY, [Symbol.asyncDispose]: async () => {} }),
  }
  const ctx = {
    systemPrompt: sp,
    logger: { info: () => {}, warn: () => {}, debug: () => {} },
    on: (event, fn) => { if (event === 'system-prompt/assemble') handler = fn },
    inject: (_names, callback) => { callback(ctx); return () => {} },
    effect: (fn) => {
      const dispose = fn()
      return typeof dispose === 'function' ? dispose : () => {}
    },
    get: (name) => ({
      systemPrompt: sp,
      tools: { schemas: () => [] },
      agentPresets: presets,
      agents: { list: () => [AGENT] },
      sessionProjections: { stateOf: () => ({ promoted: true, boundary: -1 }) },
      connection: { requestRejection: () => undefined },
      webServer: { register: (route) => { routes.set(route.path, route.handler); return () => {} } },
    })[name],
  }
  apply(ctx, { dataDir })
  async function request(endpoint) {
    const res = { status: 0, body: null, writeHead(code) { this.status = code }, end(text) { this.body = JSON.parse(text) } }
    await routes.get(`/api/prompt-customizer/${endpoint.split('?')[0]}`)({ method: 'GET', url: `/api/prompt-customizer/${endpoint}` }, res)
    return { status: res.status, body: res.body }
  }
  return { request, sp, agent: AGENT }
}

const sectionBlock = (source = { kind: 'global' }) => ({
  sections: [{ name: 'harness:source', source }],
  sectionsBootstrap: [{ name: 'harness:source', source }],
  sectionsCompaction: [{ name: 'harness:source', source }],
})

test('blocking harness:source section suppresses same-name global runtime context', async (t) => {
  const h = harness(t, { forceSections: true, overrides: { standard: sectionBlock() } })
  const preview = await h.request('preview?scope=standard&phase=active')
  if (preview.status !== 200) console.error('preview failure', preview.body)
  assert.equal(preview.status, 200)
  assert.ok(!preview.body.contexts.some((item) => item.name === 'harness:source'), 'preview contexts 不得包含被段屏蔽联动的上下文')
  const base = preview.body.baseContexts.find((item) => item.name === 'harness:source')
  assert.equal(base?.blocked, true, 'baseContexts 应把该上下文标成 blocked')
  assert.ok(preview.body.contexts.some((item) => item.name === 'app:web-surface'), '未屏蔽的上下文仍应保留')

  const assembly = await h.sp.assemble({ scope: h.agent, agent: h.agent })
  assert.ok(!assembly.contexts.some((item) => item.name === 'harness:source'), '真实装配 waterfall 必须滤掉同名上下文')
  assert.ok(assembly.contexts.some((item) => item.name === 'app:web-surface'))
})

test('同名不同源的段屏蔽不会误伤上下文', async (t) => {
  const h = harness(t, { forceSections: true, overrides: { standard: sectionBlock({ kind: 'preset', id: 'standard' }) } })
  const preview = await h.request('preview?scope=standard&phase=active')
  assert.ok(preview.body.contexts.some((item) => item.name === 'harness:source'), 'global 上下文不能被 preset 来源的段屏蔽命中')
  const assembly = await h.sp.assemble({ scope: h.agent, agent: h.agent })
  assert.ok(assembly.contexts.some((item) => item.name === 'harness:source'))
})

test('显式 contexts 屏蔽仍然独立生效', async (t) => {
  const h = harness(t, {
    forceSections: true,
    overrides: {
      standard: {
        contexts: [{ name: 'app:web-surface', source: { kind: 'global' } }],
        contextsBootstrap: [{ name: 'app:web-surface', source: { kind: 'global' } }],
        contextsCompaction: [{ name: 'app:web-surface', source: { kind: 'global' } }],
      },
    },
  })
  const preview = await h.request('preview?scope=standard&phase=active')
  assert.ok(!preview.body.contexts.some((item) => item.name === 'app:web-surface'))
  const assembly = await h.sp.assemble({ scope: h.agent, agent: h.agent })
  assert.ok(!assembly.contexts.some((item) => item.name === 'app:web-surface'))
})

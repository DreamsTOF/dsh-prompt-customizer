/**
 * 来源（source）推导：global / preset(id) / agent(session) / executor。
 * 用接近宿主的 systemPrompt.layers（global + peek + chainLayers）验证
 * baseSections / baseTools 与 /session 的候选都带来源，身份匹配按 name+source。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { apply } from '../vendor/prompt-customizer/index.js'
import { openDb, setDoc } from '../vendor/prompt-customizer/db.js'

const PRESET_KEY = { preset: 'standard' }
const AGENT = { id: 'agent-1', session: { header: { id: 'session-1', agentPreset: 'standard', cwd: '/ws', createdAt: 1, delegationDepth: 0 } } }
const G = { kind: 'global' }
const P = { kind: 'preset', id: 'standard' }
const A = { kind: 'agent', id: 'session-1' }

function namedMap(list) {
  return new Map(list.map((item) => [item.name, { ...item }]))
}

function harness(t, { config } = {}) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-source-'))
  t.after(() => fs.rmSync(dataDir, { recursive: true, force: true }))
  if (config !== undefined) setDoc(openDb(path.join(dataDir, 'prompt-customizer.db')), 'config', config)
  const routes = new Map()
  const globalSections = [
    { name: 'harness:identity', order: 0, text: 'identity' },
    { name: 'tool:read', order: 10, text: 'global read' },
  ]
  const presetSections = [
    { name: 'deployment:persona', order: 1, text: 'preset persona' },
    { name: 'tool:write', order: 20, text: 'preset write' },
  ]
  const agentSections = [{ name: 'tool:undo_last_edit', order: 15, text: 'agent undo' }]
  const layers = {
    global: { sections: namedMap(globalSections), contexts: new Map() },
    peek: (scope) => {
      if (scope === PRESET_KEY) return { sections: namedMap(presetSections), contexts: new Map() }
      if (scope === AGENT) return { sections: namedMap(agentSections), contexts: new Map() }
      return undefined
    },
    chainLayers: (scope) => {
      if (scope === AGENT) return [
        { sections: namedMap(presetSections), contexts: new Map() },
        { sections: namedMap(agentSections), contexts: new Map() },
      ]
      if (scope === PRESET_KEY) return [{ sections: namedMap(presetSections), contexts: new Map() }]
      return []
    },
    merge: (scope, pick) => {
      const map = new Map()
      for (const item of globalSections) map.set(item.name, { ...item })
      if (scope === PRESET_KEY) for (const item of presetSections) map.set(item.name, { ...item })
      if (scope === AGENT) {
        for (const item of presetSections) map.set(item.name, { ...item })
        for (const item of agentSections) map.set(item.name, { ...item })
      }
      return pick ? pick({ sections: map, contexts: new Map() }) : map
    },
  }
  const sectionsFor = (scope) => {
    const map = layers.merge(scope, (layer) => layer.sections)
    return [...map.values()].sort((a, b) => a.order - b.order)
  }
  let handler
  const sp = {
    variable: () => () => {},
    layers,
    assemble: async (context) => {
      const assembly = { sections: sectionsFor(context.scope), contexts: [], variables: {} }
      return handler(assembly, context, () => Promise.resolve(assembly))
    },
  }
  const tools = {
    schemas: (scope) => {
      const globalTools = [{ name: 'read' }, { name: 'bash' }]
      const presetTools = [{ name: 'write' }, { name: 'edit' }]
      const agentTools = [{ name: 'undo_last_edit' }, { name: 'extra_agent' }]
      if (scope === PRESET_KEY) return [...presetTools]
      if (scope === AGENT) return [...globalTools, ...presetTools, ...agentTools]
      return [...globalTools]
    },
    definitions: (scope) => tools.schemas(scope),
  }
  const presets = {
    list: async () => [{ id: 'standard', name: 'Standard' }],
    acquireScope: async () => ({ key: PRESET_KEY, [Symbol.asyncDispose]: async () => {} }),
  }
  const ctx = {
    systemPrompt: sp,
    tools,
    on: (event, fn) => { if (event === 'system-prompt/assemble') handler = fn },
    inject: () => {},
    effect: (fn) => { const dispose = fn(); return typeof dispose === 'function' ? dispose : () => {} },
    get: (name) => ({
      systemPrompt: sp,
      tools,
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
    return res
  }
  return { request }
}

test('preview baseSections / baseTools 是纯预设装配，只带 global / preset 来源', async (t) => {
  const h = harness(t)
  const res = await h.request('preview?scope=standard&phase=active')
  assert.equal(res.status, 200)
  assert.ok(Array.isArray(res.body.baseContexts), '每个阶段都必须返回 baseContexts（可为空数组）')
  assert.equal(res.body.sessionOverlay, undefined, '预设预览不得带当前会话 overlay')
  const sectionSource = new Map(res.body.baseSections.map((section) => [section.name, section.source?.kind]))
  assert.equal(sectionSource.get('harness:identity'), 'global')
  assert.equal(sectionSource.get('deployment:persona'), 'preset')
  assert.equal(sectionSource.get('tool:undo_last_edit'), undefined)
  assert.deepEqual(res.body.baseSections.find((section) => section.name === 'deployment:persona').source, P)

  const toolSource = new Map(res.body.baseTools.map((tool) => [tool.name, tool.source?.kind]))
  assert.equal(toolSource.get('read'), 'global')
  assert.equal(toolSource.get('write'), 'preset')
  assert.equal(toolSource.get('undo_last_edit'), undefined)
})

test('/session 最终 sections 走非 base 装配，base 只作为左栏 catalog；屏蔽按 source 命中', async (t) => {
  const h = harness(t, {
    config: {
      overrides: {
        standard: {
          sections: [{ name: 'deployment:persona', source: P }],
        },
      },
    },
  })
  const res = await h.request('session')
  assert.equal(res.status, 200)
  const finalNames = res.body.sections.map((section) => section.name)
  assert.ok(!finalNames.includes('deployment:persona'), '真实装配里被屏蔽的预设段不出现在最终 sections')
  const catalog = res.body.baseSections.find((section) => section.name === 'deployment:persona')
  assert.equal(catalog?.blocked, true, 'base catalog 仍列出被屏蔽条目供反选')
  assert.deepEqual(catalog?.source, P)
  assert.ok(res.body.sections.find((section) => section.name === 'tool:undo_last_edit'), 'agent 段来自真实装配')
})

test('未知阶段：预览查询返回 400 并记录，不静默当 active', async (t) => {
  const h = harness(t)
  const res = await h.request('preview?scope=standard&phase=nope')
  assert.equal(res.status, 400)
  assert.match(res.body.error, /unknown phase/)
})

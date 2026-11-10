/**
 * 工具提示词段元数据的回归：预览 / 清单必须把 tool:* section 与工具行关联，
 * 并正确标记组段、空段和无段工具。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { apply } from '../vendor/prompt-customizer/index.js'

const PRESET_KEY = { preset: 'standard' }
const AGENT = {
  id: 'agent-1',
  ctx: {},
  session: { header: { id: 'session-1', agentPreset: 'standard', cwd: '/ws', createdAt: 1, delegationDepth: 0 } },
}
const TOOLS = [
  { name: 'read', description: 'read tool' },
  { name: 'job_list', description: 'job list' },
  { name: 'job_kill', description: 'job kill' },
  { name: 'job_output', description: 'job output' },
  { name: 'terminal_open', description: 'terminal open' },
  { name: 'terminal_list', description: 'terminal list' },
  { name: 'subagent', description: 'subagent' },
  { name: 'subagent_fork', description: 'subagent fork' },
  { name: 'workflow', description: 'workflow' },
  { name: 'pwsh', description: 'no prompt section' },
]
const SECTIONS = [
  { name: 'tool:read', order: 1100, text: 'Read guidance.' },
  { name: 'tool:jobs', order: 1600, text: 'Track background jobs.' },
  { name: 'tool:pty', order: 1700, text: 'Use terminal sessions.' },
  { name: 'tool:subagent', order: 2800, text: 'Delegate with subagent and subagent_fork.' },
  { name: 'tool:subagent_fork', order: 2800, text: '' },
  { name: 'tool:workflow', order: 2600, text: 'Use workflow for fan-out.' },
]

function namedMap(list) {
  return new Map(list.map((item) => [item.name, { ...item }]))
}

function harness(t) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-tool-prompt-'))
  t.after(() => fs.rmSync(dataDir, { recursive: true, force: true }))
  const routes = new Map()
  let handler
  const sectionMap = namedMap(SECTIONS)
  const layers = {
    global: { sections: sectionMap, contexts: new Map() },
    peek: () => ({ sections: sectionMap, contexts: new Map() }),
    chainLayers: () => [],
    merge: (_scope, pick) => pick ? pick({ sections: sectionMap, contexts: new Map() }) : sectionMap,
  }
  const sp = {
    variable: () => () => {},
    layers,
    assemble: async (context) => {
      const assembly = {
        sections: SECTIONS.map((section) => ({ name: section.name, text: section.text })),
        contexts: [],
        variables: {},
        tools: TOOLS.map((tool) => ({ ...tool })),
      }
      return handler(assembly, context, async () => assembly)
    },
  }
  const tools = {
    schemas: () => TOOLS,
    definitions: () => TOOLS,
  }
  const presets = {
    list: async () => [{ id: 'standard' }],
    composedPreset: () => 'standard',
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
    return { status: res.status, body: res.body }
  }
  return { request }
}

test('tool rows carry promptSections and group / empty / absent cases', async (t) => {
  const h = harness(t)
  const preview = await h.request('preview?scope=standard&phase=active')
  assert.equal(preview.status, 200)
  const byName = new Map(preview.body.baseTools.map((tool) => [tool.name, tool]))

  assert.deepEqual(byName.get('job_list')?.promptSections?.map((section) => section.name), ['tool:jobs'])
  assert.deepEqual(byName.get('terminal_open')?.promptSections?.map((section) => section.name), ['tool:pty'])
  assert.deepEqual(byName.get('subagent_fork')?.promptSections?.map((section) => section.name), ['tool:subagent', 'tool:subagent_fork'])
  assert.equal(byName.get('subagent_fork')?.promptSections?.find((section) => section.name === 'tool:subagent_fork')?.empty, true)
  assert.deepEqual(byName.get('pwsh')?.promptSections, undefined, '无提示词段的工具保持明确缺省')

  const jobSection = preview.body.baseSections.find((section) => section.name === 'tool:jobs')
  assert.deepEqual(jobSection?.toolPrompt?.tools, ['job_kill', 'job_list', 'job_output'])
  const forkSection = preview.body.baseSections.find((section) => section.name === 'tool:subagent_fork')
  assert.deepEqual(forkSection?.toolPrompt?.tools, ['subagent_fork'])
  assert.equal(forkSection?.toolPrompt?.empty, true)
})

test('inventory exposes the same promptSections metadata', async (t) => {
  const h = harness(t)
  const inv = await h.request('inventory?scope=standard')
  assert.equal(inv.status, 200)
  const job = inv.body.tools.find((tool) => tool.name === 'job_list')
  assert.deepEqual(job?.promptSections?.map((section) => section.name), ['tool:jobs'])
})

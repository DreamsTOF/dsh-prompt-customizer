/**
 * 「当前会话」只读视图 + 预设预览左栏的 agent 作用域补全。
 *
 * 重点覆盖用户报告的两类缺口：
 *  - 工具：插件在 agent/created 时注册的工具（agent 作用域）不在预设注册表，
 *    以及插件用 tools.restrict 在 agent 作用域遮蔽的预设工具；
 *  - 提示词：agent 作用域注册/覆盖的段（如 hashline-edit 的 tool:undo_last_edit）。
 *
 * 预设预览右栏必须保持纯预设装配；只有左栏 base 列表和 /session 路由包含
 * agent 作用域条目。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { apply } from '../vendor/prompt-customizer/index.js'

const KEY = { scope: 'preset:standard' }
const AGENT = {
  id: 'agent-1',
  session: { header: { id: 'session-1', agentPreset: 'standard', cwd: path.resolve('workspace'), createdAt: 42, delegationDepth: 0 } },
}

const PRESET_SECTIONS = [
  { name: 'persona', order: 0, text: 'preset persona' },
  { name: 'tool:read', order: 10, text: 'preset read guidance' },
  { name: 'tool:write', order: 20, text: 'preset write guidance' },
]
const AGENT_SECTIONS = [
  { name: 'persona', order: 0, text: 'preset persona' },
  { name: 'tool:read', order: 10, text: 'hashline read guidance' },
  { name: 'tool:write', order: 20, text: 'preset write guidance' },
  { name: 'tool:undo_last_edit', order: 30, text: 'undo last edit guidance' },
]

function harness(t, { live = true, toolMask } = {}) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-session-'))
  t.after(() => fs.rmSync(dataDir, { recursive: true, force: true }))
  const routes = new Map()
  let handler
  const sectionsFor = (scope) => scope === AGENT ? AGENT_SECTIONS : PRESET_SECTIONS
  const sp = {
    variable: () => () => {},
    layers: { merge: (scope, pick) => pick({ sections: new Map(sectionsFor(scope).map(section => [section.name, section])), contexts: new Map() }) },
    assemble: async (context) => {
      const assembly = {
        sections: sectionsFor(context.scope).map(section => ({ name: section.name, text: section.text })),
        contexts: [{ name: 'working-directory:current', text: 'cwd' }],
        variables: { cwd: '/workspace' },
      }
      return handler(assembly, context, async () => assembly)
    },
  }
  const presets = {
    list: async () => [{ id: 'standard', name: 'Standard' }],
    resolve: async () => ({ id: 'standard' }),
    acquireScope: async () => ({ key: KEY, [Symbol.asyncDispose]: async () => {} }),
  }
  const schemas = (scope) => {
    if (scope === AGENT) return [
      { name: 'read', description: 'agent read' },
      { name: 'undo_last_edit', description: 'agent-only tool' },
    ]
    return [
      { name: 'read', description: 'preset read' },
      { name: 'write', description: 'preset write' },
      { name: 'edit', description: 'preset edit' },
      { name: 'mcp__demo__query', description: 'demo query' },
    ]
  }
  const effects = []
  const ctx = {
    systemPrompt: sp,
    tools: { schemas },
    on: (event, fn) => { if (event === 'system-prompt/assemble') handler = fn },
    inject: () => {},
    effect: (fn) => { effects.push(fn()) },
    get: (name) => ({
      systemPrompt: sp,
      tools: { schemas },
      agentPresets: presets,
      agents: { list: () => (live ? [AGENT] : []) },
      sessionProjections: { stateOf: () => ({ promoted: true, boundary: -1 }) },
      connection: { requestRejection: () => undefined },
      webServer: { register: (route) => { routes.set(route.path, route.handler); return () => {} } },
    })[name],
  }
  apply(ctx, { dataDir, ...(toolMask === undefined ? {} : { toolMask }) })
  async function request(endpoint, method = 'GET') {
    const res = { statusCode: 0, body: '', writeHead(code) { this.statusCode = code }, end(text) { this.body = JSON.parse(text) } }
    await routes.get(`/api/prompt-customizer/${endpoint.split('?')[0]}`)(
      { method, url: `/api/prompt-customizer/${endpoint}` },
      res,
    )
    return res
  }
  return { request, ctx }
}

test('预设预览：右栏纯预设，不并入任何会话 agent 作用域条目', async (t) => {
  const h = harness(t)
  const res = await h.request('preview?scope=standard&phase=active')
  assert.equal(res.statusCode, 200)
  assert.equal(res.body.source, 'preset')
  assert.deepEqual(res.body.tools.map(tool => tool.name).sort(), ['edit', 'mcp__demo__query', 'read', 'write'])
  // 预设预览仍是纯预设可见集：agent 新增 / 被别的插件遮蔽的项都不进右栏。
  assert.ok(!res.body.tools.some(tool => tool.name === 'undo_last_edit'))
  const byName = new Map(res.body.baseTools.map(tool => [tool.name, tool]))
  assert.equal(byName.get('undo_last_edit'), undefined)
  assert.notEqual(byName.get('write')?.maskedByPlugin, true)
  assert.notEqual(byName.get('edit')?.maskedByPlugin, true)
  assert.equal(res.body.registryTotal, 4)
})

test('预设预览：本插件自己的 MCP 遮蔽会计入可见性与标记', async (t) => {
  const h = harness(t, { toolMask: async (_preset, names) => new Set(names.filter(name => name === 'mcp__demo__query')) })
  const res = await h.request('preview?scope=standard&phase=active')
  const row = res.body.baseTools.find(tool => tool.name === 'mcp__demo__query')
  assert.equal(row?.maskedByOwnPlugin, true)
  assert.ok(!res.body.tools.some(tool => tool.name === 'mcp__demo__query'))
})

test('/session：真实 agent 装配包含 agent 作用域段与工具，并保留完整目录标记', async (t) => {
  const h = harness(t)
  const res = await h.request('session')
  assert.equal(res.statusCode, 200)
  assert.equal(res.body.source, 'session')
  assert.equal(res.body.session.id, 'session-1')
  assert.equal(res.body.session.presetId, 'standard')
  assert.ok(res.body.sections.some(section => section.name === 'tool:undo_last_edit'))
  const read = res.body.sections.find(section => section.name === 'tool:read')
  assert.equal(read.text, 'hashline read guidance', '同名段取 agent 作用域的真实文本')
  assert.ok(res.body.tools.some(tool => tool.name === 'undo_last_edit'))
  assert.ok(!res.body.tools.some(tool => tool.name === 'write'), '被 restrict 的工具不在模型可见集')
  const write = res.body.baseTools.find(tool => tool.name === 'write')
  assert.equal(write?.maskedByPlugin, true)
})

test('没有活动会话时 /session 返回空态', async (t) => {
  const h = harness(t, { live: false })
  const res = await h.request('session')
  assert.equal(res.statusCode, 200)
  assert.equal(res.body.session, null)
  assert.deepEqual(res.body.tools, [])
})

test('agent-presets 带回当前会话所属预设', async (t) => {
  const h = harness(t)
  const res = await h.request('agent-presets')
  assert.equal(res.statusCode, 200)
  assert.equal(res.body.currentPreset, 'standard')
})


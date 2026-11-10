/**
 * ADR-0005 全域系统提示词接管的组合回归。
 *
 * 反例（会推翻实现的观测）：如果 `buildPreview` 把 live 段换回空数组、只做纯预设
 * 装配，或为 `tool:*` 名字写死特判，「会话级段进入清单」「任意段名的 agent 段可
 * 枚举」「屏蔽后真实装配消失」这些用例必须失败；如果 `stableSourceOf` 不收敛 agent
 * 来源，身份 / 屏蔽 / 跨会话断言必须失败。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { apply } from '../vendor/prompt-customizer/index.js'
import { openDb, setDoc } from '../vendor/prompt-customizer/db.js'

const PRESET_KEY = { preset: 'standard' }
const OTHER_KEY = { preset: 'other' }
const AGENT = {
  id: 'agent-1',
  ctx: {},
  session: { header: { id: 'session-1', agentPreset: 'standard', cwd: '/ws', createdAt: 1, delegationDepth: 0 } },
}

const GLOBAL_SECTIONS = [
  { name: 'harness:identity', order: 0, text: 'IDENTITY' },
  { name: 'tool:read', order: 1100, text: 'HOST READ GUIDANCE' },
]
const PRESET_SECTIONS = [
  { name: 'deployment:persona', order: 1, text: 'PERSONA' },
]
const DEFAULT_AGENT_SECTIONS = [
  { name: 'tool:read', order: 1100, text: 'PLUGIN READ GUIDANCE' },
  { name: 'tool:apply_patch', order: 1350, text: 'PLUGIN PATCH GUIDANCE' },
  { name: 'tool:undo_last_edit', order: 1360, text: 'PLUGIN UNDO GUIDANCE' },
]
const PRESET_TOOLS = [{ name: 'read' }, { name: 'write' }, { name: 'bash' }]
const AGENT_TOOLS = [...PRESET_TOOLS, { name: 'apply_patch' }, { name: 'undo_last_edit' }]

function namedMap(list) {
  return new Map(list.map((item) => [item.name, { ...item }]))
}

function harness(t, { config, live = true, agentSections = DEFAULT_AGENT_SECTIONS, agentPresetId = 'standard' } = {}) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-takeover-'))
  t.after(() => fs.rmSync(dataDir, { recursive: true, force: true }))
  if (config !== undefined) {
    setDoc(openDb(path.join(dataDir, 'prompt-customizer.db')), 'config', config)
  }
  const routes = new Map()
  let handler
  const layers = {
    global: { sections: namedMap(GLOBAL_SECTIONS), contexts: new Map() },
    peek: (scope) => {
      if (scope === AGENT) return { sections: namedMap(agentSections), contexts: new Map() }
      if (scope === PRESET_KEY || scope === OTHER_KEY) return { sections: namedMap(PRESET_SECTIONS), contexts: new Map() }
      return undefined
    },
    chainLayers: (scope) => scope === AGENT
      ? [{ sections: namedMap(PRESET_SECTIONS), contexts: new Map() }, { sections: namedMap(agentSections), contexts: new Map() }]
      : [{ sections: namedMap(PRESET_SECTIONS), contexts: new Map() }],
    merge: (scope, pick) => {
      const map = new Map()
      for (const section of GLOBAL_SECTIONS) map.set(section.name, { ...section })
      if (scope === PRESET_KEY || scope === OTHER_KEY || scope === AGENT) {
        for (const section of PRESET_SECTIONS) map.set(section.name, { ...section })
      }
      if (scope === AGENT) for (const section of agentSections) map.set(section.name, { ...section })
      return pick ? pick({ sections: map, contexts: new Map() }) : map
    },
  }
  const sectionsFor = (scope) => [...layers.merge(scope, (layer) => layer.sections).values()]
    .sort((a, b) => a.order - b.order)
  const sp = {
    variable: () => () => {},
    layers,
    assemble: async (context) => {
      const assembly = {
        sections: sectionsFor(context.scope).map((section) => ({ name: section.name, text: section.text })),
        contexts: [],
        variables: {},
        tools: PRESET_TOOLS.map((tool) => ({ ...tool })),
      }
      return handler(assembly, context, async () => assembly)
    },
  }
  const schemas = (scope) => (scope === AGENT ? AGENT_TOOLS : PRESET_TOOLS)
  const presets = {
    list: async () => [{ id: 'standard' }, { id: 'other' }],
    composedPreset: () => agentPresetId,
    acquireScope: async (id) => ({ key: id === 'other' ? OTHER_KEY : PRESET_KEY, [Symbol.asyncDispose]: async () => {} }),
  }
  const ctx = {
    systemPrompt: sp,
    tools: { schemas },
    on: (event, fn) => { if (event === 'system-prompt/assemble') handler = fn },
    inject: () => {},
    effect: (fn) => { const dispose = fn(); return typeof dispose === 'function' ? dispose : () => {} },
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
  apply(ctx, { dataDir })
  async function request(endpoint) {
    const res = { status: 0, body: null, writeHead(code) { this.status = code }, end(text) { this.body = JSON.parse(text) } }
    await routes.get(`/api/prompt-customizer/${endpoint.split('?')[0]}`)({ method: 'GET', url: `/api/prompt-customizer/${endpoint}` }, res)
    return { status: res.status, body: res.body }
  }
  return { request }
}

test('会话级段进入清单与预览，同名不同源分列，身份收敛为 {kind:agent}', async (t) => {
  const h = harness(t)
  const inv = await h.request('inventory?scope=standard')
  assert.equal(inv.status, 200)
  const readRows = inv.body.sections.filter((section) => section.name === 'tool:read')
  assert.equal(readRows.length, 2, '宿主 global 行与插件 agent 行必须按 ADR-0002 分列')
  assert.deepEqual(readRows.map((row) => row.source?.kind).sort(), ['agent', 'global'])
  for (const name of ['tool:apply_patch', 'tool:undo_last_edit']) {
    const row = inv.body.sections.find((section) => section.name === name)
    assert.ok(row, `${name} 必须出现在可编辑清单（插件动态注入的段）`)
    assert.deepEqual(row.source, { kind: 'agent' }, '不带 session id，跨会话稳定')
    assert.equal(row.scope, 'agent')
  }
  const preview = await h.request('preview?scope=standard&phase=active')
  assert.ok(preview.body.text.includes('PLUGIN READ GUIDANCE'))
  assert.ok(preview.body.text.includes('PLUGIN PATCH GUIDANCE'))
  assert.ok(preview.body.text.includes('PLUGIN UNDO GUIDANCE'))
  assert.ok(!preview.body.text.includes('HOST READ GUIDANCE'), '真实装配里同名段被 agent 层遮蔽')
})

test('屏蔽会话级段后 /preview.text 与 /session.sections 都不含它，撤销即恢复', async (t) => {
  const config = {
    overrides: { standard: { sections: [{ name: 'tool:undo_last_edit', source: { kind: 'agent' } }] } },
  }
  const blocked = harness(t, { config })
  const preview = await blocked.request('preview?scope=standard&phase=active')
  assert.ok(!preview.body.text.includes('PLUGIN UNDO GUIDANCE'), '屏蔽后最终系统提示词正文不含该段')
  const row = preview.body.baseSections.find((section) => section.name === 'tool:undo_last_edit')
  assert.equal(row?.blocked, true, '被屏蔽的行仍保留在清单里供反选')
  const session = await blocked.request('session')
  assert.ok(!session.body.sections.some((section) => section.name === 'tool:undo_last_edit'), '真实会话装配也不含它')
  const restored = harness(t)
  assert.ok((await restored.request('preview?scope=standard&phase=active')).body.text.includes('PLUGIN UNDO GUIDANCE'))
})

test('任意段名的 agent 作用域段都能被枚举（不按 tool:* 名字特判）', async (t) => {
  const h = harness(t, {
    agentSections: [
      { name: 'plugin:custom-guidance', order: 900, text: 'CUSTOM' },
      { name: 'another:session-only', order: 2000, text: 'ANOTHER' },
    ],
  })
  const inv = await h.request('inventory?scope=standard')
  for (const name of ['plugin:custom-guidance', 'another:session-only']) {
    const row = inv.body.sections.find((section) => section.name === name)
    assert.ok(row, `${name} 必须可枚举：按契约求解，不是样例特判`)
    assert.deepEqual(row.source, { kind: 'agent' })
    assert.equal(row.scope, 'agent')
  }
  const preview = await h.request('preview?scope=standard&phase=active')
  assert.ok(preview.body.text.includes('CUSTOM') && preview.body.text.includes('ANOTHER'))
})

test('切到别的预设时不混入其它预设会话的会话级段', async (t) => {
  const h = harness(t)
  const inv = await h.request('inventory?scope=other')
  assert.ok(!inv.body.sections.some((section) => section.name === 'tool:undo_last_edit'))
  const preview = await h.request('preview?scope=other&phase=active')
  assert.ok(!preview.body.text.includes('PLUGIN UNDO GUIDANCE'))
})

test('无活动 agent 时退回纯预设装配且不抛错', async (t) => {
  const h = harness(t, { live: false })
  const preview = await h.request('preview?scope=standard&phase=active')
  assert.equal(preview.body.ok, true)
  assert.ok(!preview.body.text.includes('PLUGIN UNDO GUIDANCE'))
  assert.ok(preview.body.text.includes('HOST READ GUIDANCE'))
  const inv = await h.request('inventory?scope=standard')
  assert.ok(!inv.body.sections.some((section) => section.name === 'tool:undo_last_edit'))
})

test('右栏工具目录随 live agent 装配，工具状态与遮蔽池不受影响', async (t) => {
  const withLive = harness(t)
  const withoutLive = harness(t, { live: false })
  const a = await withLive.request('preview?scope=standard&phase=active')
  const b = await withoutLive.request('preview?scope=standard&phase=active')
  // 2.1.2：有 live agent 时右栏来自 agent scope 注册视图（5 个），无 live 时回落预设装配（3 个）。
  assert.equal(a.body.tools.length, 5)
  assert.equal(b.body.tools.length, 3)
  assert.ok(a.body.tools.some((tool) => tool.name === 'undo_last_edit'), 'agent 作用域新增工具必须出现在右栏')
  assert.equal(a.body.registryTotal, 5, '计数与右栏同源，不再出现 38/39 错配')
  assert.equal(b.body.registryTotal, 3)
})

/**
 * 回归：面板两个列表必须「全面覆盖且有序」——
 *  - 提示词段按宿主注册的**规范数值 order** 排序（不是数组序 / 登记表追加序）；
 *  - 工具按宿主**最终目录顺序**（assembled.tools）排序，agent 作用域新增 / 被遮蔽
 *    项追加在后、按名字稳定排序；
 *  - 被别的插件 restrict 的工具带 maskedByPlugin 标记（客户端据此移出启用列表）。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { apply } from '../vendor/prompt-customizer/index.js'

const KEY = { scope: 'preset:standard' }
const AGENT = { id: 'agent-1', session: { header: { id: 'session-1', agentPreset: 'standard', cwd: '/ws', createdAt: 1, delegationDepth: 0 } } }

// 故意用一个「乱序」的注册数组，order 才是唯一权威顺序。
const PRESET_SECTIONS = [
  { name: 'tool:write', order: 1200, text: 'w' },
  { name: 'persona', order: 0, text: 'p' },
  { name: 'mcp:servers', order: 3100, text: 'm' },
  { name: 'tool:read', order: 1100, text: 'r' },
]
// 只在 agent 作用域注册、order 夹在 read(1100) 与 write(1200) 之间。
const AGENT_ONLY_SECTION = { name: 'tool:undo_last_edit', order: 1150, text: 'u' }

const PRESET_TOOLS = [
  { name: 'zeta', description: 'z' },
  { name: 'alpha', description: 'a' },
  { name: 'mid', description: 'm' },
]
// 宿主最终目录顺序（故意不是字母序）。
const TOOL_FINAL = ['mid', 'zeta', 'alpha']

function harness(t, { live = true, restrict = [] } = {}) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-order-'))
  t.after(() => fs.rmSync(dataDir, { recursive: true, force: true }))
  const routes = new Map()
  const sectionsFor = (scope) => scope === AGENT ? [...PRESET_SECTIONS, AGENT_ONLY_SECTION] : PRESET_SECTIONS
  let handler
  const sp = {
    variable: () => () => {},
    layers: { merge: (scope, pick) => pick({ sections: new Map(sectionsFor(scope).map((s) => [s.name, s])), contexts: new Map() }) },
    assemble: async (context) => {
      const assembly = {
        sections: sectionsFor(context.scope).map((s) => ({ name: s.name, text: s.text })),
        contexts: [],
        variables: {},
        tools: TOOL_FINAL.map((name) => ({ name, description: name })),
      }
      return handler(assembly, context, async () => assembly)
    },
  }
  const schemas = (scope) => {
    const base = scope === AGENT ? [...PRESET_TOOLS, { name: 'agent_only', description: 'ao' }] : PRESET_TOOLS
    return scope === AGENT ? base.filter((tool) => !restrict.includes(tool.name)) : base
  }
  const presets = {
    list: async () => [{ id: 'standard' }],
    presetForSession: () => 'standard',
    acquireScope: async () => ({ key: KEY, [Symbol.asyncDispose]: async () => {} }),
  }
  const ctx = {
    systemPrompt: sp,
    tools: { schemas },
    on: (event, fn) => { if (event === 'system-prompt/assemble') handler = fn },
    inject: () => {},
    effect: (fn) => { const d = fn(); return typeof d === 'function' ? d : () => {} },
    get: (name) => ({
      systemPrompt: sp,
      tools: { schemas },
      agentPresets: presets,
      agents: { list: () => (live ? [AGENT] : []) },
      connection: { requestRejection: () => undefined },
      webServer: { register: (route) => { routes.set(route.path, route.handler); return () => {} } },
    })[name],
  }
  apply(ctx, { dataDir })
  async function request(endpoint) {
    const res = { writeHead(code) { this.status = code }, end(text) { this.body = JSON.parse(text) } }
    await routes.get(`/api/prompt-customizer/${endpoint.split('?')[0]}`)({ method: 'GET', url: `/api/prompt-customizer/${endpoint}` }, res)
    return res
  }
  return { request }
}

test('提示词段按宿主规范 order 排序（纯预设，不并入会话 agent 作用域段）', async (t) => {
  const h = harness(t)
  const preview = await h.request('preview?scope=standard&phase=active')
  assert.deepEqual(
    preview.body.baseSections.map((section) => section.name),
    ['persona', 'tool:read', 'tool:write', 'mcp:servers'],
    'baseSections 必须按注册 order (0,1100,1200,3100) 排序，且不含会话专属段',
  )
  const inventory = await h.request('inventory')
  assert.deepEqual(
    inventory.body.sections.map((section) => section.name),
    ['persona', 'tool:read', 'tool:write', 'mcp:servers'],
    '清单 / 池子也必须同样有序',
  )
})

test('工具按宿主最终目录顺序排序，纯预设不含会话 agent 新增项', async (t) => {
  const h = harness(t)
  const preview = await h.request('preview?scope=standard&phase=active')
  assert.deepEqual(
    preview.body.baseTools.map((tool) => tool.name),
    ['mid', 'zeta', 'alpha'],
    'baseTools 跟随 assembled.tools 顺序；agent_only 不属于纯预设预览',
  )
})

test('纯预设预览不读取 live 视图的 restrict 标记', async (t) => {
  const h = harness(t, { restrict: ['alpha'] })
  const preview = await h.request('preview?scope=standard&phase=active')
  const alpha = preview.body.baseTools.find((tool) => tool.name === 'alpha')
  assert.notEqual(alpha?.maskedByPlugin, true, '预设预览不把 live 视图的 restrict 当作预设状态')
  // 未被遮蔽的工具不带该标记。
  assert.notEqual(preview.body.baseTools.find((tool) => tool.name === 'mid')?.maskedByPlugin, true)
})

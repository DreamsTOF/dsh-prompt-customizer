/**
 * 2.1.2 回归：右栏「模型实际可见的工具目录」必须与真实会话同源。
 *
 * 宿主契约（实读）：
 *  - `assembleContextFor(agent)` → `scope: agent`（packages/core/agent/src/dispatch.ts:174-175），
 *    真实请求用 `resolve()` 的 toolSet 装配（agent-loop/src/agent.ts:292-294），
 *    `PromptAssembly.tools` → `GenerateOptions.tools`。
 *  - `ctx.tools.schemas(agent)`（不带 toolSet）= 该 agent 的注册视图全集
 *    = global + preset/祖先 + agent own，shadow/restrictions 已生效，executor 无关。
 *  - PTC executor 的 `describe()` 忽略传入定义、只返回 run_code，
 *    所以不能把 `assemble().tools` 当作目录主源。
 *
 * 反例：把主源换回 `presetScopeKey` 装配（`finalTools` / `schemas(presetScopeKey)`），
 * 用例 ①③④ 必须失败（② 无 live 时本来就回落预设，⑤ 与右栏数据源无关）。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { apply } from '../vendor/prompt-customizer/index.js'

const KEY = { preset: 'standard' }
const AGENT = {
  id: 'agent-1',
  ctx: {},
  session: { header: { id: 'session-1', agentPreset: 'standard', cwd: '/ws', createdAt: 1, delegationDepth: 0 } },
}
const PRESET_TOOLS = [
  { name: 'read', description: 'native read' },
  { name: 'write', description: 'native write' },
  { name: 'edit', description: 'native edit' },
]
const AGENT_TOOLS = [
  { name: 'read', description: 'hashline read' },
  ...PRESET_TOOLS.filter((tool) => tool.name !== 'read'),
  { name: 'apply_patch', description: 'hashline apply_patch' },
  { name: 'undo_last_edit', description: 'undo' },
]

function harness(t, { live = true, ptcCollapse = false } = {}) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-catalog-scope-'))
  t.after(() => fs.rmSync(dataDir, { recursive: true, force: true }))
  const routes = new Map()
  let handler
  const schemas = (scope) => (scope === AGENT ? AGENT_TOOLS : PRESET_TOOLS)
  const definitions = schemas
  const sp = {
    variable: () => () => {},
    layers: { merge: (scope, pick) => pick({ sections: new Map(), contexts: new Map() }) },
    assemble: async (context) => {
      // ptcCollapse 模拟 PTC executor.describe：装配返回的 tools 只剩 run_code。
      const tools = ptcCollapse
        ? [{ name: 'run_code', description: 'ptc' }]
        : (context.scope === AGENT ? AGENT_TOOLS : PRESET_TOOLS)
            .map((tool) => ({ name: tool.name, description: tool.description }))
      const assembly = { sections: [], contexts: [], variables: {}, tools }
      return handler(assembly, context, async () => assembly)
    },
  }
  const tools = { schemas, definitions }
  const presets = {
    list: async () => [{ id: 'standard' }],
    composedPreset: () => 'standard',
    acquireScope: async () => ({ key: KEY, [Symbol.asyncDispose]: async () => {} }),
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

test('① 有 live agent 时右栏 = agent scope 注册视图，不是 presetScopeKey 装配', async (t) => {
  const h = harness(t)
  const preview = await h.request('preview?scope=standard&phase=active')
  assert.equal(preview.status, 200)
  const names = preview.body.tools.map((tool) => tool.name).sort()
  assert.deepEqual(names, ['apply_patch', 'edit', 'read', 'undo_last_edit', 'write'])
  assert.ok(names.includes('apply_patch'), '插件在 agent 作用域注册的 apply_patch 必须出现在右栏')
  assert.ok(names.includes('undo_last_edit'))
  assert.equal(preview.body.registryTotal, 5, '计数必须与右栏同源')
  assert.equal(preview.body.registryTools.length, 5)
})

test('② 无 live agent 时回落纯预设装配（3 个），不抛错', async (t) => {
  const h = harness(t, { live: false })
  const preview = await h.request('preview?scope=standard&phase=active')
  assert.equal(preview.status, 200)
  assert.deepEqual(preview.body.tools.map((tool) => tool.name).sort(), ['edit', 'read', 'write'])
  assert.equal(preview.body.registryTotal, 3)
})

test('③ 右栏与 /session 的可见工具集同源（都来自 agent scope）', async (t) => {
  const h = harness(t)
  const preview = await h.request('preview?scope=standard&phase=active')
  const session = await h.request('session')
  assert.equal(session.status, 200)
  assert.deepEqual(
    preview.body.tools.map((tool) => tool.name).sort(),
    session.body.tools.map((tool) => tool.name).sort(),
  )
})

test('④ PTC 塌缩（assemble().tools 只剩 run_code）时右栏仍用 schemas(agent) 全集', async (t) => {
  const h = harness(t, { ptcCollapse: true })
  const preview = await h.request('preview?scope=standard&phase=active')
  assert.equal(preview.status, 200)
  const names = preview.body.tools.map((tool) => tool.name)
  assert.ok(names.includes('apply_patch'), '不能被 PTC 的 run_code 视图吞掉 agent 作用域工具')
  assert.deepEqual(names.sort(), ['apply_patch', 'edit', 'read', 'undo_last_edit', 'write'])
})

test('⑤ 纯新增的 agent 工具（无继承层同名定义）不伪造同名遮蔽，仍是 locked-agent', async (t) => {
  const h = harness(t)
  const inv = await h.request('inventory?scope=standard')
  const applyPatch = inv.body.tools.filter((tool) => tool.name === 'apply_patch')
  assert.ok(applyPatch.length > 0, 'apply_patch 必须在清单里')
  assert.ok(applyPatch.every((tool) => tool.state !== 'masked-shadow'),
    '继承层没有原生 apply_patch（Web standard applyPatch:false），不得伪造遮蔽行')
  assert.ok(applyPatch.some((tool) => tool.state === 'locked-agent'),
    '按「会话级」如实列出，客户端只读池据此显示')
  // read 有继承层同名定义（同名遮蔽），与 apply_patch 的纯新增区分开。
  const read = inv.body.tools.filter((tool) => tool.name === 'read')
  assert.ok(read.some((tool) => tool.state === 'masked-shadow'), 'read 仍是真同名遮蔽')
})

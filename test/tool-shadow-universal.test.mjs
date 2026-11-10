/**
 * 2.1.1 同名遮蔽探测的组合回归。
 *
 * 反例（会推翻实现的观测）：把 `buildToolUnion` 的判定换回单点
 * `presetDefs.get(name) !== liveDefs.get(name)`，用例 1/2/3 必须失败；
 * 为 `read` 写死特判，用例 5（换名字）必须失败。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { apply } from '../vendor/prompt-customizer/index.js'

const KEY = { preset: 'standard' }
const OTHER_KEY = { preset: 'other' }
const AGENT = {
  id: 'agent-1',
  ctx: {},
  session: { header: { id: 'session-1', agentPreset: 'standard', cwd: '/ws', createdAt: 1, delegationDepth: 0 } },
}
const WRITE = { name: 'write', description: 'native write' }
const UNDO = { name: 'undo_last_edit', description: 'undo' }

/** 同一注册的 schemas 描述相同；插件同名注册的描述不同，作为「不同注册」的兜底证据。 */
function harness(t, {
  shadowName = 'read',
  withDefinitions = true,
  staleAgentDef = false,
  schemasHideNative = false,
  live = true,
} = {}) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-shadow-universal-'))
  t.after(() => fs.rmSync(dataDir, { recursive: true, force: true }))
  const nativeDef = { name: shadowName, description: `native ${shadowName}` }
  const pluginDef = { name: shadowName, description: `plugin ${shadowName}` }
  const globalDefs = [nativeDef, WRITE]
  // staleAgentDef：definitions 层仍指向原生定义（未反映 shadow），只有 schemas
  // 已反映插件注册 —— 旧的单点引用比较会把它们当成同一注册而漏判。
  const agentDefs = staleAgentDef ? [nativeDef, WRITE, UNDO] : [pluginDef, WRITE, UNDO]
  const inboundSchemas = schemasHideNative ? [WRITE] : [nativeDef, WRITE]
  const schemas = (scope) => (scope === AGENT ? [pluginDef, WRITE, UNDO] : inboundSchemas)
  const definitions = withDefinitions
    ? (scope) => (scope === AGENT ? agentDefs : globalDefs)
    : undefined
  const routes = new Map()
  let handler
  const sp = {
    variable: () => () => {},
    layers: { merge: (scope, pick) => pick({ sections: new Map(), contexts: new Map() }) },
    assemble: async (context) => {
      const defs = context.scope === AGENT ? [pluginDef, WRITE, UNDO] : inboundSchemas
      const assembly = {
        sections: [],
        contexts: [],
        variables: {},
        tools: defs.map((def) => ({ name: def.name, description: def.description })),
      }
      return handler(assembly, context, async () => assembly)
    },
  }
  const tools = { schemas, ...(definitions === undefined ? {} : { definitions }) }
  const presets = {
    list: async () => [{ id: 'standard' }, { id: 'other' }],
    composedPreset: () => 'standard',
    acquireScope: async (id) => ({ key: id === 'other' ? OTHER_KEY : KEY, [Symbol.asyncDispose]: async () => {} }),
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

/** 从清单里找出同名遮蔽行，并顺带校验它的形状。 */
function maskedShadowRow(body, name) {
  return body.tools.find((tool) => tool.name === name && tool.state === 'masked-shadow')
}

test('① definitions 缺席：靠 description 差异仍能识别同名遮蔽', async (t) => {
  const h = harness(t, { withDefinitions: false })
  const inv = await h.request('inventory?scope=standard')
  assert.equal(inv.status, 200)
  const row = maskedShadowRow(inv.body, 'read')
  assert.ok(row, 'definitions 缺席时同名遮蔽也必须进池')
  assert.equal(row.description, 'native read')
  assert.equal(row.maskedByShadow, true)
  // definitions 缺席时 sourceForTool 的既有 fallback 会把继承层标成 preset；
  // 关键是绝不能标成 agent（被顶掉的是继承层的原生工具）。
  assert.ok(['global', 'preset'].includes(row.source?.kind), '来源标继承层（global / preset），不是 agent')
  assert.equal(row.shadowedBy?.source?.kind, 'agent')
  assert.equal(row.keySuffix, 'shadowed')
})

test('② agent 的 definitions 仍是原生定义（未反映 shadow）：靠 description 差异进池', async (t) => {
  const h = harness(t, { staleAgentDef: true })
  const row = maskedShadowRow((await h.request('inventory?scope=standard')).body, 'read')
  assert.ok(row, 'definitions 引用相同但 schemas 描述不同时也必须识别遮蔽')
  assert.equal(row.maskedByShadow, true)
})

test('③ schemas 未挂载原生但 definitions 里有：仍进池（inPreset=false）', async (t) => {
  const h = harness(t, { schemasHideNative: true })
  const inv = await h.request('inventory?scope=standard')
  const row = maskedShadowRow(inv.body, 'read')
  assert.ok(row, '继承层 definitions 有同名定义时，即使 presetTools 没有也要进池')
  assert.equal(row.description, 'native read')
  const pluginRow = inv.body.tools.find((tool) => tool.name === 'read' && tool.state === 'locked-agent')
  assert.ok(pluginRow, '插件那一份仍应在启用列表')
})

test('④ 0.2.1 restrict 场景：agent 视图仍含插件工具，也能识别', async (t) => {
  const h = harness(t)
  const inv = await h.request('inventory?scope=standard')
  const row = maskedShadowRow(inv.body, 'read')
  assert.ok(row, 'restrict 只作用于继承层，同名遮蔽判定不得依赖 inLive=false')
  assert.equal(row.maskedByShadow, true)
  assert.equal(row.source?.kind, 'global')
})

test('⑤ 任意工具名都进池（不是为 read 写死特判）', async (t) => {
  for (const name of ['apply_patch', 'edit', 'plugin:custom']) {
    const h = harness(t, { shadowName: name })
    const inv = await h.request('inventory?scope=standard')
    const row = maskedShadowRow(inv.body, name)
    assert.ok(row, `${name} 的同名遮蔽必须进池`)
    assert.equal(row.description, `native ${name}`)
    assert.equal(row.source?.kind, 'global')
  }
})

test('⑥ 边界：不误判 agent 新增、跨预设不串台、无活动 agent 不抛错、工具目录状态不变', async (t) => {
  const main = harness(t)
  const inv = await main.request('inventory?scope=standard')
  // 纯 agent 新增（无继承层同名定义）不得误判成遮蔽。
  assert.equal(maskedShadowRow(inv.body, 'undo_last_edit'), undefined)
  const undo = inv.body.tools.find((tool) => tool.name === 'undo_last_edit')
  assert.equal(undo?.state, 'locked-agent')
  // 同一注册不得拆两行。
  assert.equal(maskedShadowRow(inv.body, 'write'), undefined)
  assert.equal(inv.body.tools.filter((tool) => tool.name === 'write').length, 1)
  // 切到别的预设没有同预设活动 agent，不串台。
  const other = await main.request('inventory?scope=other')
  assert.equal(maskedShadowRow(other.body, 'read'), undefined)
  // 无活动 agent：退回纯预设，不抛错。
  const noLive = harness(t, { live: false })
  const quiet = await noLive.request('inventory?scope=standard')
  assert.equal(quiet.status, 200)
  assert.equal(maskedShadowRow(quiet.body, 'read'), undefined)
  // 工具目录（可开关项 / 状态）不受遮蔽探测影响。
  assert.equal(inv.body.tools.find((tool) => tool.name === 'write')?.state, 'controllable')
  assert.equal(quiet.body.tools.find((tool) => tool.name === 'write')?.state, 'controllable')
})

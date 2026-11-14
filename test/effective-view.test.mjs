/**
 * ADR-0006 生效视图回归：**面板 = 请求真值**。
 *
 * 场景来源：dsh-ops 开启「隐藏宿主 PowerShell」后，它用 agent 作用域的
 * `tools.restrict({deny:['pwsh']})` 把宿主 pwsh 收窄掉，真实请求里没有 pwsh；
 * 旧实现（工具目录按预设 scope 独立装配）仍把 pwsh 当可控项显示。
 *
 * 反例（会推翻实现）：把 buildPreview 的主数据源换回「预设 scope 独立装配」
 * （buildToolUnion 的 liveAgent 传 undefined）时，用例 ① 必须失败。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { apply } from '../vendor/prompt-customizer/index.js'
import { openDb, setDoc } from '../vendor/prompt-customizer/db.js'

const KEY = { scope: 'preset:standard' }
const AGENT = {
  id: 'agent-1',
  session: { header: { id: 'session-1', agentPreset: 'standard', cwd: '/ws', createdAt: 1, delegationDepth: 0 } },
}

// 全局层注册表（继承层）。同一批对象引用在各 scope 的 definitions 里复用 ——
// 宿主 `tools.definitions()` 返回的也是注册表里的同一批定义对象。
const GLOBAL_TOOLS = [
  { name: 'pwsh', description: 'host powershell' },
  { name: 'bash', description: 'host bash' },
  { name: 'read', description: 'host read' },
]

function harness(t, { live = true, restrict = ['pwsh'], ptc = false, config, agentTools = [], presetTools = [] } = {}) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-effective-'))
  t.after(() => fs.rmSync(dataDir, { recursive: true, force: true }))
  if (config !== undefined) setDoc(openDb(path.join(dataDir, 'prompt-customizer.db')), 'config', config)
  const routes = new Map()
  const ptcSections = ptc ? [{ name: 'tools:ptc-only', order: 0, text: 'PTC MODE' }] : []
  const sectionsFor = (scope) => (scope === AGENT ? ptcSections : [])
  let handler
  const sp = {
    variable: () => () => {},
    layers: { merge: (scope, pick) => pick({ sections: new Map(sectionsFor(scope).map((s) => [s.name, s])), contexts: new Map() }) },
    assemble: async (context) => {
      const assembly = {
        sections: sectionsFor(context.scope).map((s) => ({ name: s.name, text: s.text })),
        contexts: [],
        variables: {},
        tools: ptc ? [{ name: 'run_code', description: 'ptc transport' }] : [],
      }
      return handler(assembly, context, async () => assembly)
    },
  }
  // 可见集（schemas）：agent 作用域的 restrict 只作用于继承层工具，agent 自己
  // 注册的工具不受影响 —— 与宿主 ToolRestriction 语义一致。
  const schemas = (scope) => {
    if (scope === AGENT) {
      return [...GLOBAL_TOOLS.filter((tool) => !restrict.includes(tool.name)), ...agentTools]
    }
    return scope === KEY ? [...GLOBAL_TOOLS, ...presetTools] : [...GLOBAL_TOOLS]
  }
  // 注册表（definitions）：restrict 不删注册，收窄只影响可见集。
  const definitions = (scope) => (scope === AGENT ? [...GLOBAL_TOOLS, ...presetTools, ...agentTools] : scope === KEY ? [...GLOBAL_TOOLS, ...presetTools] : [...GLOBAL_TOOLS])
  const presets = {
    list: async () => [{ id: 'standard', name: 'Standard' }],
    presetForSession: () => 'standard',
    composedPreset: () => 'standard',
    resolve: async () => ({ id: 'standard' }),
    acquireScope: async () => ({ key: KEY, [Symbol.asyncDispose]: async () => {} }),
  }
  const ctx = {
    systemPrompt: sp,
    tools: { schemas, definitions },
    on: (event, fn) => { if (event === 'system-prompt/assemble') handler = fn },
    inject: () => {},
    effect: (fn) => { const dispose = fn(); return typeof dispose === 'function' ? dispose : () => {} },
    get: (name) => ({
      systemPrompt: sp,
      tools: { schemas, definitions },
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
    return res
  }
  return { request }
}

const previewOf = async (h) => (await h.request('preview?scope=standard&phase=active')).body
const rowOf = (body, name, state) => body.baseTools.find((tool) => tool.name === name && (state === undefined || tool.state === state))

test('① 外部插件在 agent 作用域 restrict 掉 pwsh：主列表不再声称可见，进只读池', async (t) => {
  const body = await previewOf(harness(t))
  assert.equal(body.truth?.linked, true, '有同预设活动会话：真值取自 agent 视图')
  assert.equal(body.truth?.source, 'agent')
  const pwsh = rowOf(body, 'pwsh')
  assert.equal(pwsh?.state, 'masked-plugin', 'agent 视图没有 pwsh ⇒ 外部不可见，不是可控项')
  assert.equal(pwsh?.maskedByPlugin, true)
  assert.equal(pwsh?.hidden, false, '不可反选项不占用「本插件遮蔽」语义')
})

test('② 未开启隐藏时同一工具是可控项（反例：机制必须依赖 agent 视图）', async (t) => {
  const body = await previewOf(harness(t, { restrict: [] }))
  const pwsh = rowOf(body, 'pwsh')
  assert.equal(pwsh?.state, 'controllable')
  assert.notEqual(pwsh?.maskedByPlugin, true)
})

test('③ 无活动会话：truth.linked=false，且不谎称外部不可见', async (t) => {
  const body = await previewOf(harness(t, { live: false }))
  assert.equal(body.truth?.linked, false)
  assert.equal(body.truth?.source, 'preset')
  assert.equal(rowOf(body, 'pwsh')?.state, 'controllable', '无 agent 视图时只能降级为预设视图，不判「外部不可见」')
})

test('④ 本插件自己的阶段 exclude 仍留在主列表可反选（2.0.15 回归）', async (t) => {
  // 运行期本插件用 agent 作用域 restrict 隐藏它 → 真实视图里没有它；此时必须
  // 仍认作「本插件遮蔽」（可反选），不能当成外部不可见。
  const body = await previewOf(harness(t, {
    restrict: ['bash'],
    config: { overrides: { standard: { tools: { exclude: [{ name: 'bash' }] } } } },
  }))
  const bash = rowOf(body, 'bash')
  assert.equal(bash?.state, 'controllable', '本插件遮蔽是可控项，不能标成 masked-plugin')
  assert.equal(bash?.hidden, true)
  assert.equal(bash?.ownHidden, true)
})

test('⑤ 同名多来源：生效行进主列表，落选的层身份进只读池', async (t) => {
  const body = await previewOf(harness(t, {
    restrict: [],
    agentTools: [{ name: 'pwsh', description: 'ops pwsh' }],
  }))
  const winner = rowOf(body, 'pwsh', 'locked-agent')
  assert.ok(winner, 'agent 作用域同名注册生效 → 主列表（可勾选/会话级）')
  assert.equal(winner.layer, 'agent')
  const shadow = rowOf(body, 'pwsh', 'masked-shadow')
  assert.ok(shadow, '被顶掉的继承层那一份必须进只读池')
  assert.equal(shadow.layer, 'global')
  assert.equal(shadow.description, 'host powershell')
})

test('⑥ PTC 折叠只作用于工具域：run_code 锁定，其余工具仍可控勾选，提示词段照旧', async (t) => {
  const body = await previewOf(harness(t, { ptc: true }))
  assert.equal(body.truth?.ptcCollapsed, true)
  assert.equal(rowOf(body, 'run_code')?.state, 'locked-executor', 'PTC 传输锁定常驻')
  // 关键回归：被折叠进 SDK 的工具不再降级为不可反选的 masked-ptc，而是保持可控。
  assert.equal(rowOf(body, 'bash')?.state, 'controllable', 'PTC 下的工具仍可控（restrict 会真实收敛 SDK）')
  assert.equal(rowOf(body, 'bash')?.ptcBinding, true, '标记为 PTC SDK 绑定供 UI 说明')
  assert.equal(rowOf(body, 'bash', 'masked-ptc'), undefined, '不再落入不可反选池')
  assert.ok(body.sections.some((section) => section.name === 'tools:ptc-only'), '提示词段不因工具折叠而消失')
})

test('⑦ 运行时版本号路由存在且单调不减（自动刷新数据源）', async (t) => {
  const h = harness(t)
  const first = (await h.request('revision')).body
  assert.equal(first.ok, true)
  assert.equal(typeof first.revision, 'number')
  const second = (await h.request('revision')).body
  assert.ok(second.revision >= first.revision)
})

test('⑧ 无活动会话：同名覆盖只列落选者，生效项不得标成「外部不可见」', async (t) => {
  // 预设层插件注册了同名 read（顶掉全局原生 read）；没有活动会话时只能确定
  // 「谁被同名覆盖」，不能断定外部收窄 —— ���效项必须仍是可选项。
  const body = await previewOf(harness(t, {
    live: false,
    presetTools: [{ name: 'read', description: 'preset read' }],
  }))
  const readRows = body.baseTools.filter((tool) => tool.name === 'read')
  assert.equal(readRows.filter((tool) => tool.state === 'masked-plugin').length, 0,
    '无 agent 视图时不得判「外部不可见」')
  assert.equal(readRows.filter((tool) => tool.state === 'controllable').length, 1)
  assert.equal(readRows.filter((tool) => tool.state === 'masked-shadow').length, 1)
})

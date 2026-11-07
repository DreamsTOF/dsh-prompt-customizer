/**
 * 同名遮蔽 + 装配后工具过滤：
 *  - 别的插件在 agent 作用域注册同名 read（遮蔽原生 read）时，列表要拆成两行：
 *    插件提供的 read（锁定/可见、可关） + 原生 read（遮蔽池、无法反开）。
 *  - 真实会话装配时，按阶段 exclude 过滤 `assemble().tools`，于是 agent 作用域工具
 *    也能被真正隐藏（restrict 管不到它们）。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { apply } from '../vendor/prompt-customizer/index.js'
import { openDb, setDoc } from '../vendor/prompt-customizer/db.js'

const KEY = { scope: 'preset:standard' }
const AGENT = { id: 'agent-1', session: { header: { id: 'session-1', agentPreset: 'standard', cwd: '/ws', createdAt: 1, delegationDepth: 0 } } }

// 定义对象（引用）：read 在 agent 作用域被插件同名顶掉 → 与预设里的原生 read 不同对象。
const DEF_READ_NATIVE = { name: 'read', description: 'native read' }
const DEF_WRITE = { name: 'write', description: 'native write' }
const DEF_GLOB = { name: 'glob', description: 'native glob' }
const DEF_READ_PLUGIN = { name: 'read', description: 'hashline read' }
const DEF_UNDO = { name: 'undo_last_edit', description: 'undo' }

const presetDefs = () => [DEF_READ_NATIVE, DEF_WRITE, DEF_GLOB]
const agentDefs = () => [DEF_READ_PLUGIN, DEF_WRITE, DEF_GLOB, DEF_UNDO]

function harness(t, { exclude = [], live = true } = {}) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-shadow-'))
  t.after(() => fs.rmSync(dataDir, { recursive: true, force: true }))
  if (exclude.length > 0) {
    setDoc(openDb(path.join(dataDir, 'prompt-customizer.db')), 'config', { overrides: { standard: { tools: { exclude } } } })
  }
  const routes = new Map()
  const defsFor = (scope) => (scope === AGENT ? agentDefs() : presetDefs())
  let handler
  const sp = {
    variable: () => () => {},
    layers: { merge: (scope, pick) => pick({ sections: new Map(), contexts: new Map() }) },
    assemble: async (context) => {
      const defs = defsFor(context.scope)
      const assembly = {
        sections: [],
        contexts: [],
        variables: {},
        tools: defs.map((d) => ({ name: d.name, description: d.description })),
      }
      return handler(assembly, context, async () => assembly)
    },
  }
  const tools = { schemas: (scope) => defsFor(scope), definitions: (scope) => defsFor(scope) }
  const presets = {
    list: async () => [{ id: 'standard' }],
    presetForSession: () => 'standard',
    acquireScope: async () => ({ key: KEY, [Symbol.asyncDispose]: async () => {} }),
  }
  const ctx = {
    systemPrompt: sp,
    tools,
    on: (event, fn) => { if (event === 'system-prompt/assemble') handler = fn },
    inject: () => {},
    effect: (fn) => { const d = fn(); return typeof d === 'function' ? d : () => {} },
    get: (name) => ({
      systemPrompt: sp,
      tools,
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
  return { request, ctx }
}

test('同名遮蔽：插件 read 与原生 read 拆成两行（插件=锁定可见，原生=遮蔽池）', async (t) => {
  const h = harness(t)
  const preview = await h.request('preview?scope=standard&phase=active')
  const reads = preview.body.baseTools.filter((tool) => tool.name === 'read')
  assert.equal(reads.length, 2, '同名 read 应出现两条')
  const plugin = reads.find((tool) => tool.state === 'locked-agent')
  const native = reads.find((tool) => tool.state === 'masked-plugin')
  assert.ok(plugin, '插件提供的 read 应在启用列表（locked-agent）')
  assert.equal(plugin.description, 'hashline read')
  assert.ok(native, '原生 read 应进遮蔽池（masked-plugin）')
  assert.equal(native.description, 'native read')
  assert.equal(native.maskedByPlugin, true)
  // 未遮蔽的普通工具仍是单条可开关。
  assert.equal(preview.body.baseTools.filter((tool) => tool.name === 'write').length, 1)
  assert.equal(preview.body.baseTools.find((tool) => tool.name === 'write')?.state, 'controllable')
})

test('装配后工具过滤：阶段 exclude 能真正隐藏 agent 作用域工具（restrict 管不到）', async (t) => {
  const h = harness(t, { exclude: ['read'] })
  const real = await h.ctx.systemPrompt.assemble({ scope: AGENT, agent: AGENT })
  const names = real.tools.map((tool) => tool.name)
  assert.ok(!names.includes('read'), `read 应被过滤掉，实际：${names.join(',')}`)
  assert.ok(names.includes('write'))
  // base（诊断 / 预览）调用不过滤，保留完整基座。
  const base = await h.ctx.systemPrompt.assemble({ scope: AGENT, agent: AGENT, promptCustomizerBase: true })
  assert.ok(base.tools.some((tool) => tool.name === 'read'), 'base 调用不应被过滤')
})

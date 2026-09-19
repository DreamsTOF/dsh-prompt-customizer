/**
 * 运行时段 / 工具进入「本系统全部提示词」池的两条路径：
 *
 *  - **清单就列**（主路径）：有一批段只在 agent 自己的 scope 里注册（插件按
 *    agent 动态 section()，例如 subagent 工具的 `tool:subagent`、file-reference
 *    的 `context:file-reference`）。它们不进全局层、也不进任何预设 scope，预设
 *    的清单与预览都看不见；但它们不是某个模式独有的段 —— 所以清单在最开始
 *    （面板一打开、没跑过任何会话）就要按 agent 作用域 merge 出它们。
 *  - **运行时兜底**：没有活着的 agent 可查时（裸组装 / agent 还没建），真实
 *    装配那次也把看到的段并进登记表，等下一次请求就能列出来。
 *
 * 两条路径都只累积「名字 + 内容」；屏蔽 / 替换永远在响应时按生效配置现算。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { apply } from '../vendor/prompt-customizer/index.js'

/** agent 对象本身就是它那一层的 scope key（core/scope 的 createScope(ctx, agent) 契约）。 */
const AGENT = { id: 'agent-1' }

/** 预设 scope 也能看见的段（清单 / 预览的常规来源）。 */
const SCOPE_SECTIONS = [
  { name: 'persona', order: 10, text: 'EN persona' },
  { name: 'core', order: 20, text: 'CORE body' },
]

/** 只在 agent 作用域注册的段：预设 scope 的注册表里没有它。 */
const RUNTIME_ONLY = {
  name: 'tool:subagent',
  order: 30,
  text: 'Use subagent in the background by default. Start independent delegations together in one assistant message.',
}

/** 最小 Cordis ctx：作用域相关的注册表 + assemble 瀑布流 mock。 */
function makeCtx({ liveAgent = true } = {}) {
  const routes = {}
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-runtime-catalog-'))
  let assembleHandler
  const sectionsFor = (scope) => (scope === AGENT ? [...SCOPE_SECTIONS, RUNTIME_ONLY] : SCOPE_SECTIONS)
  const sp = {
    layers: { merge: (scope) => new Map(sectionsFor(scope).map((sec) => [sec.name, { ...sec }])) },
    variable: () => () => {},
  }
  sp.assemble = async (context) => {
    const assembly = {
      sections: sectionsFor(context?.scope).map((sec) => ({ name: sec.name, text: sec.text })),
      contexts: [],
      tools: [],
      variables: {},
    }
    return assembleHandler !== undefined
      ? assembleHandler(assembly, context, () => Promise.resolve(assembly))
      : assembly
  }
  const ctx = {
    on: (event, handler) => {
      if (event === 'system-prompt/assemble') assembleHandler = handler
    },
    inject: () => {},
    get: (name) => {
      if (name === 'webServer') return { register: (r) => { routes[r.path] = r.handler; return () => {} } }
      if (name === 'systemPrompt') return sp
      if (name === 'agents') return { list: () => (liveAgent ? [AGENT] : []) }
      // 信任闸：connection 视为已认证放行（拒绝路径见 trust-gate.test.mjs）。
      if (name === 'connection') return { requestRejection: () => undefined }
      return undefined
    },
    systemPrompt: sp,
    tools: { schemas: () => [] },
    effect: () => {},
  }
  return { ctx, routes, dataDir }
}

/** 事件式 req 的最小 mock（GET 无 body）。 */
function makeGet(url) {
  const req = { method: 'GET', url, on(ev, cb) { if (ev === 'end') cb() } }
  const res = { statusCode: 0, body: '', writeHead(code) { this.statusCode = code }, end(p) { this.body = p ?? '' } }
  return { req, res }
}

/** 拉一次清单，返回解析后的载荷。 */
async function inventoryOf(routes) {
  const handler = routes['/api/prompt-customizer/inventory']
  assert.ok(handler, 'inventory 路由已注册')
  const { req, res } = makeGet('/api/prompt-customizer/inventory')
  await handler(req, res)
  assert.equal(res.statusCode, 200)
  return JSON.parse(res.body)
}

test('面板一打开就列出 agent 作用域段（没跑过任何会话）', async () => {
  const { ctx, routes, dataDir } = makeCtx()
  apply(ctx, { dataDir })

  const body = await inventoryOf(routes)
  const names = body.sections.map((sec) => sec.name)
  assert.ok(names.includes(RUNTIME_ONLY.name), `清单应含 agent 作用域段，实际：${names.join(', ')}`)
  assert.equal(body.sections.find((sec) => sec.name === RUNTIME_ONLY.name).text, RUNTIME_ONLY.text)
  assert.ok(names.includes('persona') && names.includes('core'), '作用域内的常规段照旧在')
})

test('没有活着的 agent 时回落运行时累积：跑过一次真实装配就列出来', async () => {
  const { ctx, routes, dataDir } = makeCtx({ liveAgent: false })
  apply(ctx, { dataDir })
  assert.ok(!(await inventoryOf(routes)).sections.some((sec) => sec.name === RUNTIME_ONLY.name), '没有 agent 时清单列不出它')

  // 一次真实会话装配：作用域是 agent，装配里带着只在该作用域注册的 tool:subagent。
  await ctx.systemPrompt.assemble({ scope: AGENT, promptCustomizerPhase: 'active' })

  const names = (await inventoryOf(routes)).sections.map((sec) => sec.name)
  assert.ok(names.includes(RUNTIME_ONLY.name), `跑过一轮后应列出，实际：${names.join(', ')}`)
})

test('预览只并它自己看见的：预设 scope 里没有的段不会凭空出现', async () => {
  const { ctx, routes, dataDir } = makeCtx({ liveAgent: false })
  apply(ctx, { dataDir })
  // 只跑预览（promptCustomizerBase 那次由 buildPreview 自己并），作用域是预设。
  await ctx.systemPrompt.assemble({ scope: 'preset:standard', promptCustomizerBase: true, promptCustomizerPhase: 'active' })

  const body = await inventoryOf(routes)
  assert.deepEqual(body.sections.map((sec) => sec.name).sort(), ['core', 'persona'])
})

test('预览把 agent 作用域段并进列表（带 scope 标记），不再「列表里没有、对话里却有」', async () => {
  const { ctx } = makeCtx()
  apply(ctx, { dataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'pc-preview-agent-')) })
  // 预览装配：作用域是预设，注册表里没有 tool:subagent；但活着的 agent 有它。
  const preview = await ctx.systemPrompt.assemble({
    scope: 'preset:standard',
    promptCustomizerBase: true,
    promptCustomizerPhase: 'active',
  })

  const base = preview.promptCustomizerBaseView?.sections ?? []
  const row = base.find((section) => section.name === RUNTIME_ONLY.name)
  assert.ok(row, `预览的 baseSections 应含 agent 作用域段，实际：${base.map((s) => s.name).join(', ')}`)
  assert.equal(row.scope, 'agent', 'agent 作用域段要带 scope 标记，UI 据此标「会话级」')
  assert.equal(row.blocked, false, '默认没被屏蔽（真实会话里它默认就在提示词里）')
  // post 视图（模型所见）也要有它 —— 否则预览文本与实际提示词对不上。
  assert.ok(
    preview.sections.some((section) => section.name === RUNTIME_ONLY.name),
    '最终装配视图应含 agent 作用域段',
  )
})

test('两条路径并存时同名只出现一次（并集去重）', async () => {
  const { ctx, routes, dataDir } = makeCtx()
  apply(ctx, { dataDir })
  await ctx.systemPrompt.assemble({ scope: AGENT, promptCustomizerPhase: 'active' })
  await ctx.systemPrompt.assemble({ scope: 'preset:standard', promptCustomizerBase: true, promptCustomizerPhase: 'active' })

  const names = (await inventoryOf(routes)).sections.map((sec) => sec.name)
  assert.equal(names.filter((name) => name === RUNTIME_ONLY.name).length, 1, '池子里同名段只该有一条')
  assert.ok(names.includes('core') && names.includes('persona'))
})

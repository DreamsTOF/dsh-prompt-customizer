/**
 * 实时预览（草稿叠加）的行为测试：
 *  - 装配瀑布流过滤器认得 promptCustomizerPatch：补丁只在内存里叠加到目标层
 *   （全局顶层 / overrides[id]），屏蔽 / 注入等按叠加后的配置生效；
 *  - /preview POST 形态把 body 里的 target/patch 挂进装配上下文（磁盘不动），
 *    GET 形态不携带补丁；
 *  - 非法补丁形态（非对象）不炸路由，回落磁盘配置。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { apply } from '../lib/index.js'

/** 注册表里的两段原始段（forceSections 包装从这份重建 sections）。 */
const REGISTRY = [
  { name: 'persona', order: 10, text: 'EN persona' },
  { name: 'core', order: 20, text: 'CORE body' },
]

/** 最小 Cordis ctx：webServer 路由表 + systemPrompt mock（assemble 走捕获的
 *  瀑布流过滤器，layers.merge 返回注册表原始段）。 */
function makeCtx() {
  const routes = {}
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-livepreview-'))
  let assembleHandler
  const sp = {
    // merge(scope, pick) 返回「名字 → 段定义」的 Map（宿主语义）；测试固定
    // 返回注册表原始段，与 pick 无关。
    layers: { merge: () => new Map(REGISTRY.map((sec) => [sec.name, { ...sec }])) },
    variable: () => () => {},
  }
  sp.assemble = async (context) => {
    const assembly = {
      sections: REGISTRY.map((sec) => ({ name: sec.name, text: sec.text })),
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
    get: (name) => (name === 'webServer'
      ? { register: (r) => { routes[r.path] = r.handler; return () => {} } }
      : name === 'systemPrompt' ? sp : undefined),
    systemPrompt: sp,
    tools: { schemas: () => [] },
    effect: () => {},
  }
  return { ctx, routes, dataDir, sp }
}

/** 事件式 req 的最小 mock；body 为 JSON（POST）或省略（GET）。 */
function makeReq(url, body) {
  const chunks = body === undefined ? [] : [Buffer.from(JSON.stringify(body))]
  const req = {
    method: body === undefined ? 'GET' : 'POST',
    url,
    on(ev, cb) {
      if (ev === 'data') for (const c of chunks) cb(c)
      if (ev === 'end') cb()
    },
  }
  const res = {
    statusCode: 0,
    body: '',
    writeHead(code) { this.statusCode = code },
    end(payload) { this.body = payload ?? '' },
  }
  return { req, res }
}

test('waterfall filter applies in-memory draft patch (block via overlay)', async () => {
  const { ctx, dataDir } = makeCtx()
  apply(ctx, { dataDir })
  // 拿到包装后的 assemble（forceSections 开启时插件在方法边界重建 sections）。
  const handler = ctx.systemPrompt.assemble
  // 草稿补丁屏蔽 persona：叠加只发生在内存，磁盘配置从未写入。
  const result = await handler({
    scope: undefined,
    promptCustomizerPhase: 'active',
    promptCustomizerPatch: { sections: ['persona'] },
  })
  const names = result.sections.map((sec) => sec.name)
  assert.ok(!names.includes('persona'), '草稿屏蔽的段不进最终装配')
  assert.ok(names.includes('core'), '未触碰的段保留')
})

test('waterfall filter without patch keeps registry sections untouched', async () => {
  const { ctx, dataDir } = makeCtx()
  apply(ctx, { dataDir })
  const result = await ctx.systemPrompt.assemble({ promptCustomizerPhase: 'active' })
  const names = result.sections.map((sec) => sec.name)
  assert.deepEqual(names.sort(), ['core', 'persona'])
})

test('/preview POST carries draft patch into the assemble context', async () => {
  const { ctx, routes, dataDir } = makeCtx()
  apply(ctx, { dataDir })
  const handler = routes['/api/prompt-customizer/preview']
  assert.ok(handler, 'preview 路由已注册')
  let seenPatch
  const pristine = ctx.systemPrompt.assemble
  ctx.systemPrompt.assemble = async (context) => {
    seenPatch = context?.promptCustomizerPatch
    return pristine(context)
  }
  const { req, res } = makeReq('/api/prompt-customizer/preview', {
    phase: 'active',
    patch: { sections: ['persona'] },
  })
  await handler(req, res)
  assert.equal(res.statusCode, 200)
  const body = JSON.parse(res.body)
  assert.equal(body.ok, true)
  assert.deepEqual(seenPatch, { sections: ['persona'] })
  assert.equal(body.text.includes('CORE body'), true)
  assert.equal(body.text.includes('EN persona'), false, '草稿屏蔽的段不进预览文本')
})

test('/preview GET sends no patch (disk config semantics)', async () => {
  const { ctx, routes, dataDir } = makeCtx()
  apply(ctx, { dataDir })
  const handler = routes['/api/prompt-customizer/preview']
  let seenPatch = 'unset'
  const pristine = ctx.systemPrompt.assemble
  ctx.systemPrompt.assemble = async (context) => {
    seenPatch = context?.promptCustomizerPatch
    return pristine(context)
  }
  const { req, res } = makeReq('/api/prompt-customizer/preview?phase=active')
  await handler(req, res)
  assert.equal(res.statusCode, 200)
  const body = JSON.parse(res.body)
  assert.equal(body.ok, true)
  assert.equal(seenPatch, undefined, 'GET 预览不携带草稿补丁')
  assert.equal(body.text.includes('EN persona'), true)
})

test('/preview POST with malformed body falls back to disk config', async () => {
  const { ctx, routes, dataDir } = makeCtx()
  apply(ctx, { dataDir })
  const handler = routes['/api/prompt-customizer/preview']
  // 坏 JSON body：readJsonBody 拒绝 → body=null → 回落 GET 语义。
  const req = {
    method: 'POST',
    url: '/api/prompt-customizer/preview?phase=active',
    on(ev, cb) {
      if (ev === 'data') cb(Buffer.from('{not json'))
      if (ev === 'end') cb()
    },
  }
  const res = { statusCode: 0, body: '', writeHead(code) { this.statusCode = code }, end(p) { this.body = p ?? '' } }
  await handler(req, res)
  assert.equal(res.statusCode, 200)
  assert.equal(JSON.parse(res.body).ok, true)
})

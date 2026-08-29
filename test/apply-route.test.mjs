/**
 * /api/prompt-customizer/config/apply 批量保存路由的行为测试：
 * 全局补丁写顶层、预设补丁写 overrides[id]、全空补丁连带删除空 override、
 * 白名单外字段被忽略、非法 body 拒绝。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { apply } from '../lib/index.js'

/** Minimal Cordis ctx：只提供 webServer mock，其余服务缺席（可选获取）。 */
function makeCtx() {
  const routes = {}
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-apply-'))
  const ctx = {
    on: () => {},
    get: (name) => name === 'webServer'
      ? { register: (r) => { routes[r.path] = r.handler; return () => {} } }
      : undefined,
    effect: () => {},
  }
  return { ctx, routes, dataDir }
}

/** 事件式 req/res 的最小 mock；返回 { status, body }。 */
async function call(handler, body) {
  const chunks = body === undefined ? [] : [Buffer.from(JSON.stringify(body))]
  const req = {
    query: {},
    on(ev, cb) {
      if (ev === 'data') chunks.forEach(cb)
      if (ev === 'end') cb()
    },
  }
  return new Promise((resolve) => {
    const res = {
      status: 0,
      body: null,
      writeHead(code) { this.status = code },
      end(text) { this.body = JSON.parse(text); resolve(res) },
    }
    void handler(req, res)
  })
}

const APPLY = '/api/prompt-customizer/config/apply'

test('global patch writes top-level fields', async () => {
  const { ctx, routes, dataDir } = makeCtx()
  apply(ctx, { dataDir })
  const res = await call(routes[APPLY], {
    patch: { sections: ['a'], tools: { exclude: ['t'] } },
  })
  assert.equal(res.status, 200)
  assert.equal(res.body.ok, true)
  assert.deepEqual(res.body.config.sections, ['a'])
  assert.deepEqual(res.body.config.tools.exclude, ['t'])
})

test('targeted patch writes overrides[id] only', async () => {
  const { ctx, routes, dataDir } = makeCtx()
  apply(ctx, { dataDir })
  const res = await call(routes[APPLY], {
    target: 'whoami',
    patch: { sections: ['b'], replace: null },
  })
  assert.equal(res.body.ok, true)
  // 返回的是 schema 解析后的 config（override 子字段被补默认值），
  // 关键是 sections 接管且被置 null 的 replace 没有残留用户值。
  assert.deepEqual(res.body.config.overrides.whoami.sections, ['b'])
  assert.deepEqual(res.body.config.overrides.whoami.replace, {})
  // 全局顶层不受影响（sections 是 schema 默认空列表，而非补丁写入的值）。
  assert.deepEqual(res.body.config.sections, [])
})

test('fully-emptied override is removed instead of leaving an empty shell', async () => {
  const { ctx, routes, dataDir } = makeCtx()
  fs.writeFileSync(path.join(dataDir, 'config.yaml'), 'overrides:\n  whoami:\n    sections: [a]\n')
  apply(ctx, { dataDir })
  const res = await call(routes[APPLY], {
    target: 'whoami',
    patch: { sections: null, replace: null, inject: null, tools: null },
  })
  assert.equal(res.body.ok, true)
  assert.deepEqual(res.body.config.overrides, {})
})

test('fields outside the whitelist are ignored', async () => {
  const { ctx, routes, dataDir } = makeCtx()
  apply(ctx, { dataDir })
  const res = await call(routes[APPLY], {
    patch: { presets: [{ id: 'x', name: 'x', data: {} }], activePreset: 'x' },
  })
  assert.equal(res.body.ok, true)
  // presets 被 schema 补默认空列表，重要的是补丁值没有写进去。
  assert.deepEqual(res.body.config.presets, [])
  assert.equal(res.body.config.activePreset, undefined)
})

test('missing or non-object patch is rejected with 400', async () => {
  const { ctx, routes, dataDir } = makeCtx()
  apply(ctx, { dataDir })
  const missing = await call(routes[APPLY], { target: undefined })
  assert.equal(missing.status, 400)
  const bad = await call(routes[APPLY], { patch: ['not-an-object'] })
  assert.equal(bad.status, 400)
})

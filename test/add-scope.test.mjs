/**
 * 添加**技能**的「全局 vs 当前工作区」落点测试。
 *
 * 覆盖：默认写全局（`~/.agents/skills`）；scope=workspace 写进该工作区的
 * `.agents/skills` 且**目录不存在时自动创建**；缺 workspace 时报错而非退回全局。
 * 工作区 MCP 的落点由 `test/workspace-mcp-json.test.mjs` 覆盖（`.mcp.json`）。
 *
 * Usage: node --test test/add-scope.test.mjs
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/** 在沙箱里跑，不碰用户真实目录。 */
async function withEnv(env, body) {
  const saved = {}
  for (const [key, value] of Object.entries(env)) {
    saved[key] = process.env[key]
    process.env[key] = value
  }
  try {
    return await body()
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
}

/** 造一个 host ctx：只实现技能管理器用到的 webServer 与事件。 */
function fakeCtx() {
  const ctx = {
    routes: [],
    webServer: { register(route) { ctx.routes.push(route); return () => {} } },
    effect(run) { const dispose = run(); return typeof dispose === 'function' ? dispose : () => {} },
    on() { return () => {} },
    logger: { info() {}, warn() {} },
  }
  return ctx
}

/** 发一条请求给路由并收集响应。 */
function call(route, method, url, body) {
  return new Promise((resolve, reject) => {
    const req = {
      method,
      url,
      socket: { remoteAddress: '127.0.0.1' },
      headers: { host: '127.0.0.1:3099' },
      // 兼容两种读法：`for await (chunk of req)` 与 `req.on('data'|'end')`。
      on(event, handler) {
        if (event === 'data' && body !== undefined) handler(Buffer.from(JSON.stringify(body)))
        if (event === 'end') handler()
        return req
      },
      [Symbol.asyncIterator]: async function* iterate() {
        if (body !== undefined) yield Buffer.from(JSON.stringify(body))
      },
    }
    const res = {
      statusCode: 0,
      payload: '',
      writeHead(code) { this.statusCode = code; return this },
      end(chunk) { this.payload = chunk ?? ''; resolve({ status: this.statusCode, body: JSON.parse(this.payload || '{}') }) },
    }
    try { route.handler(req, res) } catch (error) { reject(error) }
  })
}

// 表驱动合并：两条「添加技能落点」共用一个 skills-host 实例（同一套 env 与路由），
// 逐个请求执行原断言；第二条要求第一个技能未被写到全局，所以顺序固定、共享实例
// 正是原测试的前提（与合并前一致）。

test('添加技能：默认写全局，scope=workspace 写进工作区并自动建目录', async () => {
  const box = mkdtempSync(join(tmpdir(), 'pc-add-scope-'))
  const agentsHome = join(box, 'agents')
  const workspace = join(box, 'fresh-ws')
  try {
    await withEnv({ DSH_AGENTS_HOME: agentsHome, DSH_HOME: join(box, 'dsh') }, async () => {
      const host = await import('../vendor/skill-manager/skills-host.js')
      const ctx = fakeCtx()
      await host.apply(ctx)
      const route = ctx.routes.find((item) => item.path === '/api/skill-manager')
      assert.ok(route !== undefined, '技能路由已挂载')

      const body = (name) => ({
        skillName: name,
        description: 'probe',
        files: [],
      })

      // 1. 默认（不带 scope）= 全局
      const global = await call(route, 'POST', '/api/skill-manager/skills', body('zz-global'))
      assert.equal(global.status, 200, JSON.stringify(global.body))
      assert.ok(existsSync(join(agentsHome, 'skills', 'zz-global', 'SKILL.md')), '默认写进 ~/.agents/skills')

      // 2. scope=workspace 且工作区还没 .agents 目录 → 自动创建
      assert.equal(existsSync(join(workspace, '.agents')), false, '前提：工作区还没有 .agents')
      const scoped = await call(route, 'POST', '/api/skill-manager/skills', {
        ...body('zz-workspace'),
        scope: 'workspace',
        workspace,
      })
      assert.equal(scoped.status, 200, JSON.stringify(scoped.body))
      const target = join(workspace, '.agents', 'skills', 'zz-workspace', 'SKILL.md')
      assert.ok(existsSync(target), '写进工作区并自动创建了 .agents/skills')
      const text = readFileSync(target, 'utf8')
      assert.match(text, /name: zz-workspace/)
      // 没有污染全局
      assert.equal(existsSync(join(agentsHome, 'skills', 'zz-workspace')), false, '工作区技能不落到全局')
    })
  } finally {
    rmSync(box, { recursive: true, force: true })
  }
})

test('添加技能：scope=workspace 缺 workspace 时报错而不是悄悄写全局', async () => {
  const box = mkdtempSync(join(tmpdir(), 'pc-add-scope-'))
  try {
    await withEnv({ DSH_AGENTS_HOME: join(box, 'agents'), DSH_HOME: join(box, 'dsh') }, async () => {
      const host = await import('../vendor/skill-manager/skills-host.js')
      const ctx = fakeCtx()
      await host.apply(ctx)
      const route = ctx.routes.find((item) => item.path === '/api/skill-manager')
      const result = await call(route, 'POST', '/api/skill-manager/skills', {
        skillName: 'zz-nowhere', description: 'x', files: [], scope: 'workspace',
      })
      assert.equal(result.status, 400)
      assert.match(String(result.body.error ?? ''), /workspace/)
      assert.equal(existsSync(join(box, 'agents', 'skills', 'zz-nowhere')), false, '不能退回全局')
    })
  } finally {
    rmSync(box, { recursive: true, force: true })
  }
})

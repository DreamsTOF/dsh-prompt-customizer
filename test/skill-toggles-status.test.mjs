/**
 * skill-toggles 0.2.2 契约回归：
 *  - preset id 接受任意非空字符串（内核 agent-preset schema 只要求 string）；
 *  - /status 按 workspace > preset > global 计算有效状态；
 *  - /presets 透传 agentPresets.list() 的 broken。
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writePluginDoc, closeAllDbs } from '../vendor/prompt-customizer/db.js'
import { normalizeCwd } from '../src/home-paths.ts'
import { apply } from '../src/skill-toggles.ts'

function request(route, method, url, body) {
  return new Promise((resolve, reject) => {
    const req = {
      method,
      url,
      headers: { host: '127.0.0.1:3099' },
      socket: { remoteAddress: '127.0.0.1' },
      on(event, handler) {
        if (event === 'data' && body !== undefined) handler(Buffer.from(JSON.stringify(body)))
        if (event === 'end') handler()
        return this
      },
      [Symbol.asyncIterator]: async function* iterate() {
        if (body !== undefined) yield Buffer.from(JSON.stringify(body))
      },
    }
    const res = {
      statusCode: 0,
      payload: '',
      writeHead(status) { this.statusCode = status; return this },
      end(chunk) { this.payload = chunk ?? ''; resolve({ status: this.statusCode, body: JSON.parse(this.payload || '{}') }) },
    }
    try { route.handler(req, res) } catch (error) { reject(error) }
  })
}

function fakeCtx(workspace) {
  const routes = []
  const skills = {
    list: async () => [
      { name: 'alpha', description: 'a' },
      { name: 'beta', description: 'b' },
      { name: 'gamma', description: 'c' },
    ],
  }
  const agent = {
    session: { header: { id: 's1', cwd: workspace, createdAt: 1 } },
    ctx: {
      get(name) { return name === 'skills' ? skills : undefined },
      inject(_deps, callback) { return callback({ skills: { registerProvider: () => ({}) } }) },
    },
  }
  const agentPresets = {
    list: async () => [{ id: 'p1', broken: 'row failed', name: 'P1' }],
    defaultId: 'p1',
  }
  const ctx = {
    routes,
    webServer: { register(route) { routes.push(route); return () => {} } },
    effect(run) { const dispose = run(); return typeof dispose === 'function' ? dispose : () => {} },
    on() { return () => {} },
    inject(_deps, callback) { return callback({ skills: { registerProvider: () => ({}) } }) },
    logger: { info() {}, warn() {} },
    get(name) {
      if (name === 'agents') return { list: () => [agent], roots: () => [agent] }
      if (name === 'agentPresets') return agentPresets
      return undefined
    },
  }
  return ctx
}

test('skill-toggles：/status 按 workspace > preset > global 计算有效状态', async () => {
  const box = mkdtempSync(join(tmpdir(), 'pc-skill-status-'))
  const workspace = join(box, 'ws')
  mkdirSync(workspace, { recursive: true })
  const saved = { DSH_HOME: process.env.DSH_HOME, DSH_AGENTS_HOME: process.env.DSH_AGENTS_HOME }
  process.env.DSH_HOME = join(box, 'dsh')
  process.env.DSH_AGENTS_HOME = join(box, 'agents')
  mkdirSync(process.env.DSH_AGENTS_HOME, { recursive: true })
  try {
    writePluginDoc('skills/hidden-toggles', { version: 1, hidden: ['alpha'] })
    writePluginDoc('skills/preset-toggles', { version: 1, presets: { p1: { beta: false } } })
    writePluginDoc('skills/workspace-toggles', {
      version: 1,
      workspaces: { [normalizeCwd(workspace)]: { alpha: true } },
    })
    const ctx = fakeCtx(workspace)
    await apply(ctx)
    const route = ctx.routes.find((item) => item.path === '/api/skill-toggles')
    assert.ok(route !== undefined)
    const status = await request(route, 'GET', `/api/skill-toggles/status?preset=p1&workspace=${encodeURIComponent(workspace)}`)
    assert.equal(status.status, 200, JSON.stringify(status.body))
    assert.equal(status.body.skills.alpha, true, '工作区 true 覆盖全局关闭')
    assert.equal(status.body.skills.beta, false, '预设 false 关闭')
    assert.equal(status.body.skills.gamma, true, '未覆盖 → 全局启用')
    assert.equal(status.body.global.skills.alpha, false, 'global 仍是关闭')

    const presets = await request(route, 'GET', '/api/skill-toggles/presets')
    assert.equal(presets.status, 200)
    assert.equal(presets.body.presets[0].broken, 'row failed', 'broken 必须透传')
  } finally {
    closeAllDbs()
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
    rmSync(box, { recursive: true, force: true })
  }
})

test('skill-toggles：preset id 接受任意非空字符串', async () => {
  const box = mkdtempSync(join(tmpdir(), 'pc-skill-preset-'))
  const saved = { DSH_HOME: process.env.DSH_HOME, DSH_AGENTS_HOME: process.env.DSH_AGENTS_HOME }
  process.env.DSH_HOME = join(box, 'dsh')
  process.env.DSH_AGENTS_HOME = join(box, 'agents')
  mkdirSync(process.env.DSH_AGENTS_HOME, { recursive: true })
  try {
    const ctx = fakeCtx(join(box, 'ws'))
    await apply(ctx)
    const route = ctx.routes.find((item) => item.path === '/api/skill-toggles')
    const result = await request(route, 'PUT', `/api/skill-toggles/presets/${encodeURIComponent('团队 预设')}/skills/alpha`, { enabled: false })
    assert.equal(result.status, 200, JSON.stringify(result.body))
    assert.equal(result.body.preset, '团队 预设')
  } finally {
    closeAllDbs()
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
    rmSync(box, { recursive: true, force: true })
  }
})

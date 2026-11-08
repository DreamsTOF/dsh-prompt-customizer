/**
 * mcp-status 0.2.2 契约回归：
 *  - 全局 MCP 行来自 ctx.configEditor.entries()，disabled 读 entry.options.disabled；
 *  - 无 profileContext.patchPath → 503（不回退 web）；
 *  - toggle/remove 走 loader.update/remove（configEditor.edit 只用于 config 整份替换）；
 *  - mcpManager 缺席返回 manualRefreshRequired=true。
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { applyMcpStatus } from '../src/mcp-status.ts'

function request(route, method, url, body) {
  return new Promise((resolve, reject) => {
    const req = {
      method,
      url,
      headers: { host: '127.0.0.1:3099' },
      socket: { remoteAddress: '127.0.0.1' },
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

function makeEntry(id, serverName, disabled, extra = {}, tree) {
  return {
    options: {
      id,
      name: '@deepseek-ai/dsh-mcp-client',
      disabled,
      config: { serverName, transport: 'stdio', command: 'npx', args: ['-y', serverName], ...extra },
    },
    parent: { tree: tree ?? { create: async () => undefined } },
  }
}

function fakeCtx({ withProfile = true, manager } = {}) {
  const routes = []
  const calls = { update: [], remove: [], edit: [] }
  const treeCalls = []
  const tree = { create: async (options) => { treeCalls.push(options) } }
  const entries = [
    makeEntry('mcp-alpha', 'alpha', false, {}, tree),
    makeEntry('mcp-beta', 'beta', true, {}, tree),
  ]
  const ctx = {
    routes,
    calls,
    treeCalls,
    entries,
    webServer: { register(route) { routes.push(route); return () => {} } },
    effect(run) { const dispose = run(); return typeof dispose === 'function' ? dispose : () => {} },
    on() { return () => {} },
    logger: { info() {}, warn() {} },
    tools: { schemas: () => [
      { name: 'mcp__alpha__search', description: 'search' },
      { name: 'mcp__readonly__ping', description: 'ping' },
    ] },
    configEditor: {
      entries: () => entries,
      configuration: () => entries.map(entry => ({ entry, inherited: {}, override: {} })),
      edit: async (entry, change) => { calls.edit.push({ id: entry.options.id, next: change({}, {}) }) },
    },
    loader: {
      update: async (id, options) => { calls.update.push({ id, options }) },
      remove: (id) => { calls.remove.push(id) },
    },
    get(name) {
      if (name === 'configEditor') return ctx.configEditor
      if (name === 'loader') return ctx.loader
      if (name === 'profileContext') return withProfile ? { patchPath: 'C:\\dsh\\profiles\\web\\cordis.patch.yml', name: 'web' } : undefined
      if (name === 'mcpManager') return manager
      return undefined
    },
  }
  return ctx
}

test('mcp-status：configEditor 行枚举，disabled 读 entry.options.disabled 布尔值', async () => {
  const ctx = fakeCtx()
  applyMcpStatus(ctx)
  const route = ctx.routes.find((item) => item.path === '/api/triad/mcp-status')
  const status = await request(route, 'GET', '/api/triad/mcp-status')
  assert.equal(status.status, 200, JSON.stringify(status.body))
  const alpha = status.body.servers.find((server) => server.serverName === 'alpha')
  const beta = status.body.servers.find((server) => server.serverName === 'beta')
  assert.equal(alpha.config.editable, true)
  assert.equal(alpha.config.disabled, false, 'entry.options.disabled=false 不能被当成禁用')
  assert.equal(beta.config.disabled, true)
  const readonly = status.body.servers.find((server) => server.serverName === 'readonly')
  assert.equal(readonly.config.editable, false, '运行时注册但无配置行 → 只读')
  assert.equal(status.body.manualRefreshRequired, true, 'mcpManager 缺席 → 提示手动刷新')
})

test('mcp-status：无 profileContext/patchPath → 503', async () => {
  const ctx = fakeCtx({ withProfile: false })
  applyMcpStatus(ctx)
  const route = ctx.routes.find((item) => item.path === '/api/triad/mcp-status')
  const status = await request(route, 'GET', '/api/triad/mcp-status')
  assert.equal(status.status, 503)
  assert.equal(status.body.error, 'profile-unavailable')
  const config = ctx.routes.find((item) => item.path === '/api/triad/mcp-config')
  const toggle = await request(config, 'POST', '/api/triad/mcp-config', { serverName: 'alpha', disabled: true })
  assert.equal(toggle.status, 503, '写路由同样 503，不得回退 web profile')
})

test('mcp-status：toggle/remove 走 loader，不逐行改 YAML', async () => {
  const ctx = fakeCtx()
  applyMcpStatus(ctx)
  const route = ctx.routes.find((item) => item.path === '/api/triad/mcp-config')
  const toggle = await request(route, 'POST', '/api/triad/mcp-config', { serverName: 'alpha', disabled: true })
  assert.equal(toggle.status, 200, JSON.stringify(toggle.body))
  assert.deepEqual(ctx.calls.update, [{ id: 'mcp-alpha', options: { disabled: true } }])
  const remove = await request(route, 'POST', '/api/triad/mcp-config', { serverName: 'beta', action: 'remove' })
  assert.equal(remove.status, 200, JSON.stringify(remove.body))
  assert.deepEqual(ctx.calls.remove, ['mcp-beta'])
})

test('mcp-status：mcpManager 存在时合并状态且不要求手动刷新', async () => {
  const manager = {
    list: () => [{ name: 'alpha', configured: true, status: { state: 'ready' } }],
  }
  const ctx = fakeCtx({ manager })
  applyMcpStatus(ctx)
  const route = ctx.routes.find((item) => item.path === '/api/triad/mcp-status')
  const status = await request(route, 'GET', '/api/triad/mcp-status')
  assert.equal(status.body.manualRefreshRequired, false)
  const alpha = status.body.servers.find((server) => server.serverName === 'alpha')
  assert.deepEqual(alpha.managerStatus, { state: 'ready' })
})

test('mcp-status：新增全局行走 profile 根 Include tree.create（不拼 YAML 文本）', async () => {
  const ctx = fakeCtx()
  applyMcpStatus(ctx)
  const route = ctx.routes.find((item) => item.path === '/api/triad/mcp-config')
  const add = await request(route, 'POST', '/api/triad/mcp-config', {
    action: 'add',
    format: 'json',
    text: JSON.stringify({ mcpServers: { gamma: { command: 'npx', args: ['-y', 'gamma'] } } }),
  })
  assert.equal(add.status, 200, JSON.stringify(add.body))
  assert.deepEqual(add.body.added, ['gamma'])
  assert.equal(ctx.treeCalls.length, 1)
  assert.equal(ctx.treeCalls[0].id, 'mcp-gamma')
  assert.equal(ctx.treeCalls[0].name, '@deepseek-ai/dsh-mcp-client')
  assert.equal(ctx.treeCalls[0].config.serverName, 'gamma')
})

test('mcp-status：profile 未知时不会读取或写入磁盘', async () => {
  const box = mkdtempSync(join(tmpdir(), 'pc-mcp-status-'))
  try {
    const ctx = fakeCtx({ withProfile: false })
    applyMcpStatus(ctx)
    const route = ctx.routes.find((item) => item.path === '/api/triad/mcp-status')
    const status = await request(route, 'GET', '/api/triad/mcp-status')
    assert.equal(status.status, 503)
    assert.deepEqual(ctx.calls.update, [])
  } finally {
    rmSync(box, { recursive: true, force: true })
  }
})

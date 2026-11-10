/**
 * mcp-status 0.2.2 契约回归：
 *  - 全局 MCP 行来自 ctx.configEditor.entries()，disabled 读 entry.options.disabled；
 *  - 无 profileContext.patchPath → 503（不回退 web）；
 *  - toggle/remove 走 loader.update/remove（configEditor.edit 只用于 config 整份替换）；
 *  - mcpManager 缺席返回 manualRefreshRequired=true。
 */

import { after, afterEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { applyMcpStatus } from '../src/mcp-status.ts'
import { globalMcpsRoot, readGlobalMcpStore, writeGlobalMcpStore } from '../src/mcp-global-store.ts'
import { closeAllDbs } from '../vendor/prompt-customizer/db.js'

const originalDshHome = process.env.DSH_HOME
const testHome = mkdtempSync(join(tmpdir(), 'pc-mcp-status-home-'))
process.env.DSH_HOME = testHome
after(() => {
  if (originalDshHome === undefined) delete process.env.DSH_HOME
  else process.env.DSH_HOME = originalDshHome
  closeAllDbs()
  rmSync(testHome, { recursive: true, force: true })
})
afterEach(() => {
  writeGlobalMcpStore('web', { version: 1, servers: [] })
})
function clearGlobalStoreDoc() {
  rmSync(globalMcpsRoot(), { recursive: true, force: true })
}

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

function fakeCtx({ withProfile = true, manager, profile, appReady = false, disposers = [] } = {}) {
  const routes = []
  const calls = { create: [], update: [], remove: [], edit: [] }
  const loader = {
    store: Object.create(null),
    create: async (options) => {
      calls.create.push(options)
      loader.store[options.id] = { options }
      return options.id
    },
    update: async (id, options) => { calls.update.push({ id, options }) },
    remove: (id) => { calls.remove.push(id) },
  }
  const entries = [
    makeEntry('mcp-alpha', 'alpha', false),
    makeEntry('mcp-beta', 'beta', true),
  ]
  const ctx = {
    routes,
    calls,
    entries,
    loader,
    disposers,
    webServer: { register(route) { routes.push(route); return () => {} } },
    effect(run) {
      const dispose = run()
      if (typeof dispose === 'function') disposers.push(dispose)
      return typeof dispose === 'function' ? dispose : () => {}
    },
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
    loader,
    get(name) {
      if (name === 'configEditor') return ctx.configEditor
      if (name === 'loader') return ctx.loader
      if (name === 'profileContext') return withProfile
        ? (profile ?? { patchPath: 'C:\\dsh\\profiles\\web\\cordis.patch.yml', name: 'web' })
        : undefined
      if (name === 'mcpManager') return manager
      if (name === 'appReady' && appReady) return { onReady(listener) { listener(); return () => {} } }
      return undefined
    },
  }
  return ctx
}

test('mcp-status：configEditor 行枚举，disabled 读 entry.options.disabled 布尔值', async () => {
  const ctx = fakeCtx()
  await applyMcpStatus(ctx)
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
  await applyMcpStatus(ctx)
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
  await applyMcpStatus(ctx)
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
  await applyMcpStatus(ctx)
  const route = ctx.routes.find((item) => item.path === '/api/triad/mcp-status')
  const status = await request(route, 'GET', '/api/triad/mcp-status')
  assert.equal(status.body.manualRefreshRequired, false)
  const alpha = status.body.servers.find((server) => server.serverName === 'alpha')
  assert.deepEqual(alpha.managerStatus, { state: 'ready' })
})

test('mcp-status：新增全局行写入 .dsh/mcps 并挂 root Loader，不碰 profile 根 Include', async () => {
  const ctx = fakeCtx()
  await applyMcpStatus(ctx)
  const route = ctx.routes.find((item) => item.path === '/api/triad/mcp-config')
  const add = await request(route, 'POST', '/api/triad/mcp-config', {
    action: 'add',
    format: 'json',
    text: JSON.stringify({ mcpServers: { gamma: { command: 'npx', args: ['-y', 'gamma'] } } }),
  })
  assert.equal(add.status, 200, JSON.stringify(add.body))
  assert.deepEqual(add.body.added, ['gamma'])
  assert.equal(ctx.calls.create.length, 1)
  assert.equal(ctx.calls.create[0].id, 'mcp-gamma')
  assert.equal(ctx.calls.create[0].name, '@deepseek-ai/dsh-mcp-client')
  assert.equal(ctx.calls.create[0].config.serverName, 'gamma')
  const stored = readGlobalMcpStore('web')
  assert.equal(stored.servers.length, 1)
  assert.equal(stored.servers[0].config.serverName, 'gamma')
})

test('mcp-status：新增全局行把 ${VAR} 以原文本落盘，挂载时再转 !!js', async () => {
  const ctx = fakeCtx()
  await applyMcpStatus(ctx)
  const route = ctx.routes.find((item) => item.path === '/api/triad/mcp-config')
  const add = await request(route, 'POST', '/api/triad/mcp-config', {
    action: 'add',
    format: 'json',
    text: JSON.stringify({ mcpServers: { gamma: { command: 'npx', env: { TOKEN: '${TOKEN}' } } } }),
  })
  assert.equal(add.status, 200, JSON.stringify(add.body))
  const config = readGlobalMcpStore('web').servers[0].config
  assert.equal(config.env.TOKEN, '${TOKEN}')
  assert.deepEqual(ctx.calls.create[0].config.env.TOKEN, { __jsExpr: '`${process.env.TOKEN}`' })
})

test('mcp-status：profile 未知时不会读取或写入磁盘', async () => {
  const box = mkdtempSync(join(tmpdir(), 'pc-mcp-status-'))
  try {
    const ctx = fakeCtx({ withProfile: false })
    await applyMcpStatus(ctx)
    const route = ctx.routes.find((item) => item.path === '/api/triad/mcp-status')
    const status = await request(route, 'GET', '/api/triad/mcp-status')
    assert.equal(status.status, 503)
    assert.deepEqual(ctx.calls.update, [])
  } finally {
    rmSync(box, { recursive: true, force: true })
  }
})

test('mcp-status：启动从 .dsh/mcps 加载全局行并体现在状态里', async () => {
  writeGlobalMcpStore('web', {
    version: 1,
    servers: [{
      id: 'mcp-delta',
      config: { serverName: 'delta', transport: 'stdio', command: 'npx', args: ['-y', 'delta'] },
      disabled: false,
    }],
  })
  const ctx = fakeCtx()
  await applyMcpStatus(ctx)
  await new Promise((resolve) => setTimeout(resolve, 5))
  assert.deepEqual(ctx.calls.create.map((row) => row.id), ['mcp-delta'])
  const route = ctx.routes.find((item) => item.path === '/api/triad/mcp-status')
  const status = await request(route, 'GET', '/api/triad/mcp-status')
  const delta = status.body.servers.find((server) => server.serverName === 'delta')
  assert.equal(delta.config.editable, true)
  assert.equal(delta.config.managed, true)
  assert.equal(delta.config.disabled, false)
})

test('mcp-status：插件账本行 toggle/remove 同步 .dsh/mcps 与启停元数据', async () => {
  writeGlobalMcpStore('web', {
    version: 1,
    servers: [{
      id: 'mcp-delta',
      config: { serverName: 'delta', transport: 'stdio', command: 'npx', args: ['-y', 'delta'] },
      disabled: false,
    }],
  })
  const ctx = fakeCtx()
  await applyMcpStatus(ctx)
  await new Promise((resolve) => setTimeout(resolve, 5))
  const route = ctx.routes.find((item) => item.path === '/api/triad/mcp-config')
  const toggle = await request(route, 'POST', '/api/triad/mcp-config', { serverName: 'delta', disabled: true })
  assert.equal(toggle.status, 200, JSON.stringify(toggle.body))
  assert.deepEqual(ctx.calls.update.at(-1), { id: 'mcp-delta', options: { disabled: true } })
  assert.equal(readGlobalMcpStore('web').servers[0].disabled, true)
  const remove = await request(route, 'POST', '/api/triad/mcp-config', { serverName: 'delta', action: 'remove' })
  assert.equal(remove.status, 200, JSON.stringify(remove.body))
  assert.deepEqual(ctx.calls.remove, ['mcp-delta'])
  assert.equal(readGlobalMcpStore('web').servers.length, 0)
})

test('mcp-status：插件账本行编辑写 .dsh/mcps 并更新 root Loader config', async () => {
  writeGlobalMcpStore('web', {
    version: 1,
    servers: [{
      id: 'mcp-delta',
      config: { serverName: 'delta', transport: 'stdio', command: 'npx', args: ['-y', 'delta'] },
      disabled: false,
    }],
  })
  const ctx = fakeCtx()
  await applyMcpStatus(ctx)
  await new Promise((resolve) => setTimeout(resolve, 5))
  const route = ctx.routes.find((item) => item.path === '/api/triad/mcp-edit')
  const edited = await request(route, 'POST', '/api/triad/mcp-edit', {
    serverName: 'delta',
    format: 'json',
    text: JSON.stringify({ mcpServers: { delta: { command: 'node', args: ['server.js'] } } }),
  })
  assert.equal(edited.status, 200, JSON.stringify(edited.body))
  assert.equal(readGlobalMcpStore('web').servers[0].config.command, 'node')
  assert.deepEqual(ctx.calls.update.at(-1).options, {
    config: { serverName: 'delta', transport: 'stdio', command: 'node', args: ['server.js'] },
  })
})

test('mcp-status：appReady 门控后加载，插件卸载清理 root Loader 条目', async () => {
  writeGlobalMcpStore('web', {
    version: 1,
    servers: [{
      id: 'mcp-delta',
      config: { serverName: 'delta', transport: 'stdio', command: 'npx', args: ['-y', 'delta'] },
      disabled: false,
    }],
  })
  const disposers = []
  const ctx = fakeCtx({ appReady: true, disposers })
  await applyMcpStatus(ctx)
  await new Promise((resolve) => setTimeout(resolve, 5))
  assert.deepEqual(ctx.calls.create.map((row) => row.id), ['mcp-delta'])
  for (const dispose of disposers) await dispose()
  assert.ok(ctx.calls.remove.includes('mcp-delta'))
})

test('mcp-status：首次升级把旧 runtime 行收进 .dsh/mcps 账本', async () => {
  clearGlobalStoreDoc()
  const box = mkdtempSync(join(tmpdir(), 'pc-mcp-adopt-'))
  const profileDir = join(box, 'profile')
  const profile = {
    patchPath: join(profileDir, 'cordis.patch.yml'),
    name: 'web',
    dir: profileDir,
  }
  mkdirSync(profileDir, { recursive: true })
  writeFileSync(join(profileDir, 'cordis.patch.yml'), '[]\n')
  writeFileSync(join(profileDir, 'cordis.yml'), '- id: mcp-alpha\n  name: "@deepseek-ai/dsh-mcp-client"\n  config:\n    serverName: alpha\n    command: npx\n- id: mcp-beta\n  name: "@deepseek-ai/dsh-mcp-client"\n  config:\n    serverName: beta\n    command: npx\n')
  const ctx = fakeCtx({ profile })
  const rowTree = { store: Object.create(null) }
  for (const entry of ctx.entries) {
    entry.parent.tree = rowTree
    rowTree.store[entry.options.id] = entry
  }
  await applyMcpStatus(ctx)
  await new Promise((resolve) => setTimeout(resolve, 5))
  const stored = readGlobalMcpStore('web')
  assert.deepEqual(stored.servers.map((row) => row.config.serverName).sort(), ['alpha', 'beta'])
  rmSync(box, { recursive: true, force: true })
})

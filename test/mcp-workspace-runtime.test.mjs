/**
 * mcp-workspace 运行时接线测试（假宿主）。
 *
 * 覆盖 applyWorkspaceMcp 真正做的事：把 mcps 目录里的配置挂成 loader 行、
 * 注册状态路由、按会话 cwd 过滤工具可见性。用假 ctx 代替宿主，是因为改插件
 * 文件不会让运行中的 DSH 热重载 host 半身（只有重启才会加载新代码）。
 *
 * Usage: node --test test/mcp-workspace-runtime.test.mjs
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { EventEmitter } from 'node:events'

/** 假 loader：记录 create/update/remove 与现存行。 */
function fakeLoader() {
  const entries = new Map()
  let nextId = 0
  return {
    entries: () => [...entries.values()].map((row) => ({ options: row.options })),
    create: async (options) => {
      const id = options.id ?? `auto-${String(nextId += 1)}`
      entries.set(id, { id, options, cursor: 0 })
      return { id }
    },
    update: async (id, options) => {
      const current = entries.get(id)
      if (current === undefined) throw new Error(`cannot resolve entry ${id}`)
      entries.set(id, { ...current, options })
    },
    remove: (id) => { entries.delete(id) },
    ids: () => [...entries.keys()],
    optionsOf: (id) => entries.get(id)?.options,
    /** 预置一条「组合里已有的行」（模拟 profile patch 里的 mcp-client）。 */
    seed: (options) => {
      const id = options.id ?? `seed-${String(nextId += 1)}`
      entries.set(id, { id, options, cursor: 0 })
      return id
    },
  }
}

/** 假 ctx：只实现本模块用到的面。 */
function fakeCtx(cwd, loader) {
  const handlers = new Map()
  const routes = []
  const disposers = []
  return {
    loader,
    profileContext: { cwd },
    get: (name) => (name === 'agents' ? { list: () => [] } : undefined),
    on: (event, handler) => {
      const list = handlers.get(event) ?? []
      list.push(handler)
      handlers.set(event, list)
      return () => {
        const current = handlers.get(event) ?? []
        handlers.set(event, current.filter((item) => item !== handler))
      }
    },
    effect: (run) => {
      const dispose = run()
      disposers.push(dispose)
      return dispose
    },
    webServer: { register: (route) => { routes.push(route); return () => {} } },
    logger: { warn: () => {}, info: () => {} },
    handlersOf: (event) => handlers.get(event) ?? [],
    routes,
    disposers,
  }
}

/** 打一次路由。 */
function call(handler, method, url) {
  return new Promise((resolvePromise, reject) => {
    const req = new EventEmitter()
    req.method = method
    req.url = url
    req.headers = { host: 'localhost' }
    req.socket = { remoteAddress: '127.0.0.1' }
    const res = {
      statusCode: 0,
      writeHead(status) { this.statusCode = status },
      end(payload) {
        try { resolvePromise({ status: this.statusCode, body: JSON.parse(payload) }) } catch (error) { reject(error) }
      },
    }
    handler(req, res)
    queueMicrotask(() => { req.emit('end') })
  })
}

/** 等到条件成立（boot 是异步的）。 */
async function until(predicate, timeoutMs = 3000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    if (predicate()) return true
    await new Promise((r) => setTimeout(r, 20))
  }
  return predicate()
}

async function withEnv(env, run) {
  const saved = {}
  for (const key of ['DSH_HOME', 'DSH_AGENTS_HOME']) {
    saved[key] = process.env[key]
    if (env[key] === undefined) delete process.env[key]
    else process.env[key] = env[key]
  }
  try { return await run() } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
}

function sandbox() {
  const root = mkdtempSync(join(tmpdir(), 'dsh-pc-wsmcprun-'))
  const workspace = join(root, 'ws')
  mkdirSync(join(workspace, '.git'), { recursive: true })
  const agentsHome = join(root, 'agents')
  mountFixture(join(workspace, '.agents', 'mcps', 'local'), { local: { command: 'node', args: ['server.mjs'] } })
  mountFixture(join(agentsHome, 'mcps', 'shared'), { shared: { url: 'https://example.test/mcp' } })
  return { root, workspace, agentsHome, dshHome: join(root, 'dsh') }
}

function mountFixture(dir, servers) {
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'mcp.json'), JSON.stringify({ mcpServers: servers }, null, 2))
}

/** 释放假 ctx 装的一切（关闭文件监视，否则测试进程不退出）。 */
function disposeAll(ctx) {
  for (const dispose of ctx.disposers) if (typeof dispose === 'function') dispose()
}

test('mcp-workspace: mcps 目录里的 Server 被挂成 mcp-client 行（工作区带哈希后缀）', async (t) => {
  const box = sandbox()
  const cleanups = []
  t.after(() => {
    for (const cleanup of cleanups) cleanup()
    rmSync(box.root, { recursive: true, force: true })
  })
  await withEnv({ DSH_AGENTS_HOME: box.agentsHome, DSH_HOME: box.dshHome }, async () => {
    const loader = fakeLoader()
    const ctx = fakeCtx(box.workspace, loader)
    cleanups.push(() => { disposeAll(ctx) })
    const { applyWorkspaceMcp, scopedServerName } = await import('../src/mcp-workspace.ts')
    applyWorkspaceMcp(ctx)

    const mounted = await until(() => loader.ids().length === 2)
    assert.ok(mounted, `两个 server 都应挂上（实际 ${loader.ids().join(', ')}）`)
    const rows = loader.ids().map((id) => loader.optionsOf(id))
    const names = rows.map((row) => row.config.serverName).sort()
    // 全局层保留原名（shared）；工作区层带 8 位路径哈希后缀。
    assert.deepEqual(names, ['shared', scopedServerName(box.workspace, 'local')].sort())
    for (const row of rows) {
      assert.equal(row.name, '@deepseek-ai/dsh-mcp-client', '挂的是真正的 mcp-client 行')
    }

    // 状态路由要能读出来源
    const route = ctx.routes.find((item) => item.path === '/api/triad/mcp-workspace')
    assert.ok(route !== undefined, '状态路由已注册')
    const status = await call(route.handler, 'GET', '/api/triad/mcp-workspace/status')
    assert.equal(status.status, 200)
    assert.equal(status.body.global.length, 1)
    assert.equal(status.body.workspaces.length, 1)
    assert.equal(status.body.workspaces[0].servers[0].name, 'local')
  })
})

test('mcp-workspace: 可见性过滤只放行本工作区会话（全局层对所有会话可见）', async (t) => {
  const box = sandbox()
  const cleanups = []
  t.after(() => {
    for (const cleanup of cleanups) cleanup()
    rmSync(box.root, { recursive: true, force: true })
  })
  await withEnv({ DSH_AGENTS_HOME: box.agentsHome, DSH_HOME: box.dshHome }, async () => {
    const loader = fakeLoader()
    const ctx = fakeCtx(box.workspace, loader)
    cleanups.push(() => { disposeAll(ctx) })
    const { applyWorkspaceMcp, scopedServerName } = await import('../src/mcp-workspace.ts')
    applyWorkspaceMcp(ctx)
    await until(() => loader.ids().length === 2)

    const filters = ctx.handlersOf('system-prompt/assemble')
    assert.equal(filters.length, 1, '装配过滤已装')
    const filter = filters[0]

    const localServer = scopedServerName(box.workspace, 'local')
    const run = (cwd) => {
      const assembly = { tools: [
        { name: `mcp__${localServer}__do` },
        { name: 'mcp__shared__ping' },
        { name: 'read_file' },
      ] }
      const context = cwd === undefined ? {} : { agent: { session: { header: { cwd } } } }
      return filter(assembly, context, async () => assembly).then(() => assembly.tools.map((tool) => tool.name))
    }

    const sameWorkspace = await run(box.workspace)
    assert.ok(sameWorkspace.includes(`mcp__${localServer}__do`), '本工作区能看到工作区 Server')
    assert.ok(sameWorkspace.includes('mcp__shared__ping'), '全局 Server 对本工作区可见')

    const otherWorkspace = await run(box.root)
    assert.ok(!otherWorkspace.includes(`mcp__${localServer}__do`), '别的工作区看不到该工作区 Server')
    assert.ok(otherWorkspace.includes('mcp__shared__ping'), '全局 Server 对别的工作区也可见')
    assert.ok(otherWorkspace.includes('read_file'), '非 MCP 工具不受影响')
  })
})

test('mcp-workspace: 与组合同名时让位（不重复挂载，如实上报 skipped）', async (t) => {
  const box = sandbox()
  const cleanups = []
  t.after(() => {
    for (const cleanup of cleanups) cleanup()
    rmSync(box.root, { recursive: true, force: true })
  })
  await withEnv({ DSH_AGENTS_HOME: box.agentsHome, DSH_HOME: box.dshHome }, async () => {
    const loader = fakeLoader()
    // 组合里已经有一台 shared（profile patch 里的行）→ 目录里的同名配置必须让位。
    loader.seed({ id: 'mcp-shared', name: '@deepseek-ai/dsh-mcp-client', config: { serverName: 'shared', transport: 'streamable-http', url: 'https://composition.test/mcp' } })
    const ctx = fakeCtx(box.workspace, loader)
    cleanups.push(() => { disposeAll(ctx) })
    const { applyWorkspaceMcp, scopedServerName } = await import('../src/mcp-workspace.ts')
    applyWorkspaceMcp(ctx)

    // 只有工作区那台（带哈希后缀，不会与组合同名）挂进 loader。
    const mounted = await until(() => loader.ids().length === 2)
    assert.ok(mounted, `工作区那台应挂上（实际 ${loader.ids().join(', ')}）`)
    assert.deepEqual(loader.ids().sort(),
      ['mcp-shared', `wsmcp-${scopedServerName(box.workspace, 'local')}`].sort())

    const route = ctx.routes.find((item) => item.path === '/api/triad/mcp-workspace')
    const status = await call(route.handler, 'GET', '/api/triad/mcp-workspace/status')
    assert.equal(status.status, 200)
    assert.equal(status.body.skipped.length, 1, '同名让位要如实上报')
    assert.equal(status.body.skipped[0].serverName, 'shared')
    assert.equal(status.body.skipped[0].reason, 'composition')
    assert.equal(status.body.mounted.length, 1, 'mounted 只记自己挂的')
  })
})

test('mcp-workspace: 释放时卸载自己挂的行（不残留）', async (t) => {
  const box = sandbox()
  const cleanups = []
  t.after(() => {
    for (const cleanup of cleanups) cleanup()
    rmSync(box.root, { recursive: true, force: true })
  })
  await withEnv({ DSH_AGENTS_HOME: box.agentsHome, DSH_HOME: box.dshHome }, async () => {
    const loader = fakeLoader()
    const ctx = fakeCtx(box.workspace, loader)
    cleanups.push(() => { disposeAll(ctx) })
    const { applyWorkspaceMcp } = await import('../src/mcp-workspace.ts')
    applyWorkspaceMcp(ctx)
    await until(() => loader.ids().length === 2)
    assert.equal(loader.ids().length, 2)
    disposeAll(ctx)
    assert.equal(loader.ids().length, 0, 'dispose 后不残留挂载行')
  })
})

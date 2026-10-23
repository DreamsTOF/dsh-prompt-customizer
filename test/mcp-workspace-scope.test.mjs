/**
 * 工作区级 MCP 关闭的回归测试。
 *
 * 覆盖的核心语义：在 A 工作区关掉某 Server，只影响 A 的装配；B 工作区照常注入
 * （因此工具集合随工作区变化），且不影响 profile patch 里的全局开关。
 *
 * Usage: node --test test/mcp-workspace-scope.test.mjs
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/** 在沙箱里跑，不碰用户真实的 ~/.agents。 */
function sandbox() {
  const root = mkdtempSync(join(tmpdir(), 'pc-ws-scope-'))
  const agentsHome = join(root, 'agents')
  mkdirSync(agentsHome, { recursive: true })
  return { root, agentsHome }
}

/** 临时替换 env，结束后还原。 */
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

/** 造一个最小的宿主 ctx：只实现本模块用到的 webServer 与事件注册。 */
function fakeCtx() {
  const handlers = []
  const ctx = {
    routes: [],
    webServer: {
      register(route) {
        ctx.routes.push(route)
        return () => {}
      },
    },
    effect(run) {
      const dispose = run()
      return typeof dispose === 'function' ? dispose : () => {}
    },
    on(event, handler) {
      handlers.push({ event, handler })
      return () => {}
    },
    handlers,
    logger: { info() {}, warn() {} },
  }
  return ctx
}

/** 模拟一次装配：给定会话 cwd 与工具名，跑完 waterfall 看剩下什么。 */
async function assemble(ctx, cwd, toolNames) {
  const assembly = { tools: toolNames.map(name => ({ name })) }
  const context = { agent: { session: { header: { cwd } } } }
  let tail = () => Promise.resolve()
  for (const { event, handler } of ctx.handlers) {
    if (event !== 'system-prompt/assemble') continue
    const next = tail
    tail = () => handler(assembly, context, next)
  }
  await tail()
  return assembly.tools.map(tool => tool.name)
}

test('工作区级关闭：只影响该工作区，换工作区照常注入', async () => {
  const box = sandbox()
  try {
    const workspaceA = join(box.root, 'proj-a')
    const workspaceB = join(box.root, 'proj-b')
    mkdirSync(workspaceA, { recursive: true })
    mkdirSync(workspaceB, { recursive: true })

    await withEnv({ DSH_AGENTS_HOME: box.agentsHome }, async () => {
      const scope = await import('../src/mcp-workspace-scope.ts')
      const ctx = fakeCtx()
      scope.applyMcpWorkspaceScope(ctx)
      // 等挂载期的首次读盘完成。
      await new Promise(resolve => setTimeout(resolve, 10))

      const tools = ['mcp__anysearch__search', 'mcp__anysearch__score', 'mcp__codegraph__explore']

      // 关掉 A 工作区的 anysearch。
      await scope.setWorkspaceServer(workspaceA, 'anysearch', false)

      const inA = await assemble(ctx, workspaceA, tools)
      assert.deepEqual(inA, ['mcp__codegraph__explore'], 'A 工作区看不到 anysearch 的工具')

      const inB = await assemble(ctx, workspaceB, tools)
      assert.deepEqual(inB, tools, 'B 工作区照常注入 anysearch，工具集合随工作区变化')

      // 账本落盘形状。
      const ledger = JSON.parse(readFileSync(join(box.agentsHome, 'skills', '.workspace-mcp.json'), 'utf8'))
      assert.equal(ledger.version, 1)
      assert.equal(ledger.workspaces[workspaceA].anysearch, false)
      assert.equal(ledger.workspaces[workspaceB], undefined, '未操作的工作区不落账')

      // 在 A 重新启用：记录消失，A 也恢复注入。
      await scope.setWorkspaceServer(workspaceA, 'anysearch', true)
      const backInA = await assemble(ctx, workspaceA, tools)
      assert.deepEqual(backInA, tools, '重新启用后 A 工作区恢复注入')

      const after = JSON.parse(readFileSync(join(box.agentsHome, 'skills', '.workspace-mcp.json'), 'utf8'))
      assert.deepEqual(after.workspaces, {}, '账本清空（不留空对象）')
    })
  } finally {
    rmSync(box.root, { recursive: true, force: true })
  }
})

test('工作区级关闭：通过路由写入并按 cwd 回报状态', async () => {
  const box = sandbox()
  try {
    const workspace = join(box.root, 'proj')
    mkdirSync(workspace, { recursive: true })
    await withEnv({ DSH_AGENTS_HOME: box.agentsHome }, async () => {
      const scope = await import('../src/mcp-workspace-scope.ts')
      const ctx = fakeCtx()
      scope.applyMcpWorkspaceScope(ctx)
      await new Promise(resolve => setTimeout(resolve, 10))

      const route = ctx.routes.find(item => item.path === '/api/triad/mcp-workspace-scope')
      assert.ok(route !== undefined, '路由已挂载')

      /** 发一条请求并收集响应体。 */
      const call = (method, url, body) => new Promise((resolve, reject) => {
        const req = {
          method,
          url,
          socket: { remoteAddress: '127.0.0.1' },
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

      const put = await call('PUT', `/api/triad/mcp-workspace-scope/workspace/${encodeURIComponent(workspace)}/servers/anysearch`, { enabled: false })
      assert.equal(put.status, 200)
      assert.equal(put.body.closed?.[0] ?? 'anysearch', 'anysearch')

      const status = await call('GET', `/api/triad/mcp-workspace-scope/status?cwd=${encodeURIComponent(workspace)}`)
      assert.equal(status.status, 200)
      assert.deepEqual(status.body.closed, ['anysearch'], '按 cwd 回报该工作区被关的 server')

      const other = await call('GET', `/api/triad/mcp-workspace-scope/status?cwd=${encodeURIComponent(join(box.root, 'other'))}`)
      assert.deepEqual(other.body.closed, [], '别的工作区没有关闭项')

      // 连续覆盖写：Windows 上 rename 覆盖已存在文件可能 EPERM（0.11.2 实测踩到），
      // 这里锁住「关→开→再关」都能落盘。
      const enable = await call('PUT', `/api/triad/mcp-workspace-scope/workspace/${encodeURIComponent(workspace)}/servers/anysearch`, { enabled: true })
      assert.equal(enable.status, 200, '第二次写入（覆盖）不能因 EPERM 失败')
      const again = await call('PUT', `/api/triad/mcp-workspace-scope/workspace/${encodeURIComponent(workspace)}/servers/anysearch`, { enabled: false })
      assert.equal(again.status, 200, '第三次写入同样成功')
      const finalStatus = await call('GET', `/api/triad/mcp-workspace-scope/status?cwd=${encodeURIComponent(workspace)}`)
      assert.deepEqual(finalStatus.body.closed, ['anysearch'], '多次覆盖后账本仍正确')
      const onDisk = JSON.parse(readFileSync(join(box.agentsHome, 'skills', '.workspace-mcp.json'), 'utf8'))
      assert.equal(onDisk.workspaces[workspace].anysearch, false, '落盘内容与内存一致')
    })
  } finally {
    rmSync(box.root, { recursive: true, force: true })
  }
})

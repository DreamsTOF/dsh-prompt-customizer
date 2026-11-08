/**
 * 工作区 MCP 挂载契约（0.2.2）：按 agent/session 作用域挂载，
 * 不再走根 loader.create、不再给 serverName 加全局哈希；无会话 status=pending。
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { applyMcpWorkspaceScope, readWorkspaceRows, workspaceMcpMountStatus } from '../src/mcp-workspace-scope.ts'

function fakeCtx(agents) {
  const routes = []
  const handlers = []
  const mounted = []
  const plugin = {
    name: 'mcp-client',
    Config: (value) => value,
    apply(_ctx, config) { mounted.push(config) },
  }
  const loader = {
    entries: () => [{ options: { name: '@deepseek-ai/dsh-mcp-client' }, moduleNamespace: plugin }],
    unwrapExports: (namespace) => namespace,
  }
  for (const agent of agents) {
    agent.ctx = {
      get: () => undefined,
      plugin: async (value, config) => { mounted.push({ plugin: value, config }); return { dispose() {} } },
    }
  }
  const ctx = {
    routes,
    handlers,
    mounted,
    webServer: { register(route) { routes.push(route); return () => {} } },
    effect(run) { const dispose = run(); return typeof dispose === 'function' ? dispose : () => {} },
    on(event, handler) { handlers.push({ event, handler }); return () => {} },
    logger: { info() {}, warn() {} },
    get(name) {
      if (name === 'agents') return { list: () => agents }
      if (name === 'loader') return loader
      return undefined
    },
  }
  return ctx
}

function sessionAgent(cwd) {
  return { session: { header: { id: 's1', cwd, createdAt: 1 } } }
}

test('工作区 MCP：按 agent 作用域挂载，serverName 不再加哈希', async () => {
  const box = mkdtempSync(join(tmpdir(), 'pc-ws-mount-'))
  const workspace = join(box, 'ws')
  mkdirSync(workspace, { recursive: true })
  writeFileSync(join(workspace, '.mcp.json'), JSON.stringify({
    mcpServers: {
      anysearch: { url: 'https://api.example.com/mcp' },
      local: { command: 'node', args: ['server.mjs'] },
    },
  }), 'utf8')
  try {
    const agent = sessionAgent(workspace)
    const ctx = fakeCtx([agent])
    applyMcpWorkspaceScope(ctx)
    await new Promise((resolve) => setTimeout(resolve, 50))
    const configs = ctx.mounted.map((entry) => entry.config)
    assert.deepEqual(configs.map((config) => config.serverName).sort(), ['anysearch', 'local'], '原键名直接作为 serverName')
    assert.equal(configs.find((config) => config.serverName === 'anysearch').transport, 'streamable-http')
    assert.equal(configs.find((config) => config.serverName === 'local').transport, 'stdio')
    const status = workspaceMcpMountStatus()
    assert.equal(status.state, 'mounted')
    assert.equal(status.agents[0].state, 'mounted')
    assert.equal(status.agents[0].rows.length, 2)
  } finally {
    rmSync(box, { recursive: true, force: true })
  }
})

test('工作区 MCP：无会话时状态 pending，且不发生任何全局挂载', async () => {
  const box = mkdtempSync(join(tmpdir(), 'pc-ws-mount-'))
  try {
    const ctx = fakeCtx([])
    applyMcpWorkspaceScope(ctx)
    await new Promise((resolve) => setTimeout(resolve, 20))
    assert.equal(ctx.mounted.length, 0)
    const status = workspaceMcpMountStatus()
    assert.equal(status.state, 'pending')
    assert.equal(status.reason, 'no-session')
    assert.deepEqual(status.agents, [])
  } finally {
    rmSync(box, { recursive: true, force: true })
  }
})

test('工作区 MCP：.mcp.json 非法条目被跳过，坏 JSON 返回空', async () => {
  const box = mkdtempSync(join(tmpdir(), 'pc-ws-mount-'))
  const workspace = join(box, 'ws')
  mkdirSync(workspace, { recursive: true })
  try {
    writeFileSync(join(workspace, '.mcp.json'), JSON.stringify({
      mcpServers: {
        'bad name!': { command: 'node' },
        broken: { note: 'no command or url' },
      },
    }), 'utf8')
    const rows = await readWorkspaceRows(workspace)
    assert.equal(rows.length, 1)
    assert.equal(rows[0].serverName, 'bad_name', '非法字符归一为合法 serverName')
    writeFileSync(join(workspace, '.mcp.json'), '{ not json', 'utf8')
    assert.deepEqual(await readWorkspaceRows(workspace), [])
  } finally {
    rmSync(box, { recursive: true, force: true })
  }
})

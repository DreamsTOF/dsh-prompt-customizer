/**
 * 工作区 MCP：落盘走主流 agent 通用的 `.mcp.json`，读取时转成内部行。
 *
 * 覆盖：首次新建 / 后续合并（保留已有键与其它顶层字段）/ 同名不覆盖 /
 * 坏 JSON 不覆盖 / 读回时带上工作区哈希后缀且保留 command·args·env·url。
 *
 * Usage: node --test test/workspace-mcp-json.test.mjs
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

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

function fakeCtx() {
  const ctx = {
    routes: [],
    webServer: { register(route) { ctx.routes.push(route); return () => {} } },
    effect(run) { const d = run(); return typeof d === 'function' ? d : () => {} },
    on() { return () => {} },
    logger: { info() {}, warn() {} },
  }
  return ctx
}

function call(route, method, url, body) {
  return new Promise((resolve, reject) => {
    const req = {
      method, url,
      socket: { remoteAddress: '127.0.0.1' },
      headers: { host: '127.0.0.1:3099' },
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

test('工作区 MCP：首次新建 .mcp.json，后续合并且同名不覆盖', async () => {
  const box = mkdtempSync(join(tmpdir(), 'pc-ws-mcpjson-'))
  const workspace = join(box, 'ws')
  mkdirSync(workspace, { recursive: true })
  try {
    await withEnv({ DSH_AGENTS_HOME: join(box, 'agents'), DSH_HOME: join(box, 'dsh') }, async () => {
      const { applyMcpStatus } = await import('../src/mcp-status.ts')
      const ctx = fakeCtx()
      applyMcpStatus(ctx)
      const route = ctx.routes.find((item) => item.path === '/api/triad/mcp-config')
      assert.ok(route !== undefined, 'MCP 配置路由已挂载')
      const target = join(workspace, '.mcp.json')

      // 1. 首次：新建
      const first = await call(route, 'POST', '/api/triad/mcp-config', {
        action: 'add',
        format: 'json',
        text: JSON.stringify({ mcpServers: { alpha: { command: 'npx', args: ['-y', 'alpha'] } } }),
        scope: 'workspace',
        workspace,
      })
      assert.equal(first.status, 200, JSON.stringify(first.body))
      let doc = JSON.parse(readFileSync(target, 'utf8'))
      assert.deepEqual(Object.keys(doc.mcpServers), ['alpha'])
      assert.equal(doc.mcpServers.alpha.command, 'npx')
      assert.deepEqual(doc.mcpServers.alpha.args, ['-y', 'alpha'])
      assert.equal(doc.mcpServers.alpha.serverName, undefined, '不把内部键写进标准格式')
      assert.equal(doc.mcpServers.alpha.transport, undefined, '不写推断出来的 transport（主流 agent 不需要）')

      // 2. 再添加：合并进同一文件，保留 alpha
      const second = await call(route, 'POST', '/api/triad/mcp-config', {
        action: 'add',
        format: 'json',
        text: JSON.stringify({ mcpServers: { beta: { url: 'https://beta.example/mcp' } } }),
        scope: 'workspace',
        workspace,
      })
      assert.equal(second.status, 200, JSON.stringify(second.body))
      doc = JSON.parse(readFileSync(target, 'utf8'))
      assert.deepEqual(Object.keys(doc.mcpServers).sort(), ['alpha', 'beta'], '两次添加落在同一个文件里')

      // 3. 同名不覆盖（用户手写内容优先）
      doc.mcpServers.alpha.args = ['--user-edited']
      doc.otherTopLevel = 'keep-me'
      writeFileSync(target, JSON.stringify(doc, null, 2), 'utf8')
      const third = await call(route, 'POST', '/api/triad/mcp-config', {
        action: 'add',
        format: 'json',
        text: JSON.stringify({ mcpServers: { alpha: { command: 'other' } } }),
        scope: 'workspace',
        workspace,
      })
      assert.equal(third.status, 200)
      doc = JSON.parse(readFileSync(target, 'utf8'))
      assert.deepEqual(doc.mcpServers.alpha.args, ['--user-edited'], '同名不覆盖')
      assert.equal(doc.otherTopLevel, 'keep-me', '保留其它顶层字段')
    })
  } finally {
    rmSync(box, { recursive: true, force: true })
  }
})

test('工作区 MCP：读回时转成内部行（带工作区后缀，保留 command/args/env）', async () => {
  const box = mkdtempSync(join(tmpdir(), 'pc-ws-mcpjson-'))
  const workspace = join(box, 'ws')
  mkdirSync(workspace, { recursive: true })
  try {
    writeFileSync(join(workspace, '.mcp.json'), JSON.stringify({
      mcpServers: {
        anysearch: { url: 'https://api.anysearch.com/mcp', headers: { Authorization: 'Bearer x' } },
        local: { command: 'node', args: ['server.mjs'], env: { A: '1' } },
        broken: { note: 'no command or url' },
      },
    }), 'utf8')
    const { readWorkspaceRows } = await import('../src/mcp-workspace-scope.ts')
    const rows = await readWorkspaceRows(workspace)
    assert.equal(rows.length, 2, '缺 command/url 的条目跳过')
    const byOriginal = Object.fromEntries(rows.map((row) => [row.serverName.replace(/-[0-9a-f]{8}$/, ''), row]))
    assert.ok(byOriginal.anysearch !== undefined, '按原键名可识别')
    assert.match(byOriginal.anysearch.serverName, /^anysearch-[0-9a-f]{8}$/, '带工作区哈希后缀')
    assert.equal(byOriginal.anysearch.config.transport, 'streamable-http')
    assert.equal(byOriginal.anysearch.config.url, 'https://api.anysearch.com/mcp')
    assert.deepEqual(byOriginal.anysearch.config.headers, { Authorization: 'Bearer x' })
    assert.equal(byOriginal.local.config.transport, 'stdio')
    assert.deepEqual(byOriginal.local.config.args, ['server.mjs'])
    assert.deepEqual(byOriginal.local.config.env, { A: '1' })

    // 坏 JSON：返回空而不是抛错（不拖垮整轮挂载）
    writeFileSync(join(workspace, '.mcp.json'), '{ not json', 'utf8')
    assert.deepEqual(await readWorkspaceRows(workspace), [])
  } finally {
    rmSync(box, { recursive: true, force: true })
  }
})

/**
 * 预设隔离：具体预设的 inventory 只能列本预设真实拥有的段/工具，
 * 不能把其它预设独有的段（如某预设专属 `tools:ptc-only`）带进来（串台回归）。
 * Usage: node --test test/preset-isolation.test.mjs
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { apply } from '../vendor/prompt-customizer/index.js'
import { closeAllDbs } from '../vendor/prompt-customizer/db.js'

function harness({ presets, scopeViews }) {
  const routes = {}
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-isolation-'))
  const dataDir = path.join(root, 'data')
  const roster = {
    defaultId: presets[0]?.id ?? 'standard',
    list: async () => presets,
    acquireScope: async (id) => ({ key: id, async [Symbol.asyncDispose]() {} }),
  }
  const ctx = {
    on: () => {}, inject: () => {}, effect: () => {},
    get: (name) => {
      if (name === 'webServer') return { register: (r) => { routes[r.path] = r.handler; return () => {} } }
      if (name === 'agentPresets') return roster
      if (name === 'profileContext') return undefined
      if (name === 'connection') return { requestRejection: () => undefined }
      return undefined
    },
    systemPrompt: {
      assemble: async (hint) => ({
        sections: [], tools: [], variables: {}, contexts: [],
        promptCustomizerBaseView: scopeViews[hint.scope] ?? { sections: [], tools: [] },
      }),
      layers: { merge: () => [] },
    },
  }
  apply(ctx, { dataDir })
  return { routes, dataDir }
}

function get(handler, url) {
  const req = { url, method: 'GET', headers: { host: '127.0.0.1' }, on(ev, cb) { if (ev === 'end') cb() } }
  return new Promise((resolve) => {
    const res = { status: 0, body: null, writeHead(c) { this.status = c }, end(t) { this.body = JSON.parse(t); resolve(res) } }
    void handler(req, res)
  })
}

test('具体预设 inventory 不混入其它预设独有段（串台回归）', async () => {
  const h = harness({
    presets: [{ id: 'standard' }, { id: 'ptc' }],
    scopeViews: {
      standard: { sections: [{ name: 'persona', text: 'general persona' }], tools: [] },
      ptc: {
        sections: [{ name: 'persona', text: 'ptc persona' }, { name: 'tools:ptc-only', text: 'run_code is the only tool' }],
        tools: [],
      },
    },
  })
  try {
    const invRoute = h.routes['/api/prompt-customizer/inventory']
    assert.ok(invRoute, 'inventory 路由已注册')
    // 先浏览 ptc，把其独有段灌进全局目录池
    const ptc = await get(invRoute, '/api/prompt-customizer/inventory?scope=ptc')
    assert.equal(ptc.status, 200, JSON.stringify(ptc.body))
    assert.ok(ptc.body.sections.some((s) => s.name === 'tools:ptc-only'), 'ptc 视图应含 tools:ptc-only')
    // 再请求 standard：其本没有该段，不应因并集池而出现
    const std = await get(invRoute, '/api/prompt-customizer/inventory?scope=standard')
    assert.equal(std.status, 200, JSON.stringify(std.body))
    const names = std.body.sections.map((s) => s.name)
    assert.ok(names.includes('persona'), 'standard 应含自己的 persona')
    assert.ok(!names.includes('tools:ptc-only'), `standard 不应混入 ptc 专属段，实际=${JSON.stringify(names)}`)
    // 注：无 scope 仅内部/测试用（后端保留并集以兜底运行时动态段）；面板始终带具体预设 scope。
  } finally {
    closeAllDbs()
  }
})

/**
 * 工作区级 override：合并语义（工作区优先）+ /config/apply 的 level=workspace 写入。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { apply } from '../vendor/prompt-customizer/index.js'
import { mergeOverrideLayers } from '../vendor/prompt-customizer/effective.js'

test('mergeOverrideLayers：工作区优先（列表整取代、replace/inject 按名、tools 子字段覆盖）', () => {
  const preset = {
    sections: ['a'],
    replace: { x: '1' },
    inject: [{ name: 'i', order: 1, text: 'p' }, { name: 'only-p', order: 2, text: 'p2' }],
    tools: { exclude: ['t1'], add: ['r1'] },
  }
  const workspace = {
    sections: ['b'],
    replace: { y: '2' },
    inject: [{ name: 'i', order: 1, text: 'w' }],
    tools: { exclude: ['t2'] },
  }
  const merged = mergeOverrideLayers(preset, workspace)
  assert.deepEqual(merged.sections, ['b'], '列表字段：工作区声明则整体取代')
  assert.deepEqual(merged.replace, { x: '1', y: '2' }, 'replace 按名合并')
  assert.deepEqual(merged.inject.map((i) => [i.name, i.text]), [['i', 'w'], ['only-p', 'p2']], 'inject 按名，工作区同名胜、其余保留')
  assert.deepEqual(merged.tools.exclude, ['t2'], 'tools.exclude 子字段覆盖')
  assert.deepEqual(merged.tools.add, ['r1'], 'tools.add 未声明则保留预设')
})

function makeCtx() {
  const routes = {}
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-ws-'))
  const ctx = {
    on: () => {}, inject: () => {}, effect: () => {},
    get: (name) => {
      if (name === 'webServer') return { register: (r) => { routes[r.path] = r.handler; return () => {} } }
      if (name === 'connection') return { requestRejection: () => undefined }
      return undefined
    },
  }
  apply(ctx, { dataDir })
  return { routes, dataDir }
}

function call(handler, url, body) {
  const chunks = body === undefined ? [] : [Buffer.from(JSON.stringify(body))]
  const req = { url, method: 'POST', headers: { host: '127.0.0.1' }, on(ev, cb) { if (ev === 'data') chunks.forEach(cb); if (ev === 'end') cb() } }
  return new Promise((resolve) => {
    const res = { status: 0, body: null, writeHead(c) { this.status = c }, end(t) { this.body = JSON.parse(t); resolve(res) } }
    void handler(req, res)
  })
}

test('/config/apply level=workspace 写入 workspaceOverrides[cwd]，不写预设 overrides', async () => {
  const { routes } = makeCtx()
  const cwd = path.resolve('/ws/demo')
  const res = await call(routes['/api/prompt-customizer/config/apply'], '/api/prompt-customizer/config/apply',
    { level: 'workspace', workspace: cwd, patch: { sections: ['b'], tools: { exclude: ['t2'] } } })
  assert.equal(res.status, 200, JSON.stringify(res.body))
  assert.equal(res.body.ok, true)
  assert.deepEqual(res.body.workspaceOverrides[cwd].sections, ['b'])
  assert.deepEqual(res.body.workspaceOverrides[cwd].tools.exclude, ['t2'])
  assert.deepEqual(res.body.config.overrides, {}, '不应写进预设级 overrides')
  // 读回一致
  const read = await new Promise((resolve) => {
    const r = { status: 0, body: null, writeHead(c) { this.status = c }, end(t) { this.body = JSON.parse(t); resolve(r) } }
    void routes['/api/prompt-customizer/config']({ url: '/api/prompt-customizer/config', method: 'GET', headers: {}, on(ev, cb) { if (ev === 'end') cb() } }, r)
  })
  assert.deepEqual(read.body.workspaceOverrides[cwd].sections, ['b'])
  assert.deepEqual(read.body.workspaceOverrides[cwd].tools.exclude, ['t2'])
})

/**
 * 工作区级 override：合并语义（工作区是预设候选超集）+ /config/apply level=workspace 写入。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { apply } from '../vendor/prompt-customizer/index.js'
import { mergeOverrideLayers } from '../vendor/prompt-customizer/effective.js'

const G = { kind: 'global' }
const P = { kind: 'preset', id: 'p1' }
const ref = (name, source) => (source === undefined ? { name } : { name, source })

test('mergeOverrideLayers：按阶段并集、工作区可加不可减；replacements/inject 追加；tools 并集', () => {
  const preset = {
    sections: [ref('a', G)],
    sectionsBootstrap: [ref('boot', P)],
    replacements: [{ name: 'x', source: G, phase: 'always', text: '1' }],
    inject: [{ name: 'i', order: 1, text: 'p' }],
    tools: { exclude: [ref('t1', G)], add: [ref('r1', G)] },
  }
  const workspace = {
    sections: [ref('b', P), ref('a', G)],
    sectionsBootstrap: [ref('boot2', P)],
    replacements: [{ name: 'y', source: P, phase: 'active', text: '2' }],
    inject: [{ name: 'j', order: 0, text: 'w' }],
    tools: { exclude: [ref('t2', P)] },
  }
  const merged = mergeOverrideLayers(preset, workspace)
  assert.deepEqual(merged.sections, [ref('a', G), ref('b', P)], '工作区追加，不删除预设条目')
  assert.deepEqual(merged.sectionsBootstrap, [ref('boot', P), ref('boot2', P)])
  assert.deepEqual(merged.replacements, [...preset.replacements, ...workspace.replacements])
  assert.deepEqual(merged.inject, [...preset.inject, ...workspace.inject])
  assert.deepEqual(merged.tools.exclude, [ref('t1', G), ref('t2', P)], 'tools.exclude 并集')
  assert.deepEqual(merged.tools.add, [ref('r1', G)], '工作区未声明的 tools.add 保留预设')
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
    {
      level: 'workspace',
      workspace: cwd,
      patch: {
        sections: [ref('b', P)],
        tools: { exclude: [ref('t2', G)] },
        replacements: [{ name: 'b', source: P, phase: 'always', text: 'B2' }],
      },
    })
  assert.equal(res.status, 200, JSON.stringify(res.body))
  assert.equal(res.body.ok, true)
  assert.deepEqual(res.body.workspaceOverrides[cwd].sections, [ref('b', P)])
  assert.deepEqual(res.body.workspaceOverrides[cwd].tools.exclude, [ref('t2', G)])
  assert.deepEqual(res.body.workspaceOverrides[cwd].replacements, [{ name: 'b', source: P, phase: 'always', text: 'B2' }])
  assert.deepEqual(res.body.config.overrides, {}, '不应写进预设级 overrides')
  // 读回一致
  const read = await new Promise((resolve) => {
    const r = { status: 0, body: null, writeHead(c) { this.status = c }, end(t) { this.body = JSON.parse(t); resolve(r) } }
    void routes['/api/prompt-customizer/config']({ url: '/api/prompt-customizer/config', method: 'GET', headers: {}, on(ev, cb) { if (ev === 'end') cb() } }, r)
  })
  assert.deepEqual(read.body.workspaceOverrides[cwd].sections, [ref('b', P)])
  assert.deepEqual(read.body.workspaceOverrides[cwd].tools.exclude, [ref('t2', G)])
})

test('/config/apply 拒绝 inject / replacements 里的未知 phase', async () => {
  const { routes } = makeCtx()
  const res = await call(routes['/api/prompt-customizer/config/apply'], '/api/prompt-customizer/config/apply', {
    target: 'whoami',
    patch: { replacements: [{ name: 'a', phase: 'bogus', text: 'X' }] },
  })
  assert.equal(res.status, 400)
  assert.match(res.body.error, /unknown phase/)
})

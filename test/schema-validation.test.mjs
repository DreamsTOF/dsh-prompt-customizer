import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { apply } from '../vendor/prompt-customizer/index.js'
import { getDoc, openDb, setDoc } from '../vendor/prompt-customizer/db.js'

function harness() {
  const routes = {}
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-schema-'))
  const ctx = {
    on: () => {},
    inject: () => {},
    effect: () => {},
    get: (name) => name === 'webServer'
      ? { register: (route) => { routes[route.path] = route.handler; return () => {} } }
      : name === 'connection'
        ? { requestRejection: () => undefined }
        : undefined,
  }
  apply(ctx, { dataDir })
  return { routes, dataDir, db: openDb(path.join(dataDir, 'prompt-customizer.db')) }
}

function call(handler, body) {
  const chunks = body === undefined ? [] : [Buffer.from(JSON.stringify(body))]
  const req = { on(event, callback) { if (event === 'data') chunks.forEach(callback); if (event === 'end') callback() } }
  return new Promise((resolve) => {
    const res = { status: 0, body: null, writeHead(code) { this.status = code }, end(text) { this.body = JSON.parse(text); resolve(res) } }
    void handler(req, res)
  })
}

test('import 拒绝非法 customization，不落盘', async () => {
  const { routes, db } = harness()
  const res = await call(routes['/api/prompt-customizer/import'], {
    target: 'standard',
    customization: { sections: 'bad' },
  })
  assert.equal(res.status, 400)
  assert.equal(res.body.ok, false)
  assert.equal(getDoc(db, 'config'), undefined)
})

test('restore 拒绝非法 config docs，不替换现有数据', async () => {
  const { routes, db } = harness()
  setDoc(db, 'config', { forceSections: true })
  const res = await call(routes['/api/prompt-customizer/restore'], {
    docs: { config: { overrides: { standard: { sections: 'bad' } } } },
  })
  assert.equal(res.status, 400)
  assert.equal(res.body.ok, false)
  assert.deepEqual(getDoc(db, 'config'), { forceSections: true })
})

test('config/set 拒绝非法字段值，不落盘', async () => {
  const { routes, db } = harness()
  const res = await call(routes['/api/prompt-customizer/config/set'], {
    field: 'overrides',
    value: { standard: { sections: 'bad' } },
  })
  assert.equal(res.status, 400)
  assert.equal(res.body.ok, false)
  assert.equal(getDoc(db, 'config'), undefined)
})

test('config/batch 一次写入多个全局字段', async () => {
  const { routes, db } = harness()
  const res = await call(routes['/api/prompt-customizer/config/batch'], {
    fields: { envBlocklist: ['SECRET'], presets: [] },
  })
  assert.equal(res.status, 200)
  assert.deepEqual(getDoc(db, 'config'), { envBlocklist: ['SECRET'], presets: [] })
})

test('config/batch 校验失败时两个字段都不落盘', async () => {
  const { routes, db } = harness()
  const res = await call(routes['/api/prompt-customizer/config/batch'], {
    fields: {
      envBlocklist: ['SECRET'],
      presets: [{ id: 'bad', name: 'Bad', data: { sections: 'bad' } }],
    },
  })
  assert.equal(res.status, 400)
  assert.equal(getDoc(db, 'config'), undefined)
})

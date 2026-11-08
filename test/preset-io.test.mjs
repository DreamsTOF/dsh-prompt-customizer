/**
 * 单预设定制导入 / 空 overrides 清理：不涉及宿主 preset 定义。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { apply } from '../vendor/prompt-customizer/index.js'
import { getDoc, openDb, setDoc } from '../vendor/prompt-customizer/db.js'

function makeCtx() {
  const routes = {}
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-preset-io-'))
  const ctx = {
    on: () => {},
    inject: () => {},
    get: (name) => {
      if (name === 'webServer') return { register: (r) => { routes[r.path] = r.handler; return () => {} } }
      if (name === 'connection') return { requestRejection: () => undefined }
      return undefined
    },
    effect: () => {},
  }
  return { ctx, routes, dataDir }
}

async function call(handler, body) {
  const chunks = body === undefined ? [] : [Buffer.from(JSON.stringify(body))]
  const req = { on(ev, cb) { if (ev === 'data') chunks.forEach(cb); if (ev === 'end') cb() } }
  return new Promise((resolve) => {
    const res = {
      status: 0,
      body: null,
      writeHead(code) { this.status = code },
      end(text) { this.body = JSON.parse(text); resolve(res) },
    }
    void handler(req, res)
  })
}

test('import 只写当前 preset 的 overrides，不碰宿主 preset 定义', async () => {
  const { ctx, routes, dataDir } = makeCtx()
  apply(ctx, { dataDir })
  const res = await call(routes['/api/prompt-customizer/import'], {
    target: 'standard',
    customization: { sections: [{ name: 'a', source: { kind: 'global' } }] },
  })
  assert.equal(res.status, 200)
  assert.equal(res.body.ok, true)
  assert.deepEqual(res.body.config.overrides.standard.sections, [{ name: 'a', source: { kind: 'global' } }])
})

test('cleanup 删除空 override，保留有内容的 override', async () => {
  const { ctx, routes, dataDir } = makeCtx()
  apply(ctx, { dataDir })
  const db = openDb(path.join(dataDir, 'prompt-customizer.db'))
  setDoc(db, 'config', {
    overrides: {
      empty: { sections: [], replacements: [], inject: [], tools: { exclude: [], add: [] } },
      keep: { sections: [{ name: 'a', source: { kind: 'global' } }] },
    },
  })
  const res = await call(routes['/api/prompt-customizer/overrides/cleanup'])
  assert.equal(res.status, 200)
  assert.deepEqual(res.body.removed, ['empty'])
  assert.equal(getDoc(db, 'config').overrides.empty, undefined)
  assert.ok(getDoc(db, 'config').overrides.keep)
})

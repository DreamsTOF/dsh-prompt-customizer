/**
 * /api/prompt-customizer/backup 与 /restore：整库 docs 导出 / 恢复。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { apply } from '../vendor/prompt-customizer/index.js'
import { openDb, getDoc, setDoc } from '../vendor/prompt-customizer/db.js'

function makeCtx() {
  const routes = {}
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-backup-'))
  const ctx = {
    on: () => {}, inject: () => {}, effect: () => {},
    get: (name) => {
      if (name === 'webServer') return { register: (r) => { routes[r.path] = r.handler; return () => {} } }
      if (name === 'connection') return { requestRejection: () => undefined }
      return undefined
    },
  }
  apply(ctx, { dataDir })
  return { routes, dataDir, db: openDb(path.join(dataDir, 'prompt-customizer.db')) }
}

function call(handler, method, url, body) {
  const chunks = body === undefined ? [] : [Buffer.from(JSON.stringify(body))]
  const req = { url, method, headers: { host: '127.0.0.1' }, on(ev, cb) { if (ev === 'data') chunks.forEach(cb); if (ev === 'end') cb() } }
  return new Promise((resolve) => {
    const res = { status: 0, body: null, writeHead(c) { this.status = c }, end(t) { this.body = JSON.parse(t); resolve(res) } }
    void handler(req, res)
  })
}

test('整库备份导出全部 docs，恢复能整体还原', async () => {
  const { routes, db } = makeCtx()
  setDoc(db, 'config', { forceSections: true, overrides: { standard: { sections: ['x'] } } })
  setDoc(db, 'workspace-overrides', { '/ws': { sections: ['y'] } })

  const backup = await call(routes['/api/prompt-customizer/backup'], 'GET', '/api/prompt-customizer/backup')
  assert.equal(backup.status, 200, JSON.stringify(backup.body))
  assert.equal(backup.body.ok, true)
  assert.equal(backup.body.format, 'dsh-prompt-customizer/backup@1')
  assert.deepEqual(backup.body.docs.config.overrides.standard.sections, ['x'])
  assert.equal(backup.body.docs['workspace-overrides'], undefined, '工作区级已下线，休眠数据不进入备份')

  // 破坏当前数据后恢复
  setDoc(db, 'config', { forceSections: false, overrides: {} })

  const restored = await call(routes['/api/prompt-customizer/restore'], 'POST', '/api/prompt-customizer/restore', backup.body)
  assert.equal(restored.status, 200, JSON.stringify(restored.body))
  assert.equal(restored.body.ok, true)
  assert.equal(getDoc(db, 'config').forceSections, true)
  assert.deepEqual(getDoc(db, 'workspace-overrides')['/ws'].sections, ['y'])
})

test('恢复缺少 docs 时报 400', async () => {
  const { routes } = makeCtx()
  const res = await call(routes['/api/prompt-customizer/restore'], 'POST', '/api/prompt-customizer/restore', { catalog: {} })
  assert.equal(res.status, 400)
  assert.equal(res.body.ok, false)
})

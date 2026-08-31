/**
 * /api/prompt-customizer/config/reset 恢复初始状态路由：
 * 清空全部定制并把 forceSections 设为 false（与不装插件等效），文件保留。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { apply } from '../lib/index.js'

/** Minimal Cordis ctx：只提供 webServer mock，其余服务缺席（可选获取）。 */
function makeCtx() {
  const routes = {}
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-reset-'))
  const ctx = {
    on: () => {},
    get: (name) => name === 'webServer'
      ? { register: (r) => { routes[r.path] = r.handler; return () => {} } }
      : undefined,
    effect: () => {},
  }
  return { ctx, routes, dataDir }
}

async function call(handler, body) {
  const chunks = body === undefined ? [] : [Buffer.from(JSON.stringify(body))]
  const req = {
    on(ev, cb) {
      if (ev === 'data') chunks.forEach(cb)
      if (ev === 'end') cb()
    },
  }
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

const RESET = '/api/prompt-customizer/config/reset'

test('reset 清空全部定制并关闭 forceSections', async () => {
  const { ctx, routes, dataDir } = makeCtx()
  const configFile = path.join(dataDir, 'config.yaml')
  fs.mkdirSync(dataDir, { recursive: true })
  fs.writeFileSync(configFile,
    'forceSections: true\n' +
    'sections: [a]\n' +
    'replace: { b: B }\n' +
    'overrides:\n  liangshen:\n    sections: [c]\n')
  apply(ctx, { dataDir })

  const res = await call(routes[RESET])
  assert.equal(res.status, 200)
  assert.equal(res.body.ok, true)
  // 只剩 forceSections: false —— 其余全部清空
  assert.deepEqual(res.body.config.sections, [])
  assert.deepEqual(res.body.config.replace, {})
  assert.deepEqual(res.body.config.overrides, {})
  assert.equal(res.body.config.forceSections, false)
  // 磁盘上的文件也确实是这份最小状态（不依赖内存缓存）
  const onDisk = fs.readFileSync(configFile, 'utf8')
  assert.match(onDisk, /forceSections: false/)
  assert.ok(!onDisk.includes('sections: [a]'))
})

test('reset 在无既有文件时也正常（回到初始态）', async () => {
  const { ctx, routes, dataDir } = makeCtx()
  apply(ctx, { dataDir })
  const res = await call(routes[RESET])
  assert.equal(res.status, 200)
  assert.equal(res.body.ok, true)
  assert.equal(res.body.config.forceSections, false)
})

test('reset 后可用 /config/set 重新开启 forceSections（开关闭环）', async () => {
  const { ctx, routes, dataDir } = makeCtx()
  apply(ctx, { dataDir })
  await call(routes[RESET])
  const set = await call(routes['/api/prompt-customizer/config/set'], { field: 'forceSections', value: true })
  assert.equal(set.status, 200)
  assert.equal(set.body.ok, true)
  assert.equal(set.body.config.forceSections, true)
  // 重新开启不复活已清空的定制字段
  assert.deepEqual(set.body.config.sections, [])
  assert.deepEqual(set.body.config.overrides, {})
})

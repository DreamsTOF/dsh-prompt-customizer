/**
 * 连接信任闸测试：自建 webServer 路由必须先问 connection.requestRejection
 * （宿主 0.1.2-alpha.1 起：Host/Origin 围栏 + 浏览器 Cookie 认证）；被拒请求
 * 绝不触达业务处理器。闸本身不可用（connection 服务缺席）时 fail-closed：
 * 本插件的路由会写盘，「没有认证面」不等于「无需认证」。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { apply } from '../lib/index.js'

const APPLY = '/api/prompt-customizer/config/apply'

/** 最小 Cordis ctx：webServer mock + 可配置的 connection 信任判定。 */
function makeCtx(rejection) {
  const routes = {}
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-trust-'))
  const ctx = {
    on: () => {},
    inject: () => {},
    get: (name) => {
      if (name === 'webServer') return { register: (r) => { routes[r.path] = r.handler; return () => {} } }
      if (name === 'connection') {
        return rejection === undefined ? undefined : { requestRejection: () => rejection }
      }
      return undefined
    },
    effect: () => {},
  }
  return { ctx, routes, dataDir }
}

/** 事件式 req/res 的最小 mock；信任闸回纯文本或 JSON，因此 end 不强制解析。 */
async function call(handler, body) {
  const chunks = body === undefined ? [] : [Buffer.from(JSON.stringify(body))]
  const req = {
    headers: {},
    on(ev, cb) {
      if (ev === 'data') chunks.forEach(cb)
      if (ev === 'end') cb()
    },
  }
  return new Promise((resolve) => {
    const res = {
      status: 0,
      text: null,
      writeHead(code) { this.status = code },
      end(text) { this.text = text ?? null; resolve(res) },
    }
    void handler(req, res)
  })
}

test('403 fence rejection never reaches the handler', async () => {
  const { ctx, routes, dataDir } = makeCtx(403)
  apply(ctx, { dataDir })
  const res = await call(routes[APPLY], { patch: { sections: ['a'] } })
  assert.equal(res.status, 403)
  assert.equal(res.text, 'forbidden')
  assert.equal(fs.existsSync(path.join(dataDir, 'config.yaml')), false, '被拒请求不得写盘')
})

test('401 unauthenticated rejection never reaches the handler', async () => {
  const { ctx, routes, dataDir } = makeCtx(401)
  apply(ctx, { dataDir })
  const res = await call(routes[APPLY], { patch: { sections: ['a'] } })
  assert.equal(res.status, 401)
  assert.equal(res.text, 'unauthorized')
  assert.equal(fs.existsSync(path.join(dataDir, 'config.yaml')), false, '被拒请求不得写盘')
})

test('a composition without the connection service refuses to serve (fail-closed)', async () => {
  const { ctx, routes, dataDir } = makeCtx(undefined)
  apply(ctx, { dataDir })
  const res = await call(routes[APPLY], { patch: { sections: ['a'] } })
  assert.equal(res.status, 503)
  assert.match(JSON.parse(res.text).error, /connection service unavailable/)
  assert.equal(fs.existsSync(path.join(dataDir, 'config.yaml')), false, '闸不可用时不得写盘')
})
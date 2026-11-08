/** 共享路由信任闸：优先 Connection.requestRejection，缺席时回环 + Host 白名单。 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { requireTrustedRequest } from '../src/trust.ts'

test('trust：优先使用 ctx.connection.requestRejection', () => {
  const ctx = {
    get(name) {
      if (name !== 'connection') return undefined
      return { requestRejection: ({ headers }) => headers['x-test'] === 'bad' ? 401 : undefined }
    },
  }
  assert.deepEqual(requireTrustedRequest(ctx, { headers: { host: 'evil.example' } }), { ok: true })
  assert.deepEqual(requireTrustedRequest(ctx, { headers: { host: 'evil.example', 'x-test': 'bad' } }),
    { ok: false, status: 401, error: 'unauthorized' })
})

test('trust：Connection 缺席时回环地址 + Host 白名单兜底', () => {
  const ctx = {}
  assert.deepEqual(requireTrustedRequest(ctx, {
    socket: { remoteAddress: '127.0.0.1' },
    headers: { host: '127.0.0.1:3099' },
  }), { ok: true })
  assert.deepEqual(requireTrustedRequest(ctx, {
    socket: { remoteAddress: '10.0.0.8' },
    headers: { host: '127.0.0.1:3099' },
  }), { ok: false, status: 403, error: 'loopback-only' })
  assert.deepEqual(requireTrustedRequest(ctx, {
    socket: { remoteAddress: '127.0.0.1' },
    headers: { host: 'evil.example' },
  }), { ok: false, status: 403, error: 'loopback-only' })
})

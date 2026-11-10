/**
 * mcp-global-store：插件 SQLite 账本的校验与增删改。
 *
 * Usage: node --test test/mcp-global-store.test.mjs
 */

import { after, test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  findStoredGlobalMcpServer,
  globalMcpStoreKey,
  MAX_GLOBAL_MCP_SERVERS,
  normalizeGlobalMcpStore,
  readGlobalMcpStore,
  removeStoredGlobalMcpServer,
  replaceStoredGlobalMcpServerConfig,
  setStoredGlobalMcpServerDisabled,
  upsertStoredGlobalMcpServer,
  writeGlobalMcpStore,
} from '../src/mcp-global-store.ts'
import { closeAllDbs } from '../vendor/prompt-customizer/db.js'

const originalDshHome = process.env.DSH_HOME
const testHome = mkdtempSync(join(tmpdir(), 'pc-mcp-global-store-'))
process.env.DSH_HOME = testHome
after(() => {
  if (originalDshHome === undefined) delete process.env.DSH_HOME
  else process.env.DSH_HOME = originalDshHome
  closeAllDbs()
  rmSync(testHome, { recursive: true, force: true })
})

test('normalize：丢弃非法 id / serverName / 重复 serverName，并按 profile 分键', () => {
  const store = normalizeGlobalMcpStore({
    version: 99,
    servers: [
      { id: 'mcp-good', config: { serverName: 'good', command: 'npx' }, disabled: true },
      { id: 'bad id', config: { serverName: 'bad-id', command: 'npx' }, disabled: false },
      { id: 'mcp-bad-name', config: { serverName: 'bad name', command: 'npx' }, disabled: false },
      { id: 'mcp-duplicate', config: { serverName: 'good', command: 'other' }, disabled: false },
      { id: 'mcp-no-config' },
    ],
  })
  assert.deepEqual(store.servers, [
    { id: 'mcp-good', config: { serverName: 'good', command: 'npx' }, disabled: true },
  ])
  assert.notEqual(globalMcpStoreKey('web'), globalMcpStoreKey('desktop'))
  upsertStoredGlobalMcpServer('isolation-a', { id: 'mcp-a', config: { serverName: 'a' }, disabled: false })
  upsertStoredGlobalMcpServer('isolation-b', { id: 'mcp-b', config: { serverName: 'b' }, disabled: false })
  assert.deepEqual(readGlobalMcpStore('isolation-a').servers.map((row) => row.config.serverName), ['a'])
  assert.deepEqual(readGlobalMcpStore('isolation-b').servers.map((row) => row.config.serverName), ['b'])
})

test('CRUD：upsert / find / toggle / replace / remove 全走 SQLite', () => {
  const profile = 'unit-test'
  const base = readGlobalMcpStore(profile)
  assert.deepEqual(base.servers, [])

  upsertStoredGlobalMcpServer(profile, {
    id: 'mcp-one',
    config: { serverName: 'one', transport: 'stdio', command: 'npx', args: ['-y', 'one'] },
    disabled: false,
  })
  assert.equal(findStoredGlobalMcpServer(profile, 'one').config.command, 'npx')

  setStoredGlobalMcpServerDisabled(profile, 'one', true)
  assert.equal(findStoredGlobalMcpServer(profile, 'one').disabled, true)

  replaceStoredGlobalMcpServerConfig(profile, 'one', {
    serverName: 'one', transport: 'streamable-http', url: 'https://example.test/mcp',
  })
  assert.equal(findStoredGlobalMcpServer(profile, 'one').config.transport, 'streamable-http')

  removeStoredGlobalMcpServer(profile, 'one')
  assert.equal(findStoredGlobalMcpServer(profile, 'one'), undefined)
})

test('上限：第 201 条写入抛错，不静默丢行', () => {
  const profile = 'limit-test'
  const servers = Array.from({ length: MAX_GLOBAL_MCP_SERVERS }, (_, index) => ({
    id: `mcp-s${String(index)}`,
    config: { serverName: `s${String(index)}` },
    disabled: false,
  }))
  writeGlobalMcpStore(profile, { version: 1, servers })
  assert.throws(() => upsertStoredGlobalMcpServer(profile, {
    id: 'mcp-overflow',
    config: { serverName: 'overflow' },
    disabled: false,
  }), /exceeds|full/i)
})

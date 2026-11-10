/**
 * mcp-global-store：全局 MCP 的 `.dsh/mcps` 磁盘账本。
 *
 * Usage: node --test test/mcp-global-store.test.mjs
 */

import { after, test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  findStoredGlobalMcpServer,
  globalMcpServerFile,
  globalMcpStoreKey,
  globalMcpsRoot,
  MAX_GLOBAL_MCP_SERVERS,
  normalizeGlobalMcpStore,
  readGlobalMcpStore,
  removeStoredGlobalMcpServer,
  replaceStoredGlobalMcpServerConfig,
  setStoredGlobalMcpServerDisabled,
  upsertStoredGlobalMcpServer,
  writeGlobalMcpStore,
} from '../src/mcp-global-store.ts'
import { closeAllDbs, readPluginDoc, writePluginDoc } from '../vendor/prompt-customizer/db.js'

const originalDshHome = process.env.DSH_HOME
const testHome = mkdtempSync(join(tmpdir(), 'pc-mcp-global-store-'))
process.env.DSH_HOME = testHome
after(() => {
  if (originalDshHome === undefined) delete process.env.DSH_HOME
  else process.env.DSH_HOME = originalDshHome
  closeAllDbs()
  rmSync(testHome, { recursive: true, force: true })
})

function clearMcps() {
  rmSync(globalMcpsRoot(), { recursive: true, force: true })
}

test('normalize：丢弃非法 id / serverName / 重复 serverName', () => {
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
})

test('CRUD：upsert / find / toggle / replace / remove 都落 .dsh/mcps', () => {
  clearMcps()
  const profile = 'unit-test'
  assert.deepEqual(readGlobalMcpStore(profile).servers, [])

  upsertStoredGlobalMcpServer(profile, {
    id: 'mcp-one',
    config: { serverName: 'one', transport: 'stdio', command: 'npx', args: ['-y', 'one'] },
    disabled: false,
  })
  const file = globalMcpServerFile('one')
  assert.equal(existsSync(file), true)
  const document = JSON.parse(readFileSync(file, 'utf8'))
  assert.deepEqual(document.mcpServers.one, { type: 'stdio', command: 'npx', args: ['-y', 'one'] })
  assert.equal(findStoredGlobalMcpServer(profile, 'one').config.command, 'npx')

  setStoredGlobalMcpServerDisabled(profile, 'one', true)
  assert.equal(findStoredGlobalMcpServer(profile, 'one').disabled, true)
  assert.deepEqual(JSON.parse(readFileSync(join(globalMcpsRoot(), '.dsh-prompt-customizer.json'), 'utf8')).disabled, ['one'])

  replaceStoredGlobalMcpServerConfig(profile, 'one', {
    serverName: 'one', transport: 'streamable-http', url: 'https://example.test/mcp',
  })
  assert.equal(findStoredGlobalMcpServer(profile, 'one').config.transport, 'streamable-http')
  assert.equal(JSON.parse(readFileSync(file, 'utf8')).mcpServers.one.type, 'streamable-http')

  removeStoredGlobalMcpServer(profile, 'one')
  assert.equal(findStoredGlobalMcpServer(profile, 'one'), undefined)
  assert.equal(existsSync(file), false)
})

test('磁盘格式：${VAR} 不写进 JSON 的 __js 标记，读回仍是原文本', () => {
  clearMcps()
  upsertStoredGlobalMcpServer('env-test', {
    id: 'mcp-env',
    config: { serverName: 'env', transport: 'stdio', command: 'npx', env: { TOKEN: { __js: '`${process.env.TOKEN}`' } } },
    disabled: false,
  })
  const document = JSON.parse(readFileSync(globalMcpServerFile('env'), 'utf8'))
  assert.equal(document.mcpServers.env.env.TOKEN, '${TOKEN}')
  assert.deepEqual(readGlobalMcpStore('env-test').servers[0].config.env.TOKEN, '${TOKEN}')
})

test('兼容旧 mcps/**/mcp.json：可读但只读', () => {
  clearMcps()
  mkdirSync(globalMcpsRoot(), { recursive: true })
  writeFileSync(join(globalMcpsRoot(), 'mcp.json'), JSON.stringify({
    mcpServers: { legacy: { command: 'npx', args: ['-y', 'legacy'] } },
  }, null, 2))
  const row = findStoredGlobalMcpServer('legacy-profile', 'legacy')
  assert.equal(row.config.command, 'npx')
  assert.equal(row.owned, false)
  assert.throws(() => setStoredGlobalMcpServerDisabled('legacy-profile', 'legacy', true), /read-only/i)
  assert.throws(() => removeStoredGlobalMcpServer('legacy-profile', 'legacy'), /read-only/i)
})

test('迁移旧 SQLite 全局账本到 .dsh/mcps 并删除旧 doc', () => {
  clearMcps()
  const profile = 'migrate-test'
  writePluginDoc(globalMcpStoreKey(profile), {
    version: 1,
    servers: [{
      id: 'mcp-migrated',
      config: { serverName: 'migrated', transport: 'stdio', command: 'npx', args: ['-y', 'migrated'] },
      disabled: true,
    }],
  })
  const store = readGlobalMcpStore(profile)
  assert.deepEqual(store.servers.map((row) => row.config.serverName), ['migrated'])
  assert.equal(store.servers[0].disabled, true)
  assert.equal(existsSync(globalMcpServerFile('migrated')), true)
  assert.equal(readPluginDoc(globalMcpStoreKey(profile)), undefined)
})

test('上限：第 201 条写入抛错，不静默丢行', () => {
  clearMcps()
  const servers = Array.from({ length: MAX_GLOBAL_MCP_SERVERS }, (_, index) => ({
    id: `mcp-s${String(index)}`,
    config: { serverName: `s${String(index)}`, transport: 'stdio', command: 'npx' },
    disabled: false,
  }))
  writeGlobalMcpStore('limit-test', { version: 1, servers })
  assert.throws(() => upsertStoredGlobalMcpServer('limit-test', {
    id: 'mcp-overflow',
    config: { serverName: 'overflow', transport: 'stdio', command: 'npx' },
    disabled: false,
  }), /exceeds|full/i)
})

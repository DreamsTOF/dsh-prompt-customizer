/**
 * /api/prompt-customizer/export（导出当前编辑目标的配置）路由测试。
 *
 * 该路由取代了原「存为预设」：宿主 agentPresets 没有 authoring API，伪造一个
 * 预设要猜 Loader 命名空间、处理重复行 id、把来源组成拍成不再跟随升级的快照。
 * 导出的契约简单得多，也就必须真的只读：**任何情况下都不写 profile patch、
 * 不写 config.yaml**。
 *
 * Usage: node --test test/export-route.test.mjs
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = path.resolve(import.meta.dirname, '..')

/** 装一个带真实 config.yaml 的隔离环境，返回路由表和落盘路径。 */
async function harness({ roster, config } = {}) {
  const routes = {}
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-export-'))
  const dataDir = path.join(home, 'prompt-customizer')
  fs.mkdirSync(dataDir, { recursive: true })
  const configFile = path.join(dataDir, 'config.yaml')
  if (config !== undefined) fs.writeFileSync(configFile, config)

  const webServer = { register: (r) => { routes[r.path] = r.handler; return () => {} } }
  const ctx = {
    on: () => {},
    effect: (fn) => { fn?.(); return () => {} },
    inject: (_names, cb) => { cb?.(ctx); return () => {} },
    logger: { info: () => {}, warn: () => {}, debug: () => {} },
    webServer,
    tools: { schemas: () => [], register: () => () => {} },
    sessionProjections: { register: () => () => {} },
    get: (name) => {
      if (name === 'webServer') return webServer
      if (name === 'agentPresets') return roster
      if (name === 'connection') return { requestRejection: () => undefined }
      if (name === 'settings') return { documentPath: path.join(home, 'settings.yaml') }
      return undefined
    },
    systemPrompt: {
      assemble: async () => ({ sections: [], tools: [], contexts: [], layers: { merge: () => new Map() } }),
    },
  }
  const mod = await import(pathToFileURL(path.join(ROOT, 'lib/index.js')).href)
  await mod.apply(ctx, { dataDir })
  return { routes, home, dataDir, configFile }
}

function get(handler, url) {
  const req = { url, method: 'GET', headers: { host: '127.0.0.1' }, on(ev, cb) { if (ev === 'end') cb() } }
  return new Promise((resolve) => {
    const res = {
      status: 0, body: null,
      writeHead(code) { this.status = code },
      end(text) { this.body = JSON.parse(text); resolve(res) },
    }
    void handler(req, res)
  })
}

const EXPORT = '/api/prompt-customizer/export'

const CFG = [
  'forceSections: true',
  'envBlocklist:',
  '  - SECRET_TOKEN',
  'overrides:',
  '  standard:',
  '    sections:',
  '      - guidelines',
  '    tools:',
  '      exclude:',
  '        - bash',
  '',
].join('\n')

const ROSTER = {
  defaultId: 'standard',
  list: async () => [{ id: 'standard' }, { id: 'minimal' }],
  readDocument: async (id) => ({ agentPreset: id, content: `- id: persona\n  name: '@deepseek-ai/dsh-persona'\n` }),
}

test('导出该目标的定制 + 来源组成 + 全局字段', async () => {
  const { routes } = await harness({ roster: ROSTER, config: CFG })
  const res = await get(routes[EXPORT], `${EXPORT}?scope=standard`)

  assert.equal(res.status, 200, JSON.stringify(res.body))
  assert.equal(res.body.ok, true)
  assert.equal(res.body.format, 'dsh-prompt-customizer/export@1')
  assert.equal(res.body.target, 'standard')
  assert.deepEqual(res.body.customization, { sections: ['guidelines'], tools: { exclude: ['bash'] } })
  assert.equal(res.body.forceSections, true)
  assert.deepEqual(res.body.envBlocklist, ['SECRET_TOKEN'])
  assert.match(res.body.composition, /dsh-persona/)
})

test('不给 scope 时回落到 roster 默认预设', async () => {
  const { routes } = await harness({ roster: { ...ROSTER, defaultId: 'minimal' }, config: CFG })
  const res = await get(routes[EXPORT], EXPORT)
  assert.equal(res.status, 200)
  assert.equal(res.body.target, 'minimal')
  // minimal 没有定制：给空对象而不是报错（UI 据此提示「无定制」）
  assert.deepEqual(res.body.customization, {})
})

test('导出是只读的：profile patch 与 config.yaml 一个字都不改', async () => {
  const { routes, configFile } = await harness({ roster: ROSTER, config: CFG })
  const before = fs.readFileSync(configFile, 'utf8')
  await get(routes[EXPORT], `${EXPORT}?scope=standard`)
  await get(routes[EXPORT], `${EXPORT}?scope=minimal`)
  assert.equal(fs.readFileSync(configFile, 'utf8'), before, 'config.yaml 必须原封不动')
})

test('组成读不到 / 没有 agentPresets 服务时导出仍成功（定制才是主体）', async () => {
  for (const scene of [
    {
      label: '组成读不到时导出仍成功（定制才是主体）',
      roster: {
        defaultId: 'standard',
        list: async () => [{ id: 'standard' }],
        readDocument: async () => { throw Object.assign(new Error('nope'), { code: 'agent-preset/not-found' }) },
      },
    },
    {
      label: '没有 agentPresets 服务时也能导出定制',
      roster: undefined,
    },
  ]) {
    try {
      const { routes } = await harness({ roster: scene.roster, config: CFG })
      const res = await get(routes[EXPORT], `${EXPORT}?scope=standard`)
      assert.equal(res.status, 200)
      assert.equal(res.body.composition, undefined)
      assert.deepEqual(res.body.customization.sections, ['guidelines'])
    } catch (e) {
      if (e instanceof Error) e.message = `[${scene.label}] ${e.message}`
      throw e
    }
  }
})

test('非 GET 被拒（导出不该有副作用路径）', async () => {
  const { routes } = await harness({ roster: ROSTER, config: CFG })
  const req = { url: EXPORT, method: 'POST', headers: { host: '127.0.0.1' }, on(ev, cb) { if (ev === 'end') cb() } }
  const res = await new Promise((resolve) => {
    const r = { status: 0, body: null, writeHead(c) { this.status = c }, end(t) { this.body = JSON.parse(t); resolve(r) } }
    void routes[EXPORT](req, r)
  })
  assert.equal(res.status, 405)
})

test('创建预设路由已彻底移除', async () => {
  const { routes } = await harness({ roster: ROSTER, config: CFG })
  const removed = Object.keys(routes).filter((p) => p === '/api/prompt-customizer/presets')
  assert.deepEqual(removed, [], '不应再注册 /api/prompt-customizer/presets')
})

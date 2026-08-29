/**
 * /api/prompt-customizer/presets（存为 agent 预设）路由测试。
 *
 * 该路由现在只做两件事：调宿主的 authoring API 整体 fork 来源预设，然后把提交
 * 来的配置净化后写进 overrides[新名]。测试用假的 roster 覆盖：fork 参数、来源
 * 回落、错误状态映射、以及「fork 失败时配置里不留空壳」。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { parse } from 'yaml'
import { apply } from '../lib/index.js'

// 宿主 authoring API 的错误类型（按 constructor.name 判定状态码，这里同构复刻）。
class PresetExistsError extends Error {}
class InvalidPresetIdError extends Error {}
class UnknownPresetError extends Error {}

function harness({ roster } = {}) {
  const routes = {}
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-presets-'))
  const ctx = {
    on: () => {},
    get: (name) => {
      if (name === 'webServer') return { register: (r) => { routes[r.path] = r.handler; return () => {} } }
      if (name === 'agentPresets') return roster
      return undefined
    },
    effect: () => {},
  }
  apply(ctx, { dataDir })
  return { routes, dataDir, file: path.join(dataDir, 'config.yaml') }
}

async function call(handler, body, url = '/api/prompt-customizer/presets') {
  const chunks = body === undefined ? [] : [Buffer.from(JSON.stringify(body))]
  const req = {
    url,
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

const CREATE = '/api/prompt-customizer/presets'

test('存为预设 = fork 目标预设 + 把当前配置写进 overrides[新名]', async () => {
  const calls = []
  const roster = {
    authorable: true,
    defaultId: 'standard',
    copy: async (from, id, name) => { calls.push({ from, id, name }) },
  }
  const { routes, file } = harness({ roster })
  const res = await call(routes[CREATE], {
    name: '我的副本',
    from: 'whoami-standard',
    config: { sections: ['a'], sectionsBootstrap: [], replace: { x: 'Y' }, inject: [], tools: { exclude: ['t'] } },
  })
  assert.equal(res.status, 200)
  assert.deepEqual(calls, [{ from: 'whoami-standard', id: '我的副本', name: '我的副本' }])
  assert.equal(res.body.presetId, '我的副本')
  assert.equal(res.body.from, 'whoami-standard')
  // 空列表 / 空对象被净化掉，只留有内容的字段
  assert.deepEqual(parse(fs.readFileSync(file, 'utf8')).overrides['我的副本'], {
    sections: ['a'],
    replace: { x: 'Y' },
    tools: { exclude: ['t'] },
  })
})

test('目标是全局时来源回落到 roster 默认预设', async () => {
  const calls = []
  const roster = { authorable: true, defaultId: 'minimal', copy: async (from, id) => { calls.push({ from, id }) } }
  const { routes } = harness({ roster })
  const res = await call(routes[CREATE], { name: 'copy2', config: {} })
  assert.equal(res.status, 200)
  assert.deepEqual(calls, [{ from: 'minimal', id: 'copy2' }])
})

test('显式 displayName 透传给宿主，缺省用名字本身', async () => {
  const calls = []
  const roster = { authorable: true, defaultId: 'standard', copy: async (from, id, name) => { calls.push(name) } }
  const { routes } = harness({ roster })
  await call(routes[CREATE], { name: 'dir-name', displayName: '  展示名  ', config: {} })
  await call(routes[CREATE], { name: 'dir-name2', displayName: '   ', config: {} })
  assert.deepEqual(calls, ['展示名', 'dir-name2'])
})

test('非法预设名直接 400，且绝不触碰 roster', async () => {
  let copies = 0
  const roster = { authorable: true, defaultId: 'standard', copy: async () => { copies += 1 } }
  const { routes, file } = harness({ roster })
  for (const name of ['/bad', '', '  ', 'a'.repeat(65), '带冒号:名']) {
    const res = await call(routes[CREATE], { name, config: { sections: ['a'] } })
    assert.equal(res.status, 400, `${JSON.stringify(name)} 应被拒`)
    assert.equal(res.body.ok, false)
  }
  assert.equal(copies, 0)
  assert.equal(fs.existsSync(file), false) // 配置一个字都不该写
})

test('同名预设 → 409，且不在 overrides 里留空壳', async () => {
  const roster = {
    authorable: true,
    defaultId: 'standard',
    copy: async () => { throw new PresetExistsError('preset "dup" already exists') },
  }
  const { routes, file } = harness({ roster })
  const res = await call(routes[CREATE], { name: 'dup', config: { sections: ['a'] } })
  assert.equal(res.status, 409)
  assert.match(res.body.error, /already exists/)
  assert.equal(fs.existsSync(file), false)
})

test('来源预设不存在 / id 不合法 → 400', async () => {
  for (const Err of [UnknownPresetError, InvalidPresetIdError]) {
    const roster = { authorable: true, defaultId: 'standard', copy: async () => { throw new Err('nope') } }
    const { routes } = harness({ roster })
    const res = await call(routes[CREATE], { name: 'x', from: 'ghost', config: {} })
    assert.equal(res.status, 400, Err.name)
  }
})

test('宿主没有 roster 服务或不给写 → 明确失败，不退回生成骨架', async () => {
  const noRoster = harness({})
  const a = await call(noRoster.routes[CREATE], { name: 'x', config: {} })
  assert.equal(a.status, 501)
  assert.match(a.body.error, /dsh-agent-presets/)
  assert.equal(fs.existsSync(noRoster.file), false)

  const notAuthorable = harness({ roster: { authorable: false, defaultId: 'standard', copy: async () => {} } })
  const b = await call(notAuthorable.routes[CREATE], { name: 'x', config: {} })
  assert.equal(b.status, 400)
  assert.match(b.body.error, /预设根目录/)
  assert.equal(fs.existsSync(notAuthorable.file), false)
})

test('已存在的 overrides 不被踩踏：只新增新预设那一条', async () => {
  const roster = { authorable: true, defaultId: 'standard', copy: async () => {} }
  const { routes, file } = harness({ roster })
  await call(routes['/api/prompt-customizer/config/apply'], {
    target: 'whoami-standard',
    patch: { sections: ['keep-me'] },
  })
  await call(routes[CREATE], { name: 'fresh', config: { tools: { exclude: ['write'] } } })
  const doc = parse(fs.readFileSync(file, 'utf8'))
  assert.deepEqual(doc.overrides['whoami-standard'], { sections: ['keep-me'] })
  assert.deepEqual(doc.overrides.fresh, { tools: { exclude: ['write'] } })
})

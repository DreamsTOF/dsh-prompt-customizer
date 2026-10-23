/**
 * /api/prompt-customizer/catalog/rescan（全量重扫登记表）路由测试。
 *
 * 该路由逐个挂载已声明的 agent 预设，跑一次装配，用真实并集整体替换累积
 * 登记表。最要紧的保护：**全部预设都失败时不能清空登记表** —— 否则一次
 * 环境故障就会把用户的全部历史条目删光。
 *
 * Usage: node --test test/catalog-rescan-route.test.mjs
 *
 * 表驱动合并：三个以「重扫结果」为断言对象的场景（全部失败 / 部分失败 /
 * 宿主无 acquireScope）进一张表逐项执行；每项仍然各自建宿主环境，互不共享状态。
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { parse } from 'yaml'
import { apply } from '../vendor/prompt-customizer/index.js'

/**
 * 假宿主：`assemble` 按 scopeKey 返回预设的 base 视图，`acquireScope` 用
 * 预设 id 当 scopeKey。失败的预设用 `broken` 标记（acquireScope 抛错）。
 */
function harness({ presets, scopeViews = {}, broken = [] }) {
  const routes = {}
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-rescan-'))
  const dataDir = path.join(root, 'data')
  const disposed = []

  const roster = {
    defaultId: presets[0]?.id ?? 'standard',
    list: async () => presets,
    acquireScope: async (id) => {
      if (broken.includes(id)) throw new Error(`preset "${id}" failed to mount`)
      return {
        key: id,
        async [Symbol.asyncDispose]() { disposed.push(id) },
      }
    },
  }

  const ctx = {
    on: () => {},
    inject: () => {},
    get: (name) => {
      if (name === 'webServer') return { register: (r) => { routes[r.path] = r.handler; return () => {} } }
      if (name === 'agentPresets') return roster
      if (name === 'profileContext') return undefined
      if (name === 'connection') return { requestRejection: () => undefined }
      return undefined
    },
    systemPrompt: {
      assemble: async (hint) => ({
        sections: [],
        tools: [],
        variables: {},
        contexts: [],
        promptCustomizerBaseView: scopeViews[hint.scope] ?? { sections: [], tools: [] },
      }),
    },
    effect: () => {},
  }
  apply(ctx, { dataDir })
  return { routes, dataDir, disposed }
}

async function post(handler, url = '/api/prompt-customizer/catalog/rescan') {
  const req = {
    url,
    method: 'POST',
    headers: { host: '127.0.0.1' },
    on(ev, cb) { if (ev === 'end') cb() },
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

const RESCAN = '/api/prompt-customizer/catalog/rescan'

test('重扫用真实并集整体替换登记表，并清掉历史条目', async () => {
  const { routes, dataDir } = harness({
    presets: [{ id: 'standard' }, { id: 'minimal' }],
    scopeViews: {
      standard: {
        sections: [{ name: 'persona', text: 'You are...' }],
        tools: [{ name: 'bash', description: 'run' }, { name: 'edit', description: 'edit' }],
      },
      minimal: {
        sections: [{ name: 'persona', text: 'You are...' }],
        tools: [{ name: 'bash', description: 'run' }],
      },
    },
  })

  // 先造出积压：一个早就不存在的历史工具
  fs.mkdirSync(dataDir, { recursive: true })
  fs.writeFileSync(path.join(dataDir, 'catalog.yaml'),
    'tools:\n  - name: dsh_browser_replay\n    description: stale\n  - name: bash\n    description: run\nsections:\n  - name: ghost-section\n    text: old\n')

  const res = await post(routes[RESCAN])
  assert.equal(res.status, 200, JSON.stringify(res.body))
  assert.deepEqual(res.body.scanned, ['standard', 'minimal'])
  assert.deepEqual(res.body.skipped, [])

  // 真实并集：bash/edit/persona；历史条目 dsh_browser_replay 与 ghost-section 清掉
  assert.deepEqual(res.body.catalog.tools.map((t) => t.name).sort(), ['bash', 'edit'])
  assert.deepEqual(res.body.catalog.sections.map((s) => s.name), ['persona'])
  assert.equal(res.body.report.tools.removed, 1)
  assert.equal(res.body.report.sections.removed, 1)

  // 落盘：重启不会把历史条目捞回来
  const onDisk = parse(fs.readFileSync(path.join(dataDir, 'catalog.yaml'), 'utf8'))
  assert.deepEqual(onDisk.tools.map((t) => t.name).sort(), ['bash', 'edit'])
})

test('重扫的失败路径：全部失败绝不清空登记表 / 部分失败用成功部分替换 / 无 acquireScope 报 501', async () => {
  const cases = [
    {
      label: '全部预设失败 → 409 且绝不清空登记表',
      run: async () => {
        const { routes, dataDir } = harness({
          presets: [{ id: 'a' }, { id: 'b' }],
          broken: ['a', 'b'],
        })
        fs.mkdirSync(dataDir, { recursive: true })
        const keep = 'tools:\n  - name: survivor\n    description: still here\n'
        fs.writeFileSync(path.join(dataDir, 'catalog.yaml'), keep)

        const res = await post(routes[RESCAN])
        assert.equal(res.status, 409)
        assert.equal(res.body.ok, false)
        assert.equal(res.body.skipped.length, 2)
        assert.equal(fs.readFileSync(path.join(dataDir, 'catalog.yaml'), 'utf8'), keep, '登记表必须原封不动')
      },
    },
    {
      label: '部分预设失败 → 用成功的那部分替换，失败原因回报',
      run: async () => {
        const { routes } = harness({
          presets: [{ id: 'good' }, { id: 'bad' }],
          scopeViews: { good: { sections: [], tools: [{ name: 'ok-tool', description: '' }] } },
          broken: ['bad'],
        })
        const res = await post(routes[RESCAN])
        assert.equal(res.status, 200, JSON.stringify(res.body))
        assert.deepEqual(res.body.scanned, ['good'])
        assert.equal(res.body.skipped.length, 1)
        assert.equal(res.body.skipped[0].preset, 'bad')
        assert.deepEqual(res.body.catalog.tools.map((t) => t.name), ['ok-tool'])
      },
    },
    {
      label: '宿主没有 acquireScope → 501',
      run: async () => {
        const routes = {}
        const ctx = {
          on: () => {}, inject: () => {},
          get: (name) => {
            if (name === 'webServer') return { register: (r) => { routes[r.path] = r.handler; return () => {} } }
            if (name === 'agentPresets') return { list: async () => [{ id: 'a' }] }
            if (name === 'connection') return { requestRejection: () => undefined }
            return undefined
          },
          systemPrompt: { assemble: async () => ({ sections: [], tools: [], variables: {}, promptCustomizerBaseView: {} }) },
          effect: () => {},
        }
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-rescan2-'))
        apply(ctx, { dataDir: path.join(dir, 'data') })
        const res = await post(routes[RESCAN])
        assert.equal(res.status, 501)
        assert.match(res.body.error, /acquireScope/)
      },
    },
  ]
  for (const c of cases) {
    try {
      await c.run()
    } catch (e) {
      if (e instanceof Error) e.message = `[${c.label}] ${e.message}`
      throw e
    }
  }
})

test('重扫释放每个作用域租约（不泄漏挂载）', async () => {
  const { routes, disposed } = harness({
    presets: [{ id: 'x' }, { id: 'y' }],
    scopeViews: { x: { sections: [], tools: [] }, y: { sections: [], tools: [] } },
  })
  await post(routes[RESCAN])
  assert.deepEqual(disposed.sort(), ['x', 'y'])
})

test('GET 被拒（重扫有副作用，只允许 POST）', async () => {
  const { routes } = harness({ presets: [{ id: 'a' }] })
  const req = { url: RESCAN, method: 'GET', headers: { host: '127.0.0.1' }, on(ev, cb) { if (ev === 'end') cb() } }
  const res = await new Promise((resolve) => {
    const r = { status: 0, body: null, writeHead(c) { this.status = c }, end(t) { this.body = JSON.parse(t); resolve(r) } }
    void routes[RESCAN](req, r)
  })
  assert.equal(res.status, 405)
})

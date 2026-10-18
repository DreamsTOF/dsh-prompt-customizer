/**
 * 端到端模拟：用真实投递的 `lib/index.js`，在隔离的临时 DSH_HOME 里跑
 * `/api/prompt-customizer/catalog/rescan`，验证「积压 → 重扫 → 对齐真实注册表」。
 *
 * 不碰用户 profile：DSH_HOME 是临时目录，假 roster 与假装配都在本进程内，
 * 只有被测代码是真实构建产物。真实的 4 个预设各自贡献的段/工具用 stub 装配
 * 按真实形状（含 dsh_browser_* 这类已卸载的历史工具）构造。
 *
 * Usage: node scripts/simulate-rescan.mjs
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { parse } from 'yaml'

const ROOT = path.resolve(import.meta.dirname, '..')

const fail = (msg) => { console.error(`FAIL  ${msg}`); process.exitCode = 1 }
const pass = (msg) => console.log(`ok    ${msg}`)

// ── 一个隔离的 DSH_HOME，预置「积压」登记表 ────────────────────────────────
const home = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-rescan-sim-'))
const dataDir = path.join(home, 'prompt-customizer')
fs.mkdirSync(dataDir, { recursive: true })
const catalogFile = path.join(dataDir, 'catalog.yaml')

// 积压：407 个工具里 307 个早已不存在（这里取真实样本形状），45 个段里 44 个是幽灵。
const staleTools = Array.from({ length: 307 }, (_, i) => ({
  name: i < 20 ? `dsh_browser_${['open', 'click', 'type', 'scroll', 'screenshot'][i % 5]}_${i}` : `ghost_tool_${i}`,
  description: 'stale — the plugin that registered this is long gone',
}))
const liveTools = [
  { name: 'bash', description: 'run a shell' },
  { name: 'edit', description: 'edit a file' },
  { name: 'grep', description: 'search' },
]
const staleSections = Array.from({ length: 44 }, (_, i) => ({ name: `ghost:section:${i}`, text: 'old' }))
const liveSections = [{ name: 'persona', text: 'You are a coding agent.' }]

fs.writeFileSync(catalogFile, [
  'tools:',
  ...[...staleTools, ...liveTools].map((t) => `  - name: ${t.name}\n    description: ${JSON.stringify(t.description)}`),
  'sections:',
  ...[...staleSections, ...liveSections].map((s) => `  - name: ${s.name}\n    text: ${JSON.stringify(s.text)}`),
  '',
].join('\n'))

// ── 真实的宿主替身：4 个预设，各自贡献不同的段/工具 ────────────────────────
const PRESET_VIEWS = {
  standard: {
    sections: [{ name: 'persona', text: 'You are a coding agent.' }, { name: 'guidelines', text: 'Be careful.' }],
    tools: [{ name: 'bash', description: 'run a shell' }, { name: 'edit', description: 'edit a file' }, { name: 'grep', description: 'search' }],
  },
  minimal: {
    sections: [{ name: 'persona', text: 'You are a coding agent.' }],
    tools: [{ name: 'bash', description: 'run a shell' }],
  },
  ptc: {
    sections: [{ name: 'persona', text: 'You are a coding agent.' }],
    tools: [{ name: 'run_code', description: 'PTC transport' }],
  },
  cordis: {
    sections: [{ name: 'persona', text: 'You are a coding agent.' }, { name: 'cordis:composition', text: 'compose plugins' }],
    tools: [{ name: 'bash', description: 'run a shell' }, { name: 'cordis_api_catalog', description: 'catalog' }],
  },
}
// 真实预期并集（4 个预设各自 base 视图去重后）：
const EXPECT_SECTIONS = ['persona', 'guidelines', 'cordis:composition']
const EXPECT_TOOLS = ['bash', 'edit', 'grep', 'run_code', 'cordis_api_catalog']

const routes = {}
const disposed = []
const roster = {
  defaultId: 'standard',
  list: async () => Object.keys(PRESET_VIEWS).map((id) => ({ id })),
  acquireScope: async (id) => ({
    key: id,
    async [Symbol.asyncDispose]() { disposed.push(id) },
  }),
}

const webServer = { register: (r) => { routes[r.path] = r.handler; return () => {} } }
const ctx = {
  on: () => {},
  // 真实 Cordis 的 effect 立即执行回调并登记 disposer；inject 立即用子作用域调用
  // 回调。桩必须同形，否则路由根本不会注册上（实测踩过）。
  effect: (fn) => { fn?.(); return () => {} },
  inject: (names, callback) => { callback?.(ctx); return () => {} },
  logger: { info: () => {}, warn: (m) => console.log("CTX-WARN:", String(m).slice(0,300)), debug: () => {} },
  // host.ts 有两层：自有模块用 `ctx.webServer` 属性，vendor 半身用 `ctx.get('webServer')`。
  // 两个面都要给，否则提示词半身整块不挂（实测踩过）。
  webServer,
  tools: { schemas: () => [], register: () => () => {} },
  sessionProjections: { register: () => () => {} },
  get: (name) => {
    if (name === 'webServer') return webServer
    if (name === 'agentPresets') return roster
    if (name === 'connection') return { requestRejection: () => undefined }
    if (name === 'settings') return { documentPath: path.join(home, 'settings.yaml') }
    if (name === 'profileContext') return undefined
    return undefined
  },
  systemPrompt: {
    assemble: async (hint) => ({
      sections: [], tools: [], variables: {}, contexts: [],
      layers: { merge: () => new Map() },
      promptCustomizerBaseView: PRESET_VIEWS[hint.scope] ?? { sections: [], tools: [] },
    }),
  },
}

// ── 跑真实构建产物 ────────────────────────────────────────────────────────
const mod = await import(pathToFileURL(path.join(ROOT, 'lib/index.js')).href)
// host.ts 的 apply 是 async：不 await 会在第一个 await 处就往下走，
// 结果是只有同步注册的 skill-manager 挂上了（实测踩过）。
await mod.apply(ctx, { dataDir })

const handler = routes['/api/prompt-customizer/catalog/rescan']
console.log('ROUTES', Object.keys(routes).join(', '))
if (handler === undefined) fail('catalog/rescan 路由未注册')
else pass('catalog/rescan 路由已注册')

function post() {
  const req = { url: '/api/prompt-customizer/catalog/rescan', method: 'POST', headers: { host: '127.0.0.1' }, on(ev, cb) { if (ev === 'end') cb() } }
  return new Promise((resolve) => {
    const res = {
      status: 0, body: null,
      writeHead(code) { this.status = code },
      end(text) { this.body = JSON.parse(text); resolve(res) },
    }
    void handler(req, res)
  })
}

// ── 断言 ──────────────────────────────────────────────────────────────────
const before = parse(fs.readFileSync(catalogFile, 'utf8'))
pass(`积压现状：${before.tools.length} 个工具 / ${before.sections.length} 个段`)

const res = await post()

if (res.status !== 200) fail(`重扫应 200，实得 ${res.status}: ${JSON.stringify(res.body)}`)
else pass('重扫返回 200')

const report = res.body.report ?? {}
const afterTools = res.body.catalog?.tools ?? []
const afterSections = res.body.catalog?.sections ?? []

const gotTools = afterTools.map((t) => t.name).sort()
const gotSections = afterSections.map((s) => s.name).sort()

if (JSON.stringify(gotTools) !== JSON.stringify([...EXPECT_TOOLS].sort())) {
  fail(`工具并集应等于真实注册表\n  期望 ${JSON.stringify([...EXPECT_TOOLS].sort())}\n  实得 ${JSON.stringify(gotTools)}`)
} else pass(`工具并集对齐真实注册表（${gotTools.length} 个）`)

if (JSON.stringify(gotSections) !== JSON.stringify([...EXPECT_SECTIONS].sort())) {
  fail(`段并集应等于真实注册表\n  期望 ${JSON.stringify([...EXPECT_SECTIONS].sort())}\n  实得 ${JSON.stringify(gotSections)}`)
} else pass(`段并集对齐真实注册表（${gotSections.length} 个）`)

if (report.tools?.removed === 307) pass(`清掉 307 个已不存在的工具（${report.tools.before} → ${report.tools.after}）`)
else fail(`应清掉 307 个工具，实得 ${JSON.stringify(report.tools)}`)

if (report.sections?.removed === 44) pass(`清掉 44 个已不存在的段（${report.sections.before} → ${report.sections.after}）`)
else fail(`应清掉 44 个段，实得 ${JSON.stringify(report.sections)}`)

if (JSON.stringify(disposed.sort()) === JSON.stringify(Object.keys(PRESET_VIEWS).sort())) pass('每个预设的作用域租约都已释放')
else fail(`租约释放不全：${JSON.stringify(disposed)}`)

// 落盘：重启后不会被历史条目捞回来
const onDisk = parse(fs.readFileSync(catalogFile, 'utf8'))
if (onDisk.tools.length === EXPECT_TOOLS.length && onDisk.sections.length === EXPECT_SECTIONS.length) {
  pass('登记表已落盘（重启不会捞回历史条目）')
} else fail(`落盘内容不对：${onDisk.tools.length} 工具 / ${onDisk.sections.length} 段`)

if ((res.body.skipped ?? []).length === 0) pass('无预设被跳过')
else fail(`不应有跳过的预设：${JSON.stringify(res.body.skipped)}`)

fs.rmSync(home, { recursive: true, force: true })
console.log(process.exitCode === 1 ? '\nSIMULATION FAILED' : '\nSIMULATION PASSED — 积压清理按真实注册表对齐')

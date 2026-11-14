/**
 * scripts/_probe-ptc.mjs — 临时只读探针：用真实 Chrome(CDP) 打开 web profile GUI，
 * 以页面同源 fetch 调 /api/prompt-customizer/*，验证 PTC 折叠工具在真实 web 实例里
 * 是否已变为可控（baseTools 里不再是 masked-ptc，而是 controllable + ptcBinding），
 * 并 dump 各预设的 tool 状态分布。仅用 Node 内建能力，无第三方依赖。
 *
 * Usage: node scripts/_probe-ptc.mjs --url "<token GUI URL>" [--chrome <path>] [--headless]
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const DEFAULT_CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = 9345
const CDP = `http://127.0.0.1:${String(PORT)}`
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function parseArgs(argv) {
  const out = { headless: false }
  for (let i = 0; i < argv.length; i += 1) {
    const t = argv[i]
    if (!t.startsWith('--')) continue
    const k = t.slice(2)
    if (k === 'headless') { out.headless = true; continue }
    const v = argv[i + 1]
    if (v === undefined || v.startsWith('--')) continue
    out[k] = v
    i += 1
  }
  return out
}
const args = parseArgs(process.argv.slice(2))
if (args.url === undefined) { console.error('missing --url'); process.exit(2) }
const chromePath = args.chrome ?? DEFAULT_CHROME
if (!existsSync(chromePath)) { console.error('no chrome: ' + chromePath); process.exit(2) }

class Cdp {
  constructor(socket) {
    this.socket = socket
    this.nextId = 1
    this.pending = new Map()
    this.onEvent = undefined
    socket.addEventListener('message', (event) => {
      const m = JSON.parse(event.data)
      if (m.id !== undefined) {
        const e = this.pending.get(m.id)
        if (e === undefined) return
        this.pending.delete(m.id)
        if (m.error !== undefined) e.reject(new Error(JSON.stringify(m.error)))
        else e.resolve(m.result)
        return
      }
      this.onEvent?.(m)
    })
  }
  send(method, params = {}) {
    const id = this.nextId++
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.socket.send(JSON.stringify({ id, method, params }))
    })
  }
  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (result.exceptionDetails !== undefined) {
      throw new Error('eval threw: ' + JSON.stringify(result.exceptionDetails?.exception?.description ?? result.exceptionDetails))
    }
    return result.result?.value
  }
  async waitFor(expression, timeoutMs = 30000, label = expression) {
    const started = Date.now()
    let last
    while (Date.now() - started < timeoutMs) {
      try { last = await this.evaluate(expression) } catch (e) { last = 'err:' + String(e) }
      if (last === true) return true
      await sleep(200)
    }
    throw new Error('timeout waiting ' + label + ' last=' + JSON.stringify(last))
  }
}
async function connect(wsUrl) {
  const socket = new WebSocket(wsUrl)
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', () => reject(new Error('ws fail ' + wsUrl)), { once: true })
  })
  return new Cdp(socket)
}

const profileDir = mkdtempSync(join(tmpdir(), 'pc-probe-chrome-'))
const browser = spawn(chromePath, [
  `--remote-debugging-port=${String(PORT)}`,
  `--user-data-dir=${profileDir}`,
  '--no-first-run', '--no-default-browser-check', '--disable-extensions',
  '--window-size=1440,1000',
  ...(args.headless ? ['--headless=new', '--disable-gpu'] : []),
  'about:blank',
], { stdio: 'ignore' })

let cdp
let code = 0
try {
  const t0 = Date.now()
  while (Date.now() - t0 < 30000) {
    try { const r = await fetch(`${CDP}/json/version`); if (r.ok) break } catch { /* not up */ }
    await sleep(300)
  }
  const created = await fetch(`${CDP}/json/new?${encodeURIComponent(args.url)}`, { method: 'PUT' })
  if (!created.ok) throw new Error('new tab failed HTTP ' + created.status)
  const target = await created.json()
  cdp = await connect(target.webSocketDebuggerUrl)
  await cdp.send('Runtime.enable')
  await cdp.send('Page.enable')
  // 等前端外壳就绪（token 已写入 cookie）
  await cdp.waitFor("document.readyState !== 'loading'", 30000, 'page ready')
  await sleep(1500)

  const summary = await cdp.evaluate(`(async () => {
    const j = async (u) => { const r = await fetch(u, { headers: { accept: 'application/json' } }); return await r.json() }
    const out = {}
    let pr
    try { pr = await j('/api/prompt-customizer/agent-presets') } catch (e) { out.presetsError = String(e); return out }
    out.presetsShape = Array.isArray(pr) ? 'array' : Object.keys(pr || {})
    const arr = Array.isArray(pr) ? pr : (pr.presets || pr.agents || pr.list || [])
    out.presets = arr.map((x) => ({ id: x.id ?? x.presetId, name: x.name, broken: x.broken }))
    const cand = arr.find((x) => /ptc/i.test(String(x.id ?? '')) || /ptc/i.test(String(x.name ?? ''))) || arr.find((x) => x.id)
    out.perPreset = []
    for (const p of arr) {
      const id = p.id ?? p.presetId
      if (id === undefined) continue
      let pv
      try { pv = await j('/api/prompt-customizer/preview?scope=' + encodeURIComponent(id) + '&phase=active') } catch (e) { continue }
      const bt = Array.isArray(pv.baseTools) ? pv.baseTools : []
      const states = {}
      for (const t of bt) states[t.state] = (states[t.state] ?? 0) + 1
      const rc = bt.find((t) => t.name === 'run_code')
      const folded = bt.filter((t) => t.ptcBinding === true)
      out.perPreset.push({
        id, name: p.name,
        ptcCollapsed: pv.truth?.ptcCollapsed === true,
        toolCount: bt.length,
        states,
        maskedPtcCount: bt.filter((t) => t.state === 'masked-ptc').length,
        runCode: rc ? { state: rc.state, hidden: rc.hidden, scope: rc.scope } : null,
        foldedCount: folded.length,
        foldedSample: folded.slice(0, 6).map((t) => ({ name: t.name, state: t.state, hidden: t.hidden })),
        sectionsHasPtcOnly: Array.isArray(pv.sections) && pv.sections.some((s) => s.name === 'tools:ptc-only'),
      })
    }
    return out
  })()`)
  console.log(JSON.stringify(summary, null, 2))

  const shot = await cdp.send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(join(process.cwd(), 'probe-web.png'), Buffer.from(shot.data, 'base64'))
  console.log('screenshot ->', join(process.cwd(), 'probe-web.png'))
} catch (error) {
  console.error('PROBE ERROR:', error instanceof Error ? error.message : String(error))
  code = 1
} finally {
  try { await cdp?.send('Browser.close') } catch { /* ignore */ }
  await sleep(400)
  browser.kill()
}
process.exit(code)

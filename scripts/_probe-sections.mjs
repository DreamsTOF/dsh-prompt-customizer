/**
 * scripts/_probe-sections.mjs — 临时只读探针：真实 Chrome(CDP) 打开 web profile，
 * 页面同源 fetch 采集某预设的 /inventory 与 /preview 段名/工具数，并检测是否含
 * 新插件注册的 marker 段。用于问题2「新增插件默认注入」的 before/after 对比。
 * Usage: node scripts/_probe-sections.mjs --url "<token URL>" [--scope standard] [--marker probe:stimulus] [--headless]
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const DEFAULT_CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = 9346
const CDP = `http://127.0.0.1:${String(PORT)}`
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
function parseArgs(argv) {
  const out = { headless: false, scope: 'standard', marker: 'probe:stimulus' }
  for (let i = 0; i < argv.length; i += 1) {
    const t = argv[i]
    if (!t.startsWith('--')) continue
    const k = t.slice(2)
    if (k === 'headless') { out.headless = true; continue }
    const v = argv[i + 1]
    if (v === undefined || v.startsWith('--')) continue
    out[k] = v; i += 1
  }
  return out
}
const args = parseArgs(process.argv.slice(2))
if (args.url === undefined) { console.error('missing --url'); process.exit(2) }
const chromePath = args.chrome ?? DEFAULT_CHROME
class Cdp {
  constructor(s) { this.s = s; this.id = 1; this.p = new Map(); s.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id !== undefined) { const x = this.p.get(m.id); if (!x) return; this.p.delete(m.id); m.error ? x.reject(new Error(JSON.stringify(m.error))) : x.resolve(m.result) } }) }
  send(method, params = {}) { const id = this.id++; return new Promise((resolve, reject) => { this.p.set(id, { resolve, reject }); this.s.send(JSON.stringify({ id, method, params })) }) }
  async ev(expression) { const r = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails?.exception?.description ?? r.exceptionDetails)); return r.result?.value }
}
async function connect(u) { const s = new WebSocket(u); await new Promise((res, rej) => { s.addEventListener('open', res, { once: true }); s.addEventListener('error', () => rej(new Error('ws fail')), { once: true }) }); return new Cdp(s) }
const profileDir = mkdtempSync(join(tmpdir(), 'pc-stim-'))
const browser = spawn(chromePath, [`--remote-debugging-port=${String(PORT)}`, `--user-data-dir=${profileDir}`, '--no-first-run', '--no-default-browser-check', '--disable-extensions', ...(args.headless ? ['--headless=new', '--disable-gpu'] : []), 'about:blank'], { stdio: 'ignore' })
let cdp, code = 0
try {
  for (let i = 0; i < 100; i++) { try { const r = await fetch(`${CDP}/json/version`); if (r.ok) break } catch {} await sleep(300) }
  const c = await fetch(`${CDP}/json/new?${encodeURIComponent(args.url)}`, { method: 'PUT' }); const t = await c.json()
  cdp = await connect(t.webSocketDebuggerUrl); await cdp.send('Runtime.enable'); await cdp.send('Page.enable')
  await sleep(2500)
  const out = await cdp.ev(`(async () => {
    const j = async (u) => (await fetch(u, { headers: { accept: 'application/json' } })).json()
    const S = ${JSON.stringify(args.scope)}, M = ${JSON.stringify(args.marker)}
    const rev = await j('/api/prompt-customizer/revision').catch(() => ({}))
    const inv = await j('/api/prompt-customizer/inventory?scope=' + encodeURIComponent(S)).catch((e) => ({ err: String(e) }))
    const pv = await j('/api/prompt-customizer/preview?scope=' + encodeURIComponent(S) + '&phase=active').catch((e) => ({ err: String(e) }))
    const invSec = Array.isArray(inv.sections) ? inv.sections.map((s) => s.name) : []
    const prevSec = Array.isArray(pv.sections) ? pv.sections.map((s) => s.name) : []
    return {
      revision: rev.revision,
      invSectionCount: invSec.length, invHasMarker: invSec.includes(M),
      previewSectionCount: prevSec.length, previewHasMarker: prevSec.includes(M),
      previewMarkerText: (Array.isArray(pv.sections) ? pv.sections : []).filter((s) => s.name === M).map((s) => String(s.text).slice(0, 60)),
      invToolCount: Array.isArray(inv.tools) ? inv.tools.length : null,
      previewToolCount: Array.isArray(pv.tools) ? pv.tools.length : null,
      invHasRawTool: (Array.isArray(inv.tools) ? inv.tools : []).some((t) => t.name === 'probe_stimulus_tool'),
      prevHasRawTool: (Array.isArray(pv.tools) ? pv.tools : []).some((t) => t.name === 'probe_stimulus_tool'),
      prevHasCondTool: (Array.isArray(pv.tools) ? pv.tools : []).some((t) => t.name === 'probe_stimulus_conditional'),
      prevHasProviderTool: (Array.isArray(pv.tools) ? pv.tools : []).some((t) => t.name === 'probe_provider_tool'),
      probePrevToolNames: (Array.isArray(pv.tools) ? pv.tools : []).map((t) => t.name).filter((n) => String(n).startsWith('probe')).slice(0, 10),
      samplePrevSections: prevSec.slice(0, 8),
    }
  })()`)
  console.log(JSON.stringify(out, null, 2))
} catch (e) { console.error('ERR', e instanceof Error ? e.message : String(e)); code = 1 }
finally { try { await cdp?.send('Browser.close') } catch {} await sleep(300); browser.kill() }
process.exit(code)

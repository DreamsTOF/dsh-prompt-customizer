/**
 * scripts/verify-panel-browser.mjs — 用真实 Chrome（CDP）点一遍「能力」面板。
 *
 * 为什么需要它：0.10.0 提交后回归过一次，只有真渲染才会暴露 ——
 * MCP 页里 `import { IconFolderOutlineRegular } from '@deepseek-ai/dsh-client-ui-primitives'`，
 * 而宿主根本没导出这个名字，JSX 组件是 `undefined`，React 抛
 * `Element type is invalid`，MCP 页被 ErrorBoundary 摘掉：用户点 MCP tab 就
 * **闪退回对话界面**。当时 `node --test` 全绿（构建、路由、host 逻辑都没问题），
 * 因为没有任何单元测试会真的渲染这个组件树。
 *
 * 这个脚本补上那一步：开一个真 Chrome 窗口，加载 dsh Web UI，点「能力」入口 →
 * MCP 页 → SKILL 页，断言没有未捕获异常、MCP 页真的渲染出来了、四个目录里的
 * 技能/MCP 条目都出现在 DOM 里，并截图留证。
 *
 * Usage:
 *   node scripts/verify-panel-browser.mjs --url "<带 token 的 GUI URL>" \
 *     [--expect-skills a,b] [--expect-mcp x,y] [--out <截图目录>] [--headless]
 *
 * 依赖：本机装了 Chrome（默认 `%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe`，
 * 可用 --chrome 指定）。脚本只用 Node 内建能力（fetch + WebSocket），无第三方依赖。
 */

import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const DEFAULT_CHROME = join(process.env.LOCALAPPDATA ?? '', 'Google', 'Chrome', 'Application', 'chrome.exe')
const PORT = 9333
const CDP = `http://127.0.0.1:${String(PORT)}`

/** 解析 `--key value` / `--flag` 形式的参数。 */
function parseArgs(argv) {
  const out = { headless: false }
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (!token.startsWith('--')) continue
    const key = token.slice(2)
    if (key === 'headless') { out.headless = true; continue }
    const value = argv[i + 1]
    if (value === undefined || value.startsWith('--')) continue
    out[key] = value
    i += 1
  }
  return out
}

const args = parseArgs(process.argv.slice(2))
if (args.url === undefined) {
  console.error('缺少 --url "<带 token 的 GUI URL>"')
  process.exit(2)
}
const chromePath = args.chrome ?? DEFAULT_CHROME
if (!existsSync(chromePath)) {
  console.error(`找不到 Chrome：${chromePath}（用 --chrome 指定）`)
  process.exit(2)
}
const expectSkills = (args['expect-skills'] ?? '').split(',').map((s) => s.trim()).filter(Boolean)
const expectMcp = (args['expect-mcp'] ?? '').split(',').map((s) => s.trim()).filter(Boolean)

const checks = []
const consoleErrors = []
const exceptions = []
function check(name, pass, detail = '') {
  checks.push({ name, pass, detail })
  console.log(`${pass ? 'ok  ' : 'FAIL'}  ${name}${detail === '' ? '' : ` — ${detail}`}`)
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/* ── CDP 客户端（裸 WebSocket，无依赖） ──────────────────────────────────── */

class Cdp {
  constructor(socket) {
    this.socket = socket
    this.nextId = 1
    this.pending = new Map()
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data)
      if (message.id !== undefined) {
        const entry = this.pending.get(message.id)
        if (entry === undefined) return
        this.pending.delete(message.id)
        if (message.error !== undefined) entry.reject(new Error(JSON.stringify(message.error)))
        else entry.resolve(message.result)
        return
      }
      this.onEvent?.(message)
    })
  }

  send(method, params = {}) {
    const id = this.nextId++
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.socket.send(JSON.stringify({ id, method, params }))
    })
  }

  /** 在页面里求值（返回 JSON 值）。 */
  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', {
      expression, returnByValue: true, awaitPromise: true,
    })
    if (result.exceptionDetails !== undefined) {
      throw new Error(`页面求值抛错：${result.exceptionDetails.text ?? ''} ${JSON.stringify(result.exceptionDetails.exception?.description ?? '')}`)
    }
    return result.result?.value
  }

  /** 轮询直到表达式为真（或超时）。 */
  async waitFor(expression, timeoutMs = 15000, label = expression) {
    const started = Date.now()
    let last
    while (Date.now() - started < timeoutMs) {
      try { last = await this.evaluate(expression) } catch (error) { last = `err:${String(error)}` }
      if (last === true) return true
      await sleep(200)
    }
    throw new Error(`等待超时（${label}），最后一次取值：${JSON.stringify(last)}`)
  }
}

async function connect(wsUrl) {
  const socket = new WebSocket(wsUrl)
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', () => { reject(new Error(`WebSocket 连接失败：${wsUrl}`)) }, { once: true })
  })
  return new Cdp(socket)
}

/* ── 主流程 ──────────────────────────────────────────────────────────────── */

const profileDir = mkdtempSync(join(tmpdir(), 'pc-verify-chrome-'))
const browser = spawn(chromePath, [
  `--remote-debugging-port=${String(PORT)}`,
  `--user-data-dir=${profileDir}`,
  '--no-first-run', '--no-default-browser-check', '--disable-extensions',
  '--window-size=1440,1000',
  ...(args.headless ? ['--headless=new', '--disable-gpu'] : []),
  'about:blank',
], { stdio: 'ignore' })

let cdp
let failed = false
try {
  // 1. 等 DevTools 端点起来
  const started = Date.now()
  while (Date.now() - started < 30000) {
    try {
      const response = await fetch(`${CDP}/json/version`)
      if (response.ok) break
    } catch { /* 还没起来 */ }
    await sleep(300)
  }

  // 2. 新开一个标签页（新版 Chrome 只接受 PUT）
  const created = await fetch(`${CDP}/json/new?${encodeURIComponent(args.url)}`, { method: 'PUT' })
  if (!created.ok) throw new Error(`开标签页失败：HTTP ${String(created.status)}`)
  const target = await created.json()

  cdp = await connect(target.webSocketDebuggerUrl)
  cdp.onEvent = (message) => {
    if (message.method === 'Runtime.exceptionThrown') {
      exceptions.push(message.params?.exceptionDetails?.exception?.description
        ?? message.params?.exceptionDetails?.text ?? 'unknown exception')
    }
    if (message.method === 'Runtime.consoleAPICalled' && message.params?.type === 'error') {
      consoleErrors.push((message.params.args ?? []).map((arg) => arg.value ?? arg.description ?? '').join(' '))
    }
  }
  await cdp.send('Runtime.enable')
  await cdp.send('Page.enable')

  // 3. 等前端外壳 + 本插件注入的侧栏入口
  await cdp.waitFor("document.querySelector('.dsh-nav-btn') !== null", 30000, '侧栏「能力」入口出现')
  check('侧栏「能力」入口已注入', true)

  // 4. 打开面板
  await cdp.evaluate(`(() => {
    const button = [...document.querySelectorAll('.dsh-nav-btn')]
      .find((node) => (node.getAttribute('aria-label') ?? node.textContent ?? '').includes('能力'))
      ?? document.querySelector('.dsh-nav-btn')
    button.click()
    return true
  })()`)
  try {
    // 面板是弹层：根容器是 .skm-hub（.skm-panel 是样式表里的旧键，组件已不用）。
    await cdp.waitFor("document.querySelector('.skm-hub') !== null", 15000, '能力面板打开')
  } catch (error) {
    // 失败时把现场 dump 出来：类名、入口按钮、有没有 skm-* 容器，便于定位是
    // 「面板没打开」还是「客户端插件没加载」还是「DOM 变了」。
    const dump = await cdp.evaluate(`(() => ({
      navButtons: [...document.querySelectorAll('.dsh-nav-btn')].map((n) => ({
        label: n.getAttribute('aria-label'), open: n.getAttribute('data-open'), text: (n.textContent ?? '').slice(0, 20),
      })),
      skmClasses: [...new Set([...document.querySelectorAll('[class*=skm]')].map((n) => n.className))].slice(0, 20),
      hasNavHost: document.querySelector('#dsh-prompt-customizer-nav-host') !== null,
      bodyHead: (document.body.innerHTML ?? '').slice(0, 400),
    }))()`)
    const outDir = args.out ?? join(process.cwd(), 'verify-shots')
    mkdirSync(outDir, { recursive: true })
    const shot = await cdp.send('Page.captureScreenshot', { format: 'png' })
    writeFileSync(join(outDir, 'panel-open-failed.png'), Buffer.from(shot.data, 'base64'))
    throw new Error(`${error instanceof Error ? error.message : String(error)}\n诊断：${JSON.stringify(dump, null, 2)}`)
  }
  check('「能力」面板已打开', true)

  // 5. 点 MCP tab —— 这一步就是历史上闪退的地方
  const openedMcp = await cdp.evaluate(`(() => {
    const tab = [...document.querySelectorAll('[role="tab"]')].find((n) => (n.textContent ?? '').trim() === 'MCP')
    if (tab === undefined) return false
    tab.click()
    return true
  })()`)
  check('找到并点击 MCP tab', openedMcp === true)
  await sleep(1200)

  // MCP 页没有独立的根容器（样式表里的 skm-mcp-view-root 组件并未使用）；
  // 「还挂着」的判据是：MCP tab 处于选中态 + 面板仍在 + 面板里能看到 MCP 文案。
  const mcpActive = await cdp.evaluate(`(() => {
    const tab = [...document.querySelectorAll('[role="tab"]')].find((n) => (n.textContent ?? '').trim() === 'MCP')
    return tab?.getAttribute('aria-selected') === 'true'
  })()`)
  check('MCP tab 处于选中态（点击生效，没有闪退回对话界面）', mcpActive === true)

  const panelStillThere = await cdp.evaluate("document.querySelector('.skm-hub') !== null")
  check('面板没有被 ErrorBoundary 摘掉', panelStillThere === true)

  const mcpVisible = await cdp.evaluate(`(() => {
    const hub = document.querySelector('.skm-hub')
    return (hub?.textContent ?? '').includes('MCP')
  })()`)
  check('MCP 页渲染出内容', mcpVisible === true)

  // 6. mcps 目录分组里的 server 都在 DOM 里
  const mcpText = await cdp.evaluate("document.querySelector('.skm-hub')?.textContent ?? ''")
  for (const name of expectMcp) {
    check(`MCP 列表出现 ${name}`, mcpText.includes(name))
  }
  if (expectMcp.length > 0) {
    check('mcps 目录分组标题出现', mcpText.includes('mcps 目录'))
  }

  // 7. SKILL tab：四个目录里的技能都要在，且同名时 .dsh 胜出（描述来自 .dsh 那份）
  const openedSkill = await cdp.evaluate(`(() => {
    const tab = [...document.querySelectorAll('[role="tab"]')].find((n) => (n.textContent ?? '').trim() === 'SKILL')
    if (tab === undefined) return false
    tab.click()
    return true
  })()`)
  check('找到并点击 SKILL tab', openedSkill === true)
  await sleep(1200)
  // 散装技能区块默认折叠：先展开它，技能名才会进 DOM（不展开时只有计数）。
  const expandedLoose = await cdp.evaluate(`(() => {
    const header = [...document.querySelectorAll('.skm-bundle-row')]
      .find((node) => (node.textContent ?? '').includes('散装技能'))
    if (header === undefined) return false
    if (header.closest('[data-open="true"]') === null) header.click()
    return true
  })()`)
  check('找到散装技能区块并展开', expandedLoose === true)
  await sleep(800)
  const skillText = await cdp.evaluate("document.querySelector('.skm-hub')?.textContent ?? ''")
  for (const name of expectSkills) {
    check(`技能列表出现 ${name}`, skillText.includes(name))
  }
  if (args['expect-dup-winner'] !== undefined) {
    check(`同名技能采用 ${args['expect-dup-winner']} 那份（.dsh 优先）`,
      skillText.includes(args['expect-dup-winner']))
  }

  // 8. 截图留证
  const outDir = args.out ?? join(process.cwd(), 'verify-shots')
  mkdirSync(outDir, { recursive: true })
  const shot = await cdp.send('Page.captureScreenshot', { format: 'png' })
  const shotPath = join(outDir, 'panel-skill.png')
  writeFileSync(shotPath, Buffer.from(shot.data, 'base64'))
  check('截图已保存', existsSync(shotPath), shotPath)

  // 9. 全程无未捕获异常 / console.error（过滤掉与本页无关的资源噪声）
  const realExceptions = exceptions.filter((text) => !text.includes('ResizeObserver'))
  check('浏览器无未捕获异常', realExceptions.length === 0, realExceptions.slice(0, 3).join(' | '))
  check('MCP 页没有 Element type is invalid（历史上就是它导致闪退）',
    !exceptions.some((text) => text.includes('Element type is invalid')))
} catch (error) {
  check('验证流程执行完成', false, error instanceof Error ? error.message : String(error))
} finally {
  failed = checks.some((item) => !item.pass)
  try { await cdp?.send('Browser.close') } catch { /* 忽略 */ }
  await sleep(500)
  browser.kill()
}

console.log(`\n${failed ? 'PANEL BROWSER VERIFY FAILED' : 'PANEL BROWSER VERIFY PASSED'}（${checks.filter((c) => c.pass).length}/${checks.length}）`)
if (consoleErrors.length > 0) console.log(`（console.error ${consoleErrors.length} 条，首条：${consoleErrors[0].slice(0, 200)}）`)
process.exit(failed ? 1 : 0)

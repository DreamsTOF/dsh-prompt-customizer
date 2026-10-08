/**
 * dsh-prompt-customizer — MCP 全局/预设分层回归测试。
 *
 * 直接跑构建产物 lib/index.js：DSH_HOME / DSH_AGENTS_HOME 指到临时目录，
 * 不碰用户真实预设、技能与账本。覆盖：
 *   - 预设遮蔽账本（preset-masks.json）写入与镜像；
 *   - agent 作用域三层补丁（tools.restrict / 同名空 section / 资源 stub）；
 *   - deny 计算排除「预设自带 serverName」（自带覆盖优先于遮蔽）；
 *   - 预设专属 mcp-client 行：从预设声明行的 config.plugins 读取、经
 *     configEditor.edit 写回（0.1.7 声明式预设模型）；
 *   - 行不可寻址（id 不唯一）时拒绝写入（409）；
 *   - 前缀匹配的全局 profile patch 路径（`- insert:` 块）不变；
 *   - patch 目标随宿主 profileContext 走（桌面 profile 不再误写 web），
 *     无宿主面时按 DSH_DESKTOP_PROFILE 环境变量回落（0.8.1）。
 *
 * Usage: node scripts/test-mcp-layering.mjs
 */

import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import { EventEmitter } from "node:events"

const sandbox = mkdtempSync(join(tmpdir(), "dsh-prompt-customizer-mcp-"))
process.env.DSH_AGENTS_HOME = join(sandbox, "agents")
process.env.DSH_HOME = join(sandbox, "dsh")

/* 全局 profile patch（全局 MCP 的写入目标）。 */
const patchFile = join(process.env.DSH_HOME, "profiles", "web", "cordis.patch.yml")
mkdirSync(join(process.env.DSH_HOME, "profiles", "web"), { recursive: true })
writeFileSync(patchFile, ["# my patch layer", "- id: some-plugin", "  disabled: true", ""].join("\n"))

const maskFile = join(process.env.DSH_HOME, "mcp", "dsh-prompt-customizer", "preset-masks.json")

/* ── 断言小工具 ──────────────────────────────────────────────────────── */
let failed = 0
function check(label, condition) {
  if (condition) {
    console.log(`ok    ${label}`)
  } else {
    failed += 1
    console.error(`FAIL  ${label}`)
  }
}

/** 安装器是异步的（预设声明读取）：等一轮微任务 + 定时器再断言。 */
const settle = () => new Promise(resolve => setTimeout(resolve, 20))

/* ── 假的宿主面 ──────────────────────────────────────────────────────── */
const routes = new Map()
const restrictCalls = []
const sections = []
const resourceStubs = []

const agentServices = {
  tools: {
    schemas: () => [
      { name: "mcp__github__search" },
      { name: "mcp__github__create_issue" },
      { name: "mcp__web__fetch" },
      { name: "read" },
    ],
    restrict: (filter) => {
      restrictCalls.push(filter)
      return () => {}
    },
  },
  systemPrompt: {
    getSectionOrder: () => 105,
    section: (section) => {
      sections.push(section)
      return () => {}
    },
  },
  mcpResources: {
    register: (serverName, provider) => {
      resourceStubs.push({ serverName, provider })
      return () => {}
    },
  },
}
const agent = {
  id: "agent-1",
  presetId: "code",
  ctx: {
    presetId: "code",
    get: (name) => agentServices[name],
    inject: () => () => {},
  },
}

/**
 * 预设声明行（0.1.7 模型）：行的 options.config 就是该预设的声明，plugins 里
 * 放子行。写入直接改这份数据 —— 与 configEditor.edit() 给的 current 同源。
 */
const presetRows = new Map()
presetRows.set("code", {
  options: {
    id: "preset-code",
    name: "@deepseek-ai/dsh-agent-preset",
    config: {
      id: "code",
      order: 2,
      plugins: [
        { id: "persona", name: "@deepseek-ai/dsh-persona", config: { prefix: "code agent" } },
      ],
    },
  },
})
presetRows.set("minimal", {
  options: {
    id: "preset-minimal",
    name: "@deepseek-ai/dsh-agent-preset",
    config: {
      id: "minimal",
      order: 1,
      plugins: [
        { id: "tool-fs", name: "@deepseek-ai/dsh-tool-fs" },
        { id: "dup", name: "@deepseek-ai/dsh-tool-fs" },
      ],
    },
  },
})
/* 行 id 不唯一 → configEditor 不把它列进可寻址行（只读）。 */
presetRows.set("ambiguous", {
  options: {
    id: "preset-ambiguous",
    name: "@deepseek-ai/dsh-agent-preset",
    config: { id: "ambiguous", plugins: [] },
  },
})

/** 已写入 profile patch 的预设覆盖（presetId → config）。 */
const overrides = new Map()
let editCalls = 0

const configEditor = {
  entries: () => [...presetRows.values()].filter((entry) => entry.options.id !== "preset-ambiguous"),
  configuration: () => [...presetRows.values()].map((entry) => ({
    entry,
    inherited: {},
    override: overrides.get(entry.options.config.id) ?? {},
  })),
  edit: async (entry, change) => {
    editCalls += 1
    const current = structuredClone(entry.options.config)
    const next = change(current, {})
    entry.options.config = next
    overrides.set(next.id, next)
  },
}

const ctx = {
  logger: { info: () => {}, warn: () => {}, debug: () => {} },
  webServer: { register: (route) => { routes.set(route.path, route.handler); return () => {} } },
  tools: { register: () => () => {}, schemas: () => [] },
  on: () => () => {},
  effect: (fn) => { fn?.(); return () => {} },
  settings: { get: () => ({ providers: {} }), register: () => () => {} },
  credentials: {}, sessions: {}, sessionPersistence: {}, llm: {},
  // loader 视图含全部行（含 configEditor 不列出的不可寻址行）—— 与真实组合一致：
  // 这种行读得到、写不了，路由据此回 409 而不是 404。
  loader: { entries: () => [...presetRows.values()] },
  get: (name) => {
    if (name === "agentPresets") {
      return {
        list: async () => [
          { id: "code", name: "Code" },
          { id: "minimal", name: "Minimal" },
          { id: "ambiguous" },
        ],
        composedPreset: (agentCtx) => agentCtx?.presetId,
        readDocument: async (presetId) => {
          if (presetId === "ghost") throw new Error(`Unknown agent preset: ${presetId}`)
          const plugins = presetRows.get(presetId)?.options.config.plugins ?? []
          const content = plugins.map((row) => `- id: ${row.id}\n  name: ${row.name}\n`).join("")
          return { agentPreset: presetId, content }
        },
      }
    }
    if (name === "agents") return { list: () => [agent] }
    if (name === "configEditor") return configEditor
    return undefined
  },
}

const mod = await import(pathToFileURL(join(process.cwd(), "lib/index.js")).href)
await mod.apply(ctx, {})
await settle()

/* ── HTTP 小工具 ─────────────────────────────────────────────────────── */
function fakeReq(method, url, body) {
  const req = new EventEmitter()
  req.method = method
  req.url = url
  req.socket = { remoteAddress: "127.0.0.1" }
  req.headers = { host: "localhost" }
  req.destroy = () => {}
  // 用宏任务而不是微任务：让处理器的监听器先挂上（真实 socket 有缓冲，
  // 但假请求没有，微任务会在处理器 await 之后、readBody 之前抢先发数据）。
  const payload = body === undefined ? undefined : Buffer.from(JSON.stringify(body))
  if (payload !== undefined) {
    setTimeout(() => {
      req.emit("data", payload)
      req.emit("end")
    }, 0)
  } else {
    setTimeout(() => req.emit("end"), 0)
  }
  // 有的处理器用 `for await (const chunk of req)` 读体（mcp-config 路由）。
  req[Symbol.asyncIterator] = async function* () {
    if (payload !== undefined) yield payload
  }
  return req
}
function fakeRes() {
  const res = {
    status: 0,
    body: "",
    /** 路由 handler 是 void handle(...)：响应在异步体读完之后才写出，等 promise。 */
    settled: undefined,
  }
  res.settled = new Promise(resolve => { res.settle = resolve })
  res.writeHead = status => { res.status = status }
  res.end = body => { res.body = body; res.settle() }
  return res
}
async function callOn(routePath, method, url, body) {
  const res = fakeRes()
  routes.get(routePath)(fakeReq(method, url, body), res)
  await res.settled
  return { status: res.status, json: res.body === "" ? undefined : JSON.parse(res.body) }
}
const callMask = (method, url, body) => callOn("/api/triad/mcp-masks", method, url, body)
const callPreset = (method, url, body) => callOn("/api/triad/mcp-presets", method, url, body)
const callStatus = (method, url) => callOn("/api/triad/mcp-status", method, url)
const pluginsOf = presetId => presetRows.get(presetId).options.config.plugins

/* ── 1. 遮蔽：账本写入 + 三层补丁 ────────────────────────────────────── */
await callMask("PUT", "/api/triad/mcp-masks/code/github", { enabled: false })
await settle()
const ledger = JSON.parse(readFileSync(maskFile, "utf8"))
check("遮蔽账本写入 preset-masks.json", ledger.presets?.code?.github === false)
check("restrict 的 deny 只含被遮蔽 server 的全局工具", restrictCalls.length === 1
  && restrictCalls[0].deny.includes("mcp__github__search")
  && restrictCalls[0].deny.includes("mcp__github__create_issue")
  && !restrictCalls[0].deny.some(name => name.startsWith("mcp__web__"))
  && !restrictCalls[0].deny.includes("read"))
check("同名空 section 遮蔽服务器指令", sections.length === 1
  && sections[0].name === "mcp:github" && sections[0].text === "")
check("资源 stub 注册同名 provider", resourceStubs.length === 1
  && resourceStubs[0].serverName === "github")
let stubError = ""
try { await resourceStubs[0].provider.request() } catch (error) { stubError = String(error?.message ?? error) }
check("资源 stub 读取报「已对本预设禁用」", stubError.includes("disabled for agent preset"))

/* ── 2. 自带 serverName 覆盖优先于遮蔽 ──────────────────────────────── */
pluginsOf("code").push({
  id: "mcp-neo",
  name: "@deepseek-ai/dsh-mcp-client",
  config: { serverName: "neo", transport: "streamable-http", url: "http://127.0.0.1:9/mcp" },
})
const statusBefore = await callStatus("GET", "/api/triad/mcp-status")
check("状态路由从声明行读到预设自带 server",
  (statusBefore.json?.presetServers?.code ?? []).some(row => row.serverName === "neo"))
check("未定制过的预设标记为随安装（system）",
  statusBefore.json?.presets?.find(row => row.id === "minimal")?.trust === "system")
restrictCalls.length = 0
sections.length = 0
resourceStubs.length = 0
await callMask("PUT", "/api/triad/mcp-masks/code/github", { enabled: true })
await callMask("PUT", "/api/triad/mcp-masks/code/neo", { enabled: false })
await settle()
check("自带 serverName 不进入 deny（自带覆盖优先于遮蔽）",
  restrictCalls.every(call => !call.deny.some(name => name.startsWith("mcp__neo__"))))
check("全局视图无该 server 工具时不注册遮蔽补丁（deny 空 → 三处皆无）",
  restrictCalls.length === 0 && sections.length === 0 && resourceStubs.length === 0)

/* ── 3. 预设专属行：读取 / 插入 / 删除 ──────────────────────────────── */
const added = await callPreset("POST", "/api/triad/mcp-presets/code/servers", {
  serverName: "docs", transport: "stdio", command: "npx", args: ["-y", "@scope/mcp-docs"],
})
check("新增预设专属行返回 200", added.status === 200 && added.json?.ok === true)
const inserted = pluginsOf("code").find(row => row.name === "@deepseek-ai/dsh-mcp-client" && row.config.serverName === "docs")
check("行已写进声明行 config.plugins（id / name / transport）", inserted !== undefined
  && inserted.id === "mcp-docs" && inserted.config.transport === "stdio"
  && inserted.config.serverName === "docs")
check("写入走 configEditor.edit", editCalls === 1)
check("既有声明行保留（persona / mcp-neo）",
  pluginsOf("code").some(row => row.id === "persona") && pluginsOf("code").some(row => row.id === "mcp-neo"))
const statusAfter = await callStatus("GET", "/api/triad/mcp-status")
check("写过的预设标记为用户定制（user）",
  statusAfter.json?.presets?.find(row => row.id === "code")?.trust === "user")

const dup = await callPreset("POST", "/api/triad/mcp-presets/code/servers", {
  serverName: "docs", transport: "stdio", command: "npx",
})
check("重复 serverName 被拒", dup.status === 400 && String(dup.json?.error).includes("already exists"))

const removed = await callPreset("DELETE", "/api/triad/mcp-presets/code/servers/docs")
check("删除预设专属行返回 200", removed.status === 200 && removed.json?.ok === true)
check("行已从声明行移除", !pluginsOf("code").some(row => row.config?.serverName === "docs"))
check("删除保留其它行", pluginsOf("code").length === 2)

const shipped = await callPreset("POST", "/api/triad/mcp-presets/minimal/servers", {
  serverName: "x", transport: "stdio", command: "npx",
})
check("随安装的默认预设同样可写", shipped.status === 200 && shipped.json?.ok === true)
check("写入落在该预设声明行的 plugins",
  pluginsOf("minimal").some(row => row.config?.serverName === "x"))

const locked = await callPreset("POST", "/api/triad/mcp-presets/ambiguous/servers", {
  serverName: "z", transport: "stdio", command: "npx",
})
check("行 id 不唯一（不可寻址）时拒绝写入 409",
  locked.status === 409 && locked.json?.error === "preset-not-editable")

const missing = await callPreset("POST", "/api/triad/mcp-presets/nope/servers", { serverName: "y", transport: "stdio", command: "npx" })
check("名单外的预设返回 404", missing.status === 404 && missing.json?.error === "preset-not-found")

/* ── 3b. 粘贴添加：JSON / YAML 校验与写入 ───────────────────────────── */
const previewRoute = "/api/triad/mcp-preview"
const preview = (body) => callOn(previewRoute, "POST", previewRoute, body)

const jsonPaste = JSON.stringify({
  mcpServers: {
    alpha: { command: "npx", args: ["-y", "@scope/alpha"] },
    beta: { url: "https://example.com/mcp" },
  },
})
const pv = await preview({ format: "json", text: jsonPaste, target: "preset" })
check("预览：JSON 多 server 解析成功", pv.status === 200 && pv.json?.ok === true && pv.json?.servers?.length === 2)
check("预览：返回待写入 YAML（serverName/transport）", String(pv.json?.yaml).includes("serverName: alpha")
  && String(pv.json?.yaml).includes("transport: streamable-http"))
check("预览：url 型 server 推断为 streamable-http",
  (pv.json?.servers ?? []).some(item => item.name === "beta" && item.transport === "streamable-http"))

const yamlPaste = [
  "mcpServers:",
  "  gamma:",
  "    command: npx",
  "    env:",
  "      TOKEN: ${MY_TOKEN}",
  "",
].join("\n")
const pvYaml = await preview({ format: "yaml", text: yamlPaste, target: "preset" })
check("预览：DSH 原生 YAML（mcpServers 形态）", pvYaml.status === 200 && pvYaml.json?.servers?.[0]?.name === "gamma")
check("预览：${VAR} 占位转 !!js 模板",
  String(pvYaml.json?.yaml).includes("!!js") && String(pvYaml.json?.yaml).includes("process.env.MY_TOKEN"))

const rowYaml = [
  "- id: mcp-delta",
  "  name: '@deepseek-ai/dsh-mcp-client'",
  "  config:",
  "    serverName: delta",
  "    transport: stdio",
  "    command: node",
  "    failOnStartupError: true",
  "",
].join("\n")
const pvRow = await preview({ format: "yaml", text: rowYaml, target: "preset" })
check("预览：mcp-client 行片段（保留额外 config 键）",
  pvRow.status === 200 && String(pvRow.json?.yaml).includes("failOnStartupError: true"))

const pvBadJson = await preview({ format: "json", text: "{ not json" })
check("预览：坏 JSON 给出解析错误", pvBadJson.json?.ok === false
  && String(pvBadJson.json?.errors?.[0]).includes("JSON 解析失败"))
const pvBadYaml = await preview({ format: "yaml", text: "mcpServers:\n  x:\n   - broken: [1,2\n" })
check("预览：坏 YAML 给出带行号的解析错误", pvBadYaml.json?.ok === false
  && String(pvBadYaml.json?.errors?.[0]).includes("YAML 解析失败"))

const pasted = await callPreset("POST", "/api/triad/mcp-presets/code/servers", { format: "json", text: jsonPaste })
check("粘贴写入预设：多 server 一次写入", pasted.status === 200 && (pasted.json?.added ?? []).length === 2)
const pastedAgain = await callPreset("POST", "/api/triad/mcp-presets/code/servers", { format: "json", text: jsonPaste })
check("重复粘贴：已存在的 serverName 跳过", pastedAgain.status === 200
  && (pastedAgain.json?.added ?? []).length === 0 && (pastedAgain.json?.skipped ?? []).length === 2)
const presetEnv = await callPreset("POST", "/api/triad/mcp-presets/code/servers", { format: "yaml", text: yamlPaste })
check("预设粘贴：${VAR} 占位在行数据里是 !!js 包装", presetEnv.status === 200
  && pluginsOf("code").some(row => row.config?.serverName === "gamma"
    && typeof row.config?.env?.TOKEN?.__jsExpr === "string"
    && row.config.env.TOKEN.__jsExpr.includes("process.env.MY_TOKEN")))

const globalAdd = await callOn("/api/triad/mcp-config", "POST", "/api/triad/mcp-config", { action: "add", format: "yaml", text: yamlPaste })
check("全局粘贴写入 profile patch", globalAdd.status === 200 && (globalAdd.json?.added ?? []).includes("gamma"))
const patchText = readFileSync(patchFile, "utf8")
check("patch 保留原内容并追加 - insert: 块",
  patchText.includes("some-plugin") && patchText.includes("- insert:") && patchText.includes("serverName: gamma"))
check("patch 写前备份存在", readFileSync(`${patchFile}.bak-last-toggle`, "utf8").includes("some-plugin"))

/* ── 4. 非法输入拒绝 ───────────────────────────────────────────────── */
const badName = await callMask("PUT", "/api/triad/mcp-masks/code/bad.name", { enabled: false })
check("非法 serverName 被拒", badName.status === 400)
const badBody = await callMask("PUT", "/api/triad/mcp-masks/code/github", { enabled: "yes" })
check("enabled 非布尔被拒", badBody.status === 400)

/* ── 5. 桌面/自定义 profile：patch 目标随宿主 profileContext 走 ─────────
 * 0.8.1 前 PROFILE_NAME 写死 'web'：桌面端（profile desktop）的状态与切换
 * 会读写 web profile 的 cordis.patch.yml（真实 bug）。回归两件事：
 * 主路径 ctx.profileContext（真实宿主注入形态）与 DSH_DESKTOP_PROFILE 回落。
 * 在全套断言之后执行：重复 apply 会重挂路由（stub 的 Map.set 幂等覆盖），
 * 但会给 stub agent 补一层 restrict 调用，别污染上面的计数。 */
const desktopDir = join(process.env.DSH_HOME, "profiles", "desktop")
const desktopPatch = join(desktopDir, "cordis.patch.yml")
mkdirSync(desktopDir, { recursive: true })
writeFileSync(desktopPatch, ["# desktop patch layer", ""].join("\n"))
const ctxDesktop = {
  ...ctx,
  profileContext: { name: "desktop", dir: desktopDir, patchPath: desktopPatch },
}
await mod.apply(ctxDesktop, {})
await settle()
const desktopStatus = await callStatus("GET", "/api/triad/mcp-status")
check("status.patchFile 随 profileContext 指向 desktop（profile=desktop）",
  desktopStatus.json?.patchFile === desktopPatch && desktopStatus.json?.profile === "desktop")
const desktopAdd = await callOn("/api/triad/mcp-config", "POST", "/api/triad/mcp-config",
  { action: "add", format: "yaml", text: yamlPaste })
check("桌面 profile：粘贴写入 desktop patch 而非 web",
  desktopAdd.status === 200 && readFileSync(desktopPatch, "utf8").includes("serverName: gamma")
    && !readFileSync(patchFile, "utf8").includes("# gamma-desktop-marker"))

// 回落链：真实宿主面缺失（如桌面壳 v4 只传环境变量）时按 DSH_DESKTOP_PROFILE 推。
const shellDir = join(process.env.DSH_HOME, "profiles", "desktop-shell")
mkdirSync(shellDir, { recursive: true })
process.env.DSH_DESKTOP_PROFILE = "desktop-shell"
const ctxShell = { ...ctx }
delete ctxShell.profileContext
await mod.apply(ctxShell, {})
await settle()
const shellStatus = await callStatus("GET", "/api/triad/mcp-status")
check("无 profileContext 时按 DSH_DESKTOP_PROFILE 回落",
  shellStatus.json?.patchFile === join(shellDir, "cordis.patch.yml")
    && shellStatus.json?.profile === "desktop-shell")
delete process.env.DSH_DESKTOP_PROFILE

rmSync(sandbox, { recursive: true, force: true })
if (failed > 0) {
  console.error(`\nMCP-LAYERING TEST FAILED (${failed})`)
  process.exit(1)
}
console.log("\nMCP-LAYERING TEST PASSED")

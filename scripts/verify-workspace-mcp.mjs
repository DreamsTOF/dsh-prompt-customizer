#!/usr/bin/env node
/** 工作区级 MCP：把给定 codegraph JSON 加入工作区 .mcp.json → 校验读取/JSON视图转换/工作区级编辑（改后还原）。 */
import fs from 'node:fs'
import path from 'node:path'
const argv = process.argv.slice(2)
const arg = (n, d) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : d }
const TOKEN_URL = arg('--url'); if (!TOKEN_URL) { console.error('缺 --url'); process.exit(2) }
const ORIGIN = new URL(TOKEN_URL).origin
const results = []
const rec = (n, ok, d) => { results.push({ n, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? `  — ${d}` : ''}`) }
let cookie = ''
async function handshake() { const r = await fetch(TOKEN_URL, { redirect: 'manual' }); const sc = r.headers.getSetCookie ? r.headers.getSetCookie() : []; cookie = sc.map((c) => c.split(';')[0]).join('; ') }
async function req(method, p, body) { const h = { accept: 'application/json' }; if (cookie) h.cookie = cookie; if (body !== undefined) h['content-type'] = 'application/json'; const r = await fetch(ORIGIN + p, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) }); let j = null; try { j = await r.json() } catch {} return { status: r.status, json: j } }
const codegraph = { mcpServers: { codegraph: { type: 'stdio', command: 'codegraph', args: ['serve', '--mcp'] } } }

async function main() {
  await handshake()
  const cfg = (await req('GET', '/api/prompt-customizer/config')).json ?? {}
  const wsList = (await req('GET', '/api/skill-toggles/workspaces')).json?.workspaces ?? []
  const workspace = String(arg('--workspace', cfg.currentWorkspace ?? wsList[0] ?? ''))
  console.log('workspace =', workspace)
  rec('拿到工作区路径', workspace !== '')
  if (workspace === '') return
  const wsFile = path.join(workspace, '.mcp.json')

  // 加入工作区
  const add = await req('POST', '/api/triad/mcp-config', { action: 'add', scope: 'workspace', workspace, format: 'json', text: JSON.stringify(codegraph) })
  rec('把 codegraph JSON 加入工作区 .mcp.json', add.status === 200 && add.json?.ok === true, JSON.stringify(add.json))
  rec('工作区 .mcp.json 已含 codegraph', fs.existsSync(wsFile) && /codegraph/.test(fs.readFileSync(wsFile, 'utf8')))

  // 读取（工作区级）
  const g = await req('GET', `/api/triad/mcp-edit?source=workspace&workspace=${encodeURIComponent(workspace)}&serverName=codegraph`)
  let cfgObj = null
  try { cfgObj = JSON.parse(String(g.json?.text ?? '')) } catch {}
  rec('工作区 GET 读到 codegraph 配置', g.status === 200 && g.json?.ok === true && cfgObj !== null)
  // 注：`.mcp.json` 按项目既定契约不写推断出的 transport/type（命令型 server 主流 agent 自动按 stdio），只保留 command/args。
  rec('读到的配置 command=codegraph/args含 --mcp', cfgObj?.command === 'codegraph' && Array.isArray(cfgObj?.args) && cfgObj.args.includes('--mcp'), JSON.stringify(cfgObj))

  // JSON ↔ YAML 视图转换（编辑弹窗切格式用）
  const toYaml = await req('POST', '/api/triad/mcp-format', { format: 'json', text: JSON.stringify(codegraph), to: 'yaml' })
  rec('JSON→YAML 转换成功且为 mcpServers 形态', toYaml.status === 200 && toYaml.json?.ok === true && /mcpServers:/.test(String(toYaml.json.text)) && /command: codegraph/.test(String(toYaml.json.text)))
  const toJson = await req('POST', '/api/triad/mcp-format', { format: 'yaml', text: String(toYaml.json?.text ?? ''), to: 'json' })
  let back = null
  try { back = JSON.parse(String(toJson.json?.text ?? '')) } catch {}
  rec('YAML→JSON 转换回 mcpServers.codegraph 正确', toJson.status === 200 && toJson.json?.ok === true && back?.mcpServers?.codegraph?.command === 'codegraph')

  // 工作区级编辑（改 args，加 --e2e）
  const edited = { type: 'stdio', command: 'codegraph', args: ['serve', '--mcp', '--e2e'] }
  const p1 = await req('POST', '/api/triad/mcp-edit', { source: 'workspace', workspace, serverName: 'codegraph', text: JSON.stringify(edited) })
  rec('工作区级编辑保存成功', p1.status === 200 && p1.json?.ok === true, JSON.stringify(p1.json))
  const fileAfter = fs.existsSync(wsFile) ? JSON.parse(fs.readFileSync(wsFile, 'utf8')) : {}
  rec('工作区文件 args 已改为含 --e2e', JSON.stringify(fileAfter?.mcpServers?.codegraph?.args ?? []) === '["serve","--mcp","--e2e"]', JSON.stringify(fileAfter?.mcpServers?.codegraph?.args))

  // 还原为给定 JSON
  const restore = await req('POST', '/api/triad/mcp-edit', { source: 'workspace', workspace, serverName: 'codegraph', text: JSON.stringify({ type: 'stdio', command: 'codegraph', args: ['serve', '--mcp'] }) })
  rec('已还原为给定 args=[serve,--mcp]', restore.status === 200 && restore.json?.ok === true)
}
try { await main() } catch (e) { rec('主流程异常', false, e instanceof Error ? e.stack ?? e.message : String(e)) } finally {
  const p = results.filter((r) => r.ok).length
  console.log(`\n==== 工作区 MCP 加入+编辑实测: ${p}/${results.length} 通过 ====`)
  process.exit(results.length - p === 0 ? 0 : 1)
}

#!/usr/bin/env node
/** 预设专属 / 工作区 MCP 编辑实测（切换 standard/ptc；工作区用临时 .mcp.json）。 */
import fs from 'node:fs'
import os from 'node:os'
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

async function main() {
  await handshake()
  // 工作区 .mcp.json 编辑（临时目录）
  const ws = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-mcp-edit-'))
  const mcpFile = path.join(ws, '.mcp.json')
  fs.writeFileSync(mcpFile, JSON.stringify({ mcpServers: { e2eprobe: { command: 'echo', args: ['a'] } } }, null, 2) + '\n')
  const wg = await req('GET', `/api/triad/mcp-edit?source=workspace&workspace=${encodeURIComponent(ws)}&serverName=e2eprobe`)
  rec('工作区 GET 读到 e2eprobe 配置', wg.status === 200 && wg.json?.ok === true && String(wg.json.text).includes('echo'))
  const wp = await req('POST', '/api/triad/mcp-edit', { source: 'workspace', workspace: ws, serverName: 'e2eprobe', text: JSON.stringify({ command: 'echo', args: ['b'] }) })
  rec('工作区 POST 保存成功', wp.status === 200 && wp.json?.ok === true, JSON.stringify(wp.json))
  const wsDoc = JSON.parse(fs.readFileSync(mcpFile, 'utf8'))
  rec('工作区 .mcp.json 已更新为 args=[b]', JSON.stringify(wsDoc.mcpServers.e2eprobe.args) === '["b"]')
  rec('工作区 .mcp.json 生成了 .bak-last-toggle', fs.existsSync(mcpFile + '.bak-last-toggle'))
  try { fs.rmSync(ws, { recursive: true, force: true }) } catch {}

  // 预设专属 Server 编辑（standard / ptc 各一遍）
  for (const preset of ['standard', 'ptc']) {
    const add = await req('POST', `/api/triad/mcp-presets/${encodeURIComponent(preset)}/servers`, { format: 'json', text: JSON.stringify({ mcpServers: { e2eprobe: { command: 'echo', args: ['a'] } } }) })
    if (!(add.status === 200 && add.json?.ok === true)) { rec(`预设 ${preset} 添加 e2eprobe`, false, JSON.stringify(add.json)); continue }
    const g1 = await req('GET', `/api/triad/mcp-edit?source=preset&preset=${encodeURIComponent(preset)}&serverName=e2eprobe`)
    rec(`预设 ${preset} GET 读到 e2eprobe 配置`, g1.status === 200 && g1.json?.ok === true && String(g1.json.text).includes('echo'))
    const p1 = await req('POST', '/api/triad/mcp-edit', { source: 'preset', preset, serverName: 'e2eprobe', text: JSON.stringify({ command: 'echo', args: ['b'] }) })
    rec(`预设 ${preset} 编辑保存成功`, p1.status === 200 && p1.json?.ok === true, JSON.stringify(p1.json))
    const g2 = await req('GET', `/api/triad/mcp-edit?source=preset&preset=${encodeURIComponent(preset)}&serverName=e2eprobe`)
    rec(`预设 ${preset} 编辑后读回 args=[b]`, g2.status === 200 && /"b"/.test(String(g2.json.text)))
    await req('DELETE', `/api/triad/mcp-presets/${encodeURIComponent(preset)}/servers/e2eprobe`)
  }
}
try { await main() } catch (e) { rec('主流程异常', false, e instanceof Error ? e.stack ?? e.message : String(e)) } finally {
  const p = results.filter((r) => r.ok).length
  console.log(`\n==== 预设/工作区 MCP 编辑实测: ${p}/${results.length} 通过 ====`)
  process.exit(results.length - p === 0 ? 0 : 1)
}

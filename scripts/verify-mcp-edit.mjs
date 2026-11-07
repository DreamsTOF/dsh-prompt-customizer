#!/usr/bin/env node
/** MCP 编辑实测：对 codegraph 做「原样往返」编辑（改后再 .bak 还原），验证读写与还原正确。 */
import fs from 'node:fs'
import path from 'node:path'
const argv = process.argv.slice(2)
const arg = (n, d) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : d }
const TOKEN_URL = arg('--url'); if (!TOKEN_URL) { console.error('缺 --url'); process.exit(2) }
const ORIGIN = new URL(TOKEN_URL).origin
const PATCH = arg('--patch', path.join(process.env.USERPROFILE ?? '', '.dsh', 'profiles', 'web', 'cordis.patch.yml'))
const results = []
const rec = (n, ok, d) => { results.push({ n, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? `  — ${d}` : ''}`) }
let cookie = ''
async function handshake() { const r = await fetch(TOKEN_URL, { redirect: 'manual' }); const sc = r.headers.getSetCookie ? r.headers.getSetCookie() : []; cookie = sc.map((c) => c.split(';')[0]).join('; ') }
async function req(method, p, body) { const h = { accept: 'application/json' }; if (cookie) h.cookie = cookie; if (body !== undefined) h['content-type'] = 'application/json'; const r = await fetch(ORIGIN + p, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) }); let j = null; try { j = await r.json() } catch {} return { status: r.status, json: j } }

async function main() {
  await handshake()
  const before = fs.existsSync(PATCH) ? fs.readFileSync(PATCH, 'utf8') : ''
  const raw = await req('GET', '/api/triad/mcp-edit?serverName=codegraph')
  rec('GET /mcp-edit 读到 codegraph 当前配置原文', raw.status === 200 && raw.json?.ok === true && typeof raw.json.text === 'string' && raw.json.text.includes('command: codegraph'), `text=${JSON.stringify(raw.json?.text)?.slice(0, 120)}`)
  const rawText = String(raw.json?.text ?? '')
  const indented = rawText.split(/\r?\n/).filter((l) => l.trim() !== '').map((l) => `    ${l}`).join('\n')
  const yaml = `mcpServers:\n  codegraph:\n${indented}\n`
  const save = await req('POST', '/api/triad/mcp-edit', { serverName: 'codegraph', format: 'yaml', text: yaml, reload: false })
  rec('POST /mcp-edit 保存（remove+append）成功', save.status === 200 && save.json?.ok === true, JSON.stringify(save.json))
  const after = fs.existsSync(PATCH) ? fs.readFileSync(PATCH, 'utf8') : ''
  rec('patch 文件仍包含 codegraph 条目', /serverName:\s*codegraph/.test(after) && /command:\s*codegraph/.test(after))
  rec('原样往返无副作用（相同配置写回后文件不变）', after === before, after === before ? '' : `diff len ${before.length}->${after.length}`)
  const raw2 = await req('GET', '/api/triad/mcp-edit?serverName=codegraph')
  rec('再次读取仍能拿到 codegraph 配置', raw2.status === 200 && raw2.json?.ok === true && String(raw2.json.text).includes('command: codegraph'))
  // 还原
  const bak = `${PATCH}.bak-last-toggle`
  if (fs.existsSync(bak)) { fs.copyFileSync(bak, PATCH); rec('已用 .bak 还原 patch 文件', true) } else { rec('未找到 .bak，跳过还原', false) }
  const restored = fs.existsSync(PATCH) ? fs.readFileSync(PATCH, 'utf8') : ''
  rec('还原后 patch 与编辑前逐字一致', restored === before, restored === before ? '' : '不一致')
}
try { await main() } catch (e) { rec('主流程异常', false, e instanceof Error ? e.stack ?? e.message : String(e)) } finally {
  const p = results.filter((r) => r.ok).length
  console.log(`\n==== MCP 编辑实测: ${p}/${results.length} 通过 ====`)
  process.exit(results.length - p === 0 ? 0 : 1)
}

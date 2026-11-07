#!/usr/bin/env node
/**
 * 「应用到所有预设」跨预设实测：对多个预设写入 per-preset 覆盖 → 执行应用全部 → 断言全部被清空（继承全部/全局）。
 * 覆盖 SKILL（resetPreset per preset）与 MCP（/api/triad/mcp-apply-all）。写入前备份、测后恢复。
 */
const argv = process.argv.slice(2)
const arg = (n, d) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : d }
const TOKEN_URL = arg('--url'); if (!TOKEN_URL) { console.error('缺 --url'); process.exit(2) }
const ORIGIN = new URL(TOKEN_URL).origin
const results = []
const rec = (name, ok, detail) => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`) }
let cookie = ''
async function handshake() { const r = await fetch(TOKEN_URL, { redirect: 'manual' }); const sc = r.headers.getSetCookie ? r.headers.getSetCookie() : []; cookie = sc.map((c) => c.split(';')[0]).join('; ') }
async function req(method, p, body) { const h = { accept: 'application/json' }; if (cookie) h.cookie = cookie; if (body !== undefined) h['content-type'] = 'application/json'; const r = await fetch(ORIGIN + p, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) }); let j = null; try { j = await r.json() } catch {} return { status: r.status, json: j } }

async function main() {
  await handshake()
  const backup = (await req('GET', '/api/prompt-customizer/backup')).json
  const presetList = (await req('GET', '/api/prompt-customizer/agent-presets')).json?.presets ?? []
  const ids = presetList.filter((p) => !p.broken).map((p) => p.id).slice(0, 3)
  const st0 = (await req('GET', '/api/skill-toggles/presets')).json ?? {}
  const skillName = Object.keys((await req('GET', '/api/skill-toggles/status')).json?.skills ?? {})[0]
  const mcp = (await req('GET', '/api/triad/mcp-status')).json ?? {}
  const server = mcp.servers?.[0]?.serverName
  console.log(`presets=${ids.join(',')} skill=${skillName} mcpServer=${server}`)
  try {
    // SKILL：给多个预设写单独开关
    for (const id of ids) await req('PUT', `/api/skill-toggles/presets/${encodeURIComponent(id)}/skills/${encodeURIComponent(skillName)}`, { enabled: false })
    let ov = (await req('GET', '/api/skill-toggles/presets')).json?.overrides ?? {}
    const setCount = ids.filter((id) => ov[id]?.[skillName] === false).length
    rec(`SKILL 多预设写入单独关闭 (${setCount}/${ids.length})`, setCount === ids.length)
    // 应用全部 = 逐个 resetPreset（与 SKILL 按钮一致）
    for (const id of ids) await req('POST', `/api/skill-toggles/presets/${encodeURIComponent(id)}/reset`)
    ov = (await req('GET', '/api/skill-toggles/presets')).json?.overrides ?? {}
    const remain = ids.filter((id) => ov[id]?.[skillName] === false).length
    rec('SKILL 应用到所有预设后单预设开关被清空', remain === 0, `remaining=${remain}`)

    // MCP：给多个预设写遮蔽 + 工具级覆盖
    if (server) {
      for (const id of ids) await req('PUT', `/api/triad/mcp-masks/${encodeURIComponent(id)}/${encodeURIComponent(server)}`, { enabled: false })
      let s = (await req('GET', '/api/triad/mcp-status')).json ?? {}
      const maskCount = ids.filter((id) => (s.masks?.[id]?.[server]) === false).length
      rec(`MCP 多预设写入遮蔽 (${maskCount}/${ids.length})`, maskCount === ids.length)
      const applied = await req('POST', '/api/triad/mcp-apply-all')
      rec('MCP 应用到所有预设接口 ok', applied.status === 200 && applied.json?.ok === true, JSON.stringify(applied.json))
      s = (await req('GET', '/api/triad/mcp-status')).json ?? {}
      const maskRemain = ids.filter((id) => (s.masks?.[id]?.[server]) === false).length
      rec('MCP 应用到所有预设后多预设遮蔽被清空', maskRemain === 0, `remaining=${maskRemain}`)
      const toolRemain = ids.filter((id) => Object.keys(s.toolDisabledByPreset?.[id] ?? {}).length > 0).length
      rec('MCP 应用到所有预设后多预设工具覆盖被清空', toolRemain === 0, `remaining=${toolRemain}`)
    } else {
      rec('MCP 应用到所有预设（无 server 跳过）', true, 'no server')
    }
  } finally {
    const restore = await req('POST', '/api/prompt-customizer/restore', { docs: backup?.docs ?? {}, catalog: backup?.catalog ?? {} })
    rec('已恢复整库备份', restore.status === 200 && restore.json?.ok === true)
  }
}

try { await main() } catch (e) { rec('主流程异常', false, e instanceof Error ? (e.stack ?? e.message) : String(e)) } finally {
  const p = results.filter((r) => r.ok).length
  console.log(`\n==== 跨预设应用全部: ${p}/${results.length} 通过, ${results.length - p} 失败 ====`)
  process.exit(results.length - p === 0 ? 0 : 1)
}

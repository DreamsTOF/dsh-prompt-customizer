#!/usr/bin/env node
/**
 * dsh-prompt-customizer 终端级 E2E 终测脚本。
 *
 * 用法：
 *   node scripts/e2e-terminal.mjs --url "http://127.0.0.1:PORT/?token=XXXX" [--destructive]
 *
 * 说明：
 *  - 先对 `/?token=` 做一次握手拿 dsh-auth cookie，再带 cookie 访问各 API。
 *  - 默认只跑只读检查；`--destructive` 会跑写入场景，且**测试前整库备份、结束时恢复**，
 *    保护真实数据。任何异常都会在 finally 里尝试恢复。
 *  - 退出码：全部通过 0，否则 1。结果同时写到 scripts/e2e-report.json。
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const argv = process.argv.slice(2)
const arg = (name, fallback) => {
  const i = argv.indexOf(name)
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : fallback
}
const TOKEN_URL = arg('--url')
const DESTRUCTIVE = argv.includes('--destructive')
if (TOKEN_URL === undefined) {
  console.error('缺少 --url "http://127.0.0.1:PORT/?token=XXXX"')
  process.exit(2)
}
const U = new URL(TOKEN_URL)
const ORIGIN = U.origin

const results = []
const record = (name, ok, detail) => {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail === undefined ? '' : `  — ${detail}`}`)
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let cookie = ''
async function handshake() {
  const res = await fetch(TOKEN_URL, { redirect: 'manual' })
  const sc = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : []
  cookie = sc.map((c) => c.split(';')[0]).join('; ')
  record('握手 /?token 获取 auth cookie', res.status < 400 && cookie !== '', `status=${res.status} cookie=${cookie.slice(0, 24)}…`)
}

async function req(method, p, body) {
  const headers = { accept: 'application/json' }
  if (cookie !== '') headers.cookie = cookie
  if (body !== undefined) headers['content-type'] = 'application/json'
  const res = await fetch(ORIGIN + p, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  let json = null
  try { json = await res.json() } catch { json = null }
  return { status: res.status, json }
}

async function okGet(name, p, validate) {
  try {
    const { status, json } = await req('GET', p)
    const good = status === 200 && json !== null && json.ok !== false && (validate === undefined || validate(json))
    record(name, good, `GET ${p} status=${status}${good ? '' : ` body=${JSON.stringify(json).slice(0, 160)}`}`)
    return { status, json }
  } catch (e) {
    record(name, false, `GET ${p} 异常: ${e instanceof Error ? e.message : String(e)}`)
    return { status: 0, json: null }
  }
}

async function expect(name, p, method, body, pred) {
  try {
    const { status, json } = await req(method, p, body)
    const good = (pred ? pred(status, json) : status === 200 && json !== null && json.ok === true)
    record(name, good, `${method} ${p} status=${status}${good ? '' : ` body=${JSON.stringify(json).slice(0, 200)}`}`)
    return { status, json }
  } catch (e) {
    record(name, false, `${method} ${p} 异常: ${e instanceof Error ? e.message : String(e)}`)
    return { status: 0, json: null }
  }
}

const WS = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-e2e-ws-')) // 隔离的临时工作区 cwd

async function main() {
  await handshake()

  // ── 只读接口全量 ──────────────────────────────────────────────
  await okGet('inventory 清单', '/api/prompt-customizer/inventory', (j) => Array.isArray(j.tools) || Array.isArray(j.sections) || j.counts !== undefined)
  const cfg = await okGet('config 配置', '/api/prompt-customizer/config', (j) => j.config !== undefined)
  await okGet('agent-presets 预设名单', '/api/prompt-customizer/agent-presets', (j) => Array.isArray(j.presets))
  await okGet('preview 三阶段(bootstrap)', '/api/prompt-customizer/preview?phase=bootstrap', (j) => j !== null)
  await okGet('session 当前会话', '/api/prompt-customizer/session', (j) => j !== null)
  await okGet('skill-manager list', '/api/skill-manager/list', (j) => Array.isArray(j.bundles) || Array.isArray(j.loose) || Array.isArray(j.skills))
  const st = await okGet('skill-toggles status', '/api/skill-toggles/status', (j) => j.skills !== undefined)
  await okGet('skill-toggles presets', '/api/skill-toggles/presets', (j) => Array.isArray(j.presets))
  await okGet('skill-toggles workspaces', '/api/skill-toggles/workspaces', (j) => j.workspaces !== undefined)
  await okGet('skill-health', '/api/skill-health', (j) => Array.isArray(j.issues) || j.ok === true)
  const mcp = await okGet('MCP status', '/api/triad/mcp-status', (j) => Array.isArray(j.servers))
  await okGet('MCP workspace scope status', `/api/triad/mcp-workspace-scope/status?cwd=${encodeURIComponent(WS)}`, (j) => j.ok === true)

  const presets = cfg.json?.config ? cfg.json : cfg.json
  const presetList = (await req('GET', '/api/prompt-customizer/agent-presets')).json?.presets ?? []
  const presetId = Array.isArray(presetList) && presetList.length > 0 ? (presetList.find((p) => !p.broken)?.id ?? presetList[0].id) : 'standard'
  const servers = Array.isArray(mcp.json?.servers) ? mcp.json.servers : []
  record('MCP 已注册 Server 数 >= 1', servers.length >= 1, `servers=${servers.map((s) => s.serverName).join(', ')}`)
  for (const s of servers) {
    record(`MCP Server 存在: ${s.serverName}`, true, `tools=${(s.tools ?? []).length}`
    )
  }
  const skillsObj = st.json?.skills ?? {}
  const skillNames = Object.keys(skillsObj)

  if (!DESTRUCTIVE) {
    return
  }

  // ── 写入场景（备份 → 测试 → 恢复）────────────────────────────
  const backup = await req('GET', '/api/prompt-customizer/backup')
  record('备份整库 /backup', backup.status === 200 && backup.json?.ok === true && backup.json.docs !== undefined, `docs keys=${Object.keys(backup.json?.docs ?? {}).join(',')}`)
  const backupFile = path.join(process.cwd(), 'scripts', '.e2e-backup.json')
  fs.writeFileSync(backupFile, JSON.stringify(backup.json, null, 2))
  const originalOverrides = JSON.parse(JSON.stringify(backup.json?.docs?.config?.overrides ?? {}))

  try {
    // 提示词·预设级 config/apply
    await expect('config/apply 预设级写入', '/api/prompt-customizer/config/apply', 'POST', { target: presetId, patch: { sections: ['__e2e_probe__'] } })
    const c1 = await req('GET', '/api/prompt-customizer/config')
    record('config 反映预设级 sections=__e2e_probe__', (c1.json?.config?.overrides?.[presetId]?.sections ?? []).includes('__e2e_probe__'), `sections=${JSON.stringify(c1.json?.config?.overrides?.[presetId]?.sections)}`)
    await expect('config/apply 预设级还原', '/api/prompt-customizer/config/apply', 'POST', { target: presetId, patch: { sections: null } })

    // 提示词·工作区级 config/apply level=workspace
    await expect('config/apply 工作区级写入', '/api/prompt-customizer/config/apply', 'POST', { level: 'workspace', workspace: WS, patch: { sections: ['__e2e_ws__'] } })
    const c2 = await req('GET', '/api/prompt-customizer/config')
    record('config 反映工作区级 workspaceOverrides', (c2.json?.workspaceOverrides?.[WS]?.sections ?? []).includes('__e2e_ws__'), `ws=${JSON.stringify(c2.json?.workspaceOverrides?.[WS]?.sections)}`)
    await expect('config/apply 工作区级还原', '/api/prompt-customizer/config/apply', 'POST', { level: 'workspace', workspace: WS, patch: { sections: null } })

    // config/set + unset（forceSections）
    await expect('config/set forceSections=false', '/api/prompt-customizer/config/set', 'POST', { field: 'forceSections', value: false })
    const c3 = await req('GET', '/api/prompt-customizer/config')
    record('config 反映 forceSections=false', c3.json?.config?.forceSections === false)
    await expect('config/unset forceSections', '/api/prompt-customizer/config/unset', 'POST', { field: 'forceSections' })

    // export（只读导出该预设定制）
    await okGet(`export 当前预设定制`, `/api/prompt-customizer/export?scope=${encodeURIComponent(presetId)}`, (j) => j.customization !== undefined)

    // SKILL·工作区级
    if (skillNames.length > 0) {
      const sk = skillNames[0]
      await expect(`SKILL 工作区级关闭 ${sk}`, `/api/skill-toggles/workspaces/${encodeURIComponent(WS)}/skills/${encodeURIComponent(sk)}`, 'PUT', { enabled: false })
      const w1 = await req('GET', '/api/skill-toggles/workspaces')
      record('SKILL workspaces 反映关闭', (w1.json?.workspaces?.[WS]?.[sk]) === false)
      await expect(`SKILL 工作区级还原 ${sk}`, `/api/skill-toggles/workspaces/${encodeURIComponent(WS)}/skills/${encodeURIComponent(sk)}`, 'PUT', { enabled: true })
      // SKILL·预设级
      await expect(`SKILL 预设级关闭 ${sk}@${presetId}`, `/api/skill-toggles/presets/${encodeURIComponent(presetId)}/skills/${encodeURIComponent(sk)}`, 'PUT', { enabled: false })
      await expect(`SKILL 预设级还原 ${sk}@${presetId}`, `/api/skill-toggles/presets/${encodeURIComponent(presetId)}/skills/${encodeURIComponent(sk)}`, 'PUT', { enabled: true })
    } else {
      record('SKILL 开关（无可用技能，跳过）', true, '0 skills')
    }

    // MCP·工作区级工具启停 + server 关闭 + 还原
    if (servers.length > 0) {
      const s0 = servers[0]
      const fullName = (s0.tools ?? [])[0]?.name ?? `mcp__${s0.serverName}__probe`
      await expect(`MCP 工作区级工具禁用 ${fullName}`, `/api/triad/mcp-workspace-scope/workspace/${encodeURIComponent(WS)}/tools`, 'PUT', { name: fullName, enabled: false })
      const m1 = await req('GET', `/api/triad/mcp-workspace-scope/status?cwd=${encodeURIComponent(WS)}`)
      record('MCP status 反映工具禁用', (m1.json?.toolDisabled ?? []).includes(fullName), `toolDisabled=${JSON.stringify(m1.json?.toolDisabled)}`)
      await expect(`MCP 工作区级工具还原 ${fullName}`, `/api/triad/mcp-workspace-scope/workspace/${encodeURIComponent(WS)}/tools`, 'PUT', { name: fullName, enabled: true })

      await expect(`MCP 工作区级关闭 server ${s0.serverName}`, `/api/triad/mcp-workspace-scope/workspace/${encodeURIComponent(WS)}/servers/${encodeURIComponent(s0.serverName)}`, 'PUT', { enabled: false })
      const m2 = await req('GET', `/api/triad/mcp-workspace-scope/status?cwd=${encodeURIComponent(WS)}`)
      record('MCP status 反映 server 关闭', (m2.json?.closed ?? []).includes(s0.serverName))
      await expect(`MCP 工作区级启用 server ${s0.serverName}`, `/api/triad/mcp-workspace-scope/workspace/${encodeURIComponent(WS)}/servers/${encodeURIComponent(s0.serverName)}`, 'PUT', { enabled: true })

      // 预设级遮蔽 mask
      await expect(`MCP 预设级遮蔽 ${s0.serverName}@${presetId}`, `/api/triad/mcp-masks/${encodeURIComponent(presetId)}/${encodeURIComponent(s0.serverName)}`, 'PUT', { enabled: false }, (st2, j) => st2 === 200 && j?.ok === true)
      await expect(`MCP 预设级遮蔽还原 ${s0.serverName}@${presetId}`, `/api/triad/mcp-masks/${encodeURIComponent(presetId)}/${encodeURIComponent(s0.serverName)}`, 'PUT', { enabled: true }, (st2, j) => st2 === 200 && j?.ok === true)
    } else {
      record('MCP 写入（无 Server，跳过）', true, '0 servers')
    }

    // catalog rescan（可能 200 / 501 / 409）
    const rs = await req('POST', '/api/prompt-customizer/catalog/rescan')
    record('catalog/rescan 可调用', [200, 409, 501].includes(rs.status), `status=${rs.status} ${rs.json?.error ?? ''}`)
  } finally {
    // 恢复整库
    const restore = await req('POST', '/api/prompt-customizer/restore', { docs: backup.json?.docs ?? {}, catalog: backup.json?.catalog ?? {} })
    record('恢复整库 /restore', restore.status === 200 && restore.json?.ok === true, `status=${restore.status}`)
    const after = await req('GET', '/api/prompt-customizer/config')
    const a = JSON.stringify(after.json?.config?.overrides ?? {})
    const b = JSON.stringify(originalOverrides)
    record('恢复后 overrides 与备份一致', a === b, a === b ? '' : '不一致')
    try { fs.unlinkSync(backupFile) } catch { /* ignore */ }
  }
}

try {
  await main()
} catch (e) {
  record('主流程异常', false, e instanceof Error ? e.stack ?? e.message : String(e))
} finally {
  const passed = results.filter((r) => r.ok).length
  const failed = results.length - passed
  console.log(`\n==== 汇总: ${passed}/${results.length} 通过, ${failed} 失败 ====`)
  try { fs.writeFileSync(path.join(process.cwd(), 'scripts', 'e2e-report.json'), JSON.stringify({ when: new Date().toISOString(), url: ORIGIN, destructive: DESTRUCTIVE, passed, failed, results }, null, 2)) } catch { /* ignore */ }
  process.exit(failed === 0 ? 0 : 1)
}

#!/usr/bin/env node
/**
 * 行为级验证：隐藏/修改提示词、隐藏/启用工具，**是否真的改变模型最终收到的内容**。
 *
 * 依据：
 *  - `/api/prompt-customizer/preview?phase=active&scope=<preset>`：真实跑该预设装配，
 *    返回的 `text` 是最终系统提示词、`tools` 是最终交给模型的工具声明。
 *  - `/api/prompt-customizer/session`：活动会话（含 agent 作用域 restrict）的真实视图。
 *
 * 用法：node scripts/verify-effect.mjs --url "http://127.0.0.1:PORT/?token=TOKEN"
 * 写入前整库备份、结束后恢复。
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const argv = process.argv.slice(2)
const arg = (n, d) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : d }
const TOKEN_URL = arg('--url')
if (TOKEN_URL === undefined) { console.error('缺 --url'); process.exit(2) }
const ORIGIN = new URL(TOKEN_URL).origin

const results = []
const rec = (name, ok, detail) => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`) }
const names = (arr) => (Array.isArray(arr) ? arr.map((x) => (typeof x === 'string' ? x : x?.name)).filter(Boolean) : [])

let cookie = ''
async function handshake() {
  const res = await fetch(TOKEN_URL, { redirect: 'manual' })
  const sc = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : []
  cookie = sc.map((c) => c.split(';')[0]).join('; ')
}
async function req(method, p, body) {
  const headers = { accept: 'application/json' }
  if (cookie) headers.cookie = cookie
  if (body !== undefined) headers['content-type'] = 'application/json'
  const r = await fetch(ORIGIN + p, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  let j = null; try { j = await r.json() } catch {}
  return { status: r.status, json: j }
}
const getPreview = async (phase, scope) => (await req('GET', `/api/prompt-customizer/preview?phase=${phase}&scope=${encodeURIComponent(scope)}`)).json
const getSession = async () => (await req('GET', '/api/prompt-customizer/session')).json

const serverOf = (full) => { const r = full.startsWith('mcp__') ? full.slice(5) : null; if (r === null) return null; const i = r.indexOf('__'); return i <= 0 ? null : r.slice(0, i) }

async function main() {
  await handshake()
  const cfg = (await req('GET', '/api/prompt-customizer/config')).json
  const currentWorkspace = cfg?.currentWorkspace
  const presetList = (await req('GET', '/api/prompt-customizer/agent-presets')).json?.presets ?? []
  const preset = presetList.find((p) => !p.broken)?.id ?? presetList[0]?.id ?? 'standard'
  console.log(`preset=${preset}  currentWorkspace=${currentWorkspace ?? '(none)'}`)

  const backup = (await req('GET', '/api/prompt-customizer/backup')).json
  const bfile = path.join(process.cwd(), 'scripts', '.verify-backup.json')
  fs.writeFileSync(bfile, JSON.stringify(backup))
  const RESTORE = async () => { await req('POST', '/api/prompt-customizer/restore', { docs: backup.docs ?? {}, catalog: backup.catalog ?? {} }) }

  try {
    // ── 预设级：真实装配前后对比（/preview phase=active，final text + tools）──
    const p0 = await getPreview('active', preset)
    const s0 = names(p0?.sections)
    const t0 = names(p0?.tools)
    console.log(`[baseline preview] sections=${s0.length} tools=${t0.length}; e.g. sections=${s0.slice(0, 5).join(',')} tools=${t0.slice(0, 5).join(',')}`)
    const sectionName = s0[0]
    const origText = String(p0?.text ?? '')
    rec('preview 基线可用（有段与文本）', s0.length > 0 && origText !== '', `sections=${s0.length} textLen=${origText.length}`)

    // 1) 隐藏段（预设级）
    await req('POST', '/api/prompt-customizer/config/apply', { target: preset, patch: { sections: [sectionName] } })
    const p1 = await getPreview('active', preset)
    const s1 = names(p1?.sections)
    rec(`隐藏段「${sectionName}」后真实装配不再包含该段`, !s1.includes(sectionName), `before=${s0.includes(sectionName)} after=${s1.includes(sectionName)}`)
    rec(`隐藏段后最终提示词文本变短`, String(p1?.text ?? '').length < origText.length, `len ${origText.length} -> ${String(p1?.text ?? '').length}`)
    await req('POST', '/api/prompt-customizer/config/apply', { target: preset, patch: { sections: null } })
    const p1r = await getPreview('active', preset)
    rec(`还原后该段回到真实装配`, names(p1r?.sections).includes(sectionName))

    // 2) 修改段文本（预设级 replace）—— 最终文本里出现替换标记
    const marker = '__E2E_MODIFIED_TEXT__'
    await req('POST', '/api/prompt-customizer/config/apply', { target: preset, patch: { replace: { [sectionName]: marker } } })
    const p2 = await getPreview('active', preset)
    rec(`替换段「${sectionName}」文本后最终提示词含替换内容`, String(p2?.text ?? '').includes(marker))
    await req('POST', '/api/prompt-customizer/config/apply', { target: preset, patch: { replace: null } })

    // 3) 隐藏工具（预设级，MCP 工具级禁用）—— 最终工具声明里消失
    let toolName = t0.find((n) => n.startsWith('mcp__'))
    if (toolName !== undefined) {
      const server = serverOf(toolName)
      await req('PUT', `/api/triad/mcp-tools/${encodeURIComponent(server)}`, { enabled: false, tools: [toolName], preset, source: 'inherit' })
      const p3 = await getPreview('active', preset)
      const t3 = names(p3?.tools)
      rec(`隐藏工具「${toolName}」后最终模型工具声明不再包含它`, !t3.includes(toolName), `before=${t0.includes(toolName)} after=${t3.includes(toolName)}`)
      await req('PUT', `/api/triad/mcp-tools/${encodeURIComponent(server)}`, { enabled: true, tools: [toolName], preset, source: 'inherit' })
      const p3r = await getPreview('active', preset)
      rec(`还原后该工具回到最终工具声明`, names(p3r?.tools).includes(toolName))
    } else {
      rec('隐藏工具（当前预览无 mcp 工具可测，跳过）', true, 'no mcp tool in preview')
    }

    // ── 工作区级：真实活动会话前后对比（/session）──
    if (currentWorkspace === undefined || currentWorkspace === null || currentWorkspace === '') {
      rec('工作区级真实会话验证（无活动会话，跳过）', true, 'no currentWorkspace')
      return
    }
    const sess0 = await getSession()
    const ss0 = names(sess0?.baseSections)
    const st0 = names(sess0?.tools)
    const stext0 = String(sess0?.text ?? '')
    console.log(`[baseline session] baseSections=${ss0.length} tools=${st0.length}`)
    const wsSection = ss0.find((n) => n !== '') ?? ss0[0]
    if (wsSection !== undefined) {
      await req('POST', '/api/prompt-customizer/config/apply', { level: 'workspace', workspace: currentWorkspace, patch: { sections: [wsSection] } })
      const sess1 = await getSession()
      const ss1 = names(sess1?.baseSections)
      const fs1 = names(sess1?.sections)
      const gone = fs1.length > 0 ? !fs1.includes(wsSection) : (String(sess1?.text ?? '').length < stext0.length)
      rec(`工作区隐藏段「${wsSection}」后活动会话最终提示词不再包含该段`, gone, `finalSections=${fs1.length} textLen ${stext0.length}->${String(sess1?.text ?? '').length}`)
      rec(`工作区隐藏段后会话提示词文本变短`, String(sess1?.text ?? '').length < stext0.length, `${stext0.length} -> ${String(sess1?.text ?? '').length}`)
      await req('POST', '/api/prompt-customizer/config/apply', { level: 'workspace', workspace: currentWorkspace, patch: { sections: null } })
      const sess1r = await getSession()
      rec(`工作区还原后该段回到会话视图`, names(sess1r?.baseSections).includes(wsSection))
    }
    const wsTool = st0.find((n) => n.startsWith('mcp__'))
    if (wsTool !== undefined) {
      await req('PUT', `/api/triad/mcp-workspace-scope/workspace/${encodeURIComponent(currentWorkspace)}/tools`, { name: wsTool, enabled: false })
      const sess2 = await getSession()
      const st2 = names(sess2?.tools)
      rec(`工作区隐藏工具「${wsTool}」后活动会话真实工具集不再包含`, !st2.includes(wsTool), `before=${st0.includes(wsTool)} after=${st2.includes(wsTool)}`)
      await req('PUT', `/api/triad/mcp-workspace-scope/workspace/${encodeURIComponent(currentWorkspace)}/tools`, { name: wsTool, enabled: true })
      const sess2r = await getSession()
      rec(`工作区还原后该工具回到会话工具集`, names(sess2r?.tools).includes(wsTool))
    } else {
      rec('工作区隐藏工具（会话无 mcp 工具可测，跳过）', true, 'no mcp tool in session')
    }
  } finally {
    await RESTORE()
    rec('已恢复整库备份', true)
    try { fs.unlinkSync(bfile) } catch {}
  }
}

try { await main() } catch (e) { rec('主流程异常', false, e instanceof Error ? (e.stack ?? e.message) : String(e)) } finally {
  const passed = results.filter((r) => r.ok).length
  console.log(`\n==== 行为级验证: ${passed}/${results.length} 通过, ${results.length - passed} 失败 ====`)
  process.exit(results.length - passed === 0 ? 0 : 1)
}

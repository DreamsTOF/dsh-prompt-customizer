/**
 * skill-health — 技能目录健康检查（host 半身）。
 *
 * 同步状态卡片的数据源。不修改 vendored skills-host.js 的扫描逻辑：独立的只读
 * 检查器，扫描与 skill-manager 相同的技能根（用户级 + 工作区级，见
 * `./skill-roots.ts`）+ bundle 账本：
 *
 *   1. missing-skill-md   —— 目录缺少 SKILL.md（`/api/skill-manager/list`
 *      会静默忽略这类目录，面板里根本看不到，属于「隐形坏目录」）
 *   2. bad-frontmatter    —— SKILL.md 无有效 name 字段
 *   3. name-mismatch      —— 目录名与 frontmatter name 不一致（文件查看器
 *      按 name 找目录，不一致会导致打开文件 404）
 *   4. dangling-bundle    —— .bundles.json 引用了不存在的技能目录
 *
 * 只读：不做任何修复/写入；issue 分 error / warn 两级。
 */

import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import { kernelSkillSummaries } from './kernel-skills.ts'
import { currentRootPaths, currentSkillRoots } from './skill-roots.ts'
import { isSkillName } from './ids.ts'
import { rejectUntrusted, requireTrustedRequest } from './trust.ts'

const SKILL_FILE = 'SKILL.md'
const BUNDLES_FILE = '.bundles.json'
const ROUTE_PATH = '/api/skill-health'

/** 账本所在根：用户 `~/.agents/skills`（与 skill-manager 的 managedRoot 一致）。 */
function ledgerRoot(): string {
  const roots = currentSkillRoots()
  const managed = roots.find((root) => root.label === 'user-agents')
  return managed?.path ?? roots[0]?.path ?? ''
}

/** skill-manager 同款 frontmatter 解析（naive line parser）。 */
function parseFrontmatter(raw: string): Record<string, string | boolean> {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw)
  const block = match?.[1]
  if (block === undefined) return {}
  const fields: Record<string, string | boolean> = {}
  for (const line of block.split(/\r?\n/)) {
    const pair = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line)
    const key = pair?.[1]
    const valueText = pair?.[2]
    if (key === undefined || valueText === undefined) continue
    const value = valueText.trim()
    if (value === 'true') fields[key] = true
    else if (value === 'false') fields[key] = false
    else fields[key] = value
  }
  return fields
}

/** skill-manager 同款 bundle 账本读取。 */
interface BundleRecord { id: string; name: string; skills: string[] }

async function readBundles(root: string): Promise<{ version: number; bundles: BundleRecord[] }> {
  try {
    const parsed = JSON.parse(await readFile(join(root, BUNDLES_FILE), 'utf8')) as unknown
    if (typeof parsed === 'object' && parsed !== null && (parsed as { version?: unknown }).version === 1 && Array.isArray((parsed as { bundles?: unknown }).bundles)) {
      return parsed as { version: number; bundles: BundleRecord[] }
    }
  } catch {
    /* fall through to empty ledger */
  }
  return { version: 1, bundles: [] }
}

/** 一条健康问题。 */
export interface HealthIssue {
  level: 'error' | 'warn'
  code: 'missing-skill-md' | 'bad-frontmatter' | 'name-mismatch' | 'dangling-bundle'
  skill?: string
  bundle?: string
  message: string
}

/** 健康报告：ok = 无 error 级问题。 */
export interface HealthReport {
  ok: boolean
  healthy: number
  issues: HealthIssue[]
}

/** 扫描一个根目录；返回健康技能数，顺带把目录名/有效名写回 nameSet。 */
async function scanRoot(root: string, nameSet: Set<string>): Promise<{ healthy: number; issues: HealthIssue[] }> {
  const issues: HealthIssue[] = []
  let entries = []
  try {
    entries = (await readdir(root, { withFileTypes: true })).filter((entry) => entry.isDirectory())
  } catch {
    return { healthy: 0, issues }
  }
  let healthy = 0
  for (const entry of entries) {
    nameSet.add(entry.name)
    let raw: string
    try {
      raw = await readFile(join(root, entry.name, SKILL_FILE), 'utf8')
    } catch {
      issues.push({
        level: 'error',
        code: 'missing-skill-md',
        skill: entry.name,
        message: `目录「${entry.name}」缺少 ${SKILL_FILE}，技能面板不会显示它`,
      })
      continue
    }
    const fields = parseFrontmatter(raw)
    const fmName = typeof fields.name === 'string' && fields.name !== '' ? fields.name : null
    if (!isSkillName(fmName)) {
      issues.push({
        level: 'error',
        code: 'bad-frontmatter',
        skill: entry.name,
        message: `「${entry.name}」的 ${SKILL_FILE} 缺少有效的 name 字段`,
      })
      continue
    }
    nameSet.add(fmName)
    if (fmName !== entry.name) {
      issues.push({
        level: 'warn',
        code: 'name-mismatch',
        skill: entry.name,
        message: `目录「${entry.name}」与 frontmatter name「${fmName}」不一致，打开技能文件可能 404`,
      })
    }
    healthy += 1
  }
  return { healthy, issues }
}

/** 执行完整健康检查（只读）。 */
export async function healthCheck(ctx?: Context): Promise<HealthReport> {
  const issues: HealthIssue[] = []
  const nameSet = new Set<string>()
  // 根集合由宿主注入（含工作区级根），三处消费方共用同一份。
  let healthy = 0
  for (const root of currentRootPaths()) {
    const scanned = await scanRoot(root, nameSet)
    healthy += scanned.healthy
    issues.push(...scanned.issues)
  }
  // bundle 成员不一定是文件系统技能：bundled / office / 插件注册技能也要算存在。
  let kernelHealthy = 0
  if (ctx !== undefined) {
    const summaries = await kernelSkillSummaries(ctx as never)
    for (const summary of summaries) {
      if (typeof summary?.name !== 'string' || summary.name === '') continue
      if (!nameSet.has(summary.name)) kernelHealthy += 1
      nameSet.add(summary.name)
    }
  }
  healthy += kernelHealthy

  // bundle 账本悬挂引用：引用了所有根目录里都不存在的技能。
  const ledger = await readBundles(ledgerRoot())
  for (const record of ledger.bundles) {
    for (const skillName of record.skills) {
      if (!nameSet.has(skillName)) {
        issues.push({
          level: 'error',
          code: 'dangling-bundle',
          skill: skillName,
          bundle: record.name,
          message: `Bundle「${record.name}」引用了不存在的技能「${skillName}」`,
        })
      }
    }
  }

  return { ok: issues.every((issue) => issue.level !== 'error'), healthy, issues }
}

/* ── HTTP 路由（宿主私有路由统一信任闸） ─────────────────────────────── */

function json(res: { writeHead: (status: number, headers: Record<string, string>) => void; end: (body: string) => void }, status: number, value: unknown): void {
  const body = JSON.stringify(value)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-cache',
  })
  res.end(body)
}

/** 注册 GET /api/skill-health。 */
export function applySkillHealth(ctx: Context): void {
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: ROUTE_PATH,
    handler: (req: { socket: { remoteAddress?: string }; headers: { host?: string } }, res: { writeHead: (status: number, headers: Record<string, string>) => void; end: (body: string) => void }) => {
      void (async () => {
        const trust = requireTrustedRequest(ctx, req)
        if (!trust.ok) {
          rejectUntrusted(res, trust)
          return
        }
        const url = new URL(req.url ?? '/', 'http://localhost')
        if (url.pathname === ROUTE_PATH || url.pathname === `${ROUTE_PATH}/`) {
          json(res, 200, await healthCheck(ctx))
          return
        }
        json(res, 404, { error: `no route for ${req.method ?? 'GET'} ${url.pathname}` })
      })()
    },
  }), 'dsh-skill-health: routes')
}

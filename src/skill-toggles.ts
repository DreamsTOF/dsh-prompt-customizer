/**
 * 技能开关(skill-toggles):挂 /api/skill-toggles 路由,提供两级开关——
 *
 *  1. **全局层**:写隐藏账本 `<agentsHome>/skills/.hidden-skills.json`，
 *     由闸门 provider 在内核目录里把这些名字遮掉（0.11.1 起）。
 *     不改用户的 SKILL.md —— 随安装(asar)/office/插件提供的技能同样能关，
 *     且随时可逆。文件层原有的 frontmatter 开关仍被尊重（`parseEnabled`），
 *     我们只是额外叠加自己的账本。
 *
 *  2. **Agent 预设层**:同一个技能可以「对 standard 开、对 code 关」。
 *     账本存 `<agentsHome>/skills/.preset-skills.json`（agentsHome 解析规则见
 *     `./home-paths.ts`，与内核 0.2.1-rc.2 的 resolveAgentsHome 一致）
 *     (`{ version: 1, presets: { <presetId>: { <skillName>: false } } }`;
 *     缺省 = 继承全局层,只有显式 false 才在该预设下关闭)。
 *
 * 预设层的生效机制(零 DSH 源码改动、运行时零 I/O):
 *   `ctx.skills` 是**分层**注册表——global 层 + scope 链(preset 常驻层 →
 *   agent 层),读取时按层合并,**最近层的同名条目直接覆盖更远层**。而每个
 *   agent 自身就是它那一层的 scope key,`agent.ctx.skills.registerProvider()`
 *   正好注册进该 agent 的层(注册表按调用方 ctx 的 scope 归层)。
 *   于是本模块在 `agent/created` 时给每个 agent 装一个「闸门 provider」:
 *   它只为「该 agent 所属预设里被关掉的技能名」返回同名候选,且候选的
 *   invocation 两个开关都是 false。合并后这些名字在该 agent 眼里就是
 *   不可调用的 —— 模型目录(catalog)不列、`skill` 工具拒绝加载、
 *   `/name` 手势也不认。其它 agent / 其它预设完全不受影响。
 *
 *   闸门 provider 的 list() 只读内存里的账本(无文件 I/O),注册表本身还有
 *   按 (cwd, scope 链, revision) 的缓存,所以每回合额外开销可忽略。
 *   写账本后调用各闸门的 invalidate() 使缓存失效,下一步即生效。
 *
 * 本模块只读写技能文件与自己的账本,不动 DSH 源码;数据面与技能管理面板
 * (/api/skill-manager)同一批技能目录(见 ./skill-roots.ts:用户级 + 工作区级)。
 *
 * Routes (all under /api/skill-toggles):
 *   GET  /status                          → { skills: {name: enabled}, bundles: {id: enabled} }
 *   PUT  /skills/:name        { enabled } → 全局开/关单个技能
 *   PUT  /bundles/:id         { enabled } → 全局开/关一个技能包(内全部技能)
 *   GET  /presets                         → { presets: [...roster], overrides, skills, bundles }
 *   PUT  /presets/:preset/skills/:name    { enabled } → 该预设下开/关单个技能
 *   PUT  /presets/:preset/bundles/:id     { enabled } → 该预设下开/关一个技能包
 *   POST /presets/:preset/reset           → 清空该预设的全部覆盖(回落全局)
 */

import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises'
import { readPluginDoc, writePluginDoc } from '../vendor/prompt-customizer/db.js'
import { join } from 'node:path'
import { URL } from 'node:url'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import { presetTrustOf } from './mcp-presets.ts'
import { currentRootPaths, currentSkillRoots } from './skill-roots.ts'
import { kernelSkillSummaries, kernelSkillViews, setHiddenSkillReader } from './kernel-skills.ts'
import { SKILL_MASK_PROVIDER } from './skill-mask-provider.ts'
import { isPresetId, isSkillName } from './ids.ts'
import { normalizeCwd } from './home-paths.ts'
import { rejectUntrusted, requireTrustedRequest } from './trust.ts'
import { optionalService } from './context-utils.ts'

/** Stable Cordis plugin name fragment (triad host apply). */
export const name = 'skill-toggles'

/** Minimal webServer service view (same contract as skill-manager). */
declare module '@deepseek-ai/cordis' {
  interface Context {
    webServer: {
      register(route: {
        kind: 'exact' | 'prefix'
        path: string
        handler: (req: IncomingMessage, res: ServerResponse) => void
      }): () => void
    }
  }
}

/** Services required before this plugin activates. */
export const inject = ['webServer']

/** 运行时才存在的服务(skills / agents / agentPresets)在类型上放宽为 any。 */
type PluginContext = any

const SKILL_FILE = 'SKILL.md'
const BUNDLES_FILE = '.bundles.json'
/** 预设级开关账本(与 .bundles.json 同目录)。 */
const PRESET_FILE = '.preset-skills.json'
const HIDDEN_FILE = '.hidden-skills.json'
const ROUTE_PREFIX = '/api/skill-toggles'
const MAX_BODY_BYTES = 256 * 1024
/** 闸门 provider 在每个 agent 层里的名字(同层唯一即可)。 */
const MASK_PROVIDER = SKILL_MASK_PROVIDER
/** 账本里 preset 条目上限(preset 名单本身十几条量级)。 */
const MAX_PRESET_ENTRIES = 50

/** The writable user-agents skill root (honors $DSH_AGENTS_HOME); 账本落在这里。 */
function managedRoot(): string {
  const roots = currentSkillRoots()
  return roots.find(root => root.label === 'user-agents')?.path ?? roots[0]?.path ?? ''
}

/** 全部技能根（用户级 + 工作区级），按优先级排列。 */
function allRoots(): string[] {
  return currentRootPaths()
}

/** Serialized bundle ledger (mirrors skill-manager's shape). */
interface BundlesFile {
  version: 1
  bundles: BundleRecord[]
}

interface BundleRecord {
  id: string
  name: string
  skills: string[]
  /** 技能包分类（skill-manager 写）；本模块只透传，不读它。 */
  categories?: string[]
}

/** Read the bundle ledger; missing/corrupt files start empty. */
async function readBundles(root: string): Promise<BundlesFile> {
  try {
    const parsed = JSON.parse(await readFile(join(root, BUNDLES_FILE), 'utf8')) as unknown
    if (
      typeof parsed === 'object' && parsed !== null
      && (parsed as Record<string, unknown>).version === 1
      && Array.isArray((parsed as Record<string, unknown>).bundles)
    ) {
      return parsed as BundlesFile
    }
  } catch {
    // Missing or unreadable ledger: treat as empty.
  }
  return { version: 1, bundles: [] }
}

/** ── 预设级开关账本 ───────────────────────────────────────────────────────── */

/**
 * 账本形状:`{ version: 1, presets: { <presetId>: { <skillName>: boolean } } }`。
 * 只有显式 `false` 才在该预设下关闭;`true` 或缺省都表示「继承全局层」。
 */
export interface PresetSkillsFile {
  version: 1
  presets: Record<string, Record<string, boolean>>
}

/**
 * 全局层隐藏账本:`{ version: 1, hidden: string[] }`。
 *
 * 0.11.1 起全局开关不再改 SKILL.md 的 frontmatter，而是记在这里，由闸门 provider
 * 在内核目录里遮掉 —— 这样随安装（app.asar 内）、office 包、插件自带的技能也能
 * 被关掉，而不用去改它们背后只读的文件。显隐不区分来源，插件对所有技能负责。
 */
export interface HiddenSkillsFile {
  version: 1
  hidden: string[]
}

/** 账本路径(与 .bundles.json 同目录:managedRoot)。 */
function presetLedgerPath(): string {
  return join(managedRoot(), PRESET_FILE)
}

/** 归一化任意输入为合法账本(脏字段直接丢弃)。 */
function normalizeLedger(input: unknown): PresetSkillsFile {
  const presets: Record<string, Record<string, boolean>> = {}
  const raw = (input !== null && typeof input === 'object'
    ? (input as Record<string, unknown>).presets
    : undefined)
  if (raw !== null && typeof raw === 'object') {
    for (const [presetId, table] of Object.entries(raw as Record<string, unknown>)) {
      if (!isPresetId(presetId)) continue
      if (table === null || typeof table !== 'object') continue
      if (Object.keys(presets).length >= MAX_PRESET_ENTRIES) break
      const entries: Record<string, boolean> = {}
      for (const [skillName, state] of Object.entries(table as Record<string, unknown>)) {
        if (!isSkillName(skillName) || typeof state !== 'boolean') continue
        entries[skillName] = state
      }
      presets[presetId] = entries
    }
  }
  return { version: 1, presets }
}

/**
 * 进程内账本单例:HTTP 写入后立即刷新,闸门 provider 的 list() 只读它,
 * 因此每回合的额外开销是一次 Map 命中,零文件 I/O。
 */
let ledgerCache: PresetSkillsFile | undefined
/** 账本变更后需要失效的技能注册表缓存(每个 agent 一个闸门的 invalidate)。 */
const maskInvalidators = new Set<() => void>()

/** 读账本(首次读盘,之后走内存;文件缺失/损坏视为空账本)。 */
async function readLedger(): Promise<PresetSkillsFile> {
  let parsed: unknown
  try {
    parsed = readPluginDoc('skills/preset-toggles')
  } catch {
    parsed = undefined
  }
  ledgerCache = normalizeLedger(parsed)
  return ledgerCache
}

/** 原子写账本 + 刷新内存副本 + 让所有闸门缓存失效。 */
async function writeLedger(next: PresetSkillsFile): Promise<void> {
  writePluginDoc('skills/preset-toggles', next)
  ledgerCache = next
  for (const invalidate of maskInvalidators) {
    try { invalidate() } catch { /* 单个 agent 的失效失败不影响其它 */ }
  }
}

/** 工作区级技能开关账本：`{ version: 1, workspaces: { <cwd>: { <skillName>: boolean } } }`。 */
export interface WorkspaceSkillsFile { version: 1; workspaces: Record<string, Record<string, boolean>> }

function normalizeWorkspaceLedger(input: unknown): WorkspaceSkillsFile {
  const workspaces: Record<string, Record<string, boolean>> = {}
  const raw = (input !== null && typeof input === 'object'
    ? (input as Record<string, unknown>).workspaces
    : undefined)
  if (raw !== null && typeof raw === 'object') {
    for (const [cwd, table] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof cwd !== 'string' || cwd === '') continue
      const key = normalizeCwd(cwd)
      if (table === null || typeof table !== 'object') continue
      const entries: Record<string, boolean> = {}
      for (const [skillName, state] of Object.entries(table as Record<string, unknown>)) {
        if (!isSkillName(skillName) || typeof state !== 'boolean') continue
        entries[skillName] = state
      }
      workspaces[key] = entries
    }
  }
  return { version: 1, workspaces }
}

async function readWorkspaceLedger(): Promise<WorkspaceSkillsFile> {
  let parsed: unknown
  try { parsed = readPluginDoc('skills/workspace-toggles') } catch { parsed = undefined }
  return normalizeWorkspaceLedger(parsed)
}

async function writeWorkspaceLedger(next: WorkspaceSkillsFile): Promise<void> {
  writePluginDoc('skills/workspace-toggles', next)
  for (const invalidate of maskInvalidators) {
    try { invalidate() } catch { /* 单个 agent 的失效失败不影响其它 */ }
  }
}

/** 写入一批「工作区 → 技能 → 开关」；enabled=true 删除覆盖（回落预设/全局）。 */
async function setWorkspaceSkills(cwd: string, names: readonly string[], enabled: boolean): Promise<number> {
  if (typeof cwd !== 'string' || cwd === '') throw new Error('workspace cwd is required')
  const key = normalizeCwd(cwd)
  const current = await readWorkspaceLedger()
  const table = { ...(current.workspaces[key] ?? {}) }
  let changed = 0
  for (const skillName of names) {
    if (!isSkillName(skillName)) continue
    if (enabled) {
      if (table[skillName] !== undefined) { delete table[skillName]; changed += 1 }
    } else if (table[skillName] !== false) {
      table[skillName] = false
      changed += 1
    }
  }
  if (changed === 0) return 0
  const workspaces = { ...current.workspaces }
  if (Object.keys(table).length === 0) delete workspaces[key]
  else workspaces[key] = table
  await writeWorkspaceLedger({ version: 1, workspaces })
  return changed
}

/** 该预设下被显式关闭的技能名集合(空集 = 完全继承全局层)。 */
function disabledNames(ledger: PresetSkillsFile, presetId: string): Set<string> {
  const table = ledger.presets[presetId]
  if (table === undefined) return new Set()
  const disabled = new Set<string>()
  for (const [skillName, state] of Object.entries(table)) {
    if (state === false) disabled.add(skillName)
  }
  return disabled
}

/* ── 全局隐藏账本（所有来源通用；闸门在 list 里遮掉这些名字） ─────────────── */

function hiddenLedgerPath(): string {
  return join(managedRoot(), HIDDEN_FILE)
}

/** 进程内全局隐藏集合（写盘后立即刷新）。 */
let hiddenCache: Set<string> | undefined

/** 读全局隐藏集合（文件缺失/损坏视为空集）。 */
async function readHidden(): Promise<Set<string>> {
  let parsed: unknown
  try {
    parsed = readPluginDoc('skills/hidden-toggles')
  } catch {
    parsed = undefined
  }
  const hidden = new Set<string>()
  const raw = parsed !== null && typeof parsed === 'object'
    ? (parsed as Record<string, unknown>).hidden
    : undefined
  if (Array.isArray(raw)) {
    for (const name of raw) {
      if (typeof name === 'string' && isSkillName(name)) hidden.add(name)
    }
  }
  hiddenCache = hidden
  return hidden
}

/** 原子写全局隐藏集合 + 让所有闸门缓存失效。 */
async function writeHidden(next: Set<string>): Promise<void> {
  const file: HiddenSkillsFile = { version: 1, hidden: [...next].sort() }
  writePluginDoc('skills/hidden-toggles', file)
  hiddenCache = new Set(file.hidden)
  for (const invalidate of maskInvalidators) {
    try { invalidate() } catch { /* 单个 agent 的失效失败不影响其它 */ }
  }
}

/** 写入一批「预设 → 技能 → 开关」;enabled=true 时删除覆盖(回落全局)。 */
async function setPresetSkills(
  presetId: string,
  names: readonly string[],
  enabled: boolean,
): Promise<number> {
  const current = await readLedger()
  const table = { ...(current.presets[presetId] ?? {}) }
  let changed = 0
  for (const skillName of names) {
    if (!isSkillName(skillName)) continue
    if (enabled) {
      if (table[skillName] !== undefined) { delete table[skillName]; changed += 1 }
    } else if (table[skillName] !== false) {
      table[skillName] = false
      changed += 1
    }
  }
  if (changed === 0) return 0
  const presets = { ...current.presets }
  if (Object.keys(table).length === 0) delete presets[presetId]
  else presets[presetId] = table
  await writeLedger({ version: 1, presets })
  return changed
}

/** Locate a skill directory under a root; undefined when absent. */
async function skillDirUnder(root: string, skillName: string): Promise<string | undefined> {
  try {
    const info = await import('node:fs/promises').then(fs => fs.stat(join(root, skillName)))
    if (info.isDirectory()) return join(root, skillName)
  } catch {
    // fallthrough
  }
  return undefined
}

/** Locate a skill directory across all roots (workspace roots first, then user roots). */
async function locateSkillDir(skillName: string): Promise<string | undefined> {
  for (const root of allRoots()) {
    const direct = await skillDirUnder(root, skillName)
    if (direct !== undefined) return direct
  }
  // 目录名与 frontmatter name 可以不一致（手工拷目录、改名导入）：面板与账本给的
  // 往往是规范名，只按目录名找就定位不到，开关点了没反应。
  return await skillDirByFrontmatterName(skillName)
}

/** 按 SKILL.md 的 frontmatter name 扫所有根，找技能的真实目录。 */
async function skillDirByFrontmatterName(skillName: string): Promise<string | undefined> {
  for (const root of allRoots()) {
    let entries: string[] = []
    try {
      entries = (await readdir(root, { withFileTypes: true }))
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name)
    } catch {
      continue
    }
    for (const dir of entries) {
      const name = await canonicalNameOf(root, dir)
      if (name !== undefined && name === skillName) return join(root, dir)
    }
  }
  return undefined
}

/** 一个技能目录的规范名（frontmatter name，缺省回落目录名）；非技能目录返回 undefined。 */
async function canonicalNameOf(root: string, dir: string): Promise<string | undefined> {
  try {
    const raw = await readFile(join(root, dir, SKILL_FILE), "utf8")
    const field = splitFrontmatter(raw).fields.find(item => item.key === "name")?.value
    return field !== undefined && field !== "" ? field : dir
  } catch {
    return undefined
  }
}

/**
 * 技能别名索引：目录名与 frontmatter name 都指向规范名。
 * .bundles.json 历史上混着记过两种名字，整包开关与预设层要先归一。
 */
async function skillNameIndex(): Promise<Map<string, string>> {
  const index = new Map<string, string>()
  for (const root of allRoots()) {
    let entries: string[] = []
    try {
      entries = (await readdir(root, { withFileTypes: true }))
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name)
    } catch {
      continue
    }
    for (const dir of entries) {
      const name = await canonicalNameOf(root, dir)
      if (name === undefined) continue
      if (!index.has(dir)) index.set(dir, name)
      if (!index.has(name)) index.set(name, name)
    }
  }
  return index
}

/** 账本条目数组 → 规范技能名数组（解析不到的原样保留，交给调用方处理）。 */
async function canonicalSkillNames(entries: readonly string[]): Promise<string[]> {
  const index = await skillNameIndex()
  const names: string[] = []
  for (const entry of entries) {
    const name = index.get(entry) ?? entry
    if (!names.includes(name)) names.push(name)
  }
  return names
}

/** Read a skill's SKILL.md raw text; undefined when missing. */
async function readSkillFile(skillName: string): Promise<{ dir: string; raw: string } | undefined> {
  const dir = await locateSkillDir(skillName)
  if (dir === undefined) return undefined
  try {
    return { dir, raw: await readFile(join(dir, SKILL_FILE), 'utf8') }
  } catch {
    return undefined
  }
}

/**
 * 解析 frontmatter 块,返回 { block: 原始块文本(含 --- 围栏,无则 undefined),
 * body: 去掉 frontmatter 后的正文, fields: {key: value} }。
 * 仅解析顶层 `key: value` 行;块外内容原样保留。
 */
function splitFrontmatter(raw: string): {
  hasFence: boolean
  fields: Array<{ key: string; value: string }>
  body: string
} {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw)
  if (match === null) {
    return { hasFence: false, fields: [], body: raw }
  }
  const block = match[1]!
  const fields: Array<{ key: string; value: string }> = []
  for (const line of block.split(/\r?\n/)) {
    const pair = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line)
    if (pair !== null) fields.push({ key: pair[1]!, value: pair[2]!.trim() })
  }
  return { hasFence: true, fields, body: raw.slice(match[0].length) }
}

/** 读技能当前开关状态(true = 启用)。 */
function parseEnabled(fields: Array<{ key: string; value: string }>): boolean {
  const userInvocable = fields.find(field => field.key === 'user-invocable')?.value
  const disableModel = fields.find(field => field.key === 'disable-model-invocation')?.value
  const userDisabled = userInvocable?.toLowerCase() === 'false'
  const modelDisabled = disableModel?.toLowerCase() === 'true'
  return !(userDisabled || modelDisabled)
}

/** 设置单个技能开关。 */
/**
 * 全局开关一个技能：写进隐藏账本，由闸门 provider 在内核目录里遮掉。
 *
 * 不再改写 SKILL.md 的 frontmatter —— 那对随安装/插件提供的技能根本不可写，
 * 也会把用户的原文件改脏。隐藏账本对**所有来源**一致生效，且随时可逆。
 * @param skillName - 技能规范名。
 * @param enabled - false = 隐藏（模型目录不列、`skill` 工具拒绝加载）。
 * @returns 是否处理（技能名合法即成功；是否存在于目录由面板保证）。
 */
async function setSkillEnabled(skillName: string, enabled: boolean): Promise<boolean> {
  if (!isSkillName(skillName)) return false
  const hidden = new Set(await readHidden())
  if (enabled) {
    if (!hidden.delete(skillName)) return true
  } else if (!hidden.has(skillName)) {
    hidden.add(skillName)
  } else {
    return true
  }
  await writeHidden(hidden)
  return true
}

/** 设置一个技能包内全部技能开关;返回处理数。 */
async function setBundleEnabled(bundleId: string, enabled: boolean): Promise<number> {
  const root = managedRoot()
  const ledger = await readBundles(root)
  const record = ledger.bundles.find(bundle => bundle.id === bundleId)
  if (record === undefined) return -1
  let handled = 0
  // 账本条目可能是目录名（历史写入）：先归一到规范名，闸门才遮得住。
  for (const skillName of await canonicalSkillNames(record.skills)) {
    if (await setSkillEnabled(skillName, enabled)) handled += 1
  }
  return handled
}

/**
 * 全量状态:每个技能与每个技能包的启用状态。
 *
 * 技能名取自内核目录（所有来源），启用状态 = 不在全局隐藏账本里；文件层面的
 * frontmatter 开关仍然尊重（内核自己会把它算进 invocation，这里只额外叠加
 * 我们的隐藏账本，避免两套语义互相覆盖）。
 */
async function status(ctx: PluginContext, workspace?: string): Promise<{ skills: Record<string, boolean>; bundles: Record<string, boolean> }> {
  const skills: Record<string, boolean> = {}
  const hidden = await readHidden()
  const viewList = workspace !== undefined && workspace.trim() !== ''
    ? await kernelSkillViews(ctx, undefined, workspace)
    : []
  const summaries = viewList.length > 0
    ? viewList.map((view) => ({ name: view.name }))
    : await kernelSkillSummaries(ctx)
  if (summaries.length > 0) {
    for (const summary of summaries) {
      const name = typeof summary?.name === 'string' ? summary.name : ''
      if (name === '') continue
      skills[name] = !hidden.has(name)
    }
  } else {
    // 内核 skills 服务缺失（裸组装/测试）：退回扫可写根，面板仍有状态可显示。
    const seen = new Set<string>()
    for (const root of allRoots()) {
      let entries: string[] = []
      try {
        entries = (await readdir(root, { withFileTypes: true }))
          .filter(entry => entry.isDirectory())
          .map(entry => entry.name)
      } catch {
        continue
      }
      for (const dir of entries) {
        if (seen.has(dir)) continue
        seen.add(dir)
        try {
          const fields = splitFrontmatter(await readFile(join(root, dir, SKILL_FILE), 'utf8')).fields
          const nameField = fields.find(field => field.key === 'name')?.value
          const name = nameField !== undefined && nameField !== '' ? nameField : dir
          skills[name] = !hidden.has(name) && parseEnabled(fields)
        } catch {
          // 非技能目录或不可读：跳过。
        }
      }
    }
  }
  const bundles: Record<string, boolean> = {}
  const ledger = await readBundles(managedRoot())
  const alias = await skillNameIndex()
  for (const record of ledger.bundles) {
    // 账本条目可能是目录名（历史写入）：先归一到规范名再查状态。
    const states = record.skills.map(skillName => skills[alias.get(skillName) ?? skillName])
    bundles[record.id] = states.length === 0 || states.every(state => state !== false)
  }
  return { skills, bundles }
}

/**
 * 某个（预设, 工作区）视角下的**有效**启用状态。
 *
 * 三层优先级固定为 工作区 > 预设 > 全局：
 *  - 全局隐藏（hidden 账本）是基底；
 *  - 预设层 `false` 关闭，`true`/缺省继承；
 *  - 工作区层显式 `true` 可以把预设/全局关掉的技能重新打开（同名覆盖语义）。
 *
 * @param ctx - 宿主上下文。
 * @param presetId - 预设 id；省略表示只看全局/工作区。
 * @param workspace - 工作区 cwd；省略表示不叠加工作区层。
 * @returns 与 `/status` 同形状的有效状态。
 */
async function effectiveStatus(
  ctx: PluginContext,
  presetId?: string,
  workspace?: string,
): Promise<{ skills: Record<string, boolean>; bundles: Record<string, boolean> }> {
    const base = await status(ctx, workspace)
  if (presetId === undefined && workspace === undefined) return base
  const presetTable = presetId === undefined ? {} : ((await readLedger()).presets[presetId] ?? {})
  const wsKey = workspace === undefined || workspace.trim() === '' ? undefined : normalizeCwd(workspace)
  const wsTable = wsKey === undefined ? {} : ((await readWorkspaceLedger()).workspaces[wsKey] ?? {})
  const names = new Set<string>([...Object.keys(presetTable), ...Object.keys(wsTable)])
  if (names.size === 0) return base
  const skills = { ...base.skills }
  for (const name of names) {
    let disabled: boolean
    if (Object.hasOwn(wsTable, name)) disabled = wsTable[name] === false
    else if (Object.hasOwn(presetTable, name)) disabled = presetTable[name] === false
    else continue
    // 只在目录里真实存在的技能上覆盖；账本里的脏名字不往响应里加。
    if (skills[name] === undefined) continue
    skills[name] = !disabled
  }
  // 技能包状态由成员技能重新投影（成员可能被预设/工作区单独打开或关闭）。
  const bundles = { ...base.bundles }
  const ledger = await readBundles(managedRoot())
  const alias = await skillNameIndex()
  for (const record of ledger.bundles) {
    const states = record.skills.map((skillName) => skills[alias.get(skillName) ?? skillName])
    bundles[record.id] = states.length === 0 || states.every((state) => state !== false)
  }
  return { skills, bundles }
}

/** ── 预设闸门:把「该预设下被关掉的技能」在 agent 层遮成不可调用 ─────────── */

/**
 * 给一个 agent 装闸门 provider。
 *
 * `skills.registerProvider()` 按调用方 ctx 的 scope 归层,而 `agent.ctx` 正好
 * 携带该 agent 的 scope,所以这个 provider 只属于这一个 agent;读取时 agent 层
 * 是最近层,同名条目直接盖住 global 层的真实技能 —— 不必碰 SKILL.md,
 * 也不影响其它预设/其它 agent。
 *
 * list() 只查内存账本(无 I/O);get() 一律返回 undefined,于是 `skill` 工具
 * 即使被硬点名也加载不到内容。
 * @param ctx - host 上下文(仅用于日志)。
 * @param agent - 目标 agent(需带 ctx 与 scope)。
 * @returns 该 agent 的闸门 fiber,agent 销毁时由调用方 dispose。
 */
/**
 * 全局楼层闸门：把「全局隐藏」的技能在**全局层**遮掉。
 *
 * per-agent 闸门只能盖住它自己那一层：读目录时的 scope 一旦落回全局层
 * （无会话、跨会话读、别的 profile 的实例），隐藏就失效。全局层闸门对
 * 任何读取路径都生效，是「插件全权接管显隐」的兜底。
 * @param ctx - host 上下文（注册进全局层）。
 * @returns 闸门 fiber。
 */
function installGlobalMask(ctx: PluginContext): any {
  return ctx.inject(['skills'], (scope: any) => {
    // 裸组装（脚本/测试）里 skills 服务可能缺席：跳过闸门，路由照常可用。
    if (typeof scope?.skills?.registerProvider !== 'function') return
    scope.skills.registerProvider((control: any) => {
      maskInvalidators.add(control.invalidate)
      control.signal.addEventListener('abort', () => {
        maskInvalidators.delete(control.invalidate)
      }, { once: true })
      return {
        name: `${MASK_PROVIDER}-global`,
        list: async () => {
          const hidden = await readHidden()
          if (hidden.size === 0) return []
          return [...hidden].map(skillName => ({
            name: skillName,
            description: 'disabled by dsh-prompt-customizer',
            invocation: { modelInvocable: false, userInvocable: false },
            source: 'custom',
            provider: `${MASK_PROVIDER}-global`,
            // 负 rank：同层压过任何真实来源，否则同名去重会留下真技能。
            rank: -1,
            locator: null,
          }))
        },
        get: async () => undefined,
      }
    })
  })
}

function installMask(ctx: PluginContext, agent: any): any {
  const presetOf = (): string => {
    const presets = optionalService(ctx, 'agentPresets')
    if (presets?.composedPreset === undefined) return ''
    try { return presets.composedPreset(agent.ctx) ?? '' } catch { return '' }
  }
  return agent.ctx.inject(['skills'], (scope: any) => {
    scope.skills.registerProvider((control: any) => {
      maskInvalidators.add(control.invalidate)
      control.signal.addEventListener('abort', () => {
        maskInvalidators.delete(control.invalidate)
      }, { once: true })
      return {
        name: MASK_PROVIDER,
        list: async () => {
          const presetId = presetOf()
          const rawCwd = typeof agent?.session?.header?.cwd === 'string' ? agent.session.header.cwd : ''
          const cwd = rawCwd === '' ? '' : normalizeCwd(rawCwd)
          // 三层优先级：工作区 > 预设 > 全局。工作区显式 true 可覆盖预设/全局的关闭。
          const globalHidden = await readHidden()
          const presetTable = presetId !== '' ? ((await readLedger()).presets[presetId] ?? {}) : {}
          const wsTable = cwd !== '' ? ((await readWorkspaceLedger()).workspaces[cwd] ?? {}) : {}
          const disabled = new Set<string>()
          for (const name of new Set<string>([...globalHidden, ...Object.keys(presetTable), ...Object.keys(wsTable)])) {
            let isDisabled: boolean
            if (Object.hasOwn(wsTable, name)) isDisabled = wsTable[name] === false
            else if (Object.hasOwn(presetTable, name)) isDisabled = presetTable[name] === false
            else isDisabled = globalHidden.has(name)
            if (isDisabled) disabled.add(name)
          }
          if (disabled.size === 0) return []
          return [...disabled].map(skillName => ({
            name: skillName,
            description: `disabled by dsh-prompt-customizer${presetId === '' ? '' : ` for preset "${presetId}"`}`,
            invocation: { modelInvocable: false, userInvocable: false },
            source: 'custom',
            provider: MASK_PROVIDER,
            // 负 rank：同一层里压过任何真实来源（bundled=BUNDLED_SKILL_RANK 600、
            // project=100、user=400/500），否则同名去重会留下真技能。
            rank: -1,
            locator: null,
          }))
        },
        // 被遮住的名字没有可加载的正文:调用方拿到 undefined 即等于「不存在」。
        get: async () => undefined,
      }
    })
  })
}

/** 当前 preset 名单(设置页据此列圆球;服务缺失时返回空数组)。
 *
 * `trust` 不再是 0.1.7 之前 list() 给的字段（那时它是随安装/用户根的标记），
 * 改为按 profile patch 是否已覆盖该预设行推导：已覆盖（本地定制过）= user，
 * 仍由随安装的 bundle 声明 = system。
 */
export async function readPresetRoster(ctx: PluginContext): Promise<Array<Record<string, unknown>>> {
  const presets = optionalService(ctx, 'agentPresets')
  if (presets?.list === undefined) return []
  try {
    const rows = await presets.list()
    const defaultId = presets.defaultId
    return (Array.isArray(rows) ? rows : [])
      .map((row: any) => ({
        id: String(row?.id ?? ''),
        trust: presetTrustOf(ctx, String(row?.id ?? '')),
        isDefault: row?.id === defaultId,
        ...typeof row?.name === 'string' ? { name: row.name } : {},
        ...typeof row?.description === 'string' ? { description: row.description } : {},
        ...typeof row?.order === 'number' ? { order: row.order } : {},
        // 激活失败诊断必须透传：面板据此提示「该预设的组合行挂不起来」，
        // 丢掉 broken 会让坏预设看起来和好预设一样。
        ...typeof row?.broken === 'string' && row.broken !== '' ? { broken: row.broken } : {},
      }))
      .filter((row: any) => row.id !== '')
  } catch (error: any) {
    console.log('[skill-toggles] agentPresets.list failed:', error?.message ?? error)
    return []
  }
}

/** ── HTTP plumbing (same contract as skill-manager) ─────────────────────── */

function json(res: ServerResponse, status: number, value: unknown): void {
  const body = JSON.stringify(value)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-cache',
  })
  res.end(body)
}

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolvePromise, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(new Error('request body too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      if (chunks.length === 0) {
        resolvePromise({})
        return
      }
      try {
        resolvePromise(JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown)
      } catch {
        reject(new Error('invalid JSON body'))
      }
    })
    req.on('error', reject)
  })
}

/** Route dispatch for one /api/skill-toggles request. */
async function handle(ctx: PluginContext, req: IncomingMessage, res: ServerResponse): Promise<void> {
  const trust = requireTrustedRequest(ctx, req)
  if (!trust.ok) {
    rejectUntrusted(res, trust)
    return
  }
  const url = new URL(req.url ?? '/', 'http://localhost')
  const rest = url.pathname.slice(ROUTE_PREFIX.length)
  const method = req.method ?? 'GET'
  try {
    if (method === 'GET' && (rest === '' || rest === '/status')) {
      const presetId = url.searchParams.get('preset') ?? undefined
      const workspace = url.searchParams.get('workspace') ?? undefined
      const effective = await effectiveStatus(ctx, presetId, workspace)
      const scoped = presetId !== undefined || workspace !== undefined
      json(res, 200, scoped
        ? {
            ...effective,
            scope: {
              ...presetId === undefined ? {} : { preset: presetId },
              ...workspace === undefined ? {} : { workspace: normalizeCwd(workspace) },
            },
            global: await status(ctx),
          }
        : effective)
      return
    }
    const matchSkill = /^\/skills\/([^/]+)$/.exec(rest)
    if (method === 'PUT' && matchSkill !== null) {
      const body = (await readBody(req)) as Record<string, unknown>
      const enabled = body.enabled
      if (typeof enabled !== 'boolean') throw new Error('enabled must be a boolean')
      const name = decodeURIComponent(matchSkill[1]!)
      const ok = await setSkillEnabled(name, enabled)
      if (!ok) throw new Error(`skill ${JSON.stringify(name)} not found`)
      json(res, 200, { ok: true, name, enabled })
      return
    }
    const matchBundle = /^\/bundles\/([^/]+)$/.exec(rest)
    if (method === 'PUT' && matchBundle !== null) {
      const body = (await readBody(req)) as Record<string, unknown>
      const enabled = body.enabled
      if (typeof enabled !== 'boolean') throw new Error('enabled must be a boolean')
      const id = decodeURIComponent(matchBundle[1]!)
      const handled = await setBundleEnabled(id, enabled)
      if (handled < 0) throw new Error(`bundle ${JSON.stringify(id)} not found`)
      json(res, 200, { ok: true, id, enabled, handled })
      return
    }

    // ── 预设层 ────────────────────────────────────────────────────────────
    if (method === 'GET' && rest === '/presets') {
      const workspace = url.searchParams.get('workspace') ?? undefined
      const [roster, global, ledger] = await Promise.all([
        readPresetRoster(ctx), status(ctx), readLedger(),
      ])
      const effective = workspace === undefined ? global : await effectiveStatus(ctx, undefined, workspace)
      json(res, 200, {
        presets: roster,
        overrides: ledger.presets,
        skills: effective.skills,
        bundles: effective.bundles,
      })
      return
    }
    const matchPresetSkill = /^\/presets\/([^/]+)\/skills\/([^/]+)$/.exec(rest)
    if (method === 'PUT' && matchPresetSkill !== null) {
      const body = (await readBody(req)) as Record<string, unknown>
      const enabled = body.enabled
      if (typeof enabled !== 'boolean') throw new Error('enabled must be a boolean')
      const presetId = decodeURIComponent(matchPresetSkill[1]!)
      if (!isPresetId(presetId)) throw new Error(`invalid preset id ${JSON.stringify(presetId)}`)
      const skillName = decodeURIComponent(matchPresetSkill[2]!)
      if (!isSkillName(skillName)) throw new Error(`invalid skill name ${JSON.stringify(skillName)}`)
      const changed = await setPresetSkills(presetId, [skillName], enabled)
      json(res, 200, { ok: true, preset: presetId, name: skillName, enabled, changed })
      return
    }
    const matchPresetBundle = /^\/presets\/([^/]+)\/bundles\/([^/]+)$/.exec(rest)
    if (method === 'PUT' && matchPresetBundle !== null) {
      const body = (await readBody(req)) as Record<string, unknown>
      const enabled = body.enabled
      if (typeof enabled !== 'boolean') throw new Error('enabled must be a boolean')
      const presetId = decodeURIComponent(matchPresetBundle[1]!)
      if (!isPresetId(presetId)) throw new Error(`invalid preset id ${JSON.stringify(presetId)}`)
      const bundleId = decodeURIComponent(matchPresetBundle[2]!)
      const ledger = await readBundles(managedRoot())
      const record = ledger.bundles.find(bundle => bundle.id === bundleId)
      if (record === undefined) throw new Error(`bundle ${JSON.stringify(bundleId)} not found`)
      // 预设层账本按规范名记账：目录名条目要先归一，否则闸门遮不住技能。
      const changed = await setPresetSkills(presetId, await canonicalSkillNames(record.skills), enabled)
      json(res, 200, { ok: true, preset: presetId, id: bundleId, enabled, changed })
      return
    }
    const matchPresetReset = /^\/presets\/([^/]+)\/reset$/.exec(rest)
    if (method === 'POST' && matchPresetReset !== null) {
      const presetId = decodeURIComponent(matchPresetReset[1]!)
      if (!isPresetId(presetId)) throw new Error(`invalid preset id ${JSON.stringify(presetId)}`)
      const current = await readLedger()
      if (current.presets[presetId] !== undefined) {
        const presets = { ...current.presets }
        delete presets[presetId]
        await writeLedger({ version: 1, presets })
      }
      json(res, 200, { ok: true, preset: presetId })
      return
    }

    // ── 工作区层 ──────────────────────────────────────────────────────────
    if (method === 'GET' && rest === '/workspaces') {
      const ledger = await readWorkspaceLedger()
      json(res, 200, { workspaces: ledger.workspaces })
      return
    }
    const matchWsSkill = /^\/workspaces\/([^/]+)\/skills\/([^/]+)$/.exec(rest)
    if (method === 'PUT' && matchWsSkill !== null) {
      const body = (await readBody(req)) as Record<string, unknown>
      const enabled = body.enabled
      if (typeof enabled !== 'boolean') throw new Error('enabled must be a boolean')
      const cwd = decodeURIComponent(matchWsSkill[1]!)
      const skillName = decodeURIComponent(matchWsSkill[2]!)
      if (!isSkillName(skillName)) throw new Error(`invalid skill name ${JSON.stringify(skillName)}`)
      const changed = await setWorkspaceSkills(cwd, [skillName], enabled)
      json(res, 200, { ok: true, workspace: normalizeCwd(cwd), name: skillName, enabled, changed })
      return
    }
    const matchWsBundle = /^\/workspaces\/([^/]+)\/bundles\/([^/]+)$/.exec(rest)
    if (method === 'PUT' && matchWsBundle !== null) {
      const body = (await readBody(req)) as Record<string, unknown>
      const enabled = body.enabled
      if (typeof enabled !== 'boolean') throw new Error('enabled must be a boolean')
      const cwd = decodeURIComponent(matchWsBundle[1]!)
      const bundleId = decodeURIComponent(matchWsBundle[2]!)
      const ledger = await readBundles(managedRoot())
      const record = ledger.bundles.find(bundle => bundle.id === bundleId)
      if (record === undefined) throw new Error(`bundle ${JSON.stringify(bundleId)} not found`)
      const changed = await setWorkspaceSkills(cwd, await canonicalSkillNames(record.skills), enabled)
      json(res, 200, { ok: true, workspace: normalizeCwd(cwd), id: bundleId, enabled, changed })
      return
    }
    const matchWsReset = /^\/workspaces\/([^/]+)\/reset$/.exec(rest)
    if (method === 'POST' && matchWsReset !== null) {
      const cwd = decodeURIComponent(matchWsReset[1]!)
      const current = await readWorkspaceLedger()
      const key = normalizeCwd(cwd)
      if (current.workspaces[key] !== undefined) {
        const workspaces = { ...current.workspaces }
        delete workspaces[key]
        await writeWorkspaceLedger({ version: 1, workspaces })
      }
      json(res, 200, { ok: true, workspace: key })
      return
    }
    json(res, 404, { error: `no route for ${method} ${rest}` })
  } catch (error) {
    json(res, 400, { error: error instanceof Error ? error.message : String(error) })
  }
}

/** Mount the routes and install the per-agent preset masks. */
export async function apply(ctx: PluginContext): Promise<void> {
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: ROUTE_PREFIX,
    handler: (req: IncomingMessage, res: ServerResponse) => {
      void handle(ctx, req, res)
    },
  }), 'triad: skill-toggles routes')

  // 全局层闸门（隐藏账本）：任何读取路径都能遮住，不依赖会话/作用域。
  ctx.effect(() => installGlobalMask(ctx), 'triad: skill-toggles global mask')

  // 面板目录（kernel-skills）按同一本账过滤：关掉的技能不出现，双保险。
  setHiddenSkillReader(() => readHidden())

  // 闸门:每个 agent 一个,注册进它自己的 scope 层。agents 服务缺失(裸组装)
  // 时降级为「只有全局层开关」,不影响路由。
  ctx.effect(() => {
    const fibers = new Map<any, any>()
    const install = (agent: any): void => {
      if (agent === undefined || fibers.has(agent)) return
      try {
        fibers.set(agent, installMask(ctx, agent))
      } catch (error: any) {
        console.log('[skill-toggles] preset mask install failed:', error?.message ?? error)
      }
    }
    const remove = (agent: any): void => {
      const fiber = fibers.get(agent)
      if (fiber === undefined) return
      fibers.delete(agent)
      void Promise.resolve(fiber.dispose?.()).catch(() => {})
    }
    const agents = ctx.get?.('agents')
    if (agents?.list !== undefined) for (const agent of agents.list()) install(agent)
    const offCreated = ctx.on('agent/created', ({ agent }: any) => { install(agent) })
    const offDisposed = ctx.on('agent/disposed', ({ agent }: any) => { remove(agent) })
    return () => {
      offCreated()
      offDisposed()
      for (const agent of [...fibers.keys()]) remove(agent)
      maskInvalidators.clear()
    }
  }, 'triad: skill-toggles preset masks')
}

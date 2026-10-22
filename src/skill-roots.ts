/**
 * skill-roots — 技能根的单一来源（用户级 + 工作区级）。
 *
 * DSH 内核 `@deepseek-ai/dsh-skill-filesystem` 按 5 类根扫描技能
 * （`packages/skill/skill-filesystem/src/index.ts` 的 `roots()`）：
 *
 *   100 project-dsh      `<projectRoot>/.dsh/skills`
 *   200 project-agents   `<projectRoot>/.agents/skills`
 *   300 custom           `Config.customSkillDirs`
 *   400 user-dsh         `<dshHome>/skills`
 *   500 user-agents      `<agentsHome>/skills`
 *
 * 本插件此前面板只扫 400/500 两个用户级根，于是内核看得见、面板看不见的技能
 * （工作区里放的那些）无法归组、开关、查看文件。这里把 100/200 补齐，并保持
 * 与内核一致的先后顺序（工作区优先，同名时先出现的胜出）。
 *
 * 工作区 = 会话 cwd。面板是进程级单例，没有「当前会话」的概念，因此取
 * **所有活动 agent 的 cwd ∪ 启动 cwd** 的并集；没有活动 agent 时只剩启动 cwd。
 * 内核的项目根判定是「最近的含 .git 的祖先，没有则 cwd」，这里照抄该规则，
 * 否则 `<ws>/sub/dir` 会话会漏掉 `<ws>/.agents/skills`。
 *
 * 三个消费方（技能面板 / 技能健康 / 技能开关）共用 {@link currentSkillRoots}：
 * 宿主在挂载时算一次并写入，路由每次请求读同一份，避免三处各自推导出不同根集合。
 */

import { readdir, stat } from 'node:fs/promises'
import { dirname, join, resolve, sep } from 'node:path'
import { agentsHome, dshHome } from './home-paths.ts'

/** 根的来源标签（与内核 source 同名，便于对照）。 */
export type SkillRootLabel = 'project-dsh' | 'project-agents' | 'user-dsh' | 'user-agents'

/** 一个技能根：绝对路径 + 面板展示用的来源标签。 */
export interface SkillRoot {
  path: string
  label: SkillRootLabel
  /** 工作区根的绝对路径（仅工作区级根有）。 */
  workspace?: string
}

/** 运行时可选的宿主面（agent 名单 / 启动上下文）在类型上放宽。 */
type PluginContext = any

/** 用户级根：`<agentsHome>/skills`（可写）与 `<dshHome>/skills`（内核会跳过 .system）。 */
export function userSkillRoots(): SkillRoot[] {
  return [
    { path: join(agentsHome(), 'skills'), label: 'user-agents' },
    { path: join(dshHome(), 'skills'), label: 'user-dsh' },
  ]
}

/** 单个工作区的两个技能根（顺序与内核 rank 一致：.dsh 先于 .agents）。 */
export function workspaceSkillRoots(workspace: string): SkillRoot[] {
  return [
    { path: join(workspace, '.dsh', 'skills'), label: 'project-dsh', workspace },
    { path: join(workspace, '.agents', 'skills'), label: 'project-agents', workspace },
  ]
}

/** 见 {@link findProjectRoot}。 */
async function hasGitDir(dir: string): Promise<boolean> {
  try {
    return (await stat(join(dir, '.git'))).isDirectory()
  } catch {
    return false
  }
}

/**
 * 内核同款项目根判定：最近的含 `.git` 的祖先目录，到文件系统根仍未命中则用 cwd。
 * @param cwd - 会话工作目录。
 * @returns 项目根绝对路径。
 */
export async function findProjectRoot(cwd: string): Promise<string> {
  let current = resolve(cwd)
  while (true) {
    if (await hasGitDir(current)) return current
    const parent = dirname(current)
    if (parent === current) return resolve(cwd)
    current = parent
  }
}

/** 启动目录：profile 的 cwd，缺失时回落进程 cwd。 */
function launchCwd(ctx: PluginContext): string {
  const fromProfile = ctx?.profileContext?.cwd
  if (typeof fromProfile === 'string' && fromProfile.trim() !== '') return resolve(fromProfile)
  return resolve(process.cwd())
}

/** 所有活动 agent 的会话 cwd（去重；顺序按 agent 名单）。 */
function agentCwds(ctx: PluginContext): string[] {
  const agents = ctx?.get?.('agents')
  const list: unknown = typeof agents?.list === 'function' ? agents.list() : []
  const out: string[] = []
  for (const agent of Array.isArray(list) ? list : []) {
    const cwd = (agent as { session?: { header?: { cwd?: unknown } } } | null)?.session?.header?.cwd
    if (typeof cwd === 'string' && cwd.trim() !== '') out.push(resolve(cwd))
  }
  return out
}

/**
 * 工作区目录集合（已归一到项目根、去重）：活动会话 cwd 在前，启动 cwd 兜底。
 * Windows 下同一路径大小写不同视为同一工作区。
 * @param ctx - 宿主上下文。
 * @returns 项目根绝对路径数组。
 */
export async function workspaceDirs(ctx: PluginContext): Promise<string[]> {
  const seen = new Set<string>()
  const out: string[] = []
  for (const cwd of [...agentCwds(ctx), launchCwd(ctx)]) {
    const root = await findProjectRoot(cwd)
    const key = root.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(root)
  }
  return out
}

/**
 * 全部技能根：工作区级在前（每个工作区 `.dsh/skills` → `.agents/skills`），
 * 用户级在后。与内核 rank 顺序一致，同名技能先出现者胜出。
 * 只返回**存在且是目录**的根，避免面板出现空根。
 * @param ctx - 宿主上下文。
 * @returns 现存技能根（去重）。
 */
export async function resolveSkillRoots(ctx: PluginContext): Promise<SkillRoot[]> {
  const roots: SkillRoot[] = []
  for (const workspace of await workspaceDirs(ctx)) roots.push(...workspaceSkillRoots(workspace))
  roots.push(...userSkillRoots())
  const existing: SkillRoot[] = []
  const seen = new Set<string>()
  for (const root of roots) {
    const key = root.path.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    try {
      if (!(await stat(root.path)).isDirectory()) continue
    } catch {
      continue
    }
    existing.push(root)
  }
  return existing
}

/* ── 进程内共享的根集合（三个消费方读同一份） ───────────────────────────── */

let cachedRoots: SkillRoot[] = userSkillRoots()

/**
 * 写入当前根集合（宿主挂载时算一次；活动工作区变化时重算）。
 * @param roots - 新的根集合；空数组即退回「只有两个用户级根」。
 */
export function setSkillRoots(roots: readonly SkillRoot[]): void {
  cachedRoots = roots.length > 0 ? [...roots] : userSkillRoots()
}

/**
 * 当前根集合（路由请求直接读，不做文件 IO）。
 * @returns 根集合快照。
 */
export function currentSkillRoots(): SkillRoot[] {
  return [...cachedRoots]
}

/**
 * 当前根集合的路径列表，按优先级排列。
 * @returns 绝对路径数组。
 */
export function currentRootPaths(): string[] {
  return cachedRoots.map((root) => root.path)
}

/** 该路径属于哪个根（用于把技能目录映射回来源标签）。 */
export function rootOfPath(path: string): SkillRoot | undefined {
  const target = resolve(path).toLowerCase()
  return cachedRoots.find((root) => {
    const base = resolve(root.path).toLowerCase()
    return target === base || target.startsWith(`${base}${sep}`)
  })
}

/** 一个根下的技能目录名（目录项，非递归；读不到返回空数组）。 */
export async function skillDirsUnder(root: string): Promise<string[]> {
  try {
    const entries = await readdir(root, { withFileTypes: true })
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)
  } catch {
    return []
  }
}

/** 可写根：工作区级根与用户 `~/.agents/skills`；`~/.dsh/skills` 保留只读判定余地。 */
export function isWritableRoot(root: SkillRoot): boolean {
  return root.label !== 'user-dsh'
}

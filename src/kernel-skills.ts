/**
 * kernel-skills — 技能列表直接读内核注册表，不再自搓目录扫描。
 *
 * 内核 `@deepseek-ai/dsh-skill-filesystem` 只负责「文件系统那几类根」，真正聚合
 * 全部来源的是 `ctx.skills`（`packages/skill/skill/src/index.ts`）：
 *
 *   - 文件系统 provider：project-dsh / project-agents / custom / user-dsh / user-agents
 *   - `bundled`：随安装提供的技能（app.asar 内）
 *   - 运行时 provider：`@deepseek-ai/dsh-skill-office`（office* 七个）等
 *   - 插件自注册 provider：如 browser-skill 插件
 *
 * 所以面板要「模型真正能用的那一套」，唯一正确的来源就是 `agent.ctx.skills.list()`：
 * 它按该 agent 的 scope 链合并（我们的预设闸门 provider 也在链上），并按调用时的
 * cwd 解析项目根。自己再扫一遍目录只会在 root 顺序/去重/只读来源上和对不齐。
 *
 * 「当前会话」怎么定：面板是进程级单例，内核客户端把当前会话存在渲染期状态里
 * （`uiSession` 是 hook/selector 面，非渲染上下文读不到）。这里取**最新创建的根会话**
 * （`agents.roots()` 按 `session.header.createdAt` 降序），并为将来留一个显式
 * `sessionId` 覆盖口 —— 与内核一致的那份 cwd 由此确定。
 */

import { basename, dirname, resolve } from 'node:path'
import { currentRootPaths } from './skill-roots.ts'

/** 运行时上下文在类型上放宽（与其它 host 模块同惯例）。 */
type PluginContext = any

/**
 * 隐藏账本的读取口（由 `skill-toggles` 注入，避免两模块循环 import）。
 * 未注入时视为「没有任何隐藏」。
 */
let hiddenReader: (() => Promise<ReadonlySet<string>>) | undefined

/**
 * 注入隐藏账本读取器（技能开关模块在 apply 时调用一次）。
 * @param reader - 返回当前隐藏技能名集合。
 */
export function setHiddenSkillReader(reader: (() => Promise<ReadonlySet<string>>) | undefined): void {
  hiddenReader = reader
}

/** 内核 `SkillSummary` 里本模块用到的字段（其余字段不依赖，避免绑死内核小版本）。 */
interface KernelSkillSummary {
  name: string
  description?: string
  source?: string
  provider?: string
  path?: string
  invocation?: { modelInvocable?: boolean; userInvocable?: boolean }
}

/** vendor 技能管理器消费的视图（字段名与 `vendor/skill-manager/skills-host.js` 对齐）。 */
export interface KernelSkillView {
  name: string
  dir: string
  description: string
  compatibility: string
  fileCount: number
  files: string[]
  /** 来源标签（内核 source，原样透出，供面板/日志区分）。 */
  root: string
  /** 技能目录绝对路径（内核给了 instruction 文件路径时才有）。 */
  dirPath?: string
  /**
   * 该技能是否落在可写根（仅用于「删除文件」这一个动作）。
   * 显隐不区分来源：所有技能都能被开关（走内核分层遮蔽）。
   */
  deletable: boolean
  /** 模型可调用 / 用户可调用（内核 invocation 策略，当前只作展示）。 */
  modelInvocable?: boolean
  userInvocable?: boolean
}

/** 一个候选会话（根 agent）的必要信息。 */
interface SessionCandidate {
  agent: any
  id: string
  cwd: string
  createdAt: number
}

/** 取 agents 服务（可选服务用 ctx.get，不用属性代理）。 */
function agentsOf(ctx: PluginContext): any {
  return typeof ctx?.get === 'function' ? ctx.get('agents') : undefined
}

/** 根会话候选（只取有 cwd 的；按创建时间降序）。 */
function sessionCandidates(ctx: PluginContext): SessionCandidate[] {
  const agents = agentsOf(ctx)
  const roots: any[] = typeof agents?.roots === 'function'
    ? agents.roots()
    : (typeof agents?.list === 'function' ? agents.list() : [])
  const out: SessionCandidate[] = []
  for (const agent of Array.isArray(roots) ? roots : []) {
    const header = agent?.session?.header
    const cwd = header?.cwd
    const id = header?.id
    if (typeof cwd !== 'string' || cwd.trim() === '') continue
    if (typeof id !== 'string' || id === '') continue
    const createdAt = typeof header?.createdAt === 'number' ? header.createdAt : 0
    out.push({ agent, id, cwd: resolve(cwd), createdAt })
  }
  out.sort((left, right) => right.createdAt - left.createdAt)
  return out
}

/**
 * 选定要展示的那个会话：显式 `sessionId` 优先，否则取最新创建的根会话。
 * @param ctx - 宿主上下文。
 * @param sessionId - 可选的显式会话 id。
 * @returns 会话候选，未找到时 undefined。
 */
export function resolveViewSession(ctx: PluginContext, sessionId?: string): SessionCandidate | undefined {
  const candidates = sessionCandidates(ctx)
  if (sessionId !== undefined && sessionId !== '') {
    const exact = candidates.find((item) => item.id === sessionId)
    if (exact !== undefined) return exact
  }
  return candidates[0]
}

/** 该目录是否落在可写根（用户级 `~/.agents/skills` 等 + 工作区那两处）之下。 */
function isWritableDir(dir: string | undefined): boolean {
  if (dir === undefined) return false
  const target = resolve(dir).toLowerCase()
  return currentRootPaths().some((root) => {
    const base = resolve(root).toLowerCase()
    return target === base || target.startsWith(`${base}\\`) || target.startsWith(`${base}/`)
  })
}

/** 启动目录：profile 的 cwd，缺失时回落进程 cwd（无会话时的项目根依据）。 */
function launchCwd(ctx: PluginContext): string {
  const fromProfile = ctx?.profileContext?.cwd
  if (typeof fromProfile === 'string' && fromProfile.trim() !== '') return resolve(fromProfile)
  return resolve(process.cwd())
}

/**
 * 读取内核技能目录。
 *
 * 关键点：内核 registry 的读取是 `[global 层, ...chainLayers(scope)]`
 * （`packages/skill/skill/src/index.ts:556`）—— **不传 `scope` 就只读 global 层**，
 * 会把注册在预设/agent 层里的 provider（绝大多数技能都在这儿）全部漏掉。
 * 所以必须把该 agent ctx 的 scope key 传进去；`scopeOf()` 取的就是 `createScope`
 * 写在 ctx 上的那个 key，与我们给 agent 注册闸门 provider 用的是同一个。
 *
 * 没有会话时退回宿主全局层 + 启动 cwd（此时确实只有全局 provider 可用）。
 *
 * @param ctx - 宿主上下文。
 * @param candidate - 选定的会话，无会话时 undefined。
 * @returns 内核技能摘要数组（服务缺失/读失败时为空数组）。
 */
async function listKernelSkills(ctx: PluginContext, candidate: SessionCandidate | undefined): Promise<KernelSkillSummary[]> {
  const agentCtx = candidate === undefined ? undefined : candidate.agent?.ctx
  const scoped = typeof agentCtx?.get === 'function' ? agentCtx.get('skills') : undefined
  const global = typeof ctx?.get === 'function' ? ctx.get('skills') : undefined
  const service = scoped ?? global
  if (typeof service?.list !== 'function') return []
  const cwd = candidate === undefined ? launchCwd(ctx) : candidate.cwd
  // scope key 就是 agent 对象本身：内核建 agent 时 `createScope(loopCtx, this)`
  // （`core/agent/src/agent.ts:104`）、遮蔽层用 `createScope(ctx, agent)`
  // （`mcp/src/mcp.ts:116`），`scopeChainOf` 走的就是这个对象。
  // 不传 scope 只读 global 层，会把注册在 agent/预设层的 provider 全部漏掉。
  const scope = candidate === undefined ? undefined : candidate.agent
  const listed: unknown = await service.list({ cwd, ...scope === undefined ? {} : { scope } })
  return Array.isArray(listed) ? (listed as KernelSkillSummary[]) : []
}

/**
 * 内核技能目录 → vendor 视图。
 * @param ctx - 宿主上下文。
 * @param sessionId - 可选的显式会话 id。
 * @returns 技能视图（保持内核给定的顺序：先出现的同名者胜出由调用方去重）。
 */
export async function kernelSkillViews(ctx: PluginContext, sessionId?: string): Promise<KernelSkillView[]> {
  const candidate = resolveViewSession(ctx, sessionId)
  const summaries = await listKernelSkills(ctx, candidate)
  const views: KernelSkillView[] = []
  for (const summary of summaries) {
    const name = typeof summary?.name === 'string' ? summary.name : ''
    if (name === '') continue
    // 面板显隐由本插件的账本说了算：内核闸门在模型侧遮过一遍，但目录合并
    // 只按层/rank 去重，同名候选未必每次都压过真实来源，这里再过滤一次，
    // 保证「关掉的技能既不在面板、也不在模型目录里」。
    const hidden = hiddenReader === undefined ? undefined : await hiddenReader()
    if (hidden?.has(name) === true) continue
    // 内核给的是 SKILL.md 的绝对路径；技能目录 = 它的父目录。虚拟技能没有 path。
    const dirPath = typeof summary.path === 'string' && summary.path !== '' ? dirname(summary.path) : undefined
    const source = typeof summary.source === 'string' && summary.source !== '' ? summary.source : 'unknown'
    views.push({
      name,
      dir: dirPath === undefined ? name : basename(dirPath),
      description: typeof summary.description === 'string' ? summary.description : '',
      compatibility: '',
      fileCount: 0,
      files: [],
      root: source,
      ...dirPath === undefined ? {} : { dirPath },
      deletable: isWritableDir(dirPath),
      ...typeof summary.invocation?.modelInvocable === 'boolean' ? { modelInvocable: summary.invocation.modelInvocable } : {},
      ...typeof summary.invocation?.userInvocable === 'boolean' ? { userInvocable: summary.invocation.userInvocable } : {},
    })
  }
  return views
}

/**
 * 当前会话的内核技能摘要（技能开关、技能健康等模块共用，避免各自再扫目录）。
 * @param ctx - 宿主上下文。
 * @returns 内核 `SkillSummary` 数组。
 */
export async function kernelSkillSummaries(ctx: PluginContext): Promise<KernelSkillSummary[]> {
  return listKernelSkills(ctx, resolveViewSession(ctx))
}

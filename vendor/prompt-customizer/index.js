/**
 * dsh-prompt-customizer — 宿主端。
 *
 * - 配置存储在插件自有文件 `~/.dsh/prompt-customizer/config.yaml`（可用组合
 *   入口 `dataDir` 覆盖目录），不再占用主文档 settings.yaml。首次启动时若
 *   新文件不存在而主文档里有旧 `prompt-customizer:` 段，自动迁移（主文档
 *   原样保留，可随时回滚旧版），此后本插件不再注册设置命名空间——主文档
 *   的设置页也不会再显示本段落。
 * - 挂钩 `system-prompt/assemble` 瀑布流，按 {name, source} 身份屏蔽 / 替换 /
 *   注入提示词段，并从模型目录中隐藏工具。段的可编辑清单同时来自「当前预设」
 *   与「同预设活动 agent」的真实装配，因此插件在任意作用域（含 agent 作用域）
 *   用 `systemPrompt.section()` / `context()` 注入的段都能被接管（ADR-0005）。
 * - 提供 `GET /api/prompt-customizer/inventory`（段/工具清单，`?scope=` 可切
 *   agent 预设；`scopeResolved` 标记 scope 是否成功挂载）、
 *   `GET /api/prompt-customizer/config` 与 `POST /config/set|/config/unset`
 *   （单字段读写）、`POST /config/apply`（批量保存，UI 统一保存按钮的写盘通道）。
 *
 * 定制仅使用 `overrides[agentPreset]`，三个阶段各有独立规则。预览只读取
 * 选中模式的 rc.2 作用域租约，结束即释放；从不匹配或切换已有对话。
 * 系统段与 user-role contexts 分开返回；不再有跨预设累计池，清单只来自当前预设
 * 与其同预设活动 agent 的真实装配，预设之间仍然天然隔离。
 * forceSections 在 assemble 返回边界恢复已经求值的段策略，避免 complete
 * 还原和动态 provider 重复执行；关闭时尊重宿主的 complete 接管行为。
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { parse } from 'yaml'
import { Config, NS, WorkspaceOverrides } from './schema.js'
import {
  effectiveConfig,
  hasSectionPolicy,
  pickToolsFilter,
  pickSectionsForStatus,
  pickContextsForStatus,
  filterReplacementsByPhase,
  applySectionPolicy,
  mergeOverrideLayers,
} from './effective.js'
import { PHASES, PHASE_KEYS, phaseOf, phaseOfStatus, statusOfPhase, normalizeEntry, entryKey, entryMatches } from './model.js'
import { createPhaseProjection, presetOfSession, statusOf } from './promotion.js'
import { createConfigStore } from './store.js'
import { openDb, allDocs, replaceAllDocs, setDoc } from './db.js'
import { createPhaseToolVisibility } from './tool-visibility.js'
import { promptSectionNamesForTool, toolsForPromptSection } from './tool-prompt-map.js'

export const name = 'prompt-customizer'
// settings 仍被注入：只读 documentPath 做一次性旧版迁移。cordis 对未在
// inject 里声明的服务调用 ctx.get 会抛错，漏声明会让整个插件加载失败。
export const inject = ['settings', 'systemPrompt', 'tools']

/** assemble 强制覆盖的「原始方法」登记键：跨插件 HMR 重载共享（Symbol.for），
 *  重载后永远包在原始方法之上，避免层层套娃。见 apply() 里的 forceSections。 */
const PATCHED = Symbol.for('prompt-customizer:assemble-pristine')

/** harness home；ponytail: DSH_HOME 为推测的官方环境变量，若宿主日后提供
 *  正式的 home 解析 API 应换过去。回退 `~/.dsh`。 */
function dshHome() {
  return process.env.DSH_HOME ?? path.join(os.homedir(), '.dsh')
}

/** 收集并解析一个请求体（JSON），超过上限直接拒绝——路由是本进程私有的，上限只是防御。 */function readJsonBody(req, limit = 2 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > limit) {
        reject(new Error('request body too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch (error) {
        reject(new Error(`invalid JSON body: ${error.message}`))
      }
    })
    req.on('error', reject)
  })
}

/** 名单里是否有条目命中候选（name+source 身份）。 */
function matchesAny(entries, candidate) {
  return (Array.isArray(entries) ? entries : []).some((entry) => entryMatches(entry, candidate))
}

/**
 * 通用过滤空的非 required 运行时上下文。宿主 PromptContext 公开了 `required`
 * 标记：required（如 working-directory:current）即使当前文本为空也保留；
 * 其它可选上下文为空时不进入 UI（不按名字特判任何插件）。
 * 读不到 layers（测试 / 旧宿主）时不做过滤，保持原样。
 */
function requiredContextNames(ctx, scope) {
  try {
    const layers = ctx?.systemPrompt?.layers
    if (!layers || typeof layers.merge !== 'function') return undefined
    const entries = layers.merge(scope, (layer) => layer.contexts)
    const names = new Set()
    for (const [name, context] of entries) {
      if (context?.required === true) names.add(String(name))
    }
    return names
  } catch {
    return undefined
  }
}

export function filterEmptyOptionalContexts(contexts, ctx, scope) {
  const required = requiredContextNames(ctx, scope)
  const list = Array.isArray(contexts) ? contexts : []
  if (required === undefined) return list
  return list.filter((context) => String(context?.text ?? '') !== '' || required.has(String(context?.name ?? '')))
}

/** 会话 id：source {kind:'agent'} 的 id。 */
function sessionIdOf(agent) {
  const id = agent?.session?.header?.id ?? agent?.session?.id ?? agent?.id
  return typeof id === 'string' && id !== '' ? id : undefined
}

function presetSourceOf(presetId) {
  return typeof presetId === 'string' && presetId !== ''
    ? { kind: 'preset', id: presetId }
    : { kind: 'preset' }
}

function agentSourceOf(agent) {
  const id = sessionIdOf(agent)
  return id === undefined ? { kind: 'agent' } : { kind: 'agent', id }
}

/** 预设工具目录也要看到 agent 作用域工具；取最新根会话仅用于 catalog 工具目录
 *  与无会话兜底。段装配一律走 `liveAgentForPreset`（同预设活动 agent），避免跨预设串台。 */
function latestRootAgent(ctx) {
  try {
    return listRootAgents(ctx)[0]
  } catch {
    return undefined
  }
}

/** 读某个 scope 层的注册表成员（宿主没有 layers / peek 时返回 undefined）。 */
function layerHas(ctx, scope, table, name) {
  try {
    const layers = ctx?.systemPrompt?.layers
    if (!layers) return undefined
    const layer = scope === undefined ? layers.global : layers.peek?.(scope)
    const entries = layer?.[table]
    return typeof entries?.has === 'function' ? entries.has(name) : undefined
  } catch {
    return undefined
  }
}

/**
 * 条目的注册层来源：global / preset(id) / agent(session)。宿主能读出
 * `systemPrompt.layers` 时按层精确判定；否则按作用域差异推导；拿不到时省略。
 */
function sourceForEntry(ctx, value, { table, role, presetId, agent, scopeKey, presetScopeKey }) {
  const name = String(value?.name ?? '')
  if (name === '') return undefined
  const isAgent = role === 'agent' || agent !== undefined
  try {
    const layers = ctx?.systemPrompt?.layers
    if (layers) {
      const chain = typeof layers.chainLayers === 'function' ? layers.chainLayers(scopeKey) : []
      if (isAgent && layerHas(ctx, scopeKey, table, name) === true) return agentSourceOf(agent)
      const presetScopes = isAgent
        ? [...(presetScopeKey !== undefined ? [presetScopeKey] : []), ...chain.slice(0, Math.max(0, chain.length - 1))]
        : [...(scopeKey !== undefined ? [scopeKey] : []), ...(presetScopeKey !== undefined ? [presetScopeKey] : [])]
      for (let i = presetScopes.length - 1; i >= 0; i--) {
        if (layerHas(ctx, presetScopes[i], table, name) === true) return presetSourceOf(presetId)
      }
      if (layerHas(ctx, undefined, table, name) === true) return { kind: 'global' }
    }
    const globalNames = namesOf(ctx, undefined, table)
    const presetScopeNames = presetScopeKey === undefined ? new Set() : namesOf(ctx, presetScopeKey, table)
    // 简易宿主 / 测试可能只有 merge 而没有 global/peek：按“预设 scope 的成员名”
    // 推断；不在预设 scope 里的才视为 agent 作用域。
    if (layers?.global === undefined) {
      if (isAgent) {
        return presetScopeNames.has(name) ? presetSourceOf(presetId) : agentSourceOf(agent)
      }
      return presetSourceOf(presetId)
    }
    // 没有 peek 时只能按差异近似：在预设 scope 有、全局没有的名字 = 预设层。
    const presetOnlyNames = new Set([...presetScopeNames].filter((name) => !globalNames.has(name)))
    if (isAgent) {
      if (presetOnlyNames.has(name)) return presetSourceOf(presetId)
      if (globalNames.has(name)) return { kind: 'global' }
      if (presetScopeNames.has(name)) return presetSourceOf(presetId)
      return agentSourceOf(agent)
    }
    if (presetOnlyNames.has(name)) return presetSourceOf(presetId)
    if (globalNames.has(name)) return { kind: 'global' }
    return presetSourceOf(presetId)
  } catch {
    return undefined
  }
}

/** 某 scope 的可见工具名集合（没有 tools 服务时为空）。 */
function toolNamesAt(ctx, scope) {
  try {
    const schemas = ctx?.tools?.schemas?.(scope) ?? []
    return new Set((Array.isArray(schemas) ? schemas : []).map((tool) => String(tool?.name ?? '')).filter((name) => name !== ''))
  } catch {
    return new Set()
  }
}

/** 工具条目的注册层来源：executor / agent / preset / global。 */
function sourceForTool(ctx, name, { role, presetId, agent, presetScopeKey }) {
  if (name === '') return undefined
  const globalNames = toolNamesAt(ctx, undefined)
  const presetNames = presetScopeKey === undefined ? new Set() : toolNamesAt(ctx, presetScopeKey)
  const presetOnlyNames = new Set([...presetNames].filter((item) => !globalNames.has(item)))
  const agentNames = toolNamesAt(ctx, agent)
  const hasDefinitionLayer = typeof ctx?.tools?.definitions === 'function'
  if (!hasDefinitionLayer) {
    // 简易宿主 / 测试没有 definitions 层信息：预设 scope 的成员按预设来源处理。
    const sameSets = presetNames.size === globalNames.size && [...presetNames].every((item) => globalNames.has(item))
    if (role !== 'agent') {
      if (sameSets || presetOnlyNames.has(name) || !globalNames.has(name)) return presetSourceOf(presetId)
      return { kind: 'global' }
    }
    if (!sameSets && globalNames.has(name) && !presetOnlyNames.has(name)) return { kind: 'global' }
    if (presetNames.has(name)) return presetSourceOf(presetId)
    if (agentNames.has(name) && !globalNames.has(name)) return agentSourceOf(agent)
    return globalNames.has(name) ? { kind: 'global' } : agentSourceOf(agent)
  }
  if (role !== 'agent') {
    if (presetOnlyNames.has(name)) return presetSourceOf(presetId)
    if (globalNames.has(name)) return { kind: 'global' }
    if (presetNames.has(name)) return presetSourceOf(presetId)
    return presetSourceOf(presetId)
  }
  // 同名但 definition 对象不同 = agent 作用域遮蔽了预设/全局工具；schemas 只有名字，不能据此误归为 global。
  if (hasDefinitionLayer) {
    try {
      const agentDefs = toolDefsOf(ctx, agent)
      const globalDefs = toolDefsOf(ctx, undefined)
      const presetDefs = toolDefsOf(ctx, presetScopeKey)
      const agentDef = agentDefs?.get(name)
      if (agentDef !== undefined
        && ((globalDefs?.has(name) === true && globalDefs.get(name) !== agentDef)
          || (presetDefs?.has(name) === true && presetDefs.get(name) !== agentDef))) {
        return agentSourceOf(agent)
      }
    } catch { /* definitions 不可用：继续按名字回退 */ }
  }
  if (agentNames.has(name) && !presetNames.has(name) && !globalNames.has(name)) return agentSourceOf(agent)
  if (presetOnlyNames.has(name)) return presetSourceOf(presetId)
  if (globalNames.has(name)) return { kind: 'global' }
  if (presetNames.has(name)) return presetSourceOf(presetId)
  return agentNames.has(name) ? agentSourceOf(agent) : undefined
}

/** 当前 scope 链上的 section 目录（名字、来源、静态空标记）；供工具提示词映射使用。 */
function promptSectionCatalog(ctx, scopeKey, sourceOptions) {
  const out = new Map()
  try {
    const layers = ctx?.systemPrompt?.layers
    if (typeof layers?.merge !== 'function') return out
    const sections = layers.merge(scopeKey, (layer) => layer.sections)
    for (const [name, definition] of sections) {
      const source = sourceForEntry(ctx, { name }, { table: 'sections', ...sourceOptions, scopeKey })
      const text = definition?.text
      out.set(name, {
        name,
        ...(source === undefined ? {} : { source }),
        ...(typeof text === 'string' ? { empty: text.length === 0 } : {}),
      })
    }
  } catch {
    // layers 缺席（旧宿主 / 测试替身）：映射为空，UI 只显示已知工具名。
  }
  return out
}

/** 一个工具对应的提示词段；只返回当前 scope 链里实际存在的 section。 */
function toolPromptSectionsOf(toolName, sectionCatalog) {
  const out = []
  for (const name of promptSectionNamesForTool(toolName)) {
    const section = sectionCatalog.get(name)
    if (section !== undefined) out.push({ ...section })
  }
  return out
}

/** 给段行附上它关联的工具组；非 tool:* 段原样返回。 */
function decorateToolPromptSection(section) {
  const tools = toolsForPromptSection(section?.name)
  if (tools.length === 0) return section
  return {
    ...section,
    toolPrompt: {
      tools,
      empty: typeof section.text === 'string' && section.text.length === 0,
    },
  }
}

/** 写盘边界：inject / replacements 的 phase 必须是 always 或 PHASES 里的阶段。 */
function assertKnownPhases(patch) {
  for (const field of ['inject', 'replacements']) {
    const list = patch?.[field]
    if (!Array.isArray(list)) continue
    for (const item of list) {
      if (item === null || typeof item !== 'object') continue
      if (item.phase === undefined || item.phase === 'always' || phaseOf(item.phase) !== undefined) continue
      throw new Error(`unknown phase "${String(item.phase)}" in ${field}`)
    }
  }
}

/** 读取路径：记录配置里未知 phase 的条目（运行时忽略，不静默当 always）。 */
function reportInvalidPhases(layer, warn) {
  if (layer === null || typeof layer !== 'object') return
  for (const field of ['inject', 'replacements']) {
    for (const item of Array.isArray(layer[field]) ? layer[field] : []) {
      if (item === null || typeof item !== 'object') continue
      if (item.phase === undefined || item.phase === 'always' || phaseOf(item.phase) !== undefined) continue
      warn(`prompt-customizer: 忽略 ${field} 中未知阶段 "${String(item.phase)}" 的条目`)
    }
  }
}

/**
 * 一次性清理遗留的 include（白名单）设置：过滤只剩 exclude 黑名单，服务端不再
 * 读取 include，界面也不再写它。
 *
 * 只要 include 键存在就剥掉并落盘（空数组同样是无意义字段）；但只有真去掉了
 * 有内容的名单才记一条日志（列出去处与名字）—— 不为一串空数组惊动用户。
 */
function stripLegacyInclude(store, log) {
  const raw = store.raw()
  if (raw === null || typeof raw !== 'object') return
  const stats = { stripped: 0, reported: [] }
  const walk = (node, where) => {
    if (node === null || typeof node !== 'object' || Array.isArray(node)) return
    if (Array.isArray(node.include)) {
      stats.stripped += 1
      if (node.include.length > 0) stats.reported.push(`${where}: [${node.include.join(', ')}]`)
      delete node.include
    }
    for (const phase of PHASES) {
      if (phase.toolField !== undefined) walk(node[phase.toolField], `${where}.${phase.toolField}`)
    }
  }
  walk(raw.tools, 'tools')
  if (raw.overrides !== null && typeof raw.overrides === 'object') {
    for (const id of Object.keys(raw.overrides)) walk(raw.overrides[id]?.tools, `overrides.${id}.tools`)
  }
  if (Array.isArray(raw.presets)) {
    for (const preset of raw.presets) walk(preset?.data?.tools, `presets.${preset?.name}.data.tools`)
  }
  if (stats.stripped === 0) return
  try {
    store.writeSection(raw)
    if (stats.reported.length > 0) {
      log(`prompt-customizer: 白名单（include）语义已移除，已从配置里清掉 ${stats.reported.length} 处有内容的名单 —— ${stats.reported.join('；')}。这些阶段现在不设限制；要重新限制就去工具 Tab 逐项取消勾选。`)
    }
  } catch (error) {
    try { log(`prompt-customizer: 遗留 include 清理失败（不影响运行，该字段已被忽略）：${String(error && error.message ? error.message : error)}`) } catch { /* logger 缺席 */ }
  }
}

export function apply(ctx, entry = {}) {
  // 1) 插件自有配置文件（不再注册 settings 命名空间）。
  const dataDir = typeof entry.dataDir === 'string' && entry.dataDir.length > 0
    ? entry.dataDir
    : path.join(dshHome(), NS)
  // 「本插件自己的遮蔽」查询口：MCP 的工具级禁用 / 预设遮蔽 / 工作区关闭
  // 都发生在 agent 作用域 restrict，纯预设预览看不到。宿主半身在这里注入一个
  // 批量查询函数（vendor 不 import src，保持可独立构建 / 单测）。
  const toolMask = typeof entry.toolMask === 'function' ? entry.toolMask : undefined
  // 变量清单由 host 半身注入（vendor 不再自带第二套变量注册实现）。
  const listVariables = typeof entry.listVariables === 'function' ? entry.listVariables : () => []
  // 破坏式更新：插件自有存储统一为 SQLite（单文件 `prompt-customizer.db`）。
  // 不再读写旧版 config.yaml / catalog.yaml；旧文件原样保留但不被读取、不迁移。
  const db = openDb(path.join(dataDir, 'prompt-customizer.db'))
  const store = createConfigStore({
    db,
    key: 'config',
    schema: Config,
    warn: (message) => { try { ctx.logger?.warn?.(message) } catch { /* logger 缺席 */ } },
  })
  const read = () => store.readResolved()
  // 运行时版本号（ADR-0006）：配置写入 / 工具注册 / 段注册 / agent 生命周期
  // 变化时 +1；面板打开期间轮询 /revision，变化即重取清单与三阶段预览，避免
  // 设置改完（或其它插件 reconcile 后）面板还显示旧图。
  let revision = 0
  const bumpRevision = () => { revision += 1 }
  for (const method of ['writeSection', 'setField']) {
    const original = store[method].bind(store)
    store[method] = (...args) => { const result = original(...args); bumpRevision(); return result }
  }
  ctx.on('tools/change', bumpRevision)
  ctx.on('system-prompt/change', bumpRevision)
  ctx.on('agent/created', bumpRevision)
  ctx.on('agent/disposed', bumpRevision)
  // @archive 工作区级 override：源码保留供以后恢复参考；当前不读取、不写入、
  // 不参与装配、不进备份。workspaceOverrides 数据字段休眠。
  const wsStore = createConfigStore({
    db,
    key: 'workspace-overrides',
    schema: WorkspaceOverrides,
    warn: (message) => { try { ctx.logger?.warn?.(message) } catch { /* logger 缺席 */ } },
  })
  const readWorkspaceOverrides = () => { try { return wsStore.readResolved() } catch { return {} } }
  const workspaceOverrideFor = (cwd) => {
    if (typeof cwd !== 'string' || cwd.trim() === '') return undefined
    try { return readWorkspaceOverrides()[path.resolve(cwd)] } catch { return undefined }
  }

  // 一次性清理：include（白名单）语义已从读取与写入两侧彻底移除。遗留的
  // include 既不再生效、界面也不再表达，留着只会让配置堆积无意义字段 ——
  // 启动时剥掉并记一条日志（逐处列出被去掉的名字），不静默改用户文件。
  stripLegacyInclude(store, (message) => { try { ctx.logger?.info?.(message) } catch { /* logger 缺席 */ } })

  // 2) 阶段投影：把 bootstrap/active 推导注册成宿主的会话投影 unit —— 宿主按会话
  //    折叠（含 resume / reload 后从日志重建）并增量驱动，本插件不再自扫历史
  //    （`Session.events` 已在 0.1.2-alpha.4 移除，同步历史读在 0.1.6 已 deprecated；
  //    见 promotion.js 顶部说明）。注册随本插件的 fiber 一起注销。
  let phaseHandle
  ctx.inject(['sessionProjections'], (projectionCtx) => {
    try {
      const registration = projectionCtx.sessionProjections.register(createPhaseProjection())
      // 0.2.1-rc.2 起 register 返回可 await 的句柄；同步 disposer 形态仍兼容。
      if (registration !== null && typeof registration?.then === 'function') {
        Promise.resolve(registration).then(
          (handle) => { phaseHandle = handle },
          (error) => { try { ctx.logger?.warn?.(`prompt-customizer: 阶段投影注册失败（阶段视图回落为已晋级）：${String((error && error.message) || error)}`) } catch { /* logger 缺席 */ } },
        )
      } else {
        phaseHandle = registration
      }
    } catch (error) {
      try { ctx.logger?.warn?.(`prompt-customizer: 阶段投影注册失败（阶段视图回落为已晋级）：${String((error && error.message) || error)}`) } catch { /* logger 缺席 */ }
    }
  })

  /** 该 agent 的预设 id：0.2.2 的 presetForSession 优先，旧宿主回落到 header / 投影。 */
  const presetOfAgent = (agent) => presetIdOfAgent(ctx, agent)

  // 阶段化工具目录：0.2.2 起由 agent 作用域 restrict 承担（装配瀑布流不再带 tools）。
  const toolVisibility = createPhaseToolVisibility({
    ctx,
    readConfig: (agent) => effectiveConfig(read().overrides?.[presetOfAgent(agent) ?? '']),
    phaseOf: (agent) => statusOf(phaseHandle ?? ctx.get('sessionProjections'), agent),
    presetOf: presetOfAgent,
  })

  // 单次降级告警：过滤逻辑出错时退回未加工的装配，绝不拖垮会话。
  let warned = false
  const warnOnce = (message) => {
    if (warned) return
    warned = true
    try { ctx.logger?.warn?.(message) } catch { /* logger 缺席只是不再告警 */ }
  }

  // 3) 装配目标解析（瀑布流与 assemble 强制覆盖共用）：生效配置 = 会话所属
  //    agent 预设的 override（0.9.0 起无全局基底 —— 提示词必须按具体预设修改，
  //    未定制的预设 = 无定制 = 官方原样；config.yaml 顶层的提示词字段是停用前
  //    的历史数据，运行时不读）。预览 hint 优先于
  //    会话事件推导的阶段，让同一份配置能渲染 bootstrap / compaction / active
  //    三种阶段视图。boundary 语义与阶段投影 statusOf 一致（-1 = 从未压缩）。
  //    预览装配可携带 promptCustomizerPatch（UI 未保存草稿）：只在内存里叠加
  //    到目标层（overlayPatch），磁盘不动 —— 实时预览「所见即保存后所得」。
  const resolveTarget = (context) => {
    const raw = read()
    const patch = context?.promptCustomizerPatch
    const base = patch !== null && typeof patch === 'object' && !Array.isArray(patch)
      ? overlayPatch(raw,
          typeof context.promptCustomizerTarget === 'string' && context.promptCustomizerTarget.length > 0
            ? context.promptCustomizerTarget
            : undefined,
          patch)
      : raw
    const id = typeof context?.promptCustomizerPreset === 'string'
      ? context.promptCustomizerPreset
      : presetOfAgent(context?.agent)
    reportInvalidPhases(base.overrides?.[id], warnOnce)
    const cfg = effectiveConfig(base.overrides?.[id])
    const phaseHint = typeof context?.promptCustomizerPhase === 'string'
      ? context.promptCustomizerPhase
      : undefined
    // 未知阶段绝不静默当 active / always：装配路径无法 400，只能忽略并记录。
    let status
    if (phaseHint !== undefined && phaseOf(phaseHint) === undefined) {
      warnOnce(`prompt-customizer: 未知阶段 "${phaseHint}"，本次装配回落到会话推导阶段`)
      status = statusOf(phaseHandle ?? ctx.get('sessionProjections'), context?.agent)
    } else if (phaseHint !== undefined) {
      status = statusOfPhase(phaseHint)
    } else {
      status = statusOf(phaseHandle ?? ctx.get('sessionProjections'), context?.agent)
    }
    return {
      raw,
      cfg,
      status,
      presetId: id,
      presetScopeKey: context?.promptCustomizerPresetScope,
    }
  }

  // 装配瀑布流：实时应用字段级 override、屏蔽 / 替换 / 注入 / 阶段化工具过滤。
  ctx.on('system-prompt/assemble', async (assembly, context, next) => {
    // 下游错误原样传播；只有本过滤器自身的逻辑被兜底。
    const registeredSections = Array.isArray(assembly.sections) ? assembly.sections.map(section => ({ ...section })) : []
    const assembled = await next()
    try {
      const { raw, cfg, status, presetId, presetScopeKey } = resolveTarget(context)
      const denied = pickSectionsForStatus(cfg, status)
      const deniedContexts = pickContextsForStatus(cfg, status)
      const replacements = filterReplacementsByPhase(cfg.replacements, status)
      const te = pickToolsFilter(cfg.tools, status)
      const sourceOptions = {
        role: context?.agent !== undefined ? 'agent' : 'preset',
        presetId,
        agent: context?.agent,
        scopeKey: context?.scope,
        presetScopeKey,
      }
      const sectionSourceOf = (section) => sourceForEntry(ctx, section, { ...sourceOptions, table: 'sections' })
      const contextSourceOf = (item) => sourceForEntry(ctx, item, { ...sourceOptions, table: 'contexts' })
      const toolSourceOf = (toolName) => sourceForTool(ctx, toolName, sourceOptions)

      // 使用宿主已求值的输入；forceSections 不重新调用动态 provider。
      const baseSections = raw?.forceSections === false
        ? (Array.isArray(assembled.sections) ? assembled.sections : [])
        : [...registeredSections, ...(assembled.sections ?? []).filter(section => !registeredSections.some(item => item.name === section.name))]
      // 身份 = name+source：先把候选标上来源，后续名单匹配才按身份而不是纯名字。
      const annotatedSections = baseSections.map((section) => {
        const source = sectionSourceOf(section)
        return source === undefined ? { ...section } : { ...section, source }
      })
      const annotatedContexts = (Array.isArray(assembled.contexts) ? assembled.contexts : []).map((item) => {
        const source = contextSourceOf(item)
        return source === undefined ? { ...item } : { ...item, source }
      })
      const baseView = context?.promptCustomizerBase === true
      // 0.2.2 起 `PromptPresentation` 只含 sections / contexts / variables，
      // 工具声明由工具提供者拥有；装配瀑布流不再读写 `assembled.tools`。
      const baseTools = baseView ? toolSchemasOf(ctx, context?.scope) : []

      // 段级策略（屏蔽 / 替换 / 注入 / 排序）由 effective.applySectionPolicy
      // 统一实现：瀑布流与 assemble 强制覆盖共用同一份逻辑。
      const sections = applySectionPolicy(annotatedSections, cfg, status)

      const result = {
        ...assembled,
        sections,
        // 真实装配：过滤掉被隐藏的运行时上下文；预览 base 调用保留全部（供面板列全量+置灰）。
        ...baseView ? {} : { contexts: annotatedContexts.filter((item) => !matchesAny(deniedContexts, item)) },
        promptCustomizerSections: sections,
      }
      // 本插件实际产出的段名清单：下游丢弃检测在 base / 真实两条装配路径都需要。
      result.promptCustomizerEmitted = sections.map((section) => String(section.name))
      if (baseView) {
        result.promptCustomizerBaseView = {
          sections: annotatedSections.map((section) => ({
            name: section.name,
            text: String(section.text ?? ''),
            ...section.interpolate !== undefined ? { interpolate: section.interpolate } : {},
            ...section.source !== undefined ? { source: section.source } : {},
            blocked: matchesAny(denied, section),
            replaced: matchesAny(replacements, section),
            // 'agent' = 只在该 agent 的装配里注册的段（预览 scope 的注册表没有它）。
            ...section.scope !== undefined ? { scope: section.scope } : {},
          })),
          tools: baseTools.map((tool) => {
            const toolName = typeof tool.name === 'string' ? tool.name : String(tool.name)
            const source = toolSourceOf(toolName)
            return {
              name: toolName,
              description: typeof tool.description === 'string' ? tool.description : '',
              ...source === undefined ? {} : { source },
              hidden: matchesAny(te.exclude, { name: toolName, source }),
            }
          }),
          contexts: annotatedContexts.map((item) => ({
            name: String(item?.name ?? ''),
            text: String(item?.text ?? ''),
            ...item.source !== undefined ? { source: item.source } : {},
            blocked: matchesAny(deniedContexts, item),
          })),
        }
        // 预览才探测（运行时装配零额外开销）：有 complete 段时宿主要在水流
        // 之后把 sections 整段还原，本插件的段级定制不会进最终提示词。
        // forceSections 开启时该接管已被 assemble 包装绕过，警告不再成立。
        const takenOver = detectCompletePrompt(ctx, context?.scope)
        if (takenOver !== undefined && raw?.forceSections === false) result.promptCustomizerTakenOver = takenOver
        // 本插件实际产出的段名清单：下游还有别的手段会丢弃段（实测 liangshen
        // 引导期由预设自身规则把 20 段砍到 1 段，注册表里并没有 complete 段），
        // 所以 buildPreview 还要拿这份与最终装配比对，做机制无关的兜底探测。
      }
      return result
    } catch (error) {
      warnOnce(`prompt-customizer: 过滤器异常，本次装配回退为未加工结果：${String((error && error.message) || error)}`)
      return assembled
    }
  })

  // rc.2 restores complete sections after the waterfall. Restore the evaluated
  // policy without invoking dynamic providers twice or reading private layers.
  const sp = ctx.get('systemPrompt')
  if (sp && typeof sp.assemble === 'function') {
    // 只在首个 apply() 记一次原始方法；插件 HMR 重载重跑 apply() 时用新闭包
    // 重新包装，但永远包在原始方法之上，避免层层套娃。
    const pristine = sp[PATCHED]?.orig ?? sp.assemble.bind(sp)
    sp[PATCHED] = { orig: pristine }
    const wrapped = async (context = {}) => {
      // 变量先于装配同步：宿主在 pristine 内部解析 {{name}}，注册必须发生在前。
      const result = await pristine(context)
      // 解析一次生效目标：工具过滤与段策略共用同一份配置 / 阶段，避免
      // `promptCustomizerBase` 预览和真实装配走出不同的解析结果。
      let targetInfo
      try { targetInfo = resolveTarget(context) } catch { /* 解析失败不拦本次装配 */ }
      // 工具显隐：真实会话装配时按「当前阶段 exclude」过滤最终交给模型的 tools。
      // restrict 只能收窄继承的全局工具；作用域内注册的工具（插件提供的 read /
      // apply_patch 等）它管不到 —— 但模型看到的正是这份 `assembly.tools`，这里按
      // 名字删掉即可真正隐藏（含 agent 作用域工具）。诊断 / 预览的 base 调用不过滤，
      // 保证左栏能看到完整基座。
      let withTools = result
      if (targetInfo !== undefined && context?.promptCustomizerBase !== true && Array.isArray(result.tools)) {
        try {
          const { cfg, status, presetId, presetScopeKey } = targetInfo
          const exclude = pickToolsFilter(cfg.tools, status).exclude ?? []
          if (exclude.length > 0) {
            const sourceOptions = {
              role: context?.agent !== undefined ? 'agent' : 'preset',
              presetId,
              agent: context?.agent,
              presetScopeKey,
            }
            withTools = {
              ...result,
              tools: result.tools.filter((tool) => {
                const toolName = String(tool.name)
                return !matchesAny(exclude, { name: toolName, source: sourceForTool(ctx, toolName, sourceOptions) })
              }),
            }
          }
        } catch { /* 解析失败不拦本次装配 */ }
      }
      if (read()?.forceSections === false) return withTools
      // 没有实际段策略时不接管：保持宿主原样（尤其是 complete:true 的
      // minimal persona），避免「安装插件」改变未定制预设的提示词。
      if (targetInfo === undefined || !hasSectionPolicy(targetInfo.cfg, targetInfo.status)) return withTools
      try {
        const sections = withTools.promptCustomizerSections ?? withTools.sections
        const patched = { ...withTools, sections }
        if (context?.promptCustomizerBase === true) {
          patched.promptCustomizerEmitted = sections.map(section => String(section.name))
        }
        return patched
      } catch (error) {
        warnOnce(`prompt-customizer: 强制覆盖 assemble 失败，本次回退为宿主结果：${String((error && error.message) || error)}`)
        // 覆盖失效时恢复接管告警：否则 complete 段接管回来了、却因为上面的
        // forceSections 开关 gate 而没有任何提示（静默降级）。
        const takenOver = detectCompletePrompt(ctx, context?.scope)
        if (takenOver !== undefined) result.promptCustomizerTakenOver = takenOver
        return result
      }
    }
    sp.assemble = wrapped
    ctx.effect(() => () => {
      if (sp.assemble === wrapped) sp.assemble = pristine
      if (sp[PATCHED]?.orig === pristine) delete sp[PATCHED]
    }, 'prompt-customizer: assemble wrapper')
  }

  // 5) 共享 webserver 上的清单路由（web profile 里必有）。
  //    用 ctx.get() 保持可选 —— 未在 `inject` 中声明就去访问 ctx.webServer
  //    会抛 "cannot get property without inject"。
  const webserver = ctx.get('webServer')
  if (webserver) {
    // 连接信任闸（宿主 0.1.2-alpha.1 起）：官方 /api 通道走 process 级 bootstrap
    // token + 签名 Cookie，而直接注册在 webServer 上的自建路由不在其中 —— 宿主
    // 契约要求先问过 connection.requestRejection：其 Host/Origin 围栏挡 DNS
    // rebinding 与跨站调用，浏览器认证再挡未持 Cookie 的调用。本插件的路由会写盘
    // （config/presets），必须过闸；闸本身不可用（connection 服务缺席）时保守
    // 拒绝（fail-closed）——「没有认证面」不等于「无需认证」。
    //
    // 服务每次请求现读，绝不在 apply 时捕获：connection 由同 profile 的另一条
    // entry 提供，entry 创建顺序不保证（实测冷启时本插件 apply 早于其提供，
    // 捕获版会让整组路由永久 503）；宿主自带路由（open-in-app 等）同款懒读。
    const unauthenticated = (req, res) => {
      const connection = ctx.get('connection')
      if (typeof connection?.requestRejection !== 'function') {
        writeJson(res, 503, { ok: false, error: 'connection service unavailable: prompt-customizer routes refuse to serve unauthenticated' })
        return true
      }
      const rejection = connection.requestRejection(req)
      if (rejection === undefined) return false
      res.writeHead(rejection, { 'content-type': 'text/plain; charset=utf-8' })
      res.end(rejection === 401 ? 'unauthorized' : 'forbidden')
      return true
    }
    /** 与 webserver.register 同形，统一在 handler 前挂信任闸（注册顺序与 disposer 不变）。 */
    const register = (route) => webserver.register({
      kind: route.kind,
      path: route.path,
      handler: (req, res) => {
        if (unauthenticated(req, res)) return undefined
        return route.handler(req, res)
      },
    })
    const dispose = register({
      kind: 'exact',
      path: '/api/prompt-customizer/inventory',
      handler: async (req, res) => {
        try {
          // 可选 `?scope=<agentPresetId>`：清单切换到该预设的 scope 与
          // 生效配置（字段级 override 后），供 UI 按目标编辑；缺省为 standard。
          // 宿主共享 webserver 的 req 是原始 IncomingMessage：没有 Express 的
          // query 属性，必须自行解析 URL 参数。
          const id = queryOf(req).get('scope') ?? undefined
          const target = await acquireTarget(ctx, id)
          try {
            const preview = await buildPreview(ctx, read(), target, 'active', undefined, undefined, undefined, toolMask)
            const inventory = await buildInventory(ctx, read(), target.scopeKey, target.hintId, undefined, preview)
            writeJson(res, 200, { ...inventory, scopeResolved: target.scopeResolved, variables: listVariables() })
          } finally {
            await target.release()
          }
        } catch (error) {
          writeJson(res, 500, {
            ok: false,
            error: String(error && error.message ? error.message : error),
          })
        }
      },
    })
    ctx.effect(() => dispose, 'prompt-customizer: inventory route')

    // 预览路由：渲染最终装配的系统提示词（经过所有插件的过滤，包括我们
    // 自己的屏蔽/替换/注入），让用户确认没有其他插件注入的段造成污染。
    // 可选 `?scope=<agentPresetId>` 预览指定 agent 预设的装配结果（省略时
    // 使用 standard agent，与清单一致）；可选 `?phase=<bootstrap|compaction|
    // active>` 预览指定对话阶段的三态视图（省略时按晋级推导，只读路由下
    // 即 active / 静态视图）。
    // POST 形态（UI 实时预览）：body { target?, patch?, phase? } —— patch 是
    // UI 未保存的编辑草稿，只在内存里叠加（overlayPatch），绝不写盘。
    const disposePreview = register({
      kind: 'exact',
      path: '/api/prompt-customizer/preview',
      handler: async (req, res) => {
        try {
          let body = null
          if (req.method === 'POST') {
            try { body = await readJsonBody(req) } catch { body = null }
          }
          const target = await previewTarget(ctx, req, body)
          if (target.invalidPhase !== undefined) {
            try { ctx.logger?.warn?.(`prompt-customizer: 未知阶段 "${target.invalidPhase}"，预览请求被拒绝`) } catch { /* logger 缺席 */ }
            await target.release()
            writeJson(res, 400, { ok: false, error: `unknown phase: ${target.invalidPhase}` })
            return
          }
          try {
            const patch = body !== null && typeof body === 'object'
              && body.patch !== null && typeof body.patch === 'object' && !Array.isArray(body.patch)
              ? body.patch : undefined
            if (patch !== undefined) {
              try {
                assertKnownPhases(patch)
              } catch (error) {
                writeJson(res, 400, { ok: false, error: String(error && error.message ? error.message : error) })
                return
              }
            }
            const patchTarget = typeof body?.target === 'string' && body.target.length > 0 ? body.target : undefined
            const preview = await buildPreview(ctx, read(), target, target.phase, undefined, patch, patchTarget, toolMask)
            writeJson(res, 200, { ...preview, scopeResolved: target.scopeResolved, phase: target.phase, source: target.source })
          } finally {
            await target.release()
          }
        } catch (error) {
          writeJson(res, 500, {
            ok: false,
            error: String(error && error.message ? error.message : error),
          })
        }
      },
    })
    ctx.effect(() => disposePreview, 'prompt-customizer: preview route')

    // 当前会话只读视图：取最新活动根 agent，用它自己的 scope 跑真实装配与
    // 工具可见集。它与 `buildPreview` 的「同预设活动 agent 视图」是两条并列的
    // 真实装配入口：前者回答「模型此刻真正看到什么」，后者是编辑目标预设的
    // 清单 / 预览数据源（ADR-0005）。
    const disposeSession = register({
      kind: 'exact',
      path: '/api/prompt-customizer/session',
      handler: async (_req, res) => {
        let target
        try {
          const live = currentLiveAgent(ctx)
          if (live === undefined) {
            writeJson(res, 200, {
              ok: true,
              source: 'session',
              session: null,
              sections: [],
              text: '',
              contexts: [],
              diagnostics: [],
              tools: [],
              baseSections: [],
              baseTools: [],
              registryTools: [],
              registryTotal: 0,
            })
            return
          }
          const presetId = presetIdOfAgent(ctx, live)
          target = await acquireTarget(ctx, presetId)
          const status = statusOf(phaseHandle ?? ctx.get('sessionProjections'), live)
          const preview = await buildSessionPreview(ctx, read(), target.scopeKey, { agent: live, presetId }, status, undefined, toolMask)
          writeJson(res, 200, { ...preview, scopeResolved: target.scopeResolved })
        } catch (error) {
          writeJson(res, 500, { ok: false, error: String(error && error.message ? error.message : error) })
        } finally {
          if (target !== undefined) {
            try { await target.release() } catch { /* 释放失败不影响响应 */ }
          }
        }
      },
    })
    ctx.effect(() => disposeSession, 'prompt-customizer: current session route')

    // 运行时版本号（ADR-0006）：面板打开期间轮询它，变化即重取清单与预览。
    const disposeRevision = register({
      kind: 'exact',
      path: '/api/prompt-customizer/revision',
      handler: async (_req, res) => {
        writeJson(res, 200, { ok: true, revision })
      },
    })
    ctx.effect(() => disposeRevision, 'prompt-customizer: revision route')


    // agent 预设枚举路由：直接读 roster 的 list()（未 memo 化，运行中新增
    // 的预设立即可见），给 UI 的目标选择器与预览选择器供货。
    const disposePresets = register({
      kind: 'exact',
      path: '/api/prompt-customizer/agent-presets',
      handler: async (_req, res) => {
        try {
          const presets = ctx.get('agentPresets')
          const list = presets ? await presets.list() : []
          const live = currentLiveAgent(ctx)
          writeJson(res, 200, {
            ok: true,
            presets: list.map((p) => ({ id: p.id, name: p.name ?? p.id, description: p.description, broken: p.broken })),
            // 面板默认编辑目标：有活动会话时跟随该会话所属预设。
            currentPreset: live === undefined ? undefined : presetIdOfAgent(ctx, live),
          })
        } catch (error) {
          writeJson(res, 500, {
            ok: false,
            error: String(error && error.message ? error.message : error),
          })
        }
      },
    })
    ctx.effect(() => disposePresets, 'prompt-customizer: agent-presets route')

    // 导出当前编辑目标的配置：`GET /api/prompt-customizer/export?scope=<id>`。
    //
    // 只读导出，不创建预设。宿主 `agentPresets` 没有 authoring API（只有
    // list / read / select），而预设本身是 profile patch 里一行的声明式配置
    // ——「帮用户造预设」需要猜 Loader 命名空间、重复行 id、把来源组成拍成
    // 不再跟随升级的快照，代价远大于收益。导出把决定权交回用户：拿到的是本
    // 插件对该目标的全部定制，可自行并入 cordis 配置。
    //
    // 内容 = overrides[scope]（本插件唯一的配置真源）+ 来源预设的组成声明（参考），
    // 以及该预设的工具/段清单，便于人工核对。
    const disposeExport = register({
      kind: 'exact',
      path: '/api/prompt-customizer/export',
      handler: async (req, res) => {
        try {
          if (req.method !== 'GET') {
            writeJson(res, 405, { ok: false, error: 'GET only' })
            return
          }
          const roster = ctx.get('agentPresets')
          const requested = queryOf(req).get('scope') ?? undefined
          const fallbackId = typeof roster?.defaultId === 'string' && roster.defaultId !== '' ? roster.defaultId : undefined
          const targetId = requested !== undefined && requested !== ''
            ? requested
            : fallbackId
          if (targetId === undefined) {
            writeJson(res, 400, { ok: false, error: 'scope (agent preset id) is required when the roster has no defaultId' })
            return
          }
          // 导出的是**用户写下的原文**：读 DB doc('config') 的原始文档，不补 schema 默认值。
          let raw = {}
          try {
            const doc = store.raw()
            if (doc !== null && typeof doc === 'object' && !Array.isArray(doc)) raw = doc
          } catch { /* 读不到：导出空定制，不报错 */ }
          // 该目标的定制原文：没有定制时给空对象（UI 会提示「无定制可导出」）。
          const overrides = raw?.overrides ?? {}
          const customization = overrides[targetId] !== null && typeof overrides[targetId] === 'object'
            ? overrides[targetId]
            : {}
          if (overrides[targetId] !== undefined) {
            try {
              Config({ overrides: { __probe: customization } })
            } catch (error) {
              writeJson(res, 400, { ok: false, error: `invalid customization in config: ${String(error && error.message ? error.message : error)}` })
              return
            }
          }
          writeJson(res, 200, {
            ok: true,
            format: 'dsh-prompt-customizer/export@1',
            target: targetId,
            envBlocklist: Array.isArray(raw?.envBlocklist) ? raw.envBlocklist : [],
            forceSections: raw?.forceSections !== false,
            customization,
          })
        } catch (error) {
          writeJson(res, 500, { ok: false, error: String(error && error.message ? error.message : error) })
        }
      },
    })
    ctx.effect(() => disposeExport, 'prompt-customizer: export route')

    // 全量备份 / 恢复：整库（全部提示词配置 + 工作区 override + 目录池 + MCP/技能账本）一次导出/导入。
    const disposeBackup = register({
      kind: 'exact',
      path: '/api/prompt-customizer/backup',
      handler: async (_req, res) => {
        try {
          const docs = allDocs(db)
          // 工作区级提示词/工具已下线；休眠数据不进入备份包。
          delete docs['workspace-overrides']
          writeJson(res, 200, {
            ok: true,
            format: 'dsh-prompt-customizer/backup@1',
            exportedAt: new Date().toISOString(),
            docs,
          })
        } catch (error) {
          writeJson(res, 500, { ok: false, error: String(error && error.message ? error.message : error) })
        }
      },
    })
    ctx.effect(() => disposeBackup, 'prompt-customizer: backup route')

    const disposeRestore = register({
      kind: 'exact',
      path: '/api/prompt-customizer/restore',
      handler: async (req, res) => {
        try {
          const body = await readJsonBody(req)
          const docs = body?.docs
          if (docs === null || typeof docs !== 'object' || Array.isArray(docs)) {
            writeJson(res, 400, { ok: false, error: 'backup.docs object is required' })
            return
          }
          const restored = { ...docs }
          delete restored['workspace-overrides']
          if (restored.config !== undefined) {
            try {
              Config(restored.config ?? {})
            } catch (error) {
              writeJson(res, 400, { ok: false, error: `invalid config in backup: ${String(error && error.message ? error.message : error)}` })
              return
            }
          }
          // 休眠数据不进入备份，但恢复备份也不应删除它。
          const dormantWorkspaceOverrides = allDocs(db)['workspace-overrides']
          replaceAllDocs(db, restored)
          if (dormantWorkspaceOverrides !== undefined) setDoc(db, 'workspace-overrides', dormantWorkspaceOverrides)
          toolVisibility.syncAll()
          writeJson(res, 200, { ok: true, config: read() })
        } catch (error) {
          writeJson(res, 500, { ok: false, error: String(error && error.message ? error.message : error) })
        }
      },
    })
    ctx.effect(() => disposeRestore, 'prompt-customizer: restore route')


    // 配置读写路由（插件自有 config.yaml 的前端通道）：
    //  GET  /config        → { ok, config }（解析后含默认值）
    //  POST /config/set    → body { field, value }；写入并返回最新 config
    //  POST /config/unset  → body { field }；删除字段并返回最新 config
    const disposeConfig = register({
      kind: 'exact',
      path: '/api/prompt-customizer/config',
      handler: async (_req, res) => {
        writeJson(res, 200, { ok: true, config: read() })
      },
    })
    ctx.effect(() => disposeConfig, 'prompt-customizer: config route')

    // 全局字段批量写入：导入预设时 envBlocklist + presets 必须一次落盘，
    // 避免第一个字段成功、第二个字段失败留下半套配置。
    const BATCH_GLOBAL_FIELDS = new Set(['presets', 'activePreset', 'envBlocklist', 'forceSections'])
    const disposeConfigBatch = register({
      kind: 'exact',
      path: '/api/prompt-customizer/config/batch',
      handler: async (req, res) => {
        try {
          const body = await readJsonBody(req)
          const fields = body?.fields
          if (fields === null || typeof fields !== 'object' || Array.isArray(fields)) {
            writeJson(res, 400, { ok: false, error: 'fields object is required' })
            return
          }
          const next = { ...(store.raw() ?? {}) }
          for (const [field, value] of Object.entries(fields)) {
            if (!BATCH_GLOBAL_FIELDS.has(field)) {
              writeJson(res, 400, { ok: false, error: `field '${field}' is not a global batch field` })
              return
            }
            if (value === undefined) delete next[field]
            else next[field] = value
          }
          store.writeSection(next)
          toolVisibility.syncAll()
          writeJson(res, 200, { ok: true, config: read() })
        } catch (error) {
          writeJson(res, 400, { ok: false, error: String(error && error.message ? error.message : error) })
        }
      },
    })
    ctx.effect(() => disposeConfigBatch, 'prompt-customizer: config batch route')

    // 0.9.0 起六个提示词字段（sections/sectionsBootstrap/sectionsCompaction/
    // replace/inject/tools）属于已停用的全局层，set/unset 直接 400 —— 提示词
    // 定制必须走 /config/apply + target（写 overrides[id]）。历史数据保留在
    // 文件里不动（停用但可回滚），只能手编 config.yaml 清理。
    const GLOBAL_PROMPT_FIELDS = new Set([
      ...PHASES.flatMap((phase) => [phase.sectionField, phase.contextField]),
      'replacements',
      'inject',
      'tools',
      // 旧字段：破坏式更新后不再接受，按全局层字段一并拒绝。
      'replace',
    ])
    const withFieldWrite = (handler) => async (req, res) => {
      try {
        const body = await readJsonBody(req)
        if (typeof body?.field !== 'string' || body.field.length === 0) {
          writeJson(res, 400, { ok: false, error: 'field is required' })
          return
        }
        if (GLOBAL_PROMPT_FIELDS.has(body.field)) {
          writeJson(res, 400, { ok: false, error: `'${body.field}' is a global-layer prompt field, retired in 0.9.0 — customize per agent preset via /config/apply with target` })
          return
        }
        handler(body)
        toolVisibility.syncAll()
        writeJson(res, 200, { ok: true, config: read() })
      } catch (error) {
        writeJson(res, 400, {
          ok: false,
          error: String(error && error.message ? error.message : error),
        })
      }
    }
    const disposeConfigSet = register({
      kind: 'exact',
      path: '/api/prompt-customizer/config/set',
      handler: withFieldWrite(({ field, value }) => store.setField(field, value)),
    })
    ctx.effect(() => disposeConfigSet, 'prompt-customizer: config set route')

    const disposeConfigUnset = register({
      kind: 'exact',
      path: '/api/prompt-customizer/config/unset',
      handler: withFieldWrite(({ field }) => store.setField(field, undefined)),
    })
    ctx.effect(() => disposeConfigUnset, 'prompt-customizer: config unset route')

    // 恢复初始状态：清空一切定制并关闭 forceSections —— 与「不装本插件」等效，
    // 无需卸载 / 重启（forceSections: false 时 assemble 包装直接放行宿主原样，
    // 瀑布流里空配置的过滤是无操作）。文件本身保留，避免卸载重装后迁移逻辑
    // 再次触发；之后要重新启用定制，把 forceSections 改回 true 或删除该行即可。
    const disposeConfigReset = register({
      kind: 'exact',
      path: '/api/prompt-customizer/config/reset',
      handler: async (_req, res) => {
        try {
          store.writeSection({ forceSections: false })
          toolVisibility.syncAll()
          writeJson(res, 200, { ok: true, config: read() })
        } catch (error) {
          writeJson(res, 500, {
            ok: false,
            error: String(error && error.message ? error.message : error),
          })
        }
      },
    })
    ctx.effect(() => disposeConfigReset, 'prompt-customizer: config reset route')

    // 批量保存路由：UI「统一保存按钮」的唯一写盘通道。body { target, patch }，
    // patch 只认业务字段（含每阶段独立段名单），字段值为 null 表示删除。
    // target 为 agent 预设 id，写 overrides[id]；0.9.0 起**必填** —— 提示词
    // 必须按具体预设修改，无目标的写盘一律 400（全局层已停用）。
    // 叠加语义与 /preview 的草稿预览共用 overlayPatch（一份实现）。
    const disposeConfigApply = register({
      kind: 'exact',
      path: '/api/prompt-customizer/config/apply',
      handler: async (req, res) => {
        try {
          const body = await readJsonBody(req)
          const patch = body?.patch
          if (patch === null || typeof patch !== 'object' || Array.isArray(patch)) {
            writeJson(res, 400, { ok: false, error: 'patch object is required' })
            return
          }
          try {
            assertKnownPhases(patch)
          } catch (error) {
            writeJson(res, 400, { ok: false, error: String(error && error.message ? error.message : error) })
            return
          }
          const target = typeof body.target === 'string' && body.target.length > 0 ? body.target : undefined
          if (target === undefined) {
            writeJson(res, 400, { ok: false, error: 'target (agent preset id) is required — prompts must be customized per preset, the global layer is retired in 0.9.0' })
            return
          }
          store.writeSection(overlayPatch({ ...(store.raw() ?? {}) }, target, patch))
          toolVisibility.syncAll()
          writeJson(res, 200, { ok: true, config: read() })
        } catch (error) {
          writeJson(res, 400, {
            ok: false,
            error: String(error && error.message ? error.message : error),
          })
        }
      },
    })
    ctx.effect(() => disposeConfigApply, 'prompt-customizer: config apply route')

    // 单预设自定义导入：只导入本插件 overrides[target]，不触碰宿主预设定义。
    const disposeConfigImport = register({
      kind: 'exact',
      path: '/api/prompt-customizer/import',
      handler: async (req, res) => {
        try {
          const body = await readJsonBody(req)
          const target = typeof body?.target === 'string' && body.target.length > 0 ? body.target : undefined
          const customization = body?.customization
          if (target === undefined || customization === null || typeof customization !== 'object' || Array.isArray(customization)) {
            writeJson(res, 400, { ok: false, error: 'target and customization object are required' })
            return
          }
          try {
            Config({ overrides: { __probe: customization } })
          } catch (error) {
            writeJson(res, 400, { ok: false, error: `invalid customization: ${String(error && error.message ? error.message : error)}` })
            return
          }
          const raw = store.raw() ?? {}
          const overrides = { ...(raw.overrides ?? {}) }
          overrides[target] = customization
          store.setField('overrides', overrides)
          toolVisibility.syncAll()
          writeJson(res, 200, { ok: true, target, config: read() })
        } catch (error) {
          writeJson(res, 400, { ok: false, error: String(error && error.message ? error.message : error) })
        }
      },
    })
    ctx.effect(() => disposeConfigImport, 'prompt-customizer: config import route')

    // 手动清理空 overrides：只删「所有字段都为空」的预设定制。
    const disposeConfigCleanup = register({
      kind: 'exact',
      path: '/api/prompt-customizer/overrides/cleanup',
      handler: async (_req, res) => {
        try {
          const raw = store.raw() ?? {}
          const overrides = { ...(raw.overrides ?? {}) }
          const isEmptyValue = (value) => {
            if (value === null || value === undefined) return true
            if (Array.isArray(value)) return value.length === 0
            if (typeof value === 'object') return Object.values(value).every(isEmptyValue)
            return false
          }
          const removed = []
          for (const [id, value] of Object.entries(overrides)) {
            if (isEmptyValue(value)) {
              delete overrides[id]
              removed.push(id)
            }
          }
          store.setField('overrides', overrides)
          toolVisibility.syncAll()
          writeJson(res, 200, { ok: true, removed, config: read() })
        } catch (error) {
          writeJson(res, 500, { ok: false, error: String(error && error.message ? error.message : error) })
        }
      },
    })
    ctx.effect(() => disposeConfigCleanup, 'prompt-customizer: overrides cleanup route')
  }
}

/** 配置补丁认得的业务字段（与 UI 编辑域一一对应；含每阶段独立名单）。 */
const APPLY_FIELDS = [
  ...PHASES.flatMap((phase) => [phase.sectionField, phase.contextField]),
  'replacements',
  'inject',
  'tools',
]

/**
 * 把一份补丁叠加到 raw 配置的目标层，返回新对象（不改原对象、不碰磁盘）。
 * target 缺省 = 全局顶层；字符串 = overrides[id]。字段值为 null = 删除该字段
 *（回退默认 / 全局）；全空的 override 连带删除，避免配置堆积空壳。
 * /config/apply 落盘与 /preview 的草稿叠加（实时预览，只读内存）共用这一份
 * 语义 —— 两处行为永远一致。
 */
function overlayPatch(raw, target, patch) {
  const base = { ...(raw ?? {}) }
  const applyPatch = (obj) => {
    for (const field of APPLY_FIELDS) {
      if (!Object.hasOwn(patch, field)) continue
      if (patch[field] === null) delete obj[field]
      else obj[field] = patch[field]
    }
  }
  if (target === undefined) {
    applyPatch(base)
  } else {
    const overrides = { ...(base.overrides ?? {}) }
    const ovr = { ...(overrides[target] ?? {}) }
    applyPatch(ovr)
    if (Object.keys(ovr).length > 0) overrides[target] = ovr
    else delete overrides[target]
    if (Object.keys(overrides).length > 0) base.overrides = overrides
    else delete base.overrides
  }
  return base
}

/** Read the selected mode's current revision; never substitute a live conversation.
 *  buildPreview additionally takes the same-preset active agent's real view (ADR-0005). */
async function acquireTarget(ctx, id) {
  const presets = ctx.get('agentPresets')
  const requestedId = id ?? (typeof presets?.resolve === 'function' ? (await presets.resolve()).id : undefined)
  if (typeof presets?.acquireScope === 'function') {
    const lease = await presets.acquireScope(requestedId)
    return { scopeKey: lease.key, hintId: requestedId, scopeResolved: true, source: 'preset', release: () => lease[Symbol.asyncDispose]() }
  }
  return { scopeKey: undefined, hintId: id, scopeResolved: false, source: 'preset', release: async () => {} }
}

/**
 * 读某 scope 的可见工具 schema 列表（0.2.2 起代替废弃的 `assembly.tools`）。
 * 解析出的预设 scope 优先；为空时回落全局层，避免预设作用域尚未挂载时清单为空。
 * @param {object} ctx - 插件上下文。
 * @param {object|undefined} scopeKey - agent 预设 scope key。
 * @returns {Array<{name: string, description?: string}>} 工具 schema 列表。
 */
function toolSchemasOf(ctx, scopeKey, mergeGlobal = false) {
  // mergeGlobal：预设 scope 的专属工具 ∪ 全局工具（去重，预设优先）——避免“预设 scope 非空就
  // 丢掉全局工具”。agent scope 不合并全局（否则检测不到被 restrict 掉的工具）。
  if (!mergeGlobal) {
    const scopes = scopeKey === undefined ? [undefined] : [scopeKey, undefined]
    for (const scope of scopes) {
      try {
        const schemas = ctx.tools?.schemas?.(scope) ?? []
        if (Array.isArray(schemas) && schemas.length > 0) return schemas
      } catch { /* 未就绪 */ }
    }
    return []
  }
  const byName = new Map()
  const order = []
  const absorb = (list) => {
    for (const tool of Array.isArray(list) ? list : []) {
      const name = String(tool?.name ?? '')
      if (name === '' || byName.has(name)) continue
      byName.set(name, tool)
      order.push(name)
    }
  }
  if (scopeKey !== undefined) { try { absorb(ctx.tools?.schemas?.(scopeKey)) } catch { /* 未就绪 */ } }
  try { absorb(ctx.tools?.schemas?.(undefined)) } catch { /* 未就绪 */ }
  return order.map((name) => byName.get(name))
}

/** 该 agent 的预设 id：0.2.2 的 presetForSession 优先，旧宿主回落到 header / 投影。 */
function presetIdOfAgent(ctx, agent) {
  const presets = ctx.get('agentPresets')
  // DSH 0.2.2 的 agent 是自己组合层的 Context：先读 composedPreset，避免
  // 投影尚未刷新时把多个会话都回落到同一个默认 preset。
  if (typeof presets?.composedPreset === 'function' && agent?.ctx !== undefined) {
    try {
      const id = presets.composedPreset(agent.ctx)
      if (typeof id === 'string' && id !== '') return id
    } catch { /* 非组合层 agent：继续回落 */ }
  }
  if (typeof presets?.presetForSession === 'function') {
    try {
      const id = presets.presetForSession(agent?.session)
      if (typeof id === 'string' && id !== '') return id
    } catch { /* 投影尚未就绪：继续回落 */ }
  }
  return presetOfSession(ctx.get('sessionProjections'), agent?.session)
}

/** 活动根 agent（子代理不算「当前会话」）；按创建时间从新到旧。 */
function listRootAgents(ctx) {
  try {
    const agents = ctx.get('agents')
    const listed = typeof agents?.roots === 'function'
      ? agents.roots()
      : typeof agents?.list === 'function' ? agents.list() : []
    return (Array.isArray(listed) ? listed : [])
      .filter((agent) => agent !== null && typeof agent === 'object'
        && (agent.session?.header?.delegationDepth ?? 0) === 0)
      .sort((left, right) => {
        const a = typeof left.session?.header?.createdAt === 'number' ? left.session.header.createdAt : 0
        const b = typeof right.session?.header?.createdAt === 'number' ? right.session.header.createdAt : 0
        return b - a
      })
  } catch {
    return []
  }
}

/**
 * 与某预设匹配的最新活动根 agent。
 * `presetId` 缺省 = 不挑预设，取最新根会话（当前会话视图用）。
 */
function liveAgentForPreset(ctx, presetId) {
  for (const agent of listRootAgents(ctx)) {
    if (presetId === undefined || presetId === '') return agent
    try {
      if (presetIdOfAgent(ctx, agent) === presetId) return agent
    } catch { /* 单个 agent 的投影读不到：试下一个 */ }
  }
  return undefined
}

/** 最新创建的根 agent：面板是进程级单例，这就是「当前会话」的判定口径。 */
function currentLiveAgent(ctx) {
  return liveAgentForPreset(ctx, undefined)
}

/** 阶段投影状态 → 预览用的阶段名。 */
function phaseNameOf(status) {
  return phaseOfStatus(status)
}

/** 某 scope 链上的段名集合（用于判断一个段是不是 agent 作用域独有的）。 */
function sectionNamesOf(ctx, scopeKey) {
  try {
    const merged = ctx.systemPrompt?.layers?.merge?.(scopeKey, (layer) => layer.sections)
    return new Set(merged?.keys?.() ?? [])
  } catch {
    return new Set()
  }
}

/** 某 scope 链上某个注册表（sections / contexts）的成员名集合。 */
function namesOf(ctx, scopeKey, table) {
  try {
    const merged = ctx.systemPrompt?.layers?.merge?.(scopeKey, (layer) => layer[table])
    return new Set(merged?.keys?.() ?? [])
  } catch {
    return new Set()
  }
}

/**
 * 某批 scope 链上的「段名 → 宿主注册的规范数值 order」。宿主 `SystemPrompt`
 * 对段按注册时的 `order`（数值，同序按名字）排序，这就是模型实收顺序；面板
 * 必须用它排序，而不是注入序 / 数组下标，否则池里新出现的段会一律挤到尾部。
 * 同名字段以先出现的 scope 为准（同名字段的 order 在各 scope 里本就一致）。
 */
function sectionOrderMap(ctx, scopeKeys) {
  const out = new Map()
  for (const scopeKey of scopeKeys) {
    try {
      const merged = ctx.systemPrompt?.layers?.merge?.(scopeKey, (layer) => layer.sections)
      for (const [name, section] of merged?.entries?.() ?? []) {
        if (typeof section?.order === 'number' && !out.has(String(name))) out.set(String(name), section.order)
      }
    } catch { /* 该 scope 不可枚举：跳过，交给名字兜底 */ }
  }
  return out
}

/** 按规范 order 排段（缺失的排到最后，同序按名字）；orderOf 缺席时原样返回。 */
function sortSectionsByOrder(list, orderOf) {
  if (!(orderOf instanceof Map) || orderOf.size === 0) return list
  return list.slice().sort((a, b) => {
    const ra = orderOf.get(String(a.name)) ?? Number.MAX_SAFE_INTEGER
    const rb = orderOf.get(String(b.name)) ?? Number.MAX_SAFE_INTEGER
    return ra - rb || String(a.name).localeCompare(String(b.name))
  })
}

/** 本插件 MCP 遮蔽账本的批量查询（宿主半身注入；失败视为无遮蔽）。 */
async function ownMaskedToolNames(toolMask, presetId, names, cwd) {
  if (typeof toolMask !== 'function' || presetId === undefined || names.length === 0) return new Set()
  try {
    const result = await toolMask(presetId, names, cwd)
    return result instanceof Set ? result : new Set(Array.isArray(result) ? result : [])
  } catch {
    return new Set()
  }
}

/**
 * 某 scope 链上「工具名 → 工具定义对象（引用）」。
 *
 * 用途：判定「同名但其实是不同注册」的遮蔽。宿主把继承来的全局工具原样透传到
 * agent 作用域时，两处取到的是**同一个定义对象**；被 agent 作用域的同名工具顶掉
 * 时是**不同对象**。旧宿主 / 测试没有 `tools.definitions` 时返回 null，调用方退化
 * 为「同名即同一工具」。
 */
function toolDefsOf(ctx, scopeKey, mergeGlobal = false) {
  if (typeof ctx.tools?.definitions !== 'function') return null
  const mapOf = (defs) => {
    const map = new Map()
    for (const def of Array.isArray(defs) ? defs : []) if (def?.name !== undefined) map.set(String(def.name), def)
    return map
  }
  if (!mergeGlobal) {
    const scopes = scopeKey === undefined ? [undefined] : [scopeKey, undefined]
    for (const scope of scopes) {
      let defs = []
      try { defs = ctx.tools.definitions(scope) ?? [] } catch { defs = [] }
      if (Array.isArray(defs) && defs.length > 0) return mapOf(defs)
    }
    return null
  }
  const map = new Map()
  const absorb = (scope, override) => {
    let defs = []
    try { defs = ctx.tools.definitions(scope) ?? [] } catch { defs = [] }
    for (const def of Array.isArray(defs) ? defs : []) {
      if (def?.name === undefined) continue
      const name = String(def.name)
      if (override || !map.has(name)) map.set(name, def)
    }
  }
  if (scopeKey !== undefined) absorb(scopeKey, true)
  absorb(undefined, false)
  return map.size > 0 ? map : null
}

/**
 * 工具的「完整目录」：预设注册表 ∪ agent 实际可见集。
 *
 * 两类条目标记出来，供 UI 解释为什么勾选/不勾选：
 *  - `scope: 'agent'`：只在 agent 自己的作用域注册（插件动态添加，本插件
 *    的 restrict 无法拒绝作用域内名字）；
 *  - `maskedByPlugin`：预设注册表里有、但 agent 实际视图没有（被别的插件
 *    restrict 掉）；`maskedByOwnPlugin` 是本插件自己的 MCP 遮蔽账本；
 *    `masked-shadow`：被 agent 作用域的同名插件工具顶掉（同名遮蔽），来源标
 *    继承层而不是 agent（2.1.1）。
 *
 * `hidden` 只表示本插件当前阶段的 exclude（可编辑项）；别的插件的 restrict
 * 不允许本插件反向解除，UI 据此置灰。
 */
async function buildToolUnion(ctx, presetScopeKey, liveAgent, cfg, phaseStatus, options = {}) {
  const presetTools = toolSchemasOf(ctx, presetScopeKey, true)
  const liveTools = liveAgent === undefined ? [] : toolSchemasOf(ctx, liveAgent)
  const extraTools = Array.isArray(options.extraTools) ? options.extraTools : []
  const presetDefs = toolDefsOf(ctx, presetScopeKey, true)
  const liveDefs = liveAgent === undefined ? null : toolDefsOf(ctx, liveAgent)
  const globalDefs = toolDefsOf(ctx, undefined)
  const hasLive = liveAgent !== undefined
  const sectionCatalog = promptSectionCatalog(ctx, hasLive ? liveAgent : presetScopeKey, {
    role: hasLive ? 'agent' : 'preset',
    presetId: options.presetId,
    agent: liveAgent,
    presetScopeKey,
  })
  const presetByName = new Map()
  for (const tool of presetTools) {
    if (tool?.name !== undefined) presetByName.set(String(tool.name), tool)
  }
  const liveByName = new Map()
  for (const tool of liveTools) {
    if (tool?.name !== undefined) liveByName.set(String(tool.name), tool)
  }
  const phaseFilter = pickToolsFilter(cfg?.tools, phaseStatus)
  const phaseExclude = Array.isArray(phaseFilter.exclude) ? phaseFilter.exclude : []
  const allExclude = []
  for (const phase of PHASES) {
    const tools = phase.toolField === undefined ? cfg?.tools : cfg?.tools?.[phase.toolField]
    for (const entry of Array.isArray(tools?.exclude) ? tools.exclude : []) {
      const normalized = normalizeEntry(entry)
      if (normalized !== undefined) allExclude.push(normalized)
    }
  }
  const names = []
  const seen = new Set()
  const push = (name) => {
    if (typeof name !== 'string' || name === '' || seen.has(name)) return
    seen.add(name)
    names.push(name)
  }
  for (const name of presetByName.keys()) push(name)
  for (const name of liveByName.keys()) push(name)
  const extraByName = new Map()
  for (const tool of extraTools) {
    if (tool?.name === undefined) continue
    const name = String(tool.name)
    extraByName.set(name, tool)
    push(name)
  }
  // 本插件过去阶段 / 其它阶段藏过、但注册表里仍在的名字也要能回显（否则切
  // 阶段时那一行会消失，用户没法把勾选补回来）。
  for (const entry of allExclude) if (presetByName.has(entry.name) || liveByName.has(entry.name)) push(entry.name)

  const maskedByOwn = await ownMaskedToolNames(options.toolMask, options.presetId, names, options.cwd)
  const descOf = (...cands) => {
    for (const cand of cands) if (typeof cand?.description === 'string' && cand.description !== '') return cand.description
    return ''
  }
  const rows = []
  const emit = (name, state, description, keySuffix, sourceOverride, shadowedBy, extra) => {
    const source = sourceOverride ?? (state === 'locked-executor'
      ? { kind: 'executor' }
      : state === 'locked-agent'
        ? agentSourceOf(liveAgent)
        : sourceForTool(ctx, name, {
          role: hasLive ? 'agent' : 'preset',
          presetId: options.presetId,
          agent: liveAgent,
          presetScopeKey,
        }))
    const row = {
      name,
      description,
      ...source === undefined ? {} : { source },
      hidden: (state === 'controllable' || state === 'locked-agent')
        ? matchesAny(phaseExclude, { name, source })
        : false,
      state,
      ...(state === 'locked-agent' ? { scope: 'agent' } : {}),
      ...(state === 'locked-executor' ? { scope: 'executor' } : {}),
      ...(state === 'masked-plugin' ? { maskedByPlugin: true } : {}),
      ...(state === 'masked-own' ? { maskedByOwnPlugin: true } : {}),
      ...(state === 'masked-shadow' ? { maskedByShadow: true } : {}),
      ...(shadowedBy === undefined ? {} : { shadowedBy }),
      ...(() => {
        const promptSections = toolPromptSectionsOf(name, sectionCatalog)
        return promptSections.length === 0 ? {} : { promptSections }
      })(),
      ...(keySuffix === undefined ? {} : { keySuffix }),
    }
    // 行级附加字段（层身份 / 本插件遮蔽 / PTC 折叠）统一在这里合入，
    // 调用点不必为每种状态重复展开（ADR-0006）。
    if (extra !== undefined) Object.assign(row, extra)
    rows.push(row)
  }
  // 当前阶段本插件 exclude 的名字集：名字级匹配（运行时 restrict 与
  // tools/pre-execute 也都按名字拒绝），source 会随会话变化不能作基准。
  const ownHiddenNames = new Set(phaseExclude
    .map((entry) => (entry !== null && typeof entry === 'object' ? entry.name : entry))
    .filter((name) => typeof name === 'string' && name !== ''))
  /**
   * 同一名字在 global / preset / agent 三层的注册身份（按定义引用去重，内层在前）。
   * 宿主 `tools.view()` 是私有的，公开 API 只有各 scope 的 `definitions()`；
   * 逐层取引用再比对即可推出「谁生效、哪些被同名覆盖」，不靠名字猜。
   */
  const layerIdentitiesOf = (name) => {
    const layers = [
      ['global', globalDefs === null ? undefined : globalDefs.get(name)],
      ['preset', presetDefs === null ? undefined : presetDefs.get(name)],
      ['agent', liveDefs === null ? undefined : liveDefs.get(name)],
    ]
    const list = []
    for (const [layer, def] of layers) {
      if (def === undefined) continue
      // 宿主可能对每次 definitions() 返回副本：引用不同但名字 + 描述都相同时
      // 视为同一注册；只有描述确实不同才算「被同名覆盖」的不同注册。
      if (list.some((item) => item.def === def
        || (typeof item.def?.description === 'string' && item.def.description !== ''
          && item.def.name === def?.name && item.def.description === def?.description))) continue
      list.push({ layer, def })
    }
    return list
  }
  /** 某层身份对应的来源（global / preset 走预设视图解析，agent 走会话来源）。 */
  const sourceOfToolLayer = (name, layer) => sourceForTool(ctx, name, {
    role: layer === 'agent' ? 'agent' : 'preset',
    presetId: options.presetId,
    agent: layer === 'agent' ? liveAgent : undefined,
    presetScopeKey,
  })
  for (const name of names) {
    const presetTool = presetByName.get(name)
    const liveTool = liveByName.get(name)
    const extraTool = extraByName.get(name)
    const inPreset = presetTool !== undefined
    const inLive = liveTool !== undefined
    const inExtra = extraTool !== undefined
    if (maskedByOwn.has(name)) { emit(name, 'masked-own', descOf(presetTool, liveTool, extraTool)); continue }
    // ── 生效判定（ADR-0006）：本插件遮蔽 → 同名多来源 → 外部不可见 ─────────
    // 1) 本插件阶段遮蔽：命中者留在主列表原位、未勾选（2.0.15 的「可反选」回归约束）。
    if (ownHiddenNames.has(name)) {
      if (!inLive) {
        emit(name, 'controllable', descOf(presetTool, liveTool, extraTool), undefined, undefined, undefined,
          { hidden: true, ownHidden: true })
        continue
      }
      if (!inPreset) {
        emit(name, 'locked-agent', descOf(liveTool, presetTool), undefined, undefined, undefined,
          { hidden: true, ownHidden: true })
        continue
      }
    }
    // 2) 同名多来源：最内层生效进主列表，其余每一层身份都进只读池（同名被覆盖）。
    const identities = layerIdentitiesOf(name)
    if (identities.length > 1) {
      const winner = identities[identities.length - 1]
      const winnerSource = sourceOfToolLayer(name, winner.layer)
      if (inLive) {
        emit(name, 'locked-agent', descOf(liveTool, presetTool), 'live', winnerSource, undefined, { layer: winner.layer })
      } else if (hasLive) {
        // 有活动会话但该名字不在它的视图里：被外部收窄 → 只读池（外部不可见）。
        emit(name, 'masked-plugin', descOf(presetTool, liveTool), undefined, winnerSource, undefined, { layer: winner.layer })
      } else {
        // 无活动会话：只能确定「预设视图里谁生效、谁被同名覆盖」，不能断定
        // 外部收窄，所以生效项保持可控、落选项进只读池（不谎称不可见）。
        emit(name, 'controllable', descOf(presetTool, liveTool), undefined, winnerSource, undefined, { layer: winner.layer })
      }
      for (const loser of identities.slice(0, -1)) {
        emit(name, 'masked-shadow', descOf(loser.def, presetTool), 'shadowed',
          sourceOfToolLayer(name, loser.layer), { name, source: winnerSource }, { layer: loser.layer })
      }
      continue
    }
    // 3) 单一身份但不在 agent 视图：被别的插件在自己的作用域收窄（外部不可见，只读）。
    if (hasLive && !inLive && inPreset) {
      emit(name, 'masked-plugin', descOf(presetTool, liveTool), undefined, undefined, undefined, { layer: 'preset' })
      continue
    }
    // 4) 旧宿主没有 tools.definitions：保留 2.1.1 的多证据同名判定，行为不变。
    // 4) schemas 描述差异兜底：宿主 definitions 仍指向旧定义（stale）或确实没有
    //    definitions 时，描述不同即「不同注册」，把继承层那一份放进池（2.1.1 的
    //    多证据判定，命中任一即可，不依赖引用相等）。
    {
      const inheritedSchema = presetByName.get(name)
      const inheritedDef = presetDefs?.get(name) ?? globalDefs?.get(name)
      const inheritedDescription = inheritedSchema?.description ?? inheritedDef?.description
      const descriptionDiffers = inheritedDescription !== undefined && liveTool?.description !== undefined
        && String(inheritedDescription) !== String(liveTool.description)
      if (inLive && inPreset && descriptionDiffers) {
        const inheritedSource = sourceForTool(ctx, name, {
          role: 'preset', presetId: options.presetId, agent: undefined, presetScopeKey,
        })
        emit(name, 'locked-agent', descOf(liveTool, inheritedSchema, inheritedDef), 'live')
        emit(name, 'masked-shadow', descOf(inheritedSchema, inheritedDef, presetTool), 'shadowed',
          inheritedSource, { name, source: agentSourceOf(liveAgent) })
        continue
      }
    }
    // 5) 其余：agent 作用域注册 / 执行器包装 / 预设可见。
    if (inLive && !inPreset) { emit(name, 'locked-agent', descOf(liveTool)); continue }
    if (!inPreset && !inLive && inExtra) { emit(name, 'locked-executor', descOf(extraTool, liveTool)); continue }
    if (inPreset) { emit(name, 'controllable', descOf(presetTool, liveTool)); continue }
    emit(name, 'locked-executor', descOf(extraTool, liveTool))
  }
  // 排序：跟随宿主最终目录顺序（`assembled.tools` 的顺序，含 PTC 的 run_code
  // 包装）；不在其中的（agent 作用域新增 / 被遮蔽 / 执行器包装）追加在后、按
  // 名字稳定排序 —— 不再按注册表枚举序乱排。
  const finalRank = new Map()
  let rank = 0
  for (const tool of extraTools) {
    const name = tool?.name === undefined ? undefined : String(tool.name)
    if (name !== undefined && !finalRank.has(name)) finalRank.set(name, rank++)
  }
  const rankOf = (row) => (row.state === 'masked-plugin' || row.state === 'masked-own' || row.state === 'masked-shadow')
    ? Number.MAX_SAFE_INTEGER
    : (finalRank.has(row.name) ? finalRank.get(row.name) : Number.MAX_SAFE_INTEGER - 1)
  rows.sort((a, b) => rankOf(a) - rankOf(b) || a.name.localeCompare(b.name) || String(a.state).localeCompare(String(b.state)))
  return { rows, registryTools: names }
}

/**
 * 清单身份必须跨会话稳定：运行时 `sourceForEntry` 给 agent 来源带上 session id，
 * 但配置按预设存、草稿与屏蔽名单必须在新会话里继续命中。`model.js:entryMatches`
 * 已对 agent 按 kind 匹配，这里把清单 / 预览里的 agent 来源统一收敛成
 * `{ kind: 'agent' }`，让 UI 写入的名单、`entryKey` 与运行时候选三者身份一致。
 */
function stableSourceOf(item) {
  const source = item?.source
  if (source === undefined || source === null) return undefined
  return source.kind === 'agent' ? { kind: 'agent' } : source
}

/**
 * 合并「预设装配」与「同预设活动 agent 装配」的预过滤段 / 上下文。
 * 按 name+source 去重（ADR-0002 同名不同源分列），agent 视图优先；没有任何
 * 硬编码段名，任何作用域新注册的段都会自动进入清单（ADR-0005）。
 */
function mergePromptEntries(presetEntries, liveEntries) {
  const out = []
  const seen = new Set()
  const ordered = [
    ...(Array.isArray(liveEntries) ? liveEntries : []),
    ...(Array.isArray(presetEntries) ? presetEntries : []),
  ]
  for (const item of ordered) {
    if (item === null || typeof item !== 'object') continue
    const name = String(item.name ?? '')
    if (name === '') continue
    const source = stableSourceOf(item)
    const key = entryKey({ name, ...(source === undefined ? {} : { source }) })
    if (key === '' || seen.has(key)) continue
    seen.add(key)
    out.push(source === item.source ? item : { ...item, source })
  }
  return out
}

/**
 * 预设预览的左栏「基座」：预设 base 段 + 同预设活动 agent 的 agent 作用域段。
 * 调用方把两份视图先经 `mergePromptEntries` 合并；本函数负责按 name+source
 * 装饰 blocked / replaced 并给 agent 来源打 `scope: 'agent'`（UI「会话级」徽标）。
 */
function mergeAgentScopedSections(presetSections, liveSections, denied, replacements, orderOf) {
  const base = Array.isArray(presetSections) ? presetSections : []
  const live = Array.isArray(liveSections) ? liveSections : []
  const baseByName = new Map(base.map((section) => [String(section.name), section]))
  const decorate = (section) => {
    const name = String(section.name)
    const source = section.source ?? baseByName.get(name)?.source
    const candidate = source === undefined ? { name } : { name, source }
    return {
      name,
      text: section.text,
      ...source === undefined ? {} : { source },
      blocked: matchesAny(denied, candidate),
      replaced: section.replaced === true || matchesAny(replacements, candidate),
      ...(section.scope !== undefined ? { scope: section.scope } : source?.kind === 'agent' ? { scope: 'agent' } : {}),
    }
  }
  if (live.length === 0) return sortSectionsByOrder(base.map(decorate), orderOf)
  const present = new Set(base.map((section) => {
    const source = section.source
    return source === undefined ? String(section.name) : entryIdentity(section, source)
  }))
  const out = []
  const seen = new Set()
  for (const section of live) {
    const name = String(section.name)
    const source = section.source ?? baseByName.get(name)?.source
    const identity = source === undefined ? name : entryIdentity({ name }, source)
    out.push(decorate({ ...section, ...source === undefined ? {} : { source } }))
    seen.add(identity)
  }
  for (const section of base) {
    const source = section.source
    const identity = source === undefined ? String(section.name) : entryIdentity(section, source)
    if (!seen.has(identity)) {
      out.push(decorate(section))
      seen.add(identity)
      if (!present.has(identity)) out[out.length - 1].scope = 'agent'
    }
  }
  return sortSectionsByOrder(out, orderOf)
}

/** name+source 身份字符串。 */
function entryIdentity(value, source) {
  return entryKey({ name: String(value.name), ...source === undefined ? {} : { source } })
}

/** 枚举当前生效的段与工具，并附上各自的屏蔽 / 隐藏标记。 */
async function buildInventory(ctx, raw, scopeKey, presetId, _catalog, preview) {
  // 生效配置：目标预设 override + 工作区 override（预览已合并好则为 preview.config）。
  const cfg = preview?.config ?? effectiveConfig(raw.overrides?.[presetId])
  // 清单并入同预设活动 agent 的会话级段（ADR-0005），但阶段恒展示静态
  // （晋级后）视图：三阶段名单由 /preview 的名义阶段各自给出，与此处无关。
  const status = statusOfPhase('active')
  const denied = pickSectionsForStatus(cfg, status)
  const replacements = filterReplacementsByPhase(cfg.replacements, status)
  const te = pickToolsFilter(cfg.tools, status)

  // 规范 order：来自预览（buildPreview 已按预设作用域链 + live agent 汇总）。
  const orderOf = new Map(Object.entries(preview.sectionOrder ?? {}))
  const seenSections = (preview.baseSections ?? []).map((section) => ({
    name: section.name,
    order: orderOf.get(String(section.name)) ?? Number.MAX_SAFE_INTEGER,
    text: section.text,
    ...(section.source === undefined ? {} : { source: section.source }),
    ...(section.scope === 'agent' ? { scope: 'agent' } : {}),
    ...(section.toolPrompt === undefined ? {} : { toolPrompt: section.toolPrompt }),
  }))
  // 工具来自预览的完整目录（预设注册表 ∪ 当前会话 agent 视图）：既包含被
  // 其它插件 restrict 掉、仍应可解释的条目，也包含只在 agent 作用域注册的
  // 工具。scope / masked 标记原样透出，供左栏置灰与徽标使用。
  const seenCatalog = preview.catalogTools ?? preview.baseTools
  const seenTools = (Array.isArray(seenCatalog) ? seenCatalog : [])
    .map((tool) => ({
      name: String(tool.name),
      description: typeof tool.description === 'string' ? tool.description : '',
      ...(typeof tool.state === 'string' ? { state: tool.state } : {}),
      ...(tool.scope === 'agent' || tool.scope === 'executor' ? { scope: tool.scope } : {}),
      ...(tool.source === undefined ? {} : { source: tool.source }),
      ...(tool.keySuffix === undefined ? {} : { keySuffix: tool.keySuffix }),
      ...(tool.maskedByPlugin === true ? { maskedByPlugin: true } : {}),
      ...(tool.maskedByOwnPlugin === true ? { maskedByOwnPlugin: true } : {}),
      ...(tool.maskedByShadow === true ? { maskedByShadow: true } : {}),
      ...(tool.shadowedBy === undefined ? {} : { shadowedBy: tool.shadowedBy }),
      ...(tool.promptSections === undefined ? {} : { promptSections: tool.promptSections }),
    }))

  // 清单只来自「当前预设 + 同预设活动 agent 的真实装配」：有就有、没有就没有。
  // 不再读任何累积池，也不需要手动重扫；预设之间天然隔离（ADR-0005）。
  const sections = seenSections
    .map((item) => ({
      ...item,
      order: orderOf.get(String(item.name)) ?? Number.MAX_SAFE_INTEGER,
      active: !matchesAny(denied, item),
      replaced: matchesAny(replacements, item),
    }))
    .sort((a, b) => a.order - b.order || String(a.name).localeCompare(String(b.name)))
  const tools = seenTools
    .map((item) => ({ ...item, hidden: matchesAny(te.exclude, item) }))

  const ctxDenied = pickContextsForStatus(cfg, status)
  const contexts = (Array.isArray(preview.baseContexts) ? preview.baseContexts : []).map((c) => ({
    name: String(c?.name ?? ''),
    text: String(c?.text ?? ''),
    ...(c?.source === undefined ? {} : { source: c.source }),
    active: !matchesAny(ctxDenied, c),
  }))
  return { sections, tools, contexts, config: cfg }
}

/** Resolve the selected mode without creating, selecting or modifying a conversation. */
async function previewTarget(ctx, req, body = null) {
  const query = queryOf(req)
  const target = await acquireTarget(ctx, query.get('scope') ?? undefined)
  const rawPhase = body?.phase ?? query.get('phase')
  let phase
  let invalidPhase
  if (rawPhase !== undefined && rawPhase !== null && rawPhase !== '') {
    if (PHASE_KEYS.includes(rawPhase)) phase = rawPhase
    else invalidPhase = String(rawPhase)
  }
  return { ...target, phase, invalidPhase }
}

/**
 * 「接管一切系统提示词」的发现入口（ADR-0005）。插件在 `agent/created` 里用
 * `ctx.systemPrompt.section()` / `context()` 注册到 agent 作用域的段不会出现在预设
 * scope 的装配里 —— 宿主 `layers` 是单向作用域链，没有「列出所有作用域」的 API，
 * 只有用该 agent 自己的 scope 跑一次真实装配才能枚举到。一次 base 装配同时给出
 * 预过滤清单（`promptCustomizerBaseView`）与过滤后的正文（`sections`）。
 *
 * 工具目录刻意不走这里：2.0.x 的工具目录 / restrict / 遮蔽池按预设 scope 独立算，
 * 混入 agent scope 会推翻那一组回归约束；提示词与工具两条数据源保持分离。
 * 无活动会话时宿主没有可枚举的 agent 作用域，只能退回纯预设装配 —— 这是唯一的
 * 条件边界，也是插件必须自己把段注册在预设 / 全局层才能「无会话也可控」的原因。
 */
async function collectLivePromptView(ctx, liveHint) {
  try {
    return await ctx.systemPrompt.assemble(liveHint)
  } catch (error) {
    warnOnce(`prompt-customizer: 会话级提示词装配失败，本次退回纯预设装配：${String((error && error.message) || error)}`)
    return undefined
  }
}

/** Assemble one leased mode revision; unresolved session variables stay in the template. */
async function buildPreview(ctx, rawConfig, target, phase, _catalog, patch, patchTarget, toolMask) {
  const scopeKey = target?.scopeKey
  const hintId = target?.hintId
  const configTargetId = hintId
  // 编辑目标必须明确：客户端 /inventory 与 /preview 都带 ?scope；无显式 scope 的
  // 诊断请求用最新根会话所属预设兜底，绝不猜「全部预设」，避免跨预设串台（D5）。
  // 两份装配必须共用同一个 preset id，否则清单的 blocked 标记与预览的过滤结果会打架。
  const catalogAgent = configTargetId === undefined
    ? latestRootAgent(ctx)
    : liveAgentForPreset(ctx, configTargetId)
  const editPresetId = configTargetId ?? (catalogAgent === undefined ? undefined : presetIdOfAgent(ctx, catalogAgent))
  const livePromptAgent = editPresetId === undefined ? undefined : liveAgentForPreset(ctx, editPresetId)
  // promptCustomizerPreset / promptCustomizerPhase 都是本插件的自定义装配
  // 字段：让我们的过滤器在这次装配里按该 agent 预设的 override 与指定阶段
  // 视图生效（AssembleContext 允许插件自定义字段）。
  const hint = {
    scope: scopeKey,
    promptCustomizerPreset: editPresetId,
    promptCustomizerPresetScope: scopeKey,
    promptCustomizerPhase: phase,
    // 请求预过滤视图（base）：本插件的过滤器把进入过滤前的段 / 工具原文
    // 连同屏蔽 / 隐藏标记一起附在装配结果上，作为面板两个栏的统一数据源。
    promptCustomizerBase: true,
  }
  // 实时预览（UI 未保存草稿）：补丁挂进装配上下文，过滤器在 resolveTarget
  // 里把它叠加到目标层 —— 只读内存，磁盘不动。
  if (patch !== undefined) {
    hint.promptCustomizerPatch = patch
    hint.promptCustomizerTarget = patchTarget
  }
  // Mode preview has no conversation state; session variables remain template references.
  const assembled = await ctx.systemPrompt.assemble(hint)
  // 全域接管（ADR-0005）：同预设活动 agent 的系统提示词真实视图。只取「同预设」
  // 的 agent，绝不拿最新会话顶替，否则编辑 A 预设会混入 B 预设会话的会话级段。
  // hint 全量复用（含草稿 patch 与名义阶段），只覆盖 scope / agent，保证两份装配
  // 走同一份生效配置、同一阶段、同一草稿，预览与清单才不会互相打架。
  const livePromptView = livePromptAgent === undefined
    ? undefined
    : await collectLivePromptView(ctx, { ...hint, scope: livePromptAgent, agent: livePromptAgent })
  const previewSource = livePromptView ?? assembled
  const liveBase = (livePromptView && typeof livePromptView === 'object' && livePromptView.promptCustomizerBaseView) || {}
  const diagnostics = []
  const sections = Array.isArray(previewSource.sections)
    ? previewSource.sections.map(section => {
      const source = stableSourceOf(section)
      return {
        name: section.name,
        text: renderSection(section, previewSource.variables ?? {}, diagnostics),
        ...(source === undefined ? {} : { source }),
      }
    })
    : []
  // 预过滤视图（base）：段来自预设 + 同预设活动 agent 两份装配 base 视图的并集；
  // 工具目录 0.2.2 起改从注册表读，仍按预设装配单独算，不与段合并。
  const baseView = (assembled && typeof assembled === 'object' && assembled.promptCustomizerBaseView) || {}
  const phaseStatus = statusOfPhase(phase === undefined ? 'active' : phase) ?? statusOfPhase('active')
  // 草稿预览必须和 /config/apply 共用同一套 overlayPatch 语义；否则工具目录
  // 仍按磁盘值算，勾选工具后左侧/右侧/计数都不会反映未保存状态。
  const previewRaw = patch !== undefined
    ? overlayPatch({ ...(rawConfig ?? {}) }, patchTarget ?? configTargetId, patch)
    : rawConfig
  const previewCfg = effectiveConfig(previewRaw?.overrides?.[editPresetId])
  const previewToolFilter = pickToolsFilter(previewCfg.tools, phaseStatus)
  const previewDenied = pickSectionsForStatus(previewCfg, phaseStatus)
  const previewContextsDenied = pickContextsForStatus(previewCfg, phaseStatus)
  const previewReplacements = filterReplacementsByPhase(previewCfg.replacements, phaseStatus)
  // 段的规范顺序取「预设作用域链 ∪ 同预设活动 agent 作用域链」：agent 作用域段
  // 的 order 只存在于 agent 链，不补这一条会被一律排到清单尾部。
  const sectionOrder = sectionOrderMap(ctx, livePromptAgent === undefined
    ? [scopeKey]
    : [scopeKey, livePromptAgent])
  const baseSections = mergeAgentScopedSections(
    mergePromptEntries(baseView.sections ?? [], liveBase.sections ?? []),
    [], previewDenied, previewReplacements, sectionOrder)
    .map(decorateToolPromptSection)
  const finalTools = Array.isArray(assembled.tools) ? assembled.tools : []
  // 真实会话的装配 scope 是 live Agent 自身（宿主 assembleContextFor → scope: agent，
  // agent-loop 用 resolve 的 toolSet 装配，assembly.tools → GenerateOptions.tools），
  // 不是 presetScopeKey：assemble({scope: presetScopeKey}).tools 只有预设层可见集，
  // 会少掉 agent 作用域注册 / 同名 shadow 的工具（2.1.2 修复 38 vs 50）。
  // 插件拿不到 modelSelection/signal，无法调 ctx.tools.resolve() 复刻步骤准入。
  // 主源用 ctx.tools.schemas(agent)（agent scope 注册视图全集，global+preset+agent own，
  // shadow/restrictions 已生效）：不经 executor，PTC 模式下也不会像
  // assemble().tools 那样被塌缩成只剩 run_code，且与 /session 的 visibleTools 同源。
  // 只有在 schemas 不可用时才回落 PromptAssembly.tools / 预设装配。
  // finalTools 仍保留预设装配，供 buildToolUnion 的 extraTools / 排序用，避免改动遮蔽池结构。
  const visibleFinalTools = livePromptAgent === undefined
    ? finalTools
    : (() => {
        const schemas = toolSchemasOf(ctx, livePromptAgent, true)
        if (schemas.length > 0) return schemas
        const live = Array.isArray(previewSource.tools) ? previewSource.tools : []
        return live.length > 0 ? live : finalTools
      })()
  // 真值来源（ADR-0006）：把「同预设活动 agent」的视图当作主数据源 —— 主列表 =
  // 该阶段真实可见集 ∪ 本插件遮蔽集；预设注册表退为「能加回什么」的参考。
  // 无活动会话时 catalogAgent 缺席，自然退回预设视图，由 truth.linked 标注降级。
  const union = await buildToolUnion(ctx, scopeKey, catalogAgent, previewCfg, phaseStatus, {
    toolMask,
    presetId: configTargetId,
    ...(typeof catalogAgent?.session?.header?.cwd === 'string' && catalogAgent.session.header.cwd !== ''
      ? { cwd: catalogAgent.session.header.cwd } : {}),
    extraTools: finalTools,
  })
  // PTC 折叠（ADR-0006 例外）：PTC 模式下模型只收到 run_code，但被折叠的工具仍会
  // 注入各自的提示词段 —— 折叠只作用于工具域的工具声明，不作用于提示词域。
  const ptcSectionVisible = sections.some(section => section.name === 'tools:ptc-only' && String(section.text ?? '').trim() !== '')
  const ptcCollapsed = ptcSectionVisible || (finalTools.length === 1 && String(finalTools[0]?.name) === 'run_code')
  const keepUnderPtc = (row) => row.name === 'run_code' || row.state === 'masked-own'
    || row.state === 'masked-plugin' || row.state === 'masked-shadow' || row.ownHidden === true
  let baseTools = union.rows
  if (ptcCollapsed) {
    const kept = baseTools.filter(keepUnderPtc)
    const folded = baseTools.filter((row) => !keepUnderPtc(row)).map((row) => ({
      ...row,
      state: 'masked-ptc',
      maskedByPtc: true,
      hidden: false,
      ptcCollapsed: true,
    }))
    if (!kept.some((row) => row.name === 'run_code')) {
      kept.unshift({ name: 'run_code', description: '', state: 'locked-executor', scope: 'executor', hidden: false, layer: 'executor' })
    }
    baseTools = [...kept, ...folded]
  }
  // 主列表与只读池共用这一份行集（catalogTools 保留字段名以兼容旧客户端）。
  const catalogTools = baseTools
  const promptSectionsByName = new Map()
  for (const tool of [...baseTools, ...catalogTools]) {
    if (tool.promptSections !== undefined && !promptSectionsByName.has(tool.name)) {
      promptSectionsByName.set(tool.name, tool.promptSections)
    }
  }
  const toolSourceByName = new Map(baseTools.map((row) => [row.name, row.source]))
  const toolCandidate = (tool) => {
    const name = typeof tool?.name === 'string' ? tool.name : String(tool?.name)
    const source = toolSourceByName.get(name) ?? { kind: 'executor' }
    return { name, source }
  }
  const toolExcluded = (tool) => matchesAny(previewToolFilter.exclude, toolCandidate(tool))
  // 预览带 scope，是「浏览其它预设」时唯一真正跑过该预设装配的入口 —— 把它
  // 见到的工具由 catalogTools 补扫进完整目录；段清单已由两份真实装配的并集给出，
  // 按宿主规范 order 排（ADR-0001 已删登记表，ADR-0005 不再按追加序补）。
  // 计数与「注册表」清单也必须来自 agent scope，否则右栏会显示「50 / 39 注册表」。
  const registryTools = visibleFinalTools.length > 0
    ? visibleFinalTools.map((tool) => String(tool.name ?? ''))
    : union.registryTools
  const registryTotal = registryTools.length
  // 兜底探测（机制无关）：本插件产出的段有多少没进最终装配。下游丢弃段的规则
  // 不止 persona complete 一种（实测 liangshen 引导期由预设自身规则 20 → 1 段，
  // 注册表里没有 complete 段），所以按名字比对结果而不是只看注册表标记。
  // emitted 缺席 = 我们的过滤器没跑（异常回退未加工装配），此时无从比较。
  const emitted = Array.isArray(previewSource.promptCustomizerEmitted) ? previewSource.promptCustomizerEmitted : null
  const survivedNames = new Set(sections.map((section) => String(section.name)))
  const droppedNames = emitted === null ? [] : emitted.filter((name) => !survivedNames.has(String(name)))
  const lostSections = droppedNames.length > 0
    ? { emitted: emitted.length, survived: sections.length, dropped: droppedNames.length }
    : undefined
  return {
    ok: true,
    config: previewCfg,
    contexts: filterEmptyOptionalContexts(previewSource.contexts ?? [], ctx, livePromptAgent ?? scopeKey)
      .filter((item) => !matchesAny(previewContextsDenied, item))
      .map(context => {
        const source = stableSourceOf(context)
        return {
          name: context.name,
          text: renderSection(context, previewSource.variables ?? {}, diagnostics),
          ...(source === undefined ? {} : { source }),
        }
      }),
    registryTotal,
    /** 该 scope 注册表的工具名清单：供界面区分「在本预设里、只是被该阶段裁掉」
     *  与「根本不属于本预设（无法加回）」。 */
    registryTools,
    /** 非空 = 该 scope 有 complete 段整段接管最终提示词（值为那段的名字）。 */
    takenOverBy: previewSource && typeof previewSource === 'object'
      ? (typeof previewSource.promptCustomizerTakenOver === 'string' ? previewSource.promptCustomizerTakenOver : undefined)
      : undefined,
    /** 非空 = 本插件产出的段有若干被下游装配规则丢弃（计数，不含段名列表）。 */
    lostSections,
    /** 真值来源与折叠状态（ADR-0006）：面板据此降级 / 显示横幅。 */
    truth: {
      linked: catalogAgent !== undefined,
      source: catalogAgent === undefined ? 'preset' : 'agent',
      ...(catalogAgent === undefined ? {} : { agentId: sessionIdOf(catalogAgent) }),
      ptcCollapsed,
    },
    /** 同名被覆盖的段（global / preset / agent 三层引用身份去重）：只读池数据源。 */
    sectionPool: (() => {
      const layerOf = (scope) => {
        try {
          const merged = ctx.systemPrompt?.layers?.merge?.(scope, (layer) => layer.sections)
          return merged instanceof Map ? merged : new Map()
        } catch { return new Map() }
      }
      const sourceOfSection = (section, layer) => stableSourceOf({
        source: sourceForEntry(ctx, section, {
          table: 'sections',
          role: layer === 'agent' ? 'agent' : 'preset',
          presetId: configTargetId,
          agent: layer === 'agent' ? livePromptAgent : undefined,
          scopeKey,
          presetScopeKey: scopeKey,
        }),
      })
      const globalSections = layerOf(undefined)
      const presetSections = scopeKey === undefined ? new Map() : layerOf(scopeKey)
      const liveSections = livePromptAgent === undefined ? undefined : layerOf(livePromptAgent)
      const names = new Set([...presetSections.keys(), ...(liveSections?.keys() ?? [])].map(String))
      const out = []
      for (const name of names) {
        const identities = []
        for (const [layer, map] of [['global', globalSections], ['preset', presetSections], ['agent', liveSections]]) {
          if (map === undefined) continue
          const section = map.get(name)
          if (section === undefined) continue
          if (identities.some((item) => item.section === section)) continue
          identities.push({ layer, section })
        }
        if (identities.length < 2) continue
        const winner = identities[identities.length - 1]
        const winnerSource = sourceOfSection(winner.section, winner.layer)
        for (const loser of identities.slice(0, -1)) {
          const loserSource = sourceOfSection(loser.section, loser.layer)
          out.push({
            name,
            layer: loser.layer,
            ...(loserSource === undefined ? {} : { source: loserSource }),
            shadowedBy: { name, ...(winnerSource === undefined ? {} : { source: winnerSource }) },
          })
        }
      }
      return out
    })(),
    sections,
    text: sections.map(section => section.text).filter(Boolean).join('\n\n'),
    diagnostics,
    // 该阶段最终可见的工具目录：与真实会话同源（agent scope 注册视图，2.1.2），
    // 去掉本插件阶段 exclude 与 MCP 遮蔽；提示词正文亦来自同一份真实装配（ADR-0005 D3）。
    // 无活动 agent 时回落到预设装配 / 注册表过滤结果。
    tools: (visibleFinalTools.length > 0
      ? visibleFinalTools
          .filter(tool => !toolExcluded(tool)
            && !baseTools.some(row => row.name === tool.name && row.maskedByOwnPlugin === true))
          .map(tool => ({
            name: typeof tool.name === 'string' ? tool.name : String(tool.name),
            description: typeof tool.description === 'string' ? tool.description : '',
            ...toolSourceByName.get(typeof tool.name === 'string' ? tool.name : String(tool.name)) === undefined
              ? {}
              : { source: toolSourceByName.get(typeof tool.name === 'string' ? tool.name : String(tool.name)) },
            ...(promptSectionsByName.has(typeof tool.name === 'string' ? tool.name : String(tool.name))
              ? { promptSections: promptSectionsByName.get(typeof tool.name === 'string' ? tool.name : String(tool.name)) }
              : {}),
          }))
      : baseTools
          .filter(tool => tool.scope !== 'agent'
            && tool.maskedByOwnPlugin !== true
            && !matchesAny(previewToolFilter.exclude, tool))
          .map((tool) => ({
            name: typeof tool.name === 'string' ? tool.name : String(tool.name),
            description: typeof tool.description === 'string' ? tool.description : '',
            ...tool.source === undefined ? {} : { source: tool.source },
            ...(tool.promptSections === undefined ? {} : { promptSections: tool.promptSections }),
          }))),
    // 预过滤视图：段（含该阶段独立屏蔽标记 blocked / 替换标记）与工具
    // （含该阶段隐藏标记 hidden）—— 供提示词 / 工具 Tab 渲染「每阶段
    // 独立名单」，被屏蔽 / 被隐藏的条目仍保留在此可反选。
    baseSections,
    baseTools,
    catalogTools,
    baseContexts: filterEmptyOptionalContexts(
      mergePromptEntries(baseView.contexts, liveBase.contexts),
      ctx, livePromptAgent ?? scopeKey),
    /** 段名 → 宿主规范 order（清单按它排序，保证跨预设池也不再乱序）。 */
    sectionOrder: Object.fromEntries(sectionOrder),
  }
}

/**
 * 「当前会话」只读视图：用最新活动根 agent 自己的 scope 跑一次真实装配，
 * 工具取该 agent 的完整可见集（含 agent 作用域注册与所有 restrict），
 * 段保留 agent 作用域标记，base 列表再补预设注册表里被其它插件遮蔽的工具。
 */
async function buildSessionPreview(ctx, rawConfig, presetScopeKey, live, status, _catalog, toolMask) {
  const agent = live.agent
  const presetId = live.presetId
  const hintExtra = presetId === undefined ? {} : {
    promptCustomizerPreset: presetId,
    promptCustomizerPresetScope: presetScopeKey,
  }
  // base 调用只用于左栏 catalog（预过滤段 + 工具原文），绝不当作真实视图。
  const baseAssembled = await ctx.systemPrompt.assemble({ scope: agent, agent, promptCustomizerBase: true, ...hintExtra })
  // 真实视图：再跑一次不带 base 的装配，sections / contexts 以它为准。
  const assembled = await ctx.systemPrompt.assemble({ scope: agent, agent, ...hintExtra })
  const diagnostics = []
  const sections = Array.isArray(assembled.sections)
    ? assembled.sections.map(section => {
      const source = stableSourceOf(section)
      return {
        name: section.name,
        text: renderSection(section, assembled.variables ?? {}, diagnostics),
        ...(source === undefined ? {} : { source }),
      }
    })
    : []
  const baseView = (baseAssembled && typeof baseAssembled === 'object' && baseAssembled.promptCustomizerBaseView) || {}
  const phase = phaseNameOf(status)
  const cfg = effectiveConfig(rawConfig?.overrides?.[presetId])
  const denied = pickSectionsForStatus(cfg, status)
  const replacements = filterReplacementsByPhase(cfg.replacements, status)
  const presetNames = sectionNamesOf(ctx, presetScopeKey)
  const baseSections = (Array.isArray(baseView.sections) ? baseView.sections : []).map((section) => {
    const name = String(section.name)
    const rawSource = section.source ?? sourceForEntry(ctx, section, {
      table: 'sections',
      role: 'agent',
      presetId,
      agent,
      scopeKey: agent,
      presetScopeKey,
    })
    const source = stableSourceOf({ source: rawSource })
    const toolPromptTools = toolsForPromptSection(name)
    return {
      name,
      text: section.text,
      ...source === undefined ? {} : { source },
      blocked: matchesAny(denied, source === undefined ? { name } : { name, source }),
      replaced: section.replaced === true || matchesAny(replacements, source === undefined ? { name } : { name, source }),
      ...(source?.kind === 'agent' || !presetNames.has(name) ? { scope: 'agent' } : {}),
      ...(toolPromptTools.length === 0 ? {} : {
        toolPrompt: {
          tools: toolPromptTools,
          empty: typeof section.text === 'string' && section.text.length === 0,
        },
      }),
    }
  })
  const finalTools = Array.isArray(assembled.tools) ? assembled.tools : []
  const union = await buildToolUnion(ctx, presetScopeKey, agent, cfg, status, {
    toolMask,
    presetId,
    cwd: agent.session?.header?.cwd,
    extraTools: finalTools,
  })
  const promptSectionsByName = new Map(union.rows.map((tool) => [tool.name, tool.promptSections]))
  // 0.2.2 的 PromptPresentation 没有 tools：真实可见集来自 ctx.tools.schemas(scope)，
  // 没有 tools 服务（测试 / 旧宿主）时才回落到装配结果 / base 视图。
  const visibleTools = toolSchemasOf(ctx, agent)
  const actualTools = (visibleTools.length > 0
    ? visibleTools
    : finalTools.length > 0
      ? finalTools
      : Array.isArray(baseView.tools) ? baseView.tools : [])
    .map((tool) => ({
      name: typeof tool.name === 'string' ? tool.name : String(tool.name),
      description: typeof tool.description === 'string' ? tool.description : '',
      ...(() => {
        const source = sourceForTool(ctx, String(tool.name), {
          role: 'agent',
          presetId,
          agent,
          presetScopeKey,
        })
        return source === undefined ? {} : { source }
      })(),
      ...(promptSectionsByName.get(typeof tool.name === 'string' ? tool.name : String(tool.name)) === undefined
        ? {}
        : { promptSections: promptSectionsByName.get(typeof tool.name === 'string' ? tool.name : String(tool.name)) }),
    }))
  const emitted = Array.isArray(assembled.promptCustomizerEmitted) ? assembled.promptCustomizerEmitted : null
  const survivedNames = new Set(sections.map((section) => String(section.name)))
  const droppedNames = emitted === null ? [] : emitted.filter((name) => !survivedNames.has(String(name)))
  const lostSections = droppedNames.length > 0
    ? { emitted: emitted.length, survived: sections.length, dropped: droppedNames.length }
    : undefined
  return {
    ok: true,
    source: 'session',
    session: {
      id: String(agent.session?.header?.id ?? agent.id ?? ''),
      presetId,
      phase,
      createdAt: typeof agent.session?.header?.createdAt === 'number' ? agent.session.header.createdAt : undefined,
    },
    contexts: filterEmptyOptionalContexts(assembled.contexts ?? [], ctx, agent).map(context => {
      const source = stableSourceOf(context)
      return {
        name: context.name,
        text: renderSection(context, assembled.variables ?? {}, diagnostics),
        ...(source === undefined ? {} : { source }),
      }
    }),
    sections,
    text: sections.map(section => section.text).filter(Boolean).join('\n\n'),
    diagnostics,
    tools: actualTools,
    baseSections,
    baseTools: union.rows,
    baseContexts: filterEmptyOptionalContexts(baseView.contexts, ctx, agent),
    registryTools: union.registryTools,
    registryTotal: union.registryTools.length,
    takenOverBy: assembled && typeof assembled === 'object'
      ? (typeof assembled.promptCustomizerTakenOver === 'string' ? assembled.promptCustomizerTakenOver : undefined)
      : undefined,
    lostSections,
  }
}

/** 注册表的工具名清单（解析出的 scope 优先，回退全局层）。任何一步失败都返回
 *  空数组，绝不让预览失败；长度即模型可见目录的对照总数。 */
function registryToolNames(ctx, scopeKey) {
  try {
    const byName = new Map()
    for (const scope of [scopeKey, undefined]) {
      let schemas = []
      try { schemas = ctx.tools.schemas(scope) ?? [] } catch { schemas = [] }
      for (const tool of schemas) if (tool.name) byName.set(tool.name, tool)
      if (byName.size > 0) break
    }
    return [...byName.keys()]
  } catch { return [] }
}

/**
 * 查出该 scope 里是否有一段以 `complete: true` 注册（persona 整段接管）。
 * 宿主 `SystemPrompt.assemble()` 的契约：瀑布流的返回值虽然权威，但存在有效
 * complete 段时会在瀑布流**之后**把 sections 强制还原成那一条段——因此本插件
 * 在瀑布流里做的屏蔽 / 替换 / 注入 / 排序对这类预设完全不进最终提示词（工具
 * 过滤不受影响）。插件侧无法绕开，只能探出来交给 UI 明确告知用户。
 */
function detectCompletePrompt(ctx, scopeKey) {
  try {
    const sections = ctx.systemPrompt.layers.merge(scopeKey, (layer) => layer.sections)
    for (const section of sections.values()) {
      if (section && section.complete === true) return String(section.name)
    }
  } catch { /* 注册表未就绪 / 无 layers 能力 —— 视为未接管 */ }
  return undefined
}

/** Resolve known variables for display; retain session-dependent references with diagnostics. */
function renderSection(section, variables, diagnostics = []) {
  if (section.interpolate === false) return section.text
  const text = String(section.text ?? '')
  let result = '', last = 0
  for (let open = text.indexOf('{{'); open >= 0; open = text.indexOf('{{', last)) {
    const group = /^\{\{([^{}]*)\}\}/.exec(text.slice(open))
    if (!group) {
      if (text.indexOf('}}', open + 2) >= 0) throw new Error('Malformed prompt variable in ' + section.name)
      result += text.slice(last, open + 2)
      last = open + 2
      continue
    }
    const name = group[1]
    if (!/^[a-z][a-z0-9_]*$/.test(name)) throw new Error('Malformed prompt variable in ' + section.name)
    const unresolved = !Object.hasOwn(variables, name) || variables[name] === undefined
    if (unresolved) diagnostics.push({ name: section.name, variable: name, kind: 'session-variable' })
    result += text.slice(last, open) + (unresolved ? group[0] : variables[name])
    last = open + group[0].length
  }
  return result + text.slice(last)
}

function writeJson(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

/** 解析请求 URL 里的查询参数（宿主共享 webserver 的 req 是原始
 *  IncomingMessage，没有 Express 风格的 query 属性）。 */
function queryOf(req) {
  const url = String(req?.url ?? '')
  const i = url.indexOf('?')
  return new URLSearchParams(i >= 0 ? url.slice(i + 1) : '')
}

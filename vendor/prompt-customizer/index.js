/**
 * dsh-prompt-customizer — 宿主端。
 *
 * - 配置存储在插件自有文件 `~/.dsh/prompt-customizer/config.yaml`（可用组合
 *   入口 `dataDir` 覆盖目录），不再占用主文档 settings.yaml。首次启动时若
 *   新文件不存在而主文档里有旧 `prompt-customizer:` 段，自动迁移（主文档
 *   原样保留，可随时回滚旧版），此后本插件不再注册设置命名空间——主文档
 *   的设置页也不会再显示本段落。
 * - 挂钩 `system-prompt/assemble` 瀑布流，按名称屏蔽 / 替换 / 注入提示词段，
 *   并从模型目录中隐藏工具。只影响面向模型的目录；工具与路由照常工作。
 * - 提供 `GET /api/prompt-customizer/inventory`（段/工具清单，`?scope=` 可切
 *   agent 预设；`scopeResolved` 标记 scope 是否成功挂载）、
 *   `GET /api/prompt-customizer/config` 与 `POST /config/set|/config/unset`
 *   （单字段读写）、`POST /config/apply`（批量保存，UI 统一保存按钮的写盘通道）。
 *
 * 定制仅使用 `overrides[agentPreset]`，三个阶段各有独立规则。预览只读取
 * 选中模式的 rc.2 作用域租约，结束即释放；从不匹配或切换已有对话。
 * 系统段与 user-role contexts 分开返回，跨预设累计池不作为选中预设的输入。
 * forceSections 在 assemble 返回边界恢复已经求值的段策略，避免 complete
 * 还原和动态 provider 重复执行；关闭时尊重宿主的 complete 接管行为。
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { parse } from 'yaml'
import { Config, NS, WorkspaceOverrides } from './schema.js'
import { effectiveConfig, pickToolsFilter, pickSectionsForStatus, pickContextsForStatus, applySectionPolicy, mergeOverrideLayers } from './effective.js'
import { createPhaseProjection, presetOfSession, statusOf } from './promotion.js'
import { createConfigStore } from './store.js'
import { openDb, allDocs, replaceAllDocs } from './db.js'
import { registerVariables, listVariableNames } from './vars.js'
import { createPhaseToolVisibility } from './tool-visibility.js'

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
    for (const phase of ['bootstrap', 'compaction']) walk(node[phase], `${where}.${phase}`)
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
  // 工作区级 override（破坏式后与 config 同库、独立 doc）：按工作区绝对 cwd 存一份，
  // 运行时叠加在预设级之上（工作区优先）。
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
    readConfig: () => read(),
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

  // 提示词变量注册（内置系统事实 + process.env 全量，黑名单过滤）：宿主只有
  // provider / model / cwd 三个，段文本里的其余 {{name}} 一律严格报错。这里
  // 通过官方扩展点 systemPrompt.variable() 补齐。懒同步：每次装配入口比对黑名单
  // 签名，变了才注销重注册 —— 配置写入 / 外部手改都在下次装配自然生效。
  let varsSignature
  let varsDispose
  const syncVariables = () => {
    try {
      const blocklist = read().envBlocklist ?? []
      const signature = JSON.stringify(blocklist)
      if (signature === varsSignature) return
      try { varsDispose?.() } catch { /* 注销失败不阻塞重注册 */ }
      varsDispose = registerVariables(ctx.get('systemPrompt'), blocklist)
      varsSignature = signature
    } catch (error) {
      warnOnce(`prompt-customizer: 提示词变量注册失败（{{…}} 仍只有宿主注册的变量可用）：${String((error && error.message) || error)}`)
    }
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
    // 运行时生效配置：预设级 override，叠加该会话所属工作区的工作区级 override。
    const workspaceOvr = workspaceOverrideFor(context?.agent?.session?.header?.cwd)
    const cfg = effectiveConfig(mergeOverrideLayers(base.overrides?.[id], workspaceOvr))
    const phaseHint = typeof context?.promptCustomizerPhase === 'string'
      ? context.promptCustomizerPhase
      : undefined
    const status = phaseHint === 'bootstrap' ? { promoted: false, boundary: -1 }
      : phaseHint === 'compaction' ? { promoted: false, boundary: 1 }
      : phaseHint === 'active' ? { promoted: true, boundary: -1 }
      : statusOf(phaseHandle ?? ctx.get('sessionProjections'), context?.agent)
    return { raw, cfg, status }
  }

  // 装配瀑布流：实时应用字段级 override、屏蔽 / 替换 / 注入 / 阶段化工具过滤。
  ctx.on('system-prompt/assemble', async (assembly, context, next) => {
    // 下游错误原样传播；只有本过滤器自身的逻辑被兜底。
    const registeredSections = Array.isArray(assembly.sections) ? assembly.sections.map(section => ({ ...section })) : []
    const assembled = await next()
    try {
      const { raw, cfg, status } = resolveTarget(context)
      const denied = new Set(pickSectionsForStatus(cfg, status))
      const deniedContexts = new Set(pickContextsForStatus(cfg, status))
      const replace = cfg.replace ?? {}
      const te = pickToolsFilter(cfg.tools, status)

      // 使用宿主已求值的输入；forceSections 不重新调用动态 provider。
      const baseSections = raw?.forceSections === false
        ? (Array.isArray(assembled.sections) ? assembled.sections : [])
        : [...registeredSections, ...(assembled.sections ?? []).filter(section => !registeredSections.some(item => item.name === section.name))]
      const baseView = context?.promptCustomizerBase === true
      // 0.2.2 起 `PromptPresentation` 只含 sections / contexts / variables，
      // 工具声明由工具提供者拥有；装配瀑布流不再读写 `assembled.tools`。
      const baseTools = baseView ? toolSchemasOf(ctx, context?.scope) : []

      // 段级策略（屏蔽 / 替换 / 注入 / 排序）由 effective.applySectionPolicy
      // 统一实现：瀑布流与 assemble 强制覆盖共用同一份逻辑。
      const sections = applySectionPolicy(baseSections, cfg, status)

      const result = {
        ...assembled,
        sections,
        // 真实装配：过滤掉被隐藏的运行时上下文；预览 base 调用保留全部（供面板列全量+置灰）。
        ...baseView ? {} : { contexts: (Array.isArray(assembled.contexts) ? assembled.contexts : []).filter((c) => !deniedContexts.has(String(c?.name))) },
        promptCustomizerSections: sections,
      }
      if (baseView) {
        result.promptCustomizerBaseView = {
          sections: baseSections.map((section) => ({
            name: section.name,
            text: String(section.text ?? ''),
            ...section.interpolate !== undefined ? { interpolate: section.interpolate } : {},
            blocked: denied.has(section.name),
            replaced: Object.hasOwn(replace, section.name),
            // 'agent' = 只在该 agent 的装配里注册的段（预览 scope 的注册表没有它）。
            ...section.scope !== undefined ? { scope: section.scope } : {},
          })),
          tools: baseTools.map((tool) => ({
            name: typeof tool.name === 'string' ? tool.name : String(tool.name),
            description: typeof tool.description === 'string' ? tool.description : '',
            hidden: (te.exclude ?? []).includes(tool.name),
          })),
          contexts: (Array.isArray(assembled.contexts) ? assembled.contexts : []).map((c) => ({
            name: String(c?.name ?? ''),
            text: String(c?.text ?? ''),
            blocked: deniedContexts.has(String(c?.name ?? '')),
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
        result.promptCustomizerEmitted = sections.map((section) => String(section.name))
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
      syncVariables()
      const result = await pristine(context)
      // 工具显隐：真实会话装配时按「当前阶段 exclude」过滤最终交给模型的 tools。
      // restrict 只能收窄继承的全局工具；作用域内注册的工具（插件提供的 read /
      // apply_patch 等）它管不到 —— 但模型看到的正是这份 `assembly.tools`，这里按
      // 名字删掉即可真正隐藏（含 agent 作用域工具）。诊断 / 预览的 base 调用不过滤，
      // 保证左栏能看到完整基座。
      let withTools = result
      if (context?.promptCustomizerBase !== true && Array.isArray(result.tools)) {
        try {
          const { cfg, status } = resolveTarget(context)
          const exclude = new Set(pickToolsFilter(cfg.tools, status).exclude ?? [])
          if (exclude.size > 0) {
            withTools = { ...result, tools: result.tools.filter((tool) => !exclude.has(String(tool.name))) }
          }
        } catch { /* 解析失败不拦本次装配 */ }
      }
      if (read()?.forceSections === false) return withTools
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
      varsDispose?.()
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
            syncVariables()
            const preview = await buildPreview(ctx, read(), target, 'active', undefined, undefined, undefined, toolMask)
            const inventory = await buildInventory(ctx, read(), target.scopeKey, target.hintId, undefined, preview)
            writeJson(res, 200, { ...inventory, scopeResolved: target.scopeResolved, variables: listVariableNames(read().envBlocklist ?? []) })
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
          try {
            const patch = body !== null && typeof body === 'object'
              && body.patch !== null && typeof body.patch === 'object' && !Array.isArray(body.patch)
              ? body.patch : undefined
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
    // 工具可见集。这是「模型此刻真正看到什么」的唯一权威入口；预设编辑
    // 预览仍保持纯预设装配，避免把编辑目标与运行中的会话混在一起。
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
          syncVariables()
          const status = statusOf(phaseHandle ?? ctx.get('sessionProjections'), live)
          const preview = await buildSessionPreview(ctx, read(), target.scopeKey, { agent: live, presetId }, status, undefined, toolMask, workspaceOverrideFor(live?.session?.header?.cwd))
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
          const targetId = requested !== undefined && requested !== ''
            ? requested
            : String(roster?.defaultId ?? 'standard')
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
          // 来源预设的组成声明（只读参考，不打包成可执行的预设）。
          let composition
          if (typeof roster?.readDocument === 'function') {
            try {
              const doc = await roster.readDocument(targetId)
              if (typeof doc?.content === 'string') composition = doc.content
            } catch { /* 读不到组成不算失败：导出主体是定制 */ }
          }
          writeJson(res, 200, {
            ok: true,
            format: 'dsh-prompt-customizer/export@1',
            target: targetId,
            envBlocklist: Array.isArray(raw?.envBlocklist) ? raw.envBlocklist : [],
            forceSections: raw?.forceSections !== false,
            customization,
            // 参考：该 agent 预设自己的组成（entry-list YAML），供人工比对。
            composition,
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
          writeJson(res, 200, {
            ok: true,
            format: 'dsh-prompt-customizer/backup@1',
            exportedAt: new Date().toISOString(),
            docs: allDocs(db),
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
          replaceAllDocs(db, docs)
          toolVisibility.syncAll()
          writeJson(res, 200, { ok: true, config: read(), workspaceOverrides: readWorkspaceOverrides() })
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
        let currentWorkspace
        try { currentWorkspace = currentLiveAgent(ctx)?.session?.header?.cwd } catch { currentWorkspace = undefined }
        writeJson(res, 200, {
          ok: true,
          config: read(),
          workspaceOverrides: readWorkspaceOverrides(),
          currentWorkspace: typeof currentWorkspace === 'string' && currentWorkspace !== '' ? currentWorkspace : undefined,
        })
      },
    })
    ctx.effect(() => disposeConfig, 'prompt-customizer: config route')

    // 0.9.0 起六个提示词字段（sections/sectionsBootstrap/sectionsCompaction/
    // replace/inject/tools）属于已停用的全局层，set/unset 直接 400 —— 提示词
    // 定制必须走 /config/apply + target（写 overrides[id]）。历史数据保留在
    // 文件里不动（停用但可回滚），只能手编 config.yaml 清理。
    const GLOBAL_PROMPT_FIELDS = new Set(['sections', 'sectionsBootstrap', 'sectionsCompaction', 'replace', 'inject', 'tools'])
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
          const target = typeof body.target === 'string' && body.target.length > 0 ? body.target : undefined
          // 工作区级：body { level: 'workspace', workspace: <cwd>, patch }，写 workspaceOverrides[cwd]。
          if (body.level === 'workspace') {
            const workspace = typeof body.workspace === 'string' && body.workspace.trim() !== '' ? path.resolve(body.workspace) : undefined
            if (workspace === undefined) {
              writeJson(res, 400, { ok: false, error: 'workspace (absolute cwd) is required for workspace-level apply' })
              return
            }
            const rawWs = wsStore.raw() ?? {}
            const cur = { ...(rawWs?.[workspace] ?? {}) }
            for (const field of APPLY_FIELDS) {
              if (!Object.hasOwn(patch, field)) continue
              if (patch[field] === null) delete cur[field]
              else cur[field] = patch[field]
            }
            const next = { ...(rawWs ?? {}) }
            if (Object.keys(cur).length > 0) next[workspace] = cur
            else delete next[workspace]
            wsStore.writeSection(next)
            toolVisibility.syncAll()
            writeJson(res, 200, { ok: true, level: 'workspace', workspace, config: read(), workspaceOverrides: readWorkspaceOverrides() })
            return
          }
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
  }
}

/** 配置补丁认得的业务字段（与 UI 编辑域一一对应；含每阶段独立名单）。 */
const APPLY_FIELDS = ['sections', 'sectionsBootstrap', 'sectionsCompaction', 'contexts', 'contextsBootstrap', 'contextsCompaction', 'replace', 'inject', 'tools']

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

/** Read the selected mode's current revision; never substitute a live conversation. */
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
  if (status?.promoted === true) return 'active'
  return (status?.boundary ?? -1) >= 0 ? 'compaction' : 'bootstrap'
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
 *    restrict 掉）；`maskedByOwnPlugin` 是本插件自己的 MCP 遮蔽账本。
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
  const hasLive = liveAgent !== undefined
  const presetByName = new Map()
  for (const tool of presetTools) {
    if (tool?.name !== undefined) presetByName.set(String(tool.name), tool)
  }
  const liveByName = new Map()
  for (const tool of liveTools) {
    if (tool?.name !== undefined) liveByName.set(String(tool.name), tool)
  }
  const phaseFilter = pickToolsFilter(cfg?.tools, phaseStatus)
  const phaseExclude = new Set(phaseFilter.exclude ?? [])
  const allExclude = new Set()
  for (const list of [
    cfg?.tools?.exclude,
    cfg?.tools?.bootstrap?.exclude,
    cfg?.tools?.compaction?.exclude,
  ]) {
    for (const name of Array.isArray(list) ? list : []) allExclude.add(name)
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
  for (const name of allExclude) if (presetByName.has(name) || liveByName.has(name)) push(name)

  const maskedByOwn = await ownMaskedToolNames(options.toolMask, options.presetId, names, options.cwd)
  const descOf = (...cands) => {
    for (const cand of cands) if (typeof cand?.description === 'string' && cand.description !== '') return cand.description
    return ''
  }
  const rows = []
  const emit = (name, state, description, keySuffix) => {
    rows.push({
      name,
      description,
      hidden: (state === 'controllable' || state === 'locked-agent') ? phaseExclude.has(name) : false,
      state,
      ...(state === 'locked-agent' ? { scope: 'agent' } : {}),
      ...(state === 'locked-executor' ? { scope: 'executor' } : {}),
      ...(state === 'masked-plugin' ? { maskedByPlugin: true } : {}),
      ...(state === 'masked-own' ? { maskedByOwnPlugin: true } : {}),
      ...(keySuffix === undefined ? {} : { keySuffix }),
    })
  }
  for (const name of names) {
    const presetTool = presetByName.get(name)
    const liveTool = liveByName.get(name)
    const extraTool = extraByName.get(name)
    const inPreset = presetTool !== undefined
    const inLive = liveTool !== undefined
    const inExtra = extraTool !== undefined
    if (maskedByOwn.has(name)) { emit(name, 'masked-own', descOf(presetTool, liveTool, extraTool)); continue }
    // 同名不同注册 = 被 agent 作用域工具顶掉（遮蔽）。没有 definitions 时无法判定，
    // 退化为「同名即同一工具」。
    const shadowed = hasLive && inPreset && inLive && presetDefs !== null && liveDefs !== null
      && presetDefs.get(name) !== liveDefs.get(name)
    const restricted = hasLive && inPreset && !inLive
    const agentOnly = hasLive && inLive && !inPreset
    const executor = !inPreset && !inLive && inExtra
    if (shadowed) {
      // agent 提供的同名工具（模型实际可见、本插件无法开关）→ 启用锁定；
      // 被顶掉的预设 / 原生同名工具 → 遮蔽池。同名两行。
      emit(name, 'locked-agent', descOf(liveTool, presetTool), 'live')
      emit(name, 'masked-plugin', descOf(presetTool), 'preset')
      continue
    }
    if (agentOnly) { emit(name, 'locked-agent', descOf(liveTool)); continue }
    if (executor) { emit(name, 'locked-executor', descOf(extraTool, liveTool)); continue }
    if (restricted) { emit(name, 'masked-plugin', descOf(presetTool)); continue }
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
  const rankOf = (row) => (row.state === 'masked-plugin' || row.state === 'masked-own')
    ? Number.MAX_SAFE_INTEGER
    : (finalRank.has(row.name) ? finalRank.get(row.name) : Number.MAX_SAFE_INTEGER - 1)
  rows.sort((a, b) => rankOf(a) - rankOf(b) || a.name.localeCompare(b.name) || String(a.state).localeCompare(String(b.state)))
  return { rows, registryTools: names }
}

/**
 * 预设预览的左栏「基座」：纯预设 base 段 + 同预设活动 agent 的 agent 作用域段。
 * 右栏最终装配仍用纯预设装配；这里只补编辑列表的可见性，并给新增段打
 * `scope: 'agent'`（UI 的「会话级」徽标）。
 */
function mergeAgentScopedSections(presetSections, liveSections, denied, replace, orderOf) {
  const base = Array.isArray(presetSections) ? presetSections : []
  const live = Array.isArray(liveSections) ? liveSections : []
  if (live.length === 0) return sortSectionsByOrder(base, orderOf)
  const present = new Set(base.map((section) => String(section.name)))
  const out = []
  const seen = new Set()
  for (const section of live) {
    const name = String(section.name)
    out.push({
      name,
      text: section.text,
      blocked: denied.has(name),
      replaced: Object.hasOwn(replace, name),
      ...(present.has(name) ? {} : { scope: 'agent' }),
    })
    seen.add(name)
  }
  for (const section of base) if (!seen.has(String(section.name))) out.push(section)
  return sortSectionsByOrder(out, orderOf)
}

/** 枚举当前生效的段与工具，并附上各自的屏蔽 / 隐藏标记。 */
async function buildInventory(ctx, raw, scopeKey, presetId, _catalog, preview) {
  // 生效配置：目标 agent 预设的 override（0.9.0 起无全局基底）。
  const cfg = effectiveConfig(raw.overrides?.[presetId])
  const denied = new Set(cfg.sections ?? [])
  const replace = cfg.replace ?? {}
  const te = pickToolsFilter(cfg.tools, { promoted: true, boundary: -1 }) // 清单无会话概念：恒展示静态（晋级后）视图
  const isHidden = (name) => (te.exclude ?? []).includes(name)

  // 规范 order：来自预览（buildPreview 已按预设作用域链 + live agent 汇总）。
  const orderOf = new Map(Object.entries(preview.sectionOrder ?? {}))
  const seenSections = (preview.baseSections ?? []).map((section) => ({
    name: section.name,
    order: orderOf.get(String(section.name)) ?? Number.MAX_SAFE_INTEGER,
    text: section.text,
    ...(section.scope === 'agent' ? { scope: 'agent' } : {}),
  }))
  // 工具来自预览的完整目录（预设注册表 ∪ 当前会话 agent 视图）：既包含被
  // 其它插件 restrict 掉、仍应可解释的条目，也包含只在 agent 作用域注册的
  // 工具。scope / masked 标记原样透出，供左栏置灰与徽标使用。
  const seenTools = (Array.isArray(preview.baseTools) ? preview.baseTools : [])
    .map((tool) => ({
      name: String(tool.name),
      description: typeof tool.description === 'string' ? tool.description : '',
      ...(typeof tool.state === 'string' ? { state: tool.state } : {}),
      ...(tool.scope === 'agent' || tool.scope === 'executor' ? { scope: tool.scope } : {}),
      ...(tool.maskedByPlugin === true ? { maskedByPlugin: true } : {}),
      ...(tool.maskedByOwnPlugin === true ? { maskedByOwnPlugin: true } : {}),
    }))

  // 清单只来自「当前预设的真实装配」：有就有、没有就没有。不再读任何累积池，
  // 也不需要手动重扫；预设之间天然隔离。
  const sections = seenSections
    .map((item) => ({
      ...item,
      order: orderOf.get(String(item.name)) ?? Number.MAX_SAFE_INTEGER,
      active: !denied.has(item.name),
      replaced: Object.hasOwn(replace, item.name),
    }))
    .sort((a, b) => a.order - b.order || String(a.name).localeCompare(String(b.name)))
  const tools = seenTools
    .map((item) => ({ ...item, hidden: isHidden(item.name) }))

  const ctxDenied = new Set(pickContextsForStatus(cfg, { promoted: true, boundary: -1 }))
  const contexts = (Array.isArray(preview.baseContexts) ? preview.baseContexts : []).map((c) => ({
    name: String(c?.name ?? ''),
    text: String(c?.text ?? ''),
    active: !ctxDenied.has(String(c?.name ?? '')),
  }))
  return { sections, tools, contexts, config: cfg }
}

/** Resolve the selected mode without creating, selecting or modifying a conversation. */
async function previewTarget(ctx, req, body = null) {
  const query = queryOf(req)
  const target = await acquireTarget(ctx, query.get('scope') ?? undefined)
  const rawPhase = body?.phase ?? query.get('phase')
  const phase = ['bootstrap', 'compaction', 'active'].includes(rawPhase) ? rawPhase : undefined
  return { ...target, phase }
}

/** Assemble one leased mode revision; unresolved session variables stay in the template. */
/**
 * 只收集一个 scope 的**预过滤**段与工具原文，不碰累积登记表。
 *
 * 与 buildPreview 的区别：重扫需要「真实并集却不想在收集过程中又往池子里
 * observe」——否则边扫边写会把上一轮的历史条目混进来，重扫就成了自证。
 */
async function collectScopeBase(ctx, scopeKey, presetId) {
  // 同预设有活动 agent 时，把 agent 作用域的段与工具也并入重扫结果 —— 否则
  // 一次「重扫登记表」会把 dsh-hashline-edit / dsh-better-edit 这类只在
  // agent/created 注册的条目全部清掉，面板又回到提取不全的状态。
  const liveAgent = liveAgentForPreset(ctx, presetId)
  const assembled = await ctx.systemPrompt.assemble({
    scope: liveAgent ?? scopeKey,
    ...(liveAgent === undefined ? {} : { agent: liveAgent }),
    promptCustomizerPreset: presetId,
    promptCustomizerPhase: 'active',
    promptCustomizerBase: true,
  })
  const baseView = (assembled && typeof assembled === 'object' && assembled.promptCustomizerBaseView) || {}
  const byName = new Map()
  for (const tool of [
    ...toolSchemasOf(ctx, scopeKey),
    ...(liveAgent === undefined ? [] : toolSchemasOf(ctx, liveAgent)),
    ...(Array.isArray(baseView.tools) ? baseView.tools : []),
  ]) {
    if (tool?.name !== undefined) byName.set(String(tool.name), tool)
  }
  return {
    sections: (Array.isArray(baseView.sections) ? baseView.sections : []).map((sec) => ({ name: sec.name, text: sec.text })),
    // 0.2.2 起装配结果不再携带 tools：从注册表（预设 ∪ agent 实际视图）读；
    // 测试 / 旧宿主没有 tools 服务时回落到装配 base 视图里的工具原文。
    tools: [...byName.values()].map((tool) => ({ name: String(tool.name), description: typeof tool.description === 'string' ? tool.description : '' })),
  }
}

async function buildPreview(ctx, rawConfig, target, phase, _catalog, patch, patchTarget, toolMask) {
  const scopeKey = target?.scopeKey
  const hintId = target?.hintId
  const liveAgent = liveAgentForPreset(ctx, hintId)
  const configTargetId = hintId ?? (liveAgent === undefined ? undefined : presetIdOfAgent(ctx, liveAgent))
  // promptCustomizerPreset / promptCustomizerPhase 都是本插件的自定义装配
  // 字段：让我们的过滤器在这次装配里按该 agent 预设的 override 与指定阶段
  // 视图生效（AssembleContext 允许插件自定义字段）。
  const hint = {
    scope: scopeKey,
    promptCustomizerPreset: hintId,
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
  const diagnostics = []
  const sections = Array.isArray(assembled.sections)
    ? assembled.sections.map(section => ({ name: section.name, text: renderSection(section, assembled.variables ?? {}, diagnostics) }))
    : []
  // 预过滤视图（base）：段来自装配 base 视图；工具目录 0.2.2 起改从注册表读。
  const baseView = (assembled && typeof assembled === 'object' && assembled.promptCustomizerBaseView) || {}
  const phaseStatus = phase === 'bootstrap'
    ? { promoted: false, boundary: -1 }
    : phase === 'compaction'
      ? { promoted: false, boundary: 1 }
      : { promoted: true, boundary: -1 }
  const previewCfg = effectiveConfig(rawConfig?.overrides?.[configTargetId])
  const previewToolFilter = pickToolsFilter(previewCfg.tools, phaseStatus)
  // 左栏的「基座」：纯预设 base 段 + 同预设活动 agent 的 agent 作用域段。
  // 右栏最终装配仍用上面的纯预设装配（预设预览保持纯净）；右栏之外的列表
  // 需要看见 agent 作用域新增的段，否则它们不可编辑 / 不可解释。
  let liveBaseSections = []
  let liveFinalTools = []
  if (liveAgent !== undefined) {
    try {
      const liveHint = {
        scope: liveAgent,
        agent: liveAgent,
        promptCustomizerPreset: hintId,
        promptCustomizerPhase: phase,
        promptCustomizerBase: true,
      }
      if (patch !== undefined) {
        liveHint.promptCustomizerPatch = patch
        liveHint.promptCustomizerTarget = patchTarget
      }
      const liveAssembled = await ctx.systemPrompt.assemble(liveHint)
      liveBaseSections = Array.isArray(liveAssembled?.promptCustomizerBaseView?.sections)
        ? liveAssembled.promptCustomizerBaseView.sections
        : []
      liveFinalTools = Array.isArray(liveAssembled?.tools) ? liveAssembled.tools : []
    } catch { /* agent 作用域读不到：退回纯预设列表 */ }
  }
  const denied = new Set(previewCfg.sections ?? [])
  const replace = previewCfg.replace ?? {}
  // 段的规范顺序：宿主注册的数值 order（预设作用域链 + 同预设活动 agent 作用域）。
  // 用它给 base 列表排序，模型实收顺序即编辑列表顺序；用户拖动 / 注入仍走草稿序。
  const sectionOrder = sectionOrderMap(ctx, liveAgent === undefined ? [scopeKey] : [liveAgent, scopeKey])
  const baseSections = mergeAgentScopedSections(baseView.sections ?? [], liveBaseSections, denied, replace, sectionOrder)
  const finalTools = Array.isArray(assembled.tools) ? assembled.tools : []
  // 有同预设活动会话时，用它的真实可见工具（含 agent 提供 / 执行器包装）作为排序与
  // 执行器识别来源；否则用预设装配的结果。
  const effectiveFinalTools = liveAgent !== undefined && liveFinalTools.length > 0 ? liveFinalTools : finalTools
  const union = await buildToolUnion(ctx, scopeKey, liveAgent, previewCfg, phaseStatus, {
    toolMask,
    presetId: configTargetId,
    cwd: liveAgent?.session?.header?.cwd,
    extraTools: effectiveFinalTools,
  })
  const baseTools = union.rows
  // 预览带 scope，是「浏览其它预设」时唯一真正跑过该预设装配的入口 —— 把它
  // 见到的段与工具并进池子（base 视图不含 order，新条目由登记表按追加序补）。
  const registryTools = union.registryTools
  const registryTotal = union.registryTools.length
  // 兜底探测（机制无关）：本插件产出的段有多少没进最终装配。下游丢弃段的规则
  // 不止 persona complete 一种（实测 liangshen 引导期由预设自身规则 20 → 1 段，
  // 注册表里没有 complete 段），所以按名字比对结果而不是只看注册表标记。
  // emitted 缺席 = 我们的过滤器没跑（异常回退未加工装配），此时无从比较。
  const emitted = Array.isArray(assembled.promptCustomizerEmitted) ? assembled.promptCustomizerEmitted : null
  const survivedNames = new Set(sections.map((section) => String(section.name)))
  const droppedNames = emitted === null ? [] : emitted.filter((name) => !survivedNames.has(String(name)))
  const lostSections = droppedNames.length > 0
    ? { emitted: emitted.length, survived: sections.length, dropped: droppedNames.length }
    : undefined
  return {
    ok: true,
    contexts: (assembled.contexts ?? []).map(context => ({ name: context.name, text: renderSection(context, assembled.variables ?? {}, diagnostics) })),
    registryTotal,
    /** 该 scope 注册表的工具名清单：供界面区分「在本预设里、只是被该阶段裁掉」
     *  与「根本不属于本预设（无法加回）」。 */
    registryTools,
    /** 非空 = 该 scope 有 complete 段整段接管最终提示词（值为那段的名字）。 */
    takenOverBy: assembled && typeof assembled === 'object'
      ? (typeof assembled.promptCustomizerTakenOver === 'string' ? assembled.promptCustomizerTakenOver : undefined)
      : undefined,
    /** 非空 = 本插件产出的段有若干被下游装配规则丢弃（计数，不含段名列表）。 */
    lostSections,
    sections,
    text: sections.map(section => section.text).filter(Boolean).join('\n\n'),
    diagnostics,
    // 该阶段最终可见的工具目录（纯预设预览）：注册表去掉本插件阶段 exclude、
    // 本插件 MCP 遮蔽与 agent 作用域新增项 —— 右栏仍是「编辑目标预设」的
    // 纯装配；真实会话的完整视图在 /session 路由。
    // `assembled.tools` 是宿主最终交给模型的声明（含 PTC 的 run_code 包装）。
    // 有它就用它；测试 / 旧宿主没有该字段时回落到注册表过滤结果。
    tools: (finalTools.length > 0
      ? finalTools
          .filter(tool => !(previewToolFilter.exclude ?? []).includes(tool.name)
            && !baseTools.some(row => row.name === tool.name && row.maskedByOwnPlugin === true))
          .map(tool => ({
            name: typeof tool.name === 'string' ? tool.name : String(tool.name),
            description: typeof tool.description === 'string' ? tool.description : '',
          }))
      : baseTools
          .filter(tool => tool.scope !== 'agent'
            && tool.maskedByOwnPlugin !== true
            && !(previewToolFilter.exclude ?? []).includes(tool.name))
          .map((tool) => ({
            name: typeof tool.name === 'string' ? tool.name : String(tool.name),
            description: typeof tool.description === 'string' ? tool.description : '',
          }))),
    // 预过滤视图：段（含该阶段独立屏蔽标记 blocked / 替换标记）与工具
    // （含该阶段隐藏标记 hidden）—— 供提示词 / 工具 Tab 渲染「每阶段
    // 独立名单」，被屏蔽 / 被隐藏的条目仍保留在此可反选。
    baseSections,
    baseTools,
    baseContexts: Array.isArray(baseView.contexts) ? baseView.contexts : [],
    /** 段名 → 宿主规范 order（清单按它排序，保证跨预设池也不再乱序）。 */
    sectionOrder: Object.fromEntries(sectionOrder),
    /** 非空 = 左栏已并入该活动会话的 agent 作用域条目（右栏仍是纯预设装配）。 */
    sessionOverlay: liveAgent === undefined ? undefined : {
      id: String(liveAgent.session?.header?.id ?? liveAgent.id ?? ''),
      presetId: configTargetId,
    },
  }
}

/**
 * 「当前会话」只读视图：用最新活动根 agent 自己的 scope 跑一次真实装配，
 * 工具取该 agent 的完整可见集（含 agent 作用域注册与所有 restrict），
 * 段保留 agent 作用域标记，base 列表再补预设注册表里被其它插件遮蔽的工具。
 */
async function buildSessionPreview(ctx, rawConfig, presetScopeKey, live, status, _catalog, toolMask, workspaceOvr) {
  const agent = live.agent
  const presetId = live.presetId
  const hint = { scope: agent, agent, promptCustomizerBase: true }
  if (presetId !== undefined) hint.promptCustomizerPreset = presetId
  const assembled = await ctx.systemPrompt.assemble(hint)
  const diagnostics = []
  const sections = Array.isArray(assembled.sections)
    ? assembled.sections.map(section => ({ name: section.name, text: renderSection(section, assembled.variables ?? {}, diagnostics) }))
    : []
  const baseView = (assembled && typeof assembled === 'object' && assembled.promptCustomizerBaseView) || {}
  const phase = phaseNameOf(status)
  const cfg = effectiveConfig(mergeOverrideLayers(rawConfig?.overrides?.[presetId], workspaceOvr))
  const denied = new Set(cfg.sections ?? [])
  const replace = cfg.replace ?? {}
  const presetNames = sectionNamesOf(ctx, presetScopeKey)
  const baseSections = (Array.isArray(baseView.sections) ? baseView.sections : []).map((section) => ({
    name: section.name,
    text: section.text,
    blocked: denied.has(section.name),
    replaced: Object.hasOwn(replace, section.name),
    ...(presetNames.has(String(section.name)) ? {} : { scope: 'agent' }),
  }))
  const finalTools = Array.isArray(assembled.tools) ? assembled.tools : []
  const union = await buildToolUnion(ctx, presetScopeKey, agent, cfg, status, {
    toolMask,
    presetId,
    cwd: agent.session?.header?.cwd,
    extraTools: finalTools,
  })
  const actualTools = (finalTools.length > 0
    ? finalTools
    : Array.isArray(baseView.tools) && baseView.tools.length > 0
      ? baseView.tools
      : toolSchemasOf(ctx, agent))
    .map((tool) => ({
      name: typeof tool.name === 'string' ? tool.name : String(tool.name),
      description: typeof tool.description === 'string' ? tool.description : '',
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
    contexts: (assembled.contexts ?? []).map(context => ({
      name: context.name,
      text: renderSection(context, assembled.variables ?? {}, diagnostics),
    })),
    sections,
    text: sections.map(section => section.text).filter(Boolean).join('\n\n'),
    diagnostics,
    tools: actualTools,
    baseSections,
    baseTools: union.rows,
    baseContexts: Array.isArray(baseView.contexts) ? baseView.contexts : [],
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

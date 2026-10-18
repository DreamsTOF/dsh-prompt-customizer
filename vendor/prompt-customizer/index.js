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
import { Config, NS } from './schema.js'
import { effectiveConfig, pickToolsFilter, pickSectionsForStatus, applyToolFilter, applySectionPolicy } from './effective.js'
import { createPhaseProjection, presetOfSession, statusOf } from './promotion.js'
import { createConfigStore, readLegacySection } from './store.js'
import { createCatalog } from './catalog.js'
import { registerVariables, listVariableNames } from './vars.js'

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
  const configFile = path.join(dataDir, 'config.yaml')
  const store = createConfigStore({
    file: configFile,
    schema: Config,
    warn: (message) => { try { ctx.logger?.warn?.(message) } catch { /* logger 缺席 */ } },
  })
  const read = () => store.readResolved()
  // 「本系统全部提示词 / 全部工具」的累积登记表：清单与预览每次看到什么就并进
  // 什么（同名后见到者赢），所以池子不随编辑目标切换、只增不减。派生缓存，
  // 删掉随浏览重新长出来。
  const catalog = createCatalog({
    dir: dataDir,
    warn: (message) => { try { ctx.logger?.warn?.(message) } catch { /* logger 缺席 */ } },
  })

  // 一次性迁移：新文件不存在而主文档里有旧段 → 原样复制过来。主文档不动，
  // 旧版随时可回滚；迁移后新文件是唯一权威。
  if (!fs.existsSync(configFile)) {
    const master = ctx.get('settings')?.documentPath
    const legacy = readLegacySection(master, NS)
    if (legacy) {
      store.writeSection(legacy)
      try { ctx.logger?.info?.(`prompt-customizer: 已把旧版配置从 ${master} 迁移到 ${configFile}`) } catch { /* logger 缺席 */ }
    }
  }

  // 一次性清理：include（白名单）语义已从读取与写入两侧彻底移除。遗留的
  // include 既不再生效、界面也不再表达，留着只会让配置堆积无意义字段 ——
  // 启动时剥掉并记一条日志（逐处列出被去掉的名字），不静默改用户文件。
  stripLegacyInclude(store, (message) => { try { ctx.logger?.info?.(message) } catch { /* logger 缺席 */ } })

  // 2) 阶段投影：把 bootstrap/active 推导注册成宿主的会话投影 unit —— 宿主按会话
  //    折叠（含 resume / reload 后从日志重建）并增量驱动，本插件不再自扫历史
  //    （`Session.events` 已在 0.1.2-alpha.4 移除，同步历史读在 0.1.6 已 deprecated；
  //    见 promotion.js 顶部说明）。注册随本插件的 fiber 一起注销。
  ctx.inject(['sessionProjections'], (projectionCtx) => {
    try {
      projectionCtx.sessionProjections.register(createPhaseProjection())
    } catch (error) {
      try { ctx.logger?.warn?.(`prompt-customizer: 阶段投影注册失败（阶段视图回落为已晋级）：${String((error && error.message) || error)}`) } catch { /* logger 缺席 */ }
    }
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
      : presetOfSession(ctx.get('sessionProjections'), context?.agent?.session)
    const cfg = effectiveConfig(base.overrides?.[id])
    const phaseHint = typeof context?.promptCustomizerPhase === 'string'
      ? context.promptCustomizerPhase
      : undefined
    const status = phaseHint === 'bootstrap' ? { promoted: false, boundary: -1 }
      : phaseHint === 'compaction' ? { promoted: false, boundary: 1 }
      : phaseHint === 'active' ? { promoted: true, boundary: -1 }
      : statusOf(ctx.get('sessionProjections'), context?.agent)
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
      const replace = cfg.replace ?? {}
      const te = pickToolsFilter(cfg.tools, status)

      // 使用宿主已求值的输入；forceSections 不重新调用动态 provider。
      const baseSections = raw?.forceSections === false
        ? (Array.isArray(assembled.sections) ? assembled.sections : [])
        : [...registeredSections, ...(assembled.sections ?? []).filter(section => !registeredSections.some(item => item.name === section.name))]
      const baseTools = Array.isArray(assembled.tools) ? assembled.tools : []
      const baseView = context?.promptCustomizerBase === true
      if (catalog !== undefined && !baseView) {
        catalog.observe({
          sections: baseSections.map(section => ({ name: section.name, text: section.text })),
          tools: baseTools.map(tool => ({ name: tool.name, description: tool.description })),
        })
      }

      // 段级策略（屏蔽 / 替换 / 注入 / 排序）由 effective.applySectionPolicy
      // 统一实现：瀑布流与 assemble 强制覆盖共用同一份逻辑。
      const sections = applySectionPolicy(baseSections, cfg, status)

      const tools = appendAddedTools(ctx, context?.scope, applyToolFilter(baseTools, te), te.add, te.exclude)

      const result = { ...assembled, sections, tools, promptCustomizerSections: sections }
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
      if (read()?.forceSections === false) return result
      try {
        const sections = result.promptCustomizerSections ?? result.sections
        const patched = { ...result, sections }
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
            const preview = await buildPreview(ctx, target.scopeKey, target.hintId, 'active', catalog, undefined, undefined)
            const inventory = await buildInventory(ctx, read(), target.scopeKey, target.hintId, catalog, preview)
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
            const preview = await buildPreview(ctx, target.scopeKey, target.hintId, target.phase, catalog, patch, patchTarget, target.agent)
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

    // 全量重扫：逐个挂载已声明的 agent 预设，跑一次装配，用真实并集**整体替换**
    // 累积登记表。
    //
    // 必要性：catalog 是「只增不减」的累积缓存 —— 浏览过的名字永远留在池子里。
    // 一旦某个预设被删除、某插件被卸载，它带来的段与工具仍会以可拖动条目的形式
    // 留在面板上（实测 407 个工具里只剩约 100 个还在真实注册表里）。这是唯一能
    // 真正缩小登记表、且按真实注册表对齐的入口。
    //
    // 代价：每个预设都要挂载整棵插件树（重的一棵树可达十几秒），所以只由用户
    // 显式触发，不做自动预热。扫描期间逐个预设失败不影响其它预设：坏预设跳过
    // 并把原因回给界面，剩下的照常并入。
    const disposeRescan = register({
      kind: 'exact',
      path: '/api/prompt-customizer/catalog/rescan',
      handler: async (req, res) => {
        try {
          if (req.method !== 'POST') {
            writeJson(res, 405, { ok: false, error: 'POST only' })
            return
          }
          const roster = ctx.get('agentPresets')
          if (roster === undefined || typeof roster.acquireScope !== 'function') {
            writeJson(res, 501, { ok: false, error: '宿主未提供 agent 预设作用域（agentPresets.acquireScope），无法重扫' })
            return
          }
          const declared = await roster.list()
          const sections = []
          const tools = []
          const skipped = []
          const scanned = []
          for (const preset of Array.isArray(declared) ? declared : []) {
            const presetId = preset?.id
            if (typeof presetId !== 'string' || presetId === '') continue
            let lease
            try {
              lease = await roster.acquireScope(presetId)
              // base 视图 = 进入本插件过滤前的真实段 / 工具原文，正是要留的并集。
              const base = await collectScopeBase(ctx, lease.key, presetId)
              sections.push(...base.sections)
              tools.push(...base.tools)
              scanned.push(presetId)
            } catch (error) {
              skipped.push({ preset: presetId, reason: String(error && error.message ? error.message : error) })
            } finally {
              if (lease !== undefined) {
                try { await lease[Symbol.asyncDispose]() } catch { /* 释放失败不影响结果 */ }
              }
            }
          }
          if (scanned.length === 0) {
            writeJson(res, 409, {
              ok: false,
              error: '没有任何预设扫描成功，保留现有登记表以免清空',
              skipped,
            })
            return
          }
          // 多个预设会重复贡献同名条目：catalog.replace 内部按名字归一（后见到者赢）。
          const report = catalog.replace({ sections, tools })
          writeJson(res, 200, { ok: true, scanned, skipped, report, catalog: catalog.read() })
        } catch (error) {
          writeJson(res, 500, { ok: false, error: String(error && error.message ? error.message : error) })
        }
      },
    })
    ctx.effect(() => disposeRescan, 'prompt-customizer: catalog rescan route')

    // agent 预设枚举路由：直接读 roster 的 list()（未 memo 化，运行中新增
    // 的预设立即可见），给 UI 的目标选择器与预览选择器供货。
    const disposePresets = register({
      kind: 'exact',
      path: '/api/prompt-customizer/agent-presets',
      handler: async (_req, res) => {
        try {
          const presets = ctx.get('agentPresets')
          const list = presets ? await presets.list() : []
          writeJson(res, 200, {
            ok: true,
            presets: list.map((p) => ({ id: p.id, name: p.name ?? p.id, description: p.description, broken: p.broken })),
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
          // 导出的是**用户写下的原文**：直接解析磁盘文件，不走 store 的解析
          // 缓存 —— readResolved() 会补 schema 默认值（导出一堆用户没写过的
          // 条目），raw() 的实例状态在长生命周期进程里也不可靠。
          let raw = {}
          try {
            const parsed = parse(fs.readFileSync(configFile, 'utf8'))
            if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) raw = parsed
          } catch { /* 文件缺失 / 坏 YAML：导出空定制，不报错 */ }
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
          if (target === undefined) {
            writeJson(res, 400, { ok: false, error: 'target (agent preset id) is required — prompts must be customized per preset, the global layer is retired in 0.9.0' })
            return
          }
          store.writeSection(overlayPatch({ ...(store.raw() ?? {}) }, target, patch))
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
const APPLY_FIELDS = ['sections', 'sectionsBootstrap', 'sectionsCompaction', 'replace', 'inject', 'tools']

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

/** 枚举当前生效的段与工具，并附上各自的屏蔽 / 隐藏标记。 */
async function buildInventory(ctx, raw, scopeKey, presetId, catalog, preview) {
  // 生效配置：目标 agent 预设的 override（0.9.0 起无全局基底）。
  const cfg = effectiveConfig(raw.overrides?.[presetId])
  const denied = new Set(cfg.sections ?? [])
  const replace = cfg.replace ?? {}
  const injectOrder = new Map((cfg.inject ?? []).map((item) => [item.name, item.order]))
  const te = pickToolsFilter(cfg.tools, { promoted: true, boundary: -1 }) // 清单无会话概念：恒展示静态（晋级后）视图
  const isHidden = (name) => (te.exclude ?? []).includes(name)

  const seenSections = (preview.baseSections ?? []).map((section, index) => ({
    name: section.name,
    order: injectOrder.get(section.name) ?? index,
    text: section.text,
  }))
  const seenTools = []
  // 从解析出的 scope 枚举工具；scope key 不可用时（如常驻挂载超时）回退到
  // 全局层，避免仅仅因为 agent 组装未就绪就返回空目录。
  try {
    const byName = new Map()
    for (const scope of [scopeKey, undefined]) {
      let schemas = []
      try { schemas = ctx.tools.schemas(scope) ?? [] } catch { schemas = [] }
      for (const tool of schemas) {
        if (tool.name && tool.name !== undefined && !byName.has(tool.name)) byName.set(tool.name, tool)
      }
      if (byName.size > 0) break
    }
    for (const tool of byName.values()) {
      seenTools.push({ name: tool.name, description: typeof tool.description === 'string' ? tool.description : '' })
    }
  } catch { /* 工具注册表未就绪 —— 本次不增量并入 */ }

  // 并进累积登记表，再按并集出名单：本 scope 见到的排在前面（顺序更贴近当前
  // 预设），其它预设见过的追加在后。同名内容后见到者赢，条目只增不减。
  if (catalog !== undefined) catalog.observe({ sections: seenSections, tools: seenTools })
  const pool = catalog === undefined ? { sections: seenSections, tools: seenTools } : catalog.read()
  const seenNames = new Set(seenSections.map((x) => x.name))
  const sections = [...seenSections, ...pool.sections.filter((x) => !seenNames.has(x.name))]
    .map((item) => ({ ...item, active: !denied.has(item.name), replaced: Object.hasOwn(replace, item.name) }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const seenToolNames = new Set(seenTools.map((x) => x.name))
  const tools = [...seenTools, ...pool.tools.filter((x) => !seenToolNames.has(x.name))]
    .map((item) => ({ ...item, hidden: isHidden(item.name) }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return { sections, tools, config: cfg }
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
  const assembled = await ctx.systemPrompt.assemble({
    scope: scopeKey,
    promptCustomizerPreset: presetId,
    promptCustomizerPhase: 'active',
    promptCustomizerBase: true,
  })
  const baseView = (assembled && typeof assembled === 'object' && assembled.promptCustomizerBaseView) || {}
  return {
    sections: (Array.isArray(baseView.sections) ? baseView.sections : []).map((sec) => ({ name: sec.name, text: sec.text })),
    tools: (Array.isArray(baseView.tools) ? baseView.tools : []).map((tool) => ({ name: tool.name, description: tool.description })),
  }
}

async function buildPreview(ctx, scopeKey, hintId, phase, catalog, patch, patchTarget) {
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
  // 预过滤视图（base）：与 post 视图来自同一次装配，三个 Tab 共用同一份数据。
  const baseView = (assembled && typeof assembled === 'object' && assembled.promptCustomizerBaseView) || {}
  // 预览带 scope，是「浏览其它预设」时唯一真正跑过该预设装配的入口 —— 把它
  // 见到的段与工具并进池子（base 视图不含 order，新条目由登记表按追加序补）。
  if (catalog !== undefined) {
    catalog.observe({
      sections: (Array.isArray(baseView.sections) ? baseView.sections : []).map((sec) => ({ name: sec.name, text: sec.text })),
      tools: (Array.isArray(baseView.tools) ? baseView.tools : []).map((tool) => ({ name: tool.name, description: tool.description })),
    })
  }
  const registryTools = registryToolNames(ctx, scopeKey)
  const registryTotal = registryTools.length
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
    tools: Array.isArray(assembled.tools)
      ? assembled.tools.map((tool) => ({
          name: typeof tool.name === 'string' ? tool.name : String(tool.name),
          description: typeof tool.description === 'string' ? tool.description : '',
        }))
      : [],
    // 预过滤视图：段（含该阶段独立屏蔽标记 blocked / 替换标记）与工具
    // （含该阶段隐藏标记 hidden）—— 供提示词 / 工具 Tab 渲染「每阶段
    // 独立名单」，被屏蔽 / 被隐藏的条目仍保留在此可反选。
    baseSections: Array.isArray(baseView.sections) ? baseView.sections : [],
    baseTools: Array.isArray(baseView.tools) ? baseView.tools : [],
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
 * 把该阶段 `add` 名单里、当前目录还没有的工具，从注册表查回 schema 追加回去
 *（「把被该阶段裁掉、但注册表里仍有的工具加回来」）。`exclude` 优先 —— 同一
 * 名字两者都在 = 隐藏，不加；目录里已有的不重复；注册表查不到的名字跳过（通常
 * 是别的预设独有的工具，当前预设没有可查的 schema，加不进来）。
 */
function appendAddedTools(ctx, scopeKey, tools, add, exclude) {
  if (!Array.isArray(add) || add.length === 0) return tools
  const excluded = new Set(exclude ?? [])
  const present = new Set(tools.map((tool) => tool.name))
  const wanted = add.filter((name) => !present.has(name) && !excluded.has(name))
  if (wanted.length === 0) return tools
  const registry = new Map()
  for (const scope of [scopeKey, undefined]) {
    let schemas = []
    try { schemas = ctx.tools.schemas(scope) ?? [] } catch { schemas = [] }
    for (const tool of schemas) if (tool.name) registry.set(tool.name, tool)
    if (registry.size > 0) break
  }
  const extra = wanted.map((name) => registry.get(name)).filter(Boolean)
  return extra.length > 0 ? [...tools, ...extra] : tools
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

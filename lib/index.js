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
 * 定制按作用域生效：顶层字段是全局默认；`overrides` 按 agent 预设 id 提供
 * 字段级覆盖（非空字段整体接管，空缺回落全局）。注入段支持 `phase`
 * （always/bootstrap/active），工具过滤支持未晋级阶段的 bootstrap 目录与
 * 压缩后未晋级阶段的 compaction 目录（三态：compaction > bootstrap > 静态）——
 * 晋级由 durable 会话事件推导（compaction 复位，subagent 恒已晋级）。
 *
 * 客户端对 bootstrap / compaction / active 三套名义装配各拉取一次
 * `/preview?phase=…`，三个阶段部分**恒定全部显示**（预设没有某个阶段时，
 * 该部分只是空的）—— 不同 agent 预设的「agent 周期」不同（standard 三态同形，
 * minimal 一个形态，router / warmup 两个，anchored 家族三个），但那是各阶段
 * 内容是否相同的问题，不构成把阶段藏起来的理由。
 *
 * 另一面：若该 scope 有以 `complete: true` 注册的段（persona 整段接管），宿主
 * 会在装配瀑布流**之后**把 sections 强制还原成那一条段（见 dsh-system-prompt
 * 的 assemble 契约），本插件的段级屏蔽 / 替换 / 注入 / 排序对其完全不生效
 * （工具过滤不受影响）。`forceSections`（默认开）为此提供终极手段：包装宿主
 * 的 assemble，在方法边界用注册表原始段重建 sections —— 预设插件的阶段裁段
 * （实测 liangshen / warmupbetter 等 preset 过滤器全部 prepend: true）与
 * complete 整段接管都无法再改写结果。关闭时预览过滤器会探测并把段名作为
 * `takenOverBy` 透出，让提示词 / 预览两个 Tab 就这件事说同一句话。
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { Config, NS } from './schema.js'
import { mergeConfig, pickToolsFilter, pickSectionsForStatus, applyToolFilter, applySectionPolicy } from './effective.js'
import { createPromotion, presetOfSession } from './promotion.js'
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

/** 收集并解析一个请求体（JSON），超过上限直接拒绝——路由是本进程私有的，上限只是防御。 */
function readJsonBody(req, limit = 2 * 1024 * 1024) {
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

  // 2) 晋级 tracker：增量维护每会话的 bootstrap/active 阶段（durable 事件
  //    推导，compaction 复位，subagent 恒已晋级）。
  const promotion = createPromotion()
  ctx.on('session/event', (session, event) => {
    try { promotion.observe(session, event) } catch { /* tracker 故障绝不影响事件流 */ }
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

  // 3) 装配目标解析（瀑布流与 assemble 强制覆盖共用）：生效配置 = 显式预览
  //    提示 > 会话所属 agent 预设（字段级覆盖）> 全局默认。预览 hint 优先于
  //    会话事件推导的阶段，让同一份配置能渲染 bootstrap / compaction / active
  //    三种阶段视图。boundary 语义与 promotion.status 一致（-1 = 从未压缩）。
  const resolveTarget = (context) => {
    const raw = read()
    const id = typeof context?.promptCustomizerPreset === 'string'
      ? context.promptCustomizerPreset
      : presetOfSession(context?.agent?.session)
    const cfg = mergeConfig(raw, raw.overrides?.[id])
    const phaseHint = typeof context?.promptCustomizerPhase === 'string'
      ? context.promptCustomizerPhase
      : undefined
    const status = phaseHint === 'bootstrap' ? { promoted: false, boundary: -1 }
      : phaseHint === 'compaction' ? { promoted: false, boundary: 1 }
      : phaseHint === 'active' ? { promoted: true, boundary: -1 }
      : promotion.status(context?.agent)
    return { raw, cfg, status }
  }

  // 装配瀑布流：实时应用字段级 override、屏蔽 / 替换 / 注入 / 阶段化工具过滤。
  ctx.on('system-prompt/assemble', async (assembly, context, next) => {
    // 下游错误原样传播；只有本过滤器自身的逻辑被兜底。
    const assembled = await next()
    try {
      const { raw, cfg, status } = resolveTarget(context)
      const denied = new Set(pickSectionsForStatus(cfg, status))
      const replace = cfg.replace ?? {}
      const te = pickToolsFilter(cfg.tools, status)

      // 预览专用的预过滤视图（提示词 / 工具 / 预览三个 Tab 的统一数据源）：
      // 记录进入本过滤规则的段 / 工具原文，并附上该阶段专属的屏蔽 / 隐藏标记，
      // 让 UI 能正确回显「每阶段独立名单」和工具的逐项隐藏（隐藏后仍在列表）。
      // 运行时装配不带该 hint，零额外开销。
      const baseView = context?.promptCustomizerBase === true
        ? {
            sections: Array.isArray(assembled.sections) ? assembled.sections.map((section) => ({
              name: section.name,
              text: typeof section.text === 'function' ? '<动态生成>' : String(section.text ?? ''),
              blocked: denied.has(section.name),
              replaced: Object.hasOwn(replace, section.name),
            })) : [],
            tools: Array.isArray(assembled.tools) ? assembled.tools.map((tool) => ({
              name: typeof tool.name === 'string' ? tool.name : String(tool.name),
              description: typeof tool.description === 'string' ? tool.description : '',
              hidden: (te.exclude ?? []).includes(tool.name),
            })) : [],
          }
        : undefined

      // 本插件过滤前的原始输入（段 / 工具）—— 预过滤视图与 post 视图同源，
      // 让提示词 / 工具 / 预览三个 Tab 与运行时装配所见一致。
      const baseSections = Array.isArray(assembled.sections) ? assembled.sections : []
      const baseTools = Array.isArray(assembled.tools) ? assembled.tools : []

      // 段级策略（屏蔽 / 替换 / 注入 / 排序）由 effective.applySectionPolicy
      // 统一实现：瀑布流与 assemble 强制覆盖共用同一份逻辑。
      const sections = applySectionPolicy(baseSections, cfg, status)

      const tools = appendAddedTools(ctx, context?.scope, applyToolFilter(baseTools, te), te.add, te.exclude)

      const result = { ...assembled, sections, tools }
      if (baseView) {
        result.promptCustomizerBaseView = {
          sections: baseSections.map((section) => ({
            name: section.name,
            text: typeof section.text === 'function' ? '<动态生成>' : String(section.text ?? ''),
            blocked: denied.has(section.name),
            replaced: Object.hasOwn(replace, section.name),
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

  // 4) 强制覆盖（forceSections，默认开）：包装宿主 systemPrompt.assemble。
  //    预设插件的 prepend 军备竞赛（实测 liangshen / warmupbetter 等 preset 的
  //    assemble 过滤器全部 `prepend: true`，standing mount 后注册永远排在本插件
  //    前面）与宿主的 complete 整段接管（瀑布流之后还原 sections）都无法用瀑布流
  //    位次对抗；唯一确定性的手段是在方法边界重建 sections —— 从注册表
  //    layers.merge() 取原始段定义（全局 + scope 链遮蔽后，scope = agent 时沿
  //    链解析到 standing 预设层），套用本插件的屏蔽 / 替换 / 注入 / 排序，
  //    tools / contexts / variables 保持宿主与预设行为。
  //    ponytail: 依赖宿主未承诺的 service 方法与 layers 公开字段；宿主升级可能
  //    静默失效 —— 失效时本包装不生效、瀑布流过滤仍在，可设 forceSections: false
  //    退回旧行为，预览的 takenOverBy / lostSections 探测仍可作运行时自检。
  const sp = ctx.get('systemPrompt')
  if (sp && typeof sp.assemble === 'function') {
    // 只在首个 apply() 记一次原始方法；插件 HMR 重载重跑 apply() 时用新闭包
    // 重新包装，但永远包在原始方法之上，避免层层套娃。
    const pristine = sp[PATCHED]?.orig ?? sp.assemble.bind(sp)
    sp[PATCHED] = { orig: pristine }
    sp.assemble = async (context = {}) => {
      // 变量先于装配同步：宿主在 pristine 内部解析 {{name}}，注册必须发生在前。
      syncVariables()
      const result = await pristine(context)
      if (read()?.forceSections === false) return result
      try {
        const { cfg, status } = resolveTarget(context)
        const defs = [...sp.layers.merge(context?.scope, (layer) => layer.sections).values()]
          .sort((a, b) => a.order - b.order)
        const baseSections = defs.map((section) => ({
          name: section.name,
          // 与宿主一致：动态段文本调用生成函数（可能被调用两次 —— 宿主装配
          // 内部已调用一次；动态段通常是纯函数，可接受）。
          text: typeof section.text === 'function' ? section.text(context) : section.text,
        }))
        const sections = applySectionPolicy(baseSections, cfg, status)
        const patched = { ...result, sections }
        // 预览的「产出 vs 模型所见」比对以强制覆盖后的最终段为准。
        if (context?.promptCustomizerBase === true) {
          patched.promptCustomizerEmitted = sections.map((section) => String(section.name))
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
  }

  // 5) 共享 webserver 上的清单路由（web profile 里必有）。
  //    用 ctx.get() 保持可选 —— 未在 `inject` 中声明就去访问 ctx.webServer
  //    会抛 "cannot get property without inject"。
  const webserver = ctx.get('webServer')
  if (webserver) {
    const dispose = webserver.register({
      kind: 'exact',
      path: '/api/prompt-customizer/inventory',
      handler: async (req, res) => {
        try {
          // 可选 `?scope=<agentPresetId>`：清单切换到该预设的 scope 与
          // 生效配置（字段级 override 后），供 UI 按目标编辑；缺省为 standard。
          // 宿主共享 webserver 的 req 是原始 IncomingMessage：没有 Express 的
          // query 属性，必须自行解析 URL 参数。
          const id = queryOf(req).get('scope') ?? undefined
          // scope 挂载失败（如常驻挂载超时）会回退展示 standard / 全局层：
          // scopeResolved 标记「请求的目标是否解析出了自己的 scope」，false 时
          // UI 警示「清单并非该预设的原生目录」。
          const resolved = id ? await resolveScopeFor(ctx, id) : await resolveStandardScope(ctx)
          const scopeKey = resolved ?? (id ? await resolveStandardScope(ctx) : undefined)
          const inventory = await buildInventory(ctx, read(), scopeKey, id, catalog)
          // 变量清单随单：先同步注册（黑名单可能刚改过），再列出当前可用名字。
          syncVariables()
          writeJson(res, 200, { ...inventory, scopeResolved: resolved !== undefined, variables: listVariableNames(read().envBlocklist ?? []) })
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
    const disposePreview = webserver.register({
      kind: 'exact',
      path: '/api/prompt-customizer/preview',
      handler: async (req, res) => {
        try {
          const { scopeKey, hintId, phase, scopeResolved } = await previewTarget(ctx, req)
          const preview = await buildPreview(ctx, scopeKey, hintId, phase, catalog)
          writeJson(res, 200, { ...preview, scopeResolved, phase })
        } catch (error) {
          writeJson(res, 500, {
            ok: false,
            error: String(error && error.message ? error.message : error),
          })
        }
      },
    })
    ctx.effect(() => disposePreview, 'prompt-customizer: preview route')

    // agent 预设枚举路由：直接读 roster 的 list()（未 memo 化，运行中新增
    // 的预设立即可见），给 UI 的目标选择器与预览选择器供货。
    const disposePresets = webserver.register({
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

    // 存为 agent 预设：整体 fork 当前编辑目标的预设目录 —— 组成文件、preset.yml、
    // 伴生 .mjs、技能目录一并带走（宿主 authoring API 负责复制并解引用符号链接，
    // 副本自包含），再把提交来的配置写进本插件 overrides[新名]。于是新预设 =
    // 来源预设的原样组成 + 我刚改好的定制，这才叫「保存的是我修改后的样子」。
    // 我们不再自己生成骨架：骨架带着 persona complete: true，宿主会在水流之后把
    // sections 还原成那一条段，段级定制在它上面根本不生效。
    const disposePresetsCreate = webserver.register({
      kind: 'exact',
      path: '/api/prompt-customizer/presets',
      handler: async (req, res) => {
        try {
          const body = await readJsonBody(req)
          const name = typeof body?.name === 'string' ? body.name.trim() : ''
          if (!/^[\p{L}\p{N}_-][\p{L}\p{N} _-]{0,63}$/u.test(name)) {
            writeJson(res, 400, { ok: false, error: '预设名只能包含中英文、数字、空格、下划线与连字符（≤64 字符），且不以标点开头' })
            return
          }
          const roster = ctx.get('agentPresets')
          if (roster === undefined || typeof roster.copy !== 'function') {
            writeJson(res, 501, { ok: false, error: '宿主未提供 agent 预设服务（dsh-agent-presets），无法创建预设' })
            return
          }
          if (roster.authorable === false) {
            writeJson(res, 400, { ok: false, error: '当前部署没有可写的用户预设根目录，无法创建预设' })
            return
          }
          // from = 当前编辑目标；全局目标（未选预设）回落到 roster 默认预设。
          const from = typeof body?.from === 'string' && body.from.length > 0 ? body.from : String(roster.defaultId ?? 'standard')
          const displayName = typeof body?.displayName === 'string' && body.displayName.trim().length > 0 ? body.displayName.trim() : name
          try {
            await roster.copy(from, name, displayName)
          } catch (error) {
            // 先 fork 后写 override：名字被占 / 非法 / 来源不存在时配置里不留空壳。
            writeJson(res, copyErrorStatus(error), {
              ok: false,
              error: String(error && error.message ? error.message : error),
            })
            return
          }
          const config = body.config && typeof body.config === 'object' && !Array.isArray(body.config) ? body.config : {}
          // 落盘 overrides[name] = 提交来的配置（净化：去掉空列表 / 空对象，避免
          // 生成空壳 override）；装配 / 预览 / Tab 全部走同一路径读它。
          const base = { ...(store.raw() ?? {}) }
          const overrides = { ...(base.overrides ?? {}) }
          const clean = {}
          for (const key of ['sections', 'sectionsBootstrap', 'sectionsCompaction', 'replace', 'inject', 'tools']) {
            const value = config[key]
            if (value === undefined || value === null) continue
            const empty = Array.isArray(value) ? value.length === 0 : Object.keys(value).length === 0
            if (!empty) clean[key] = value
          }
          overrides[name] = clean
          base.overrides = overrides
          store.writeSection(base)
          writeJson(res, 200, { ok: true, presetId: name, from, config: read() })
        } catch (error) {
          writeJson(res, 500, {
            ok: false,
            error: String(error && error.message ? error.message : error),
          })
        }
      },
    })
    ctx.effect(() => disposePresetsCreate, 'prompt-customizer: presets-create route')

    // 配置读写路由（插件自有 config.yaml 的前端通道）：
    //  GET  /config        → { ok, config }（解析后含默认值）
    //  POST /config/set    → body { field, value }；写入并返回最新 config
    //  POST /config/unset  → body { field }；删除字段并返回最新 config
    const disposeConfig = webserver.register({
      kind: 'exact',
      path: '/api/prompt-customizer/config',
      handler: async (_req, res) => {
        writeJson(res, 200, { ok: true, config: read() })
      },
    })
    ctx.effect(() => disposeConfig, 'prompt-customizer: config route')

    const withFieldWrite = (handler) => async (req, res) => {
      try {
        const body = await readJsonBody(req)
        if (typeof body?.field !== 'string' || body.field.length === 0) {
          writeJson(res, 400, { ok: false, error: 'field is required' })
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
    const disposeConfigSet = webserver.register({
      kind: 'exact',
      path: '/api/prompt-customizer/config/set',
      handler: withFieldWrite(({ field, value }) => store.setField(field, value)),
    })
    ctx.effect(() => disposeConfigSet, 'prompt-customizer: config set route')

    const disposeConfigUnset = webserver.register({
      kind: 'exact',
      path: '/api/prompt-customizer/config/unset',
      handler: withFieldWrite(({ field }) => store.setField(field, undefined)),
    })
    ctx.effect(() => disposeConfigUnset, 'prompt-customizer: config unset route')

    // 恢复初始状态：清空一切定制并关闭 forceSections —— 与「不装本插件」等效，
    // 无需卸载 / 重启（forceSections: false 时 assemble 包装直接放行宿主原样，
    // 瀑布流里空配置的过滤是无操作）。文件本身保留，避免卸载重装后迁移逻辑
    // 再次触发；之后要重新启用定制，把 forceSections 改回 true 或删除该行即可。
    const disposeConfigReset = webserver.register({
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

    // 批量保存路由：UI「统一保存按钮」的唯一写盘通道。body { target?, patch }，
    // patch 只认业务字段（只认下列业务字段，含每阶段独立段名单），字段值为 null 表示
    // 删除（回退默认/全局）。target 缺省写全局顶层；target 为 agent 预设 id
    // 时写 overrides[id]，清空后的空 override 连带删除，避免配置文件堆积空壳。
    const APPLY_FIELDS = ['sections', 'sectionsBootstrap', 'sectionsCompaction', 'replace', 'inject', 'tools']
    const disposeConfigApply = webserver.register({
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
          const base = { ...(store.raw() ?? {}) }
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
          store.writeSection(base)
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

/** 解析 `value`，但最多等待 `ms` 毫秒，超时回退到 `fallback`。 */
function withTimeout(value, ms, fallback) {
  return Promise.race([
    Promise.resolve(value),
    new Promise((resolve) => setTimeout(() => resolve(fallback), ms)),
  ])
}

/**
 * 宿主 authoring API（`agentPresets.copy`）抛错 → HTTP 状态码。
 *
 * 按错误类的名字判定而不是 import 宿主包：`@deepseek-ai/dsh-agent-presets` 是宿主
 * 依赖，本插件不声明它，子路径导出也不保证存在；名字对不上时退回 500，错误文本
 * 原样回给 UI，至少不吞信息。
 */
function copyErrorStatus(error) {
  const kind = String(error?.constructor?.name ?? '')
  if (kind === 'PresetExistsError') return 409
  if (kind === 'InvalidPresetIdError' || kind === 'PresetNotWritableError' || kind === 'UnknownPresetError') return 400
  return 500
}

/**
 * 存在 roster 时解析 `standard` agent 的常驻 scope key。
 *
 * `standingKeyFor` 会挂载整个 agent 预设（组装插件），可能很慢或依赖尚未
 * 就绪的服务 —— 只读的清单浏览绝不能被它挂住。若在短超时内没有结果，
 * 回退到全局层（scopeKey = undefined）。
 */
async function resolveStandardScope(ctx) {
  try {
    const presets = ctx.get('agentPresets')
    if (presets && typeof presets.standingKeyFor === 'function') {
      return await withTimeout(presets.standingKeyFor('standard'), 1500, undefined)
    }
  } catch { /* 没有 roster —— 回退到全局层 */ }
  return undefined
}

/** 枚举当前生效的段与工具，并附上各自的屏蔽 / 隐藏标记。 */
async function buildInventory(ctx, raw, scopeKey, presetId, catalog) {
  // 生效配置：目标 agent 预设的字段级 override 优先于全局默认。
  const cfg = mergeConfig(raw, raw.overrides?.[presetId])
  const denied = new Set(cfg.sections ?? [])
  const replace = cfg.replace ?? {}
  const injectOrder = new Map((cfg.inject ?? []).map((item) => [item.name, item.order]))
  const te = pickToolsFilter(cfg.tools, { promoted: true, boundary: -1 }) // 清单无会话概念：恒展示静态（晋级后）视图
  const isHidden = (name) => (te.exclude ?? []).includes(name)

  // 解析段的文本。动态段注册的是函数；用尽力而为的上下文调用它（与装配时
  // 传入的形态一致），清单才能回显真实生成内容供替换编辑。函数抛错或返回
  // 未决值时回退为占位标记。
  const resolveText = (section) => {
    if (typeof section.text === 'function') {
      try {
        const value = section.text({ scope: scopeKey })
        // 异步动态段返回 thenable，无法同步回显。
        if (value && typeof value.then === 'function') return '<动态生成>'
        return String(value ?? '')
      } catch { return '<动态生成>' }
    }
    return String(section.text ?? '')
  }

  // 本次这个 scope 真正见到的段与工具：只带身份与内容，标记一律现算。
  const seenSections = [...ctx.systemPrompt.layers.merge(scopeKey, (layer) => layer.sections).entries()]
    .map(([name, section]) => ({
      name,
      order: injectOrder.has(name) ? injectOrder.get(name) : (typeof section.order === 'number' ? section.order : 0),
      text: resolveText(section),
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

/**
 * 解析一个 agent 预设 id 的常驻 scope key（供无 agent 的只读路由使用）。
 * 显式点名某预设时给挂载留足时间（15s）：standingKeyFor 要组装整个预设
 * 插件树，慢挂载很常见，且挂载成功后 roster 常驻 memo，后续请求零开销。
 * 注意 roster 的 standingKeyFor 对未知 id 也会兜底返回 standard scope，
 * 因此先用 list() 确认 id 存在 —— 否则「预设不存在」会被误当成解析成功。
 */
async function resolveScopeFor(ctx, id) {
  if (!id) return undefined
  try {
    const presets = ctx.get('agentPresets')
    if (presets && typeof presets.standingKeyFor === 'function') {
      if (typeof presets.list === 'function') {
        const list = await withTimeout(presets.list(), 15000, undefined)
        if (Array.isArray(list) && !list.some((p) => p.id === id)) return undefined
      }
      return await withTimeout(presets.standingKeyFor(id), 15000, undefined)
    }
  } catch { /* 未知预设或挂载失败（如预设依赖缺失）—— 回退全局层 */ }
  return undefined
}

/**
 * Resolve the scope key + preset hint a preview request targets. An explicit
 * `?scope=<id>` requests that agent preset's standing scope; otherwise fall
 * back to the `standard` agent (same default the inventory uses). Always
 * resolves within the same short timeout so a slow standing mount cannot hang
 * the request. The hint makes our own assemble filter apply that preset's
 * field-level override during the preview waterfall.
 *
 * 返回的 `scopeResolved` 表示「请求的目标是否解析出了自己的 scope」：显式
 * id 挂载失败时展示会回落 standard scope，但标记为 false，让 UI 明确警示
 * 「预览的不是该预设的原生装配」。
 */
async function previewTarget(ctx, req) {
  const id = queryOf(req).get('scope') ?? undefined
  const resolved = id ? await resolveScopeFor(ctx, id) : await resolveStandardScope(ctx)
  const scopeKey = resolved ?? (id ? await resolveStandardScope(ctx) : undefined)
  // `?phase=`：bootstrap / compaction / active 三态预览；其它值一律回退实际推导。
  const rawPhase = queryOf(req).get('phase') ?? undefined
  const phase = rawPhase === 'bootstrap' || rawPhase === 'compaction' || rawPhase === 'active'
    ? rawPhase
    : undefined
  return { scopeKey, hintId: id, phase, scopeResolved: resolved !== undefined }
}

/**
 * 按预览阶段合成一个最小伪会话 agent。预设原生的阶段裁剪插件（zero-tool
 * bootstrap / router-bootstrap / warmup 等）在 assemble 瀑布流里只读
 * `session.id / session.events / session.header / agent.options.model` 推导
 * 晋级状态并动态裁剪工具目录 —— 合成的 durable 事件让这些规则在只读预览
 * 里按所选阶段真实运行（而非挤在常驻视图）：
 * - bootstrap：空事件（boundary -1，未晋级，首轮形态）
 * - compaction：一条 compaction/end（压缩后未重新晋级）
 * - active：一条晋级信号（assistant/message，event 形状见各预设的
 *   compaction-epoch.mjs —— 只认 type 与 seq）
 */
export function fakeAgentFor(phase, presetId) {
  const events = phase === 'compaction'
    ? [{ type: 'compaction/end', seq: 1 }]
    : phase === 'active'
      ? [{ type: 'assistant/message', seq: 1 }]
      : []
  return {
    session: {
      id: `prompt-customizer-preview-${phase}`,
      events,
      header: {
        delegationDepth: 0,
        agentPreset: presetId,
        cwd: process.cwd(),
        meta: {},
      },
    },
    options: { provider: '', model: '' },
  }
}

/**
 * 渲染某个 scope 的最终系统提示词：跑完整的装配瀑布流（所有插件的过滤、
 * 包括我们自己的都会生效），再把幸存的段拼成文本。这就是模型实际看到的内容。
 *
 * `phase` 给定时额外携带伪会话 agent，让预设原生的阶段裁剪规则（引导期
 * 收敛目录等）也按所选阶段真实运行；伪会话触发任何插件异常时降级为无
 * 会话装配（原生规则视为已晋级 / 全目录）并标记 degraded，预览永远可用。
 * 同时返回注册表原始目录总数 registryTotal，与模型可见目录形成对照
 * （如 PTC / Code Mode 把全目录包装成单一 run_code）。
 */
async function buildPreview(ctx, scopeKey, hintId, phase, catalog) {
  // promptCustomizerPreset / promptCustomizerPhase 都是本插件的自定义装配
  // 字段：让我们的过滤器在这次装配里按该 agent 预设的 override 与指定阶段
  // 视图生效（AssembleContext 允许插件自定义字段）。
  const hint = {
    scope: scopeKey,
    promptCustomizerPreset: hintId,
    promptCustomizerPhase: phase,
    // 请求预过滤视图（base）：本插件的过滤器把进入过滤前的段 / 工具原文
    // 连同屏蔽 / 隐藏标记一起附在装配结果上，作为三个 Tab 的统一数据源。
    promptCustomizerBase: true,
  }
  let assembled
  let degraded = false
  try {
    assembled = await ctx.systemPrompt.assemble(
      phase ? { ...hint, agent: fakeAgentFor(phase, hintId) } : hint,
    )
  } catch {
    // 伪会话让某个预设插件抛错了：退回无会话装配，原生规则不参与本次预览。
    degraded = phase !== undefined
    assembled = await ctx.systemPrompt.assemble(hint)
  }
  const sections = Array.isArray(assembled.sections)
    ? assembled.sections.map((section) => ({ name: section.name, text: String(section.text ?? '') }))
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
    scope: scopeKey,
    degraded,
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
    text: renderPreviewText(assembled),
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

/** 把幸存的段拼成最终提示词文本（与 dsh 的 renderPrompt 行为一致）。 */
function renderPreviewText(assembled) {
  return (Array.isArray(assembled.sections) ? assembled.sections : [])
    .map((section) => String(section.text ?? '').trim())
    .filter((text) => text.length > 0)
    .join('\n\n')
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
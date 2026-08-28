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
 * 阶段不是固定的三个：不同 agent 预设的「agent 周期」不同（minimal 只有一个
 * 形态，router / warmup 两个，anchored 家族三个）。客户端对 bootstrap /
 * compaction / active 三套名义装配各拉取一次 `/preview?phase=…`，按
 * (提示词, 工具) 签名去重得出该预设真实拥有的阶段（cycle），工具 / 预览
 * Tab 据此绑定显示 —— 只渲染真正不同的提示词 / 工具组合，同形阶段折叠为常驻。
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { Config, NS } from './schema.js'
import { stringify } from 'yaml'
import { mergeConfig, filterInjectByPhase, pickToolsFilter, pickSectionsForStatus, applyToolFilter } from './effective.js'
import { createPromotion, presetOfSession } from './promotion.js'
import { createConfigStore, readLegacySection } from './store.js'

export const name = 'prompt-customizer'
// settings 仍被注入：只读 documentPath 做一次性旧版迁移。cordis 对未在
// inject 里声明的服务调用 ctx.get 会抛错，漏声明会让整个插件加载失败。
export const inject = ['settings', 'systemPrompt', 'tools']

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

  // 3) 装配瀑布流：实时应用字段级 override、屏蔽 / 替换 / 注入 / 阶段化工具过滤。
  ctx.on('system-prompt/assemble', async (assembly, context, next) => {
    // 下游错误原样传播；只有本过滤器自身的逻辑被兜底。
    const assembled = await next()
    try {
      const raw = read()
      // 生效配置：显式预览提示 > 会话所属 agent 预设（字段级覆盖）> 全局默认。
      const id = typeof context?.promptCustomizerPreset === 'string'
        ? context.promptCustomizerPreset
        : presetOfSession(context?.agent?.session)
      const cfg = mergeConfig(raw, raw.overrides?.[id])
      // 预览 hint：显式 promptCustomizerPhase 时以它替代由会话事件推导的
      // 实际阶段，让同一份配置能渲染 bootstrap / compaction / active 三种
      // 阶段视图。boundary 语义与 promotion.status 一致（-1 = 从未压缩）。
      const phaseHint = typeof context?.promptCustomizerPhase === 'string'
        ? context.promptCustomizerPhase
        : undefined
      const status = phaseHint === 'bootstrap' ? { promoted: false, boundary: -1 }
        : phaseHint === 'compaction' ? { promoted: false, boundary: 1 }
        : phaseHint === 'active' ? { promoted: true, boundary: -1 }
        : promotion.status(context?.agent)
      const denied = new Set([...(cfg.sections ?? []), ...pickSectionsForStatus(cfg, status)])
      const replace = cfg.replace ?? {}
      // inject 按当前阶段模式筛选（bootstrap/active/compact 三态注入互相独立）。
      const injectList = filterInjectByPhase(cfg.inject, status)
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
              hidden: Array.isArray(te.include) && te.include.length > 0
                ? !te.include.includes(tool.name)
                : (te.exclude ?? []).includes(tool.name),
            })) : [],
          }
        : undefined

      // 本插件过滤前的原始输入（段 / 工具）—— 预过滤视图与 post 视图同源，
      // 让提示词 / 工具 / 预览三个 Tab 与运行时装配所见一致。
      const baseSections = Array.isArray(assembled.sections) ? assembled.sections : []
      const baseTools = Array.isArray(assembled.tools) ? assembled.tools : []

      let sections = baseSections
        .filter((section) => !denied.has(section.name))
        .map((section, i) =>
          Object.hasOwn(replace, section.name) ? { ...section, order: i, text: replace[section.name] } : { ...section, order: i },
        )
      for (const item of injectList) {
        // 被屏蔽的段直接跳过 —— 上面已经把它们过滤掉了。
        if (denied.has(item.name)) continue
        const index = sections.findIndex((section) => section.name === item.name)
        if (index >= 0) {
          // 已存在的段：覆盖 order 来控制拼接顺序。替换文本（上面已设置）优先
          // 保留；仅当没有替换且用户真的提供了注入文本时才用 item.text。
          const finalText = Object.hasOwn(replace, item.name)
            ? sections[index].text
            : (item.text ? item.text : sections[index].text)
          sections[index] = { ...sections[index], text: finalText, order: item.order }
        } else {
          sections.push({ name: item.name, order: item.order, text: Object.hasOwn(replace, item.name) ? replace[item.name] : item.text })
        }
      }
      // 虚拟 order 排序：order 缺省按 0，稳定排序保持系统段原始相对顺序；
      // 注入段携带各自的 order（120+ 落在系统段之后，或被重排到任意断点），
      // 以 order 升序决定注入顺序 —— 与「每阶段独立名单」配合即每阶段独立序。
      sections.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

      const tools = applyToolFilter(baseTools, te)

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
            hidden: Array.isArray(te.include) && te.include.length > 0
              ? !te.include.includes(tool.name)
              : (te.exclude ?? []).includes(tool.name),
          })),
        }
      }
      return result
    } catch (error) {
      warnOnce(`prompt-customizer: 过滤器异常，本次装配回退为未加工结果：${String((error && error.message) || error)}`)
      return assembled
    }
  })

  // 4) 共享 webserver 上的清单路由（web profile 里必有）。
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
          const inventory = await buildInventory(ctx, read(), scopeKey, id)
          writeJson(res, 200, { ...inventory, scopeResolved: resolved !== undefined })
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
          const preview = await buildPreview(ctx, scopeKey, hintId, phase)
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

    // 创建 agent 预设：在 `~/.dsh/.agent-presets/<name>/` 下生成一个自包含
    // 的预设（agent.cordis.yml + preset.yml），并把当前配置写进本插件
    // overrides[name]（同名报错 409；成功后 roster 下次在线读取即出现）。
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
          const root = path.join(dshHome(), '.agent-presets')
          const dir = path.join(root, name)
          try { fs.mkdirSync(root, { recursive: true }) } catch { /* 建不成时下面 existsSync 兜底 */ }
          if (fs.existsSync(dir)) {
            writeJson(res, 409, { ok: false, error: `同名预设「${name}」已存在` })
            return
          }
          const config = body.config && typeof body.config === 'object' && !Array.isArray(body.config) ? body.config : {}
          // 落盘 overrides[name] = 当前配置（净化：去掉空列表/空对象，避免
          // 生成空壳 override）；装配/预览/Tab 全部走同一路径读它。
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
          // 自包含预设骨架：persona + 本地文件系统 + str-replace 编辑器
          // （与 minimal-win 同构，不依赖任何本地 .mjs，保证独一份可用）。
          fs.mkdirSync(dir, { recursive: true })
          fs.writeFileSync(path.join(dir, 'agent.cordis.yml'),
            stringify([
              { id: 'persona', name: '@deepseek-ai/dsh-persona', config: { text: 'You are a helpful software engineer assistant.', complete: true, includeRuntimeContext: false } },
              { id: 'filesystem', name: 'cordis:group', group: true, isolate: { fs: true }, config: [
                { id: 'fs-local', name: '@deepseek-ai/dsh-fs-local' },
              ] },
              { id: 'str-replace-editor', name: '@deepseek-ai/dsh-tool-str-replace-editor', config: { maxOutputChars: 16000 } },
            ]) + '\n', 'utf8')
          fs.writeFileSync(path.join(dir, 'preset.yml'),
            stringify({ name, description: typeof body.description === 'string' && body.description.trim() ? body.description.trim() : '由 dsh-prompt-customizer 从当前配置保存' }) + '\n', 'utf8')
          writeJson(res, 200, { ok: true, presetId: name, dir })
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

    // 批量保存路由：UI「统一保存按钮」的唯一写盘通道。body { target?, patch }，
    // patch 只认业务字段（白名单，含每阶段独立段名单），字段值为 null 表示
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
async function buildInventory(ctx, raw, scopeKey, presetId) {
  // 生效配置：目标 agent 预设的字段级 override 优先于全局默认。
  const cfg = mergeConfig(raw, raw.overrides?.[presetId])
  const denied = new Set(cfg.sections ?? [])
  const replace = cfg.replace ?? {}
  const injectOrder = new Map((cfg.inject ?? []).map((item) => [item.name, item.order]))
  const te = pickToolsFilter(cfg.tools, { promoted: true, boundary: -1 }) // 清单无会话概念：恒展示静态（晋级后）视图

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

  const sectionsMap = ctx.systemPrompt.layers.merge(scopeKey, (layer) => layer.sections)
  const sections = [...sectionsMap.entries()]
    .map(([name, section]) => ({
      name,
      order: injectOrder.has(name) ? injectOrder.get(name) : (typeof section.order === 'number' ? section.order : 0),
      text: resolveText(section),
      active: !denied.has(name),
      replaced: Object.hasOwn(replace, name),
    }))
    .sort((a, b) => a.order - b.order)

  let tools = []
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
    tools = [...byName.values()]
      .map((tool) => ({
        name: tool.name,
        description: typeof tool.description === 'string' ? tool.description : '',
        hidden: te.include?.length > 0 ? !te.include.includes(tool.name) : (te.exclude ?? []).includes(tool.name),
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  } catch { /* 工具注册表未就绪 —— 返回空列表 */ }

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
async function buildPreview(ctx, scopeKey, hintId, phase) {
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
  const registryTotal = 0
  try {
    const byName = new Map()
    for (const scope of [scopeKey, undefined]) {
      let schemas = []
      try { schemas = ctx.tools.schemas(scope) ?? [] } catch { schemas = [] }
      for (const tool of schemas) if (tool.name) byName.set(tool.name, tool)
      if (byName.size > 0) break
    }
    registryTotal = byName.size
  } catch { /* 注册表未就绪 —— 保持 0 */ }
  return {
    ok: true,
    scope: scopeKey,
    degraded,
    registryTotal,
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
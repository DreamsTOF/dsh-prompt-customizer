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
 *   agent 预设）、`GET/POST /api/prompt-customizer/config`（配置读写）。
 *
 * 定制按作用域生效：顶层字段是全局默认；`overrides` 按 agent 预设 id 提供
 * 字段级覆盖（非空字段整体接管，空缺回落全局）。注入段支持 `phase`
 * （always/bootstrap/active），工具过滤支持未晋级阶段的 bootstrap 目录 ——
 * 晋级由 durable 会话事件推导（compaction 复位，subagent 恒已晋级）。
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { Config, NS } from './schema.js'
import { mergeConfig, filterInjectByPhase, pickToolsFilter, applyToolFilter } from './effective.js'
import { createPromotion, presetOfSession } from './promotion.js'
import { createConfigStore, readLegacySection } from './store.js'

export const name = 'prompt-customizer'
export const inject = ['systemPrompt', 'tools']

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
      const promoted = promotion.status(context?.agent).promoted
      const denied = new Set(cfg.sections ?? [])
      const replace = cfg.replace ?? {}
      const injectList = filterInjectByPhase(cfg.inject, promoted)
      const te = pickToolsFilter(cfg.tools, promoted)

      let sections = assembled.sections
        .filter((section) => !denied.has(section.name))
        .map((section) =>
          Object.hasOwn(replace, section.name) ? { ...section, text: replace[section.name] } : section,
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
      sections.sort((a, b) => {
        // 注入列表非空时以它为权威顺序：injectList 里的段排最前（按列表内
        // 顺序），其余段按各自的原始 order 排在其后。
        if (injectList.length > 0) {
          const aIdx = injectList.findIndex((item) => item.name === a.name)
          const bIdx = injectList.findIndex((item) => item.name === b.name)
          if (aIdx >= 0 && bIdx >= 0) return aIdx - bIdx
          if (aIdx >= 0) return -1
          if (bIdx >= 0) return 1
        }
        return a.order - b.order
      })

      const tools = applyToolFilter(assembled.tools, te)

      return { ...assembled, sections, tools }
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
          const id = typeof req.query?.scope === 'string' && req.query.scope.length > 0 ? req.query.scope : undefined
          const scopeKey = id ? await resolveScopeFor(ctx, id) : await resolveStandardScope(ctx)
          writeJson(res, 200, await buildInventory(ctx, read(), scopeKey, id))
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
    // 可选的 `?scope=<agentPresetId>` 预览指定 agent 预设的装配结果；
    // 省略时使用 standard agent（与清单一致）。
    const disposePreview = webserver.register({
      kind: 'exact',
      path: '/api/prompt-customizer/preview',
      handler: async (req, res) => {
        try {
          const { scopeKey, hintId } = await previewTarget(ctx, req)
          writeJson(res, 200, await buildPreview(ctx, scopeKey, hintId))
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
  const te = pickToolsFilter(cfg.tools, true) // 清单无会话概念：恒展示静态（晋级后）视图

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
 * 与 standingKeyFor 的所有交互都在短超时内完成，慢挂载不会拖住请求。
 */
async function resolveScopeFor(ctx, id) {
  if (!id) return undefined
  try {
    const presets = ctx.get('agentPresets')
    if (presets && typeof presets.standingKeyFor === 'function') {
      return await withTimeout(presets.standingKeyFor(id), 1500, undefined)
    }
  } catch { /* 未知预设或没有 roster —— 回退全局层 */ }
  return undefined
}

/**
 * Resolve the scope key + preset hint a preview request targets. An explicit
 * `?scope=<id>` requests that agent preset's standing scope; otherwise fall
 * back to the `standard` agent (same default the inventory uses). Always
 * resolves within the same short timeout so a slow standing mount cannot hang
 * the request. The hint makes our own assemble filter apply that preset's
 * field-level override during the preview waterfall.
 */
async function previewTarget(ctx, req) {
  const id = req.query && typeof req.query.scope === 'string' && req.query.scope.length > 0
    ? req.query.scope
    : undefined
  const scopeKey = await resolveScopeFor(ctx, id) ?? await resolveStandardScope(ctx)
  return { scopeKey, hintId: id }
}

/**
 * 渲染某个 scope 的最终系统提示词：跑完整的装配瀑布流（所有插件的过滤、
 * 包括我们自己的都会生效），再把幸存的段拼成文本。这就是模型实际看到的内容。
 */
async function buildPreview(ctx, scopeKey, hintId) {
  // promptCustomizerPreset 是本插件的自定义装配字段：让我们的过滤器在这次
  // 装配里按该 agent 预设的 override 生效（AssembleContext 允许插件自定义字段）。
  const assembled = await ctx.systemPrompt.assemble({ scope: scopeKey, promptCustomizerPreset: hintId })
  const sections = Array.isArray(assembled.sections)
    ? assembled.sections.map((section) => ({ name: section.name, text: String(section.text ?? '') }))
    : []
  return {
    ok: true,
    scope: scopeKey,
    sections,
    text: renderPreviewText(assembled),
    tools: Array.isArray(assembled.tools)
      ? assembled.tools.map((tool) => ({
          name: typeof tool.name === 'string' ? tool.name : String(tool.name),
          description: typeof tool.description === 'string' ? tool.description : '',
        }))
      : [],
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
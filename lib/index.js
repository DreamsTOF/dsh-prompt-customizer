/**
 * dsh-prompt-customizer — 宿主端。
 *
 * - 注册 `prompt-customizer` 设置命名空间（实时生效）。
 * - 挂钩 `system-prompt/assemble` 瀑布流，按名称屏蔽 / 替换 / 注入提示词段，
 *   并从模型目录中隐藏工具。只影响面向模型的目录；工具与路由照常工作。
 * - 提供 `GET /api/prompt-customizer/inventory`，返回当前生效的段与工具列表
 *   （存在 roster 时针对 `standard` agent），每项带是否被屏蔽 / 隐藏的标记。
 */

import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import { Config, NS } from './schema.js'

export const name = 'prompt-customizer'
export const inject = ['settings', 'systemPrompt', 'tools']

export function apply(ctx, entry = {}) {
  // 1) 设置命名空间：base = 组装入口配置，实时生效。
  const scope = ctx.settings.register(settingsNamespace(NS), Config, {
    base: entry,
    applies: 'live',
  })
  const read = () => scope.get() ?? {}

  // 2) 装配瀑布流：实时应用屏蔽 / 替换 / 注入 / 工具过滤。
  ctx.on('system-prompt/assemble', async (assembly, context, next) => {
    const assembled = await next()
    const cfg = read()
    const denied = new Set(cfg.sections ?? [])
    const replace = cfg.replace ?? {}
    const injectList = cfg.inject ?? []
    const te = cfg.tools ?? {}
    const exclude = new Set(te.exclude ?? [])
    const include = Array.isArray(te.include) && te.include.length > 0 ? new Set(te.include) : null

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

    let tools = assembled.tools
    if (include) tools = tools.filter((tool) => include.has(tool.name))
    else if (exclude.size > 0) tools = tools.filter((tool) => !exclude.has(tool.name))

    return { ...assembled, sections, tools }
  })

  // 3) 共享 webserver 上的清单路由（web profile 里必有）。
  //    用 ctx.get() 保持可选 —— 未在 `inject` 中声明就去访问 ctx.webServer
  //    会抛 "cannot get property without inject"。
  const webserver = ctx.get('webServer')
  if (webserver) {
    const dispose = webserver.register({
      kind: 'exact',
      path: '/api/prompt-customizer/inventory',
      handler: async (_req, res) => {
        try {
          writeJson(res, 200, await buildInventory(ctx, read()))
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
          const scopeKey = await previewScope(ctx, req)
          writeJson(res, 200, await buildPreview(ctx, scopeKey))
        } catch (error) {
          writeJson(res, 500, {
            ok: false,
            error: String(error && error.message ? error.message : error),
          })
        }
      },
    })
    ctx.effect(() => disposePreview, 'prompt-customizer: preview route')
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
async function buildInventory(ctx, cfg) {
  const denied = new Set(cfg.sections ?? [])
  const replace = cfg.replace ?? {}
  const injectList = cfg.inject ?? []
  const injectOrder = new Map(injectList.map((item) => [item.name, item.order]))
  const te = cfg.tools ?? {}
  const exclude = new Set(te.exclude ?? [])
  const include = Array.isArray(te.include) && te.include.length > 0 ? new Set(te.include) : null

  const scopeKey = await resolveStandardScope(ctx)

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
        hidden: include ? !include.has(tool.name) : exclude.has(tool.name),
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  } catch { /* 工具注册表未就绪 —— 返回空列表 */ }

  return { sections, tools, config: cfg }
}

/**
 * Resolve the scope key a preview request targets. An explicit `?scope=<id>`
 * requests that agent preset's standing scope; otherwise fall back to the
 * `standard` agent (same default the inventory uses). Always resolves within
 * the same short timeout so a slow standing mount cannot hang the request.
 */
async function previewScope(ctx, req) {
  const id = req.query && req.query.scope
  if (typeof id === 'string' && id.length > 0) {
    try {
      const presets = ctx.get('agentPresets')
      if (presets && typeof presets.standingKeyFor === 'function') {
        const key = await withTimeout(presets.standingKeyFor(id), 1500, undefined)
        if (key) return key
      }
    } catch { /* 未知预设 —— 回退到 standard agent */ }
  }
  return resolveStandardScope(ctx)
}

/**
 * 渲染某个 scope 的最终系统提示词：跑完整的装配瀑布流（所有插件的过滤、
 * 包括我们自己的都会生效），再把幸存的段拼成文本。这就是模型实际看到的内容。
 */
async function buildPreview(ctx, scopeKey) {
  const assembled = await ctx.systemPrompt.assemble({ scope: scopeKey })
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
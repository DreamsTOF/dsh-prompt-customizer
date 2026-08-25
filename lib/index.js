/**
 * dsh-prompt-customizer — host half.
 *
 * - Registers the `prompt-customizer` settings namespace (live-applied).
 * - Hooks the `system-prompt/assemble` waterfall to block / replace / inject
 *   prompt sections and to hide tools from the model catalog by name. Only the
 *   model-facing list is affected; tools and routes keep working.
 * - Serves `GET /api/prompt-customizer/inventory` returning the effective
 *   section and tool lists (for the `standard` agent when a roster exists),
 *   each marked with whether it is currently blocked / hidden.
 */

import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import { Config, NS } from './schema.js'

export const name = 'prompt-customizer'
export const inject = ['settings', 'systemPrompt', 'tools']

export function apply(ctx, entry = {}) {
  // 1) settings namespace: base = composition entry, live-applied.
  const scope = ctx.settings.register(settingsNamespace(NS), Config, {
    base: entry,
    applies: 'live',
  })
  const read = () => scope.get() ?? {}

  // 2) assemble waterfall: apply filter/replace/inject live, choosing the
  //    per-agent overlay when the assembling context carries an agent scope.
  ctx.on('system-prompt/assemble', async (assembly, context, next) => {
    const assembled = await next()
    const cfg = mergeForAgent(read(), scopeIdOf(context))
    return { ...assembled, ...applyFilter(assembled, cfg) }
  })

  // 3) inventory route on the shared webserver (present in every web profile).
  //    Use ctx.get() so this stays optional — accessing ctx.webServer without
  //    declaring it in `inject` would throw "cannot get property without inject".
  const webserver = ctx.get('webServer')
  if (webserver) {
    const dispose = webserver.register({
      kind: 'exact',
      path: '/api/prompt-customizer/inventory',
      handler: async (req, res) => {
        try {
          const scopeKey = await previewScope(ctx, req)
          const cfg = mergeForAgent(read(), agentIdOf(scopeKey))
          writeJson(res, 200, await buildInventory(ctx, cfg, scopeKey))
        } catch (error) {
          writeJson(res, 500, {
            ok: false,
            error: String(error && error.message ? error.message : error),
          })
        }
      },
    })
    ctx.effect(() => dispose, 'prompt-customizer: inventory route')

    // Preview route: render the FINAL assembled system prompt (after every
    // plugin, including our own block/replace/inject filters) so the user can
    // confirm no injected section from other plugins pollutes it.
    // Optional `?scope=<agentPresetId>` previews a specific agent preset's
    // assembly; omitted, it uses the standard agent (same as the inventory).
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

    // Agents route: list every agent preset (for the per-agent editor UI).
    const disposeAgents = webserver.register({
      kind: 'exact',
      path: '/api/prompt-customizer/agents',
      handler: async (_req, res) => {
        try {
          writeJson(res, 200, await listAgents(ctx))
        } catch (error) {
          writeJson(res, 500, {
            ok: false,
            error: String(error && error.message ? error.message : error),
          })
        }
      },
    })
    ctx.effect(() => disposeAgents, 'prompt-customizer: agents route')
  }
}

/**
 * Apply block / replace / inject / tool filtering to an assembled system
 * prompt. Pure and shared by the waterfall and the tests.
 * @returns `{ sections, tools }` to spread over the assembly.
 */
export function applyFilter(assembled, cfg) {
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
    const index = sections.findIndex((section) => section.name === item.name)
    if (index >= 0) {
      // Existing section: apply the order override to control splice order.
      // Only override text when the user actually provided replacement text.
      sections[index] = item.text
        ? { ...sections[index], text: item.text, order: item.order }
        : { ...sections[index], order: item.order }
    } else {
      sections.push({ name: item.name, order: item.order, text: item.text })
    }
  }
  sections.sort((a, b) => a.order - b.order)

  let tools = assembled.tools
  if (include) tools = tools.filter((tool) => include.has(tool.name))
  else if (exclude.size > 0) tools = tools.filter((tool) => !exclude.has(tool.name))

  return { sections, tools }
}

/** Extract the agent-preset id from an assemble context's scope, if any. */
function scopeIdOf(context) {
  const scope = context && context.scope
  if (scope && typeof scope === 'object' && typeof scope.agentPreset === 'string') return scope.agentPreset
  return undefined
}

/** Extract the agent-preset id from a standing scope key. */
function agentIdOf(scopeKey) {
  return scopeKey && typeof scopeKey === 'object' && typeof scopeKey.agentPreset === 'string'
    ? scopeKey.agentPreset
    : undefined
}

/**
 * Merge the shared default config with the given agent preset's overlay.
 * The overlay's own arrays/objects replace the default's per field; the
 * default applies to every agent the overlay does not mention.
 */
export function mergeForAgent(raw, agentId) {
  const byAgent = raw.byAgent ?? {}
  const over = (agentId && byAgent[agentId]) || {}
  return {
    sections: over.sections ?? raw.sections ?? [],
    replace: { ...(raw.replace ?? {}), ...(over.replace ?? {}) },
    inject: mergeInject(raw.inject, over.inject),
    tools: {
      exclude: over.tools?.exclude ?? raw.tools?.exclude ?? [],
      include: over.tools?.include ?? raw.tools?.include ?? [],
    },
  }
}

/** Merge default + per-agent inject lists: same-name entries are overridden. */
function mergeInject(base, over) {
  const map = new Map((base ?? []).map((item) => [item.name, item]))
  for (const item of over ?? []) map.set(item.name, item)
  return [...map.values()]
}

/** Resolve `value` but never wait longer than `ms`; fall back to `fallback`. */
function withTimeout(value, ms, fallback) {
  return Promise.race([
    Promise.resolve(value),
    new Promise((resolve) => setTimeout(() => resolve(fallback), ms)),
  ])
}

/**
 * Resolve the `standard` agent's standing scope key when a roster is present.
 *
 * `standingKeyFor` mounts a whole agent preset (compose plugins) which can be
 * slow or depend on services that are not ready yet — for a read-only inventory
 * browse we must never let that hang the request. If it does not settle within
 * a short budget we fall back to the global layer (scopeKey = undefined).
 */
async function resolveStandardScope(ctx) {
  try {
    const presets = ctx.get('agentPresets')
    if (presets && typeof presets.standingKeyFor === 'function') {
      return await withTimeout(presets.standingKeyFor('standard'), 1500, undefined)
    }
  } catch { /* no roster — fall back to the global layer */ }
  return undefined
}

/** Enumerate the effective sections and tools with their blocked/hidden flags. */
async function buildInventory(ctx, cfg, scopeKey) {
  const denied = new Set(cfg.sections ?? [])
  const replace = cfg.replace ?? {}
  const injectList = cfg.inject ?? []
  const injectOrder = new Map(injectList.map((item) => [item.name, item.order]))
  const te = cfg.tools ?? {}
  const exclude = new Set(te.exclude ?? [])
  const include = Array.isArray(te.include) && te.include.length > 0 ? new Set(te.include) : null

  // Resolve a section's text. Dynamic sections register a function; call it
  // with a best-effort context (same shape the assemble passes) so the
  // inventory can echo the real generated content for replacement. Fall back
  // to a marker if the function throws or returns a pending value.
  const resolveText = (section) => {
    if (typeof section.text === 'function') {
      try {
        const value = section.text({ scope: scopeKey })
        // Async dynamic sections return a thenable we cannot echo synchronously.
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
  // Enumerate tools from the resolved scope, falling back to the global layer
  // when the scope key was unavailable (e.g. the standing mount timed out), so
  // the catalog is never empty just because agent composition was not ready.
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
  } catch { /* tools registry unresolved — return empty list */ }

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
    } catch { /* unknown preset — fall back to the standard agent */ }
  }
  return resolveStandardScope(ctx)
}

/** List every agent preset for the per-agent editor UI. */
async function listAgents(ctx) {
  try {
    const presets = ctx.get('agentPresets')
    if (!presets || typeof presets.list !== 'function') return { ok: true, agents: [], defaultAgent: undefined }
    const list = await withTimeout(presets.list(), 1500, [])
    const agents = (list ?? []).map((preset) => ({
      id: preset.id,
      name: typeof preset.name === 'string' && preset.name.length > 0 ? preset.name : preset.id,
      description: typeof preset.description === 'string' ? preset.description : '',
      order: typeof preset.order === 'number' ? preset.order : 0,
    }))
    return { ok: true, agents, defaultAgent: typeof presets.defaultId === 'string' ? presets.defaultId : undefined }
  } catch (error) {
    return { ok: false, error: String(error && error.message ? error.message : error), agents: [] }
  }
}

/**
 * Render the FINAL system prompt for a scope: run the full assemble waterfall
 * (so every plugin's filter, including our own, is applied), then render the
 * surviving sections to text. This is exactly what the model would see.
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

/** Join the surviving sections into the final prompt text (like dsh's renderPrompt). */
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
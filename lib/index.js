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

  // 2) assemble waterfall: apply filter/replace/inject live.
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

    return { ...assembled, sections, tools }
  })

  // 3) inventory route on the shared webserver (present in every web profile).
  //    Use ctx.get() so this stays optional — accessing ctx.webServer without
  //    declaring it in `inject` would throw "cannot get property without inject".
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
  }
}

/** Resolve the `standard` agent's standing scope key when a roster is present. */
async function resolveStandardScope(ctx) {
  try {
    const presets = ctx.get('agentPresets')
    if (presets && typeof presets.standingKeyFor === 'function') {
      return await presets.standingKeyFor('standard')
    }
  } catch { /* no roster — fall back to the global layer */ }
  return undefined
}

/** Enumerate the effective sections and tools with their blocked/hidden flags. */
async function buildInventory(ctx, cfg) {
  const denied = new Set(cfg.sections ?? [])
  const replace = cfg.replace ?? {}
  const injectList = cfg.inject ?? []
  const injectOrder = new Map(injectList.map((item) => [item.name, item.order]))
  const te = cfg.tools ?? {}
  const exclude = new Set(te.exclude ?? [])
  const include = Array.isArray(te.include) && te.include.length > 0 ? new Set(te.include) : null

  const scopeKey = await resolveStandardScope(ctx)

  // Resolve a section's text. Dynamic sections register a function; call it
  // with a best-effort context (same shape the assemble passes) so the
  // inventory can echo the real generated content for replacement. Fall back
  // to a marker if the function throws.
  const resolveText = (section) => {
    if (typeof section.text === 'function') {
      try { return String(section.text({ scope: scopeKey }) ?? '') }
      catch { return '<动态生成>' }
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
  try {
    const schemas = ctx.tools.schemas(scopeKey) ?? []
    tools = schemas
      .map((tool) => ({
        name: tool.name,
        description: typeof tool.description === 'string' ? tool.description : '',
        hidden: include ? !include.has(tool.name) : exclude.has(tool.name),
      }))
      .filter((tool) => tool.name && tool.name !== undefined)
      .sort((a, b) => a.name.localeCompare(b.name))
  } catch { /* tools registry unresolved — return empty list */ }

  return { sections, tools, config: cfg }
}

function writeJson(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}
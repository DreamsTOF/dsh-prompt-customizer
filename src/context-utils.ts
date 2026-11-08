/**
 * context-utils — 可选宿主服务的非严格读取。
 *
 * Cordis 的 `ctx.get(name)` 默认 strict：服务既未声明也未提供时直接抛错。
 * 本插件的大多数宿主面（configEditor / mcpManager / agents / agentPresets /
 * connection / loader）都是「有就用、没有就降级」，用 strict get 会让整个
 * 模块在裸组装（单测、headless、旧版宿主）里挂掉。
 *
 * `ctx.get(name)` 本身只按「服务是否 ACTIVE」过滤，不存在时返回 undefined
 * （不会因未 inject 而抛错）；宿主上下文之外（测试 stub）再按属性读取兜底。
 */

export function optionalService<T = any>(ctx: unknown, name: string): T | undefined {
  const anyCtx = ctx as {
    reflect?: { get?: (name: string, strict?: boolean) => unknown }
    get?: (name: string, strict?: boolean) => unknown
  } | null | undefined
  try {
    const value = anyCtx?.reflect?.get?.(name)
    if (value !== undefined) return value as T
  } catch {
    // reflect 不可用：继续尝试非严格 ctx.get。
  }
  try {
    const value = typeof anyCtx?.get === 'function' ? anyCtx.get(name) : undefined
    if (value !== undefined) return value as T
  } catch {
    // 未声明服务：按缺席处理。
  }
  try {
    return (anyCtx as Record<string, unknown> | undefined)?.[name] as T | undefined
  } catch {
    return undefined
  }
}

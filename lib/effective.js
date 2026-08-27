/**
 * 生效配置的纯函数：字段级 override 合并（方案 A）+ 阶段过滤（方案 C）。
 *
 * 合并语义：override 中非空的字段**整体接管**全局默认；空缺或空列表的
 * 字段回落全局。空列表视同未设置 —— 用户「清空」一个字段意味着「交还给
 * 全局」，这是刻意的（与 UI 的回退显示一致）。
 */

/** 非空数组才视为有效覆盖值。 */
function hasList(value) {
  return Array.isArray(value) && value.length > 0
}

/** 非空对象（至少一个键）才视为有效覆盖值。 */
function hasDict(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0
}

/** 工具配置整体是否携带至少一条有效过滤规则（含 bootstrap 目录）。 */
function hasTools(tools) {
  if (tools === null || typeof tools !== 'object') return false
  return hasList(tools.exclude) || hasList(tools.include) || hasTools(tools.bootstrap)
}

/**
 * 字段级合并出一份生效配置。四个字段独立判定：
 * sections / inject 看非空数组，replace 看非空对象，tools 看是否带规则。
 */
export function mergeConfig(globalCfg, ovr) {
  const g = globalCfg ?? {}
  return {
    sections: hasList(ovr?.sections) ? ovr.sections : (g.sections ?? []),
    replace: hasDict(ovr?.replace) ? ovr.replace : (g.replace ?? {}),
    inject: hasList(ovr?.inject) ? ovr.inject : (g.inject ?? []),
    tools: hasTools(ovr?.tools) ? ovr.tools : (g.tools ?? {}),
  }
}

/**
 * 按 phase 过滤注入段。`always` 恒定保留；`bootstrap` 只在未晋级时注入；
 * `active` 只在晋级后注入。未知 phase 按 `always` 处理（宽容输入）。
 */
export function filterInjectByPhase(injectList, promoted) {
  return (injectList ?? []).filter((item) => {
    const phase = item.phase === 'bootstrap' || item.phase === 'active' ? item.phase : 'always'
    return phase === 'always' || (promoted ? phase === 'active' : phase === 'bootstrap')
  })
}

/**
 * 选出当前阶段生效的工具过滤配置。
 * 未晋级且 bootstrap 目录带规则时以它整体替代静态过滤；否则用常规字段。
 */
export function pickToolsFilter(toolsCfg, promoted) {
  const bootstrap = toolsCfg?.bootstrap
  if (!promoted && hasTools(bootstrap)) {
    return { exclude: bootstrap.exclude ?? [], include: bootstrap.include ?? [] }
  }
  return { exclude: toolsCfg?.exclude ?? [], include: toolsCfg?.include ?? [] }
}

/** 与 include/exclude 同构的过滤逻辑（装配钩子与 inventory 共用）。 */
export function applyToolFilter(tools, { exclude, include }) {
  const includeSet = Array.isArray(include) && include.length > 0 ? new Set(include) : null
  const excludeSet = new Set(exclude ?? [])
  if (includeSet) return tools.filter((tool) => includeSet.has(tool.name))
  if (excludeSet.size > 0) return tools.filter((tool) => !excludeSet.has(tool.name))
  return tools
}

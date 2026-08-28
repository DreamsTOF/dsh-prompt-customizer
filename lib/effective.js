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

/** 工具配置整体是否携带至少一条有效过滤规则（含 bootstrap / compaction 目录）。 */
function hasTools(tools) {
  if (tools === null || typeof tools !== 'object') return false
  return hasList(tools.exclude) || hasList(tools.include) || hasTools(tools.bootstrap) || hasTools(tools.compaction)
}

/**
 * 字段级合并出一份生效配置。四个定制字段独立判定：
 * sections / inject / 每阶段段名单（sectionsBootstrap / sectionsCompaction）
 * 看非空数组，replace 看非空对象，tools 看是否带规则。
 */
export function mergeConfig(globalCfg, ovr) {
  const g = globalCfg ?? {}
  return {
    sections: hasList(ovr?.sections) ? ovr.sections : (g.sections ?? []),
    sectionsBootstrap: hasList(ovr?.sectionsBootstrap) ? ovr.sectionsBootstrap : (g.sectionsBootstrap ?? []),
    sectionsCompaction: hasList(ovr?.sectionsCompaction) ? ovr.sectionsCompaction : (g.sectionsCompaction ?? []),
    replace: hasDict(ovr?.replace) ? ovr.replace : (g.replace ?? {}),
    inject: hasList(ovr?.inject) ? ovr.inject : (g.inject ?? []),
    tools: hasTools(ovr?.tools) ? ovr.tools : (g.tools ?? {}),
  }
}

/**
 * 选出当前阶段生效的注入段：常驻期注入（`always`）始终注入；其余注入按
 * 阶段模式匹配 —— bootstrap（未晋级）→ `bootstrap`，active（已晋级）→
 * `active`，compact（压缩后仍未晋级）→ `compaction`。每个阶段的注入集
 * 互相独立（各自的 order 空间），用于「每阶段独立名单 + 虚拟 order」。
 * 传入 `status`（promotion.status() 结果 `{ promoted, boundary }`），
 * 不再沿用旧的布尔 promoted（旧的 compaction 窗口被硬塞进 bootstrap 期，
 * 无法独立排序）。
 */
export function filterInjectByPhase(injectList, status) {
  const mode = status.promoted ? 'active' : status.boundary >= 0 ? 'compaction' : 'bootstrap'
  return (injectList ?? []).filter((item) => {
    const phase = item.phase === 'bootstrap' || item.phase === 'active' || item.phase === 'compaction' ? item.phase : 'always'
    return phase === 'always' || phase === mode
  })
}

/**
 * 选出当前阶段生效的工具过滤配置（三态）：
 * - compaction 之后仍未晋级（boundary >= 0）且 compaction 目录带规则 → compaction 目录；
 * - 未晋级且 bootstrap 目录带规则 → bootstrap 目录；
 * - 否则（已晋级，或未晋级但目录皆空）→ 常规静态字段。
 * `status` 是 promotion.status() 的结果 `{ promoted, boundary }`。
 */
export function pickToolsFilter(toolsCfg, status) {
  const bootstrap = toolsCfg?.bootstrap
  const compaction = toolsCfg?.compaction
  if (!status.promoted && status.boundary >= 0 && hasTools(compaction)) {
    return { exclude: compaction.exclude ?? [], include: compaction.include ?? [] }
  }
  if (!status.promoted && hasTools(bootstrap)) {
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

/**
 * 每阶段独立段屏蔽（与工具目录三态对称）：压缩受控期在「压缩后仍未晋级」
 * 时生效且优先于引导期；引导期在未晋级时生效；否则回落常驻期（全局
 * `sections`，列表为空表示不启用阶段化）。返回该阶段额外屏蔽的段名。
 */
export function pickSectionsForStatus(config, status) {
  const compaction = config?.sectionsCompaction
  const bootstrap = config?.sectionsBootstrap
  if (!status.promoted && status.boundary >= 0 && Array.isArray(compaction) && compaction.length > 0) return compaction
  if (!status.promoted && Array.isArray(bootstrap) && bootstrap.length > 0) return bootstrap
  return []
}

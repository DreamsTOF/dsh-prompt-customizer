/**
 * 字段级 override 合并（方案 A）+ 阶段过滤（方案 C）。
 *
 * 合并语义：override 中**存在的字段整体接管**全局默认；空缺的字段回落
 * 全局。replace / inject / tools 沿用「非空才接管」（空对象 / 空列表视同
 * 未设置）；三份段屏蔽名单（sections / sectionsBootstrap / sectionsCompaction）
 * 例外 —— **空数组 = 显式接管为空**（用户在该预设下解除全部屏蔽，绝不能
 * 回落全局把屏蔽「复活」；客户端 editView 的 `??` 语义与此一致）。
 */

/** 非空数组才视为有效覆盖值（inject 用；屏蔽名单不适用，见上）。 */
function hasList(value) {
  return Array.isArray(value) && value.length > 0
}

/** 非空对象（至少一个键）才视为有效覆盖值。 */
function hasDict(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0
}

/** 工具配置整体是否携带至少一条有效规则（含 bootstrap / compaction 目录，
 *  exclude 或 add 任一非空即算）。 */
function hasTools(tools) {
  if (tools === null || typeof tools !== 'object') return false
  return hasList(tools.exclude) || hasList(tools.add) || hasTools(tools.bootstrap) || hasTools(tools.compaction)
}

/**
 * 字段级合并出一份生效配置。replace / inject / tools 看非空；三份段屏蔽
 * 名单看「字段是否存在」（空数组 = 显式接管为空，不回落全局）。
 */
export function mergeConfig(globalCfg, ovr) {
  const g = globalCfg ?? {}
  return {
    sections: Array.isArray(ovr?.sections) ? ovr.sections : (g.sections ?? []),
    sectionsBootstrap: Array.isArray(ovr?.sectionsBootstrap) ? ovr.sectionsBootstrap : (g.sectionsBootstrap ?? []),
    sectionsCompaction: Array.isArray(ovr?.sectionsCompaction) ? ovr.sectionsCompaction : (g.sectionsCompaction ?? []),
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
 * 选出当前阶段生效的工具过滤配置（三态）：三个阶段**各用自己那份名单，互不
 * 继承** —— 已晋级 → 静态 `exclude`，未晋级 → `bootstrap.exclude`，压缩后仍未
 * 晋级 → `compaction.exclude`；空名单就表示「该阶段什么都不隐藏」。
 *
 * 早期版本让阶段名单在为空时回落静态字段，看起来省了一份重复配置，实际是拿
 * 走了阶段独立性：界面按三个阶段分别勾选，而引导期的勾选状态既反映不了静态
 * 名单里已隐藏的工具（显示成"可见"、模型其实看不见），往引导期名单里加一项又
 * 会让整个静态名单在该阶段失效（其它工具的隐藏一起蒸发）。
 * `status` 是 promotion.status() 的结果 `{ promoted, boundary }`。
 */
export function pickToolsFilter(toolsCfg, status) {
  if (!status.promoted) {
    if (status.boundary >= 0) {
      return { exclude: toolsCfg?.compaction?.exclude ?? [], add: toolsCfg?.compaction?.add ?? [] }
    }
    return { exclude: toolsCfg?.bootstrap?.exclude ?? [], add: toolsCfg?.bootstrap?.add ?? [] }
  }
  return { exclude: toolsCfg?.exclude ?? [], add: toolsCfg?.add ?? [] }
}

/**
 * 黑名单过滤（装配钩子与 inventory 共用）：把 `exclude` 里的工具从目录里拿掉。
 *
 * 刻意不支持「白名单 / 封闭式允许清单」：include 一旦生效就让 exclude 完全失效，
 * 而且它会把目录冻结在点名的几个上 —— 别的插件以后新增的工具一律看不见。「只留
 * 这几个」用 exclude 反选即可，无需第二套语义。
 *
 * 「把被裁掉但注册表里仍有的工具加回该阶段」是另一条独立通道（`add` 名单），由
 * 装配钩子在过滤**之后**从注册表查回 schema 追加 —— 见 lib/index.js，不在这里。
 */
export function applyToolFilter(tools, { exclude }) {
  const excludeSet = new Set(exclude ?? [])
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

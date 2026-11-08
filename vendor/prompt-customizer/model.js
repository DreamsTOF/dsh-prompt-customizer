/**
 * 领域模型：阶段与条目身份的唯一来源。
 *
 * - 阶段是宿主协议常量（bootstrap / active / compaction）；本文件是唯一描述表，
 *   其它模块不得再手写三份 if/else 或第三份字段名。
 * - 条目身份 = name + source。source 是注册层（global/preset/agent/executor/workspace）
 *   加可选 provider id；旧数据里的纯字符串按“来源未知”处理，仅用于读取兜底，不再写入。
 */

export const PHASES = [
  { key: 'bootstrap', sectionField: 'sectionsBootstrap', contextField: 'contextsBootstrap', toolField: 'bootstrap', status: { promoted: false, boundary: -1 } },
  { key: 'active', sectionField: 'sections', contextField: 'contexts', toolField: undefined, status: { promoted: true, boundary: -1 } },
  { key: 'compaction', sectionField: 'sectionsCompaction', contextField: 'contextsCompaction', toolField: 'compaction', status: { promoted: false, boundary: 1 } },
]

export const PHASE_KEYS = PHASES.map((phase) => phase.key)

export function phaseOfStatus(status) {
  const promoted = status?.promoted === true
  const boundary = typeof status?.boundary === 'number' ? status.boundary : -1
  if (promoted) return 'active'
  return boundary >= 0 ? 'compaction' : 'bootstrap'
}

export function statusOfPhase(key) {
  const phase = PHASES.find((item) => item.key === key)
  return phase === undefined ? undefined : { ...phase.status }
}

export function phaseOf(key) {
  return PHASES.find((item) => item.key === key)
}

/** source 允许字符串（provider id）或结构化对象；统一成对象。 */
export function normalizeSource(source) {
  if (source === undefined || source === null) return undefined
  if (typeof source === 'string') return { kind: 'provider', id: source }
  if (typeof source === 'object' && typeof source.kind === 'string') {
    return typeof source.id === 'string' && source.id !== '' ? { kind: source.kind, id: source.id } : { kind: source.kind }
  }
  return undefined
}

export function sourceKey(source) {
  const normalized = normalizeSource(source)
  return normalized === undefined ? '' : `${normalized.kind}:${normalized.id ?? ''}`
}

/**
 * 归一化一条名单条目。字符串 = 旧 name-only（source 为空，只做读取兜底）。
 * @returns {{name: string, source?: {kind: string, id?: string}}}
 */
export function normalizeEntry(value) {
  if (typeof value === 'string') return { name: value }
  if (value && typeof value === 'object' && typeof value.name === 'string') {
    const source = normalizeSource(value.source)
    return source === undefined ? { name: value.name } : { name: value.name, source }
  }
  return undefined
}

export function entryKey(entry) {
  const value = normalizeEntry(entry)
  return value === undefined ? '' : `${value.name}\u0000${sourceKey(value.source)}`
}

/** 名单条目是否命中一个已带 source 的候选项；name-only 旧条目匹配同名的任意来源。 */
export function entryMatches(entry, candidate) {
  const wanted = normalizeEntry(entry)
  if (wanted === undefined) return false
  if (wanted.name !== String(candidate?.name ?? '')) return false
  if (wanted.source === undefined) return true
  // 预设配置不能绑定某个 agent 的 session id：同一预设在下一个会话里
  // agent 作用域工具会有新的 id，必须按 source.kind 匹配 agent 来源。
  if (wanted.source.kind === 'agent' && candidate?.source?.kind === 'agent') return true
  return sourceKey(wanted.source) === sourceKey(candidate?.source)
}

/** 按 name+source 去重并保持插入顺序。 */
export function uniqueEntries(entries) {
  const seen = new Set()
  const out = []
  for (const entry of entries) {
    const normalized = normalizeEntry(entry)
    if (normalized === undefined) continue
    const key = entryKey(normalized)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(normalized)
  }
  return out
}

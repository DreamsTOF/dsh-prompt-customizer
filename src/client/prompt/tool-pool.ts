import { entryKey, normalizeEntry, type EntryRef, type ToolLayer, type ToolState } from './types.ts'

export type ToolPoolLike = EntryRef & {
  description?: string
  state?: ToolState
  scope?: 'agent' | 'executor'
  /** 注册层（global / preset / agent / executor）：只读池行右侧的层徽标。 */
  layer?: ToolLayer
  /** PTC 折叠标记（executor.describe 只交出 run_code 时为 true）。 */
  ptcCollapsed?: true
  maskedByPlugin?: boolean
  maskedByOwnPlugin?: boolean
  maskedByShadow?: boolean
  maskedByPtc?: boolean
}

export type MaskedPoolRow = {
  entry: EntryRef
  description: string
  states: Set<ToolState>
  /** true = 可反选（本插件遮蔽 masked-own，可在 MCP Tab 恢复）；false = 外部决定、只读。 */
  reversible: boolean
  /** 注册层（行右侧的层徽标）。 */
  layer?: ToolLayer
}

export function toolStateOf(tool: ToolPoolLike): ToolState {
  return tool.state
    ?? (tool.scope === 'agent' ? 'locked-agent'
      : tool.scope === 'executor' ? 'locked-executor'
        : tool.maskedByOwnPlugin === true ? 'masked-own'
          : tool.maskedByShadow === true ? 'masked-shadow'
            // PTC 折叠：模型只收到 run_code，其余工具在程序绑定内可用（外部决定，不可反选）。
            : tool.maskedByPtc === true ? 'masked-ptc'
              : tool.maskedByPlugin === true ? 'masked-plugin'
                : 'controllable')
}

/** 只读池：可反选组 = 本插件遮蔽（masked-own）；不可反选组 = 外部不可见
 *  （masked-plugin）/ 同名被覆盖（masked-shadow）/ PTC 折叠（masked-ptc）。
 *  agent 作用域注册（locked-agent）不在这里：它可勾选，归主列表。 */
export function buildMaskedPool(tools: readonly ToolPoolLike[]): MaskedPoolRow[] {
  const map = new Map<string, MaskedPoolRow>()
  for (const tool of tools) {
    if (tool.name === '') continue
    const state = toolStateOf(tool)
    if (state !== 'masked-own' && state !== 'masked-plugin'
      && state !== 'masked-shadow' && state !== 'masked-ptc') continue
    const entry = normalizeEntry(tool)
    if (entry === undefined) continue
    const identity = entryKey(entry)
    const existing = map.get(identity)
    if (existing === undefined) {
      map.set(identity, {
        entry,
        description: tool.description ?? '',
        states: new Set([state]),
        reversible: state === 'masked-own',
        ...(tool.layer === undefined ? {} : { layer: tool.layer }),
      })
    } else {
      existing.states.add(state)
      // 同一 name+source 只要有一条是本插件遮蔽，就归可反选组（能在 MCP Tab 恢复）。
      if (state === 'masked-own') existing.reversible = true
      if (existing.layer === undefined && tool.layer !== undefined) existing.layer = tool.layer
      if (existing.description === '' && (tool.description ?? '') !== '') existing.description = tool.description ?? ''
    }
  }
  return [...map.values()].sort((left, right) => left.entry.name.localeCompare(right.entry.name))
}

/** 按「可反选 / 不可反选」两组切分只读池（UI 用两个 <details> 分组渲染）。 */
export function buildMaskedPoolGrouped(tools: readonly ToolPoolLike[]): {
  reversible: MaskedPoolRow[]
  irreversible: MaskedPoolRow[]
} {
  const reversible: MaskedPoolRow[] = []
  const irreversible: MaskedPoolRow[] = []
  for (const row of buildMaskedPool(tools)) (row.reversible ? reversible : irreversible).push(row)
  return { reversible, irreversible }
}

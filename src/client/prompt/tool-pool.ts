import { entryKey, normalizeEntry, type EntryRef, type ToolState } from './types.ts'

export type ToolPoolLike = EntryRef & {
  description?: string
  state?: ToolState
  scope?: 'agent' | 'executor'
  maskedByPlugin?: boolean
  maskedByOwnPlugin?: boolean
  maskedByShadow?: boolean
}

export type MaskedPoolRow = {
  entry: EntryRef
  description: string
  states: Set<ToolState>
}

export function toolStateOf(tool: ToolPoolLike): ToolState {
  return tool.state
    ?? (tool.scope === 'agent' ? 'locked-agent'
      : tool.scope === 'executor' ? 'locked-executor'
        : tool.maskedByOwnPlugin === true ? 'masked-own'
          : tool.maskedByShadow === true ? 'masked-shadow'
            : tool.maskedByPlugin === true ? 'masked-plugin'
              : 'controllable')
}

/** 只读「完整目录 / 已遮蔽」池：保留 masked 行（含同名遮蔽）与 agent 作用域注册行；
 *  同名 base 行不能把它过滤掉。agent 作用域注册的模型可见、但本插件无法用 restrict
 *  反开，按「会话级」如实列出（不伪称遮蔽）。 */
export function buildMaskedPool(tools: readonly ToolPoolLike[]): MaskedPoolRow[] {
  const map = new Map<string, MaskedPoolRow>()
  for (const tool of tools) {
    if (tool.name === '') continue
    const state = toolStateOf(tool)
    if (state !== 'masked-plugin' && state !== 'masked-own' && state !== 'masked-shadow'
      && state !== 'locked-agent') continue
    const entry = normalizeEntry(tool)
    if (entry === undefined) continue
    const identity = entryKey(entry)
    const existing = map.get(identity)
    if (existing === undefined) {
      map.set(identity, { entry, description: tool.description ?? '', states: new Set([state]) })
    } else {
      existing.states.add(state)
      if (existing.description === '' && (tool.description ?? '') !== '') existing.description = tool.description ?? ''
    }
  }
  return [...map.values()].sort((left, right) => left.entry.name.localeCompare(right.entry.name))
}

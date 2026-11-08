import { entryKey, normalizeEntry, type EntryRef, type ToolState } from './types.ts'

export type ToolPoolLike = EntryRef & {
  description?: string
  state?: ToolState
  scope?: 'agent' | 'executor'
  maskedByPlugin?: boolean
  maskedByOwnPlugin?: boolean
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
          : tool.maskedByPlugin === true ? 'masked-plugin'
            : 'controllable')
}

/** 只读「已遮蔽」池：保留 masked 行；同名 base 行不能把它过滤掉。 */
export function buildMaskedPool(tools: readonly ToolPoolLike[]): MaskedPoolRow[] {
  const map = new Map<string, MaskedPoolRow>()
  for (const tool of tools) {
    if (tool.name === '') continue
    const state = toolStateOf(tool)
    if (state !== 'masked-plugin' && state !== 'masked-own') continue
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

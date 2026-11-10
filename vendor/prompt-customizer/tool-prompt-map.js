/**
 * DSH 工具与 systemPrompt.section 提示词段的对应关系。
 *
 * 这是 UI / inventory 的展示元数据，不参与运行时过滤：
 *  - `tool:<name>` 直接对应同名工具；
 *  - 官方工具包中一个 section 服务多个工具的组（jobs / pty / goal / schedule /
 *    subagent），在这里显式列出，避免把 section 名误当成工具名；
 *  - 未知的 `tool:<name>` 仍回退到同名工具，第三方插件可沿用该命名约定。
 */

export const TOOL_PROMPT_GROUPS = Object.freeze([
  { section: 'tool:jobs', tools: ['job_kill', 'job_list', 'job_output'] },
  {
    section: 'tool:pty',
    tools: ['terminal_close', 'terminal_list', 'terminal_open', 'terminal_read', 'terminal_send', 'terminal_signal'],
  },
  { section: 'tool:goal', tools: ['create_goal', 'get_goal', 'update_goal'] },
  { section: 'tool:schedule', tools: ['schedule_create', 'schedule_edit', 'schedule_list', 'schedule_view'] },
  // `tool:subagent` 是共享段；`tool:subagent_fork` 也会注册，但通常为空。
  { section: 'tool:subagent', tools: ['subagent', 'subagent_fork'] },
])

const SECTION_BY_TOOL = new Map()
for (const group of TOOL_PROMPT_GROUPS) {
  for (const tool of group.tools) SECTION_BY_TOOL.set(tool, group.section)
}

/** 一个工具可能对应的 section（组段在前，精确同名段在后）。 */
export function promptSectionNamesForTool(toolName) {
  const name = typeof toolName === 'string' ? toolName : ''
  if (name === '') return []
  const names = []
  const group = SECTION_BY_TOOL.get(name)
  if (group !== undefined) names.push(group)
  const exact = `tool:${name}`
  if (!names.includes(exact)) names.push(exact)
  return names
}

/** 一个 `tool:*` section 覆盖的工具；非工具段返回空数组。 */
export function toolsForPromptSection(sectionName) {
  const name = typeof sectionName === 'string' ? sectionName : ''
  if (!name.startsWith('tool:')) return []
  const group = TOOL_PROMPT_GROUPS.find((item) => item.section === name)
  if (group !== undefined) return [...group.tools]
  return [name.slice('tool:'.length)]
}

/** 是否是工具提示词段（仅名字前缀判断，不依赖映射表）。 */
export function isToolPromptSection(sectionName) {
  return typeof sectionName === 'string' && sectionName.startsWith('tool:')
}

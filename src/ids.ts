/**
 * ids — 三类标识符的唯一校验来源。
 *
 * 内核契约（0.2.2）：
 *  - agent preset 的 `config.id` 只声明 `z.string().required()`，没有字符形状
 *    限制 —— 面板再按目录名规则（`[a-z0-9-]`）过滤，会把合法的自定义预设
 *    当成非法，读写全部 400。
 *  - 技能名由内核 `SKILL_NAME` 约束为 kebab-case；
 *  - MCP serverName 由 mcp-client 约束为 `[A-Za-z0-9_-]{1,32}`。
 *
 * 三处都只保留一份正则，避免 host 模块各自维护后漂移。
 */

/** agent preset id：任意非空字符串（内核只要求 string）。 */
export function isPresetId(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== ''
}

/** 技能名：与内核 `SKILL_NAME` 完全一致。 */
export function isSkillName(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
}

/** MCP serverName：与 mcp-client `SERVER_NAME_PATTERN` 完全一致。 */
export function isServerName(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,32}$/.test(value)
}

/** sectionOps.mjs 的类型声明（仅供电类型检查；运行时代码在 .mjs 中）。 */

/** 名义阶段键：引导期 / 常驻期 / 压缩受控期（恒定全部显示）。 */
export type PhaseKey = 'bootstrap' | 'active' | 'compaction'

export function sectionListOf(key: PhaseKey): 'global' | 'bootstrap' | 'compaction'
export function injectPhaseOf(key: PhaseKey): 'bootstrap' | 'active' | 'compaction'
export function acceptsInjectFor(key: PhaseKey, phase: string): boolean
export function deniedNames(cfg: unknown, key: PhaseKey): string[]
/** 本部分当前的注入身份：phase 注入阶段、names 可见段名、custom 自定义段名、
 *  text 本阶段生效的用户文本（自定义段文本 + 系统段在本阶段的替换文本）、
 *  order 本阶段草稿序（都是 name → 值 的映射 / 集合）。 */
export function injectedAt(cfg: unknown, key: PhaseKey): {
  phase: 'bootstrap' | 'active' | 'compaction'
  names: Set<string>
  custom: Set<string>
  text: Map<string, string>
  order: Map<string, number>
}
export function blockPatch(cfg: unknown, key: PhaseKey, name: string, blocked: boolean): Record<string, unknown>
export function reorderInsert<T extends object>(
  rows: T[],
  dragName: string,
  targetName: string,
  pos: 'above' | 'below',
  newRow?: T | null,
): T[] | null
export function phaseInjectEntries<T extends object>(
  cfg: unknown,
  key: PhaseKey,
  rows: T[],
): Array<Record<string, unknown>>

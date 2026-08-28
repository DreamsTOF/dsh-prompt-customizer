/** sectionOps.mjs 的类型声明（仅供电类型检查；运行时代码在 .mjs 中）。 */

export interface CycleEntryLike {
  key: string
  merged: string[]
}

export function sectionListOf(entry: CycleEntryLike): 'global' | 'bootstrap' | 'compaction'
export function injectPhaseOf(entry: CycleEntryLike): 'always' | 'bootstrap' | 'active' | 'compaction'
export function acceptsInjectFor(entry: CycleEntryLike, phase: string): boolean
export function deniedNames(cfg: unknown, entry: CycleEntryLike): string[]
export function blockPatch(cfg: unknown, entry: CycleEntryLike, name: string, blocked: boolean): Record<string, unknown>
export function reorderInsert<T extends object>(
  rows: T[],
  dragName: string,
  targetName: string,
  pos: 'above' | 'below',
  newRow?: T | null,
): T[] | null
export function phaseInjectEntries<T extends object>(
  cfg: unknown,
  entry: CycleEntryLike,
  rows: T[],
): Array<Record<string, unknown>>
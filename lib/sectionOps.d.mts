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
/** 三态同步持久化：rowsByKey 给出三个阶段各自的有序行集合，生成完整 inject
 *  列表（always 条目原样保留，三阶段各自连续虚拟 order）。 */
export function mergedPhaseInjectEntries<T extends object>(
  cfg: unknown,
  rowsByKey: Record<PhaseKey, T[]>,
): Array<Record<string, unknown>>
/** 提示词 Tab 一个阶段部分的行（含屏蔽行与注入行）。 */
export interface PhaseRow {
  name: string
  text: string
  replaced: boolean
  custom: boolean
  override: string
  blocked: boolean
}
/** 一个阶段部分的全部行（post ∪ 被屏蔽 ∪ 本阶段注入条目，草稿序叠加）。
 *  `view` = 三阶段预览装配里对应阶段的视图（可为 null = 视为空）。 */
export function phaseRows(cfg: unknown, view: unknown, key: PhaseKey): PhaseRow[]
/** 「应用中文」（开关开启）一次性覆盖：三阶段行里名字命中 zhMap 的非自定义
 *  行覆盖为中文译本，生成完整 inject 列表；未命中保持原样。zhMap 条目为字符
 *  串或函数（入参该行原文，返回空值 = 放弃替换）。 */
export function zhMergedInjectEntries(
  cfg: unknown,
  views: unknown,
  zhMap: Record<string, string | ((original: string) => string | null | undefined)>,
): Array<Record<string, unknown>>
/** 「回归英文」（开关关闭）：命中译本的非自定义行清空替换文本（服务端回落
 *  注册表英文原文），生成完整 inject 列表；自定义段不碰。 */
export function zhRevertInjectEntries(
  cfg: unknown,
  views: unknown,
  zhMap: Record<string, string | ((original: string) => string | null | undefined)>,
): Array<Record<string, unknown>>
/** 开关状态探测：任一注入条目文本等于字符串译本即视为已应用。 */
export function zhApplied(cfg: unknown, zhMap: Record<string, string | ((original: string) => string | null | undefined)>): boolean

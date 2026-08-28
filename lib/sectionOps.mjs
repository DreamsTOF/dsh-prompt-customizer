/**
 * 提示词段面板的纯状态逻辑（无 React / 无 IO）。
 * 与 src/client/SectionsTab.tsx 共享同一份实现（浏览器里随 client bundle
 * 打包；node --test 直接 import 本文件跑单测），保证「测试即上线代码」。
 *
 * 阶段模型：引导期（bootstrap）/ 常驻期（active）/ 压缩受控期（compaction）
 * 各自拥有独立的注入名单与 order 空间；屏蔽按「每阶段独立名单」写回
 * （引导期 → sectionsBootstrap，压缩受控期 → sectionsCompaction，
 * 常驻期与同形折叠组 → 全局 sections）。
 */

/** 阶段部分 → 屏蔽名单写回目标。 */
export function sectionListOf(entry) {
  return entry.merged.length > 1 ? 'global' : entry.key === 'bootstrap' ? 'bootstrap' : entry.key === 'compaction' ? 'compaction' : 'global'
}

/** 阶段部分 → 注入阶段：压缩受控期是独立注入阶段（compaction）。 */
export function injectPhaseOf(entry) {
  return entry.merged.length > 1 ? 'always' : entry.key === 'bootstrap' ? 'bootstrap' : entry.key === 'active' ? 'active' : 'compaction'
}

/** 某注入段出现在哪些阶段部分：always 全阶段；bootstrap 引导+压缩；
 *  compaction 仅压缩受控期；active 仅常驻期。未知阶段按 always。 */
export function acceptsInjectFor(entry, phase) {
  if (phase === 'always') return true
  if (phase === 'bootstrap') return entry.key !== 'active'
  if (phase === 'compaction') return entry.key === 'compaction'
  return entry.key === 'active'
}

/** 该阶段生效的屏蔽名单（全局 + 阶段独立 的 union）。 */
export function deniedNames(cfg, entry) {
  const list = sectionListOf(entry)
  const phase = list === 'bootstrap' ? (cfg.sectionsBootstrap ?? []) : list === 'compaction' ? (cfg.sectionsCompaction ?? []) : []
  return [...(cfg.sections ?? []), ...phase]
}

/**
 * 屏蔽/恢复一个段（当前阶段语义）：返回需要写盘的字段补丁。
 * - 屏蔽：该阶段名单加入（list 为 global 时直接加入全局 sections）。
 * - 恢复：从该阶段名单与全局名单同时移除（union 语义 —— 否则仍会被另一
 *   份名单挡住，恢复不生效）。
 */
export function blockPatch(cfg, entry, name, blocked) {
  const list = sectionListOf(entry)
  const g = (cfg.sections ?? []).slice()
  const gi = g.indexOf(name)
  const patch = {}
  if (list === 'global') {
    if (blocked) { if (gi < 0) g.push(name) } else if (gi >= 0) g.splice(gi, 1)
    patch.sections = g
    return patch
  }
  const field = list === 'bootstrap' ? 'sectionsBootstrap' : 'sectionsCompaction'
  const phase = (cfg[field] ?? []).slice()
  const pi = phase.indexOf(name)
  if (blocked) { if (pi < 0) phase.push(name) } else if (pi >= 0) phase.splice(pi, 1)
  patch[field] = phase
  if (!blocked && gi >= 0) {
    g.splice(gi, 1)
    patch.sections = g
  }
  return patch
}

/**
 * 重排/插入一个阶段的有序行列表：把 dragName 从列表中移除后，插入到
 * targetName 行之上（pos='above'）或之下（pos='below'）；返回新列表。
 * 拖入的新段由调用方以 newRow 提供，插入后保留在列表中（其余行保持原样）。
 */
export function reorderInsert(rows, dragName, targetName, pos, newRow = null) {
  const base = rows.filter((row) => row.name !== dragName)
  const idx = base.findIndex((row) => row.name === targetName)
  if (idx < 0) return null
  const insertAt = Math.max(0, Math.min(pos === 'above' ? idx : idx + 1, base.length))
  const entry = newRow ?? rows.find((row) => row.name === dragName)
  if (!entry) return null
  base.splice(insertAt, 0, entry)
  return base
}

/**
 * 持久化一个阶段的有序列表（v1 persistOrder 的逐阶段版）：把 rows（有序行）
 * 写成该阶段的注入条目，order = 连续整数（0,1,2,…）——「虚拟 order 决定注入
 * 顺序」；系统行写空文本（= 仅 order 覆盖，服务端保留原文），custom 行保留
 * 自己的文本。其它阶段（含 always）的注入条目原样保留。
 */
export function phaseInjectEntries(cfg, entry, rows) {
  const phase = injectPhaseOf(entry)
  const others = (cfg.inject ?? []).filter((item) => (item.phase ?? 'always') !== phase)
  const entries = rows.map((row, i) => ({
    name: row.name,
    order: i,
    text: row.custom ? (row.text ?? '') : '',
    phase,
    custom: row.custom,
  }))
  return [...others, ...entries]
}
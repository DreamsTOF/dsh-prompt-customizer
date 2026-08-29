/**
 * 提示词段面板的纯状态逻辑（无 React / 无 IO）。
 * 与 src/client/SectionsTab.tsx 共享同一份实现（浏览器里随 client bundle
 * 打包；node --test 直接 import 本文件跑单测），保证「测试即上线代码」。
 *
 * 阶段模型：引导期（bootstrap）/ 常驻期（active）/ 压缩受控期（compaction）
 * 恒定全部显示（预设没有某个阶段时该部分就是空的），各自拥有独立的注入
 * 名单与 order 空间；屏蔽按「每阶段独立名单」写回（引导期 →
 * sectionsBootstrap，压缩受控期 → sectionsCompaction，常驻期 → 全局 sections）。
 * 入参统一是名义阶段键，不再有「同形折叠组」这种把引导期当常驻期用的形态。
 */

/** 名义阶段键 → 屏蔽名单写回目标（常驻期用全局 sections）。 */
export function sectionListOf(key) {
  return key === 'bootstrap' ? 'bootstrap' : key === 'compaction' ? 'compaction' : 'global'
}

/** 名义阶段键 → 注入阶段：压缩受控期是独立注入阶段（compaction）。 */
export function injectPhaseOf(key) {
  return key === 'bootstrap' ? 'bootstrap' : key === 'active' ? 'active' : 'compaction'
}

/** 某注入段出现在哪些阶段部分：always 全阶段；bootstrap/compaction/active
 *  仅各自对应的阶段（与服务端 filterInjectByPhase 的三态互相独立一致）。 */
export function acceptsInjectFor(key, phase) {
  if (phase === 'always') return true
  return phase === key
}

/** 该阶段生效的屏蔽名单（全局 + 阶段独立 的 union）。 */
export function deniedNames(cfg, key) {
  const list = sectionListOf(key)
  const phase = list === 'bootstrap' ? (cfg.sectionsBootstrap ?? []) : list === 'compaction' ? (cfg.sectionsCompaction ?? []) : []
  return [...(cfg.sections ?? []), ...phase]
}

/**
 * 某个阶段部分当前的注入身份（含未保存草稿）。
 *
 * `names` = 本部分可见的注入段名（本阶段专属 + 跨阶段的 always）。post 视图来自
 * 「上次保存」的服务端结果，删除只改草稿，所以 post 独有段必须有 names 背书才
 * 能显示 —— 否则刚删掉的自定义段会以「系统段」复活（身份只认 custom 标记，条目
 * 没了就被判成系统），再经一次重排就被写成 custom:false 空文本，用户填的内容被
 * 抹平。`custom` 只收真正的自定义段，`order` 只收本阶段的草稿序。
 *
 * `text` = 本阶段生效的用户文本：自定义段自带的文本，以及**系统段在本阶段被
 * 替换后的文本**（非空即替换）。系统段的文本必须按阶段存 —— 注入条目本来就带
 * `phase`，服务端按阶段筛选，所以三个阶段各改各的文本互不影响；旧的全局
 * `replace` 字典一份文本对三个阶段同时生效，已不承担界面编辑。
 */
export function injectedAt(cfg, key) {
  const phase = injectPhaseOf(key)
  const names = new Set()
  const custom = new Set()
  const text = new Map()
  const order = new Map()
  for (const item of cfg.inject ?? []) {
    if (item === null || typeof item !== 'object' || typeof item.name !== 'string') continue
    const itemPhase = item.phase ?? 'always'
    if (itemPhase === phase) order.set(item.name, item.order ?? 0)
    if (!acceptsInjectFor(key, itemPhase)) continue
    names.add(item.name)
    if (item.text && !text.has(item.name)) text.set(item.name, item.text)
    if (item.custom === true) custom.add(item.name)
  }
  return { phase, names, custom, text, order }
}

/**
 * 屏蔽/恢复一个段（当前阶段语义）：返回需要写盘的字段补丁。
 * - 屏蔽：该阶段名单加入（常驻期直接加入全局 sections）。
 * - 恢复：从该阶段名单与全局名单同时移除（union 语义 —— 否则仍会被另一
 *   份名单挡住，恢复不生效）。
 * 名单无变化时不产出字段（空补丁 = 不写盘），避免把继承值冻结成无意义的
 * 空数组覆盖。
 */
export function blockPatch(cfg, key, name, blocked) {
  const list = sectionListOf(key)
  const g = (cfg.sections ?? []).slice()
  const gi = g.indexOf(name)
  const patch = {}
  if (list === 'global') {
    if (blocked) { if (gi < 0) { g.push(name); patch.sections = g } }
    else if (gi >= 0) { g.splice(gi, 1); patch.sections = g }
    return patch
  }
  const field = list === 'bootstrap' ? 'sectionsBootstrap' : 'sectionsCompaction'
  const phase = (cfg[field] ?? []).slice()
  const pi = phase.indexOf(name)
  if (blocked) {
    if (pi < 0) { phase.push(name); patch[field] = phase }
  } else {
    if (pi >= 0) { phase.splice(pi, 1); patch[field] = phase }
    if (gi >= 0) { g.splice(gi, 1); patch.sections = g }
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
 * 顺序」；文本优先级 = 本阶段的用户替换文本（row.override）→ 自定义段自带的
 * 文本（row.text）→ 空文本（= 仅 order 覆盖，服务端保留原文）。三者缺一不可：
 * 重排走的就是这个函数，漏掉 override 会让一次拖动把用户在该阶段改的文本抹平。
 * 其它阶段（含 always）的注入条目原样保留。
 */
export function phaseInjectEntries(cfg, key, rows) {
  const phase = injectPhaseOf(key)
  const others = (cfg.inject ?? []).filter((item) => (item.phase ?? 'always') !== phase)
  const entries = rows.map((row, i) => ({
    name: row.name,
    order: i,
    text: row.override || (row.custom ? (row.text ?? '') : ''),
    phase,
    custom: row.custom,
  }))
  return [...others, ...entries]
}
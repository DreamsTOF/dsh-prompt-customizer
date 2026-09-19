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

/** 该阶段自己的屏蔽名单（三态互相独立：引导期 sectionsBootstrap /
 *  压缩受控期 sectionsCompaction / 常驻期 sections，互不继承、互不影响）。 */
export function deniedNames(cfg, key) {
  const list = sectionListOf(key)
  return list === 'bootstrap' ? (cfg.sectionsBootstrap ?? [])
    : list === 'compaction' ? (cfg.sectionsCompaction ?? [])
    : (cfg.sections ?? [])
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
 * 三态名单互相独立：只读写本阶段自己的名单（引导期 → sectionsBootstrap，
 * 压缩受控期 → sectionsCompaction，常驻期 → sections），屏蔽 / 恢复都绝不
 * 波及其它阶段的名单 —— 一个阶段的屏蔽不再连带屏蔽另一个阶段。
 * 名单无变化时不产出字段（空补丁 = 不写盘），避免把继承值冻结成无意义的
 * 空数组覆盖。
 */
export function blockPatch(cfg, key, name, blocked) {
  const list = sectionListOf(key)
  const field = list === 'bootstrap' ? 'sectionsBootstrap' : list === 'compaction' ? 'sectionsCompaction' : 'sections'
  const cur = (cfg[field] ?? []).slice()
  const i = cur.indexOf(name)
  if (blocked) {
    if (i >= 0) return {}
    cur.push(name)
  } else {
    if (i < 0) return {}
    cur.splice(i, 1)
  }
  return { [field]: cur }
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

/**
 * 三态同步持久化：rowsByKey 给出三个阶段各自的有序行集合（bootstrap /
 * active / compaction），生成完整 inject 列表 —— always 条目原样保留，三个
 * 阶段各自写成连续虚拟 order 的注入条目（条目形状与 phaseInjectEntries 完全
 * 一致）。用于「三态同步」的一次写入：edit 对 inject 是整体替换，逐阶段各写
 * 一次会互相覆盖只留下最后一次。
 */
export function mergedPhaseInjectEntries(cfg, rowsByKey) {
  const always = (cfg.inject ?? []).filter((item) => (item.phase ?? 'always') === 'always')
  const entries = ['bootstrap', 'active', 'compaction'].flatMap((key) => {
    const phase = injectPhaseOf(key)
    return (rowsByKey[key] ?? []).map((row, i) => ({
      name: row.name,
      order: i,
      text: row.override || (row.custom ? (row.text ?? '') : ''),
      phase,
      custom: row.custom,
    }))
  })
  return [...always, ...entries]
}

/**
 * 一个阶段部分的全部行（提示词 Tab 每行）：行集合 = 「真实进入该阶段装配的段」
 *（post 视图，与预览一致 —— 预设原生阶段插件裁剪掉的段不显示）∪「被屏蔽的段」
 *（屏蔽名单含未保存草稿，随时可反选）∪「配置里属于该阶段的自定义注入段」。
 * 顺序以 base（预过滤）视图的骨架为底，再叠加「该阶段的注入 order」草稿序
 * —— 未保存的重排立即反映到界面。文本 post 优先（替换 / 注入结果），回退
 * base 原文与注入文本。身份只认注入条目的 custom 隐藏标记，绝不互相转换。
 * `view` = 三阶段预览装配里的对应阶段（可为 null = 视为空）。从 SectionsTab
 * 的 rowsOf 原样迁出 —— 纯函数，UI 与 node --test 单测共用同一份实现。
 */
export function phaseRows(cfg, view, key) {
  const replace = cfg.replace ?? {}
  const denied = new Set(deniedNames(cfg, key))
  const postByName = new Map((view?.sections ?? []).map((sec) => [sec.name, sec]))
  const baseByName = new Map((view?.baseSections ?? []).map((sec) => [sec.name, sec]))
  const { phase, names: injectedHere, custom: customNames, text, order: phaseOrder } = injectedAt(cfg, key)
  const names = []
  const seen = new Set()
  const push = (name) => { if (!seen.has(name)) { seen.add(name); names.push(name) } }
  // base 骨架顺序里取 post 段与被屏蔽段（保持自然位置）。被屏蔽取并集：
  // 当前草稿名单（切换立即反馈）∪ 上次保存的名单（base 的 blocked 标记 ——
  // 刚解除屏蔽的行不会立即消失，仍可再勾回去）。
  for (const sec of view?.baseSections ?? []) {
    if (postByName.has(sec.name) || denied.has(sec.name) || sec.blocked === true) push(sec.name)
  }
  // post 独有段 = 本插件注入进去的段（post 恒为 base 减去屏蔽再加上注入），
  // 追加在尾部。但它来自「上次保存」的服务端结果，删除只改草稿，所以必须
  // 有当前 inject 条目背书 —— 否则刚删掉的自定义段会以「系统段」复活（身份
  // 只认 inject 的 custom 标记，条目没了就被判成系统），再经一次重排就被写成
  // custom:false 空文本，用户填的内容被抹平。
  for (const name of postByName.keys()) {
    if (baseByName.has(name) || injectedHere.has(name)) push(name)
  }
  // 精确属于该阶段的注入条目：自定义段始终显示；系统段在装配输入里见过
  //（base/post）**或**带着用户为该阶段填的文本（= 从全部池显式加进来的）才
  // 显示 —— 既让拖入立即出现，又不让历史遗留的陈旧条目把装配里根本没有的段带回来。
  for (const item of cfg.inject ?? []) {
    if (item === null || typeof item !== 'object' || typeof item.name !== 'string') continue
    if ((item.phase ?? 'always') !== phase) continue
    if (item.custom === true || text.get(item.name) || baseByName.has(item.name) || postByName.has(item.name)) push(item.name)
  }
  // 跨阶段生效的自定义段（如 always）。
  for (const name of customNames) push(name)
  const rows = names.map((name) => {
    // 本阶段的用户替换文本：只认属于本阶段的注入条目（injectedAt 已按阶段筛）。
    const override = text.get(name) ?? ''
    return {
      name,
      text: postByName.get(name)?.text ?? baseByName.get(name)?.text ?? '',
      replaced: override !== '' || Object.hasOwn(replace, name),
      custom: customNames.has(name),
      override,
      blocked: denied.has(name),
    }
  })
  // 草稿序叠加：该阶段有注入 order 就按它重排当前行（未保存的拖动/箭头
  // 立即生效）；无 order 的行走 base 骨架相对序（稳定排序）。
  if (phaseOrder.size > 0) {
    const fallback = new Map(rows.map((row, i) => [row.name, i]))
    rows.sort((a, b) => (phaseOrder.get(a.name) ?? fallback.get(a.name) ?? 0) - (phaseOrder.get(b.name) ?? fallback.get(b.name) ?? 0))
  }
  return rows
}

/**
 * 「应用中文」（开关开启方向，等效手动编辑）：把三个阶段各自的行里名字命中
 * zhMap 的**非自定义**行打上中文文本补丁，再经 mergedPhaseInjectEntries 生成
 * 完整 inject 列表（调用方写入编辑草稿，保存后生效）。zhMap 条目为字符串
 *（整段替换）或函数（入参该行原文，返回空值 = 放弃替换，如 tools:sdk 的围栏
 * 守卫）；未命中的行与阶段原样保留，段数与注入不增不减。自定义段是用户自撰
 * 内容，绝不覆盖。`views` = 三阶段预览装配（键可为 null —— 该阶段行集视为空）。
 */
export function zhMergedInjectEntries(cfg, views, zhMap) {
  const patched = {}
  for (const key of ['bootstrap', 'active', 'compaction']) {
    patched[key] = phaseRows(cfg, views?.[key] ?? null, key).map((row) => {
      if (row.custom) return row
      const entry = zhMap?.[row.name]
      if (entry === undefined) return row
      const zh = typeof entry === 'function' ? entry(row.text) : entry
      return zh ? { ...row, override: zh, text: zh } : row
    })
  }
  return mergedPhaseInjectEntries(cfg, patched)
}

/**
 * 「回归英文」（开关关闭方向）：把三个阶段行里命中译本的非自定义行的替换
 * 文本清空 —— 系统段的注入条目回落为仅 order 覆盖，服务端恢复注册表英文
 * 原文。与 zhMergedInjectEntries 严格对称：开关独占这些段的文本所有权，
 * 关闭即整体回英文（用户在开启期间的手工微调一并清除）。自定义段不碰。
 */
export function zhRevertInjectEntries(cfg, views, zhMap) {
  const patched = {}
  for (const key of ['bootstrap', 'active', 'compaction']) {
    patched[key] = phaseRows(cfg, views?.[key] ?? null, key).map((row) => {
      if (row.custom || row.override === '' || zhMap?.[row.name] === undefined) return row
      return { ...row, override: '', text: '' }
    })
  }
  return mergedPhaseInjectEntries(cfg, patched)
}

/**
 * 开关状态探测：任一注入条目的文本与**字符串译本**逐字相等即视为已应用。
 * 只探测字符串译本（函数译本无法从译文反推），而应用时所有命中行都会写入、
 * 字符串译本必然存在 —— 足以作为探针。混合状态（用户手动还原了个别段）仍算
 * 开启，关闭方向会整体回归英文。
 */
export function zhApplied(cfg, zhMap) {
  for (const item of cfg?.inject ?? []) {
    if (item === null || typeof item !== 'object' || typeof item.name !== 'string') continue
    const zh = zhMap?.[item.name]
    if (typeof zh === 'string' && zh !== '' && item.text === zh) return true
  }
  return false
}
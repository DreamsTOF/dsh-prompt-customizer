/** 提示词段 Tab：四个部分 —— 引导期 / 常驻期 / 压缩受控期（三个阶段恒定
 *  显示，预设没有某个阶段时该部分只是空的）+ 本系统全部提示词（只读池）。
 *
 *  交互对齐提示词段初版（v1），并修复三类反馈缺失：
 *  - 上三段每行 = 真实进入该阶段装配的段（post 视图，与预览一致 —— 预设
 *    原生阶段插件裁剪掉的段不显示）∪ 被屏蔽的段 ∪ 配置里的自定义注入段，
 *    顺序以 base 骨架为底再叠加草稿序；整行可拖拽，拖到某行上方/下方出现
 *    插入指示线，松手即在该位置重排。
 *  - 被屏蔽的段与普通段一模一样：留在列表原位、一样可操作（拖拽/箭头/替换/
 *    恢复/删除），随时可互相转换，唯一区别是屏蔽勾选框与「已屏蔽」徽标 ——
 *    屏蔽只意味着不注入模型，不剥夺任何编辑能力（v1 语义）。屏蔽勾选直接
 *    绑定当前生效名单（deniedNames = 全局 + 该阶段名单，含未保存草稿），
 *    点击立即反馈。
 *  - 重排（拖入/箭头）走 `persistPhase`：把该阶段全部行重写为连续整数
 *    虚拟 order（系统段写空文本 = 仅 order 覆盖，服务端保留原文；custom 段
 *    保留文本）—— UI 行序叠加同一份 order 立即重排，拖动即时可见。
 *  - 文本编辑（「编辑」/「还原」）同样按阶段生效：写的就是本阶段注入条目的
 *    文本，三个阶段各改各的、互不影响（服务端让本阶段注入文本优先于全局
 *    replace，否则一份文本会同时改坏三个阶段）。全局 replace 字典自此不再由
 *    界面写入，只在「还原」时顺带清除遗留条目 —— 新界面没有别的出口能恢复它。
 *  - 拖放搬移保留行对象（system/custom 身份与文本原样带走），绝不重建行 ——
 *    重建会把系统段误标成 custom 并清空内容。只有从其它部分/全部池拖入的
 *    新段才构造新行（身份取自拖拽源）。
 *  - 拖放事件在行上处理并 stopPropagation，避免与阶段框二次处理对冲。
 *  - 全部提示词 → 上三段：插入该段到目标位置（已存在则只是移动排序；该段
 *    在目标阶段被屏蔽则同步解除屏蔽 —— 行立即出现）。上三段 → 全部：从该
 *    阶段移除 —— custom 段删除注入条目；系统段等价于屏蔽该阶段（系统段是
 *    装配的一部分，无法真正删除）。
 *  - 解除屏蔽按份额归属分流写入：继承自全局名单的屏蔽直接改全局名单（立即
 *    写盘通道）—— override 无法表达「比全局更宽松」（空名单回落全局，解除
 *    会在保存后复现）；override 自报名单与阶段名单的份额走目标草稿。
 *  - 每个阶段部分按自己那一阶段的装配结果给出警示：该 scope 有 complete 段
 *    整段接管最终提示词，或本插件产出的段被下游装配规则丢弃时，明确写出
 *    「段级定制不会（完全）进入模型看到的提示词」，避免提示词 Tab 与预览 Tab
 *    各说各话。
 *
 *  全部阶段状态逻辑来自 lib/sectionOps.mjs（纯函数，node --test 单测直接
 *  覆盖同一份代码）。
 */
import { createElement as h, useRef, useState, type CSSProperties, type ReactElement, type DragEvent, type ChangeEvent } from 'react'
import type { Config, Inventory, Phase, PhaseViewKey, Preview } from './types.ts'
import type { Translate } from './locales.ts'
import { PART_ORDER } from './presets.ts'
import { injectPhaseOf, injectedAt, deniedNames, blockPatch, reorderInsert, phaseInjectEntries } from '../../lib/sectionOps.mjs'
import { s } from './styles.ts'

/** Panel 并行拉取的三阶段装配（与 PreviewTab 同一形状）。 */
type PhaseViews = Record<PhaseViewKey, Preview | null>

/** 屏幕上一条可交互的段行。 */
interface PartRow {
  name: string
  text: string
  replaced: boolean
  custom: boolean
  /** 本阶段的用户替换文本（空串 = 本阶段没改过文本）—— 三个阶段各一份，互不影响。 */
  override: string
  /** 该阶段生效名单（全局 + 阶段独立）是否屏蔽了此段：仅影响展示，不剥夺操作。 */
  blocked: boolean
}

/** 拖拽来源：全部池，或某个阶段部分（copy 语义，携带源的身份与文本）。 */
interface DragSource {
  kind: 'all' | 'part'
  key?: PhaseViewKey
  text: string
  custom: boolean
}

/** 编辑态的键：段名之外还要带阶段，否则三个部分里同名的行会同时展开编辑器。 */
const editKey = (key: PhaseViewKey, name: string): string => `${key}:${name}`

export function SectionsTab({ cfg, inv, phases, target, globalSections, ownedSections, t, write, writeGlobalField }: {
  cfg: Config
  inv: Inventory | null
  phases: PhaseViews | null
  /** 编辑目标：undefined = 全局默认；字符串 = agent 预设 id（字段级覆盖）。 */
  target: string | undefined
  /** 原始全局段屏蔽名单（未叠加 override / 草稿）——解除屏蔽时判定份额归属。 */
  globalSections: string[] | undefined
  /** 目标 override 自己的段屏蔽名单（未叠加草稿）；undefined = 该 override 没有名单。 */
  ownedSections: string[] | undefined
  t: Translate
  write: (field: 'sections' | 'sectionsBootstrap' | 'sectionsCompaction' | 'replace' | 'inject' | 'tools', value: unknown) => void
  /** 全局字段的立即写入通道（不经目标草稿）：解除继承自全局的屏蔽时使用。 */
  writeGlobalField: (field: 'sections', value: unknown) => void
}): ReactElement {
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [dragName, setDragName] = useState<string | null>(null)
  const [dragSource, setDragSource] = useState<DragSource | null>(null)
  const [dropTarget, setDropTarget] = useState<{ part: PhaseViewKey; name: string; pos: 'above' | 'below' } | null>(null)
  // 面板内短提示（例如：动态段加不进某个阶段时说明原因）。
  const [notice, setNotice] = useState<string | null>(null)

  // ── 拖拽边缘自动滚动 ────────────────────────────────────────────────────
  // 列表远超视口时，浏览器的内建 DnD autoscroll 在宿主滚动容器上不可靠，
  // 视口外的行无法成为放置目标（无法把最上方段拖到最下方）。dragover 冒泡
  // 到根容器记录指针位置并启动 rAF 循环：指针接近视口上/下边缘时逐级向上
  // 找最近的可滚动祖先持续滚动；drop/dragend 停止。
  const scrollRef = useRef<{ raf: number; clientY: number }>({ raf: 0, clientY: 0 })
  const stopAutoScroll = (): void => {
    if (scrollRef.current.raf !== 0) { cancelAnimationFrame(scrollRef.current.raf); scrollRef.current.raf = 0 }
  }
  const autoScrollTick = (): void => {
    scrollRef.current.raf = 0
    const edge = 48
    const y = scrollRef.current.clientY
    const inner = window.innerHeight
    let node = rootRef.current?.parentElement
    while (node !== null && node !== undefined) {
      if (node.scrollHeight > node.clientHeight) {
        if (y < edge) node.scrollTop -= Math.max(6, (edge - y) / 2)
        else if (y > inner - edge) node.scrollTop += Math.max(6, (y - (inner - edge)) / 2)
        else return
        scrollRef.current.raf = requestAnimationFrame(autoScrollTick)
        return
      }
      node = node.parentElement
    }
    // 无可滚动祖先（整页滚动）：滚 window 本身。
    if (y < edge) window.scrollBy({ top: -Math.max(6, (edge - y) / 2) })
    else if (y > inner - edge) window.scrollBy({ top: Math.max(6, (y - (inner - edge)) / 2) })
    if (y < edge || y > inner - edge) scrollRef.current.raf = requestAnimationFrame(autoScrollTick)
  }
  const rootRef = useRef<HTMLDivElement | null>(null)
  // 只记录指针位置并启动循环；不 preventDefault —— 行/部分自身已处理放置
  // 语义，空白区域维持「不可放置」的原生表现。
  const rootDragOver = (e: DragEvent): void => {
    if (!dragName) return
    scrollRef.current.clientY = e.clientY
    if (scrollRef.current.raf === 0) scrollRef.current.raf = requestAnimationFrame(autoScrollTick)
  }

  // 三个阶段部分：恒定全部显示（预设没有某个阶段时该部分只是空的）。
  const parts: PhaseViewKey[] = PART_ORDER
  // 逐阶段的「段级定制没进最终提示词」警示：每个部分按自己那一阶段的装配结果
  // 判定 —— 有 complete 段整段接管就说接管，否则探测本插件产出的段是否被下游
  // 丢弃（丢弃规则不止 persona complete 一种）。
  // forceSections（默认开）已在装配入口绕开这两类压制，警示不再成立；只有
  // 显式关闭（降级路径）或强制覆盖失效（服务端会恢复 takenOverBy）才显示。
  const partNote = (key: PhaseViewKey): ReactElement | null => {
    const view = phases?.[key]
    if (view === undefined || view === null) return null
    if (cfg.forceSections !== false) return null
    if (view.takenOverBy !== undefined) {
      return h('div', { style: s.noticeWarn }, t('sectionsTakenOver', { name: view.takenOverBy }))
    }
    const lost = view.lostSections
    if (lost !== undefined) {
      return h('div', { style: s.noticeWarn }, t('sectionsLost', { emitted: lost.emitted, survived: lost.survived }))
    }
    return null
  }

  // 一个阶段部分的全部行：行集合 = 「真实进入该阶段装配的段」（post 视图，
  // 与预览同源 —— 预设原生阶段插件裁剪掉的段不出现在这里）∪「被屏蔽的段」
  //（屏蔽名单含未保存草稿，随时可反选）∪「配置里属于该阶段的自定义注入段」。
  // 顺序以 base（预过滤）视图的骨架为底，再叠加「该阶段的注入 order」草稿序
  // —— 未保存的重排立即反映到界面。文本 post 优先（替换 / 注入结果），回退
  // base 原文与注入文本。身份只认注入条目的 custom 隐藏标记，绝不互相转换。
  const rowsOf = (key: PhaseViewKey): PartRow[] => {
    const replace = cfg.replace ?? {}
    const view = phases?.[key]
    const denied = new Set(deniedNames(cfg, key))
    const postByName = new Map((view?.sections ?? []).map((sec) => [sec.name, sec] as const))
    const baseByName = new Map((view?.baseSections ?? []).map((sec) => [sec.name, sec] as const))
    // 本部分的注入身份（含未保存草稿）：phase = 本阶段注入阶段，names = 本部分
    // 可见的注入段名，custom = 自定义段身份，text = 本阶段生效的用户文本，
    // order = 本阶段草稿序。
    const { phase, names: injectedHere, custom: customNames, text, order: phaseOrder } = injectedAt(cfg, key)
    const names: string[] = []
    const seen = new Set<string>()
    const push = (name: string): void => { if (!seen.has(name)) { seen.add(name); names.push(name) } }
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
      const fallback = new Map(rows.map((row, i) => [row.name, i] as const))
      rows.sort((a, b) => (phaseOrder.get(a.name) ?? fallback.get(a.name) ?? 0) - (phaseOrder.get(b.name) ?? fallback.get(b.name) ?? 0))
    }
    return rows
  }

  // 屏蔽 / 恢复一个段。屏蔽永远走当前目标的草稿（override 可以表达「比全局
  // 更严格」）。解除屏蔽按屏蔽份额的归属分流：阶段名单与 override 自报名单
  // 走草稿；继承自全局的屏蔽必须直接改全局名单 —— override 表达不了「比全局
  // 更宽松」（空名单回落全局，解除会在保存后失效并复现）。
  const applyBlock = (key: PhaseViewKey, name: string, blocked: boolean): void => {
    if (blocked || !target) {
      const patch = blockPatch(cfg, key, name, blocked)
      for (const [field, value] of Object.entries(patch)) {
        // 名单未变化时不写，避免把继承值冻结进 override。
        if (JSON.stringify(value) === JSON.stringify((cfg as Record<string, unknown>)[field] ?? [])) continue
        write(field as 'sections' | 'sectionsBootstrap' | 'sectionsCompaction', value)
      }
      return
    }
    const patch = blockPatch(cfg, key, name, false)
    const effectiveOwned = ownedSections && ownedSections.length > 0 ? ownedSections : undefined
    for (const [field, value] of Object.entries(patch)) {
      if (field === 'sections') {
        // 全局份额：override 未接管名单（或解除后会把名单清空）时，全局名单
        // 里的该段必须从全局移除，否则空名单回落全局后屏蔽复现。
        if ((globalSections ?? []).includes(name) && (!effectiveOwned || ownedSections!.includes(name))) {
          writeGlobalField('sections', (globalSections ?? []).filter((n) => n !== name))
        }
        // override 自报名单里的份额：走草稿。
        if (effectiveOwned?.includes(name)) write('sections', value)
        continue
      }
      if (JSON.stringify(value) === JSON.stringify((cfg as Record<string, unknown>)[field] ?? [])) continue
      write(field as 'sectionsBootstrap' | 'sectionsCompaction', value)
    }
  }
  const toggleBlocked = (key: PhaseViewKey, name: string): void =>
    applyBlock(key, name, !deniedNames(cfg, key).includes(name))

  // 该阶段中某名字是否在该阶段的装配输入里（判断拖入是「解除屏蔽」还是
  // 「凭空注入」）。
  const inBaseOf = (key: PhaseViewKey, name: string): boolean =>
    (phases?.[key]?.baseSections ?? []).some((sec) => sec.name === name)

  // 持久化一个阶段的有序列表（写回 inject）：该阶段每行一条注入项、order 为
  // 连续整数；系统行空文本（仅 order 覆盖），custom 行保留文本；其它阶段
  //（含 always）的注入项原样保留。被屏蔽的行同样写入（服务端对被屏蔽段
  // 跳过注入，order 留作解除屏蔽后立即生效）。
  const persistPhase = (key: PhaseViewKey, rows: PartRow[]): void => {
    write('inject', phaseInjectEntries(cfg, key, rows))
  }

  // 上移/下移一格（数组交换后重排整个阶段）。
  const moveRow = (key: PhaseViewKey, index: number, dir: -1 | 1): void => {
    const rows = rowsOf(key)
    const target = index + dir
    if (target < 0 || target >= rows.length) return
    const next = rows.slice()
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    persistPhase(key, next)
  }

  // 从该阶段移除一个段：删掉它在本阶段的注入条目，以及跨阶段生效（always）的
  // 条目 —— 预设应用 / 导入产生的自定义段就是 always，它在三个阶段都显示，
  // 只按当前阶段过滤的话永远删不掉。随后解除该阶段屏蔽，行才真正消失。
  const removeFromPart = (key: PhaseViewKey, name: string): void => {
    const phase = injectPhaseOf(key)
    const inject = (cfg.inject ?? []).filter((x) => {
      if (x.name !== name) return true
      const itemPhase = x.phase ?? 'always'
      return !(itemPhase === phase || itemPhase === 'always')
    })
    write('inject', inject)
    applyBlock(key, name, false)
  }

  // 文本编辑按阶段生效：编辑态的键是「阶段 + 段名」，三个阶段部分里同名的行
  // 各自独立展开。写入走 persistPhase（本阶段的注入条目带 text），绝不碰全局
  // replace 字典 —— 那一份文本对三个阶段同时生效，正是「改一个阶段、三个阶段
  // 都变」的根源。
  const startReplace = (key: PhaseViewKey, row: PartRow): void => {
    // 回显当前生效文本：本阶段替换过的从替换值开始，否则从原始文本开始（v1 语义）。
    setEditing(editKey(key, row.name))
    setDraft(row.override || row.text)
  }
  const commitReplace = (key: PhaseViewKey, row: PartRow): void => {
    const next = rowsOf(key).map((r) => (r.name !== row.name ? r : { ...r, override: draft, text: draft }))
    persistPhase(key, next)
    setEditing(null)
  }
  const restoreReplace = (key: PhaseViewKey, row: PartRow): void => {
    const next = rowsOf(key).map((r) =>
      r.name !== row.name ? r : { ...r, override: '', text: r.custom ? r.text : '' },
    )
    persistPhase(key, next)
    // 遗留的全局替换条目（旧版 UI 的产物，新界面再也不写它）：只在本部分还原
    // 时一并清除，否则这份跨阶段文本再也没有恢复原文的入口。
    if (!row.custom && Object.hasOwn(cfg.replace ?? {}, row.name)) {
      const rest = { ...(cfg.replace ?? {}) }
      delete rest[row.name]
      write('replace', rest)
    }
  }

  const addSection = (name: string, text: string, phase: Phase): void => {
    const inject = (cfg.inject ?? []).slice()
    inject.push({ name, order: 120 + inject.length, text, phase, custom: true })
    write('inject', inject)
  }

  // ── 拖拽（v1 语义：整行拖拽 + 上/下插入指示） ─────────────────────────────
  const startDrag = (e: DragEvent, name: string, source: DragSource): void => {
    setDragName(name)
    setDragSource(source)
    e.dataTransfer.effectAllowed = 'move'
    try { e.dataTransfer.setData('text/plain', name) } catch { /* ignore */ }
  }
  const rowDragOver = (e: DragEvent, key: PhaseViewKey, name: string): void => {
    if (!dragName || dragName === name) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const rect = e.currentTarget.getBoundingClientRect()
    const pos = e.clientY < rect.top + rect.height / 2 ? 'above' : 'below'
    setDropTarget({ part: key, name, pos })
  }
  // 从「全部」池把一个该阶段原本没有的系统段加进来：带上它的原文作为本阶段
  // 文本 —— 注入条目带文本，服务端才会把它真正建出来（幽灵防线只放行带文本的
  // 条目）。该阶段已有的段不在此列（只是排序/解除屏蔽）。动态段没有可带的
  // 原文，加不了，返回 blocked 让调用方提示。
  const carryFor = (key: PhaseViewKey, source: DragSource, name: string): { text: string; blocked: boolean } => {
    if (source.kind !== 'all' || source.custom) return { text: '', blocked: false }
    if (inBaseOf(key, name)) return { text: '', blocked: false }
    if (source.text === '') return { text: '', blocked: true }
    return { text: source.text, blocked: false }
  }
  // 拖入/重排：把 dragName 插入到目标行上/下方（已存在则移动位置）。
  // 目标部分里已有的行整体搬移（身份与文本原样保留，绝不重建 —— 重建会把
  // 系统段误标成 custom 并清空内容）；只有真正新拖入的段才构造新行。
  const insertInto = (key: PhaseViewKey, targetName: string, pos: 'above' | 'below'): void => {
    if (!dragName || !dragSource) return
    const carry = carryFor(key, dragSource, dragName)
    if (carry.blocked) { setNotice(t('sectionDynamicNoAdd', { name: dragName })); return }
    const rows = rowsOf(key)
    const existing = rows.find((row) => row.name === dragName)
    const newRow: PartRow = existing ?? {
      name: dragName,
      text: dragSource.custom ? dragSource.text : '',
      replaced: Object.hasOwn(cfg.replace ?? {}, dragName),
      custom: dragSource.custom,
      override: carry.text,
      blocked: false,
    }
    const next = reorderInsert(rows, dragName, targetName, pos, newRow)
    if (next === null) return
    // 从全部池拖入一个被本阶段屏蔽的系统段：解除该阶段屏蔽，否则装配仍会过滤。
    if (dragSource.kind === 'all' && inBaseOf(key, dragName) && deniedNames(cfg, key).includes(dragName)) {
      applyBlock(key, dragName, false)
    }
    persistPhase(key, next)
  }
  const rowDrop = (e: DragEvent, key: PhaseViewKey, name: string): void => {
    e.preventDefault()
    e.stopPropagation() // 避免继续冒泡到阶段框的 append 逻辑（防双份）
    if (dragName && dragName !== name) {
      const pos = dropTarget?.part === key && dropTarget.name === name && dropTarget.pos ? dropTarget.pos : 'below'
      insertInto(key, name, pos)
    }
    setDragName(null); setDragSource(null); setDropTarget(null)
  }
  const partDropEnd = (e: DragEvent, key: PhaseViewKey): void => {
    // 拖到阶段部分空白处 = 追加到末尾（同样保留已有行的身份）。
    e.preventDefault()
    if (dragName && dragSource) {
      const carry = carryFor(key, dragSource, dragName)
      if (!carry.blocked) {
        const rows = rowsOf(key)
        const existing = rows.find((row) => row.name === dragName)
        const next = rows.filter((row) => row.name !== dragName)
        next.push(existing ?? {
          name: dragName,
          text: dragSource.custom ? dragSource.text : '',
          replaced: Object.hasOwn(cfg.replace ?? {}, dragName),
          custom: dragSource.custom,
          override: carry.text,
          blocked: false,
        })
        if (dragSource.kind === 'all' && inBaseOf(key, dragName) && deniedNames(cfg, key).includes(dragName)) {
          applyBlock(key, dragName, false)
        }
        persistPhase(key, next)
      } else {
        setNotice(t('sectionDynamicNoAdd', { name: dragName }))
      }
    }
    setDragName(null); setDragSource(null); setDropTarget(null)
  }
  const allBoxDrop = (e: DragEvent): void => {
    e.preventDefault()
    // 拖回「全部」= 从该阶段移除：custom 段删除注入条目；系统段无法真正
    // 删除（它是装配的一部分），等价操作是屏蔽该阶段 —— 行翻转成「已屏蔽」，
    // 仍留在列表里可随时拖回 / 勾回。
    if (dragName && dragSource?.kind === 'part' && dragSource.key) {
      const src = dragSource.key
      const row = rowsOf(src).find((r) => r.name === dragName)
      // 用户加进来的系统段（该阶段原本没有、靠注入文本出现）：移除注入条目即还原。
      const addedSystem = !!row && !row.custom && !inBaseOf(src, dragName) && row.override !== ''
      if (row && !row.custom && !addedSystem) applyBlock(src, dragName, true)
      else removeFromPart(src, dragName)
    }
    setDragName(null); setDragSource(null); setDropTarget(null)
  }
  const endDrag = (): void => { stopAutoScroll(); setDragName(null); setDragSource(null); setDropTarget(null) }

  const partNoun = (key: PhaseViewKey): string =>
    key === 'bootstrap' ? t('sectionsPartGuide') : key === 'compaction' ? t('sectionsPartControlled') : t('sectionsPartResident')

  const isEditing = (key: PhaseViewKey, row: PartRow): boolean => editing === editKey(key, row.name)

  const renderRow = (key: PhaseViewKey, row: PartRow, index: number, total: number): ReactElement => {
    const isDragging = dragName === row.name
    const isDropTarget = dropTarget?.part === key && dropTarget.name === row.name
    const rowStyle: CSSProperties = {
      ...s.row,
      ...(isDragging ? s.rowDragging : {}),
      ...(isDropTarget && dropTarget && dropTarget.pos === 'above' ? s.rowDropAbove : {}),
      ...(isDropTarget && dropTarget && dropTarget.pos === 'below' ? s.rowDropBelow : {}),
      cursor: 'move',
    }
    return h('div', {
      key: row.name,
      style: rowStyle,
      draggable: true,
      onDragStart: (e: DragEvent) => startDrag(e, row.name, { kind: 'part', key, text: row.custom ? (row.override || row.text) : '', custom: row.custom }),
      onDragOver: (e: DragEvent) => rowDragOver(e, key, row.name),
      onDrop: (e: DragEvent) => rowDrop(e, key, row.name),
      onDragEnd: endDrag,
    }, [
      h('span', { style: s.dragHandle, title: t('drag') }, '⠿'),
      h('label', { style: s.switchWrap }, [
        h('input', { type: 'checkbox', checked: row.blocked, onChange: () => toggleBlocked(key, row.name) }),
        h('span', { style: row.blocked ? s.badgeBlocked : s.badgeOk }, row.blocked ? t('blockedOn') : t('blockedOff')),
      ]),
      h('div', { style: s.rowBody }, [
        h('div', { style: s.rowTitle }, [
          h('span', { style: s.code }, row.name),
          h('span', { style: s.orderTag }, '#' + index),
          h('span', { style: row.custom ? s.badgeCustom : s.badgeSystem }, row.custom ? t('manual') : t('system')),
          row.replaced ? h('span', { style: s.badgeReplaced }, t('replaced')) : null,
        ]),
        isEditing(key, row)
          ? h('div', { style: s.editBox }, [
              h('textarea', { style: s.editInput, value: draft, onChange: (e: ChangeEvent<HTMLTextAreaElement>) => setDraft(e.target.value), rows: 3 }),
              h('div', { style: s.injectRow }, [
                h('button', { style: s.mini, onClick: () => commitReplace(key, row) }, t('save')),
                h('button', { style: s.mini, onClick: () => setDraft('') }, t('clearInput')),
                !row.custom && (row.override || Object.hasOwn(cfg.replace ?? {}, row.name))
                  ? h('button', { style: s.mini, onClick: () => restoreReplace(key, row) }, t('restore'))
                  : null,
              ]),
            ])
          : h('div', { style: s.preview }, String(row.override || row.text || '').slice(0, 140) || (row.custom ? t('empty') : t('dynamic'))),
      ]),
      h('div', { style: s.arrowCol }, [
        h('button', { style: s.arrow, disabled: index === 0, onClick: () => moveRow(key, index, -1), title: t('moveUp') }, '↑'),
        h('button', { style: s.arrow, disabled: index === total - 1, onClick: () => moveRow(key, index, 1), title: t('moveDown') }, '↓'),
      ]),
      isEditing(key, row) ? null : h('button', { style: s.mini, onClick: () => startReplace(key, row) }, t('replace')),
      !isEditing(key, row) && !row.custom && (row.override || Object.hasOwn(cfg.replace ?? {}, row.name))
        ? h('button', { style: s.mini, onClick: () => restoreReplace(key, row) }, t('restore'))
        : null,
      row.custom ? h('button', { style: s.mini, onClick: () => removeFromPart(key, row.name), title: t('delete') }, t('delete')) : null,
    ])
  }

  // 一个阶段部分：标题 + 全部行（含被屏蔽的段，整行拖拽/箭头/序号）+ 注入表单。
  const renderPart = (key: PhaseViewKey): ReactElement => {
    const rows = rowsOf(key)
    return h('div', {
      key,
      style: s.injectBox,
      onDragOver: (e: DragEvent) => { if (dragName) { e.preventDefault(); e.dataTransfer.dropEffect = 'move' } },
      onDrop: (e: DragEvent) => partDropEnd(e, key),
    }, [
      h('div', { style: s.rowTitle }, [
        h('span', null, partNoun(key)),
        h('span', { style: s.orderTag }, `${t('phaseVisible')} ${rows.length}`),
      ]),
      partNote(key),
      rows.map((row, i) => renderRow(key, row, i, rows.length)),
      h(InjectForm, { onAdd: (name, text) => addSection(name, text, injectPhaseOf(key)), lockedPhase: injectPhaseOf(key), t }),
    ])
  }

  return h('div', { style: s.list, ref: rootRef, onDragOver: rootDragOver }, [
    notice ? h('div', { style: s.noticeWarn }, notice) : null,
    parts.map(renderPart),
    h('div', {
      style: s.injectBox,
      onDragOver: (e: DragEvent) => { if (dragName) { e.preventDefault(); e.dataTransfer.dropEffect = 'move' } },
      onDrop: allBoxDrop,
    }, [
      h('div', { style: s.rowTitle }, [t('allSectionsTitle'), h('span', { style: s.orderTag }, `${(inv?.sections ?? []).length}`)]),
      h('div', { style: { ...s.muted, marginBottom: 4 } }, t('sectionsFourHint')),
      (inv?.sections ?? []).length === 0 ? h('div', { style: s.muted }, t('empty')) : null,
      (inv?.sections ?? []).map((sec) => h('div', {
        key: sec.name,
        style: { ...s.row, cursor: 'copy', opacity: 0.92 },
        draggable: true,
        onDragStart: (e: DragEvent) => startDrag(e, sec.name, { kind: 'all', text: (sec.text ?? '').startsWith('<') || !sec.text ? '' : sec.text, custom: false }),
        onDragEnd: endDrag,
      }, [
        h('div', { style: s.rowBody }, [
          h('div', { style: s.rowTitle }, h('span', { style: s.code }, sec.name)),
          h('div', { style: s.preview }, String(sec.text ?? '').slice(0, 140) || t('dynamic')),
        ]),
      ])),
    ]),
  ])
}

/** 注入新段表单：阶段部分内联形态，阶段锁定为所在部分。 */
function InjectForm({ onAdd, lockedPhase, t }: {
  onAdd: (name: string, text: string) => void
  lockedPhase: 'bootstrap' | 'active' | 'compaction'
  t: Translate
}): ReactElement {
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const submit = (): void => {
    if (!name.trim()) return
    onAdd(name.trim(), text)
    setName(''); setText('')
  }
  const phaseLabel = lockedPhase === 'bootstrap' ? t('phaseStageGuide')
    : lockedPhase === 'compaction' ? t('phaseStageControlled')
    : t('phaseStageResident')
  return h('div', { style: s.injectRow }, [
    h('input', { style: { ...s.input, width: '22%' }, placeholder: t('name'), value: name, onChange: (e: ChangeEvent<HTMLInputElement>) => setName(e.target.value) }),
    h('input', { style: { ...s.input, flex: 1 }, placeholder: `${t('text')}（${phaseLabel}）`, value: text, onChange: (e: ChangeEvent<HTMLInputElement>) => setText(e.target.value) }),
    h('button', { style: s.mini, onClick: submit }, t('add')),
  ])
}

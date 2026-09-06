/**
 * SectionsPane — 独立面板的左栏（提示词模式）。
 *
 * 顶部三个阶段 Tab（引导期 / 常驻期 / 压缩受控期，恒定全部可选），与右栏
 * 预览的阶段按钮**联动**：两边切的是同一个阶段，编辑哪个阶段就看哪个阶段的
 * 装配。每个阶段列出该阶段装配里的段：勾选框 = 该阶段是否注入模型（勾上 =
 * 启用），被停用的行半透明原位保留、随时可勾回。行内：↑/↓ 重排、编辑（按
 * 阶段替换文本）、还原、删除（仅自定义段）；「+ 注入」展开注入新段表单。
 *
 * 底部固定条：三态过滤（全部 / 已启用 / 已停用）——像宿主能力管理页一样按
 * 勾选状态筛选当前阶段的列表。
 *
 * 「本系统全部提示词」只读池收在列表末尾的折叠区（不分阶段）：每行三个小
 * 按钮把该段加入对应阶段（替代旧版的拖拽搬移；运行时动态段加不进，会给出
 * 说明）。
 *
 * 全部阶段状态逻辑来自 lib/sectionOps.mjs（纯函数，node --test 单测直接
 * 覆盖同一份代码）。
 */
import { createElement as h, useState, type ChangeEvent, type ReactElement } from 'react'
import type { Config, Inventory, Phase, PhaseViewKey, Preview } from './types.ts'
import type { Translate } from './locales.ts'
import { PART_ORDER } from './presets.ts'
import { injectPhaseOf, deniedNames, blockPatch, phaseInjectEntries, mergedPhaseInjectEntries, phaseRows } from '../../lib/sectionOps.mjs'
import { s } from './styles.ts'

/** Panel 并行拉取的三阶段装配。 */
type PhaseViews = Record<PhaseViewKey, Preview | null>

/** 屏幕上一条可交互的段行。 */
interface PartRow {
  name: string
  text: string
  replaced: boolean
  custom: boolean
  /** 本阶段的用户替换文本（空串 = 本阶段没改过文本）—— 三个阶段各一份，互不影响。 */
  override: string
  /** 该阶段自己的屏蔽名单是否屏蔽了此段：勾选框 = 未屏蔽（注入模型）。 */
  blocked: boolean
}

/** 三态过滤：全部 / 已启用（未屏蔽）/ 已停用（被屏蔽）。 */
export type TriState = 'all' | 'on' | 'off'

/** 编辑态的键：段名之外还要带阶段，否则三个部分里同名的行会同时展开编辑器。 */
const editKey = (key: PhaseViewKey, name: string): string => `${key}:${name}`

export function SectionsPane({ cfg, inv, phases, phase, syncAll, t, write }: {
  cfg: Config
  inv: Inventory | null
  phases: PhaseViews | null
  /** 当前阶段（状态在 Panel 持有，头部阶段按钮统一切换）。 */
  phase: PhaseViewKey
  /** 三态同步（默认关）：勾选后屏蔽 / 解除屏蔽与替换文本对三个阶段一起生效（只作用于同名段）。 */
  syncAll?: boolean
  t: Translate
  write: (field: 'sections' | 'sectionsBootstrap' | 'sectionsCompaction' | 'replace' | 'inject' | 'tools', value: unknown) => void
}): ReactElement {
  const [filter, setFilter] = useState<TriState>('all')
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  // 「注入新段」表单展开态（当前阶段分组内）。
  const [addOpen, setAddOpen] = useState(false)
  // 面板内短提示（例如：动态段加不进某个阶段时说明原因）。
  const [notice, setNotice] = useState<string | null>(null)

  const rowsOf = (key: PhaseViewKey): PartRow[] => phaseRows(cfg, phases?.[key] ?? null, key)

  // 屏蔽 / 恢复一个段（blockPatch 只动本阶段自己的名单）。写入严格落在当前
  // 编辑目标的草稿里 —— 预设之间互相独立：在 A 预设里的任何改动对 B 预设与
  // 全局默认零影响。
  const applyBlock = (key: PhaseViewKey, name: string, blocked: boolean): void => {
    const patch = blockPatch(cfg, key, name, blocked)
    for (const [field, value] of Object.entries(patch)) {
      write(field as 'sections' | 'sectionsBootstrap' | 'sectionsCompaction', value)
    }
  }
  const toggleBlocked = (key: PhaseViewKey, name: string): void => {
    const blocked = !deniedNames(cfg, key).includes(name)
    // 三态同步（可选）：一次写全三个阶段 —— 只作用于同名的这一段。
    for (const k of syncAll ? PART_ORDER : [key]) applyBlock(k, name, blocked)
  }

  // 该阶段中某名字是否在该阶段的装配输入里（判断加入是「解除屏蔽」还是「凭空注入」）。
  const inBaseOf = (key: PhaseViewKey, name: string): boolean =>
    (phases?.[key]?.baseSections ?? []).some((sec) => sec.name === name)

  // 持久化一个阶段的有序列表（写回 inject）：每行一条注入项、order 为连续整数；
  // 系统行空文本（仅 order 覆盖），custom 行保留文本；其它阶段的注入项原样保留。
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
  // 条目 —— 预设应用 / 导入产生的自定义段就是 always。随后解除该阶段屏蔽。
  const removeFromPart = (key: PhaseViewKey, name: string): void => {
    const phaseOfItem = injectPhaseOf(key)
    const inject = (cfg.inject ?? []).filter((x) => {
      if (x.name !== name) return true
      const itemPhase = x.phase ?? 'always'
      return !(itemPhase === phaseOfItem || itemPhase === 'always')
    })
    write('inject', inject)
    applyBlock(key, name, false)
  }

  // 文本编辑按阶段生效：编辑态的键是「阶段 + 段名」。写入走 persistPhase
  //（本阶段的注入条目带 text），绝不碰全局 replace 字典。
  const startReplace = (key: PhaseViewKey, row: PartRow): void => {
    setEditing(editKey(key, row.name))
    setDraft(row.override || row.text)
  }
  const commitReplace = (key: PhaseViewKey, row: PartRow): void => {
    const patchRow = (r: PartRow): PartRow => (r.name !== row.name ? r : { ...r, override: draft, text: draft })
    if (syncAll) {
      // 三态同步（可选）：替换文本一次写全三个阶段 —— 只改各阶段里同名的那
      // 一行。edit 对 inject 是整体替换，必须把三个阶段叠进同一份列表一次写入。
      const rowsByKey = {} as Record<PhaseViewKey, PartRow[]>
      for (const k of PART_ORDER) {
        const rows = rowsOf(k)
        rowsByKey[k] = k === key || rows.some((r) => r.name === row.name) ? rows.map(patchRow) : rows
      }
      write('inject', mergedPhaseInjectEntries(cfg, rowsByKey))
    } else {
      persistPhase(key, rowsOf(key).map(patchRow))
    }
    setEditing(null)
  }
  const restoreReplace = (key: PhaseViewKey, row: PartRow): void => {
    const next = rowsOf(key).map((r) =>
      r.name !== row.name ? r : { ...r, override: '', text: r.custom ? r.text : '' },
    )
    persistPhase(key, next)
    // 遗留的全局替换条目（旧版 UI 的产物）：只在本部分还原时一并清除。
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

  // 从「全部」池把一个段加入某阶段（替代旧版拖拽：池 → 阶段）。该阶段已有的
  // 段只是移到末尾；新段带上池里的原文（注入条目带文本，服务端才会把它真正
  // 建出来）。动态段没有可带的原文，给出说明。
  const addFromPool = (key: PhaseViewKey, name: string, text: string): void => {
    if (text === '' || text.startsWith('<')) {
      setNotice(t('sectionDynamicNoAdd', { name }))
      return
    }
    setNotice(null)
    const rows = rowsOf(key)
    const existing = rows.find((row) => row.name === name)
    const next = existing !== undefined
      ? [...rows.filter((row) => row.name !== name), existing]
      : [...rows, {
          name,
          text: '',
          replaced: Object.hasOwn(cfg.replace ?? {}, name),
          custom: false,
          override: text,
          blocked: false,
        }]
    if (existing === undefined && inBaseOf(key, name) && deniedNames(cfg, key).includes(name)) {
      applyBlock(key, name, false)
    }
    persistPhase(key, next)
  }

  const stageLabel = (key: PhaseViewKey): string =>
    key === 'bootstrap' ? t('phaseStageGuide') : key === 'compaction' ? t('phaseStageControlled') : t('phaseStageResident')

  // 该阶段的「段级定制没进最终提示词」警示（forceSections 关闭或失效时）。
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

  const isEditing = (key: PhaseViewKey, row: PartRow): boolean => editing === editKey(key, row.name)

  const renderRow = (key: PhaseViewKey, row: PartRow, index: number, total: number): ReactElement | null => {
    if (!rowVisible(row)) return null
    return h('div', {
      key: row.name,
      style: { ...s.row, ...(row.blocked ? s.rowBlocked : {}) },
    }, [
      h('input', {
        type: 'checkbox',
        checked: !row.blocked,
        onChange: () => toggleBlocked(key, row.name),
        title: row.blocked ? t('blockedOn') : t('blockedOff'),
        style: { margin: 0, cursor: 'pointer', flex: 'none' },
      }),
      h('div', { style: s.rowBody }, [
        h('div', { style: s.rowTitle }, [
          h('span', { style: s.code }, row.name),
          h('span', { style: s.orderTag }, '#' + index),
          h('span', { style: row.custom ? s.badgeCustom : s.badgeSystem }, row.custom ? t('manual') : t('system')),
          row.replaced ? h('span', { style: s.badgeReplaced }, t('replaced')) : null,
          row.blocked ? h('span', { style: s.badgeBlocked }, t('blockedOn')) : null,
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

  // 当前阶段的行 + 三态过滤。
  const rows = rowsOf(phase)
  const onCount = rows.filter((row) => !row.blocked).length
  const offCount = rows.length - onCount
  const rowVisible = (row: PartRow): boolean =>
    filter === 'all' || (filter === 'on' ? !row.blocked : row.blocked)

  const poolSections = inv?.sections ?? []

  return h('div', { style: s.colLeft }, [
    h('div', { style: s.colScroll }, [
      notice ? h('div', { style: s.noticeWarn }, notice) : null,
      partNote(phase),
      rows.map((row, i) => renderRow(phase, row, i, rows.length)),
      rows.length === 0 ? h('div', { style: s.muted }, t('empty')) : null,
      addOpen
        ? h(InjectForm, {
            onAdd: (name, text) => { addSection(name, text, injectPhaseOf(phase)); setAddOpen(false) },
            phaseLabel: stageLabel(phase),
            t,
          })
        : null,
      // 本系统全部提示词：跨预设累积的只读池（折叠区），每行可加入三个阶段。
      h('details', { style: s.injectBox }, [
        h('summary', { style: { ...s.muted, cursor: 'pointer' } },
          `${t('allSectionsTitle')} (${poolSections.length})`),
        h('div', { style: { ...s.muted, marginBottom: 4 } }, t('sectionsFourHint')),
        poolSections.length === 0 ? h('div', { style: s.muted }, t('empty')) : null,
        poolSections.map((sec) => h('div', { key: sec.name, style: { ...s.row, opacity: 0.92 } }, [
          h('div', { style: s.rowBody }, [
            h('div', { style: s.rowTitle }, h('span', { style: s.code }, sec.name)),
            h('div', { style: s.preview }, String(sec.text ?? '').slice(0, 140) || t('dynamic')),
          ]),
          ...PART_ORDER.map((key) => h('button', {
            key,
            style: s.arrow,
            title: t('poolAddTitle', { phase: stageLabel(key) }),
            onClick: () => addFromPool(key, sec.name, sec.text ?? ''),
          }, t(key === 'bootstrap' ? 'phaseShortGuide' : key === 'active' ? 'phaseShortResident' : 'phaseShortControlled'))),
        ])),
      ]),
      // 「+ 注入」入口放在滚动区末尾：新段通常追加在当前阶段列表尾部。
      h('div', { style: { ...s.injectRow, marginTop: 8 } }, [
        h('button', { style: s.mini, onClick: () => setAddOpen(!addOpen), title: t('injectNew') },
          addOpen ? `× ${t('clearInput')}` : `+ ${t('injectNew')}`),
      ]),
    ]),
    // 左栏底部固定条：三态过滤（全部 / 已启用 / 已停用），只统计当前阶段。
    h('div', { style: s.colFoot }, [
      h('div', { style: s.seg }, [
        h('button', { style: filter === 'all' ? s.segBtnActive : s.segBtn, onClick: () => setFilter('all') },
          `${t('filterAll')} ${rows.length}`),
        h('button', { style: filter === 'on' ? s.segBtnActive : s.segBtn, onClick: () => setFilter('on') },
          `${t('filterOn')} ${onCount}`),
        h('button', { style: filter === 'off' ? s.segBtnActive : s.segBtn, onClick: () => setFilter('off') },
          `${t('filterOff')} ${offCount}`),
      ]),
    ]),
  ])
}

/** 注入新段表单：「+ 注入」展开，阶段锁定为当前 Tab 的阶段。 */
function InjectForm({ onAdd, phaseLabel, t }: {
  onAdd: (name: string, text: string) => void
  phaseLabel: string
  t: Translate
}): ReactElement {
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const submit = (): void => {
    if (!name.trim()) return
    onAdd(name.trim(), text)
    setName(''); setText('')
  }
  return h('div', { style: s.injectRow }, [
    h('input', { style: { ...s.input, width: '30%' }, placeholder: t('name'), value: name, onChange: (e: ChangeEvent<HTMLInputElement>) => setName(e.target.value) }),
    h('input', { style: { ...s.input, flex: 1 }, placeholder: `${t('text')}（${phaseLabel}）`, value: text, onChange: (e: ChangeEvent<HTMLInputElement>) => setText(e.target.value) }),
    h('button', { style: s.mini, onClick: submit }, t('add')),
  ])
}

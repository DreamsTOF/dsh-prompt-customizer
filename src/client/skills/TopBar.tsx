/**
 * skills/TopBar — 面板顶栏。
 *
 * 「能力管理」标题 + SKILL/MCP 顶层 tab（PanelHead），以及两个页签各自的
 * Agent 预设 chips 与启用状态分段（SkillTopBar / McpTopBar）。
 */
import type { Dispatch, DragEvent, RefObject, SetStateAction } from 'react'
import {
  IconAgentPresetOutline16, IconChevronDownOutline14, IconPlusOutline16, IconRefreshOutline14,
} from '@deepseek-ai/dsh-client-ui-primitives'
import { CatAllIcon, CloudUpIcon, SearchIcon, SortDirIcon } from './icons.js'
import type { LiveMcpStatus } from './mcp-live.js'
import { css } from './styles.js'
import { ALL_PRESETS, UNCATEGORIZED, type HealthViewModel, type PresetRow } from './types.js'

/** 面板头部：标题（能力管理）+ 紧贴文字右侧的 SKILL / MCP / 提示词 顶层 tab。 */
export function PanelHead({ t, kind, onKind }: {
  t: (key: string, params?: Record<string, string | number>) => string
  kind: 'skill' | 'mcp' | 'prompt'
  onKind: (value: 'skill' | 'mcp' | 'prompt') => void
}): JSX.Element {
  return (
      <div className="psh-head">
        <span className="psh-title" style={{ flex: 'none' }}>{t('panelTitle')}</span>
        <div className={css.kindTabs} role="tablist" aria-label="SKILL / MCP / 提示词">
          {([
            ['skill', t('kindSkill')],
            ['mcp', t('kindMcp')],
            ['prompt', t('kindPrompt')],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={kind === value}
              className={`${css.kindTab} ${kind === value ? css.kindTabActive : ''}`}
              data-active={kind === value || undefined}
              onClick={() => { onKind(value) }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
  )
}

/**
 * SKILL 顶栏：Agent 预设 chips（数字 = 该层启用技能数）+ 技能包分类胶囊，
 * 下一行是操作行——搜索 / 名称排序 / 三档计数分段 / 技能健康 / 刷新 · 新建 · 添加。
 * 整块同时是技能文件夹拖放区。
 */
export function SkillTopBar({
  t, dropActive, setDropActive, onDrop, activePreset, setActivePreset, presets, overrides,
  enabledCountFor, totalSkills, enabledCount, disabledCount, healthView, hasCategories, activeCat, setCatFilter,
  categoryList, categoryCounts, bundleCount, statusFilter, setStatusFilter, query, setQuery, openMenu,
  setOpenMenu, sortAsc, setSortAsc, newBundleOpen, onNewBundle, onAdd, onRefresh, fileInput, acceptFiles,
}: {
  t: (key: string, params?: Record<string, string | number>) => string
  dropActive: boolean
  setDropActive: Dispatch<SetStateAction<boolean>>
  onDrop: (event: DragEvent<HTMLDivElement>) => Promise<void>
  activePreset: string
  setActivePreset: Dispatch<SetStateAction<string>>
  presets: PresetRow[]
  overrides: Record<string, Record<string, boolean>>
  enabledCountFor: (presetId: string) => number
  totalSkills: number
  enabledCount: number
  disabledCount: number
  /** 健康扫描展示模型（tone 决定圆点颜色）。 */
  healthView: HealthViewModel
  hasCategories: boolean
  activeCat: string | null
  setCatFilter: Dispatch<SetStateAction<string | null>>
  categoryList: string[]
  categoryCounts: Map<string, number>
  bundleCount: number
  statusFilter: 'all' | 'on' | 'off'
  setStatusFilter: Dispatch<SetStateAction<'all' | 'on' | 'off'>>
  query: string
  setQuery: Dispatch<SetStateAction<string>>
  openMenu: string | null
  setOpenMenu: Dispatch<SetStateAction<string | null>>
  sortAsc: boolean
  setSortAsc: Dispatch<SetStateAction<boolean>>
  newBundleOpen: boolean
  onNewBundle: () => void
  onAdd: () => void
  onRefresh: () => void
  /** 隐藏的目录选择框：添加技能弹窗与顶栏拖放共用。 */
  fileInput: RefObject<HTMLInputElement | null>
  acceptFiles: (files: File[] | null) => void
}): JSX.Element {
  return (
        <div
          className={css.topbar}
          data-drop={dropActive || undefined}
          onDragOver={(event) => { event.preventDefault(); setDropActive(true) }}
          onDragLeave={() => { setDropActive(false) }}
          onDrop={(event) => { void onDrop(event) }}
        >
          <div className={css.chipRow} role="group" aria-label={t('presetCatTitle')}>
            <button
              type="button"
              className={`${css.catItem} ${activePreset === ALL_PRESETS ? css.catItemActive : ''}`}
              data-active={activePreset === ALL_PRESETS || undefined}
              onClick={() => { setActivePreset(ALL_PRESETS) }}
            >
              <span className={css.catIcon} data-active={activePreset === ALL_PRESETS || undefined}><CatAllIcon size={16} /></span>
              <span className={css.catLabel}>{t('presetAll')}</span>
              <span className={css.catCount} title={t('presetCountTip', { n: enabledCountFor(ALL_PRESETS), total: totalSkills })}>{enabledCountFor(ALL_PRESETS)}</span>
            </button>
            {presets.map((preset) => {
              const overrideCount = Object.values(overrides[preset.id] ?? {}).filter((state2) => state2 === false).length
              return (
                <button
                  key={preset.id}
                  type="button"
                  className={`${css.catItem} ${activePreset === preset.id ? css.catItemActive : ''}`}
                  data-active={activePreset === preset.id || undefined}
                  onClick={() => { setActivePreset(preset.id) }}
                >
                  <span className={css.catIcon} data-active={activePreset === preset.id || undefined}><IconAgentPresetOutline16 size={15} /></span>
                  <span className={css.catLabel}>{preset.name ?? preset.id}</span>
                  <span className={css.catCount} data-warn={overrideCount > 0 || undefined}
                    title={t('presetCountTip', { n: enabledCountFor(preset.id), total: totalSkills })
                      + (overrideCount > 0 ? ` · ${t('presetOverrideCount', { n: overrideCount })}` : '')}>
                    {enabledCountFor(preset.id)}
                  </span>
                </button>
              )
            })}
          </div>

          {/* 技能包分类：胶囊即筛选（再点一次取消）。没有一个真分类时不占这一行。 */}
          {hasCategories && (
            <div className={css.catChipRow} role="group" aria-label={t('bundleCatFilterAria')}>
              <span className={css.catChipLabel}>{t('bundleCatTitle')}</span>
              <button
                type="button"
                className={css.catChip}
                data-active={activeCat === null || undefined}
                aria-pressed={activeCat === null}
                onClick={() => { setCatFilter(null) }}
              >
                {t('bundleCatAll')}
                <span className={css.catChipCount}>{bundleCount}</span>
              </button>
              {categoryList.map((cat) => {
                const none = cat === UNCATEGORIZED
                const active = activeCat === cat
                return (
                  <button
                    type="button"
                    key={cat}
                    className={css.catChip}
                    data-active={active || undefined}
                    aria-pressed={active}
                    onClick={() => { setCatFilter(active ? null : cat) }}
                  >
                    {none ? t('bundleCatNone') : cat}
                    <span className={css.catChipCount}>{categoryCounts.get(cat) ?? 0}</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* 操作行：搜索 / 名称排序 / 三档计数分段 / 技能健康 / 刷新 · 新建 · 添加 */}
          <div className={css.topbarActions}>
            <div className={css.searchBox}>
              <SearchIcon />
              <input
                className={css.searchInput}
                value={query}
                placeholder={t('searchPlaceholder')}
                aria-label={t('searchPlaceholder')}
                onChange={(event) => { setQuery(event.currentTarget.value) }}
              />
            </div>
            <div className={css.dropWrap}>
              <button
                type="button"
                className={css.toolButton}
                style={{ height: 36 }}
                aria-haspopup="menu"
                aria-expanded={openMenu === 'sort' || undefined}
                onClick={() => { setOpenMenu((value) => value === 'sort' ? null : 'sort') }}
              >
                {t('sortLabel')}
                <SortDirIcon dir={sortAsc ? 'asc' : 'desc'} size={12} />
                <IconChevronDownOutline14 size={11} aria-hidden="true" />
              </button>
              {openMenu === 'sort' && (
                <>
                  <button type="button" className={css.bulkOverlay} aria-label={t('close')} onClick={() => { setOpenMenu(null) }} />
                  <div className={css.dropMenu} role="menu">
                    <button type="button" role="menuitemradio" className={css.dropItem} aria-checked={sortAsc}
                      onClick={() => { setSortAsc(true); setOpenMenu(null) }}>
                      <span className={css.dropCheck} data-on={sortAsc || undefined} aria-hidden="true">{sortAsc ? '✓' : ''}</span>
                      {t('nameAsc')}
                    </button>
                    <button type="button" role="menuitemradio" className={css.dropItem} aria-checked={!sortAsc}
                      onClick={() => { setSortAsc(false); setOpenMenu(null) }}>
                      <span className={css.dropCheck} data-on={!sortAsc || undefined} aria-hidden="true">{!sortAsc ? '✓' : ''}</span>
                      {t('nameDesc')}
                    </button>
                  </div>
                </>
              )}
            </div>
            <div className={css.statusSeg} role="group" aria-label={t('statusAll')}>
              {([
                ['all', t('statusAll'), enabledCount + disabledCount],
                ['on', t('statusOn'), enabledCount],
                ['off', t('statusOff'), disabledCount],
              ] as const).map(([value, label, count]) => (
                <button
                  key={value}
                  type="button"
                  className={`${css.statusSegBtn} ${statusFilter === value ? css.statusSegActive : ''}`}
                  data-active={statusFilter === value || undefined}
                  aria-pressed={statusFilter === value}
                  onClick={() => { setStatusFilter(value) }}
                >
                  {label}
                  <span className={css.statusSegCount}>{count}</span>
                </button>
              ))}
            </div>
            <span className={css.healthInline} data-tone={healthView.tone} title={healthView.title === '' ? undefined : healthView.title}>
              {t('statSync')} · {healthView.label}
            </span>
            <span className={css.toolbarSpacer} />
            <button
              type="button"
              className={css.toolButton}
              style={{ height: 34, alignSelf: 'center' }}
              onClick={onRefresh}
            >
              <IconRefreshOutline14 size={14} aria-hidden="true" />
              {t('refresh')}
            </button>
            <button
              type="button"
              className={`${css.newBundleBtn} ${newBundleOpen ? css.newBundleBtnOpen : ''}`}
              style={{ width: 'auto', marginTop: 0, height: 34, fontSize: 12 }}
              aria-expanded={newBundleOpen || undefined}
              onClick={onNewBundle}
            >
              <IconPlusOutline16 size={14} aria-hidden="true" />
              {t('newBundle')}
            </button>
            <button
              type="button"
              className={css.addBtn}
              style={{ height: 34, alignSelf: 'center' }}
              aria-label={t('addSkillsTitle')}
              title={t('addSkillsSub')}
              onClick={onAdd}
            >
              <CloudUpIcon size={15} aria-hidden="true" />
              {t('addSkillsTitle')}
            </button>
            <input
              ref={fileInput}
              type="file"
              className={css.hiddenInput}
              multiple
              {...{ webkitdirectory: '' }}
              onChange={(event) => {
                acceptFiles(event.currentTarget.files === null ? null : Array.from(event.currentTarget.files))
              }}
            />
          </div>

        </div>
  )
}
/**
 * MCP 顶栏：与技能页同构的预设 chips（全部 + 各预设，数字 = 该层可见 Server 数）
 * + 启用状态分段。摆在主区之上，与技能页同一位置、同一套类名。
 */
export function McpTopBar({
  t, live, scope, onScope, status, onStatus, query, onQuery, onRefresh, onAddOwn, onAddCustom,
}: {
  t: (key: string, params?: Record<string, string | number>) => string
  live: LiveMcpStatus
  scope: string
  onScope: (value: string) => void
  status: 'all' | 'on' | 'off'
  onStatus: (value: 'all' | 'on' | 'off') => void
  query: string
  onQuery: (value: string) => void
  onRefresh: () => void
  /** 打开「添加专属 Server」（只在预设范围显示这个按钮）。 */
  onAddOwn: () => void
  onAddCustom: () => void
}): JSX.Element {
  const data = live.state === 'ready' ? live.data : null
  const presets = data?.presets ?? []
  const globals = data?.servers ?? []
  const offCount = globals.filter(server => server.config.disabled).length
  const maskedOf = (presetId: string): Set<string> => new Set(
    Object.entries(data?.masks?.[presetId] ?? {}).filter(([, on]) => on === false).map(([name]) => name),
  )
  /** 该预设可见的 Server 数 = 未被它遮蔽的全局 + 它自带的行。 */
  const visibleCount = (presetId: string): number => {
    const masked = maskedOf(presetId)
    return globals.filter(server => !masked.has(server.serverName)).length + (data?.presetServers?.[presetId] ?? []).length
  }
  const chips: Array<{ id: string; label: string; count: number; overrides: number; icon: JSX.Element }> = [
    { id: '', label: t('presetAll'), count: globals.length, overrides: 0, icon: <CatAllIcon size={16} /> },
    ...presets.map(preset => ({
      id: preset.id,
      label: preset.name ?? preset.id,
      count: visibleCount(preset.id),
      overrides: maskedOf(preset.id).size,
      icon: <IconAgentPresetOutline16 size={15} />,
    })),
  ]
  /** 连接状态（替代原「连接状态」统计卡）：指示实时状态接口能否读到注册表。 */
  const conn = live.state === 'ready'
    ? { tone: 'ok', label: t('mcpConnOk'), title: t('mcpConnTip', { n: globals.length }) }
    : live.state === 'loading'
      ? { tone: 'pending', label: t('statChecking'), title: '' }
      : { tone: 'warn', label: t('mcpConnDown'), title: t('mcpLiveUnavailable') }
  return (
    <div className={css.topbar}>
      {presets.length > 0 && (
        <div className={css.chipRow} role="group" aria-label={t('mcpScopeTitle')}>
          {chips.map(chip => (
            <button
              key={chip.id === '' ? '__all__' : chip.id}
              type="button"
              className={`${css.catItem} ${scope === chip.id ? css.catItemActive : ''}`}
              data-active={scope === chip.id || undefined}
              onClick={() => { onScope(chip.id) }}
            >
              <span className={css.catIcon} data-active={scope === chip.id || undefined}>{chip.icon}</span>
              <span className={css.catLabel}>{chip.label}</span>
              <span
                className={css.catCount}
                data-warn={chip.overrides > 0 || undefined}
                title={chip.id === ''
                  ? t('mcpScopeAllTip', { n: chip.count })
                  : t('mcpScopePresetTip', { n: chip.count })
                    + (chip.overrides > 0 ? ` · ${t('mcpScopeOverrideCount', { n: chip.overrides })}` : '')}
              >
                {chip.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 操作行：搜索 / 三档计数分段 / 连接状态 / 刷新 · 添加（与技能页同构） */}
      <div className={css.topbarActions}>
        <div className={css.searchBox}>
          <SearchIcon />
          <input
            className={css.searchInput}
            value={query}
            placeholder={t('mcpSearchServers')}
            aria-label={t('mcpSearchServers')}
            onChange={(event) => { onQuery(event.currentTarget.value) }}
          />
        </div>
        <div className={css.statusSeg} role="group" aria-label={t('statusAll')}>
          {([
            ['all', t('statusAll'), globals.length],
            ['on', t('statusOn'), globals.length - offCount],
            ['off', t('statusOff'), offCount],
          ] as const).map(([value, label, count]) => (
            <button
              key={value}
              type="button"
              className={`${css.statusSegBtn} ${status === value ? css.statusSegActive : ''}`}
              data-active={status === value || undefined}
              aria-pressed={status === value}
              onClick={() => { onStatus(value) }}
            >
              {label}
              <span className={css.statusSegCount}>{count}</span>
            </button>
          ))}
        </div>
        <span className={css.healthInline} data-tone={conn.tone} title={conn.title === '' ? undefined : conn.title}>
          {t('mcpConnStatus')} · {conn.label}
        </span>
        <span className={css.toolbarSpacer} />
        <button
          type="button"
          className={css.toolButton}
          style={{ height: 34, alignSelf: 'center' }}
          onClick={onRefresh}
        >
          {t('mcpLiveRefresh')}
        </button>
        {scope !== '' && (
          <button
            type="button"
            className={css.newBundleBtn}
            style={{ width: 'auto', marginTop: 0, height: 34, fontSize: 12 }}
            onClick={onAddOwn}
          >
            <IconPlusOutline16 size={14} aria-hidden="true" />
            {t('mcpPresetAddOwn')}
          </button>
        )}
        <button
          type="button"
          className={css.addBtn}
          style={{ height: 34, alignSelf: 'center' }}
          aria-label={t('mcpAddServer')}
          title={scope === '' ? undefined : t('mcpAddGlobalHint')}
          onClick={onAddCustom}
        >
          <IconPlusOutline16 size={15} aria-hidden="true" />
          {/* 预设范围下写明这一条是全局的：只想给当前预设用请走左侧的「添加专属 Server」。 */}
          {scope === '' ? t('mcpAddServer') : t('mcpAddServerGlobal')}
        </button>
      </div>
    </div>
  )
}

/** ---------------------------------------------------------------- 预设圆球（历史保留组件，当前面板用 chips） */

/** 球内文字：中文取首字，拉丁取首字母。 */
export function ballInitial(label: string): string {
  const trimmed = label.trim()
  if (trimmed === '') return '?'
  return [...trimmed][0] ?? '?'
}

/** 一个预设圆球（无底色，仅描边轮廓；有单独设置时右下角点亮小圆点）。 */
export function PresetBall({ id, label, active, dot, title, onSelect }: {
  id: string
  label: string
  active: boolean
  dot: boolean
  title: string
  onSelect: () => void
}): JSX.Element {
  return (
    <button
      type="button"
      className={css.presetBallWrap}
      data-active={active ? 'true' : undefined}
      aria-pressed={active}
      title={title}
      onClick={onSelect}
    >
      <span className={css.presetBall} data-dot={dot ? 'true' : undefined}>
        {id === ALL_PRESETS ? <IconAgentPresetOutline16 size={18} aria-hidden="true" /> : ballInitial(label)}
      </span>
      <span className={css.presetBallLabel}>{label}</span>
    </button>
  )
}

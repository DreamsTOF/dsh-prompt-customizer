/**
 * skills/SkillsView — SKILL 页主区：同步提示、预设提示行与技能列表（技能包 + 散装技能）。
 *
 * 纯展示：状态与操作全部由 SkillsPanel 持有，props 注入。搜索、计数、刷新与添加
 * 已上移到顶栏 SkillTopBar，这里只负责列表本体。
 */
import type { Dispatch, FormEvent, SetStateAction } from 'react'
import {
  Button, IconArchiveOutline20, IconCheckOutline16, IconChevronDownOutline14, IconCloseOutline16,
  IconEditOutline16, IconEllipsisOutline16, IconRefreshOutline14, IconTrashOutline16, Menu,
} from '@deepseek-ai/dsh-client-ui-primitives'
import { modalStaggerClass } from '../modal-animation'
import { CloudUpIcon, FolderBlueIcon, TagIcon } from './icons.js'
import { SkillCard } from './SkillCard.js'
import { css } from './styles.js'
import { ALL_PRESETS } from './types.js'
import type { BundleInfo, ConfirmState, HealthView, PanelState, PresetRow, SkillInfo } from './types.js'

export function SkillsView({
  t, state, health, activePreset, presets, presetOverride, resetActivePreset, openMenu, setOpenMenu,
  refresh, noResults, visibleBundleAll, expanded, renameTarget, setRenameTarget, renaming, submitRename,
  bundleEnabledIn, toggling, viewMode, setCatFilter, activeCat, toggleExpanded, renamedFlash, openInstallFor,
  skillEnabledIn, skillLockedReason, scopeLabel, toggleSkill, toggleBundle, openViewer, removeFromBundle,
  pruneBundle, openCatEditor, setConfirm, setAssignTarget, looseOpen, setLooseExpanded, visibleLooseAll,
}: {
  t: (key: string, params?: Record<string, string | number>) => string
  state: PanelState
  health: HealthView
  activePreset: string
  presets: PresetRow[]
  presetOverride: Record<string, boolean>
  resetActivePreset: () => void
  openMenu: string | null
  setOpenMenu: Dispatch<SetStateAction<string | null>>
  refresh: () => void
  noResults: boolean
  visibleBundleAll: BundleInfo[]
  expanded: Set<string>
  renameTarget: { bundleId: string; name: string } | null
  setRenameTarget: Dispatch<SetStateAction<{ bundleId: string; name: string } | null>>
  renaming: boolean
  submitRename: (event: FormEvent<HTMLFormElement>) => Promise<void>
  bundleEnabledIn: (bundle: BundleInfo) => boolean
  toggling: Set<string>
  viewMode: 'grid' | 'list'
  setCatFilter: Dispatch<SetStateAction<string | null>>
  activeCat: string | null
  toggleExpanded: (bundleId: string) => void
  renamedFlash: string | null
  openInstallFor: (bundleId: string) => void
  skillEnabledIn: (name: string) => boolean
  skillLockedReason: (name: string) => string | undefined
  scopeLabel: string
  toggleSkill: (skill: SkillInfo, enabled: boolean) => void
  toggleBundle: (bundle: BundleInfo, enabled: boolean) => void
  openViewer: (skill: SkillInfo) => void
  removeFromBundle: (bundleId: string, name: string) => Promise<void>
  pruneBundle: (bundle: BundleInfo) => Promise<void>
  openCatEditor: (bundle: BundleInfo) => void
  setConfirm: Dispatch<SetStateAction<ConfirmState | null>>
  setAssignTarget: Dispatch<SetStateAction<SkillInfo | null>>
  looseOpen: boolean
  setLooseExpanded: Dispatch<SetStateAction<boolean>>
  visibleLooseAll: SkillInfo[]
}): JSX.Element {
  return (
    <>
          {/* 同步问题明细：只读健康扫描发现 error 级问题时展示（顶栏健康指示悬停看全量） */}
          {health.state === 'issue' && (
            <div className={css.healthNotice} role="status">
              <span className={css.healthNoticeTitle}>{t('statIssues', { n: health.report.issues.length })}</span>
              <ul>
                {health.report.issues.slice(0, 4).map((issue, index) => (
                  <li key={`${issue.code}-${String(index)}`}>{issue.message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 预设提示行：当前编辑层说明 + 清空该预设的单独设置 */}
          <div className={css.hintRow}>
            <span className={css.hintRowText}>
              {activePreset === ALL_PRESETS
                ? t('presetHintAll')
                : t('presetHintScoped', { name: presets.find((preset) => preset.id === activePreset)?.name ?? activePreset })}
            </span>
            {activePreset !== ALL_PRESETS && Object.keys(presetOverride).length > 0 && (
              <button type="button" className={css.presetReset} onClick={resetActivePreset}>
                {t('presetReset')}
              </button>
            )}
          </div>

          {/* 分类 tabs 已移除：与左栏「Agent 预设分类」重复（左栏控制预设切换） */}

          {/* 内容区：技能包 sections + 散装技能 */}
          <div className={`${css.mainScroll} ${modalStaggerClass}`}>
            {state.status === 'loading' ? <p className={css.status}>{t('loading')}</p> : null}
            {state.status === 'error' ? (
              <div className={css.failure}>
                <p role="alert">{t('error')}</p>
                <Button variant="outline" onClick={refresh}><IconRefreshOutline14 /> {t('retry')}</Button>
              </div>
            ) : null}

            {state.status === 'ready' && (
              noResults ? (
                <p className={css.noResult}>{t('noMatch')}</p>
              ) : (
                <>
                  {visibleBundleAll.map((bundle) => {
                    const open2 = expanded.has(bundle.id)
                    const renamingThis = renameTarget?.bundleId === bundle.id
                    const bundleEnabled = bundleEnabledIn(bundle)
                    const bundleToggling = toggling.has(`bundle:${bundle.id}`)
                    const gridClass = viewMode === 'list' ? `${css.skillGrid} ${css.skillGridList}` : css.skillGrid
                    const missing = bundle.missingSkills ?? []
                    const bundleCats = bundle.categories ?? []
                    const emptyBundle = bundle.skillCount === 0
                    // 空包默认展开显示引导：折叠着只剩一行标题，用户会以为包丢了。
                    const openView = open2 || emptyBundle
                    return (
                      <section key={bundle.id} className={css.hubSection} data-open={openView ? 'true' : undefined} data-empty={emptyBundle ? 'true' : undefined}>
                        <header
                          className={css.bundleRowOuter}
                          data-open={openView ? 'true' : undefined}
                        >
                          <button
                            type="button"
                            className={css.bundleRow}
                            aria-expanded={openView}
                            onClick={(event) => {
                              // 标题行里嵌着分类标签：点到标签就是筛选，不该顺手把包展开/收起。
                              // 标签本身是 span（按钮里不能再套按钮），键盘路径走顶栏分类胶囊。
                              const hit = (event.target as HTMLElement).closest('[data-skm-cat]') as HTMLElement | null
                              if (hit !== null) {
                                const cat = hit.dataset.skmCat ?? ''
                                setCatFilter(activeCat === cat ? null : cat)
                                return
                              }
                              toggleExpanded(bundle.id)
                            }}
                          >
                            <span className={css.bundleIcon} aria-hidden="true"><FolderBlueIcon size={17} /></span>
                            <span className={css.bundleName} title={bundle.name}>{bundle.name}</span>
                            <span className={css.bundleCount}>{t('skillsCount', { n: bundle.skillCount })}</span>
                            {bundleCats.length > 0 && (
                              <span className={css.bundleCats}>
                                {bundleCats.map((cat) => (
                                  <span
                                    key={cat}
                                    className={css.bundleCatTag}
                                    data-skm-cat={cat}
                                    data-active={activeCat === cat || undefined}
                                    title={t('bundleCatTip', { name: cat })}
                                  >
                                    {cat}
                                  </span>
                                ))}
                              </span>
                            )}
                            <IconChevronDownOutline14 className={css.chevron} size={13} aria-hidden="true" />
                          </button>
                          {/* 技能包一键开关：整包启用/禁用 */}
                          <span className={css.bundleToggle}>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={bundleEnabled}
                              aria-label={bundleEnabled ? t('disableBundle') : t('enableBundle')}
                              title={bundleEnabled ? t('disableBundle') : t('enableBundle')}
                              className={`${css.toggle} ${bundleEnabled ? css.toggleOn : css.toggleOff}`}
                              disabled={bundleToggling || bundle.skillCount === 0}
                              onClick={(event) => {
                                event.stopPropagation()
                                toggleBundle(bundle, !bundleEnabled)
                              }}
                            >
                              <span className={css.toggleKnob} aria-hidden="true" />
                            </button>
                          </span>
                          <div className={css.bundleMore}>
                            <Menu
                              open={openMenu === `bundle:${bundle.id}`}
                              onClose={() => { setOpenMenu(null) }}
                              onSelect={(id) => {
                                setOpenMenu(null)
                                if (id === 'enable') toggleBundle(bundle, true)
                                else if (id === 'disable') toggleBundle(bundle, false)
                                else if (id === 'rename') setRenameTarget({ bundleId: bundle.id, name: bundle.name })
                                else if (id === 'cat') openCatEditor(bundle)
                                else if (id === 'delete') setConfirm({ kind: 'bundle', bundle })
                              }}
                              portal
                              items={[
                                { id: 'enable', label: t('enableBundle'), icon: <IconCheckOutline16 size={14} /> },
                                { id: 'disable', label: t('disableBundle'), icon: <IconCloseOutline16 size={14} /> },
                                { type: 'separator', id: 'gap' },
                                { id: 'rename', label: t('rename'), icon: <IconEditOutline16 size={14} /> },
                                { id: 'cat', label: t('bundleCatEdit'), icon: <TagIcon /> },
                                { id: 'delete', label: t('delete'), icon: <IconTrashOutline16 size={14} />, danger: true },
                              ]}
                              anchor={(
                                <button
                                  type="button"
                                  className={css.bundleMoreBtn}
                                  aria-label={t('moreActions')}
                                  aria-haspopup="menu"
                                  aria-expanded={openMenu === `bundle:${bundle.id}` || undefined}
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    setOpenMenu(openMenu === `bundle:${bundle.id}` ? null : `bundle:${bundle.id}`)
                                  }}
                                >
                                  <IconEllipsisOutline16 size={15} aria-hidden="true" />
                                </button>
                              )}
                            />
                          </div>
                        </header>
                        {renamingThis && renameTarget !== null && (
                          <form className={`${css.inlineForm} ${css.inlineFormBlock}`} onSubmit={(event) => { void submitRename(event) }}>
                            <input className={css.inlineInput} value={renameTarget.name} placeholder={t('renameBundlePlaceholder')}
                              aria-label={t('renameBundlePlaceholder')} autoFocus disabled={renaming}
                              onChange={(event) => {
                                // 先把值取出再进 setState 回调：React 合成事件在
                                // 回调执行完毕后会把 currentTarget 置空，若在函数式
                                // updater 里才读 event.currentTarget.value，渲染阶段
                                // 会抛 Cannot read properties of null，整个技能面板
                                // 被 ErrorBoundary 摘掉——表现就是「改名时卡片消失」。
                                const next = event.currentTarget.value
                                setRenameTarget((current) => current === null ? current : { ...current, name: next })
                              }} />
                            <Button variant="primary" type="submit" disabled={renaming || renameTarget.name.trim() === ''}>{t('rename')}</Button>
                            <Button variant="outline" type="button" disabled={renaming} onClick={() => { setRenameTarget(null) }}>{t('cancel')}</Button>
                          </form>
                        )}
                        {missing.length > 0 && (
                          <div className={css.bundleMissing} role="status">
                            <span>{t('bundleMissingN', { n: missing.length })}</span>
                            <code>{missing.join('、')}</code>
                            <button type="button" className={css.bundleMissingBtn} onClick={() => { void pruneBundle(bundle) }}>
                              {t('bundlePrune')}
                            </button>
                          </div>
                        )}
                        {openView && (
                          <ul className={gridClass} data-renamed={renamedFlash === bundle.id ? 'true' : undefined}>
                            {bundle.skills.length === 0 ? (
                              <li className={css.bundleEmpty}>
                                <span className={css.bundleEmptyTitle}>{t('bundleEmptyTitle')}</span>
                                <span className={css.bundleEmptyHint}>{t('bundleEmptyHint')}</span>
                                <button type="button" className={css.bundleEmptyBtn} onClick={() => { openInstallFor(bundle.id) }}>
                                  <CloudUpIcon size={14} />
                                  {t('bundleUploadHere')}
                                </button>
                              </li>
                            ) : bundle.skills.map((skill, index) => (
                              <SkillCard key={skill.name} skill={skill} bundleId={bundle.id} bundleName={bundle.name}
                                enabled={skillEnabledIn(skill.name)}
                                lockedReason={skillLockedReason(skill.name)}
                                scopeLabel={scopeLabel}
                                index={index}
                                onToggle={toggleSkill}
                                onView={openViewer}
                                onRemove={(s) => { void removeFromBundle(bundle.id, s.name) }}
                                onDelete={(s) => { setConfirm({ kind: 'skill', name: s.name, dir: s.dir }) }} />
                            ))}
                          </ul>
                        )}
                      </section>
                    )
                  })}

                  {visibleLooseAll.length > 0 && (
                    <section className={css.hubSection} data-open={looseOpen ? 'true' : undefined}>
                      <header
                        className={css.bundleRowOuter}
                        data-open={looseOpen ? 'true' : undefined}
                      >
                        <button
                          type="button"
                          className={css.bundleRow}
                          aria-expanded={looseOpen}
                          onClick={() => { setLooseExpanded((value) => !value) }}
                        >
                          <span className={css.bundleIcon} aria-hidden="true"><IconArchiveOutline20 size={16} /></span>
                          <span className={css.bundleName}>{t('looseTitle')}</span>
                          <span className={css.bundleCount}>{t('skillsCount', { n: visibleLooseAll.length })}</span>
                          <IconChevronDownOutline14 className={css.chevron} size={13} aria-hidden="true" />
                        </button>
                      </header>
                      {looseOpen && (
                        <ul className={viewMode === 'list' ? `${css.skillGrid} ${css.skillGridList}` : css.skillGrid}>
                          {visibleLooseAll.map((skill, index) => (
                            <SkillCard key={skill.name} skill={skill} bundleId={null} bundleName={null}
                              enabled={skillEnabledIn(skill.name)}
                              lockedReason={skillLockedReason(skill.name)}
                              scopeLabel={scopeLabel}
                              index={index}
                              onToggle={toggleSkill}
                              onView={openViewer}
                              onAssign={(s) => { setAssignTarget(s) }}
                              onDelete={(s) => { setConfirm({ kind: 'skill', name: s.name, dir: s.dir }) }} />
                          ))}
                        </ul>
                      )}
                    </section>
                  )}

                  {/* 新建技能包入口已移至左栏（newBundleBtn） */}
                </>
              )
            )}
          </div>
    </>
  )
}

/**
 * skills/styles — 面板全套样式：css 类名表 + 注入用的 SHEET + ensureStyles()。
 */

/** ---------------------------------------------------------------- 样式 */

export const css = {
  entry: 'skm-entry',
  label: 'skm-label',
  // SKILL / MCP 顶层 tab + MCP 占位
  kindTabs: 'skm-kind-tabs',
  kindTab: 'skm-kind-tab',
  kindTabActive: 'skm-kind-tab-active',
  mcpEmpty: 'skm-mcp-empty',
  mcpEmptyIcon: 'skm-mcp-empty-icon',
  mcpEmptyTitle: 'skm-mcp-empty-title',
  mcpEmptyDesc: 'skm-mcp-empty-desc',
  mcpPage: 'skm-mcp-view-root',
  mcpViewRoot: 'skm-mcp-view-root',
  mcpSide: 'skm-mcp-side',
  mcpMain: 'skm-mcp-main',
  mcpServerLayout: 'skm-mcp-server-layout',
  mcpServerMain: 'skm-mcp-server-main',
  mcpHeader: 'skm-mcp-header',
  mcpHeaderText: 'skm-mcp-header-text',
  mcpHeaderTitleRow: 'skm-mcp-header-title-row',
  mcpHeaderTitle: 'skm-mcp-header-title',
  mcpHeaderBadge: 'skm-mcp-header-badge',
  mcpHeaderSub: 'skm-mcp-header-sub',
  mcpHeaderActions: 'skm-mcp-header-actions',
  mcpMarketBtn: 'skm-mcp-market-btn',
  mcpAddBtn: 'skm-mcp-add-btn',
  mcpBellBtn: 'skm-mcp-bell-btn',
  mcpEmptyList: 'skm-mcp-empty-list',
  mcpCopyHint: 'skm-mcp-copy-hint',
  mcpIntroCard: 'skm-mcp-intro-card',
  mcpIntroBody: 'skm-mcp-intro-body',
  mcpIntroTitle: 'skm-mcp-intro-title',
  mcpIntroDesc: 'skm-mcp-intro-desc',
  mcpIntroBtn: 'skm-mcp-intro-btn',
  mcpInfoOverlay: 'skm-mcp-info-overlay',
  mcpInfoOverlayHead: 'skm-mcp-info-overlay-head',
  mcpInfoOverlayIcon: 'skm-mcp-info-overlay-icon',
  mcpInfoOverlayTitle: 'skm-mcp-info-overlay-title',
  mcpInfoOverlayBody: 'skm-mcp-info-overlay-body',
  mcpRow: 'skm-mcp-row',
  mcpRowLogo: 'skm-mcp-row-logo',
  mcpRowBody: 'skm-mcp-row-body',
  mcpRowNameRow: 'skm-mcp-row-name-row',
  mcpRowName: 'skm-mcp-row-name',
  mcpRowTag: 'skm-mcp-row-tag',
  mcpRowExt: 'skm-mcp-row-ext',
  mcpRowDesc: 'skm-mcp-row-desc',
  mcpRowStatus: 'skm-mcp-row-status',
  mcpViewAll: 'skm-mcp-view-all',
  mcpAddSmallBtn: 'skm-mcp-add-small-btn',
  mcpRecommendTitle: 'skm-mcp-recommend-title',
  mcpRecHead: 'skm-mcp-rec-head',
  mcpRecCatsRow: 'skm-mcp-rec-cats-row',
  mcpRecResultsTitle: 'skm-mcp-rec-results-title',
  mcpRecStars: 'skm-mcp-rec-stars',
  mcpOpenLink: 'skm-mcp-open-link',
  mcpRecCardExternal: 'skm-mcp-rec-card-external',
  mcpResolveErr: 'skm-mcp-resolve-err',
  mcpExtActions: 'skm-mcp-ext-actions',
  mcpCardFoot: 'skm-mcp-card-foot',
  mcpCardItem: 'skm-mcp-card-item',
  mcpCardItemLabel: 'skm-mcp-card-item-label',
  mcpCardItemMeta: 'skm-mcp-card-item-meta',
  mcpCardDelete: 'skm-mcp-card-delete',
  mcpToolChips: 'skm-mcp-tool-chips',
  mcpToolChip: 'skm-mcp-tool-chip',
  mcpRecCats: 'skm-mcp-rec-cats',
  mcpRecCat: 'skm-mcp-rec-cat',
  mcpRecCatActive: 'skm-mcp-rec-cat-active',
  mcpRecGrid: 'skm-mcp-rec-grid',
  mcpRecCard: 'skm-mcp-rec-card',
  mcpRecCardHead: 'skm-mcp-rec-card-head',
  mcpRecCardTitleRow: 'skm-mcp-rec-card-title-row',
  mcpRecCardName: 'skm-mcp-rec-card-name',
  mcpRecCardTags: 'skm-mcp-rec-card-tags',
  mcpRecCatTag: 'skm-mcp-rec-cat-tag',
  mcpRecCardDesc: 'skm-mcp-rec-card-desc',
  mcpRecCardFoot: 'skm-mcp-rec-card-foot',
  mcpRecCardMeta: 'skm-mcp-rec-card-meta',
  mcpAddedTag: 'skm-mcp-added-tag',
  mcpAddForm: 'skm-mcp-add-form',
  mcpAddTypeRow: 'skm-mcp-add-type-row',
  mcpAddTypeBtn: 'skm-mcp-add-type-btn',
  mcpAddTypeActive: 'skm-mcp-add-type-active',
  mcpToolSearch: 'skm-mcp-tool-search',
  mcpToolSearchInput: 'skm-mcp-tool-search-input',
  mcpLogRow: 'skm-mcp-log-row',
  mcpLogDot: 'skm-mcp-log-dot',
  mcpLogBody: 'skm-mcp-log-body',
  mcpLogText: 'skm-mcp-log-text',
  mcpLogClear: 'skm-mcp-log-clear',
  mcpConfigGrid: 'skm-mcp-config-grid',
  mcpConfigCard: 'skm-mcp-config-card',
  mcpConfigHead: 'skm-mcp-config-head',
  mcpConfigTitle: 'skm-mcp-config-title',
  mcpConfigCopy: 'skm-mcp-config-copy',
  mcpConfigCode: 'skm-mcp-config-code',
  mcpInfoCol: 'skm-mcp-info-col',
  mcpInfoCard: 'skm-mcp-info-card',
  mcpInfoCardTitle: 'skm-mcp-info-card-title',
  mcpInfoDesc: 'skm-mcp-info-desc',
  mcpInfoPoints: 'skm-mcp-info-points',
  mcpPoint: 'skm-mcp-point',
  mcpPointIcon: 'skm-mcp-point-icon',
  mcpPointBody: 'skm-mcp-point-body',
  mcpPointTitle: 'skm-mcp-point-title',
  mcpPointDesc: 'skm-mcp-point-desc',
  mcpFlow: 'skm-mcp-flow',
  mcpFlowNode: 'skm-mcp-flow-node',
  mcpFlowIcon: 'skm-mcp-flow-icon',
  mcpFlowLabel: 'skm-mcp-flow-label',
  mcpFlowArrow: 'skm-mcp-flow-arrow',
  mcpFlowArrowText: 'skm-mcp-flow-arrow-text',
  mcpFlowExt: 'skm-mcp-flow-ext',
  mcpFlowExtLabel: 'skm-mcp-flow-ext-label',
  mcpFlowExtIcons: 'skm-mcp-flow-ext-icons',
  mcpFlowExtIcon: 'skm-mcp-flow-ext-icon',
  mcpApiText: 'skm-mcp-api-text',
  mcpSteps: 'skm-mcp-steps',
  mcpStep: 'skm-mcp-step',
  mcpStepNum: 'skm-mcp-step-num',
  mcpStepBody: 'skm-mcp-step-body',
  mcpStepTitle: 'skm-mcp-step-title',
  mcpStepDesc: 'skm-mcp-step-desc',
  modal: 'skm-modal',
  modalBody: 'skm-modal-body',
  panel: 'skm-panel',
  topRow: 'skm-top-row',
  newBundleButton: 'skm-new-bundle',
  upload: 'skm-upload',
  uploadActive: 'skm-upload-active',
  hiddenInput: 'skm-hidden-input',
  installForm: 'skm-install-form',
  installRow: 'skm-install-row',
  inlineForm: 'skm-inline-form',
  // 技能包分类：顶栏胶囊行 / 包名旁标签 / 分类编辑器
  stackForm: 'skm-stack-form',
  catChipRow: 'skm-cat-chip-row',
  catChipLabel: 'skm-cat-chip-label',
  catChip: 'skm-cat-chip',
  catChipCount: 'skm-cat-chip-count',
  bundleCats: 'skm-bundle-cats',
  bundleCatTag: 'skm-bundle-cat-tag',
  catEditor: 'skm-cat-editor',
  catEmpty: 'skm-cat-empty',
  catSelected: 'skm-cat-selected',
  catSelectedTag: 'skm-cat-selected-tag',
  catSelectedName: 'skm-cat-selected-name',
  catRemove: 'skm-cat-remove',
  catSuggest: 'skm-cat-suggest',
  catPreset: 'skm-cat-preset',
  catPresetPlus: 'skm-cat-preset-plus',
  catInput: 'skm-cat-input',
  catLimit: 'skm-cat-limit',
  // 块级变体：改名输入行独占一整行（整行内容保留，表单追加在其下方）。
  inlineFormBlock: 'skm-inline-form-block',
  inlineInput: 'skm-inline-input',
  bundleSelect: 'skm-bundle-select',
  installMeta: 'skm-install-meta',
  installActions: 'skm-install-actions',
  sectionTitle: 'skm-section-title',
  status: 'skm-status',
  failure: 'skm-failure',
  error: 'skm-error',
  bundleList: 'skm-bundle-list',
  bundle: 'skm-bundle',
  bundleRow: 'skm-bundle-row',
  bundleName: 'skm-bundle-name',
  bundleCount: 'skm-bundle-count',
  chevron: 'skm-chevron',
  bundleActions: 'skm-bundle-actions',
  iconAction: 'skm-icon-action',
  skillList: 'skm-skill-list',
  skillItem: 'skm-skill-item',
  skillRow: 'skm-skill-row',
  skillLabel: 'skm-skill-label',
  skillName: 'skm-skill-name',
  skillDescription: 'skm-skill-desc',
  skillExpand: 'skm-skill-expand',
  skillCount: 'skm-skill-count',
  skillCompat: 'skm-skill-compat',
  // 技能卡片（Skills Hub 风格）
  skillGrid: 'skm-skill-grid',
  skillCard: 'skm-skill-card',
  skillCardHead: 'skm-skill-card-head',
  skillIcon: 'skm-skill-icon',
  skillBadge: 'skm-skill-badge',
  skillTitleWrap: 'skm-skill-title-wrap',
  skillTitle: 'skm-skill-title',
  skillCopy: 'skm-skill-copy',
  skillCardToggle: 'skm-skill-card-toggle',
  skillDesc: 'skm-skill-card-desc',
  skillTags: 'skm-skill-tags',
  tag: 'skm-tag',
  tagSource: 'skm-tag-source',
  tagScope: 'skm-tag-scope',
  skillMeta: 'skm-skill-meta',
  skillCardFoot: 'skm-skill-card-foot',
  skillFootLabel: 'skm-skill-foot-label',
  skillFootIcon: 'skm-skill-foot-icon',
  skillCardActions: 'skm-skill-card-actions',
  // Skills Hub 页面结构
  hub: 'skm-hub',
  hubRow: 'skm-hub-row',
  hubSide: 'skm-hub-side',
  topbar: 'skm-topbar',
  chipRow: 'skm-chip-row',
  hubBrand: 'skm-hub-brand',
  hubLogo: 'skm-hub-logo',
  hubBrandText: 'skm-hub-brand-text',
  hubBrandTitle: 'skm-hub-brand-title',
  hubBrandSub: 'skm-hub-brand-sub',
  hubGroup: 'skm-hub-group',
  hubItem: 'skm-hub-item',
  hubItemActive: 'skm-hub-item-active',
  hubItemIcon: 'skm-hub-item-icon',
  hubItemLabel: 'skm-hub-item-label',
  hubItemCount: 'skm-hub-item-count',
  // 左栏：技能分类 / 快捷筛选 / 添加技能卡
  catTitle: 'skm-cat-title',
  catItem: 'skm-cat-item',
  catItemActive: 'skm-cat-item-active',
  catIcon: 'skm-cat-icon',
  catLabel: 'skm-cat-label',
  catCount: 'skm-cat-count',
  filterBlock: 'skm-filter-block',
  filterRow: 'skm-filter-row',
  filterRowLabel: 'skm-filter-row-label',
  filterRowLabelStrong: 'skm-filter-row-label-strong',
  filterRowChevron: 'skm-filter-row-chevron',
  filterRowWrap: 'skm-filter-row-wrap',
  filterMenu: 'skm-filter-menu',
  filterOption: 'skm-filter-option',
  presetDot: 'skm-preset-dot',
  filtersTitle: 'skm-filters-title',
  statusSeg: 'skm-status-seg',
  statusSegBtn: 'skm-status-seg-btn',
  statusSegActive: 'skm-status-seg-active',
  statusSegCount: 'skm-status-seg-count',
  topbarActions: 'skm-topbar-actions',
  healthInline: 'skm-health-inline',
  addCard: 'skm-add-card',
  addCardHead: 'skm-add-card-head',
  addCardIcon: 'skm-add-card-icon',
  addCardTitle: 'skm-add-card-title',
  addCardSub: 'skm-add-card-sub',
  addDrop: 'skm-add-drop',
  addDropIcon: 'skm-add-drop-icon',
  addDropText: 'skm-add-drop-text',
  addDropHint: 'skm-add-drop-hint',
  addBtn: 'skm-add-btn',
  // 快速上手指南卡
  guideCard: 'skm-guide-card',
  guideTitle: 'skm-guide-title',
  guideDesc: 'skm-guide-desc',
  guideBtn: 'skm-guide-btn',
  guideArt: 'skm-guide-art',
  // 右侧指南栏
  guidePanel: 'skm-guide-panel',
  guidePanelHead: 'skm-guide-panel-head',
  guidePanelLogo: 'skm-guide-panel-logo',
  guidePanelTitle: 'skm-guide-panel-title',
  guidePanelClose: 'skm-guide-panel-close',
  guidePanelBody: 'skm-guide-panel-body',
  guideSec: 'skm-guide-sec',
  guideSecHead: 'skm-guide-sec-head',
  guideSecIcon: 'skm-guide-sec-icon',
  guideSecTitle: 'skm-guide-sec-title',
  guideWhatDesc: 'skm-guide-what-desc',
  guideCaps: 'skm-guide-caps',
  guideCap: 'skm-guide-cap',
  guideCapIcon: 'skm-guide-cap-icon',
  guideCapLabel: 'skm-guide-cap-label',
  guideStep: 'skm-guide-step',
  guideStepNum: 'skm-guide-step-num',
  guideStepBody: 'skm-guide-step-body',
  guideStepTitleRow: 'skm-guide-step-title-row',
  guideStepTitle: 'skm-guide-step-title',
  guideStepArrow: 'skm-guide-step-arrow',
  guideStepDesc: 'skm-guide-step-desc',
  guideFullBtn: 'skm-guide-full-btn',
  guideBest: 'skm-guide-best',
  guideBestTitle: 'skm-guide-best-title',
  guideBestList: 'skm-guide-best-list',
  guideBestItem: 'skm-guide-best-item',
  guideMoreBtn: 'skm-guide-more-btn',
  guideBestArt: 'skm-guide-best-art',
  hubMain: 'skm-hub-main',
  // 分组行
  bundleRowOuter: 'skm-bundle-row-outer',
  bundleIcon: 'skm-bundle-icon',
  bundleMore: 'skm-bundle-more',
  bundleMoreBtn: 'skm-bundle-more-btn',
  // 分页
  pagination: 'skm-pagination',
  pageInfo: 'skm-page-info',
  pageBtns: 'skm-page-btns',
  pageBtn: 'skm-page-btn',
  pageBtnActive: 'skm-page-btn-active',
  pageSizeSel: 'skm-page-size-sel',
  newBundleBtn: 'skm-new-bundle-btn',
  newBundleBtnOpen: 'skm-new-bundle-btn-open',
  toolbar: 'skm-toolbar',
  searchBox: 'skm-search-box',
  searchInput: 'skm-search-input',
  toolSelectWrap: 'skm-tool-select-wrap',
  toolSelect: 'skm-tool-select',
  toolSelectChevron: 'skm-tool-select-chevron',
  dropWrap: 'skm-drop-wrap',
  dropMenu: 'skm-drop-menu',
  dropItem: 'skm-drop-item',
  dropCheck: 'skm-drop-check',
  dropBadge: 'skm-drop-badge',
  toolButton: 'skm-tool-button',
  toolbarSpacer: 'skm-toolbar-spacer',
  bulkOverlay: 'skm-bulk-overlay',
  presetPill: 'skm-preset-pill',
  presetSelect: 'skm-preset-select',
  presetPillChevron: 'skm-preset-pill-chevron',
  presetPillLabel: 'skm-preset-pill-label',
  viewToggle: 'skm-view-toggle',
  viewBtn: 'skm-view-btn',
  hintRow: 'skm-hint-row',
  hintRowText: 'skm-hint-row-text',
  banner: 'skm-banner',
  bannerActive: 'skm-banner-active',
  bannerIcon: 'skm-banner-icon',
  bannerText: 'skm-banner-text',
  bannerTitle: 'skm-banner-title',
  bannerSub: 'skm-banner-sub',
  bannerBtn: 'skm-banner-btn',
  mainScroll: 'skm-main-scroll',
  hubSection: 'skm-hub-section',
  hubSectionHead: 'skm-hub-section-head',
  skillGridList: 'skm-skill-grid-list',
  noResult: 'skm-no-result',
  // 归入技能包弹窗（卡片化）
  assignModal: 'skm-assign-modal',
  assignModalBody: 'skm-assign-modal-body',
  assignList: 'skm-assign-list',
  assignCard: 'skm-assign-card',
  assignCardIcon: 'skm-assign-card-icon',
  assignCardBody: 'skm-assign-card-body',
  assignCardName: 'skm-assign-card-name',
  assignCardDesc: 'skm-assign-card-desc',
  assignGo: 'skm-assign-go',
  // 同步状态健康检查
  healthNotice: 'skm-health-notice',
  healthNoticeTitle: 'skm-health-notice-title',
  skillFiles: 'skm-skill-files',
  skillFile: 'skm-skill-file',
  skillPreview: 'skm-skill-preview',
  viewerModal: 'skm-viewer-modal',
  viewerBody: 'skm-viewer-body',
  viewerLayout: 'skm-viewer-layout',
  viewerNav: 'skm-viewer-nav',
  viewerNavItem: 'skm-viewer-nav-item',
  viewerNavDir: 'skm-viewer-nav-dir',
  viewerContent: 'skm-viewer-content',
  viewerModalFull: 'skm-viewer-modal-full',
  viewerToolbar: 'skm-viewer-toolbar',
  viewerPath: 'skm-viewer-path',
  viewerToolGroup: 'skm-viewer-tool-group',
  viewerToolBtn: 'skm-viewer-tool-btn',
  viewerToolBtnA1: 'skm-viewer-tool-btn-a1',
  viewerToolBtnA3: 'skm-viewer-tool-btn-a3',
  viewerToolBtnFrame: 'skm-viewer-tool-btn-frame',
  looseEmpty: 'skm-loose-empty',
  visuallyHidden: 'skm-visually-hidden',
  // 技能/技能包开关
  toggle: 'skm-toggle',
  toggleOn: 'skm-toggle-on',
  toggleOff: 'skm-toggle-off',
  toggleKnob: 'skm-toggle-knob',
  bundleToggle: 'skm-bundle-toggle',
  // Agent 预设分类（圆球）
  presetStrip: 'skm-preset-strip',
  presetBallWrap: 'skm-preset-ball-wrap',
  presetBall: 'skm-preset-ball',
  presetBallLabel: 'skm-preset-ball-label',
  presetHint: 'skm-preset-hint',
  presetHintText: 'skm-preset-hint-text',
  presetReset: 'skm-preset-reset',
  // 空技能包 / 失效引用 / 面板级提示条
  toastStack: 'skm-toast-stack',
  toast: 'skm-toast',
  toastOk: 'skm-toast-ok',
  toastErr: 'skm-toast-err',
  toastDot: 'skm-toast-dot',
  bundleEmpty: 'skm-bundle-empty',
  bundleEmptyTitle: 'skm-bundle-empty-title',
  bundleEmptyHint: 'skm-bundle-empty-hint',
  bundleEmptyBtn: 'skm-bundle-empty-btn',
  bundleMissing: 'skm-bundle-missing',
  bundleMissingBtn: 'skm-bundle-missing-btn',
  installHint: 'skm-install-hint',
  tagStatus: 'skm-tag-status',
}

export const STYLE_ID = 'dsh-skill-manager-styles'
export const SHEET = `
.skm-entry{flex:1 1 50%;min-width:0;display:inline-flex;align-items:center;gap:8px;height:32px;box-sizing:border-box;border:none;border-radius:10px;padding:0 8px;background:transparent;cursor:pointer;color:var(--dsw-alias-label-primary,#eee);font-family:inherit;font-size:14px;line-height:20px;overflow:hidden}
.skm-entry:hover{background:transparent}
.skm-entry[aria-expanded='true']{background:transparent;color:var(--dsw-alias-label-primary,#eee)}
.skm-entry:focus,.skm-entry:focus-visible{outline:none;border:none}
.skm-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.skm-modal-body{overflow:hidden;display:flex;flex-direction:column}
.skm-panel{flex:1;min-height:0;display:flex;flex-direction:column;gap:8px;overflow-y:auto;padding:2px 2px 6px;box-sizing:border-box}
.skm-top-row{flex:none;display:flex;align-items:center;justify-content:flex-end;gap:8px}
.skm-new-bundle{flex:none;display:inline-flex;align-items:center;gap:4px;appearance:none;border:none;border-radius:12px;padding:4px 10px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,#999);background:transparent;cursor:pointer}
.skm-new-bundle:hover,.skm-new-bundle[aria-expanded='true']{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06));color:var(--dsw-alias-label-primary,#eee)}
.skm-upload{flex:none;display:flex;align-items:center;justify-content:center;gap:8px;min-height:56px;padding:10px 12px;box-sizing:border-box;border:1px dashed var(--dsw-alias-border-l3,#444);border-radius:12px;color:var(--dsw-alias-label-tertiary,#888);font-size:12px;line-height:18px;text-align:center;cursor:pointer;user-select:none}
.skm-upload:hover{border-color:var(--dsw-alias-state-business-primary,#4a9eff);color:var(--dsw-alias-label-secondary,#bbb)}
.skm-upload-active{border-color:var(--dsw-alias-state-business-primary,#4a9eff);background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
.skm-hidden-input{display:none}
.skm-install-form{flex:none;display:flex;flex-direction:column;gap:8px;padding:10px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));border-radius:12px;background:var(--dsw-alias-bg-layer-1,#1c1f26)}
.skm-install-row{display:flex;flex-direction:column;gap:6px}
.skm-inline-form{flex:none;display:flex;align-items:center;gap:6px}
/* 块级变体：width:100% 让它在 .skm-bundle（flex-wrap）里自动换行独占一行，
   输入框因此能吃满整行宽度，不必被两个按钮挤到只剩默认 20 字符。 */
.skm-inline-form-block{width:100%;box-sizing:border-box;padding:0 8px 8px;animation:skm-form-in 160ms ease-out}
@keyframes skm-form-in{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
/* 改名成功：卡片边框高亮脉冲（1 秒后回落），与整体深色卡片节奏一致 */
.skm-bundle[data-renamed='true']{animation:skm-card-pop 900ms ease-out}
@keyframes skm-card-pop{0%{border-color:var(--dsw-alias-state-business-primary,#4a9eff);box-shadow:0 0 0 1px var(--dsw-alias-state-business-primary,#4a9eff)}55%{border-color:var(--dsw-alias-state-business-primary,#4a9eff);box-shadow:0 0 0 1px var(--dsw-alias-state-business-primary,#4a9eff)}100%{border-color:var(--dsw-alias-border-l1,rgba(255,255,255,.08));box-shadow:none}}
.skm-inline-input{flex:1;min-width:0;height:32px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));border-radius:8px;padding:0 10px;font-size:13px;color:var(--dsw-alias-label-primary,#eee);background:var(--dsw-alias-bg-base,#0e1116)}
.skm-inline-input::placeholder{color:var(--dsw-alias-label-tertiary,#888)}
.skm-bundle-select{display:flex;align-items:center}
.skm-bundle-select select{flex:1;height:32px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));border-radius:8px;padding:0 8px;font-size:13px;color:var(--dsw-alias-label-primary,#eee);background:var(--dsw-alias-bg-base,#0e1116)}
.skm-install-meta{font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary,#888)}
.skm-install-actions{display:flex;align-items:center;gap:6px}
.skm-section-title{margin:6px 2px 0;font-size:12px;font-weight:600;line-height:18px;color:var(--dsw-alias-label-secondary,#bbb)}
.skm-status{margin:2px;font-size:13px;line-height:20px;color:var(--dsw-alias-label-tertiary,#888)}
.skm-failure{display:flex;align-items:center;gap:8px}
.skm-failure p{margin:2px;font-size:13px;line-height:20px;color:var(--dsw-alias-state-error-primary,#e0434b)}
.skm-error{margin:0;font-size:12px;line-height:18px;color:var(--dsw-alias-state-error-primary,#e0434b)}
.skm-bundle-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px}
/* 分组行（参考设计稿）：白底圆角行，蓝文件夹图标 + 名称 + 计数 pill + chevron + 更多 */
.skm-bundle-row-outer{flex:none;display:flex;align-items:center;gap:6px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.08));border-radius:11px;background:var(--dsw-alias-bg-base,#fff);padding:2px 6px 2px 10px;min-height:40px;transition:border-color 160ms ease,box-shadow 160ms ease,background 160ms ease}
.skm-bundle-row-outer:hover{border-color:var(--dsw-alias-border-l3,rgba(0,0,0,.14));box-shadow:0 2px 8px rgba(16,24,40,.06)}
.skm-bundle-row{flex:1;min-width:0;display:inline-flex;align-items:center;gap:10px;appearance:none;border:none;background:transparent;padding:6px 2px;font-size:14px;cursor:pointer;color:var(--dsw-alias-label-primary,#1f2430);font-family:inherit;border-radius:8px;text-align:left;transition:background 140ms ease}
.skm-bundle-row:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.02))}
.skm-bundle-icon{flex:none;display:inline-flex;align-items:center;justify-content:center;color:var(--dsw-alias-state-business-primary,#3d6be5)}
.skm-bundle-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600;display:inline-flex;align-items:center;gap:6px}
.skm-bundle-count{flex:none;font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary,#61666b);background:var(--dsw-alias-bg-module-platform,#f1f3f5);border-radius:999px;padding:0 8px;white-space:nowrap}
/* ── 技能包分类：顶栏胶囊筛选 / 包名旁标签 / 分类编辑器 ─────────────────────── */
/* 配色只走主题蓝一把刷子（与 .skm-tag 同语言）；分类名不参与配色——
   彩虹色板实测视觉太吵，与面板其余部分打架，已否。 */
.skm-stack-form{display:flex;flex-direction:column;gap:10px}
.skm-cat-chip-row{flex:1 1 100%;order:3;display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding-top:2px;animation:skm-cat-row-in 220ms cubic-bezier(.2,.8,.2,1) both}
@keyframes skm-cat-row-in{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
.skm-cat-chip-label{flex:none;font-size:11.5px;line-height:18px;letter-spacing:.02em;color:var(--dsw-alias-label-tertiary,#81858c)}
.skm-cat-chip{flex:none;display:inline-flex;align-items:center;gap:5px;height:26px;box-sizing:border-box;padding:0 9px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:999px;background:var(--dsw-alias-bg-base,#fff);color:var(--dsw-alias-label-secondary,#61666b);font-family:inherit;font-size:12px;line-height:18px;cursor:pointer;transition:color 150ms ease,border-color 150ms ease,background 150ms ease,box-shadow 200ms ease,transform 120ms ease}
.skm-cat-chip:hover{border-color:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 52%,transparent);color:var(--dsw-alias-label-primary,#1f2430);transform:translateY(-1px)}
.skm-cat-chip:active{transform:translateY(0) scale(.97)}
.skm-cat-chip[data-active]{border-color:transparent;background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 15%,transparent);color:var(--dsw-alias-state-business-primary,#3d6be5);font-weight:600;box-shadow:0 0 0 1px color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 36%,transparent),0 2px 10px color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 20%,transparent)}
.skm-cat-chip-count{flex:none;min-width:16px;padding:0 5px;box-sizing:border-box;border-radius:999px;background:var(--dsw-alias-bg-module-platform,rgba(0,0,0,.05));color:var(--dsw-alias-label-tertiary,#81858c);font-size:10.5px;line-height:16px;font-variant-numeric:tabular-nums;transition:background 160ms ease,color 160ms ease}
.skm-cat-chip[data-active] .skm-cat-chip-count{background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 22%,transparent);color:var(--dsw-alias-state-business-primary,#3d6be5)}
/* 包名旁标签：整颗可点（点在标题行里，由 JS 分流成筛选而非展开），带入场弹入。 */
.skm-bundle-cats{flex:none;display:inline-flex;align-items:center;gap:4px;flex-wrap:wrap;min-width:0}
.skm-bundle-cat-tag{display:inline-flex;align-items:center;gap:4px;height:19px;box-sizing:border-box;padding:0 7px;border-radius:999px;font-size:11px;line-height:17px;white-space:nowrap;cursor:pointer;color:var(--dsw-alias-state-business-primary,#3d6be5);background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 11%,transparent);border:1px solid color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 22%,transparent);animation:skm-cat-tag-in 200ms cubic-bezier(.2,.9,.3,1.1) both;transition:background 150ms ease,border-color 150ms ease,transform 120ms ease,box-shadow 180ms ease}
.skm-bundle-cat-tag:hover{background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 20%,transparent);border-color:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 45%,transparent);transform:translateY(-1px);box-shadow:0 2px 7px color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 22%,transparent)}
.skm-bundle-cat-tag[data-active]{background:var(--dsw-alias-state-business-primary,#3d6be5);border-color:transparent;color:#fff;box-shadow:0 2px 9px color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 40%,transparent)}
@keyframes skm-cat-tag-in{from{opacity:0;transform:translateY(3px) scale(.94)}to{opacity:1;transform:none}}
/* 分类编辑器 */
.skm-cat-editor{display:flex;flex-direction:column;gap:8px;box-sizing:border-box;width:100%}
.skm-cat-empty{margin:0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary,#81858c)}
.skm-cat-selected{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:5px}
.skm-cat-selected-tag{display:inline-flex;align-items:center;gap:5px;height:24px;box-sizing:border-box;padding:0 4px 0 9px;border-radius:999px;font-size:12px;line-height:20px;color:var(--dsw-alias-state-business-primary,#3d6be5);background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 12%,transparent);border:1px solid color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 26%,transparent);animation:skm-cat-tag-in 200ms cubic-bezier(.2,.9,.3,1.1) both}
.skm-cat-selected-name{white-space:nowrap}
.skm-cat-remove{flex:none;display:inline-flex;align-items:center;justify-content:center;width:17px;height:17px;padding:0;border:none;border-radius:50%;background:transparent;color:inherit;cursor:pointer;opacity:.6;transition:opacity 140ms ease,background 140ms ease,transform 140ms ease}
.skm-cat-remove:hover{opacity:1;background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 22%,transparent)}
.skm-cat-remove:active{transform:scale(.9)}
.skm-cat-suggest{display:flex;flex-wrap:wrap;gap:4px}
.skm-cat-preset{display:inline-flex;align-items:center;gap:3px;height:23px;box-sizing:border-box;padding:0 8px;border:1px dashed var(--dsw-alias-border-l2,rgba(0,0,0,.16));border-radius:999px;background:transparent;color:var(--dsw-alias-label-secondary,#61666b);font-family:inherit;font-size:11.5px;line-height:19px;cursor:pointer;transition:color 140ms ease,border-color 140ms ease,background 140ms ease,transform 120ms ease}
.skm-cat-preset:hover:not(:disabled){color:var(--dsw-alias-state-business-primary,#3d6be5);border-color:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 55%,transparent);border-style:solid;background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 9%,transparent);transform:translateY(-1px)}
.skm-cat-preset:active:not(:disabled){transform:translateY(0) scale(.96)}
.skm-cat-preset:disabled{opacity:.4;cursor:default}
.skm-cat-preset-plus{font-size:13px;line-height:16px;opacity:.7}
.skm-cat-input{box-sizing:border-box;width:100%;height:32px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:9px;padding:0 10px;font-family:inherit;font-size:12.5px;line-height:20px;color:var(--dsw-alias-label-primary,#1f2430);background:var(--dsw-alias-bg-base,#fff);transition:border-color 150ms ease,box-shadow 150ms ease}
.skm-cat-input:focus,.skm-cat-input:focus-visible{outline:none;border-color:var(--dsw-alias-state-business-primary,#3d6be5);box-shadow:0 0 0 3px rgba(61,107,229,.12)}
.skm-cat-limit{margin:0;font-size:11.5px;line-height:17px;color:var(--dsw-alias-label-tertiary,#81858c)}

.skm-chevron{flex:none;margin-left:auto;color:var(--dsw-alias-label-caption,#adb2b8);transition:transform 120ms}
.skm-bundle-row-outer[data-open='true'] .skm-chevron{transform:rotate(180deg)}
.skm-bundle-more{flex:none;display:flex;align-items:center}
.skm-bundle-more-btn{flex:none;display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border:none;border-radius:8px;padding:0;background:transparent;cursor:pointer;color:var(--dsw-alias-label-caption,#adb2b8);transition:background 140ms ease,color 140ms ease,transform 140ms ease}
.skm-bundle-more-btn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.05));color:var(--dsw-alias-label-primary,#1f2430)}
.skm-bundle-more-btn:active{transform:scale(.9)}
.skm-bundle-actions{margin-left:auto;display:flex;align-items:center;gap:2px;padding-right:2px}
.skm-icon-action{flex:none;display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border:none;border-radius:50%;padding:0;background:transparent;cursor:pointer;color:var(--dsw-alias-label-tertiary,#888);transition:background 140ms ease,color 140ms ease,transform 140ms ease}
.skm-icon-action:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.05));color:var(--dsw-alias-label-primary,#0f1115)}
.skm-icon-action:active{transform:scale(.9)}

/* ── 技能卡片（Skills Hub 风格）：双列网格；列表视图切单列宽卡 ── */
.skm-skill-grid{list-style:none;margin:8px 0 0;padding:0;width:100%;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;box-sizing:border-box}
.skm-skill-grid-list{grid-template-columns:minmax(0,1fr)}
.skm-skill-grid > .skm-status{grid-column:1/-1;padding-top:4px}
.skm-skill-card{position:relative;min-width:0;display:flex;flex-direction:column;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:16px;background:var(--dsw-alias-bg-base,#fff);padding:14px 16px 0;overflow:hidden;opacity:0;animation:skm-card-in 260ms cubic-bezier(.2,.7,.3,1.06) forwards;animation-delay:calc(var(--skm-i,0)*40ms);transition:border-color 160ms ease,box-shadow 160ms ease,transform 160ms ease}
.skm-skill-card:hover{border-color:var(--dsw-alias-border-l3,rgba(0,0,0,.16));box-shadow:0 3px 14px rgba(16,24,40,.08);transform:translateY(-1px)}
@keyframes skm-card-in{from{opacity:0;transform:translateY(8px) scale(.99)}to{opacity:1;transform:translateY(0) scale(1)}}
.skm-skill-card-head{display:flex;align-items:center;gap:10px;min-width:0}
.skm-skill-icon{flex:none;width:42px;height:42px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.08));border-radius:12px;background:var(--dsw-alias-bg-module-platform,#f5f6f7);color:var(--dsw-alias-label-secondary,#61666b);transition:color 160ms ease,border-color 160ms ease,transform 160ms ease}
.skm-skill-badge{flex:none;display:inline-flex;align-items:center;height:22px;padding:0 8px;border-radius:7px;background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 12%,transparent);color:var(--dsw-alias-state-business-primary,#3d6be5);font-size:10.5px;font-weight:700;letter-spacing:.2px}
.skm-skill-title-wrap{flex:1;min-width:0;display:flex;align-items:center;gap:6px}
.skm-skill-title{flex:1;min-width:0;appearance:none;border:none;background:transparent;padding:0;text-align:left;font-family:inherit;font-size:15px;font-weight:600;line-height:22px;color:var(--dsw-alias-label-primary,#0f1115);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;border-radius:6px;transition:color 140ms ease}
.skm-skill-title:hover{color:var(--dsw-alias-state-business-primary,#3d6be5)}
.skm-skill-title:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4176e6);outline-offset:1px}
.skm-skill-copy{flex:none;display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border:none;border-radius:6px;padding:0;background:transparent;cursor:pointer;color:var(--dsw-alias-label-caption,#adb2b8);opacity:.55;transition:opacity 140ms ease,color 140ms ease,background 140ms ease,transform 140ms ease}
.skm-skill-copy:hover{opacity:1;color:var(--dsw-alias-label-secondary,#61666b);background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.04));transform:scale(1.08)}
.skm-skill-copy:active{transform:scale(.9)}
.skm-skill-copy[data-copied='true']{opacity:1;color:var(--dsw-alias-state-business-primary,#4176e6)}
.skm-skill-card-toggle{flex:none;display:inline-flex;align-items:center}
.skm-skill-card-desc{margin:8px 0 0;appearance:none;border:none;background:transparent;padding:0;text-align:left;font-family:inherit;font-size:13px;line-height:19px;color:var(--dsw-alias-label-tertiary,#81858c);display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;min-height:38px;cursor:pointer;transition:color 140ms ease}
.skm-skill-card-desc:hover{color:var(--dsw-alias-label-secondary,#61666b)}
.skm-skill-tags{display:flex;align-items:center;gap:8px;margin-top:12px;min-width:0}
.skm-tag{flex:none;display:inline-flex;align-items:center;height:22px;padding:0 10px;border-radius:999px;font-size:12px;line-height:20px;box-sizing:border-box;white-space:nowrap;transition:color 160ms ease,border-color 160ms ease,background 160ms ease}
.skm-tag-source{background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 12%,transparent);color:var(--dsw-alias-state-business-primary,#3d6be5)}
.skm-tag-scope{background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 12%,transparent);color:var(--dsw-alias-state-business-primary,#3d6be5)}
.skm-tag-scope[data-off='true']{border-color:var(--dsw-alias-border-l2,rgba(0,0,0,.12));color:var(--dsw-alias-label-tertiary,#81858c)}
/* 关掉的技能留在列表里，但要一眼看出是关的：左侧状态条 + 标题降饱和（带过渡） */
.skm-skill-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:transparent;transition:background 220ms ease}
.skm-skill-card[data-off='true']{background:var(--dsw-alias-bg-layer-1,rgba(0,0,0,.02))}
.skm-skill-card[data-off='true']::before{background:var(--dsw-alias-border-l3,rgba(0,0,0,.2))}
.skm-skill-card[data-off='true'] .skm-skill-badge,.skm-skill-card[data-off='true'] .skm-skill-title{color:var(--dsw-alias-label-tertiary,#81858c)}
.skm-skill-card[data-off='true'] .skm-skill-card-desc{color:var(--dsw-alias-label-quaternary,#a5aab2)}
.skm-skill-badge,.skm-skill-title{transition:color 220ms ease}
.skm-tag-status{background:transparent;border:1px dashed var(--dsw-alias-border-l2,rgba(0,0,0,.18));color:var(--dsw-alias-label-tertiary,#81858c)}
.skm-skill-meta{margin-left:auto;flex:none;font-size:12px;line-height:17px;color:var(--dsw-alias-label-caption,#adb2b8);white-space:nowrap}
.skm-skill-card-foot{display:flex;align-items:center;gap:6px;margin:12px -16px 0;padding:8px 14px 8px 16px;border-top:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.06))}
.skm-skill-foot-label{flex:none;font-size:12px;line-height:17px;color:var(--dsw-alias-label-caption,#adb2b8)}
.skm-skill-foot-icon{flex:none;display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border:none;border-radius:8px;padding:0;background:transparent;cursor:pointer;color:var(--dsw-alias-label-secondary,#61666b);transition:background 140ms ease,color 140ms ease,transform 140ms ease}
.skm-skill-foot-icon:hover{background:var(--dsw-alias-interactive-bg-hover-solid,#f1f3f5);color:var(--dsw-alias-label-primary,#0f1115);transform:scale(1.05)}
.skm-skill-foot-icon:active{transform:scale(.92)}
.skm-skill-foot-icon:disabled{opacity:.38;cursor:default}
.skm-skill-foot-icon:disabled:hover{background:transparent;color:var(--dsw-alias-label-secondary,#61666b);transform:none}
.skm-skill-foot-icon-danger:hover{background:#fdebeb;color:var(--dsw-alias-state-error-primary,#e0434b)}
.skm-skill-card-actions{margin-left:auto;display:flex;align-items:center;gap:4px}

/* ── Skills Hub 页面骨架：左栏（分类/筛选/添加） / 统计行 / 工具栏 / tabs / 分组 / 卡片 ── */
.skm-hub{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;min-width:0;background:var(--dsw-alias-bg-base,#fff)}
.skm-topbar{flex:none;display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:12px 16px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.05));background:var(--dsw-alias-bg-base,#fff)}
.skm-topbar[data-drop]{outline:2px dashed var(--dsw-alias-state-business-primary,#3d6be5);outline-offset:-2px}
.skm-chip-row{flex:1 1 auto;min-width:200px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.skm-topbar .skm-cat-item{flex:none;width:auto}
.skm-topbar .skm-new-bundle-btn{flex:none;width:auto;margin-top:0;height:32px;font-size:12px}
/* SKILL / MCP 顶层 tab（紧贴标题文字右侧） */
.skm-kind-tabs{flex:none;display:inline-flex;align-items:center;gap:4px;padding:2px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.08));border-radius:999px;background:var(--dsw-alias-bg-module-platform,#f2f4f7)}
.skm-kind-tab{flex:none;display:inline-flex;align-items:center;justify-content:center;height:24px;box-sizing:border-box;border:none;border-radius:999px;background:transparent;padding:0 12px;font-size:12px;font-weight:600;line-height:17px;font-family:inherit;color:var(--dsw-alias-label-secondary,#61666b);cursor:pointer;transition:background 140ms ease,color 140ms ease,box-shadow 140ms ease,transform 140ms ease}
.skm-kind-tab:hover{color:var(--dsw-alias-label-primary,#1f2430)}
.skm-kind-tab:active{transform:scale(.96)}
.skm-kind-tab[data-active]{background:var(--dsw-alias-state-business-primary,#3d6be5);color:#fff;box-shadow:0 1px 5px rgba(61,107,229,.3)}
/* MCP 视图根：左侧竖排菜单（同技能左栏风格）+ 内容区 */
.skm-mcp-view-root{flex:1;min-height:0;display:flex;min-width:0;overflow-y:auto;padding:14px 20px 22px 0}
.skm-mcp-side{flex:none;width:216px;box-sizing:border-box;padding:4px 12px 0 20px;border-right:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.05));display:flex;flex-direction:column;gap:2px}
.skm-mcp-main{flex:1;min-width:0;padding:0 4px 0 18px;display:flex;flex-direction:column}
.skm-mcp-tabs{flex:none;display:flex;align-items:center;gap:10px}
.skm-mcp-tab{flex:none;display:inline-flex;align-items:center;justify-content:center;height:34px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:999px;background:var(--dsw-alias-bg-base,#fff);padding:0 18px;font-size:13px;font-weight:600;line-height:18px;font-family:inherit;color:var(--dsw-alias-label-secondary,#61666b);cursor:pointer;transition:background 140ms ease,color 140ms ease,border-color 140ms ease,box-shadow 140ms ease,transform 140ms ease}
.skm-mcp-tab:hover{color:var(--dsw-alias-label-primary,#1f2430);border-color:var(--dsw-alias-border-l3,rgba(0,0,0,.16))}
.skm-mcp-tab:active{transform:scale(.97)}
.skm-mcp-tab[data-active]{background:var(--dsw-alias-state-business-primary,#3d6be5);border-color:var(--dsw-alias-state-business-primary,#3d6be5);color:#fff;box-shadow:0 2px 8px rgba(61,107,229,.3)}
/* MCP Server 页：左主列 + 右信息列 */
.skm-mcp-server-layout{flex:none;display:flex;align-items:flex-start;gap:18px;min-width:0}
/* MCP 页主容器 = 滚动容器：卡片多了/工具多了都能滚到底（父层 .skm-hub-main 是 overflow:hidden）。 */
.skm-mcp-server-main{flex:1 1 auto;min-width:0;min-height:0;display:flex;flex-direction:column;gap:16px;overflow-y:auto;overflow-x:hidden;padding-right:6px;scrollbar-gutter:stable}
/* 图一：头部 */
.skm-mcp-header{flex:none;display:flex;align-items:flex-start;justify-content:space-between;gap:14px}
.skm-mcp-header-text{min-width:0;display:flex;flex-direction:column;gap:5px}
.skm-mcp-header-title-row{display:flex;align-items:center;gap:10px}
.skm-mcp-header-title{font-size:20px;font-weight:700;line-height:26px;color:var(--dsw-alias-label-primary,#1f2430)}
.skm-mcp-header-badge{flex:none;display:inline-flex;align-items:center;height:20px;padding:0 9px;border-radius:999px;background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 12%,transparent);color:var(--dsw-alias-state-business-primary,#3d6be5);font-size:10.5px;font-weight:600;line-height:14px}
.skm-mcp-header-sub{font-size:12px;line-height:17px;color:var(--dsw-alias-label-tertiary,#81858c)}
.skm-mcp-header-actions{flex:none;display:inline-flex;align-items:center;gap:8px}
.skm-mcp-market-btn{flex:none;display:inline-flex;align-items:center;height:34px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:10px;background:var(--dsw-alias-bg-base,#fff);padding:0 12px;font-size:13px;line-height:18px;font-family:inherit;color:var(--dsw-alias-label-secondary,#61666b);cursor:pointer;transition:border-color 140ms ease,color 140ms ease,background 140ms ease,transform 140ms ease}
.skm-mcp-market-btn:hover{border-color:var(--dsw-alias-border-l3,rgba(0,0,0,.18));color:var(--dsw-alias-label-primary,#1f2430);background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.02))}
.skm-mcp-market-btn:active{transform:scale(.98)}
.skm-mcp-add-btn{flex:none;display:inline-flex;align-items:center;height:34px;box-sizing:border-box;border:none;border-radius:10px;background:var(--dsw-alias-state-business-primary,#3d6be5);padding:0 14px;font-size:13px;font-weight:600;line-height:18px;font-family:inherit;color:#fff;cursor:pointer;box-shadow:0 2px 8px rgba(61,107,229,.3);transition:background 140ms ease,box-shadow 140ms ease,transform 140ms ease}
.skm-mcp-add-btn:hover{background:#3059cf;box-shadow:0 3px 12px rgba(61,107,229,.4);transform:translateY(-1px)}
.skm-mcp-add-btn:active{transform:translateY(0) scale(.98)}
.skm-mcp-bell-btn{flex:none;display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border:none;border-radius:10px;background:transparent;color:var(--dsw-alias-label-secondary,#61666b);cursor:pointer;transition:background 140ms ease,color 140ms ease,transform 140ms ease}
.skm-mcp-bell-btn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.04));color:var(--dsw-alias-label-primary,#1f2430)}
.skm-mcp-bell-btn:active{transform:scale(.94)}
.skm-mcp-copy-hint{flex:none;margin:0;padding:8px 12px;border-radius:10px;background:color-mix(in srgb,var(--dsw-alias-state-success-primary,#2fb344) 10%,transparent);color:var(--dsw-alias-state-success-primary,#2fb344);font-size:12px;line-height:17px}
/* 统计卡（复用技能统计卡样式，去掉列表页内边距） */
/* 图二：列表卡 */
/* MCP 快速了解引导卡（左栏底部，点击右侧悬浮；同技能指南卡样式） */
.skm-mcp-intro-card{flex:none;display:flex;flex-direction:column;gap:5px;margin-top:auto;box-sizing:border-box;border:1px solid #e4e9f8;border-radius:14px;background:var(--dsw-alias-bg-module-platform,#f3f7ff);padding:14px;cursor:pointer;box-shadow:0 1px 2px rgba(16,24,40,.03);transition:border-color 140ms ease,box-shadow 140ms ease,transform 140ms ease}
.skm-mcp-intro-card:hover{border-color:#cdd9f7;box-shadow:0 4px 14px rgba(61,107,229,.08)}
.skm-mcp-intro-title{font-size:13px;font-weight:700;line-height:18px;color:var(--dsw-alias-state-business-primary,#3d6be5)}
.skm-mcp-intro-desc{font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary,#81858c)}
.skm-mcp-intro-btn{flex:none;align-self:flex-start;display:inline-flex;align-items:center;gap:5px;margin-top:4px;height:28px;box-sizing:border-box;border:none;border-radius:999px;background:var(--dsw-alias-state-business-primary,#3d6be5);padding:0 12px;font-size:12px;font-weight:600;line-height:17px;font-family:inherit;color:#fff;cursor:pointer;box-shadow:0 2px 6px rgba(61,107,229,.3);transition:background 140ms ease,box-shadow 140ms ease,transform 140ms ease}
.skm-mcp-intro-btn:hover{background:#3059cf;box-shadow:0 3px 10px rgba(61,107,229,.38);transform:translateY(-1px)}
.skm-mcp-intro-btn:active{transform:translateY(0) scale(.97)}
/* MCP 解释悬浮层（同技能指南浮层） */
.skm-mcp-info-overlay{position:fixed;z-index:1001;width:330px;max-height:calc(100vh - 24px);box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:16px;background:var(--dsw-alias-bg-base,#fff);box-shadow:0 12px 40px rgba(16,24,40,.16);display:flex;flex-direction:column;overflow:hidden;animation:skm-guide-in 240ms cubic-bezier(.2,.7,.3,1.06) both}
.skm-mcp-info-overlay-head{flex:none;display:flex;align-items:center;gap:8px;padding:12px 12px 10px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.05))}
.skm-mcp-info-overlay-icon{flex:none;display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 12%,transparent);color:var(--dsw-alias-state-business-primary,#3d6be5)}
.skm-mcp-info-overlay-title{flex:1;min-width:0;font-size:15px;font-weight:700;line-height:20px;color:var(--dsw-alias-label-primary,#1f2430)}
.skm-mcp-info-overlay-body{flex:1;min-height:0;overflow-y:auto;padding:12px 14px 20px;display:flex;flex-direction:column;gap:12px}
.skm-mcp-row{display:flex;align-items:center;gap:10px;padding:10px 4px;border-top:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.05))}
.skm-mcp-row:first-child{border-top:none}
.skm-mcp-row-logo{flex:none;width:36px;height:36px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.08));border-radius:10px;background:var(--dsw-alias-bg-module-platform,#f5f6f7);color:var(--dsw-alias-label-secondary,#61666b)}
.skm-mcp-row-logo[data-kind='slack']{background:#fff}
.skm-mcp-row-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.skm-mcp-row-name-row{display:flex;align-items:center;gap:7px;min-width:0}
.skm-mcp-row-name{font-size:13px;font-weight:600;line-height:18px;color:var(--dsw-alias-label-primary,#1f2430);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.skm-mcp-row-tag{flex:none;display:inline-flex;align-items:center;height:18px;padding:0 7px;border-radius:999px;font-size:10px;line-height:14px;background:#f1f3f5;color:var(--dsw-alias-label-secondary,#61666b)}
.skm-mcp-row-tag[data-official]{background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 12%,transparent);color:var(--dsw-alias-state-business-primary,#3d6be5)}
.skm-mcp-row-ext{flex:none;display:inline-flex;border:none;background:transparent;padding:2px;color:var(--dsw-alias-label-caption,#adb2b8);cursor:pointer;transition:color 140ms ease}
.skm-mcp-row-ext:hover{color:var(--dsw-alias-state-business-primary,#3d6be5)}
.skm-mcp-row-desc{font-size:12px;line-height:17px;color:var(--dsw-alias-label-tertiary,#81858c);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.skm-mcp-row-status{flex:none;display:inline-flex;align-items:center;height:22px;padding:0 9px;border-radius:999px;font-size:11px;line-height:16px;background:#f0f4ee;color:#2f9e44}
.skm-mcp-row-status[data-on]{background:#e7f6ec}
.skm-mcp-row-status:not([data-on]){background:#f2f3f5;color:var(--dsw-alias-label-tertiary,#81858c)}
.skm-mcp-view-all{flex:none;align-self:center;display:inline-flex;align-items:center;gap:5px;margin-top:8px;border:none;background:transparent;padding:6px 10px;font-size:12px;line-height:17px;color:var(--dsw-alias-state-business-primary,#3d6be5);cursor:pointer;font-family:inherit;transition:color 140ms ease}
.skm-mcp-view-all:hover{color:#3059cf}
/* 推荐行「添加」小按钮 */
.skm-mcp-add-small-btn{flex:none;display:inline-flex;align-items:center;justify-content:center;height:26px;box-sizing:border-box;border:1px solid #bccff5;border-radius:999px;background:#f4f8ff;padding:0 12px;font-size:12px;font-weight:600;line-height:17px;font-family:inherit;color:var(--dsw-alias-state-business-primary,#3d6be5);cursor:pointer;transition:background 140ms ease,border-color 140ms ease,transform 140ms ease}
.skm-mcp-add-small-btn:hover{border-color:#9db6ef;background:#e9f1ff}
.skm-mcp-add-small-btn:active{transform:scale(.96)}
/* 推荐 MCP Server 标题 */
.skm-mcp-recommend-title{flex:none;font-size:15px;font-weight:700;line-height:21px;color:var(--dsw-alias-state-business-primary,#3d6be5)}
/* 推荐区：标题行 + 分类 pills + 卡片网格 */
.skm-mcp-rec-head{flex:none;display:flex;align-items:center;justify-content:space-between;gap:12px}
.skm-mcp-rec-cats-row{flex:none;display:flex;align-items:center}
.skm-mcp-rec-results-title{flex:none;font-size:13px;font-weight:700;line-height:18px;color:var(--dsw-alias-label-primary,#1f2430)}
.skm-mcp-rec-stars{flex:none;display:inline-flex;align-items:center;height:18px;padding:0 7px;border-radius:999px;background:var(--dsw-alias-bg-module-platform,#f1f3f5);color:var(--dsw-alias-label-secondary,#61666b);font-size:10.5px;line-height:16px}
.skm-mcp-open-link{flex:none;display:inline-flex;align-items:center;gap:4px;height:26px;box-sizing:border-box;border:1px solid color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 30%,transparent);border-radius:999px;background:transparent;padding:0 11px;font-size:12px;font-weight:600;line-height:17px;font-family:inherit;color:var(--dsw-alias-state-business-primary,#3d6be5);text-decoration:none;cursor:pointer;transition:background 140ms ease,transform 140ms ease}
.skm-mcp-open-link:hover{background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 10%,transparent)}
.skm-mcp-open-link:active{transform:scale(.96)}
.skm-mcp-rec-card-external{border-style:dashed}
.skm-mcp-resolve-err{flex:none;margin:0;font-size:11px;line-height:16px;color:var(--dsw-alias-state-warn-primary,#e0851c)}
.skm-mcp-ext-actions{flex:none;display:inline-flex;align-items:center;gap:6px}
/* MCP Server 卡：自启动/启用 设置行 */
.skm-mcp-card-foot{flex:none;display:flex;align-items:center;gap:12px;margin-top:auto;padding-top:8px;border-top:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.05))}
.skm-mcp-card-item{flex:none;display:inline-flex;align-items:center;gap:6px}
.skm-mcp-card-item-label{font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary,#61666b)}
.skm-mcp-card-item-meta{flex:none;margin-left:auto;font-size:11px;line-height:16px;color:var(--dsw-alias-label-caption,#adb2b8)}
.skm-mcp-card-item-meta[data-on]{color:var(--dsw-alias-state-business-primary,#4176e6)}
.skm-mcp-card-delete{flex:none;margin-left:auto;display:inline-flex;align-items:center;gap:4px;height:26px;box-sizing:border-box;border:1px solid transparent;border-radius:8px;background:transparent;padding:0 8px;font:inherit;font-size:11.5px;font-weight:600;line-height:1;font-family:inherit;color:var(--dsw-alias-label-caption,#adb2b8);cursor:pointer;transition:background 140ms ease,color 140ms ease,border-color 140ms ease,transform 140ms ease}
.skm-mcp-card-delete:hover{background:#fdebeb;border-color:#f3c4c4;color:var(--dsw-alias-state-error-primary,#e0434b)}
.skm-mcp-card-delete:active{transform:scale(.94)}
.skm-mcp-card-delete:disabled{opacity:.5;cursor:default;transform:none}
.skm-mcp-rec-cats{flex:none;display:inline-flex;align-items:center;gap:6px}
.skm-mcp-rec-cat{flex:none;display:inline-flex;align-items:center;justify-content:center;height:28px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:999px;background:var(--dsw-alias-bg-base,#fff);padding:0 12px;font-size:12px;line-height:17px;font-family:inherit;color:var(--dsw-alias-label-secondary,#61666b);cursor:pointer;transition:background 140ms ease,color 140ms ease,border-color 140ms ease,transform 140ms ease}
.skm-mcp-rec-cat:hover{border-color:var(--dsw-alias-border-l3,rgba(0,0,0,.16));color:var(--dsw-alias-label-primary,#1f2430)}
.skm-mcp-rec-cat:active{transform:scale(.96)}
.skm-mcp-rec-cat[data-active]{background:var(--dsw-alias-state-business-primary,#3d6be5);border-color:var(--dsw-alias-state-business-primary,#3d6be5);color:#fff}
.skm-mcp-rec-grid{flex:none;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.skm-mcp-rec-card{flex:none;min-width:0;display:flex;flex-direction:column;gap:9px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.08));border-radius:14px;background:var(--dsw-alias-bg-base,#fff);padding:14px 16px;box-shadow:0 1px 2px rgba(16,24,40,.03);opacity:0;animation:skm-card-in 260ms cubic-bezier(.2,.7,.3,1.06) forwards;transition:border-color 160ms ease,box-shadow 160ms ease,transform 160ms ease}
.skm-mcp-rec-card:hover{border-color:var(--dsw-alias-border-l3,rgba(0,0,0,.13));box-shadow:0 4px 14px rgba(16,24,40,.08);transform:translateY(-1px)}
.skm-mcp-rec-card-head{display:flex;align-items:center;gap:10px;min-width:0}
.skm-mcp-rec-card-title-row{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}
.skm-mcp-rec-card-name{font-size:14px;font-weight:600;line-height:20px;color:var(--dsw-alias-label-primary,#1f2430);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.skm-mcp-rec-card-tags{display:flex;align-items:center;gap:6px}
.skm-mcp-rec-cat-tag{flex:none;display:inline-flex;align-items:center;height:18px;padding:0 7px;border-radius:999px;background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 12%,transparent);color:var(--dsw-alias-state-business-primary,#3d6be5);font-size:10px;line-height:14px}
.skm-mcp-rec-cat-tag[data-off]{background:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#f5a524) 16%,transparent);color:var(--dsw-alias-state-warn-label,#b26b00)}
.skm-mcp-rec-cat-tag[data-shadow]{background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 10%,transparent);color:var(--dsw-alias-state-business-primary,#3d6be5);border:1px dashed color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 40%,transparent)}
.skm-mcp-rec-cat-tag[data-locked]{background:var(--dsw-alias-bg-module-platform,#f1f3f5);color:var(--dsw-alias-label-tertiary,#81858c);border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.08))}
.skm-mcp-tool-chip[data-locked]{text-decoration:line-through}
.skm-mcp-tool-chips{display:flex;flex-wrap:wrap;gap:4px;margin:6px 0 8px;max-height:132px;overflow-y:auto}
.skm-mcp-tool-chip[data-locked]{opacity:.5;cursor:not-allowed;text-decoration:line-through}
.skm-mcp-tool-chip{font:inherit;font-size:11px;line-height:16px;padding:1px 7px;border-radius:999px;cursor:pointer;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.08));background:var(--dsw-alias-bg-module-platform,#f1f3f5);color:var(--dsw-alias-label-tertiary,#81858c);transition:background .12s,color .12s,border-color .12s}
.skm-mcp-tool-chip[data-on]{background:color-mix(in srgb,var(--dsw-alias-state-success-primary,#2ba471) 12%,transparent);border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary,#2ba471) 34%,transparent);color:var(--dsw-alias-state-success-primary,#2ba471)}
.skm-mcp-tool-chip:hover:not(:disabled){border-color:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 50%,transparent);color:var(--dsw-alias-state-business-primary,#3d6be5)}
.skm-mcp-tool-chip:disabled{opacity:.55;cursor:default}
.skm-mcp-tool-chip[data-busy]{opacity:.35}
.skm-mcp-rec-card-desc{margin:0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary,#81858c);display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;min-height:36px}
.skm-mcp-rec-card-foot{display:flex;align-items:center;gap:8px;margin-top:auto;padding-top:6px}
.skm-mcp-rec-card-meta{flex:1;min-width:0;font-size:11px;line-height:16px;color:var(--dsw-alias-label-caption,#adb2b8);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.skm-mcp-added-tag{flex:none;display:inline-flex;align-items:center;gap:4px;height:26px;box-sizing:border-box;border:1px solid #b7e0c3;border-radius:999px;background:#e7f6ec;padding:0 10px;font-size:12px;font-weight:600;line-height:17px;font-family:inherit;color:#2f9e44;cursor:pointer;transition:background 140ms ease,border-color 140ms ease,transform 140ms ease}
.skm-mcp-added-tag:hover{border-color:#93cfa6;background:#d9f0e1}
.skm-mcp-added-tag:active{transform:scale(.96)}
/* 添加 MCP Server 表单 */
.skm-mcp-add-form{display:flex;flex-direction:column;gap:8px}
.skm-mcp-add-type-row{display:flex;align-items:center;gap:6px}
.skm-mcp-add-type-btn{flex:none;display:inline-flex;align-items:center;justify-content:center;height:28px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:999px;background:var(--dsw-alias-bg-base,#fff);padding:0 12px;font-size:12px;font-weight:600;line-height:17px;font-family:inherit;color:var(--dsw-alias-label-secondary,#61666b);cursor:pointer;transition:background 140ms ease,color 140ms ease,border-color 140ms ease,transform 140ms ease}
.skm-mcp-add-type-btn:hover{border-color:var(--dsw-alias-border-l3,rgba(0,0,0,.16));color:var(--dsw-alias-label-primary,#1f2430)}
.skm-mcp-add-type-btn:active{transform:scale(.96)}
.skm-mcp-add-type-btn[data-active]{background:var(--dsw-alias-state-business-primary,#3d6be5);border-color:var(--dsw-alias-state-business-primary,#3d6be5);color:#fff}
/* 工具列表搜索框 */
.skm-mcp-tool-search{flex:none;display:flex;align-items:center;gap:8px;height:32px;width:260px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:10px;background:var(--dsw-alias-bg-base,#fff);padding:0 10px;color:var(--dsw-alias-label-caption,#adb2b8);transition:border-color 140ms ease,box-shadow 140ms ease}
.skm-mcp-tool-search:focus-within{border-color:var(--dsw-alias-state-business-primary,#3d6be5);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 14%,transparent)}
.skm-mcp-tool-search-input{flex:1;min-width:0;border:none;outline:none;background:transparent;font-size:12.5px;line-height:18px;color:var(--dsw-alias-label-primary,#1f2430);font-family:inherit}
.skm-mcp-tool-search-input::placeholder{color:var(--dsw-alias-label-caption,#adb2b8)}
/* 连接日志行 */
.skm-mcp-log-row{display:flex;align-items:center;gap:10px;padding:9px 4px;border-top:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.05))}
.skm-mcp-log-row:first-child{border-top:none}
.skm-mcp-log-dot{flex:none;width:9px;height:9px;border-radius:50%;background:var(--dsw-alias-state-business-primary,#3d6be5)}
.skm-mcp-log-dot[data-kind='enable']{background:#2fb26b}
.skm-mcp-log-dot[data-kind='disable']{background:var(--dsw-alias-state-warn-primary,#e8a33d)}
.skm-mcp-log-dot[data-kind='remove']{background:var(--dsw-alias-state-error-primary,#e0434b)}
.skm-mcp-log-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
.skm-mcp-log-text{font-size:12.5px;line-height:18px;color:var(--dsw-alias-label-primary,#1f2430)}
.skm-mcp-log-text strong{font-weight:600}
.skm-mcp-log-clear{flex:none;display:inline-flex;align-items:center;height:28px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:999px;background:transparent;padding:0 12px;font-size:12px;line-height:17px;font-family:inherit;color:var(--dsw-alias-label-secondary,#61666b);cursor:pointer;transition:border-color 140ms ease,color 140ms ease,transform 140ms ease}
.skm-mcp-log-clear:hover{border-color:var(--dsw-alias-border-l3,rgba(0,0,0,.18));color:var(--dsw-alias-label-primary,#1f2430)}
.skm-mcp-log-clear:active{transform:scale(.96)}
/* 配置模板卡 */
.skm-mcp-config-grid{flex:none;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.skm-mcp-config-card{flex:none;min-width:0;display:flex;flex-direction:column;gap:10px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.08));border-radius:14px;background:var(--dsw-alias-bg-base,#fff);padding:12px 14px;box-shadow:0 1px 2px rgba(16,24,40,.03);transition:border-color 160ms ease,box-shadow 160ms ease}
.skm-mcp-config-card:hover{border-color:var(--dsw-alias-border-l3,rgba(0,0,0,.13));box-shadow:0 3px 10px rgba(16,24,40,.07)}
.skm-mcp-config-head{display:flex;align-items:center;justify-content:space-between;gap:8px}
.skm-mcp-config-title{font-size:13px;font-weight:700;line-height:18px;color:var(--dsw-alias-label-primary,#1f2430)}
.skm-mcp-config-copy{flex:none;display:inline-flex;align-items:center;height:24px;box-sizing:border-box;border:1px solid color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 30%,transparent);border-radius:999px;background:transparent;padding:0 10px;font-size:11px;line-height:16px;font-family:inherit;color:var(--dsw-alias-state-business-primary,#3d6be5);cursor:pointer;transition:background 140ms ease,color 140ms ease,transform 140ms ease}
.skm-mcp-config-copy:hover{background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 10%,transparent)}
.skm-mcp-config-copy:active{transform:scale(.96)}
.skm-mcp-config-code{flex:none;margin:0;padding:10px 12px;border-radius:10px;background:var(--dsw-alias-bg-module-platform,#f5f6f7);color:var(--dsw-alias-label-secondary,#61666b);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;line-height:17px;overflow:auto}
/* 图三：右侧信息栏 */
.skm-mcp-info-col{flex:none;width:322px;display:flex;flex-direction:column;gap:12px}
.skm-mcp-info-card{flex:none;display:flex;flex-direction:column;gap:9px;box-sizing:border-box;border:1px solid #dfe8fa;border-radius:14px;background:var(--dsw-alias-bg-module-platform,#f1f5ff);padding:14px}
.skm-mcp-info-card-title{font-size:14px;font-weight:700;line-height:20px;color:var(--dsw-alias-state-business-primary,#3d6be5)}
.skm-mcp-info-desc{margin:0;font-size:12px;line-height:19px;color:var(--dsw-alias-label-secondary,#61666b)}
.skm-mcp-info-points{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.skm-mcp-point{display:flex;gap:8px;align-items:flex-start}
.skm-mcp-point-icon{flex:none;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;border-radius:8px;background:#e7effe;color:var(--dsw-alias-state-business-primary,#3d6be5)}
.skm-mcp-point-body{min-width:0;display:flex;flex-direction:column;gap:1px}
.skm-mcp-point-title{font-size:12px;font-weight:600;line-height:17px;color:var(--dsw-alias-label-primary,#1f2430)}
.skm-mcp-point-desc{font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary,#81858c)}
/* 工作原理流程 */
.skm-mcp-flow{flex:none;display:flex;align-items:center;gap:4px}
.skm-mcp-flow-node{flex:none;width:64px;display:inline-flex;flex-direction:column;align-items:center;gap:4px}
.skm-mcp-flow-icon{flex:none;width:36px;height:36px;display:inline-flex;align-items:center;justify-content:center;border-radius:10px;background:#e7effe;color:var(--dsw-alias-state-business-primary,#3d6be5)}
.skm-mcp-flow-icon[data-client]{background:#dbebfd;color:#2276d2}
.skm-mcp-flow-icon[data-server]{background:#eae8fa;color:#6b46e5}
.skm-mcp-flow-label{font-size:10px;line-height:14px;color:var(--dsw-alias-label-secondary,#61666b);white-space:nowrap}
.skm-mcp-flow-arrow{flex:1;min-width:0;display:inline-flex;flex-direction:column;align-items:center;gap:2px;color:var(--dsw-alias-label-caption,#adb2b8)}
.skm-mcp-flow-arrow-text{font-size:9px;line-height:12px;color:var(--dsw-alias-label-caption,#adb2b8)}
.skm-mcp-flow-ext{flex:none;display:flex;flex-direction:column;gap:6px;padding-top:6px;border-top:1px dashed var(--dsw-alias-border-l2,rgba(0,0,0,.1))}
.skm-mcp-flow-ext-label{font-size:10px;line-height:14px;color:var(--dsw-alias-label-caption,#adb2b8)}
.skm-mcp-flow-ext-icons{display:flex;gap:8px}
.skm-mcp-flow-ext-icon{flex:none;width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.07));border-radius:8px;background:#fff;color:var(--dsw-alias-label-secondary,#61666b)}
.skm-mcp-api-text{font-size:9px;font-weight:700;color:var(--dsw-alias-state-business-primary,#3d6be5)}
/* 快速上手 */
.skm-mcp-steps{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.skm-mcp-step{display:flex;gap:8px;align-items:flex-start}
.skm-mcp-step-num{flex:none;width:22px;height:22px;border-radius:50%;background:#e7effe;color:var(--dsw-alias-state-business-primary,#3d6be5);font-size:12px;font-weight:700;line-height:22px;text-align:center}
.skm-mcp-step-body{min-width:0;display:flex;flex-direction:column;gap:1px}
.skm-mcp-step-title{font-size:12px;font-weight:600;line-height:17px;color:var(--dsw-alias-label-primary,#1f2430)}
.skm-mcp-step-desc{font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary,#81858c)}
/* MCP 空态（工具列表/连接日志/配置模板占位） */
.skm-mcp-empty{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:40px}
.skm-mcp-empty-icon{flex:none;display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:18px;background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 12%,transparent);color:var(--dsw-alias-state-business-primary,#3d6be5);box-shadow:0 4px 12px rgba(61,107,229,.1)}
.skm-mcp-empty-title{font-size:16px;font-weight:700;line-height:22px;color:var(--dsw-alias-label-primary,#1f2430)}
.skm-mcp-empty-desc{font-size:13px;line-height:19px;color:var(--dsw-alias-label-tertiary,#81858c)}
.skm-hub-row{flex:1;min-height:0;min-width:0;display:flex}
/* 右侧指南浮层卡（点击「开始学习」出现，贴面板右缘，不压缩面板） */
.skm-guide-panel{position:fixed;z-index:1001;width:300px;max-height:calc(100vh - 24px);box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:16px;background:var(--dsw-alias-bg-base,#fff);box-shadow:0 12px 40px rgba(16,24,40,.16);display:flex;flex-direction:column;overflow:hidden;animation:skm-guide-in 240ms cubic-bezier(.2,.7,.3,1.06) both}
@keyframes skm-guide-in{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
.skm-guide-panel-head{flex:none;display:flex;align-items:center;gap:8px;padding:12px 12px 10px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.05))}
.skm-guide-panel-logo{flex:none;display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 12%,transparent);color:var(--dsw-alias-state-business-primary,#3d6be5)}
.skm-guide-panel-title{flex:1;min-width:0;font-size:15px;font-weight:700;line-height:20px;color:var(--dsw-alias-label-primary,#1f2430)}
.skm-guide-panel-close{flex:none;display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border:none;border-radius:8px;background:transparent;color:var(--dsw-alias-label-caption,#adb2b8);cursor:pointer;transition:background 140ms ease,color 140ms ease,transform 140ms ease}
.skm-guide-panel-close:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.04));color:var(--dsw-alias-label-primary,#1f2430)}
.skm-guide-panel-close:active{transform:scale(.9)}
.skm-guide-panel-body{flex:1;min-height:0;overflow-y:auto;padding:12px 14px 20px;display:flex;flex-direction:column;gap:14px}
.skm-guide-sec{flex:none;display:flex;flex-direction:column;gap:8px}
.skm-guide-sec-head{display:flex;align-items:center;gap:7px}
.skm-guide-sec-icon{flex:none;display:inline-flex;width:22px;height:22px;align-items:center;justify-content:center;border-radius:7px;background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 12%,transparent);color:var(--dsw-alias-state-business-primary,#3d6be5)}
.skm-guide-sec-title{font-size:14px;font-weight:700;line-height:20px;color:var(--dsw-alias-label-primary,#1f2430)}
.skm-guide-what-desc{margin:0;font-size:12px;line-height:19px;color:var(--dsw-alias-label-secondary,#61666b)}
.skm-guide-caps{display:flex;flex-wrap:wrap;gap:6px 10px}
.skm-guide-cap{flex:none;display:inline-flex;align-items:center;gap:4px}
.skm-guide-cap-icon{flex:none;display:inline-flex;color:var(--dsw-alias-label-caption,#adb2b8)}
.skm-guide-cap-label{font-size:10px;line-height:14px;color:var(--dsw-alias-label-tertiary,#81858c);white-space:nowrap}
.skm-guide-step{display:flex;gap:8px;padding:2px 0}
.skm-guide-step-num{flex:none;width:22px;height:22px;border-radius:50%;background:var(--dsw-alias-state-business-primary,#3d6be5);color:#fff;font-size:12px;font-weight:700;line-height:22px;text-align:center}
.skm-guide-step-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
.skm-guide-step-title-row{display:flex;align-items:center;gap:6px}
.skm-guide-step-title{font-size:13px;font-weight:600;line-height:18px;color:var(--dsw-alias-label-primary,#1f2430)}
.skm-guide-step-arrow{margin-left:auto;flex:none;color:var(--dsw-alias-label-caption,#adb2b8)}
.skm-guide-step-desc{margin:0;font-size:11px;line-height:17px;color:var(--dsw-alias-label-tertiary,#81858c)}
.skm-guide-full-btn{flex:none;align-self:stretch;display:inline-flex;align-items:center;justify-content:center;gap:6px;margin-top:6px;height:32px;box-sizing:border-box;border:1px solid #bccff5;border-radius:999px;background:#f4f8ff;color:var(--dsw-alias-state-business-primary,#3d6be5);font-size:12px;font-weight:600;line-height:18px;font-family:inherit;padding:0 12px;cursor:pointer;transition:background 140ms ease,border-color 140ms ease,box-shadow 140ms ease,transform 140ms ease}
.skm-guide-full-btn:hover{border-color:#9db6ef;background:#e9f1ff;box-shadow:0 2px 8px rgba(61,107,229,.1)}
.skm-guide-full-btn:active{transform:scale(.98)}
.skm-guide-best{flex:none;display:flex;flex-direction:column;gap:8px;box-sizing:border-box;border:1px solid #dbe6fb;border-radius:14px;background:var(--dsw-alias-bg-module-platform,#eef4ff);padding:12px 12px 0;overflow:hidden;position:relative}
.skm-guide-best-title{font-size:13px;font-weight:700;line-height:18px;color:var(--dsw-alias-label-primary,#1f2430)}
.skm-guide-best-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
.skm-guide-best-item{display:flex;align-items:center;gap:7px;font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary,#61666b)}
.skm-guide-best-item svg{flex:none;color:#2fb26b}
.skm-guide-more-btn{flex:none;align-self:flex-start;display:inline-flex;align-items:center;gap:5px;border:none;background:transparent;padding:2px 0;font-size:11px;line-height:16px;color:var(--dsw-alias-state-business-primary,#3d6be5);cursor:pointer;font-family:inherit;transition:color 140ms ease}
.skm-guide-more-btn:hover{color:#3059cf}
.skm-guide-best-art{flex:none;display:inline-flex;align-items:flex-end;justify-content:center;margin:2px -12px 0;transform:scale(.8);transform-origin:bottom right;pointer-events:none}
.skm-hub-side{flex:none;width:216px;box-sizing:border-box;padding:16px 14px 16px 16px;border-right:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.05));background:var(--dsw-alias-bg-base,#fff);overflow-y:auto;display:flex;flex-direction:column;gap:2px}
.skm-cat-title{flex:none;margin:0 6px 10px;font-size:13px;font-weight:700;line-height:18px;color:var(--dsw-alias-label-primary,#1f2430)}
.skm-cat-list{flex:none;display:flex;flex-direction:column;gap:4px;max-height:190px;overflow-y:auto;padding-right:2px;box-sizing:border-box;--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2,rgba(0,0,0,.18));--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2,rgba(0,0,0,.3))}
.skm-cat-item{flex:none;display:flex;align-items:center;gap:10px;width:100%;box-sizing:border-box;border:1px solid transparent;border-radius:10px;padding:8px 10px;background:transparent;cursor:pointer;font-family:inherit;color:var(--dsw-alias-label-secondary,#61666b);transition:background 140ms ease,border-color 140ms ease,color 140ms ease,box-shadow 140ms ease}
.skm-cat-item:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.03));color:var(--dsw-alias-label-primary,#1f2430)}
.skm-cat-item[data-active]{background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 12%,transparent);border-color:rgba(61,107,229,.10);color:var(--dsw-alias-state-business-primary,#3d6be5)}
.skm-cat-icon{flex:none;display:inline-flex;width:18px;height:18px;align-items:center;justify-content:center;color:var(--dsw-alias-label-caption,#adb2b8);transition:color 140ms ease}
.skm-cat-icon[data-active]{color:var(--dsw-alias-state-business-primary,#3d6be5)}
.skm-cat-label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left;font-size:13px;font-weight:500;line-height:18px}
.skm-cat-item[data-active] .skm-cat-label{font-weight:600}
.skm-cat-count{flex:none;font-size:12px;line-height:16px;color:var(--dsw-alias-label-caption,#adb2b8)}
.skm-cat-item[data-active] .skm-cat-count{color:var(--dsw-alias-state-business-primary,#5b82e5)}
.skm-cat-count[data-warn]{color:#e0851c;font-weight:600}
.skm-filters-title{flex:none;margin:18px 6px 8px;font-size:13px;font-weight:700;line-height:18px;color:var(--dsw-alias-label-primary,#1f2430)}
.skm-filter-block{flex:none;display:flex;flex-direction:column;gap:8px}
/* 启用状态：平铺三档分段按钮 */
.skm-status-seg{flex:none;display:flex;align-items:center;gap:6px;padding:0 2px}
.skm-status-seg-btn{flex:none;display:inline-flex;align-items:center;justify-content:center;height:30px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:999px;background:var(--dsw-alias-bg-base,#fff);padding:0 10px;font-size:12px;line-height:17px;font-family:inherit;color:var(--dsw-alias-label-secondary,#61666b);cursor:pointer;white-space:nowrap;transition:background 140ms ease,color 140ms ease,border-color 140ms ease,box-shadow 140ms ease,transform 140ms ease}
.skm-status-seg-btn:hover{color:var(--dsw-alias-label-primary,#1f2430);border-color:var(--dsw-alias-border-l3,rgba(0,0,0,.16))}
.skm-status-seg-btn:active{transform:scale(.96)}
.skm-status-seg-btn[data-active]{background:var(--dsw-alias-state-business-primary,#3d6be5);border-color:var(--dsw-alias-state-business-primary,#3d6be5);color:#fff;box-shadow:0 2px 6px rgba(61,107,229,.28)}
.skm-filter-row-wrap{position:relative;flex:none}
.skm-filter-row{flex:none;display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;height:34px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:9px;background:var(--dsw-alias-bg-base,#fff);padding:0 10px;font-family:inherit;cursor:pointer;transition:border-color 140ms ease,box-shadow 140ms ease}
.skm-filter-row:hover{border-color:var(--dsw-alias-border-l3,rgba(0,0,0,.16))}
.skm-filter-row[aria-expanded='true']{border-color:var(--dsw-alias-state-business-primary,var(--dsw-alias-state-business-primary,#3d6be5));box-shadow:0 0 0 2px rgba(61,107,229,.12)}
.skm-filter-row-label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left;font-size:12px;line-height:17px;color:var(--dsw-alias-label-secondary,#61666b)}
.skm-filter-row-label-strong{font-weight:600;color:var(--dsw-alias-label-primary,#1f2430)}
.skm-filter-row-chevron{flex:none;color:var(--dsw-alias-label-caption,#adb2b8);transition:transform 140ms ease}
.skm-filter-row-chevron[data-open]{transform:rotate(180deg)}
.skm-filter-menu{position:absolute;top:calc(100% + 6px);left:0;right:0;z-index:60;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:10px;background:var(--dsw-alias-bg-layer-1,#fff);box-shadow:0 8px 22px rgba(16,24,40,.12);padding:4px;display:flex;flex-direction:column;gap:2px;animation:skm-form-in 140ms ease-out}
.skm-filter-option{display:flex;align-items:center;gap:8px;width:100%;border:none;border-radius:8px;padding:7px 10px;background:transparent;font-size:13px;line-height:18px;color:var(--dsw-alias-label-secondary,#61666b);cursor:pointer;font-family:inherit;text-align:left;white-space:nowrap;transition:background 120ms ease,color 120ms ease}
.skm-filter-option:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.04));color:var(--dsw-alias-label-primary,#1f2430)}
.skm-preset-dot{flex:none;justify-content:center;width:8px;height:8px;border-radius:50%;background:transparent;margin-left:auto}
.skm-preset-dot[data-on]{background:var(--dsw-alias-state-business-primary,#e0851c)}
/* 新建技能包按钮（左栏，添加技能卡上方） */
.skm-new-bundle-btn{flex:none;display:inline-flex;align-items:center;justify-content:center;gap:6px;height:34px;width:100%;box-sizing:border-box;margin-top:18px;border:1px solid #c7d6f7;border-radius:10px;background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 12%,transparent);color:var(--dsw-alias-state-business-primary,#3d6be5);font-size:13px;font-weight:600;line-height:18px;font-family:inherit;padding:0 12px;cursor:pointer;transition:background 140ms ease,border-color 140ms ease,color 140ms ease,box-shadow 140ms ease,transform 140ms ease}
.skm-new-bundle-btn:hover{border-color:#9db6ef;background:#e3ecff;box-shadow:0 2px 8px rgba(61,107,229,.12)}
.skm-new-bundle-btn:active{transform:scale(.98)}
.skm-new-bundle-btn-open{border-color:var(--dsw-alias-state-business-primary,#3d6be5);background:var(--dsw-alias-state-business-primary,#3d6be5);color:#fff;box-shadow:0 2px 8px rgba(61,107,229,.3)}
.skm-new-bundle-btn-open:hover{background:#3059cf;border-color:#3059cf;color:#fff}
/* 添加技能卡 */
.skm-add-card{flex:none;display:flex;flex-direction:column;gap:8px;margin-top:18px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.08));border-radius:14px;background:var(--dsw-alias-bg-base,#fff);padding:12px;cursor:pointer;box-shadow:0 1px 2px rgba(16,24,40,.04);transition:border-color 140ms ease,box-shadow 140ms ease,transform 140ms ease}
.skm-add-card:hover{border-color:var(--dsw-alias-border-l3,rgba(0,0,0,.14));box-shadow:0 4px 14px rgba(16,24,40,.08)}
.skm-add-card-active{border-color:var(--dsw-alias-state-business-primary,#3d6be5);box-shadow:0 0 0 2px rgba(61,107,229,.14)}
.skm-add-card-head{display:flex;align-items:center;gap:8px}
.skm-add-card-icon{flex:none;display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;color:var(--dsw-alias-state-business-primary,#3d6be5);background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#3d6be5) 12%,transparent)}
.skm-add-card-title{font-size:13px;font-weight:700;line-height:18px;color:var(--dsw-alias-label-primary,#1f2430)}
.skm-add-card-sub{font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary,#81858c)}
.skm-add-drop{flex:none;display:flex;flex-direction:column;align-items:center;gap:2px;border:1px dashed var(--dsw-alias-border-l3,rgba(0,0,0,.18));border-radius:10px;padding:12px 8px;color:var(--dsw-alias-label-tertiary,#81858c);background:var(--dsw-alias-bg-module-platform,#fafbfc);transition:border-color 140ms ease,background 140ms ease}
.skm-add-card:hover .skm-add-drop{border-color:rgba(61,107,229,.4);background:#f5f8ff}
.skm-add-drop-icon{flex:none;display:inline-flex}
.skm-add-drop-text{font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary,#61666b)}
.skm-add-drop-hint{font-size:10px;line-height:14px;color:var(--dsw-alias-label-caption,#adb2b8)}
.skm-add-btn{flex:none;display:inline-flex;align-items:center;justify-content:center;height:32px;box-sizing:border-box;border:none;border-radius:9px;background:var(--dsw-alias-state-business-primary,#3d6be5);color:#fff;font-size:13px;font-weight:600;line-height:18px;font-family:inherit;padding:0 12px;cursor:pointer;box-shadow:0 1px 3px rgba(61,107,229,.35);transition:background 140ms ease,transform 140ms ease,box-shadow 140ms ease}
.skm-add-btn:hover{background:#3059cf;box-shadow:0 2px 8px rgba(61,107,229,.4);transform:translateY(-1px)}
.skm-add-btn:active{transform:translateY(0) scale(.98)}
/* 快速上手指南卡（添加技能卡下方） */
.skm-guide-card{flex:none;display:flex;flex-direction:column;gap:5px;margin-top:18px;box-sizing:border-box;border:1px solid #e4e9f8;border-radius:14px;background:var(--dsw-alias-bg-module-platform,#f3f7ff);padding:14px;overflow:hidden;position:relative;box-shadow:0 1px 2px rgba(16,24,40,.03);transition:border-color 140ms ease,box-shadow 140ms ease}
.skm-guide-card:hover{border-color:#cdd9f7;box-shadow:0 4px 14px rgba(61,107,229,.08)}
.skm-guide-title{font-size:13px;font-weight:700;line-height:18px;color:var(--dsw-alias-label-primary,#1f2430)}
.skm-guide-desc{font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary,#81858c)}
.skm-guide-btn{flex:none;align-self:flex-start;display:inline-flex;align-items:center;gap:5px;margin-top:4px;height:28px;box-sizing:border-box;border:none;border-radius:999px;background:var(--dsw-alias-state-business-primary,#3d6be5);color:#fff;font-size:12px;font-weight:600;line-height:18px;font-family:inherit;padding:0 12px;cursor:pointer;box-shadow:0 2px 6px rgba(61,107,229,.3);transition:background 140ms ease,box-shadow 140ms ease,transform 140ms ease}
.skm-guide-btn:hover{background:#3059cf;box-shadow:0 3px 10px rgba(61,107,229,.38);transform:translateY(-1px)}
.skm-guide-btn:active{transform:translateY(0) scale(.97)}
.skm-guide-art{flex:none;display:inline-flex;align-items:flex-end;justify-content:center;margin:8px -14px 0;padding-top:6px;background:linear-gradient(180deg,rgba(61,107,229,.06),rgba(61,107,229,.14))}
.skm-guide-modal-text{margin:0;font-size:13px;line-height:22px;color:var(--dsw-alias-label-secondary,#4a4f5a)}
.skm-hub-main{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;overflow:hidden}
.skm-health-notice{flex:none;margin:8px 16px 0;box-sizing:border-box;border:1px solid #f0cf9e;border-radius:10px;background:#fdf6e3;padding:8px 12px;display:flex;flex-direction:column;gap:4px;animation:skm-form-in 180ms ease-out}
.skm-health-notice-title{font-size:12px;font-weight:700;line-height:17px;color:#b45309}
.skm-health-notice ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px}
.skm-health-notice li{font-size:12px;line-height:17px;color:#8a5a17}
.skm-toolbar{flex:none;display:flex;align-items:center;gap:8px;padding:12px 16px 4px;flex-wrap:wrap}
.skm-search-box{flex:1;min-width:170px;display:flex;align-items:center;gap:8px;height:36px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:10px;background:var(--dsw-alias-bg-base,#fff);padding:0 12px;color:var(--dsw-alias-label-caption,#adb2b8);transition:border-color 140ms ease,box-shadow 140ms ease}
.skm-search-box:focus-within{border-color:var(--dsw-alias-state-business-primary,#4176e6);box-shadow:0 0 0 3px rgba(65,118,230,.14)}
.skm-search-input{flex:1;min-width:0;border:none;outline:none;background:transparent;font-size:13px;line-height:18px;color:var(--dsw-alias-label-primary,#0f1115);font-family:inherit}
.skm-search-input::placeholder{color:var(--dsw-alias-label-caption,#adb2b8)}
.skm-tool-select-wrap{position:relative;flex:none;display:inline-flex;align-items:center}
.skm-tool-select{appearance:none;-webkit-appearance:none;height:36px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:10px;background:var(--dsw-alias-bg-base,#fff);color:var(--dsw-alias-label-secondary,#61666b);font-size:13px;line-height:18px;font-family:inherit;padding:0 26px 0 12px;cursor:pointer;transition:border-color 140ms ease,background 140ms ease}
.skm-tool-select:hover{border-color:var(--dsw-alias-border-l3,rgba(0,0,0,.18))}
.skm-tool-select:focus-visible{outline:none;border-color:var(--dsw-alias-state-business-primary,#4176e6)}
.skm-tool-select-chevron{position:absolute;right:9px;pointer-events:none;color:var(--dsw-alias-label-caption,#adb2b8)}
.skm-tool-button{flex:none;display:inline-flex;align-items:center;gap:6px;height:36px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:10px;background:var(--dsw-alias-bg-base,#fff);color:var(--dsw-alias-label-secondary,#61666b);font-size:13px;line-height:18px;font-family:inherit;padding:0 12px;cursor:pointer;transition:border-color 140ms ease,background 140ms ease,color 140ms ease,transform 140ms ease}
.skm-tool-button:hover{background:var(--dsw-alias-interactive-bg-hover-solid,#f7f8f9);color:var(--dsw-alias-label-primary,#0f1115)}
.skm-tool-button:active{transform:scale(.97)}
.skm-tool-button:disabled{opacity:.5;cursor:default}
.skm-toolbar-spacer{flex:1 1 12px}
.skm-bulk-overlay{position:fixed;inset:0;z-index:995;border:none;background:transparent;cursor:default;padding:0}
.skm-preset-pill{position:relative;flex:none;display:inline-flex;align-items:center;gap:6px;height:36px;box-sizing:border-box;border:1px solid #c9d6f5;border-radius:10px;background:#eef3fd;color:#3b62d6;padding:0 10px;font-family:inherit;font-size:13px;line-height:18px;cursor:pointer;transition:border-color 140ms ease,background 140ms ease,transform 140ms ease}
.skm-preset-pill:active{transform:scale(.97)}
.skm-preset-pill-label{max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.skm-preset-select{appearance:none;-webkit-appearance:none;border:none;outline:none;background:transparent;color:inherit;font-size:13px;line-height:18px;font-family:inherit;padding:0 18px 0 0;cursor:pointer;max-width:150px}
.skm-preset-pill-chevron{pointer-events:none;color:#6f8cd6;transition:transform 140ms ease}
.skm-preset-pill[aria-expanded='true'] .skm-preset-pill-chevron{transform:rotate(180deg)}
.skm-drop-wrap{position:relative;flex:none}
.skm-drop-menu{position:absolute;top:calc(100% + 4px);left:0;z-index:996;min-width:180px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:10px;background:var(--dsw-alias-bg-layer-1,#fff);box-shadow:0 6px 20px rgba(16,24,40,.12);padding:4px;display:flex;flex-direction:column;gap:2px;animation:skm-form-in 140ms ease-out;max-height:320px;overflow-y:auto}
.skm-drop-item{display:flex;align-items:center;gap:8px;border:none;border-radius:8px;padding:7px 10px;background:transparent;font-size:13px;line-height:18px;color:var(--dsw-alias-label-secondary,#61666b);cursor:pointer;font-family:inherit;text-align:left;white-space:nowrap;transition:background 120ms ease,color 120ms ease}
.skm-drop-item:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.04));color:var(--dsw-alias-label-primary,#0f1115)}
.skm-drop-item[aria-checked='true']{color:var(--dsw-alias-label-primary,#0f1115);font-weight:600}
.skm-drop-check{flex:none;width:16px;height:16px;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--dsw-alias-state-business-primary,#4176e6);opacity:0;transform:scale(.6);transition:opacity 140ms ease,transform 140ms ease}
.skm-drop-check[data-on]{opacity:1;transform:scale(1)}
.skm-drop-badge{margin-left:auto;flex:none;font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary,#61666b);background:var(--dsw-alias-bg-module-platform,#f1f3f5);border-radius:999px;padding:0 8px}
.skm-view-toggle{flex:none;display:inline-flex;align-items:center;gap:2px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:10px;background:var(--dsw-alias-bg-base,#fff);padding:3px;transition:border-color 140ms ease}
.skm-view-btn{flex:none;display:inline-flex;align-items:center;justify-content:center;width:30px;height:28px;border:none;border-radius:8px;background:transparent;color:var(--dsw-alias-label-caption,#adb2b8);cursor:pointer;transition:background 140ms ease,color 140ms ease,transform 140ms ease}
.skm-view-btn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.04));color:var(--dsw-alias-label-secondary,#61666b)}
.skm-view-btn[data-active]{background:var(--dsw-alias-bg-module-platform,#eef0f2);color:var(--dsw-alias-label-primary,#0f1115)}
.skm-view-btn:active{transform:scale(.94)}
.skm-hint-row{flex:none;display:flex;align-items:center;gap:10px;padding:6px 16px 0}
.skm-hint-row-text{flex:1;min-width:0;font-size:12px;line-height:17px;color:var(--dsw-alias-label-tertiary,#81858c)}
.skm-banner{flex:none;display:flex;align-items:center;gap:12px;margin:10px 16px 0;box-sizing:border-box;border:1px solid #f2df9e;border-radius:14px;background:#fdf8e3;padding:10px 12px;cursor:pointer;transition:border-color 140ms ease,box-shadow 140ms ease,transform 140ms ease}
.skm-banner:hover{border-color:#ecd58a;box-shadow:0 2px 8px rgba(232,163,61,.12)}
.skm-banner:active{transform:scale(.995)}
.skm-banner-active{border-color:#e8a33d;box-shadow:0 0 0 3px rgba(232,163,61,.18)}
.skm-banner-icon{flex:none;width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;border:1.5px solid #e8a33d;color:#e8a33d;background:transparent}
.skm-banner-text{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.skm-banner-title{font-size:14px;font-weight:700;line-height:20px;color:#1f2937}
.skm-banner-sub{font-size:12px;line-height:17px;color:#6b7280;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.skm-banner-btn{flex:none;display:inline-flex;align-items:center;height:32px;box-sizing:border-box;border:none;border-radius:10px;background:#e8850c;color:#fff;font-size:13px;font-weight:600;line-height:18px;font-family:inherit;padding:0 14px;cursor:pointer;box-shadow:0 1px 3px rgba(232,133,12,.35);transition:background 140ms ease,transform 140ms ease,box-shadow 140ms ease}
.skm-banner-btn:hover{background:#d67906;box-shadow:0 2px 8px rgba(232,133,12,.4);transform:translateY(-1px)}
.skm-banner-btn:active{transform:translateY(0) scale(.98)}
.skm-main-scroll{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;box-sizing:border-box;padding:12px 16px 20px;display:flex;flex-direction:column;gap:12px;scrollbar-gutter:stable}
.skm-hub-section{min-width:0;width:100%;box-sizing:border-box}
/* 展开/折叠恒为整行宽：旧规则只让 data-open 的 section 跨两列，收起时会缩成半宽。 */
.skm-hub-section{display:flex;flex-direction:column;min-width:0}
.skm-hub-section-head{display:flex;align-items:center;gap:8px;min-width:0;padding:2px 4px 0}
.skm-no-result{padding:18px 4px;font-size:13px;line-height:20px;color:var(--dsw-alias-label-tertiary,#81858c)}
/* 新建技能包入口（灰字按钮行） */
.skm-new-bundle-line{flex:none;align-self:flex-start;display:inline-flex;align-items:center;gap:4px;border:none;border-radius:8px;padding:6px 10px;margin:2px 0 0 4px;background:transparent;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary,#81858c);cursor:pointer;font-family:inherit;transition:background 140ms ease,color 140ms ease}
.skm-new-bundle-line:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.04));color:var(--dsw-alias-label-secondary,#61666b)}
/* 分页行 */
.skm-pagination{flex:none;display:flex;align-items:center;gap:10px;padding:4px 4px 0}
.skm-page-info{font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary,#81858c)}
.skm-page-btns{flex:1;display:flex;align-items:center;gap:4px}
.skm-page-btn{flex:none;min-width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:8px;background:var(--dsw-alias-bg-base,#fff);color:var(--dsw-alias-label-secondary,#61666b);font-size:12px;line-height:18px;font-family:inherit;cursor:pointer;transition:border-color 140ms ease,color 140ms ease,background 140ms ease,transform 140ms ease}
.skm-page-btn:hover{border-color:var(--dsw-alias-border-l3,rgba(0,0,0,.16));color:var(--dsw-alias-label-primary,#1f2430)}
.skm-page-btn:active{transform:scale(.94)}
.skm-page-btn:disabled{opacity:.45;cursor:default}
.skm-page-btn[data-active]{background:var(--dsw-alias-state-business-primary,#3d6be5);border-color:var(--dsw-alias-state-business-primary,#3d6be5);color:#fff}
.skm-page-size-sel{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,#61666b)}

/* ── 归入技能包弹窗（卡片化，与技能卡片同语言） ─────────────── */
.skm-assign-modal{width:min(560px,calc(100vw - 48px))}
.skm-assign-modal-body{overflow:hidden;display:flex;flex-direction:column;max-height:min(560px,calc(100vh - 180px))}
.skm-assign-list{list-style:none;margin:0;padding:4px 2px 2px;display:flex;flex-direction:column;gap:8px;overflow-y:auto}
.skm-assign-card{display:flex;align-items:center;gap:10px;width:100%;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.08));border-radius:12px;background:var(--dsw-alias-bg-base,#fff);padding:10px 12px;cursor:pointer;font-family:inherit;text-align:left;opacity:0;animation:skm-card-in 240ms cubic-bezier(.2,.7,.3,1.06) forwards;animation-delay:calc(var(--skm-i,0)*45ms);transition:border-color 140ms ease,box-shadow 140ms ease,transform 140ms ease}
.skm-assign-card:hover{border-color:var(--dsw-alias-state-business-primary,#4176e6);box-shadow:0 2px 8px rgba(16,24,40,.07);transform:translateY(-1px)}
.skm-assign-card:active{transform:translateY(0) scale(.99)}
.skm-assign-card-icon{flex:none;width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.08));border-radius:10px;background:var(--dsw-alias-bg-module-platform,#f5f6f7);color:var(--dsw-alias-label-secondary,#61666b);transition:color 140ms ease,border-color 140ms ease}
.skm-assign-card:hover .skm-assign-card-icon{color:var(--dsw-alias-label-primary,#0f1115);border-color:var(--dsw-alias-border-l3,rgba(0,0,0,.14))}
.skm-assign-card-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.skm-assign-card-name{font-size:14px;font-weight:600;line-height:20px;color:var(--dsw-alias-label-primary,#0f1115);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.skm-assign-card-desc{font-size:12px;line-height:17px;color:var(--dsw-alias-label-tertiary,#81858c)}
.skm-assign-go{flex:none;display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;color:var(--dsw-alias-label-caption,#adb2b8);transform:rotate(-90deg);transition:transform 160ms ease,background 140ms ease,color 140ms ease}
.skm-assign-card:hover .skm-assign-go{transform:rotate(-90deg) translateX(2px);color:var(--dsw-alias-state-business-primary,#4176e6);background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.03))}
.skm-skill-list{list-style:none;margin:0;padding:2px 6px 6px;width:100%;display:flex;flex-direction:column;gap:2px}
.skm-skill-item{display:flex;flex-direction:column;gap:2px;padding:2px 0;border-radius:8px}
.skm-skill-item:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
.skm-skill-row{display:flex;align-items:center;gap:6px;padding:2px 6px;border-radius:8px}
.skm-skill-row:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
.skm-skill-label{flex:1;min-width:0;display:flex;flex-direction:column;overflow:hidden}
.skm-skill-name{font-size:13px;line-height:18px;color:var(--dsw-alias-label-primary,#eee);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.skm-skill-desc{font-size:12px;line-height:16px;color:var(--dsw-alias-label-tertiary,#888);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.skm-skill-expand{flex:none;display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border:none;border-radius:6px;padding:0;background:transparent;cursor:pointer;color:var(--dsw-alias-label-tertiary,#888);transition:transform 120ms}
.skm-skill-expand:hover{color:var(--dsw-alias-label-primary,#eee);background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
.skm-skill-expand[data-open='true']{transform:rotate(180deg)}
.skm-skill-count{flex:none;font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary,#888);background:var(--dsw-alias-bg-module-platform,rgba(255,255,255,.05));border-radius:8px;padding:0 6px;white-space:nowrap}
.skm-skill-compat{flex:none;font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary,#888);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:170px}
.skm-skill-files{list-style:none;margin:0 0 2px 10px;padding:2px 0 2px 10px;border-left:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.1));display:flex;flex-direction:column;gap:0}
.skm-skill-file{display:flex;align-items:center;gap:6px;padding:2px 6px;border-radius:6px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,#bbb);font-family:ui-monospace,monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.skm-skill-file:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
.skm-skill-file[data-main='true']{color:var(--dsw-alias-label-primary,#eee);font-weight:500}
.skm-skill-dir{color:var(--dsw-alias-label-tertiary,#888)}
.skm-skill-preview{border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));border-radius:10px;background:var(--dsw-alias-bg-base,#0e1116);padding:8px 12px;margin:0 0 2px 10px;font-size:12px;line-height:20px;color:var(--dsw-alias-label-primary,#eee);overflow:auto;max-height:280px;box-sizing:border-box}
.skm-skill-preview h3,.skm-skill-preview h4,.skm-skill-preview h5{margin:10px 0 4px;font-size:13px;line-height:20px;color:var(--dsw-alias-label-primary,#eee)}
.skm-skill-preview p{margin:4px 0}
.skm-skill-preview pre{background:var(--dsw-alias-bg-module-platform,rgba(255,255,255,.05));border-radius:8px;padding:8px 10px;overflow:auto;font-family:ui-monospace,monospace;font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary,#bbb);margin:6px 0}
.skm-skill-preview code{background:var(--dsw-alias-bg-module-platform,rgba(255,255,255,.05));border-radius:4px;padding:0 4px;font-family:ui-monospace,monospace;font-size:11px}
.skm-skill-preview a{color:var(--dsw-alias-state-business-primary,#4a9eff)}
.skm-skill-preview ul{margin:4px 0;padding-left:18px}
.skm-skill-preview li{margin:2px 0}
/* 查看器默认就是大画幅（1280×880 上限，随视口收缩），可一键全屏；宽/高带缓动过渡。 */
.skm-viewer-modal{width:min(1280px,calc(100vw - 64px));animation:skm-viewer-in 260ms cubic-bezier(.2,.7,.3,1.06);transition:width 320ms cubic-bezier(.22,.72,.24,1)}
.skm-viewer-modal-full{width:calc(100vw - 48px)}
@keyframes skm-viewer-in{from{opacity:0;transform:translateY(12px) scale(.985)}to{opacity:1;transform:none}}
.skm-viewer-body{overflow:hidden;display:flex;flex-direction:column;height:min(880px,calc(100vh - 96px));transition:height 320ms cubic-bezier(.22,.72,.24,1);--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2)}
/* 官方 Modal 的 root 自带 24px 内边距、dialog 自带 24px 下内边距：
   全屏档按这两处留白收，免得被 flex-shrink 截断或上下溢出。 */
.skm-viewer-modal-full .skm-viewer-body{height:calc(100vh - 76px)}
/* 弹窗头部（官方 Modal 的 header 是本容器第一个 div）：随大画幅放大一档。 */
.skm-viewer-body > div:first-child{padding:20px 18px 0 26px}
.skm-viewer-body > div:first-child h2{font-size:17px;line-height:26px;font-weight:600}
.skm-viewer-body > div:nth-of-type(2){flex:1;min-height:0;display:flex;flex-direction:column;margin-top:2px;padding:0 20px 20px}
.skm-viewer-toolbar{flex:none;display:flex;align-items:center;gap:10px;padding:0 2px 12px}
.skm-viewer-path{flex:1;min-width:0;display:flex;align-items:center;gap:8px;font-size:12.5px;line-height:18px;font-family:ui-monospace,monospace;color:var(--dsw-alias-label-tertiary,#888);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.skm-viewer-path b{font-weight:600;color:var(--dsw-alias-label-secondary,#61666b)}
.skm-viewer-tool-group{flex:none;display:inline-flex;align-items:center;gap:2px;padding:2px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.08));border-radius:10px;background:var(--dsw-alias-bg-module-platform,#f5f6f7)}
.skm-viewer-tool-btn{flex:none;display:inline-flex;align-items:center;justify-content:center;min-width:28px;height:26px;padding:0 7px;box-sizing:border-box;border:none;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary,#61666b);font-family:inherit;font-weight:600;line-height:16px;cursor:pointer;transition:background 140ms ease,color 140ms ease,box-shadow 140ms ease,transform 140ms ease}
.skm-viewer-tool-btn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.05));color:var(--dsw-alias-label-primary,#1f2430)}
.skm-viewer-tool-btn:active{transform:scale(.93)}
.skm-viewer-tool-btn[data-active='true']{background:var(--dsw-alias-bg-base,#fff);color:var(--dsw-alias-state-business-primary,#4176e6);box-shadow:0 1px 3px rgba(16,24,40,.12)}
.skm-viewer-tool-btn-a1{font-size:11px}
.skm-viewer-tool-btn-a3{font-size:15px}
.skm-viewer-tool-btn-frame{border:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.1));border-radius:10px;background:var(--dsw-alias-bg-base,#fff)}
.skm-viewer-tool-btn-frame[data-active='true']{border-color:var(--dsw-alias-state-business-primary,#4176e6);background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#4176e6) 10%,transparent);color:var(--dsw-alias-state-business-primary,#4176e6);box-shadow:none}
.skm-viewer-layout{flex:1;min-height:0;display:flex;border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));border-radius:14px;overflow:hidden}
.skm-viewer-nav{flex:none;width:252px;border-right:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));overflow-y:auto;padding:8px;box-sizing:border-box;background:var(--dsw-alias-bg-module-platform,#f5f6f7)}
.skm-viewer-nav-item{display:flex;align-items:center;gap:6px;padding:5px 9px;border-radius:8px;font-size:12.5px;line-height:20px;color:var(--dsw-alias-label-secondary,#bbb);font-family:ui-monospace,monospace;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:background 140ms ease,color 140ms ease,box-shadow 160ms ease}
.skm-viewer-nav-item:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
.skm-viewer-nav-item[data-active='true']{background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#4a9eff) 14%,transparent);color:var(--dsw-alias-label-primary,#eee);box-shadow:inset 2px 0 0 var(--dsw-alias-state-business-primary,#4a9eff)}
.skm-viewer-nav-dir{cursor:default;color:var(--dsw-alias-label-tertiary,#888)}
/* 正文全部走 em：--skm-vfs 一个变量驱动字号三档，切换时只过渡 font-size。 */
.skm-viewer-content{flex:1;min-width:0;overflow:auto;padding:26px 34px 48px;box-sizing:border-box;font-size:var(--skm-vfs,15px);line-height:1.75;color:var(--dsw-alias-label-primary,#eee);transition:font-size 180ms ease}
.skm-viewer-content > :first-child{margin-top:0}
.skm-viewer-content h1,.skm-viewer-content h2,.skm-viewer-content h3,.skm-viewer-content h4,.skm-viewer-content h5{margin:1.15em 0 .5em;line-height:1.35;font-weight:600;color:var(--dsw-alias-label-primary,#eee);max-width:84ch}
.skm-viewer-content h1{font-size:1.72em;letter-spacing:-.012em}
.skm-viewer-content h2{font-size:1.38em}
.skm-viewer-content h3{font-size:1.16em}
.skm-viewer-content h4,.skm-viewer-content h5{font-size:1.04em}
.skm-viewer-content p{margin:.62em 0;max-width:92ch}
.skm-viewer-content pre{background:var(--dsw-alias-bg-module-platform,rgba(255,255,255,.05));border-radius:10px;padding:14px 16px;overflow:auto;font-family:ui-monospace,monospace;font-size:.86em;line-height:1.7;color:var(--dsw-alias-label-secondary,#bbb)}
.skm-viewer-content code{background:var(--dsw-alias-bg-module-platform,rgba(255,255,255,.05));border-radius:5px;padding:1px 5px;font-family:ui-monospace,monospace;font-size:.86em}
.skm-viewer-content pre code{background:transparent;padding:0}
.skm-viewer-content a{color:var(--dsw-alias-state-business-primary,#4a9eff)}
.skm-viewer-content ul,.skm-viewer-content ol{margin:.62em 0;padding-left:1.6em}
.skm-viewer-content li{margin:.32em 0;max-width:92ch}
.skm-viewer-content blockquote{margin:.9em 0;padding:.25em 1em;border-left:3px solid var(--dsw-alias-border-l2,rgba(255,255,255,.12));color:var(--dsw-alias-label-secondary,#bbb);max-width:82ch}
.skm-viewer-content hr{border:none;border-top:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));margin:1.5em 0}
.skm-loose-empty{margin:2px;padding:4px 0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary,#888)}
.skm-visually-hidden{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}

/* ── 技能/技能包开关（Skills Hub 风格：绿色胶囊 + 白色圆钮，回弹过渡） ── */
.skm-toggle{flex:none;display:inline-flex;align-items:center;width:34px;height:20px;box-sizing:border-box;border-radius:10px;padding:2px;appearance:none;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));background:var(--dsw-alias-bg-module-platform,#e9ebee);cursor:pointer;transition:background 160ms ease,border-color 160ms ease,filter 160ms ease}
.skm-toggle:hover{filter:brightness(1.03)}
.skm-toggle:disabled{opacity:.55;cursor:not-allowed;filter:none}
.skm-toggle:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4176e6);outline-offset:1px}
.skm-toggle-on{border-color:transparent;background:var(--dsw-alias-state-business-primary,#4176e6)}
.skm-toggle-off{background:var(--dsw-alias-bg-module-platform,#e9ebee);border-color:var(--dsw-alias-border-l2,rgba(0,0,0,.1))}
.skm-toggle-knob{display:block;width:12px;height:12px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.2);transition:transform 180ms cubic-bezier(.3,1.4,.5,1)}
.skm-toggle-on .skm-toggle-knob{transform:translateX(14px)}
.skm-toggle-off .skm-toggle-knob{transform:translateX(0)}
.skm-bundle-toggle{flex:none;display:inline-flex;align-items:center;gap:4px;margin-left:0}

/* ── Agent 预设分类圆球条（弧形恢复，整列位于统计行与工具栏之间） ── */
.skm-preset-strip{flex:none;display:flex;align-items:flex-start;gap:10px;padding:12px 16px 0;overflow-x:auto;overflow-y:hidden;scrollbar-width:none}
.skm-preset-strip::-webkit-scrollbar{display:none}
.skm-preset-ball-wrap{flex:none;display:flex;flex-direction:column;align-items:center;gap:6px;width:56px;border:none;background:transparent;padding:0;cursor:pointer;font-family:inherit}
.skm-preset-ball{position:relative;display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:50%;box-sizing:border-box;font-size:17px;font-weight:600;line-height:1;color:var(--dsw-alias-label-primary,#eee);text-transform:uppercase;background:var(--dsw-alias-bg-layer-2,#262b36);border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.14));transition:border-color 140ms,filter 140ms}
.skm-preset-ball-wrap:hover .skm-preset-ball{filter:brightness(1.15)}
.skm-preset-ball-wrap[data-active='true'] .skm-preset-ball{border-color:var(--dsw-alias-state-business-primary,#4a9eff);box-shadow:inset 0 0 0 1px var(--dsw-alias-state-business-primary,#4a9eff)}
.skm-preset-ball[data-dot='true']::after{content:'';position:absolute;right:-1px;bottom:-1px;width:12px;height:12px;border-radius:50%;background:var(--dsw-alias-state-business-primary,#4a9eff);border:2px solid var(--dsw-alias-bg-layer-1,#1c1f26);box-sizing:border-box}
.skm-preset-ball-label{max-width:56px;font-size:11px;line-height:15px;color:var(--dsw-alias-label-tertiary,#888);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center}
.skm-preset-ball-wrap[data-active='true'] .skm-preset-ball-label{color:var(--dsw-alias-label-primary,#eee)}
.skm-preset-hint{flex:none;display:flex;align-items:center;gap:8px;padding:0 2px 2px}
.skm-preset-hint-text{flex:1;min-width:0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary,#888)}
.skm-preset-reset{flex:none;appearance:none;border:none;border-radius:12px;padding:2px 10px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,#999);background:transparent;cursor:pointer;font-family:inherit}
.skm-preset-reset:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06));color:var(--dsw-alias-label-primary,#eee)}

/* ── 面板级提示条：删除/归组/改名/安装的成败都要让用户看见 ── */
.skm-toast-stack{position:absolute;right:18px;bottom:18px;z-index:6;display:flex;flex-direction:column;align-items:flex-end;gap:8px;pointer-events:none}
.skm-toast{display:inline-flex;align-items:center;gap:8px;max-width:min(460px,72vw);box-sizing:border-box;padding:8px 14px;border-radius:10px;font-size:12.5px;line-height:18px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));background:var(--dsw-static-neutral-bluish-00,#fff);color:var(--dsw-alias-label-primary,#222);box-shadow:var(--dsw-shadow-lv2,0 6px 22px rgba(0,0,0,.16));animation:skm-toast-in 260ms cubic-bezier(.2,.9,.25,1) both}
.skm-toast-ok{border-color:rgba(35,160,90,.38);color:#1c7a45}
.skm-toast-err{border-color:rgba(226,80,64,.42);color:#b3271c}
.skm-toast-dot{flex:none;width:6px;height:6px;border-radius:50%;background:currentColor;animation:skm-toast-ping 1.7s ease-out infinite}
@keyframes skm-toast-in{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:none}}
@keyframes skm-toast-ping{0%{box-shadow:0 0 0 0 currentColor;opacity:.9}70%{box-shadow:0 0 0 7px rgba(0,0,0,0);opacity:.35}100%{box-shadow:0 0 0 0 rgba(0,0,0,0);opacity:1}}
body[data-ds-dark-theme] .skm-toast{background:var(--dsw-static-neutral-bluish-850,#2c2c2e)}
body[data-ds-dark-theme] .skm-toast-ok{color:#6ee7a8}
body[data-ds-dark-theme] .skm-toast-err{color:#ff8a7a}

/* ── 空技能包：可见 + 可操作（旧实现把 0 成员的包整段过滤掉，建完包就「消失」） ── */
.skm-bundle-empty{grid-column:1/-1;display:flex;align-items:center;gap:12px;flex-wrap:wrap;box-sizing:border-box;margin:2px 0 6px;padding:14px 16px;border:1px dashed var(--dsw-alias-border-l2,rgba(0,0,0,.18));border-radius:12px;background:var(--dsw-alias-bg-layer-1,rgba(0,0,0,.02));animation:skm-fade-up 260ms ease both}
.skm-bundle-empty-title{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary,#333)}
.skm-bundle-empty-hint{flex:1 1 200px;min-width:160px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary,#8b9099)}
.skm-bundle-empty-btn{flex:none;display:inline-flex;align-items:center;gap:6px;appearance:none;border:1px solid var(--dsw-alias-state-business-primary,#4176e6);border-radius:9px;padding:5px 12px;font-size:12px;line-height:18px;font-family:inherit;cursor:pointer;color:var(--dsw-alias-state-business-primary,#4176e6);background:transparent;transition:background 160ms ease,color 160ms ease,transform 160ms ease,box-shadow 160ms ease}
.skm-bundle-empty-btn:hover{background:var(--dsw-alias-state-business-primary,#4176e6);color:#fff;transform:translateY(-1px);box-shadow:0 4px 14px rgba(65,118,230,.28)}
.skm-bundle-empty-btn:active{transform:translateY(0)}
@keyframes skm-fade-up{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}

/* ── 账本失效引用：明说「包里有指向已删除技能的条目」并一键清理 ── */
.skm-bundle-missing{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:2px 0 6px;padding:8px 12px;border-radius:10px;border:1px solid rgba(240,150,40,.38);background:rgba(240,150,40,.09);font-size:12px;line-height:18px;color:#8a5a12;animation:skm-fade-up 260ms ease both}
.skm-bundle-missing code{padding:1px 6px;border-radius:5px;background:rgba(240,150,40,.16);font-size:11.5px}
.skm-bundle-missing-btn{appearance:none;border:1px solid rgba(240,150,40,.55);background:transparent;border-radius:8px;padding:2px 9px;font-size:11.5px;line-height:18px;font-family:inherit;cursor:pointer;color:inherit;transition:background 140ms ease,transform 140ms ease}
.skm-bundle-missing-btn:hover{background:rgba(240,150,40,.2);transform:translateY(-1px)}
body[data-ds-dark-theme] .skm-bundle-missing{color:#f0c48a}
.skm-install-hint{margin:2px 0 0;font-size:11.5px;line-height:17px;color:var(--dsw-alias-label-tertiary,#8b9099)}

/* ── SKILL 顶栏操作行：搜索 + 状态分段（带计数）+ 健康指示 + 刷新/新建/添加 ── */
.skm-topbar-actions{flex:1 1 100%;order:4;min-width:0;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.skm-status-seg-count{margin-left:6px;font-size:11px;line-height:15px;font-variant-numeric:tabular-nums;opacity:.72}
.skm-health-inline{flex:none;display:inline-flex;align-items:center;gap:6px;font-size:12px;line-height:17px;white-space:nowrap;color:var(--dsw-alias-label-secondary,#61666b)}
.skm-health-inline::before{content:'';flex:none;width:7px;height:7px;border-radius:50%;background:currentColor}
.skm-health-inline[data-tone='ok']{color:#12805c}
.skm-health-inline[data-tone='warn']{color:#c2410c}
.skm-health-inline[data-tone='pending'],.skm-health-inline[data-tone='idle']{color:var(--dsw-alias-label-caption,#adb2b8)}

/* ── 移动端：侧栏收窄/隐藏、查看器上下堆叠、卡片网格单列 ───────── */
@media (max-width: 767.98px) {
  .skm-viewer-modal,.skm-viewer-modal-full{width:calc(100vw - 48px)}
  .skm-viewer-body,.skm-viewer-modal-full .skm-viewer-body{height:calc(100vh - 76px)}
  .skm-viewer-body > div:nth-of-type(2){padding:0 10px 10px}
  .skm-viewer-toolbar{flex-wrap:wrap;gap:6px;padding-bottom:8px}
  .skm-viewer-layout{flex-direction:column}
  .skm-viewer-nav{width:100%;border-right:none;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));flex:none;max-height:38%}
  .skm-viewer-content{flex:1;min-height:0;padding:16px 14px 28px}
  .skm-hub-side{display:none}
  .skm-skill-grid{grid-template-columns:minmax(0,1fr)}
  .skm-toolbar{padding:12px 12px 4px}
  .skm-banner{margin:10px 12px 0}
  .skm-main-scroll{padding:12px 12px 20px}
}

/* ── 减弱动效：卡片入场/悬停位移与开关回弹全部收敛 ───────────── */
@media (prefers-reduced-motion: reduce) {
  .skm-skill-card{animation:none;opacity:1;transition:none}
  .skm-assign-card{animation:none;opacity:1;transition:none}
  .skm-drop-menu{animation:none}
  .skm-viewer-modal{animation:none}
  .skm-viewer-modal,.skm-viewer-body,.skm-viewer-content,.skm-viewer-nav-item,.skm-viewer-tool-btn{transition:none}
  .skm-toggle-knob{transition:none}
  .skm-toggle{transition:none}
  .skm-tag{transition:none}
  .skm-skill-copy,.skm-skill-icon,.skm-skill-foot-icon,.skm-icon-action,.skm-bundle,.skm-hub-item,.skm-tool-button,.skm-banner,.skm-banner-btn,.skm-view-btn,.skm-drop-item,.skm-assign-card{transition:none}
  .skm-toast{animation:none}
  .skm-toast-dot{animation:none}
  .skm-bundle-empty,.skm-bundle-missing{animation:none}
  .skm-bundle-empty-btn,.skm-bundle-missing-btn{transition:none}
  .skm-skill-card::before,.skm-skill-badge,.skm-skill-title,.skm-tag-status{transition:none}
  .skm-cat-chip-row{animation:none}
  .skm-bundle-cat-tag,.skm-cat-selected-tag{animation:none}
  .skm-cat-chip,.skm-bundle-cat-tag,.skm-cat-preset,.skm-cat-remove,.skm-cat-input,.skm-cat-chip-count{transition:none}
}
`

export function ensureStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID) !== null) return
  const tag = document.createElement('style')
  tag.id = STYLE_ID
  tag.textContent = SHEET
  document.head.appendChild(tag)
}

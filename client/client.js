window.__ModuleLoader__.load({
	id: "dsh-prompt-customizer",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_dom_client = require("react-dom/client");
		let react_dom = require("react-dom");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/locales.ts
		/** Locale dictionaries for the prompt-customizer panel. */
		const DICT = {
			zh: {
				nav: "提示词定制",
				loading: "加载中…",
				unavailable: "当前环境未启用本命名空间。",
				tabsSections: "提示词",
				tabsTools: "工具",
				tabsPresets: "配置",
				tabsPreview: "预览",
				refresh: "刷新",
				blockedOff: "未屏蔽",
				blockedOn: "已屏蔽",
				replaced: "已替换",
				manual: "手动",
				system: "系统",
				replace: "编辑",
				clearReplace: "清除",
				clearInput: "清空",
				injectNew: "注入新段",
				name: "名称",
				order: "顺序",
				text: "文本",
				add: "添加",
				hiddenOff: "可见",
				hiddenOn: "已隐藏",
				selectAll: "全选",
				selectNone: "全不选",
				empty: "（空）",
				dynamic: "<动态生成>",
				drag: "拖动排序",
				moveUp: "上移",
				moveDown: "下移",
				previewHint: "以下为屏蔽/替换/注入后的最终系统提示词：",
				previewPrompt: "提示词预览",
				previewSections: "段",
				previewTools: "工具预览",
				previewToolCount: "个工具",
				savePreset: "保存当前配置",
				presetName: "配置名称",
				saveAsPresetCard: "存为 agent 预设",
				saveAsPresetHint: "整体复制「{name}」这个预设的组成为新预设（组成文件与伴生脚本一并带走），再把当前定制写进它的覆盖项 —— 新预设出现在顶部编辑目标里。",
				agentPresetName: "新预设名",
				forkSourceDefault: "默认预设",
				saveAsPresetOk: "预设已创建，可在顶部的编辑目标选择器里选到它",
				saveAsPresetFail: "保存预设失败",
				save: "保存",
				importPreset: "导入配置",
				import: "导入",
				apply: "应用",
				export: "导出",
				delete: "删除",
				restore: "还原",
				active: "使用中",
				preset: "预设",
				ioFailed: "导入/导出失败",
				importInvalid: "无效的配置文件",
				targetGlobal: "目标：全局默认",
				targetHint: "选择编辑目标 —— 选中某个 agent 预设后，改动只对该预设生效（字段级覆盖）。",
				syncAllPhases: "三态同步",
				syncAllPhasesHint: "勾选后，屏蔽 / 解除屏蔽、替换文本（提示词）与拖入 / 拖出（工具的加减）对三个阶段一起生效，只作用于同名的那一项；某阶段没有的名字保持原样。默认关闭：三个阶段需逐一处理。",
				broken: "损坏",
				brokenPreset: "该 agent 预设当前无法挂载，仍可编辑其定制（修复预设后自动生效）。",
				phaseBootstrap: "仅引导阶段",
				phaseActive: "晋级后",
				phaseCompaction: "压缩后",
				phaseStageGuide: "引导期",
				phaseStageResident: "常驻期",
				phaseStageControlled: "压缩受控期",
				toolsPartGuide: "引导期工具",
				toolsPartResident: "常驻期工具",
				toolsPartControlled: "压缩受控期工具",
				allToolsTitle: "本系统全部工具",
				sectionsPartGuide: "引导期提示词",
				sectionsPartResident: "常驻期提示词",
				sectionsPartControlled: "压缩受控期提示词",
				allSectionsTitle: "本系统全部提示词",
				toolsFourHint: "三个阶段各一份名单，互不继承：勾选 = 该阶段是否对模型可见；从「全部」拖入某阶段 = 让这一个工具在该阶段出现（若该阶段默认裁掉了它，就加回去）；在两个阶段之间拖动 = 复制（源阶段不动，目标阶段多一份，隐藏/启用状态一起带过去）；拖回「全部」= 从该阶段拿掉它。每个动作只影响被拖的那一个工具。",
				sectionsFourHint: "拖拽双向：把「全部」里的段拖入上方阶段 = 加入该阶段并默认开启；从阶段拖回「全部」= 从该阶段移除。屏蔽段与普通段完全一样可拖拽 / 编辑，只是不注入模型。",
				dragHint: "拖入 = 让该工具在这个阶段出现",
				phaseShortGuide: "引",
				phaseShortResident: "常",
				phaseShortControlled: "压",
				poolMarksHint: "每个名字后的三个标记 = 该工具在引导期 / 常驻期 / 压缩受控期的状态：绿=该阶段可见（或已加回），灰=该阶段已隐藏，暗=不在该阶段、也没加回。",
				toolAddedTag: "加回",
				toolAdded: "已把「{name}」加回{phase}：该阶段默认裁掉了它，保存后它会重新出现在该阶段（当前预设注册表里有它）。",
				toolNotInRegistry: "「{name}」不在本预设的注册表里（它是别的预设独有的工具），当前预设没有它的定义，加不进来。",
				toolCopied: "已把「{name}」复制到{to}：{from}那份保持不动，隐藏/启用状态一起带过去。",
				toolShown: "「{name}」已在{to}显示。",
				toolHiddenIn: "「{name}」已在{to}隐藏。",
				toolSyncShown: "「{name}」已在三个阶段显示（该阶段目录里没有的已写进各自的加回名单）。",
				toolSyncHidden: "「{name}」已在三个阶段隐藏 / 移除。",
				sectionsTakenOver: "「{name}」段声明了 complete 整段接管（宿主在装配瀑布流之后强制还原为那一条段）。本插件默认的 forceSections 已绕开该机制，段级屏蔽 / 替换 / 注入 / 排序照常生效；此提示只会在 forceSections 关闭或强制覆盖失效时出现，开启 forceSections 即可恢复。",
				sectionsLost: "本插件在该阶段产出的 {emitted} 个段里，只有 {survived} 个进入最终提示词：其余被下游装配规则丢弃，段级定制不会完全生效（工具过滤不受影响）。",
				sectionBlockedStrip: "（本阶段已屏蔽，模型不可见）",
				phaseSuppressed: "被抑制（不在任何阶段的装配中）",
				sectionDynamicNoAdd: "「{name}」是运行时才生成的动态段，没法预先加进某个阶段（它的内容只有装配时才知道）。",
				exportOk: "导出成功",
				exportCancel: "已取消导出",
				exportFail: "导出失败",
				importOk: "导入完成",
				importNone: "没有新增预设（同名已存在或文件为空）",
				importCancel: "已取消导入",
				importFail: "导入失败",
				saveOk: "已保存",
				saveFail: "保存失败",
				discardConfirm: "有未保存的更改，离开将丢弃。确定离开吗？",
				forceTitle: "强制覆盖（forceSections）",
				forceHint: "开启后所有预设的提示词段一律以本插件为准（绕过 complete 整段接管与预设阶段裁段）；关闭后退回瀑布流内过滤，预设可能压过定制。「恢复初始状态」会自动关闭它。",
				forceOn: "已开启",
				forceOff: "已关闭",
				zhSwitch: "中文提示词",
				zhHint: "开关。开启：把名字对得上译本的段一次性覆盖为中文（写入编辑草稿，保存后生效）；关闭：清除这些段的替换文本，回归英文原文。自定义段与对不上名字的段不受影响。",
				zhApplied: "已把中文写入编辑草稿：点「保存」生效；对不上名字的段保持原样。",
				zhReverted: "已把英文原文写回编辑草稿（清除中文替换），点「保存」生效。",
				zhNotReady: "三阶段装配尚未加载完成，请先点「刷新」或稍后再试。",
				envBlockTitle: "环境变量黑名单（envBlocklist）",
				envBlockHint: "系统环境变量（process.env）已全量注册为提示词变量：段文本里写 {{env_键名小写}} 引用（如 {{env_path}}）；命中黑名单的键不注册——env 里常有密钥，进了提示词就会随请求发给模型。条目支持 * 通配、大小写不敏感。内置变量 {{date}} {{time}} {{datetime}} {{weekday}} {{hostname}} {{platform}} {{arch}} {{username}} {{home}} {{shell}} {{locale}} {{node_version}} 恒可用。",
				envBlockAdd: "键名或通配，如 GITHUB_TOKEN 或 *_KEY*",
				envBlockAddAction: "添加",
				envBlockEmpty: "黑名单为空：所有环境变量都会被注册",
				envVarsTitle: "已注册的提示词变量",
				envVarsHint: "段文本里引用 {{变量名}}；引用未注册的名字会让整次渲染报错（宿主严格模式）。",
				importBlockMerge: "，文件中的环境变量黑名单已并入（+{count} 条）",
				resetTitle: "恢复初始状态",
				resetHint: "清空全部定制（屏蔽 / 替换 / 注入 / 排序、阶段工具目录、配置快照、agent 预设覆盖），并关闭 forceSections —— 之后所有 AI 对话不再受本插件影响，与卸载插件等效，无需卸载或重启。此操作不可撤销；要重新启用定制，在上方打开「强制覆盖」开关即可。",
				resetConfirm: "确定清空全部定制并恢复初始状态吗？\n\n将删除：屏蔽名单、段替换、注入段、阶段工具目录、配置快照、agent 预设覆盖；并关闭 forceSections。\n之后所有 AI 对话都不再受本插件影响（与卸载插件等效）。\n此操作不可撤销。",
				resetAction: "清空全部定制",
				resetOk: "已恢复初始状态：所有 AI 对话不再受本插件影响",
				resetFail: "恢复初始状态失败",
				scopeFallback: "该 agent 预设的常驻 scope 未能挂载，以下显示的是全局层内容（并非该预设的原生段与工具）。",
				previewFail: "该阶段装配失败（scope 挂载失败或预设插件异常），请切换目标或查看服务日志。",
				phaseVisible: "阶段可见",
				previewToolsHint: "模型实际可见的工具目录（按所选阶段运行预设的全部装配规则，含原生阶段裁剪）：",
				previewToolsCount: "注册表",
				saveAsPreset: "存为预设",
				navShort: "提示词",
				close: "关闭",
				filterAll: "全部",
				filterOn: "已启用",
				filterOff: "已停用",
				targetAllTab: "全部 Agent",
				poolAddTitle: "加入{phase}",
				settingsTitle: "全局设置",
				libraryTitle: "配置快照库",
				draftBadge: "预览含未保存草稿",
				previewSyncFail: "实时预览同步失败（下次编辑会自动重试，或点「刷新」）"
			},
			en: {
				nav: "Prompt Customizer",
				loading: "Loading…",
				unavailable: "Namespace unavailable in this environment.",
				tabsSections: "Sections",
				tabsTools: "Tools",
				tabsPresets: "Presets",
				tabsPreview: "Preview",
				refresh: "Refresh",
				blockedOff: "Active",
				blockedOn: "Blocked",
				replaced: "Replaced",
				manual: "Manual",
				system: "System",
				replace: "Replace",
				clearReplace: "Clear",
				clearInput: "Clear",
				injectNew: "Inject section",
				name: "Name",
				order: "Order",
				text: "Text",
				add: "Add",
				hiddenOff: "Visible",
				hiddenOn: "Hidden",
				selectAll: "Select all",
				selectNone: "Select none",
				empty: "(empty)",
				dynamic: "<dynamic>",
				drag: "Drag to reorder",
				moveUp: "Move up",
				moveDown: "Move down",
				previewHint: "Final system prompt after block/replace/inject:",
				previewPrompt: "Prompt preview",
				previewSections: "sections",
				previewTools: "Tools preview",
				previewToolCount: "tools",
				savePreset: "Save current config",
				presetName: "Config name",
				saveAsPresetCard: "Save as agent preset",
				saveAsPresetHint: "Copy the whole \"{name}\" preset into a new one (composition plus its companion scripts), then write the current customization into its override — the new preset shows up in the target selector above.",
				agentPresetName: "New preset name",
				forkSourceDefault: "the default preset",
				saveAsPresetOk: "Preset created — pick it in the target selector above",
				saveAsPresetFail: "Failed to save preset",
				save: "Save",
				importPreset: "Import preset",
				import: "Import",
				apply: "Apply",
				export: "Export",
				delete: "Delete",
				restore: "Restore",
				active: "Active",
				preset: "Preset",
				ioFailed: "Import/export failed",
				importInvalid: "Invalid preset file",
				targetGlobal: "Target: global default",
				targetHint: "Pick an edit target — changes apply only to the chosen agent preset (field-level override).",
				syncAllPhases: "Sync phases",
				syncAllPhasesHint: "When checked, blocking / unblocking, text replacement (sections), and drag-in / drag-out (adding / removing tools) apply to the same-named item across all three phases at once; names a phase does not have are left untouched. Unchecked (default): handle each phase separately.",
				broken: "broken",
				brokenPreset: "This agent preset cannot mount right now; its customization is still editable and applies once fixed.",
				phaseBootstrap: "Bootstrap only",
				phaseActive: "After promotion",
				phaseCompaction: "Post-compaction",
				phaseStageGuide: "Guide period",
				phaseStageResident: "Resident period",
				phaseStageControlled: "Compaction-controlled period",
				toolsPartGuide: "Guide-period tools",
				toolsPartResident: "Resident-period tools",
				toolsPartControlled: "Compaction-controlled tools",
				allToolsTitle: "All system tools",
				sectionsPartGuide: "Guide-period sections",
				sectionsPartResident: "Resident-period sections",
				sectionsPartControlled: "Compaction-controlled sections",
				allSectionsTitle: "All system sections",
				toolsFourHint: "Each of the three periods keeps its own list, with no inheritance: the checkbox = visible to the model in that period; dragging a tool from \"All\" into a period makes it appear there (if the period trims it by default, it is added back); dragging between two periods copies it (the source is untouched, the target gains one, and the hidden/enabled state carries over); dragging it back to \"All\" removes it from that period. Every action touches only the tool you dragged.",
				sectionsFourHint: "Drag both ways: drop a section from \"All\" onto a period part to enable it there; drag from a part back to \"All\" to remove it from that period. Blocked sections stay fully operable — they are just not injected.",
				dragHint: "Drag in to make this tool appear in this period",
				phaseShortGuide: "G",
				phaseShortResident: "R",
				phaseShortControlled: "C",
				poolMarksHint: "The three marks after each name = this tool’s state in the guide / resident / compaction-controlled periods: green = visible there (or added back), grey = hidden there, dim = not present and not added.",
				toolAddedTag: "added",
				toolAdded: "Added \"{name}\" back to {phase}: the period trims it by default, so it will reappear there once saved (it exists in this preset’s registry).",
				toolNotInRegistry: "\"{name}\" is not in this preset’s registry (it belongs to another preset). There is no definition for it here, so it cannot be added.",
				toolCopied: "Copied \"{name}\" to {to}: the copy in {from} is left untouched, and its hidden/enabled state carries over.",
				toolShown: "\"{name}\" is now visible in {to}.",
				toolHiddenIn: "\"{name}\" is now hidden in {to}.",
				toolSyncShown: "\"{name}\" is now visible in all three phases (periods without it in their catalog got it added back).",
				toolSyncHidden: "\"{name}\" is now hidden / removed in all three phases.",
				sectionsTakenOver: "The \"{name}\" section declares a complete takeover (the host restores that single section after the assembly waterfall). This plugin’s forceSections (default on) bypasses that mechanism, so section-level blocking / replacement / injection / ordering still applies; this notice only appears when forceSections is off or the override fails — enable it to restore.",
				sectionsLost: "Only {survived} of the {emitted} sections this plugin emitted for this phase reach the final prompt — the rest are dropped by downstream assembly rules, so section-level customization cannot fully apply (tool filtering is unaffected).",
				sectionBlockedStrip: " (blocked in this period; invisible to the model)",
				phaseSuppressed: "Suppressed (absent from every phase assembly)",
				sectionDynamicNoAdd: "\"{name}\" is generated at runtime — it cannot be added to a phase ahead of time (its content is only known during assembly).",
				exportOk: "Exported",
				exportCancel: "Export cancelled",
				exportFail: "Export failed",
				importOk: "Import complete",
				importNone: "Nothing imported (duplicate names or empty file)",
				importCancel: "Import cancelled",
				importFail: "Import failed",
				saveOk: "Saved",
				saveFail: "Save failed",
				discardConfirm: "You have unsaved changes; leaving will discard them. Leave anyway?",
				forceTitle: "Force override (forceSections)",
				forceHint: "When on, every preset’s prompt sections always follow this plugin (bypassing complete takeover and preset phase pruning); when off, filtering falls back to the waterfall, where presets may override your customization. \"Restore initial state\" turns this off automatically.",
				forceOn: "On",
				forceOff: "Off",
				zhSwitch: "Chinese sections",
				zhHint: "Toggle. On: overwrite sections matching the bundled translation with Chinese (written to the edit draft, applies on save). Off: clear those replacements, restoring the English originals. Custom sections and unmatched names are untouched.",
				zhApplied: "Chinese written to the edit draft — press Save to apply; unmatched sections stay as-is.",
				zhReverted: "English originals written back to the edit draft (Chinese replacements cleared) — press Save to apply.",
				zhNotReady: "Phase assemblies are not loaded yet — press Refresh or try again shortly.",
				envBlockTitle: "Environment variable blocklist (envBlocklist)",
				envBlockHint: "All system environment variables (process.env) are registered as prompt variables: reference them in section text as {{env_lowercase_key}} (e.g. {{env_path}}); keys hit by the blocklist are not registered — env often carries secrets, and anything in the prompt is sent to the model. Entries support * wildcards, case-insensitive. Built-ins {{date}} {{time}} {{datetime}} {{weekday}} {{hostname}} {{platform}} {{arch}} {{username}} {{home}} {{shell}} {{locale}} {{node_version}} are always available.",
				envBlockAdd: "Key or wildcard, e.g. GITHUB_TOKEN or *_KEY*",
				envBlockAddAction: "Add",
				envBlockEmpty: "Blocklist is empty: every environment variable gets registered",
				envVarsTitle: "Registered prompt variables",
				envVarsHint: "Reference {{name}} in section text; an unregistered name fails the whole render (host strict mode).",
				importBlockMerge: ", the file’s env-variable blocklist was merged in (+{count} entries)",
				resetTitle: "Restore initial state",
				resetHint: "Clears all customization (blocking / replacement / injection / ordering, per-phase tool catalogs, config snapshots, agent-preset overrides) and turns forceSections off — every AI conversation goes back to being unaffected by this plugin, equivalent to uninstalling it, without uninstalling or restarting. This cannot be undone; to re-enable customization, turn the \"Force override\" switch above back on.",
				resetConfirm: "Clear all customization and restore the initial state?\n\nThis will delete: block lists, section replacements, injected sections, per-phase tool catalogs, config snapshots, and agent-preset overrides; forceSections will be turned off.\nAfterwards no AI conversation is affected by this plugin (equivalent to uninstalling).\nThis cannot be undone.",
				resetAction: "Clear all customization",
				resetOk: "Initial state restored: no AI conversation is affected by this plugin anymore",
				resetFail: "Failed to restore initial state",
				scopeFallback: "This agent preset's standing scope could not be mounted; what you see is the global layer (not the preset's native sections/tools).",
				previewFail: "Assembly for this phase failed (scope mount error or a preset plugin threw); switch target or check the server log.",
				phaseVisible: "visible in phase",
				previewToolsHint: "Tool catalog as the model actually sees it (all assembly rules run for the selected phase, including native phase narrowing):",
				previewToolsCount: "of registry",
				saveAsPreset: "Save as preset",
				navShort: "Prompts",
				close: "Close",
				filterAll: "All",
				filterOn: "Enabled",
				filterOff: "Disabled",
				targetAllTab: "All agents",
				poolAddTitle: "Add to {phase}",
				settingsTitle: "Global settings",
				libraryTitle: "Config snapshots",
				draftBadge: "Preview includes unsaved draft",
				previewSyncFail: "Live preview sync failed (retries on next edit, or press Refresh)"
			}
		};
		//#endregion
		//#region src/client/styles.ts
		/** 提示词定制面板各组件共享的内联样式（颜色走半透明灰，随宿主主题自然适配）。 */
		const s = (() => {
			const flex = {
				display: "flex",
				alignItems: "center"
			};
			return {
				pRoot: {
					height: "100%",
					display: "flex",
					flexDirection: "column",
					fontFamily: "inherit",
					fontSize: 13,
					lineHeight: 1.5,
					minHeight: 0
				},
				head: {
					...flex,
					gap: 10,
					padding: "10px 14px 8px",
					flexWrap: "wrap",
					borderBottom: "1px solid rgba(128,128,128,.18)"
				},
				headTitle: {
					...flex,
					gap: 8,
					fontSize: 15,
					fontWeight: 600,
					whiteSpace: "nowrap"
				},
				seg: {
					...flex,
					gap: 2,
					padding: 2,
					border: "1px solid rgba(128,128,128,.28)",
					borderRadius: 8
				},
				segBtn: {
					padding: "3px 12px",
					border: "none",
					borderRadius: 6,
					background: "transparent",
					cursor: "pointer",
					color: "inherit",
					opacity: .72,
					fontSize: 13,
					whiteSpace: "nowrap"
				},
				segBtnActive: {
					padding: "3px 12px",
					border: "none",
					borderRadius: 6,
					background: "rgba(88,166,255,.22)",
					cursor: "pointer",
					color: "inherit",
					fontWeight: 600,
					fontSize: 13,
					whiteSpace: "nowrap"
				},
				grow: {
					flex: 1,
					minWidth: 0
				},
				headActions: {
					...flex,
					gap: 6,
					marginLeft: "auto"
				},
				iconBtn: {
					display: "inline-flex",
					alignItems: "center",
					justifyContent: "center",
					width: 28,
					height: 28,
					border: "none",
					borderRadius: 8,
					background: "transparent",
					cursor: "pointer",
					color: "inherit",
					opacity: .75
				},
				subhead: {
					...flex,
					gap: 8,
					padding: "8px 14px",
					flexWrap: "wrap",
					borderBottom: "1px solid rgba(128,128,128,.14)"
				},
				targetRow: {
					...flex,
					gap: 4,
					overflowX: "auto",
					maxWidth: "100%",
					scrollbarWidth: "thin"
				},
				targetTab: {
					...flex,
					gap: 6,
					padding: "4px 12px",
					border: "1px solid rgba(128,128,128,.28)",
					borderRadius: 999,
					background: "transparent",
					cursor: "pointer",
					color: "inherit",
					opacity: .78,
					fontSize: 12,
					whiteSpace: "nowrap"
				},
				targetTabActive: {
					...flex,
					gap: 6,
					padding: "4px 12px",
					border: "1px solid rgba(88,166,255,.65)",
					borderRadius: 999,
					background: "rgba(88,166,255,.18)",
					cursor: "pointer",
					color: "inherit",
					fontWeight: 600,
					fontSize: 12,
					whiteSpace: "nowrap"
				},
				body: {
					flex: 1,
					minHeight: 0,
					display: "flex",
					alignItems: "stretch"
				},
				colLeft: {
					width: 420,
					flex: "none",
					display: "flex",
					flexDirection: "column",
					minHeight: 0,
					borderRight: "1px solid rgba(128,128,128,.18)",
					boxSizing: "border-box"
				},
				colScroll: {
					flex: 1,
					minHeight: 0,
					overflowY: "auto",
					padding: "10px 12px"
				},
				colFoot: {
					flex: "none",
					...flex,
					gap: 8,
					padding: "8px 12px",
					borderTop: "1px solid rgba(128,128,128,.18)",
					flexWrap: "wrap"
				},
				colRight: {
					flex: 1,
					minWidth: 0,
					display: "flex",
					flexDirection: "column",
					minHeight: 0
				},
				colRightScroll: {
					flex: 1,
					minHeight: 0,
					overflowY: "auto",
					padding: "10px 14px"
				},
				groupHead: {
					...flex,
					gap: 8,
					marginBottom: 6,
					color: "rgba(128,128,128,.95)",
					fontSize: 12,
					fontWeight: 600
				},
				list: {
					display: "flex",
					flexDirection: "column",
					gap: 6
				},
				row: {
					...flex,
					gap: 8,
					padding: "6px 8px",
					border: "1px solid rgba(128,128,128,.2)",
					borderRadius: 8,
					background: "rgba(128,128,128,.06)"
				},
				switchWrap: {
					...flex,
					gap: 6,
					minWidth: 90
				},
				rowBody: {
					flex: 1,
					minWidth: 0
				},
				rowTitle: {
					...flex,
					gap: 6,
					alignItems: "baseline",
					flexWrap: "wrap"
				},
				code: {
					fontFamily: "monospace",
					fontSize: 12,
					wordBreak: "break-all"
				},
				orderTag: {
					color: "rgba(128,128,128,.8)",
					fontSize: 11
				},
				preview: {
					color: "rgba(128,128,128,.85)",
					fontSize: 12,
					overflow: "hidden",
					textOverflow: "ellipsis",
					whiteSpace: "nowrap"
				},
				previewText: {
					fontFamily: "monospace",
					fontSize: 12,
					lineHeight: 1.6,
					whiteSpace: "pre-wrap",
					wordBreak: "break-word",
					flex: 1,
					minHeight: 0,
					overflowY: "auto",
					padding: 10,
					border: "1px solid rgba(128,128,128,.2)",
					borderRadius: 8,
					background: "rgba(0,0,0,.18)",
					margin: 0
				},
				toolWrap: {
					display: "flex",
					flexWrap: "wrap",
					gap: 6
				},
				toolChip: {
					fontFamily: "monospace",
					fontSize: 12,
					color: "rgba(128,128,128,.95)",
					border: "1px solid rgba(128,128,128,.3)",
					borderRadius: 6,
					padding: "2px 6px",
					cursor: "help"
				},
				badgeOk: {
					color: "#3fb950",
					fontSize: 11,
					border: "1px solid rgba(63,185,80,.5)",
					borderRadius: 999,
					padding: "0 6px"
				},
				badgeBlocked: {
					color: "#f85149",
					fontSize: 11,
					border: "1px solid rgba(248,81,73,.5)",
					borderRadius: 999,
					padding: "0 6px"
				},
				badgeReplaced: {
					color: "#d29922",
					fontSize: 11,
					border: "1px solid rgba(210,153,34,.5)",
					borderRadius: 999,
					padding: "0 6px"
				},
				badgeCustom: {
					color: "#58a6ff",
					fontSize: 11,
					border: "1px solid rgba(88,166,255,.5)",
					borderRadius: 999,
					padding: "0 6px"
				},
				badgeSystem: {
					color: "rgba(128,128,128,.85)",
					fontSize: 11,
					border: "1px solid rgba(128,128,128,.4)",
					borderRadius: 999,
					padding: "0 6px"
				},
				mini: {
					padding: "3px 8px",
					border: "1px solid rgba(128,128,128,.35)",
					borderRadius: 6,
					background: "transparent",
					cursor: "pointer",
					color: "inherit",
					whiteSpace: "nowrap"
				},
				arrowCol: {
					display: "flex",
					flexDirection: "column",
					gap: 2
				},
				arrow: {
					padding: "0 6px",
					border: "1px solid rgba(128,128,128,.3)",
					borderRadius: 4,
					background: "transparent",
					cursor: "pointer",
					color: "inherit",
					fontSize: 11,
					lineHeight: 1.4,
					opacity: .8
				},
				rowBlocked: { opacity: .55 },
				injectBox: {
					marginTop: 10,
					padding: "8px",
					border: "1px dashed rgba(128,128,128,.4)",
					borderRadius: 8,
					display: "flex",
					flexDirection: "column",
					gap: 6
				},
				injectRow: {
					...flex,
					gap: 6
				},
				editBox: {
					display: "flex",
					flexDirection: "column",
					gap: 6,
					marginTop: 4
				},
				editInput: {
					padding: "6px",
					border: "1px solid rgba(128,128,128,.35)",
					borderRadius: 6,
					background: "transparent",
					color: "inherit",
					fontFamily: "inherit",
					fontSize: 12,
					resize: "vertical",
					width: "100%",
					boxSizing: "border-box"
				},
				input: {
					padding: "4px 6px",
					border: "1px solid rgba(128,128,128,.35)",
					borderRadius: 6,
					background: "transparent",
					color: "inherit"
				},
				muted: {
					color: "rgba(128,128,128,.75)",
					fontSize: 12
				},
				error: {
					color: "#f85149",
					fontSize: 12,
					marginBottom: 6
				},
				noticeOk: {
					color: "#3fb950",
					fontSize: 12,
					marginBottom: 6
				},
				noticeWarn: {
					color: "#d29922",
					fontSize: 12,
					marginBottom: 6
				},
				saveBtn: {
					padding: "4px 12px",
					border: "1px solid rgba(128,128,128,.35)",
					borderRadius: 6,
					background: "transparent",
					cursor: "pointer",
					color: "inherit"
				},
				saveBtnDirty: {
					padding: "4px 12px",
					border: "1px solid #d29922",
					borderRadius: 6,
					background: "rgba(210,153,34,.15)",
					cursor: "pointer",
					color: "inherit"
				}
			};
		})();
		//#endregion
		//#region src/client/presets.ts
		/** 快照捕获的阶段 order 空间（always 之外的三个阶段）。 */
		const CAPTURE_PHASES = [
			"bootstrap",
			"active",
			"compaction"
		];
		/** 把一条有序名字转成相对链（每段记住它的前一段），text / custom 只给 custom 段。 */
		function toChain(names, textOf, customOf, phase) {
			return names.map((name, i) => ({
				name,
				after: i > 0 ? names[i - 1] : void 0,
				text: customOf(name) ? textOf(name) ?? "" : "",
				custom: customOf(name),
				...phase !== void 0 ? { phase } : {}
			}));
		}
		/**
		* 从当前配置构建预设快照（完整捕获，含每阶段独立设定）。
		*
		* 全局相对链派生自合并后的完整段列表（而不仅是 `cfg.inject`），这样即使保存前
		* 只是屏蔽了几个段（没有重排），预设仍会携带完整的有序集合，应用时才能得到一个
		* 有意义的「激活列表」。在此之上，bootstrap / active / compaction 各再带一条自己
		* 的相对链 —— 数据源就是 UI 逐阶段持久化的注入条目（每阶段独立的 order 空间），
		* 否则阶段化的名单与排序在「导出 → 导入 → 应用」后就丢了。
		*/
		function buildPresetData(cfg, merged) {
			const globalNames = merged.map((sec) => sec.name);
			const textOf = new Map(merged.map((sec) => [sec.name, sec.text ?? ""]));
			const customOf = new Map(merged.map((sec) => [sec.name, sec.source === "custom"]));
			const order = toChain(globalNames, (n) => textOf.get(n) ?? "", (n) => customOf.get(n) === true);
			for (const phase of CAPTURE_PHASES) {
				const items = (cfg.inject ?? []).filter((item) => item.phase === phase).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
				if (items.length === 0) continue;
				order.push(...toChain(items.map((item) => item.name), (n) => items.find((item) => item.name === n)?.text ?? "", (n) => items.find((item) => item.name === n)?.custom === true, phase));
			}
			const data = {
				sections: cfg.sections,
				replace: cfg.replace,
				order,
				tools: cfg.tools
			};
			if ((cfg.sectionsBootstrap ?? []).length > 0) data.sectionsBootstrap = cfg.sectionsBootstrap;
			if ((cfg.sectionsCompaction ?? []).length > 0) data.sectionsCompaction = cfg.sectionsCompaction;
			return data;
		}
		/**
		* 把宿主清单段与用户注入列表按 order 合并、排序。
		* 读自清单（其他插件产出）的段标记为 `system`；本插件生成的段带隐藏的
		* `custom` 标记，标记为 `custom`。来源只由隐藏标记决定——绝不靠名字碰撞
		* 判断——因此即使自定义段恰好与某个清单段重名，它也能保住自己的身份
		* （以及可删除性），并在切换预设后依然成立。自定义段始终渲染自己的文本，
		* 永远不会显示为「<动态生成>」。
		*/
		function mergeSections(inv, cfg, blockedNames) {
			const map = /* @__PURE__ */ new Map();
			for (const sec of inv?.sections ?? []) map.set(sec.name, {
				...sec,
				source: "system"
			});
			for (const item of cfg.inject ?? []) {
				const isCustom = item.custom === true;
				const existing = map.get(item.name);
				if (existing) map.set(item.name, isCustom ? {
					...existing,
					order: item.order,
					text: item.text ?? "",
					source: "custom"
				} : {
					...existing,
					order: item.order,
					source: "system"
				});
				else map.set(item.name, {
					name: item.name,
					order: item.order,
					text: item.text ?? "",
					active: !blockedNames.has(item.name),
					replaced: false,
					source: isCustom ? "custom" : "system"
				});
			}
			return [...map.values()].sort((a, b) => a.order - b.order).map((sec, i) => ({
				...sec,
				order: i
			}));
		}
		/**
		* 把一条相对链解析为绝对有序名字（0..n-1）。
		* 没有锚点（或锚点不在本组内）的名字按原始顺序排在最前；每个带锚点的名字
		* 插到其锚点之后；剩余的名字（存在环）追加到末尾。
		*/
		function resolveChain(list) {
			const afterMap = /* @__PURE__ */ new Map();
			for (const sec of list) afterMap.set(sec.name, sec.after);
			const result = [];
			const placed = /* @__PURE__ */ new Set();
			for (const sec of list) {
				const anchor = afterMap.get(sec.name);
				if (!anchor || !afterMap.has(anchor)) {
					result.push(sec.name);
					placed.add(sec.name);
				}
			}
			let changed = true;
			while (changed) {
				changed = false;
				for (const sec of list) {
					if (placed.has(sec.name)) continue;
					const anchor = afterMap.get(sec.name);
					if (anchor && placed.has(anchor)) {
						result.splice(result.indexOf(anchor) + 1, 0, sec.name);
						placed.add(sec.name);
						changed = true;
					}
				}
			}
			for (const sec of list) if (!placed.has(sec.name)) {
				result.push(sec.name);
				placed.add(sec.name);
			}
			return result;
		}
		/**
		* 把快照里的相对顺序解析为注入条目列表。
		*
		* order 条目可以带 `phase`：同名而不同 phase 的多条 = 该段在多个阶段各有自己的
		* 位置（每阶段有独立的 order 空间，与 UI 的 phaseInjectEntries 一致）。无 phase
		* 的条目属于 always 组 —— 也就是旧快照的单一全局序，输出形状与旧实现逐键一致
		* （刻意不写 phase 键，「保存 → 应用 = 不动点」的不变量依赖键形状完全相同）。
		*/
		function resolveOrder(presetOrder) {
			const list = presetOrder ?? [];
			const groups = /* @__PURE__ */ new Map([["always", []]]);
			for (const sec of list) {
				const phase = sec.phase ?? "always";
				const group = groups.get(phase);
				if (group) group.push(sec);
				else groups.set(phase, [sec]);
			}
			const out = [];
			for (const [phase, members] of groups) {
				const textMap = new Map(members.map((x) => [x.name, x.text ?? ""]));
				const customMap = new Map(members.map((x) => [x.name, x.custom === true]));
				const names = resolveChain(members);
				out.push(...names.map((name, i) => phase === "always" ? {
					name,
					order: i,
					text: textMap.get(name) ?? "",
					custom: customMap.get(name)
				} : {
					name,
					order: i,
					text: textMap.get(name) ?? "",
					custom: customMap.get(name),
					phase
				}));
			}
			return out;
		}
		/**
		* 计算应用预设时的配置补丁：
		*  - 同名段被覆盖（顺序列表在运行时驱动这一行为）
		*  - 预设中有、当前系统里匹配不上的段默认跳过（跨系统导入不凭空建段）
		*  - 当前有、但不在预设有序列表中的段默认被屏蔽
		*  - 只有预设的「激活段」（在 order 列表且不在其屏蔽名单中）被解除屏蔽；
		*    预设自己屏蔽的段保持屏蔽。
		*
		* 当前配置里存在、但不在预设有序列表中的自定义注入段会被保留到结果的
		* inject 列表中（因此仍然可见）并置为禁用（加入屏蔽集合），而不是被静默
		* 丢弃——预设不能让用户自己注入的凭空消失。
		*/
		function applyPresetData(data, cfg, currentNames) {
			const presetOrder = data.order ?? [];
			const presetNames = new Set(presetOrder.map((x) => x.name));
			const blocked = new Set((data.sections ?? []).filter((n) => currentNames.has(n)));
			const inject = resolveOrder(presetOrder.filter((x) => currentNames.has(x.name)));
			const kept = new Set(inject.map((x) => x.name));
			let order = inject.length;
			for (const item of cfg.inject ?? []) {
				if (!item || !item.name || presetNames.has(item.name) || kept.has(item.name)) continue;
				kept.add(item.name);
				inject.push({
					name: item.name,
					order: order++,
					text: item.text ?? "",
					custom: item.custom === true
				});
			}
			if (presetOrder.length > 0) {
				const activeNames = new Set([...presetNames].filter((n) => !blocked.has(n)));
				for (const name of currentNames) if (!presetNames.has(name)) blocked.add(name);
				for (const name of activeNames) blocked.delete(name);
			}
			const keptCatalogs = {};
			const bootstrap = data.tools?.bootstrap !== void 0 ? data.tools.bootstrap : cfg.tools?.bootstrap;
			const compaction = data.tools?.compaction !== void 0 ? data.tools.compaction : cfg.tools?.compaction;
			if (bootstrap !== void 0) keptCatalogs.bootstrap = bootstrap;
			if (compaction !== void 0) keptCatalogs.compaction = compaction;
			const patch = {
				sections: [...blocked],
				replace: {
					...cfg.replace ?? {},
					...data.replace ?? {}
				},
				inject,
				tools: {
					exclude: data.tools?.exclude ?? [],
					...keptCatalogs
				}
			};
			if (Array.isArray(data.sectionsBootstrap)) patch.sectionsBootstrap = data.sectionsBootstrap;
			if (Array.isArray(data.sectionsCompaction)) patch.sectionsCompaction = data.sectionsCompaction;
			return patch;
		}
		/** 三个阶段部分的固定展示顺序：引导期 → 常驻期 → 压缩受控期。
		*  恒定全部渲染 —— 预设没有某个阶段时该部分只是空的，绝不隐藏。 */
		const PART_ORDER = [
			"bootstrap",
			"active",
			"compaction"
		];
		/**
		* 一个阶段部分写回哪一份过滤配置：引导期 → `tools.bootstrap`、压缩受控期 →
		* `tools.compaction`、常驻期 → 静态 `tools.exclude`。三份名单互不继承。
		*/
		function phaseConfigKey(key) {
			return key === "active" ? "static" : key;
		}
		/**
		* 把一个阶段的 exclude 名单写回整份工具配置，返回新对象（其余阶段原样保留）。
		* 一次拖放可能要同时改两个阶段的名单（搬移 = 源阶段隐藏 + 目标阶段显示），必须
		* 在同一个对象上连续套完再落一次写入 —— 分两次写会各自基于旧 cfg 计算而互相覆盖。
		*/
		function withPhaseExclude(tools, key, exclude) {
			const base = tools ?? {};
			const target = phaseConfigKey(key);
			if (target === "bootstrap") return {
				...base,
				bootstrap: {
					...base.bootstrap ?? {},
					exclude
				}
			};
			if (target === "compaction") return {
				...base,
				compaction: {
					...base.compaction ?? {},
					exclude
				}
			};
			return {
				...base,
				exclude
			};
		}
		/**
		* 把一个阶段的 add 名单（要加回该阶段的工具）写回整份工具配置，返回新对象。
		* 与 withPhaseExclude 对称：常驻期写静态 `tools.add`，引导期写 `tools.bootstrap.add`，
		* 压缩受控期写 `tools.compaction.add`，其余阶段原样保留。
		*/
		function withPhaseAdd(tools, key, add) {
			const base = tools ?? {};
			const target = phaseConfigKey(key);
			if (target === "bootstrap") return {
				...base,
				bootstrap: {
					...base.bootstrap ?? {},
					add
				}
			};
			if (target === "compaction") return {
				...base,
				compaction: {
					...base.compaction ?? {},
					add
				}
			};
			return {
				...base,
				add
			};
		}
		/**
		* 编辑目标的「显示视图」：全局目标返回原配置；agent 预设目标把该预设
		* override 的字段叠在全局值之上展示（空缺字段显示全局继承值）。`presets`
		* 与 `activePreset` 永远来自全局 —— 预设快照库本身不分作用域。
		*/
		function editView(cfg, target) {
			if (!target) return cfg;
			const ovr = cfg.overrides?.[target] ?? {};
			return {
				sections: ovr.sections ?? cfg.sections,
				sectionsBootstrap: ovr.sectionsBootstrap ?? cfg.sectionsBootstrap,
				sectionsCompaction: ovr.sectionsCompaction ?? cfg.sectionsCompaction,
				replace: ovr.replace ?? cfg.replace,
				inject: ovr.inject ?? cfg.inject,
				tools: {
					exclude: ovr.tools?.exclude ?? cfg.tools?.exclude,
					add: ovr.tools?.add ?? cfg.tools?.add,
					bootstrap: ovr.tools?.bootstrap ?? cfg.tools?.bootstrap,
					compaction: ovr.tools?.compaction ?? cfg.tools?.compaction
				},
				presets: cfg.presets,
				activePreset: cfg.activePreset
			};
		}
		/**
		* Derive a safe default filename for a preset export. User-entered preset
		* names may contain characters that are illegal in filenames (`/\:*?"<>|`,
		* control chars) — those are replaced; a trailing dot/space is trimmed
		* (invalid on Windows); an empty or all-illegal result falls back to
		* `preset`.
		*/
		function presetExportFilename(name) {
			const sanitized = String(name).replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").trim().replace(/[. ]+$/, "");
			return `${sanitized === "" ? "preset" : sanitized}.json`;
		}
		/**
		* 导入预设：同名的会被跳过，只追加名字不同的预设。返回新的预设列表
		* （若没有任何变更则返回原列表）。
		*/
		function addImportedPresets(existing, parsed, makeId) {
			const incoming = Array.isArray(parsed) ? parsed : [parsed];
			const existingNames = new Set(existing.map((p) => p.name));
			const added = incoming.filter((p) => p && typeof p.name === "string" && !existingNames.has(p.name)).map((p) => ({
				id: makeId(),
				name: p.name,
				data: p.data ?? {}
			}));
			return added.length > 0 ? [...existing, ...added] : existing;
		}
		/** 删除某个预设；若它正是当前激活的预设，则同时清除 activeId。 */
		function removePreset(presets, id, activeId) {
			return {
				presets: presets.filter((p) => p.id !== id),
				activeId: activeId === id ? void 0 : activeId
			};
		}
		/** 生成预设 id：时间戳 + 随机段（base36），够用且无需额外依赖。 */
		function genId() {
			return "p_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
		}
		//#endregion
		//#region lib/sectionOps.mjs
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
		function sectionListOf(key) {
			return key === "bootstrap" ? "bootstrap" : key === "compaction" ? "compaction" : "global";
		}
		/** 名义阶段键 → 注入阶段：压缩受控期是独立注入阶段（compaction）。 */
		function injectPhaseOf(key) {
			return key === "bootstrap" ? "bootstrap" : key === "active" ? "active" : "compaction";
		}
		/** 某注入段出现在哪些阶段部分：always 全阶段；bootstrap/compaction/active
		*  仅各自对应的阶段（与服务端 filterInjectByPhase 的三态互相独立一致）。 */
		function acceptsInjectFor(key, phase) {
			if (phase === "always") return true;
			return phase === key;
		}
		/** 该阶段自己的屏蔽名单（三态互相独立：引导期 sectionsBootstrap /
		*  压缩受控期 sectionsCompaction / 常驻期 sections，互不继承、互不影响）。 */
		function deniedNames(cfg, key) {
			const list = sectionListOf(key);
			return list === "bootstrap" ? cfg.sectionsBootstrap ?? [] : list === "compaction" ? cfg.sectionsCompaction ?? [] : cfg.sections ?? [];
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
		function injectedAt(cfg, key) {
			const phase = injectPhaseOf(key);
			const names = /* @__PURE__ */ new Set();
			const custom = /* @__PURE__ */ new Set();
			const text = /* @__PURE__ */ new Map();
			const order = /* @__PURE__ */ new Map();
			for (const item of cfg.inject ?? []) {
				if (item === null || typeof item !== "object" || typeof item.name !== "string") continue;
				const itemPhase = item.phase ?? "always";
				if (itemPhase === phase) order.set(item.name, item.order ?? 0);
				if (!acceptsInjectFor(key, itemPhase)) continue;
				names.add(item.name);
				if (item.text && !text.has(item.name)) text.set(item.name, item.text);
				if (item.custom === true) custom.add(item.name);
			}
			return {
				phase,
				names,
				custom,
				text,
				order
			};
		}
		/**
		* 屏蔽/恢复一个段（当前阶段语义）：返回需要写盘的字段补丁。
		* 三态名单互相独立：只读写本阶段自己的名单（引导期 → sectionsBootstrap，
		* 压缩受控期 → sectionsCompaction，常驻期 → sections），屏蔽 / 恢复都绝不
		* 波及其它阶段的名单 —— 一个阶段的屏蔽不再连带屏蔽另一个阶段。
		* 名单无变化时不产出字段（空补丁 = 不写盘），避免把继承值冻结成无意义的
		* 空数组覆盖。
		*/
		function blockPatch(cfg, key, name, blocked) {
			const list = sectionListOf(key);
			const field = list === "bootstrap" ? "sectionsBootstrap" : list === "compaction" ? "sectionsCompaction" : "sections";
			const cur = (cfg[field] ?? []).slice();
			const i = cur.indexOf(name);
			if (blocked) {
				if (i >= 0) return {};
				cur.push(name);
			} else {
				if (i < 0) return {};
				cur.splice(i, 1);
			}
			return { [field]: cur };
		}
		/**
		* 持久化一个阶段的有序列表（v1 persistOrder 的逐阶段版）：把 rows（有序行）
		* 写成该阶段的注入条目，order = 连续整数（0,1,2,…）——「虚拟 order 决定注入
		* 顺序」；文本优先级 = 本阶段的用户替换文本（row.override）→ 自定义段自带的
		* 文本（row.text）→ 空文本（= 仅 order 覆盖，服务端保留原文）。三者缺一不可：
		* 重排走的就是这个函数，漏掉 override 会让一次拖动把用户在该阶段改的文本抹平。
		* 其它阶段（含 always）的注入条目原样保留。
		*/
		function phaseInjectEntries(cfg, key, rows) {
			const phase = injectPhaseOf(key);
			const others = (cfg.inject ?? []).filter((item) => (item.phase ?? "always") !== phase);
			const entries = rows.map((row, i) => ({
				name: row.name,
				order: i,
				text: row.override || (row.custom ? row.text ?? "" : ""),
				phase,
				custom: row.custom
			}));
			return [...others, ...entries];
		}
		/**
		* 三态同步持久化：rowsByKey 给出三个阶段各自的有序行集合（bootstrap /
		* active / compaction），生成完整 inject 列表 —— always 条目原样保留，三个
		* 阶段各自写成连续虚拟 order 的注入条目（条目形状与 phaseInjectEntries 完全
		* 一致）。用于「三态同步」的一次写入：edit 对 inject 是整体替换，逐阶段各写
		* 一次会互相覆盖只留下最后一次。
		*/
		function mergedPhaseInjectEntries(cfg, rowsByKey) {
			const always = (cfg.inject ?? []).filter((item) => (item.phase ?? "always") === "always");
			const entries = [
				"bootstrap",
				"active",
				"compaction"
			].flatMap((key) => {
				const phase = injectPhaseOf(key);
				return (rowsByKey[key] ?? []).map((row, i) => ({
					name: row.name,
					order: i,
					text: row.override || (row.custom ? row.text ?? "" : ""),
					phase,
					custom: row.custom
				}));
			});
			return [...always, ...entries];
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
		function phaseRows(cfg, view, key) {
			const replace = cfg.replace ?? {};
			const denied = new Set(deniedNames(cfg, key));
			const postByName = new Map((view?.sections ?? []).map((sec) => [sec.name, sec]));
			const baseByName = new Map((view?.baseSections ?? []).map((sec) => [sec.name, sec]));
			const { phase, names: injectedHere, custom: customNames, text, order: phaseOrder } = injectedAt(cfg, key);
			const names = [];
			const seen = /* @__PURE__ */ new Set();
			const push = (name) => {
				if (!seen.has(name)) {
					seen.add(name);
					names.push(name);
				}
			};
			for (const sec of view?.baseSections ?? []) if (postByName.has(sec.name) || denied.has(sec.name) || sec.blocked === true) push(sec.name);
			for (const name of postByName.keys()) if (baseByName.has(name) || injectedHere.has(name)) push(name);
			for (const item of cfg.inject ?? []) {
				if (item === null || typeof item !== "object" || typeof item.name !== "string") continue;
				if ((item.phase ?? "always") !== phase) continue;
				if (item.custom === true || text.get(item.name) || baseByName.has(item.name) || postByName.has(item.name)) push(item.name);
			}
			for (const name of customNames) push(name);
			const rows = names.map((name) => {
				const override = text.get(name) ?? "";
				return {
					name,
					text: postByName.get(name)?.text ?? baseByName.get(name)?.text ?? "",
					replaced: override !== "" || Object.hasOwn(replace, name),
					custom: customNames.has(name),
					override,
					blocked: denied.has(name)
				};
			});
			if (phaseOrder.size > 0) {
				const fallback = new Map(rows.map((row, i) => [row.name, i]));
				rows.sort((a, b) => (phaseOrder.get(a.name) ?? fallback.get(a.name) ?? 0) - (phaseOrder.get(b.name) ?? fallback.get(b.name) ?? 0));
			}
			return rows;
		}
		/**
		* 「应用中文」（开关开启方向，等效手动编辑）：把三个阶段各自的行里名字命中
		* zhMap 的**非自定义**行打上中文文本补丁，再经 mergedPhaseInjectEntries 生成
		* 完整 inject 列表（调用方写入编辑草稿，保存后生效）。zhMap 条目为字符串
		*（整段替换）或函数（入参该行原文，返回空值 = 放弃替换，如 tools:sdk 的围栏
		* 守卫）；未命中的行与阶段原样保留，段数与注入不增不减。自定义段是用户自撰
		* 内容，绝不覆盖。`views` = 三阶段预览装配（键可为 null —— 该阶段行集视为空）。
		*/
		function zhMergedInjectEntries(cfg, views, zhMap) {
			const patched = {};
			for (const key of [
				"bootstrap",
				"active",
				"compaction"
			]) patched[key] = phaseRows(cfg, views?.[key] ?? null, key).map((row) => {
				if (row.custom) return row;
				const entry = zhMap?.[row.name];
				if (entry === void 0) return row;
				const zh = typeof entry === "function" ? entry(row.text) : entry;
				return zh ? {
					...row,
					override: zh,
					text: zh
				} : row;
			});
			return mergedPhaseInjectEntries(cfg, patched);
		}
		/**
		* 「回归英文」（开关关闭方向）：把三个阶段行里命中译本的非自定义行的替换
		* 文本清空 —— 系统段的注入条目回落为仅 order 覆盖，服务端恢复注册表英文
		* 原文。与 zhMergedInjectEntries 严格对称：开关独占这些段的文本所有权，
		* 关闭即整体回英文（用户在开启期间的手工微调一并清除）。自定义段不碰。
		*/
		function zhRevertInjectEntries(cfg, views, zhMap) {
			const patched = {};
			for (const key of [
				"bootstrap",
				"active",
				"compaction"
			]) patched[key] = phaseRows(cfg, views?.[key] ?? null, key).map((row) => {
				if (row.custom || row.override === "" || zhMap?.[row.name] === void 0) return row;
				return {
					...row,
					override: "",
					text: ""
				};
			});
			return mergedPhaseInjectEntries(cfg, patched);
		}
		/**
		* 开关状态探测：任一注入条目的文本与**字符串译本**逐字相等即视为已应用。
		* 只探测字符串译本（函数译本无法从译文反推），而应用时所有命中行都会写入、
		* 字符串译本必然存在 —— 足以作为探针。混合状态（用户手动还原了个别段）仍算
		* 开启，关闭方向会整体回归英文。
		*/
		function zhApplied(cfg, zhMap) {
			for (const item of cfg?.inject ?? []) {
				if (item === null || typeof item !== "object" || typeof item.name !== "string") continue;
				const zh = zhMap?.[item.name];
				if (typeof zh === "string" && zh !== "" && item.text === zh) return true;
			}
			return false;
		}
		//#endregion
		//#region lib/zh/core.mjs
		/**
		* 中文段译本（专属定制）—— 小段集合。
		* 规则：`{{...}}` 提示词变量、工具名、参数名、路径、URL、代码一律原样保留，
		* 只译散文。plan:policy 是动态段（清单里拿不到稳定文本），不设译本条目，
		* 按「名字对不上就跳过」规则自然豁免。
		*/
		const CORE = {
			"harness:identity": `你是一个由 DeepSeek Harness 驱动的 AI 智能体。`,
			"harness:source": `DeepSeek Harness 的实现代码检出位于 C:\\nvm\\v22.22.0\\node_modules\\@deepseek-ai\\dsh\\。检出位置与当前工作目录是两个独立的值，可能不同；绝不要根据该路径推断工作目录。请用 pwd 确定当前工作目录。该检出只用于查看或扩展 DSH 本身。`,
			"app:web-surface": `你正在通过 DeepSeek Harness 的 Web 图形界面（http://127.0.0.1:3080）与用户交互。当用户提到「这个页面」「这个 GUI」「这个应用」而没有指名其他目标时，指的就是这个 GUI。浏览器不提供任何隐式的 DOM、路由或截图上下文。客户端插件的 HMR 接收器处于激活状态，但只有当 \`pnpm run dev:web\` 也在同一检出里运行以重建其包时，客户端插件的改动才能免刷新重载；在承诺自动更新之前，先确认该监视进程在运行。其他任何改动 —— apps/web 外壳与普通包 —— 都需要重新构建受影响的 Web 产物，并在页面刷新后用这个既有 URL 验证。另起一个服务器不会更新这个 GUI。apps/web 的 Vite 入口只构建外壳，不是独立应用，因为只有 dsh web 会注入 window.__DSH_BOOT__。除非用户要求，不要启动替代服务器；确有必要时，用受管后台作业运行，并核实其确切 URL。`,
			"deployment:persona": `你是一个由 {{model}} 模型驱动的编码智能体。你的工作目录是 {{cwd}}。`,
			"tool:read": `使用 read 工具（而不是 cat 之类的 shell 命令）查看文本文件。结果带有行号；对大文件可用 offset 与 limit 继续读取。`,
			"tool:write": `使用 write 工具新建文件或整体替换文件内容。已有文件会被覆盖，因此先 read 现有文件（默认的 fs-observation-policy 有此要求），并优先用 edit 做针对性修改。`,
			"tool:edit": `使用 edit 工具对现有的 UTF-8 文本文件做针对性修改。它把字面量 old_string 替换为 new_string；默认要求 old_string 恰好出现一次。若 old_string 出现多次，请提供更具体的 old_string，或将 replace_all 设为 true。先 read 文件（默认的 fs-observation-policy 有此要求），除非你在本会话中刚创建或刚编辑过它。`,
			"tool:glob": `使用 glob 工具（而不是 shell 的 find）按路径模式发现文件。不含 "/" 的模式在任意深度匹配基本名，因此 "*" 匹配的是整棵树里的每个文件，而不只是顶层。结果只含文件、绝不含目录，且包含隐藏与被忽略的文件：完全符合的结果按修改时间顺序返回；结果超量时，保留按修改时间排序的前缀。`,
			"tool:grep": `使用 grep 工具（而不是 shell 的 grep 或 rg）搜索文件内容。需要上下文时，用 read 读取匹配到的文件。`,
			"tool:pwsh": `非零退出码会以 \`[exit code: N]\` 标记呈现；继续之前先排查失败。在 Windows 上，被杀掉的进程以 \`[exit code: 1]\` 收尾且没有信号标记；把中断之后的裸退出码 1 视为进程被终止，而不是命令失败。`,
			"tool:jobs": `跟踪你启动的每一个后台作业 id。作业完成时你会在会话内收到通知 —— 不要忙轮询或空等某个作业；继续做独立的步骤，不要重复正在运行的作业的工作。给出最终答复之前，用 job_output 收集每一个仍然相关的作业（只在确实被它阻塞时才设 wait: true），并用 job_kill 终止已经不再要紧的作业。`,
			"tool:web_search": `使用 web_search 工具在网络上发现最新信息。必填的 queries 数组接受 1–4 条非空搜索查询；单次搜索用只含一项的数组。它返回一个可选的 answer 和一份来源 URL 列表。有来源摘要时尽量使用，并以 Markdown 链接的形式引用相关 URL。`,
			"tool:web_fetch": `使用 web_fetch 工具获取特定 HTTP(S) URL 的内容（例如来自 web_search 的某条结果）。它返回解码为文本的页面内容。使用其内容时，以 Markdown 链接的形式引用该 URL。`,
			"tool:goal": `goal 工具用于当前会话中的一个长期运行的完成目标。create_goal 可以从任何语言的直接人类请求中推断目标意图；常规的单轮工作不要创建目标。调用 update_goal 之前先调用 get_goal，并逐字复制它的 goal_id 与 revision。会话恢复或 fork 之后，活跃目标会被解除武装：当人类以任何措辞、任何语言要求继续或恢复时，用 update_goal 的 resume 动作重新武装它。只有目标真正达成才标记 complete。同一个阻塞条件至少连续 3 个目标轮次仍未解除，才可标记 blocked，并在 blocked_reason 里写明那个具体条件；困难、不确定或还有剩余工作都不算阻塞。`,
			"tool:workflow": `只有当用户明确要求 workflow 或大规模多智能体编排时，才使用 workflow 工具：你编写一个 JavaScript 脚本（工具描述里写明确切格式），把工作扇出到大量子智能体，带阶段与结构化结果。只有一两次委派时，优先用普通的 subagent 调用。`,
			"tool:ralph": `只有当直接人类明确要求 Ralph 循环或全新智能体迭代执行时，才使用 ralph 工具。每一轮 Ralph 都启动一个不带对话种子的全新子智能体，并把共享工作区当作持久记忆。完成与阻塞只是 worker 的报告，不是独立评估。普通的长目标用同会话的 goal 工具；有边界的委派与扇出用普通 subagent 或 workflow。`,
			"tool:subagent": `默认在后台使用 subagent。把相互独立的委派放在同一条助手消息里一起启动，并在它们运行期间继续做有用的工作。只有当你的下一步动作依赖该 subagent 的结果时，才设 \`run_in_background: false\`。后台运行尘埃落定时，运行时会向你发送一条通知，内含其结果与最后一条助手消息。`,
			"tool:subagent_fork": `默认在后台使用 subagent_fork。把相互独立的委派放在同一条助手消息里一起启动，并在它们运行期间继续做有用的工作。只有当你的下一步动作依赖该 subagent_fork 的结果时，才设 \`run_in_background: false\`。后台运行尘埃落定时，运行时会向你发送一条通知，内含其结果与最后一条助手消息。`,
			"ui:file-review-references": `当你成功创建或修改了文件时，在最终答复里提到主要产物。要让这些文件以及其它被改动文件的引用在 Web 里可以点击，用 Markdown 行内代码的格式书写，路径使用文件工具的确切路径；若在该轮改动的文件中基本名唯一，也可以只写基本名。`,
			"tools:code-only": `\`run_code\` 是你唯一能直接调用的工具 —— 指名任何其它工具的工具调用都会失败。下面 SDK 声明的所有工具都要从程序内部调用。`
		};
		//#endregion
		//#region lib/zh/undo.mjs
		/**
		* 中文段译本（专属定制）—— tool:dsh-undo-savepoint。
		* 用户触发短语（"撤销上一步"、"redo" 等）、"⚠️ Previous DSH run did not
		* finish starting" 告警前缀、主动提示的固定话术（配置已自动保存为快照…）
		* 都是匹配 / 输出用的精确字符串，逐字保留。
		*/
		const UNDO = `## 撤销 / 回退（dsh-undo-savepoint）
当用户要求撤销上一步操作（"撤销上一步"、"回退"、"恢复"、"redo"、"保存快照"、"查看快照"）—— 通常发生在安装插件、应用皮肤或更改设置之后 —— 不要靠猜、也不要手动改配置文件：
1. 调用 undo_list 展示可用快照（配置变更时自动创建，外加手动快照）。
2. 调用 undo_restore：mode "undo" 撤销最近一次变更，mode "redo" 重新应用上一次 undo 之前保存的状态，或 mode "id" 配合 undo_list 里的快照 id 恢复。拿不准时先用 undo_diff 预览。
3. undo_restore 绝不销毁当前状态（会先存为 pre-restore 快照），并会重新确保 dsh-undo-savepoint 挂载本身。
4. 手动快照与自动快照分开存放（settings: manualDir / autoDir）。
5. 主动提示：只要用户提到或执行了配置变更（安装插件、应用皮肤、修改设置），主动告诉用户"配置已自动保存为快照,改错了随时可以撤销/回退"，并主动提出可以用 undo_list 展示最近的快照。不要等用户来问。
6. 崩溃告警：如果 undo_list 的输出以 "⚠️ Previous DSH run did not finish starting" 开头，主动建议回退到最近一次良好状态（undo_restore mode "undo"），并说明上一次运行在本插件启动完成之前就崩溃了。
7. 配置状态困惑：当用户对当前配置感到困惑（某个插件/皮肤/设置突然消失或变了样，或陷入漫长而无果的调试循环），先调用 undo_recent 检查最近是否有回退能解释它；有就明确告诉用户哪些文件在何时被回退。回退可能发生在另一个会话或经由离线工具执行，用户/AI 可能没有亲眼见到。
8. 插件代码：快照也包含用户插件的 CODE 文件（node_modules 下的 junction 目标，例如 D:\\dsh\\plugins\\*，以及 router-global.mjs 之类 profile 本地文件）。插件代码被改坏（例如 "yield* (intermediate value) is not async iterable"）同样可以回滚，即使没有任何配置文件变化 —— undo_list 的行会显示插件文件数。
9. 安全模式（SAFE MODE）：当 DSH 完全无法启动或某个插件破坏了启动流程时，用 undo_safe_mode 的 action "on" 停用除 undo 之外的所有用户插件，然后重启 DSH 再排查；action "off" 恢复之前的插件集合（需再次重启）。undo_list 的崩溃告警会指名一个具体的最近良好快照用于恢复（undo_restore mode "id"）。
注意：本系统只回滚 DSH 的配置/插件/皮肤状态，不回滚聊天记录。`;
		//#endregion
		//#region lib/zh/teams.mjs
		/**
		* 中文段译本（专属定制）—— agent-teams:usage。
		* agent_teams_* 工具名、参数名（approval= / profile= / attempt_id 等）、
		* 任务 kind 与 verdict 的取值、"Approve & Run"、.agent-teams 状态目录名
		* 都是运行时契约，逐字保留。
		*/
		const TEAMS = `当用户要求用 AgentTeams 运行某件事（例如"用 AgentTeams 做 X"），或 /agent-teams 斜杠命令的激活消息到达时，你就是多智能体团队的队长。遵循以下协议：
1. 调用 agent_teams_create，带上团队名、作为 description 的目标，以及 approval="required"。这只会创建一个待审计划，绝不能生成成员或排期工作。只有用户明确要求跳过评审、立即执行时，才用 approval="automatic"。
2. 按目标所需的角色逐个调用 agent_teams_add_member（研究员、工程师、评审……）。在 staging 阶段它们只是可编辑的花名册条目，不是运行中的子智能体。默认情况下成员会快照你当前的 provider/model/reasoning 路由；只有目标或用户要求时才改用别的路由。
3. 在 staging 阶段分析目标，创建最小可用的任务 DAG。每次 agent_teams_create_task 调用都必须带非空 subject，验证与评审任务也不例外。独立的工作应当并行；依赖只留给真正的前置关系。把完整的花名册与 DAG 建完后，告诉用户 Web 计划已就绪，然后结束本轮。规划轮里绝不要调用 agent_teams_approve。用户可以点击 Approve & Run、在之后的用户轮里明确批准、回到聊天要求修改，或丢弃该计划。评审 UI 会为返回/丢弃动作注入权威控制消息：严格照办，绝不要自行推断某个缺失或暂停的团队需要重建。用户回到聊天时，先问一个简短的澄清问题，期间不编辑、不重建；得到答复后，用 agent_teams_edit_plan 一次性提交有序的原子批次，先更新下游依赖/负责人再执行删除，概述这次修订，然后再次等待评审。绝不要通过查看或编辑 .agent-teams 状态文件或插件源码来修订计划。只有明确批准才允许调用 agent_teams_approve。
4. 批准之后，最终成员配置被原子式生成，调度器开始安排就绪的工作。以委派带队：用 agent_teams_status 监控，用 agent_teams_send_message 传达指导，让空闲的队友执行就绪的工作。不要因为某个队友的回合较慢就亲手重复它的工作。如果用户要求每个成员都出力或汇报，就为每项要求创建一个任务（或直接给每位成员发消息）；绝不要等待一个从未被分配工作的成员产出成果。
5. 如果用户明确要求暂停某个运行中的成员，其未完成的尝试在打断后会保持搁置；回答用户之后，用 agent_teams_send_message 给同一位成员传达指导，让它继续同一次尝试。普通用户问题若没有要求暂停，不要打断成员。如果工作必须换人、从头重启或被接管，先调用 agent_teams_reassign_task。优先选另一位空闲成员，或让同一位成员重试。assignee=captain 只用于你将在本轮亲手推进到终态的那一个就绪任务；绝不在还有一个队长接管未完成时启动第二个，也绝不在还有队长负责的工作未收尾时结束回合。重派会撤销旧尝试并等待该成员静止，防止迟到的结果覆盖新尝试。
6. 任务携带 attempt_id 能力凭证。成员更新时必须使用当前 attempt_id；stale-attempt 错误说明所有权已变更。收到进度通知后持续检查状态，直到每项要求的任务都到终态、每位成员都空闲/就绪；不要忙轮询，也不要向没有被分配工作的成员索要汇报。
7. 如果用户点名了某个已配置的 profile / template / 固定花名册，把该名字作为 profile= 传给 agent_teams_create。用 profile 成功创建后，不要重建相同的成员。种子 profile 自带模板任务；队长规划 profile 只提供花名册与护栏，DAG 要你在 staging 阶段自行设计。评审/测试失败时添加修复或重试任务，但绝不让新任务依赖失败的任务。不要用 send_message 去启动下一阶段；批准后调度器会分配就绪的工作。删除团队之前，盯到每项要求的任务都到终态。未经用户明确确认，绝不要执行真实的部署。
8. 质量类任务（requirements、implementation、verification、review、repair、integration）必须带契约：非空 objective 与 acceptance；implementation/repair 还需要 inScope 与 verify。review/requirements 只有 verdict=pass 才能完成；needs_revision/reject 必须带 findings 失败收场。系统随后会打开依赖成功来源（绝不依赖失败的评审）的修复 + 下一次评审。不要批准你自己的实现。create_task 不再静默恢复已停摆（halted）的团队 —— 调用 agent_teams_resume 并附原因，或 create_task({resume:true, resumeReason})。
9. 当用户明确要求完整的质量模式规划时，除非约束禁止某个阶段，按此顺序：requirements → implementation → verification → review → integration。在团队还处于 staging 时就把整张 DAG 建好：当某个实现的依赖链包含那个 requirements 任务时，允许它在 requirements 完成前创建。这是受支持的行为；不要等 requirements 跑完，也不要靠查看插件源码来确认。staged 的 integration 任务可以依赖第 1 轮 review。若该评审随后返回 needs_revision，系统会自动把仍未开始的下游依赖改接到生成的修复 + 下一次评审门上，所以把 integration 留在原计划里，不要省略或手工重建。从真实工作区或明确的 profile 推导 inScope 与验证命令；绝不要假设 src/ 或 pnpm test。给每个质量任务契约。评审的 acceptance 要评判最新的实现，而不是门会不会拒掉 needs_revision。不要把冒烟测试脚本写进任务。不要让评审者故意提交 needs_revision。除非用户要求队长接管，不要自称实现或评审。评审失败后，等待自动修复 + 下一次评审，不要手工重建这个循环。halted 表示人类停止了团队；创建更多工作前先调用 agent_teams_resume。escalated 表示自动评审循环撞到了上限；那不是 halt。
10. 把团队成果呈现给用户，然后 agent_teams_delete 该团队，除非用户还想继续用它。停止团队会同时中止队长的当前回合和成员的工作；只有之后明确的用户轮才能恢复。

工具：agent_teams_create, agent_teams_approve, agent_teams_edit_plan, agent_teams_add_member, agent_teams_remove_member, agent_teams_create_task, agent_teams_reassign_task, agent_teams_claim_task, agent_teams_update_task, agent_teams_send_message, agent_teams_status, agent_teams_resume, agent_teams_delete`;
		//#endregion
		//#region lib/zh/cordis.mjs
		/**
		* 中文段译本（专属定制）—— tool:cordis。
		* cordis_* 工具名、pluginId / packageId / pluginRunId / currentPackageId /
		* nextPackageId 等运行时标识、@pluginId 引用语法、示例代码块逐字保留。
		*/
		const CORDIS = `# 动态 Cordis 插件

动态 Cordis 插件临时扩展当前 DSH 进程。插件用 apply(ctx) 消费服务、监听事件、提供服务、注册模型工具，或在槽位（Slot）中注册浏览器 UI。

- 插件与包（Package）的定义只存在于当前进程。define 本身不修改仓库源码、配置或磁盘，定义也不会在进程重启后保留。
- 受限执行环境防的是误用，不是针对恶意代码的安全边界。动态代码取得的服务连接的是真实运行时。

## 先把面向用户的计划说清楚

- 动态 Cordis 插件是可选的实现机制之一，不是所有请求的默认选项。只有当用户打算设计或创造某样东西，或一个临时界面能实质性帮助当前工作时，才考虑用它。这些指令或相关工具的存在，以及关于 Cordis 本身的讨论，都不意味着请求就是动态插件任务。
- 当 Cordis 可能合适时，从请求与对话推断意图中的工作目标与生命周期。只有当成果属于当前运行中的 Harness、且应作为临时运行时扩展交付时才使用它。如果这个区分实质性地模糊，最多问一个关于预期结果或生命周期的简短问题；否则按匹配的工作流继续，不要要求用户了解或选择 Cordis 作为实现机制。
- 一旦确定动态插件合适，判断任务是创建新插件，还是用 @pluginId 修改用户指名的插件。目标明确时直接进行，不要反复请求确认。
- 从请求的成果出发选择宿主（Host）、客户端（Client）或两者。任务不需要可见的页面行为时，不要提议客户端/浏览器 UI；当请求的成果是可视化、可交互或依赖页面状态时，也不要回避客户端。宿主还是客户端是实现选择，不要让用户去选。
- 当设计方向或一个潜在有用的界面会实质性影响结果时，最多问一个关于成果或创作偏好的简短问题，并给出几个候选方向；否则直接进行，不要搞多轮访谈或复杂问卷。
- cordis_define 只定义并呈现代码，不会运行它。定义之后，说明宿主返回的 pluginId 与 packageId，以及下一步是 run 还是 update。
- cordis_run 可能需要用户批准。返回 awaiting-approval 时，说明用户需要在 UI 里允许或拒绝。不要等待、重试或声称它已在运行。
- 返回 starting 时，说明请求已进入异步流程，客户端仍在激活。starting 不代表成功。等系统通过 steering 上下文报告最终结果。
- 用户拒绝后不要再请求批准。技术失败后，从该插件的诊断出发修复同一个插件；不要悄悄另建替代插件。

## 推荐工作流与工具

创建、修改或修复插件之前，先加载 cordis-plugin-development 技能（Skill）。该技能提供需求导航、能力组合、完整示例与故障排查。把 Inspect Provider 的结果当作确切 API 的唯一事实来源。

1. cordis_inspect_list：发现当前宿主与客户端的 Provider 及其只读查询方法。
2. cordis_inspect_query：用返回的 platform、provider、method 与 schema 查询确切的服务、事件、内建（Builtin）、槽位、主题 token 或工具信息。
3. cordis_inspect_self：查看当前会话的插件、包、版本指针、源码与诊断。只有同时给出 pluginId 与 packageId 才返回源码。
4. cordis_define：为新插件创建第一个包，或向既有插件追加一个不可变包。它定义代码但不运行。
5. cordis_run：激活确切的包。首次激活、重启当前或回滚用 run；切换版本用 update。
6. cordis_stop：移除当前 Run 与待批准请求，但保留定义、授权与版本指针。
7. cordis_undefine：永久停用并删除一个插件及其所有包。只在确认用户不再需要后使用。

- 在写代码之前，Inspect 与目录（Catalog）数据只用于确认能力、名字、签名、类型与注册协议；它们不替代业务 API。
- 不带输入调用 Service.listService 与 Event.listEvents，从紧凑的签名目录里挑选，然后再精确查询目标服务或事件。精确查询返回结构化契约及其引用的类型。
- 运行时，插件必须调用真实服务、监听真实事件。不要缓存、展示 Inspect 结果，也不要把它当业务数据依赖。

## 身份、版本与批准

- pluginId 标识一个可以随时间修改的插件。新建插件只提交 3–6 个小写英文字母的语义化 idPrefix；最终 ID 由宿主分配。
- packageId 标识插件下一个不可变的宿主/客户端源码版本。要改代码就定义新包，绝不覆盖旧版本。
- pluginRunId 标识一次激活尝试，关联其批准、宿主/客户端加载、私有 RPC、Run 卡片与错误。
- currentPackageId 是最近一次完全成功的包。停止、启动更新或更新失败都不会清除它。
- nextPackageId 是等待批准、正在尝试、等待客户端激活或最近失败的目标包。
- 单个对勾只批准当前包；双对勾批准同一插件未来的版本。技术失败后授权仍然有效。
- 更新会在启动目标包之前停止旧 Run。失败不会自动重启旧版本；之后用 update 重试，或用 run 回滚到 current。

当用户输入 @pluginId 时，系统注入身份、默认基础包、版本指针与运行状态，但不注入源码：

1. 调用 cordis_inspect_self(pluginId, packageId) 读取目标源码。
2. 以既有模式使用 cordis_define，向同一插件追加包。
3. 按版本关系以 run 或 update 模式调用 cordis_run。

绝不为 @pluginId 悄悄另建插件。如果该引用因为被删除、属于别的会话或随进程重启丢失而不可用，直接告诉用户。

## 必须避免的高频错误

### 服务：ctx.get 与 inject

- 默认用 ctx.get('serviceName') 读取可选服务，并处理 undefined。
- 只有当该服务是硬依赖、且插件必须进入等待（直到 Cordis 在服务出现后重新激活它）时，才在返回的插件对象上声明 inject: ['serviceName']。
- 只有在 inject 里声明过某服务后，才能以 ctx.serviceName 属性方式读取。绝不要以 ctx 属性访问未声明的服务。

\`\`\`js
return {
  inject: ['requiredService'],
  apply(ctx) {
    ctx.requiredService.someMethod()
    const optionalService = ctx.get('optionalService')
    if (optionalService !== undefined) optionalService.someMethod()
  },
}
\`\`\`

### 代码：只用普通 JavaScript

- 宿主与客户端代码不经 TypeScript、JSX 或打包器转换。
- 不要用 TypeScript 类型、as、装饰器、import、require 或 JSX。
- 客户端 React 代码必须用 React.createElement(...)；绝不写 <Component />。
- 不要假设 process、Buffer、window、document、fetch、原生定时器或任何其它全局可用。先查询对应平台的 Builtins 与服务。

### 数据：不要序列化活数据

- 服务、事件、槽位、会话及其衍生的 Cordis/DSH 对象是内部活数据，不是可以倾倒的普通 JSON。
- 不要对活数据使用 JSON.stringify、structuredClone、递归枚举、整体复制或整对象展示。
- 只读取任务所需的叶子字段，然后构造不带宿主引用的最小自有数据对象。

### 生命周期：每个副作用都必须可逆

- 服务、事件、工具、处理器、定时器、槽位、样式与主题覆盖都必须属于当前 Fiber。
- 用 ctx.effect()、ctx.on() 或返回 disposer 的官方 API，保证 stop、update 或 undefine 能移除每个副作用。
- cordis-plugin-development 技能包含定时器、瀑布流、槽位、主题、工具、RPC 与 React 的完整示例与故障排查。

## 宿主与客户端

- 宿主运行在 DSH 的 Node.js 进程里，适合文件、网络、命令、Agent/会话访问、宿主事件、服务、模型工具，以及可被客户端调用的 JSON 方法。
- 客户端运行在浏览器页面里，适合主题、布局、当前页面状态、工具卡片与槽位 UI。
- 宿主与客户端通过包私有的 JSON 方法通信：宿主用 harness.handle(method, handler)，客户端用 host.call(method, args)。方向是客户端→宿主，且只有无损 JSON 可以跨越它。
- 客户端 UI 必须注册在查询到的槽位里；apply() 不能直接返回 React Element。不带 root 查询 Slots.listSubTree，从紧凑的目的/拓扑树里挑选，然后再精确查询目标 root 的完整注册契约与 props，之后才写代码。
- Run 专属面板与确切的槽位注册模式见技能与 Inspect Provider。

## 异步结果与恢复

- 不要在工具里等待只有当前回合结束后才可能发生的批准或浏览器工作。
- 异步成功、拒绝与运行时错误会更新 Run 状态，并通过 steering 上下文通知你。
- 技术失败后，用 cordis_inspect_self 读取确切包源码及其 message/stack。在同一插件下定义一个修正后的包并自主重试。
- 其它失败原因、修复流程与完整扩展模式，使用 cordis-plugin-development 技能。`;
		//#endregion
		//#region lib/zh/sdk.mjs
		/**
		* 中文段译本（专属定制）—— tools:sdk。
		* 该段 95% 是 TS 类型声明代码块（工具签名契约），逐字翻译既无意义又有抄写
		* 风险 —— 译本因此是**函数形态**：只替换前导散文，代码块从原文的 \`\`\`ts
		* 围栏起逐字节保留（运行时取自原文，绝不手抄）。引擎约定：函数返回
		* null/undefined = 放弃替换、保持原文。
		* ponytail: 依赖 \`\`\`ts 围栏标记存在；宿主若改掉围栏风格，函数返回 null
		* 自动退回英文原文，升级路径是把整段改成纯静态译本。
		*/
		const SDK_ZH = (original) => {
			const at = String(original ?? "").indexOf("```ts");
			if (at < 0) return null;
			return "## 为 run_code 编写代码\n\n`run_code` 接受两个必填参数：`code` —— 一个异步 TypeScript 函数的函数体（只允许可擦除语法 —— 不用 `enum` 与命名空间；类型注解仅供参考，运行时会剥离类型）—— 和 `description`，一段说明该程序做什么的简短摘要。在程序内部：\n\n- 用 `await tools.name(args)` 调用工具 —— 名称古怪时用引号访问：`tools[\"my-tool\"](args)`。每次调用都会解析为该工具的规范化 JSON 值。工具参数必须是无损 JSON。\n- 失败的工具调用会以 `ToolCallError` reject，其 `toolName` 标识失败的工具，`message` 人类可读 —— 用 `try/catch` 捕获后继续。\n- 相互独立的只读调用可以在 `Promise.all` 下并行（安全调用并发执行；会改动状态的调用单独按提交顺序执行）。有依赖的工作用 `await` 串行。\n- 用 `return` 和/或 `console.log(...)` 输出结果。只有你打印或返回的内容才算程序输出。包含图片的成功工具结果会在运行结束后附上，供你下一步查看；其它所有中间结果都不会进入对话，因此只提取你需要的部分。\n\n可用工具：\n\n" + original.slice(at);
		};
		//#endregion
		//#region lib/zh/index.mjs
		/**
		* 中文段译本（专属定制）—— 汇总入口。
		* 引擎（lib/effective.js 的 applySectionPolicy）在 zhSections 开启时按段名
		* 精确匹配替换文本：对得上号的段整段换成译本，对不上的段保持原文 —— 段数
		* 与注入不增不减。取值是字符串（整段替换）或函数（(原文) => 译本 | null，
		* 见 sdk.mjs；返回 null = 放弃替换）。
		* 安全边界：{{...}} 提示词变量（deployment:persona 的 {{model}} / {{cwd}}、
		* env_* 等）由宿主在装配后渲染，译本里逐字保留；黑名单挡下的密钥类 env 变量
		* 本来就不会被注册，替换文本不引入任何新的变量引用。
		*/
		const ZH_SECTIONS = {
			...CORE,
			"tool:dsh-undo-savepoint": UNDO,
			"agent-teams:usage": TEAMS,
			"tool:cordis": CORDIS,
			"tools:sdk": SDK_ZH
		};
		//#endregion
		//#region src/client/SectionsPane.tsx
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
		/** 编辑态的键：段名之外还要带阶段，否则三个部分里同名的行会同时展开编辑器。 */
		const editKey = (key, name) => `${key}:${name}`;
		function SectionsPane({ cfg, inv, phases, phase, syncAll, t, write }) {
			const [filter, setFilter] = (0, react.useState)("all");
			const [editing, setEditing] = (0, react.useState)(null);
			const [draft, setDraft] = (0, react.useState)("");
			const [addOpen, setAddOpen] = (0, react.useState)(false);
			const [notice, setNotice] = (0, react.useState)(null);
			const rowsOf = (key) => phaseRows(cfg, phases?.[key] ?? null, key);
			const applyBlock = (key, name, blocked) => {
				const patch = blockPatch(cfg, key, name, blocked);
				for (const [field, value] of Object.entries(patch)) write(field, value);
			};
			const toggleBlocked = (key, name) => {
				const blocked = !deniedNames(cfg, key).includes(name);
				for (const k of syncAll ? PART_ORDER : [key]) applyBlock(k, name, blocked);
			};
			const inBaseOf = (key, name) => (phases?.[key]?.baseSections ?? []).some((sec) => sec.name === name);
			const persistPhase = (key, rows) => {
				write("inject", phaseInjectEntries(cfg, key, rows));
			};
			const moveRow = (key, index, dir) => {
				const rows = rowsOf(key);
				const target = index + dir;
				if (target < 0 || target >= rows.length) return;
				const next = rows.slice();
				const [item] = next.splice(index, 1);
				next.splice(target, 0, item);
				persistPhase(key, next);
			};
			const removeFromPart = (key, name) => {
				const phaseOfItem = injectPhaseOf(key);
				write("inject", (cfg.inject ?? []).filter((x) => {
					if (x.name !== name) return true;
					const itemPhase = x.phase ?? "always";
					return !(itemPhase === phaseOfItem || itemPhase === "always");
				}));
				applyBlock(key, name, false);
			};
			const startReplace = (key, row) => {
				setEditing(editKey(key, row.name));
				setDraft(row.override || row.text);
			};
			const commitReplace = (key, row) => {
				const patchRow = (r) => r.name !== row.name ? r : {
					...r,
					override: draft,
					text: draft
				};
				if (syncAll) {
					const rowsByKey = {};
					for (const k of PART_ORDER) {
						const rows = rowsOf(k);
						rowsByKey[k] = k === key || rows.some((r) => r.name === row.name) ? rows.map(patchRow) : rows;
					}
					write("inject", mergedPhaseInjectEntries(cfg, rowsByKey));
				} else persistPhase(key, rowsOf(key).map(patchRow));
				setEditing(null);
			};
			const restoreReplace = (key, row) => {
				const next = rowsOf(key).map((r) => r.name !== row.name ? r : {
					...r,
					override: "",
					text: r.custom ? r.text : ""
				});
				persistPhase(key, next);
				if (!row.custom && Object.hasOwn(cfg.replace ?? {}, row.name)) {
					const rest = { ...cfg.replace ?? {} };
					delete rest[row.name];
					write("replace", rest);
				}
			};
			const addSection = (name, text, phase) => {
				const inject = (cfg.inject ?? []).slice();
				inject.push({
					name,
					order: 120 + inject.length,
					text,
					phase,
					custom: true
				});
				write("inject", inject);
			};
			const addFromPool = (key, name, text) => {
				if (text === "" || text.startsWith("<")) {
					setNotice(t("sectionDynamicNoAdd", { name }));
					return;
				}
				setNotice(null);
				const rows = rowsOf(key);
				const existing = rows.find((row) => row.name === name);
				const next = existing !== void 0 ? [...rows.filter((row) => row.name !== name), existing] : [...rows, {
					name,
					text: "",
					replaced: Object.hasOwn(cfg.replace ?? {}, name),
					custom: false,
					override: text,
					blocked: false
				}];
				if (existing === void 0 && inBaseOf(key, name) && deniedNames(cfg, key).includes(name)) applyBlock(key, name, false);
				persistPhase(key, next);
			};
			const stageLabel = (key) => key === "bootstrap" ? t("phaseStageGuide") : key === "compaction" ? t("phaseStageControlled") : t("phaseStageResident");
			const partNote = (key) => {
				const view = phases?.[key];
				if (view === void 0 || view === null) return null;
				if (cfg.forceSections !== false) return null;
				if (view.takenOverBy !== void 0) return (0, react.createElement)("div", { style: s.noticeWarn }, t("sectionsTakenOver", { name: view.takenOverBy }));
				const lost = view.lostSections;
				if (lost !== void 0) return (0, react.createElement)("div", { style: s.noticeWarn }, t("sectionsLost", {
					emitted: lost.emitted,
					survived: lost.survived
				}));
				return null;
			};
			const isEditing = (key, row) => editing === editKey(key, row.name);
			const renderRow = (key, row, index, total) => {
				if (!rowVisible(row)) return null;
				return (0, react.createElement)("div", {
					key: row.name,
					style: {
						...s.row,
						...row.blocked ? s.rowBlocked : {}
					}
				}, [
					(0, react.createElement)("input", {
						type: "checkbox",
						checked: !row.blocked,
						onChange: () => toggleBlocked(key, row.name),
						title: row.blocked ? t("blockedOn") : t("blockedOff"),
						style: {
							margin: 0,
							cursor: "pointer",
							flex: "none"
						}
					}),
					(0, react.createElement)("div", { style: s.rowBody }, [(0, react.createElement)("div", { style: s.rowTitle }, [
						(0, react.createElement)("span", { style: s.code }, row.name),
						(0, react.createElement)("span", { style: s.orderTag }, "#" + index),
						(0, react.createElement)("span", { style: row.custom ? s.badgeCustom : s.badgeSystem }, row.custom ? t("manual") : t("system")),
						row.replaced ? (0, react.createElement)("span", { style: s.badgeReplaced }, t("replaced")) : null,
						row.blocked ? (0, react.createElement)("span", { style: s.badgeBlocked }, t("blockedOn")) : null
					]), isEditing(key, row) ? (0, react.createElement)("div", { style: s.editBox }, [(0, react.createElement)("textarea", {
						style: s.editInput,
						value: draft,
						onChange: (e) => setDraft(e.target.value),
						rows: 3
					}), (0, react.createElement)("div", { style: s.injectRow }, [
						(0, react.createElement)("button", {
							style: s.mini,
							onClick: () => commitReplace(key, row)
						}, t("save")),
						(0, react.createElement)("button", {
							style: s.mini,
							onClick: () => setDraft("")
						}, t("clearInput")),
						!row.custom && (row.override || Object.hasOwn(cfg.replace ?? {}, row.name)) ? (0, react.createElement)("button", {
							style: s.mini,
							onClick: () => restoreReplace(key, row)
						}, t("restore")) : null
					])]) : (0, react.createElement)("div", { style: s.preview }, String(row.override || row.text || "").slice(0, 140) || (row.custom ? t("empty") : t("dynamic")))]),
					(0, react.createElement)("div", { style: s.arrowCol }, [(0, react.createElement)("button", {
						style: s.arrow,
						disabled: index === 0,
						onClick: () => moveRow(key, index, -1),
						title: t("moveUp")
					}, "↑"), (0, react.createElement)("button", {
						style: s.arrow,
						disabled: index === total - 1,
						onClick: () => moveRow(key, index, 1),
						title: t("moveDown")
					}, "↓")]),
					isEditing(key, row) ? null : (0, react.createElement)("button", {
						style: s.mini,
						onClick: () => startReplace(key, row)
					}, t("replace")),
					!isEditing(key, row) && !row.custom && (row.override || Object.hasOwn(cfg.replace ?? {}, row.name)) ? (0, react.createElement)("button", {
						style: s.mini,
						onClick: () => restoreReplace(key, row)
					}, t("restore")) : null,
					row.custom ? (0, react.createElement)("button", {
						style: s.mini,
						onClick: () => removeFromPart(key, row.name),
						title: t("delete")
					}, t("delete")) : null
				]);
			};
			const rows = rowsOf(phase);
			const onCount = rows.filter((row) => !row.blocked).length;
			const offCount = rows.length - onCount;
			const rowVisible = (row) => filter === "all" || (filter === "on" ? !row.blocked : row.blocked);
			const poolSections = inv?.sections ?? [];
			return (0, react.createElement)("div", { style: s.colLeft }, [(0, react.createElement)("div", { style: s.colScroll }, [
				notice ? (0, react.createElement)("div", { style: s.noticeWarn }, notice) : null,
				partNote(phase),
				rows.map((row, i) => renderRow(phase, row, i, rows.length)),
				rows.length === 0 ? (0, react.createElement)("div", { style: s.muted }, t("empty")) : null,
				addOpen ? (0, react.createElement)(InjectForm, {
					onAdd: (name, text) => {
						addSection(name, text, injectPhaseOf(phase));
						setAddOpen(false);
					},
					phaseLabel: stageLabel(phase),
					t
				}) : null,
				(0, react.createElement)("details", { style: s.injectBox }, [
					(0, react.createElement)("summary", { style: {
						...s.muted,
						cursor: "pointer"
					} }, `${t("allSectionsTitle")} (${poolSections.length})`),
					(0, react.createElement)("div", { style: {
						...s.muted,
						marginBottom: 4
					} }, t("sectionsFourHint")),
					poolSections.length === 0 ? (0, react.createElement)("div", { style: s.muted }, t("empty")) : null,
					poolSections.map((sec) => (0, react.createElement)("div", {
						key: sec.name,
						style: {
							...s.row,
							opacity: .92
						}
					}, [(0, react.createElement)("div", { style: s.rowBody }, [(0, react.createElement)("div", { style: s.rowTitle }, (0, react.createElement)("span", { style: s.code }, sec.name)), (0, react.createElement)("div", { style: s.preview }, String(sec.text ?? "").slice(0, 140) || t("dynamic"))]), ...PART_ORDER.map((key) => (0, react.createElement)("button", {
						key,
						style: s.arrow,
						title: t("poolAddTitle", { phase: stageLabel(key) }),
						onClick: () => addFromPool(key, sec.name, sec.text ?? "")
					}, t(key === "bootstrap" ? "phaseShortGuide" : key === "active" ? "phaseShortResident" : "phaseShortControlled")))]))
				]),
				(0, react.createElement)("div", { style: {
					...s.injectRow,
					marginTop: 8
				} }, [(0, react.createElement)("button", {
					style: s.mini,
					onClick: () => setAddOpen(!addOpen),
					title: t("injectNew")
				}, addOpen ? `× ${t("clearInput")}` : `+ ${t("injectNew")}`)])
			]), (0, react.createElement)("div", { style: s.colFoot }, [(0, react.createElement)("div", { style: s.seg }, [
				(0, react.createElement)("button", {
					style: filter === "all" ? s.segBtnActive : s.segBtn,
					onClick: () => setFilter("all")
				}, `${t("filterAll")} ${rows.length}`),
				(0, react.createElement)("button", {
					style: filter === "on" ? s.segBtnActive : s.segBtn,
					onClick: () => setFilter("on")
				}, `${t("filterOn")} ${onCount}`),
				(0, react.createElement)("button", {
					style: filter === "off" ? s.segBtnActive : s.segBtn,
					onClick: () => setFilter("off")
				}, `${t("filterOff")} ${offCount}`)
			])])]);
		}
		/** 注入新段表单：「+ 注入」展开，阶段锁定为当前 Tab 的阶段。 */
		function InjectForm({ onAdd, phaseLabel, t }) {
			const [name, setName] = (0, react.useState)("");
			const [text, setText] = (0, react.useState)("");
			const submit = () => {
				if (!name.trim()) return;
				onAdd(name.trim(), text);
				setName("");
				setText("");
			};
			return (0, react.createElement)("div", { style: s.injectRow }, [
				(0, react.createElement)("input", {
					style: {
						...s.input,
						width: "30%"
					},
					placeholder: t("name"),
					value: name,
					onChange: (e) => setName(e.target.value)
				}),
				(0, react.createElement)("input", {
					style: {
						...s.input,
						flex: 1
					},
					placeholder: `${t("text")}（${phaseLabel}）`,
					value: text,
					onChange: (e) => setText(e.target.value)
				}),
				(0, react.createElement)("button", {
					style: s.mini,
					onClick: submit
				}, t("add"))
			]);
		}
		//#endregion
		//#region src/client/ToolsPane.tsx
		/**
		* ToolsPane — 独立面板的左栏（工具模式）。
		*
		* 顶部三个阶段 Tab（引导期 / 常驻期 / 压缩受控期），与右栏预览的阶段按钮
		* **联动**。每个阶段列出该阶段进入过滤的目录 ∪ 用户加回的工具：勾选框 =
		* 该阶段对模型可见；隐藏后仍在列表可反选。三份名单互不继承。
		*
		* 底部固定条：三态过滤（全部 / 已启用 = 可见 / 已停用 = 隐藏），只统计当前
		* 阶段。
		*
		* 「本系统全部工具」只读池收在折叠区（不分阶段）：每行三个小按钮把该工具
		* 加入对应阶段（替代旧版拖拽）——被该阶段默认裁掉、但注册表里仍有的会写进
		* add 名单加回；注册表里根本没有的（别的预设独有）加不进来，界面明确说明。
		*/
		function ToolsPane({ cfg, inv, phases, phase, syncAll, t, write }) {
			const [filter, setFilter] = (0, react.useState)("all");
			const [notice, setNotice] = (0, react.useState)(null);
			const excludeOf = (key) => {
				const tools = cfg.tools ?? {};
				return (key === "bootstrap" ? tools.bootstrap?.exclude : key === "compaction" ? tools.compaction?.exclude : tools.exclude) ?? [];
			};
			const addOf = (key) => {
				const tools = cfg.tools ?? {};
				return (key === "bootstrap" ? tools.bootstrap?.add : key === "compaction" ? tools.compaction?.add : tools.add) ?? [];
			};
			const writeLists = (key, exclude, add) => {
				write("tools", withPhaseAdd(withPhaseExclude(cfg.tools ?? {}, key, exclude), key, add));
			};
			const writeSynced = (apply) => {
				let tools = cfg.tools;
				for (const k of PART_ORDER) {
					const next = apply(k, excludeOf(k), addOf(k));
					if (next === null) continue;
					tools = withPhaseExclude(withPhaseAdd(tools, k, next.add), k, next.exclude);
				}
				write("tools", tools);
			};
			const catalogOf = (key) => (phases?.[key]?.baseTools ?? []).map((tool) => tool.name);
			const isInCatalog = (key, name) => catalogOf(key).includes(name);
			const registry = (() => {
				const list = PART_ORDER.map((key) => phases?.[key]?.registryTools).find((x) => Array.isArray(x) && x.length > 0) ?? [];
				return new Set(list);
			})();
			const addToPhase = (key, name, hidden) => {
				let exclude = excludeOf(key);
				let add = addOf(key);
				if (!isInCatalog(key, name) && !add.includes(name)) add = [...add, name];
				exclude = hidden ? exclude.includes(name) ? exclude : [...exclude, name] : exclude.filter((x) => x !== name);
				writeLists(key, exclude, add);
			};
			const rowsOf = (key) => {
				const exclude = excludeOf(key);
				const catalog = (phases?.[key]?.baseTools ?? []).map((tool) => ({
					name: tool.name,
					description: tool.description ?? "",
					hidden: exclude.includes(tool.name),
					added: false
				}));
				const names = new Set(catalog.map((row) => row.name));
				const added = addOf(key).filter((name) => !names.has(name)).map((name) => ({
					name,
					description: "",
					hidden: false,
					added: true
				}));
				return [...catalog, ...added];
			};
			const toggleHide = (key, name, currentlyHidden) => {
				if (syncAll) {
					writeSynced((_k, exclude, add) => {
						if (currentlyHidden) return {
							exclude: exclude.filter((x) => x !== name),
							add
						};
						if (add.includes(name)) return {
							exclude,
							add: add.filter((x) => x !== name)
						};
						return exclude.includes(name) ? null : {
							exclude: [...exclude, name],
							add
						};
					});
					setNotice(null);
					return;
				}
				if (currentlyHidden) addToPhase(key, name, false);
				else {
					let exclude = excludeOf(key);
					let add = addOf(key);
					if (add.includes(name)) add = add.filter((x) => x !== name);
					else if (!exclude.includes(name)) exclude = [...exclude, name];
					writeLists(key, exclude, add);
				}
				setNotice(null);
			};
			const addFromPool = (key, name) => {
				if (!isInCatalog(key, name) && !registry.has(name)) {
					setNotice({
						kind: "warn",
						text: t("toolNotInRegistry", { name })
					});
					return;
				}
				if (syncAll) {
					writeSynced((k, exclude, add) => ({
						exclude: exclude.filter((x) => x !== name),
						add: !isInCatalog(k, name) && !add.includes(name) ? [...add, name] : add
					}));
					setNotice({
						kind: "ok",
						text: t("toolSyncShown", { name })
					});
					return;
				}
				addToPhase(key, name, false);
				setNotice({
					kind: "ok",
					text: isInCatalog(key, name) ? t("toolShown", {
						name,
						to: stageLabel(key)
					}) : t("toolAdded", {
						name,
						phase: stageLabel(key)
					})
				});
			};
			const stageLabel = (key) => key === "bootstrap" ? t("phaseStageGuide") : key === "compaction" ? t("phaseStageControlled") : t("phaseStageResident");
			const rows = rowsOf(phase);
			const onCount = rows.filter((row) => !row.hidden).length;
			const offCount = rows.length - onCount;
			const rowVisible = (row) => filter === "all" || (filter === "on" ? !row.hidden : row.hidden);
			const renderRow = (row) => {
				if (!rowVisible(row)) return null;
				return (0, react.createElement)("div", {
					key: row.name,
					style: {
						...s.row,
						...row.hidden ? s.rowBlocked : {}
					},
					title: row.description.slice(0, 120)
				}, [(0, react.createElement)("input", {
					type: "checkbox",
					checked: !row.hidden,
					onChange: () => toggleHide(phase, row.name, row.hidden),
					title: row.hidden ? t("hiddenOn") : t("hiddenOff"),
					style: {
						margin: 0,
						cursor: "pointer",
						flex: "none"
					}
				}), (0, react.createElement)("div", { style: s.rowBody }, [(0, react.createElement)("div", { style: s.rowTitle }, [
					(0, react.createElement)("span", { style: s.code }, row.name),
					row.added ? (0, react.createElement)("span", { style: s.badgeCustom }, t("toolAddedTag")) : null,
					row.hidden ? (0, react.createElement)("span", { style: s.badgeBlocked }, t("hiddenOn")) : null
				]), row.description !== "" ? (0, react.createElement)("div", { style: s.preview }, row.description.slice(0, 120)) : null])]);
			};
			const allTools = (inv?.tools ?? []).map((tool) => ({
				name: tool.name,
				description: typeof tool === "string" ? "" : tool.description ?? ""
			}));
			return (0, react.createElement)("div", { style: s.colLeft }, [(0, react.createElement)("div", { style: s.colScroll }, [
				(0, react.createElement)("div", { style: s.muted }, t("toolsFourHint")),
				notice ? (0, react.createElement)("div", { style: notice.kind === "ok" ? s.noticeOk : s.noticeWarn }, notice.text) : null,
				rows.map(renderRow),
				rows.length === 0 ? (0, react.createElement)("div", { style: s.muted }, t("empty")) : null,
				(0, react.createElement)("details", { style: s.injectBox }, [
					(0, react.createElement)("summary", { style: {
						...s.muted,
						cursor: "pointer"
					} }, `${t("allToolsTitle")} (${allTools.length})`),
					allTools.length === 0 ? (0, react.createElement)("div", { style: s.muted }, t("empty")) : null,
					allTools.map((tool) => (0, react.createElement)("div", {
						key: tool.name,
						style: {
							...s.row,
							opacity: .92
						}
					}, [(0, react.createElement)("div", { style: s.rowBody }, [(0, react.createElement)("div", { style: s.rowTitle }, (0, react.createElement)("span", { style: s.code }, tool.name)), (0, react.createElement)("div", { style: s.preview }, tool.description.slice(0, 120))]), ...PART_ORDER.map((key) => (0, react.createElement)("button", {
						key,
						style: s.arrow,
						title: t("poolAddTitle", { phase: stageLabel(key) }),
						onClick: () => addFromPool(key, tool.name)
					}, t(key === "bootstrap" ? "phaseShortGuide" : key === "active" ? "phaseShortResident" : "phaseShortControlled")))]))
				])
			]), (0, react.createElement)("div", { style: s.colFoot }, [(0, react.createElement)("div", { style: s.seg }, [
				(0, react.createElement)("button", {
					style: filter === "all" ? s.segBtnActive : s.segBtn,
					onClick: () => setFilter("all")
				}, `${t("filterAll")} ${rows.length}`),
				(0, react.createElement)("button", {
					style: filter === "on" ? s.segBtnActive : s.segBtn,
					onClick: () => setFilter("on")
				}, `${t("filterOn")} ${onCount}`),
				(0, react.createElement)("button", {
					style: filter === "off" ? s.segBtnActive : s.segBtn,
					onClick: () => setFilter("off")
				}, `${t("filterOff")} ${offCount}`)
			])])]);
		}
		//#endregion
		//#region src/client/preset-io.ts
		/** 页面是否运行在 Tauri（v1 标记或 v2 桥）webview 内。 */
		function isTauriEnv(win) {
			if (win === null || win === void 0) return false;
			const w = win;
			return w.__TAURI_INTERNALS__ !== void 0 || w.__TAURI__ !== void 0;
		}
		/** 取可用的 Tauri v2 invoke 桥；不可用时返回 null。 */
		function invokeOf(win) {
			if (!isTauriEnv(win)) return null;
			const internals = win.__TAURI_INTERNALS__;
			return internals && typeof internals.invoke === "function" ? internals.invoke : null;
		}
		const JSON_FILTERS = [{
			name: "JSON",
			extensions: ["json"]
		}];
		/**
		* 原生保存对话框 + 写文件。`cancelled` = 用户关闭了对话框（调用方绝不
		* 得再回退到下载）；`unavailable` = 宿主无法提供 dialog/fs 插件（插件
		* 缺失或被 ACL 拦截），调用方应当回退。
		*/
		async function tauriSaveText(invoke, defaultName, text) {
			try {
				const path = await invoke("plugin:dialog|save", {
					defaultPath: defaultName,
					filters: JSON_FILTERS
				});
				if (typeof path !== "string" || path === "") return { kind: "cancelled" };
				await invoke("plugin:fs|write_text_file", {
					path,
					contents: text
				});
				return { kind: "saved" };
			} catch {
				return { kind: "unavailable" };
			}
		}
		/** 原生打开对话框 + 读文件。`cancelled` = 用户关闭了对话框。 */
		async function tauriOpenText(invoke) {
			try {
				const picked = await invoke("plugin:dialog|open", {
					multiple: false,
					directory: false,
					filters: JSON_FILTERS
				});
				const path = Array.isArray(picked) ? picked[0] : picked;
				if (typeof path !== "string" || path === "") return { kind: "cancelled" };
				const text = await invoke("plugin:fs|read_text_file", { path });
				if (typeof text !== "string") return { kind: "unavailable" };
				return {
					kind: "text",
					text
				};
			} catch {
				return { kind: "unavailable" };
			}
		}
		/** Web 回退导出：Blob + object URL + <a download> + revoke。 */
		function webDownload(target, filename, text) {
			const blob = target.makeBlob(text);
			const url = target.objectUrl(blob);
			const anchor = target.makeAnchor();
			anchor.href = url;
			anchor.download = filename;
			anchor.click();
			target.revoke(url);
		}
		/** 把单个预设编码为导出文件的 JSON 格式（单对象格式）。`envBlocklist`
		*  是全局环境变量黑名单的随行快照：导入端按并集并入（见 PresetsTab）。 */
		function encodePresetExport(preset, envBlocklist) {
			return JSON.stringify({
				name: preset.name,
				data: preset.data,
				...Array.isArray(envBlocklist) ? { envBlocklist } : {}
			}, null, 2);
		}
		/**
		* 解析导出的预设文件：单个 { name, data } 对象或对象数组。空内容 /
		* 非法 JSON 抛普通 Error，由调用方给出友好提示；条目级的过滤在
		* addImportedPresets 里进行。
		*/
		function decodePresetExport(text) {
			const trimmed = String(text).trim();
			if (trimmed === "") throw new Error("EMPTY_EXPORT");
			return JSON.parse(trimmed);
		}
		function browserDownloadTarget() {
			const g = globalThis;
			const doc = g.document;
			const url = g.URL;
			return {
				makeAnchor: () => doc.createElement("a"),
				makeBlob: (text) => new Blob([text], { type: "application/json" }),
				objectUrl: (blob) => url.createObjectURL(blob),
				revoke: (u) => url.revokeObjectURL(u)
			};
		}
		/** 为当前 window 构建真实环境（在 Node 里调用也安全）。 */
		function makeIoEnv(win) {
			const invoke = invokeOf(win !== void 0 ? win : typeof window !== "undefined" ? window : void 0);
			const tauri = invoke !== null;
			return {
				tauri,
				saveText: (name, text) => tauri ? tauriSaveText(invoke, name, text) : Promise.resolve({ kind: "unavailable" }),
				openText: () => tauri ? tauriOpenText(invoke) : Promise.resolve({ kind: "unavailable" }),
				download: (name, text) => webDownload(browserDownloadTarget(), name, text)
			};
		}
		/**
		* 导出一个预设：宿主能提供原生对话框时走 tauri 保存（cancelled = 用户
		* 拒绝，绝不回退下载）；否则走 Web 下载。
		*/
		async function exportPresetFile(preset, io, envBlocklist) {
			const env = io ?? makeIoEnv();
			try {
				const text = encodePresetExport(preset, envBlocklist);
				const filename = presetExportFilename(preset.name);
				if (env.tauri) {
					const out = await env.saveText(filename, text);
					if (out.kind === "saved") return {
						ok: true,
						via: "tauri"
					};
					if (out.kind === "cancelled") return {
						ok: false,
						via: "tauri",
						cancelled: true
					};
				}
				env.download(filename, text);
				return {
					ok: true,
					via: "browser"
				};
			} catch (e) {
				return {
					ok: false,
					via: "browser",
					message: e instanceof Error ? e.message : String(e)
				};
			}
		}
		/**
		* 经原生 tauri 打开对话框导入一个预设；返回 `unavailable` 时由调用方
		* 点击自己的隐藏文件输入（Web 回退）。
		*/
		async function importPresetFile(io) {
			const env = io ?? makeIoEnv();
			try {
				if (env.tauri) {
					const out = await env.openText();
					if (out.kind === "text") return {
						kind: "text",
						text: out.text,
						via: "tauri"
					};
					if (out.kind === "cancelled") return { kind: "cancelled" };
				}
			} catch {}
			return { kind: "unavailable" };
		}
		//#endregion
		//#region src/client/PresetsPane.tsx
		/**
		* PresetsPane — 独立面板的预设模式（左右双栏）。
		*
		* 两种「预设」分开，各占一栏：
		*  - 左栏（PresetsPane）：配置快照库 —— 保存当前配置 / 导入 / 应用 / 导出 /
		*    删除。快照只改本插件内的 presets 库，不会变成可选的 agent 预设；
		*  - 右栏（SettingsPane）：存为 agent 预设（整体 fork 当前编辑目标的预设目录，
		*    并把当前定制写进它的覆盖项）+ 全局设置（强制覆盖开关、环境变量黑名单、
		*    提示词变量参考、恢复初始状态）。
		*
		* 导入导出经 preset-io 双端适配：Tauri 2 桌面走原生对话框，Web 走下载 /
		* 文件选择；成功 / 失败 / 取消都有面板内消息条提示。
		*/
		/** 4 秒自动消失的面板内消息条（左右两栏共用行为）。 */
		function useNotice() {
			const [notice, setNotice] = (0, react.useState)(null);
			const noticeTimer = (0, react.useRef)(null);
			(0, react.useEffect)(() => () => {
				if (noticeTimer.current !== null) clearTimeout(noticeTimer.current);
			}, []);
			const show = (kind, text) => {
				if (noticeTimer.current !== null) clearTimeout(noticeTimer.current);
				setNotice({
					kind,
					text
				});
				noticeTimer.current = setTimeout(() => setNotice(null), 4e3);
			};
			return {
				notice,
				show
			};
		}
		function PresetsPane({ cfg, inv, phases, t, writePatch, writeGlobal, envBlocklist }) {
			const presets = cfg.presets ?? [];
			const [name, setName] = (0, react.useState)("");
			const { notice, show } = useNotice();
			const fileRef = (0, react.useRef)(null);
			const blockedNames = new Set(cfg.sections ?? []);
			const assemblyNames = /* @__PURE__ */ new Set();
			for (const key of PART_ORDER) for (const sec of phases?.[key]?.baseSections ?? []) assemblyNames.add(sec.name);
			const mergedAll = mergeSections(inv, cfg, blockedNames);
			const merged = assemblyNames.size === 0 ? mergedAll : mergedAll.filter((sec) => sec.source === "custom" || assemblyNames.has(sec.name));
			const currentNames = new Set(merged.map((sec) => sec.name));
			const saveCurrent = () => {
				const presetName = name.trim() || `${t("preset")} ${presets.length + 1}`;
				const data = buildPresetData(cfg, merged);
				writeGlobal("presets", [...presets, {
					id: genId(),
					name: presetName,
					data
				}]);
				setName("");
			};
			const applyPreset = (preset) => {
				writePatch(applyPresetData(preset.data, cfg, currentNames));
				writeGlobal("activePreset", preset.id);
			};
			const deletePreset = (id) => {
				const next = removePreset(presets, id, cfg.activePreset);
				writeGlobal("presets", next.presets);
				if (next.activeId === void 0 && cfg.activePreset === id) writeGlobal("activePreset", void 0);
			};
			const exportPreset = async (preset) => {
				try {
					const res = await exportPresetFile(preset, void 0, envBlocklist);
					if (res.ok) show("ok", t("exportOk"));
					else if (res.cancelled) show("ok", t("exportCancel"));
					else show("error", `${t("exportFail")}${res.message ? ": " + res.message : ""}`);
				} catch (e) {
					show("error", `${t("exportFail")}: ${e instanceof Error ? e.message : String(e)}`);
				}
			};
			const importParsed = (text) => {
				try {
					const parsed = decodePresetExport(text);
					const next = addImportedPresets(presets, parsed, genId);
					const added = next.length - presets.length;
					const fresh = (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed) && Array.isArray(parsed.envBlocklist) ? (parsed.envBlocklist ?? []).filter((e) => typeof e === "string") : []).filter((e) => !envBlocklist.includes(e));
					if (fresh.length > 0) writeGlobal("envBlocklist", [...envBlocklist, ...fresh]);
					const mergedNote = fresh.length > 0 ? t("importBlockMerge", { count: fresh.length }) : "";
					if (added <= 0) show("ok", t("importNone") + mergedNote);
					else {
						writeGlobal("presets", next);
						show("ok", `${t("importOk")} (+${added})${mergedNote}`);
					}
				} catch (e) {
					show("error", `${t("importFail")}: ${e instanceof Error ? e.message : String(e)}`);
				}
			};
			const importPreset = async () => {
				try {
					const res = await importPresetFile();
					if (res.kind === "text") {
						importParsed(res.text);
						return;
					}
					if (res.kind === "cancelled") {
						show("ok", t("importCancel"));
						return;
					}
					fileRef.current?.click();
				} catch (e) {
					show("error", `${t("importFail")}: ${e instanceof Error ? e.message : String(e)}`);
				}
			};
			const onImportFile = (e) => {
				const file = e.target.files?.[0];
				e.target.value = "";
				if (!file) return;
				const reader = new FileReader();
				reader.onload = () => importParsed(String(reader.result));
				reader.onerror = () => show("error", t("importFail"));
				reader.readAsText(file);
			};
			return (0, react.createElement)("div", { style: s.colLeft }, [(0, react.createElement)("div", { style: s.colScroll }, [
				notice ? (0, react.createElement)("div", { style: notice.kind === "ok" ? s.noticeOk : s.error }, notice.text) : null,
				(0, react.createElement)("div", { style: s.groupHead }, t("libraryTitle")),
				(0, react.createElement)("div", { style: s.injectBox }, [(0, react.createElement)("div", { style: s.injectRow }, [(0, react.createElement)("input", {
					style: {
						...s.input,
						flex: 1
					},
					placeholder: t("presetName"),
					value: name,
					onChange: (e) => setName(e.target.value)
				}), (0, react.createElement)("button", {
					style: s.mini,
					onClick: saveCurrent
				}, t("save"))]), (0, react.createElement)("div", { style: s.injectRow }, [(0, react.createElement)("button", {
					style: s.mini,
					onClick: () => {
						importPreset();
					}
				}, t("import")), (0, react.createElement)("input", {
					ref: fileRef,
					type: "file",
					accept: ".json,application/json",
					style: { display: "none" },
					onChange: onImportFile
				})])]),
				presets.length === 0 ? (0, react.createElement)("div", { style: s.muted }, t("empty")) : null,
				presets.map((preset) => {
					const active = cfg.activePreset === preset.id;
					return (0, react.createElement)("div", {
						key: preset.id,
						style: s.row
					}, [
						(0, react.createElement)("div", { style: s.rowBody }, [(0, react.createElement)("div", { style: s.rowTitle }, [(0, react.createElement)("span", { style: s.code }, preset.name), active ? (0, react.createElement)("span", { style: s.badgeOk }, t("active")) : null])]),
						(0, react.createElement)("button", {
							style: s.mini,
							onClick: () => applyPreset(preset)
						}, t("apply")),
						(0, react.createElement)("button", {
							style: s.mini,
							onClick: () => {
								exportPreset(preset);
							}
						}, t("export")),
						(0, react.createElement)("button", {
							style: s.mini,
							onClick: () => deletePreset(preset.id)
						}, t("delete"))
					]);
				})
			])]);
		}
		function SettingsPane({ cfg, inv, t, writeGlobal, saveAsPreset, forkSource, onReset, envBlocklist }) {
			const [agentName, setAgentName] = (0, react.useState)("");
			const [creating, setCreating] = (0, react.useState)(false);
			const [blockInput, setBlockInput] = (0, react.useState)("");
			const createAgentPreset = async () => {
				const trimmed = agentName.trim();
				if (trimmed.length === 0 || creating) return;
				setCreating(true);
				if (await saveAsPreset(trimmed)) setAgentName("");
				setCreating(false);
			};
			const removeBlockEntry = (entry) => {
				writeGlobal("envBlocklist", envBlocklist.filter((e) => e !== entry));
			};
			const addBlockEntry = () => {
				const entry = blockInput.trim();
				setBlockInput("");
				if (entry === "" || envBlocklist.includes(entry)) return;
				writeGlobal("envBlocklist", [...envBlocklist, entry]);
			};
			return (0, react.createElement)("div", { style: s.colRight }, [(0, react.createElement)("div", { style: s.colRightScroll }, [
				(0, react.createElement)("div", { style: s.injectBox }, [
					(0, react.createElement)("div", { style: s.rowTitle }, t("saveAsPresetCard")),
					(0, react.createElement)("div", { style: s.muted }, t("saveAsPresetHint", { name: forkSource ?? t("forkSourceDefault") })),
					(0, react.createElement)("div", { style: s.injectRow }, [(0, react.createElement)("input", {
						style: {
							...s.input,
							flex: 1
						},
						placeholder: t("agentPresetName"),
						value: agentName,
						onChange: (e) => setAgentName(e.target.value)
					}), (0, react.createElement)("button", {
						style: s.mini,
						disabled: creating || agentName.trim().length === 0,
						onClick: () => {
							createAgentPreset();
						}
					}, t("saveAsPreset"))])
				]),
				(0, react.createElement)("div", { style: s.groupHead }, t("settingsTitle")),
				(0, react.createElement)("div", { style: s.injectBox }, [
					(0, react.createElement)("div", { style: s.rowTitle }, t("forceTitle")),
					(0, react.createElement)("div", { style: s.muted }, t("forceHint")),
					(0, react.createElement)("div", { style: s.injectRow }, [(0, react.createElement)("label", { style: s.switchWrap }, [(0, react.createElement)("input", {
						type: "checkbox",
						checked: cfg.forceSections !== false,
						onChange: (e) => writeGlobal("forceSections", e.target.checked)
					}), (0, react.createElement)("span", { style: cfg.forceSections !== false ? s.badgeOk : s.badgeBlocked }, cfg.forceSections !== false ? t("forceOn") : t("forceOff"))])])
				]),
				(0, react.createElement)("div", { style: s.injectBox }, [
					(0, react.createElement)("div", { style: s.rowTitle }, t("envBlockTitle")),
					(0, react.createElement)("div", { style: s.muted }, t("envBlockHint")),
					(0, react.createElement)("div", { style: {
						...s.toolWrap,
						marginTop: 6
					} }, envBlocklist.map((entry) => (0, react.createElement)("span", {
						key: entry,
						style: {
							...s.toolChip,
							display: "inline-flex",
							alignItems: "center",
							gap: 4
						}
					}, [entry, (0, react.createElement)("span", {
						style: { cursor: "pointer" },
						title: t("delete"),
						onClick: () => removeBlockEntry(entry)
					}, "×")]))),
					envBlocklist.length === 0 ? (0, react.createElement)("div", { style: s.muted }, t("envBlockEmpty")) : null,
					(0, react.createElement)("div", { style: {
						...s.injectRow,
						marginTop: 6
					} }, [(0, react.createElement)("input", {
						style: {
							...s.input,
							flex: 1
						},
						placeholder: t("envBlockAdd"),
						value: blockInput,
						onChange: (e) => setBlockInput(e.target.value)
					}), (0, react.createElement)("button", {
						style: s.mini,
						disabled: blockInput.trim() === "",
						onClick: addBlockEntry
					}, t("envBlockAddAction"))]),
					(0, react.createElement)("details", { style: { marginTop: 6 } }, [
						(0, react.createElement)("summary", { style: {
							...s.muted,
							cursor: "pointer"
						} }, `${t("envVarsTitle")} (${inv?.variables?.length ?? 0})`),
						(0, react.createElement)("div", { style: {
							...s.muted,
							marginTop: 4
						} }, t("envVarsHint")),
						(0, react.createElement)("div", { style: {
							...s.toolWrap,
							marginTop: 4
						} }, (inv?.variables ?? []).map((varName) => (0, react.createElement)("span", {
							key: varName,
							style: s.toolChip
						}, `{{${varName}}}`)))
					])
				]),
				(0, react.createElement)("div", { style: s.injectBox }, [
					(0, react.createElement)("div", { style: s.rowTitle }, t("resetTitle")),
					(0, react.createElement)("div", { style: s.muted }, t("resetHint")),
					(0, react.createElement)("div", { style: s.injectRow }, [(0, react.createElement)("button", {
						style: s.mini,
						onClick: () => {
							if (window.confirm(t("resetConfirm"))) onReset();
						}
					}, t("resetAction"))])
				])
			])]);
		}
		//#endregion
		//#region src/client/PreviewTools.tsx
		/** 工具预览：当前定制（黑名单过滤之后）最终对模型可见的工具目录，
		*  只读、清单式呈现：列出即代表模型看得见 —— 这里没有「已屏蔽」状态。
		*  本视图绝不修改黑名单配置。 */
		/** 把字符串形态的条目补全为 { name, description: '' }。 */
		function norm(tool) {
			return typeof tool === "string" ? {
				name: tool,
				description: ""
			} : tool;
		}
		function PreviewTools({ tools, t }) {
			if (tools.length === 0) return (0, react.createElement)("div", { style: s.muted }, t("empty"));
			return (0, react.createElement)("div", { style: s.list }, [(0, react.createElement)("div", { style: s.rowTitle }, [(0, react.createElement)("span", { style: s.orderTag }, `${tools.length} ${t("previewToolCount")}`)]), tools.map((tool) => {
				const { name, description } = norm(tool);
				return (0, react.createElement)("div", {
					key: name,
					style: s.row
				}, [(0, react.createElement)("div", { style: s.rowBody }, [(0, react.createElement)("div", { style: s.rowTitle }, (0, react.createElement)("span", { style: s.code }, name)), (0, react.createElement)("div", { style: s.preview }, String(description ?? "").slice(0, 140))])]);
			})]);
		}
		//#endregion
		//#region src/client/PreviewPane.tsx
		/**
		* PreviewPane — 独立面板的右栏（提示词 / 工具模式常驻）。
		*
		* 只读预览，没有任何切换控件：看提示词还是工具由顶部模式决定（选「提示词」
		* = 提示词编辑 + 提示词预览；选「工具」= 工具编辑 + 工具预览），阶段由头部
		* 的阶段按钮统一控制（与左栏联动）。数据来自 Panel 并行拉取的三阶段装配，
		* 编辑草稿后由 Panel 防抖叠加同步 —— 所见即模型所见。本视图绝不修改配置。
		*/
		function PreviewPane({ t, phases, phase, sub }) {
			const data = phases?.[phase] ?? null;
			const lossNote = data === null || data === void 0 ? null : data.takenOverBy !== void 0 ? t("sectionsTakenOver", { name: data.takenOverBy }) : data.lostSections !== void 0 ? t("sectionsLost", {
				emitted: data.lostSections.emitted,
				survived: data.lostSections.survived
			}) : null;
			return (0, react.createElement)("div", { style: s.colRight }, [(0, react.createElement)("div", { style: s.colRightScroll }, [
				lossNote !== null ? (0, react.createElement)("div", { style: s.noticeWarn }, lossNote) : null,
				data !== null && data.scopeResolved === false ? (0, react.createElement)("div", { style: s.noticeWarn }, t("scopeFallback")) : null,
				phases === null ? (0, react.createElement)("div", { style: s.muted }, t("loading")) : null,
				phases !== null && data === null ? (0, react.createElement)("div", { style: s.error }, t("previewFail")) : null,
				sub === "prompt" ? data ? [(0, react.createElement)("div", { style: s.rowTitle }, [(0, react.createElement)("span", { style: s.muted }, t("previewHint")), (0, react.createElement)("span", { style: s.orderTag }, `${data.sections.length} ${t("previewSections")}`)]), (0, react.createElement)("pre", { style: s.previewText }, data.text || t("empty"))] : null : data ? [(0, react.createElement)("div", { style: s.rowTitle }, [(0, react.createElement)("span", { style: s.muted }, t("previewToolsHint")), (0, react.createElement)("span", { style: s.orderTag }, `${data.tools.length} / ${data.registryTotal ?? "?"} ${t("previewToolsCount")}`)]), (0, react.createElement)(PreviewTools, {
					tools: data.tools,
					t
				})] : null
			])]);
		}
		//#endregion
		//#region src/client/Panel.tsx
		/**
		* Panel — 提示词管理面板（独立抽屉的根组件）。
		*
		* 拉取配置与清单、维护模式与编辑目标状态，把左右两栏装配起来：
		*  - 头部：标题 + 模式切换（提示词 / 工具 / 预设）+ 保存 / 刷新 / 关闭；
		*  - 第二行：agent 预设 Tab（全部 Agent + 各预设，点击即切换编辑目标，
		*    像宿主能力管理页的预设切换）+ 三态同步 / 中文提示词开关；
		*  - 主体分栏：左栏 = 勾选列表（提示词或工具，底部三态过滤），右栏 =
		*    最终装配预览；预设模式下左栏是快照库、右栏是全局设置。
		*
		* 配置来自插件自有 /config 路由；清单与三阶段预览来自 /inventory 与
		* /preview?phase=…。编辑只改内存草稿，由「保存」按钮经 /config/apply 一次
		* 写盘（写错的配置不点保存就不会进文件）。
		*/
		const INVENTORY_URL = "/api/prompt-customizer/inventory";
		const CONFIG_SET_URL = "/api/prompt-customizer/config/set";
		const CONFIG_UNSET_URL = "/api/prompt-customizer/config/unset";
		const CONFIG_APPLY_URL = "/api/prompt-customizer/config/apply";
		const CONFIG_RESET_URL = "/api/prompt-customizer/config/reset";
		const PRESETS_CREATE_URL = "/api/prompt-customizer/presets";
		const PREVIEW_URL = "/api/prompt-customizer/preview";
		/** 三套名义装配的共享布局：顺序固定，refresh 按此并行拉取。 */
		const VIEW_KEYS = [
			"bootstrap",
			"compaction",
			"active"
		];
		/** 编辑草稿里可能出现的字段（与服务端 /config/apply 的 APPLY_FIELDS 一致）。 */
		const DRAFT_FIELDS = [
			"sections",
			"sectionsBootstrap",
			"sectionsCompaction",
			"replace",
			"inject",
			"tools"
		];
		function Panel({ t, onClose }) {
			const [cfg, setCfg] = (0, react.useState)(null);
			const [inv, setInv] = (0, react.useState)(null);
			const [phases, setPhases] = (0, react.useState)(null);
			const [agentPresets, setAgentPresets] = (0, react.useState)([]);
			const [mode, setMode] = (0, react.useState)("sections");
			const [error, setError] = (0, react.useState)(null);
			const [version, setVersion] = (0, react.useState)(0);
			const [phase, setPhase] = (0, react.useState)("bootstrap");
			const syncSeq = (0, react.useRef)(0);
			const [target, setTarget] = (0, react.useState)(void 0);
			const [syncAll, setSyncAll] = (0, react.useState)(false);
			const [previewSub, setPreviewSub] = (0, react.useState)("prompt");
			const [draft, setDraft] = (0, react.useState)(null);
			const [saving, setSaving] = (0, react.useState)(false);
			const [flash, setFlash] = (0, react.useState)(null);
			const [flashKind, setFlashKind] = (0, react.useState)("ok");
			const flashTimer = (0, react.useRef)(null);
			const load = () => {
				fetch(`/api/prompt-customizer/config?t=${Date.now()}`).then((r) => r.json()).then((body) => {
					if (body?.ok !== true) throw new Error(body?.error ?? "config failed");
					setCfg(body.config);
					setError(null);
				}).catch((e) => setError(String(e instanceof Error ? e.message : e)));
			};
			(0, react.useEffect)(load, []);
			const refresh = () => {
				const qs = target ? `?scope=${encodeURIComponent(target)}` : "";
				const params = (phase) => `${qs}${qs ? "&" : "?"}phase=${phase}&t=${Date.now()}`;
				const grab = (phase) => fetch(PREVIEW_URL + params(phase)).then((r) => r.json()).then((body) => body?.ok === false ? null : body).catch(() => null);
				return Promise.all([...VIEW_KEYS.map(grab), fetch(INVENTORY_URL).then((r) => r.json())]).then(([boot, comp, act, inventoryData]) => {
					setPhases({
						bootstrap: boot,
						compaction: comp,
						active: act
					});
					setInv(inventoryData);
					setError(null);
				}).catch((e) => setError(String(e instanceof Error ? e.message : e)));
			};
			(0, react.useEffect)(() => {
				refresh();
			}, [target, version]);
			const syncDraftPreview = () => {
				if (draft === null || !draft.dirty) return;
				const patch = {};
				const source = draft;
				for (const field of DRAFT_FIELDS) if (Object.hasOwn(source, field)) patch[field] = source[field];
				if (Object.keys(patch).length === 0) return;
				const seq = ++syncSeq.current;
				fetch(PREVIEW_URL, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						target,
						patch,
						phase
					})
				}).then((r) => r.json()).then((body) => {
					if (body?.ok === false) throw new Error(body?.error ?? "preview failed");
					if (seq !== syncSeq.current) return;
					setPhases((prev) => prev === null ? prev : {
						...prev,
						[phase]: body
					});
					setError(null);
				}).catch((e) => {
					setError(`${t("previewSyncFail")}：${e instanceof Error ? e.message : String(e)}`);
				});
			};
			(0, react.useEffect)(() => {
				if (draft === null || !draft.dirty) return void 0;
				const timer = setTimeout(syncDraftPreview, 600);
				return () => {
					clearTimeout(timer);
				};
			}, [
				draft,
				phase,
				target
			]);
			const fetchPresets = () => {
				fetch(`/api/prompt-customizer/agent-presets?t=${Date.now()}`).then((r) => r.json()).then((body) => setAgentPresets(Array.isArray(body?.presets) ? body.presets : [])).catch(() => setAgentPresets([]));
			};
			(0, react.useEffect)(() => {
				fetchPresets();
			}, []);
			const showFlash = (text, kind = "ok") => {
				if (flashTimer.current !== null) clearTimeout(flashTimer.current);
				setFlash(text);
				setFlashKind(kind);
				flashTimer.current = setTimeout(() => setFlash(null), 3200);
			};
			const clearDraft = () => {
				syncSeq.current += 1;
				setDraft(null);
			};
			if (cfg === null) return (0, react.createElement)("div", { style: {
				...s.pRoot,
				padding: 16
			} }, t("loading"));
			const base = editView(cfg, target);
			const view = draft ? {
				...base,
				sections: draft.sections ?? base.sections,
				sectionsBootstrap: draft.sectionsBootstrap ?? base.sectionsBootstrap,
				sectionsCompaction: draft.sectionsCompaction ?? base.sectionsCompaction,
				replace: draft.replace ?? base.replace,
				inject: draft.inject ?? base.inject,
				tools: draft.tools ?? base.tools
			} : base;
			const writeField = (field, value) => {
				fetch(value === void 0 ? CONFIG_UNSET_URL : CONFIG_SET_URL, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						field,
						value
					})
				}).then((r) => r.json()).then((body) => {
					if (body?.ok !== true) throw new Error(body?.error ?? "write failed");
					setCfg(body.config);
					setError(null);
					setVersion((n) => n + 1);
				}).catch((e) => setError(String(e instanceof Error ? e.message : e)));
			};
			const edit = (field, value) => {
				setDraft((d) => ({
					...d ?? { dirty: false },
					[field]: value,
					dirty: true
				}));
			};
			const save = () => {
				if (draft === null || saving) return;
				const EDITED_FIELDS = [
					"sections",
					"sectionsBootstrap",
					"sectionsCompaction",
					"replace",
					"inject",
					"tools"
				];
				const patch = {};
				for (const field of EDITED_FIELDS) if (Object.hasOwn(draft, field)) patch[field] = draft[field];
				setSaving(true);
				fetch(CONFIG_APPLY_URL, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						target,
						patch
					})
				}).then((r) => r.json()).then((body) => {
					if (body?.ok !== true) throw new Error(body?.error ?? "save failed");
					setCfg(body.config);
					clearDraft();
					setError(null);
					setVersion((n) => n + 1);
					showFlash(t("saveOk"));
				}).catch((e) => setError(`${t("saveFail")}: ${e instanceof Error ? e.message : String(e)}`)).finally(() => setSaving(false));
			};
			const writePatch = (patch) => {
				fetch(CONFIG_APPLY_URL, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						target,
						patch
					})
				}).then((r) => r.json()).then((body) => {
					if (body?.ok !== true) throw new Error(body?.error ?? "apply failed");
					setCfg(body.config);
					setError(null);
					setVersion((n) => n + 1);
				}).catch((e) => setError(String(e instanceof Error ? e.message : e)));
			};
			const writeGlobal = writeField;
			const zhOn = zhApplied(view, ZH_SECTIONS);
			const toggleZh = () => {
				if (phases === null || phases.bootstrap === null || phases.active === null || phases.compaction === null) {
					showFlash(t("zhNotReady"), "err");
					return;
				}
				edit("inject", zhOn ? zhRevertInjectEntries(view, phases, ZH_SECTIONS) : zhMergedInjectEntries(view, phases, ZH_SECTIONS));
				showFlash(zhOn ? t("zhReverted") : t("zhApplied"));
			};
			const resetAll = () => {
				fetch(CONFIG_RESET_URL, {
					method: "POST",
					headers: { "content-type": "application/json" }
				}).then((r) => r.json()).then((body) => {
					if (body?.ok !== true) throw new Error(body?.error ?? "reset failed");
					setCfg(body.config);
					clearDraft();
					setError(null);
					setVersion((n) => n + 1);
					showFlash(t("resetOk"));
				}).catch((e) => setError(`${t("resetFail")}: ${e instanceof Error ? e.message : String(e)}`));
			};
			const switchMode = (next) => {
				if ((mode === "sections" || mode === "tools") && next === "presets") {
					if (draft?.dirty && !window.confirm(t("discardConfirm"))) return;
					clearDraft();
				}
				setMode(next);
				setPreviewSub(next === "tools" ? "tools" : "prompt");
			};
			const switchTarget = (next) => {
				if (draft?.dirty && !window.confirm(t("discardConfirm"))) return;
				clearDraft();
				setTarget(next);
			};
			const saveAsPreset = (presetName) => {
				const name = presetName.trim();
				if (name.length === 0) return Promise.resolve(false);
				return fetch(PRESETS_CREATE_URL, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						name,
						from: target,
						config: {
							sections: view.sections ?? [],
							sectionsBootstrap: view.sectionsBootstrap ?? [],
							sectionsCompaction: view.sectionsCompaction ?? [],
							replace: view.replace ?? {},
							inject: view.inject ?? [],
							tools: view.tools ?? {}
						}
					})
				}).then((r) => r.json()).then((body) => {
					if (body?.ok !== true) throw new Error(body?.error ?? t("saveAsPresetFail"));
					load();
					fetchPresets();
					showFlash(t("saveAsPresetOk"), "ok");
					return true;
				}).catch((e) => {
					showFlash(`${t("saveAsPresetFail")}：${String(e instanceof Error ? e.message : e)}`, "err");
					return false;
				});
			};
			const modeBtn = (key, label) => (0, react.createElement)("button", {
				key,
				style: mode === key ? s.segBtnActive : s.segBtn,
				onClick: () => switchMode(key)
			}, label);
			const stageLabel = (key) => key === "bootstrap" ? t("phaseStageGuide") : key === "compaction" ? t("phaseStageControlled") : t("phaseStageResident");
			const draftDirty = draft?.dirty === true;
			const targetTab = (id, label, broken) => (0, react.createElement)("button", {
				key: id ?? "__global__",
				style: target === id ? s.targetTabActive : s.targetTab,
				onClick: () => switchTarget(id),
				title: broken !== void 0 && broken !== "" ? `${label} — ${t("broken")}` : id === void 0 ? t("targetHint") : label
			}, [label, broken !== void 0 && broken !== "" ? (0, react.createElement)("span", { style: s.badgeBlocked }, t("broken")) : null]);
			return (0, react.createElement)("div", { style: s.pRoot }, [
				(0, react.createElement)("div", { style: s.head }, [
					(0, react.createElement)("span", { style: s.headTitle }, [(0, react.createElement)("svg", {
						width: 16,
						height: 16,
						viewBox: "0 0 24 24",
						fill: "none",
						stroke: "currentColor",
						strokeWidth: 1.8,
						strokeLinecap: "round",
						strokeLinejoin: "round",
						"aria-hidden": "true",
						style: { flex: "none" }
					}, [
						(0, react.createElement)("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }),
						(0, react.createElement)("path", { d: "M14 2v6h6" }),
						(0, react.createElement)("path", { d: "M16 13H8" }),
						(0, react.createElement)("path", { d: "M16 17H8" }),
						(0, react.createElement)("path", { d: "M10 9H8" })
					]), t("nav")]),
					(0, react.createElement)("div", { style: s.seg }, [
						modeBtn("sections", t("tabsSections")),
						modeBtn("tools", t("tabsTools")),
						modeBtn("presets", t("tabsPresets"))
					]),
					(0, react.createElement)("div", { style: s.headActions }, [
						mode === "sections" || mode === "tools" ? (0, react.createElement)("div", { style: s.seg }, VIEW_KEYS.map((key) => (0, react.createElement)("button", {
							key,
							style: phase === key ? s.segBtnActive : s.segBtn,
							onClick: () => setPhase(key)
						}, stageLabel(key)))) : null,
						draftDirty && (mode === "sections" || mode === "tools") ? (0, react.createElement)("span", {
							style: s.badgeReplaced,
							title: t("draftBadge")
						}, t("draftBadge")) : null,
						mode === "sections" || mode === "tools" ? (0, react.createElement)("label", {
							style: {
								...s.muted,
								display: "inline-flex",
								alignItems: "center",
								gap: 4,
								cursor: "pointer",
								whiteSpace: "nowrap"
							},
							title: t("syncAllPhasesHint")
						}, [(0, react.createElement)("input", {
							type: "checkbox",
							checked: syncAll,
							onChange: (e) => setSyncAll(e.target.checked),
							style: {
								margin: 0,
								cursor: "pointer"
							}
						}), t("syncAllPhases")]) : null,
						mode === "sections" ? (0, react.createElement)("label", {
							style: {
								...s.muted,
								display: "inline-flex",
								alignItems: "center",
								gap: 4,
								cursor: "pointer",
								whiteSpace: "nowrap"
							},
							title: t("zhHint")
						}, [(0, react.createElement)("input", {
							type: "checkbox",
							checked: zhOn,
							onChange: toggleZh,
							style: {
								margin: 0,
								cursor: "pointer"
							}
						}), t("zhSwitch")]) : null,
						(0, react.createElement)("button", {
							style: draft?.dirty ? s.saveBtnDirty : s.saveBtn,
							disabled: !draft?.dirty || saving,
							onClick: save
						}, t("save")),
						(0, react.createElement)("button", {
							style: s.saveBtn,
							onClick: () => {
								refresh().then(() => syncDraftPreview());
							}
						}, t("refresh")),
						(0, react.createElement)("button", {
							style: s.iconBtn,
							onClick: onClose,
							"aria-label": t("close"),
							title: t("close")
						}, (0, react.createElement)("svg", {
							width: 15,
							height: 15,
							viewBox: "0 0 16 16",
							fill: "none",
							"aria-hidden": "true"
						}, [(0, react.createElement)("path", {
							d: "M4 4l8 8M12 4l-8 8",
							stroke: "currentColor",
							strokeWidth: 1.6,
							strokeLinecap: "round"
						})]))
					])
				]),
				(0, react.createElement)("div", { style: s.subhead }, [(0, react.createElement)("div", { style: s.targetRow }, [targetTab(void 0, t("targetAllTab")), ...agentPresets.map((p) => targetTab(p.id, p.name, p.broken))])]),
				(0, react.createElement)("div", { style: { padding: "0 14px" } }, [
					error ? (0, react.createElement)("div", { style: s.error }, String(error)) : null,
					flash ? (0, react.createElement)("div", { style: flashKind === "err" ? s.error : s.noticeOk }, flash) : null,
					target && agentPresets.find((p) => p.id === target)?.broken ? (0, react.createElement)("div", { style: s.error }, t("brokenPreset")) : null,
					inv?.scopeResolved === false && mode !== "presets" ? (0, react.createElement)("div", { style: s.noticeWarn }, t("scopeFallback")) : null
				]),
				(0, react.createElement)("div", {
					key: "body",
					style: s.body
				}, mode === "sections" ? [(0, react.createElement)(SectionsPane, {
					key: "sections",
					cfg: view,
					inv,
					phases,
					phase,
					syncAll,
					t,
					write: edit
				}), (0, react.createElement)(PreviewPane, {
					key: "preview",
					t,
					phases,
					phase,
					sub: previewSub
				})] : mode === "tools" ? [(0, react.createElement)(ToolsPane, {
					key: "tools",
					cfg: view,
					inv,
					phases,
					phase,
					syncAll,
					t,
					write: edit
				}), (0, react.createElement)(PreviewPane, {
					key: "preview",
					t,
					phases,
					phase,
					sub: previewSub
				})] : [(0, react.createElement)(PresetsPane, {
					key: "presets",
					cfg: view,
					inv,
					phases,
					t,
					writePatch,
					writeGlobal,
					envBlocklist: cfg.envBlocklist ?? []
				}), (0, react.createElement)(SettingsPane, {
					key: "settings",
					cfg: view,
					inv,
					t,
					writeGlobal,
					saveAsPreset,
					forkSource: target ? agentPresets.find((p) => p.id === target)?.name ?? target : void 0,
					onReset: resetAll,
					envBlocklist: cfg.envBlocklist ?? []
				})])
			]);
		}
		//#endregion
		//#region src/client/error-boundary.tsx
		/**
		* error-boundary — 把「面板渲染崩溃」关进笼子。
		*
		* 侧边栏入口是 createRoot 挂出来的独立 React 根，React 18 对渲染期异常的
		* 默认处理是卸载整个根——面板里一个组件抛错，导航行按钮会跟着一起消失。
		* 因此面板单独包一层：崩了只收起面板，导航按钮照常留着，真实错误打到控制台。
		*/
		/** 只兜渲染/生命周期异常的错误边界（不兜事件回调与异步）。 */
		var ErrorBoundary = class extends react.Component {
			state = { error: null };
			static getDerivedStateFromError(error) {
				return { error };
			}
			componentDidCatch(error, info) {
				console.error(`[dsh-prompt-customizer] ${this.props.label} 渲染崩溃：`, error, info.componentStack ?? "");
				try {
					this.props.onError?.(error);
				} catch (callbackError) {
					console.error("[dsh-prompt-customizer] 错误边界回调失败：", callbackError);
				}
			}
			render() {
				if (this.state.error !== null) return this.props.fallback ?? null;
				return this.props.children;
			}
		};
		//#endregion
		//#region src/client/nav.tsx
		/**
		* nav — 侧边栏导航入口（独立于设置栏的面板入口）。
		*
		* 在 sidebar 底部的「设置」行（`[data-slot="sidebar.settings"]`，harness
		* SidebarRoot 的稳定插槽）正上方插一个 host，host 内放一个 `data-nav-slot`
		* 槽位容器；入口组件经 `useNavSlot` 轮询拿到槽位后 `createPortal` 进去。
		* 选底部而不选工作区上方：顶部区域是插件抢座重灾区（任务看板等组件都往
		* 新会话/工作区一带插），settings 插槽由宿主自有渲染树持有，没人争。
		*
		* host 是手工插进 DSH 自有 React 树的裸节点（React 不认识它），因此用
		* MutationObserver 盯父节点补位 + 低频轮询兜底重挂（HMR、React 重建侧边栏
		* 时入口不会消失）。
		*
		* rail 折叠态由 `useRail` 观察框架容器的 `data-sidebar-collapsed` 属性切换，
		* 折叠时按钮收缩为图标。
		*
		* 结构与 dsh-triad 的 sidebar-nav 同款（各自独立创建 host，互不依赖）。
		*/
		/** nav host id（本模块创建）。 */
		const HOST_ID = "dsh-prompt-customizer-nav-host";
		/** slots 渲染器的稳定锚点（SidebarRoot 暴露的 `sidebar.settings` slot）。 */
		const ANCHOR_SELECTOR = "[data-slot=\"sidebar.settings\"]";
		/** 侧边栏折叠观察：框架容器选择在所有 sidebar 状态（wide/rail）下都唯一。 */
		const FRAME_SELECTOR = "div:has(> [data-shell-overlay])";
		/** 建一个槽位容器（portal 目标）。 */
		function makeSlot(name) {
			const slot = document.createElement("div");
			slot.dataset.navSlot = name;
			return slot;
		}
		let started = false;
		let pollTimer = 0;
		let hostObserver;
		/** 确保 host 已创建并插到 `sidebar.settings` slot 之前（幂等）。 */
		function ensureHostPlaced() {
			const anchor = document.querySelector(ANCHOR_SELECTOR);
			if (anchor === null) return false;
			const parent = anchor.parentElement;
			if (parent === null) return false;
			let host = document.getElementById(HOST_ID);
			if (host === null) {
				host = document.createElement("div");
				host.id = HOST_ID;
				host.dataset.plugin = "dsh-prompt-customizer";
				host.appendChild(makeSlot("prompt"));
			}
			if (!(host.parentElement === parent && (anchor.compareDocumentPosition(host) & Node.DOCUMENT_POSITION_PRECEDING) !== 0)) parent.insertBefore(host, anchor);
			return true;
		}
		/**
		* 盯住宿主的直接父节点，宿主一被摘掉立刻补位。
		*
		* host 是手工 insertBefore 进 DSH 自有 React 树的裸节点——侧边栏任何一次
		* children 重排都可能把它回收掉。只观察父节点的 childList（不开 subtree）；
		* 父节点整体被替换时观察会失联，由轮询兜底重挂。补位后 ensureHostPlaced
		* 不再改动 DOM，不会自激。
		*/
		function watchHostParent() {
			const parent = document.getElementById(HOST_ID)?.parentElement;
			if (parent === void 0 || parent === null) return;
			hostObserver?.disconnect();
			hostObserver = new MutationObserver(() => {
				const before = document.getElementById(HOST_ID)?.parentElement;
				ensureHostPlaced();
				if (document.getElementById(HOST_ID)?.parentElement !== before) watchHostParent();
			});
			hostObserver.observe(parent, { childList: true });
		}
		/**
		* 挂载导航区 host（幂等单例）。首次调用者持有清理权（停轮询、移除 host），
		* 后续调用返回 no-op。
		*/
		function ensureNavMount() {
			if (typeof document === "undefined") return () => {};
			if (started) return () => {};
			started = true;
			ensureHostPlaced();
			watchHostParent();
			pollTimer = window.setInterval(() => {
				ensureHostPlaced();
				if (hostObserver === void 0) watchHostParent();
			}, 1500);
			return () => {
				window.clearInterval(pollTimer);
				pollTimer = 0;
				hostObserver?.disconnect();
				hostObserver = void 0;
				started = false;
				document.getElementById(HOST_ID)?.remove();
			};
		}
		/** 轮询获取指定槽位容器（未就位时返回 null，组件据此暂不渲染）。
		*
		* **永不停止**：未就位时 100ms 阶梯快查（10 次后退 400ms）；找到后退化为
		* 800ms 慢速校验——同一节点 setSlot 被 React 直接跳过，零渲染开销。这样
		* 槽位一旦被移除/替换（HMR、React 重建 host），portal 会自动迁到新槽。
		*/
		function useNavSlot(name) {
			const [slot, setSlot] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				let timer = 0;
				let tries = 0;
				const poll = () => {
					const found = document.querySelector(`[data-nav-slot='${name}']`);
					if (found !== null) tries = 0;
					else tries += 1;
					setSlot(found);
					timer = window.setTimeout(poll, found !== null ? 800 : tries <= 10 ? 100 : 400);
				};
				poll();
				return () => {
					window.clearTimeout(timer);
				};
			}, [name]);
			return slot;
		}
		/** 侧边栏折叠态（rail = 只显示图标）。
		*
		* 观察 body 子树的 data-sidebar-collapsed（框架容器可能在折叠时被 React
		* 重挂，盯单节点会失联）+ 低频兜底重读。值不变时 React 自动跳过渲染。
		*/
		function useRail() {
			const [rail, setRail] = (0, react.useState)(() => document.querySelector(FRAME_SELECTOR)?.hasAttribute("data-sidebar-collapsed") ?? false);
			(0, react.useEffect)(() => {
				const read = () => {
					setRail(document.querySelector(FRAME_SELECTOR)?.hasAttribute("data-sidebar-collapsed") ?? false);
				};
				read();
				const observer = new MutationObserver(read);
				observer.observe(document.body, {
					attributes: true,
					attributeFilter: ["data-sidebar-collapsed"],
					subtree: true
				});
				const timer = window.setInterval(read, 1500);
				return () => {
					observer.disconnect();
					window.clearInterval(timer);
				};
			}, []);
			return rail;
		}
		const STYLE_ID$1 = "dsh-prompt-customizer-nav-styles";
		const SHEET$1 = `
/* 导航行：与侧边栏原生行同款几何（透明底 + hover 高亮 + 文字省略） */
.dsh-pc-nav-btn{position:relative;display:flex;align-items:center;gap:8px;width:calc(100% - 4px);height:34px;padding:0 10px;margin:0 2px 4px;box-sizing:border-box;border:none;border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary,#eee);font-size:14px;line-height:20px;font-family:inherit;cursor:pointer;text-align:left;user-select:none;overflow:hidden;transition:background 120ms ease}
.dsh-pc-nav-btn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
.dsh-pc-nav-btn[data-open='true']{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
.dsh-pc-nav-btn>svg{flex:none;color:var(--dsw-alias-label-secondary,#bbb)}
.dsh-pc-nav-label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* 折叠 rail 态：只留图标 */
.dsh-pc-nav-btn[data-rail='true']{width:36px;height:36px;padding:0;margin:0 0 8px;justify-content:center;border-radius:8px}
/* nav host：槽位 display:contents，按钮直接撑满整行。 */
#dsh-prompt-customizer-nav-host{display:flex;flex-direction:column;align-items:stretch;width:100%}
#dsh-prompt-customizer-nav-host>[data-nav-slot]{display:contents}
`;
		/** 注入导航行样式（幂等）。 */
		function ensureNavStyles() {
			if (typeof document === "undefined") return;
			if (document.getElementById(STYLE_ID$1) !== null) return;
			const tag = document.createElement("style");
			tag.id = STYLE_ID$1;
			tag.dataset.plugin = "dsh-prompt-customizer";
			tag.textContent = SHEET$1;
			document.head.appendChild(tag);
		}
		/** 渲染一条导航行按钮。 */
		function NavButton({ icon, label, rail = false, expanded = false, ariaLabel, onClick }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "dsh-pc-nav-btn",
				"data-rail": rail || void 0,
				"data-open": expanded || void 0,
				"aria-label": ariaLabel ?? label,
				"aria-expanded": expanded,
				title: rail ? ariaLabel ?? label : void 0,
				onClick,
				children: [icon, !rail && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: "dsh-pc-nav-label",
					children: label
				})]
			});
		}
		/** 便捷组合：portal 到指定槽位（slot 未就位时不渲染）。 */
		function NavPortal({ name, children }) {
			const slot = useNavSlot(name);
			if (slot === null) return null;
			return (0, react_dom.createPortal)(children, slot);
		}
		/** 面板互斥 + 切会话自动收（与 dsh-triad 的面板互相礼让）。
		*
		*  - 互斥：打开时广播自己的事件，并监听本插件与 dsh-triad 的同类广播，
		*    别的面板打开时自动收回（主区同时只被一个面板占住）；
		*  - 切会话自动收：面板盖住会话主区、无遮罩，侧栏保持可点；侧栏会话区内
		*    的点击（自己导航行与面板本体除外）直接收面板。
		*/
		const PANEL_OPEN_EVENT = "dsh-prompt-customizer:panel-open";
		/** dsh-triad 的面板广播（装了 triad 时互相礼让；detail 永远不等于本插件名）。 */
		const TRIAD_PANEL_OPEN_EVENT = "dsh-triad:panel-open";
		/** 点击是否落在侧栏列内（按几何判定，不依赖宿主的哈希类名）。 */
		function clickInSidebar(target) {
			let node = target;
			while (node !== null && node !== document.body) {
				const rect = node.getBoundingClientRect();
				if (rect.height >= window.innerHeight * .7 && rect.left <= 8 && rect.right <= window.innerWidth * .6) return true;
				node = node.parentElement;
			}
			return false;
		}
		function usePanelAutoClose(open, requestClose) {
			(0, react.useEffect)(() => {
				if (!open) return;
				window.dispatchEvent(new CustomEvent(PANEL_OPEN_EVENT, { detail: "prompt-customizer" }));
			}, [open]);
			(0, react.useEffect)(() => {
				if (!open) return void 0;
				const onSiblingOpen = (event) => {
					if (event.detail !== "prompt-customizer") requestClose();
				};
				const onDocClick = (event) => {
					const target = event.target;
					if (!(target instanceof Element)) return;
					if (target.closest(`#${HOST_ID}, .pcsh-card`) !== null) return;
					if (clickInSidebar(target)) requestClose();
				};
				window.addEventListener(PANEL_OPEN_EVENT, onSiblingOpen);
				window.addEventListener(TRIAD_PANEL_OPEN_EVENT, onSiblingOpen);
				document.addEventListener("click", onDocClick, true);
				return () => {
					window.removeEventListener(PANEL_OPEN_EVENT, onSiblingOpen);
					window.removeEventListener(TRIAD_PANEL_OPEN_EVENT, onSiblingOpen);
					document.removeEventListener("click", onDocClick, true);
				};
			}, [open, requestClose]);
		}
		//#endregion
		//#region src/client/shell.tsx
		/**
		* shell — 「覆盖会话主区」的面板外壳（提示词管理面板）。
		*
		* 跟点会话一致的行为（与 dsh-triad 的 popover-shell 同款交互，各自独立实现）：
		*  - drawer 模式：直接盖住会话主区（侧栏右缘 → 视口右缘，全高，无遮罩），
		*    自右向左滑入，关闭反向收回；侧栏保持可点，随时切会话（切会话自动收面板）；
		*  - 窄视口回退全屏 sheet（上滑入场，带遮罩）；
		*  - Esc 关闭走 props.onClose。
		*
		* z 层级：mask 999 / card 1000——与宿主 Modal 同层；面板内部 portal 到 body
		* 的二级弹窗 DOM 顺序更靠后，自然浮于本壳之上。
		*/
		const STYLE_ID = "dsh-prompt-customizer-shell-styles";
		/** 会话主区左缘回退值（px）：侧栏实测失败时盖住 280px 右侧全部区域。 */
		const FALLBACK_MAIN_LEFT = 280;
		/** 窄屏阈值（px）：低于该宽度回退全屏 sheet。 */
		const NARROW_VP = 768;
		/** 读会话主区左缘 = 侧栏列右缘（跟随侧栏折叠变化；失败回退 280）。 */
		function readMainLeft() {
			try {
				const host = document.getElementById("dsh-prompt-customizer-nav-host");
				if (host !== null) {
					const hostRight = host.getBoundingClientRect().right;
					let node = host.parentElement;
					while (node !== null && node !== document.body) {
						const rect = node.getBoundingClientRect();
						if (rect.height >= window.innerHeight * .7 && rect.left <= 8 && rect.right >= hostRight - 4) return Math.round(rect.right);
						node = node.parentElement;
					}
				}
			} catch {}
			return FALLBACK_MAIN_LEFT;
		}
		const SHEET = `
@keyframes pc-modal-drawer-in{from{opacity:0;transform:translateX(56px)}to{opacity:1;transform:translateX(0)}}
@keyframes pc-modal-drawer-out{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(40px)}}
@keyframes pc-modal-slide-in{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes pc-modal-slide-out{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(24px)}}
@keyframes pc-modal-mask-in{from{opacity:0}to{opacity:1}}
@keyframes pc-modal-mask-out{from{opacity:1}to{opacity:0}}
/* ── 遮罩：淡入淡出（仅窄屏 sheet 模式有遮罩） ── */
.pcsh-mask{position:fixed;inset:0;z-index:999;background:var(--dsw-alias-bg-mask-1,rgba(0,0,0,.45))}
.pcsh-mask[data-anim='in']{animation:pc-modal-mask-in 240ms ease both}
.pcsh-mask[data-anim='out']{animation:pc-modal-mask-out 240ms ease both}
/* ── 卡片：会话式右侧抽屉 / 窄屏全屏 sheet 回退 ── */
.pcsh-card{position:fixed;z-index:1000;display:flex;flex-direction:column;box-sizing:border-box;background:var(--dsw-specific-menu,var(--dsw-alias-bg-layer-2,#16181d));color:var(--dsw-alias-label-primary,#eee);overflow:hidden}
.pcsh-card[data-mode='drawer']{top:0;right:0;bottom:0;height:100vh;height:100dvh;border:none;border-left:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.18));box-shadow:none;transition:left 240ms cubic-bezier(.2,.8,.2,1)}
/* in 动画不得带 fill-mode（both/forwards 会残留 to 帧 transform，使卡片成为
   后代 position:fixed 元素的包含块）；out 需要 forwards 保持隐藏态直到卸载。 */
.pcsh-card[data-mode='drawer'][data-anim='in']{animation:pc-modal-drawer-in 240ms cubic-bezier(.2,.8,.2,1)}
.pcsh-card[data-mode='drawer'][data-anim='out']{animation:pc-modal-drawer-out 240ms cubic-bezier(.4,0,.2,1) both}
.pcsh-card[data-mode='sheet'][data-anim='in']{animation:pc-modal-slide-in 240ms cubic-bezier(.2,.8,.2,1)}
.pcsh-card[data-mode='sheet'][data-anim='out']{animation:pc-modal-slide-out 240ms cubic-bezier(.4,0,.2,1) both}
/* ── 窄屏：任何模式强制全屏 sheet（!important 压过内联 left/width）。 ── */
@media (max-width: 767.98px){
  .pcsh-card{
    left:0 !important;top:0 !important;right:auto !important;bottom:auto !important;
    width:100vw !important;max-width:100vw !important;
    height:100vh !important;height:100dvh !important;max-height:100vh !important;max-height:100dvh !important;
    border-radius:0 !important;transform:none !important;
  }
}
@media (prefers-reduced-motion:reduce){
  .pcsh-mask,.pcsh-card{animation:none!important}
  .pcsh-card{transition:none!important}
}
`;
		/** 注入外壳样式（幂等）。 */
		function ensureShellStyles() {
			if (typeof document === "undefined") return;
			if (document.getElementById(STYLE_ID) !== null) return;
			const tag = document.createElement("style");
			tag.id = STYLE_ID;
			tag.dataset.plugin = "dsh-prompt-customizer";
			tag.textContent = SHEET;
			document.head.appendChild(tag);
		}
		/** 渲染覆盖会话主区的抽屉面板（portal 到 body；窄屏回退全屏 sheet + 遮罩）。 */
		function PanelShell({ closing, onClose, ariaLabel, children }) {
			const [vw, setVw] = (0, react.useState)(window.innerWidth);
			const [mainLeft, setMainLeft] = (0, react.useState)(readMainLeft);
			(0, react.useEffect)(() => {
				const reread = () => {
					setVw(window.innerWidth);
					setMainLeft(readMainLeft());
				};
				reread();
				window.addEventListener("resize", reread);
				const observer = new MutationObserver(reread);
				observer.observe(document.body, {
					attributes: true,
					attributeFilter: ["data-sidebar-collapsed"],
					subtree: true
				});
				const timer = window.setInterval(reread, 1500);
				return () => {
					window.removeEventListener("resize", reread);
					observer.disconnect();
					window.clearInterval(timer);
				};
			}, []);
			const anim = closing ? "out" : "in";
			const narrow = vw < NARROW_VP;
			const mode = narrow ? "sheet" : "drawer";
			const style = narrow ? void 0 : { left: mainLeft };
			(0, react.useEffect)(() => {
				if (closing) return void 0;
				const onKey = (event) => {
					if (event.key === "Escape") onClose();
				};
				document.addEventListener("keydown", onKey);
				return () => {
					document.removeEventListener("keydown", onKey);
				};
			}, [closing, onClose]);
			return (0, react_dom.createPortal)(/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [narrow && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "pcsh-mask",
				"data-anim": anim,
				"aria-hidden": "true",
				onClick: onClose
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "pcsh-card",
				"data-anim": anim,
				"data-mode": mode,
				style,
				role: "dialog",
				"aria-modal": "true",
				"aria-label": ariaLabel,
				children
			})] }), document.body);
		}
		/**
		* 面板关闭动画状态机：先置 closing 播放收回动画，结束后再真正 onClose。
		* `open` 再次变 true 时重置 closing（否则上一次收回动画会把 closing 卡在 true）。
		*/
		function usePanelClose(open, onClose, durationMs = 240) {
			const [closing, setClosing] = (0, react.useState)(false);
			(0, react.useEffect)(() => {
				if (open) setClosing(false);
			}, [open]);
			(0, react.useEffect)(() => {
				if (!closing) return void 0;
				const timer = window.setTimeout(() => onClose(), durationMs);
				return () => {
					window.clearTimeout(timer);
				};
			}, [
				closing,
				onClose,
				durationMs
			]);
			const requestClose = () => setClosing(true);
			return {
				closing,
				requestClose
			};
		}
		//#endregion
		//#region src/client/index.ts
		/**
		* dsh-prompt-customizer — 浏览器端（TypeScript 源码）。
		*
		* 在侧边栏注册一个「提示词」入口按钮（不再挤在设置栏里），点击打开覆盖
		* 会话主区的「提示词管理」面板：左栏勾选提示词 / 工具，右栏实时预览最终
		* 装配；顶部 Tab 切换 agent 预设（编辑目标）。面板从宿主的
		* `/api/prompt-customizer/inventory` 拉取当前生效的段 / 工具清单，屏蔽、
		* 替换、注入提示词段并隐藏工具；所有写入走插件自有路由（宿主端的
		* config.yaml），保存按钮一次落盘。
		*
		* 由 tsdown 打包为 client/client.js（__ModuleLoader__ factory bundle）；
		* 外部依赖只有 loader 模块表中的 react 入口。
		*/
		const NS = "prompt-customizer";
		const name = "prompt-customizer";
		const inject = ["locale"];
		/** 提示词入口：导航行按钮 + 点击打开覆盖主区的面板。 */
		function PromptEntry({ t }) {
			const [open, setOpen] = (0, react.useState)(false);
			const { closing, requestClose } = usePanelClose(open, () => {
				setOpen(false);
			});
			const rail = useRail();
			usePanelAutoClose(open, requestClose);
			return (0, react.createElement)("div", null, [(0, react.createElement)(NavButton, {
				icon: (0, react.createElement)("svg", {
					width: rail ? 18 : 16,
					height: rail ? 18 : 16,
					viewBox: "0 0 24 24",
					fill: "none",
					stroke: "currentColor",
					strokeWidth: 1.8,
					strokeLinecap: "round",
					strokeLinejoin: "round",
					"aria-hidden": "true"
				}, [
					(0, react.createElement)("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }),
					(0, react.createElement)("path", { d: "M14 2v6h6" }),
					(0, react.createElement)("path", { d: "M16 13H8" }),
					(0, react.createElement)("path", { d: "M16 17H8" }),
					(0, react.createElement)("path", { d: "M10 9H8" })
				]),
				label: t("navShort"),
				rail,
				expanded: open,
				onClick: () => {
					setOpen(true);
				}
			}), open ? (0, react.createElement)(ErrorBoundary, {
				key: "panel",
				label: "提示词管理面板",
				fallback: null,
				onError: () => requestClose(),
				children: (0, react.createElement)(PanelShell, {
					closing,
					onClose: requestClose,
					ariaLabel: t("nav"),
					children: (0, react.createElement)(Panel, {
						t,
						onClose: requestClose
					})
				})
			}) : null]);
		}
		/** 导航行应用：入口 portal 到自建 nav host 的槽位。 */
		function PromptNavApp({ t }) {
			return (0, react.createElement)("div", null, (0, react.createElement)(NavPortal, {
				name: "prompt",
				children: (0, react.createElement)(PromptEntry, { t })
			}));
		}
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, DICT), "prompt-customizer: locale");
			const t = ctx.locale.bind(NS);
			ctx.effect(() => {
				ensureNavMount();
				ensureNavStyles();
				ensureShellStyles();
				const holder = document.createElement("div");
				const root = (0, react_dom_client.createRoot)(holder);
				root.render((0, react.createElement)(PromptNavApp, { t }));
				return () => {
					root.unmount();
				};
			}, "prompt-customizer: sidebar nav entry");
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map
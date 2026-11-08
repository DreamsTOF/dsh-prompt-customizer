import Schema from './schemastery.mjs'
import { PHASES } from './model.js'

/** 本插件的设置命名空间（小写 kebab-case）。 */
export const NS = 'prompt-customizer'

/** name+source 条目身份：source 是注册层，id 是预设/会话/provider 标识。 */
const SourceSchema = Schema.object({
  kind: Schema.string().required(),
  id: Schema.string(),
}).default(undefined)
const Entry = Schema.object({
  name: Schema.string().required(),
  source: SourceSchema,
})
const entryList = () => Schema.array(Entry).default([])
const InjectItem = Schema.object({
  name: Schema.string().required(),
  source: SourceSchema,
  order: Schema.number().default(120),
  text: Schema.string().required(),
  phase: Schema.string().default('always'),
  custom: Schema.boolean().default(false),
})
const ReplaceItem = Schema.object({
  name: Schema.string().required(),
  source: SourceSchema,
  phase: Schema.string().default('always'),
  text: Schema.string().required(),
})
const toolList = () => Schema.array(Entry).default([])
const toolObject = () => {
  const phaseTools = Object.fromEntries(PHASES.filter((phase) => phase.toolField !== undefined).map((phase) => [phase.toolField, Schema.object({
    exclude: toolList(),
    add: toolList(),
  }).default({})]))
  return Schema.object({
    exclude: toolList(),
    add: toolList(),
    ...phaseTools,
  }).default({})
}

/** 一份 override 的完整字段集，由 PHASES 唯一表生成（不再三份手抄）。 */
function overrideShape() {
  const phaseFields = Object.fromEntries(PHASES.flatMap((phase) => [
    [phase.sectionField, entryList()],
    [phase.contextField, entryList()],
  ]))
  return {
    ...phaseFields,
    replacements: Schema.array(ReplaceItem).default([]),
    inject: Schema.array(InjectItem).default([]),
    tools: toolObject(),
  }
}

/**
 * 插件配置。提示词定制只存在于 overrides[预设 id] 与 workspaceOverrides[cwd]；
 * 顶层保留 forceSections / envBlocklist / 预设快照库这些全局字段。
 */
const ConfigObject = Schema.object({
  ...overrideShape(),
  // 强制覆盖（默认开）：从注册表重建最终提示词段，避免预设插件的阶段裁段/complete 接管。
  forceSections: Schema.boolean().default(true),
  // env 变量黑名单：默认空（全部可注入），条目支持 glob、大小写不敏感，界面可增删。
  envBlocklist: Schema.array(Schema.string()).default([]),
  // 预设快照：完整捕获一份 override（含各阶段独立条目与相对顺序）。
  presets: Schema.array(Schema.object({
    id: Schema.string().required(),
    name: Schema.string().required(),
    data: Schema.object({
      ...overrideShape(),
      order: Schema.array(Schema.object({
        name: Schema.string().required(),
        after: Schema.string(),
        text: Schema.string(),
        custom: Schema.boolean().default(false),
        phase: Schema.string(),
      })),
    }),
  })).default([]),
  activePreset: Schema.string(),
  // 按 agent 预设 id 的字段级覆盖：非空字段整体接管，空缺字段回落到官方默认。
  overrides: Schema.dict(Schema.object(overrideShape())).default({}),
})

/** 旧 replace 字典不属于新模型（破坏式更新）；解析时直接丢弃，绝不进入生效配置。 */
function stripLegacyReplace(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return value
  const next = { ...value }
  delete next.replace
  if (Array.isArray(next.presets)) {
    next.presets = next.presets.map((preset) => preset !== null && typeof preset === 'object' && preset.data !== null && typeof preset.data === 'object'
      ? { ...preset, data: stripLegacyReplace(preset.data) }
      : preset)
  }
  if (next.overrides !== null && typeof next.overrides === 'object' && !Array.isArray(next.overrides)) {
    next.overrides = Object.fromEntries(Object.entries(next.overrides).map(([id, override]) => [id, stripLegacyReplace(override)]))
  }
  return next
}

export const Config = Schema.transform(ConfigObject, stripLegacyReplace)

/** 工作区级 override：按工作区绝对 cwd 存，与 overrides 同形状，运行时覆盖预设级。 */
const WorkspaceOverridesObject = Schema.dict(Schema.object(overrideShape()))
export const WorkspaceOverrides = Schema.transform(WorkspaceOverridesObject, (value) => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return value
  return Object.fromEntries(Object.entries(value).map(([cwd, override]) => [cwd, stripLegacyReplace(override)]))
})

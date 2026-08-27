import Schema from '@deepseek-ai/schemastery'

/** 本插件的设置命名空间（小写 kebab-case）。 */
export const NS = 'prompt-customizer'

/**
 * 插件的配置 schema，同时作为设置命名空间的 schema。
 * GUI 的编辑以这个形状写入 `~/.dsh/settings.yaml`。
 */
export const Config = Schema.object({
  // 按名称屏蔽这些提示词段（从装配后的系统提示词中过滤掉）。
  sections: Schema.array(Schema.string()).default([]),
  // 按名称替换某个段的文本（保持原顺序）。
  replace: Schema.dict(Schema.string()).default({}),
  // 注入 / 覆盖段（按 名称 + 顺序 + 文本）。`custom` 标记本插件生成的段
  // （隐藏标记，用于识别其为可删除，跨预设依然成立，不依赖名字碰撞）。
  inject: Schema.array(Schema.object({
    name: Schema.string().required(),
    order: Schema.number().default(120),
    text: Schema.string().required(),
    custom: Schema.boolean().default(false),
  })).default([]),
  // 工具目录过滤：exclude 隐藏列出的工具；include（非空时）只保留列出的
  // 工具，且优先级高于 exclude。
  tools: Schema.object({
    exclude: Schema.array(Schema.string()).default([]),
    include: Schema.array(Schema.string()).default([]),
  }).default({}),
  // 预设：完整的定制快照（提示词 + 工具配置）。
  presets: Schema.array(Schema.object({
    id: Schema.string().required(),
    name: Schema.string().required(),
    data: Schema.object({
      sections: Schema.array(Schema.string()),
      replace: Schema.dict(Schema.string()),
      // 相对顺序：每个条目记录它应跟随的前一段。
      order: Schema.array(Schema.object({
        name: Schema.string().required(),
        after: Schema.string(),
        text: Schema.string(),
        custom: Schema.boolean().default(false),
      })),
      tools: Schema.object({
        exclude: Schema.array(Schema.string()),
        include: Schema.array(Schema.string()),
      }),
    }),
  })).default([]),
  // 当前已应用预设的 id（同一时间只有一个生效）。
  activePreset: Schema.string(),
})
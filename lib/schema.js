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
  // 每阶段独立段屏蔽（与 tools 阶段化对称）：引导期 / 压缩受控期的额外
  // 屏蔽名单，非空时在该阶段生效并优先于全局 sections；空列表回落全局。
  sectionsBootstrap: Schema.array(Schema.string()).default([]),
  sectionsCompaction: Schema.array(Schema.string()).default([]),
  // 按名称替换某个段的文本（保持原顺序）。
  replace: Schema.dict(Schema.string()).default({}),
  // 注入 / 覆盖段（按 名称 + 顺序 + 文本）。`custom` 标记本插件生成的段
  // （隐藏标记，用于识别其为可删除，跨预设依然成立，不依赖名字碰撞）。
  // `phase` 控制阶段生效：`always` 恒定；`bootstrap` 只在会话未晋级时注入；
  // `compaction` 只在「压缩后仍未晋级」时注入（独立于 bootstrap，拥有自己的
  // order 空间）；`active` 只在晋级后注入（晋级 = 首个 durable 的 tool/call
  // 或 assistant/message；compaction 之后复位，subagent 视为已晋级）。
  inject: Schema.array(Schema.object({
    name: Schema.string().required(),
    order: Schema.number().default(120),
    text: Schema.string().required(),
    phase: Schema.string().default('always'),
    custom: Schema.boolean().default(false),
  })).default([]),
  // 工具目录过滤：exclude 隐藏列出的工具；include（非空时）只保留列出的
  // 工具，且优先级高于 exclude。bootstrap（非空时）在会话未晋级的阶段整体
  // 替代上述静态过滤；compaction（非空时）在「compaction 之后仍未晋级」的
  // 阶段进一步替代 bootstrap（对齐 tool-bootstrap.mjs 的 compactionTools）。
  tools: Schema.object({
    exclude: Schema.array(Schema.string()).default([]),
    include: Schema.array(Schema.string()).default([]),
    bootstrap: Schema.object({
      exclude: Schema.array(Schema.string()).default([]),
      include: Schema.array(Schema.string()).default([]),
    }).default({}),
    compaction: Schema.object({
      exclude: Schema.array(Schema.string()).default([]),
      include: Schema.array(Schema.string()).default([]),
    }).default({}),
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
  // 按 agent 预设 id 的字段级覆盖：某个 agent 预设的 override 中，非空的
  // 字段整体接管全局默认，空缺 / 空列表的字段继续回落全局。键是
  // dsh-agent-presets 的预设目录名（即会话 header.agentPreset 记录的 id）。
  overrides: Schema.dict(Schema.object({
    sections: Schema.array(Schema.string()),
    sectionsBootstrap: Schema.array(Schema.string()),
    sectionsCompaction: Schema.array(Schema.string()),
    replace: Schema.dict(Schema.string()),
    inject: Schema.array(Schema.object({
      name: Schema.string().required(),
      order: Schema.number().default(120),
      text: Schema.string().required(),
      phase: Schema.string().default('always'),
      custom: Schema.boolean().default(false),
    })),
    tools: Schema.object({
      exclude: Schema.array(Schema.string()),
      include: Schema.array(Schema.string()),
      bootstrap: Schema.object({
        exclude: Schema.array(Schema.string()),
        include: Schema.array(Schema.string()),
      }),
      compaction: Schema.object({
        exclude: Schema.array(Schema.string()),
        include: Schema.array(Schema.string()),
      }),
    }),
  })).default({}),
})
import Schema from '@deepseek-ai/schemastery'

/** Settings namespace for this plugin (lowercase kebab-case). */
export const NS = 'prompt-customizer'

/**
 * The plugin's configuration schema, also used as the settings-namespace
 * schema. GUI edits write into this shape under `~/.dsh/settings.yaml`.
 */
export const Config = Schema.object({
  // Block these prompt sections by name (filtered out of the assembled system prompt).
  sections: Schema.array(Schema.string()).default([]),
  // Replace a section's text by name (original order kept).
  replace: Schema.dict(Schema.string()).default({}),
  // Inject / overwrite sections (by name + order + text). `custom` marks a
  // section this plugin generated (a hidden marker so it can be identified as
  // deletable, even across presets, without relying on name collisions).
  inject: Schema.array(Schema.object({
    name: Schema.string().required(),
    order: Schema.number().default(120),
    text: Schema.string().required(),
    custom: Schema.boolean().default(false),
  })).default([]),
  // Tool catalog filtering: exclude hides listed tools; include (when non-empty)
  // keeps only listed tools and wins over exclude.
  tools: Schema.object({
    exclude: Schema.array(Schema.string()).default([]),
    include: Schema.array(Schema.string()).default([]),
  }).default({}),
  // Per-agent customizations: byAgent.<agentPresetId> OVERRIDES the default
  // sections / replace / inject / tools for that specific agent preset. The
  // top-level fields act as the shared default applied to every other agent.
  // Each entry is a partial overlay; omitted fields inherit the default.
  byAgent: Schema.dict(Schema.object({
    sections: Schema.array(Schema.string()),
    replace: Schema.dict(Schema.string()),
    inject: Schema.array(Schema.object({
      name: Schema.string().required(),
      order: Schema.number().default(120),
      text: Schema.string().required(),
      custom: Schema.boolean().default(false),
    })),
    tools: Schema.object({
      exclude: Schema.array(Schema.string()),
      include: Schema.array(Schema.string()),
    }),
  })).default({}),
  // Presets: complete customization snapshots (full prompt + tool config).
  presets: Schema.array(Schema.object({
    id: Schema.string().required(),
    name: Schema.string().required(),
    data: Schema.object({
      sections: Schema.array(Schema.string()),
      replace: Schema.dict(Schema.string()),
      // Relative order: each entry records the section it should follow.
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
  // The id of the currently applied preset (only one active at a time).
  activePreset: Schema.string(),
})
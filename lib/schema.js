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
  // Inject / overwrite sections (by name + order + text).
  inject: Schema.array(Schema.object({
    name: Schema.string().required(),
    order: Schema.number().default(120),
    text: Schema.string().required(),
  })).default([]),
  // Tool catalog filtering: exclude hides listed tools; include (when non-empty)
  // keeps only listed tools and wins over exclude.
  tools: Schema.object({
    exclude: Schema.array(Schema.string()).default([]),
    include: Schema.array(Schema.string()).default([]),
  }).default({}),
})
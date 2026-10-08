/** Mode-owned contributions used by the real rc.2 Loader fixture. */
export const inject = ['tools', 'systemPrompt']
export function apply(ctx, config) {
  ctx.systemPrompt.section({ name: 'fixture:first', order: config.reverse ? 9000 : 7000, text: `FIRST ${config.mode}` })
  ctx.systemPrompt.section({ name: 'fixture:second', order: config.reverse ? 7000 : 9000, text: () => `SECOND ${config.mode}` })
  ctx.systemPrompt.context({ name: 'fixture:policy', order: 1, text: `POLICY ${config.mode}` })
  for (let i = 0; i < config.count; i++) ctx.tools.register({
    name: `${config.mode}_tool_${i}`, description: `Tool for ${config.mode}`, parameters: { type: 'object', properties: {} },
    output: { schema: { type: 'string' }, render: (_args, value) => [{ type: 'text', text: value }] },
    execute: async () => 'fixture-tool-ok',
  })
}

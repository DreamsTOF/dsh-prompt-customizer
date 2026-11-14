/**
 * dsh-probe-stimulus — dev-only DSH plugin.
 *
 * 目的有两个：
 *  1) 把「DSH 插件注册工具/提示词的全部方式」集中成一份可执行样例（下方 apply 里逐条列出）。
 *  2) 作为「新装插件后新注入项是否默认生效」的 stimulus：注册一个系统提示词段 + 若干工具，
 *     供 scripts/_probe-sections.mjs 在 web 端做 before/after 采集（无需在面板点保存）。
 *
 * 注意：本插件装在 profile 的 node_modules 下，**不能** import @deepseek-ai/*（宿主以源码+tsx
 * 解析，node_modules 内的插件走普通 ESM 解析会找不到文件）。因此这里只用「原始对象」注册面，
 * 不 import defineTool。defineTool / setExecutor / MCP 等需要宿主包的写法在 README.md 里列明出处。
 *
 * 挂载（仅测试 web profile，不碰桌面端）：把本目录放到
 *   ~/.dsh/profiles/web/node_modules/dsh-probe-stimulus
 * 并在该 profile 的 cordis.patch.yml 追加：
 *   - insert:
 *       - id: probe-stimulus
 *         name: dsh-probe-stimulus
 * 然后重启 `dsh --profile web`。
 */
export const name = 'dsh-probe-stimulus'
export const inject = ['systemPrompt', 'tools']

export const MARK_SECTION = 'probe:stimulus'
export const MARK_TOOL_RAW = 'probe_stimulus_tool'
export const MARK_TOOL_COND = 'probe_stimulus_conditional'
export const MARK_TOOL_PROVIDER = 'probe_provider_tool'

function outputOf(text) {
  return {
    schema: { type: 'object', properties: { ok: { type: 'boolean' } }, required: ['ok'], additionalProperties: false },
    render: () => [{ type: 'text', text }],
  }
}

export function apply(ctx) {
  // ── 注册面 ①：系统提示词段（会进 system prompt，可被本插件面板显隐/替换）────────
  ctx.systemPrompt.section({
    name: MARK_SECTION,
    order: 500,
    interpolate: false,
    text: 'PROBE_STIMULUS_ACTIVE_MARKER_12345',
  })

  // ── 注册面 ②：原始 ToolDefinition，直接 ctx.tools.register（无需 @deepseek-ai 依赖）──
  // 等价于 subagent/subagent/src/structured.ts 的写法：parameters 为 JSON Schema，
  // output 必须含 { schema, render }，execute 返回 output.schema 的规范值。
  ctx.tools.register({
    name: MARK_TOOL_RAW,
    description: 'Stimulus tool registered via a raw ToolDefinition object.',
    parameters: { type: 'object', properties: { note: { type: 'string' } }, additionalProperties: false },
    output: outputOf('probe raw ok'),
    async execute() { return { ok: true } },
  })

  // ── 注册面 ③：带 { when } 的条件注册（按 step 准入；false 时既不声明也不可调用）──────
  ctx.tools.register({
    name: MARK_TOOL_COND,
    description: 'Stimulus tool admitted only when when() returns true.',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
    output: outputOf('probe conditional ok'),
    async execute() { return { ok: true } },
  }, { when: () => true })

  // ── 注册面 ④：装配期 tool-schema provider（ctx.systemPrompt.tools），不进 tools 注册表 ──
  // 贡献只作用于「装配」这一层（PromptAssembly.tools）；用于动态/派生工具声明。
  ctx.systemPrompt.tools(() => ({
    schemas: [{
      name: MARK_TOOL_PROVIDER,
      description: 'Tool contributed by a systemPrompt.tools() provider at assembly time.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    }],
  }))
}

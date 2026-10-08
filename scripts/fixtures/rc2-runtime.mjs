/** Real rc.2 profile: preview two modes before any conversation exists, then drive one turn. */
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
const runtimeRequire = createRequire(process.env.PC_DSH_MANIFEST)
const llm = await import(pathToFileURL(runtimeRequire.resolve('@deepseek-ai/dsh-llm')).href)
const { createUserMessage } = llm
const { SessionId } = await import(pathToFileURL(runtimeRequire.resolve('@deepseek-ai/dsh-session')).href)
class OfflineModel extends llm.LlmAdapter {
  requests = []
  async resolveModel(provider, model) { return { provider, id: model, name: model, inputModalities: ['text'] } }
  async *stream(options) {
    this.requests.push(options)
    if (this.requests.length === 1) {
      yield { type: 'block-end', index: 0, block: { type: 'tool-call', id: 'pc-probe', name: 'standard_tool_0', arguments: '{}' } }
      yield { type: 'finish', reason: { kind: 'tool-calls' } }
    } else {
      yield { type: 'block-end', index: 0, block: { type: 'text', text: 'rc2-plugin-ok' } }
      yield { type: 'finish', reason: { kind: 'stop' } }
    }
  }
}
export const inject = ['llm', 'agents', 'tools', 'systemPrompt', 'webServer', 'connection', 'agentPresets', 'sessionProjections']
export function apply(ctx) {
  const timer = setImmediate(() => run(ctx).then(() => ctx.root.fiber.dispose()).catch(error => {
    console.error(error); process.exitCode = 1; return ctx.root.fiber.dispose()
  }))
  ctx.effect(() => () => clearImmediate(timer))
}
async function run(ctx) {
  await ctx.loader.await()
  const model = new OfflineModel()
  ctx.llm.registerAdapter(['pc-offline'], model)
  for (const mode of ['standard', 'alternate']) {
    const dispose = await ctx.agentPresets.register({ id: mode, plugins: [
      { name: pathToFileURL(runtimeRequire.resolve('@deepseek-ai/dsh-persona')).href, config: { prefix: `MODE ${mode} {{model}}`, suffix: 'CWD {{cwd}}' } },
      { name: new URL('./rc2-mode.mjs', import.meta.url).href, config: { mode, count: mode === 'standard' ? 85 : 3, reverse: mode === 'alternate' } },
    ] })
    ctx.effect(() => dispose)
  }
  ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: '/', handler: (req, res) => {
    if (ctx.connection.authorizeIndex(req, res)) { res.writeHead(200); res.end('fixture') }
  } }))
  const base = `http://127.0.0.1:${ctx.webServer.port}`
  const auth = await fetch(ctx.connection.authenticatedUrl(base), { redirect: 'manual' })
  const cookie = auth.headers.get('set-cookie').split(';')[0]
  async function request(endpoint, body) {
    const response = await fetch(`${base}/api/prompt-customizer/${endpoint}`, { method: body ? 'POST' : 'GET', headers: { cookie, 'content-type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) })
    const data = await response.json()
    assert.equal(response.status, 200, data.error)
    return data
  }
  const modes = []
  assert.equal(ctx.agents.list().length, 0)
  for (const mode of ['standard', 'alternate']) {
    const first = await request(`preview?scope=${mode}&phase=active`)
    const second = await request(`preview?scope=${mode}&phase=active`)
    assert.deepEqual(second, first)
    assert.equal(first.source, 'preset')
    assert.equal(first.tools.length, mode === 'standard' ? 85 : 3)
    assert.ok(first.tools.every(tool => tool.name.startsWith(`${mode}_`)))
    assert.ok(first.text.includes('{{model}}'))
    assert.ok(first.diagnostics.some(item => item.variable === 'model'))
    const inventory = await request(`inventory?scope=${mode}`)
    assert.ok(inventory.sections.length > 0)
    modes.push({ mode, count: first.tools.length, sections: first.sections, contexts: first.contexts, diagnostics: first.diagnostics })
  }
  const reordered = await request('preview?scope=alternate&phase=active', { target: 'alternate', patch: { inject: [{ name: 'fixture:first', text: '', order: -1, phase: 'active' }] } })
  assert.equal(reordered.sections[0].name, 'fixture:first')
  const standard = await request('preview?scope=standard&phase=active')
  assert.notEqual(standard.sections[0].name, 'fixture:first')
  const handle = await ctx.agents.create({ sessionId: SessionId('pc-rc2-smoke'), agentOptions: { provider: 'pc-offline', model: 'test' }, meta: { cwd: process.cwd() }, setup: async agentCtx => { await ctx.agentPresets.mount(agentCtx, 'standard') } })
  ctx.effect(() => () => handle.dispose())
  handle.agent.followup(createUserMessage({ content: [{ type: 'text', text: 'Run the fixture tool.' }], source: { kind: 'user' } }))
  await handle.agent.whenIdle()
  assert.equal(model.requests.length, 2)
  assert.ok(JSON.stringify(model.requests.at(-1)).includes('fixture-tool-ok'))
  await request('preview?scope=alternate&phase=active')
  assert.equal(ctx.agentPresets.composedPreset(handle.agent.ctx), 'standard')
  const report = { requests: model.requests.length, modes }
  const expected = JSON.parse(await readFile(new URL('./rc2-preview.snapshot.json', import.meta.url), 'utf8'))
  assert.deepEqual(report, expected)
  console.log('PC_RC2_SMOKE ' + JSON.stringify(report))
}

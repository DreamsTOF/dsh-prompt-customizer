import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { apply } from '../vendor/prompt-customizer/index.js'

function harness(t, { live = false, fail = false, renderFail = false, literal = false, complete = false, missingVariable = false } = {}) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-rc2-'))
  t.after(() => fs.rmSync(dataDir, { recursive: true, force: true }))
  const routes = new Map()
  const key = {}
  const agent = { id: 'live-standard', ctx: {}, session: { header: { agentPreset: 'standard', cwd: '/workspace' } }, options: { provider: 'fixture', model: 'test' } }
  let released = 0
  let evaluations = 0
  let handler
  const definitions = scope => [
    { name: 'persona', order: 0, text: literal ? 'Literal {{cwd}}' : 'Hello {{cwd}}', ...(literal ? { interpolate: false } : {}) },
    ...(scope === key || scope === agent ? [{ name: 'preset-only', order: 1, text: 'PRESET' }] : []),
    ...(scope === agent ? [{ name: 'live-only', order: 2, text: ({ agent: owner }) => { evaluations++; return owner.session.header.cwd } }] : []),
  ]
  const schemas = scope => Array.from({ length: scope === agent ? 85 : scope === key ? 65 : 52 }, (_, i) => ({ name: `tool_${i}`, description: 'tool', parameters: {} }))
  const sp = {
    variable: () => () => {},
    layers: { merge: (scope, pick) => pick({ sections: new Map(definitions(scope).map(d => [d.name, d])), contexts: new Map() }) },
    assemble: async context => {
      const assembly = { sections: definitions(context.scope).map(d => ({ name: d.name, ...d.interpolate !== undefined ? { interpolate: d.interpolate } : {}, text: typeof d.text === 'function' ? d.text(context) : d.text })), contexts: [{ name: 'sandbox:policy', text: 'POLICY {{cwd}}' }], tools: schemas(context.scope), variables: { cwd: context.agent?.session.header.cwd ?? '/diagnostic' } }
      if (missingVariable) delete assembly.variables.cwd
      const result = await handler(assembly, context, async () => assembly)
      return complete ? { ...result, sections: [assembly.sections[0]] } : result
    },
  }
  const presets = {
    list: async () => [{ id: 'standard' }],
    composedPreset: () => 'standard',
    acquireScope: async () => { if (fail) throw new Error('broken preset'); return { key, [Symbol.asyncDispose]: async () => { released++ } } },
  }
  const effects = []
  const pristine = sp.assemble.bind(sp)
  if (renderFail) sp.assemble = async () => { throw new Error('provider unavailable') }
  const ctx = { systemPrompt: sp, tools: { schemas }, inject: () => {}, effect: fn => { effects.push(fn()) }, on: (event, fn) => { if (event === 'system-prompt/assemble') handler = fn }, get: name => ({ systemPrompt: sp, tools: { schemas }, agentPresets: presets, agents: { list: () => live ? [agent] : [] }, connection: { requestRejection: () => undefined }, webServer: { register: route => { routes.set(route.path, route.handler); return () => {} } } })[name] }
  apply(ctx, { dataDir })
  async function request(endpoint) {
    const res = { writeHead(code) { this.status = code }, end(text) { this.body = JSON.parse(text) } }
    await routes.get(`/api/prompt-customizer/${endpoint.split('?')[0]}`)({ method: 'GET', url: `/api/prompt-customizer/${endpoint}` }, res)
    return res
  }
  return { request, sp, pristine, dispose: () => effects.reverse().forEach(fn => fn?.()), released: () => released, evaluations: () => evaluations }
}

// 表驱动合并：每个场景各自新建 harness（互不共享状态），逐项执行原断言，
// 失败时错误信息前缀为场景名。

test('rc.2 diagnostic acquires and releases the preset scope on each preview', async t => {
  const h = harness(t)
  for (let i = 0; i < 2; i++) {
    const res = await h.request('preview?scope=standard&phase=active')
    assert.equal(res.status, 200)
    assert.equal(res.body.scopeResolved, true)
    assert.equal(res.body.tools.length, 65)
    assert.ok(res.body.sections.some(s => s.name === 'preset-only'))
    assert.equal(res.body.source, 'preset')
  }
  assert.equal(h.released(), 2)
})

test('preset preview is independent of an existing conversation of the same mode', async t => {
  const h = harness(t, { live: true })
  const { body } = await h.request('preview?scope=standard&phase=active')
  assert.equal(body.tools.length, 65)
  assert.equal(body.registryTotal, 65)
  assert.equal(body.source, 'preset')
  assert.equal(body.sessionId, undefined)
  assert.ok(!body.sections.some(section => section.name === 'live-only'))
  assert.equal(h.evaluations(), 0)
  assert.equal(h.released(), 1)
})

test('失败的预览与卸载：作用域获取失败、渲染失败仍释放租约、卸载还原装配', async t => {
  const scenes = [
    {
      label: 'failed scope acquisition reports failure instead of presenting global tools as the preset',
      options: { fail: true },
      run: async (h) => {
        const res = await h.request('preview?scope=standard')
        assert.equal(res.status, 500)
        assert.match(res.body.error, /broken preset/)
      },
    },
    {
      label: 'failed rendering still releases its diagnostic lease',
      options: { renderFail: true },
      run: async (h) => {
        const res = await h.request('preview?scope=standard')
        assert.equal(res.status, 500)
        assert.match(res.body.error, /provider unavailable/)
        assert.equal(h.released(), 1)
      },
    },
    {
      label: 'unloading restores the original assembly instead of retaining the plugin wrapper',
      options: {},
      run: async (h) => {
        const wrapped = h.sp.assemble
        h.dispose()
        assert.notEqual(h.sp.assemble, wrapped)
        assert.equal(h.sp[Symbol.for('prompt-customizer:assemble-pristine')], undefined)
      },
    },
  ]
  for (const scene of scenes) {
    const h = harness(t, scene.options)
    try {
      await scene.run(h)
    } catch (e) {
      if (e instanceof Error) e.message = `[${scene.label}] ${e.message}`
      throw e
    }
  }
})

test('complete restoration does not discard the evaluated customizer sections', async t => {
  const h = harness(t, { complete: true })
  const { body } = await h.request('preview?scope=standard')
  assert.ok(body.sections.some(section => section.name === 'preset-only'))
})

test('literal interpolation opt-out is preserved in preview', async t => {
  const h = harness(t, { literal: true })
  const { body } = await h.request('preview?scope=standard')
  assert.ok(body.text.includes('Literal {{cwd}}'))
})

test('unresolved session variables retain preset templates, tools and inventory', async t => {
  const h = harness(t, { missingVariable: true })
  const res = await h.request('preview?scope=standard')
  assert.equal(res.status, 200)
  assert.ok(res.body.text.includes('Hello {{cwd}}'))
  assert.equal(res.body.tools.length, 65)
  assert.ok(res.body.diagnostics.some(item => item.name === 'persona' && item.variable === 'cwd'))
  const inventory = await h.request('inventory?scope=standard')
  assert.equal(inventory.status, 200)
  assert.ok(inventory.body.sections.length > 0)
  assert.equal(h.released(), 2)
})

test('legacy session parameter cannot change the selected mode preview', async t => {
  const h = harness(t, { live: true })
  const res = await h.request('preview?scope=standard&session=unknown')
  assert.equal(res.status, 200)
  assert.equal(res.body.source, 'preset')
  assert.equal(res.body.tools.length, 65)
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { apply } from '../lib/index.js'

/** Minimal Cordis ctx: capture the assemble handler; settings.get returns cfg. */
function makeCtx(config) {
  let handler
  const ctx = {
    settings: { register: () => ({ get: () => config }) },
    on: (name, h) => { if (name === 'system-prompt/assemble') handler = h },
    get: () => undefined,
    effect: () => {},
  }
  return { ctx, handler: () => handler }
}

async function assemble(config, sections, tools) {
  const { ctx, handler } = makeCtx(config)
  apply(ctx)
  const assembly = { sections, tools, contexts: [], variables: {} }
  return handler()(assembly, {}, async () => assembly)
}

const baseSections = [
  { name: 'harness:source', order: 0, text: 'source' },
  { name: 'harness:identity', order: 1, text: 'identity' },
  { name: 'tool:read', order: 2, text: 'use read' },
]
const baseTools = [
  { name: 'tool:read' },
  { name: 'tool:write' },
]

test('blocks a section by name', async () => {
  const res = await assemble({ sections: ['tool:read'] }, baseSections, baseTools)
  assert.deepEqual(res.sections.map((s) => s.name), ['harness:source', 'harness:identity'])
})

test('replaces a section text', async () => {
  const res = await assemble({ replace: { 'harness:identity': 'CUSTOM' } }, baseSections, baseTools)
  const identity = res.sections.find((s) => s.name === 'harness:identity')
  assert.equal(identity.text, 'CUSTOM')
})

test('injects a brand-new section and sorts by order', async () => {
  const res = await assemble(
    { inject: [{ name: 'app:x', order: -1, text: 'first' }] },
    baseSections,
    baseTools,
  )
  assert.deepEqual(res.sections.map((s) => s.name), ['app:x', 'harness:source', 'harness:identity', 'tool:read'])
})

test('inject order overrides existing section order without touching text', async () => {
  const res = await assemble(
    { inject: [{ name: 'tool:read', order: -5, text: '' }] },
    baseSections,
    baseTools,
  )
  assert.deepEqual(res.sections.map((s) => s.name), ['tool:read', 'harness:source', 'harness:identity'])
  assert.equal(res.sections[0].text, 'use read')
})

test('inject order overrides existing section text when text is provided', async () => {
  const res = await assemble(
    { inject: [{ name: 'tool:read', order: -5, text: 'CUSTOM' }] },
    baseSections,
    baseTools,
  )
  assert.equal(res.sections.find((s) => s.name === 'tool:read').text, 'CUSTOM')
})

test('filters tools by exclude (blacklist)', async () => {
  const res = await assemble({ tools: { exclude: ['tool:read'], include: [] } }, baseSections, baseTools)
  assert.deepEqual(res.tools.map((t) => t.name), ['tool:write'])
})

test('filters tools by include (whitelist wins over exclude)', async () => {
  const res = await assemble(
    { tools: { exclude: ['tool:read'], include: ['tool:read'] } },
    baseSections,
    baseTools,
  )
  assert.deepEqual(res.tools.map((t) => t.name), ['tool:read'])
})

// ── cross coverage ──────────────────────────────────────────────────────────

test('blocks multiple sections at once', async () => {
  const res = await assemble({ sections: ['harness:source', 'tool:read'] }, baseSections, baseTools)
  assert.deepEqual(res.sections.map((s) => s.name), ['harness:identity'])
})

test('combines block + inject (order sorted across both)', async () => {
  const res = await assemble(
    { sections: ['tool:read'], inject: [{ name: 'app:x', order: -50, text: 'X' }] },
    baseSections,
    baseTools,
  )
  assert.deepEqual(res.sections.map((s) => s.name), ['app:x', 'harness:source', 'harness:identity'])
  assert.equal(res.sections[0].text, 'X')
})

test('replaces multiple sections', async () => {
  const res = await assemble(
    { replace: { 'harness:source': 'S', 'harness:identity': 'I' } },
    baseSections,
    baseTools,
  )
  assert.equal(res.sections.find((s) => s.name === 'harness:source').text, 'S')
  assert.equal(res.sections.find((s) => s.name === 'harness:identity').text, 'I')
})

test('blocked section that is also replaced stays removed', async () => {
  const res = await assemble(
    { sections: ['tool:read'], replace: { 'tool:read': 'CUSTOM' } },
    baseSections,
    baseTools,
  )
  assert.ok(!res.sections.some((s) => s.name === 'tool:read'))
})

test('no-op config returns sections and tools unchanged and in order', async () => {
  const res = await assemble({}, baseSections, baseTools)
  assert.deepEqual(res.sections.map((s) => s.name), ['harness:source', 'harness:identity', 'tool:read'])
  assert.deepEqual(res.tools.map((t) => t.name), ['tool:read', 'tool:write'])
})

test('empty include list disables the whitelist filter', async () => {
  const res = await assemble({ tools: { exclude: [], include: [] } }, baseSections, baseTools)
  assert.equal(res.tools.length, 2)
})

test('empty sections list is handled', async () => {
  const res = await assemble({}, [], baseTools)
  assert.deepEqual(res.sections, [])
  assert.equal(res.tools.length, 2)
})

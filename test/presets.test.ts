import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  addImportedPresets,
  applyPresetData,
  buildPresetData,
  mergeSections,
  removePreset,
  resolveOrder,
  serializePreset,
} from '../src/client/presets.ts'

// Regression for the reported bug: blocking sections then switching presets
// used to unblock them, because the preset's own blocked names were also in the
// order list (presetNames) and got deleted during apply.

const NAMES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

function fullOrder(names: string[]) {
  return names.map((n, i) => ({ name: n, after: i > 0 ? names[i - 1] : undefined, text: '' }))
}

function invSections(names: string[]) {
  return {
    sections: names.map((n, i) => ({ name: n, order: i, text: 't' + n, active: true, replaced: false })),
    tools: [],
  }
}

test('applying a preset restores its own blocked sections (regression)', () => {
  const preset2 = {
    sections: ['a', 'b', 'c', 'd'],
    replace: {},
    order: fullOrder(NAMES),
    tools: {},
  }
  // current config has nothing blocked (e.g. after applying preset1)
  const patch = applyPresetData(preset2, { sections: [] }, new Set(NAMES))
  assert.deepEqual([...patch.sections].sort(), ['a', 'b', 'c', 'd'])
})

test('block -> save preset2 -> apply preset1 -> apply preset2 keeps blocks', () => {
  const preset2 = {
    sections: ['a', 'b', 'c', 'd'],
    replace: {},
    order: fullOrder(NAMES),
    tools: {},
  }
  const preset1 = {
    sections: [],
    replace: {},
    order: fullOrder(NAMES),
    tools: {},
  }
  // Apply preset1 (unblocks everything).
  const after1 = applyPresetData(preset1, { sections: ['a', 'b', 'c', 'd'] }, new Set(NAMES))
  assert.deepEqual(after1.sections, [])
  // Apply preset2 again.
  const after2 = applyPresetData(preset2, { sections: after1.sections }, new Set(NAMES))
  assert.deepEqual([...after2.sections].sort(), ['a', 'b', 'c', 'd'])
  assert.deepEqual(after2.inject.map((x) => x.name), NAMES)
})

test('default-disable: current sections not in the preset list are blocked', () => {
  const preset = {
    sections: [],
    replace: {},
    order: fullOrder(NAMES.slice(0, 5)), // a-e
    tools: {},
  }
  const patch = applyPresetData(preset, { sections: [] }, new Set(NAMES))
  assert.deepEqual([...patch.sections].sort(), ['f', 'g', 'h'])
})

test('only active preset sections are unblocked; blocked stay blocked', () => {
  const preset = {
    sections: ['b'],
    replace: {},
    order: fullOrder(NAMES),
    tools: {},
  }
  // The preset defines everything except b as active: applying it unblocks a & c
  // (both active in the preset) and keeps b blocked.
  const patch = applyPresetData(preset, { sections: ['a', 'b', 'c'] }, new Set(NAMES))
  assert.deepEqual([...patch.sections].sort(), ['b'])
})

test('buildPresetData captures full merged order even when cfg.inject is empty', () => {
  const inv = invSections(NAMES)
  const cfg = { sections: ['c'] } // only blocked, never reordered
  const merged = mergeSections(inv, cfg, new Set(['c']))
  const data = buildPresetData(cfg, merged)
  assert.equal(data.order.length, NAMES.length)
  assert.deepEqual(data.order.map((o) => o.name), NAMES)
  assert.deepEqual(data.sections, ['c'])
})

test('resolveOrder: anchored chain and missing-anchor fallback', () => {
  const order = [
    { name: 'a', after: undefined, text: '' },
    { name: 'c', after: 'b', text: '' },
    { name: 'b', after: 'a', text: '' },
    { name: 'x', after: 'ghost', text: '' },
  ]
  const res = resolveOrder(order)
  assert.deepEqual(res.map((x) => x.name), ['a', 'b', 'c', 'x'])
  assert.deepEqual(res.map((x) => x.order), [0, 1, 2, 3])
})

// ── resolveOrder: cross coverage ─────────────────────────────────────────────

test('resolveOrder: empty list', () => {
  assert.deepEqual(resolveOrder([]), [])
})

test('resolveOrder: single section', () => {
  assert.deepEqual(resolveOrder([{ name: 'a', after: undefined, text: 't' }]), [{ name: 'a', order: 0, text: 't' }])
})

test('resolveOrder: linear chain preserves relative order', () => {
  const res = resolveOrder([
    { name: 'a', after: undefined, text: '' },
    { name: 'c', after: 'b', text: '' },
    { name: 'b', after: 'a', text: '' },
  ])
  assert.deepEqual(res.map((x) => x.name), ['a', 'b', 'c'])
})

test('resolveOrder: multiple roots keep input order then chain', () => {
  const res = resolveOrder([
    { name: 'a', after: undefined, text: '' },
    { name: 'b', after: undefined, text: '' },
    { name: 'c', after: 'b', text: '' },
  ])
  assert.deepEqual(res.map((x) => x.name), ['a', 'b', 'c'])
})

test('resolveOrder: cycle is broken by appending unresolved', () => {
  const res = resolveOrder([
    { name: 'a', after: 'c', text: '' },
    { name: 'c', after: 'a', text: '' },
  ])
  // Neither has an anchor present in the map-of-itself? Both anchors exist,
  // so neither is a root → the chain loop cannot place either → appended in order.
  assert.deepEqual(res.map((x) => x.name), ['a', 'c'])
})

test('resolveOrder: carries text through', () => {
  const res = resolveOrder([{ name: 'a', after: undefined, text: 'HELLO' }])
  assert.equal(res[0].text, 'HELLO')
})

// ── mergeSections: cross coverage ────────────────────────────────────────────

test('mergeSections: inventory only, sorted by order', () => {
  const inv = { sections: [
    { name: 'b', order: 1, text: 'tb', active: true, replaced: false },
    { name: 'a', order: 0, text: 'ta', active: true, replaced: false },
  ], tools: [] }
  const merged = mergeSections(inv, {}, new Set())
  assert.deepEqual(merged.map((s) => s.name), ['a', 'b'])
})

test('mergeSections: injected override existing order', () => {
  const inv = { sections: [{ name: 'x', order: 0, text: 't', active: true, replaced: false }], tools: [] }
  const cfg = { inject: [{ name: 'x', order: 5, text: '' }] }
  const merged = mergeSections(inv, cfg, new Set())
  assert.equal(merged[0].order, 5)
})

test('mergeSections: injected new section appears in order', () => {
  const inv = invSections(['b'])
  const cfg = { inject: [{ name: 'a', order: -1, text: 'new' }] }
  const merged = mergeSections(inv, cfg, new Set())
  assert.deepEqual(merged.map((s) => s.name), ['a', 'b'])
  assert.equal(merged[0].text, 'new')
})

test('mergeSections: new injected section is flagged inactive when blocked', () => {
  const inv = invSections(['b'])
  const cfg = { inject: [{ name: 'a', order: -1, text: 'new' }] }
  const merged = mergeSections(inv, cfg, new Set(['a']))
  const a = merged.find((s) => s.name === 'a')
  assert.equal(a!.active, false)
})

test('mergeSections: empty inv and inject', () => {
  assert.deepEqual(mergeSections(null, {}, new Set()), [])
})

// ── buildPresetData: cross coverage ──────────────────────────────────────────

test('buildPresetData: preserves sections/replace/tools and builds relative order', () => {
  const cfg = { sections: ['a'], replace: { a: 'x' }, tools: { exclude: ['t'], include: [] } }
  const merged = [{ name: 'a', order: 0, text: 'ta', active: true, replaced: true }, { name: 'b', order: 1, text: 'tb', active: true, replaced: false }]
  const data = buildPresetData(cfg, merged)
  assert.deepEqual(data.sections, ['a'])
  assert.deepEqual(data.replace, { a: 'x' })
  assert.deepEqual(data.tools, { exclude: ['t'], include: [] })
  assert.deepEqual(data.order.map((o) => o.name), ['a', 'b'])
  assert.equal(data.order[1].after, 'a')
  assert.equal(data.order[0].after, undefined)
})

// ── applyPresetData: cross matrix (empty-order guard + default disable) ──────

test('applyPresetData: empty order only applies its own blocked list', () => {
  const preset = { sections: ['a'], replace: {}, order: [], tools: {} }
  const patch = applyPresetData(preset, { sections: [] }, new Set(NAMES))
  assert.deepEqual(patch.sections, ['a'])
  assert.deepEqual(patch.inject, [])
})

test('applyPresetData: empty order does not default-disable current sections', () => {
  const preset = { sections: ['a'], replace: {}, order: [], tools: {} }
  const patch = applyPresetData(preset, { sections: ['x'] }, new Set(NAMES))
  assert.deepEqual(patch.sections, ['a'])
})

test('applyPresetData: replace merges by name (current keys kept)', () => {
  const preset = { sections: [], replace: { a: 'new' }, order: fullOrder(NAMES), tools: {} }
  const patch = applyPresetData(preset, { replace: { b: 'keep' } }, new Set(NAMES))
  assert.deepEqual(patch.replace, { b: 'keep', a: 'new' })
})

test('applyPresetData: applies preset tools and preserves include/exclude', () => {
  const preset = { sections: [], replace: {}, order: fullOrder(NAMES), tools: { exclude: ['t'], include: ['t2'] } }
  const patch = applyPresetData(preset, { tools: { exclude: ['old'], include: [] } }, new Set(NAMES))
  assert.deepEqual(patch.tools, { exclude: ['t'], include: ['t2'] })
})

test('applyPresetData: full order keeps preset sections as the active set', () => {
  const preset = { sections: ['c'], replace: {}, order: fullOrder(NAMES), tools: {} }
  const patch = applyPresetData(preset, { sections: ['a', 'b', 'c'] }, new Set(NAMES))
  // c stays blocked; a,b,d..h are active in the preset → unblocked.
  assert.deepEqual([...patch.sections].sort(), ['c'])
  assert.deepEqual(patch.inject.map((x) => x.name), NAMES)
})

// ── addImportedPresets: cross coverage ───────────────────────────────────────

test('addImportedPresets imports a single object', () => {
  const existing = [{ id: 'p1', name: 'A', data: {} }]
  let n = 0
  const out = addImportedPresets(existing, { name: 'B', data: { sections: ['a'] } }, () => 'p' + (++n))
  assert.equal(out.length, 2)
  assert.equal(out[1].name, 'B')
  assert.deepEqual(out[1].data.sections, ['a'])
})

test('addImportedPresets imports an array and skips same-name', () => {
  const existing = [{ id: 'p1', name: 'A', data: {} }]
  let n = 0
  const out = addImportedPresets(existing, [
    { name: 'A', data: {} },
    { name: 'B', data: {} },
    { name: 'A', data: {} },
    { name: 'C', data: {} },
  ], () => 'p' + (++n))
  assert.deepEqual(out.map((p) => p.name), ['A', 'B', 'C'])
})

test('addImportedPresets ignores entries without a string name', () => {
  const out = addImportedPresets([], [{ data: {} }, 42, null, undefined, { name: 'OK', data: {} }], () => 'x')
  assert.deepEqual(out.map((p) => p.name), ['OK'])
})

test('addImportedPresets returns the same list when nothing new', () => {
  const existing = [{ id: 'p1', name: 'A', data: {} }]
  const out = addImportedPresets(existing, [{ name: 'A', data: {} }], () => 'x')
  assert.equal(out, existing)
})

// ── removePreset / serializePreset ───────────────────────────────────────────

test('removePreset clears the active id when it is the removed one', () => {
  const presets = [{ id: 'p1', name: 'A', data: {} }, { id: 'p2', name: 'B', data: {} }]
  assert.deepEqual(removePreset(presets, 'p1', 'p1'), { presets: [{ id: 'p2', name: 'B', data: {} }], activeId: undefined })
})

test('removePreset keeps active id when a different preset is removed', () => {
  const presets = [{ id: 'p1', name: 'A', data: {} }, { id: 'p2', name: 'B', data: {} }]
  assert.deepEqual(removePreset(presets, 'p2', 'p1'), { presets: [{ id: 'p1', name: 'A', data: {} }], activeId: 'p1' })
})

test('serializePreset returns { name, data }', () => {
  const preset = { id: 'p1', name: 'A', data: { sections: ['x'] } }
  assert.deepEqual(serializePreset(preset), { name: 'A', data: { sections: ['x'] } })
})

// ── Complex preset-switching cross coverage (regression: 5+ presets) ─────────

// A 5-preset switch chain. The key invariant: after applying ANY preset, that
// preset's OWN blocked sections must survive — even after applying other
// presets in between (the previously reported bug deleted them).
test('complex switch chain over 5+ presets keeps each preset own blocks', () => {
  function make(id: string, blocked: string[], orderNames: string[] = NAMES) {
    return { id, name: id, data: { sections: blocked, replace: {}, order: fullOrder(orderNames), tools: {} } }
  }
  const presets: Record<string, ReturnType<typeof make>> = {
    p1: make('p1', ['a', 'b']),
    p2: make('p2', ['c', 'd']),
    p3: make('p3', ['e', 'f', 'g']),
    p4: make('p4', []),
    p5: make('p5', ['b', 'c'], ['a', 'b', 'c']), // partial order
  }

  const all = new Set(NAMES)
  let cfg: { sections: string[] } = { sections: [] }

  const seq = ['p4', 'p1', 'p2', 'p5', 'p3', 'p1', 'p4', 'p2', 'p5', 'p3', 'p1', 'p5', 'p2', 'p4', 'p3', 'p1']

  for (const id of seq) {
    const preset = presets[id]!
    const patch = applyPresetData(preset.data, cfg, all)

    // Exact expected blocked set for this preset.
    const orderNames = new Set(preset.data.order.map((o) => o.name))
    const expected = new Set(preset.data.sections)
    if (orderNames.size > 0) {
      const active = new Set([...orderNames].filter((n) => !expected.has(n)))
      for (const n of all) if (!orderNames.has(n)) expected.add(n)
      for (const n of active) expected.delete(n)
    }
    assert.deepEqual([...patch.sections].sort(), [...expected].sort(), `step ${id}: blocked set`)

    // The reported bug regression: the preset's own blocked sections survive.
    for (const n of preset.data.sections) {
      assert.ok(patch.sections.includes(n), `preset ${id} must keep its own block ${n}`)
    }

    cfg = { sections: patch.sections }
  }
})

// Applies a large preset, then a small (partial-order) preset: the small one
// default-disables the sections outside its own list, cross-cutting the prior
// preset's blocks.
test('small preset after a full preset default-disables outside its list', () => {
  const full = { id: 'f', name: 'f', data: { sections: ['a', 'b'], replace: {}, order: fullOrder(NAMES), tools: {} } }
  const small = { id: 's', name: 's', data: { sections: [], replace: {}, order: fullOrder(NAMES.slice(0, 5)), tools: {} } }

  // Apply full preset first (blocks a,b).
  const step1 = applyPresetData(full.data, { sections: [] }, new Set(NAMES))
  assert.deepEqual([...step1.sections].sort(), ['a', 'b'])

  // Switch to the small preset: sections not in its list (f,g,h) are disabled.
  const step2 = applyPresetData(small.data, { sections: step1.sections }, new Set(NAMES))
  assert.deepEqual([...step2.sections].sort(), ['f', 'g', 'h'])
})

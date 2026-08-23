import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  addImportedPresets,
  applyPresetData,
  buildPresetData,
  mergeSections,
  removePreset,
  removeSection,
  resolveOrder,
  serializePreset,
  type Section,
} from '../src/client/presets.ts'
import type { Config, Inventory } from '../src/client/types.ts'

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
  assert.deepEqual(resolveOrder([{ name: 'a', after: undefined, text: 't' }]), [{ name: 'a', order: 0, text: 't', custom: false }])
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

// ── Full UI state-machine regression ─────────────────────────────────────────
// The earlier tests pass a simplified currentNames (the full NAMES set) and a
// cfg that lacks `inject`. The real UI computes currentNames from
// mergeSections(inv, cfg, blocked) and OVERWRITES cfg.inject on every apply, so
// those tests missed two real bugs:
//   (1) switching to a preset that does not know a custom injected section used
//       to DROP it from inject → the section vanished from the UI;
//   (2) the same switch would disable that section (add it to sections) but the
//       UI could no longer render it, so the block list looked wrong.
// These tests replay the actual per-apply cfg evolution.

const ALL = Array.from({ length: 22 }, (_, i) => 's' + i)

function inventory(): Inventory {
  return {
    sections: ALL.map((n, i) => ({ name: n, order: i, text: 't' + n, active: true, replaced: false })),
    tools: [],
  }
}

function presetOrder(names: string[], extra?: Array<{ name: string; after: string; text: string; custom?: boolean }>) {
  const base = names.map((n, i) => ({ name: n, after: i > 0 ? names[i - 1] : undefined, text: '' }))
  return extra ? [...base, ...extra] : base
}

/** Replay one preset apply exactly as the UI does (compute currentNames from the merged list, then overwrite cfg fields). */
function applyThroughUI(presetData: Config['presets'] extends Array<infer P> ? P['data'] : never, cfg: Config, inv: Inventory | null): Config {
  const blocked = new Set(cfg.sections ?? [])
  const merged = mergeSections(inv, cfg, blocked)
  const currentNames = new Set(merged.map((s) => s.name))
  const patch = applyPresetData(presetData, cfg, currentNames)
  return { ...cfg, sections: patch.sections, inject: patch.inject, replace: patch.replace, tools: patch.tools }
}

test('state-machine: switching back to preset2 keeps its own blocks; custom section is disabled, not dropped', () => {
  const inv = inventory()
  const blocked2 = ['s4', 's17', 's18', 's19', 's20', 's21']
  const blocked1 = ['s20', 's21']
  const preset2 = { sections: blocked2, replace: {}, order: presetOrder(ALL), tools: {} }
  const preset1 = { sections: blocked1, replace: {}, order: presetOrder(ALL, [{ name: 'c', after: 's21', text: 'custom', custom: true }]), tools: {} }

  // The user has preset2 blocked and saves it (inject is untouched → empty).
  let cfg: Config = { sections: [...blocked2], inject: [], replace: {}, tools: { exclude: [], include: [] } }
  const saved2 = buildPresetData(cfg, mergeSections(inv, cfg, new Set(blocked2)))
  assert.deepEqual(saved2.order.map((o) => o.name), [...ALL], 'saved preset2 order is the full list')

  // Apply preset1: only 20,21 are blocked.
  cfg = applyThroughUI(preset1, cfg, inv)
  assert.deepEqual([...cfg.sections].sort(), [...blocked1].sort(), 'apply preset1 blocks 20,21 only')
  assert.ok(cfg.inject.some((x) => x.name === 'c'), 'preset1 injects custom section c')

  // Switch back to preset2: its own blocks survive; c stays visible but is disabled.
  cfg = applyThroughUI(preset2, cfg, inv)
  for (const n of blocked2) assert.ok(cfg.sections.includes(n), `preset2 keeps its own block ${n}`)
  assert.ok(cfg.sections.includes('c'), 'custom section c is disabled under preset2')
  const merged = mergeSections(inv, cfg, new Set(cfg.sections))
  const c = merged.find((sec) => sec.name === 'c')!
  assert.ok(c, 'custom section c is still visible under preset2')
  assert.equal(c.source, 'custom', 'custom section stays marked custom (deletable) across preset switches')
  assert.equal(c.text, 'custom', 'custom section keeps its own text across preset switches')

  // Removing the custom section clears it from inject/sections/replace.
  const removed = removeSection('c', cfg)
  assert.ok(!removed.inject.some((x) => x.name === 'c'), 'removeSection drops c from inject')
  assert.ok(!removed.sections.includes('c'), 'removeSection drops c from sections')
})

test('state-machine: injected custom section survives an empty-order preset apply', () => {
  const inv = inventory()
  // A minimal preset that only blocks sections (no order) must not drop the
  // user's custom injected sections.
  const minimal = { sections: ['s0'], replace: {}, order: [], tools: {} }
  let cfg: Config = { sections: [], inject: [{ name: 'c', order: 0, text: 'custom' }], replace: {}, tools: { exclude: [], include: [] } }
  cfg = applyThroughUI(minimal, cfg, inv)
  assert.ok(cfg.inject.some((x) => x.name === 'c'), 'custom section c kept after minimal preset apply')
  assert.deepEqual(cfg.sections, ['s0'], 'minimal preset applies only its own block')
})

// ── Section source (system vs custom) + removal ──────────────────────────────

test('mergeSections: inventory sections are system; hidden custom marker marks a section as custom and keeps its text', () => {
  const inv = invSections(['b'])
  const cfg = { inject: [ // 'b' reorders an existing system-section (no marker → stays system); 'a' is plugin-generated (custom:true)
    { name: 'b', order: 5, text: '', custom: false },
    { name: 'a', order: -1, text: 'hello', custom: true },
  ] }
  const merged = mergeSections(inv, cfg, new Set())
  const a = merged.find((sec) => sec.name === 'a')!
  const b = merged.find((sec) => sec.name === 'b')!
  assert.equal(a.source, 'custom')
  assert.equal(a.text, 'hello', 'custom section renders its own text, never "<动态生成>"')
  assert.equal(b.source, 'system', 'a section carrying no custom marker stays system, even if reordered')
})

test('mergeSections: a section whose name collides with the inventory but carries the custom marker is custom (deletable)', () => {
  const inv = invSections(['x'])
  const merged = mergeSections(inv, { inject: [{ name: 'x', order: 0, text: 'mine', custom: true }] }, new Set())
  const x = merged.find((sec) => sec.name === 'x')!
  assert.equal(x.source, 'custom')
  assert.equal(x.text, 'mine')
})

test('mergeSections: custom section text is not coerced to "<动态生成>" when empty', () => {
  const merged = mergeSections(invSections([]), { inject: [{ name: 'x', order: 0, text: '', custom: true }] }, new Set())
  assert.equal(merged[0].text, '')
})

test('buildPresetData: only custom sections carry their text into the preset order', () => {
  const merged: Section[] = [
    { name: 'sys', order: 0, text: '<动态生成>', active: true, replaced: false, source: 'system' },
    { name: 'cust', order: 1, text: 'my text', active: true, replaced: false, source: 'custom' },
  ]
  const data = buildPresetData({}, merged)
  assert.equal(data.order[0].text, '', 'system section keeps empty text (never freezes dynamic content)')
  assert.equal(data.order[1].text, 'my text', 'custom section keeps its own text')
})

test('removeSection removes a section from inject, sections and replace', () => {
  const cfg: Config = {
    sections: ['c'],
    inject: [{ name: 'c', order: 0, text: 'x' }, { name: 'b', order: 1, text: 'y' }],
    replace: { c: 'r', d: 'q' },
  }
  const patch = removeSection('c', cfg)
  assert.deepEqual(patch.sections, [])
  assert.deepEqual(patch.inject.map((x) => x.name), ['b'])
  assert.deepEqual(patch.replace, { d: 'q' })
})

test('removeSection is a no-op for an unknown name', () => {
  const cfg: Config = { sections: ['a'], inject: [{ name: 'a', order: 0, text: 'x' }], replace: { a: 'r' } }
  const patch = removeSection('ghost', cfg)
  assert.deepEqual(patch.sections, ['a'])
  assert.deepEqual(patch.inject.map((x) => x.name), ['a'])
  assert.deepEqual(patch.replace, { a: 'r' })
})

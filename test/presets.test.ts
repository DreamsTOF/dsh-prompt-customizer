import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyPresetData, buildPresetData, mergeSections, resolveOrder } from '../src/client/presets.ts'

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

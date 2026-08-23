import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isToolHidden, setToolMode, toggleTool } from '../src/client/presets.ts'

// ── isToolHidden: cross matrix (include mode wins over exclude) ───────────────

test('isToolHidden: exclude mode (empty include)', () => {
  assert.equal(isToolHidden('a', { exclude: ['a'], include: [] }), true)
  assert.equal(isToolHidden('b', { exclude: ['a'], include: [] }), false)
  assert.equal(isToolHidden('a', { exclude: [], include: [] }), false)
})

test('isToolHidden: include mode (non-empty include wins)', () => {
  // In include mode a tool is hidden unless it is in the include list.
  assert.equal(isToolHidden('a', { exclude: ['a'], include: ['a'] }), false)
  assert.equal(isToolHidden('b', { exclude: ['a'], include: ['a'] }), true)
  assert.equal(isToolHidden('c', { exclude: [], include: ['a', 'c'] }), false)
  assert.equal(isToolHidden('b', { exclude: [], include: ['a', 'c'] }), true)
})

test('isToolHidden: undefined cfg behaves as empty exclude mode', () => {
  assert.equal(isToolHidden('a', undefined), false)
})

// ── toggleTool: add/remove in both modes ─────────────────────────────────────

test('toggleTool in exclude mode adds a hidden tool back / hides a visible one', () => {
  // Hide a previously visible tool.
  assert.deepEqual(toggleTool('b', false, { exclude: ['a'], include: [] }), { exclude: ['a', 'b'], include: [] })
  // Unhide a previously hidden tool.
  assert.deepEqual(toggleTool('a', true, { exclude: ['a', 'b'], include: [] }), { exclude: ['b'], include: [] })
})

test('toggleTool in include mode adds/removes from the include list', () => {
  // currentlyHidden → add to include (make visible).
  assert.deepEqual(toggleTool('b', true, { exclude: [], include: ['a'] }), { exclude: [], include: ['a', 'b'] })
  // currentlyVisible → remove from include (hide).
  assert.deepEqual(toggleTool('a', false, { exclude: [], include: ['a', 'b'] }), { exclude: [], include: ['b'] })
})

test('toggleTool is idempotent when toggling an already-present name', () => {
  // Hide a name that is already hidden: it is already not in include → stays.
  assert.deepEqual(toggleTool('b', true, { exclude: [], include: ['a'] }), { exclude: [], include: ['a', 'b'] })
})

test('toggleTool with undefined cfg defaults to empty exclude mode', () => {
  assert.deepEqual(toggleTool('a', false, undefined), { exclude: ['a'], include: [] })
})

// ── setToolMode: switching whitelist / blacklist ─────────────────────────────

test('setToolMode(true) seeds include from non-excluded known tools', () => {
  const toolsCfg = { exclude: ['b', 'unknown'], include: [] }
  const out = setToolMode(true, toolsCfg, ['a', 'b', 'c'])
  assert.deepEqual(out.exclude, ['b']) // unknown dropped
  assert.deepEqual(out.include, ['a', 'c']) // b is excluded
})

test('setToolMode(false) clears include and keeps known exclude names', () => {
  const toolsCfg = { exclude: ['b', 'zzz'], include: ['a'] }
  const out = setToolMode(false, toolsCfg, ['a', 'b', 'c'])
  assert.deepEqual(out.exclude, ['b']) // unknown dropped
  assert.deepEqual(out.include, [])
})

test('setToolMode(true) with empty exclude seeds all known tools', () => {
  const out = setToolMode(true, { exclude: [], include: [] }, ['a', 'b'])
  assert.deepEqual(out, { exclude: [], include: ['a', 'b'] })
})

test('setToolMode(false) from whitelist keeps the exclude list empty', () => {
  const out = setToolMode(false, { exclude: [], include: ['a'] }, ['a'])
  assert.deepEqual(out, { exclude: [], include: [] })
})

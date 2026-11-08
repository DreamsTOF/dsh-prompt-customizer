import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { parse, stringify as yamlStringify } from 'yaml'
import { createConfigStore, readLegacySection } from '../vendor/prompt-customizer/store.js'
import { openDb, getDoc, setDoc } from '../vendor/prompt-customizer/db.js'
import { Config } from '../vendor/prompt-customizer/schema.js'
import { apply } from '../vendor/prompt-customizer/index.js'

function tmpdir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix))
}

function dbStore(dir, warn) {
  const db = openDb(path.join(dir, 'prompt-customizer.db'))
  return { db, store: createConfigStore({ db, key: 'config', schema: Config, warn }) }
}

// ── store 基础行为（SQLite doc 表）─────────────────────────────────────────

test('DB store：写入读回 + schema 补默认值', () => {
  const dir = tmpdir('pc-store-')
  const { db, store } = dbStore(dir)
  store.setField('sections', [{ name: 'a' }, { name: 'b' }])
  assert.deepEqual(store.readResolved().sections, [{ name: 'a' }, { name: 'b' }])
  assert.deepEqual(store.readResolved().tools, { exclude: [], add: [], bootstrap: { exclude: [], add: [] }, compaction: { exclude: [], add: [] } })
  // 存放在同一 DB 的 doc('config') 里；不再有 config.yaml。
  assert.deepEqual(getDoc(db, 'config'), { sections: [{ name: 'a' }, { name: 'b' }] })
  assert.equal(fs.existsSync(path.join(dir, 'config.yaml')), false)
})

test('DB store：删除字段（undefined）从文档里移除', () => {
  const dir = tmpdir('pc-store-')
  const { db, store } = dbStore(dir)
  store.setField('sections', [{ name: 'a' }])
  store.setField('replacements', [{ name: 'a', phase: 'always', text: 'x' }])
  store.setField('replacements', undefined)
  assert.equal(getDoc(db, 'config').replacements, undefined)
  assert.deepEqual(store.readResolved().replacements, [])
  assert.deepEqual(getDoc(db, 'config').sections, [{ name: 'a' }])
})

test('DB store：坏文档（schema 非法）回落到 last-good', () => {
  const dir = tmpdir('pc-store-')
  const { db, store } = dbStore(dir, () => {})
  store.setField('sections', [{ name: 'good' }])
  assert.deepEqual(store.readResolved().sections, [{ name: 'good' }])
  // 名单里的条目缺 name 是 schemastery 明确拒绝的形状 → 回落 last-good。
  setDoc(db, 'config', { sections: [{ source: { kind: 'global' } }] })
  assert.deepEqual(store.readResolved().sections, [{ name: 'good' }], 'last-good')
})

// ── readLegacySection：仅排查用（破坏式后不再迁移）─────────────────────────

test('readLegacySection extracts a non-empty object section', () => {
  const dir = tmpdir('pc-migrate-')
  const master = path.join(dir, 'settings.yaml')
  fs.writeFileSync(master, yamlStringify({
    'prompt-customizer': { sections: ['legacy'], replace: {} },
    other: { x: 1 },
  }))
  assert.deepEqual(readLegacySection(master, 'prompt-customizer'), { sections: ['legacy'], replace: {} })
})

test('readLegacySection tolerates missing/empty/malformed masters', () => {
  assert.equal(readLegacySection(undefined, 'ns'), undefined)
  assert.equal(readLegacySection(path.join(os.tmpdir(), 'pc-nope', 'settings.yaml'), 'ns'), undefined)
  const dir = tmpdir('pc-migrate-')
  const master = path.join(dir, 'settings.yaml')
  fs.writeFileSync(master, yamlStringify({ 'prompt-customizer': {} }))
  assert.equal(readLegacySection(master, 'prompt-customizer'), undefined)
  fs.writeFileSync(master, '::::')
  assert.equal(readLegacySection(master, 'prompt-customizer'), undefined)
})

// ── 破坏式更新：旧 settings.yaml / config.yaml 一律不读、不迁移 ─────────────

test('破坏式更新：apply 不读取旧 settings.yaml，也不生成 config.yaml', () => {
  const dir = tmpdir('pc-migrate-')
  const master = path.join(dir, 'settings.yaml')
  fs.writeFileSync(master, yamlStringify({ 'prompt-customizer': { sections: ['from-legacy'] } }))
  const ctx = {
    on: () => {},
    inject: () => {},
    get: (key) => (key === 'settings' ? { documentPath: master } : undefined),
    effect: () => {},
  }
  const dataDir = path.join(dir, 'data')
  apply(ctx, { dataDir })
  // 建的是 DB，不是 config.yaml；旧段没有被迁移。
  assert.equal(fs.existsSync(path.join(dataDir, 'config.yaml')), false)
  const { store } = dbStore(dataDir)
  assert.deepEqual(store.readResolved().sections, [])
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { parse, stringify as yamlStringify } from 'yaml'
import { createConfigStore, readLegacySection } from '../lib/store.js'
import { Config } from '../lib/schema.js'
import { apply } from '../lib/index.js'

function tmpdir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix))
}

// ── store 基础行为 ──────────────────────────────────────────────────────────

test('write then read round-trips through config.yaml with schema defaults', () => {
  const dir = tmpdir('pc-store-')
  const file = path.join(dir, 'config.yaml')
  const store = createConfigStore({ file, schema: Config })

  store.setField('sections', ['a', 'b'])
  assert.deepEqual(store.readResolved().sections, ['a', 'b'])
  // 缺省字段补默认值
  assert.deepEqual(store.readResolved().tools, { exclude: [], include: [], bootstrap: { exclude: [], include: [] }, compaction: { exclude: [], include: [] } })
  // 磁盘文件确实是合法 yaml 且只含写入的字段
  const onDisk = parse(fs.readFileSync(file, 'utf8'))
  assert.deepEqual(onDisk, { sections: ['a', 'b'] })
})

test('lazy reload picks up external edits by mtime', async () => {
  const dir = tmpdir('pc-store-')
  const file = path.join(dir, 'config.yaml')
  const store = createConfigStore({ file, schema: Config })

  store.setField('sections', ['first'])
  assert.deepEqual(store.readResolved().sections, ['first'])
  // 外部手工编辑
  fs.writeFileSync(file, yamlStringify({ sections: ['second'] }))
  assert.deepEqual(store.readResolved().sections, ['second'])
})

test('unset removes a field entirely from the file', () => {
  const dir = tmpdir('pc-store-')
  const file = path.join(dir, 'config.yaml')
  const store = createConfigStore({ file, schema: Config })

  store.setField('sections', ['a'])
  store.setField('replace', { a: 'x' })
  store.setField('replace', undefined)
  // 磁盘文件里字段已删除；readResolved 经 schema 后回落默认值 {}
  assert.deepEqual(parse(fs.readFileSync(file, 'utf8')).replace, undefined)
  assert.deepEqual(store.readResolved().replace, {})
  assert.deepEqual(parse(fs.readFileSync(file, 'utf8')).sections, ['a'])
})

test('a corrupt file falls back to last-good resolution', () => {
  const dir = tmpdir('pc-store-')
  const file = path.join(dir, 'config.yaml')
  const store = createConfigStore({ file, schema: Config, warn: () => {} })

  store.setField('sections', ['good'])
  assert.deepEqual(store.readResolved().sections, ['good'])
  fs.writeFileSync(file, '{ not: [valid')
  assert.deepEqual(store.readResolved().sections, ['good']) // last-good
  // 修好后恢复
  fs.writeFileSync(file, yamlStringify({ sections: ['fixed'] }))
  assert.deepEqual(store.readResolved().sections, ['fixed'])
})

test('a schema-invalid section falls back to last-good too', () => {
  const dir = tmpdir('pc-store-')
  const file = path.join(dir, 'config.yaml')
  const store = createConfigStore({ file, schema: Config, warn: () => {} })

  store.setField('sections', ['good'])
  // replace 值非字符串是 schemastery 明确拒绝的形状（见 schema.test.mjs）
  fs.writeFileSync(file, yamlStringify({ replace: { a: 42 } }))
  assert.deepEqual(store.readResolved().sections, ['good'])
})

// ── 旧版迁移 ────────────────────────────────────────────────────────────────

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

test('apply migrates the legacy section once, then the new file wins', () => {
  const dir = tmpdir('pc-migrate-')
  const master = path.join(dir, 'settings.yaml')
  fs.writeFileSync(master, yamlStringify({ 'prompt-customizer': { sections: ['from-legacy'] } }))

  const handlers = []
  const ctx = {
    on: (name, h) => { if (name === 'system-prompt/assemble') handlers.push(h) },
    get: (key) => key === 'settings' ? { documentPath: master } : undefined,
    effect: () => {},
  }
  const dataDir = path.join(dir, 'data')
  apply(ctx, { dataDir })

  // 新文件已生成，内容 = 旧段
  const configFile = path.join(dataDir, 'config.yaml')
  assert.deepEqual(parse(fs.readFileSync(configFile, 'utf8')), { sections: ['from-legacy'] })

  // 之后外部改旧文档不再影响新文件（一次性迁移，非双读）
  fs.writeFileSync(master, yamlStringify({ 'prompt-customizer': { sections: ['changed'] } }))
  const store = createConfigStore({ file: configFile, schema: Config })
  assert.deepEqual(store.readResolved().sections, ['from-legacy'])
})

test('apply does not overwrite an existing config file with the legacy section', () => {
  const dir = tmpdir('pc-migrate-')
  const master = path.join(dir, 'settings.yaml')
  fs.writeFileSync(master, yamlStringify({ 'prompt-customizer': { sections: ['legacy'] } }))
  const dataDir = path.join(dir, 'data')
  fs.mkdirSync(dataDir, { recursive: true })
  fs.writeFileSync(path.join(dataDir, 'config.yaml'), yamlStringify({ sections: ['mine'] }))

  const ctx = {
    on: () => {},
    get: (key) => key === 'settings' ? { documentPath: master } : undefined,
    effect: () => {},
  }
  apply(ctx, { dataDir })
  const store = createConfigStore({ file: path.join(dataDir, 'config.yaml'), schema: Config })
  assert.deepEqual(store.readResolved().sections, ['mine'])
})

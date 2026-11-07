/**
 * 遗留 include（白名单）清理测试：配置现在存 SQLite 的 doc('config')。启动时把
 * 残留的 include 剥掉并记一条日志，且必须幂等。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { openDb, getDoc, setDoc } from '../vendor/prompt-customizer/db.js'
import { apply } from '../vendor/prompt-customizer/index.js'

/** 起一次插件。第二参传 { dir } 时复用已有目录（幂等测试要用）。 */
function boot(config, { dir } = {}) {
  const dataDir = dir ?? fs.mkdtempSync(path.join(os.tmpdir(), 'pc-include-'))
  const dbFile = path.join(dataDir, 'prompt-customizer.db')
  if (config !== undefined) setDoc(openDb(dbFile), 'config', config)
  const logs = []
  const ctx = {
    on: () => {},
    inject: () => {},
    get: () => undefined,
    effect: () => {},
    logger: { info: (m) => logs.push(String(m)), warn: (m) => logs.push(String(m)) },
  }
  apply(ctx, { dataDir })
  return { dataDir, logs, read: () => getDoc(openDb(dbFile), 'config') }
}

/** 整棵配置树里是否还残留 include 键。 */
function anyInclude(node) {
  if (node === null || typeof node !== 'object') return false
  if ('include' in node) return true
  return Object.values(node).some(anyInclude)
}

test('启动即剥掉 tools / 阶段目录 / overrides / 预设快照里的 include', () => {
  const h = boot({
    tools: { exclude: ['t1'], include: ['t2'], bootstrap: { exclude: [], include: ['b'] }, compaction: { include: ['c'] } },
    overrides: {
      'some-preset': { tools: { exclude: [], include: ['x'] } },
      clean: { sections: ['s'] },
    },
    presets: [{ id: 'p1', name: 'P', data: { tools: { exclude: ['e'], include: ['i'] } } }],
  })
  const doc = h.read()
  assert.equal(anyInclude(doc), false, `清理后不应残留 include：${JSON.stringify(doc)}`)
  assert.deepEqual(doc.tools.exclude, ['t1'])
  assert.deepEqual(doc.tools.bootstrap, { exclude: [] })
  assert.deepEqual(doc.overrides['some-preset'], { tools: { exclude: [] } })
  assert.deepEqual(doc.overrides.clean, { sections: ['s'] })
  assert.deepEqual(doc.presets[0].data.tools, { exclude: ['e'] })
  assert.ok(h.logs.some((m) => /include/.test(m) && /5 处/.test(m)), `应记一条含数量的日志：${h.logs.join(' | ')}`)
})

test('清理是幂等的：没有 include 就不改文档、不记日志', () => {
  const config = { tools: { exclude: ['t1'], bootstrap: { exclude: ['b'] } } }
  const first = boot(config)
  const snapshot = JSON.stringify(first.read())
  assert.deepEqual(first.read(), config)
  assert.equal(first.logs.length, 0, `不该有多余日志：${first.logs.join(' | ')}`)
  const again = boot(undefined, { dir: first.dataDir })
  assert.equal(JSON.stringify(again.read()), snapshot)
  assert.equal(again.logs.length, 0)
})

test('空 include 也一并清掉（不留无意义字段）', () => {
  const h = boot({ tools: { exclude: ['t1'], include: [] } })
  assert.deepEqual(h.read().tools, { exclude: ['t1'] })
  assert.equal(h.logs.length, 0, '空 include 无信息量，不该惊动日志')
})

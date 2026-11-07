/**
 * 「本系统全部提示词 / 全部工具」累积登记表单测（SQLite）。
 * 契约三条：不随预设切换、只增不减、同名后见到者赢。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { openDb, readCatalog } from '../vendor/prompt-customizer/db.js'
import { createCatalog, mergeSighting } from '../vendor/prompt-customizer/catalog.js'

function tmpdir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix))
}

function dbCatalog(dir) {
  const db = openDb(path.join(dir, 'prompt-customizer.db'))
  return { db, catalog: createCatalog({ db }) }
}

// ── mergeSighting：纯合并语义 ────────────────────────────────────────────────

test('mergeSighting：同名覆盖保持原位 / 再并不变更 / 缺字段不抹值 / 缺 order 按 orderOf 补位', async () => {
  const cases = [
    {
      label: '同名覆盖内容且保持原位，新名追加',
      run: () => {
        const prev = [{ name: 'a', text: 'A1' }, { name: 'b', text: 'B1' }]
        const { list, changed } = mergeSighting(prev, [{ name: 'a', text: 'A2' }, { name: 'c', text: 'C1' }])
        assert.ok(changed)
        assert.deepEqual(list.map((x) => x.name), ['a', 'b', 'c'])
        assert.equal(list[0].text, 'A2')
        assert.deepEqual(prev[0], { name: 'a', text: 'A1' })
      },
    },
    {
      label: '同样的所见再并一次既不增长也不报变更',
      run: () => {
        const prev = [{ name: 'a', text: 'A1' }]
        const { list, changed } = mergeSighting(prev, [{ name: 'a', text: 'A1' }])
        assert.equal(changed, false)
        assert.deepEqual(list, prev)
      },
    },
    {
      label: '所见缺字段不会把已有值抹成空洞',
      run: () => {
        const prev = [{ name: 'a', order: 3, text: 'A1' }]
        const { list } = mergeSighting(prev, [{ name: 'a', text: 'A2', order: undefined }])
        assert.deepEqual(list[0], { name: 'a', order: 3, text: 'A2' })
      },
    },
    {
      label: '缺 order 的新条目按 orderOf 补稳定下标',
      run: () => {
        const prev = [{ name: 'a', order: 5 }]
        const { list } = mergeSighting(prev, [{ name: 'b' }, { name: 'c' }], (l) => l.length + 5)
        assert.deepEqual(list.map((x) => [x.name, x.order]), [['a', 5], ['b', 6], ['c', 7]])
      },
    },
    {
      label: '脏条目（无名 / 非对象 / 空名）直接丢弃',
      run: () => {
        const { list, changed } = mergeSighting([], [null, 42, { name: '' }, { noName: 1 }, { name: 'ok' }])
        assert.ok(changed)
        assert.deepEqual(list, [{ name: 'ok' }])
      },
    },
  ]
  for (const c of cases) {
    try { c.run() } catch (e) { e.message = `[${c.label}] ${e.message}`; throw e }
  }
})

// ── createCatalog：累积 / 持久 / 无变更 / replace（SQLite）──────────────────

test('createCatalog（SQLite）：跨预设累积 / 持久 / 无变更不报变更', () => {
  const dir = tmpdir('pc-catalog-')
  const { db, catalog } = dbCatalog(dir)
  catalog.observe({ sections: [{ name: 'shared', order: 0, text: 'std' }], tools: [{ name: 'read', description: 'd' }] })
  catalog.observe({ sections: [{ name: 'shared', text: 'minimal' }, { name: 'only-minimal', text: 'M' }], tools: [{ name: 'str_replace_editor', description: '' }] })
  const pool = catalog.read()
  assert.deepEqual(pool.sections.map((x) => x.name), ['shared', 'only-minimal'])
  assert.equal(pool.sections[0].text, 'minimal')
  assert.deepEqual(pool.tools.map((x) => x.name).sort(), ['read', 'str_replace_editor'])
  // DB 持久：新实例（同 db）读回
  assert.deepEqual(readCatalog(db).sections.map((x) => x.name), ['shared', 'only-minimal'])
  // 无变更不报变更
  assert.equal(catalog.observe({ sections: [{ name: 'shared', order: 0, text: 'minimal' }], tools: [] }), false)
})

test('createCatalog（SQLite）：replace 整体替换并报告增减', () => {
  const dir = tmpdir('pc-catalog-')
  const { catalog } = dbCatalog(dir)
  catalog.observe({ sections: [{ name: 'a', text: 'A' }, { name: 'b', text: 'B' }], tools: [{ name: 't1', description: '' }, { name: 't2', description: '' }] })
  const report = catalog.replace({ sections: [{ name: 'a', text: 'A2' }], tools: [{ name: 't1', description: 'x' }] })
  assert.equal(report.written, true)
  assert.equal(report.sections.before, 2)
  assert.equal(report.sections.after, 1)
  assert.equal(report.sections.removed, 1)
  assert.equal(report.tools.removed, 1)
  assert.deepEqual(catalog.read().sections.map((x) => x.name), ['a'])
  assert.deepEqual(catalog.read().tools.map((x) => x.name), ['t1'])
})

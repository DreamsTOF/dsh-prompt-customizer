/**
 * catalog 累积登记表：只增的 observe 与「整体替换」的 replace。
 *
 * 背景：observe 是「只增不减」的并集（浏览过的名字永远留着），这是面板能
 * 看见跨预设条目的原因，也是积压的来源 —— 曾经 407 个工具、真实只剩 100 个时，
 * 那 307 个仍可被拖动。replace 是唯一能把登记表按真实注册表缩小的入口
 * （/api/prompt-customizer/catalog/rescan 全量重扫后调用）。
 *
 * Usage: node --test test/catalog-replace.test.mjs
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { parse } from 'yaml'
import { createCatalog, mergeSighting } from '../vendor/prompt-customizer/catalog.js'

function makeCatalog() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-catalog-'))
  return { dir, catalog: createCatalog({ dir }), file: path.join(dir, 'catalog.yaml') }
}

test('observe 只增不减：历史条目不会因为这次没看到而消失', () => {
  const { catalog } = makeCatalog()
  catalog.observe({ tools: [{ name: 'a' }, { name: 'b' }], sections: [{ name: 's1', text: 'x' }] })
  catalog.observe({ tools: [{ name: 'c' }], sections: [{ name: 's2', text: 'y' }] })

  const pool = catalog.read()
  assert.deepEqual(pool.tools.map((t) => t.name).sort(), ['a', 'b', 'c'])
  assert.deepEqual(pool.sections.map((s) => s.name).sort(), ['s1', 's2'])
})

test('replace 按真实并集整体替换，并报告清掉了多少', () => {
  const { catalog, file } = makeCatalog()
  catalog.observe({
    tools: [{ name: 'gone-1' }, { name: 'gone-2' }, { name: 'kept' }],
    sections: [{ name: 'gone-sec', text: 'old' }, { name: 'kept-sec', text: 'old' }],
  })

  const report = catalog.replace({
    tools: [{ name: 'kept' }, { name: 'new' }],
    sections: [{ name: 'kept-sec', text: 'fresh' }],
  })

  assert.deepEqual(report.tools, { before: 3, after: 2, removed: 2 })
  assert.deepEqual(report.sections, { before: 2, after: 1, removed: 1 })
  assert.equal(report.written, true)

  const pool = catalog.read()
  assert.deepEqual(pool.tools.map((t) => t.name).sort(), ['kept', 'new'])
  assert.equal(pool.sections.length, 1)
  assert.equal(pool.sections[0].name, 'kept-sec')
  assert.notEqual(pool.sections[0].text, 'old', '同名段应被这次所见覆盖')

  // 落盘了：重新读磁盘也是替换后的内容（重启不会把旧条目捞回来）
  const onDisk = parse(fs.readFileSync(file, 'utf8'))
  assert.deepEqual(onDisk.tools.map((t) => t.name).sort(), ['kept', 'new'])
})

test('replace 对重复贡献的同名条目归一（后见到者赢）', () => {
  const { catalog } = makeCatalog()
  const report = catalog.replace({
    tools: [
      { name: 'dupe', description: 'first' },
      { name: 'dupe', description: 'second' },
    ],
  })
  assert.equal(report.tools.after, 1)
  assert.equal(catalog.read().tools[0].description, 'second')
})

test('replace 后 observe 继续累积新名字（替换不是冻结）', () => {
  const { catalog } = makeCatalog()
  catalog.replace({ tools: [{ name: 'a' }] })
  catalog.observe({ tools: [{ name: 'b' }] })
  assert.deepEqual(catalog.read().tools.map((t) => t.name).sort(), ['a', 'b'])
})

test('mergeSighting：同名覆盖保持原位置，新名追加', () => {
  const { list, changed } = mergeSighting(
    [{ name: 'a', description: 'old' }, { name: 'b' }],
    [{ name: 'b', description: 'new' }, { name: 'c' }],
  )
  assert.equal(changed, true)
  assert.deepEqual(list.map((x) => x.name), ['a', 'b', 'c'])
  assert.equal(list[1].description, 'new')
})

test('mergeSighting 用 undefined 不抹掉已有字段', () => {
  const { list } = mergeSighting([{ name: 'a', description: 'keep' }], [{ name: 'a', description: undefined }])
  assert.equal(list[0].description, 'keep')
})

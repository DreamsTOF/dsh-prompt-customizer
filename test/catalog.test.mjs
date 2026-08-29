/**
 * 「本系统全部提示词 / 全部工具」累积登记表单测。
 * 池子的契约只有三条：不随预设切换、只增不减、同名后见到者赢。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { parse } from 'yaml'
import { createCatalog, mergeSighting } from '../lib/catalog.js'

function tmpdir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix))
}

// ── mergeSighting：纯合并语义 ────────────────────────────────────────────────

test('mergeSighting: 同名覆盖内容且保持原位，新名追加', () => {
  const prev = [{ name: 'a', text: 'A1' }, { name: 'b', text: 'B1' }]
  const { list, changed } = mergeSighting(prev, [{ name: 'a', text: 'A2' }, { name: 'c', text: 'C1' }])
  assert.ok(changed)
  assert.deepEqual(list.map((x) => x.name), ['a', 'b', 'c'])
  assert.equal(list[0].text, 'A2') // 后见到者赢
  assert.deepEqual(prev[0], { name: 'a', text: 'A1' }) // 不改入参
})

test('mergeSighting: 同样的所见再并一次既不增长也不报变更', () => {
  const prev = [{ name: 'a', text: 'A1' }]
  const { list, changed } = mergeSighting(prev, [{ name: 'a', text: 'A1' }])
  assert.equal(changed, false)
  assert.deepEqual(list, prev)
})

test('mergeSighting: 所见缺字段不会把已有值抹成空洞', () => {
  const prev = [{ name: 'a', order: 3, text: 'A1' }]
  // 预览路径的所见只有 text，没有 order。
  const { list } = mergeSighting(prev, [{ name: 'a', text: 'A2', order: undefined }])
  assert.deepEqual(list[0], { name: 'a', order: 3, text: 'A2' })
})

test('mergeSighting: 缺 order 的新条目按 orderOf 补稳定下标', () => {
  const prev = [{ name: 'a', order: 5 }]
  const { list } = mergeSighting(prev, [{ name: 'b' }, { name: 'c' }], (l) => l.length + 5)
  assert.deepEqual(list.map((x) => [x.name, x.order]), [['a', 5], ['b', 6], ['c', 7]])
})

test('mergeSighting: 脏条目（无名 / 非对象 / 空名）直接丢弃', () => {
  const { list, changed } = mergeSighting([], [null, 42, { name: '' }, { noName: 1 }, { name: 'ok' }])
  assert.ok(changed)
  assert.deepEqual(list, [{ name: 'ok' }])
})

// ── createCatalog：累积 + 落盘 ───────────────────────────────────────────────

test('catalog 跨预设累积：并集只增不减，且写进 catalog.yaml', () => {
  const dir = tmpdir('pc-catalog-')
  const catalog = createCatalog({ dir })

  catalog.observe({ sections: [{ name: 'shared', order: 0, text: 'std' }], tools: [{ name: 'read', description: 'd' }] })
  catalog.observe({ sections: [{ name: 'shared', text: 'minimal' }, { name: 'only-minimal', text: 'M' }], tools: [{ name: 'str_replace_editor', description: '' }] })

  const pool = catalog.read()
  assert.deepEqual(pool.sections.map((x) => x.name), ['shared', 'only-minimal'])
  assert.equal(pool.sections[0].text, 'minimal') // 后见到者赢
  assert.deepEqual(pool.tools.map((x) => x.name).sort(), ['read', 'str_replace_editor'])

  const onDisk = parse(fs.readFileSync(path.join(dir, 'catalog.yaml'), 'utf8'))
  assert.deepEqual(onDisk.sections.map((x) => x.name), ['shared', 'only-minimal'])
})

test('catalog 缓存持久：新实例从磁盘读回之前的累积', () => {
  const dir = tmpdir('pc-catalog-')
  createCatalog({ dir }).observe({ tools: [{ name: 'run_code', description: 'ptc' }] })
  const second = createCatalog({ dir })
  assert.deepEqual(second.read().tools, [{ name: 'run_code', description: 'ptc' }])
  // 只增不减：换一个 scope 再并一次，旧名字仍在。
  second.observe({ tools: [{ name: 'pwsh', description: '' }] })
  assert.deepEqual(second.read().tools.map((x) => x.name), ['run_code', 'pwsh'])
})

test('catalog 无变更时不落盘（不产生写放大）', () => {
  const dir = tmpdir('pc-catalog-')
  const catalog = createCatalog({ dir })
  catalog.observe({ sections: [{ name: 'a', order: 0, text: 'A' }], tools: [{ name: 't', description: '' }] })
  const file = path.join(dir, 'catalog.yaml')
  const before = fs.statSync(file).mtimeMs
  catalog.observe({ sections: [{ name: 'a', order: 0, text: 'A' }], tools: [{ name: 't', description: '' }] })
  assert.equal(fs.statSync(file).mtimeMs, before)
  assert.equal(catalog.observe({ sections: [], tools: [] }), false)
})

test('catalog 对坏文件容错：从空开始并能继续累积', () => {
  const dir = tmpdir('pc-catalog-')
  const file = path.join(dir, 'catalog.yaml')
  fs.writeFileSync(file, 'sections: [this: is: not: valid\n\tbroken')
  const catalog = createCatalog({ dir })
  assert.deepEqual(catalog.read(), { sections: [], tools: [] })
  assert.equal(catalog.observe({ tools: [{ name: 'x', description: '' }] }), true)
  assert.deepEqual(catalog.read().tools, [{ name: 'x', description: '' }])
})

test('catalog 尊重外部删除：文件被删后池子真的重置（不是把旧内容写回去）', () => {
  const dir = tmpdir('pc-catalog-')
  const file = path.join(dir, 'catalog.yaml')
  const catalog = createCatalog({ dir })
  catalog.observe({ tools: [{ name: 'run_code', description: 'ptc' }] })
  assert.ok(fs.existsSync(file))
  fs.rmSync(file)
  // 下一次所见只带自己的名字：外部删除必须生效，旧池子不得复活。
  catalog.observe({ tools: [{ name: 'pwsh', description: '' }] })
  assert.deepEqual(catalog.read().tools, [{ name: 'pwsh', description: '' }])
})

test('catalog 尊重外部编辑：手改文件后按新内容继续累积', () => {
  const dir = tmpdir('pc-catalog-')
  const catalog = createCatalog({ dir })
  catalog.observe({ tools: [{ name: 'a', description: '' }] })
  fs.writeFileSync(path.join(dir, 'catalog.yaml'), 'tools:\n  - name: b\n    description: 手改\n', 'utf8')
  catalog.observe({ tools: [{ name: 'c', description: '' }] })
  assert.deepEqual(catalog.read().tools.map((x) => x.name), ['b', 'c'])
})

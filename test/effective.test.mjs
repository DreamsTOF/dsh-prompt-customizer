/**
 * applySectionPolicy 的行为测试：屏蔽 → 替换 → 注入 → 排序。
 * 同一份实现服务两条输入：瀑布流过滤后的段（旧行为）与注册表原始段
 * （forceSections 强制覆盖，见 lib/index.js 的 assemble 包装）。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applySectionPolicy, pickSectionsForStatus } from '../lib/effective.js'

/** 注册表风格输入：{ name, text, order }，顺序已按 order 排好。 */
function rawSections(entries) {
  return entries
    .map(([name, order, text]) => ({ name, order, text }))
    .sort((a, b) => a.order - b.order)
}

const STATUS = { promoted: true, boundary: -1 }

test('屏蔽：denied 里的段被移除，其余保持相对顺序', () => {
  const cfg = { sections: ['b'], sectionsBootstrap: [], sectionsCompaction: [], replace: {}, inject: [] }
  const out = applySectionPolicy(rawSections([['a', 0, 'A'], ['b', 1, 'B'], ['c', 2, 'C']]), cfg, STATUS)
  assert.deepEqual(out.map((s) => s.name), ['a', 'c'])
})

test('替换：replace 覆盖文本，顺序不变', () => {
  const cfg = { sections: [], sectionsBootstrap: [], sectionsCompaction: [], replace: { b: 'B2' }, inject: [] }
  const out = applySectionPolicy(rawSections([['a', 0, 'A'], ['b', 1, 'B']]), cfg, STATUS)
  assert.deepEqual(out.map((s) => s.text), ['A', 'B2'])
})

test('注入：已存在的段覆盖文本与顺序，新名追加（custom 段），屏蔽优先', () => {
  const cfg = {
    sections: ['c'],
    sectionsBootstrap: [],
    sectionsCompaction: [],
    replace: {},
    inject: [
      { name: 'b', order: 10, text: 'B-INJECT' },
      { name: 'x', order: 99, text: 'X', custom: true },
      { name: 'c', order: 5, text: 'C-BLOCKED' }, // 被屏蔽的注入段直接跳过
    ],
  }
  const out = applySectionPolicy(rawSections([['a', 0, 'A'], ['b', 1, 'B'], ['c', 2, 'C']]), cfg, STATUS)
  assert.deepEqual(out.map((s) => ({ name: s.name, text: s.text })), [
    { name: 'a', text: 'A' },
    { name: 'b', text: 'B-INJECT' },
    { name: 'x', text: 'X' },
  ])
})

test('排序：虚拟 order 决定顺序，注入段可插入系统段之间', () => {
  const cfg = {
    sections: [], sectionsBootstrap: [], sectionsCompaction: [], replace: {},
    inject: [{ name: 'm', order: 0, text: 'M', custom: true }],
  }
  const out = applySectionPolicy(rawSections([['a', 0, 'A'], ['z', 2, 'Z']]), cfg, STATUS)
  assert.deepEqual(out.map((s) => s.name), ['a', 'm', 'z'])
})

test('阶段名单：bootstrap / compaction 独立生效（与工具目录对称）', () => {
  const cfg = {
    sections: [], sectionsBootstrap: ['boot'], sectionsCompaction: ['comp'], replace: {}, inject: [],
  }
  const boot = applySectionPolicy(rawSections([['boot', 0, 'B'], ['a', 1, 'A']]), cfg, { promoted: false, boundary: -1 })
  assert.deepEqual(boot.map((s) => s.name), ['a'])
  const comp = applySectionPolicy(rawSections([['comp', 0, 'C'], ['a', 1, 'A']]), cfg, { promoted: false, boundary: 1 })
  assert.deepEqual(comp.map((s) => s.name), ['a'])
  const active = applySectionPolicy(rawSections([['boot', 0, 'B'], ['comp', 0, 'C'], ['a', 1, 'A']]), cfg, STATUS)
  assert.deepEqual(active.map((s) => s.name), ['boot', 'comp', 'a'])
})

test('瀑布流输入（无 order 字段）也能用：按数组序稳定排序', () => {
  const cfg = { sections: [], sectionsBootstrap: [], sectionsCompaction: [], replace: {}, inject: [] }
  const out = applySectionPolicy([{ name: 'x', text: 'X' }, { name: 'y', text: 'Y' }], cfg, STATUS)
  assert.deepEqual(out.map((s) => s.name), ['x', 'y'])
})

test('pickSectionsForStatus：三态互不继承，各取自己那份名单', () => {
  const cfg = { sections: ['r'], sectionsBootstrap: ['b'], sectionsCompaction: ['c'] }
  assert.deepEqual(pickSectionsForStatus(cfg, { promoted: false, boundary: 1 }), ['c'])
  assert.deepEqual(pickSectionsForStatus(cfg, { promoted: false, boundary: -1 }), ['b'])
  assert.deepEqual(pickSectionsForStatus(cfg, { promoted: true, boundary: -1 }), ['r'])
  // 压缩受控期没有名单就是空，绝不回落引导期或常驻期
  const partial = { sections: ['r'], sectionsBootstrap: ['b'] }
  assert.deepEqual(pickSectionsForStatus(partial, { promoted: false, boundary: 1 }), [])
  // 常驻期名单也不泄漏进引导期
  assert.deepEqual(pickSectionsForStatus(partial, { promoted: false, boundary: -1 }), ['b'])
  assert.deepEqual(pickSectionsForStatus(partial, { promoted: true, boundary: -1 }), ['r'])
})

test('三态屏蔽互不影响：一个阶段的屏蔽不波及另一个阶段', () => {
  const cfg = { sections: ['a'], sectionsBootstrap: ['b'], sectionsCompaction: [], replace: {}, inject: [] }
  const secs = rawSections([['a', 0, 'A'], ['b', 1, 'B']])
  // 常驻期：a 被屏蔽
  assert.deepEqual(applySectionPolicy(secs, cfg, STATUS).map((s) => s.name), ['b'])
  // 引导期：只有引导期名单生效，a 不受常驻期屏蔽牵连
  assert.deepEqual(applySectionPolicy(secs, cfg, { promoted: false, boundary: -1 }).map((s) => s.name), ['a'])
  // 压缩受控期：无名单，a、b 都在
  assert.deepEqual(applySectionPolicy(secs, cfg, { promoted: false, boundary: 1 }).map((s) => s.name), ['a', 'b'])
})

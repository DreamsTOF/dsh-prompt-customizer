/**
 * applySectionPolicy / 阶段过滤的行为测试：屏蔽 → 阶段替换 → 注入 → 排序。
 * 名单是 EntryRef[]，替换是 replacements；身份按 name+source 匹配。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  applySectionPolicy,
  effectiveConfig,
  filterInjectByPhase,
  filterReplacementsByPhase,
  mergeOverrideLayers,
  pickContextsForStatus,
  pickSectionsForStatus,
  pickToolsFilter,
} from '../vendor/prompt-customizer/effective.js'

const G = { kind: 'global' }
const P = { kind: 'preset', id: 'p1' }
const A = { kind: 'agent', id: 's1' }
const ref = (name, source) => (source === undefined ? { name } : { name, source })
const STATUS = { promoted: true, boundary: -1 }

/** 注册表风格输入：{ name, source?, text, order }，顺序已按 order 排好。 */
function rawSections(entries) {
  return entries
    .map(([name, order, text, source]) => ({ name, ...(source === undefined ? {} : { source }), order, text }))
    .sort((a, b) => a.order - b.order)
}

test('屏蔽 / 阶段替换 / 注入 / 排序：applySectionPolicy 的段级语义', () => {
  const cases = [
    {
      label: '屏蔽：denied 里的段被移除，其余保持相对顺序',
      run: () => {
        const cfg = { sections: [ref('b', G)] }
        const out = applySectionPolicy(rawSections([['a', 0, 'A'], ['b', 1, 'B', G], ['c', 2, 'C']]), cfg, STATUS)
        assert.deepEqual(out.map((s) => s.name), ['a', 'c'])
      },
    },
    {
      label: '身份：source 不同的同名段不被误伤；name-only 条目命中任意来源',
      run: () => {
        const sections = rawSections([['same', 0, 'G', G], ['same', 1, 'P', P]])
        const presetOnly = applySectionPolicy(sections, { sections: [ref('same', P)] }, STATUS)
        assert.deepEqual(presetOnly.map((s) => [s.text]), [['G']])
        const nameOnly = applySectionPolicy(sections, { sections: [ref('same')] }, STATUS)
        assert.deepEqual(nameOnly, [])
      },
    },
    {
      label: '阶段替换：replacements 覆盖文本，顺序不变，绝不新建段',
      run: () => {
        const cfg = {
          replacements: [
            { name: 'b', source: G, phase: 'always', text: 'B2' },
            { name: 'ghost', source: G, phase: 'always', text: 'GHOST' },
            { name: 'a', source: G, phase: 'bootstrap', text: 'BOOT-A' },
          ],
        }
        const out = applySectionPolicy(rawSections([['a', 0, 'A', G], ['b', 1, 'B', G]]), cfg, STATUS)
        assert.deepEqual(out.map((s) => s.text), ['A', 'B2'])
        assert.equal(out.some((s) => s.name === 'ghost'), false, '替换只对已存在段生效')
      },
    },
    {
      label: '注入：已存在的段覆盖文本与顺序，新名追加（custom 段），屏蔽优先',
      run: () => {
        const cfg = {
          sections: [ref('c', G)],
          inject: [
            { name: 'b', order: 10, text: 'B-INJECT' },
            { name: 'x', order: 99, text: 'X', custom: true },
            { name: 'c', source: G, order: 5, text: 'C-BLOCKED' },
          ],
        }
        const out = applySectionPolicy(rawSections([['a', 0, 'A', G], ['b', 1, 'B', G], ['c', 2, 'C', G]]), cfg, STATUS)
        assert.deepEqual(out.map((s) => ({ name: s.name, text: s.text })), [
          { name: 'a', text: 'A' },
          { name: 'b', text: 'B-INJECT' },
          { name: 'x', text: 'X' },
        ])
      },
    },
    {
      label: '排序：虚拟 order 决定顺序，注入段可插入系统段之间',
      run: () => {
        const cfg = { inject: [{ name: 'm', order: 0, text: 'M', custom: true }] }
        const out = applySectionPolicy(rawSections([['a', 0, 'A'], ['z', 2, 'Z']]), cfg, STATUS)
        assert.deepEqual(out.map((s) => s.name), ['a', 'm', 'z'])
      },
    },
    {
      label: '阶段名单：bootstrap / compaction 独立生效',
      run: () => {
        const cfg = { sectionsBootstrap: [ref('boot', G)], sectionsCompaction: [ref('comp', G)] }
        const base = rawSections([['boot', 0, 'B', G], ['comp', 1, 'C', G], ['a', 2, 'A', G]])
        assert.deepEqual(applySectionPolicy(base, cfg, { promoted: false, boundary: -1 }).map((s) => s.name), ['comp', 'a'])
        assert.deepEqual(applySectionPolicy(base, cfg, { promoted: false, boundary: 1 }).map((s) => s.name), ['boot', 'a'])
        assert.deepEqual(applySectionPolicy(base, cfg, STATUS).map((s) => s.name), ['boot', 'comp', 'a'])
      },
    },
    {
      label: '瀑布流输入（无 order 字段）也能用：按数组序稳定排序',
      run: () => {
        const out = applySectionPolicy([{ name: 'x', text: 'X' }, { name: 'y', text: 'Y' }], {}, STATUS)
        assert.deepEqual(out.map((s) => s.name), ['x', 'y'])
      },
    },
  ]
  for (const c of cases) {
    try {
      c.run()
    } catch (e) {
      e.message = `[${c.label}] ${e.message}`
      throw e
    }
  }
})

test('pickSectionsForStatus / pickContextsForStatus：三态互不继承', () => {
  const cfg = {
    sections: [ref('r', G)],
    sectionsBootstrap: [ref('b', P)],
    sectionsCompaction: [ref('c', A)],
    contexts: [ref('cr', G)],
    contextsBootstrap: [ref('cb', P)],
  }
  assert.deepEqual(pickSectionsForStatus(cfg, { promoted: false, boundary: 1 }), [ref('c', A)])
  assert.deepEqual(pickSectionsForStatus(cfg, { promoted: false, boundary: -1 }), [ref('b', P)])
  assert.deepEqual(pickSectionsForStatus(cfg, { promoted: true, boundary: -1 }), [ref('r', G)])
  assert.deepEqual(pickSectionsForStatus({ sections: [ref('r')] }, { promoted: false, boundary: 1 }), [])
  assert.deepEqual(pickContextsForStatus(cfg, { promoted: false, boundary: -1 }), [ref('cb', P)])
  assert.deepEqual(pickContextsForStatus(cfg, STATUS), [ref('cr', G)])
})

test('filterInjectByPhase / filterReplacementsByPhase：always + 本阶段，未知 phase 忽略', () => {
  const items = [
    { name: 'a', phase: 'always', text: 'A' },
    { name: 'b', phase: 'bootstrap', text: 'B' },
    { name: 'c', phase: 'active', text: 'C' },
    { name: 'bad', phase: 'bogus', text: 'X' },
    { name: 'legacy', text: 'L' },
  ]
  assert.deepEqual(filterInjectByPhase(items, { promoted: false, boundary: -1 }).map((i) => i.name), ['a', 'b', 'legacy'])
  assert.deepEqual(filterInjectByPhase(items, STATUS).map((i) => i.name), ['a', 'c', 'legacy'])
  assert.deepEqual(filterReplacementsByPhase(items, { promoted: false, boundary: 1 }).map((i) => i.name), ['a', 'legacy'])
})

test('pickToolsFilter：三阶段各取自己那份 EntryRef 名单', () => {
  const tools = {
    exclude: [ref('active', G)],
    bootstrap: { exclude: [ref('boot', P)] },
    compaction: { add: [ref('comp', A)] },
  }
  assert.deepEqual(pickToolsFilter(tools, { promoted: false, boundary: -1 }), { exclude: [ref('boot', P)], add: [] })
  assert.deepEqual(pickToolsFilter(tools, STATUS), { exclude: [ref('active', G)], add: [] })
  assert.deepEqual(pickToolsFilter(tools, { promoted: false, boundary: 1 }), { exclude: [], add: [ref('comp', A)] })
})

test('effectiveConfig：输出各阶段 EntryRef、replacements、inject、tools；未知 phase 条目忽略', () => {
  const cfg = effectiveConfig({
    sections: [ref('a', G)],
    sectionsBootstrap: [ref('b', P)],
    replacements: [
      { name: 'a', source: G, phase: 'active', text: 'A' },
      { name: 'bad', phase: 'nonsense', text: 'X' },
    ],
    inject: [
      { name: 'note', order: 0, text: 'N' },
      { name: 'bad', phase: 'nonsense', text: 'X' },
    ],
    tools: { exclude: [ref('bash', G)] },
  })
  assert.deepEqual(cfg.sections, [ref('a', G)])
  assert.deepEqual(cfg.sectionsBootstrap, [ref('b', P)])
  assert.deepEqual(cfg.sectionsCompaction, [])
  assert.deepEqual(cfg.replacements, [{ name: 'a', source: G, phase: 'active', text: 'A' }])
  assert.deepEqual(cfg.inject, [{ name: 'note', order: 0, text: 'N' }])
  assert.deepEqual(cfg.tools, { exclude: [ref('bash', G)] })
})

test('mergeOverrideLayers：按阶段并集（工作区可加不可减），replacements/inject 追加，tools 并集', () => {
  const preset = {
    sections: [ref('a', G)],
    sectionsBootstrap: [ref('boot', P)],
    replacements: [{ name: 'a', source: G, phase: 'always', text: 'P' }],
    inject: [{ name: 'i', order: 1, text: 'p' }],
    tools: { exclude: [ref('t1', G)], add: [ref('r1', G)], bootstrap: { exclude: [ref('b1', P)] } },
  }
  const workspace = {
    sections: [ref('b', P), ref('a', G)],
    sectionsBootstrap: [ref('boot2', P)],
    replacements: [{ name: 'b', source: P, phase: 'active', text: 'W' }],
    inject: [{ name: 'j', order: 0, text: 'w' }],
    tools: { exclude: [ref('t2', P)], bootstrap: { add: [ref('b2', P)] } },
  }
  const merged = mergeOverrideLayers(preset, workspace)
  assert.deepEqual(merged.sections, [ref('a', G), ref('b', P)], '工作区追加，不删除预设条目')
  assert.deepEqual(merged.sectionsBootstrap, [ref('boot', P), ref('boot2', P)])
  assert.deepEqual(merged.replacements, [...preset.replacements, ...workspace.replacements])
  assert.deepEqual(merged.inject, [...preset.inject, ...workspace.inject])
  assert.deepEqual(merged.tools.exclude, [ref('t1', G), ref('t2', P)])
  assert.deepEqual(merged.tools.add, [ref('r1', G)])
  assert.deepEqual(merged.tools.bootstrap.exclude, [ref('b1', P)])
  assert.deepEqual(merged.tools.bootstrap.add, [ref('b2', P)])
  assert.equal('replace' in merged, false)
})

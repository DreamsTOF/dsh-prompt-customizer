/**
 * 超级混沌测试 —— 插件的唯一混沌防线（已吸收并取代早期基本混沌）。
 *
 * 与早期基本混沌的差异：
 *  世界更大且每种子随机   系统段 12~28 个、工具 5~14 个、手动段池 4~10 个
 *  操作池扩展（+9 项）    S-13 快照链（应用后立刻另存为新预设）
 *                         S-14 导出→JSON 往返→导入→应用（与直接应用逐字段对比）
 *                         S-15 删除当前激活的预设
 *                         S-16 极端拖拽（拖到首位 / 末位）
 *                         S-17 白名单全勾选 → 全取消 → 回黑名单循环
 *                         S-18 同名注入段反复覆盖
 *                         S-19 连续切换 3~5 个预设的链
 *                         S-20 稀疏/残缺预设攻击（缺 tools、幽灵锚、sections 含幽灵名）
 *                         S-21 手动段全部删除后立即重建
 *  不变量增强             I1~I9 全部继承（含「保存→立即应用 = 完美不动点」，
 *                         已内联到每个保存操作），另加：
 *    S1  activePreset 恒为 undefined 或指向现存预设 id
 *    S2  【跨端契约·正向】客户端演化出的 cfg 必须能通过宿主端 lib/schema.js 的
 *        schemastery 校验并无损规整（sections/inject/presets 长度与 custom 标识）
 *    S3  导出→导入副本的应用结果 ≡ 原件的应用结果（sections/inject/replace/tools）
 *    S4  对同一预设连续应用三次，第 2、3 次结果与第 1 次完全一致
 *    S6  抽检：任意手动段随时可被 removeSection 干净移除（在副本上验证）
 *    S7  【跨端契约·反向】schema 规整后的配置回灌客户端 mergeSections，
 *        视图段名集合必须与原 cfg 完全一致
 *  规模                   50 种子 × 150 步 = 7500 步
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Config as HostSchema } from '../lib/schema.js'
import {
  addImportedPresets,
  applyPresetData,
  buildPresetData,
  isToolHidden,
  mergeSections,
  removePreset,
  removeSection,
  serializePreset,
  setToolMode,
  toggleTool,
  type Section,
} from '../src/client/presets.ts'
import type { Config, Inventory, Preset } from '../src/client/types.ts'

// ── 可复现伪随机 ─────────────────────────────────────────────────────────────
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

class Rnd {
  private next: () => number
  constructor(seed: number) { this.next = mulberry32(seed) }
  int(n: number): number { return Math.floor(this.next() * n) }
  pick<T>(arr: readonly T[]): T { return arr[this.int(arr.length)]! }
  bool(p = 0.5): boolean { return this.next() < p }
}

// ── 参数化世界 ───────────────────────────────────────────────────────────────
interface World {
  sys: string[]
  tools: string[]
  pool: string[]
  inv: Inventory
}

function makeWorld(rnd: Rnd): World {
  const sys = Array.from({ length: 12 + rnd.int(17) }, (_, i) => 's' + i)
  const tools = Array.from({ length: 5 + rnd.int(10) }, (_, i) => 't' + i)
  const pool = Array.from({ length: 4 + rnd.int(7) }, (_, i) => 'c' + i)
  const inv: Inventory = {
    sections: sys.map((n, i) => ({ name: n, order: i, text: 'text-of-' + n, active: true, replaced: false })),
    tools: [],
  }
  return { sys, tools, pool, inv }
}

function freshCfg(): Config {
  return { sections: [], replace: {}, inject: [], tools: { exclude: [], include: [] }, presets: [] }
}

// ── UI 同构操作（复用导出的纯函数）───────────────────────────────────────────
function mergedOf(w: World, cfg: Config): Section[] {
  return mergeSections(w.inv, cfg, new Set(cfg.sections ?? []))
}

function uiToggleBlock(cfg: Config, name: string): Config {
  const list = (cfg.sections ?? []).slice()
  const i = list.indexOf(name)
  if (i >= 0) list.splice(i, 1)
  else list.push(name)
  return { ...cfg, sections: list }
}

function uiPersist(cfg: Config, ordered: Section[]): Config {
  const list = ordered.map((sec, i) => {
    const existing = (cfg.inject ?? []).find((x) => x.name === sec.name)
    const isCustom = sec.source === 'custom'
    return { name: sec.name, order: i, text: isCustom ? (sec.text ?? '') : (existing?.text ?? ''), custom: isCustom }
  })
  return { ...cfg, inject: list }
}

function uiAddSection(w: World, cfg: Config, name: string, order: number, text: string): Config {
  const next = mergedOf(w, cfg).slice()
  const entry: Section = { name, order, text, active: true, replaced: false, source: 'custom' }
  const i = next.findIndex((x) => x.name === name)
  if (i >= 0) next[i] = entry
  else {
    const j = next.findIndex((x) => x.order > order)
    if (j < 0) next.push(entry)
    else next.splice(j, 0, entry)
  }
  return uiPersist(cfg, next)
}

function uiMove(w: World, cfg: Config, index: number, dir: -1 | 1): Config {
  const merged = mergedOf(w, cfg)
  const target = index + dir
  if (target < 0 || target >= merged.length) return cfg
  const next = merged.slice()
  const [item] = next.splice(index, 1)
  next.splice(target, 0, item!)
  return uiPersist(cfg, next)
}

function uiDragTo(w: World, cfg: Config, src: string, dstIndex: number): Config {
  const merged = mergedOf(w, cfg)
  const dragged = merged.find((x) => x.name === src)
  if (!dragged) return cfg
  const next = merged.filter((x) => x.name !== src)
  next.splice(Math.max(0, Math.min(dstIndex, next.length)), 0, dragged)
  return uiPersist(cfg, next)
}

function uiDrag(w: World, cfg: Config, src: string, dst: string, pos: 'above' | 'below'): Config {
  const merged = mergedOf(w, cfg)
  if (src === dst) return cfg
  const idx = merged.findIndex((x) => x.name === dst)
  return uiDragTo(w, cfg, src, pos === 'above' ? idx : idx + 1)
}

function uiRemoveCustom(cfg: Config, name: string): Config {
  const patch = removeSection(name, cfg)
  return { ...cfg, sections: patch.sections, inject: patch.inject, replace: patch.replace }
}

function uiApplyW(w: World, cfg: Config, preset: Preset): Config {
  const currentNames = new Set(mergedOf(w, cfg).map((s) => s.name))
  const patch = applyPresetData(preset.data, cfg, currentNames)
  return { ...cfg, sections: patch.sections, inject: patch.inject, replace: patch.replace, tools: patch.tools, activePreset: preset.id }
}

function uiSave(w: World, cfg: Config, name: string, id: string): Config {
  const data = buildPresetData(cfg, mergedOf(w, cfg))
  return { ...cfg, presets: [...(cfg.presets ?? []), { id, name, data }] }
}

function uiDeletePreset(cfg: Config, id: string): Config {
  const next = removePreset(cfg.presets ?? [], id, cfg.activePreset)
  return { ...cfg, presets: next.presets, ...(next.activeId === undefined && cfg.activePreset === id ? { activePreset: undefined } : {}) }
}

// ── 不变量校验（继承普通混沌 I1~I9 + 超级 S1/S2/S6）──────────────────────────
function checkInvariants(w: World, cfg: Config, tag: string): void {
  const sections = cfg.sections ?? []
  const inject = cfg.inject ?? []
  const presets = cfg.presets ?? []

  assert.ok(sections.every((n) => typeof n === 'string'), `${tag}: sections 全为字符串`)
  assert.equal(new Set(sections).size, sections.length, `${tag}: sections 无重复`)

  const injNames = new Set(inject.map((x) => x.name))
  assert.equal(injNames.size, inject.length, `${tag}: inject 名称唯一`)
  for (const x of inject) {
    assert.equal(typeof x.order, 'number', `${tag}: inject.order 数字 (${x.name})`)
    assert.ok(Number.isFinite(x.order), `${tag}: inject.order 有限 (${x.name})`)
    assert.equal(typeof x.text, 'string', `${tag}: inject.text 字符串 (${x.name})`)
    assert.equal(typeof x.custom, 'boolean', `${tag}: inject.custom 布尔 (${x.name})`)
    if (!x.custom) assert.equal(x.text, '', `${tag}: 系统条目不携带文本 (${x.name})`)
  }

  const ids = presets.map((p) => p.id)
  assert.equal(new Set(ids).size, ids.length, `${tag}: 预设 id 唯一`)
  assert.ok(presets.every((p) => typeof p.name === 'string' && p.name !== ''), `${tag}: 预设名非空`)

  // S1 激活指针有效
  if (cfg.activePreset !== undefined) assert.ok(ids.includes(cfg.activePreset), `${tag}: activePreset 指向存在的预设`)

  const merged = mergedOf(w, cfg)
  const mergedNames = new Set(merged.map((s) => s.name))
  const orders = merged.map((s) => s.order)
  assert.deepEqual(orders, [...orders].sort((a, b) => a - b), `${tag}: 视图按 order 升序（允许并列）`)
  for (const n of w.sys) assert.ok(mergedNames.has(n), `${tag}: 系统段 ${n} 恒可见`)
  for (const x of inject) {
    if (!x.custom) continue
    const row = merged.find((s) => s.name === x.name)
    assert.ok(row, `${tag}: 手动段 ${x.name} 可见`)
    assert.equal(row!.source, 'custom', `${tag}: ${x.name} 判为手动`)
    assert.equal(row!.text, x.text, `${tag}: 手动段 ${x.name} 回显自身文本`)
  }

  const known = new Set(mergedNames)
  for (const p of presets) for (const o of p.data.order ?? []) known.add(o.name)
  for (const b of sections) assert.ok(known.has(b), `${tag}: 被屏蔽的 ${b} 指向真实段`)

  const inc = cfg.tools?.include ?? []
  const exc = cfg.tools?.exclude ?? []
  assert.ok(inc.every((t) => w.tools.includes(t)), `${tag}: include ⊆ 工具全集`)
  assert.ok(exc.every((t) => w.tools.includes(t)), `${tag}: exclude ⊆ 工具全集`)
  assert.equal(new Set(inc).size, inc.length, `${tag}: include 无重复`)
  assert.equal(new Set(exc).size, exc.length, `${tag}: exclude 无重复`)
  for (const t of inc) assert.ok(!exc.includes(t), `${tag}: include/exclude 不相交 (${t})`)

  // S2 跨端契约：客户端 cfg 必须通过宿主 schema 并关键结构无损。
  let normalized: ReturnType<typeof HostSchema>
  try {
    normalized = HostSchema(JSON.parse(JSON.stringify(cfg))) as ReturnType<typeof HostSchema>
  } catch (e) {
    throw new Error(`${tag}: 宿主 schema 拒收客户端配置：${e instanceof Error ? e.message : String(e)}`)
  }
  assert.equal(normalized.sections.length, sections.length, `${tag}: schema 规整后 sections 数不变`)
  assert.equal(normalized.inject.length, inject.length, `${tag}: schema 规整后 inject 数不变`)
  assert.equal(normalized.presets.length, presets.length, `${tag}: schema 规整后 presets 数不变`)
  for (let i = 0; i < inject.length; i++) {
    assert.equal(normalized.inject[i]!.custom, inject[i]!.custom === true, `${tag}: schema 规整保留 custom 标识 (#${i})`)
    assert.equal(normalized.inject[i]!.name, inject[i]!.name, `${tag}: schema 规整保留 name (#${i})`)
  }

  // S7 跨端契约·反向：规整值回灌客户端视图，段名集合守恒。
  const viewNames = new Set(mergedNames)
  const reView = new Set(
    mergeSections(w.inv, normalized as unknown as Config, new Set(normalized.sections as string[])).map((s) => s.name),
  )
  assert.equal(reView.size, viewNames.size, `${tag}: S7 回灌后视图大小一致`)
  for (const n of viewNames) assert.ok(reView.has(n), `${tag}: S7 回灌丢失段 ${n}`)

  // S6 抽检：取第一个手动段，在副本上必须可被干净移除。
  const customs = inject.filter((x) => x.custom)
  if (customs.length > 0) {
    const victim = customs[0]!
    const copy = JSON.parse(JSON.stringify(cfg)) as Config
    const patch = removeSection(victim.name!, copy)
    assert.ok(!patch.inject.some((x) => x.name === victim.name), `${tag}: S6 ${victim.name} 可从 inject 移除`)
    assert.ok(!patch.sections.includes(victim.name!), `${tag}: S6 ${victim.name} 可从 sections 移除`)
  }
}

/** 应用预设后的专项校验（I8/S3/S4）。 */
function checkAfterApply(w: World, before: Config, preset: Preset, after: Config, tag: string): void {
  const pOrder = preset.data.order ?? []
  const pNames = new Set(pOrder.map((o) => o.name))

  const afterNames = new Set(mergedOf(w, after).map((s) => s.name))
  for (const b of preset.data.sections ?? []) {
    if (afterNames.has(b)) assert.ok(after.sections!.includes(b), `${tag}: 自身屏蔽 ${b} 存活`)
  }
  if (pOrder.length > 0) {
    for (const n of afterNames) {
      if (!pNames.has(n)) assert.ok(after.sections!.includes(n), `${tag}: 名单外段 ${n} 被禁用`)
    }
  }
  for (const x of before.inject ?? []) {
    if (!x.custom || pNames.has(x.name)) continue
    const kept = after.inject!.find((y) => y.name === x.name)
    assert.ok(kept, `${tag}: 手动段 ${x.name} 未被丢弃`)
    assert.equal(kept!.custom, true, `${tag}: 手动段 ${x.name} 标识保留`)
    assert.equal(kept!.text, x.text, `${tag}: 手动段 ${x.name} 文本保留`)
  }

  // S4 三连应用幂等
  const twice = uiApplyW(w, after, preset)
  assert.deepEqual(twice, after, `${tag}: 二次应用幂等`)
  const thrice = uiApplyW(w, twice, preset)
  assert.deepEqual(thrice, twice, `${tag}: 三次应用幂等`)
}

// ── 超级混沌主循环 ───────────────────────────────────────────────────────────
function runSuperChaos(seed: number, steps: number): void {
  const rnd = new Rnd(seed)
  const w = makeWorld(rnd)
  let cfg = freshCfg()
  let idc = 0
  const nid = (): string => 'p' + (++idc)

  const names = (): string[] => mergedOf(w, cfg).map((s) => s.name)

  /** S3：导出→JSON→导入副本，应用结果必须与原件逐字段一致。 */
  const roundTripCheck = (origin: Preset, tag: string): void => {
    const exported = JSON.parse(JSON.stringify(serializePreset(origin))) as ReturnType<typeof serializePreset>
    const imported = addImportedPresets([], exported, () => nid())[0]!
    const viaOrigin = uiApplyW(w, cfg, origin)
    const viaCopy = uiApplyW(w, cfg, imported)
    assert.deepEqual(
      { s: viaCopy.sections, i: viaCopy.inject, r: viaCopy.replace, t: viaCopy.tools },
      { s: viaOrigin.sections, i: viaOrigin.inject, r: viaOrigin.replace, t: viaOrigin.tools },
      `${tag}: 导出→导入往返一致`,
    )
  }

  for (let step = 0; step < steps; step++) {
    const tag = `super seed=${seed} step=${step}`
    try {
      const roll = rnd.int(26)
      if (roll < 3) {
        cfg = uiToggleBlock(cfg, rnd.pick(names()))
      } else if (roll < 5) {
        const replace = { ...(cfg.replace ?? {}) }
        const name = rnd.pick(names())
        const draft = rnd.bool(0.75) ? `R-${seed}-${step}` : ' '
        if (draft.trim() === '') delete replace[name!]
        else replace[name!] = draft
        cfg = { ...cfg, replace }
      } else if (roll < 8) {
        const customs = (cfg.inject ?? []).filter((x) => x.custom)
        const name = customs.length > 0 && rnd.bool(0.35)
          ? rnd.pick(customs).name!
          : rnd.bool(0.12) ? rnd.pick(w.sys) : rnd.pick(w.pool)
        cfg = uiAddSection(w, cfg, name!, rnd.int(w.sys.length + 8) - 2, `C-${seed}-${step}`)
      } else if (roll < 10) {
        cfg = uiMove(w, cfg, rnd.int(names().length), rnd.bool() ? -1 : 1)
      } else if (roll < 12) {
        const ns = names()
        const from = rnd.pick(ns)
        const targets = ns.filter((n) => n !== from)
        if (targets.length > 0) cfg = uiDrag(w, cfg, from!, rnd.pick(targets)!, rnd.bool() ? 'above' : 'below')
      } else if (roll < 13) {
        // S-16 极端拖拽：拖到首位或末位
        const ns = names()
        if (ns.length > 1) cfg = uiDragTo(w, cfg, rnd.pick(ns), rnd.bool() ? 0 : ns.length - 1)
      } else if (roll < 14) {
        const customs = (cfg.inject ?? []).filter((x) => x.custom)
        if (customs.length > 0) cfg = uiRemoveCustom(cfg, rnd.pick(customs).name!)
      } else if (roll < 16) {
        const t = rnd.pick(w.tools)
        cfg = { ...cfg, tools: toggleTool(t, isToolHidden(t, cfg.tools), cfg.tools) }
      } else if (roll < 17) {
        // S-17 白名单全勾选 → 全取消 → 回黑名单
        let tools = setToolMode(true, cfg.tools, w.tools)
        for (const t of w.tools) tools = toggleTool(t, isToolHidden(t, tools), tools)
        cfg = { ...cfg, tools: setToolMode(false, tools, w.tools) }
      } else if (roll < 19) {
        // S-18 同名注入覆盖
        const customs = (cfg.inject ?? []).filter((x) => x.custom)
        if (customs.length > 0 || rnd.bool()) {
          const name = customs.length > 0 ? rnd.pick(customs).name! : rnd.pick(w.pool)
          cfg = uiAddSection(w, cfg, name!, rnd.int(names().length), `O-${seed}-${step}`)
        }
      } else if (roll < 21) {
        // 9. 保存预设 + 内联不动点校验。
        // 注意：不动点定义在「UI 视图」层面——cfg.inject 是实现细节，
        // 对从未排序过的配置（inject 为空或部分覆盖）应用快照会把完整
        // 顺序写入 inject，但用户看到的行序列、屏蔽、替换、工具必须零变化。
        const id = nid()
        const snapshotted = uiSave(w, cfg, `P${rnd.int(1000)}`, id)
        const saved = snapshotted.presets!.find((p) => p.id === id)!
        const applied = uiApplyW(w, snapshotted, saved)
        const viewOf = (c: Config): unknown[] =>
          mergedOf(w, c).map((s) => ({ name: s.name, text: s.source === 'custom' ? s.text : '' }))
        assert.deepEqual(viewOf(applied), viewOf(snapshotted), `${tag}: 不动点·视图行序列`)
        assert.deepEqual(applied.sections, snapshotted.sections, `${tag}: 不动点 sections`)
        assert.deepEqual(applied.replace, snapshotted.replace, `${tag}: 不动点 replace`)
        assert.deepEqual(applied.tools, snapshotted.tools, `${tag}: 不动点 tools`)
        cfg = snapshotted
      } else if (roll < 22) {
        // S-13 快照链：应用后立刻另存
        if ((cfg.presets ?? []).length > 0) {
          cfg = uiApplyW(w, cfg, rnd.pick(cfg.presets!))
          cfg = uiSave(w, cfg, `SNAP-${seed}-${step}`, nid())
        }
      } else if (roll < 24) {
        // S-19 连续切换 3~5 个预设
        if ((cfg.presets ?? []).length > 0) {
          const chain = 3 + rnd.int(3)
          for (let k = 0; k < chain && (cfg.presets ?? []).length > 0; k++) {
            const before = cfg
            const preset = rnd.pick(cfg.presets!)
            cfg = uiApplyW(w, cfg, preset)
            checkAfterApply(w, before, preset, cfg, `${tag} 链[${preset.name}]#${k}`)
            checkInvariants(w, cfg, `${tag} 链#${k}`)
          }
          // S-3 对链尾所在状态做一次往返校验
          roundTripCheck(rnd.pick(cfg.presets!), tag)
        }
      } else if (roll < 25) {
        // S-20 稀疏/残缺但形状合法的预设：缺 tools、幽灵锚、sections 引用 order 内的幽灵名。
        // 约束 sections ⊆ order 名（与真实快照一致的形状），否则会制造不可见幽灵屏蔽。
        // 先入库再应用（与真实 UI 的导入→应用路径一致，保证 activePreset 有效）。
        const sparse: Preset = {
          id: nid(),
          name: `SPARSE-${step}`,
          data: {
            sections: rnd.bool(0.5) ? ['ghost-y'] : [w.sys[0]!],
            replace: {},
            order: [
              { name: 'ghost-y', text: '' },
              { name: w.sys[0]!, after: 'ghost-y', text: '', custom: rnd.bool() },
            ],
          },
        }
        cfg = { ...cfg, presets: [...(cfg.presets ?? []), sparse] }
        const before = cfg
        cfg = uiApplyW(w, cfg, sparse)
        checkAfterApply(w, before, sparse, cfg, `${tag} 稀疏`)
      } else if (roll < 26) {
        // S-21 手动段全部删除后立即重建一个
        for (const x of (cfg.inject ?? []).filter((x) => x.custom)) cfg = uiRemoveCustom(cfg, x.name!)
        cfg = uiAddSection(w, cfg, rnd.pick(w.pool), rnd.int(names().length), `RE-${seed}-${step}`)
      } else {
        // S-15 / 应用：高概率先删激活预设，再随机应用或删除
        if (cfg.activePreset !== undefined && rnd.bool(0.5)) cfg = uiDeletePreset(cfg, cfg.activePreset)
        if ((cfg.presets ?? []).length > 0) {
          const preset = rnd.pick(cfg.presets!)
          if (rnd.bool(0.25)) {
            cfg = uiDeletePreset(cfg, preset.id)
          } else {
            const before = cfg
            cfg = uiApplyW(w, cfg, preset)
            checkAfterApply(w, before, preset, cfg, `${tag} 应用[${preset.name}]后`)
            if (rnd.bool(0.3)) roundTripCheck(preset, tag)
          }
        }
      }

      checkInvariants(w, cfg, tag)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      throw new Error(`超级混沌失败 [${tag}]：${msg}`)
    }
  }
}

test('super-chaos: 随机大世界 + 扩展操作池 + 跨端 schema 双向契约，全程不变量成立', () => {
  for (let seed = 1; seed <= 50; seed++) runSuperChaos(seed, 150)
})

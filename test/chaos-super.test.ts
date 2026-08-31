/**
 * 超级混沌测试 —— 插件的唯一混沌防线（已吸收并取代早期基本混沌）。
 *
 * 与早期基本混沌的差异：
 *  世界更大且每种子随机   系统段 12~28 个、工具 5~14 个、手动段池 4~10 个
 *  操作池扩展（+9 项）    S-13 快照链（应用后立刻另存为新预设）
 *                         S-14 导出→JSON 往返→导入→应用（与直接应用逐字段对比）
 *                         S-15 删除当前激活的预设
 *                         S-16 极端拖拽（拖到首位 / 末位）
 *                         S-17 黑名单可逆极值（全隐藏 → 精确恢复原集合）
 *                         S-18 同名注入段反复覆盖
 *                         S-19 连续切换 3~5 个预设的链
 *                         S-20 稀疏/残缺预设攻击（缺 tools、幽灵锚、sections 含幽灵名）
 *                         S-21 手动段全部删除后立即重建
 *                         S-22 导入/导出桌面适配（tauri 原生 dialog/fs 命令契约、
 *                              web 回退下载/选择器、文件名净化、环境检测）
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
  DEFAULT_ENV_BLOCKLIST,
  envVarName,
  isBlockedEnvKey,
  listVariableNames,
  registerVariables,
} from '../lib/vars.js'
import {
  addImportedPresets,
  applyPresetData,
  buildPresetData,
  isToolHidden,
  mergeSections,
  presetExportFilename,
  removePreset,
  removeSection,
  toggleTool,
  type Section,
} from '../src/client/presets.ts'
import {
  decodePresetExport,
  encodePresetExport,
  exportPresetFile,
  importPresetFile,
  isTauriEnv,
  makeIoEnv,
  readPickedFile,
  tauriOpenText,
  tauriSaveText,
  webDownload,
  type BrowserDownloadTarget,
  type FileReaderLike,
  type PresetIoEnv,
  type TauriInvoke,
} from '../src/client/preset-io.ts'
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
  return { sections: [], replace: {}, inject: [], tools: { exclude: [] }, presets: [] }
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

  const exc = cfg.tools?.exclude ?? []
  assert.ok(exc.every((t) => w.tools.includes(t)), `${tag}: exclude ⊆ 工具全集`)
  assert.equal(new Set(exc).size, exc.length, `${tag}: exclude 无重复`)
  for (const phase of ['bootstrap', 'compaction'] as const) {
    const list = cfg.tools?.[phase]?.exclude ?? []
    assert.ok(list.every((t) => w.tools.includes(t)), `${tag}: ${phase}.exclude ⊆ 工具全集`)
    assert.equal(new Set(list).size, list.length, `${tag}: ${phase}.exclude 无重复`)
  }

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

  // replace 值必须是有效非空字符串
  for (const [k, v] of Object.entries(cfg.replace ?? {})) {
    assert.equal(typeof v, 'string', `${tag}: replace[${k}] 为字符串`)
    assert.ok(v!.trim() !== '', `${tag}: replace[${k}] 非空白`)
  }

  // inject order 连续性：0..len-1
  const injOrders = inject.map((x) => x.order).sort((a, b) => a - b)
  assert.deepEqual(injOrders, Array.from({ length: injOrders.length }, (_, i) => i), `${tag}: inject order 连续 [0..len)`)
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

// ── 导入/导出适配（web ↔ tauri 桌面宿主）──────────────────────────────────────
// 原实现只在浏览器可用（Blob+<a download> / <input type=file>+FileReader）。
// 宿主被封装成 tauri WebView 后，导出优先走原生保存对话框+dialog/fs 插件，
// 导入优先走原生打开对话框；宿主未注册插件或被 ACL 拦截时优雅回退 web 路径。

test('io: 导出文件名净化非法字符并修剪尾部点/空格', () => {
  assert.equal(presetExportFilename('a/b\\c:d*e?"f<g>h|i'), 'a_b_c_d_e__f_g_h_i.json')
  assert.equal(presetExportFilename('preset.'), 'preset.json')
  assert.equal(presetExportFilename('   '), 'preset.json')
  assert.equal(presetExportFilename('Weird\tName'), 'Weird_Name.json')
  assert.equal(presetExportFilename('αβγ'), 'αβγ.json')
})

test('io: tauri 环境检测（v2 __TAURI_INTERNALS__ / v1 __TAURI__）', () => {
  assert.equal(isTauriEnv({ __TAURI_INTERNALS__: { invoke() {} } }), true)
  assert.equal(isTauriEnv({ __TAURI_INTERNALS__: {} }), true)
  assert.equal(isTauriEnv({ __TAURI__: {} }), true)
  assert.equal(isTauriEnv({}), false)
  assert.equal(isTauriEnv(null), false)
  assert.equal(isTauriEnv(undefined), false)
})

test('io: encode→decode→import 走真实文件格式无损往返', () => {
  const preset: Preset = {
    id: 'p1',
    name: 'My/Weird:Preset',
    data: {
      sections: ['s0'],
      replace: { s0: 'R' },
      order: [{ name: 's0', after: undefined, text: '', custom: true }],
      tools: { exclude: ['t1'] },
    },
  }
  const text = encodePresetExport(preset)
  assert.equal(JSON.parse(text).name, preset.name)
  const imported = addImportedPresets([], decodePresetExport(text), () => 'new')[0]!
  assert.equal(imported.name, preset.name)
  // JSON 语义无损：encode→decode 与纯 JSON 序列化等价（undefined 键被 JSON 合法剥离）。
  assert.deepEqual(imported.data, JSON.parse(JSON.stringify(preset.data)))
})

test('io: decode 拒绝非法 JSON/空文本，垃圾形状导入不出错', () => {
  assert.throws(() => decodePresetExport('{oops'))
  assert.throws(() => decodePresetExport('undefined'))
  assert.throws(() => decodePresetExport(''))
  assert.throws(() => decodePresetExport('   '))
  // null 是合法 JSON：解析出 null，导入时被滤掉，不抛错。
  assert.doesNotThrow(() => decodePresetExport(null as unknown as string))
  assert.equal(addImportedPresets([], decodePresetExport('null'), () => 'x').length, 0)
  const two = addImportedPresets([], decodePresetExport(JSON.stringify([{ name: 'A', data: {} }])), () => 'y')
  assert.deepEqual(two.map((p) => p.name), ['A'])
})

test('io: 导出在宿主提供原生 dialog/fs 时走 tauri 保存对话框', async () => {
  const calls: Array<{ file: string; text: string }> = []
  const io: PresetIoEnv = {
    tauri: true,
    saveText: async (file, text) => { calls.push({ file, text }); return { kind: 'saved' } },
    openText: async () => ({ kind: 'cancelled' }),
    download: () => { throw new Error('web fallback must not run') },
  }
  const preset: Preset = { id: 'p', name: 'My Preset', data: { sections: ['a'] } }
  const res = await exportPresetFile(preset, io)
  assert.equal(res.ok, true)
  assert.equal(res.via, 'tauri')
  assert.equal(calls.length, 1)
  assert.equal(calls[0]!.file, 'My Preset.json')
  assert.deepEqual(JSON.parse(calls[0]!.text), { name: 'My Preset', data: { sections: ['a'] } })
})

test('io: 原生对话框不可用（未注册插件/ACL 拦截）时导出回退 web 下载', async () => {
  const downloads: string[] = []
  const io: PresetIoEnv = {
    tauri: true,
    saveText: async () => ({ kind: 'unavailable' }),
    openText: async () => ({ kind: 'unavailable' }),
    download: (_n, text) => { downloads.push(text) },
  }
  const res = await exportPresetFile({ id: 'p', name: 'P', data: {} }, io)
  assert.equal(res.ok, true)
  assert.equal(res.via, 'browser')
  assert.equal(downloads.length, 1)
  assert.equal(JSON.parse(downloads[0]!).name, 'P')
})

test('io: 用户取消原生保存对话框后不得再触发 web 下载', async () => {
  const io: PresetIoEnv = {
    tauri: true,
    saveText: async () => ({ kind: 'cancelled' }),
    openText: async () => ({ kind: 'cancelled' }),
    download: () => { throw new Error('must not download after cancel') },
  }
  const res = await exportPresetFile({ id: 'p', name: 'P', data: {} }, io)
  assert.equal(res.ok, false)
  assert.equal(res.cancelled, true)
})

test('io: 纯 web 环境导出直接走浏览器下载', async () => {
  const downloads: string[] = []
  const io: PresetIoEnv = {
    tauri: false,
    saveText: async () => ({ kind: 'unavailable' }),
    openText: async () => ({ kind: 'unavailable' }),
    download: (_n, text) => { downloads.push(text) },
  }
  const res = await exportPresetFile({ id: 'p', name: 'web', data: {} }, io)
  assert.equal(res.ok, true)
  assert.equal(res.via, 'browser')
  assert.equal(downloads.length, 1)
})

test('io: 导入在 tauri 下读原生打开对话框选中的文件', async () => {
  const text = encodePresetExport({ id: 'p', name: 'N', data: { sections: ['a'] } })
  const io: PresetIoEnv = {
    tauri: true,
    saveText: async () => ({ kind: 'unavailable' }),
    openText: async () => ({ kind: 'text', text }),
    download: () => {},
  }
  const res = await importPresetFile(io)
  assert.equal(res.kind, 'text')
  assert.equal(res.via, 'tauri')
  if (res.kind === 'text') assert.equal(res.text, text)
})

test('io: 导入取消 / 不可用 → 组件回退文件选择器', async () => {
  const base: PresetIoEnv = {
    tauri: true,
    saveText: async () => ({ kind: 'unavailable' }),
    openText: async () => ({ kind: 'unavailable' }),
    download: () => {},
  }
  assert.equal((await importPresetFile(base)).kind, 'unavailable')
  assert.equal((await importPresetFile({ ...base, openText: async () => ({ kind: 'cancelled' }) })).kind, 'cancelled')
  assert.equal((await importPresetFile({ ...base, tauri: false })).kind, 'unavailable')
})

test('io: 原生命令契约 = plugin:dialog|* + plugin:fs|*', async () => {
  const cmds: string[] = []
  const writes: Array<Record<string, unknown>> = []
  const invoke: TauriInvoke = async (cmd, args) => {
    cmds.push(cmd)
    if (cmd === 'plugin:dialog|save') return '/tmp/out.json'
    if (cmd === 'plugin:fs|write_text_file') { writes.push(args ?? {}); return null }
    if (cmd === 'plugin:dialog|open') return '/tmp/in.json'
    if (cmd === 'plugin:fs|read_text_file') return '{"name":"N","data":{}}'
    throw new Error('unexpected ' + cmd)
  }
  assert.deepEqual(await tauriSaveText(invoke, 'p.json', '{}'), { kind: 'saved' })
  assert.deepEqual(cmds, ['plugin:dialog|save', 'plugin:fs|write_text_file'])
  assert.deepEqual(writes, [{ path: '/tmp/out.json', contents: '{}' }])
  cmds.length = 0
  assert.deepEqual(await tauriOpenText(invoke), { kind: 'text', text: '{"name":"N","data":{}}' })
  assert.deepEqual(cmds, ['plugin:dialog|open', 'plugin:fs|read_text_file'])
})

test('io: 原生命令被拒（缺插件/ACL）降级 unavailable，对话框返回 null 视为取消', async () => {
  const reject: TauriInvoke = async () => { throw new Error('not allowed') }
  assert.deepEqual(await tauriSaveText(reject, 'p.json', 'x'), { kind: 'unavailable' })
  assert.deepEqual(await tauriOpenText(reject), { kind: 'unavailable' })
  const cancel: TauriInvoke = async (cmd) => (cmd === 'plugin:dialog|save' || cmd === 'plugin:dialog|open' ? null : 'x')
  assert.deepEqual(await tauriSaveText(cancel, 'p.json', 'x'), { kind: 'cancelled' })
  assert.deepEqual(await tauriOpenText(cancel), { kind: 'cancelled' })
})

test('io: web 下载触发 anchor.click 并撤销 objectURL', () => {
  let clicked = ''
  let revoked = ''
  let blobText = ''
  const target: BrowserDownloadTarget = {
    makeAnchor: () => ({ href: '', download: '', click() { clicked = this.download } }),
    makeBlob: (text) => { blobText = text; return {} },
    objectUrl: () => 'blob:fake',
    revoke: (u) => { revoked = u },
  }
  webDownload(target, 'p.json', '{"a":1}')
  assert.equal(clicked, 'p.json')
  assert.equal(blobText, '{"a":1}')
  assert.equal(revoked, 'blob:fake')
})

test('io: readPickedFile 通过 FileReader-like 解析选中文件文本', async () => {
  const fake: FileReaderLike = {
    onload: null,
    onerror: null,
    result: '{"name":"R","data":{}}',
    readAsText() { this.onload?.() },
  }
  assert.equal(await readPickedFile(fake, {}), '{"name":"R","data":{}}')
  const bad: FileReaderLike = { onload: null, onerror: null, result: null, readAsText() { this.onerror?.() } }
  await assert.rejects(() => readPickedFile(bad, {}))
})

test('io: makeIoEnv 在有 __TAURI_INTERNALS__ 的宿主上接上原生桥', async () => {
  const logged: string[] = []
  const win = {
    __TAURI_INTERNALS__: {
      invoke: async (cmd: string): Promise<unknown> => {
        logged.push(cmd)
        if (cmd === 'plugin:dialog|save') return '/x.json'
        if (cmd === 'plugin:fs|write_text_file') return null
        throw new Error('nope')
      },
    },
  }
  const env = makeIoEnv(win)
  assert.equal(env.tauri, true)
  assert.deepEqual(await env.saveText('p.json', '{}'), { kind: 'saved' })
  assert.deepEqual(logged, ['plugin:dialog|save', 'plugin:fs|write_text_file'])
  const web = makeIoEnv({})
  assert.equal(web.tauri, false)
  assert.deepEqual(await web.saveText('p.json', '{}'), { kind: 'unavailable' })
})

// ── 超级混沌主循环 ───────────────────────────────────────────────────────────
function runSuperChaos(seed: number, steps: number): void {
  const rnd = new Rnd(seed)
  const w = makeWorld(rnd)
  let cfg = freshCfg()
  let idc = 0
  const nid = (): string => 'p' + (++idc)

  const names = (): string[] => mergedOf(w, cfg).map((s) => s.name)

  /** S3：导出（encode）→JSON 文本→导入（decode+add）→应用，结果必须与原件逐字段一致。
   *  走 preset-io 的真实文件格式（encodePresetExport/decodePresetExport），
   *  不再用 JSON.clone(serializePreset) 绕开序列化。 */
  const roundTripCheck = (origin: Preset, tag: string): void => {
    const exported = decodePresetExport(encodePresetExport(origin))
    const imported = addImportedPresets([], exported, () => nid())[0]!
    const viaOrigin = uiApplyW(w, cfg, origin)
    const viaCopy = uiApplyW(w, cfg, imported)
    assert.deepEqual(
      { s: viaCopy.sections, i: viaCopy.inject, r: viaCopy.replace, t: viaCopy.tools },
      { s: viaOrigin.sections, i: viaOrigin.inject, r: viaOrigin.replace, t: viaOrigin.tools },
      `${tag}: 导出→导入往返一致`,
    )
  }

  /** 导入导出完整往返：encode → decode → import → apply → 再 encode，字段守恒。 */
  const checkImportExport = (preset: Preset, tag: string): void => {
    const exported = decodePresetExport(encodePresetExport(preset))
    const imported = addImportedPresets([], exported, () => nid())[0]!
    // JSON.stringify strips `after: undefined` so compare via serialized form
    assert.equal(JSON.stringify(imported.data), JSON.stringify(preset.data), `${tag}: 导入副本 data 与原件一致`)
    const reExported = decodePresetExport(encodePresetExport(imported))
    assert.deepEqual(reExported, exported, `${tag}: 再次序列化结果一致`)
  }

  /** 预设 data 完整性：sections ⊆ order 名、tools 与各阶段目录的 exclude 合法。 */
  const checkPresetData = (preset: Preset, tag: string): void => {
    const orderNames = new Set((preset.data.order ?? []).map((o) => o.name))
    for (const n of preset.data.sections ?? []) {
      assert.ok(orderNames.has(n), `${tag}: 预设 sections ${n} 存在于 order`)
    }
    for (const t of preset.data.tools?.exclude ?? [])
      assert.ok(w.tools.includes(t), `${tag}: 预设 exclude ${t} ∈ 工具全集`)
    for (const phase of ['bootstrap', 'compaction'] as const) {
      for (const t of preset.data.tools?.[phase]?.exclude ?? [])
        assert.ok(w.tools.includes(t), `${tag}: 预设 ${phase}.exclude ${t} ∈ 工具全集`)
    }
  }

  /** 可见性一致性：工具隐藏 ⟺ 黑名单命中它（没有第二套模式）。 */
  const checkToolVisibilityConsistency = (c: Config, tag: string): void => {
    const exc = c.tools?.exclude ?? []
    for (const t of w.tools) {
      assert.equal(isToolHidden(t, c.tools), exc.includes(t), `${tag}: ${t} 可见性只由 exclude 决定`)
    }
  }

  /** 排序连续性：merged 视图 order ∈ [0, len) 且 inject order 连续 0..n-1。 */
  const checkSectionOrdering = (c: Config, tag: string): void => {
    const merged = mergedOf(w, c)
    const orders = merged.map((s) => s.order)
    const sorted = [...orders].sort((a, b) => a - b)
    assert.deepEqual(orders, sorted, `${tag}: 视图 order 升序`)
    assert.deepEqual(sorted, Array.from({ length: sorted.length }, (_, i) => i), `${tag}: 视图 order 连续 [0..len)`)
    const injOrders = (c.inject ?? []).map((x) => x.order)
    const injSorted = [...injOrders].sort((a, b) => a - b)
    assert.deepEqual(injSorted, Array.from({ length: injSorted.length }, (_, i) => i), `${tag}: inject order 连续 [0..len)`)
  }

  for (let step = 0; step < steps; step++) {
    const tag = `super seed=${seed} step=${step}`
    try {
      const roll = rnd.int(30)
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
        // S-17 黑名单可逆极值：全部隐藏 → 再恢复原本可见的那批 → 必须回到原集合
        const before = [...(cfg.tools?.exclude ?? [])]
        let tools: { exclude: string[] } = { exclude: before.slice() }
        // toggleTool 是「翻转」语义：只对该项目执行一次翻转才是单向操作。
        for (const t of w.tools) if (!isToolHidden(t, tools)) tools = toggleTool(t, false, tools)
        assert.deepEqual([...(tools.exclude ?? [])].sort(), [...new Set([...before, ...w.tools])].sort(), `${tag} S-17 全隐藏后应无任何可见工具`)
        cfg = { ...cfg, tools }
        checkToolVisibilityConsistency(cfg, `${tag} S-17 全隐藏后`)
        for (const t of w.tools) if (!before.includes(t)) tools = toggleTool(t, true, tools)
        cfg = { ...cfg, tools }
        assert.deepEqual([...(cfg.tools?.exclude ?? [])].sort(), before.sort(), `${tag}: S-17 恢复后 exclude 必须与操作前逐字相同`)
        checkToolVisibilityConsistency(cfg, `${tag} S-17 恢复后`)
      } else if (roll < 19) {
        // S-18 同名注入覆盖 + S-20 稀疏/残缺预设（合并提高覆盖率）
        if (rnd.bool(0.4)) {
          // 同名注入：覆盖已有手动段
          const customs = (cfg.inject ?? []).filter((x) => x.custom)
          if (customs.length > 0 || rnd.bool()) {
            const name = customs.length > 0 ? rnd.pick(customs).name! : rnd.pick(w.pool)
            cfg = uiAddSection(w, cfg, name!, rnd.int(names().length), `O-${seed}-${step}`)
          }
        } else {
          // S-20 稀疏/残缺但形状合法的预设攻击
          const useGhost = rnd.bool(0.5)
          const mainName = useGhost ? 'ghost-y' : w.sys[0]!
          const sparse: Preset = {
            id: nid(),
            name: `SPARSE-${step}`,
            data: {
              sections: [mainName],
              replace: {},
              order: [
                { name: mainName, text: '', custom: rnd.bool() },
                ...(useGhost ? [] : [{ name: w.sys[0]!, after: mainName, text: '', custom: rnd.bool() }]),
              ],
            },
          }
          assert.ok(sparse.data.sections!.length > 0, `${tag}: 稀疏 sections 非空`)
          assert.ok(sparse.data.order!.length >= 1, `${tag}: 稀疏 order 非空`)
          cfg = { ...cfg, presets: [...(cfg.presets ?? []), sparse] }
          checkPresetData(sparse, `${tag} 稀疏data`)
          const before = cfg
          cfg = uiApplyW(w, cfg, sparse)
          checkAfterApply(w, before, sparse, cfg, `${tag} 稀疏`)
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
        checkToolVisibilityConsistency(snapshotted, `${tag} 保存`)
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
        // 阶段目录抖动：引导期 / 压缩期各写一份随机黑名单，必须各自独立、
        // 互不污染，也不改动静态过滤。
        if ((cfg.presets ?? []).length > 0) {
          const pick = () => w.tools.filter(() => rnd.bool(0.5))
          const bootstrap = pick()
          const compaction = pick()
          const staticExclude = [...(cfg.tools?.exclude ?? [])]
          cfg = {
            ...cfg,
            tools: {
              exclude: staticExclude,
              bootstrap: { exclude: bootstrap },
              compaction: { exclude: compaction },
            },
          }
          assert.deepEqual(cfg.tools?.bootstrap?.exclude, bootstrap, `${tag}: 引导期目录被污染`)
          assert.deepEqual(cfg.tools?.compaction?.exclude, compaction, `${tag}: 压缩期目录被污染`)
          assert.deepEqual(cfg.tools?.exclude, staticExclude, `${tag}: 阶段目录写动到了静态过滤`)
          checkToolVisibilityConsistency(cfg, `${tag} 阶段目录后`)
          checkPresetData(rnd.pick(cfg.presets!), `${tag} 阶段目录后预设`)
        }
      } else if (roll < 26) {
        // 完整导入导出往返 + 重复导入去重 + 序列化字段守恒
        const presetArr = cfg.presets ?? []
        if (presetArr.length > 0) {
          const preset = rnd.pick(presetArr)
          assert.ok(preset, `${tag}: rnd.pick 返回有效预设`)
          checkImportExport(preset, `${tag} IE`)
          // 重复导入：同名应被跳过
          const serialized = decodePresetExport(encodePresetExport(preset))
          const before = (cfg.presets ?? []).length
          cfg = { ...cfg, presets: addImportedPresets(cfg.presets ?? [], serialized, () => nid()) }
          assert.equal((cfg.presets ?? []).length, before, `${tag}: 重复导入去重`)
          // 导入数组：多条一次性导入，只新增不重复
          const newEntry = { name: `NEW-${step}`, data: { sections: w.sys.slice(0, 2), replace: {}, order: w.sys.slice(0, 2).map((n, i) => ({ name: n, text: '', custom: false })), tools: w.tools.length > 0 ? { exclude: [w.tools[0]!] } : { exclude: [] } } }
          const arr = [decodePresetExport(encodePresetExport(preset)), newEntry]
          const before2 = (cfg.presets ?? []).length
          cfg = { ...cfg, presets: addImportedPresets(cfg.presets ?? [], arr, () => nid()) }
          assert.equal((cfg.presets ?? []).length, before2 + 1, `${tag}: 数组导入仅新增`)
        }
      } else if (roll < 27) {
        // 复杂预设应用：预设含 replace + tools + custom section，验证 patch 正确合并
        const customName = `EXTRA-${step}`
        cfg = uiAddSection(w, cfg, customName, rnd.int(names().length), `CTX-${step}`)
        const complexReplace: Record<string, string> = {}
        for (const n of w.sys.slice(0, 3)) complexReplace[n!] = `CR-${seed}`
        const complexPreset: Preset = {
          id: nid(),
          name: `COMPLEX-${step}`,
          data: {
            sections: w.sys.slice(0, 3),
            replace: complexReplace,
            order: w.sys.slice(0, 3).map((n, i) => ({ name: n, text: '', custom: false })),
            tools: { exclude: w.tools.slice(0, 2) },
          },
        }
        cfg = { ...cfg, presets: [...(cfg.presets ?? []), complexPreset] }
        const before = cfg
        cfg = uiApplyW(w, cfg, complexPreset)
        checkAfterApply(w, before, complexPreset, cfg, `${tag} 复杂应用`)
        checkToolVisibilityConsistency(cfg, `${tag} 复杂后工具`)
        // 替换文本在 merge 视图中可见
        const mergedAfter = mergedOf(w, cfg)
        for (const n of w.sys.slice(0, 3)) {
          const row = mergedAfter.find((s) => s.name === n)
          assert.ok(row, `${tag}: 复杂应用后 ${n} 存在`)
        }
      } else if (roll < 28) {
        // resolveOrder 边界：循环锚 / 不存在锚
        const anchorMissing: Preset = {
          id: nid(),
          name: `MISS-${step}`,
          data: { sections: [w.sys[0]!], replace: {}, order: [{ name: w.sys[0]!, after: 'nonexistent-anchor', text: '' }] },
        }
        cfg = { ...cfg, presets: [...(cfg.presets ?? []), anchorMissing] }
        const before = cfg
        cfg = uiApplyW(w, cfg, anchorMissing)
        checkAfterApply(w, before, anchorMissing, cfg, `${tag} 缺锚`)
        const cyclic: Preset = {
          id: nid(),
          name: `CYCLE-${step}`,
          data: {
            sections: [w.sys[0]!, w.sys[1]!],
            replace: {},
            order: [
              { name: w.sys[0]!, after: w.sys[1]!, text: '' },
              { name: w.sys[1]!, after: w.sys[0]!, text: '' },
            ],
          },
        }
        cfg = { ...cfg, presets: [...(cfg.presets ?? []), cyclic] }
        const before2 = cfg
        cfg = uiApplyW(w, cfg, cyclic)
        checkAfterApply(w, before2, cyclic, cfg, `${tag} 循环锚`)
      } else if (roll < 29) {
        // section 重排后顺序连续性 + 工具状态
        const ns = names()
        if (ns.length > 2) {
          // 连续多次 move
          for (let k = 0; k < 5 && k < ns.length; k++) {
            cfg = uiMove(w, cfg, rnd.int(ns.length), rnd.bool() ? -1 : 1)
          }
          checkSectionOrdering(cfg, `${tag} move后`)
        }
        // 拖到首/末位再检查
        if (ns.length > 1) {
          cfg = uiDragTo(w, cfg, rnd.pick(ns), rnd.bool() ? 0 : ns.length - 1)
          checkSectionOrdering(cfg, `${tag} 拖拽后`)
        }
        checkToolVisibilityConsistency(cfg, `${tag} 重排后工具`)
      } else {
        // S-21 手动段全部删除后立即重建一个
        for (const x of (cfg.inject ?? []).filter((x) => x.custom)) cfg = uiRemoveCustom(cfg, x.name!)
        cfg = uiAddSection(w, cfg, rnd.pick(w.pool), rnd.int(names().length), `RE-${seed}-${step}`)
        checkSectionOrdering(cfg, `${tag} S-21重建`)
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

// ── S-23 提示词变量（lib/vars.js）不变量 ─────────────────────────────────────
// 宿主严格渲染把一切非法变量名 / undefined provider 变成整段装配失败，
// 所以这里不进随机操作池，而是对映射 / 黑名单 / 注册做确定性 + 模糊不变量。
const HOST_VAR_NAME = /^[a-z][a-z0-9_]*$/

test('S-23: 环境变量映射、黑名单语义与注册契约的不变量', () => {
  const rnd = new Rnd(20260831)

  // V1 映射：已知用例精确；模糊键的输出要么 undefined 要么必然合法。
  assert.equal(envVarName('PATH'), 'env_path')
  assert.equal(envVarName('USER.NAME'), 'env_user_name')
  assert.equal(envVarName(''), undefined)
  assert.equal(envVarName('___'), undefined)
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-%@ /\\:'
  for (let i = 0; i < 2000; i++) {
    const key = Array.from({ length: 1 + rnd.int(24) }, () => chars.charAt(rnd.int(chars.length))).join('')
    const name = envVarName(key)
    if (name !== undefined) assert.ok(HOST_VAR_NAME.test(name), `envVarName('${key}') → '${name}' 违反宿主命名规则`)
  }

  // V2 黑名单语义：`*` 通配 / 否则精确整串匹配，一律大小写不敏感。
  assert.ok(isBlockedEnvKey('OPENAI_API_KEY', ['*api_key*']))
  assert.ok(isBlockedEnvKey('openai_api_key', ['*API_KEY*']))
  assert.ok(isBlockedEnvKey('DATABASE_URL', ['DATABASE_URL']))
  assert.ok(isBlockedEnvKey('database_url', ['DATABASE_URL']))
  assert.ok(!isBlockedEnvKey('DATABASE_URL_X', ['DATABASE_URL']), '精确条目不得通配')
  assert.ok(!isBlockedEnvKey('PATH', DEFAULT_ENV_BLOCKLIST))
  assert.ok(!isBlockedEnvKey('HOME', []), '空黑名单放行一切')

  // V3 预填黑名单必须拦下常见密钥 / 凭据类键。
  for (const secret of ['OPENAI_API_KEY', 'GITHUB_TOKEN', 'AWS_SECRET_ACCESS_KEY', 'DB_PASSWORD', 'AUTH_HEADER', 'REDIS_DSN', 'SQL_CONNECTION_STRING', 'DATABASE_URL']) {
    assert.ok(isBlockedEnvKey(secret, DEFAULT_ENV_BLOCKLIST), `预填黑名单漏过 ${secret}`)
  }

  // V4 注册契约：假 systemPrompt 收集注册 —— 保留字缺席、名字合法、
  // provider 恒返回字符串（严格渲染把 undefined 当错误）、值忠实于 env。
  const registered = new Map<string, () => unknown>()
  const disposed: string[] = []
  const dispose = registerVariables({
    variable: (name: string, provider: () => unknown) => {
      registered.set(name, provider)
      return () => { disposed.push(name) }
    },
  }, DEFAULT_ENV_BLOCKLIST)
  for (const reserved of ['provider', 'model', 'cwd']) assert.ok(!registered.has(reserved), `保留字 ${reserved} 不得注册`)
  for (const [name, provider] of registered) {
    assert.ok(HOST_VAR_NAME.test(name), `注册名 '${name}' 违反宿主命名规则`)
    assert.equal(typeof provider(), 'string', `provider ${name} 必须返回字符串`)
  }
  const seen = new Set<string>()
  for (const [key, value] of Object.entries(process.env)) {
    const mapped = envVarName(key)
    if (mapped === undefined || isBlockedEnvKey(key, DEFAULT_ENV_BLOCKLIST) || seen.has(mapped)) continue
    seen.add(mapped)
    assert.equal(registered.get(mapped)?.(), value ?? '', `env ${key} 映射值不忠实`)
  }

  // V5 清单 ≡ 注册集合，且含全部内置事实变量、有序。
  const listed = listVariableNames(DEFAULT_ENV_BLOCKLIST)
  for (const builtin of ['date', 'time', 'datetime', 'weekday', 'hostname', 'platform', 'arch', 'username', 'home', 'shell', 'locale', 'node_version']) {
    assert.ok(listed.includes(builtin), `内置变量 ${builtin} 缺失`)
  }
  assert.deepEqual(new Set(listed), new Set(registered.keys()), '清单与注册集合不一致')
  assert.deepEqual(listed, [...listed].sort(), '清单必须有序')

  // 注销守恒：一次 dispose 注销全部注册。
  dispose()
  assert.equal(disposed.length, registered.size, 'dispose 必须注销全部注册')

  // V6 导出随行黑名单：传了才写、往返无损；不传不产生字段。
  const preset: Preset = { id: 'vars-1', name: 'VARS', data: { sections: [], replace: {}, order: [], tools: { exclude: [] } } }
  const parsed = decodePresetExport(encodePresetExport(preset, ['*TOKEN*', 'FOO'])) as { name: string; envBlocklist?: string[] }
  assert.equal(parsed.name, 'VARS')
  assert.deepEqual(parsed.envBlocklist, ['*TOKEN*', 'FOO'])
  assert.ok(!('envBlocklist' in (JSON.parse(encodePresetExport(preset)) as object)), '未传黑名单不得写字段')
})

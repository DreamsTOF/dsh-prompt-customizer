/**
 * preset-io.ts —— 跨环境（Tauri 2 桌面 / Web）的预设导入导出适配层。
 *
 * 浏览器端最初跑在普通网页里：导出用 Blob + <a download>，导入用隐藏的
 * <input type="file"> + FileReader。宿主现在可能包在 Tauri 桌面 WebView
 * 里，桌面端的预期交互是「原生保存 / 打开对话框 + 真实文件读写」。
 *
 * 本模块保持文件格式纯净（encode/decode 为纯函数），把真正的 I/O 路由到
 * 一个小型的可注入 `PresetIoEnv`：
 *
 *  - Tauri v2：通过 window.__TAURI_INTERNALS__.invoke 调用原生的
 *    `plugin:dialog|save` / `plugin:dialog|open` 与
 *    `plugin:fs|write_text_file` / `plugin:fs|read_text_file` 命令 —— 但
 *    仅当宿主应用注册了 dialog / fs 插件、且其 capability ACL 放行这些
 *    命令时才可用。任何拒绝（插件未注册、ACL "not allowed"）都归为
 *    `unavailable`，由调用方回退到 Web 路径 —— 所以即使 Tauri 宿主尚未
 *    带 dialog/fs 插件，本插件也照常工作。
 *  - Web（以及 tauri 回退）：Blob + 锚点下载 / 隐藏文件输入，与旧行为
 *    完全一致。在 WebView2 里锚点下载会退化为 WebView 默认的下载处理，
 *    文件输入仍会打开系统选择器。
 *
 * 本模块在模块作用域不触碰 DOM —— 每个分支都接受注入的假实现 —— 因此
 * 可以在 Node 下加载，web / tauri 已保存 / tauri 已取消 / tauri 不可用
 * 的整个矩阵都能单测覆盖。
 */
import type { Preset } from './types.ts'
import { presetExportFilename } from './presets.ts'

// ── 环境检测 ────────────────────────────────────────────────────────────────

/** Tauri v2 原始 IPC 桥（window.__TAURI_INTERNALS__）。 */
export interface TauriInvoke {
  (cmd: string, args?: Record<string, unknown>, options?: unknown): Promise<unknown>
}

/** 页面是否运行在 Tauri（v1 标记或 v2 桥）webview 内。 */
export function isTauriEnv(win: unknown): boolean {
  if (win === null || win === undefined) return false
  const w = win as { __TAURI_INTERNALS__?: unknown; __TAURI__?: unknown }
  return w.__TAURI_INTERNALS__ !== undefined || w.__TAURI__ !== undefined
}

/** 取可用的 Tauri v2 invoke 桥；不可用时返回 null。 */
function invokeOf(win: unknown): TauriInvoke | null {
  if (!isTauriEnv(win)) return null
  const internals = (win as { __TAURI_INTERNALS__?: { invoke?: unknown } }).__TAURI_INTERNALS__
  return internals && typeof internals.invoke === 'function' ? (internals.invoke as TauriInvoke) : null
}

// ── 原生（tauri）原语 ───────────────────────────────────────────────────────

export type SaveOutcome = { kind: 'saved' } | { kind: 'cancelled' } | { kind: 'unavailable' }
export type OpenOutcome = { kind: 'text'; text: string } | { kind: 'cancelled' } | { kind: 'unavailable' }

const JSON_FILTERS = [{ name: 'JSON', extensions: ['json'] }]

/**
 * 原生保存对话框 + 写文件。`cancelled` = 用户关闭了对话框（调用方绝不
 * 得再回退到下载）；`unavailable` = 宿主无法提供 dialog/fs 插件（插件
 * 缺失或被 ACL 拦截），调用方应当回退。
 */
export async function tauriSaveText(invoke: TauriInvoke, defaultName: string, text: string): Promise<SaveOutcome> {
  try {
    const path = await invoke('plugin:dialog|save', { defaultPath: defaultName, filters: JSON_FILTERS })
    if (typeof path !== 'string' || path === '') return { kind: 'cancelled' }
    await invoke('plugin:fs|write_text_file', { path, contents: text })
    return { kind: 'saved' }
  } catch {
    return { kind: 'unavailable' }
  }
}

/** 原生打开对话框 + 读文件。`cancelled` = 用户关闭了对话框。 */
export async function tauriOpenText(invoke: TauriInvoke): Promise<OpenOutcome> {
  try {
    const picked = await invoke('plugin:dialog|open', { multiple: false, directory: false, filters: JSON_FILTERS })
    const path = Array.isArray(picked) ? picked[0] : picked
    if (typeof path !== 'string' || path === '') return { kind: 'cancelled' }
    const text = await invoke('plugin:fs|read_text_file', { path })
    if (typeof text !== 'string') return { kind: 'unavailable' }
    return { kind: 'text', text }
  } catch {
    return { kind: 'unavailable' }
  }
}

// ── Web 回退原语 ────────────────────────────────────────────────────────────

/** 锚点下载的目标接口；依赖全部注入以便 Node 里伪造。 */
export interface BrowserDownloadTarget {
  makeAnchor(): { href: string; download: string; click(): void }
  makeBlob(text: string): unknown
  objectUrl(blob: unknown): string
  revoke(url: string): void
}

/** Web 回退导出：Blob + object URL + <a download> + revoke。 */
export function webDownload(target: BrowserDownloadTarget, filename: string, text: string): void {
  const blob = target.makeBlob(text)
  const url = target.objectUrl(blob)
  const anchor = target.makeAnchor()
  anchor.href = url
  anchor.download = filename
  anchor.click()
  target.revoke(url)
}

/** FileReader 形状的读取器（浏览器注入真 FileReader，测试注入假实现）。
 *  回调类型带可选的事件参数，让 DOM FileReader 的
 *  `(this: FileReader, ev: ProgressEvent) => any` 处理器能干净赋值。 */
export interface FileReaderLike {
  readAsText(file: unknown): void
  onload: ((ev?: unknown) => void) | null
  onerror: ((ev?: unknown) => void) | null
  result: string | ArrayBuffer | null
}

/** Web 回退导入：经 FileReader 形状的读取器解析所选文件的文本。 */
export function readPickedFile(reader: FileReaderLike, file: unknown): Promise<string> {
  return new Promise((resolve, reject) => {
    reader.onload = () => {
      const r = reader.result
      resolve(typeof r === 'string' ? r : String(r ?? ''))
    }
    reader.onerror = () => reject(new Error('FREAD'))
    reader.readAsText(file)
  })
}

// ── 纯文件格式 ──────────────────────────────────────────────────────────────

/** 把单个预设编码为导出文件的 JSON 格式（单对象格式）。 */
export function encodePresetExport(preset: Preset): string {
  return JSON.stringify({ name: preset.name, data: preset.data }, null, 2)
}

/**
 * 解析导出的预设文件：单个 { name, data } 对象或对象数组。空内容 /
 * 非法 JSON 抛普通 Error，由调用方给出友好提示；条目级的过滤在
 * addImportedPresets 里进行。
 */
export function decodePresetExport(text: string): unknown {
  const trimmed = String(text).trim()
  if (trimmed === '') throw new Error('EMPTY_EXPORT')
  return JSON.parse(trimmed)
}

// ── 环境门面 ────────────────────────────────────────────────────────────────

/** 调用方（UI 或测试）驱动的 I/O 面。 */
export interface PresetIoEnv {
  readonly tauri: boolean
  saveText(defaultName: string, text: string): Promise<SaveOutcome>
  openText(): Promise<OpenOutcome>
  download(name: string, text: string): void
}

function browserDownloadTarget(): BrowserDownloadTarget {
  const g = globalThis as { document?: Document; URL?: { createObjectURL(b: Blob): string; revokeObjectURL(u: string): void } }
  const doc = g.document!
  const url = g.URL!
  return {
    makeAnchor: () => doc.createElement('a'),
    makeBlob: (text) => new Blob([text], { type: 'application/json' }),
    objectUrl: (blob) => url.createObjectURL(blob as Blob),
    revoke: (u) => url.revokeObjectURL(u),
  }
}

/** 为当前 window 构建真实环境（在 Node 里调用也安全）。 */
export function makeIoEnv(win?: unknown): PresetIoEnv {
  const w = win !== undefined ? win : typeof window !== 'undefined' ? window : undefined
  const invoke = invokeOf(w)
  const tauri = invoke !== null
  return {
    tauri,
    saveText: (name, text) => (tauri ? tauriSaveText(invoke!, name, text) : Promise.resolve({ kind: 'unavailable' })),
    openText: () => (tauri ? tauriOpenText(invoke!) : Promise.resolve({ kind: 'unavailable' })),
    download: (name, text) => webDownload(browserDownloadTarget(), name, text),
  }
}

export type ExportResult = { ok: boolean; via: 'tauri' | 'browser'; cancelled?: boolean; message?: string }

/**
 * 导出一个预设：宿主能提供原生对话框时走 tauri 保存（cancelled = 用户
 * 拒绝，绝不回退下载）；否则走 Web 下载。
 */
export async function exportPresetFile(preset: Preset, io?: PresetIoEnv): Promise<ExportResult> {
  const env = io ?? makeIoEnv()
  try {
    const text = encodePresetExport(preset)
    const filename = presetExportFilename(preset.name)
    if (env.tauri) {
      const out = await env.saveText(filename, text)
      if (out.kind === 'saved') return { ok: true, via: 'tauri' }
      if (out.kind === 'cancelled') return { ok: false, via: 'tauri', cancelled: true }
      // unavailable -> 继续走 Web 下载
    }
    env.download(filename, text)
    return { ok: true, via: 'browser' }
  } catch (e) {
    return { ok: false, via: 'browser', message: e instanceof Error ? e.message : String(e) }
  }
}

export type ImportResult = { kind: 'text'; text: string; via: 'tauri' } | { kind: 'cancelled' } | { kind: 'unavailable' }

/**
 * 经原生 tauri 打开对话框导入一个预设；返回 `unavailable` 时由调用方
 * 点击自己的隐藏文件输入（Web 回退）。
 */
export async function importPresetFile(io?: PresetIoEnv): Promise<ImportResult> {
  const env = io ?? makeIoEnv()
  try {
    if (env.tauri) {
      const out = await env.openText()
      if (out.kind === 'text') return { kind: 'text', text: out.text, via: 'tauri' }
      if (out.kind === 'cancelled') return { kind: 'cancelled' }
    }
  } catch {
    /* 落到下面的选择器回退 */
  }
  return { kind: 'unavailable' }
}

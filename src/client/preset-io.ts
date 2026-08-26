/**
 * preset-io.ts — environment-adaptive preset import/export.
 *
 * The browser half originally ran in a plain web page: exporting used
 * Blob + <a download>, importing used a hidden <input type="file"> +
 * FileReader. The host is now wrapped in a Tauri desktop WebView, where the
 * expected desktop UX is a NATIVE save/open dialog plus a real file write.
 *
 * This module keeps the file format pure (encode/decode) and routes the
 * actual I/O through a small injectable `PresetIoEnv`:
 *
 *  - Tauri v2: window.__TAURI_INTERNALS__.invoke drives the native
 *    `plugin:dialog|save` / `plugin:dialog|open` + `plugin:fs|write_text_file`
 *    / `plugin:fs|read_text_file` commands — but only when the host app has
 *    registered the dialog/fs plugins AND its capability ACL allows the
 *    commands. Any rejection (plugin not registered, ACL "not allowed") is
 *    reported as `unavailable` and the caller falls back to the web path, so
 *    the plugin keeps working even on a tauri host that ships no dialog/fs
 *    plugins yet.
 *  - Web (and tauri fallback): Blob + anchor download / hidden file input,
 *    identical to the previous behaviour. In a WebView2 the anchor download
 *    degrades to the WebView's default download handling, and the file input
 *    still opens the OS picker.
 *
 * Nothing here touches the DOM at module scope — every branch takes injected
 * fakes — so the module loads under Node and the whole matrix (web / tauri
 * saved / tauri cancelled / tauri unavailable) is unit-tested.
 */
import type { Preset } from './types.ts'
import { presetExportFilename } from './presets.ts'

// ── Environment detection ───────────────────────────────────────────────────

/** Tauri v2 raw IPC bridge (window.__TAURI_INTERNALS__). */
export interface TauriInvoke {
  (cmd: string, args?: Record<string, unknown>, options?: unknown): Promise<unknown>
}

/** True when the page runs inside a Tauri (v1 marker or v2 bridge) webview. */
export function isTauriEnv(win: unknown): boolean {
  if (win === null || win === undefined) return false
  const w = win as { __TAURI_INTERNALS__?: unknown; __TAURI__?: unknown }
  return w.__TAURI_INTERNALS__ !== undefined || w.__TAURI__ !== undefined
}

/** The usable Tauri v2 invoke bridge, or null when unavailable. */
function invokeOf(win: unknown): TauriInvoke | null {
  if (!isTauriEnv(win)) return null
  const internals = (win as { __TAURI_INTERNALS__?: { invoke?: unknown } }).__TAURI_INTERNALS__
  return internals && typeof internals.invoke === 'function' ? (internals.invoke as TauriInvoke) : null
}

// ── Native (tauri) primitives ───────────────────────────────────────────────

export type SaveOutcome = { kind: 'saved' } | { kind: 'cancelled' } | { kind: 'unavailable' }
export type OpenOutcome = { kind: 'text'; text: string } | { kind: 'cancelled' } | { kind: 'unavailable' }

const JSON_FILTERS = [{ name: 'JSON', extensions: ['json'] }]

/**
 * Native save dialog + write. `cancelled` = the user closed the dialog
 * (caller must NOT fall back to a download then); `unavailable` = the host
 * cannot serve the dialog/fs plugins (missing plugin or ACL block) and the
 * caller SHOULD fall back.
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

/** Native open dialog + read. `cancelled` = user closed the dialog. */
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

// ── Web fallback primitives ─────────────────────────────────────────────────

/** Anchor-download target; deps are injected so Node can fake them. */
export interface BrowserDownloadTarget {
  makeAnchor(): { href: string; download: string; click(): void }
  makeBlob(text: string): unknown
  objectUrl(blob: unknown): string
  revoke(url: string): void
}

/** Web fallback export: Blob + object URL + <a download> + revoke. */
export function webDownload(target: BrowserDownloadTarget, filename: string, text: string): void {
  const blob = target.makeBlob(text)
  const url = target.objectUrl(blob)
  const anchor = target.makeAnchor()
  anchor.href = url
  anchor.download = filename
  anchor.click()
  target.revoke(url)
}

/** FileReader-shaped reader (injected: real FileReader in the browser, fakes in tests).
 *  The callback types accept an optional event argument so the DOM FileReader's
 *  `(this: FileReader, ev: ProgressEvent) => any` handlers assign cleanly. */
export interface FileReaderLike {
  readAsText(file: unknown): void
  onload: ((ev?: unknown) => void) | null
  onerror: ((ev?: unknown) => void) | null
  result: string | ArrayBuffer | null
}

/** Web fallback import: resolve a picked file's text via a FileReader-like. */
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

// ── Pure file format ────────────────────────────────────────────────────────

/** Encode one preset into the JSON export file format (single-object format). */
export function encodePresetExport(preset: Preset): string {
  return JSON.stringify({ name: preset.name, data: preset.data }, null, 2)
}

/**
 * Parse an exported preset file: a single { name, data } object or an array
 * of them. Throws a plain Error on empty / invalid JSON so callers can show a
 * friendly message; entry-level filtering happens later in addImportedPresets.
 */
export function decodePresetExport(text: string): unknown {
  const trimmed = String(text).trim()
  if (trimmed === '') throw new Error('EMPTY_EXPORT')
  return JSON.parse(trimmed)
}

// ── Environment facade ──────────────────────────────────────────────────────

/** The I/O surface a caller (UI or test) drives. */
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

/** Build the real environment for the current window (safe to call in Node). */
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
 * Export one preset: native tauri save dialog when the host serves it
 * (cancelled = user said no, never fall back), otherwise the web download.
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
      // unavailable -> fall through to the web download
    }
    env.download(filename, text)
    return { ok: true, via: 'browser' }
  } catch (e) {
    return { ok: false, via: 'browser', message: e instanceof Error ? e.message : String(e) }
  }
}

export type ImportResult = { kind: 'text'; text: string; via: 'tauri' } | { kind: 'cancelled' } | { kind: 'unavailable' }

/**
 * Import one preset via the native tauri open dialog when available; the
 * caller clicks its hidden file input when `unavailable` is returned.
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
    /* fall through to the picker fallback */
  }
  return { kind: 'unavailable' }
}
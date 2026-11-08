/**
 * 插件自有配置存储 —— `~/.dsh/prompt-customizer/config.yaml`。
 *
 * 背景：宿主 SettingsProvider 把所有插件命名空间都存在主文档
 * （settings.yaml）里，插件无法选择存储位置；本插件改为自带文件存储，
 * 让主文档不再被本插件的配置膨胀。
 *
 * 语义：
 *  - 新文件是唯一权威（读写都走这里）。
 *  - 懒加载：每次读取做 stat，mtime 变了才重新解析——外部手工编辑在下次
 *    读取时自然生效，不需要 fs.watch。
 *  - 原子写：先写同目录临时文件再 rename。
 *  - last-good：文件损坏或 schema 校验失败时，沿用上一次合法值并告警一次，
 *    绝不让一个坏文件拖垮装配瀑布流。
 */

import fs from 'node:fs'
import { parse } from 'yaml'
import { getDoc, setDoc } from './db.js'

/** 读主文档（旧版 settings.yaml）里本插件的旧段；破坏式更新后仅作排查用。 */
export function readLegacySection(masterPath, ns) {
  if (!masterPath) return undefined
  let doc
  try {
    doc = parse(fs.readFileSync(masterPath, 'utf8'))
  } catch {
    return undefined
  }
  const section = doc?.[ns]
  return section !== null && typeof section === 'object' && !Array.isArray(section) && Object.keys(section).length > 0
    ? section
    : undefined
}

/**
 * DB 驱动的配置存储。API 与旧版文件存储一致（raw / readResolved / writeSection /
 * setField），但底层是 SQLite 的 `doc` 表（key 默认 `config`），不再写 config.yaml。
 * schema 用于补默认值并校验；坏数据回落最近一次合法值（进程内 last-good）。
 */
export function createConfigStore({ db, key = 'config', schema, warn } = {}) {
  if (!db) throw new TypeError('createConfigStore: db is required')
  let lastGood
  let warned = false
  const warnOnce = (message) => {
    if (warned) return
    warned = true
    try { warn?.(message) } catch { /* logger 缺席只是不再告警 */ }
  }

  const resolve = (raw) => {
    if (schema === undefined) return { value: raw ?? {}, error: undefined }
    try { return { value: schema(raw ?? {}), error: undefined } } catch (error) { return { value: null, error } }
  }

  const load = () => {
    const raw = getDoc(db, key)
    const r = resolve(raw)
    if (r.value !== null) lastGood = r.value
    return { raw, ...r }
  }

  return {
    raw() {
      return load().raw
    },
    readResolved() {
      const entry = load()
      if (entry.value !== null) return entry.value
      warnOnce(`prompt-customizer: 配置损坏，回落到最近一次合法配置：${String(entry.error && entry.error.message ? entry.error.message : entry.error)}`)
      return lastGood ?? resolve(undefined).value
    },
    writeSection(section) {
      const next = section ?? {}
      if (schema !== undefined) {
        try {
          schema(next)
        } catch (error) {
          throw new Error(`invalid config: ${String(error && error.message ? error.message : error)}`)
        }
      }
      setDoc(db, key, next)
      return load()
    },
    setField(field, value) {
      const base = this.raw()
      const section = { ...(base ?? {}) }
      if (value === undefined) delete section[field]
      else section[field] = value
      return this.writeSection(section)
    },
  }
}

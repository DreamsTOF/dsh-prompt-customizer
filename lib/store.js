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
import path from 'node:path'
import { parse, stringify } from 'yaml'

/** 新 yml 文件的头部注释（让手工编辑者知道这是什么）。 */
const HEADER = '# dsh-prompt-customizer 配置（唯一权威）。\n' +
  '# 手工编辑即时生效（下次读取时）；删除本文件后重启会从旧版 settings.yaml 迁移。\n'

/** 读主文档（旧版 settings.yaml）里本插件的旧段；主文档缺失或段不存在返回 undefined。 */
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

/** 创建一个配置存储实例。schema 用于在读取时补默认值并校验；header 可覆盖
 *  文件头注释（派生缓存类文件需要说明自己不是配置）。 */
export function createConfigStore({ file, schema, warn, header = HEADER } = {}) {
  if (!file) throw new TypeError('createConfigStore: file is required')
  /** { stamp, raw, resolved, error } — stamp 为 undefined 表示文件不存在。 */
  let cache
  let warned = false
  const warnOnce = (message) => {
    if (warned) return
    warned = true
    try { warn?.(message) } catch { /* logger 缺席只是不再告警 */ }
  }

  /** 用 schema 解析（补默认值 + 校验）；失败返回 { value: null, error }。 */
  const resolve = (raw) => {
    if (schema === undefined) return { value: raw ?? {}, error: undefined }
    try { return { value: schema(raw ?? {}), error: undefined } } catch (error) { return { value: null, error } }
  }

  /** stat 驱动的懒加载；返回完整缓存条目。 */
  const load = () => {
    let stamp
    try { stamp = fs.statSync(file).mtimeMs } catch { stamp = undefined }
    if (cache && cache.stamp === stamp) return cache
    if (stamp === undefined) {
      cache = { stamp, raw: undefined, ...resolve(undefined) }
      return cache
    }
    let raw
    let error
    try {
      raw = parse(fs.readFileSync(file, 'utf8'))
      if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
        raw = undefined
        error = new Error('config.yaml 的顶层必须是映射')
      }
    } catch (e) {
      raw = undefined
      error = e
    }
    const r = raw === undefined ? { value: null, error } : resolve(raw)
    // raw 保留磁盘上的真实解析结果（即使 schema 失败）——写合并不应静默丢字段。
    cache = { stamp, raw, ...r }
    // 任何一次成功解析（含写入后的校验）都刷新 last-good。
    if (r.value !== null) lastGood = r.value
    return cache
  }

  /** 上一次 schema 校验通过的解析结果（坏文件时的 last-good 回落）。 */
  let lastGood

  return {
    /** 当前存储的原始用户段（未补默认值）；无文件时 undefined。 */
    raw() {
      return load().raw
    },

    /** 解析后的生效配置（默认值已补；坏文件回落 last-good，再回落纯默认值）。 */
    readResolved() {
      const entry = load()
      if (entry.value !== null) return entry.value
      warnOnce(`prompt-customizer: 配置文件不可用，回落到最近一次合法配置：${String(entry.error && entry.error.message ? entry.error.message : entry.error)}`)
      return lastGood ?? resolve(undefined).value
    },

    /** 原子写入一个完整用户段；写入后立刻刷新缓存。 */
    writeSection(section) {
      fs.mkdirSync(path.dirname(file), { recursive: true })
      const tmp = `${file}.${process.pid}.tmp`
      fs.writeFileSync(tmp, header + stringify(section ?? {}))
      fs.renameSync(tmp, file)
      cache = undefined
      return load()
    },

    /** 写单个字段（值 undefined 表示删除）；基于当前权威段合并。 */
    setField(field, value) {
      const base = this.raw()
      const section = { ...(base ?? {}) }
      if (value === undefined) delete section[field]
      else section[field] = value
      return this.writeSection(section)
    },
  }
}

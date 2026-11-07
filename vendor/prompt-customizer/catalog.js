/**
 * 「本系统全部提示词 / 全部工具」的累积登记表 —— 现在落在 SQLite
 * （`catalog_section` / `catalog_tool`，见 db.js）。
 *
 * 语义与旧版一致：每次为任一 scope 构建清单 / 预览，就把这次真正看到的段与工具
 * 并进池子 —— 同名更新、新名追加，绝不因切换预设而变少。文件只是派生缓存，
 * 破坏式更新后旧 catalog.yaml 不再读取。
 */

import { readCatalog, replaceCatalog, observeCatalog, catalogNames } from './db.js'

/** 只取已定义字段，避免 `{...旧, ...新}` 用 undefined 把旧值抹成空洞。 */
export function definedFields(item) {
  const patch = {}
  for (const [key, value] of Object.entries(item)) {
    if (value !== undefined) patch[key] = value
  }
  return patch
}

function isName(value) {
  return typeof value === 'string' && value.length > 0
}

/**
 * 把一次所见并进已有名单（纯函数，供单测 / 复用）：同名覆盖（保持原有位置）、
 * 新名追加。`orderOf` 给缺少 order 的新条目补一个稳定下标。
 */
export function mergeSighting(prev, sighting, orderOf = null) {
  const list = (Array.isArray(prev) ? prev : []).map((item) => ({ ...item }))
  const index = new Map(list.map((item, i) => [item?.name, i]))
  let changed = false
  for (const raw of Array.isArray(sighting) ? sighting : []) {
    if (raw === null || typeof raw !== 'object' || !isName(raw.name)) continue
    const at = index.get(raw.name)
    if (at === undefined) {
      const next = { ...raw }
      if (orderOf !== null && next.order === undefined) next.order = orderOf(list, next)
      index.set(raw.name, list.length)
      list.push(next)
      changed = true
      continue
    }
    const patch = definedFields(raw)
    const merged = { ...list[at], ...patch }
    if (JSON.stringify(merged) === JSON.stringify(list[at])) continue
    list[at] = merged
    changed = true
  }
  return { list, changed }
}

/**
 * 累积登记表（SQLite）。read / observe / replace / reload 语义与旧版文件实现一致，
 * 但底层是 db.js 的 catalog_section / catalog_tool 表。
 */
export function createCatalog({ db, warn } = {}) {
  if (!db) throw new TypeError('createCatalog: db is required')
  const warnOnce = (message) => { try { warn?.(message) } catch { /* logger 缺席 */ } }
  return {
    read() {
      return readCatalog(db)
    },
    observe({ sections = [], tools = [] } = {}) {
      try {
        return observeCatalog(db, { sections, tools })
      } catch (error) {
        warnOnce(`prompt-customizer: 目录写库失败（本次仅内存累积）：${String(error && error.message ? error.message : error)}`)
        return false
      }
    },
    replace({ sections = [], tools = [] } = {}) {
      const before = catalogNames(db)
      try {
        replaceCatalog(db, { sections, tools })
      } catch (error) {
        warnOnce(`prompt-customizer: 目录替换失败：${String(error && error.message ? error.message : error)}`)
        return {
          written: false,
          sections: { before: before.sections.size, after: before.sections.size, removed: 0 },
          tools: { before: before.tools.size, after: before.tools.size, removed: 0 },
        }
      }
      const after = catalogNames(db)
      return {
        written: true,
        sections: { before: before.sections.size, after: after.sections.size, removed: [...before.sections].filter((n) => !after.sections.has(n)).length },
        tools: { before: before.tools.size, after: after.tools.size, removed: [...before.tools].filter((n) => !after.tools.has(n)).length },
      }
    },
    reload() {
      return readCatalog(db)
    },
  }
}

/**
 * 「本系统全部提示词 / 全部工具」的累积登记表 —— `catalog.yaml`。
 *
 * 段与工具都挂在各 agent 预设自己的 scope 里，要看到某个预设独有的名字必须先
 * 挂载它（`standingKeyFor` 组装整棵插件树，单个可慢到十几秒）。清单面板要的却是
 * 「不随编辑目标切换、只增不减」的全景，所以这里不做全量预热，而是懒式累积：
 * 每次为任一 scope 构建清单 / 预览，就把这次真正看到的段与工具并进登记表 ——
 * 同名后见到者赢，新名追加，绝不因为切换预设而变少。
 *
 * 文件只是派生缓存：删掉它会随浏览重新长出来，不含任何用户配置。因此登记表只存
 * 身份与内容（段名 / 顺序 / 文本，工具名 / 描述），**不存**屏蔽、替换、隐藏这类
 * 按作用域计算的标记 —— 那些永远在响应时按当前生效配置现算。
 */

import path from 'node:path'
import { createConfigStore } from './store.js'

/** 只取已定义字段，避免 `{...旧, ...新}` 用 undefined 把旧值抹成空洞。 */
function definedFields(item) {
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
 * 把一次所见并进已有名单：同名覆盖（后见到者赢，保持原有位置），新名追加。
 * `orderOf` 给缺少 order 的新条目补一个稳定下标（工具池不需要）。
 * 返回 `{ list, changed }` —— changed 为 false 时调用方可以不落盘。
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

/** 创建一个累积登记表。`dir` 与配置文件同目录；读不到 / 坏文件一律从空开始。 */
export function createCatalog({ dir, file, warn } = {}) {
  const target = file ?? path.join(dir ?? '.', 'catalog.yaml')
  const store = createConfigStore({
    file: target,
    warn,
    header: '# dsh-prompt-customizer 段 / 工具累积登记表（派生缓存，非配置）。\n'
      + '# 由面板浏览各 agent 预设时自动累积；删掉本文件会随下次浏览重新长出来。\n',
  })

  /** 归一化磁盘内容：只认数组里的具名条目，段保留 order / text。 */
  const normalize = (raw, kind) => {
    const list = Array.isArray(raw) ? raw : []
    if (kind === 'sections') {
      return list
        .filter((x) => x !== null && typeof x === 'object' && isName(x.name))
        .map((x) => ({ name: x.name, order: typeof x.order === 'number' ? x.order : undefined, text: typeof x.text === 'string' ? x.text : '' }))
        .map((x) => (x.order === undefined ? { name: x.name, text: x.text } : { name: x.name, order: x.order, text: x.text }))
    }
    return list
      .filter((x) => x !== null && typeof x === 'object' && isName(x.name))
      .map((x) => ({ name: x.name, description: typeof x.description === 'string' ? x.description : '' }))
  }

  const load = () => {
    let doc
    try { doc = store.readResolved() ?? {} } catch { doc = {} }
    return {
      sections: normalize(doc.sections, 'sections'),
      tools: normalize(doc.tools, 'tools'),
    }
  }

  let state = load()

  return {
    /** 当前并集（按登记顺序；调用方自己现算标记与排序）。 */
    read() {
      return { sections: state.sections.map((x) => ({ ...x })), tools: state.tools.map((x) => ({ ...x })) }
    },

    /**
     * 并进一次所见。段的 order 只在所见提供时才更新（预览路径没有 order，
     * 不该把已知顺序打乱）；新段用「当前最大 order + 1」落位，保持追加在尾部。
     */
    observe({ sections = [], tools = [] } = {}) {
      // 与 config.yaml 同构的语义：外部编辑 / 删除即时生效（store 是 mtime 懒
      // 加载的，这里取一次最新状态再合并）。否则删掉本文件后，内存里的旧池子
      // 会在下次请求被原样写回来，「删掉随浏览重建」就成了假话。
      state = load()
      let changed = false
      const nextOrder = (list) => {
        let max = -1
        for (const item of list) if (typeof item.order === 'number' && item.order > max) max = item.order
        return max + 1
      }
      const mergedSections = mergeSighting(state.sections, sections, (list) => nextOrder(list))
      if (mergedSections.changed) { state.sections = mergedSections.list; changed = true }
      const mergedTools = mergeSighting(state.tools, tools)
      if (mergedTools.changed) { state.tools = mergedTools.list; changed = true }
      if (!changed) return false
      // 落盘失败只影响缓存持久性，绝不让清单 / 预览请求失败。
      try { store.writeSection(state) } catch (error) {
        try { warn?.(`prompt-customizer: catalog.yaml 写入失败（本次仅内存累积）：${String(error && error.message ? error.message : error)}`) } catch { /* logger 缺席 */ }
      }
      return true
    },

    /** 测试 / 排查用：重新从磁盘读一次。 */
    reload() { state = load(); return state },
  }
}

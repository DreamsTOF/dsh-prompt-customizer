/**
 * 插件自有存储 —— 单文件 SQLite（`node:sqlite`，无外部依赖）。
 *
 * 破坏式更新：不再读写旧版 `config.yaml` / `catalog.yaml` 以及各 JSON 账本；
 * 启动即建库，旧文件原样保留但不读（不迁移）。
 *
 * 结构：
 *  - `doc(key, json)`       —— 小型整份文档（config、工作区 overrides、各 MCP / 技能账本）。
 *  - `ledger(domain,scope,name,value)` —— 需要按条目读写的名单（预留）。
 *
 * JSON 值放在 TEXT 列里是 SQLite 的常规做法；这里真正的收益是「一个 DB 文件、
 * 事务、WAL、按行增量」取代了一堆各自读写的 YAML / JSON 文件。
 */

import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const SCHEMA = `
CREATE TABLE IF NOT EXISTS doc (
  key  TEXT PRIMARY KEY,
  json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS ledger (
  domain TEXT NOT NULL,
  scope  TEXT NOT NULL DEFAULT '',
  name   TEXT NOT NULL,
  value  TEXT NOT NULL,
  PRIMARY KEY (domain, scope, name)
);
`

/** 按绝对路径缓存连接（同一 DB 文件在进程内共享一个连接）。 */
const open = new Map()

/** 打开（必要时创建）SQLite 数据库，建表并启用 WAL。重复调用返回同一连接。 */
export function openDb(file) {
  if (typeof file !== 'string' || file === '') throw new TypeError('openDb: file is required')
  const abs = path.resolve(file)
  const cached = open.get(abs)
  if (cached !== undefined) return cached
  fs.mkdirSync(path.dirname(abs), { recursive: true })
  const db = new DatabaseSync(abs)
  try { db.exec('PRAGMA journal_mode=WAL;') } catch { /* 某些只读环境下不可用：忽略 */ }
  try { db.exec('PRAGMA busy_timeout=3000;') } catch { /* 同上 */ }
  db.exec(SCHEMA)
  open.set(abs, db)
  return db
}

/** 关闭并清空所有打开的连接（测试隔离用）。 */
export function closeAllDbs() {
  for (const db of open.values()) { try { db.close() } catch { /* 已关闭 */ } }
  open.clear()
}

/** 读一份文档（不存在或坏 JSON 返回 undefined）。 */
export function getDoc(db, key) {
  const row = db.prepare('SELECT json FROM doc WHERE key = ?').get(key)
  if (row === undefined || row === null) return undefined
  try { return JSON.parse(row.json) } catch { return undefined }
}

/** 写一份文档（整份覆盖）。 */
export function setDoc(db, key, value) {
  const json = JSON.stringify(value ?? {})
  db.prepare('INSERT INTO doc(key, json) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET json = excluded.json').run(key, json)
}

/** 删除一份文档。 */
export function delDoc(db, key) {
  db.prepare('DELETE FROM doc WHERE key = ?').run(key)
}

/** 导出全部文档（整库备份用）。返回 `{ key: value }`。 */
export function allDocs(db) {
  const rows = db.prepare('SELECT key, json FROM doc').all()
  const out = {}
  for (const row of rows) {
    try { out[row.key] = JSON.parse(row.json) } catch { /* 跳过坏 JSON */ }
  }
  return out
}

/** 用一份文档集整体替换 doc 表（恢复备份用；事务内完成）。 */
export function replaceAllDocs(db, docs) {
  const entries = docs !== null && typeof docs === 'object' ? Object.entries(docs) : []
  db.exec('BEGIN')
  try {
    db.prepare('DELETE FROM doc').run()
    for (const [key, value] of entries) setDoc(db, key, value)
    db.exec('COMMIT')
  } catch (error) {
    try { db.exec('ROLLBACK') } catch { /* ignore */ }
    throw error
  }
}

/**
 * 本插件单文件 DB 的默认路径：`$DSH_HOME/prompt-customizer/prompt-customizer.db`
 * （与 vendor 半身 `dshHome()/NS` 的默认 dataDir 一致），供 src 侧各账本共用。
 */
export function pluginDbFile() {
  const fromEnv = process.env.DSH_HOME
  const home = typeof fromEnv === 'string' && fromEnv.trim() !== '' ? fromEnv : path.join(os.homedir(), '.dsh')
  return path.join(home, 'prompt-customizer', 'prompt-customizer.db')
}

/** 便捷：在默认 DB 上读 / 写一份 ledger 文档。 */
export function readPluginDoc(key) {
  return getDoc(openDb(pluginDbFile()), key)
}

export function writePluginDoc(key, value) {
  setDoc(openDb(pluginDbFile()), key, value)
}

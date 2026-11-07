/**
 * 测试预置：SQLite 连接在 Windows 上会锁住临时目录，导致用例 teardown 的
 * `fs.rmSync(tempDir)` 报 EPERM。这里在 rm 失败时先关闭所有 DB 连接再重试一次，
 * 保持每个用例的隔离清理可靠（仅测试进程生效）。
 */
import fs from 'node:fs'
import { closeAllDbs } from '../vendor/prompt-customizer/db.js'

const originalRm = fs.rmSync
fs.rmSync = function patchedRm(target, options) {
  try {
    return originalRm.call(fs, target, options)
  } catch (error) {
    if (error && (error.code === 'EPERM' || error.code === 'EBUSY' || error.code === 'ENOTEMPTY')) {
      try { closeAllDbs() } catch { /* 忽略 */ }
      return originalRm.call(fs, target, options)
    }
    throw error
  }
}

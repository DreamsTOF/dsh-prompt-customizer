/**
 * home-paths — DSH 用户数据根的解析规则（与内核 0.2.1-rc.2 对齐）。
 *
 * 内核从 0.2.1-rc.2 起把 env 解析收进 `@deepseek-ai/dsh-home-paths` 的
 * `resolveDshHome` / `resolveAgentsHome`，两处规则都比本插件此前的内联写法更严：
 *
 *   1. 空串 / 纯空白的环境变量按「未设置」处理。旧内联写法会把它直接当路径，
 *      `resolve('')` 得到进程 cwd —— 面板会去列 cwd/skills，开关写进无人读的目录。
 *   2. 支持 `~` / `~/` 前缀展开。旧写法不展开，`~/x` 会被当成相对目录。
 *
 * 本插件是 vendor 进宿主的运行时插件，不能 import 内核包（见 vendor/README.md），
 * 所以照抄规则而不是复用实现。两边分叉的实际后果是「面板列空 + 开关不生效」，
 * 因此这里必须与内核保持一致。
 */

import { homedir } from 'node:os'
import { resolve } from 'node:path'

/** 展开 `~` / `~/` / `~\` 前缀（与内核 expandHomePath 同语义）。 */
function expandHomePath(path: string): string {
  if (path === '~') return homedir()
  if (path.startsWith('~/') || path.startsWith('~\\')) return resolve(homedir(), path.slice(2))
  return path
}

/** 一个用户数据根的解析：显式配置 > 环境变量 > 默认值。 */
function resolveRoot(configured: string | undefined, envName: string, fallback: string): string {
  const fromEnv = process.env[envName]
  const selected = configured ?? (fromEnv !== undefined && fromEnv.trim().length > 0 ? fromEnv : fallback)
  return resolve(expandHomePath(selected))
}

/** DeepSeek Harness home（`$DSH_HOME` → `~/.dsh`）。 */
export function dshHome(): string {
  return resolveRoot(undefined, 'DSH_HOME', resolve(homedir(), '.dsh'))
}

/** 跨 agent 工具共享的配置根（`$DSH_AGENTS_HOME` → `~/.agents`）。 */
export function agentsHome(): string {
  return resolveRoot(undefined, 'DSH_AGENTS_HOME', resolve(homedir(), '.agents'))
}

/**
 * 工作区路径的唯一归一口径：先 `resolve` 成绝对路径；Windows 上再转小写
 * （同一目录经不同 API 返回的大小写并不稳定，账本按字符串键会分裂成两份）。
 *
 * 只用于账本键 / 去重 / 比较；需要回传给宿主做文件操作时，小写路径在
 * Windows 上仍然合法（文件系统大小写不敏感）。
 * @param cwd - 任意工作区路径。
 * @returns 归一后的绝对路径。
 */
export function normalizeCwd(cwd: string): string {
  const resolved = resolve(cwd)
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved
}

/**
 * vars — 提示词变量注册（host 半身，0.2.2）。
 *
 * 宿主 system-prompt 只由 agent-loop 注册 `provider` / `model` / `cwd`，
 * 段文本里的其它 `{{name}}` 在严格渲染下会直接报错。本模块通过官方扩展点
 * `ctx.systemPrompt.variable(name, provider)` 补齐：
 *
 *  - 内置系统事实：date / time / datetime / weekday / hostname / platform /
 *    arch / username / home / shell / locale / node_version；
 *  - process.env 全量：规范化为 `env_<小写>`，黑名单命中时不暴露。
 *
 * 与旧版（vendor/prompt-customizer/vars.js）的差异：
 *  - 日期时间统一走 `Intl.DateTimeFormat`，按宿主 locale 与 TZ/宿主时区渲染，
 *    不再用 `Date#getFullYear` 这类进程本地时区 + 英文硬编码星期；
 *  - `home` 走统一的 `dshHome()`（支持 `DSH_HOME`、`~` 展开、空白串按未设置）；
 *  - `shell` 从宿主上下文（`ctx.shell` 配置）取，取不到时返回 `unknown`；
 *  - env 名归并（`A.B` 与 `A-B` 都会变成 `env_a_b`）时只注册第一个，
 *    冲突写入诊断，不静默覆盖。
 *
 * 黑名单每次 provider 调用时读取最新配置：配置改小/改大都不需要重挂。
 */

import os from 'node:os'
import { dshHome } from './home-paths.ts'

/** 与宿主 system-prompt 的 VARIABLE_NAME 完全一致。 */
const VARIABLE_NAME = /^[a-z][a-z0-9_]*$/

/** agent-loop 已注册的三个名字：重复注册会抛错，永远避开。 */
const RESERVED = new Set(['provider', 'model', 'cwd'])

/** 一条环境变量绑定：原始键 → 注册名。 */
export interface EnvBinding {
  key: string
  name: string
}

/** 安装诊断。 */
export interface VariableDiagnostics {
  /** 已注册的内置变量名。 */
  builtins: string[]
  /** 已注册的 env 变量名。 */
  env: string[]
  /** 归并冲突：注册名 → 被跳过的原始键（第一个键生效）。 */
  conflicts: Record<string, string[]>
}

export interface VariableInstallOptions {
  /** 返回当前 envBlocklist（默认空数组；配置变化即时生效）。 */
  readBlocklist?: () => readonly string[]
  /** 宿主 shell 探测；返回空串/undefined 时变量值为 `unknown`。 */
  detectShell?: () => string | undefined
  /** 诊断日志（冲突、注册失败）。 */
  warn?: (message: string) => void
}

/** 黑名单条目编译：`*` 通配，大小写不敏感，空条目忽略。 */
export function compileEnvBlocklist(blocklist: readonly unknown[]): Array<(key: string) => boolean> {
  const matchers: Array<(key: string) => boolean> = []
  for (const entry of Array.isArray(blocklist) ? blocklist : []) {
    if (typeof entry !== 'string') continue
    const text = entry.trim()
    if (text === '') continue
    if (text.includes('*')) {
      const pattern = '^' + text.split('*')
        .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('.*') + '$'
      try {
        const regex = new RegExp(pattern, 'i')
        matchers.push((key) => regex.test(key))
      } catch {
        // 非法正则条目跳过（不让一条脏配置拖垮全部变量）。
      }
    } else {
      const lower = text.toLowerCase()
      matchers.push((key) => key.toLowerCase() === lower)
    }
  }
  return matchers
}

/** env 键是否被黑名单挡下。 */
export function isBlockedEnvKey(key: string, blocklist: readonly unknown[]): boolean {
  return compileEnvBlocklist(blocklist).some((match) => match(key))
}

/** env 键 → 合法变量名（`PATH` → `env_path`）。 */
export function envVarName(key: string): string | undefined {
  const core = String(key).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  if (core === '') return undefined
  const name = `env_${core}`
  return VARIABLE_NAME.test(name) ? name : undefined
}

/**
 * 枚举 env 绑定并归并冲突：同一个注册名只保留第一个键。
 * @param env - 环境表（默认 process.env）。
 * @returns 绑定列表与冲突表。
 */
export function planEnvBindings(env: Readonly<Record<string, string | undefined>> = process.env): {
  bindings: EnvBinding[]
  conflicts: Record<string, string[]>
} {
  const bindings: EnvBinding[] = []
  const byName = new Map<string, EnvBinding>()
  const conflicts: Record<string, string[]> = {}
  for (const key of Object.keys(env)) {
    const name = envVarName(key)
    if (name === undefined) continue
    const existing = byName.get(name)
    if (existing !== undefined) {
      conflicts[name] = [...conflicts[name] ?? [], key]
      continue
    }
    const binding = { key, name }
    byName.set(name, binding)
    bindings.push(binding)
  }
  return { bindings, conflicts }
}

function hostLocale(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale || 'en-US'
  } catch {
    return 'en-US'
  }
}

function hostTimeZone(): string | undefined {
  const fromEnv = process.env.TZ
  if (typeof fromEnv === 'string' && fromEnv.trim() !== '') return fromEnv.trim()
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined
  } catch {
    return undefined
  }
}

/** 安全构造一个 Intl formatter；环境不支持时退回默认 locale/时区。 */
function formatter(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const locale = hostLocale()
  const timeZone = hostTimeZone()
  try {
    return new Intl.DateTimeFormat(locale, timeZone === undefined ? options : { ...options, timeZone })
  } catch {
    return new Intl.DateTimeFormat('en-US', options)
  }
}

/** 内置变量 provider 表。 */
function builtinProviders(options: VariableInstallOptions): Record<string, () => string> {
  const dateFormatter = formatter({ year: 'numeric', month: '2-digit', day: '2-digit' })
  const timeFormatter = formatter({ hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  const weekdayFormatter = formatter({ weekday: 'long' })
  const dateOf = (now: Date): string => dateFormatter.format(now)
  const timeOf = (now: Date): string => timeFormatter.format(now)
  return {
    date: () => dateOf(new Date()),
    time: () => timeOf(new Date()),
    datetime: () => { const now = new Date(); return `${dateOf(now)} ${timeOf(now)}` },
    weekday: () => weekdayFormatter.format(new Date()),
    hostname: () => { try { return os.hostname() } catch { return '' } },
    platform: () => process.platform,
    arch: () => process.arch,
    username: () => { try { return os.userInfo().username } catch { return '' } },
    home: () => dshHome(),
    shell: () => {
      try {
        const value = options.detectShell?.()
        return typeof value === 'string' && value.trim() !== '' ? value.trim() : 'unknown'
      } catch {
        return 'unknown'
      }
    },
    locale: () => hostLocale(),
    node_version: () => process.version,
  }
}

interface SystemPromptVariableHost {
  variable: (name: string, provider: (context: unknown) => string) => () => void
}

/** 安装句柄。 */
export interface VariableInstallation {
  diagnose: () => VariableDiagnostics
  dispose: () => void
}

/**
 * 注册全部内置变量与 env 变量。
 * @param systemPrompt - 宿主 `ctx.systemPrompt` 服务。
 * @param options - 黑名单读取、shell 探测与告警。
 * @returns 安装句柄（诊断 + 注销）。
 */
export function installPromptVariables(
  systemPrompt: SystemPromptVariableHost,
  options: VariableInstallOptions = {},
): VariableInstallation {
  const disposes: Array<() => void> = []
  const registeredBuiltins: string[] = []
  const registeredEnv: string[] = []
  const register = (name: string, provider: (context: unknown) => string): boolean => {
    if (RESERVED.has(name) || !VARIABLE_NAME.test(name)) return false
    try {
      disposes.push(systemPrompt.variable(name, provider))
      return true
    } catch (error) {
      options.warn?.(`prompt variable "${name}" was not registered: ${error instanceof Error ? error.message : String(error)}`)
      return false
    }
  }

  for (const [name, provider] of Object.entries(builtinProviders(options))) {
    if (register(name, () => {
      const value = provider()
      return typeof value === 'string' ? value : ''
    })) registeredBuiltins.push(name)
  }

  const readBlocklist = (): readonly unknown[] => {
    try {
      return options.readBlocklist?.() ?? []
    } catch {
      return []
    }
  }
  const plan = planEnvBindings()
  for (const [name, skipped] of Object.entries(plan.conflicts)) {
    options.warn?.(`env variable name conflict: "${name}" keeps "${plan.bindings.find((binding) => binding.name === name)?.key ?? ''}", skipped ${skipped.join(', ')}`)
  }
  for (const binding of plan.bindings) {
    // 注册名始终存在；provider 在每次装配时重读黑名单，命中则返回空串
    // （不把密钥送进提示词），配置改小后立即恢复。
    if (register(binding.name, () => isBlockedEnvKey(binding.key, readBlocklist()) ? '' : (process.env[binding.key] ?? ''))) {
      registeredEnv.push(binding.name)
    }
  }

  return {
    diagnose: () => ({
      builtins: [...registeredBuiltins],
      env: [...registeredEnv],
      conflicts: { ...plan.conflicts },
    }),
    dispose: () => {
      for (const dispose of disposes.splice(0)) {
        try { dispose() } catch { /* 注销失败不阻塞其余 */ }
      }
    },
  }
}

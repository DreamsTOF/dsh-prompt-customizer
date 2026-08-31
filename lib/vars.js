/**
 * 提示词变量注册 —— 让段文本里的 `{{name}}` 拿到宿主三件套之外的值。
 *
 * 宿主 system-prompt 只由 agent-loop 注册 provider / model / cwd 三个变量，
 * 渲染又是严格模式：引用未注册的名字直接抛错。本模块通过官方扩展点
 * `ctx.systemPrompt.variable(name, provider)` 追加两类变量：
 *
 *  1. 内置系统事实（date / time / hostname / …）——每次装配现算，天然动态；
 *  2. process.env 全量 —— 键名规范化为 `env_<小写>` 后注册，命中黑名单的
 *     键不注册（env 里常有密钥，进了提示词就会随请求发给模型）。
 *
 * 约束来自宿主：变量名必须匹配 /^[a-z][a-z0-9_]*$/；provider 返回 undefined
 * 会让渲染抛错，所以所有 provider 都保证返回字符串；与宿主重名会抛错，
 * 保留字直接跳过（同名注册逐个 try 兜底，别家插件先注册了也只是跳过那一个）。
 */

import os from 'node:os'

/** 与宿主 system-prompt 的 VARIABLE_NAME 完全一致（不满足就不可能注册成功）。 */
const VARIABLE_NAME = /^[a-z][a-z0-9_]*$/

/** agent-loop 已注册的三个名字：重复注册会抛错，永远避开。 */
const RESERVED = new Set(['provider', 'model', 'cwd'])

/** 预填黑名单：常见密钥 / 凭据类环境变量。条目支持 `*` 通配，大小写不敏感。 */
export const DEFAULT_ENV_BLOCKLIST = [
  '*SECRET*',
  '*TOKEN*',
  '*PASSWORD*',
  '*PASSWD*',
  '*CREDENTIAL*',
  '*API_KEY*',
  '*APIKEY*',
  '*ACCESS_KEY*',
  '*PRIVATE_KEY*',
  '*AUTH*',
  '*_DSN',
  '*CONNECTION_STRING*',
  'DATABASE_URL',
]

/**
 * 黑名单条目编译成匹配函数：含 `*` 按通配（`*` 匹配任意串），否则整串
 * 精确比较；统一大小写不敏感（env 键多为大写，用户多写小写）。
 */
function compileEntries(blocklist) {
  const matchers = []
  for (const entry of Array.isArray(blocklist) ? blocklist : []) {
    if (typeof entry !== 'string') continue
    const text = entry.trim()
    if (text === '') continue
    if (text.includes('*')) {
      const pattern = '^' + text.split('*').map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$'
      let re
      try { re = new RegExp(pattern, 'i') } catch { continue }
      matchers.push((key) => re.test(key))
    } else {
      const lower = text.toLowerCase()
      matchers.push((key) => key.toLowerCase() === lower)
    }
  }
  return matchers
}

/** env 键是否被黑名单挡下（不注册 = 提示词里引用它会得到宿主的「未注册」报错）。 */
export function isBlockedEnvKey(key, blocklist) {
  return compileEntries(blocklist).some((match) => match(key))
}

/**
 * 把任意 env 键映射为合法变量名：`env_` 前缀 + 小写 + 非法字符归并为 `_`。
 * 例：`PATH` → `env_path`，`USER.NAME` → `env_user_name`。映射结果必然
 * 匹配宿主命名规则；空键返回 undefined。
 */
export function envVarName(key) {
  const core = String(key).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  if (core === '') return undefined
  const name = `env_${core}`
  return VARIABLE_NAME.test(name) ? name : undefined
}

/** 内置系统事实变量：名字 → 无参提供器（注册时包一层保证返回字符串）。 */
function builtinProviders() {
  const pad = (n) => String(n).padStart(2, '0')
  const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const time = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return {
    date: () => isoDate(new Date()),
    time: () => time(new Date()),
    datetime: () => { const d = new Date(); return `${isoDate(d)} ${time(d)}` },
    weekday: () => weekdays[new Date().getDay()],
    hostname: () => { try { return os.hostname() } catch { return '' } },
    platform: () => process.platform,
    arch: () => process.arch,
    username: () => { try { return os.userInfo().username } catch { return '' } },
    home: () => { try { return os.homedir() } catch { return '' } },
    shell: () => process.env.SHELL ?? process.env.COMSPEC ?? '',
    locale: () => { try { return Intl.DateTimeFormat().resolvedOptions().locale ?? '' } catch { return '' } },
    node_version: () => process.version,
  }
}

/** 当前会注册的变量名清单（内置 + 未被黑名单挡下的 env）：供清单路由展示。 */
export function listVariableNames(blocklist) {
  const names = new Set(Object.keys(builtinProviders()))
  const matchers = compileEntries(blocklist)
  const seen = new Set()
  for (const key of Object.keys(process.env)) {
    if (matchers.some((match) => match(key))) continue
    const name = envVarName(key)
    if (name === undefined || seen.has(name)) continue
    seen.add(name)
    names.add(name)
  }
  return [...names].sort()
}

/**
 * 向宿主注册全部变量，返回注销函数。黑名单变化时由调用方先注销再重注册
 * （见 lib/index.js 的懒同步：装配入口比对签名，配置外改也在下次装配生效）。
 */
export function registerVariables(systemPrompt, blocklist) {
  const disposes = []
  const reg = (name, provider) => {
    if (RESERVED.has(name)) return
    try { disposes.push(systemPrompt.variable(name, provider)) } catch { /* 同名已被别处注册：跳过 */ }
  }
  for (const [name, provider] of Object.entries(builtinProviders())) {
    // provider 必须返回字符串：严格渲染把 undefined 当错误。
    reg(name, () => { const value = provider(); return typeof value === 'string' ? value : '' })
  }
  const matchers = compileEntries(blocklist)
  const seen = new Set()
  for (const key of Object.keys(process.env)) {
    if (matchers.some((match) => match(key))) continue
    const name = envVarName(key)
    if (name === undefined || seen.has(name)) continue
    seen.add(name)
    reg(name, () => process.env[key] ?? '')
  }
  return () => {
    for (const dispose of disposes) {
      try { dispose() } catch { /* 注销失败不阻塞其余注销 */ }
    }
  }
}

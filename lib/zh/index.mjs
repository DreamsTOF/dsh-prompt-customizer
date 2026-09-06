/**
 * 中文段译本（专属定制）—— 汇总入口。
 * 引擎（lib/effective.js 的 applySectionPolicy）在 zhSections 开启时按段名
 * 精确匹配替换文本：对得上号的段整段换成译本，对不上的段保持原文 —— 段数
 * 与注入不增不减。取值是字符串（整段替换）或函数（(原文) => 译本 | null，
 * 见 sdk.mjs；返回 null = 放弃替换）。
 * 安全边界：{{...}} 提示词变量（deployment:persona 的 {{model}} / {{cwd}}、
 * env_* 等）由宿主在装配后渲染，译本里逐字保留；黑名单挡下的密钥类 env 变量
 * 本来就不会被注册，替换文本不引入任何新的变量引用。
 */
import { CORE } from './core.mjs'
import { UNDO } from './undo.mjs'
import { TEAMS } from './teams.mjs'
import { CORDIS } from './cordis.mjs'
import { SDK_ZH } from './sdk.mjs'

export const ZH_SECTIONS = {
  ...CORE,
  'tool:dsh-undo-savepoint': UNDO,
  'agent-teams:usage': TEAMS,
  'tool:cordis': CORDIS,
  'tools:sdk': SDK_ZH,
}

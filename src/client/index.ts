/**
 * dsh-prompt-customizer — browser half entry.
 *
 * Mounts the capability module (skills + MCP + prompt management), each piece
 * isolated so a failure in one cannot take down the others:
 *
 *  - skills panel → sidebar nav row + panel (SKILL / MCP / 提示词 top-level tabs)
 *  - prompt       → locale registration for the 提示词 tab (panel body lives in
 *                   `./prompt`, ported from dsh-prompt-customizer)
 *
 * 不再注册内核已经提供的那三样（`skill` locale 命名空间、`tool.call.toolview`
 * 的 `skill` 工具行、`/` 斜杠源）：它们属于 `@deepseek-ai/dsh-client-ui-skill`，
 * 而 locale / slots / inputTriggers 三个注册表对同名/同键**直接抛错**，且谁先
 * 注册谁让后来者抛 —— 重复注册会把内核插件的 apply 打挂，整条客户端插件加载
 * 链一起失败（0.6.0 实测踩过）。技能数据本身仍由本插件的面板与路由提供。
 *
 * All data comes from the host half's loopback-only HTTP routes via
 * same-origin fetch. No DSH source is modified.
 */

import type { Context as ClientContext } from '@deepseek-ai/cordis'
import { apply as applySkillsEntry } from './skills/entry.js'
import { applyPrompt } from './prompt/index.js'

/** Client services required before the browser half activates. */
export const inject = ['slots', 'locale', 'inputTriggers', 'sessions']

/** Run one module's apply, logging and swallowing any failure. */
function safe(label: string, run: (ctx: ClientContext) => void, ctx: ClientContext): void {
  try {
    run(ctx)
  } catch (error) {
    console.error(`[dsh-prompt-customizer] ${label} failed:`, error)
  }
}

export function apply(ctx: ClientContext): void {
  safe('skills panel', applySkillsEntry, ctx)
  safe('prompt locale', applyPrompt, ctx)
}

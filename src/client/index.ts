/**
 * dsh-prompt-customizer — browser half entry.
 *
 * Mounts the capability module (skills + MCP + prompt management), each piece
 * isolated so a failure in one cannot take down the others:
 *
 *  - skills panel → sidebar nav row + panel (SKILL / MCP / 提示词 top-level tabs)
 *  - skill source → `/` slash source (two-level bundles) + skill tool row
 *  - prompt       → locale registration for the 提示词 tab (panel body lives in
 *                   `./prompt`, ported from dsh-prompt-customizer)
 *
 * All data comes from the host half's loopback-only HTTP routes via
 * same-origin fetch. No DSH source is modified.
 */

import type { Context as ClientContext } from '@deepseek-ai/cordis'
import { apply as applySkillSource } from './skill-source/index.js'
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
  safe('skill source', applySkillSource, ctx)
  safe('prompt locale', applyPrompt, ctx)
}

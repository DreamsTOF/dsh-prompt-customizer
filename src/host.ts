/**
 * dsh-prompt-customizer — host half entry.
 *
 * Mounts two modules on one Cordis plugin:
 *
 *  - skills → skill bundle management (`/api/skill-manager/*`), per-skill and
 *             per-preset toggles (`/api/skill-toggles/*`), skill-root health
 *             (`/api/skill-health`)
 *  - mcp    → MCP Server status / config / presets / masks / tool-level
 *             enable-disable (`/api/triad/mcp-*`, `/api/mcp-recommended*`)
 *  - prompt → prompt customizer (`/api/prompt-customizer/*`), vendored under
 *             `vendor/prompt-customizer/` (per-agent-preset block / replace /
 *             inject by section name, per-phase tool filtering)
 *
 * The skills half is the already-proven `dsh-skill-manager` host, vendored
 * under `vendor/skill-manager/`. No DSH source is modified.
 *
 * Each module mounts inside its own try/catch: a failure in one must never
 * stop the others from mounting.
 */

import type { Context } from '@deepseek-ai/cordis'
// @ts-expect-error — vendored JS half (no type declarations shipped)
import { apply as applySkillsHost } from '../vendor/skill-manager/skills-host.js'
// @ts-expect-error — vendored JS half (no type declarations shipped)
import { apply as applyPromptHost } from '../vendor/prompt-customizer/index.js'
import { apply as applySkillToggles } from './skill-toggles.js'
import { applySkillHealth } from './skill-health.js'
import { applyMcpRecommended } from './mcp-recommended.js'
import { applyMcpStatus } from './mcp-status.js'
import { applyPresetServers } from './mcp-presets.js'
import { applyMcpPresetMask } from './mcp-preset-mask.js'
import { applyMcpPreviewRoute } from './mcp-paste.js'
import { applyMcpToolDisable } from './mcp-tool-disable.js'

/** Stable Cordis plugin name. */
export const name = 'dsh-prompt-customizer'

/**
 * Host services required before this plugin activates.
 *
 *  - webServer → every route below
 *  - tools     → MCP tool inventory + the assembly filter that hides
 *                disabled tools (`agentPresets` is read defensively, so it is
 *                not a hard dependency)
 */
export const inject = [
  'webServer',
  'tools',
]

export async function apply(ctx: Context): Promise<void> {
  // ── 技能集合管理（vendor/skill-manager：/api/skill-manager/*）──────────
  try {
    await applySkillsHost(ctx)
    ctx.logger?.info?.('[dsh-prompt-customizer] skill manager mounted')
  } catch (error) {
    ctx.logger?.warn?.(
      `[dsh-prompt-customizer] skill manager failed to mount: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
    )
  }

  // ── 技能开关（全局层 + Agent 预设层）───────────────────────────────
  // /api/skill-toggles/*：技能面板的开关与「Agent 预设」筛选条都靠它。
  // 与 skill-manager（集合管理）是两个独立模块，缺了这个面板顶部就没有
  // 预设条，且所有开关请求 404。
  try {
    await applySkillToggles(ctx)
    ctx.logger?.info?.('[dsh-prompt-customizer] skill toggles mounted')
  } catch (error) {
    ctx.logger?.warn?.(
      `[dsh-prompt-customizer] skill toggles failed to mount: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
    )
  }

  // ── 技能目录健康检查（同步状态卡片）────────────────────────────
  // GET /api/skill-health：只读扫描技能根目录 + bundle 账本，无写入。
  try {
    applySkillHealth(ctx)
    ctx.logger?.info?.('[dsh-prompt-customizer] skill health mounted')
  } catch (error) {
    ctx.logger?.warn?.(
      `[dsh-prompt-customizer] skill health failed to mount: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
    )
  }

  // ── MCP Server 推荐数据源 ──────────────────────────────────────
  // GET /api/mcp-recommended：拉取官方/社区 MCP 目录（离线兜底内置清单）。
  try {
    applyMcpRecommended(ctx)
    ctx.logger?.info?.('[dsh-prompt-customizer] mcp recommended mounted')
  } catch (error) {
    ctx.logger?.warn?.(
      `[dsh-prompt-customizer] mcp recommended failed to mount: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
    )
  }

  // ── 真实 MCP Server 状态（桥接注册的工具 + 分组）───────────────
  // GET /api/triad/mcp-status：只读 ctx.tools 中 mcp__* 工具，供面板 MCP 页
  // 显示真实注册状态（替代 localStorage 假数据）。
  try {
    applyMcpStatus(ctx)
    ctx.logger?.info?.('[dsh-prompt-customizer] mcp status mounted')
  } catch (error) {
    ctx.logger?.warn?.(
      `[dsh-prompt-customizer] mcp status failed to mount: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
    )
  }

  // ── 预设专属 MCP Server（L2a：写进用户预设的 agent.cordis.yml）────────
  // POST/DELETE /api/triad/mcp-presets/*：该行只对该预设（及其子代理）生效。
  try {
    applyPresetServers(ctx)
    ctx.logger?.info?.('[dsh-prompt-customizer] mcp preset servers mounted')
  } catch (error) {
    ctx.logger?.warn?.(
      `[dsh-prompt-customizer] mcp preset servers failed to mount: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
    )
  }

  // ── MCP 粘贴校验（JSON / DSH 原生 YAML）────────────────────────────
  // POST /api/triad/mcp-preview：解析 + 校验 + 预览，不写任何文件。
  try {
    applyMcpPreviewRoute(ctx)
    ctx.logger?.info?.('[dsh-prompt-customizer] mcp paste preview mounted')
  } catch (error) {
    ctx.logger?.warn?.(
      `[dsh-prompt-customizer] mcp paste preview failed to mount: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
    )
  }

  // ── MCP 单工具级启停（装配过滤 + agent 作用域 deny）───────────────────
  // PUT /api/triad/mcp-tools/:serverName：把某条工具从模型目录里摘掉
  // （server 连接与其它工具不受影响）。
  try {
    applyMcpToolDisable(ctx)
    ctx.logger?.info?.('[dsh-prompt-customizer] mcp tool disable mounted')
  } catch (error) {
    ctx.logger?.warn?.(
      `[dsh-prompt-customizer] mcp tool disable failed to mount: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
    )
  }

  // ── 提示词管理（vendor/prompt-customizer：/api/prompt-customizer/*）──────
  // 在带 systemPrompt 的子作用域里挂载：该服务缺席时整块不挂（其余模块不受
  // 影响），路由自带 connection 信任闸与 fail-closed 语义（见 vendor 源码）。
  try {
    ctx.inject(['systemPrompt'], (promptCtx: Context) => {
      try {
        applyPromptHost(promptCtx)
        promptCtx.logger?.info?.('[dsh-prompt-customizer] prompt customizer mounted')
      } catch (error) {
        promptCtx.logger?.warn?.(
          `[dsh-prompt-customizer] prompt customizer failed to mount: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
        )
      }
    })
  } catch (error) {
    ctx.logger?.warn?.(
      `[dsh-prompt-customizer] prompt customizer inject failed: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
    )
  }

  // ── 预设遮蔽（L2b：账本 + agent 作用域三层同名遮蔽）──────────────────
  // PUT /api/triad/mcp-masks/*：隐藏工具/指令/资源，全局连接保留。
  try {
    await applyMcpPresetMask(ctx)
    ctx.logger?.info?.('[dsh-prompt-customizer] mcp preset mask mounted')
  } catch (error) {
    ctx.logger?.warn?.(
      `[dsh-prompt-customizer] mcp preset mask failed to mount: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
    )
  }

}

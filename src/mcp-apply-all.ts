/**
 * mcp-apply-all — 「应用到所有预设」：把 MCP 的按预设配置（遮蔽 masks + 工具级启停）
 * 一次性覆盖为「全部/全局」状态（即清空各预设的 per-preset 覆盖，使其全部继承全局）。
 * 不影响工作区级（工作区另记 workspace 账本，单独处理）。
 *
 * 路由：`POST /api/triad/mcp-apply-all`
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { readMaskLedger, writeMaskLedger } from './mcp-mask-ledger.ts'
import { readToolLedger, writeToolLedger } from './mcp-tool-disable.ts'
import { rejectUntrusted, requireTrustedRequest } from './trust.ts'

type PluginContext = any
const ROUTE = '/api/triad/mcp-apply-all'

function json(res: any, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  res.end(JSON.stringify(body))
}
async function handle(ctx: PluginContext, req: IncomingMessage, res: ServerResponse): Promise<void> {
  const trust = requireTrustedRequest(ctx, req)
  if (!trust.ok) { rejectUntrusted(res, trust); return }
  if ((req.method ?? 'GET') !== 'POST') { json(res, 405, { ok: false, error: 'POST only' }); return }
  try {
    const mask = readMaskLedger(true)
    const clearedMasks = Object.keys(mask.presets ?? {}).length
    writeMaskLedger({ version: 1, presets: {} })

    const tool = readToolLedger(true)
    const clearedTools = Object.keys(tool.presets ?? {}).length
    writeToolLedger({ ...tool, presets: {} })

    json(res, 200, { ok: true, clearedMasks, clearedTools })
  } catch (error) {
    json(res, 500, { ok: false, error: error instanceof Error ? error.message : String(error) })
  }
}

export function applyMcpApplyAll(ctx: PluginContext): void {
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: ROUTE,
    handler: (req: IncomingMessage, res: ServerResponse) => { void handle(ctx, req, res) },
  }), 'triad: mcp apply-all route')
}

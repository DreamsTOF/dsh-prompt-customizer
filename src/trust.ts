/**
 * trust — 宿主私有 HTTP 路由的统一准入判断。
 *
 * 0.2.2 起浏览器请求的 Host / Origin / 会话凭据由 Connection 服务统一认证
 * （`ctx.connection.requestRejection({ headers })`）：优先走它，插件路由不再
 * 各自复制一套 Host 白名单，也不会和浏览器登录态脱节。
 *
 * Connection 缺席（裸组装 / 单测 / 非 Web 组合）时退回旧的本机回环判断：
 * socket 地址必须是 loopback，且 Host 头只能是 localhost / 127.0.0.1 / ::1。
 */

import type { IncomingMessage } from 'node:http'
import { optionalService } from './context-utils.ts'

interface ConnectionTrustRequestLike {
  readonly headers: Record<string, string | string[] | undefined>
}

interface ConnectionHandleLike {
  requestRejection?: (request: ConnectionTrustRequestLike) => number | undefined
}

/** 路由准入结果：`ok` 之外的状态码与错误码由调用方写进响应。 */
export type TrustResult =
  | { ok: true }
  | { ok: false; status: 401 | 403; error: string }

/** IPv4 / IPv6 回环地址（含 IPv4-mapped IPv6）。 */
export function isLoopbackAddress(address: string | undefined): boolean {
  if (typeof address !== 'string') return false
  const normalized = address.toLowerCase()
  if (normalized === '::1') return true
  const ipv4 = normalized.startsWith('::ffff:') ? normalized.slice(7) : normalized
  const octets = ipv4.split('.')
  return octets.length === 4
    && octets[0] === '127'
    && octets.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)
}

/** Host 头里的主机名（去端口、去 IPv6 方括号）；畸形值返回 null。 */
export function hostNameOf(value: string | string[] | undefined): string | null {
  if (typeof value !== 'string') return null
  const host = value.trim().toLowerCase()
  if (host.startsWith('[')) {
    const close = host.indexOf(']')
    if (close <= 1) return null
    const suffix = host.slice(close + 1)
    if (suffix !== '' && !/^:\d+$/.test(suffix)) return null
    return host.slice(1, close)
  }
  const firstColon = host.indexOf(':')
  const lastColon = host.lastIndexOf(':')
  if (firstColon !== lastColon) return null
  return firstColon === -1 ? host : host.slice(0, firstColon)
}

/** 旧回环判定（Connection 缺席时的兜底）。 */
export function loopbackAllowed(req: {
  socket?: { remoteAddress?: string }
  headers?: { host?: string | string[] | undefined }
}): boolean {
  if (!isLoopbackAddress(req?.socket?.remoteAddress)) return false
  const host = hostNameOf(req?.headers?.host)
  return host === 'localhost' || host === '127.0.0.1' || host === '::1'
}

/**
 * 判断一条请求是否允许访问宿主私有路由。
 * @param ctx - 宿主上下文（用于取 Connection 服务）。
 * @param req - node:http 请求（至少带 headers；回环兜底还需要 socket）。
 * @returns `{ ok: true }` 或拒绝状态码。
 */
export function requireTrustedRequest(
  ctx: unknown,
  req: Pick<IncomingMessage, 'headers'> & { socket?: { remoteAddress?: string } },
): TrustResult {
  const connection = optionalService<ConnectionHandleLike>(ctx, 'connection')
  if (typeof connection?.requestRejection === 'function') {
    try {
      const rejection = connection.requestRejection({
        headers: (req?.headers ?? {}) as Record<string, string | string[] | undefined>,
      })
      if (rejection === undefined) return { ok: true }
      if (rejection === 401) return { ok: false, status: 401, error: 'unauthorized' }
      if (rejection === 403) return { ok: false, status: 403, error: 'forbidden-host' }
      // 非 401/403 的返回值不在契约内：按拒绝处理。
      return { ok: false, status: 403, error: 'forbidden' }
    } catch {
      return { ok: false, status: 403, error: 'forbidden' }
    }
  }
  return loopbackAllowed(req)
    ? { ok: true }
    : { ok: false, status: 403, error: 'loopback-only' }
}

/** 拒绝响应的统一 JSON（各模块的 res 形状宽松，兼容测试 stub）。 */
export function rejectUntrusted(
  res: { writeHead: (status: number, headers: Record<string, string>) => void; end: (body: string) => void },
  result: { status: 401 | 403; error: string },
  extra?: Record<string, unknown>,
): void {
  res.writeHead(result.status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(JSON.stringify({ ok: false, error: result.error, ...extra }))
}

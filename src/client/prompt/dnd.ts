/**
 * dnd — 提示词面板的拖拽载荷 + 「拖到阶段 Tab」投递点。
 *
 * 三个 Tab 的拖拽手势（与 locales 里的提示文案一一对应）：
 *  - 列表内上下拖 = 排序（段行；工具列表按注册表顺序，不支持排序）；
 *  - 「全部」池 ⇄ 阶段列表 = 加入该阶段 / 从该阶段拿掉；
 *  - 行拖到头部阶段 Tab = 复制到那个阶段（工具的隐藏态一起带过去）。
 *
 * 载荷走两条路：`dataTransfer`（标准路径）与模块内存（dragover 阶段多数浏览器
 * 不给读 dataTransfer，同页面拖拽本来也不需要序列化）。阶段 Tab 在 Panel 头部、
 * 与列表不在同一棵子树，所以投递点用「当前挂载的列表注册一个回调」来接：
 * 换 Tab / 换模式时旧列表卸载、新列表注册，任何时刻只有一个处理者。
 */
import type { DragEvent as ReactDragEvent } from 'react'
import type { PhaseViewKey } from './types.ts'

/** 载荷种类：段行 / 工具行。 */
export type DragKind = 'section' | 'tool'
/** 来源：某个阶段列表，或「全部」只读池。 */
export type DragFrom = PhaseViewKey | 'pool'

export interface DragPayload {
  kind: DragKind
  name: string
  from: DragFrom
  /** 段行当前文本（拖到别的阶段时作为该阶段的注入文本）；工具不用。 */
  text?: string
  /** 工具行当前是否在该阶段隐藏：阶段间复制时一起带过去。 */
  hidden?: boolean
}

/** 自定义 MIME：同页面内用它区分「本面板的拖拽」与外部拖入（如导入技能）。 */
const MIME = 'application/x-dsh-prompt-part'

/**
 * 是不是本面板发起的拖拽 —— 原生事件版（drag-scroll 用）。
 *
 * 拖拽进行中 `dataTransfer.types` 可读（数据本身被保护，类型清单不保护），
 * 所以捕获阶段的监听能靠它过滤：只给自己人的拖拽做贴边滚动，外来拖入不滚。
 */
export function isPanelDrag(event: DragEvent): boolean {
  const types = event.dataTransfer?.types
  if (types === undefined) return false
  return Array.from(types).includes(MIME)
}

let current: DragPayload | null = null
let phaseDrop: ((key: PhaseViewKey, payload: DragPayload) => void) | null = null

/** 拖起：登记载荷 + 写 dataTransfer（写不进去也能靠内存载荷继续）。 */
export function beginDrag(event: ReactDragEvent, payload: DragPayload): void {
  current = payload
  try {
    event.dataTransfer.setData(MIME, JSON.stringify(payload))
    event.dataTransfer.setData('text/plain', payload.name)
    event.dataTransfer.effectAllowed = 'copyMove'
  } catch { /* 自定义 MIME 被拒：读侧回落内存载荷 */ }
}

/** 拖完：清掉载荷（drop 之后浏览器还会补一次 dragend）。 */
export function finishDrag(): void {
  current = null
}

/** 读载荷：优先 dataTransfer，回落内存（dragover 阶段只可能是后者）。 */
export function payloadOf(event: ReactDragEvent): DragPayload | null {
  try {
    const raw = event.dataTransfer.getData(MIME)
    if (raw !== '') return JSON.parse(raw) as DragPayload
  } catch { /* 读不到就用内存载荷 */ }
  return current
}

/** 是不是本面板认可的可投放载荷（dragover 靠它决定要不要 preventDefault）。 */
export function acceptsDrop(event: ReactDragEvent, kind: DragKind): boolean {
  const payload = payloadOf(event)
  return payload !== null && payload.kind === kind
}

/** 当前挂载的列表（段 / 工具）把「拖到阶段 Tab」的处理函数注册进来。 */
export function setPhaseDropHandler(next: ((key: PhaseViewKey, payload: DragPayload) => void) | null): void {
  phaseDrop = next
}

/** 阶段 Tab 被投放：交给当前挂载的列表处理（没有列表就什么都不做）。 */
export function dropOnPhase(key: PhaseViewKey, payload: DragPayload | null): void {
  if (payload === null) return
  phaseDrop?.(key, payload)
}

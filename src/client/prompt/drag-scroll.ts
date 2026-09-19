/**
 * drag-scroll —— 拖拽时贴边自动滚动。
 *
 * 列表比视口长的时候，靠手拖根本到不了视口外的投放位置（把行拖到上面的第
 * 3 个位置、或从底部「全部」池拖到顶部，都要先停下来滚一滚 —— 而拖拽中
 * 是滚不了的）。这里在指针进入容器上/下边缘带时持续滚动：越靠边越快，指针
 * 回到中间就停。
 *
 * 两个实现要点：
 * - HTML5 拖拽只在指针移动时给 `dragover`，靠它一次滚一屏会一顿一顿，所以
 *   边缘内改用 requestAnimationFrame 逐帧滚（每帧最多 MAX_STEP 像素）；
 * - 行上的投放处理会在冒泡阶段 `stopPropagation`，所以这里用**捕获**阶段
 *   的原生监听挂在滚动容器上 —— 捕获先于冒泡执行，不受行处理影响。
 */
import { useEffect, type RefObject } from 'react'
import { isPanelDrag } from './dnd.ts'

/** 进入这个像素带开始滚。 */
const EDGE = 56
/** 每帧最大滚动像素（越靠边越接近它）。 */
const MAX_STEP = 18

/**
 * 给滚动容器挂上「拖拽贴边自动滚」。
 *
 * 传入的 ref 指向真正 overflow-y:auto 的那一层（列表 + 池都在里面，所以滚动
 * 它就能把任一投放位置带进视口）。只在指针处于容器垂直范围内且贴着上/下边
 * 缘时滚，横向不参与。
 */
export function useDragAutoScroll(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = ref.current
    if (el === null) return undefined

    let frame = 0
    let step = 0
    let pendingY: number | null = null

    const stopScroll = (): void => {
      step = 0
      pendingY = null
      if (frame !== 0) {
        cancelAnimationFrame(frame)
        frame = 0
      }
    }

    const stepFrame = (): void => {
      frame = 0
      if (step === 0) return
      const before = el.scrollTop
      el.scrollTop += step
      // 滚到头（浏览器把 scrollTop 夹住）就停，别空转 rAF。
      if (el.scrollTop === before) {
        step = 0
        return
      }
      frame = requestAnimationFrame(stepFrame)
    }

    const measure = (clientY: number): void => {
      const rect = el.getBoundingClientRect()
      const fromTop = clientY - rect.top
      const fromBottom = rect.bottom - clientY
      step = fromTop < EDGE
        ? -Math.ceil(((EDGE - fromTop) / EDGE) * MAX_STEP)
        : fromBottom < EDGE
          ? Math.ceil(((EDGE - fromBottom) / EDGE) * MAX_STEP)
          : 0
      if (step === 0) {
        stopScroll()
        return
      }
      if (frame === 0) frame = requestAnimationFrame(stepFrame)
    }

    const onDragOver = (event: DragEvent): void => {
      // 只认本面板自己的拖拽：外部拖入（比如往技能面板丢文件）不滚。
      if (!isPanelDrag(event)) {
        stopScroll()
        return
      }
      pendingY = event.clientY
      measure(event.clientY)
    }

    // 指针只是从容器挪进子元素时也会来一条 dragleave，别把它当成「离开」。
    const onDragLeave = (event: DragEvent): void => {
      const to = event.relatedTarget as Node | null
      if (to !== null && el.contains(to)) return
      stopScroll()
    }

    const onEnd = (): void => stopScroll()

    el.addEventListener('dragover', onDragOver, true)
    el.addEventListener('dragleave', onDragLeave, true)
    el.addEventListener('drop', onEnd, true)
    // dragend 只发给拖起元素（可能在别的容器里），挂 window 最稳。
    window.addEventListener('dragend', onEnd)
    // 指针在边缘带里静止时浏览器仍会给零星的 dragover；若一次都没有（离开
    // 容器前的最后一次），下一次拖拽开始前把状态清干净。
    window.addEventListener('dragstart', onEnd)

    return () => {
      stopScroll()
      el.removeEventListener('dragover', onDragOver, true)
      el.removeEventListener('dragleave', onDragLeave, true)
      el.removeEventListener('drop', onEnd, true)
      window.removeEventListener('dragend', onEnd)
      window.removeEventListener('dragstart', onEnd)
      // pendingY 只在拖拽期间有意义；退出时清掉，避免陈旧引用。
      pendingY = null
    }
  }, [ref])
}

/**
 * PromptView — 「提示词」顶层 tab 的内容。
 *
 * 直接复用上游面板本体（Panel）：头部模式切换 / 保存 / 刷新、agent 预设编辑目标、
 * 左栏勾选 + 右栏装配预览，全部保持原样；这里只提供撑满 tab 的容器与文案函数。
 */
import { Panel } from './Panel.tsx'
import { promptT } from './index.ts'

export function PromptView(): JSX.Element {
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <Panel t={promptT()} />
    </div>
  )
}

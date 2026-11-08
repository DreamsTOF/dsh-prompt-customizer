/**
 * PromptView — 「提示词」顶层 tab 的内容。
 *
 * 直接复用上游面板本体（Panel）：单预设的提示词 / 工具编辑、保存 / 刷新、
 * 左栏勾选 + 右栏装配预览；工作区级提示词/工具层已归档下线。
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

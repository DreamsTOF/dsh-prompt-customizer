/**
 * 客户端 bundle 的 Windows 桌面版适配检查。
 *
 * 背景（实测）：桌面版 Windows 上点 SKILL / MCP / 提示词 tab 完全无反应 ——
 * DSH 在 `.frame::before` 铺了一条 `--dsh-windows-titlebar-height` 高的
 * `-webkit-app-region: drag` 拖拽条，Electron 的 app-region 按几何 + 文档顺序
 * 合成，落在该条几何内的元素收不到鼠标事件。DSH 只在 darwin 上写了
 * `body > :not(#root){no-drag}` 放行规则，**Windows 没有等价规则**。
 * 本面板 portal 到 body、drawer 从 top:0 起，头部（tab 那一行）正好落在拖拽条里。
 *
 * web 版没有拖拽条，所以同一份代码在 web 上完全正常 —— 这就是它长期没被发现的
 * 原因。这条断言把「面板必须让出 Windows 标题栏高度」钉在构建产物上。
 *
 * Usage: node --test test/windows-titlebar.test.mjs
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const CLIENT = path.join(ROOT, 'client/client.js')

const bundle = fs.readFileSync(CLIENT, 'utf8')

test('面板让出 Windows 标题栏高度（否则顶部 tab 被拖拽条吞掉点击）', () => {
  assert.match(
    bundle,
    /\[data-windows-titlebar\]\s*\.psh-card\{[^}]*dsh-windows-titlebar-height/,
    'client.js 里缺少 [data-windows-titlebar] .psh-card 的 top 让位规则',
  )
})

test('drawer 让位后高度由 top/bottom 决定（不能留死高 100dvh）', () => {
  assert.match(
    bundle,
    /\[data-windows-titlebar\]\s*\.psh-card\[data-mode='drawer'\]\{[^}]*bottom:0/,
    'drawer 在 Windows 下需要取消固定高度，否则让位后底部溢出',
  )
})

test('样式文本里不残留 CSS Module 的 :global()（注入的是纯 CSS）', () => {
  // popover-shell 用 textContent 注入纯 CSS 文本，:global() 不会被编译掉。
  const sheetStart = bundle.indexOf('.psh-card{position:fixed')
  assert.ok(sheetStart > 0, '找不到 psh-card 样式表')
  const window = bundle.slice(sheetStart, sheetStart + 6000)
  assert.equal(window.includes(':global('), false, '注入的纯 CSS 里不应出现 :global()')
})

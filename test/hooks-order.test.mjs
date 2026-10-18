/**
 * React hooks 顺序静态检查：同一个组件内的 hooks 必须全部位于**该组件**的
 * 第一个提前 return 之前。
 *
 * 为什么需要这条：React #310「Rendered more hooks than during the previous
 * render」在构建和普通单测里都不报（单测只渲染一个状态），只有真机上从
 * loading → loaded 切换时才炸。实测踩过：`useState(rescanning)` 写在
 * `if (cfg === null) return <loading>` 之后，点开提示词面板即崩溃并跳回对话。
 *
 * 判定方式：按顶层 `function` / 箭头组件切分作用域，在每个作用域内找第一个
 * 组件级 return（两空格缩进），检查其后是否还有 hook 调用。
 *
 * Usage: node --test test/hooks-order.test.mjs
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const CLIENT_SRC = path.join(ROOT, 'src/client')

function sources(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...sources(full))
    else if (/\.tsx?$/.test(entry.name)) out.push(full)
  }
  return out
}

const HOOK_RE = /\buse[A-Z][A-Za-z0-9]*\s*\(/
/** 组件级 return：恰好两空格缩进的 return / if 块开头。 */
const COMPONENT_RETURN_RE = /^  (?:return\b|if \(.+\) \{?$)/

/** 按顶层（零缩进）的 function 声明切出每个组件作用域。
 *  只收组件（名字大写开头）；`useXxx` 是自定义 hook —— 它内部出现多个 hook
 *  是正常的，且它本身常被别的 hook 之后调用，不是一个渲染单元。 */
function componentScopes(lines) {
  const scopes = []
  let start = -1
  for (let i = 0; i < lines.length; i++) {
    if (/^(?:export )?function [A-Z]/.test(lines[i])) {
      if (start >= 0) scopes.push({ start, end: i - 1 })
      start = i
    } else if (/^(?:export )?(?:async )?function /.test(lines[i])) {
      // 其它顶层函数（含 useXxx）：结束当前作用域，且不把它自己当成组件。
      if (start >= 0) scopes.push({ start, end: i - 1 })
      start = -1
    }
  }
  if (start >= 0) scopes.push({ start, end: lines.length - 1 })
  return scopes
}

const offenders = []

for (const file of sources(CLIENT_SRC)) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/')
  const lines = fs.readFileSync(file, 'utf8').split('\n')

  for (const scope of componentScopes(lines)) {
    // 该组件作用域内第一个「两空格缩进的 return / if 块」= 提前 return。
    let firstReturn = -1
    for (let i = scope.start + 1; i <= scope.end; i++) {
      if (COMPONENT_RETURN_RE.test(lines[i])) { firstReturn = i; break }
    }
    if (firstReturn < 0) continue

    for (let i = firstReturn + 1; i <= scope.end; i++) {
      const line = lines[i]
      if (!HOOK_RE.test(line)) continue
      const trimmed = line.trim()
      if (trimmed.startsWith('*') || trimmed.startsWith('//')) continue
      offenders.push(`${rel}:${i + 1}  ${trimmed.slice(0, 90)}`)
    }
  }
}

test('组件内 hooks 全部位于该组件的提前 return 之前', () => {
  assert.deepEqual(offenders, [], `以下 hook 出现在提前 return 之后，会导致 React #310：\n${offenders.join('\n')}`)
})

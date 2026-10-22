/**
 * 客户端 ui-primitives 导入名白名单守卫。
 *
 * 事故背景（0.10.0 提交后回归）：MCP 页新增了一块列表，图标随手写成
 * `IconFolderOutlineRegular` —— 宿主 `@deepseek-ai/dsh-client-ui-primitives`
 * 根本没导出这个名字，于是该 JSX 组件是 `undefined`，React 抛
 * `Element type is invalid`，MCP 页整块被 ErrorBoundary 摘掉：用户点 MCP tab
 * 就闪退回对话界面。单元测试全绿（构建、路由、host 全都没问题），只有真在浏览器
 * 里点一下才会暴露 —— 所以这道静态守卫专盯「名字是不是宿主真有的」。
 *
 * 两段检查：
 *   1. 源码里从该包导入的每个名字都必须在 `test/fixtures/client-ui-primitives.json`
 *      的 verified 列表里（新增名字必须先人工核对再加白名单）；
 *   2. 若找得到宿主打包产物（app.asar）或 DSH 检出，再逐个确认该名字在那里真的
 *      出现（用标识符边界匹配，避免 `IconFolderOpenOutline` 蹭到
 *      `IconFolderOpenOutlineRegular` 而误判为存在）。
 *
 * Usage: node --test test/client-primitives.test.mjs
 *   DSH_HOST_ASAR  可选：宿主的 app.asar 路径（缺省试打包安装路径）
 *   DSH_CHECKOUT   可选：DSH 检出根（在 asar 缺失时退而查检出里的源码）
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const CLIENT_DIR = resolve('src/client')
const FIXTURE = resolve('test/fixtures/client-ui-primitives.json')
const DEFAULT_ASAR = 'C:\\Users\\Administrator\\AppData\\Local\\Programs\\DeepSeek Harness\\resources\\app.asar'
const DEFAULT_CHECKOUT = 'D:\\dsh-pulgn\\deepseek-harness'

/** 递归收集客户端源码文件。 */
function clientSources(dir = CLIENT_DIR, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) clientSources(path, out)
    else if (/\.tsx?$/.test(entry.name)) out.push(path)
  }
  return out
}

/** 源码里从指定包导入的全部名字（含 `as` 别名取原名）。 */
function importedNames(packageName) {
  const escaped = packageName.replace(/[/@.]/g, (char) => `\\${char}`)
  const pattern = new RegExp(`import\\s*\\{([^}]*)\\}\\s*from\\s*['"]${escaped}['"]`, 'g')
  const names = new Map()
  for (const file of clientSources()) {
    const source = readFileSync(file, 'utf8')
    for (const match of source.matchAll(pattern)) {
      for (const raw of match[1].split(',')) {
        const name = raw.trim().split(/\s+as\s+/)[0].trim()
        if (name === '') continue
        if (!names.has(name)) names.set(name, file)
      }
    }
  }
  return names
}

/** 该标识符在文本里是否作为独立标识符出现（不吃掉同前缀的更长名字）。 */
function hasIdentifier(text, name) {
  const escaped = name.replace(/[$]/g, '\\$')
  return new RegExp(`${escaped}(?![A-Za-z0-9_$])`).test(text)
}

/** 可用的宿主证据来源：app.asar 优先，其次 DSH 检出里的 ui-primitives 源码。 */
function hostEvidence() {
  const asar = process.env.DSH_HOST_ASAR ?? DEFAULT_ASAR
  if (existsSync(asar)) return { kind: 'asar', path: asar, text: readFileSync(asar, 'latin1') }
  const checkout = process.env.DSH_CHECKOUT ?? DEFAULT_CHECKOUT
  const dir = join(checkout, 'packages', 'client', 'ui-primitives', 'src')
  if (existsSync(dir)) {
    const text = clientSources(dir, []).length === 0 ? '' : (function collect(current, out) {
      for (const entry of readdirSync(current, { withFileTypes: true })) {
        const path = join(current, entry.name)
        if (entry.isDirectory()) collect(path, out)
        else if (/\.tsx?$/.test(entry.name)) out.push(readFileSync(path, 'utf8'))
      }
      return out
    })(dir, []).join('\n')
    return { kind: 'checkout', path: dir, text }
  }
  return undefined
}

const fixture = JSON.parse(readFileSync(FIXTURE, 'utf8'))
const verified = new Set(fixture.verified)

test('客户端 ui-primitives 导入名全部在白名单里（防「宿主没这个图标」）', () => {
  const used = importedNames(fixture.package)
  assert.ok(used.size > 0, '没有解析到任何 ui-primitives 导入，检查解析正则')
  const unknown = [...used.keys()].filter((name) => !verified.has(name))
  assert.deepEqual(unknown, [],
    `以下名字不在白名单里，会被当成 undefined 组件直接崩掉面板：${unknown.join(', ')}\n`
    + '先确认宿主真的导出它们（grep 打包产物 / 读 ui-primitives 类型声明），再更新 '
    + 'test/fixtures/client-ui-primitives.json 的 verified 列表。')
})

test('白名单里的每个名字在宿主里真的存在', (t) => {
  const evidence = hostEvidence()
  if (evidence === undefined) {
    t.diagnostic('跳过：找不到宿主 app.asar 或 DSH 检出（可用 DSH_HOST_ASAR / DSH_CHECKOUT 指定）')
    return
  }
  const missing = fixture.verified.filter((name) => !hasIdentifier(evidence.text, name))
  assert.deepEqual(missing, [],
    `${evidence.kind} (${evidence.path}) 里找不到这些名字：${missing.join(', ')}`)
  t.diagnostic(`宿主证据：${evidence.kind} ${evidence.path}（已核对 ${fixture.verified.length} 个名字）`)
})

test('白名单里的名字都被源码真的用到了（不留过期条目）', () => {
  const used = new Set(importedNames(fixture.package).keys())
  const stale = fixture.verified.filter((name) => !used.has(name))
  assert.deepEqual(stale, [], `白名单里这些名字已无人使用，删掉它们以保持可信：${stale.join(', ')}`)
})

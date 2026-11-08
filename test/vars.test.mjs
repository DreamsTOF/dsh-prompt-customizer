/**
 * 提示词变量：Intl 日期/星期、统一 dshHome、宿主 shell 缺省 unknown、
 * env 名归并冲突不注册并记录、envBlocklist 动态生效。
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  envVarName,
  installPromptVariables,
  isBlockedEnvKey,
  planEnvBindings,
} from '../src/vars.ts'
import { dshHome } from '../src/home-paths.ts'

function fakeSystemPrompt() {
  const providers = new Map()
  return {
    providers,
    variable(name, provider) {
      if (providers.has(name)) throw new Error(`duplicate ${name}`)
      providers.set(name, provider)
      return () => providers.delete(name)
    },
  }
}

test('vars：env 名归并冲突只注册第一个并记录', () => {
  const plan = planEnvBindings({ 'A.B': '1', 'A-B': '2', 'A B': '3' })
  assert.equal(envVarName('A.B'), 'env_a_b')
  assert.equal(plan.bindings.length, 1)
  assert.equal(plan.bindings[0].key, 'A.B')
  assert.deepEqual(plan.conflicts.env_a_b, ['A-B', 'A B'])
  assert.equal(isBlockedEnvKey('MY_TOKEN_VALUE', ['*token*']), true)
  assert.equal(isBlockedEnvKey('PATH', ['*token*']), false)
})

test('vars：日期/时间/星期按宿主 locale 与 TZ 用 Intl 渲染', () => {
  const saved = { TZ: process.env.TZ, DSH_HOME: process.env.DSH_HOME }
  process.env.TZ = 'Asia/Shanghai'
  process.env.DSH_HOME = join(tmpdir(), 'pc-vars-home')
  try {
    const host = fakeSystemPrompt()
    const installation = installPromptVariables(host, { detectShell: () => undefined })
    const date = host.providers.get('date')()
    const time = host.providers.get('time')()
    const weekday = host.providers.get('weekday')()
    const expectedDate = new Intl.DateTimeFormat(undefined, { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
    const expectedTime = new Intl.DateTimeFormat(undefined, { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date())
    const expectedWeekday = new Intl.DateTimeFormat(undefined, { timeZone: 'Asia/Shanghai', weekday: 'long' }).format(new Date())
    assert.equal(date, expectedDate)
    assert.equal(time, expectedTime)
    assert.equal(weekday, expectedWeekday)
    assert.equal(host.providers.get('home')(), dshHome(), 'home 走统一 dshHome')
    assert.equal(host.providers.get('shell')(), 'unknown', '宿主无 shell 时标注 unknown')
    installation.dispose()
    assert.equal(host.providers.size, 0)
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
})

test('vars：envBlocklist 每次装配读取最新配置（命中返回空串，解除后恢复）', () => {
  const key = 'PC_VARS_SECRET_TOKEN'
  const saved = process.env[key]
  process.env[key] = 'leak-me'
  let block = ['*TOKEN*']
  try {
    const host = fakeSystemPrompt()
    const installation = installPromptVariables(host, {
      readBlocklist: () => block,
      detectShell: () => 'C:\\Windows\\System32\\cmd.exe',
    })
    const provider = host.providers.get('env_pc_vars_secret_token')
    assert.equal(typeof provider, 'function')
    assert.equal(provider(), '', '命中黑名单时不能把值发给模型')
    block = []
    assert.equal(provider(), 'leak-me', '配置改小后无需重挂即恢复')
    assert.equal(host.providers.get('shell')(), 'C:\\Windows\\System32\\cmd.exe')
    installation.dispose()
  } finally {
    if (saved === undefined) delete process.env[key]
    else process.env[key] = saved
  }
})

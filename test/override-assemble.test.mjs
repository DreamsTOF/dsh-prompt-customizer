import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { stringify as yamlStringify } from 'yaml'
import { apply } from '../lib/index.js'

/** Minimal Cordis ctx + 临时 dataDir：配置写入 tmp 的 config.yaml。 */
function makeCtx(config) {
  let handler
  const handlers = {}
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-override-'))
  if (config !== undefined) {
    fs.writeFileSync(path.join(dataDir, 'config.yaml'), yamlStringify(config))
  }
  const ctx = {
    on: (name, h) => {
      if (name === 'system-prompt/assemble') handler = h
      else handlers[name] = h
    },
    get: () => undefined,
    effect: () => {},
  }
  return { ctx, handler: () => handler, handlers, dataDir }
}

const SECTIONS = [
  { name: 'harness:source', order: 0, text: 'source' },
  { name: 'harness:identity', order: 1, text: 'identity' },
]
const TOOLS = [{ name: 'a' }, { name: 'b' }, { name: 'c' }]

/** 会话型装配上下文：header 决定所属预设，events 驱动晋级阶段。 */
function agentOf(preset, events = [], delegationDepth = 0) {
  return { session: { id: preset ?? 's', header: { agentPreset: preset, delegationDepth }, events } }
}

const BOOT_CONFIG = {
  overrides: {
    whoami: {
      sections: ['harness:identity'],
      inject: [
        { name: 'boot-only', order: -10, text: 'BOOT', phase: 'bootstrap' },
        { name: 'post-only', order: -9, text: 'POST', phase: 'active' },
      ],
      tools: { exclude: [], include: [], bootstrap: { exclude: [], include: ['a'] } },
    },
  },
}

async function run(config, context) {
  const { ctx, handler, dataDir } = makeCtx(config)
  apply(ctx, { dataDir })
  const assembly = { sections: SECTIONS.map((s) => ({ ...s })), tools: TOOLS.map((t) => ({ ...t })), contexts: [], variables: {} }
  return handler()(assembly, context, async () => assembly)
}

test('override fields take over for a session of that preset; others see global', async () => {
  const res = await run(BOOT_CONFIG, { agent: agentOf('whoami') })
  // sections 接管：identity 被屏蔽；bootstrap 注入段在场，source 保留。
  const names = res.sections.map((s) => s.name)
  assert.ok(names.includes('harness:source'))
  assert.ok(!names.includes('harness:identity'))

  const other = await run(BOOT_CONFIG, { agent: agentOf('standard') })
  assert.equal(other.sections.length, 2)
  assert.equal(other.tools.length, 3)
})

test('bootstrap phase hides active-phase injects and narrows the catalog', async () => {
  const res = await run(BOOT_CONFIG, { agent: agentOf('whoami') })
  const names = res.sections.map((s) => s.name)
  assert.ok(names.includes('boot-only'))
  assert.ok(!names.includes('post-only'))
  assert.deepEqual(res.tools.map((t) => t.name), ['a'])
})

test('after promotion the active phase and static filter return', async () => {
  const promoted = agentOf('whoami', [{ seq: 1, type: 'tool/call' }])
  const res = await run(BOOT_CONFIG, { agent: promoted })
  const names = res.sections.map((s) => s.name)
  assert.ok(!names.includes('boot-only'))
  assert.ok(names.includes('post-only'))
  assert.deepEqual(res.tools.map((t) => t.name), ['a', 'b', 'c'])
})

test('explicit promptCustomizerPreset hint overrides session resolution (preview path)', async () => {
  // 无 agent 的装配按已晋级处理：override 生效（identity 屏蔽）且显示
  // active 段、隐藏 bootstrap 段、使用静态工具过滤。
  const res = await run(BOOT_CONFIG, { promptCustomizerPreset: 'whoami' })
  const names = res.sections.map((s) => s.name)
  assert.ok(!names.includes('harness:identity'))
  assert.ok(names.includes('post-only'))
  assert.ok(!names.includes('boot-only'))
  assert.deepEqual(res.tools.map((t) => t.name), ['a', 'b', 'c'])
})

test('a broken context degrades to the untouched assembly', async () => {
  // context.agent 的 getter 抛错 —— 过滤器自身的异常路径必须降级而不是炸装配。
  const evil = {}
  Object.defineProperty(evil, 'agent', { get() { throw new Error('boom') } })
  const res = await run(BOOT_CONFIG, evil)
  assert.equal(res.sections.length, 2)
  assert.equal(res.tools.length, 3)
})

test('a corrupt config file degrades to defaults instead of throwing', async () => {
  const { ctx, handler, dataDir } = makeCtx(BOOT_CONFIG)
  fs.writeFileSync(path.join(dataDir, 'config.yaml'), '{ sections: [broken')
  apply(ctx, { dataDir })
  const assembly = { sections: SECTIONS.map((s) => ({ ...s })), tools: TOOLS.map((t) => ({ ...t })), contexts: [], variables: {} }
  const res = await handler()(assembly, {}, async () => assembly)
  assert.equal(res.sections.length, 2)
  assert.equal(res.tools.length, 3)
})

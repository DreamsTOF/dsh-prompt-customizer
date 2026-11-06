import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createPhaseToolVisibility } from '../vendor/prompt-customizer/tool-visibility.js'

/**
 * 0.2.2-rc.1 的回归：装配瀑布流不再携带 tools，阶段化工具目录必须落到
 * agent 作用域 restrict 上，并随会话事件切换阶段。
 */
function harness() {
  const handlers = new Map()
  const restricts = []
  const disposals = []
  const tools = {
    schemas: () => [{ name: 'bash' }, { name: 'edit' }, { name: 'read' }],
    restrict: (filter) => {
      restricts.push([...filter.deny])
      const dispose = () => disposals.push([...filter.deny])
      return dispose
    },
  }
  const agent = {
    id: 'agent-1',
    session: { header: { agentPreset: 'standard' }, delegationDepth: undefined },
    ctx: { get: (name) => (name === 'tools' ? tools : undefined) },
  }
  const ctx = {
    logger: { warn: () => {} },
    get: (name) => (name === 'tools' ? tools : name === 'agents' ? { list: () => [agent] } : undefined),
    on: (event, handler) => {
      if (!handlers.has(event)) handlers.set(event, [])
      handlers.get(event).push(handler)
      return () => {}
    },
    effect: (run) => {
      const dispose = run()
      return typeof dispose === 'function' ? dispose : () => {}
    },
  }
  const emit = (event, ...args) => {
    for (const handler of handlers.get(event) ?? []) handler(...args)
  }
  return { ctx, agent, restricts, disposals, emit }
}

test('阶段化工具目录：bootstrap / active 各自安装 restrict', () => {
  const h = harness()
  let phase = { promoted: false, boundary: -1 }
  const visibility = createPhaseToolVisibility({
    ctx: h.ctx,
    readConfig: () => ({
      overrides: {
        standard: {
          tools: {
            bootstrap: { exclude: ['bash'] },
            exclude: ['edit'],
          },
        },
      },
    }),
    phaseOf: () => phase,
    presetOf: () => 'standard',
  })

  visibility.sync(h.agent)
  assert.deepEqual(h.restricts, [['bash']], '引导期只隐藏 bootstrap.exclude 命中的工具')

  phase = { promoted: true, boundary: -1 }
  h.emit('session/event', h.agent.session, { type: 'tool/call', seq: 1 })
  assert.deepEqual(h.restricts, [['bash'], ['edit']], '晋级后换成常驻期 exclude')
  assert.deepEqual(h.disposals, [['bash']], '安装新 restrict 前释放旧 restrict')

  visibility.sync(h.agent)
  assert.deepEqual(h.restricts, [['bash'], ['edit']], '同一阶段重复同步不重复安装')
})

test('阶段化工具目录：配置里不存在的工具名不会送进 restrict', () => {
  const h = harness()
  const visibility = createPhaseToolVisibility({
    ctx: h.ctx,
    readConfig: () => ({ overrides: { standard: { tools: { exclude: ['missing-tool', 'bash'] } } } }),
    phaseOf: () => ({ promoted: true, boundary: -1 }),
    presetOf: () => 'standard',
  })
  visibility.sync(h.agent)
  assert.deepEqual(h.restricts, [['bash']], '只提交注册表里真实存在的工具名')
})

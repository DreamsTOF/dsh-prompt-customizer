import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createPhaseToolVisibility } from '../vendor/prompt-customizer/tool-visibility.js'

/**
 * 0.2.2-rc.1 的回归：装配瀑布流不再携带 tools，阶段化工具目录必须落到
 * agent 作用域 restrict 上，并随会话事件切换阶段。
 */
function harness({ restrictableNames = ['bash', 'edit', 'read'] } = {}) {
  const handlers = new Map()
  const restricts = []
  const disposals = []
  const tools = {
    schemas: () => [{ name: 'bash' }, { name: 'edit' }, { name: 'read' }],
    restrict: (filter) => {
      for (const name of filter.deny ?? []) {
        if (!restrictableNames.includes(name)) throw new Error(`unknown global tool "${name}"`)
      }
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
  const emit = (event, ...args) => (handlers.get(event) ?? []).map((handler) => handler(...args))
  return { ctx, agent, tools, restricts, disposals, emit }
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
            bootstrap: { exclude: [{ name: 'bash', source: { kind: 'global' } }] },
            exclude: [{ name: 'edit', source: { kind: 'global' } }],
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
    readConfig: () => ({ overrides: { standard: { tools: { exclude: [{ name: 'missing-tool' }, { name: 'bash', source: { kind: 'global' } }] } } } }),
    phaseOf: () => ({ promoted: true, boundary: -1 }),
    presetOf: () => 'standard',
  })
  visibility.sync(h.agent)
  assert.deepEqual(h.restricts, [['bash']], '只提交注册表里真实存在的工具名')
})

test('阶段化工具目录：preset / agent / global 多个来源的工具都会进入 restrict', () => {
  const h = harness()
  const visibility = createPhaseToolVisibility({
    ctx: h.ctx,
    readConfig: () => ({
      overrides: {
        standard: {
          tools: {
            exclude: [
              { name: 'bash', source: { kind: 'preset' } },
              { name: 'edit', source: { kind: 'agent' } },
              { name: 'read', source: { kind: 'global' } },
            ],
          },
        },
      },
    }),
    phaseOf: () => ({ promoted: true, boundary: -1 }),
    presetOf: () => 'standard',
  })
  visibility.sync(h.agent)
  assert.deepEqual(h.restricts, [['bash', 'edit', 'read']])
})

test('阶段化工具目录：readConfig 返回已合并的生效配置（工作区 exclude 也生效）', () => {
  const h = harness()
  const visibility = createPhaseToolVisibility({
    ctx: h.ctx,
    readConfig: () => ({
      tools: {
        exclude: [{ name: 'edit', source: { kind: 'workspace' } }],
        bootstrap: { exclude: [] },
      },
    }),
    phaseOf: () => ({ promoted: true, boundary: -1 }),
  })
  visibility.sync(h.agent)
  assert.deepEqual(h.restricts, [['edit']], '工作区级 tools.exclude 通过 restrict 收窄')
})

test('阶段化工具目录：任意数量工具泛化进入 restrict，且 restrict 后同步不撤销', () => {
  const generated = Array.from({ length: 24 }, (_, index) => `generated-tool-${String(index).padStart(2, '0')}`)
  const h = harness({ restrictableNames: generated })
  h.tools.schemas = () => generated.map((name) => ({ name }))
  let phase = { promoted: true, boundary: -1 }
  const visibility = createPhaseToolVisibility({
    ctx: h.ctx,
    readConfig: () => ({
      overrides: {
        standard: {
          tools: {
            exclude: generated.map((name, index) => ({
              name,
              source: { kind: ['preset', 'agent', 'global'][index % 3] },
            })),
          },
        },
      },
    }),
    phaseOf: () => phase,
    presetOf: () => 'standard',
  })
  visibility.sync(h.agent)
  assert.deepEqual(h.restricts, [generated], '所有生成工具都应进入 deny')
  // 模拟 restrict 生效后可见 schemas 缩小：再次同步不能撤销 deny。
  h.tools.schemas = () => []
  phase = { promoted: true, boundary: -1 }
  h.emit('session/event', h.agent.session, { type: 'turn/start' })
  assert.deepEqual(h.restricts, [generated], '相同 deny 不应重复安装')
  assert.deepEqual(h.disposals, [], '不能释放仍在生效的 restrict')
})

test('tools/pre-execute 对配置中的任意工具做运行时拦截', async () => {
  const h = harness()
  const visibility = createPhaseToolVisibility({
    ctx: h.ctx,
    readConfig: () => ({
      overrides: {
        standard: { tools: { exclude: [{ name: 'bash' }] } },
      },
    }),
    phaseOf: () => ({ promoted: true, boundary: -1 }),
    presetOf: () => 'standard',
  })
  visibility.sync(h.agent)
  const decisions = await Promise.all(h.emit('tools/pre-execute', { agent: h.agent, name: 'bash' }, async () => ({ kind: 'allow' })))
  assert.equal(decisions[0].kind, 'deny')
  assert.equal(decisions[0].reason.includes('bash'), true)
})

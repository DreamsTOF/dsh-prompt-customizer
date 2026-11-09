/**
 * 技能 / MCP 客户端状态的纯函数回归。
 *
 * 覆盖审计里容易回退的几条规则：
 *   - 技能开关三层优先级 workspace > preset > global（工作区 true 能反开全局关）；
 *   - 「清空单独设置」按钮与动作共用同一个 scope；
 *   - 空包 / 失效包不会被筛掉；
 *   - SkillSource → 工作区/全局映射，未知来源原样保留；
 *   - MCP 开关落点（工作区级写 workspace close）、有效启用态、格式能力、工作区工具账本。
 *
 * Usage: node --test test/skills-client-state.test.mjs
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  ALL_PRESETS,
  bundleVisibleInList,
  enabledStateAt,
  isValidPresetId,
  skillOriginOf,
  skillOverridesAt,
} from '../src/client/skills/types.ts'
import {
  detectMcpFormat,
  mcpEditFormatOptions,
  mcpEffectiveEnabled,
  mcpFormatOptions,
  mcpToggleTarget,
  normalizeMcpFormatCapabilities,
  ungroupedWorkspaceTools,
  workspaceDisabledToolsFor,
} from '../src/client/skills/mcp-state.ts'

test('全部 Agent 哨兵为不可能与真实 preset id 冲突的空串', () => {
  assert.equal(ALL_PRESETS, '')
  assert.equal(isValidPresetId(''), false)
  assert.equal(isValidPresetId('standard'), true)
  assert.equal(isValidPresetId('ptc-2'), true)
  assert.equal(isValidPresetId('Standard'), true, '内核 preset id 只要求非空 string')
  assert.equal(isValidPresetId('团队 预设'), true)
  assert.equal(isValidPresetId('   '), false)
})

test('技能开关按 workspace > preset > global 求值', () => {
  const tables = {
    skills: { alpha: false, beta: true, gamma: true },
    overrides: { standard: { alpha: true, beta: false } },
    workspaceOverrides: { 'D:/ws': { beta: true, gamma: false } },
  }

  // 预设层：显式 true 可反开全局关，显式 false 关。
  assert.equal(enabledStateAt({ level: 'preset', presetId: 'standard', cwd: null }, 'alpha', tables), true)
  assert.equal(enabledStateAt({ level: 'preset', presetId: 'standard', cwd: null }, 'beta', tables), false)

  // 工作区层：显式 true 覆盖预设 false，显式 false 覆盖全局 true。
  assert.equal(enabledStateAt({ level: 'workspace', presetId: 'standard', cwd: 'D:/ws' }, 'beta', tables), true)
  assert.equal(enabledStateAt({ level: 'workspace', presetId: 'standard', cwd: 'D:/ws' }, 'gamma', tables), false)
  // 工作区未记的项继续走预设层。
  assert.equal(enabledStateAt({ level: 'workspace', presetId: 'standard', cwd: 'D:/ws' }, 'alpha', tables), true)

  // 拿不到 cwd 时退回预设；全部 Agent 走全局。
  assert.equal(enabledStateAt({ level: 'workspace', presetId: 'standard', cwd: null }, 'beta', tables), false)
  assert.equal(enabledStateAt({ level: 'preset', presetId: ALL_PRESETS, cwd: null }, 'alpha', tables), false)
  assert.equal(enabledStateAt({ level: 'preset', presetId: ALL_PRESETS, cwd: null }, 'beta', tables), true)
})

test('清空按钮读的覆盖表与动作作用域一致', () => {
  const tables = {
    skills: {},
    overrides: { standard: { beta: false } },
    workspaceOverrides: { 'D:/ws': { gamma: false } },
  }
  assert.deepEqual(skillOverridesAt({ level: 'preset', presetId: 'standard', cwd: 'D:/ws' }, tables), { beta: false })
  assert.deepEqual(skillOverridesAt({ level: 'workspace', presetId: 'standard', cwd: 'D:/ws' }, tables), { gamma: false })
  assert.deepEqual(skillOverridesAt({ level: 'workspace', presetId: 'standard', cwd: null }, tables), {})
  assert.deepEqual(skillOverridesAt({ level: 'preset', presetId: ALL_PRESETS, cwd: null }, tables), {})
})

test('空包与失效包不会被列表筛掉', () => {
  const emptyBundle = { skills: [], skillCount: 0 }
  const missingBundle = { skills: [], skillCount: 3, missingSkills: ['gone-a', 'gone-b'] }
  const populated = { skills: [{ name: 'a' }], skillCount: 1 }

  assert.equal(bundleVisibleInList(emptyBundle, false), true)
  assert.equal(bundleVisibleInList(emptyBundle, true), false, '带搜索/状态筛选时新空包可以隐藏')
  assert.equal(bundleVisibleInList(missingBundle, true), true, '失效引用必须保留清理入口')
  assert.equal(bundleVisibleInList(populated, true), true)
})

test('技能来源由宿主字段 / SkillSource 映射，未知来源原样显示', () => {
  assert.deepEqual(skillOriginOf({ name: 'a', root: 'project-agents' }), { kind: 'workspace' })
  assert.deepEqual(skillOriginOf({ name: 'a', root: 'user-agents' }), { kind: 'global' })
  assert.deepEqual(skillOriginOf({ name: 'a', root: 'bundled' }), { kind: 'global' })
  // 显式 origin / scope 优先于 root。
  assert.deepEqual(skillOriginOf({ name: 'a', root: 'user-agents', origin: 'workspace' }), { kind: 'workspace' })
  assert.deepEqual(skillOriginOf({ name: 'a', root: 'project-agents', scope: 'global' }), { kind: 'global' })
  assert.deepEqual(skillOriginOf({ name: 'a', root: 'user-agents', origin: { kind: 'workspace', label: '当前项目' } }), { kind: 'workspace' })
  assert.deepEqual(skillOriginOf({ name: 'a', root: 'user-agents', origin: { label: '第三方来源' } }), { kind: 'unknown', label: '第三方来源' })
  // 未知来源不猜成 global。
  assert.deepEqual(skillOriginOf({ name: 'a', root: 'browser-skill' }), { kind: 'unknown', label: 'browser-skill' })
  assert.equal(skillOriginOf({ name: 'a' }), undefined)
})

test('MCP 主开关落点：工作区级写 workspace close，预设级写 mask / global', () => {
  assert.deepEqual(mcpToggleTarget('workspace', '', 'D:/ws'), { kind: 'workspace', cwd: 'D:/ws' })
  assert.deepEqual(mcpToggleTarget('workspace', 'standard', 'D:/ws'), { kind: 'workspace', cwd: 'D:/ws' })
  assert.equal(mcpToggleTarget('workspace', 'standard', null), null)
  assert.equal(mcpToggleTarget('workspace', 'standard', '  '), null)
  assert.deepEqual(mcpToggleTarget('preset', 'standard', 'D:/ws'), { kind: 'mask', presetId: 'standard' })
  assert.deepEqual(mcpToggleTarget('preset', '', 'D:/ws'), { kind: 'global' })
})

test('MCP 有效启用态：config.disabled → mask → workspaceClosed', () => {
  assert.equal(mcpEffectiveEnabled({}), true)
  assert.equal(mcpEffectiveEnabled({ configDisabled: true }), false)
  assert.equal(mcpEffectiveEnabled({ masked: true }), false)
  assert.equal(mcpEffectiveEnabled({ workspaceClosed: true }), false)
  assert.equal(mcpEffectiveEnabled({ configDisabled: false, masked: false, workspaceClosed: false }), true)
})

test('MCP 编辑格式由服务端 format/capabilities 驱动，文本兜底不按来源猜', () => {
  assert.equal(detectMcpFormat('{"mcpServers":{}}'), 'json')
  assert.equal(detectMcpFormat('mcpServers:\n  a: {}'), 'yaml')
  assert.equal(detectMcpFormat(''), 'json')

  assert.deepEqual(normalizeMcpFormatCapabilities({ formats: ['yaml', 'json', 'yaml'], convert: true }), {
    formats: ['yaml', 'json'],
    convert: true,
  })
  assert.equal(normalizeMcpFormatCapabilities({ formats: [] }), undefined)
  assert.equal(normalizeMcpFormatCapabilities('nope'), undefined)

  assert.deepEqual(mcpFormatOptions({ formats: ['yaml'] }, ['json', 'yaml']), ['yaml'])
  assert.deepEqual(mcpFormatOptions(undefined, ['json']), ['json'])
  assert.deepEqual(mcpEditFormatOptions('global', 'yaml'), ['yaml', 'json'])
  assert.deepEqual(mcpEditFormatOptions('preset', 'json'), ['json'])
  assert.deepEqual(mcpEditFormatOptions(undefined, 'json'), ['json', 'yaml'])
})

test('工作区工具账本按 server 分组，旧扁平结构不解析 mcp__ 前缀', () => {
  const tools = [{ name: 'mcp__srv__ping' }, { name: 'mcp__srv__pong' }]
  const grouped = { byServer: { 'D:/ws': { srv: ['mcp__srv__pong'] } }, flat: { 'D:/ws': ['mcp__srv__ping'] } }
  assert.deepEqual(workspaceDisabledToolsFor(grouped, 'D:/ws', 'srv', tools), ['mcp__srv__pong'], '分组接口优先')

  const flat = { flat: { 'D:/ws': ['mcp__srv__pong', 'mcp__other__x'] } }
  assert.deepEqual(workspaceDisabledToolsFor(flat, 'D:/ws', 'srv', tools), ['mcp__srv__pong'], '旧接口只与本站工具名单求交')
  assert.deepEqual(
    workspaceDisabledToolsFor(flat, 'D:/ws', 'other', [{ name: 'mcp__other__x' }]),
    ['mcp__other__x'],
    '旧接口的归属来自状态接口的 tools 分组，不按 mcp__ 前缀反推',
  )

  const attributed = new Set(['mcp__srv__pong'])
  assert.deepEqual(ungroupedWorkspaceTools(flat, 'D:/ws', attributed), ['mcp__other__x'])
  assert.deepEqual(ungroupedWorkspaceTools(grouped, 'D:/ws', attributed), [], '分组接口没有未归属项')
})

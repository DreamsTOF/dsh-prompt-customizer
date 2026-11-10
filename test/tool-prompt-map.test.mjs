/**
 * 工具提示词段映射的回归：section 名不等于工具名，组段必须显式展开；
 * 空段（subagent_fork）和未知第三方 `tool:<name>` 必须有确定的回退语义。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  promptSectionNamesForTool,
  toolsForPromptSection,
} from '../vendor/prompt-customizer/tool-prompt-map.js'

test('组段映射：jobs / pty / goal / schedule / subagent 覆盖全部工具', () => {
  assert.deepEqual(promptSectionNamesForTool('job_list'), ['tool:jobs', 'tool:job_list'])
  assert.deepEqual(promptSectionNamesForTool('terminal_open'), ['tool:pty', 'tool:terminal_open'])
  assert.deepEqual(promptSectionNamesForTool('update_goal'), ['tool:goal', 'tool:update_goal'])
  assert.deepEqual(promptSectionNamesForTool('schedule_view'), ['tool:schedule', 'tool:schedule_view'])
  assert.deepEqual(promptSectionNamesForTool('subagent_fork'), ['tool:subagent', 'tool:subagent_fork'])
})

test('同一 section 可以服务多个工具，且保留空段 / 精确名回退', () => {
  assert.deepEqual(toolsForPromptSection('tool:jobs'), ['job_kill', 'job_list', 'job_output'])
  assert.deepEqual(toolsForPromptSection('tool:pty'), [
    'terminal_close', 'terminal_list', 'terminal_open', 'terminal_read', 'terminal_send', 'terminal_signal',
  ])
  assert.deepEqual(toolsForPromptSection('tool:subagent'), ['subagent', 'subagent_fork'])
  assert.deepEqual(toolsForPromptSection('tool:subagent_fork'), ['subagent_fork'])
  assert.deepEqual(toolsForPromptSection('tool:unknown_tool'), ['unknown_tool'])
  assert.deepEqual(toolsForPromptSection('harness:identity'), [])
})

test('普通工具按精确 tool:<name> 回退；没有段时返回明确的候选名', () => {
  assert.deepEqual(promptSectionNamesForTool('workflow'), ['tool:workflow'])
  assert.deepEqual(promptSectionNamesForTool('read'), ['tool:read'])
  assert.deepEqual(promptSectionNamesForTool(''), [])
})

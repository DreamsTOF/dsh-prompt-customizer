/**
 * home-paths 与内核 0.2.1-rc.2 解析规则的一致性自检。
 *
 * 覆盖三条真会咬人的规则：空串按未设置、`~` 前缀展开、显式 env 优先。
 * 三处消费点（src/home-paths.ts、src/skill-health.ts、src/skill-toggles.ts
 * 经前者；vendor/skill-manager/skills-host.js 自带一份同规则实现）都必须一致
 * —— 分叉的后果是面板列空、开关写进没人读的目录。
 *
 * Usage: node --test test/home-paths.test.mjs
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const HOME = os.homedir()

/** 在给定 env 下重新求值一个模块（模块读 env 于调用时，故可用 cache-busting 重载）。 */
async function withEnv(env, run) {
  const saved = {}
  for (const key of ['DSH_HOME', 'DSH_AGENTS_HOME']) {
    saved[key] = process.env[key]
    if (env[key] === undefined) delete process.env[key]
    else process.env[key] = env[key]
  }
  try {
    return await run()
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
}

test('home-paths: 空串与纯空白按未设置处理（不落到进程 cwd）', async () => {
  const { agentsHome, dshHome } = await import('../src/home-paths.ts')
  await withEnv({ DSH_AGENTS_HOME: '', DSH_HOME: '   ' }, () => {
    assert.equal(agentsHome(), path.join(HOME, '.agents'))
    assert.equal(dshHome(), path.join(HOME, '.dsh'))
    assert.notEqual(agentsHome(), process.cwd())
    assert.notEqual(dshHome(), process.cwd())
  })
})

test('home-paths: ~ 与 ~/ 前缀展开到用户主目录', async () => {
  const { agentsHome, dshHome } = await import('../src/home-paths.ts')
  await withEnv({ DSH_AGENTS_HOME: '~/shared', DSH_HOME: '~' }, () => {
    assert.equal(agentsHome(), path.join(HOME, 'shared'))
    assert.equal(dshHome(), HOME)
  })
})

test('home-paths: 显式 env 覆盖默认值', async () => {
  const { agentsHome, dshHome } = await import('../src/home-paths.ts')
  const root = path.resolve('/tmp/pc-home-probe')
  await withEnv({ DSH_AGENTS_HOME: root, DSH_HOME: root }, () => {
    assert.equal(agentsHome(), root)
    assert.equal(dshHome(), root)
  })
})

test('skills-host 自带的根解析与 home-paths 完全一致', async () => {
  const mod = await import(pathToFileURL(path.resolve('vendor/skill-manager/skills-host.js')).href)
  const { agentsHome, dshHome } = await import('../src/home-paths.ts')

  for (const env of [
    { DSH_AGENTS_HOME: '', DSH_HOME: '' },
    { DSH_AGENTS_HOME: '~/shared', DSH_HOME: '~' },
    { DSH_AGENTS_HOME: path.resolve('/tmp/pc-a'), DSH_HOME: path.resolve('/tmp/pc-d') },
  ]) {
    await withEnv(env, () => {
      assert.equal(mod.__managedRoot(), path.join(agentsHome(), 'skills'), JSON.stringify(env))
      assert.equal(mod.__dshRoot(), path.join(dshHome(), 'skills'), JSON.stringify(env))
    })
  }
})

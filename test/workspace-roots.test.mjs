/**
 * 工作区级技能根 / MCP 目录扫描的回归测试。
 *
 * 背景（本次修的两个洞）：
 *   1. 面板原先只扫 `~/.agents/skills` 与 `~/.dsh/skills` 两个用户级根，内核
 *      `dsh-skill-filesystem` 还扫工作区级 `<projectRoot>/.dsh/skills` 与
 *      `<projectRoot>/.agents/skills` —— 那些技能内核看得见、面板看不见。
 *   2. 内核没有任何「读某个目录下 mcp.json」的约定（全仓库 grep `mcps` 零命中），
 *      所以 `~/.agents/mcps/**` 与 `<ws>/.dsh|.agents/mcps/**` 一直是死配置。
 *
 * 全程在临时目录里跑，不碰用户真实的 ~/.agents 与 ~/.dsh。
 *
 * Usage: node --test test/workspace-roots.test.mjs
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { EventEmitter } from 'node:events'

const SKILL = (name, desc) => `---\nname: ${name}\ndescription: ${desc}\n---\n\nbody of ${name}\n`

/** 临时沙箱：工作区（带 .git）+ 用户级 home。 */
function sandbox() {
  const root = mkdtempSync(join(tmpdir(), 'dsh-pc-wsroots-'))
  const workspace = join(root, 'ws')
  mkdirSync(join(workspace, '.git'), { recursive: true })
  const agentsHome = join(root, 'agents')
  const dshHome = join(root, 'dsh')
  mkdirSync(join(agentsHome, 'skills'), { recursive: true })
  mkdirSync(join(dshHome, 'skills'), { recursive: true })
  return { root, workspace, agentsHome, dshHome }
}

/** 在给定 env 下跑一段逻辑，结束后还原。 */
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

/** 假 ctx：面板只用到 agents 名单与 profileContext.cwd。 */
const fakeCtx = (cwd) => ({
  get: () => undefined,
  profileContext: { cwd },
})

test('skill-roots: 工作区级两个根排在用户级之前（与内核 rank 同序）', async () => {
  const box = sandbox()
  try {
    mkdirSync(join(box.workspace, '.agents', 'skills', 'ws-agents'), { recursive: true })
    writeFileSync(join(box.workspace, '.agents', 'skills', 'ws-agents', 'SKILL.md'), SKILL('ws-agents', '工作区 .agents'))
    mkdirSync(join(box.workspace, '.dsh', 'skills', 'ws-dsh'), { recursive: true })
    writeFileSync(join(box.workspace, '.dsh', 'skills', 'ws-dsh', 'SKILL.md'), SKILL('ws-dsh', '工作区 .dsh'))
    mkdirSync(join(box.agentsHome, 'skills', 'user-agents'), { recursive: true })
    writeFileSync(join(box.agentsHome, 'skills', 'user-agents', 'SKILL.md'), SKILL('user-agents', '用户级'))
    mkdirSync(join(box.dshHome, 'skills', 'user-dsh'), { recursive: true })
    writeFileSync(join(box.dshHome, 'skills', 'user-dsh', 'SKILL.md'), SKILL('user-dsh', '用户 dsh'))

    await withEnv({ DSH_AGENTS_HOME: box.agentsHome, DSH_HOME: box.dshHome }, async () => {
      const { resolveSkillRoots } = await import('../src/skill-roots.ts')
      const roots = await resolveSkillRoots(fakeCtx(box.workspace))
      const labels = roots.map((root) => root.label)
      assert.deepEqual(labels, ['project-dsh', 'project-agents', 'user-agents', 'user-dsh'])
    })
  } finally {
    rmSync(box.root, { recursive: true, force: true })
  }
})

test('skill-roots: 项目根按最近的 .git 祖先判定（子目录会话不漏根）', async () => {
  const box = sandbox()
  try {
    const nested = join(box.workspace, 'packages', 'inner', 'src')
    mkdirSync(nested, { recursive: true })
    await withEnv({ DSH_AGENTS_HOME: box.agentsHome, DSH_HOME: box.dshHome }, async () => {
      const { findProjectRoot, resolveSkillRoots } = await import('../src/skill-roots.ts')
      assert.equal(await findProjectRoot(nested), resolve(box.workspace))
      mkdirSync(join(box.workspace, '.agents', 'skills', 'x'), { recursive: true })
      writeFileSync(join(box.workspace, '.agents', 'skills', 'x', 'SKILL.md'), SKILL('x', 'x'))
      const roots = await resolveSkillRoots(fakeCtx(nested))
      assert.ok(roots.some((root) => root.path === join(box.workspace, '.agents', 'skills')),
        '嵌套 cwd 也要解析到工作区根')
    })
  } finally {
    rmSync(box.root, { recursive: true, force: true })
  }
})

test('skill-roots: 不存在的根不进列表（面板不出现空根）', async () => {
  const box = sandbox()
  try {
    await withEnv({ DSH_AGENTS_HOME: box.agentsHome, DSH_HOME: box.dshHome }, async () => {
      const { resolveSkillRoots } = await import('../src/skill-roots.ts')
      const roots = await resolveSkillRoots(fakeCtx(box.workspace))
      assert.deepEqual(roots.map((root) => root.label), ['user-agents', 'user-dsh'])
    })
  } finally {
    rmSync(box.root, { recursive: true, force: true })
  }
})

test('skills-host: 注入工作区根后 list 路由扫得到那些技能', async () => {
  const box = sandbox()
  try {
    mkdirSync(join(box.workspace, '.agents', 'skills', 'ws-skill'), { recursive: true })
    writeFileSync(join(box.workspace, '.agents', 'skills', 'ws-skill', 'SKILL.md'), SKILL('ws-skill', '工作区技能'))
    mkdirSync(join(box.agentsHome, 'skills', 'user-skill'), { recursive: true })
    writeFileSync(join(box.agentsHome, 'skills', 'user-skill', 'SKILL.md'), SKILL('user-skill', '用户技能'))

    await withEnv({ DSH_AGENTS_HOME: box.agentsHome, DSH_HOME: box.dshHome }, async () => {
      const mod = await import(pathToFileURL(resolve('vendor/skill-manager/skills-host.js')).href)
      const { resolveSkillRoots } = await import('../src/skill-roots.ts')
      let handler = null
      mod.setExtraRoots(await resolveSkillRoots(fakeCtx(box.workspace)))
      mod.apply({ effect: (fn) => fn(), webServer: { register: (route) => { handler = route.handler; return () => {} } } })
      assert.ok(handler !== null, 'list 路由已注册')

      const list = await new Promise((resolvePromise, reject) => {
        const req = new EventEmitter()
        req.method = 'GET'
        req.url = '/api/skill-manager/list'
        req.headers = { host: 'localhost' }
        req.socket = { remoteAddress: '127.0.0.1' }
        const res = {
          statusCode: 0,
          writeHead(status) { this.statusCode = status },
          end(payload) {
            try { resolvePromise(JSON.parse(payload)) } catch (error) { reject(error) }
          },
        }
        handler(req, res)
        queueMicrotask(() => { req.emit('end') })
      })

      const names = list.loose.map((skill) => skill.name)
      assert.ok(names.includes('ws-skill'), `工作区技能应在列表里（实际：${names.join(', ')}）`)
      assert.ok(names.includes('user-skill'), '用户级技能仍在列表里')
      const wsView = list.loose.find((skill) => skill.name === 'ws-skill')
      assert.equal(wsView?.root, 'project-agents', '工作区技能带出来源标签')
    })
  } finally {
    rmSync(box.root, { recursive: true, force: true })
  }
})

test('mcp-workspace: 全局层与工作区层都被扫描，工作区 serverName 带稳定后缀', async () => {
  const box = sandbox()
  try {
    const globalDir = join(box.agentsHome, 'mcps', 'code')
    mkdirSync(globalDir, { recursive: true })
    writeFileSync(join(globalDir, 'mcp.json'), JSON.stringify({
      mcpServers: { shared: { url: 'https://example.test/mcp', headers: { Authorization: 'Bearer ${PROBE_TOKEN}' } } },
    }))
    const wsDir = join(box.workspace, '.agents', 'mcps', 'tool')
    mkdirSync(wsDir, { recursive: true })
    writeFileSync(join(wsDir, 'mcp.json'), JSON.stringify({
      mcpServers: { local: { command: 'node', args: ['server.mjs'], cwd: '.' } },
    }))

    await withEnv({ DSH_AGENTS_HOME: box.agentsHome, DSH_HOME: box.dshHome }, async () => {
      const { scanAll, scopedServerName } = await import('../src/mcp-workspace.ts')
      const result = await scanAll([box.workspace])
      const names = result.servers.map((server) => server.name).sort()
      assert.deepEqual(names, ['local', 'shared'])
      assert.deepEqual(result.errors, [])

      const shared = result.servers.find((server) => server.name === 'shared')
      assert.equal(shared?.scope, 'global')
      assert.equal(shared?.serverName, 'shared', '全局层保留原名')

      const local = result.servers.find((server) => server.name === 'local')
      assert.equal(local?.scope, 'workspace')
      assert.equal(local?.workspace, box.workspace)
      assert.equal(local?.serverName, scopedServerName(box.workspace, 'local'), '工作区层带路径哈希后缀')
      assert.match(local?.serverName ?? '', /^local-[0-9a-f]{8}$/)
    })
  } finally {
    rmSync(box.root, { recursive: true, force: true })
  }
})

test('mcp-workspace: 损坏的 mcp.json 记进 errors 且不拖垮整轮扫描', async () => {
  const box = sandbox()
  try {
    const wsDir = join(box.workspace, '.dsh', 'mcps')
    mkdirSync(wsDir, { recursive: true })
    writeFileSync(join(wsDir, 'mcp.json'), '{ not json')
    const good = join(box.workspace, '.agents', 'mcps')
    mkdirSync(good, { recursive: true })
    writeFileSync(join(good, 'mcp.json'), JSON.stringify({ mcpServers: { ok: { command: 'node' } } }))

    await withEnv({ DSH_AGENTS_HOME: box.agentsHome, DSH_HOME: box.dshHome }, async () => {
      const { scanAll } = await import('../src/mcp-workspace.ts')
      const result = await scanAll([box.workspace])
      assert.ok(result.errors.length > 0, '坏文件如实上报')
      assert.ok(result.servers.some((server) => server.name === 'ok'), '同目录下的好配置照常扫出')
    })
  } finally {
    rmSync(box.root, { recursive: true, force: true })
  }
})

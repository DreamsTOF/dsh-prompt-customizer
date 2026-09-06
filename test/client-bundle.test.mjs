/**
 * 客户端 bundle 冒烟测试：client/client.js 必须以
 * `window.__ModuleLoader__.load({ id, factory })` 的形态注册，factory(require)
 * 返回的模块面要有 name / inject / apply —— 这是宿主客户端加载插件的契约
 * （与 scripts 侧无直接依赖，纯读产物文件，构建缺失时跳过）。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const bundlePath = path.join(root, 'client', 'client.js')

test('client bundle registers through __ModuleLoader__ and exports apply', () => {
  if (!fs.existsSync(bundlePath)) {
    console.log('client/client.js 不存在（未构建）——跳过 bundle 冒烟测试')
    return
  }
  const code = fs.readFileSync(bundlePath, 'utf8')
  const registrations = []
  const window = {
    __ModuleLoader__: {
      load: (entry) => { registrations.push(entry) },
    },
  }
  // bundle 的 require 只允许应答宿主模块表里的四个外部依赖；其余一律视为
  // 误打包（应内联的依赖不会出现在 require 里）。
  const allowed = new Set(['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client'])
  const require = (name) => {
    assert.ok(allowed.has(name), `bundle require 了模块表之外的名字: ${name}`)
    // 最小 react 形状：ErrorBoundary extends Component 在模块顶层执行，
    // stub 必须给出可继承的类；其余导出用万能函数占位。
    return new Proxy({}, {
      get: (_target, key) => {
        if (key === 'Component' || key === 'PureComponent') return class {}
        if (key === '__esModule') return false
        return function stub() {}
      },
    })
  }
  new Function('window', 'require', code)(window, require)
  assert.equal(registrations.length, 1, '必须且只能注册一个 __ModuleLoader__ 入口')
  assert.equal(registrations[0].id, 'dsh-prompt-customizer')
  const mod = registrations[0].factory(require)
  assert.equal(mod.name, 'prompt-customizer')
  assert.deepEqual(mod.inject, ['locale'])
  assert.equal(typeof mod.apply, 'function')
})

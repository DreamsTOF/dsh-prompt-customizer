/**
 * dsh-prompt-customizer — browser half smoke test.
 *
 * Executes `lib/client.js` under a stubbed DSH client environment and asserts:
 *   1. it registers exactly one `__ModuleLoader__` entry with the right id
 *   2. the factory exports `apply` (function) and `inject` (array)
 *   3. every member the bundle reads off `@deepseek-ai/dsh-client-ui-primitives`
 *      exists in the DSH build installed here — the stub Proxy below cannot see
 *      an upstream rename, and a missing named export is a runtime crash inside
 *      the panel rather than a build error (how the 0.1.7 icon rename slipped
 *      through: 13 renamed icons, zero build/test failures, dead panel)
 *   4. `apply(ctx)` mounts the capability modules (skills panel + prompt locale)
 *      without throwing
 *
 * Usage: node scripts/smoke-client.mjs
 */

import { existsSync, readFileSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const CLIENT = resolve(ROOT, 'client/client.js')

/** The one DSH client module the bundle requires at runtime. */
const PRIMITIVES = '@deepseek-ai/dsh-client-ui-primitives'
/** Bare name + scope, for filesystem joins (`PRIMITIVES` keeps the specifier). */
const PRIMITIVES_NAME = 'dsh-client-ui-primitives'
const SCOPE = '@deepseek-ai'

/**
 * Translate one PATH entry into a Windows-usable absolute prefix.
 *
 * A git-bash/MSYS `PATH` reaches Node in POSIX form (`/c/nvm4w/nodejs`), which
 * `node:path` on win32 would turn into `\c\nvm4w\nodejs` and never find; the
 * `dsh` CLI's own install root is what carries the client packages.
 */
function nativePrefix(entry) {
  const trimmed = entry.trim().replace(/^"|"$/g, '')
  if (process.platform !== 'win32') return trimmed
  const msys = /^\/([A-Za-z])\/(.*)$/.exec(trimmed)
  if (msys !== null) return `${msys[1].toUpperCase()}:/${msys[2]}`
  return trimmed
}

/** Candidate directories that may hold the installed primitives package. */
function primitivesCandidates() {
  const home = process.env.DSH_HOME ?? join(process.env.USERPROFILE ?? process.env.HOME ?? '', '.dsh')
  const candidates = []
  /**
   * One install root: the globally installed `dsh` CLI keeps its DSH packages
   * (client ones included) in its own nested `node_modules`, so probe there
   * first, then the plain hoisted form.
   */
  const pushRoot = (root) => {
    if (root === undefined || root.trim() === '') return
    candidates.push(join(root, 'node_modules', SCOPE, 'dsh', 'node_modules', SCOPE, PRIMITIVES_NAME))
    candidates.push(join(root, 'node_modules', SCOPE, PRIMITIVES_NAME))
  }
  // The running Node's own root carries the globally installed dsh.
  pushRoot(dirname(process.execPath))
  const pathValue = process.env.PATH ?? process.env.Path ?? ''
  for (const entry of pathValue.split(process.platform === 'win32' ? ';' : ':')) pushRoot(nativePrefix(entry))
  // A profile-launched host hoists DSH packages one level above the profile.
  pushRoot(join(home, 'profiles'))
  return candidates
}

/** Locate the installed primitives package, or undefined when absent. */
function findPrimitives() {
  for (const dir of primitivesCandidates()) {
    if (existsSync(join(dir, 'package.json')) && existsSync(join(dir, 'lib', 'index.js'))) return dir
  }
  return undefined
}

/** Exported names of the installed primitives build (`export { ... }` block). */
function exportedNamesOf(dir) {
  const code = readFileSync(join(dir, 'lib', 'index.js'), 'utf8')
  const names = new Set()
  for (const block of code.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const part of block[1].split(',')) {
      const clean = part.trim().split(/\s+as\s+/).pop()?.trim()
      if (clean !== undefined && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(clean)) names.add(clean)
    }
  }
  return names
}

/**
 * Members the built bundle reads off the primitives module, scanned statically.
 *
 * Static rather than runtime on purpose: esbuild emits `(0, import_x.IconFoo)`
 * at each JSX *use site*, so a component that never renders in this stub
 * environment would never touch the property — the icon rename that motivated
 * this check lived exactly there. The bundle is CJS with one `require` binding
 * per source file, so binding name + member accesses cover every read.
 */
function bundlePrimitivesMembers(file) {
  const code = readFileSync(file, 'utf8')
  const members = new Set()
  const spec = PRIMITIVES.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&')
  for (const binding of code.matchAll(new RegExp(`(?:var|const|let)\\s+([A-Za-z0-9_$]+)\\s*=\\s*require\\("${spec}"\\)`, 'g'))) {
    const name = binding[1]
    for (const hit of code.matchAll(new RegExp(`${name}\\.([A-Za-z_$][A-Za-z0-9_$]*)`, 'g'))) members.add(hit[1])
  }
  return members
}

const primitivesDir = findPrimitives()
const primitivesExports = primitivesDir === undefined ? undefined : exportedNamesOf(primitivesDir)
const primitivesMembersRead = bundlePrimitivesMembers(CLIENT)
const primitivesMembersMissing = new Set(
  [...primitivesMembersRead].filter(name => primitivesExports !== undefined && !primitivesExports.has(name)),
)

/** Stand-in for any React component export. */
function stubComponent(name) {
  const Comp = () => ({ __stub: name })
  Object.defineProperty(Comp, 'name', { value: name })
  return Comp
}

/**
 * Minimal DOM node. The nav-row mounting code walks the real sidebar with
 * `compareDocumentPosition`, so the stub has to answer it or the skills module
 * bails out before reaching the interesting code paths.
 */
function stubNode(tag = 'div') {
  const node = {
    tagName: String(tag).toUpperCase(),
    children: [],
    style: {},
    dataset: {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    attrs: {},
    appendChild(child) { node.children.push(child); return child },
    insertBefore(child) { node.children.unshift(child); return child },
    removeChild(child) {
      const i = node.children.indexOf(child)
      if (i >= 0) node.children.splice(i, 1)
      return child
    },
    remove() {},
    setAttribute(k, v) { node.attrs[k] = v },
    getAttribute(k) { return node.attrs[k] ?? null },
    removeAttribute(k) { delete node.attrs[k] },
    addEventListener() {},
    removeEventListener() {},
    querySelector: () => null,
    querySelectorAll: () => [],
    getBoundingClientRect: () => ({ x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }),
    contains: () => false,
    compareDocumentPosition: () => 0,
    getRootNode: () => sandbox.document,
    focus: () => {},
    click: () => {},
  }
  return node
}

/** Explicit React overrides. Kept separate so the Proxy below can consult it
 *  first — a bare `get` trap would otherwise shadow every one of these. */
const REACT_OVERRIDES = {
      createElement: (type, props, ...children) => ({ type, props, children }),
      cloneElement: (el) => el,
      isValidElement: () => false,
      Children: { map: () => [], forEach: () => {}, count: () => 0, toArray: () => [] },
      Fragment: Symbol('Fragment'),
      // Real class, not a stub function: `class X extends Component` is a
      // module-top-level evaluation (error boundaries), and extending the
      // generic stub function throws "is not a constructor".
      Component: class Component {
        constructor(props) {
          this.props = props
          this.state = null
        }

        setState() {}

        forceUpdate() {}

        render() {
          return null
        }
      },
      StrictMode: stubComponent('StrictMode'),
      Suspense: stubComponent('Suspense'),
      memo: (comp) => comp,
      forwardRef: (render) => render,
      lazy: () => stubComponent('Lazy'),
      startTransition: (fn) => fn?.(),
      createRef: () => ({ current: null }),
      createContext: () => ({ Provider: stubComponent('Provider'), Consumer: stubComponent('Consumer') }),
      useState: (init) => [typeof init === 'function' ? init() : init, () => {}],
      useReducer: (reducer, init) => [init, () => {}],
      useEffect: () => {},
      useLayoutEffect: () => {},
      useInsertionEffect: () => {},
      useMemo: (fn) => fn(),
      useCallback: (fn) => fn,
      useRef: (init) => ({ current: init }),
      useImperativeHandle: () => {},
      useContext: () => ({}),
      useId: () => 'stub-id',
      useDebugValue: () => {},
      useSyncExternalStore: (_sub, get) => get(),
      useTransition: () => [false, (fn) => fn?.()],
      useDeferredValue: (v) => v,
}

/** Everything the bundle may ask the platform for. */
const MODULES = {
  'react': new Proxy(REACT_OVERRIDES, {
    // Known export → the real override; anything else (icon sets, future
    // hooks) falls back to a stub component.
    get: (target, prop) => {
      if (typeof prop !== 'string') return undefined
      if (Object.hasOwn(target, prop)) return target[prop]
      return stubComponent(prop)
    },
    has: () => true,
  }),
  'react/jsx-runtime': {
    jsx: (type, props) => ({ type, props }),
    jsxs: (type, props) => ({ type, props }),
    Fragment: Symbol('Fragment'),
  },
  'react-dom': { createPortal: (node) => node },
  'react-dom/client': { createRoot: () => ({ render: () => {}, unmount: () => {} }) },
  // A stub component for any member: the export check above compares the
  // bundle's static reads with the installed build, so a rename is reported
  // there rather than turning into a confusing throw inside apply().
  '@deepseek-ai/dsh-client-ui-primitives': new Proxy({}, {
    get: (_t, prop) => (typeof prop === 'string' ? stubComponent(prop) : undefined),
    has: () => true,
  }),
}

// ── capture the loader registration ──────────────────────────────────────
const registrations = []
const sandbox = {
  __ModuleLoader__: { load: (entry) => { registrations.push(entry) } },
  document: {
    head: stubNode('head'),
    body: stubNode('body'),
    documentElement: stubNode('html'),
    createElement: (tag) => stubNode(tag),
    createTextNode: (text) => ({ nodeType: 3, textContent: text }),
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: () => null,
    getElementsByTagName: () => [],
    addEventListener: () => {},
    removeEventListener: () => {},
  },
  console,
  // Timers are recorded but never scheduled: the nav-mount poller would
  // otherwise keep the event loop alive and hang the smoke run.
  setTimeout: (() => { let id = 0; return (fn, ms) => { void fn; void ms; return ++id } })(),
  clearTimeout: () => {},
  setInterval: (() => { let id = 0; return (fn, ms) => { void fn; void ms; return ++id } })(),
  clearInterval: () => {},
  queueMicrotask: (fn) => fn(),
  fetch: async () => ({ ok: false, status: 599, json: async () => ({}) }),
  AbortController,
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
  requestAnimationFrame: (fn) => setTimeout(() => fn(Date.now()), 0),
  cancelAnimationFrame: (id) => clearTimeout(id),
  getComputedStyle: () => ({ getPropertyValue: () => '' }),
  MutationObserver: class { observe() {} disconnect() {} },
  ResizeObserver: class { observe() {} unobserve() {} disconnect() {} },
  CSS: { supports: () => false },
}
// Browsers alias `window` to the global object; the bundle uses `window.setInterval`.
sandbox.window = sandbox
sandbox.globalThis = sandbox
sandbox.self = sandbox
sandbox.top = sandbox
sandbox.parent = sandbox
sandbox.location = { href: 'http://127.0.0.1:0/', origin: 'http://127.0.0.1:0', protocol: 'http:', host: '127.0.0.1:0' }
sandbox.navigator = { userAgent: 'dsh-prompt-customizer-smoke', language: 'zh-CN', maxTouchPoints: 0 }
sandbox.innerWidth = 1440
sandbox.innerHeight = 900
sandbox.devicePixelRatio = 1
sandbox.addEventListener = () => {}
sandbox.removeEventListener = () => {}
sandbox.dispatchEvent = () => true
sandbox.getComputedStyle = () => ({ getPropertyValue: () => '' })
sandbox.scrollTo = () => {}

const context = vm.createContext(sandbox)
const code = readFileSync(CLIENT, 'utf8')
new vm.Script(code, { filename: CLIENT }).runInContext(context)

// ── assertions ───────────────────────────────────────────────────────────
const fail = (msg) => { console.error(`FAIL  ${msg}`); process.exitCode = 1 }
const pass = (msg) => console.log(`ok    ${msg}`)

if (registrations.length !== 1) fail(`expected 1 loader registration, got ${registrations.length}`)
else pass('registered exactly one __ModuleLoader__ entry')

const entry = registrations[0]
if (entry?.id !== 'dsh-prompt-customizer') fail(`expected id "dsh-prompt-customizer", got ${JSON.stringify(entry?.id)}`)
else pass('loader id is "dsh-prompt-customizer"')

const require = (id) => {
  if (id in MODULES) return MODULES[id]
  throw new Error(`[smoke] unexpected require(${id}) — add it to the stub table`)
}

const mod = entry.factory(require)
if (typeof mod.apply !== 'function') fail('factory did not export apply()')
else pass('factory exports apply()')
if (!Array.isArray(mod.inject)) fail('factory did not export inject[]')
else pass(`factory exports inject[] = [${mod.inject.join(', ')}]`)

// 三个已移除的模块不得再出现在客户端入口上。
for (const gone of ['buildActivityGrid', 'activityColor', 'ACTIVITY_COLUMNS']) {
  if (gone in mod) fail(`removed module still exports ${gone}`)
}

// ── run apply() against a stub client context ────────────────────────────
const registered = []
const slots = []
const namespaces = []
const ctx = {
  effect: (fn) => { registered.push(typeof fn === 'function' ? fn() : undefined); return () => {} },
  locale: {
    register: (ns) => { namespaces.push(ns); return () => {} },
    bind: () => (key) => String(key),
  },
  slots: {
    register: (spec, comp) => {
      if (comp === undefined) throw new Error('slots.register called without component')
      slots.push(spec.key === undefined ? spec.name : `${spec.name}#${spec.key}`)
      return () => {}
    },
    inject: (name, factory) => { factory?.(); return () => {} },
  },
  get: (name) => (name === 'sessions' ? { list: { getSnapshot: () => ({ byId: {} }) } } : undefined),
}

try {
  mod.apply(ctx)
  pass('apply(ctx) mounted the capability modules without throwing')
} catch (error) {
  fail(`apply(ctx) threw: ${error?.stack ?? error}`)
}

// 内核（@deepseek-ai/dsh-client-ui-skill）owns the `skill` locale namespace, the
// `tool.call.toolview` row keyed `skill`, and the `/` slash source. All three
// registries throw on a duplicate name/key, and the second registrant is the one
// that throws — so a duplicate here kills the KERNEL's apply and takes the whole
// client plugin chain down (hit for real in 0.6.0). Assert we register none of them.
if (slots.includes('tool.call.toolview#skill')) fail('registered the kernel-owned skill tool row (tool.call.toolview#skill)')
else pass('no duplicate skill tool row (kernel owns tool.call.toolview#skill)')
if (namespaces.includes('skill')) fail('registered the kernel-owned locale namespace "skill"')
else pass('no duplicate "skill" locale namespace (kernel owns it)')
if (namespaces.includes('prompt-customizer')) pass('prompt locale namespace registered ("prompt-customizer")')
else fail('prompt locale namespace "prompt-customizer" was not registered')

// ── the platform surface the bundle actually reads must exist in this DSH ──
if (primitivesExports === undefined) {
  console.log('skip  installed DSH client packages not found — export check skipped')
} else {
  pass(`primitives export check ran against ${primitivesDir} (${primitivesExports.size} exports)`)
  if (primitivesMembersRead.size === 0) fail('bundle read no primitives exports — the platform stub was bypassed')
  else pass(`bundle reads ${primitivesMembersRead.size} primitives members`)
  if (primitivesMembersMissing.size > 0) {
    fail(`primitives members missing from this DSH build: ${[...primitivesMembersMissing].sort().join(', ')}`)
  } else {
    pass('every primitives member the bundle reads exists in this DSH build')
  }
}

console.log(`\n${process.exitCode ? 'SMOKE FAILED' : 'SMOKE PASSED'} — ${CLIENT}`)
// Explicit exit: stubbed modules may hold listeners/timers that keep node alive.
process.exit(process.exitCode ?? 0)

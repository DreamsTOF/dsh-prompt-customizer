/**
 * Browser client bundle for dsh-prompt-customizer, mirroring the DeepSeek
 * Harness client preset (packages/client/tsdown.client.ts) for an external
 * package: a closure-factory artifact that calls
 * window.__ModuleLoader__.load({ id, factory }) and resolves externals
 * through the injected require (loader module table).
 */
import { defineConfig } from 'tsdown'

const id = 'dsh-prompt-customizer'

/** Externals resolved from the loader module table at runtime. */
const CLIENT_EXTERNALS = ['react', 'react/jsx-runtime', 'react-dom']

export default defineConfig({
  entry: { client: 'src/client/index.ts' },
  // The published artifact location: package.json exports "./client" points
  // at client/client.js, so the bundle lands there directly.
  outDir: 'client',
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  dts: false,
  sourcemap: true,
  clean: false,
  external: [...CLIENT_EXTERNALS],
  // Anything NOT in the loader module table must inline instead — a require()
  // the table cannot answer is a guaranteed runtime throw.
  noExternal: (source: string) => (CLIENT_EXTERNALS.includes(source) ? undefined : true),
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'import.meta.env.MODE': JSON.stringify('production'),
    'import.meta.env': JSON.stringify({ MODE: 'production' }),
  },
  outputOptions: {
    entryFileNames: 'client.js',
    banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(id)}, factory: (require) => {`,
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
  },
})

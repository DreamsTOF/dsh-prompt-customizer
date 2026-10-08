/** Run the exact installed dsh through a temporary headless profile and overlay. */
import { createRequire } from 'node:module'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'
import yaml from 'js-yaml'
const manifest = process.env.PC_DSH_MANIFEST
if (!manifest) {
  console.log('SKIP rc.2 runtime: set PC_DSH_MANIFEST to the exact installed dsh package.json')
  process.exit(0)
}
const require = createRequire(manifest)
if (require(manifest).version !== '0.2.0-rc.2') throw new Error('This smoke targets exactly 0.2.0-rc.2')
const root = mkdtempSync(join(tmpdir(), 'pc-real-rc2-'))
try {
  const env = { ...process.env, DSH_HOME: root, PC_DSH_MANIFEST: manifest, PC_DATA_DIR: join(root, 'prompt-data'), PC_COMPOSITION_URL: pathToFileURL(resolve('scripts/fixtures/rc2.cordis.yml')).href, DSH_TELEMETRY_MODE: 'OFF' }
  const composition = yaml.load(require('node:fs').readFileSync(resolve('scripts/fixtures/rc2.cordis.yml'), 'utf8'))
  composition.unshift({ id: 'config-editor', name: '@deepseek-ai/dsh-config-editor' }, { id: 'settings', name: '@deepseek-ai/dsh-settings' })
  composition.push({ id: 'prompt-customizer-artifact', name: pathToFileURL(resolve('lib/index.js')).href })
  for (const entry of composition) entry.name = entry.name.startsWith('file:') ? entry.name : entry.name.startsWith('.')
    ? pathToFileURL(resolve('scripts/fixtures', entry.name)).href
    : pathToFileURL(require.resolve(entry.name)).href
  const compositionFile = join(root, 'cordis.yml')
  writeFileSync(compositionFile, yaml.dump(composition))
  env.PC_COMPOSITION_URL = pathToFileURL(compositionFile).href
  const bin = join(resolve(manifest, '..'), 'lib/bin.js')
  const dump = spawnSync(process.execPath, [bin, 'headless', '--dump-default-config'], { env, encoding: 'utf8' })
  if (dump.status !== 0) throw new Error(dump.stderr)
  const overlay = join(root, 'probe.overlay.yml')
  const dumpSchema = yaml.DEFAULT_SCHEMA.extend([new yaml.Type('tag:yaml.org,2002:js', { kind: 'scalar', construct: value => value })])
  const patches = yaml.load(dump.stdout, { schema: dumpSchema }).map(entry => ({ id: entry.id, disabled: true }))
  patches.push({ insert: [{ id: 'pc-rc2-test-composition', name: 'cordis:include', config: { path: env.PC_COMPOSITION_URL } }] })
  writeFileSync(overlay, yaml.dump(patches))
  const run = spawnSync(process.execPath, [bin, 'headless', '--patch', overlay], { env, encoding: 'utf8', timeout: 45000 })
  process.stdout.write(run.stdout ?? '')
  process.stderr.write(run.stderr ?? '')
  if (run.status !== 0 || !run.stdout.includes('PC_RC2_SMOKE')) throw new Error(`rc.2 runtime smoke failed: ${run.status} ${run.error ?? ''}`)
} finally {
  rmSync(root, { recursive: true, force: true })
}

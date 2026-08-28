/** 临时探针：对比各预设三阶段预览与清单（排查工具 Tab 与实际预设不一致）。 */
const BASE = 'http://localhost:3080/api/prompt-customizer'

const get = async (path) => {
  const r = await fetch(BASE + path)
  return r.json()
}

const sig = (p) => JSON.stringify({
  s: (p?.sections ?? []).map((x) => x.name),
  t: (p?.tools ?? []).map((x) => (typeof x === 'string' ? x : x.name)).sort(),
})

const main = async () => {
  const list = (await get('/agent-presets')).presets ?? []
  console.log('presets:', list.map((p) => `${p.id}${p.broken ? '(broken)' : ''}`).join(', '))
  for (const p of list) {
    if (p.broken) { console.log(`\n### ${p.id}: BROKEN`); continue }
    const q = `?scope=${encodeURIComponent(p.id)}`
    const inv = await get('/inventory' + q)
    const boot = await get('/preview' + q + '&phase=bootstrap')
    const comp = await get('/preview' + q + '&phase=compaction')
    const act = await get('/preview' + q + '&phase=active')
    const names = (x) => (x?.tools ?? []).map((t) => (typeof t === 'string' ? t : t.name))
    console.log(`\n### ${p.id}`)
    console.log('  scopeResolved:', inv.scopeResolved, 'degraded:', [boot, comp, act].map((x) => x.degraded).join('/'))
    console.log('  inventory tools:', (inv.tools ?? []).length, '->', (inv.tools ?? []).map((t) => t.name).join(','))
    console.log('  sections(boot):', (boot.sections ?? []).map((s) => s.name).join(','))
    console.log('  sections(act) :', (act.sections ?? []).map((s) => s.name).join(','))
    console.log('  tools(boot):', names(boot).join(','))
    console.log('  tools(comp):', names(comp).join(','))
    console.log('  tools(act) :', names(act).join(','))
    console.log('  distinct:', new Set([sig(boot), sig(comp), sig(act)]).size)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })

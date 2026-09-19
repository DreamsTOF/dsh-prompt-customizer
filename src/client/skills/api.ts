/**
 * skills/api — /api/skill-manager 与 /api/skill-toggles 的类型化请求封装。
 */
import type {
  HealthReport, HealthView, InstallInput, PresetStatus, SkillSnapshot, ToggleStatus,
} from './types.js'
/** ---------------------------------------------------------------- API */

export const SKILL_API_BASE = '/api/skill-manager'

export async function skillRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(SKILL_API_BASE + path, options)
  const body = (await response.json().catch(() => ({}))) as T & { error?: string }
  if (!response.ok) throw new Error(body.error || 'request failed (' + String(response.status) + ')')
  return body
}

export const skillApi = {
  list: (): Promise<SkillSnapshot> => skillRequest<SkillSnapshot>('/list', { headers: { accept: 'application/json' } }),
  toggleStatus: (): Promise<ToggleStatus> =>
    fetch('/api/skill-toggles/status', { headers: { accept: 'application/json' } })
      .then((response) => response.json() as Promise<ToggleStatus & { error?: string }>)
      .then((body) => {
        if (typeof body !== 'object' || body === null || body.skills === undefined) {
          throw new Error('toggle status unavailable')
        }
        return body as ToggleStatus
      }),
  setSkillEnabled: (name: string, enabled: boolean): Promise<{ ok: boolean }> =>
    fetch(`/api/skill-toggles/skills/${encodeURIComponent(name)}`, {
      method: 'PUT',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({ enabled }),
    }).then((response) => response.json() as Promise<{ ok: boolean; error?: string }>)
      .then((body) => {
        if (!body.ok) throw new Error(body.error || 'toggle failed')
        return body
      }),
  setBundleEnabled: (bundleId: string, enabled: boolean): Promise<{ ok: boolean; handled?: number }> =>
    fetch(`/api/skill-toggles/bundles/${encodeURIComponent(bundleId)}`, {
      method: 'PUT',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({ enabled }),
    }).then((response) => response.json() as Promise<{ ok: boolean; error?: string; handled?: number }>)
      .then((body) => {
        if (!body.ok) throw new Error(body.error || 'toggle failed')
        return body
      }),
  /** 预设名单 + 各预设覆盖 + 全局层状态(一次拉齐)。 */
  presetStatus: (): Promise<PresetStatus> =>
    fetch('/api/skill-toggles/presets', { headers: { accept: 'application/json' } })
      .then((response) => response.json() as Promise<PresetStatus & { error?: string }>)
      .then((body) => {
        if (typeof body !== 'object' || body === null || !Array.isArray(body.presets)) {
          throw new Error('preset status unavailable')
        }
        return body as PresetStatus
      }),
  setPresetSkillEnabled: (presetId: string, name: string, enabled: boolean): Promise<{ ok: boolean }> =>
    fetch(`/api/skill-toggles/presets/${encodeURIComponent(presetId)}/skills/${encodeURIComponent(name)}`, {
      method: 'PUT',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({ enabled }),
    }).then((response) => response.json() as Promise<{ ok: boolean; error?: string }>)
      .then((body) => {
        if (!body.ok) throw new Error(body.error || 'toggle failed')
        return body
      }),
  setPresetBundleEnabled: (presetId: string, bundleId: string, enabled: boolean): Promise<{ ok: boolean }> =>
    fetch(`/api/skill-toggles/presets/${encodeURIComponent(presetId)}/bundles/${encodeURIComponent(bundleId)}`, {
      method: 'PUT',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({ enabled }),
    }).then((response) => response.json() as Promise<{ ok: boolean; error?: string }>)
      .then((body) => {
        if (!body.ok) throw new Error(body.error || 'toggle failed')
        return body
      }),
  resetPreset: (presetId: string): Promise<{ ok: boolean }> =>
    fetch(`/api/skill-toggles/presets/${encodeURIComponent(presetId)}/reset`, {
      method: 'POST',
      headers: { accept: 'application/json' },
    }).then((response) => response.json() as Promise<{ ok: boolean; error?: string }>)
      .then((body) => {
        if (!body.ok) throw new Error(body.error || 'reset failed')
        return body
      }),
  createBundle: (name: string, categories: string[] = []): Promise<Record<string, never>> =>
    skillRequest('/bundles', { method: 'POST', headers: { accept: 'application/json', 'content-type': 'application/json' }, body: JSON.stringify({ name, categories }) }),
  renameBundle: (bundleId: string, name: string): Promise<Record<string, never>> =>
    skillRequest(`/bundles/${encodeURIComponent(bundleId)}`, { method: 'PATCH', headers: { accept: 'application/json', 'content-type': 'application/json' }, body: JSON.stringify({ name }) }),
  /** 只改分类的 PATCH：host 侧 name 缺省即保持原值，不必回传包名。 */
  setBundleCategories: (bundleId: string, categories: string[]): Promise<Record<string, never>> =>
    skillRequest(`/bundles/${encodeURIComponent(bundleId)}`, { method: 'PATCH', headers: { accept: 'application/json', 'content-type': 'application/json' }, body: JSON.stringify({ categories }) }),
  deleteBundle: (bundleId: string): Promise<Record<string, never>> =>
    skillRequest(`/bundles/${encodeURIComponent(bundleId)}`, { method: 'DELETE', headers: { accept: 'application/json' } }),
  setBundleSkills: (bundleId: string, skillNames: string[]): Promise<Record<string, never>> =>
    skillRequest(`/bundles/${encodeURIComponent(bundleId)}/skills`, { method: 'PUT', headers: { accept: 'application/json', 'content-type': 'application/json' }, body: JSON.stringify({ skillNames }) }),
  deleteSkill: (name: string): Promise<Record<string, never>> =>
    skillRequest(`/skills/${encodeURIComponent(name)}`, { method: 'DELETE', headers: { accept: 'application/json' } }),
  installSkill: (input: InstallInput): Promise<{ name?: string; dir?: string; renamed?: boolean }> =>
    skillRequest('/skills', { method: 'POST', headers: { accept: 'application/json', 'content-type': 'application/json' }, body: JSON.stringify(input) }),
  /** 技能目录健康检查：只读扫描（缺 SKILL.md / frontmatter 无效 / 名称不一致 / 账本悬挂引用）。 */
  health: (): Promise<HealthReport> =>
    fetch('/api/skill-health', { headers: { accept: 'application/json' } })
      .then((response) => response.json() as Promise<HealthReport & { error?: string }>)
      .then((body) => {
        if (typeof body !== 'object' || body === null || !Array.isArray(body.issues)) {
          throw new Error('health unavailable')
        }
        return body as HealthReport
      }),
}

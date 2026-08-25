/** Shared types for the prompt-customizer client panel. */

/** The settings scope used to read/write the namespace config. */
export interface SettingsScope {
  getSnapshot(): { status: string; value?: unknown; revision: number; writable: boolean }
  subscribe(callback: () => void): () => void
  set(field: string, value: unknown): void
  unset(field: string): void
}

/** Inventory payload from the host route. */
export interface Inventory {
  sections: Array<{ name: string; order: number; text?: string; active: boolean; replaced: boolean }>
  tools: Array<{ name: string; description?: string; hidden: boolean }>
}

/** Final-assembly preview payload from the host route. */
export interface Preview {
  ok: boolean
  scope?: unknown
  sections: Array<{ name: string; text: string }>
  text: string
  tools: Array<{ name: string; description: string } | string>
}

/** The resolved config object (namespace value). */
export interface Config {
  sections?: string[]
  replace?: Record<string, string>
  inject?: Array<{ name: string; order: number; text: string; custom?: boolean }>
  tools?: { exclude?: string[]; include?: string[] }
  /** Per-agent overlays: byAgent.<agentId> overrides the default fields for that agent. */
  byAgent?: Record<string, AgentOverlay>
  presets?: Preset[]
  activePreset?: string
}

/** The per-agent overlay subset of Config (everything except byAgent/presets). */
export interface AgentOverlay {
  sections?: string[]
  replace?: Record<string, string>
  inject?: Array<{ name: string; order: number; text: string; custom?: boolean }>
  tools?: { exclude?: string[]; include?: string[] }
}

/** Agent-preset info returned by /api/prompt-customizer/agents. */
export interface AgentInfo {
  id: string
  name: string
  description: string
  order: number
}

export interface AgentsPayload {
  ok: boolean
  agents: AgentInfo[]
  defaultAgent?: string
  error?: string
}

/** A complete customization snapshot that can be saved / applied / exported. */
export interface Preset {
  id: string
  name: string
  data: PresetData
}

/** The customization fields a preset captures (full snapshot). */
export interface PresetData {
  sections?: string[]
  replace?: Record<string, string>
  /** Relative order: each section records the section it should follow. */
  order?: Array<{ name: string; after?: string; text: string; custom?: boolean }>
  tools?: { exclude?: string[]; include?: string[] }
}

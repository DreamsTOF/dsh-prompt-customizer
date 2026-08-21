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

/** The resolved config object (namespace value). */
export interface Config {
  sections?: string[]
  replace?: Record<string, string>
  inject?: Array<{ name: string; order: number; text: string }>
  tools?: { exclude?: string[]; include?: string[] }
  presets?: Preset[]
  activePreset?: string
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
  order?: Array<{ name: string; after?: string; text: string }>
  tools?: { exclude?: string[]; include?: string[] }
}

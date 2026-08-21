# dsh-prompt-customizer

A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (dsh) plugin that lets you control the **system prompt** and the **tool catalog** from a settings-panel UI.

Plugin-injected prompt sections (from other plugins) can pollute your system prompt. This plugin lets you **block**, **replace**, **inject**, and **reorder** prompt sections by name, and **hide tools** from the model catalog — all live, without touching the other plugins.

## Features

- **Prompt sections**
  - **Block** a section by name (removed from the assembled system prompt).
  - **Replace** a section's text (the original text is echoed for editing).
  - **Inject** brand-new sections.
  - **Reorder** sections with ↑/↓ arrows or **drag & drop** (HTML5). Order is stored as a virtual 0-based index, so there are never duplicate or fractional orders.
- **Tools**
  - **Blacklist** (`exclude`): hide the listed tools.
  - **Whitelist** (`include`): keep only the listed tools (wins over exclude).
  - Only the model-facing catalog is affected — tools and routes keep working.
- **Presets**
  - **Save** the current customization as a preset (full snapshot).
  - **Apply** a preset: same-name sections are overridden, preset-only sections are added, and current sections outside the preset list are disabled by default.
  - **Export / Import** presets as JSON (full snapshot).
  - Presets store **relative order** (each section records the section it follows), so they stay portable across prompts with different section sets.
  - Multiple presets can be stored locally; only one is active at a time.

## Installation

Install from npm:

```bash
dsh plugin add dsh-prompt-customizer
```

Or install from a local checkout:

```bash
dsh plugin add /path/to/dsh-prompt-customizer
```

After installation, open the dsh web UI → **Settings** → **提示词定制** (Prompt Customizer) in the sidebar.

## Usage

### Prompt sections tab

Each row shows a prompt section with:

- A **checkbox** to block/unblock it.
- A **replace** button to edit its text (the original text is pre-filled).
- **↑/↓ arrows** and a **drag handle** to reorder it.
- The `#N` badge shows the section's virtual order (0-based position).

The **注入新段** (Inject section) box at the bottom adds a brand-new section by name, order, and text.

### Tools tab

Toggle tools to hide them (blacklist), or switch to whitelist mode to keep only the checked tools.

### Presets tab

- **Save current as preset** — capture the current sections/tools customization.
- **Apply** — activate a preset (overrides same-name sections, adds preset-only sections, disables current sections outside the preset).
- **Export** — download the preset as JSON.
- **Import** — load a preset JSON file (same-name presets are skipped).

## Configuration

The plugin stores its config in the dsh settings document under the `prompt-customizer` namespace (`~/.dsh/settings.yaml`). You can edit it directly:

```yaml
prompt-customizer:
  # Block these prompt sections by name.
  sections:
    - plugin:some-plugin
  # Replace a section's text by name (original order kept).
  replace:
    system: 'You are a helpful coding assistant.'
  # Inject / override sections (name + order + text).
  inject:
    - name: tool:read
      order: 0
      text: ''
  # Tool catalog filtering.
  tools:
    exclude: []
    include: []
```

| Field | Type | Description |
| --- | --- | --- |
| `sections` | `string[]` | Prompt section names to block. |
| `replace` | `Record<string, string>` | Replacement text per section name. |
| `inject` | `{name, order, text}[]` | Sections to inject or override (order controls splice position). |
| `tools.exclude` | `string[]` | Tool names to hide. |
| `tools.include` | `string[]` | When non-empty, keep only these tools (wins over `exclude`). |

## Development

```bash
npm install
npm run check   # typecheck + build
```

The browser half is built with [tsdown](https://github.com/rolldown/tsdown) into `client/client.js` (a `__ModuleLoader__` factory bundle). The host half lives in `lib/`.

## License

MIT

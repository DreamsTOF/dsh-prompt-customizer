<p align="center">
  <img src="assets/logo.svg" alt="dsh-prompt-customizer" width="180">
</p>

<h1 align="center">dsh-prompt-customizer</h1>

<p align="center">
  <strong>The DeepSeek Harness capability desk: prompt customization + skill collection management + MCP server integration.<br>
  Manage prompt sections, import and toggle skills, and connect MCP servers from the sidebar "Capabilities" panel.</strong>
</p>

<p align="center">
  <strong>English</strong> ·
  <a href="README.md">简体中文</a>
</p>

<p align="center">
  <a href="https://github.com/DreamsTOF/dsh-prompt-customizer/releases"><img src="https://img.shields.io/npm/v/dsh-prompt-customizer" alt="npm version"></a>
  <a href="https://github.com/DreamsTOF/dsh-prompt-customizer/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green.svg" alt="MIT License"></a>
  <a href="https://github.com/deepseek-ai/deepseek-harness"><img src="https://img.shields.io/badge/DeepSeek_Harness-Plugin-blueviolet.svg" alt="DeepSeek Harness Plugin"></a>
  <a href="https://github.com/DreamsTOF/dsh-prompt-customizer/stargazers"><img src="https://img.shields.io/github/stars/DreamsTOF/dsh-prompt-customizer?style=social" alt="GitHub Stars"></a>
</p>

<p align="center">
  <img src="assets/banner.svg" alt="system prompt → block · replace · inject · sort" width="900">
</p>

---

## What it is

A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (dsh) plugin. It adds an independent "Capabilities" panel to the sidebar that brings three otherwise configuration-heavy jobs into one visual surface:

- **Prompt customization**: block, replace, inject and reorder system-prompt sections by name + source — across every scope, including session-level sections that plugins register dynamically on the active agent's own scope (universal takeover, ADR-0005);
- **Skill collection management**: import, group and toggle skills;
- **MCP server integration**: add MCP servers and apply preset-level or tool-level masking.

All changes go through documented plugin extension points. No DSH source is modified, and prompt/tool changes take effect for the model as soon as they are saved.

## Features

- **Prompt sections**: block / replace / inject / drag-reorder prompt sections, with a live preview of the final system prompt the model receives. The editable inventory and preview merge the selected preset with the same-preset active agent's real assembly, so plugin-injected session-level sections are enumerated and controllable. The host also exposes a read-only `/api/prompt-customizer/session` route reporting the latest active root session's own real assembly (there is no separate "Current session" panel tab).
- **Phase and preset layering**: bootstrap, resident and compaction-controlled phases each have their own section lists, ordering space and tool catalog; the top preset selector scopes edits to one agent preset.
- **Single-preset editing (2.0.0)**: prompt/tool customization is stored and applied only per **agent preset**. The workspace-level prompt/tool layer has been removed (source archived, data dormant, neither read nor backed up). Workspaces still apply to MCP / skills / cwd.
- **Tool catalog**: hide or add back tools per phase, with a "model-visible / registry total" comparison that also handles PTC / Code Mode `run_code` wrapping.
- **Tool prompt sections**: the Tools view links each `tool:*` prompt section to its tool group (for example `tool:jobs` covers `job_kill/job_list/job_output`), while the Prompt view can block / replace / reorder those sections independently. Tool descriptions stay read-only and JSON Schema is not part of prompt editing.
- **Skill management**: skill bundles, ZIP / folder import, global and preset toggles, skill-root and membership health checks.
- **MCP management**: paste JSON / YAML to connect, preset-owned server rows, global / preset masking, per-tool enable/disable, and recommended templates; global servers persist in `$DSH_HOME/mcps/<serverName>/mcp.json` and are re-mounted into memory on startup.
- **Prompt variables**: built-in date / host / environment facts plus `process.env` mapping with a secret blocklist.

## UI

Open **Capabilities** in the sidebar. The panel has three tabs: **SKILL**, **MCP** and **Prompts**.

![Prompt mode: checkbox list on the left, live preview on the right](docs/images/prompt.png)

![Tool mode: phase catalog checkboxes and model-visible tool preview](docs/images/tool.png)

## Installation

Web profile:

```bash
dsh plugin --profile web add dsh-prompt-customizer
```

Desktop (DeepSeek Harness Desktop):

```bash
dsh plugin --profile desktop add dsh-prompt-customizer
```

Or install from a local checkout:

```bash
dsh plugin --profile web add /path/to/dsh-prompt-customizer
```

Current release **2.1.3** (**global MCP disk persistence fix** — adding / toggling / removing / editing a global server now persists to `$DSH_HOME/mcps/<serverName>/mcp.json` and is re-mounted into memory on startup instead of landing in the profile-root `cordis.yml`, which DSH rewrites at every launch, or in the plugin SQLite virtual ledger; preset scope still writes the profile patch and workspace scope still writes the project `.mcp.json`; single-preset editing; **universal system-prompt takeover** — the inventory and preview merge the selected preset with the same-preset active agent's real assembly so plugin-injected session-level sections can be enumerated and blocked; **tool catalog matches the live session** — the visible tool list now comes from `ctx.tools.schemas(agent)` instead of the preset-only assembly; **same-name shadow detection** — inherited tools displaced by a same-name plugin tool enter the read-only masked pool, and plugin-only session-level tools are listed honestly as such; DSH runtime tool/prompt contracts, mask pool, workspace skill status, provider summary cache and write serialization; MCP global edit keeps JSON/YAML; live agent preset resolution via `composedPreset`; A/B preset, uninstall-restore and source-immutability regressions), targeting **DSH 0.2.2-rc.1**. Version compatibility, per-release changes and migration notes live in [docs/upgrades/README.md](docs/upgrades/README.md).

## Quick start

1. Open the dsh Web UI and click **Capabilities** in the sidebar.
2. Switch to the **Prompts** tab and choose an agent preset at the top.
3. Edit in Prompt / Tool / Config mode, then click **Save**. The right-hand preview shows exactly what the model will receive.

Prompt sections and tools can be configured separately for the bootstrap, compaction-controlled and resident phases; switch the phase tab to see that phase's own checkbox state and preview.

## Where the configuration lives

- **A single SQLite file**: `~/.dsh/prompt-customizer/prompt-customizer.db` (WAL, using the built-in `node:sqlite`, no external dependency). Preset customizations and the MCP mask / tool-toggle and skill ledgers live in this one DB; global MCP servers themselves live under `$DSH_HOME/mcps`, and workspace-level prompt/tool data is retained as dormant fields without reads or writes. Host config files (`cordis.patch.yml` / `.mcp.json`) and per-skill-root `.bundles.json` remain files.
- **Breaking change (1.0.0)**: the old `config.yaml` / `catalog.yaml` and JSON ledgers are **no longer read or migrated** (files are left untouched); upgrading to 1.0.0 requires **re-configuring**. See [docs/upgrades/1.0.0-sqlite-breaking.md](docs/upgrades/1.0.0-sqlite-breaking.md).

## Development

```bash
npm install
npm run check   # build + full unit tests + host / client smoke
```

Build artifacts: `lib/index.js` (host half) and `client/client.js` (browser half).

## Documentation

- [Full usage and implementation guide (Chinese)](docs/guide.md)
- [Version upgrade and migration records](docs/upgrades/README.md)
- [DSH 0.2.2-rc.1 migration record](docs/upgrades/dsh-0.2.2-rc1.md)
- [DSH 0.2.1-rc.2 migration record](docs/upgrades/rc2-migration.md)

## Credits

- The SKILL and MCP UI and host modules reference [Kr-ATG/dsh-triad](https://github.com/Kr-ATG/dsh-triad).
- The prompt panel derives from this repository's standalone 0.5.x implementation.

## License

[MIT](LICENSE) © 2026 DreamsTOF

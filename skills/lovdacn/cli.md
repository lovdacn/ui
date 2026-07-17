# lovdacn CLI Reference

Configuration is read from `lvcn.json`. The CLI has exactly **four** commands: `init`, `add`, `apply`, `present`.

> **IMPORTANT:** Always run commands using the project's package runner: `npx lovdacn@latest`, `pnpm dlx lovdacn@latest`, `bunx --bun lovdacn@latest`, or `yarn dlx lovdacn@latest`. The CLI auto-detects the package manager from the project's lockfile. `lvcn` is a shorthand alias for `lovdacn` (`npx lvcn@latest add button`). Examples below use `npx lovdacn@latest`.

> **IMPORTANT:** Only use the flags documented below. Do not invent flags. There is **no** `search`, `docs`, `info`, `view`, `build`, `list`, or `mcp` command — those exist in web shadcn, not in lovdacn. To browse components, fetch the docs site (`https://lovdacn.vercel.app/docs/components/<name>`) or read installed source in the project's `ui` alias.

## Contents

- Commands: `init`, `add`, `apply`, `present`
- Style engines: nativewind, uniwind
- Presets: named, style name, preset code
- Registry override
- Available components

---

## Commands

### `init` — Initialize or create a project

```bash
npx lovdacn@latest init [options]
```

Creates a new Expo project (when `-n/--name` is provided, scaffolding a NativeWind or Uniwind template) or configures an existing one. Writes `lvcn.json`, sets up CSS variables and `lib/utils`, and installs required dependencies.

| Flag                       | Short | Description                                              | Default   |
| -------------------------- | ----- | -------------------------------------------------------- | --------- |
| `--cwd <cwd>`              | `-c`  | Working directory                                        | current   |
| `--name <name>`           | `-n`  | Name for a new project                                   | —         |
| `--yes`                   | `-y`  | Skip confirmation prompts                                | `false`   |
| `--force`                 | `-f`  | Force overwrite of existing files                        | `false`   |
| `--package-manager <pm>`  | `-p`  | Package manager: `npm` \| `yarn` \| `pnpm` \| `bun`      | detected  |
| `--preset <preset>`       |       | Preset: a preset code, a named preset, or a style name   | —         |
| `--engine <engine>`       |       | Style engine: `nativewind` \| `uniwind`                  | prompt    |

`init` will:

1. Scaffold a NativeWind or Uniwind Expo template (new projects only).
2. Write `lvcn.json` with `style`, `styleEngine`, and base color.
3. Set up CSS variables (in the global CSS file) and the `cn` helper in `lib/utils`.
4. Install required dependencies.

### `add` — Add components

```bash
npx lovdacn@latest add [components...] [options]
```

Resolves each component and its registry dependencies from the registry, installs npm dependencies (via `expo install` on Expo projects so native modules match the SDK), rewrites import aliases to match the project, wires up the portal host + gesture handler for overlay components, writes files into the `ui` alias directory, and records the components in `lvcn.json`.

Running `add` with **no arguments** opens an interactive multi-select of all available components (space to select, `a` to toggle all, enter to submit).

| Flag                       | Short | Description                                          | Default  |
| -------------------------- | ----- | ---------------------------------------------------- | -------- |
| `--yes`                   | `-y`  | Skip confirmation prompt (don't ask before overwrite)| `false`  |
| `--overwrite`             | `-o`  | Overwrite existing files                             | `false`  |
| `--cwd <cwd>`             | `-c`  | Working directory                                    | current  |
| `--package-manager <pm>`  | `-p`  | Package manager: `npm` \| `yarn` \| `pnpm` \| `bun`  | detected |

Requires an existing `lvcn.json` (run `init` first). If a target file already exists and neither `--overwrite` nor `--yes` is set, the CLI prompts per file.

**Portal components** — `alert-dialog`, `context-menu`, `dialog`, `dropdown-menu`, `hover-card`, `popover`, `select`, `tooltip` — additionally pull in `@rn-primitives/portal` and `react-native-gesture-handler`, and the CLI patches the app root to mount `<PortalHost />` and wrap it in `<GestureHandlerRootView>`. See [registry.md](./registry.md).

```bash
# Single component.
npx lovdacn@latest add button

# Multiple components.
npx lovdacn@latest add button card input label text

# Interactive picker.
npx lovdacn@latest add

# Overwrite existing files without prompting.
npx lovdacn@latest add dialog --overwrite
```

### `apply` — Apply a theme preset

```bash
npx lovdacn@latest apply <code> [options]
```

Applies a **preset code** (from the web builder), a **named preset**, or a **style name** to an existing project: updates `lvcn.json`, regenerates the global CSS from the effective config, installs the font package, and (on a full apply) re-installs all installed components in the new style. **Icons are never changed automatically** — switching icon libraries is manual.

| Flag                       | Short | Description                                                       | Default  |
| -------------------------- | ----- | ----------------------------------------------------------------- | -------- |
| `--cwd <cwd>`             | `-c`  | Working directory                                                 | current  |
| `--yes`                   | `-y`  | Skip confirmation prompt                                          | `false`  |
| `--force`                 | `-f`  | Proceed even if the git working tree is dirty                     | `false`  |
| `--only <parts>`          |       | Apply only parts (comma-separated): `theme`, `colors`, `font`, `radius` | full  |
| `--package-manager <pm>`  | `-p`  | Package manager: `npm` \| `yarn` \| `pnpm` \| `bun`               | detected |

- `<code>` is required and may be a named preset (`nova`, `sera`, …), a style name, or an opaque preset code (e.g. `a2r6bw`).
- Without `--only`, `apply` does a **full apply** and re-installs components (which overwrites component files). It guards against a dirty git tree unless `--force` is passed — commit or stash first.
- `--only` does a **partial apply**: it updates only the requested dimensions and does **not** re-install components. `style` is never changed by a partial apply (a style change implies a component re-install). Valid parts: `theme`, `colors`, `font`, `radius`.
- On failure, `apply` rolls back `lvcn.json`, the global CSS, and component files to their previous state.

```bash
npx lovdacn@latest apply nova                 # named preset
npx lovdacn@latest apply a2r6bw               # preset code
npx lovdacn@latest apply nova --only theme    # only the accent theme
npx lovdacn@latest apply nova --only theme,font
npx lovdacn@latest apply sera --force         # bypass dirty-tree guard
```

### `present` — Show the current preset (read-only)

```bash
npx lovdacn@latest present [options]
```

Reads `lvcn.json` and prints the project's current preset — its shareable **code** and decoded values (`style`, `baseColor`, `theme`, `chartColor`, `font`, `iconLibrary`, `radius`). Makes **no changes**. Use `apply <code>` to change the theme.

| Flag            | Short | Description       | Default |
| --------------- | ----- | ----------------- | ------- |
| `--cwd <cwd>`  | `-c`  | Working directory | current |
| `--json`       |       | Output as JSON    | `false` |

```bash
npx lovdacn@latest present
npx lovdacn@latest present --json   # { "code": "...", "values": { ... } }
```

> **Note:** The command is `present`, not `preset`. It is read-only. There is no separate command to *edit* individual preset fields — use `apply` (optionally with `--only`) to change the theme, or edit `lvcn.json` + the global CSS directly.

---

## Style Engines

Set at `init` via `--engine` (or the interactive prompt) and stored as `styleEngine` in `lvcn.json`.

| Engine       | Description                                                                                  |
| ------------ | -------------------------------------------------------------------------------------------- |
| `nativewind` | Classic Tailwind utility runtime for React Native. HSL CSS variables + `tailwind.config.js`. Compatible with react-native-reusables. |
| `uniwind`    | Tailwind v4-style runtime. OKLCH tokens defined in CSS via `@theme`; no `tailwind.config.js`. |

The `add` command fetches component source specific to `styleEngine` **and** `style` (see [registry.md](./registry.md)).

---

## Presets

`--preset` (on `init`) and the `<code>` argument (on `apply`) accept three forms:

1. **Named preset:** `nova`, `sera`, `new-york`, … — see the full list in [customization.md](./customization.md).
2. **Style name:** any style pack name (`new-york`, `default`, `luma`, `lyra`, `maia`, `mira`, `nova`, `rhea`, `sera`, `vega`).
3. **Preset code:** an opaque base62 string (e.g. `a2r6bw`) generated by the web preset builder. Pass it directly — don't try to decode it by hand; the CLI resolves it. Use `present` to see the current project's code.

A preset bundles: `style`, `baseColor`, `theme` (accent/primary), `chartColor`, `font`, `iconLibrary`, and `radius`. See [customization.md](./customization.md) for every value.

---

## Registry Override

Components resolve from `https://lovdacn.vercel.app/r` by default. Override with the `LOVDA_REGISTRY_URL` environment variable (a URL, or a local folder for development):

```bash
LOVDA_REGISTRY_URL=https://your-registry/r npx lovdacn@latest add button
LOVDA_REGISTRY_URL=/abs/path/to/local/r     npx lovdacn@latest add button
```

The CLI fetches each item from `<registry>/styles/<styleEngine>/<style>/<name>.json`. See [registry.md](./registry.md).

---

## Available Components

```
accordion, alert, alert-dialog, aspect-ratio, avatar, badge, button,
card, checkbox, collapsible, context-menu, dialog, dropdown-menu,
hover-card, icon, input, label, menubar, native-only-animated-view,
popover, progress, radio-group, select, separator, skeleton, switch,
tabs, text, textarea, toggle, toggle-group, tooltip
```

(`utils` — the `cn` helper — is also a registry item and is pulled in automatically as a dependency.)

Per-component docs and examples: `https://lovdacn.vercel.app/docs/components/<name>`.

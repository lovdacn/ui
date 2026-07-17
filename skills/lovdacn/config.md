# lvcn.json — Project Configuration

`lvcn.json` is the single source of project context (lovdacn has no `info` command). Read it directly to learn how the project is set up, then use it to write correct imports and pick the right component source.

The file is only required when using the CLI to add components. If someone copies component source manually, it isn't strictly needed — but the CLI creates and maintains it via `init` and `add`.

JSON Schema: `https://lovdacn.vercel.app/schema.json`.

## Full Example

```json
{
  "$schema": "https://lovdacn.vercel.app/schema.json",
  "style": "nova",
  "styleEngine": "nativewind",
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/global.css",
    "baseColor": "neutral"
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui"
  },
  "components": ["button", "card", "input", "text"],
  "baseColor": "neutral",
  "theme": "blue",
  "chartColor": "sky",
  "font": "inter",
  "iconLibrary": "lucide",
  "radius": "default"
}
```

## Fields

### `$schema`

Points at the published JSON Schema for editor validation. Always `https://lovdacn.vercel.app/schema.json`.

### `style`

The visual style pack. **Set at init and cannot be changed afterward without re-adding components** — component source in the registry differs per style (radius, spacing, shadows, etc.). Values:

`new-york`, `default`, `luma`, `lyra`, `maia`, `mira`, `nova`, `rhea`, `sera`, `vega`.

The `add` command uses this to fetch the right source: `.../styles/<styleEngine>/<style>/<name>.json`.

### `styleEngine`

The styling runtime. Determines how theme tokens are defined and where.

| Value        | Tokens | Config                                   |
| ------------ | ------ | ---------------------------------------- |
| `nativewind` | HSL    | `tailwind.config.js` + CSS variables     |
| `uniwind`    | OKLCH  | `@theme` block in the global CSS (no config file) |

Also part of the registry fetch path. Defaults to `nativewind` if absent.

### `tsx`

`true` for TypeScript (`.tsx` / `.ts`), `false` for JavaScript (`.jsx` / `.js`). Controls the extension the CLI writes for generated files (e.g. `lib/utils`). Defaults to `true`.

### `tailwind`

How Tailwind is wired up.

- **`tailwind.config`** — path to `tailwind.config.js`. NativeWind only; Uniwind projects define theme in CSS via `@theme` and don't use a config file.
- **`tailwind.css`** — path to the global CSS file that imports Tailwind and defines the CSS variables (e.g. `src/global.css`). **This is where theme tokens live — always edit this file, never create a new one.** `apply` regenerates it.
- **`tailwind.baseColor`** — the neutral base palette used to generate theme tokens: `zinc`, `slate`, `stone`, `gray`, `neutral`, `taupe`, `mauve`, `olive`, `mist`.

### `aliases`

Import aliases the CLI uses when writing component source. When `add` writes a file, it rewrites registry import paths (`@/components/ui/...`, `@/lib/utils`, `@/registry/<engine>/...`) to these values. Always use these prefixes in code you write; never hardcode a different path.

- **`aliases.components`** — components directory (default `@/components`).
- **`aliases.utils`** — where the `cn` helper lives (default `@/lib/utils`).
- **`aliases.ui`** — where UI components are installed (default `@/components/ui`). Components land here.

> The CLI resolves an alias to a real folder by stripping the `@/` or `~/` prefix and, if the project has a `src/` directory, resolving inside `src/`. So `@/components/ui` → `<project>/src/components/ui` when `src/` exists, else `<project>/components/ui`.

### `components`

Array of component names already added to the project. The CLI appends to this automatically on `add`. Use it to know what's installed — **don't re-add installed components, and don't import ones that aren't listed** (cross-check by listing the `aliases.ui` directory too).

```json
{ "components": ["button", "card", "input", "text"] }
```

### Preset fields

These capture the resolved theme preset and are read by `present` and updated by `apply`. See [customization.md](./customization.md) for every value.

| Field         | Meaning                                        | Example values                                  |
| ------------- | ---------------------------------------------- | ----------------------------------------------- |
| `baseColor`   | Neutral palette (mirrors `tailwind.baseColor`) | `zinc`, `neutral`, `olive`, `taupe`, …          |
| `theme`       | Accent / primary color                         | `blue`, `rose`, `emerald`, `neutral`, …         |
| `chartColor`  | Base color for `--chart-1..5`                  | `sky`, `pink`, `blue`, …                        |
| `font`        | Font family (via `@expo-google-fonts`)         | `inter`, `dm-sans`, `space-grotesk`, `geist`, … |
| `iconLibrary` | Icon package family                            | `lucide`, `phosphor`, `tabler`, `expo`, `heroicons` |
| `radius`      | Border-radius scale                            | `default`, `none`, `small`, `medium`, `large`, `full` |

> **`iconLibrary` → package mapping** (use this when writing icon imports):
> `lucide` → `lucide-react-native` · `phosphor` → `phosphor-react-native` · `tabler` → `@tabler/icons-react-native` · `expo` → `@expo/vector-icons` · `heroicons` → `react-native-heroicons`.

## Reading Project Context

```bash
# The config is the project context.
cat lvcn.json

# Current theme preset + shareable code (read-only, derived from lvcn.json).
npx lovdacn@latest present
npx lovdacn@latest present --json
```

When advising or editing:

- Use `aliases.*` for every import path.
- Branch on `styleEngine` for theme edits (HSL/`tailwind.config.js` vs OKLCH/`@theme`).
- Use `iconLibrary` to choose the icon import package.
- Use `tsx` to choose file extensions.
- Check `components` before importing or adding.
- Treat `style` as fixed; changing it means re-adding components (`apply` does this).

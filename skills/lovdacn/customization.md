# Customization & Theming

lovdacn themes with CSS variables, like shadcn/ui. Components reference semantic tokens; change the variables to restyle everything. How tokens are stored depends on the **style engine**.

## Contents

- How it works
- Color tokens
- NativeWind (HSL) vs Uniwind (OKLCH)
- Presets: styles, base colors, themes, fonts, icons, radii
- Named presets
- Changing the theme (`apply`, `present`)
- Dark mode
- Customizing components

---

## How It Works

1. CSS variables are defined for light (`:root`) and dark (`.dark` / `.dark:root`) in the global CSS file (`tailwind.css` in `lvcn.json`).
2. Tailwind maps them to utilities: `bg-primary`, `text-muted-foreground`, `border-border`, etc.
3. Components use those utilities — changing a variable changes every component that references it.

## Color Tokens

Every color follows the `name` / `name-foreground` convention: the base is for backgrounds/surfaces, `-foreground` is for text/icons on that surface.

| Token                                        | Purpose                          |
| -------------------------------------------- | -------------------------------- |
| `--background` / `--foreground`              | Screen background and default text |
| `--card` / `--card-foreground`               | Card surfaces                    |
| `--popover` / `--popover-foreground`         | Popovers, menus, dialog surfaces |
| `--primary` / `--primary-foreground`         | Primary actions                  |
| `--secondary` / `--secondary-foreground`     | Secondary actions                |
| `--muted` / `--muted-foreground`             | Muted surfaces and subtle text   |
| `--accent` / `--accent-foreground`           | Hover/active and accent surfaces |
| `--destructive` / `--destructive-foreground` | Errors and destructive actions   |
| `--border`                                   | Default border color             |
| `--input`                                    | Input surface/border             |
| `--ring`                                     | Focus ring                       |
| `--chart-1` … `--chart-5`                    | Data visualization ramp          |
| `--radius`                                   | Base border radius               |

Use them as Tailwind utilities: `bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-primary-foreground`, `bg-destructive`, `ring-ring`, etc.

## NativeWind (HSL) vs Uniwind (OKLCH)

The value format and where it's registered depend on `styleEngine` (check `lvcn.json`).

### NativeWind — HSL triplets + `tailwind.config.js`

Variables hold bare HSL triplets and the config wraps them in `hsl(var(--…))`.

```css
/* global.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --radius: 0.5rem;
    --background: 0 0% 100%;
    --foreground: 240 10% 4%;
    --primary: 240 6% 10%;
    --primary-foreground: 0 0% 98%;
    /* … */
  }
  .dark:root {
    --background: 240 10% 4%;
    --foreground: 0 0% 98%;
    /* … */
  }
}
```

```js
// tailwind.config.js (excerpt)
module.exports = {
  darkMode: "class",
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // …
      },
    },
  },
}
```

### Uniwind — OKLCH + `@theme`

Variables hold OKLCH values, registered through Tailwind v4-style `@theme`. No `tailwind.config.js`.

```css
/* global.css */
@import "tailwindcss";
@import "uniwind";

:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  /* … */
}
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  /* … */
}
```

> Edit tokens in the file referenced by `tailwind.css`. Never create a second CSS file for theme variables.

## Presets

A preset bundles seven dimensions. `apply` writes them to `lvcn.json` and regenerates the CSS.

### Styles (`style`) — set at init, fixed thereafter

| Style      | Radius     | Notes                              |
| ---------- | ---------- | ---------------------------------- |
| `default`  | `0.5rem`   | Classic rounded system             |
| `new-york` | `0.5rem`   | Compact, refined, shadcn-compatible |
| `luma`     | `0.75rem`  | Soft rounded corners               |
| `lyra`     | `0.125rem` | Nearly sharp, minimal              |
| `maia`     | `1rem`     | Large rounded corners              |
| `mira`     | `1.5rem`   | Pill controls, rounded containers  |
| `nova`     | `0.125rem` | Sharp corners, bold                |
| `rhea`     | `1.5rem`   | Pill controls variant              |
| `sera`     | `0`        | Zero radius, brutalist             |
| `vega`     | `0.625rem` | Balanced medium radius             |

### Base colors (`baseColor`)

`zinc`, `slate`, `stone`, `gray`, `neutral`, `taupe`, `mauve`, `olive`, `mist`. The neutral palette for backgrounds, surfaces, borders, and muted text. Grayscale families keep their own primary.

### Themes / accents (`theme`) and chart colors (`chartColor`)

`zinc`, `slate`, `stone`, `gray`, `neutral`, `red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`, `sky`, `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose`.

`theme` overrides `--primary` (grayscale values keep the base color's primary). `chartColor` fills `--chart-1..5`.

### Fonts (`font`)

Installed from `@expo-google-fonts/<font>`: `inter`, `dm-sans`, `nunito-sans`, `figtree`, `outfit`, `manrope`, `space-grotesk`, `montserrat`, `roboto`, `raleway`, `public-sans`, `source-sans-3`, `lora`, `merriweather`, `playfair-display`, `jetbrains-mono`, `space-mono`, `fira-code`, `noto-serif`, `roboto-slab`, `instrument-sans`, `instrument-serif`, `geist`.

### Icon libraries (`iconLibrary`)

| Value       | npm package                   |
| ----------- | ----------------------------- |
| `lucide`    | `lucide-react-native`         |
| `phosphor`  | `phosphor-react-native`       |
| `tabler`    | `@tabler/icons-react-native`  |
| `expo`      | `@expo/vector-icons`          |
| `heroicons` | `react-native-heroicons`      |

`apply` **never** switches icons automatically — changing icon libraries is manual (install the package, update imports). See [rules/icons.md](./rules/icons.md).

### Radii (`radius`)

| Value     | `--radius` |
| --------- | ---------- |
| `default` | `0.5rem`   |
| `none`    | `0rem`     |
| `small`   | `0.125rem` |
| `medium`  | `0.625rem` |
| `large`   | `0.75rem`  |
| `full`    | `1.5rem`   |

## Named Presets

Ready-made combinations you can pass to `init --preset` or `apply`:

| Name       | style      | baseColor | theme    | chart  | font              | icon     | radius    |
| ---------- | ---------- | --------- | -------- | ------ | ----------------- | -------- | --------- |
| `new-york` | new-york   | zinc      | zinc     | blue   | inter             | lucide   | default   |
| `default`  | default    | slate     | slate    | blue   | inter             | lucide   | default   |
| `luma`     | luma       | neutral   | blue     | sky    | inter             | lucide   | large     |
| `lyra`     | lyra       | stone     | amber    | orange | jetbrains-mono    | phosphor | small     |
| `maia`     | maia       | neutral   | violet   | purple | figtree           | tabler   | large     |
| `mira`     | mira       | zinc      | emerald  | red    | inter             | phosphor | full      |
| `nova`     | nova       | neutral   | neutral  | blue   | inter             | lucide   | small     |
| `rhea`     | rhea       | neutral   | rose     | pink   | dm-sans           | lucide   | full      |
| `sera`     | sera       | taupe     | amber    | amber  | playfair-display  | lucide   | none      |
| `vega`     | vega       | neutral   | cyan     | teal   | space-grotesk     | lucide   | medium    |

## Changing the Theme

```bash
# Inspect the current preset (read-only) and its shareable code.
npx lovdacn@latest present
npx lovdacn@latest present --json

# Full apply: updates lvcn.json + CSS, installs the font, re-installs components in the new style.
npx lovdacn@latest apply nova
npx lovdacn@latest apply a2r6bw          # opaque preset code from the web builder

# Partial apply: only the named parts; does NOT re-install components; never changes style.
npx lovdacn@latest apply nova --only theme
npx lovdacn@latest apply nova --only theme,font
npx lovdacn@latest apply nova --only colors     # base color palette
npx lovdacn@latest apply nova --only radius
```

- A full `apply` overwrites component files, so it guards against a dirty git tree — commit/stash first or pass `--force`.
- `--only` parts: `theme` (accent + chart), `colors` (base palette), `font`, `radius`.
- To change **`style`**, you must re-add components — a full `apply` does this for you.
- Alternatively, edit the CSS variables in the `tailwind.css` file directly.

## Dark Mode

Themes ship full light and dark token sets. Dark mode is class-based (`darkMode: "class"` for NativeWind; `.dark` selector for Uniwind), driven by the system color scheme on native.

- **NativeWind**: ensure `global.css` defines both `:root` (light) and `.dark:root` (dark) for every token. Templates ship a `use-color-scheme` hook and theme-aware wrappers.
- **Uniwind**: light/dark `@theme` values are generated at init; toggle via the system color scheme or a theme provider.

```ts
// hooks/use-color-scheme.ts (template)
import { useColorScheme as useRNColorScheme } from "react-native"
export function useColorScheme() {
  return useRNColorScheme()
}
```

Checklist: (1) light and dark variables present for all tokens; (2) the root layout responds to system/user preference; (3) components use semantic classes (`bg-background`, `text-foreground`, `border-border`) — **never hard-coded or `dark:`-prefixed colors** (see [rules/styling.md](./rules/styling.md)).

## Customizing Components

Prefer in order:

1. **Built-in variants** — `<Button variant="outline" size="sm">`.
2. **Layout `className`** — `<Card className="mx-auto max-w-md">` (layout only, not colors).
3. **Semantic tokens** — reference or add CSS variables; use `bg-*`/`text-*` utilities.
4. **New variant** — extend the component's `cva` config with a new variant.
5. **Wrapper component** — compose primitives into a higher-level component.

To add a custom color: define `--warning` / `--warning-foreground` in the global CSS (`:root` and `.dark`), then register it — for NativeWind add it to `tailwind.config.js` `colors` as `hsl(var(--warning))`; for Uniwind add it to the `@theme` block. Then use `bg-warning text-warning-foreground`.

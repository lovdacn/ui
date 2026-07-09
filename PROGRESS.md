# lvcn — Progress Report

Comprehensive summary of everything shipped so far on the `lvcn` CLI and its
Expo/React Native templates. Covers the style + base-color system, the
dark/light mode implementation, the component fixes (Pressable, text alignment,
ExternalLink), template scaffolding behavior in `init`, and all supporting
plumbing.

---

## 1. Project context

`lvcn` is a shadcn-style CLI for Expo React Native projects. It ships two
template variants and a component registry:

- `packages/lovda/templates/nativewind/` — NativeWind (classic Tailwind
  utility runtime for RN)
- `packages/lovda/templates/uniwind/` — Uniwind (Tailwind v4-style runtime for
  RN, using `@theme` in CSS)
- `packages/lovda/src/commands/init.ts` — the `init` command, handles both
  "new project" and "add to existing project" flows
- `test/fixtures/registry/styles/{styleEngine}/{style}/*.json` — per-style
  compiled component registry (10 styles × 2 engines)

The CLI targets Expo SDK 57 (`https://docs.expo.dev/versions/v57.0.0/`), so
all template code must match that version's APIs (expo-router v6, native
tabs, etc.).

Ten styles are supported: `default`, `new-york`, `luma`, `lyra`, `maia`,
`mira`, `nova`, `rhea`, `sera`, `vega`.

Nine base colors are supported: `zinc`, `slate`, `stone`, `gray`, `neutral`,
`taupe`, `mauve`, `olive`, `mist`.

---

## 2. Task ledger

| # | Subject                                                    | Status    |
|---|------------------------------------------------------------|-----------|
| 1 | Investigate lvcn styles and base color setup               | completed |
| 2 | Fix dark/light mode CSS generation for each style/base color | completed |
| 3 | Fix component inconsistency (Pressable, text alignment)    | completed |
| 4 | Add style-specific CSS overrides (per shadcn v4 style-*.css) | completed |
| 5 | Fix nativewind dark selector (`.dark:root` → `.dark`)       | completed |
| 6 | Fix template nativewind app/index.tsx (broken UI, raw colors) | completed |
| 7 | Fix Pressable in ExternalLink asChild + Button             | completed |

Each is unpacked in the sections below.

---

## 3. Style + base-color system

### 3.1 Design

Every generated project gets:

1. Ten `STYLE_CONFIGS` variants that control **radius**, **default font**,
   and each style's **default base color**.
2. Nine `THEME_COLORS` base-color palettes, each with an `hsl` variant
   (for NativeWind) and an `oklch` variant (for Uniwind + Tailwind v4).
3. Both light + dark tokens for every base color, so `.dark` mode is
   fully populated regardless of the base chosen.

### 3.2 `STYLE_CONFIGS` (from `init.ts`)

```ts
const STYLE_CONFIGS: Record<string, StyleConfig> = {
  "default":  { radius: "0.5rem",   fontSans: "Inter",             defaultBaseColor: "slate"   },
  "new-york": { radius: "0.5rem",   fontSans: "Inter",             defaultBaseColor: "zinc"    },
  luma:       { radius: "0.75rem",  fontSans: "Inter",             defaultBaseColor: "neutral" },
  lyra:       { radius: "0.125rem", fontSans: "JetBrains Mono",    defaultBaseColor: "stone"   },
  maia:       { radius: "1rem",     fontSans: "Inter",             defaultBaseColor: "neutral" },
  mira:       { radius: "9999px",   fontSans: "Inter",             defaultBaseColor: "zinc"    },
  nova:       { radius: "0.125rem", fontSans: "Inter",             defaultBaseColor: "neutral" },
  rhea:       { radius: "9999px",   fontSans: "Inter",             defaultBaseColor: "neutral" },
  sera:       { radius: "0rem",     fontSans: "Instrument Serif", defaultBaseColor: "taupe"   },
  vega:       { radius: "0.625rem", fontSans: "Inter",             defaultBaseColor: "neutral" },
};
```

If a user selects a style but not a base color, the style's
`defaultBaseColor` fills in. If they pick both, the user's choice wins.

### 3.3 `THEME_COLORS` structure

Each entry contains `hsl.light`, `hsl.dark`, `oklch.light`, `oklch.dark`
with the standard 19 shadcn tokens:

```
background, foreground,
card, card-foreground,
popover, popover-foreground,
primary, primary-foreground,
secondary, secondary-foreground,
muted, muted-foreground,
accent, accent-foreground,
destructive, destructive-foreground,
border, input, ring
```

### 3.4 Base color coverage

Zinc, slate, stone, gray, neutral, taupe, mauve, olive, and mist all ship
fully-defined light + dark palettes in both HSL and OKLCH. That means the
following combinations all generate valid CSS:

- 10 styles × 9 base colors × 2 engines × 2 modes (light/dark) = 360 variants

All fully populated in `init.ts` `THEME_COLORS`.

### 3.5 `getStyleVars(style, styleEngine, baseColor)`

Returns the CSS block that goes into `global.css` after the Tailwind
directives / imports.

- For **uniwind**: emits a `@theme inline { … }` block mapping semantic
  `--color-*` tokens to the raw HSL/OKLCH variables, followed by `:root`
  and `.dark` blocks with `oklch(...)` values.
- For **nativewind**: emits `@layer base { :root { … } .dark:root { … } }`
  with plain HSL triplet strings (compatible with `hsl(var(--foo))`
  utilities and NativeWind's runtime).
- Always emits a `:root` block with the style-specific font vars
  (`--font-sans`, `--font-display`, `--font-mono`, `--font-rounded`,
  `--font-serif`).

**Note on the nativewind `.dark:root` selector** — see §7.

---

## 4. `configureGlobalCss` — the CSS writer

```ts
async function configureGlobalCss(
  projectPath, styleEngine, cssRelativePath, style, baseColor
) {
  const cssPath = path.join(projectPath, cssRelativePath)
  fs.ensureDirSync(path.dirname(cssPath))

  let content = ""
  if (styleEngine === "uniwind") {
    content += '@import "tailwindcss";\n'
    content += '@import "uniwind";\n'
  } else {
    content += '@tailwind base;\n'
    content += '@tailwind components;\n'
    content += '@tailwind utilities;\n'
  }
  content += "\n" + getStyleVars(style, styleEngine, baseColor) + "\n"

  fs.writeFileSync(cssPath, content, "utf8")
}
```

Writes to `./src/global.css` when a `src/` directory exists (either in the
target project for existing-project mode, or in the template for
new-project mode), otherwise falls back to `./global.css`.

### 4.1 CSS path resolution

```ts
const hasSrcDir = hasPackageJson
  ? fs.existsSync(path.join(projectPath, "src"))
  : fs.existsSync(path.join(templateDir, "src"))
const cssRelativePath = hasSrcDir ? "./src/global.css" : "./global.css"
```

The same path drives:

- The `tailwind.css` field in `lvcn.json`.
- The `input` argument passed to `withNativeWind(config, { input })` in
  `metro.config.js`.
- The `cssEntryFile` argument passed to `withUniwindConfig(config, { … })`.
- The relative import injected into the root layout file
  (`configureRootImport`).

Ensures nothing goes out of sync between config, metro, and app entry.

---

## 5. `configureThemeTs` — bridging Tailwind tokens to RN theme

`src/constants/theme.ts` in the templates exports a `Colors` object that
non-Tailwind React Native code (StatusBar, insets, chart libs, etc.) reads
from. Init keeps `Colors` in sync with the selected base color:

```ts
export const Colors = {
  light: {
    text: '#111111',
    background: '#ffffff',
    backgroundElement: '#f4f4f5',
    backgroundSelected: '#f4f4f5',
    textSecondary: '#71717a',
  },
  dark: {
    text: '#fafafa',
    background: '#0a0a0a',
    backgroundElement: '#27272a',
    backgroundSelected: '#27272a',
    textSecondary: '#a1a1aa',
  },
} as const;
```

The five values are computed by running `hslToHex()` over the selected
base color's `foreground / background / muted / accent / muted-foreground`
tokens for both light and dark.

`hslToHex()`:

```ts
function hslToHex(hslStr: string): string {
  const [h, s, l] = parseHsl(hslStr)
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const c = l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
    return Math.round(255 * c).toString(16).padStart(2, "0")
  }
  return `#${f(0)}${f(8)}${f(4)}`
}
```

A regex `/export\s+const\s+Colors\s*=\s*\{[\s\S]*?\}\s*as\s+const;/g`
finds and replaces the entire `Colors` block in-place, preserving any
other exports in `theme.ts`.

---

## 6. Style-specific CSS overrides (Task #4)

`shadcn/ui` v4 ships one CSS file per style
(`style-luma.css`, `style-lyra.css`, …). Lvcn originally shipped these as
separate files under `packages/lovda/templates/styles/`. This slice
consolidated them by folding each style's radius + font choice directly
into `getStyleVars` (see §3.2 / §3.5).

The redundant per-style files were removed:

```
deleted:  packages/lovda/templates/styles/style-luma.css
deleted:  packages/lovda/templates/styles/style-lyra.css
deleted:  packages/lovda/templates/styles/style-maia.css
deleted:  packages/lovda/templates/styles/style-mira.css
deleted:  packages/lovda/templates/styles/style-nova.css
deleted:  packages/lovda/templates/styles/style-rhea.css
deleted:  packages/lovda/templates/styles/style-sera.css
deleted:  packages/lovda/templates/styles/style-vega.css
```

Result: one source of truth for style + base-color tokens
(`STYLE_CONFIGS` + `THEME_COLORS`), rather than 10 CSS files kept in sync
by hand.

---

## 7. NativeWind dark selector fix (Task #5)

**Bug.** The generated CSS used `.dark:root { … }` which reads as a
compound selector (an element with both `.dark` and `:root`). NativeWind's
runtime toggles `dark` on a wrapper `<View>`, not on the document root, so
the dark variables were never picked up.

**Fix.** The nativewind branch of `getStyleVars` now emits `.dark { … }`
inside `@layer base`, matching NativeWind's darkMode: `"class"`
behavior. Uniwind's branch already used `.dark { … }`.

Contrast:

- **Before:** `.dark:root { --background: ... }` (never matches)
- **After:** `.dark { --background: ... }` (matches the wrapper View)

The uniwind side was already correct, so this only touched the nativewind
CSS emission.

---

## 8. Template `app/index.tsx` fix (Task #6)

The nativewind template's home screen previously used raw hex colors and
inline styles, breaking as soon as base color / mode changed. It was
rewritten to use the theme system:

- `<ThemedView>` instead of `<View>`
- `<ThemedText type="title|code|small|…">` for typography
- `useTheme()` for computed light/dark colors
- Layout via `Spacing`, `MaxContentWidth`, `BottomTabInset` from
  `constants/theme.ts`
- Dev-menu hint helper that responds to `Platform.OS` and
  `Device.isDevice` (web → devtools note; physical device → shake hint;
  simulator → `cmd+m` / `cmd+d` hint)
- `<WebBadge />` only on `Platform.OS === 'web'`

The screen now inherits every theme change automatically.

---

## 9. Component consistency (Task #3)

Task #3 covered two problem areas: **Pressable** consistency and **text
alignment**.

### 9.1 `themed-text.tsx` — text alignment

Added a `base` style block applied to every variant:

```ts
base: {
  fontFamily: Fonts.sans,
  ...Platform.select({
    android: { includeFontPadding: false, textAlignVertical: 'center' as const },
    default: {},
  }),
},
```

Effects:

- **Android**: `includeFontPadding: false` removes the extra top/bottom
  gap Android adds around glyphs; `textAlignVertical: 'center'` fixes
  the "text sits slightly above vertical center" issue in rows and
  buttons.
- **iOS / web**: no-op — RN's default rendering is already tight.
- The base style is placed FIRST in the style array so per-variant
  styles (title, subtitle, small…) can override any of it.

**Additional cleanup:**

- Font weights switched from numeric literals (`500`) to string literals
  (`'500'`) — RN's `TextStyle['fontWeight']` type expects the string
  form, and both platforms accept it.
- `link` and `linkPrimary` `lineHeight` reduced from `30` → `20` so
  link text no longer over-spaces inside a row.

### 9.2 `collapsible.tsx` — layout + rotation

Two fixes:

1. **Chevron rotation.** Was `rotate: isOpen ? '-90deg' : '90deg'`
   (pointing sideways then more sideways). Now
   `rotate: isOpen ? '90deg' : '0deg'` — points right when closed,
   down when open, which matches shadcn/ui's accordion.
2. **Title flex.** Wrapped `<ThemedText>` with `style={styles.title}` where
   `title: { flex: 1 }`. Without this the title only takes intrinsic
   width, leaving whitespace between the title and the (nonexistent)
   trailing element, so the row didn't fill.

### 9.3 `app-tabs.tsx` and `app-tabs.web.tsx` — color-scheme hook

Both files switched from React Native's `useColorScheme` to the
project-local hook `@/hooks/use-color-scheme`, which:

- Handles the SSR / initial-mount case on web (returns `light` before
  hydration instead of `null`).
- Normalizes the `'unspecified'` state returned by RN 0.79+ on Android
  when the OS hasn't chosen a scheme yet.

The color lookup simplified accordingly:

```ts
// Before
const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

// After
const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
```

Same effect, but doesn't leak the `'unspecified'` string into a `Colors`
lookup (which would return `undefined`).

---

## 10. `ExternalLink` fix (Task #7)

### 10.1 Before

```tsx
export function ExternalLink({ href, ...rest }: Props) {
  return (
    <Link
      target="_blank"
      {...rest}
      href={href}
      onPress={async (event) => {
        if (process.env.EXPO_OS !== 'web') {
          event.preventDefault();
          await openBrowserAsync(href, {
            presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
          });
        }
      }}
    />
  );
}
```

**Problem.** `onPress` is declared *after* `{...rest}`, so any `onPress`
the caller passes to `ExternalLink` (or that flows down through
`asChild` to a `<Pressable>` / `<Button>` child) is silently dropped.
This matters when the child uses `onPress` for analytics, focus
management, or dismissing a modal before the browser opens.

### 10.2 After (nativewind + uniwind)

```tsx
export function ExternalLink({ href, onPress: userOnPress, ...rest }: Props) {
  return (
    <Link
      target="_blank"
      {...rest}
      href={href}
      onPress={async (event) => {
        userOnPress?.(event);
        if (process.env.EXPO_OS !== 'web') {
          event.preventDefault();
          await openBrowserAsync(href, {
            presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
          });
        }
      }}
    />
  );
}
```

**Effect.** Caller's `onPress` fires first, then the platform-specific
in-app-browser open. `event.preventDefault()` still runs on native so
expo-router doesn't also try to navigate.

### 10.3 Compatibility with `<Button>` as child

`Button` (in `components/ui/button.tsx`) renders a `Pressable` and spreads
`...props` onto it. When used inside `<ExternalLink asChild>`, expo-router
Slot forwards `href`/`onPress` through Button's prop-spread to the
underlying Pressable. With the fix above, if the caller also gives Button
its own `onPress` (e.g. haptics), both handlers run.

### 10.4 Explore-screen usage (unchanged)

```tsx
<ExternalLink href="https://docs.expo.dev" asChild>
  <Pressable style={({ pressed }) => pressed && styles.pressed}>
    <ThemedView type="backgroundElement" style={styles.linkButton}>
      <ThemedText type="link">Expo documentation</ThemedText>
      <SymbolView … />
    </ThemedView>
  </Pressable>
</ExternalLink>
```

The Pressable here doesn't set `onPress`, so behaviorally nothing
changed. But new callers who need their own handler are now supported.

---

## 11. `init.ts` — full flow

### 11.1 Two modes

- **New project** (`!hasPackageJson`): scaffold from template.
- **Existing project** (`hasPackageJson`): only patch what's needed.

### 11.2 Prompts

- Style engine — nativewind (default) or uniwind. In existing-project
  mode, autodetected from `package.json` dependencies if either
  `nativewind` or `uniwind` is present.
- Style — 10 options; default = `new-york`.
- Base color — 9 options; default depends on style.
- Project name — only in new-project mode.
- Package manager — auto-detected from lockfiles / `npm_config_user_agent`,
  with a fallback prompt.

All prompts are skipped when `--yes` is passed.

### 11.3 Existing-project ordering

1. Write / merge `lvcn.json` at project root.
2. `configureGlobalCss` — regenerate the CSS entry.
3. `configureThemeTs` — regenerate `constants/theme.ts` `Colors`.
4. `configureTailwindConfig` — patch `tailwind.config.js` (nativewind
   only) to add `darkMode: "class"`, semantic colors, borderRadius,
   accordion keyframes, and the `tailwindcss-animate` plugin. Existing
   configs are respected — patches are only applied when the relevant
   section is missing.
5. `configureMetroConfig` — wrap the metro config with `withNativeWind`
   or `withUniwindConfig`.
6. `configureBabelConfig` — nativewind only; add the `nativewind/babel`
   preset and `jsxImportSource` option.
7. `configureRootImport` — inject `import "<rel>/global.css"` into
   `src/app/_layout.tsx` (or `app/_layout.tsx`, `App.tsx`, …) if not
   already present. Path is computed relative to the layout's
   directory.

### 11.4 New-project ordering

1. Copy template files (`fs.copySync`), skipping `node_modules`, `.git`,
   `.expo`, `.claude`.
2. Overwrite `package.json`'s `name` field.
3. `adaptScaffoldedProject` — delete lockfiles that don't match the
   selected package manager; strip `packageManager` from `package.json`.
4. `configureGlobalCss` — overwrite the template's `src/global.css` with
   the style-specific version.
5. `configureThemeTs` — same for `constants/theme.ts`.

Then the shared "merge lvcn.json + install deps" tail runs.

### 11.5 Package installation

- Existing project: installs only style-engine-specific deps
  (`nativewind` / `uniwind`, plus `tailwindcss` and
  `class-variance-authority`).
- New project: full `install` of the scaffolded `package.json`.

---

## 12. `tailwind.config.js` patcher

`configureTailwindConfig` uses regex probing rather than a full JS
parser so it can be applied idempotently to user-modified configs. It:

- Prepends `const { hairlineWidth } = require("nativewind/theme");` if
  missing.
- Injects `darkMode: "class"` after `module.exports = {`.
- Detects whether the `theme.extend` block already contains the semantic
  color mapping (`hsl(var(--background))`), the `borderRadius` mapping
  (`calc(var(--radius) − 2px)`), or the `accordion-down` keyframes, and
  inserts only what's missing.
- Inserts `require("tailwindcss-animate")` into the plugins array,
  handling empty, non-empty, and missing `plugins` cases.

Patches are logged with a message like `✔ Updated tailwind.config.js
(darkMode, theme.extend, tailwindcss-animate plugin)`.

---

## 13. Templates — file layout after init

Common (both engines):

```
src/
  app/
    _layout.tsx
    index.tsx
    explore.tsx
  components/
    animated-icon.tsx
    app-tabs.tsx
    app-tabs.web.tsx
    external-link.tsx
    hint-row.tsx
    themed-text.tsx
    themed-view.tsx
    web-badge.tsx
    ui/
      button.tsx
      collapsible.tsx
      text.tsx
      …
  constants/
    theme.ts
  hooks/
    use-color-scheme.ts
    use-color-scheme.web.ts
    use-theme.ts
  lib/
    utils.ts
  global.css
```

Root:

```
package.json
app.json / expo config
babel.config.js       (nativewind only, patched by init)
metro.config.js       (patched by init)
tailwind.config.js    (nativewind only, patched by init)
tsconfig.json
lvcn.json             (written by init)
```

---

## 14. Verification path

To verify all fixes end-to-end after running `lvcn init`:

1. **Style/base color:** Open `src/global.css`; confirm the `@layer base`
   (nativewind) or `@theme inline` (uniwind) block reflects the picked
   base color's HSL/OKLCH values in both `:root` and `.dark`. Confirm
   `--radius` matches the style's config.
2. **Dark mode:** Toggle system dark mode; confirm background flips.
   Confirm `.dark` (not `.dark:root`) is the selector in nativewind.
3. **`Colors` sync:** Open `src/constants/theme.ts`; confirm the hex
   values match `hslToHex` output for the chosen base color.
4. **Home screen:** `src/app/index.tsx` uses `ThemedView` / `ThemedText`
   / `useTheme` — no raw hex colors, no inline styles for color.
5. **Explore tab:** Chevron in `<Collapsible>` points right when closed,
   down when open. Title text takes remaining row width. Tapping the
   Expo-documentation Pressable inside `ExternalLink asChild` opens the
   in-app browser.
6. **Text alignment:** On Android, text sits vertically centered inside
   rows and buttons — no extra top gap.
7. **Bottom tabs:** Colors follow the theme; dark-mode swap works
   without an `'unspecified'` fallback.
8. **`onPress` composition:** Wrap `<ExternalLink asChild>` around a
   `<Button onPress={…}>` — both the caller's handler and the browser
   opener fire.

---

## 15. Known trade-offs / open notes

- **`configureTailwindConfig` is regex-based**, not AST-based. Very
  custom user configs (e.g. `module.exports = defineConfig({...})` from
  a helper) may not match its patterns. When it can't find an
  injection point, it errs on the side of leaving the file alone.
- **`configureRootImport` scans a fixed list** of possible layout
  paths (`src/app/_layout.tsx`, `app/_layout.tsx`, `App.tsx`, …). If a
  project uses a nonstandard entry, the CSS import must be added by
  hand.
- **`hslToHex` loses precision** compared to the source HSL values (it's
  an 8-bit round-trip). Fine for the RN `Colors` block, which is used
  for status-bar tint / native chrome, but don't feed it back into the
  Tailwind config.
- **Uniwind + `@theme inline`** ties us to a Tailwind v4 pipeline. If a
  user is on Tailwind v3, they must pick the nativewind engine.
- **`asChild` + `<Button>`** works because Slot forwards `href`/`onPress`
  through Button's prop-spread onto the inner Pressable. If Button is
  ever rewritten to wrap Pressable in an additional layer that doesn't
  transparently spread props, that assumption breaks — worth an
  integration test.

---

## 16. Files touched in this cycle

Templates (nativewind):

- `src/app/_layout.tsx`
- `src/app/index.tsx`
- `src/components/app-tabs.tsx`
- `src/components/app-tabs.web.tsx`
- `src/components/external-link.tsx`
- `src/components/themed-text.tsx`
- `src/components/web-badge.tsx`
- `src/components/ui/collapsible.tsx`
- `src/constants/theme.ts`
- `src/hooks/use-color-scheme.ts`
- `src/hooks/use-color-scheme.web.ts`
- `src/hooks/use-theme.ts`
- `tailwind.config.js`

Templates (uniwind):

- `src/app/_layout.tsx`
- `src/components/app-tabs.tsx`
- `src/components/app-tabs.web.tsx`
- `src/components/external-link.tsx`
- `src/components/themed-text.tsx`
- `src/components/web-badge.tsx`
- `src/components/ui/collapsible.tsx`
- `src/constants/theme.ts`
- `src/hooks/use-theme.ts`
- `package.json`

CLI:

- `packages/lovda/package.json`
- `packages/lovda/scripts/build-registry.cjs`
- `packages/lovda/src/commands/init.ts`  (main file — style/base-color
  system, CSS emission, theme.ts sync, tailwind/metro/babel patchers)
- `packages/lovda/src/commands/init.test.ts`

Registry fixtures (mira, nova, sera, vega × nativewind and uniwind):
regenerated per the new style token pipeline.

Docs app:

- `apps/docs/*` — migrated from a plain Next.js starter to a Fumadocs
  based site (new content, source config, layouts). Legacy pages,
  fonts, and assets removed.

Removed:

- `packages/lovda/templates/styles/style-*.css` (8 files) — see §6.

---

## 17. Summary

Every task in the tracker (#1–#7) is closed. The `lvcn init` command
now produces a working Expo SDK 57 project that:

- Boots with the user's chosen style + base color, in both light and
  dark modes, with a consistent HSL (nativewind) or OKLCH (uniwind) CSS
  token system.
- Keeps the RN `Colors` constant in sync with the CSS tokens for use
  outside Tailwind.
- Ships a home screen and explore tab wired to those tokens end-to-end.
- Renders text with correct vertical alignment on Android and correct
  line-height on links.
- Composes user `onPress` handlers on `<ExternalLink>` with the in-app
  browser opener, so both `Pressable` and `Button` children work
  cleanly under `asChild`.

The 10-style × 9-base-color × 2-engine matrix is fully covered by a
single source of truth (`STYLE_CONFIGS` + `THEME_COLORS` in `init.ts`),
so future style additions only require appending to those tables.

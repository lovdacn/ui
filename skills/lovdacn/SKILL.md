---
name: lovdacn
description: Manages lovdacn (lvcn) components and projects for Expo & React Native — adding, initializing, fixing, debugging, styling, theming, and composing UI with NativeWind or Uniwind. Provides project context, component APIs, and usage examples. Applies when working with lovdacn/lvcn, Expo/React Native UI components, an lvcn.json file, style engines (nativewind/uniwind), presets, or preset codes. Also triggers for "lovdacn init", "lvcn add", or "apply a preset".
user-invocable: false
allowed-tools: Bash(npx lovdacn@latest *), Bash(npx lvcn@latest *), Bash(pnpm dlx lovdacn@latest *), Bash(pnpm dlx lvcn@latest *), Bash(bunx --bun lovdacn@latest *), Bash(yarn dlx lovdacn@latest *)
---

# lovdacn (lvcn)

A CLI and registry for building premium, customizable UI components for **Expo & React Native**, styled with **NativeWind** or **Uniwind**. Like shadcn/ui, components are copied as source into the user's project — they own and can customize the code.

> **IMPORTANT:** Run all CLI commands using the project's package runner: `npx lovdacn@latest`, `pnpm dlx lovdacn@latest`, `bunx --bun lovdacn@latest`, or `yarn dlx lovdacn@latest` — based on the project's package manager (detected from its lockfile). `lvcn` is a drop-in shorthand alias (`npx lvcn@latest add button`). Examples below use `npx lovdacn@latest`; substitute the correct runner.

> **These are React Native components, not web.** They render to native views, not the DOM. The single most important rule: **all text must be wrapped in the `<Text>` component** — you cannot put a bare string inside `<Button>`, `<Badge>`, or a `<View>`. See [rules/native.md](./rules/native.md).

## Current Project Context

lovdacn has **no `info` command**. Read the project's `lvcn.json` file directly to get the project configuration, then list the UI directory (`aliases.ui`, default `@/components/ui`) to see which components are installed.

```bash
# Read the config (project context lives here).
cat lvcn.json

# See the current theme preset and its shareable code (read-only).
npx lovdacn@latest present
npx lovdacn@latest present --json
```

The `lvcn.json` fields you care about: `style`, `styleEngine`, `tsx`, `tailwind.{config,css,baseColor}`, `aliases.{components,utils,ui}`, `components`, and the preset fields (`baseColor`, `theme`, `chartColor`, `font`, `iconLibrary`, `radius`). See [config.md](./config.md) for the full schema.

## Principles

1. **Use existing components first.** Check the 33 registry components (below) and the installed `components` list before writing custom UI.
2. **Compose, don't reinvent.** Settings screen = `Card` + `Label` + form controls + `Switch`. Menu = `DropdownMenu` + items. Confirmation = `AlertDialog`.
3. **Use built-in variants before custom styles.** `variant="outline"`, `size="sm"`, etc.
4. **Use semantic color tokens.** `bg-primary`, `text-muted-foreground` — never raw values like `bg-blue-500`.
5. **Think native.** `View`/`Text`/`Pressable`/`TextInput`, `flex-row` for horizontal layout, `gap-*` for spacing, `onPress` not `onClick`.

## Critical Rules

These rules are **always enforced**. Each links to a file with Incorrect/Correct code pairs.

### React Native Fundamentals → [native.md](./rules/native.md)

- **All text goes inside `<Text>`.** `<Button><Text>Save</Text></Button>`, never `<Button>Save</Button>`. Applies inside `Badge`, `Card`, `View`, and everywhere.
- **Use RN primitives, not DOM elements.** `View` (not `div`), `Text` (not `p`/`span`), `Pressable` (not `button`), `TextInput` (not `input`), `Image` (not `img`).
- **Layout is flexbox; default direction is `column`.** Use `flex-row` for horizontal. Use `gap-*` for spacing — there is no `space-x-*`/`space-y-*` in React Native.
- **Overlays require portal setup.** `Dialog`, `AlertDialog`, `Popover`, `Tooltip`, `DropdownMenu`, `ContextMenu`, `HoverCard`, `Select`, `Menubar` need a mounted `<PortalHost />` and a `GestureHandlerRootView` root. The CLI wires this up on `add`; verify it exists.
- **Handlers are `onPress`, not `onClick`.**

### Styling & Theming → [styling.md](./rules/styling.md)

- **`className` for layout, not for overriding component colors/typography.** Use semantic tokens or variants instead.
- **Use semantic tokens.** `bg-primary`, `text-muted-foreground`, `bg-card`, `border-border` — never `bg-blue-500` or `text-gray-600`.
- **No manual `dark:` color overrides.** Semantic tokens already resolve per color scheme.
- **Use `size-*` when width and height match.** `size-10`, not `w-10 h-10`.
- **Use `cn()` from the project's utils alias** for conditional classes.
- **Know the engine.** `nativewind` uses HSL variables + `tailwind.config.js`; `uniwind` uses OKLCH via `@theme` in CSS. Read `styleEngine` from `lvcn.json`.

### Icons → [icons.md](./rules/icons.md)

- **Use the `Icon` component with the `as` prop.** `<Icon as={CheckIcon} />` — there is no `data-icon` attribute (that's web shadcn).
- **Import icons from the project's `iconLibrary`.** Default is `lucide-react-native`. Never assume a web package like `lucide-react`.
- **Icons inherit color from `TextClassContext`.** Inside `Button`, `Badge`, etc. they pick up the text color automatically. Size via the `size` prop (default 14) or a `size-*` class.

### Forms & Inputs → [forms.md](./rules/forms.md)

- **There is no `Field`/`FieldGroup`/`InputGroup`.** Lay out forms with `View` + `gap-*`, pairing a `Label` with each control.
- **Option sets (2–5 choices) use `ToggleGroup` + `ToggleGroupItem`.** Pass `isFirst`/`isLast` for edge rounding. Don't loop `Button` with manual active state.
- **Validation uses `aria-invalid` on the control.** Controls (`Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroupItem`, `Switch`) style themselves from it.

### Component Composition → [composition.md](./rules/composition.md)

- **Items live inside their content/group container.** `SelectItem` → `SelectContent`, `DropdownMenuItem` → `DropdownMenuContent`, etc.
- **`Dialog` and `AlertDialog` need a `Title`.** `DialogTitle`/`AlertDialogTitle` for accessibility. Use `className="sr-only"` if visually hidden.
- **Use full `Card` composition.** `CardHeader`/`CardTitle`/`CardDescription`/`CardContent`/`CardFooter`.
- **`Alert` takes an `icon` prop.** `<Alert icon={TerminalIcon}>` with `AlertTitle`/`AlertDescription`.
- **`Avatar` always needs `AvatarFallback`.**
- **`TabsTrigger` must be inside `TabsList`.**
- **Custom triggers use `asChild`** (via `@rn-primitives/slot`).

## Key Patterns

The most common patterns that make lovdacn code correct. For edge cases, see the linked rule files.

```tsx
// Text is ALWAYS wrapped — this is the #1 React Native rule.
<Button>
  <Text>Save</Text>
</Button>
// wrong: <Button>Save</Button>  → crashes ("Text strings must be rendered within a <Text>")

// Icons: the Icon component with `as`, imported from the project's iconLibrary.
import { Search } from "lucide-react-native"
import { Icon } from "@/components/ui/icon"
<Button>
  <Icon as={Search} />
  <Text>Search</Text>
</Button>

// Layout: View + flex-row + gap. React Native defaults to a column.
<View className="flex-row items-center gap-2">   // correct
<View className="space-x-2">                      // wrong (no space-* in RN)

// Equal dimensions: size-*, not w-* h-*.
<Avatar className="size-10">   // correct

// Semantic colors, never raw values.
<View className="bg-card border-border">
  <Text className="text-muted-foreground">Subtitle</Text>
</View>

// Status via Badge variants, not raw colors.
<Badge variant="secondary"><Text>+20.1%</Text></Badge>   // correct
<Text className="text-emerald-600">+20.1%</Text>          // wrong

// Form field: View + Label + control (no FieldGroup/Field in lovdacn).
<View className="gap-2">
  <Label nativeID="email"><Text>Email</Text></Label>
  <Input aria-labelledby="email" />
</View>
```

## Component Selection

Only these components exist in the registry. Do **not** reference web-shadcn components that are absent (no `Sheet`, `Drawer`, `Command`, `Sidebar`, `Chart`, `Table`, `Sonner`/toast, `Field`, `InputGroup`, `Empty`, `Spinner`, `Slider`, `Breadcrumb`, `Pagination`, `Combobox`, `InputOTP`).

| Need                        | Use                                                                       |
| --------------------------- | ------------------------------------------------------------------------- |
| Button / action             | `Button` (variants: default, destructive, outline, secondary, ghost, link) |
| Text / typography           | `Text` (variants: h1–h4, p, lead, large, small, muted, blockquote, code)  |
| Form inputs                 | `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`, `Switch`         |
| Toggle 2–5 options          | `ToggleGroup` + `ToggleGroupItem` (or single `Toggle`)                    |
| Labels                      | `Label`                                                                    |
| Data display                | `Card`, `Badge`, `Avatar`, `AspectRatio`                                  |
| Navigation                  | `Tabs`                                                                     |
| Overlays                    | `Dialog` (modal), `AlertDialog` (confirm), `Popover`, `HoverCard`         |
| Menus                       | `DropdownMenu`, `ContextMenu`, `Menubar`                                  |
| Tooltips                    | `Tooltip`                                                                  |
| Feedback / status           | `Alert`, `Progress`, `Skeleton`                                           |
| Layout / structure          | `Card`, `Separator`, `Accordion`, `Collapsible`                          |
| Icons                       | `Icon` (with `as={...}`)                                                  |
| Native-only animation       | `NativeOnlyAnimatedView`                                                   |

Full list (33): `accordion`, `alert`, `alert-dialog`, `aspect-ratio`, `avatar`, `badge`, `button`, `card`, `checkbox`, `collapsible`, `context-menu`, `dialog`, `dropdown-menu`, `hover-card`, `icon`, `input`, `label`, `menubar`, `native-only-animated-view`, `popover`, `progress`, `radio-group`, `select`, `separator`, `skeleton`, `switch`, `tabs`, `text`, `textarea`, `toggle`, `toggle-group`, `tooltip`, `utils`.

## Key Fields (from `lvcn.json`)

- **`aliases`** → use the actual alias prefixes for imports (`@/components/ui`, `@/lib/utils`); never hardcode. The CLI rewrites registry imports to these.
- **`styleEngine`** → `nativewind` (HSL vars, `tailwind.config.js`) vs `uniwind` (OKLCH, `@theme` in CSS). Affects where and how theme tokens are defined.
- **`style`** → the visual style pack (`new-york`, `nova`, `rhea`, etc.). **Set at init and cannot change** without re-adding components; component source differs per style.
- **`tailwind.css`** → the global CSS file where CSS variables live. Always edit this file; never create a new one.
- **`tailwind.baseColor`** / **`baseColor`** → the neutral palette (`zinc`, `neutral`, `olive`, …).
- **`iconLibrary`** → the icon package: `lucide` → `lucide-react-native`, `phosphor` → `phosphor-react-native`, `tabler` → `@tabler/icons-react-native`, `expo` → `@expo/vector-icons`, `heroicons` → `react-native-heroicons`.
- **`tsx`** → TypeScript (`.tsx`) vs JavaScript (`.jsx`).
- **`components`** → the components already installed. Don't re-add these; don't import ones not present.

See [config.md](./config.md) for the full field reference.

## Workflow

1. **Get project context** — read `lvcn.json`. If it doesn't exist, the project isn't initialized; run `init` first.
2. **Check installed components first** — before `add`, check the `components` array in `lvcn.json` and list the `aliases.ui` directory. Don't import components that aren't installed; don't re-add installed ones.
3. **Add components** — `npx lovdacn@latest add <name...>`. Run with no args for an interactive multi-select. The CLI resolves registry dependencies, installs npm deps (via `expo install` on Expo projects), wires up portals for overlays, and rewrites import aliases.
4. **Review added files** — after `add`, **read the added files and verify they are correct**: text wrapped in `<Text>`, icons imported from the project's `iconLibrary`, correct composition, semantic tokens. Fix issues before moving on.
5. **Get docs/examples** — fetch component docs from `https://lovdacn.vercel.app/docs/components/<name>` when you need the exact API or usage. See [Component Docs](#component-docs) below.
6. **Theme changes** — use `apply` to change the preset; use `present` to inspect the current one. See [customization.md](./customization.md).

## Component Docs

There is no `docs` CLI command. Fetch documentation pages from the docs site:

```
https://lovdacn.vercel.app/docs/components/<component>   # e.g. .../components/button
https://lovdacn.vercel.app/docs/cli
https://lovdacn.vercel.app/docs/lvcn-json
https://lovdacn.vercel.app/docs/theming
https://lovdacn.vercel.app/docs/dark-mode
```

**When creating, fixing, debugging, or using a component you're unsure about, fetch its docs page first** rather than guessing the API. You can also read the installed source directly in `aliases.ui`.

## Quick Reference

```bash
# Initialize or create a project.
npx lovdacn@latest init
npx lovdacn@latest init -n my-app                 # create a new project by name
npx lovdacn@latest init --engine uniwind          # choose style engine (nativewind | uniwind)
npx lovdacn@latest init --preset nova             # named preset, preset code, or style name

# Add components (resolves deps, wires portals, rewrites aliases).
npx lovdacn@latest add button
npx lovdacn@latest add input select checkbox label text
npx lovdacn@latest add                            # interactive multi-select
npx lovdacn@latest add dialog --overwrite         # overwrite existing files

# Apply a theme preset to an existing project.
npx lovdacn@latest apply nova                     # named preset or style name
npx lovdacn@latest apply a2r6bw                   # preset code from the web builder
npx lovdacn@latest apply nova --only theme,font   # only parts: theme | colors | font | radius

# Inspect the current preset (read-only).
npx lovdacn@latest present
npx lovdacn@latest present --json

# Point at a different registry (dev/self-hosted).
LOVDA_REGISTRY_URL=https://your-registry/r npx lovdacn@latest add button
```

**Named presets:** `new-york`, `default`, `luma`, `lyra`, `maia`, `mira`, `nova`, `rhea`, `sera`, `vega`
**Style engines:** `nativewind`, `uniwind`
**There is no `search`, `docs`, `info`, `view`, `build`, or `mcp` command.** The four commands are `init`, `add`, `apply`, `present`.

## Detailed References

- [rules/native.md](./rules/native.md) — Text wrapping, RN primitives, flex-row/gap, onPress, portals, Platform
- [rules/styling.md](./rules/styling.md) — Semantic tokens, variants, className, size, dark mode, cn(), engine differences
- [rules/icons.md](./rules/icons.md) — `Icon` + `as`, icon libraries, sizing, color inheritance, Alert/Icon props
- [rules/forms.md](./rules/forms.md) — Label + control layout, validation, Checkbox/Switch/RadioGroup/Select, ToggleGroup
- [rules/composition.md](./rules/composition.md) — Groups, overlays, Card, Tabs, Avatar, Alert, Accordion, Separator, Skeleton, Badge
- [cli.md](./cli.md) — Commands (init, add, apply, present), flags, presets, registry override
- [config.md](./config.md) — Full `lvcn.json` schema and how the CLI uses each field
- [registry.md](./registry.md) — Registry resolution, style/engine paths, portal deps, alias rewriting
- [customization.md](./customization.md) — Theming, CSS variables (HSL vs OKLCH), presets, dark mode

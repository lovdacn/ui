# Registry & Component Resolution

How `lovdacn add` turns a component name into files in the project. Use this when debugging installs, self-hosting a registry, or reasoning about dependencies.

## Mental Model

lovdacn is a **consumer** of a hosted registry — it does not author registries the way web shadcn does (there is no `build` command). Each component is a JSON item that bundles source files, npm dependencies, and registry dependencies. The CLI fetches items, resolves the dependency graph, rewrites imports, installs npm deps, and writes the source into the project.

## Registry URL

Default: `https://lovdacn.vercel.app/r`. Override with the `LOVDA_REGISTRY_URL` environment variable — a URL, or a local folder for development:

```bash
LOVDA_REGISTRY_URL=https://your-registry/r npx lovdacn@latest add button
LOVDA_REGISTRY_URL=/abs/path/to/registry/r npx lovdacn@latest add button   # local dir or file://
```

When run from inside the lovdacn monorepo, the CLI also auto-detects a locally served registry (`apps/v2/public/r`) if `LOVDA_REGISTRY_URL` is unset.

## Item Resolution Path

Each item is fetched from a path built from the project's engine and style:

```
<registry>/styles/<styleEngine>/<style>/<name>.json
```

For example, `add button` in a `nativewind` + `nova` project fetches:

```
https://lovdacn.vercel.app/r/styles/nativewind/nova/button.json
```

For a local/`file://` registry the same relative path is read from disk. If the item can't be found for the current `style`/`styleEngine`, the CLI errors — the component may not exist for that combination.

## Dependency Resolution

Each registry item may declare:

- **`dependencies`** — npm packages (e.g. `class-variance-authority`, `@rn-primitives/select`, `lucide-react-native`).
- **`registryDependencies`** — other lovdacn components (e.g. `button` depends on `text` and `utils`; `select` depends on `icon`, `native-only-animated-view`, `text`, `utils`).
- **`files`** — the source files to write.

The CLI walks the `registryDependencies` graph breadth-first, de-duplicating, so adding one component pulls in everything it needs. All collected npm dependencies are installed in a single command.

### npm install strategy

- **Expo projects** (an `expo` dependency in `package.json`): the CLI installs via `expo install` (`pnpm exec expo install`, `yarn expo install`, `bunx --bun expo install`, or `npx expo install`). This pins native modules to the versions bundled with the project's Expo SDK — important for `react-native-gesture-handler`, `react-native-svg`, `react-native-reanimated`, etc. Installing them unpinned can pull an incompatible major that crashes in Expo Go.
- **Non-Expo projects**: a plain `<pm> install <deps>` with the detected package manager.

The package manager is detected from the lockfile (`bun.lock(b)` → bun, `pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, `package-lock.json` → npm), overridable with `-p/--package-manager`.

## Portal Components

These overlay components render through a portal and need extra setup:

```
alert-dialog, context-menu, dialog, dropdown-menu,
hover-card, popover, select, tooltip
```

When any of them is added, the CLI:

1. Adds `@rn-primitives/portal` and `react-native-gesture-handler` to the install set.
2. Patches the app root (`app/_layout.tsx`, `src/app/_layout.tsx`, `App.tsx`, or similar) to:
   - Mount `<PortalHost />` (imported from `@rn-primitives/portal`) — so portal content has somewhere to render.
   - Wrap the app in `<GestureHandlerRootView style={{ flex: 1 }}>` — overlay triggers rely on gesture-handler; without it, presses silently fail on native and the overlay never opens.

A correctly wired root looks like:

```tsx
import { PortalHost } from "@rn-primitives/portal"
import { GestureHandlerRootView } from "react-native-gesture-handler"

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={...}>
        {/* app / router */}
        <PortalHost />
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}
```

If overlays don't open on native, **verify this setup exists** — the auto-patch only fires when the CLI can find and recognize the root file. Each overlay's `Content` also accepts a `portalHost` prop to target a named host.

## Where Files Land + Alias Rewriting

The CLI maps each item file to a destination and rewrites imports to the project's aliases (from `lvcn.json`):

| Registry file path         | Destination                              |
| -------------------------- | ---------------------------------------- |
| `components/ui/<name>`     | `aliases.ui` folder (default `@/components/ui`) |
| `components/<name>`        | `aliases.components` folder              |
| anything with `utils`      | `aliases.utils` file (`.ts`/`.js` per `tsx`) |
| other paths                | written relative to the project root     |

Import rewrites applied to file contents:

- `@/registry/(nativewind|uniwind)/...` → `@/...`
- `~/components/ui/...` → the `ui` alias
- `~/components/...` → the `components` alias
- `~/lib/utils` / `@/lib/utils` → the `utils` alias
- `@/components/ui/...` → the `ui` alias
- `@/components/...` → the `components` alias

So generated source always imports through the project's real aliases. After adding third-party or hand-edited items, double-check imports still resolve to these aliases.

## After Adding

`add` records resolved components in `lvcn.json` `components`. Always **read the written files** and verify: text wrapped in `<Text>`, icons imported from the project's `iconLibrary`, correct composition, semantic tokens, and (for overlays) that portal setup is present.

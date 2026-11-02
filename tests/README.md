# Tests

| What | Where | Command (from the repo root) | Needs |
|---|---|---|---|
| CLI unit tests | `packages/lovdacn/**/*.test.ts` | `pnpm --filter lovdacn test` | `pnpm install` |
| Component smoke tests | `apps/preview/tests/components` | `pnpm --filter @lvcn/preview test` | `pnpm install` |
| Motion engine tests | `apps/preview/tests/motion` | `pnpm --filter @lvcn/preview test` | `pnpm install` |
| Preview protocol tests | `apps/preview/src/lib/__tests__`, `apps/v2/lib/__tests__` | `pnpm --filter @lvcn/preview test`, `pnpm --filter v2 test` | Node only |
| Customizer contract tests | `apps/v2/app/create/__tests__` | `pnpm --filter v2 test` | Node only |
| Install check for test apps | `tests/check-test-apps.mjs` | `pnpm test:apps` | `pnpm install`, CLI build, network |

`pnpm test` runs every package's `test` script through Turborepo. CI runs the same commands
(`.github/workflows/test.yml`) on every pull request.

## Component smoke tests

`apps/preview/tests/components/components-smoke.test.mjs` renders every component in
`apps/preview/src/components/ui` to static markup and checks that it renders without throwing,
shows its content, and applies its key state classes (checked, selected, pressed, disabled...).
It reuses the motion harness (`apps/preview/tests/motion/harness`): Node's built-in test
runner, Babel to load `.tsx`, `react-dom/server` for rendering, and small stubs for
`react-native`, Reanimated, Lucide and other native-only packages. No extra dependencies.

What it does not cover:

- Effects and interaction (presses, typing, timers), because only the render phase runs.
- Open overlay content (dialog, popover, menus, select, tooltip): portals do not render in
  static markup, so those tests check the trigger and the closed state. Dialog and sheet
  headers, titles and footers are tested inside an open root without the portal.
- Native rendering. Components render with `Platform.OS === 'web'` unless a test switches it.

A coverage test fails when a new file is added to `components/ui` without a smoke test. Add a
`component('<name>', ...)` block, or an entry with a reason in `SKIPPED`.

If a component starts importing a new Lucide icon or a new `react-native` / Reanimated export,
add it to the matching stub in `apps/preview/tests/motion/harness/stubs`.

## Install check for test apps

`tests/apps` holds one Expo app per SDK and style engine (`nativewind-54`, `nativewind-57`,
`uniwind-54`, `uniwind-57`, `beta-matrix`). The check copies an app to a temp folder, installs
it with npm, adds every component with the local CLI and local registry, then runs
`tsc --noEmit` and `expo export --platform web`. The committed apps are not modified.

```bash
pnpm install
pnpm --filter lovdacn build
node tests/check-test-apps.mjs                  # all apps
node tests/check-test-apps.mjs nativewind-54    # one app
node tests/check-test-apps.mjs --skip-export    # type-check only
node tests/check-test-apps.mjs --keep           # keep temp copies for debugging
```

Apps with `beta` in the name install from the beta registry (`apps/v2/public/r/beta`) and
include beta components such as `motion`. The others use the stable registry and skip them.

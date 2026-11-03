# Motion engine tests (Agent 1)

Characterization and regression tests for the shared motion engine, the motion-aware primitive
seam and the semantic adapters.

## Running

From the repository root (`lvcn/`):

```powershell
node --import ./apps/preview/tests/motion/harness/register.mjs --test "apps/preview/tests/motion/*.test.mjs"
```

There is no `package.json` script for this: package manifests and shared test configuration are
coordinator-owned, and Agent 1 is prohibited from installing dependencies. The command above uses
only what is already installed.

## Why a custom harness

`apps/preview` has no test runner (no jest-expo, no @testing-library/react-native, no vitest), and
adding one would require new dependencies. The harness therefore uses:

- Node's built-in `node:test` runner and `node:module` `registerHooks`,
- the `@babel/core` + `@babel/preset-typescript` + `@babel/plugin-transform-react-jsx` copies that
  are already present in the workspace, to transpile `.tsx` sources (and the JSX that
  `@rn-primitives/*` ships in its ESM build),
- `react-dom/server`'s `renderToStaticMarkup` (react-dom is already a preview dependency) to render
  the **render phase only** — no effects. That is the closest available approximation of static web
  output and of the first client paint, which is exactly what the visibility invariants are about,
- local `react-native` / `react-native-reanimated` stubs. The Reanimated stub evaluates worklets
  synchronously and resolves every transition helper to its final value, so whatever the engine
  emits on its first evaluation is what the assertions see.

## Files

| File | Covers |
|---|---|
| `motion-visibility.test.mjs` | static/server visibility, hydration, post-load entrances, native entrances, reduced motion, color/radius/transform ownership, no-motion fast path |
| `motion-routing.test.mjs` | canonical host channels, state precedence, one-sided endpoint rejection, dormant `exit`/`repeat`/`reverse` warnings, motion detection |
| `motion-adapters.test.mjs` | Button default press host, Skeleton pulse ownership, RadioGroup selected state, Collapsible controlled/uncontrolled state |
| `motion-aschild.test.mjs` | `asChild` motion hosts keep their children (uses the real `@rn-primitives/*` packages) |

## Known harness limits

- No effects and no interaction events: press/focus/hover behaviour is verified through the pure
  `resolveMotionTarget` / `normalize` contract instead of simulated gestures.
- `Tabs` / `ToggleGroup` selection derivation is only exercised through the real primitives in the
  `asChild` tests; a full interaction test needs a renderer with effects.
- Native (iOS/Android) behaviour is approximated by `Platform.OS`; device smoke tests are still
  required by the plan's acceptance criteria.

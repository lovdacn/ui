# Shared `animate` + `activeAnimate` Implementation Plan

> **Status:** New authoritative animation plan for lovdaCN.  
> **Supersedes:** The optional/selective recommendation that previously lived in this file.  
> **Companion:** [`ANIMATION_IMPLEMENTATION_PLAN.md`](./ANIMATION_IMPLEMENTATION_PLAN.md) is historical design input only where it conflicts with this document.

## Decision

`Button` **and every current lovdaCN UI component module** will support the same public animation API:

```ts
animate?: AnimateProp;
activeAnimate?: ActiveAnimateProp;
```

This is no longer a “`Motion` only” or “selected components later” feature.

- Every public export that renders a native or web visual host receives both props.
- Namespace roots and providers that render no host (`Dialog`, `Select`, `ToastProvider`, and similar context-only exports) cannot animate directly; their visual exports (`DialogTrigger`, `DialogContent`, `SelectTrigger`, `SelectContent`, toast viewport/item, and so on) receive both props. This is a host limitation, **not a module exemption**.
- `Motion` remains available for user-owned content, but users do not need to wrap a lovdaCN component just to animate it.
- `motion` becomes a shared registry dependency. `lovdacn add button` must copy `motion` and install its runtime dependencies automatically.
- Object configuration is the canonical v1 API. Preset names ship with v1; utility strings compile to the same object model in a later phase.
- Existing specialized motion—accordion height, switch thumb position, progress fill, carousel/bottom-sheet gestures, spinner rotation, skeleton pulse, and toast gestures—stays specialized and is connected to the shared contract rather than replaced by a generic transform hook.

## Goals

1. Give `Button`, all other current registry modules, and future visual components a consistent `animate` and `activeAnimate` API.
2. Make active-state behavior semantic: press for buttons, checked for checkboxes/switches, selected for tabs/toggles, focused for inputs, expanded for accordions, open for overlays, and so on.
3. Preserve refs, event handlers, accessibility, `disabled` behavior, controlled/uncontrolled primitive state, portals, and `asChild` composition.
4. Keep animation work on the UI thread on native and provide equivalent behavior on web.
5. Respect system reduced-motion preferences by default.
6. Ship through the existing copied-source registry and CLI dependency graph, not as runtime code inside the CLI package.

## Non-goals

- Do not build a second general-purpose Moti or Framer Motion implementation.
- Do not parse arbitrary Tailwind classes or animate every React Native style property.
- Do not make generic motion responsible for measured height, drag physics, virtualized list layout, or gesture recognition.
- Do not add `react-native-gesture-handler` to the core motion item merely for press feedback. Components that already need gestures keep their own dependency.
- Do not keep generated registry JSON as the long-term source of truth. The current `default/*.json` fallback is a legacy input only until Phase 0 creates the canonical in-repo source tree.

---

## Public API contract

### Shared props

Every visual component prop type intersects this interface and removes these keys before forwarding props to a native host:

```ts
export interface SharedAnimationProps {
  /** Idle, mount, exit, or continuous animation. `false` disables it. */
  animate?: AnimateProp;

  /** Motion applied while the component's semantic active state is true. */
  activeAnimate?: ActiveAnimateProp;

  /** Explicit active-state override for components without intrinsic state. */
  motionActive?: boolean;

  /** Defaults to `system`. */
  reduceMotion?: "system" | "always" | "never";
}
```

`motionActive` is required in the shared interface because static components such as `Card`, `Text`, and `Separator` have no honest way to infer “active.” Stateful components infer it automatically, so normal `Button`, `Checkbox`, `Switch`, `TabsTrigger`, and overlay usage does not need `motionActive`.

### Canonical object types

The implementation may refine React Native/Reanimated utility types, but the public shape must remain equivalent to this contract:

```ts
export type MotionTarget = {
  opacity?: number;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  translateX?: number;
  translateY?: number;
  rotate?: `${number}deg`;
  rotateX?: `${number}deg`;
  rotateY?: `${number}deg`;
  backgroundColor?: string;
  borderColor?: string;
  color?: string;
  borderRadius?: number;
};

export type MotionTransition =
  | {
      type: "spring";
      damping?: number;
      stiffness?: number;
      mass?: number;
      overshootClamping?: boolean;
      delay?: number;
    }
  | {
      type: "timing";
      duration?: number;
      easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out";
      delay?: number;
    };

export type MotionPresetName =
  | "fade-in"
  | "fade-out"
  | "slide-up"
  | "slide-down"
  | "slide-left"
  | "slide-right"
  | "zoom-in"
  | "zoom-out"
  | "pop"
  | "press"
  | "spin"
  | "pulse"
  | "bounce"
  | "shake"
  | "wiggle";

export interface AnimateConfig {
  initial?: MotionTarget;
  to?: MotionTarget;
  exit?: MotionTarget;
  transition?: MotionTransition;
  repeat?: number | "infinite";
  reverse?: boolean;
}

export type ActiveState =
  | "press"
  | "hover"
  | "focus"
  | "checked"
  | "selected"
  | "current"
  | "open"
  | "expanded"
  | "visible"
  | "loading"
  | "dragging";

export interface ActiveStateConfig {
  to: MotionTarget;
  transition?: MotionTransition;
}

export interface ActiveAnimateConfig {
  /** Shorthand target for the component's canonical active state. */
  to?: MotionTarget;
  transition?: MotionTransition;

  /** Optional per-state targets for components with more than one state. */
  states?: Partial<Record<ActiveState, ActiveStateConfig>>;
}

export type AnimateProp = false | MotionPresetName | AnimateConfig;
export type ActiveAnimateProp =
  | false
  | MotionPresetName
  | MotionTarget
  | ActiveAnimateConfig;
```

### Exact semantics

| Value       | `animate`                                              | `activeAnimate`                                                  |
| ----------- | ------------------------------------------------------ | ---------------------------------------------------------------- |
| `undefined` | Use the component default, if it has one               | Use the component default, if it has one                         |
| `false`     | Disable idle/mount/exit/loop motion                    | Disable active-state motion only                                 |
| preset      | Resolve a built-in preset                              | Resolve a built-in active preset                                 |
| object      | Replace the component default with the supplied config | Replace the component default with the supplied target/state map |

Rules:

1. `animate` defines the idle/lifecycle layer. `initial` is the first rendered state, `to` is the resting state, and `exit` is used when the host supports unmount animation.
2. A simple `activeAnimate` target applies to the component’s canonical active state listed in the component matrix below.
3. A `states` map can independently define press, hover, focus, selected, open, and other supported states.
4. Explicit `motionActive` overrides the canonical active boolean. It does not overwrite a supplied multi-state map; it controls the simple `to` target.
5. Active targets overlay the idle target and return to the idle target when inactive.
6. State precedence is: `disabled` → `dragging` → `press` → semantic state (`checked`, `selected`, `open`, `expanded`, `current`, `loading`) → `focus` → `hover` → idle. “Disabled” suppresses interaction motion and returns to idle; it does not stop a deliberately running loader unless that loader is also disabled.
7. User props always win over component defaults. `activeAnimate={false}` must not disable `animate`, and `animate={false}` must not silently disable an explicitly supplied `activeAnimate`.
8. Unknown or unsupported style keys produce a development warning and are ignored in production; they are never forwarded to a native view.

### Defaults are useful but restrained

- Static layout/content components expose both props but do **not** animate by default.
- Interactive components get subtle default active feedback, such as Button press scale.
- Stateful indicators retain their meaningful existing defaults, such as switch thumb travel and checkbox indicator pop.
- Overlays retain enter/exit motion.
- Loaders retain continuous motion.
- No global “animate every mount” behavior is introduced.

### Required usage examples

```tsx
// Button: mount animation plus press animation.
<Button
  animate={{
    initial: { opacity: 0, translateY: 8 },
    to: { opacity: 1, translateY: 0 },
    transition: { type: 'timing', duration: 180, easing: 'ease-out' },
  }}
  activeAnimate={{
    to: { scale: 0.96 },
    transition: { type: 'spring', damping: 14, stiffness: 240 },
  }}
  onPress={save}
>
  Save
</Button>

// Disable only Button's default press feedback.
<Button activeAnimate={false} onPress={save}>Save without bounce</Button>

// Stateful component: the simple active target follows `checked`.
<Switch
  checked={enabled}
  onCheckedChange={setEnabled}
  activeAnimate={{ scale: 1.03 }}
/>

// Multiple interaction states.
<Toggle
  pressed={bold}
  onPressedChange={setBold}
  activeAnimate={{
    states: {
      press: { to: { scale: 0.95 } },
      selected: { to: { scale: 1.02 } },
      hover: { to: { scale: 1.01 } },
    },
    transition: { type: 'spring', damping: 15, stiffness: 220 },
  }}
>
  Bold
</Toggle>

// Static host: application supplies the active state explicitly.
<Card
  motionActive={selected}
  animate={{ to: { opacity: 0.9 } }}
  activeAnimate={{ opacity: 1, scale: 1.02 }}
/>

// Input's canonical active state is focus.
<Input activeAnimate={{ borderColor: '#6366f1', scale: 1.005 }} />

// User-owned content still uses Motion directly.
<Motion
  animate={{ initial: { opacity: 0 }, to: { opacity: 1 } }}
  activeAnimate={{ scale: 0.98 }}
>
  <CustomTile />
</Motion>
```

### Utility-string target API

Utility strings are phase-two syntax sugar over the object model, not a separate engine:

```tsx
<Button animate="fade-in slide-up duration-200" activeAnimate="scale-95 spring-snappy" />
<Toggle activeAnimate="press:scale-95 selected:scale-102 spring-snappy" />
<Motion animate="fade-in slide-up delay-100 duration-300" />
```

The parser must normalize these strings into `AnimateConfig`/`ActiveAnimateConfig`. For compatibility with the older draft, `press:`, `hover:`, and `focus:` tokens inside `animate` may be accepted and moved into active states when `activeAnimate` is absent. New documentation uses the separate `activeAnimate` prop.

Supported string families are deliberately bounded:

- presets: `fade-*`, `slide-*`, `zoom-*`, `pop`, `spin`, `pulse`, `bounce`, `shake`, `wiggle`
- transforms: `scale-*`, `translate-x-*`, `translate-y-*`, `rotate-*`, `opacity-*`
- transitions: `duration-*`, `delay-*`, `ease-*`, `spring-soft`, `spring-snappy`, `spring-bouncy`
- state prefixes: `press:`, `hover:`, `focus:`, `checked:`, `selected:`, `open:`, `expanded:`
- loops: `repeat-*`, `repeat-infinite`, `reverse`

Do not expose a catch-all `(string & {})` type in the first release. Keep preset/token autocomplete and emit a clear parser warning for unknown tokens.

---

## Core motion architecture

### Registry item, not CLI runtime

Runtime code belongs in the copied registry:

```text
components/ui/motion.tsx
```

It does **not** belong in `packages/lovdacn/src/motion`; `packages/lovdacn` is the CLI.

V1 should remain one registry file because the current `parseImports()` implementation in `packages/lovdacn/scripts/build-registry.cjs` treats relative imports as separate registry dependencies. If the engine is split into `motion/types`, `motion/presets`, or platform files later, fix the generator first so files in the same registry item are not emitted as nonexistent dependencies.

The `motion` item exports:

```ts
Motion;
MotionView;
MotionPressable;
MotionText;
MotionTextInput;
useMotion;
useMotionState;
composeMotionHandlers;
motionPresets;
// Public types listed above.
```

Conceptual data flow:

```text
component props + component defaults + semantic state
                         │
                         ▼
                  normalizeMotion()
                         │
                         ▼
       idle target + active target + transition
                         │
                         ▼
       shared values changed only when target changes
                         │
                         ▼
             one animated style on one host
```

### Required implementation rules

1. Normalize presets/configs with `useMemo`; do not parse strings or allocate transition objects every frame.
2. Start `withSpring`/`withTiming` when a target changes. Never create them repeatedly inside `useAnimatedStyle`.
3. `useAnimatedStyle` only reads shared values and assembles the current style.
4. Use one animated semantic host whenever possible. Do not add layout-changing wrapper views around every component.
5. Compose user handlers (`onPressIn`, `onPressOut`, hover, focus, blur, pointer cancel) instead of replacing them. User callbacks fire exactly once.
6. Reset press motion on release, cancellation, disablement, unmount, and pointer/gesture termination.
7. Preserve the original ref target. A ref to `Button` still resolves to the pressable host, not a new wrapper.
8. Preserve controlled and uncontrolled `@rn-primitives` behavior; animation observes state and never owns business state.
9. Never use React state for per-frame values.
10. Cancel infinite/repeating animations on unmount and when reduced motion becomes active.

### Host adapters

| Host kind                   | Integration                                                                                                                                                                      |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React Native host           | Render `MotionView`, `MotionPressable`, `MotionText`, or `MotionTextInput` directly.                                                                                             |
| `@rn-primitives` host       | Keep the primitive semantic owner and use `asChild` with the matching animated host.                                                                                             |
| Existing `asChild` API      | Use a tested `MotionSlot` path that merges refs, handlers, class/style, and animated style without a second pressable. Warn in development if the child cannot accept ref/style. |
| Portal content/overlay      | Animate the actual content or overlay host; keep portal/root providers unchanged.                                                                                                |
| Specialized internal motion | Keep its shared values/layout/gesture logic and consume normalized transitions/reduced-motion policy from `motion`.                                                              |
| Provider/root with no host  | No props on the provider itself; add both props to every visual child export in that module.                                                                                     |

### Style ownership

Animated styles are merged after the caller’s normal `style`, but only keys present in the normalized motion target are emitted. This prevents unrelated static styles from being overwritten.

React Native transform arrays do not safely merge with transforms generated later by NativeWind/Uniwind. Therefore:

- when `animate` or `activeAnimate` owns a root transform, all motion-owned root transforms are normalized into one stable transform array;
- component defaults must not combine a root transform class and a root motion transform;
- callers with an existing static root transform move that baseline into `animate.to`, or animate an inner/outer host explicitly;
- this limitation is documented and covered by a development warning where it can be detected.

### `asChild` rules

- Do not nest an animated pressable around another pressable.
- Do not change accessibility role, hit slop, focus order, or event target.
- The slotted child receives composed motion handlers and animated style.
- If the slotted child is another lovdaCN component, avoid two active animations by default: the outer explicit animation wins and the inner component default active animation is suppressed through motion context. Explicit animation on both remains allowed.

---

## Registry and install model

### Deliberate dependency change

Because all visual components expose these props, motion is no longer optional once a UI component is added:

```text
lovdacn init                 → no motion runtime by itself
lovdacn add utils            → no motion runtime
lovdacn add button           → button + text + utils + motion
lovdacn add card             → card + text + utils + motion
lovdacn add any visual UI    → that item + motion (deduplicated)
lovdacn add motion           → standalone Motion host only
```

This dependency cost is intentional and must be called out in release notes. The registry cannot truthfully promise `<Button animate>` while leaving `Button` independent of the implementation it imports.

### Target registry item and emitted JSON

`motion` is style-agnostic and should follow the existing extra-component pattern used by Spinner and Sonner. Add it to `packages/lovdacn/scripts/build-extra-components.cjs`, which writes the full item to all two engines × ten styles. Each emitted item must have the same shape as current registry output:

```json
{
  "$schema": "https://lovdacn.vercel.app/schema/registry-item.json",
  "name": "motion",
  "dependencies": ["react-native-reanimated", "react-native-worklets"],
  "registryDependencies": ["utils"],
  "files": [
    {
      "path": "components/ui/motion.tsx",
      "content": "<inlined source from the selected engine's motion.tsx>",
      "type": "registry:ui"
    }
  ],
  "meta": {
    "engine": "nativewind",
    "style": "default"
  },
  "type": "registry:ui"
}
```

`build-extra-components.cjs` supplies `$schema`, inlined `content`, per-output `meta.engine`, and `meta.style`; do not create incomplete JSON by hand. The preview currently pins `react-native-reanimated` `4.5.0` and `react-native-worklets` `0.10.0`. Consumer installation continues through the CLI’s Expo-aware install path so compatible versions are selected for the consumer’s Expo SDK. Do not add gesture-handler to `motion` unless the shared engine later owns gestures.

### The three registry build paths

`pnpm --filter lovdacn registry:build` invokes three relevant builders:

1. **`build-registry.cjs`** builds the normal per-style UI set. When a real `REUSABLES_SRC/<engine>/components/ui` exists, it parses imports and automatically turns `@/components/ui/motion` into a `motion` registry dependency.
2. **`build-blocks.cjs`** runs after the normal component build for composed blocks. Blocks normally receive motion transitively through their component dependencies, but the generated block graphs must still be checked after this rollout.
3. **`build-extra-components.cjs`** runs last for nine style-agnostic modules: `sidebar`, `breadcrumb`, `input-otp`, `bottom-sheet`, `sheet`, `sonner`, `spinner`, `calendar`, and `carousel`. Their npm and registry dependencies are hard-coded in its `COMPONENTS` array; importing motion in source is **not enough**. Add `motion` to each of those nine `registryDependencies` arrays and add a tenth entry that emits `motion` itself.

Do not remove `react-native-reanimated` from `build-registry.cjs`’s `PEER_DEPENDENCIES` merely to make `motion.json` work. The chosen extra-component emitter declares Reanimated and Worklets explicitly, just as current Spinner/Sonner entries declare Reanimated. Main components import `motion`, not Reanimated directly.

### Required inventories and dependency graph changes

Before publishing:

1. Add `motion` to `apps/v2/lib/components.ts` so it appears in docs/registry metadata.
2. Add `motion` to `AVAILABLE_COMPONENTS` in `packages/lovdacn/src/commands/add.ts`; that array drives the interactive picker and installed-component detection. Without this change, `lovdacn add motion` is not a supported item.
3. For normal components generated by `build-registry.cjs`, import `@/components/ui/motion` and assert generated `registryDependencies` includes `motion`.
4. For the nine extra components, update the hard-coded arrays in `build-extra-components.cjs` as described above.
5. Keep the `motion` item dependent only on `utils` plus its npm packages—never `text`, `button`, or another visual item—to avoid cycles.
6. Verify CLI traversal deduplicates `motion`, Reanimated, and Worklets when a composite component pulls several animated dependencies.

### Actual source-of-truth state and required cleanup

Both registry scripts currently point `REUSABLES_SRC` at the sibling path `react-native-reusables/packages/registry/src`, but that directory is absent in this workspace. The live fallbacks are therefore:

- **normal components:** `build-registry.cjs` reconstructs sources from `apps/v2/public/r/styles/<engine>/default/*.json`, then regenerates all styles;
- **the nine extra components:** `build-extra-components.cjs` reads `apps/preview/src/components/ui/<name>.tsx` and uses its hard-coded dependency arrays.

This means the `default/*.json` files currently act as source fixtures for the normal path even though they also live under the generated-output directory. It also explains existing preview/registry drift. Do not pretend the missing sibling repository is the active source.

**Chosen prerequisite:** before integrating animation into 41 modules, create a real in-repo source tree at:

```text
packages/lovdacn/registry-src/
  nativewind/components/ui/
  nativewind/lib/
  uniwind/components/ui/
  uniwind/lib/
```

Seed the normal component sources from the current per-engine default fixtures, seed the extra components from their current preview/upstream equivalents, and then repoint `REUSABLES_SRC` in both build scripts to `packages/lovdacn/registry-src`. Make a missing canonical source a build error in CI rather than silently rebuilding from generated output. After that migration:

- `packages/lovdacn/registry-src/**` is the canonical registry source;
- `apps/preview/src/components/ui/**` is the synchronized demo implementation;
- `apps/v2/public/r/styles/**` is generated output only and must not be hand-edited;
- `apps/v2/lib/components.ts` and `add.ts` remain explicit inventories;
- `build-extra-components.cjs` remains the metadata/emitter path for style-agnostic items, including `motion`.

For each rollout batch, update canonical NativeWind and Uniwind sources plus preview, update both generator metadata paths where applicable, run `pnpm --filter lovdacn registry:build`, and review all 20 engine/style outputs. If the source-tree migration is intentionally deferred, the plan must instead explicitly treat default JSON fixtures and preview sources as sanctioned inputs and update registry dependency arrays manually; it may not label all files under `public/r/styles` as disposable generated output.

---

## Complete component coverage

There are currently 41 UI modules in `apps/preview/src/components/ui` (40 consumer-facing component modules plus `native-only-animated-view`). `motion` is a new shared UI registry item alongside that current inventory. Every row below is required; there is no “select components only” deferral.

**Universal subcomponent rule:** every exported function/wrapper in a listed module that renders a visual native/primitive host receives `SharedAnimationProps`. The table calls out primary hosts and special state behavior. Context-only aliases/providers do not receive meaningless props; their visual trigger/content/item exports do.

### Content and display

| Module         | Primary visual hosts                              | Canonical active state                                           | Default behavior                                                          |
| -------------- | ------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `alert`        | Alert, title, description                         | `motionActive`                                                   | No default motion; optional alert entrance.                               |
| `aspect-ratio` | AspectRatio host                                  | `motionActive`                                                   | No default motion.                                                        |
| `avatar`       | Avatar, image, fallback                           | loaded/visible where available; otherwise `motionActive`         | Fallback/image crossfade; no root press assumption.                       |
| `badge`        | Badge/slotted host                                | press when interactive; otherwise `motionActive`                 | Subtle press scale only when interactive.                                 |
| `breadcrumb`   | list, item, link, page, separator, ellipsis       | link press; page `current`; otherwise `motionActive`             | Link press feedback; static pieces remain still.                          |
| `card`         | card, header, title, description, content, footer | `motionActive` unless an interactive slotted host supplies press | No default root motion.                                                   |
| `icon`         | Icon motion host                                  | inherited/manual `motionActive`                                  | No default; supports rotate, scale, color, and opacity.                   |
| `label`        | Label host                                        | focus/manual state                                               | No default motion.                                                        |
| `separator`    | Separator host                                    | `motionActive`                                                   | No default motion.                                                        |
| `text`         | Text host and variants                            | inherited/manual `motionActive`                                  | No default; supports opacity/color/transform without changing typography. |

### Actions, forms, and selection

| Module         | Primary visual hosts                                             | Canonical active state                                             | Default behavior                                                               |
| -------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| `button`       | Button pressable                                                 | `press`                                                            | `scale: 0.97`, snappy spring; disabled suppresses it.                          |
| `calendar`     | calendar container, day cells, navigation controls               | day `selected`/`current`; controls `press`                         | Selected-day pop and nav press feedback.                                       |
| `checkbox`     | root and indicator host                                          | `checked`, plus optional `press`                                   | Check indicator pop; root can use custom active target.                        |
| `input`        | TextInput host                                                   | `focus`                                                            | Very small focus emphasis; no layout shift.                                    |
| `input-otp`    | root/group/slot/separator visual hosts                           | focused slot `focus`; filled/current slot `current`                | Active slot pulse/caret behavior retained.                                     |
| `radio-group`  | group visual host and item                                       | item `checked`; optional `press`                                   | Selected dot pop.                                                              |
| `select`       | trigger, value, content, item, labels/separators/scroll controls | trigger/content `open`; item `selected` or focus; controls `press` | Trigger feedback and content enter/exit; item state feedback.                  |
| `switch`       | switch root                                                      | `checked`, plus optional `press`                                   | Existing thumb spring remains specialized; root active motion is customizable. |
| `textarea`     | TextInput host                                                   | `focus`                                                            | Same focus contract as Input.                                                  |
| `toggle`       | Toggle root and icon                                             | semantic `selected` from primitive `pressed`; transient `press`    | Press scale; selected state may be separately configured.                      |
| `toggle-group` | group and item visual hosts                                      | item `selected`; transient `press`                                 | Per-item press/selection feedback; group itself uses `motionActive`.           |

### Disclosure, navigation, and collections

| Module        | Primary visual hosts                                                                              | Canonical active state                                | Default behavior                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `accordion`   | root layout host, item, trigger, content                                                          | `expanded`; trigger also `press`                      | Keep measured/layout animation and chevron rotation; shared props control host feedback/transitions. |
| `carousel`    | container, content, item, previous/next controls                                                  | item `current`, content `dragging`, controls `press`  | Gesture/scroll behavior remains specialized; controls get press motion.                              |
| `collapsible` | visual root/trigger/content supplied by wrappers                                                  | `expanded`                                            | Keep layout measurement specialized; expose open/close host targets.                                 |
| `sidebar`     | desktop/drawer/inset/header/footer/content/groups/menu items/buttons/actions/badges/submenu/input | sidebar `open`; menu item `current`; controls `press` | Existing drawer/layout behavior retained; interactive entries get feedback.                          |
| `tabs`        | root/list/trigger/content                                                                         | trigger/content `selected`; trigger `press`           | Selected trigger emphasis and content transition.                                                    |

### Overlays, menus, and portals

| Module          | Primary visual hosts                                                                             | Canonical active state                                    | Default behavior                                                                |
| --------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `alert-dialog`  | trigger, overlay, content, action, cancel, header/footer/title/description                       | content/overlay `open`; actions `press`                   | Preserve backdrop fade and content pop; buttons use shared press behavior.      |
| `bottom-sheet`  | trigger, overlay, content, handle/header/footer/title/description                                | `open` and `dragging`; trigger `press`                    | Preserve directional/gesture motion; normalized transitions and reduced motion. |
| `context-menu`  | trigger, overlay/content/subcontent, item/checkbox/radio/subtrigger, labels/separators/shortcuts | content `open`; item focus/press; checked items `checked` | Menu enter/exit and item feedback.                                              |
| `dialog`        | trigger, overlay, content, close, header/footer/title/description                                | content/overlay `open`; trigger/close `press`             | Preserve backdrop fade and content zoom.                                        |
| `dropdown-menu` | trigger, overlay/content/subcontent, item/checkbox/radio/subtrigger, labels/separators/shortcuts | content `open`; item focus/press; checked items `checked` | Menu enter/exit and item feedback.                                              |
| `hover-card`    | trigger and content                                                                              | trigger `hover`/`focus`; content `open`                   | Fade/scale content while retaining accessible focus behavior.                   |
| `menubar`       | bar, trigger, content/subcontent, item/checkbox/radio/subtrigger, labels/separators/shortcuts    | menu `open`; item focus/press; checked items `checked`    | Trigger/menu/item feedback.                                                     |
| `popover`       | trigger, overlay/content                                                                         | `open`; trigger `press`                                   | Content fade/scale and trigger feedback.                                        |
| `sheet`         | trigger, overlay, content, close, header/footer/title/description                                | `open`; trigger/close `press`                             | Direction-aware slide and backdrop fade.                                        |
| `tooltip`       | trigger and content                                                                              | trigger `hover`/`focus`; content `open`                   | Short reduced-distance fade/scale; no touch-only hover assumption.              |

### Feedback and motion helpers

| Module                      | Primary visual hosts                   | Canonical active state                             | Default behavior                                                                                                |
| --------------------------- | -------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `progress`                  | root and indicator                     | `loading`/indeterminate or explicit `motionActive` | Keep width/fill interpolation specialized; shared transition/reduced-motion policy.                             |
| `skeleton`                  | skeleton host                          | `loading` (true by default while mounted)          | Native/web pulse; `animate={false}` stops it.                                                                   |
| `sonner`                    | toast viewport and rendered toast host | `visible` and `dragging`                           | Keep toast stack/swipe logic; normalize enter/exit and reduced motion.                                          |
| `spinner`                   | spinner host/icon                      | `loading` (true by default while mounted)          | Continuous rotation; stop on unmount or reduced motion.                                                         |
| `native-only-animated-view` | compatibility animated view            | explicit `motionActive`                            | Keep API compatibility; internally delegate to shared primitives where this does not create a dependency cycle. |

### Specialized component rule

For Accordion, Bottom Sheet, Carousel, Progress, Skeleton, Sonner, Spinner, Switch, and similar components:

- `animate`/`activeAnimate` always work on the documented public motion host;
- existing internal animation remains responsible for measured layout, fill width, thumb travel, drag, or loops;
- `animate={false}` disables that component’s default nonessential motion, while preserving state changes and final visual values;
- custom shared transitions may be consumed by the specialized engine when units are compatible;
- no generic parser pretends that `height: auto`, gesture velocity, or progress width is a simple transform.

---

## Platform and accessibility behavior

### Native

- Use Reanimated shared values/worklets for frame-by-frame styles.
- Press/focus/semantic state originates from the existing React Native or `@rn-primitives` host.
- Entering/exiting builders are memoized and attached only to hosts that support lifecycle animation.
- Layout/gesture-heavy components retain their current specialized implementations.

### Web

- The public API and state resolution are identical.
- Hover and focus states are enabled only where the platform emits them.
- During migration, a property must be controlled by only one engine. Remove or gate existing `animate-in`, `fade-in-*`, `zoom-in-*`, and transition classes when the shared motion adapter controls those same properties, preventing double animation.
- SSR output uses deterministic initial styles and does not read browser globals during render.

### Reduced motion

Default policy is `reduceMotion="system"`.

- Mount/exit motion snaps to its final accessible state or uses a short opacity-only transition.
- Press/selection feedback becomes instant or is removed.
- Infinite spin/pulse/bounce loops stop and render a stable final state.
- Essential state remains visible: checked indicators, progress values, open content, and focus affordances cannot disappear merely because motion is reduced.
- `always` forces reduced behavior; `never` is an explicit application override and must be documented as such.

### Accessibility and interaction invariants

- Roles, labels, states, focus order, hit slop, pointer behavior, and keyboard activation remain unchanged.
- Disabled/read-only controls do not enter press/focus active motion.
- Animation never delays `onPress`, `onCheckedChange`, `onValueChange`, `onOpenChange`, or form events.
- Color-only active animations cannot become the sole indicator of selection/focus.
- Overlay exit animation must not leave an invisible focus trap or block pointer input after logical close.

---

## Implementation phases

### Phase 0 — Freeze the contract and establish the registry source

- Treat this file as the source of truth; remove the old optional/selective assumptions from implementation tickets.
- Create `packages/lovdacn/registry-src/<engine>/{components/ui,lib}`, seed it from the verified fallback inputs, and repoint both `build-registry.cjs` and `build-extra-components.cjs` to it.
- Make missing canonical source fail in CI; do not silently use generated default fixtures after the migration.
- Register `motion` in `apps/v2/lib/components.ts`, `add.ts` `AVAILABLE_COMPONENTS`, and `build-extra-components.cjs`.
- Add type-level fixtures for the API before component rollout.
- Decide the exact preset values and state precedence once; components consume shared constants.
- Remove the unfinished `apps/preview/src/lib/motion/useAnimate.ts` after its replacement is wired. Do not add the missing `./parser` and `./types` around its current flawed animation loop.

**Exit:** the in-repo source is canonical and enforced, all three inventories know `motion`, types compile, and no missing-module WIP remains in the intended runtime path.

### Phase 1 — Build `motion` and use Button as the reference integration

- Add the `motion` registry item and generator metadata.
- Implement object normalization, presets, shared values, lifecycle styles, active state maps, handler composition, reduced motion, cancellation, and host adapters.
- Implement `Motion` and the direct host exports.
- Convert Button to `MotionPressable` and add both props to `ButtonProps`.
- Preserve Button ref/event/disabled behavior and add default press scale.
- Add registry/CLI smoke coverage proving `add button` pulls `motion`, Reanimated, and Worklets.

**Exit:** Button works with object `animate`, `activeAnimate`, both `false` cases, custom handlers, refs, disabled state, reduced motion, native, and web.

### Phase 2 — Roll out both props to all ordinary visual hosts

Implement in small reviewable batches, but do not publish “all components support animation” until every matrix row is complete:

1. Content/display: Alert through Text.
2. Forms/selections: Calendar, Checkbox, Input, Input OTP, Radio Group, Select, Switch, Textarea, Toggle, Toggle Group.
3. Disclosure/navigation: Accordion, Carousel, Collapsible, Sidebar, Tabs.
4. Overlays/menus: Alert Dialog through Tooltip.
5. Feedback: Progress, Skeleton, Sonner, Spinner, compatibility helper.

Convert primitive aliases that render a host into thin wrappers where necessary so their prop types can include `SharedAnimationProps`. Leave context-only roots/providers as aliases.

**Exit:** a generated compile fixture demonstrates both props on every visual public export in all 41 current modules.

### Phase 3 — Unify defaults and specialized engines

- Move duplicated transition constants into `motionPresets`.
- Connect accordion, switch, progress, skeleton, spinner, toast, carousel, sheet, and bottom-sheet internals to shared reduced-motion and transition policy.
- Remove double native/web animations and obsolete hardcoded defaults.
- Keep component-specific shared values where generic motion cannot model the behavior correctly.

**Exit:** existing visual behavior is preserved or intentionally improved, with one owner per animated property.

### Phase 4 — Add utility-string compilation

- Parse the bounded token set into the object model.
- Support strings on both props.
- Add legacy `animate="press:..."` normalization while documenting `activeAnimate` as preferred.
- Add parser diagnostics, token autocomplete, and object/string parity tests.

**Exit:** equivalent object and string examples normalize to the same snapshot and produce the same visual states.

### Phase 5 — Regenerate, document, and release

- Run the registry build for all 20 engine/style combinations.
- Update component docs and previews with at least default, custom object, disabled, and reduced-motion examples.
- Add release notes explaining that visual components now pull the shared motion dependency.
- Verify a clean consumer install rather than relying only on the monorepo’s already-installed dependencies.

**Exit:** generated artifacts, docs, preview, CLI install, and clean Expo consumer all agree.

---

## Validation plan

### Unit and type tests

- Normalize every preset and object shape.
- Verify `undefined`, `false`, custom override, and default merge semantics independently for both props.
- Verify active-state precedence and return-to-idle behavior.
- Verify reduced motion and loop cancellation.
- Verify handler composition calls each user callback once.
- Verify disabled/read-only controls never activate interaction motion.
- Verify object/string equivalence after phase 4.
- Type-test all visual exports with `animate`, `activeAnimate`, `motionActive`, `reduceMotion`, `ref`, and their existing props.

### Component interaction tests

At minimum cover:

- Button press/release/cancel/disabled and caller handlers.
- Checkbox/Switch checked state, controlled and uncontrolled.
- Toggle/Tabs selected state.
- Input/Textarea focus and blur.
- Accordion/Collapsible expanded state.
- Dialog/Sheet/Popover open and close, including portal cleanup.
- Select/menu item focus, selection, and close.
- `asChild` ref/event/style forwarding and nested lovdaCN components.
- Spinner/Skeleton unmount and reduced-motion loop shutdown.
- Progress, Accordion, Switch, Carousel, Bottom Sheet, and Sonner specialized behavior.

### Registry tests

1. Every generated visual component JSON contains `motion` in `registryDependencies`.
2. Every engine/style directory contains a valid `motion.json` with `$schema`, inlined file content, and matching `meta`.
3. `motion.json` contains Reanimated and Worklets dependencies.
4. All nine hard-coded entries in `build-extra-components.cjs` include `motion`, while the new `motion` entry depends on `utils` and cannot depend on itself.
5. `apps/v2/lib/components.ts` and `add.ts` `AVAILABLE_COMPONENTS` both contain `motion`.
6. Canonical registry source exists for both engines and CI does not fall back to `public/r/styles/<engine>/default`.
7. Dependency graphs contain no cycle and deduplicate shared items.
8. Generated file contents import only paths that the CLI copies.
9. Generated blocks still resolve their transitive UI dependencies.
10. A temporary clean Expo project can run:

```bash
npx lovdacn@latest add button
```

and receive `button.tsx`, `text.tsx`, `motion.tsx`, `utils`, and compatible runtime packages without manual file copying.

### Repository commands

```bash
pnpm --filter lovdacn test
pnpm --filter lovdacn registry:build
pnpm --filter preview lint
pnpm check-types
pnpm --filter v2 build
```

Also run the preview on iOS, Android, and web. For performance-sensitive interactions, profile a production build: no React render should be scheduled per frame, no animation should restart continuously, and no repeating animation should survive unmount.

---

## Acceptance criteria

The feature is complete only when all of the following are true:

- [ ] `Button` exposes working `animate` and `activeAnimate` props and has subtle default press feedback.
- [ ] Every visual public export across all 41 current UI modules exposes both props; provider-only exports are documented and their visual children comply.
- [ ] `Motion` exposes the same API for user-owned content.
- [ ] `motion` is emitted by `build-extra-components.cjs`, registered in both `apps/v2/lib/components.ts` and `add.ts` `AVAILABLE_COMPONENTS`, and is an automatic registry dependency of every visual component.
- [ ] The canonical in-repo NativeWind/Uniwind source replaces the absent sibling/generated-fixture fallback, and adding Button in a clean app installs/copies everything required.
- [ ] Object configuration works on iOS, Android, and web.
- [ ] `activeAnimate` follows the documented semantic state for each component.
- [ ] `animate={false}` and `activeAnimate={false}` disable only their respective layers.
- [ ] User handlers, refs, `asChild`, accessibility, disabled state, portals, and controlled primitive state are preserved.
- [ ] Reduced-motion behavior is implemented for lifecycle, interaction, specialized, and infinite animations.
- [ ] Existing specialized components retain correct layout/gesture/value behavior.
- [ ] No missing `parser`/`types` imports or unfinished motion draft remains.
- [ ] No animated property is driven simultaneously by legacy CSS and the shared engine.
- [ ] Registry artifacts are regenerated for NativeWind and Uniwind across all ten styles and pass graph/install validation.
- [ ] Utility strings, when phase 4 ships, compile to the same canonical object representation rather than introducing a second runtime.

## Risks and mitigations

| Risk                                          | Mitigation                                                                                                                                          |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Every visual component now pulls Reanimated   | Make the dependency change explicit, use Expo-compatible installation, deduplicate through registry dependencies, and measure clean install impact. |
| `asChild` or primitive semantics break        | One semantic host, dedicated MotionSlot tests, preserved refs/handlers, no nested pressables.                                                       |
| Static transforms are overwritten             | Stable transform ownership contract, no conflicting default classes, warning/documented wrapper escape hatch.                                       |
| Existing overlay CSS double-animates          | Gate/remove legacy animation classes as each host migrates; one owner per property.                                                                 |
| Generic motion damages specialized components | Keep layout, gesture, fill, thumb, and loop logic local; share only types, presets, state, transitions, and reduced-motion policy.                  |
| Default motion is distracting                 | No default mount motion for static components; subtle component defaults; independent `false` controls; system reduced motion.                      |
| Preview and registry drift                    | Update actual registry source and preview together; regenerate all artifacts; validate generated JSON in CI.                                        |
| Copied user components do not auto-upgrade    | Document that existing consumers must re-add/diff components; provide a migration note and code examples.                                           |

## Final product model

```text
Need Button        → lovdacn add button
                   → Button + dependencies + motion are copied
                   → <Button animate activeAnimate> works immediately

Need any component → add it normally
                   → its visual exports share the same two props

Need custom UI     → lovdacn add motion
                   → use <Motion animate activeAnimate>
```

The defining rule is simple: **if a lovdaCN export renders a visual host, it supports `animate` and `activeAnimate`.**

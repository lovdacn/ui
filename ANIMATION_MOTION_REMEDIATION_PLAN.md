# Animation and Motion Remediation Plan

**Status:** Ready for implementation  
**Scope:** `apps/preview`, `apps/v2`, and motion-related registry generation  
**Created:** 2026-08-09  
**Implementation state:** Planning only; no remediation code has been applied

## 1. Objective

Make animation behavior reliable and accessible across the Expo preview application and the Next.js site, with these invariants:

1. Content is visible in static HTML, during hydration, when JavaScript fails, and when motion initialization fails.
2. An iframe can never remain permanently transparent because a single readiness message was missed.
3. Press, focus, and semantic component states route to the correct animation target.
4. Animated colors, transforms, and radii do not silently replace valid static styles with invented defaults.
5. Controlled and uncontrolled component states produce the same visual state.
6. Native and web behavior is intentionally equivalent where parity is expected.
7. Reduced-motion preferences are honored without first painting hidden content.
8. Generated registry artifacts remain reproducible from canonical source files.

## 2. Scope and constraints

### Applications

- `apps/preview`: Expo 57, React Native 0.86, Reanimated 4.5.0, Worklets 0.10.0.
- `apps/v2`: Next.js 16 site, iframe host, CSS transitions, and generated registry delivery.

### Repository guidance

- Before implementing preview changes, validate behavior against the installed Expo 57 stack as required by `apps/preview/AGENTS.md`.
- Before implementing Next.js changes, consult the installed Next.js 16 documentation as required by `apps/v2/AGENTS.md`.
- Edit canonical sources only. Do not hand-edit generated registry JSON files.
- Preserve the plain registry primitive seam; applications that do not install motion must not acquire a Reanimated dependency.

### Confirmed non-defect

The absence of an explicit Worklets or Reanimated plugin in `apps/preview/babel.config.js` is expected. Installed `babel-preset-expo` automatically adds the appropriate plugin when Worklets is installed. The installed versions are compatible:

- React Native: `0.86.0`
- Reanimated: `4.5.0`, peer range RN `0.83 - 0.86`, Worklets `0.10.x`
- Worklets: `0.10.0`

Do not add a duplicate Babel plugin as part of this work.

## 3. Audit baseline

### Inventory corrections

A text search returned 41 files containing `@/components/ui/primitives`. AST verification found:

- **39 actual primitive-seam importers**.
- `motion.tsx` and `primitives.tsx` were documentation-only text matches.
- **14 explicit motion adapter component files**.
- **19 direct-animation files**, consisting of 18 Reanimated files and one React Native core `Animated` file.

### Validation already completed

The following non-emitting checks passed before implementation:

```powershell
pnpm --filter preview exec tsc --noEmit --incremental false
pnpm --filter v2 exec tsc --noEmit --incremental false
```

No runtime server, production build, static Expo export, or device test has been run yet. Those remain implementation acceptance requirements.

## 4. Priority summary

| Priority | Workstream | Primary outcome |
|---|---|---|
| P0 | Iframe readiness protocol | A missed message cannot leave previews permanently transparent |
| P0 | SSR/hydration-safe entrances | Static and failed-hydration output remains visible |
| P0 | Safe color endpoints | Missing idle colors cannot become transparent numeric defaults |
| P1 | Canonical active-state routing | Pressable, TextInput, and semantic hosts animate the intended state |
| P1 | Transform/radius ownership | Motion styles cannot silently erase static style ownership |
| P1 | RadioGroup and Collapsible state | Selected/open state works for all supported control modes |
| P2 | Native direction parity | Sheet and Tooltip directions behave intentionally |
| P2 | Reduced motion and loop policy | Core Animated and continuous loaders follow an explicit policy |
| P2 | No-motion fast path | Components without motion avoid Reanimated runtime overhead |
| P3 | Exit/repeat/reverse contract | Public APIs are implemented or explicitly deprecated |
| P3 | Registry parity and housekeeping | Generated files and CSS sources remain reproducible and readable |

## 5. P0 — Visibility guarantees

### 5.1 Replace the one-shot iframe readiness event

#### Affected files

- `apps/v2/components/block-preview.tsx`
- `apps/v2/components/component-preview-card.tsx`
- `apps/preview/src/app/present.tsx`
- Protocol consistency:
  - `apps/v2/app/create/customizer.tsx`
  - `apps/preview/src/app/customizer-preview.tsx`

#### Current failure

The two vulnerable hosts retain `opacity-0` until `readySrc === src`. The presenter posts `lvcn:ready` only once from a mount effect. The hosts have no `onLoad` recovery, request/retry mechanism, timeout, or safe reveal. If the event arrives before the parent listener is active or is otherwise lost, the iframe can contain a fully rendered app while remaining permanently transparent.

The customizer host is more resilient because it calls its readiness reducer from `onLoad`, but it should use the same protocol so visual readiness and configuration delivery are deterministic.

#### Target protocol

Use an idempotent, session-scoped handshake. Suggested messages:

```ts
type PreviewMessage =
  | { type: 'lvcn:ready-request'; sessionId: string }
  | { type: 'lvcn:ready'; sessionId: string }
  | { type: 'lvcn:ready-ack'; sessionId: string }
  | { type: 'lvcn:preset'; sessionId: string; colorScheme: 'light' | 'dark'; preset?: string };
```

Parent state machine:

1. Generate a new `sessionId` when `src` changes.
2. Install the message listener and reset ready/error state.
3. On iframe `load`, send `lvcn:ready-request`.
4. Retry the request on a bounded interval until ready or timeout.
5. Accept `lvcn:ready` only when all are true:
   - `event.source === iframe.contentWindow`
   - `event.origin === expoPreviewOrigin`
   - `message.sessionId` matches the current session
6. Mark the iframe ready, send configuration, and return `lvcn:ready-ack`.
7. Stop retrying after acknowledgment or unmount.
8. After a finite timeout, reveal a recoverable error/safe state; never retain `opacity-0` indefinitely.

Child state machine:

1. Install the message listener before sending readiness.
2. Validate `event.source === window.parent` and the configured/allowed parent origin.
3. Send `lvcn:ready` on mount and whenever `lvcn:ready-request` is received.
4. Retry ready notifications until `lvcn:ready-ack` is received.
5. Apply preset messages idempotently for the matching session.
6. Clear retry timers on acknowledgment or unmount.

#### Required tests

- Drop the first child `ready` event; the next request/retry succeeds.
- Dispatch child readiness before the parent effect; `onLoad` request recovers.
- Change `src` while an old iframe response is in flight; stale session is ignored.
- Send a correct message from the wrong source window; it is ignored.
- Send a correct message from the wrong origin; it is ignored.
- Never send readiness; timeout removes permanent transparency and exposes retry/error UI.
- Toggle color scheme before, during, and after readiness; the final configuration wins.
- Verify the customizer still applies presets after adopting the common protocol.

#### Completion criteria

- No code path can leave a loaded iframe at `opacity: 0` forever.
- Message listeners, intervals, and timeout handles are cleaned up.
- Source, origin, and session checks are covered by tests.

### 5.2 Make entrance animations safe for SSR and hydration

#### Affected files

- `apps/preview/src/components/ui/motion.tsx`
- `apps/preview/src/components/ui/primitives.tsx`
- All 39 primitive-seam consumers listed in section 11

#### Current failure

Entrance presets such as fade, slide, and zoom start at `opacity: 0`. `mounted` starts as a false shared value and changes only from a post-render effect. The initial animated style can therefore be hidden in static or server-rendered output. Healthy hydration normally advances it, but failed hydration, interrupted startup, or a worklet failure can leave valid content inside a permanently invisible animated host.

Reduced motion also receives the raw hidden initial value before the mount effect causes a snap to the final value.

#### Target design

Enforce these rules:

1. Server/static output always uses final visible values.
2. The first client render matches server-visible output.
3. Components already present during hydration skip their entrance rather than hiding after server render.
4. Components mounted after hydration may use entrances.
5. Native/client-only mounts may retain normal entrances.
6. Reduced motion uses final values from the first paint.
7. Failure to initialize motion leaves the static host visible.

A hydration-aware runtime/provider may be used, but it must distinguish components present during initial hydration from components mounted later. Avoid a design that renders visible HTML and then hides it in an ordinary effect, which would replace permanent invisibility with a visible-to-hidden flash.

#### Required tests

- Render each opacity-based preset to static web output; content is visible.
- Hydrate that output; no mismatch, flash to zero, or entrance replay occurs.
- Mount the same component after hydration; its entrance runs.
- Simulate disabled JavaScript or an initialization exception; content remains visible.
- Enable reduced motion before first render; no hidden frame occurs.
- Verify native iOS and Android entrances still run when motion is allowed.

#### Completion criteria

- Static HTML never relies on a post-render effect to become visible.
- Normal web hydration is visually stable.
- Native and post-hydration entrances remain available.

### 5.3 Remove invented color defaults

#### Affected file

- `apps/preview/src/components/ui/motion.tsx`

#### Current failure

`NUMERIC_DEFAULTS` does not contain colors. Missing idle values fall through to `0`. For `color`, `backgroundColor`, or `borderColor`, numeric zero is not the caller's intended static token and can become transparent or otherwise invalid for the intended transition.

#### Target contract

- Never use numeric fallback values for colors.
- Require both idle and active color endpoints for interpolated color animation.
- If a one-sided active color is supplied:
  - emit a development warning,
  - retain the static style while idle,
  - either apply the active color without interpolation or omit the unsupported animation according to the documented contract.
- Do not attempt to infer NativeWind theme tokens through arbitrary runtime style inspection.
- Document color endpoint requirements in the public motion API.

#### Required tests

Cover all color keys with:

- idle and active strings,
- active-only values,
- initial and final values,
- semantic, press, and focus states,
- light and dark themes.

## 6. P1 — Correct state and style semantics

### 6.1 Route shorthand targets to the host's canonical state

#### Affected files

- `apps/preview/src/components/ui/motion.tsx`
- `apps/preview/src/components/ui/button.tsx`
- Transitive focus hosts:
  - `apps/preview/src/components/ui/input.tsx`
  - `apps/preview/src/components/ui/textarea.tsx`
  - `apps/preview/src/components/ui/input-otp.tsx`

#### Current failure

`resolveActive()` returns preset/shorthand targets as `simple`. `normalize()` always assigns `simple` to `semantic`. Consequently:

- `MotionPressable` changes `pressed`, but shorthand `activeAnimate="press"` creates no press target.
- Button defaults to `activeAnimate="press"`, so its expected press scale does not run.
- `MotionTextInput` changes `focused`, but shorthand active animation creates no focus target.

#### Target routing

| Host | Canonical shorthand channel |
|---|---|
| `MotionPressable` | `press` |
| `MotionTextInput` | `focus` |
| `MotionView` | `semantic`, gated by `motionActive` |
| `MotionText` | `semantic`, gated by `motionActive` |
| `MotionSlot` | Explicitly supplied host/channel contract |

Rules:

- Explicit `states.press`, `states.focus`, `states.hover`, etc. override shorthand for that state.
- Explicit semantic states continue to collapse checked/selected/current/open/expanded/visible/loading into the canonical semantic channel.
- State precedence remains documented and deterministic.

#### Required tests

- Button scales while pressed and returns to idle on release/cancel.
- A TextInput shorthand animates only while focused.
- Semantic shorthand requires `motionActive` for View/Text.
- Explicit state maps override shorthand only for the specified state.
- Disabled state resolves to the documented idle/disabled result.
- User event handlers still fire exactly once alongside motion handlers.

### 6.2 Establish explicit transform and radius ownership

#### Affected files

- `apps/preview/src/components/ui/motion.tsx`
- `apps/preview/src/components/ui/primitives.tsx`

#### Current failure

The animated style emits a complete `transform` array. Because it is later in the style array, it replaces the host's static transform array rather than composing with it. Animated `borderRadius` similarly replaces a static NativeWind radius, and an active-only radius currently falls back to zero while idle.

#### Target design

- Remove the claim that emitting only used keys guarantees static transforms are preserved.
- Require explicit idle values for radius animation; never invent radius zero for active-only motion.
- Prefer a dedicated motion wrapper when static and animated transforms both need ownership.
- Where reliable composition is possible, preserve transform order and each static operation.
- Add development warnings for detectable style ownership conflicts.
- Preserve host refs, accessibility semantics, layout behavior, and `asChild` behavior; do not add wrappers blindly to primitives whose structure is significant.

#### Required tests

- Static rotate plus animated scale preserves both in documented order.
- Static translate plus animated translate follows the selected ownership rule.
- Static rounded classes remain intact when radius is not explicitly owned by motion.
- `asChild`, refs, hit testing, and accessibility roles remain unchanged.

### 6.3 Repair RadioGroup selected-state motion

#### Affected file

- `apps/preview/src/components/ui/radio-group.tsx`

#### Current failure

`RadioGroupItem` labels its canonical state as selected/checked but passes only the caller's raw `motionActive`. It never compares the item's `value` with the controlled root `value`.

#### Target design

- Add a local motion context containing the root's controlled value.
- Derive item state with `motionActive ?? rootValue === itemValue`.
- Preserve an explicit `motionActive` override.
- Do not depend on private RN Primitive context hooks; the installed package does not publicly export one.

#### Required tests

- Selecting each item activates only that item.
- Programmatic root value changes update visual state.
- Disabled items remain semantically correct.
- Explicit `motionActive` overrides derived selection.

### 6.4 Repair uncontrolled Collapsible motion

#### Affected file

- `apps/preview/src/components/ui/collapsible.tsx`

#### Current failure

The root derives motion only from `props.open`. With `defaultOpen`, the primitive updates internally but motion receives `undefined`. Trigger and Content also have no resolved open-state source.

#### Target design

- Resolve controlled/uncontrolled state locally from `open`, `defaultOpen`, and `onOpenChange`.
- Provide resolved open state through a local motion context.
- Pass the resolved state to Root, Trigger, and Content unless explicitly overridden.
- Preserve callback ordering and avoid duplicate `onOpenChange` calls.
- Do not rely on private primitive internals.

#### Required tests

- Controlled open/close.
- Uncontrolled closed initial state.
- Uncontrolled `defaultOpen` initial state.
- Programmatic controlled changes.
- Trigger interaction invokes the consumer callback exactly once.

### 6.5 Preserve already-correct adapters

No control-mode rewrite is needed for:

- `checkbox.tsx`
- `switch.tsx`
- `toggle.tsx`

The installed primitive contracts are controlled-only. Preserve their current prop-derived state and add regression tests.

Selection derivation is already correct in:

- `tabs.tsx`
- `toggle-group.tsx`

Retain their context-based behavior and add tests while changing the shared engine.

## 7. P2 — Parity, accessibility, and performance

### 7.1 Add a no-motion host fast path

#### Affected files

- `apps/preview/src/components/ui/motion.tsx`
- `apps/preview/src/components/ui/primitives.tsx`

#### Current issue

Every motion-aware View, Text, Pressable, and TextInput calls `useMotion` even when no motion prop is configured. `enabled` is returned but not used. This allocates Reanimated shared/derived values, styles, and effects across the entire primitive seam.

#### Target design

- Detect whether motion is configured before entering the animated implementation.
- Render a raw React Native host for the static branch.
- Put hooks in separate animated subcomponents; do not conditionally call hooks in one component.
- Preserve types, refs, event behavior, className/style order, and the marker used by the CLI.

#### Required tests

- Static hosts do not invoke the motion hook.
- Adding any supported motion prop selects the animated host.
- Ref instances remain the underlying native/web host.
- Button still selects motion because it supplies its default press preset.

### 7.2 Complete native Sheet direction parity

#### Affected file

- `apps/preview/src/components/ui/sheet.tsx`

#### Current failure

Native entering/exiting builders exist only for left and right. Top and bottom receive `undefined`, while web has all four directions.

#### Target mapping

| Side | Enter | Exit |
|---|---|---|
| left | `SlideInLeft` | `SlideOutLeft` |
| right | `SlideInRight` | `SlideOutRight` |
| top | `SlideInUp` | `SlideOutUp` |
| bottom | `SlideInDown` | `SlideOutDown` |

Verify actual builder direction against the installed Reanimated implementation before merging.

### 7.3 Normalize Tooltip direction behavior

#### Affected file

- `apps/preview/src/components/ui/tooltip.tsx`

#### Current issue

Native animation distinguishes top from every other side; bottom, left, and right share the same upward entrance.

Choose and document one policy:

- directional movement corresponding to all four sides, or
- a direction-neutral fade/scale for every side.

Test placement changes and collision-adjusted positions so animation direction does not contradict final placement.

### 7.4 Handle reduced motion for core Animated Sidebar transitions

#### Affected file

- `apps/preview/src/components/ui/sidebar.tsx`

#### Current failure

Sidebar uses React Native core `Animated.timing` for 200 ms and 220 ms transitions. Unlike Reanimated 4.5 builders, core Animated does not automatically apply Reanimated's `ReduceMotion.System` behavior.

#### Target design

- Subscribe to React Native `AccessibilityInfo` reduced-motion state.
- Snap animated values to their final values when reduction is enabled.
- React to preference changes while the app is open.
- Cancel an in-flight animation before snapping or starting a replacement.
- Preserve desktop width and mobile overlay behavior.

### 7.5 Remove unnecessary Spinner work

#### Affected file

- `apps/preview/src/components/ui/spinner.tsx`

#### Current issue

The Reanimated repeat starts before the `nativeOnly` rendering decision, even when output is an `ActivityIndicator` and the rotation style is unused.

#### Target design

- Do not create/start the custom rotation when the selected rendering branch does not consume it.
- Confirm Reanimated's installed system-reduced behavior with a runtime test.
- Decide whether product accessibility requirements need a non-moving loader beyond the platform/Reanimated defaults.

### 7.6 Resolve Progress zero-value parity

#### Affected file

- `apps/preview/src/components/ui/progress.tsx`

Native maps value zero to a 1% width while web semantics may represent actual zero. Decide whether the minimum visible sliver is intentional. Then make native/web behavior and tests agree. Treat this as value correctness, not a proven invisible-content cause.

### 7.7 Expand v2 CSS reduced-motion coverage

#### Affected file

- `apps/v2/app/globals.css`

The v2 rule is narrower than preview's global policy. Add a scoped policy for site animation and transition utilities, including iframe opacity transitions, without disabling essential state changes. Under reduced motion, state should still update immediately.

### 7.8 Reanimated files that primarily need regression testing

Installed Reanimated 4.5 source shows timing, spring, repeat, layout, entering/exiting, and keyframe builders default to system reduced motion. Do not add redundant custom hooks to every file without a demonstrated need.

Regression-test these direct implementations:

- `apps/preview/src/components/animated-icon.tsx`
- `apps/preview/src/components/ui/accordion.tsx`
- `apps/preview/src/components/ui/alert-dialog.tsx`
- `apps/preview/src/components/ui/bottom-sheet.tsx`
- `apps/preview/src/components/ui/context-menu.tsx`
- `apps/preview/src/components/ui/dialog.tsx`
- `apps/preview/src/components/ui/dropdown-menu.tsx`
- `apps/preview/src/components/ui/hover-card.tsx`
- `apps/preview/src/components/ui/menubar.tsx`
- `apps/preview/src/components/ui/popover.tsx`
- `apps/preview/src/components/ui/progress.tsx`
- `apps/preview/src/components/ui/select.tsx`
- `apps/preview/src/components/ui/sheet.tsx`
- `apps/preview/src/components/ui/sonner.tsx`
- `apps/preview/src/components/ui/spinner.tsx`
- `apps/preview/src/components/ui/tooltip.tsx`

`native-only-animated-view.tsx` intentionally strips the Animated.View wrapper on web. Preserve that behavior unless the component contract changes.

`animated-icon.web.tsx` intentionally returns `null`. If the icon is now expected on web, treat that as a separate product requirement rather than a motion-engine regression.

## 8. P3 — API, registry, and source cleanup

### 8.1 Resolve dormant exit/repeat/reverse APIs

#### Affected file

- `apps/preview/src/components/ui/motion.tsx`

#### Current failure

The public types/parser expose:

- `exit`
- object-form `repeat`
- `reverse`
- exit-only presets such as fade-out and zoom-out

The generic engine has no presence/unmount coordinator and does not execute those fields.

#### Decision required

Choose one path before implementation:

**Option A — Implement:**

- Add an explicit presence component/controller.
- Keep a child mounted until exit completion.
- Define cancellation and rapid mount/unmount behavior.
- Implement finite/infinite repeat and reverse semantics for object-form animations.
- Define reduced-motion completion behavior.

**Option B — Deprecate:**

- Mark unsupported fields deprecated.
- Emit development warnings when they are supplied.
- Remove claims and exit-only presets from public documentation.
- Remove the fields in the next documented breaking release.

Do not continue silently accepting inert options.

### 8.2 Regenerate registry output from canonical source

#### Canonical files

- `apps/preview/src/components/ui/motion.tsx`
- `apps/preview/src/components/ui/primitives.tsx`
- `packages/lovdacn/registry-src/shared/components/ui/primitives.tsx`
- Style-owned component sources under:
  - `packages/lovdacn/registry-src/nativewind/components/ui`
  - `packages/lovdacn/registry-src/uniwind/components/ui`
- `packages/lovdacn/scripts/build-extra-components.cjs`

The shared registry primitive file is the **plain** seam and must remain free of runtime Reanimated imports. The motion registry item ships the engine and motion-aware seam from preview sources.

#### Generated outputs

There are 20 generated `motion.json` files:

- Families: `nativewind`, `uniwind`
- Styles: `default`, `luma`, `lyra`, `maia`, `mira`, `new-york`, `nova`, `rhea`, `sera`, `vega`
- Root: `apps/v2/public/r/styles/<family>/<style>/motion.json`

#### Build and parity procedure

From `packages/lovdacn`, run the appropriate scripts:

```powershell
pnpm registry:build
pnpm registry:build:all
```

Add a CI parity check that:

1. Runs the generator in a clean checkout.
2. Fails if generated artifacts differ.
3. Verifies every motion registry item contains both `motion.tsx` and the motion-aware `primitives.tsx`.
4. Verifies the plain primitives registry item remains plain.

Never repair individual generated JSON files by hand.

### 8.3 Clean malformed CSS comment bytes

#### Affected file

- `apps/preview/src/global.css`

Replace malformed control characters in the comment with valid UTF-8. Preserve the existing reduced-motion declarations. Validate the file with the normal formatter/parser afterward.

## 9. Implementation sequence

### Phase 0 — Characterization tests

1. Add failing tests for the iframe lost-message race.
2. Add shared-engine tests for SSR visibility, routing, color fallback, and style ownership.
3. Add semantic tests for RadioGroup and Collapsible.
4. Capture native Sheet direction and Sidebar reduced-motion behavior.
5. Record current generated registry hashes/diffs.

Do not begin broad refactoring until the relevant failure has a reproducible test.

### Phase 1 — P0 visibility fixes

1. Implement the iframe protocol and timeout-safe reveal.
2. Implement visible static/hydration output.
3. Remove numeric color fallbacks.
4. Run web fault-injection tests before proceeding.

### Phase 2 — P1 state/style correctness

1. Add canonical host state routing.
2. Fix Button and TextInput behavior through the engine.
3. Implement transform/radius ownership rules.
4. Add local RadioGroup and Collapsible state contexts.
5. Re-run all explicit-adapter tests.

### Phase 3 — P2 parity/accessibility/performance

1. Add the static host fast path.
2. Add top/bottom native Sheet builders.
3. Resolve Tooltip direction policy.
4. Add Sidebar reduced-motion handling.
5. Remove Spinner's unused loop and resolve Progress zero semantics.
6. Expand v2 CSS reduced-motion policy.

### Phase 4 — P3 contract and release work

1. Implement or deprecate exit/repeat/reverse.
2. Clean malformed CSS bytes.
3. Update motion documentation/examples.
4. Regenerate all registry variants.
5. Run parity and clean-checkout installation tests.

## 10. Test matrix

| Area | Static web | Hydrated web | iOS | Android | Reduced motion |
|---|---:|---:|---:|---:|---:|
| Entrance visibility | Required | Required | Required | Required | Required |
| Press/focus routing | N/A | Required | Required | Required | Required |
| Semantic controls | N/A | Required | Required | Required | Required |
| Transform/radius ownership | Required | Required | Required | Required | Required |
| Iframe protocol | N/A | Required | N/A | N/A | Required for transition snap |
| Sheet directions | Web parity | Required | Required | Required | Required |
| Sidebar | Required | Required | Required | Required | Required |
| Continuous loaders | Required | Required | Required | Required | Required |
| Registry installation | Required | Required | Required | Required | N/A |

### Fault-injection scenarios

- JavaScript disabled after static HTML is delivered.
- Hydration throws before effects run.
- First iframe readiness event is dropped.
- Old iframe replies after `src` changed.
- Worklet initialization is unavailable in a test harness.
- Reduced motion changes while an animation is active.
- Component unmounts during entrance, repeat, or exit.
- Press is canceled by pointer cancellation or responder loss.

### Validation commands

Run at minimum after implementation:

```powershell
pnpm --filter preview exec tsc --noEmit --incremental false
pnpm --filter v2 exec tsc --noEmit --incremental false
pnpm --filter preview lint
pnpm --filter v2 lint
```

Also run targeted tests, Expo web static/export validation, Next production build validation, and iOS/Android smoke tests. Do not treat TypeScript success alone as animation validation.

## 11. Complete component inventory

### 11.1 Shared engine and seam

- `apps/preview/src/components/ui/motion.tsx`
- `apps/preview/src/components/ui/primitives.tsx`

### 11.2 Explicit motion adapters — 14 files

These require behavior tests because they explicitly expose or route motion props:

1. `aspect-ratio.tsx`
2. `avatar.tsx`
3. `button.tsx`
4. `checkbox.tsx`
5. `collapsible.tsx`
6. `icon.tsx`
7. `label.tsx`
8. `radio-group.tsx`
9. `separator.tsx`
10. `skeleton.tsx`
11. `switch.tsx`
12. `tabs.tsx`
13. `toggle-group.tsx`
14. `toggle.tsx`

### 11.3 Remaining primitive-seam consumers — 25 files

These inherit shared-engine visibility, style ownership, and no-motion overhead. Most should need regression coverage rather than individual logic changes:

1. `accordion.tsx`
2. `alert-dialog.tsx`
3. `alert.tsx`
4. `badge.tsx`
5. `bottom-sheet.tsx`
6. `breadcrumb.tsx`
7. `calendar.tsx`
8. `card.tsx`
9. `carousel.tsx`
10. `context-menu.tsx`
11. `dialog.tsx`
12. `dropdown-menu.tsx`
13. `input-otp.tsx`
14. `input.tsx`
15. `menubar.tsx`
16. `popover.tsx`
17. `progress.tsx`
18. `select.tsx`
19. `sheet.tsx`
20. `sidebar.tsx`
21. `sonner.tsx`
22. `spinner.tsx`
23. `text.tsx`
24. `textarea.tsx`
25. `tooltip.tsx`

All paths in sections 11.2 and 11.3 are relative to `apps/preview/src/components/ui`.

### 11.4 Direct-animation inventory — 19 files

1. `apps/preview/src/components/animated-icon.tsx`
2. `apps/preview/src/components/ui/accordion.tsx`
3. `apps/preview/src/components/ui/alert-dialog.tsx`
4. `apps/preview/src/components/ui/bottom-sheet.tsx`
5. `apps/preview/src/components/ui/context-menu.tsx`
6. `apps/preview/src/components/ui/dialog.tsx`
7. `apps/preview/src/components/ui/dropdown-menu.tsx`
8. `apps/preview/src/components/ui/hover-card.tsx`
9. `apps/preview/src/components/ui/menubar.tsx`
10. `apps/preview/src/components/ui/motion.tsx`
11. `apps/preview/src/components/ui/native-only-animated-view.tsx`
12. `apps/preview/src/components/ui/popover.tsx`
13. `apps/preview/src/components/ui/progress.tsx`
14. `apps/preview/src/components/ui/select.tsx`
15. `apps/preview/src/components/ui/sheet.tsx`
16. `apps/preview/src/components/ui/sonner.tsx`
17. `apps/preview/src/components/ui/spinner.tsx`
18. `apps/preview/src/components/ui/tooltip.tsx`
19. `apps/preview/src/components/ui/sidebar.tsx` — React Native core `Animated`

## 12. Definition of done

The remediation is complete only when all statements below are true:

- [ ] A preview iframe recovers when its first readiness event is lost.
- [ ] No iframe remains permanently transparent after timeout.
- [ ] Static Expo web output contains visible motion-enabled content.
- [ ] Initial hydration does not flash visible content to opacity zero.
- [ ] Reduced-motion output is final and visible from first paint.
- [ ] Button's default press animation works.
- [ ] TextInput shorthand maps to focus.
- [ ] Active-only colors never receive numeric zero as an idle endpoint.
- [ ] Static transforms and radii follow a documented ownership rule.
- [ ] RadioGroup items reflect the root value.
- [ ] Controlled and uncontrolled Collapsible state both animate correctly.
- [ ] Sheet animates from all four sides on iOS and Android.
- [ ] Tooltip direction behavior is intentional for all sides.
- [ ] Sidebar snaps when reduced motion is enabled.
- [ ] Static primitive hosts avoid Reanimated hooks and styles.
- [ ] Exit/repeat/reverse are implemented or explicitly deprecated.
- [ ] Preview and v2 type checks, lint, builds, and targeted tests pass.
- [ ] iOS and Android smoke tests pass with motion enabled and reduced.
- [ ] All 20 motion registry files regenerate without an unexplained diff.
- [ ] Clean-install tests verify plain and motion-aware primitive variants.
- [ ] No generated registry JSON was edited manually.

## 13. Risks and rollout

### Main risks

- Hydration-aware entrance changes can introduce visible flashes if server and first-client snapshots differ.
- Adding wrappers to solve transform composition can alter layout, refs, hit testing, or primitive `asChild` semantics.
- Converting Collapsible state management can duplicate callbacks if controlled-state forwarding is not carefully tested.
- A protocol timeout that reveals too aggressively can expose a partially initialized iframe; use an explicit safe/error state.
- Registry changes can drift between preview source, style-specific sources, and generated output.

### Rollout strategy

1. Land characterization tests separately where practical.
2. Land the P0 visibility fixes before performance or API expansion.
3. Test iframe changes under cache-fast loading and multiple simultaneous gallery iframes.
4. Test shared-engine changes against representative components before regenerating registry output.
5. Regenerate and review registry changes in one dedicated change set.
6. Keep rollback possible by separating protocol, engine, adapter, and generated-artifact commits.

## 14. Expected outcome

After this plan is implemented, animated wrappers will fail open—showing usable content—rather than fail closed at opacity zero. Interaction states will map consistently, component state adapters will reflect their real primitive state, native direction behavior will match documented intent, reduced motion will be predictable, and published registry output will remain reproducible.


## 15. Three-agent parallel execution plan

This section is designed to be handed to three separate agents. **Wave 1 is parallel:** all three agents start from the same repository baseline and work at the same time in non-overlapping files. Tasks that depend on another agent are explicitly placed behind an integration barrier.

### 15.1 Parallel-work rules

1. Create a separate branch or worktree for each agent from the same baseline revision.
2. Read the applicable `AGENTS.md` before changing files.
3. Each file has exactly one owner during parallel work.
4. Do not edit a file assigned to another agent, even for formatting or a small import cleanup.
5. If an out-of-scope file is required, stop and request an ownership transfer from the coordinator.
6. Do not install or upgrade dependencies and do not modify lockfiles.
7. Do not hand-edit anything under `apps/v2/public/r/styles` during Wave 1.
8. Do not run registry generation during Wave 1. Generated output depends on Agent 1's canonical motion changes and Agent 3's registry integration work.
9. The root `ANIMATION_MOTION_REMEDIATION_PLAN.md` is coordinator-owned and read-only to all implementation agents.
10. Preserve unrelated working-tree changes. Stage or report only owned files.
11. Do not create commits unless the coordinator explicitly requests commits.
12. Every handoff must include changed files, tests run, results, unresolved decisions, and risks.

Suggested isolated branches/worktrees:

- Agent 1: `fix/motion-engine`
- Agent 2: `fix/preview-handshake`
- Agent 3: `fix/direct-motion-parity`

### 15.2 Exclusive ownership matrix

| Area | Agent 1 | Agent 2 | Agent 3 |
|---|---:|---:|---:|
| Shared motion engine and motion-aware primitive seam | Owner | No edit | No edit |
| Explicit shared-motion adapters | Owner | No edit | No edit |
| Iframe parent/child readiness protocol | No edit | Owner | No edit |
| v2 reduced-motion CSS | No edit | Owner | No edit |
| Direct component animations and native parity | No edit | No edit | Owner |
| Preview global CSS byte cleanup | No edit | No edit | Owner |
| Registry generation scripts/parity checks | No edit | No edit | Owner |
| Generated registry artifacts | No edit | No edit | Agent 3, **after barrier only** |
| Root remediation plan | No edit | No edit | No edit |

#### Agent 1 exclusive source ownership

- `apps/preview/src/components/ui/motion.tsx`
- `apps/preview/src/components/ui/primitives.tsx`
- `apps/preview/src/components/ui/aspect-ratio.tsx`
- `apps/preview/src/components/ui/avatar.tsx`
- `apps/preview/src/components/ui/button.tsx`
- `apps/preview/src/components/ui/checkbox.tsx`
- `apps/preview/src/components/ui/collapsible.tsx`
- `apps/preview/src/components/ui/icon.tsx`
- `apps/preview/src/components/ui/label.tsx`
- `apps/preview/src/components/ui/radio-group.tsx`
- `apps/preview/src/components/ui/separator.tsx`
- `apps/preview/src/components/ui/skeleton.tsx`
- `apps/preview/src/components/ui/switch.tsx`
- `apps/preview/src/components/ui/tabs.tsx`
- `apps/preview/src/components/ui/toggle-group.tsx`
- `apps/preview/src/components/ui/toggle.tsx`
- Matching adapter files under `packages/lovdacn/registry-src/nativewind/components/ui` and `packages/lovdacn/registry-src/uniwind/components/ui`, if the generator identifies them as canonical sources.
- New tests dedicated to the engine or these adapters.

#### Agent 2 exclusive source ownership

- `apps/v2/components/block-preview.tsx`
- `apps/v2/components/component-preview-card.tsx`
- `apps/v2/app/create/customizer.tsx`
- `apps/v2/app/globals.css`
- `apps/preview/src/app/present.tsx`
- `apps/preview/src/app/customizer-preview.tsx`
- New app-local protocol helpers under `apps/v2/lib` or `apps/preview/src/lib`, if needed.
- New tests dedicated to the iframe protocol or v2 transition policy.

#### Agent 3 exclusive source ownership

- `apps/preview/src/components/animated-icon.tsx`
- `apps/preview/src/components/animated-icon.web.tsx`
- `apps/preview/src/components/ui/accordion.tsx`
- `apps/preview/src/components/ui/alert-dialog.tsx`
- `apps/preview/src/components/ui/bottom-sheet.tsx`
- `apps/preview/src/components/ui/context-menu.tsx`
- `apps/preview/src/components/ui/dialog.tsx`
- `apps/preview/src/components/ui/dropdown-menu.tsx`
- `apps/preview/src/components/ui/hover-card.tsx`
- `apps/preview/src/components/ui/menubar.tsx`
- `apps/preview/src/components/ui/native-only-animated-view.tsx`
- `apps/preview/src/components/ui/popover.tsx`
- `apps/preview/src/components/ui/progress.tsx`
- `apps/preview/src/components/ui/select.tsx`
- `apps/preview/src/components/ui/sheet.tsx`
- `apps/preview/src/components/ui/sidebar.tsx`
- `apps/preview/src/components/ui/sonner.tsx`
- `apps/preview/src/components/ui/spinner.tsx`
- `apps/preview/src/components/ui/tooltip.tsx`
- `apps/preview/src/global.css`
- Matching direct-animation files under `packages/lovdacn/registry-src/nativewind/components/ui` and `packages/lovdacn/registry-src/uniwind/components/ui`, if present and canonical.
- `packages/lovdacn/registry-src/shared/components/ui/primitives.tsx`, only if a parity assertion or comment change is required; the file must remain the plain seam.
- `packages/lovdacn/scripts/build-extra-components.cjs`
- New registry parity tests and direct-animation tests.
- `apps/v2/public/r/styles/<family>/<style>/motion.json` only after the integration barrier.

### 15.3 Shared contracts that are frozen during Wave 1

To keep the work truly parallel:

- Agent 1 must preserve the exported names `durations` and `transitions`; Agent 3's files consume those exports.
- Agent 1 may change internal motion normalization but must not rename public primitive exports without coordinator approval.
- Agent 2 owns all `lvcn:*` protocol message names and must report the final schema in its handoff.
- Agent 3 must not compensate for an engine bug inside a direct-animation component. Report the dependency to Agent 1 instead.
- Agent 1 and Agent 3 may each add separate test files, but neither may edit the other's test file.
- Shared test configuration, package manifests, TypeScript configuration, and lockfiles are coordinator-owned unless ownership is explicitly reassigned.

### 15.4 Parallel waves and integration barriers

#### Wave 0 — Coordinator baseline

Before starting agents:

1. Record the baseline revision and existing working-tree changes.
2. Create three isolated branches/worktrees from that same baseline.
3. Give each agent only its assignment below plus this plan path.
4. Confirm no agent intends to install dependencies or regenerate the registry during Wave 1.

#### Wave 1 — Run all three agents in parallel

- **Agent 1:** engine, primitive seam, and semantic adapters.
- **Agent 2:** iframe protocol and v2 CSS reduced-motion behavior.
- **Agent 3:** direct-animation parity, core Animated accessibility, loop efficiency, preview CSS cleanup, and registry parity-test preparation.

All Wave 1 work is file-isolated and may proceed concurrently.

#### Integration barrier A — Source handoff

Do not cross this barrier until:

- Agent 1 reports its final public motion contract and passing targeted checks.
- Agent 2 reports the final message schema and passing lost-message tests.
- Agent 3 reports direct-animation changes and passing targeted checks.
- The coordinator verifies each agent changed only owned files.

Recommended source integration order:

1. Agent 1 source changes.
2. Agent 2 source changes.
3. Agent 3 direct-animation and CSS source changes.

Because ownership does not overlap, the order should not require conflict resolution. If a conflict appears, stop and investigate the ownership violation rather than accepting one side automatically.

#### Wave 2 — Parallel post-integration verification

After source integration:

- Agent 1 reruns shared-engine and adapter tests against the integrated tree.
- Agent 2 reruns iframe tests and the v2 type/lint/build checks against the integrated tree.
- Agent 3 verifies direct-animation tests against Agent 1's final exports and prepares registry generation.

These checks may run in parallel. Agent 3 still must not write generated output until the coordinator confirms Agent 1's canonical source is integrated.

#### Integration barrier B — Registry generation

After Agent 1 and Agent 3 source changes are both integrated:

1. Coordinator authorizes Agent 3 to run registry generation.
2. Agent 3 runs `registry:build` / `registry:build:all` from `packages/lovdacn`.
3. Agent 3 verifies all 20 `motion.json` outputs and reports the generated diff.
4. No other agent edits generated registry files.
5. Coordinator runs final cross-app validation.

### 15.5 Agent 1 assignment — Shared motion engine and semantic adapters

#### Mission

Repair the shared animation runtime so it is visible by default, routes interaction state correctly, protects static style ownership, and provides an actual no-motion fast path. Repair semantic adapters that cannot derive their real selected/open state.

**You are working in parallel with Agent 2 and Agent 3. Edit only Agent 1-owned files.**

#### Required reading

- Sections 5.2, 5.3, 6, 7.1, 8.1, 10, 11.1, and 11.2 of this plan.
- `apps/preview/AGENTS.md`.
- Installed Expo 57/Reanimated behavior before changing SSR or reduced-motion assumptions.

#### Work package A1.1 — Add characterization tests first

Add focused tests for:

- static/server-visible output for fade, slide, and zoom presets,
- reduced motion starting at the final visible value,
- Button shorthand mapping to press,
- TextInput shorthand mapping to focus,
- View/Text shorthand mapping to semantic `motionActive`,
- explicit state-map precedence,
- active-only color behavior,
- static transform/radius ownership,
- controlled RadioGroup selected state,
- controlled and uncontrolled Collapsible state,
- no-motion host selection and ref preservation.

Do not weaken assertions merely to match the current implementation. Record any case that cannot be represented in the existing test harness.

#### Work package A1.2 — SSR/hydration-safe entrance behavior

Implement the invariants from section 5.2:

1. Server/static output is final and visible.
2. First client output matches the server.
3. Components present during hydration skip entrance.
4. Components mounted after hydration may enter.
5. Native/client-only mounts retain entrance behavior.
6. Reduced motion is final from first paint.
7. Motion startup failure leaves content usable.

Keep hydration tracking internal to the motion runtime unless a public provider is demonstrably necessary. If a provider is introduced, document default behavior when it is absent.

#### Work package A1.3 — Safe property normalization

- Remove numeric zero fallback for colors.
- Require/document valid idle and active color endpoints.
- Remove invented radius zero for one-sided active radius animation.
- Add development warnings for unsupported one-sided properties.
- Ensure disabled and inactive states restore static styling according to the documented ownership contract.

#### Work package A1.4 — Canonical host routing

Implement host-specific shorthand channels:

- Pressable → press
- TextInput → focus
- View/Text → semantic
- Slot → explicit host/channel behavior

Preserve explicit state-map precedence and existing user-handler composition. Verify Button's default `press` preset without adding a Button-specific workaround.

#### Work package A1.5 — Transform and radius ownership

- Define and document whether the animated host owns, composes, or rejects a conflicting transform/radius.
- Prefer no extra wrapper unless ref, layout, hit-testing, accessibility, and `asChild` behavior are proven unchanged.
- Add development diagnostics for detectable conflicts.
- Remove inaccurate comments that claim static transform arrays cannot be clobbered.

#### Work package A1.6 — Semantic state repairs

RadioGroup:

- Add local root-value context.
- Compare root value to item value.
- Preserve explicit `motionActive` override.
- Do not use private primitive context APIs.

Collapsible:

- Resolve `open`, `defaultOpen`, and `onOpenChange` locally.
- Provide resolved state to Root, Trigger, and Content.
- Ensure callback invocation occurs exactly once.
- Do not use private primitive context APIs.

Regression-only adapters:

- Preserve controlled-only Checkbox, Switch, and Toggle behavior.
- Preserve Tabs and ToggleGroup context-derived behavior.
- Preserve Skeleton's CSS-pulse versus motion-owner selection.

#### Work package A1.7 — No-motion fast path

- Split static and animated host implementations so hooks are not conditional.
- Raw hosts must be used when no motion is configured.
- Motion hosts must retain ref and prop compatibility.
- Button must still choose the animated path because it supplies a default press preset.

#### Work package A1.8 — Dormant API decision gate

Do not silently implement a partial presence API. Prepare one of these for coordinator approval:

- a complete, tested exit/repeat/reverse implementation, or
- deprecation warnings and documentation removal for currently inert fields.

This work may follow the main engine fixes but remains Agent 1-owned because it changes `motion.tsx`.

#### Agent 1 validation

Run targeted tests, then at minimum:

```powershell
pnpm --filter preview exec tsc --noEmit --incremental false
pnpm --filter preview lint
```

Do not run registry generation.

#### Agent 1 handoff format

Report:

1. Exact files changed.
2. Public motion API or behavior changes.
3. SSR/hydration strategy and why static output remains visible.
4. Color and transform/radius ownership contract.
5. RadioGroup and Collapsible state strategy.
6. Tests and commands with pass/fail results.
7. Any deferred exit/repeat/reverse decision.
8. Confirmation that no Agent 2/3 or generated files were edited.

#### Agent 1 prohibited work

- Do not edit iframe host/presenter files.
- Do not edit Sheet, Tooltip, Sidebar, Spinner, Progress, overlay animation files, or global CSS.
- Do not edit registry scripts or generated JSON.
- Do not add/update dependencies.

### 15.6 Agent 2 assignment — Iframe protocol and v2 motion policy

#### Mission

Make preview iframe readiness reliable under lost, early, stale, and malicious messages, and ensure the v2 host never leaves a usable iframe permanently transparent. Extend v2 reduced-motion CSS for the affected host transitions.

**You are working in parallel with Agent 1 and Agent 3. Edit only Agent 2-owned files.**

#### Required reading

- Section 5.1 and section 7.7 of this plan.
- `apps/v2/AGENTS.md` and installed Next.js 16 documentation relevant to client components and iframe event handling.
- `apps/preview/AGENTS.md` before changing presenter files.

#### Work package A2.1 — Characterize the race

Add tests or a deterministic harness covering:

- first `lvcn:ready` message dropped,
- ready message sent before parent listener registration,
- rapid iframe `src` replacement,
- stale ready message from a previous session,
- wrong source window,
- wrong origin,
- child never becomes ready,
- theme/preset change before readiness.

The test must fail against the one-shot implementation and pass after the protocol change.

#### Work package A2.2 — Define one protocol schema

Own and document the final message schema. It must include:

- readiness request,
- ready response,
- acknowledgment,
- a session identifier or nonce,
- preset/theme delivery associated with the current session.

If app-local helper modules are introduced, keep parent and child constants synchronized and test the schema. Do not introduce a new package solely for these small protocol types unless approved.

Suggested timing defaults, unless tests justify alternatives:

- readiness request/retry interval: 250 ms,
- safe reveal/error timeout: 5 seconds,
- retry cleanup immediately after acknowledgment or unmount.

Keep these as named constants rather than unexplained numbers.

#### Work package A2.3 — Parent implementation

For `block-preview.tsx`, `component-preview-card.tsx`, and the customizer host:

1. Reset protocol state when `src` changes.
2. Generate a current session identifier.
3. Register and clean up the message listener.
4. Send readiness request from iframe `onLoad`.
5. Retry until ready/acknowledged or timed out.
6. Validate source, origin, message type, and session.
7. On ready, reveal iframe, send current configuration, and acknowledge.
8. On timeout, show a visible recoverable state; never retain permanent `opacity-0`.
9. Ensure late events cannot update an unmounted or newer iframe.

Use an accessible loading/error/retry presentation. Reduced motion should remove or effectively snap the opacity transition without suppressing the state change.

#### Work package A2.4 — Child implementation

For `present.tsx` and `customizer-preview.tsx`:

1. Install the parent-message listener.
2. Validate source and allowed parent origin.
3. Send ready on mount.
4. Respond to each readiness request idempotently.
5. Retry ready until acknowledgment.
6. Apply current-session configuration idempotently.
7. Stop timers/listeners on acknowledgment or unmount.
8. Avoid wildcard target origins when a validated origin is available.

Document local-development origin handling without weakening production validation.

#### Work package A2.5 — v2 reduced-motion CSS

Update only `apps/v2/app/globals.css` for this workstream:

- cover iframe opacity and related nonessential transitions,
- preserve immediate visibility/state changes,
- avoid a blanket rule that breaks essential UI feedback,
- test both normal and reduced-motion media queries.

Do not edit `apps/preview/src/global.css`; Agent 3 owns it.

#### Agent 2 validation

Run targeted protocol tests, then at minimum:

```powershell
pnpm --filter v2 exec tsc --noEmit --incremental false
pnpm --filter preview exec tsc --noEmit --incremental false
pnpm --filter v2 lint
```

If affordable, run the relevant v2 production build after integration. Do not run a long-lived server as proof of correctness without also running deterministic race tests.

#### Agent 2 handoff format

Report:

1. Exact files changed.
2. Final message union/schema and timing constants.
3. Parent and child state-machine summary.
4. Source/origin/session validation rules.
5. Timeout and user-visible recovery behavior.
6. Tests and commands with pass/fail results.
7. Local-development origin considerations.
8. Confirmation that no Agent 1/3 or generated files were edited.

#### Agent 2 prohibited work

- Do not edit the shared motion engine or adapters.
- Do not edit direct-animation components or preview global CSS.
- Do not edit registry source, scripts, or generated JSON.
- Do not add/update dependencies.

### 15.7 Agent 3 assignment — Direct animation parity, accessibility, and registry integration

#### Mission

Fix direct component animation inconsistencies, handle reduced motion where Reanimated's default does not apply, eliminate unnecessary loops, clean preview CSS encoding, and perform registry integration after Agent 1's canonical source is available.

**You are working in parallel with Agent 1 and Agent 2. Edit only Agent 3-owned files. Registry output is blocked until Integration Barrier B.**

#### Required reading

- Sections 7, 8.2, 8.3, 10, and 11.4 of this plan.
- `apps/preview/AGENTS.md`.
- Installed Reanimated 4.5 reduced-motion behavior. Do not assume every direct Reanimated call needs a custom hook.

#### Work package A3.1 — Characterize direct animations

Add focused tests or testable helpers for:

- Sheet left/right/top/bottom native builder selection,
- Tooltip side policy,
- Sidebar normal and reduced-motion final values,
- Spinner `nativeOnly` branch not starting unused rotation,
- Progress value zero semantics,
- direct entering/exiting animations reaching the correct final state under reduced motion.

Treat `native-only-animated-view.tsx` returning children on web as intentional. Treat `animated-icon.web.tsx` returning `null` as intentional unless the coordinator changes the product requirement.

#### Work package A3.2 — Sheet native parity

Implement and verify all four native side mappings:

- left: `SlideInLeft` / `SlideOutLeft`,
- right: `SlideInRight` / `SlideOutRight`,
- top: `SlideInUp` / `SlideOutUp`,
- bottom: `SlideInDown` / `SlideOutDown`.

Confirm direction against installed Reanimated rather than relying only on names. Preserve web classes and overlay behavior.

#### Work package A3.3 — Tooltip policy

Choose one coherent implementation and document it in the handoff:

- map all four final sides to corresponding movement, or
- use a direction-neutral fade/scale for every side.

Prefer the resolved placement side when the primitive exposes it. Do not animate in a direction that contradicts collision-adjusted placement.

#### Work package A3.4 — Sidebar reduced motion

- Use React Native `AccessibilityInfo` to obtain and subscribe to reduced-motion preference.
- Snap width, opacity, and overlay values to the final state when reduced.
- Cancel in-flight core Animated transitions before snapping/restarting.
- Handle preference changes while mounted.
- Preserve desktop and mobile behavior.

Do not add redundant reduced-motion wrappers to Reanimated builders already using `ReduceMotion.System` unless a test demonstrates a gap.

#### Work package A3.5 — Spinner and Progress

Spinner:

- Do not start the custom Reanimated loop when `nativeOnly` renders an `ActivityIndicator`.
- Confirm cleanup on prop changes and unmount.
- Document whether a non-moving loading state is required beyond platform/Reanimated defaults.

Progress:

- Verify native/web behavior at 0, negative, midpoint, 100, and greater than 100.
- Default recommendation: represent semantic value 0 as 0% unless the visible sliver is an intentional documented product choice.
- Keep clamping equivalent across platforms.

#### Work package A3.6 — Direct-animation regression pass

Review, test, and change only if a concrete defect is reproduced:

- Accordion
- AlertDialog
- BottomSheet
- ContextMenu
- Dialog
- DropdownMenu
- HoverCard
- Menubar
- Popover
- Select
- Sonner
- AnimatedIcon
- NativeOnlyAnimatedView

Installed Reanimated 4.5 defaults timing, spring, repeat, layout, entering/exiting, and keyframes to system reduced motion. Avoid unnecessary per-component code that duplicates this behavior.

#### Work package A3.7 — Preview CSS cleanup

For `apps/preview/src/global.css`:

- replace malformed comment control bytes with valid UTF-8,
- preserve the existing broad reduced-motion behavior,
- validate CSS parsing and formatting,
- do not edit v2 global CSS; Agent 2 owns it.

#### Work package A3.8 — Registry parity preparation during Wave 1

During Wave 1, Agent 3 may:

- inspect `build-extra-components.cjs`,
- add or prepare a generated-parity test,
- verify source-to-output mappings,
- verify that the plain primitive seam remains plain.

During Wave 1, Agent 3 must **not**:

- regenerate the 20 `motion.json` files,
- copy Agent 1's in-progress engine manually,
- edit generated JSON by hand.

#### Work package A3.9 — Registry generation after Barrier B

Only after coordinator authorization:

1. Sync the integrated Agent 1 engine/seam and Agent 3 direct source changes.
2. Run from `packages/lovdacn`:

```powershell
pnpm registry:build
pnpm registry:build:all
```

3. Verify all 20 nativewind/uniwind style outputs.
4. Confirm each motion item contains both engine and motion-aware seam.
5. Confirm the plain primitive item has no Reanimated runtime dependency.
6. Review generated diffs for unexpected unrelated formatting/content.
7. Run the parity test from a clean state if available.

#### Agent 3 validation

Before Barrier B, run targeted direct-animation tests and:

```powershell
pnpm --filter preview exec tsc --noEmit --incremental false
pnpm --filter preview lint
```

After Barrier B, run registry parity and clean-install validation in addition to the above.

#### Agent 3 handoff format

Report:

1. Exact files changed before and after Barrier B.
2. Sheet and Tooltip direction decisions.
3. Sidebar reduced-motion behavior.
4. Spinner and Progress behavior decisions.
5. Direct files reviewed but intentionally unchanged.
6. Preview CSS encoding result.
7. Tests and commands with pass/fail results.
8. Registry command output and complete list/count of generated files.
9. Confirmation that no Agent 1/2 files were edited.

#### Agent 3 prohibited work

- Do not edit `motion.tsx`, the motion-aware `primitives.tsx`, or Agent 1 adapters.
- Do not edit iframe protocol files or v2 global CSS.
- Do not regenerate registry output before Barrier B.
- Do not add/update dependencies.

### 15.8 Coordinator handoff checklist

For each agent, require this exact summary:

```text
Agent:
Baseline revision:
Owned files changed:
Unexpected files changed: none / list
Behavior completed:
Tests added:
Commands run and results:
Public contracts changed:
Open decisions:
Known risks:
Ready to integrate: yes/no
```

Then verify:

- [ ] Agent 1 changed only engine/seam/adapter-owned files.
- [ ] Agent 2 changed only iframe/v2-policy-owned files.
- [ ] Agent 3 changed only direct-animation/CSS/registry-owned files.
- [ ] No lockfile or dependency change occurred.
- [ ] No generated file was manually edited.
- [ ] Agent 1 preserved `durations` and `transitions` exports used by Agent 3.
- [ ] Agent 2 documented message names, session handling, origins, retry, and timeout.
- [ ] Agent 3 waited for Barrier B before registry generation.
- [ ] Integrated preview and v2 type checks pass.
- [ ] Integrated lint and targeted tests pass.
- [ ] Static web, hydrated web, iOS, Android, and reduced-motion smoke tests pass.
- [ ] Registry generation is reproducible with no unexplained diff.

### 15.9 Work that is parallel versus blocked

#### Safe to run immediately in parallel

- Agent 1 engine and adapter characterization/implementation.
- Agent 2 iframe race tests and protocol implementation.
- Agent 3 direct-animation tests/fixes and preview CSS cleanup.
- Agent 3 registry parity-test preparation that does not write generated output.

#### Explicitly blocked until Agent 1 handoff

- Agent 3 validation against Agent 1's final motion exports.
- Any generated motion registry update.
- Clean-install tests of the final motion registry item.

#### Explicitly blocked until all source handoffs

- Full cross-app build/smoke validation.
- Final registry generation and diff approval.
- Completion of the section 12 definition-of-done checklist.

This separation is mandatory: running the agents concurrently is safe only while each agent stays inside its exclusive ownership boundary and respects both integration barriers.

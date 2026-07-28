# Animation Plan V3 — Primitive Layer (definitive)

> **Status:** Authoritative. Replaces the earlier V3 draft.
> **Supersedes:** [`ANIMATIONS_NEW.md`](./ANIMATIONS_NEW.md)'s forced-dependency model and
> [`ANIMATIONS.md`](./ANIMATIONS.md)'s "Motion host only" scope.
> **Already shipped (beta):** `feat/animate-beta` / `lovdacn@0.2.0-beta.0` — the engine,
> `Motion`, `useMotion`, hosts, presets, reduced motion, and Button as reference. This plan
> adds the **primitive seam** that makes it scale, and fixes the audited defects.

---

## 1. What we are fixing (audited, with evidence)

Today lvcn has **four unrelated animation systems** and no public API:

| # | Problem | Evidence in repo |
|---|---|---|
| P1 | **No public animation API.** Users cannot customize/disable any animation without editing copied source. | No `animate` prop anywhere pre-beta. |
| P2 | **No reduced-motion support at all.** | `useReducedMotion` appears only in the new `motion.tsx`; zero `prefers-reduced-motion` in CSS. Spinner spins forever. |
| P3 | **Same intent written twice** (web CSS vs native Reanimated) → drift. | `dialog.tsx`: web `animate-in fade-in-0` + `zoom-in-95 duration-200`; native `FadeIn.duration(200)`/`FadeOut.duration(150)`. |
| P4 | **Magic numbers everywhere**, no shared tokens. | 200/150/250 repeated across dialog, sheet, bottom-sheet, accordion, popover, tooltip. |
| P5 | **Inconsistent coverage.** Overlays animate richly; Button/Toggle/Checkbox/Tabs have none; menus have `entering` but no `exiting`. | `dropdown-menu`/`context-menu`/`menubar`: `FadeIn` only. |
| P6 | **`withSpring` allocated inside `useAnimatedStyle`.** | `progress.tsx` `NativeIndicator`. |
| P7 | **Preview ↔ registry drift.** | `skeleton.tsx` (preview) = `animate-pulse` class; published `skeleton.json` = Reanimated `withRepeat` loop. |
| P8 | **No canonical registry source.** Builders fall back to generated output. | `REUSABLES_SRC` → `react-native-reusables/...` does not exist; `build-registry.cjs` rebuilds from `public/r/styles/<engine>/default/*.json`. |
| P9 | **Four systems, no vocabulary.** CSS classes, layout animations, shared values, NativeWind state classes. | Switch = classes only; Carousel = `scrollToIndex({animated:true})`. |
| P10 | **Animation would force Reanimated on every app** if we naively add `animate` everywhere. | Rejected V2 model. |

Goal: **one engine, one vocabulary, `animate` on everything, still opt-in, zero per-component
work to scale.**

---

## 2. Architecture — three layers

```text
        ┌─────────────────────────────────────────────────────────┐
        │ components (41)  —  render hosts from ./primitives      │
        │ <Pressable animate={…} activeAnimate={…}>               │
        └───────────────────────────┬─────────────────────────────┘
                                    │  (one import seam)
        ┌───────────────────────────▼─────────────────────────────┐
        │ components/ui/primitives.tsx   ← THE SWAPPABLE LAYER    │
        │  plain variant : strips motion props, renders RN host   │
        │  motion variant: renders engine-backed animated host    │
        └───────────────────────────┬─────────────────────────────┘
                                    │
        ┌───────────────────────────▼─────────────────────────────┐
        │ components/ui/motion.tsx  — engine                      │
        │  useMotion · presets/tokens · Motion wrapper · MotionConfig │
        └─────────────────────────────────────────────────────────┘
```

**Layer 1 — components.** Import `Pressable`/`View`/`Text`/`TextInput` from
`@/components/ui/primitives` instead of `react-native`, and forward `animate`/`activeAnimate`.
This is the *only* change most components ever need. Fixes **P1, P5**.

**Layer 2 — `primitives.tsx` (the seam).** Two interchangeable implementations, same public
types:
- *plain* (default, shipped with every component): accepts the motion props, **discards** them,
  renders the raw RN host. No Reanimated import. Types are declared here and are runtime-erased,
  so component prop types compile with zero animation deps. Fixes **P10**.
- *motion-aware* (written by `add motion`): renders the engine-backed host.

**Layer 3 — `motion.tsx` (engine).** Already built. `useMotion`, `motionPresets`,
transition tokens, `Motion` wrapper (+ `asChild`), `MotionConfig` provider. Fixes **P2, P4, P9**.

### Why this scales
- **Components (41→N):** animation lives in the seam + engine. Enabling it library-wide is
  **one file swap**; new components inherit it by rendering through the primitive. Contributors
  write no animation code.
- **Style × engine matrix (2×10=20):** `primitives.tsx` and `motion.tsx` are style-agnostic →
  emitted once (like `spinner`/`sonner`), never multiplied. Turning motion on does **not**
  regenerate the 41×20 component JSONs, because component sources don't change.
- **Runtime:** no `add motion` → plain seam → zero Reanimated.
- **Config:** one engine, one `MotionConfig` → global reduced-motion/defaults are O(1).

---

## 3. Install model (opt-in preserved)

```text
lovdacn init                  → nothing animation-related
lovdacn add button            → button + text + utils + primitives (PLAIN, no Reanimated)
lovdacn add motion            → writes motion.tsx AND overwrites primitives.tsx (motion-aware)
                                + installs react-native-reanimated, react-native-worklets
                              → every installed component now honours `animate`
```

- `primitives` is a new tiny registry item and a `registryDependency` of every component
  (like `utils`), so imports always resolve.
- The `motion` registry item ships **two files**: `components/ui/motion.tsx` and the
  motion-aware `components/ui/primitives.tsx`.
- **Install-order guard (CLI change):** when both are queued (`add button motion`), the plain
  `primitives.tsx` must not clobber the motion-aware one. Rule: skip writing plain
  `primitives.tsx` if the target file contains the `MOTION_PRIMITIVES` marker, and write
  `motion`'s files last. Covered by a CLI test.
- Removing animation later = re-add the plain `primitives` item.

---

## 4. Public API (unchanged from beta)

```ts
animate?: false | MotionPresetName | AnimateConfig            // idle / mount / exit / loop
activeAnimate?: false | MotionPresetName | MotionTarget | ActiveAnimateConfig  // active state
motionActive?: boolean                                        // for stateless hosts
reduceMotion?: 'system' | 'always' | 'never'                  // default: system
```

- **`animate` = animate this component in place** on its own host (no extra node, ref/handlers/
  a11y intact, `asChild`-safe). Primary API.
- **`Motion` = wrap and animate anything** — content with no `animate` prop (custom,
  third-party, plain views), **groups/subtrees**, **exit on unmount**, and a **second
  independent transform layer**. `<Motion asChild>` slots into a single child (merging animated
  style + handlers + ref) when the child forwards `ref`/`style`; otherwise it falls back to a
  real wrapper and warns in dev.
- Canonical active state per component (so one prop means the right thing everywhere):
  Button/Badge→`press`; Input/Textarea→`focus`; Checkbox/Switch/Radio→`checked`;
  Toggle/ToggleGroup/Tabs→`selected`; Accordion/Collapsible→`expanded`;
  Dialog/Sheet/Popover/Select/menus→`open`; Skeleton/Spinner→`loading`;
  Carousel/BottomSheet→`dragging`; static hosts→`motionActive`.

---

## 5. Fix matrix

| Problem | Fix | Phase |
|---|---|---|
| P1 no API | `animate`/`activeAnimate` via the primitive seam on every visual host | 2 |
| P2 no reduced motion | engine `useReducedMotion` + `MotionConfig`; **plus** global CSS `@media (prefers-reduced-motion: reduce)` neutralising `animate-in`/`transition-*`; loops cancel | 1, 3 |
| P3 web/native duplication | **one owner per property.** Overlay enter/exit: web=CSS, native=engine (current split, kept deliberately, documented); everything else: engine owns both platforms and conflicting classes are removed | 3 |
| P4 magic numbers | single token table in `motion.tsx` (`transitions.fast/base/slow`, spring presets); components import them; Tailwind `duration-*` values mirror the same numbers | 1, 3 |
| P5 inconsistent coverage | primitives give every component the prop; add missing `exiting` to dropdown/context/menubar | 2, 3 |
| P6 spring in `useAnimatedStyle` | rewrite `progress` `NativeIndicator` to drive a derived value; `useAnimatedStyle` reads only | 3 |
| P7 preview↔registry drift | canonical source tree + regenerate; reconcile `skeleton` to one implementation (engine pulse when motion installed, CSS `animate-pulse` otherwise) | 0, 3 |
| P8 no canonical source | create `packages/lovdacn/registry-src/<engine>/{components/ui,lib}`, repoint `REUSABLES_SRC`, **fail CI** if missing | 0 |
| P9 four systems | engine becomes the single vocabulary; specialized internals keep their logic but consume shared tokens + reduced-motion policy | 3 |
| P10 forced dependency | plain primitive default; motion strictly opt-in | 1 |

---

## 6. Phases

### Phase 0 — Fix the foundation (prerequisite, unblocks everything)
- Create `packages/lovdacn/registry-src/{nativewind,uniwind}/{components/ui,lib}`; seed from the
  current verified inputs (per-engine `default/*.json` for normal components, `apps/preview` for
  the style-agnostic ones).
- Repoint `REUSABLES_SRC` in `build-registry.cjs` **and** `build-extra-components.cjs`; make a
  missing canonical source a **hard build failure** (no silent rebuild from generated output).
- Add a `registry:verify` step (used in CI) asserting: canonical source present, no item depends
  on a file the CLI doesn't copy, no dependency cycles, graph dedupes.
- **Exit:** `pnpm --filter lovdacn registry:build:all` reproduces current output from canonical
  source; CI fails if the source is missing. (Fixes **P8**, unblocks **P7**.)

### Phase 1 — Land the seam + tokens (engine already exists)
- Add `primitives.tsx` **plain** variant (types + prop-stripping hosts) as registry item
  `primitives`; register in `add.ts` `AVAILABLE_COMPONENTS`, `apps/v2/lib/components.ts`, and
  the extra-components emitter.
- Add the **motion-aware** `primitives.tsx` to the `motion` item (2 files) + CLI install-order
  guard and test.
- Extract transition tokens + presets as the single source in `motion.tsx`; add `MotionConfig`
  (app-level reduced-motion / disable-all / default transition).
- Refactor Button to consume `Pressable` from `primitives` (drop its direct `MotionPressable`
  import) and own its default `activeAnimate: 'press'`.
- **Exit:** with motion absent, Button compiles and renders with zero Reanimated; with
  `add motion`, `<Button animate activeAnimate>` works. (Fixes **P10**, part of **P1/P4**.)

### Phase 2 — Codemod all components onto the seam
- Mechanical migration (ast-grep/codemod + review): swap `from 'react-native'` host imports to
  `from '@/components/ui/primitives'`; thread `animate`/`activeAnimate` through each exported
  visual subcomponent; add `primitives` to each component's `registryDependencies`.
- Batch order: content/display → forms/selection → disclosure/navigation → overlays/menus →
  feedback. Keep provider-only exports (context roots) untouched.
- One-time regeneration of all component JSONs (their imports changed).
- **Exit:** a generated type fixture proves `animate`/`activeAnimate` on every visual export;
  installing any component without motion still pulls no Reanimated. (Fixes **P1, P5**.)

### Phase 3 — Unify the four systems (the real cleanup)
- **Reduced motion everywhere:** engine handles JS-driven motion; add
  `@media (prefers-reduced-motion: reduce)` rules to the global CSS templates to neutralise
  `animate-in`/`transition-*`; Spinner/Skeleton loops stop and settle. (**P2**)
- **One owner per property:** document and enforce the overlay split (web CSS / native engine);
  elsewhere remove classes that animate a property the engine now drives. (**P3**)
- **Tokens:** replace all inline 150/200/250 with shared tokens; Tailwind duration values
  mirror them. (**P4**)
- **Specialized components keep their logic, gain shared policy:** accordion layout +
  chevron, switch thumb, progress fill, sheet/bottom-sheet slides, sonner stack, carousel
  scroll. Rewrite `progress` `NativeIndicator` off the in-style `withSpring`. (**P6, P9**)
- **Menus:** add `exiting` to dropdown/context/menubar. (**P5**)
- **Skeleton:** single implementation, drift removed. (**P7**)
- **Exit:** no property animated by two systems; every default animation respects reduced
  motion; no magic numbers left in component sources.

### Phase 4 — `Motion` completeness
- `MotionSlot` (`asChild`) with ref/handler/style merging, dev warning when the child can't
  accept them, and the no-nested-pressable rule.
- Group/stagger helper for lists, and documented enter/exit usage.
- **Exit:** wrapping third-party content, groups, and exits all work; `asChild` adds no node.

### Phase 5 — Utility strings (optional sugar)
- `animate="fade-in slide-up duration-200"` compiles to the same object config; bounded token
  set; parser diagnostics; object/string parity tests. Object API stays canonical.

### Phase 6 — Release
- Regenerate all 20 engine/style outputs; docs per component (default, custom, disabled,
  reduced-motion examples); changelog noting `primitives` as a new dependency of every
  component and that animation remains opt-in.
- Verify a clean Expo consumer: `add button` (no Reanimated) then `add motion` (animation live).

---

## 7. Invariants (non-negotiable)

1. One animated host per interaction; never nest animated pressables.
2. One owner per animated property (engine **or** CSS, never both).
3. Animations start when a target changes (`useDerivedValue`); `useAnimatedStyle` only reads.
   Never allocate `withSpring`/`withTiming` per frame. Never use React state per frame.
4. Only keys present in the resolved target are emitted, so static styles aren't clobbered;
   motion-owned root transforms are normalized into one stable array.
5. Compose user handlers — every caller callback fires exactly once. Refs resolve to the real
   host. `disabled`/read-only never enter interaction motion.
6. Animation observes `@rn-primitives` state; it never owns business state, and never delays
   `onPress`/`onValueChange`/`onOpenChange`.
7. Reduced motion preserves essential state (checked marks, open content, focus rings, progress
   values); it removes movement, not information.
8. `packages/lovdacn` stays CLI-only; runtime motion lives in copied registry files.

## 8. Validation

- Unit: preset/config normalization; `undefined` vs `false` vs override for both props; state
  precedence (`disabled → dragging → press → semantic → focus → hover → idle`); reduced-motion
  snap; loop cancellation on unmount; handler composition fires once.
- Interaction: Button press/cancel/disabled; Checkbox/Switch controlled+uncontrolled;
  Tabs/Toggle selected; Input focus; Accordion/Collapsible expanded; Dialog/Sheet/Popover
  open-close incl. portal cleanup; `asChild` forwarding; Spinner/Skeleton unmount.
- Registry: `primitives` in every component's `registryDependencies`; `motion.json` carries
  both files + Reanimated/Worklets; no cycles; canonical source enforced; clean-consumer install
  test for both the no-motion and motion paths.
- Commands: `pnpm --filter lovdacn test`, `registry:build:all`, `registry:verify`,
  `pnpm check-types`, `pnpm --filter preview lint`, plus iOS/Android/web preview and a
  production profile confirming no per-frame renders and no animation surviving unmount.

## 9. Rejected alternatives

| Option | Why rejected |
|---|---|
| Force `motion` into all 41 components (V2) | Breaks opt-in; every app pays Reanimated even with no animation. |
| Per-component plain/`.animate` registry variants | Multiplies the matrix (41×2×20 ≈ 1600 JSONs); doubles review surface. |
| `lovdacn apply animate` CLI that rewrites installed components | Edits user-customized files; fragile; fights "you own the code". |
| Wrapper-only (`Motion` for everything) | Can't do in-place press feedback (component owns the press host); extra node per element; breaks `asChild`/flex layout. |
| `Motion` wrapper *inside* every component | The host is already the parent — no visual gain; adds a node ×41, breaks `asChild` triggers, flex sizing, and absolute positioning. |
| Moti / Framer-style string DSL first | Rebuilds an existing library; string form should compile to the object config, not be the source of truth. |

## 10. Success criteria

- No `add motion` → zero animation files, zero Reanimated, components still compile and work.
- `add motion` → every installed component honours customizable `animate`/`activeAnimate`.
- `Motion` covers third-party content, groups, exits, and extra layers; `asChild` adds no node.
- Every animation (engine and CSS) respects reduced motion; loops stop and settle.
- No property driven by two systems; no magic durations in component sources.
- Canonical registry source enforced in CI; preview and registry no longer drift.

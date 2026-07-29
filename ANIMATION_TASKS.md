# Animation Rollout — Working Checklist

Execution tracker for `ANIMATIONS_V3.md`. Work **one step at a time**; each step is small,
independently verifiable, and safe to stop after. Update the status boxes as we go.

Branch: `feat/animate-beta` · Commits so far: `11cb453` (engine + Button), `d01e33c` (seam, 1.0.0-beta.0)

---

## Hard constraints / findings (verified)

| # | Finding | Impact |
|---|---|---|
| C1 | **npm NOT authenticated** — `npm whoami` → `E401 Unauthorized`. | Cannot publish. Needs `npm login` by the owner, or an `NPM_TOKEN`. |
| C2 | **`1.0.0-beta.5` is ALREADY published** on the `beta` tag (`latest` = `0.1.4`). | Local `1.0.0-beta.0` is *behind*; npm will reject it. Must publish as **`1.0.0-beta.6`**. |
| C3 | 10 component files use RN hosts in **type positions** (`React.RefAttributes<View>`, `Ref<Text>`, `ComponentRef<typeof Pressable>`) — carousel(5), card(4), alert, badge, input, input-otp, skeleton, spinner, textarea. | The seam must export host **instance types** with the same names, or every codemod breaks types. Do this BEFORE any codemod (Step 1). |
| C4 | Normal components are regenerated from `public/r/styles/<engine>/default/*.json` fixtures, not from preview. | Preview edits do **not** reach published component JSONs until Phase 0 (Step 14). Steps 3–6 are preview-only until then. |
| C5 | Components must never import `@/components/ui/motion` directly. | Would force Reanimated on every app and break opt-in. Shared tokens must live in the **seam** (Step 2). |
| C6 | Unrelated WIP (`present.tsx`, `dashboard-01/02.tsx`) must stay uncommitted. | Keep diffs animation-only. |

---

## Steps

### Foundation for the codemod
- [x] **Step 1 — Seam host types.** DONE — both variants export host instance types under the same
      names as the components (TS keeps types/values in separate declaration spaces), so
      `React.RefAttributes<View>` still resolves to the native host. Verified with a throwaway
      fixture; preview tsc stayed at the 3 known errors.
- [x] **Step 2 — Seam transition tokens.** DONE — `durations` + `transitions` (fast/base/slow,
      springSnappy/Soft/Bouncy) in the engine and mirrored in BOTH seam variants. Verified
      byte-identical between plain seam and engine.

### Codemod patterns (established in Step 3 — reuse for all later batches)
- **P-A · Direct RN host** → swap the import to `@/components/ui/primitives`; props flow from
  `React.ComponentProps<typeof Host>` so `animate` appears automatically.
  *Used by:* card, alert, badge, text, skeleton.
- **P-B · Primitive-owned host** (`@rn-primitives`, supports `asChild`) → keep the primitive as the
  semantic owner and attach a seam host with `asChild` (one host, no extra node). Take that path
  **only when the caller passes motion props**, so default rendering is byte-identical.
  *Used by:* separator, aspect-ratio, avatar (root + fallback), label (text host).
- **P-C · Foreign leaf** (SVG/third-party, can't host an animated style) → wrap in a seam host
  **only when motion is requested**. *Used by:* icon.

### Phase 2 — Route components through the seam (preview sources)
Each batch: swap host imports `react-native` → `@/components/ui/primitives`, keep prop types via
`React.ComponentProps<typeof Host>`, thread `animate`/`activeAnimate` on exported visual parts.
*Verify after EACH batch:* preview tsc unchanged baseline.
- [x] **Step 3 — Batch A (display):** card, alert, separator, aspect-ratio, avatar, label, badge,
      text, icon, skeleton. DONE — tsc at baseline; a fixture proved `animate`/`activeAnimate`/
      `motionActive`/`reduceMotion` compile on all 10 (incl. Card/Alert subcomponents).
- [x] **Step 4 — Batch B (forms):** input, textarea, checkbox, radio-group, switch, toggle,
      toggle-group, input-otp. DONE — P-A for input/textarea/input-otp (TextInput/Pressable/View),
      P-B for checkbox, radio-group (root+item), switch, toggle, toggle-group (root+item).
      **Canonical active state wired:** `motionActive` defaults to `checked` (checkbox, switch),
      `pressed` (toggle) and `isSelected` (toggle-group item), so `activeAnimate` means the right
      thing per component. Switch thumb keeps its class-based travel (specialized stays specialized).
      Verified: tsc at baseline; fixture proved props incl. multi-state `activeAnimate.states`.
- [ ] **Step 5 — Batch C (disclosure/nav):** tabs, accordion, collapsible, breadcrumb, sidebar, calendar, carousel
- [ ] **Step 6 — Batch D (overlays/feedback):** dialog, alert-dialog, sheet, bottom-sheet, popover, tooltip,
      hover-card, select, dropdown-menu, context-menu, menubar, sonner, spinner, progress, native-only-animated-view

### Phase 3 — Unify the four animation systems
- [ ] **Step 7 — Fix `progress`.** Move `withSpring` out of `useAnimatedStyle` into a derived value.
- [ ] **Step 8 — Menu exits.** Add `exiting` to dropdown-menu, context-menu, menubar (currently enter-only).
- [ ] **Step 9 — Skeleton drift.** One implementation; reconcile preview (`animate-pulse`) vs registry (Reanimated loop).
- [ ] **Step 10 — Reduced motion for CSS paths.** `@media (prefers-reduced-motion: reduce)` in the global
      CSS templates to neutralise `animate-in`/`transition-*` (engine already handles JS-driven motion).
- [ ] **Step 11 — Kill magic numbers.** Replace inline 150/200/250 in overlays with Step-2 seam tokens.

### Phase 4/5 — Motion completeness + sugar
- [ ] **Step 12 — `MotionSlot` (`asChild`)** with ref/handler/style merging + dev warning; stagger helper.
- [ ] **Step 13 — Utility strings** (`animate="fade-in slide-up duration-200"`) compiling to the object model.

### Phase 0/6 — Canonical source, regeneration, docs, release
- [ ] **Step 14 — Canonical registry source.** Create `registry-src/{nativewind,uniwind}`, seed it,
      repoint `REUSABLES_SRC` in both builders, fail the build when it is missing (fixes C4).
- [ ] **Step 15 — Regenerate all outputs.** `registry:build:all`; assert every component JSON gains
      `primitives` in `registryDependencies`; no cycles; 20 engine/style dirs consistent.
- [ ] **Step 16 — Docs.** Per-component `animate` examples, `primitives` seam page, reduced-motion notes.
- [ ] **Step 17 — Release prep.** Bump to **`1.0.0-beta.6`** (per C2), build, full tests, commit, push.
- [ ] **Step 18 — Publish to npm.** `pnpm --filter lovdacn release:beta` → publishes `1.0.0-beta.6`
      under the `beta` dist-tag. **BLOCKED on C1** (owner must `npm login`, or provide `NPM_TOKEN`).

---

## Standing verification commands

```bash
pnpm --filter preview exec tsc --noEmit     # expect the 3 known pre-existing errors, nothing new
pnpm --filter v2 exec tsc --noEmit          # expect 0
pnpm --filter lovdacn test                  # expect all green (31+)
pnpm --filter lovdacn build
pnpm --filter lovdacn extra:build           # then revert unrelated drift in public/r/styles
```

## Invariants (do not break)
1. No `add motion` → zero Reanimated. Components never import `motion` directly (C5).
2. One animated host per interaction; never nest animated pressables.
3. Animations start on target change (`useDerivedValue`); `useAnimatedStyle` only reads.
4. Compose user handlers; preserve refs, a11y, `disabled`, and `asChild`.
5. One owner per animated property (engine **or** CSS, never both).

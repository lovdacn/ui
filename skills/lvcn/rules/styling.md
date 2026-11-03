# Styling & Customization

See [customization.md](../customization.md) for theming, CSS variables, presets, and engine details.

## Contents

- Semantic color tokens
- No raw colors for status/state
- Built-in variants first
- `className` for layout only
- `gap-*`, not `space-x/y` (React Native)
- Prefer `size-*` when width and height are equal
- No manual `dark:` color overrides
- Use `cn()` for conditional classes
- Know your style engine

---

## Semantic color tokens

Use the theme tokens so components stay consistent and adapt to light/dark automatically.

**Incorrect:**

```tsx
<View className="bg-blue-500">
  <Text className="text-gray-600">Secondary text</Text>
</View>
```

**Correct:**

```tsx
<View className="bg-primary">
  <Text className="text-primary-foreground">Primary</Text>
</View>
<Text className="text-muted-foreground">Secondary text</Text>
```

Common tokens: `bg-background`/`text-foreground`, `bg-card`/`text-card-foreground`, `bg-popover`/`text-popover-foreground`, `bg-primary`/`text-primary-foreground`, `bg-secondary`, `bg-muted`/`text-muted-foreground`, `bg-accent`/`text-accent-foreground`, `bg-destructive`, `border-border`, `border-input`, `ring-ring`.

---

## No raw colors for status/state

For positive/negative/status indicators use `Badge` variants or semantic tokens like `text-destructive` — not raw Tailwind palette colors.

**Incorrect:**

```tsx
<Text className="text-emerald-600">+20.1%</Text>
<Text className="text-red-600">-3.2%</Text>
```

**Correct:**

```tsx
<Badge variant="secondary"><Text>+20.1%</Text></Badge>
<Text className="text-destructive">-3.2%</Text>
```

If you need a success/warning color that isn't a token, add a custom CSS variable to the theme (see [customization.md](../customization.md#customizing-components)) rather than reaching for `green-500`.

---

## Built-in variants first

**Incorrect:**

```tsx
<Button className="border border-border bg-transparent">
  <Text>Click</Text>
</Button>
```

**Correct:**

```tsx
<Button variant="outline">
  <Text>Click</Text>
</Button>
```

`Button` variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`. Sizes: `default`, `sm`, `lg`, `icon`. `Badge` variants: `default`, `secondary`, `destructive`, `outline`. `Toggle`/`ToggleGroup` variants: `default`, `outline`.

---

## `className` for layout only

Use `className` for layout (`max-w-md`, `mx-auto`, `mt-4`, `flex-row`, `gap-2`) — **not** to override a component's colors or typography. Change appearance via variants, semantic tokens, or CSS variables.

**Incorrect:**

```tsx
<Card className="bg-blue-100">
  <CardContent><Text className="font-bold text-blue-900">Dashboard</Text></CardContent>
</Card>
```

**Correct:**

```tsx
<Card className="mx-auto max-w-md">
  <CardContent><Text>Dashboard</Text></CardContent>
</Card>
```

---

## `gap-*`, not `space-x/y` (React Native)

React Native has no `space-x-*`/`space-y-*` utilities. Use `gap-*` on a flex container. Remember the default direction is `column`; use `flex-row` for horizontal. See [native.md](./native.md).

```tsx
<View className="flex-col gap-4">   // vertical stack
<View className="flex-row gap-2">   // horizontal row
```

---

## Prefer `size-*` when width and height are equal

`size-10`, not `w-10 h-10`. Applies to avatars, icons, skeletons, icon buttons.

```tsx
<Avatar className="size-10">...</Avatar>
<Skeleton className="size-12 rounded-full" />
```

---

## No manual `dark:` color overrides

Semantic tokens already resolve per color scheme (light `:root` vs dark `.dark`). Don't hand-write `dark:` color classes.

**Incorrect:**

```tsx
<View className="bg-white dark:bg-neutral-950">
  <Text className="text-black dark:text-white">Hi</Text>
</View>
```

**Correct:**

```tsx
<View className="bg-background">
  <Text className="text-foreground">Hi</Text>
</View>
```

(Component source itself may use `dark:` internally to fine-tune surfaces — that's fine; you just shouldn't add color overrides in app code.)

---

## Use `cn()` for conditional classes

Use the `cn()` helper from the project's utils alias (default `@/lib/utils`) for conditional or merged classes — not manual template-literal ternaries.

**Incorrect:**

```tsx
<View className={`flex-row items-center ${isActive ? "bg-primary" : "bg-muted"}`}>
```

**Correct:**

```tsx
import { cn } from "@/lib/utils"

<View className={cn("flex-row items-center", isActive ? "bg-primary" : "bg-muted")}>
```

---

## Know your style engine

The `styleEngine` in `lvcn.json` determines how theme tokens are stored, which matters when you add colors or edit the theme:

- **`nativewind`** — HSL triplets in CSS variables, wrapped as `hsl(var(--token))` in `tailwind.config.js`. Dark mode via `.dark` class (`darkMode: "class"`).
- **`uniwind`** — OKLCH values registered via an `@theme` block in the global CSS; no `tailwind.config.js`.

Utility class names (`bg-primary`, `text-muted-foreground`, …) are identical across engines — only the variable format and registration differ. Always edit the file at `tailwind.css`; never create a new CSS file. See [customization.md](../customization.md).

# Icons

lovdacn renders icons through the **`Icon`** component with an **`as`** prop. This is different from web shadcn (which renders icon components directly and uses a `data-icon` attribute). There is **no `data-icon`** in lovdacn.

```tsx
import { Icon } from "@/components/ui/icon"
import { ArrowRight } from "lucide-react-native"

<Icon as={ArrowRight} />
```

## Contents

- Use the `Icon` component with `as`
- Import from the project's `iconLibrary`
- Icons inherit text color
- Sizing
- Passing icons as props (`as`, Alert's `icon`)

---

## Use the `Icon` component with `as`

Pass the icon **component** (not an element) to `as`. The `Icon` wrapper enables NativeWind `className` support (via `cssInterop`) and color inheritance.

**Incorrect:**

```tsx
// Rendering the raw icon loses className/color/size integration.
<ArrowRight />

// There is no data-icon attribute in lovdacn.
<Icon as={ArrowRight} data-icon="inline-start" />
```

**Correct:**

```tsx
import { Icon } from "@/components/ui/icon"
import { ArrowRight } from "lucide-react-native"

<Icon as={ArrowRight} />
```

In a `Button`, place the `Icon` and the `Text` as siblings — the button lays them out in a row with a gap:

```tsx
<Button>
  <Icon as={Search} />
  <Text>Search</Text>
</Button>

<Button>
  <Text>Next</Text>
  <Icon as={ArrowRight} />
</Button>
```

---

## Import from the project's `iconLibrary`

Check `iconLibrary` in `lvcn.json` and import from the matching package. **The default is `lucide-react-native`** — never assume the web package `lucide-react`.

| `iconLibrary` | Import from                   |
| ------------- | ----------------------------- |
| `lucide`      | `lucide-react-native`         |
| `phosphor`    | `phosphor-react-native`       |
| `tabler`      | `@tabler/icons-react-native`  |
| `expo`        | `@expo/vector-icons`          |
| `heroicons`   | `react-native-heroicons`      |

```tsx
// lucide (default)
import { Check } from "lucide-react-native"
// tabler
import { IconCheck } from "@tabler/icons-react-native"
```

`apply` never changes the icon library automatically — switching is manual: install the package, then update imports and icon names.

---

## Icons inherit text color

The `Icon` component reads `TextClassContext`, so inside `Button`, `Badge`, `DropdownMenuItem`, `ToggleGroupItem`, etc. it automatically takes the surrounding text color. Don't add color classes just to match.

**Incorrect:**

```tsx
<Button variant="destructive">
  <Icon as={Trash} className="text-destructive" />
  <Text>Delete</Text>
</Button>
```

**Correct:**

```tsx
<Button variant="destructive">
  <Icon as={Trash} />
  <Text>Delete</Text>
</Button>
```

To color a standalone icon, use a semantic text token: `<Icon as={Info} className="text-muted-foreground" />`.

---

## Sizing

The `Icon` component defaults to `size={14}`. Override with the `size` prop or a `size-*` class (both work via `cssInterop`). Inside components that already size their icons (Button, Select, Checkbox, etc.), don't add sizing unless you specifically want a different size.

```tsx
<Icon as={Search} size={16} />
<Icon as={Search} className="size-5" />
```

For icon-only buttons, use the button's `icon` size, not a manual icon size:

```tsx
<Button size="icon" variant="ghost">
  <Icon as={Settings} />
</Button>
```

---

## Passing icons as props

Pass icon **components**, not string keys or elements. Two common places:

**`Icon`'s `as` prop:**

```tsx
// Incorrect — string lookup.
const map = { check: Check }
<Icon as={map[name]} />   // fragile

// Correct — pass the component.
<Icon as={Check} />
```

**`Alert`'s `icon` prop** takes an icon component directly (see [composition.md](./composition.md)):

```tsx
import { Terminal } from "lucide-react-native"

<Alert icon={Terminal}>
  <AlertTitle>Heads up!</AlertTitle>
  <AlertDescription>You can add components to your app.</AlertDescription>
</Alert>
```

When building your own component that accepts an icon, type it as a component and render it via `Icon`:

```tsx
import type { LucideIcon } from "lucide-react-native"
import { Icon } from "@/components/ui/icon"

function Row({ icon }: { icon: LucideIcon }) {
  return <Icon as={icon} />
}

<Row icon={Check} />
```

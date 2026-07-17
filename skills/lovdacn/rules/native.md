# React Native Fundamentals

lovdacn components render to **native views**, not the DOM. These rules are what make code work on iOS/Android (and web via React Native Web). They have no equivalent in web shadcn.

## Contents

- All text must be inside `<Text>`
- Use RN primitives, not DOM elements
- Layout is flexbox; default direction is column
- Spacing with `gap-*`, never `space-x/y`
- Handlers are `onPress`, not `onClick`
- Overlays require portal setup
- Scrolling uses ScrollView/FlatList
- Platform differences

---

## All text must be inside `<Text>`

This is the single most common React Native mistake. **Every string must be wrapped in the `<Text>` component.** A bare string inside a `View`, `Button`, `Badge`, etc. throws at runtime: *"Text strings must be rendered within a `<Text>` component."*

Components like `Button`, `Badge`, `Card`, `Alert`, and menu items provide a `TextClassContext` so a `<Text>` child automatically picks up the right color/size — but you still have to render the `<Text>`.

**Incorrect:**

```tsx
<Button>Save</Button>
<Badge>New</Badge>
<View>Hello world</View>
```

**Correct:**

```tsx
import { Text } from "@/components/ui/text"

<Button>
  <Text>Save</Text>
</Button>
<Badge>
  <Text>New</Text>
</Badge>
<View>
  <Text>Hello world</Text>
</View>
```

Use the `Text` component's variants for typography (`h1`–`h4`, `p`, `lead`, `large`, `small`, `muted`, `blockquote`, `code`):

```tsx
<Text variant="h1">Title</Text>
<Text variant="muted">Subtitle</Text>
```

---

## Use RN primitives, not DOM elements

There is no `div`, `span`, `p`, `button`, `img`, `a`, `hr`, `ul`, or `input` tag. Use React Native primitives (or lovdacn components).

| Web element        | React Native / lovdacn                          |
| ------------------ | ----------------------------------------------- |
| `<div>`            | `<View>`                                        |
| `<span>` / `<p>`   | `<Text>` (from `@/components/ui/text`)          |
| `<button>`         | `<Pressable>` or lovdacn `<Button>`             |
| `<input>`          | `<TextInput>` or lovdacn `<Input>`              |
| `<img>`            | `<Image>` (from `react-native` or `expo-image`) |
| `<a>`              | `<Link>` (expo-router) or a `Pressable`         |
| `<hr>`             | lovdacn `<Separator />`                         |
| `<ul>`/list        | `<FlatList>` / `<ScrollView>`                   |

**Incorrect:**

```tsx
<div className="flex-row">
  <img src="/logo.png" />
  <span>Brand</span>
</div>
```

**Correct:**

```tsx
import { View, Image } from "react-native"
import { Text } from "@/components/ui/text"

<View className="flex-row items-center gap-2">
  <Image source={{ uri: "/logo.png" }} className="size-8" />
  <Text>Brand</Text>
</View>
```

---

## Layout is flexbox; default direction is column

React Native uses flexbox for layout, but unlike the web the default `flex-direction` is **`column`**, not `row`. Be explicit: use `flex-row` for horizontal layouts.

**Incorrect (expecting a horizontal row like the web):**

```tsx
<View className="flex items-center gap-2">
  <Avatar />
  <Text>Name</Text>
</View>
```

**Correct:**

```tsx
<View className="flex-row items-center gap-2">
  <Avatar />
  <Text>Name</Text>
</View>
```

Vertical stack (explicit, matches the RN default):

```tsx
<View className="flex-col gap-4">
  <Input />
  <Button><Text>Submit</Text></Button>
</View>
```

---

## Spacing with `gap-*`, never `space-x/y`

React Native supports the flexbox `gap` property but not the `space-x-*` / `space-y-*` margin utilities. Always use `gap-*` on a flex container.

**Incorrect:**

```tsx
<View className="space-y-4">...</View>
<View className="flex-row space-x-2">...</View>
```

**Correct:**

```tsx
<View className="gap-4">...</View>
<View className="flex-row gap-2">...</View>
```

---

## Handlers are `onPress`, not `onClick`

Touchables use `onPress` (and `onLongPress`, `onPressIn`, `onPressOut`). There is no `onClick`, `onMouseEnter`, or `onChange` for text — `TextInput` uses `onChangeText`.

**Incorrect:**

```tsx
<Button onClick={handleSave}><Text>Save</Text></Button>
<Input onChange={(e) => setValue(e.target.value)} />
```

**Correct:**

```tsx
<Button onPress={handleSave}><Text>Save</Text></Button>
<Input value={value} onChangeText={setValue} />
```

---

## Overlays require portal setup

`Dialog`, `AlertDialog`, `Popover`, `Tooltip`, `DropdownMenu`, `ContextMenu`, `HoverCard`, `Select`, and `Menubar` render through a portal. The app root must mount `<PortalHost />` and wrap everything in `<GestureHandlerRootView>`. The CLI wires this up when you `add` an overlay, but verify it — if it's missing, overlays silently fail to open on native.

```tsx
// app/_layout.tsx (or App.tsx)
import { PortalHost } from "@rn-primitives/portal"
import { GestureHandlerRootView } from "react-native-gesture-handler"

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={...}>
        {/* routes / app content */}
        <PortalHost />
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}
```

Each overlay's `Content` accepts an optional `portalHost` prop to target a named host. See [registry.md](../registry.md) for the full portal list and setup details.

---

## Scrolling uses ScrollView / FlatList

A `View` does not scroll. For scrollable content use `ScrollView`; for long/virtualized lists use `FlatList`.

```tsx
import { ScrollView } from "react-native"

<ScrollView className="flex-1" contentContainerClassName="gap-4 p-4">
  <Card>...</Card>
  <Card>...</Card>
</ScrollView>
```

For screens, account for notches/insets with `SafeAreaView` (from `react-native-safe-area-context`) or expo-router's layout.

---

## Platform differences

lovdacn components already use `Platform.select` internally to bridge web/native. When you write platform-specific behavior, do the same rather than assuming web APIs:

```tsx
import { Platform } from "react-native"

const spacing = Platform.select({ web: "gap-3", native: "gap-4" })
```

Avoid browser-only APIs (`window`, `document`, `localStorage`) on native. Use React Native / Expo equivalents (e.g. `AsyncStorage`, `expo-*` modules).

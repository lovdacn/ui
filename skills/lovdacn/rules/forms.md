# Forms & Inputs

lovdacn has **no `Field`, `FieldGroup`, `FieldSet`, or `InputGroup`** (those are web-shadcn only). Build forms with `View` + `gap-*` for layout, pairing a `Label` with each control. All labels and helper text are `<Text>`.

## Contents

- Form layout: View + Label + control
- Choosing a control
- Labels and associating them
- Validation with `aria-invalid`
- Disabled state
- Option sets use ToggleGroup
- Switch vs Checkbox
- Select composition

---

## Form layout: View + Label + control

Use a `View` with `gap-*`. Group each label with its control in a small `View`.

```tsx
import { View } from "react-native"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Text } from "@/components/ui/text"

<View className="gap-4">
  <View className="gap-1.5">
    <Label nativeID="name"><Text>Full name</Text></Label>
    <Input aria-labelledby="name" placeholder="Ada Lovelace" />
  </View>
  <View className="gap-1.5">
    <Label nativeID="email"><Text>Email</Text></Label>
    <Input aria-labelledby="email" autoCapitalize="none" keyboardType="email-address" />
  </View>
</View>
```

Remember React Native rules from [native.md](./native.md): `flex-col` is the default direction, use `gap-*` (never `space-y-*`), and text inputs use `onChangeText`, not `onChange`.

---

## Choosing a control

- Single-line text → `Input`
- Multi-line text → `Textarea` (`multiline` defaults to `true`)
- Pick one from a dropdown list → `Select`
- Boolean setting → `Switch`
- Boolean in a form / multi-check list → `Checkbox`
- One choice from a few visible options → `RadioGroup`
- Toggle between 2–5 inline options → `ToggleGroup` + `ToggleGroupItem`
- A single on/off pressable (e.g. bold) → `Toggle`

There is no `Slider`, `InputOTP`, `Combobox`, or native `select` component.

---

## Labels and associating them

`Label` wraps its children in a styled `Text`, so put a `<Text>` inside. Associate it with a control via matching ids (the docs use `htmlFor`/`id`; `nativeID` + `aria-labelledby` also works on native).

```tsx
<View className="flex-row items-center gap-2">
  <Checkbox nativeID="terms" checked={agreed} onCheckedChange={setAgreed} />
  <Label nativeID="terms"><Text>I agree to the terms</Text></Label>
</View>
```

RadioGroup pattern (one group, labelled items):

```tsx
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

<RadioGroup value={plan} onValueChange={setPlan}>
  <View className="flex-row items-center gap-2">
    <RadioGroupItem value="default" id="r1" />
    <Label htmlFor="r1"><Text>Default</Text></Label>
  </View>
  <View className="flex-row items-center gap-2">
    <RadioGroupItem value="comfortable" id="r2" />
    <Label htmlFor="r2"><Text>Comfortable</Text></Label>
  </View>
</RadioGroup>
```

---

## Validation with `aria-invalid`

Controls (`Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroupItem`, `Switch`) style their border/ring from `aria-invalid`. Set it on the control, and render an error message as muted/destructive `Text`.

```tsx
<View className="gap-1.5">
  <Label nativeID="email"><Text>Email</Text></Label>
  <Input aria-labelledby="email" aria-invalid={!!error} />
  {error ? <Text className="text-destructive text-sm">{error}</Text> : null}
</View>
```

There is no `data-invalid` wrapper (no `Field`), so validation styling lives on the control via `aria-invalid`.

---

## Disabled state

`Input`/`Textarea` use `editable={false}` (they dim automatically). Other controls take `disabled`.

```tsx
<Input editable={false} value="Read only" />
<Button disabled><Text>Submit</Text></Button>
<Checkbox disabled checked={false} onCheckedChange={() => {}} />
```

---

## Option sets use ToggleGroup

For 2–5 mutually exclusive inline options, use `ToggleGroup` — don't loop `Button` with manual active state. Pass `isFirst`/`isLast` on the edge items so the group's corners round correctly.

**Incorrect:**

```tsx
const [val, setVal] = useState("daily")
<View className="flex-row gap-2">
  {["daily", "weekly", "monthly"].map((o) => (
    <Button key={o} variant={val === o ? "default" : "outline"} onPress={() => setVal(o)}>
      <Text>{o}</Text>
    </Button>
  ))}
</View>
```

**Correct:**

```tsx
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

<ToggleGroup type="single" value={val} onValueChange={setVal} variant="outline">
  <ToggleGroupItem value="daily" isFirst><Text>Daily</Text></ToggleGroupItem>
  <ToggleGroupItem value="weekly"><Text>Weekly</Text></ToggleGroupItem>
  <ToggleGroupItem value="monthly" isLast><Text>Monthly</Text></ToggleGroupItem>
</ToggleGroup>
```

Use `type="multiple"` for multi-select. Icons in items use `ToggleGroupIcon` (which inherits the item's text color):

```tsx
import { ToggleGroup, ToggleGroupItem, ToggleGroupIcon } from "@/components/ui/toggle-group"
import { Bold, Italic } from "lucide-react-native"

<ToggleGroup type="multiple" value={marks} onValueChange={setMarks}>
  <ToggleGroupItem value="bold" isFirst><ToggleGroupIcon as={Bold} /></ToggleGroupItem>
  <ToggleGroupItem value="italic" isLast><ToggleGroupIcon as={Italic} /></ToggleGroupItem>
</ToggleGroup>
```

---

## Switch vs Checkbox

Both use `checked` + `onCheckedChange`. Use `Switch` for immediate on/off settings; `Checkbox` for form agreement/selection.

```tsx
<View className="flex-row items-center justify-between">
  <Label nativeID="push"><Text>Push notifications</Text></Label>
  <Switch nativeID="push" checked={push} onCheckedChange={setPush} />
</View>
```

---

## Select composition

`SelectTrigger` shows a `SelectValue` (with `placeholder`); options go in `SelectContent`. Each `SelectItem` needs a `value`, a `label` prop, and a `<Text>` child. Group with `SelectGroup`/`SelectLabel` when helpful. See [composition.md](./composition.md).

```tsx
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from "@/components/ui/select"

<Select value={fruit} onValueChange={setFruit}>
  <SelectTrigger>
    <SelectValue placeholder="Select a fruit" />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel><Text>Fruits</Text></SelectLabel>
      <SelectItem value="apple" label="Apple"><Text>Apple</Text></SelectItem>
      <SelectItem value="banana" label="Banana"><Text>Banana</Text></SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>
```

`Select` is a portal component — the app root needs `<PortalHost />` + `<GestureHandlerRootView>` (see [native.md](./native.md)).

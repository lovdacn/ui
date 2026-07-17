# Component Composition

## Contents

- Items live inside their content/group container
- Choosing an overlay
- Dialog and AlertDialog need a Title
- Card structure
- Alert takes an `icon` prop
- Avatar always needs AvatarFallback
- TabsTrigger must be inside TabsList
- Accordion and Collapsible
- Button loading (no Spinner)
- Use Separator / Skeleton / Badge instead of custom markup
- There is no toast/Sonner

---

## Items live inside their content/group container

Render items inside the component's content container (and a group where the component provides one). Every item's textual child is a `<Text>`.

**Incorrect:**

```tsx
<Select>
  <SelectItem value="apple" label="Apple"><Text>Apple</Text></SelectItem>
</Select>
```

**Correct:**

```tsx
<Select>
  <SelectTrigger><SelectValue placeholder="Pick one" /></SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectItem value="apple" label="Apple"><Text>Apple</Text></SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>
```

Container / item pairs:

| Item                                              | Container / group                         |
| ------------------------------------------------- | ----------------------------------------- |
| `SelectItem`, `SelectLabel`                       | `SelectContent` → `SelectGroup`           |
| `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioItem` | `DropdownMenuContent` (group via `DropdownMenuGroup` / `DropdownMenuRadioGroup`) |
| `ContextMenuItem`                                 | `ContextMenuContent`                      |
| `MenubarItem`                                     | `MenubarContent` (inside `MenubarMenu`)   |
| `TabsTrigger`                                     | `TabsList`                                |
| `AccordionItem`                                   | `Accordion`                               |

Submenus use `DropdownMenuSub` → `DropdownMenuSubTrigger` + `DropdownMenuSubContent`. `DropdownMenuSeparator` and `DropdownMenuShortcut` are available for structure.

---

## Choosing an overlay

lovdacn has these overlays (there is **no `Sheet` or `Drawer`**):

| Use case                          | Component      |
| --------------------------------- | -------------- |
| Focused task requiring input      | `Dialog`       |
| Destructive action confirmation   | `AlertDialog`  |
| Small contextual content on press | `Popover`      |
| Quick info on press/hover         | `HoverCard`    |
| Short hint on a control           | `Tooltip`      |
| Actions menu from a trigger       | `DropdownMenu` |
| Actions menu from a long-press    | `ContextMenu`  |
| App-style menu bar                | `Menubar`      |

All of these are **portal components** — the app root needs `<PortalHost />` + `<GestureHandlerRootView>`, and each `Content` accepts a `portalHost` prop. See [native.md](./native.md) and [registry.md](../registry.md). Overlays manage their own stacking — don't add `z-*`.

Custom triggers use `asChild`:

```tsx
<DialogTrigger asChild>
  <Button><Text>Open</Text></Button>
</DialogTrigger>
```

---

## Dialog and AlertDialog need a Title

`DialogTitle` / `AlertDialogTitle` are required for accessibility. Use `className="sr-only"` if visually hidden. Use the header/footer subcomponents for structure.

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button><Text>Edit profile</Text></Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle><Text>Edit profile</Text></DialogTitle>
      <DialogDescription><Text>Update your details.</Text></DialogDescription>
    </DialogHeader>
    {/* fields */}
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline"><Text>Cancel</Text></Button>
      </DialogClose>
      <Button><Text>Save</Text></Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

`AlertDialog` mirrors this with `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogAction`, and `AlertDialogCancel`.

---

## Card structure

Use full composition — don't dump everything into `CardContent`. Card provides a `TextClassContext`, so titles/descriptions inside are still `<Text>` (the subcomponents wrap it for you).

```tsx
<Card>
  <CardHeader>
    <CardTitle>Team members</CardTitle>
    <CardDescription>Manage who has access.</CardDescription>
  </CardHeader>
  <CardContent>
    {/* body */}
  </CardContent>
  <CardFooter>
    <Button><Text>Invite</Text></Button>
  </CardFooter>
</Card>
```

`CardTitle` and `CardDescription` render `Text` internally, so a string child is fine there. Any raw string you add elsewhere in a `View` still needs its own `<Text>`.

---

## Alert takes an `icon` prop

`Alert` requires an `icon` prop — pass an icon **component** (not an `<Icon>` element). Compose with `AlertTitle` and `AlertDescription`. Variants: `default`, `destructive`.

```tsx
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Terminal } from "lucide-react-native"

<Alert icon={Terminal}>
  <AlertTitle>Heads up!</AlertTitle>
  <AlertDescription>You can add components to your app using the CLI.</AlertDescription>
</Alert>

<Alert icon={AlertTriangle} variant="destructive">
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>Your session has expired.</AlertDescription>
</Alert>
```

---

## Avatar always needs AvatarFallback

Include `AvatarFallback` for when the image fails or is missing.

```tsx
<Avatar className="size-10">
  <AvatarImage source={{ uri: user.avatarUrl }} />
  <AvatarFallback><Text>JD</Text></AvatarFallback>
</Avatar>
```

Note: `AvatarImage` takes a React Native image `source` (`{ uri }`), not a web `src`.

---

## TabsTrigger must be inside TabsList

Never render `TabsTrigger` directly under `Tabs`. Trigger labels are `<Text>`.

```tsx
<Tabs value={tab} onValueChange={setTab}>
  <TabsList>
    <TabsTrigger value="account"><Text>Account</Text></TabsTrigger>
    <TabsTrigger value="password"><Text>Password</Text></TabsTrigger>
  </TabsList>
  <TabsContent value="account">{/* ... */}</TabsContent>
  <TabsContent value="password">{/* ... */}</TabsContent>
</Tabs>
```

---

## Accordion and Collapsible

Expandable sections use `Accordion` (`AccordionItem` + `AccordionTrigger` + `AccordionContent`); a single show/hide region uses `Collapsible` (`CollapsibleTrigger` + `CollapsibleContent`).

```tsx
<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger><Text>Is it accessible?</Text></AccordionTrigger>
    <AccordionContent><Text>Yes. It follows the a11y patterns.</Text></AccordionContent>
  </AccordionItem>
</Accordion>
```

---

## Button loading (no Spinner)

There is no `Spinner` component. Use React Native's `ActivityIndicator` with a disabled `Button`.

```tsx
import { ActivityIndicator } from "react-native"

<Button disabled>
  <ActivityIndicator />
  <Text>Saving…</Text>
</Button>
```

`Button` has no `isLoading`/`isPending` prop — compose the state yourself.

---

## Use Separator / Skeleton / Badge instead of custom markup

| Instead of                                            | Use                              |
| ----------------------------------------------------- | -------------------------------- |
| a bordered `View` acting as a divider                 | `<Separator />` (`orientation="vertical"` for vertical) |
| a hand-rolled `animate-pulse` `View`                  | `<Skeleton className="h-4 w-3/4" />` |
| a styled pill `View` + `Text` for a status label      | `<Badge variant="secondary"><Text>…</Text></Badge>` |

`Progress` (with a `value` 0–100) shows determinate progress.

---

## There is no toast/Sonner

lovdacn ships no toast/`Sonner` component. For transient feedback, use an inline `Alert`, a `Dialog`, or a third-party Expo/RN toast library of the user's choice — don't reference `sonner`/`toast()` from web shadcn.

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..", "content", "docs")
const componentsDir = path.join(root, "components")

fs.mkdirSync(componentsDir, { recursive: true })
fs.mkdirSync(path.join(root, "(root)"), { recursive: true })

const COMPONENTS = [
  {
    name: "accordion",
    title: "Accordion",
    description:
      "A vertically stacked set of interactive headings that each reveal a section of content.",
    deps: ["utils"],
    usage: `import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Text } from "@/components/ui/text"

export function Example() {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="item-1">
        <AccordionTrigger>
          <Text>Is it accessible?</Text>
        </AccordionTrigger>
        <AccordionContent>
          <Text>Yes. It adheres to the WAI-ARIA design pattern.</Text>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}`,
  },
  {
    name: "alert",
    title: "Alert",
    description: "Displays a callout for user attention.",
    deps: ["utils", "text"],
    usage: `import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Text } from "@/components/ui/text"

export function Example() {
  return (
    <Alert>
      <AlertTitle>
        <Text>Heads up!</Text>
      </AlertTitle>
      <AlertDescription>
        <Text>You can add components to your app using the CLI.</Text>
      </AlertDescription>
    </Alert>
  )
}`,
  },
  {
    name: "alert-dialog",
    title: "Alert Dialog",
    description:
      "A modal dialog that interrupts the user with important content and expects a response.",
    deps: ["utils", "button", "text"],
    usage: `import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

export function Example() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">
          <Text>Show Dialog</Text>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            <Text>Are you sure?</Text>
          </AlertDialogTitle>
          <AlertDialogDescription>
            <Text>This action cannot be undone.</Text>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            <Text>Cancel</Text>
          </AlertDialogCancel>
          <AlertDialogAction>
            <Text>Continue</Text>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}`,
  },
  {
    name: "aspect-ratio",
    title: "Aspect Ratio",
    description: "Displays content within a desired ratio.",
    deps: ["utils"],
    usage: `import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Image } from "react-native"

export function Example() {
  return (
    <AspectRatio ratio={16 / 9}>
      <Image
        source={{ uri: "https://picsum.photos/800/450" }}
        className="size-full rounded-md"
        resizeMode="cover"
      />
    </AspectRatio>
  )
}`,
  },
  {
    name: "avatar",
    title: "Avatar",
    description: "An image element with a fallback for representing the user.",
    deps: ["utils"],
    usage: `import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Text } from "@/components/ui/text"

export function Example() {
  return (
    <Avatar alt="User">
      <AvatarImage source={{ uri: "https://github.com/shadcn.png" }} />
      <AvatarFallback>
        <Text>CN</Text>
      </AvatarFallback>
    </Avatar>
  )
}`,
  },
  {
    name: "badge",
    title: "Badge",
    description: "Displays a badge or a component that looks like a badge.",
    deps: ["utils", "text"],
    usage: `import { Badge } from "@/components/ui/badge"
import { Text } from "@/components/ui/text"

export function Example() {
  return (
    <Badge>
      <Text>Badge</Text>
    </Badge>
  )
}`,
    extra: `## Variants

\`\`\`tsx
<Badge><Text>Default</Text></Badge>
<Badge variant="secondary"><Text>Secondary</Text></Badge>
<Badge variant="outline"><Text>Outline</Text></Badge>
<Badge variant="destructive"><Text>Destructive</Text></Badge>
\`\`\`
`,
  },
  {
    name: "button",
    title: "Button",
    description: "Displays a button or a component that looks like a button.",
    deps: ["text", "utils"],
    usage: `import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

export function Example() {
  return (
    <Button>
      <Text>Button</Text>
    </Button>
  )
}`,
    extra: `## Variants

### Default

\`\`\`tsx
<Button>
  <Text>Default</Text>
</Button>
\`\`\`

### Outline

\`\`\`tsx
<Button variant="outline">
  <Text>Outline</Text>
</Button>
\`\`\`

### Secondary

\`\`\`tsx
<Button variant="secondary">
  <Text>Secondary</Text>
</Button>
\`\`\`

### Ghost

\`\`\`tsx
<Button variant="ghost">
  <Text>Ghost</Text>
</Button>
\`\`\`

### Destructive

\`\`\`tsx
<Button variant="destructive">
  <Text>Destructive</Text>
</Button>
\`\`\`

### Sizes

\`\`\`tsx
<Button size="sm"><Text>Small</Text></Button>
<Button size="default"><Text>Default</Text></Button>
<Button size="lg"><Text>Large</Text></Button>
\`\`\`
`,
  },
  {
    name: "card",
    title: "Card",
    description: "Displays a card with header, content, and footer.",
    deps: ["utils", "text"],
    usage: `import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Text } from "@/components/ui/text"

export function Example() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Text>Card Title</Text>
        </CardTitle>
        <CardDescription>
          <Text>Card description</Text>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Text>Card content</Text>
      </CardContent>
      <CardFooter>
        <Text>Card footer</Text>
      </CardFooter>
    </Card>
  )
}`,
  },
  {
    name: "checkbox",
    title: "Checkbox",
    description:
      "A control that allows the user to toggle between checked and not checked.",
    deps: ["utils"],
    usage: `import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Text } from "@/components/ui/text"
import { View } from "react-native"

export function Example() {
  return (
    <View className="flex-row items-center gap-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">
        <Text>Accept terms and conditions</Text>
      </Label>
    </View>
  )
}`,
  },
  {
    name: "collapsible",
    title: "Collapsible",
    description: "An interactive component which expands/collapses a panel.",
    deps: ["utils"],
    usage: `import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Text } from "@/components/ui/text"
import { View } from "react-native"

export function Example() {
  return (
    <Collapsible>
      <CollapsibleTrigger>
        <Text>Toggle</Text>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <View className="p-2">
          <Text>Collapsible content</Text>
        </View>
      </CollapsibleContent>
    </Collapsible>
  )
}`,
  },
  {
    name: "context-menu",
    title: "Context Menu",
    description:
      "Displays a menu to the user — such as a set of actions or functions — triggered by a long press.",
    deps: ["utils", "text", "icon"],
    usage: `import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { Text } from "@/components/ui/text"
import { View } from "react-native"

export function Example() {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <View className="rounded-md border border-dashed p-8">
          <Text>Long press here</Text>
        </View>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>
          <Text>Back</Text>
        </ContextMenuItem>
        <ContextMenuItem>
          <Text>Forward</Text>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}`,
  },
  {
    name: "dialog",
    title: "Dialog",
    description:
      "A window overlaid on either the primary window or another dialog window.",
    deps: ["utils", "button", "text", "icon"],
    usage: `import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

export function Example() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Text>Open</Text>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Text>Dialog title</Text>
          </DialogTitle>
          <DialogDescription>
            <Text>Dialog description</Text>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}`,
  },
  {
    name: "dropdown-menu",
    title: "Dropdown Menu",
    description:
      "Displays a menu to the user — such as a set of actions or functions — triggered by a button.",
    deps: ["utils", "text", "icon"],
    usage: `import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

export function Example() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Text>Open</Text>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>
          <Text>Profile</Text>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Text>Settings</Text>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}`,
  },
  {
    name: "hover-card",
    title: "Hover Card",
    description:
      "For sighted users to preview content available behind a link.",
    deps: ["utils"],
    usage: `import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Text } from "@/components/ui/text"

export function Example() {
  return (
    <HoverCard>
      <HoverCardTrigger>
        <Text className="underline">@lvcn</Text>
      </HoverCardTrigger>
      <HoverCardContent>
        <Text>Beautifully designed React Native components.</Text>
      </HoverCardContent>
    </HoverCard>
  )
}`,
  },
  {
    name: "icon",
    title: "Icon",
    description:
      "A platform-aware icon component built on Lucide for consistent iconography.",
    deps: ["utils"],
    usage: `import { Icon } from "@/components/ui/icon"
import { Home } from "lucide-react-native"

export function Example() {
  return <Icon as={Home} className="size-5 text-foreground" />
}`,
  },
  {
    name: "input",
    title: "Input",
    description:
      "Displays a form input field or a component that looks like an input field.",
    deps: ["utils"],
    usage: `import { Input } from "@/components/ui/input"

export function Example() {
  return <Input placeholder="Email" keyboardType="email-address" />
}`,
  },
  {
    name: "label",
    title: "Label",
    description: "Renders an accessible label associated with controls.",
    deps: ["utils", "text"],
    usage: `import { Label } from "@/components/ui/label"
import { Text } from "@/components/ui/text"

export function Example() {
  return (
    <Label>
      <Text>Email</Text>
    </Label>
  )
}`,
  },
  {
    name: "menubar",
    title: "Menubar",
    description: "A visually persistent menu common in desktop applications.",
    deps: ["utils", "text", "icon"],
    usage: `import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar"
import { Text } from "@/components/ui/text"

export function Example() {
  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>
          <Text>File</Text>
        </MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            <Text>New Tab</Text>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  )
}`,
  },
  {
    name: "native-only-animated-view",
    title: "Native Only Animated View",
    description:
      "A view that animates only on native platforms and is a plain View on web.",
    deps: ["utils"],
    usage: `import { NativeOnlyAnimatedView } from "@/components/ui/native-only-animated-view"
import { Text } from "@/components/ui/text"

export function Example() {
  return (
    <NativeOnlyAnimatedView className="p-4">
      <Text>Animated on native</Text>
    </NativeOnlyAnimatedView>
  )
}`,
  },
  {
    name: "popover",
    title: "Popover",
    description: "Displays rich content in a portal, triggered by a button.",
    deps: ["utils"],
    usage: `import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

export function Example() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <Text>Open</Text>
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Text>Place content for the popover here.</Text>
      </PopoverContent>
    </Popover>
  )
}`,
  },
  {
    name: "progress",
    title: "Progress",
    description:
      "Displays an indicator showing the completion progress of a task.",
    deps: ["utils"],
    usage: `import { Progress } from "@/components/ui/progress"

export function Example() {
  return <Progress value={33} className="w-full" />
}`,
  },
  {
    name: "radio-group",
    title: "Radio Group",
    description:
      "A set of checkable buttons where no more than one can be checked at a time.",
    deps: ["utils"],
    usage: `import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Text } from "@/components/ui/text"
import { View } from "react-native"

export function Example() {
  return (
    <RadioGroup defaultValue="comfortable">
      <View className="flex-row items-center gap-2">
        <RadioGroupItem value="default" id="r1" />
        <Label htmlFor="r1">
          <Text>Default</Text>
        </Label>
      </View>
      <View className="flex-row items-center gap-2">
        <RadioGroupItem value="comfortable" id="r2" />
        <Label htmlFor="r2">
          <Text>Comfortable</Text>
        </Label>
      </View>
    </RadioGroup>
  )
}`,
  },
  {
    name: "select",
    title: "Select",
    description: "Displays a list of options for the user to pick from.",
    deps: ["utils", "text", "icon"],
    usage: `import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Text } from "@/components/ui/text"

export function Example() {
  return (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple" label="Apple">
          <Text>Apple</Text>
        </SelectItem>
        <SelectItem value="banana" label="Banana">
          <Text>Banana</Text>
        </SelectItem>
      </SelectContent>
    </Select>
  )
}`,
  },
  {
    name: "separator",
    title: "Separator",
    description: "Visually or semantically separates content.",
    deps: ["utils"],
    usage: `import { Separator } from "@/components/ui/separator"
import { Text } from "@/components/ui/text"
import { View } from "react-native"

export function Example() {
  return (
    <View>
      <Text>Above</Text>
      <Separator className="my-4" />
      <Text>Below</Text>
    </View>
  )
}`,
  },
  {
    name: "skeleton",
    title: "Skeleton",
    description: "Use to show a placeholder while content is loading.",
    deps: ["utils"],
    usage: `import { Skeleton } from "@/components/ui/skeleton"
import { View } from "react-native"

export function Example() {
  return (
    <View className="flex-row items-center gap-4">
      <Skeleton className="size-12 rounded-full" />
      <View className="gap-2">
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-4 w-[160px]" />
      </View>
    </View>
  )
}`,
  },
  {
    name: "switch",
    title: "Switch",
    description:
      "A control that allows the user to toggle between checked and not checked.",
    deps: ["utils"],
    usage: `import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Text } from "@/components/ui/text"
import { View } from "react-native"

export function Example() {
  return (
    <View className="flex-row items-center gap-2">
      <Switch id="airplane" />
      <Label htmlFor="airplane">
        <Text>Airplane Mode</Text>
      </Label>
    </View>
  )
}`,
  },
  {
    name: "tabs",
    title: "Tabs",
    description:
      "A set of layered sections of content that are displayed one at a time.",
    deps: ["utils", "text"],
    usage: `import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Text } from "@/components/ui/text"

export function Example() {
  return (
    <Tabs defaultValue="account">
      <TabsList>
        <TabsTrigger value="account">
          <Text>Account</Text>
        </TabsTrigger>
        <TabsTrigger value="password">
          <Text>Password</Text>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <Text>Make changes to your account here.</Text>
      </TabsContent>
      <TabsContent value="password">
        <Text>Change your password here.</Text>
      </TabsContent>
    </Tabs>
  )
}`,
  },
  {
    name: "text",
    title: "Text",
    description:
      "A themed text component with variants for body, large, small, muted, and more.",
    deps: ["utils"],
    usage: `import { Text } from "@/components/ui/text"
import { View } from "react-native"

export function Example() {
  return (
    <View className="gap-2">
      <Text variant="h1">Heading 1</Text>
      <Text variant="large">Large text</Text>
      <Text>Default body text</Text>
      <Text variant="muted">Muted text</Text>
    </View>
  )
}`,
  },
  {
    name: "textarea",
    title: "Textarea",
    description:
      "Displays a form textarea or a component that looks like a textarea.",
    deps: ["utils"],
    usage: `import { Textarea } from "@/components/ui/textarea"

export function Example() {
  return <Textarea placeholder="Type your message here." />
}`,
  },
  {
    name: "toggle",
    title: "Toggle",
    description: "A two-state button that can be either on or off.",
    deps: ["utils", "text"],
    usage: `import { Toggle } from "@/components/ui/toggle"
import { Text } from "@/components/ui/text"

export function Example() {
  return (
    <Toggle aria-label="Toggle italic">
      <Text>Italic</Text>
    </Toggle>
  )
}`,
  },
  {
    name: "toggle-group",
    title: "Toggle Group",
    description: "A set of two-state buttons that can be toggled on or off.",
    deps: ["utils", "toggle"],
    usage: `import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Text } from "@/components/ui/text"

export function Example() {
  return (
    <ToggleGroup type="single">
      <ToggleGroupItem value="a">
        <Text>A</Text>
      </ToggleGroupItem>
      <ToggleGroupItem value="b">
        <Text>B</Text>
      </ToggleGroupItem>
      <ToggleGroupItem value="c">
        <Text>C</Text>
      </ToggleGroupItem>
    </ToggleGroup>
  )
}`,
  },
  {
    name: "tooltip",
    title: "Tooltip",
    description:
      "A popup that displays information related to an element when focused or hovered.",
    deps: ["utils", "text"],
    usage: `import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

export function Example() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">
          <Text>Hover</Text>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <Text>Add to library</Text>
      </TooltipContent>
    </Tooltip>
  )
}`,
  },
]

for (const component of COMPONENTS) {
  const depsLine =
    component.deps.length > 0
      ? `**Registry dependencies:** ${component.deps
        .map((d) => `\`${d}\``)
        .join(", ")}\n\n`
      : ""

  const content = `---
title: ${component.title}
description: ${component.description}
component: true
---

<ComponentPreviewCard title="${component.title}" />

## Installation

<PackageManagerTabs>
<PMTabContent value="npm">

\`\`\`bash
npx lovdacn@latest add ${component.name}
\`\`\`

</PMTabContent>
<PMTabContent value="yarn">

\`\`\`bash
yarn dlx lovdacn@latest add ${component.name}
\`\`\`

</PMTabContent>
<PMTabContent value="pnpm">

\`\`\`bash
pnpm dlx lovdacn@latest add ${component.name}
\`\`\`

</PMTabContent>
<PMTabContent value="bun">

\`\`\`bash
bunx lovdacn@latest add ${component.name}
\`\`\`

</PMTabContent>
</PackageManagerTabs>

*(You can also use the shortened \`lvcn\` alias, e.g., \`npx lvcn@latest add ${component.name}\`)*

This copies the component source into your project (typically \`components/ui/${component.name}.tsx\`) and installs any required dependencies.

${depsLine}## Usage

\`\`\`tsx
${component.usage}
\`\`\`

${component.extra ?? ""}## Styles

lvcn components are available across all style packs:

| Style | Notes |
| --- | --- |
| \`default\` | Classic rounded system |
| \`new-york\` | Compact, refined |
| \`nova\` | Sharp corners (default in many setups) |
| \`luma\` / \`lyra\` / \`maia\` / \`mira\` | Radius & font variants |
| \`rhea\` / \`sera\` / \`vega\` | Pill, zero-radius, balanced |

Style is set at project init via \`lvcn.json\` (\`style\` + \`styleEngine\`).

## Platform

These components target **Expo / React Native** with **NativeWind** or **Uniwind**. They use \`Platform.select\` where web and native need different behavior.
`

  fs.writeFileSync(path.join(componentsDir, `${component.name}.mdx`), content)
}

fs.writeFileSync(
  path.join(componentsDir, "meta.json"),
  JSON.stringify(
    {
      title: "Components",
      pages: ["index", ...COMPONENTS.map((c) => c.name)],
    },
    null,
    2
  )
)

fs.writeFileSync(
  path.join(componentsDir, "index.mdx"),
  `---
title: Components
description: Here you can find all the components available in lovdaCN. Built for Expo with NativeWind and Uniwind.
---

lovdaCN ships **${COMPONENTS.length}** UI components you can add to your Expo project with the CLI.

<ComponentsList />

---

Need a component that is not listed? Open an issue or contribute to the registry.
`
)

console.log(`Generated ${COMPONENTS.length} component docs`)

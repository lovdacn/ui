export type ComponentMeta = {
  name: string
  title: string
  description: string
  dependencies?: string[]
  registryDependencies?: string[]
  featured?: boolean
  /** Recently added — surfaced with a "New" badge in the docs nav. */
  new?: boolean
}

/** All UI components available in the lvcn registry (excluding utils). */
export const COMPONENTS: ComponentMeta[] = [
  {
    name: "accordion",
    title: "Accordion",
    description:
      "A vertically stacked set of interactive headings that each reveal a section of content.",
    registryDependencies: ["utils"],
  },
  {
    name: "alert",
    title: "Alert",
    description: "Displays a callout for user attention.",
    registryDependencies: ["utils", "text"],
  },
  {
    name: "alert-dialog",
    title: "Alert Dialog",
    description:
      "A modal dialog that interrupts the user with important content and expects a response.",
    registryDependencies: ["utils", "button", "text"],
  },
  {
    name: "aspect-ratio",
    title: "Aspect Ratio",
    description: "Displays content within a desired ratio.",
    registryDependencies: ["utils"],
  },
  {
    name: "avatar",
    title: "Avatar",
    description: "An image element with a fallback for representing the user.",
    registryDependencies: ["utils"],
  },
  {
    name: "badge",
    title: "Badge",
    description: "Displays a badge or a component that looks like a badge.",
    registryDependencies: ["utils", "text"],
  },
  {
    name: "breadcrumb",
    title: "Breadcrumb",
    description:
      "Displays the path to the current resource using a hierarchy of links.",
    dependencies: ["@rn-primitives/slot", "lucide-react-native"],
    registryDependencies: ["icon", "text", "utils"],
    new: true,
  },
  {
    name: "button",
    title: "Button",
    description: "Displays a button or a component that looks like a button.",
    dependencies: ["class-variance-authority"],
    registryDependencies: ["text", "utils"],
    featured: true,
  },
  {
    name: "card",
    title: "Card",
    description: "Displays a card with header, content, and footer.",
    registryDependencies: ["utils", "text"],
  },
  {
    name: "checkbox",
    title: "Checkbox",
    description:
      "A control that allows the user to toggle between checked and not checked.",
    registryDependencies: ["utils"],
  },
  {
    name: "collapsible",
    title: "Collapsible",
    description: "An interactive component which expands/collapses a panel.",
    registryDependencies: ["utils"],
  },
  {
    name: "context-menu",
    title: "Context Menu",
    description:
      "Displays a menu to the user — such as a set of actions or functions — triggered by a long press.",
    registryDependencies: ["utils", "text", "icon"],
  },
  {
    name: "dialog",
    title: "Dialog",
    description:
      "A window overlaid on either the primary window or another dialog window, rendering the content underneath inert.",
    registryDependencies: ["utils", "button", "text", "icon"],
  },
  {
    name: "dropdown-menu",
    title: "Dropdown Menu",
    description:
      "Displays a menu to the user — such as a set of actions or functions — triggered by a button.",
    registryDependencies: ["utils", "text", "icon"],
  },
  {
    name: "hover-card",
    title: "Hover Card",
    description:
      "For sighted users to preview content available behind a link.",
    registryDependencies: ["utils"],
  },
  {
    name: "icon",
    title: "Icon",
    description:
      "A platform-aware icon component built on Lucide for consistent iconography.",
    dependencies: ["lucide-react-native"],
    registryDependencies: ["utils"],
  },
  {
    name: "input",
    title: "Input",
    description:
      "Displays a form input field or a component that looks like an input field.",
    registryDependencies: ["utils"],
  },
  {
    name: "input-otp",
    title: "Input OTP",
    description:
      "A one-time-password input with slotted digits, an active caret, and OS autofill support.",
    registryDependencies: ["text", "utils"],
    new: true,
  },
  {
    name: "label",
    title: "Label",
    description: "Renders an accessible label associated with controls.",
    registryDependencies: ["utils", "text"],
  },
  {
    name: "menubar",
    title: "Menubar",
    description:
      "A visually persistent menu common in desktop applications that provides quick access to a consistent set of commands.",
    registryDependencies: ["utils", "text", "icon"],
  },
  {
    name: "native-only-animated-view",
    title: "Native Only Animated View",
    description:
      "A view that animates only on native platforms and is a plain View on web.",
    registryDependencies: ["utils"],
  },
  {
    name: "popover",
    title: "Popover",
    description: "Displays rich content in a portal, triggered by a button.",
    registryDependencies: ["utils"],
  },
  {
    name: "progress",
    title: "Progress",
    description:
      "Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.",
    registryDependencies: ["utils"],
  },
  {
    name: "radio-group",
    title: "Radio Group",
    description:
      "A set of checkable buttons—known as radio buttons—where no more than one of the buttons can be checked at a time.",
    registryDependencies: ["utils"],
  },
  {
    name: "select",
    title: "Select",
    description:
      "Displays a list of options for the user to pick from—triggered by a button.",
    registryDependencies: ["utils", "text", "icon"],
  },
  {
    name: "separator",
    title: "Separator",
    description: "Visually or semantically separates content.",
    registryDependencies: ["utils"],
  },
  {
    name: "sidebar",
    title: "Sidebar",
    description:
      "A composable, collapsible sidebar with a mobile drawer — provider, trigger, groups, and menus.",
    dependencies: ["class-variance-authority", "lucide-react-native"],
    registryDependencies: ["icon", "separator", "skeleton", "text", "utils"],
    new: true,
  },
  {
    name: "skeleton",
    title: "Skeleton",
    description: "Use to show a placeholder while content is loading.",
    registryDependencies: ["utils"],
  },
  {
    name: "switch",
    title: "Switch",
    description:
      "A control that allows the user to toggle between checked and not checked.",
    registryDependencies: ["utils"],
  },
  {
    name: "tabs",
    title: "Tabs",
    description:
      "A set of layered sections of content—known as tab panels—that are displayed one at a time.",
    registryDependencies: ["utils", "text"],
  },
  {
    name: "text",
    title: "Text",
    description:
      "A themed text component with variants for body, large, small, muted, and more.",
    dependencies: ["class-variance-authority"],
    registryDependencies: ["utils"],
    featured: true,
  },
  {
    name: "textarea",
    title: "Textarea",
    description:
      "Displays a form textarea or a component that looks like a textarea.",
    registryDependencies: ["utils"],
  },
  {
    name: "toggle",
    title: "Toggle",
    description: "A two-state button that can be either on or off.",
    dependencies: ["class-variance-authority"],
    registryDependencies: ["utils", "text"],
  },
  {
    name: "toggle-group",
    title: "Toggle Group",
    description: "A set of two-state buttons that can be toggled on or off.",
    registryDependencies: ["utils", "toggle"],
  },
  {
    name: "tooltip",
    title: "Tooltip",
    description:
      "A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.",
    registryDependencies: ["utils", "text"],
  },
]

export function getComponent(name: string) {
  return COMPONENTS.find((c) => c.name === name)
}

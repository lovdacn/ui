/**
 * build-registry.cjs
 *
 * Compiles raw React Native component sources from react-native-reusables
 * into a shadcn-compatible JSON registry structure.
 *
 * Output structure:
 *   styles/<engine>/<style>/
 *     index.json          – style metadata (like shadcn style.json)
 *     utils.json          – utils registry item
 *     button.json         – component registry items
 *     accordion.json
 *     ...
 *
 * Where:
 *   engine = nativewind | uniwind
 *   style  = new-york | mira | default | luma | lyra | maia | nova | rhea | sera | vega
 */

const fs = require('fs-extra');
const path = require('path');
const { twMerge } = require('tailwind-merge');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const STYLES = [
  { name: 'default',  label: 'Default' },
  { name: 'new-york', label: 'New York' },
  { name: 'luma',     label: 'Luma' },
  { name: 'lyra',     label: 'Lyra' },
  { name: 'maia',     label: 'Maia' },
  { name: 'mira',     label: 'Mira' },
  { name: 'nova',     label: 'Nova' },
  { name: 'rhea',     label: 'Rhea' },
  { name: 'sera',     label: 'Sera' },
  { name: 'vega',     label: 'Vega' },
];

const ENGINES = ['nativewind', 'uniwind'];

const WORKSPACE_ROOT = path.resolve(__dirname, '../../../../');
const REUSABLES_SRC = path.join(WORKSPACE_ROOT, 'react-native-reusables/packages/registry/src');
const DEST_REGISTRY = path.join(WORKSPACE_ROOT, 'lvcn/apps/v2/public/r/styles');

// Packages that are always present in Expo projects and should not be
// listed as component dependencies.
const PEER_DEPENDENCIES = new Set([
  'react', 'react-dom', 'react-native', 'react-native-web',
  'react-native-reanimated', 'react-native-gesture-handler',
  'react-native-screens', 'react-native-safe-area-context',
  'expo', 'expo-router', 'expo-constants', 'expo-font',
  'expo-linking', 'expo-splash-screen', 'expo-status-bar',
  'expo-symbols', 'expo-system-ui', 'expo-web-browser',
]);

const PINNED_DEPENDENCIES = new Map([
  ['@rn-primitives/popover', '@rn-primitives/popover@^1.5.2'],
  ['@rn-primitives/tooltip', '@rn-primitives/tooltip@^1.5.2'],
  ['@rn-primitives/dropdown-menu', '@rn-primitives/dropdown-menu@^1.5.2'],
  ['@rn-primitives/hover-card', '@rn-primitives/hover-card@^1.5.2'],
  ['@rn-primitives/context-menu', '@rn-primitives/context-menu@^1.5.2'],
  ['@rn-primitives/dialog', '@rn-primitives/dialog@^1.5.2'],
  ['@rn-primitives/alert-dialog', '@rn-primitives/alert-dialog@^1.5.2'],
  ['@rn-primitives/portal', '@rn-primitives/portal@^1.5.2'],
]);

const PORTAL_COMPONENTS = new Set([
  'alert-dialog',
  'context-menu',
  'dialog',
  'dropdown-menu',
  'hover-card',
  'popover',
  'select',
  'tooltip',
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse import statements from TypeScript source to extract:
 *  - npm dependencies (external packages)
 *  - registry dependencies (sibling components / utils)
 */
function parseImports(content, componentName) {
  const dependencies = new Set();
  const registryDependencies = new Set();

  const importRegex = /import\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/g;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    const source = match[1];

    // Internal component references (~/components/ui/xxx or @/registry/.../components/ui/xxx)
    if (
      source.includes('components/ui/') ||
      source.includes('components/ui\\')
    ) {
      const parts = source.split('/');
      const last = parts[parts.length - 1];
      if (last && last !== '.' && last !== '..') {
        registryDependencies.add(last);
      }
    }
    // Internal lib/utils reference
    else if (source.includes('lib/utils')) {
      registryDependencies.add('utils');
    }
    // Relative imports within the same directory
    else if (source.startsWith('./') || source.startsWith('../')) {
      const parts = source.split('/');
      const last = parts[parts.length - 1];
      if (last && last !== '.' && last !== '..') {
        registryDependencies.add(last);
      }
    }
    // External npm package
    else {
      const pkgName = source.startsWith('@')
        ? source.split('/').slice(0, 2).join('/')
        : source.split('/')[0];

      if (!PEER_DEPENDENCIES.has(pkgName)) {
        dependencies.add(PINNED_DEPENDENCIES.get(pkgName) || pkgName);
      }
    }
  }

  if (PORTAL_COMPONENTS.has(componentName)) {
    dependencies.add(PINNED_DEPENDENCIES.get('@rn-primitives/portal'));
  }

  // Remove self-references
  registryDependencies.delete(componentName);

  return {
    dependencies: Array.from(dependencies),
    registryDependencies: Array.from(registryDependencies),
  };
}

/**
 * Normalize monorepo import paths so the content is portable.
 * e.g. '@/registry/nativewind/components/ui/text' -> '@/components/ui/text'
 *      '@/registry/uniwind/lib/utils'              -> '@/lib/utils'
 */
function normalizeContent(content) {
  return content
    .replace(/@\/registry\/(?:nativewind|uniwind)\//g, '@/')
    .replace(/\r\n/g, '\n'); // Normalize line endings
}

function addGestureResponderImport(content) {
  return content
    .replace(
      "import { Platform, StyleSheet } from 'react-native';",
      "import { Platform, StyleSheet, type GestureResponderEvent } from 'react-native';"
    )
    .replace(
      "import { Platform, View, type ViewProps } from 'react-native';",
      "import { Platform, View, type GestureResponderEvent, type ViewProps } from 'react-native';"
    )
    .replace(
      "  type ViewStyle,\n} from 'react-native';",
      "  type ViewStyle,\n  type GestureResponderEvent,\n} from 'react-native';"
    );
}

function applyOverlayCloseFix(content, primitiveName, contentTypeName) {
  if (content.includes(`${primitiveName}.useRootContext()`)) {
    return content;
  }

  content = addGestureResponderImport(content);
  content = content.replace(
    new RegExp(
      `}: React\\.ComponentProps<typeof ${primitiveName.replace('.', '\\.')}.${contentTypeName}> & \\{\\n    portalHost\\?: string;\\n  \\}\\) \\{\\n  return \\(`
    ),
    `}: React.ComponentProps<typeof ${primitiveName}.${contentTypeName}> & {\n    portalHost?: string;\n  }) {\n  const { onOpenChange } = ${primitiveName}.useRootContext();\n\n  function onOverlayPress(event: GestureResponderEvent) {\n    if (event.target === event.currentTarget && !event.isDefaultPrevented()) {\n      onOpenChange(false);\n    }\n  }\n\n  return (`
  );
  return content;
}

function applyMenuOverlayCloseFix(content, primitiveName) {
  if (!content.includes(`${primitiveName}.useRootContext()`)) {
    content = addGestureResponderImport(content);
    content = content.replace(
      new RegExp(
        `}: React\\.ComponentProps<typeof ${primitiveName.replace('.', '\\.')}.Content> & \\{\\n    overlayStyle\\?: StyleProp<ViewStyle>;\\n    overlayClassName\\?: string;\\n    portalHost\\?: string;\\n  \\}\\) \\{\\n  return \\(`
      ),
      `}: React.ComponentProps<typeof ${primitiveName}.Content> & {\n    overlayStyle?: StyleProp<ViewStyle>;\n    overlayClassName?: string;\n    portalHost?: string;\n  }) {\n  const { onOpenChange } = ${primitiveName}.useRootContext();\n\n  function onOverlayPress(event: GestureResponderEvent) {\n    if (event.target === event.currentTarget && !event.isDefaultPrevented()) {\n      onOpenChange(false);\n    }\n  }\n\n  return (`
    );
  }

  return content.replace(
    '          className={overlayClassName}>',
    "          className={overlayClassName}\n          onPress={Platform.select({ web: onOverlayPress, native: undefined })}>"
  );
}

function applyLvcnComponentFixes(fileName, content) {
  if (fileName === 'text.tsx') {
    if (!content.includes('const textStyle = Platform.select')) {
      content = content.replace(
        'const TextClassContext = React.createContext<string | undefined>(undefined);\n\nfunction Text({',
        "const TextClassContext = React.createContext<string | undefined>(undefined);\n\nconst textStyle = Platform.select({\n  android: {\n    includeFontPadding: false,\n    textAlignVertical: 'center' as const,\n  },\n});\n\nfunction Text({"
      );
      content = content.replace(
        "  variant = 'default',\n  ...props",
        "  variant = 'default',\n  style,\n  ...props"
      );
      content = content.replace(
        '      aria-level={variant ? ARIA_LEVEL[variant] : undefined}\n      {...props}',
        '      aria-level={variant ? ARIA_LEVEL[variant] : undefined}\n      style={[textStyle, style]}\n      {...props}'
      );
    }
  } else if (fileName === 'tabs.tsx') {
    content = content
      .replace(
        "'text-foreground dark:text-muted-foreground text-sm font-medium'",
        "'text-foreground dark:text-muted-foreground text-sm font-medium leading-none'"
      )
      .replace(
        "'flex h-[calc(100%-1px)] flex-row items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 shadow-none shadow-black/5'",
        "'flex flex-row items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 shadow-none shadow-black/5'"
      )
      .replace('web:h-[calc(100%-1px)]', 'h-full')
      .replace(
        "web: 'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring inline-flex",
        "web: 'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring h-full inline-flex"
      );

    if (!content.includes("native: 'h-full py-0'")) {
      content = content.replace(
        /(web: 'focus-visible[^']*h-full[^']*',)/,
        "$1\n            native: 'h-full py-0',"
      );
    }
  } else if (fileName === 'dialog.tsx') {
    content = content.replace(
      "'absolute bottom-0 left-0 right-0 top-0 flex items-center justify-center bg-black/50 p-2'",
      "'absolute bottom-0 left-0 right-0 top-0 z-50 flex items-center justify-center bg-black/50 p-2'"
    );
    content = content.replace(
      "'bg-background border-border z-50 mx-auto flex w-full flex-col gap-4 rounded-lg border p-6 shadow-lg shadow-black/5 sm:max-w-lg'",
      "'bg-background border-border z-50 mx-auto flex w-full max-w-lg flex-col gap-4 rounded-lg border p-6 shadow-lg shadow-black/5 sm:max-w-lg'"
    );
  } else if (fileName === 'alert-dialog.tsx') {
    content = content.replace(
      "'bg-background border-border z-50 flex flex-col gap-4 rounded-lg border p-6 shadow-lg shadow-black/5 sm:max-w-lg'",
      "'bg-background border-border z-50 mx-auto flex w-full max-w-lg flex-col gap-4 rounded-lg border p-6 shadow-lg shadow-black/5 sm:max-w-lg'"
    );
    if (!content.includes('AlertDialogPrimitive.useRootContext()')) {
      content = addGestureResponderImport(content);
      content = content.replace(
        /function AlertDialogOverlay\(\{\n  className,\n  children,\n  \.\.\.props\n\}: Omit<React\.ComponentProps<typeof AlertDialogPrimitive\.Overlay>, 'asChild'> & \{\n    children\?: React\.ReactNode;\n  \}\) \{\n  return \(/,
        "function AlertDialogOverlay({\n  className,\n  children,\n  onPress,\n  ...props\n}: Omit<React.ComponentProps<typeof AlertDialogPrimitive.Overlay>, 'asChild'> & {\n  children?: React.ReactNode;\n}) {\n  const { onOpenChange } = AlertDialogPrimitive.useRootContext();\n\n  function onOverlayPress(event: GestureResponderEvent) {\n    onPress?.(event);\n    if (event.target === event.currentTarget && !event.isDefaultPrevented()) {\n      onOpenChange(false);\n    }\n  }\n\n  return ("
      );
      content = content.replace(
        '        {...props}>',
        "        {...props}\n        onPress={Platform.select({ web: onOverlayPress, native: onPress })}>"
      );
    }
  } else if (fileName === 'popover.tsx') {
    // Keep primitive-controlled open/close behavior. Do not inject useRootContext here:
    // older mobile primitive builds do not expose it consistently, and native overlays
    // already manage outside presses internally.
  } else if (fileName === 'tooltip.tsx') {
    // @rn-primitives/tooltip controls open state internally and does not export useRootContext.
  } else if (fileName === 'dropdown-menu.tsx') {
    // Keep primitive-controlled open/close behavior; no injected root-context hook.
  } else if (fileName === 'context-menu.tsx') {
    if (!content.includes('const ContextMenuPortal = ContextMenuPrimitive.Portal;')) {
      content = content.replace(
        'const ContextMenuGroup = ContextMenuPrimitive.Group;\nconst ContextMenuSub = ContextMenuPrimitive.Sub;',
        'const ContextMenuGroup = ContextMenuPrimitive.Group;\nconst ContextMenuPortal = ContextMenuPrimitive.Portal;\nconst ContextMenuSub = ContextMenuPrimitive.Sub;'
      );
      content = content.replace(
        '  ContextMenuLabel,\n  ContextMenuRadioGroup,',
        '  ContextMenuLabel,\n  ContextMenuPortal,\n  ContextMenuRadioGroup,'
      );
    }
    // Keep primitive-controlled open/close behavior; no injected root-context hook.
  } else if (fileName === 'menubar.tsx') {
    // The Menubar wrapper already manages `value`/`onValueChange` internally
    // (useState fallback), but its type is React.ComponentProps<typeof
    // MenubarPrimitive.Root>, which makes both props REQUIRED. That forces
    // callers to pass state even for the common uncontrolled `<Menubar>...`
    // usage and produces:
    //   Type '{ children: Element[]; }' is missing the following properties ...
    //   value, onValueChange
    // Make them optional to match the implementation.
    content = content.replace(
      '  value: valueProp,\n  onValueChange: onValueChangeProp,\n  ...props\n}: React.ComponentProps<typeof MenubarPrimitive.Root>) {',
      "  value: valueProp,\n  onValueChange: onValueChangeProp,\n  ...props\n}: Omit<React.ComponentProps<typeof MenubarPrimitive.Root>, 'value' | 'onValueChange'> & {\n  value?: string;\n  onValueChange?: (value: string | undefined) => void;\n}) {"
    );
  }


  return content;
}

/**
 * Parse a style CSS file to extract .cn-* class mapping to Tailwind classes.
 */
function parseCssStyleSheet(cssContent) {
  const styleMap = {};
  const ruleRegex = /\.cn-([\w-]+)\s*\{\s*@apply\s+([^;]+);/g;
  let match;
  while ((match = ruleRegex.exec(cssContent)) !== null) {
    const className = 'cn-' + match[1];
    const tailwindClasses = match[2].trim().replace(/\s+/g, ' ');
    styleMap[className] = tailwindClasses;
  }
  return styleMap;
}

function appendCnMarker(content, classLiteral, marker) {
  if (content.includes(`${classLiteral} ${marker}`)) {
    return content;
  }
  return content.replace(`'${classLiteral}'`, `'${classLiteral} ${marker}'`);
}
/**
 * Dynamically inject cn-* placeholder classes into components.
 */
function injectCnPlaceholderClasses(fileName, content) {
  let res = content;

  if (fileName === 'button.tsx') {
    res = res.replace(/const buttonVariants = cva\(\s*cn\(/g, "const buttonVariants = cva(cn('cn-button',");
    res = res.replace(/default: cn\(\s*'bg-primary/g, "default: cn('cn-button-variant-default bg-primary");
    res = res.replace(/destructive: cn\(\s*'bg-destructive/g, "destructive: cn('cn-button-variant-destructive bg-destructive");
    res = res.replace(/outline: cn\(\s*'border-border/g, "outline: cn('cn-button-variant-outline border-border");
    res = res.replace(/secondary: cn\(\s*'bg-secondary/g, "secondary: cn('cn-button-variant-secondary bg-secondary");
    res = res.replace(/ghost: cn\(\s*'active:bg-accent/g, "ghost: cn('cn-button-variant-ghost active:bg-accent");
    res = res.replace(/link: ''/g, "link: 'cn-button-variant-link'");

    res = res.replace(/default: cn\(\s*'h-10 px-4 py-2/g, "default: cn('cn-button-size-default h-10 px-4 py-2");
    res = res.replace(/sm: cn\(\s*'h-9 gap-1\.5 rounded-md/g, "sm: cn('cn-button-size-sm h-9 gap-1.5 rounded-md");
    res = res.replace(/lg: cn\(\s*'h-11 rounded-md/g, "lg: cn('cn-button-size-lg h-11 rounded-md");
    res = res.replace(/icon: 'h-10 w-10 sm:h-9 sm:w-9'/g, "icon: 'cn-button-size-icon h-10 w-10 sm:h-9 sm:w-9'");

    res = res.replace(/const buttonTextVariants = cva\(\s*cn\(/g, "const buttonTextVariants = cva(cn('cn-button-text',");
    res = res.replace(/default: 'text-primary-foreground',/g, "default: 'cn-button-text-variant-default text-primary-foreground',");
    res = res.replace(/destructive: 'text-white',/g, "destructive: 'cn-button-text-variant-destructive text-white',");
    res = res.replace(/outline: cn\(\s*'group-active:text-accent-foreground'/g, "outline: cn('cn-button-text-variant-outline group-active:text-accent-foreground'");
    res = res.replace(/secondary: 'text-secondary-foreground',/g, "secondary: 'cn-button-text-variant-secondary text-secondary-foreground',");
    res = res.replace(/ghost: 'group-active:text-accent-foreground',/g, "ghost: 'cn-button-text-variant-ghost group-active:text-accent-foreground',");
    res = res.replace(/link: cn\(\s*'text-primary/g, "link: cn('cn-button-text-variant-link text-primary");

    // The real base container classes live in a later cn() argument than the
    // leading cn-button marker; append the marker here so the resolved style
    // classes are the LAST argument and win at runtime tailwind-merge.
    res = appendCnMarker(res, 'group shrink-0 flex-row items-center justify-center gap-2 rounded-md shadow-none', 'cn-button');
  } else if (fileName === 'badge.tsx') {
    res = res.replace(/const badgeVariants = cva\(\s*cn\(/g, "const badgeVariants = cva(cn('cn-badge',");
    res = res.replace(/default: cn\(\s*'bg-primary/g, "default: cn('cn-badge-variant-default bg-primary");
    res = res.replace(/secondary: cn\(\s*'bg-secondary/g, "secondary: cn('cn-badge-variant-secondary bg-secondary");
    res = res.replace(/destructive: cn\(\s*'bg-destructive/g, "destructive: cn('cn-badge-variant-destructive bg-destructive");
    res = res.replace(/outline: cn\(\s*'text-foreground/g, "outline: cn('cn-badge-variant-outline text-foreground");

    res = res.replace(/const badgeTextVariants = cva\(\s*'text-xs font-semibold'/g, "const badgeTextVariants = cva('cn-badge-text text-xs font-semibold'");
    res = res.replace(/default: 'text-primary-foreground',/g, "default: 'cn-badge-text-variant-default text-primary-foreground',");
    res = res.replace(/secondary: 'text-secondary-foreground',/g, "secondary: 'cn-badge-text-variant-secondary text-secondary-foreground',");
    res = res.replace(/destructive: 'text-destructive-foreground',/g, "destructive: 'cn-badge-text-variant-destructive text-destructive-foreground',");
    res = res.replace(/outline: 'text-foreground',/g, "outline: 'cn-badge-text-variant-outline text-foreground',");

    // Append the marker to the real base container literal (later cn() arg) so
    // resolved style classes win at runtime tailwind-merge.
    res = appendCnMarker(res, 'border-border group shrink-0 flex-row items-center justify-center gap-1 overflow-hidden rounded-full border px-2 py-0.5', 'cn-badge');
  } else if (fileName === 'input.tsx') {
    res = res.replace(
      /className=\{cn\(\s*'(?=[^']*\bborder-input\b[^']*\bw-full\b)/,
      "className={cn('cn-input "
    );
  } else if (fileName === 'textarea.tsx') {
    res = res.replace(
      /className=\{cn\(\s*'(?=[^']*\bborder-input\b[^']*\bmin-h-)/,
      "className={cn('cn-textarea "
    );
  } else if (fileName === 'checkbox.tsx') {
    res = res.replace(/className=\{cn\(\s*'peer h-4 w-4/g, "className={cn('cn-checkbox peer h-4 w-4");
    res = res.replace(/className=\{cn\('items-center justify-center flex'/g, "className={cn('cn-checkbox-indicator items-center justify-center flex'");
  } else if (fileName === 'switch.tsx') {
    res = res.replace(/className=\{cn\(\s*'peer web:focus-visible:outline-none/g, "className={cn('cn-switch peer web:focus-visible:outline-none");
    res = res.replace(/className=\{cn\(\s*'bg-background/g, "className={cn('cn-switch-thumb bg-background");
  } else if (fileName === 'radio-group.tsx') {
    res = res.replace(/className=\{cn\('gap-2', className\)\}/g, "className={cn('cn-radio-group gap-2', className)}");
    res = res.replace(/className=\{cn\(\s*'peer aspect-square/g, "className={cn('cn-radio-group-item peer aspect-square");
    res = res.replace(/className=\{cn\('items-center justify-center flex'\)\}/g, "className={cn('cn-radio-group-indicator items-center justify-center flex')}");
    res = res.replace(/className=\{cn\('bg-primary/g, "className={cn('cn-radio-group-indicator-icon bg-primary");
  } else if (fileName === 'select.tsx') {
    res = res.replace(/className=\{cn\(\s*'border-input dark:bg-input\/30/g, "className={cn('cn-select-trigger border-input dark:bg-input/30");
    res = res.replace(/className=\{cn\(\s*'text-foreground line-clamp-1/g, "className={cn('cn-select-value text-foreground line-clamp-1");
    res = res.replace(/className=\{cn\(\s*'bg-popover border-border/g, "className={cn('cn-select-content bg-popover border-border");
    res = res.replace(/className=\{cn\(\s*'active:bg-accent group/g, "className={cn('cn-select-item active:bg-accent group");
    res = res.replace(/className=\{cn\('text-muted-foreground px-2 py-2 text-xs sm:py-1\.5', className\)\}/g, "className={cn('cn-select-label text-muted-foreground px-2 py-2 text-xs sm:py-1.5', className)}");
    res = res.replace(/className=\{cn\(\s*'bg-border -mx-1 my-1 h-px'/g, "className={cn('cn-select-separator bg-border -mx-1 my-1 h-px'");
  } else if (fileName === 'progress.tsx') {
    res = res.replace(/className=\{cn\(\s*'relative h-4 w-full/g, "className={cn('cn-progress relative h-4 w-full");
    res = res.replace(/className=\{cn\('h-full w-full bg-primary/g, "className={cn('cn-progress-indicator h-full w-full bg-primary");
  } else if (fileName === 'avatar.tsx') {
    res = res.replace(/className=\{cn\(\s*'relative flex h-10 w-10/g, "className={cn('cn-avatar relative flex h-10 w-10");
    res = res.replace(/className=\{cn\('aspect-square h-full w-full', className\)\}/g, "className={cn('cn-avatar-image aspect-square h-full w-full', className)}");
    res = res.replace(/className=\{cn\(\s*'flex h-full w-full/g, "className={cn('cn-avatar-fallback flex h-full w-full");
  } else if (fileName === 'skeleton.tsx') {
    res = res.replace(/className=\{cn\('bg-muted web:animate-pulse', className\)\}/g, "className={cn('cn-skeleton bg-muted web:animate-pulse', className)}");
  } else if (fileName === 'separator.tsx') {
    res = res.replace(/className=\{cn\(\s*'bg-border shrink-0'/g, "className={cn('cn-separator bg-border shrink-0'");
  } else if (fileName === 'accordion.tsx') {
    res = res.replace(/className=\{className\}/g, "className={cn('cn-accordion', className)}");
    res = res.replace(/className=\{cn\('border-b border-border', className\)\}/g, "className={cn('cn-accordion-item border-b border-border', className)}");
    res = res.replace(/className=\{cn\(\s*'flex flex-row items-center justify-between/g, "className={cn('cn-accordion-trigger flex flex-row items-center justify-between");
    res = res.replace(/className=\{cn\('overflow-hidden text-sm/g, "className={cn('cn-accordion-content overflow-hidden text-sm");
    res = appendCnMarker(res, 'border-border border-b', 'cn-accordion-item');
    res = appendCnMarker(res, 'flex-row items-start justify-between gap-4 rounded-md py-4 disabled:opacity-50', 'cn-accordion-trigger');
    res = appendCnMarker(res, 'overflow-hidden', 'cn-accordion-content');
  } else if (fileName === 'collapsible.tsx') {
    res = res.replace(/className=\{cn\('gap-1', className\)\}/g, "className={cn('cn-collapsible gap-1', className)}");
    res = res.replace(/className=\{cn\('flex flex-row/g, "className={cn('cn-collapsible-trigger flex flex-row");
    res = res.replace(/className=\{cn\('overflow-hidden', className\)\}/g, "className={cn('cn-collapsible-content overflow-hidden', className)}");
  } else if (fileName === 'alert.tsx') {
    res = res.replace(/className=\{cn\(\s*'relative w-full rounded-lg border border-border p-4/g, "className={cn('cn-alert relative w-full rounded-lg border border-border p-4");
    res = res.replace(/className=\{cn\('mb-1\.5 font-medium text-foreground tracking-tight leading-none', className\)\}/g, "className={cn('cn-alert-title mb-1.5 font-medium text-foreground tracking-tight leading-none', className)}");
    res = res.replace(/className=\{cn\('text-sm text-muted-foreground leading-relaxed', className\)\}/g, "className={cn('cn-alert-description text-sm text-muted-foreground leading-relaxed', className)}");
    res = appendCnMarker(res, 'bg-card border-border relative w-full rounded-lg border px-4 pb-2 pt-3.5', 'cn-alert');
    res = appendCnMarker(res, 'mb-1 ml-0.5 min-h-4 pl-6 font-medium leading-none tracking-tight', 'cn-alert-title');
    res = appendCnMarker(res, 'text-muted-foreground ml-0.5 pb-1.5 pl-6 text-sm leading-relaxed', 'cn-alert-description');
  } else if (fileName === 'card.tsx') {
    res = res.replace(/className=\{cn\(\s*'rounded-xl border border-border bg-card/g, "className={cn('cn-card rounded-xl border border-border bg-card");
    res = res.replace(/className=\{cn\('flex flex-col space-y-1\.5 p-6', className\)\}/g, "className={cn('cn-card-header flex flex-col space-y-1.5 p-6', className)}");
    res = res.replace(/className=\{cn\(\s*'text-2xl font-semibold/g, "className={cn('cn-card-title text-2xl font-semibold");
    res = res.replace(/className=\{cn\('text-sm text-muted-foreground', className\)\}/g, "className={cn('cn-card-description text-sm text-muted-foreground', className)}");
    res = res.replace(/className=\{cn\('p-6 pt-0', className\)\}/g, "className={cn('cn-card-content p-6 pt-0', className)}");
    res = res.replace(/className=\{cn\('flex items-center p-6 pt-0', className\)\}/g, "className={cn('cn-card-footer flex items-center p-6 pt-0', className)}");
    res = appendCnMarker(res, 'bg-card border-border flex flex-col gap-6 rounded-xl border py-6 shadow-sm shadow-black/5', 'cn-card');
    res = appendCnMarker(res, 'flex flex-col gap-1.5 px-6', 'cn-card-header');
    res = appendCnMarker(res, 'font-semibold leading-none', 'cn-card-title');
    res = appendCnMarker(res, 'text-muted-foreground text-sm', 'cn-card-description');
    res = appendCnMarker(res, 'px-6', 'cn-card-content');
    res = appendCnMarker(res, 'flex flex-row items-center px-6', 'cn-card-footer');
  } else if (fileName === 'dialog.tsx') {
    res = appendCnMarker(res, 'absolute bottom-0 left-0 right-0 top-0 z-50 flex items-center justify-center bg-black/50 p-2', 'cn-dialog-overlay');
    res = appendCnMarker(res, 'bg-background border-border z-50 mx-auto flex w-full max-w-lg flex-col gap-4 rounded-lg border p-6 shadow-lg shadow-black/5 sm:max-w-lg', 'cn-dialog-content');
    res = appendCnMarker(res, 'absolute right-4 top-4 rounded opacity-70 active:opacity-100', 'cn-dialog-close');
    res = appendCnMarker(res, 'flex flex-col gap-2 text-center sm:text-left', 'cn-dialog-header');
    res = appendCnMarker(res, 'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', 'cn-dialog-footer');
    res = appendCnMarker(res, 'text-foreground text-lg font-semibold leading-none', 'cn-dialog-title');
    res = appendCnMarker(res, 'text-muted-foreground text-sm', 'cn-dialog-description');
  } else if (fileName === 'alert-dialog.tsx') {
    res = appendCnMarker(res, 'absolute bottom-0 left-0 right-0 top-0 z-50 flex items-center justify-center bg-black/50 p-2', 'cn-alert-dialog-overlay');
    res = appendCnMarker(res, 'bg-background border-border z-50 mx-auto flex w-full max-w-lg flex-col gap-4 rounded-lg border p-6 shadow-lg shadow-black/5 sm:max-w-lg', 'cn-alert-dialog-content');
    res = appendCnMarker(res, 'flex flex-col gap-2', 'cn-alert-dialog-header');
    res = appendCnMarker(res, 'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', 'cn-alert-dialog-footer');
    res = appendCnMarker(res, 'text-foreground text-lg font-semibold', 'cn-alert-dialog-title');
    res = appendCnMarker(res, 'text-muted-foreground text-sm', 'cn-alert-dialog-description');
  } else if (fileName === 'popover.tsx') {
    res = appendCnMarker(res, 'bg-popover border-border outline-hidden z-50 w-72 rounded-md border p-4 shadow-md shadow-black/5', 'cn-popover-content');
  } else if (fileName === 'tooltip.tsx') {
    res = appendCnMarker(res, 'bg-primary z-50 rounded-md px-3 py-2 sm:py-1.5', 'cn-tooltip-content');
  } else if (fileName === 'dropdown-menu.tsx') {
    res = appendCnMarker(res, 'active:bg-accent group flex flex-row items-center justify-between rounded-sm px-2 py-2 sm:py-1.5', 'cn-dropdown-menu-sub-trigger');
    res = appendCnMarker(res, 'bg-popover border-border overflow-hidden rounded-md border p-1 shadow-lg shadow-black/5', 'cn-dropdown-menu-sub-content');
    res = appendCnMarker(res, 'bg-popover border-border min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-lg shadow-black/5', 'cn-dropdown-menu-content');
    res = appendCnMarker(res, 'active:bg-accent group relative flex flex-row items-center gap-2 rounded-sm px-2 py-2 sm:py-1.5', 'cn-dropdown-menu-item');
    res = appendCnMarker(res, 'active:bg-accent group relative flex flex-row items-center gap-2 rounded-sm py-2 pl-8 pr-2 sm:py-1.5', 'cn-dropdown-menu-checkbox-item');
    res = appendCnMarker(res, 'active:bg-accent group relative flex flex-row items-center gap-2 rounded-sm py-2 pl-8 pr-2 sm:py-1.5', 'cn-dropdown-menu-radio-item');
    res = appendCnMarker(res, 'text-foreground px-2 py-2 text-sm font-medium sm:py-1.5', 'cn-dropdown-menu-label');
    res = appendCnMarker(res, 'bg-border -mx-1 my-1 h-px', 'cn-dropdown-menu-separator');
    res = appendCnMarker(res, 'text-muted-foreground ml-auto text-xs tracking-widest', 'cn-dropdown-menu-shortcut');
  } else if (fileName === 'context-menu.tsx') {
    res = appendCnMarker(res, 'active:bg-accent group flex flex-row items-center justify-between rounded-sm px-2 py-2 sm:py-1.5', 'cn-context-menu-sub-trigger');
    res = appendCnMarker(res, 'bg-popover border-border overflow-hidden rounded-md border p-1 shadow-lg shadow-black/5', 'cn-context-menu-sub-content');
    res = appendCnMarker(res, 'bg-popover border-border min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-lg shadow-black/5', 'cn-context-menu-content');
    res = appendCnMarker(res, 'active:bg-accent group relative flex flex-row items-center gap-2 rounded-sm px-2 py-2 sm:py-1.5', 'cn-context-menu-item');
    res = appendCnMarker(res, 'active:bg-accent group relative flex flex-row items-center gap-2 rounded-sm py-2 pl-8 pr-2 sm:py-1.5', 'cn-context-menu-checkbox-item');
    res = appendCnMarker(res, 'active:bg-accent group relative flex flex-row items-center gap-2 rounded-sm py-2 pl-8 pr-2 sm:py-1.5', 'cn-context-menu-radio-item');
    res = appendCnMarker(res, 'text-foreground px-2 py-2 text-sm font-medium sm:py-1.5', 'cn-context-menu-label');
    res = appendCnMarker(res, 'bg-border -mx-1 my-1 h-px', 'cn-context-menu-separator');
    res = appendCnMarker(res, 'text-muted-foreground ml-auto text-xs tracking-widest', 'cn-context-menu-shortcut');
  } else if (fileName === 'hover-card.tsx') {
    res = appendCnMarker(res, 'bg-popover border-border z-50 w-64 rounded-md border p-4 shadow-md shadow-black/5', 'cn-hover-card-content');
    res = appendCnMarker(res, 'bg-popover border-border outline-hidden z-50 w-64 rounded-md border p-4 shadow-md shadow-black/5', 'cn-hover-card-content');
  } else if (fileName === 'tabs.tsx') {
    res = appendCnMarker(res, 'bg-muted flex h-9 flex-row items-center justify-center rounded-lg p-[3px]', 'cn-tabs-list');
    res = appendCnMarker(res, 'flex flex-row items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 shadow-none shadow-black/5', 'cn-tabs-trigger');
    res = appendCnMarker(res, 'text-foreground dark:text-muted-foreground text-sm font-medium leading-none', 'cn-tabs-trigger-text');
    res = res.replace("className={cn(Platform.select({ web: 'flex-1 outline-none' }), className)}", "className={cn(Platform.select({ web: 'flex-1 outline-none' }), 'cn-tabs-content', className)}");
  } else if (fileName === 'label.tsx') {
    res = res.replace(/className=\{cn\(\s*'text-sm text-foreground/g, "className={cn('cn-label text-sm text-foreground");
  } else if (fileName === 'toggle.tsx') {
    res = appendCnMarker(res, 'active:bg-muted group flex flex-row items-center justify-center gap-2 rounded-md', 'cn-toggle');
    res = appendCnMarker(res, 'border-input active:bg-accent border bg-transparent shadow-sm shadow-black/5', 'cn-toggle-variant-outline');
  } else if (fileName === 'toggle-group.tsx') {
    res = appendCnMarker(res, 'flex flex-row items-center rounded-md shadow-none', 'cn-toggle-group');
  } else if (fileName === 'menubar.tsx') {
    res = appendCnMarker(res, 'bg-background border-border flex h-10 flex-row items-center gap-1 rounded-md border p-1 shadow-sm shadow-black/5 sm:h-9', 'cn-menubar');
    res = appendCnMarker(res, 'group flex items-center rounded-md px-2 py-1.5 sm:py-1', 'cn-menubar-trigger');
    res = appendCnMarker(res, 'bg-popover border-border min-w-[12rem] overflow-hidden rounded-md border p-1 shadow-lg shadow-black/5', 'cn-menubar-content');
    res = appendCnMarker(res, 'bg-popover border-border overflow-hidden rounded-md border p-1 shadow-lg shadow-black/5', 'cn-menubar-sub-content');
    res = appendCnMarker(res, 'active:bg-accent group flex flex-row items-center rounded-sm px-2 py-2 sm:py-1.5', 'cn-menubar-sub-trigger');
    res = appendCnMarker(res, 'active:bg-accent group relative flex flex-row items-center gap-2 rounded-sm px-2 py-2 sm:py-1.5', 'cn-menubar-item');
    res = appendCnMarker(res, 'text-foreground px-2 py-2 text-sm font-medium sm:py-1.5', 'cn-menubar-label');
    res = appendCnMarker(res, 'bg-border -mx-1 my-1 h-px', 'cn-menubar-separator');
    res = appendCnMarker(res, 'text-muted-foreground ml-auto text-xs tracking-widest', 'cn-menubar-shortcut');
  }

  return res;
}

/**
 * Split a list of classes into container classes and text classes.
 */
function extractTextClasses(classStr) {
  const classes = classStr.split(' ');
  const textClasses = [];
  for (const cls of classes) {
    if (
      cls.startsWith('text-') || 
      cls.includes(':text-') ||
      cls.startsWith('font-') ||
      cls.includes(':font-') ||
      cls === 'underline' ||
      cls.includes('underline')
    ) {
      textClasses.push(cls);
    }
  }
  return textClasses.join(' ');
}

function extractContainerClasses(classStr) {
  const classes = classStr.split(' ');
  const containerClasses = [];
  for (const cls of classes) {
    if (
      !cls.startsWith('text-') && 
      !cls.includes(':text-') &&
      !cls.startsWith('font-') &&
      !cls.includes(':font-') &&
      cls !== 'underline' &&
      !cls.includes('underline')
    ) {
      containerClasses.push(cls);
    }
  }
  return containerClasses.join(' ');
}

const NATIVE_SAFE_STYLE_MARKERS = new Set([
  'cn-dialog-overlay',
  'cn-dialog-content',
  'cn-dialog-close',
  'cn-dialog-header',
  'cn-dialog-footer',
  'cn-dialog-title',
  'cn-dialog-description',
  'cn-alert-dialog-overlay',
  'cn-alert-dialog-content',
  'cn-alert-dialog-header',
  'cn-alert-dialog-footer',
  'cn-alert-dialog-title',
  'cn-alert-dialog-description',
  'cn-popover-content',
  'cn-tooltip-content',
  'cn-dropdown-menu-content',
  'cn-dropdown-menu-sub-content',
  'cn-dropdown-menu-sub-trigger',
  'cn-dropdown-menu-item',
  'cn-dropdown-menu-checkbox-item',
  'cn-dropdown-menu-radio-item',
  'cn-dropdown-menu-label',
  'cn-dropdown-menu-separator',
  'cn-dropdown-menu-shortcut',
  'cn-context-menu-content',
  'cn-context-menu-sub-content',
  'cn-context-menu-sub-trigger',
  'cn-context-menu-item',
  'cn-context-menu-checkbox-item',
  'cn-context-menu-radio-item',
  'cn-context-menu-label',
  'cn-context-menu-separator',
  'cn-context-menu-shortcut',
  'cn-tabs-list',
  'cn-tabs-trigger',
  'cn-card',
  'cn-card-header',
  'cn-card-title',
  'cn-card-description',
  'cn-card-content',
  'cn-card-footer',
  'cn-alert',
  'cn-alert-title',
  'cn-alert-description',
  'cn-accordion',
  'cn-accordion-item',
  'cn-accordion-trigger',
  'cn-accordion-content',
  'cn-input',
  'cn-textarea',
  'cn-select-trigger',
  'cn-select-content',
  'cn-select-item',
  'cn-select-label',
  'cn-select-separator',
  'cn-toggle',
  'cn-toggle-variant-outline',
  'cn-toggle-group',
]);

function isNativeHostileClass(cls) {
  const normalized = cls.replace(/!$/g, '');
  return (
    normalized === '' ||
    normalized === '!' ||
    normalized === 'grid' ||
    normalized === 'inline-flex' ||
    normalized.startsWith('grid-') ||
    normalized.startsWith('place-') ||
    normalized.startsWith('col-') ||
    normalized.startsWith('row-') ||
    normalized.startsWith('data-') ||
    normalized.startsWith('group-data-') ||
    normalized.startsWith('has-data-') ||
    normalized.startsWith('not-data-') ||
    normalized.includes('group-data') ||
    normalized.includes('group-has-data') ||
    normalized.includes('has-data') ||
    normalized.startsWith('focus:') ||
    normalized.startsWith('group-focus') ||
    normalized.startsWith('supports-') ||
    normalized.startsWith('animate-') ||
    normalized.startsWith('fade-') ||
    normalized.startsWith('zoom-') ||
    normalized.startsWith('slide-') ||
    normalized.startsWith('duration-') ||
    normalized.startsWith('origin-') ||
    normalized.startsWith('cursor-') ||
    normalized.includes(':animate-') ||
    normalized.includes(':fade-') ||
    normalized.includes(':zoom-') ||
    normalized.includes(':slide-') ||
    normalized.includes(':duration-') ||
    normalized.includes(':focus') ||
    normalized.includes('focus:') ||
    normalized.includes('group-focus') ||
    normalized.includes('--') ||
    normalized.startsWith('[') ||
    normalized.includes(']:') ||
    normalized.includes('*:') ||
    normalized.includes('text-balance') ||
    normalized.includes('text-pretty') ||
    normalized.includes('has-[') ||
    normalized.includes('**:') ||
    normalized.includes('*:[') ||
    normalized.includes('[&_')
  );
}

function filterNativeSafeStyleClasses(marker, classStr) {
  // Resolved per-style CSS classes always go through native-safe filtering.
  // The upstream shadcn style CSS is web-first and contains many utilities that
  // are meaningless or unsupported on React Native (data-* variants,
  // animate-*/slide-in/zoom/fade, focus:, grid, arbitrary [&_...] selectors,
  // etc.). Stripping them for EVERY marker keeps every component consistent on
  // native. Base component classes are untouched (they keep their own
  // Platform.select({ web }) separation).
  return classStr
    .split(/\s+/)
    .map((cls) => cls.replace(/!$/g, ''))
    .filter((cls) => !isNativeHostileClass(cls))
    .join(' ');
}

/**
 * Resolve placeholder cn-* classes from styleMap and inline them.
 *
 * shadcn applies per-style overrides through CSS specificity (`.style-x .cn-y`
 * always beats a base utility). React Native has no such cascade, so we
 * replicate it at build time: base classes are merged with the resolved
 * per-style classes using tailwind-merge, with the style classes coming LAST
 * so they win on conflict (e.g. style `rounded-none`/`border-0` overrides base
 * `rounded-xl`/`border`) and duplicates are removed.
 */
function inlineStyleClasses(content, styleMap) {
  const stringLiteralRegex = /(["'`])(.*?)\1/g;

  return content.replace(stringLiteralRegex, (fullMatch, quote, strContent) => {
    const classes = strContent.split(/\s+/);
    let hasCn = false;

    const baseClasses = [];
    const styleClasses = [];

    for (const cls of classes) {
      if (cls.startsWith('cn-')) {
        hasCn = true;

        let mappedClasses = '';
        if (/(?:-text$|-text-)/.test(cls)) {
          const containerClass = cls.replace('-text', '');
          const fullStyles = filterNativeSafeStyleClasses(containerClass, styleMap[containerClass] || '');
          mappedClasses = extractTextClasses(fullStyles);
        } else {
          const fullStyles = filterNativeSafeStyleClasses(cls, styleMap[cls] || '');
          if (cls.startsWith('cn-button') || cls.startsWith('cn-badge')) {
            mappedClasses = extractContainerClasses(fullStyles);
          } else {
            mappedClasses = fullStyles;
          }
        }
        if (mappedClasses) {
          styleClasses.push(mappedClasses);
        }
      } else {
        baseClasses.push(cls);
      }
    }

    if (hasCn) {
      // Style classes go AFTER base classes so tailwind-merge lets the
      // per-style override win on any conflicting utility.
      let finalStr = styleClasses.length > 0
        ? twMerge(baseClasses.join(' '), styleClasses.join(' '))
        : baseClasses.filter(Boolean).join(' ');
      // Escape matching quote characters to prevent string termination syntax errors
      if (quote === "'") {
        finalStr = finalStr.replace(/'/g, "\\'");
      } else if (quote === '"') {
        finalStr = finalStr.replace(/"/g, '\\"');
      } else if (quote === '`') {
        finalStr = finalStr.replace(/`/g, '\\`');
      }
      return `${quote}${finalStr}${quote}`;
    }

    return fullMatch;
  });
}

/**
 * Apply style-specific class name transforms to component content.
 */
function sanitizeUnsupportedCalcClasses(content) {
  return content
    .replace(/\bweb:max-w-\[calc\(100%-2rem\)\]\s*/g, '')
    .replace(/\bmax-w-\[calc\(100%-2rem\)\]/g, 'max-w-lg')
    .replace(/\bh-\[calc\(100%-1px\)\]/g, 'h-full')
    .replace(/translate-x-\[calc\(100%-8px\)\]/g, 'translate-x-3.5')
    .replace(/translate-x-\[calc\(100%-4px\)\]/g, 'translate-x-3.5')
    .replace(/translate-x-\[calc\(100%-2px\)\]/g, 'translate-x-3.5')
    .replace(/translate-x-\[calc\(100%\+2px\)\]/g, 'translate-x-3.5')
    .replace(/translate-x-\[calc\(100%[-+][\d.]+px\)\]/g, 'translate-x-3.5')
    .replace(/translate-y-\[calc\(-50%-2px\)\]/g, '-translate-y-1/2');
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

function buildEngine(engine) {
  const srcDir = path.join(REUSABLES_SRC, engine);
  const uiDir = path.join(srcDir, 'components/ui');
  const libDir = path.join(srcDir, 'lib');

  const hasUpstreamSource = fs.existsSync(uiDir);

  let utilsItem = null;
  const components = [];

  if (hasUpstreamSource) {
    // ------ 1. Build utils item (from upstream source) ------
    const utilsPath = path.join(libDir, 'utils.ts');
    if (fs.existsSync(utilsPath)) {
      const raw = fs.readFileSync(utilsPath, 'utf8');
      utilsItem = {
        $schema: 'https://lovdacn.vercel.app/schema/registry-item.json',
        name: 'utils',
        dependencies: ['clsx', 'tailwind-merge'],
        files: [
          {
            path: 'lib/utils.ts',
            content: normalizeContent(raw),
            type: 'registry:lib',
          },
        ],
        type: 'registry:lib',
      };
    }

    // ------ 2. Build component items (from upstream source) ------
    const srcFiles = fs.readdirSync(uiDir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

    for (const file of srcFiles) {
      const name = path.basename(file, path.extname(file));
      const raw = fs.readFileSync(path.join(uiDir, file), 'utf8');
      const content = applyLvcnComponentFixes(file, normalizeContent(raw));
      const { dependencies, registryDependencies } = parseImports(content, name);

      components.push({
        name,
        rawContent: content,
        dependencies,
        registryDependencies,
        fileName: file,
      });
    }
  } else {
    // ------ Fallback: reconstruct from the surviving `default` fixtures ------
    // The upstream react-native-reusables source is not present in this
    // workspace. The `default` style fixtures hold the clean base component
    // source (cn-* markers stripped, no per-style overrides, applyLvcnComponentFixes
    // already applied, imports normalized to @/). We reuse them as the source so
    // the per-style pipeline (injectCnPlaceholderClasses -> inlineStyleClasses ->
    // sanitize) can regenerate every style. This keeps the build self-contained.
    const fallbackDir = path.join(DEST_REGISTRY, engine, 'default');
    if (!fs.existsSync(fallbackDir)) {
      console.warn(`⚠  Source not found for engine "${engine}": ${uiDir}`);
      console.warn(`⚠  Fallback fixtures not found either: ${fallbackDir}`);
      return;
    }
    console.warn(`ℹ  Upstream source missing for "${engine}"; rebuilding from default fixtures at ${fallbackDir}`);

    const jsonFiles = fs.readdirSync(fallbackDir).filter(f => f.endsWith('.json'));
    for (const jf of jsonFiles) {
      const name = path.basename(jf, '.json');
      if (name === 'index') continue;
      const item = fs.readJsonSync(path.join(fallbackDir, jf));
      const file = item.files && item.files[0];
      if (!file) continue;

      if (name === 'utils') {
        utilsItem = {
          $schema: 'https://lovdacn.vercel.app/schema/registry-item.json',
          name: 'utils',
          dependencies: item.dependencies || ['clsx', 'tailwind-merge'],
          files: [{ path: file.path, content: file.content, type: file.type || 'registry:lib' }],
          type: 'registry:lib',
        };
        continue;
      }

      components.push({
        name,
        // Fixture content is already normalized base source; re-apply the
        // component fixes (idempotent — guarded/no-op if already applied) so
        // fixes like the Menubar optional-props type are baked in.
        rawContent: applyLvcnComponentFixes(path.basename(file.path), file.content),
        dependencies: item.dependencies || [],
        registryDependencies: item.registryDependencies || [],
        fileName: path.basename(file.path),
      });
    }
  }

  // ------ 3. Write per-style ------
  for (const style of STYLES) {
    const destDir = path.join(DEST_REGISTRY, engine, style.name);
    fs.emptyDirSync(destDir); // Clean previous output

    // Load style CSS file if it exists and parse it into a styleMap
    const styleCssPath = path.join(DEST_REGISTRY, `style-${style.name}.css`);
    let styleMap = {};
    if (fs.existsSync(styleCssPath)) {
      try {
        const cssContent = fs.readFileSync(styleCssPath, 'utf8');
        styleMap = parseCssStyleSheet(cssContent);
      } catch (err) {
        console.warn(`⚠ Failed to parse style stylesheet ${styleCssPath}:`, err);
      }
    }

    // -- index.json (style metadata, like shadcn style.json) --
    const indexItem = {
      $schema: 'https://lovdacn.vercel.app/schema/registry-item.json',
      name: 'index',
      dependencies: [
        'class-variance-authority',
        engine === 'nativewind' ? 'nativewind' : 'uniwind',
      ],
      registryDependencies: ['utils'],
      files: [],
      type: 'registry:style',
    };
    fs.writeJsonSync(path.join(destDir, 'index.json'), indexItem, { spaces: 2 });

    // -- utils.json --
    if (utilsItem) {
      fs.writeJsonSync(path.join(destDir, 'utils.json'), utilsItem, { spaces: 2 });
    }

    // -- component files --
    for (const comp of components) {
      const withPlaceholders = injectCnPlaceholderClasses(comp.fileName, comp.rawContent);
      const inlined = inlineStyleClasses(withPlaceholders, styleMap);
      const styledContent = sanitizeUnsupportedCalcClasses(inlined);

      const item = {
        $schema: 'https://lovdacn.vercel.app/schema/registry-item.json',
        name: comp.name,
        dependencies: comp.dependencies,
        registryDependencies: comp.registryDependencies,
        files: [
          {
            path: `components/ui/${comp.fileName}`,
            content: styledContent,
            type: 'registry:ui',
          },
        ],
        meta: {
          engine,
          style: style.name,
        },
        type: 'registry:ui',
      };

      fs.writeJsonSync(path.join(destDir, `${comp.name}.json`), item, { spaces: 2 });
    }
  }

  const totalComponents = components.length + (utilsItem ? 1 : 0);
  const totalFiles = STYLES.length * (totalComponents + 1); // +1 for index.json
  console.log(
    `✔  ${engine}: ${totalComponents} components × ${STYLES.length} styles = ${totalFiles} JSON files`
  );
}

// ---------------------------------------------------------------------------
// Clean old directories
// ---------------------------------------------------------------------------

function cleanOldDirectories() {
  // Remove stale base-*/radix-*/new-york-v4 folders and loose JSON files
  // that were generated by the old build script
  for (const engine of ENGINES) {
    const engineDir = path.join(DEST_REGISTRY, engine);
    if (!fs.existsSync(engineDir)) continue;

    const entries = fs.readdirSync(engineDir);
    for (const entry of entries) {
      const fullPath = path.join(engineDir, entry);
      const isDir = fs.statSync(fullPath).isDirectory();

      if (!isDir) {
        // Remove loose JSON files at engine root level (old format)
        fs.removeSync(fullPath);
      } else if (
        entry.startsWith('base-') ||
        entry.startsWith('radix-') ||
        entry === 'new-york-v4'
      ) {
        // Remove old base-*/radix-* directories
        fs.removeSync(fullPath);
      }
    }
  }
  console.log('✔  Cleaned old registry directories');
}

function copyStyledCssFiles() {
  const srcStylesDir = path.join(WORKSPACE_ROOT, 'ui/apps/v4/registry/styles');
  if (!fs.existsSync(srcStylesDir)) {
    console.warn(`⚠  Source styles directory not found: ${srcStylesDir}`);
    return;
  }

  const files = fs.readdirSync(srcStylesDir);
  let count = 0;
  for (const file of files) {
    if (file.startsWith('style-') && file.endsWith('.css')) {
      const srcPath = path.join(srcStylesDir, file);
      const destPath = path.join(DEST_REGISTRY, file);
      const cssContent = fs.readFileSync(srcPath, 'utf8');
      fs.writeFileSync(destPath, sanitizeUnsupportedCalcClasses(cssContent));
      count++;
    }
  }
  console.log(`✔  Copied ${count} styled CSS stylesheets to registry root`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log('Building lovda component registry...\n');
cleanOldDirectories();

for (const engine of ENGINES) {
  buildEngine(engine);
}

// Write top-level styles index
fs.writeJsonSync(path.join(DEST_REGISTRY, 'index.json'), STYLES, { spaces: 2 });

// Copy styled CSS stylesheets
copyStyledCssFiles();

// Emit pre-composed "blocks" into the shared `r/blocks/` namespace. Blocks are
// style-agnostic (they compose the per-style components), so they live in one
// place and are resolved by name — independent of the per-style component
// output above.
require('./build-blocks.cjs').buildBlocks();

console.log(`\n✔  Registry built successfully!`);
console.log(`   Output: ${DEST_REGISTRY}`);

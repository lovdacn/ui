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
const DEST_REGISTRY = path.join(WORKSPACE_ROOT, 'lvcn/packages/lovda/test/fixtures/registry/styles');

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

// Style-specific tailwind class transforms.
// These mirror the kind of visual mutations shadcn applies per style.
const STYLE_TRANSFORMS = {
  mira: {
    // Mira uses fully rounded buttons / badges
    'rounded-md': 'rounded-full',
  },
  nova: {
    // Nova uses sharper corners
    'rounded-md': 'rounded-sm',
  },
  sera: {
    // Sera uses larger radii
    'rounded-md': 'rounded-lg',
  },
  vega: {
    // Vega uses no rounding
    'rounded-md': 'rounded-none',
  },
};

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
        dependencies.add(pkgName);
      }
    }
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
  } else if (fileName === 'input.tsx') {
    res = res.replace(/className=\{cn\(\s*'web:flex/g, "className={cn('cn-input cn-input-size-default web:flex");
  } else if (fileName === 'textarea.tsx') {
    res = res.replace(/className=\{cn\(\s*'web:flex h-20/g, "className={cn('cn-textarea web:flex h-20");
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
  } else if (fileName === 'collapsible.tsx') {
    res = res.replace(/className=\{cn\('gap-1', className\)\}/g, "className={cn('cn-collapsible gap-1', className)}");
    res = res.replace(/className=\{cn\('flex flex-row/g, "className={cn('cn-collapsible-trigger flex flex-row");
    res = res.replace(/className=\{cn\('overflow-hidden', className\)\}/g, "className={cn('cn-collapsible-content overflow-hidden', className)}");
  } else if (fileName === 'alert.tsx') {
    res = res.replace(/className=\{cn\(\s*'relative w-full rounded-lg border border-border p-4/g, "className={cn('cn-alert relative w-full rounded-lg border border-border p-4");
    res = res.replace(/className=\{cn\('mb-1\.5 font-medium text-foreground tracking-tight leading-none', className\)\}/g, "className={cn('cn-alert-title mb-1.5 font-medium text-foreground tracking-tight leading-none', className)}");
    res = res.replace(/className=\{cn\('text-sm text-muted-foreground leading-relaxed', className\)\}/g, "className={cn('cn-alert-description text-sm text-muted-foreground leading-relaxed', className)}");
  } else if (fileName === 'card.tsx') {
    res = res.replace(/className=\{cn\(\s*'rounded-xl border border-border bg-card/g, "className={cn('cn-card rounded-xl border border-border bg-card");
    res = res.replace(/className=\{cn\('flex flex-col space-y-1\.5 p-6', className\)\}/g, "className={cn('cn-card-header flex flex-col space-y-1.5 p-6', className)}");
    res = res.replace(/className=\{cn\(\s*'text-2xl font-semibold/g, "className={cn('cn-card-title text-2xl font-semibold");
    res = res.replace(/className=\{cn\('text-sm text-muted-foreground', className\)\}/g, "className={cn('cn-card-description text-sm text-muted-foreground', className)}");
    res = res.replace(/className=\{cn\('p-6 pt-0', className\)\}/g, "className={cn('cn-card-content p-6 pt-0', className)}");
    res = res.replace(/className=\{cn\('flex items-center p-6 pt-0', className\)\}/g, "className={cn('cn-card-footer flex items-center p-6 pt-0', className)}");
  } else if (fileName === 'dialog.tsx') {
    res = res.replace(/className=\{cn\(\s*'flex-1 justify-center/g, "className={cn('cn-dialog-overlay flex-1 justify-center");
    res = res.replace(/className=\{cn\(\s*'border-border/g, "className={cn('cn-dialog-content border-border");
    res = res.replace(/className=\{cn\('flex flex-col gap-1\.5 text-center sm:text-left', className\)\}/g, "className={cn('cn-dialog-header flex flex-col gap-1.5 text-center sm:text-left', className)}");
    res = res.replace(/className=\{cn\('text-foreground text-lg font-semibold leading-none', className\)\}/g, "className={cn('cn-dialog-title text-foreground text-lg font-semibold leading-none', className)}");
    res = res.replace(/className=\{cn\('text-muted-foreground text-sm', className\)\}/g, "className={cn('cn-dialog-description text-muted-foreground text-sm', className)}");
    res = res.replace(/className=\{cn\(\s*'flex flex-col-reverse/g, "className={cn('cn-dialog-footer flex flex-col-reverse");
  } else if (fileName === 'alert-dialog.tsx') {
    res = res.replace(/className=\{cn\(\s*'flex-1 justify-center/g, "className={cn('cn-alert-dialog-overlay flex-1 justify-center");
    res = res.replace(/className=\{cn\(\s*'border-border/g, "className={cn('cn-alert-dialog-content border-border");
    res = res.replace(/className=\{cn\('flex flex-col gap-1\.5 text-center sm:text-left', className\)\}/g, "className={cn('cn-alert-dialog-header flex flex-col gap-1.5 text-center sm:text-left', className)}");
    res = res.replace(/className=\{cn\('text-foreground text-lg font-semibold leading-none', className\)\}/g, "className={cn('cn-alert-dialog-title text-foreground text-lg font-semibold leading-none', className)}");
    res = res.replace(/className=\{cn\('text-muted-foreground text-sm', className\)\}/g, "className={cn('cn-alert-dialog-description text-muted-foreground text-sm', className)}");
    res = res.replace(/className=\{cn\(\s*'flex flex-col-reverse/g, "className={cn('cn-alert-dialog-footer flex flex-col-reverse");
    res = res.replace(/AlertDialogActionRef\s*.*?className=\{cn\(/g, "AlertDialogActionRef className={cn('cn-alert-dialog-action',");
    res = res.replace(/AlertDialogCancelRef\s*.*?className=\{cn\(/g, "AlertDialogCancelRef className={cn('cn-alert-dialog-cancel',");
  } else if (fileName === 'popover.tsx') {
    res = res.replace(/className=\{cn\(\s*'bg-popover border-border/g, "className={cn('cn-popover-content bg-popover border-border");
  } else if (fileName === 'tooltip.tsx') {
    res = res.replace(/className=\{cn\(\s*'bg-popover border-border/g, "className={cn('cn-tooltip-content bg-popover border-border");
  } else if (fileName === 'hover-card.tsx') {
    res = res.replace(/className=\{cn\(\s*'bg-popover border-border/g, "className={cn('cn-hover-card-content bg-popover border-border");
  } else if (fileName === 'tabs.tsx') {
    res = res.replace(/className=\{cn\(\s*'inline-flex items-center justify-center/g, "className={cn('cn-tabs-list inline-flex items-center justify-center");
    res = res.replace(/className=\{cn\(\s*'inline-flex items-center/g, "className={cn('cn-tabs-trigger inline-flex items-center");
    res = res.replace(/className=\{cn\(\s*'mt-2/g, "className={cn('cn-tabs-content mt-2");
  } else if (fileName === 'label.tsx') {
    res = res.replace(/className=\{cn\(\s*'text-sm text-foreground/g, "className={cn('cn-label text-sm text-foreground");
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

/**
 * Resolve placeholder cn-* classes from styleMap and inline them, or strip if no match is found.
 */
function inlineStyleClasses(content, styleMap) {
  const stringLiteralRegex = /(["'`])(.*?)\1/g;
  
  return content.replace(stringLiteralRegex, (fullMatch, quote, strContent) => {
    const classes = strContent.split(/\s+/);
    let hasCn = false;
    
    const resolvedClasses = classes.map((cls) => {
      if (cls.startsWith('cn-')) {
        hasCn = true;
        
        let mappedClasses = '';
        if (cls.includes('-text')) {
          const containerClass = cls.replace('-text', '');
          const fullStyles = styleMap[containerClass] || '';
          mappedClasses = extractTextClasses(fullStyles);
        } else {
          const fullStyles = styleMap[cls] || '';
          if (cls.startsWith('cn-button') || cls.startsWith('cn-badge')) {
            mappedClasses = extractContainerClasses(fullStyles);
          } else {
            mappedClasses = fullStyles;
          }
        }
        return mappedClasses;
      }
      return cls;
    });
    
    if (hasCn) {
      let finalStr = resolvedClasses.filter(Boolean).join(' ');
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
function applyStyleTransforms(content, styleName) {
  const transforms = STYLE_TRANSFORMS[styleName];
  if (!transforms) return content;

  let result = content;
  for (const [from, to] of Object.entries(transforms)) {
    // Only replace in tailwind class strings, not in variable names
    result = result.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

function buildEngine(engine) {
  const srcDir = path.join(REUSABLES_SRC, engine);
  const uiDir = path.join(srcDir, 'components/ui');
  const libDir = path.join(srcDir, 'lib');

  if (!fs.existsSync(uiDir)) {
    console.warn(`⚠  Source not found for engine "${engine}": ${uiDir}`);
    return;
  }

  // ------ 1. Build utils item ------
  let utilsItem = null;
  const utilsPath = path.join(libDir, 'utils.ts');
  if (fs.existsSync(utilsPath)) {
    const raw = fs.readFileSync(utilsPath, 'utf8');
    utilsItem = {
      $schema: 'https://lvcn.dev/schema/registry-item.json',
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

  // ------ 2. Build component items ------
  const components = [];
  const srcFiles = fs.readdirSync(uiDir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

  for (const file of srcFiles) {
    const name = path.basename(file, path.extname(file));
    const raw = fs.readFileSync(path.join(uiDir, file), 'utf8');
    const content = normalizeContent(raw);
    const { dependencies, registryDependencies } = parseImports(content, name);

    components.push({
      name,
      rawContent: content,
      dependencies,
      registryDependencies,
      fileName: file,
    });
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
      $schema: 'https://lvcn.dev/schema/registry-item.json',
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
      const styledContent = applyStyleTransforms(inlined, style.name);

      const item = {
        $schema: 'https://lvcn.dev/schema/registry-item.json',
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

  const totalComponents = srcFiles.length + (utilsItem ? 1 : 0);
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
      fs.copySync(srcPath, destPath);
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

console.log(`\n✔  Registry built successfully!`);
console.log(`   Output: ${DEST_REGISTRY}`);

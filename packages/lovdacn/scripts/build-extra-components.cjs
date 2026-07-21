/**
 * build-extra-components.cjs
 *
 * Emits UI components that are NOT part of the main `build-registry.cjs`
 * per-file style-injection allow-list into the per-style/engine registry
 * (`r/styles/<engine>/<style>/<name>.json`).
 *
 * WHY A DEDICATED SCRIPT:
 * `build-registry.cjs` inlines each style's classes into `cn-*` marker slots that
 * it injects for a hardcoded set of components (button, badge, input, …). The
 * components below use only semantic tokens + layout classes (no per-style
 * overrides) and are not in that allow-list, so their output reduces to
 * `normalizeContent(source)` — identical across every style and engine. This
 * script produces exactly that output additively, without touching (or
 * `emptyDirSync`-ing) the other component JSON files. A full `registry:build`
 * emits identical output because the sources now live in
 * react-native-reusables/.../<engine>/components/ui/<name>.tsx.
 *
 * Output: r/styles/<engine>/<style>/<name>.json
 */

const fs = require('fs-extra');
const path = require('path');

const WORKSPACE_ROOT = path.resolve(__dirname, '../../../../');
const REUSABLES_SRC = path.join(WORKSPACE_ROOT, 'react-native-reusables/packages/registry/src');
const DEST_REGISTRY = path.join(WORKSPACE_ROOT, 'lvcn/apps/v2/public/r/styles');
const SCHEMA = 'https://lovdacn.vercel.app/schema/registry-item.json';

const STYLES = [
  'default',
  'new-york',
  'luma',
  'lyra',
  'maia',
  'mira',
  'nova',
  'rhea',
  'sera',
  'vega',
];
const ENGINES = ['nativewind', 'uniwind'];

/** Components emitted by this script, with their declared dependencies. */
const COMPONENTS = [
  {
    name: 'sidebar',
    dependencies: ['class-variance-authority', 'lucide-react-native'],
    registryDependencies: ['icon', 'separator', 'skeleton', 'text', 'utils'],
  },
  {
    name: 'breadcrumb',
    dependencies: ['@rn-primitives/slot', 'lucide-react-native'],
    registryDependencies: ['icon', 'text', 'utils'],
  },
  {
    name: 'input-otp',
    dependencies: [],
    registryDependencies: ['text', 'utils'],
  },
  {
    name: 'bottom-sheet',
    dependencies: ['@rn-primitives/dialog', 'react-native-reanimated', 'react-native-screens', 'lucide-react-native'],
    registryDependencies: ['icon', 'text', 'utils', 'native-only-animated-view'],
  },
  {
    name: 'sheet',
    dependencies: ['@rn-primitives/dialog', 'react-native-reanimated', 'react-native-screens', 'lucide-react-native'],
    registryDependencies: ['icon', 'text', 'utils', 'native-only-animated-view'],
  },
  {
    name: 'sonner',
    dependencies: ['react-native-reanimated', 'lucide-react-native'],
    registryDependencies: ['utils'],
  },
  {
    name: 'spinner',
    dependencies: ['react-native-reanimated', 'lucide-react-native'],
    registryDependencies: ['utils'],
  },
  {
    name: 'calendar',
    dependencies: ['lucide-react-native'],
    registryDependencies: ['utils'],
  },
  {
    name: 'carousel',
    dependencies: ['lucide-react-native'],
    registryDependencies: ['utils'],
  },
];

/** Mirror build-registry's normalizeContent: strip monorepo registry prefixes. */
function normalizeContent(content) {
  return content
    .replace(/@\/registry\/(?:nativewind|uniwind)\//g, '@/')
    .replace(/\r\n/g, '\n');
}

function buildExtraComponents() {
  let written = 0;

  for (const engine of ENGINES) {
    for (const comp of COMPONENTS) {
      let srcPath = path.join(REUSABLES_SRC, engine, 'components/ui', `${comp.name}.tsx`);
      if (!fs.existsSync(srcPath)) {
        // Fallback to the local preview app components
        srcPath = path.join(WORKSPACE_ROOT, 'lvcn/apps/preview/src/components/ui', `${comp.name}.tsx`);
      }

      if (!fs.existsSync(srcPath)) {
        console.warn(`⚠  Missing ${comp.name} source: ${srcPath}`);
        continue;
      }

      const content = normalizeContent(fs.readFileSync(srcPath, 'utf8'));

      for (const style of STYLES) {
        const destDir = path.join(DEST_REGISTRY, engine, style);
        fs.ensureDirSync(destDir);

        const item = {
          $schema: SCHEMA,
          name: comp.name,
          dependencies: comp.dependencies,
          registryDependencies: comp.registryDependencies,
          files: [
            {
              path: `components/ui/${comp.name}.tsx`,
              content,
              type: 'registry:ui',
            },
          ],
          meta: { engine, style },
          type: 'registry:ui',
        };

        fs.writeJsonSync(path.join(destDir, `${comp.name}.json`), item, { spaces: 2 });
        written++;
      }
    }
  }

  console.log(
    `✔  extra components (${COMPONENTS.map((c) => c.name).join(', ')}): ${written} registry items → ` +
      `${path.relative(WORKSPACE_ROOT, DEST_REGISTRY)}/<engine>/<style>/`
  );
}

module.exports = { buildExtraComponents };

if (require.main === module) {
  console.log('Building lovda extra component registry...\n');
  buildExtraComponents();
  console.log('\n✔  Extra components built successfully!');
}

/**
 * build-blocks.cjs
 *
 * Emits pre-composed "block" registry items (shadcn-style) into the lovda
 * registry. A block composes several existing UI components into a ready-to-use
 * section (e.g. a login screen).
 *
 * WHY BLOCKS ARE SHARED (not per style):
 * Components are emitted per engine/style because the build inlines each
 * style's classes into the component source. A block, by contrast, only
 * composes those components and uses layout + semantic-token classes, so its
 * source is identical across every style and engine. Storing it once — the way
 * shadcn resolves a built item by name at `/r/<name>.json` — avoids emitting
 * the same file into all 20 style folders.
 *
 * Output:
 *   r/blocks/<name>.json   - one registry item per block
 *   r/blocks/index.json    - lightweight catalog for docs/tooling
 *
 * `lvcn add <block>` resolves the item from `blocks/<name>.json` (the CLI tries
 * the per-style component path first, then falls back to this shared path),
 * walks its registryDependencies to pull in the underlying components (and
 * their npm deps), rewrites import aliases, and writes the files.
 *
 * This script is ADDITIVE and independent of the per-style component output:
 * it only writes into `r/blocks/`. It is also invoked at the end of
 * build-registry.cjs so a full registry rebuild refreshes blocks too.
 *
 * Source layout:
 *   scripts/blocks/<name>/
 *     block.json   - manifest { name, type, description, dependencies,
 *                    registryDependencies, files: [{ src, path, type }] }
 *     <src>.tsx    - composed component source(s)
 */

const fs = require('fs-extra');
const path = require('path');
const { twMerge } = require('tailwind-merge');

const DESIGN_ROOT = path.join(__dirname, '../design-system');
const DESIGN_CATALOG = fs.readJsonSync(path.join(DESIGN_ROOT, 'catalog.json'));
const BLOCK_RECIPES = fs.readJsonSync(path.join(DESIGN_ROOT, 'block-recipes.json'));
const ACTIVE_STYLES = DESIGN_CATALOG.styles.map(({ name, label, description }) => ({
  name,
  label,
  description,
}));

const BLOCKS_SRC = path.join(__dirname, 'blocks');
const REGISTRY_ROOT = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'apps',
  'v2',
  'public',
  'r'
);
const BLOCKS_DEST = path.join(REGISTRY_ROOT, 'blocks');
const SCHEMA = 'https://lovdacn.vercel.app/schema/registry-item.json';

/** Normalize monorepo import paths so block content is portable. */
function normalizeContent(content) {
  return content
    .replace(/@\/registry\/(?:nativewind|uniwind)\//g, '@/')
    .replace(/\r\n/g, '\n');
}

/** Compile shared block composition into a selected style's static layout roles. */
function applyBlockRecipe(content, recipe) {
  return content.replace(/className="([^"]+)"/g, (attribute, originalClasses) => {
    let classes = originalClasses;
    const hasLargeGap = /\bgap-(?:5|6|8|10|12)\b/.test(classes);
    const hasFieldGap = /\bgap-(?:3|4)\b/.test(classes);

    if (/\bjustify-center\b/.test(classes) && /\b(?:p-4|sm:p-6|md:p-10)\b/.test(classes)) {
      classes = classes.replace(/\b(?:p-4|sm:p-6|md:p-10)\b/g, '');
      classes = twMerge(classes, recipe.page);
    } else if (/\bgap-4\b/.test(classes) && /\bp-4\b/.test(classes)) {
      classes = classes.replace(/\bgap-4\b|\bp-4\b/g, '');
      classes = twMerge(classes, recipe.page, recipe.grid);
    }

    if (/\bflex-row\b/.test(classes) && /\bflex-wrap\b/.test(classes)) {
      classes = classes.replace(/\bgap-(?:3|4|5|6|8|10|12)\b/g, '');
      classes = twMerge(classes, recipe.grid);
    } else if (/\bflex-1\b/.test(classes) && hasLargeGap) {
      classes = classes.replace(/\bgap-(?:5|6|8|10|12)\b/g, '');
      classes = twMerge(classes, recipe.column);
    } else if (hasLargeGap) {
      classes = classes.replace(/\bgap-(?:5|6|8|10|12)\b/g, '');
      classes = twMerge(classes, recipe.section);
    } else if (hasFieldGap) {
      classes = classes.replace(/\bgap-(?:3|4)\b/g, '');
      classes = twMerge(classes, recipe.fieldGroup);
    }

    return `className="${classes.trim().replace(/\s+/g, ' ')}"`;
  });
}

/** Load every block from scripts/blocks/<name>/block.json. */
function loadBlocks() {
  if (!fs.existsSync(BLOCKS_SRC)) return [];
  const blocks = [];
  const dirs = fs
    .readdirSync(BLOCKS_SRC)
    .filter((d) => fs.statSync(path.join(BLOCKS_SRC, d)).isDirectory());

  for (const dir of dirs) {
    const manifestPath = path.join(BLOCKS_SRC, dir, 'block.json');
    if (!fs.existsSync(manifestPath)) continue;
    const manifest = fs.readJsonSync(manifestPath);
    const files = (manifest.files || []).map((f) => {
      const srcPath = path.join(BLOCKS_SRC, dir, f.src);
      const content = normalizeContent(fs.readFileSync(srcPath, 'utf8'));
      // Page/file entries carry a `target` (a real route path, e.g.
      // "app/(auth)/sign-in.tsx"); component entries carry a `path` routed
      // through the project's component alias.
      const entry = {
        path: f.target || f.path || f.src,
        content,
        type: f.type || 'registry:component',
      };
      if (f.target) entry.target = f.target;
      return entry;
    });
    blocks.push({ manifest, files });
  }
  return blocks.sort((a, b) => a.manifest.name.localeCompare(b.manifest.name));
}

function toItem(manifest, files, style, legacy = false) {
  return {
    $schema: SCHEMA,
    name: manifest.name,
    type: manifest.type || 'registry:block',
    description: manifest.description || '',
    dependencies: manifest.dependencies || [],
    registryDependencies: manifest.registryDependencies || [],
    files: files.map((file) => ({
      ...file,
      content: applyBlockRecipe(file.content, BLOCK_RECIPES[style]),
    })),
    meta: { style, legacy },
  };
}

function buildBlocks() {
  const blocks = loadBlocks();
  if (blocks.length === 0) {
    console.warn(`⚠  No blocks found at ${BLOCKS_SRC}`);
    return;
  }

  fs.ensureDirSync(BLOCKS_DEST);

  for (const style of ACTIVE_STYLES) {
    const styleDir = path.join(BLOCKS_DEST, style.name);
    fs.emptyDirSync(styleDir);
    for (const { manifest, files } of blocks) {
      const item = toItem(manifest, files, style.name);
      fs.writeJsonSync(path.join(styleDir, `${manifest.name}.json`), item, { spaces: 2 });
    }
  }

  // Preserve the historical shared path as a Vega compatibility fallback.
  for (const { manifest, files } of blocks) {
    const item = toItem(manifest, files, 'vega', true);
    fs.writeJsonSync(path.join(BLOCKS_DEST, `${manifest.name}.json`), item, { spaces: 2 });
  }

  const index = blocks.map(({ manifest }) => ({
    name: manifest.name,
    type: manifest.type || 'registry:block',
    description: manifest.description || '',
    dependencies: manifest.dependencies || [],
    registryDependencies: manifest.registryDependencies || [],
    styles: ACTIVE_STYLES.map(({ name }) => name),
  }));
  fs.writeJsonSync(path.join(BLOCKS_DEST, 'index.json'), index, { spaces: 2 });

  console.log(
    `✔  blocks: ${blocks.length} items × ${ACTIVE_STYLES.length} styles + Vega compatibility → ${path.relative(REGISTRY_ROOT, BLOCKS_DEST)}/`
  );
}

module.exports = { buildBlocks };

if (require.main === module) {
  console.log('Building lovda block registry...\n');
  buildBlocks();
  console.log(`\n✔  Blocks built successfully!`);
  console.log(`   Output: ${BLOCKS_DEST}`);
}

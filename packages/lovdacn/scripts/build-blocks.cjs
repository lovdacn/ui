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

function toItem(manifest, files) {
  return {
    $schema: SCHEMA,
    name: manifest.name,
    type: manifest.type || 'registry:block',
    description: manifest.description || '',
    dependencies: manifest.dependencies || [],
    registryDependencies: manifest.registryDependencies || [],
    files: files.map((f) => ({ ...f })),
  };
}

function buildBlocks() {
  const blocks = loadBlocks();
  if (blocks.length === 0) {
    console.warn(`⚠  No blocks found at ${BLOCKS_SRC}`);
    return;
  }

  fs.ensureDirSync(BLOCKS_DEST);

  for (const { manifest, files } of blocks) {
    const item = toItem(manifest, files);
    fs.writeJsonSync(path.join(BLOCKS_DEST, `${manifest.name}.json`), item, {
      spaces: 2,
    });
  }

  // Lightweight catalog (parallel to styles/index.json) for docs/tooling.
  const index = blocks.map(({ manifest }) => ({
    name: manifest.name,
    type: manifest.type || 'registry:block',
    description: manifest.description || '',
    dependencies: manifest.dependencies || [],
    registryDependencies: manifest.registryDependencies || [],
  }));
  fs.writeJsonSync(path.join(BLOCKS_DEST, 'index.json'), index, { spaces: 2 });

  console.log(
    `✔  blocks: ${blocks.length} shared block items → ${path.relative(REGISTRY_ROOT, BLOCKS_DEST)}/`
  );
}

module.exports = { buildBlocks };

if (require.main === module) {
  console.log('Building lovda block registry...\n');
  buildBlocks();
  console.log(`\n✔  Blocks built successfully!`);
  console.log(`   Output: ${BLOCKS_DEST}`);
}

'use strict';

/**
 * validate-registry-channel — prove a generated channel is self-contained.
 *
 * The CLI resolves `registryDependencies` as BARE NAMES against a single base URL, so a
 * channel is correct exactly when every reachable name exists inside that channel's root.
 * Nothing rewrites URLs, which means the only real failure modes are:
 *
 *   1. a dependency that does not exist in this channel (install would 404),
 *   2. an item that hardcodes a registry URL and would silently cross channels,
 *   3. a missing style/legacy/motion invariant.
 *
 * Run: node scripts/validate-registry-channel.cjs
 *      LOVDA_REGISTRY_CHANNEL=stable node scripts/validate-registry-channel.cjs
 */

const fs = require('fs-extra');
const path = require('path');
const registryChannel = require('./lib/registry-channel.cjs');

const ROOT = registryChannel.registryRoot();
const STYLES_ROOT = path.join(ROOT, 'styles');
const BLOCKS_ROOT = path.join(ROOT, 'blocks');
const ICONS_ROOT = path.join(ROOT, 'icons');

const errors = [];
const warnings = [];

function fail(message) {
  errors.push(message);
}

function listDirs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function listJson(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name.replace(/\.json$/, ''));
}

if (!fs.existsSync(ROOT)) {
  console.error(`Registry root does not exist: ${ROOT}`);
  process.exit(1);
}

const engines = listDirs(STYLES_ROOT);
const stylesByEngine = new Map();
for (const engine of engines) {
  stylesByEngine.set(engine, listDirs(path.join(STYLES_ROOT, engine)));
}

/** Names available for a given engine/style, mirroring the CLI's candidate order. */
function resolves(name, engine, style) {
  if (name === 'semantic-icon') {
    if (fs.existsSync(path.join(STYLES_ROOT, engine, style, 'semantic-icon.json'))) return true;
    for (const library of listDirs(path.join(ICONS_ROOT, engine))) {
      if (fs.existsSync(path.join(ICONS_ROOT, engine, library, 'semantic-icon.json'))) return true;
    }
    return false;
  }
  if (fs.existsSync(path.join(STYLES_ROOT, engine, style, `${name}.json`))) return true;
  if (fs.existsSync(path.join(BLOCKS_ROOT, style, `${name}.json`))) return true;
  if (fs.existsSync(path.join(BLOCKS_ROOT, `${name}.json`))) return true;
  return false;
}

/** Reject any hardcoded registry path that would escape this channel. */
function assertNoCrossChannelUrl(item, label) {
  const raw = JSON.stringify(item);
  const matches = raw.match(/https?:\/\/[^"\\]*\/r\/[^"\\]*/g);
  if (matches) {
    fail(`${label} hardcodes a registry URL: ${matches.slice(0, 3).join(', ')}`);
  }
}

let itemCount = 0;
let depCount = 0;

// ---------------------------------------------------------------------------
// Components, per engine and style
// ---------------------------------------------------------------------------
for (const engine of engines) {
  for (const style of stylesByEngine.get(engine)) {
    const dir = path.join(STYLES_ROOT, engine, style);
    for (const name of listJson(dir)) {
      const label = `styles/${engine}/${style}/${name}.json`;
      let item;
      try {
        item = fs.readJsonSync(path.join(dir, `${name}.json`));
      } catch (error) {
        fail(`${label} is not valid JSON: ${error.message}`);
        continue;
      }
      itemCount += 1;
      assertNoCrossChannelUrl(item, label);
      for (const dep of item.registryDependencies || []) {
        depCount += 1;
        if (!resolves(dep, engine, style)) {
          fail(`${label} depends on "${dep}", which does not exist in this channel`);
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Blocks. Path is engine-agnostic, so dependencies must resolve for every engine.
// ---------------------------------------------------------------------------
const blockStyles = listDirs(BLOCKS_ROOT);

function validateBlock(file, styleScopes) {
  const label = path.relative(ROOT, file).replace(/\\/g, '/');
  let item;
  try {
    item = fs.readJsonSync(file);
  } catch (error) {
    fail(`${label} is not valid JSON: ${error.message}`);
    return;
  }
  if (label.endsWith('index.json')) return;
  itemCount += 1;
  assertNoCrossChannelUrl(item, label);
  for (const dep of item.registryDependencies || []) {
    for (const engine of engines) {
      for (const style of styleScopes) {
        depCount += 1;
        if (!resolves(dep, engine, style)) {
          fail(`${label} depends on "${dep}", missing for ${engine}/${style}`);
        }
      }
    }
  }
}

for (const name of listJson(BLOCKS_ROOT)) {
  validateBlock(path.join(BLOCKS_ROOT, `${name}.json`), blockStyles.length ? blockStyles : ['vega']);
}
for (const style of blockStyles) {
  for (const name of listJson(path.join(BLOCKS_ROOT, style))) {
    validateBlock(path.join(BLOCKS_ROOT, style, `${name}.json`), [style]);
  }
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------
for (const engine of listDirs(ICONS_ROOT)) {
  for (const library of listDirs(path.join(ICONS_ROOT, engine))) {
    const file = path.join(ICONS_ROOT, engine, library, 'semantic-icon.json');
    if (!fs.existsSync(file)) {
      fail(`icons/${engine}/${library} has no semantic-icon.json`);
      continue;
    }
    itemCount += 1;
    assertNoCrossChannelUrl(fs.readJsonSync(file), `icons/${engine}/${library}/semantic-icon.json`);
  }
}

// ---------------------------------------------------------------------------
// Channel invariants
// ---------------------------------------------------------------------------
const designRoot = path.join(__dirname, '../design-system');
const catalog = fs.readJsonSync(path.join(designRoot, 'catalog.json'));
const aliases = fs.readJsonSync(path.join(designRoot, 'aliases.json'));
const activeStyles = catalog.styles.map((style) => style.name);
const legacyStyles = Object.keys(aliases.styles);

// Legacy compatibility metadata (`meta.legacy`, `meta.recipeStyle`) is a CURRENT invariant.
// A frozen historical channel predates it, so only the live channel is held to it — otherwise
// validating a frozen baseline would report drift it can never fix.
const enforceLegacyMeta = registryChannel.resolveChannel() === 'beta';

function reportLegacyProblem(message) {
  if (enforceLegacyMeta) fail(message);
  else warnings.push(`${message} (not enforced for a frozen channel)`);
}

for (const engine of engines) {
  const present = stylesByEngine.get(engine);
  for (const style of activeStyles) {
    if (!present.includes(style)) fail(`styles/${engine} is missing active style "${style}"`);
  }
  for (const style of legacyStyles) {
    if (!present.includes(style)) {
      warnings.push(`styles/${engine} has no legacy compatibility directory "${style}"`);
      continue;
    }
    const indexPath = path.join(STYLES_ROOT, engine, style, 'index.json');
    if (!fs.existsSync(indexPath)) {
      fail(`styles/${engine}/${style}/index.json is missing`);
      continue;
    }
    const meta = fs.readJsonSync(indexPath).meta || {};
    if (meta.legacy !== true) {
      reportLegacyProblem(`styles/${engine}/${style}/index.json should set meta.legacy = true`);
    }
    if (meta.recipeStyle !== aliases.styles[style].to) {
      reportLegacyProblem(
        `styles/${engine}/${style}/index.json should set meta.recipeStyle = "${aliases.styles[style].to}"`
      );
    }
  }
}

// Motion must ship its animation runtime wherever it exists.
for (const engine of engines) {
  for (const style of stylesByEngine.get(engine)) {
    const motionPath = path.join(STYLES_ROOT, engine, style, 'motion.json');
    if (!fs.existsSync(motionPath)) continue;
    const deps = fs.readJsonSync(motionPath).dependencies || [];
    for (const required of ['react-native-reanimated', 'react-native-worklets']) {
      if (!deps.includes(required)) {
        fail(`styles/${engine}/${style}/motion.json is missing dependency "${required}"`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
console.log(`   ${registryChannel.describe()}`);
console.log(`   root: ${ROOT}`);
console.log(`   engines: ${engines.join(', ') || 'none'}`);
console.log(`   items: ${itemCount}, dependency edges checked: ${depCount}`);

for (const warning of warnings) console.log(`   warning: ${warning}`);

if (errors.length > 0) {
  console.error(`\n${errors.length} registry problem(s):`);
  for (const error of errors.slice(0, 40)) console.error(`- ${error}`);
  if (errors.length > 40) console.error(`- …and ${errors.length - 40} more`);
  process.exit(1);
}

console.log('registry channel is self-contained');

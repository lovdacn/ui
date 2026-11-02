#!/usr/bin/env node
/**
 * Install check for the Expo test apps in tests/apps.
 *
 * For each app this script:
 *   1. copies the app to a temporary folder (the committed app is never modified),
 *   2. installs its dependencies with npm,
 *   3. adds every registry component with the LOCAL CLI and the LOCAL registry
 *      (packages/lovdacn/dist + apps/v2/public/r), overwriting existing files,
 *   4. type-checks the app with `tsc --noEmit`,
 *   5. bundles it for web with `expo export --platform web`.
 *
 * This catches components that break once copied into a real app: broken imports, missing
 * npm dependencies, type errors, and bundling errors, on every SDK / style-engine combination.
 *
 * Usage (from the repository root, after `pnpm install` and `pnpm --filter lovdacn build`):
 *   node tests/check-test-apps.mjs                      # every app in tests/apps
 *   node tests/check-test-apps.mjs nativewind-54        # one or more named apps
 *   node tests/check-test-apps.mjs --skip-export        # skip the web bundle step
 *   node tests/check-test-apps.mjs --keep               # keep the temp copies for debugging
 *
 * Needs network access (npm install, expo install). Exits 1 when any app fails.
 */
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APPS_DIR = path.join(REPO_ROOT, 'tests', 'apps');
const CLI = path.join(REPO_ROOT, 'packages', 'lovdacn', 'dist', 'index.js');
const ADD_SOURCE = path.join(REPO_ROOT, 'packages', 'lovdacn', 'src', 'commands', 'add.ts');
const REGISTRY = path.join(REPO_ROOT, 'apps', 'v2', 'public', 'r');

/** Folders that must never be copied into the temp app. */
const COPY_EXCLUDES = new Set(['node_modules', '.expo', 'dist', 'dist-web', 'web-build']);

function parseArgs(argv) {
  const options = { apps: [], skipExport: false, keep: false };
  for (const arg of argv) {
    if (arg === '--skip-export') options.skipExport = true;
    else if (arg === '--keep') options.keep = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg.startsWith('-')) throw new Error(`Unknown option: ${arg}`);
    else options.apps.push(arg);
  }
  return options;
}

/** Read a string-array constant from the CLI source, so the component list has one owner. */
function readStringList(source, pattern, label) {
  const match = source.match(pattern);
  if (!match) throw new Error(`Could not find ${label} in ${ADD_SOURCE}`);
  return [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
}

function loadComponentLists() {
  const source = readFileSync(ADD_SOURCE, 'utf8');
  const all = readStringList(source, /AVAILABLE_COMPONENTS\s*=\s*\[([\s\S]*?)\]/, 'AVAILABLE_COMPONENTS');
  const beta = new Set(
    readStringList(source, /BETA_COMPONENTS\s*=\s*new Set<string>\(\[([\s\S]*?)\]\)/, 'BETA_COMPONENTS')
  );
  return { all, beta };
}

function listApps() {
  return readdirSync(APPS_DIR)
    .filter((name) => statSync(path.join(APPS_DIR, name)).isDirectory())
    .filter((name) => existsSync(path.join(APPS_DIR, name, 'lvcn.json')))
    .sort();
}

/** Apps whose name contains "beta" install from the beta registry channel. */
function channelFor(app) {
  return app.includes('beta') ? 'beta' : 'stable';
}

function run(label, command, args, { cwd, env } = {}) {
  console.log(`\n$ ${[command, ...args].join(' ')}`);
  const result = spawnSync(command, args, {
    cwd,
    env: { ...process.env, CI: '1', ...env },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`${label} failed (exit code ${result.status})`);
}

function checkApp(app, components, options) {
  const channel = channelFor(app);
  const tmp = mkdtempSync(path.join(os.tmpdir(), `lvcn-${app}-`));
  const started = Date.now();
  console.log(`\n=== ${app} (${channel} channel) -> ${tmp}`);

  try {
    cpSync(path.join(APPS_DIR, app), tmp, {
      recursive: true,
      filter: (source) => !COPY_EXCLUDES.has(path.basename(source)),
    });

    run('npm install', 'npm', ['install', '--no-audit', '--no-fund', '--loglevel=error'], { cwd: tmp });

    const toAdd = channel === 'beta' ? components.all : components.all.filter((c) => !components.beta.has(c));
    const registry = channel === 'beta' ? path.join(REGISTRY, 'beta') : REGISTRY;
    run(
      'lovdacn add',
      process.execPath,
      [CLI, 'add', ...toAdd, '--yes', '--overwrite', '--cwd', tmp, '--package-manager', 'npm', '--channel', channel],
      { cwd: tmp, env: { LOVDA_REGISTRY_URL: registry } }
    );

    run('tsc', 'npx', ['--no-install', 'tsc', '--noEmit'], { cwd: tmp });

    if (!options.skipExport) {
      run('expo export', 'npx', ['--no-install', 'expo', 'export', '--platform', 'web', '--output-dir', 'dist-web'], {
        cwd: tmp,
      });
    }

    return { app, ok: true, seconds: (Date.now() - started) / 1000 };
  } catch (error) {
    return { app, ok: false, seconds: (Date.now() - started) / 1000, error: error.message, tmp };
  } finally {
    if (!options.keep) rmSync(tmp, { recursive: true, force: true });
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0]);
    return 0;
  }

  if (!existsSync(CLI)) {
    console.error(`CLI build not found at ${CLI}.\nRun: pnpm --filter lovdacn build`);
    return 1;
  }

  const available = listApps();
  const apps = options.apps.length > 0 ? options.apps : available;
  const unknown = apps.filter((app) => !available.includes(app));
  if (unknown.length > 0) {
    console.error(`Unknown test app(s): ${unknown.join(', ')}. Available: ${available.join(', ')}`);
    return 1;
  }

  const components = loadComponentLists();
  const results = apps.map((app) => checkApp(app, components, options));

  console.log('\n=== Summary');
  for (const result of results) {
    const status = result.ok ? 'PASS' : 'FAIL';
    console.log(`${status}  ${result.app}  (${result.seconds.toFixed(0)}s)${result.ok ? '' : `  ${result.error}`}`);
    if (!result.ok && options.keep) console.log(`      kept at ${result.tmp}`);
  }
  return results.every((result) => result.ok) ? 0 : 1;
}

process.exitCode = main();

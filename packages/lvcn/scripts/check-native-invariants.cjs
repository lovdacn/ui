#!/usr/bin/env node
'use strict';

/**
 * check-native-invariants — structural gate for generated registry output.
 *
 * Scans every generated component source in a channel and reports literals that
 * violate a native rendering contract. Run with `--strict` to exit non-zero.
 *
 *   node scripts/check-native-invariants.cjs
 *   node scripts/check-native-invariants.cjs --strict
 *
 * Contracts checked (see COMPONENT_ALIGNMENT_AND_STYLE_FIDELITY_PLAN.md):
 *
 *   resting-ring        NativeWind documents ring-width utilities as web-only.
 *                       A cross-platform literal must not carry a resting ring.
 *   fixed-height-clip   A text-bearing surface must not set a fixed height and
 *                       clip its overflow: content taller than the box is cut
 *                       instead of growing.
 *   web-only-state      focus-visible: / aria-invalid: / bg-clip-* / transition-*
 *                       are web selectors and belong in a Platform web branch.
 *   leading-none        Zero line-height clips glyphs under Android font metrics.
 *   text-on-view        Native has no View->Text cascade, so typography tokens on
 *                       a View host are dead classes.
 *   empty-cn-arg        Empty string arguments are generation residue.
 */

const fs = require('fs');
const path = require('path');
const registryChannel = require('./lib/registry-channel.cjs');

const STRICT = process.argv.includes('--strict');

const TEXT_TOKEN = /^(?:text-(?:xs|sm|base|lg|xl|\dxl)|font-(?:thin|light|normal|medium|semibold|bold|extrabold|black)|leading-|tracking-|italic|uppercase|lowercase|capitalize)/;

/** Components whose recipe legitimately owns a fixed visual box (no text inside). */
const FIXED_BOX_ALLOWED = new Set([
  'checkbox.json',
  'radio-group.json',
  'switch.json',
  'progress.json',
  'separator.json',
  'skeleton.json',
  'spinner.json',
  'avatar.json',
  'aspect-ratio.json',
]);

function tokenize(literal) {
  return literal.split(/\s+/).filter(Boolean);
}

function isRestingRing(cls) {
  const terminal = cls.split(':').at(-1);
  if (!terminal) return false;
  if (terminal === 'ring-0' || terminal.startsWith('ring-offset')) return false;
  const isRing = terminal === 'ring' || terminal.startsWith('ring-');
  if (!isRing) return false;
  // A ring scoped to a state or to web is intentional.
  return !/(?:^|:)(?:focus|focus-visible|focus-within|active|hover|aria-|data-|group-|web)/.test(cls);
}

function scanSource(fileName, content) {
  const findings = [];
  const lines = content.split('\n');

  // A `web:` value may span several lines, e.g. `web: cn(\n  '...',\n  '...'\n)`.
  // Track the indentation at which a web branch opened: every more-indented line
  // belongs to that branch until a sibling key (`native:`) or a shallower line
  // closes it. Without this, web-only classes inside a legitimate web branch are
  // reported as leaks.
  let webIndent = null;

  lines.forEach((line, index) => {
    const indent = line.search(/\S/);

    if (webIndent !== null && indent !== -1 && indent <= webIndent) {
      webIndent = null;
    }
    const opensWeb = /(?:^|[{,\s])web:/.test(line);
    const inWebBranch = webIndent !== null || opensWeb;
    if (opensWeb && !/web:\s*'[^']*'\s*,?\s*$/.test(line)) {
      webIndent = indent;
    }

    for (const match of line.matchAll(/'([^'\n]*)'/g)) {
      const literal = match[1];
      if (!literal || !/[a-z]-|^[a-z]+$/.test(literal)) continue;
      const classes = tokenize(literal);
      if (classes.length === 0) continue;

      const at = `line ${index + 1}`;

      if (!inWebBranch && classes.some(isRestingRing)) {
        findings.push({ rule: 'resting-ring', at, literal });
      }

      const hasClip = classes.some((c) => c.split(':').at(-1) === 'overflow-hidden');
      const fixedHeight = classes.find((c) => /^h-(?:\d|\[)/.test(c));
      if (hasClip && fixedHeight && !FIXED_BOX_ALLOWED.has(fileName)) {
        findings.push({ rule: 'fixed-height-clip', at, literal: fixedHeight + ' + overflow-hidden' });
      }

      // One native view cannot both cast an unclipped outer shadow and clip its
      // descendants; on Android the pairing also thins the border corner arcs.
      const shadow = classes.find((c) => {
        const terminal = c.split(':').at(-1);
        return terminal === 'shadow' || (terminal || '').startsWith('shadow-');
      });
      if (hasClip && shadow) {
        findings.push({ rule: 'shadow-plus-clip', at, literal: shadow + ' + overflow-hidden' });
      }

      if (!inWebBranch) {
        const webOnly = classes.filter(
          (c) =>
            c.startsWith('focus-visible:') ||
            c.startsWith('aria-invalid:') ||
            c.startsWith('dark:aria-invalid:') ||
            c.startsWith('bg-clip-') ||
            c === 'transition-all' ||
            c.startsWith('transition-[')
        );
        if (webOnly.length > 0) {
          findings.push({ rule: 'web-only-state', at, literal: webOnly.join(' ') });
        }
      }

      if (!inWebBranch && classes.includes('leading-none')) {
        findings.push({ rule: 'leading-none', at, literal: 'leading-none' });
      }
    }

    // Typography tokens handed to a View host cannot cascade on native.
    const viewClass = line.match(/<View[^>]*className=\{?cn\('([^']*)'/);
    if (viewClass) {
      const dead = tokenize(viewClass[1]).filter((c) => TEXT_TOKEN.test(c));
      if (dead.length > 0) {
        findings.push({ rule: 'text-on-view', at: `line ${index + 1}`, literal: dead.join(' ') });
      }
    }
  });

  if (content.includes("cn('',") || content.includes('cn("",')) {
    findings.push({ rule: 'empty-cn-arg', at: 'module', literal: "cn('', ...) residue" });
  }

  return findings;
}

function main() {
  const stylesRoot = path.join(registryChannel.registryRoot(), 'styles');
  if (!fs.existsSync(stylesRoot)) {
    console.error(`No generated styles at ${stylesRoot}`);
    process.exit(1);
  }

  const byRule = new Map();
  const byComponent = new Map();
  let scanned = 0;

  const dirs = (parent) =>
    fs
      .readdirSync(parent)
      .map((name) => path.join(parent, name))
      .filter((entry) => fs.statSync(entry).isDirectory());

  for (const engineDir of dirs(stylesRoot)) {
    for (const styleDir of dirs(engineDir)) {
      for (const entry of fs.readdirSync(styleDir)) {
        if (!entry.endsWith('.json') || entry === 'index.json') continue;
        const item = JSON.parse(fs.readFileSync(path.join(styleDir, entry), 'utf8'));
        for (const file of item.files || []) {
          if (!file.content) continue;
          scanned += 1;
          for (const finding of scanSource(entry, file.content)) {
            byRule.set(finding.rule, (byRule.get(finding.rule) || 0) + 1);
            const key = `${finding.rule}:${entry}`;
            if (!byComponent.has(key)) byComponent.set(key, new Set());
            byComponent.get(key).add(finding.literal);
          }
        }
      }
    }
  }

  console.log(`\nnative invariant scan — ${registryChannel.describe()}`);
  console.log(`generated sources scanned: ${scanned}\n`);

  if (byRule.size === 0) {
    console.log('  no violations\n');
    return;
  }

  for (const [rule, count] of [...byRule].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${rule.padEnd(20)} ${String(count).padStart(5)} occurrences`);
    const components = [...byComponent]
      .filter(([key]) => key.startsWith(`${rule}:`))
      .map(([key, values]) => `${key.split(':')[1]} (${[...values][0]})`);
    for (const component of components.slice(0, 6)) {
      console.log(`      ${component}`);
    }
    if (components.length > 6) console.log(`      ...and ${components.length - 6} more components`);
  }
  console.log('');

  if (STRICT) {
    console.error('native invariant check failed');
    process.exit(1);
  }
}

main();
